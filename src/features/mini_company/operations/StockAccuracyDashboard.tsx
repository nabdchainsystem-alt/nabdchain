import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Target, Warning, Lightning, ShieldCheck, XCircle, FileSearch, ChartLine } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StockAccuracyInfo } from './StockAccuracyInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Stock Accuracy', subtitle: 'Audit Match %', value: '98.2%', change: '+0.5%', trend: 'up', icon: <Target size={18} />, sparklineData: [96, 97, 97.5, 98, 98.1, 98.2], color: 'blue' },
    { id: '2', label: 'Shrinkage Value', subtitle: 'Lost Inventory', value: '$8.2k', rawValue: 8200, isCurrency: true, change: '-5.0%', trend: 'up', icon: <Warning size={18} />, sparklineData: [9, 8.8, 8.6, 8.5, 8.3, 8.2], color: 'blue' },
    { id: '3', label: 'Adjustment Count', subtitle: 'Manual Fixes', value: '142', change: '-10', trend: 'up', icon: <Lightning size={18} />, sparklineData: [160, 155, 150, 148, 145, 142], color: 'blue' },
    { id: '4', label: 'Loss Rate', subtitle: '% of Total Value', value: '0.45%', change: '-0.02%', trend: 'up', icon: <XCircle size={18} />, sparklineData: [0.5, 0.49, 0.48, 0.47, 0.46, 0.45], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'High-Risk SKUs', subtitle: 'Frequent Losses', value: '18', change: '-2', trend: 'up', icon: <Warning size={18} />, sparklineData: [20, 20, 19, 19, 18, 18], color: 'blue' },
    { id: '6', label: 'Audit Frequency', subtitle: 'Days per Cycle', value: '30d', change: '0d', trend: 'neutral', icon: <FileSearch size={18} />, sparklineData: [30, 30, 30, 30, 30, 30], color: 'blue' },
    { id: '7', label: 'Variance Alerts', subtitle: 'Open Issues', value: '5', change: '-3', trend: 'up', icon: <ShieldCheck size={18} />, sparklineData: [8, 7, 7, 6, 6, 5], color: 'blue' },
    { id: '8', label: 'Recovery Rate', subtitle: 'Found items %', value: '72%', change: '+5%', trend: 'up', icon: <ChartLine size={18} />, sparklineData: [60, 63, 66, 68, 70, 72], color: 'blue' },
];

// --- Mock Data: Charts ---
const VARIANCE_PER_CATEGORY = [
    { name: 'Apparel', value: 3200 },
    { name: 'Electronics', value: 2500 },
    { name: 'Accessories', value: 1500 },
    { name: 'Home Goods', value: 800 },
    { name: 'Misc', value: 200 },
];

const SHRINKAGE_CAUSES = [
    { value: 45, name: 'Administrative Error' },
    { value: 30, name: 'Theft (External)' },
    { value: 15, name: 'Damage/Spoilage' },
    { value: 10, name: 'Theft (Internal)' }
];

// New chart data: Accuracy by Warehouse
const ACCURACY_BY_WAREHOUSE = [
    { name: 'Main Hub', value: 99.2 },
    { name: 'North Br', value: 97.8 },
    { name: 'South Br', value: 96.5 },
    { name: 'Retail', value: 98.1 },
];

// New chart data: Adjustment Types
const ADJUSTMENT_TYPES = [
    { value: 40, name: 'Quantity Correction' },
    { value: 25, name: 'Location Update' },
    { value: 20, name: 'Damage Write-off' },
    { value: 15, name: 'Found Items' }
];

// --- Mock Data: Table & Radar ---
const VARIANCE_LOG = [
    { id: 'SKU-5001', system: 50, physical: 48, variance: -2, reason: 'Unknown' },
    { id: 'SKU-5005', system: 120, physical: 115, variance: -5, reason: 'Damage' },
    { id: 'SKU-3022', system: 10, physical: 12, variance: +2, reason: 'Miscount' },
    { id: 'SKU-4008', system: 200, physical: 198, variance: -2, reason: 'Theft?' },
    { id: 'SKU-1010', system: 45, physical: 40, variance: -5, reason: 'Admin Error' },
];

// Radar Data
const RADAR_INDICATORS = [
    { name: 'Cycle Count', max: 100 },
    { name: 'Process Compliance', max: 100 },
    { name: 'Data Integrity', max: 100 },
    { name: 'Loss Prevention', max: 100 },
    { name: 'Staff Training', max: 100 }
];

const RADAR_DATA = [
    { value: [95, 80, 90, 75, 85], name: 'Current Score' },
    { value: [100, 100, 100, 100, 100], name: 'Target' }
];

export const StockAccuracyDashboard: React.FC = () => {
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

    // Pie Chart - Shrinkage Causes
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: SHRINKAGE_CAUSES
        }]
    };

    // Pie Chart - Adjustment Types
    const adjustmentPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: ADJUSTMENT_TYPES,
            color: ['#f97316', '#eab308', '#dc2626', '#22c55e']
        }]
    };

    // Radar Chart
    const radarOption: EChartsOption = {
        title: { text: 'Accuracy Metrics', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {},
        legend: { data: ['Current Score', 'Target'], bottom: 0, textStyle: { fontSize: 10 } },
        radar: {
            indicator: RADAR_INDICATORS,
            radius: '65%',
            center: ['50%', '50%'],
            splitNumber: 4,
            splitArea: { areaStyle: { color: ['transparent'] } }
        },
        series: [{
            name: 'Accuracy vs Target',
            type: 'radar',
            data: RADAR_DATA,
            itemStyle: { color: '#f87171' },
            areaStyle: { opacity: 0.2 }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <StockAccuracyInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Target size={28} className="text-red-600 dark:text-red-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Accuracy & Shrinkage</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Audit results and loss prevention</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-red-500" />
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
                            value={kpi.isCurrency && kpi.rawValue ? `$${kpi.rawValue.toLocaleString()}` : kpi.value} // Simple format for mock
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Recharts: Variance per Category */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Variance by Category" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Variance by Category</h3>
                            <p className="text-xs text-gray-400">Value of discrepancies</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={VARIANCE_PER_CATEGORY} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Recharts: Accuracy by Warehouse */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Accuracy by Warehouse" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Accuracy by Warehouse</h3>
                            <p className="text-xs text-gray-400">Audit score by location</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={ACCURACY_BY_WAREHOUSE} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} domain={[90, 100]} />
                                    <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Shrinkage Causes */}
                    {isLoading ? (
                        <PieChartSkeleton title="Shrinkage Causes" />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Shrinkage Causes</h3>
                                <p className="text-xs text-gray-400">Root cause analysis</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Adjustment Types */}
                    {isLoading ? (
                        <PieChartSkeleton title="Adjustment Types" />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Adjustment Types</h3>
                                <p className="text-xs text-gray-400">Correction categories</p>
                            </div>
                            <ReactECharts option={adjustmentPieOption} style={{ height: '180px' }} />
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
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Recent Variances</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3 text-right">Sys Qty</th>
                                        <th className="px-5 py-3 text-right">Phy Qty</th>
                                        <th className="px-5 py-3 text-right">Var</th>
                                        <th className="px-5 py-3">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {VARIANCE_LOG.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.id}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.system}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.physical}</td>
                                            <td className={`px-5 py-3 text-right font-bold ${row.variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {row.variance > 0 ? `+${row.variance}` : row.variance}
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{row.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Radar (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title="Accuracy Metrics" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={radarOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
