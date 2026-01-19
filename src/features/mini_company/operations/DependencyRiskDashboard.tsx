import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, ShieldWarning, Warning, LinkBreak, UserSwitch, CurrencyDollar, Compass } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DependencyRiskInfo } from './DependencyRiskInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Dependency Ratio', subtitle: 'Top 5 Concentration', value: '45%', change: '-2%', trend: 'up', icon: <LinkBreak size={18} />, sparklineData: [48, 47, 46, 46, 45, 45, 45] }, // Down is good for risk, trend up means improvement
    { id: '2', label: 'Single-Source Cats', subtitle: 'No Backup', value: '3', change: '0', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [3, 3, 3, 3, 3, 3, 3] },
    { id: '3', label: 'Risk Exposure', subtitle: 'High Risk Spend', value: '18%', change: '+1%', trend: 'down', icon: <ShieldWarning size={18} />, sparklineData: [15, 16, 17, 18, 18, 18, 18] }, // Up is bad
    { id: '4', label: 'Stability Score', subtitle: 'Supply Chain Health', value: '82/100', change: '+2', trend: 'up', icon: <Compass size={18} />, sparklineData: [78, 79, 80, 81, 80, 81, 82] },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '5', label: 'Backup Suppliers', subtitle: 'Avg per Category', value: '1.8', change: '+0.1', trend: 'up', icon: <UserSwitch size={18} />, sparklineData: [1.5, 1.5, 1.6, 1.6, 1.7, 1.7, 1.8] },
    { id: '6', label: 'Avg Switching Cost', subtitle: 'Est. Impact', value: '$12k', change: '0', trend: 'neutral', icon: <CurrencyDollar size={18} />, sparklineData: [12, 12, 12, 12, 12, 12, 12] },
    { id: '7', label: 'Active Risk Alerts', subtitle: 'Critical Issues', value: '2', change: '+1', trend: 'down', icon: <Warning size={18} />, sparklineData: [0, 0, 1, 1, 1, 2, 2] },
    { id: '8', label: 'Mitigation Progress', subtitle: 'Actions Completed', value: '72%', change: '+8%', trend: 'up', icon: <Compass size={18} />, sparklineData: [58, 62, 64, 66, 68, 70, 72] },
];

// --- Mock Data: Charts ---
const DEPENDENCY_BY_CATEGORY = [
    { name: 'Electronics', primary: 80, secondary: 20 },
    { name: 'Office', primary: 60, secondary: 40 },
    { name: 'Hardware', primary: 90, secondary: 10 },
    { name: 'Services', primary: 50, secondary: 50 },
    { name: 'Furniture', primary: 100, secondary: 0 },
];

const RISK_LEVELS = [
    { value: 12, name: 'High Risk' },
    { value: 28, name: 'Medium Risk' },
    { value: 60, name: 'Low Risk' }
];

// New: Risk Trend Over Time
const RISK_TREND = [
    { name: 'Jan', high: 15, medium: 25, low: 55 },
    { name: 'Feb', high: 14, medium: 26, low: 56 },
    { name: 'Mar', high: 13, medium: 27, low: 58 },
    { name: 'Apr', high: 12, medium: 28, low: 58 },
    { name: 'May', high: 12, medium: 28, low: 60 },
    { name: 'Jun', high: 12, medium: 28, low: 60 },
];

// New: Diversification Score by Category
const DIVERSIFICATION_SCORES = [
    { name: 'Electronics', value: 35 },
    { name: 'Office', value: 65 },
    { name: 'Hardware', value: 25 },
    { name: 'Services', value: 80 },
    { name: 'Furniture', value: 0 },
];

// --- Mock Data: Table & Network ---
const RISK_DETAILS = [
    { id: 1, supplier: 'TechCorp', category: 'Electronics', dependency: '80%', riskScore: 75, alert: 'High' },
    { id: 2, supplier: 'OfficeMax', category: 'Office', dependency: '60%', riskScore: 20, alert: 'Low' },
    { id: 3, supplier: 'CloudSvcs', category: 'Services', dependency: '50%', riskScore: 45, alert: 'Medium' },
    { id: 4, supplier: 'SoloDesk', category: 'Furniture', dependency: '100%', riskScore: 88, alert: 'Critical' },
    { id: 5, supplier: 'NetGear', category: 'Hardware', dependency: '90%', riskScore: 30, alert: 'Low' },
];

// Network Graph Data
const GRAPH_NODES = [
    { name: 'Electronics', symbolSize: 20, category: 0 },
    { name: 'Office', symbolSize: 15, category: 0 },
    { name: 'Hardware', symbolSize: 18, category: 0 },
    { name: 'Services', symbolSize: 25, category: 0 },
    { name: 'Furniture', symbolSize: 10, category: 0 },
    { name: 'TechCorp', symbolSize: 25, category: 1 },
    { name: 'OfficeMax', symbolSize: 15, category: 1 },
    { name: 'CloudSvcs', symbolSize: 20, category: 1 },
    { name: 'SoloDesk', symbolSize: 10, category: 1 },
    { name: 'NetGear', symbolSize: 18, category: 1 },
    { name: 'GlobalParts', symbolSize: 12, category: 1 },
];

const GRAPH_LINKS = [
    { source: 'Electronics', target: 'TechCorp' },
    { source: 'Electronics', target: 'GlobalParts' },
    { source: 'Office', target: 'OfficeMax' },
    { source: 'Hardware', target: 'NetGear' },
    { source: 'Services', target: 'CloudSvcs' },
    { source: 'Furniture', target: 'SoloDesk' },
];

export const DependencyRiskDashboard: React.FC = () => {
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

    // Pie Chart - Risk Distribution
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: RISK_LEVELS.map(d => ({
                ...d,
                itemStyle: {
                    color: d.name === 'High Risk' ? '#ef4444' : d.name === 'Medium Risk' ? '#f59e0b' : '#10b981'
                }
            }))
        }]
    };

    // Pie Chart - Diversification Scores
    const diversificationPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}% diversified' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: DIVERSIFICATION_SCORES,
            color: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
        }]
    };

    // Network Graph
    const graphOption: EChartsOption = {
        title: { text: 'Supply Chain Network', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {},
        legend: { data: ['Categories', 'Suppliers'], bottom: 0 },
        series: [
            {
                type: 'graph',
                layout: 'force',
                top: 30,
                bottom: 30,
                categories: [{ name: 'Categories' }, { name: 'Suppliers' }],
                data: GRAPH_NODES.map(n => ({ ...n, itemStyle: { color: n.category === 0 ? '#3b82f6' : '#8b5cf6' } })),
                links: GRAPH_LINKS,
                roam: true,
                label: { show: true, position: 'right', fontSize: 10 },
                force: { repulsion: 150, edgeLength: 60 },
                lineStyle: { color: 'source', curveness: 0.3 }
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <DependencyRiskInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ShieldWarning size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Dependency & Risk</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resilience and network analysis</p>
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
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Recharts - Dependency by Category */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Dependency by Category" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Dependency by Category</h3>
                            <p className="text-xs text-gray-400">Primary vs Secondary Share</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={DEPENDENCY_BY_CATEGORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f3f4f6" />
                                    <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis dataKey="name" type="category" width={80} fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="primary" stackId="a" name="Primary" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} animationDuration={1000} />
                                    <Bar dataKey="secondary" stackId="a" name="Backup" fill="#d1d5db" radius={[0, 4, 4, 0]} barSize={12} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Recharts - Risk Trend */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Risk Trend" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Risk Trend</h3>
                            <p className="text-xs text-gray-400">Monthly risk distribution</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={RISK_TREND} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f3f4f6" />
                                    <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="high" stackId="a" name="High" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={20} animationDuration={1000} />
                                    <Bar dataKey="medium" stackId="a" name="Medium" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={20} animationDuration={1000} />
                                    <Bar dataKey="low" stackId="a" name="Low" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts - Risk Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title="Risk Distribution" />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Risk Distribution</h3>
                                <p className="text-xs text-gray-400">Supplier classification</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts - Diversification Score */}
                    {isLoading ? (
                        <PieChartSkeleton title="Diversification Score" />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Diversification Score</h3>
                                <p className="text-xs text-gray-400">By category coverage</p>
                            </div>
                            <ReactECharts option={diversificationPieOption} style={{ height: '180px' }} />
                        </div>
                    )}
                </div>

                {/* Right: Side KPIs in 2x2 Grid */}
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
                        <TableSkeleton rows={5} columns={5} title="High Risk Concentrations" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">High Risk Concentrations</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Supplier</th>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3 text-right">Dependency</th>
                                        <th className="px-5 py-3 text-right">Risk Score</th>
                                        <th className="px-5 py-3 text-right">Level</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {RISK_DETAILS.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{r.supplier}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{r.category}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{r.dependency}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{r.riskScore}</td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border
                                                    ${r.alert === 'Critical' || r.alert === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        r.alert === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                    {r.alert}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Network Graph (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title="Supply Chain Network" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={graphOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
