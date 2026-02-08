// =============================================================================
// Portal Admin Middleware
// =============================================================================
// Middleware for portal admin authentication and authorization.
// Uses JWT-based auth with legacy x-user-id support for migration.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';
import {
  verifyAccessToken,
  extractTokenFromHeader,
  isLegacyAuthAllowed,
  DecodedPortalToken,
} from '../auth/portalToken';

// =============================================================================
// Types
// =============================================================================

export interface PortalAuthRequest extends Request {
  portalUser?: {
    id: string;
    email: string;
    name: string | null;
    portalRole: string | null;
    portalStatus: string;
    sellerId?: string;
    buyerId?: string;
  };
  portalAuth?: DecodedPortalToken;
  auditContext?: {
    ipAddress: string;
    userAgent: string;
  };
}

export type PortalRole = 'buyer' | 'seller' | 'admin' | 'staff';

// =============================================================================
// Error Response Helpers
// =============================================================================

function sendAuthError(res: Response, code: string, message: string, status = 401) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

// =============================================================================
// Middleware Functions
// =============================================================================

/**
 * Require portal authentication
 *
 * Authentication flow:
 * 1. Check for JWT token in Authorization header (preferred)
 * 2. If no JWT and ALLOW_LEGACY_PORTAL_AUTH=true, fall back to x-user-id header
 * 3. Verify token and attach user data to request
 */
export function requirePortalAuth() {
  return async (req: PortalAuthRequest, res: Response, next: NextFunction) => {
    try {
      // 1. Try JWT authentication first (preferred method)
      const authHeader = req.headers['authorization'] as string | undefined;
      const token = extractTokenFromHeader(authHeader);

      if (token) {
        const result = verifyAccessToken(token);

        if (result.valid && result.payload) {
          // JWT is valid - fetch fresh user data to ensure account is still active
          const user = await prisma.user.findUnique({
            where: { id: result.payload.userId },
            select: {
              id: true,
              email: true,
              name: true,
              portalRole: true,
              portalStatus: true,
            },
          });

          if (!user) {
            return sendAuthError(res, 'USER_NOT_FOUND', 'User account not found');
          }

          if (user.portalStatus === 'suspended') {
            return sendAuthError(res, 'ACCOUNT_SUSPENDED', 'Your account has been suspended', 403);
          }

          // Attach user info from database (fresh data)
          req.portalUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            portalRole: user.portalRole,
            portalStatus: user.portalStatus,
            sellerId: result.payload.sellerId,
            buyerId: result.payload.buyerId,
          };

          // Attach decoded token for reference
          req.portalAuth = result.payload;

          // Attach audit context
          req.auditContext = {
            ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
          };

          return next();
        }

        // JWT verification failed
        if (result.error) {
          return sendAuthError(res, result.error.code, result.error.message);
        }
      }

      // 2. Fall back to legacy x-user-id header (if allowed)
      if (isLegacyAuthAllowed()) {
        const legacyUserId =
          req.headers['x-user-id'] as string ||
          req.headers['x-portal-user-id'] as string ||
          req.query.userId as string;

        if (legacyUserId) {
          // Log deprecation warning
          apiLogger.warn(
            `[Portal Auth] DEPRECATED: Using legacy x-user-id header for user ${legacyUserId}. ` +
            'Migrate to JWT tokens. Set ALLOW_LEGACY_PORTAL_AUTH=false when migration is complete.'
          );

          const user = await prisma.user.findUnique({
            where: { id: legacyUserId },
            select: {
              id: true,
              email: true,
              name: true,
              portalRole: true,
              portalStatus: true,
            },
          });

          if (!user) {
            return sendAuthError(res, 'USER_NOT_FOUND', 'User not found or session expired');
          }

          if (!user.portalRole) {
            return sendAuthError(res, 'NOT_PORTAL_USER', 'This account is not a portal user', 403);
          }

          if (user.portalStatus === 'suspended') {
            return sendAuthError(res, 'ACCOUNT_SUSPENDED', 'Your account has been suspended', 403);
          }

          req.portalUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            portalRole: user.portalRole,
            portalStatus: user.portalStatus,
          };

          req.auditContext = {
            ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
          };

          return next();
        }
      }

      // 3. No valid authentication found
      return sendAuthError(
        res,
        'UNAUTHENTICATED',
        'Authentication required. Please log in.'
      );
    } catch (error) {
      // Check for database connectivity issues
      if (error instanceof Error && error.message.includes('connect')) {
        apiLogger.error('[Portal Auth] Database connection error:', error);
        return res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Database unavailable. Please try again later.',
          },
        });
      }

      apiLogger.error('[Portal Auth] Middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'An error occurred during authentication',
        },
      });
    }
  };
}

/**
 * Require specific portal role(s) (OR logic)
 * Must be used after requirePortalAuth()
 *
 * @example
 * router.get('/admin/users',
 *   requirePortalAuth(),
 *   requirePortalRole('admin'),
 *   async (req, res) => { ... }
 * );
 *
 * @example
 * // Multiple roles (user needs ANY of them)
 * router.get('/admin/dashboard',
 *   requirePortalAuth(),
 *   requirePortalRole('admin', 'staff'),
 *   async (req, res) => { ... }
 * );
 */
export function requirePortalRole(...roles: PortalRole[]) {
  return async (req: PortalAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.portalUser) {
        return sendAuthError(res, 'UNAUTHENTICATED', 'Authentication required');
      }

      const userRole = req.portalUser.portalRole as PortalRole | null;

      if (!userRole || !roles.includes(userRole)) {
        apiLogger.warn(
          `[Portal Admin] Access denied for user ${req.portalUser.id} ` +
          `(role: ${userRole}) - required: ${roles.join(', ')}`
        );

        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
            requiredRoles: roles,
          },
        });
      }

      next();
    } catch (error) {
      apiLogger.error('[Portal Role] Middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'ROLE_CHECK_ERROR',
          message: 'An error occurred checking permissions',
        },
      });
    }
  };
}

/**
 * Require admin role specifically
 * Convenience middleware for admin-only routes
 */
export const requirePortalAdmin = () => requirePortalRole('admin');

/**
 * Require admin or staff role
 * Convenience middleware for staff-accessible routes
 */
export const requirePortalStaff = () => requirePortalRole('admin', 'staff');

/**
 * Require seller role
 */
export const requireSeller = () => requirePortalRole('seller');

/**
 * Require buyer role
 */
export const requireBuyer = () => requirePortalRole('buyer');

/**
 * Require either buyer or seller (any portal user)
 */
export const requirePortalUser = () => requirePortalRole('buyer', 'seller', 'admin', 'staff');

export default {
  requirePortalAuth,
  requirePortalRole,
  requirePortalAdmin,
  requirePortalStaff,
  requireSeller,
  requireBuyer,
  requirePortalUser,
};
