import React, { useState, useMemo } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Diamond, Crown, ChartPieSlice, Coin } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SegmentationValueInfo } from './SegmentationValueInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Static Data (no translation needed) ---
const SCATTER_DATA = [
    [50, 125000, 'Acme'],
    [100, 210000, 'Umbrella'],
    [12, 8500, 'Stark'],
    [10, 9200, 'Wayne'],
    [2, 800, 'Cyberdyne'],
    [40, 95000, 'Massive Dynamic'],
    [5, 1200, 'Initech'],
];

// Table data with segmentKey for translation
const CUSTOMER_VALUE_TABLE = [
    { id: 'C-001', name: 'Acme Corp', segmentKey: 'high_value', clv: '$125,000', revenue: '$45,000', freq: 'Weekly' },
    { id: 'C-005', name: 'Umbrella Corp', segmentKey: 'high_value', clv: '$210,000', revenue: '$60,000', freq: 'Daily' },
    { id: 'C-010', name: 'Stark Ind', segmentKey: 'mid_value', clv: '$8,500', revenue: '$2,500', freq: 'Monthly' },
    { id: 'C-023', name: 'Wayne Ent', segmentKey: 'mid_value', clv: '$9,200', revenue: '$3,100', freq: 'Monthly' },
    { id: 'C-099', name: 'Cyberdyne', segmentKey: 'low_value', clv: '$800', revenue: '$150', freq: 'Rarely' },
];

export const SegmentationValueDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t } = useLanguage();
    const [showInfo, setShowInfo] = useState(false);

    // Loading state for smooth entrance animation
    const isLoading = useFirstMountLoading('segmentation-value-dashboard', 1200);

    // --- Translated KPI Data ---
    const TOP_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '1', label: t('high_value_clients'), subtitle: t('spend_over_10k'), value: '125', change: '+5', trend: 'up', icon: <Crown size={18} />, sparklineData: [115, 118, 120, 122, 124, 125], color: 'blue' },
        { id: '2', label: t('mid_value_clients'), subtitle: t('spend_1k_10k'), value: '850', change: '+20', trend: 'up', icon: <Diamond size={18} />, sparklineData: [800, 810, 820, 830, 840, 850], color: 'blue' },
        { id: '3', label: t('low_value_clients'), subtitle: t('spend_under_1k'), value: '1,475', change: '-10', trend: 'down', icon: <Coin size={18} />, sparklineData: [1500, 1490, 1480, 1475, 1470, 1475], color: 'blue' },
        { id: '4', label: t('avg_clv'), subtitle: t('lifetime_value'), value: '$2,850', change: '+$150', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [2600, 2650, 2700, 2750, 2800, 2850], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '5', label: t('revenue_concentration'), subtitle: t('top_20_share'), value: '75%', change: '-1%', trend: 'neutral', icon: <ChartPieSlice size={18} />, sparklineData: [76, 76, 75, 75, 75, 75], color: 'blue' },
        { id: '6', label: t('segment_growth'), subtitle: t('high_value'), value: '4.5%', change: '+0.5%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [3, 3.5, 3.8, 4, 4.2, 4.5], color: 'blue' },
        { id: '7', label: t('risky_segment'), subtitle: t('churn_risk'), value: '12%', change: '+2%', trend: 'down', icon: <Warning size={18} />, sparklineData: [10, 10, 11, 11, 12, 12], color: 'blue' },
        { id: '8', label: t('tier_migration'), subtitle: t('upgrades_this_month'), value: '24', change: '+6', trend: 'up', icon: <Crown size={18} />, sparklineData: [15, 17, 19, 21, 22, 24], color: 'blue' },
    ], [t]);

    // --- Translated Chart Data ---
    const REVENUE_PER_SEGMENT = useMemo(() => [
        { name: t('high_value'), Revenue: 850000 },
        { name: t('mid_value'), Revenue: 450000 },
        { name: t('low_value'), Revenue: 150000 },
        { name: t('new_segment'), Revenue: 50000 },
    ], [t]);

    const SEGMENT_SHARE = useMemo(() => [
        { value: 125, name: t('high_value') },
        { value: 850, name: t('mid_value') },
        { value: 1475, name: t('low_value') }
    ], [t]);

    const CLV_BY_SEGMENT = useMemo(() => [
        { name: t('high_value'), CLV: 125000 },
        { name: t('mid_value'), CLV: 8500 },
        { name: t('low_value'), CLV: 800 },
        { name: t('new_segment'), CLV: 350 },
    ], [t]);

    const MIGRATION_TREND = useMemo(() => [
        { value: 24, name: t('upgraded') },
        { value: 18, name: t('stable') },
        { value: 8, name: t('downgraded') }
    ], [t]);

    // --- Translated Table Data ---
    const TRANSLATED_TABLE = useMemo(() => CUSTOMER_VALUE_TABLE.map(item => ({
        ...item,
        segment: t(item.segmentKey)
    })), [t]);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart
    const pieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: SEGMENT_SHARE,
            color: ['#6366f1', '#3b82f6', '#94a3b8']
        }]
    }), [SEGMENT_SHARE]);

    // Migration Trend Pie
    const migrationPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: MIGRATION_TREND,
            color: ['#10b981', '#3b82f6', '#ef4444']
        }]
    }), [MIGRATION_TREND]);

    // Scatter Chart (Value vs Frequency)
    const scatterOption: EChartsOption = useMemo(() => ({
        title: { text: t('value_vs_frequency'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        grid: { top: 30, right: 40, bottom: 20, left: 50, containLabel: true },
        tooltip: {
            formatter: (params: any) => {
                return `<b>${params.value[2]}</b><br/>Freq: ${params.value[0]}<br/>CLV: $${params.value[1]}`;
            }
        },
        xAxis: { type: 'value', name: 'Orders / Year', splitLine: { show: false } },
        yAxis: { type: 'value', name: 'CLV ($)', splitLine: { show: true, lineStyle: { type: 'dashed' } } },
        series: [{
            type: 'scatter',
            symbolSize: (data: any) => Math.min(Math.max(data[1] / 5000, 10), 40),
            data: SCATTER_DATA,
            itemStyle: {
                color: (params: any) => {
                    const val = params.value[1];
                    return val > 100000 ? '#6366f1' : val > 10000 ? '#3b82f6' : '#94a3b8';
                },
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.2)'
            },
            label: { show: true, formatter: (param: any) => param.value[2], position: 'top', color: '#6b7280' }
        }]
    }), [t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SegmentationValueInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Diamond size={28} className="text-purple-600 dark:text-purple-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('segmentation_value')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('segmentation_value_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-purple-500" />
                        {t('about_dashboard')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* --- Row 1: Top 4 KPIs --- */}
                {TOP_KPIS.map((kpi, index) => (
                    <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                        <KPICard
                            {...kpi}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Bar Charts Side by Side --- */}
                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('revenue_contribution')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('revenue_contribution')}</h3>
                            <p className="text-xs text-gray-400">{t('total_revenue_by_tier')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={REVENUE_PER_SEGMENT} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('avg_clv_by_tier')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('avg_clv_by_tier')}</h3>
                            <p className="text-xs text-gray-400">{t('customer_lifetime_value')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={CLV_BY_SEGMENT} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="CLV" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-6">
                            <PieChartSkeleton title={t('population_share')} />
                            <PieChartSkeleton title={t('tier_migration')} />
                        </div>
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('population_share')}</h3>
                                <p className="text-xs text-gray-400">{t('count_by_tier')}</p>
                            </div>
                            <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                        </div>
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('tier_migration')}</h3>
                                <p className="text-xs text-gray-400">{t('movement_direction')}</p>
                            </div>
                            <MemoizedChart option={migrationPieOption} style={{ height: '180px' }} />
                        </div>
                    </div>
                )}

                {/* 4 KPIs in 2x2 grid */}
                <div className="col-span-1 md:col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                color="blue"
                                className="h-full"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 4: Table + Companion Chart --- */}
                {isLoading ? (
                    <div className="col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('top_customers')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('customer')}</th>
                                        <th className="px-5 py-3 text-start">{t('segment')}</th>
                                        <th className="px-5 py-3 text-end">{t('clv')}</th>
                                        <th className="px-5 py-3 text-end">{t('total_rev')}</th>
                                        <th className="px-5 py-3 text-end">{t('freq')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {TRANSLATED_TABLE.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.segmentKey === 'high_value' ? 'bg-indigo-100 text-indigo-700' :
                                                    row.segmentKey === 'low_value' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {row.segment}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-end text-emerald-600 font-bold">{row.clv}</td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{row.revenue}</td>
                                            <td className="px-5 py-3 text-end text-gray-500 dark:text-gray-400 text-xs">{row.freq}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Scatter */}
                {isLoading ? (
                    <div className="col-span-2">
                        <PieChartSkeleton size={240} title={t('value_vs_frequency')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <MemoizedChart option={scatterOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
