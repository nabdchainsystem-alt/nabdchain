import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { Users, Truck, Clock, CurrencyDollar, ShieldWarning, Warning, Star, Info, ArrowsOut } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SupplierPerformanceInfo } from './SupplierPerformanceInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS_SEQUENCE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Total Suppliers', subtitle: 'Active Suppliers', value: '38', change: '+2', trend: 'up', icon: <Users size={18} />, sparklineData: [32, 34, 34, 35, 36, 37, 38] },
    { id: '2', label: 'On-Time Delivery %', subtitle: 'Performance', value: '92.4%', change: '-1.2%', trend: 'down', icon: <Truck size={18} />, sparklineData: [95, 94, 93, 94, 93, 92, 92.4] },
    { id: '3', label: 'Avg Lead Time', subtitle: 'Days to Deliver', value: '14.2d', change: '-0.5d', trend: 'up', icon: <Clock size={18} />, sparklineData: [16, 15.5, 15, 14.8, 14.5, 14.3, 14.2] },
    { id: '4', label: 'Cost Variance', subtitle: 'Actual vs Std', value: '+3.5%', change: '+0.5%', trend: 'down', icon: <CurrencyDollar size={18} />, sparklineData: [2, 2.5, 3, 2.8, 3.2, 3.4, 3.5] },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '5', label: 'Dependency Index', subtitle: 'Risk (0-100)', value: '65', change: '+5', trend: 'down', icon: <ShieldWarning size={18} />, sparklineData: [55, 58, 60, 62, 63, 64, 65] },
    { id: '6', label: 'Dispute Rate', subtitle: 'Issues / Orders', value: '2.1%', change: '-0.4%', trend: 'up', icon: <Warning size={18} />, sparklineData: [3.5, 3, 2.8, 2.5, 2.4, 2.2, 2.1] },
    { id: '7', label: 'Preferred Suppliers', subtitle: 'Strategic Partners', value: '8', change: '0', trend: 'neutral', icon: <Star size={18} />, sparklineData: [6, 6, 7, 7, 8, 8, 8] },
];

// --- Mock Data: Charts ---
const SPEND_PER_SUPPLIER = [
    { name: 'TechCorp', value: 125000 },
    { name: 'OfficeMax', value: 85000 },
    { name: 'LogisticsInc', value: 65000 },
    { name: 'SoftSol', value: 55000 },
    { name: 'BuildIt', value: 42000 },
];

const LEAD_TIME_PER_SUPPLIER = [
    { name: 'TechCorp', value: 12 },
    { name: 'OfficeMax', value: 5 },
    { name: 'LogisticsInc', value: 18 },
    { name: 'SoftSol', value: 2 },
    { name: 'BuildIt', value: 25 },
];

const RISK_DISTRIBUTION = [
    { name: 'Low Risk', value: 25 },
    { name: 'Medium Risk', value: 10 },
    { name: 'High Risk', value: 3 },
];

// --- Mock Data: Table & Scatter ---
const SUPPLIER_DETAILS = [
    { id: 1, name: 'TechCorp', spend: 125000, leadTime: 12, onTime: 95, risk: 'Low', riskScore: 20 },
    { id: 2, name: 'OfficeMax', spend: 85000, leadTime: 5, onTime: 98, risk: 'Low', riskScore: 15 },
    { id: 3, name: 'LogisticsInc', spend: 65000, leadTime: 18, onTime: 85, risk: 'Medium', riskScore: 55 },
    { id: 4, name: 'SoftSol Global', spend: 55000, leadTime: 2, onTime: 99, risk: 'Low', riskScore: 10 },
    { id: 5, name: 'BuildIt Now', spend: 42000, leadTime: 25, onTime: 75, risk: 'High', riskScore: 85 },
    { id: 6, name: 'Global Parts', spend: 35000, leadTime: 35, onTime: 65, risk: 'High', riskScore: 90 },
    { id: 7, name: 'Local Supply', spend: 20000, leadTime: 3, onTime: 96, risk: 'Low', riskScore: 12 },
    { id: 8, name: 'Mediocre Inc', spend: 15000, leadTime: 15, onTime: 80, risk: 'Medium', riskScore: 45 },
];

export const SupplierPerformanceDashboard: React.FC = () => {
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

    // Pie Chart: Risk Distribution
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: RISK_DISTRIBUTION.map((d) => ({
                ...d,
                itemStyle: {
                    color: d.name === 'Low Risk' ? '#10b981' :
                        d.name === 'Medium Risk' ? '#f59e0b' : '#ef4444'
                }
            }))
        }]
    };

    // Scatter Matrix: Spend (X) vs Lead Time (Y) vs Risk (Bubble Size/Color)
    const scatterOption: EChartsOption = {
        title: { text: 'Risk vs value Matrix', left: 'center', top: 5, textStyle: { fontSize: 12, color: '#6b7280' } },
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `<b>${params.data[3]}</b><br/>Spend: ${formatCurrency(params.data[0], currency.code, currency.symbol)}<br/>Lead Time: ${params.data[1]} days<br/>Risk Score: ${params.data[2]}`;
            }
        },
        grid: { top: 40, right: 30, bottom: 20, left: 50, containLabel: true },
        xAxis: { type: 'value', name: 'Spend', nameLocation: 'middle', nameGap: 25, splitLine: { lineStyle: { type: 'dashed' } } },
        yAxis: { type: 'value', name: 'Lead Time (Days)', nameLocation: 'middle', nameGap: 30, splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{
            type: 'scatter',
            symbolSize: (data: any) => Math.max(10, data[2] / 2), // Bubble size based on Risk Score
            data: SUPPLIER_DETAILS.map(s => [
                s.spend,
                s.leadTime,
                s.riskScore,
                s.name,
                s.risk // 4th index for color mapping
            ]),
            itemStyle: {
                color: (params: any) => {
                    const risk = params.data[4];
                    return risk === 'High' ? '#ef4444' : risk === 'Medium' ? '#f59e0b' : '#10b981';
                },
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierPerformanceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Truck size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Supplier Performance</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Evaluate reliability, cost, and risk</p>
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
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Spend per Supplier */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Spend per Supplier" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend per Supplier</h3>
                                <p className="text-xs text-gray-400">Total volume by partner</p>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={SPEND_PER_SUPPLIER} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} interval={0} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(val: number) => formatCurrency(val, currency.code, currency.symbol)}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Recharts: Lead Time per Supplier */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Lead Time (Days)" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Lead Time (Days)</h3>
                                <p className="text-xs text-gray-400">Speed of delivery breakdown</p>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={LEAD_TIME_PER_SUPPLIER} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} interval={0} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ECharts: Risk Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title="Risk Distribution" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Risk Distribution</h3>
                                <p className="text-xs text-gray-400">Suppliers by risk category</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* Placeholder for symmetry or extra chart if needed, can use simple summary or empty state */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[240px]" title="Performance Status" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center animate-fade-in-up">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3">
                                <Star className="text-blue-500" size={32} weight="duotone" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Performance Status</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">
                                Overall supplier health is stable. <br /> 8 Preferred Suppliers are maintaining 95%+ performance.
                            </p>
                        </div>
                    )}

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
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
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={8} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Supplier Performance Metrics</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Supplier Name</th>
                                        <th className="px-5 py-3 text-right">Total Spend</th>
                                        <th className="px-5 py-3 text-right">Avg Del (Days)</th>
                                        <th className="px-5 py-3 text-right">On-Time %</th>
                                        <th className="px-5 py-3 text-center">Risk Level</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {SUPPLIER_DETAILS.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(s.spend, currency.code, currency.symbol)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{s.leadTime}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{s.onTime}%</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${s.risk === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        s.risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    {s.risk}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Scatter Matrix (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[350px]" title="Risk vs Value Matrix" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={scatterOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
