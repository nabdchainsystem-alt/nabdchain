import React, { useState, useMemo, memo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
    Funnel as FunnelIcon, Users, Notepad, ShoppingCart, Percent,
    Info, ArrowsOut, ArrowsIn,
    CaretLeft, CaretRight, Warning, CurrencyDollar, TrendDown, ArrowUp, ArrowDown
} from 'phosphor-react';
import { SalesFunnelInfo } from './SalesFunnelInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- Mock Data ---

const FUNNEL_DATA = [
    { value: 100, name: 'Leads Entered' },
    { value: 80, name: 'Leads Contacted' },
    { value: 60, name: 'Quotes Sent' },
    { value: 42, name: 'Orders Placed' },
];

const DROPOFF_BY_REP_DATA = [
    { name: 'Ahmed', dropoff: 12 },
    { name: 'Sarah', dropoff: 8 },
    { name: 'Omar', dropoff: 15 },
    { name: 'Layla', dropoff: 5 },
    { name: 'Khalid', dropoff: 18 },
];

const LOST_VS_WON_DATA = [
    { value: 42, name: 'Won Deals', itemStyle: { color: '#10b981' } },
    { value: 58, name: 'Lost/Dropped', itemStyle: { color: '#f43f5e' } },
];

const TABLE_DATA = [
    { id: 1, name: 'Tech Solutions', stage: 'Orders Placed', date: '2026-01-15', value: 12500, status: 'Won' },
    { id: 2, name: 'Global Industries', stage: 'Quotes Sent', date: '2026-01-14', value: 45000, status: 'Pending' },
    { id: 3, name: 'Retail Corp', stage: 'Leads Contacted', date: '2026-01-13', value: 8200, status: 'Lost' },
    { id: 4, name: 'Arabia Trading', stage: 'Leads Entered', date: '2026-01-12', value: 28000, status: 'Pending' },
    { id: 5, name: 'Desert Logistics', stage: 'Orders Placed', date: '2026-01-11', value: 15400, status: 'Won' },
    { id: 6, name: 'Sky High Media', stage: 'Quotes Sent', date: '2026-01-10', value: 18500, status: 'Lost' },
    { id: 7, name: 'Oceanic Blue', stage: 'Leads Contacted', date: '2026-01-09', value: 9500, status: 'Pending' },
];

interface SalesFunnelDashboardProps {
    hideFullscreen?: boolean;
}

export const SalesFunnelDashboard: React.FC<SalesFunnelDashboardProps> = ({ hideFullscreen = false }) => {
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
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'date', direction: 'desc' });
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
        { id: '1', label: t('leads_entered'), subtitle: t('new_potential_leads'), value: '1,248', change: '+12%', trend: 'up' as const, icon: <Users size={18} />, sparklineData: [980, 1020, 1080, 1120, 1180, 1220, 1248] },
        { id: '2', label: t('leads_contacted'), subtitle: t('first_outreach_made'), value: '984', change: '+8%', trend: 'up' as const, icon: <Notepad size={18} />, sparklineData: [820, 850, 880, 910, 940, 960, 984] },
        { id: '3', label: t('quotes_sent'), subtitle: t('price_proposals_delivered'), value: '642', change: '+15%', trend: 'up' as const, icon: <CurrencyDollar size={18} />, sparklineData: [480, 510, 540, 570, 600, 620, 642] },
        { id: '4', label: t('orders_placed'), subtitle: t('closed_won_deals'), value: '420', change: '+5%', trend: 'up' as const, icon: <ShoppingCart size={18} />, sparklineData: [360, 375, 385, 395, 405, 415, 420] },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('conversion_rate'), subtitle: t('leads_to_orders'), value: '33.6%', change: '+2.4%', trend: 'up' as const, icon: <Percent size={18} />, sparklineData: [28, 29.5, 30.5, 31.5, 32.2, 33, 33.6] },
        { id: '6', label: t('funnel_dropoff'), subtitle: t('avg_stage_leakage'), value: '18.5%', change: '-1.2%', trend: 'up' as const, icon: <TrendDown size={18} />, sparklineData: [22, 21, 20.5, 20, 19.5, 19, 18.5] },
        { id: '7', label: t('potential_revenue_lost'), subtitle: t('value_in_dropped_deals'), value: '0', rawValue: 184500, isCurrency: true, change: '+4%', trend: 'down' as const, icon: <Warning size={18} />, sparklineData: [165, 170, 175, 178, 180, 182, 184.5] },
        { id: '8', label: t('avg_deal_size'), subtitle: t('won_deals_value'), value: '0', rawValue: 28500, isCurrency: true, change: '+6%', trend: 'up' as const, icon: <CurrencyDollar size={18} />, sparklineData: [24, 25, 26, 26.5, 27, 28, 28.5] },
    ], [t]);

    // Translated funnel data
    const translatedFunnelData = useMemo(() => [
        { value: 100, name: t('leads_entered') },
        { value: 80, name: t('leads_contacted') },
        { value: 60, name: t('quotes_sent') },
        { value: 42, name: t('orders_placed') },
    ], [t]);

    // ECharts Funnel Vertical Bar Chart Option
    const funnelOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
        grid: { left: 40, right: 20, top: 30, bottom: 50 },
        xAxis: {
            type: 'category',
            data: translatedFunnelData.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#64748b',
                fontSize: 10,
                fontWeight: 500,
                interval: 0,
                rotate: 0,
            },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            max: 100,
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
        },
        series: [{
            name: t('sales_funnel'),
            type: 'bar',
            data: translatedFunnelData.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 50,
            label: {
                show: true,
                position: 'top',
                formatter: '{c}%',
                color: '#64748b',
                fontSize: 12,
                fontWeight: 'bold'
            },
        }]
    }), [translatedFunnelData, t, isRTL]);

    // ECharts Won vs Lost Pie Option
    const wonLostPieOption: EChartsOption = useMemo(() => ({
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
            data: [
                { value: 42, name: t('won_deals'), itemStyle: { color: '#10b981' } },
                { value: 58, name: t('lost_dropped'), itemStyle: { color: '#f43f5e' } },
            ]
        }]
    }), [t]);

    // ECharts Heatmap Option
    const heatmapOption: EChartsOption = useMemo(() => ({
        tooltip: { position: 'top' },
        grid: { height: '70%', top: '15%', left: '15%', right: '5%' },
        xAxis: {
            type: 'category',
            data: [t('lead'), t('contact'), t('quote'), t('order')],
            axisLine: { show: false },
            axisTick: { show: false },
            splitArea: { show: true }
        },
        yAxis: {
            type: 'category',
            data: [t('hardware'), t('software'), t('support'), t('other')],
            axisLine: { show: true },
            axisTick: { show: false },
            splitArea: { show: true }
        },
        visualMap: {
            min: 0,
            max: 50,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            inRange: { color: ['#fef2f2', '#f43f5e'] },
            show: false
        },
        series: [{
            name: t('leakage_intensity'),
            type: 'heatmap',
            data: [
                [0, 0, 5], [1, 0, 12], [2, 0, 25], [3, 0, 8],
                [0, 1, 10], [1, 1, 15], [2, 1, 30], [3, 1, 12],
                [0, 2, 8], [1, 2, 10], [2, 2, 20], [3, 2, 5],
                [0, 3, 15], [1, 3, 20], [2, 3, 40], [3, 3, 18],
            ],
            label: { show: true, fontSize: 9 },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.2)' } }
        }]
    }), [t]);

    // ECharts Drop-off by Rep Option
    const dropoffByRepOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: DROPOFF_BY_REP_DATA.map(d => d.name),
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
            name: t('leakage_percent'),
            type: 'bar',
            data: DROPOFF_BY_REP_DATA.map(d => d.dropoff),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 50,
        }],
    }), [isRTL, t]);

    // ECharts Stage Velocity Option
    const stageVelocityOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, textStyle: { fontSize: 10, color: '#94a3b8' } },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: [t('lead_to_contact'), t('contact_to_quote'), t('quote_to_order')],
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
            {
                name: t('avg_days'),
                type: 'bar',
                data: [2.5, 4.2, 7.8],
                itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
                barWidth: 16,
            },
            {
                name: t('conv_percent'),
                type: 'bar',
                data: [78, 65, 70],
                itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
                barWidth: 16,
            }
        ],
    }), [isRTL, t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">

            <SalesFunnelInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-start gap-2 text-start">
                    <FunnelIcon size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('funnel_leakage')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{t('funnel_leakage_subtitle')}</p>
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

                {/* Main Sales Funnel (Left) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('main_sales_funnel')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('main_sales_funnel')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('lead_conversion_stages')}</p>
                            </div>
                            <div className="h-[260px]">
                                <MemoizedChart option={funnelOption} style={{ height: '100%', minHeight: 100 }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Drop-off by Sales Rep (Right) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('dropoff_by_rep')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('dropoff_by_rep')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('team_leakage_analysis')}</p>
                            </div>
                            <div className="h-[260px]">
                                <MemoizedChart option={dropoffByRepOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Row 3: Two Charts + 4 Side KPIs --- */}

                {/* Charts Inner Grid (Left Half) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* Won vs Lost Deals Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('won_vs_lost_deals')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('won_vs_lost_deals')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('success_rate_breakdown')}</p>
                            </div>
                            <MemoizedChart option={wonLostPieOption} style={{ height: '210px' }} />
                        </div>
                    )}

                    {/* Stage Velocity Analysis */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[250px]" title={t('stage_velocity_analysis')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('stage_velocity_analysis')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('avg_time_conversion_stage')}</p>
                            </div>
                            <MemoizedChart option={stageVelocityOption} style={{ height: '210px' }} />
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
                    {/* Lead Tracking Table */}
                    {isLoading ? (
                        <TableSkeleton rows={5} columns={5} />
                    ) : (
                        <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col animate-fade-in-up">
                            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20 text-start">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider leading-normal">
                                        {t('lead_tracking_table')}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1 italic leading-tight">{t('detailed_stage_monitoring')}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto min-h-[350px]">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-start">{t('lead_customer')}</th>
                                            <th className="px-6 py-4 text-start">{t('stage')}</th>
                                            <th className="px-6 py-4 text-start">{t('date_entered')}</th>
                                            <th className="px-6 py-4 text-end">{t('value')}</th>
                                            <th className="px-6 py-4 text-start">{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {paginatedData.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b dark:border-gray-700 last:border-none">
                                                <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white text-start">{row.name}</td>
                                                <td className="px-6 py-5 text-gray-500 text-start">{row.stage}</td>
                                                <td className="px-6 py-5 text-gray-500 font-datetime text-xs text-start">{row.date}</td>
                                                <td className="px-6 py-5 text-end font-bold text-gray-900 dark:text-white">{formatCurrency(row.value, currency.code, currency.symbol)}</td>
                                                <td className="px-6 py-5 text-start">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${row.status === 'Won' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                        row.status === 'Lost' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                                                            'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                        }`}>
                                                        {row.status === 'Won' ? t('won') : row.status === 'Lost' ? t('lost') : t('pending')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10 mt-auto">
                                <span className="text-xs text-gray-500">
                                    {t('showing')} <span className="font-bold text-gray-700 dark:text-gray-300">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedTableData.length)}</span> {t('of')} <span className="font-bold text-gray-700 dark:text-gray-300">{processedTableData.length}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <CaretLeft size={16} />
                                    </button>
                                    <span className="text-xs font-bold mx-2">{currentPage} / {totalPages}</span>
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

                    {/* Companion Chart: Leakage Heatmap */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[450px]" title={t('leakage_heatmap')} />
                    ) : (
                        <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col h-full text-start animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-normal">
                                    {t('leakage_heatmap')}
                                </h3>
                                <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">{t('stage_vs_category')}</p>
                            </div>
                            <div className="flex-1 min-h-[300px]">
                                <MemoizedChart option={heatmapOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                            <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-normal">
                                    <strong>{t('insight')}:</strong> {t('funnel_insight')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
