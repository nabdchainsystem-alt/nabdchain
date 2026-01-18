import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Buildings, Cube, Clock, Lightning, Warning, ChartBar, CheckCircle } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { WarehousePerformanceInfo } from './WarehousePerformanceInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Warehouses Count', subtitle: 'Active Facilities', value: '4', change: '0', trend: 'neutral', icon: <Buildings size={18} />, sparklineData: [4, 4, 4, 4, 4, 4], color: 'blue' },
    { id: '2', label: 'Total Utilization', subtitle: 'Capacity Used', value: '78%', change: '+3%', trend: 'up', icon: <Cube size={18} />, sparklineData: [70, 72, 75, 76, 77, 78], color: 'blue' },
    { id: '3', label: 'Picking Time Avg', subtitle: 'Per Order', value: '14m', change: '-2m', trend: 'up', icon: <Clock size={18} />, sparklineData: [18, 17, 16, 15, 15, 14], color: 'blue' },
    { id: '4', label: 'Fulfillment Speed', subtitle: 'Orders / Hour', value: '45', change: '+5', trend: 'up', icon: <Lightning size={18} />, sparklineData: [35, 38, 40, 42, 44, 45], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Storage Efficiency', subtitle: 'Cubic Usage', value: '88%', change: '+2%', trend: 'up', icon: <ChartBar size={18} />, sparklineData: [84, 85, 86, 87, 88, 88], color: 'blue' },
    { id: '6', label: 'Error Rate', subtitle: 'Pick/Pack', value: '0.8%', change: '-0.1%', trend: 'up', icon: <Warning size={18} />, sparklineData: [1.2, 1.1, 1.0, 0.9, 0.9, 0.8], color: 'blue' },
    { id: '7', label: 'Capacity Alerts', subtitle: 'Near Full', value: '1', change: '0', trend: 'down', icon: <Warning size={18} />, sparklineData: [2, 2, 1, 1, 1, 1], color: 'blue' },
    { id: '8', label: 'On-Time Ship', subtitle: 'Fulfillment %', value: '96.5%', change: '+1.2%', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [93, 94, 94.5, 95, 95.8, 96.5], color: 'blue' },
];

// --- Mock Data: Charts ---
const WAREHOUSE_PERFORMANCE = [
    { name: 'Main Hub', picking: 95, shipping: 90, storage: 85 },
    { name: 'North Br', picking: 88, shipping: 92, storage: 70 },
    { name: 'South Br', picking: 82, shipping: 85, storage: 60 },
    { name: 'Retail', picking: 98, shipping: 95, storage: 90 },
];

const CAPACITY_USAGE = [
    { value: 78, name: 'Used' },
    { value: 22, name: 'Free' }
];

// New chart data: Daily Throughput
const DAILY_THROUGHPUT = [
    { name: 'Mon', value: 420 },
    { name: 'Tue', value: 485 },
    { name: 'Wed', value: 510 },
    { name: 'Thu', value: 475 },
    { name: 'Fri', value: 550 },
    { name: 'Sat', value: 320 },
];

// New chart data: Order Status
const ORDER_STATUS = [
    { value: 45, name: 'Completed' },
    { value: 30, name: 'In Progress' },
    { value: 15, name: 'Pending' },
    { value: 10, name: 'On Hold' }
];

// --- Mock Data: Table & Grid ---
const WAREHOUSE_LIST = [
    { id: 'WH-001', name: 'Main Hub', capacity: '5000 pallets', usage: '4250 (85%)', orders: 1250, score: 'A' },
    { id: 'WH-002', name: 'North Branch', capacity: '2000 pallets', usage: '1400 (70%)', orders: 450, score: 'B+' },
    { id: 'WH-003', name: 'South Branch', usage: '900 (60%)', orders: 320, score: 'B', capacity: '1500 pallets' },
    { id: 'WH-STR', name: 'Retail Backroom', capacity: '500 pallets', usage: '450 (90%)', orders: 850, score: 'A+' },
];

// Grid Data (Simulated Heatmap)
const UTILIZATION_GRID = [
    [0, 0, 8], [0, 1, 9], [0, 2, 4], [0, 3, 2],
    [1, 0, 7], [1, 1, 9], [1, 2, 5], [1, 3, 3],
    [2, 0, 8], [2, 1, 8], [2, 2, 1], [2, 3, 4],
    [3, 0, 6], [3, 1, 7], [3, 2, 3], [3, 3, 2]
];

export const WarehousePerformanceDashboard: React.FC = () => {
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

    // Pie Chart - Capacity Usage
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: CAPACITY_USAGE,
            color: ['#8b5cf6', '#e5e7eb']
        }]
    };

    // Pie Chart - Order Status
    const orderStatusPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: ORDER_STATUS,
            color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
        }]
    };

    // Heatmap (Grid)
    const gridOption: EChartsOption = {
        title: { text: 'Zone Efficiency', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { position: 'top' },
        grid: { height: '70%', top: '15%' },
        xAxis: { type: 'category', data: ['Zone A', 'Zone B', 'Zone C', 'Zone D'], splitArea: { show: true } },
        yAxis: { type: 'category', data: ['Aisle 1', 'Aisle 2', 'Aisle 3', 'Aisle 4'], splitArea: { show: true } },
        visualMap: {
            min: 0, max: 10, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', itemWidth: 10, itemHeight: 10,
            inRange: { color: ['#f3e8ff', '#8b5cf6', '#4c1d95'] } // Violet gradient
        },
        series: [{
            name: 'Usage Score',
            type: 'heatmap',
            data: UTILIZATION_GRID,
            label: { show: true },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <WarehousePerformanceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Buildings size={28} className="text-violet-600 dark:text-violet-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Warehouse Performance</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Efficiency, utilization, and speed stats</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-violet-500" />
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
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Performance per Warehouse */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Facility Throughput" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Facility Throughput</h3>
                                <p className="text-xs text-gray-400">Activity scores</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={WAREHOUSE_PERFORMANCE} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="picking" name="Picking" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
                                        <Bar dataKey="shipping" name="Shipping" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
                                        <Bar dataKey="storage" name="Storage" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Capacity Usage */}
                    {isLoading ? (
                        <PieChartSkeleton title="Total Capacity" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Total Capacity</h3>
                                <p className="text-xs text-gray-400">Space utilization</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                    {/* Recharts: Daily Throughput */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Daily Throughput" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Daily Throughput</h3>
                                <p className="text-xs text-gray-400">Orders processed per day</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DAILY_THROUGHPUT} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Order Status */}
                    {isLoading ? (
                        <PieChartSkeleton title="Order Status" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Order Status</h3>
                                <p className="text-xs text-gray-400">Fulfillment breakdown</p>
                            </div>
                            <ReactECharts option={orderStatusPieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
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
                    <TableSkeleton rows={4} columns={5} />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Facility Metrics</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Warehouse</th>
                                        <th className="px-5 py-3">Capacity</th>
                                        <th className="px-5 py-3">Usage</th>
                                        <th className="px-5 py-3 text-right">Orders</th>
                                        <th className="px-5 py-3 text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {WAREHOUSE_LIST.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.capacity}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.usage}</td>
                                            <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">{row.orders}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.score.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {row.score}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Grid (2 cols) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[280px]" title="Zone Efficiency" />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={gridOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
