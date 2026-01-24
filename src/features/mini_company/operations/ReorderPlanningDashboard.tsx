import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, ShoppingCart, Warning, Clock, Package, TrendUp, ShieldCheck } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ReorderPlanningInfo } from './ReorderPlanningInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Below Reorder Point', subtitle: 'Action Required', value: '18', change: '+4', trend: 'down', icon: <Warning size={18} />, sparklineData: [14, 15, 15, 16, 17, 18], color: 'blue' },
    { id: '2', label: 'Reorder Qty Needed', subtitle: 'To Max Level', value: '2,450', rawValue: 2450, isCurrency: false, change: '+12%', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [2000, 2100, 2200, 2300, 2400, 2450], color: 'blue' },
    { id: '3', label: 'Avg Lead Time', subtitle: 'Supplier Speed', value: '12d', change: '+1d', trend: 'down', icon: <Clock size={18} />, sparklineData: [11, 11, 12, 12, 12, 12], color: 'blue' },
    { id: '4', label: 'Days Stock Left', subtitle: 'Runway', value: '24d', change: '-2d', trend: 'down', icon: <Package size={18} />, sparklineData: [28, 27, 26, 25, 25, 24], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Emergency Reorders', subtitle: 'Expedited', value: '3', change: '-1', trend: 'up', icon: <Lightning size={18} />, sparklineData: [5, 4, 4, 3, 3, 3], color: 'blue' },
    { id: '6', label: 'Overstock Items', subtitle: '> Max Limit', value: '45', change: '+5', trend: 'down', icon: <TrendUp size={18} />, sparklineData: [40, 41, 42, 43, 44, 45], color: 'blue' },
    { id: '7', label: 'Planning Confidence', subtitle: 'Data Reliability', value: '92%', change: '+1%', trend: 'up', icon: <ShieldCheck size={18} />, sparklineData: [90, 91, 91, 91, 92, 92], color: 'blue' },
    { id: '8', label: 'Stockout Risk', subtitle: 'Items at risk', value: '8', change: '-2', trend: 'up', icon: <Warning size={18} />, sparklineData: [12, 11, 10, 9, 9, 8], color: 'blue' },
];

// Import Icon for use in Mock Data definition if needed, or just use component directly
import { Lightning } from 'phosphor-react';

// --- Mock Data: Charts ---
const REORDER_QTY_BY_SKU = [
    { name: 'Paper A4', value: 500 },
    { name: 'USB Hub', value: 200 },
    { name: 'Desk Lamp', value: 150 },
    { name: 'Monitor Arm', value: 100 },
    { name: 'Chair Mat', value: 50 },
];

const STOCK_COVERAGE_STATUS = [
    { value: 60, name: 'Healthy (30-90d)' },
    { value: 20, name: 'Overstock (>90d)' },
    { value: 15, name: 'Low (<30d)' },
    { value: 5, name: 'Critical (<7d)' }
];

// New chart data: Lead Time by Supplier
const LEAD_TIME_BY_SUPPLIER = [
    { name: 'Supplier A', value: 8 },
    { name: 'Supplier B', value: 12 },
    { name: 'Supplier C', value: 5 },
    { name: 'Supplier D', value: 15 },
    { name: 'Supplier E', value: 10 },
];

// New chart data: Urgency Level
const URGENCY_LEVEL = [
    { value: 35, name: 'Low' },
    { value: 40, name: 'Medium' },
    { value: 18, name: 'High' },
    { value: 7, name: 'Critical' }
];

// --- Mock Data: Table & Wave ---
const REORDER_PLAN = [
    { id: 'SKU-001', stock: 15, reorderPt: 20, suggest: 50, supplier: 'Office Supplies Co' },
    { id: 'SKU-009', stock: 2, reorderPt: 10, suggest: 100, supplier: 'Tech Gadgets Inc' },
    { id: 'SKU-012', stock: 0, reorderPt: 5, suggest: 20, supplier: 'Furniture Depo' },
    { id: 'SKU-044', stock: 8, reorderPt: 25, suggest: 200, supplier: 'Paper Mill' },
    { id: 'SKU-105', stock: 120, reorderPt: 150, suggest: 500, supplier: 'General Goods' },
];

// Wave Data (Simulated time-series line)
const WAVE_DATA = {
    x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    stock: [100, 90, 80, 70, 60, 50, 40],
    threshold: [30, 30, 30, 30, 30, 30, 30] // Flat line
};

export const ReorderPlanningDashboard: React.FC = () => {
    const { currency, t } = useAppContext();
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

    // Pie Chart - Stock Coverage Status
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: STOCK_COVERAGE_STATUS,
            color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        }]
    };

    // Pie Chart - Urgency Level
    const urgencyPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: URGENCY_LEVEL,
            color: ['#22c55e', '#eab308', '#f97316', '#dc2626']
        }]
    };

    // Line Chart (Reorder Threshold Wave)
    const waveOption: EChartsOption = {
        title: { text: 'Burn Rate vs Reorder Point', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'axis' },
        grid: { left: '10%', right: '10%', bottom: '10%', top: '20%' },
        xAxis: { type: 'category', boundaryGap: false, data: WAVE_DATA.x },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'Proj. Stock',
                type: 'line',
                smooth: true,
                data: WAVE_DATA.stock,
                areaStyle: { opacity: 0.2 },
                lineStyle: { color: '#3b82f6' },
                itemStyle: { color: '#3b82f6' }
            },
            {
                name: 'Reorder Point',
                type: 'line',
                data: WAVE_DATA.threshold,
                lineStyle: { type: 'dashed', color: '#ef4444' },
                itemStyle: { opacity: 0 }
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <ReorderPlanningInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ShoppingCart size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('reorder_planning')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('reorder_planning_desc')}</p>
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

                {/* Recharts: Reorder Qty by SKU */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Reorder Amounts" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Reorder Amounts</h3>
                            <p className="text-xs text-gray-400">Qty to order per SKU</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={REORDER_QTY_BY_SKU} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
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

                {/* Recharts: Lead Time by Supplier */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Lead Time by Supplier" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Lead Time by Supplier</h3>
                            <p className="text-xs text-gray-400">Days to delivery</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={LEAD_TIME_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
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

                {/* --- Row 3: Two Pie Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Pie Charts in nested 2-col grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Stock Coverage */}
                    {isLoading ? (
                        <div className="col-span-1">
                            <PieChartSkeleton title="Coverage Status" />
                        </div>
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Coverage Status</h3>
                                <p className="text-xs text-gray-400">Inventory health</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Urgency Level */}
                    {isLoading ? (
                        <div className="col-span-1">
                            <PieChartSkeleton title="Urgency Level" />
                        </div>
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Urgency Level</h3>
                                <p className="text-xs text-gray-400">Reorder priority</p>
                            </div>
                            <ReactECharts option={urgencyPieOption} style={{ height: '180px' }} />
                        </div>
                    )}
                </div>

                {/* Right: 4 Side KPIs in 2x2 Grid */}
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

                {/* --- Row 4: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Suggested Reorders</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3 text-right">Stock</th>
                                        <th className="px-5 py-3 text-right">Point</th>
                                        <th className="px-5 py-3 text-right">Sug. Qty</th>
                                        <th className="px-5 py-3">Supplier</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {REORDER_PLAN.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.id}</td>
                                            <td className={`px-5 py-3 text-right font-bold ${row.stock <= row.reorderPt ? 'text-red-500' : 'text-gray-600'}`}>{row.stock}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.reorderPt}</td>
                                            <td className="px-5 py-3 text-right font-medium text-blue-600 dark:text-blue-400">{row.suggest}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{row.supplier}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Wave (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Burn Rate vs Reorder Point" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={waveOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
