import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ArrowsOut, Info, TrendUp, Warning, Money, ChartLineUp, Wallet, Coins, Percent, TreeStructure } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Legend } from 'recharts';
import { SupplierCostInfo } from './SupplierCostInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Total Spend', subtitle: 'YTD Actuals', value: '$4.2M', change: '+12%', trend: 'up', icon: <Money size={18} />, sparklineData: [3.5, 3.6, 3.8, 3.9, 4.0, 4.2], color: 'blue' },
    { id: '2', label: 'Avg Spend / Supplier', subtitle: 'Vendor Concentration', value: '$48k', change: '+5%', trend: 'up', icon: <Wallet size={18} />, sparklineData: [42, 43, 45, 46, 47, 48], color: 'blue' },
    { id: '3', label: 'Cost Variance %', subtitle: 'Actual vs Contract', value: '2.4%', change: '-0.5%', trend: 'down', icon: <Percent size={18} />, sparklineData: [3.0, 2.9, 2.8, 2.6, 2.5, 2.4], color: 'blue' },
    { id: '4', label: 'Savings Achieved', subtitle: 'Cost Avoidance', value: '$120k', change: '+20%', trend: 'up', icon: <Coins size={18} />, sparklineData: [80, 90, 95, 100, 110, 120], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Tail Spend', subtitle: '% of Total', value: '15%', change: '-2%', trend: 'down', icon: <ChartLineUp size={18} />, sparklineData: [18, 17, 17, 16, 15, 15], color: 'blue' },
    { id: '6', label: 'Open PO Value', subtitle: 'Committed Cost', value: '$850k', change: 'Stable', trend: 'neutral', icon: <TreeStructure size={18} />, sparklineData: [850, 850, 850, 850, 850, 850], color: 'blue' },
    { id: '7', label: 'Sourcing Savings', subtitle: 'Projected', value: '$50k', change: '+5%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [40, 42, 45, 46, 48, 50], color: 'blue' },
    { id: '8', label: 'Budget Utilization', subtitle: '% of Allocated', value: '78%', change: '+3%', trend: 'up', icon: <Percent size={18} />, sparklineData: [70, 72, 74, 75, 76, 78], color: 'blue' },
];

// --- Mock Data: Charts ---
const SPEND_BY_SUPPLIER = [
    { name: 'Acme Mfg', Spend: 1200000 },
    { name: 'Globex', Spend: 850000 },
    { name: 'Soylent', Spend: 650000 },
    { name: 'Initech', Spend: 400000 },
    { name: 'Umbrella', Spend: 350000 },
];

const MONTHLY_SPEND_TREND = [
    { month: 'Jan', Contract: 300, Actual: 310 },
    { month: 'Feb', Contract: 320, Actual: 325 },
    { month: 'Mar', Contract: 310, Actual: 340 }, // Spike
    { month: 'Apr', Contract: 330, Actual: 320 }, // Savings
    { month: 'May', Contract: 340, Actual: 345 },
    { month: 'Jun', Contract: 350, Actual: 360 },
];

const COST_VARIANCE_TREND = [
    { month: 'Jan', Variance: 3.3 },
    { month: 'Feb', Variance: 1.5 },
    { month: 'Mar', Variance: 9.6 },
    { month: 'Apr', Variance: -3.0 },
    { month: 'May', Variance: 1.4 },
    { month: 'Jun', Variance: 2.8 },
];

const CATEGORY_SPEND_PIE = [
    { value: 1500000, name: 'Raw Materials' },
    { value: 900000, name: 'Logistics' },
    { value: 800000, name: 'Services' },
    { value: 600000, name: 'Packaging' },
    { value: 400000, name: 'IT/SaaS' }
];


// Cost Table
const COST_TABLE = [
    { supplier: 'Acme Mfg', contract: '$1.1M', actual: '$1.2M', variance: '+9%', savings: '$0' },
    { supplier: 'Globex Corp', contract: '$900k', actual: '$850k', variance: '-5.5%', savings: '$50k' },
    { supplier: 'Soylent Corp', contract: '$600k', actual: '$650k', variance: '+8.3%', savings: '$0' },
    { supplier: 'Initech', contract: '$420k', actual: '$400k', variance: '-4.7%', savings: '$20k' },
    { supplier: 'Umbrella Corp', contract: '$350k', actual: '$350k', variance: '0%', savings: '$0' },
];

// Waterfall Data: [Category, Value, Type]
// Types: 'start', 'increase', 'decrease', 'total'
const WATERFALL_DATA = [
    { name: 'Contract Base', value: 4000, type: 'total' },
    { name: 'Price Hike', value: 300, type: 'increase' }, // +300
    { name: 'Rush Fees', value: 150, type: 'increase' },  // +150
    { name: 'Vol Rebates', value: -100, type: 'decrease' },// -100
    { name: 'Neg Savings', value: -150, type: 'decrease' },// -150
    { name: 'Actual Cost', value: 4200, type: 'total' }
];


export const SupplierCostDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Spend Tree Map
    const treemapOption: EChartsOption = {
        tooltip: { formatter: '{b}: ${c}' },
        series: [{
            type: 'treemap',
            data: [
                {
                    name: 'Raw Materials', value: 1500000, children: [
                        { name: 'Steel', value: 800000 },
                        { name: 'Plastics', value: 700000 }
                    ]
                },
                {
                    name: 'Logistics', value: 900000, children: [
                        { name: 'Air Freight', value: 600000 },
                        { name: 'Ocean', value: 300000 }
                    ]
                },
                { name: 'Services', value: 800000 },
                { name: 'Packaging', value: 600000 },
                { name: 'IT', value: 400000 }
            ],
            breadcrumb: { show: false },
            label: { show: true, formatter: '{b}' },
            itemStyle: { borderColor: '#fff' }
        }]
    };

    // Waterfall Chart
    const waterfallOption: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
                const tar = params[1];
                return tar.name + '<br/>' + tar.seriesName + ' : $' + tar.value;
            }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', splitLine: { show: false }, data: WATERFALL_DATA.map(d => d.name) },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'Placeholder',
                type: 'bar',
                stack: 'Total',
                itemStyle: { borderColor: 'transparent', color: 'transparent' },
                emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
                data: [0, 4000, 4300, 4200, 4050, 0] // Pre-calculated invisible base
            },
            {
                name: 'Cost Impact',
                type: 'bar',
                stack: 'Total',
                label: { show: true, position: 'top' },
                data: [
                    { value: 4000, itemStyle: { color: '#3b82f6' } }, // Base
                    { value: 300, itemStyle: { color: '#93c5fd' } },  // + Hike (Light Blue)
                    { value: 150, itemStyle: { color: '#93c5fd' } },  // + Rush (Light Blue)
                    { value: 100, itemStyle: { color: '#bfdbfe' } },  // - Rebate (Lighter Blue)
                    { value: 150, itemStyle: { color: '#bfdbfe' } },  // - Savings (Lighter Blue)
                    { value: 4200, itemStyle: { color: '#3b82f6' } }  // Final
                ]
            }
        ]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierCostInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Money size={28} className="text-emerald-600 dark:text-emerald-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Cost & Spend Control</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Financial Operations</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-emerald-500" />
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

                    {/* Recharts: Monthly Spend Trend (Area) */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend Trend</h3>
                            <p className="text-xs text-gray-400">Monthly Run Rate</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={MONTHLY_SPEND_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="month" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="Actual" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Actual" />
                                    <Area type="monotone" dataKey="Contract" stackId="2" stroke="#9ca3af" fill="none" strokeDasharray="5 5" name="Budget" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ECharts: Spend Tree Map */}
                    <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend Concentration</h3>
                            <p className="text-xs text-gray-400">By Category</p>
                        </div>
                        <ReactECharts option={treemapOption} style={{ height: '200px' }} />
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
                    {/* Variance Line Chart */}
                    <div className="flex-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Cost Variance %</h4>
                        <div className="h-[120px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={COST_VARIANCE_TREND}>
                                    <Line type="monotone" dataKey="Variance" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                    <CartesianGrid stroke="#f3f4f6" vertical={false} />
                                    <YAxis hide domain={[-5, 10]} />
                                    <Tooltip />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Spend Analysis</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Supplier</th>
                                    <th className="px-5 py-3 text-right">Contract</th>
                                    <th className="px-5 py-3 text-right">Actual</th>
                                    <th className="px-5 py-3 text-center">Variance</th>
                                    <th className="px-5 py-3 text-right">Savings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {COST_TABLE.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.supplier}</td>
                                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{row.contract}</td>
                                        <td className="px-5 py-3 text-right font-medium text-gray-800 dark:text-gray-200">{row.actual}</td>
                                        <td className={`px-5 py-3 text-center font-bold ${row.variance.includes('-') ? 'text-green-600' : 'text-red-500'}`}>
                                            {row.variance}
                                        </td>
                                        <td className="px-5 py-3 text-right text-green-600 font-medium">{row.savings}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Waterfall (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Cost Bridge</h3>
                        <p className="text-xs text-gray-400">Budget to Actual Walk</p>
                    </div>
                    <ReactECharts option={waterfallOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
