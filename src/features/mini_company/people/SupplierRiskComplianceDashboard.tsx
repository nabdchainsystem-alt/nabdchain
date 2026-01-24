import React, { useState, useMemo } from 'react';
import { useFirstMountLoading } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, Shield, Warning, CheckCircle, FileText, Medal, Scales, ShieldCheck, Clock } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SupplierRiskComplianceInfo } from './SupplierRiskComplianceInfo';
import { useLanguage } from '../../../contexts/LanguageContext';

const RISK_TABLE_DATA = [
    { id: 'S-001', name: 'MetalWorks Inc', riskLevel: 'high', riskScore: 78, issues: 5, lastAudit: '45 days ago', certExpiry: '30 days' },
    { id: 'S-002', name: 'ChemSupply Co', riskLevel: 'high', riskScore: 72, issues: 4, lastAudit: '60 days ago', certExpiry: '15 days' },
    { id: 'S-003', name: 'PackPro Solutions', riskLevel: 'medium', riskScore: 55, issues: 2, lastAudit: '30 days ago', certExpiry: '90 days' },
    { id: 'S-004', name: 'FlexParts Ltd', riskLevel: 'medium', riskScore: 48, issues: 2, lastAudit: '25 days ago', certExpiry: '120 days' },
    { id: 'S-005', name: 'Global Materials Co', riskLevel: 'low', riskScore: 22, issues: 0, lastAudit: '10 days ago', certExpiry: '365 days' },
];

export const SupplierRiskComplianceDashboard: React.FC = () => {
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [showInfo, setShowInfo] = useState(false);

    const TOP_KPIS = useMemo(() => [
        { id: '1', label: t('compliance_rate'), subtitle: t('all_suppliers'), value: '94.2%', change: '+1.2%', trend: 'up' as const, icon: <Shield size={18} />, sparklineData: [91, 92, 93, 93.5, 94, 94.2], color: 'blue' },
        { id: '2', label: t('high_risk_suppliers'), subtitle: t('require_action'), value: '8', change: '-2', trend: 'up' as const, icon: <Warning size={18} />, sparklineData: [12, 11, 10, 10, 9, 8], color: 'blue' },
        { id: '3', label: t('certifications_valid'), subtitle: t('iso_quality'), value: '142', change: '+5', trend: 'up' as const, icon: <Medal size={18} />, sparklineData: [130, 134, 136, 138, 140, 142], color: 'blue' },
        { id: '4', label: t('pending_audits'), subtitle: t('scheduled'), value: '12', change: '-3', trend: 'up' as const, icon: <FileText size={18} />, sparklineData: [18, 16, 15, 14, 13, 12], color: 'blue' },
    ], [t]);

    const SIDE_KPIS = useMemo(() => [
        { id: '5', label: t('audit_completion'), subtitle: t('this_quarter'), value: '87%', change: '+5%', trend: 'up' as const, icon: <CheckCircle size={18} />, sparklineData: [78, 80, 82, 84, 86, 87], color: 'blue' },
        { id: '6', label: t('contract_compliance'), subtitle: t('terms_met'), value: '96.5%', change: '+0.8%', trend: 'up' as const, icon: <Scales size={18} />, sparklineData: [94, 94.5, 95, 95.5, 96, 96.5], color: 'blue' },
        { id: '7', label: t('incidents_resolved'), subtitle: t('this_month'), value: '23', change: '+8', trend: 'up' as const, icon: <ShieldCheck size={18} />, sparklineData: [12, 15, 17, 19, 21, 23], color: 'blue' },
        { id: '8', label: t('avg_resolution_time'), subtitle: t('days'), value: '3.2d', change: '-0.5d', trend: 'up' as const, icon: <Clock size={18} />, sparklineData: [4.5, 4.2, 4.0, 3.8, 3.5, 3.2], color: 'blue' },
    ], [t]);

    const RISK_DISTRIBUTION = useMemo(() => [
        { value: 8, name: t('high_risk') },
        { value: 24, name: t('medium_risk') },
        { value: 124, name: t('low_risk') }
    ], [t]);

    const COMPLIANCE_BY_CATEGORY = useMemo(() => [
        { name: t('quality_standards'), value: 98 },
        { name: t('environmental'), value: 92 },
        { name: t('safety'), value: 96 },
        { name: t('ethical'), value: 89 },
        { name: t('financial'), value: 94 },
    ], [t]);

    const RISK_TREND = useMemo(() => [
        { name: t('jan'), High: 15, Medium: 30, Low: 111 },
        { name: t('feb'), High: 14, Medium: 28, Low: 114 },
        { name: t('mar'), High: 12, Medium: 26, Low: 118 },
        { name: t('apr'), High: 11, Medium: 25, Low: 120 },
        { name: t('may'), High: 9, Medium: 24, Low: 123 },
        { name: t('jun'), High: 8, Medium: 24, Low: 124 },
    ], [t]);

    const isLoading = useFirstMountLoading('supplier-risk-compliance-dashboard', 1200);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    const riskPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: RISK_DISTRIBUTION,
            color: ['#ef4444', '#f59e0b', '#10b981']
        }]
    };

    const complianceColors = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444'];

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative" dir={dir}>
            <SupplierRiskComplianceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <Shield size={28} className="text-indigo-600 dark:text-indigo-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('risk_compliance')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('risk_compliance_desc')}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button onClick={toggleFullScreen} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md" title={t('full_screen')}>
                        <ArrowsOut size={18} />
                    </button>
                    <button onClick={() => setShowInfo(true)} className={`flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Info size={18} className="text-indigo-500" />
                        {t('about_dashboard')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Top KPIs */}
                {TOP_KPIS.map((kpi, index) => (
                    <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                        <KPICard {...kpi} color="blue" loading={isLoading} />
                    </div>
                ))}

                {/* Risk Trend Chart */}
                {isLoading ? (
                    <div className="col-span-2"><ChartSkeleton height="h-[300px]" title={t('risk_trend')} /></div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('risk_trend')}</h3>
                            <p className="text-xs text-gray-400">{t('suppliers_by_risk_level')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={RISK_TREND} margin={{ top: 5, right: isRTL ? 10 : 30, left: isRTL ? 30 : 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} reversed={isRTL} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} orientation={isRTL ? 'right' : 'left'} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Bar dataKey="High" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Medium" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Low" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Compliance by Category */}
                {isLoading ? (
                    <div className="col-span-2"><ChartSkeleton height="h-[300px]" title={t('compliance_by_category')} /></div>
                ) : (
                    <div className="col-span-1 md:col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('compliance_by_category')}</h3>
                            <p className="text-xs text-gray-400">{t('compliance_percentage')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={COMPLIANCE_BY_CATEGORY} layout="vertical" margin={{ top: 5, right: isRTL ? 10 : 30, left: isRTL ? 30 : 80, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" domain={[0, 100]} fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis dataKey="name" type="category" fontSize={10} tick={{ fill: '#9ca3af' }} width={70} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {COMPLIANCE_BY_CATEGORY.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={complianceColors[index % complianceColors.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Risk Distribution Pie + KPIs */}
                {isLoading ? (
                    <div className="col-span-2"><PieChartSkeleton title={t('risk_distribution')} /></div>
                ) : (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                            <div className={`mb-2 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('risk_distribution')}</h3>
                                <p className="text-xs text-gray-400">{t('by_risk_level')}</p>
                            </div>
                            <MemoizedChart option={riskPieOption} style={{ height: '180px' }} />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {SIDE_KPIS.slice(0, 2).map((kpi, index) => (
                                <div key={kpi.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard {...kpi} color="blue" className="h-full" loading={isLoading} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* More KPIs */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                    {SIDE_KPIS.slice(2, 4).map((kpi, index) => (
                        <div key={kpi.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard {...kpi} color="blue" className="h-full" loading={isLoading} />
                        </div>
                    ))}
                </div>

                {/* Risk Table */}
                {isLoading ? (
                    <div className="col-span-4"><TableSkeleton rows={5} columns={6} /></div>
                ) : (
                    <div className="col-span-1 md:col-span-4 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className={`p-5 border-b border-gray-100 dark:border-gray-700 ${isRTL ? 'text-right' : ''}`}>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('high_risk_suppliers')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" dir={dir}>
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-right' : 'text-start'}`}>{t('supplier')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-right' : 'text-start'}`}>{t('risk_level')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-start' : 'text-end'}`}>{t('risk_score')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-start' : 'text-end'}`}>{t('open_issues')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-start' : 'text-end'}`}>{t('last_audit')}</th>
                                        <th className={`px-5 py-3 ${isRTL ? 'text-start' : 'text-end'}`}>{t('cert_expiry')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {RISK_TABLE_DATA.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 ${isRTL ? 'text-right' : ''}`}>
                                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">{row.name.charAt(0)}</div>
                                                    {row.name}
                                                </div>
                                            </td>
                                            <td className={`px-5 py-3 ${isRTL ? 'text-right' : ''}`}>
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.riskLevel === 'high' ? 'bg-red-100 text-red-700' : row.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                    {t(row.riskLevel)}
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3 ${isRTL ? 'text-start' : 'text-end'}`}>
                                                <span className={`font-medium ${row.riskScore >= 70 ? 'text-red-600' : row.riskScore >= 40 ? 'text-amber-600' : 'text-green-600'}`}>{row.riskScore}</span>
                                            </td>
                                            <td className={`px-5 py-3 text-gray-600 dark:text-gray-400 ${isRTL ? 'text-start' : 'text-end'}`}>{row.issues}</td>
                                            <td className={`px-5 py-3 text-gray-500 dark:text-gray-400 text-xs ${isRTL ? 'text-start' : 'text-end'}`}>{row.lastAudit}</td>
                                            <td className={`px-5 py-3 text-xs ${isRTL ? 'text-start' : 'text-end'}`}>
                                                <span className={`font-medium ${parseInt(row.certExpiry) <= 30 ? 'text-red-600' : parseInt(row.certExpiry) <= 90 ? 'text-amber-600' : 'text-gray-500'}`}>{row.certExpiry}</span>
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
