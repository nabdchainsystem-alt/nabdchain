// =============================================================================
// Buyer Purchases Routes - Purchase Intelligence API
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as buyerPurchaseService from '../services/buyerPurchaseService';
import { apiLogger } from '../utils/logger';
import { resolveBuyerId } from '../utils/resolveBuyerId';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const healthStatusEnum = z.enum(['on_track', 'at_risk', 'delayed', 'critical', 'all']);
const urgencyEnum = z.enum(['low', 'medium', 'high', 'critical', 'all']);
const savingsEnum = z.enum(['good_deal', 'average', 'overpaying', 'all']);

const purchaseFiltersSchema = z.object({
  status: z.string().optional(),
  healthStatus: healthStatusEnum.optional(),
  urgency: urgencyEnum.optional(),
  savings: savingsEnum.optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sellerId: z.string().uuid().optional(),
});

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/purchases/buyer
 * Get all purchases for the authenticated buyer with intelligence data
 */
router.get('/buyer', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const filters = purchaseFiltersSchema.parse(req.query);

    const purchases = await buyerPurchaseService.getBuyerPurchases(buyerId, {
      status: filters.status,
      healthStatus: filters.healthStatus as buyerPurchaseService.OrderHealthStatus | undefined,
      urgency: filters.urgency as buyerPurchaseService.UrgencyLevel | undefined,
      savings: filters.savings as buyerPurchaseService.SavingsCategory | undefined,
      search: filters.search,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sellerId: filters.sellerId,
    });

    res.json(purchases);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: error.issues });
      return;
    }
    apiLogger.error('Error fetching buyer purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

/**
 * GET /api/purchases/buyer/stats
 * Get purchase statistics for the buyer dashboard
 */
router.get('/buyer/stats', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const stats = await buyerPurchaseService.getBuyerPurchaseStats(buyerId);
    res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching buyer purchase stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/purchases/buyer/:id
 * Get single purchase with full details
 */
router.get('/buyer/:id', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const id = req.params.id as string;

    const purchase = await buyerPurchaseService.getBuyerPurchase(buyerId, id);

    if (!purchase) {
      res.status(404).json({ error: 'Purchase not found' });
      return;
    }

    res.json(purchase);
  } catch (error) {
    apiLogger.error('Error fetching buyer purchase:', error);
    res.status(500).json({ error: 'Failed to fetch purchase' });
  }
});

/**
 * GET /api/purchases/buyer/:id/timeline
 * Get detailed lifecycle timeline for a purchase
 */
router.get('/buyer/:id/timeline', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const id = req.params.id as string;

    const timeline = await buyerPurchaseService.getPurchaseTimeline(buyerId, id);

    if (timeline.length === 0) {
      res.status(404).json({ error: 'Purchase not found' });
      return;
    }

    res.json(timeline);
  } catch (error) {
    apiLogger.error('Error fetching purchase timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

/**
 * GET /api/purchases/buyer/price-history/:sku
 * Get historical prices for an item SKU
 */
router.get('/buyer/price-history/:sku', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const sku = req.params.sku as string;

    const history = await buyerPurchaseService.getPriceHistory(buyerId, sku);
    res.json(history);
  } catch (error) {
    apiLogger.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

/**
 * GET /api/purchases/buyer/price-comparison/:sku
 * Get price comparison for an item SKU
 */
router.get('/buyer/price-comparison/:sku', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const sku = req.params.sku as string;
    const { currentPrice } = req.query;

    if (!currentPrice) {
      res.status(400).json({ error: 'currentPrice query parameter is required' });
      return;
    }

    const comparison = await buyerPurchaseService.calculatePriceComparison(
      buyerId,
      sku,
      parseFloat(currentPrice as string)
    );

    if (!comparison) {
      res.json({ hasHistory: false, message: 'No price history available for this item' });
      return;
    }

    res.json({ hasHistory: true, ...comparison });
  } catch (error) {
    apiLogger.error('Error calculating price comparison:', error);
    res.status(500).json({ error: 'Failed to calculate price comparison' });
  }
});

/**
 * GET /api/purchases/buyer/supplier/:sellerId
 * Get supplier performance metrics
 */
router.get('/buyer/supplier/:sellerId', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const sellerId = req.params.sellerId as string;

    const metrics = await buyerPurchaseService.getSupplierMetrics(buyerId, sellerId);

    if (!metrics) {
      res.json({ hasMetrics: false, message: 'No order history with this supplier' });
      return;
    }

    res.json({ hasMetrics: true, ...metrics });
  } catch (error) {
    apiLogger.error('Error fetching supplier metrics:', error);
    res.status(500).json({ error: 'Failed to fetch supplier metrics' });
  }
});

/**
 * POST /api/purchases/buyer/:id/refresh-intelligence
 * Recalculate price comparison and supplier metrics for a purchase
 */
router.post('/buyer/:id/refresh-intelligence', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const id = req.params.id as string;

    // Get the purchase
    const purchase = await buyerPurchaseService.getBuyerPurchase(buyerId, id);

    if (!purchase) {
      res.status(404).json({ error: 'Purchase not found' });
      return;
    }

    // Recalculate supplier metrics
    await buyerPurchaseService.updateSupplierMetricsOnOrderChange(buyerId, purchase.sellerId);

    // Return updated purchase
    const updatedPurchase = await buyerPurchaseService.getBuyerPurchase(buyerId, id);
    res.json(updatedPurchase);
  } catch (error) {
    apiLogger.error('Error refreshing purchase intelligence:', error);
    res.status(500).json({ error: 'Failed to refresh intelligence' });
  }
});

export default router;
