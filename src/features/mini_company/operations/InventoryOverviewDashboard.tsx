import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Package, Warning, CheckCircle, Clock, ChartBar, CurrencyDollar, Archive } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InventoryOverviewInfo } from './InventoryOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Total Stock Value', subtitle: 'Current Holdings', value: '$245k', rawValue: 245000, isCurrency: true, change: '+2.4%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [230, 235, 238, 240, 242, 245], color: 'blue' },
    { id: '2', label: 'Total SKUs', subtitle: 'Active Items', value: '1,240', change: '+12', trend: 'up', icon: <Package size={18} />, sparklineData: [1200, 1210, 1220, 1230, 1235, 1240], color: 'blue' },
    { id: '3', label: 'In-Stock Rate', subtitle: 'Availability', value: '98.5%', change: '-0.2%', trend: 'down', icon: <CheckCircle size={18} />, sparklineData: [99, 99, 98.8, 98.6, 98.5, 98.5], color: 'blue' },
    { id: '4', label: 'Out-of-Stock Items', subtitle: 'Stockouts', value: '18', change: '+3', trend: 'down', icon: <Warning size={18} />, sparklineData: [15, 15, 16, 17, 18, 18], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Low Stock Alerts', subtitle: '< Reorder Point', value: '42', change: '-5', trend: 'up', icon: <Warning size={18} />, sparklineData: [50, 48, 46, 45, 43, 42], color: 'blue' },
    { id: '6', label: 'Avg Inventory Age', subtitle: 'Days Held', value: '45d', change: '+2d', trend: 'down', icon: <Clock size={18} />, sparklineData: [40, 41, 42, 43, 44, 45], color: 'blue' },
    { id: '7', label: 'Inventory Turnover', subtitle: 'Turns / Year', value: '4.2', change: '+0.1', trend: 'up', icon: <ChartBar size={18} />, sparklineData: [3.8, 3.9, 4.0, 4.1, 4.1, 4.2], color: 'blue' },
    { id: '8', label: 'Carrying Cost', subtitle: '% of Value', value: '12.5%', change: '-0.5%', trend: 'up', icon: <Archive size={18} />, sparklineData: [14, 13.5, 13.2, 12.8, 12.6, 12.5], color: 'blue' },
];

// --- Mock Data: Charts ---
const STOCK_BY_CATEGORY = [
    { name: 'Electronics', value: 850 },
    { name: 'Office', value: 300 },
    { name: 'Furniture', value: 150 },
    { name: 'Services', value: 50 }, // Maybe consumables
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

// Radial Bar Data (Simulated for density)
const RADIAL_DATA = [
    [0, 0, 10], [0, 1, 20], [0, 2, 30],
    [1, 0, 40], [1, 1, 50], [1, 2, 60],
    [2, 0, 70], [2, 1, 80], [2, 2, 90]
    // ... simplified, actually using basic bar polar for better visualization
];

export const InventoryOverviewDashboard: React.FC = () => {
    const { currency } = useAppContext();
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
    // Using a polar bar chart to represent "Density" spread
    const radialOption: EChartsOption = {
        title: { text: 'Inventory Density', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        angleAxis: {
            type: 'category',
            data: ['Turnover', 'Value', 'Volume', 'Space', 'Risk'],
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
            name: 'Density',
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
                    <div>
                        <h1 className="text-2xl font-bold">Inventory Overview</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time stock levels and health</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-emerald-500" />
                        About Dashboard
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

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Stock by Category */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Stock by Category" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Stock by Category</h3>
                                <p className="text-xs text-gray-400">Item count per group</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={STOCK_BY_CATEGORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Stock Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title="Warehouse Distribution" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Warehouse Distribution</h3>
                                <p className="text-xs text-gray-400">Stock split by location</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                    {/* Recharts: Stock Levels Trend */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Stock Levels" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Stock Levels</h3>
                                <p className="text-xs text-gray-400">Optimal vs Actual</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={STOCK_LEVELS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="optimal" name="Optimal" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={12} />
                                        <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Stock Status */}
                    {isLoading ? (
                        <PieChartSkeleton title="Stock Status" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Stock Status</h3>
                                <p className="text-xs text-gray-400">Items by availability</p>
                            </div>
                            <ReactECharts option={stockStatusOption} style={{ height: '200px' }} />
                        </div>
                    )}

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                                color="blue"
                                className="h-full"
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
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Top Inventory Items</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3">Product</th>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3 text-right">Qty</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                        <th className="px-5 py-3 text-right">Warehouse</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {INVENTORY_ITEMS.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{item.id}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{item.name}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{item.category}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{item.qty}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">{item.warehouse}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Radial Density (2 cols) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[300px]" title="Inventory Density" />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={radialOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
