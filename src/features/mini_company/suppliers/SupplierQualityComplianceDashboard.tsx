import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Warning, ShieldCheck, Bug, CheckCircle, Binoculars, ChartPie, ChartBar, FileText } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

    // Loading state for smooth entrance animation
    const [isLoading, setIsLoading] = useState(true);

    // Simulate data loading with staggered animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

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
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
        series: [{
            name: t('inspection_outcome'),
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: TRANSLATED_INSPECTION_OUTCOMES
        }]
    };

    // Pie Chart: Defect Categories
    const defectPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            name: t('defect_type'),
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TRANSLATED_DEFECT_CATEGORIES,
            color: ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#6b7280']
        }]
    };

    // Compliance Status Pie
    const compliancePieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TRANSLATED_COMPLIANCE_STATUS,
            color: ['#10b981', '#f59e0b', '#ef4444']
        }]
    };

    // Radar Chart
    const radarOption: EChartsOption = {
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
    };

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
                        title={t('full_screen')}
                    >
                        <ArrowsOut size={18} />
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
                        {/* Recharts: Defects & Inspections (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('defect_analysis')}</h3>
                                <p className="text-xs text-gray-400">{t('by_supplier')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={TRANSLATED_DEFECTS_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} reversed={isRTL} />
                                        <YAxis yAxisId="left" orientation={isRTL ? 'right' : 'left'} stroke="#8884d8" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <YAxis yAxisId="right" orientation={isRTL ? 'left' : 'right'} stroke="#82ca9d" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar yAxisId="left" dataKey={t('defects')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name={t('defects')} animationDuration={1000} />
                                        <Bar yAxisId="right" dataKey={t('inspections')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name={t('inspections')} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recharts: Quality by Supplier (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('quality_scores')}</h3>
                                <p className="text-xs text-gray-400">{t('by_supplier')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={TRANSLATED_QUALITY_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} reversed={isRTL} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} domain={[0, 100]} orientation={isRTL ? 'right' : 'left'} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey={t('score')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1000} />
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
                                <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('inspection_outcomes')}</h3>
                                    <p className="text-xs text-gray-400">{t('pass_fail_distribution')}</p>
                                </div>
                                <ReactECharts option={pieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Compliance Status (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('compliance_status')}</h3>
                                    <p className="text-xs text-gray-400">{t('overall_distribution')}</p>
                                </div>
                                <ReactECharts option={compliancePieOption} style={{ height: '180px' }} />
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
                        <div className={`p-5 border-b border-gray-100 dark:border-gray-700 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('compliance_registry')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table dir={dir} className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-right' : ''}`}>{t('supplier')}</th>
                                        <th className="px-5 py-3 text-center">{t('inspections')}</th>
                                        <th className="px-5 py-3 text-center">{t('defects')}</th>
                                        <th className="px-5 py-3 text-center">{t('compliance')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {TRANSLATED_SUPPLIER_TABLE.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 ${isRTL ? 'text-right' : ''}`}>{row.name}</td>
                                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.inspections}</td>
                                            <td className="px-5 py-3 text-center font-medium text-red-500">{row.defects}</td>
                                            <td className="px-5 py-3 text-center font-bold text-gray-700 dark:text-gray-300">{row.compliance}</td>
                                            <td className={`px-5 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
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
                        <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('metrics_radar')}</h3>
                            <p className="text-xs text-gray-400">{t('quality_vs_other_kpis')}</p>
                        </div>
                        <ReactECharts option={radarOption} style={{ height: '300px', width: '100%' }} />
                    </div>
                )}

            </div>
        </div>
    );
};
