// =============================================================================
// Payout Service - Frontend API Client for Seller Payouts
// =============================================================================

import { portalApiClient } from './portalApiClient';
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
  async getPayouts(filters: PayoutFilters = {}): Promise<PayoutsResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    return portalApiClient.get<PayoutsResponse>(`/api/payouts/seller${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get payout statistics
   */
  async getStats(): Promise<PayoutStats> {
    return portalApiClient.get<PayoutStats>('/api/payouts/seller/stats');
  },

  /**
   * Get eligible payout amount
   */
  async getEligible(): Promise<EligiblePayout> {
    return portalApiClient.get<EligiblePayout>('/api/payouts/seller/eligible');
  },

  /**
   * Get a single payout by ID
   */
  async getPayout(payoutId: string): Promise<SellerPayout> {
    return portalApiClient.get<SellerPayout>(`/api/payouts/seller/${payoutId}`);
  },

  /**
   * Get payout event history
   */
  async getPayoutHistory(payoutId: string): Promise<PayoutEvent[]> {
    return portalApiClient.get<PayoutEvent[]>(`/api/payouts/seller/${payoutId}/history`);
  },

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  /**
   * Get payout settings
   */
  async getSettings(): Promise<PayoutSettings> {
    return portalApiClient.get<PayoutSettings>('/api/payouts/seller/settings');
  },

  /**
   * Update payout settings
   */
  async updateSettings(input: UpdatePayoutSettingsInput): Promise<PayoutSettings> {
    return portalApiClient.put<PayoutSettings>('/api/payouts/seller/settings', input);
  },

  /**
   * Get funds timeline showing lifecycle of funds from order to payout
   */
  async getTimeline(limit: number = 10): Promise<{ entries: FundsTimelineEntry[] }> {
    return portalApiClient.get<{ entries: FundsTimelineEntry[] }>(`/api/payouts/seller/timeline?limit=${limit}`);
  },
};

export default payoutService;
