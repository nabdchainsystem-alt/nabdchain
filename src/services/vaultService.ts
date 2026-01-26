import { storageLogger } from '../utils/logger';
import { API_URL as API_BASE } from '../config/api';

const API_URL = `${API_BASE}/vault`;
const REQUEST_TIMEOUT = 15000; // 15 second timeout

/**
 * Fetch with timeout to prevent infinite loading
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw error;
    }
};

/**
 * Check if an error is a network error (server unreachable, CORS, etc.)
 */
const isNetworkError = (error: unknown): boolean => {
    if (error instanceof TypeError) {
        const message = error.message.toLowerCase();
        return (
            message.includes('failed to fetch') || // Chrome
            message.includes('load failed') || // Safari
            message.includes('networkerror') || // Firefox
            message.includes('network request failed') ||
            message.includes('network error')
        );
    }
    return false;
};

/**
 * Get a user-friendly error message based on error type
 */
const getErrorMessage = (error: unknown, context: string): string => {
    if (isNetworkError(error)) {
        return `Unable to connect to server. Please check your internet connection.`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return `${context} failed`;
};

export interface VaultMetadata {
    // Folder metadata
    description?: string;
    tags?: string[];
    managedBy?: string;
    accessLevel?: 'private' | 'team' | 'public';
    retentionPolicy?: 'none' | '1-year' | '5-years' | 'forever';
    notes?: string;
    sharedWith?: string[];
    // Link metadata
    url?: string;
    username?: string;
    password?: string;
    // Note metadata
    content?: string;
    // File metadata
    size?: string;
    mimeType?: string;
    dimensions?: string;
    uploadedBy?: string;
    icon?: string;
    isGroup?: boolean;
}

export interface VaultItem {
    id: string;
    userId: string;
    title: string;
    type: 'folder' | 'file' | 'image' | 'note' | 'weblink' | 'document' | 'login';
    subtitle?: string;
    content?: string;
    metadata?: VaultMetadata;
    isFavorite: boolean;
    isDeleted?: boolean;
    deletedAt?: string;
    folderId?: string; // null in DB but string/undefined in frontend usually
    color?: string;
    createdAt?: string;
    updatedAt?: string;
    previewUrl?: string; // Generated on frontend for now
}

// API response type (metadata may be string from DB)
interface RawVaultItem extends Omit<VaultItem, 'metadata'> {
    metadata?: string | VaultMetadata;
}

export const vaultService = {
    getAll: async (token: string, userId: string = "user-1"): Promise<VaultItem[]> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}?userId=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch vault items: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data = await response.json();

            if (!Array.isArray(data)) {
                storageLogger.error("VaultService: Expected array but got", data);
                return [];
            }

            // Parse metadata if it's a string
            return data.map((item: RawVaultItem) => ({
                ...item,
                metadata: parseMetadata(item.metadata),
            }));
        } catch (error) {
            storageLogger.error("VaultService getAll error:", error);
            const message = getErrorMessage(error, 'Load vault items');
            throw new Error(message);
        }
    },

    create: async (token: string, data: Partial<VaultItem>): Promise<VaultItem> => {
        try {
            const response = await fetchWithTimeout(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create vault item: ${response.status} ${errorText}`);
            }
            const item = await response.json();
            return {
                ...item,
                metadata: parseMetadata(item.metadata),
            };
        } catch (error) {
            storageLogger.error("VaultService create error:", error);
            const message = getErrorMessage(error, 'Create vault item');
            throw new Error(message);
        }
    },

    update: async (token: string, id: string, data: Partial<VaultItem>): Promise<VaultItem> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update vault item: ${response.status} ${errorText}`);
            }
            const item = await response.json();
            return {
                ...item,
                metadata: parseMetadata(item.metadata),
            };
        } catch (error) {
            storageLogger.error("VaultService update error:", error);
            const message = getErrorMessage(error, 'Update vault item');
            throw new Error(message);
        }
    },

    delete: async (token: string, id: string): Promise<void> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete vault item: ${response.status} ${errorText}`);
            }
        } catch (error) {
            storageLogger.error("VaultService delete error:", error);
            const message = getErrorMessage(error, 'Delete vault item');
            throw new Error(message);
        }
    },
};

const parseMetadata = (metadata: string | VaultMetadata | undefined): VaultMetadata | undefined => {
    if (!metadata) return undefined;
    if (typeof metadata === 'object') return metadata;
    try {
        return JSON.parse(metadata) as VaultMetadata;
    } catch (e) {
        storageLogger.warn("Failed to parse metadata", e);
        return {};
    }
};
