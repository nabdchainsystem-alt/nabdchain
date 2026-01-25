import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart as ReactECharts } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, ArrowUpRight, ArrowDownLeft, ArrowsLeftRight, Activity, Warning, TrendUp, Clock } from 'phosphor-react';
import { StockMovementInfo } from './StockMovementInfo';
import { useAppContext } from '../../../contexts/AppContext';

// --- Mock Data: Charts ---
const IN_OUT_BY_CATEGORY = [
    { name: 'Electronics', in: 1200, out: 1100 },
    { name: 'Office', in: 800, out: 850 },
    { name: 'Furniture', in: 400, out: 350 },
    { name: 'Services', in: 0, out: 0 },
];

const MOVEMENT_TYPE_DISTRIBUTION = [
    { value: 45, name: 'Sales Orders' },
    { value: 30, name: 'Purchase Receipts' },
    { value: 15, name: 'Transfers' },
    { value: 5, name: 'Returns' },
    { value: 5, name: 'Adjustments' }
];

// New chart data: Daily Movement Trend
const DAILY_MOVEMENT_TREND = [
    { name: 'Mon', inbound: 650, outbound: 580 },
    { name: 'Tue', inbound: 720, outbound: 690 },
    { name: 'Wed', inbound: 800, outbound: 750 },
    { name: 'Thu', inbound: 680, outbound: 710 },
    { name: 'Fri', inbound: 890, outbound: 820 },
    { name: 'Sat', inbound: 450, outbound: 380 },
];

// New chart data: Movement by Warehouse
const MOVEMENT_BY_WAREHOUSE = [
    { value: 35, name: 'Main Hub' },
    { value: 28, name: 'North Branch' },
    { value: 22, name: 'South Branch' },
    { value: 15, name: 'Retail Store' }
];

// --- Mock Data: Table & Sankey ---
const MOVEMENT_LOG = [
    { id: 'MVT-001', sku: 'SKU-1001', type: 'Receipt', qty: 50, date: '2024-03-20', from: 'Supplier A', to: 'Main Whs' },
    { id: 'MVT-002', sku: 'SKU-1003', type: 'Shipment', qty: 200, date: '2024-03-19', from: 'South Br', to: 'Customer X' },
    { id: 'MVT-003', sku: 'SKU-1002', type: 'Transfer', qty: 10, date: '2024-03-19', from: 'Main Whs', to: 'North Br' },
    { id: 'MVT-004', sku: 'SKU-1005', type: 'Return', qty: 2, date: '2024-03-18', from: 'Customer Y', to: 'Retail Store' },
    { id: 'MVT-005', sku: 'SKU-1001', type: 'Shipment', qty: 15, date: '2024-03-18', from: 'Main Whs', to: 'Customer Z' },
];

// Sankey Data (Simulated Flow)
const SANKEY_NODES = [
    { name: 'Suppliers' }, { name: 'Main Whs' }, { name: 'North Br' }, { name: 'South Br' },
    { name: 'Retail Store' }, { name: 'Customers' }, { name: 'Returns' }
];

const SANKEY_LINKS = [
    { source: 'Suppliers', target: 'Main Whs', value: 100 },
    { source: 'Main Whs', target: 'North Br', value: 20 },
    { source: 'Main Whs', target: 'South Br', value: 30 },
    { source: 'Main Whs', target: 'Customers', value: 40 },
    { source: 'North Br', target: 'Customers', value: 15 },
    { source: 'South Br', target: 'Retail Store', value: 25 },
    { source: 'Retail Store', target: 'Customers', value: 20 },
    { source: 'Customers', target: 'Returns', value: 5 }
];

export const StockMovementDashboard: React.FC = () => {
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
    const TOP_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '1', label: t('stock_in_qty'), subtitle: t('received'), value: '4,500', change: '+12%', trend: 'up', icon: <ArrowDownLeft size={18} />, sparklineData: [3500, 3800, 4000, 4100, 4300, 4500], color: 'blue' },
        { id: '2', label: t('stock_out_qty'), subtitle: t('shipped'), value: '4,100', change: '+8%', trend: 'up', icon: <ArrowUpRight size={18} />, sparklineData: [3800, 3900, 3950, 4000, 4050, 4100], color: 'blue' },
        { id: '3', label: t('net_movement'), subtitle: t('balance'), value: '+400', change: '+20%', trend: 'up', icon: <ArrowsLeftRight size={18} />, sparklineData: [200, 250, 300, 350, 380, 400], color: 'blue' },
        { id: '4', label: t('movement_frequency'), subtitle: t('trans_per_day'), value: '145', change: '-5', trend: 'down', icon: <Activity size={18} />, sparklineData: [150, 155, 148, 146, 142, 145], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo<(KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[]>(() => [
        { id: '5', label: t('bottleneck_items'), subtitle: t('slow_processing'), value: '12', change: '+2', trend: 'down', icon: <Clock size={18} />, sparklineData: [10, 10, 11, 11, 12, 12], color: 'blue' },
        { id: '6', label: t('avg_daily_movement'), subtitle: t('unit_volume'), value: '850', change: '+50', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [750, 780, 800, 820, 840, 850], color: 'blue' },
        { id: '7', label: t('movement_volatility'), subtitle: t('std_dev'), value: t('high'), change: '', trend: 'neutral', icon: <Warning size={18} />, sparklineData: [10, 20, 15, 25, 10, 30], color: 'blue' },
        { id: '8', label: t('transfer_efficiency'), subtitle: t('on_time_pct'), value: '94.5%', change: '+1.2%', trend: 'up', icon: <Activity size={18} />, sparklineData: [91, 92, 92.5, 93, 93.8, 94.5], color: 'blue' },
    ], [t]);

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'Receipt': return t('receipt');
            case 'Shipment': return t('shipment');
            case 'Transfer': return t('transfer');
            case 'Return': return t('return');
            default: return type;
        }
    };


    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart - Movement Type Distribution
    const pieOption = useMemo<EChartsOption>(() => ({
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
            data: MOVEMENT_TYPE_DISTRIBUTION
        }]
    }), []);

    // Bar Chart - In vs Out per Category
    const inOutByCategoryOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, data: [t('stock_in'), t('stock_out')] },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 40 },
        xAxis: {
            type: 'category',
            data: IN_OUT_BY_CATEGORY.map(d => d.name),
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
                name: t('stock_in'),
                type: 'bar',
                data: IN_OUT_BY_CATEGORY.map(d => d.in),
                itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
                barWidth: 12,
            },
            {
                name: t('stock_out'),
                type: 'bar',
                data: IN_OUT_BY_CATEGORY.map(d => d.out),
                itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
                barWidth: 12,
            },
        ],
    }), [isRTL, t]);

    // Bar Chart - Daily Movement Trend
    const dailyMovementTrendOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, data: [t('inbound'), t('outbound')] },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 40 },
        xAxis: {
            type: 'category',
            data: DAILY_MOVEMENT_TREND.map(d => d.name),
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
                name: t('inbound'),
                type: 'bar',
                data: DAILY_MOVEMENT_TREND.map(d => d.inbound),
                itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
                barWidth: 12,
            },
            {
                name: t('outbound'),
                type: 'bar',
                data: DAILY_MOVEMENT_TREND.map(d => d.outbound),
                itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
                barWidth: 12,
            },
        ],
    }), [isRTL, t]);

    // Pie Chart - Movement by Warehouse
    const warehousePieOption = useMemo<EChartsOption>(() => ({
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
            data: MOVEMENT_BY_WAREHOUSE,
            color: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
        }]
    }), []);

    // Sankey Chart for Flow
    const sankeyOption = useMemo<EChartsOption>(() => ({
        title: { text: t('inventory_flow_path'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [{
            type: 'sankey',
            data: SANKEY_NODES,
            links: SANKEY_LINKS,
            emphasis: { focus: 'adjacency' },
            lineStyle: { color: 'gradient', curveness: 0.5 },
            label: { color: '#666', fontSize: 10 },
            left: 20, right: 20, top: 40, bottom: 20
        }]
    }), [t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <StockMovementInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ArrowsLeftRight size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div className="text-start">
                        <h1 className="text-2xl font-bold">{t('stock_movement_flow')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('in_out_tracking_bottleneck')}</p>
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

                {/* ECharts: In vs Out per Category */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('in_vs_out_category')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('in_vs_out_category')}</h3>
                            <p className="text-xs text-gray-400">{t('volume_comparison')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ReactECharts option={inOutByCategoryOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>
                )}

                {/* ECharts: Daily Movement Trend */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('daily_movement_trend')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('daily_movement_trend')}</h3>
                            <p className="text-xs text-gray-400">{t('weekly_in_out_volume')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ReactECharts option={dailyMovementTrendOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Movement Type Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('movement_types')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('movement_types')}</h3>
                                <p className="text-xs text-gray-400">{t('transaction_breakdown')}</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* ECharts: Movement by Warehouse */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('movement_by_warehouse')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('movement_by_warehouse')}</h3>
                                <p className="text-xs text-gray-400">{t('activity_distribution')}</p>
                            </div>
                            <ReactECharts option={warehousePieOption} style={{ height: '180px' }} />
                        </div>
                    )}
                </div>

                {/* Right: Side KPIs in 2x2 Grid */}
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

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <TableSkeleton rows={5} columns={5} title={t('recent_movements')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('recent_movements')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('sku')}</th>
                                        <th className="px-5 py-3 text-start">{t('type')}</th>
                                        <th className="px-5 py-3 text-end">{t('qty')}</th>
                                        <th className="px-5 py-3 text-start">{t('date')}</th>
                                        <th className="px-5 py-3 text-end">{t('route')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {MOVEMENT_LOG.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.sku}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${row.type === 'Receipt' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    row.type === 'Shipment' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}>
                                                    {getTypeLabel(row.type)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-end font-medium text-gray-900 dark:text-gray-100">{row.qty}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs text-start">{row.date}</td>
                                            <td className="px-5 py-3 text-end text-[10px] text-gray-500 dark:text-gray-400">
                                                {row.from} <span className="text-gray-300 rtl:rotate-180 inline-block">→</span> {row.to}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Sankey (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title={t('inventory_flow_path')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <ReactECharts option={sankeyOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
