import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, ArrowUpRight, ArrowDownLeft, ArrowsLeftRight, Activity, Warning, TrendUp, Clock } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StockMovementInfo } from './StockMovementInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Stock In Qty', subtitle: 'Received', value: '4,500', change: '+12%', trend: 'up', icon: <ArrowDownLeft size={18} />, sparklineData: [3500, 3800, 4000, 4100, 4300, 4500], color: 'blue' },
    { id: '2', label: 'Stock Out Qty', subtitle: 'Shipped', value: '4,100', change: '+8%', trend: 'up', icon: <ArrowUpRight size={18} />, sparklineData: [3800, 3900, 3950, 4000, 4050, 4100], color: 'blue' },
    { id: '3', label: 'Net Movement', subtitle: 'Balance', value: '+400', change: '+20%', trend: 'up', icon: <ArrowsLeftRight size={18} />, sparklineData: [200, 250, 300, 350, 380, 400], color: 'blue' },
    { id: '4', label: 'Movement Frequency', subtitle: 'Trans/Day', value: '145', change: '-5', trend: 'down', icon: <Activity size={18} />, sparklineData: [150, 155, 148, 146, 142, 145], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Bottleneck Items', subtitle: 'Slow Processing', value: '12', change: '+2', trend: 'down', icon: <Clock size={18} />, sparklineData: [10, 10, 11, 11, 12, 12], color: 'blue' },
    { id: '6', label: 'Avg Daily Movement', subtitle: 'Unit Volume', value: '850', change: '+50', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [750, 780, 800, 820, 840, 850], color: 'blue' },
    { id: '7', label: 'Movement Volatility', subtitle: 'Std Dev', value: 'High', change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [10, 20, 15, 25, 10, 30], color: 'blue' },
    { id: '8', label: 'Transfer Efficiency', subtitle: 'On-time %', value: '94.5%', change: '+1.2%', trend: 'up', icon: <Activity size={18} />, sparklineData: [91, 92, 92.5, 93, 93.8, 94.5], color: 'blue' },
];

// --- Mock Data: Charts ---
const IN_OUT_BY_CATEGORY = [
    { name: 'Electronics', in: 1200, out: 1100 },
    { name: 'Office', in: 800, out: 850 },
    { name: 'Furniture', in: 400, out: 350 },
    { name: 'Services', in: 0, out: 0 },
];

const MOVEMENT_TYPE_DISTRIBUTION = [
    { value: 45, name: 'Sales Orders' },
    { value: 30, name: 'Purchase Receipts' },
    { value: 15, name: 'Transfers' },
    { value: 5, name: 'Returns' },
    { value: 5, name: 'Adjustments' }
];

// New chart data: Daily Movement Trend
const DAILY_MOVEMENT_TREND = [
    { name: 'Mon', inbound: 650, outbound: 580 },
    { name: 'Tue', inbound: 720, outbound: 690 },
    { name: 'Wed', inbound: 800, outbound: 750 },
    { name: 'Thu', inbound: 680, outbound: 710 },
    { name: 'Fri', inbound: 890, outbound: 820 },
    { name: 'Sat', inbound: 450, outbound: 380 },
];

// New chart data: Movement by Warehouse
const MOVEMENT_BY_WAREHOUSE = [
    { value: 35, name: 'Main Hub' },
    { value: 28, name: 'North Branch' },
    { value: 22, name: 'South Branch' },
    { value: 15, name: 'Retail Store' }
];

// --- Mock Data: Table & Sankey ---
const MOVEMENT_LOG = [
    { id: 'MVT-001', sku: 'SKU-1001', type: 'Receipt', qty: 50, date: '2024-03-20', from: 'Supplier A', to: 'Main Whs' },
    { id: 'MVT-002', sku: 'SKU-1003', type: 'Shipment', qty: 200, date: '2024-03-19', from: 'South Br', to: 'Customer X' },
    { id: 'MVT-003', sku: 'SKU-1002', type: 'Transfer', qty: 10, date: '2024-03-19', from: 'Main Whs', to: 'North Br' },
    { id: 'MVT-004', sku: 'SKU-1005', type: 'Return', qty: 2, date: '2024-03-18', from: 'Customer Y', to: 'Retail Store' },
    { id: 'MVT-005', sku: 'SKU-1001', type: 'Shipment', qty: 15, date: '2024-03-18', from: 'Main Whs', to: 'Customer Z' },
];

// Sankey Data (Simulated Flow)
const SANKEY_NODES = [
    { name: 'Suppliers' }, { name: 'Main Whs' }, { name: 'North Br' }, { name: 'South Br' },
    { name: 'Retail Store' }, { name: 'Customers' }, { name: 'Returns' }
];

const SANKEY_LINKS = [
    { source: 'Suppliers', target: 'Main Whs', value: 100 },
    { source: 'Main Whs', target: 'North Br', value: 20 },
    { source: 'Main Whs', target: 'South Br', value: 30 },
    { source: 'Main Whs', target: 'Customers', value: 40 },
    { source: 'North Br', target: 'Customers', value: 15 },
    { source: 'South Br', target: 'Retail Store', value: 25 },
    { source: 'Retail Store', target: 'Customers', value: 20 },
    { source: 'Customers', target: 'Returns', value: 5 }
];

export const StockMovementDashboard: React.FC = () => {
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

    // Pie Chart - Movement Type Distribution
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: MOVEMENT_TYPE_DISTRIBUTION
        }]
    };

    // Pie Chart - Movement by Warehouse
    const warehousePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: MOVEMENT_BY_WAREHOUSE,
            color: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
        }]
    };

    // Sankey Chart for Flow
    const sankeyOption: EChartsOption = {
        title: { text: 'Inventory Flow Path', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [{
            type: 'sankey',
            data: SANKEY_NODES,
            links: SANKEY_LINKS,
            emphasis: { focus: 'adjacency' },
            lineStyle: { color: 'gradient', curveness: 0.5 },
            label: { color: '#666', fontSize: 10 },
            left: 20, right: 20, top: 40, bottom: 20
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <StockMovementInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ArrowsLeftRight size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Stock Movement & Flow</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">In/Out tracking and bottleneck detection</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-blue-500" />
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

                    {/* Recharts: In vs Out per Category */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="In vs Out per Category" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">In vs Out per Category</h3>
                                <p className="text-xs text-gray-400">Volume comparison</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={IN_OUT_BY_CATEGORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="in" name="Stock In" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                        <Bar dataKey="out" name="Stock Out" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Movement Type Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title="Movement Types" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Movement Types</h3>
                                <p className="text-xs text-gray-400">Transaction breakdown</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                    {/* Recharts: Daily Movement Trend */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Daily Movement Trend" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Daily Movement Trend</h3>
                                <p className="text-xs text-gray-400">Weekly in/out volume</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DAILY_MOVEMENT_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="inbound" name="Inbound" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={12} />
                                        <Bar dataKey="outbound" name="Outbound" fill="#f97316" radius={[4, 4, 0, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Movement by Warehouse */}
                    {isLoading ? (
                        <PieChartSkeleton title="Movement by Warehouse" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Movement by Warehouse</h3>
                                <p className="text-xs text-gray-400">Activity distribution</p>
                            </div>
                            <ReactECharts option={warehousePieOption} style={{ height: '200px' }} />
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
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Recent Movements</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3 text-right">Qty</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3 text-right">Route</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {MOVEMENT_LOG.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.sku}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${row.type === 'Receipt' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    row.type === 'Shipment' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}>
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{row.qty}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{row.date}</td>
                                            <td className="px-5 py-3 text-right text-[10px] text-gray-500 dark:text-gray-400">
                                                {row.from} <span className="text-gray-300">→</span> {row.to}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Sankey (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title="Inventory Flow Path" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={sankeyOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
