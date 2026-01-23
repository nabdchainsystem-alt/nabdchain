/**
 * Web Worker for Heavy Computations
 * Offloads CPU-intensive tasks from the main thread
 */

// Message types for type safety
export type WorkerMessageType =
    | 'SORT_DATA'
    | 'FILTER_DATA'
    | 'AGGREGATE_DATA'
    | 'SEARCH'
    | 'TRANSFORM_DATA'
    | 'CALCULATE_STATS';

export interface WorkerMessage<T = unknown> {
    type: WorkerMessageType;
    id: string;
    payload: T;
}

export interface WorkerResponse<T = unknown> {
    id: string;
    success: boolean;
    result?: T;
    error?: string;
    duration?: number;
}

// Sort payload
interface SortPayload {
    data: Record<string, unknown>[];
    key: string;
    direction: 'asc' | 'desc';
    type?: 'string' | 'number' | 'date';
}

// Filter payload
interface FilterPayload {
    data: Record<string, unknown>[];
    filters: Array<{
        key: string;
        operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
        value: unknown;
    }>;
}

// Aggregate payload
interface AggregatePayload {
    data: Record<string, unknown>[];
    groupBy: string;
    aggregations: Array<{
        field: string;
        operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
        alias?: string;
    }>;
}

// Search payload
interface SearchPayload {
    data: Record<string, unknown>[];
    query: string;
    fields: string[];
    fuzzy?: boolean;
}

// Transform payload
interface TransformPayload {
    data: Record<string, unknown>[];
    transformations: Array<{
        field: string;
        operation: 'uppercase' | 'lowercase' | 'trim' | 'round' | 'format';
        options?: Record<string, unknown>;
    }>;
}

// Stats payload
interface StatsPayload {
    data: Record<string, unknown>[];
    fields: string[];
}

// Worker implementation
const ctx: Worker = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { type, id, payload } = event.data;
    const startTime = performance.now();

    try {
        let result: unknown;

        switch (type) {
            case 'SORT_DATA':
                result = sortData(payload as SortPayload);
                break;
            case 'FILTER_DATA':
                result = filterData(payload as FilterPayload);
                break;
            case 'AGGREGATE_DATA':
                result = aggregateData(payload as AggregatePayload);
                break;
            case 'SEARCH':
                result = searchData(payload as SearchPayload);
                break;
            case 'TRANSFORM_DATA':
                result = transformData(payload as TransformPayload);
                break;
            case 'CALCULATE_STATS':
                result = calculateStats(payload as StatsPayload);
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        const duration = performance.now() - startTime;

        ctx.postMessage({
            id,
            success: true,
            result,
            duration,
        } as WorkerResponse);
    } catch (error) {
        ctx.postMessage({
            id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
        } as WorkerResponse);
    }
};

// Sort data
function sortData({ data, key, direction, type = 'string' }: SortPayload): Record<string, unknown>[] {
    return [...data].sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];

        // Handle null/undefined
        if (aVal == null) return direction === 'asc' ? 1 : -1;
        if (bVal == null) return direction === 'asc' ? -1 : 1;

        // Convert based on type
        if (type === 'number') {
            aVal = Number(aVal);
            bVal = Number(bVal);
        } else if (type === 'date') {
            aVal = new Date(aVal as string).getTime();
            bVal = new Date(bVal as string).getTime();
        } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Filter data
function filterData({ data, filters }: FilterPayload): Record<string, unknown>[] {
    return data.filter(item => {
        return filters.every(({ key, operator, value }) => {
            const itemValue = item[key];

            switch (operator) {
                case 'eq': return itemValue === value;
                case 'ne': return itemValue !== value;
                case 'gt': return Number(itemValue) > Number(value);
                case 'lt': return Number(itemValue) < Number(value);
                case 'gte': return Number(itemValue) >= Number(value);
                case 'lte': return Number(itemValue) <= Number(value);
                case 'contains':
                    return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
                case 'startsWith':
                    return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
                case 'endsWith':
                    return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
                default:
                    return true;
            }
        });
    });
}

// Aggregate data
function aggregateData({ data, groupBy, aggregations }: AggregatePayload): Record<string, unknown>[] {
    const groups = new Map<string, Record<string, unknown>[]>();

    // Group data
    data.forEach(item => {
        const groupKey = String(item[groupBy] ?? 'undefined');
        if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(item);
    });

    // Aggregate each group
    const results: Record<string, unknown>[] = [];

    groups.forEach((items, groupKey) => {
        const result: Record<string, unknown> = { [groupBy]: groupKey };

        aggregations.forEach(({ field, operation, alias }) => {
            const key = alias || `${operation}_${field}`;
            const values = items.map(item => Number(item[field]) || 0);

            switch (operation) {
                case 'sum':
                    result[key] = values.reduce((a, b) => a + b, 0);
                    break;
                case 'avg':
                    result[key] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                    break;
                case 'min':
                    result[key] = Math.min(...values);
                    break;
                case 'max':
                    result[key] = Math.max(...values);
                    break;
                case 'count':
                    result[key] = items.length;
                    break;
            }
        });

        results.push(result);
    });

    return results;
}

// Search data (with optional fuzzy matching)
function searchData({ data, query, fields, fuzzy = false }: SearchPayload): Record<string, unknown>[] {
    const queryLower = query.toLowerCase();

    return data.filter(item => {
        return fields.some(field => {
            const value = String(item[field] ?? '').toLowerCase();

            if (fuzzy) {
                return fuzzyMatch(value, queryLower);
            }

            return value.includes(queryLower);
        });
    });
}

// Simple fuzzy matching
function fuzzyMatch(text: string, query: string): boolean {
    let queryIndex = 0;

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
        if (text[i] === query[queryIndex]) {
            queryIndex++;
        }
    }

    return queryIndex === query.length;
}

// Transform data
function transformData({ data, transformations }: TransformPayload): Record<string, unknown>[] {
    return data.map(item => {
        const transformed = { ...item };

        transformations.forEach(({ field, operation }) => {
            const value = transformed[field];
            if (value == null) return;

            switch (operation) {
                case 'uppercase':
                    transformed[field] = String(value).toUpperCase();
                    break;
                case 'lowercase':
                    transformed[field] = String(value).toLowerCase();
                    break;
                case 'trim':
                    transformed[field] = String(value).trim();
                    break;
                case 'round':
                    transformed[field] = Math.round(Number(value));
                    break;
            }
        });

        return transformed;
    });
}

// Calculate statistics
function calculateStats({ data, fields }: StatsPayload): Record<string, Record<string, number>> {
    const stats: Record<string, Record<string, number>> = {};

    fields.forEach(field => {
        const values = data
            .map(item => Number(item[field]))
            .filter(v => !isNaN(v));

        if (values.length === 0) {
            stats[field] = { count: 0, sum: 0, avg: 0, min: 0, max: 0, stdDev: 0 };
            return;
        }

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Standard deviation
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        stats[field] = {
            count: values.length,
            sum,
            avg,
            min,
            max,
            stdDev,
        };
    });

    return stats;
}

export {};
