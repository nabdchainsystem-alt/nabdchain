import React from 'react';
import ReactECharts from 'echarts-for-react';

interface DashboardChartProps {
    title: string;
    options: any;
    height?: string;
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ title, options, height = '300px' }) => {
    const defaultOptions = {
        grid: { top: 40, right: 20, bottom: 20, left: 20, containLabel: true },
        tooltip: { trigger: 'axis' },
        ...options
    };

    return (
        <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 uppercase tracking-wide shrink-0">{title}</h3>
            <div className="flex-1 min-h-0 w-full relative">
                <ReactECharts option={defaultOptions} style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }} opts={{ renderer: 'svg' }} />
            </div>
        </div>
    );
};
