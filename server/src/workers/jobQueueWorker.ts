/**
 * Job Queue Worker
 *
 * Polls the JobQueue table and executes jobs with retry logic.
 * Implements exponential backoff and dead-letter queue for failed jobs.
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { serverLogger } from '../utils/logger';
import { JobType } from '../services/jobQueueService';
import { dbCircuitBreaker, isDbConnectionError } from '../lib/circuitBreaker';
import { getWorkerBackoffConfig } from '../config/runtimeFlags';

// Import job handlers
import { payoutJobHandler } from '../jobs/payoutJobHandler';
import { automationJobHandler } from '../jobs/automationJobHandler';
import { trustJobHandler } from '../jobs/trustJobHandler';
import { scaleSafetyJobHandler } from '../jobs/scaleSafetyJobHandler';

// Configuration (static values)
const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 1000; // 1 second
const LOCK_TIMEOUT_MS = 300000; // 5 minutes
const INITIAL_RETRY_DELAY_MS = 5000; // 5 seconds
const MAX_RETRY_DELAY_MS = 3600000; // 1 hour
const BACKOFF_MULTIPLIER = 2;

// Configurable backoff (from environment)
const getMaxPollInterval = () => getWorkerBackoffConfig().maxMs;

type JobHandler = (payload: any) => Promise<any>;

// Job handler registry - maps job types to their handler functions
const JOB_HANDLERS: Partial<Record<JobType | string, JobHandler>> = {
  // Payout jobs
  [JobType.CREATE_PAYOUT]: async (payload) => payoutJobHandler.createDailyPayouts(),
  [JobType.GENERATE_PAYOUT_REPORT]: async (payload) => payoutJobHandler.generateWeeklyReport(),

  // Automation jobs
  [JobType.CHECK_SLA_BREACH]: async (payload) => automationJobHandler.checkSLABreaches(),
  [JobType.PROCESS_DELAYED_ORDER]: async (payload) => automationJobHandler.processDelayedOrders(),
  [JobType.CHECK_LOW_STOCK]: async (payload) => automationJobHandler.checkLowStock(),
  [JobType.FLAG_SLOW_MOVING]: async (payload) => automationJobHandler.flagSlowMovingListings(),
  [JobType.DAILY_AUTOMATION_SCAN]: async (payload) => automationJobHandler.runDailyAutomationScan(),
  [JobType.CLEANUP_IDEMPOTENCY_KEYS]: async (payload) => automationJobHandler.cleanupExpiredIdempotencyKeys(),

  // Trust jobs
  [JobType.UPDATE_TRUST_SCORE]: async (payload) => trustJobHandler.updateStaleScores(),
  [JobType.UPDATE_HEALTH_SCORE]: async (payload) => trustJobHandler.updateHealthScores(),

  // Scale safety jobs
  [JobType.RUN_ANOMALY_DETECTION]: async (payload) => scaleSafetyJobHandler.runAnomalyDetection(),
  [JobType.RESET_DAILY_RATE_LIMITS]: async (payload) => scaleSafetyJobHandler.resetDailyRateLimits(),

  // Notification jobs - stubs until delivery handlers are wired up
  [JobType.SEND_EMAIL_NOTIFICATION]: async (payload) => {
    serverLogger.info('[JobQueueWorker] Email notification stub', payload);
    return { sent: true };
  },
  [JobType.SEND_PUSH_NOTIFICATION]: async (payload) => {
    serverLogger.info('[JobQueueWorker] Push notification stub', payload);
    return { sent: true };
  },
  [JobType.CHECK_UNREAD_RFQS]: async (payload) => automationJobHandler.checkUnreadRFQs(),

  // Cleanup jobs
  [JobType.CLEANUP_OLD_LOGS]: async (payload) => automationJobHandler.cleanupOldLogs(),
};

/**
 * Job Queue Worker Class
 * Manages the polling loop and job processing
 */
export class JobQueueWorker {
  private workerId: string;
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private processingCount = 0;

  constructor() {
    this.workerId = `worker-${uuidv4().slice(0, 8)}`;
  }

  /**
   * Start the worker polling loop
   */
  start(): void {
    if (this.isRunning) {
      serverLogger.warn(`[JobQueueWorker ${this.workerId}] Already running`);
      return;
    }

    this.isRunning = true;
    serverLogger.info(`[JobQueueWorker ${this.workerId}] Starting...`);
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

    serverLogger.info(`[JobQueueWorker ${this.workerId}] Stopped`);
  }

  /**
   * Check if worker is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get worker ID
   */
  getWorkerId(): string {
    return this.workerId;
  }

  /**
   * Main polling loop with circuit breaker
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    let nextPollInterval = POLL_INTERVAL_MS;
    const maxPollInterval = getMaxPollInterval();

    // Check circuit breaker before attempting DB operations
    if (!dbCircuitBreaker.canExecute()) {
      const backoff = dbCircuitBreaker.getBackoffMs();
      nextPollInterval = Math.min(backoff || maxPollInterval, maxPollInterval);
      // Only log occasionally to avoid spam (every 60 seconds)
      const status = dbCircuitBreaker.getStatus();
      if (status.consecutiveFailures % 60 === 1) {
        serverLogger.warn(
          `[JobQueueWorker ${this.workerId}] Circuit breaker OPEN, skipping poll. Will retry in ${Math.round(nextPollInterval / 1000)}s`
        );
      }
    } else {
      try {
        // Release stale locks first
        await this.releaseStaleLocks();

        // Process jobs
        await this.processJobs();
        dbCircuitBreaker.recordSuccess();
      } catch (error) {
        // Record DB connection errors in circuit breaker
        if (isDbConnectionError(error)) {
          dbCircuitBreaker.recordFailure(error as Error);
          nextPollInterval = Math.min(dbCircuitBreaker.getBackoffMs(), maxPollInterval);
          serverLogger.error(`[JobQueueWorker ${this.workerId}] Database connection error, backing off:`, error);
        } else {
          serverLogger.error(`[JobQueueWorker ${this.workerId}] Poll error:`, error);
        }
      }
    }

    // Schedule next poll
    this.pollTimer = setTimeout(() => this.poll(), nextPollInterval);
  }

  /**
   * Release jobs that have been locked too long (worker died)
   */
  private async releaseStaleLocks(): Promise<void> {
    const result = await prisma.jobQueue.updateMany({
      where: {
        status: 'processing',
        lockExpiresAt: { lt: new Date() },
      },
      data: {
        status: 'pending',
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
      },
    });

    if (result.count > 0) {
      serverLogger.warn(`[JobQueueWorker] Released ${result.count} stale locks`);
    }
  }

  /**
   * Process pending jobs
   */
  private async processJobs(): Promise<void> {
    // Fetch pending jobs that are ready to run
    const pendingJobs = await prisma.jobQueue.findMany({
      where: {
        status: { in: ['pending', 'failed'] },
        scheduledAt: { lte: new Date() },
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'asc' },
        { scheduledAt: 'asc' },
      ],
      take: BATCH_SIZE,
    });

    if (pendingJobs.length === 0) return;

    // Lock and process each job
    const lockExpiresAt = new Date(Date.now() + LOCK_TIMEOUT_MS);

    for (const job of pendingJobs) {
      // Try to lock the job atomically
      const locked = await prisma.jobQueue.updateMany({
        where: {
          id: job.id,
          status: { in: ['pending', 'failed'] },
          OR: [
            { lockedBy: null },
            { lockExpiresAt: { lt: new Date() } },
          ],
        },
        data: {
          status: 'processing',
          lockedBy: this.workerId,
          lockedAt: new Date(),
          lockExpiresAt,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          startedAt: job.startedAt || new Date(),
        },
      });

      // If we got the lock, process the job
      if (locked.count > 0) {
        this.processingCount++;
        // Process in background without blocking the loop
        this.processJob(job).finally(() => {
          this.processingCount--;
        });
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: any): Promise<void> {
    const startTime = Date.now();
    const handler = JOB_HANDLERS[job.jobType as JobType];

    // Get fresh job data with updated attempts
    const freshJob = await prisma.jobQueue.findUnique({
      where: { id: job.id },
    });

    if (!freshJob) return;

    const maxAttempts = freshJob.maxAttempts || 3;
    const attempts = freshJob.attempts;

    if (!handler) {
      await this.failJob(freshJob, 'Unknown job type', true);
      serverLogger.error(`[JobQueueWorker] Unknown job type: ${job.jobType}`);
      return;
    }

    try {
      const payload = JSON.parse(job.payload || '{}');
      const result = await handler(payload);

      // Mark completed
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          duration: Date.now() - startTime,
          result: result ? JSON.stringify(result) : null,
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
          lastError: null,
        },
      });

      serverLogger.info(
        `[JobQueueWorker ${this.workerId}] Completed: ${job.jobType} (${Date.now() - startTime}ms)`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      await this.failJob(freshJob, errorMessage, false, errorStack);
    }
  }

  /**
   * Handle job failure - retry or move to DLQ
   */
  private async failJob(
    job: any,
    error: string,
    permanent: boolean,
    errorStack?: string
  ): Promise<void> {
    const maxAttempts = job.maxAttempts || 3;
    const shouldDLQ = permanent || job.attempts >= maxAttempts;

    if (shouldDLQ) {
      // Move to DLQ
      await prisma.$transaction([
        prisma.jobQueueDLQ.create({
          data: {
            originalId: job.id,
            jobType: job.jobType,
            jobName: job.jobName,
            payload: job.payload,
            totalAttempts: job.attempts,
            lastError: error,
            errorStack: errorStack || null,
            failureReason: permanent ? 'permanent_failure' : 'max_retries_exceeded',
            originalCreatedAt: job.createdAt,
            scheduledAt: job.scheduledAt,
            correlationId: job.correlationId,
            createdBy: job.createdBy,
          },
        }),
        prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'dlq',
            lastError: error,
            errorStack: errorStack || null,
            lockedBy: null,
            lockedAt: null,
            lockExpiresAt: null,
          },
        }),
      ]);

      serverLogger.error(
        `[JobQueueWorker ${this.workerId}] DLQ: ${job.jobType} - ${error}`
      );
    } else {
      // Schedule retry with exponential backoff
      const delay = this.calculateBackoff(job.attempts);

      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          lastError: error,
          errorStack: errorStack || null,
          nextAttemptAt: new Date(Date.now() + delay),
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
        },
      });

      serverLogger.warn(
        `[JobQueueWorker ${this.workerId}] Retry: ${job.jobType} (attempt ${job.attempts}/${maxAttempts}) in ${Math.round(delay / 1000)}s`
      );
    }
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
export const jobQueueWorker = new JobQueueWorker();
