// =============================================================================
// Permission Routes - RBAC API Endpoints
// =============================================================================
// Provides endpoints for fetching user permissions, roles, and audit logs.
// =============================================================================

import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requirePermission, RBACRequest, PERMISSIONS } from '../middleware/rbacMiddleware';
import { permissionService } from '../services/permissionService';
import { auditService } from '../services/auditService';
import { z } from 'zod';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const assignRoleSchema = z.object({
  userId: z.string().min(1),
  roleCode: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

const auditSearchSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  actionCategory: z.enum(['crud', 'workflow', 'auth', 'admin', 'financial']).optional(),
  actorId: z.string().optional(),
  actorType: z.enum(['buyer', 'seller', 'approver', 'finance', 'system', 'admin']).optional(),
  status: z.enum(['success', 'failure', 'denied']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// =============================================================================
// Permission Endpoints
// =============================================================================

/**
 * GET /api/portal/permissions/me
 * Get current user's permissions and roles
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permissions = await permissionService.getUserPermissions(userId);

    return res.json({
      userId: permissions.userId,
      roles: permissions.roles,
      permissions: permissions.permissions,
    });
  } catch (error) {
    apiLogger.error('Error fetching user permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

/**
 * GET /api/portal/permissions/roles
 * Get all available roles
 */
router.get('/roles', requireAuth, async (req: Request, res: Response) => {
  try {
    const roles = await permissionService.getAllRoles();
    return res.json({ roles });
  } catch (error) {
    apiLogger.error('Error fetching roles:', error);
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

/**
 * GET /api/portal/permissions/all
 * Get all permissions grouped by resource
 */
router.get('/all', requireAuth, async (req: Request, res: Response) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    return res.json({ permissions });
  } catch (error) {
    apiLogger.error('Error fetching all permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

/**
 * GET /api/portal/permissions/user/:userId
 * Get a specific user's roles (admin only)
 */
router.get(
  '/user/:userId',
  requireAuth,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW_ALL),
  async (req: RBACRequest, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const userRoles = await permissionService.getUserRoles(userId);
      const userPerms = await permissionService.getUserPermissions(userId);

      return res.json({
        userId,
        roles: userRoles,
        permissions: userPerms.permissions,
      });
    } catch (error) {
      apiLogger.error('Error fetching user permissions:', error);
      return res.status(500).json({ error: 'Failed to fetch user permissions' });
    }
  }
);

/**
 * POST /api/portal/permissions/assign
 * Assign a role to a user (admin only)
 */
router.post(
  '/assign',
  requireAuth,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW_ALL),
  async (req: RBACRequest, res: Response) => {
    try {
      const parsed = assignRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
      }

      const { userId, roleCode, expiresAt } = parsed.data;
      const assignedBy = (req as AuthRequest).auth?.userId || 'system';

      const result = await permissionService.assignRole(
        userId,
        roleCode,
        assignedBy,
        expiresAt ? { expiresAt: new Date(expiresAt) } : undefined
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Log the role assignment
      await auditService.logAuthEvent('role_assigned', userId, 'admin', {
        metadata: { roleCode, assignedBy },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ success: true, message: `Role '${roleCode}' assigned to user` });
    } catch (error) {
      apiLogger.error('Error assigning role:', error);
      return res.status(500).json({ error: 'Failed to assign role' });
    }
  }
);

/**
 * POST /api/portal/permissions/revoke
 * Revoke a role from a user (admin only)
 */
router.post(
  '/revoke',
  requireAuth,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW_ALL),
  async (req: RBACRequest, res: Response) => {
    try {
      const { userId, roleCode } = req.body;

      if (!userId || !roleCode) {
        return res.status(400).json({ error: 'userId and roleCode are required' });
      }

      const result = await permissionService.revokeRole(userId, roleCode);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Log the role revocation
      await auditService.logAuthEvent('role_revoked', userId, 'admin', {
        metadata: { roleCode, revokedBy: (req as AuthRequest).auth?.userId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ success: true, message: `Role '${roleCode}' revoked from user` });
    } catch (error) {
      apiLogger.error('Error revoking role:', error);
      return res.status(500).json({ error: 'Failed to revoke role' });
    }
  }
);

/**
 * GET /api/portal/permissions/check
 * Check if current user has specific permission
 */
router.get('/check', requireAuth, async (req: Request, res: Response) => {
  try {
    const { permission } = req.query;
    const userId = (req as AuthRequest).auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!permission || typeof permission !== 'string') {
      return res.status(400).json({ error: 'permission query parameter is required' });
    }

    const result = await permissionService.checkPermission(userId, permission);

    return res.json({
      permission,
      allowed: result.allowed,
      role: result.roleUsed,
    });
  } catch (error) {
    apiLogger.error('Error checking permission:', error);
    return res.status(500).json({ error: 'Failed to check permission' });
  }
});

// =============================================================================
// Audit Log Endpoints
// =============================================================================

/**
 * GET /api/portal/permissions/audit/entity/:entityType/:entityId
 * Get audit trail for a specific entity
 */
router.get(
  '/audit/entity/:entityType/:entityId',
  requireAuth,
  async (req: RBACRequest, res: Response) => {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const { limit, offset } = req.query;

      const logs = await auditService.getEntityAuditTrail(entityType, entityId, {
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ logs });
    } catch (error) {
      apiLogger.error('Error fetching entity audit trail:', error);
      return res.status(500).json({ error: 'Failed to fetch audit trail' });
    }
  }
);

/**
 * GET /api/portal/permissions/audit/me
 * Get current user's audit trail
 */
router.get('/audit/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit, offset, entityType, dateFrom, dateTo } = req.query;

    const logs = await auditService.getActorAuditTrail(userId, {
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
      entityType: entityType as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });

    return res.json({ logs });
  } catch (error) {
    apiLogger.error('Error fetching user audit trail:', error);
    return res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

/**
 * GET /api/portal/permissions/audit/search
 * Search audit logs (Finance role only)
 */
router.get(
  '/audit/search',
  requireAuth,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW_ALL),
  async (req: RBACRequest, res: Response) => {
    try {
      const parsed = auditSearchSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
      }

      const filters = parsed.data;
      const result = await auditService.searchAuditLogs({
        ...filters,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      });

      return res.json(result);
    } catch (error) {
      apiLogger.error('Error searching audit logs:', error);
      return res.status(500).json({ error: 'Failed to search audit logs' });
    }
  }
);

/**
 * GET /api/portal/permissions/audit/stats
 * Get audit statistics (Finance role only)
 */
router.get(
  '/audit/stats',
  requireAuth,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW_ALL),
  async (req: RBACRequest, res: Response) => {
    try {
      const { dateFrom, dateTo } = req.query;

      // Default to last 30 days if not specified
      const from = dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = dateTo ? new Date(dateTo as string) : new Date();

      const stats = await auditService.getAuditStats(from, to);

      return res.json({
        dateRange: { from, to },
        ...stats,
      });
    } catch (error) {
      apiLogger.error('Error fetching audit stats:', error);
      return res.status(500).json({ error: 'Failed to fetch audit stats' });
    }
  }
);

export default router;
