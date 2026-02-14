// =============================================================================
// Buyer Analytics Types - Procurement Intelligence
// =============================================================================

/**
 * KPI Card data for buyer dashboard
 */
export interface BuyerAnalyticsKPI {
  totalSpend: number;
  rfqsSent: number;
  avgResponseTime: number; // in hours
  savingsVsMarket: number; // percentage
  currency: string;
  trends: {
    spend: number;
    rfqs: number;
    responseTime: number;
    savings: number;
  };
}

/**
 * Spend by category breakdown
 */
export interface SpendByCategory {
  category: string;
  amount: number;
  percentage: number;
  previousAmount?: number;
  trend?: number;
  orderCount?: number;
  avgOrderValue?: number;
}

/**
 * Supplier performance metrics
 */
export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  country?: string;
  totalOrders: number;
  totalSpend: number;
  onTimeDeliveryRate: number; // percentage
  qualityScore: number; // 1-5
  responseTime: number; // in hours
  rfqWinRate: number; // percentage
}

/**
 * RFQ Funnel data (RFQ → Quote → Order conversion)
 */
export interface RFQFunnel {
  rfqsSent: number;
  quotesReceived: number;
  ordersPlaced: number;
  rfqToQuoteRate: number;
  quoteToOrderRate: number;
  overallConversionRate: number;
}

/**
 * Procurement timeline data point
 */
export interface ProcurementTimelinePoint {
  date: string;
  spend: number;
  orders: number;
  rfqs: number;
}

/**
 * Complete analytics summary for buyer dashboard
 */
export interface BuyerAnalyticsSummary {
  kpis: BuyerAnalyticsKPI;
  spendByCategory: SpendByCategory[];
  topSuppliers: SupplierPerformance[];
  rfqFunnel: RFQFunnel;
  timeline: ProcurementTimelinePoint[];
  period: 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Analytics filter options
 */
export interface AnalyticsFilters {
  period?: 'week' | 'month' | 'quarter' | 'year';
  category?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
}
