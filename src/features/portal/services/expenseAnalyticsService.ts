// =============================================================================
// Expense Analytics Service - Financial Control Center API Client
// =============================================================================

import { portalApiClient } from './portalApiClient';
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
  async getDashboard(filters?: ExpenseFilters): Promise<ExpenseAnalyticsDashboard> {
    const p = new URLSearchParams();
    if (filters?.period) p.append('period', filters.period);
    if (filters?.category) p.append('category', filters.category);
    if (filters?.dateFrom) p.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) p.append('dateTo', filters.dateTo);
    const qs = p.toString();
    return portalApiClient.get<ExpenseAnalyticsDashboard>(
      `/api/buyer/expenses/analytics/dashboard${qs ? `?${qs}` : ''}`,
    );
  },

  async getLeakages(filters?: { status?: string; severity?: string; limit?: number }): Promise<SpendLeakage[]> {
    const p = new URLSearchParams();
    if (filters?.status) p.append('status', filters.status);
    if (filters?.severity) p.append('severity', filters.severity);
    if (filters?.limit) p.append('limit', filters.limit.toString());
    const qs = p.toString();
    return portalApiClient.get<SpendLeakage[]>(`/api/buyer/expenses/leakages${qs ? `?${qs}` : ''}`);
  },

  async getPriceDrifts(filters?: { direction?: string; minChange?: number }): Promise<PriceDriftAlert[]> {
    const p = new URLSearchParams();
    if (filters?.direction) p.append('direction', filters.direction);
    if (filters?.minChange) p.append('minChange', filters.minChange.toString());
    const qs = p.toString();
    return portalApiClient.get<PriceDriftAlert[]>(`/api/buyer/expenses/price-drifts${qs ? `?${qs}` : ''}`);
  },

  async updateLeakageStatus(leakageId: string, status: SpendLeakage['status'], notes?: string): Promise<SpendLeakage> {
    return portalApiClient.patch<SpendLeakage>(`/api/buyer/expenses/leakages/${leakageId}`, { status, notes });
  },

  async acknowledgePriceDrift(
    driftId: string,
    action: 'acknowledge' | 'negotiate' | 'resolve',
  ): Promise<PriceDriftAlert> {
    return portalApiClient.post<PriceDriftAlert>(`/api/buyer/expenses/price-drifts/${driftId}/action`, { action });
  },

  async getLineItems(
    filters?: ExpenseFilters & { page?: number; limit?: number },
  ): Promise<{ items: ExpenseLineItem[]; total: number }> {
    const p = new URLSearchParams();
    if (filters?.category) p.append('category', filters.category);
    if (filters?.supplierId) p.append('supplierId', filters.supplierId);
    if (filters?.dateFrom) p.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) p.append('dateTo', filters.dateTo);
    if (filters?.page) p.append('page', filters.page.toString());
    if (filters?.limit) p.append('limit', filters.limit.toString());
    const qs = p.toString();
    return portalApiClient.get(`/api/buyer/expenses/line-items${qs ? `?${qs}` : ''}`);
  },
};

export default expenseAnalyticsService;
