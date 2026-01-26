import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, TrendUp, Warning, Tag, ChartBar, Target, ArrowDown, Activity } from 'phosphor-react';
import { CategoryAnalysisInfo } from './CategoryAnalysisInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

// --- KPI Data getter functions ---
const getTopKPIs = (t: (key: string) => string): (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] => [
    { id: '1', label: t('total_categories'), subtitle: t('active_budget_lines'), value: '15', change: '+2', trend: 'up', icon: <Tag size={18} />, sparklineData: [12, 12, 13, 13, 14, 15], color: 'blue' },
    { id: '2', label: t('highest_cost_category'), subtitle: t('current_period'), value: t('payroll'), change: '', trend: 'neutral', icon: <ArrowDown size={18} />, sparklineData: [45000, 46000, 45500, 48000, 47000, 45000], color: 'blue' },
    { id: '3', label: t('category_variance'), subtitle: t('avg_deviation'), value: '8.5%', change: '-1.2%', trend: 'down', icon: <Activity size={18} />, sparklineData: [10, 9.5, 9.2, 8.8, 8.6, 8.5], color: 'blue' },
    { id: '4', label: t('budget_breach_count'), subtitle: t('categories_over_budget'), value: '2', change: '-1', trend: 'down', icon: <Warning size={18} />, sparklineData: [3, 3, 2, 2, 3, 2], color: 'blue' },
];

const getSideKPIs = (t: (key: string) => string): (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] => [
    { id: '5', label: t('avg_category_spend'), subtitle: t('per_month'), value: '0', rawValue: 8250, isCurrency: true, change: '+3%', trend: 'up', icon: <ChartBar size={18} />, sparklineData: [8000, 8100, 8050, 8200, 8250, 8250], color: 'blue' },
    { id: '6', label: t('volatility_index'), subtitle: t('fluctuation_score'), value: t('medium'), change: '', trend: 'neutral', icon: <Activity size={18} />, sparklineData: [40, 45, 42, 48, 45, 45], color: 'blue' },
    { id: '7', label: t('control_score'), subtitle: t('budget_adherence'), value: '88/100', change: '+2', trend: 'up', icon: <Target size={18} />, sparklineData: [82, 84, 85, 86, 87, 88], color: 'blue' },
    { id: '8', label: t('category_growth_rate'), subtitle: t('mom_average'), value: '+2.3%', change: '-0.5%', trend: 'down', icon: <TrendUp size={18} />, sparklineData: [3.2, 3.0, 2.8, 2.6, 2.4, 2.3], color: 'blue' },
];

// --- Chart Data getter functions ---
const getSpendPerCategory = (t: (key: string) => string) => [
    { name: t('payroll'), value: 45000 },
    { name: t('rent'), value: 20000 },
    { name: t('marketing'), value: 15000 },
    { name: t('r_and_d'), value: 12000 },
    { name: t('it'), value: 8000 },
    { name: t('sales'), value: 7500 },
    { name: t('admin'), value: 5000 },
];

const getCategoryShare = (t: (key: string) => string) => [
    { value: 40, name: t('payroll') },
    { value: 18, name: t('rent') },
    { value: 13, name: t('marketing') },
    { value: 11, name: t('r_and_d') },
    { value: 7, name: t('it') },
    { value: 11, name: t('other') }
];

// --- Table Data getter function ---
const getCategoryTable = (t: (key: string) => string) => [
    { category: t('payroll'), rawBudget: 46000, rawActual: 45000, rawVariance: -1000, status: t('under_budget'), statusKey: 'under' },
    { category: t('rent'), rawBudget: 20000, rawActual: 20000, rawVariance: 0, status: t('on_track'), statusKey: 'on_track' },
    { category: t('marketing'), rawBudget: 12000, rawActual: 15000, rawVariance: 3000, status: t('over_budget'), statusKey: 'over' },
    { category: t('r_and_d'), rawBudget: 10000, rawActual: 12000, rawVariance: 2000, status: t('over_budget'), statusKey: 'over' },
    { category: t('it'), rawBudget: 9000, rawActual: 8000, rawVariance: -1000, status: t('under_budget'), statusKey: 'under' },
];

// Radar Data getter function
const getRadarIndicators = (t: (key: string) => string) => [
    { name: t('payroll'), max: 100 },
    { name: t('rent'), max: 100 },
    { name: t('marketing'), max: 100 },
    { name: t('r_and_d'), max: 100 },
    { name: t('it'), max: 100 }
];

// Category Trend data (keys stay the same for Recharts dataKey mapping)
const getCategoryTrend = (t: (key: string) => string) => [
    { name: t('jan'), Payroll: 44000, Marketing: 12000, IT: 7500 },
    { name: t('feb'), Payroll: 45000, Marketing: 13000, IT: 8000 },
    { name: t('mar'), Payroll: 44500, Marketing: 14000, IT: 7800 },
    { name: t('apr'), Payroll: 45500, Marketing: 15000, IT: 8200 },
    { name: t('may'), Payroll: 45000, Marketing: 14500, IT: 8000 },
];

const getBudgetStatus = (t: (key: string) => string) => [
    { value: 40, name: t('on_track') },
    { value: 35, name: t('under_budget') },
    { value: 25, name: t('over_budget') }
];

export const CategoryAnalysisDashboard: React.FC = () => {
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

    // Memoize translated data to prevent re-renders
    const TOP_KPIS = useMemo(() => getTopKPIs(t), [t]);
    const SIDE_KPIS = useMemo(() => getSideKPIs(t), [t]);
    const SPEND_PER_CATEGORY = useMemo(() => getSpendPerCategory(t), [t]);
    const CATEGORY_SHARE = useMemo(() => getCategoryShare(t), [t]);
    const CATEGORY_TABLE = useMemo(() => getCategoryTable(t), [t]);
    const RADAR_INDICATORS = useMemo(() => getRadarIndicators(t), [t]);
    const CATEGORY_TREND = useMemo(() => getCategoryTrend(t), [t]);
    const BUDGET_STATUS = useMemo(() => getBudgetStatus(t), [t]);

    // --- Memoized ECharts Options ---

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
            data: CATEGORY_SHARE,
            color: ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6']
        }]
    }), [CATEGORY_SHARE]);

    // Budget Status Pie
    const budgetStatusPieOption = useMemo<EChartsOption>(() => ({
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
            data: BUDGET_STATUS,
            color: ['#3b82f6', '#10b981', '#ef4444']
        }]
    }), [BUDGET_STATUS]);

    // Bar Chart - Spend per Category
    const spendPerCategoryOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: SPEND_PER_CATEGORY.map(d => d.name),
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
            data: SPEND_PER_CATEGORY.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 20,
        }],
    }), [SPEND_PER_CATEGORY, isRTL]);

    // Bar Chart - Category Trend (grouped)
    const categoryTrendOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, data: ['Payroll', 'Marketing', 'IT'], itemWidth: 10, itemHeight: 10 },
        grid: { left: isRTL ? 20 : 40, right: isRTL ? 40 : 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: CATEGORY_TREND.map(d => d.name),
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
            { type: 'bar', name: 'Payroll', data: CATEGORY_TREND.map(d => d.Payroll), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: 10 },
            { type: 'bar', name: 'Marketing', data: CATEGORY_TREND.map(d => d.Marketing), itemStyle: { color: '#60a5fa', borderRadius: [4, 4, 0, 0] }, barWidth: 10 },
            { type: 'bar', name: 'IT', data: CATEGORY_TREND.map(d => d.IT), itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] }, barWidth: 10 },
        ],
    }), [CATEGORY_TREND, isRTL]);

    // Radar Chart - Category Deviation
    const radarOption = useMemo<EChartsOption>(() => ({
        title: { text: t('budget_adherence'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
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
                    value: [98, 100, 125, 120, 89],
                    name: t('budget_adherence'),
                    areaStyle: { color: 'rgba(239, 68, 68, 0.4)' },
                    lineStyle: { color: '#ef4444' },
                    itemStyle: { color: '#ef4444' }
                }
            ]
        }]
    }), [RADAR_INDICATORS, t]);

    if (isLoading) {
        return (
            <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-start gap-2">
                        <Tag size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                        <div>
                            <h1 className="text-2xl font-bold">{t('category_analysis')}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('category_analysis_desc')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Row 1: 4 KPI Skeletons */}
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="col-span-1 h-[120px] rounded-xl shimmer" />
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
                            <div key={i} className="h-[120px] rounded-xl shimmer" />
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
                    <Tag size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('category_analysis')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('category_analysis_desc')}</p>
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
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color="blue"
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Bar Charts Side by Side --- */}

                {/* ECharts: Spend per Category (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_per_category')}</h3>
                        <p className="text-xs text-gray-400">{t('actual_spend_breakdown')}</p>
                    </div>
                    <MemoizedChart option={spendPerCategoryOption} style={{ height: '220px', width: '100%' }} />
                </div>

                {/* ECharts: Category Trend (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('category_trend')}</h3>
                        <p className="text-xs text-gray-400">{t('monthly_spend_by_category')}</p>
                    </div>
                    <MemoizedChart option={categoryTrendOption} style={{ height: '220px', width: '100%' }} />
                </div>

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}

                {/* Pie Charts in nested 2-col grid */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Category Share (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('category_allocation')}</h3>
                            <p className="text-xs text-gray-400">{t('departmental_breakdown')}</p>
                        </div>
                        <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                    </div>

                    {/* ECharts: Budget Status (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('budget_status')}</h3>
                            <p className="text-xs text-gray-400">{t('categories_by_status')}</p>
                        </div>
                        <MemoizedChart option={budgetStatusPieOption} style={{ height: '180px' }} />
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
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
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
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('budget_vs_actual')}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3 text-start">{t('category')}</th>
                                    <th className="px-5 py-3 text-end">{t('budget')}</th>
                                    <th className="px-5 py-3 text-end">{t('actual')}</th>
                                    <th className="px-5 py-3 text-end">{t('variance')}</th>
                                    <th className="px-5 py-3 text-center">{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {CATEGORY_TABLE.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.category}</td>
                                        <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{formatCurrency(row.rawBudget, currency.code, currency.symbol)}</td>
                                        <td className="px-5 py-3 text-end text-gray-900 dark:text-gray-100">{formatCurrency(row.rawActual, currency.code, currency.symbol)}</td>
                                        <td className={`px-5 py-3 text-end font-medium ${row.rawVariance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{row.rawVariance > 0 ? '+' : ''}{formatCurrency(row.rawVariance, currency.code, currency.symbol)}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.statusKey === 'over' ? 'bg-red-100 text-red-700' :
                                                row.statusKey === 'under' ? 'bg-emerald-100 text-emerald-700' :
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
                    <MemoizedChart option={radarOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
