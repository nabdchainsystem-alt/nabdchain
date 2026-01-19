import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, CheckCircle, Clock, XCircle, TreeStructure, Hourglass } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ApprovalFlowInfo } from './ApprovalFlowInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Submitted', subtitle: 'This Month', value: '45', change: '+10', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [5, 8, 12, 15, 30, 45], color: 'blue' },
    { id: '2', label: 'Approved', subtitle: 'Completed', value: '38', change: '+8', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [4, 7, 10, 14, 28, 38], color: 'blue' },
    { id: '3', label: 'Rejected', subtitle: 'Returned', value: '5', change: '+2', trend: 'down', icon: <XCircle size={18} />, sparklineData: [0, 1, 1, 2, 4, 5], color: 'blue' },
    { id: '4', label: 'Avg Approval Time', subtitle: 'Hours', value: '28h', change: '-4h', trend: 'up', icon: <Clock size={18} />, sparklineData: [32, 30, 29, 29, 28, 28], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Pending', subtitle: 'In Review', value: '2', change: '-1', trend: 'up', icon: <Hourglass size={18} />, sparklineData: [5, 4, 6, 3, 3, 2], color: 'blue' },
    { id: '6', label: 'Rejection Rate', subtitle: '% of Total', value: '11%', change: '+1%', trend: 'down', icon: <Warning size={18} />, sparklineData: [10, 10, 12, 11, 10, 11], color: 'blue' },
    { id: '7', label: 'Control Bottlenecks', subtitle: 'Slow Stages', value: '1', change: '0', trend: 'neutral', icon: <TreeStructure size={18} />, sparklineData: [1, 1, 1, 1, 1, 1], color: 'blue' },
    { id: '8', label: 'Approval Efficiency', subtitle: 'Success Rate', value: '84%', change: '+3%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [78, 79, 81, 82, 83, 84], color: 'blue' },
];

// --- Mock Data: Charts ---
const DELAY_PER_STAGE = [
    { name: 'Submission', Days: 0.2 },
    { name: 'Direct Manager', Days: 1.5 },
    { name: 'Dept Head', Days: 2.1 },
    { name: 'Finance Review', Days: 0.8 },
    { name: 'Payment', Days: 0.5 },
];

const FUNNEL_DATA = [
    { value: 100, name: 'Submitted' },
    { value: 80, name: 'Manager Approved' },
    { value: 60, name: 'Finance Approved' },
    { value: 55, name: 'Paid' }
];

// --- Mock Data: Table & Sankey ---
const APPROVAL_QUEUE = [
    { id: 'EXP-105', submittedBy: 'Alice Smith', stage: 'Direct Manager', days: 2, status: 'Pending' },
    { id: 'EXP-106', submittedBy: 'Bob Jones', stage: 'Finance Review', days: 0.5, status: 'In Progress' },
    { id: 'EXP-107', submittedBy: 'Charlie Day', stage: 'Dept Head', days: 3.5, status: 'Delayed' },
    { id: 'EXP-108', submittedBy: 'Dana White', stage: 'Direct Manager', days: 1, status: 'Pending' },
    { id: 'EXP-109', submittedBy: 'Eve Black', stage: 'Submission', days: 0.1, status: 'New' },
];

// Sankey Data (Mock)
const SANKEY_DATA = {
    nodes: [
        { name: 'Submitted' },
        { name: 'Manager Approval' },
        { name: 'Finance Approval' },
        { name: 'Rejected' },
        { name: 'Paid' }
    ],
    links: [
        { source: 'Submitted', target: 'Manager Approval', value: 45 },
        { source: 'Manager Approval', target: 'Finance Approval', value: 35 },
        { source: 'Manager Approval', target: 'Rejected', value: 5 },
        { source: 'Finance Approval', target: 'Paid', value: 34 },
        { source: 'Finance Approval', target: 'Rejected', value: 1 }
    ]
};

// Additional chart data
const APPROVALS_BY_TYPE = [
    { name: 'Travel', Approved: 15, Rejected: 2 },
    { name: 'Software', Approved: 10, Rejected: 1 },
    { name: 'Marketing', Approved: 8, Rejected: 1 },
    { name: 'Office', Approved: 5, Rejected: 1 },
];

const APPROVAL_OUTCOME = [
    { value: 84, name: 'Approved' },
    { value: 11, name: 'Rejected' },
    { value: 5, name: 'Pending' }
];

export const ApprovalFlowDashboard: React.FC = () => {
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

    // Funnel Chart
    const funnelOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c}%' },
        series: [
            {
                name: 'Approval Funnel',
                type: 'funnel',
                left: '10%',
                top: 20,
                bottom: 20,
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
                color: ['#3b82f6', '#0ea5e9', '#10b981', '#6366f1']
            }
        ]
    };

    // Approval Outcome Pie
    const outcomePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: APPROVAL_OUTCOME,
            color: ['#10b981', '#ef4444', '#f59e0b']
        }]
    };

    // Sankey Chart
    const sankeyOption: EChartsOption = {
        title: { text: 'Approval Flow', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [
            {
                type: 'sankey',
                data: SANKEY_DATA.nodes,
                links: SANKEY_DATA.links,
                emphasis: { focus: 'adjacency' },
                lineStyle: { color: 'gradient', curveness: 0.5 },
                nodeWidth: 20,
                nodeGap: 8,
                layoutIterations: 32,
                left: '5%',
                right: '5%'
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <ApprovalFlowInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <CheckCircle size={28} className="text-green-600 dark:text-green-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Approval & Control Flow</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track workflow efficiency</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-green-500" />
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
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Bar Charts Side by Side --- */}
                <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Avg Delay per Stage</h3>
                                <p className="text-xs text-gray-400">In Days</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DELAY_PER_STAGE} margin={{ top: 5, right: 30, left: 80, bottom: 5 }} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="Days" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Approvals by Type</h3>
                                <p className="text-xs text-gray-400">Approved vs Rejected</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={APPROVALS_BY_TYPE} margin={{ top: 5, right: 30, left: 80, bottom: 5 }} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" fontSize={10} />
                                        <Bar dataKey="Approved" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                        <Bar dataKey="Rejected" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                    {/* Funnel Chart */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        {isLoading ? (
                            <PieChartSkeleton />
                        ) : (
                            <>
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Conversion Funnel</h3>
                                    <p className="text-xs text-gray-400">Request Progression</p>
                                </div>
                                <ReactECharts option={funnelOption} style={{ height: '180px' }} />
                            </>
                        )}
                    </div>

                    {/* Approval Outcome Pie */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        {isLoading ? (
                            <PieChartSkeleton />
                        ) : (
                            <>
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Approval Outcome</h3>
                                    <p className="text-xs text-gray-400">Overall success rate</p>
                                </div>
                                <ReactECharts option={outcomePieOption} style={{ height: '180px' }} />
                            </>
                        )}
                    </div>
                </div>

                {/* 4 KPIs in 2x2 grid */}
                <div className="col-span-1 md:col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div
                            key={kpi.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <KPICard
                                {...kpi}
                                color="blue"
                                className="h-full"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 4: Table + Companion Chart --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-5">
                            <TableSkeleton />
                        </div>
                    ) : (
                        <>
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Approval Queue</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className="px-5 py-3">Expense ID</th>
                                            <th className="px-5 py-3">Submitted By</th>
                                            <th className="px-5 py-3">Stage</th>
                                            <th className="px-5 py-3 text-right">Age (Days)</th>
                                            <th className="px-5 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {APPROVAL_QUEUE.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.id}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.submittedBy}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{row.stage}</td>
                                                <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">{row.days}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'Delayed' ? 'bg-red-100 text-red-700' :
                                                        row.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Companion Chart: Sankey (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <ReactECharts option={sankeyOption} style={{ height: '300px', width: '100%' }} />
                    )}
                </div>

            </div>
        </div>
    );
};
