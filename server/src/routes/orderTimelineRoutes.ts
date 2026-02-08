// =============================================================================
// Order Timeline Routes
// =============================================================================
// API endpoints for order timeline, SLA tracking, and risk assessment
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { apiLogger } from '../utils/logger';
import {
  orderTimelineService,
  DelayReasonCode,
  TimelineStepKey,
} from '../services/orderTimelineService';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const delayReasonSchema = z.object({
  reasonCode: z.enum([
    'supplier_stockout',
    'production_delay',
    'carrier_delay',
    'customs_clearance',
    'weather',
    'buyer_request',
    'internal_processing',
    'quality_check',
    'address_issue',
    'payment_hold',
    'documentation',
    'other',
  ] as const),
  customReason: z.string().optional(),
  affectedStep: z.enum([
    'order_created',
    'payment_received',
    'seller_confirmed',
    'processing_started',
    'ready_to_ship',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'completed',
  ] as const),
  estimatedResolution: z.string().optional(),
  impactDays: z.number().int().min(1).max(90),
  notes: z.string().optional(),
});

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/orders/timeline/:orderId
 * Get complete timeline for an order including risk assessment
 */
router.get('/timeline/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const sellerId = (req as AuthRequest).auth?.userId;

    if (!sellerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const timeline = await orderTimelineService.buildOrderTimeline(orderId);

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    apiLogger.error('Error fetching order timeline:', error);
    res.status(500).json({
      error: 'Failed to fetch order timeline',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/orders/:orderId/delay
 * Report a delay on an order
 */
router.post('/:orderId/delay', requireAuth, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const sellerId = (req as AuthRequest).auth?.userId;

    if (!sellerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate request body
    const validatedData = delayReasonSchema.parse(req.body);

    await orderTimelineService.recordOrderDelay(orderId, sellerId, {
      ...validatedData,
      estimatedResolution: validatedData.estimatedResolution
        ? new Date(validatedData.estimatedResolution)
        : undefined,
    });

    res.json({
      success: true,
      message: 'Delay reported successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    }
    apiLogger.error('Error reporting delay:', error);
    res.status(500).json({
      error: 'Failed to report delay',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/orders/at-risk
 * Get orders that are at risk or have SLA breaches
 */
router.get('/at-risk', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth?.userId;

    if (!sellerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { includeAtRisk, includeCritical } = req.query;

    const orders = await orderTimelineService.getOrdersAtRisk(sellerId, {
      includeAtRisk: includeAtRisk !== 'false',
      includeCritical: includeCritical !== 'false',
    });

    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching at-risk orders:', error);
    res.status(500).json({
      error: 'Failed to fetch at-risk orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/orders/sla-summary
 * Get SLA breach summary for seller dashboard
 */
router.get('/sla-summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth?.userId;

    if (!sellerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { period } = req.query;
    const validPeriod = ['week', 'month', 'quarter'].includes(period as string)
      ? (period as 'week' | 'month' | 'quarter')
      : 'month';

    const summary = await orderTimelineService.getSLABreachSummary(sellerId, validPeriod);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    apiLogger.error('Error fetching SLA summary:', error);
    res.status(500).json({
      error: 'Failed to fetch SLA summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/orders/seller-performance
 * Get seller performance statistics
 */
router.get('/seller-performance', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth?.userId;

    if (!sellerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await orderTimelineService.getSellerPerformanceStats(sellerId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    apiLogger.error('Error fetching seller performance:', error);
    res.status(500).json({
      error: 'Failed to fetch seller performance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
