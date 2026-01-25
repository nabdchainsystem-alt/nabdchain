import React, { useState, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, Package, Truck, Warning, Activity, Wallet, CheckCircle, Clock } from 'phosphor-react';
import { SupplierOverviewInfo } from './SupplierOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

const SUPPLIER_LIST_DATA = [
    { id: 'S-001', name: 'Global Materials Co', categoryKey: 'raw_materials', orders: 150, value: '$245,000', onTime: '98%', statusKey: 'active' },
    { id: 'S-002', name: 'TechParts Ltd', categoryKey: 'electronics', orders: 85, value: '$122,500', onTime: '95%', statusKey: 'active' },
    { id: 'S-003', name: 'PackPro Solutions', categoryKey: 'packaging', orders: 42, value: '$53,200', onTime: '88%', statusKey: 'active' },
    { id: 'S-004', name: 'MetalWorks Inc', categoryKey: 'raw_materials', orders: 65, value: '$89,000', onTime: '72%', statusKey: 'at_risk' },
    { id: 'S-005', name: 'LogiShip Express', categoryKey: 'logistics', orders: 200, value: '$160,000', onTime: '99%', statusKey: 'preferred' },
];

export const SupplierOverviewDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [showInfo, setShowInfo] = useState(false);

    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('total_suppliers'), subtitle: t('registered'), value: '156', change: '+12', trend: 'up' as const, icon: <Package size={18} />, sparklineData: [140, 145, 148, 150, 153, 156], color: 'blue' },
        { id: '2', label: t('active_suppliers'), subtitle: t('with_orders'), value: '124', change: '+8%', trend: 'up' as const, icon: <Activity size={18} />, sparklineData: [110, 115, 118, 120, 122, 124], color: 'blue' },
        { id: '3', label: t('new_suppliers'), subtitle: t('this_quarter'), value: '18', change: '+25%', trend: 'up' as const, icon: <TrendUp size={18} />, sparklineData: [10, 12, 14, 15, 16, 18], color: 'blue' },
        { id: '4', label: t('at_risk_suppliers'), subtitle: t('need_attention'), value: '8', change: '-2', trend: 'down' as const, icon: <Warning size={18} />, sparklineData: [12, 11, 10, 10, 9, 8], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('avg_order_value'), subtitle: t('per_supplier'), value: '$12,450', change: '+$850', trend: 'up' as const, icon: <Wallet size={18} />, sparklineData: [11000, 11200, 11600, 11900, 12200, 12450], color: 'blue' },
        { id: '6', label: t('on_time_delivery'), subtitle: t('avg_rate'), value: '94.2%', change: '+1.5%', trend: 'up' as const, icon: <Clock size={18} />, sparklineData: [91, 92, 92.5, 93, 93.8, 94.2], color: 'blue' },
        { id: '7', label: t('quality_score'), subtitle: t('avg_rating'), value: '4.6/5', change: '+0.2', trend: 'up' as const, icon: <CheckCircle size={18} />, sparklineData: [4.2, 4.3, 4.4, 4.5, 4.5, 4.6], color: 'blue' },
        { id: '8', label: t('lead_time'), subtitle: t('avg_days'), value: '5.2d', change: '-0.3d', trend: 'up' as const, icon: <Truck size={18} />, sparklineData: [6, 5.8, 5.6, 5.5, 5.3, 5.2], color: 'blue' },
    ], [t]);

    const SUPPLIERS_BY_MONTH = useMemo(() => [
        { name: t('jan'), Total: 140, New: 8 },
        { name: t('feb'), Total: 145, New: 10 },
        { name: t('mar'), Total: 148, New: 6 },
        { name: t('apr'), Total: 150, New: 12 },
        { name: t('may'), Total: 153, New: 14 },
        { name: t('jun'), Total: 156, New: 18 },
    ], [t]);

    const SUPPLIER_DISTRIBUTION = useMemo(() => [
        { value: 45, name: t('raw_materials') },
        { value: 32, name: t('electronics') },
        { value: 28, name: t('packaging') },
        { value: 25, name: t('logistics') },
        { value: 26, name: t('services') }
    ], [t]);

    const SPEND_BY_CATEGORY = useMemo(() => [
        { name: t('raw_materials'), Spend: 850000 },
        { name: t('electronics'), Spend: 420000 },
        { name: t('packaging'), Spend: 180000 },
        { name: t('logistics'), Spend: 320000 },
        { name: t('services'), Spend: 150000 },
    ], [t]);

    const SUPPLIER_STATUS = useMemo(() => [
        { value: 85, name: t('preferred') },
        { value: 31, name: t('active') },
        { value: 8, name: t('at_risk') }
    ], [t]);

    const SUPPLIER_LIST = useMemo(() => SUPPLIER_LIST_DATA.map(item => ({
        ...item,
        category: t(item.categoryKey),
        status: t(item.statusKey)
    })), [t]);

    const isLoading = useLoadingAnimation();

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

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
            data: SUPPLIER_DISTRIBUTION,
            color: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444']
        }]
    }), [SUPPLIER_DISTRIBUTION]);

    const statusPieOption: EChartsOption = useMemo(() => ({
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
            data: SUPPLIER_STATUS,
            color: ['#10b981', '#3b82f6', '#ef4444']
        }]
    }), [SUPPLIER_STATUS]);

    const supplierGrowthOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 40, right: isRTL ? 40 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: SUPPLIERS_BY_MONTH.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        series: [
            { type: 'bar', name: 'Total', data: SUPPLIERS_BY_MONTH.map(d => d.Total), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: 20 },
            { type: 'bar', name: 'New', data: SUPPLIERS_BY_MONTH.map(d => d.New), itemStyle: { color: '#dbeafe', borderRadius: [4, 4, 0, 0] }, barWidth: 20 },
        ],
    }), [SUPPLIERS_BY_MONTH, isRTL]);

    const spendByCategoryOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: SPEND_BY_CATEGORY.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        series: [{
            type: 'bar',
            data: SPEND_BY_CATEGORY.map(d => d.Spend),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 28,
        }],
    }), [SPEND_BY_CATEGORY, isRTL]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative" dir={dir}>
            <SupplierOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse text-end' : ''}`}>
                    <Package size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('supplier_overview')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('supplier_overview_desc')}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className={`flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <Info size={18} className="text-blue-500" />
                        {t('about_dashboard')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Row 1: Top 4 KPIs */}
                {TOP_KPIS.map((kpi, index) => (
                    <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                        <KPICard
                            {...kpi}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* Row 2: Two Bar Charts Side by Side */}
                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('supplier_growth')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`mb-4 text-start`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('supplier_growth')}</h3>
                            <p className="text-xs text-gray-400">{t('total_vs_new')}</p>
                        </div>
                        <MemoizedChart option={supplierGrowthOption} style={{ height: '220px', width: '100%' }} />
                    </div>
                )}

                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('spend_by_category')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`mb-4 text-start`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_by_category')}</h3>
                            <p className="text-xs text-gray-400">{t('total_spend')}</p>
                        </div>
                        <MemoizedChart option={spendByCategoryOption} style={{ height: '220px', width: '100%' }} />
                    </div>
                )}

                {/* Row 3: Two Pie Charts + 4 KPIs */}
                {isLoading ? (
                    <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-6">
                            <PieChartSkeleton title={t('supplier_categories')} />
                            <PieChartSkeleton title={t('supplier_status')} />
                        </div>
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-2 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('supplier_categories')}</h3>
                                <p className="text-xs text-gray-400">{t('distribution_by_type')}</p>
                            </div>
                            <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                        </div>
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-2 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('supplier_status')}</h3>
                                <p className="text-xs text-gray-400">{t('relationship_health')}</p>
                            </div>
                            <MemoizedChart option={statusPieOption} style={{ height: '180px' }} />
                        </div>
                    </div>
                )}

                {/* 4 KPIs in 2x2 grid */}
                <div className="col-span-1 md:col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                color="blue"
                                className="h-full"
                                loading={isLoading}
                            />
                        </div>
                    ))}
                </div>

                {/* Row 4: Table */}
                {isLoading ? (
                    <div className="col-span-4">
                        <TableSkeleton rows={5} columns={6} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-4 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`p-5 border-b border-gray-100 dark:border-gray-700 text-start`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('top_suppliers')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" dir={dir}>
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className={`px-5 py-3 text-start`}>{t('supplier')}</th>
                                        <th className={`px-5 py-3 text-start`}>{t('category')}</th>
                                        <th className={`px-5 py-3 text-end`}>{t('orders')}</th>
                                        <th className={`px-5 py-3 text-end`}>{t('total_value')}</th>
                                        <th className={`px-5 py-3 text-end`}>{t('on_time')}</th>
                                        <th className={`px-5 py-3 text-end`}>{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {SUPPLIER_LIST.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start`}>
                                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                        {row.name.charAt(0)}
                                                    </div>
                                                    {row.name}
                                                </div>
                                            </td>
                                            <td className={`px-5 py-3 text-start`}>
                                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                                    {row.category}
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3 text-gray-600 dark:text-gray-400 text-end`}>{row.orders}</td>
                                            <td className={`px-5 py-3 text-green-600 font-medium text-end`}>{row.value}</td>
                                            <td className={`px-5 py-3 text-end`}>
                                                <span className={`font-medium ${parseFloat(row.onTime) >= 90 ? 'text-green-600' : parseFloat(row.onTime) >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {row.onTime}
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3 text-end`}>
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.statusKey === 'preferred' ? 'bg-green-100 text-green-700' :
                                                    row.statusKey === 'at_risk' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
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
                )}

            </div>
        </div>
    );
};
