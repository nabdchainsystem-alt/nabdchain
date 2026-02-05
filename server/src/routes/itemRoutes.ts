// =============================================================================
// Item Routes - Universal Marketplace Item API
// =============================================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { idempotency } from '../middleware/idempotencyMiddleware';
import { itemService, ItemStatus, ItemVisibility, ItemType } from '../services/itemService';

const prisma = new PrismaClient();
import rfqScoringService, { PriorityTier } from '../services/rfqScoringService';
import { sellerRfqInboxService } from '../services/sellerRfqInboxService';
import { quoteService } from '../services/quoteService';
import { marketplaceOrderService } from '../services/marketplaceOrderService';
import { portalNotificationService } from '../services/portalNotificationService';
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

// Stage 1 RFQ Creation Schema - supports three entry points
const rfqCreateSchema = z.object({
  itemId: z.string().uuid().nullable().optional(),  // Nullable for profile-level RFQs
  sellerId: z.string().uuid(),                       // Required when itemId is null
  quantity: z.number().int().min(1),
  deliveryLocation: z.string().min(3).max(500),      // Required
  deliveryCity: z.string().max(100).optional(),
  deliveryCountry: z.string().length(2).default('SA'),
  requiredDeliveryDate: z.string().datetime().optional(),
  message: z.string().max(2000).optional(),
  priority: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  source: z.enum(['item', 'profile', 'listing']).default('item'),
});

const rfqResponseSchema = z.object({
  quotedPrice: z.number().min(0),
  quotedLeadTime: z.number().int().min(0).optional(),
  responseMessage: z.string().max(2000).optional(),
  expiresAt: z.string().datetime().optional(),
});

// Stage 2: Seller Inbox Schemas
const inboxStatusEnum = z.enum(['new', 'viewed', 'under_review', 'ignored']);
const priorityLevelEnum = z.enum(['high', 'medium', 'low']);

const inboxQuerySchema = z.object({
  status: inboxStatusEnum.optional(),
  priorityLevel: priorityLevelEnum.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'priorityScore', 'requiredDeliveryDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  // Gmail-style filters
  labelId: z.string().uuid().optional(),
  isRead: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  isArchived: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  isSnoozed: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['under_review', 'ignored']),
  ignoredReason: z.string().max(500).optional(),
});

const internalNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});

// Gmail-style feature schemas
const labelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().max(50).optional(),
});

const noteSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

const savedReplySchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  category: z.enum(['decline', 'followup', 'general', 'quote']).optional(),
  shortcut: z.string().max(20).optional(),
});

const snoozeSchema = z.object({
  until: z.string().datetime(),
  reason: z.string().max(100).optional(),
});

const bulkIdsSchema = z.object({
  rfqIds: z.array(z.string().uuid()).min(1).max(100),
});

const bulkLabelSchema = z.object({
  rfqIds: z.array(z.string().uuid()).min(1).max(100),
  labelId: z.string().uuid(),
  action: z.enum(['add', 'remove']),
});

const bulkSnoozeSchema = z.object({
  rfqIds: z.array(z.string().uuid()).min(1).max(100),
  until: z.string().datetime(),
  reason: z.string().max(100).optional(),
});

// Stage 3: Quote Schemas
const quoteStatusEnum = z.enum(['draft', 'sent', 'revised', 'expired', 'accepted', 'rejected']);

const createQuoteSchema = z.object({
  rfqId: z.string().uuid(),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1),
  currency: z.string().default('SAR'),
  discount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  deliveryDays: z.number().int().min(0),
  deliveryTerms: z.string().max(200).optional(),
  validUntil: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
});

const updateQuoteSchema = z.object({
  unitPrice: z.number().min(0).optional(),
  quantity: z.number().int().min(1).optional(),
  currency: z.string().optional(),
  discount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  deliveryDays: z.number().int().min(0).optional(),
  deliveryTerms: z.string().max(200).optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  changeReason: z.string().max(500).optional(),
});

const quoteListQuerySchema = z.object({
  status: quoteStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Stage 4: Order Schemas
const orderStatusEnum = z.enum([
  'pending_confirmation',
  'confirmed',
  'in_progress',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
  'refunded',
]);

const acceptQuoteSchema = z.object({
  shippingAddress: z.string().max(1000).optional(),
  buyerNotes: z.string().max(2000).optional(),
});

const rejectQuoteSchema = z.object({
  reason: z.string().min(1).max(500),
});

const orderListQuerySchema = z.object({
  status: orderStatusEnum.optional(),
  source: z.enum(['rfq', 'direct_buy']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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
 * Stage 1: Supports item, profile, and listing entry points
 */
router.post('/rfq', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const data = rfqCreateSchema.parse(req.body);

    // Convert datetime string to Date if provided
    const requiredDeliveryDate = data.requiredDeliveryDate
      ? new Date(data.requiredDeliveryDate)
      : undefined;

    const rfq = await itemService.createRFQ(buyerId, {
      itemId: data.itemId,
      sellerId: data.sellerId,
      quantity: data.quantity,
      deliveryLocation: data.deliveryLocation,
      deliveryCity: data.deliveryCity,
      deliveryCountry: data.deliveryCountry,
      requiredDeliveryDate,
      message: data.message,
      priority: data.priority,
      source: data.source,
    });

    // Notify seller of new RFQ
    if (rfq.sellerId) {
      portalNotificationService.create({
        userId: rfq.sellerId,
        portalType: 'seller',
        type: 'rfq_received',
        entityType: 'rfq',
        entityId: rfq.id,
        entityName: `RFQ #${rfq.rfqNumber}`,
        actorId: buyerId,
      }).catch(err => apiLogger.error('Failed to create RFQ notification:', err));
    }

    res.status(201).json(rfq);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    // Handle specific validation errors with user-friendly messages
    if (error instanceof Error) {
      const errorMessages = [
        'Item not found or not available',
        'Seller not found',
        'Quantity must be greater than 0',
        'Delivery location is required',
        'Required delivery date must be in the future',
      ];
      if (errorMessages.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ error: error.message });
      }
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
// Stage 2: Seller RFQ Inbox Routes
// =============================================================================

/**
 * GET /api/items/rfq/seller/inbox
 * Get paginated RFQ inbox for seller with filters
 */
router.get('/rfq/seller/inbox', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const query = inboxQuerySchema.parse(req.query);

    const result = await sellerRfqInboxService.getInbox(sellerId, {
      status: query.status,
      priorityLevel: query.priorityLevel,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy === 'priorityScore' ? 'priority' : (query.sortOrder === 'asc' ? 'oldest' : 'newest'),
      // Gmail-style filters
      labelId: query.labelId,
      isRead: query.isRead,
      isArchived: query.isArchived,
      isSnoozed: query.isSnoozed,
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.issues });
    }
    apiLogger.error('Error fetching seller inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

/**
 * GET /api/items/rfq/seller/inbox/:id
 * Get RFQ detail and auto-mark as VIEWED
 */
router.get('/rfq/seller/inbox/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;

    const rfq = await sellerRfqInboxService.getRFQDetail(rfqId, sellerId);

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(rfq);
  } catch (error) {
    apiLogger.error('Error fetching RFQ detail:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ detail' });
  }
});

/**
 * PATCH /api/items/rfq/seller/inbox/:id/status
 * Update RFQ status (under_review or ignored)
 */
router.patch('/rfq/seller/inbox/:id/status', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const data = statusUpdateSchema.parse(req.body);

    // Validate ignored reason is provided when status is ignored
    if (data.status === 'ignored' && !data.ignoredReason) {
      return res.status(400).json({ error: 'Ignored reason is required when marking as ignored' });
    }

    const rfq = await sellerRfqInboxService.updateStatus(
      rfqId,
      sellerId,
      data.status,
      data.ignoredReason
    );

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(rfq);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Invalid status transition') {
      return res.status(400).json({ error: error.message });
    }
    apiLogger.error('Error updating RFQ status:', error);
    res.status(500).json({ error: 'Failed to update RFQ status' });
  }
});

/**
 * POST /api/items/rfq/seller/inbox/:id/notes
 * Add internal note to RFQ (seller-only)
 */
router.post('/rfq/seller/inbox/:id/notes', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const data = internalNoteSchema.parse(req.body);

    const rfq = await sellerRfqInboxService.addInternalNote(rfqId, sellerId, data.note);

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(rfq);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error adding internal note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

/**
 * GET /api/items/rfq/seller/inbox/:id/history
 * Get RFQ event history
 */
router.get('/rfq/seller/inbox/:id/history', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;

    const history = await sellerRfqInboxService.getHistory(rfqId, sellerId);

    if (!history) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(history);
  } catch (error) {
    apiLogger.error('Error fetching RFQ history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// =============================================================================
// Gmail-Style Features: Labels
// =============================================================================

/**
 * GET /api/items/rfq/seller/labels
 * Get all labels for the seller
 */
router.get('/rfq/seller/labels', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const labels = await sellerRfqInboxService.getLabels(sellerId);
    res.json(labels);
  } catch (error) {
    apiLogger.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

/**
 * POST /api/items/rfq/seller/labels
 * Create a new label
 */
router.post('/rfq/seller/labels', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = labelSchema.parse(req.body);
    const label = await sellerRfqInboxService.createLabel(sellerId, data);
    res.status(201).json(label);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

/**
 * PATCH /api/items/rfq/seller/labels/:labelId
 * Update a label
 */
router.patch('/rfq/seller/labels/:labelId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const labelId = req.params.labelId;
    const data = labelSchema.partial().parse(req.body);
    const label = await sellerRfqInboxService.updateLabel(sellerId, labelId, data);
    res.json(label);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Label not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error updating label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

/**
 * DELETE /api/items/rfq/seller/labels/:labelId
 * Delete a label
 */
router.delete('/rfq/seller/labels/:labelId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const labelId = req.params.labelId;
    await sellerRfqInboxService.deleteLabel(sellerId, labelId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && (error.message === 'Label not found' || error.message === 'Cannot delete system labels')) {
      return res.status(400).json({ error: error.message });
    }
    apiLogger.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// =============================================================================
// Gmail-Style Features: Label Assignments
// =============================================================================

/**
 * POST /api/items/rfq/seller/inbox/:rfqId/labels/:labelId
 * Add a label to an RFQ
 */
router.post('/rfq/seller/inbox/:rfqId/labels/:labelId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { rfqId, labelId } = req.params;
    await sellerRfqInboxService.addLabelToRFQ(sellerId, rfqId, labelId);
    res.status(201).json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === 'RFQ not found' || error.message === 'Label not found')) {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error adding label to RFQ:', error);
    res.status(500).json({ error: 'Failed to add label' });
  }
});

/**
 * DELETE /api/items/rfq/seller/inbox/:rfqId/labels/:labelId
 * Remove a label from an RFQ
 */
router.delete('/rfq/seller/inbox/:rfqId/labels/:labelId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { rfqId, labelId } = req.params;
    await sellerRfqInboxService.removeLabelFromRFQ(sellerId, rfqId, labelId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error removing label from RFQ:', error);
    res.status(500).json({ error: 'Failed to remove label' });
  }
});

/**
 * POST /api/items/rfq/seller/inbox/bulk/labels
 * Bulk add/remove label from multiple RFQs
 */
router.post('/rfq/seller/inbox/bulk/labels', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = bulkLabelSchema.parse(req.body);

    let result;
    if (data.action === 'add') {
      result = await sellerRfqInboxService.bulkAddLabel(sellerId, data.rfqIds, data.labelId);
    } else {
      result = await sellerRfqInboxService.bulkRemoveLabel(sellerId, data.rfqIds, data.labelId);
    }

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Label not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error bulk updating labels:', error);
    res.status(500).json({ error: 'Failed to update labels' });
  }
});

// =============================================================================
// Gmail-Style Features: Threaded Notes
// =============================================================================

/**
 * GET /api/items/rfq/seller/inbox/:rfqId/notes
 * Get all notes for an RFQ (threaded)
 */
router.get('/rfq/seller/inbox/:rfqId/notes', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId;
    const notes = await sellerRfqInboxService.getNotes(sellerId, rfqId);
    res.json(notes);
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

/**
 * POST /api/items/rfq/seller/inbox/:rfqId/notes
 * Add a new note to an RFQ
 */
router.post('/rfq/seller/inbox/:rfqId/notes', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId;
    const data = noteSchema.parse(req.body);
    const note = await sellerRfqInboxService.addNote(sellerId, rfqId, data.content, data.parentId);
    res.status(201).json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && (error.message === 'RFQ not found' || error.message === 'Parent note not found')) {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

/**
 * PATCH /api/items/rfq/seller/inbox/notes/:noteId
 * Update a note
 */
router.patch('/rfq/seller/inbox/notes/:noteId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const noteId = req.params.noteId;
    const { content } = noteSchema.pick({ content: true }).parse(req.body);
    const note = await sellerRfqInboxService.updateNote(sellerId, noteId, content);
    res.json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Note not found or not authorized') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

/**
 * DELETE /api/items/rfq/seller/inbox/notes/:noteId
 * Delete a note
 */
router.delete('/rfq/seller/inbox/notes/:noteId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const noteId = req.params.noteId;
    await sellerRfqInboxService.deleteNote(sellerId, noteId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Note not found or not authorized') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// =============================================================================
// Gmail-Style Features: Saved Replies
// =============================================================================

/**
 * GET /api/items/rfq/seller/saved-replies
 * Get all saved replies for the seller
 */
router.get('/rfq/seller/saved-replies', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const category = req.query.category as string | undefined;
    const replies = await sellerRfqInboxService.getSavedReplies(sellerId, category);
    res.json(replies);
  } catch (error) {
    apiLogger.error('Error fetching saved replies:', error);
    res.status(500).json({ error: 'Failed to fetch saved replies' });
  }
});

/**
 * POST /api/items/rfq/seller/saved-replies
 * Create a new saved reply
 */
router.post('/rfq/seller/saved-replies', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = savedReplySchema.parse(req.body);
    const reply = await sellerRfqInboxService.createSavedReply(sellerId, data);
    res.status(201).json(reply);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating saved reply:', error);
    res.status(500).json({ error: 'Failed to create saved reply' });
  }
});

/**
 * PATCH /api/items/rfq/seller/saved-replies/:replyId
 * Update a saved reply
 */
router.patch('/rfq/seller/saved-replies/:replyId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const replyId = req.params.replyId;
    const data = savedReplySchema.partial().parse(req.body);
    const reply = await sellerRfqInboxService.updateSavedReply(sellerId, replyId, data);
    res.json(reply);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'Saved reply not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error updating saved reply:', error);
    res.status(500).json({ error: 'Failed to update saved reply' });
  }
});

/**
 * DELETE /api/items/rfq/seller/saved-replies/:replyId
 * Delete a saved reply
 */
router.delete('/rfq/seller/saved-replies/:replyId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const replyId = req.params.replyId;
    await sellerRfqInboxService.deleteSavedReply(sellerId, replyId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Saved reply not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error deleting saved reply:', error);
    res.status(500).json({ error: 'Failed to delete saved reply' });
  }
});

/**
 * POST /api/items/rfq/seller/saved-replies/:replyId/expand
 * Expand a saved reply with RFQ data
 */
router.post('/rfq/seller/saved-replies/:replyId/expand', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const replyId = req.params.replyId;
    const { rfqId } = z.object({ rfqId: z.string().uuid() }).parse(req.body);
    const expandedContent = await sellerRfqInboxService.expandTemplate(sellerId, replyId, rfqId);
    res.json({ content: expandedContent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && (error.message === 'Saved reply not found' || error.message === 'RFQ not found')) {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error expanding template:', error);
    res.status(500).json({ error: 'Failed to expand template' });
  }
});

// =============================================================================
// Gmail-Style Features: Snooze
// =============================================================================

/**
 * POST /api/items/rfq/seller/inbox/:rfqId/snooze
 * Snooze an RFQ
 */
router.post('/rfq/seller/inbox/:rfqId/snooze', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId;
    const data = snoozeSchema.parse(req.body);
    await sellerRfqInboxService.snoozeRFQ(sellerId, rfqId, new Date(data.until), data.reason);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error snoozing RFQ:', error);
    res.status(500).json({ error: 'Failed to snooze RFQ' });
  }
});

/**
 * DELETE /api/items/rfq/seller/inbox/:rfqId/snooze
 * Unsnooze an RFQ
 */
router.delete('/rfq/seller/inbox/:rfqId/snooze', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId;
    await sellerRfqInboxService.unsnoozeRFQ(sellerId, rfqId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error unsnoozing RFQ:', error);
    res.status(500).json({ error: 'Failed to unsnooze RFQ' });
  }
});

/**
 * POST /api/items/rfq/seller/inbox/bulk/snooze
 * Bulk snooze multiple RFQs
 */
router.post('/rfq/seller/inbox/bulk/snooze', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = bulkSnoozeSchema.parse(req.body);
    const result = await sellerRfqInboxService.bulkSnooze(sellerId, data.rfqIds, new Date(data.until), data.reason);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error bulk snoozing RFQs:', error);
    res.status(500).json({ error: 'Failed to snooze RFQs' });
  }
});

// =============================================================================
// Gmail-Style Features: Read/Unread
// =============================================================================

/**
 * POST /api/items/rfq/seller/inbox/:rfqId/read
 * Mark an RFQ as read
 */
router.post('/rfq/seller/inbox/:rfqId/read', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId;
    await sellerRfqInboxService.markRead(sellerId, rfqId);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error marking RFQ as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * DELETE /api/items/rfq/seller/inbox/:rfqId/read
 * Mark an RFQ as unread
 */
router.delete('/rfq/seller/inbox/:rfqId/read', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId;
    await sellerRfqInboxService.markUnread(sellerId, rfqId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error marking RFQ as unread:', error);
    res.status(500).json({ error: 'Failed to mark as unread' });
  }
});

/**
 * POST /api/items/rfq/seller/inbox/bulk/read
 * Bulk mark RFQs as read
 */
router.post('/rfq/seller/inbox/bulk/read', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = bulkIdsSchema.parse(req.body);
    const result = await sellerRfqInboxService.bulkMarkRead(sellerId, data.rfqIds);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error bulk marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * POST /api/items/rfq/seller/inbox/bulk/unread
 * Bulk mark RFQs as unread
 */
router.post('/rfq/seller/inbox/bulk/unread', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = bulkIdsSchema.parse(req.body);
    const result = await sellerRfqInboxService.bulkMarkUnread(sellerId, data.rfqIds);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error bulk marking as unread:', error);
    res.status(500).json({ error: 'Failed to mark as unread' });
  }
});

// =============================================================================
// Gmail-Style Features: Archive
// =============================================================================

/**
 * POST /api/items/rfq/seller/inbox/:rfqId/archive
 * Archive an RFQ
 */
router.post('/rfq/seller/inbox/:rfqId/archive', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId;
    await sellerRfqInboxService.archiveRFQ(sellerId, rfqId);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error archiving RFQ:', error);
    res.status(500).json({ error: 'Failed to archive RFQ' });
  }
});

/**
 * DELETE /api/items/rfq/seller/inbox/:rfqId/archive
 * Unarchive an RFQ
 */
router.delete('/rfq/seller/inbox/:rfqId/archive', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.rfqId;
    await sellerRfqInboxService.unarchiveRFQ(sellerId, rfqId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error unarchiving RFQ:', error);
    res.status(500).json({ error: 'Failed to unarchive RFQ' });
  }
});

/**
 * POST /api/items/rfq/seller/inbox/bulk/archive
 * Bulk archive RFQs
 */
router.post('/rfq/seller/inbox/bulk/archive', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = bulkIdsSchema.parse(req.body);
    const result = await sellerRfqInboxService.bulkArchive(sellerId, data.rfqIds);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error bulk archiving:', error);
    res.status(500).json({ error: 'Failed to archive RFQs' });
  }
});

/**
 * POST /api/items/rfq/seller/inbox/bulk/unarchive
 * Bulk unarchive RFQs
 */
router.post('/rfq/seller/inbox/bulk/unarchive', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = bulkIdsSchema.parse(req.body);
    const result = await sellerRfqInboxService.bulkUnarchive(sellerId, data.rfqIds);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error bulk unarchiving:', error);
    res.status(500).json({ error: 'Failed to unarchive RFQs' });
  }
});

// =============================================================================
// RFQ Scoring & Intelligence Routes
// =============================================================================

/**
 * GET /api/items/rfq/seller/scored
 * Get scored and prioritized RFQs for seller
 */
router.get('/rfq/seller/scored', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status, priorityTier } = req.query;

    const rfqs = await rfqScoringService.getScoredRFQs(sellerId, {
      status: status as string | undefined,
      priorityTier: priorityTier as PriorityTier | undefined,
    });

    res.json(rfqs);
  } catch (error) {
    apiLogger.error('Error fetching scored RFQs:', error);
    res.status(500).json({ error: 'Failed to fetch scored RFQs' });
  }
});

/**
 * POST /api/items/rfq/seller/:id/calculate-score
 * Calculate/recalculate score for a specific RFQ
 */
router.post('/rfq/seller/:id/calculate-score', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;

    const result = await rfqScoringService.calculateRFQScores(rfqId, sellerId);

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'RFQ not found') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error calculating RFQ score:', error);
    res.status(500).json({ error: 'Failed to calculate RFQ score' });
  }
});

/**
 * POST /api/items/rfq/seller/recalculate-all
 * Batch recalculate scores for all pending RFQs
 */
router.post('/rfq/seller/recalculate-all', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const result = await rfqScoringService.recalculateAllRFQScores(sellerId);

    res.json(result);
  } catch (error) {
    apiLogger.error('Error recalculating RFQ scores:', error);
    res.status(500).json({ error: 'Failed to recalculate RFQ scores' });
  }
});

const quickRespondSchema = z.object({
  acceptSuggestion: z.boolean(),
  price: z.number().min(0).optional(),
  leadTime: z.number().int().min(0).optional(),
  message: z.string().max(2000).optional(),
});

/**
 * POST /api/items/rfq/seller/:id/quick-respond
 * One-click respond to RFQ with suggestion
 */
router.post('/rfq/seller/:id/quick-respond', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const rfqId = req.params.id as string;
    const data = quickRespondSchema.parse(req.body);

    const rfq = await rfqScoringService.quickRespondToRFQ(
      rfqId,
      sellerId,
      data.acceptSuggestion,
      {
        price: data.price,
        leadTime: data.leadTime,
        message: data.message,
      }
    );

    res.json(rfq);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && (error.message === 'RFQ not found or unauthorized')) {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error quick responding to RFQ:', error);
    res.status(500).json({ error: 'Failed to respond to RFQ' });
  }
});

/**
 * GET /api/items/rfq/seller/timeline
 * Get RFQ timeline data for visualization
 */
router.get('/rfq/seller/timeline', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { view } = req.query;

    const data = await rfqScoringService.getRFQTimelineData(
      sellerId,
      (view as 'day' | 'week' | 'month') || 'week'
    );

    res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching RFQ timeline:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ timeline' });
  }
});

/**
 * GET /api/items/rfq/seller/scoring-config
 * Get seller's RFQ scoring configuration
 */
router.get('/rfq/seller/scoring-config', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const config = await rfqScoringService.getOrCreateScoringConfig(sellerId);

    res.json(config);
  } catch (error) {
    apiLogger.error('Error fetching scoring config:', error);
    res.status(500).json({ error: 'Failed to fetch scoring config' });
  }
});

// =============================================================================
// Stage 3: Quote Routes
// =============================================================================

/**
 * POST /api/items/quotes
 * Create a new draft quote for an RFQ
 * Entry condition: RFQ must be in UNDER_REVIEW status
 */
router.post('/quotes', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = createQuoteSchema.parse(req.body);

    // Get the RFQ to find the buyerId
    const rfq = await sellerRfqInboxService.getRFQDetail(data.rfqId, sellerId);
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const result = await quoteService.createDraft({
      rfqId: data.rfqId,
      sellerId,
      buyerId: rfq.buyerId,
      unitPrice: data.unitPrice,
      quantity: data.quantity,
      currency: data.currency,
      discount: data.discount,
      discountPercent: data.discountPercent,
      deliveryDays: data.deliveryDays,
      deliveryTerms: data.deliveryTerms,
      validUntil: new Date(data.validUntil),
      notes: data.notes,
      internalNotes: data.internalNotes,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

/**
 * GET /api/items/quotes
 * Get all quotes for the authenticated seller
 */
router.get('/quotes', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const query = quoteListQuerySchema.parse(req.query);

    const result = await quoteService.getSellerQuotes(sellerId, {
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      quotes: result.quotes,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.issues });
    }
    apiLogger.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

/**
 * GET /api/items/quotes/:id
 * Get a specific quote by ID
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
    apiLogger.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

/**
 * GET /api/items/quotes/rfq/:rfqId
 * Get all quotes for an RFQ
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
    apiLogger.error('Error fetching quotes for RFQ:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

/**
 * PUT /api/items/quotes/:id
 * Update a quote (draft or create revision for sent)
 */
router.put('/quotes/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const data = updateQuoteSchema.parse(req.body);

    const result = await quoteService.updateQuote(quoteId, sellerId, {
      unitPrice: data.unitPrice,
      quantity: data.quantity,
      currency: data.currency,
      discount: data.discount,
      discountPercent: data.discountPercent,
      deliveryDays: data.deliveryDays,
      deliveryTerms: data.deliveryTerms,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes,
      internalNotes: data.internalNotes,
      changeReason: data.changeReason,
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error updating quote:', error);
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

/**
 * POST /api/items/quotes/:id/send
 * Send a quote to the buyer (DRAFT → SENT)
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

    // Notify buyer of received quote
    if (result.quote?.buyerId) {
      portalNotificationService.create({
        userId: result.quote.buyerId,
        portalType: 'buyer',
        type: 'rfq_quote_received',
        entityType: 'rfq',
        entityId: result.quote.rfqId || quoteId,
        entityName: `Quote #${result.quote.quoteNumber}`,
        actorId: sellerId,
      }).catch(err => apiLogger.error('Failed to create quote notification:', err));
    }

    res.json(result.quote);
  } catch (error) {
    apiLogger.error('Error sending quote:', error);
    res.status(500).json({ error: 'Failed to send quote' });
  }
});

/**
 * GET /api/items/quotes/:id/versions
 * Get version history for a quote
 */
router.get('/quotes/:id/versions', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;

    const result = await quoteService.getQuoteVersions(quoteId, userId);

    if (!result.success) {
      if (result.error === 'Quote not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    res.json(result.versions);
  } catch (error) {
    apiLogger.error('Error fetching quote versions:', error);
    res.status(500).json({ error: 'Failed to fetch quote versions' });
  }
});

/**
 * GET /api/items/quotes/:id/history
 * Get event history for a quote
 */
router.get('/quotes/:id/history', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;

    const result = await quoteService.getQuoteHistory(quoteId, userId);

    if (!result.success) {
      if (result.error === 'Quote not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    res.json(result.events);
  } catch (error) {
    apiLogger.error('Error fetching quote history:', error);
    res.status(500).json({ error: 'Failed to fetch quote history' });
  }
});

/**
 * DELETE /api/items/quotes/:id
 * Delete a draft quote (only drafts can be deleted)
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
    apiLogger.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

// =============================================================================
// Stage 4: Marketplace Order Routes
// =============================================================================

/**
 * POST /api/items/quotes/:id/accept
 * Accept a quote and create an order (Buyer action)
 * Entry conditions: Quote.status = SENT, Quote.validUntil > now, RFQ.status = QUOTED
 * Protected by idempotency to prevent duplicate order creation
 */
router.post('/quotes/:id/accept', requireAuth, idempotency({ required: true, entityType: 'order' }), async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const data = acceptQuoteSchema.parse(req.body);

    const result = await marketplaceOrderService.acceptQuote({
      quoteId,
      buyerId,
      shippingAddress: data.shippingAddress,
      buyerNotes: data.buyerNotes,
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error accepting quote:', error);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

/**
 * POST /api/items/quotes/:id/reject
 * Reject a quote (Buyer action)
 */
router.post('/quotes/:id/reject', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const data = rejectQuoteSchema.parse(req.body);

    const result = await marketplaceOrderService.rejectQuote({
      quoteId,
      buyerId,
      reason: data.reason,
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error rejecting quote:', error);
    res.status(500).json({ error: 'Failed to reject quote' });
  }
});

// =============================================================================
// COUNTER-OFFER ROUTES (RFQ → Quote Negotiation)
// =============================================================================

const createCounterOfferSchema = z.object({
  proposedPrice: z.number().positive('Proposed price must be positive'),
  proposedQuantity: z.number().int().positive().optional(),
  proposedDeliveryDays: z.number().int().min(0).optional(),
  message: z.string().max(2000).optional(),
});

const respondCounterOfferSchema = z.object({
  response: z.string().max(1000).optional(),
});

const rejectCounterOfferSchema = z.object({
  response: z.string().min(1).max(1000),
});

/**
 * POST /api/items/quotes/:id/counter-offer
 * Create a counter-offer on a quote (Buyer action)
 */
router.post('/quotes/:id/counter-offer', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const data = createCounterOfferSchema.parse(req.body);

    const { counterOfferService } = await import('../services/counterOfferService');
    const result = await counterOfferService.createCounterOffer({
      quoteId,
      buyerId,
      proposedPrice: data.proposedPrice,
      proposedQuantity: data.proposedQuantity,
      proposedDeliveryDays: data.proposedDeliveryDays,
      message: data.message,
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

    res.status(201).json(result.counterOffer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating counter-offer:', error);
    res.status(500).json({ error: 'Failed to create counter-offer' });
  }
});

/**
 * GET /api/items/quotes/:id/counter-offers
 * Get all counter-offers for a quote
 */
router.get('/quotes/:id/counter-offers', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;

    const { counterOfferService } = await import('../services/counterOfferService');
    const result = await counterOfferService.getCounterOffers(quoteId, userId);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json({ counterOffers: result.counterOffers });
  } catch (error) {
    apiLogger.error('Error getting counter-offers:', error);
    res.status(500).json({ error: 'Failed to get counter-offers' });
  }
});

/**
 * POST /api/items/counter-offers/:id/accept
 * Accept a counter-offer (Seller action)
 */
router.post('/counter-offers/:id/accept', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const counterOfferId = req.params.id as string;
    const data = respondCounterOfferSchema.parse(req.body);

    const { counterOfferService } = await import('../services/counterOfferService');
    const result = await counterOfferService.acceptCounterOffer(
      counterOfferId,
      sellerId,
      data.response
    );

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json({
      counterOffer: result.counterOffer,
      revisedQuote: result.revisedQuote,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error accepting counter-offer:', error);
    res.status(500).json({ error: 'Failed to accept counter-offer' });
  }
});

/**
 * POST /api/items/counter-offers/:id/reject
 * Reject a counter-offer (Seller action)
 */
router.post('/counter-offers/:id/reject', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const counterOfferId = req.params.id as string;
    const data = rejectCounterOfferSchema.parse(req.body);

    const { counterOfferService } = await import('../services/counterOfferService');
    const result = await counterOfferService.rejectCounterOffer(
      counterOfferId,
      sellerId,
      data.response
    );

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json({ counterOffer: result.counterOffer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error rejecting counter-offer:', error);
    res.status(500).json({ error: 'Failed to reject counter-offer' });
  }
});

/**
 * GET /api/items/counter-offers/pending
 * Get pending counter-offers for seller (notifications)
 */
router.get('/counter-offers/pending', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const { counterOfferService } = await import('../services/counterOfferService');
    const result = await counterOfferService.getSellerPendingCounterOffers(sellerId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      counterOffers: result.counterOffers,
      count: result.count,
    });
  } catch (error) {
    apiLogger.error('Error getting pending counter-offers:', error);
    res.status(500).json({ error: 'Failed to get pending counter-offers' });
  }
});

// =============================================================================
// QUOTE ATTACHMENT ROUTES
// =============================================================================

const uploadAttachmentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['spec_sheet', 'certificate', 'terms', 'warranty', 'other']),
  url: z.string().url(),
  size: z.number().int().optional(),
  mimeType: z.string().optional(),
});

/**
 * POST /api/items/quotes/:id/attachments
 * Add an attachment to a quote (Seller action)
 */
router.post('/quotes/:id/attachments', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;
    const data = uploadAttachmentSchema.parse(req.body);

    // Verify quote exists and seller owns it
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.sellerId !== sellerId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this quote' });
    }

    // Can only add attachments to draft or revised quotes
    if (quote.status !== 'draft' && quote.status !== 'revised') {
      return res.status(400).json({
        error: `Cannot add attachments to quote in "${quote.status}" status`,
      });
    }

    // Create the attachment
    const attachment = await prisma.quoteAttachment.create({
      data: {
        quoteId,
        name: data.name,
        type: data.type,
        url: data.url,
        size: data.size,
        mimeType: data.mimeType,
        uploadedBy: sellerId,
      },
    });

    res.status(201).json(attachment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error adding attachment:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
});

/**
 * GET /api/items/quotes/:id/attachments
 * Get all attachments for a quote
 */
router.get('/quotes/:id/attachments', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const quoteId = req.params.id as string;

    // Verify quote exists and user has access
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.sellerId !== userId && quote.buyerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You do not have access to this quote' });
    }

    const attachments = await prisma.quoteAttachment.findMany({
      where: { quoteId },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ attachments });
  } catch (error) {
    apiLogger.error('Error getting attachments:', error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
});

/**
 * DELETE /api/items/quotes/:quoteId/attachments/:attachmentId
 * Remove an attachment from a quote (Seller action)
 */
router.delete('/quotes/:quoteId/attachments/:attachmentId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { quoteId, attachmentId } = req.params;

    // Verify quote exists and seller owns it
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.sellerId !== sellerId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this quote' });
    }

    // Can only remove attachments from draft or revised quotes
    if (quote.status !== 'draft' && quote.status !== 'revised') {
      return res.status(400).json({
        error: `Cannot remove attachments from quote in "${quote.status}" status`,
      });
    }

    // Verify attachment exists and belongs to this quote
    const attachment = await prisma.quoteAttachment.findFirst({
      where: {
        id: attachmentId,
        quoteId,
      },
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete the attachment
    await prisma.quoteAttachment.delete({
      where: { id: attachmentId },
    });

    res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error removing attachment:', error);
    res.status(500).json({ error: 'Failed to remove attachment' });
  }
});

/**
 * GET /api/items/orders/buyer
 * Get orders for the authenticated buyer
 */
router.get('/orders/buyer', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const query = orderListQuerySchema.parse(req.query);

    const result = await marketplaceOrderService.getBuyerOrders(buyerId, {
      status: query.status,
      source: query.source,
      page: query.page,
      limit: query.limit,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      orders: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.issues });
    }
    apiLogger.error('Error fetching buyer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/items/orders/seller
 * Get orders for the authenticated seller
 */
router.get('/orders/seller', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const query = orderListQuerySchema.parse(req.query);

    const result = await marketplaceOrderService.getSellerOrders(sellerId, {
      status: query.status,
      source: query.source,
      page: query.page,
      limit: query.limit,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      orders: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.issues });
    }
    apiLogger.error('Error fetching seller orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/items/orders/:id
 * Get a specific order by ID
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
    apiLogger.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * GET /api/items/orders/:id/history
 * Get audit history for an order
 */
router.get('/orders/:id/history', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const result = await marketplaceOrderService.getOrderHistory(orderId, userId);

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    res.json(result.events);
  } catch (error) {
    apiLogger.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

/**
 * POST /api/items/orders/:id/confirm
 * Seller confirms an order (pending_confirmation -> confirmed)
 */
router.post('/orders/:id/confirm', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const result = await marketplaceOrderService.confirmOrder(orderId, sellerId);

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

/**
 * GET /api/items/orders/stats/buyer
 * Get order statistics for buyer
 */
router.get('/orders/stats/buyer', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;

    const result = await marketplaceOrderService.getOrderStats(buyerId, 'buyer');

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.stats);
  } catch (error) {
    apiLogger.error('Error fetching buyer order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

/**
 * GET /api/items/orders/stats/seller
 * Get order statistics for seller
 */
router.get('/orders/stats/seller', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const result = await marketplaceOrderService.getOrderStats(sellerId, 'seller');

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.stats);
  } catch (error) {
    apiLogger.error('Error fetching seller order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

// =============================================================================
// Stage 5: Order Fulfillment Routes
// =============================================================================

// Zod schemas for fulfillment
const rejectOrderSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

const startProcessingSchema = z.object({
  sellerNotes: z.string().optional(),
});

const shipOrderSchema = z.object({
  carrier: z.string().min(1, 'Carrier name is required'),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  sellerNotes: z.string().optional(),
});

const markDeliveredSchema = z.object({
  buyerNotes: z.string().optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

const updateTrackingSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  carrier: z.string().optional(),
});

/**
 * POST /api/items/orders/:id/reject
 * Seller rejects an order (pending_confirmation -> cancelled)
 */
router.post('/orders/:id/reject', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const validation = rejectOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const result = await marketplaceOrderService.rejectOrder({
      orderId,
      sellerId,
      reason: validation.data.reason,
    });

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('Error rejecting order:', error);
    res.status(500).json({ error: 'Failed to reject order' });
  }
});

/**
 * POST /api/items/orders/:id/process
 * Seller starts processing an order (confirmed -> processing)
 */
router.post('/orders/:id/process', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const validation = startProcessingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const result = await marketplaceOrderService.startProcessing({
      orderId,
      sellerId,
      sellerNotes: validation.data.sellerNotes,
    });

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('Error starting processing:', error);
    res.status(500).json({ error: 'Failed to start processing' });
  }
});

/**
 * POST /api/items/orders/:id/ship
 * Seller ships an order (processing -> shipped)
 */
router.post('/orders/:id/ship', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const validation = shipOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const result = await marketplaceOrderService.shipOrder({
      orderId,
      sellerId,
      carrier: validation.data.carrier,
      trackingNumber: validation.data.trackingNumber,
      estimatedDelivery: validation.data.estimatedDelivery,
      sellerNotes: validation.data.sellerNotes,
    });

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('Error shipping order:', error);
    res.status(500).json({ error: 'Failed to ship order' });
  }
});

/**
 * POST /api/items/orders/:id/deliver
 * Buyer confirms delivery (shipped -> delivered)
 */
router.post('/orders/:id/deliver', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const validation = markDeliveredSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const result = await marketplaceOrderService.markDelivered({
      orderId,
      userId,
      userRole: 'buyer',
      buyerNotes: validation.data.buyerNotes,
    });

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('Error marking delivered:', error);
    res.status(500).json({ error: 'Failed to mark as delivered' });
  }
});

/**
 * POST /api/items/orders/:id/close
 * System closes an order (delivered -> closed)
 */
router.post('/orders/:id/close', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const result = await marketplaceOrderService.closeOrder({
      orderId,
      actorId: userId,
    });

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('Error closing order:', error);
    res.status(500).json({ error: 'Failed to close order' });
  }
});

/**
 * POST /api/items/orders/:id/cancel
 * Seller cancels an order (before shipping)
 */
router.post('/orders/:id/cancel', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const validation = cancelOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const result = await marketplaceOrderService.cancelOrder(
      orderId,
      sellerId,
      validation.data.reason
    );

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

/**
 * PATCH /api/items/orders/:id/tracking
 * Seller updates tracking information
 */
router.patch('/orders/:id/tracking', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const validation = updateTrackingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const result = await marketplaceOrderService.updateTracking(
      orderId,
      sellerId,
      validation.data.trackingNumber,
      validation.data.carrier
    );

    if (!result.success) {
      if (result.error === 'Order not found') {
        return res.status(404).json({ error: result.error });
      }
      if (result.error?.includes('Unauthorized')) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (error) {
    apiLogger.error('Error updating tracking:', error);
    res.status(500).json({ error: 'Failed to update tracking' });
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
