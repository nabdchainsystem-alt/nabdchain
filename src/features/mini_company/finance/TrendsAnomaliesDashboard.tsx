import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import type { CallbackDataParams } from '../../../types/echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
  ArrowsOut,
  ArrowsIn,
  Info,
  TrendUp,
  Warning,
  Lightning,
  ChartLine,
  ShieldWarning,
  Activity,
} from 'phosphor-react';
import { TrendsAnomaliesInfo } from './TrendsAnomaliesInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

// --- KPI Data (as functions to support translation) ---
const getTopKPIs = (
  t: (key: string) => string,
): (KPIConfig & { rawValue?: number; isCurrency?: boolean; color?: string })[] => [
  {
    id: '1',
    label: t('trend_direction'),
    subtitle: t('last_3_months'),
    value: t('rising'),
    change: '+5%',
    trend: 'up',
    icon: <TrendUp size={18} />,
    sparklineData: [40, 42, 45, 48, 50, 52],
    color: 'blue',
  },
  {
    id: '2',
    label: t('spike_count'),
    subtitle: t('last_30_days'),
    value: '5',
    change: '+2',
    trend: 'up',
    icon: <Lightning size={18} />,
    sparklineData: [1, 0, 1, 0, 2, 1],
    color: 'blue',
  },
  {
    id: '3',
    label: t('anomaly_value'),
    subtitle: t('total_excess'),
    value: '0',
    rawValue: 4250,
    isCurrency: true,
    change: '+12%',
    trend: 'down',
    icon: <Warning size={18} />,
    sparklineData: [1000, 1200, 800, 3000, 4250, 4250],
    color: 'blue',
  },
  {
    id: '4',
    label: t('avg_daily_variance'),
    subtitle: t('volatility'),
    value: '8.2%',
    change: '+1.5%',
    trend: 'neutral',
    icon: <Activity size={18} />,
    sparklineData: [5, 6, 8, 7, 8, 8.2],
    color: 'blue',
  },
];

const getSideKPIs = (
  t: (key: string) => string,
): (KPIConfig & { rawValue?: number; isCurrency?: boolean; color?: string })[] => [
  {
    id: '5',
    label: t('risk_level'),
    subtitle: t('assessment'),
    value: t('medium'),
    change: '',
    trend: 'neutral',
    icon: <ShieldWarning size={18} />,
    sparklineData: [30, 30, 40, 50, 50, 50],
    color: 'blue',
  },
  {
    id: '6',
    label: t('alert_frequency'),
    subtitle: t('avg_per_week'),
    value: '3.5',
    change: '-5%',
    trend: 'down',
    icon: <Lightning size={18} />,
    sparklineData: [4, 4, 3, 3, 4, 3.5],
    color: 'blue',
  },
  {
    id: '7',
    label: t('expense_stability'),
    subtitle: t('index_score'),
    value: '72/100',
    change: '-2',
    trend: 'down',
    icon: <ChartLine size={18} />,
    sparklineData: [78, 76, 75, 74, 73, 72],
    color: 'blue',
  },
  {
    id: '8',
    label: t('pattern_confidence'),
    subtitle: t('detection_rate'),
    value: '94%',
    change: '+2%',
    trend: 'up',
    icon: <TrendUp size={18} />,
    sparklineData: [88, 90, 91, 92, 93, 94],
    color: 'blue',
  },
];

// --- Mock Data: Charts (static numeric data) ---
const MONTHLY_EXPENSES = [
  { name: 'Jan', Standard: 10000, Anomaly: 500 },
  { name: 'Feb', Standard: 10200, Anomaly: 0 },
  { name: 'Mar', Standard: 9800, Anomaly: 1200 },
  { name: 'Apr', Standard: 10500, Anomaly: 200 },
  { name: 'May', Standard: 10100, Anomaly: 800 },
  { name: 'Jun', Standard: 10300, Anomaly: 1550 },
];

// Timeline Chart Data (Scatter or ThemeRiver - using Scatter for spikes)
const TIMELINE_DATA = [
  ['2023-01-15', 500, 'Low'],
  ['2023-03-10', 1200, 'High'],
  ['2023-04-05', 200, 'Low'],
  ['2023-05-18', 800, 'Medium'],
  ['2023-05-22', 3000, 'Critical'],
  ['2023-06-12', 1200, 'High'],
  ['2023-06-25', 1550, 'High'],
];

// --- Translated Data Functions ---
const getAnomalySplit = (t: (key: string) => string) => [
  { value: 95, name: t('normal_spend') },
  { value: 5, name: t('anomalous_spend') },
];

const getAnomaliesTable = (t: (key: string) => string) => [
  { date: '2023-06-12', category: t('travel'), rawAmount: 1200, deviation: '+45%', flag: t('high') },
  { date: '2023-06-18', category: t('software'), rawAmount: 850, deviation: '+25%', flag: t('medium') },
  { date: '2023-05-22', category: t('marketing'), rawAmount: 3000, deviation: '+60%', flag: t('critical') },
  { date: '2023-05-05', category: t('office'), rawAmount: 450, deviation: '+30%', flag: t('medium') },
  { date: '2023-04-15', category: t('rent'), rawAmount: 200, deviation: '+10%', flag: t('low') },
];

const getAnomalyByCategory = (t: (key: string) => string) => [
  { name: t('travel'), value: 1200 },
  { name: t('software'), value: 850 },
  { name: t('marketing'), value: 3000 },
  { name: t('office'), value: 450 },
  { name: t('rent'), value: 200 },
];

const getSeverityDistribution = (t: (key: string) => string) => [
  { value: 35, name: t('critical') },
  { value: 40, name: t('high') },
  { value: 15, name: t('medium') },
  { value: 10, name: t('low') },
];

export const TrendsAnomaliesDashboard: React.FC = () => {
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

  // Get translated KPI data
  const TOP_KPIS = useMemo(() => getTopKPIs(t), [t]);
  const SIDE_KPIS = useMemo(() => getSideKPIs(t), [t]);

  // Get translated chart/table data
  const ANOMALY_SPLIT = useMemo(() => getAnomalySplit(t), [t]);
  const ANOMALIES_TABLE = useMemo(() => getAnomaliesTable(t), [t]);
  const ANOMALY_BY_CATEGORY = useMemo(() => getAnomalyByCategory(t), [t]);
  const SEVERITY_DISTRIBUTION = useMemo(() => getSeverityDistribution(t), [t]);

  // --- ECharts Options ---

  // Pie Chart
  const pieOption = useMemo<EChartsOption>(
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
          data: ANOMALY_SPLIT,
          color: ['#10b981', '#ef4444'], // Green for Normal, Red for Anomaly
        },
      ],
    }),
    [ANOMALY_SPLIT],
  );

  // Severity Distribution Pie
  const severityPieOption = useMemo<EChartsOption>(
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
          data: SEVERITY_DISTRIBUTION,
          color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
        },
      ],
    }),
    [SEVERITY_DISTRIBUTION],
  );

  // Timeline Chart (Scatter for anomalies over time)
  const timelineOption = useMemo<EChartsOption>(
    () => ({
      title: { text: t('spike_timeline'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
      grid: { top: 30, right: 30, bottom: 20, left: 30, containLabel: true },
      tooltip: {
        formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
          const v = (params as CallbackDataParams).value as unknown[];
          return `<b>${v[0]}</b><br/>Amount: $${v[1]}<br/>Severity: ${v[2]}`;
        },
      },
      xAxis: { type: 'category', splitLine: { show: false } },
      yAxis: { type: 'value', name: 'Deviation ($)', splitLine: { show: true, lineStyle: { type: 'dashed' } } },
      series: [
        {
          type: 'scatter',
          symbolSize: (data: number[]) => Math.min(Math.max(data[1] / 50, 10), 40), // Size by amount
          data: TIMELINE_DATA,
          itemStyle: {
            color: (params: CallbackDataParams) => {
              const severity = (params.value as unknown[])[2];
              return severity === 'Critical' ? '#ef4444' : severity === 'High' ? '#f59e0b' : '#3b82f6';
            },
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.2)',
          },
        },
      ],
    }),
    [t],
  );

  // Bar Chart - Monthly Spend Composition (stacked)
  const monthlySpendOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: ['Standard', 'Anomaly'], itemWidth: 10, itemHeight: 10 },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: MONTHLY_EXPENSES.map((d) => d.name),
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
          type: 'bar',
          name: 'Standard',
          stack: 'total',
          data: MONTHLY_EXPENSES.map((d) => d.Standard),
          itemStyle: { color: '#e5e7eb' },
          barWidth: 24,
        },
        {
          type: 'bar',
          name: 'Anomaly',
          stack: 'total',
          data: MONTHLY_EXPENSES.map((d) => d.Anomaly),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 24,
        },
      ],
    }),
    [isRTL],
  );

  // Bar Chart - Anomaly by Category
  const anomalyByCategoryOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ANOMALY_BY_CATEGORY.map((d) => d.name),
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
          type: 'bar',
          data: ANOMALY_BY_CATEGORY.map((d) => d.value),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 24,
        },
      ],
    }),
    [ANOMALY_BY_CATEGORY, isRTL],
  );

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-start gap-2">
            <Lightning size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
            <div>
              <h1 className="text-2xl font-bold">{t('trends_anomalies')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('ta_subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Row 1: 4 KPI Skeletons */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="col-span-1 h-[120px] rounded-xl shimmer" />
          ))}

          {/* Row 2: Two bar chart skeletons */}
          <div className="col-span-2 min-h-[300px]">
            <ChartSkeleton />
          </div>
          <div className="col-span-2 min-h-[300px]">
            <ChartSkeleton />
          </div>

          {/* Row 3: Pie charts + KPIs */}
          <div className="col-span-2 grid grid-cols-2 gap-6">
            <PieChartSkeleton />
            <PieChartSkeleton />
          </div>
          <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[120px] rounded-xl shimmer" />
            ))}
          </div>

          {/* Row 4: Table + Chart skeleton */}
          <div className="col-span-2">
            <TableSkeleton />
          </div>
          <div className="col-span-2">
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
      <TrendsAnomaliesInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-2">
          <Lightning size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('trends_anomalies')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('ta_subtitle')}</p>
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
            />
          </div>
        ))}

        {/* --- Row 2: Two Bar Charts Side by Side --- */}

        {/* Monthly Expenses (Stacked Bar - Standard vs Anomaly) */}
        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              {t('monthly_spend_composition')}
            </h3>
            <p className="text-xs text-gray-400">{t('standard_vs_anomaly')}</p>
          </div>
          <MemoizedChart option={monthlySpendOption} style={{ height: '220px', width: '100%' }} />
        </div>

        {/* Anomaly by Category (Bar) */}
        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              {t('anomaly_by_category')}
            </h3>
            <p className="text-xs text-gray-400">{t('deviation_by_expense_type')}</p>
          </div>
          <MemoizedChart option={anomalyByCategoryOption} style={{ height: '220px', width: '100%' }} />
        </div>

        {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}

        {/* Pie Charts in nested 2-col grid */}
        <div className="col-span-2 grid grid-cols-2 gap-6">
          {/* ECharts: Normal vs Anomalous (Pie) */}
          <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('spend_purity')}
              </h3>
              <p className="text-xs text-gray-400">{t('ratio_irregular_spend')}</p>
            </div>
            <MemoizedChart option={pieOption} style={{ height: '180px' }} />
          </div>

          {/* ECharts: Severity Distribution (Pie) */}
          <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('severity_distribution')}
              </h3>
              <p className="text-xs text-gray-400">{t('anomaly_severity_breakdown')}</p>
            </div>
            <MemoizedChart option={severityPieOption} style={{ height: '180px' }} />
          </div>
        </div>

        {/* Side KPIs in 2x2 grid */}
        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
          {SIDE_KPIS.map((kpi, index) => (
            <div key={kpi.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <KPICard
                {...kpi}
                value={
                  kpi.isCurrency && kpi.rawValue
                    ? formatCurrency(kpi.rawValue, currency.code, currency.symbol)
                    : kpi.value
                }
                color="blue"
                className="h-full"
              />
            </div>
          ))}
        </div>

        {/* --- Row 4: Table + Companion Chart --- */}

        {/* Table (2 cols) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              {t('detected_anomalies')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                <tr>
                  <th className="px-5 py-3 text-start">{t('date')}</th>
                  <th className="px-5 py-3 text-start">{t('category')}</th>
                  <th className="px-5 py-3 text-end">{t('amount')}</th>
                  <th className="px-5 py-3 text-end">{t('deviation')}</th>
                  <th className="px-5 py-3 text-center">{t('flag')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {ANOMALIES_TABLE.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-start text-gray-600 dark:text-gray-400 font-datetime">{row.date}</td>
                    <td className="px-5 py-3 text-start font-medium text-gray-900 dark:text-gray-100">
                      {row.category}
                    </td>
                    <td className="px-5 py-3 text-end text-gray-900 dark:text-gray-100">
                      {formatCurrency(row.rawAmount, currency.code, currency.symbol)}
                    </td>
                    <td className="px-5 py-3 text-end text-red-500 font-medium">{row.deviation}</td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.flag === 'Critical'
                            ? 'bg-red-100 text-red-700'
                            : row.flag === 'High'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {row.flag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Companion Chart: Timeline (2 cols) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <MemoizedChart option={timelineOption} style={{ height: '300px', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};
