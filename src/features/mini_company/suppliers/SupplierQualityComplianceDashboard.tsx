import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, Warning, ShieldCheck, Bug, CheckCircle, Binoculars, ChartPie, ChartBar, FileText } from 'phosphor-react';
import { SupplierQualityComplianceInfo } from './SupplierQualityComplianceInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Defect Rate %', subtitle: 'Global Avg', value: '1.2%', change: '-0.3%', trend: 'up', icon: <Bug size={18} />, sparklineData: [1.8, 1.6, 1.5, 1.4, 1.3, 1.2], color: 'blue' },
    { id: '2', label: 'Rejected Shipments', subtitle: 'Last 30 Days', value: '3', change: '-1', trend: 'up', icon: <Warning size={18} />, sparklineData: [5, 4, 6, 2, 4, 3], color: 'blue' },
    { id: '3', label: 'Quality Score', subtitle: 'Overall Rating', value: '94.5', change: '+1.2', trend: 'up', icon: <ShieldCheck size={18} />, sparklineData: [91, 92, 92, 93, 94, 94.5], color: 'blue' },
    { id: '4', label: 'Compliance Score', subtitle: 'Regulatory Adherence', value: '98%', change: 'Stable', trend: 'neutral', icon: <FileText size={18} />, sparklineData: [98, 98, 98, 98, 98, 98], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Inspections Passed', subtitle: 'YTD', value: '1,245', change: '+15%', trend: 'up', icon: <CheckCircle size={18} />, sparklineData: [1000, 1050, 1100, 1150, 1200, 1245], color: 'blue' },
    { id: '6', label: 'Quality Incidents', subtitle: 'Critical Issues', value: '2', change: '-2', trend: 'up', icon: <Warning size={18} />, sparklineData: [5, 4, 3, 3, 2, 2], color: 'blue' },
    { id: '7', label: 'Risk Level', subtitle: 'Supplier Base', value: 'Low', change: 'Stable', trend: 'neutral', icon: <Binoculars size={18} />, sparklineData: [2, 2, 2, 2, 2, 2], color: 'blue' },
    { id: '8', label: 'Audit Score', subtitle: 'Avg Compliance Audit', value: '96%', change: '+2%', trend: 'up', icon: <FileText size={18} />, sparklineData: [92, 93, 94, 94, 95, 96], color: 'blue' },
];

// --- Mock Data: Charts ---
const DEFECTS_BY_SUPPLIER = [
    { name: 'Acme Mfg', Defects: 12, Inspections: 150 },
    { name: 'Globex', Defects: 45, Inspections: 200 },
    { name: 'Soylent', Defects: 8, Inspections: 120 },
    { name: 'Initech', Defects: 2, Inspections: 80 },
    { name: 'Umbrella', Defects: 65, Inspections: 300 },
];

const INSPECTION_OUTCOMES = [
    { value: 1245, name: 'Passed', itemStyle: { color: '#10b981' } },
    { value: 85, name: 'Failed', itemStyle: { color: '#ef4444' } },
    { value: 42, name: 'Conditional', itemStyle: { color: '#f59e0b' } }
];

const DEFECT_CATEGORIES = [
    { value: 35, name: 'Cosmetic' },
    { value: 25, name: 'Dimensional' },
    { value: 20, name: 'Functional' },
    { value: 15, name: 'Packaging' },
    { value: 5, name: 'Labeling' }
];

// Radar Chart Data: Quality vs Delivery vs Compliance
// Indicators: Quality, Delivery, Compliance, Responsiveness, Cost, Innovation
const RADAR_INDICATORS = [
    { name: 'Quality', max: 100 },
    { name: 'Delivery', max: 100 },
    { name: 'Compliance', max: 100 },
    { name: 'Respond', max: 100 },
    { name: 'Cost', max: 100 },
    { name: 'Innovate', max: 100 }
];

const RADAR_DATA = [
    {
        value: [95, 92, 98, 85, 90, 75],
        name: 'Strategic'
    },
    {
        value: [70, 85, 90, 95, 80, 60],
        name: 'Tactical'
    }
];

// Additional chart data
const QUALITY_BY_SUPPLIER = [
    { name: 'Initech', Score: 98 },
    { name: 'Stark Ind', Score: 96 },
    { name: 'Acme Mfg', Score: 92 },
    { name: 'Globex', Score: 82 },
    { name: 'Umbrella', Score: 71 },
];

const COMPLIANCE_STATUS = [
    { value: 75, name: 'Compliant' },
    { value: 15, name: 'Minor Issues' },
    { value: 10, name: 'Non-Compliant' }
];

// Supplier Table
const SUPPLIER_TABLE = [
    { name: 'Acme Mfg', inspections: 150, defects: 12, compliance: '98%', status: 'Approved' },
    { name: 'Globex Corp', inspections: 200, defects: 45, compliance: '82%', status: 'Watchlist' },
    { name: 'Soylent Corp', inspections: 120, defects: 8, compliance: '99%', status: 'Approved' },
    { name: 'Initech', inspections: 80, defects: 2, compliance: '100%', status: 'Preferred' },
    { name: 'Umbrella Corp', inspections: 300, defects: 65, compliance: '71%', status: 'High Risk' },
    { name: 'Stark Ind', inspections: 95, defects: 1, compliance: '99%', status: 'Preferred' },
    { name: 'Cyberdyne', inspections: 110, defects: 15, compliance: '88%', status: 'Watchlist' },
];


export const SupplierQualityComplianceDashboard: React.FC = () => {
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
        { id: '1', label: t('defect_rate'), subtitle: t('global_avg'), value: '1.2%', change: '-0.3%', trend: 'up' as const, icon: <Bug size={18} />, sparklineData: [1.8, 1.6, 1.5, 1.4, 1.3, 1.2], color: 'blue' },
        { id: '2', label: t('rejected_shipments'), subtitle: t('past_30_days'), value: '3', change: '-1', trend: 'up' as const, icon: <Warning size={18} />, sparklineData: [5, 4, 6, 2, 4, 3], color: 'blue' },
        { id: '3', label: t('quality_score'), subtitle: t('overall_rating'), value: '94.5', change: '+1.2', trend: 'up' as const, icon: <ShieldCheck size={18} />, sparklineData: [91, 92, 92, 93, 94, 94.5], color: 'blue' },
        { id: '4', label: t('compliance_score'), subtitle: t('regulatory_adherence'), value: '98%', change: t('stable'), trend: 'neutral' as const, icon: <FileText size={18} />, sparklineData: [98, 98, 98, 98, 98, 98], color: 'blue' },
    ], [t]);

    const TRANSLATED_SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('inspections_passed'), subtitle: t('ytd'), value: '1,245', change: '+15%', trend: 'up' as const, icon: <CheckCircle size={18} />, sparklineData: [1000, 1050, 1100, 1150, 1200, 1245], color: 'blue' },
        { id: '6', label: t('quality_incidents'), subtitle: t('critical_issues'), value: '2', change: '-2', trend: 'up' as const, icon: <Warning size={18} />, sparklineData: [5, 4, 3, 3, 2, 2], color: 'blue' },
        { id: '7', label: t('risk_level'), subtitle: t('supplier_base'), value: t('low'), change: t('stable'), trend: 'neutral' as const, icon: <Binoculars size={18} />, sparklineData: [2, 2, 2, 2, 2, 2], color: 'blue' },
        { id: '8', label: t('audit_score'), subtitle: t('avg_compliance_audit'), value: '96%', change: '+2%', trend: 'up' as const, icon: <FileText size={18} />, sparklineData: [92, 93, 94, 94, 95, 96], color: 'blue' },
    ], [t]);

    const TRANSLATED_DEFECTS_BY_SUPPLIER = useMemo(() => [
        { name: 'Acme Mfg', [t('defects')]: 12, [t('inspections')]: 150 },
        { name: 'Globex', [t('defects')]: 45, [t('inspections')]: 200 },
        { name: 'Soylent', [t('defects')]: 8, [t('inspections')]: 120 },
        { name: 'Initech', [t('defects')]: 2, [t('inspections')]: 80 },
        { name: 'Umbrella', [t('defects')]: 65, [t('inspections')]: 300 },
    ], [t]);

    const TRANSLATED_INSPECTION_OUTCOMES = useMemo(() => [
        { value: 1245, name: t('passed'), itemStyle: { color: '#10b981' } },
        { value: 85, name: t('failed'), itemStyle: { color: '#ef4444' } },
        { value: 42, name: t('conditional'), itemStyle: { color: '#f59e0b' } }
    ], [t]);

    const TRANSLATED_DEFECT_CATEGORIES = useMemo(() => [
        { value: 35, name: t('cosmetic') },
        { value: 25, name: t('dimensional') },
        { value: 20, name: t('functional') },
        { value: 15, name: t('packaging') },
        { value: 5, name: t('labeling') }
    ], [t]);

    const TRANSLATED_RADAR_INDICATORS = useMemo(() => [
        { name: t('quality'), max: 100 },
        { name: t('delivery'), max: 100 },
        { name: t('compliance'), max: 100 },
        { name: t('respond'), max: 100 },
        { name: t('cost'), max: 100 },
        { name: t('innovate'), max: 100 }
    ], [t]);

    const TRANSLATED_RADAR_DATA = useMemo(() => [
        { value: [95, 92, 98, 85, 90, 75], name: t('strategic') },
        { value: [70, 85, 90, 95, 80, 60], name: t('tactical') }
    ], [t]);

    const TRANSLATED_QUALITY_BY_SUPPLIER = useMemo(() => [
        { name: 'Initech', [t('score')]: 98 },
        { name: 'Stark Ind', [t('score')]: 96 },
        { name: 'Acme Mfg', [t('score')]: 92 },
        { name: 'Globex', [t('score')]: 82 },
        { name: 'Umbrella', [t('score')]: 71 },
    ], [t]);

    const TRANSLATED_COMPLIANCE_STATUS = useMemo(() => [
        { value: 75, name: t('compliant') },
        { value: 15, name: t('minor_issues') },
        { value: 10, name: t('non_compliant') }
    ], [t]);

    const TRANSLATED_SUPPLIER_TABLE = useMemo(() => [
        { name: 'Acme Mfg', inspections: 150, defects: 12, compliance: '98%', status: t('approved') },
        { name: 'Globex Corp', inspections: 200, defects: 45, compliance: '82%', status: t('watchlist') },
        { name: 'Soylent Corp', inspections: 120, defects: 8, compliance: '99%', status: t('approved') },
        { name: 'Initech', inspections: 80, defects: 2, compliance: '100%', status: t('preferred') },
        { name: 'Umbrella Corp', inspections: 300, defects: 65, compliance: '71%', status: t('high_risk') },
        { name: 'Stark Ind', inspections: 95, defects: 1, compliance: '99%', status: t('preferred') },
        { name: 'Cyberdyne', inspections: 110, defects: 15, compliance: '88%', status: t('watchlist') },
    ], [t]);

    // --- ECharts Options ---

    // Pie Chart: Passed vs Failed
    const pieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            name: t('inspection_outcome'),
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: TRANSLATED_INSPECTION_OUTCOMES
        }]
    }), [TRANSLATED_INSPECTION_OUTCOMES, t]);

    // Pie Chart: Defect Categories
    const defectPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            name: t('defect_type'),
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: TRANSLATED_DEFECT_CATEGORIES,
            color: ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#6b7280']
        }]
    }), [TRANSLATED_DEFECT_CATEGORIES, t]);

    // Compliance Status Pie
    const compliancePieOption: EChartsOption = useMemo(() => ({
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
            data: TRANSLATED_COMPLIANCE_STATUS,
            color: ['#10b981', '#f59e0b', '#ef4444']
        }]
    }), [TRANSLATED_COMPLIANCE_STATUS]);

    // Radar Chart
    const radarOption: EChartsOption = useMemo(() => ({
        title: { text: '' },
        tooltip: {},
        legend: { data: [t('strategic'), t('tactical')], bottom: 0, show: true },
        radar: {
            indicator: TRANSLATED_RADAR_INDICATORS,
            radius: '65%',
        },
        series: [{
            name: t('supplier_metrics'),
            type: 'radar',
            data: TRANSLATED_RADAR_DATA,
            areaStyle: { opacity: 0.2 }
        }]
    }), [TRANSLATED_RADAR_INDICATORS, TRANSLATED_RADAR_DATA, t]);

    // Defects & Inspections (Dual Y-Axis Bar Chart)
    const defectsBarOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
        grid: { left: isRTL ? 50 : 50, right: isRTL ? 50 : 50, top: 10, bottom: 40 },
        xAxis: {
            type: 'category',
            data: DEFECTS_BY_SUPPLIER.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: [
            {
                type: 'value',
                name: t('defects'),
                position: isRTL ? 'right' : 'left',
                axisLine: { show: true, lineStyle: { color: '#3b82f6' } },
                axisTick: { show: false },
                splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
                axisLabel: { color: '#9ca3af', fontSize: 10 },
            },
            {
                type: 'value',
                name: t('inspections'),
                position: isRTL ? 'left' : 'right',
                axisLine: { show: true, lineStyle: { color: '#93c5fd' } },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { color: '#9ca3af', fontSize: 10 },
            }
        ],
        series: [
            {
                name: t('defects'),
                type: 'bar',
                yAxisIndex: 0,
                data: DEFECTS_BY_SUPPLIER.map(d => d.Defects),
                itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
                barWidth: 20,
            },
            {
                name: t('inspections'),
                type: 'bar',
                yAxisIndex: 1,
                data: DEFECTS_BY_SUPPLIER.map(d => d.Inspections),
                itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
                barWidth: 20,
            }
        ],
    }), [isRTL, t]);

    // Quality by Supplier (Bar Chart)
    const qualityBarOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 10, bottom: 30 },
        xAxis: {
            type: 'category',
            data: QUALITY_BY_SUPPLIER.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            min: 0,
            max: 100,
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        series: [{
            name: t('score'),
            type: 'bar',
            data: QUALITY_BY_SUPPLIER.map(d => d.Score),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 28,
        }],
    }), [isRTL, t]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierQualityComplianceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ShieldCheck size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('quality_compliance')}</h1>
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
                            <ChartSkeleton height="h-[300px]" title={t('defect_analysis')} />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title={t('quality_scores')} />
                        </div>
                    </>
                ) : (
                    <>
                        {/* ECharts: Defects & Inspections (Dual Y-Axis Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('defect_analysis')}</h3>
                                <p className="text-xs text-gray-400">{t('by_supplier')}</p>
                            </div>
                            <MemoizedChart option={defectsBarOption} style={{ height: '220px', width: '100%' }} />
                        </div>

                        {/* ECharts: Quality by Supplier (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 text-start`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('quality_scores')}</h3>
                                <p className="text-xs text-gray-400">{t('by_supplier')}</p>
                            </div>
                            <MemoizedChart option={qualityBarOption} style={{ height: '220px', width: '100%' }} />
                        </div>
                    </>
                )}

                {/* --- Row 3: Two pie charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2">
                            <div className="grid grid-cols-2 gap-6">
                                <PieChartSkeleton title={t('inspection_outcomes')} />
                                <PieChartSkeleton title={t('compliance_status')} />
                            </div>
                        </div>
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {TRANSLATED_SIDE_KPIS.map((kpi, index) => (
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
                            {/* ECharts: Inspection Outcomes (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className={`mb-2 text-start`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('inspection_outcomes')}</h3>
                                    <p className="text-xs text-gray-400">{t('pass_fail_distribution')}</p>
                                </div>
                                <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Compliance Status (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className={`mb-2 text-start`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('compliance_status')}</h3>
                                    <p className="text-xs text-gray-400">{t('overall_distribution')}</p>
                                </div>
                                <MemoizedChart option={compliancePieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        {/* 4 KPIs in 2x2 grid */}
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

                {/* --- Row 4: Table + Companion Chart --- */}

                {/* Table (2 cols) */}
                {isLoading ? (
                    <div className="col-span-2">
                        <TableSkeleton rows={5} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`p-5 border-b border-gray-100 dark:border-gray-700 text-start`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('compliance_registry')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table dir={dir} className={`w-full text-sm text-start`}>
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className={`px-5 py-3 text-start`}>{t('supplier')}</th>
                                        <th className="px-5 py-3 text-center">{t('inspections')}</th>
                                        <th className="px-5 py-3 text-center">{t('defects')}</th>
                                        <th className="px-5 py-3 text-center">{t('compliance')}</th>
                                        <th className={`px-5 py-3 text-end`}>{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {TRANSLATED_SUPPLIER_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start`}>{row.name}</td>
                                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.inspections}</td>
                                            <td className="px-5 py-3 text-center font-medium text-red-500">{row.defects}</td>
                                            <td className="px-5 py-3 text-center font-bold text-gray-700 dark:text-gray-300">{row.compliance}</td>
                                            <td className={`px-5 py-3 text-end`}>
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === t('high_risk') ? 'bg-red-100 text-red-700' :
                                                    row.status === t('watchlist') ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
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

                {/* Companion Chart: Radar (2 cols) */}
                {isLoading ? (
                    <div className="col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('performance_radar')} />
                    </div>
                ) : (
                    <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`mb-2 text-start`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('metrics_radar')}</h3>
                            <p className="text-xs text-gray-400">{t('quality_vs_other_kpis')}</p>
                        </div>
                        <MemoizedChart option={radarOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
