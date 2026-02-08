// =============================================================================
// Expense Analytics Service - Financial Control Center API Client
// =============================================================================
//
// NOTE: This is a thin API client. All business logic (spend leakage detection,
// price drift calculation, category inefficiency scoring) lives in the backend.
// See: server/src/services/expenseAnalyticsService.ts
//
// Business logic moved to backend during service consolidation - see SERVICE_CONSOLIDATION_REPORT.md
// Removed functions: detectSpendLeakage, calculatePriceDrift, calculateCategoryInefficiency,
// generateRecommendations, and all mock data generators.
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  ExpenseAnalyticsDashboard,
  SpendLeakage,
  PriceDriftAlert,
  ExpenseLineItem,
  ExpenseFilters,
} from '../types/expense.types';

// =============================================================================
// Expense Analytics Service
// =============================================================================

export const expenseAnalyticsService = {
  /**
   * Get complete expense analytics dashboard
   */
  async getDashboard(token: string, filters?: ExpenseFilters): Promise<ExpenseAnalyticsDashboard> {
    const url = new URL(`${API_URL}/buyer/expenses/analytics/dashboard`);
    if (filters?.period) url.searchParams.append('period', filters.period);
    if (filters?.category) url.searchParams.append('category', filters.category);
    if (filters?.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) url.searchParams.append('dateTo', filters.dateTo);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expense analytics');
    }

    return response.json();
  },

  /**
   * Get spend leakage alerts
   */
  async getLeakages(
    token: string,
    filters?: { status?: string; severity?: string; limit?: number },
  ): Promise<SpendLeakage[]> {
    const url = new URL(`${API_URL}/buyer/expenses/leakages`);
    if (filters?.status) url.searchParams.append('status', filters.status);
    if (filters?.severity) url.searchParams.append('severity', filters.severity);
    if (filters?.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch leakages');
    }

    return response.json();
  },

  /**
   * Get price drift alerts
   */
  async getPriceDrifts(
    token: string,
    filters?: { direction?: string; minChange?: number },
  ): Promise<PriceDriftAlert[]> {
    const url = new URL(`${API_URL}/buyer/expenses/price-drifts`);
    if (filters?.direction) url.searchParams.append('direction', filters.direction);
    if (filters?.minChange) url.searchParams.append('minChange', filters.minChange.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch price drifts');
    }

    return response.json();
  },

  /**
   * Update leakage status
   */
  async updateLeakageStatus(
    token: string,
    leakageId: string,
    status: SpendLeakage['status'],
    notes?: string,
  ): Promise<SpendLeakage> {
    const response = await fetch(`${API_URL}/buyer/expenses/leakages/${leakageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) {
      throw new Error('Failed to update leakage status');
    }

    return response.json();
  },

  /**
   * Acknowledge price drift
   */
  async acknowledgePriceDrift(
    token: string,
    driftId: string,
    action: 'acknowledge' | 'negotiate' | 'resolve',
  ): Promise<PriceDriftAlert> {
    const response = await fetch(`${API_URL}/buyer/expenses/price-drifts/${driftId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      throw new Error('Failed to update price drift');
    }

    return response.json();
  },

  /**
   * Get expense line items for drill-down
   */
  async getLineItems(
    token: string,
    filters?: ExpenseFilters & { page?: number; limit?: number },
  ): Promise<{ items: ExpenseLineItem[]; total: number }> {
    const url = new URL(`${API_URL}/buyer/expenses/line-items`);
    if (filters?.category) url.searchParams.append('category', filters.category);
    if (filters?.supplierId) url.searchParams.append('supplierId', filters.supplierId);
    if (filters?.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters?.page) url.searchParams.append('page', filters.page.toString());
    if (filters?.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch line items');
    }

    return response.json();
  },

  // Business logic removed during service consolidation - backend is single source of truth.
  // The following functions were moved to server/src/services/expenseAnalyticsService.ts:
  // - detectSpendLeakage() - Policy violation detection
  // - calculatePriceDrift() - Price drift calculation
  // - calculateCategoryInefficiency() - Weighted scoring algorithm
  // - generateRecommendations() - Business rule generation
  //
  // All mock data generators also removed. Backend returns appropriate empty states.
};

export default expenseAnalyticsService;
