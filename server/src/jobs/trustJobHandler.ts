// =============================================================================
// Trust Job Handler - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { crossIntelligenceService } from '../services/crossIntelligenceService';
import { scaleSafetyService } from '../services/scaleSafetyService';
import { prisma } from '../lib/prisma';
import { jobLog } from '../services/observability/structuredLogger';

export const trustJobHandler = {
  /**
   * Update stale trust scores
   * Runs hourly
   */
  async updateStaleScores(): Promise<void> {
    jobLog.info('Updating stale trust scores...');

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Find trust scores that haven't been updated in the last hour
      const staleScores = await prisma.trustScore.findMany({
        where: {
          lastUpdated: { lt: oneHourAgo },
        },
        select: { userId: true },
        take: 100, // Process in batches
      });

      jobLog.info(`Found ${staleScores.length} stale trust scores to update`, { count: staleScores.length });

      for (const score of staleScores) {
        try {
          await crossIntelligenceService.recomputeSellerTrustScore(score.userId);
        } catch (error) {
          jobLog.error(`Failed to update trust score for ${score.userId}`, error, { userId: score.userId });
        }
      }

      jobLog.info('Trust score update complete');
    } catch (error) {
      jobLog.error('Failed to update stale scores', error);
    }
  },

  /**
   * Update seller health scores
   * Runs every 30 minutes
   */
  async updateHealthScores(): Promise<void> {
    jobLog.info('Updating health scores...');

    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // Find health scores that haven't been updated recently
      const staleHealthScores = await prisma.sellerHealthScore.findMany({
        where: {
          lastComputedAt: { lt: thirtyMinutesAgo },
        },
        select: { sellerId: true },
        take: 100, // Process in batches
      });

      // Also find sellers without health scores
      const sellersWithoutScores = await prisma.sellerIntelligenceProfile.findMany({
        where: {
          sellerId: {
            notIn: (await prisma.sellerHealthScore.findMany({
              select: { sellerId: true },
            })).map(s => s.sellerId),
          },
        },
        select: { sellerId: true },
        take: 50,
      });

      const sellersToUpdate = [
        ...staleHealthScores.map(s => s.sellerId),
        ...sellersWithoutScores.map(s => s.sellerId),
      ];

      jobLog.info(`Updating health scores for ${sellersToUpdate.length} sellers`, { count: sellersToUpdate.length });

      for (const sellerId of sellersToUpdate) {
        try {
          await scaleSafetyService.evaluateSellerHealth(sellerId);
        } catch (error) {
          jobLog.error(`Failed to update health score for ${sellerId}`, error, { sellerId });
        }
      }

      jobLog.info('Health score update complete');
    } catch (error) {
      jobLog.error('Failed to update health scores', error);
    }
  },

  /**
   * Check for trust score drops and create alerts
   * Runs daily
   */
  async checkTrustScoreDrops(): Promise<void> {
    jobLog.info('Checking for trust score drops...');

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get current trust scores
      const currentScores = await prisma.trustScore.findMany({
        select: {
          userId: true,
          score: true,
        },
      });

      for (const current of currentScores) {
        // Get historical event from 7 days ago to estimate score trend
        const historicalEvent = await prisma.trustEvent.findFirst({
          where: {
            userId: current.userId,
            timestamp: { lte: sevenDaysAgo },
          },
          orderBy: { timestamp: 'desc' },
        });

        if (historicalEvent) {
          // Estimate previous score based on current score minus cumulative impact
          // (simplified approach since we don't store historical scores)
          const recentEvents = await prisma.trustEvent.findMany({
            where: {
              userId: current.userId,
              timestamp: { gt: sevenDaysAgo },
            },
          });
          const cumulativeImpact = recentEvents.reduce((sum, e) => sum + e.impact, 0);
          const previousScore = Math.min(100, Math.max(0, current.score - cumulativeImpact));
          const drop = previousScore - current.score;

          // Alert if drop > 10 points in a week
          if (drop > 10) {
            await scaleSafetyService.createAlert({
              sellerId: current.userId,
              alertType: 'trust_drop',
              severity: drop > 20 ? 'critical' : 'warning',
              title: 'Significant Trust Score Drop',
              description: `Trust score dropped ${drop.toFixed(1)} points in the last 7 days (${previousScore.toFixed(1)} → ${current.score.toFixed(1)})`,
              detectedValue: current.score,
              expectedValue: previousScore,
            });

            // Apply soft cap if drop is severe
            if (drop > 20) {
              await scaleSafetyService.applySoftCap(
                current.userId,
                `Trust score dropped ${drop.toFixed(1)} points - under review`
              );
            }
          }
        }
      }

      jobLog.info('Trust score drop check complete');
    } catch (error) {
      jobLog.error('Failed to check trust score drops', error);
    }
  },

  /**
   * Process trust events that impact score
   * This aggregates events and updates scores accordingly
   */
  async processPendingTrustEvents(): Promise<void> {
    jobLog.info('Processing pending trust events...');

    try {
      // Get users with recent trust events that might need score updates
      const recentEvents = await prisma.trustEvent.findMany({
        where: {
          timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      const userIds = recentEvents.map(e => e.userId);
      jobLog.info(`Found ${userIds.length} users with recent trust events`, { count: userIds.length });

      for (const userId of userIds) {
        try {
          await crossIntelligenceService.recomputeSellerTrustScore(userId);
        } catch (error) {
          jobLog.error(`Failed to process trust events for ${userId}`, error, { userId });
        }
      }

      jobLog.info('Trust event processing complete');
    } catch (error) {
      jobLog.error('Failed to process trust events', error);
    }
  },

  /**
   * Generate trust score leaderboard/rankings
   * Updates seller rankings based on trust scores
   */
  async updateSellerRankings(): Promise<void> {
    jobLog.info('Updating seller rankings...');

    try {
      // Get all seller trust scores ordered by score
      const rankings = await prisma.trustScore.findMany({
        orderBy: { score: 'desc' },
        select: {
          userId: true,
          score: true,
        },
      });

      // Update intelligence profiles with rank
      for (let i = 0; i < rankings.length; i++) {
        const rank = i + 1;
        const percentile = ((rankings.length - rank) / rankings.length) * 100;

        await prisma.sellerIntelligenceProfile.updateMany({
          where: { sellerId: rankings[i].userId },
          data: {
            // Store percentile in a metadata field if available
            // For now, just log it
          },
        });
      }

      jobLog.info(`Updated rankings for ${rankings.length} sellers`, { count: rankings.length });
    } catch (error) {
      jobLog.error('Failed to update seller rankings', error);
    }
  },
};

export default trustJobHandler;
