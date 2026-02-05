// =============================================================================
// Permission Context - RBAC State Management
// =============================================================================
// Provides permission state and checking utilities for the frontend.
// Fetches user permissions from the API and caches them.
// =============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/auth-adapter';

// =============================================================================
// Types
// =============================================================================

interface PermissionContextType {
  /** List of role codes assigned to the user */
  roles: string[];
  /** List of permission codes the user has */
  permissions: string[];
  /** Whether permissions are still loading */
  isLoading: boolean;
  /** Any error that occurred while fetching permissions */
  error: string | null;
  /** Check if user has a specific permission */
  hasPermission: (permission: string) => boolean;
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: string[]) => boolean;
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
  /** Refresh permissions from API */
  refresh: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// =============================================================================
// Permission Provider
// =============================================================================

interface PermissionProviderProps {
  children: React.ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, userId, isSignedIn } = useAuth();

  const fetchPermissions = useCallback(async () => {
    if (!userId || !isSignedIn) {
      setRoles([]);
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch('/api/portal/permissions/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch permissions: ${response.status}`);
      }

      const data = await response.json();
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set defaults based on localStorage portal type as fallback
      const portalType = localStorage.getItem('portal_type');
      if (portalType) {
        setRoles([portalType]);
        // Set minimal default permissions based on portal type
        if (portalType === 'buyer') {
          setPermissions([
            'orders:view_own',
            'orders:create',
            'rfqs:view_own',
            'rfqs:create',
            'invoices:view_own',
            'items:view_public',
            'analytics:view_own',
          ]);
        } else if (portalType === 'seller') {
          setPermissions([
            'orders:view_own',
            'orders:update_status',
            'rfqs:view_own',
            'rfqs:respond',
            'invoices:view_own',
            'invoices:create',
            'items:view_own',
            'items:create',
            'items:update',
            'payouts:view_own',
            'analytics:view_own',
          ]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, getToken]);

  // Fetch permissions when user changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Memoized permission check functions
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: string[]): boolean => {
      return perms.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: string[]): boolean => {
      return perms.every((p) => permissions.includes(p));
    },
    [permissions]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      return roles.includes(role);
    },
    [roles]
  );

  const value = useMemo(
    () => ({
      roles,
      permissions,
      isLoading,
      error,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      refresh: fetchPermissions,
    }),
    [roles, permissions, isLoading, error, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, fetchPermissions]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

// =============================================================================
// Permission Constants (for type safety)
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

export default PermissionContext;
