import React, { memo, useRef, useEffect, useCallback, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react';

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
    const chartRef = useRef<any>(null);
    const isFirstRender = useRef(true);
    const [isPageVisible, setIsPageVisible] = useState(true);

    // Track page visibility to prevent re-renders when returning from hidden state
    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = !document.hidden;
            setIsPageVisible(visible);

            // When page becomes visible again, prevent chart from re-animating
            if (visible && chartRef.current) {
                const instance = chartRef.current.getEchartsInstance?.();
                if (instance) {
                    // Silently resize without animation
                    instance.resize({ animation: { duration: 0 } });
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Cache the option and apply animation settings
    const optionStr = JSON.stringify(option);
    if (optionRef.current !== optionStr) {
        optionRef.current = optionStr;

        // Clone option and modify animation based on state
        const shouldAnimate = isFirstRender.current && !skipAnimation;
        cachedOption.current = {
            ...option,
            animation: shouldAnimate ? (option.animation ?? true) : false,
            animationDuration: shouldAnimate ? (option.animationDuration ?? 1000) : 0,
        };

        isFirstRender.current = false;
    }

    // Handle chart ready - store instance reference
    const handleChartReady = useCallback((instance: any) => {
        // Store the ECharts instance for later use
        if (chartRef.current) {
            chartRef.current._echartsInstance = instance;
        }
        onChartReady?.(instance);
    }, [onChartReady]);

    // Prevent ResizeObserver from triggering unnecessary updates
    const mergedOpts = {
        renderer: 'canvas' as const,
        ...opts,
    };

    return (
        <ReactEChartsCore
            ref={chartRef}
            option={cachedOption.current}
            style={style}
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
