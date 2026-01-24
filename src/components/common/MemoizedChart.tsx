import React, { memo, useRef, useCallback, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface MemoizedChartProps {
    option: any;
    style?: React.CSSProperties;
    className?: string;
    opts?: { renderer?: 'canvas' | 'svg' };
    theme?: string | object;
    notMerge?: boolean;
    lazyUpdate?: boolean;
    showLoading?: boolean;
    onEvents?: Record<string, Function>;
    onChartReady?: (instance: any) => void;
    /** Skip initial animation (useful when returning from hidden state) */
    skipAnimation?: boolean;
}

// Minimum dimensions to prevent ECharts 0-dimension warnings
const MIN_WIDTH = 100;
const MIN_HEIGHT = 100;

// Track visibility for animation control
let lastVisibilityChange = 0;
const STABILITY_WINDOW = 500;

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            lastVisibilityChange = Date.now();
        }
    });
    window.addEventListener('focus', () => {
        lastVisibilityChange = Date.now();
    });
}

// Custom comparison function for memo
const arePropsEqual = (prevProps: MemoizedChartProps, nextProps: MemoizedChartProps): boolean => {
    // Quick reference checks first
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.showLoading !== nextProps.showLoading) return false;
    if (prevProps.theme !== nextProps.theme) return false;
    if (prevProps.skipAnimation !== nextProps.skipAnimation) return false;

    // Deep compare style
    if (JSON.stringify(prevProps.style) !== JSON.stringify(nextProps.style)) return false;

    // Deep compare opts
    if (JSON.stringify(prevProps.opts) !== JSON.stringify(nextProps.opts)) return false;

    // Deep compare option (the most important one)
    if (JSON.stringify(prevProps.option) !== JSON.stringify(nextProps.option)) return false;

    return true;
};

/**
 * MemoizedChart - A performance-optimized wrapper for ReactECharts
 *
 * This component:
 * 1. Uses memo with deep comparison to prevent unnecessary re-renders
 * 2. Caches options to avoid recreating chart data
 * 3. Uses lazyUpdate by default for smoother updates
 * 4. Prevents re-render flicker on page visibility changes
 *
 * Use this instead of ReactECharts directly for better performance.
 */
export const MemoizedChart: React.FC<MemoizedChartProps> = memo(({
    option,
    style,
    className,
    opts,
    theme,
    notMerge = false,
    lazyUpdate = true,
    showLoading = false,
    onEvents,
    onChartReady,
    skipAnimation = false
}) => {
    // Cache options to prevent unnecessary updates
    const optionRef = useRef<string>('');
    const cachedOption = useRef<any>(null);
    const isFirstRender = useRef(true);

    // Check if we're in stability window (recently returned from hidden)
    const inStabilityWindow = Date.now() - lastVisibilityChange < STABILITY_WINDOW;

    // Cache the option and apply animation settings
    const optionStr = JSON.stringify(option);
    if (optionRef.current !== optionStr) {
        optionRef.current = optionStr;

        // Disable animation if: not first render, skipAnimation requested, or in stability window
        const shouldAnimate = isFirstRender.current && !skipAnimation && !inStabilityWindow;
        cachedOption.current = {
            ...option,
            animation: shouldAnimate ? (option.animation ?? true) : false,
            animationDuration: shouldAnimate ? (option.animationDuration ?? 800) : 0,
        };

        isFirstRender.current = false;
    }

    // Handle chart ready - pass through to user callback
    const handleChartReady = useCallback((instance: any) => {
        onChartReady?.(instance);
    }, [onChartReady]);

    // Prevent ResizeObserver from triggering unnecessary updates
    const mergedOpts = {
        renderer: 'canvas' as const,
        ...opts,
    };

    // Ensure we have a valid option object
    const chartOption = cachedOption.current || option || {};

    // Merge style with minimum dimensions to prevent 0-dimension warnings
    const mergedStyle = useMemo(() => ({
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        ...style,
    }), [style]);

    return (
        <ReactECharts
            option={chartOption}
            style={mergedStyle}
            className={className}
            opts={mergedOpts}
            theme={theme}
            notMerge={notMerge}
            lazyUpdate={lazyUpdate}
            showLoading={showLoading}
            onEvents={onEvents}
            onChartReady={handleChartReady}
        />
    );
}, arePropsEqual);

MemoizedChart.displayName = 'MemoizedChart';

// Also export as default and as ReactECharts for easy migration
export default MemoizedChart;
export { MemoizedChart as ReactECharts };
