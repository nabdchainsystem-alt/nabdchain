// =============================================================================
// Portal Seller Routes - Consolidated Seller API Surface
// =============================================================================
// This file aggregates all seller-related endpoints under /api/portal/seller/*
// It calls existing services without refactoring internals.
// =============================================================================

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { apiLogger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';

// Import existing services (no rewrites, just call them)
import itemService from '../../services/itemService';
import { quoteService, QuoteStatus } from '../../services/quoteService';
import { marketplaceOrderService, OrderStatus } from '../../services/marketplaceOrderService';
import { marketplaceInvoiceService, InvoiceStatus } from '../../services/marketplaceInvoiceService';
import { sellerRfqInboxService, Stage2RFQStatus } from '../../services/sellerRfqInboxService';
import sellerHomeService from '../../services/sellerHomeService';
import { counterOfferService } from '../../services/counterOfferService';

const router = Router();

// =============================================================================
// ITEMS/LISTINGS - Manage seller's item catalog
// =============================================================================

/**
 * GET /api/portal/seller/items
 * Get all items for the seller
 */
router.get('/items', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status, visibility, category, search, page, limit } = req.query;

    const result = await itemService.getSellerItems(sellerId, {
      status: status as 'active' | 'draft' | 'archived' | 'out_of_stock' | undefined,
      visibility: visibility as 'public' | 'rfq_only' | 'hidden' | undefined,
      category: category as string,
      search: search as string,
    });

    res.json(result);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * GET /api/portal/seller/items/stats
 * Get item statistics - MUST come before /items/:id
 */
router.get('/items/stats', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const stats = await itemService.getSellerStats(sellerId);
    res.json(stats);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching item stats:', error);
    res.status(500).json({ error: 'Failed to fetch item stats' });
  }
});

/**
 * GET /api/portal/seller/items/:id
 * Get a specific item
 */
router.get('/items/:id', requireAuth, async (req, res: Response) => {
  try {
    const itemId = req.params.id;
    const item = await itemService.getMarketplaceItem(itemId as string);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify the seller owns this item
    const sellerId = (req as AuthRequest).auth.userId;
    if (item.userId !== sellerId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(item);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

/**
 * POST /api/portal/seller/items
 * Create a new item
 */
router.post('/items', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const item = await itemService.createItem(sellerId, req.body);
    res.status(201).json(item);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

/**
 * PUT /api/portal/seller/items/:id
 * Update an item
 */
router.put('/items/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const itemId = req.params.id;
    const item = await itemService.updateItem(itemId as string, sellerId, req.body);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/**
 * DELETE /api/portal/seller/items/:id
 * Delete an item
 */
router.delete('/items/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const itemId = req.params.id;
    await itemService.deleteItem(itemId as string, sellerId);
    res.json({ success: true });
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// =============================================================================
// RFQ INBOX - Manage incoming RFQs
// =============================================================================

/**
 * GET /api/portal/seller/rfq/inbox
 * Get paginated RFQ inbox
 */
router.get('/rfq/inbox', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status, isRead, isArchived, search, page, limit, sortBy, sortOrder } = req.query;

    const result = await sellerRfqInboxService.getInbox(sellerId, {
      status: status as Stage2RFQStatus | 'all' | undefined,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      isArchived: isArchived === 'true',
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as 'newest' | 'oldest' | 'priority' | undefined,
    });

    res.json(result);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching RFQ inbox:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ inbox' });
  }
});

/**
 * GET /api/portal/seller/rfq/inbox/:id
 * Get a specific RFQ details
 */
router.get('/rfq/inbox/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const rfq = await sellerRfqInboxService.getRFQDetail(rfqId, sellerId);

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(rfq);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching RFQ detail:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ detail' });
  }
});

/**
 * PATCH /api/portal/seller/rfq/inbox/:id/status
 * Update RFQ status (viewed, under_review, etc.)
 */
router.patch('/rfq/inbox/:id/status', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const { status } = req.body;

    const rfq = await sellerRfqInboxService.updateStatus(rfqId, sellerId, status);

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(rfq);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error updating RFQ status:', error);
    res.status(500).json({ error: 'Failed to update RFQ status' });
  }
});

/**
 * POST /api/portal/seller/rfq/inbox/:id/read
 * Mark RFQ as read
 */
router.post('/rfq/inbox/:id/read', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    await sellerRfqInboxService.markRead(sellerId, rfqId);
    res.json({ success: true });
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error marking RFQ as read:', error);
    res.status(500).json({ error: 'Failed to mark RFQ as read' });
  }
});

/**
 * POST /api/portal/seller/rfq/inbox/:id/archive
 * Archive an RFQ
 */
router.post('/rfq/inbox/:id/archive', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    await sellerRfqInboxService.archiveRFQ(sellerId, rfqId);
    res.json({ success: true });
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error archiving RFQ:', error);
    res.status(500).json({ error: 'Failed to archive RFQ' });
  }
});

/**
 * GET /api/portal/seller/rfq/inbox/:id/history
 * Get RFQ history/timeline
 */
router.get('/rfq/inbox/:id/history', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const history = await sellerRfqInboxService.getHistory(sellerId, rfqId);
    res.json(history);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching RFQ history:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ history' });
  }
});

// =============================================================================
// QUOTES - Create and manage quotes
// =============================================================================

/**
 * GET /api/portal/seller/quotes
 * Get all quotes for the seller
 */
router.get('/quotes', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status, page, limit } = req.query;

    const result = await quoteService.getSellerQuotes(sellerId, {
      status: status as QuoteStatus | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      quotes: result.quotes,
      pagination: result.pagination,
    });
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

/**
 * GET /api/portal/seller/quotes/:id
 * Get a specific quote
 */
router.get('/quotes/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const result = await quoteService.getQuote(quoteId, sellerId);

    if (!result.success) {
      if (result.error === 'Quote not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    res.json(result.quote);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

/**
 * POST /api/portal/seller/quotes
 * Create a new draft quote
 */
router.post('/quotes', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.body.rfqId as string;

    // Get the RFQ directly to find the buyerId
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
      select: { id: true, buyerId: true },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const result = await quoteService.createDraft({
      rfqId,
      sellerId,
      buyerId: rfq.buyerId,
      unitPrice: req.body.unitPrice,
      quantity: req.body.quantity,
      currency: req.body.currency,
      discount: req.body.discount,
      discountPercent: req.body.discountPercent,
      deliveryDays: req.body.deliveryDays,
      deliveryTerms: req.body.deliveryTerms,
      validUntil: new Date(req.body.validUntil),
      notes: req.body.notes,
      internalNotes: req.body.internalNotes,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.quote);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

/**
 * PUT /api/portal/seller/quotes/:id
 * Update a quote
 */
router.put('/quotes/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;

    const result = await quoteService.updateQuote(quoteId, sellerId, {
      unitPrice: req.body.unitPrice,
      quantity: req.body.quantity,
      currency: req.body.currency,
      discount: req.body.discount,
      discountPercent: req.body.discountPercent,
      deliveryDays: req.body.deliveryDays,
      deliveryTerms: req.body.deliveryTerms,
      validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
      notes: req.body.notes,
      internalNotes: req.body.internalNotes,
      changeReason: req.body.changeReason,
    });

    if (!result.success) {
      if (result.error === 'Quote not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.quote);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error updating quote:', error);
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

/**
 * POST /api/portal/seller/quotes/:id/send
 * Send a quote to the buyer
 */
router.post('/quotes/:id/send', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const result = await quoteService.sendQuote(quoteId, sellerId);

    if (!result.success) {
      if (result.error === 'Quote not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.quote);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error sending quote:', error);
    res.status(500).json({ error: 'Failed to send quote' });
  }
});

/**
 * DELETE /api/portal/seller/quotes/:id
 * Delete a draft quote
 */
router.delete('/quotes/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const result = await quoteService.deleteDraft(quoteId, sellerId);

    if (!result.success) {
      if (result.error === 'Quote not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

/**
 * GET /api/portal/seller/quotes/:id/versions
 * Get quote version history
 */
router.get('/quotes/:id/versions', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const result = await quoteService.getQuoteVersions(quoteId, sellerId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.versions);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching quote versions:', error);
    res.status(500).json({ error: 'Failed to fetch quote versions' });
  }
});

/**
 * GET /api/portal/seller/counter-offers/pending
 * Get pending counter offers
 */
router.get('/counter-offers/pending', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const offers = await counterOfferService.getSellerPendingCounterOffers(sellerId);
    res.json(offers);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching counter offers:', error);
    res.status(500).json({ error: 'Failed to fetch counter offers' });
  }
});

/**
 * POST /api/portal/seller/counter-offers/:id/accept
 * Accept a counter offer
 */
router.post('/counter-offers/:id/accept', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const offerId = req.params.id as string;
    const result = await counterOfferService.acceptCounterOffer(offerId, sellerId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.revisedQuote || result.counterOffer);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error accepting counter offer:', error);
    res.status(500).json({ error: 'Failed to accept counter offer' });
  }
});

/**
 * POST /api/portal/seller/counter-offers/:id/reject
 * Reject a counter offer
 */
router.post('/counter-offers/:id/reject', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const offerId = req.params.id as string;
    const result = await counterOfferService.rejectCounterOffer(offerId, sellerId, req.body.reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error rejecting counter offer:', error);
    res.status(500).json({ error: 'Failed to reject counter offer' });
  }
});

// =============================================================================
// ORDERS - Manage and fulfill orders
// =============================================================================

/**
 * GET /api/portal/seller/orders
 * Get all orders for the seller
 */
router.get('/orders', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status, page, limit } = req.query;

    const result = await marketplaceOrderService.getSellerOrders(sellerId, {
      status: status as OrderStatus | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      orders: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/portal/seller/orders/:id
 * Get a specific order
 */
router.get('/orders/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const result = await marketplaceOrderService.getOrder(orderId, sellerId);

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * POST /api/portal/seller/orders/:id/confirm
 * Confirm an order
 */
router.post('/orders/:id/confirm', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const result = await marketplaceOrderService.confirmOrder(orderId, sellerId);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

/**
 * POST /api/portal/seller/orders/:id/reject
 * Reject an order
 */
router.post('/orders/:id/reject', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id;
    const result = await marketplaceOrderService.rejectOrder({ orderId: orderId as string, sellerId, ...req.body });

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error rejecting order:', error);
    res.status(500).json({ error: 'Failed to reject order' });
  }
});

/**
 * POST /api/portal/seller/orders/:id/process
 * Start processing an order
 */
router.post('/orders/:id/process', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id;
    const result = await marketplaceOrderService.startProcessing({ orderId: orderId as string, sellerId, ...req.body });

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

/**
 * POST /api/portal/seller/orders/:id/ship
 * Ship an order
 */
router.post('/orders/:id/ship', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id;
    const result = await marketplaceOrderService.shipOrder({ orderId: orderId as string, sellerId, ...req.body });

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error shipping order:', error);
    res.status(500).json({ error: 'Failed to ship order' });
  }
});

/**
 * POST /api/portal/seller/orders/:id/deliver
 * Mark order as delivered
 */
router.post('/orders/:id/deliver', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id;
    const result = await marketplaceOrderService.markDelivered({ orderId: orderId as string, userId: sellerId, userRole: 'system' });

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error marking order delivered:', error);
    res.status(500).json({ error: 'Failed to mark order delivered' });
  }
});

// =============================================================================
// INVOICES - Manage invoices
// =============================================================================

/**
 * GET /api/portal/seller/invoices
 * Get all invoices for the seller
 */
router.get('/invoices', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status, page, limit } = req.query;

    const result = await marketplaceInvoiceService.getSellerInvoices(sellerId, {
      status: status as InvoiceStatus | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/portal/seller/invoices/:id
 * Get a specific invoice
 */
router.get('/invoices/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const invoiceId = req.params.id as string;
    const invoice = await marketplaceInvoiceService.getInvoice(invoiceId, sellerId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

/**
 * POST /api/portal/seller/invoices/:id/issue
 * Issue an invoice
 */
router.post('/invoices/:id/issue', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const invoiceId = req.params.id as string;
    const result = await marketplaceInvoiceService.issueInvoice({ invoiceId, sellerId });
    const invoice = result.success ? result.invoice : null;

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error issuing invoice:', error);
    res.status(500).json({ error: 'Failed to issue invoice' });
  }
});

// =============================================================================
// HOME/DASHBOARD - Seller dashboard data
// =============================================================================

/**
 * GET /api/portal/seller/home/summary
 * Get dashboard summary
 */
router.get('/home/summary', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const summary = await sellerHomeService.getSummary(sellerId);
    res.json(summary);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching home summary:', error);
    res.status(500).json({ error: 'Failed to fetch home summary' });
  }
});

/**
 * GET /api/portal/seller/home/alerts
 * Get dashboard alerts
 */
router.get('/home/alerts', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const alerts = await sellerHomeService.getAlerts(sellerId);
    res.json(alerts);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /api/portal/seller/home/focus
 * Get focus items
 */
router.get('/home/focus', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const focus = await sellerHomeService.getFocus(sellerId);
    res.json(focus);
  } catch (error) {
    apiLogger.error('[Portal/Seller] Error fetching focus items:', error);
    res.status(500).json({ error: 'Failed to fetch focus items' });
  }
});

export default router;
