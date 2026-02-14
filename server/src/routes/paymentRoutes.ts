// =============================================================================
// Payment Routes - Marketplace Payment API (Stage 6)
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { idempotency } from '../middleware/idempotencyMiddleware';
import { marketplacePaymentService, PaymentStatus, PaymentMethod } from '../services/marketplacePaymentService';
import { apiLogger } from '../utils/logger';
import { resolveBuyerId } from '../utils/resolveBuyerId';
import { prisma } from '../lib/prisma';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const paymentFiltersSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'failed']).optional(),
  invoiceId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['bank_transfer', 'card', 'wallet', 'cod']).default('bank_transfer'),
  bankReference: z.string().max(100).optional(),
  bankName: z.string().max(100).optional(),
});

const confirmPaymentSchema = z.object({
  confirmationNote: z.string().max(500).optional(),
});

const failPaymentSchema = z.object({
  reason: z.string().min(1).max(500),
});

// =============================================================================
// Invoice Payment Routes
// =============================================================================

/**
 * GET /api/payments/invoice/:invoiceId
 * Get all payments for an invoice
 */
router.get('/invoice/:invoiceId', requireAuth, async (req: Request, res: Response) => {
  try {
    // Resolve the user's profile ID (buyer or seller) for authorization
    const buyerId = await resolveBuyerId(req);
    // Try seller profile lookup
    const authUserId = (req as AuthRequest).auth?.userId;
    let sellerId: string | null = null;
    if (authUserId) {
      const seller = await prisma.sellerProfile.findFirst({
        where: { userId: authUserId },
        select: { id: true },
      });
      sellerId = seller?.id || null;
    }

    const userId = buyerId || sellerId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payments = await marketplacePaymentService.getInvoicePayments(
      String(req.params.invoiceId),
      userId
    );

    return res.json(payments);
  } catch (error) {
    apiLogger.error('Error fetching invoice payments:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// =============================================================================
// Buyer Payment Routes
// =============================================================================

/**
 * GET /api/payments/buyer
 * Get all payments for the authenticated buyer
 */
router.get('/buyer', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const filters = paymentFiltersSchema.parse(req.query);
    const result = await marketplacePaymentService.getBuyerPayments(buyerId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching buyer payments:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * POST /api/payments/buyer
 * Record a payment (buyer provides bank transfer reference)
 * Protected by idempotency to prevent duplicate payment records
 */
router.post('/buyer', requireAuth, idempotency({ required: true, entityType: 'payment' }), async (req: Request, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const body = recordPaymentSchema.parse(req.body);

    const result = await marketplacePaymentService.recordPayment({
      ...body,
      buyerId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.payment);
  } catch (error) {
    apiLogger.error('Error recording payment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to record payment' });
  }
});

/**
 * GET /api/payments/buyer/:id
 * Get single payment for buyer
 */
router.get('/buyer/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const payment = await marketplacePaymentService.getPayment(String(req.params.id), buyerId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.json(payment);
  } catch (error) {
    apiLogger.error('Error fetching payment:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// =============================================================================
// Seller Payment Routes
// =============================================================================

/**
 * GET /api/payments/seller
 * Get all payments for the authenticated seller
 */
router.get('/seller', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUserId = (req as AuthRequest).auth?.userId;
    if (!authUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId: authUserId },
      select: { id: true },
    });
    if (!seller) {
      return res.status(401).json({ error: 'Unauthorized - no seller profile found' });
    }

    const filters = paymentFiltersSchema.parse(req.query);
    const result = await marketplacePaymentService.getSellerPayments(seller.id, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching seller payments:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * GET /api/payments/seller/:id
 * Get single payment for seller
 */
router.get('/seller/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUserId = (req as AuthRequest).auth?.userId;
    if (!authUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId: authUserId },
      select: { id: true },
    });
    const sellerId = seller?.id || authUserId;

    const payment = await marketplacePaymentService.getPayment(String(req.params.id), sellerId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.json(payment);
  } catch (error) {
    apiLogger.error('Error fetching payment:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

/**
 * POST /api/payments/seller/:id/confirm
 * Confirm a payment (seller verifies bank transfer received)
 */
router.post('/seller/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUserId = (req as AuthRequest).auth?.userId;
    if (!authUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId: authUserId },
      select: { id: true },
    });
    const sellerId = seller?.id || authUserId;

    const body = confirmPaymentSchema.parse(req.body);

    const result = await marketplacePaymentService.confirmPayment({
      paymentId: String(req.params.id),
      sellerId,
      confirmationNote: body.confirmationNote,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.payment);
  } catch (error) {
    apiLogger.error('Error confirming payment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/**
 * POST /api/payments/seller/:id/fail
 * Mark a payment as failed (seller could not verify)
 */
router.post('/seller/:id/fail', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUserId = (req as AuthRequest).auth?.userId;
    if (!authUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId: authUserId },
      select: { id: true },
    });
    const sellerId = seller?.id || authUserId;

    const body = failPaymentSchema.parse(req.body);

    const result = await marketplacePaymentService.failPayment({
      paymentId: String(req.params.id),
      sellerId,
      reason: body.reason,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.payment);
  } catch (error) {
    apiLogger.error('Error failing payment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to update payment' });
  }
});

export default router;
