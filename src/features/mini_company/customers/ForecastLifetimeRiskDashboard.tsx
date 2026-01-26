import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, TrendUp, Warning, Lightning, Sparkle, Target, ChartLineUp, ShieldCheck } from 'phosphor-react';
import { ForecastLifetimeRiskInfo } from './ForecastLifetimeRiskInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

// Cone Data (Mocking a prediction interval) - static values don't need translation
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BASE_VALUE = 100;
const CONE_DATA = MONTHS.map((m, i) => {
    const growth = i * 5;
    const uncertainty = i * 2;
    return {
        month: m,
        lower: BASE_VALUE + growth - uncertainty,
        mean: BASE_VALUE + growth,
        upper: BASE_VALUE + growth + uncertainty
    };
});

// Raw table data with action keys for styling
const RISK_TABLE_DATA = [
    { customer: 'Omega Corp', rawCurrentCLV: 120000, rawForecastCLV: 150000, riskKey: 'low', actionKey: 'upsell_gold_plan' },
    { customer: 'Zeta Inc', rawCurrentCLV: 85000, rawForecastCLV: 90000, riskKey: 'medium', actionKey: 'schedule_qbr' },
    { customer: 'Theta LLC', rawCurrentCLV: 200000, rawForecastCLV: 180000, riskKey: 'high', actionKey: 'exec_intervention' },
    { customer: 'Sigma Co', rawCurrentCLV: 45000, rawForecastCLV: 60000, riskKey: 'low', actionKey: 'nurture_campaign' },
    { customer: 'Kappa Ltd', rawCurrentCLV: 95000, rawForecastCLV: 95000, riskKey: 'medium', actionKey: 'monitor_usage' },
];

export const ForecastLifetimeRiskDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';

    // --- KPI Data with translations ---
    const TOP_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '1', label: t('predicted_clv'), subtitle: t('ml_prediction'), value: '0', rawValue: 2400000, isCurrency: true, change: '+15%', trend: 'up', icon: <Sparkle size={18} />, sparklineData: [2.0, 2.1, 2.2, 2.3, 2.3, 2.4], color: 'blue' },
        { id: '2', label: t('lifetime_forecast'), subtitle: t('projected_value'), value: '92%', change: '+1%', trend: 'up', icon: <Target size={18} />, sparklineData: [88, 89, 90, 91, 91, 92], color: 'blue' },
        { id: '3', label: t('churn_probability'), subtitle: t('likelihood_to_churn'), value: '18', change: '-3', trend: 'up', icon: <Warning size={18} />, sparklineData: [25, 24, 22, 20, 19, 18], color: 'blue' },
        { id: '4', label: t('risk_score'), subtitle: t('composite_risk'), value: '5.2%', change: '-0.5%', trend: 'up', icon: <ChartLineUp size={18} />, sparklineData: [6.0, 5.8, 5.6, 5.5, 5.3, 5.2], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '5', label: t('upsell_opportunity'), subtitle: t('cross_sell_potential'), value: '0', rawValue: 450000, isCurrency: true, change: '+8%', trend: 'up', icon: <Lightning size={18} />, sparklineData: [400, 410, 420, 430, 440, 450], color: 'blue' },
        { id: '6', label: t('growth_potential'), subtitle: t('expansion_potential'), value: '+12%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [8, 9, 10, 10, 11, 12], color: 'blue' },
        { id: '7', label: t('revenue_at_risk'), subtitle: t('potential_loss'), value: t('high'), change: t('stable'), trend: 'neutral', icon: <ShieldCheck size={18} />, sparklineData: [90, 90, 90, 90, 90, 90], color: 'blue' },
        { id: '8', label: t('next_purchase'), subtitle: t('expected_date'), value: '12mo', change: t('stable'), trend: 'neutral', icon: <Target size={18} />, sparklineData: [12, 12, 12, 12, 12, 12], color: 'blue' },
    ], [t]);

    // --- Chart Data with translations ---
    const FORECAST_BY_SEGMENT = useMemo(() => [
        { name: t('high_value'), Value: 1200 },
        { name: t('mid_value'), Value: 850 },
        { name: t('low_value'), Value: 350 },
        { name: t('at_risk'), Value: 150 }
    ], [t]);

    const RISK_DISTRIBUTION = useMemo(() => [
        { value: 65, name: t('low') },
        { value: 25, name: t('medium') },
        { value: 10, name: t('high') }
    ], [t]);

    const GROWTH_BY_COHORT = useMemo(() => [
        { name: 'Q1 2023', Growth: 15 },
        { name: 'Q2 2023', Growth: 18 },
        { name: 'Q3 2023', Growth: 22 },
        { name: 'Q4 2023', Growth: 12 },
    ], []);

    const FORECAST_ACCURACY = useMemo(() => [
        { value: 72, name: t('high') },
        { value: 20, name: t('medium') },
        { value: 8, name: t('low') }
    ], [t]);

    // --- Table Data with translations ---
    const RISK_TABLE = useMemo(() => RISK_TABLE_DATA.map(item => ({
        ...item,
        risk: t(item.riskKey),
        action: t(item.actionKey)
    })), [t]);
    const [showInfo, setShowInfo] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const isLoading = useLoadingAnimation();

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart
    const pieOption: EChartsOption = useMemo(() => ({
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
            data: RISK_DISTRIBUTION,
            color: ['#10b981', '#f59e0b', '#ef4444']
        }]
    }), [RISK_DISTRIBUTION]);

    // Forecast Accuracy Pie
    const accuracyPieOption: EChartsOption = useMemo(() => ({
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
            data: FORECAST_ACCURACY,
            color: ['#10b981', '#f59e0b', '#ef4444']
        }]
    }), [FORECAST_ACCURACY]);

    // CLV Forecast Bar Chart
    const clvForecastOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: FORECAST_BY_SEGMENT.map(d => d.name),
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
            data: FORECAST_BY_SEGMENT.map(d => d.Value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 28,
        }],
    }), [FORECAST_BY_SEGMENT, isRTL]);

    // Growth by Cohort Bar Chart
    const growthByCohortOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: GROWTH_BY_COHORT.map(d => d.name),
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
            data: GROWTH_BY_COHORT.map(d => d.Growth),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 28,
        }],
    }), [GROWTH_BY_COHORT, isRTL]);

    // Area Chart (Cone)
    const coneOption: EChartsOption = useMemo(() => ({
        title: { text: t('revenue_projection'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: MONTHS, axisLine: { show: false }, axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
        series: [
            {
                name: 'Upper Bound',
                type: 'line',
                data: CONE_DATA.map(d => d.upper),
                smooth: true,
                lineStyle: { opacity: 0 },
                areaStyle: {
                    color: '#9333ea',
                    opacity: 0.1,
                    origin: 'start' // This is tricky for a "band", using stacked area logic usually better but simplified here as just upper/lower fill check
                },
                stack: 'confidence', // Not stacking in standard way to create band, actually need 'lower' to be invisible area and 'upper' to stack...
                // Let's simplify: Standard line for Mean, Area for range.
                // Actually better: Upper Bound line (transparent), Lower Bound line (transparent), Area between?
                // ECharts specific "confidence band" usually requires specific data struct.
                // Simplified approach: Just plot Mean line with an area gradient to show potential.
            },
            // Let's restart the series logic for a simple "visual" cone
            {
                name: 'Forecast Mean',
                type: 'line',
                data: CONE_DATA.map(d => d.mean),
                smooth: true,
                itemStyle: { color: '#9333ea' },
                lineStyle: { width: 3 }
            },
            {
                name: 'Range',
                type: 'line',
                data: CONE_DATA.map(d => d.mean), // Dummy center
                smooth: true,
                lineStyle: { opacity: 0 },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(147, 51, 234, 0.4)' }, { offset: 1, color: 'rgba(147, 51, 234, 0.05)' }]
                    }
                },
                // Making the "range" just a shadow/glow below for effect
            }
        ]
    }), [t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <ForecastLifetimeRiskInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Sparkle size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('forecast_lifetime_risk')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('forecast_lifetime_risk_desc')}</p>
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
                {isLoading ? (
                    <>
                        <div className="col-span-2"><ChartSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Forecast CLV (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('clv_forecast')}</h3>
                                <p className="text-xs text-gray-400">{t('projected_values')}</p>
                            </div>
                            <MemoizedChart option={clvForecastOption} style={{ height: '220px', width: '100%' }} />
                        </div>

                        {/* Growth by Cohort (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('growth_vs_risk')}</h3>
                                <p className="text-xs text-gray-400">{t('forecast_breakdown')}</p>
                            </div>
                            <MemoizedChart option={growthByCohortOption} style={{ height: '220px', width: '100%' }} />
                        </div>
                    </>
                )}

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2"><PieChartSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Pie Charts in nested 2-col grid */}
                        <div className="col-span-2 grid grid-cols-2 gap-6">
                            {/* ECharts: Risk Distribution (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('churn_prediction')}</h3>
                                    <p className="text-xs text-gray-400">{t('risk_over_time')}</p>
                                </div>
                                <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Forecast Accuracy (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('opportunity_matrix')}</h3>
                                    <p className="text-xs text-gray-400">{t('revenue_projection')}</p>
                                </div>
                                <MemoizedChart option={accuracyPieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        {/* 4 KPIs in 2x2 grid */}
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard
                                        {...kpi}
                                        value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                                        color="blue"
                                        className="h-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* --- Row 4: Table + Companion Chart --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2"><TableSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Table (2 cols) */}
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('at_risk_accounts')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className="px-5 py-3 text-start">{t('account')}</th>
                                            <th className="px-5 py-3 text-start">{t('predicted_clv')}</th>
                                            <th className="px-5 py-3 text-start">{t('lifetime_forecast')}</th>
                                            <th className="px-5 py-3 text-start">{t('risk_score')}</th>
                                            <th className="px-5 py-3 text-end">{t('action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {RISK_TABLE.map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.customer}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs text-start">{formatCurrency(row.rawCurrentCLV, currency.code, currency.symbol)}</td>
                                                <td className="px-5 py-3 font-medium text-blue-600 dark:text-blue-400 text-start">{formatCurrency(row.rawForecastCLV, currency.code, currency.symbol)}</td>
                                                <td className="px-5 py-3 text-start">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.riskKey === 'high' ? 'bg-red-100 text-red-700' :
                                                        row.riskKey === 'medium' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {row.risk}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-end text-xs text-gray-500 dark:text-gray-400 italic">
                                                    {row.action}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Companion Chart: Cone (2 cols) */}
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <MemoizedChart option={coneOption} style={{ height: '300px', width: '100%' }} />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
