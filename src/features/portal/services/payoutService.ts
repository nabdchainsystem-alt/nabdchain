// =============================================================================
// Payout Service - Frontend API Client for Seller Payouts
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  SellerPayout,
  PayoutSettings,
  UpdatePayoutSettingsInput,
  PayoutFilters,
  PayoutStats,
  EligiblePayout,
  PayoutsResponse,
  PayoutEvent,
  FundsTimelineEntry,
} from '../types/payout.types';

// =============================================================================
// Payout Service
// =============================================================================

export const payoutService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all payouts for the seller
   */
  async getPayouts(token: string, filters: PayoutFilters = {}): Promise<PayoutsResponse> {
    const url = new URL(`${API_URL}/payouts/seller`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.page) url.searchParams.append('page', String(filters.page));
    if (filters.limit) url.searchParams.append('limit', String(filters.limit));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payouts');
    }

    return response.json();
  },

  /**
   * Get payout statistics
   */
  async getStats(token: string): Promise<PayoutStats> {
    const response = await fetch(`${API_URL}/payouts/seller/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payout stats');
    }

    return response.json();
  },

  /**
   * Get eligible payout amount
   */
  async getEligible(token: string): Promise<EligiblePayout> {
    const response = await fetch(`${API_URL}/payouts/seller/eligible`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check eligibility');
    }

    return response.json();
  },

  /**
   * Get a single payout by ID
   */
  async getPayout(token: string, payoutId: string): Promise<SellerPayout> {
    const response = await fetch(`${API_URL}/payouts/seller/${payoutId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payout');
    }

    return response.json();
  },

  /**
   * Get payout event history
   */
  async getPayoutHistory(token: string, payoutId: string): Promise<PayoutEvent[]> {
    const response = await fetch(`${API_URL}/payouts/seller/${payoutId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payout history');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  /**
   * Get payout settings
   */
  async getSettings(token: string): Promise<PayoutSettings> {
    const response = await fetch(`${API_URL}/payouts/seller/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payout settings');
    }

    return response.json();
  },

  /**
   * Update payout settings
   */
  async updateSettings(token: string, input: UpdatePayoutSettingsInput): Promise<PayoutSettings> {
    const response = await fetch(`${API_URL}/payouts/seller/settings`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update payout settings');
    }

    return response.json();
  },

  /**
   * Get funds timeline showing lifecycle of funds from order to payout
   */
  async getTimeline(token: string, limit: number = 10): Promise<{ entries: FundsTimelineEntry[] }> {
    const response = await fetch(`${API_URL}/payouts/seller/timeline?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch funds timeline');
    }

    return response.json();
  },
};

export default payoutService;
