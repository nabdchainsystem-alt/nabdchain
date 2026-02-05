// =============================================================================
// Buyer Analytics Service - Procurement Intelligence API Client
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  BuyerAnalyticsSummary,
  BuyerAnalyticsKPI,
  SpendByCategory,
  SupplierPerformance,
  RFQFunnel,
  AnalyticsFilters,
} from '../types/analytics.types';

// =============================================================================
// Buyer Analytics Service
// =============================================================================

export const buyerAnalyticsService = {
  /**
   * Get complete analytics summary for buyer dashboard
   */
  async getAnalyticsSummary(
    token: string,
    filters?: AnalyticsFilters
  ): Promise<BuyerAnalyticsSummary> {
    const url = new URL(`${API_URL}/analytics/buyer/summary`);
    if (filters?.period) url.searchParams.append('period', filters.period);
    if (filters?.category) url.searchParams.append('category', filters.category);
    if (filters?.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) url.searchParams.append('dateTo', filters.dateTo);

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
  async getKPIs(token: string, period?: string): Promise<BuyerAnalyticsKPI> {
    const url = new URL(`${API_URL}/analytics/buyer/kpis`);
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
   * Get spend breakdown by category
   */
  async getSpendByCategory(
    token: string,
    period?: string
  ): Promise<SpendByCategory[]> {
    const url = new URL(`${API_URL}/analytics/buyer/spend-by-category`);
    if (period) url.searchParams.append('period', period);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch spend by category');
    }

    return response.json();
  },

  /**
   * Get supplier performance rankings
   */
  async getSupplierPerformance(
    token: string,
    limit?: number
  ): Promise<SupplierPerformance[]> {
    const url = new URL(`${API_URL}/analytics/buyer/supplier-performance`);
    if (limit) url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch supplier performance');
    }

    return response.json();
  },

  /**
   * Get RFQ funnel conversion metrics
   */
  async getRFQFunnel(token: string, period?: string): Promise<RFQFunnel> {
    const url = new URL(`${API_URL}/analytics/buyer/rfq-funnel`);
    if (period) url.searchParams.append('period', period);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch RFQ funnel');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Mock Data Generators (for development/fallback)
  // ---------------------------------------------------------------------------

  /**
   * Generate mock analytics data for development
   */
  getMockAnalyticsSummary(period: string = 'month'): BuyerAnalyticsSummary {
    const periodMultiplier = period === 'week' ? 0.25 : period === 'quarter' ? 3 : period === 'year' ? 12 : 1;

    return {
      kpis: {
        totalSpend: Math.round(185000 * periodMultiplier),
        rfqsSent: Math.round(42 * periodMultiplier),
        avgResponseTime: 4.2,
        savingsVsMarket: 12.5,
        currency: 'SAR',
        trends: {
          spend: 8.5,
          rfqs: 15.2,
          responseTime: -12.3,
          savings: 3.8,
        },
      },
      spendByCategory: [
        { category: 'Hydraulics', amount: 45000 * periodMultiplier, percentage: 24.3 },
        { category: 'Bearings', amount: 38000 * periodMultiplier, percentage: 20.5 },
        { category: 'Motors', amount: 32000 * periodMultiplier, percentage: 17.3 },
        { category: 'Valves', amount: 28000 * periodMultiplier, percentage: 15.1 },
        { category: 'Electronics', amount: 24000 * periodMultiplier, percentage: 13.0 },
        { category: 'Other', amount: 18000 * periodMultiplier, percentage: 9.8 },
      ],
      topSuppliers: [
        {
          supplierId: 'sup-1',
          supplierName: 'Industrial Parts Co.',
          country: 'Saudi Arabia',
          totalOrders: 28,
          totalSpend: 52000,
          onTimeDeliveryRate: 96,
          qualityScore: 4.8,
          responseTime: 2.5,
          rfqWinRate: 75,
        },
        {
          supplierId: 'sup-2',
          supplierName: 'Global Machinery Ltd.',
          country: 'UAE',
          totalOrders: 22,
          totalSpend: 45000,
          onTimeDeliveryRate: 92,
          qualityScore: 4.6,
          responseTime: 3.8,
          rfqWinRate: 68,
        },
        {
          supplierId: 'sup-3',
          supplierName: 'Tech Components Inc.',
          country: 'Germany',
          totalOrders: 18,
          totalSpend: 38000,
          onTimeDeliveryRate: 98,
          qualityScore: 4.9,
          responseTime: 4.2,
          rfqWinRate: 82,
        },
        {
          supplierId: 'sup-4',
          supplierName: 'Asia Industrial Supply',
          country: 'China',
          totalOrders: 15,
          totalSpend: 28000,
          onTimeDeliveryRate: 88,
          qualityScore: 4.3,
          responseTime: 5.1,
          rfqWinRate: 55,
        },
        {
          supplierId: 'sup-5',
          supplierName: 'Local Parts Center',
          country: 'Saudi Arabia',
          totalOrders: 12,
          totalSpend: 22000,
          onTimeDeliveryRate: 94,
          qualityScore: 4.5,
          responseTime: 1.8,
          rfqWinRate: 72,
        },
      ],
      rfqFunnel: {
        rfqsSent: Math.round(42 * periodMultiplier),
        quotesReceived: Math.round(38 * periodMultiplier),
        ordersPlaced: Math.round(24 * periodMultiplier),
        rfqToQuoteRate: 90.5,
        quoteToOrderRate: 63.2,
        overallConversionRate: 57.1,
      },
      timeline: this.generateTimelineData(period),
      period: period as 'week' | 'month' | 'quarter' | 'year',
    };
  },

  /**
   * Generate timeline data points based on period
   */
  generateTimelineData(period: string): { date: string; spend: number; orders: number; rfqs: number }[] {
    const points: { date: string; spend: number; orders: number; rfqs: number }[] = [];
    const now = new Date();

    let numPoints = 7;
    let dayIncrement = 1;

    if (period === 'month') {
      numPoints = 30;
      dayIncrement = 1;
    } else if (period === 'quarter') {
      numPoints = 12;
      dayIncrement = 7;
    } else if (period === 'year') {
      numPoints = 12;
      dayIncrement = 30;
    }

    for (let i = numPoints - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * dayIncrement));

      points.push({
        date: date.toISOString().split('T')[0],
        spend: Math.round(5000 + Math.random() * 10000),
        orders: Math.round(1 + Math.random() * 4),
        rfqs: Math.round(1 + Math.random() * 5),
      });
    }

    return points;
  },
};

export default buyerAnalyticsService;
