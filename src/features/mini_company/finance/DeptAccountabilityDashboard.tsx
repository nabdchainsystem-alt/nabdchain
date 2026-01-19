import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, UsersThree, Buildings, Target, Trophy, ChartPieSlice } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DeptAccountabilityInfo } from './DeptAccountabilityInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Departments Count', subtitle: 'Active', value: '8', change: '0', trend: 'neutral', icon: <Buildings size={18} />, sparklineData: [8, 8, 8, 8, 8, 8], color: 'blue' },
    { id: '2', label: 'Highest Spending', subtitle: 'Engineering', value: '$120k', change: '+5%', trend: 'up', icon: <UsersThree size={18} />, sparklineData: [110, 115, 112, 118, 120, 120], color: 'blue' },
    { id: '3', label: 'Budget Variance', subtitle: 'Total Excess', value: '$12.5k', change: '+2k', trend: 'down', icon: <Warning size={18} />, sparklineData: [8, 9, 10, 11, 12, 12.5], color: 'blue' },
    { id: '4', label: 'Avg Dept Expense', subtitle: 'Per Month', value: '$45k', change: '+3%', trend: 'up', icon: <Target size={18} />, sparklineData: [42, 43, 44, 44, 45, 45], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Over-Budget Depts', subtitle: 'Red Flags', value: '2', change: '+1', trend: 'down', icon: <Warning size={18} />, sparklineData: [1, 1, 0, 1, 1, 2], color: 'blue' },
    { id: '6', label: 'Efficiency Score', subtitle: 'Org Wide', value: '85/100', change: '+2', trend: 'up', icon: <Trophy size={18} />, sparklineData: [80, 82, 83, 84, 84, 85], color: 'blue' },
    { id: '7', label: 'Accountability Index', subtitle: 'Compliance', value: '92%', change: '0%', trend: 'neutral', icon: <ChartPieSlice size={18} />, sparklineData: [90, 91, 92, 92, 92, 92], color: 'blue' },
    { id: '8', label: 'Cost per Employee', subtitle: 'Avg Monthly', value: '$2,850', change: '-2%', trend: 'down', icon: <UsersThree size={18} />, sparklineData: [3000, 2950, 2900, 2880, 2860, 2850], color: 'blue' },
];

// --- Mock Data: Charts ---
const SPEND_PER_DEPT = [
    { name: 'Engineering', Amount: 120000 },
    { name: 'Marketing', Amount: 85000 },
    { name: 'Sales', Amount: 95000 },
    { name: 'HR', Amount: 25000 },
    { name: 'Operations', Amount: 45000 },
    { name: 'Finance', Amount: 30000 },
];

const DEPT_SHARE = [
    { value: 120000, name: 'Engineering' },
    { value: 95000, name: 'Sales' },
    { value: 85000, name: 'Marketing' },
    { value: 45000, name: 'Operations' },
    { value: 30000, name: 'Finance' },
    { value: 25000, name: 'HR' }
];

// --- Mock Data: Table & Graph ---
const DEPT_PERFORMANCE = [
    { dept: 'Engineering', budget: '$110,000', actual: '$120,000', variance: '+$10,000', owner: 'Mike Ross' },
    { dept: 'Sales', budget: '$100,000', actual: '$95,000', variance: '-$5,000', owner: 'Harvey Specter' },
    { dept: 'Marketing', budget: '$80,000', actual: '$85,000', variance: '+$5,000', owner: 'Donna Paulsen' },
    { dept: 'Operations', budget: '$50,000', actual: '$45,000', variance: '-$5,000', owner: 'Louis Litt' },
    { dept: 'HR', budget: '$25,000', actual: '$25,000', variance: '$0', owner: 'Rachel Zane' },
];

// Network Graph Data (Mock)
const NETWORK_NODES = [
    { id: '0', name: 'Finance', symbolSize: 30, value: 30000, category: 0 },
    { id: '1', name: 'Engineering', symbolSize: 50, value: 120000, category: 1 },
    { id: '2', name: 'Sales', symbolSize: 45, value: 95000, category: 1 },
    { id: '3', name: 'Marketing', symbolSize: 40, value: 85000, category: 1 },
    { id: '4', name: 'Operations', symbolSize: 35, value: 45000, category: 2 },
    { id: '5', name: 'HR', symbolSize: 25, value: 25000, category: 2 },
];
const NETWORK_LINKS = [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '0', target: '3' },
    { source: '0', target: '4' },
    { source: '0', target: '5' },
    { source: '1', target: '4' }, // Eng -> Ops interaction
    { source: '2', target: '3' }  // Sales -> Marketing interaction
];

// Additional chart data
const BUDGET_VS_ACTUAL = [
    { name: 'Engineering', Budget: 110000, Actual: 120000 },
    { name: 'Sales', Budget: 100000, Actual: 95000 },
    { name: 'Marketing', Budget: 80000, Actual: 85000 },
    { name: 'Operations', Budget: 50000, Actual: 45000 },
    { name: 'HR', Budget: 25000, Actual: 25000 },
];

const VARIANCE_STATUS = [
    { value: 40, name: 'Over Budget' },
    { value: 35, name: 'On Track' },
    { value: 25, name: 'Under Budget' }
];

export const DeptAccountabilityDashboard: React.FC = () => {
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
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: DEPT_SHARE,
            color: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#6366f1', '#ec4899']
        }]
    };

    // Variance Status Pie
    const variancePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: VARIANCE_STATUS,
            color: ['#ef4444', '#3b82f6', '#10b981']
        }]
    };

    // Graph Chart
    const graphOption: EChartsOption = {
        title: { text: 'Cost Network', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {},
        series: [
            {
                type: 'graph',
                layout: 'force',
                symbolSize: 30,
                roam: true,
                label: { show: true },
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 10],
                data: NETWORK_NODES,
                links: NETWORK_LINKS,
                force: { repulsion: 200, edgeLength: 100 },
                lineStyle: { opacity: 0.9, width: 2, curveness: 0 }
            }
        ]
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-start gap-2">
                        <Buildings size={28} className="text-orange-600 dark:text-orange-400 mt-1" />
                        <div>
                            <h1 className="text-2xl font-bold">Department Accountability</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cost Center Performance</p>
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
            <DeptAccountabilityInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Buildings size={28} className="text-orange-600 dark:text-orange-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Department Accountability</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cost Center Performance</p>
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
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Bar Charts Side by Side --- */}

                {/* Recharts: Spend per Dept (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend per Department</h3>
                        <p className="text-xs text-gray-400">Total Spend</p>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={SPEND_PER_DEPT} margin={{ top: 5, right: 30, left: 80, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recharts: Budget vs Actual (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Budget vs Actual</h3>
                        <p className="text-xs text-gray-400">Performance comparison</p>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={BUDGET_VS_ACTUAL} margin={{ top: 5, right: 30, left: 80, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend iconType="circle" fontSize={10} />
                                <Bar dataKey="Budget" fill="#dbeafe" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                <Bar dataKey="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}

                {/* Pie Charts in nested 2-col grid */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Dept Share (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Cost Distribution</h3>
                            <p className="text-xs text-gray-400">Share by Department</p>
                        </div>
                        <ReactECharts option={pieOption} style={{ height: '180px' }} />
                    </div>

                    {/* ECharts: Variance Status (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Variance Status</h3>
                            <p className="text-xs text-gray-400">Budget adherence</p>
                        </div>
                        <ReactECharts option={variancePieOption} style={{ height: '180px' }} />
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
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Department Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Department</th>
                                    <th className="px-5 py-3 text-right">Budget</th>
                                    <th className="px-5 py-3 text-right">Actual Spend</th>
                                    <th className="px-5 py-3 text-right">Variance</th>
                                    <th className="px-5 py-3 text-right">Owner</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {DEPT_PERFORMANCE.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.dept}</td>
                                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.budget}</td>
                                        <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">{row.actual}</td>
                                        <td className={`px-5 py-3 text-right font-medium ${row.variance.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                                            {row.variance}
                                        </td>
                                        <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">{row.owner}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Network (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <ReactECharts option={graphOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
