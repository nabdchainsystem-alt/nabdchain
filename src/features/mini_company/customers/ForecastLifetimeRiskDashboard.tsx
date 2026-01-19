import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Lightning, Sparkle, Target, ChartLineUp, ShieldCheck } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ForecastLifetimeRiskInfo } from './ForecastLifetimeRiskInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Forecasted CLV', subtitle: 'Next 12 Months', value: '$2.4M', change: '+15%', trend: 'up', icon: <Sparkle size={18} />, sparklineData: [2.0, 2.1, 2.2, 2.3, 2.3, 2.4], color: 'blue' },
    { id: '2', label: 'Forecast Accuracy', subtitle: 'Model Precision', value: '92%', change: '+1%', trend: 'up', icon: <Target size={18} />, sparklineData: [88, 89, 90, 91, 91, 92], color: 'blue' },
    { id: '3', label: 'High-Risk Customers', subtitle: 'Churn Probability > 80%', value: '18', change: '-3', trend: 'up', icon: <Warning size={18} />, sparklineData: [25, 24, 22, 20, 19, 18], color: 'blue' },
    { id: '4', label: 'Expected Churn %', subtitle: 'Projected Attrition', value: '5.2%', change: '-0.5%', trend: 'up', icon: <ChartLineUp size={18} />, sparklineData: [6.0, 5.8, 5.6, 5.5, 5.3, 5.2], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Upsell Potential', subtitle: 'Extension Revenue', value: '$450k', change: '+8%', trend: 'up', icon: <Lightning size={18} />, sparklineData: [400, 410, 420, 430, 440, 450], color: 'blue' },
    { id: '6', label: 'LTV Growth', subtitle: 'Year-over-Year', value: '+12%', change: '+2%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [8, 9, 10, 10, 11, 12], color: 'blue' },
    { id: '7', label: 'Confidence Level', subtitle: 'Statistical Certainty', value: 'High', change: 'Stable', trend: 'neutral', icon: <ShieldCheck size={18} />, sparklineData: [90, 90, 90, 90, 90, 90], color: 'blue' },
    { id: '8', label: 'Prediction Horizon', subtitle: 'Forecast Window', value: '12mo', change: 'Stable', trend: 'neutral', icon: <Target size={18} />, sparklineData: [12, 12, 12, 12, 12, 12], color: 'blue' },
];

// --- Mock Data: Charts ---
const FORECAST_BY_SEGMENT = [
    { name: 'Enterprise', Value: 1200 },
    { name: 'Mid-Market', Value: 850 },
    { name: 'SMB', Value: 350 },
    { name: 'Startup', Value: 150 }
];

const RISK_DISTRIBUTION = [
    { value: 65, name: 'Low Risk' },
    { value: 25, name: 'Medium Risk' },
    { value: 10, name: 'High Risk' }
];

// Risk Table
const RISK_TABLE = [
    { customer: 'Omega Corp', currentCLV: '$120k', forecastCLV: '$150k', risk: 'Low', action: 'Upsell Gold Plan' },
    { customer: 'Zeta Inc', currentCLV: '$85k', forecastCLV: '$90k', risk: 'Medium', action: 'Schedule QBR' },
    { customer: 'Theta LLC', currentCLV: '$200k', forecastCLV: '$180k', risk: 'High', action: 'Exec Intervention' },
    { customer: 'Sigma Co', currentCLV: '$45k', forecastCLV: '$60k', risk: 'Low', action: 'Nurture Campaign' },
    { customer: 'Kappa Ltd', currentCLV: '$95k', forecastCLV: '$95k', risk: 'Medium', action: 'Monitor Usage' },
];

// Cone Data (Mocking a prediction interval)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BASE_VALUE = 100;
const CONE_DATA = MONTHS.map((m, i) => {
    const growth = i * 5;
    const uncertainty = i * 2;
    return {
        month: m,
        lower: BASE_VALUE + growth - uncertainty,
        mean: BASE_VALUE + growth,
        upper: BASE_VALUE + growth + uncertainty
    };
});

// Additional chart data
const GROWTH_BY_COHORT = [
    { name: 'Q1 2023', Growth: 15 },
    { name: 'Q2 2023', Growth: 18 },
    { name: 'Q3 2023', Growth: 22 },
    { name: 'Q4 2023', Growth: 12 },
];

const FORECAST_ACCURACY = [
    { value: 72, name: 'Accurate' },
    { value: 20, name: 'Within Range' },
    { value: 8, name: 'Missed' }
];


export const ForecastLifetimeRiskDashboard: React.FC = () => {
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
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: RISK_DISTRIBUTION,
            color: ['#10b981', '#f59e0b', '#ef4444']
        }]
    };

    // Forecast Accuracy Pie
    const accuracyPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: FORECAST_ACCURACY,
            color: ['#10b981', '#f59e0b', '#ef4444']
        }]
    };

    // Area Chart (Cone)
    const coneOption: EChartsOption = {
        title: { text: 'LTV Probability Cone', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: MONTHS, axisLine: { show: false }, axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
        series: [
            {
                name: 'Upper Bound',
                type: 'line',
                data: CONE_DATA.map(d => d.upper),
                smooth: true,
                lineStyle: { opacity: 0 },
                areaStyle: {
                    color: '#9333ea',
                    opacity: 0.1,
                    origin: 'start' // This is tricky for a "band", using stacked area logic usually better but simplified here as just upper/lower fill check
                },
                stack: 'confidence', // Not stacking in standard way to create band, actually need 'lower' to be invisible area and 'upper' to stack...
                // Let's simplify: Standard line for Mean, Area for range.
                // Actually better: Upper Bound line (transparent), Lower Bound line (transparent), Area between?
                // ECharts specific "confidence band" usually requires specific data struct.
                // Simplified approach: Just plot Mean line with an area gradient to show potential.
            },
            // Let's restart the series logic for a simple "visual" cone
            {
                name: 'Forecast Mean',
                type: 'line',
                data: CONE_DATA.map(d => d.mean),
                smooth: true,
                itemStyle: { color: '#9333ea' },
                lineStyle: { width: 3 }
            },
            {
                name: 'Range',
                type: 'line',
                data: CONE_DATA.map(d => d.mean), // Dummy center
                smooth: true,
                lineStyle: { opacity: 0 },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(147, 51, 234, 0.4)' }, { offset: 1, color: 'rgba(147, 51, 234, 0.05)' }]
                    }
                },
                // Making the "range" just a shadow/glow below for effect
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <ForecastLifetimeRiskInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Sparkle size={28} className="text-purple-600 dark:text-purple-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Forecast & Lifetime Risk</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Predictive Analytics</p>
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
                {isLoading ? (
                    <>
                        <div className="col-span-2"><ChartSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Recharts: Forecast CLV (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Projected CLV</h3>
                                <p className="text-xs text-gray-400">By Segment</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={FORECAST_BY_SEGMENT} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="Value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recharts: Growth by Cohort (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Growth by Cohort</h3>
                                <p className="text-xs text-gray-400">LTV Growth %</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={GROWTH_BY_COHORT} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="Growth" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2"><PieChartSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Pie Charts in nested 2-col grid */}
                        <div className="col-span-2 grid grid-cols-2 gap-6">
                            {/* ECharts: Risk Distribution (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Risk Profile</h3>
                                    <p className="text-xs text-gray-400">Customer Base</p>
                                </div>
                                <ReactECharts option={pieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Forecast Accuracy (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Forecast Accuracy</h3>
                                    <p className="text-xs text-gray-400">Model Performance</p>
                                </div>
                                <ReactECharts option={accuracyPieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        {/* 4 KPIs in 2x2 grid */}
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard
                                        {...kpi}
                                        color="blue"
                                        className="h-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* --- Row 4: Table + Companion Chart --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2"><TableSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Table (2 cols) */}
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Risk Action Plan</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className="px-5 py-3">Customer</th>
                                            <th className="px-5 py-3">Current CLV</th>
                                            <th className="px-5 py-3">Forecast CLV</th>
                                            <th className="px-5 py-3">Risk</th>
                                            <th className="px-5 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {RISK_TABLE.map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.customer}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.currentCLV}</td>
                                                <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400">{row.forecastCLV}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.risk === 'High' ? 'bg-red-100 text-red-700' :
                                                        row.risk === 'Medium' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {row.risk}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right text-xs text-gray-500 dark:text-gray-400 italic">
                                                    {row.action}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Companion Chart: Cone (2 cols) */}
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <ReactECharts option={coneOption} style={{ height: '300px', width: '100%' }} />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
