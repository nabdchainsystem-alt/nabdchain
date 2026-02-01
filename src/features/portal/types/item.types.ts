// =============================================================================
// Universal Item System - Type Definitions
// =============================================================================

// Item Types - Classification of items in the marketplace
export type ItemType = 'part' | 'consumable' | 'service';

// Visibility Rules - Controls where the item appears
export type ItemVisibility = 'public' | 'rfq_only' | 'hidden';

// Status Rules - Controls item lifecycle
export type ItemStatus = 'draft' | 'active' | 'out_of_stock' | 'archived';

// Price unit types
export type PriceUnit = 'per_unit' | 'per_kg' | 'per_meter' | 'per_liter' | 'per_set' | 'per_box';

// =============================================================================
// Core Item Interface
// =============================================================================

export interface Item {
  id: string;
  userId: string;

  // Basic Info
  name: string;
  nameAr?: string;
  sku: string;
  partNumber?: string;
  description?: string;
  descriptionAr?: string;

  // Classification
  itemType: ItemType;
  category: string;
  subcategory?: string;

  // Visibility & Status
  visibility: ItemVisibility;
  status: ItemStatus;

  // Pricing
  price: number;
  currency: string;
  priceUnit?: PriceUnit;

  // Inventory
  stock: number;
  minOrderQty: number;
  maxOrderQty?: number;
  leadTimeDays?: number;

  // Product Details
  manufacturer?: string;
  brand?: string;
  origin?: string;

  // Specifications (parsed JSON)
  specifications?: ItemSpecifications;

  // Compatibility (parsed JSON)
  compatibility?: CompatibilityEntry[];

  // Packaging (parsed JSON)
  packaging?: PackagingInfo;

  // Media
  images?: string[];
  documents?: ItemDocument[];

  // RFQ Intelligence
  avgResponseTime?: number;
  totalQuotes: number;
  successfulOrders: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

// =============================================================================
// Supporting Types
// =============================================================================

export interface ItemSpecifications {
  weight?: string;
  weightUnit?: string;
  dimensions?: string;
  material?: string;
  color?: string;
  voltage?: string;
  power?: string;
  capacity?: string;
  [key: string]: string | undefined;
}

export interface CompatibilityEntry {
  make: string;
  model: string;
  years?: string;
  notes?: string;
}

export interface PackagingInfo {
  unitWeight?: string;
  boxQty?: number;
  palletQty?: number;
  packagingType?: string;
  dimensions?: string;
}

export interface ItemDocument {
  name: string;
  type: 'datasheet' | 'manual' | 'certificate' | 'warranty' | 'other';
  url: string;
  size?: number;
}

// =============================================================================
// API Data Transfer Objects
// =============================================================================

export interface CreateItemData {
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
  priceUnit?: PriceUnit;
  stock?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  leadTimeDays?: number;
  manufacturer?: string;
  brand?: string;
  origin?: string;
  specifications?: ItemSpecifications;
  compatibility?: CompatibilityEntry[];
  packaging?: PackagingInfo;
  images?: string[];
  documents?: ItemDocument[];
}

export interface UpdateItemData extends Partial<CreateItemData> {
  id: string;
}

// =============================================================================
// Query/Filter Types
// =============================================================================

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
  origin?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

// =============================================================================
// RFQ Types
// =============================================================================

export type RFQStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';

export interface ItemRFQ {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  message?: string;
  quotedPrice?: number;
  quotedLeadTime?: number;
  responseMessage?: string;
  respondedAt?: string;
  status: RFQStatus;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  item?: Item;
}

export interface CreateRFQData {
  itemId: string;
  quantity: number;
  message?: string;
}

export interface QuoteRFQData {
  quotedPrice: number;
  quotedLeadTime?: number;
  responseMessage?: string;
  expiresAt?: string;
}

// =============================================================================
// Business Logic Helpers
// =============================================================================

/**
 * Determines if an item should appear in the public marketplace
 * Rule: Status = Active AND Visibility != Hidden
 */
export function isMarketplaceVisible(item: Pick<Item, 'status' | 'visibility'>): boolean {
  return item.status === 'active' && item.visibility !== 'hidden';
}

/**
 * Determines if an item is publicly searchable/browsable
 * Rule: Status = Active AND Visibility = Public
 */
export function isPubliclySearchable(item: Pick<Item, 'status' | 'visibility'>): boolean {
  return item.status === 'active' && item.visibility === 'public';
}

/**
 * Determines if an item requires RFQ for pricing
 * Rule: Visibility = RFQ Only
 */
export function requiresRFQ(item: Pick<Item, 'visibility'>): boolean {
  return item.visibility === 'rfq_only';
}

/**
 * Determines if direct "Add to Quote" is allowed
 * Rule: Visibility = Public AND Status = Active
 */
export function canAddToQuote(item: Pick<Item, 'status' | 'visibility'>): boolean {
  return item.status === 'active' && item.visibility === 'public';
}

/**
 * Gets the display status label
 */
export function getStatusLabel(status: ItemStatus): string {
  const labels: Record<ItemStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    out_of_stock: 'Out of Stock',
    archived: 'Archived',
  };
  return labels[status];
}

/**
 * Gets the display visibility label
 */
export function getVisibilityLabel(visibility: ItemVisibility): string {
  const labels: Record<ItemVisibility, string> = {
    public: 'Public',
    rfq_only: 'RFQ Only',
    hidden: 'Hidden',
  };
  return labels[visibility];
}

/**
 * Gets the display item type label
 */
export function getItemTypeLabel(itemType: ItemType): string {
  const labels: Record<ItemType, string> = {
    part: 'Part',
    consumable: 'Consumable',
    service: 'Service',
  };
  return labels[itemType];
}

/**
 * Validates item can be published (set to active)
 * Returns array of validation errors, empty if valid
 */
export function validateForPublishing(item: Partial<Item>): string[] {
  const errors: string[] = [];

  if (!item.name?.trim()) errors.push('Name is required');
  if (!item.sku?.trim()) errors.push('SKU is required');
  if (!item.category?.trim()) errors.push('Category is required');
  if (item.price === undefined || item.price < 0) errors.push('Valid price is required');
  if (item.visibility === 'public' && (item.stock === undefined || item.stock < 0)) {
    errors.push('Stock quantity is required for public items');
  }

  return errors;
}

// =============================================================================
// Category Definitions
// =============================================================================

export const ITEM_CATEGORIES = [
  { key: 'machinery', labelKey: 'categories.machinery' },
  { key: 'spare_parts', labelKey: 'categories.spareParts' },
  { key: 'electronics', labelKey: 'categories.electronics' },
  { key: 'hydraulics', labelKey: 'categories.hydraulics' },
  { key: 'safety_equipment', labelKey: 'categories.safetyEquipment' },
  { key: 'consumables', labelKey: 'categories.consumables' },
  { key: 'tools', labelKey: 'categories.tools' },
  { key: 'materials', labelKey: 'categories.materials' },
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number]['key'];
