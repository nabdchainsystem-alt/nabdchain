import React, { useState, useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
    Megaphone, CurrencyDollar, ChartBar, Users, TrendUp, Warning,
    Info, ArrowsOut,
    CaretLeft, CaretRight, RocketLaunch, Tag, Calendar, Percent
} from 'phosphor-react';
import { SalesPromotionsInfo } from './SalesPromotionsInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS = ['#f43f5e', '#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

// --- Mock Data ---

const REVENUE_PER_CAMPAIGN_DATA = [
    { name: 'Giga Sale', revenue: 125000, conversion: 15.2 },
    { name: 'Flash Deal', revenue: 45000, conversion: 22.4 },
    { name: 'Loyalty Week', revenue: 82000, conversion: 18.5 },
    { name: 'Referral Cap', revenue: 28000, conversion: 10.2 },
    { name: 'Winter App', revenue: 54000, conversion: 12.8 },
];

const REVENUE_BY_TYPE_DATA = [
    { value: 45, name: 'Direct Discount' },
    { value: 25, name: 'Coupon Code' },
    { value: 20, name: 'BOGO' },
    { value: 10, name: 'Free Shipping' },
];

const TABLE_DATA = [
    { id: 1, name: 'Giga Sale 2026', type: 'Discount', start: '2026-01-01', end: '2026-01-15', budget: 25000, revenue: 125000, roi: 400, status: 'Active' },
    { id: 2, name: 'Flash Deal #4', type: 'Coupon', start: '2026-01-10', end: '2026-01-11', budget: 5000, revenue: 45000, roi: 800, status: 'Completed' },
    { id: 3, name: 'Loyalty Week', type: 'BOGO', start: '2026-01-05', end: '2026-01-12', budget: 12000, revenue: 82000, roi: 583, status: 'Completed' },
    { id: 4, name: 'Referral Campaign', type: 'Free Ship', start: '2026-01-01', end: '2026-03-31', budget: 15000, revenue: 28000, roi: 86, status: 'Active' },
    { id: 5, name: 'Winter App Promo', type: 'Discount', start: '2025-12-01', end: '2026-01-31', budget: 10000, revenue: 54000, roi: 440, status: 'Active' },
    { id: 6, name: 'Launch Event 2', type: 'Event', start: '2026-02-01', end: '2026-02-05', budget: 30000, revenue: 0, roi: 0, status: 'Pending' },
];

// --- Sub-components ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-monday-dark-surface p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.name}: <span className="font-bold text-gray-900 dark:text-white">
                                {entry.name.includes('%') || entry.name === 'Conversion' ? `${entry.value}%` : formatCurrency(entry.value, 'USD', '$')}
                            </span>
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface SalesPromotionsDashboardProps {
    hideFullscreen?: boolean;
}

export const SalesPromotionsDashboard: React.FC<SalesPromotionsDashboardProps> = ({ hideFullscreen = false }) => {
    const { currency, t } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // Table State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'roi', direction: 'desc' });
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

    // Translated data arrays
    const translatedRevenueTypeData = [
        { value: 45, name: t('direct_discount') },
        { value: 25, name: t('coupon_code') },
        { value: 20, name: t('bogo') },
        { value: 10, name: t('free_shipping') },
    ];

    const statusTranslations: Record<string, string> = {
        'Active': t('active'),
        'Completed': t('completed'),
        'Pending': t('pending'),
    };

    // KPI Config
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '1', label: t('campaigns_active'), subtitle: t('live_promotional_events'), value: '4', change: t('stable'), trend: 'neutral', icon: <Megaphone size={18} />, sparklineData: [3, 4, 5, 4, 3, 4, 4] },
        { id: '2', label: t('total_spend'), subtitle: t('marketing_budget_used'), value: '0', rawValue: 42500, isCurrency: true, change: '+12%', trend: 'down', icon: <Tag size={18} />, sparklineData: [32, 35, 38, 40, 41, 42, 42.5] },
        { id: '3', label: t('revenue_from_promo'), subtitle: t('attributed_gross_volume'), value: '0', rawValue: 284500, isCurrency: true, change: '+24%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [180, 200, 220, 245, 260, 275, 284.5] },
        { id: '4', label: t('overall_roi'), subtitle: t('campaign_profitability'), value: '569%', change: '+45%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [380, 420, 460, 500, 530, 550, 569] },
    ];

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '5', label: t('promo_conversion'), subtitle: t('engaged_vs_purchased'), value: '18.4%', change: '+3.2%', trend: 'up', icon: <Percent size={18} />, sparklineData: [12, 13.5, 15, 16, 17, 17.8, 18.4] },
        { id: '6', label: t('incremental_sales'), subtitle: t('above_organic_baseline'), value: '0', rawValue: 105000, isCurrency: true, change: '+18%', trend: 'up', icon: <RocketLaunch size={18} />, sparklineData: [75, 80, 85, 90, 95, 100, 105] },
        { id: '7', label: t('engagement_rate'), subtitle: t('clicks_engagement_avg'), value: '4.2%', change: '+1.1%', trend: 'up', icon: <Users size={18} />, sparklineData: [2.8, 3.2, 3.5, 3.8, 4, 4.1, 4.2] },
        { id: '8', label: t('coupon_redemption'), subtitle: t('codes_used_issued'), value: '32.5%', change: '+5.2%', trend: 'up', icon: <Tag size={18} />, sparklineData: [22, 24, 26, 28, 30, 31, 32.5] },
    ];

    // ECharts Revenue Type Pie Option
    const typePieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: { bottom: '0%', left: 'center', textStyle: { fontSize: 10, color: '#94a3b8' } },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            data: translatedRevenueTypeData.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } }))
        }]
    };

    // ECharts Impact Bubble Option
    const impactBubbleOption: EChartsOption = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `<div class="p-2 font-sans">
                    <p class="font-bold text-gray-800">${params.data[2]}</p>
                    <p class="text-xs text-gray-500 mt-1">${t('roi')}: ${params.data[0]}%</p>
                    <p class="text-xs text-gray-500">${t('conv_percent')}: ${params.data[1]}%</p>
                </div>`;
            }
        },
        grid: { top: '15%', bottom: '15%', left: '15%', right: '10%' },
        xAxis: { name: t('roi_percent'), nameLocation: 'middle', nameGap: 25 },
        yAxis: { name: t('conv_percent'), nameLocation: 'middle', nameGap: 35 },
        series: [{
            symbolSize: (data: any) => Math.sqrt(data[0]) * 2,
            data: [
                [400, 15.2, 'Giga Sale'],
                [800, 22.4, 'Flash Deal'],
                [583, 18.5, 'Loyalty Week'],
                [86, 10.2, 'Referral Campaign'],
                [440, 12.8, 'Winter App Promo'],
            ],
            type: 'scatter',
            itemStyle: { color: '#f43f5e' }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">

            <SalesPromotionsInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-start gap-2 text-start">
                    <Megaphone size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('promotions_effectiveness')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{t('promotions_effectiveness_subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!hideFullscreen && (
                        <button
                            onClick={toggleFullScreen}
                            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                            title={t('full_screen')}
                        >
                            <ArrowsOut size={18} />
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

                {/* Campaign Performance (Left) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('campaign_performance')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('campaign_performance')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('revenue_per_campaign')}</p>
                            </div>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={REVENUE_PER_CAMPAIGN_DATA} margin={{ left: -15, right: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Conversion by Campaign (Right) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('conversion_by_campaign')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('conversion_by_campaign')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('conversion_efficiency')}</p>
                            </div>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={REVENUE_PER_CAMPAIGN_DATA} margin={{ left: 10, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" fontSize={11} tick={{ fill: '#94a3b8' }} />
                                        <YAxis fontSize={12} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                                        <Bar dataKey="conversion" name="Conv %" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Row 3: Two Charts + 4 Side KPIs --- */}

                {/* Charts Inner Grid (Left Half) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* Revenue by Type Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('revenue_by_type')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('revenue_by_type')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('promotion_type_breakdown')}</p>
                            </div>
                            <ReactECharts option={typePieOption} style={{ height: '210px' }} />
                        </div>
                    )}

                    {/* Campaign Impact Bubble */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[250px]" title={t('campaign_impact')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('campaign_impact')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('roi_vs_conversion')}</p>
                            </div>
                            <ReactECharts option={impactBubbleOption} style={{ height: '210px' }} />
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
                {/* Campaign Table (Col 1) */}
                {isLoading ? (
                    <TableSkeleton rows={5} columns={6} title={t('campaign_audit_table')} />
                ) : (
                    <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col text-start animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('campaign_audit_table')}</h3>
                                <p className="text-xs text-gray-400 mt-1 italic">{t('detailed_roi_tracking')}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-[350px]">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-start">{t('campaign')}</th>
                                        <th className="px-6 py-4 text-start">{t('type')}</th>
                                        <th className="px-6 py-4 text-end">{t('budget')}</th>
                                        <th className="px-6 py-4 text-end">{t('revenue')}</th>
                                        <th className="px-6 py-4 text-end cursor-pointer hover:text-blue-600" onClick={() => handleSort('roi')}>{t('roi_percent')}</th>
                                        <th className="px-6 py-4 text-start">{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {paginatedData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b dark:border-gray-700 last:border-none">
                                            <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white text-start">{row.name}</td>
                                            <td className="px-6 py-5 text-gray-500 text-start">{row.type}</td>
                                            <td className="px-6 py-5 text-end font-medium text-gray-500">{formatCurrency(row.budget, currency.code, currency.symbol)}</td>
                                            <td className="px-6 py-5 text-end font-bold text-gray-900 dark:text-white">{formatCurrency(row.revenue, currency.code, currency.symbol)}</td>
                                            <td className="px-6 py-5 text-end">
                                                <span className={`font-bold ${row.roi > 300 ? 'text-emerald-500' : 'text-amber-500'}`}>{row.roi}%</span>
                                            </td>
                                            <td className="px-6 py-5 text-start">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.status === 'Active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {statusTranslations[row.status] || row.status}
                                                </span>
                                            </td>
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

                    {/* Campaign ROI Companion */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[450px]" title={t('campaign_roi_analysis')} />
                    ) : (
                        <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col h-full text-start animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-normal">
                                    {t('campaign_roi_analysis')}
                                </h3>
                                <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">{t('budget_vs_revenue')}</p>
                            </div>
                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={REVENUE_PER_CAMPAIGN_DATA} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="revenue" name={t('revenue')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="conversion" name={t('conv_percent')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-normal text-start">
                                    <strong>{t('insight')}:</strong> {t('promotions_insight')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
