import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Clock, Lightning, Warning, TrendUp, Chats, Timer, ChartLineUp, Hourglass, Medal } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SupplierLeadTimeResponsivenessInfo } from './SupplierLeadTimeResponsivenessInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Avg Lead Time', subtitle: 'Days', value: '14.2', change: '-1.5', trend: 'down', icon: <Clock size={18} />, sparklineData: [16, 15, 15.5, 15, 14.5, 14.2], color: 'blue' },
    { id: '2', label: 'Fastest Supplier', subtitle: 'Acme Mfg', value: '5 Days', change: 'Stable', trend: 'neutral', icon: <Lightning size={18} />, color: 'blue' },
    { id: '3', label: 'Response Time (RFQ)', subtitle: 'Avg Hours', value: '24h', change: '-2h', trend: 'down', icon: <Chats size={18} />, sparklineData: [28, 27, 26, 25, 24, 24], color: 'blue' },
    { id: '4', label: 'Responsiveness Score', subtitle: 'Index (0-100)', value: '88', change: '+3', trend: 'up', icon: <Medal size={18} />, sparklineData: [82, 84, 85, 86, 87, 88], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Emergency Orders', subtitle: 'Last 30 Days', value: '12', change: '+2', trend: 'down', icon: <Warning size={18} />, sparklineData: [8, 9, 10, 11, 10, 12], color: 'blue' },
    { id: '6', label: 'Lead Time Variance', subtitle: 'Standard Dev', value: '±2.1', change: '-0.3', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [2.8, 2.6, 2.5, 2.4, 2.2, 2.1], color: 'blue' },
    { id: '7', label: 'Slowest Supplier', subtitle: 'Umbrella Corp', value: '35 Days', change: '+2', trend: 'down', icon: <Hourglass size={18} />, color: 'blue' },
    { id: '8', label: 'On-Time Quote', subtitle: 'RFQ Response Rate', value: '92%', change: '+4%', trend: 'up', icon: <Timer size={18} />, sparklineData: [85, 87, 88, 89, 90, 92], color: 'blue' },
];

// --- Mock Data: Charts ---
const LEAD_TIME_BY_SUPPLIER = [
    { name: 'Acme Mfg', LeadTime: 5, ResponseTime: 4 },
    { name: 'Globex', LeadTime: 12, ResponseTime: 24 },
    { name: 'Soylent', LeadTime: 18, ResponseTime: 12 },
    { name: 'Initech', LeadTime: 8, ResponseTime: 6 },
    { name: 'Umbrella', LeadTime: 35, ResponseTime: 48 },
];

const LEAD_TIME_BUCKETS = [
    { value: 45, name: '< 7 Days', itemStyle: { color: '#10b981' } },
    { value: 30, name: '7-14 Days', itemStyle: { color: '#3b82f6' } },
    { value: 15, name: '15-30 Days', itemStyle: { color: '#f59e0b' } },
    { value: 10, name: '> 30 Days', itemStyle: { color: '#ef4444' } }
];

const ORDER_URGENCY = [
    { value: 85, name: 'Standard' },
    { value: 15, name: 'Expedited' }
];

// Box Plot Data (Mock): Lead Time Distribution [min, Q1, median, Q3, max]
const BOX_PLOT_DATA = [
    { name: 'Acme Mfg', value: [3, 4, 5, 6, 8] },
    { name: 'Globex', value: [10, 11, 12, 14, 16] },
    { name: 'Soylent', value: [15, 17, 18, 20, 25] },
    { name: 'Initech', value: [6, 7, 8, 9, 10] },
    { name: 'Umbrella', value: [30, 32, 35, 38, 45] }
];

// Additional chart data
const RESPONSE_BY_SUPPLIER = [
    { name: 'Acme Mfg', Hours: 4 },
    { name: 'Initech', Hours: 6 },
    { name: 'Stark', Hours: 8 },
    { name: 'Globex', Hours: 24 },
    { name: 'Umbrella', Hours: 48 },
];

const PERFORMANCE_TIER = [
    { value: 35, name: 'Excellent' },
    { value: 40, name: 'Good' },
    { value: 15, name: 'Average' },
    { value: 10, name: 'Poor' }
];

// Supplier Table
const SUPPLIER_TABLE = [
    { name: 'Acme Mfg', leadTime: '5 Days', response: '4h', variance: '±0.5', score: '98' },
    { name: 'Initech', leadTime: '8 Days', response: '6h', variance: '±1.0', score: '95' },
    { name: 'Globex Corp', leadTime: '12 Days', response: '24h', variance: '±2.5', score: '85' },
    { name: 'Soylent Corp', leadTime: '18 Days', response: '12h', variance: '±3.0', score: '82' },
    { name: 'Stark Ind', leadTime: '10 Days', response: '8h', variance: '±1.2', score: '92' },
    { name: 'Umbrella Corp', leadTime: '35 Days', response: '48h', variance: '±5.0', score: '60' },
];


export const SupplierLeadTimeResponsivenessDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

    // Pie Chart: Lead Time Buckets
    const bucketsPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
        series: [{
            name: 'Lead Time Range',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: LEAD_TIME_BUCKETS
        }]
    };

    // Pie Chart: Urgency
    const urgencyPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { show: false },
        series: [{
            name: 'Urgency',
            type: 'pie',
            radius: ['0%', '70%'],
            center: ['50%', '50%'],
            data: ORDER_URGENCY,
            color: ['#3b82f6', '#f59e0b']
        }]
    };

    // Performance Tier Pie
    const performancePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: PERFORMANCE_TIER,
            color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        }]
    };

    // Box Plot: Lead Time Variability
    const boxplotOption: EChartsOption = {
        title: { text: '' },
        tooltip: { trigger: 'item', axisPointer: { type: 'shadow' } },
        grid: { left: '10%', right: '10%', bottom: '15%' },
        xAxis: {
            type: 'category',
            data: BOX_PLOT_DATA.map(item => item.name),
            boundaryGap: true,
            nameGap: 30,
            splitArea: { show: false },
            axisLabel: { formatter: '{value}' },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Days',
            splitArea: { show: true }
        },
        series: [
            {
                name: 'Lead Time Range',
                type: 'boxplot',
                datasetIndex: 1,
                itemStyle: { color: '#8b5cf6', borderColor: '#7c3aed' },
                data: BOX_PLOT_DATA.map(item => item.value)
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierLeadTimeResponsivenessInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Clock size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Lead Time & Speed</h1>
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
                            <ChartSkeleton height="h-[300px]" title="Speed Analysis" />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title="Response Times" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Speed Analysis</h3>
                                <p className="text-xs text-gray-400">Lead Time (Days) vs Response (Hours)</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={LEAD_TIME_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar yAxisId="left" dataKey="LeadTime" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name="Lead Time (Days)" animationDuration={1000} />
                                        <Bar yAxisId="right" dataKey="ResponseTime" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name="Response (Hours)" animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Response Times</h3>
                                <p className="text-xs text-gray-400">Hours to RFQ Response</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={RESPONSE_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
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
                            <div className="grid grid-cols-2 gap-4">
                                <PieChartSkeleton title="Lead Time Mix" />
                                <PieChartSkeleton title="Order Urgency" />
                            </div>
                        </div>
                        <div className="col-span-2 min-h-[250px]">
                            <div className="grid grid-cols-2 gap-4 h-full">
                                {SIDE_KPIS.map((kpi, index) => (
                                    <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                        <KPICard {...kpi} color="blue" loading={true} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2">Lead Time Mix</h3>
                                <ReactECharts option={bucketsPieOption} style={{ height: '180px' }} />
                            </div>
                            <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2">Order Urgency</h3>
                                <ReactECharts option={urgencyPieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

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

                {/* --- Row 4: Table (col-span-2) + Companion Chart (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <TableSkeleton rows={5} columns={5} />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title="Predictability Analysis" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Speed Performance</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className="px-5 py-3">Supplier</th>
                                            <th className="px-5 py-3 text-center">Lead Time</th>
                                            <th className="px-5 py-3 text-center">Response</th>
                                            <th className="px-5 py-3 text-center">Variance</th>
                                            <th className="px-5 py-3 text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {SUPPLIER_TABLE.map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                                <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.leadTime}</td>
                                                <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.response}</td>
                                                <td className="px-5 py-3 text-center font-medium text-amber-500">{row.variance}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${Number(row.score) < 80 ? 'bg-red-100 text-red-700' :
                                                        Number(row.score) < 90 ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
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

                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Predictability Analysis</h3>
                                <p className="text-xs text-gray-400">Lead Time Variability (Box Plot)</p>
                            </div>
                            <ReactECharts option={boxplotOption} style={{ height: '300px', width: '100%' }} />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
