import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Wallet, ChartBar, Receipt, CalendarBlank, CurrencyDollar } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExpensesOverviewInfo } from './ExpensesOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Total Expenses', subtitle: 'YTD', value: '$145,230', change: '+12%', trend: 'up', icon: <Wallet size={18} />, sparklineData: [120, 125, 130, 135, 140, 145], color: 'blue' },
    { id: '2', label: 'Monthly Expenses', subtitle: 'Current Month', value: '$12,450', change: '-5%', trend: 'down', icon: <CalendarBlank size={18} />, sparklineData: [11, 13, 12, 14, 13, 12], color: 'blue' },
    { id: '3', label: 'Expense Growth %', subtitle: 'MoM', value: '4.2%', change: '+1.1%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [3, 3.5, 3.8, 4.0, 4.1, 4.2], color: 'blue' },
    { id: '4', label: 'Expense Categories', subtitle: 'Active', value: '12', change: '0', trend: 'neutral', icon: <ChartBar size={18} />, sparklineData: [12, 12, 12, 12, 12, 12], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Fixed vs Variable', subtitle: 'Ratio', value: '60/40', change: '0', trend: 'neutral', icon: <Receipt size={18} />, sparklineData: [60, 60, 60, 60, 60, 60], color: 'blue' },
    { id: '6', label: 'Avg Expense / Day', subtitle: 'Based on 30 days', value: '$415', change: '-2%', trend: 'down', icon: <CurrencyDollar size={18} />, sparklineData: [420, 425, 430, 420, 415, 415], color: 'blue' },
    { id: '7', label: 'High-Cost Alerts', subtitle: 'Above Threshold', value: '3', change: '+1', trend: 'up', icon: <Warning size={18} />, sparklineData: [1, 1, 2, 2, 2, 3], color: 'blue' },
    { id: '8', label: 'Budget Variance', subtitle: 'vs Plan', value: '-2.3%', change: '+0.5%', trend: 'up', icon: <ChartBar size={18} />, sparklineData: [-4, -3.5, -3, -2.8, -2.5, -2.3], color: 'blue' },
];

// --- Mock Data: Charts ---
const EXPENSES_BY_CATEGORY = [
    { name: 'Payroll', value: 45000 },
    { name: 'Rent', value: 20000 },
    { name: 'Marketing', value: 15000 },
    { name: 'Software', value: 8000 },
    { name: 'Travel', value: 5000 },
];

const EXPENSES_BY_MONTH = [
    { name: 'Jan', value: 10000 },
    { name: 'Feb', value: 12000 },
    { name: 'Mar', value: 11000 },
    { name: 'Apr', value: 14000 },
    { name: 'May', value: 13000 },
    { name: 'Jun', value: 12450 },
];

const EXPENSE_DISTRIBUTION = [
    { value: 45, name: 'Payroll' },
    { value: 20, name: 'Rent' },
    { value: 15, name: 'Marketing' },
    { value: 8, name: 'Software' },
    { value: 12, name: 'Other' }
];

// Additional chart data
const EXPENSES_BY_DEPARTMENT = [
    { name: 'Engineering', value: 35000 },
    { name: 'Sales', value: 28000 },
    { name: 'Marketing', value: 22000 },
    { name: 'Operations', value: 18000 },
    { name: 'HR', value: 12000 },
];

const EXPENSE_TYPE_SPLIT = [
    { value: 60, name: 'Fixed' },
    { value: 40, name: 'Variable' }
];

// --- Mock Data: Table & Radial ---
const EXPENSE_TABLE = [
    { id: 'EXP-101', category: 'Marketing', amount: '$4,500', date: '2023-06-15', type: 'Variable', status: 'Approved' },
    { id: 'EXP-102', category: 'Software', amount: '$299', date: '2023-06-16', type: 'Fixed', status: 'Pending' },
    { id: 'EXP-103', category: 'Travel', amount: '$1,200', date: '2023-06-18', type: 'Variable', status: 'Approved' },
    { id: 'EXP-104', category: 'Office', amount: '$150', date: '2023-06-20', type: 'Variable', status: 'Pending' },
    { id: 'EXP-105', category: 'Rent', amount: '$5,000', date: '2023-06-01', type: 'Fixed', status: 'Paid' },
];

// Radial Data
const RADIAL_DATA = {
    indicator: [
        { name: 'Payroll', max: 100 },
        { name: 'Rent', max: 100 },
        { name: 'Marketing', max: 100 },
        { name: 'Software', max: 100 },
        { name: 'Travel', max: 100 },
        { name: 'Office', max: 100 }
    ],
    series: [
        {
            value: [90, 80, 70, 40, 30, 20],
            name: 'Spend Density'
        }
    ]
};

export const ExpensesOverviewDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

    // Loading state for smooth entrance animation
    const [isLoading, setIsLoading] = useState(true);

    // Simulate data loading with staggered animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // Short delay for smooth transition
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
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: EXPENSE_DISTRIBUTION,
            color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
        }]
    };

    // Expense Type Split Pie
    const expenseTypePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: EXPENSE_TYPE_SPLIT,
            color: ['#64748b', '#3b82f6']
        }]
    };

    // Radial (Radar) Chart - Using Radar primarily as requested "Radial Expense Density" usually implies radar or polar bar
    const radarOption: EChartsOption = {
        title: { text: 'Spend Concentration', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {},
        radar: {
            indicator: RADIAL_DATA.indicator,
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
                    value: RADIAL_DATA.series[0].value,
                    name: 'Spend Density',
                    areaStyle: { color: 'rgba(59, 130, 246, 0.4)' },
                    lineStyle: { color: '#3b82f6' },
                    itemStyle: { color: '#3b82f6' }
                }
            ]
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <ExpensesOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Wallet size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Expenses Overview</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Operational spending snapshot</p>
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
                {TOP_KPIS.map((kpi, index) => (
                    <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                        <KPICard
                            {...kpi}
                            color={kpi.color as any || 'blue'}
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Recharts: By Category (Bar) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Expenses by Category" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Expenses by Category</h3>
                            <p className="text-xs text-gray-400">Top cost centers</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={EXPENSES_BY_CATEGORY} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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

                {/* Recharts: By Department (Bar) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Expenses by Department" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Expenses by Department</h3>
                            <p className="text-xs text-gray-400">Departmental spending</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={EXPENSES_BY_DEPARTMENT} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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

                {/* --- Row 3: Two Pie Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Pie Charts in nested 2-col grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Distribution (Pie) */}
                    {isLoading ? (
                        <div className="col-span-1">
                            <PieChartSkeleton title="Cost Distribution" />
                        </div>
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Cost Distribution</h3>
                                <p className="text-xs text-gray-400">Share of wallet</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Fixed vs Variable (Pie) */}
                    {isLoading ? (
                        <div className="col-span-1">
                            <PieChartSkeleton title="Fixed vs Variable" />
                        </div>
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Fixed vs Variable</h3>
                                <p className="text-xs text-gray-400">Cost structure split</p>
                            </div>
                            <ReactECharts option={expenseTypePieOption} style={{ height: '180px' }} />
                        </div>
                    )}
                </div>

                {/* Right: 4 Side KPIs in 2x2 Grid */}
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

                {/* --- Row 4: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Recent Transactions</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3 text-right">Amount</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {EXPENSE_TABLE.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.type}</td>
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.category}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-datetime">{row.date}</td>
                                            <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">{row.amount}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'Approved' || row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-amber-100 text-amber-700'
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
                )}

                {/* Companion Chart: Radar (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <PieChartSkeleton size={240} title="Spend Concentration" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={radarOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
