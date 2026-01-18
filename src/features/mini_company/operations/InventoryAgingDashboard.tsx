import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Clock, Warning, Hourglass, Coin, Tag, Fire } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InventoryAgingInfo } from './InventoryAgingInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Avg Stock Age', subtitle: 'Global Mean', value: '48d', change: '+2d', trend: 'down', icon: <Clock size={18} />, sparklineData: [45, 45, 46, 47, 48, 48], color: 'blue' },
    { id: '2', label: 'Aging Stock Value', subtitle: '> 90 Days', value: '$35k', rawValue: 35000, isCurrency: true, change: '+5%', trend: 'down', icon: <Hourglass size={18} />, sparklineData: [30, 31, 32, 33, 34, 35], color: 'blue' },
    { id: '3', label: 'Dead Stock Value', subtitle: '> 365 Days', value: '$12k', rawValue: 12000, isCurrency: true, change: '+1%', trend: 'down', icon: <Warning size={18} />, sparklineData: [11, 11, 12, 12, 12, 12], color: 'blue' },
    { id: '4', label: 'Capital Locked', subtitle: '% in Dead Stock', value: '8.5%', change: '+0.2%', trend: 'down', icon: <Coin size={18} />, sparklineData: [8, 8.2, 8.3, 8.4, 8.5, 8.5], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Stock > 90 Days', subtitle: '% Volume', value: '15%', change: '+1%', trend: 'down', icon: <Hourglass size={18} />, sparklineData: [12, 13, 13, 14, 15, 15], color: 'blue' },
    { id: '6', label: 'Slow Moving SKUs', subtitle: 'Low Velocity', value: '85', change: '+5', trend: 'down', icon: <Clock size={18} />, sparklineData: [70, 75, 78, 80, 82, 85], color: 'blue' },
    { id: '7', label: 'Clearance Targets', subtitle: 'Recommended', value: '25', change: '+2', trend: 'up', icon: <Tag size={18} />, sparklineData: [20, 21, 22, 23, 24, 25], color: 'blue' },
    { id: '8', label: 'Write-off Risk', subtitle: 'Potential loss', value: '$8.2k', change: '-$500', trend: 'up', icon: <Fire size={18} />, sparklineData: [10, 9.5, 9.2, 8.8, 8.5, 8.2], color: 'blue' },
];

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

// New chart data: Aging by Warehouse
const AGING_BY_WAREHOUSE = [
    { name: 'Main Hub', value: 25000 },
    { name: 'North Br', value: 18000 },
    { name: 'South Br', value: 12000 },
    { name: 'Retail', value: 8000 },
];

// New chart data: Velocity Status
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

// Heat Spiral (Simulated via Polar Scatter)
const HEAT_SPIRAL_DATA = [
    [0, 0, 10], [1, 10, 20], [2, 20, 30], [3, 30, 40], [4, 40, 50],
    [5, 50, 60], [6, 60, 70], [7, 70, 80], [8, 80, 90], [9, 90, 100],
    [10, 100, 120], [11, 120, 140], [12, 140, 160], [13, 160, 180]
    // Simplified points to create a spiral effect
];

export const InventoryAgingDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

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

    // Heat Spiral (Polar Heatmap sim)
    const spiralOption: EChartsOption = {
        title: { text: 'Aging Spiral', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        polar: {},
        angleAxis: { min: 0, max: 360, interval: 30, axisLabel: { show: false } }, // hides angle labels
        radiusAxis: { min: 0, max: 200 }, // Time axis
        tooltip: { formatter: (params: any) => `Age: ${params.value[1]} Days<br/>Value: ${params.value[2]}` },
        series: [{
            coordinateSystem: 'polar',
            name: 'Aging',
            type: 'scatter',
            symbolSize: (val: any) => val[2] / 5, // Size represents value
            data: HEAT_SPIRAL_DATA.map(d => [d[0] * 30, d[1], d[2]]), // Angle spreads items, Radius is Age
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
                    <div>
                        <h1 className="text-2xl font-bold">Inventory Aging & Dead Stock</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Identify slow-moving and aging inventory</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-orange-500" />
                        About Dashboard
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

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Aging Buckets */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Aging Buckets" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Aging Buckets</h3>
                                <p className="text-xs text-gray-400">Value by age group</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={AGING_BUCKETS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Age Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title="Age Distribution" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Age Distribution</h3>
                                <p className="text-xs text-gray-400">Classification split</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                    {/* Recharts: Aging by Warehouse */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Aging by Warehouse" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Aging by Warehouse</h3>
                                <p className="text-xs text-gray-400">Value by location</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={AGING_BY_WAREHOUSE} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Velocity Status */}
                    {isLoading ? (
                        <PieChartSkeleton title="Velocity Status" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Velocity Status</h3>
                                <p className="text-xs text-gray-400">Movement speed distribution</p>
                            </div>
                            <ReactECharts option={velocityPieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color="blue"
                                className="h-full"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} title="At-Risk Inventory" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">At-Risk Inventory</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3">Product</th>
                                        <th className="px-5 py-3">Qty</th>
                                        <th className="px-5 py-3">Last Moved</th>
                                        <th className="px-5 py-3 text-right">Age (Days)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {AGING_ITEMS.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{item.id}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{item.name}</td>
                                            <td className="px-5 py-3 text-gray-900 dark:text-gray-100">{item.qty}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{item.lastMoved}</td>
                                            <td className={`px-5 py-3 text-right font-bold ${item.age > 365 ? 'text-red-600' : 'text-orange-500'}`}>
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
                        <ChartSkeleton height="h-[280px]" title="Aging Spiral" />
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
