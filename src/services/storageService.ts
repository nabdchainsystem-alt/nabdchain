import { API_BASE_URL } from '../config/api';
import { storageLogger } from '../utils/logger';

const API_URL = API_BASE_URL;

// Universal storage service that syncs ALL localStorage to backend
export const storageService = {
    // Generic get with backend fallback
    async getItem(key: string): Promise<string | null> {
        try {
            // Try backend first
            const response = await fetch(`${API_URL}/storage?key=${encodeURIComponent(key)}`);
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
    async setItem(key: string, value: string): Promise<void> {
        // Always save to localStorage immediately
        localStorage.setItem(key, value);

        // Sync to backend asynchronously
        try {
            // Check if exists
            const existing = await fetch(`${API_URL}/storage?key=${encodeURIComponent(key)}`);
            const existingData = await existing.json();

            if (existingData.length > 0) {
                // Update
                await fetch(`${API_URL}/storage/${existingData[0].id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value })
                });
            } else {
                // Create
                await fetch(`${API_URL}/storage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value })
                });
            }
        } catch (error) {
            storageLogger.error(`Failed to sync ${key} to backend:`, error);
            // Silent fail - localStorage still works
        }
    },

    // Remove item
    async removeItem(key: string): Promise<void> {
        localStorage.removeItem(key);

        try {
            const existing = await fetch(`${API_URL}/storage?key=${encodeURIComponent(key)}`);
            const existingData = await existing.json();

            if (existingData.length > 0) {
                await fetch(`${API_URL}/storage/${existingData[0].id}`, {
                    method: 'DELETE'
                });
            }
        } catch (error) {
            storageLogger.error(`Failed to remove ${key} from backend:`, error);
        }
    }
};

// Drop-in replacement for localStorage
export const syncedStorage = {
    getItem: (key: string) => localStorage.getItem(key), // Sync getter
    setItem: (key: string, value: string) => localStorage.setItem(key, value), // Async setter
    removeItem: (key: string) => storageService.removeItem(key)
};
