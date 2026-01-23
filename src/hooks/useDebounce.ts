/**
 * useDebounce - Debounce hook for values and callbacks
 * Essential for search inputs, filters, and other frequent updates
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Debounce a value - useful for search inputs
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Debounce a callback function
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced callback
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const callbackRef = useRef(callback);

    // Update callback ref on every render
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay]
    );
}

/**
 * Throttle a callback function
 * @param callback - The callback to throttle
 * @param delay - Minimum time between calls in milliseconds
 * @returns A throttled callback
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const lastCallRef = useRef<number>(0);
    const callbackRef = useRef(callback);
    const pendingArgsRef = useRef<Parameters<T> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            const timeSinceLastCall = now - lastCallRef.current;

            if (timeSinceLastCall >= delay) {
                lastCallRef.current = now;
                callbackRef.current(...args);
            } else {
                // Queue the latest call
                pendingArgsRef.current = args;

                if (!timeoutRef.current) {
                    timeoutRef.current = setTimeout(() => {
                        if (pendingArgsRef.current) {
                            lastCallRef.current = Date.now();
                            callbackRef.current(...pendingArgsRef.current);
                            pendingArgsRef.current = null;
                        }
                        timeoutRef.current = undefined;
                    }, delay - timeSinceLastCall);
                }
            }
        },
        [delay]
    );
}

/**
 * Memoize a value with custom comparison
 * @param factory - Function that creates the value
 * @param deps - Dependencies for memoization
 * @param compare - Custom comparison function
 */
export function useMemoCompare<T>(
    factory: () => T,
    deps: React.DependencyList,
    compare: (prev: T | undefined, next: T) => boolean = Object.is
): T {
    const previousRef = useRef<T>();

    const current = useMemo(factory, deps);

    const isEqual = previousRef.current !== undefined && compare(previousRef.current, current);

    useEffect(() => {
        if (!isEqual) {
            previousRef.current = current;
        }
    });

    return isEqual ? previousRef.current! : current;
}

/**
 * Get the previous value of a prop or state
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * Track if a component is mounted (useful for async operations)
 */
export function useIsMounted(): () => boolean {
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return useCallback(() => isMountedRef.current, []);
}

/**
 * Defer a value update until after paint (for non-critical UI updates)
 */
export function useDeferredValue<T>(value: T, timeout = 0): T {
    const [deferredValue, setDeferredValue] = useState(value);

    useEffect(() => {
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
            const id = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
                () => setDeferredValue(value),
                { timeout }
            );
            return () => (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
        } else {
            const id = setTimeout(() => setDeferredValue(value), timeout);
            return () => clearTimeout(id);
        }
    }, [value, timeout]);

    return deferredValue;
}

export default useDebounce;
