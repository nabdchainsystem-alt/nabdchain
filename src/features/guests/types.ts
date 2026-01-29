// =============================================================================
// GUESTS FEATURE - TYPES
// Status: NOT IMPLEMENTED - Placeholder types for future development
// =============================================================================

export interface Guest {
  id: string;
  workspaceId: string;
  email: string;
  name?: string;
  avatar?: string;
  status: GuestStatus;
  accessLevel: GuestAccessLevel;
  permissions: GuestPermissions;
  invitedBy: string;
  invitedAt: Date;
  lastActiveAt?: Date;
  expiresAt?: Date;
}

export type GuestStatus = 'pending' | 'active' | 'expired' | 'revoked';

export type GuestAccessLevel = 'view' | 'comment' | 'edit';

export interface GuestPermissions {
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  canExport: boolean;
  canInviteOthers: boolean;
  accessibleBoards: string[]; // Board IDs guest can access
  accessibleFolders: string[]; // Folder IDs guest can access
}

export interface GuestInvite {
  id: string;
  workspaceId: string;
  email: string;
  accessLevel: GuestAccessLevel;
  message?: string;
  boards: string[];
  folders: string[];
  expiresAt?: Date;
  inviteCode: string;
  createdBy: string;
  createdAt: Date;
  usedAt?: Date;
}

export interface GuestActivity {
  id: string;
  guestId: string;
  action: GuestAction;
  resourceType: 'board' | 'task' | 'document' | 'comment';
  resourceId: string;
  details?: string;
  timestamp: Date;
}

export type GuestAction =
  | 'viewed'
  | 'commented'
  | 'edited'
  | 'downloaded'
  | 'shared';

export interface GuestSettings {
  allowGuestAccess: boolean;
  defaultAccessLevel: GuestAccessLevel;
  defaultExpiration: number | null; // days, null = no expiration
  requireApproval: boolean;
  notifyOnActivity: boolean;
  allowGuestExport: boolean;
}

export interface ShareLink {
  id: string;
  workspaceId: string;
  resourceType: 'board' | 'folder' | 'document';
  resourceId: string;
  accessLevel: GuestAccessLevel;
  password?: string;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  url: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}
