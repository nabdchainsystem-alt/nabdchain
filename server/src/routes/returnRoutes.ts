// =============================================================================
// Return Routes - Marketplace Return API (Stage 7)
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { returnService } from '../services/returnService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const returnFiltersSchema = z.object({
  status: z.enum(['requested', 'approved', 'rejected', 'in_transit', 'received', 'refund_processed', 'closed']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createReturnSchema = z.object({
  disputeId: z.string().uuid(),
  returnType: z.enum(['full_return', 'partial_return', 'replacement_only']),
  returnItems: z.array(z.object({
    itemId: z.string(),
    itemName: z.string(),
    sku: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

const approveReturnSchema = z.object({
  returnAddress: z.object({
    name: z.string().min(1).max(100),
    company: z.string().max(100).optional(),
    street1: z.string().min(1).max(200),
    street2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(1).max(100),
    phone: z.string().max(20).optional(),
  }),
  approvalNotes: z.string().max(500).optional(),
});

const rejectReturnSchema = z.object({
  reason: z.string().min(10).max(500),
});

const shipReturnSchema = z.object({
  trackingNumber: z.string().min(1).max(100),
  carrier: z.string().max(100).optional(),
});

const receiveReturnSchema = z.object({
  condition: z.enum(['as_expected', 'damaged_in_transit', 'partial_received', 'other']),
  notes: z.string().max(500).optional(),
});

const processRefundSchema = z.object({
  amount: z.number().positive(),
});

// =============================================================================
// Buyer Return Routes
// =============================================================================

/**
 * GET /api/returns/buyer
 * List returns for the authenticated buyer
 */
router.get('/buyer', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = returnFiltersSchema.parse(req.query);
    const result = await returnService.getBuyerReturns(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching buyer returns:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

/**
 * GET /api/returns/buyer/:id
 * Get a single return for the buyer
 */
router.get('/buyer/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const returnRequest = await returnService.getReturn(String(req.params.id as string), userId);

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return not found' });
    }

    return res.json(returnRequest);
  } catch (error) {
    apiLogger.error('Error fetching return:', error);
    return res.status(500).json({ error: 'Failed to fetch return' });
  }
});

/**
 * POST /api/returns/buyer/:id/ship
 * Buyer marks return as shipped
 */
router.post('/buyer/:id/ship', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = shipReturnSchema.parse(req.body);

    const result = await returnService.markReturnShipped({
      returnId: String(req.params.id as string),
      buyerId: userId,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.return);
  } catch (error) {
    apiLogger.error('Error marking return as shipped:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to update return' });
  }
});

/**
 * GET /api/returns/buyer/:id/history
 * Get return history for buyer
 */
router.get('/buyer/:id/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await returnService.getReturnHistory(String(req.params.id as string), userId);

    return res.json(history);
  } catch (error) {
    apiLogger.error('Error fetching return history:', error);
    return res.status(500).json({ error: 'Failed to fetch return history' });
  }
});

// =============================================================================
// Seller Return Routes
// =============================================================================

/**
 * GET /api/returns/seller
 * List returns for the authenticated seller
 */
router.get('/seller', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = returnFiltersSchema.parse(req.query);
    const result = await returnService.getSellerReturns(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching seller returns:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

/**
 * GET /api/returns/seller/stats
 * Get return statistics for the seller
 */
router.get('/seller/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await returnService.getSellerReturnStats(userId);
    return res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching seller return stats:', error);
    return res.status(500).json({ error: 'Failed to fetch return statistics' });
  }
});

/**
 * GET /api/returns/seller/:id
 * Get a single return for the seller
 */
router.get('/seller/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const returnRequest = await returnService.getReturn(String(req.params.id as string), userId);

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return not found' });
    }

    return res.json(returnRequest);
  } catch (error) {
    apiLogger.error('Error fetching return:', error);
    return res.status(500).json({ error: 'Failed to fetch return' });
  }
});

/**
 * POST /api/returns/seller/:id/approve
 * Seller approves a return request
 */
router.post('/seller/:id/approve', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = approveReturnSchema.parse(req.body);

    const result = await returnService.approveReturn({
      returnId: String(req.params.id as string),
      sellerId: userId,
      returnAddress: body.returnAddress,
      approvalNotes: body.approvalNotes,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.return);
  } catch (error) {
    apiLogger.error('Error approving return:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to approve return' });
  }
});

/**
 * POST /api/returns/seller/:id/reject
 * Seller rejects a return request
 */
router.post('/seller/:id/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = rejectReturnSchema.parse(req.body);

    const result = await returnService.rejectReturn(
      String(req.params.id as string),
      userId,
      body.reason
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.return);
  } catch (error) {
    apiLogger.error('Error rejecting return:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to reject return' });
  }
});

/**
 * POST /api/returns/seller/:id/receive
 * Seller confirms return received
 */
router.post('/seller/:id/receive', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = receiveReturnSchema.parse(req.body);

    const result = await returnService.confirmReturnReceived({
      returnId: String(req.params.id as string),
      sellerId: userId,
      condition: body.condition,
      notes: body.notes,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.return);
  } catch (error) {
    apiLogger.error('Error confirming return receipt:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to confirm receipt' });
  }
});

/**
 * POST /api/returns/seller/:id/refund
 * Seller processes refund
 */
router.post('/seller/:id/refund', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = processRefundSchema.parse(req.body);

    const result = await returnService.processRefund(
      String(req.params.id as string),
      userId,
      body.amount
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.return);
  } catch (error) {
    apiLogger.error('Error processing refund:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to process refund' });
  }
});

/**
 * POST /api/returns/seller/:id/close
 * Seller closes a return
 */
router.post('/seller/:id/close', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await returnService.closeReturn(String(req.params.id as string), userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.return);
  } catch (error) {
    apiLogger.error('Error closing return:', error);
    return res.status(500).json({ error: 'Failed to close return' });
  }
});

/**
 * GET /api/returns/seller/:id/history
 * Get return history for seller
 */
router.get('/seller/:id/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await returnService.getReturnHistory(String(req.params.id as string), userId);

    return res.json(history);
  } catch (error) {
    apiLogger.error('Error fetching return history:', error);
    return res.status(500).json({ error: 'Failed to fetch return history' });
  }
});

// =============================================================================
// Shared Routes
// =============================================================================

/**
 * POST /api/returns
 * Create a return request (internal, typically called from dispute resolution)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = createReturnSchema.parse(req.body);

    const result = await returnService.createReturn(body);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.return);
  } catch (error) {
    apiLogger.error('Error creating return:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to create return' });
  }
});

/**
 * GET /api/returns/dispute/:disputeId
 * Get return for a specific dispute
 */
router.get('/dispute/:disputeId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const returnRequest = await returnService.getReturnByDispute(
      String(req.params.disputeId),
      userId
    );

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return not found' });
    }

    return res.json(returnRequest);
  } catch (error) {
    apiLogger.error('Error fetching return by dispute:', error);
    return res.status(500).json({ error: 'Failed to fetch return' });
  }
});

export default router;
