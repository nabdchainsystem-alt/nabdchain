import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ChartLineUp, CurrencyDollar, ShoppingCart, Users, Receipt, TrendUp, TrendDown, Star, Tag, Package, Info, ArrowsOut } from 'phosphor-react';
import { SalesDashboardInfo } from './SalesDashboardInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS_SEQUENCE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-monday-dark-surface p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {payload[0].name}: {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

const CustomAxisTick = ({ x, y, payload }: any) => {
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={12}>
                {payload.value}
            </text>
        </g>
    );
};

// --- Placeholder Data ---

const SALES_OVER_TIME_DATA = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
];

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

export const SalesInsightsDashboard: React.FC<SalesInsightsDashboardProps> = ({ hideFullscreen = false }) => {
    const { currency, t } = useAppContext();

    // Translated KPIs
    const translatedTopKPIs = TOP_KPIS.map((kpi, index) => ({
        ...kpi,
        label: [t('total_sales'), t('net_revenue'), t('orders_count'), t('avg_order_value')][index],
        subtitle: [t('gross_sales_revenue'), t('after_deductions'), t('total_processed'), t('per_transaction')][index],
    }));

    const translatedSideKPIs = SIDE_KPIS.map((kpi, index) => ({
        ...kpi,
        label: [t('returned_orders'), t('top_customer_percent'), t('profit_margin'), t('conversion_rate')][index],
        subtitle: [t('processing_returns'), t('repeat_buyers'), t('net_earnings_ratio'), t('visitor_to_buyer')][index],
    }));

    // Translated chart data
    const translatedSalesOverTimeData = SALES_OVER_TIME_DATA.map((item, index) => ({
        ...item,
        name: [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')][index],
    }));

    const translatedSalesByChannelData = SALES_BY_CHANNEL_DATA.map((item, index) => ({
        ...item,
        name: [t('channel_online'), t('channel_store'), t('channel_marketplace'), t('channel_whatsapp')][index],
    }));

    const translatedCategoryData = CATEGORY_DATA.map((item, index) => ({
        ...item,
        name: [t('category_electronics'), t('category_clothing'), t('category_groceries'), t('category_home')][index],
    }));

    const translatedStatusData = ORDER_STATUS_DATA.map((item, index) => ({
        ...item,
        name: [t('order_completed'), t('order_pending'), t('order_returned'), t('order_cancelled')][index],
    }));

    // Loading state for smooth entrance animation
    const [isLoading, setIsLoading] = useState(true);

    // Simulate data loading with staggered animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // Short delay for smooth transition
        return () => clearTimeout(timer);
    }, []);

    // State to track hovered items for extra animation control
    const [activeIndex, setActiveIndex] = useState<{ [key: string]: number | null }>({
        time: null,
        channel: null
    });

    const [showInfo, setShowInfo] = useState(false);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Calculate total revenue for percentage
    const totalRevenue = TOP_PRODUCTS_DATA.reduce((acc, curr) => acc + curr.revenue, 0);

    const categoryPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: 0, top: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            center: ['40%', '50%'],
            data: translatedCategoryData.map((d, i) => ({
                ...d,
                itemStyle: { color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'][i % 4] }
            })),
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } }
        }]
    };

    const statusPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: 0, top: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['0%', '70%'],
            center: ['40%', '50%'],
            data: translatedStatusData.map((d, i) => ({
                ...d,
                itemStyle: { color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'][i % 4] }
            })),
            label: { show: false }
        }]
    };

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
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('sales_over_time')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('weekly_performance_overview')}</p>
                            </div>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={translatedSalesOverTimeData}
                                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                        onMouseMove={(e: any) => {
                                            if (e.activeTooltipIndex !== undefined) setActiveIndex(prev => ({ ...prev, time: e.activeTooltipIndex }));
                                        }}
                                        onMouseLeave={() => setActiveIndex(prev => ({ ...prev, time: null }))}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f1f5f9', opacity: 0.5 }} content={<CustomTooltip />} />

                                        <Bar dataKey="sales" name={t('daily_sales')} radius={[4, 4, 0, 0]} barSize={50} animationDuration={1000} fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sales By Channel (Right) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('sales_by_channel')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('sales_by_channel')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('revenue_distribution_source')}</p>
                            </div>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={translatedSalesByChannelData} onMouseMove={(e: any) => {
                                        if (e.activeTooltipIndex !== undefined) setActiveIndex(prev => ({ ...prev, channel: e.activeTooltipIndex }));
                                    }} onMouseLeave={() => setActiveIndex(prev => ({ ...prev, channel: null }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis hide />
                                        <Tooltip cursor={{ fill: '#f1f5f9', opacity: 0.5 }} content={<CustomTooltip />} />

                                        <Bar dataKey="value" name={t('revenue')} radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
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
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">{t('product_name')}</th>
                                            <th className="px-6 py-3 font-medium text-end">{t('qty')}</th>
                                            <th className="px-6 py-3 font-medium text-end">{t('revenue')}</th>
                                            <th className="px-6 py-3 font-medium text-end">{t('profit')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {TOP_PRODUCTS_DATA.map((product, index) => (
                                            <tr key={product.id} className="border-b dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
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
};
