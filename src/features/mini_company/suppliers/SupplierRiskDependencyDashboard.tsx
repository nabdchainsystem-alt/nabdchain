import React, { useState, useMemo } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Warning, ShieldWarning, LinkBreak, TreeStructure, Users, Prohibit, Scales } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SupplierRiskDependencyInfo } from './SupplierRiskDependencyInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- KPI Data ---
const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '1', label: 'Single-Source', subtitle: 'Critical Components', value: '4', change: '+1', trend: 'down', icon: <LinkBreak size={18} />, sparklineData: [2, 3, 3, 3, 4, 4], color: 'blue' },
    { id: '2', label: 'Dependency %', subtitle: 'Max Concentration', value: '38%', change: '+5%', trend: 'down', icon: <Users size={18} />, sparklineData: [32, 33, 35, 36, 37, 38], color: 'blue' },
    { id: '3', label: 'High-Risk Suppliers', subtitle: 'Requires Action', value: '7', change: '+2', trend: 'down', icon: <Warning size={18} />, sparklineData: [4, 5, 5, 6, 6, 7], color: 'blue' },
    { id: '4', label: 'Risk Score', subtitle: 'Global Exposure', value: '42', change: '-2', trend: 'down', icon: <ShieldWarning size={18} />, sparklineData: [45, 44, 43, 42, 42, 42], color: 'blue' },
];

const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = [
    { id: '5', label: 'Disruption Events', subtitle: 'Last 12 Months', value: '3', change: '-1', trend: 'up', icon: <Prohibit size={18} />, sparklineData: [1, 2, 2, 3, 3, 3], color: 'blue' },
    { id: '6', label: 'Backup Coverage', subtitle: '% Critical Parts', value: '65%', change: '+5%', trend: 'up', icon: <TreeStructure size={18} />, sparklineData: [55, 60, 60, 62, 64, 65], color: 'blue' },
    { id: '7', label: 'Contract Expiry', subtitle: 'Next 90 Days', value: '5', change: '-3', trend: 'up', icon: <Scales size={18} />, color: 'blue' },
    { id: '8', label: 'Mitigation Plans', subtitle: 'Active Strategies', value: '12', change: '+2', trend: 'up', icon: <ShieldWarning size={18} />, sparklineData: [8, 9, 10, 10, 11, 12], color: 'blue' },
];

// --- Mock Data: Charts ---
const SPEND_CONCENTRATION = [
    { name: 'Acme Mfg', Spend: 38 },
    { name: 'Globex', Spend: 25 },
    { name: 'Soylent', Spend: 15 },
    { name: 'Initech', Spend: 12 },
    { name: 'Umbrella', Spend: 10 },
];

const RISK_SCORE_BY_SUPPLIER = [
    { name: 'Umbrella', Score: 85 },
    { name: 'Cyberdyne', Score: 78 },
    { name: 'Globex', Score: 60 },
    { name: 'Acme Mfg', Score: 45 },
    { name: 'Initech', Score: 20 },
];

const DEPENDENCY_LEVELS = [
    { value: 15, name: 'Critical (Single Source)', itemStyle: { color: '#ef4444' } },
    { value: 35, name: 'High (Dual Source)', itemStyle: { color: '#f59e0b' } },
    { value: 50, name: 'Low (Multi Source)', itemStyle: { color: '#10b981' } }
];

const RISK_CATEGORIES = [
    { value: 40, name: 'Geopolitical' },
    { value: 30, name: 'Financial' },
    { value: 20, name: 'Operational' },
    { value: 10, name: 'Compliance' }
];

// Network Graph Data (Mock)
const NETWORK_NODES = [
    { id: '0', name: 'Our Company', symbolSize: 50, category: 0 },
    { id: '1', name: 'Acme Mfg', symbolSize: 30, category: 1 },
    { id: '2', name: 'Globex', symbolSize: 25, category: 1 },
    { id: '3', name: 'Umbrella', symbolSize: 20, category: 1 },
    { id: '4', name: 'Sub-1', symbolSize: 15, category: 2 },
    { id: '5', name: 'Sub-2', symbolSize: 15, category: 2 },
    { id: '6', name: 'Sub-3', symbolSize: 15, category: 2 },
];

const NETWORK_LINKS = [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '0', target: '3' },
    { source: '1', target: '4' },
    { source: '1', target: '5' },
    { source: '2', target: '6' },
];

// Additional chart data
const MITIGATION_STATUS = [
    { value: 50, name: 'Implemented' },
    { value: 30, name: 'In Progress' },
    { value: 20, name: 'Planned' }
];

// Supplier Table
const SUPPLIER_TABLE = [
    { name: 'Acme Mfg', dependency: '38%', risk: 'Medium', backup: 'Approved', status: 'Stable' },
    { name: 'Globex Corp', dependency: '25%', risk: 'Medium', backup: 'Pending', status: 'Check' },
    { name: 'Umbrella Corp', dependency: '10%', risk: 'High', backup: 'None', status: 'Critical' },
    { name: 'Cyberdyne', dependency: '5%', risk: 'High', backup: 'None', status: 'Critical' },
    { name: 'Soylent Corp', dependency: '15%', risk: 'Low', backup: 'Approved', status: 'Stable' },
    { name: 'Initech', dependency: '12%', risk: 'Low', backup: 'Approved', status: 'Stable' },
];


export const SupplierRiskDependencyDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [showInfo, setShowInfo] = useState(false);
    const isLoading = useFirstMountLoading('supplier-risk-dependency-dashboard', 1200);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // Translated KPI data
    const TRANSLATED_TOP_KPIS = useMemo(() => [
        { id: '1', label: t('single_source'), subtitle: t('critical_components'), value: '4', change: '+1', trend: 'down' as const, icon: <LinkBreak size={18} />, sparklineData: [2, 3, 3, 3, 4, 4], color: 'blue' },
        { id: '2', label: t('dependency_pct'), subtitle: t('max_concentration'), value: '38%', change: '+5%', trend: 'down' as const, icon: <Users size={18} />, sparklineData: [32, 33, 35, 36, 37, 38], color: 'blue' },
        { id: '3', label: t('high_risk_suppliers'), subtitle: t('requires_action'), value: '7', change: '+2', trend: 'down' as const, icon: <Warning size={18} />, sparklineData: [4, 5, 5, 6, 6, 7], color: 'blue' },
        { id: '4', label: t('risk_score'), subtitle: t('global_exposure'), value: '42', change: '-2', trend: 'down' as const, icon: <ShieldWarning size={18} />, sparklineData: [45, 44, 43, 42, 42, 42], color: 'blue' },
    ], [t]);

    const TRANSLATED_SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('disruption_events'), subtitle: t('last_12_months'), value: '3', change: '-1', trend: 'up' as const, icon: <Prohibit size={18} />, sparklineData: [1, 2, 2, 3, 3, 3], color: 'blue' },
        { id: '6', label: t('backup_coverage'), subtitle: t('pct_critical_parts'), value: '65%', change: '+5%', trend: 'up' as const, icon: <TreeStructure size={18} />, sparklineData: [55, 60, 60, 62, 64, 65], color: 'blue' },
        { id: '7', label: t('contract_expiry'), subtitle: t('next_90_days'), value: '5', change: '-3', trend: 'up' as const, icon: <Scales size={18} />, color: 'blue' },
        { id: '8', label: t('mitigation_plans'), subtitle: t('active_strategies'), value: '12', change: '+2', trend: 'up' as const, icon: <ShieldWarning size={18} />, sparklineData: [8, 9, 10, 10, 11, 12], color: 'blue' },
    ], [t]);

    const TRANSLATED_SPEND_CONCENTRATION = useMemo(() => [
        { name: 'Acme Mfg', [t('spend')]: 38 },
        { name: 'Globex', [t('spend')]: 25 },
        { name: 'Soylent', [t('spend')]: 15 },
        { name: 'Initech', [t('spend')]: 12 },
        { name: 'Umbrella', [t('spend')]: 10 },
    ], [t]);

    const TRANSLATED_RISK_SCORE_BY_SUPPLIER = useMemo(() => [
        { name: 'Umbrella', [t('score')]: 85 },
        { name: 'Cyberdyne', [t('score')]: 78 },
        { name: 'Globex', [t('score')]: 60 },
        { name: 'Acme Mfg', [t('score')]: 45 },
        { name: 'Initech', [t('score')]: 20 },
    ], [t]);

    const TRANSLATED_DEPENDENCY_LEVELS = useMemo(() => [
        { value: 15, name: t('critical_single_source'), itemStyle: { color: '#ef4444' } },
        { value: 35, name: t('high_dual_source'), itemStyle: { color: '#f59e0b' } },
        { value: 50, name: t('low_multi_source'), itemStyle: { color: '#10b981' } }
    ], [t]);

    const TRANSLATED_RISK_CATEGORIES = useMemo(() => [
        { value: 40, name: t('geopolitical') },
        { value: 30, name: t('financial') },
        { value: 20, name: t('operational') },
        { value: 10, name: t('compliance') }
    ], [t]);

    const TRANSLATED_MITIGATION_STATUS = useMemo(() => [
        { value: 50, name: t('implemented') },
        { value: 30, name: t('in_progress') },
        { value: 20, name: t('planned') }
    ], [t]);

    const TRANSLATED_NETWORK_NODES = useMemo(() => [
        { id: '0', name: t('our_company'), symbolSize: 50, category: 0 },
        { id: '1', name: 'Acme Mfg', symbolSize: 30, category: 1 },
        { id: '2', name: 'Globex', symbolSize: 25, category: 1 },
        { id: '3', name: 'Umbrella', symbolSize: 20, category: 1 },
        { id: '4', name: t('sub_1'), symbolSize: 15, category: 2 },
        { id: '5', name: t('sub_2'), symbolSize: 15, category: 2 },
        { id: '6', name: t('sub_3'), symbolSize: 15, category: 2 },
    ], [t]);

    const TRANSLATED_SUPPLIER_TABLE = useMemo(() => [
        { name: 'Acme Mfg', dependency: '38%', risk: t('medium'), backup: t('approved'), status: t('stable') },
        { name: 'Globex Corp', dependency: '25%', risk: t('medium'), backup: t('pending'), status: t('check') },
        { name: 'Umbrella Corp', dependency: '10%', risk: t('high'), backup: t('none'), status: t('critical') },
        { name: 'Cyberdyne', dependency: '5%', risk: t('high'), backup: t('none'), status: t('critical') },
        { name: 'Soylent Corp', dependency: '15%', risk: t('low'), backup: t('approved'), status: t('stable') },
        { name: 'Initech', dependency: '12%', risk: t('low'), backup: t('approved'), status: t('stable') },
    ], [t]);

    // --- ECharts Options ---

    // Pie: Dependency
    const dependencyPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { show: false },
        series: [{
            name: t('dependency'),
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TRANSLATED_DEPENDENCY_LEVELS
        }]
    };

    // Pie: Risk Categories
    const riskPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { show: false },
        series: [{
            name: t('risk_type'),
            type: 'pie',
            radius: '70%',
            center: ['50%', '50%'],
            data: TRANSLATED_RISK_CATEGORIES
        }]
    };

    // Mitigation Status Pie
    const mitigationPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: TRANSLATED_MITIGATION_STATUS,
            color: ['#10b981', '#3b82f6', '#f59e0b']
        }]
    };

    // Network Graph
    const networkOption: EChartsOption = {
        tooltip: {},
        legend: [{ data: [t('company'), t('tier_1'), t('tier_2')] }],
        animationDuration: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [{
            type: 'graph',
            layout: 'force',
            data: TRANSLATED_NETWORK_NODES.map(node => ({ ...node, itemStyle: node.category === 0 ? { color: '#3b82f6' } : node.category === 1 ? { color: '#10b981' } : { color: '#9ca3af' } })),
            links: NETWORK_LINKS,
            roam: true,
            label: { position: isRTL ? 'left' : 'right', formatter: '{b}' },
            force: { repulsion: 200 }
        }]
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierRiskDependencyInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <ShieldWarning size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('risk_dependency')}</h1>
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
                            <ChartSkeleton height="h-[300px]" title={t('exposure_analysis')} />
                        </div>
                        <div className="col-span-2">
                            <ChartSkeleton height="h-[300px]" title={t('risk_scores')} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('exposure_analysis')}</h3>
                                <p className="text-xs text-gray-400">{t('dependency_vs_risk')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={TRANSLATED_SPEND_CONCENTRATION} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} reversed={isRTL} />
                                        <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} orientation={isRTL ? 'right' : 'left'} />
                                        <Tooltip cursor={{ fill: '#f9fafb' }} />
                                        <Bar dataKey={t('spend')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} name={t('dependency_pct')} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('risk_scores')}</h3>
                                <p className="text-xs text-gray-400">{t('by_supplier')}</p>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={TRANSLATED_RISK_SCORE_BY_SUPPLIER} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
                            <div className="grid grid-cols-2 gap-4">
                                <PieChartSkeleton title={t('sourcing_mix')} />
                                <PieChartSkeleton title={t('risk_types')} />
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
                                <h3 className={`text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2 ${isRTL ? 'text-right' : ''}`}>{t('sourcing_mix')}</h3>
                                <MemoizedChart option={dependencyPieOption} style={{ height: '180px' }} />
                            </div>
                            <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                                <h3 className={`text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2 ${isRTL ? 'text-right' : ''}`}>{t('risk_types')}</h3>
                                <MemoizedChart option={riskPieOption} style={{ height: '180px' }} />
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
                            <ChartSkeleton height="h-[300px]" title={t('dependency_map')} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`p-5 border-b border-gray-100 dark:border-gray-700 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('dependency_details')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table dir={dir} className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className={`px-5 py-3 ${isRTL ? 'text-right' : ''}`}>{t('supplier')}</th>
                                            <th className="px-5 py-3 text-center">{t('dependency')}</th>
                                            <th className="px-5 py-3 text-center">{t('risk')}</th>
                                            <th className="px-5 py-3 text-center">{t('backup')}</th>
                                            <th className={`px-5 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {TRANSLATED_SUPPLIER_TABLE.map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 ${isRTL ? 'text-right' : ''}`}>{row.name}</td>
                                                <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.dependency}</td>
                                                <td className="px-5 py-3 text-center font-medium text-amber-500">{row.risk}</td>
                                                <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.backup}</td>
                                                <td className={`px-5 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.status === t('critical') ? 'bg-red-100 text-red-700' :
                                                        row.status === t('check') ? 'bg-yellow-100 text-yellow-700' :
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

                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('dependency_map')}</h3>
                                <p className="text-xs text-gray-400">{t('multi_tier_view')}</p>
                            </div>
                            <MemoizedChart option={networkOption} style={{ height: '300px', width: '100%' }} />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
