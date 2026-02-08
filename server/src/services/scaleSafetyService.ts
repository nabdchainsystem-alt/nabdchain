// =============================================================================
// Scale Safety Service - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type LimitType = 'rfq_daily' | 'order_daily' | 'listing_daily' | 'api_minute';
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'volume_spike' | 'dispute_surge' | 'payment_anomaly' | 'sla_breach_pattern' | 'trust_drop';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';

export interface RateLimitConfig {
  limitType: LimitType;
  maxAllowed: number;
  windowMinutes: number;
}

export interface SellerTier {
  tier: 'new' | 'established' | 'premium';
  limits: Record<LimitType, number>;
}

export interface HealthScoreWeights {
  fulfillment: number;
  response: number;
  dispute: number;
}

export interface CreateAlertInput {
  sellerId?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detectedValue?: number;
  expectedValue?: number;
  metadata?: Record<string, unknown>;
}

export interface AlertFilters {
  sellerId?: string;
  alertType?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  page?: number;
  limit?: number;
}

// =============================================================================
// Constants
// =============================================================================

const SELLER_TIERS: Record<string, SellerTier> = {
  new: {
    tier: 'new',
    limits: {
      rfq_daily: 100,
      order_daily: 50,
      listing_daily: 20,
      api_minute: 60,
    },
  },
  established: {
    tier: 'established',
    limits: {
      rfq_daily: 500,
      order_daily: 200,
      listing_daily: 100,
      api_minute: 120,
    },
  },
  premium: {
    tier: 'premium',
    limits: {
      rfq_daily: 10000, // Effectively unlimited
      order_daily: 5000,
      listing_daily: 1000,
      api_minute: 300,
    },
  },
};

const HEALTH_SCORE_WEIGHTS: HealthScoreWeights = {
  fulfillment: 0.4,
  response: 0.3,
  dispute: 0.3,
};

const RISK_THRESHOLDS = {
  critical: 30,
  high: 50,
  medium: 65,
  low: 80,
};

// =============================================================================
// Helper Functions
// =============================================================================

function calculateRiskLevel(score: number): RiskLevel {
  if (score < RISK_THRESHOLDS.critical) return 'critical';
  if (score < RISK_THRESHOLDS.high) return 'high';
  if (score < RISK_THRESHOLDS.medium) return 'medium';
  if (score < RISK_THRESHOLDS.low) return 'low';
  return 'none';
}

function getWindowDates(limitType: LimitType): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (limitType === 'api_minute') {
    start = new Date(now.getTime() - 60 * 1000);
    end = now;
  } else {
    // Daily limits - use current day
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  return { start, end };
}

async function getSellerTier(sellerId: string): Promise<SellerTier> {
  // Determine tier based on account age and trust score
  const profile = await prisma.sellerIntelligenceProfile.findUnique({
    where: { sellerId },
  });

  if (!profile) {
    return SELLER_TIERS.new;
  }

  // Check if premium (based on trust score or manual flag)
  const trustScore = await prisma.trustScore.findUnique({
    where: { userId: sellerId },
  });

  if (trustScore && trustScore.score >= 90) {
    return SELLER_TIERS.premium;
  }

  // Check account age (established after 90 days with good standing)
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (seller) {
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (accountAgeDays >= 90 && (!trustScore || trustScore.score >= 70)) {
      return SELLER_TIERS.established;
    }
  }

  return SELLER_TIERS.new;
}

// =============================================================================
// Service Functions
// =============================================================================

export const scaleSafetyService = {
  // =========================================================================
  // Rate Limiting
  // =========================================================================

  async checkRateLimit(sellerId: string, limitType: LimitType): Promise<{
    allowed: boolean;
    currentCount: number;
    maxAllowed: number;
    remainingCount: number;
    resetAt: Date;
  }> {
    const tier = await getSellerTier(sellerId);
    const maxAllowed = tier.limits[limitType];
    const { start, end } = getWindowDates(limitType);

    // Get or create rate limit record
    let rateLimit = await prisma.sellerRateLimit.findUnique({
      where: {
        sellerId_limitType: { sellerId, limitType },
      },
    });

    // Check if window has expired and reset
    if (rateLimit && new Date(rateLimit.windowEnd) < new Date()) {
      rateLimit = await prisma.sellerRateLimit.update({
        where: { id: rateLimit.id },
        data: {
          windowStart: start,
          windowEnd: end,
          currentCount: 0,
          maxAllowed,
          isThrottled: false,
          throttledAt: null,
        },
      });
    }

    // Create if doesn't exist
    if (!rateLimit) {
      rateLimit = await prisma.sellerRateLimit.create({
        data: {
          sellerId,
          limitType,
          windowStart: start,
          windowEnd: end,
          currentCount: 0,
          maxAllowed,
          isThrottled: false,
        },
      });
    }

    const allowed = rateLimit.currentCount < maxAllowed;
    const remainingCount = Math.max(0, maxAllowed - rateLimit.currentCount);

    return {
      allowed,
      currentCount: rateLimit.currentCount,
      maxAllowed,
      remainingCount,
      resetAt: rateLimit.windowEnd,
    };
  },

  async incrementRateLimit(sellerId: string, limitType: LimitType): Promise<{
    success: boolean;
    throttled: boolean;
    currentCount: number;
    maxAllowed: number;
  }> {
    const check = await this.checkRateLimit(sellerId, limitType);

    if (!check.allowed) {
      // Mark as throttled if not already
      await prisma.sellerRateLimit.update({
        where: {
          sellerId_limitType: { sellerId, limitType },
        },
        data: {
          isThrottled: true,
          throttledAt: new Date(),
        },
      });

      // Create alert for throttling
      await this.createAlert({
        sellerId,
        alertType: 'volume_spike',
        severity: 'warning',
        title: `Rate limit reached: ${limitType}`,
        description: `Seller has been throttled for exceeding ${limitType} limit`,
        detectedValue: check.currentCount,
        expectedValue: check.maxAllowed,
      });

      return {
        success: false,
        throttled: true,
        currentCount: check.currentCount,
        maxAllowed: check.maxAllowed,
      };
    }

    // Increment counter
    const updated = await prisma.sellerRateLimit.update({
      where: {
        sellerId_limitType: { sellerId, limitType },
      },
      data: {
        currentCount: { increment: 1 },
      },
    });

    return {
      success: true,
      throttled: false,
      currentCount: updated.currentCount,
      maxAllowed: check.maxAllowed,
    };
  },

  async getRateLimitStatus(sellerId: string): Promise<Record<LimitType, {
    currentCount: number;
    maxAllowed: number;
    remainingCount: number;
    percentUsed: number;
    isThrottled: boolean;
    resetAt: Date;
  }>> {
    const limitTypes: LimitType[] = ['rfq_daily', 'order_daily', 'listing_daily', 'api_minute'];
    const result: Record<string, {
      currentCount: number;
      maxAllowed: number;
      remainingCount: number;
      percentUsed: number;
      isThrottled: boolean;
      resetAt: Date;
    }> = {};

    for (const limitType of limitTypes) {
      const status = await this.checkRateLimit(sellerId, limitType);
      const rateLimit = await prisma.sellerRateLimit.findUnique({
        where: { sellerId_limitType: { sellerId, limitType } },
      });

      result[limitType] = {
        currentCount: status.currentCount,
        maxAllowed: status.maxAllowed,
        remainingCount: status.remainingCount,
        percentUsed: status.maxAllowed > 0 ? (status.currentCount / status.maxAllowed) * 100 : 0,
        isThrottled: rateLimit?.isThrottled ?? false,
        resetAt: status.resetAt,
      };
    }

    return result as Record<LimitType, typeof result[string]>;
  },

  // =========================================================================
  // Health Scoring
  // =========================================================================

  async evaluateSellerHealth(sellerId: string): Promise<{
    overallScore: number;
    fulfillmentScore: number;
    responseScore: number;
    disputeScore: number;
    riskLevel: RiskLevel;
    riskReasons: string[];
    softCapActive?: boolean;
    softCapReason?: string | null;
  }> {
    const riskReasons: string[] = [];

    // Get intelligence profile
    const profile = await prisma.sellerIntelligenceProfile.findUnique({
      where: { sellerId },
    });

    // Calculate fulfillment score (based on on-time delivery)
    let fulfillmentScore = 80; // Default
    if (profile) {
      fulfillmentScore = profile.onTimeDeliveryRate;
      if (fulfillmentScore < 70) {
        riskReasons.push('Low on-time delivery rate');
      }
    }

    // Calculate response score (based on average response time)
    let responseScore = 80; // Default
    if (profile && profile.avgResponseTime > 0) {
      // Good: < 4 hours = 100, Bad: > 24 hours = 50
      const responseHours = profile.avgResponseTime / 60; // Convert minutes to hours
      if (responseHours <= 4) {
        responseScore = 100;
      } else if (responseHours <= 12) {
        responseScore = 85;
      } else if (responseHours <= 24) {
        responseScore = 70;
      } else {
        responseScore = 50;
        riskReasons.push('Slow response time');
      }
    }

    // Calculate dispute score
    let disputeScore = 80; // Default
    if (profile) {
      // Base on dispute resolution rate
      if (profile.disputeResolution < 0.8) {
        disputeScore = Math.round(profile.disputeResolution * 100);
        if (disputeScore < 60) {
          riskReasons.push('Poor dispute resolution');
        }
      }

      // Check recent disputes
      const recentDisputes = await prisma.marketplaceDispute.count({
        where: {
          sellerId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      });

      if (recentDisputes > 5) {
        disputeScore = Math.max(40, disputeScore - 20);
        riskReasons.push(`High dispute volume (${recentDisputes} in 30 days)`);
      }
    }

    // Calculate overall score
    const overallScore =
      fulfillmentScore * HEALTH_SCORE_WEIGHTS.fulfillment +
      responseScore * HEALTH_SCORE_WEIGHTS.response +
      disputeScore * HEALTH_SCORE_WEIGHTS.dispute;

    const riskLevel = calculateRiskLevel(overallScore);

    // Upsert health score record
    await prisma.sellerHealthScore.upsert({
      where: { sellerId },
      create: {
        sellerId,
        overallScore,
        fulfillmentScore,
        responseScore,
        disputeScore,
        riskLevel,
        riskReasons: JSON.stringify(riskReasons),
        lastComputedAt: new Date(),
      },
      update: {
        overallScore,
        fulfillmentScore,
        responseScore,
        disputeScore,
        riskLevel,
        riskReasons: JSON.stringify(riskReasons),
        lastComputedAt: new Date(),
      },
    });

    return {
      overallScore,
      fulfillmentScore,
      responseScore,
      disputeScore,
      riskLevel,
      riskReasons,
    };
  },

  async getSellerHealthScore(sellerId: string) {
    const score = await prisma.sellerHealthScore.findUnique({
      where: { sellerId },
    });

    if (!score) {
      // Compute on demand
      return this.evaluateSellerHealth(sellerId);
    }

    // Check if stale (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (new Date(score.lastComputedAt) < oneHourAgo) {
      return this.evaluateSellerHealth(sellerId);
    }

    return {
      overallScore: score.overallScore,
      fulfillmentScore: score.fulfillmentScore,
      responseScore: score.responseScore,
      disputeScore: score.disputeScore,
      riskLevel: score.riskLevel as RiskLevel,
      riskReasons: score.riskReasons ? JSON.parse(score.riskReasons) : [],
      softCapActive: score.softCapActive,
      softCapReason: score.softCapReason,
    };
  },

  async applySoftCap(sellerId: string, reason: string): Promise<{ success: boolean }> {
    try {
      await prisma.sellerHealthScore.upsert({
        where: { sellerId },
        create: {
          sellerId,
          softCapActive: true,
          softCapReason: reason,
        },
        update: {
          softCapActive: true,
          softCapReason: reason,
        },
      });

      // Create alert
      await this.createAlert({
        sellerId,
        alertType: 'trust_drop',
        severity: 'warning',
        title: 'Soft cap applied',
        description: reason,
      });

      return { success: true };
    } catch (error) {
      apiLogger.error('Error applying soft cap:', error);
      return { success: false };
    }
  },

  async removeSoftCap(sellerId: string): Promise<{ success: boolean }> {
    try {
      await prisma.sellerHealthScore.update({
        where: { sellerId },
        data: {
          softCapActive: false,
          softCapReason: null,
        },
      });

      return { success: true };
    } catch (error) {
      apiLogger.error('Error removing soft cap:', error);
      return { success: false };
    }
  },

  // =========================================================================
  // Alerts
  // =========================================================================

  async createAlert(input: CreateAlertInput): Promise<{ success: boolean; alert?: unknown }> {
    try {
      const alert = await prisma.auditAlert.create({
        data: {
          sellerId: input.sellerId,
          alertType: input.alertType,
          severity: input.severity,
          title: input.title,
          description: input.description,
          detectedValue: input.detectedValue,
          expectedValue: input.expectedValue,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          status: 'new',
        },
      });

      return { success: true, alert };
    } catch (error) {
      apiLogger.error('Error creating alert:', error);
      return { success: false };
    }
  },

  async acknowledgeAlert(alertId: string, adminId: string): Promise<{ success: boolean }> {
    try {
      await prisma.auditAlert.update({
        where: { id: alertId },
        data: {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: adminId,
        },
      });

      return { success: true };
    } catch (error) {
      apiLogger.error('Error acknowledging alert:', error);
      return { success: false };
    }
  },

  async resolveAlert(alertId: string, adminId: string, resolution?: string): Promise<{ success: boolean }> {
    try {
      const alert = await prisma.auditAlert.findUnique({ where: { id: alertId } });

      await prisma.auditAlert.update({
        where: { id: alertId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          metadata: resolution
            ? JSON.stringify({
                ...(alert?.metadata ? JSON.parse(alert.metadata) : {}),
                resolution,
              })
            : undefined,
        },
      });

      return { success: true };
    } catch (error) {
      apiLogger.error('Error resolving alert:', error);
      return { success: false };
    }
  },

  async getActiveAlerts(filters?: AlertFilters): Promise<{
    alerts: unknown[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    try {
      const where: Record<string, unknown> = {};

      if (filters?.sellerId) where.sellerId = filters.sellerId;
      if (filters?.alertType) where.alertType = filters.alertType;
      if (filters?.severity) where.severity = filters.severity;
      if (filters?.status) {
        where.status = filters.status;
      } else {
        // Default to non-resolved
        where.status = { in: ['new', 'acknowledged'] };
      }

      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 50;

      const [alerts, total] = await Promise.all([
        prisma.auditAlert.findMany({
          where,
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.auditAlert.count({ where }),
      ]);

      return {
        alerts: alerts.map(a => ({
          ...a,
          metadata: a.metadata ? JSON.parse(a.metadata) : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      apiLogger.error('Error fetching alerts:', error);
      return { alerts: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  },

  async getAlertStats(): Promise<{
    total: number;
    new: number;
    acknowledged: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
  }> {
    try {
      const [total, newCount, acknowledged, bySeverity, byType] = await Promise.all([
        prisma.auditAlert.count({ where: { status: { in: ['new', 'acknowledged'] } } }),
        prisma.auditAlert.count({ where: { status: 'new' } }),
        prisma.auditAlert.count({ where: { status: 'acknowledged' } }),
        prisma.auditAlert.groupBy({
          by: ['severity'],
          where: { status: { in: ['new', 'acknowledged'] } },
          _count: true,
        }),
        prisma.auditAlert.groupBy({
          by: ['alertType'],
          where: { status: { in: ['new', 'acknowledged'] } },
          _count: true,
        }),
      ]);

      return {
        total,
        new: newCount,
        acknowledged,
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item.severity as AlertSeverity] = item._count;
          return acc;
        }, {} as Record<AlertSeverity, number>),
        byType: byType.reduce((acc, item) => {
          acc[item.alertType as AlertType] = item._count;
          return acc;
        }, {} as Record<AlertType, number>),
      };
    } catch (error) {
      apiLogger.error('Error fetching alert stats:', error);
      return {
        total: 0,
        new: 0,
        acknowledged: 0,
        bySeverity: {} as Record<AlertSeverity, number>,
        byType: {} as Record<AlertType, number>,
      };
    }
  },

  // =========================================================================
  // Anomaly Detection
  // =========================================================================

  async detectVolumeAnomaly(sellerId: string): Promise<{
    hasAnomaly: boolean;
    anomalies: Array<{ type: string; detected: number; expected: number; deviation: number }>;
  }> {
    const anomalies: Array<{ type: string; detected: number; expected: number; deviation: number }> = [];

    try {
      // Get profile for historical averages
      const profile = await prisma.sellerIntelligenceProfile.findUnique({
        where: { sellerId },
      });

      if (!profile) {
        return { hasAnomaly: false, anomalies };
      }

      // Check RFQ volume (last 24 hours vs average)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const rfqCount = await prisma.itemRFQ.count({
        where: {
          sellerId,
          createdAt: { gte: last24Hours },
        },
      });

      // Get historical daily average (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const historicalRfqCount = await prisma.itemRFQ.count({
        where: {
          sellerId,
          createdAt: { gte: thirtyDaysAgo, lt: last24Hours },
        },
      });
      const avgDailyRfq = historicalRfqCount / 30;

      // Anomaly if more than 3x normal volume
      if (avgDailyRfq > 0 && rfqCount > avgDailyRfq * 3) {
        anomalies.push({
          type: 'rfq_volume_spike',
          detected: rfqCount,
          expected: avgDailyRfq,
          deviation: (rfqCount - avgDailyRfq) / avgDailyRfq,
        });
      }

      // Check order volume
      const orderCount = await prisma.marketplaceOrder.count({
        where: {
          sellerId,
          createdAt: { gte: last24Hours },
        },
      });

      const historicalOrderCount = await prisma.marketplaceOrder.count({
        where: {
          sellerId,
          createdAt: { gte: thirtyDaysAgo, lt: last24Hours },
        },
      });
      const avgDailyOrders = historicalOrderCount / 30;

      if (avgDailyOrders > 0 && orderCount > avgDailyOrders * 3) {
        anomalies.push({
          type: 'order_volume_spike',
          detected: orderCount,
          expected: avgDailyOrders,
          deviation: (orderCount - avgDailyOrders) / avgDailyOrders,
        });
      }

      // Check dispute surge
      const disputeCount = await prisma.marketplaceDispute.count({
        where: {
          sellerId,
          createdAt: { gte: last24Hours },
        },
      });

      // Any disputes in a day is a spike if historical average is low
      const historicalDisputeCount = await prisma.marketplaceDispute.count({
        where: {
          sellerId,
          createdAt: { gte: thirtyDaysAgo, lt: last24Hours },
        },
      });
      const avgDailyDisputes = historicalDisputeCount / 30;

      if (disputeCount > 2 || (avgDailyDisputes > 0 && disputeCount > avgDailyDisputes * 5)) {
        anomalies.push({
          type: 'dispute_surge',
          detected: disputeCount,
          expected: Math.max(avgDailyDisputes, 0.5), // Min expected
          deviation: avgDailyDisputes > 0 ? (disputeCount - avgDailyDisputes) / avgDailyDisputes : disputeCount,
        });
      }

      // Create alerts for anomalies
      for (const anomaly of anomalies) {
        const alertType = anomaly.type === 'dispute_surge' ? 'dispute_surge' : 'volume_spike';
        await this.createAlert({
          sellerId,
          alertType,
          severity: anomaly.deviation > 5 ? 'critical' : 'warning',
          title: `Anomaly detected: ${anomaly.type}`,
          description: `Detected ${anomaly.detected} vs expected ${anomaly.expected.toFixed(1)} (${(anomaly.deviation * 100).toFixed(0)}% deviation)`,
          detectedValue: anomaly.detected,
          expectedValue: anomaly.expected,
          metadata: { anomaly },
        });
      }

      return { hasAnomaly: anomalies.length > 0, anomalies };
    } catch (error) {
      apiLogger.error('Error detecting anomalies:', error);
      return { hasAnomaly: false, anomalies };
    }
  },

  async runAnomalyDetectionForAllSellers(): Promise<{
    sellersChecked: number;
    anomaliesDetected: number;
    sellerAnomalies: Array<{ sellerId: string; anomalies: unknown[] }>;
  }> {
    try {
      // Get all active sellers
      const sellers = await prisma.sellerIntelligenceProfile.findMany({
        select: { sellerId: true },
      });

      let anomaliesDetected = 0;
      const sellerAnomalies: Array<{ sellerId: string; anomalies: unknown[] }> = [];

      for (const seller of sellers) {
        const result = await this.detectVolumeAnomaly(seller.sellerId);
        if (result.hasAnomaly) {
          anomaliesDetected += result.anomalies.length;
          sellerAnomalies.push({
            sellerId: seller.sellerId,
            anomalies: result.anomalies,
          });
        }
      }

      return {
        sellersChecked: sellers.length,
        anomaliesDetected,
        sellerAnomalies,
      };
    } catch (error) {
      apiLogger.error('Error running anomaly detection:', error);
      return { sellersChecked: 0, anomaliesDetected: 0, sellerAnomalies: [] };
    }
  },

  // =========================================================================
  // Feature Access Control
  // =========================================================================

  async checkFeatureAccess(sellerId: string, feature: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Get health score
    const health = await this.getSellerHealthScore(sellerId);

    // Check soft cap
    if (health.softCapActive) {
      const restrictedFeatures = ['bulk_listing', 'bulk_pricing', 'automation_rules'];
      if (restrictedFeatures.includes(feature)) {
        return {
          allowed: false,
          reason: `Feature restricted due to soft cap: ${health.softCapReason}`,
        };
      }
    }

    // Check risk level
    if (health.riskLevel === 'critical') {
      return {
        allowed: false,
        reason: 'Account under review due to critical risk level',
      };
    }

    // Premium features require good standing
    const premiumFeatures = ['automation_rules', 'bulk_operations', 'api_access'];
    if (premiumFeatures.includes(feature) && health.overallScore < 60) {
      return {
        allowed: false,
        reason: `Health score too low for ${feature}. Required: 60, Current: ${health.overallScore.toFixed(0)}`,
      };
    }

    return { allowed: true };
  },
};

export default scaleSafetyService;
