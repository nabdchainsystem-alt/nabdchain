import React, { useState, useMemo } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Warning, Truck, Clock, Crosshair, Package, CalendarCheck, MapPin } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { SupplierDeliveryInfo } from './SupplierDeliveryInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

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

// Additional chart data
const DELIVERY_BY_CARRIER = [
    { name: 'FedEx', OnTime: 95, Late: 5 },
    { name: 'UPS', OnTime: 92, Late: 8 },
    { name: 'DHL', OnTime: 88, Late: 12 },
    { name: 'Ocean', OnTime: 85, Late: 15 },
];

const ISSUE_CATEGORIES = [
    { value: 35, name: 'Late Arrival' },
    { value: 25, name: 'Damaged Goods' },
    { value: 20, name: 'Wrong Item' },
    { value: 15, name: 'Missing Docs' },
    { value: 5, name: 'Other' }
];

const DELIVERY_MODE = [
    { value: 45, name: 'Ground' },
    { value: 30, name: 'Air' },
    { value: 25, name: 'Ocean' }
];

export const SupplierDeliveryDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [showInfo, setShowInfo] = useState(false);

    // Translated KPI Data
    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('on_time_delivery'), subtitle: t('global_average'), value: '94.2%', change: '+1.5%', trend: 'up' as const, icon: <CalendarCheck size={18} />, sparklineData: [90, 91, 92, 92, 93, 94.2], color: 'blue' },
        { id: '2', label: t('late_deliveries'), subtitle: t('past_30_days'), value: '12', change: '-4', trend: 'down' as const, icon: <Warning size={18} />, sparklineData: [18, 16, 15, 14, 13, 12], color: 'blue' },
        { id: '3', label: t('avg_lead_time'), subtitle: t('order_to_receipt'), value: '8.5 ' + t('days'), change: '-0.5', trend: 'up' as const, icon: <Clock size={18} />, sparklineData: [10, 9.5, 9.2, 9.0, 8.8, 8.5], color: 'blue' },
        { id: '4', label: t('delivery_accuracy'), subtitle: t('perfect_order_rate'), value: '98.8%', change: '+0.2%', trend: 'up' as const, icon: <Crosshair size={18} />, sparklineData: [98, 98.2, 98.3, 98.5, 98.6, 98.8], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('damaged_goods'), subtitle: t('returns_due_damage'), value: '1.2%', change: '-0.1%', trend: 'up' as const, icon: <Package size={18} />, sparklineData: [1.5, 1.4, 1.4, 1.3, 1.2, 1.2], color: 'blue' },
        { id: '6', label: t('expedited_ship'), subtitle: t('rush_orders'), value: '5%', change: '+1%', trend: 'down' as const, icon: <Truck size={18} />, sparklineData: [4, 4, 4, 5, 5, 5], color: 'blue' },
        { id: '7', label: t('location_risk'), subtitle: t('geo_logistics_issues'), value: t('low'), change: t('stable'), trend: 'neutral' as const, icon: <MapPin size={18} />, sparklineData: [2, 2, 2, 2, 2, 2], color: 'blue' },
        { id: '8', label: t('shipment_volume'), subtitle: t('monthly_avg'), value: '1,250', change: '+8%', trend: 'up' as const, icon: <Truck size={18} />, sparklineData: [1100, 1150, 1180, 1200, 1220, 1250], color: 'blue' },
    ], [t]);

    // Translated chart data
    const TRANSLATED_ISSUE_CATEGORIES = useMemo(() => [
        { value: 35, name: t('late_arrival') },
        { value: 25, name: t('damaged_goods') },
        { value: 20, name: t('wrong_item') },
        { value: 15, name: t('missing_docs') },
        { value: 5, name: t('other') }
    ], [t]);

    const TRANSLATED_DELIVERY_MODE = useMemo(() => [
        { value: 45, name: t('ground') },
        { value: 30, name: t('air') },
        { value: 25, name: t('ocean') }
    ], [t]);

    const TRANSLATED_MONTHS = useMemo(() => [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun')], [t]);

    // Loading state for smooth entrance animation
    const isLoading = useFirstMountLoading('supplier-delivery-dashboard', 1200);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Heatmap
    const heatmapOption: EChartsOption = {
        tooltip: { position: 'top' },
        grid: { height: '60%', top: '10%' },
        xAxis: { type: 'category', data: TRANSLATED_MONTHS, splitArea: { show: true } },
        yAxis: { type: 'category', data: SUPPLIER_NAMES, splitArea: { show: true } },
        visualMap: {
            min: 70, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
            inRange: { color: ['#fecaca', '#fde047', '#86efac', '#10b981'] } // Red to Green
        },
        series: [{
            name: t('on_time') + ' %',
            type: 'heatmap',
            data: HEATMAP_DATA,
            label: { show: true },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
    };

    // Issue Categories Pie
    const issuePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TRANSLATED_ISSUE_CATEGORIES,
            color: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280']
        }]
    };

    // Delivery Mode Pie
    const deliveryModePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TRANSLATED_DELIVERY_MODE,
            color: ['#10b981', '#3b82f6', '#8b5cf6']
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierDeliveryInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Truck size={28} className="text-teal-600 dark:text-teal-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('delivery_performance')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('logistics_fulfillment')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-teal-500" />
                        {t('about_dashboard')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* --- Row 1: Top 4 KPIs --- */}
                {TOP_KPIS.map((kpi, index) => (
                    <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                        <KPICard
                            {...kpi}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two bar charts side by side --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title={t('delivery_volume')} />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title={t('carrier_performance')} />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Recharts: On-Time vs Late (Stacked Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('delivery_volume')}</h3>
                                <p className="text-xs text-gray-400">{t('on_time_vs_late')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DELIVERY_PERFORMANCE} margin={{ top: 5, right: isRTL ? 10 : 30, left: isRTL ? 30 : 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} reversed={isRTL} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} orientation={isRTL ? 'right' : 'left'} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                        <Bar dataKey="OnTime" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={28} name={t('on_time')} animationDuration={1000} />
                                        <Bar dataKey="Late" stackId="a" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={28} name={t('late')} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recharts: Delivery by Carrier (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('carrier_performance')}</h3>
                                <p className="text-xs text-gray-400">{t('on_time_vs_late_carrier')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DELIVERY_BY_CARRIER} margin={{ top: 5, right: isRTL ? 10 : 30, left: isRTL ? 30 : 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} reversed={isRTL} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} orientation={isRTL ? 'right' : 'left'} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                        <Bar dataKey="OnTime" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={28} name={t('on_time')} animationDuration={1000} />
                                        <Bar dataKey="Late" stackId="a" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={28} name={t('late')} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* --- Row 3: Two pie charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <div className="grid grid-cols-2 gap-6">
                                <PieChartSkeleton title={t('issue_breakdown')} />
                                <PieChartSkeleton title={t('delivery_mode')} />
                            </div>
                        </div>
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard {...kpi} color="blue" loading={true} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Two pie charts in nested 2-col grid */}
                        <div className="col-span-2 grid grid-cols-2 gap-6">
                            {/* ECharts: Issue Categories (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('issue_breakdown')}</h3>
                                    <p className="text-xs text-gray-400">{t('by_category')}</p>
                                </div>
                                <MemoizedChart option={issuePieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Delivery Mode (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('delivery_mode')}</h3>
                                    <p className="text-xs text-gray-400">{t('by_transport_type')}</p>
                                </div>
                                <MemoizedChart option={deliveryModePieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        {/* 4 KPIs in 2x2 grid */}
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard
                                        {...kpi}
                                        color="blue"
                                        loading={isLoading}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* --- Row 4: Table + Companion Chart --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`p-5 border-b border-gray-100 dark:border-gray-700 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('performance_log')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" dir={dir}>
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('supplier')}</th>
                                        <th className="px-5 py-3 text-center">{t('orders')}</th>
                                        <th className="px-5 py-3 text-center">{t('on_time')}</th>
                                        <th className="px-5 py-3 text-center">{t('lead_time')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t('open_issues')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {DELIVERY_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 ${isRTL ? 'text-right' : ''}`}>{row.supplier}</td>
                                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.orders}</td>
                                            <td className={`px-5 py-3 text-center font-bold ${parseInt(row.onTime) >= 95 ? 'text-green-600' : parseInt(row.onTime) >= 85 ? 'text-amber-500' : 'text-red-500'}`}>
                                                {row.onTime}
                                            </td>
                                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.leadTime}</td>
                                            <td className={`px-5 py-3 text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'text-left' : 'text-right'}`}>{row.issues}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Heatmap (2 cols) */}
                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('monthly_consistency')} />
                    </div>
                ) : (
                    <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('monthly_consistency')}</h3>
                            <p className="text-xs text-gray-400">{t('on_time_performance_heatmap')}</p>
                        </div>
                        <MemoizedChart option={heatmapOption} style={{ height: '300px', width: '100%', minHeight: 100, minWidth: 100 }} />
                    </div>
                )}

            </div>
        </div>
    );
};
