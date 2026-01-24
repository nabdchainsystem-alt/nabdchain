import React, { useState, useMemo } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Users, UserPlus, Warning, Activity, User, Wallet } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomerOverviewInfo } from './CustomerOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Static Data (values only) ---
const CUSTOMER_LIST_DATA = [
    { id: 'C-001', name: 'Acme Corp', segmentKey: 'vip', orders: 150, revenue: '$45,000', lastActive: '2 hours ago' },
    { id: 'C-002', name: 'Globex Inc', segmentKey: 'loyal', orders: 85, revenue: '$22,500', lastActive: '1 day ago' },
    { id: 'C-003', name: 'Soylent Corp', segmentKey: 'standard', orders: 12, revenue: '$3,200', lastActive: '5 days ago' },
    { id: 'C-004', name: 'Initech', segmentKey: 'at_risk', orders: 45, revenue: '$12,000', lastActive: '30 days ago' },
    { id: 'C-005', name: 'Umbrella Corp', segmentKey: 'vip', orders: 200, revenue: '$60,000', lastActive: '10 mins ago' },
];

export const CustomerOverviewDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t, dir } = useLanguage();
    const [showInfo, setShowInfo] = useState(false);

    // --- Translated KPI Data ---
    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('total_customers'), subtitle: t('registered'), value: '2,450', change: '+120', trend: 'up' as const, icon: <Users size={18} />, sparklineData: [2300, 2350, 2380, 2400, 2420, 2450], color: 'blue' },
        { id: '2', label: t('active_customers'), subtitle: t('last_90_days'), value: '1,850', change: '+5%', trend: 'up' as const, icon: <Activity size={18} />, sparklineData: [1750, 1780, 1800, 1820, 1840, 1850], color: 'blue' },
        { id: '3', label: t('new_customers'), subtitle: t('this_month'), value: '185', change: '+15%', trend: 'up' as const, icon: <UserPlus size={18} />, sparklineData: [150, 160, 155, 170, 180, 185], color: 'blue' },
        { id: '4', label: t('churned'), subtitle: t('lost_12mo'), value: '45', change: '-2%', trend: 'down' as const, icon: <Warning size={18} />, sparklineData: [50, 48, 47, 46, 45, 45], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('avg_revenue_user'), subtitle: t('lifetime'), value: '$450', change: '+$10', trend: 'up' as const, icon: <Wallet size={18} />, sparklineData: [430, 435, 438, 440, 445, 450], color: 'blue' },
        { id: '6', label: t('engagement_rate'), subtitle: t('weekly_visits'), value: '42%', change: '+1%', trend: 'up' as const, icon: <Activity size={18} />, sparklineData: [40, 41, 40, 41, 42, 42], color: 'blue' },
        { id: '7', label: t('customer_growth_rate'), subtitle: t('month_over_month'), value: '8.5%', change: '+0.5%', trend: 'up' as const, icon: <TrendUp size={18} />, sparklineData: [7, 7.5, 7.8, 8, 8.2, 8.5], color: 'blue' },
        { id: '8', label: t('avg_session_duration'), subtitle: t('per_visit'), value: '4.2m', change: '+0.3m', trend: 'up' as const, icon: <User size={18} />, sparklineData: [3.5, 3.7, 3.9, 4.0, 4.1, 4.2], color: 'blue' },
    ], [t]);

    // --- Translated Chart Data ---
    const CUSTOMERS_BY_MONTH = useMemo(() => [
        { name: t('jan'), Total: 2000, New: 120 },
        { name: t('feb'), Total: 2120, New: 130 },
        { name: t('mar'), Total: 2250, New: 140 },
        { name: t('apr'), Total: 2350, New: 110 },
        { name: t('may'), Total: 2450, New: 150 },
        { name: t('jun'), Total: 2580, New: 180 },
    ], [t]);

    const CUSTOMER_DISTRIBUTION = useMemo(() => [
        { value: 1200, name: t('standard') },
        { value: 650, name: t('loyal') },
        { value: 350, name: t('vip') },
        { value: 185, name: t('new_segment') },
        { value: 65, name: t('at_risk') }
    ], [t]);

    const REVENUE_BY_SEGMENT = useMemo(() => [
        { name: t('vip'), Revenue: 450000 },
        { name: t('loyal'), Revenue: 280000 },
        { name: t('standard'), Revenue: 150000 },
        { name: t('new_segment'), Revenue: 50000 },
        { name: t('at_risk'), Revenue: 20000 },
    ], [t]);

    const ENGAGEMENT_STATUS = useMemo(() => [
        { value: 55, name: t('highly_active') },
        { value: 30, name: t('moderately_active') },
        { value: 15, name: t('inactive') }
    ], [t]);

    const RADIAL_DATA = useMemo(() => [
        { name: t('vip'), value: 80, children: [{ name: t('high_value'), value: 50 }, { name: t('frequency'), value: 30 }] },
        { name: t('loyal'), value: 60, children: [{ name: t('returning_customers'), value: 40 }, { name: t('promoters'), value: 20 }] },
        { name: t('standard'), value: 40, children: [{ name: t('occasional'), value: 30 }, { name: t('one_time'), value: 10 }] }
    ], [t]);

    // --- Translated Table Data ---
    const CUSTOMER_LIST = useMemo(() => CUSTOMER_LIST_DATA.map(item => ({
        ...item,
        segment: t(item.segmentKey)
    })), [t]);

    // Loading state for smooth entrance animation
    const isLoading = useFirstMountLoading('customer-overview-dashboard', 1200);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: CUSTOMER_DISTRIBUTION,
            color: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444']
        }]
    };

    // Engagement Status Pie
    const engagementPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: ENGAGEMENT_STATUS,
            color: ['#10b981', '#3b82f6', '#ef4444']
        }]
    };

    // Sunburst (Radial Map)
    const sunburstOption: EChartsOption = {
        title: { text: 'Value Density', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item' },
        series: {
            type: 'sunburst',
            data: RADIAL_DATA,
            radius: [0, '90%'],
            label: { rotate: 'radial' },
            itemStyle: { borderRadius: 4, borderWidth: 2 }
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <CustomerOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Users size={28} className="text-indigo-600 dark:text-indigo-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('customer_overview')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('customer_overview_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-indigo-500" />
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
                        <ChartSkeleton height="h-[300px]" title={t('customer_growth')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('customer_growth')}</h3>
                            <p className="text-xs text-gray-400">{t('total_vs_new')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={CUSTOMERS_BY_MONTH} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1000} />
                                    <Bar dataKey="New" fill="#dbeafe" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('revenue_by_segment')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('revenue_by_segment')}</h3>
                            <p className="text-xs text-gray-400">{t('total_revenue')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={REVENUE_BY_SEGMENT} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-6">
                            <PieChartSkeleton title={t('customer_segments')} />
                            <PieChartSkeleton title={t('engagement_status')} />
                        </div>
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('customer_segments')}</h3>
                                <p className="text-xs text-gray-400">{t('distribution_by_status')}</p>
                            </div>
                            <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                        </div>
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('engagement_status')}</h3>
                                <p className="text-xs text-gray-400">{t('activity_levels')}</p>
                            </div>
                            <MemoizedChart option={engagementPieOption} style={{ height: '180px' }} />
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
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('recent_activity')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('customer')}</th>
                                        <th className="px-5 py-3 text-start">{t('segment')}</th>
                                        <th className="px-5 py-3 text-end">{t('orders')}</th>
                                        <th className="px-5 py-3 text-end">{t('revenue')}</th>
                                        <th className="px-5 py-3 text-end">{t('last_active')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {CUSTOMER_LIST.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                    {row.name.charAt(0)}
                                                </div>
                                                {row.name}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.segmentKey === 'vip' ? 'bg-amber-100 text-amber-700' :
                                                    row.segmentKey === 'at_risk' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {row.segment}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{row.orders}</td>
                                            <td className="px-5 py-3 text-end text-green-600 font-medium">{row.revenue}</td>
                                            <td className="px-5 py-3 text-end text-gray-500 dark:text-gray-400 text-xs">{row.lastActive}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Sunburst */}
                {isLoading ? (
                    <div className="col-span-2">
                        <PieChartSkeleton size={240} title={t('value_density')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <MemoizedChart option={sunburstOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
