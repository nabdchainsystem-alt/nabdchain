// =============================================================================
// Feature Gating Middleware
// Express middleware to protect routes based on seller verification status
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { featureGatingService, GatedAction, FeatureGatingError } from '../services/featureGatingService';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export interface GatedRequest extends Request {
  sellerContext?: {
    userId: string;
    sellerId?: string;
    status: string;
    canPublish: boolean;
    profileComplete: boolean;
    companyVerified: boolean;
    bankVerified: boolean;
    documentsVerified: boolean;
  };
}

// =============================================================================
// Middleware Factory
// =============================================================================

/**
 * Create middleware that gates access based on seller verification status
 *
 * @param action - The action being performed
 * @returns Express middleware function
 *
 * @example
 * // Protect a route that requires publish access
 * router.post('/items/:id/publish', requireSellerAccess('publish_listing'), async (req, res) => {
 *   // Only approved sellers with canPublish=true reach here
 *   const { sellerContext } = req as GatedRequest;
 *   // ...
 * });
 */
export function requireSellerAccess(action: GatedAction) {
  return async (req: GatedRequest, res: Response, next: NextFunction) => {
    try {
      // Get userId from various sources
      const userId =
        req.headers['x-user-id'] as string ||
        (req as any).auth?.userId ||
        req.query.userId as string;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // Check access and get context
      const context = await featureGatingService.assertAccess(userId, action);

      // Attach context to request for downstream use
      req.sellerContext = context;

      next();
    } catch (error) {
      if (error instanceof FeatureGatingError) {
        // Log the denial
        const userId = req.headers['x-user-id'] as string || (req as any).auth?.userId;
        if (userId) {
          await featureGatingService.logGatingDenial(userId, action, error.message, {
            endpoint: req.originalUrl,
            method: req.method,
          });
        }

        // Return appropriate status code
        const statusCode = error.code === 'SELLER_NOT_FOUND' ? 404 :
          error.code === 'ACCOUNT_SUSPENDED' ? 403 : 403;

        return res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            redirectTo: error.redirectTo,
          },
        });
      }

      // Unknown error
      apiLogger.error('Feature gating middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  };
}

/**
 * Middleware to optionally load seller context without blocking
 * Useful for routes that need context but don't require verification
 */
export function loadSellerContext() {
  return async (req: GatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId =
        req.headers['x-user-id'] as string ||
        (req as any).auth?.userId ||
        req.query.userId as string;

      if (userId) {
        const context = await featureGatingService.getSellerContext(userId);
        if (context) {
          req.sellerContext = context;
        }
      }

      next();
    } catch (error) {
      // Don't block on error, just continue without context
      apiLogger.error('Failed to load seller context:', error);
      next();
    }
  };
}

/**
 * Express error handler for FeatureGatingError
 */
export function featureGatingErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof FeatureGatingError) {
    return res.status(403).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        redirectTo: error.redirectTo,
      },
    });
  }

  next(error);
}

export default requireSellerAccess;
