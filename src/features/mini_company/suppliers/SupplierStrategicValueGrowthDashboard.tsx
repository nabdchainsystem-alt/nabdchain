import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Handshake, TrendUp, Star, Lightbulb, Users, Crown, Rocket } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SupplierStrategicValueGrowthInfo } from './SupplierStrategicValueGrowthInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Strategic Suppliers', subtitle: 'Tier 1 Partners', value: '12', change: '+1', trend: 'up', icon: <Crown size={18} />, sparklineData: [10, 11, 11, 11, 12, 12], color: 'blue' },
    { id: '2', label: 'Spend Growth %', subtitle: 'YoY Increase', value: '+18%', change: '+3%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [12, 14, 15, 16, 17, 18], color: 'blue' },
    { id: '3', label: 'Innovation Score', subtitle: 'Avg Rating', value: '8.5', change: '+0.2', trend: 'up', icon: <Lightbulb size={18} />, sparklineData: [8.0, 8.1, 8.2, 8.3, 8.4, 8.5], color: 'blue' },
    { id: '4', label: 'Partnership Index', subtitle: 'Relationship Strength', value: '92', change: 'Stable', trend: 'neutral', icon: <Handshake size={18} />, sparklineData: [90, 91, 91, 92, 92, 92], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Long-Term Contracts', subtitle: '> 3 Years', value: '8', change: '+2', trend: 'up', icon: <Users size={18} />, sparklineData: [6, 6, 7, 7, 7, 8], color: 'blue' },
    { id: '6', label: 'Revenue Impact', subtitle: 'Supplier Enabled', value: '$1.2M', change: '+10%', trend: 'up', icon: <Rocket size={18} />, sparklineData: [0.9, 1.0, 1.0, 1.1, 1.1, 1.2], color: 'blue' },
    { id: '7', label: 'Strategic Fit', subtitle: 'Alignment Score', value: '95%', change: 'Stable', trend: 'neutral', icon: <Star size={18} />, color: 'blue' },
    { id: '8', label: 'Joint Initiatives', subtitle: 'Active Projects', value: '6', change: '+1', trend: 'up', icon: <Handshake size={18} />, sparklineData: [3, 4, 4, 5, 5, 6], color: 'blue' },
];

// --- Mock Data: Charts ---
const SPEND_GROWTH = [
    { name: 'Acme Mfg', Growth: 25, Duration: 5 },
    { name: 'Globex', Growth: 15, Duration: 3 },
    { name: 'Soylent', Growth: 10, Duration: 2 },
    { name: 'Initech', Growth: 5, Duration: 1 },
    { name: 'Stark Ind', Growth: 30, Duration: 4 },
];

const STRATEGIC_SPLIT = [
    { value: 12, name: 'Strategic', itemStyle: { color: '#8b5cf6' } },
    { value: 25, name: 'Preferred', itemStyle: { color: '#3b82f6' } },
    { value: 45, name: 'Transactional', itemStyle: { color: '#9ca3af' } }
];

const CONTRACT_TYPES = [
    { value: 30, name: 'Long-Term MSA' },
    { value: 50, name: 'Annual' },
    { value: 20, name: 'Spot/PO' }
];

// Scatter Plot Data: Growth (x) vs Strategic Value (y)
// Size = Spend Volume
const SCATTER_DATA = [
    {
        name: 'Growth Leaders',
        data: [
            [25, 90, 50, 'Acme Mfg'], /* Growth %, Value Score, Spend, Name */
            [30, 95, 40, 'Stark Ind'],
            [15, 85, 30, 'Globex']
        ],
        itemStyle: { color: '#10b981' }
    },
    {
        name: 'Steady State',
        data: [
            [5, 75, 20, 'Initech'],
            [10, 80, 25, 'Soylent']
        ],
        itemStyle: { color: '#3b82f6' }
    }
];

// Supplier Table
const SUPPLIER_TABLE = [
    { name: 'Stark Ind', growth: '+30%', contract: '5 Years', score: '95', tier: 'Strategic' },
    { name: 'Acme Mfg', growth: '+25%', contract: '5 Years', score: '92', tier: 'Strategic' },
    { name: 'Globex Corp', growth: '+15%', contract: '3 Years', score: '88', tier: 'Preferred' },
    { name: 'Soylent Corp', growth: '+10%', contract: '2 Years', score: '82', tier: 'Preferred' },
    { name: 'Initech', growth: '+5%', contract: '1 Year', score: '75', tier: 'Transactional' },
    { name: 'Umbrella Corp', growth: '-2%', contract: 'Spot', score: '60', tier: 'Transactional' },
];


export const SupplierStrategicValueGrowthDashboard: React.FC = () => {
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

    // Pie: Strategic Mix
    const strategicPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
        series: [{
            name: 'Tier',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: STRATEGIC_SPLIT
        }]
    };

    // Pie: Contract Types
    const contractPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { show: false },
        series: [{
            name: 'Contract',
            type: 'pie',
            radius: ['0%', '70%'],
            center: ['50%', '50%'],
            data: CONTRACT_TYPES,
            color: ['#059669', '#3b82f6', '#f59e0b']
        }]
    };

    // Scatter: Growth vs Value
    const scatterOption: EChartsOption = {
        tooltip: {
            formatter: (params: any) => {
                return `<b>${params.value[3]}</b><br/>Growth: ${params.value[0]}%<br/>Value: ${params.value[1]}`;
            }
        },
        grid: { left: '10%', right: '10%', top: '15%', bottom: '15%' },
        xAxis: { type: 'value', name: 'Growth %', splitLine: { show: false } },
        yAxis: { type: 'value', name: 'Value Score', min: 50, max: 100, splitLine: { lineStyle: { type: 'dashed' } } },
        series: [
            {
                name: 'Growth Leaders',
                type: 'scatter',
                symbolSize: (data: any) => data[2],
                data: SCATTER_DATA[0].data,
                itemStyle: SCATTER_DATA[0].itemStyle
            },
            {
                name: 'Steady State',
                type: 'scatter',
                symbolSize: (data: any) => data[2],
                data: SCATTER_DATA[1].data,
                itemStyle: SCATTER_DATA[1].itemStyle
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierStrategicValueGrowthInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Rocket size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Value & Growth</h1>
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

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Spend Growth vs Contract Duration (Bar) */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Growth & Term" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Growth & Term</h3>
                                <p className="text-xs text-gray-400">Spend Growth (%) vs Contract Duration (Years)</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={SPEND_GROWTH} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis yAxisId="left" orientation="left" stroke="#10b981" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar yAxisId="left" dataKey="Growth" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Growth %" />
                                        <Bar yAxisId="right" dataKey="Duration" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} name="Term (Yrs)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Pie Layers (Tier + Contracts) */}
                    <div className="grid grid-cols-2 gap-4">
                        {isLoading ? (
                            <>
                                <PieChartSkeleton title="Partner Mix" />
                                <PieChartSkeleton title="Contracts" />
                            </>
                        ) : (
                            <>
                                <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                                    <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2">Partner Mix</h3>
                                    <ReactECharts option={strategicPieOption} style={{ height: '160px' }} />
                                </div>
                                <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                                    <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2">Contracts</h3>
                                    <ReactECharts option={contractPieOption} style={{ height: '160px' }} />
                                </div>
                            </>
                        )}
                    </div>

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="flex-1" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
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
                    <TableSkeleton rows={5} columns={5} />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Partner Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Supplier</th>
                                        <th className="px-5 py-3 text-center">Growth</th>
                                        <th className="px-5 py-3 text-center">Contract</th>
                                        <th className="px-5 py-3 text-center">Value Score</th>
                                        <th className="px-5 py-3 text-right">Tier</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {SUPPLIER_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                            <td className="px-5 py-3 text-center font-medium text-emerald-500">{row.growth}</td>
                                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.contract}</td>
                                            <td className="px-5 py-3 text-center font-bold text-gray-800 dark:text-gray-200">{row.score}</td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.tier === 'Strategic' ? 'bg-purple-100 text-purple-700' :
                                                    row.tier === 'Preferred' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {row.tier}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Scatter (2 cols) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[280px]" title="Value Matrix" />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Value Matrix</h3>
                            <p className="text-xs text-gray-400">Growth vs Strategic Alignment</p>
                        </div>
                        <ReactECharts option={scatterOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
