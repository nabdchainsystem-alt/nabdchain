import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ArrowsOut, Info, TrendUp, Warning, Diamond, Crown, ChartPieSlice, Coin } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SegmentationValueInfo } from './SegmentationValueInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'High-Value Clients', subtitle: 'Spend > $10k', value: '125', change: '+5', trend: 'up', icon: <Crown size={18} />, sparklineData: [115, 118, 120, 122, 124, 125], color: 'indigo' },
    { id: '2', label: 'Mid-Value Clients', subtitle: '$1k - $10k', value: '850', change: '+20', trend: 'up', icon: <Diamond size={18} />, sparklineData: [800, 810, 820, 830, 840, 850], color: 'blue' },
    { id: '3', label: 'Low-Value Clients', subtitle: '< $1k', value: '1,475', change: '-10', trend: 'down', icon: <Coin size={18} />, sparklineData: [1500, 1490, 1480, 1475, 1470, 1475], color: 'slate' },
    { id: '4', label: 'Avg CLV', subtitle: 'Lifetime Value', value: '$2,850', change: '+$150', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [2600, 2650, 2700, 2750, 2800, 2850], color: 'emerald' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Revenue Conc.', subtitle: 'Top 20% Share', value: '75%', change: '-1%', trend: 'neutral', icon: <ChartPieSlice size={18} />, sparklineData: [76, 76, 75, 75, 75, 75], color: 'amber' },
    { id: '6', label: 'Segment Growth', subtitle: 'High-Value', value: '4.5%', change: '+0.5%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [3, 3.5, 3.8, 4, 4.2, 4.5], color: 'cyan' },
    { id: '7', label: 'Risky Segment', subtitle: 'Churn Risk', value: '12%', change: '+2%', trend: 'down', icon: <Warning size={18} />, sparklineData: [10, 10, 11, 11, 12, 12], color: 'red' },
];

// --- Mock Data: Charts ---
const REVENUE_PER_SEGMENT = [
    { name: 'High-Value', Revenue: 850000 },
    { name: 'Mid-Value', Revenue: 450000 },
    { name: 'Low-Value', Revenue: 150000 },
    { name: 'New', Revenue: 50000 },
];

const SEGMENT_SHARE = [
    { value: 125, name: 'High-Value' },
    { value: 850, name: 'Mid-Value' },
    { value: 1475, name: 'Low-Value' }
];

// --- Mock Data: Table & Scatter ---
const CUSTOMER_VALUE_TABLE = [
    { id: 'C-001', name: 'Acme Corp', segment: 'High-Value', clv: '$125,000', revenue: '$45,000', freq: 'Weekly' },
    { id: 'C-005', name: 'Umbrella Corp', segment: 'High-Value', clv: '$210,000', revenue: '$60,000', freq: 'Daily' },
    { id: 'C-010', name: 'Stark Ind', segment: 'Mid-Value', clv: '$8,500', revenue: '$2,500', freq: 'Monthly' },
    { id: 'C-023', name: 'Wayne Ent', segment: 'Mid-Value', clv: '$9,200', revenue: '$3,100', freq: 'Monthly' },
    { id: 'C-099', name: 'Cyberdyne', segment: 'Low-Value', clv: '$800', revenue: '$150', freq: 'Rarely' },
];

// Scatter Data: [Frequency (x), Value (y), 'Label']
const SCATTER_DATA = [
    [50, 125000, 'Acme'],
    [100, 210000, 'Umbrella'],
    [12, 8500, 'Stark'],
    [10, 9200, 'Wayne'],
    [2, 800, 'Cyberdyne'],
    [40, 95000, 'Massive Dynamic'],
    [5, 1200, 'Initech'],
];

export const SegmentationValueDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

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
            data: SEGMENT_SHARE,
            color: ['#6366f1', '#3b82f6', '#94a3b8']
        }]
    };

    // Scatter Chart (Value vs Frequency)
    const scatterOption: EChartsOption = {
        title: { text: 'Value vs Frequency', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        grid: { top: 30, right: 40, bottom: 20, left: 50, containLabel: true },
        tooltip: {
            formatter: (params: any) => {
                return `<b>${params.value[2]}</b><br/>Freq: ${params.value[0]}<br/>CLV: $${params.value[1]}`;
            }
        },
        xAxis: { type: 'value', name: 'Orders / Year', splitLine: { show: false } },
        yAxis: { type: 'value', name: 'CLV ($)', splitLine: { show: true, lineStyle: { type: 'dashed' } } },
        series: [{
            type: 'scatter',
            symbolSize: (data: any) => Math.min(Math.max(data[1] / 5000, 10), 40),
            data: SCATTER_DATA,
            itemStyle: {
                color: (params: any) => {
                    const val = params.value[1];
                    return val > 100000 ? '#6366f1' : val > 10000 ? '#3b82f6' : '#94a3b8';
                },
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.2)'
            },
            label: { show: true, formatter: (param: any) => param.value[2], position: 'top', color: '#6b7280' }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-[#1a1d24] min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SegmentationValueInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Diamond size={28} className="text-purple-600 dark:text-purple-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Segmentation & Value</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Value-Based Analysis</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors bg-white dark:bg-[#2b2e36] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors bg-white dark:bg-[#2b2e36] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-purple-500" />
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
                            color={kpi.color as any || 'blue'}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Revenue per Segment (Bar) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Revenue Contribution</h3>
                            <p className="text-xs text-gray-400">Total Revenue by Tier</p>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={REVENUE_PER_SEGMENT} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ECharts: Segment Share (Pie) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Population Share</h3>
                            <p className="text-xs text-gray-400">Count by Tier</p>
                        </div>
                        <ReactECharts option={pieOption} style={{ height: '180px' }} />
                    </div>

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color={kpi.color as any || 'indigo'}
                                className="h-full"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Top Customers</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Segment</th>
                                    <th className="px-5 py-3 text-right">CLV</th>
                                    <th className="px-5 py-3 text-right">Total Rev</th>
                                    <th className="px-5 py-3 text-right">Freq</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {CUSTOMER_VALUE_TABLE.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.segment === 'High-Value' ? 'bg-indigo-100 text-indigo-700' :
                                                    row.segment === 'Low-Value' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {row.segment}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-emerald-600 font-bold">{row.clv}</td>
                                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.revenue}</td>
                                        <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">{row.freq}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Scatter (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <ReactECharts option={scatterOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
