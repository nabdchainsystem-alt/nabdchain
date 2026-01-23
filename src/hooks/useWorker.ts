/**
 * useWorker - Hook to use Web Workers for heavy computations
 * Moves CPU-intensive work off the main thread for smooth 60fps UI
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import type { WorkerMessage, WorkerResponse, WorkerMessageType } from '../workers/computeWorker';

// Create worker instance lazily
let workerInstance: Worker | null = null;
const pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
}>();

function getWorker(): Worker | null {
    if (typeof Worker === 'undefined') return null;

    if (!workerInstance) {
        try {
            workerInstance = new Worker(
                new URL('../workers/computeWorker.ts', import.meta.url),
                { type: 'module' }
            );

            workerInstance.onmessage = (event: MessageEvent<WorkerResponse>) => {
                const { id, success, result, error } = event.data;
                const pending = pendingRequests.get(id);

                if (pending) {
                    if (success) {
                        pending.resolve(result);
                    } else {
                        pending.reject(new Error(error || 'Worker error'));
                    }
                    pendingRequests.delete(id);
                }
            };

            workerInstance.onerror = (error) => {
                console.error('[Worker] Error:', error);
            };
        } catch (e) {
            console.warn('[Worker] Failed to create worker:', e);
            return null;
        }
    }

    return workerInstance;
}

// Generate unique ID for requests
let requestId = 0;
function getRequestId(): string {
    return `req_${++requestId}_${Date.now()}`;
}

/**
 * Send a message to the worker and wait for response
 */
async function sendToWorker<T, R>(type: WorkerMessageType, payload: T): Promise<R> {
    const worker = getWorker();

    if (!worker) {
        throw new Error('Web Workers not supported');
    }

    const id = getRequestId();

    return new Promise((resolve, reject) => {
        // Set timeout for long-running operations
        const timeout = setTimeout(() => {
            pendingRequests.delete(id);
            reject(new Error('Worker timeout'));
        }, 30000); // 30 second timeout

        pendingRequests.set(id, {
            resolve: (value) => {
                clearTimeout(timeout);
                resolve(value as R);
            },
            reject: (error) => {
                clearTimeout(timeout);
                reject(error);
            },
        });

        worker.postMessage({ type, id, payload } as WorkerMessage);
    });
}

/**
 * Hook for sorting data in a web worker
 */
export function useWorkerSort<T extends Record<string, unknown>>() {
    const [isLoading, setIsLoading] = useState(false);

    const sort = useCallback(async (
        data: T[],
        key: string,
        direction: 'asc' | 'desc' = 'asc',
        type: 'string' | 'number' | 'date' = 'string'
    ): Promise<T[]> => {
        // For small datasets, sort on main thread
        if (data.length < 1000) {
            return [...data].sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                if (aVal == null) return direction === 'asc' ? 1 : -1;
                if (bVal == null) return direction === 'asc' ? -1 : 1;
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setIsLoading(true);
        try {
            return await sendToWorker<unknown, T[]>('SORT_DATA', { data, key, direction, type });
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { sort, isLoading };
}

/**
 * Hook for filtering data in a web worker
 */
export function useWorkerFilter<T extends Record<string, unknown>>() {
    const [isLoading, setIsLoading] = useState(false);

    const filter = useCallback(async (
        data: T[],
        filters: Array<{
            key: string;
            operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
            value: unknown;
        }>
    ): Promise<T[]> => {
        // For small datasets, filter on main thread
        if (data.length < 1000) {
            return data.filter(item =>
                filters.every(({ key, operator, value }) => {
                    const itemValue = item[key];
                    switch (operator) {
                        case 'eq': return itemValue === value;
                        case 'ne': return itemValue !== value;
                        case 'contains':
                            return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
                        default: return true;
                    }
                })
            );
        }

        setIsLoading(true);
        try {
            return await sendToWorker<unknown, T[]>('FILTER_DATA', { data, filters });
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { filter, isLoading };
}

/**
 * Hook for searching data in a web worker
 */
export function useWorkerSearch<T extends Record<string, unknown>>() {
    const [isLoading, setIsLoading] = useState(false);

    const search = useCallback(async (
        data: T[],
        query: string,
        fields: string[],
        fuzzy = false
    ): Promise<T[]> => {
        if (!query.trim()) return data;

        // For small datasets, search on main thread
        if (data.length < 500) {
            const queryLower = query.toLowerCase();
            return data.filter(item =>
                fields.some(field =>
                    String(item[field] ?? '').toLowerCase().includes(queryLower)
                )
            );
        }

        setIsLoading(true);
        try {
            return await sendToWorker<unknown, T[]>('SEARCH', { data, query, fields, fuzzy });
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { search, isLoading };
}

/**
 * Hook for aggregating data in a web worker
 */
export function useWorkerAggregate<T extends Record<string, unknown>>() {
    const [isLoading, setIsLoading] = useState(false);

    const aggregate = useCallback(async (
        data: T[],
        groupBy: string,
        aggregations: Array<{
            field: string;
            operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
            alias?: string;
        }>
    ): Promise<Record<string, unknown>[]> => {
        setIsLoading(true);
        try {
            return await sendToWorker<unknown, Record<string, unknown>[]>(
                'AGGREGATE_DATA',
                { data, groupBy, aggregations }
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { aggregate, isLoading };
}

/**
 * Hook for calculating statistics in a web worker
 */
export function useWorkerStats<T extends Record<string, unknown>>() {
    const [isLoading, setIsLoading] = useState(false);

    const calculateStats = useCallback(async (
        data: T[],
        fields: string[]
    ): Promise<Record<string, { count: number; sum: number; avg: number; min: number; max: number; stdDev: number }>> => {
        setIsLoading(true);
        try {
            return await sendToWorker('CALCULATE_STATS', { data, fields });
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { calculateStats, isLoading };
}

/**
 * Combined hook for all worker operations
 */
export function useComputeWorker<T extends Record<string, unknown>>() {
    const { sort, isLoading: isSorting } = useWorkerSort<T>();
    const { filter, isLoading: isFiltering } = useWorkerFilter<T>();
    const { search, isLoading: isSearching } = useWorkerSearch<T>();
    const { aggregate, isLoading: isAggregating } = useWorkerAggregate<T>();
    const { calculateStats, isLoading: isCalculating } = useWorkerStats<T>();

    const isLoading = isSorting || isFiltering || isSearching || isAggregating || isCalculating;

    return {
        sort,
        filter,
        search,
        aggregate,
        calculateStats,
        isLoading,
    };
}

/**
 * Terminate the worker (call on app unmount if needed)
 */
export function terminateWorker(): void {
    if (workerInstance) {
        workerInstance.terminate();
        workerInstance = null;
        pendingRequests.clear();
    }
}

export default useComputeWorker;
