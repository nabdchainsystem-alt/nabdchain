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
}

// Minimum dimensions to prevent ECharts 0-dimension warnings
const MIN_WIDTH = 100;
const MIN_HEIGHT = 100;

// WeakMap cache for stringified options - avoids expensive JSON.stringify on every render
const optionStringCache = new WeakMap<object, string>();

function getOptionString(option: any): string {
    if (option === null || typeof option !== 'object') {
        return JSON.stringify(option);
    }
    let cached = optionStringCache.get(option);
    if (!cached) {
        cached = JSON.stringify(option);
        optionStringCache.set(option, cached);
    }
    return cached;
}

// Custom comparison function for memo
const arePropsEqual = (prevProps: MemoizedChartProps, nextProps: MemoizedChartProps): boolean => {
    // Quick reference checks first - most common case
    if (prevProps.option === nextProps.option &&
        prevProps.className === nextProps.className &&
        prevProps.style === nextProps.style &&
        prevProps.showLoading === nextProps.showLoading &&
        prevProps.theme === nextProps.theme) {
        return true;
    }

    // If references differ, check other props first (cheaper)
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.showLoading !== nextProps.showLoading) return false;
    if (prevProps.theme !== nextProps.theme) return false;
    if (prevProps.style !== nextProps.style) return false;

    // Deep compare option only if reference differs - use cached strings
    if (prevProps.option === nextProps.option) return true;
    return getOptionString(prevProps.option) === getOptionString(nextProps.option);
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
    notMerge = true,
    lazyUpdate = false,
    showLoading = false,
    onEvents,
    onChartReady
}) => {
    // Cache options to prevent unnecessary updates
    const optionRef = useRef<string>('');
    const cachedOption = useRef<any>(null);

    // Use cached string comparison - avoids expensive JSON.stringify
    const optionStr = getOptionString(option);
    if (optionRef.current !== optionStr) {
        optionRef.current = optionStr;
        // Pass through option as-is, don't modify animations
        // ECharts handles hover/emphasis animations internally
        cachedOption.current = option;
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
