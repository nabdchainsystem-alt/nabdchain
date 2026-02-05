/**
 * Event Outbox Service
 *
 * Provides API for enqueueing events to the outbox for guaranteed delivery.
 * Uses the transactional outbox pattern - events are written to the database
 * in the same transaction as the business operation, then delivered asynchronously.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Event types enum for type safety
export enum EventType {
  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_PROCESSING = 'order.processing',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_RETURNED = 'order.returned',

  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Invoice events
  INVOICE_CREATED = 'invoice.created',
  INVOICE_SENT = 'invoice.sent',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_OVERDUE = 'invoice.overdue',
  INVOICE_CANCELLED = 'invoice.cancelled',

  // Payout events
  PAYOUT_INITIATED = 'payout.initiated',
  PAYOUT_PROCESSING = 'payout.processing',
  PAYOUT_COMPLETED = 'payout.completed',
  PAYOUT_FAILED = 'payout.failed',

  // Dispute events
  DISPUTE_OPENED = 'dispute.opened',
  DISPUTE_UPDATED = 'dispute.updated',
  DISPUTE_RESOLVED = 'dispute.resolved',
  DISPUTE_ESCALATED = 'dispute.escalated',

  // RFQ events
  RFQ_CREATED = 'rfq.created',
  RFQ_QUOTED = 'rfq.quoted',
  RFQ_ACCEPTED = 'rfq.accepted',
  RFQ_REJECTED = 'rfq.rejected',
  RFQ_EXPIRED = 'rfq.expired',

  // Quote events
  QUOTE_SENT = 'quote.sent',
  QUOTE_ACCEPTED = 'quote.accepted',
  QUOTE_REJECTED = 'quote.rejected',
  QUOTE_EXPIRED = 'quote.expired',

  // Inventory events
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_OUT_OF_STOCK = 'inventory.out_of_stock',
  INVENTORY_RESTOCKED = 'inventory.restocked',

  // Trust events
  TRUST_SCORE_CHANGED = 'trust.score_changed',
  SELLER_VERIFIED = 'seller.verified',
  SELLER_SUSPENDED = 'seller.suspended',
}

export type Destination = 'webhook' | 'email' | 'sms' | 'payment_gateway' | 'analytics' | 'notification';

export type AggregateType = 'order' | 'payment' | 'invoice' | 'payout' | 'dispute' | 'rfq' | 'quote' | 'item' | 'seller' | 'buyer';

export interface EnqueueEventInput {
  eventType: EventType | string;
  aggregateType: AggregateType | string;
  aggregateId: string;
  payload: Record<string, unknown>;
  destination: Destination;
  destinationUrl?: string;
  correlationId?: string;
  causationId?: string;
  delaySeconds?: number;
  maxAttempts?: number;
}

export interface EnqueueEventResult {
  id: string;
  eventType: string;
  status: string;
}

/**
 * Event Outbox Service
 * Handles enqueueing events for guaranteed delivery
 */
export const eventOutboxService = {
  /**
   * Enqueue a single event for guaranteed delivery
   */
  async enqueue(input: EnqueueEventInput): Promise<EnqueueEventResult> {
    const nextAttemptAt = input.delaySeconds
      ? new Date(Date.now() + input.delaySeconds * 1000)
      : new Date();

    const event = await prisma.eventOutbox.create({
      data: {
        eventType: input.eventType,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        payload: JSON.stringify(input.payload),
        destination: input.destination,
        destinationUrl: input.destinationUrl || null,
        correlationId: input.correlationId || null,
        causationId: input.causationId || null,
        partitionKey: input.aggregateId,
        maxAttempts: input.maxAttempts || 5,
        nextAttemptAt,
      },
    });

    return {
      id: event.id,
      eventType: event.eventType,
      status: event.status,
    };
  },

  /**
   * Create event data for use within a Prisma transaction
   * Returns the data object to be used with tx.eventOutbox.create()
   */
  createEventData(input: EnqueueEventInput): Prisma.EventOutboxCreateInput {
    const nextAttemptAt = input.delaySeconds
      ? new Date(Date.now() + input.delaySeconds * 1000)
      : new Date();

    return {
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: JSON.stringify(input.payload),
      destination: input.destination,
      destinationUrl: input.destinationUrl || null,
      correlationId: input.correlationId || null,
      causationId: input.causationId || null,
      partitionKey: input.aggregateId,
      maxAttempts: input.maxAttempts || 5,
      nextAttemptAt,
    };
  },

  /**
   * Enqueue event within an existing transaction
   * Use this when you need to ensure the event is created atomically with other operations
   */
  async enqueueInTransaction(
    tx: Prisma.TransactionClient,
    input: EnqueueEventInput
  ): Promise<EnqueueEventResult> {
    const data = this.createEventData(input);

    const event = await tx.eventOutbox.create({ data });

    return {
      id: event.id,
      eventType: event.eventType,
      status: event.status,
    };
  },

  /**
   * Enqueue multiple events to different destinations for the same aggregate
   */
  async enqueueMultiDestination(
    eventType: EventType | string,
    aggregateType: AggregateType | string,
    aggregateId: string,
    payload: Record<string, unknown>,
    destinations: Array<{ destination: Destination; url?: string }>
  ): Promise<EnqueueEventResult[]> {
    const results: EnqueueEventResult[] = [];

    for (const dest of destinations) {
      const result = await this.enqueue({
        eventType,
        aggregateType,
        aggregateId,
        payload,
        destination: dest.destination,
        destinationUrl: dest.url,
      });
      results.push(result);
    }

    return results;
  },

  /**
   * Enqueue a batch of events atomically
   */
  async enqueueBatch(events: EnqueueEventInput[]): Promise<EnqueueEventResult[]> {
    const results = await prisma.$transaction(
      events.map((input) =>
        prisma.eventOutbox.create({
          data: this.createEventData(input),
        })
      )
    );

    return results.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      status: event.status,
    }));
  },

  /**
   * Get event status
   */
  async getStatus(eventId: string) {
    return prisma.eventOutbox.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventType: true,
        status: true,
        attempts: true,
        lastError: true,
        processedAt: true,
        createdAt: true,
      },
    });
  },

  /**
   * Get outbox statistics
   */
  async getStats() {
    const [pending, processing, delivered, failed, dlq] = await Promise.all([
      prisma.eventOutbox.count({ where: { status: 'pending' } }),
      prisma.eventOutbox.count({ where: { status: 'processing' } }),
      prisma.eventOutbox.count({ where: { status: 'delivered' } }),
      prisma.eventOutbox.count({ where: { status: 'failed' } }),
      prisma.eventOutboxDLQ.count({ where: { resolvedAt: null } }),
    ]);

    return { pending, processing, delivered, failed, dlq };
  },

  /**
   * Requeue an event from DLQ
   */
  async requeueFromDLQ(dlqId: string): Promise<string | null> {
    const dlqItem = await prisma.eventOutboxDLQ.findUnique({
      where: { id: dlqId },
    });

    if (!dlqItem || dlqItem.resolvedAt) return null;

    const result = await prisma.$transaction(async (tx) => {
      // Create new outbox entry
      const newEvent = await tx.eventOutbox.create({
        data: {
          eventType: dlqItem.eventType,
          aggregateType: dlqItem.aggregateType,
          aggregateId: dlqItem.aggregateId,
          payload: dlqItem.payload,
          destination: dlqItem.destination,
          destinationUrl: dlqItem.destinationUrl,
          maxAttempts: 5,
          nextAttemptAt: new Date(),
        },
      });

      // Mark DLQ item as resolved
      await tx.eventOutboxDLQ.update({
        where: { id: dlqId },
        data: {
          resolvedAt: new Date(),
          resolvedBy: 'system',
          resolution: 'requeued',
        },
      });

      return newEvent.id;
    });

    return result;
  },

  /**
   * Get DLQ items for review
   */
  async getDLQItems(options: { limit?: number; offset?: number; eventType?: string } = {}) {
    const { limit = 50, offset = 0, eventType } = options;

    return prisma.eventOutboxDLQ.findMany({
      where: {
        resolvedAt: null,
        ...(eventType ? { eventType } : {}),
      },
      orderBy: { failedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  },

  /**
   * Resolve a DLQ item (mark as skipped)
   */
  async resolveDLQItem(dlqId: string, resolvedBy: string, resolution: string, notes?: string) {
    return prisma.eventOutboxDLQ.update({
      where: { id: dlqId },
      data: {
        resolvedAt: new Date(),
        resolvedBy,
        resolution,
      },
    });
  },
};
