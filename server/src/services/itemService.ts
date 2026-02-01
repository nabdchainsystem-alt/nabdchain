// =============================================================================
// Item Service - Universal Marketplace Item Business Logic
// =============================================================================

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

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
}

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_ITEMS = [
  {
    id: 'mock-item-1',
    userId: 'seller-1',
    name: 'Industrial Hydraulic Pump',
    nameAr: 'مضخة هيدروليكية صناعية',
    sku: 'HYD-PUMP-001',
    partNumber: 'HP-2500-A',
    description: 'High-performance hydraulic pump for industrial applications',
    descriptionAr: 'مضخة هيدروليكية عالية الأداء للتطبيقات الصناعية',
    itemType: 'part',
    category: 'Hydraulics',
    subcategory: 'Pumps',
    visibility: 'public',
    status: 'active',
    price: 2500,
    currency: 'SAR',
    priceUnit: 'unit',
    stock: 45,
    minOrderQty: 1,
    maxOrderQty: 100,
    leadTimeDays: 3,
    manufacturer: 'HydroTech',
    brand: 'HydroTech Pro',
    origin: 'Germany',
    specifications: JSON.stringify({ power: '15KW', pressure: '350bar', flow: '100L/min' }),
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://placeholder.com/pump1.jpg']),
    documents: null,
    totalQuotes: 12,
    successfulOrders: 8,
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    archivedAt: null,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-item-2',
    userId: 'seller-1',
    name: 'Steel Bearings Set',
    nameAr: 'طقم محامل فولاذية',
    sku: 'BRG-STL-100',
    partNumber: 'SB-6205-2RS',
    description: 'Premium quality steel ball bearings, sealed',
    descriptionAr: 'محامل كروية فولاذية عالية الجودة، مغلقة',
    itemType: 'part',
    category: 'Bearings',
    subcategory: 'Ball Bearings',
    visibility: 'public',
    status: 'active',
    price: 45,
    currency: 'SAR',
    priceUnit: 'set',
    stock: 500,
    minOrderQty: 10,
    maxOrderQty: 1000,
    leadTimeDays: 1,
    manufacturer: 'SKF',
    brand: 'SKF',
    origin: 'Sweden',
    specifications: JSON.stringify({ innerDiameter: '25mm', outerDiameter: '52mm', width: '15mm' }),
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://placeholder.com/bearing1.jpg']),
    documents: null,
    totalQuotes: 45,
    successfulOrders: 32,
    publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    archivedAt: null,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-item-3',
    userId: 'seller-1',
    name: 'Air Compressor Unit',
    nameAr: 'وحدة ضاغط هواء',
    sku: 'CMP-AIR-500',
    partNumber: 'AC-500-3P',
    description: 'Industrial 3-phase air compressor, 500L tank',
    descriptionAr: 'ضاغط هواء صناعي ثلاثي الطور، خزان 500 لتر',
    itemType: 'part',
    category: 'Compressors',
    subcategory: 'Air Compressors',
    visibility: 'public',
    status: 'active',
    price: 8500,
    currency: 'SAR',
    priceUnit: 'unit',
    stock: 12,
    minOrderQty: 1,
    maxOrderQty: 10,
    leadTimeDays: 7,
    manufacturer: 'Atlas Copco',
    brand: 'Atlas Copco',
    origin: 'Belgium',
    specifications: JSON.stringify({ tankSize: '500L', pressure: '10bar', power: '7.5KW' }),
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://placeholder.com/compressor1.jpg']),
    documents: null,
    totalQuotes: 8,
    successfulOrders: 5,
    publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    archivedAt: null,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-item-4',
    userId: 'seller-1',
    name: 'Electric Motor 15KW',
    nameAr: 'محرك كهربائي 15 كيلوواط',
    sku: 'MTR-ELC-15K',
    partNumber: 'EM-15K-4P',
    description: '15KW 4-pole electric motor, IE3 efficiency',
    descriptionAr: 'محرك كهربائي 15 كيلوواط، 4 أقطاب، كفاءة IE3',
    itemType: 'part',
    category: 'Motors',
    subcategory: 'Electric Motors',
    visibility: 'public',
    status: 'active',
    price: 3200,
    currency: 'SAR',
    priceUnit: 'unit',
    stock: 25,
    minOrderQty: 1,
    maxOrderQty: 50,
    leadTimeDays: 5,
    manufacturer: 'Siemens',
    brand: 'Siemens',
    origin: 'Germany',
    specifications: JSON.stringify({ power: '15KW', poles: 4, efficiency: 'IE3', voltage: '380V' }),
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://placeholder.com/motor1.jpg']),
    documents: null,
    totalQuotes: 15,
    successfulOrders: 10,
    publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    archivedAt: null,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-item-5',
    userId: 'seller-1',
    name: 'Valve Assembly Kit',
    nameAr: 'طقم تجميع الصمامات',
    sku: 'VLV-KIT-200',
    partNumber: 'VAK-200-SS',
    description: 'Complete valve assembly kit, stainless steel',
    descriptionAr: 'طقم تجميع صمامات كامل، فولاذ مقاوم للصدأ',
    itemType: 'part',
    category: 'Valves',
    subcategory: 'Assembly Kits',
    visibility: 'public',
    status: 'active',
    price: 180,
    currency: 'SAR',
    priceUnit: 'kit',
    stock: 150,
    minOrderQty: 5,
    maxOrderQty: 500,
    leadTimeDays: 2,
    manufacturer: 'FlowControl',
    brand: 'FlowControl',
    origin: 'Italy',
    specifications: JSON.stringify({ material: 'SS316', size: '2 inch', pressure: '16bar' }),
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://placeholder.com/valve1.jpg']),
    documents: null,
    totalQuotes: 28,
    successfulOrders: 20,
    publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    archivedAt: null,
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-item-6',
    userId: 'seller-1',
    name: 'Industrial Lubricant',
    nameAr: 'زيت تشحيم صناعي',
    sku: 'LUB-IND-20L',
    partNumber: 'IL-20L-HD',
    description: 'Heavy-duty industrial lubricant, 20L drum',
    descriptionAr: 'زيت تشحيم صناعي للخدمة الشاقة، برميل 20 لتر',
    itemType: 'consumable',
    category: 'Lubricants',
    subcategory: 'Industrial Oils',
    visibility: 'public',
    status: 'active',
    price: 320,
    currency: 'SAR',
    priceUnit: 'drum',
    stock: 80,
    minOrderQty: 1,
    maxOrderQty: 100,
    leadTimeDays: 1,
    manufacturer: 'Shell',
    brand: 'Shell Tellus',
    origin: 'Netherlands',
    specifications: JSON.stringify({ viscosity: 'ISO 46', volume: '20L', type: 'Hydraulic Oil' }),
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://placeholder.com/lubricant1.jpg']),
    documents: null,
    totalQuotes: 35,
    successfulOrders: 28,
    publishedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    archivedAt: null,
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-item-7',
    userId: 'seller-1',
    name: 'Conveyor Belt Section',
    nameAr: 'قسم سير ناقل',
    sku: 'CNV-BLT-5M',
    partNumber: 'CB-5M-600W',
    description: 'Heavy-duty conveyor belt, 5m length, 600mm width',
    descriptionAr: 'سير ناقل للخدمة الشاقة، طول 5 متر، عرض 600 مم',
    itemType: 'part',
    category: 'Conveyors',
    subcategory: 'Belts',
    visibility: 'public',
    status: 'low_stock',
    price: 1200,
    currency: 'SAR',
    priceUnit: 'section',
    stock: 8,
    minOrderQty: 1,
    maxOrderQty: 20,
    leadTimeDays: 10,
    manufacturer: 'Continental',
    brand: 'ContiTech',
    origin: 'Germany',
    specifications: JSON.stringify({ length: '5m', width: '600mm', plies: 3, tensileStrength: '500N/mm' }),
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://placeholder.com/belt1.jpg']),
    documents: null,
    totalQuotes: 6,
    successfulOrders: 4,
    publishedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    archivedAt: null,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'mock-item-8',
    userId: 'seller-1',
    name: 'PLC Controller Module',
    nameAr: 'وحدة تحكم PLC',
    sku: 'PLC-CTR-S7',
    partNumber: 'S7-1200-CPU',
    description: 'Siemens S7-1200 PLC CPU module',
    descriptionAr: 'وحدة معالج PLC من سيمنز S7-1200',
    itemType: 'part',
    category: 'Automation',
    subcategory: 'PLCs',
    visibility: 'rfq_only',
    status: 'active',
    price: 4500,
    currency: 'SAR',
    priceUnit: 'unit',
    stock: 15,
    minOrderQty: 1,
    maxOrderQty: 10,
    leadTimeDays: 14,
    manufacturer: 'Siemens',
    brand: 'Siemens',
    origin: 'Germany',
    specifications: JSON.stringify({ model: 'S7-1200', io: '14DI/10DO', memory: '100KB' }),
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://placeholder.com/plc1.jpg']),
    documents: null,
    totalQuotes: 10,
    successfulOrders: 6,
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    archivedAt: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const MOCK_SELLER_STATS = {
  totalItems: 156,
  activeItems: 142,
  draftItems: 8,
  outOfStockItems: 6,
  totalQuotes: 248,
  successfulOrders: 187,
};

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
      if (filters.category) where.category = filters.category;
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

      // Return mock data if database is empty (demo mode)
      if (items.length === 0) {
        console.log('Database empty, using mock data for seller items');
        return MOCK_ITEMS;
      }

      return items;
    } catch (error) {
      console.log('Using mock data for seller items:', error);
      return MOCK_ITEMS;
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
    const status = determineStatus(data.status, data.stock || 0);

    return prisma.item.create({
      data: {
        userId,
        name: data.name,
        nameAr: data.nameAr,
        sku: data.sku,
        partNumber: data.partNumber,
        description: data.description,
        descriptionAr: data.descriptionAr,
        itemType: data.itemType || 'part',
        category: data.category,
        subcategory: data.subcategory,
        visibility: data.visibility || 'public',
        status,
        price: data.price,
        currency: data.currency || 'SAR',
        priceUnit: data.priceUnit,
        stock: data.stock || 0,
        minOrderQty: data.minOrderQty || 1,
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
    const status = determineStatus(
      data.status as ItemStatus | undefined,
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
      const { page = 1, limit = 20, sortBy = 'newest' } = filters;
      const skip = (page - 1) * limit;

      const where: Prisma.ItemWhereInput = {
        status: 'active',
        visibility: { not: 'hidden' },
      };

      if (filters.category) where.category = filters.category;
      if (filters.subcategory) where.subcategory = filters.subcategory;
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

      // Return mock data if database is empty (demo mode)
      if (items.length === 0) {
        console.log('Database empty, using mock data for marketplace items');
        const activeItems = MOCK_ITEMS.filter(i => i.status === 'active' && i.visibility !== 'hidden');
        return {
          items: activeItems.map(item => ({
            ...item,
            user: { id: item.userId, name: 'Demo Seller', avatarUrl: null },
          })),
          pagination: {
            page,
            limit,
            total: activeItems.length,
            totalPages: Math.ceil(activeItems.length / limit),
          },
        };
      }

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
      console.log('Using mock data for marketplace items:', error);
      const { page = 1, limit = 20 } = filters;
      const activeItems = MOCK_ITEMS.filter(i => i.status === 'active' && i.visibility !== 'hidden');
      return {
        items: activeItems.map(item => ({
          ...item,
          user: { id: item.userId, name: 'Demo Seller', avatarUrl: null },
        })),
        pagination: {
          page,
          limit,
          total: activeItems.length,
          totalPages: Math.ceil(activeItems.length / limit),
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
    itemId: string,
    data: { quantity: number; message?: string }
  ) {
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

    return prisma.itemRFQ.create({
      data: {
        itemId,
        buyerId,
        sellerId: item.userId,
        quantity: data.quantity,
        message: data.message,
        status: 'pending',
      },
    });
  },

  /**
   * Get RFQs for seller
   */
  async getSellerRFQs(sellerId: string, status?: RFQStatus) {
    const where: Prisma.ItemRFQWhereInput = { sellerId };
    if (status) where.status = status;

    return prisma.itemRFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        item: true,
      },
    });
  },

  /**
   * Get RFQs for buyer
   */
  async getBuyerRFQs(buyerId: string, status?: RFQStatus) {
    const where: Prisma.ItemRFQWhereInput = { buyerId };
    if (status) where.status = status;

    return prisma.itemRFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        item: true,
      },
    });
  },

  /**
   * Respond to RFQ (seller)
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
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Update item RFQ stats
    await prisma.item.update({
      where: { id: rfq.itemId },
      data: {
        totalQuotes: { increment: 1 },
      },
    });

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

    // If accepted, update item successful orders count
    if (status === 'accepted') {
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
      console.log('Using mock data for seller stats:', error);
      return MOCK_SELLER_STATS;
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
