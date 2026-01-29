import { appLogger } from '../utils/logger';
import { API_URL as API_BASE } from '../config/api';

const API_URL = `${API_BASE}/gtd`;
const REQUEST_TIMEOUT = 15000;

// GTD Categories
export type GTDCategory =
    | 'inbox'
    | 'projects'
    | 'nextActions'
    | 'waitingFor'
    | 'scheduled'
    | 'someday'
    | 'reference'
    | 'completed';

export interface GTDItem {
    id: string;
    clientId?: string;
    userId?: string;
    boardId?: string;
    title: string;
    category: GTDCategory;
    scheduledAt?: number | null;
    completedAt?: number | null;
    notes?: string;
    tags?: string[];
    version: number;
    isDeleted: boolean;
    deletedAt?: number | null;
    createdAt: number;
    updatedAt: number;
}

export interface SyncResult {
    created: GTDItem[];
    updated: GTDItem[];
    conflicts: Array<{
        clientItem: any;
        serverItem: GTDItem;
        resolution: string;
    }>;
    deleted: string[];
    serverChanges: GTDItem[];
    serverTime: number;
}

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
 * Check if an error is a network error
 */
const isNetworkError = (error: unknown): boolean => {
    if (error instanceof TypeError) {
        const message = error.message.toLowerCase();
        return (
            message.includes('failed to fetch') ||
            message.includes('load failed') ||
            message.includes('networkerror') ||
            message.includes('network request failed')
        );
    }
    return false;
};

/**
 * Get a user-friendly error message
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

export const gtdService = {
    /**
     * Get all GTD items for the user
     */
    getAll: async (token: string, boardId?: string): Promise<GTDItem[]> => {
        try {
            const url = new URL(API_URL);
            if (boardId) url.searchParams.append('boardId', boardId);

            const response = await fetchWithTimeout(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch GTD items: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('GTDService getAll error:', error);
            throw new Error(getErrorMessage(error, 'Load GTD items'));
        }
    },

    /**
     * Get a single GTD item
     */
    get: async (token: string, id: string): Promise<GTDItem | null> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 404) return null;

            if (!response.ok) {
                throw new Error(`Failed to fetch GTD item: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('GTDService get error:', error);
            throw new Error(getErrorMessage(error, 'Load GTD item'));
        }
    },

    /**
     * Create a new GTD item
     */
    create: async (token: string, item: Partial<GTDItem>): Promise<GTDItem> => {
        try {
            const response = await fetchWithTimeout(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(item)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create GTD item: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('GTDService create error:', error);
            throw new Error(getErrorMessage(error, 'Create GTD item'));
        }
    },

    /**
     * Update a GTD item
     */
    update: async (token: string, id: string, updates: Partial<GTDItem>): Promise<GTDItem> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (response.status === 409) {
                const conflict = await response.json();
                throw new ConflictError('Version conflict', conflict);
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update GTD item: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof ConflictError) throw error;
            appLogger.error('GTDService update error:', error);
            throw new Error(getErrorMessage(error, 'Update GTD item'));
        }
    },

    /**
     * Delete a GTD item (soft delete by default)
     */
    delete: async (token: string, id: string, hard: boolean = false): Promise<void> => {
        try {
            const url = hard ? `${API_URL}/${id}?hard=true` : `${API_URL}/${id}`;
            const response = await fetchWithTimeout(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete GTD item: ${response.status}`);
            }
        } catch (error) {
            appLogger.error('GTDService delete error:', error);
            throw new Error(getErrorMessage(error, 'Delete GTD item'));
        }
    },

    /**
     * Get changes since a timestamp (for sync)
     */
    getChangesSince: async (
        token: string,
        since: number,
        boardId?: string
    ): Promise<{ items: GTDItem[]; serverTime: number }> => {
        try {
            const url = new URL(`${API_URL}/sync/changes`);
            url.searchParams.append('since', since.toString());
            if (boardId) url.searchParams.append('boardId', boardId);

            const response = await fetchWithTimeout(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch changes: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('GTDService getChangesSince error:', error);
            throw new Error(getErrorMessage(error, 'Fetch GTD changes'));
        }
    },

    /**
     * Sync local changes with server
     */
    sync: async (
        token: string,
        items: any[],
        lastSyncedAt: number,
        boardId?: string
    ): Promise<SyncResult> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items, lastSyncedAt, boardId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to sync GTD items: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('GTDService sync error:', error);
            throw new Error(getErrorMessage(error, 'Sync GTD items'));
        }
    },

    /**
     * Bulk create items (for migration from localStorage)
     */
    bulkCreate: async (
        token: string,
        items: any[],
        boardId?: string
    ): Promise<{ success: boolean; count: number }> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items, boardId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to bulk create GTD items: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('GTDService bulkCreate error:', error);
            throw new Error(getErrorMessage(error, 'Migrate GTD items'));
        }
    },

    /**
     * Migrate from localStorage to API
     * Call this once when user first loads GTD with backend sync enabled
     */
    migrateFromLocalStorage: async (
        token: string,
        boardId: string,
        localData: {
            inboxItems: any[];
            projects: any[];
            nextActions: any[];
            waitingFor: any[];
            scheduled: any[];
            someday: any[];
            reference: any[];
            completed: any[];
        }
    ): Promise<{ success: boolean; count: number }> => {
        // Transform localStorage format to API format
        const items: any[] = [];

        const addItems = (list: any[], category: GTDCategory) => {
            list.forEach(item => items.push({
                id: item.id,
                title: item.title,
                category,
                scheduledAt: item.scheduledAt,
                createdAt: item.createdAt,
            }));
        };

        addItems(localData.inboxItems, 'inbox');
        addItems(localData.projects, 'projects');
        addItems(localData.nextActions, 'nextActions');
        addItems(localData.waitingFor, 'waitingFor');
        addItems(localData.scheduled, 'scheduled');
        addItems(localData.someday, 'someday');
        addItems(localData.reference, 'reference');
        addItems(localData.completed, 'completed');

        return gtdService.bulkCreate(token, items, boardId);
    }
};

/**
 * Custom error class for version conflicts
 */
export class ConflictError extends Error {
    conflict: any;
    constructor(message: string, conflict: any) {
        super(message);
        this.name = 'ConflictError';
        this.conflict = conflict;
    }
}
