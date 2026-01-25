import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart as ReactECharts } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, Target, Warning, Lightning, ShieldCheck, XCircle, FileSearch, ChartLine } from 'phosphor-react';
import { StockAccuracyInfo } from './StockAccuracyInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- Mock Data: Charts ---
const VARIANCE_PER_CATEGORY = [
    { name: 'Apparel', value: 3200 },
    { name: 'Electronics', value: 2500 },
    { name: 'Accessories', value: 1500 },
    { name: 'Home Goods', value: 800 },
    { name: 'Misc', value: 200 },
];

const SHRINKAGE_CAUSES = [
    { value: 45, name: 'Administrative Error' },
    { value: 30, name: 'Theft (External)' },
    { value: 15, name: 'Damage/Spoilage' },
    { value: 10, name: 'Theft (Internal)' }
];

// New chart data: Accuracy by Warehouse
const ACCURACY_BY_WAREHOUSE = [
    { name: 'Main Hub', value: 99.2 },
    { name: 'North Br', value: 97.8 },
    { name: 'South Br', value: 96.5 },
    { name: 'Retail', value: 98.1 },
];

// New chart data: Adjustment Types
const ADJUSTMENT_TYPES = [
    { value: 40, name: 'Quantity Correction' },
    { value: 25, name: 'Location Update' },
    { value: 20, name: 'Damage Write-off' },
    { value: 15, name: 'Found Items' }
];

// --- Mock Data: Table & Radar ---
const VARIANCE_LOG = [
    { id: 'SKU-5001', system: 50, physical: 48, variance: -2, reason: 'Unknown' },
    { id: 'SKU-5005', system: 120, physical: 115, variance: -5, reason: 'Damage' },
    { id: 'SKU-3022', system: 10, physical: 12, variance: +2, reason: 'Miscount' },
    { id: 'SKU-4008', system: 200, physical: 198, variance: -2, reason: 'Theft?' },
    { id: 'SKU-1010', system: 45, physical: 40, variance: -5, reason: 'Admin Error' },
];

// Radar Data
const RADAR_INDICATORS = [
    { name: 'Cycle Count', max: 100 },
    { name: 'Process Compliance', max: 100 },
    { name: 'Data Integrity', max: 100 },
    { name: 'Loss Prevention', max: 100 },
    { name: 'Staff Training', max: 100 }
];

const RADAR_DATA = [
    { value: [95, 80, 90, 75, 85], name: 'Current Score' },
    { value: [100, 100, 100, 100, 100], name: 'Target' }
];

export const StockAccuracyDashboard: React.FC = () => {
    const { currency, t, dir } = useAppContext();
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

    // --- KPI Data ---
    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('stock_accuracy'), subtitle: t('audit_match_pct'), value: '98.2%', change: '+0.5%', trend: 'up' as const, icon: <Target size={18} />, sparklineData: [96, 97, 97.5, 98, 98.1, 98.2], color: 'blue' },
        { id: '2', label: t('shrinkage_value'), subtitle: t('lost_inventory'), value: '$8.2k', rawValue: 8200, isCurrency: true, change: '-5.0%', trend: 'up' as const, icon: <Warning size={18} />, sparklineData: [9, 8.8, 8.6, 8.5, 8.3, 8.2], color: 'blue' },
        { id: '3', label: t('adjustment_count'), subtitle: t('manual_fixes'), value: '142', change: '-10', trend: 'up' as const, icon: <Lightning size={18} />, sparklineData: [160, 155, 150, 148, 145, 142], color: 'blue' },
        { id: '4', label: t('loss_rate'), subtitle: t('pct_of_total_value'), value: '0.45%', change: '-0.02%', trend: 'up' as const, icon: <XCircle size={18} />, sparklineData: [0.5, 0.49, 0.48, 0.47, 0.46, 0.45], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('high_risk_skus'), subtitle: t('frequent_losses'), value: '18', change: '-2', trend: 'up' as const, icon: <Warning size={18} />, sparklineData: [20, 20, 19, 19, 18, 18], color: 'blue' },
        { id: '6', label: t('audit_frequency'), subtitle: t('days_per_cycle'), value: '30d', change: '0d', trend: 'neutral' as const, icon: <FileSearch size={18} />, sparklineData: [30, 30, 30, 30, 30, 30], color: 'blue' },
        { id: '7', label: t('variance_alerts'), subtitle: t('open_issues'), value: '5', change: '-3', trend: 'up' as const, icon: <ShieldCheck size={18} />, sparklineData: [8, 7, 7, 6, 6, 5], color: 'blue' },
        { id: '8', label: t('recovery_rate'), subtitle: t('found_items_pct'), value: '72%', change: '+5%', trend: 'up' as const, icon: <ChartLine size={18} />, sparklineData: [60, 63, 66, 68, 70, 72], color: 'blue' },
    ], [t]);

    const getReasonLabel = (reason: string) => {
        switch (reason) {
            case 'Unknown': return t('unknown');
            case 'Damage': return t('damage');
            case 'Miscount': return t('miscount');
            case 'Theft?': return t('theft_q');
            case 'Admin Error': return t('admin_error');
            default: return reason;
        }
    };


    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Bar Chart - Variance per Category
    const varianceByCategoryOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: VARIANCE_PER_CATEGORY.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
        },
        series: [{
            type: 'bar',
            data: VARIANCE_PER_CATEGORY.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 24,
        }],
    }), [isRTL]);

    // Bar Chart - Accuracy by Warehouse
    const accuracyByWarehouseOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: ACCURACY_BY_WAREHOUSE.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            min: 90,
            max: 100,
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
        },
        series: [{
            type: 'bar',
            data: ACCURACY_BY_WAREHOUSE.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 24,
        }],
    }), [isRTL]);

    // Pie Chart - Shrinkage Causes
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
            data: SHRINKAGE_CAUSES
        }]
    }), []);

    // Pie Chart - Adjustment Types
    const adjustmentPieOption: EChartsOption = useMemo(() => ({
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
            data: ADJUSTMENT_TYPES,
            color: ['#f97316', '#eab308', '#dc2626', '#22c55e']
        }]
    }), []);

    // Radar Chart
    const radarOption: EChartsOption = useMemo(() => ({
        title: { text: t('accuracy_metrics'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {},
        legend: { data: [t('current_score'), t('target')], bottom: 0, textStyle: { fontSize: 10 } },
        radar: {
            indicator: [
                { name: t('cycle_count'), max: 100 },
                { name: t('process_compliance'), max: 100 },
                { name: t('data_integrity'), max: 100 },
                { name: t('loss_prevention'), max: 100 },
                { name: t('staff_training'), max: 100 }
            ],
            radius: '65%',
            center: ['50%', '50%'],
            splitNumber: 4,
            splitArea: { areaStyle: { color: ['transparent'] } }
        },
        series: [{
            name: t('accuracy_vs_target'),
            type: 'radar',
            data: [
                { value: [95, 80, 90, 75, 85], name: t('current_score') },
                { value: [100, 100, 100, 100, 100], name: t('target') }
            ],
            itemStyle: { color: '#f87171' },
            areaStyle: { opacity: 0.2 }
        }]
    }), [t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <StockAccuracyInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Target size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div className="text-start">
                        <h1 className="text-2xl font-bold">{t('accuracy_shrinkage')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('audit_results_loss_prevention')}</p>
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
                            value={kpi.isCurrency && kpi.rawValue ? `$${kpi.rawValue.toLocaleString()}` : kpi.value} // Simple format for mock
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* ECharts: Variance per Category */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('variance_by_category')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('variance_by_category')}</h3>
                            <p className="text-xs text-gray-400">{t('value_of_discrepancies')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ReactECharts option={varianceByCategoryOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>
                )}

                {/* ECharts: Accuracy by Warehouse */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('accuracy_by_warehouse')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('accuracy_by_warehouse')}</h3>
                            <p className="text-xs text-gray-400">{t('audit_score_by_location')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ReactECharts option={accuracyByWarehouseOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Shrinkage Causes */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('shrinkage_causes')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('shrinkage_causes')}</h3>
                                <p className="text-xs text-gray-400">{t('root_cause_analysis')}</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Adjustment Types */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('adjustment_types')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('adjustment_types')}</h3>
                                <p className="text-xs text-gray-400">{t('correction_categories')}</p>
                            </div>
                            <ReactECharts option={adjustmentPieOption} style={{ height: '180px' }} />
                        </div>
                    )}
                </div>

                {/* Right: Side KPIs in 2x2 Grid */}
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

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} title={t('recent_variances')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('recent_variances')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('sku')}</th>
                                        <th className="px-5 py-3 text-end">{t('sys_qty')}</th>
                                        <th className="px-5 py-3 text-end">{t('phy_qty')}</th>
                                        <th className="px-5 py-3 text-end">{t('var')}</th>
                                        <th className="px-5 py-3 text-start">{t('reason')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {VARIANCE_LOG.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.id}</td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{row.system}</td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{row.physical}</td>
                                            <td className={`px-5 py-3 text-end font-bold ${row.variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {row.variance > 0 ? `+${row.variance}` : row.variance}
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs text-start">{getReasonLabel(row.reason)}</td>
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
                        <ChartSkeleton height="h-[280px]" title={t('accuracy_metrics')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={radarOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
