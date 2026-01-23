import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Funnel, CheckCircle, XCircle, Timer, Warning, TrendUp } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PurchaseFunnelInfo } from './PurchaseFunnelInfo';
import { useAppContext } from '../../../contexts/AppContext';

// KPI type definition
type KPIData = KPIConfig & { rawValue?: number, isCurrency?: boolean };

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
    { name: 'Finance', count: 24 },
    { name: 'Procurement', count: 8 },
    { name: 'Final', count: 4 },
];

// New: Request Volume by Month
const REQUEST_VOLUME_TREND = [
    { name: 'Jan', value: 22 },
    { name: 'Feb', value: 28 },
    { name: 'Mar', value: 32 },
    { name: 'Apr', value: 25 },
    { name: 'May', value: 35 },
    { name: 'Jun', value: 30 },
];

// New: Stage Status Distribution
const STAGE_STATUS_MIX = [
    { name: 'Approved', value: 62 },
    { name: 'Pending', value: 23 },
    { name: 'Rejected', value: 10 },
    { name: 'Cancelled', value: 5 },
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
    const { currency, t } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // --- KPI Data ---
    const TOP_KPIS: KPIData[] = [
        { id: '1', label: t('requests_submitted'), subtitle: t('total_intake'), value: '142', change: '+12', trend: 'up', icon: <Funnel size={18} />, sparklineData: [100, 110, 115, 120, 130, 135, 142] },
        { id: '2', label: t('approved_requests'), subtitle: t('completed'), value: '89', change: '+8', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [60, 65, 70, 75, 80, 85, 89] },
        { id: '3', label: t('avg_approval_time'), subtitle: t('end_to_end'), value: '42h', change: '-4h', trend: 'up', icon: <Timer size={18} />, sparklineData: [50, 48, 46, 45, 44, 43, 42] },
        { id: '4', label: t('approval_rate'), subtitle: t('conversion'), value: '78%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [70, 72, 74, 75, 76, 77, 78] },
    ];

    const SIDE_KPIS: KPIData[] = [
        { id: '5', label: t('bottleneck_stage'), subtitle: t('highest_delay'), value: t('finance'), change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [0, 0, 0, 0, 0, 0, 0] },
        { id: '6', label: t('delayed_requests'), subtitle: t('over_sla'), value: '14', change: '+3', trend: 'down', icon: <Timer size={18} />, sparklineData: [10, 11, 12, 11, 12, 13, 14] },
        { id: '7', label: t('rejected_requests'), subtitle: t('denied'), value: '25', change: '-2', trend: 'up', icon: <XCircle size={18} />, sparklineData: [28, 27, 26, 26, 25, 25, 25] },
        { id: '8', label: t('sla_compliance'), subtitle: t('on_time_rate'), value: '86%', change: '+3%', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [80, 81, 82, 83, 84, 85, 86] },
    ];

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
        tooltip: { trigger: 'item', formatter: '{b} : {c}%' },
        series: [
            {
                name: 'Funnel',
                type: 'funnel',
                left: '10%',
                top: 10,
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
                data: FUNNEL_DATA,
                color: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
            }
        ]
    };

    // Pie Chart - Stage Status Distribution
    const stageStatusPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: STAGE_STATUS_MIX,
            color: ['#10b981', '#f59e0b', '#ef4444', '#6b7280']
        }]
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
                    <div className="text-start">
                        <h1 className="text-2xl font-bold">{t('purchase_funnel_approvals')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('purchase_funnel_subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-blue-500" />
                        {t('about_dashboard')}
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
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Request Volume Trend (Left) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('request_volume_trend')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('request_volume_trend')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('monthly_submission_patterns')}</p>
                            </div>
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={REQUEST_VOLUME_TREND} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" fontSize={11} tick={{ fill: '#94a3b8' }} />
                                        <YAxis fontSize={12} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Avg Hours per Stage (Right) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('avg_hours_per_stage')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('avg_hours_per_stage')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('identifying_bottlenecks')}</p>
                            </div>
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DELAYS_PER_STAGE} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" fontSize={11} tick={{ fill: '#94a3b8' }} />
                                        <YAxis fontSize={12} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="count" name="Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Row 3: Two Charts + 4 Side KPIs --- */}

                {/* Charts Inner Grid (Left Half) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* Conversion Funnel */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[250px]" title={t('conversion_funnel')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('conversion_funnel')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('request_progression')}</p>
                            </div>
                            <ReactECharts option={funnelOption} style={{ height: '210px' }} />
                        </div>
                    )}

                    {/* Stage Status Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('stage_status_distribution')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('stage_status_distribution')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('request_outcomes')}</p>
                            </div>
                            <ReactECharts option={stageStatusPieOption} style={{ height: '210px' }} />
                        </div>
                    )}
                </div>

                {/* 4 Side KPIs (Right Half - 2x2 Grid) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                color="blue"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} title={t('active_request_status')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('active_request_status')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('id')}</th>
                                        <th className="px-5 py-3 text-start">{t('requester')}</th>
                                        <th className="px-5 py-3 text-start">{t('stage')}</th>
                                        <th className="px-5 py-3 text-end">{t('age_days')}</th>
                                        <th className="px-5 py-3 text-end">{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {REQUEST_STATUS.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{r.id}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{r.requester}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{r.stage}</td>
                                            <td className="px-5 py-3 text-end font-medium text-gray-900 dark:text-gray-100">{r.days}</td>
                                            <td className="px-5 py-3 text-end">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border
                                                    ${r.status === 'Delayed' || r.status === 'At Risk' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'}`}>
                                                    {r.status === 'Delayed' ? t('delayed') : r.status === 'At Risk' ? t('at_risk') : t('on_track')}
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
                        <ChartSkeleton height="h-[280px]" title={t('approval_flow_analysis')} />
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
