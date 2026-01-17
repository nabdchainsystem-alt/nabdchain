import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import {
    ChartLineUp, ChartBar, CurrencyDollar, ShoppingCart, TrendUp,
    Info, ArrowsOut, ArrowsIn,
    CaretLeft, CaretRight, Database, Lightbulb
} from 'phosphor-react';
import { SalesAnalysisInfo } from './SalesAnalysisInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- Mock Data ---

const SALES_BY_PRODUCT_DATA = [
    { name: 'Headphones', sales: 45000 },
    { name: 'Laptops', sales: 52000 },
    { name: 'Keyboards', sales: 28000 },
    { name: 'Monitors', sales: 34000 },
    { name: 'Mice', sales: 12000 },
];

const SALES_BY_PERSON_DATA = [
    { name: 'Ahmed', sales: 38000 },
    { name: 'Sarah', sales: 42000 },
    { name: 'Omar', sales: 31000 },
    { name: 'Layla', sales: 29000 },
];

const SALES_BY_REGION_DATA = [
    { name: 'Riyadh', value: 45 },
    { name: 'Jeddah', value: 25 },
    { name: 'Dammam', value: 20 },
    { name: 'Abha', value: 10 },
];

const TABLE_DATA = [
    { id: 'ORD-001', date: '2026-01-10', customer: 'Tech Solutions', product: 'Premium Headphones', qty: 5, price: 200, total: 1000, salesperson: 'Ahmed', region: 'Riyadh', status: 'Completed' },
    { id: 'ORD-002', date: '2026-01-11', customer: 'Global Mart', product: 'Ergonomic Chair', qty: 2, price: 450, total: 900, salesperson: 'Sarah', region: 'Jeddah', status: 'Pending' },
    { id: 'ORD-003', date: '2026-01-12', customer: 'Creative Studio', product: 'Mechanical Keyboard', qty: 10, price: 150, total: 1500, salesperson: 'Omar', region: 'Dammam', status: 'Completed' },
    { id: 'ORD-004', date: '2026-01-13', customer: 'Fast Delivery', product: 'USB-C Dock', qty: 20, price: 80, total: 1600, salesperson: 'Layla', region: 'Abha', status: 'Shipped' },
    { id: 'ORD-005', date: '2026-01-14', customer: 'Smart Home', product: 'Webcam 4K', qty: 3, price: 150, total: 450, salesperson: 'Ahmed', region: 'Riyadh', status: 'Completed' },
    { id: 'ORD-006', date: '2026-01-15', customer: 'Digital Hub', product: 'LED Monitor', qty: 4, price: 300, total: 1200, salesperson: 'Sarah', region: 'Jeddah', status: 'Completed' },
    { id: 'ORD-007', date: '2026-01-16', customer: 'Office Pros', product: 'Office Desk', qty: 1, price: 800, total: 800, salesperson: 'Omar', region: 'Dammam', status: 'Pending' },
    { id: 'ORD-008', date: '2026-01-17', customer: 'Future Tech', product: 'Gaming Mouse', qty: 15, price: 60, total: 900, salesperson: 'Layla', region: 'Abha', status: 'Completed' },
];

// --- Sub-components ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#1a1d24] p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {payload[0].name}: <span className="font-bold text-gray-900 dark:text-white">{payload[0].value}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export const SalesAnalysisDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Table State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'date', direction: 'desc' });
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

    // Filtered & Sorted Table Data
    const processedTableData = useMemo(() => {
        let data = [...TABLE_DATA];

        // Sort
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
    const ANALYSIS_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '1', label: 'Total Sales Value', subtitle: 'Gross revenue generated', value: '0', rawValue: 284500, isCurrency: true, change: '+14.2%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [40, 45, 42, 50, 55, 62, 70] },
        { id: '2', label: 'Total Orders', subtitle: 'Volume of transactions', value: '1,248', change: '+8.5%', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [20, 22, 25, 23, 28, 30, 32] },
        { id: '3', label: 'Avg Order Value', subtitle: 'Revenue per transaction', value: '0', rawValue: 228, isCurrency: true, change: '-2.1%', trend: 'down', icon: <TrendUp size={18} />, sparklineData: [240, 235, 230, 225, 228, 226, 228] },
        { id: '4', label: 'Sales Growth Rate', subtitle: 'Period over period', value: '18.4%', change: '+1.2%', trend: 'up', icon: <ChartLineUp size={18} />, sparklineData: [12, 14, 15, 16, 17, 18, 18.4] },
    ];

    // ECharts Region Option
    const regionPieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        series: [{
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
            labelLine: { show: false },
            data: SALES_BY_REGION_DATA.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } }))
        }],
        legend: { bottom: '5%', left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: '#94a3b8' } }
    };

    // --- COMPANION CHART: Sankey (Hidden Story) ---
    // Reveals flow from Region -> Salesperson -> Status
    const flowChartOption: EChartsOption = {
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [{
            type: 'sankey',
            emphasis: { focus: 'adjacency' },
            data: [
                { name: 'Riyadh' }, { name: 'Jeddah' }, { name: 'Dammam' }, { name: 'Abha' },
                { name: 'Ahmed' }, { name: 'Sarah' }, { name: 'Omar' }, { name: 'Layla' },
                { name: 'Completed' }, { name: 'Pending' }, { name: 'Shipped' }
            ],
            links: [
                { source: 'Riyadh', target: 'Ahmed', value: 10 },
                { source: 'Jeddah', target: 'Sarah', value: 8 },
                { source: 'Dammam', target: 'Omar', value: 7 },
                { source: 'Abha', target: 'Layla', value: 5 },
                { source: 'Ahmed', target: 'Completed', value: 8 },
                { source: 'Ahmed', target: 'Pending', value: 2 },
                { source: 'Sarah', target: 'Completed', value: 6 },
                { source: 'Sarah', target: 'Pending', value: 2 },
                { source: 'Omar', target: 'Completed', value: 5 },
                { source: 'Omar', target: 'Shipped', value: 2 },
                { source: 'Layla', target: 'Shipped', value: 5 }
            ],
            lineStyle: { color: 'gradient', curveness: 0.5 },
            label: { fontSize: 10, color: '#64748b' }
        }]
    };

    return (
        <div ref={containerRef} className={`p-6 bg-white dark:bg-[#1a1d24] min-h-full font-sans text-gray-800 dark:text-gray-200 relative ${isFullScreen ? 'overflow-y-auto' : ''}`}>

            <SalesAnalysisInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-start gap-2">
                    <ChartBar size={28} className="text-indigo-600 dark:text-indigo-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Sales Insights & Patterns</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Deep sales performance analysis and pattern detection</p>
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
                {ANALYSIS_KPIS.map((kpi) => (
                    <KPICard
                        key={kpi.id}
                        {...kpi}
                        value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        color="indigo"
                    />
                ))}
            </div>

            {/* --- SECTION 2: Middle Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Sales by Product (Recharts) */}
                <div className="bg-white dark:bg-[#2b2e36] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm col-span-1">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sales by Product</h3>
                        <p className="text-xs text-gray-500 mt-1 italic">Comparison of revenue generating items</p>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={SALES_BY_PRODUCT_DATA} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={32}>
                                    {SALES_BY_PRODUCT_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales by Salesperson (Recharts) */}
                <div className="bg-white dark:bg-[#2b2e36] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm col-span-1">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sales by Agent</h3>
                        <p className="text-xs text-gray-500 mt-1 italic">Individual contribution analysis</p>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={SALES_BY_PERSON_DATA} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="sales" radius={[0, 6, 6, 0]} barSize={24}>
                                    {SALES_BY_PERSON_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales by Region (ECharts) */}
                <div className="bg-white dark:bg-[#2b2e36] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm col-span-1">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Regional Split</h3>
                        <p className="text-xs text-gray-500 mt-1 italic">Geographic revenue distribution (%)</p>
                    </div>
                    <div className="h-[280px]">
                        <ReactECharts option={regionPieOption} style={{ height: '100%' }} />
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: Table & Companion Chart --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Data Table (1/2 Columns) */}
                <div className="lg:col-span-1 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    {/* Table Header / Toolbar */}
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                Operational Sales Log
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Detailed transactional review for auditing</p>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left h-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('id')}>Order ID</th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('date')}>Date</th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('customer')}>Customer</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b dark:border-gray-700 last:border-none flex-1">
                                        <td className="px-6 py-5 font-mono text-xs text-indigo-600 dark:text-indigo-400">{row.id}</td>
                                        <td className="px-6 py-5 text-gray-500 whitespace-nowrap">{row.date}</td>
                                        <td className="px-6 py-5 font-medium text-gray-900 dark:text-white whitespace-nowrap">{row.customer}</td>
                                        <td className="px-6 py-5 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(row.total, currency.code, currency.symbol)}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${row.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                row.status === 'Pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                                                    'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
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

                {/* Companion Chart: Hidden Story (1/2 Column) */}
                <div className="lg:col-span-1 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col h-full">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                            Hidden Story
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Flow analysis: Region → Agent → Fulfilment status</p>
                    </div>
                    <div className="flex-1 min-h-[400px]">
                        <ReactECharts option={flowChartOption} style={{ height: '100%', width: '100%' }} />
                    </div>
                    <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-normal">
                            <strong>Insight:</strong> Riyadh contributes the highest volume through Ahmed, but Abha shows the fastest "Shipped" turnaround per agent.
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
};
