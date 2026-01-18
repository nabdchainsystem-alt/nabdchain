import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Warning, ShieldCheck, Bug, CheckCircle, Binoculars, ChartPie, ChartBar, FileText } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SupplierQualityComplianceInfo } from './SupplierQualityComplianceInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Defect Rate %', subtitle: 'Global Avg', value: '1.2%', change: '-0.3%', trend: 'up', icon: <Bug size={18} />, sparklineData: [1.8, 1.6, 1.5, 1.4, 1.3, 1.2], color: 'blue' },
    { id: '2', label: 'Rejected Shipments', subtitle: 'Last 30 Days', value: '3', change: '-1', trend: 'up', icon: <Warning size={18} />, sparklineData: [5, 4, 6, 2, 4, 3], color: 'blue' },
    { id: '3', label: 'Quality Score', subtitle: 'Overall Rating', value: '94.5', change: '+1.2', trend: 'up', icon: <ShieldCheck size={18} />, sparklineData: [91, 92, 92, 93, 94, 94.5], color: 'blue' },
    { id: '4', label: 'Compliance Score', subtitle: 'Regulatory Adherence', value: '98%', change: 'Stable', trend: 'neutral', icon: <FileText size={18} />, sparklineData: [98, 98, 98, 98, 98, 98], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Inspections Passed', subtitle: 'YTD', value: '1,245', change: '+15%', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [1000, 1050, 1100, 1150, 1200, 1245], color: 'blue' },
    { id: '6', label: 'Quality Incidents', subtitle: 'Critical Issues', value: '2', change: '-2', trend: 'up', icon: <Warning size={18} />, sparklineData: [5, 4, 3, 3, 2, 2], color: 'blue' },
    { id: '7', label: 'Risk Level', subtitle: 'Supplier Base', value: 'Low', change: 'Stable', trend: 'neutral', icon: <Binoculars size={18} />, sparklineData: [2, 2, 2, 2, 2, 2], color: 'blue' },
    { id: '8', label: 'Audit Score', subtitle: 'Avg Compliance Audit', value: '96%', change: '+2%', trend: 'up', icon: <FileText size={18} />, sparklineData: [92, 93, 94, 94, 95, 96], color: 'blue' },
];

// --- Mock Data: Charts ---
const DEFECTS_BY_SUPPLIER = [
    { name: 'Acme Mfg', Defects: 12, Inspections: 150 },
    { name: 'Globex', Defects: 45, Inspections: 200 },
    { name: 'Soylent', Defects: 8, Inspections: 120 },
    { name: 'Initech', Defects: 2, Inspections: 80 },
    { name: 'Umbrella', Defects: 65, Inspections: 300 },
];

const INSPECTION_OUTCOMES = [
    { value: 1245, name: 'Passed', itemStyle: { color: '#10b981' } },
    { value: 85, name: 'Failed', itemStyle: { color: '#ef4444' } },
    { value: 42, name: 'Conditional', itemStyle: { color: '#f59e0b' } }
];

const DEFECT_CATEGORIES = [
    { value: 35, name: 'Cosmetic' },
    { value: 25, name: 'Dimensional' },
    { value: 20, name: 'Functional' },
    { value: 15, name: 'Packaging' },
    { value: 5, name: 'Labeling' }
];

// Radar Chart Data: Quality vs Delivery vs Compliance
// Indicators: Quality, Delivery, Compliance, Responsiveness, Cost, Innovation
const RADAR_INDICATORS = [
    { name: 'Quality', max: 100 },
    { name: 'Delivery', max: 100 },
    { name: 'Compliance', max: 100 },
    { name: 'Respond', max: 100 },
    { name: 'Cost', max: 100 },
    { name: 'Innovate', max: 100 }
];

const RADAR_DATA = [
    {
        value: [95, 92, 98, 85, 90, 75],
        name: 'Strategic'
    },
    {
        value: [70, 85, 90, 95, 80, 60],
        name: 'Tactical'
    }
];

// Supplier Table
const SUPPLIER_TABLE = [
    { name: 'Acme Mfg', inspections: 150, defects: 12, compliance: '98%', status: 'Approved' },
    { name: 'Globex Corp', inspections: 200, defects: 45, compliance: '82%', status: 'Watchlist' },
    { name: 'Soylent Corp', inspections: 120, defects: 8, compliance: '99%', status: 'Approved' },
    { name: 'Initech', inspections: 80, defects: 2, compliance: '100%', status: 'Preferred' },
    { name: 'Umbrella Corp', inspections: 300, defects: 65, compliance: '71%', status: 'High Risk' },
    { name: 'Stark Ind', inspections: 95, defects: 1, compliance: '99%', status: 'Preferred' },
    { name: 'Cyberdyne', inspections: 110, defects: 15, compliance: '88%', status: 'Watchlist' },
];


export const SupplierQualityComplianceDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

    // Loading state for smooth entrance animation
    const [isLoading, setIsLoading] = useState(true);

    // Simulate data loading with staggered animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // Short delay for smooth transition
        return () => clearTimeout(timer);
    }, []);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart: Passed vs Failed
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
        series: [{
            name: 'Inspection Outcome',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: INSPECTION_OUTCOMES
        }]
    };

    // Pie Chart: Defect Categories
    const defectPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { show: false }, // Hide legend to save space
        series: [{
            name: 'Defect Type',
            type: 'pie',
            radius: '70%',
            center: ['50%', '50%'],
            data: DEFECT_CATEGORIES,
            color: ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#6b7280']
        }]
    };

    // Radar Chart
    const radarOption: EChartsOption = {
        title: { text: '' },
        tooltip: {},
        legend: { data: ['Strategic', 'Tactical'], bottom: 0, show: true },
        radar: {
            indicator: RADAR_INDICATORS,
            radius: '65%',
        },
        series: [{
            name: 'Supplier Metrics',
            type: 'radar',
            data: RADAR_DATA,
            areaStyle: { opacity: 0.2 }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierQualityComplianceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ShieldCheck size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Quality & Compliance</h1>
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

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Defects & Inspections (Bar) */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Defects vs Inspections" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Defect Analysis</h3>
                                <p className="text-xs text-gray-400">By Supplier</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DEFECTS_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar yAxisId="left" dataKey="Defects" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} name="Defects" />
                                        <Bar yAxisId="right" dataKey="Inspections" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} name="Inspections" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Pie Charts Layered (Passed/Failed + Categories) */}
                    <div className="grid grid-cols-2 gap-4">
                        {isLoading ? (
                            <>
                                <PieChartSkeleton title="Inspections" />
                                <PieChartSkeleton title="Defect Types" />
                            </>
                        ) : (
                            <>
                                <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                                    <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2">Outcomes</h3>
                                    <ReactECharts option={pieOption} style={{ height: '160px' }} />
                                </div>
                                <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                                    <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2">Defect Types</h3>
                                    <ReactECharts option={defectPieOption} style={{ height: '160px' }} />
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
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Compliance Registry</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Supplier</th>
                                        <th className="px-5 py-3 text-center">Inspections</th>
                                        <th className="px-5 py-3 text-center">Defects</th>
                                        <th className="px-5 py-3 text-center">Compliance</th>
                                        <th className="px-5 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {SUPPLIER_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.inspections}</td>
                                            <td className="px-5 py-3 text-center font-medium text-red-500">{row.defects}</td>
                                            <td className="px-5 py-3 text-center font-bold text-gray-700 dark:text-gray-300">{row.compliance}</td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'High Risk' ? 'bg-red-100 text-red-700' :
                                                    row.status === 'Watchlist' ? 'bg-yellow-100 text-yellow-700' :
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

                {/* Companion Chart: Radar (2 cols) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[280px]" title="Performance Radar" />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Metrics Radar</h3>
                            <p className="text-xs text-gray-400">Quality vs Other KPIs</p>
                        </div>
                        <ReactECharts option={radarOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
