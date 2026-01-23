import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Lightning, ChartLine, ShieldWarning, Activity } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendsAnomaliesInfo } from './TrendsAnomaliesInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Trend Direction', subtitle: 'Last 3 Months', value: 'Rising', change: '+5%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [40, 42, 45, 48, 50, 52], color: 'blue' },
    { id: '2', label: 'Spike Count', subtitle: 'Last 30 Days', value: '5', change: '+2', trend: 'up', icon: <Lightning size={18} />, sparklineData: [1, 0, 1, 0, 2, 1], color: 'blue' },
    { id: '3', label: 'Anomaly Value', subtitle: 'Total Excess', value: '$4,250', change: '+12%', trend: 'down', icon: <Warning size={18} />, sparklineData: [1000, 1200, 800, 3000, 4250, 4250], color: 'blue' },
    { id: '4', label: 'Avg Monthly Change', subtitle: 'Volatility', value: '8.2%', change: '+1.5%', trend: 'neutral', icon: <Activity size={18} />, sparklineData: [5, 6, 8, 7, 8, 8.2], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Risk Level', subtitle: 'Assessment', value: 'Medium', change: '', trend: 'neutral', icon: <ShieldWarning size={18} />, sparklineData: [30, 30, 40, 50, 50, 50], color: 'blue' },
    { id: '6', label: 'Alert Frequency', subtitle: 'Avg per Week', value: '3.5', change: '-5%', trend: 'down', icon: <Lightning size={18} />, sparklineData: [4, 4, 3, 3, 4, 3.5], color: 'blue' },
    { id: '7', label: 'Expense Stability', subtitle: 'Index Score', value: '72/100', change: '-2', trend: 'down', icon: <ChartLine size={18} />, sparklineData: [78, 76, 75, 74, 73, 72], color: 'blue' },
    { id: '8', label: 'Pattern Confidence', subtitle: 'Detection Rate', value: '94%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [88, 90, 91, 92, 93, 94], color: 'blue' },
];

// --- Mock Data: Charts ---
const MONTHLY_EXPENSES = [
    { name: 'Jan', Standard: 10000, Anomaly: 500 },
    { name: 'Feb', Standard: 10200, Anomaly: 0 },
    { name: 'Mar', Standard: 9800, Anomaly: 1200 },
    { name: 'Apr', Standard: 10500, Anomaly: 200 },
    { name: 'May', Standard: 10100, Anomaly: 800 },
    { name: 'Jun', Standard: 10300, Anomaly: 1550 },
];

const ANOMALY_SPLIT = [
    { value: 95, name: 'Normal Spend' },
    { value: 5, name: 'Anomalous Spend' }
];

// --- Mock Data: Table & Timeline ---
const ANOMALIES_TABLE = [
    { date: '2023-06-12', category: 'Travel', amount: '$1,200', deviation: '+45%', flag: 'High' },
    { date: '2023-06-18', category: 'Software', amount: '$850', deviation: '+25%', flag: 'Medium' },
    { date: '2023-05-22', category: 'Marketing', amount: '$3,000', deviation: '+60%', flag: 'Critical' },
    { date: '2023-05-05', category: 'Office', amount: '$450', deviation: '+30%', flag: 'Medium' },
    { date: '2023-04-15', category: 'Rent', amount: '$200', deviation: '+10%', flag: 'Low' }, // Late fee perhaps
];

// Timeline Chart Data (Scatter or ThemeRiver - using Scatter for spikes)
const TIMELINE_DATA = [
    ['2023-01-15', 500, 'Low'],
    ['2023-03-10', 1200, 'High'],
    ['2023-04-05', 200, 'Low'],
    ['2023-05-18', 800, 'Medium'],
    ['2023-05-22', 3000, 'Critical'],
    ['2023-06-12', 1200, 'High'],
    ['2023-06-25', 1550, 'High']
];

// Additional chart data
const ANOMALY_BY_CATEGORY = [
    { name: 'Travel', value: 1200 },
    { name: 'Software', value: 850 },
    { name: 'Marketing', value: 3000 },
    { name: 'Office', value: 450 },
    { name: 'Rent', value: 200 },
];

const SEVERITY_DISTRIBUTION = [
    { value: 35, name: 'Critical' },
    { value: 40, name: 'High' },
    { value: 15, name: 'Medium' },
    { value: 10, name: 'Low' }
];

export const TrendsAnomaliesDashboard: React.FC = () => {
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

    // Pie Chart
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: ANOMALY_SPLIT,
            color: ['#10b981', '#ef4444'] // Green for Normal, Red for Anomaly
        }]
    };

    // Severity Distribution Pie
    const severityPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: SEVERITY_DISTRIBUTION,
            color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
        }]
    };

    // Timeline Chart (Scatter for anomalies over time)
    const timelineOption: EChartsOption = {
        title: { text: 'Spike Timeline', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        grid: { top: 30, right: 30, bottom: 20, left: 30, containLabel: true },
        tooltip: {
            formatter: (params: any) => {
                return `<b>${params.value[0]}</b><br/>Amount: $${params.value[1]}<br/>Severity: ${params.value[2]}`;
            }
        },
        xAxis: { type: 'category', splitLine: { show: false } },
        yAxis: { type: 'value', name: 'Deviation ($)', splitLine: { show: true, lineStyle: { type: 'dashed' } } },
        series: [{
            type: 'scatter',
            symbolSize: (data: any) => Math.min(Math.max(data[1] / 50, 10), 40), // Size by amount
            data: TIMELINE_DATA,
            itemStyle: {
                color: (params: any) => {
                    const severity = params.value[2];
                    return severity === 'Critical' ? '#ef4444' : severity === 'High' ? '#f59e0b' : '#3b82f6';
                },
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.2)'
            }
        }]
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-start gap-2">
                        <Lightning size={28} className="text-purple-600 dark:text-purple-400 mt-1" />
                        <div>
                            <h1 className="text-2xl font-bold">Trends & Anomalies</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detect unusual behavior</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Row 1: 4 KPI Skeletons */}
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="col-span-1 h-[120px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}

                    {/* Row 2: Two bar chart skeletons */}
                    <div className="col-span-2 min-h-[300px]">
                        <ChartSkeleton />
                    </div>
                    <div className="col-span-2 min-h-[300px]">
                        <ChartSkeleton />
                    </div>

                    {/* Row 3: Pie charts + KPIs */}
                    <div className="col-span-2 grid grid-cols-2 gap-6">
                        <PieChartSkeleton />
                        <PieChartSkeleton />
                    </div>
                    <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-[120px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                        ))}
                    </div>

                    {/* Row 4: Table + Chart skeleton */}
                    <div className="col-span-2">
                        <TableSkeleton />
                    </div>
                    <div className="col-span-2">
                        <ChartSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <TrendsAnomaliesInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Lightning size={28} className="text-purple-600 dark:text-purple-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Trends & Anomalies</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detect unusual behavior</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-purple-500" />
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

                {/* Recharts: Monthly Expenses (Stacked Bar - Standard vs Anomaly) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Monthly Spend Composition</h3>
                        <p className="text-xs text-gray-400">Standard (Gray) vs Anomaly (Red)</p>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MONTHLY_EXPENSES} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="Standard" stackId="a" fill="#e5e7eb" radius={[0, 0, 0, 0]} barSize={24} animationDuration={1000} />
                                <Bar dataKey="Anomaly" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recharts: Anomaly by Category (Bar) */}
                <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Anomaly by Category</h3>
                        <p className="text-xs text-gray-400">Deviation by expense type</p>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ANOMALY_BY_CATEGORY} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}

                {/* Pie Charts in nested 2-col grid */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Normal vs Anomalous (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend Purity</h3>
                            <p className="text-xs text-gray-400">Ratio of irregular spend</p>
                        </div>
                        <ReactECharts option={pieOption} style={{ height: '180px' }} />
                    </div>

                    {/* ECharts: Severity Distribution (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Severity Distribution</h3>
                            <p className="text-xs text-gray-400">Anomaly severity breakdown</p>
                        </div>
                        <ReactECharts option={severityPieOption} style={{ height: '180px' }} />
                    </div>
                </div>

                {/* Side KPIs in 2x2 grid */}
                <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
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
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Detected Anomalies</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                    <th className="px-5 py-3 text-right">Deviation</th>
                                    <th className="px-5 py-3 text-center">Flag</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {ANOMALIES_TABLE.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-datetime">{row.date}</td>
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.category}</td>
                                        <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">{row.amount}</td>
                                        <td className="px-5 py-3 text-right text-red-500 font-medium">{row.deviation}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.flag === 'Critical' ? 'bg-red-100 text-red-700' :
                                                row.flag === 'High' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {row.flag}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Timeline (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <ReactECharts option={timelineOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
