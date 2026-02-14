// =============================================================================
// Item Service - Universal Marketplace Item Business Logic
// =============================================================================

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { apiLogger } from '../utils/logger';
import { automationRulesService } from './automationRulesService';

// =============================================================================
// Types
// =============================================================================

export type ItemType = 'part' | 'consumable' | 'service';
export type ItemVisibility = 'public' | 'rfq_only' | 'hidden';
export type ItemStatus = 'draft' | 'active' | 'out_of_stock' | 'archived';
export type RFQStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';

export interface CreateItemInput {
  name: string;
  nameAr?: string;
  sku: string;
  partNumber?: string;
  description?: string;
  descriptionAr?: string;
  itemType?: ItemType;
  category: string;
  subcategory?: string;
  visibility?: ItemVisibility;
  status?: ItemStatus;
  price: number;
  currency?: string;
  priceUnit?: string;
  stock?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  leadTimeDays?: number;
  manufacturer?: string;
  brand?: string;
  origin?: string;
  specifications?: Record<string, unknown>;
  compatibility?: Array<{ make: string; model: string; years?: string }>;
  packaging?: Record<string, unknown>;
  images?: string[];
  documents?: Array<{ name: string; type: string; url: string }>;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {}

export interface ItemFilters {
  status?: ItemStatus;
  visibility?: ItemVisibility;
  itemType?: ItemType;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface MarketplaceFilters {
  category?: string;
  subcategory?: string;
  itemType?: ItemType;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  manufacturer?: string;
  brand?: string;
  sellerId?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
  inStockOnly?: boolean;
}

// =============================================================================
// Empty State Constants (No mock data - production mode)
// =============================================================================

// NOTE: Mock data removed - see MOCK_REMOVAL_REPORT.md
// All data must come from database. Frontend handles empty states gracefully.

// =============================================================================
// Business Logic Helpers
// =============================================================================

/**
 * Determines if an item should appear in the public marketplace
 * Rule: Status = Active AND Visibility != Hidden
 */
export function isMarketplaceVisible(status: ItemStatus, visibility: ItemVisibility): boolean {
  return status === 'active' && visibility !== 'hidden';
}

/**
 * Determines if an item is publicly searchable/browsable
 * Rule: Status = Active AND Visibility = Public
 */
export function isPubliclySearchable(status: ItemStatus, visibility: ItemVisibility): boolean {
  return status === 'active' && visibility === 'public';
}

/**
 * Validates item can be published (set to active)
 */
export function validateForPublishing(item: Partial<CreateItemInput>): string[] {
  const errors: string[] = [];

  if (!item.name?.trim()) errors.push('Name is required');
  if (!item.sku?.trim()) errors.push('SKU is required');
  if (!item.category?.trim()) errors.push('Category is required');
  if (item.price === undefined || item.price < 0) errors.push('Valid price is required');

  return errors;
}

/**
 * Auto-set status based on stock
 */
export function determineStatus(
  requestedStatus: ItemStatus | undefined,
  stock: number,
  currentStatus?: ItemStatus
): ItemStatus {
  // If explicitly setting to archived, respect that
  if (requestedStatus === 'archived') return 'archived';

  // If setting to active but no stock, set to out_of_stock
  if (requestedStatus === 'active' && stock <= 0) return 'out_of_stock';

  // If stock becomes 0 and was active, set to out_of_stock
  if (currentStatus === 'active' && stock <= 0) return 'out_of_stock';

  // If stock added and was out_of_stock, set back to active
  if (currentStatus === 'out_of_stock' && stock > 0) return 'active';

  return requestedStatus || currentStatus || 'draft';
}

// =============================================================================
// Item Service
// =============================================================================

export const itemService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all items for a seller with optional filters
   */
  async getSellerItems(userId: string, filters: ItemFilters = {}) {
    try {
      const where: Prisma.ItemWhereInput = { userId };

      if (filters.status) where.status = filters.status;
      if (filters.visibility) where.visibility = filters.visibility;
      if (filters.itemType) where.itemType = filters.itemType;
      if (filters.category) where.category = { equals: filters.category, mode: 'insensitive' };
      if (filters.inStock) where.stock = { gt: 0 };

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { nameAr: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { partNumber: { contains: filters.search, mode: 'insensitive' } },
          { manufacturer: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
      }

      const items = await prisma.item.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      // Return actual data (empty array if no items - production mode)
      return items;
    } catch (error) {
      apiLogger.error('Error fetching seller items:', error);
      return []; // Return empty array on error - frontend handles empty state
    }
  },

  /**
   * Get single item for seller
   */
  async getSellerItem(userId: string, itemId: string) {
    return prisma.item.findFirst({
      where: { id: itemId, userId },
    });
  },

  /**
   * Create new item
   */
  async createItem(userId: string, data: CreateItemInput) {
    const stock = data.stock ?? 0;
    const status = determineStatus(data.status, stock);

    return prisma.item.create({
      data: {
        userId,
        name: data.name,
        nameAr: data.nameAr,
        sku: data.sku,
        partNumber: data.partNumber,
        description: data.description,
        descriptionAr: data.descriptionAr,
        itemType: data.itemType ?? 'part',
        category: data.category,
        subcategory: data.subcategory,
        visibility: data.visibility ?? 'public',
        status,
        price: data.price,
        currency: data.currency ?? 'SAR',
        priceUnit: data.priceUnit,
        stock,
        minOrderQty: data.minOrderQty ?? 1,
        maxOrderQty: data.maxOrderQty,
        leadTimeDays: data.leadTimeDays,
        manufacturer: data.manufacturer,
        brand: data.brand,
        origin: data.origin,
        specifications: data.specifications ? JSON.stringify(data.specifications) : null,
        compatibility: data.compatibility ? JSON.stringify(data.compatibility) : null,
        packaging: data.packaging ? JSON.stringify(data.packaging) : null,
        images: data.images ? JSON.stringify(data.images) : null,
        documents: data.documents ? JSON.stringify(data.documents) : null,
        publishedAt: status === 'active' ? new Date() : null,
      },
    });
  },

  /**
   * Update item
   */
  async updateItem(userId: string, itemId: string, data: UpdateItemInput) {
    const existing = await prisma.item.findFirst({
      where: { id: itemId, userId },
    });

    if (!existing) return null;

    const newStock = data.stock !== undefined ? data.stock : existing.stock;

    // Auto-activate when making a draft item public
    let requestedStatus = data.status as ItemStatus | undefined;
    if (
      data.visibility === 'public' &&
      existing.visibility === 'hidden' &&
      existing.status === 'draft' &&
      !requestedStatus
    ) {
      requestedStatus = 'active';
    }

    const status = determineStatus(
      requestedStatus,
      newStock,
      existing.status as ItemStatus
    );

    // Track publishing timestamp
    let publishedAt = existing.publishedAt;
    if (status === 'active' && existing.status !== 'active') {
      publishedAt = new Date();
    }

    // Track archiving timestamp
    let archivedAt = existing.archivedAt;
    if (status === 'archived' && existing.status !== 'archived') {
      archivedAt = new Date();
    }

    return prisma.item.update({
      where: { id: itemId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.partNumber !== undefined && { partNumber: data.partNumber }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
        ...(data.itemType !== undefined && { itemType: data.itemType }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        status,
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.priceUnit !== undefined && { priceUnit: data.priceUnit }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.minOrderQty !== undefined && { minOrderQty: data.minOrderQty }),
        ...(data.maxOrderQty !== undefined && { maxOrderQty: data.maxOrderQty }),
        ...(data.leadTimeDays !== undefined && { leadTimeDays: data.leadTimeDays }),
        ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.origin !== undefined && { origin: data.origin }),
        ...(data.specifications !== undefined && {
          specifications: JSON.stringify(data.specifications),
        }),
        ...(data.compatibility !== undefined && {
          compatibility: JSON.stringify(data.compatibility),
        }),
        ...(data.packaging !== undefined && { packaging: JSON.stringify(data.packaging) }),
        ...(data.images !== undefined && { images: JSON.stringify(data.images) }),
        ...(data.documents !== undefined && { documents: JSON.stringify(data.documents) }),
        publishedAt,
        archivedAt,
      },
    });
  },

  /**
   * Delete item (soft delete via archive)
   */
  async deleteItem(userId: string, itemId: string) {
    const existing = await prisma.item.findFirst({
      where: { id: itemId, userId },
    });

    if (!existing) return false;

    await prisma.item.delete({ where: { id: itemId } });
    return true;
  },

  /**
   * Archive item (soft delete)
   */
  async archiveItem(userId: string, itemId: string) {
    const existing = await prisma.item.findFirst({
      where: { id: itemId, userId },
    });

    if (!existing) return null;

    return prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'archived',
        archivedAt: new Date(),
      },
    });
  },

  /**
   * Bulk update item status
   */
  async bulkUpdateStatus(userId: string, itemIds: string[], status: ItemStatus) {
    return prisma.item.updateMany({
      where: {
        id: { in: itemIds },
        userId,
      },
      data: {
        status,
        ...(status === 'active' && { publishedAt: new Date() }),
        ...(status === 'archived' && { archivedAt: new Date() }),
      },
    });
  },

  /**
   * Bulk update item visibility
   */
  async bulkUpdateVisibility(userId: string, itemIds: string[], visibility: ItemVisibility) {
    if (visibility === 'public') {
      // Auto-activate draft items when making them public
      await prisma.item.updateMany({
        where: {
          id: { in: itemIds },
          userId,
          status: 'draft',
          visibility: 'hidden',
        },
        data: { visibility, status: 'active', publishedAt: new Date() },
      });
      // Update remaining items (non-draft) visibility only
      return prisma.item.updateMany({
        where: {
          id: { in: itemIds },
          userId,
          status: { not: 'draft' },
        },
        data: { visibility },
      });
    }

    return prisma.item.updateMany({
      where: {
        id: { in: itemIds },
        userId,
      },
      data: { visibility },
    });
  },

  // ---------------------------------------------------------------------------
  // Marketplace Operations (Buyer View)
  // ---------------------------------------------------------------------------

  /**
   * Get marketplace items (public view)
   * Only returns items where Status = Active AND Visibility != Hidden
   */
  async getMarketplaceItems(filters: MarketplaceFilters = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'newest', inStockOnly } = filters;
      const skip = (page - 1) * limit;

      const where: Prisma.ItemWhereInput = {
        // Show active and out_of_stock items (not draft or archived)
        status: { in: ['active', 'out_of_stock'] },
        visibility: { not: 'hidden' },
      };

      // If inStockOnly filter is true, only show items with stock > 0
      if (inStockOnly) {
        where.stock = { gt: 0 };
      }

      if (filters.category) where.category = { equals: filters.category, mode: 'insensitive' };
      if (filters.subcategory) where.subcategory = { equals: filters.subcategory, mode: 'insensitive' };
      if (filters.itemType) where.itemType = filters.itemType;
      if (filters.manufacturer) where.manufacturer = filters.manufacturer;
      if (filters.brand) where.brand = filters.brand;
      if (filters.sellerId) where.userId = filters.sellerId;

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { nameAr: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { partNumber: { contains: filters.search, mode: 'insensitive' } },
          { manufacturer: { contains: filters.search, mode: 'insensitive' } },
          { brand: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
      }

      // Determine sort order
      let orderBy: Prisma.ItemOrderByWithRelationInput = { createdAt: 'desc' };
      switch (sortBy) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'popular':
          orderBy = { successfulOrders: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { publishedAt: 'desc' };
      }

      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        }),
        prisma.item.count({ where }),
      ]);

      // Return actual data - frontend handles empty states gracefully
      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      apiLogger.error('[ItemService] Error fetching marketplace items:', error);
      // Return empty results on error - frontend handles empty states
      const { page = 1, limit = 20 } = filters;
      return {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  },

  /**
   * Get single marketplace item (public view)
   */
  async getMarketplaceItem(itemId: string) {
    return prisma.item.findFirst({
      where: {
        id: itemId,
        status: 'active',
        visibility: { not: 'hidden' },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Get items by seller (public view - for seller profile)
   */
  async getSellerPublicItems(sellerId: string, filters: MarketplaceFilters = {}) {
    return this.getMarketplaceItems({ ...filters, sellerId });
  },

  // ---------------------------------------------------------------------------
  // RFQ Operations
  // ---------------------------------------------------------------------------

  /**
   * Create RFQ request from buyer
   */
  async createRFQ(
    buyerId: string,
    data: {
      itemId?: string | null;
      sellerId?: string | null;
      quantity: number;
      deliveryLocation?: string;
      deliveryCity?: string;
      deliveryCountry?: string;
      requiredDeliveryDate?: Date;
      message?: string;
      priority?: string;
      source?: string;
    }
  ) {
    let sellerId = data.sellerId;
    let itemId = data.itemId;

    // If itemId provided, get item info and seller
    if (itemId) {
      const item = await prisma.item.findFirst({
        where: {
          id: itemId,
          status: 'active',
          visibility: { not: 'hidden' },
        },
      });

      if (!item) {
        throw new Error('Item not found or not available');
      }
      sellerId = item.userId;
    }

    // Determine RFQ type based on whether a specific seller is targeted
    // DIRECT: sellerId is set - appears in that seller's inbox only
    // MARKETPLACE: sellerId is null - appears in RFQ Marketplace for all sellers
    const rfqType = sellerId ? 'DIRECT' : 'MARKETPLACE';

    // Generate RFQ number
    const count = await prisma.itemRFQ.count();
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const rfq = await prisma.itemRFQ.create({
      data: {
        rfqNumber,
        itemId: itemId || null,
        buyerId,
        sellerId: sellerId || null,
        rfqType, // DIRECT or MARKETPLACE
        quantity: data.quantity,
        deliveryLocation: data.deliveryLocation || '',
        deliveryCity: data.deliveryCity,
        deliveryCountry: data.deliveryCountry || 'SA',
        requiredDeliveryDate: data.requiredDeliveryDate,
        message: data.message,
        priority: data.priority || 'normal',
        source: data.source || 'item',
        status: 'new',
      },
      include: {
        item: true,
      },
    });

    // Fire-and-forget: trigger automation rules for new RFQ (only for DIRECT RFQs with a seller)
    if (sellerId) {
      automationRulesService.onRFQReceived(rfq.id, sellerId).catch((err) => {
        apiLogger.warn('Automation trigger failed for RFQ received:', err);
      });
    }

    return rfq;
  },

  /**
   * Get RFQs for seller inbox - ONLY DIRECT RFQs targeted to this specific seller
   * MARKETPLACE RFQs are handled separately by rfqMarketplaceRoutes
   */
  async getSellerRFQs(sellerId: string, status?: RFQStatus) {
    // Only return DIRECT RFQs where this seller is specifically targeted
    // MARKETPLACE RFQs should NOT appear in seller inbox - they go to RFQ Marketplace
    const where: Prisma.ItemRFQWhereInput = {
      sellerId,
      rfqType: 'DIRECT',
      ...(status ? { status } : {}),
    };

    return prisma.itemRFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        item: true,
        lineItems: { orderBy: { position: 'asc' } },
      },
    });
  },

  /**
   * Get RFQs for buyer
   * Includes quotes (visible to buyer) so buyer can see quoted prices
   */
  async getBuyerRFQs(buyerId: string, status?: RFQStatus) {
    const where: Prisma.ItemRFQWhereInput = { buyerId };
    if (status) where.status = status;

    // Get RFQs with quotes
    const rfqs = await prisma.itemRFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        item: true,
        lineItems: { orderBy: { position: 'asc' } },
        // Include quotes for this RFQ (buyer needs to see them)
        quotes: {
          where: {
            // Only include sent, accepted, or rejected quotes (not drafts)
            status: { in: ['sent', 'revised', 'accepted', 'rejected'] },
            isLatest: true,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            lineItems: { orderBy: { position: 'asc' } },
          },
        },
      },
    });

    // Get seller profile info for quotes (separate lookup since no direct relation)
    // Note: sellerId in Quote is the User's Clerk ID, not SellerProfile.id
    const sellerUserIds = [...new Set(rfqs.flatMap(rfq => rfq.quotes.map(q => q.sellerId)))];
    const sellerProfiles = sellerUserIds.length > 0
      ? await prisma.sellerProfile.findMany({
          where: { userId: { in: sellerUserIds } },
          select: { userId: true, displayName: true },
        })
      : [];

    // Map by userId, return companyName for frontend compatibility
    const sellerMap = new Map(sellerProfiles.map(s => [s.userId, { companyName: s.displayName }]));

    // Attach seller info to quotes
    return rfqs.map(rfq => ({
      ...rfq,
      quotes: rfq.quotes.map(quote => ({
        ...quote,
        seller: sellerMap.get(quote.sellerId) || null,
      })),
    }));
  },

  /**
   * Respond to RFQ (seller)
   * Supports both targeted RFQs (sellerId matches) and broadcast RFQs (sellerId is null)
   */
  async respondToRFQ(
    sellerId: string,
    rfqId: string,
    data: {
      quotedPrice: number;
      quotedLeadTime?: number;
      responseMessage?: string;
      expiresAt?: Date;
    }
  ) {
    // Find RFQ that's either targeted to this seller OR is a broadcast RFQ
    const rfq = await prisma.itemRFQ.findFirst({
      where: {
        id: rfqId,
        OR: [
          { sellerId },
          { sellerId: null }, // Broadcast RFQs can be claimed by any seller
        ],
      },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Update item RFQ stats (only if item exists)
    if (rfq.itemId) {
      await prisma.item.update({
        where: { id: rfq.itemId },
        data: {
          totalQuotes: { increment: 1 },
        },
      });
    }

    return prisma.itemRFQ.update({
      where: { id: rfqId },
      data: {
        quotedPrice: data.quotedPrice,
        quotedLeadTime: data.quotedLeadTime,
        responseMessage: data.responseMessage,
        expiresAt: data.expiresAt,
        respondedAt: new Date(),
        status: 'quoted',
      },
    });
  },

  /**
   * Accept/Reject RFQ (buyer)
   */
  async updateRFQStatus(buyerId: string, rfqId: string, status: 'accepted' | 'rejected') {
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, buyerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // If accepted, update item successful orders count (only if item exists)
    if (status === 'accepted' && rfq.itemId) {
      await prisma.item.update({
        where: { id: rfq.itemId },
        data: {
          successfulOrders: { increment: 1 },
        },
      });
    }

    return prisma.itemRFQ.update({
      where: { id: rfqId },
      data: { status },
    });
  },

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  /**
   * Get seller item statistics
   */
  async getSellerStats(userId: string) {
    try {
      const [totalItems, activeItems, draftItems, outOfStockItems, totalQuotes, successfulOrders] =
        await Promise.all([
          prisma.item.count({ where: { userId } }),
          prisma.item.count({ where: { userId, status: 'active' } }),
          prisma.item.count({ where: { userId, status: 'draft' } }),
          prisma.item.count({ where: { userId, status: 'out_of_stock' } }),
          prisma.item.aggregate({
            where: { userId },
            _sum: { totalQuotes: true },
          }),
          prisma.item.aggregate({
            where: { userId },
            _sum: { successfulOrders: true },
          }),
        ]);

      return {
        totalItems,
        activeItems,
        draftItems,
        outOfStockItems,
        totalQuotes: totalQuotes._sum.totalQuotes || 0,
        successfulOrders: successfulOrders._sum.successfulOrders || 0,
      };
    } catch (error) {
      apiLogger.error('Error fetching seller stats:', error);
      // Return empty stats on error - frontend handles empty state
      return {
        totalItems: 0,
        activeItems: 0,
        draftItems: 0,
        outOfStockItems: 0,
        totalQuotes: 0,
        successfulOrders: 0,
      };
    }
  },

  // ---------------------------------------------------------------------------
  // Migration Helper
  // ---------------------------------------------------------------------------

  /**
   * Migrate from PortalProduct to Item
   */
  async migrateFromPortalProduct(userId: string) {
    const products = await prisma.portalProduct.findMany({
      where: { userId },
    });

    const items = products.map((p) => ({
      userId: p.userId,
      name: p.name,
      sku: p.sku,
      partNumber: p.partNumber,
      description: p.description,
      itemType: 'part' as const,
      category: p.category,
      visibility: 'public' as const,
      status: p.status === 'active' ? 'active' : p.status === 'out_of_stock' ? 'out_of_stock' : 'draft',
      price: p.price,
      currency: p.currency,
      stock: p.stock,
      minOrderQty: p.minOrderQty,
      manufacturer: p.manufacturer,
      brand: p.brand,
      specifications: JSON.stringify({
        weight: p.weight,
        weightUnit: p.weightUnit,
        dimensions: p.dimensions,
        material: p.material,
      }),
      images: p.image ? JSON.stringify([p.image]) : null,
      publishedAt: p.status === 'active' ? p.createdAt : null,
    }));

    return prisma.item.createMany({
      data: items,
      skipDuplicates: true,
    });
  },
};

export default itemService;
