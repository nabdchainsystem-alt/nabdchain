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
  // Stock filtering
  inStock?: boolean; // Only show items with stock > 0
  includeOutOfStock?: boolean; // Include out of stock items (RFQ allowed)
}

// =============================================================================
// RFQ Types (Stage 1)
// =============================================================================

// RFQ Status - starts as 'new' at creation
export type RFQStatus = 'new' | 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';

// RFQ Source - tracks entry point
export type RFQSource = 'item' | 'profile' | 'listing';

// RFQ Priority levels
export type RFQPriority = 'normal' | 'urgent' | 'critical';

export interface ItemRFQ {
  id: string;
  itemId: string | null; // Nullable for profile-level RFQs
  buyerId: string;
  sellerId: string;
  quantity: number;
  message?: string;

  // Stage 1: Delivery Information
  deliveryLocation?: string;
  deliveryCity?: string;
  deliveryCountry: string;
  requiredDeliveryDate?: string;

  // Stage 1: Metadata
  priority: RFQPriority;
  source: RFQSource;

  // Quote Response (Seller fills these)
  quotedPrice?: number;
  quotedLeadTime?: number;
  responseMessage?: string;
  respondedAt?: string;

  // Lifecycle
  status: RFQStatus;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  item?: Item;

  // Quotes (populated by backend when fetching buyer RFQs)
  // Uses inline type to avoid circular reference with Quote interface defined later
  quotes?: Array<{
    id: string;
    quoteNumber?: string;
    rfqId: string;
    sellerId: string;
    buyerId: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    currency: string;
    discount?: number | null;
    discountPercent?: number | null;
    deliveryDays: number;
    deliveryTerms?: string | null;
    validUntil: string;
    notes?: string | null;
    internalNotes?: string | null;
    status: string;
    sentAt?: string | null;
    version: number;
    isLatest: boolean;
    createdAt: string;
    updatedAt: string;
    expiredAt?: string | null;
    acceptedAt?: string | null;
    rejectedAt?: string | null;
  }>;

  // Seller info (populated for buyer views)
  sellerCompanyName?: string;

  // For backwards compat with old code that expects rfqNumber
  rfqNumber?: string;
}

// Create RFQ request data (Stage 1)
export interface CreateRFQData {
  itemId?: string | null; // Nullable for profile-level RFQs
  sellerId?: string | null; // Nullable for broadcast RFQs (visible to all sellers)
  quantity: number;
  deliveryLocation: string; // Required
  deliveryCity?: string;
  deliveryCountry?: string; // Default: 'SA'
  requiredDeliveryDate?: string; // ISO datetime string
  message?: string;
  priority?: RFQPriority;
  source?: RFQSource; // Optional, defaults to 'item'
}

// RFQ Form State for controlled form
export interface RFQFormState {
  quantity: number;
  deliveryLocation: string;
  deliveryCity: string;
  deliveryCountry: string;
  requiredDeliveryDate: string;
  message: string;
  priority: RFQPriority;
}

// Form validation errors
export interface RFQFormErrors {
  quantity?: string;
  deliveryLocation?: string;
  requiredDeliveryDate?: string;
  message?: string;
}

export interface QuoteRFQData {
  quotedPrice: number;
  quotedLeadTime?: number;
  responseMessage?: string;
  expiresAt?: string;
}

// =============================================================================
// RFQ Types (Stage 2) - Seller Inbox
// =============================================================================

// Stage 2 status values - seller workflow (includes Stage 3 statuses for marketplace RFQs)
export type Stage2RFQStatus =
  | 'new'
  | 'viewed'
  | 'under_review'
  | 'ignored'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'expired';

// Auto-calculated priority levels
export type RFQPriorityLevel = 'high' | 'medium' | 'low';

// RFQ Event types for audit trail
export type RFQEventType =
  | 'RFQ_CREATED'
  | 'RFQ_VIEWED'
  | 'RFQ_UNDER_REVIEW'
  | 'RFQ_IGNORED'
  | 'NOTE_ADDED'
  | 'STATUS_CHANGED';

// Event actor types
export type RFQActorType = 'seller' | 'buyer' | 'system';

/**
 * RFQ Event for audit trail / history
 */
export interface RFQEvent {
  id: string;
  rfqId: string;
  actorId: string;
  actorType: RFQActorType;
  eventType: RFQEventType;
  fromStatus?: string;
  toStatus?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Seller Inbox RFQ - extends ItemRFQ with Stage 2 fields
 * Overrides status to use Stage2RFQStatus for seller inbox workflow
 */
export interface SellerInboxRFQ extends Omit<ItemRFQ, 'status'> {
  // Stage 2 status (overrides ItemRFQ.status)
  status: Stage2RFQStatus;

  // Original RFQ status from Stage 1 (preserved for reference)
  originalStatus?: RFQStatus;

  // Human-readable RFQ number
  rfqNumber?: string;

  // Stage 2: View tracking
  viewedAt?: string;
  viewedBy?: string;

  // Stage 2: Under Review tracking
  underReviewAt?: string;
  underReviewBy?: string;

  // Stage 2: Ignored tracking
  ignoredAt?: string;
  ignoredBy?: string;
  ignoredReason?: string;

  // Stage 2: Internal notes (seller-only) - deprecated, use notes relation
  internalNotes?: string;

  // Stage 2: Auto-calculated priority
  priorityLevel: RFQPriorityLevel;
  priorityScore?: number;

  // Buyer info (limited)
  buyerCompanyName?: string;

  // Event history (optional, loaded on detail)
  events?: RFQEvent[];

  // Gmail-style fields
  isRead: boolean;
  isArchived: boolean;
  archivedAt?: string;
  labels?: RFQLabelAssignment[];
  noteCount?: number;
  snooze?: RFQSnoozeInfo | null;

  // RFQ Type - DIRECT (buyer contacted seller directly) or MARKETPLACE (open RFQ)
  rfqType?: 'DIRECT' | 'MARKETPLACE';
}

/**
 * Inbox filter parameters
 */
export interface InboxFilters {
  status?: Stage2RFQStatus;
  priorityLevel?: RFQPriorityLevel;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priorityScore' | 'requiredDeliveryDate';
  sortOrder?: 'asc' | 'desc';
  // Gmail-style filters
  labelId?: string;
  isRead?: boolean;
  isArchived?: boolean;
  isSnoozed?: boolean;
}

/**
 * Inbox statistics
 */
export interface InboxStats {
  new: number;
  viewed: number;
  underReview: number;
  ignored: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

/**
 * Paginated inbox response
 */
export interface InboxResponse {
  rfqs: SellerInboxRFQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: InboxStats;
}

/**
 * Status update request
 */
export interface StatusUpdateData {
  status: 'under_review' | 'ignored';
  ignoredReason?: string;
}

/**
 * Internal note request
 */
export interface InternalNoteData {
  note: string;
}

/**
 * Get priority level display configuration
 */
export function getPriorityLevelConfig(level: RFQPriorityLevel): {
  label: string;
  labelKey: string;
  color: 'error' | 'warning' | 'info';
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  const configs: Record<RFQPriorityLevel, ReturnType<typeof getPriorityLevelConfig>> = {
    high: {
      label: 'High',
      labelKey: 'seller.inbox.priorityHigh',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    medium: {
      label: 'Medium',
      labelKey: 'seller.inbox.priorityMedium',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    low: {
      label: 'Low',
      labelKey: 'seller.inbox.priorityLow',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
  };
  return configs[level];
}

/**
 * Get Stage 2 status display configuration
 */
export function getStage2StatusConfig(status: Stage2RFQStatus): {
  label: string;
  labelKey: string;
  color: 'error' | 'warning' | 'info' | 'success';
  bgColor: string;
  textColor: string;
  icon: 'envelope' | 'eye' | 'magnifying-glass' | 'x-circle' | 'check-circle' | 'paper-plane' | 'clock';
} {
  const configs: Record<Stage2RFQStatus, ReturnType<typeof getStage2StatusConfig>> = {
    new: {
      label: 'New',
      labelKey: 'seller.inbox.statusNew',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: 'envelope',
    },
    viewed: {
      label: 'Viewed',
      labelKey: 'seller.inbox.statusViewed',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      icon: 'eye',
    },
    under_review: {
      label: 'Under Review',
      labelKey: 'seller.inbox.statusUnderReview',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      icon: 'magnifying-glass',
    },
    ignored: {
      label: 'Ignored',
      labelKey: 'seller.inbox.statusIgnored',
      color: 'success',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-700 dark:text-gray-400',
      icon: 'x-circle',
    },
    quoted: {
      label: 'Quoted',
      labelKey: 'seller.inbox.statusQuoted',
      color: 'info',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-400',
      icon: 'paper-plane',
    },
    accepted: {
      label: 'Accepted',
      labelKey: 'seller.inbox.statusAccepted',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      icon: 'check-circle',
    },
    rejected: {
      label: 'Rejected',
      labelKey: 'seller.inbox.statusRejected',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: 'x-circle',
    },
    expired: {
      label: 'Expired',
      labelKey: 'seller.inbox.statusExpired',
      color: 'warning',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-500 dark:text-gray-400',
      icon: 'clock',
    },
  };
  return configs[status];
}

/**
 * Calculate time since RFQ was received
 * Returns formatted string like "2h ago", "1d ago"
 */
export function getTimeSinceReceived(createdAt: string): {
  text: string;
  isOverdue: boolean;
  hours: number;
} {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  let text: string;
  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    text = `${mins}m ago`;
  } else if (diffHours < 24) {
    text = `${Math.floor(diffHours)}h ago`;
  } else if (diffDays < 7) {
    text = `${diffDays}d ago`;
  } else {
    text = `${Math.floor(diffDays / 7)}w ago`;
  }

  return {
    text,
    isOverdue: diffHours > 24,
    hours: diffHours,
  };
}

/**
 * RFQ State Labels (user-friendly)
 * Maps internal status to display labels
 */
export function getRFQStateLabel(status: RFQStatus | Stage2RFQStatus): string {
  const labels: Record<string, string> = {
    // Stage 1 statuses
    new: 'Waiting for quote',
    pending: 'Pending',
    quoted: 'Awaiting buyer response',
    accepted: 'Accepted - Convert to Order',
    rejected: 'Declined',
    expired: 'Expired',
    // Stage 2 statuses
    viewed: 'Viewed',
    under_review: 'Under review',
    ignored: 'Declined',
  };
  return labels[status] || status;
}

/**
 * Check if RFQ is in a read-only state
 * Read-only states: ignored, expired, rejected, accepted
 */
export function isRFQReadOnly(rfq: Pick<SellerInboxRFQ, 'status'>): boolean {
  const readOnlyStatuses = ['ignored', 'expired', 'rejected', 'accepted'];
  return readOnlyStatuses.includes(rfq.status);
}

/**
 * Check if RFQ needs seller action
 */
export function rfqNeedsAction(rfq: Pick<SellerInboxRFQ, 'status'>): boolean {
  const actionNeededStatuses: string[] = ['new', 'viewed'];
  return actionNeededStatuses.includes(rfq.status);
}

/**
 * Get RFQ urgency level based on required delivery date
 */
export function getRFQUrgency(requiredDeliveryDate?: string): {
  label: string;
  isExpiring: boolean;
  daysRemaining: number;
} | null {
  if (!requiredDeliveryDate) return null;

  const deadline = new Date(requiredDeliveryDate).getTime();
  const now = Date.now();
  const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return { label: 'Expired', isExpiring: true, daysRemaining: 0 };
  } else if (daysRemaining <= 3) {
    return { label: 'Expiring Soon', isExpiring: true, daysRemaining };
  }
  return null; // Normal urgency
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
 * Determines if an item is out of stock but still allows RFQ
 * Rule: Stock = 0 AND (Status = Active OR Status = Out of Stock)
 */
export function isOutOfStockRFQOnly(item: Pick<Item, 'stock' | 'status'>): boolean {
  return item.stock === 0 && (item.status === 'active' || item.status === 'out_of_stock');
}

/**
 * Get stock availability status for marketplace display
 */
export type StockAvailability = 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';

export function getStockAvailability(item: Pick<Item, 'stock' | 'leadTimeDays'>): StockAvailability {
  if (item.stock > 10) return 'in_stock';
  if (item.stock > 0) return 'low_stock';
  if (item.leadTimeDays && item.leadTimeDays > 0) return 'made_to_order';
  return 'out_of_stock';
}

export function getStockAvailabilityConfig(status: StockAvailability): {
  label: string;
  labelKey: string;
  color: 'success' | 'warning' | 'error' | 'info';
  allowsRFQ: boolean;
} {
  const configs: Record<StockAvailability, ReturnType<typeof getStockAvailabilityConfig>> = {
    in_stock: {
      label: 'In Stock',
      labelKey: 'buyer.marketplace.inStock',
      color: 'success',
      allowsRFQ: true,
    },
    low_stock: {
      label: 'Low Stock',
      labelKey: 'buyer.marketplace.lowStock',
      color: 'warning',
      allowsRFQ: true,
    },
    out_of_stock: {
      label: 'Out of Stock - RFQ Only',
      labelKey: 'buyer.marketplace.outOfStockRFQ',
      color: 'error',
      allowsRFQ: true,
    },
    made_to_order: {
      label: 'Made to Order',
      labelKey: 'buyer.marketplace.madeToOrder',
      color: 'info',
      allowsRFQ: true,
    },
  };
  return configs[status];
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

export type ItemCategory = (typeof ITEM_CATEGORIES)[number]['key'];

// =============================================================================
// RFQ Scoring & Intelligence Types
// =============================================================================

/**
 * RFQ Priority Tiers based on composite score
 */
export type RFQPriorityTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Individual score components
 */
export interface RFQScore {
  total: number; // 0-100 composite score
  urgency: number; // Based on deadline proximity
  quantity: number; // Based on order value
  buyer: number; // Based on buyer history
  margin: number; // Estimated margin potential
}

/**
 * Pricing suggestion from response assistant
 */
export interface RFQPricingSuggestion {
  suggestedPrice: number;
  confidence: number; // 0-100
  reasoning: string;
  competitorRange?: {
    min: number;
    max: number;
  };
  suggestedLeadTime: number;
}

/**
 * Buyer profile for intelligence display
 */
export interface RFQBuyerProfile {
  totalOrders: number;
  totalSpend: number;
  avgOrderValue: number;
  lastOrderDate?: string;
  rating?: number;
}

/**
 * Enhanced RFQ with scoring data
 */
export interface ScoredRFQ extends ItemRFQ {
  // Score components
  score?: number;
  urgencyScore?: number;
  quantityScore?: number;
  buyerScore?: number;
  marginScore?: number;
  priorityTier?: RFQPriorityTier;

  // Response assistant
  suggestedPrice?: number;
  suggestedLeadTime?: number;
  pricingConfidence?: number;

  // Buyer intelligence
  buyerTotalOrders?: number;
  buyerTotalSpend?: number;
  buyerAvgOrderValue?: number;
  buyerLastOrderDate?: string;
}

/**
 * Quick respond data
 */
export interface QuickRespondData {
  acceptSuggestion: boolean;
  price?: number;
  leadTime?: number;
  message?: string;
}

/**
 * RFQ Timeline view types
 */
export type RFQTimelineView = 'day' | 'week' | 'month';

export interface RFQTimelineData {
  view: RFQTimelineView;
  startDate: string;
  endDate: string;
  rfqs: ScoredRFQ[];
  byStatus: {
    new: ScoredRFQ[];
    viewed: ScoredRFQ[];
    responded: ScoredRFQ[];
    negotiation: ScoredRFQ[];
    accepted: ScoredRFQ[];
    rejected: ScoredRFQ[];
    expired: ScoredRFQ[];
  };
  stats: {
    totalReceived: number;
    totalResponded: number;
    avgResponseTime: number; // hours
    conversionRate: number; // percentage
  };
}

/**
 * Scoring configuration
 */
export interface RFQScoringConfig {
  id: string;
  sellerId: string;
  urgencyWeight: number;
  quantityWeight: number;
  buyerWeight: number;
  marginWeight: number;
  criticalScoreMin: number;
  highScoreMin: number;
  mediumScoreMin: number;
}

/**
 * Get priority tier display configuration
 */
export function getPriorityTierConfig(tier: RFQPriorityTier): {
  label: string;
  labelKey: string;
  color: 'error' | 'warning' | 'info' | 'success';
  bgColor: string;
  textColor: string;
} {
  const configs: Record<RFQPriorityTier, ReturnType<typeof getPriorityTierConfig>> = {
    critical: {
      label: 'Critical',
      labelKey: 'seller.rfqs.priorityCritical',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
    },
    high: {
      label: 'High',
      labelKey: 'seller.rfqs.priorityHigh',
      color: 'warning',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-400',
    },
    medium: {
      label: 'Medium',
      labelKey: 'seller.rfqs.priorityMedium',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
    low: {
      label: 'Low',
      labelKey: 'seller.rfqs.priorityLow',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
    },
  };
  return configs[tier];
}

// =============================================================================
// Quote Types (Stage 3) - Seller Quotation System
// =============================================================================

/**
 * Quote status - lifecycle states
 * DRAFT → SENT → REVISED | EXPIRED
 * Acceptance/rejection handled in Stage 4
 */
export type QuoteStatus = 'draft' | 'sent' | 'revised' | 'expired' | 'accepted' | 'rejected';

/**
 * Quote event types for audit trail
 */
export type QuoteEventType =
  | 'QUOTE_CREATED'
  | 'QUOTE_UPDATED'
  | 'QUOTE_SENT'
  | 'QUOTE_REVISED'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED';

/**
 * Quote event for audit trail
 */
export interface QuoteEvent {
  id: string;
  quoteId: string;
  actorId: string;
  actorType: 'seller' | 'buyer' | 'system';
  eventType: QuoteEventType;
  fromStatus?: string;
  toStatus?: string;
  version?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Quote version snapshot - immutable record
 */
export interface QuoteVersion {
  id: string;
  quoteId: string;
  version: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  currency: string;
  discount?: number;
  discountPercent?: number;
  deliveryDays: number;
  deliveryTerms?: string;
  validUntil: string;
  notes?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  changeReason?: string;
}

/**
 * Main Quote interface
 */
export interface Quote {
  id: string;
  quoteNumber?: string; // Human-readable: QT-2024-0001
  rfqId: string;
  sellerId: string;
  buyerId: string;

  // Pricing
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  currency: string;
  discount?: number;
  discountPercent?: number;

  // Delivery
  deliveryDays: number;
  deliveryTerms?: string;

  // Validity
  validUntil: string;

  // Notes
  notes?: string; // Terms and conditions (visible to buyer)
  internalNotes?: string; // Seller-only notes

  // Versioning
  version: number;
  isLatest: boolean;

  // Status
  status: QuoteStatus;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  expiredAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;

  // Relations (populated when fetched)
  rfq?: SellerInboxRFQ;
  versions?: QuoteVersion[];
  events?: QuoteEvent[];
}

/**
 * Quote with full RFQ details
 */
export interface QuoteWithRFQ extends Quote {
  rfq: SellerInboxRFQ & {
    item?: Item;
  };
}

/**
 * Create quote request data
 */
export interface CreateQuoteData {
  rfqId: string;
  unitPrice: number;
  quantity: number;
  currency?: string;
  discount?: number;
  discountPercent?: number;
  deliveryDays: number;
  deliveryTerms?: string;
  validUntil: string; // ISO datetime string
  notes?: string;
  internalNotes?: string;
}

/**
 * Update quote request data
 */
export interface UpdateQuoteData {
  unitPrice?: number;
  quantity?: number;
  currency?: string;
  discount?: number;
  discountPercent?: number;
  deliveryDays?: number;
  deliveryTerms?: string;
  validUntil?: string;
  notes?: string;
  internalNotes?: string;
  changeReason?: string;
}

/**
 * Quote list filters
 */
export interface QuoteFilters {
  status?: QuoteStatus;
  page?: number;
  limit?: number;
}

/**
 * Paginated quotes response
 */
export interface QuotesResponse {
  quotes: QuoteWithRFQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Quote form state for controlled form
 */
export interface QuoteFormState {
  unitPrice: number;
  quantity: number;
  currency: string;
  discount: number;
  discountPercent: number;
  deliveryDays: number;
  deliveryTerms: string;
  validUntil: string;
  notes: string;
  internalNotes: string;
}

/**
 * Quote form validation errors
 */
export interface QuoteFormErrors {
  unitPrice?: string;
  quantity?: string;
  deliveryDays?: string;
  validUntil?: string;
  notes?: string;
}

/**
 * Get quote status display configuration
 */
export function getQuoteStatusConfig(status: QuoteStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'info' | 'success' | 'error';
  bgColor: string;
  textColor: string;
  icon: 'pencil' | 'paper-plane' | 'arrows-clockwise' | 'clock' | 'check-circle' | 'x-circle';
} {
  const configs: Record<QuoteStatus, ReturnType<typeof getQuoteStatusConfig>> = {
    draft: {
      label: 'Draft',
      labelKey: 'seller.quotes.statusDraft',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      icon: 'pencil',
    },
    sent: {
      label: 'Sent',
      labelKey: 'seller.quotes.statusSent',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      icon: 'paper-plane',
    },
    revised: {
      label: 'Revised',
      labelKey: 'seller.quotes.statusRevised',
      color: 'info',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-400',
      icon: 'arrows-clockwise',
    },
    expired: {
      label: 'Expired',
      labelKey: 'seller.quotes.statusExpired',
      color: 'error',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-700 dark:text-gray-400',
      icon: 'clock',
    },
    accepted: {
      label: 'Accepted',
      labelKey: 'seller.quotes.statusAccepted',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      icon: 'check-circle',
    },
    rejected: {
      label: 'Rejected',
      labelKey: 'seller.quotes.statusRejected',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: 'x-circle',
    },
  };
  return configs[status];
}

/**
 * Calculate total price from unit price, quantity, and discount
 */
export function calculateQuoteTotalPrice(unitPrice: number, quantity: number, discount?: number): number {
  const subtotal = unitPrice * quantity;
  return discount ? subtotal - discount : subtotal;
}

/**
 * Calculate discount amount from percentage
 */
export function calculateDiscountAmount(unitPrice: number, quantity: number, discountPercent: number): number {
  const subtotal = unitPrice * quantity;
  return (subtotal * discountPercent) / 100;
}

/**
 * Calculate discount percentage from amount
 */
export function calculateDiscountPercent(unitPrice: number, quantity: number, discountAmount: number): number {
  const subtotal = unitPrice * quantity;
  if (subtotal === 0) return 0;
  return (discountAmount / subtotal) * 100;
}

/**
 * Check if quote is editable (only drafts and revised can be edited)
 */
export function isQuoteEditable(quote: Pick<Quote, 'status'>): boolean {
  return quote.status === 'draft' || quote.status === 'revised';
}

/**
 * Check if quote can be sent (only drafts and revised)
 */
export function canSendQuote(quote: Pick<Quote, 'status' | 'validUntil'>): {
  canSend: boolean;
  reason?: string;
} {
  if (quote.status !== 'draft' && quote.status !== 'revised') {
    return { canSend: false, reason: 'Only draft or revised quotes can be sent' };
  }
  if (new Date(quote.validUntil) < new Date()) {
    return { canSend: false, reason: 'Quote has expired. Please update the validity date.' };
  }
  return { canSend: true };
}

/**
 * Format quote validity remaining time
 */
export function getQuoteValidityStatus(validUntil: string): {
  text: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
} {
  const expiryDate = new Date(validUntil);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      text: 'Expired',
      isExpired: true,
      isExpiringSoon: false,
      daysRemaining: 0,
    };
  }

  if (daysRemaining === 0) {
    return {
      text: 'Expires today',
      isExpired: false,
      isExpiringSoon: true,
      daysRemaining: 0,
    };
  }

  if (daysRemaining <= 3) {
    return {
      text: `Expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
      isExpired: false,
      isExpiringSoon: true,
      daysRemaining,
    };
  }

  return {
    text: `Valid for ${daysRemaining} days`,
    isExpired: false,
    isExpiringSoon: false,
    daysRemaining,
  };
}

// =============================================================================
// Marketplace Order Types (Stage 4 + Stage 5 Fulfillment)
// =============================================================================

/**
 * Order status - lifecycle states (Stage 5)
 * PENDING_CONFIRMATION → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → CLOSED
 * Can be CANCELLED at various stages (before shipping)
 */
export type MarketplaceOrderStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'processing' // Stage 5: Seller is processing/picking/packing
  | 'shipped'
  | 'delivered'
  | 'closed' // Stage 5: Order lifecycle complete
  | 'cancelled'
  | 'failed'
  | 'refunded';

/**
 * Payment status
 */
export type PaymentStatus = 'unpaid' | 'authorized' | 'paid' | 'refunded';

/**
 * Fulfillment status
 */
export type FulfillmentStatus = 'not_started' | 'picking' | 'packing' | 'ready_to_ship' | 'shipped' | 'delivered';

/**
 * Order source - how the order was created
 */
export type OrderSource = 'rfq' | 'direct_buy';

/**
 * Order health status
 */
export type OrderHealthStatus = 'on_track' | 'at_risk' | 'delayed' | 'critical';

/**
 * Order audit action types (Stage 5 extended)
 */
export type OrderAuditAction =
  | 'created'
  | 'confirmed'
  | 'rejected' // Stage 5: Seller rejects order
  | 'processing_started' // Stage 5: Seller starts processing
  | 'shipped'
  | 'delivered'
  | 'closed' // Stage 5: Order closed
  | 'cancelled'
  | 'refunded'
  | 'status_changed'
  | 'payment_updated'
  | 'note_added'
  | 'tracking_added';

/**
 * Order audit event
 */
export interface OrderAuditEvent {
  id: string;
  orderId: string;
  action: OrderAuditAction;
  actor: 'buyer' | 'seller' | 'system';
  actorId?: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Main Marketplace Order interface
 */
export interface MarketplaceOrder {
  id: string;
  orderNumber: string;

  // Parties
  buyerId: string;
  sellerId: string;

  // Item reference
  itemId: string;
  itemName: string;
  itemSku: string;
  itemImage?: string;

  // RFQ & Quote reference (if from RFQ flow)
  rfqId?: string;
  rfqNumber?: string;
  quoteId?: string;
  quoteNumber?: string;
  quoteVersion?: number;

  // Order details
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;

  // Status
  status: MarketplaceOrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  // Source
  source: OrderSource;

  // Shipping
  shippingAddress?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;

  // Notes
  buyerNotes?: string;
  sellerNotes?: string;
  internalNotes?: string;

  // Buyer info (denormalized)
  buyerName?: string;
  buyerEmail?: string;
  buyerCompany?: string;

  // Health indicators
  healthStatus: OrderHealthStatus;
  healthScore?: number;
  hasException: boolean;
  exceptionType?: string;
  exceptionMessage?: string;

  // SLA tracking
  confirmationDeadline?: string;
  shippingDeadline?: string;
  deliveryDeadline?: string;

  // Stage 5: Fulfillment tracking
  rejectionReason?: string; // If seller rejects order
  shipmentDate?: string; // When shipment was dispatched
  deliveryConfirmedBy?: 'buyer' | 'system';

  // Timestamps
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  processingAt?: string; // Stage 5: When seller started processing
  shippedAt?: string;
  deliveredAt?: string;
  closedAt?: string; // Stage 5: When order was closed
  cancelledAt?: string;
}

/**
 * Accept quote request data
 */
export interface AcceptQuoteData {
  shippingAddress?: string;
  buyerNotes?: string;
}

/**
 * Reject quote request data
 */
export interface RejectQuoteData {
  reason: string;
}

/**
 * Order list filters
 */
export interface OrderFilters {
  status?: MarketplaceOrderStatus;
  source?: OrderSource;
  page?: number;
  limit?: number;
}

/**
 * Paginated orders response
 */
export interface OrdersResponse {
  orders: MarketplaceOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Order statistics (Stage 5 extended)
 */
export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number; // Stage 5
  shipped: number;
  delivered: number;
  closed: number; // Stage 5
  cancelled: number;
}

// =============================================================================
// Stage 5: Fulfillment Input Types
// =============================================================================

export interface RejectOrderData {
  reason: string;
}

export interface StartProcessingData {
  sellerNotes?: string;
}

export interface ShipOrderData {
  carrier: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  sellerNotes?: string;
}

export interface MarkDeliveredData {
  buyerNotes?: string;
}

export interface CancelOrderData {
  reason: string;
}

export interface UpdateTrackingData {
  trackingNumber: string;
  carrier?: string;
}

/**
 * Get order status display configuration (Stage 5 updated)
 */
export function getOrderStatusConfig(status: MarketplaceOrderStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'info' | 'success' | 'error';
  bgColor: string;
  textColor: string;
  icon: 'clock' | 'check' | 'spinner' | 'truck' | 'package' | 'x-circle' | 'warning' | 'lock';
} {
  const configs: Record<MarketplaceOrderStatus, ReturnType<typeof getOrderStatusConfig>> = {
    pending_confirmation: {
      label: 'Pending Confirmation',
      labelKey: 'buyer.orders.pendingConfirmation',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      icon: 'clock',
    },
    confirmed: {
      label: 'Confirmed',
      labelKey: 'buyer.orders.confirmed',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      icon: 'check',
    },
    processing: {
      label: 'Processing',
      labelKey: 'buyer.orders.processing',
      color: 'info',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-400',
      icon: 'spinner',
    },
    shipped: {
      label: 'In Transit',
      labelKey: 'buyer.orders.inTransit',
      color: 'info',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      textColor: 'text-indigo-700 dark:text-indigo-400',
      icon: 'truck',
    },
    delivered: {
      label: 'Delivered',
      labelKey: 'buyer.orders.delivered',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      icon: 'package',
    },
    closed: {
      label: 'Closed',
      labelKey: 'buyer.orders.closed',
      color: 'success',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-700 dark:text-gray-400',
      icon: 'lock',
    },
    cancelled: {
      label: 'Cancelled',
      labelKey: 'buyer.orders.cancelled',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: 'x-circle',
    },
    failed: {
      label: 'Failed',
      labelKey: 'buyer.orders.failed',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: 'warning',
    },
    refunded: {
      label: 'Refunded',
      labelKey: 'buyer.orders.refunded',
      color: 'warning',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-700 dark:text-gray-400',
      icon: 'package',
    },
  };
  return configs[status];
}

/**
 * Check if seller can perform an action on order
 */
export function canSellerPerformAction(
  order: Pick<MarketplaceOrder, 'status'>,
  action: 'confirm' | 'reject' | 'process' | 'ship' | 'cancel',
): { allowed: boolean; reason?: string } {
  switch (action) {
    case 'confirm':
      if (order.status !== 'pending_confirmation') {
        return { allowed: false, reason: 'Order must be pending confirmation' };
      }
      return { allowed: true };
    case 'reject':
      if (order.status !== 'pending_confirmation') {
        return { allowed: false, reason: 'Can only reject pending orders' };
      }
      return { allowed: true };
    case 'process':
      if (order.status !== 'confirmed') {
        return { allowed: false, reason: 'Order must be confirmed first' };
      }
      return { allowed: true };
    case 'ship':
      if (order.status !== 'processing') {
        return { allowed: false, reason: 'Order must be processing' };
      }
      return { allowed: true };
    case 'cancel':
      if (!['pending_confirmation', 'confirmed', 'processing'].includes(order.status)) {
        return { allowed: false, reason: 'Cannot cancel after shipping' };
      }
      return { allowed: true };
    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}

/**
 * Check if buyer can confirm delivery
 */
export function canBuyerConfirmDelivery(order: Pick<MarketplaceOrder, 'status'>): {
  allowed: boolean;
  reason?: string;
} {
  if (order.status !== 'shipped') {
    return { allowed: false, reason: 'Order must be shipped first' };
  }
  return { allowed: true };
}

/**
 * Check if a quote can be accepted
 */
export function canAcceptQuote(quote: Pick<Quote, 'status' | 'validUntil'>): {
  canAccept: boolean;
  reason?: string;
} {
  // Quote must be SENT or REVISED
  if (quote.status !== 'sent' && quote.status !== 'revised') {
    return {
      canAccept: false,
      reason: `Cannot accept quote in "${quote.status}" status. Only sent quotes can be accepted.`,
    };
  }

  // Quote must not be expired
  if (new Date(quote.validUntil) < new Date()) {
    return {
      canAccept: false,
      reason: 'Quote has expired. Please request a new quote from the seller.',
    };
  }

  return { canAccept: true };
}

/**
 * Check if a quote can be rejected
 */
export function canRejectQuote(quote: Pick<Quote, 'status'>): {
  canReject: boolean;
  reason?: string;
} {
  if (quote.status !== 'sent' && quote.status !== 'revised') {
    return {
      canReject: false,
      reason: `Cannot reject quote in "${quote.status}" status`,
    };
  }

  return { canReject: true };
}

/**
 * Format order number for display
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber;
}

/**
 * Calculate days since order was created
 */
export function getDaysSinceCreated(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// =============================================================================
// Counter-Offer Types (RFQ → Quote Negotiation)
// =============================================================================

/**
 * Counter-offer status - lifecycle states
 * PENDING → ACCEPTED (creates revised quote) | REJECTED | EXPIRED
 */
export type CounterOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

/**
 * Counter-offer event types for audit trail
 */
export type CounterOfferEventType = 'COUNTER_CREATED' | 'COUNTER_ACCEPTED' | 'COUNTER_REJECTED' | 'COUNTER_EXPIRED';

/**
 * Counter-offer - buyer's negotiation response to a quote
 */
export interface CounterOffer {
  id: string;
  quoteId: string;
  buyerId: string;

  // Proposed terms
  proposedPrice: number;
  proposedQuantity?: number;
  proposedDeliveryDays?: number;
  message?: string;

  // Status
  status: CounterOfferStatus;

  // Seller response
  sellerResponse?: string;

  // Timestamps
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;

  // Relations (populated when fetched)
  quote?: Quote;
}

/**
 * Create counter-offer request data
 */
export interface CreateCounterOfferData {
  proposedPrice: number;
  proposedQuantity?: number;
  proposedDeliveryDays?: number;
  message?: string;
}

/**
 * Accept counter-offer request data
 */
export interface AcceptCounterOfferData {
  response?: string;
}

/**
 * Reject counter-offer request data
 */
export interface RejectCounterOfferData {
  response: string;
}

/**
 * Counter-offer with quote details
 */
export interface CounterOfferWithQuote extends CounterOffer {
  quote: Quote;
  originalPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
}

/**
 * Get counter-offer status display configuration
 */
export function getCounterOfferStatusConfig(status: CounterOfferStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'success' | 'error' | 'info';
  bgColor: string;
  textColor: string;
  icon: 'clock' | 'check-circle' | 'x-circle' | 'timer';
} {
  const configs: Record<CounterOfferStatus, ReturnType<typeof getCounterOfferStatusConfig>> = {
    pending: {
      label: 'Pending',
      labelKey: 'quotes.counterPending',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      icon: 'clock',
    },
    accepted: {
      label: 'Accepted',
      labelKey: 'quotes.counterAccepted',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      icon: 'check-circle',
    },
    rejected: {
      label: 'Rejected',
      labelKey: 'quotes.counterRejected',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: 'x-circle',
    },
    expired: {
      label: 'Expired',
      labelKey: 'quotes.counterExpired',
      color: 'info',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-700 dark:text-gray-400',
      icon: 'timer',
    },
  };
  return configs[status];
}

/**
 * Check if counter-offer can be submitted for a quote
 */
export function canSubmitCounterOffer(quote: Pick<Quote, 'status' | 'validUntil'>): {
  canSubmit: boolean;
  reason?: string;
} {
  if (quote.status !== 'sent' && quote.status !== 'revised') {
    return { canSubmit: false, reason: 'Can only counter-offer on sent or revised quotes' };
  }
  if (new Date(quote.validUntil) < new Date()) {
    return { canSubmit: false, reason: 'Quote has expired' };
  }
  return { canSubmit: true };
}

/**
 * Check if seller can respond to counter-offer
 */
export function canRespondToCounterOffer(counter: Pick<CounterOffer, 'status'>): {
  canRespond: boolean;
  reason?: string;
} {
  if (counter.status !== 'pending') {
    return { canRespond: false, reason: 'Counter-offer is no longer pending' };
  }
  return { canRespond: true };
}

// =============================================================================
// Quote Attachment Types
// =============================================================================

/**
 * Quote attachment types
 */
export type QuoteAttachmentType = 'spec_sheet' | 'certificate' | 'terms' | 'warranty' | 'other';

/**
 * Quote attachment - files attached to quotes
 */
export interface QuoteAttachment {
  id: string;
  quoteId: string;
  name: string;
  type: QuoteAttachmentType;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * Upload attachment request data
 */
export interface UploadAttachmentData {
  name: string;
  type: QuoteAttachmentType;
  file: File;
}

/**
 * Get attachment type display configuration
 */
export function getAttachmentTypeConfig(type: QuoteAttachmentType): {
  label: string;
  labelKey: string;
  icon: 'file-text' | 'certificate' | 'scroll' | 'shield-check' | 'file';
} {
  const configs: Record<QuoteAttachmentType, ReturnType<typeof getAttachmentTypeConfig>> = {
    spec_sheet: {
      label: 'Spec Sheet',
      labelKey: 'quotes.attachSpecSheet',
      icon: 'file-text',
    },
    certificate: {
      label: 'Certificate',
      labelKey: 'quotes.attachCertificate',
      icon: 'certificate',
    },
    terms: {
      label: 'Terms & Conditions',
      labelKey: 'quotes.attachTerms',
      icon: 'scroll',
    },
    warranty: {
      label: 'Warranty',
      labelKey: 'quotes.attachWarranty',
      icon: 'shield-check',
    },
    other: {
      label: 'Other',
      labelKey: 'quotes.attachOther',
      icon: 'file',
    },
  };
  return configs[type];
}

// =============================================================================
// Extended Quote Types (with negotiation support)
// =============================================================================

/**
 * Quote with full negotiation history
 */
export interface QuoteWithNegotiation extends Quote {
  counterOffers: CounterOffer[];
  attachments: QuoteAttachment[];
  hasActiveCounterOffer: boolean;
  latestCounterOffer?: CounterOffer;
}

/**
 * Quote summary for buyer view
 */
export interface BuyerQuoteSummary {
  id: string;
  quoteNumber?: string;
  rfqId: string;
  rfqNumber?: string;

  // Item info
  itemName: string;
  itemSku?: string;

  // Seller info
  sellerId: string;
  sellerName: string;
  sellerCompany?: string;

  // Quote details
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  currency: string;
  discount?: number;
  deliveryDays: number;
  deliveryTerms?: string;

  // Validity
  validUntil: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;

  // Status
  status: QuoteStatus;
  version: number;

  // Negotiation
  hasCounterOffer: boolean;
  counterOfferStatus?: CounterOfferStatus;

  // Attachments
  attachmentCount: number;

  // Notes
  notes?: string;

  // Timestamps
  createdAt: string;
  sentAt?: string;
}

// =============================================================================
// Gmail-Style RFQ Inbox Types
// =============================================================================

/**
 * RFQ Label - for categorizing RFQs (like Gmail labels)
 */
export interface RFQLabel {
  id: string;
  sellerId: string;
  name: string;
  color: string;
  icon?: string;
  isSystem: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Default system labels
 */
export const SYSTEM_LABELS: Array<{ name: string; color: string }> = [
  { name: 'New', color: '#3b82f6' },
  { name: 'Pending', color: '#f59e0b' },
  { name: 'Negotiation', color: '#8b5cf6' },
  { name: 'Expiring', color: '#ef4444' },
  { name: 'Won', color: '#22c55e' },
  { name: 'Lost', color: '#6b7280' },
];

/**
 * Label assignment (junction between RFQ and Label)
 */
export interface RFQLabelAssignment {
  id: string;
  rfqId: string;
  labelId: string;
  label: RFQLabel;
  createdAt: string;
}

/**
 * Create label request data
 */
export interface CreateLabelData {
  name: string;
  color: string;
  icon?: string;
}

/**
 * Update label request data
 */
export interface UpdateLabelData {
  name?: string;
  color?: string;
  icon?: string;
}

/**
 * RFQ Note - threaded internal notes
 */
export interface RFQNote {
  id: string;
  rfqId: string;
  sellerId: string;
  content: string;
  parentId?: string;
  replies?: RFQNote[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Create note request data
 */
export interface CreateNoteData {
  content: string;
  parentId?: string;
}

/**
 * Saved Reply - template for quick responses
 */
export interface SavedReply {
  id: string;
  sellerId: string;
  name: string;
  content: string;
  category?: 'decline' | 'followup' | 'general' | 'quote';
  shortcut?: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create saved reply request data
 */
export interface CreateSavedReplyData {
  name: string;
  content: string;
  category?: 'decline' | 'followup' | 'general' | 'quote';
  shortcut?: string;
}

/**
 * Update saved reply request data
 */
export interface UpdateSavedReplyData {
  name?: string;
  content?: string;
  category?: 'decline' | 'followup' | 'general' | 'quote';
  shortcut?: string;
}

/**
 * Template placeholders for saved replies
 */
export const REPLY_PLACEHOLDERS = [
  { key: '{{buyer_name}}', label: 'Buyer Name' },
  { key: '{{company_name}}', label: 'Company Name' },
  { key: '{{item_name}}', label: 'Item Name' },
  { key: '{{quantity}}', label: 'Quantity' },
  { key: '{{rfq_number}}', label: 'RFQ Number' },
  { key: '{{delivery_date}}', label: 'Delivery Date' },
] as const;

/**
 * Snooze options
 */
export type SnoozeOption = '2h' | '4h' | 'tomorrow' | 'next_week';

/**
 * RFQ Snooze info
 */
export interface RFQSnoozeInfo {
  snoozedUntil: string;
  reason?: string;
}

/**
 * Snooze request data
 */
export interface SnoozeData {
  until: string; // ISO datetime
  reason?: string;
}

/**
 * Bulk operation request data
 */
export interface BulkIdsData {
  rfqIds: string[];
}

/**
 * Bulk label operation request data
 */
export interface BulkLabelData {
  rfqIds: string[];
  labelId: string;
  action: 'add' | 'remove';
}

/**
 * Bulk snooze operation request data
 */
export interface BulkSnoozeData {
  rfqIds: string[];
  until: string;
  reason?: string;
}

/**
 * Get snooze display text
 */
export function getSnoozeDisplayText(snoozedUntil: string): string {
  const snoozeDate = new Date(snoozedUntil);
  const now = new Date();
  const diffMs = snoozeDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs <= 0) return 'Snooze expired';
  if (diffHours < 1) return 'Snoozing for less than 1h';
  if (diffHours < 24) return `Snoozed for ${diffHours}h`;
  if (diffDays === 1) return 'Snoozed until tomorrow';
  return `Snoozed for ${diffDays} days`;
}

/**
 * Calculate snooze until time from option
 */
export function getSnoozeUntilFromOption(option: SnoozeOption): Date {
  const now = new Date();
  switch (option) {
    case '2h':
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
    case '4h':
      return new Date(now.getTime() + 4 * 60 * 60 * 1000);
    case 'tomorrow': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }
    case 'next_week': {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek;
    }
    default:
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }
}

/**
 * Get label color configuration
 */
export function getLabelColorConfig(color: string): {
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  // Map hex colors to Tailwind classes
  const colorMap: Record<string, { bgColor: string; textColor: string; borderColor: string }> = {
    '#3b82f6': { bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
    '#f59e0b': { bgColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
    '#8b5cf6': { bgColor: 'bg-violet-100', textColor: 'text-violet-700', borderColor: 'border-violet-200' },
    '#ef4444': { bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
    '#22c55e': { bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
    '#6b7280': { bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-200' },
  };

  return colorMap[color] || { bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-200' };
}
