import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, TrendUp, Warning, UsersThree, Buildings, Target, Trophy, ChartPieSlice } from 'phosphor-react';
import { DeptAccountabilityInfo } from './DeptAccountabilityInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- KPI Data (will be translated in component) ---
const getTopKPIs = (t: (key: string) => string): (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] => [
    { id: '1', label: t('departments_count'), subtitle: t('active'), value: '8', change: '0', trend: 'neutral', icon: <Buildings size={18} />, sparklineData: [8, 8, 8, 8, 8, 8], color: 'blue' },
    { id: '2', label: t('highest_spending'), subtitle: t('engineering'), value: '$120k', change: '+5%', trend: 'up', icon: <UsersThree size={18} />, sparklineData: [110, 115, 112, 118, 120, 120], color: 'blue' },
    { id: '3', label: t('budget_variance'), subtitle: t('total_excess'), value: '$12.5k', change: '+2k', trend: 'down', icon: <Warning size={18} />, sparklineData: [8, 9, 10, 11, 12, 12.5], color: 'blue' },
    { id: '4', label: t('avg_dept_expense'), subtitle: t('per_month'), value: '$45k', change: '+3%', trend: 'up', icon: <Target size={18} />, sparklineData: [42, 43, 44, 44, 45, 45], color: 'blue' },
];

const getSideKPIs = (t: (key: string) => string): (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] => [
    { id: '5', label: t('over_budget_depts'), subtitle: t('red_flags'), value: '2', change: '+1', trend: 'down', icon: <Warning size={18} />, sparklineData: [1, 1, 0, 1, 1, 2], color: 'blue' },
    { id: '6', label: t('efficiency_score'), subtitle: t('org_wide'), value: '85/100', change: '+2', trend: 'up', icon: <Trophy size={18} />, sparklineData: [80, 82, 83, 84, 84, 85], color: 'blue' },
    { id: '7', label: t('accountability_index'), subtitle: t('compliance'), value: '92%', change: '0%', trend: 'neutral', icon: <ChartPieSlice size={18} />, sparklineData: [90, 91, 92, 92, 92, 92], color: 'blue' },
    { id: '8', label: t('cost_per_employee'), subtitle: t('avg_monthly'), value: '$2,850', change: '-2%', trend: 'down', icon: <UsersThree size={18} />, sparklineData: [3000, 2950, 2900, 2880, 2860, 2850], color: 'blue' },
];

// --- Translated Data Functions ---
const getSpendPerDept = (t: (key: string) => string) => [
    { name: t('engineering'), Amount: 120000 },
    { name: t('marketing'), Amount: 85000 },
    { name: t('sales'), Amount: 95000 },
    { name: t('hr'), Amount: 25000 },
    { name: t('operations'), Amount: 45000 },
    { name: t('finance'), Amount: 30000 },
];

const getDeptShare = (t: (key: string) => string) => [
    { value: 120000, name: t('engineering') },
    { value: 95000, name: t('sales') },
    { value: 85000, name: t('marketing') },
    { value: 45000, name: t('operations') },
    { value: 30000, name: t('finance') },
    { value: 25000, name: t('hr') }
];

const getDeptPerformance = (t: (key: string) => string) => [
    { dept: t('engineering'), budget: '$110,000', actual: '$120,000', variance: '+$10,000', owner: 'Mike Ross' },
    { dept: t('sales'), budget: '$100,000', actual: '$95,000', variance: '-$5,000', owner: 'Harvey Specter' },
    { dept: t('marketing'), budget: '$80,000', actual: '$85,000', variance: '+$5,000', owner: 'Donna Paulsen' },
    { dept: t('operations'), budget: '$50,000', actual: '$45,000', variance: '-$5,000', owner: 'Louis Litt' },
    { dept: t('hr'), budget: '$25,000', actual: '$25,000', variance: '$0', owner: 'Rachel Zane' },
];

// Network Graph Data (needs translation for labels)
const getNetworkNodes = (t: (key: string) => string) => [
    { id: '0', name: t('finance'), symbolSize: 30, value: 30000, category: 0 },
    { id: '1', name: t('engineering'), symbolSize: 50, value: 120000, category: 1 },
    { id: '2', name: t('sales'), symbolSize: 45, value: 95000, category: 1 },
    { id: '3', name: t('marketing'), symbolSize: 40, value: 85000, category: 1 },
    { id: '4', name: t('operations'), symbolSize: 35, value: 45000, category: 2 },
    { id: '5', name: t('hr'), symbolSize: 25, value: 25000, category: 2 },
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

const getBudgetVsActual = (t: (key: string) => string) => [
    { name: t('engineering'), Budget: 110000, Actual: 120000 },
    { name: t('sales'), Budget: 100000, Actual: 95000 },
    { name: t('marketing'), Budget: 80000, Actual: 85000 },
    { name: t('operations'), Budget: 50000, Actual: 45000 },
    { name: t('hr'), Budget: 25000, Actual: 25000 },
];

const getVarianceStatus = (t: (key: string) => string) => [
    { value: 40, name: t('over_budget') },
    { value: 35, name: t('on_track') },
    { value: 25, name: t('under_budget') }
];

export const DeptAccountabilityDashboard: React.FC = () => {
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

    // Get translated KPIs
    const TOP_KPIS = useMemo(() => getTopKPIs(t), [t]);
    const SIDE_KPIS = useMemo(() => getSideKPIs(t), [t]);

    // Get translated chart/table data
    const SPEND_PER_DEPT = useMemo(() => getSpendPerDept(t), [t]);
    const DEPT_SHARE = useMemo(() => getDeptShare(t), [t]);
    const DEPT_PERFORMANCE = useMemo(() => getDeptPerformance(t), [t]);
    const NETWORK_NODES = useMemo(() => getNetworkNodes(t), [t]);
    const BUDGET_VS_ACTUAL = useMemo(() => getBudgetVsActual(t), [t]);
    const VARIANCE_STATUS = useMemo(() => getVarianceStatus(t), [t]);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

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
            data: DEPT_SHARE,
            color: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#6366f1', '#ec4899']
        }]
    }), [DEPT_SHARE]);

    // Variance Status Pie
    const variancePieOption = useMemo<EChartsOption>(() => ({
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
            data: VARIANCE_STATUS,
            color: ['#ef4444', '#3b82f6', '#10b981']
        }]
    }), [VARIANCE_STATUS]);

    // Bar Chart - Spend per Dept
    const spendPerDeptOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: SPEND_PER_DEPT.map(d => d.name),
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
            data: SPEND_PER_DEPT.map(d => d.Amount),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 24,
        }],
    }), [SPEND_PER_DEPT, isRTL]);

    // Bar Chart - Budget vs Actual (grouped)
    const budgetVsActualOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, data: ['Budget', 'Actual'], itemWidth: 10, itemHeight: 10 },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: BUDGET_VS_ACTUAL.map(d => d.name),
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
            { type: 'bar', name: 'Budget', data: BUDGET_VS_ACTUAL.map(d => d.Budget), itemStyle: { color: '#dbeafe', borderRadius: [4, 4, 0, 0] }, barWidth: 12 },
            { type: 'bar', name: 'Actual', data: BUDGET_VS_ACTUAL.map(d => d.Actual), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: 12 },
        ],
    }), [BUDGET_VS_ACTUAL, isRTL]);

    // Graph Chart
    const graphOption = useMemo<EChartsOption>(() => ({
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
    }), [NETWORK_NODES]);

    if (isLoading) {
        return (
            <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-start gap-2">
                        <Buildings size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                        <div>
                            <h1 className="text-2xl font-bold">{t('dept_accountability')}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('da_subtitle')}</p>
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
            <DeptAccountabilityInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Buildings size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('dept_accountability')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('da_subtitle')}</p>
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

                {/* ECharts: Spend per Dept (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_per_department')}</h3>
                        <p className="text-xs text-gray-400">{t('total_spend')}</p>
                    </div>
                    <MemoizedChart option={spendPerDeptOption} style={{ height: '220px', width: '100%' }} />
                </div>

                {/* ECharts: Budget vs Actual (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('budget_vs_actual')}</h3>
                        <p className="text-xs text-gray-400">{t('performance_comparison')}</p>
                    </div>
                    <MemoizedChart option={budgetVsActualOption} style={{ height: '220px', width: '100%' }} />
                </div>

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}

                {/* Pie Charts in nested 2-col grid */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Dept Share (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('cost_distribution')}</h3>
                            <p className="text-xs text-gray-400">{t('share_by_department')}</p>
                        </div>
                        <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                    </div>

                    {/* ECharts: Variance Status (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('variance_status')}</h3>
                            <p className="text-xs text-gray-400">{t('budget_adherence')}</p>
                        </div>
                        <MemoizedChart option={variancePieOption} style={{ height: '180px' }} />
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
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('department_performance')}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3 text-start">{t('department')}</th>
                                    <th className="px-5 py-3 text-end">{t('budget')}</th>
                                    <th className="px-5 py-3 text-end">{t('actual_spend')}</th>
                                    <th className="px-5 py-3 text-end">{t('variance')}</th>
                                    <th className="px-5 py-3 text-end">{t('owner')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {DEPT_PERFORMANCE.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.dept}</td>
                                        <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{row.budget}</td>
                                        <td className="px-5 py-3 text-end text-gray-900 dark:text-gray-100">{row.actual}</td>
                                        <td className={`px-5 py-3 text-end font-medium ${row.variance.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                                            {row.variance}
                                        </td>
                                        <td className="px-5 py-3 text-end text-gray-500 dark:text-gray-400 text-xs">{row.owner}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Network (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <MemoizedChart option={graphOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
