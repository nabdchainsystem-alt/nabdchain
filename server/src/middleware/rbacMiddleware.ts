// =============================================================================
// RBAC Middleware - Express Permission Enforcement
// =============================================================================
// Enterprise-grade middleware for enforcing role-based access control.
// Follows the pattern established in featureGating.ts.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { permissionService, UserPermissions } from '../services/permissionService';
import { auditService } from '../services/auditService';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export interface RBACRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
  permissions?: UserPermissions;
  auditContext?: {
    requestId: string;
    ipAddress: string;
    userAgent: string;
  };
}

// =============================================================================
// Middleware Functions
// =============================================================================

/**
 * Initialize audit context for request tracing
 * Should be applied early in the middleware chain
 */
export function initAuditContext() {
  return (req: RBACRequest, res: Response, next: NextFunction) => {
    req.auditContext = {
      requestId: crypto.randomUUID(),
      ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    // Set correlation ID header for distributed tracing
    res.setHeader('X-Request-Id', req.auditContext.requestId);

    next();
  };
}

/**
 * Require specific permission(s) to access route (OR logic)
 * Returns 403 if user doesn't have ANY of the specified permissions
 *
 * @example
 * router.post('/orders/:id/approve',
 *   requireAuth,
 *   requirePermission('orders:approve'),
 *   async (req, res) => { ... }
 * );
 *
 * @example
 * // Multiple permissions (user needs ANY of them)
 * router.get('/invoices',
 *   requireAuth,
 *   requirePermission('invoices:view_own', 'invoices:view_all'),
 *   async (req, res) => { ... }
 * );
 */
export function requirePermission(...permissions: string[]) {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        });
      }

      // Check permissions (OR logic for multiple)
      const result = await permissionService.checkAnyPermission(userId, permissions);

      if (!result.allowed) {
        // Log denied access attempt
        await auditService.logAccessDenied({
          userId,
          resource: req.originalUrl,
          action: req.method,
          requiredPermissions: permissions,
          reason: result.reason,
          ipAddress: req.auditContext?.ipAddress || req.ip,
          userAgent: req.auditContext?.userAgent || req.headers['user-agent'],
          requestId: req.auditContext?.requestId,
        });

        return res.status(403).json({
          error: 'Forbidden',
          code: 'PERMISSION_DENIED',
          message: result.reason || 'You do not have permission to perform this action',
          requiredPermissions: permissions,
        });
      }

      // Attach permissions to request for downstream use
      req.permissions = await permissionService.getUserPermissions(userId);

      next();
    } catch (error) {
      apiLogger.error('RBAC middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        code: 'RBAC_ERROR',
        message: 'An error occurred while checking permissions',
      });
    }
  };
}

/**
 * Require all permissions (AND logic)
 * Returns 403 if user doesn't have ALL of the specified permissions
 *
 * @example
 * router.post('/payouts/:id/approve',
 *   requireAuth,
 *   requireAllPermissions('payouts:view_all', 'payouts:approve'),
 *   async (req, res) => { ... }
 * );
 */
export function requireAllPermissions(...permissions: string[]) {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          code: 'AUTH_REQUIRED',
        });
      }

      const result = await permissionService.checkAllPermissions(userId, permissions);

      if (!result.allowed) {
        await auditService.logAccessDenied({
          userId,
          resource: req.originalUrl,
          action: req.method,
          requiredPermissions: permissions,
          reason: result.reason,
          ipAddress: req.auditContext?.ipAddress || req.ip,
          userAgent: req.auditContext?.userAgent || req.headers['user-agent'],
          requestId: req.auditContext?.requestId,
        });

        return res.status(403).json({
          error: 'Forbidden',
          code: 'PERMISSION_DENIED',
          message: 'Insufficient permissions',
          requiredPermissions: permissions,
        });
      }

      req.permissions = await permissionService.getUserPermissions(userId);

      next();
    } catch (error) {
      apiLogger.error('RBAC middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        code: 'RBAC_ERROR',
      });
    }
  };
}

/**
 * Load user permissions without blocking (for conditional UI/logic)
 * Use this when you need permissions context but don't want to enforce a specific permission
 *
 * @example
 * router.get('/dashboard',
 *   requireAuth,
 *   loadPermissions(),
 *   async (req: RBACRequest, res) => {
 *     const canExport = req.permissions?.effectivePermissions.has('analytics:export');
 *     // ...
 *   }
 * );
 */
export function loadPermissions() {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    const userId = req.auth?.userId;

    if (userId) {
      try {
        req.permissions = await permissionService.getUserPermissions(userId);
      } catch (error) {
        // Don't block on error, just continue without permissions
        apiLogger.error('Failed to load permissions:', error);
      }
    }

    next();
  };
}

/**
 * Check if current user has a specific permission (use after loadPermissions)
 */
export function hasPermission(req: RBACRequest, permission: string): boolean {
  return req.permissions?.effectivePermissions.has(permission) ?? false;
}

/**
 * Check if current user has any of the specified permissions
 */
export function hasAnyPermission(req: RBACRequest, permissions: string[]): boolean {
  if (!req.permissions) return false;
  return permissions.some(p => req.permissions!.effectivePermissions.has(p));
}

/**
 * Check if current user has all of the specified permissions
 */
export function hasAllPermissions(req: RBACRequest, permissions: string[]): boolean {
  if (!req.permissions) return false;
  return permissions.every(p => req.permissions!.effectivePermissions.has(p));
}

/**
 * Check if current user has a specific role
 */
export function hasRole(req: RBACRequest, role: string): boolean {
  return req.permissions?.roles.includes(role) ?? false;
}

/**
 * Require a specific role (not recommended - prefer permission-based checks)
 *
 * @example
 * router.get('/admin/users',
 *   requireAuth,
 *   requireRole('admin'),
 *   async (req, res) => { ... }
 * );
 */
export function requireRole(role: string) {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          code: 'AUTH_REQUIRED',
        });
      }

      const userPerms = await permissionService.getUserPermissions(userId);

      if (!userPerms.roles.includes(role)) {
        await auditService.logAccessDenied({
          userId,
          resource: req.originalUrl,
          action: req.method,
          requiredPermissions: [`role:${role}`],
          reason: `Role required: ${role}`,
          ipAddress: req.auditContext?.ipAddress || req.ip,
          userAgent: req.auditContext?.userAgent || req.headers['user-agent'],
          requestId: req.auditContext?.requestId,
        });

        return res.status(403).json({
          error: 'Forbidden',
          code: 'ROLE_REQUIRED',
          message: `Role required: ${role}`,
        });
      }

      req.permissions = userPerms;

      next();
    } catch (error) {
      apiLogger.error('RBAC middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        code: 'RBAC_ERROR',
      });
    }
  };
}

// =============================================================================
// Permission Constants
// =============================================================================

export const PERMISSIONS = {
  // Orders
  ORDERS_VIEW_OWN: 'orders:view_own',
  ORDERS_VIEW_TEAM: 'orders:view_team',
  ORDERS_VIEW_ALL: 'orders:view_all',
  ORDERS_CREATE: 'orders:create',
  ORDERS_UPDATE_STATUS: 'orders:update_status',
  ORDERS_CANCEL: 'orders:cancel',
  ORDERS_APPROVE: 'orders:approve',

  // RFQs
  RFQS_VIEW_OWN: 'rfqs:view_own',
  RFQS_VIEW_ALL: 'rfqs:view_all',
  RFQS_CREATE: 'rfqs:create',
  RFQS_RESPOND: 'rfqs:respond',

  // Invoices
  INVOICES_VIEW_OWN: 'invoices:view_own',
  INVOICES_VIEW_ALL: 'invoices:view_all',
  INVOICES_CREATE: 'invoices:create',
  INVOICES_ISSUE: 'invoices:issue',
  INVOICES_MARK_PAID: 'invoices:mark_paid',
  INVOICES_EXPORT: 'invoices:export',

  // Payouts
  PAYOUTS_VIEW_OWN: 'payouts:view_own',
  PAYOUTS_VIEW_ALL: 'payouts:view_all',
  PAYOUTS_INITIATE: 'payouts:initiate',
  PAYOUTS_APPROVE: 'payouts:approve',

  // Items
  ITEMS_VIEW_PUBLIC: 'items:view_public',
  ITEMS_VIEW_OWN: 'items:view_own',
  ITEMS_CREATE: 'items:create',
  ITEMS_UPDATE: 'items:update',
  ITEMS_PUBLISH: 'items:publish',

  // Analytics
  ANALYTICS_VIEW_OWN: 'analytics:view_own',
  ANALYTICS_VIEW_ALL: 'analytics:view_all',
  ANALYTICS_EXPORT: 'analytics:export',

  // Disputes
  DISPUTES_VIEW_OWN: 'disputes:view_own',
  DISPUTES_CREATE: 'disputes:create',
  DISPUTES_RESPOND: 'disputes:respond',
  DISPUTES_RESOLVE: 'disputes:resolve',
} as const;

export const ROLES = {
  BUYER: 'buyer',
  APPROVER: 'approver',
  FINANCE: 'finance',
  SELLER: 'seller',
} as const;

export default {
  initAuditContext,
  requirePermission,
  requireAllPermissions,
  loadPermissions,
  requireRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  PERMISSIONS,
  ROLES,
};
