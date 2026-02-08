// =============================================================================
// Job Scheduler - Stage 8: Automation, Payouts & Scale
// =============================================================================

import cron, { ScheduledTask } from 'node-cron';
import { payoutJobHandler } from './payoutJobHandler';
import { automationJobHandler } from './automationJobHandler';
import { trustJobHandler } from './trustJobHandler';
import { scaleSafetyJobHandler } from './scaleSafetyJobHandler';
import { jobLog } from '../services/observability/structuredLogger';

// =============================================================================
// Types
// =============================================================================

interface ScheduledJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  task?: ScheduledTask;
  enabled: boolean;
}

// =============================================================================
// Job Registry
// =============================================================================

const jobs: ScheduledJob[] = [
  // Daily 2 AM: Create batch payouts
  {
    name: 'create-daily-payouts',
    schedule: '0 2 * * *',
    handler: payoutJobHandler.createDailyPayouts,
    enabled: true,
  },
  // Every 5 minutes: Check SLA breaches for automation triggers
  {
    name: 'check-sla-breaches',
    schedule: '*/5 * * * *',
    handler: automationJobHandler.checkSLABreaches,
    enabled: true,
  },
  // Every 15 minutes: Process delayed order automations
  {
    name: 'process-delayed-orders',
    schedule: '*/15 * * * *',
    handler: automationJobHandler.processDelayedOrders,
    enabled: true,
  },
  // Hourly: Update stale trust scores
  {
    name: 'update-trust-scores',
    schedule: '0 * * * *',
    handler: trustJobHandler.updateStaleScores,
    enabled: true,
  },
  // Every 30 minutes: Update seller health scores
  {
    name: 'update-health-scores',
    schedule: '*/30 * * * *',
    handler: trustJobHandler.updateHealthScores,
    enabled: true,
  },
  // Daily 3 AM: Anomaly detection
  {
    name: 'run-anomaly-detection',
    schedule: '0 3 * * *',
    handler: scaleSafetyJobHandler.runAnomalyDetection,
    enabled: true,
  },
  // Daily 4 AM: Reset daily rate limits
  {
    name: 'reset-daily-rate-limits',
    schedule: '0 4 * * *',
    handler: scaleSafetyJobHandler.resetDailyRateLimits,
    enabled: true,
  },
  // Weekly Sunday 5 AM: Generate payout reports
  {
    name: 'generate-weekly-payout-report',
    schedule: '0 5 * * 0',
    handler: payoutJobHandler.generateWeeklyReport,
    enabled: true,
  },
  // Every hour: Check for low stock items
  {
    name: 'check-low-stock',
    schedule: '0 * * * *',
    handler: automationJobHandler.checkLowStock,
    enabled: true,
  },
  // Every 30 minutes: Check for unread RFQs
  {
    name: 'check-unread-rfqs',
    schedule: '*/30 * * * *',
    handler: automationJobHandler.checkUnreadRFQs,
    enabled: true,
  },
  // Daily 1 AM: Flag slow-moving listings
  {
    name: 'flag-slow-moving-listings',
    schedule: '0 1 * * *',
    handler: automationJobHandler.flagSlowMovingListings,
    enabled: true,
  },
  // Daily 6 AM: Clean up old execution logs (keep 90 days)
  {
    name: 'cleanup-old-logs',
    schedule: '0 6 * * *',
    handler: automationJobHandler.cleanupOldLogs,
    enabled: true,
  },
  // Daily 7 AM: Comprehensive daily automation scan
  {
    name: 'daily-automation-scan',
    schedule: '0 7 * * *',
    handler: automationJobHandler.runDailyAutomationScan,
    enabled: true,
  },
  // Hourly: Clean up expired idempotency keys (production hardening)
  {
    name: 'cleanup-idempotency-keys',
    schedule: '30 * * * *',
    handler: automationJobHandler.cleanupExpiredIdempotencyKeys,
    enabled: true,
  },
];

// =============================================================================
// Scheduler Functions
// =============================================================================

let isInitialized = false;

export function initializeScheduler(): void {
  if (isInitialized) {
    jobLog.info('Already initialized, skipping');
    return;
  }

  jobLog.info('Initializing job scheduler...');

  for (const job of jobs) {
    if (!job.enabled) {
      jobLog.debug(`Skipping disabled job: ${job.name}`, { jobName: job.name });
      continue;
    }

    if (!cron.validate(job.schedule)) {
      jobLog.error(`Invalid cron schedule for job ${job.name}: ${job.schedule}`, undefined, { jobName: job.name, schedule: job.schedule });
      continue;
    }

    job.task = cron.schedule(job.schedule, async () => {
      const startTime = Date.now();
      jobLog.info(`Starting job: ${job.name}`, { jobName: job.name });

      try {
        await job.handler();
        const duration = Date.now() - startTime;
        jobLog.info(`Completed job: ${job.name}`, { jobName: job.name, duration });
      } catch (error) {
        const duration = Date.now() - startTime;
        jobLog.error(`Failed job: ${job.name}`, error, { jobName: job.name, duration });
      }
    });

    jobLog.debug(`Scheduled job: ${job.name} (${job.schedule})`, { jobName: job.name, schedule: job.schedule });
  }

  isInitialized = true;
  jobLog.info(`Initialized ${jobs.filter(j => j.enabled).length} jobs`);
}

export function stopScheduler(): void {
  jobLog.info('Stopping all scheduled jobs...');

  for (const job of jobs) {
    if (job.task) {
      job.task.stop();
      jobLog.debug(`Stopped job: ${job.name}`, { jobName: job.name });
    }
  }

  isInitialized = false;
  jobLog.info('All jobs stopped');
}

export function getSchedulerStatus(): {
  isRunning: boolean;
  jobs: Array<{ name: string; schedule: string; enabled: boolean; isRunning: boolean }>;
} {
  return {
    isRunning: isInitialized,
    jobs: jobs.map(job => ({
      name: job.name,
      schedule: job.schedule,
      enabled: job.enabled,
      isRunning: job.task !== undefined,
    })),
  };
}

export function runJobManually(jobName: string): Promise<void> {
  const job = jobs.find(j => j.name === jobName);

  if (!job) {
    return Promise.reject(new Error(`Job not found: ${jobName}`));
  }

  jobLog.info(`Running job manually: ${jobName}`, { jobName });
  return job.handler();
}

export function enableJob(jobName: string): boolean {
  const job = jobs.find(j => j.name === jobName);

  if (!job) {
    return false;
  }

  job.enabled = true;

  if (isInitialized && !job.task) {
    job.task = cron.schedule(job.schedule, job.handler);
  }

  jobLog.info(`Enabled job: ${jobName}`, { jobName });
  return true;
}

export function disableJob(jobName: string): boolean {
  const job = jobs.find(j => j.name === jobName);

  if (!job) {
    return false;
  }

  job.enabled = false;

  if (job.task) {
    job.task.stop();
    job.task = undefined;
  }

  jobLog.info(`Disabled job: ${jobName}`, { jobName });
  return true;
}

export default {
  initializeScheduler,
  stopScheduler,
  getSchedulerStatus,
  runJobManually,
  enableJob,
  disableJob,
};
