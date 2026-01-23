/**
 * useIntersection - Intersection Observer hook for lazy loading
 * Use for lazy loading images, infinite scroll, and visibility tracking
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIntersectionOptions {
    /** Root element for intersection (default: viewport) */
    root?: Element | null;
    /** Margin around the root */
    rootMargin?: string;
    /** Visibility threshold (0-1) */
    threshold?: number | number[];
    /** Only trigger once */
    triggerOnce?: boolean;
    /** Callback when intersection changes */
    onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

interface UseIntersectionResult {
    /** Ref to attach to the target element */
    ref: (node: Element | null) => void;
    /** Whether the element is currently intersecting */
    isIntersecting: boolean;
    /** The latest intersection entry */
    entry: IntersectionObserverEntry | null;
}

/**
 * Hook for observing element intersection with viewport or root
 */
export function useIntersection(options: UseIntersectionOptions = {}): UseIntersectionResult {
    const {
        root = null,
        rootMargin = '0px',
        threshold = 0,
        triggerOnce = false,
        onChange,
    } = options;

    const [isIntersecting, setIsIntersecting] = useState(false);
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
    const elementRef = useRef<Element | null>(null);
    const hasTriggeredRef = useRef(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Cleanup observer
    const cleanup = useCallback(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
    }, []);

    // Create observer
    useEffect(() => {
        // Check if IntersectionObserver is supported
        if (typeof IntersectionObserver === 'undefined') {
            setIsIntersecting(true);
            return;
        }

        cleanup();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [observerEntry] = entries;
                const isNowIntersecting = observerEntry.isIntersecting;

                // Skip if triggerOnce and already triggered
                if (triggerOnce && hasTriggeredRef.current) {
                    return;
                }

                setIsIntersecting(isNowIntersecting);
                setEntry(observerEntry);
                onChange?.(isNowIntersecting, observerEntry);

                if (isNowIntersecting && triggerOnce) {
                    hasTriggeredRef.current = true;
                    cleanup();
                }
            },
            { root, rootMargin, threshold }
        );

        // Observe current element if any
        if (elementRef.current) {
            observerRef.current.observe(elementRef.current);
        }

        return cleanup;
    }, [root, rootMargin, threshold, triggerOnce, onChange, cleanup]);

    // Ref callback to handle element changes
    const ref = useCallback(
        (node: Element | null) => {
            // Cleanup previous observation
            if (elementRef.current && observerRef.current) {
                observerRef.current.unobserve(elementRef.current);
            }

            elementRef.current = node;

            // Observe new element
            if (node && observerRef.current) {
                observerRef.current.observe(node);
            }
        },
        []
    );

    return { ref, isIntersecting, entry };
}

/**
 * Hook for infinite scroll - triggers callback when sentinel element is visible
 */
export function useInfiniteScroll(
    callback: () => void,
    options: {
        rootMargin?: string;
        threshold?: number;
        disabled?: boolean;
    } = {}
): (node: Element | null) => void {
    const { rootMargin = '100px', threshold = 0, disabled = false } = options;

    const { ref, isIntersecting } = useIntersection({
        rootMargin,
        threshold,
    });

    useEffect(() => {
        if (isIntersecting && !disabled) {
            callback();
        }
    }, [isIntersecting, disabled, callback]);

    return ref;
}

/**
 * Hook to track if element is in viewport
 */
export function useIsVisible(options: UseIntersectionOptions = {}): [
    (node: Element | null) => void,
    boolean
] {
    const { ref, isIntersecting } = useIntersection(options);
    return [ref, isIntersecting];
}

/**
 * Hook for lazy loading - returns true once element enters viewport
 */
export function useLazyLoad(rootMargin = '100px'): [(node: Element | null) => void, boolean] {
    const { ref, isIntersecting } = useIntersection({
        rootMargin,
        triggerOnce: true,
    });
    return [ref, isIntersecting];
}

export default useIntersection;
