import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ShoppingCart, TrendUp, Users, Info, ArrowsOut, ArrowsIn, CurrencyDollar, CalendarCheck, ChartPieSlice, Hash, Globe, Activity, Warning } from 'phosphor-react';
import { PurchaseOverviewInfo } from './PurchaseOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS_SEQUENCE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// KPI type definition
type KPIData = KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string };

// --- Mock Data: Charts ---
const SPEND_BY_SUPPLIER = [
    { name: 'TechCorp', value: 45000 },
    { name: 'OfficeMax', value: 28000 },
    { name: 'LogisticsInc', value: 22000 },
    { name: 'SoftSol', value: 18000 },
    { name: 'BuildIt', value: 15000 },
];

const SPEND_BY_CATEGORY = [
    { name: 'IT High', value: 55000 },
    { name: 'Operations', value: 35000 },
    { name: 'Marketing', value: 25000 },
    { name: 'Services', value: 13000 },
];

const SPEND_DISTRIBUTION = [
    { name: 'Hardware', value: 40 },
    { name: 'Software', value: 30 },
    { name: 'Services', value: 20 },
    { name: 'Supplies', value: 10 },
];

const SUPPLIER_SHARE = [
    { name: 'TechCorp', value: 35 },
    { name: 'Others', value: 65 },
];

// --- Mock Data: Table ---
const RECENT_ORDERS = [
    { id: 'PO-2024-001', supplier: 'TechCorp Solutions', category: 'IT Hardware', amount: 12500, date: '2024-03-15', status: 'Approved' },
    { id: 'PO-2024-002', supplier: 'OfficeMax Pro', category: 'Office Supplies', amount: 3200, date: '2024-03-14', status: 'Pending' },
    { id: 'PO-2024-003', supplier: 'LogisticsInc', category: 'Services', amount: 8400, date: '2024-03-12', status: 'Approved' },
    { id: 'PO-2024-004', supplier: 'SoftSol Global', category: 'Software', amount: 24000, date: '2024-03-10', status: 'Processing' },
    { id: 'PO-2024-005', supplier: 'BuildIt Now', category: 'Maintenance', amount: 1500, date: '2024-03-08', status: 'Approved' },
];

export const PurchaseOverviewDashboard: React.FC = () => {
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
    const TOP_KPIS = useMemo<KPIData[]>(() => [
        { id: '1', label: t('total_purchase_spend'), subtitle: t('ytd_approved'), value: '0', rawValue: 1245000, isCurrency: true, change: '+8.5%', trend: 'up', icon: <CurrencyDollar size={18} />, sparklineData: [90, 95, 100, 98, 105, 110, 120], color: 'blue' },
        { id: '2', label: t('total_purchase_orders'), subtitle: t('all_time'), value: '145', change: '+12', trend: 'up', icon: <ShoppingCart size={18} />, sparklineData: [120, 125, 130, 128, 135, 140, 145], color: 'blue' },
        { id: '3', label: t('active_suppliers'), subtitle: t('engaged_this_month'), value: '24', change: '+2', trend: 'up', icon: <Users size={18} />, sparklineData: [20, 21, 21, 22, 22, 23, 24], color: 'blue' },
        { id: '4', label: t('avg_purchase_value'), subtitle: t('per_order'), value: '0', rawValue: 8586, isCurrency: true, change: '-1.2%', trend: 'down', icon: <Hash size={18} />, sparklineData: [8.8, 8.7, 8.6, 8.9, 8.7, 8.6, 8.5], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo<KPIData[]>(() => [
        { id: '5', label: t('monthly_spend_change'), subtitle: t('mom_variance'), value: '+5.4%', change: '+1.1%', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [3, 4, 3.5, 4.2, 4.8, 5.0, 5.4], color: 'blue' },
        { id: '6', label: t('top_supplier_spend'), subtitle: t('concentration_risk'), value: '18%', change: '-2%', trend: 'down', icon: <ChartPieSlice size={18} />, sparklineData: [22, 21, 20, 19.5, 19, 18.5, 18], color: 'blue' },
        { id: '7', label: t('purchase_frequency'), subtitle: t('days_between_orders'), value: '3.2d', change: '-0.5d', trend: 'up', icon: <Activity size={18} />, sparklineData: [4, 3.8, 3.6, 3.5, 3.4, 3.3, 3.2], color: 'blue' },
        { id: '8', label: t('unplanned_purchase_rate'), subtitle: t('outside_approved_plan'), value: '12%', change: '-3%', trend: 'up', icon: <Warning size={18} />, sparklineData: [18, 16, 15, 14, 13, 12.5, 12], color: 'blue' },
    ], [t]);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---
    const pieOption1 = useMemo<EChartsOption>(() => ({
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
            data: SPEND_DISTRIBUTION.map((d, i) => ({ ...d, itemStyle: { color: COLORS_SEQUENCE[i % COLORS_SEQUENCE.length] } }))
        }]
    }), []);

    const pieOption2 = useMemo<EChartsOption>(() => ({
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
            data: SUPPLIER_SHARE.map((d, i) => ({ ...d, itemStyle: { color: COLORS_SEQUENCE[(i + 2) % COLORS_SEQUENCE.length] } }))
        }]
    }), []);

    // Marimekko Chart Data - shows spend concentration by category and supplier distribution
    const marimekkoOption = useMemo<EChartsOption>(() => {
        const merimekkoData = [
            { category: 'IT Hardware', width: 35, segments: [{ name: 'TechCorp', value: 60 }, { name: 'Others', value: 40 }] },
            { category: 'Operations', width: 28, segments: [{ name: 'LogisticsInc', value: 45 }, { name: 'Others', value: 55 }] },
            { category: 'Marketing', width: 20, segments: [{ name: 'OfficeMax', value: 35 }, { name: 'Others', value: 65 }] },
            { category: 'Services', width: 17, segments: [{ name: 'SoftSol', value: 50 }, { name: 'Others', value: 50 }] },
        ];

        // Calculate x positions for Marimekko bars
        const merimekkoSeries: any[] = [];
        const xAxisData: string[] = [];

        merimekkoData.forEach((cat) => {
            xAxisData.push(cat.category);
            cat.segments.forEach((seg, segIndex) => {
                if (!merimekkoSeries[segIndex]) {
                    merimekkoSeries[segIndex] = {
                        name: segIndex === 0 ? 'Primary Supplier' : 'Other Suppliers',
                        type: 'bar',
                        stack: 'total',
                        barWidth: '90%',
                        emphasis: { focus: 'series' },
                        itemStyle: {
                            color: segIndex === 0 ? '#3b82f6' : '#e5e7eb'
                        },
                        data: []
                    };
                }
                merimekkoSeries[segIndex].data.push(seg.value);
            });
        });

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                    const cat = merimekkoData[params[0].dataIndex];
                    let result = `<strong>${cat.category}</strong> (${cat.width}% of total)<br/>`;
                    params.forEach((p: any) => {
                        result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`;
                    });
                    return result;
                }
            },
            legend: { bottom: 5, left: 'center', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 10 } },
            grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
            xAxis: {
                type: 'category',
                data: xAxisData,
                axisLabel: { fontSize: 10, color: '#6b7280', interval: 0 },
                axisLine: { lineStyle: { color: '#e5e7eb' } }
            },
            yAxis: {
                type: 'value',
                max: 100,
                axisLabel: { fontSize: 10, color: '#9ca3af', formatter: '{value}%' },
                splitLine: { lineStyle: { color: '#f3f4f6' } }
            },
            series: merimekkoSeries
        };
    }, []);

    // ECharts Spend by Supplier Option
    const spendBySupplierOption = useMemo<EChartsOption>(() => ({
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const data = params[0];
                return `${data.name}: ${formatCurrency(data.value, currency.code, currency.symbol)}`;
            }
        },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: SPEND_BY_SUPPLIER.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 11 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            axisLabel: { color: '#94a3b8', fontSize: 12 },
        },
        series: [{
            type: 'bar',
            data: SPEND_BY_SUPPLIER.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 50,
        }],
    }), [isRTL, currency.code, currency.symbol]);

    // ECharts Spend by Category Option
    const spendByCategoryOption = useMemo<EChartsOption>(() => ({
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const data = params[0];
                return `${data.name}: ${formatCurrency(data.value, currency.code, currency.symbol)}`;
            }
        },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: SPEND_BY_CATEGORY.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 11 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            axisLabel: { color: '#94a3b8', fontSize: 12 },
        },
        series: [{
            type: 'bar',
            data: SPEND_BY_CATEGORY.map(d => d.value),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 50,
        }],
    }), [isRTL, currency.code, currency.symbol]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <PurchaseOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ShoppingCart size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div className="text-start">
                        <h1 className="text-2xl font-bold">{t('purchase_overview')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('purchase_overview_subtitle')}</p>
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
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color={kpi.color as any || "blue"}
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Spend by Supplier (Left) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('spend_by_supplier')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('spend_by_supplier')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('top_suppliers_volume')}</p>
                            </div>
                            <div className="h-[260px] w-full">
                                <MemoizedChart option={spendBySupplierOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Spend by Category (Right) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    {isLoading ? (
                        <ChartSkeleton height="h-[280px]" title={t('spend_by_category')} />
                    ) : (
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-5 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('spend_by_category')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('departmental_allocation')}</p>
                            </div>
                            <div className="h-[260px] w-full">
                                <MemoizedChart option={spendByCategoryOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Row 3: Two Charts + 4 Side KPIs --- */}

                {/* Charts Inner Grid (Left Half) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* Spend Distribution Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('spend_distribution')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('spend_distribution')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('breakdown_purchase_type')}</p>
                            </div>
                            <MemoizedChart option={pieOption1} style={{ height: '210px' }} />
                        </div>
                    )}

                    {/* Supplier Share Pie */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('supplier_share')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
                            <div className="flex flex-col gap-0.5 mb-4 text-start">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('supplier_share')}</h3>
                                <p className="text-xs text-gray-400 mt-1">{t('market_share_suppliers')}</p>
                            </div>
                            <MemoizedChart option={pieOption2} style={{ height: '210px' }} />
                        </div>
                    )}
                </div>

                {/* 4 Side KPIs (Right Half - 2x2 Grid) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                                color={kpi.color as any || "blue"}
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Row 3: Final Section (Table + Companion) --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <TableSkeleton rows={5} columns={5} />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('recent_orders')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('po_number')}</th>
                                        <th className="px-5 py-3 text-start">{t('supplier')}</th>
                                        <th className="px-5 py-3 text-start">{t('category')}</th>
                                        <th className="px-5 py-3 text-end">{t('amount')}</th>
                                        <th className="px-5 py-3 text-center">{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {RECENT_ORDERS.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{order.id}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{order.supplier}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs text-start">{order.category}</td>
                                            <td className="px-5 py-3 text-end font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(order.amount, currency.code, currency.symbol)}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${order.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                                                    order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                                                        'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                    }`}>
                                                    {order.status === 'Approved' ? t('approved') : order.status === 'Processing' ? t('processing') : t('pending')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart (2 cols) */}
                {isLoading ? (
                    <ChartSkeleton height="h-[280px]" title={t('spend_concentration_category')} />
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_concentration_category')}</h3>
                            <p className="text-xs text-gray-400">{t('distribution_category_dependency')}</p>
                        </div>
                        <MemoizedChart option={marimekkoOption} style={{ height: '280px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
