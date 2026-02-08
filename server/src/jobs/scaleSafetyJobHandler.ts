// =============================================================================
// Scale Safety Job Handler - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { scaleSafetyService } from '../services/scaleSafetyService';
import { prisma } from '../lib/prisma';
import { jobLog } from '../services/observability/structuredLogger';

export const scaleSafetyJobHandler = {
  /**
   * Run anomaly detection for all sellers
   * Runs daily at 3 AM
   */
  async runAnomalyDetection(): Promise<void> {
    jobLog.info('Running anomaly detection...');

    try {
      const result = await scaleSafetyService.runAnomalyDetectionForAllSellers();

      jobLog.info('Anomaly detection complete', {
        sellersChecked: result.sellersChecked,
        anomaliesDetected: result.anomaliesDetected,
      });

      // Log summary
      if (result.anomaliesDetected > 0) {
        await prisma.auditAlert.create({
          data: {
            alertType: 'volume_spike',
            severity: result.anomaliesDetected > 10 ? 'critical' : 'warning',
            title: 'Daily Anomaly Detection Summary',
            description: `Detected ${result.anomaliesDetected} anomalies across ${result.sellerAnomalies.length} sellers`,
            status: 'new',
            metadata: JSON.stringify({
              sellersChecked: result.sellersChecked,
              anomaliesDetected: result.anomaliesDetected,
              affectedSellers: result.sellerAnomalies.map(s => s.sellerId),
            }),
          },
        });
      }
    } catch (error) {
      jobLog.error('Failed to run anomaly detection', error);
    }
  },

  /**
   * Reset daily rate limits
   * Runs daily at 4 AM
   */
  async resetDailyRateLimits(): Promise<void> {
    jobLog.info('Resetting daily rate limits...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      // Reset all daily rate limits
      const result = await prisma.sellerRateLimit.updateMany({
        where: {
          limitType: { in: ['rfq_daily', 'order_daily', 'listing_daily'] },
        },
        data: {
          windowStart: today,
          windowEnd: tomorrow,
          currentCount: 0,
          isThrottled: false,
          throttledAt: null,
        },
      });

      jobLog.info(`Reset ${result.count} daily rate limits`, { count: result.count });
    } catch (error) {
      jobLog.error('Failed to reset rate limits', error);
    }
  },

  /**
   * Clean up old alerts
   * Runs weekly
   */
  async cleanupOldAlerts(): Promise<void> {
    jobLog.info('Cleaning up old alerts...');

    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Delete resolved alerts older than 90 days
      const result = await prisma.auditAlert.deleteMany({
        where: {
          status: 'resolved',
          resolvedAt: { lt: ninetyDaysAgo },
        },
      });

      jobLog.info(`Deleted ${result.count} old resolved alerts`, { count: result.count });
    } catch (error) {
      jobLog.error('Failed to cleanup old alerts', error);
    }
  },

  /**
   * Check for sellers needing soft caps
   * Reviews health scores and applies caps automatically
   */
  async reviewSoftCaps(): Promise<void> {
    jobLog.info('Reviewing soft caps...');

    try {
      // Find sellers with critical risk level
      const criticalSellers = await prisma.sellerHealthScore.findMany({
        where: {
          riskLevel: 'critical',
          softCapActive: false,
        },
      });

      jobLog.info(`Found ${criticalSellers.length} sellers needing soft caps`, { count: criticalSellers.length });

      for (const seller of criticalSellers) {
        const riskReasons = seller.riskReasons
          ? JSON.parse(seller.riskReasons)
          : ['Critical risk level'];

        await scaleSafetyService.applySoftCap(
          seller.sellerId,
          `Auto-applied due to: ${riskReasons.join(', ')}`
        );
      }

      // Check if any soft-capped sellers have improved
      const cappedSellers = await prisma.sellerHealthScore.findMany({
        where: {
          softCapActive: true,
          riskLevel: { in: ['none', 'low'] },
          overallScore: { gte: 70 },
        },
      });

      jobLog.info(`Found ${cappedSellers.length} sellers eligible for cap removal`, { count: cappedSellers.length });

      for (const seller of cappedSellers) {
        await scaleSafetyService.removeSoftCap(seller.sellerId);

        await prisma.auditAlert.create({
          data: {
            sellerId: seller.sellerId,
            alertType: 'trust_drop',
            severity: 'info',
            title: 'Soft Cap Removed',
            description: `Seller health score improved to ${seller.overallScore.toFixed(1)}. Soft cap has been removed.`,
            status: 'resolved',
            resolvedAt: new Date(),
          },
        });
      }
    } catch (error) {
      jobLog.error('Failed to review soft caps', error);
    }
  },

  /**
   * Generate daily platform health report
   */
  async generatePlatformHealthReport(): Promise<void> {
    jobLog.info('Generating platform health report...');

    try {
      // Get count of distinct sellers who have orders
      const activeSellersResult = await prisma.marketplaceOrder.groupBy({
        by: ['sellerId'],
        _count: true,
      });

      const [
        totalSellers,
        criticalRiskSellers,
        softCappedSellers,
        activeAlerts,
        throttledToday,
      ] = await Promise.all([
        prisma.sellerIntelligenceProfile.count(),
        prisma.sellerHealthScore.count({
          where: { riskLevel: 'critical' },
        }),
        prisma.sellerHealthScore.count({
          where: { softCapActive: true },
        }),
        prisma.auditAlert.count({
          where: { status: { in: ['new', 'acknowledged'] } },
        }),
        prisma.sellerRateLimit.count({
          where: {
            isThrottled: true,
            throttledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      const activeSellers = activeSellersResult.length;

      const report = {
        timestamp: new Date().toISOString(),
        sellers: {
          total: totalSellers,
          active: activeSellers,
          criticalRisk: criticalRiskSellers,
          softCapped: softCappedSellers,
        },
        alerts: {
          active: activeAlerts,
        },
        rateLimit: {
          throttledToday,
        },
      };

      jobLog.info('Platform health report generated', { report });

      // Store as alert for admin visibility
      await prisma.auditAlert.create({
        data: {
          alertType: 'volume_spike',
          severity: criticalRiskSellers > 10 || activeAlerts > 50 ? 'warning' : 'info',
          title: 'Daily Platform Health Report',
          description: `${activeSellers} active sellers, ${criticalRiskSellers} at critical risk, ${activeAlerts} active alerts`,
          status: 'resolved',
          resolvedAt: new Date(),
          metadata: JSON.stringify(report),
        },
      });
    } catch (error) {
      jobLog.error('Failed to generate platform health report', error);
    }
  },

  /**
   * Check for expired holds and release them
   */
  async processExpiredHolds(): Promise<void> {
    jobLog.info('Processing expired holds...');

    try {
      const now = new Date();

      // Find payouts with expired holds
      const expiredHolds = await prisma.sellerPayout.findMany({
        where: {
          status: 'on_hold',
          holdUntil: { lte: now },
        },
      });

      jobLog.info(`Found ${expiredHolds.length} expired holds`, { count: expiredHolds.length });

      for (const payout of expiredHolds) {
        // Move back to pending for processing
        await prisma.sellerPayout.update({
          where: { id: payout.id },
          data: {
            status: 'pending',
            holdReason: null,
            holdUntil: null,
          },
        });

        // Log event
        await prisma.payoutEvent.create({
          data: {
            payoutId: payout.id,
            actorType: 'system',
            eventType: 'HOLD_EXPIRED',
            fromStatus: 'on_hold',
            toStatus: 'pending',
            metadata: JSON.stringify({
              originalHoldReason: payout.holdReason,
              holdExpiredAt: now.toISOString(),
            }),
          },
        });
      }
    } catch (error) {
      jobLog.error('Failed to process expired holds', error);
    }
  },

  /**
   * Monitor API rate limit usage patterns
   */
  async monitorRateLimitUsage(): Promise<void> {
    jobLog.info('Monitoring rate limit usage...');

    try {
      // Find sellers who frequently hit rate limits
      const frequentlyThrottled = await prisma.sellerRateLimit.groupBy({
        by: ['sellerId'],
        where: {
          throttledAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { sellerId: true },
        having: {
          sellerId: { _count: { gte: 3 } },
        },
      });

      if (frequentlyThrottled.length > 0) {
        jobLog.info(`${frequentlyThrottled.length} sellers frequently hitting rate limits`, { count: frequentlyThrottled.length });

        await prisma.auditAlert.create({
          data: {
            alertType: 'volume_spike',
            severity: 'info',
            title: 'Rate Limit Usage Pattern',
            description: `${frequentlyThrottled.length} sellers hit rate limits 3+ times in the past week`,
            status: 'new',
            metadata: JSON.stringify({
              sellers: frequentlyThrottled.map(s => ({
                sellerId: s.sellerId,
                throttleCount: s._count.sellerId,
              })),
            }),
          },
        });
      }
    } catch (error) {
      jobLog.error('Failed to monitor rate limit usage', error);
    }
  },
};

export default scaleSafetyJobHandler;
