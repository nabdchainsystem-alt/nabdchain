import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, CurrencyDollar, TrendDown, TrendUp, Warning, CheckCircle, ChartPie } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CostControlInfo } from './CostControlInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Mock Data: Charts ---
const COST_VS_BUDGET = [
    { name: 'Electronics', cost: 45000, budget: 40000 },
    { name: 'Office', cost: 15000, budget: 18000 },
    { name: 'Hardware', cost: 25000, budget: 22000 },
    { name: 'Services', cost: 55000, budget: 50000 },
    { name: 'Furniture', cost: 12000, budget: 15000 },
];

const COST_ALLOCATION = [
    { name: 'Electronics', value: 45000 },
    { name: 'Office Supplies', value: 15000 },
    { name: 'Hardware', value: 25000 },
    { name: 'Services', value: 55000 },
    { name: 'Furniture', value: 12000 },
];

// Monthly Cost Trend
const MONTHLY_COST_TREND = [
    { name: 'Jan', value: 22000 },
    { name: 'Feb', value: 24500 },
    { name: 'Mar', value: 21000 },
    { name: 'Apr', value: 26000 },
    { name: 'May', value: 25500 },
    { name: 'Jun', value: 23500 },
];

// Savings Breakdown
const SAVINGS_BREAKDOWN = [
    { name: 'Negotiation', value: 5200 },
    { name: 'Volume Discount', value: 3800 },
    { name: 'Contract Terms', value: 2100 },
    { name: 'Process Efficiency', value: 1300 },
];

// --- Mock Data: Table & Radar ---
const ITEM_VARIANCE = [
    { id: 1, item: 'MacBook Pro M3', supplier: 'TechCorp', cost: 25000, budget: 22000, variance: 13.6 },
    { id: 2, item: 'Server Maintenance', supplier: 'CloudServices', cost: 15000, budget: 12000, variance: 25.0 },
    { id: 3, item: 'Ergonomic Chairs', supplier: 'OfficeMax', cost: 8000, budget: 10000, variance: -20.0 },
    { id: 4, item: 'Network Switches', supplier: 'HardwareInc', cost: 12000, budget: 11000, variance: 9.1 },
    { id: 5, item: 'Printer Paper', supplier: 'OfficeMax', cost: 4000, budget: 5000, variance: -20.0 },
];

const RADAR_INDICATORS = [
    { name: 'Electronics', max: 60000 },
    { name: 'Office', max: 20000 },
    { name: 'Hardware', max: 30000 },
    { name: 'Services', max: 60000 },
    { name: 'Furniture', max: 20000 },
];

export const CostControlDashboard: React.FC = () => {
    const { currency, t } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- KPI Data ---
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '1', label: t('total_cost'), subtitle: t('actual_spend'), value: '142,500', isCurrency: true, rawValue: 142500, change: '+5.2%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [130, 132, 135, 138, 140, 141, 142.5] },
        { id: '2', label: t('budget_variance'), subtitle: t('vs_plan'), value: '+8.4%', change: '+1.2%', trend: 'down', icon: <TrendUp size={18} />, sparklineData: [5, 6, 7, 7.5, 8, 8.2, 8.4] },
        { id: '3', label: t('avg_category_cost'), subtitle: t('per_category'), value: '28,500', isCurrency: true, rawValue: 28500, change: '+2%', trend: 'up', icon: <ChartPie size={18} />, sparklineData: [26, 26.5, 27, 27.5, 28, 28.2, 28.5] },
        { id: '4', label: t('negotiation_savings'), subtitle: t('total_saved'), value: '12,400', isCurrency: true, rawValue: 12400, change: '+15%', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [8, 9, 9.5, 10, 11, 12, 12.4] },
    ];

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '5', label: t('volatility_index'), subtitle: t('price_stability'), value: '42', change: '-5', trend: 'up', icon: <TrendDown size={18} />, sparklineData: [50, 48, 46, 45, 44, 43, 42] },
        { id: '6', label: t('high_risk_items'), subtitle: t('over_budget_volatile'), value: '12', change: '+2', trend: 'down', icon: <Warning size={18} />, sparklineData: [9, 10, 10, 11, 11, 12, 12] },
        { id: '7', label: t('optimization_opps'), subtitle: t('potential_savings'), value: '8', change: '0', trend: 'neutral', icon: <CurrencyDollar size={18} />, sparklineData: [6, 7, 7, 8, 8, 8, 8] },
        { id: '8', label: t('cost_efficiency'), subtitle: t('savings_rate_pct'), value: '8.7%', change: '+1.2%', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [6.5, 7, 7.3, 7.8, 8.2, 8.5, 8.7] },
    ];

    // --- ECharts Options ---

    // Pie Chart - Cost Allocation
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}: ${formatCurrency(params.value, currency.code, currency.symbol)} (${params.percent}%)` },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: COST_ALLOCATION
        }]
    };

    // Pie Chart - Savings Breakdown
    const savingsPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}: ${formatCurrency(params.value, currency.code, currency.symbol)} (${params.percent}%)` },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: SAVINGS_BREAKDOWN,
            color: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
        }]
    };

    // Radar Chart
    const radarOption: EChartsOption = {
        title: { text: t('deviation_radar'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', data: [t('budget'), t('actual_cost')], itemWidth: 10, itemHeight: 10 },
        radar: {
            indicator: RADAR_INDICATORS,
            radius: '60%',
            center: ['50%', '50%'],
            splitNumber: 4,
            splitArea: { areaStyle: { color: ['rgba(255,255,255,1)', 'rgba(245,245,245,1)'], shadowBlur: 0 } },
            axisName: { color: '#6b7280', fontSize: 10 }
        },
        series: [{
            type: 'radar',
            data: [
                {
                    value: [40000, 18000, 22000, 50000, 15000],
                    name: t('budget'),
                    itemStyle: { color: '#10b981' },
                    areaStyle: { opacity: 0.2 }
                },
                {
                    value: [45000, 15000, 25000, 55000, 12000],
                    name: t('actual_cost'),
                    itemStyle: { color: '#ef4444' },
                    areaStyle: { opacity: 0.2 }
                }
            ]
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <CostControlInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2 text-start">
                    <CurrencyDollar size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('cost_control_optimization')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('cost_control_subtitle')}</p>
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
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Recharts - Cost vs Budget */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('cost_vs_budget')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('cost_vs_budget')}</h3>
                            <p className="text-xs text-gray-400">{t('actual_vs_planned_spend')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={COST_VS_BUDGET} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(val: number) => formatCurrency(val, currency.code, currency.symbol)}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Bar dataKey="budget" name={t('budget')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                    <Bar dataKey="cost" name={t('actual_cost')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Recharts - Monthly Cost Trend */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('monthly_cost_trend')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('monthly_cost_trend')}</h3>
                            <p className="text-xs text-gray-400">{t('cost_fluctuation_over_time')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={MONTHLY_COST_TREND} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(val: number) => formatCurrency(val, currency.code, currency.symbol)}
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
                    {/* ECharts - Cost Allocation */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('cost_allocation')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('cost_allocation')}</h3>
                                <p className="text-xs text-gray-400">{t('spend_breakdown_by_category')}</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts - Savings Breakdown */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('savings_breakdown')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('savings_breakdown')}</h3>
                                <p className="text-xs text-gray-400">{t('cost_optimization_sources')}</p>
                            </div>
                            <ReactECharts option={savingsPieOption} style={{ height: '180px' }} />
                        </div>
                    )}
                </div>

                {/* Right: Side KPIs in 2x2 Grid */}
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

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('item_cost_variance')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('item')}</th>
                                        <th className="px-5 py-3 text-start">{t('supplier')}</th>
                                        <th className="px-5 py-3 text-end">{t('cost')}</th>
                                        <th className="px-5 py-3 text-end">{t('budget')}</th>
                                        <th className="px-5 py-3 text-end">{t('variance_pct')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {ITEM_VARIANCE.map((i) => (
                                        <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{i.item}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{i.supplier}</td>
                                            <td className="px-5 py-3 text-end font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(i.cost, currency.code, currency.symbol)}
                                            </td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">
                                                {formatCurrency(i.budget, currency.code, currency.symbol)}
                                            </td>
                                            <td className={`px-5 py-3 text-end font-medium ${i.variance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {i.variance > 0 ? '+' : ''}{i.variance}%
                                            </td>
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
                        <ChartSkeleton height="h-[280px]" title={t('deviation_radar')} />
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
