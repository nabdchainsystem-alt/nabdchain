/**
 * Offline Queue Manager
 * Queue and retry operations when offline, sync when back online
 */

// IndexedDB database name and version
const DB_NAME = 'nabd-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline-queue';

export interface QueuedAction {
    id: string;
    type: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    body?: unknown;
    headers?: Record<string, string>;
    timestamp: number;
    retries: number;
    maxRetries: number;
    priority: 'high' | 'normal' | 'low';
}

interface OfflineQueueEvents {
    'action-queued': (action: QueuedAction) => void;
    'action-synced': (action: QueuedAction) => void;
    'action-failed': (action: QueuedAction, error: Error) => void;
    'sync-started': () => void;
    'sync-completed': (results: { success: number; failed: number }) => void;
    'online': () => void;
    'offline': () => void;
}

type EventCallback<T extends keyof OfflineQueueEvents> = OfflineQueueEvents[T];

class OfflineQueueManager {
    private db: IDBDatabase | null = null;
    private isOnline: boolean = navigator.onLine;
    private isSyncing: boolean = false;
    private listeners: Map<keyof OfflineQueueEvents, Set<EventCallback<keyof OfflineQueueEvents>>> = new Map();

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        // Set up online/offline listeners
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        // Open database
        await this.openDatabase();

        // Sync if online
        if (this.isOnline) {
            this.syncQueue();
        }
    }

    private handleOnline = (): void => {
        this.isOnline = true;
        this.emit('online');
        this.syncQueue();
    };

    private handleOffline = (): void => {
        this.isOnline = false;
        this.emit('offline');
    };

    private async openDatabase(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('priority', 'priority', { unique: false });
                }
            };
        });
    }

    /**
     * Add an action to the offline queue
     */
    async enqueue(
        type: QueuedAction['type'],
        url: string,
        options: {
            body?: unknown;
            headers?: Record<string, string>;
            priority?: QueuedAction['priority'];
            maxRetries?: number;
        } = {}
    ): Promise<string> {
        const db = await this.openDatabase();

        const action: QueuedAction = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type,
            url,
            body: options.body,
            headers: options.headers,
            timestamp: Date.now(),
            retries: 0,
            maxRetries: options.maxRetries ?? 3,
            priority: options.priority ?? 'normal',
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(action);

            request.onsuccess = () => {
                this.emit('action-queued', action);
                resolve(action.id);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all queued actions
     */
    async getQueue(): Promise<QueuedAction[]> {
        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('timestamp');
            const request = index.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get queue count
     */
    async getQueueCount(): Promise<number> {
        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Remove an action from the queue
     */
    async dequeue(id: string): Promise<void> {
        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update an action's retry count
     */
    private async updateRetries(action: QueuedAction): Promise<void> {
        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ ...action, retries: action.retries + 1 });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Sync all queued actions
     */
    async syncQueue(): Promise<{ success: number; failed: number }> {
        if (!this.isOnline || this.isSyncing) {
            return { success: 0, failed: 0 };
        }

        this.isSyncing = true;
        this.emit('sync-started');

        const results = { success: 0, failed: 0 };
        const queue = await this.getQueue();

        // Sort by priority and timestamp
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        queue.sort((a, b) => {
            const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return a.timestamp - b.timestamp;
        });

        for (const action of queue) {
            try {
                const response = await fetch(action.url, {
                    method: action.type,
                    headers: {
                        'Content-Type': 'application/json',
                        ...action.headers,
                    },
                    body: action.body ? JSON.stringify(action.body) : undefined,
                });

                if (response.ok) {
                    await this.dequeue(action.id);
                    this.emit('action-synced', action);
                    results.success++;
                } else if (response.status >= 400 && response.status < 500) {
                    // Client error - don't retry
                    await this.dequeue(action.id);
                    const error = new Error(`HTTP ${response.status}`);
                    this.emit('action-failed', action, error);
                    results.failed++;
                } else {
                    // Server error - retry later
                    if (action.retries >= action.maxRetries) {
                        await this.dequeue(action.id);
                        const error = new Error(`Max retries exceeded`);
                        this.emit('action-failed', action, error);
                        results.failed++;
                    } else {
                        await this.updateRetries(action);
                    }
                }
            } catch (error) {
                // Network error - retry later
                if (action.retries >= action.maxRetries) {
                    await this.dequeue(action.id);
                    this.emit('action-failed', action, error as Error);
                    results.failed++;
                } else {
                    await this.updateRetries(action);
                }
            }
        }

        this.isSyncing = false;
        this.emit('sync-completed', results);

        return results;
    }

    /**
     * Clear all queued actions
     */
    async clearQueue(): Promise<void> {
        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Check if currently online
     */
    get online(): boolean {
        return this.isOnline;
    }

    /**
     * Check if currently syncing
     */
    get syncing(): boolean {
        return this.isSyncing;
    }

    /**
     * Register background sync (if supported)
     */
    async registerBackgroundSync(tag = 'sync-data'): Promise<boolean> {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }

    /**
     * Event listeners
     */
    on<T extends keyof OfflineQueueEvents>(event: T, callback: EventCallback<T>): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback as EventCallback<keyof OfflineQueueEvents>);
    }

    off<T extends keyof OfflineQueueEvents>(event: T, callback: EventCallback<T>): void {
        this.listeners.get(event)?.delete(callback as EventCallback<keyof OfflineQueueEvents>);
    }

    private emit<T extends keyof OfflineQueueEvents>(
        event: T,
        ...args: Parameters<OfflineQueueEvents[T]>
    ): void {
        this.listeners.get(event)?.forEach((callback) => {
            (callback as (...args: unknown[]) => void)(...args);
        });
    }

    /**
     * Cleanup
     */
    destroy(): void {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        this.listeners.clear();
        this.db?.close();
    }
}

// Singleton instance
export const offlineQueue = new OfflineQueueManager();

/**
 * React hook for offline queue
 */
import { useState, useEffect, useCallback } from 'react';

export function useOfflineQueue() {
    const [isOnline, setIsOnline] = useState(offlineQueue.online);
    const [isSyncing, setIsSyncing] = useState(offlineQueue.syncing);
    const [queueCount, setQueueCount] = useState(0);

    useEffect(() => {
        const updateCount = async () => {
            const count = await offlineQueue.getQueueCount();
            setQueueCount(count);
        };

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleSyncStarted = () => setIsSyncing(true);
        const handleSyncCompleted = () => {
            setIsSyncing(false);
            updateCount();
        };
        const handleActionQueued = () => updateCount();
        const handleActionSynced = () => updateCount();

        offlineQueue.on('online', handleOnline);
        offlineQueue.on('offline', handleOffline);
        offlineQueue.on('sync-started', handleSyncStarted);
        offlineQueue.on('sync-completed', handleSyncCompleted);
        offlineQueue.on('action-queued', handleActionQueued);
        offlineQueue.on('action-synced', handleActionSynced);

        updateCount();

        return () => {
            offlineQueue.off('online', handleOnline);
            offlineQueue.off('offline', handleOffline);
            offlineQueue.off('sync-started', handleSyncStarted);
            offlineQueue.off('sync-completed', handleSyncCompleted);
            offlineQueue.off('action-queued', handleActionQueued);
            offlineQueue.off('action-synced', handleActionSynced);
        };
    }, []);

    const enqueue = useCallback(
        (
            type: QueuedAction['type'],
            url: string,
            options?: Parameters<typeof offlineQueue.enqueue>[2]
        ) => offlineQueue.enqueue(type, url, options),
        []
    );

    const syncNow = useCallback(() => offlineQueue.syncQueue(), []);

    const clearQueue = useCallback(() => offlineQueue.clearQueue(), []);

    return {
        isOnline,
        isSyncing,
        queueCount,
        enqueue,
        syncNow,
        clearQueue,
    };
}

/**
 * Wrapper for fetch that queues requests when offline
 */
export async function offlineFetch(
    url: string,
    options: RequestInit & {
        offlineOptions?: {
            priority?: QueuedAction['priority'];
            maxRetries?: number;
        };
    } = {}
): Promise<Response> {
    const { offlineOptions, ...fetchOptions } = options;

    // If online, try regular fetch
    if (offlineQueue.online) {
        try {
            return await fetch(url, fetchOptions);
        } catch (error) {
            // Network error - might have gone offline
            if (!offlineQueue.online) {
                // Queue the request
                return queueAndReturnPending(url, fetchOptions, offlineOptions);
            }
            throw error;
        }
    }

    // If offline and it's a mutation, queue it
    const method = (fetchOptions.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return queueAndReturnPending(url, fetchOptions, offlineOptions);
    }

    // GET requests when offline - return cached or error
    throw new Error('Network unavailable');
}

async function queueAndReturnPending(
    url: string,
    options: RequestInit,
    offlineOptions?: { priority?: QueuedAction['priority']; maxRetries?: number }
): Promise<Response> {
    const method = (options.method || 'GET').toUpperCase() as QueuedAction['type'];

    let body: unknown;
    if (options.body) {
        try {
            body = JSON.parse(options.body as string);
        } catch {
            body = options.body;
        }
    }

    await offlineQueue.enqueue(method, url, {
        body,
        headers: options.headers as Record<string, string>,
        ...offlineOptions,
    });

    // Return a "pending" response
    return new Response(JSON.stringify({ queued: true, message: 'Action queued for sync' }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
    });
}

export default offlineQueue;
