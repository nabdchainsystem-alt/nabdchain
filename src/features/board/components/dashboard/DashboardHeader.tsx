import React from 'react';
import ReactECharts from 'echarts-for-react';
import { KPICard, KPIConfig } from './KPICard';
export type { KPIConfig };

export interface ChartConfig {
    id: string;
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any; // ECharts option object partial
}

export interface DashboardConfig {
    kpis: KPIConfig[];
    charts: ChartConfig[];
}

interface DashboardHeaderProps {
    config: DashboardConfig;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ config }) => {
    if (!config || (!config.kpis.length && !config.charts.length)) return null;

    return (
        <div className="flex flex-col gap-6 p-6 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
            {/* KPI Grid */}
            {config.kpis.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {config.kpis.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>
            )}

            {/* Charts Grid */}
            {config.charts.length > 0 && (
                <div
                    className="grid gap-6"
                    style={{
                        gridTemplateColumns: `repeat(${Math.min(config.charts.length, 3)}, minmax(0, 1fr))`
                    }}
                >
                    {config.charts.map((chart) => (
                        <div key={chart.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 px-2">{chart.title}</h4>
                            <ReactECharts
                                option={{
                                    ...chart.data,
                                    title: { show: false }, // Hide internal title as we have external H4
                                    grid: {
                                        containLabel: true,
                                        left: 10,
                                        right: 10,
                                        bottom: 10,
                                        top: 10, // Reduced top padding since title is gone
                                        ...(chart.data.grid || {})
                                    }
                                }}
                                style={{ height: '220px', width: '100%' }}
                                theme="macarons" // Clean theme, can be customized
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
