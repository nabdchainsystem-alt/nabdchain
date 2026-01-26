import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, TrendUp, Money, ChartLineUp, Wallet, Coins, Percent, TreeStructure } from 'phosphor-react';
import { SupplierCostInfo } from './SupplierCostInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

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
    { supplier: 'Acme Mfg', rawContract: 1100000, rawActual: 1200000, variance: '+9%', rawSavings: 0 },
    { supplier: 'Globex Corp', rawContract: 900000, rawActual: 850000, variance: '-5.5%', rawSavings: 50000 },
    { supplier: 'Soylent Corp', rawContract: 600000, rawActual: 650000, variance: '+8.3%', rawSavings: 0 },
    { supplier: 'Initech', rawContract: 420000, rawActual: 400000, variance: '-4.7%', rawSavings: 20000 },
    { supplier: 'Umbrella Corp', rawContract: 350000, rawActual: 350000, variance: '0%', rawSavings: 0 },
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
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    // Translated KPI Data
    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('total_spend'), subtitle: t('ytd_actuals'), value: '0', rawValue: 4200000, isCurrency: true, change: '+12%', trend: 'up' as const, icon: <Money size={18} />, sparklineData: [3.5, 3.6, 3.8, 3.9, 4.0, 4.2], color: 'blue' },
        { id: '2', label: t('avg_spend_supplier'), subtitle: t('vendor_concentration'), value: '0', rawValue: 48000, isCurrency: true, change: '+5%', trend: 'up' as const, icon: <Wallet size={18} />, sparklineData: [42, 43, 45, 46, 47, 48], color: 'blue' },
        { id: '3', label: t('cost_variance_pct'), subtitle: t('actual_vs_contract'), value: '2.4%', change: '-0.5%', trend: 'down' as const, icon: <Percent size={18} />, sparklineData: [3.0, 2.9, 2.8, 2.6, 2.5, 2.4], color: 'blue' },
        { id: '4', label: t('savings_achieved'), subtitle: t('cost_avoidance'), value: '0', rawValue: 120000, isCurrency: true, change: '+20%', trend: 'up' as const, icon: <Coins size={18} />, sparklineData: [80, 90, 95, 100, 110, 120], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('tail_spend'), subtitle: t('pct_of_total'), value: '15%', change: '-2%', trend: 'down' as const, icon: <ChartLineUp size={18} />, sparklineData: [18, 17, 17, 16, 15, 15], color: 'blue' },
        { id: '6', label: t('open_po_value'), subtitle: t('committed_cost'), value: '0', rawValue: 850000, isCurrency: true, change: t('stable'), trend: 'neutral' as const, icon: <TreeStructure size={18} />, sparklineData: [850, 850, 850, 850, 850, 850], color: 'blue' },
        { id: '7', label: t('sourcing_savings'), subtitle: t('projected'), value: '0', rawValue: 50000, isCurrency: true, change: '+5%', trend: 'up' as const, icon: <TrendUp size={18} />, sparklineData: [40, 42, 45, 46, 48, 50], color: 'blue' },
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
    const isLoading = useLoadingAnimation();

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Spend Distribution Pie
    const spendDistPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: TRANSLATED_SPEND_DISTRIBUTION,
            color: ['#3b82f6', '#8b5cf6', '#9ca3af']
        }]
    }), [TRANSLATED_SPEND_DISTRIBUTION]);

    // Category Spend Pie
    const categorySpendPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: TRANSLATED_CATEGORY_SPEND,
            color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
        }]
    }), [TRANSLATED_CATEGORY_SPEND]);

    // Waterfall Chart
    const waterfallOption: EChartsOption = useMemo(() => ({
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
    }), [t]);

    // Monthly Spend Trend (Area Chart)
    const spendTrendOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
        grid: { left: isRTL ? 20 : 40, right: isRTL ? 40 : 20, top: 10, bottom: 40 },
        xAxis: {
            type: 'category',
            data: TRANSLATED_SPEND_TREND.map(d => d.month),
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
                name: t('actual'),
                type: 'line',
                data: TRANSLATED_SPEND_TREND.map(d => d.Actual),
                smooth: true,
                areaStyle: { opacity: 0.1, color: '#3b82f6' },
                lineStyle: { color: '#3b82f6' },
                itemStyle: { color: '#3b82f6' },
            },
            {
                name: t('budget'),
                type: 'line',
                data: TRANSLATED_SPEND_TREND.map(d => d.Contract),
                smooth: true,
                lineStyle: { color: '#9ca3af', type: 'dashed' },
                itemStyle: { color: '#9ca3af' },
            }
        ],
    }), [isRTL, t, TRANSLATED_SPEND_TREND]);

    // Savings by Category (Bar Chart)
    const savingsBarOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 10, bottom: 30 },
        xAxis: {
            type: 'category',
            data: SAVINGS_BY_CATEGORY.map(d => d.name),
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
        series: [{
            name: t('savings'),
            type: 'bar',
            data: SAVINGS_BY_CATEGORY.map(d => d.Savings),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 28,
        }],
    }), [isRTL, t, SAVINGS_BY_CATEGORY]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierCostInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Money size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('cost_spend_control')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('financial_operations')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={isFullScreen ? t('exit_full_screen') : t('full_screen')}
                    >
                        {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
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
                {TOP_KPIS.map((kpi, index) => (
                    <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                        <KPICard
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
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
                        {/* ECharts: Monthly Spend Trend (Area) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_trend')}</h3>
                                <p className="text-xs text-gray-400">{t('monthly_run_rate')}</p>
                            </div>
                            <MemoizedChart option={spendTrendOption} style={{ height: '220px', width: '100%' }} />
                        </div>

                        {/* ECharts: Savings by Category (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('savings_sources')}</h3>
                                <p className="text-xs text-gray-400">{t('by_initiative_type')}</p>
                            </div>
                            <MemoizedChart option={savingsBarOption} style={{ height: '220px', width: '100%' }} />
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
                                <div className={`mb-2 text-start`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_distribution')}</h3>
                                    <p className="text-xs text-gray-400">{t('concentration_analysis')}</p>
                                </div>
                                <MemoizedChart option={spendDistPieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Category Spend (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className={`mb-2 text-start`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('category_split')}</h3>
                                    <p className="text-xs text-gray-400">{t('by_category')}</p>
                                </div>
                                <MemoizedChart option={categorySpendPieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        {/* 4 KPIs in 2x2 grid */}
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard
                                        {...kpi}
                                        value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
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
                        <div className={`p-5 border-b border-gray-100 dark:border-gray-700 text-start`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_analysis')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" dir={dir}>
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className={`px-5 py-3 text-start`}>{t('supplier')}</th>
                                        <th className={`px-5 py-3 text-end`}>{t('contract')}</th>
                                        <th className={`px-5 py-3 text-end`}>{t('actual')}</th>
                                        <th className="px-5 py-3 text-center">{t('variance')}</th>
                                        <th className={`px-5 py-3 text-end`}>{t('savings')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {COST_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start`}>{row.supplier}</td>
                                            <td className={`px-5 py-3 text-gray-600 dark:text-gray-400 text-end`}>{formatCurrency(row.rawContract, currency.code, currency.symbol)}</td>
                                            <td className={`px-5 py-3 font-medium text-gray-800 dark:text-gray-200 text-end`}>{formatCurrency(row.rawActual, currency.code, currency.symbol)}</td>
                                            <td className={`px-5 py-3 text-center font-bold ${row.variance.includes('-') ? 'text-green-600' : 'text-red-500'}`}>
                                                {row.variance}
                                            </td>
                                            <td className={`px-5 py-3 text-green-600 font-medium text-end`}>{formatCurrency(row.rawSavings, currency.code, currency.symbol)}</td>
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
                        <div className={`mb-2 text-start`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('cost_bridge')}</h3>
                            <p className="text-xs text-gray-400">{t('budget_to_actual_walk')}</p>
                        </div>
                        <MemoizedChart option={waterfallOption} style={{ height: '300px', width: '100%', minHeight: 100, minWidth: 100 }} />
                    </div>
                )}

            </div>
        </div>
    );
};
