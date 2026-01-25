import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, Clock, Lightning, Warning, TrendUp, Chats, Timer, ChartLineUp, Hourglass, Medal } from 'phosphor-react';
import { SupplierLeadTimeResponsivenessInfo } from './SupplierLeadTimeResponsivenessInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Avg Lead Time', subtitle: 'Days', value: '14.2', change: '-1.5', trend: 'down', icon: <Clock size={18} />, sparklineData: [16, 15, 15.5, 15, 14.5, 14.2], color: 'blue' },
    { id: '2', label: 'Fastest Supplier', subtitle: 'Acme Mfg', value: '5 Days', change: 'Stable', trend: 'neutral', icon: <Lightning size={18} />, color: 'blue' },
    { id: '3', label: 'Response Time (RFQ)', subtitle: 'Avg Hours', value: '24h', change: '-2h', trend: 'down', icon: <Chats size={18} />, sparklineData: [28, 27, 26, 25, 24, 24], color: 'blue' },
    { id: '4', label: 'Responsiveness Score', subtitle: 'Index (0-100)', value: '88', change: '+3', trend: 'up', icon: <Medal size={18} />, sparklineData: [82, 84, 85, 86, 87, 88], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Emergency Orders', subtitle: 'Last 30 Days', value: '12', change: '+2', trend: 'down', icon: <Warning size={18} />, sparklineData: [8, 9, 10, 11, 10, 12], color: 'blue' },
    { id: '6', label: 'Lead Time Variance', subtitle: 'Standard Dev', value: '±2.1', change: '-0.3', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [2.8, 2.6, 2.5, 2.4, 2.2, 2.1], color: 'blue' },
    { id: '7', label: 'Slowest Supplier', subtitle: 'Umbrella Corp', value: '35 Days', change: '+2', trend: 'down', icon: <Hourglass size={18} />, color: 'blue' },
    { id: '8', label: 'On-Time Quote', subtitle: 'RFQ Response Rate', value: '92%', change: '+4%', trend: 'up', icon: <Timer size={18} />, sparklineData: [85, 87, 88, 89, 90, 92], color: 'blue' },
];

// --- Mock Data: Charts ---
const LEAD_TIME_BY_SUPPLIER = [
    { name: 'Acme Mfg', LeadTime: 5, ResponseTime: 4 },
    { name: 'Globex', LeadTime: 12, ResponseTime: 24 },
    { name: 'Soylent', LeadTime: 18, ResponseTime: 12 },
    { name: 'Initech', LeadTime: 8, ResponseTime: 6 },
    { name: 'Umbrella', LeadTime: 35, ResponseTime: 48 },
];

const LEAD_TIME_BUCKETS = [
    { value: 45, name: '< 7 Days', itemStyle: { color: '#10b981' } },
    { value: 30, name: '7-14 Days', itemStyle: { color: '#3b82f6' } },
    { value: 15, name: '15-30 Days', itemStyle: { color: '#f59e0b' } },
    { value: 10, name: '> 30 Days', itemStyle: { color: '#ef4444' } }
];

const ORDER_URGENCY = [
    { value: 85, name: 'Standard' },
    { value: 15, name: 'Expedited' }
];

// Box Plot Data (Mock): Lead Time Distribution [min, Q1, median, Q3, max]
const BOX_PLOT_DATA = [
    { name: 'Acme Mfg', value: [3, 4, 5, 6, 8] },
    { name: 'Globex', value: [10, 11, 12, 14, 16] },
    { name: 'Soylent', value: [15, 17, 18, 20, 25] },
    { name: 'Initech', value: [6, 7, 8, 9, 10] },
    { name: 'Umbrella', value: [30, 32, 35, 38, 45] }
];

// Additional chart data
const RESPONSE_BY_SUPPLIER = [
    { name: 'Acme Mfg', Hours: 4 },
    { name: 'Initech', Hours: 6 },
    { name: 'Stark', Hours: 8 },
    { name: 'Globex', Hours: 24 },
    { name: 'Umbrella', Hours: 48 },
];

const PERFORMANCE_TIER = [
    { value: 35, name: 'Excellent' },
    { value: 40, name: 'Good' },
    { value: 15, name: 'Average' },
    { value: 10, name: 'Poor' }
];

// Supplier Table
const SUPPLIER_TABLE = [
    { name: 'Acme Mfg', leadTime: '5 Days', response: '4h', variance: '±0.5', score: '98' },
    { name: 'Initech', leadTime: '8 Days', response: '6h', variance: '±1.0', score: '95' },
    { name: 'Globex Corp', leadTime: '12 Days', response: '24h', variance: '±2.5', score: '85' },
    { name: 'Soylent Corp', leadTime: '18 Days', response: '12h', variance: '±3.0', score: '82' },
    { name: 'Stark Ind', leadTime: '10 Days', response: '8h', variance: '±1.2', score: '92' },
    { name: 'Umbrella Corp', leadTime: '35 Days', response: '48h', variance: '±5.0', score: '60' },
];


export const SupplierLeadTimeResponsivenessDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t, dir } = useLanguage();
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

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Translated KPI data
    const TRANSLATED_TOP_KPIS = useMemo(() => [
        { id: '1', label: t('avg_lead_time'), subtitle: t('days'), value: '14.2', change: '-1.5', trend: 'down' as const, icon: <Clock size={18} />, sparklineData: [16, 15, 15.5, 15, 14.5, 14.2], color: 'blue' },
        { id: '2', label: t('fastest_supplier'), subtitle: 'Acme Mfg', value: `5 ${t('days')}`, change: t('stable'), trend: 'neutral' as const, icon: <Lightning size={18} />, color: 'blue' },
        { id: '3', label: t('response_time_rfq'), subtitle: t('avg_hours'), value: '24h', change: '-2h', trend: 'down' as const, icon: <Chats size={18} />, sparklineData: [28, 27, 26, 25, 24, 24], color: 'blue' },
        { id: '4', label: t('responsiveness_score'), subtitle: t('index_0_100'), value: '88', change: '+3', trend: 'up' as const, icon: <Medal size={18} />, sparklineData: [82, 84, 85, 86, 87, 88], color: 'blue' },
    ], [t]);

    const TRANSLATED_SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('emergency_orders'), subtitle: t('past_30_days'), value: '12', change: '+2', trend: 'down' as const, icon: <Warning size={18} />, sparklineData: [8, 9, 10, 11, 10, 12], color: 'blue' },
        { id: '6', label: t('lead_time_variance'), subtitle: t('standard_dev'), value: '±2.1', change: '-0.3', trend: 'up' as const, icon: <TrendUp size={18} />, sparklineData: [2.8, 2.6, 2.5, 2.4, 2.2, 2.1], color: 'blue' },
        { id: '7', label: t('slowest_supplier'), subtitle: 'Umbrella Corp', value: `35 ${t('days')}`, change: '+2', trend: 'down' as const, icon: <Hourglass size={18} />, color: 'blue' },
        { id: '8', label: t('on_time_quote'), subtitle: t('rfq_response_rate'), value: '92%', change: '+4%', trend: 'up' as const, icon: <Timer size={18} />, sparklineData: [85, 87, 88, 89, 90, 92], color: 'blue' },
    ], [t]);

    const TRANSLATED_LEAD_TIME_BY_SUPPLIER = useMemo(() => [
        { name: 'Acme Mfg', [t('lead_time')]: 5, [t('response_time')]: 4 },
        { name: 'Globex', [t('lead_time')]: 12, [t('response_time')]: 24 },
        { name: 'Soylent', [t('lead_time')]: 18, [t('response_time')]: 12 },
        { name: 'Initech', [t('lead_time')]: 8, [t('response_time')]: 6 },
        { name: 'Umbrella', [t('lead_time')]: 35, [t('response_time')]: 48 },
    ], [t]);

    const TRANSLATED_LEAD_TIME_BUCKETS = useMemo(() => [
        { value: 45, name: t('less_than_7_days'), itemStyle: { color: '#10b981' } },
        { value: 30, name: t('7_to_14_days'), itemStyle: { color: '#3b82f6' } },
        { value: 15, name: t('15_to_30_days'), itemStyle: { color: '#f59e0b' } },
        { value: 10, name: t('over_30_days'), itemStyle: { color: '#ef4444' } }
    ], [t]);

    const TRANSLATED_ORDER_URGENCY = useMemo(() => [
        { value: 85, name: t('standard') },
        { value: 15, name: t('expedited') }
    ], [t]);

    const TRANSLATED_RESPONSE_BY_SUPPLIER = useMemo(() => [
        { name: 'Acme Mfg', [t('hours')]: 4 },
        { name: 'Initech', [t('hours')]: 6 },
        { name: 'Stark', [t('hours')]: 8 },
        { name: 'Globex', [t('hours')]: 24 },
        { name: 'Umbrella', [t('hours')]: 48 },
    ], [t]);

    const TRANSLATED_PERFORMANCE_TIER = useMemo(() => [
        { value: 35, name: t('excellent') },
        { value: 40, name: t('good') },
        { value: 15, name: t('average') },
        { value: 10, name: t('poor') }
    ], [t]);

    const TRANSLATED_SUPPLIER_TABLE = useMemo(() => [
        { name: 'Acme Mfg', leadTime: `5 ${t('days')}`, response: '4h', variance: '±0.5', score: '98' },
        { name: 'Initech', leadTime: `8 ${t('days')}`, response: '6h', variance: '±1.0', score: '95' },
        { name: 'Globex Corp', leadTime: `12 ${t('days')}`, response: '24h', variance: '±2.5', score: '85' },
        { name: 'Soylent Corp', leadTime: `18 ${t('days')}`, response: '12h', variance: '±3.0', score: '82' },
        { name: 'Stark Ind', leadTime: `10 ${t('days')}`, response: '8h', variance: '±1.2', score: '92' },
        { name: 'Umbrella Corp', leadTime: `35 ${t('days')}`, response: '48h', variance: '±5.0', score: '60' },
    ], [t]);

    // --- ECharts Options ---

    // Pie Chart: Lead Time Buckets
    const bucketsPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            name: t('lead_time_range'),
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: TRANSLATED_LEAD_TIME_BUCKETS
        }]
    }), [TRANSLATED_LEAD_TIME_BUCKETS, t]);

    // Pie Chart: Urgency
    const urgencyPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            name: t('urgency'),
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: TRANSLATED_ORDER_URGENCY,
            color: ['#3b82f6', '#f59e0b']
        }]
    }), [TRANSLATED_ORDER_URGENCY, t]);

    // Performance Tier Pie
    const performancePieOption: EChartsOption = useMemo(() => ({
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
            data: TRANSLATED_PERFORMANCE_TIER,
            color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        }]
    }), [TRANSLATED_PERFORMANCE_TIER]);

    // Box Plot: Lead Time Variability
    const boxplotOption: EChartsOption = useMemo(() => ({
        title: { text: '' },
        tooltip: { trigger: 'item', axisPointer: { type: 'shadow' } },
        grid: { left: '10%', right: '10%', bottom: '15%' },
        xAxis: {
            type: 'category',
            data: BOX_PLOT_DATA.map(item => item.name),
            boundaryGap: true,
            nameGap: 30,
            splitArea: { show: false },
            axisLabel: { formatter: '{value}' },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            name: t('days'),
            splitArea: { show: true },
            position: isRTL ? 'right' : 'left'
        },
        series: [
            {
                name: t('lead_time_range'),
                type: 'boxplot',
                datasetIndex: 1,
                itemStyle: { color: '#8b5cf6', borderColor: '#7c3aed' },
                data: BOX_PLOT_DATA.map(item => item.value)
            }
        ]
    }), [isRTL, t]);

    // Lead Time by Supplier (Grouped Bar Chart)
    const leadTimeBarOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 10, bottom: 40 },
        xAxis: {
            type: 'category',
            data: LEAD_TIME_BY_SUPPLIER.map(d => d.name),
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
            {
                name: t('lead_time_days'),
                type: 'bar',
                data: LEAD_TIME_BY_SUPPLIER.map(d => d.LeadTime),
                itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
                barWidth: 20,
            },
            {
                name: t('response_hours'),
                type: 'bar',
                data: LEAD_TIME_BY_SUPPLIER.map(d => d.ResponseTime),
                itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
                barWidth: 20,
            }
        ],
    }), [isRTL, t]);

    // Response by Supplier (Bar Chart)
    const responseBarOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 10, bottom: 30 },
        xAxis: {
            type: 'category',
            data: RESPONSE_BY_SUPPLIER.map(d => d.name),
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
            name: t('hours'),
            type: 'bar',
            data: RESPONSE_BY_SUPPLIER.map(d => d.Hours),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 28,
        }],
    }), [isRTL, t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierLeadTimeResponsivenessInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Clock size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('lead_time_speed')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('sourcing_procurement')}</p>
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
                {TRANSLATED_TOP_KPIS.map((kpi, index) => (
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
                            <ChartSkeleton height="h-[300px]" title={t('speed_analysis')} />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title={t('response_times')} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('speed_analysis')}</h3>
                                <p className="text-xs text-gray-400">{t('lead_time_vs_response')}</p>
                            </div>
                            <MemoizedChart option={leadTimeBarOption} style={{ height: '220px', width: '100%' }} />
                        </div>

                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('response_times')}</h3>
                                <p className="text-xs text-gray-400">{t('hours_to_rfq_response')}</p>
                            </div>
                            <MemoizedChart option={responseBarOption} style={{ height: '220px', width: '100%' }} />
                        </div>
                    </>
                )}

                {/* --- Row 3: Two pie charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <div className="grid grid-cols-2 gap-4">
                                <PieChartSkeleton title={t('lead_time_mix')} />
                                <PieChartSkeleton title={t('order_urgency')} />
                            </div>
                        </div>
                        <div className="col-span-2 min-h-[250px]">
                            <div className="grid grid-cols-2 gap-4 h-full">
                                {TRANSLATED_SIDE_KPIS.map((kpi, index) => (
                                    <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
                                        <KPICard {...kpi} color="blue" loading={true} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <h3 className={`text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2 text-start`}>{t('lead_time_mix')}</h3>
                                <MemoizedChart option={bucketsPieOption} style={{ height: '180px' }} />
                            </div>
                            <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <h3 className={`text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2 text-start`}>{t('order_urgency')}</h3>
                                <MemoizedChart option={urgencyPieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {TRANSLATED_SIDE_KPIS.map((kpi, index) => (
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

                {/* --- Row 4: Table (col-span-2) + Companion Chart (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <TableSkeleton rows={5} columns={5} />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title={t('predictability_analysis')} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`p-5 border-b border-gray-100 dark:border-gray-700 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('speed_performance')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table dir={dir} className={`w-full text-sm text-start`}>
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className={`px-5 py-3 text-start`}>{t('supplier')}</th>
                                            <th className="px-5 py-3 text-center">{t('lead_time')}</th>
                                            <th className="px-5 py-3 text-center">{t('response')}</th>
                                            <th className="px-5 py-3 text-center">{t('variance')}</th>
                                            <th className={`px-5 py-3 text-end`}>{t('score')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {TRANSLATED_SUPPLIER_TABLE.map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start`}>{row.name}</td>
                                                <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.leadTime}</td>
                                                <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.response}</td>
                                                <td className="px-5 py-3 text-center font-medium text-amber-500">{row.variance}</td>
                                                <td className={`px-5 py-3 text-end`}>
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${Number(row.score) < 80 ? 'bg-red-100 text-red-700' :
                                                        Number(row.score) < 90 ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
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

                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-2 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('predictability_analysis')}</h3>
                                <p className="text-xs text-gray-400">{t('lead_time_variability_boxplot')}</p>
                            </div>
                            <MemoizedChart option={boxplotOption} style={{ height: '300px', width: '100%' }} />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
