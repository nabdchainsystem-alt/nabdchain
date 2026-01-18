import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ArrowsOut, Info, TrendUp, Warning, FirstAid, Prohibit, Heart, ShieldWarning, Coin } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RetentionChurnInfo } from './RetentionChurnInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Retention Rate', subtitle: 'Last 90 Days', value: '85%', change: '-2%', trend: 'down', icon: <Heart size={18} />, sparklineData: [88, 87, 87, 86, 86, 85], color: 'indigo' },
    { id: '2', label: 'Churn Rate', subtitle: 'Annualized', value: '15%', change: '+2%', trend: 'down', icon: <Prohibit size={18} />, sparklineData: [12, 13, 13, 14, 14, 15], color: 'red' },
    { id: '3', label: 'At-Risk Customers', subtitle: 'High Probability', value: '45', change: '+5', trend: 'down', icon: <ShieldWarning size={18} />, sparklineData: [35, 38, 40, 42, 44, 45], color: 'orange' },
    { id: '4', label: 'Avg Lifespan', subtitle: 'Customer Tenure', value: '18mo', change: '+1mo', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [16, 16, 17, 17, 18, 18], color: 'emerald' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Recovered', subtitle: 'Won Back', value: '12', change: '+2', trend: 'up', icon: <FirstAid size={18} />, sparklineData: [8, 9, 10, 10, 11, 12], color: 'blue' },
    { id: '6', label: 'Churn Cost', subtitle: 'Est. Revenue Loss', value: '$12.5k', change: '+$1k', trend: 'down', icon: <Coin size={18} />, sparklineData: [10, 11, 11.5, 12, 12.2, 12.5], color: 'slate' },
    { id: '7', label: 'Loyalty Index', subtitle: 'NPS Adjusted', value: '72', change: '-1', trend: 'neutral', icon: <Heart size={18} />, sparklineData: [74, 74, 73, 73, 72, 72], color: 'pink' },
];

// --- Mock Data: Charts ---
const RETENTION_COHORT = [
    { name: 'M1', Rate: 100 },
    { name: 'M2', Rate: 85 },
    { name: 'M3', Rate: 72 },
    { name: 'M4', Rate: 65 },
    { name: 'M5', Rate: 60 },
    { name: 'M6', Rate: 58 },
];

const CHURN_SPLIT = [
    { value: 85, name: 'Retained' },
    { value: 10, name: 'Voluntary Churn' },
    { value: 5, name: 'Involuntary Churn' }
];

// --- Mock Data: Table & Spiral ---
const CHURN_TABLE = [
    { customer: 'TechFlow Inc', lastPurchase: '2023-11-15', risk: 'High (92%)', reason: 'Competitor Offer', status: 'Lost' },
    { customer: 'DataSystems', lastPurchase: '2023-12-01', risk: 'Medium (65%)', reason: 'Usage Drop', status: 'At Risk' },
    { customer: 'NetWorks', lastPurchase: '2023-12-20', risk: 'Low (25%)', reason: 'Ticket Spike', status: 'Monitor' },
    { customer: 'CloudNine', lastPurchase: '2023-10-30', risk: 'High (88%)', reason: 'Price Increase', status: 'Lost' },
    { customer: 'SoftServe', lastPurchase: '2024-01-05', risk: 'Medium (55%)', reason: 'Low Engagement', status: 'At Risk' },
];

// Spiral Heatmap Data (Months x Risk Level)
// Simulating a polar heatmap for "spiral" effect
const SPIRAL_DATA = [
    [0, 0, 5], [0, 1, 10], [0, 2, 2], [0, 3, 1], // Jan (Low, med, high, crit)
    [1, 0, 2], [1, 1, 5], [1, 2, 8], [1, 3, 4], // Feb
    [2, 0, 1], [2, 1, 2], [2, 2, 5], [2, 3, 10], // Mar (Spike)
    [3, 0, 8], [3, 1, 4], [3, 2, 2], [3, 3, 1], // Apr
    [4, 0, 6], [4, 1, 5], [4, 2, 2], [4, 3, 2], // May
    [5, 0, 5], [5, 1, 4], [5, 2, 3], [5, 3, 1], // Jun
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const RISK_LEVELS = ['Safe', 'Watch', 'Risk', 'Critical'];

export const RetentionChurnDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

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
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: CHURN_SPLIT,
            color: ['#6366f1', '#f43f5e', '#f97316']
        }]
    };

    // Polar Heatmap (Spiral)
    const spiralOption: EChartsOption = {
        title: { text: 'Churn Risk Spiral', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {
            position: 'top',
            formatter: (params: any) => `${MONTHS[params.value[0]]} - ${RISK_LEVELS[params.value[1]]}: ${params.value[2]} cust`
        },
        animation: false,
        grid: { height: '50%', top: '10%' },
        polar: {},
        angleAxis: {
            type: 'category',
            data: MONTHS,
            boundaryGap: false,
            splitLine: { show: true, lineStyle: { color: '#ddd' } },
            axisLine: { show: false }
        },
        radiusAxis: {
            type: 'category',
            data: RISK_LEVELS,
            axisLine: { show: false },
            axisLabel: { rotate: 45 }
        },
        visualMap: {
            min: 0,
            max: 10,
            calculable: true,
            orient: 'vertical',
            left: 'right',
            top: 'center',
            inRange: { color: ['#f0f9ff', '#c084fc', '#4c1d95'] },
            show: false
        },
        series: [{
            name: 'Risk Concentration',
            type: 'heatmap',
            coordinateSystem: 'polar',
            data: SPIRAL_DATA,
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1
            }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-[#1a1d24] min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <RetentionChurnInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Heart size={28} className="text-pink-600 dark:text-pink-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Retention & Churn</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customer Stability Analysis</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 transition-colors bg-white dark:bg-[#2b2e36] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 transition-colors bg-white dark:bg-[#2b2e36] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-pink-500" />
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
                            color={kpi.color as any || 'blue'}
                        />
                    </div>
                ))}

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Retention by Cohort (Bar) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Cohort Retention</h3>
                            <p className="text-xs text-gray-400">% Active after N Months</p>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={RETENTION_COHORT} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} unit="%" />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Rate" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ECharts: Churn Split (Pie) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Composition</h3>
                            <p className="text-xs text-gray-400">Current Status</p>
                        </div>
                        <ReactECharts option={pieOption} style={{ height: '180px' }} />
                    </div>

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color={kpi.color as any || 'indigo'}
                                className="h-full"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Churn Risk Analysis</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Last Purchase</th>
                                    <th className="px-5 py-3">Risk Level</th>
                                    <th className="px-5 py-3">Reason</th>
                                    <th className="px-5 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {CHURN_TABLE.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.customer}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.lastPurchase}</td>
                                        <td className="px-5 py-3">
                                            <span className={`font-medium ${row.risk.startsWith('High') ? 'text-red-600' :
                                                    row.risk.startsWith('Medium') ? 'text-amber-600' : 'text-green-600'
                                                }`}>
                                                {row.risk}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs italic">{row.reason}</td>
                                        <td className="px-5 py-3 text-right">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'Lost' ? 'bg-red-100 text-red-700' :
                                                    row.status === 'At Risk' ? 'bg-orange-100 text-orange-700' :
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
                </div>

                {/* Companion Chart: Spiral (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <ReactECharts option={spiralOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
