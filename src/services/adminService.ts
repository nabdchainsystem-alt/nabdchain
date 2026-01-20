import { API_URL } from '../config/api';

export interface FeatureFlag {
    id: string | null;
    key: string;
    enabled: boolean;
    updatedAt: string | null;
    updatedBy: string | null;
}

export interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
    lastActiveAt: string | null;
}

export interface AdminStatus {
    isAdmin: boolean;
    user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
    } | null;
}

export interface UserPagePermission {
    pageKey: string;
    enabled: boolean;
    source: 'user' | 'global';
    globalEnabled: boolean;
}

export interface UserPermissionsResponse {
    userId: string;
    permissions: UserPagePermission[];
}

export const adminService = {
    // Get current user's admin status
    async getAdminStatus(token: string): Promise<AdminStatus> {
        const response = await fetch(`${API_URL}/admin/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to get admin status');
        }

        return response.json();
    },

    // Get all feature flags
    async getFeatureFlags(token: string): Promise<FeatureFlag[]> {
        const response = await fetch(`${API_URL}/admin/features`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch feature flags');
        }

        return response.json();
    },

    // Toggle a feature flag (admin only)
    async toggleFeature(token: string, key: string, enabled: boolean): Promise<FeatureFlag> {
        const response = await fetch(`${API_URL}/admin/features/${key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ enabled })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to toggle feature');
        }

        return response.json();
    },

    // Get all users (admin only)
    async getUsers(token: string): Promise<AdminUser[]> {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        return response.json();
    },

    // Change user role (admin only)
    async setUserRole(token: string, userId: string, role: 'admin' | 'member'): Promise<AdminUser> {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update user role');
        }

        return response.json();
    },

    // Get current user's effective page visibility
    async getMyVisibility(token: string): Promise<Record<string, boolean>> {
        const response = await fetch(`${API_URL}/admin/me/visibility`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to get visibility');
        }

        return response.json();
    },

    // Get a user's page permissions (admin only)
    async getUserPermissions(token: string, userId: string): Promise<UserPermissionsResponse> {
        const response = await fetch(`${API_URL}/admin/users/${userId}/permissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to get user permissions');
        }

        return response.json();
    },

    // Update a user's page permissions (admin only)
    async updateUserPermissions(
        token: string,
        userId: string,
        permissions: { pageKey: string; enabled: boolean | null }[]
    ): Promise<void> {
        const response = await fetch(`${API_URL}/admin/users/${userId}/permissions`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ permissions })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update user permissions');
        }
    },

    // Reset a user's permissions to global defaults (admin only)
    async resetUserPermissions(token: string, userId: string): Promise<void> {
        const response = await fetch(`${API_URL}/admin/users/${userId}/permissions`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to reset user permissions');
        }
    },

    // Bootstrap first admin (only works if no admins exist)
    async bootstrap(token: string): Promise<{ success: boolean; message: string; user?: { id: string; email: string; name: string | null; role: string } }> {
        const response = await fetch(`${API_URL}/admin/bootstrap`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to bootstrap admin');
        }

        return response.json();
    }
};

// Helper to convert feature flags to page visibility object
export function featureFlagsToPageVisibility(flags: FeatureFlag[]): Record<string, boolean> {
    const visibility: Record<string, boolean> = {};

    for (const flag of flags) {
        // Remove "page_" prefix to match existing pageVisibility keys
        const key = flag.key.replace('page_', '');
        visibility[key] = flag.enabled;
    }

    return visibility;
}
