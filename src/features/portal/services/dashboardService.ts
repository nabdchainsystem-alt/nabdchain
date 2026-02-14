// =============================================================================
// Dashboard Service - Frontend API Client for Dashboard Analytics
// =============================================================================

import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types
// =============================================================================

export interface DashboardSummary {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  activeListings: number;
  listingsChange: number;
  pendingRfqs: number;
  rfqsChange: number;
  period: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
}

// =============================================================================
// Dashboard Service
// =============================================================================

export const dashboardService = {
  /**
   * Get seller dashboard summary
   */
  async getSellerSummary(): Promise<DashboardSummary> {
    return portalApiClient.get<DashboardSummary>('/api/dashboard/seller/summary');
  },

  /**
   * Get buyer dashboard summary
   */
  async getBuyerSummary(): Promise<DashboardSummary> {
    return portalApiClient.get<DashboardSummary>('/api/dashboard/buyer/summary');
  },
};

export default dashboardService;
