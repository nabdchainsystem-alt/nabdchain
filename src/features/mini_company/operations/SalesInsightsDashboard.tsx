import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { MemoizedChart as ReactECharts } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { useStableChartData } from '../../../components/common/StableResponsiveContainer';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ChartLineUp, CurrencyDollar, ShoppingCart, Users, Receipt, TrendUp, TrendDown, Star, Tag, Package, Info, ArrowsOut, ArrowsIn } from 'phosphor-react';
import { SalesDashboardInfo } from './SalesDashboardInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS_SEQUENCE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- Placeholder Data ---

const SALES_OVER_TIME_HOURLY = [
    { name: '12AM', sales: 120 },
    { name: '1AM', sales: 80 },
    { name: '2AM', sales: 45 },
    { name: '3AM', sales: 30 },
    { name: '4AM', sales: 25 },
    { name: '5AM', sales: 60 },
    { name: '6AM', sales: 180 },
    { name: '7AM', sales: 320 },
    { name: '8AM', sales: 450 },
    { name: '9AM', sales: 620 },
    { name: '10AM', sales: 890 },
    { name: '11AM', sales: 1100 },
    { name: '12PM', sales: 1350 },
    { name: '1PM', sales: 1200 },
    { name: '2PM', sales: 980 },
    { name: '3PM', sales: 850 },
    { name: '4PM', sales: 920 },
    { name: '5PM', sales: 1150 },
    { name: '6PM', sales: 1400 },
    { name: '7PM', sales: 1100 },
    { name: '8PM', sales: 780 },
    { name: '9PM', sales: 520 },
    { name: '10PM', sales: 350 },
    { name: '11PM', sales: 200 },
];

const SALES_OVER_TIME_WEEKLY = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
];

const SALES_OVER_TIME_MONTHLY = [
    { name: 'Week 1', sales: 18500 },
    { name: 'Week 2', sales: 22300 },
    { name: 'Week 3', sales: 19800 },
    { name: 'Week 4', sales: 24100 },
];

const SALES_OVER_TIME_YEARLY = [
    { name: 'Jan', sales: 65000 },
    { name: 'Feb', sales: 59000 },
    { name: 'Mar', sales: 80000 },
    { name: 'Apr', sales: 81000 },
    { name: 'May', sales: 56000 },
    { name: 'Jun', sales: 55000 },
    { name: 'Jul', sales: 72000 },
    { name: 'Aug', sales: 68000 },
    { name: 'Sep', sales: 78000 },
    { name: 'Oct', sales: 82000 },
    { name: 'Nov', sales: 91000 },
    { name: 'Dec', sales: 105000 },
];

const SALES_BY_CHANNEL_DATA = [
    { name: 'Online', value: 65 },
    { name: 'Store', value: 15 },
    { name: 'Marketplace', value: 12 },
    { name: 'WhatsApp', value: 8 },
];

// Sales by Channel data for different time periods
const SALES_BY_CHANNEL_HOURLY = [
    { name: 'Online', value: 2800 },
    { name: 'Store', value: 650 },
    { name: 'Marketplace', value: 420 },
    { name: 'WhatsApp', value: 280 },
];

const SALES_BY_CHANNEL_WEEKLY = [
    { name: 'Online', value: 45000 },
    { name: 'Store', value: 12500 },
    { name: 'Marketplace', value: 8200 },
    { name: 'WhatsApp', value: 5800 },
];

const SALES_BY_CHANNEL_MONTHLY = [
    { name: 'Online', value: 185000 },
    { name: 'Store', value: 48000 },
    { name: 'Marketplace', value: 32000 },
    { name: 'WhatsApp', value: 22000 },
];

const SALES_BY_CHANNEL_YEARLY = [
    { name: 'Online', value: 2150000 },
    { name: 'Store', value: 580000 },
    { name: 'Marketplace', value: 385000 },
    { name: 'WhatsApp', value: 265000 },
];

const CATEGORY_DATA = [
    { name: 'Electronics', value: 400 },
    { name: 'Clothing', value: 300 },
    { name: 'Groceries', value: 300 },
    { name: 'Home', value: 200 },
];

const ORDER_STATUS_DATA = [
    { name: 'Completed', value: 60 },
    { name: 'Pending', value: 20 },
    { name: 'Returned', value: 10 },
    { name: 'Cancelled', value: 10 },
];

// Stores raw numbers now for dynamic formatting
const TOP_PRODUCTS_DATA = [
    { id: 1, name: 'Premium Headphones', quantity: 120, revenue: 24000, profit: 8000, category: 'Electronics', status: 'In Stock', rating: 4.8 },
    { id: 2, name: 'Ergonomic Chair', quantity: 85, revenue: 18500, profit: 6200, category: 'Furniture', status: 'Low Stock', rating: 4.5 },
    { id: 3, name: 'Mechanical Keyboard', quantity: 60, revenue: 9000, profit: 3500, category: 'Electronics', status: 'In Stock', rating: 4.9 },
    { id: 4, name: 'USB-C Dock', quantity: 200, revenue: 8000, profit: 2000, category: 'Accessories', status: 'In Stock', rating: 4.2 },
    { id: 5, name: 'Webcam 4K', quantity: 45, revenue: 6750, profit: 2250, category: 'Electronics', status: 'Out of Stock', rating: 4.6 },
];

// --- KPI Data ---

const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Total Sales', subtitle: 'Gross sales revenue', value: '0', rawValue: 124500, isCurrency: true, change: '+12.5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [4000, 3000, 5000, 4800, 6000, 5500, 7000] },
    { id: '2', label: 'Net Revenue', subtitle: 'After deductions', value: '0', rawValue: 84320, isCurrency: true, change: '+8.2%', trend: 'up', icon: <Receipt size={18} />, sparklineData: [2000, 2500, 2200, 2800, 3000, 2900, 3500] },
    { id: '3', label: 'Orders Count', subtitle: 'Total processed', value: '1,243', change: '-3.1%', trend: 'down', icon: <ShoppingCart size={18} />, sparklineData: [50, 45, 60, 40, 35, 30, 28] },
    { id: '4', label: 'Avg Order Value', subtitle: 'Per transaction', value: '0', rawValue: 102, isCurrency: true, change: '0%', trend: 'neutral', icon: <TrendUp size={18} />, sparklineData: [90, 95, 100, 102, 101, 102, 102] },
];

const SIDE_KPIS: KPIConfig[] = [
    { id: '5', label: 'Returned Orders', subtitle: 'Processing returns', value: '4.2%', change: '+1.2%', trend: 'down', icon: <TrendDown size={18} />, sparklineData: [5, 4, 6, 5, 4, 3, 4] },
    { id: '6', label: 'Top Customer %', subtitle: 'Repeat buyers', value: '18%', change: '+2.5%', trend: 'up', icon: <Users size={18} />, sparklineData: [15, 16, 15, 17, 18, 17, 18] },
    { id: '7', label: 'Profit Margin', subtitle: 'Net earnings ratio', value: '23.5%', change: '+0.5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [20, 21, 22, 22, 23, 23, 24] },
    { id: '8', label: 'Conversion Rate', subtitle: 'Visitor to buyer', value: '3.8%', change: '+0.4%', trend: 'up', icon: <ChartLineUp size={18} />, sparklineData: [3.0, 3.2, 3.1, 3.5, 3.6, 3.7, 3.8] },
];

interface SalesInsightsDashboardProps {
    hideFullscreen?: boolean;
}

export const SalesInsightsDashboard: React.FC<SalesInsightsDashboardProps> = memo(({ hideFullscreen = false }) => {
    const { currency, t, dir } = useAppContext();
    const isRTL = dir === 'rtl';

    // Track if component has mounted (prevent animation on re-renders)
    const hasAnimatedRef = useRef(false);

    // Memoize translated KPIs to prevent recreation on every render
    const translatedTopKPIs = useMemo(() => TOP_KPIS.map((kpi, index) => ({
        ...kpi,
        label: [t('total_sales'), t('net_revenue'), t('orders_count'), t('avg_order_value')][index],
        subtitle: [t('gross_sales_revenue'), t('after_deductions'), t('total_processed'), t('per_transaction')][index],
    })), [t]);

    const translatedSideKPIs = useMemo(() => SIDE_KPIS.map((kpi, index) => ({
        ...kpi,
        label: [t('returned_orders'), t('top_customer_percent'), t('profit_margin'), t('conversion_rate')][index],
        subtitle: [t('processing_returns'), t('repeat_buyers'), t('net_earnings_ratio'), t('visitor_to_buyer')][index],
    })), [t]);

    // State for sales time period filter (must be declared before useMemo that uses it)
    const [salesTimePeriod, setSalesTimePeriod] = useState<'hourly' | 'weekly' | 'monthly' | 'yearly'>('hourly');

    // State for channel time period filter
    const [channelTimePeriod, setChannelTimePeriod] = useState<'hourly' | 'weekly' | 'monthly' | 'yearly'>('hourly');

    // Memoize chart data - stable references prevent chart re-renders
    const translatedSalesOverTimeData = useMemo(() => {
        if (salesTimePeriod === 'hourly') {
            return SALES_OVER_TIME_HOURLY;
        } else if (salesTimePeriod === 'weekly') {
            return SALES_OVER_TIME_WEEKLY.map((item, index) => ({
                ...item,
                name: [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')][index],
            }));
        } else if (salesTimePeriod === 'monthly') {
            return SALES_OVER_TIME_MONTHLY.map((item, index) => ({
                ...item,
                name: `${t('week')} ${index + 1}`,
            }));
        } else {
            return SALES_OVER_TIME_YEARLY.map((item, index) => ({
                ...item,
                name: [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')][index],
            }));
        }
    }, [t, salesTimePeriod]);

    const translatedSalesByChannelData = useMemo(() => {
        let data;
        if (channelTimePeriod === 'hourly') {
            data = SALES_BY_CHANNEL_HOURLY;
        } else if (channelTimePeriod === 'weekly') {
            data = SALES_BY_CHANNEL_WEEKLY;
        } else if (channelTimePeriod === 'monthly') {
            data = SALES_BY_CHANNEL_MONTHLY;
        } else {
            data = SALES_BY_CHANNEL_YEARLY;
        }
        return data.map((item, index) => ({
            ...item,
            name: [t('channel_online'), t('channel_store'), t('channel_marketplace'), t('channel_whatsapp')][index],
        }));
    }, [t, channelTimePeriod]);

    const translatedCategoryData = useMemo(() => CATEGORY_DATA.map((item, index) => ({
        ...item,
        name: [t('category_electronics'), t('category_clothing'), t('category_groceries'), t('category_home')][index],
    })), [t]);

    const translatedStatusData = useMemo(() => ORDER_STATUS_DATA.map((item, index) => ({
        ...item,
        name: [t('order_completed'), t('order_pending'), t('order_returned'), t('order_cancelled')][index],
    })), [t]);

    // Use stable chart data to prevent flicker on visibility change
    const stableSalesOverTimeData = useStableChartData(translatedSalesOverTimeData);
    const stableSalesByChannelData = useStableChartData(translatedSalesByChannelData);
    const stableCategoryData = useStableChartData(translatedCategoryData);
    const stableStatusData = useStableChartData(translatedStatusData);

    // Loading state for smooth entrance animation (only on first mount)
    const [isLoading, setIsLoading] = useState(() => !hasAnimatedRef.current);

    // Simulate data loading with staggered animation (only once)
    useEffect(() => {
        if (hasAnimatedRef.current) {
            setIsLoading(false);
            return;
        }
        const timer = setTimeout(() => {
            setIsLoading(false);
            hasAnimatedRef.current = true;
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const [showInfo, setShowInfo] = useState(false);

    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Calculate total revenue for percentage (memoized)
    const totalRevenue = useMemo(() =>
        TOP_PRODUCTS_DATA.reduce((acc, curr) => acc + curr.revenue, 0), []);

    // Memoize ECharts options to prevent recreation and chart re-render
    const categoryPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            data: stableCategoryData.map((d, i) => ({
                ...d,
                itemStyle: { color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'][i % 4] }
            })),
            label: { show: false },
            emphasis: { label: { show: false } }
        }]
    }), [stableCategoryData]);

    const statusPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            data: stableStatusData.map((d, i) => ({
                ...d,
                itemStyle: { color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'][i % 4] }
            })),
            label: { show: false },
            emphasis: { label: { show: false } }
        }]
    }), [stableStatusData]);

    const treemapOption: EChartsOption = useMemo(() => ({
        tooltip: {
            formatter: (info: any) => {
                const value = info.value;
                const percentage = ((value / totalRevenue) * 100).toFixed(1);
                return `
                    <div class="font-medium text-sm text-gray-900 mb-1">${info.name}</div>
                    <div class="text-xs text-gray-500">
                        Revenue: <span class="text-gray-700 font-medium">${formatCurrency(value, currency.code, currency.symbol)}</span><br/>
                        Contribution: <span class="text-emerald-600 font-medium">${percentage}%</span>
                    </div>
                `;
            },
            backgroundColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#1f2937' },
            padding: 10
        },
        series: [{
            type: 'treemap',
            roam: false,
            nodeClick: false,
            breadcrumb: { show: false },
            label: {
                show: true,
                formatter: '{b}',
                fontSize: 12,
                color: '#fff'
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 2,
                gapWidth: 2
            },
            levels: [
                {
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 0,
                        gapWidth: 2
                    }
                }
            ],
            data: TOP_PRODUCTS_DATA.map((item, index) => ({
                name: item.name,
                value: item.revenue,
                itemStyle: {
                    color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'][index % 5]
                }
            }))
        }]
    }), [totalRevenue, currency]);

    // ECharts option for Sales Over Time bar chart
    const salesOverTimeOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: stableSalesOverTimeData.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 12 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 12 },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            position: isRTL ? 'right' : 'left',
        },
        series: [{
            type: 'bar',
            data: stableSalesOverTimeData.map(d => d.sales),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 50,
        }],
    }), [stableSalesOverTimeData, isRTL]);

    // ECharts option for Sales By Channel bar chart
    const salesByChannelOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: stableSalesByChannelData.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 12 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 12 },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            position: isRTL ? 'right' : 'left',
        },
        series: [{
            type: 'bar',
            data: stableSalesByChannelData.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 40,
        }],
    }), [stableSalesByChannelData, isRTL]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">

            <SalesDashboardInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ChartLineUp size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('sales_insights')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{t('key_sales_metrics_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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

            {/* Flat Grid Structure to Avoid Nesting Issues */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* --- COMPONENT 1: Top 4 KPIs (Row 1) --- */}
                {translatedTopKPIs.map((kpi, index) => (
                    <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                        <KPICard
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- COMPONENT 2: Sales Charts (Row 2) --- */}

                {/* Sales Over Time (Left) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('sales_over_time')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col animate-fade-in-up">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('sales_over_time')}</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {salesTimePeriod === 'hourly' ? t('hourly_performance_overview') :
                                         salesTimePeriod === 'weekly' ? t('weekly_performance_overview') :
                                         salesTimePeriod === 'monthly' ? t('monthly_performance_overview') :
                                         t('yearly_performance_overview')}
                                    </p>
                                </div>
                                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                                    {(['hourly', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setSalesTimePeriod(period)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                                salesTimePeriod === period
                                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            {t(period)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ReactECharts option={salesOverTimeOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sales By Channel (Right) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('sales_by_channel')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col animate-fade-in-up">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('sales_by_channel')}</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {channelTimePeriod === 'hourly' ? t('hourly_performance_overview') :
                                         channelTimePeriod === 'weekly' ? t('weekly_performance_overview') :
                                         channelTimePeriod === 'monthly' ? t('monthly_performance_overview') :
                                         t('yearly_performance_overview')}
                                    </p>
                                </div>
                                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                                    {(['hourly', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setChannelTimePeriod(period)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                                channelTimePeriod === period
                                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            {t(period)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[220px]">
                                <ReactECharts option={salesByChannelOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        </div>
                    )}
                </div>


                {/* --- COMPONENT 3: Pies & Side KPIs (Row 3) --- */}

                {/* Pie Charts Inner Grid (Left Half) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* Category Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('category')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('category')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('sales_by_product_category')}</p>
                            </div>
                            <ReactECharts option={categoryPieOption} style={{ height: '210px' }} />
                        </div>
                    )}

                    {/* Status Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('order_status')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('order_status')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('current_order_status_split')}</p>
                            </div>
                            <ReactECharts option={statusPieOption} style={{ height: '210px' }} />
                        </div>
                    )}
                </div>

                {/* 4 Side KPIs (Right Half - 2x2 Grid) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {translatedSideKPIs.map((kpi, index) => (
                        <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard {...kpi} color="blue" loading={isLoading} />
                        </div>
                    ))}
                </div>


                {/* --- COMPONENT 4: Expanded Products Table & Treemap (Row 4) --- */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Table: Top 5 Products */}
                    {isLoading ? (
                        <TableSkeleton rows={5} columns={4} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full animate-fade-in-up">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('top_5_selling_products')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('inventory_revenue_leaders')}</p>
                            </div>
                            <div className="overflow-x-auto h-auto flex flex-col justify-center">
                                <table className="w-full text-sm text-start">
                                    <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-start">{t('product_name')}</th>
                                            <th className="px-6 py-3 font-medium text-end">{t('qty')}</th>
                                            <th className="px-6 py-3 font-medium text-end">{t('revenue')}</th>
                                            <th className="px-6 py-3 font-medium text-end">{t('profit')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {TOP_PRODUCTS_DATA.map((product, index) => (
                                            <tr key={product.id} className="border-b dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-start">
                                                    {index + 1}. {product.name}
                                                </td>
                                                <td className="px-6 py-4 text-end text-gray-600 dark:text-gray-400">{product.quantity}</td>
                                                <td className="px-6 py-4 text-end font-medium text-gray-900 dark:text-gray-100">{formatCurrency(product.revenue, currency.code, currency.symbol)}</td>
                                                <td className="px-6 py-4 text-end text-green-600 dark:text-green-400 font-medium">{formatCurrency(product.profit, currency.code, currency.symbol)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Treemap: Product Revenue Contribution */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[420px]" title={t('revenue_contribution')} showLegend={false} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('revenue_contribution')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('visual_dominance_product_sales')}</p>
                            </div>
                            <ReactECharts option={treemapOption} style={{ height: '350px' }} />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
});

SalesInsightsDashboard.displayName = 'SalesInsightsDashboard';
