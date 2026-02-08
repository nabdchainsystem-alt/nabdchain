// =============================================================================
// Portal Admin Service (Frontend)
// Handles API calls for portal admin user management
// Uses JWT Bearer token authentication (no legacy x-user-id header)
// =============================================================================

import { portalApiClient } from './portalApiClient';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface PortalUser {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  companyName: string | null;
  portalRole: 'buyer' | 'seller' | 'admin' | 'staff' | null;
  portalStatus: 'active' | 'suspended';
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
  lastActiveAt: string | null;
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

export interface UserListParams {
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

export interface UserListResponse {
  users: PortalUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateUserData {
  name?: string;
  phoneNumber?: string;
  portalRole?: 'buyer' | 'seller' | 'admin' | 'staff';
  portalStatus?: 'active' | 'suspended';
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetUserId: string;
  targetUserEmail: string;
  previousValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// -----------------------------------------------------------------------------
// API Functions
// -----------------------------------------------------------------------------

export const portalAdminService = {
  /**
   * Check if current user is an admin
   */
  async checkAdminStatus(): Promise<{ isAdmin: boolean; user?: { id: string; email: string; portalRole: string } }> {
    try {
      return await portalApiClient.get<{ isAdmin: boolean; user?: { id: string; email: string; portalRole: string } }>(
        '/api/portal-admin/me',
      );
    } catch {
      return { isAdmin: false };
    }
  },

  /**
   * List all portal users
   */
  async listUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.role) searchParams.set('role', params.role);
    if (params.status) searchParams.set('status', params.status);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    return portalApiClient.get<UserListResponse>(`/api/portal-admin/users?${searchParams.toString()}`);
  },

  /**
   * Get single user details
   */
  async getUser(userId: string): Promise<PortalUser> {
    return portalApiClient.get<PortalUser>(`/api/portal-admin/users/${userId}`);
  },

  /**
   * Update user details
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<PortalUser> {
    return portalApiClient.patch<PortalUser>(`/api/portal-admin/users/${userId}`, data);
  },

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string): Promise<{ success: boolean; tempPassword: string }> {
    return portalApiClient.post<{ success: boolean; tempPassword: string }>(
      `/api/portal-admin/users/${userId}/reset-password`,
    );
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(
    params: {
      page?: number;
      limit?: number;
      actorId?: string;
      targetUserId?: string;
      action?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ): Promise<AuditLogsResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.actorId) searchParams.set('actorId', params.actorId);
    if (params.targetUserId) searchParams.set('targetUserId', params.targetUserId);
    if (params.action) searchParams.set('action', params.action);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);

    return portalApiClient.get<AuditLogsResponse>(`/api/portal-admin/audit-logs?${searchParams.toString()}`);
  },

  /**
   * Seed admin user (for initial setup - no auth required)
   */
  async seedAdminUser(): Promise<{ success: boolean; message: string; email?: string }> {
    return portalApiClient.post<{ success: boolean; message: string; email?: string }>(
      '/api/portal-admin/seed',
      undefined,
      { noAuth: true },
    );
  },
};

export default portalAdminService;
