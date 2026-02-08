// =============================================================================
// Dispute Routes - Marketplace Dispute API (Stage 7)
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { idempotency } from '../middleware/idempotencyMiddleware';
import { disputeService } from '../services/disputeService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const disputeFiltersSchema = z.object({
  status: z.enum(['open', 'under_review', 'seller_responded', 'resolved', 'rejected', 'escalated', 'closed']).optional(),
  reason: z.enum(['wrong_item', 'damaged_goods', 'missing_quantity', 'late_delivery', 'quality_issue', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createDisputeSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.enum(['wrong_item', 'damaged_goods', 'missing_quantity', 'late_delivery', 'quality_issue', 'other']),
  description: z.string().min(10).max(2000),
  requestedResolution: z.string().max(500).optional(),
  requestedAmount: z.number().positive().optional(),
  evidence: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    uploadedAt: z.string(),
  })).optional(),
});

const sellerRespondSchema = z.object({
  responseType: z.enum(['accept_responsibility', 'reject', 'propose_resolution']),
  response: z.string().min(10).max(2000),
  proposedResolution: z.string().max(500).optional(),
  proposedAmount: z.number().positive().optional(),
});

const rejectResolutionSchema = z.object({
  reason: z.string().min(10).max(500),
});

const escalateDisputeSchema = z.object({
  reason: z.string().min(10).max(500),
});

const addEvidenceSchema = z.object({
  evidence: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    uploadedAt: z.string(),
  })).min(1),
});

// =============================================================================
// Buyer Dispute Routes
// =============================================================================

/**
 * POST /api/disputes/buyer
 * Create a new dispute on an order
 * Protected by idempotency to prevent duplicate disputes
 */
router.post('/buyer', requireAuth, idempotency({ required: true, entityType: 'dispute' }), async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = createDisputeSchema.parse(req.body);

    const result = await disputeService.createDispute({
      ...body,
      buyerId: userId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.dispute);
  } catch (error) {
    apiLogger.error('Error creating dispute:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to create dispute' });
  }
});

/**
 * GET /api/disputes/buyer
 * List disputes for the authenticated buyer
 */
router.get('/buyer', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = disputeFiltersSchema.parse(req.query);
    const result = await disputeService.getBuyerDisputes(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching buyer disputes:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

/**
 * GET /api/disputes/buyer/stats
 * Get dispute statistics for the buyer
 */
router.get('/buyer/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await disputeService.getBuyerDisputeStats(userId);
    return res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching buyer dispute stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dispute statistics' });
  }
});

/**
 * GET /api/disputes/buyer/:id
 * Get a single dispute for the buyer
 */
router.get('/buyer/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dispute = await disputeService.getDispute(String(req.params.id), userId);

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    return res.json(dispute);
  } catch (error) {
    apiLogger.error('Error fetching dispute:', error);
    return res.status(500).json({ error: 'Failed to fetch dispute' });
  }
});

/**
 * POST /api/disputes/buyer/:id/accept
 * Buyer accepts seller's proposed resolution
 */
router.post('/buyer/:id/accept', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await disputeService.buyerAcceptResolution(String(req.params.id), userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.dispute);
  } catch (error) {
    apiLogger.error('Error accepting resolution:', error);
    return res.status(500).json({ error: 'Failed to accept resolution' });
  }
});

/**
 * POST /api/disputes/buyer/:id/reject
 * Buyer rejects seller's response
 */
router.post('/buyer/:id/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = rejectResolutionSchema.parse(req.body);

    const result = await disputeService.buyerRejectResolution(
      String(req.params.id),
      userId,
      body.reason
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.dispute);
  } catch (error) {
    apiLogger.error('Error rejecting resolution:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to reject resolution' });
  }
});

/**
 * POST /api/disputes/buyer/:id/escalate
 * Buyer escalates dispute to platform
 */
router.post('/buyer/:id/escalate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = escalateDisputeSchema.parse(req.body);

    const result = await disputeService.escalateDispute(
      String(req.params.id),
      userId,
      body.reason
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.dispute);
  } catch (error) {
    apiLogger.error('Error escalating dispute:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to escalate dispute' });
  }
});

/**
 * POST /api/disputes/buyer/:id/evidence
 * Buyer adds evidence to dispute
 */
router.post('/buyer/:id/evidence', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = addEvidenceSchema.parse(req.body);

    const result = await disputeService.addEvidence(
      String(req.params.id),
      userId,
      body.evidence
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.dispute);
  } catch (error) {
    apiLogger.error('Error adding evidence:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to add evidence' });
  }
});

/**
 * POST /api/disputes/buyer/:id/close
 * Buyer closes dispute
 */
router.post('/buyer/:id/close', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await disputeService.closeDispute(String(req.params.id), userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.dispute);
  } catch (error) {
    apiLogger.error('Error closing dispute:', error);
    return res.status(500).json({ error: 'Failed to close dispute' });
  }
});

// =============================================================================
// Seller Dispute Routes
// =============================================================================

/**
 * GET /api/disputes/seller
 * List disputes for the authenticated seller
 */
router.get('/seller', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = disputeFiltersSchema.parse(req.query);
    const result = await disputeService.getSellerDisputes(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching seller disputes:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

/**
 * GET /api/disputes/seller/stats
 * Get dispute statistics for the seller
 */
router.get('/seller/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await disputeService.getSellerDisputeStats(userId);
    return res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching seller dispute stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dispute statistics' });
  }
});

/**
 * GET /api/disputes/seller/:id
 * Get a single dispute for the seller
 */
router.get('/seller/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dispute = await disputeService.getDispute(String(req.params.id), userId);

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    return res.json(dispute);
  } catch (error) {
    apiLogger.error('Error fetching dispute:', error);
    return res.status(500).json({ error: 'Failed to fetch dispute' });
  }
});

/**
 * POST /api/disputes/seller/:id/review
 * Seller marks dispute as under review
 */
router.post('/seller/:id/review', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await disputeService.markAsUnderReview(String(req.params.id), userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.dispute);
  } catch (error) {
    apiLogger.error('Error marking dispute as under review:', error);
    return res.status(500).json({ error: 'Failed to update dispute' });
  }
});

/**
 * POST /api/disputes/seller/:id/respond
 * Seller responds to dispute
 */
router.post('/seller/:id/respond', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = sellerRespondSchema.parse(req.body);

    const result = await disputeService.sellerRespond({
      disputeId: String(req.params.id),
      sellerId: userId,
      ...body,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.dispute);
  } catch (error) {
    apiLogger.error('Error submitting seller response:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to submit response' });
  }
});

/**
 * POST /api/disputes/seller/:id/escalate
 * Seller escalates dispute to platform
 */
router.post('/seller/:id/escalate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = escalateDisputeSchema.parse(req.body);

    const result = await disputeService.escalateDispute(
      String(req.params.id),
      userId,
      body.reason
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.dispute);
  } catch (error) {
    apiLogger.error('Error escalating dispute:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to escalate dispute' });
  }
});

// =============================================================================
// Shared Routes
// =============================================================================

/**
 * GET /api/disputes/:id/history
 * Get dispute timeline/history
 */
router.get('/:id/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await disputeService.getDisputeHistory(String(req.params.id), userId);

    return res.json(history);
  } catch (error) {
    apiLogger.error('Error fetching dispute history:', error);
    return res.status(500).json({ error: 'Failed to fetch dispute history' });
  }
});

/**
 * GET /api/disputes/order/:orderId
 * Get dispute for a specific order
 */
router.get('/order/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dispute = await disputeService.getDisputeByOrder(String(req.params.orderId), userId);

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    return res.json(dispute);
  } catch (error) {
    apiLogger.error('Error fetching dispute by order:', error);
    return res.status(500).json({ error: 'Failed to fetch dispute' });
  }
});

export default router;
