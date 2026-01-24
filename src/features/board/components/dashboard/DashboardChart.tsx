import React, { memo, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

// Minimum dimensions to prevent ECharts 0-dimension warnings
const MIN_WIDTH = 100;
const MIN_HEIGHT = 100;

interface DashboardChartProps {
    title: string;
    options: any;
    height?: string;
}

// Deep comparison for memo - prevents re-render when options content is the same
const arePropsEqual = (prevProps: DashboardChartProps, nextProps: DashboardChartProps) => {
    if (prevProps.title !== nextProps.title) return false;
    if (prevProps.height !== nextProps.height) return false;
    // Deep compare options using JSON stringify
    return JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options);
};

export const DashboardChart: React.FC<DashboardChartProps> = memo(({ title, options, height = '300px' }) => {
    // Cache the options to prevent unnecessary chart updates
    const optionsRef = useRef<string>('');
    const cachedOptions = useRef<any>(null);

    const mergedOptions = useMemo(() => {
        const newOptionsStr = JSON.stringify(options);
        // Only create new options object if content actually changed
        if (optionsRef.current !== newOptionsStr) {
            optionsRef.current = newOptionsStr;
            cachedOptions.current = {
                grid: { top: 40, right: 20, bottom: 20, left: 20, containLabel: true },
                tooltip: { trigger: 'axis' },
                ...options
            };
        }
        return cachedOptions.current;
    }, [options]);

    return (
        <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 uppercase tracking-wide shrink-0">{title}</h3>
            <div className="flex-1 min-h-0 w-full relative" style={{ minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT }}>
                <ReactECharts
                    option={mergedOptions}
                    style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT }}
                    opts={{ renderer: 'svg' }}
                    notMerge={false}
                    lazyUpdate={true}
                />
            </div>
        </div>
    );
}, arePropsEqual);

DashboardChart.displayName = 'DashboardChart';
