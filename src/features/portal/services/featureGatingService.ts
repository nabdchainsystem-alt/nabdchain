// =============================================================================
// Feature Gating Service (Frontend)
// Handles API calls for seller feature access checks
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
   */
  async getFeatureAccess(): Promise<FeatureAccessResponse> {
    const userId = localStorage.getItem('portal_user_id');

    if (!userId) {
      // Return all denied if no user
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

    const response = await fetch(`${API_BASE}/api/gating/features`, {
      headers: {
        'x-user-id': userId,
      },
    });

    return response.json();
  },

  /**
   * Check if a specific action is allowed
   */
  async checkFeature(action: GatedAction): Promise<SingleFeatureResponse> {
    const userId = localStorage.getItem('portal_user_id');

    if (!userId) {
      return {
        success: false,
        allowed: false,
        reason: 'Not authenticated',
        reasonCode: 'NOT_AUTHENTICATED',
      };
    }

    const response = await fetch(`${API_BASE}/api/gating/features/${action}`, {
      headers: {
        'x-user-id': userId,
      },
    });

    return response.json();
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
   * Cache feature access in localStorage
   */
  cacheFeatureAccess(data: { status: SellerStatus; features: Record<GatedAction, GatingResult> }): void {
    try {
      localStorage.setItem('seller_feature_access', JSON.stringify({
        ...data,
        timestamp: Date.now(),
      }));
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

  /**
   * Get default features based on status (for offline/sync use)
   */
  getDefaultFeatures(status: SellerStatus): Record<GatedAction, GatingResult> {
    const defaults: Record<SellerStatus, Record<GatedAction, GatingResult>> = {
      incomplete: {
        view_portal: { allowed: true },
        create_draft: { allowed: false, reason: 'Complete your profile to create listings', reasonCode: 'PROFILE_INCOMPLETE', redirectTo: '/portal/seller/onboarding' },
        publish_listing: { allowed: false, reason: 'Your account must be verified to publish listings', reasonCode: 'NOT_VERIFIED' },
        send_quote: { allowed: false, reason: 'Your account must be verified to send quotes', reasonCode: 'NOT_VERIFIED' },
        accept_order: { allowed: false, reason: 'Your account must be verified to accept orders', reasonCode: 'NOT_VERIFIED' },
        confirm_delivery: { allowed: false, reason: 'Your account must be verified to confirm deliveries', reasonCode: 'NOT_VERIFIED' },
        send_invoice: { allowed: false, reason: 'Your account must be verified to send invoices', reasonCode: 'NOT_VERIFIED' },
        receive_payout: { allowed: false, reason: 'Your bank account must be verified to receive payouts', reasonCode: 'BANK_NOT_VERIFIED' },
      },
      pending_review: {
        view_portal: { allowed: true },
        create_draft: { allowed: true },
        publish_listing: { allowed: false, reason: 'Your account is pending verification. This usually takes 1-2 business days.', reasonCode: 'PENDING_VERIFICATION' },
        send_quote: { allowed: false, reason: 'Your account is pending verification. This usually takes 1-2 business days.', reasonCode: 'PENDING_VERIFICATION' },
        accept_order: { allowed: false, reason: 'Your account is pending verification. This usually takes 1-2 business days.', reasonCode: 'PENDING_VERIFICATION' },
        confirm_delivery: { allowed: false, reason: 'Your account is pending verification. This usually takes 1-2 business days.', reasonCode: 'PENDING_VERIFICATION' },
        send_invoice: { allowed: false, reason: 'Your account is pending verification. This usually takes 1-2 business days.', reasonCode: 'PENDING_VERIFICATION' },
        receive_payout: { allowed: false, reason: 'Your bank account must be verified to receive payouts', reasonCode: 'BANK_NOT_VERIFIED' },
      },
      approved: {
        view_portal: { allowed: true },
        create_draft: { allowed: true },
        publish_listing: { allowed: true },
        send_quote: { allowed: true },
        accept_order: { allowed: true },
        confirm_delivery: { allowed: true },
        send_invoice: { allowed: true },
        receive_payout: { allowed: true },
      },
      suspended: {
        view_portal: { allowed: true },
        create_draft: { allowed: false, reason: 'Your account has been suspended. Contact support for assistance.', reasonCode: 'ACCOUNT_SUSPENDED' },
        publish_listing: { allowed: false, reason: 'Your account has been suspended. Contact support for assistance.', reasonCode: 'ACCOUNT_SUSPENDED' },
        send_quote: { allowed: false, reason: 'Your account has been suspended. Contact support for assistance.', reasonCode: 'ACCOUNT_SUSPENDED' },
        accept_order: { allowed: false, reason: 'Your account has been suspended. Contact support for assistance.', reasonCode: 'ACCOUNT_SUSPENDED' },
        confirm_delivery: { allowed: false, reason: 'Your account has been suspended. Contact support for assistance.', reasonCode: 'ACCOUNT_SUSPENDED' },
        send_invoice: { allowed: false, reason: 'Your account has been suspended. Contact support for assistance.', reasonCode: 'ACCOUNT_SUSPENDED' },
        receive_payout: { allowed: false, reason: 'Your account has been suspended. Contact support for assistance.', reasonCode: 'ACCOUNT_SUSPENDED' },
      },
    };

    return defaults[status];
  },
};

export default featureGatingService;
