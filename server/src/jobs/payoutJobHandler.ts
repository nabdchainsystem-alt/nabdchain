// =============================================================================
// Payout Job Handler - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { sellerPayoutService } from '../services/sellerPayoutService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const payoutJobHandler = {
  /**
   * Create daily payouts for all eligible sellers
   * Runs daily at 2 AM
   */
  async createDailyPayouts(): Promise<void> {
    console.log('[PayoutJob] Starting daily payout creation...');

    try {
      const result = await sellerPayoutService.createBatchPayouts(new Date());

      console.log(`[PayoutJob] Daily payouts created:`, {
        created: result.created,
        skipped: result.skipped,
        errors: result.errors.length,
      });

      // Log to audit trail
      await prisma.auditAlert.create({
        data: {
          alertType: 'payment_anomaly',
          severity: result.errors.length > 0 ? 'warning' : 'info',
          title: 'Daily Payout Batch Completed',
          description: `Created ${result.created} payouts, skipped ${result.skipped}, errors: ${result.errors.length}`,
          status: 'resolved',
          resolvedAt: new Date(),
          metadata: JSON.stringify({
            created: result.created,
            skipped: result.skipped,
            errorCount: result.errors.length,
            errorMessages: result.errors,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (error) {
      console.error('[PayoutJob] Failed to create daily payouts:', error);

      await prisma.auditAlert.create({
        data: {
          alertType: 'payment_anomaly',
          severity: 'critical',
          title: 'Daily Payout Batch Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'new',
        },
      });
    }
  },

  /**
   * Generate weekly payout summary report
   * Runs every Sunday at 5 AM
   */
  async generateWeeklyReport(): Promise<void> {
    console.log('[PayoutJob] Generating weekly payout report...');

    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get payout statistics for the week
      const [
        totalPayouts,
        settledPayouts,
        pendingPayouts,
        failedPayouts,
        totalAmount,
      ] = await Promise.all([
        prisma.sellerPayout.count({
          where: { createdAt: { gte: oneWeekAgo } },
        }),
        prisma.sellerPayout.count({
          where: { createdAt: { gte: oneWeekAgo }, status: 'settled' },
        }),
        prisma.sellerPayout.count({
          where: { createdAt: { gte: oneWeekAgo }, status: 'pending' },
        }),
        prisma.sellerPayout.count({
          where: { createdAt: { gte: oneWeekAgo }, status: 'failed' },
        }),
        prisma.sellerPayout.aggregate({
          where: { createdAt: { gte: oneWeekAgo }, status: 'settled' },
          _sum: { netAmount: true },
        }),
      ]);

      const report = {
        period: {
          start: oneWeekAgo.toISOString(),
          end: new Date().toISOString(),
        },
        statistics: {
          totalPayouts,
          settledPayouts,
          pendingPayouts,
          failedPayouts,
          totalAmountSettled: totalAmount._sum.netAmount || 0,
        },
      };

      console.log('[PayoutJob] Weekly report generated:', report);

      // Store report as an alert for admin visibility
      await prisma.auditAlert.create({
        data: {
          alertType: 'payment_anomaly',
          severity: 'info',
          title: 'Weekly Payout Report',
          description: `Week ending ${new Date().toLocaleDateString()}: ${settledPayouts} settled, ${pendingPayouts} pending, ${failedPayouts} failed. Total: ${totalAmount._sum.netAmount?.toFixed(2) || '0.00'} SAR`,
          status: 'resolved',
          resolvedAt: new Date(),
          metadata: JSON.stringify(report),
        },
      });
    } catch (error) {
      console.error('[PayoutJob] Failed to generate weekly report:', error);
    }
  },

  /**
   * Process payouts that are ready for settlement
   * This is typically triggered after external payment processing
   */
  async processReadyPayouts(): Promise<void> {
    console.log('[PayoutJob] Processing ready payouts...');

    try {
      // Find payouts in 'processing' state that have been there for > 24 hours
      // These might need attention
      const staleProcessing = await prisma.sellerPayout.findMany({
        where: {
          status: 'processing',
          updatedAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (staleProcessing.length > 0) {
        console.log(`[PayoutJob] Found ${staleProcessing.length} stale processing payouts`);

        await prisma.auditAlert.create({
          data: {
            alertType: 'payment_anomaly',
            severity: 'warning',
            title: 'Stale Processing Payouts',
            description: `${staleProcessing.length} payouts have been in processing state for over 24 hours`,
            status: 'new',
            metadata: JSON.stringify({
              payoutIds: staleProcessing.map(p => p.id),
            }),
          },
        });
      }
    } catch (error) {
      console.error('[PayoutJob] Failed to process ready payouts:', error);
    }
  },

  /**
   * Check for failed payouts that can be retried
   */
  async retryFailedPayouts(): Promise<void> {
    console.log('[PayoutJob] Checking failed payouts for retry...');

    try {
      // Find payouts that failed in the last 48 hours
      const failedPayouts = await prisma.sellerPayout.findMany({
        where: {
          status: 'failed',
          failedAt: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
          },
        },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      // Filter to those that haven't been retried too many times
      const retriable = failedPayouts.filter(payout => {
        const retryCount = payout.events.filter(
          e => e.eventType === 'RETRY_ATTEMPTED'
        ).length;
        return retryCount < 3; // Max 3 retries
      });

      if (retriable.length > 0) {
        console.log(`[PayoutJob] Found ${retriable.length} payouts eligible for retry`);

        // Create alert for admin review
        await prisma.auditAlert.create({
          data: {
            alertType: 'payment_anomaly',
            severity: 'warning',
            title: 'Failed Payouts Awaiting Retry',
            description: `${retriable.length} payouts failed and can be retried`,
            status: 'new',
            metadata: JSON.stringify({
              payoutIds: retriable.map(p => p.id),
            }),
          },
        });
      }
    } catch (error) {
      console.error('[PayoutJob] Failed to check retriable payouts:', error);
    }
  },
};

export default payoutJobHandler;
