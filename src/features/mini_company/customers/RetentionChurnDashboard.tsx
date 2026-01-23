import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, FirstAid, Prohibit, Heart, ShieldWarning, Coin } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RetentionChurnInfo } from './RetentionChurnInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// Spiral Heatmap Data (Months x Risk Level)
// Simulating a polar heatmap for "spiral" effect
const SPIRAL_DATA = [
    [0, 0, 5], [0, 1, 10], [0, 2, 2], [0, 3, 1], // Jan (Low, med, high, crit)
    [1, 0, 2], [1, 1, 5], [1, 2, 8], [1, 3, 4], // Feb
    [2, 0, 1], [2, 1, 2], [2, 2, 5], [2, 3, 10], // Mar (Spike)
    [3, 0, 8], [3, 1, 4], [3, 2, 2], [3, 3, 1], // Apr
    [4, 0, 6], [4, 1, 5], [4, 2, 2], [4, 3, 2], // May
    [5, 0, 5], [5, 1, 4], [5, 2, 3], [5, 3, 1], // Jun
];

export const RetentionChurnDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t } = useLanguage();
    const [showInfo, setShowInfo] = useState(false);

    // --- KPI Data ---
    const TOP_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '1', label: t('retention_rate'), subtitle: t('year_over_year'), value: '85%', change: '-2%', trend: 'down', icon: <Heart size={18} />, sparklineData: [88, 87, 87, 86, 86, 85], color: 'blue' },
        { id: '2', label: t('churn_rate'), subtitle: t('monthly_churn'), value: '15%', change: '+2%', trend: 'down', icon: <Prohibit size={18} />, sparklineData: [12, 13, 13, 14, 14, 15], color: 'blue' },
        { id: '3', label: t('at_risk_customers'), subtitle: t('high_churn_risk'), value: '45', change: '+5', trend: 'down', icon: <ShieldWarning size={18} />, sparklineData: [35, 38, 40, 42, 44, 45], color: 'blue' },
        { id: '4', label: t('avg_customer_lifespan'), subtitle: t('customer_tenure'), value: '18mo', change: '+1mo', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [16, 16, 17, 17, 18, 18], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '5', label: t('reactivated'), subtitle: t('returning_lost'), value: '12', change: '+2', trend: 'up', icon: <FirstAid size={18} />, sparklineData: [8, 9, 10, 10, 11, 12], color: 'blue' },
        { id: '6', label: t('churn_rate'), subtitle: t('monthly_churn'), value: '$12.5k', change: '+$1k', trend: 'down', icon: <Coin size={18} />, sparklineData: [10, 11, 11.5, 12, 12.2, 12.5], color: 'blue' },
        { id: '7', label: t('loyalty_score'), subtitle: t('nps_based'), value: '72', change: '-1', trend: 'neutral', icon: <Heart size={18} />, sparklineData: [74, 74, 73, 73, 72, 72], color: 'blue' },
        { id: '8', label: t('win_back_rate'), subtitle: t('returning_lost'), value: '18%', change: '+3%', trend: 'up', icon: <FirstAid size={18} />, sparklineData: [12, 13, 14, 15, 16, 18], color: 'blue' },
    ], [t]);

    // --- Mock Data: Charts ---
    const RETENTION_COHORT = useMemo(() => [
        { name: 'M1', Rate: 100 },
        { name: 'M2', Rate: 85 },
        { name: 'M3', Rate: 72 },
        { name: 'M4', Rate: 65 },
        { name: 'M5', Rate: 60 },
        { name: 'M6', Rate: 58 },
    ], []);

    const CHURN_SPLIT = useMemo(() => [
        { value: 85, name: t('retained') },
        { value: 10, name: t('voluntary_churn') },
        { value: 5, name: t('involuntary_churn') }
    ], [t]);

    // --- Mock Data: Table & Spiral ---
    const CHURN_TABLE = useMemo(() => [
        { customer: 'TechFlow Inc', lastPurchase: '2023-11-15', risk: t('high') + ' (92%)', reason: t('competitor'), status: t('lost') },
        { customer: 'DataSystems', lastPurchase: '2023-12-01', risk: t('medium') + ' (65%)', reason: t('service'), status: t('at_risk') },
        { customer: 'NetWorks', lastPurchase: '2023-12-20', risk: t('low') + ' (25%)', reason: t('service'), status: t('monitor') },
        { customer: 'CloudNine', lastPurchase: '2023-10-30', risk: t('high') + ' (88%)', reason: t('price'), status: t('lost') },
        { customer: 'SoftServe', lastPurchase: '2024-01-05', risk: t('medium') + ' (55%)', reason: t('service'), status: t('at_risk') },
    ], [t]);

    const MONTHS = useMemo(() => [
        t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun')
    ], [t]);

    const RISK_LEVELS = useMemo(() => [
        t('safe'), t('watch'), t('risk'), t('critical')
    ], [t]);

    // Additional chart data
    const CHURN_BY_REASON = useMemo(() => [
        { name: t('competitor'), Count: 25 },
        { name: t('price'), Count: 20 },
        { name: t('service'), Count: 15 },
        { name: t('other'), Count: 10 },
    ], [t]);

    const TENURE_BREAKDOWN = useMemo(() => [
        { value: 35, name: '< 6 ' + t('months') },
        { value: 40, name: '6-12 ' + t('months') },
        { value: 25, name: '> 12 ' + t('months') }
    ], [t]);

    // Loading state for smooth entrance animation
    const [isLoading, setIsLoading] = useState(true);

    // Simulate data loading with staggered animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

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
            data: CHURN_SPLIT,
            color: ['#6366f1', '#f43f5e', '#f97316']
        }]
    };

    // Tenure Breakdown Pie
    const tenurePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TENURE_BREAKDOWN,
            color: ['#ef4444', '#f59e0b', '#10b981']
        }]
    };

    // Polar Heatmap (Spiral)
    const spiralOption: EChartsOption = {
        title: { text: t('risk_distribution'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {
            position: 'top',
            formatter: (params: any) => `${MONTHS[params.value[0]]} - ${RISK_LEVELS[params.value[1]]}: ${params.value[2]} ${t('customers').toLowerCase()}`
        },
        animation: false,
        grid: { height: '50%', top: '10%' },
        polar: {},
        angleAxis: {
            type: 'category',
            data: MONTHS,
            boundaryGap: false,
            splitLine: { show: true, lineStyle: { color: '#ddd' } },
            axisLine: { show: false }
        },
        radiusAxis: {
            type: 'category',
            data: RISK_LEVELS,
            axisLine: { show: false },
            axisLabel: { rotate: 45 }
        },
        visualMap: {
            min: 0,
            max: 10,
            calculable: true,
            orient: 'vertical',
            left: 'right',
            top: 'center',
            inRange: { color: ['#f0f9ff', '#c084fc', '#4c1d95'] },
            show: false
        },
        series: [{
            name: t('churn_likelihood'),
            type: 'heatmap',
            coordinateSystem: 'polar' as const,
            data: SPIRAL_DATA,
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }] as any
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <RetentionChurnInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Heart size={28} className="text-pink-600 dark:text-pink-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('retention_churn')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('retention_churn_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-pink-500" />
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
                        <ChartSkeleton height="h-[300px]" title={t('cohort_retention')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('cohort_retention')}</h3>
                            <p className="text-xs text-gray-400">{t('monthly_retention')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={RETENTION_COHORT} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} unit="%" />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('churn_reasons')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('churn_reasons')}</h3>
                            <p className="text-xs text-gray-400">{t('why_customers_leave')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={CHURN_BY_REASON} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
                            <PieChartSkeleton title={t('customer_lifecycle')} />
                            <PieChartSkeleton title={t('tenure_distribution')} />
                        </div>
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('customer_lifecycle')}</h3>
                                <p className="text-xs text-gray-400">{t('status')}</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('tenure_distribution')}</h3>
                                <p className="text-xs text-gray-400">{t('inactivity_period')}</p>
                            </div>
                            <ReactECharts option={tenurePieOption} style={{ height: '180px' }} />
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
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('churn_likelihood')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">{t('customer')}</th>
                                        <th className="px-5 py-3">{t('days_since_last_order')}</th>
                                        <th className="px-5 py-3">{t('risk_level')}</th>
                                        <th className="px-5 py-3">{t('reason')}</th>
                                        <th className="px-5 py-3 text-end">{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {CHURN_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.customer}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.lastPurchase}</td>
                                            <td className="px-5 py-3">
                                                <span className={`font-medium ${row.risk.includes(t('high')) ? 'text-red-600' :
                                                    row.risk.includes(t('medium')) ? 'text-amber-600' : 'text-green-600'
                                                    }`}>
                                                    {row.risk}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs italic">{row.reason}</td>
                                            <td className="px-5 py-3 text-end">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === t('lost') ? 'bg-red-100 text-red-700' :
                                                    row.status === t('at_risk') ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Spiral */}
                {isLoading ? (
                    <div className="col-span-2">
                        <PieChartSkeleton size={240} title={t('risk_distribution')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={spiralOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
