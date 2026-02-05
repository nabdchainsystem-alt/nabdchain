// =============================================================================
// Feature Gating Service
// Enforces seller verification-based access control
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export interface SellerGatingContext {
  userId: string;
  sellerId?: string;
  status: SellerStatus;
  canPublish: boolean;
  profileComplete: boolean;
  companyVerified: boolean;
  bankVerified: boolean;
  documentsVerified: boolean;
}

// =============================================================================
// Gating Matrix
// =============================================================================
// Defines which actions are allowed for each seller status
//
// | Action              | incomplete | pending_review | approved | suspended |
// |---------------------|------------|----------------|----------|-----------|
// | view_portal         | YES        | YES            | YES      | YES       |
// | create_draft        | NO (redir) | YES            | YES      | NO        |
// | publish_listing     | NO         | NO             | YES      | NO        |
// | send_quote          | NO         | NO             | YES      | NO        |
// | accept_order        | NO         | NO             | YES      | NO        |
// | confirm_delivery    | NO         | NO             | YES      | NO        |
// | send_invoice        | NO         | NO             | YES      | NO        |
// | receive_payout      | NO         | NO             | YES*     | NO        |
//
// * receive_payout also requires bankVerified = true
// =============================================================================

const GATING_MATRIX: Record<GatedAction, {
  allowedStatuses: SellerStatus[];
  requiresPublish?: boolean;
  requiresBankVerified?: boolean;
  incompleteRedirect?: string;
  deniedReason: string;
  deniedCode: string;
}> = {
  view_portal: {
    allowedStatuses: ['incomplete', 'pending_review', 'approved', 'suspended'],
    deniedReason: 'Access denied',
    deniedCode: 'ACCESS_DENIED',
  },
  create_draft: {
    allowedStatuses: ['pending_review', 'approved'],
    incompleteRedirect: '/portal/seller/onboarding',
    deniedReason: 'Complete your profile to create listings',
    deniedCode: 'PROFILE_INCOMPLETE',
  },
  publish_listing: {
    allowedStatuses: ['approved'],
    requiresPublish: true,
    deniedReason: 'Your account must be verified to publish listings',
    deniedCode: 'NOT_VERIFIED',
  },
  send_quote: {
    allowedStatuses: ['approved'],
    deniedReason: 'Your account must be verified to send quotes',
    deniedCode: 'NOT_VERIFIED',
  },
  accept_order: {
    allowedStatuses: ['approved'],
    deniedReason: 'Your account must be verified to accept orders',
    deniedCode: 'NOT_VERIFIED',
  },
  confirm_delivery: {
    allowedStatuses: ['approved'],
    deniedReason: 'Your account must be verified to confirm deliveries',
    deniedCode: 'NOT_VERIFIED',
  },
  send_invoice: {
    allowedStatuses: ['approved'],
    deniedReason: 'Your account must be verified to send invoices',
    deniedCode: 'NOT_VERIFIED',
  },
  receive_payout: {
    allowedStatuses: ['approved'],
    requiresBankVerified: true,
    deniedReason: 'Your bank account must be verified to receive payouts',
    deniedCode: 'BANK_NOT_VERIFIED',
  },
};

// =============================================================================
// Service Methods
// =============================================================================

export const featureGatingService = {
  /**
   * Get seller gating context from userId
   */
  async getSellerContext(userId: string): Promise<SellerGatingContext | null> {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        canPublish: true,
        profileComplete: true,
        companyVerified: true,
        bankVerified: true,
        documentsVerified: true,
      },
    });

    if (!profile) {
      return null;
    }

    return {
      userId,
      sellerId: profile.id,
      status: profile.status as SellerStatus,
      canPublish: profile.canPublish,
      profileComplete: profile.profileComplete,
      companyVerified: profile.companyVerified,
      bankVerified: profile.bankVerified,
      documentsVerified: profile.documentsVerified,
    };
  },

  /**
   * Check if a seller can perform a specific action
   */
  checkAccess(context: SellerGatingContext, action: GatedAction): GatingResult {
    const rule = GATING_MATRIX[action];

    // Check status-based access
    if (!rule.allowedStatuses.includes(context.status)) {
      // Special handling for incomplete status with redirect
      if (context.status === 'incomplete' && rule.incompleteRedirect) {
        return {
          allowed: false,
          reason: rule.deniedReason,
          reasonCode: rule.deniedCode,
          redirectTo: rule.incompleteRedirect,
        };
      }

      // Suspended status has special message
      if (context.status === 'suspended') {
        return {
          allowed: false,
          reason: 'Your account has been suspended. Contact support for assistance.',
          reasonCode: 'ACCOUNT_SUSPENDED',
        };
      }

      // Pending review status
      if (context.status === 'pending_review') {
        return {
          allowed: false,
          reason: 'Your account is pending verification. This usually takes 1-2 business days.',
          reasonCode: 'PENDING_VERIFICATION',
        };
      }

      return {
        allowed: false,
        reason: rule.deniedReason,
        reasonCode: rule.deniedCode,
      };
    }

    // Check additional requirements
    if (rule.requiresPublish && !context.canPublish) {
      return {
        allowed: false,
        reason: 'Your company and bank must be verified to publish listings',
        reasonCode: 'VERIFICATION_REQUIRED',
      };
    }

    if (rule.requiresBankVerified && !context.bankVerified) {
      return {
        allowed: false,
        reason: 'Your bank account must be verified to receive payouts',
        reasonCode: 'BANK_NOT_VERIFIED',
      };
    }

    return { allowed: true };
  },

  /**
   * Quick check - throws error if not allowed
   */
  async assertAccess(userId: string, action: GatedAction): Promise<SellerGatingContext> {
    const context = await this.getSellerContext(userId);

    if (!context) {
      throw new FeatureGatingError('Seller profile not found', 'SELLER_NOT_FOUND');
    }

    const result = this.checkAccess(context, action);

    if (!result.allowed) {
      throw new FeatureGatingError(
        result.reason || 'Action not allowed',
        result.reasonCode || 'NOT_ALLOWED',
        result.redirectTo
      );
    }

    return context;
  },

  /**
   * Get all feature access for a seller (for frontend)
   */
  async getFeatureAccess(userId: string): Promise<{
    status: SellerStatus;
    features: Record<GatedAction, GatingResult>;
  }> {
    const context = await this.getSellerContext(userId);

    if (!context) {
      // Return all denied for non-existent seller
      const allDenied: Record<GatedAction, GatingResult> = {} as any;
      for (const action of Object.keys(GATING_MATRIX) as GatedAction[]) {
        allDenied[action] = {
          allowed: false,
          reason: 'Seller profile not found',
          reasonCode: 'SELLER_NOT_FOUND',
        };
      }
      return { status: 'incomplete', features: allDenied };
    }

    const features: Record<GatedAction, GatingResult> = {} as any;
    for (const action of Object.keys(GATING_MATRIX) as GatedAction[]) {
      features[action] = this.checkAccess(context, action);
    }

    return { status: context.status, features };
  },

  /**
   * Log a gating denial for audit purposes
   */
  async logGatingDenial(
    userId: string,
    action: GatedAction,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const context = await this.getSellerContext(userId);
      if (context?.sellerId) {
        await prisma.sellerAuditLog.create({
          data: {
            sellerId: context.sellerId,
            userId,
            action: `GATING_DENIED:${action}`,
            entityType: 'feature_gating',
            entityId: null,
            previousValue: null,
            newValue: JSON.stringify({
              action,
              reason,
              status: context.status,
              ...metadata,
            }),
          },
        });
      }
    } catch (error) {
      console.error('Failed to log gating denial:', error);
    }
  },
};

// =============================================================================
// Custom Error Class
// =============================================================================

export class FeatureGatingError extends Error {
  code: string;
  redirectTo?: string;

  constructor(message: string, code: string, redirectTo?: string) {
    super(message);
    this.name = 'FeatureGatingError';
    this.code = code;
    this.redirectTo = redirectTo;
  }
}

export default featureGatingService;
