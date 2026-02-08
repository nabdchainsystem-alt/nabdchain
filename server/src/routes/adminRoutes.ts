import express, { Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Default feature flags - all pages that can be toggled
const DEFAULT_FEATURE_FLAGS = [
    // Core
    { key: 'page_dashboard', enabled: true },
    { key: 'page_my_work', enabled: true },
    { key: 'page_inbox', enabled: true },
    { key: 'page_teams', enabled: true },
    { key: 'page_vault', enabled: true },
    { key: 'page_talk', enabled: true },
    // Tools
    { key: 'page_flow_hub', enabled: true },
    { key: 'page_process_map', enabled: true },
    { key: 'page_dashboards', enabled: true },
    { key: 'page_reports', enabled: true },
    { key: 'page_test_tools', enabled: true },
    // Mini Company
    { key: 'page_mini_company', enabled: true },
    { key: 'page_sales', enabled: true },
    { key: 'page_purchases', enabled: true },
    { key: 'page_inventory', enabled: true },
    { key: 'page_expenses', enabled: true },
    { key: 'page_customers', enabled: true },
    { key: 'page_suppliers', enabled: true },
    // Supply Chain
    { key: 'page_supply_chain', enabled: true },
    { key: 'page_procurement', enabled: true },
    { key: 'page_warehouse', enabled: true },
    { key: 'page_fleet', enabled: true },
    { key: 'page_vendors', enabled: true },
    { key: 'page_planning', enabled: true },
    // Manufacturing (uses 'operations' key for legacy Sidebar compatibility)
    { key: 'page_operations', enabled: true },
    { key: 'page_maintenance', enabled: true },
    { key: 'page_production', enabled: true },
    { key: 'page_quality', enabled: true },
    // Business
    { key: 'page_business', enabled: true },
    { key: 'page_sales_listing', enabled: true },
    { key: 'page_sales_factory', enabled: true },
    // Business Support
    { key: 'page_business_support', enabled: true },
    { key: 'page_it_support', enabled: true },
    { key: 'page_hr', enabled: true },
    { key: 'page_marketing', enabled: true },
];

// Middleware to check if user is admin
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        apiLogger.error('Admin check error:', error);
        res.status(500).json({ error: 'Failed to verify admin status' });
    }
};

// GET /features: Get all feature flags (public - all authenticated users)
router.get('/features', requireAuth, async (req, res: Response) => {
    try {
        // Get all existing flags from database
        const existingFlags = await prisma.featureFlag.findMany();
        const existingKeys = new Set(existingFlags.map(f => f.key));

        // Merge with defaults (for any missing flags)
        const allFlags = DEFAULT_FEATURE_FLAGS.map(defaultFlag => {
            const existing = existingFlags.find(f => f.key === defaultFlag.key);
            return existing || { ...defaultFlag, id: null, updatedAt: null, updatedBy: null };
        });

        res.json(allFlags);
    } catch (error) {
        apiLogger.error('Get Features Error:', error);
        res.status(500).json({ error: 'Failed to fetch features' });
    }
});

// PUT /features/:key: Toggle a feature flag (admin only)
router.put('/features/:key', requireAuth, requireAdmin, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const key = req.params.key as string;
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled must be a boolean' });
        }

        // Upsert the feature flag
        const flag = await prisma.featureFlag.upsert({
            where: { key },
            update: {
                enabled,
                updatedBy: userId
            },
            create: {
                key,
                enabled,
                updatedBy: userId
            }
        });

        apiLogger.info(`[Admin] Feature "${key}" set to ${enabled} by user ${userId}`);

        res.json(flag);
    } catch (error) {
        apiLogger.error('Toggle Feature Error:', error);
        res.status(500).json({ error: 'Failed to toggle feature' });
    }
});

// GET /users: List all users with roles (admin only)
router.get('/users', requireAuth, requireAdmin, async (req, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                role: true,
                createdAt: true,
                lastActiveAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error) {
        apiLogger.error('Get Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PUT /users/:id/role: Change user role (admin only)
router.put('/users/:id/role', requireAuth, requireAdmin, async (req, res: Response) => {
    try {
        const adminUserId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { role } = req.body;

        if (!['admin', 'member'].includes(role)) {
            return res.status(400).json({ error: 'role must be "admin" or "member"' });
        }

        // Prevent admin from removing their own admin role
        if (id === adminUserId && role !== 'admin') {
            return res.status(400).json({ error: 'Cannot remove your own admin role' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                role: true
            }
        });

        apiLogger.info(`[Admin] User ${id} role changed to "${role}" by admin ${adminUserId}`);

        res.json(user);
    } catch (error) {
        apiLogger.error('Update User Role Error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// GET /me: Get current user's admin status
router.get('/me', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true }
        });

        res.json({
            isAdmin: user?.role === 'admin',
            user
        });
    } catch (error) {
        apiLogger.error('Get Admin Status Error:', error);
        res.status(500).json({ error: 'Failed to get admin status' });
    }
});

// GET /me/visibility: Get current user's effective page visibility
router.get('/me/visibility', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        // Get global feature flags
        const globalFlags = await prisma.featureFlag.findMany();
        const visibility: Record<string, boolean> = {};

        // Start with defaults (all enabled)
        for (const flag of DEFAULT_FEATURE_FLAGS) {
            const global = globalFlags.find(f => f.key === flag.key);
            const key = flag.key.replace('page_', '');
            visibility[key] = global?.enabled ?? true;
        }

        // Apply user-specific overrides
        const userPerms = await prisma.userPagePermission.findMany({
            where: { userId }
        });

        for (const perm of userPerms) {
            const key = perm.pageKey.replace('page_', '');
            visibility[key] = perm.enabled;
        }

        res.json(visibility);
    } catch (error) {
        apiLogger.error('Get Visibility Error:', error);
        res.status(500).json({ error: 'Failed to get visibility' });
    }
});

// GET /users/:userId/permissions: Get a user's page permissions (admin only)
router.get('/users/:userId/permissions', requireAuth, requireAdmin, async (req, res: Response) => {
    try {
        const userId = req.params.userId as string;

        // Get global feature flags
        const globalFlags = await prisma.featureFlag.findMany();
        const globalMap = new Map(globalFlags.map(f => [f.key, f.enabled]));

        // Get user-specific permissions
        const userPerms = await prisma.userPagePermission.findMany({
            where: { userId }
        });
        const userMap = new Map(userPerms.map(p => [p.pageKey, p.enabled]));

        // Merge into response
        const permissions = DEFAULT_FEATURE_FLAGS.map(flag => ({
            pageKey: flag.key,
            enabled: userMap.has(flag.key) ? userMap.get(flag.key) : (globalMap.get(flag.key) ?? true),
            source: userMap.has(flag.key) ? 'user' : 'global',
            globalEnabled: globalMap.get(flag.key) ?? true
        }));

        res.json({ userId, permissions });
    } catch (error) {
        apiLogger.error('Get User Permissions Error:', error);
        res.status(500).json({ error: 'Failed to get user permissions' });
    }
});

// PUT /users/:userId/permissions: Update a user's page permissions (admin only)
router.put('/users/:userId/permissions', requireAuth, requireAdmin, async (req, res: Response) => {
    try {
        const adminUserId = (req as AuthRequest).auth.userId;
        const userId = req.params.userId as string;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: 'permissions must be an array' });
        }

        for (const perm of permissions) {
            const pageKey = perm.pageKey as string;
            if (perm.enabled === null) {
                // Delete - revert to global
                await prisma.userPagePermission.deleteMany({
                    where: { userId, pageKey }
                });
            } else {
                // Upsert
                await prisma.userPagePermission.upsert({
                    where: { userId_pageKey: { userId, pageKey } },
                    update: { enabled: perm.enabled, updatedBy: adminUserId },
                    create: { userId, pageKey, enabled: perm.enabled, updatedBy: adminUserId }
                });
            }
        }

        apiLogger.info(`[Admin] User ${userId} permissions updated by admin ${adminUserId}`);

        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Update User Permissions Error:', error);
        res.status(500).json({ error: 'Failed to update user permissions' });
    }
});

// DELETE /users/:userId/permissions: Reset user to global defaults (admin only)
router.delete('/users/:userId/permissions', requireAuth, requireAdmin, async (req, res: Response) => {
    try {
        const adminUserId = (req as AuthRequest).auth.userId;
        const userId = req.params.userId as string;

        await prisma.userPagePermission.deleteMany({
            where: { userId }
        });

        apiLogger.info(`[Admin] User ${userId} permissions reset to global by admin ${adminUserId}`);

        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Reset User Permissions Error:', error);
        res.status(500).json({ error: 'Failed to reset user permissions' });
    }
});

// POST /bootstrap: Bootstrap first admin (only works if no admins exist)
router.post('/bootstrap', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        // Check if any admin exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'admin' }
        });

        if (existingAdmin) {
            return res.status(403).json({ error: 'Admin already exists. Bootstrap not allowed.' });
        }

        // Promote current user to admin
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: 'admin' },
            select: { id: true, email: true, name: true, role: true }
        });

        apiLogger.info(`[Admin] Bootstrap: User ${userId} (${user.email}) promoted to admin`);

        res.json({ success: true, message: 'You are now an admin', user });
    } catch (error) {
        apiLogger.error('Bootstrap Error:', error);
        res.status(500).json({ error: 'Failed to bootstrap admin' });
    }
});

export default router;
