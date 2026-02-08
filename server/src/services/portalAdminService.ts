// =============================================================================
// Portal Admin Service
// =============================================================================
// Handles all portal admin operations: user management, role changes, auditing.
// =============================================================================

import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export interface PortalUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PortalUserListResult {
  users: PortalUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PortalUserItem {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  companyName: string | null;
  portalRole: string | null;
  portalStatus: string;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: Date;
  lastActiveAt: Date | null;
  buyerProfile?: {
    id: string;
    fullName: string;
    companyName: string;
    status: string;
  } | null;
  sellerProfile?: {
    id: string;
    displayName: string;
    slug: string;
    status: string;
  } | null;
}

export interface UpdateUserData {
  name?: string;
  phoneNumber?: string;
  portalRole?: 'buyer' | 'seller' | 'admin' | 'staff';
  portalStatus?: 'active' | 'suspended';
}

export interface AuditLogEntry {
  actorId: string;
  actorEmail: string;
  action: string;
  targetUserId: string;
  targetUserEmail: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// =============================================================================
// Service Functions
// =============================================================================

export const portalAdminService = {
  // ---------------------------------------------------------------------------
  // List Portal Users
  // ---------------------------------------------------------------------------
  async listUsers(params: PortalUserListParams): Promise<PortalUserListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      // Only get users with portal roles (buyer, seller, admin, staff)
      portalRole: { not: null },
    };

    // Search filter (email, name, phone, company)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      where.portalRole = role;
    }

    // Status filter
    if (status && status !== 'all') {
      where.portalStatus = status;
    }

    // Date range filter
    if (dateFrom) {
      where.createdAt = { ...((where.createdAt as object) || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.createdAt = { ...((where.createdAt as object) || {}), lte: new Date(dateTo) };
    }

    // Build orderBy
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          phoneNumber: true,
          companyName: true,
          portalRole: true,
          portalStatus: true,
          emailVerified: true,
          passwordHash: true,
          createdAt: true,
          lastActiveAt: true,
          buyerProfile: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              status: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get seller profiles separately (since it's not directly related)
    const userIds = users.map(u => u.id);
    const sellerProfiles = await prisma.sellerProfile.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        id: true,
        displayName: true,
        slug: true,
        status: true,
      },
    });

    const sellerProfileMap = new Map(sellerProfiles.map(p => [p.userId, p]));

    // Transform users (hide passwordHash, add hasPassword)
    const transformedUsers: PortalUserItem[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      portalRole: user.portalRole,
      portalStatus: user.portalStatus,
      emailVerified: user.emailVerified,
      hasPassword: !!user.passwordHash,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      buyerProfile: user.buyerProfile,
      sellerProfile: sellerProfileMap.get(user.id) || null,
    }));

    return {
      users: transformedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ---------------------------------------------------------------------------
  // Get Single User
  // ---------------------------------------------------------------------------
  async getUser(userId: string): Promise<PortalUserItem | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        companyName: true,
        portalRole: true,
        portalStatus: true,
        emailVerified: true,
        passwordHash: true,
        createdAt: true,
        lastActiveAt: true,
        buyerProfile: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            status: true,
          },
        },
      },
    });

    if (!user || !user.portalRole) {
      return null;
    }

    // Get seller profile if exists
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        displayName: true,
        slug: true,
        status: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      portalRole: user.portalRole,
      portalStatus: user.portalStatus,
      emailVerified: user.emailVerified,
      hasPassword: !!user.passwordHash,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      buyerProfile: user.buyerProfile,
      sellerProfile: sellerProfile || null,
    };
  },

  // ---------------------------------------------------------------------------
  // Update User
  // ---------------------------------------------------------------------------
  async updateUser(
    userId: string,
    data: UpdateUserData,
    actor: { id: string; email: string },
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ success: boolean; user?: PortalUserItem; error?: string }> {
    // Get current user state for audit
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        portalRole: true,
        portalStatus: true,
      },
    });

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Prevent admin from demoting themselves
    if (userId === actor.id && data.portalRole && data.portalRole !== 'admin') {
      return { success: false, error: 'Cannot change your own admin role' };
    }

    // Prevent admin from suspending themselves
    if (userId === actor.id && data.portalStatus === 'suspended') {
      return { success: false, error: 'Cannot suspend your own account' };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.portalRole !== undefined) updateData.portalRole = data.portalRole;
    if (data.portalStatus !== undefined) updateData.portalStatus = data.portalStatus;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        companyName: true,
        portalRole: true,
        portalStatus: true,
        emailVerified: true,
        passwordHash: true,
        createdAt: true,
        lastActiveAt: true,
        buyerProfile: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            status: true,
          },
        },
      },
    });

    // Determine action type for audit
    let action = 'user_update';
    if (data.portalRole && data.portalRole !== currentUser.portalRole) {
      action = 'role_change';
    } else if (data.portalStatus && data.portalStatus !== currentUser.portalStatus) {
      action = 'status_change';
    }

    // Log audit entry
    await this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      targetUserId: userId,
      targetUserEmail: currentUser.email,
      previousValue: {
        name: currentUser.name,
        phoneNumber: currentUser.phoneNumber,
        portalRole: currentUser.portalRole,
        portalStatus: currentUser.portalStatus,
      },
      newValue: {
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber,
        portalRole: updatedUser.portalRole,
        portalStatus: updatedUser.portalStatus,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    apiLogger.info(`[Portal Admin] User ${userId} updated by ${actor.id} - action: ${action}`);

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        displayName: true,
        slug: true,
        status: true,
      },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber,
        companyName: updatedUser.companyName,
        portalRole: updatedUser.portalRole,
        portalStatus: updatedUser.portalStatus,
        emailVerified: updatedUser.emailVerified,
        hasPassword: !!updatedUser.passwordHash,
        createdAt: updatedUser.createdAt,
        lastActiveAt: updatedUser.lastActiveAt,
        buyerProfile: updatedUser.buyerProfile,
        sellerProfile: sellerProfile || null,
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Reset User Password
  // ---------------------------------------------------------------------------
  async resetUserPassword(
    userId: string,
    actor: { id: string; email: string },
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, portalRole: true },
    });

    if (!user || !user.portalRole) {
      return { success: false, error: 'User not found' };
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(tempPassword, salt, 1000, 64, 'sha512').toString('hex');
    const passwordHash = `${salt}:${hash}`;

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Log audit entry
    await this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'password_reset',
      targetUserId: userId,
      targetUserEmail: user.email,
      previousValue: { hasPassword: true },
      newValue: { hasPassword: true, passwordReset: true },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    apiLogger.info(`[Portal Admin] Password reset for user ${userId} by ${actor.id}`);

    return { success: true, tempPassword };
  },

  // ---------------------------------------------------------------------------
  // Get Audit Logs
  // ---------------------------------------------------------------------------
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    actorId?: string;
    targetUserId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const {
      page = 1,
      limit = 50,
      actorId,
      targetUserId,
      action,
      dateFrom,
      dateTo,
    } = params;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (actorId) where.actorId = actorId;
    if (targetUserId) where.targetUserId = targetUserId;
    if (action) where.action = action;
    if (dateFrom) where.createdAt = { ...((where.createdAt as object) || {}), gte: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...((where.createdAt as object) || {}), lte: new Date(dateTo) };

    const [logs, total] = await Promise.all([
      prisma.portalAdminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.portalAdminAuditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ---------------------------------------------------------------------------
  // Log Audit Entry
  // ---------------------------------------------------------------------------
  async logAudit(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.portalAdminAuditLog.create({
        data: {
          actorId: entry.actorId,
          actorEmail: entry.actorEmail,
          action: entry.action,
          targetUserId: entry.targetUserId,
          targetUserEmail: entry.targetUserEmail,
          previousValue: entry.previousValue ? JSON.stringify(entry.previousValue) : null,
          newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      apiLogger.error('Failed to create audit log:', error);
    }
  },

  // ---------------------------------------------------------------------------
  // Seed Admin User
  // ---------------------------------------------------------------------------
  async seedAdminUser(): Promise<{ success: boolean; message: string; email?: string }> {
    // First, check if master@nabdchain.com exists with a portal role
    const masterUser = await prisma.user.findUnique({
      where: { email: 'master@nabdchain.com' },
    });

    if (masterUser && masterUser.passwordHash) {
      // Master user exists with password (portal user) - grant admin
      if (masterUser.portalRole === 'admin') {
        return { success: true, message: 'Admin user already exists', email: 'master@nabdchain.com' };
      }

      await prisma.user.update({
        where: { email: 'master@nabdchain.com' },
        data: { portalRole: 'admin', portalStatus: 'active' },
      });

      return { success: true, message: 'Granted admin role to master@nabdchain.com', email: 'master@nabdchain.com' };
    }

    // Check if portal-admin@nabdchain.com exists
    const portalAdmin = await prisma.user.findUnique({
      where: { email: 'portal-admin@nabdchain.com' },
    });

    if (portalAdmin) {
      if (portalAdmin.portalRole === 'admin') {
        return { success: true, message: 'Admin user already exists', email: 'portal-admin@nabdchain.com' };
      }

      await prisma.user.update({
        where: { email: 'portal-admin@nabdchain.com' },
        data: { portalRole: 'admin', portalStatus: 'active' },
      });

      return { success: true, message: 'Granted admin role to portal-admin@nabdchain.com', email: 'portal-admin@nabdchain.com' };
    }

    // Create new portal admin user
    const userId = `usr_${crypto.randomUUID().replace(/-/g, '')}`;
    const tempPassword = 'PortalAdmin123!'; // Initial password - should be changed
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(tempPassword, salt, 1000, 64, 'sha512').toString('hex');
    const passwordHash = `${salt}:${hash}`;

    await prisma.user.create({
      data: {
        id: userId,
        email: 'portal-admin@nabdchain.com',
        name: 'Portal Administrator',
        portalRole: 'admin',
        portalStatus: 'active',
        emailVerified: true,
        passwordHash,
      },
    });

    return {
      success: true,
      message: 'Created portal-admin@nabdchain.com with password: PortalAdmin123!',
      email: 'portal-admin@nabdchain.com',
    };
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%&*';
  let password = '';

  // Generate 8 random chars
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Add a special character
  password += specials.charAt(Math.floor(Math.random() * specials.length));

  // Add a number
  password += Math.floor(Math.random() * 10).toString();

  return password;
}

export default portalAdminService;
