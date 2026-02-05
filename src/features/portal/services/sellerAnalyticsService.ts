// =============================================================================
// Seller Analytics Service - Sales Intelligence API Client
// =============================================================================

import { API_URL } from '../../../config/api';

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

export interface SellerAnalyticsSummary {
  kpis: SellerKPIs;
  revenueByCategory: RevenueByCategory[];
  topProducts: TopProduct[];
  conversionFunnel: ConversionStage[];
  regionDistribution: RegionDistribution[];
  period: string;
}

// =============================================================================
// Seller Analytics Service
// =============================================================================

export const sellerAnalyticsService = {
  /**
   * Get complete analytics summary for seller dashboard
   */
  async getAnalyticsSummary(
    token: string,
    period: string = '30d'
  ): Promise<SellerAnalyticsSummary> {
    const url = new URL(`${API_URL}/analytics/seller/summary`);
    url.searchParams.append('period', period);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics summary');
    }

    return response.json();
  },

  /**
   * Get KPI metrics only
   */
  async getKPIs(token: string, period?: string): Promise<SellerKPIs> {
    const url = new URL(`${API_URL}/analytics/seller/kpis`);
    if (period) url.searchParams.append('period', period);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch KPIs');
    }

    return response.json();
  },

  /**
   * Get top performing products
   */
  async getTopProducts(token: string): Promise<TopProduct[]> {
    const response = await fetch(`${API_URL}/analytics/seller/top-products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch top products');
    }

    return response.json();
  },

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(token: string): Promise<ConversionStage[]> {
    const response = await fetch(`${API_URL}/analytics/seller/conversion`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversion funnel');
    }

    return response.json();
  },

  /**
   * Get region distribution data
   */
  async getRegionDistribution(token: string): Promise<RegionDistribution[]> {
    const response = await fetch(`${API_URL}/analytics/seller/regions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch region distribution');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Mock Data Generators (for development/fallback)
  // ---------------------------------------------------------------------------

  /**
   * Generate mock analytics data for development
   */
  getMockAnalyticsSummary(period: string = '30d'): SellerAnalyticsSummary {
    const periodMultiplier = period === '7d' ? 0.25 : period === '90d' ? 3 : period === '12m' ? 12 : 1;

    return {
      kpis: {
        revenue: Math.round(124500 * periodMultiplier),
        orders: Math.round(156 * periodMultiplier),
        newBuyers: Math.round(34 * periodMultiplier),
        winRate: 68,
        currency: 'SAR',
        trends: {
          revenue: 18,
          orders: 12,
          buyers: 8,
          winRate: 5,
        },
      },
      revenueByCategory: [
        { category: 'Electronics', amount: 43575 * periodMultiplier, percentage: 35 },
        { category: 'Industrial', amount: 34860 * periodMultiplier, percentage: 28 },
        { category: 'Raw Materials', amount: 27390 * periodMultiplier, percentage: 22 },
        { category: 'Services', amount: 18675 * periodMultiplier, percentage: 15 },
      ],
      topProducts: [
        { itemId: '1', name: 'Industrial Valves Set', sku: 'VAL-2024', revenue: 24500, orders: 32 },
        { itemId: '2', name: 'Steel Pipes Bundle', sku: 'STP-1890', revenue: 18200, orders: 28 },
        { itemId: '3', name: 'Electrical Panels', sku: 'ELP-4521', revenue: 15800, orders: 21 },
        { itemId: '4', name: 'Safety Equipment Kit', sku: 'SEK-7845', revenue: 12400, orders: 45 },
      ],
      conversionFunnel: [
        { stage: 'RFQs Received', value: 156, percent: 100 },
        { stage: 'Quotes Sent', value: 124, percent: 79 },
        { stage: 'Negotiating', value: 68, percent: 44 },
        { stage: 'Orders Won', value: 42, percent: 27 },
      ],
      regionDistribution: [
        { region: 'Riyadh', percentage: 42, orders: 68 },
        { region: 'Jeddah', percentage: 28, orders: 45 },
        { region: 'Dammam', percentage: 18, orders: 29 },
        { region: 'Other', percentage: 12, orders: 19 },
      ],
      period,
    };
  },
};

export default sellerAnalyticsService;
