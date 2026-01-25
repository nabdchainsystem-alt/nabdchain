import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, Buildings, Cube, Clock, Lightning, Warning, ChartBar, CheckCircle } from 'phosphor-react';
import { WarehousePerformanceInfo } from './WarehousePerformanceInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- Mock Data: Charts ---
const WAREHOUSE_PERFORMANCE = [
    { name: 'Main Hub', picking: 95, shipping: 90, storage: 85 },
    { name: 'North Br', picking: 88, shipping: 92, storage: 70 },
    { name: 'South Br', picking: 82, shipping: 85, storage: 60 },
    { name: 'Retail', picking: 98, shipping: 95, storage: 90 },
];

const CAPACITY_USAGE = [
    { value: 78, name: 'Used' },
    { value: 22, name: 'Free' }
];

// New chart data: Daily Throughput
const DAILY_THROUGHPUT = [
    { name: 'Mon', value: 420 },
    { name: 'Tue', value: 485 },
    { name: 'Wed', value: 510 },
    { name: 'Thu', value: 475 },
    { name: 'Fri', value: 550 },
    { name: 'Sat', value: 320 },
];

// New chart data: Order Status
const ORDER_STATUS = [
    { value: 45, name: 'Completed' },
    { value: 30, name: 'In Progress' },
    { value: 15, name: 'Pending' },
    { value: 10, name: 'On Hold' }
];

// --- Mock Data: Table & Grid ---
const WAREHOUSE_LIST = [
    { id: 'WH-001', name: 'Main Hub', capacity: '5000 pallets', usage: '4250 (85%)', orders: 1250, score: 'A' },
    { id: 'WH-002', name: 'North Branch', capacity: '2000 pallets', usage: '1400 (70%)', orders: 450, score: 'B+' },
    { id: 'WH-003', name: 'South Branch', usage: '900 (60%)', orders: 320, score: 'B', capacity: '1500 pallets' },
    { id: 'WH-STR', name: 'Retail Backroom', capacity: '500 pallets', usage: '450 (90%)', orders: 850, score: 'A+' },
];

// Grid Data (Simulated Heatmap)
const UTILIZATION_GRID = [
    [0, 0, 8], [0, 1, 9], [0, 2, 4], [0, 3, 2],
    [1, 0, 7], [1, 1, 9], [1, 2, 5], [1, 3, 3],
    [2, 0, 8], [2, 1, 8], [2, 2, 1], [2, 3, 4],
    [3, 0, 6], [3, 1, 7], [3, 2, 3], [3, 3, 2]
];

export const WarehousePerformanceDashboard: React.FC = () => {
    const { currency, t, dir } = useAppContext();
    const isRTL = dir === 'rtl';
    const [showInfo, setShowInfo] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const isLoading = useLoadingAnimation();

    // --- KPI Data ---
    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('warehouses_count'), subtitle: t('active_facilities'), value: '4', change: '0', trend: 'neutral' as const, icon: <Buildings size={18} />, sparklineData: [4, 4, 4, 4, 4, 4], color: 'blue' },
        { id: '2', label: t('total_utilization'), subtitle: t('capacity_used'), value: '78%', change: '+3%', trend: 'up' as const, icon: <Cube size={18} />, sparklineData: [70, 72, 75, 76, 77, 78], color: 'blue' },
        { id: '3', label: t('picking_time_avg'), subtitle: t('per_order'), value: '14m', change: '-2m', trend: 'up' as const, icon: <Clock size={18} />, sparklineData: [18, 17, 16, 15, 15, 14], color: 'blue' },
        { id: '4', label: t('fulfillment_speed'), subtitle: t('orders_per_hour'), value: '45', change: '+5', trend: 'up' as const, icon: <Lightning size={18} />, sparklineData: [35, 38, 40, 42, 44, 45], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('storage_efficiency'), subtitle: t('cubic_usage'), value: '88%', change: '+2%', trend: 'up' as const, icon: <ChartBar size={18} />, sparklineData: [84, 85, 86, 87, 88, 88], color: 'blue' },
        { id: '6', label: t('error_rate'), subtitle: t('pick_pack'), value: '0.8%', change: '-0.1%', trend: 'up' as const, icon: <Warning size={18} />, sparklineData: [1.2, 1.1, 1.0, 0.9, 0.9, 0.8], color: 'blue' },
        { id: '7', label: t('capacity_alerts'), subtitle: t('near_full'), value: '1', change: '0', trend: 'down' as const, icon: <Warning size={18} />, sparklineData: [2, 2, 1, 1, 1, 1], color: 'blue' },
        { id: '8', label: t('on_time_ship'), subtitle: t('fulfillment_pct'), value: '96.5%', change: '+1.2%', trend: 'up' as const, icon: <CheckCircle size={18} />, sparklineData: [93, 94, 94.5, 95, 95.8, 96.5], color: 'blue' },
    ], [t]);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Bar Chart - Warehouse Performance (grouped)
    const warehousePerformanceOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, data: [t('picking'), t('shipping'), t('storage')] },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 40 },
        xAxis: {
            type: 'category',
            data: WAREHOUSE_PERFORMANCE.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
        },
        series: [
            {
                name: t('picking'),
                type: 'bar',
                data: WAREHOUSE_PERFORMANCE.map(d => d.picking),
                itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
                barWidth: 10,
            },
            {
                name: t('shipping'),
                type: 'bar',
                data: WAREHOUSE_PERFORMANCE.map(d => d.shipping),
                itemStyle: { color: '#60a5fa', borderRadius: [4, 4, 0, 0] },
                barWidth: 10,
            },
            {
                name: t('storage'),
                type: 'bar',
                data: WAREHOUSE_PERFORMANCE.map(d => d.storage),
                itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
                barWidth: 10,
            },
        ],
    }), [isRTL, t]);

    // Bar Chart - Daily Throughput
    const dailyThroughputOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: DAILY_THROUGHPUT.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
        },
        series: [{
            type: 'bar',
            data: DAILY_THROUGHPUT.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 24,
        }],
    }), [isRTL]);

    // Pie Chart - Capacity Usage
    const pieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: CAPACITY_USAGE,
            color: ['#8b5cf6', '#e5e7eb']
        }]
    }), []);

    // Pie Chart - Order Status
    const orderStatusPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: ORDER_STATUS,
            color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
        }]
    }), []);

    // Heatmap (Grid)
    const gridOption: EChartsOption = useMemo(() => ({
        title: { text: 'Zone Efficiency', left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { position: 'top' },
        grid: { height: '70%', top: '15%' },
        xAxis: { type: 'category', data: ['Zone A', 'Zone B', 'Zone C', 'Zone D'], splitArea: { show: true } },
        yAxis: { type: 'category', data: ['Aisle 1', 'Aisle 2', 'Aisle 3', 'Aisle 4'], splitArea: { show: true } },
        visualMap: {
            min: 0, max: 10, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', itemWidth: 10, itemHeight: 10,
            inRange: { color: ['#f3e8ff', '#8b5cf6', '#4c1d95'] } // Violet gradient
        },
        series: [{
            name: 'Usage Score',
            type: 'heatmap',
            data: UTILIZATION_GRID,
            label: { show: true },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
    }), []);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <WarehousePerformanceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Buildings size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('warehouse_perf')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('warehouse_perf_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={isFullScreen ? t('exit_full_screen') : t('full_screen')}
                    >
                        {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-blue-500" />
                        {t('about_dashboard')}
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
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* ECharts: Performance per Warehouse */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Facility Throughput" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('facility_throughput')}</h3>
                            <p className="text-xs text-gray-400">{t('activity_scores')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <MemoizedChart option={warehousePerformanceOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>
                )}

                {/* ECharts: Daily Throughput */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Daily Throughput" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('daily_throughput')}</h3>
                            <p className="text-xs text-gray-400">{t('orders_processed_per_day')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <MemoizedChart option={dailyThroughputOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Pie Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Pie Charts in nested 2-col grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Capacity Usage */}
                    {isLoading ? (
                        <div className="col-span-1">
                            <PieChartSkeleton title="Total Capacity" />
                        </div>
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('total_capacity')}</h3>
                                <p className="text-xs text-gray-400">{t('space_utilization')}</p>
                            </div>
                            <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Order Status */}
                    {isLoading ? (
                        <div className="col-span-1">
                            <PieChartSkeleton title="Order Status" />
                        </div>
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('order_status')}</h3>
                                <p className="text-xs text-gray-400">{t('fulfillment_breakdown')}</p>
                            </div>
                            <MemoizedChart option={orderStatusPieOption} style={{ height: '180px' }} />
                        </div>
                    )}
                </div>

                {/* Right: 4 Side KPIs in 2x2 Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                color="blue"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 4: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={4} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Facility Metrics</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">Warehouse</th>
                                        <th className="px-5 py-3 text-start">Capacity</th>
                                        <th className="px-5 py-3 text-start">Usage</th>
                                        <th className="px-5 py-3 text-end">Orders</th>
                                        <th className="px-5 py-3 text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {WAREHOUSE_LIST.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.name}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{row.capacity}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{row.usage}</td>
                                            <td className="px-5 py-3 text-end text-gray-900 dark:text-gray-100">{row.orders}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.score.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {row.score}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Grid (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title="Zone Efficiency" />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <MemoizedChart option={gridOption} style={{ height: '300px', width: '100%', minHeight: 100, minWidth: 100 }} />
                    </div>
                )}

            </div>
        </div>
    );
};
