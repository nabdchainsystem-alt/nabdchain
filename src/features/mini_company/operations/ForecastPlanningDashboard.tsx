import React, { useState } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Target, ListChecks, CurrencyDollar, ArrowRight } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ForecastPlanningInfo } from './ForecastPlanningInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- Mock Data: Charts ---
const FORECAST_VS_LAST = [
    { name: 'Electronics', last: 12000, forecast: 14500 },
    { name: 'Office', last: 4500, forecast: 5100 },
    { name: 'Services', last: 8000, forecast: 8200 },
    { name: 'Furniture', last: 2000, forecast: 1800 },
    { name: 'SaaS', last: 6000, forecast: 6500 },
];

const FUTURE_ALLOCATION = [
    { value: 40, name: 'Electronics' },
    { value: 20, name: 'Services' },
    { value: 18, name: 'SaaS' },
    { value: 15, name: 'Office' },
    { value: 7, name: 'Furniture' }
];

// New: Monthly Spend Projection
const SPEND_PROJECTION = [
    { name: 'Jan', value: 38 },
    { name: 'Feb', value: 40 },
    { name: 'Mar', value: 42 },
    { name: 'Apr', value: 44 },
    { name: 'May', value: 45 },
    { name: 'Jun', value: 47 },
];

// New: Budget Utilization by Quarter
const BUDGET_UTILIZATION = [
    { name: 'Q1 Actual', value: 35 },
    { name: 'Q2 Forecast', value: 28 },
    { name: 'Q3 Forecast', value: 22 },
    { name: 'Q4 Forecast', value: 15 },
];

// --- Mock Data: Table & Confidence Cone ---
const FORECAST_DETAILS = [
    { id: 1, category: 'Electronics', last: '$12,000', forecast: '$14,500', delta: '+20.8%' },
    { id: 2, category: 'Office', last: '$4,500', forecast: '$5,100', delta: '+13.3%' },
    { id: 3, category: 'Services', last: '$8,000', forecast: '$8,200', delta: '+2.5%' },
    { id: 4, category: 'SaaS', last: '$6,000', forecast: '$6,500', delta: '+8.3%' },
    { id: 5, category: 'Furniture', last: '$2,000', forecast: '$1,800', delta: '-10.0%' },
];

// Confidence Cone Data (Simple simulation)
const CONE_DATA = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    actual: [38, 40, 42, null, null, null],
    forecast: [null, null, 42, 44, 45, 47],
    upper: [null, null, 42, 46, 48, 52],
    lower: [null, null, 42, 42, 41, 42]
};

export const ForecastPlanningDashboard: React.FC = () => {
    const { currency, t } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const isLoading = useFirstMountLoading('forecast-planning-dashboard', 800);

    // --- KPI Data (inside component for translations) ---
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '1', label: t('forecasted_spend'), subtitle: t('next_30_days'), value: '$42k', change: '+5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [38, 39, 40, 40, 41, 41, 42] },
        { id: '2', label: t('forecast_accuracy'), subtitle: t('last_period'), value: '92%', change: '+1%', trend: 'up', icon: <Target size={18} />, sparklineData: [88, 89, 90, 90, 91, 91, 92] },
        { id: '3', label: t('est_cat_growth'), subtitle: t('highest_office'), value: '+12%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [8, 9, 10, 10, 11, 11, 12] },
        { id: '4', label: t('confidence_level'), subtitle: t('model_certainty'), value: t('high'), change: '', trend: 'neutral', icon: <Target size={18} />, sparklineData: [0, 0, 0, 0, 0, 0, 0] },
    ];

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '5', label: t('supply_risk_ahead'), subtitle: t('potential_issues'), value: t('low'), change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [0, 1, 1, 1, 0, 0, 0] },
        { id: '6', label: t('planned_orders'), subtitle: t('drafted'), value: '8', change: '+2', trend: 'up', icon: <ListChecks size={18} />, sparklineData: [5, 6, 6, 7, 7, 8, 8] },
        { id: '7', label: t('budget_impact'), subtitle: t('pct_of_annual_limit'), value: '15%', change: '+1%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [12, 13, 13, 14, 14, 14, 15] },
        { id: '8', label: t('variance_trend'), subtitle: t('forecast_vs_actual'), value: '-2.1%', change: '-0.5%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [4, 3.5, 3.2, 2.8, 2.5, 2.3, 2.1] },
    ];

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart - Future Allocation
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: FUTURE_ALLOCATION
        }]
    };

    // Pie Chart - Budget Utilization
    const budgetPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: BUDGET_UTILIZATION,
            color: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
        }]
    };

    // Confidence Cone Chart
    const coneOption: EChartsOption = {
        title: { text: t('spend_projection_k'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'axis' },
        grid: { top: 30, right: 20, bottom: 20, left: 30, containLabel: true },
        xAxis: { type: 'category', data: CONE_DATA.months },
        yAxis: { type: 'value' },
        series: [
            {
                name: t('actual'),
                type: 'line',
                data: CONE_DATA.actual,
                smooth: true,
                itemStyle: { color: '#3b82f6' }
            },
            {
                name: t('forecast'),
                type: 'line',
                data: CONE_DATA.forecast,
                smooth: true,
                lineStyle: { type: 'dashed' },
                itemStyle: { color: '#10b981' }
            },
            {
                name: t('confidence_interval'),
                type: 'line',
                data: CONE_DATA.upper,
                smooth: true,
                lineStyle: { opacity: 0 },
                stack: 'confidence',
                areaStyle: { color: 'rgba(16, 185, 129, 0.2)' },
                symbol: 'none'
            },
            {
                name: 'Lower',
                type: 'line',
                data: CONE_DATA.lower,
                smooth: true,
                lineStyle: { opacity: 0 },
                stack: 'confidence',
                areaStyle: { color: '#fff' }, // Hack to clear area below
                symbol: 'none'
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <ForecastPlanningInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Target size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div className="text-start">
                        <h1 className="text-2xl font-bold">{t('forecast_planning')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('future_spend_budget_impact')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
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
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Recharts - Forecast per Category */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('forecast_per_category')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('forecast_per_category')}</h3>
                            <p className="text-xs text-gray-400">{t('previous_vs_projected')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={FORECAST_VS_LAST} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="last" name={t('last_period')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                    <Bar dataKey="forecast" name={t('forecast')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Recharts - Spend Projection */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('spend_projection')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_projection')}</h3>
                            <p className="text-xs text-gray-400">{t('monthly_forecast_k')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={SPEND_PROJECTION} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts - Future Allocation */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('future_allocation')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('future_allocation')}</h3>
                                <p className="text-xs text-gray-400">{t('budget_distribution')}</p>
                            </div>
                            <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts - Budget Utilization */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('budget_utilization')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('budget_utilization')}</h3>
                                <p className="text-xs text-gray-400">{t('quarterly_spending_progress')}</p>
                            </div>
                            <MemoizedChart option={budgetPieOption} style={{ height: '180px' }} />
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
                        <TableSkeleton rows={5} columns={4} title={t('projected_changes')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('projected_changes')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('category')}</th>
                                        <th className="px-5 py-3 text-end">{t('last_period')}</th>
                                        <th className="px-5 py-3 text-end">{t('forecast')}</th>
                                        <th className="px-5 py-3 text-end">{t('delta')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {FORECAST_DETAILS.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{r.category}</td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{r.last}</td>
                                            <td className="px-5 py-3 text-end font-medium text-gray-900 dark:text-gray-100">{r.forecast}</td>
                                            <td className={`px-5 py-3 text-end font-medium ${r.delta.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                                                {r.delta}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Confidence Cone (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title={t('spend_projection')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <MemoizedChart option={coneOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
