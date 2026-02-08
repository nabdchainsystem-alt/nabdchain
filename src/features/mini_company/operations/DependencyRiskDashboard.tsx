import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
  ArrowsOut,
  ArrowsIn,
  Info,
  ShieldWarning,
  Warning,
  LinkBreak,
  UserSwitch,
  CurrencyDollar,
  Compass,
} from 'phosphor-react';
import { DependencyRiskInfo } from './DependencyRiskInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Mock Data: Charts ---
const DEPENDENCY_BY_CATEGORY = [
  { name: 'Electronics', primary: 80, secondary: 20 },
  { name: 'Office', primary: 60, secondary: 40 },
  { name: 'Hardware', primary: 90, secondary: 10 },
  { name: 'Services', primary: 50, secondary: 50 },
  { name: 'Furniture', primary: 100, secondary: 0 },
];

// Risk Trend Over Time
const RISK_TREND = [
  { name: 'Jan', high: 15, medium: 25, low: 55 },
  { name: 'Feb', high: 14, medium: 26, low: 56 },
  { name: 'Mar', high: 13, medium: 27, low: 58 },
  { name: 'Apr', high: 12, medium: 28, low: 58 },
  { name: 'May', high: 12, medium: 28, low: 60 },
  { name: 'Jun', high: 12, medium: 28, low: 60 },
];

// Diversification Score by Category
const DIVERSIFICATION_SCORES = [
  { name: 'Electronics', value: 35 },
  { name: 'Office', value: 65 },
  { name: 'Hardware', value: 25 },
  { name: 'Services', value: 80 },
  { name: 'Furniture', value: 0 },
];

// --- Mock Data: Table & Network ---
const RISK_DETAILS = [
  { id: 1, supplier: 'TechCorp', category: 'Electronics', dependency: '80%', riskScore: 75, alert: 'High' },
  { id: 2, supplier: 'OfficeMax', category: 'Office', dependency: '60%', riskScore: 20, alert: 'Low' },
  { id: 3, supplier: 'CloudSvcs', category: 'Services', dependency: '50%', riskScore: 45, alert: 'Medium' },
  { id: 4, supplier: 'SoloDesk', category: 'Furniture', dependency: '100%', riskScore: 88, alert: 'Critical' },
  { id: 5, supplier: 'NetGear', category: 'Hardware', dependency: '90%', riskScore: 30, alert: 'Low' },
];

// Network Graph Data
const GRAPH_NODES = [
  { name: 'Electronics', symbolSize: 20, category: 0 },
  { name: 'Office', symbolSize: 15, category: 0 },
  { name: 'Hardware', symbolSize: 18, category: 0 },
  { name: 'Services', symbolSize: 25, category: 0 },
  { name: 'Furniture', symbolSize: 10, category: 0 },
  { name: 'TechCorp', symbolSize: 25, category: 1 },
  { name: 'OfficeMax', symbolSize: 15, category: 1 },
  { name: 'CloudSvcs', symbolSize: 20, category: 1 },
  { name: 'SoloDesk', symbolSize: 10, category: 1 },
  { name: 'NetGear', symbolSize: 18, category: 1 },
  { name: 'GlobalParts', symbolSize: 12, category: 1 },
];

const GRAPH_LINKS = [
  { source: 'Electronics', target: 'TechCorp' },
  { source: 'Electronics', target: 'GlobalParts' },
  { source: 'Office', target: 'OfficeMax' },
  { source: 'Hardware', target: 'NetGear' },
  { source: 'Services', target: 'CloudSvcs' },
  { source: 'Furniture', target: 'SoloDesk' },
];

export const DependencyRiskDashboard: React.FC = () => {
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

  const toggleFullScreen = () => {
    window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
  };

  // --- KPI Data ---
  const TOP_KPIS = useMemo(
    () => [
      {
        id: '1',
        label: t('dependency_ratio'),
        subtitle: t('top_5_concentration'),
        value: '45%',
        change: '-2%',
        trend: 'up' as const,
        icon: <LinkBreak size={18} />,
        sparklineData: [48, 47, 46, 46, 45, 45, 45],
      },
      {
        id: '2',
        label: t('single_source_cats'),
        subtitle: t('no_backup'),
        value: '3',
        change: '0',
        trend: 'neutral' as const,
        icon: <Warning size={18} />,
        sparklineData: [3, 3, 3, 3, 3, 3, 3],
      },
      {
        id: '3',
        label: t('risk_exposure'),
        subtitle: t('high_risk_spend'),
        value: '18%',
        change: '+1%',
        trend: 'down' as const,
        icon: <ShieldWarning size={18} />,
        sparklineData: [15, 16, 17, 18, 18, 18, 18],
      },
      {
        id: '4',
        label: t('stability_score'),
        subtitle: t('supply_chain_health'),
        value: '82/100',
        change: '+2',
        trend: 'up' as const,
        icon: <Compass size={18} />,
        sparklineData: [78, 79, 80, 81, 80, 81, 82],
      },
    ],
    [t],
  );

  const SIDE_KPIS = useMemo(
    () => [
      {
        id: '5',
        label: t('backup_suppliers'),
        subtitle: t('avg_per_category'),
        value: '1.8',
        change: '+0.1',
        trend: 'up' as const,
        icon: <UserSwitch size={18} />,
        sparklineData: [1.5, 1.5, 1.6, 1.6, 1.7, 1.7, 1.8],
      },
      {
        id: '6',
        label: t('avg_switching_cost'),
        subtitle: t('est_impact'),
        value: '0',
        rawValue: 12000,
        isCurrency: true,
        change: '0',
        trend: 'neutral' as const,
        icon: <CurrencyDollar size={18} />,
        sparklineData: [12, 12, 12, 12, 12, 12, 12],
      },
      {
        id: '7',
        label: t('active_risk_alerts'),
        subtitle: t('critical_issues'),
        value: '2',
        change: '+1',
        trend: 'down' as const,
        icon: <Warning size={18} />,
        sparklineData: [0, 0, 1, 1, 1, 2, 2],
      },
      {
        id: '8',
        label: t('mitigation_progress'),
        subtitle: t('actions_completed'),
        value: '72%',
        change: '+8%',
        trend: 'up' as const,
        icon: <Compass size={18} />,
        sparklineData: [58, 62, 64, 66, 68, 70, 72],
      },
    ],
    [t],
  );

  const RISK_LEVELS = useMemo(
    () => [
      { value: 12, name: t('high_risk') },
      { value: 28, name: t('medium_risk') },
      { value: 60, name: t('low_risk') },
    ],
    [t],
  );

  // --- ECharts Options ---

  // Bar Chart - Dependency by Category (stacked)
  const dependencyByCategoryOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, data: [t('primary'), t('backup')] },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: DEPENDENCY_BY_CATEGORY.map((d) => d.name),
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
          name: t('primary'),
          type: 'bar',
          stack: 'total',
          data: DEPENDENCY_BY_CATEGORY.map((d) => d.primary),
          itemStyle: { color: '#3b82f6', borderRadius: [0, 0, 0, 0] },
          barWidth: 12,
        },
        {
          name: t('backup'),
          type: 'bar',
          stack: 'total',
          data: DEPENDENCY_BY_CATEGORY.map((d) => d.secondary),
          itemStyle: { color: '#d1d5db', borderRadius: [4, 4, 0, 0] },
          barWidth: 12,
        },
      ],
    }),
    [isRTL, t],
  );

  // Bar Chart - Risk Trend (stacked)
  const riskTrendOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, data: [t('high'), t('medium'), t('low')] },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: RISK_TREND.map((d) => d.name),
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
          name: t('high'),
          type: 'bar',
          stack: 'total',
          data: RISK_TREND.map((d) => d.high),
          itemStyle: { color: '#ef4444' },
          barWidth: 20,
        },
        {
          name: t('medium'),
          type: 'bar',
          stack: 'total',
          data: RISK_TREND.map((d) => d.medium),
          itemStyle: { color: '#f59e0b' },
          barWidth: 20,
        },
        {
          name: t('low'),
          type: 'bar',
          stack: 'total',
          data: RISK_TREND.map((d) => d.low),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
          barWidth: 20,
        },
      ],
    }),
    [isRTL, t],
  );

  // Pie Chart - Risk Distribution
  const pieOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}  {c}' },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        itemWidth: 6,
        itemHeight: 6,
        itemGap: 4,
        textStyle: { fontSize: 8 },
        selectedMode: 'multiple',
      },
      series: [
        {
          type: 'pie',
          selectedMode: 'multiple',
          radius: '65%',
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: false } },
          data: RISK_LEVELS.map((d) => ({
            ...d,
            itemStyle: {
              color: d.name === t('high_risk') ? '#ef4444' : d.name === t('medium_risk') ? '#f59e0b' : '#10b981',
            },
          })),
        },
      ],
    }),
    [RISK_LEVELS, t],
  );

  // Pie Chart - Diversification Scores
  const diversificationPieOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: `{b}: {c}% ${t('diversified')}` },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        itemWidth: 6,
        itemHeight: 6,
        itemGap: 4,
        textStyle: { fontSize: 8 },
        selectedMode: 'multiple',
      },
      series: [
        {
          type: 'pie',
          selectedMode: 'multiple',
          radius: '65%',
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: false } },
          data: DIVERSIFICATION_SCORES,
          color: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
        },
      ],
    }),
    [t],
  );

  // Network Graph
  const graphOption: EChartsOption = useMemo(
    () => ({
      title: { text: t('supply_chain_network'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
      tooltip: {},
      legend: { data: [t('categories'), t('suppliers')], bottom: 0 },
      series: [
        {
          type: 'graph',
          layout: 'force',
          top: 30,
          bottom: 30,
          categories: [{ name: t('categories') }, { name: t('suppliers') }],
          data: GRAPH_NODES.map((n) => ({ ...n, itemStyle: { color: n.category === 0 ? '#3b82f6' : '#8b5cf6' } })),
          links: GRAPH_LINKS,
          roam: true,
          label: { show: true, position: 'right', fontSize: 10 },
          force: { repulsion: 150, edgeLength: 60 },
          lineStyle: { color: 'source', curveness: 0.3 },
        },
      ],
    }),
    [t],
  );

  const getAlertLabel = (alert: string) => {
    switch (alert) {
      case 'Critical':
        return t('critical');
      case 'High':
        return t('high');
      case 'Medium':
        return t('medium');
      case 'Low':
        return t('low');
      default:
        return alert;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
      <DependencyRiskInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-2 text-start">
          <ShieldWarning size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('dependency_risk')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dependency_risk_subtitle')}</p>
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
              value={
                kpi.isCurrency && kpi.rawValue
                  ? formatCurrency(kpi.rawValue, currency.code, currency.symbol)
                  : kpi.value
              }
              color="blue"
              loading={isLoading}
            />
          </div>
        ))}

        {/* --- Row 2: Two Charts Side by Side --- */}

        {/* ECharts - Dependency by Category */}
        {isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <ChartSkeleton height="h-[300px]" title={t('dependency_by_category')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
            <div className="mb-4 text-start">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('dependency_by_category')}
              </h3>
              <p className="text-xs text-gray-400">{t('primary_vs_secondary_share')}</p>
            </div>
            <div className="h-[220px] w-full">
              <MemoizedChart option={dependencyByCategoryOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        )}

        {/* ECharts - Risk Trend */}
        {isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <ChartSkeleton height="h-[300px]" title={t('risk_trend')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
            <div className="mb-4 text-start">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('risk_trend')}
              </h3>
              <p className="text-xs text-gray-400">{t('monthly_risk_distribution')}</p>
            </div>
            <div className="h-[220px] w-full">
              <MemoizedChart option={riskTrendOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        )}

        {/* --- Row 3: Two Charts + 4 Side KPIs in 2x2 Grid --- */}

        {/* Left: Two Charts in Nested Grid */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
          {/* ECharts - Risk Distribution */}
          {isLoading ? (
            <PieChartSkeleton title={t('risk_distribution')} />
          ) : (
            <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
              <div className="mb-2 text-start">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('risk_distribution')}
                </h3>
                <p className="text-xs text-gray-400">{t('supplier_classification')}</p>
              </div>
              <MemoizedChart option={pieOption} style={{ height: '180px' }} />
            </div>
          )}

          {/* ECharts - Diversification Score */}
          {isLoading ? (
            <PieChartSkeleton title={t('diversification_score')} />
          ) : (
            <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
              <div className="mb-2 text-start">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('diversification_score')}
                </h3>
                <p className="text-xs text-gray-400">{t('by_category_coverage')}</p>
              </div>
              <MemoizedChart option={diversificationPieOption} style={{ height: '180px' }} />
            </div>
          )}
        </div>

        {/* Right: Side KPIs in 2x2 Grid */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
          {SIDE_KPIS.map((kpi, index) => (
            <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
              <KPICard
                {...kpi}
                value={
                  kpi.isCurrency && kpi.rawValue
                    ? formatCurrency(kpi.rawValue, currency.code, currency.symbol)
                    : kpi.value
                }
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
            <TableSkeleton rows={5} columns={5} title={t('high_risk_concentrations')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 text-start">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('high_risk_concentrations')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                  <tr>
                    <th className="px-5 py-3 text-start">{t('supplier')}</th>
                    <th className="px-5 py-3 text-start">{t('category')}</th>
                    <th className="px-5 py-3 text-end">{t('dependency')}</th>
                    <th className="px-5 py-3 text-end">{t('risk_score')}</th>
                    <th className="px-5 py-3 text-end">{t('level')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {RISK_DETAILS.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">
                        {r.supplier}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{r.category}</td>
                      <td className="px-5 py-3 text-end text-gray-600 dark:text-gray-400">{r.dependency}</td>
                      <td className="px-5 py-3 text-end font-medium text-gray-900 dark:text-gray-100">{r.riskScore}</td>
                      <td className="px-5 py-3 text-end">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium border
                                                    ${
                                                      r.alert === 'Critical' || r.alert === 'High'
                                                        ? 'bg-red-50 text-red-600 border-red-100'
                                                        : r.alert === 'Medium'
                                                          ? 'bg-orange-50 text-orange-600 border-orange-100'
                                                          : 'bg-green-50 text-green-600 border-green-100'
                                                    }`}
                        >
                          {getAlertLabel(r.alert)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Companion Chart: Network Graph (2 cols) */}
        {isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <ChartSkeleton height="h-[280px]" title={t('supply_chain_network')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
            <MemoizedChart option={graphOption} style={{ height: '300px', width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
};
