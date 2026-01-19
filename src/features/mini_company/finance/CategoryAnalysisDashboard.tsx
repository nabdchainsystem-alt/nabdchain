import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Tag, ChartBar, Target, ArrowDown, Activity } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CategoryAnalysisInfo } from './CategoryAnalysisInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Total Categories', subtitle: 'Active Budget Lines', value: '15', change: '+2', trend: 'up', icon: <Tag size={18} />, sparklineData: [12, 12, 13, 13, 14, 15], color: 'blue' },
    { id: '2', label: 'Highest Cost Category', subtitle: 'Current Period', value: 'Payroll', change: '', trend: 'neutral', icon: <ArrowDown size={18} />, sparklineData: [45000, 46000, 45500, 48000, 47000, 45000], color: 'blue' },
    { id: '3', label: 'Category Variance %', subtitle: 'Avg Deviation', value: '8.5%', change: '-1.2%', trend: 'down', icon: <Activity size={18} />, sparklineData: [10, 9.5, 9.2, 8.8, 8.6, 8.5], color: 'blue' },
    { id: '4', label: 'Budget Breach Count', subtitle: 'Categories > Budget', value: '2', change: '-1', trend: 'down', icon: <Warning size={18} />, sparklineData: [3, 3, 2, 2, 3, 2], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Avg Category Spend', subtitle: 'Per Month', value: '$8,250', change: '+3%', trend: 'up', icon: <ChartBar size={18} />, sparklineData: [8000, 8100, 8050, 8200, 8250, 8250], color: 'blue' },
    { id: '6', label: 'Volatility Index', subtitle: 'Fluctuation Score', value: 'Medium', change: '', trend: 'neutral', icon: <Activity size={18} />, sparklineData: [40, 45, 42, 48, 45, 45], color: 'blue' },
    { id: '7', label: 'Control Score', subtitle: 'Budget Adherence', value: '88/100', change: '+2', trend: 'up', icon: <Target size={18} />, sparklineData: [82, 84, 85, 86, 87, 88], color: 'blue' },
    { id: '8', label: 'Category Growth Rate', subtitle: 'MoM Average', value: '+2.3%', change: '-0.5%', trend: 'down', icon: <TrendUp size={18} />, sparklineData: [3.2, 3.0, 2.8, 2.6, 2.4, 2.3], color: 'blue' },
];

// --- Mock Data: Charts ---
const SPEND_PER_CATEGORY = [
    { name: 'Payroll', value: 45000 },
    { name: 'Rent', value: 20000 },
    { name: 'Marketing', value: 15000 },
    { name: 'R&D', value: 12000 },
    { name: 'IT', value: 8000 },
    { name: 'Sales', value: 7500 },
    { name: 'Admin', value: 5000 },
];

const CATEGORY_SHARE = [
    { value: 40, name: 'Payroll' },
    { value: 18, name: 'Rent' },
    { value: 13, name: 'Marketing' },
    { value: 11, name: 'R&D' },
    { value: 7, name: 'IT' },
    { value: 11, name: 'Other' }
];

// --- Mock Data: Table & Radar ---
const CATEGORY_TABLE = [
    { category: 'Payroll', budget: '$46,000', actual: '$45,000', variance: '-$1,000', status: 'Under' },
    { category: 'Rent', budget: '$20,000', actual: '$20,000', variance: '$0', status: 'On Track' },
    { category: 'Marketing', budget: '$12,000', actual: '$15,000', variance: '+$3,000', status: 'Over' },
    { category: 'R&D', budget: '$10,000', actual: '$12,000', variance: '+$2,000', status: 'Over' },
    { category: 'IT', budget: '$9,000', actual: '$8,000', variance: '-$1,000', status: 'Under' },
];

// Radar Data
const RADAR_INDICATORS = [
    { name: 'Payroll', max: 100 },
    { name: 'Rent', max: 100 },
    { name: 'Marketing', max: 100 },
    { name: 'R&D', max: 100 },
    { name: 'IT', max: 100 }
];

const RADAR_DATA = [
    {
        value: [98, 100, 125, 120, 89],
        name: 'Budget % Used'
    }
];

// Additional chart data
const CATEGORY_TREND = [
    { name: 'Jan', Payroll: 44000, Marketing: 12000, IT: 7500 },
    { name: 'Feb', Payroll: 45000, Marketing: 13000, IT: 8000 },
    { name: 'Mar', Payroll: 44500, Marketing: 14000, IT: 7800 },
    { name: 'Apr', Payroll: 45500, Marketing: 15000, IT: 8200 },
    { name: 'May', Payroll: 45000, Marketing: 14500, IT: 8000 },
];

const BUDGET_STATUS = [
    { value: 40, name: 'On Track' },
    { value: 35, name: 'Under Budget' },
    { value: 25, name: 'Over Budget' }
];

export const CategoryAnalysisDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

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
            radius: '70%',
            center: ['50%', '50%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: CATEGORY_SHARE,
            color: ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6']
        }]
    };

    // Budget Status Pie
    const budgetStatusPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: BUDGET_STATUS,
            color: ['#3b82f6', '#10b981', '#ef4444']
        }]
    };

    // Radar Chart - Category Deviation
    const radarOption: EChartsOption = {
        title: { text: 'Budget Utilization %', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {},
        radar: {
            indicator: RADAR_INDICATORS,
            center: ['50%', '55%'],
            radius: '65%',
            splitNumber: 4,
            axisName: { color: '#6b7280', fontSize: 10 },
            splitArea: { areaStyle: { color: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db'], shadowColor: 'rgba(0, 0, 0, 0.1)', shadowBlur: 10 } }
        },
        series: [{
            type: 'radar',
            data: [
                {
                    value: RADAR_DATA[0].value,
                    name: 'Utilization',
                    areaStyle: { color: 'rgba(239, 68, 68, 0.4)' },
                    lineStyle: { color: '#ef4444' },
                    itemStyle: { color: '#ef4444' }
                }
            ]
        }]
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-start gap-2">
                        <Tag size={28} className="text-indigo-600 dark:text-indigo-400 mt-1" />
                        <div>
                            <h1 className="text-2xl font-bold">Category Analysis</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control overspending & variances</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Row 1: 4 KPI Skeletons */}
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="col-span-1 h-[120px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}

                    {/* Row 2: Two bar chart skeletons */}
                    <div className="col-span-2 min-h-[300px]">
                        <ChartSkeleton />
                    </div>
                    <div className="col-span-2 min-h-[300px]">
                        <ChartSkeleton />
                    </div>

                    {/* Row 3: Pie charts + KPIs */}
                    <div className="col-span-2 grid grid-cols-2 gap-6">
                        <PieChartSkeleton />
                        <PieChartSkeleton />
                    </div>
                    <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-[120px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                        ))}
                    </div>

                    {/* Row 4: Table + Chart skeleton */}
                    <div className="col-span-2">
                        <TableSkeleton />
                    </div>
                    <div className="col-span-2">
                        <ChartSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <CategoryAnalysisInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Tag size={28} className="text-indigo-600 dark:text-indigo-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Category Analysis</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control overspending & variances</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-indigo-500" />
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
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Bar Charts Side by Side --- */}

                {/* Recharts: Spend per Category (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend per Category</h3>
                        <p className="text-xs text-gray-400">Actual spend breakdown</p>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={SPEND_PER_CATEGORY} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} hide />
                                <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} width={60} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recharts: Category Trend (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Category Trend</h3>
                        <p className="text-xs text-gray-400">Monthly spend by category</p>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={CATEGORY_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend iconType="circle" fontSize={10} />
                                <Bar dataKey="Payroll" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} animationDuration={1000} />
                                <Bar dataKey="Marketing" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} animationDuration={1000} />
                                <Bar dataKey="IT" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}

                {/* Pie Charts in nested 2-col grid */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Category Share (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Category Allocation</h3>
                            <p className="text-xs text-gray-400">Departmental breakdown</p>
                        </div>
                        <ReactECharts option={pieOption} style={{ height: '180px' }} />
                    </div>

                    {/* ECharts: Budget Status (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Budget Status</h3>
                            <p className="text-xs text-gray-400">Categories by status</p>
                        </div>
                        <ReactECharts option={budgetStatusPieOption} style={{ height: '180px' }} />
                    </div>
                </div>

                {/* Side KPIs in 2x2 grid */}
                <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div
                            key={kpi.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <KPICard
                                {...kpi}
                                color="blue"
                                className="h-full"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 4: Table + Companion Chart --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Budget Analysis</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3 text-right">Budget</th>
                                    <th className="px-5 py-3 text-right">Actual</th>
                                    <th className="px-5 py-3 text-right">Variance</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {CATEGORY_TABLE.map((row) => (
                                    <tr key={row.category} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.category}</td>
                                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.budget}</td>
                                        <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">{row.actual}</td>
                                        <td className={`px-5 py-3 text-right font-medium ${row.variance.startsWith('+') ? 'text-red-500' : 'text-emerald-500'}`}>{row.variance}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'Over' ? 'bg-red-100 text-red-700' :
                                                row.status === 'Under' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Radar (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <ReactECharts option={radarOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
