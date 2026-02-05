// =============================================================================
// Payout Routes - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { idempotency } from '../middleware/idempotencyMiddleware';
import { sellerPayoutService } from '../services/sellerPayoutService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const payoutFiltersSchema = z.object({
  status: z.enum(['pending', 'processing', 'settled', 'on_hold', 'failed']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateSettingsSchema = z.object({
  payoutFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  payoutDay: z.number().int().min(1).max(28).optional(),
  minPayoutAmount: z.number().positive().optional(),
  disputeHoldEnabled: z.boolean().optional(),
  holdPeriodDays: z.number().int().min(1).max(30).optional(),
  autoPayoutEnabled: z.boolean().optional(),
});

const holdPayoutSchema = z.object({
  reason: z.string().min(5).max(500),
  holdUntil: z.string().datetime().optional(),
});

const settlePayoutSchema = z.object({
  bankReference: z.string().min(1).max(100),
});

const failPayoutSchema = z.object({
  reason: z.string().min(5).max(500),
});

// =============================================================================
// Seller Payout Routes
// =============================================================================

/**
 * GET /api/payouts/seller
 * List seller's payouts with pagination
 */
router.get('/seller', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = payoutFiltersSchema.parse(req.query);
    const result = await sellerPayoutService.getSellerPayouts(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching seller payouts:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

/**
 * GET /api/payouts/seller/stats
 * Get payout statistics for the seller
 */
router.get('/seller/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await sellerPayoutService.getPayoutStats(userId);
    return res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching payout stats:', error);
    return res.status(500).json({ error: 'Failed to fetch payout statistics' });
  }
});

/**
 * GET /api/payouts/seller/eligible
 * Check seller's eligible payout amount with enhanced withdrawal logic
 */
router.get('/seller/eligible', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const eligibility = await sellerPayoutService.getEnhancedEligibility(userId);
    return res.json(eligibility);
  } catch (error) {
    apiLogger.error('Error checking payout eligibility:', error);
    return res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

/**
 * GET /api/payouts/seller/timeline
 * Get funds timeline showing lifecycle of funds from order to payout
 */
router.get('/seller/timeline', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const timeline = await sellerPayoutService.getFundsTimeline(userId, limit);
    return res.json(timeline);
  } catch (error) {
    apiLogger.error('Error fetching funds timeline:', error);
    return res.status(500).json({ error: 'Failed to fetch funds timeline' });
  }
});

/**
 * GET /api/payouts/seller/settings
 * Get seller's payout settings
 */
router.get('/seller/settings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await sellerPayoutService.getPayoutSettings(userId);
    return res.json(settings);
  } catch (error) {
    apiLogger.error('Error fetching payout settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/payouts/seller/settings
 * Update seller's payout settings
 */
router.put('/seller/settings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const input = updateSettingsSchema.parse(req.body);
    const settings = await sellerPayoutService.updatePayoutSettings(userId, input);

    return res.json(settings);
  } catch (error) {
    apiLogger.error('Error updating payout settings:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * GET /api/payouts/seller/:id
 * Get a single payout details
 */
router.get('/seller/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payout = await sellerPayoutService.getPayoutDetails(
      String(req.params.id),
      userId
    );

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    return res.json(payout);
  } catch (error) {
    apiLogger.error('Error fetching payout:', error);
    return res.status(500).json({ error: 'Failed to fetch payout' });
  }
});

/**
 * GET /api/payouts/seller/:id/history
 * Get payout event history
 */
router.get('/seller/:id/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await sellerPayoutService.getPayoutHistory(
      String(req.params.id),
      userId
    );

    return res.json(history);
  } catch (error) {
    apiLogger.error('Error fetching payout history:', error);
    return res.status(500).json({ error: 'Failed to fetch payout history' });
  }
});

// =============================================================================
// Admin Payout Routes
// =============================================================================

/**
 * GET /api/payouts/admin/pending
 * List all pending payouts (admin only)
 */
router.get('/admin/pending', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add admin role check
    const payouts = await sellerPayoutService.getPendingPayouts();
    return res.json(payouts);
  } catch (error) {
    apiLogger.error('Error fetching pending payouts:', error);
    return res.status(500).json({ error: 'Failed to fetch pending payouts' });
  }
});

/**
 * GET /api/payouts/admin/status/:status
 * List payouts by status (admin only)
 */
router.get('/admin/status/:status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = req.params.status as 'pending' | 'processing' | 'settled' | 'on_hold' | 'failed';
    const validStatuses = ['pending', 'processing', 'settled', 'on_hold', 'failed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // TODO: Add admin role check
    const payouts = await sellerPayoutService.getPayoutsByStatus(status);
    return res.json(payouts);
  } catch (error) {
    apiLogger.error('Error fetching payouts by status:', error);
    return res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

/**
 * POST /api/payouts/admin/:id/approve
 * Approve a pending payout (admin only)
 */
router.post('/admin/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add admin role check
    const result = await sellerPayoutService.approvePayout(
      String(req.params.id),
      userId
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.payout);
  } catch (error) {
    apiLogger.error('Error approving payout:', error);
    return res.status(500).json({ error: 'Failed to approve payout' });
  }
});

/**
 * POST /api/payouts/admin/:id/process
 * Start processing a payout (admin only)
 */
router.post('/admin/:id/process', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add admin role check
    const result = await sellerPayoutService.processPayout(
      String(req.params.id),
      userId
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.payout);
  } catch (error) {
    apiLogger.error('Error processing payout:', error);
    return res.status(500).json({ error: 'Failed to process payout' });
  }
});

/**
 * POST /api/payouts/admin/:id/settle
 * Mark payout as settled (admin only)
 * Protected by idempotency to prevent duplicate settlements
 */
router.post('/admin/:id/settle', requireAuth, idempotency({ required: true, entityType: 'payout' }), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = settlePayoutSchema.parse(req.body);

    // TODO: Add admin role check
    const result = await sellerPayoutService.settlePayout(
      String(req.params.id),
      body.bankReference,
      userId
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.payout);
  } catch (error) {
    apiLogger.error('Error settling payout:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to settle payout' });
  }
});

/**
 * POST /api/payouts/admin/:id/hold
 * Put payout on hold (admin only)
 */
router.post('/admin/:id/hold', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = holdPayoutSchema.parse(req.body);

    // TODO: Add admin role check
    const result = await sellerPayoutService.holdPayout(
      String(req.params.id),
      body.reason,
      body.holdUntil ? new Date(body.holdUntil) : undefined,
      userId
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.payout);
  } catch (error) {
    apiLogger.error('Error holding payout:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to hold payout' });
  }
});

/**
 * POST /api/payouts/admin/:id/fail
 * Mark payout as failed (admin only)
 */
router.post('/admin/:id/fail', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = failPayoutSchema.parse(req.body);

    // TODO: Add admin role check
    const result = await sellerPayoutService.failPayout(
      String(req.params.id),
      body.reason,
      userId
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.payout);
  } catch (error) {
    apiLogger.error('Error failing payout:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fail payout' });
  }
});

/**
 * POST /api/payouts/admin/batch-create
 * Create batch payouts for all eligible sellers (admin only)
 */
router.post('/admin/batch-create', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add admin role check
    const result = await sellerPayoutService.createBatchPayouts(new Date());

    return res.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (error) {
    apiLogger.error('Error creating batch payouts:', error);
    return res.status(500).json({ error: 'Failed to create batch payouts' });
  }
});

export default router;
