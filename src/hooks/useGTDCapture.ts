import { useState, useEffect, useCallback } from 'react';
import { storageLogger } from '../utils/logger';

export interface GTDInboxItem {
    id: string;
    title: string;
    createdAt: number;
    scheduledAt?: number;
}

// Use a global storage key for quick capture that syncs with GTD Dashboard
const GTD_CAPTURE_KEY = 'gtd-data-v1-global';

interface GTDData {
    inboxItems: GTDInboxItem[];
    projects: GTDInboxItem[];
    nextActions: GTDInboxItem[];
    waitingFor: GTDInboxItem[];
    scheduled: GTDInboxItem[];
    someday: GTDInboxItem[];
    reference: GTDInboxItem[];
    completed: GTDInboxItem[];
    activePhase: string;
    selectedItemId: string | null;
}

const defaultGTDData: GTDData = {
    inboxItems: [],
    projects: [],
    nextActions: [],
    waitingFor: [],
    scheduled: [],
    someday: [],
    reference: [],
    completed: [],
    activePhase: 'capture',
    selectedItemId: null
};

export const useGTDCapture = () => {
    const [inboxItems, setInboxItems] = useState<GTDInboxItem[]>([]);

    // Load items on mount
    useEffect(() => {
        const loadItems = () => {
            try {
                const saved = localStorage.getItem(GTD_CAPTURE_KEY);
                if (saved) {
                    const data: GTDData = JSON.parse(saved);
                    setInboxItems(data.inboxItems || []);
                }
            } catch (e) {
                storageLogger.error('Failed to load GTD items', e);
            }
        };

        loadItems();

        // Listen for storage events (sync across tabs/components)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === GTD_CAPTURE_KEY) {
                loadItems();
            }
        };

        // Custom event for same-tab updates
        const handleLocalUpdate = () => loadItems();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('gtd-capture-updated', handleLocalUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('gtd-capture-updated', handleLocalUpdate);
        };
    }, []);

    const saveItems = useCallback((newItems: GTDInboxItem[]) => {
        setInboxItems(newItems);

        // Load existing data and merge
        try {
            const saved = localStorage.getItem(GTD_CAPTURE_KEY);
            const data: GTDData = saved ? JSON.parse(saved) : defaultGTDData;
            data.inboxItems = newItems;
            localStorage.setItem(GTD_CAPTURE_KEY, JSON.stringify(data));
        } catch (e) {
            storageLogger.error('Failed to save GTD items', e);
        }

        // Dispatch custom event to notify other components in same tab
        window.dispatchEvent(new Event('gtd-capture-updated'));
    }, []);

    const captureThought = useCallback((text: string) => {
        const newItem: GTDInboxItem = {
            id: Date.now().toString(),
            title: text,
            createdAt: Date.now()
        };

        saveItems([newItem, ...inboxItems]);
        return newItem;
    }, [inboxItems, saveItems]);

    const deleteItem = useCallback((id: string) => {
        saveItems(inboxItems.filter(item => item.id !== id));
    }, [inboxItems, saveItems]);

    // Clear all items from quick capture
    const clearAllItems = useCallback(() => {
        saveItems([]);
    }, [saveItems]);

    // Check if a board has GTD data
    const boardHasGTD = useCallback((boardId: string): boolean => {
        try {
            const saved = localStorage.getItem(`gtd-data-v1-${boardId}`);
            return saved !== null;
        } catch {
            return false;
        }
    }, []);

    // Get all boards that have GTD data
    const getBoardsWithGTD = useCallback((boardIds: string[]): string[] => {
        return boardIds.filter(id => boardHasGTD(id));
    }, [boardHasGTD]);

    // Transfer all quick capture items to a board's GTD inbox
    const transferToBoard = useCallback((boardId: string) => {
        if (inboxItems.length === 0) return;

        try {
            const boardKey = `gtd-data-v1-${boardId}`;
            const saved = localStorage.getItem(boardKey);
            const boardData: GTDData = saved ? JSON.parse(saved) : { ...defaultGTDData };

            // Merge items - add quick capture items to the board's inbox
            boardData.inboxItems = [...inboxItems, ...(boardData.inboxItems || [])];

            localStorage.setItem(boardKey, JSON.stringify(boardData));

            // Clear quick capture items
            clearAllItems();

            // Notify GTD dashboard to refresh
            window.dispatchEvent(new Event('gtd-capture-updated'));

            return true;
        } catch (e) {
            storageLogger.error('Failed to transfer items to board GTD', e);
            return false;
        }
    }, [inboxItems, clearAllItems]);

    // Create GTD data for a board (initialize)
    const createGTDForBoard = useCallback((boardId: string) => {
        try {
            const boardKey = `gtd-data-v1-${boardId}`;
            const newData: GTDData = {
                ...defaultGTDData,
                inboxItems: [...inboxItems]
            };
            localStorage.setItem(boardKey, JSON.stringify(newData));

            // Clear quick capture items
            clearAllItems();

            return true;
        } catch (e) {
            storageLogger.error('Failed to create GTD for board', e);
            return false;
        }
    }, [inboxItems, clearAllItems]);

    return {
        inboxItems,
        captureThought,
        deleteItem,
        clearAllItems,
        boardHasGTD,
        getBoardsWithGTD,
        transferToBoard,
        createGTDForBoard,
        inboxCount: inboxItems.length
    };
};
