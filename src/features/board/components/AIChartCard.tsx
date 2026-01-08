import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart3, PieChart, LineChart, PlusCircle, X } from 'lucide-react';
import { Column, Row } from '../views/Table/RoomTable';
import { ChartBuilderConfig } from './chart-builder/types';
import { ChartDataTransformer } from './chart-builder/services/ChartDataTransformer';

interface AIChartCardProps {
    config: ChartBuilderConfig;
    columns: Column[];
    rows: Row[];
    onAdd?: () => void;
    onDelete?: () => void;
}

export const AIChartCard: React.FC<AIChartCardProps> = ({ config, columns, rows, onAdd, onDelete }) => {
    const chartOption = useMemo(() => {
        const data = ChartDataTransformer.transformData(rows, config);
        return ChartDataTransformer.generateOption(data, config);
    }, [config, rows]);

    const Icon = useMemo(() => {
        switch (config.chartType) {
            case 'pie':
            case 'doughnut': return PieChart;
            case 'line':
            case 'area': return LineChart;
            default: return BarChart3;
        }
    }, [config.chartType]);

    return (
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-[380px]">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/50">
                <div className="flex items-center gap-2">
                    <Icon size={16} className="text-indigo-500" />
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-tight">{config.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                        {config.chartType.toUpperCase()}
                    </div>
                    {onAdd && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md text-indigo-600 dark:text-indigo-400 transition-colors"
                            title="Add to Dashboard"
                        >
                            <PlusCircle size={16} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-md text-rose-600 dark:text-rose-400 transition-colors"
                            title="Remove from Dashboard"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 p-4 relative">
                <ReactECharts
                    option={{
                        ...chartOption,
                        title: { show: false },
                        grid: { ...((chartOption as any).grid || {}), top: 10, bottom: 40, left: 10, right: 10, containLabel: true }
                    }}
                    style={{ height: '100%', width: '100%' }}
                />
            </div>
            <div className="px-4 py-2 text-[10px] text-stone-400 dark:text-stone-500 bg-stone-50/30 dark:bg-stone-800/30 flex justify-between">
                <span>By: {columns.find(c => c.id === config.xAxisColumnId)?.label}</span>
                <span>Metric: {config.aggregation.toUpperCase()} {config.yAxisColumnId ? `(${columns.find(c => c.id === config.yAxisColumnId)?.label})` : 'Items'}</span>
            </div>
        </div>
    );
};
