// =============================================================================
// Trust Routes - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  requirePortalAuth,
  requirePortalRole,
  PortalAuthRequest,
} from '../middleware/portalAdminMiddleware';
import {
  calculateTrustScore,
  getRelationshipTrust,
} from '../services/crossIntelligenceService';
import { scaleSafetyService } from '../services/scaleSafetyService';
import { apiLogger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { getPeriodStartDate } from '../utils/dates';
const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const trustHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const performanceSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});

// =============================================================================
// Trust Score Routes
// =============================================================================

/**
 * GET /api/trust/score
 * Get own trust score
 */
router.get('/score', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get trust score
    const trustScore = await calculateTrustScore(userId, 'seller');

    // Also get health score if available
    const healthScore = await scaleSafetyService.getSellerHealthScore(userId);

    return res.json({
      trust: trustScore,
      health: healthScore,
    });
  } catch (error) {
    apiLogger.error('Error fetching trust score:', error);
    return res.status(500).json({ error: 'Failed to fetch trust score' });
  }
});

/**
 * GET /api/trust/performance
 * Get performance metrics
 */
router.get('/performance', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = performanceSchema.parse(req.query);

    const now = new Date();
    const startDate = getPeriodStartDate(filters.period);

    // Get seller intelligence profile
    const profile = await prisma.sellerIntelligenceProfile.findUnique({
      where: { sellerId: userId },
    });

    // Get order metrics for period
    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalDisputes,
      resolvedDisputes,
      slaBreaches,
      onTimeDeliveries,
    ] = await Promise.all([
      prisma.marketplaceOrder.count({
        where: { sellerId: userId, createdAt: { gte: startDate } },
      }),
      prisma.marketplaceOrder.count({
        where: { sellerId: userId, createdAt: { gte: startDate }, status: 'closed' },
      }),
      prisma.marketplaceOrder.count({
        where: { sellerId: userId, createdAt: { gte: startDate }, status: 'cancelled' },
      }),
      prisma.marketplaceDispute.count({
        where: { sellerId: userId, createdAt: { gte: startDate } },
      }),
      prisma.marketplaceDispute.count({
        where: { sellerId: userId, createdAt: { gte: startDate }, status: 'resolved' },
      }),
      prisma.sLARecord.count({
        where: {
          sellerId: userId,
          isBreach: true,
          expectedAt: { gte: startDate },
        },
      }),
      prisma.sLARecord.count({
        where: {
          sellerId: userId,
          isBreach: false,
          actualAt: { not: null },
          expectedAt: { gte: startDate },
        },
      }),
    ]);

    // Get RFQ quote metrics (RFQs are created by buyers, so count quotes the seller responded to)
    const [totalQuotes, respondedQuotes] = await Promise.all([
      // Total marketplace orders where this seller received the order (as proxy for RFQ responses)
      prisma.marketplaceOrder.count({
        where: { sellerId: userId, createdAt: { gte: startDate } },
      }),
      // Orders that were actually processed (confirmed+)
      prisma.marketplaceOrder.count({
        where: {
          sellerId: userId,
          createdAt: { gte: startDate },
          status: { notIn: ['pending', 'cancelled'] },
        },
      }),
    ]);

    // Calculate rates
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100;
    const disputeRate = totalOrders > 0 ? (totalDisputes / totalOrders) * 100 : 0;
    const disputeResolutionRate = totalDisputes > 0 ? (resolvedDisputes / totalDisputes) * 100 : 100;
    const slaCompliance = (onTimeDeliveries + slaBreaches) > 0
      ? (onTimeDeliveries / (onTimeDeliveries + slaBreaches)) * 100
      : 100;
    const responseRate = totalQuotes > 0 ? (respondedQuotes / totalQuotes) * 100 : 100;

    const performance = {
      period: filters.period,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      orders: {
        total: totalOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        completionRate,
      },
      disputes: {
        total: totalDisputes,
        resolved: resolvedDisputes,
        disputeRate,
        resolutionRate: disputeResolutionRate,
      },
      sla: {
        breaches: slaBreaches,
        onTime: onTimeDeliveries,
        compliance: slaCompliance,
      },
      quotes: {
        total: totalQuotes,
        responded: respondedQuotes,
        responseRate,
      },
      intelligence: profile ? {
        avgResponseTime: profile.avgResponseTime,
        onTimeDeliveryRate: profile.onTimeDeliveryRate,
        qualityScore: profile.qualityScore,
        quoteAcceptanceRate: profile.quoteAcceptanceRate,
        customerSatisfaction: profile.customerSatisfaction,
        disputeResolution: profile.disputeResolution,
      } : null,
    };

    return res.json(performance);
  } catch (error) {
    apiLogger.error('Error fetching performance metrics:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid parameters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

/**
 * GET /api/trust/history
 * Get trust score history (events)
 */
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = trustHistorySchema.parse(req.query);

    const where: Record<string, unknown> = { userId };

    if (filters.dateFrom || filters.dateTo) {
      where.timestamp = {};
      if (filters.dateFrom) {
        (where.timestamp as Record<string, Date>).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.timestamp as Record<string, Date>).lte = new Date(filters.dateTo);
      }
    }

    const [events, total] = await Promise.all([
      prisma.trustEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.trustEvent.count({ where }),
    ]);

    return res.json({
      events: events.map(e => ({
        ...e,
        context: e.context ? JSON.parse(e.context) : null,
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    apiLogger.error('Error fetching trust history:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid parameters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch trust history' });
  }
});

/**
 * GET /api/trust/relationship/:partyId
 * Get relationship trust with a specific buyer/seller
 */
router.get('/relationship/:partyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const partyId = req.params.partyId as string;
    const relationship = await getRelationshipTrust(partyId, userId);

    return res.json(relationship);
  } catch (error) {
    apiLogger.error('Error fetching relationship trust:', error);
    return res.status(500).json({ error: 'Failed to fetch relationship trust' });
  }
});

/**
 * GET /api/trust/rate-limits
 * Get current rate limit status
 */
router.get('/rate-limits', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rateLimits = await scaleSafetyService.getRateLimitStatus(userId);

    return res.json(rateLimits);
  } catch (error) {
    apiLogger.error('Error fetching rate limits:', error);
    return res.status(500).json({ error: 'Failed to fetch rate limits' });
  }
});

/**
 * GET /api/trust/feature/:feature
 * Check access to a feature based on trust
 */
router.get('/feature/:feature', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const feature = req.params.feature as string;
    const access = await scaleSafetyService.checkFeatureAccess(userId, feature);

    return res.json(access);
  } catch (error) {
    apiLogger.error('Error checking feature access:', error);
    return res.status(500).json({ error: 'Failed to check feature access' });
  }
});

// =============================================================================
// Admin Routes
// =============================================================================

/**
 * GET /api/trust/admin/alerts
 * Get active alerts (admin only)
 */
router.get('/admin/alerts', requirePortalAuth(), requirePortalRole('admin', 'staff'), async (req: PortalAuthRequest, res: Response) => {
  try {
    const alerts = await scaleSafetyService.getActiveAlerts({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });

    return res.json(alerts);
  } catch (error) {
    apiLogger.error('Error fetching alerts:', error);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /api/trust/admin/alerts/stats
 * Get alert statistics (admin only)
 */
router.get('/admin/alerts/stats', requirePortalAuth(), requirePortalRole('admin', 'staff'), async (req: PortalAuthRequest, res: Response) => {
  try {
    const stats = await scaleSafetyService.getAlertStats();

    return res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching alert stats:', error);
    return res.status(500).json({ error: 'Failed to fetch alert statistics' });
  }
});

/**
 * POST /api/trust/admin/alerts/:id/acknowledge
 * Acknowledge an alert (admin only)
 */
router.post('/admin/alerts/:id/acknowledge', requirePortalAuth(), requirePortalRole('admin', 'staff'), async (req: PortalAuthRequest, res: Response) => {
  try {
    const adminId = req.portalUser!.id;
    const result = await scaleSafetyService.acknowledgeAlert(req.params.id as string, adminId);

    if (!result.success) {
      return res.status(400).json({ error: 'Failed to acknowledge alert' });
    }

    return res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error acknowledging alert:', error);
    return res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

/**
 * POST /api/trust/admin/alerts/:id/resolve
 * Resolve an alert (admin only)
 */
router.post('/admin/alerts/:id/resolve', requirePortalAuth(), requirePortalRole('admin', 'staff'), async (req: PortalAuthRequest, res: Response) => {
  try {
    const adminId = req.portalUser!.id;
    const resolution = req.body.resolution as string | undefined;

    const result = await scaleSafetyService.resolveAlert(req.params.id as string, adminId, resolution);

    if (!result.success) {
      return res.status(400).json({ error: 'Failed to resolve alert' });
    }

    return res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error resolving alert:', error);
    return res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * POST /api/trust/admin/seller/:sellerId/soft-cap
 * Apply soft cap to a seller (admin only)
 */
router.post('/admin/seller/:sellerId/soft-cap', requirePortalAuth(), requirePortalRole('admin'), async (req: PortalAuthRequest, res: Response) => {
  try {
    const reason = req.body.reason as string;
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const result = await scaleSafetyService.applySoftCap(req.params.sellerId as string, reason);

    if (!result.success) {
      return res.status(400).json({ error: 'Failed to apply soft cap' });
    }

    return res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error applying soft cap:', error);
    return res.status(500).json({ error: 'Failed to apply soft cap' });
  }
});

/**
 * DELETE /api/trust/admin/seller/:sellerId/soft-cap
 * Remove soft cap from a seller (admin only)
 */
router.delete('/admin/seller/:sellerId/soft-cap', requirePortalAuth(), requirePortalRole('admin'), async (req: PortalAuthRequest, res: Response) => {
  try {
    const result = await scaleSafetyService.removeSoftCap(req.params.sellerId as string);

    if (!result.success) {
      return res.status(400).json({ error: 'Failed to remove soft cap' });
    }

    return res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error removing soft cap:', error);
    return res.status(500).json({ error: 'Failed to remove soft cap' });
  }
});

export default router;
