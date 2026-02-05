/**
 * Event Outbox Worker
 *
 * Polls the EventOutbox table and delivers events to external systems.
 * Implements exponential backoff retry with dead-letter queue for failed events.
 */

import { prisma } from '../lib/prisma';
import { serverLogger } from '../utils/logger';

// Configuration
const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 5000; // 5 seconds
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const MAX_RETRY_DELAY_MS = 300000; // 5 minutes
const BACKOFF_MULTIPLIER = 2;
const DEFAULT_MAX_ATTEMPTS = 5;
const WEBHOOK_TIMEOUT_MS = 30000; // 30 seconds

interface DeliveryResult {
  success: boolean;
  error?: string;
  permanent?: boolean; // If true, don't retry - move to DLQ immediately
}

/**
 * Event Outbox Worker Class
 * Manages the polling loop and event processing
 */
export class EventOutboxWorker {
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private processingCount = 0;

  /**
   * Start the worker polling loop
   */
  start(): void {
    if (this.isRunning) {
      serverLogger.warn('[EventOutboxWorker] Already running');
      return;
    }

    this.isRunning = true;
    serverLogger.info('[EventOutboxWorker] Starting...');
    this.poll();
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    // Wait for in-flight processing to complete (max 30 seconds)
    const maxWait = 30000;
    const startTime = Date.now();
    while (this.processingCount > 0 && Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    serverLogger.info('[EventOutboxWorker] Stopped');
  }

  /**
   * Check if worker is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Main polling loop
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.processEvents();
    } catch (error) {
      serverLogger.error('[EventOutboxWorker] Poll error:', error);
    }

    // Schedule next poll
    this.pollTimer = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
  }

  /**
   * Process pending events in batch
   */
  private async processEvents(): Promise<void> {
    // Fetch pending events ready for processing
    const events = await prisma.eventOutbox.findMany({
      where: {
        status: { in: ['pending', 'failed'] },
        nextAttemptAt: { lte: new Date() },
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      take: BATCH_SIZE,
    });

    if (events.length === 0) return;

    serverLogger.info(`[EventOutboxWorker] Processing ${events.length} events`);

    // Process events concurrently
    this.processingCount += events.length;
    try {
      await Promise.all(events.map((event) => this.processEvent(event)));
    } finally {
      this.processingCount -= events.length;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: any): Promise<void> {
    const startTime = Date.now();
    const maxAttempts = event.maxAttempts || DEFAULT_MAX_ATTEMPTS;

    try {
      // Mark as processing (optimistic lock)
      const updated = await prisma.eventOutbox.updateMany({
        where: {
          id: event.id,
          status: { in: ['pending', 'failed'] },
        },
        data: {
          status: 'processing',
          lastAttemptAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      // If no rows updated, another worker grabbed it
      if (updated.count === 0) return;

      // Get updated attempt count
      const currentEvent = await prisma.eventOutbox.findUnique({
        where: { id: event.id },
        select: { attempts: true },
      });
      const attempts = currentEvent?.attempts || event.attempts + 1;

      // Deliver based on destination type
      const result = await this.deliver(event);

      if (result.success) {
        // Mark as delivered
        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: {
            status: 'delivered',
            processedAt: new Date(),
            lastError: null,
          },
        });

        serverLogger.info(
          `[EventOutboxWorker] Delivered: ${event.eventType} -> ${event.destination} (${Date.now() - startTime}ms)`
        );
      } else if (result.permanent || attempts >= maxAttempts) {
        // Move to DLQ
        await this.moveToDLQ(
          event,
          result.error || 'Unknown error',
          result.permanent ? 'permanent_failure' : 'max_retries_exceeded'
        );
      } else {
        // Schedule retry with exponential backoff
        const delay = this.calculateBackoff(attempts);

        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: {
            status: 'failed',
            lastError: result.error,
            nextAttemptAt: new Date(Date.now() + delay),
          },
        });

        serverLogger.warn(
          `[EventOutboxWorker] Retry scheduled: ${event.eventType} (attempt ${attempts}/${maxAttempts}) in ${Math.round(delay / 1000)}s`
        );
      }
    } catch (error) {
      serverLogger.error(`[EventOutboxWorker] Processing error for ${event.id}:`, error);

      // Revert to failed on unexpected error
      await prisma.eventOutbox
        .update({
          where: { id: event.id },
          data: {
            status: 'failed',
            lastError: error instanceof Error ? error.message : String(error),
          },
        })
        .catch(() => {}); // Ignore update errors
    }
  }

  /**
   * Deliver event to destination
   */
  private async deliver(event: any): Promise<DeliveryResult> {
    const payload = JSON.parse(event.payload);

    switch (event.destination) {
      case 'webhook':
        return this.deliverWebhook(event.destinationUrl, event.eventType, payload);

      case 'email':
        return this.deliverEmail(event.destinationUrl, event.eventType, payload);

      case 'sms':
        return this.deliverSMS(event.destinationUrl, payload);

      case 'payment_gateway':
        return this.deliverPaymentGateway(event.eventType, payload);

      case 'analytics':
        return this.deliverAnalytics(event.eventType, payload);

      case 'notification':
        return this.deliverNotification(event.eventType, payload);

      default:
        return {
          success: false,
          error: `Unknown destination: ${event.destination}`,
          permanent: true,
        };
    }
  }

  /**
   * Deliver via webhook (HTTP POST)
   */
  private async deliverWebhook(
    url: string | null,
    eventType: string,
    payload: any
  ): Promise<DeliveryResult> {
    if (!url) {
      return { success: false, error: 'No webhook URL configured', permanent: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Type': eventType,
          'X-Timestamp': new Date().toISOString(),
        },
        body: JSON.stringify({
          eventType,
          payload,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true };
      }

      // 4xx errors are permanent (bad request, unauthorized, not found, etc.)
      const permanent = response.status >= 400 && response.status < 500;
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        permanent,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Deliver via email
   * TODO: Integrate with email service (SendGrid, SES, etc.)
   */
  private async deliverEmail(
    to: string | null,
    eventType: string,
    payload: any
  ): Promise<DeliveryResult> {
    if (!to) {
      return { success: false, error: 'No email address configured', permanent: true };
    }

    // TODO: Implement actual email delivery
    serverLogger.info(`[EventOutboxWorker] Email delivery stub: ${eventType} -> ${to}`);
    return { success: true };
  }

  /**
   * Deliver via SMS
   * TODO: Integrate with SMS service (Twilio, etc.)
   */
  private async deliverSMS(phone: string | null, payload: any): Promise<DeliveryResult> {
    if (!phone) {
      return { success: false, error: 'No phone number configured', permanent: true };
    }

    // TODO: Implement actual SMS delivery
    serverLogger.info(`[EventOutboxWorker] SMS delivery stub: -> ${phone}`);
    return { success: true };
  }

  /**
   * Deliver to payment gateway
   * TODO: Integrate with payment gateway
   */
  private async deliverPaymentGateway(eventType: string, payload: any): Promise<DeliveryResult> {
    // TODO: Implement payment gateway integration
    serverLogger.info(`[EventOutboxWorker] Payment gateway stub: ${eventType}`);
    return { success: true };
  }

  /**
   * Deliver to analytics service
   * TODO: Integrate with analytics (Mixpanel, Amplitude, etc.)
   */
  private async deliverAnalytics(eventType: string, payload: any): Promise<DeliveryResult> {
    // TODO: Implement analytics integration
    serverLogger.info(`[EventOutboxWorker] Analytics stub: ${eventType}`);
    return { success: true };
  }

  /**
   * Deliver as internal notification
   * Uses the existing notification service
   */
  private async deliverNotification(eventType: string, payload: any): Promise<DeliveryResult> {
    try {
      // TODO: Integrate with portalNotificationService
      serverLogger.info(`[EventOutboxWorker] Notification delivery: ${eventType}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification error',
      };
    }
  }

  /**
   * Move failed event to Dead Letter Queue
   */
  private async moveToDLQ(event: any, error: string, reason: string): Promise<void> {
    await prisma.$transaction([
      prisma.eventOutboxDLQ.create({
        data: {
          originalId: event.id,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          destination: event.destination,
          destinationUrl: event.destinationUrl,
          totalAttempts: event.attempts,
          lastError: error,
          failureReason: reason,
          createdAt: event.createdAt,
        },
      }),
      prisma.eventOutbox.update({
        where: { id: event.id },
        data: { status: 'dlq' },
      }),
    ]);

    serverLogger.warn(`[EventOutboxWorker] Moved to DLQ: ${event.eventType} (${reason})`);
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoff(attempt: number): number {
    const delay = INITIAL_RETRY_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
    // Add jitter (10% randomness)
    const jitter = delay * 0.1 * Math.random();
    return Math.min(delay + jitter, MAX_RETRY_DELAY_MS);
  }
}

// Export singleton instance
export const eventOutboxWorker = new EventOutboxWorker();
