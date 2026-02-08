// =============================================================================
// Portal Admin Routes - Consolidated Admin API Surface
// =============================================================================
// This file aggregates portal admin endpoints under /api/portal/admin/*
// It calls existing services without refactoring internals.
// =============================================================================

import { Router, Response } from 'express';
import { apiLogger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import {
  requirePortalAuth,
  requirePortalRole,
} from '../../middleware/portalAdminMiddleware';

// Import existing routes for re-mounting (aliasing)
import portalAdminRoutes from '../portalAdminRoutes';

const router = Router();

// =============================================================================
// MOUNT EXISTING PORTAL ADMIN ROUTES
// =============================================================================
// The portalAdminRoutes already has all admin functionality:
// - /users - List users, get user, update user
// - /users/:id/reset-password - Reset user password
// - /audit-logs - Get audit logs
// - /me - Get current admin
// - /seed - Seed admin user
//
// We re-mount them here for the consolidated /api/portal/admin/* surface
// =============================================================================

router.use('/', portalAdminRoutes);

// =============================================================================
// ADDITIONAL ADMIN ENDPOINTS
// These provide dashboard/analytics that aren't in the existing routes
// =============================================================================

// Protect ALL additional endpoints with admin auth
router.use(requirePortalAuth(), requirePortalRole('admin'));

/**
 * GET /api/portal/admin/dashboard/stats
 * Get basic admin dashboard statistics
 * Uses direct Prisma queries since no service method exists
 */
router.get('/dashboard/stats', async (req, res: Response) => {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      totalOrders,
      pendingOrders,
    ] = await Promise.all([
      prisma.user.count({ where: { portalRole: { not: null } } }),
      prisma.user.count({ where: { portalRole: 'buyer' } }),
      prisma.user.count({ where: { portalRole: 'seller' } }),
      prisma.marketplaceOrder.count(),
      prisma.marketplaceOrder.count({ where: { status: 'pending_confirmation' } }),
    ]);

    res.json({
      totalUsers,
      totalBuyers,
      totalSellers,
      totalOrders,
      pendingOrders,
    });
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/portal/admin/dashboard/activity
 * Get recent activity from audit logs
 */
router.get('/dashboard/activity', async (req, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const logs = await prisma.portalAdminAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    res.json(logs);
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

/**
 * GET /api/portal/admin/orders
 * Get all marketplace orders (admin view)
 */
router.get('/orders', async (req, res: Response) => {
  try {
    const { status, sellerId, buyerId, page, limit, sortBy, sortOrder } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (sellerId) where.sellerId = sellerId;
    if (buyerId) where.buyerId = buyerId;

    const orderBy: Record<string, string> = {};
    if (sortBy) {
      orderBy[sortBy as string] = (sortOrder as string) || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [orders, total] = await Promise.all([
      prisma.marketplaceOrder.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.marketplaceOrder.count({ where }),
    ]);

    res.json({
      orders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/portal/admin/orders/:id
 * Get order details
 */
router.get('/orders/:id', async (req, res: Response) => {
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * GET /api/portal/admin/sellers
 * Get all sellers (users with portalRole='seller')
 */
router.get('/sellers', async (req, res: Response) => {
  try {
    const { status, search, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      portalRole: 'seller',
    };

    if (status) where.portalStatus = status;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { companyName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [sellers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          portalRole: true,
          portalStatus: true,
          createdAt: true,
          lastActiveAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      sellers,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

/**
 * GET /api/portal/admin/sellers/:id
 * Get seller details
 */
router.get('/sellers/:id', async (req, res: Response) => {
  try {
    const seller = await prisma.user.findFirst({
      where: { id: req.params.id, portalRole: 'seller' },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        companyName: true,
        portalRole: true,
        portalStatus: true,
        emailVerified: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Get seller profile if exists
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: req.params.id },
    });

    res.json({ ...seller, sellerProfile });
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching seller:', error);
    res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

/**
 * GET /api/portal/admin/buyers
 * Get all buyers (users with portalRole='buyer')
 */
router.get('/buyers', async (req, res: Response) => {
  try {
    const { status, search, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      portalRole: 'buyer',
    };

    if (status) where.portalStatus = status;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { companyName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [buyers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          portalRole: true,
          portalStatus: true,
          createdAt: true,
          lastActiveAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      buyers,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching buyers:', error);
    res.status(500).json({ error: 'Failed to fetch buyers' });
  }
});

/**
 * GET /api/portal/admin/buyers/:id
 * Get buyer details
 */
router.get('/buyers/:id', async (req, res: Response) => {
  try {
    const buyer = await prisma.user.findFirst({
      where: { id: req.params.id, portalRole: 'buyer' },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        companyName: true,
        portalRole: true,
        portalStatus: true,
        emailVerified: true,
        createdAt: true,
        lastActiveAt: true,
        buyerProfile: true,
      },
    });

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    res.json(buyer);
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching buyer:', error);
    res.status(500).json({ error: 'Failed to fetch buyer' });
  }
});

/**
 * GET /api/portal/admin/analytics/overview
 * Get analytics overview
 */
router.get('/analytics/overview', async (req, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      newUsersThisMonth,
      ordersThisMonth,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          portalRole: { not: null },
        },
      }),
      prisma.marketplaceOrder.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.marketplaceOrder.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalPrice: true },
      }),
    ]);

    res.json({
      period: '30d',
      newUsers: newUsersThisMonth,
      orders: ordersThisMonth,
      revenue: totalRevenue._sum.totalPrice || 0,
    });
  } catch (error) {
    apiLogger.error('[Portal/Admin] Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
