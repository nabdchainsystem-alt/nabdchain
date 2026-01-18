import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ArrowsOut, Info, TrendUp, Warning, Activity, ShoppingCart, Clock, Lightning, ChartLineUp } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BehaviorPatternsInfo } from './BehaviorPatternsInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Avg Orders/Customer', subtitle: 'Per Year', value: '4.2', change: '+0.2', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [3.8, 3.9, 4, 4.1, 4.2, 4.2], color: 'indigo' },
    { id: '2', label: 'Purchase Frequency', subtitle: 'Days between Orders', value: '45d', change: '-2d', trend: 'up', icon: <Clock size={18} />, sparklineData: [48, 47, 46, 46, 45, 45], color: 'blue' },
    { id: '3', label: 'Avg Basket Size', subtitle: 'Items per Order', value: '3.5', change: '+0.1', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [3.2, 3.3, 3.4, 3.4, 3.5, 3.5], color: 'emerald' },
    { id: '4', label: 'Repeat Purchase Rate', subtitle: '% Returning', value: '65%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [60, 61, 62, 63, 64, 65], color: 'cyan' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Seasonal Index', subtitle: 'Buying Intensity', value: '1.2x', change: '+0.1', trend: 'up', icon: <Activity size={18} />, sparklineData: [1, 1, 1.1, 1.1, 1.2, 1.2], color: 'amber' },
    { id: '6', label: 'Behavior Volatility', subtitle: 'Pattern Variance', value: 'Low', change: '', trend: 'neutral', icon: <ChartLineUp size={18} />, sparklineData: [2, 2, 2, 2, 2, 2], color: 'slate' },
    { id: '7', label: 'Pattern Alerts', subtitle: 'Anomalies', value: '3', change: '+1', trend: 'down', icon: <Lightning size={18} />, sparklineData: [1, 2, 2, 2, 3, 3], color: 'red' },
];

// --- Mock Data: Charts ---
const ORDERS_BY_TIME = [
    { name: '0-6 AM', Orders: 50 },
    { name: '6-12 PM', Orders: 450 },
    { name: '12-6 PM', Orders: 800 },
    { name: '6-12 AM', Orders: 250 },
];

const PURCHASE_MIX = [
    { value: 450, name: 'Electronics' },
    { value: 300, name: 'Apparel' },
    { value: 150, name: 'Home' },
    { value: 100, name: 'Beauty' }
];

// --- Mock Data: Table & Line ---
const BEHAVIOR_LOG = [
    { customer: 'Alice Smith', orders: 12, aov: '$120', lastDate: 'Oct 24', trend: 'Stable' },
    { customer: 'Bob Jones', orders: 4, aov: '$45', lastDate: 'Oct 20', trend: 'Declining' },
    { customer: 'Charlie Day', orders: 25, aov: '$210', lastDate: 'Today', trend: 'Surging' },
    { customer: 'Dana White', orders: 8, aov: '$85', lastDate: 'Yesterday', trend: 'Stable' },
    { customer: 'Eve Black', orders: 1, aov: '$35', lastDate: 'Oct 15', trend: 'New' },
];

// Wave Timeline Data
const WAVE_DATA = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    impulse: [20, 30, 25, 40, 35, 60],
    routine: [50, 52, 51, 53, 52, 55],
    planned: [30, 25, 40, 20, 45, 30]
};

export const BehaviorPatternsDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: PURCHASE_MIX,
            color: ['#f59e0b', '#ec4899', '#10b981', '#6366f1']
        }]
    };

    // Wave Chart (Stacked Area / Line)
    const waveOption: EChartsOption = {
        title: { text: 'Behavioral Wave', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        grid: { top: 30, right: 20, bottom: 20, left: 40, containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: WAVE_DATA.months },
        yAxis: { type: 'value' },
        series: [
            { name: 'Routine', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: WAVE_DATA.routine, color: '#3b82f6' },
            { name: 'Planned', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: WAVE_DATA.planned, color: '#8b5cf6' },
            { name: 'Impulse', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: WAVE_DATA.impulse, color: '#f43f5e' }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-[#1a1d24] min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <BehaviorPatternsInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Activity size={28} className="text-orange-600 dark:text-orange-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Behavior & Patterns</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Purchasing Habits</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors bg-white dark:bg-[#2b2e36] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors bg-white dark:bg-[#2b2e36] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
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
                            color={kpi.color as any || 'blue'}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Orders by Time (Bar) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Activity Heatmap</h3>
                            <p className="text-xs text-gray-400">Orders by Time of Day</p>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ORDERS_BY_TIME} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Orders" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ECharts: Purchase Mix (Pie) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Category Mix</h3>
                            <p className="text-xs text-gray-400">Preferential Split</p>
                        </div>
                        <ReactECharts option={pieOption} style={{ height: '180px' }} />
                    </div>

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color={kpi.color as any || 'indigo'}
                                className="h-full"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Behavior Log</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3 text-right">Orders</th>
                                    <th className="px-5 py-3 text-right">Avg Order Value</th>
                                    <th className="px-5 py-3 text-right">Last Purchase</th>
                                    <th className="px-5 py-3 text-center">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {BEHAVIOR_LOG.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.customer}</td>
                                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.orders}</td>
                                        <td className="px-5 py-3 text-right text-green-600 font-medium">{row.aov}</td>
                                        <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">{row.lastDate}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.trend === 'Surging' ? 'bg-green-100 text-green-700' :
                                                    row.trend === 'Declining' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {row.trend}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Wave (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <ReactECharts option={waveOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
