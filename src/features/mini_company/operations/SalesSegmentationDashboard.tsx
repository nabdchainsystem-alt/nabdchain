import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
    Users, Medal, ChartLine, CurrencyDollar, TrendUp, Warning,
    Info, ArrowsOut, ArrowsIn,
    CaretLeft, CaretRight, Star, Heart, Repeat, UserPlus
} from 'phosphor-react';
import { SalesSegmentationInfo } from './SalesSegmentationInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#06b6d4'];

// --- Mock Data ---

const CUSTOMERS_PER_SEGMENT_DATA = [
    { name: 'High Value', count: 120, revenue: 450000 },
    { name: 'Medium Value', count: 450, revenue: 280000 },
    { name: 'Low Value', count: 1200, revenue: 95000 },
    { name: 'At Risk', count: 320, revenue: 42000 },
];

const REPEAT_VS_ONETIME_DATA = [
    { name: 'VIP', repeat: 85, onetime: 15 },
    { name: 'Regular', repeat: 60, onetime: 40 },
    { name: 'New', repeat: 10, onetime: 90 },
    { name: 'Churned', repeat: 95, onetime: 5 },
];

const REVENUE_BY_SEGMENT_DATA = [
    { value: 55, name: 'High Value' },
    { value: 25, name: 'Medium Value' },
    { value: 12, name: 'Low Value' },
    { value: 8, name: 'At Risk' },
];

const TABLE_DATA = [
    { id: 1, name: 'John Doe', segment: 'High Value', orders: 24, revenue: 15400, lastDate: '2026-01-10', score: 98 },
    { id: 2, name: 'Sarah Smith', segment: 'Medium Value', orders: 12, revenue: 8200, lastDate: '2026-01-08', score: 75 },
    { id: 3, name: 'Ahmed Ali', segment: 'High Value', orders: 35, revenue: 22000, lastDate: '2026-01-12', score: 95 },
    { id: 4, name: 'Emily Brown', segment: 'Low Value', orders: 2, revenue: 1200, lastDate: '2025-12-15', score: 30 },
    { id: 5, name: 'Omar Hassan', segment: 'At Risk', orders: 8, revenue: 4500, lastDate: '2025-11-20', score: 45 },
    { id: 6, name: 'Layla George', segment: 'Medium Value', orders: 15, revenue: 9800, lastDate: '2026-01-11', score: 82 },
    { id: 7, name: 'Michael Chen', segment: 'High Value', orders: 28, revenue: 18900, lastDate: '2026-01-14', score: 92 },
];

interface SalesSegmentationDashboardProps {
    hideFullscreen?: boolean;
}

export const SalesSegmentationDashboard: React.FC<SalesSegmentationDashboardProps> = ({ hideFullscreen = false }) => {
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

    // Table State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'revenue', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Sorted Table Data
    const processedTableData = useMemo(() => {
        let data = [...TABLE_DATA];
        if (sortConfig.key && sortConfig.direction) {
            data.sort((a: any, b: any) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedTableData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedTableData, currentPage]);

    const totalPages = Math.ceil(processedTableData.length / itemsPerPage);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
        setSortConfig({ key, direction });
    };

    // KPI Config
    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('total_customers'), subtitle: t('lifetime_registered_base'), value: '4,850', change: '+3.2%', trend: 'up' as const, icon: <Users size={18} />, sparklineData: [4200, 4350, 4480, 4580, 4680, 4780, 4850] },
        { id: '2', label: t('active_customers'), subtitle: t('last_90_days_activity'), value: '3,240', change: '+5.4%', trend: 'up' as const, icon: <Star size={18} />, sparklineData: [2800, 2920, 3020, 3080, 3140, 3200, 3240] },
        { id: '3', label: t('repeat_customer_percent'), subtitle: t('loyalty_retention_rate'), value: '64.2%', change: '+1.5%', trend: 'up' as const, icon: <Repeat size={18} />, sparklineData: [58, 59.5, 60.8, 62, 63, 63.8, 64.2] },
        { id: '4', label: t('avg_clv'), subtitle: t('est_lifetime_value'), value: '0', rawValue: 12450, isCurrency: true, change: '+8.4%', trend: 'up' as const, icon: <CurrencyDollar size={18} />, sparklineData: [10.2, 10.8, 11.2, 11.6, 12, 12.2, 12.45] },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('avg_orders'), subtitle: t('per_customer_frequency'), value: '4.2', change: '+0.5', trend: 'up' as const, icon: <ChartLine size={18} />, sparklineData: [3.5, 3.7, 3.8, 3.9, 4, 4.1, 4.2] },
        { id: '6', label: t('churn_rate_percent'), subtitle: t('lost_customer_ratio'), value: '12.4%', change: '-0.8%', trend: 'up' as const, icon: <Warning size={18} />, sparklineData: [15, 14.5, 14, 13.5, 13, 12.8, 12.4] },
        { id: '7', label: t('engagement_score'), subtitle: t('rfv_avg'), value: '78/100', change: '+4%', trend: 'up' as const, icon: <Heart size={18} />, sparklineData: [68, 70, 72, 74, 75, 77, 78] },
        { id: '8', label: t('new_customers'), subtitle: t('monthly_acquisitions'), value: '186', change: '+12%', trend: 'up' as const, icon: <UserPlus size={18} />, sparklineData: [145, 152, 160, 168, 175, 180, 186] },
    ], [t]);

    // ECharts Revenue Pie Option with translations
    const translatedRevenueData = useMemo(() => [
        { value: 55, name: t('high_value') },
        { value: 25, name: t('medium_value') },
        { value: 12, name: t('low_value') },
        { value: 8, name: t('at_risk') },
    ], [t]);

    const revenuePieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: translatedRevenueData.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } }))
        }]
    }), [translatedRevenueData]);

    // ECharts Loyalty Curve Scatter Option
    const loyaltyScatterOption: EChartsOption = useMemo(() => ({
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `<div class="p-2 font-sans">
                    <p class="font-bold text-gray-800">${params.data[2]}</p>
                    <p class="text-xs text-gray-500 mt-1">${t('orders')}: ${params.data[0]}</p>
                    <p class="text-xs text-gray-500">${t('revenue')}: ${formatCurrency(params.data[1], currency.code, currency.symbol)}</p>
                </div>`;
            }
        },
        grid: { top: '15%', bottom: '15%', left: '15%', right: '10%' },
        xAxis: { name: t('orders_per_customer'), nameLocation: 'middle', nameGap: 25 },
        yAxis: { name: t('revenue_per_customer'), nameLocation: 'middle', nameGap: 35 },
        series: [{
            symbolSize: (data: any) => Math.sqrt(data[1]) / 2,
            data: [
                [24, 15400, t('high_value_avg')],
                [12, 8200, t('medium_value_avg')],
                [2, 1200, t('low_value_avg')],
                [8, 4500, t('at_risk_avg')],
            ],
            type: 'scatter',
            itemStyle: { color: '#8b5cf6' }
        }]
    }), [t, currency.code, currency.symbol]);

    // ECharts Customer Segmentation Option
    const customerSegmentationOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: CUSTOMERS_PER_SEGMENT_DATA.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 11 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            axisLabel: { color: '#94a3b8', fontSize: 12 },
        },
        series: [{
            type: 'bar',
            data: CUSTOMERS_PER_SEGMENT_DATA.map(d => d.count),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 50,
        }],
    }), [isRTL]);

    // ECharts Repeat vs One-Time Option (Stacked Bar)
    const repeatVsOnetimeOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, textStyle: { fontSize: 10, color: '#94a3b8' } },
        grid: { left: isRTL ? 20 : 30, right: isRTL ? 30 : 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: REPEAT_VS_ONETIME_DATA.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 12 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            show: false,
        },
        series: [
            {
                name: t('repeat_percent'),
                type: 'bar',
                stack: 'total',
                data: REPEAT_VS_ONETIME_DATA.map(d => d.repeat),
                itemStyle: { color: '#3b82f6', borderRadius: [0, 0, 0, 0] },
                barWidth: 24,
            },
            {
                name: t('onetime_percent'),
                type: 'bar',
                stack: 'total',
                data: REPEAT_VS_ONETIME_DATA.map(d => d.onetime),
                itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
                barWidth: 24,
            }
        ],
    }), [isRTL, t]);

    // ECharts Customer Value Distribution Option
    const customerValueOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, textStyle: { fontSize: 10, color: '#94a3b8' } },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: CUSTOMERS_PER_SEGMENT_DATA.map(d => d.name),
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
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
        },
        series: [{
            name: t('revenue'),
            type: 'bar',
            data: CUSTOMERS_PER_SEGMENT_DATA.map(d => d.revenue),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 24,
        }],
    }), [isRTL, t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">

            <SalesSegmentationInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-start gap-2 text-start">
                    <Users size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('segmentation_loyalty')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{t('segmentation_loyalty_subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!hideFullscreen && (
                        <button
                            onClick={toggleFullScreen}
                            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                            title={isFullScreen ? t('exit_full_screen') : t('full_screen')}
                        >
                            {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
                        </button>
                    )}
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
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Customer Segmentation (Left) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('customer_segmentation')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('customer_segmentation')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('count_per_segment')}</p>
                            </div>
                            <div className="h-[260px]">
                                <MemoizedChart option={customerSegmentationOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Repeat vs One-Time (Right) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('repeat_vs_onetime')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('repeat_vs_onetime')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('loyalty_depth_segment')}</p>
                            </div>
                            <div className="h-[260px]">
                                <MemoizedChart option={repeatVsOnetimeOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Row 3: Two Charts + 4 Side KPIs --- */}

                {/* Charts Inner Grid (Left Half) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* Revenue by Segment Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('revenue_by_segment')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('revenue_by_segment')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('contribution_share')}</p>
                            </div>
                            <MemoizedChart option={revenuePieOption} style={{ height: '210px' }} />
                        </div>
                    )}

                    {/* Customer Value Distribution */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[250px]" title={t('customer_value_distribution')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('customer_value_distribution')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('revenue_contribution_tier')}</p>
                            </div>
                            <MemoizedChart option={customerValueOption} style={{ height: '210px' }} />
                        </div>
                    )}
                </div>

                {/* 4 Side KPIs (Right Half - 2x2 Grid) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                                color="blue"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}
                <div className="lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Table (Col 1) */}
                {isLoading ? (
                    <TableSkeleton rows={5} columns={5} />
                ) : (
                    <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col text-start animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('top_customers_list')}</h3>
                                <p className="text-xs text-gray-400 mt-1 italic">{t('segmentation_engagement_monitoring')}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-[350px]">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-start">{t('customer')}</th>
                                        <th className="px-6 py-4 text-start">{t('segment')}</th>
                                        <th className="px-6 py-4 text-end">{t('orders')}</th>
                                        <th className="px-6 py-4 text-end">{t('revenue')}</th>
                                        <th className="px-6 py-4 text-end">{t('eng_score')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {paginatedData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b dark:border-gray-700 last:border-none">
                                            <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white text-start">{row.name}</td>
                                            <td className="px-6 py-5 text-start">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.segment === 'High Value' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    row.segment === 'Medium Value' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {row.segment}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-end font-medium text-gray-500">{row.orders}</td>
                                            <td className="px-6 py-5 text-end font-bold text-gray-900 dark:text-white">{formatCurrency(row.revenue, currency.code, currency.symbol)}</td>
                                            <td className="px-6 py-5 text-end font-mono text-xs">{row.score}/100</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10 mt-auto">
                            <span className="text-xs text-gray-500">
                                {t('page')} <span className="font-bold text-gray-700 dark:text-gray-300">{currentPage}</span> {t('of')} {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                >
                                    <CaretLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                >
                                    <CaretRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loyalty Curve Companion Chart */}
                {isLoading ? (
                    <ChartSkeleton height="h-[450px]" title={t('loyalty_curve')} />
                ) : (
                    <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col h-full text-start animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-normal">
                                {t('loyalty_curve')}
                            </h3>
                            <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">{t('orders_vs_revenue_segment')}</p>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <MemoizedChart option={loyaltyScatterOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                        <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-normal">
                                <strong>{t('insight')}:</strong> {t('segmentation_insight')}
                            </p>
                        </div>
                    </div>
                )}
                </div>

            </div>
        </div>
    );
};
