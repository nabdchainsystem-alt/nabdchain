/**
 * Job Queue Service
 *
 * Provides API for enqueueing and managing background jobs.
 * Jobs are persisted to the database and processed by the JobQueueWorker.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Job types enum
export enum JobType {
  // Payout jobs
  CREATE_PAYOUT = 'create_payout',
  PROCESS_PAYOUT = 'process_payout',
  GENERATE_PAYOUT_REPORT = 'generate_payout_report',

  // Automation jobs
  CHECK_SLA_BREACH = 'check_sla_breach',
  PROCESS_DELAYED_ORDER = 'process_delayed_order',
  CHECK_LOW_STOCK = 'check_low_stock',
  FLAG_SLOW_MOVING = 'flag_slow_moving',
  DAILY_AUTOMATION_SCAN = 'daily_automation_scan',

  // Trust jobs
  UPDATE_TRUST_SCORE = 'update_trust_score',
  UPDATE_HEALTH_SCORE = 'update_health_score',

  // Notification jobs
  SEND_EMAIL_NOTIFICATION = 'send_email_notification',
  SEND_PUSH_NOTIFICATION = 'send_push_notification',
  CHECK_UNREAD_RFQS = 'check_unread_rfqs',

  // Cleanup jobs
  CLEANUP_IDEMPOTENCY_KEYS = 'cleanup_idempotency_keys',
  CLEANUP_EXPIRED_TOKENS = 'cleanup_expired_tokens',
  CLEANUP_OLD_LOGS = 'cleanup_old_logs',

  // Analytics jobs
  GENERATE_ANALYTICS_REPORT = 'generate_analytics_report',
  RUN_ANOMALY_DETECTION = 'run_anomaly_detection',

  // Rate limiting
  RESET_DAILY_RATE_LIMITS = 'reset_daily_rate_limits',
}

// Priority levels (lower number = higher priority)
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 3,
  NORMAL = 5,
  LOW = 7,
  BACKGROUND = 9,
}

export interface EnqueueJobInput {
  jobType: JobType | string;
  payload?: Record<string, unknown>;
  jobName?: string;
  scheduledAt?: Date;
  priority?: JobPriority | number;
  maxAttempts?: number;
  correlationId?: string;
  createdBy?: string;
  tags?: string[];
}

export interface EnqueueJobResult {
  id: string;
  jobType: string;
  status: string;
  scheduledAt: Date;
}

export interface JobStatus {
  id: string;
  jobType: string;
  status: string;
  attempts: number;
  lastError: string | null;
  result: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface JobStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  dlq: number;
}

/**
 * Job Queue Service
 */
export const jobQueueService = {
  /**
   * Enqueue a single job
   */
  async enqueue(input: EnqueueJobInput): Promise<EnqueueJobResult> {
    const job = await prisma.jobQueue.create({
      data: {
        jobType: input.jobType,
        jobName: input.jobName || input.jobType,
        payload: JSON.stringify(input.payload || {}),
        scheduledAt: input.scheduledAt || new Date(),
        priority: input.priority ?? JobPriority.NORMAL,
        maxAttempts: input.maxAttempts || 3,
        correlationId: input.correlationId || null,
        createdBy: input.createdBy || null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
      },
    });

    return {
      id: job.id,
      jobType: job.jobType,
      status: job.status,
      scheduledAt: job.scheduledAt,
    };
  },

  /**
   * Enqueue a job to run after a delay
   */
  async enqueueDelayed(
    input: Omit<EnqueueJobInput, 'scheduledAt'>,
    delaySeconds: number
  ): Promise<EnqueueJobResult> {
    return this.enqueue({
      ...input,
      scheduledAt: new Date(Date.now() + delaySeconds * 1000),
    });
  },

  /**
   * Enqueue a batch of jobs atomically
   */
  async enqueueBatch(jobs: EnqueueJobInput[]): Promise<EnqueueJobResult[]> {
    const results = await prisma.$transaction(
      jobs.map((input) =>
        prisma.jobQueue.create({
          data: {
            jobType: input.jobType,
            jobName: input.jobName || input.jobType,
            payload: JSON.stringify(input.payload || {}),
            scheduledAt: input.scheduledAt || new Date(),
            priority: input.priority ?? JobPriority.NORMAL,
            maxAttempts: input.maxAttempts || 3,
            correlationId: input.correlationId || null,
            createdBy: input.createdBy || null,
            tags: input.tags ? JSON.stringify(input.tags) : null,
          },
        })
      )
    );

    return results.map((job) => ({
      id: job.id,
      jobType: job.jobType,
      status: job.status,
      scheduledAt: job.scheduledAt,
    }));
  },

  /**
   * Schedule next occurrence of a recurring job
   * Call this at the end of job execution to schedule the next run
   */
  async scheduleNextOccurrence(
    jobType: JobType | string,
    intervalSeconds: number,
    payload: Record<string, unknown> = {}
  ): Promise<EnqueueJobResult> {
    return this.enqueue({
      jobType,
      payload: { ...payload, scheduledRun: true },
      scheduledAt: new Date(Date.now() + intervalSeconds * 1000),
      priority: JobPriority.BACKGROUND,
    });
  },

  /**
   * Cancel a pending job
   */
  async cancel(jobId: string): Promise<boolean> {
    const result = await prisma.jobQueue.updateMany({
      where: {
        id: jobId,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
      },
    });

    return result.count > 0;
  },

  /**
   * Get job status
   */
  async getStatus(jobId: string): Promise<JobStatus | null> {
    const job = await prisma.jobQueue.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        jobType: true,
        status: true,
        attempts: true,
        lastError: true,
        result: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return job;
  },

  /**
   * Get queue statistics
   */
  async getStats(): Promise<JobStats> {
    const [pending, processing, completed, failed, dlq] = await Promise.all([
      prisma.jobQueue.count({ where: { status: 'pending' } }),
      prisma.jobQueue.count({ where: { status: 'processing' } }),
      prisma.jobQueue.count({ where: { status: 'completed' } }),
      prisma.jobQueue.count({ where: { status: 'failed' } }),
      prisma.jobQueueDLQ.count({ where: { resolvedAt: null } }),
    ]);

    return { pending, processing, completed, failed, dlq };
  },

  /**
   * Get jobs by type
   */
  async getJobsByType(
    jobType: JobType | string,
    options: { status?: string; limit?: number } = {}
  ) {
    const { status, limit = 50 } = options;

    return prisma.jobQueue.findMany({
      where: {
        jobType,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Requeue a job from DLQ
   */
  async requeueFromDLQ(dlqId: string): Promise<string | null> {
    const dlqItem = await prisma.jobQueueDLQ.findUnique({
      where: { id: dlqId },
    });

    if (!dlqItem || dlqItem.resolvedAt) return null;

    const result = await prisma.$transaction(async (tx) => {
      // Create new job
      const newJob = await tx.jobQueue.create({
        data: {
          jobType: dlqItem.jobType,
          jobName: dlqItem.jobName || dlqItem.jobType,
          payload: dlqItem.payload,
          priority: JobPriority.HIGH, // Higher priority for retried jobs
          maxAttempts: 3,
          correlationId: dlqItem.correlationId,
          createdBy: 'dlq_requeue',
        },
      });

      // Mark DLQ item as resolved
      await tx.jobQueueDLQ.update({
        where: { id: dlqId },
        data: {
          resolvedAt: new Date(),
          resolvedBy: 'system',
          resolution: 'requeued',
        },
      });

      return newJob.id;
    });

    return result;
  },

  /**
   * Get DLQ items for review
   */
  async getDLQItems(options: { limit?: number; offset?: number; jobType?: string } = {}) {
    const { limit = 50, offset = 0, jobType } = options;

    return prisma.jobQueueDLQ.findMany({
      where: {
        resolvedAt: null,
        ...(jobType ? { jobType } : {}),
      },
      orderBy: { failedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  },

  /**
   * Resolve a DLQ item
   */
  async resolveDLQItem(
    dlqId: string,
    resolvedBy: string,
    resolution: string,
    notes?: string
  ) {
    return prisma.jobQueueDLQ.update({
      where: { id: dlqId },
      data: {
        resolvedAt: new Date(),
        resolvedBy,
        resolution,
        notes: notes || null,
      },
    });
  },

  /**
   * Clean up old completed jobs (retention policy)
   */
  async cleanupOldJobs(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.jobQueue.deleteMany({
      where: {
        status: 'completed',
        completedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  },
};
