/**
 * BullMQ Job Queue
 * Redis-backed job queue for reliable background processing.
 * Falls back to DB-polled queue if Redis is unavailable.
 *
 * Set REDIS_URL or UPSTASH_REDIS_URL to enable.
 */
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { serverLogger } from '../utils/logger';

let connection: Redis | null = null;
let jobQueue: Queue | null = null;
let jobWorker: Worker | null = null;
let isEnabled = false;

export type BullJobHandler = (job: Job) => Promise<unknown>;

const handlers = new Map<string, BullJobHandler>();

/**
 * Initialize BullMQ with Redis connection.
 * Returns true if Redis queue is available, false to use DB fallback.
 */
export function initBullMQ(): boolean {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

  if (!redisUrl) {
    serverLogger.info('BullMQ: No REDIS_URL configured — using DB-polled job queue');
    return false;
  }

  try {
    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
      lazyConnect: true,
    });

    connection.on('error', (err) => {
      serverLogger.error('BullMQ Redis connection error:', err);
    });

    connection.connect().then(() => {
      if (!connection) return;
      jobQueue = new Queue('nabd-jobs', { connection });

      jobWorker = new Worker(
        'nabd-jobs',
        async (job: Job) => {
          const handler = handlers.get(job.name);
          if (!handler) {
            serverLogger.warn(`BullMQ: No handler registered for job type: ${job.name}`);
            return;
          }
          return handler(job);
        },
        {
          connection: connection!,
          concurrency: 10,
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      );

      jobWorker.on('completed', (job) => {
        serverLogger.info(`BullMQ: Job ${job.id} (${job.name}) completed`);
      });

      jobWorker.on('failed', (job, err) => {
        serverLogger.error(`BullMQ: Job ${job?.id} (${job?.name}) failed:`, err);
      });

      isEnabled = true;
      serverLogger.info('BullMQ: Redis-backed job queue initialized');
    }).catch((err) => {
      serverLogger.error('BullMQ: Failed to connect to Redis, falling back to DB queue:', err);
    });

    return true;
  } catch (err) {
    serverLogger.error('BullMQ: Initialization failed:', err);
    return false;
  }
}

/**
 * Register a job handler for a specific job type.
 */
export function registerJobHandler(jobType: string, handler: BullJobHandler): void {
  handlers.set(jobType, handler);
}

/**
 * Add a job to the queue.
 * Returns true if the job was queued via BullMQ, false if caller should use DB fallback.
 */
export async function addJob(
  jobType: string,
  payload: Record<string, unknown>,
  options?: { delay?: number; attempts?: number; priority?: number },
): Promise<boolean> {
  if (!isEnabled || !jobQueue) return false;

  try {
    await jobQueue.add(jobType, payload, {
      delay: options?.delay,
      attempts: options?.attempts || 3,
      backoff: { type: 'exponential', delay: 5000 },
      priority: options?.priority,
      removeOnComplete: true,
    });
    return true;
  } catch (err) {
    serverLogger.error('BullMQ: Failed to add job, falling back to DB:', err);
    return false;
  }
}

/**
 * Check if BullMQ is active (Redis connected).
 */
export function isBullMQEnabled(): boolean {
  return isEnabled;
}

/**
 * Graceful shutdown.
 */
export async function shutdownBullMQ(): Promise<void> {
  if (jobWorker) {
    await jobWorker.close();
    serverLogger.info('BullMQ: Worker stopped');
  }
  if (jobQueue) {
    await jobQueue.close();
  }
  if (connection) {
    await connection.quit();
  }
}
