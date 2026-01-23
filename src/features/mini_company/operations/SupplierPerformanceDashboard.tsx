import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { Users, Truck, Clock, CurrencyDollar, ShieldWarning, Warning, Star, Info, ArrowsOut, ChartPieSlice } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SupplierPerformanceInfo } from './SupplierPerformanceInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS_SEQUENCE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- Mock Data: Charts ---
const SPEND_PER_SUPPLIER = [
    { name: 'TechCorp', value: 125000 },
    { name: 'OfficeMax', value: 85000 },
    { name: 'LogisticsInc', value: 65000 },
    { name: 'SoftSol', value: 55000 },
    { name: 'BuildIt', value: 42000 },
];

const LEAD_TIME_PER_SUPPLIER = [
    { name: 'TechCorp', value: 12 },
    { name: 'OfficeMax', value: 5 },
    { name: 'LogisticsInc', value: 18 },
    { name: 'SoftSol', value: 2 },
    { name: 'BuildIt', value: 25 },
];

// --- Mock Data: Table & Scatter ---
const SUPPLIER_DETAILS = [
    { id: 1, name: 'TechCorp', spend: 125000, leadTime: 12, onTime: 95, risk: 'Low', riskScore: 20 },
    { id: 2, name: 'OfficeMax', spend: 85000, leadTime: 5, onTime: 98, risk: 'Low', riskScore: 15 },
    { id: 3, name: 'LogisticsInc', spend: 65000, leadTime: 18, onTime: 85, risk: 'Medium', riskScore: 55 },
    { id: 4, name: 'SoftSol Global', spend: 55000, leadTime: 2, onTime: 99, risk: 'Low', riskScore: 10 },
    { id: 5, name: 'BuildIt Now', spend: 42000, leadTime: 25, onTime: 75, risk: 'High', riskScore: 85 },
    { id: 6, name: 'Global Parts', spend: 35000, leadTime: 35, onTime: 65, risk: 'High', riskScore: 90 },
    { id: 7, name: 'Local Supply', spend: 20000, leadTime: 3, onTime: 96, risk: 'Low', riskScore: 12 },
    { id: 8, name: 'Mediocre Inc', spend: 15000, leadTime: 15, onTime: 80, risk: 'Medium', riskScore: 45 },
];

export const SupplierPerformanceDashboard: React.FC = () => {
    const { currency, t } = useAppContext();
    const [showInfo, setShowInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- KPI Data ---
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '1', label: t('total_suppliers'), subtitle: t('active_suppliers'), value: '38', change: '+2', trend: 'up', icon: <Users size={18} />, sparklineData: [32, 34, 34, 35, 36, 37, 38] },
        { id: '2', label: t('on_time_delivery_pct'), subtitle: t('performance'), value: '92.4%', change: '-1.2%', trend: 'down', icon: <Truck size={18} />, sparklineData: [95, 94, 93, 94, 93, 92, 92.4] },
        { id: '3', label: t('avg_lead_time'), subtitle: t('days_to_deliver'), value: '14.2d', change: '-0.5d', trend: 'up', icon: <Clock size={18} />, sparklineData: [16, 15.5, 15, 14.8, 14.5, 14.3, 14.2] },
        { id: '4', label: t('cost_variance'), subtitle: t('actual_vs_std'), value: '+3.5%', change: '+0.5%', trend: 'down', icon: <CurrencyDollar size={18} />, sparklineData: [2, 2.5, 3, 2.8, 3.2, 3.4, 3.5] },
    ];

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
        { id: '5', label: t('dependency_index'), subtitle: t('risk_0_100'), value: '65', change: '+5', trend: 'down', icon: <ShieldWarning size={18} />, sparklineData: [55, 58, 60, 62, 63, 64, 65] },
        { id: '6', label: t('dispute_rate'), subtitle: t('issues_per_orders'), value: '2.1%', change: '-0.4%', trend: 'up', icon: <Warning size={18} />, sparklineData: [3.5, 3, 2.8, 2.5, 2.4, 2.2, 2.1] },
        { id: '7', label: t('preferred_suppliers'), subtitle: t('strategic_partners'), value: '8', change: '0', trend: 'neutral', icon: <Star size={18} />, sparklineData: [6, 6, 7, 7, 8, 8, 8] },
        { id: '8', label: t('supplier_concentration'), subtitle: t('top_3_spend_pct'), value: '73%', change: '-2%', trend: 'up', icon: <ChartPieSlice size={18} />, sparklineData: [78, 77, 76, 75, 74, 73.5, 73] },
    ];

    const RISK_DISTRIBUTION = [
        { name: t('low_risk'), value: 25 },
        { name: t('medium_risk'), value: 10 },
        { name: t('high_risk'), value: 3 },
    ];

    // --- ECharts Options ---

    // Pie Chart: Risk Distribution
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: RISK_DISTRIBUTION.map((d) => ({
                ...d,
                itemStyle: {
                    color: d.name === t('low_risk') ? '#10b981' :
                        d.name === t('medium_risk') ? '#f59e0b' : '#ef4444'
                }
            }))
        }]
    };

    // Scatter Matrix: Spend (X) vs Lead Time (Y) vs Risk (Bubble Size/Color)
    const scatterOption: EChartsOption = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `<b>${params.data[3]}</b><br/>${t('spend')}: ${formatCurrency(params.data[0], currency.code, currency.symbol)}<br/>${t('lead_time')}: ${params.data[1]} ${t('days')}<br/>${t('risk_score')}: ${params.data[2]}`;
            }
        },
        grid: { top: 10, right: 20, bottom: 5, left: 10, containLabel: true },
        xAxis: { type: 'value', name: t('spend'), nameLocation: 'middle', nameGap: 20, splitLine: { lineStyle: { type: 'dashed' } } },
        yAxis: { type: 'value', name: t('lead_time_days'), nameLocation: 'middle', nameGap: 25, splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{
            type: 'scatter',
            symbolSize: (data: any) => Math.max(10, data[2] / 2), // Bubble size based on Risk Score
            data: SUPPLIER_DETAILS.map(s => [
                s.spend,
                s.leadTime,
                s.riskScore,
                s.name,
                s.risk // 4th index for color mapping
            ]),
            itemStyle: {
                color: (params: any) => {
                    const risk = params.data[4];
                    return risk === 'High' ? '#ef4444' : risk === 'Medium' ? '#f59e0b' : '#10b981';
                },
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
        }]
    };

    const getRiskLabel = (risk: string) => {
        switch (risk) {
            case 'Low': return t('low');
            case 'Medium': return t('medium');
            case 'High': return t('high');
            default: return risk;
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SupplierPerformanceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2 text-start">
                    <Truck size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('supplier_performance')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('supplier_performance_subtitle')}</p>
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
                {TOP_KPIS.map((kpi) => (
                    <div key={kpi.id} className="col-span-1">
                        <KPICard
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                            color="blue"
                            loading={isLoading}
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Charts Side by Side --- */}

                {/* Recharts: Spend per Supplier */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('spend_per_supplier')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('spend_per_supplier')}</h3>
                            <p className="text-xs text-gray-400">{t('total_volume_by_partner')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={SPEND_PER_SUPPLIER} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(val: number) => formatCurrency(val, currency.code, currency.symbol)}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Recharts: Lead Time per Supplier */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[300px]" title={t('lead_time_days')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
                        <div className="mb-4 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('lead_time_days')}</h3>
                            <p className="text-xs text-gray-400">{t('speed_of_delivery_breakdown')}</p>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={LEAD_TIME_PER_SUPPLIER} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

                {/* Left: Two Charts in Nested Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {/* ECharts: Risk Distribution */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('risk_distribution')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('risk_distribution')}</h3>
                                <p className="text-xs text-gray-400">{t('suppliers_by_risk_category')}</p>
                            </div>
                            <ReactECharts option={pieOption} style={{ height: '180px' }} />
                        </div>
                    )}

                    {/* Performance Status Card */}
                    {isLoading ? (
                        <PieChartSkeleton title={t('performance_status')} />
                    ) : (
                        <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px] flex flex-col">
                            <div className="mb-2 text-start">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('performance_status')}</h3>
                                <p className="text-xs text-gray-400">{t('overall_supplier_health_summary')}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center flex-1">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-2">
                                    <Star className="text-blue-500" size={28} weight="duotone" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 px-4">
                                    {t('supplier_health_stable_msg')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Side KPIs in 2x2 Grid */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
                    {SIDE_KPIS.map((kpi, index) => (
                        <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
                            <KPICard
                                {...kpi}
                                value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
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
                        <TableSkeleton rows={8} columns={5} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('supplier_performance_metrics')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3 text-start">{t('supplier_name')}</th>
                                        <th className="px-5 py-3 text-end">{t('total_spend')}</th>
                                        <th className="px-5 py-3 text-end">{t('avg_del_days')}</th>
                                        <th className="px-5 py-3 text-end">{t('on_time_pct')}</th>
                                        <th className="px-5 py-3 text-center">{t('risk_level')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {SUPPLIER_DETAILS.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{s.name}</td>
                                            <td className="px-5 py-3 text-end font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(s.spend, currency.code, currency.symbol)}
                                            </td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{s.leadTime}</td>
                                            <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{s.onTime}%</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${s.risk === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    s.risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    {getRiskLabel(s.risk)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Companion Chart: Scatter Matrix (2 cols) */}
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <ChartSkeleton height="h-[280px]" title={t('risk_vs_value_matrix')} />
                    </div>
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up h-full flex flex-col">
                        <div className="p-4 mb-1 text-start">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('risk_vs_value_matrix')}</h3>
                            <p className="text-xs text-gray-400">{t('spend_vs_lead_time_risk')}</p>
                        </div>
                        <div className="flex-1 w-full min-h-0 px-2 pb-2">
                            <ReactECharts option={scatterOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
