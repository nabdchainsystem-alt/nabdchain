// =============================================================================
// Rating Routes — Mutual Buyer ↔ Seller Ratings
// =============================================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ratingService } from '../services/ratingService';
import { apiLogger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const router = Router();

// =============================================================================
// Helpers
// =============================================================================

/**
 * Determine caller's portal role and relevant ID from the order.
 * Falls back to checking order ownership if portalAuth is not available.
 */
async function resolveCallerRole(
  req: AuthRequest,
  orderId: string,
): Promise<{ role: 'buyer' | 'seller'; userId: string } | null> {
  const userId = req.auth.userId;

  // Check portalAuth first (portal JWT has explicit role)
  const portalAuth = (req as any).portalAuth;
  if (portalAuth?.portalRole === 'buyer' || portalAuth?.portalRole === 'seller') {
    return { role: portalAuth.portalRole, userId };
  }

  // Fallback: determine from order ownership
  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true },
  });

  if (!order) return null;

  if (order.buyerId === userId) return { role: 'buyer', userId };
  if (order.sellerId === userId) return { role: 'seller', userId };

  return null;
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/ratings/eligibility?orderId=...
 * Check if the current user can rate for this order.
 */
router.get('/eligibility', requireAuth, async (req, res: Response) => {
  try {
    const orderId = req.query.orderId as string;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId query parameter is required' });
    }

    const eligibility = await ratingService.checkEligibility(orderId);
    res.json(eligibility);
  } catch (error) {
    apiLogger.error('Rating eligibility check failed:', error);
    res.status(500).json({ error: 'Failed to check rating eligibility' });
  }
});

/**
 * POST /api/ratings/order/:orderId
 * Submit a rating for an order. Role is auto-detected from auth.
 */
router.post('/order/:orderId', requireAuth, async (req, res: Response) => {
  try {
    const orderId = req.params.orderId as string;

    const caller = await resolveCallerRole(req as AuthRequest, orderId);
    if (!caller) {
      return res.status(403).json({ error: 'You are not a party in this order' });
    }

    const schema = z.object({
      score: z.number().int().min(1).max(5),
      tags: z.array(z.string()).optional(),
      comment: z.string().max(280).optional(),
      ratingType: z.enum(['counterparty', 'order']).optional(),
    });

    const input = schema.parse(req.body);

    const rating = await ratingService.createRating(orderId, caller.userId, caller.role, input);

    // Return the rating with parsed tags
    res.status(201).json({
      ...rating,
      tags: rating.tags ? JSON.parse(rating.tags) : [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error) {
      if (error.message.includes('already rated')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('not the buyer') || error.message.includes('not the seller')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('must be delivered')) {
        return res.status(422).json({ error: error.message });
      }
    }
    apiLogger.error('Create rating failed:', error);
    res.status(500).json({ error: 'Failed to create rating' });
  }
});

/**
 * GET /api/ratings/target/:role/:id/summary
 * Get aggregated rating summary for a seller or buyer.
 */
router.get('/target/:role/:id/summary', requireAuth, async (req, res: Response) => {
  try {
    const role = req.params.role as string;
    const id = req.params.id as string;

    if (role !== 'SELLER' && role !== 'BUYER') {
      return res.status(400).json({ error: 'Role must be SELLER or BUYER' });
    }

    const summary = await ratingService.getTargetSummary(role, id);
    res.json(summary);
  } catch (error) {
    apiLogger.error('Get rating summary failed:', error);
    res.status(500).json({ error: 'Failed to get rating summary' });
  }
});

/**
 * GET /api/ratings/order/:orderId
 * Get both sides' ratings for an order.
 */
router.get('/order/:orderId', requireAuth, async (req, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const ratings = await ratingService.getOrderRatings(orderId);

    // Parse tags for both
    const format = (r: any) =>
      r
        ? {
            ...r,
            tags: r.tags ? JSON.parse(r.tags) : [],
          }
        : null;

    res.json({
      buyerRating: format(ratings.buyerRating),
      sellerRating: format(ratings.sellerRating),
      buyerOrderRating: format(ratings.buyerOrderRating),
      sellerOrderRating: format(ratings.sellerOrderRating),
    });
  } catch (error) {
    apiLogger.error('Get order ratings failed:', error);
    res.status(500).json({ error: 'Failed to get order ratings' });
  }
});

export default router;
