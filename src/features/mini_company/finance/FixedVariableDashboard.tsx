import React, { useState } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Receipt, ChartBar, Lock, ArrowDown } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FixedVariableInfo } from './FixedVariableInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// Helper icon
const TargetIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

// --- KPI Data getter functions ---
const getTopKPIs = (t: (key: string) => string): (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] => [
    { id: '1', label: t('fixed_expenses'), subtitle: t('annualized'), value: '$840,000', change: '0%', trend: 'neutral', icon: <Lock size={18} />, sparklineData: [70, 70, 70, 70, 70, 70], color: 'blue' },
    { id: '2', label: t('variable_expenses'), subtitle: t('last_30_days'), value: '$45,230', change: '+5%', trend: 'up', icon: <ChartBar size={18} />, sparklineData: [40, 42, 41, 44, 43, 45], color: 'blue' },
    { id: '3', label: t('flexibility_ratio'), subtitle: t('var_total'), value: '35%', change: '+1.5%', trend: 'up', icon: <ArrowDown size={18} />, sparklineData: [32, 33, 33, 34, 34, 35], color: 'blue' },
    { id: '4', label: t('fixed_cost_growth'), subtitle: t('yoy'), value: '2.1%', change: '-0.5%', trend: 'down', icon: <TrendUp size={18} />, sparklineData: [2.5, 2.4, 2.3, 2.2, 2.1, 2.1], color: 'blue' },
];

const getSideKPIs = (t: (key: string) => string): (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] => [
    { id: '5', label: t('var_cost_volatility'), subtitle: t('std_dev'), value: t('high'), change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [60, 75, 50, 80, 65, 70], color: 'blue' },
    { id: '6', label: t('break_even_impact'), subtitle: t('revenue_needed'), value: '$1.2M', change: '0', trend: 'neutral', icon: <TargetIcon size={18} />, sparklineData: [1.2, 1.2, 1.2, 1.2, 1.2, 1.2], color: 'blue' },
    { id: '7', label: t('cost_rigidity'), subtitle: t('fixed_total'), value: '65%', change: '-1.5%', trend: 'down', icon: <Lock size={18} />, sparklineData: [68, 67, 67, 66, 66, 65], color: 'blue' },
    { id: '8', label: t('optimization_score'), subtitle: t('cost_efficiency'), value: '78/100', change: '+4', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [70, 72, 74, 75, 76, 78], color: 'blue' },
];

// --- Chart Data getter functions ---
const getFixedVarTrend = (t: (key: string) => string) => [
    { name: t('jan'), Fixed: 70000, Variable: 30000 },
    { name: t('feb'), Fixed: 70000, Variable: 35000 },
    { name: t('mar'), Fixed: 70000, Variable: 32000 },
    { name: t('apr'), Fixed: 70000, Variable: 40000 },
    { name: t('may'), Fixed: 70000, Variable: 38000 },
    { name: t('jun'), Fixed: 70000, Variable: 45230 },
];

const getCostStructure = (t: (key: string) => string) => [
    { value: 65, name: t('fixed') },
    { value: 35, name: t('variable') }
];

// --- Table Data getter function ---
const getExpenseClassification = (t: (key: string) => string) => [
    { name: t('office_rent'), type: t('fixed'), amount: '$20,000', frequency: t('monthly'), category: t('facilities') },
    { name: t('salaries'), type: t('fixed'), amount: '$45,000', frequency: t('monthly'), category: t('payroll') },
    { name: t('ad_spend'), type: t('variable'), amount: '$12,000', frequency: t('ad_hoc'), category: t('marketing') },
    { name: t('shipping'), type: t('variable'), amount: '$5,000', frequency: t('per_order'), category: t('logistics') },
    { name: t('utilities'), type: t('semi_var'), amount: '$1,500', frequency: t('monthly'), category: t('facilities') },
];

// Matrix Data getter function
const getMatrixData = (t: (key: string) => string) => [
    [1, 9, t('rent'), t('fixed')],
    [2, 8, t('salaries'), t('fixed')],
    [8, 6, t('ad_spend'), t('variable')],
    [9, 4, t('shipping'), t('variable')],
    [5, 5, t('utilities'), t('semi_var')]
];

// Additional chart data getter functions
const getFixedByCategory = (t: (key: string) => string) => [
    { name: t('salaries'), value: 45000 },
    { name: t('rent'), value: 20000 },
    { name: t('insurance'), value: 5000 },
    { name: t('depreciation'), value: 3000 },
    { name: t('subscriptions'), value: 2000 },
];

const getVariableBreakdown = (t: (key: string) => string) => [
    { value: 35, name: t('marketing') },
    { value: 28, name: t('shipping') },
    { value: 22, name: t('commissions') },
    { value: 15, name: t('utilities') }
];

export const FixedVariableDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t } = useLanguage();
    const [showInfo, setShowInfo] = useState(false);
    const isLoading = useFirstMountLoading('fixed-variable-dashboard', 1200);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Get translated data
    const TOP_KPIS = getTopKPIs(t);
    const SIDE_KPIS = getSideKPIs(t);
    const FIXED_VAR_TREND = getFixedVarTrend(t);
    const COST_STRUCTURE = getCostStructure(t);
    const EXPENSE_CLASSIFICATION = getExpenseClassification(t);
    const MATRIX_DATA = getMatrixData(t);
    const FIXED_BY_CATEGORY = getFixedByCategory(t);
    const VARIABLE_BREAKDOWN = getVariableBreakdown(t);

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

    // Variable Breakdown Pie
    const variablePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: VARIABLE_BREAKDOWN,
            color: ['#3b82f6', '#0ea5e9', '#8b5cf6', '#10b981']
        }]
    };

    // Matrix Chart (Scatter)
    const matrixOption: EChartsOption = {
        title: { text: t('cost_rigidity_matrix'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        grid: { top: 30, right: 30, bottom: 20, left: 30, containLabel: true },
        tooltip: {
            formatter: (params: any) => {
                return `<b>${params.value[2]}</b><br/>${t('impact')}: ${params.value[0]}<br/>${t('rigidity')}: ${params.value[1]}<br/>${t('type')}: ${params.value[3]}`;
            }
        },
        xAxis: { name: t('flexibility'), type: 'value', min: 0, max: 10, splitLine: { show: false } },
        yAxis: { name: t('impact'), type: 'value', min: 0, max: 10, splitLine: { show: false } },
        series: [{
            type: 'scatter',
            symbolSize: 20,
            data: MATRIX_DATA,
            itemStyle: {
                color: (params: any) => {
                    const type = params.value[3];
                    const fixedTrans = t('fixed');
                    const variableTrans = t('variable');
                    return type === fixedTrans ? '#64748b' : type === variableTrans ? '#3b82f6' : '#f59e0b';
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
                        <h1 className="text-2xl font-bold">{t('fixed_variable')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fixed_variable_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-slate-600 dark:text-gray-400 dark:hover:text-slate-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-slate-600 dark:text-gray-400 dark:hover:text-slate-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-slate-500" />
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
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Bar Charts Side by Side --- */}
                <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('cost_structure_trend')}</h3>
                                <p className="text-xs text-gray-400">{t('fixed_slate_variable_blue')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={FIXED_VAR_TREND} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" fontSize={10} />
                                        <Bar dataKey="Fixed" stackId="a" fill="#dbeafe" radius={[0, 0, 0, 0]} barSize={24} animationDuration={1000} />
                                        <Bar dataKey="Variable" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('fixed_cost_breakdown')}</h3>
                                <p className="text-xs text-gray-400">{t('major_fixed_expenses')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={FIXED_BY_CATEGORY} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
                        </>
                    )}
                </div>

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                    {/* Cost Structure Pie */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        {isLoading ? (
                            <PieChartSkeleton />
                        ) : (
                            <>
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('current_split')}</h3>
                                    <p className="text-xs text-gray-400">{t('fixed_vs_variable_ratio')}</p>
                                </div>
                                <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                            </>
                        )}
                    </div>

                    {/* Variable Breakdown Pie */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        {isLoading ? (
                            <PieChartSkeleton />
                        ) : (
                            <>
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('variable_cost_mix')}</h3>
                                    <p className="text-xs text-gray-400">{t('variable_expense_types')}</p>
                                </div>
                                <MemoizedChart option={variablePieOption} style={{ height: '180px' }} />
                            </>
                        )}
                    </div>
                </div>

                {/* 4 KPIs in 2x2 grid */}
                <div className="col-span-1 md:col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
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
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-5">
                            <TableSkeleton />
                        </div>
                    ) : (
                        <>
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('expense_classification')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className="px-5 py-3">{t('expense_name')}</th>
                                            <th className="px-5 py-3">{t('type')}</th>
                                            <th className="px-5 py-3">{t('category')}</th>
                                            <th className="px-5 py-3 text-end">{t('amount')}</th>
                                            <th className="px-5 py-3 text-end">{t('frequency')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {EXPENSE_CLASSIFICATION.map((row) => (
                                            <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.type}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.category}</td>
                                                <td className="px-5 py-3 text-end text-gray-900 dark:text-gray-100">{row.amount}</td>
                                                <td className="px-5 py-3 text-end text-gray-500 dark:text-gray-400">{row.frequency}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Companion Chart: Matrix (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <MemoizedChart option={matrixOption} style={{ height: '300px', width: '100%' }} />
                    )}
                </div>

            </div>
        </div>
    );
};
