/**
 * Runtime Flags Configuration
 * Single source of truth for all feature flags and runtime configuration.
 *
 * Environment variables take precedence over defaults.
 * Defaults differ based on NODE_ENV:
 *   - Development: workers/scheduler disabled for clean local dev
 *   - Production: workers/scheduler enabled
 */

const isProduction = process.env.NODE_ENV === 'production';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse a boolean environment variable.
 * Supports 'true', '1', 'yes' as truthy; 'false', '0', 'no' as falsy.
 * Returns defaultValue if not set or unrecognized.
 */
function parseBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]?.toLowerCase();

  if (value === 'true' || value === '1' || value === 'yes') {
    return true;
  }
  if (value === 'false' || value === '0' || value === 'no') {
    return false;
  }

  return defaultValue;
}

/**
 * Parse a numeric environment variable.
 */
function parseIntEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// =============================================================================
// Runtime Flags
// =============================================================================

export const runtimeFlags = {
  // ---------------------------------------------------------------------------
  // Background Scheduler (cron-based jobs)
  // ---------------------------------------------------------------------------
  /** Enable the cron scheduler for scheduled jobs */
  ENABLE_SCHEDULER: parseBooleanEnv('ENABLE_SCHEDULER', isProduction),

  // ---------------------------------------------------------------------------
  // Background Workers
  // ---------------------------------------------------------------------------
  /** Master switch for all background workers */
  ENABLE_WORKERS: parseBooleanEnv('ENABLE_WORKERS', isProduction),

  /** Enable the event outbox worker (webhook delivery) */
  ENABLE_EVENT_OUTBOX_WORKER: parseBooleanEnv('ENABLE_EVENT_OUTBOX_WORKER',
    parseBooleanEnv('ENABLE_OUTBOX', isProduction)), // Fallback to ENABLE_OUTBOX for compatibility

  /** Enable the job queue worker (async job processing) */
  ENABLE_JOB_QUEUE_WORKER: parseBooleanEnv('ENABLE_JOB_QUEUE_WORKER', isProduction),

  /** Require DB connection before starting workers */
  DB_REQUIRED_FOR_WORKERS: parseBooleanEnv('DB_REQUIRED_FOR_WORKERS', true),

  // ---------------------------------------------------------------------------
  // Worker Backoff Configuration
  // ---------------------------------------------------------------------------
  /** Initial backoff delay when DB is down (ms) */
  WORKER_BACKOFF_MS: parseIntEnv('WORKER_BACKOFF_MS', 5000),

  /** Maximum backoff delay (ms) */
  WORKER_MAX_BACKOFF_MS: parseIntEnv('WORKER_MAX_BACKOFF_MS', 60000),

  // ---------------------------------------------------------------------------
  // Circuit Breaker Configuration
  // ---------------------------------------------------------------------------
  /** Number of failures before circuit opens */
  CIRCUIT_FAILURE_THRESHOLD: parseIntEnv('CIRCUIT_FAILURE_THRESHOLD', 3),

  /** Time before circuit attempts to close (ms) */
  CIRCUIT_RESET_TIMEOUT_MS: parseIntEnv('CIRCUIT_RESET_TIMEOUT_MS', 60000),

  // ---------------------------------------------------------------------------
  // Environment Info
  // ---------------------------------------------------------------------------
  /** Whether we're in production */
  IS_PRODUCTION: isProduction,

  /** Whether we're in development */
  IS_DEVELOPMENT: !isProduction,
} as const;

// =============================================================================
// Convenience Accessors
// =============================================================================

/** Whether the scheduler should run */
export function isSchedulerEnabled(): boolean {
  return runtimeFlags.ENABLE_SCHEDULER;
}

/** Whether workers should run (master switch) */
export function isWorkersEnabled(): boolean {
  return runtimeFlags.ENABLE_WORKERS;
}

/** Whether the event outbox worker should run */
export function isEventOutboxWorkerEnabled(): boolean {
  return runtimeFlags.ENABLE_WORKERS && runtimeFlags.ENABLE_EVENT_OUTBOX_WORKER;
}

/** Whether the job queue worker should run */
export function isJobQueueWorkerEnabled(): boolean {
  return runtimeFlags.ENABLE_WORKERS && runtimeFlags.ENABLE_JOB_QUEUE_WORKER;
}

/** Get a summary of all feature flags for logging */
export function getFeatureFlags(): Record<string, boolean | number> {
  return {
    scheduler: runtimeFlags.ENABLE_SCHEDULER,
    workers: runtimeFlags.ENABLE_WORKERS,
    eventOutboxWorker: runtimeFlags.ENABLE_EVENT_OUTBOX_WORKER,
    jobQueueWorker: runtimeFlags.ENABLE_JOB_QUEUE_WORKER,
    dbRequiredForWorkers: runtimeFlags.DB_REQUIRED_FOR_WORKERS,
    workerBackoffMs: runtimeFlags.WORKER_BACKOFF_MS,
    workerMaxBackoffMs: runtimeFlags.WORKER_MAX_BACKOFF_MS,
  };
}

/** Get worker backoff configuration */
export function getWorkerBackoffConfig() {
  return {
    initialMs: runtimeFlags.WORKER_BACKOFF_MS,
    maxMs: runtimeFlags.WORKER_MAX_BACKOFF_MS,
  };
}

/** Get circuit breaker configuration */
export function getCircuitBreakerConfig() {
  return {
    failureThreshold: runtimeFlags.CIRCUIT_FAILURE_THRESHOLD,
    resetTimeoutMs: runtimeFlags.CIRCUIT_RESET_TIMEOUT_MS,
  };
}

export default runtimeFlags;
