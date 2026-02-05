// =============================================================================
// RFQ Marketplace Types - Seller Discovery of Open Buyer Requests
// =============================================================================
// Types for sellers to browse and quote on open buyer RFQs

// =============================================================================
// Marketplace RFQ Status
// =============================================================================

/**
 * Status of RFQ in the marketplace
 */
export type MarketplaceRFQStatus = 'open' | 'closing_soon' | 'closed' | 'awarded';

/**
 * Buyer verification level
 */
export type BuyerBadgeType = 'verified' | 'enterprise' | 'new' | 'standard';

/**
 * Deadline urgency levels
 */
export type DeadlineUrgency = 'normal' | 'urgent' | 'critical' | 'expired';

// =============================================================================
// Marketplace RFQ Interface
// =============================================================================

/**
 * Buyer info visible to sellers in marketplace
 */
export interface MarketplaceBuyerInfo {
  id: string;
  companyName: string;
  country: string;
  city?: string;
  badge: BuyerBadgeType;
  isVerified: boolean;
  reliabilityScore?: number;  // 0-100
  totalRFQs?: number;
  totalOrders?: number;
  memberSince?: string;
}

/**
 * RFQ Attachment for marketplace display
 */
export interface MarketplaceRFQAttachment {
  id: string;
  name: string;
  type: 'drawing' | 'specification' | 'pdf' | 'image' | 'other';
  url: string;
  size?: number;
}

/**
 * Marketplace RFQ - Open buyer request visible to sellers
 */
export interface MarketplaceRFQ {
  id: string;
  rfqNumber: string;

  // Item/Request details
  partName: string;
  partNameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: string;
  subcategory?: string;
  specifications?: Record<string, string>;

  // Quantity & pricing
  quantity: number;
  unit?: string;
  targetPrice?: number;
  targetCurrency?: string;

  // Delivery requirements
  deliveryLocation: string;
  deliveryCity?: string;
  deliveryCountry: string;
  requiredDeliveryDate?: string;
  leadTimeRequired?: number;  // days

  // Buyer info
  buyer: MarketplaceBuyerInfo;

  // Status & deadlines
  status: MarketplaceRFQStatus;
  deadline: string;
  deadlineUrgency: DeadlineUrgency;
  daysRemaining: number;
  hoursRemaining?: number;

  // Quote stats
  totalQuotes: number;
  quotesFromSeller?: number;  // If current seller has quoted

  // Attachments
  attachments?: MarketplaceRFQAttachment[];

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Seller-specific flags
  isSaved: boolean;
  hasQuoted: boolean;
  lastQuotedAt?: string;
}

// =============================================================================
// Filter & Sort Types
// =============================================================================

/**
 * Sort options for marketplace
 */
export type MarketplaceSortBy =
  | 'newest'
  | 'expiring_soon'
  | 'highest_quantity'
  | 'best_match';

/**
 * Deadline filter options
 */
export type DeadlineFilter = 'all' | 'urgent' | 'standard' | 'expiring_today';

/**
 * Marketplace filter parameters
 */
export interface MarketplaceFilters {
  search?: string;
  category?: string;
  quantityMin?: number;
  quantityMax?: number;
  deliveryCountry?: string;
  deliveryCity?: string;
  deadline?: DeadlineFilter;
  buyerBadge?: BuyerBadgeType;
  status?: MarketplaceRFQStatus;
  sortBy?: MarketplaceSortBy;
  page?: number;
  limit?: number;
  savedOnly?: boolean;
}

// =============================================================================
// Quote Submission Types
// =============================================================================

/**
 * Quote submission data for marketplace RFQ
 */
export interface MarketplaceQuoteSubmission {
  rfqId: string;
  unitPrice: number;
  quantity: number;
  currency: string;
  leadTimeDays: number;
  validityDays: number;
  notes?: string;
  attachmentIds?: string[];
}

/**
 * Submitted quote response
 */
export interface SubmittedMarketplaceQuote {
  id: string;
  quoteNumber: string;
  rfqId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  currency: string;
  leadTimeDays: number;
  validUntil: string;
  notes?: string;
  status: 'sent' | 'under_review' | 'accepted' | 'rejected';
  submittedAt: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Marketplace statistics
 */
export interface MarketplaceStats {
  totalOpen: number;
  newToday: number;
  expiringToday: number;
  savedCount: number;
  quotedCount: number;
}

/**
 * Paginated marketplace response
 */
export interface MarketplaceResponse {
  rfqs: MarketplaceRFQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: MarketplaceStats;
}

/**
 * Save/unsave RFQ response
 */
export interface SaveRFQResponse {
  rfqId: string;
  isSaved: boolean;
}

// =============================================================================
// UI State Types
// =============================================================================

/**
 * Active filter chips for display
 */
export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

/**
 * RFQ detail view state
 */
export interface RFQDetailState {
  rfq: MarketplaceRFQ | null;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// Seller Decision Signal Types
// =============================================================================

/**
 * Competition level for an RFQ
 */
export type CompetitionLevel = 'low' | 'medium' | 'high';

/**
 * Buyer quality indicator
 */
export type BuyerQuality = 'excellent' | 'good' | 'average' | 'new';

/**
 * RFQ priority group for visual sections
 */
export type RFQPriorityGroup = 'new_today' | 'closing_soon' | 'high_value' | 'standard';

/**
 * Seller decision signals computed for each RFQ
 */
export interface SellerDecisionSignals {
  estimatedValueMin: number;
  estimatedValueMax: number;
  estimatedValueCurrency: string;
  competitionLevel: CompetitionLevel;
  buyerQuality: BuyerQuality;
  priorityGroup: RFQPriorityGroup;
  isHighValue: boolean;
  isNewToday: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get deadline urgency based on remaining time
 */
export function getDeadlineUrgency(deadline: string): {
  urgency: DeadlineUrgency;
  daysRemaining: number;
  hoursRemaining: number;
  text: string;
} {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  if (diffMs <= 0) {
    return { urgency: 'expired', daysRemaining: 0, hoursRemaining: 0, text: 'Expired' };
  }

  if (hoursRemaining < 24) {
    return { urgency: 'critical', daysRemaining: 0, hoursRemaining, text: `${hoursRemaining}h left` };
  }

  if (daysRemaining <= 2) {
    return { urgency: 'urgent', daysRemaining, hoursRemaining, text: `${daysRemaining}d left` };
  }

  return { urgency: 'normal', daysRemaining, hoursRemaining, text: `${daysRemaining}d left` };
}

/**
 * Get status display configuration
 */
export function getMarketplaceStatusConfig(status: MarketplaceRFQStatus): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  const configs: Record<MarketplaceRFQStatus, ReturnType<typeof getMarketplaceStatusConfig>> = {
    open: {
      label: 'Open',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    closing_soon: {
      label: 'Closing Soon',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    closed: {
      label: 'Closed',
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
      borderColor: 'rgba(107, 114, 128, 0.3)',
    },
    awarded: {
      label: 'Awarded',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
  };
  return configs[status];
}

/**
 * Get buyer badge display configuration
 */
export function getBuyerBadgeConfig(badge: BuyerBadgeType): {
  label: string;
  color: string;
  bgColor: string;
  icon: 'shield-check' | 'buildings' | 'user-circle' | 'user';
} {
  const configs: Record<BuyerBadgeType, ReturnType<typeof getBuyerBadgeConfig>> = {
    verified: {
      label: 'Verified',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      icon: 'shield-check',
    },
    enterprise: {
      label: 'Enterprise',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      icon: 'buildings',
    },
    new: {
      label: 'New Buyer',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      icon: 'user-circle',
    },
    standard: {
      label: 'Standard',
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
      icon: 'user',
    },
  };
  return configs[badge];
}

/**
 * Get urgency display configuration
 */
export function getUrgencyConfig(urgency: DeadlineUrgency): {
  label: string;
  color: string;
  bgColor: string;
} {
  const configs: Record<DeadlineUrgency, ReturnType<typeof getUrgencyConfig>> = {
    normal: {
      label: 'Normal',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
    },
    urgent: {
      label: 'Urgent',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    critical: {
      label: 'Expiring Soon',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    expired: {
      label: 'Expired',
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
    },
  };
  return configs[urgency];
}

/**
 * Format quantity with unit
 */
export function formatQuantity(quantity: number, unit?: string): string {
  const formatted = quantity.toLocaleString();
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Category options for filters
 */
export const RFQ_CATEGORIES = [
  { value: 'machinery', label: 'Machinery' },
  { value: 'spare_parts', label: 'Spare Parts' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'hydraulics', label: 'Hydraulics' },
  { value: 'safety_equipment', label: 'Safety Equipment' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'tools', label: 'Tools' },
  { value: 'materials', label: 'Materials' },
  { value: 'services', label: 'Services' },
] as const;

/**
 * Quantity range presets
 */
export const QUANTITY_RANGES = [
  { min: 1, max: 10, label: '1-10' },
  { min: 11, max: 50, label: '11-50' },
  { min: 51, max: 100, label: '51-100' },
  { min: 101, max: 500, label: '101-500' },
  { min: 501, max: undefined, label: '500+' },
] as const;

// =============================================================================
// Seller Decision Signal Functions
// =============================================================================

/**
 * Compute estimated value range based on quantity and target price
 */
export function computeEstimatedValue(rfq: MarketplaceRFQ): {
  min: number;
  max: number;
  currency: string;
} {
  const currency = rfq.targetCurrency || 'SAR';

  // If target price exists, use it as the midpoint
  if (rfq.targetPrice) {
    const baseValue = rfq.targetPrice * rfq.quantity;
    return {
      min: Math.round(baseValue * 0.8),
      max: Math.round(baseValue * 1.2),
      currency,
    };
  }

  // Otherwise estimate based on category and quantity
  const categoryMultipliers: Record<string, number> = {
    machinery: 500,
    spare_parts: 150,
    electronics: 200,
    hydraulics: 300,
    safety_equipment: 100,
    consumables: 50,
    tools: 120,
    materials: 80,
    services: 250,
  };

  const basePrice = categoryMultipliers[rfq.category] || 100;
  const baseValue = basePrice * rfq.quantity;

  return {
    min: Math.round(baseValue * 0.7),
    max: Math.round(baseValue * 1.5),
    currency,
  };
}

/**
 * Get competition level based on number of quotes
 */
export function getCompetitionLevel(totalQuotes: number): CompetitionLevel {
  if (totalQuotes <= 2) return 'low';
  if (totalQuotes <= 5) return 'medium';
  return 'high';
}

/**
 * Get competition level display configuration
 */
export function getCompetitionLevelConfig(level: CompetitionLevel): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  const configs: Record<CompetitionLevel, ReturnType<typeof getCompetitionLevelConfig>> = {
    low: {
      label: 'Low Competition',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      description: 'Few sellers quoting',
    },
    medium: {
      label: 'Medium Competition',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      description: 'Moderate interest',
    },
    high: {
      label: 'High Competition',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      description: 'Many sellers interested',
    },
  };
  return configs[level];
}

/**
 * Get buyer quality based on reliability score and badge
 */
export function getBuyerQuality(buyer: MarketplaceBuyerInfo): BuyerQuality {
  if (buyer.badge === 'new') return 'new';
  if (buyer.badge === 'enterprise' || (buyer.reliabilityScore && buyer.reliabilityScore >= 90)) return 'excellent';
  if (buyer.badge === 'verified' || (buyer.reliabilityScore && buyer.reliabilityScore >= 75)) return 'good';
  return 'average';
}

/**
 * Get buyer quality display configuration
 */
export function getBuyerQualityConfig(quality: BuyerQuality): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  const configs: Record<BuyerQuality, ReturnType<typeof getBuyerQualityConfig>> = {
    excellent: {
      label: 'Excellent Buyer',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      description: 'Top-tier, reliable',
    },
    good: {
      label: 'Good Buyer',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      description: 'Verified, trustworthy',
    },
    average: {
      label: 'Standard Buyer',
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
      description: 'Regular buyer',
    },
    new: {
      label: 'New Buyer',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      description: 'Recently joined',
    },
  };
  return configs[quality];
}

/**
 * Determine RFQ priority group for visual sectioning
 */
export function getRFQPriorityGroup(rfq: MarketplaceRFQ): RFQPriorityGroup {
  const createdDate = new Date(rfq.createdAt);
  const today = new Date();
  const isToday = createdDate.toDateString() === today.toDateString();

  if (isToday) return 'new_today';
  if (rfq.deadlineUrgency === 'critical' || rfq.deadlineUrgency === 'urgent') return 'closing_soon';

  const valueEstimate = computeEstimatedValue(rfq);
  if (valueEstimate.max >= 50000) return 'high_value';

  return 'standard';
}

/**
 * Get priority group display configuration
 */
export function getPriorityGroupConfig(group: RFQPriorityGroup): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: 'sparkle' | 'timer' | 'trend-up' | 'list';
} {
  const configs: Record<RFQPriorityGroup, ReturnType<typeof getPriorityGroupConfig>> = {
    new_today: {
      label: 'New Today',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.05)',
      borderColor: 'rgba(34, 197, 94, 0.2)',
      icon: 'sparkle',
    },
    closing_soon: {
      label: 'Closing Soon',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.05)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
      icon: 'timer',
    },
    high_value: {
      label: 'High Value',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.05)',
      borderColor: 'rgba(139, 92, 246, 0.2)',
      icon: 'trend-up',
    },
    standard: {
      label: 'All Requests',
      color: '#6b7280',
      bgColor: 'transparent',
      borderColor: 'transparent',
      icon: 'list',
    },
  };
  return configs[group];
}

/**
 * Compute all seller decision signals for an RFQ
 */
export function computeSellerDecisionSignals(rfq: MarketplaceRFQ): SellerDecisionSignals {
  const valueEstimate = computeEstimatedValue(rfq);

  return {
    estimatedValueMin: valueEstimate.min,
    estimatedValueMax: valueEstimate.max,
    estimatedValueCurrency: valueEstimate.currency,
    competitionLevel: getCompetitionLevel(rfq.totalQuotes),
    buyerQuality: getBuyerQuality(rfq.buyer),
    priorityGroup: getRFQPriorityGroup(rfq),
    isHighValue: valueEstimate.max >= 50000,
    isNewToday: new Date(rfq.createdAt).toDateString() === new Date().toDateString(),
  };
}

/**
 * Format currency value with abbreviation for large numbers
 */
export function formatCurrencyValue(value: number, currency: string = 'SAR'): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ${currency}`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K ${currency}`;
  }
  return `${value.toLocaleString()} ${currency}`;
}

/**
 * Group RFQs by priority
 */
export function groupRFQsByPriority(rfqs: MarketplaceRFQ[]): {
  newToday: MarketplaceRFQ[];
  closingSoon: MarketplaceRFQ[];
  highValue: MarketplaceRFQ[];
  standard: MarketplaceRFQ[];
} {
  const groups = {
    newToday: [] as MarketplaceRFQ[],
    closingSoon: [] as MarketplaceRFQ[],
    highValue: [] as MarketplaceRFQ[],
    standard: [] as MarketplaceRFQ[],
  };

  rfqs.forEach(rfq => {
    const priorityGroup = getRFQPriorityGroup(rfq);
    switch (priorityGroup) {
      case 'new_today':
        groups.newToday.push(rfq);
        break;
      case 'closing_soon':
        groups.closingSoon.push(rfq);
        break;
      case 'high_value':
        groups.highValue.push(rfq);
        break;
      default:
        groups.standard.push(rfq);
    }
  });

  return groups;
}
