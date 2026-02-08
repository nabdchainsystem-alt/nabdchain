// =============================================================================
// Buyer Cart Routes - RFQ Aggregation Cart API
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as buyerCartService from '../services/buyerCartService';
import { apiLogger } from '../utils/logger';
import { resolveBuyerId } from '../utils/resolveBuyerId';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const addToCartSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1).optional().default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/buyer-cart
 * Get cart with all items for the authenticated buyer
 */
router.get('/', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const cart = await buyerCartService.getOrCreateCart(buyerId);
    res.json(cart);
  } catch (error) {
    apiLogger.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

/**
 * GET /api/buyer-cart/grouped
 * Get cart items grouped by seller
 */
router.get('/grouped', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const groups = await buyerCartService.getCartGroupedBySeller(buyerId);
    res.json(groups);
  } catch (error) {
    apiLogger.error('Error fetching grouped cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

/**
 * POST /api/buyer-cart/items
 * Add item to cart
 */
router.post('/items', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const input = addToCartSchema.parse(req.body);
    const cart = await buyerCartService.addToCart(buyerId, input);
    res.json(cart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request body', details: error.issues });
      return;
    }
    if (error instanceof Error) {
      if (error.message === 'Cart is locked. Clear the cart to add new items.') {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message === 'Item not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === 'Item is not available') {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    apiLogger.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

/**
 * PATCH /api/buyer-cart/items/:itemId
 * Update cart item quantity
 */
router.patch('/items/:itemId', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const itemId = req.params.itemId as string;
    const input = updateCartItemSchema.parse(req.body);
    const cart = await buyerCartService.updateCartItem(buyerId, itemId, input);
    res.json(cart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request body', details: error.issues });
      return;
    }
    if (error instanceof Error) {
      if (error.message === 'Cart not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === 'Cart is locked') {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message === 'Item not in cart') {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    apiLogger.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

/**
 * DELETE /api/buyer-cart/items/:itemId
 * Remove item from cart
 */
router.delete('/items/:itemId', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const itemId = req.params.itemId as string;
    const cart = await buyerCartService.removeFromCart(buyerId, itemId);
    res.json(cart);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Cart not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === 'Cart is locked') {
        res.status(409).json({ error: error.message });
        return;
      }
    }
    apiLogger.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

/**
 * DELETE /api/buyer-cart
 * Clear entire cart
 */
router.delete('/', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const cart = await buyerCartService.clearCart(buyerId);
    res.json(cart);
  } catch (error) {
    if (error instanceof Error && error.message === 'Cart not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    apiLogger.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

/**
 * POST /api/buyer-cart/rfq
 * Create RFQ from all cart items (grouped by seller)
 */
router.post('/rfq', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const result = await buyerCartService.createRFQFromAllCart(buyerId);
    res.json({
      success: true,
      message: `Created ${result.rfqIds.length} RFQ(s) to ${result.sellerCount} seller(s)`,
      ...result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cart is empty') {
      res.status(400).json({ error: error.message });
      return;
    }
    apiLogger.error('Error creating RFQ from cart:', error);
    res.status(500).json({ error: 'Failed to create RFQ' });
  }
});

/**
 * POST /api/buyer-cart/rfq/seller/:sellerId
 * Create RFQ for items from a specific seller
 */
router.post('/rfq/seller/:sellerId', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const sellerId = req.params.sellerId as string;
    const result = await buyerCartService.createRFQFromCartForSeller(buyerId, sellerId);
    res.json({
      success: true,
      message: `Created ${result.rfqIds.length} RFQ(s)`,
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Cart is empty' || error.message === 'No items from this seller in cart') {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    apiLogger.error('Error creating RFQ for seller:', error);
    res.status(500).json({ error: 'Failed to create RFQ' });
  }
});

/**
 * POST /api/buyer-cart/lock
 * Lock cart (manual lock)
 */
router.post('/lock', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const cart = await buyerCartService.lockCart(buyerId, 'manual_lock');
    res.json(cart);
  } catch (error) {
    if (error instanceof Error && error.message === 'Cart not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    apiLogger.error('Error locking cart:', error);
    res.status(500).json({ error: 'Failed to lock cart' });
  }
});

/**
 * POST /api/buyer-cart/unlock
 * Unlock cart
 */
router.post('/unlock', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const cart = await buyerCartService.unlockCart(buyerId);
    res.json(cart);
  } catch (error) {
    if (error instanceof Error && error.message === 'Cart not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    apiLogger.error('Error unlocking cart:', error);
    res.status(500).json({ error: 'Failed to unlock cart' });
  }
});

// =============================================================================
// Buy Now Routes (Direct Purchase without RFQ)
// =============================================================================

/**
 * POST /api/buyer-cart/buy-now
 * Buy all Buy Now eligible items in cart (creates orders directly)
 */
router.post('/buy-now', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const result = await buyerCartService.buyNowFromAllCart(buyerId);
    res.json({
      success: true,
      message: `Created ${result.orderIds.length} order(s) for ${result.itemCount} item(s)`,
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Cart is empty') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'No Buy Now eligible items in cart') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'Cart is locked') {
        res.status(409).json({ error: error.message });
        return;
      }
    }
    apiLogger.error('Error processing buy now:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

/**
 * POST /api/buyer-cart/buy-now/seller/:sellerId
 * Buy all Buy Now eligible items from a specific seller
 */
router.post('/buy-now/seller/:sellerId', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const sellerId = req.params.sellerId as string;
    const result = await buyerCartService.buyNowFromCartForSeller(buyerId, sellerId);
    res.json({
      success: true,
      message: `Created order for ${result.itemCount} item(s)`,
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Cart is empty') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'No Buy Now eligible items from this seller') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'Cart is locked') {
        res.status(409).json({ error: error.message });
        return;
      }
    }
    apiLogger.error('Error processing buy now for seller:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

export default router;
