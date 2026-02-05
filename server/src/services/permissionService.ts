// =============================================================================
// Permission Service - RBAC Resolution Logic
// =============================================================================
// Enterprise-grade Role-Based Access Control (RBAC) for the marketplace portal.
// Manages permission resolution, role assignment, and row-level access filtering.
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  roleUsed?: string;
}

export interface UserPermissions {
  userId: string;
  roles: string[];
  permissions: string[];
  effectivePermissions: Set<string>;
}

export interface RowLevelFilter {
  where: Record<string, unknown>;
  canViewAll: boolean;
}

// Cache for user permissions (TTL: 5 minutes)
const permissionCache = new Map<string, { data: UserPermissions; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// Permission Service
// =============================================================================

export const permissionService = {
  /**
   * Get all effective permissions for a user
   * Merges permissions from all assigned roles
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    // Check cache first
    const cached = permissionCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Get all active roles for the user
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Collect roles and permissions
    const roles: string[] = [];
    const permissionSet = new Set<string>();

    for (const userRole of userRoles) {
      roles.push(userRole.role.code);
      for (const rp of userRole.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    // If user has no roles, check their portalRole and auto-assign
    if (roles.length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { portalRole: true },
      });

      if (user?.portalRole) {
        // Get default permissions for the portal role
        const defaultRole = await prisma.role.findUnique({
          where: { code: user.portalRole },
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        });

        if (defaultRole) {
          roles.push(defaultRole.code);
          for (const rp of defaultRole.rolePermissions) {
            permissionSet.add(rp.permission.code);
          }
        }
      }
    }

    const result: UserPermissions = {
      userId,
      roles,
      permissions: Array.from(permissionSet),
      effectivePermissions: permissionSet,
    };

    // Cache the result
    permissionCache.set(userId, {
      data: result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return result;
  },

  /**
   * Clear cached permissions for a user
   * Call this when roles are assigned/revoked
   */
  clearCache(userId: string): void {
    permissionCache.delete(userId);
  },

  /**
   * Clear all cached permissions
   */
  clearAllCache(): void {
    permissionCache.clear();
  },

  /**
   * Check if user has specific permission
   */
  async checkPermission(
    userId: string,
    permission: string
  ): Promise<PermissionCheckResult> {
    const userPerms = await this.getUserPermissions(userId);

    if (userPerms.effectivePermissions.has(permission)) {
      return {
        allowed: true,
        roleUsed: userPerms.roles[0], // Primary role
      };
    }

    return {
      allowed: false,
      reason: `Missing permission: ${permission}`,
    };
  },

  /**
   * Check multiple permissions at once (OR logic)
   * Returns true if user has ANY of the specified permissions
   */
  async checkAnyPermission(
    userId: string,
    permissions: string[]
  ): Promise<PermissionCheckResult> {
    const userPerms = await this.getUserPermissions(userId);

    for (const permission of permissions) {
      if (userPerms.effectivePermissions.has(permission)) {
        return {
          allowed: true,
          roleUsed: userPerms.roles[0],
        };
      }
    }

    return {
      allowed: false,
      reason: `Missing permissions: ${permissions.join(' or ')}`,
    };
  },

  /**
   * Check all permissions required (AND logic)
   * Returns true only if user has ALL specified permissions
   */
  async checkAllPermissions(
    userId: string,
    permissions: string[]
  ): Promise<PermissionCheckResult> {
    const userPerms = await this.getUserPermissions(userId);

    const missing: string[] = [];
    for (const permission of permissions) {
      if (!userPerms.effectivePermissions.has(permission)) {
        missing.push(permission);
      }
    }

    if (missing.length === 0) {
      return {
        allowed: true,
        roleUsed: userPerms.roles[0],
      };
    }

    return {
      allowed: false,
      reason: `Missing permissions: ${missing.join(', ')}`,
    };
  },

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleCode: string,
    assignedBy: string,
    options?: { expiresAt?: Date }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the role
      const role = await prisma.role.findUnique({
        where: { code: roleCode },
      });

      if (!role) {
        return { success: false, error: `Role not found: ${roleCode}` };
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Create or update the user role assignment
      await prisma.userRole.upsert({
        where: {
          userId_roleId: { userId, roleId: role.id },
        },
        create: {
          userId,
          roleId: role.id,
          assignedBy,
          expiresAt: options?.expiresAt,
          isActive: true,
        },
        update: {
          assignedBy,
          assignedAt: new Date(),
          expiresAt: options?.expiresAt,
          isActive: true,
        },
      });

      // Clear cache for this user
      this.clearCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Error assigning role:', error);
      return { success: false, error: 'Failed to assign role' };
    }
  },

  /**
   * Revoke role from user
   */
  async revokeRole(
    userId: string,
    roleCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the role
      const role = await prisma.role.findUnique({
        where: { code: roleCode },
      });

      if (!role) {
        return { success: false, error: `Role not found: ${roleCode}` };
      }

      // Deactivate the user role (soft delete)
      await prisma.userRole.updateMany({
        where: {
          userId,
          roleId: role.id,
        },
        data: {
          isActive: false,
        },
      });

      // Clear cache for this user
      this.clearCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Error revoking role:', error);
      return { success: false, error: 'Failed to revoke role' };
    }
  },

  /**
   * Get row-level access filter for a resource
   * Returns Prisma where clause for data filtering based on permissions
   */
  async getRowLevelFilter(
    userId: string,
    resource: string,
    userPortalRole?: 'buyer' | 'seller'
  ): Promise<RowLevelFilter> {
    const userPerms = await this.getUserPermissions(userId);

    // Check if user can view all records
    const viewAllPermission = `${resource}:view_all`;
    if (userPerms.effectivePermissions.has(viewAllPermission)) {
      return {
        where: {},
        canViewAll: true,
      };
    }

    // Check if user can view team records (Approver role)
    const viewTeamPermission = `${resource}:view_team`;
    if (userPerms.effectivePermissions.has(viewTeamPermission)) {
      // For now, team = own records (can be extended for organization-based filtering)
      return {
        where: { buyerId: userId },
        canViewAll: false,
      };
    }

    // Check if user can view own records
    const viewOwnPermission = `${resource}:view_own`;
    if (userPerms.effectivePermissions.has(viewOwnPermission)) {
      // Determine if user is buyer or seller
      const portalRole = userPortalRole || await this.getUserPortalRole(userId);

      if (portalRole === 'seller') {
        return {
          where: { sellerId: userId },
          canViewAll: false,
        };
      } else {
        return {
          where: { buyerId: userId },
          canViewAll: false,
        };
      }
    }

    // No access - return impossible filter
    return {
      where: { id: 'NO_ACCESS' },
      canViewAll: false,
    };
  },

  /**
   * Get user's portal role from database
   */
  async getUserPortalRole(userId: string): Promise<'buyer' | 'seller' | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { portalRole: true },
    });

    if (user?.portalRole === 'buyer' || user?.portalRole === 'seller') {
      return user.portalRole;
    }

    return null;
  },

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Array<{ code: string; name: string; description: string | null }>> {
    const roles = await prisma.role.findMany({
      select: {
        code: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    return roles;
  },

  /**
   * Get all permissions grouped by resource
   */
  async getAllPermissions(): Promise<Record<string, Array<{ code: string; name: string; action: string }>>> {
    const permissions = await prisma.permission.findMany({
      select: {
        code: true,
        name: true,
        resource: true,
        action: true,
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group by resource
    const grouped: Record<string, Array<{ code: string; name: string; action: string }>> = {};
    for (const perm of permissions) {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push({
        code: perm.code,
        name: perm.name,
        action: perm.action,
      });
    }

    return grouped;
  },

  /**
   * Get user's roles with details
   */
  async getUserRoles(userId: string): Promise<Array<{
    roleCode: string;
    roleName: string;
    assignedAt: Date;
    assignedBy: string | null;
    expiresAt: Date | null;
    isActive: boolean;
  }>> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return userRoles.map(ur => ({
      roleCode: ur.role.code,
      roleName: ur.role.name,
      assignedAt: ur.assignedAt,
      assignedBy: ur.assignedBy,
      expiresAt: ur.expiresAt,
      isActive: ur.isActive,
    }));
  },
};

export default permissionService;
