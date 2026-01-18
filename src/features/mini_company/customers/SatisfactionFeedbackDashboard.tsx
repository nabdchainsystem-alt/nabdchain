import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ArrowsOut, Info, TrendUp, Warning, Smiley, Star, ChatCenteredText, ThumbsUp, ThumbsDown, Megaphone } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SatisfactionFeedbackInfo } from './SatisfactionFeedbackInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Avg Satisfaction', subtitle: 'CSAT Score (1-10)', value: '8.4', change: '+0.2', trend: 'up', icon: <Star size={18} />, sparklineData: [8.0, 8.1, 8.2, 8.3, 8.3, 8.4], color: 'blue' },
    { id: '2', label: 'NPS', subtitle: 'Net Promoter Score', value: '+42', change: '+5', trend: 'up', icon: <Smiley size={18} />, sparklineData: [35, 36, 38, 40, 41, 42], color: 'blue' },
    { id: '3', label: 'Feedback Count', subtitle: 'Total Reviews', value: '350', change: '+10%', trend: 'up', icon: <ChatCenteredText size={18} />, sparklineData: [300, 310, 320, 330, 340, 350], color: 'blue' },
    { id: '4', label: 'Positive %', subtitle: '4-5 Star Ratings', value: '78%', change: '+2%', trend: 'up', icon: <ThumbsUp size={18} />, sparklineData: [75, 76, 76, 77, 77, 78], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Negative %', subtitle: '1-2 Star Ratings', value: '8%', change: '-1%', trend: 'down', icon: <ThumbsDown size={18} />, sparklineData: [10, 9, 9, 8, 8, 8], color: 'blue' },
    { id: '6', label: 'Response Rate', subtitle: 'Survey Completion', value: '22%', change: '+3%', trend: 'up', icon: <Megaphone size={18} />, sparklineData: [18, 19, 20, 21, 21, 22], color: 'blue' },
    { id: '7', label: 'Sentiment Index', subtitle: 'AI Analysis', value: '72', change: '+4', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [65, 66, 68, 70, 71, 72], color: 'blue' },
    { id: '8', label: 'Avg Response Time', subtitle: 'Feedback Resolution', value: '4.2h', change: '-0.5h', trend: 'up', icon: <ChatCenteredText size={18} />, sparklineData: [5.5, 5.2, 4.9, 4.6, 4.4, 4.2], color: 'blue' },
];

// --- Mock Data: Charts ---
const FEEDBACK_BY_CATEGORY = [
    { name: 'Product', Count: 120 },
    { name: 'Support', Count: 85 },
    { name: 'Pricing', Count: 45 },
    { name: 'Delivery', Count: 60 },
    { name: 'Website', Count: 40 }
];

const SENTIMENT_SPLIT = [
    { value: 65, name: 'Positive' },
    { value: 25, name: 'Neutral' },
    { value: 10, name: 'Negative' }
];

// Feedback Log Table
const FEEDBACK_LOG = [
    { customer: 'Alpha Corp', type: 'Product Review', score: '5/5', date: '2024-01-20', status: 'Closed' },
    { customer: 'Beta Ltd', type: 'Support Ticket', score: '2/5', date: '2024-01-19', status: 'In Progress' },
    { customer: 'Gamma Inc', type: 'Feature Request', score: 'N/A', date: '2024-01-18', status: 'Open' },
    { customer: 'Delta Co', type: 'NPS Survey', score: '9/10', date: '2024-01-18', status: 'Closed' },
    { customer: 'Epsilon', type: 'Delivery Complaint', score: '1/5', date: '2024-01-17', status: 'Escalated' },
];

// Radar Data
const RADAR_INDICATORS = [
    { name: 'Joy', max: 100 },
    { name: 'Trust', max: 100 },
    { name: 'Fear', max: 100 },
    { name: 'Surprise', max: 100 },
    { name: 'Sadness', max: 100 },
    { name: 'Disgust', max: 100 }
];
const RADAR_DATA = [
    {
        value: [80, 75, 10, 40, 15, 5],
        name: 'Current Sentiment'
    }
];


export const SatisfactionFeedbackDashboard: React.FC = () => {
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
            data: SENTIMENT_SPLIT,
            color: ['#22c55e', '#fbbf24', '#ef4444']
        }]
    };

    // Radar Chart
    const radarOption: EChartsOption = {
        title: { text: 'Emotional Polarity', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {},
        radar: {
            indicator: RADAR_INDICATORS,
            radius: '65%',
            splitNumber: 4,
            axisName: { color: '#9ca3af', fontSize: 10 }
        },
        series: [
            {
                name: 'Sentiment',
                type: 'radar',
                data: RADAR_DATA,
                areaStyle: { opacity: 0.2, color: '#eab308' },
                lineStyle: { width: 2, color: '#eab308' },
                itemStyle: { color: '#eab308' }
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SatisfactionFeedbackInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Smiley size={28} className="text-yellow-500 dark:text-yellow-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Satisfaction & Feedback</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sentiment Analysis</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-yellow-500" />
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

                {/* --- Row 2: Charts Section (3 cols) + Side KPIs (1 col) --- */}

                {/* Charts Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recharts: Feedback by Category (Bar) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Feedback Categories</h3>
                            <p className="text-xs text-gray-400">Volume by Topic</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={FEEDBACK_BY_CATEGORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ECharts: Sentiment Split (Pie) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Sentiment Breakdown</h3>
                            <p className="text-xs text-gray-400">Overall Mood</p>
                        </div>
                        <ReactECharts option={pieOption} style={{ height: '200px' }} />
                    </div>

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color="blue"
                                className="h-full"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Recent Feedback</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Score</th>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {FEEDBACK_LOG.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.customer}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.type}</td>
                                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{row.score}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-500 text-xs font-mono">{row.date}</td>
                                        <td className="px-5 py-3 text-right">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'Closed' ? 'bg-green-100 text-green-700' :
                                                row.status === 'Escalated' ? 'bg-red-100 text-red-700' :
                                                    row.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-yellow-100 text-yellow-700'
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

                {/* Companion Chart: Radar (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <ReactECharts option={radarOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
