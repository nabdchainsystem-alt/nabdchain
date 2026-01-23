import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Activity, ShoppingCart, Clock, Lightning, ChartLineUp } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BehaviorPatternsInfo } from './BehaviorPatternsInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Mock Data: Table (customer names don't need translation) ---
const BEHAVIOR_LOG_DATA = [
    { customer: 'Alice Smith', orders: 12, aov: '$120', lastDate: 'Oct 24', trendKey: 'stable' },
    { customer: 'Bob Jones', orders: 4, aov: '$45', lastDate: 'Oct 20', trendKey: 'declining' },
    { customer: 'Charlie Day', orders: 25, aov: '$210', lastDate: 'Today', trendKey: 'surging' },
    { customer: 'Dana White', orders: 8, aov: '$85', lastDate: 'Yesterday', trendKey: 'stable' },
    { customer: 'Eve Black', orders: 1, aov: '$35', lastDate: 'Oct 15', trendKey: 'new_trend' },
];

// Wave Timeline Data (months will be translated)
const WAVE_DATA_VALUES = {
    impulse: [20, 30, 25, 40, 35, 60],
    routine: [50, 52, 51, 53, 52, 55],
    planned: [30, 25, 40, 20, 45, 30]
};

export const BehaviorPatternsDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t } = useLanguage();
    const [showInfo, setShowInfo] = useState(false);

    // Loading state for smooth entrance animation
    const [isLoading, setIsLoading] = useState(true);

    // Simulate data loading with staggered animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    // --- Translated KPI Data ---
    const TOP_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '1', label: t('avg_orders_customer'), subtitle: t('per_year'), value: '4.2', change: '+0.2', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [3.8, 3.9, 4, 4.1, 4.2, 4.2], color: 'blue' },
        { id: '2', label: t('purchase_frequency'), subtitle: t('days_between_orders'), value: '45d', change: '-2d', trend: 'up', icon: <Clock size={18} />, sparklineData: [48, 47, 46, 46, 45, 45], color: 'blue' },
        { id: '3', label: t('avg_basket_size'), subtitle: t('items_per_order'), value: '3.5', change: '+0.1', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [3.2, 3.3, 3.4, 3.4, 3.5, 3.5], color: 'blue' },
        { id: '4', label: t('repeat_rate'), subtitle: t('percent_returning'), value: '65%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [60, 61, 62, 63, 64, 65], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '5', label: t('seasonal_index'), subtitle: t('buying_intensity'), value: '1.2x', change: '+0.1', trend: 'up', icon: <Activity size={18} />, sparklineData: [1, 1, 1.1, 1.1, 1.2, 1.2], color: 'blue' },
        { id: '6', label: t('behavior_volatility'), subtitle: t('pattern_variance'), value: t('low'), change: '', trend: 'neutral', icon: <ChartLineUp size={18} />, sparklineData: [2, 2, 2, 2, 2, 2], color: 'blue' },
        { id: '7', label: t('pattern_alerts'), subtitle: t('anomalies'), value: '3', change: '+1', trend: 'down', icon: <Lightning size={18} />, sparklineData: [1, 2, 2, 2, 3, 3], color: 'blue' },
        { id: '8', label: t('peak_purchase_hour'), subtitle: t('most_active_time'), value: '2 PM', change: t('stable'), trend: 'neutral', icon: <Clock size={18} />, sparklineData: [14, 14, 14, 14, 14, 14], color: 'blue' },
    ], [t]);

    // --- Translated Chart Data ---
    const ORDERS_BY_TIME = useMemo(() => [
        { name: '0-6 AM', Orders: 50 },
        { name: '6-12 PM', Orders: 450 },
        { name: '12-6 PM', Orders: 800 },
        { name: '6-12 AM', Orders: 250 },
    ], []);

    const PURCHASE_MIX = useMemo(() => [
        { value: 450, name: t('electronics') },
        { value: 300, name: t('apparel') },
        { value: 150, name: t('home_category') },
        { value: 100, name: t('beauty') }
    ], [t]);

    const FREQUENCY_BY_SEGMENT = useMemo(() => [
        { name: t('weekly'), Count: 350 },
        { name: t('bi_weekly'), Count: 480 },
        { name: t('monthly_orders'), Count: 620 },
        { name: t('quarterly'), Count: 280 },
    ], [t]);

    const PURCHASE_TYPE = useMemo(() => [
        { value: 45, name: t('routine') },
        { value: 30, name: t('planned') },
        { value: 25, name: t('impulse') }
    ], [t]);

    const WAVE_DATA = useMemo(() => ({
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        impulse: WAVE_DATA_VALUES.impulse,
        routine: WAVE_DATA_VALUES.routine,
        planned: WAVE_DATA_VALUES.planned
    }), []);

    // --- Translated Behavior Log ---
    const BEHAVIOR_LOG = useMemo(() => BEHAVIOR_LOG_DATA.map(row => ({
        ...row,
        trend: t(row.trendKey)
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
            data: PURCHASE_MIX,
            color: ['#f59e0b', '#ec4899', '#10b981', '#6366f1']
        }]
    }), [PURCHASE_MIX]);

    // Purchase Type Pie
    const purchaseTypePieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: PURCHASE_TYPE,
            color: ['#3b82f6', '#8b5cf6', '#f43f5e']
        }]
    }), [PURCHASE_TYPE]);

    // Wave Chart (Stacked Area / Line)
    const waveOption: EChartsOption = useMemo(() => ({
        title: { text: t('behavioral_wave'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        grid: { top: 30, right: 20, bottom: 20, left: 40, containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: WAVE_DATA.months },
        yAxis: { type: 'value' },
        series: [
            { name: t('routine'), type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: WAVE_DATA.routine, color: '#3b82f6' },
            { name: t('planned'), type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: WAVE_DATA.planned, color: '#8b5cf6' },
            { name: t('impulse'), type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' }, data: WAVE_DATA.impulse, color: '#f43f5e' }
        ]
    }), [t, WAVE_DATA]);

    // Get trend style class
    const getTrendClass = (trendKey: string) => {
        if (trendKey === 'surging') return 'bg-green-100 text-green-700';
        if (trendKey === 'declining') return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <BehaviorPatternsInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Activity size={28} className="text-orange-600 dark:text-orange-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('behavior_patterns')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('behavior_patterns_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-orange-500" />
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
                        <ChartSkeleton height="h-[300px]" title={t('activity_heatmap')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('activity_heatmap')}</h3>
                            <p className="text-xs text-gray-400">{t('orders_by_time_of_day')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ORDERS_BY_TIME} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('frequency_distribution')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('purchase_frequency')}</h3>
                            <p className="text-xs text-gray-400">{t('customer_count_by_interval')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={FREQUENCY_BY_SEGMENT} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-6">
                            <PieChartSkeleton title={t('category_mix')} />
                            <PieChartSkeleton title={t('purchase_type')} />
                        </div>
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('category_mix')}</h3>
                                <p className="text-xs text-gray-400">{t('preferential_split')}</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('purchase_type')}</h3>
                                <p className="text-xs text-gray-400">{t('buying_behavior')}</p>
                            </div>
                            <ReactECharts option={purchaseTypePieOption} style={{ height: '180px' }} />
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
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('behavior_log')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">{t('customer')}</th>
                                        <th className="px-5 py-3 text-end">{t('orders')}</th>
                                        <th className="px-5 py-3 text-end">{t('avg_order_value')}</th>
                                        <th className="px-5 py-3 text-end">{t('last_purchase')}</th>
                                        <th className="px-5 py-3 text-center">{t('trend')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {BEHAVIOR_LOG.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.customer}</td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{row.orders}</td>
                                            <td className="px-5 py-3 text-end text-green-600 font-medium">{row.aov}</td>
                                            <td className="px-5 py-3 text-end text-gray-500 dark:text-gray-400 text-xs">{row.lastDate}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${getTrendClass(row.trendKey)}`}>
                                                    {row.trend}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Wave */}
                {isLoading ? (
                    <div className="col-span-2">
                        <PieChartSkeleton size={240} title={t('behavioral_wave')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={waveOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
