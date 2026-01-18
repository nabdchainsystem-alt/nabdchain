import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ArrowsOut, Info, TrendUp, Warning, Path, MapTrifold, Hourglass, CheckCircle, XCircle } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { JourneyTouchpointsInfo } from './JourneyTouchpointsInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Touchpoints Count', subtitle: 'Total Interactions', value: '1,240', change: '+12%', trend: 'up', icon: <Path size={18} />, sparklineData: [1100, 1150, 1180, 1200, 1220, 1240], color: 'teal' },
    { id: '2', label: 'Avg Journey Time', subtitle: 'Discovery to Conversion', value: '14 days', change: '-2 days', trend: 'up', icon: <Hourglass size={18} />, sparklineData: [18, 17, 16, 16, 15, 14], color: 'indigo' },
    { id: '3', label: 'Drop-Off Points', subtitle: 'Highest Friction', value: 'Checkout', change: 'Neutral', trend: 'neutral', icon: <XCircle size={18} />, sparklineData: [5, 5, 6, 6, 5, 5], color: 'red' },
    { id: '4', label: 'Conversion Pts', subtitle: 'Successful Deals', value: '85', change: '+15%', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [70, 72, 75, 78, 80, 85], color: 'emerald' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Engagement Score', subtitle: 'Interaction Depth', value: '7.8', change: '+0.3', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [7.2, 7.3, 7.5, 7.6, 7.7, 7.8], color: 'blue' },
    { id: '6', label: 'Completion %', subtitle: 'End-to-End Success', value: '24%', change: '+1.5%', trend: 'up', icon: <Path size={18} />, sparklineData: [20, 21, 22, 22, 23, 24], color: 'violet' },
    { id: '7', label: 'Friction Index', subtitle: 'Efficiency Metrics', value: '32', change: '-5', trend: 'up', icon: <Warning size={18} />, sparklineData: [40, 38, 36, 35, 33, 32], color: 'orange' },
];

// --- Mock Data: Charts ---
const TOUCHPOINTS_BY_STAGE = [
    { name: 'Awareness', Count: 450 },
    { name: 'Interest', Count: 320 },
    { name: 'Consider', Count: 210 },
    { name: 'Intent', Count: 140 },
    { name: 'Purchase', Count: 85 },
    { name: 'Retention', Count: 35 },
];

const FUNNEL_DATA = [
    { value: 100, name: 'Awareness' },
    { value: 71, name: 'Interest' },
    { value: 46, name: 'Consideration' },
    { value: 31, name: 'Intent' },
    { value: 19, name: 'Purchase' }
];

// Interaction Log Table
const INTERACTION_LOG = [
    { customer: 'Acme Corp', stage: 'Consideration', type: 'Demo Request', date: '2024-01-15', outcome: 'Scheduled' },
    { customer: 'Globex', stage: 'Interest', type: 'Whitepaper DL', date: '2024-01-16', outcome: 'Nurture' },
    { customer: 'Soylent', stage: 'Purchase', type: 'Contract Sign', date: '2024-01-14', outcome: 'Won' },
    { customer: 'Initech', stage: 'Awareness', type: 'Ad Click', date: '2024-01-17', outcome: 'Visited' },
    { customer: 'Umbrella', stage: 'Intent', type: 'Pricing Page', date: '2024-01-16', outcome: 'High Intent' },
];

// Sankey Data
const SANKEY_NODES = [
    { name: 'Ad Click' }, { name: 'Social' }, { name: 'Email' },
    { name: 'Landing Page' }, { name: 'Product Page' },
    { name: 'Cart' }, { name: 'Demo' },
    { name: 'Purchase' }, { name: 'Drop' }
];

const SANKEY_LINKS = [
    { source: 'Ad Click', target: 'Landing Page', value: 50 },
    { source: 'Social', target: 'Landing Page', value: 30 },
    { source: 'Email', target: 'Product Page', value: 20 },
    { source: 'Landing Page', target: 'Product Page', value: 40 },
    { source: 'Landing Page', target: 'Drop', value: 40 },
    { source: 'Product Page', target: 'Cart', value: 25 },
    { source: 'Product Page', target: 'Demo', value: 15 },
    { source: 'Product Page', target: 'Drop', value: 20 },
    { source: 'Cart', target: 'Purchase', value: 20 },
    { source: 'Cart', target: 'Drop', value: 5 },
    { source: 'Demo', target: 'Purchase', value: 10 },
    { source: 'Demo', target: 'Drop', value: 5 },
];

export const JourneyTouchpointsDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Funnel Chart
    const funnelOption: EChartsOption = {
        title: { text: 'Conversion Funnel', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c}%' },
        series: [
            {
                name: 'Funnel',
                type: 'funnel',
                left: '10%',
                top: 60,
                bottom: 60,
                width: '80%',
                min: 0,
                max: 100,
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                gap: 2,
                label: { show: true, position: 'inside' },
                labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
                itemStyle: { borderColor: '#fff', borderWidth: 1 },
                emphasis: { label: { fontSize: 20 } },
                data: FUNNEL_DATA,
                color: ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4']
            }
        ]
    };

    // Sankey Chart
    const sankeyOption: EChartsOption = {
        title: { text: 'Customer Journey Flow', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [
            {
                type: 'sankey',
                data: SANKEY_NODES,
                links: SANKEY_LINKS,
                emphasis: { focus: 'adjacency' },
                lineStyle: { color: 'gradient', curveness: 0.5 },
                itemStyle: { borderWidth: 1, borderColor: '#aaa' },
                layoutIterations: 32,
                label: { color: '#000', fontSize: 10 }
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-[#1a1d24] min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <JourneyTouchpointsInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <MapTrifold size={28} className="text-teal-600 dark:text-teal-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Journey & Touchpoints</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lifecycle Mapping</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors bg-white dark:bg-[#2b2e36] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors bg-white dark:bg-[#2b2e36] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-teal-500" />
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

                {/* Charts area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Touchpoints per Stage (Bar) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Touchpoints by Stage</h3>
                            <p className="text-xs text-gray-400">Interaction Volume</p>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={TOUCHPOINTS_BY_STAGE} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Count" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ECharts: Conversion Funnel */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Funnel View</h3>
                            <p className="text-xs text-gray-400">Yield Analysis</p>
                        </div>
                        <ReactECharts option={funnelOption} style={{ height: '220px' }} />
                    </div>

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color={kpi.color as any || 'blue'}
                                className="h-full"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Recent Interactions</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Stage</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3 text-right">Outcome</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {INTERACTION_LOG.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.customer}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.stage}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.type}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-500 text-xs font-mono">{row.date}</td>
                                        <td className="px-5 py-3 text-right">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.outcome === 'Won' ? 'bg-green-100 text-green-700' :
                                                row.outcome === 'High Intent' ? 'bg-teal-100 text-teal-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {row.outcome}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Sankey (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <ReactECharts option={sankeyOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
