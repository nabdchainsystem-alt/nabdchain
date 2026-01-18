import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, ChartBar, Timer, Lightning, ChartPie, Calendar as CalendarIcon, Waves, TrendUp } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PurchaseBehaviorInfo } from './PurchaseBehaviorInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Purchase Frequency', subtitle: 'Orders / Month', value: '18.5', change: '+2.1', trend: 'up', icon: <Timer size={18} />, sparklineData: [15, 16, 16, 17, 18, 18, 18.5] },
    { id: '2', label: 'Repeat Purchase Rate', subtitle: 'Recurring Items', value: '42%', change: '+5%', trend: 'up', icon: <ArrowsOut size={18} />, sparklineData: [35, 36, 38, 40, 41, 41, 42] },
    { id: '3', label: 'Seasonal Index', subtitle: 'Peak Deviation', value: '1.2x', change: '0', trend: 'neutral', icon: <CalendarIcon size={18} />, sparklineData: [1, 1, 1.1, 1.2, 1.2, 1.1, 1.2] },
    { id: '4', label: 'Category Concentration', subtitle: 'Top 3 Share', value: '68%', change: '-2%', trend: 'down', icon: <ChartPie size={18} />, sparklineData: [72, 71, 70, 70, 69, 68, 68] },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '5', label: 'Avg Order Gap', subtitle: 'Days Between', value: '4.2d', change: '-0.3d', trend: 'up', icon: <Timer size={18} />, sparklineData: [5, 4.8, 4.6, 4.5, 4.3, 4.2, 4.2] },
    { id: '6', label: 'Spike Detection', subtitle: 'Anomalies', value: '3', change: '+1', trend: 'down', icon: <Lightning size={18} />, sparklineData: [1, 1, 2, 0, 1, 2, 3] },
    { id: '7', label: 'Irregular Purchases', subtitle: 'Out of Pattern', value: '5.4%', change: '-1.1%', trend: 'up', icon: <Waves size={18} />, sparklineData: [7, 6.5, 6, 5.8, 5.5, 5.4, 5.4] },
];

// --- Mock Data: Charts ---
const ORDERS_PER_CATEGORY = [
    { name: 'Electronics', value: 45 },
    { name: 'Office', value: 120 },
    { name: 'Hardware', value: 30 },
    { name: 'Services', value: 15 },
    { name: 'Furniture', value: 8 },
];

const CATEGORY_MIX = [
    { name: 'Electronics', value: 45000 },
    { name: 'Office Supplies', value: 15000 },
    { name: 'Hardware', value: 25000 },
    { name: 'Services', value: 55000 },
    { name: 'Furniture', value: 12000 },
];

// --- Mock Data: Table & Heatmap ---
const CATEGORY_DETAILS = [
    { id: 1, category: 'Electronics', count: 45, avgValue: 1000, lastDate: '2023-10-25' },
    { id: 2, category: 'Office Supplies', count: 120, avgValue: 125, lastDate: '2023-10-28' },
    { id: 3, category: 'Hardware', count: 30, avgValue: 833, lastDate: '2023-10-20' },
    { id: 4, category: 'Services', count: 15, avgValue: 3666, lastDate: '2023-11-01' },
    { id: 5, category: 'Furniture', count: 8, avgValue: 1500, lastDate: '2023-09-15' },
];

// Mock Heatmap Data: Day of Week (0-6) vs Hour of Day (0-23) or Week vs Day
// Let's do Week of Year (X) vs Day of Week (Y)
const generateHeatmapData = () => {
    const data = [];
    for (let i = 0; i < 52; i++) { // Weeks
        for (let j = 0; j < 7; j++) { // Days
            data.push([i, j, Math.floor(Math.random() * 10)]);
        }
    }
    return data;
};
const HEATMAP_DATA = generateHeatmapData();

export const PurchaseBehaviorDashboard: React.FC = () => {
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

    // Pie Chart
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}: ${formatCurrency(params.value, currency.code, currency.symbol)} (${params.percent}%)` },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: CATEGORY_MIX.map(d => ({ ...d, itemStyle: { color: d.name === 'Services' ? '#3b82f6' : undefined } })) // Highlight Services
        }]
    };

    // Calendar Heatmap (Temporal Wave)
    const heatmapOption: EChartsOption = {
        title: { text: 'Weekly Purchasing Intensity', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { position: 'top' },
        grid: { height: '50%', top: '10%' },
        xAxis: { type: 'category', data: Array.from({ length: 52 }, (_, i) => `W${i + 1}`), splitArea: { show: true } },
        yAxis: { type: 'category', data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], splitArea: { show: true } },
        visualMap: {
            min: 0,
            max: 10,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            inRange: { color: ['#eff6ff', '#3b82f6', '#1e3a8a'] } // Blue scale
        },
        series: [{
            name: 'Orders',
            type: 'heatmap',
            data: HEATMAP_DATA,
            label: { show: false },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <PurchaseBehaviorInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <TrendUp size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Purchase Behavior</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Patterns, cycles, and anomalies</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-blue-500" />
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
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color="purple"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Orders per Category */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Orders per Category" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Orders per Category</h3>
                                <p className="text-xs text-gray-400">Volume breakdown</p>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ORDERS_PER_CATEGORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} interval={0} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Category Mix */}
                    {isLoading ? (
                        <PieChartSkeleton title="Category Mix (Spend)" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Category Mix (Spend)</h3>
                                <p className="text-xs text-gray-400">Portfolio diversity</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                                color="purple"
                                className="h-full"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <TableSkeleton rows={5} columns={4} />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Category Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3 text-right">Orders Count</th>
                                        <th className="px-5 py-3 text-right">Avg Value</th>
                                        <th className="px-5 py-3 text-right">Last Purchase</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {CATEGORY_DETAILS.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{c.category}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{c.count}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(c.avgValue, currency.code, currency.symbol)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-500 text-xs">{c.lastDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Temporal Wave (2 cols) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[320px]" title="Temporal Purchase Wave" />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Temporal Purchase Wave</h3>
                            <p className="text-xs text-gray-400">Activity density over time</p>
                        </div>
                        <ReactECharts option={heatmapOption} style={{ height: '240px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
