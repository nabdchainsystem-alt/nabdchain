// =============================================================================
// Permission Hooks - RBAC Utilities
// =============================================================================
// Hooks for checking permissions and conditionally rendering UI elements.
// =============================================================================

import React from 'react';
import { usePermissions, PERMISSIONS, ROLES } from '../context/PermissionContext';

// =============================================================================
// Single Permission Check
// =============================================================================

/**
 * Check if current user has a specific permission
 *
 * @example
 * const canApprove = usePermission('orders:approve');
 * // or with constant
 * const canApprove = usePermission(PERMISSIONS.ORDERS_APPROVE);
 */
export function usePermission(permission: string): boolean {
  const { hasPermission, isLoading } = usePermissions();
  return !isLoading && hasPermission(permission);
}

// =============================================================================
// Multiple Permission Checks
// =============================================================================

/**
 * Check if user has any of the specified permissions (OR logic)
 *
 * @example
 * const canViewOrders = useAnyPermission(['orders:view_own', 'orders:view_all']);
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission, isLoading } = usePermissions();
  return !isLoading && hasAnyPermission(permissions);
}

/**
 * Check if user has all of the specified permissions (AND logic)
 *
 * @example
 * const canManagePayouts = useAllPermissions(['payouts:view_all', 'payouts:approve']);
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { hasAllPermissions, isLoading } = usePermissions();
  return !isLoading && hasAllPermissions(permissions);
}

// =============================================================================
// Role Check
// =============================================================================

/**
 * Check if current user has a specific role
 *
 * @example
 * const isApprover = useRole('approver');
 * // or with constant
 * const isApprover = useRole(ROLES.APPROVER);
 */
export function useRole(role: string): boolean {
  const { hasRole, isLoading } = usePermissions();
  return !isLoading && hasRole(role);
}

// =============================================================================
// Permission Gate Component
// =============================================================================

interface PermissionGateProps {
  /** Permission code or array of permission codes (OR logic for arrays) */
  permission: string | string[];
  /** Content to show when user has permission */
  children: React.ReactNode;
  /** Optional fallback content when user doesn't have permission */
  fallback?: React.ReactNode;
  /** If true, require ALL permissions instead of ANY (for arrays) */
  requireAll?: boolean;
}

/**
 * Conditionally render children based on permission
 *
 * @example
 * // Single permission
 * <PermissionGate permission="orders:approve">
 *   <ApproveButton />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (OR)
 * <PermissionGate permission={['invoices:view_own', 'invoices:view_all']}>
 *   <InvoiceList />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (AND)
 * <PermissionGate permission={['payouts:view_all', 'payouts:approve']} requireAll>
 *   <PayoutApprovalPanel />
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate permission="analytics:export" fallback={<UpgradePrompt />}>
 *   <ExportButton />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGateProps): React.ReactElement | null {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  // While loading, don't show anything (or could show skeleton)
  if (isLoading) {
    return null;
  }

  let hasAccess: boolean;

  if (Array.isArray(permission)) {
    hasAccess = requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission);
  } else {
    hasAccess = hasPermission(permission);
  }

  if (hasAccess) {
    return React.createElement(React.Fragment, null, children);
  }

  return fallback ? React.createElement(React.Fragment, null, fallback) : null;
}

// =============================================================================
// Role Gate Component
// =============================================================================

interface RoleGateProps {
  /** Role code or array of role codes (OR logic for arrays) */
  role: string | string[];
  /** Content to show when user has role */
  children: React.ReactNode;
  /** Optional fallback content when user doesn't have role */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render children based on role
 *
 * @example
 * <RoleGate role="finance">
 *   <FinanceDashboard />
 * </RoleGate>
 *
 * @example
 * <RoleGate role={['approver', 'finance']}>
 *   <ApprovalWorkflow />
 * </RoleGate>
 */
export function RoleGate({ role, children, fallback = null }: RoleGateProps): React.ReactElement | null {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hasRole, isLoading, roles } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasAccess = Array.isArray(role) ? role.some((r) => hasRole(r)) : hasRole(role);

  if (hasAccess) {
    return React.createElement(React.Fragment, null, children);
  }

  return fallback ? React.createElement(React.Fragment, null, fallback) : null;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get permission check function for use outside React components
 * Returns a function that can be called with permission codes
 *
 * @example
 * const checkPermission = usePermissionChecker();
 * const canApprove = checkPermission('orders:approve');
 */
export function usePermissionChecker(): (permission: string) => boolean {
  const { hasPermission, isLoading } = usePermissions();
  return (permission: string) => !isLoading && hasPermission(permission);
}

/**
 * Get all user permissions and roles for debugging or logging
 */
export function usePermissionDebug(): {
  roles: string[];
  permissions: string[];
  isLoading: boolean;
  error: string | null;
} {
  const { roles, permissions, isLoading, error } = usePermissions();
  return { roles, permissions, isLoading, error };
}

// Re-export constants for convenience
export { PERMISSIONS, ROLES };
