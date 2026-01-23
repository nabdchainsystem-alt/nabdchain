import React, { memo, useRef } from 'react';
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
}

// Custom comparison function for memo
const arePropsEqual = (prevProps: MemoizedChartProps, nextProps: MemoizedChartProps): boolean => {
    // Quick reference checks first
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.showLoading !== nextProps.showLoading) return false;
    if (prevProps.theme !== nextProps.theme) return false;

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
    onChartReady
}) => {
    // Cache options to prevent unnecessary updates
    const optionRef = useRef<string>('');
    const cachedOption = useRef<any>(null);

    const optionStr = JSON.stringify(option);
    if (optionRef.current !== optionStr) {
        optionRef.current = optionStr;
        cachedOption.current = option;
    }

    return (
        <ReactEChartsCore
            option={cachedOption.current}
            style={style}
            className={className}
            opts={opts}
            theme={theme}
            notMerge={notMerge}
            lazyUpdate={lazyUpdate}
            showLoading={showLoading}
            onEvents={onEvents}
            onChartReady={onChartReady}
        />
    );
}, arePropsEqual);

MemoizedChart.displayName = 'MemoizedChart';

// Also export as default and as ReactECharts for easy migration
export default MemoizedChart;
export { MemoizedChart as ReactECharts };
