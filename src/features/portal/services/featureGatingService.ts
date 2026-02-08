// =============================================================================
// Feature Gating Service (Frontend)
// Handles API calls for seller feature access checks
// =============================================================================

import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types
// =============================================================================

export type SellerStatus = 'incomplete' | 'pending_review' | 'approved' | 'suspended';

export type GatedAction =
  | 'view_portal'
  | 'create_draft'
  | 'publish_listing'
  | 'send_quote'
  | 'accept_order'
  | 'confirm_delivery'
  | 'send_invoice'
  | 'receive_payout';

export interface GatingResult {
  allowed: boolean;
  reason?: string;
  reasonCode?: string;
  redirectTo?: string;
}

export interface FeatureAccessResponse {
  success: boolean;
  status: SellerStatus;
  features: Record<GatedAction, GatingResult>;
}

export interface SingleFeatureResponse {
  success: boolean;
  allowed: boolean;
  reason?: string;
  reasonCode?: string;
  redirectTo?: string;
}

// =============================================================================
// Service
// =============================================================================

export const featureGatingService = {
  /**
   * Get all feature access status for current seller
   * Uses JWT Bearer token for authentication (no legacy x-user-id header)
   */
  async getFeatureAccess(): Promise<FeatureAccessResponse> {
    const token = portalApiClient.getAccessToken();

    if (!token) {
      // Return all denied if no token
      const allDenied: Record<GatedAction, GatingResult> = {
        view_portal: { allowed: false, reason: 'Not authenticated', reasonCode: 'NOT_AUTHENTICATED' },
        create_draft: { allowed: false, reason: 'Not authenticated', reasonCode: 'NOT_AUTHENTICATED' },
        publish_listing: { allowed: false, reason: 'Not authenticated', reasonCode: 'NOT_AUTHENTICATED' },
        send_quote: { allowed: false, reason: 'Not authenticated', reasonCode: 'NOT_AUTHENTICATED' },
        accept_order: { allowed: false, reason: 'Not authenticated', reasonCode: 'NOT_AUTHENTICATED' },
        confirm_delivery: { allowed: false, reason: 'Not authenticated', reasonCode: 'NOT_AUTHENTICATED' },
        send_invoice: { allowed: false, reason: 'Not authenticated', reasonCode: 'NOT_AUTHENTICATED' },
        receive_payout: { allowed: false, reason: 'Not authenticated', reasonCode: 'NOT_AUTHENTICATED' },
      };
      return { success: false, status: 'incomplete', features: allDenied };
    }

    return portalApiClient.get<FeatureAccessResponse>('/api/gating/features');
  },

  /**
   * Check if a specific action is allowed
   * Uses JWT Bearer token for authentication (no legacy x-user-id header)
   */
  async checkFeature(action: GatedAction): Promise<SingleFeatureResponse> {
    const token = portalApiClient.getAccessToken();

    if (!token) {
      return {
        success: false,
        allowed: false,
        reason: 'Not authenticated',
        reasonCode: 'NOT_AUTHENTICATED',
      };
    }

    return portalApiClient.get<SingleFeatureResponse>(`/api/gating/features/${action}`);
  },

  /**
   * Get feature access from localStorage cache (for sync checks)
   * Falls back to restrictive defaults if not cached
   */
  getCachedFeatureAccess(): {
    status: SellerStatus;
    features: Record<GatedAction, GatingResult>;
  } {
    try {
      const cached = localStorage.getItem('seller_feature_access');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is fresh (less than 5 minutes old)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Return restrictive defaults
    const status = (localStorage.getItem('seller_status') as SellerStatus) || 'incomplete';
    return {
      status,
      features: this.getDefaultFeatures(status),
    };
  },

  /**
   * Get default features based on status (conservative defaults)
   */
  getDefaultFeatures(status: SellerStatus): Record<GatedAction, GatingResult> {
    const denied: GatingResult = { allowed: false, reason: 'Feature access pending', reasonCode: 'PENDING' };
    const allowed: GatingResult = { allowed: true };

    if (status === 'approved') {
      return {
        view_portal: allowed,
        create_draft: allowed,
        publish_listing: allowed,
        send_quote: allowed,
        accept_order: allowed,
        confirm_delivery: allowed,
        send_invoice: allowed,
        receive_payout: allowed,
      };
    }

    return {
      view_portal: status !== 'suspended' ? allowed : denied,
      create_draft: status !== 'suspended' ? allowed : denied,
      publish_listing: denied,
      send_quote: denied,
      accept_order: denied,
      confirm_delivery: denied,
      send_invoice: denied,
      receive_payout: denied,
    };
  },

  /**
   * Cache feature access in localStorage
   */
  cacheFeatureAccess(data: { status: SellerStatus; features: Record<GatedAction, GatingResult> }): void {
    try {
      localStorage.setItem(
        'seller_feature_access',
        JSON.stringify({
          ...data,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Clear cached feature access
   */
  clearCache(): void {
    localStorage.removeItem('seller_feature_access');
  },
};

export default featureGatingService;
