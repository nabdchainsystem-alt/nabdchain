import { API_BASE_URL } from '../config/api';
import { storageLogger } from '../utils/logger';

const API_URL = API_BASE_URL;

// Universal storage service that syncs ALL localStorage to backend
export const storageService = {
    // Generic get with backend fallback
    async getItem(token: string, key: string): Promise<string | null> {
        try {
            // Try backend first
            const response = await fetch(`${API_URL}/storage?key=${encodeURIComponent(key)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    return data[0].value;
                }
            }
        } catch (error) {
            storageLogger.error(`Failed to get ${key} from backend:`, error);
        }

        // Fallback to localStorage
        return localStorage.getItem(key);
    },

    // Generic set with backend sync
    async setItem(token: string, key: string, value: string): Promise<void> {
        // Always save to localStorage immediately
        localStorage.setItem(key, value);

        // Sync to backend asynchronously
        try {
            // Check if exists
            const existing = await fetch(`${API_URL}/storage?key=${encodeURIComponent(key)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const existingData = await existing.json();

            if (existingData.length > 0) {
                // Update
                await fetch(`${API_URL}/storage/${existingData[0].id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ value })
                });
            } else {
                // Create
                await fetch(`${API_URL}/storage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ key, value })
                });
            }
        } catch (error) {
            storageLogger.error(`Failed to sync ${key} to backend:`, error);
            // Silent fail - localStorage still works
        }
    },

    // Remove item
    async removeItem(token: string, key: string): Promise<void> {
        localStorage.removeItem(key);

        try {
            const existing = await fetch(`${API_URL}/storage?key=${encodeURIComponent(key)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const existingData = await existing.json();

            if (existingData.length > 0) {
                await fetch(`${API_URL}/storage/${existingData[0].id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (error) {
            storageLogger.error(`Failed to remove ${key} from backend:`, error);
        }
    }
};

// Drop-in replacement for localStorage (local-only, no auth needed)
export const syncedStorage = {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: (key: string) => localStorage.removeItem(key)
};
