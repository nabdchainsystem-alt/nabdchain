import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, TrendUp, Warning, Receipt, ChartBar, Lock, ArrowDown } from 'phosphor-react';
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
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [showInfo, setShowInfo] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);
    const isLoading = useLoadingAnimation();

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Get translated data
    const TOP_KPIS = useMemo(() => getTopKPIs(t), [t]);
    const SIDE_KPIS = useMemo(() => getSideKPIs(t), [t]);
    const FIXED_VAR_TREND = useMemo(() => getFixedVarTrend(t), [t]);
    const COST_STRUCTURE = useMemo(() => getCostStructure(t), [t]);
    const EXPENSE_CLASSIFICATION = useMemo(() => getExpenseClassification(t), [t]);
    const MATRIX_DATA = useMemo(() => getMatrixData(t), [t]);
    const FIXED_BY_CATEGORY = useMemo(() => getFixedByCategory(t), [t]);
    const VARIABLE_BREAKDOWN = useMemo(() => getVariableBreakdown(t), [t]);

    // --- ECharts Options ---

    // Pie Chart
    const pieOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: COST_STRUCTURE,
            color: ['#64748b', '#3b82f6'] // Slate for Fixed, Blue for Variable
        }]
    }), [COST_STRUCTURE]);

    // Variable Breakdown Pie
    const variablePieOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: VARIABLE_BREAKDOWN,
            color: ['#3b82f6', '#0ea5e9', '#8b5cf6', '#10b981']
        }]
    }), [VARIABLE_BREAKDOWN]);

    // Bar Chart - Cost Structure Trend (stacked)
    const costStructureTrendOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, data: ['Fixed', 'Variable'], itemWidth: 10, itemHeight: 10 },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: FIXED_VAR_TREND.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        series: [
            { type: 'bar', name: 'Fixed', stack: 'total', data: FIXED_VAR_TREND.map(d => d.Fixed), itemStyle: { color: '#dbeafe' }, barWidth: 24 },
            { type: 'bar', name: 'Variable', stack: 'total', data: FIXED_VAR_TREND.map(d => d.Variable), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: 24 },
        ],
    }), [FIXED_VAR_TREND, isRTL]);

    // Bar Chart - Fixed Cost Breakdown
    const fixedByCategoryOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: FIXED_BY_CATEGORY.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        series: [{
            type: 'bar',
            data: FIXED_BY_CATEGORY.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 24,
        }],
    }), [FIXED_BY_CATEGORY, isRTL]);

    // Matrix Chart (Scatter)
    const matrixOption = useMemo<EChartsOption>(() => ({
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
    }), [MATRIX_DATA, t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <FixedVariableInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Receipt size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('fixed_variable')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fixed_variable_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={isFullScreen ? t('exit_full_screen') : t('full_screen')}
                    >
                        {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-blue-500" />
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
                            <MemoizedChart option={costStructureTrendOption} style={{ height: '220px', width: '100%' }} />
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
                            <MemoizedChart option={fixedByCategoryOption} style={{ height: '220px', width: '100%' }} />
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
                                            <th className="px-5 py-3 text-start">{t('expense_name')}</th>
                                            <th className="px-5 py-3 text-start">{t('type')}</th>
                                            <th className="px-5 py-3 text-start">{t('category')}</th>
                                            <th className="px-5 py-3 text-end">{t('amount')}</th>
                                            <th className="px-5 py-3 text-end">{t('frequency')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {EXPENSE_CLASSIFICATION.map((row) => (
                                            <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.name}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{row.type}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{row.category}</td>
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
