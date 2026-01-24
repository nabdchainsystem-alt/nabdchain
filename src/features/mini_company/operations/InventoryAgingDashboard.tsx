import React, { useState } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart as ReactECharts } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Clock, Warning, Hourglass, Coin, Tag, Fire } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InventoryAgingInfo } from './InventoryAgingInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- Mock Data: Charts ---
const AGING_BUCKETS = [
    { name: '0-30 Days', value: 45000 },
    { name: '31-60 Days', value: 30000 },
    { name: '61-90 Days', value: 15000 },
    { name: '91-180 Days', value: 20000 },
    { name: '180+ Days', value: 12000 },
];

const AGE_DISTRIBUTION = [
    { value: 45, name: 'Fresh (0-60)' },
    { value: 35, name: 'Mature (61-120)' },
    { value: 15, name: 'Aging (121-365)' },
    { value: 5, name: 'Dead (>365)' }
];

// Aging by Warehouse
const AGING_BY_WAREHOUSE = [
    { name: 'Main Hub', value: 25000 },
    { name: 'North Br', value: 18000 },
    { name: 'South Br', value: 12000 },
    { name: 'Retail', value: 8000 },
];

// Velocity Status
const VELOCITY_STATUS = [
    { value: 40, name: 'Fast Moving' },
    { value: 35, name: 'Normal' },
    { value: 15, name: 'Slow Moving' },
    { value: 10, name: 'Non-Moving' }
];

// --- Mock Data: Table & Heat Spiral ---
const AGING_ITEMS = [
    { id: 'SKU-8821', name: 'Legacy Widget', category: 'Parts', qty: 500, lastMoved: '2023-01-15', age: 420 },
    { id: 'SKU-9901', name: 'Winter Jacket', category: 'Apparel', qty: 150, lastMoved: '2023-08-10', age: 220 },
    { id: 'SKU-1022', name: 'Old Manuals', category: 'Docs', qty: 1000, lastMoved: '2023-05-20', age: 300 },
    { id: 'SKU-4405', name: 'Spare Cable', category: 'Elec', qty: 50, lastMoved: '2023-11-01', age: 140 },
    { id: 'SKU-7703', name: 'Display Stand', category: 'Fixtures', qty: 10, lastMoved: '2023-02-01', age: 405 },
];

// Heat Spiral Data
const HEAT_SPIRAL_DATA = [
    [0, 0, 10], [1, 10, 20], [2, 20, 30], [3, 30, 40], [4, 40, 50],
    [5, 50, 60], [6, 60, 70], [7, 70, 80], [8, 80, 90], [9, 90, 100],
    [10, 100, 120], [11, 120, 140], [12, 140, 160], [13, 160, 180]
];

export const InventoryAgingDashboard: React.FC = () => {
    const { currency, t } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const isLoading = useFirstMountLoading('inventory-aging-dashboard', 800);

    // --- KPI Data ---
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
        { id: '1', label: t('avg_stock_age'), subtitle: t('global_mean'), value: '48d', change: '+2d', trend: 'down', icon: <Clock size={18} />, sparklineData: [45, 45, 46, 47, 48, 48], color: 'blue' },
        { id: '2', label: t('aging_stock_value'), subtitle: t('over_90_days'), value: '$35k', rawValue: 35000, isCurrency: true, change: '+5%', trend: 'down', icon: <Hourglass size={18} />, sparklineData: [30, 31, 32, 33, 34, 35], color: 'blue' },
        { id: '3', label: t('dead_stock_value'), subtitle: t('over_365_days'), value: '$12k', rawValue: 12000, isCurrency: true, change: '+1%', trend: 'down', icon: <Warning size={18} />, sparklineData: [11, 11, 12, 12, 12, 12], color: 'blue' },
        { id: '4', label: t('capital_locked'), subtitle: t('pct_in_dead_stock'), value: '8.5%', change: '+0.2%', trend: 'down', icon: <Coin size={18} />, sparklineData: [8, 8.2, 8.3, 8.4, 8.5, 8.5], color: 'blue' },
    ];

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
        { id: '5', label: t('stock_over_90_days'), subtitle: t('pct_volume'), value: '15%', change: '+1%', trend: 'down', icon: <Hourglass size={18} />, sparklineData: [12, 13, 13, 14, 15, 15], color: 'blue' },
        { id: '6', label: t('slow_moving_skus'), subtitle: t('low_velocity'), value: '85', change: '+5', trend: 'down', icon: <Clock size={18} />, sparklineData: [70, 75, 78, 80, 82, 85], color: 'blue' },
        { id: '7', label: t('clearance_targets'), subtitle: t('recommended'), value: '25', change: '+2', trend: 'up', icon: <Tag size={18} />, sparklineData: [20, 21, 22, 23, 24, 25], color: 'blue' },
        { id: '8', label: t('write_off_risk'), subtitle: t('potential_loss'), value: '$8.2k', change: '-$500', trend: 'up', icon: <Fire size={18} />, sparklineData: [10, 9.5, 9.2, 8.8, 8.5, 8.2], color: 'blue' },
    ];


    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart - Age Distribution
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: AGE_DISTRIBUTION
        }]
    };

    // Pie Chart - Velocity Status
    const velocityPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: VELOCITY_STATUS,
            color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        }]
    };

    // Heat Spiral
    const spiralOption: EChartsOption = {
        title: { text: t('aging_spiral'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        polar: {},
        angleAxis: { min: 0, max: 360, interval: 30, axisLabel: { show: false } },
        radiusAxis: { min: 0, max: 200 },
        tooltip: { formatter: (params: any) => `${t('age')}: ${params.value[1]} ${t('days')}<br/>${t('value')}: ${params.value[2]}` },
        series: [{
            coordinateSystem: 'polar',
            name: t('aging'),
            type: 'scatter',
            symbolSize: (val: any) => val[2] / 5,
            data: HEAT_SPIRAL_DATA.map(d => [d[0] * 30, d[1], d[2]]),
            itemStyle: {
                color: (params: any) => {
                    const age = params.value[1];
                    return age > 365 ? '#ef4444' : age > 180 ? '#f97316' : '#f59e0b';
                }
            }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <InventoryAgingInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Clock size={28} className="text-orange-600 dark:text-orange-400 mt-1" />
                    <div className="text-start">
                        <h1 className="text-2xl font-bold">{t('inventory_aging_dead_stock')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('identify_slow_moving_aging')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-orange-500" />
                        {t('about_dashboard')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* --- Row 1: Top 4 KPIs --- */}
                {TOP_KPIS.map((kpi) => (
                    <div key={kpi.id} className="col-span-1">
                        <KPICard
                            {...kpi}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Recharts: Aging Buckets */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('aging_buckets')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('aging_buckets')}</h3>
                            <p className="text-xs text-gray-400">{t('value_by_age_group')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={AGING_BUCKETS} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Recharts: Aging by Warehouse */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('aging_by_warehouse')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('aging_by_warehouse')}</h3>
                            <p className="text-xs text-gray-400">{t('value_by_location')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={AGING_BY_WAREHOUSE} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Age Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('age_distribution')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('age_distribution')}</h3>
                                <p className="text-xs text-gray-400">{t('classification_split')}</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Velocity Status */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('velocity_status')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('velocity_status')}</h3>
                                <p className="text-xs text-gray-400">{t('movement_speed_distribution')}</p>
                            </div>
                            <ReactECharts option={velocityPieOption} style={{ height: '180px' }} />
                        </div>
                    )}
                </div>

                {/* Right: Side KPIs in 2x2 Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                color="blue"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} title={t('at_risk_inventory')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('at_risk_inventory')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('sku')}</th>
                                        <th className="px-5 py-3 text-start">{t('product')}</th>
                                        <th className="px-5 py-3 text-end">{t('qty')}</th>
                                        <th className="px-5 py-3 text-start">{t('last_moved')}</th>
                                        <th className="px-5 py-3 text-end">{t('age_days')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {AGING_ITEMS.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{item.id}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{item.name}</td>
                                            <td className="px-5 py-3 text-gray-900 dark:text-gray-100 text-end">{item.qty}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs text-start">{item.lastMoved}</td>
                                            <td className={`px-5 py-3 text-end font-bold ${item.age > 365 ? 'text-red-600' : 'text-orange-500'}`}>
                                                {item.age}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Heat Spiral (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title={t('aging_spiral')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={spiralOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
