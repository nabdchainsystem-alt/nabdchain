// =============================================================================
// Purchase Intelligence Types
// =============================================================================

import { Order, OrderStatus, OrderHealthStatus, ExceptionType } from './order.types';

// =============================================================================
// Enums & Categories
// =============================================================================

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type SavingsCategory = 'good_deal' | 'average' | 'overpaying';
export type PriceTrend = 'up' | 'down' | 'stable';
export type ReliabilityTier = 'excellent' | 'good' | 'average' | 'poor';

// =============================================================================
// Price Intelligence
// =============================================================================

export interface PriceComparison {
  currentPrice: number;
  historicalAvg: number;
  historicalMin: number;
  historicalMax: number;
  variance: number; // percentage difference from avg
  trend: PriceTrend;
  recommendation: SavingsCategory;
  purchaseCount: number; // how many times bought this item
}

export interface PriceHistoryEntry {
  id: string;
  itemSku: string;
  itemName: string;
  sellerId: string;
  sellerName: string;
  unitPrice: number;
  quantity: number;
  currency: string;
  orderId: string;
  orderDate: string;
}

// =============================================================================
// Supplier Intelligence
// =============================================================================

export interface BuyerSupplierMetrics {
  sellerId: string;
  sellerName: string;
  onTimeDeliveryRate: number; // 0-100
  qualityScore: number; // 1-5
  totalOrders: number;
  issueCount: number;
  avgDeliveryDays: number | null;
  reliabilityTier: ReliabilityTier;
}

// =============================================================================
// Timeline
// =============================================================================

export type TimelineState = 'created' | 'confirmed' | 'processing' | 'shipped' | 'in_transit' | 'delivered';

export interface PurchaseTimelineEvent {
  id: string;
  state: TimelineState;
  label: string;
  actualDate?: string;
  expectedDate?: string; // SLA deadline
  isCompleted: boolean;
  isCurrent: boolean;
  isDelayed: boolean;
  delayDays?: number;
}

// =============================================================================
// Enhanced Purchase (Order with Intelligence)
// =============================================================================

export interface Purchase extends Order {
  // Health indicators
  healthStatus?: OrderHealthStatus;
  healthScore?: number;

  // Exception data
  hasException?: boolean;
  exceptionType?: ExceptionType;
  exceptionMessage?: string;

  // Price intelligence (captured at order time)
  historicalAvgPrice?: number | null;
  priceVariance?: number | null;
  priceTrend?: PriceTrend | null;

  // Supplier snapshot (captured at order time)
  supplierOnTimeRate?: number | null;
  supplierQualityScore?: number | null;
  supplierTotalOrders?: number | null;

  // Calculated urgency
  buyerUrgencyScore?: number | null;

  // Runtime calculations
  calculatedUrgency?: UrgencyLevel;
  savingsCategory?: SavingsCategory;
}

// =============================================================================
// Filters
// =============================================================================

export interface SmartFilters {
  // Risk filter (based on healthStatus)
  risk: OrderHealthStatus | 'all';

  // Urgency filter (calculated from SLA proximity)
  urgency: UrgencyLevel | 'all';

  // Savings filter (based on price variance)
  savings: SavingsCategory | 'all';

  // Standard filters
  status: OrderStatus | 'all';
  search: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  sellerId?: string;
}

export const defaultSmartFilters: SmartFilters = {
  risk: 'all',
  urgency: 'all',
  savings: 'all',
  status: 'all',
  search: '',
};

// =============================================================================
// Statistics
// =============================================================================

export interface PurchaseStats {
  totalSpend: number;
  activeOrders: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
  critical: number;
  potentialSavings: number;
  currency: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get color for urgency level
 */
export function getUrgencyColor(urgency: UrgencyLevel): string {
  const colors: Record<UrgencyLevel, string> = {
    low: '#22c55e', // green
    medium: '#3b82f6', // blue
    high: '#f59e0b', // amber
    critical: '#ef4444', // red
  };
  return colors[urgency];
}

/**
 * Get label for urgency level
 */
export function getUrgencyLabel(urgency: UrgencyLevel): string {
  const labels: Record<UrgencyLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return labels[urgency];
}

/**
 * Get color for savings category
 */
export function getSavingsColor(savings: SavingsCategory): string {
  const colors: Record<SavingsCategory, string> = {
    good_deal: '#22c55e', // green
    average: '#6b7280', // gray
    overpaying: '#ef4444', // red
  };
  return colors[savings];
}

/**
 * Get label for savings category
 */
export function getSavingsLabel(savings: SavingsCategory): string {
  const labels: Record<SavingsCategory, string> = {
    good_deal: 'Good Deal',
    average: 'Average',
    overpaying: 'Overpaying',
  };
  return labels[savings];
}

/**
 * Get color for reliability tier
 */
export function getReliabilityColor(tier: ReliabilityTier): string {
  const colors: Record<ReliabilityTier, string> = {
    excellent: '#22c55e', // green
    good: '#3b82f6', // blue
    average: '#f59e0b', // amber
    poor: '#ef4444', // red
  };
  return colors[tier];
}

/**
 * Get label for reliability tier
 */
export function getReliabilityLabel(tier: ReliabilityTier): string {
  const labels: Record<ReliabilityTier, string> = {
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    poor: 'Poor',
  };
  return labels[tier];
}

/**
 * Get color for price trend
 */
export function getTrendColor(trend: PriceTrend): string {
  const colors: Record<PriceTrend, string> = {
    up: '#ef4444', // red (prices going up = bad)
    down: '#22c55e', // green (prices going down = good)
    stable: '#6b7280', // gray
  };
  return colors[trend];
}

/**
 * Format variance as display string
 */
export function formatVariance(variance: number | null | undefined): string {
  if (variance === null || variance === undefined) return '--';
  const sign = variance > 0 ? '+' : '';
  return `${sign}${variance.toFixed(1)}%`;
}

/**
 * Calculate savings category from variance
 */
export function getSavingsCategoryFromVariance(variance: number | null | undefined): SavingsCategory {
  if (variance === null || variance === undefined) return 'average';
  if (variance < -5) return 'good_deal';
  if (variance > 5) return 'overpaying';
  return 'average';
}
