/**
 * usePageVisibility - Track page visibility to prevent unnecessary re-renders
 *
 * When user switches tabs/monitors and comes back, charts and heavy components
 * may re-render causing visual flicker. This hook helps prevent that.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePageVisibilityOptions {
    /** Callback when page becomes visible */
    onVisible?: () => void;
    /** Callback when page becomes hidden */
    onHidden?: () => void;
    /** Delay before calling onVisible (prevents flash on quick tab switches) */
    visibleDelay?: number;
}

interface UsePageVisibilityReturn {
    /** Whether page is currently visible */
    isVisible: boolean;
    /** Whether this is the first render (hasn't been hidden yet) */
    isFirstRender: boolean;
    /** Time page was last hidden (null if never hidden) */
    lastHiddenAt: number | null;
    /** Time elapsed since page was hidden (0 if visible) */
    hiddenDuration: number;
}

/**
 * Hook to track page visibility state
 */
export function usePageVisibility(options: UsePageVisibilityOptions = {}): UsePageVisibilityReturn {
    const { onVisible, onHidden, visibleDelay = 0 } = options;

    const [isVisible, setIsVisible] = useState(() =>
        typeof document !== 'undefined' ? !document.hidden : true
    );
    const [isFirstRender, setIsFirstRender] = useState(true);
    const [lastHiddenAt, setLastHiddenAt] = useState<number | null>(null);
    const [hiddenDuration, setHiddenDuration] = useState(0);

    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = !document.hidden;

            if (!visible) {
                // Page is now hidden
                setIsVisible(false);
                setIsFirstRender(false);
                setLastHiddenAt(Date.now());
                onHidden?.();

                // Clear any pending visible timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            } else {
                // Page is now visible
                const hiddenAt = lastHiddenAt;
                if (hiddenAt) {
                    setHiddenDuration(Date.now() - hiddenAt);
                }

                // Optionally delay the visible callback to prevent flash
                if (visibleDelay > 0) {
                    timeoutRef.current = setTimeout(() => {
                        setIsVisible(true);
                        onVisible?.();
                    }, visibleDelay);
                } else {
                    setIsVisible(true);
                    onVisible?.();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [onVisible, onHidden, visibleDelay, lastHiddenAt]);

    return { isVisible, isFirstRender, lastHiddenAt, hiddenDuration };
}

/**
 * Hook to prevent re-renders when page is hidden
 * Returns a stable value that doesn't update while page is hidden
 */
export function useStableWhileHidden<T>(value: T): T {
    const { isVisible } = usePageVisibility();
    const stableRef = useRef(value);

    // Only update the stable value when the page is visible
    if (isVisible) {
        stableRef.current = value;
    }

    return stableRef.current;
}

/**
 * Hook to pause expensive computations while page is hidden
 */
export function usePauseWhileHidden<T>(
    compute: () => T,
    deps: React.DependencyList,
    defaultValue: T
): T {
    const { isVisible, isFirstRender } = usePageVisibility();
    const resultRef = useRef<T>(defaultValue);
    const hasComputedRef = useRef(false);

    // Only compute when visible and deps change
    if ((isVisible || isFirstRender) && !hasComputedRef.current) {
        resultRef.current = compute();
        hasComputedRef.current = true;
    }

    // Re-compute when deps change (but only if visible)
    useEffect(() => {
        if (isVisible) {
            resultRef.current = compute();
        }
    }, [isVisible, ...deps]);

    return resultRef.current;
}

/**
 * Hook to skip animations/transitions after returning from hidden state
 * Useful to prevent chart animations from replaying
 */
export function useSkipAnimationOnReturn(): {
    shouldAnimate: boolean;
    resetAnimation: () => void;
} {
    const { isFirstRender, hiddenDuration } = usePageVisibility();
    const [shouldAnimate, setShouldAnimate] = useState(true);

    // Skip animation if returning from being hidden for more than 1 second
    useEffect(() => {
        if (!isFirstRender && hiddenDuration > 1000) {
            setShouldAnimate(false);
            // Re-enable animations after a short delay
            const timer = setTimeout(() => setShouldAnimate(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isFirstRender, hiddenDuration]);

    const resetAnimation = useCallback(() => {
        setShouldAnimate(true);
    }, []);

    return { shouldAnimate, resetAnimation };
}

export default usePageVisibility;
