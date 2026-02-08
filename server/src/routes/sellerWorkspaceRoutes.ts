// =============================================================================
// Seller Workspace Routes - Execution Layer API
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import sellerWorkspaceService, {
  InvoiceStatus,
  StockAdjustmentReason,
  CostType,
} from '../services/sellerWorkspaceService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const invoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'cancelled', 'overdue']);
const stockReasonEnum = z.enum([
  'received',
  'sold',
  'damaged',
  'returned',
  'correction',
  'reserved',
  'released',
  'other',
]);
const costTypeEnum = z.enum([
  'purchase',
  'shipping',
  'customs',
  'storage',
  'marketing',
  'platform_fee',
  'other',
]);

const lineItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

const createInvoiceSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(50).optional(),
  customerCompany: z.string().max(200).optional(),
  lineItems: z.array(lineItemSchema).min(1),
  vatRate: z.number().min(0).max(100).default(15),
  currency: z.string().default('SAR'),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  termsAndConditions: z.string().max(5000).optional(),
});

// For updates: strip defaults so undefined fields don't overwrite existing values
const updateInvoiceSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(50).optional(),
  customerCompany: z.string().max(200).optional(),
  lineItems: z.array(lineItemSchema).min(1),
  vatRate: z.number().min(0).max(100),
  currency: z.string(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  termsAndConditions: z.string().max(5000).optional(),
}).partial().extend({
  status: invoiceStatusEnum.optional(),
});

const stockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  adjustmentQty: z.number().int(),
  reason: stockReasonEnum,
  notes: z.string().max(1000).optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

const costTagSchema = z.object({
  itemId: z.string().uuid(),
  costType: costTypeEnum,
  amount: z.number().min(0),
  currency: z.string().default('SAR'),
  date: z.string().datetime().optional(),
  vendor: z.string().max(200).optional(),
  invoiceRef: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  quantityAffected: z.number().int().min(0).optional(),
});

const buyerProfileSchema = z.object({
  buyerId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  paymentRating: z.number().int().min(1).max(5).optional(),
});

// =============================================================================
// Invoice Routes
// =============================================================================

/**
 * GET /api/seller/workspace/invoices
 * Get all invoices for the seller
 */
router.get('/workspace/invoices', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status, search, dateFrom, dateTo } = req.query;

    const invoices = await sellerWorkspaceService.getInvoices(sellerId, {
      status: status as InvoiceStatus | undefined,
      search: search as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });

    res.json(invoices);
  } catch (error) {
    apiLogger.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/seller/workspace/invoices/:id
 * Get a single invoice
 */
router.get('/workspace/invoices/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const invoiceId = req.params.id as string;

    const invoice = await sellerWorkspaceService.getInvoice(sellerId, invoiceId);

    res.json(invoice);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invoice not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

/**
 * POST /api/seller/workspace/invoices
 * Create a new invoice
 */
router.post('/workspace/invoices', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = createInvoiceSchema.parse(req.body);

    const invoice = await sellerWorkspaceService.createInvoice(sellerId, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });

    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

/**
 * PUT /api/seller/workspace/invoices/:id
 * Update an invoice
 */
router.put('/workspace/invoices/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const invoiceId = req.params.id as string;
    const data = updateInvoiceSchema.parse(req.body);

    const invoice = await sellerWorkspaceService.updateInvoice(sellerId, invoiceId, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });

    res.json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('non-draft')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

/**
 * DELETE /api/seller/workspace/invoices/:id
 * Delete a draft invoice
 */
router.delete('/workspace/invoices/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const invoiceId = req.params.id as string;

    await sellerWorkspaceService.deleteInvoice(sellerId, invoiceId);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('draft')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// =============================================================================
// Stock Adjustment Routes
// =============================================================================

/**
 * GET /api/seller/workspace/stock-adjustments
 * Get stock adjustments
 */
router.get('/workspace/stock-adjustments', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { itemId, reason, dateFrom, dateTo } = req.query;

    const adjustments = await sellerWorkspaceService.getStockAdjustments(sellerId, {
      itemId: itemId as string | undefined,
      reason: reason as StockAdjustmentReason | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });

    res.json(adjustments);
  } catch (error) {
    apiLogger.error('Error fetching stock adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch stock adjustments' });
  }
});

/**
 * POST /api/seller/workspace/stock-adjustments
 * Create a stock adjustment
 */
router.post('/workspace/stock-adjustments', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = stockAdjustmentSchema.parse(req.body);

    const result = await sellerWorkspaceService.adjustStock(sellerId, data);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Item not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error creating stock adjustment:', error);
    res.status(500).json({ error: 'Failed to create stock adjustment' });
  }
});

/**
 * GET /api/seller/workspace/inventory
 * Get inventory with stock status
 */
router.get('/workspace/inventory', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const inventory = await sellerWorkspaceService.getInventoryWithStatus(sellerId);

    res.json(inventory);
  } catch (error) {
    apiLogger.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// =============================================================================
// Cost Tag Routes
// =============================================================================

/**
 * GET /api/seller/workspace/cost-tags
 * Get cost tags
 */
router.get('/workspace/cost-tags', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { itemId, costType, dateFrom, dateTo } = req.query;

    const costTags = await sellerWorkspaceService.getCostTags(sellerId, {
      itemId: itemId as string | undefined,
      costType: costType as CostType | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });

    res.json(costTags);
  } catch (error) {
    apiLogger.error('Error fetching cost tags:', error);
    res.status(500).json({ error: 'Failed to fetch cost tags' });
  }
});

/**
 * POST /api/seller/workspace/cost-tags
 * Add a cost tag
 */
router.post('/workspace/cost-tags', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = costTagSchema.parse(req.body);

    const costTag = await sellerWorkspaceService.addCostTag(sellerId, {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    });

    res.status(201).json(costTag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Item not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error creating cost tag:', error);
    res.status(500).json({ error: 'Failed to create cost tag' });
  }
});

/**
 * GET /api/seller/workspace/cost-summary
 * Get cost summary by type
 */
router.get('/workspace/cost-summary', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { itemId } = req.query;

    const summary = await sellerWorkspaceService.getCostSummary(
      sellerId,
      itemId as string | undefined
    );

    res.json(summary);
  } catch (error) {
    apiLogger.error('Error fetching cost summary:', error);
    res.status(500).json({ error: 'Failed to fetch cost summary' });
  }
});

/**
 * DELETE /api/seller/workspace/cost-tags/:id
 * Delete a cost tag
 */
router.delete('/workspace/cost-tags/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const costTagId = req.params.id as string;

    await sellerWorkspaceService.deleteCostTag(sellerId, costTagId);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cost tag not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error deleting cost tag:', error);
    res.status(500).json({ error: 'Failed to delete cost tag' });
  }
});

/**
 * GET /api/seller/workspace/items/:id/margin
 * Calculate margin for an item
 */
router.get('/workspace/items/:id/margin', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const itemId = req.params.id as string;

    const margin = await sellerWorkspaceService.calculateItemMargin(sellerId, itemId);

    res.json(margin);
  } catch (error) {
    if (error instanceof Error && error.message === 'Item not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error calculating margin:', error);
    res.status(500).json({ error: 'Failed to calculate margin' });
  }
});

// =============================================================================
// Buyer Profile Routes
// =============================================================================

/**
 * GET /api/seller/workspace/buyer-profiles
 * Get buyer profiles
 */
router.get('/workspace/buyer-profiles', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { search, rating } = req.query;

    const profiles = await sellerWorkspaceService.getBuyerProfiles(sellerId, {
      search: search as string | undefined,
      rating: rating ? parseInt(rating as string, 10) : undefined,
    });

    res.json(profiles);
  } catch (error) {
    apiLogger.error('Error fetching buyer profiles:', error);
    res.status(500).json({ error: 'Failed to fetch buyer profiles' });
  }
});

/**
 * GET /api/seller/workspace/buyer-profiles/:id
 * Get a single buyer profile with order history
 */
router.get('/workspace/buyer-profiles/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const profileId = req.params.id as string;

    const profile = await sellerWorkspaceService.getBuyerProfile(sellerId, profileId);

    res.json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === 'Profile not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error fetching buyer profile:', error);
    res.status(500).json({ error: 'Failed to fetch buyer profile' });
  }
});

/**
 * POST /api/seller/workspace/buyer-profiles
 * Create or update a buyer profile
 */
router.post('/workspace/buyer-profiles', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = buyerProfileSchema.parse(req.body);

    const profile = await sellerWorkspaceService.upsertBuyerProfile(sellerId, data);

    res.status(201).json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating buyer profile:', error);
    res.status(500).json({ error: 'Failed to create buyer profile' });
  }
});

/**
 * DELETE /api/seller/workspace/buyer-profiles/:id
 * Delete a buyer profile
 */
router.delete('/workspace/buyer-profiles/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const profileId = req.params.id as string;

    await sellerWorkspaceService.deleteBuyerProfile(sellerId, profileId);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Profile not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error deleting buyer profile:', error);
    res.status(500).json({ error: 'Failed to delete buyer profile' });
  }
});

export default router;
