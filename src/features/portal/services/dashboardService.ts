// =============================================================================
// Dashboard Service - Frontend API Client for Dashboard Analytics
// =============================================================================

import { API_URL } from '../../../config/api';

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
  async getSellerSummary(token: string): Promise<DashboardSummary> {
    const response = await fetch(`${API_URL}/dashboard/seller/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }

    return response.json();
  },

  /**
   * Get buyer dashboard summary
   */
  async getBuyerSummary(token: string): Promise<DashboardSummary> {
    const response = await fetch(`${API_URL}/dashboard/buyer/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }

    return response.json();
  },
};

export default dashboardService;
