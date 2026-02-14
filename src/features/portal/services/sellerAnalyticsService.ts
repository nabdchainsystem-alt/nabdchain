// =============================================================================
// Seller Analytics Service - Sales Intelligence API Client
// =============================================================================

import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types
// =============================================================================

export interface SellerKPIs {
  revenue: number;
  orders: number;
  newBuyers: number;
  winRate: number;
  currency: string;
  trends: {
    revenue: number;
    orders: number;
    buyers: number;
    winRate: number;
  };
}

export interface RevenueByCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface TopProduct {
  itemId: string;
  name: string;
  sku: string;
  revenue: number;
  orders: number;
}

export interface ConversionStage {
  stage: string;
  value: number;
  percent: number;
}

export interface RegionDistribution {
  region: string;
  percentage: number;
  orders: number;
}

export interface LifecycleMetrics {
  outstandingReceivables: number;
  avgDeliveryDays: number;
  avgPaymentDelayDays: number;
  fulfillmentRate: number;
  ordersByStatus: Record<string, number>;
  topBuyers: { buyerId: string; buyerName: string; totalSpend: number; orderCount: number }[];
}

export interface SellerAnalyticsSummary {
  kpis: SellerKPIs;
  revenueByCategory: RevenueByCategory[];
  topProducts: TopProduct[];
  conversionFunnel: ConversionStage[];
  regionDistribution: RegionDistribution[];
  lifecycleMetrics?: LifecycleMetrics;
  period: string;
}

// =============================================================================
// Seller Analytics Service
// =============================================================================

export const sellerAnalyticsService = {
  /**
   * Get complete analytics summary for seller dashboard
   */
  async getAnalyticsSummary(period: string = '30d'): Promise<SellerAnalyticsSummary> {
    return portalApiClient.get<SellerAnalyticsSummary>(
      `/api/analytics/seller/summary?period=${encodeURIComponent(period)}`,
    );
  },

  /**
   * Get KPI metrics only
   */
  async getKPIs(period?: string): Promise<SellerKPIs> {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    return portalApiClient.get<SellerKPIs>(`/api/analytics/seller/kpis${query}`);
  },

  /**
   * Get top performing products
   */
  async getTopProducts(): Promise<TopProduct[]> {
    return portalApiClient.get<TopProduct[]>('/api/analytics/seller/top-products');
  },

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(): Promise<ConversionStage[]> {
    return portalApiClient.get<ConversionStage[]>('/api/analytics/seller/conversion');
  },

  /**
   * Get region distribution data
   */
  async getRegionDistribution(): Promise<RegionDistribution[]> {
    return portalApiClient.get<RegionDistribution[]>('/api/analytics/seller/regions');
  },
};

export default sellerAnalyticsService;
