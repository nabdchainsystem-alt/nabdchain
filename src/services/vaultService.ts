
const API_URL = 'http://localhost:3001/api/vault';

export interface VaultItem {
    id: string;
    userId: string;
    title: string;
    type: 'folder' | 'file' | 'image' | 'note' | 'weblink' | 'document';
    subtitle?: string;
    content?: string;
    metadata?: any;
    isFavorite: boolean;
    folderId?: string; // null in DB but string/undefined in frontend usually
    color?: string;
    createdAt?: string;
    updatedAt?: string;
    previewUrl?: string; // Generated on frontend for now
}

export const vaultService = {
    getAll: async (token: string, userId: string = "user-1"): Promise<VaultItem[]> => {
        const response = await fetch(`${API_URL}?userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch vault items');
        const data = await response.json();
        // Parse metadata if it's a string
        return data.map((item: any) => ({
            ...item,
            metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata,
        }));
    },

    create: async (token: string, data: Partial<VaultItem>): Promise<VaultItem> => {
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
        if (!response.ok) throw new Error('Failed to create vault item');
        const item = await response.json();
        return {
            ...item,
            metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata,
        };
    },

    update: async (token: string, id: string, data: Partial<VaultItem>): Promise<VaultItem> => {
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
        if (!response.ok) throw new Error('Failed to update vault item');
        const item = await response.json();
        return {
            ...item,
            metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata,
        };
    },

    delete: async (token: string, id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete vault item');
    },
};
