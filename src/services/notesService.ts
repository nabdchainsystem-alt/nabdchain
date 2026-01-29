import { appLogger } from '../utils/logger';
import { API_URL as API_BASE } from '../config/api';

const API_URL = `${API_BASE}/notes`;
const REQUEST_TIMEOUT = 15000;

export interface QuickNote {
    id: string;
    clientId?: string;
    userId?: string;
    content: string;
    tags?: string[];
    pinned: boolean;
    version: number;
    isDeleted: boolean;
    deletedAt?: number | null;
    createdAt: number;
    updatedAt: number;
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

export const notesService = {
    /**
     * Get all notes for the user
     */
    getAll: async (token: string): Promise<QuickNote[]> => {
        try {
            const response = await fetchWithTimeout(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch notes: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('NotesService getAll error:', error);
            throw new Error(getErrorMessage(error, 'Load notes'));
        }
    },

    /**
     * Get a single note
     */
    get: async (token: string, id: string): Promise<QuickNote | null> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 404) return null;

            if (!response.ok) {
                throw new Error(`Failed to fetch note: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('NotesService get error:', error);
            throw new Error(getErrorMessage(error, 'Load note'));
        }
    },

    /**
     * Create a new note
     */
    create: async (token: string, note: Partial<QuickNote>): Promise<QuickNote> => {
        try {
            const response = await fetchWithTimeout(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(note)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create note: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('NotesService create error:', error);
            throw new Error(getErrorMessage(error, 'Create note'));
        }
    },

    /**
     * Update a note
     */
    update: async (token: string, id: string, updates: Partial<QuickNote>): Promise<QuickNote> => {
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
                throw new Error(`Failed to update note: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof ConflictError) throw error;
            appLogger.error('NotesService update error:', error);
            throw new Error(getErrorMessage(error, 'Update note'));
        }
    },

    /**
     * Delete a note (soft delete by default)
     */
    delete: async (token: string, id: string, hard: boolean = false): Promise<void> => {
        try {
            const url = hard ? `${API_URL}/${id}?hard=true` : `${API_URL}/${id}`;
            const response = await fetchWithTimeout(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete note: ${response.status}`);
            }
        } catch (error) {
            appLogger.error('NotesService delete error:', error);
            throw new Error(getErrorMessage(error, 'Delete note'));
        }
    },

    /**
     * Toggle pin status
     */
    togglePin: async (token: string, id: string): Promise<QuickNote> => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/${id}/pin`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to toggle pin: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('NotesService togglePin error:', error);
            throw new Error(getErrorMessage(error, 'Toggle pin'));
        }
    },

    /**
     * Get changes since a timestamp (for sync)
     */
    getChangesSince: async (
        token: string,
        since: number
    ): Promise<{ items: QuickNote[]; serverTime: number }> => {
        try {
            const url = new URL(`${API_URL}/sync/changes`);
            url.searchParams.append('since', since.toString());

            const response = await fetchWithTimeout(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch changes: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            appLogger.error('NotesService getChangesSince error:', error);
            throw new Error(getErrorMessage(error, 'Fetch note changes'));
        }
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
