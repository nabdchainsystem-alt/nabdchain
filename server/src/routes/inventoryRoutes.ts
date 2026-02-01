// =============================================================================
// Inventory Routes - Stock Management API
// =============================================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventoryService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const stockAdjustmentSchema = z.object({
  stockQty: z.number().int().min(0).optional(),
  minOrderQty: z.number().int().min(1).optional(),
});

// =============================================================================
// Seller Inventory Routes
// =============================================================================

/**
 * GET /api/inventory/seller
 * Get all inventory items for the authenticated seller
 */
router.get('/seller', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { search, status, category } = req.query;

    const inventory = await inventoryService.getSellerInventory(sellerId, {
      search: search as string | undefined,
      status: status as 'in_stock' | 'low_stock' | 'out_of_stock' | undefined,
      category: category as string | undefined,
    });

    res.json(inventory);
  } catch (error) {
    apiLogger.error('Error fetching seller inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

/**
 * GET /api/inventory/seller/summary
 * Get inventory summary stats
 */
router.get('/seller/summary', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const summary = await inventoryService.getInventorySummary(sellerId);
    res.json(summary);
  } catch (error) {
    apiLogger.error('Error fetching inventory summary:', error);
    res.status(500).json({ error: 'Failed to fetch inventory summary' });
  }
});

/**
 * PATCH /api/inventory/seller/:productId
 * Update stock for a product
 */
router.patch('/seller/:productId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const productId = req.params.productId as string;
    const data = stockAdjustmentSchema.parse(req.body);

    const updatedItem = await inventoryService.updateStock(sellerId, productId, data);

    if (!updatedItem) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

export default router;
