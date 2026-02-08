// =============================================================================
// Portal Admin Routes
// =============================================================================
// API routes for portal admin user management.
// All routes require admin role.
// =============================================================================

import express, { Response } from 'express';
import {
  requirePortalAuth,
  requirePortalRole,
  PortalAuthRequest,
} from '../middleware/portalAdminMiddleware';
import { portalAdminService } from '../services/portalAdminService';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// =============================================================================
// User Management Routes
// =============================================================================

/**
 * GET /api/portal-admin/users
 * List all portal users with pagination, search, and filters
 */
router.get(
  '/users',
  requirePortalAuth(),
  requirePortalRole('admin'),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const {
        page,
        limit,
        search,
        role,
        status,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await portalAdminService.listUsers({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        role: role as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(result);
    } catch (error) {
      apiLogger.error('[Portal Admin] List users error:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  }
);

/**
 * GET /api/portal-admin/users/:id
 * Get single user details
 */
router.get(
  '/users/:id',
  requirePortalAuth(),
  requirePortalRole('admin'),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const user = await portalAdminService.getUser(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log view action
      if (req.portalUser) {
        await portalAdminService.logAudit({
          actorId: req.portalUser.id,
          actorEmail: req.portalUser.email,
          action: 'user_view',
          targetUserId: id,
          targetUserEmail: user.email,
          ipAddress: req.auditContext?.ipAddress,
          userAgent: req.auditContext?.userAgent,
        });
      }

      res.json(user);
    } catch (error) {
      apiLogger.error('[Portal Admin] Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }
);

/**
 * PATCH /api/portal-admin/users/:id
 * Update user details (name, phone, role, status)
 */
router.patch(
  '/users/:id',
  requirePortalAuth(),
  requirePortalRole('admin'),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { name, phoneNumber, portalRole, portalStatus } = req.body;

      // Validate role if provided
      if (portalRole && !['buyer', 'seller', 'admin', 'staff'].includes(portalRole)) {
        return res.status(400).json({ error: 'Invalid portal role' });
      }

      // Validate status if provided
      if (portalStatus && !['active', 'suspended'].includes(portalStatus)) {
        return res.status(400).json({ error: 'Invalid portal status' });
      }

      const result = await portalAdminService.updateUser(
        id,
        { name, phoneNumber, portalRole, portalStatus },
        { id: req.portalUser!.id, email: req.portalUser!.email },
        {
          ipAddress: req.auditContext?.ipAddress,
          userAgent: req.auditContext?.userAgent,
        }
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result.user);
    } catch (error) {
      apiLogger.error('[Portal Admin] Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

/**
 * POST /api/portal-admin/users/:id/reset-password
 * Reset user password and return temporary password
 */
router.post(
  '/users/:id/reset-password',
  requirePortalAuth(),
  requirePortalRole('admin'),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;

      const result = await portalAdminService.resetUserPassword(
        id,
        { id: req.portalUser!.id, email: req.portalUser!.email },
        {
          ipAddress: req.auditContext?.ipAddress,
          userAgent: req.auditContext?.userAgent,
        }
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        message: 'Password has been reset',
        tempPassword: result.tempPassword,
      });
    } catch (error) {
      apiLogger.error('[Portal Admin] Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// =============================================================================
// Audit Log Routes
// =============================================================================

/**
 * GET /api/portal-admin/audit-logs
 * Get audit logs with filters
 */
router.get(
  '/audit-logs',
  requirePortalAuth(),
  requirePortalRole('admin'),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const {
        page,
        limit,
        actorId,
        targetUserId,
        action,
        dateFrom,
        dateTo,
      } = req.query;

      const result = await portalAdminService.getAuditLogs({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        actorId: actorId as string,
        targetUserId: targetUserId as string,
        action: action as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });

      res.json(result);
    } catch (error) {
      apiLogger.error('[Portal Admin] Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to get audit logs' });
    }
  }
);

// =============================================================================
// Admin Session Routes
// =============================================================================

/**
 * GET /api/portal-admin/me
 * Get current admin user info
 */
router.get(
  '/me',
  requirePortalAuth(),
  requirePortalRole('admin'),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      res.json({
        user: req.portalUser,
        isAdmin: req.portalUser?.portalRole === 'admin',
      });
    } catch (error) {
      apiLogger.error('[Portal Admin] Get me error:', error);
      res.status(500).json({ error: 'Failed to get admin info' });
    }
  }
);

/**
 * POST /api/portal-admin/seed
 * Seed initial admin user (only works if no admin exists)
 *
 * SECURITY: This endpoint is disabled by default.
 * Enable only in development with PORTAL_ALLOW_SEED_ENDPOINT=true
 */
router.post('/seed', async (req, res: Response) => {
  // Security check: Only allow in development with explicit flag
  const isAllowed =
    process.env.PORTAL_ALLOW_SEED_ENDPOINT === 'true' &&
    process.env.NODE_ENV !== 'production';

  if (!isAllowed) {
    apiLogger.warn('[Portal Admin] Seed endpoint access denied - disabled in this environment');
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Seed endpoint is disabled. Set PORTAL_ALLOW_SEED_ENDPOINT=true in development.',
      },
    });
  }

  try {
    const result = await portalAdminService.seedAdminUser();

    // Never return raw password in response - just indicate success
    if (result.message?.includes('password:')) {
      apiLogger.info(`[Portal Admin] Admin user seeded: ${result.email}`);
      return res.json({
        success: result.success,
        message: 'Admin user created. Check server logs for initial password.',
        email: result.email,
      });
    }

    res.json(result);
  } catch (error) {
    apiLogger.error('[Portal Admin] Seed admin error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEED_ERROR',
        message: 'Failed to seed admin user',
      },
    });
  }
});

export default router;
