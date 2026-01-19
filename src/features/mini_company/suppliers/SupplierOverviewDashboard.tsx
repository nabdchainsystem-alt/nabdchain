import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Truck, Factory, Money, Star, Buildings, Globe, Handshake } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SupplierOverviewInfo } from './SupplierOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Total Suppliers', subtitle: 'Global Vendor Base', value: '142', change: '+5', trend: 'up', icon: <Buildings size={18} />, sparklineData: [130, 132, 135, 138, 140, 142], color: 'blue' },
    { id: '2', label: 'Active Suppliers', subtitle: 'Engaged YTD', value: '88', change: '+2', trend: 'up', icon: <Handshake size={18} />, sparklineData: [82, 84, 85, 86, 87, 88], color: 'blue' },
    { id: '3', label: 'Total Spend', subtitle: 'YTD Procurement', value: '$4.2M', change: '+12%', trend: 'up', icon: <Money size={18} />, sparklineData: [3.5, 3.6, 3.8, 3.9, 4.0, 4.2], color: 'blue' },
    { id: '4', label: 'Avg Rating', subtitle: 'Performance Score', value: '4.2', change: '+0.1', trend: 'up', icon: <Star size={18} />, sparklineData: [4.0, 4.0, 4.1, 4.1, 4.2, 4.2], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Risk Profile', subtitle: 'High Risk Vendors', value: '7', change: '-1', trend: 'down', icon: <Warning size={18} />, sparklineData: [9, 8, 8, 7, 7, 7], color: 'blue' },
    { id: '6', label: 'On-Time Deliv', subtitle: 'Global Average', value: '94%', change: '+1%', trend: 'up', icon: <Truck size={18} />, sparklineData: [92, 92, 93, 93, 94, 94], color: 'blue' },
    { id: '7', label: 'Sourcing Mix', subtitle: 'Strategic Partners', value: '25%', change: 'Stable', trend: 'neutral', icon: <Globe size={18} />, sparklineData: [25, 25, 25, 25, 25, 25], color: 'blue' },
    { id: '8', label: 'New Vendors', subtitle: 'Added This Quarter', value: '8', change: '+3', trend: 'up', icon: <Factory size={18} />, sparklineData: [4, 5, 5, 6, 7, 8], color: 'blue' },
];

// --- Mock Data: Charts ---
const SPEND_BY_SUPPLIER = [
    { name: 'Acme Mfg', Spend: 1200000 },
    { name: 'Globex', Spend: 850000 },
    { name: 'Soylent', Spend: 650000 },
    { name: 'Initech', Spend: 400000 },
    { name: 'Umbrella', Spend: 350000 },
];

const CATEGORY_SPLIT = [
    { value: 40, name: 'Raw Materials' },
    { value: 25, name: 'Logistics' },
    { value: 20, name: 'Services' },
    { value: 10, name: 'Packaging' },
    { value: 5, name: 'IT/SaaS' }
];

// Supplier Table
const SUPPLIER_TABLE = [
    { name: 'Acme Mfg', category: 'Raw Materials', spend: '$1.2M', rating: '4.8', status: 'Strategic' },
    { name: 'Globex Corp', category: 'Logistics', spend: '$850k', rating: '4.2', status: 'Preferred' },
    { name: 'Soylent Corp', category: 'Packaging', spend: '$650k', rating: '3.9', status: 'Active' },
    { name: 'Initech', category: 'IT/SaaS', spend: '$400k', rating: '4.5', status: 'Active' },
    { name: 'Umbrella Corp', category: 'Services', spend: '$350k', rating: '2.5', status: 'Probation' },
];

// Bubble Chart Data: [Spend (x), Rating (y), Risk Score (size), Supplier Name]
// Risk Score: Higher size = Higher risk for visualization purposes (or could be inverted)
// Let's say Size = Risk Score (1-10) * Factor
const BUBBLE_DATA = [
    [[1200000, 4.8, 20, 'Acme Mfg', 'Low Risk']],
    [[850000, 4.2, 30, 'Globex', 'Med Risk']],
    [[650000, 3.9, 40, 'Soylent', 'Med Risk']],
    [[400000, 4.5, 10, 'Initech', 'Low Risk']],
    [[350000, 2.5, 80, 'Umbrella', 'High Risk']],
    [[150000, 4.0, 20, 'Stark Ind', 'Low Risk']],
    [[200000, 3.5, 50, 'Cyberdyne', 'High Risk']]
];

// Additional chart data
const RATING_BY_SUPPLIER = [
    { name: 'Acme Mfg', Rating: 4.8 },
    { name: 'Globex', Rating: 4.2 },
    { name: 'Soylent', Rating: 3.9 },
    { name: 'Initech', Rating: 4.5 },
    { name: 'Umbrella', Rating: 2.5 },
];

const SUPPLIER_STATUS = [
    { value: 45, name: 'Strategic' },
    { value: 30, name: 'Active' },
    { value: 15, name: 'Probation' },
    { value: 10, name: 'New' }
];


export const SupplierOverviewDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

    // Loading state for smooth entrance animation
    const [isLoading, setIsLoading] = useState(true);

    // Simulate data loading with staggered animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: CATEGORY_SPLIT,
            color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
        }]
    };

    // Supplier Status Pie
    const statusPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: SUPPLIER_STATUS,
            color: ['#8b5cf6', '#10b981', '#ef4444', '#f59e0b']
        }]
    };

    // Bubble Chart (Scatter)
    const bubbleOption: EChartsOption = {
        title: { text: 'Supplier Matrix', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        grid: { left: '8%', right: '10%', top: '15%', bottom: '15%' },
        tooltip: {
            formatter: (params: any) => {
                return `${params.data[3]}<br/>Spend: $${(params.data[0] / 1000).toFixed(0)}k<br/>Rating: ${params.data[1]}<br/>Risk: ${params.data[4]}`;
            }
        },
        xAxis: { type: 'value', name: 'Spend', nameLocation: 'middle', nameGap: 30, splitLine: { show: false } },
        yAxis: { type: 'value', name: 'Rating', min: 1, max: 5, splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{
            type: 'scatter',
            symbolSize: function (data: any) {
                return data[2]; // Risk score controls bubble size
            },
            data: BUBBLE_DATA.flat(),
            itemStyle: {
                color: (params: any) => {
                    const risk = params.data[2];
                    if (risk > 60) return '#ef4444'; // High Risk
                    if (risk > 30) return '#f59e0b'; // Med Risk
                    return '#10b981'; // Low Risk
                },
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Factory size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Suppliers Overview</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sourcing & Procurement</p>
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
                {TOP_KPIS.map((kpi, index) => (
                    <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                        <KPICard
                            {...kpi}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two bar charts side by side --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title="Top Spend" />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title="Supplier Ratings" />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Recharts: Spend by Supplier (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Top Spend</h3>
                                <p className="text-xs text-gray-400">By Supplier</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={SPEND_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recharts: Rating by Supplier (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Supplier Ratings</h3>
                                <p className="text-xs text-gray-400">Performance Score</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={RATING_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} domain={[0, 5]} />
                                        <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="Rating" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* --- Row 3: Two pie charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <div className="grid grid-cols-2 gap-6">
                                <PieChartSkeleton title="Spend Mix" />
                                <PieChartSkeleton title="Status Mix" />
                            </div>
                        </div>
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard {...kpi} color="blue" loading={true} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Two pie charts in nested 2-col grid */}
                        <div className="col-span-2 grid grid-cols-2 gap-6">
                            {/* ECharts: Category Split (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend Mix</h3>
                                    <p className="text-xs text-gray-400">By Category</p>
                                </div>
                                <ReactECharts option={pieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Supplier Status (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Status Mix</h3>
                                    <p className="text-xs text-gray-400">By Classification</p>
                                </div>
                                <ReactECharts option={statusPieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        {/* 4 KPIs in 2x2 grid */}
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard
                                        {...kpi}
                                        color="blue"
                                        loading={isLoading}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* --- Row 4: Table + Companion Chart --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Strategic Suppliers</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Supplier</th>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3">Spend</th>
                                        <th className="px-5 py-3">Rating</th>
                                        <th className="px-5 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {SUPPLIER_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.category}</td>
                                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{row.spend}</td>
                                            <td className="px-5 py-3 text-amber-500 font-bold flex items-center gap-1">
                                                {row.rating} <Star size={12} weight="fill" />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'Strategic' ? 'bg-purple-100 text-purple-700' :
                                                    row.status === 'Probation' ? 'bg-red-100 text-red-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Bubble Matrix (2 cols) */}
                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Risk vs Value Matrix" />
                    </div>
                ) : (
                    <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={bubbleOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
