// =============================================================================
// PERMISSIONS FEATURE - TYPES
// Status: NOT IMPLEMENTED - Placeholder types for future development
// =============================================================================

export interface Role {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isDefault: boolean;
  isSystem: boolean; // System roles like Admin, Member, Guest
  color?: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[];
}

export type PermissionResource =
  | 'workspace'
  | 'board'
  | 'folder'
  | 'task'
  | 'document'
  | 'member'
  | 'guest'
  | 'integration'
  | 'automation'
  | 'report'
  | 'template'
  | 'billing'
  | 'settings';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'share'
  | 'export'
  | 'manage'
  | 'admin';

export interface MemberRole {
  userId: string;
  roleId: string;
  workspaceId: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface ColumnRestriction {
  id: string;
  boardId: string;
  columnId: string;
  restrictionType: 'view' | 'edit';
  allowedRoles: string[];
  allowedUsers: string[];
}

export interface RowRestriction {
  id: string;
  boardId: string;
  rowId: string;
  restrictionType: 'view' | 'edit';
  allowedRoles: string[];
  allowedUsers: string[];
}

export interface BoardPermission {
  boardId: string;
  userId?: string;
  roleId?: string;
  level: 'owner' | 'editor' | 'commenter' | 'viewer';
}

export interface PermissionAuditLog {
  id: string;
  workspaceId: string;
  action: 'granted' | 'revoked' | 'modified';
  targetType: 'user' | 'role' | 'board' | 'column';
  targetId: string;
  performedBy: string;
  details: string;
  timestamp: Date;
}

export interface PermissionSettings {
  defaultRole: string;
  allowPublicBoards: boolean;
  allowGuestInvites: boolean;
  requireApprovalForNewMembers: boolean;
  restrictedColumns: boolean;
  auditLogRetention: number; // days
}

// Predefined system roles
export const SystemRoles = {
  ADMIN: 'admin',
  MEMBER: 'member',
  GUEST: 'guest',
} as const;
