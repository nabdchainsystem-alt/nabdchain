// =============================================================================
// Buyer Analytics Service - Procurement Intelligence API Client
// =============================================================================

import { portalApiClient } from './portalApiClient';
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
  async getAnalyticsSummary(filters?: AnalyticsFilters): Promise<BuyerAnalyticsSummary> {
    const p = new URLSearchParams();
    if (filters?.period) p.append('period', filters.period);
    if (filters?.category) p.append('category', filters.category);
    if (filters?.dateFrom) p.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) p.append('dateTo', filters.dateTo);
    const qs = p.toString();
    return portalApiClient.get<BuyerAnalyticsSummary>(`/api/analytics/buyer/summary${qs ? `?${qs}` : ''}`);
  },

  async getKPIs(period?: string): Promise<BuyerAnalyticsKPI> {
    const qs = period ? `?period=${period}` : '';
    return portalApiClient.get<BuyerAnalyticsKPI>(`/api/analytics/buyer/kpis${qs}`);
  },

  async getSpendByCategory(period?: string): Promise<SpendByCategory[]> {
    const qs = period ? `?period=${period}` : '';
    return portalApiClient.get<SpendByCategory[]>(`/api/analytics/buyer/spend-by-category${qs}`);
  },

  async getSupplierPerformance(limit?: number): Promise<SupplierPerformance[]> {
    const qs = limit ? `?limit=${limit}` : '';
    return portalApiClient.get<SupplierPerformance[]>(`/api/analytics/buyer/supplier-performance${qs}`);
  },

  async getRFQFunnel(period?: string): Promise<RFQFunnel> {
    const qs = period ? `?period=${period}` : '';
    return portalApiClient.get<RFQFunnel>(`/api/analytics/buyer/rfq-funnel${qs}`);
  },
};

export default buyerAnalyticsService;
