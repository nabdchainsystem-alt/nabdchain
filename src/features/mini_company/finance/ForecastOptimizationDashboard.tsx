import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, TrendUp, Warning, MagicWand, Graph, Crosshair, ShieldCheck } from 'phosphor-react';
import { ForecastOptimizationInfo } from './ForecastOptimizationInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

// --- KPI Data (as functions to support translation) ---
const getTopKPIs = (t: (key: string) => string): (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] => [
    { id: '1', label: t('forecasted_expenses'), subtitle: t('next_month'), value: '0', rawValue: 135000, isCurrency: true, change: '+5%', trend: 'up', icon: <Graph size={18} />, sparklineData: [120, 125, 128, 130, 132, 135], color: 'blue' },
    { id: '2', label: t('forecast_accuracy'), subtitle: t('historical'), value: '94%', change: '+1%', trend: 'up', icon: <Crosshair size={18} />, sparklineData: [92, 93, 93, 94, 94, 94], color: 'blue' },
    { id: '3', label: t('expected_savings'), subtitle: t('identified'), value: '0', rawValue: 8500, isCurrency: true, change: '+500', trend: 'up', icon: <MagicWand size={18} />, sparklineData: [5, 6, 7, 7, 8, 8.5], color: 'blue' },
    { id: '4', label: t('cost_reduction'), subtitle: t('potential'), value: '12%', change: '0%', trend: 'neutral', icon: <TrendUp size={18} />, sparklineData: [12, 12, 12, 12, 12, 12], color: 'blue' },
];

const getSideKPIs = (t: (key: string) => string): (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] => [
    { id: '5', label: t('risk_exposure'), subtitle: t('unbudgeted'), value: '0', rawValue: 2000, isCurrency: true, change: '-500', trend: 'down', icon: <Warning size={18} />, sparklineData: [3, 2.8, 2.5, 2.2, 2.1, 2], color: 'blue' },
    { id: '6', label: t('optimization_actions'), subtitle: t('open_items'), value: '5', change: '+2', trend: 'up', icon: <MagicWand size={18} />, sparklineData: [3, 3, 3, 4, 4, 5], color: 'blue' },
    { id: '7', label: t('confidence_level'), subtitle: t('model'), value: t('high'), change: '', trend: 'neutral', icon: <ShieldCheck size={18} />, sparklineData: [90, 90, 90, 90, 90, 90], color: 'blue' },
    { id: '8', label: t('roi_expected'), subtitle: t('initiatives'), value: '18%', change: '+3%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [12, 13, 14, 15, 16, 18], color: 'blue' },
];

// --- Translated Data Functions ---
const getForecastByCategory = (t: (key: string) => string) => [
    { name: t('travel'), Current: 25000, Forecast: 28000 },
    { name: t('office'), Current: 15000, Forecast: 14500 },
    { name: t('software'), Current: 40000, Forecast: 42000 },
    { name: t('marketing'), Current: 30000, Forecast: 35000 },
    { name: t('legal'), Current: 10000, Forecast: 10000 },
];

const getFutureAllocation = (t: (key: string) => string) => [
    { value: 42000, name: t('software') },
    { value: 35000, name: t('marketing') },
    { value: 28000, name: t('travel') },
    { value: 14500, name: t('office') },
    { value: 10000, name: t('legal') }
];

const getOptimizationTable = (t: (key: string) => string) => [
    { category: t('software'), rawCurrent: 40000, rawForecast: 42000, action: t('consolidate_licenses'), rawSaving: 3500 },
    { category: t('travel'), rawCurrent: 25000, rawForecast: 28000, action: t('use_partner_hotels'), rawSaving: 2000 },
    { category: t('office'), rawCurrent: 15000, rawForecast: 14500, action: t('bulk_supplier'), rawSaving: 1500 },
    { category: t('marketing'), rawCurrent: 30000, rawForecast: 35000, action: t('review_ad_spend'), rawSaving: 1000 },
    { category: t('utilities'), rawCurrent: 5000, rawForecast: 5200, action: t('energy_audit'), rawSaving: 500 },
];

const getLandscapeData = (t: (key: string) => string) => [
    [2, 3500, t('software')],
    [3, 2000, t('travel')],
    [1, 1500, t('office')],
    [5, 1000, t('marketing')],
    [1, 500, t('utilities')],
    [8, 5000, t('staffing_high_risk')]
];

const getSavingsByInitiative = (t: (key: string) => string) => [
    { name: t('license_consolidation'), value: 3500 },
    { name: t('travel_policy'), value: 2000 },
    { name: t('bulk_purchasing'), value: 1500 },
    { name: t('energy_efficiency'), value: 1000 },
    { name: t('outsourcing'), value: 500 },
];

const getOptimizationStatus = (t: (key: string) => string) => [
    { value: 45, name: t('implemented') },
    { value: 30, name: t('in_progress') },
    { value: 25, name: t('planned') }
];

export const ForecastOptimizationDashboard: React.FC = () => {
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

    // Get translated KPI data
    const TOP_KPIS = useMemo(() => getTopKPIs(t), [t]);
    const SIDE_KPIS = useMemo(() => getSideKPIs(t), [t]);

    // Get translated chart/table data
    const FORECAST_BY_CATEGORY = useMemo(() => getForecastByCategory(t), [t]);
    const FUTURE_ALLOCATION = useMemo(() => getFutureAllocation(t), [t]);
    const OPTIMIZATION_TABLE = useMemo(() => getOptimizationTable(t), [t]);
    const LANDSCAPE_DATA = useMemo(() => getLandscapeData(t), [t]);
    const SAVINGS_BY_INITIATIVE = useMemo(() => getSavingsByInitiative(t), [t]);
    const OPTIMIZATION_STATUS = useMemo(() => getOptimizationStatus(t), [t]);

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
            data: FUTURE_ALLOCATION,
            color: ['#8b5cf6', '#f59e0b', '#3b82f6', '#10b981', '#6366f1']
        }]
    }), [FUTURE_ALLOCATION]);

    // Optimization Status Pie
    const statusPieOption = useMemo<EChartsOption>(() => ({
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
            data: OPTIMIZATION_STATUS,
            color: ['#10b981', '#3b82f6', '#f59e0b']
        }]
    }), [OPTIMIZATION_STATUS]);

    // Scatter Chart (Landscape)
    const scatterOption = useMemo<EChartsOption>(() => ({
        title: { text: t('optimization_landscape'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        grid: { top: 30, right: 40, bottom: 20, left: 40, containLabel: true },
        tooltip: {
            formatter: (params: any) => {
                return `<b>${params.value[2]}</b><br/>Risk: ${params.value[0]}<br/>Saving: $${params.value[1]}`;
            }
        },
        xAxis: { type: 'value', name: t('implementation_risk'), min: 0, max: 10 },
        yAxis: { type: 'value', name: t('potential_saving') },
        series: [{
            type: 'scatter',
            symbolSize: (data: any) => Math.min(Math.max(data[1] / 100, 15), 50),
            data: LANDSCAPE_DATA,
            itemStyle: {
                color: (params: any) => {
                    const risk = params.value[0];
                    return risk > 6 ? '#ef4444' : risk > 3 ? '#f59e0b' : '#10b981';
                },
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.2)'
            },
            label: { show: true, formatter: (param: any) => param.value[2], position: 'top', color: '#6b7280' }
        }]
    }), [LANDSCAPE_DATA, t]);

    // Bar Chart - Forecast by Category (grouped)
    const forecastByCategoryOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, data: ['Current', 'Forecast'], itemWidth: 10, itemHeight: 10 },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: FORECAST_BY_CATEGORY.map(d => d.name),
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
            { type: 'bar', name: 'Current', data: FORECAST_BY_CATEGORY.map(d => d.Current), itemStyle: { color: '#dbeafe', borderRadius: [4, 4, 0, 0] }, barWidth: 12 },
            { type: 'bar', name: 'Forecast', data: FORECAST_BY_CATEGORY.map(d => d.Forecast), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: 12 },
        ],
    }), [FORECAST_BY_CATEGORY, isRTL]);

    // Bar Chart - Savings by Initiative
    const savingsByInitiativeOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: SAVINGS_BY_INITIATIVE.map(d => d.name),
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
            data: SAVINGS_BY_INITIATIVE.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 24,
        }],
    }), [SAVINGS_BY_INITIATIVE, isRTL]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <ForecastOptimizationInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <MagicWand size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('forecast_optimization')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fo_subtitle')}</p>
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
                            color={kpi.color as any || 'blue'}
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
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('forecast_by_category')}</h3>
                                <p className="text-xs text-gray-400">{t('current_vs_forecast')}</p>
                            </div>
                            <MemoizedChart option={forecastByCategoryOption} style={{ height: '220px', width: '100%' }} />
                        </>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('savings_by_initiative')}</h3>
                                <p className="text-xs text-gray-400">{t('potential_savings_breakdown')}</p>
                            </div>
                            <MemoizedChart option={savingsByInitiativeOption} style={{ height: '220px', width: '100%' }} />
                        </>
                    )}
                </div>

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                    {/* Future Allocation Pie */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        {isLoading ? (
                            <PieChartSkeleton />
                        ) : (
                            <>
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('future_allocation')}</h3>
                                    <p className="text-xs text-gray-400">{t('projected_spend_share')}</p>
                                </div>
                                <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                            </>
                        )}
                    </div>

                    {/* Optimization Status Pie */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        {isLoading ? (
                            <PieChartSkeleton />
                        ) : (
                            <>
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('optimization_status')}</h3>
                                    <p className="text-xs text-gray-400">{t('initiative_progress')}</p>
                                </div>
                                <MemoizedChart option={statusPieOption} style={{ height: '180px' }} />
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
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                                color={kpi.color as any || 'indigo'}
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
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('optimization_opportunities')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className="px-5 py-3 text-start">{t('category')}</th>
                                            <th className="px-5 py-3 text-end">{t('current')}</th>
                                            <th className="px-5 py-3 text-end">{t('forecast')}</th>
                                            <th className="px-5 py-3 text-start">{t('action')}</th>
                                            <th className="px-5 py-3 text-end">{t('saving')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {OPTIMIZATION_TABLE.map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 text-start font-medium text-gray-900 dark:text-gray-100">{row.category}</td>
                                                <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{formatCurrency(row.rawCurrent, currency.code, currency.symbol)}</td>
                                                <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{formatCurrency(row.rawForecast, currency.code, currency.symbol)}</td>
                                                <td className="px-5 py-3 text-start text-indigo-600 font-medium">{row.action}</td>
                                                <td className="px-5 py-3 text-end text-green-600 font-bold">{formatCurrency(row.rawSaving, currency.code, currency.symbol)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Companion Chart: Landscape (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <MemoizedChart option={scatterOption} style={{ height: '300px', width: '100%' }} />
                    )}
                </div>

            </div>
        </div>
    );
};
