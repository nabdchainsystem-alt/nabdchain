import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ArrowsOut, Info, TrendUp, Warning, Receipt, ChartBar, Lock, ArrowDown } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FixedVariableInfo } from './FixedVariableInfo';
import { useAppContext } from '../../../contexts/AppContext';

// Helper icon
const TargetIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Fixed Expenses', subtitle: 'Annualized', value: '$840,000', change: '0%', trend: 'neutral', icon: <Lock size={18} />, sparklineData: [70, 70, 70, 70, 70, 70], color: 'blue' },
    { id: '2', label: 'Variable Expenses', subtitle: 'Last 30 Days', value: '$45,230', change: '+5%', trend: 'up', icon: <ChartBar size={18} />, sparklineData: [40, 42, 41, 44, 43, 45], color: 'blue' },
    { id: '3', label: 'Flexibility Ratio', subtitle: 'Var / Total', value: '35%', change: '+1.5%', trend: 'up', icon: <ArrowDown size={18} />, sparklineData: [32, 33, 33, 34, 34, 35], color: 'blue' },
    { id: '4', label: 'Fixed Cost Growth', subtitle: 'YoY', value: '2.1%', change: '-0.5%', trend: 'down', icon: <TrendUp size={18} />, sparklineData: [2.5, 2.4, 2.3, 2.2, 2.1, 2.1], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Var Cost Volatility', subtitle: 'Std Dev', value: 'High', change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [60, 75, 50, 80, 65, 70], color: 'blue' },
    { id: '6', label: 'Break-Even Impact', subtitle: 'Revenue Needed', value: '$1.2M', change: '0', trend: 'neutral', icon: <TargetIcon size={18} />, sparklineData: [1.2, 1.2, 1.2, 1.2, 1.2, 1.2], color: 'blue' },
    { id: '7', label: 'Cost Rigidity', subtitle: 'Fixed / Total', value: '65%', change: '-1.5%', trend: 'down', icon: <Lock size={18} />, sparklineData: [68, 67, 67, 66, 66, 65], color: 'blue' },
    { id: '8', label: 'Optimization Score', subtitle: 'Cost Efficiency', value: '78/100', change: '+4', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [70, 72, 74, 75, 76, 78], color: 'blue' },
];

// --- Mock Data: Charts ---
const FIXED_VAR_TREND = [
    { name: 'Jan', Fixed: 70000, Variable: 30000 },
    { name: 'Feb', Fixed: 70000, Variable: 35000 },
    { name: 'Mar', Fixed: 70000, Variable: 32000 },
    { name: 'Apr', Fixed: 70000, Variable: 40000 },
    { name: 'May', Fixed: 70000, Variable: 38000 },
    { name: 'Jun', Fixed: 70000, Variable: 45230 },
];

const COST_STRUCTURE = [
    { value: 65, name: 'Fixed' },
    { value: 35, name: 'Variable' }
];

// --- Mock Data: Table & Matrix ---
const EXPENSE_CLASSIFICATION = [
    { name: 'Office Rent', type: 'Fixed', amount: '$20,000', frequency: 'Monthly', category: 'Facilities' },
    { name: 'Salaries', type: 'Fixed', amount: '$45,000', frequency: 'Monthly', category: 'Payroll' },
    { name: 'Ad Spend', type: 'Variable', amount: '$12,000', frequency: 'Ad-hoc', category: 'Marketing' },
    { name: 'Shipping', type: 'Variable', amount: '$5,000', frequency: 'Per Order', category: 'Logistics' },
    { name: 'Utilities', type: 'Semi-Var', amount: '$1,500', frequency: 'Monthly', category: 'Facilities' },
];

// Matrix Data: Impact vs Frequency (Rigidity Matrix)
const MATRIX_DATA = [
    [1, 9, 'Rent', 'Fixed'],
    [2, 8, 'Salaries', 'Fixed'],
    [8, 6, 'Ad Spend', 'Variable'],
    [9, 4, 'Shipping', 'Variable'],
    [5, 5, 'Utilities', 'Semi-Var']
];

export const FixedVariableDashboard: React.FC = () => {
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
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: COST_STRUCTURE,
            color: ['#64748b', '#3b82f6'] // Slate for Fixed, Blue for Variable
        }]
    };

    // Matrix Chart (Scatter)
    const matrixOption: EChartsOption = {
        title: { text: 'Cost Rigidity Matrix (Flexibility vs Impact)', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        grid: { top: 30, right: 30, bottom: 20, left: 30, containLabel: true },
        tooltip: {
            formatter: (params: any) => {
                return `<b>${params.value[2]}</b><br/>Impact: ${params.value[0]}<br/>Rigidity: ${params.value[1]}<br/>Type: ${params.value[3]}`;
            }
        },
        xAxis: { name: 'Flexibility', type: 'value', min: 0, max: 10, splitLine: { show: false } },
        yAxis: { name: 'Impact', type: 'value', min: 0, max: 10, splitLine: { show: false } },
        series: [{
            type: 'scatter',
            symbolSize: 20,
            data: MATRIX_DATA,
            itemStyle: {
                color: (params: any) => {
                    const type = params.value[3];
                    return type === 'Fixed' ? '#64748b' : type === 'Variable' ? '#3b82f6' : '#f59e0b';
                }
            }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <FixedVariableInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Receipt size={28} className="text-slate-600 dark:text-slate-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Fixed vs Variable</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cost structure & flexibility</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-slate-600 dark:text-gray-400 dark:hover:text-slate-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-slate-600 dark:text-gray-400 dark:hover:text-slate-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-slate-500" />
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

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Fixed vs Variable Trend (Stacked Bar) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Cost Structure Trend</h3>
                            <p className="text-xs text-gray-400">Fixed (Slate) vs Variable (Blue)</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={FIXED_VAR_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend iconType="circle" fontSize={10} />
                                    <Bar dataKey="Fixed" stackId="a" fill="#dbeafe" radius={[0, 0, 0, 0]} barSize={24} />
                                    <Bar dataKey="Variable" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ECharts: Cost Structure (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Current Split</h3>
                            <p className="text-xs text-gray-400">Fixed vs Variable Ratio</p>
                        </div>
                        <ReactECharts option={pieOption} style={{ height: '200px' }} />
                    </div>

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color="blue"
                                className="h-full"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Expense Classification</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Expense Name</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                    <th className="px-5 py-3 text-right">Frequency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {EXPENSE_CLASSIFICATION.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.type}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.category}</td>
                                        <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">{row.amount}</td>
                                        <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400">{row.frequency}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Matrix (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <ReactECharts option={matrixOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
