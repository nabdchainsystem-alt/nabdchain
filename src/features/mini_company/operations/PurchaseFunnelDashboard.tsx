import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Funnel, CheckCircle, XCircle, Timer, Warning, TrendUp } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PurchaseFunnelInfo } from './PurchaseFunnelInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Requests Submitted', subtitle: 'Total Intake', value: '142', change: '+12', trend: 'up', icon: <Funnel size={18} />, sparklineData: [100, 110, 115, 120, 130, 135, 142] },
    { id: '2', label: 'Approved Requests', subtitle: 'Completed', value: '89', change: '+8', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [60, 65, 70, 75, 80, 85, 89] },
    { id: '3', label: 'Avg Approval Time', subtitle: 'End-to-End', value: '42h', change: '-4h', trend: 'up', icon: <Timer size={18} />, sparklineData: [50, 48, 46, 45, 44, 43, 42] }, // Down is good
    { id: '4', label: 'Approval Rate', subtitle: 'Conversion', value: '78%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [70, 72, 74, 75, 76, 77, 78] },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '5', label: 'Bottleneck Stage', subtitle: 'Highest Delay', value: 'Finance', change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [0, 0, 0, 0, 0, 0, 0] },
    { id: '6', label: 'Delayed Requests', subtitle: 'Over SLA', value: '14', change: '+3', trend: 'down', icon: <Timer size={18} />, sparklineData: [10, 11, 12, 11, 12, 13, 14] },
    { id: '7', label: 'Rejected Requests', subtitle: 'Denied', value: '25', change: '-2', trend: 'up', icon: <XCircle size={18} />, sparklineData: [28, 27, 26, 26, 25, 25, 25] }, // Down is good
];

// --- Mock Data: Charts ---
const FUNNEL_DATA = [
    { value: 100, name: 'Submitted' },
    { value: 80, name: 'Manager Review' },
    { value: 60, name: 'Finance Review' },
    { value: 40, name: 'Approved' },
    { value: 38, name: 'Ordered' }
];

const DELAYS_PER_STAGE = [
    { name: 'Submission', count: 2 },
    { name: 'Manager', count: 12 },
    { name: 'Finance', count: 24 }, // Bottleneck
    { name: 'Procurement', count: 8 },
    { name: 'Final', count: 4 },
];

// --- Mock Data: Table & Sankey ---
const REQUEST_STATUS = [
    { id: 'PR-2024-001', requester: 'Alice Smith', stage: 'Finance Review', days: 5, status: 'Delayed' },
    { id: 'PR-2024-002', requester: 'Bob Jones', stage: 'Manager Approval', days: 1, status: 'On Track' },
    { id: 'PR-2024-003', requester: 'Charlie Day', stage: 'Procurement', days: 2, status: 'On Track' },
    { id: 'PR-2024-004', requester: 'Diana Prince', stage: 'Finance Review', days: 4, status: 'At Risk' },
    { id: 'PR-2024-005', requester: 'Evan Wright', stage: 'Finalizing', days: 0, status: 'On Track' },
];

const SANKEY_DATA = {
    nodes: [
        { name: 'Submitted' },
        { name: 'Manager Approved' },
        { name: 'Manager Rejected' },
        { name: 'Finance Approved' },
        { name: 'Finance Rejected' },
        { name: 'Ordered' },
        { name: 'Cancelled' }
    ],
    links: [
        { source: 'Submitted', target: 'Manager Approved', value: 80 },
        { source: 'Submitted', target: 'Manager Rejected', value: 10 },
        { source: 'Submitted', target: 'Cancelled', value: 10 },
        { source: 'Manager Approved', target: 'Finance Approved', value: 70 },
        { source: 'Manager Approved', target: 'Finance Rejected', value: 10 },
        { source: 'Finance Approved', target: 'Ordered', value: 68 },
        { source: 'Finance Approved', target: 'Cancelled', value: 2 },
    ]
};

export const PurchaseFunnelDashboard: React.FC = () => {
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

    // Funnel Chart
    const funnelOption: EChartsOption = {
        title: { text: 'Request Funnel', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item', formatter: '{b} : {c}%' },
        series: [
            {
                name: 'Funnel',
                type: 'funnel',
                left: '10%',
                top: 30,
                bottom: 10,
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
                data: FUNNEL_DATA
            }
        ]
    };

    // Sankey Chart
    const sankeyOption: EChartsOption = {
        title: { text: 'Approval Flow Analysis', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [
            {
                type: 'sankey',
                data: SANKEY_DATA.nodes,
                links: SANKEY_DATA.links,
                emphasis: { focus: 'adjacency' },
                lineStyle: { color: 'gradient', curveness: 0.5 },
                layoutIterations: 32, // Improve layout
                nodeWidth: 20,
                nodeGap: 8,
                top: '10%',
                bottom: '10%',
                label: { position: 'right', fontSize: 10 }
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <PurchaseFunnelInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Funnel size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Purchase Funnel & Approvals</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Flow efficiency and bottleneck tracking</p>
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
                            color="cyan"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ECharts: Funnel Chart */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Conversion Funnel" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Conversion Funnel</h3>
                                <p className="text-xs text-gray-400">Request progression</p>
                            </div>
                            <ReactECharts option={funnelOption} style={{ height: '220px' }} />
                        </div>
                    )}

                    {/* Recharts: Delays per Stage */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Avg Hours per Stage" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Avg Hours per Stage</h3>
                                <p className="text-xs text-gray-400">Identifying bottlenecks</p>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DELAYS_PER_STAGE} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} interval={0} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="count" name="Hours" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color="cyan"
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
                        <TableSkeleton rows={5} columns={5} title="Active Request Status" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Active Request Status</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">ID</th>
                                        <th className="px-5 py-3">Requester</th>
                                        <th className="px-5 py-3">Stage</th>
                                        <th className="px-5 py-3 text-right">Age (Days)</th>
                                        <th className="px-5 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {REQUEST_STATUS.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{r.id}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{r.requester}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{r.stage}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{r.days}</td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border
                                                    ${r.status === 'Delayed' || r.status === 'At Risk' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                    {r.status}
                                                </span>
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
                        <ChartSkeleton height="h-[360px]" title="Approval Flow Analysis" />
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
