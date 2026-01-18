import React, { useState, useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
    Funnel as FunnelIcon, Users, Notepad, ShoppingCart, Percent,
    Info, ArrowsOut,
    CaretLeft, CaretRight, Warning, CurrencyDollar, TrendDown, ArrowUp, ArrowDown
} from 'phosphor-react';
import { SalesFunnelInfo } from './SalesFunnelInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- Mock Data ---

const FUNNEL_DATA = [
    { value: 100, name: 'Leads Entered' },
    { value: 80, name: 'Leads Contacted' },
    { value: 60, name: 'Quotes Sent' },
    { value: 42, name: 'Orders Placed' },
];

const DROPOFF_BY_REP_DATA = [
    { name: 'Ahmed', dropoff: 12 },
    { name: 'Sarah', dropoff: 8 },
    { name: 'Omar', dropoff: 15 },
    { name: 'Layla', dropoff: 5 },
    { name: 'Khalid', dropoff: 18 },
];

const LOST_VS_WON_DATA = [
    { value: 42, name: 'Won Deals', itemStyle: { color: '#10b981' } },
    { value: 58, name: 'Lost/Dropped', itemStyle: { color: '#f43f5e' } },
];

const TABLE_DATA = [
    { id: 1, name: 'Tech Solutions', stage: 'Orders Placed', date: '2026-01-15', value: 12500, status: 'Won' },
    { id: 2, name: 'Global Industries', stage: 'Quotes Sent', date: '2026-01-14', value: 45000, status: 'Pending' },
    { id: 3, name: 'Retail Corp', stage: 'Leads Contacted', date: '2026-01-13', value: 8200, status: 'Lost' },
    { id: 4, name: 'Arabia Trading', stage: 'Leads Entered', date: '2026-01-12', value: 28000, status: 'Pending' },
    { id: 5, name: 'Desert Logistics', stage: 'Orders Placed', date: '2026-01-11', value: 15400, status: 'Won' },
    { id: 6, name: 'Sky High Media', stage: 'Quotes Sent', date: '2026-01-10', value: 18500, status: 'Lost' },
    { id: 7, name: 'Oceanic Blue', stage: 'Leads Contacted', date: '2026-01-09', value: 9500, status: 'Pending' },
];

// --- Sub-components ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-monday-dark-surface p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.name}: <span className="font-bold text-gray-900 dark:text-white">{entry.value}%</span>
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface SalesFunnelDashboardProps {
    hideFullscreen?: boolean;
}

export const SalesFunnelDashboard: React.FC<SalesFunnelDashboardProps> = ({ hideFullscreen = false }) => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // Table State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Sorted Table Data
    const processedTableData = useMemo(() => {
        let data = [...TABLE_DATA];
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
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '1', label: 'Leads Entered', subtitle: 'New potential leads', value: '1,248', change: '+12%', trend: 'up', icon: <Users size={18} />, color: 'indigo' },
        { id: '2', label: 'Leads Contacted', subtitle: 'First outreach made', value: '984', change: '+8%', trend: 'up', icon: <Notepad size={18} />, color: 'blue' },
        { id: '3', label: 'Quotes Sent', subtitle: 'Price proposals delivered', value: '642', change: '+15%', trend: 'up', icon: <CurrencyDollar size={18} />, color: 'amber' },
        { id: '4', label: 'Orders Placed', subtitle: 'Closed won deals', value: '420', change: '+5%', trend: 'up', icon: <ShoppingCart size={18} />, color: 'emerald' },
    ];

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '5', label: 'Conversion Rate', subtitle: 'Leads → Orders', value: '33.6%', change: '+2.4%', trend: 'up', icon: <Percent size={18} />, color: 'violet' },
        { id: '6', label: 'Funnel Drop-Off', subtitle: 'Avg. stage leakage', value: '18.5%', change: '-1.2%', trend: 'up', icon: <TrendDown size={18} />, color: 'rose' },
        { id: '7', label: 'Potential Revenue Lost', subtitle: 'Value in dropped deals', value: '0', rawValue: 184500, isCurrency: true, change: '+4%', trend: 'down', icon: <Warning size={18} />, color: 'orange' },
    ];

    // ECharts Funnel Option
    const funnelOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b} : {c}%' },
        series: [{
            name: 'Sales Funnel',
            type: 'funnel',
            left: '10%',
            top: 20,
            bottom: 20,
            width: '80%',
            min: 0,
            max: 100,
            minSize: '0%',
            maxSize: '100%',
            sort: 'descending',
            gap: 4,
            label: { show: true, position: 'inside', formatter: '{b} ({c}%)', fontSize: 11, fontWeight: 'bold' },
            labelLine: { show: false },
            itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 8 },
            emphasis: { label: { fontSize: 14 } },
            data: FUNNEL_DATA.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } }))
        }]
    };

    // ECharts Won vs Lost Pie Option
    const wonLostPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: { bottom: '0%', left: 'center', textStyle: { fontSize: 10, color: '#94a3b8' } },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            data: LOST_VS_WON_DATA
        }]
    };

    // ECharts Heatmap Option
    const heatmapOption: EChartsOption = {
        tooltip: { position: 'top' },
        grid: { height: '70%', top: '15%', left: '15%', right: '5%' },
        xAxis: {
            type: 'category',
            data: ['Lead', 'Contact', 'Quote', 'Order'],
            axisLine: { show: false },
            axisTick: { show: false },
            splitArea: { show: true }
        },
        yAxis: {
            type: 'category',
            data: ['Hardware', 'Software', 'Support', 'Other'],
            axisLine: { show: false },
            axisTick: { show: false },
            splitArea: { show: true }
        },
        visualMap: {
            min: 0,
            max: 50,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            inRange: { color: ['#fef2f2', '#f43f5e'] },
            show: false
        },
        series: [{
            name: 'Leakage Intensity',
            type: 'heatmap',
            data: [
                [0, 0, 5], [1, 0, 12], [2, 0, 25], [3, 0, 8],
                [0, 1, 10], [1, 1, 15], [2, 1, 30], [3, 1, 12],
                [0, 2, 8], [1, 2, 10], [2, 2, 20], [3, 2, 5],
                [0, 3, 15], [1, 3, 20], [2, 3, 40], [3, 3, 18],
            ],
            label: { show: true, fontSize: 9 },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.2)' } }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">

            <SalesFunnelInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-start gap-2 text-left">
                    <FunnelIcon size={28} className="text-indigo-600 dark:text-indigo-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Sales Funnel & Leakage</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Optimizing lead-to-order flow and minimizing drop-offs</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!hideFullscreen && (
                        <button
                            onClick={toggleFullScreen}
                            className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                            title="Full Screen"
                        >
                            <ArrowsOut size={18} />
                        </button>
                    )}
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-indigo-500" />
                        About Dashboard
                    </button>
                </div>
            </div>

            {/* --- SECTION 1: Top KPIs --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {TOP_KPIS.map((kpi) => (
                    <KPICard
                        key={kpi.id}
                        {...kpi}
                        value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        loading={isLoading}
                    />
                ))}
            </div>

            {/* --- SECTION 2: Middle - Funnel + Side KPIs --- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Funnel Chart (span 3) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[480px]" title="Main Sales Funnel" className="lg:col-span-3" />
                ) : (
                    <div className="lg:col-span-3 bg-white dark:bg-monday-dark-elevated p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in-up">
                        <div className="mb-6 text-left">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Main Sales Funnel</h3>
                            <p className="text-xs text-gray-500 mt-1 italic">Visualizing lead volume through each conversion stage</p>
                        </div>
                        <div className="h-[400px]">
                            <ReactECharts option={funnelOption} style={{ height: '100%' }} />
                        </div>
                    </div>
                )}

                {/* Side KPIs (Inverted L part) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SECTION 3: Secondary Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Drop-off by Rep (Recharts) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[380px]" title="Drop-off by Sales Rep" />
                ) : (
                    <div className="bg-white dark:bg-monday-dark-elevated p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in-up">
                        <div className="mb-6 text-left">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Drop-off by Sales Rep</h3>
                            <p className="text-xs text-gray-500 mt-1 italic">Identifying leakage points in the sales team</p>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={DROPOFF_BY_REP_DATA} margin={{ left: -20, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="dropoff" name="Leakage %" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Won vs Lost (ECharts) */}
                {isLoading ? (
                    <PieChartSkeleton title="Won vs Lost Deals" />
                ) : (
                    <div className="bg-white dark:bg-monday-dark-elevated p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in-up">
                        <div className="mb-6 text-left">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Won vs Lost Deals</h3>
                            <p className="text-xs text-gray-500 mt-1 italic">Overall success rate visualization</p>
                        </div>
                        <div className="h-[300px]">
                            <ReactECharts option={wonLostPieOption} style={{ height: '100%' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* --- SECTION 4: Bottom Table & Heatmap --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Table (Col 1) */}
                {isLoading ? (
                    <TableSkeleton rows={5} columns={5} />
                ) : (
                    <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20 text-left">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider leading-normal">
                                    Lead Tracking Table
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 italic leading-tight">Detailed stage and status monitoring</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-[350px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Lead/Customer</th>
                                        <th className="px-6 py-4">Stage</th>
                                        <th className="px-6 py-4">Date Entered</th>
                                        <th className="px-6 py-4 text-right">Value</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {paginatedData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b dark:border-gray-700 last:border-none">
                                            <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white">{row.name}</td>
                                            <td className="px-6 py-5 text-gray-500">{row.stage}</td>
                                            <td className="px-6 py-5 text-gray-500 font-mono text-xs">{row.date}</td>
                                            <td className="px-6 py-5 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(row.value, currency.code, currency.symbol)}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${row.status === 'Won' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                    row.status === 'Lost' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                                                        'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10 mt-auto text-left">
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
                )}

                {/* Leakage Heatmap (Col 3) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[450px]" title="Leakage Heatmap" />
                ) : (
                    <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col h-full text-left animate-fade-in-up">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-normal">
                                Leakage Heatmap
                            </h3>
                            <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Stage vs Category: Darker = Higher Value Loss</p>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                        <div className="mt-4 p-3 bg-rose-50/50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-800/50">
                            <p className="text-[10px] text-rose-700 dark:text-rose-400 leading-normal">
                                <strong>Critical Link:</strong> Highest leakage observed in "Quote" stage for "Hardware" category. Suggests a need for competitive pricing analysis.
                            </p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
