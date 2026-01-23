/**
 * Performance monitoring and optimization utilities
 * Provides tools to measure and improve app performance
 */

// Performance marks for debugging
const PERF_MARKS: Map<string, number> = new Map();

/**
 * Start a performance measurement
 */
export function perfStart(label: string): void {
    if (typeof performance !== 'undefined') {
        PERF_MARKS.set(label, performance.now());
    }
}

/**
 * End a performance measurement and log the result
 */
export function perfEnd(label: string, threshold = 16): number {
    if (typeof performance === 'undefined') return 0;

    const start = PERF_MARKS.get(label);
    if (!start) return 0;

    const duration = performance.now() - start;
    PERF_MARKS.delete(label);

    // Only log if exceeds threshold (default 16ms = 1 frame at 60fps)
    if (duration > threshold && process.env.NODE_ENV === 'development') {
        console.warn(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
}

/**
 * Debounce function with leading edge option
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    const { leading = false, trailing = true } = options;

    return function (this: unknown, ...args: Parameters<T>) {
        const isFirstCall = !timeout;
        lastArgs = args;

        if (timeout) {
            clearTimeout(timeout);
        }

        if (leading && isFirstCall) {
            func.apply(this, args);
        }

        timeout = setTimeout(() => {
            if (trailing && lastArgs) {
                func.apply(this, lastArgs);
            }
            timeout = null;
            lastArgs = null;
        }, wait);
    };
}

/**
 * Throttle function - limits execution to once per wait period
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;

    return function (this: unknown, ...args: Parameters<T>) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    func.apply(this, lastArgs);
                    lastArgs = null;
                }
            }, wait);
        } else {
            lastArgs = args;
        }
    };
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallbackFallback(
    callback: () => void,
    options: { timeout?: number } = {}
): number {
    if ('requestIdleCallback' in window) {
        return (window as Window & { requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback(callback, options);
    }
    // Fallback for Safari and older browsers
    return window.setTimeout(callback, options.timeout ?? 1) as unknown as number;
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallbackFallback(id: number): void {
    if ('cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
    } else {
        window.clearTimeout(id);
    }
}

/**
 * Batch DOM reads and writes to prevent layout thrashing
 */
class DOMBatcher {
    private readQueue: Array<() => void> = [];
    private writeQueue: Array<() => void> = [];
    private scheduled = false;

    read(fn: () => void): void {
        this.readQueue.push(fn);
        this.schedule();
    }

    write(fn: () => void): void {
        this.writeQueue.push(fn);
        this.schedule();
    }

    private schedule(): void {
        if (this.scheduled) return;
        this.scheduled = true;

        requestAnimationFrame(() => {
            // Execute reads first (to batch layout calculations)
            const reads = this.readQueue.splice(0);
            reads.forEach(fn => fn());

            // Then execute writes (to batch DOM mutations)
            const writes = this.writeQueue.splice(0);
            writes.forEach(fn => fn());

            this.scheduled = false;

            // If more work was queued during execution, schedule again
            if (this.readQueue.length || this.writeQueue.length) {
                this.schedule();
            }
        });
    }
}

export const domBatcher = new DOMBatcher();

/**
 * Shallow compare two objects (for React.memo comparisons)
 */
export function shallowEqual<T extends Record<string, unknown>>(objA: T, objB: T): boolean {
    if (objA === objB) return true;
    if (!objA || !objB) return false;

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (objA[key] !== objB[key]) return false;
    }

    return true;
}

/**
 * Deep compare objects (use sparingly - expensive)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const aObj = a as Record<string, unknown>;
        const bObj = b as Record<string, unknown>;
        const keysA = Object.keys(aObj);
        const keysB = Object.keys(bObj);

        if (keysA.length !== keysB.length) return false;

        for (const key of keysA) {
            if (!deepEqual(aObj[key], bObj[key])) return false;
        }
        return true;
    }

    return false;
}

/**
 * Create a memoized function that caches the last result
 */
export function memoizeOne<T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    isEqual: (a: Parameters<T>, b: Parameters<T>) => boolean = (a, b) =>
        a.length === b.length && a.every((arg, i) => arg === b[i])
): T {
    let lastArgs: Parameters<T> | null = null;
    let lastResult: ReturnType<T>;

    return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
        if (lastArgs && isEqual(args, lastArgs)) {
            return lastResult;
        }

        lastResult = fn.apply(this, args);
        lastArgs = args;
        return lastResult;
    } as T;
}

/**
 * Chunk an array for batch processing
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Process items in batches using requestIdleCallback
 */
export async function processBatched<T, R>(
    items: T[],
    processor: (item: T) => R,
    batchSize = 50
): Promise<R[]> {
    const chunks = chunkArray(items, batchSize);
    const results: R[] = [];

    for (const chunk of chunks) {
        await new Promise<void>(resolve => {
            requestIdleCallbackFallback(() => {
                results.push(...chunk.map(processor));
                resolve();
            });
        });
    }

    return results;
}

/**
 * Intersection Observer for lazy loading
 */
export function createLazyObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
): IntersectionObserver | null {
    if (typeof IntersectionObserver === 'undefined') return null;

    return new IntersectionObserver(callback, {
        root: null,
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0,
        ...options,
    });
}

/**
 * Calculate virtualization window
 */
export function getVirtualWindow(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan = 3
): { start: number; end: number; offsetY: number } {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(totalItems, visibleEnd + overscan);
    const offsetY = start * itemHeight;

    return { start, end, offsetY };
}

// Re-export for convenience
export { FixedSizeList, VariableSizeList } from 'react-window';
