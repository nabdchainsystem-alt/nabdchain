import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Money, ChartLineUp, Wallet, Coins, Percent, TreeStructure } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { SupplierCostInfo } from './SupplierCostInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Mock Data: Charts ---
const SPEND_BY_SUPPLIER = [
    { name: 'Acme Mfg', Spend: 1200000 },
    { name: 'Globex', Spend: 850000 },
    { name: 'Soylent', Spend: 650000 },
    { name: 'Initech', Spend: 400000 },
    { name: 'Umbrella', Spend: 350000 },
];

const MONTHLY_SPEND_TREND = [
    { month: 'Jan', Contract: 300, Actual: 310 },
    { month: 'Feb', Contract: 320, Actual: 325 },
    { month: 'Mar', Contract: 310, Actual: 340 },
    { month: 'Apr', Contract: 330, Actual: 320 },
    { month: 'May', Contract: 340, Actual: 345 },
    { month: 'Jun', Contract: 350, Actual: 360 },
];

// Cost Table
const COST_TABLE = [
    { supplier: 'Acme Mfg', contract: '$1.1M', actual: '$1.2M', variance: '+9%', savings: '$0' },
    { supplier: 'Globex Corp', contract: '$900k', actual: '$850k', variance: '-5.5%', savings: '$50k' },
    { supplier: 'Soylent Corp', contract: '$600k', actual: '$650k', variance: '+8.3%', savings: '$0' },
    { supplier: 'Initech', contract: '$420k', actual: '$400k', variance: '-4.7%', savings: '$20k' },
    { supplier: 'Umbrella Corp', contract: '$350k', actual: '$350k', variance: '0%', savings: '$0' },
];

// Waterfall Data
const WATERFALL_DATA = [
    { name: 'Contract Base', value: 4000, type: 'total' },
    { name: 'Price Hike', value: 300, type: 'increase' },
    { name: 'Rush Fees', value: 150, type: 'increase' },
    { name: 'Vol Rebates', value: -100, type: 'decrease' },
    { name: 'Neg Savings', value: -150, type: 'decrease' },
    { name: 'Actual Cost', value: 4200, type: 'total' }
];

const SPEND_DISTRIBUTION = [
    { value: 40, name: 'Top 5 Suppliers' },
    { value: 35, name: 'Next 10 Suppliers' },
    { value: 25, name: 'Others' }
];

const CATEGORY_SPEND = [
    { value: 35, name: 'Raw Materials' },
    { value: 25, name: 'Logistics' },
    { value: 20, name: 'Services' },
    { value: 15, name: 'Packaging' },
    { value: 5, name: 'IT/SaaS' }
];


export const SupplierCostDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [showInfo, setShowInfo] = useState(false);

    // Translated KPI Data
    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('total_spend'), subtitle: t('ytd_actuals'), value: '$4.2M', change: '+12%', trend: 'up' as const, icon: <Money size={18} />, sparklineData: [3.5, 3.6, 3.8, 3.9, 4.0, 4.2], color: 'blue' },
        { id: '2', label: t('avg_spend_supplier'), subtitle: t('vendor_concentration'), value: '$48k', change: '+5%', trend: 'up' as const, icon: <Wallet size={18} />, sparklineData: [42, 43, 45, 46, 47, 48], color: 'blue' },
        { id: '3', label: t('cost_variance_pct'), subtitle: t('actual_vs_contract'), value: '2.4%', change: '-0.5%', trend: 'down' as const, icon: <Percent size={18} />, sparklineData: [3.0, 2.9, 2.8, 2.6, 2.5, 2.4], color: 'blue' },
        { id: '4', label: t('savings_achieved'), subtitle: t('cost_avoidance'), value: '$120k', change: '+20%', trend: 'up' as const, icon: <Coins size={18} />, sparklineData: [80, 90, 95, 100, 110, 120], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('tail_spend'), subtitle: t('pct_of_total'), value: '15%', change: '-2%', trend: 'down' as const, icon: <ChartLineUp size={18} />, sparklineData: [18, 17, 17, 16, 15, 15], color: 'blue' },
        { id: '6', label: t('open_po_value'), subtitle: t('committed_cost'), value: '$850k', change: t('stable'), trend: 'neutral' as const, icon: <TreeStructure size={18} />, sparklineData: [850, 850, 850, 850, 850, 850], color: 'blue' },
        { id: '7', label: t('sourcing_savings'), subtitle: t('projected'), value: '$50k', change: '+5%', trend: 'up' as const, icon: <TrendUp size={18} />, sparklineData: [40, 42, 45, 46, 48, 50], color: 'blue' },
        { id: '8', label: t('budget_utilization'), subtitle: t('pct_of_allocated'), value: '78%', change: '+3%', trend: 'up' as const, icon: <Percent size={18} />, sparklineData: [70, 72, 74, 75, 76, 78], color: 'blue' },
    ], [t]);

    // Translated chart data
    const SAVINGS_BY_CATEGORY = useMemo(() => [
        { name: t('negotiation'), Savings: 50000 },
        { name: t('volume'), Savings: 35000 },
        { name: t('consolidation'), Savings: 20000 },
        { name: t('process'), Savings: 15000 },
    ], [t]);

    const TRANSLATED_SPEND_TREND = useMemo(() => MONTHLY_SPEND_TREND.map(item => ({
        ...item,
        month: t(item.month.toLowerCase())
    })), [t]);

    const TRANSLATED_SPEND_DISTRIBUTION = useMemo(() => [
        { value: 40, name: t('top_5_suppliers') },
        { value: 35, name: t('next_10_suppliers') },
        { value: 25, name: t('others') }
    ], [t]);

    const TRANSLATED_CATEGORY_SPEND = useMemo(() => [
        { value: 35, name: t('raw_materials') },
        { value: 25, name: t('logistics') },
        { value: 20, name: t('services') },
        { value: 15, name: t('packaging') },
        { value: 5, name: t('it_saas') }
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

    // Spend Distribution Pie
    const spendDistPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TRANSLATED_SPEND_DISTRIBUTION,
            color: ['#3b82f6', '#8b5cf6', '#9ca3af']
        }]
    };

    // Category Spend Pie
    const categorySpendPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TRANSLATED_CATEGORY_SPEND,
            color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
        }]
    };

    // Waterfall Chart
    const waterfallOption: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
                const tar = params[1];
                return tar.name + '<br/>' + tar.seriesName + ' : $' + tar.value;
            }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', splitLine: { show: false }, data: [t('contract_base'), t('price_hike'), t('rush_fees'), t('vol_rebates'), t('neg_savings'), t('actual_cost')] },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'Placeholder',
                type: 'bar',
                stack: 'Total',
                itemStyle: { borderColor: 'transparent', color: 'transparent' },
                emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
                data: [0, 4000, 4300, 4200, 4050, 0]
            },
            {
                name: t('cost_impact'),
                type: 'bar',
                stack: 'Total',
                label: { show: true, position: 'top' },
                data: [
                    { value: 4000, itemStyle: { color: '#3b82f6' } },
                    { value: 300, itemStyle: { color: '#93c5fd' } },
                    { value: 150, itemStyle: { color: '#93c5fd' } },
                    { value: 100, itemStyle: { color: '#bfdbfe' } },
                    { value: 150, itemStyle: { color: '#bfdbfe' } },
                    { value: 4200, itemStyle: { color: '#3b82f6' } }
                ]
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierCostInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Money size={28} className="text-emerald-600 dark:text-emerald-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('cost_spend_control')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('financial_operations')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-emerald-500" />
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

                {/* --- Row 2: Two bar charts side by side --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title={t('spend_trend')} />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title={t('savings_sources')} />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Recharts: Monthly Spend Trend (Area) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_trend')}</h3>
                                <p className="text-xs text-gray-400">{t('monthly_run_rate')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={TRANSLATED_SPEND_TREND} margin={{ top: 5, right: isRTL ? -20 : 5, left: isRTL ? 5 : -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="month" fontSize={10} tick={{ fill: '#9ca3af' }} reversed={isRTL} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} orientation={isRTL ? 'right' : 'left'} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                        <Area type="monotone" dataKey="Actual" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name={t('actual')} />
                                        <Area type="monotone" dataKey="Contract" stackId="2" stroke="#9ca3af" fill="none" strokeDasharray="5 5" name={t('budget')} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recharts: Savings by Category (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('savings_sources')}</h3>
                                <p className="text-xs text-gray-400">{t('by_initiative_type')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={SAVINGS_BY_CATEGORY} margin={{ top: 5, right: isRTL ? 10 : 30, left: isRTL ? 30 : 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} reversed={isRTL} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} orientation={isRTL ? 'right' : 'left'} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="Savings" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} name={t('savings')} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* --- Row 3: Two pie charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <div className="grid grid-cols-2 gap-6">
                                <PieChartSkeleton title={t('spend_distribution')} />
                                <PieChartSkeleton title={t('category_split')} />
                            </div>
                        </div>
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard {...kpi} color="blue" loading={true} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Two pie charts in nested 2-col grid */}
                        <div className="col-span-2 grid grid-cols-2 gap-6">
                            {/* ECharts: Spend Distribution (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_distribution')}</h3>
                                    <p className="text-xs text-gray-400">{t('concentration_analysis')}</p>
                                </div>
                                <ReactECharts option={spendDistPieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Category Spend (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('category_split')}</h3>
                                    <p className="text-xs text-gray-400">{t('by_category')}</p>
                                </div>
                                <ReactECharts option={categorySpendPieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        {/* 4 KPIs in 2x2 grid */}
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard
                                        {...kpi}
                                        color="blue"
                                        loading={isLoading}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* --- Row 4: Table + Companion Chart --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`p-5 border-b border-gray-100 dark:border-gray-700 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_analysis')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" dir={dir}>
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('supplier')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t('contract')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t('actual')}</th>
                                        <th className="px-5 py-3 text-center">{t('variance')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t('savings')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {COST_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 ${isRTL ? 'text-right' : ''}`}>{row.supplier}</td>
                                            <td className={`px-5 py-3 text-gray-600 dark:text-gray-400 ${isRTL ? 'text-left' : 'text-right'}`}>{row.contract}</td>
                                            <td className={`px-5 py-3 font-medium text-gray-800 dark:text-gray-200 ${isRTL ? 'text-left' : 'text-right'}`}>{row.actual}</td>
                                            <td className={`px-5 py-3 text-center font-bold ${row.variance.includes('-') ? 'text-green-600' : 'text-red-500'}`}>
                                                {row.variance}
                                            </td>
                                            <td className={`px-5 py-3 text-green-600 font-medium ${isRTL ? 'text-left' : 'text-right'}`}>{row.savings}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Waterfall (2 cols) */}
                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('cost_bridge')} />
                    </div>
                ) : (
                    <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('cost_bridge')}</h3>
                            <p className="text-xs text-gray-400">{t('budget_to_actual_walk')}</p>
                        </div>
                        <ReactECharts option={waterfallOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
