// =============================================================================
// Invoice Routes - Marketplace Invoice API (Stage 6)
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { PortalAuthRequest } from '../middleware/portalAdminMiddleware';
import { marketplaceInvoiceService, InvoiceStatus } from '../services/marketplaceInvoiceService';
import { exportService, InvoiceExportData } from '../services/exportService';
import { apiLogger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { resolveBuyerId } from '../utils/resolveBuyerId';

const router = Router();

// =============================================================================
// Helper: Resolve sellerId from portal auth or database lookup
// =============================================================================
async function resolveSellerId(req: Request): Promise<string | null> {
  // First check portal JWT token for sellerId
  const portalAuth = (req as PortalAuthRequest).portalAuth;
  if (portalAuth?.sellerId) {
    return portalAuth.sellerId;
  }

  // Fall back to looking up seller by userId
  const userId = (req as AuthRequest).auth?.userId;
  if (!userId) {
    return null;
  }

  // Look up SellerProfile by userId
  const seller = await prisma.sellerProfile.findFirst({
    where: { userId },
    select: { id: true },
  });

  return seller?.id || null;
}

// =============================================================================
// Helper: Resolve buyerId from portal auth or database lookup
// =============================================================================
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
router.get('/seller', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = await resolveSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - no seller profile found' });
    }

    const filters = invoiceFiltersSchema.parse(req.query);
    const result = await marketplaceInvoiceService.getSellerInvoices(sellerId, filters);

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
router.get('/seller/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = await resolveSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - no seller profile found' });
    }

    const stats = await marketplaceInvoiceService.getSellerInvoiceStats(sellerId);
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
router.get('/seller/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = await resolveSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - no seller profile found' });
    }

    const invoice = await marketplaceInvoiceService.getInvoice(String(req.params.id as string), sellerId);

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
router.post('/seller/:id/issue', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = await resolveSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - no seller profile found' });
    }

    const result = await marketplaceInvoiceService.issueInvoice({
      invoiceId: String(req.params.id as string),
      sellerId,
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
router.post('/seller/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = await resolveSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - no seller profile found' });
    }

    const body = cancelInvoiceSchema.parse(req.body);

    const result = await marketplaceInvoiceService.cancelInvoice({
      invoiceId: String(req.params.id as string),
      sellerId,
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
router.get('/seller/:id/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = await resolveSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - no seller profile found' });
    }

    const events = await marketplaceInvoiceService.getInvoiceHistory(String(req.params.id as string), sellerId);
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
router.get('/buyer', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const filters = invoiceFiltersSchema.parse(req.query);
    const result = await marketplaceInvoiceService.getBuyerInvoices(buyerId, filters);

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
router.get('/buyer/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const stats = await marketplaceInvoiceService.getBuyerInvoiceStats(buyerId);
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
router.get('/buyer/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const invoice = await marketplaceInvoiceService.getInvoice(String(req.params.id as string), buyerId);

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
router.get('/order/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    // Try to resolve either sellerId or buyerId - the user could be either
    const sellerId = await resolveSellerId(req);
    const buyerId = await resolveBuyerId(req);
    const userIdentifier = sellerId || buyerId;

    if (!userIdentifier) {
      return res.status(401).json({ error: 'Unauthorized - no seller or buyer profile found' });
    }

    const invoice = await marketplaceInvoiceService.getInvoiceByOrder(String(req.params.orderId), userIdentifier);

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
router.post('/generate/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    // Only sellers should be able to generate invoices
    const sellerId = await resolveSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - only sellers can generate invoices' });
    }

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

// =============================================================================
// Invoice PDF Routes
// =============================================================================

/**
 * Build InvoiceExportData from a MarketplaceInvoice record.
 * This transforms the DB record into the shape expected by PDFGenerator.
 */
async function buildInvoiceExportData(invoiceId: string): Promise<InvoiceExportData | null> {
  const invoice = await prisma.marketplaceInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: {
        where: { status: 'confirmed' },
        select: { amount: true },
      },
    },
  });

  if (!invoice) return null;

  const lineItems = JSON.parse(invoice.lineItems as string) as Array<{
    sku?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = Math.max(0, invoice.totalAmount - paidAmount);

  // Parse buyer address if stored as JSON
  let billingAddress = { line1: '', city: '', country: '' };
  if (invoice.buyerAddress) {
    try {
      const parsed = JSON.parse(invoice.buyerAddress);
      billingAddress = {
        line1: parsed.street1 || parsed.address || parsed.line1 || '',
        city: parsed.city || '',
        country: parsed.country || '',
      };
    } catch {
      billingAddress.line1 = invoice.buyerAddress;
    }
  }

  // Map payment terms to human-readable
  const termsMap: Record<string, string> = {
    NET_0: 'Due on receipt',
    NET_7: 'Net 7 days',
    NET_14: 'Net 14 days',
    NET_30: 'Net 30 days',
  };

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    orderNumber: invoice.orderNumber,
    status: invoice.status,
    seller: {
      id: invoice.sellerId,
      companyName: invoice.sellerCompany || invoice.sellerName,
      contactName: invoice.sellerName,
      email: '',
      taxId: invoice.sellerVatNumber || undefined,
    },
    buyer: {
      id: invoice.buyerId,
      companyName: invoice.buyerCompany || invoice.buyerName,
      contactName: invoice.buyerName,
      email: '',
    },
    billingAddress,
    items: lineItems.map((item, idx) => ({
      lineNumber: idx + 1,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unit: 'pcs',
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    subtotal: invoice.subtotal,
    taxRate: invoice.vatRate,
    taxAmount: invoice.vatAmount,
    shipping: 0,
    total: invoice.totalAmount,
    amountPaid: paidAmount,
    amountDue,
    currency: invoice.currency,
    issuedAt: invoice.issuedAt || invoice.createdAt,
    dueAt: invoice.dueDate || new Date(),
    paidAt: invoice.paidAt || undefined,
    paymentTerms: (invoice.paymentTerms && termsMap[invoice.paymentTerms]) || invoice.paymentTerms || 'Net 30 days',
  };
}

/**
 * GET /api/invoices/:id/pdf
 * Generate and download invoice PDF
 * Auth: buyer or seller of the invoice
 */
router.get('/:id/pdf', requireAuth, async (req: Request, res: Response) => {
  try {
    const invoiceId = String(req.params.id);

    // Resolve user identity
    const sellerId = await resolveSellerId(req);
    const buyerId = await resolveBuyerId(req);
    const userId = sellerId || buyerId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the user has access to this invoice
    const invoice = await prisma.marketplaceInvoice.findUnique({
      where: { id: invoiceId },
      select: { sellerId: true, buyerId: true, status: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.sellerId !== userId && invoice.buyerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this invoice' });
    }

    // Buyers can only see issued invoices or later
    if (invoice.buyerId === userId && invoice.status === 'draft') {
      return res.status(403).json({ error: 'Invoice is still in draft' });
    }

    // Build export data
    const exportData = await buildInvoiceExportData(invoiceId);
    if (!exportData) {
      return res.status(404).json({ error: 'Invoice data not found' });
    }

    // Generate PDF buffer
    const { buffer, mimeType, fileName } = await exportService.generateExportBuffer(
      'invoice',
      'pdf',
      exportData,
    );

    // Stream the PDF back
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } catch (error) {
    apiLogger.error('Error generating invoice PDF:', error);
    return res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
});

export default router;
