import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import {
    ChartLineUp, CurrencyDollar, TrendUp,
    Info, ArrowsOut, ArrowsIn,
    CaretLeft, CaretRight, Warning, Target, ChartLine, ArrowUp, ArrowDown, Minus
} from 'phosphor-react';
import { SalesForecastInfo } from './SalesForecastInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- Mock Data ---

const FORECAST_BY_PRODUCT_DATA = [
    { name: 'Headphones', actual: 45000, forecast: 52000 },
    { name: 'Laptops', actual: 52000, forecast: 58000 },
    { name: 'Keyboards', actual: 28000, forecast: 26000 },
    { name: 'Monitors', actual: 34000, forecast: 36000 },
    { name: 'Mice', actual: 12000, forecast: 14000 },
];

const FORECAST_BY_REGION_DATA = [
    { name: 'Riyadh', actual: 120000, forecast: 135000 },
    { name: 'Jeddah', actual: 85000, forecast: 92000 },
    { name: 'Dammam', actual: 65000, forecast: 68000 },
    { name: 'Abha', actual: 32000, forecast: 40000 },
];

const ACTUAL_VS_FORECAST_DATA = [
    ['Month', 'Actual', 'Forecast'],
    ['Jan', 42000, 40000],
    ['Feb', 38000, 41000],
    ['Mar', 41000, 42000],
    ['Apr', 45000, 44000],
    ['May', 52000, 50000],
    ['Jun', 48000, 51000],
    ['Jul', null, 53000],
    ['Aug', null, 55000],
    ['Sep', null, 58000],
];

const RISK_DISTRIBUTION_DATA = [
    { name: 'Low Risk', value: 65 },
    { name: 'Medium Risk', value: 25 },
    { name: 'High Risk', value: 10 },
];

const DECISION_TABLE_DATA = [
    { id: 1, name: 'Premium Headphones', type: 'Product', last30: 12500, forecast30: 14000, deviation: 12, status: 'At Risk' },
    { id: 2, name: 'Riyadh Region', type: 'Region', last30: 45000, forecast30: 48000, deviation: 6.6, status: 'On Track' },
    { id: 3, name: 'Webcam 4K', type: 'Product', last30: 8200, forecast30: 12500, deviation: 52.4, status: 'On Track' },
    { id: 4, name: 'Jeddah Region', type: 'Region', last30: 28000, forecast30: 26500, deviation: -5.3, status: 'On Track' },
    { id: 5, name: 'LED Monitors', type: 'Product', last30: 15400, forecast30: 16000, deviation: 3.8, status: 'On Track' },
    { id: 6, name: 'Dammam Region', type: 'Region', last30: 18500, forecast30: 17000, deviation: -8.1, status: 'On Track' },
    { id: 7, name: 'Ergonomic Chair', type: 'Product', last30: 9500, forecast30: 8000, deviation: -15.7, status: 'At Risk' },
];

// --- Sub-components ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#1a1d24] p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.name}: <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const SalesForecastDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Table State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'deviation', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    React.useEffect(() => {
        const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    };

    // Sorted Table Data
    const processedTableData = useMemo(() => {
        let data = [...DECISION_TABLE_DATA];
        if (sortConfig.key && sortConfig.direction) {
            data.sort((a: any, b: any) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedTableData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedTableData, currentPage]);

    const totalPages = Math.ceil(processedTableData.length / itemsPerPage);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
        setSortConfig({ key, direction });
    };

    // KPI Config
    const FORECAST_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '1', label: 'Expected Revenue', subtitle: 'Next 90 Days projection', value: '0', rawValue: 320500, isCurrency: true, change: '+18.5%', trend: 'up', icon: <Target size={18} />, sparklineData: [40, 42, 45, 48, 52, 58, 65] },
        { id: '2', label: 'Forecast Accuracy', subtitle: 'Historical performance', value: '94.2%', change: '+1.4%', trend: 'up', icon: <ChartLine size={18} />, sparklineData: [92, 93, 91, 94, 94.5, 94.2, 94.2] },
        { id: '3', label: 'Risk Level', subtitle: 'Operational risk status', value: 'Low', change: 'Stable', trend: 'neutral', icon: <Warning size={18} />, color: 'emerald', sparklineData: [0, 0, 0, 0, 0, 0, 0] },
        { id: '4', label: 'Exp. Profit Margin', subtitle: 'Projected efficiency', value: '24.5%', change: '-0.5%', trend: 'down', icon: <CurrencyDollar size={18} />, sparklineData: [26, 25.5, 25, 24.8, 24.5, 24.5, 24.5] },
    ];

    // ECharts Actual vs Forecast Option
    const lineOption: EChartsOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        legend: { data: ['Actual', 'Forecast'], textStyle: { color: '#94a3b8' }, bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ACTUAL_VS_FORECAST_DATA.slice(1).map(d => d[0]),
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        series: [
            {
                name: 'Actual',
                type: 'line',
                smooth: true,
                data: ACTUAL_VS_FORECAST_DATA.slice(1).map(d => d[1]),
                itemStyle: { color: '#6366f1' },
                lineStyle: { width: 3 },
                symbolSize: 8
            },
            {
                name: 'Forecast',
                type: 'line',
                smooth: true,
                data: ACTUAL_VS_FORECAST_DATA.slice(1).map(d => d[2]),
                itemStyle: { color: '#10b981' },
                lineStyle: { width: 3, type: 'dashed' },
                symbolSize: 8
            }
        ]
    };

    // ECharts Risk Distribution Option
    const riskPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: { orient: 'vertical', left: 'left', textStyle: { fontSize: 11, color: '#94a3b8' } },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            data: [
                { value: 65, name: 'Low Risk', itemStyle: { color: '#10b981' } },
                { value: 25, name: 'Medium Risk', itemStyle: { color: '#f59e0b' } },
                { value: 10, name: 'High Risk', itemStyle: { color: '#f43f5e' } }
            ]
        }]
    };

    // ECharts Scatter Companion Chart
    const scatterOption: EChartsOption = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `<div class="p-2 font-sans">
                    <p class="font-bold text-gray-800">${params.data[2]}</p>
                    <p class="text-xs text-gray-500 mt-1">Forecast: ${formatCurrency(params.data[0], currency.code, currency.symbol)}</p>
                    <p class="text-xs text-gray-500">Deviation: ${params.data[1]}%</p>
                </div>`;
            }
        },
        grid: { top: '15%', bottom: '15%', left: '15%', right: '10%' },
        xAxis: {
            name: 'Forecast Value',
            nameLocation: 'middle',
            nameGap: 25,
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        yAxis: {
            name: 'Deviation %',
            nameLocation: 'middle',
            nameGap: 35,
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [{
            symbolSize: (data: any) => Math.sqrt(data[0]) / 2,
            data: [
                [14000, 12, 'Premium Headphones'],
                [48000, 6.6, 'Riyadh Region'],
                [12500, 52.4, 'Webcam 4K'],
                [26500, -5.3, 'Jeddah Region'],
                [16000, 3.8, 'LED Monitors'],
                [17000, -8.1, 'Dammam Region'],
                [8000, -15.7, 'Ergonomic Chair'],
            ],
            type: 'scatter',
            itemStyle: {
                color: (params: any) => params.data[1] > 10 ? '#f43f5e' : '#10b981'
            }
        }]
    };

    return (
        <div ref={containerRef} className={`p-6 bg-white dark:bg-[#1a1d24] min-h-full font-sans text-gray-800 dark:text-gray-200 relative ${isFullScreen ? 'overflow-y-auto' : ''}`}>

            <SalesForecastInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-start gap-2">
                    <Target size={28} className="text-indigo-600 dark:text-indigo-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Forecast & Prediction</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Strategic planning and predictive risk assessment</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-[#2b2e36] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    >
                        {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-[#2b2e36] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-indigo-500" />
                        About Dashboard
                    </button>
                </div>
            </div>

            {/* --- SECTION 1: KPI Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {FORECAST_KPIS.map((kpi) => (
                    <KPICard
                        key={kpi.id}
                        {...kpi}
                        value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        color={kpi.color || "indigo"}
                    />
                ))}
            </div>

            {/* --- SECTION 2: Middle Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Actual vs Forecast (ECharts) */}
                <div className="bg-white dark:bg-[#2b2e36] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Actual vs Forecasted Sales</h3>
                            <p className="text-xs text-gray-500 mt-1 italic">Comparison with trend extrapolation</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-[10px] text-gray-500 font-semibold uppercase">Actual</span>
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-gray-500 font-semibold uppercase">Forecast</span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ReactECharts option={lineOption} style={{ height: '100%' }} />
                    </div>
                </div>

                {/* Forecast per Product (Recharts) */}
                <div className="bg-white dark:bg-[#2b2e36] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Forecast per Product</h3>
                        <p className="text-xs text-gray-500 mt-1 italic">Projected demand by category</p>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={FORECAST_BY_PRODUCT_DATA} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                <Bar dataKey="actual" name="Current" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="forecast" name="Predicted" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk Distribution (ECharts) */}
                <div className="bg-white dark:bg-[#2b2e36] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Potential Risk Distribution</h3>
                        <p className="text-xs text-gray-500 mt-1 italic">Vulnerability assessment by revenue share</p>
                    </div>
                    <div className="h-[250px]">
                        <ReactECharts option={riskPieOption} style={{ height: '100%' }} />
                    </div>
                </div>

                {/* Forecast per Region (Recharts) */}
                <div className="bg-white dark:bg-[#2b2e36] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Regional Forecast</h3>
                        <p className="text-xs text-gray-500 mt-1 italic">Expected performance per territory</p>
                    </div>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={FORECAST_BY_REGION_DATA} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="forecast" name="Exp. Sales" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: Decision Table & Companion Chart --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Decision Table (1/2 Columns) */}
                <div className="lg:col-span-1 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    {/* Table Header / Toolbar */}
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                Strategic Decision Table
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 italic">Comparing current trends against predictive targets</p>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left h-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Target (Product/Region)</th>
                                    <th className="px-6 py-4 text-right">Last 30D Avg</th>
                                    <th className="px-6 py-4 text-right">Next 30D Forecast</th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('deviation')}>Dev. %</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b dark:border-gray-700 last:border-none flex-1">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-white">{row.name}</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{row.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-gray-500">{formatCurrency(row.last30, currency.code, currency.symbol)}</td>
                                        <td className="px-6 py-5 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(row.forecast30, currency.code, currency.symbol)}</td>
                                        <td className="px-6 py-5 text-right">
                                            <div className={`flex items-center justify-end gap-1 font-bold ${row.deviation > 10 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {row.deviation > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                {Math.abs(row.deviation)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${row.status === 'On Track' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10 mt-auto">
                        <span className="text-xs text-gray-500">
                            Showing <span className="font-bold text-gray-700 dark:text-gray-300">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedTableData.length)}</span> of <span className="font-bold text-gray-700 dark:text-gray-300">{processedTableData.length}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <CaretLeft size={16} />
                            </button>
                            <span className="text-xs font-bold mx-2">{currentPage} / {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <CaretRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Companion Chart: Deviation Scatter (1/2 Column) */}
                <div className="lg:col-span-1 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col h-full">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-normal">
                            Forecast Confidence vs Deviation
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Scatter analysis: Bubble size = Projected Revenue, Red Bubbles = High Deviation</p>
                    </div>
                    <div className="flex-1 min-h-[400px]">
                        <ReactECharts option={scatterOption} style={{ height: '100%', width: '100%' }} />
                    </div>
                    <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/50">
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal">
                            <strong>Insight:</strong> Webcam 4K shows the highest deviation from forecast (+52.4%), suggesting an unexpected surge in demand or a conservative initial prediction.
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
};
