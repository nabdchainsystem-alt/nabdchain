/**
 * StableResponsiveContainer - Prevents chart flicker on focus/visibility changes
 *
 * ResponsiveContainer from Recharts triggers resize events when the page
 * regains focus, causing charts to blink. This wrapper stabilizes the
 * dimensions to prevent unnecessary redraws.
 */
import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer } from 'recharts';

interface StableResponsiveContainerProps {
    children: React.ReactNode;
    width?: string | number;
    height?: string | number;
    minWidth?: number;
    minHeight?: number;
    aspect?: number;
    className?: string;
    /** Debounce resize events (ms) */
    debounce?: number;
}

// Track visibility globally to avoid flicker across all charts
let globalIsVisible = true;
let lastVisibilityChange = 0;
const STABILITY_WINDOW = 500; // Ignore resize for 500ms after visibility change

// Initialize chart stability system
if (typeof document !== 'undefined') {
    const enableStabilityMode = () => {
        document.body.classList.add('chart-stability-active');
        lastVisibilityChange = Date.now();
        // Remove stability class after window
        setTimeout(() => {
            document.body.classList.remove('chart-stability-active');
        }, STABILITY_WINDOW);
    };

    document.addEventListener('visibilitychange', () => {
        globalIsVisible = !document.hidden;
        if (globalIsVisible) {
            enableStabilityMode();
        }
    });

    window.addEventListener('focus', enableStabilityMode);

    // Also handle mouse re-entry (switching monitors)
    document.addEventListener('mouseenter', () => {
        if (Date.now() - lastVisibilityChange < 1000) {
            enableStabilityMode();
        }
    });
}

/**
 * A ResponsiveContainer wrapper that:
 * 1. Caches dimensions to prevent flicker on visibility change
 * 2. Debounces resize events aggressively
 * 3. Ignores ALL resize events during stability window after visibility change
 */
export const StableResponsiveContainer: React.FC<StableResponsiveContainerProps> = memo(({
    children,
    width = '100%',
    height = '100%',
    minWidth,
    minHeight,
    aspect,
    className,
    debounce = 150,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const lastDimensionsRef = useRef<{ width: number; height: number } | null>(null);

    // Measure container and cache dimensions
    const updateDimensions = useCallback(() => {
        // Don't update during stability window
        if (Date.now() - lastVisibilityChange < STABILITY_WINDOW) return;
        if (!containerRef.current || !globalIsVisible) return;

        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.floor(rect.width);
        const newHeight = Math.floor(rect.height);

        // Skip if dimensions are the same or very close (within 5px)
        const prev = lastDimensionsRef.current;
        if (prev && Math.abs(prev.width - newWidth) <= 5 && Math.abs(prev.height - newHeight) <= 5) {
            return;
        }

        lastDimensionsRef.current = { width: newWidth, height: newHeight };
        setDimensions({ width: newWidth, height: newHeight });
    }, []);

    // Debounced resize handler
    const handleResize = useCallback(() => {
        // Skip ALL resize events during stability window or when hidden
        if (!globalIsVisible || Date.now() - lastVisibilityChange < STABILITY_WINDOW) {
            return;
        }

        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(updateDimensions, debounce);
    }, [updateDimensions, debounce]);

    // Initial measurement and resize observer
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Initial measurement (immediate)
        const rect = container.getBoundingClientRect();
        const initialDims = { width: Math.floor(rect.width), height: Math.floor(rect.height) };
        lastDimensionsRef.current = initialDims;
        setDimensions(initialDims);

        // Use ResizeObserver for efficient resize detection
        const observer = new ResizeObserver(handleResize);
        observer.observe(container);

        return () => {
            observer.disconnect();
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [handleResize]);

    // Container style
    const containerStyle: React.CSSProperties = {
        width: typeof width === 'number' ? width : width,
        height: typeof height === 'number' ? height : height,
        minWidth,
        minHeight,
    };

    // Always use cached dimensions once we have them - never fall back
    if (!dimensions) {
        return (
            <div ref={containerRef} className={className} style={containerStyle}>
                <ResponsiveContainer width="100%" height="100%" aspect={aspect} debounce={debounce}>
                    {children as React.ReactElement}
                </ResponsiveContainer>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={className} style={containerStyle}>
            <ResponsiveContainer
                width={dimensions.width}
                height={dimensions.height}
                aspect={aspect}
                debounce={debounce}
            >
                {children as React.ReactElement}
            </ResponsiveContainer>
        </div>
    );
});

StableResponsiveContainer.displayName = 'StableResponsiveContainer';

/**
 * Hook to prevent chart data from updating while page is hidden or during stability window
 * This prevents data refresh from causing chart re-render when returning to the page
 */
export function useStableChartData<T>(data: T): T {
    const stableDataRef = useRef<T>(data);

    // Only update data when page is visible AND outside stability window
    const shouldUpdate = globalIsVisible && (Date.now() - lastVisibilityChange > STABILITY_WINDOW);
    if (shouldUpdate) {
        stableDataRef.current = data;
    }

    return stableDataRef.current;
}

/**
 * Higher-order component to wrap any chart component with visibility-aware rendering
 */
export function withStableVisibility<P extends object>(
    WrappedComponent: React.ComponentType<P>
): React.FC<P & { skipRerender?: boolean }> {
    const StableComponent: React.FC<P & { skipRerender?: boolean }> = (props) => {
        const { skipRerender = false, ...rest } = props;
        const [shouldRender, setShouldRender] = useState(true);
        const propsRef = useRef(rest as P);

        useEffect(() => {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    // Page is hidden - freeze props
                    setShouldRender(false);
                } else {
                    // Page is visible again - allow re-render with new props
                    propsRef.current = rest as P;
                    // Small delay to prevent flash
                    setTimeout(() => setShouldRender(true), 50);
                }
            };

            if (skipRerender) {
                document.addEventListener('visibilitychange', handleVisibilityChange);
                return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        }, [skipRerender, rest]);

        // Use stable props if we're suppressing re-renders
        const effectiveProps = skipRerender && !shouldRender ? propsRef.current : (rest as P);

        return <WrappedComponent {...effectiveProps} />;
    };

    StableComponent.displayName = `withStableVisibility(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return memo(StableComponent) as React.FC<P & { skipRerender?: boolean }>;
}

export default StableResponsiveContainer;
