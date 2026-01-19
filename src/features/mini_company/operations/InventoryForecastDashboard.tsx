import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, ShieldCheck, Lightning, ChartLine, CalendarCheck } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InventoryForecastInfo } from './InventoryForecastInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Forecast Demand', subtitle: 'Next 30 Days', value: '12,500', change: '+8%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [11000, 11500, 11800, 12000, 12200, 12500], color: 'blue' },
    { id: '2', label: 'Forecast Accuracy', subtitle: 'Model Fit', value: '94%', change: '+1%', trend: 'up', icon: <ShieldCheck size={18} />, sparklineData: [92, 93, 93, 94, 94, 94], color: 'blue' },
    { id: '3', label: 'Risk Exposure', subtitle: '% Vulnerable', value: '12%', change: '-2%', trend: 'down', icon: <Warning size={18} />, sparklineData: [15, 14, 14, 13, 13, 12], color: 'blue' },
    { id: '4', label: 'Expected Stockouts', subtitle: 'Predicted', value: '8', change: '-1', trend: 'down', icon: <Lightning size={18} />, sparklineData: [10, 9, 9, 9, 8, 8], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Overstock Risk', subtitle: 'Potential Excess', value: '25', change: '+3', trend: 'up', icon: <ChartLine size={18} />, sparklineData: [20, 21, 22, 23, 24, 25], color: 'blue' },
    { id: '6', label: 'Supply Volatility', subtitle: 'Supplier Var', value: 'Low', change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [1, 2, 1, 3, 1, 2], color: 'blue' },
    { id: '7', label: 'Confidence Level', subtitle: 'Statistical', value: '90%', change: '0%', trend: 'neutral', icon: <CalendarCheck size={18} />, sparklineData: [90, 90, 90, 90, 90, 90], color: 'blue' },
    { id: '8', label: 'Lead Time Avg', subtitle: 'Days to receive', value: '8.5d', change: '-0.5d', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [10, 9.5, 9.2, 9, 8.8, 8.5], color: 'blue' },
];

// --- Mock Data: Charts ---
const FORECAST_BY_CATEGORY = [
    { name: 'Apparel', value: 5000 },
    { name: 'Electronics', value: 3500 },
    { name: 'Home', value: 2500 },
    { name: 'Beauty', value: 1500 },
];

const RISK_DISTRIBUTION = [
    { value: 60, name: 'Safe' },
    { value: 25, name: 'Monitor' },
    { value: 12, name: 'At Risk' },
    { value: 3, name: 'Critical' }
];

// New chart data: Demand by Month
const DEMAND_BY_MONTH = [
    { name: 'Jan', value: 8500 },
    { name: 'Feb', value: 9200 },
    { name: 'Mar', value: 10500 },
    { name: 'Apr', value: 11200 },
    { name: 'May', value: 12000 },
    { name: 'Jun', value: 12500 },
];

// New chart data: Accuracy by Category
const ACCURACY_BY_CATEGORY = [
    { value: 30, name: 'Apparel (96%)' },
    { value: 28, name: 'Electronics (92%)' },
    { value: 25, name: 'Home (94%)' },
    { value: 17, name: 'Beauty (89%)' }
];

// --- Mock Data: Table & Cone ---
const RISK_TABLE = [
    { id: 'SKU-777', stock: 50, forecast: 120, level: 'High Risk', action: 'Reorder ASAP' },
    { id: 'SKU-888', stock: 200, forecast: 50, level: 'Overstock', action: 'Delay PO' },
    { id: 'SKU-999', stock: 100, forecast: 95, level: 'Safe', action: 'None' },
    { id: 'SKU-000', stock: 10, forecast: 80, level: 'Critical', action: 'Expedite' },
    { id: 'SKU-111', stock: 500, forecast: 520, level: 'Safe', action: 'None' },
];

// Cone Data (Confidence Interval)
// Using two lines filling the area between them to simulate a cone
const CONE_DATA = {
    x: ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5'],
    upper: [100, 110, 125, 145, 170],
    mean: [100, 105, 110, 115, 120],
    lower: [100, 100, 95, 85, 70]
};

export const InventoryForecastDashboard: React.FC = () => {
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
            data: RISK_DISTRIBUTION,
            color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        }]
    };

    // Pie Chart - Accuracy by Category
    const accuracyPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: ACCURACY_BY_CATEGORY,
            color: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd']
        }]
    };

    // Cone Chart (Area between lines)
    const coneOption: EChartsOption = {
        title: { text: 'Forecast Uncertainty', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'axis' },
        grid: { left: '10%', right: '10%', bottom: '10%', top: '20%' },
        xAxis: { type: 'category', boundaryGap: false, data: CONE_DATA.x },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'Upper Bound',
                type: 'line',
                data: CONE_DATA.upper,
                lineStyle: { opacity: 0 },
                stack: 'confidence',
                symbol: 'none'
            },
            {
                name: 'Confidence Range', // This effectively fills down to lower bound if configured with base, but simpler to just fill between
                type: 'line',
                data: CONE_DATA.lower,
                lineStyle: { opacity: 0 },
                stack: 'confidence',
                symbol: 'none',
                areaStyle: { color: '#818cf8', opacity: 0.3 } // Fill between upper and lower logic requires specific config in ECharts, usually 'stack' isn't enough for range area.
                // Simpler for mock: Area from Upper to axis, minus Area from Lower to axis (opacity hack) or use specialized 'custom' series.
                // For simplicity here, just showing Mean line + Upper area (fading) to simulate fan chart basics.
            },
            {
                name: 'Mean Forecast',
                type: 'line',
                data: CONE_DATA.mean,
                itemStyle: { color: '#4f46e5' },
                lineStyle: { width: 3 }
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <InventoryForecastInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <TrendUp size={28} className="text-indigo-600 dark:text-indigo-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Forecast & Risk</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Predictive demand planning</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-indigo-500" />
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

                {/* Recharts: Forecast by Category */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Projected Demand" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Projected Demand</h3>
                            <p className="text-xs text-gray-400">By category</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={FORECAST_BY_CATEGORY} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
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

                {/* Recharts: Demand by Month */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Demand by Month" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Demand by Month</h3>
                            <p className="text-xs text-gray-400">Projected units</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={DEMAND_BY_MONTH} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
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

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Risk Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title="Risk Profile" />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Risk Profile</h3>
                                <p className="text-xs text-gray-400">Inventory health status</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Accuracy by Category */}
                    {isLoading ? (
                        <PieChartSkeleton title="Accuracy by Category" />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Accuracy by Category</h3>
                                <p className="text-xs text-gray-400">Forecast precision</p>
                            </div>
                            <ReactECharts option={accuracyPieOption} style={{ height: '180px' }} />
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
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Risk Assessment</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3 text-right">Stock</th>
                                        <th className="px-5 py-3 text-right">Forecast</th>
                                        <th className="px-5 py-3">Risk Level</th>
                                        <th className="px-5 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {RISK_TABLE.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.id}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.stock}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.forecast}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.level === 'Safe' ? 'bg-emerald-100 text-emerald-700' :
                                                        row.level === 'Critical' ? 'bg-red-100 text-red-700' :
                                                            row.level === 'High Risk' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {row.level}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs font-medium text-gray-700 dark:text-gray-300">{row.action}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Cone (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title="Forecast Uncertainty" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={coneOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
