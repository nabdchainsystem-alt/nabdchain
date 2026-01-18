import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Target, ListChecks, CurrencyDollar, ArrowRight } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ForecastPlanningInfo } from './ForecastPlanningInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Forecasted Spend', subtitle: 'Next 30 Days', value: '$42k', change: '+5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [38, 39, 40, 40, 41, 41, 42] },
    { id: '2', label: 'Forecast Accuracy', subtitle: 'Last Period', value: '92%', change: '+1%', trend: 'up', icon: <Target size={18} />, sparklineData: [88, 89, 90, 90, 91, 91, 92] },
    { id: '3', label: 'Est. Cat. Growth', subtitle: 'Highest: Office', value: '+12%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [8, 9, 10, 10, 11, 11, 12] },
    { id: '4', label: 'Confidence Level', subtitle: 'Model Certainty', value: 'High', change: '', trend: 'neutral', icon: <Target size={18} />, sparklineData: [0, 0, 0, 0, 0, 0, 0] },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '5', label: 'Supply Risk Ahead', subtitle: 'Potential Issues', value: 'Low', change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [0, 1, 1, 1, 0, 0, 0] },
    { id: '6', label: 'Planned Orders', subtitle: 'Drafted', value: '8', change: '+2', trend: 'up', icon: <ListChecks size={18} />, sparklineData: [5, 6, 6, 7, 7, 8, 8] },
    { id: '7', label: 'Budget Impact', subtitle: '% of Annual Limit', value: '15%', change: '+1%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [12, 13, 13, 14, 14, 14, 15] },
    { id: '8', label: 'Variance Trend', subtitle: 'Forecast vs Actual', value: '-2.1%', change: '-0.5%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [4, 3.5, 3.2, 2.8, 2.5, 2.3, 2.1] },
];

// --- Mock Data: Charts ---
const FORECAST_VS_LAST = [
    { name: 'Electronics', last: 12000, forecast: 14500 },
    { name: 'Office', last: 4500, forecast: 5100 },
    { name: 'Services', last: 8000, forecast: 8200 },
    { name: 'Furniture', last: 2000, forecast: 1800 },
    { name: 'SaaS', last: 6000, forecast: 6500 },
];

const FUTURE_ALLOCATION = [
    { value: 40, name: 'Electronics' },
    { value: 20, name: 'Services' },
    { value: 18, name: 'SaaS' },
    { value: 15, name: 'Office' },
    { value: 7, name: 'Furniture' }
];

// New: Monthly Spend Projection
const SPEND_PROJECTION = [
    { name: 'Jan', value: 38 },
    { name: 'Feb', value: 40 },
    { name: 'Mar', value: 42 },
    { name: 'Apr', value: 44 },
    { name: 'May', value: 45 },
    { name: 'Jun', value: 47 },
];

// New: Budget Utilization by Quarter
const BUDGET_UTILIZATION = [
    { name: 'Q1 Actual', value: 35 },
    { name: 'Q2 Forecast', value: 28 },
    { name: 'Q3 Forecast', value: 22 },
    { name: 'Q4 Forecast', value: 15 },
];

// --- Mock Data: Table & Confidence Cone ---
const FORECAST_DETAILS = [
    { id: 1, category: 'Electronics', last: '$12,000', forecast: '$14,500', delta: '+20.8%' },
    { id: 2, category: 'Office', last: '$4,500', forecast: '$5,100', delta: '+13.3%' },
    { id: 3, category: 'Services', last: '$8,000', forecast: '$8,200', delta: '+2.5%' },
    { id: 4, category: 'SaaS', last: '$6,000', forecast: '$6,500', delta: '+8.3%' },
    { id: 5, category: 'Furniture', last: '$2,000', forecast: '$1,800', delta: '-10.0%' },
];

// Confidence Cone Data (Simple simulation)
const CONE_DATA = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    actual: [38, 40, 42, null, null, null],
    forecast: [null, null, 42, 44, 45, 47],
    upper: [null, null, 42, 46, 48, 52],
    lower: [null, null, 42, 42, 41, 42]
};

export const ForecastPlanningDashboard: React.FC = () => {
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

    // Pie Chart - Future Allocation
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
            data: FUTURE_ALLOCATION
        }]
    };

    // Pie Chart - Budget Utilization
    const budgetPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: BUDGET_UTILIZATION,
            color: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
        }]
    };

    // Confidence Cone Chart
    const coneOption: EChartsOption = {
        title: { text: 'Spend Projection (k$)', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'axis' },
        grid: { top: 30, right: 20, bottom: 20, left: 30, containLabel: true },
        xAxis: { type: 'category', data: CONE_DATA.months },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'Actual',
                type: 'line',
                data: CONE_DATA.actual,
                smooth: true,
                itemStyle: { color: '#3b82f6' }
            },
            {
                name: 'Forecast',
                type: 'line',
                data: CONE_DATA.forecast,
                smooth: true,
                lineStyle: { type: 'dashed' },
                itemStyle: { color: '#10b981' }
            },
            {
                name: 'Confidence Interval',
                type: 'line',
                data: CONE_DATA.upper,
                smooth: true,
                lineStyle: { opacity: 0 },
                stack: 'confidence',
                areaStyle: { color: 'rgba(16, 185, 129, 0.2)' },
                symbol: 'none'
            },
            {
                name: 'Lower',
                type: 'line',
                data: CONE_DATA.lower,
                smooth: true,
                lineStyle: { opacity: 0 },
                stack: 'confidence',
                areaStyle: { color: '#fff' }, // Hack to clear area below
                symbol: 'none'
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <ForecastPlanningInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Target size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Forecast & Planning</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Future spend & budget impact</p>
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

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area - 2x2 Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Row 1, Col 1: Recharts - Forecast per Category */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Forecast per Category" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Forecast per Category</h3>
                                <p className="text-xs text-gray-400">Previous vs Projected</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={FORECAST_VS_LAST} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="last" name="Last Period" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={12} />
                                        <Bar dataKey="forecast" name="Forecast" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Row 1, Col 2: Recharts - Spend Projection */}
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title="Spend Projection" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend Projection</h3>
                                <p className="text-xs text-gray-400">Monthly forecast (k$)</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={SPEND_PROJECTION} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Row 2, Col 1: ECharts - Future Allocation */}
                    {isLoading ? (
                        <PieChartSkeleton title="Future Allocation" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Future Allocation</h3>
                                <p className="text-xs text-gray-400">Budget distribution</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                    {/* Row 2, Col 2: ECharts - Budget Utilization */}
                    {isLoading ? (
                        <PieChartSkeleton title="Budget Utilization" />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Budget Utilization</h3>
                                <p className="text-xs text-gray-400">Quarterly spending progress</p>
                            </div>
                            <ReactECharts option={budgetPieOption} style={{ height: '200px' }} />
                        </div>
                    )}

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
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
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={4} title="Projected Changes" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Projected Changes</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3 text-right">Last Period</th>
                                        <th className="px-5 py-3 text-right">Forecast</th>
                                        <th className="px-5 py-3 text-right">Delta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {FORECAST_DETAILS.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{r.category}</td>
                                            <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{r.last}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{r.forecast}</td>
                                            <td className={`px-5 py-3 text-right font-medium ${r.delta.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                                                {r.delta}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Confidence Cone (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title="Spend Projection" />
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
