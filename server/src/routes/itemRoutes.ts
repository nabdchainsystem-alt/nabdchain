// =============================================================================
// Item Routes - Universal Marketplace Item API
// =============================================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { itemService, ItemStatus, ItemVisibility, ItemType } from '../services/itemService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const itemTypeEnum = z.enum(['part', 'consumable', 'service']);
const visibilityEnum = z.enum(['public', 'rfq_only', 'hidden']);
const statusEnum = z.enum(['draft', 'active', 'out_of_stock', 'archived']);

const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  nameAr: z.string().max(200).optional(),
  sku: z.string().min(1).max(50),
  partNumber: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  descriptionAr: z.string().max(5000).optional(),
  itemType: itemTypeEnum.default('part'),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  visibility: visibilityEnum.default('public'),
  status: statusEnum.default('draft'),
  price: z.number().min(0),
  currency: z.string().default('SAR'),
  priceUnit: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  minOrderQty: z.number().int().min(1).default(1),
  maxOrderQty: z.number().int().min(1).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  manufacturer: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  origin: z.string().max(100).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  compatibility: z.array(z.object({
    make: z.string(),
    model: z.string(),
    years: z.string().optional(),
  })).optional(),
  packaging: z.record(z.string(), z.unknown()).optional(),
  images: z.array(z.string()).optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
  })).optional(),
});

const updateItemSchema = createItemSchema.partial();

const rfqCreateSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1),
  message: z.string().max(2000).optional(),
});

const rfqResponseSchema = z.object({
  quotedPrice: z.number().min(0),
  quotedLeadTime: z.number().int().min(0).optional(),
  responseMessage: z.string().max(2000).optional(),
  expiresAt: z.string().datetime().optional(),
});

// =============================================================================
// Seller Routes - Item Management
// =============================================================================

/**
 * GET /api/items
 * Get all items for the authenticated seller
 */
router.get('/', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { status, visibility, itemType, category, search, minPrice, maxPrice, inStock } = req.query;

    const items = await itemService.getSellerItems(userId, {
      status: status as ItemStatus | undefined,
      visibility: visibility as ItemVisibility | undefined,
      itemType: itemType as ItemType | undefined,
      category: category as string | undefined,
      search: search as string | undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      inStock: inStock === 'true',
    });

    // Parse JSON fields for response
    const parsedItems = items.map(parseItemJsonFields);

    res.json(parsedItems);
  } catch (error) {
    apiLogger.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * GET /api/items/stats
 * Get seller item statistics
 */
router.get('/stats', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const stats = await itemService.getSellerStats(userId);
    res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching item stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/items/:id
 * Get single item for seller
 */
router.get('/:id', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const id = req.params.id as string;

    const item = await itemService.getSellerItem(userId, id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(parseItemJsonFields(item));
  } catch (error) {
    apiLogger.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

/**
 * POST /api/items
 * Create new item
 */
router.post('/', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const data = createItemSchema.parse(req.body);

    const item = await itemService.createItem(userId, data);

    res.status(201).json(parseItemJsonFields(item));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

/**
 * PUT /api/items/:id
 * Update item
 */
router.put('/:id', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const id = req.params.id as string;
    const data = updateItemSchema.parse(req.body);

    const item = await itemService.updateItem(userId, id, data);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(parseItemJsonFields(item));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/**
 * DELETE /api/items/:id
 * Delete item
 */
router.delete('/:id', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const id = req.params.id as string;

    const success = await itemService.deleteItem(userId, id);

    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

/**
 * POST /api/items/:id/archive
 * Archive item (soft delete)
 */
router.post('/:id/archive', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const id = req.params.id as string;

    const item = await itemService.archiveItem(userId, id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(parseItemJsonFields(item));
  } catch (error) {
    apiLogger.error('Error archiving item:', error);
    res.status(500).json({ error: 'Failed to archive item' });
  }
});

/**
 * POST /api/items/bulk/status
 * Bulk update item status
 */
router.post('/bulk/status', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { itemIds, status } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }

    const parsedStatus = statusEnum.parse(status);
    const result = await itemService.bulkUpdateStatus(userId, itemIds, parsedStatus);

    res.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    apiLogger.error('Error bulk updating status:', error);
    res.status(500).json({ error: 'Failed to update items' });
  }
});

/**
 * POST /api/items/bulk/visibility
 * Bulk update item visibility
 */
router.post('/bulk/visibility', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { itemIds, visibility } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }

    const parsedVisibility = visibilityEnum.parse(visibility);
    const result = await itemService.bulkUpdateVisibility(userId, itemIds, parsedVisibility);

    res.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid visibility' });
    }
    apiLogger.error('Error bulk updating visibility:', error);
    res.status(500).json({ error: 'Failed to update items' });
  }
});

/**
 * POST /api/items/migrate
 * Migrate from PortalProduct to Item
 */
router.post('/migrate', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const result = await itemService.migrateFromPortalProduct(userId);

    res.json({ success: true, count: result.count });
  } catch (error) {
    apiLogger.error('Error migrating products:', error);
    res.status(500).json({ error: 'Failed to migrate products' });
  }
});

// =============================================================================
// Marketplace Routes - Public View
// =============================================================================

/**
 * GET /api/items/marketplace
 * Get marketplace items (public)
 */
router.get('/marketplace/browse', async (req, res: Response) => {
  try {
    const {
      category,
      subcategory,
      itemType,
      search,
      minPrice,
      maxPrice,
      manufacturer,
      brand,
      sortBy,
      page,
      limit,
    } = req.query;

    const result = await itemService.getMarketplaceItems({
      category: category as string | undefined,
      subcategory: subcategory as string | undefined,
      itemType: itemType as ItemType | undefined,
      search: search as string | undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      manufacturer: manufacturer as string | undefined,
      brand: brand as string | undefined,
      sortBy: sortBy as 'price_asc' | 'price_desc' | 'newest' | 'popular' | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      items: result.items.map(parseItemJsonFields),
      pagination: result.pagination,
    });
  } catch (error) {
    apiLogger.error('Error fetching marketplace items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * GET /api/items/marketplace/:id
 * Get single marketplace item (public)
 */
router.get('/marketplace/:id', async (req, res: Response) => {
  try {
    const id = req.params.id;
    const item = await itemService.getMarketplaceItem(id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(parseItemJsonFields(item));
  } catch (error) {
    apiLogger.error('Error fetching marketplace item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

/**
 * GET /api/items/marketplace/seller/:sellerId
 * Get seller's public items
 */
router.get('/marketplace/seller/:sellerId', async (req, res: Response) => {
  try {
    const sellerId = req.params.sellerId;
    const { category, itemType, sortBy, page, limit } = req.query;

    const result = await itemService.getSellerPublicItems(sellerId, {
      category: category as string | undefined,
      itemType: itemType as ItemType | undefined,
      sortBy: sortBy as 'price_asc' | 'price_desc' | 'newest' | 'popular' | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      items: result.items.map(parseItemJsonFields),
      pagination: result.pagination,
    });
  } catch (error) {
    apiLogger.error('Error fetching seller items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// =============================================================================
// RFQ Routes
// =============================================================================

/**
 * POST /api/items/rfq
 * Create RFQ request (buyer)
 */
router.post('/rfq', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const data = rfqCreateSchema.parse(req.body);

    const rfq = await itemService.createRFQ(buyerId, data.itemId, {
      quantity: data.quantity,
      message: data.message,
    });

    res.status(201).json(rfq);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Item not found or not available') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error creating RFQ:', error);
    res.status(500).json({ error: 'Failed to create RFQ' });
  }
});

/**
 * GET /api/items/rfq/seller
 * Get RFQs for seller
 */
router.get('/rfq/seller', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status } = req.query;

    const rfqs = await itemService.getSellerRFQs(
      sellerId,
      status as 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired' | undefined
    );

    res.json(rfqs);
  } catch (error) {
    apiLogger.error('Error fetching seller RFQs:', error);
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
});

/**
 * GET /api/items/rfq/buyer
 * Get RFQs for buyer
 */
router.get('/rfq/buyer', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const { status } = req.query;

    const rfqs = await itemService.getBuyerRFQs(
      buyerId,
      status as 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired' | undefined
    );

    res.json(rfqs);
  } catch (error) {
    apiLogger.error('Error fetching buyer RFQs:', error);
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
});

/**
 * POST /api/items/rfq/:id/respond
 * Respond to RFQ (seller)
 */
router.post('/rfq/:id/respond', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const data = rfqResponseSchema.parse(req.body);

    const rfq = await itemService.respondToRFQ(sellerId, rfqId, {
      quotedPrice: data.quotedPrice,
      quotedLeadTime: data.quotedLeadTime,
      responseMessage: data.responseMessage,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    res.json(rfq);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error responding to RFQ:', error);
    res.status(500).json({ error: 'Failed to respond to RFQ' });
  }
});

/**
 * POST /api/items/rfq/:id/accept
 * Accept RFQ quote (buyer)
 */
router.post('/rfq/:id/accept', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;

    const rfq = await itemService.updateRFQStatus(buyerId, rfqId, 'accepted');

    res.json(rfq);
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error accepting RFQ:', error);
    res.status(500).json({ error: 'Failed to accept RFQ' });
  }
});

/**
 * POST /api/items/rfq/:id/reject
 * Reject RFQ quote (buyer)
 */
router.post('/rfq/:id/reject', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;

    const rfq = await itemService.updateRFQStatus(buyerId, rfqId, 'rejected');

    res.json(rfq);
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error rejecting RFQ:', error);
    res.status(500).json({ error: 'Failed to reject RFQ' });
  }
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse JSON string fields from database to objects
 */
function parseItemJsonFields(item: any) {
  return {
    ...item,
    specifications: item.specifications ? JSON.parse(item.specifications) : null,
    compatibility: item.compatibility ? JSON.parse(item.compatibility) : null,
    packaging: item.packaging ? JSON.parse(item.packaging) : null,
    images: item.images ? JSON.parse(item.images) : null,
    documents: item.documents ? JSON.parse(item.documents) : null,
  };
}

export default router;
