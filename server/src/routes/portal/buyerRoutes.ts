// =============================================================================
// Portal Buyer Routes - Consolidated Buyer API Surface
// =============================================================================
// This file aggregates all buyer-related endpoints under /api/portal/buyer/*
// It mounts existing routes for workspace and provides core buyer endpoints.
// =============================================================================

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { apiLogger } from '../../utils/logger';

// Import existing services
import itemService from '../../services/itemService';
import { quoteService } from '../../services/quoteService';
import { marketplaceOrderService, OrderStatus } from '../../services/marketplaceOrderService';
import { marketplaceInvoiceService, InvoiceStatus } from '../../services/marketplaceInvoiceService';
import { counterOfferService } from '../../services/counterOfferService';

// Import cart service - exports functions directly
import * as buyerCartService from '../../services/buyerCartService';

// Import existing routes for workspace endpoints (purchases, suppliers, expenses)
import buyerWorkspaceRoutes from '../buyerWorkspaceRoutes';

const router = Router();

// =============================================================================
// MARKETPLACE - Browse and search items
// =============================================================================

/**
 * GET /api/portal/buyer/marketplace
 * Browse marketplace items (public, no auth required)
 */
router.get('/marketplace', async (req, res: Response) => {
  try {
    const { category, subcategory, search, minPrice, maxPrice, sortBy, page, limit } = req.query;

    const result = await itemService.getMarketplaceItems({
      category: category as string,
      subcategory: subcategory as string,
      search: search as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sortBy: sortBy as 'price_asc' | 'price_desc' | 'newest' | 'popular' | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error browsing marketplace:', error);
    res.status(500).json({ error: 'Failed to browse marketplace' });
  }
});

/**
 * GET /api/portal/buyer/marketplace/:id
 * Get single marketplace item details
 */
router.get('/marketplace/:id', async (req, res: Response) => {
  try {
    const item = await itemService.getMarketplaceItem(req.params.id as string);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error fetching marketplace item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// =============================================================================
// RFQ - Request for Quotes
// =============================================================================

/**
 * GET /api/portal/buyer/rfqs
 * Get all RFQs for the authenticated buyer
 */
router.get('/rfqs', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const status = req.query.status as string | undefined;

    const rfqs = await itemService.getBuyerRFQs(
      buyerId,
      status as 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired' | undefined
    );

    res.json(rfqs);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error fetching RFQs:', error);
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
});

/**
 * POST /api/portal/buyer/rfqs
 * Create a new RFQ
 */
router.post('/rfqs', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const rfq = await itemService.createRFQ(buyerId, req.body);
    res.status(201).json(rfq);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error creating RFQ:', error);
    res.status(500).json({ error: 'Failed to create RFQ' });
  }
});

/**
 * POST /api/portal/buyer/rfqs/:id/accept
 * Accept an RFQ quote
 */
router.post('/rfqs/:id/accept', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const rfq = await itemService.updateRFQStatus(buyerId, rfqId, 'accepted');
    res.json(rfq);
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('[Portal/Buyer] Error accepting RFQ:', error);
    res.status(500).json({ error: 'Failed to accept RFQ' });
  }
});

/**
 * POST /api/portal/buyer/rfqs/:id/reject
 * Reject an RFQ quote
 */
router.post('/rfqs/:id/reject', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const rfq = await itemService.updateRFQStatus(buyerId, rfqId, 'rejected');
    res.json(rfq);
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('[Portal/Buyer] Error rejecting RFQ:', error);
    res.status(500).json({ error: 'Failed to reject RFQ' });
  }
});

// =============================================================================
// QUOTES - View and respond to quotes
// =============================================================================

/**
 * GET /api/portal/buyer/quotes/rfq/:rfqId
 * Get all quotes for a specific RFQ
 */
router.get('/quotes/rfq/:rfqId', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId as string;
    const result = await quoteService.getQuotesByRFQ(rfqId, userId);

    if (!result.success) {
      if (result.error === 'RFQ not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    res.json(result.quotes);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

/**
 * GET /api/portal/buyer/quotes/:id
 * Get a specific quote
 */
router.get('/quotes/:id', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const result = await quoteService.getQuote(quoteId, userId);

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
    apiLogger.error('[Portal/Buyer] Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

/**
 * POST /api/portal/buyer/quotes/:id/accept
 * Accept a quote and create an order
 */
router.post('/quotes/:id/accept', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const result = await marketplaceOrderService.acceptQuote({
      quoteId,
      buyerId,
      shippingAddress: req.body.shippingAddress,
      buyerNotes: req.body.buyerNotes,
    });

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.order);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error accepting quote:', error);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

/**
 * POST /api/portal/buyer/quotes/:id/reject
 * Reject a quote
 */
router.post('/quotes/:id/reject', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const result = await marketplaceOrderService.rejectQuote({
      quoteId,
      buyerId,
      reason: req.body.reason,
    });

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error rejecting quote:', error);
    res.status(500).json({ error: 'Failed to reject quote' });
  }
});

/**
 * POST /api/portal/buyer/quotes/:id/counter-offer
 * Submit a counter offer
 */
router.post('/quotes/:id/counter-offer', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const result = await counterOfferService.createCounterOffer({
      quoteId,
      buyerId,
      ...req.body,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.counterOffer);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error creating counter offer:', error);
    res.status(500).json({ error: 'Failed to create counter offer' });
  }
});

// =============================================================================
// ORDERS - View and track orders
// =============================================================================

/**
 * GET /api/portal/buyer/orders
 * Get all orders for the buyer
 */
router.get('/orders', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const { status, page, limit } = req.query;

    const result = await marketplaceOrderService.getBuyerOrders(buyerId, {
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
    apiLogger.error('[Portal/Buyer] Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/portal/buyer/orders/:id
 * Get a specific order
 */
router.get('/orders/:id', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const result = await marketplaceOrderService.getOrder(orderId, userId);

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
    apiLogger.error('[Portal/Buyer] Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// =============================================================================
// INVOICES - View invoices
// =============================================================================

/**
 * GET /api/portal/buyer/invoices
 * Get all invoices for the buyer
 */
router.get('/invoices', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const { status, page, limit } = req.query;

    const result = await marketplaceInvoiceService.getBuyerInvoices(buyerId, {
      status: status as InvoiceStatus | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/portal/buyer/invoices/:id
 * Get a specific invoice
 */
router.get('/invoices/:id', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const invoiceId = req.params.id as string;
    const invoice = await marketplaceInvoiceService.getInvoice(invoiceId, buyerId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// =============================================================================
// CART - Shopping cart operations
// =============================================================================

/**
 * GET /api/portal/buyer/cart
 * Get the buyer's cart
 */
router.get('/cart', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const cart = await buyerCartService.getOrCreateCart(buyerId);
    res.json(cart);
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

/**
 * POST /api/portal/buyer/cart/items
 * Add item to cart
 */
router.post('/cart/items', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const cart = await buyerCartService.addToCart(buyerId, req.body);
    res.status(201).json(cart);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    apiLogger.error('[Portal/Buyer] Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

/**
 * PATCH /api/portal/buyer/cart/items/:itemId
 * Update cart item quantity
 */
router.patch('/cart/items/:itemId', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const itemId = req.params.itemId as string;
    const cart = await buyerCartService.updateCartItem(
      buyerId,
      itemId,
      { quantity: req.body.quantity }
    );
    res.json(cart);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    apiLogger.error('[Portal/Buyer] Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

/**
 * DELETE /api/portal/buyer/cart/items/:itemId
 * Remove item from cart
 */
router.delete('/cart/items/:itemId', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const itemId = req.params.itemId as string;
    await buyerCartService.removeFromCart(buyerId, itemId);
    res.json({ success: true });
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

/**
 * DELETE /api/portal/buyer/cart
 * Clear the entire cart
 */
router.delete('/cart', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    await buyerCartService.clearCart(buyerId);
    res.json({ success: true });
  } catch (error) {
    apiLogger.error('[Portal/Buyer] Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// =============================================================================
// WORKSPACE - Mount existing buyer workspace routes
// These provide: /purchases, /suppliers, /inventory, /expenses
// =============================================================================
router.use('/', buyerWorkspaceRoutes);

export default router;
