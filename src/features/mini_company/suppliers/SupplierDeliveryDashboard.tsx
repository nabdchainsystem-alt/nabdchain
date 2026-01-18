import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ArrowsOut, Info, TrendUp, Warning, Truck, Clock, Crosshair, Package, CalendarCheck, MapPin } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { SupplierDeliveryInfo } from './SupplierDeliveryInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'On-Time Delivery %', subtitle: 'Global Average', value: '94.2%', change: '+1.5%', trend: 'up', icon: <CalendarCheck size={18} />, sparklineData: [90, 91, 92, 92, 93, 94.2], color: 'teal' },
    { id: '2', label: 'Late Deliveries', subtitle: 'Past 30 Days', value: '12', change: '-4', trend: 'down', icon: <Warning size={18} />, sparklineData: [18, 16, 15, 14, 13, 12], color: 'red' },
    { id: '3', label: 'Avg Lead Time', subtitle: 'Order to Receipt', value: '8.5 days', change: '-0.5', trend: 'up', icon: <Clock size={18} />, sparklineData: [10, 9.5, 9.2, 9.0, 8.8, 8.5], color: 'indigo' },
    { id: '4', label: 'Delivery Accuracy', subtitle: 'Perfect Order Rate', value: '98.8%', change: '+0.2%', trend: 'up', icon: <Crosshair size={18} />, sparklineData: [98, 98.2, 98.3, 98.5, 98.6, 98.8], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Damaged Goods', subtitle: 'Returns due to damage', value: '1.2%', change: '-0.1%', trend: 'up', icon: <Package size={18} />, sparklineData: [1.5, 1.4, 1.4, 1.3, 1.2, 1.2], color: 'orange' },
    { id: '6', label: 'Expedited Ship', subtitle: 'Rush Orders', value: '5%', change: '+1%', trend: 'down', icon: <Truck size={18} />, sparklineData: [4, 4, 4, 5, 5, 5], color: 'purple' },
    { id: '7', label: 'Location Risk', subtitle: 'Geo-Logistics Issues', value: 'Low', change: 'Stable', trend: 'neutral', icon: <MapPin size={18} />, sparklineData: [2, 2, 2, 2, 2, 2], color: 'slate' },
];

// --- Mock Data: Charts ---
const DELIVERY_PERFORMANCE = [
    { name: 'Acme Mfg', OnTime: 45, Late: 2 },
    { name: 'Globex', OnTime: 30, Late: 5 },
    { name: 'Soylent', OnTime: 28, Late: 1 },
    { name: 'Initech', OnTime: 20, Late: 0 },
    { name: 'Umbrella', OnTime: 15, Late: 4 },
];

const LEAD_TIME_TREND = [
    { month: 'Jan', LeadTime: 12 },
    { month: 'Feb', LeadTime: 11.5 },
    { month: 'Mar', LeadTime: 10 },
    { month: 'Apr', LeadTime: 9.5 },
    { month: 'May', LeadTime: 9 },
    { month: 'Jun', LeadTime: 8.5 },
];

// Delivery Table
const DELIVERY_TABLE = [
    { supplier: 'Acme Mfg', orders: 47, onTime: '96%', leadTime: '7 days', issues: 'None' },
    { supplier: 'Globex Corp', orders: 35, onTime: '85%', leadTime: '12 days', issues: 'Late Arrival' },
    { supplier: 'Soylent Corp', orders: 29, onTime: '97%', leadTime: '6 days', issues: 'None' },
    { supplier: 'Initech', orders: 20, onTime: '100%', leadTime: '5 days', issues: 'None' },
    { supplier: 'Umbrella Corp', orders: 19, onTime: '79%', leadTime: '14 days', issues: 'Damaged Goods' },
];

// Heatmap Data (Month vs Supplier -> On-Time %)
// X: Months, Y: Suppliers
const HEATMAP_DATA = [
    // Month, SupplierIndex, Value (0-100)
    [0, 0, 98], [1, 0, 97], [2, 0, 99], [3, 0, 95], [4, 0, 96], [5, 0, 98],
    [0, 1, 85], [1, 1, 82], [2, 1, 88], [3, 1, 80], [4, 1, 84], [5, 1, 85],
    [0, 2, 92], [1, 2, 94], [2, 2, 95], [3, 2, 96], [4, 2, 97], [5, 2, 98],
    [0, 3, 100], [1, 3, 100], [2, 3, 99], [3, 3, 98], [4, 3, 100], [5, 3, 100],
    [0, 4, 75], [1, 4, 78], [2, 4, 72], [3, 4, 70], [4, 4, 75], [5, 4, 79]
];
const SUPPLIER_NAMES = ['Acme', 'Globex', 'Soylent', 'Initech', 'Umbrella'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const SupplierDeliveryDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Heatmap
    const heatmapOption: EChartsOption = {
        tooltip: { position: 'top' },
        grid: { height: '60%', top: '10%' },
        xAxis: { type: 'category', data: MONTHS, splitArea: { show: true } },
        yAxis: { type: 'category', data: SUPPLIER_NAMES, splitArea: { show: true } },
        visualMap: {
            min: 70, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
            inRange: { color: ['#fecaca', '#fde047', '#86efac', '#10b981'] } // Red to Green
        },
        series: [{
            name: 'On-Time %',
            type: 'heatmap',
            data: HEATMAP_DATA,
            label: { show: true },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
    };

    // Gauge Chart (Reliability Index)
    const gaugeOption: EChartsOption = {
        series: [{
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 100,
            splitNumber: 5,
            itemStyle: { color: '#14b8a6' }, // Teal
            progress: { show: true, width: 10 },
            pointer: { icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', length: '12%', width: 10, offsetCenter: [0, '-60%'], itemStyle: { color: 'auto' } },
            axisLine: { lineStyle: { width: 10, color: [[0.3, '#f87171'], [0.7, '#facc15'], [1, '#4ade80']] } },
            axisTick: { distance: -10, length: 8, lineStyle: { color: '#fff', width: 2 } },
            splitLine: { distance: -10, length: 15, lineStyle: { color: '#fff', width: 2 } },
            axisLabel: { color: 'auto', distance: 15, fontSize: 10 },
            detail: { valueAnimation: true, formatter: '{value}', color: 'auto', fontSize: 20, offsetCenter: [0, '-20%'] },
            data: [{ value: 92, name: 'Reliability' }]
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-[#1a1d24] min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierDeliveryInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Truck size={28} className="text-teal-600 dark:text-teal-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">Delivery Performance</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Logistics & Fulfillment</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors bg-white dark:bg-[#2b2e36] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title="Full Screen"
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors bg-white dark:bg-[#2b2e36] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-teal-500" />
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

                    {/* Recharts: On-Time vs Late (Stacked Bar) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Delivery Volume</h3>
                            <p className="text-xs text-gray-400">On-Time vs Late</p>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={DELIVERY_PERFORMANCE} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Bar dataKey="OnTime" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={28} name="On-Time" />
                                    <Bar dataKey="Late" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={28} name="Late" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recharts: Lead Time Trend (Line) */}
                    <div className="bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Lead Time Trend</h3>
                            <p className="text-xs text-gray-400">Avg Days to Receipt</p>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={LEAD_TIME_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="month" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="LeadTime" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Right Column: Side KPIs (1 col) */}
                <div className="col-span-1 flex flex-col gap-6">
                    {SIDE_KPIS.map((kpi) => (
                        <div key={kpi.id} className="flex-1">
                            <KPICard
                                {...kpi}
                                color={kpi.color as any || 'blue'}
                                className="h-full"
                            />
                        </div>
                    ))}
                    {/* Gauge Chart in side column for variety */}
                    <div className="flex-1 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Reliability Index</h4>
                        <ReactECharts option={gaugeOption} style={{ height: '140px' }} />
                    </div>
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Performance Log</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Supplier</th>
                                    <th className="px-5 py-3 text-center">Orders</th>
                                    <th className="px-5 py-3 text-center">On-Time</th>
                                    <th className="px-5 py-3 text-center">Lead Time</th>
                                    <th className="px-5 py-3 text-right">Issues</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {DELIVERY_TABLE.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{row.supplier}</td>
                                        <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.orders}</td>
                                        <td className={`px-5 py-3 text-center font-bold ${parseInt(row.onTime) >= 95 ? 'text-green-600' : parseInt(row.onTime) >= 85 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {row.onTime}
                                        </td>
                                        <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.leadTime}</td>
                                        <td className="px-5 py-3 text-right text-xs text-gray-500 dark:text-gray-400">{row.issues}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Companion Chart: Heatmap (2 cols) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#2b2e36] p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Monthly Consistency</h3>
                        <p className="text-xs text-gray-400">On-Time Performance Heatmap</p>
                    </div>
                    <ReactECharts option={heatmapOption} style={{ height: '300px', width: '100%' }} />
                </div>

            </div>
        </div>
    );
};
