import { storageLogger } from '../utils/logger';

const API_URL = '/api/vault';

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
    // File metadata
    size?: string;
    mimeType?: string;
    dimensions?: string;
    uploadedBy?: string;
}

export interface VaultItem {
    id: string;
    userId: string;
    title: string;
    type: 'folder' | 'file' | 'image' | 'note' | 'weblink' | 'document';
    subtitle?: string;
    content?: string;
    metadata?: VaultMetadata;
    isFavorite: boolean;
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
            const response = await fetch(`${API_URL}?userId=${userId}`, {
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
            throw error;
        }
    },

    create: async (token: string, data: Partial<VaultItem>): Promise<VaultItem> => {
        try {
            const response = await fetch(API_URL, {
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
            throw error;
        }
    },

    update: async (token: string, id: string, data: Partial<VaultItem>): Promise<VaultItem> => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
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
            throw error;
        }
    },

    delete: async (token: string, id: string): Promise<void> => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete vault item: ${response.status} ${errorText}`);
            }
        } catch (error) {
            storageLogger.error("VaultService delete error:", error);
            throw error;
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
