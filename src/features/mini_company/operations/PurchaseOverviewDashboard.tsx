import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ShoppingCart, TrendUp, Users, Info, ArrowsOut, CurrencyDollar, CalendarCheck, ChartPieSlice, Hash, Globe, Activity } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PurchaseOverviewInfo } from './PurchaseOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS_SEQUENCE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Total Purchase Spend', subtitle: 'YTD Approved', value: '$1.2M', rawValue: 1245000, isCurrency: true, change: '+8.5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [90, 95, 100, 98, 105, 110, 120], color: 'blue' },
    { id: '2', label: 'Total Purchase Orders', subtitle: 'All time', value: '145', change: '+12', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [120, 125, 130, 128, 135, 140, 145], color: 'violet' },
    { id: '3', label: 'Active Suppliers', subtitle: 'Engaged this month', value: '24', change: '+2', trend: 'up', icon: <Users size={18} />, sparklineData: [20, 21, 21, 22, 22, 23, 24], color: 'emerald' },
    { id: '4', label: 'Avg Purchase Value', subtitle: 'Per Order', value: '$8.5k', rawValue: 8586, isCurrency: true, change: '-1.2%', trend: 'down', icon: <Hash size={18} />, sparklineData: [8.8, 8.7, 8.6, 8.9, 8.7, 8.6, 8.5], color: 'cyan' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Monthly Spend Change', subtitle: 'MoM Variance', value: '+5.4%', change: '+1.1%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [3, 4, 3.5, 4.2, 4.8, 5.0, 5.4], color: 'amber' },
    { id: '6', label: 'Top Supplier Spend %', subtitle: 'Concentration Risk', value: '18%', change: '-2%', trend: 'down', icon: <ChartPieSlice size={18} />, sparklineData: [22, 21, 20, 19.5, 19, 18.5, 18], color: 'rose' },
    { id: '7', label: 'Purchase Frequency', subtitle: 'Days between orders', value: '3.2d', change: '-0.5d', trend: 'up', icon: <Activity size={18} />, sparklineData: [4, 3.8, 3.6, 3.5, 3.4, 3.3, 3.2], color: 'indigo' },
];

// --- Mock Data: Charts ---
const SPEND_BY_SUPPLIER = [
    { name: 'TechCorp', value: 45000 },
    { name: 'OfficeMax', value: 28000 },
    { name: 'LogisticsInc', value: 22000 },
    { name: 'SoftSol', value: 18000 },
    { name: 'BuildIt', value: 15000 },
];

const SPEND_BY_CATEGORY = [
    { name: 'IT High', value: 55000 },
    { name: 'Operations', value: 35000 },
    { name: 'Marketing', value: 25000 },
    { name: 'Services', value: 13000 },
];

const SPEND_DISTRIBUTION = [
    { name: 'Hardware', value: 40 },
    { name: 'Software', value: 30 },
    { name: 'Services', value: 20 },
    { name: 'Supplies', value: 10 },
];

const SUPPLIER_SHARE = [
    { name: 'TechCorp', value: 35 },
    { name: 'Others', value: 65 },
];

// --- Mock Data: Table ---
const RECENT_ORDERS = [
    { id: 'PO-2024-001', supplier: 'TechCorp Solutions', category: 'IT Hardware', amount: 12500, date: '2024-03-15', status: 'Approved' },
    { id: 'PO-2024-002', supplier: 'OfficeMax Pro', category: 'Office Supplies', amount: 3200, date: '2024-03-14', status: 'Pending' },
    { id: 'PO-2024-003', supplier: 'LogisticsInc', category: 'Services', amount: 8400, date: '2024-03-12', status: 'Approved' },
    { id: 'PO-2024-004', supplier: 'SoftSol Global', category: 'Software', amount: 24000, date: '2024-03-10', status: 'Processing' },
    { id: 'PO-2024-005', supplier: 'BuildIt Now', category: 'Maintenance', amount: 1500, date: '2024-03-08', status: 'Approved' },
];

export const PurchaseOverviewDashboard: React.FC = () => {
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
    const pieOption1: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left', top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: SPEND_DISTRIBUTION.map((d, i) => ({ ...d, itemStyle: { color: COLORS_SEQUENCE[i % COLORS_SEQUENCE.length] } }))
        }]
    };

    const pieOption2: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: '70%',
            center: ['50%', '45%'],
            data: SUPPLIER_SHARE.map((d, i) => ({ ...d, itemStyle: { color: COLORS_SEQUENCE[(i + 2) % COLORS_SEQUENCE.length] } })),
            label: { show: true, position: 'inside', formatter: '{d}%', color: '#fff', fontSize: 10 }
        }]
    };

    const polarOption: EChartsOption = {
        title: { text: 'Concentration vs Diversification', left: 'center', top: 10, textStyle: { fontSize: 12, color: '#6b7280' } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        polar: { radius: [30, '80%'] },
        angleAxis: { type: 'category', data: SPEND_BY_CATEGORY.map(c => c.name), startAngle: 75 },
        radiusAxis: { min: 0 },
        series: [{
            type: 'bar',
            data: SPEND_BY_CATEGORY.map(c => c.value),
            coordinateSystem: 'polar',
            name: 'Spend Flow',
            itemStyle: { color: (params: any) => COLORS_SEQUENCE[params.dataIndex % COLORS_SEQUENCE.length] }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <PurchaseOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ShoppingCart size={28} className="text-emerald-600 dark:text-emerald-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Purchase Overview</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Snapshot of purchasing activity and supplier engagement</p>
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
                            color={kpi.color as any || "blue"}
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Spend by Supplier */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Spend by Supplier" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend by Supplier</h3>
                                <p className="text-xs text-gray-400">Top 5 suppliers by volume</p>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={SPEND_BY_SUPPLIER} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} interval={0} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(val: number) => formatCurrency(val, currency.code, currency.symbol)}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Recharts: Spend by Category */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Spend by Category" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend by Category</h3>
                                <p className="text-xs text-gray-400">Departmental allocation</p>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={SPEND_BY_CATEGORY} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={80} fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(val: number) => formatCurrency(val, currency.code, currency.symbol)}
                                        />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Spend Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title="Spend Distribution" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend Distribution</h3>
                            </div>
                            <ReactECharts option={pieOption1} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Supplier Share */}
                    {isLoading ? (
                        <PieChartSkeleton title="Supplier Share" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Supplier Share</h3>
                            </div>
                            <ReactECharts option={pieOption2} style={{ height: '180px' }} />
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
                                color={kpi.color as any || "indigo"}
                                className="h-full"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <TableSkeleton rows={5} columns={5} />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Recent Orders</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">PO #</th>
                                        <th className="px-5 py-3">Supplier</th>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3 text-right">Amount</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {RECENT_ORDERS.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{order.id}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{order.supplier}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{order.category}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(order.amount, currency.code, currency.symbol)}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${order.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart (2 cols) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[340px]" title="Concentration vs Diversification" />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={polarOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
