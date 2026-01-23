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

/**
 * A ResponsiveContainer wrapper that:
 * 1. Caches dimensions to prevent flicker on visibility change
 * 2. Debounces resize events
 * 3. Ignores resize events while page is hidden
 */
export const StableResponsiveContainer: React.FC<StableResponsiveContainerProps> = memo(({
    children,
    width = '100%',
    height = '100%',
    minWidth,
    minHeight,
    aspect,
    className,
    debounce = 100,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const isVisibleRef = useRef(true);

    // Track page visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisibleRef.current = !document.hidden;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Measure container and cache dimensions
    const updateDimensions = useCallback(() => {
        if (!containerRef.current || !isVisibleRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.floor(rect.width);
        const newHeight = Math.floor(rect.height);

        // Only update if dimensions actually changed significantly (> 1px)
        setDimensions(prev => {
            if (!prev) return { width: newWidth, height: newHeight };
            if (Math.abs(prev.width - newWidth) <= 1 && Math.abs(prev.height - newHeight) <= 1) {
                return prev;
            }
            return { width: newWidth, height: newHeight };
        });
    }, []);

    // Debounced resize handler
    const handleResize = useCallback(() => {
        // Skip resize events while page is hidden
        if (!isVisibleRef.current) return;

        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(updateDimensions, debounce);
    }, [updateDimensions, debounce]);

    // Initial measurement and resize observer
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Initial measurement
        updateDimensions();

        // Use ResizeObserver for efficient resize detection
        const observer = new ResizeObserver(handleResize);
        observer.observe(container);

        return () => {
            observer.disconnect();
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [updateDimensions, handleResize]);

    // If we have cached dimensions, use them for stability
    // This prevents the flash when switching focus
    const containerStyle: React.CSSProperties = {
        width: typeof width === 'number' ? width : width,
        height: typeof height === 'number' ? height : height,
        minWidth,
        minHeight,
    };

    return (
        <div ref={containerRef} className={className} style={containerStyle}>
            {dimensions ? (
                <ResponsiveContainer
                    width={dimensions.width}
                    height={dimensions.height}
                    aspect={aspect}
                    debounce={debounce}
                >
                    {children as React.ReactElement}
                </ResponsiveContainer>
            ) : (
                // Fallback while measuring
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    aspect={aspect}
                    debounce={debounce}
                >
                    {children as React.ReactElement}
                </ResponsiveContainer>
            )}
        </div>
    );
});

StableResponsiveContainer.displayName = 'StableResponsiveContainer';

/**
 * Hook to prevent chart data from updating while page is hidden
 * This prevents data refresh from causing chart re-render when returning to the page
 */
export function useStableChartData<T>(data: T): T {
    const stableDataRef = useRef<T>(data);
    const isVisibleRef = useRef(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisibleRef.current = !document.hidden;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Only update data when page is visible
    if (isVisibleRef.current) {
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
