import React, { useState } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart as ReactECharts } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Package, Warning, CheckCircle, Clock, ChartBar, CurrencyDollar, Archive } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InventoryOverviewInfo } from './InventoryOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Mock Data: Charts ---
const STOCK_BY_CATEGORY = [
    { name: 'Electronics', value: 850 },
    { name: 'Office', value: 300 },
    { name: 'Furniture', value: 150 },
    { name: 'Services', value: 50 },
];

const STOCK_DISTRIBUTION = [
    { value: 450, name: 'Main Warehouse' },
    { value: 250, name: 'North Branch' },
    { value: 200, name: 'South Branch' },
    { value: 150, name: 'East Depot' },
    { value: 190, name: 'Retail Store' }
];

const STOCK_LEVELS = [
    { name: 'Jan', optimal: 800, actual: 750 },
    { name: 'Feb', optimal: 800, actual: 780 },
    { name: 'Mar', optimal: 850, actual: 820 },
    { name: 'Apr', optimal: 850, actual: 860 },
    { name: 'May', optimal: 900, actual: 880 },
    { name: 'Jun', optimal: 900, actual: 920 },
];

const STOCK_STATUS = [
    { value: 850, name: 'In Stock' },
    { value: 42, name: 'Low Stock' },
    { value: 18, name: 'Out of Stock' },
    { value: 330, name: 'Overstock' }
];

// --- Mock Data: Table & Radial Map ---
const INVENTORY_ITEMS = [
    { id: 'SKU-1001', name: 'MacBook Pro 16"', category: 'Electronics', qty: 45, status: 'In Stock', warehouse: 'Main' },
    { id: 'SKU-1002', name: 'ErgoChair Pro', category: 'Furniture', qty: 12, status: 'Low Stock', warehouse: 'North' },
    { id: 'SKU-1003', name: 'USB-C Cable', category: 'Electronics', qty: 500, status: 'In Stock', warehouse: 'South' },
    { id: 'SKU-1004', name: 'Paper Ream A4', category: 'Office', qty: 0, status: 'Out of Stock', warehouse: 'Main' },
    { id: 'SKU-1005', name: 'Wireless Mouse', category: 'Electronics', qty: 25, status: 'In Stock', warehouse: 'Retail' },
];

export const InventoryOverviewDashboard: React.FC = () => {
    const { currency, t } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const isLoading = useFirstMountLoading('inventory-overview-dashboard', 800);

    // --- KPI Data ---
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
        { id: '1', label: t('total_stock_value'), subtitle: t('current_holdings'), value: '$245k', rawValue: 245000, isCurrency: true, change: '+2.4%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [230, 235, 238, 240, 242, 245], color: 'blue' },
        { id: '2', label: t('total_skus'), subtitle: t('active_items'), value: '1,240', change: '+12', trend: 'up', icon: <Package size={18} />, sparklineData: [1200, 1210, 1220, 1230, 1235, 1240], color: 'blue' },
        { id: '3', label: t('in_stock_rate'), subtitle: t('availability'), value: '98.5%', change: '-0.2%', trend: 'down', icon: <CheckCircle size={18} />, sparklineData: [99, 99, 98.8, 98.6, 98.5, 98.5], color: 'blue' },
        { id: '4', label: t('out_of_stock_items'), subtitle: t('stockouts'), value: '18', change: '+3', trend: 'down', icon: <Warning size={18} />, sparklineData: [15, 15, 16, 17, 18, 18], color: 'blue' },
    ];

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
        { id: '5', label: t('low_stock_alerts'), subtitle: t('below_reorder_point'), value: '42', change: '-5', trend: 'up', icon: <Warning size={18} />, sparklineData: [50, 48, 46, 45, 43, 42], color: 'blue' },
        { id: '6', label: t('avg_inventory_age'), subtitle: t('days_held'), value: '45d', change: '+2d', trend: 'down', icon: <Clock size={18} />, sparklineData: [40, 41, 42, 43, 44, 45], color: 'blue' },
        { id: '7', label: t('inventory_turnover'), subtitle: t('turns_per_year'), value: '4.2', change: '+0.1', trend: 'up', icon: <ChartBar size={18} />, sparklineData: [3.8, 3.9, 4.0, 4.1, 4.1, 4.2], color: 'blue' },
        { id: '8', label: t('carrying_cost'), subtitle: t('pct_of_value'), value: '12.5%', change: '-0.5%', trend: 'up', icon: <Archive size={18} />, sparklineData: [14, 13.5, 13.2, 12.8, 12.6, 12.5], color: 'blue' },
    ];


    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'In Stock': return t('in_stock');
            case 'Low Stock': return t('low_stock');
            case 'Out of Stock': return t('out_of_stock');
            default: return status;
        }
    };

    // --- ECharts Options ---

    // Pie Chart - Warehouse Distribution
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: STOCK_DISTRIBUTION
        }]
    };

    // Pie Chart - Stock Status
    const stockStatusOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: STOCK_STATUS
        }]
    };

    // Radial/Polar Bar Chart for Density
    const radialOption: EChartsOption = {
        title: { text: t('inventory_density'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        angleAxis: {
            type: 'category',
            data: [t('turnover'), t('value'), t('volume'), t('space'), t('risk')],
            z: 10
        },
        radiusAxis: {
        },
        polar: {
        },
        series: [{
            type: 'bar',
            data: [80, 50, 70, 30, 60],
            coordinateSystem: 'polar',
            name: t('density'),
            stack: 'a',
            emphasis: {
                focus: 'series'
            },
            itemStyle: {
                color: '#3b82f6'
            }
        }],
        tooltip: {}
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <InventoryOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Package size={28} className="text-emerald-600 dark:text-emerald-400 mt-1" />
                    <div className="text-start">
                        <h1 className="text-2xl font-bold">{t('inventory_overview')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('inventory_overview_desc')}</p>
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

                {/* Recharts: Stock by Category */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('stock_by_category')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('stock_by_category')}</h3>
                            <p className="text-xs text-gray-400">{t('item_count_per_group')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={STOCK_BY_CATEGORY} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Recharts: Stock Levels Trend */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('stock_levels')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('stock_levels')}</h3>
                            <p className="text-xs text-gray-400">{t('optimal_vs_actual')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={STOCK_LEVELS} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="optimal" name={t('optimal')} fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                    <Bar dataKey="actual" name={t('actual')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Stock Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('warehouse_distribution')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('warehouse_distribution')}</h3>
                                <p className="text-xs text-gray-400">{t('stock_split_by_location')}</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Stock Status */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('stock_status')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('stock_status')}</h3>
                                <p className="text-xs text-gray-400">{t('items_by_availability')}</p>
                            </div>
                            <ReactECharts option={stockStatusOption} style={{ height: '180px' }} />
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
                    <TableSkeleton rows={5} columns={6} />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('top_inventory_items')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('sku')}</th>
                                        <th className="px-5 py-3 text-start">{t('product')}</th>
                                        <th className="px-5 py-3 text-start">{t('category')}</th>
                                        <th className="px-5 py-3 text-end">{t('qty')}</th>
                                        <th className="px-5 py-3 text-center">{t('status')}</th>
                                        <th className="px-5 py-3 text-end">{t('warehouse')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {INVENTORY_ITEMS.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{item.id}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{item.name}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs text-start">{item.category}</td>
                                            <td className="px-5 py-3 text-end font-medium text-gray-900 dark:text-gray-100">{item.qty}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                                                    item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                                                        'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                    }`}>
                                                    {getStatusLabel(item.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-end text-gray-500 dark:text-gray-400 text-xs">{item.warehouse}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Radial Density (2 cols) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[300px]" title={t('inventory_density')} />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={radialOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
