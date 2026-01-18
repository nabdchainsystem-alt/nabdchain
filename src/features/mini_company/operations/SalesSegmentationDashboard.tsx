import React, { useState, useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
    Users, Medal, ChartLine, CurrencyDollar, TrendUp, Warning,
    Info, ArrowsOut,
    CaretLeft, CaretRight, Star, Heart, Repeat, UserPlus
} from 'phosphor-react';
import { SalesSegmentationInfo } from './SalesSegmentationInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#06b6d4'];

// --- Mock Data ---

const CUSTOMERS_PER_SEGMENT_DATA = [
    { name: 'High Value', count: 120, revenue: 450000 },
    { name: 'Medium Value', count: 450, revenue: 280000 },
    { name: 'Low Value', count: 1200, revenue: 95000 },
    { name: 'At Risk', count: 320, revenue: 42000 },
];

const REPEAT_VS_ONETIME_DATA = [
    { name: 'VIP', repeat: 85, onetime: 15 },
    { name: 'Regular', repeat: 60, onetime: 40 },
    { name: 'New', repeat: 10, onetime: 90 },
    { name: 'Churned', repeat: 95, onetime: 5 },
];

const REVENUE_BY_SEGMENT_DATA = [
    { value: 55, name: 'High Value' },
    { value: 25, name: 'Medium Value' },
    { value: 12, name: 'Low Value' },
    { value: 8, name: 'At Risk' },
];

const TABLE_DATA = [
    { id: 1, name: 'John Doe', segment: 'High Value', orders: 24, revenue: 15400, lastDate: '2026-01-10', score: 98 },
    { id: 2, name: 'Sarah Smith', segment: 'Medium Value', orders: 12, revenue: 8200, lastDate: '2026-01-08', score: 75 },
    { id: 3, name: 'Ahmed Ali', segment: 'High Value', orders: 35, revenue: 22000, lastDate: '2026-01-12', score: 95 },
    { id: 4, name: 'Emily Brown', segment: 'Low Value', orders: 2, revenue: 1200, lastDate: '2025-12-15', score: 30 },
    { id: 5, name: 'Omar Hassan', segment: 'At Risk', orders: 8, revenue: 4500, lastDate: '2025-11-20', score: 45 },
    { id: 6, name: 'Layla George', segment: 'Medium Value', orders: 15, revenue: 9800, lastDate: '2026-01-11', score: 82 },
    { id: 7, name: 'Michael Chen', segment: 'High Value', orders: 28, revenue: 18900, lastDate: '2026-01-14', score: 92 },
];

// --- Sub-components ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-monday-dark-surface p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-1 px-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.name}: <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface SalesSegmentationDashboardProps {
    hideFullscreen?: boolean;
}

export const SalesSegmentationDashboard: React.FC<SalesSegmentationDashboardProps> = ({ hideFullscreen = false }) => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // Table State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'revenue', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Sorted Table Data
    const processedTableData = useMemo(() => {
        let data = [...TABLE_DATA];
        if (sortConfig.key && sortConfig.direction) {
            data.sort((a: any, b: any) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedTableData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedTableData, currentPage]);

    const totalPages = Math.ceil(processedTableData.length / itemsPerPage);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
        setSortConfig({ key, direction });
    };

    // KPI Config
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '1', label: 'Total Customers', subtitle: 'Lifetime registered base', value: '4,850', change: '+3.2%', trend: 'up', icon: <Users size={18} />, sparklineData: [4200, 4350, 4480, 4580, 4680, 4780, 4850] },
        { id: '2', label: 'Active Customers', subtitle: 'Last 90 days activity', value: '3,240', change: '+5.4%', trend: 'up', icon: <Star size={18} />, sparklineData: [2800, 2920, 3020, 3080, 3140, 3200, 3240] },
        { id: '3', label: 'Repeat Customer %', subtitle: 'Loyalty retention rate', value: '64.2%', change: '+1.5%', trend: 'up', icon: <Repeat size={18} />, sparklineData: [58, 59.5, 60.8, 62, 63, 63.8, 64.2] },
        { id: '4', label: 'Avg. CLV', subtitle: 'Est. lifetime value', value: '0', rawValue: 12450, isCurrency: true, change: '+8.4%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [10.2, 10.8, 11.2, 11.6, 12, 12.2, 12.45] },
    ];

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '5', label: 'Avg. Orders', subtitle: 'Per customer frequency', value: '4.2', change: '+0.5', trend: 'up', icon: <ChartLine size={18} />, sparklineData: [3.5, 3.7, 3.8, 3.9, 4, 4.1, 4.2] },
        { id: '6', label: 'Churn Rate %', subtitle: 'Lost customer ratio', value: '12.4%', change: '-0.8%', trend: 'up', icon: <Warning size={18} />, sparklineData: [15, 14.5, 14, 13.5, 13, 12.8, 12.4] },
        { id: '7', label: 'Engagement Score', subtitle: 'Recency/Freq/Value avg', value: '78/100', change: '+4%', trend: 'up', icon: <Heart size={18} />, sparklineData: [68, 70, 72, 74, 75, 77, 78] },
        { id: '8', label: 'New Customers', subtitle: 'Monthly acquisitions', value: '186', change: '+12%', trend: 'up', icon: <UserPlus size={18} />, sparklineData: [145, 152, 160, 168, 175, 180, 186] },
    ];

    // ECharts Revenue Pie Option
    const revenuePieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: { bottom: '0%', left: 'center', textStyle: { fontSize: 10, color: '#94a3b8' } },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            data: REVENUE_BY_SEGMENT_DATA.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } }))
        }]
    };

    // ECharts Loyalty Curve Scatter Option
    const loyaltyScatterOption: EChartsOption = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `<div class="p-2 font-sans">
                    <p class="font-bold text-gray-800">${params.data[2]}</p>
                    <p class="text-xs text-gray-500 mt-1">Orders: ${params.data[0]}</p>
                    <p class="text-xs text-gray-500">Revenue: ${formatCurrency(params.data[1], currency.code, currency.symbol)}</p>
                </div>`;
            }
        },
        grid: { top: '15%', bottom: '15%', left: '15%', right: '10%' },
        xAxis: { name: 'Orders per Customer', nameLocation: 'middle', nameGap: 25 },
        yAxis: { name: 'Revenue per Customer', nameLocation: 'middle', nameGap: 35 },
        series: [{
            symbolSize: (data: any) => Math.sqrt(data[1]) / 2,
            data: [
                [24, 15400, 'High Value Avg'],
                [12, 8200, 'Medium Value Avg'],
                [2, 1200, 'Low Value Avg'],
                [8, 4500, 'At Risk Avg'],
            ],
            type: 'scatter',
            itemStyle: { color: '#8b5cf6' }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">

            <SalesSegmentationInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-start gap-2 text-left">
                    <Users size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Customer Segmentation & Loyalty</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Personalizing campaigns and maximizing customer lifetime value</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!hideFullscreen && (
                        <button
                            onClick={toggleFullScreen}
                            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                            title="Full Screen"
                        >
                            <ArrowsOut size={18} />
                        </button>
                    )}
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
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area - 2x2 Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Row 1, Col 1: Customer Segmentation Bar Chart */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Customer Segmentation" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4 text-left">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Customer Segmentation</h3>
                                <p className="text-xs text-gray-400">Count per segment</p>
                            </div>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={CUSTOMERS_PER_SEGMENT_DATA} margin={{ left: -10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="count" name="Customers" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Row 1, Col 2: Repeat vs One-time (Recharts) */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Repeat vs One-Time" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4 text-left">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Repeat vs One-Time</h3>
                                <p className="text-xs text-gray-400">Loyalty depth by segment</p>
                            </div>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={REPEAT_VS_ONETIME_DATA} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="repeat" name="Repeat %" stackId="a" fill="#10b981" barSize={16} />
                                        <Bar dataKey="onetime" name="One-Time %" stackId="a" fill="#f43f5e" barSize={16} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Row 2, Col 1: Revenue by Segment Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title="Revenue by Segment" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2 text-left">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Revenue by Segment</h3>
                                <p className="text-xs text-gray-400">Contribution share</p>
                            </div>
                            <ReactECharts option={revenuePieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                    {/* Row 2, Col 2: Loyalty Curve Scatter */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Loyalty Curve" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2 text-left">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Loyalty Curve</h3>
                                <p className="text-xs text-gray-400">Orders vs revenue by segment</p>
                            </div>
                            <ReactECharts option={loyaltyScatterOption} style={{ height: '200px' }} />
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
                <div className="lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Table (Col 1) */}
                {isLoading ? (
                    <TableSkeleton rows={5} columns={5} />
                ) : (
                    <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col text-left animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Top Customers List</h3>
                                <p className="text-xs text-gray-400 mt-1 italic">Segmentation and engagement monitoring</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-[350px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Segment</th>
                                        <th className="px-6 py-4 text-right">Orders</th>
                                        <th className="px-6 py-4 text-right">Revenue</th>
                                        <th className="px-6 py-4 text-right">Eng. Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {paginatedData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b dark:border-gray-700 last:border-none">
                                            <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white">{row.name}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.segment === 'High Value' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    row.segment === 'Medium Value' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {row.segment}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-medium text-gray-500">{row.orders}</td>
                                            <td className="px-6 py-5 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(row.revenue, currency.code, currency.symbol)}</td>
                                            <td className="px-6 py-5 text-right font-mono text-xs">{row.score}/100</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10 mt-auto">
                            <span className="text-xs text-gray-500">
                                Page <span className="font-bold text-gray-700 dark:text-gray-300">{currentPage}</span> of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                >
                                    <CaretLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                >
                                    <CaretRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer Value Companion Chart */}
                {isLoading ? (
                    <ChartSkeleton height="h-[450px]" title="Customer Value Distribution" />
                ) : (
                    <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col h-full text-left animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-normal">
                                Customer Value Distribution
                            </h3>
                            <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Revenue contribution by segment tier</p>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={CUSTOMERS_PER_SEGMENT_DATA} margin={{ left: -10, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-normal">
                                <strong>Insight:</strong> The "High Value" segment accounts for 55% of revenue while making up only 7.5% of the total customer base.
                            </p>
                        </div>
                    </div>
                )}
                </div>

            </div>
        </div>
    );
};
