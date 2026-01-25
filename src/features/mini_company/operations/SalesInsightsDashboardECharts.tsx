import React, { memo, useMemo } from 'react';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartLineUp, CurrencyDollar, ShoppingCart, Users, Receipt, TrendUp, TrendDown, ArrowsOut, ArrowsIn, Info } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';
import { SalesDashboardInfo } from './SalesDashboardInfo';

// --- Data ---
const SALES_OVER_TIME_DATA = {
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [4000, 3000, 2000, 2780, 1890, 2390, 3490]
};

const SALES_BY_CHANNEL_DATA = [
    { name: 'Online', value: 65 },
    { name: 'Store', value: 15 },
    { name: 'Marketplace', value: 12 },
    { name: 'WhatsApp', value: 8 },
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

// Stores raw numbers for dynamic formatting
const TOP_PRODUCTS_DATA = [
    { id: 1, name: 'Premium Headphones', quantity: 120, revenue: 24000, profit: 8000 },
    { id: 2, name: 'Ergonomic Chair', quantity: 85, revenue: 18500, profit: 6200 },
    { id: 3, name: 'Mechanical Keyboard', quantity: 60, revenue: 9000, profit: 3500 },
    { id: 4, name: 'USB-C Dock', quantity: 200, revenue: 8000, profit: 2000 },
    { id: 5, name: 'Webcam 4K', quantity: 45, revenue: 6750, profit: 2250 },
];

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Total Sales', value: '0', rawValue: 124500, isCurrency: true, change: '+12.5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [4000, 3000, 5000, 4800, 6000, 5500, 7000] },
    { id: '2', label: 'Net Revenue', value: '0', rawValue: 84320, isCurrency: true, change: '+8.2%', trend: 'up', icon: <Receipt size={18} />, sparklineData: [2000, 2500, 2200, 2800, 3000, 2900, 3500] },
    { id: '3', label: 'Orders Count', value: '1,243', change: '-3.1%', trend: 'down', icon: <ShoppingCart size={18} />, sparklineData: [50, 45, 60, 40, 35, 30, 28] },
    { id: '4', label: 'Avg Order Value', value: '0', rawValue: 102, isCurrency: true, change: '0%', trend: 'neutral', icon: <TrendUp size={18} />, sparklineData: [90, 95, 100, 102, 101, 102, 102] },
];

const SIDE_KPIS: KPIConfig[] = [
    { id: '5', label: 'Returned Orders', value: '4.2%', change: '+1.2%', trend: 'down', icon: <TrendDown size={18} />, sparklineData: [5, 4, 6, 5, 4, 3, 4] },
    { id: '6', label: 'Top Customer %', value: '18%', change: '+2.5%', trend: 'up', icon: <Users size={18} />, sparklineData: [15, 16, 15, 17, 18, 17, 18] },
    { id: '7', label: 'Profit Margin', value: '23.5%', change: '+0.5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [20, 21, 22, 22, 23, 23, 24] },
];

export const SalesInsightsDashboardECharts: React.FC = memo(() => {
    const { currency, t } = useAppContext();
    const [showInfo, setShowInfo] = React.useState(false);
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // --- chart options ---

    const salesOverTimeOption: EChartsOption = {
        tooltip: { trigger: 'axis' },
        legend: { show: true, bottom: 0, itemWidth: 10, itemHeight: 10 },
        grid: { top: 10, right: 10, bottom: 40, left: 40, containLabel: true },
        xAxis: { type: 'category', data: SALES_OVER_TIME_DATA.dates, axisLine: { show: false }, axisTick: { show: false } },
        yAxis: { type: 'value', axisLine: { show: true }, splitLine: { lineStyle: { color: '#e5e7eb' } } },
        series: [{
            name: 'Daily Sales',
            data: SALES_OVER_TIME_DATA.values,
            type: 'bar',
            itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
            barWidth: '40%'
        }]
    };

    const salesByChannelOption: EChartsOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { show: true, bottom: 0, itemWidth: 10, itemHeight: 10 },
        grid: { top: 10, right: 20, bottom: 40, left: 10, containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: SALES_BY_CHANNEL_DATA.map(d => d.name), axisLine: { show: true }, axisTick: { show: false } },
        series: [{
            name: 'Revenue Share',
            data: SALES_BY_CHANNEL_DATA.map(d => d.value),
            type: 'bar',
            itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] },
            barWidth: '40%'
        }]
    };

    const categoryPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            data: CATEGORY_DATA.map((d, i) => ({
                ...d,
                itemStyle: { color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'][i % 4] }
            })),
            label: { show: false },
            emphasis: { label: { show: false } }
        }]
    };

    const statusPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            data: ORDER_STATUS_DATA.map((d, i) => ({
                ...d,
                itemStyle: { color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'][i % 4] }
            })),
            label: { show: false },
            emphasis: { label: { show: false } }
        }]
    };

    // Calculate total revenue for percentage
    const totalRevenue = TOP_PRODUCTS_DATA.reduce((acc, curr) => acc + curr.revenue, 0);

    const treemapOption: EChartsOption = {
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
    };

    return (
        <div ref={containerRef} className={`p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative ${isFullScreen ? 'overflow-y-auto' : ''}`}>

            <SalesDashboardInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ChartLineUp size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Sales Insights (ECharts)</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Comprehensive sales data visualization using ECharts engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    >
                        {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-blue-500" />
                        {t('about_dashboard')}
                    </button>
                </div>
            </div>

            {/* Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* --- TOP ROW (4 KPIs) --- */}
                {TOP_KPIS.map((kpi) => (
                    <div key={kpi.id} className="col-span-1">
                        <KPICard
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color="blue"
                        />
                    </div>
                ))}

                {/* --- MAIN AREA (Charts) --- */}
                <div className="col-span-1 lg:col-span-3 space-y-6">

                    {/* Charts Row 1: Sales Over Time & Sales by Channel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-500 mb-5 uppercase tracking-wider">Sales Over Time</h3>
                            <MemoizedChart option={salesOverTimeOption} style={{ height: 250 }} />
                        </div>

                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-500 mb-5 uppercase tracking-wider">Sales by Channel</h3>
                            <MemoizedChart option={salesByChannelOption} style={{ height: 250 }} />
                        </div>
                    </div>

                    {/* Charts Row 2: Pie Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-500 mb-5 uppercase tracking-wider">Sales by Category</h3>
                            <MemoizedChart option={categoryPieOption} style={{ height: 250 }} />
                        </div>

                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-500 mb-5 uppercase tracking-wider">Order Status</h3>
                            <MemoizedChart option={statusPieOption} style={{ height: 250 }} />
                        </div>
                    </div>

                    {/* Charts Row 3: Product Performance (Table & Treemap) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Table: Top 5 Products */}
                        <div className="bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Top 5 Selling Products</h3>
                                <p className="text-xs text-gray-400 mt-1">Inventory and revenue leaders</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-start">Product Name</th>
                                            <th className="px-6 py-3 font-medium text-end">Quantity</th>
                                            <th className="px-6 py-3 font-medium text-end">Revenue</th>
                                            <th className="px-6 py-3 font-medium text-end">Profit</th>
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

                        {/* Treemap: Product Revenue Contribution */}
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
                            <h3 className="text-sm font-semibold text-gray-500 mb-5 uppercase tracking-wider">Revenue Contribution</h3>
                            <MemoizedChart option={treemapOption} style={{ height: '350px' }} />
                        </div>
                    </div>

                </div>

                {/* --- RIGHT COLUMN (Side KPIs) --- */}
                <div className="col-span-1 space-y-6">
                    {SIDE_KPIS.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} color="emerald" />
                    ))}
                    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-gray-400 text-sm">
                        <p>Executive AI Summary Placeholder</p>
                    </div>
                </div>

            </div>
        </div>
    );
});

SalesInsightsDashboardECharts.displayName = 'SalesInsightsDashboardECharts';
