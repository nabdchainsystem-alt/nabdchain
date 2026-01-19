import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ShoppingCart, TrendUp, Users, Info, ArrowsOut, CurrencyDollar, CalendarCheck, ChartPieSlice, Hash, Globe, Activity, Warning } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PurchaseOverviewInfo } from './PurchaseOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS_SEQUENCE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Total Purchase Spend', subtitle: 'YTD Approved', value: '$1.2M', rawValue: 1245000, isCurrency: true, change: '+8.5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [90, 95, 100, 98, 105, 110, 120], color: 'blue' },
    { id: '2', label: 'Total Purchase Orders', subtitle: 'All time', value: '145', change: '+12', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [120, 125, 130, 128, 135, 140, 145], color: 'blue' },
    { id: '3', label: 'Active Suppliers', subtitle: 'Engaged this month', value: '24', change: '+2', trend: 'up', icon: <Users size={18} />, sparklineData: [20, 21, 21, 22, 22, 23, 24], color: 'blue' },
    { id: '4', label: 'Avg Purchase Value', subtitle: 'Per Order', value: '$8.5k', rawValue: 8586, isCurrency: true, change: '-1.2%', trend: 'down', icon: <Hash size={18} />, sparklineData: [8.8, 8.7, 8.6, 8.9, 8.7, 8.6, 8.5], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Monthly Spend Change', subtitle: 'MoM Variance', value: '+5.4%', change: '+1.1%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [3, 4, 3.5, 4.2, 4.8, 5.0, 5.4], color: 'blue' },
    { id: '6', label: 'Top Supplier Spend %', subtitle: 'Concentration Risk', value: '18%', change: '-2%', trend: 'down', icon: <ChartPieSlice size={18} />, sparklineData: [22, 21, 20, 19.5, 19, 18.5, 18], color: 'blue' },
    { id: '7', label: 'Purchase Frequency', subtitle: 'Days between orders', value: '3.2d', change: '-0.5d', trend: 'up', icon: <Activity size={18} />, sparklineData: [4, 3.8, 3.6, 3.5, 3.4, 3.3, 3.2], color: 'blue' },
    { id: '8', label: 'Unplanned Purchase Rate', subtitle: 'Outside approved plan', value: '12%', change: '-3%', trend: 'up', icon: <Warning size={18} />, sparklineData: [18, 16, 15, 14, 13, 12.5, 12], color: 'blue' },
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
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 }, itemGap: 15 },
        series: [{
            type: 'pie',
            radius: ['35%', '65%'],
            center: ['50%', '40%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: SPEND_DISTRIBUTION.map((d, i) => ({ ...d, itemStyle: { color: COLORS_SEQUENCE[i % COLORS_SEQUENCE.length] } }))
        }]
    };

    const pieOption2: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 }, itemGap: 15 },
        series: [{
            type: 'pie',
            radius: ['35%', '65%'],
            center: ['50%', '40%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: SUPPLIER_SHARE.map((d, i) => ({ ...d, itemStyle: { color: COLORS_SEQUENCE[(i + 2) % COLORS_SEQUENCE.length] } }))
        }]
    };

    // Marimekko Chart Data - shows spend concentration by category and supplier distribution
    const merimekkoData = [
        { category: 'IT Hardware', width: 35, segments: [{ name: 'TechCorp', value: 60 }, { name: 'Others', value: 40 }] },
        { category: 'Operations', width: 28, segments: [{ name: 'LogisticsInc', value: 45 }, { name: 'Others', value: 55 }] },
        { category: 'Marketing', width: 20, segments: [{ name: 'OfficeMax', value: 35 }, { name: 'Others', value: 65 }] },
        { category: 'Services', width: 17, segments: [{ name: 'SoftSol', value: 50 }, { name: 'Others', value: 50 }] },
    ];

    // Calculate x positions for Marimekko bars
    let xOffset = 0;
    const merimekkoSeries: any[] = [];
    const xAxisData: string[] = [];

    merimekkoData.forEach((cat, catIndex) => {
        xAxisData.push(cat.category);
        cat.segments.forEach((seg, segIndex) => {
            if (!merimekkoSeries[segIndex]) {
                merimekkoSeries[segIndex] = {
                    name: segIndex === 0 ? 'Primary Supplier' : 'Other Suppliers',
                    type: 'bar',
                    stack: 'total',
                    barWidth: '90%',
                    emphasis: { focus: 'series' },
                    itemStyle: {
                        color: segIndex === 0 ? '#3b82f6' : '#e5e7eb'
                    },
                    data: []
                };
            }
            merimekkoSeries[segIndex].data.push(seg.value);
        });
    });

    const marimekkoOption: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
                const cat = merimekkoData[params[0].dataIndex];
                let result = `<strong>${cat.category}</strong> (${cat.width}% of total)<br/>`;
                params.forEach((p: any) => {
                    result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`;
                });
                return result;
            }
        },
        legend: { bottom: 5, left: 'center', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 10 } },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLabel: { fontSize: 10, color: '#6b7280', interval: 0 },
            axisLine: { lineStyle: { color: '#e5e7eb' } }
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { fontSize: 10, color: '#9ca3af', formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
        },
        series: merimekkoSeries
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <PurchaseOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ShoppingCart size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Purchase Overview</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Snapshot of purchasing activity and supplier engagement</p>
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
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color={kpi.color as any || "blue"}
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Spend by Supplier (Left) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Spend by Supplier" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Spend by Supplier</h3>
                                <p className="text-xs text-gray-400 mt-1">Top 5 suppliers by volume</p>
                            </div>
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={SPEND_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis type="number" fontSize={11} tick={{ fill: '#94a3b8' }} />
                                        <YAxis type="category" dataKey="name" fontSize={12} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(val: number) => formatCurrency(val, currency.code, currency.symbol)}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Spend by Category (Right) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Spend by Category" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Spend by Category</h3>
                                <p className="text-xs text-gray-400 mt-1">Departmental allocation</p>
                            </div>
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={SPEND_BY_CATEGORY} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis type="number" fontSize={11} tick={{ fill: '#94a3b8' }} />
                                        <YAxis type="category" dataKey="name" fontSize={12} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(val: number) => formatCurrency(val, currency.code, currency.symbol)}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Row 3: Two Charts + 4 Side KPIs --- */}

                {/* Charts Inner Grid (Left Half) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* Spend Distribution Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title="Spend Distribution" />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Spend Distribution</h3>
                                <p className="text-xs text-gray-400 mt-1">Breakdown by purchase type</p>
                            </div>
                            <ReactECharts option={pieOption1} style={{ height: '210px' }} />
                        </div>
                    )}

                    {/* Supplier Share Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title="Supplier Share" />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Supplier Share</h3>
                                <p className="text-xs text-gray-400 mt-1">Market share of top suppliers</p>
                            </div>
                            <ReactECharts option={pieOption2} style={{ height: '210px' }} />
                        </div>
                    )}
                </div>

                {/* 4 Side KPIs (Right Half - 2x2 Grid) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                                color={kpi.color as any || "blue"}
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
                    <ChartSkeleton height="h-[280px]" title="Concentration vs Diversification" />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend Concentration by Category</h3>
                            <p className="text-xs text-gray-400">Distribution across categories and supplier dependency</p>
                        </div>
                        <ReactECharts option={marimekkoOption} style={{ height: '280px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
