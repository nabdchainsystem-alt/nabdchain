// =============================================================================
// Invoice Routes - Marketplace Invoice API (Stage 6)
// =============================================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { marketplaceInvoiceService, InvoiceStatus } from '../services/marketplaceInvoiceService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const invoiceFiltersSchema = z.object({
  status: z.enum(['draft', 'issued', 'paid', 'overdue', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  overdueOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const cancelInvoiceSchema = z.object({
  reason: z.string().min(1).max(500),
});

// =============================================================================
// Seller Invoice Routes
// =============================================================================

/**
 * GET /api/invoices/seller
 * Get all invoices for the authenticated seller
 */
router.get('/seller', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = invoiceFiltersSchema.parse(req.query);
    const result = await marketplaceInvoiceService.getSellerInvoices(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching seller invoices:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/invoices/seller/stats
 * Get seller invoice statistics
 */
router.get('/seller/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await marketplaceInvoiceService.getSellerInvoiceStats(userId);
    return res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching seller invoice stats:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice statistics' });
  }
});

/**
 * GET /api/invoices/seller/:id
 * Get single invoice for seller
 */
router.get('/seller/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await marketplaceInvoiceService.getInvoice(String(req.params.id), userId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(invoice);
  } catch (error) {
    apiLogger.error('Error fetching invoice:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

/**
 * POST /api/invoices/seller/:id/issue
 * Issue an invoice (freeze content, start payment terms)
 */
router.post('/seller/:id/issue', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await marketplaceInvoiceService.issueInvoice({
      invoiceId: String(req.params.id),
      sellerId: userId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.invoice);
  } catch (error) {
    apiLogger.error('Error issuing invoice:', error);
    return res.status(500).json({ error: 'Failed to issue invoice' });
  }
});

/**
 * POST /api/invoices/seller/:id/cancel
 * Cancel a draft invoice
 */
router.post('/seller/:id/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = cancelInvoiceSchema.parse(req.body);

    const result = await marketplaceInvoiceService.cancelInvoice({
      invoiceId: String(req.params.id),
      sellerId: userId,
      reason: body.reason,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.invoice);
  } catch (error) {
    apiLogger.error('Error cancelling invoice:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to cancel invoice' });
  }
});

/**
 * GET /api/invoices/seller/:id/history
 * Get invoice event history
 */
router.get('/seller/:id/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const events = await marketplaceInvoiceService.getInvoiceHistory(String(req.params.id), userId);
    return res.json(events);
  } catch (error) {
    apiLogger.error('Error fetching invoice history:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice history' });
  }
});

// =============================================================================
// Buyer Invoice Routes
// =============================================================================

/**
 * GET /api/invoices/buyer
 * Get all invoices for the authenticated buyer
 */
router.get('/buyer', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = invoiceFiltersSchema.parse(req.query);
    const result = await marketplaceInvoiceService.getBuyerInvoices(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching buyer invoices:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/invoices/buyer/stats
 * Get buyer invoice statistics
 */
router.get('/buyer/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await marketplaceInvoiceService.getBuyerInvoiceStats(userId);
    return res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching buyer invoice stats:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice statistics' });
  }
});

/**
 * GET /api/invoices/buyer/:id
 * Get single invoice for buyer
 */
router.get('/buyer/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await marketplaceInvoiceService.getInvoice(String(req.params.id), userId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(invoice);
  } catch (error) {
    apiLogger.error('Error fetching invoice:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// =============================================================================
// Order-based Invoice Routes
// =============================================================================

/**
 * GET /api/invoices/order/:orderId
 * Get invoice for a specific order
 */
router.get('/order/:orderId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await marketplaceInvoiceService.getInvoiceByOrder(String(req.params.orderId), userId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found for this order' });
    }

    return res.json(invoice);
  } catch (error) {
    apiLogger.error('Error fetching invoice by order:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

/**
 * POST /api/invoices/generate/:orderId
 * Manually trigger invoice generation for an order
 * (Usually auto-triggered on delivery)
 */
router.post('/generate/:orderId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Note: This could be restricted to sellers only
    const result = await marketplaceInvoiceService.createFromDeliveredOrder(String(req.params.orderId));

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.invoice);
  } catch (error) {
    apiLogger.error('Error generating invoice:', error);
    return res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

export default router;
