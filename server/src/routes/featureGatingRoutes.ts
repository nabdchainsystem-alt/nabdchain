// =============================================================================
// Feature Gating Routes
// API endpoints for checking seller feature access based on verification status
// =============================================================================

import { Router, Request, Response } from 'express';
import { featureGatingService, GatedAction } from '../services/featureGatingService';

const router = Router();

// =============================================================================
// Get Feature Access Status
// =============================================================================

/**
 * GET /api/gating/features
 *
 * Get all feature access status for a seller
 *
 * Headers:
 *   x-user-id: string (userId)
 *
 * Response:
 * {
 *   "status": "pending_review",
 *   "features": {
 *     "view_portal": { "allowed": true },
 *     "create_draft": { "allowed": true },
 *     "publish_listing": { "allowed": false, "reason": "...", "reasonCode": "..." },
 *     ...
 *   }
 * }
 */
router.get('/features', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID is required',
        },
      });
    }

    const result = await featureGatingService.getFeatureAccess(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get feature access error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get feature access',
      },
    });
  }
});

/**
 * GET /api/gating/features/:action
 *
 * Check if a specific action is allowed
 *
 * Headers:
 *   x-user-id: string (userId)
 *
 * Path params:
 *   action: GatedAction
 *
 * Response:
 * {
 *   "allowed": false,
 *   "reason": "Your account must be verified to publish listings",
 *   "reasonCode": "NOT_VERIFIED",
 *   "redirectTo": "/portal/seller/onboarding"  // optional
 * }
 */
router.get('/features/:action', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    const action = req.params.action as GatedAction;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID is required',
        },
      });
    }

    // Validate action
    const validActions: GatedAction[] = [
      'view_portal',
      'create_draft',
      'publish_listing',
      'send_quote',
      'accept_order',
      'confirm_delivery',
      'send_invoice',
      'receive_payout',
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: `Invalid action. Valid actions: ${validActions.join(', ')}`,
        },
      });
    }

    const context = await featureGatingService.getSellerContext(userId);

    if (!context) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SELLER_NOT_FOUND',
          message: 'Seller profile not found',
        },
      });
    }

    const result = featureGatingService.checkAccess(context, action);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Check feature access error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check feature access',
      },
    });
  }
});

/**
 * GET /api/gating/matrix
 *
 * Get the complete gating matrix (for documentation/admin purposes)
 *
 * Response:
 * {
 *   "matrix": {
 *     "view_portal": { "allowedStatuses": ["incomplete", ...], "deniedReason": "..." },
 *     ...
 *   }
 * }
 */
router.get('/matrix', async (req: Request, res: Response) => {
  try {
    // Return the gating matrix documentation
    const matrix = {
      view_portal: {
        description: 'View seller portal pages',
        allowedStatuses: ['incomplete', 'pending_review', 'approved', 'suspended'],
      },
      create_draft: {
        description: 'Create draft listings',
        allowedStatuses: ['pending_review', 'approved'],
        note: 'Incomplete sellers are redirected to onboarding',
      },
      publish_listing: {
        description: 'Publish listings to marketplace',
        allowedStatuses: ['approved'],
        additionalRequirements: ['canPublish must be true (company and bank verified)'],
      },
      send_quote: {
        description: 'Send quotes in response to RFQs',
        allowedStatuses: ['approved'],
      },
      accept_order: {
        description: 'Accept and confirm orders',
        allowedStatuses: ['approved'],
      },
      confirm_delivery: {
        description: 'Confirm order delivery',
        allowedStatuses: ['approved'],
      },
      send_invoice: {
        description: 'Send invoices to buyers',
        allowedStatuses: ['approved'],
      },
      receive_payout: {
        description: 'Receive payouts for completed orders',
        allowedStatuses: ['approved'],
        additionalRequirements: ['bankVerified must be true'],
      },
    };

    res.status(200).json({
      success: true,
      matrix,
      statusDescriptions: {
        incomplete: 'Profile not yet complete - must finish onboarding',
        pending_review: 'Profile complete, awaiting verification (1-2 business days)',
        approved: 'Fully verified seller with all features enabled',
        suspended: 'Account suspended - contact support',
      },
    });
  } catch (error) {
    console.error('Get gating matrix error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get gating matrix',
      },
    });
  }
});

export default router;
