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
  async getAnalyticsSummary(token: string, filters?: AnalyticsFilters): Promise<BuyerAnalyticsSummary> {
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
  async getSpendByCategory(token: string, period?: string): Promise<SpendByCategory[]> {
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
  async getSupplierPerformance(token: string, limit?: number): Promise<SupplierPerformance[]> {
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

  // Mock data generators removed during service consolidation - backend is single source of truth.
  // See: docs/runbook/SERVICE_CONSOLIDATION_REPORT.md
  // All analytics data must come from GET /api/analytics/buyer/*
};

// NOTE: getMockAnalyticsSummary() and generateTimelineData() removed during service consolidation.
// Backend handles empty state detection and returns appropriate response structure.

export default buyerAnalyticsService;
