import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { CallbackDataParams } from '../../../types/echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, Handshake, TrendUp, Star, Lightbulb, Users, Crown, Rocket } from 'phosphor-react';
import { SupplierStrategicValueGrowthInfo } from './SupplierStrategicValueGrowthInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

// --- KPI Data ---
const _TOP_KPIS: (KPIConfig & { rawValue?: number; isCurrency?: boolean; color?: string })[] = [
  {
    id: '1',
    label: 'Strategic Suppliers',
    subtitle: 'Tier 1 Partners',
    value: '12',
    change: '+1',
    trend: 'up',
    icon: <Crown size={18} />,
    sparklineData: [10, 11, 11, 11, 12, 12],
    color: 'blue',
  },
  {
    id: '2',
    label: 'Spend Growth %',
    subtitle: 'YoY Increase',
    value: '+18%',
    change: '+3%',
    trend: 'up',
    icon: <TrendUp size={18} />,
    sparklineData: [12, 14, 15, 16, 17, 18],
    color: 'blue',
  },
  {
    id: '3',
    label: 'Innovation Score',
    subtitle: 'Avg Rating',
    value: '8.5',
    change: '+0.2',
    trend: 'up',
    icon: <Lightbulb size={18} />,
    sparklineData: [8.0, 8.1, 8.2, 8.3, 8.4, 8.5],
    color: 'blue',
  },
  {
    id: '4',
    label: 'Partnership Index',
    subtitle: 'Relationship Strength',
    value: '92',
    change: 'Stable',
    trend: 'neutral',
    icon: <Handshake size={18} />,
    sparklineData: [90, 91, 91, 92, 92, 92],
    color: 'blue',
  },
];

const _SIDE_KPIS: (KPIConfig & { rawValue?: number; isCurrency?: boolean; color?: string })[] = [
  {
    id: '5',
    label: 'Long-Term Contracts',
    subtitle: '> 3 Years',
    value: '8',
    change: '+2',
    trend: 'up',
    icon: <Users size={18} />,
    sparklineData: [6, 6, 7, 7, 7, 8],
    color: 'blue',
  },
  {
    id: '6',
    label: 'Revenue Impact',
    subtitle: 'Supplier Enabled',
    value: '0',
    rawValue: 1200000,
    isCurrency: true,
    change: '+10%',
    trend: 'up',
    icon: <Rocket size={18} />,
    sparklineData: [0.9, 1.0, 1.0, 1.1, 1.1, 1.2],
    color: 'blue',
  },
  {
    id: '7',
    label: 'Strategic Fit',
    subtitle: 'Alignment Score',
    value: '95%',
    change: 'Stable',
    trend: 'neutral',
    icon: <Star size={18} />,
    color: 'blue',
  },
  {
    id: '8',
    label: 'Joint Initiatives',
    subtitle: 'Active Projects',
    value: '6',
    change: '+1',
    trend: 'up',
    icon: <Handshake size={18} />,
    sparklineData: [3, 4, 4, 5, 5, 6],
    color: 'blue',
  },
];

// --- Mock Data: Charts ---
const SPEND_GROWTH = [
  { name: 'Acme Mfg', Growth: 25, Duration: 5 },
  { name: 'Globex', Growth: 15, Duration: 3 },
  { name: 'Soylent', Growth: 10, Duration: 2 },
  { name: 'Initech', Growth: 5, Duration: 1 },
  { name: 'Stark Ind', Growth: 30, Duration: 4 },
];

const _STRATEGIC_SPLIT = [
  { value: 12, name: 'Strategic', itemStyle: { color: '#8b5cf6' } },
  { value: 25, name: 'Preferred', itemStyle: { color: '#3b82f6' } },
  { value: 45, name: 'Transactional', itemStyle: { color: '#9ca3af' } },
];

const _CONTRACT_TYPES = [
  { value: 30, name: 'Long-Term MSA' },
  { value: 50, name: 'Annual' },
  { value: 20, name: 'Spot/PO' },
];

// Scatter Plot Data: Growth (x) vs Strategic Value (y)
// Size = Spend Volume
const SCATTER_DATA = [
  {
    name: 'Growth Leaders',
    data: [
      [25, 90, 50, 'Acme Mfg'] /* Growth %, Value Score, Spend, Name */,
      [30, 95, 40, 'Stark Ind'],
      [15, 85, 30, 'Globex'],
    ],
    itemStyle: { color: '#10b981' },
  },
  {
    name: 'Steady State',
    data: [
      [5, 75, 20, 'Initech'],
      [10, 80, 25, 'Soylent'],
    ],
    itemStyle: { color: '#3b82f6' },
  },
];

// Additional chart data
const VALUE_BY_SUPPLIER = [
  { name: 'Stark Ind', Value: 95 },
  { name: 'Acme Mfg', Value: 92 },
  { name: 'Globex', Value: 88 },
  { name: 'Soylent', Value: 82 },
  { name: 'Initech', Value: 75 },
];

const _INNOVATION_INDEX = [
  { value: 30, name: 'High Innovation' },
  { value: 45, name: 'Moderate' },
  { value: 25, name: 'Low Innovation' },
];

// Supplier Table
const _SUPPLIER_TABLE = [
  { name: 'Stark Ind', growth: '+30%', contract: '5 Years', score: '95', tier: 'Strategic' },
  { name: 'Acme Mfg', growth: '+25%', contract: '5 Years', score: '92', tier: 'Strategic' },
  { name: 'Globex Corp', growth: '+15%', contract: '3 Years', score: '88', tier: 'Preferred' },
  { name: 'Soylent Corp', growth: '+10%', contract: '2 Years', score: '82', tier: 'Preferred' },
  { name: 'Initech', growth: '+5%', contract: '1 Year', score: '75', tier: 'Transactional' },
  { name: 'Umbrella Corp', growth: '-2%', contract: 'Spot', score: '60', tier: 'Transactional' },
];

export const SupplierStrategicValueGrowthDashboard: React.FC = () => {
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
  const TRANSLATED_TOP_KPIS = useMemo(
    () => [
      {
        id: '1',
        label: t('strategic_suppliers'),
        subtitle: t('tier_1_partners'),
        value: '12',
        change: '+1',
        trend: 'up' as const,
        icon: <Crown size={18} />,
        sparklineData: [10, 11, 11, 11, 12, 12],
        color: 'blue',
      },
      {
        id: '2',
        label: t('spend_growth_pct'),
        subtitle: t('yoy_increase'),
        value: '+18%',
        change: '+3%',
        trend: 'up' as const,
        icon: <TrendUp size={18} />,
        sparklineData: [12, 14, 15, 16, 17, 18],
        color: 'blue',
      },
      {
        id: '3',
        label: t('innovation_score'),
        subtitle: t('avg_rating'),
        value: '8.5',
        change: '+0.2',
        trend: 'up' as const,
        icon: <Lightbulb size={18} />,
        sparklineData: [8.0, 8.1, 8.2, 8.3, 8.4, 8.5],
        color: 'blue',
      },
      {
        id: '4',
        label: t('partnership_index'),
        subtitle: t('relationship_strength'),
        value: '92',
        change: t('stable'),
        trend: 'neutral' as const,
        icon: <Handshake size={18} />,
        sparklineData: [90, 91, 91, 92, 92, 92],
        color: 'blue',
      },
    ],
    [t],
  );

  const TRANSLATED_SIDE_KPIS = useMemo(
    () => [
      {
        id: '5',
        label: t('long_term_contracts'),
        subtitle: t('over_3_years'),
        value: '8',
        change: '+2',
        trend: 'up' as const,
        icon: <Users size={18} />,
        sparklineData: [6, 6, 7, 7, 7, 8],
        color: 'blue',
      },
      {
        id: '6',
        label: t('revenue_impact'),
        subtitle: t('supplier_enabled'),
        value: '0',
        rawValue: 1200000,
        isCurrency: true,
        change: '+10%',
        trend: 'up' as const,
        icon: <Rocket size={18} />,
        sparklineData: [0.9, 1.0, 1.0, 1.1, 1.1, 1.2],
        color: 'blue',
      },
      {
        id: '7',
        label: t('strategic_fit'),
        subtitle: t('alignment_score'),
        value: '95%',
        change: t('stable'),
        trend: 'neutral' as const,
        icon: <Star size={18} />,
        color: 'blue',
      },
      {
        id: '8',
        label: t('joint_initiatives'),
        subtitle: t('active_projects'),
        value: '6',
        change: '+1',
        trend: 'up' as const,
        icon: <Handshake size={18} />,
        sparklineData: [3, 4, 4, 5, 5, 6],
        color: 'blue',
      },
    ],
    [t],
  );

  const _TRANSLATED_SPEND_GROWTH = useMemo(
    () => [
      { name: 'Acme Mfg', [t('growth')]: 25, [t('duration')]: 5 },
      { name: 'Globex', [t('growth')]: 15, [t('duration')]: 3 },
      { name: 'Soylent', [t('growth')]: 10, [t('duration')]: 2 },
      { name: 'Initech', [t('growth')]: 5, [t('duration')]: 1 },
      { name: 'Stark Ind', [t('growth')]: 30, [t('duration')]: 4 },
    ],
    [t],
  );

  const TRANSLATED_STRATEGIC_SPLIT = useMemo(
    () => [
      { value: 12, name: t('strategic'), itemStyle: { color: '#8b5cf6' } },
      { value: 25, name: t('preferred'), itemStyle: { color: '#3b82f6' } },
      { value: 45, name: t('transactional'), itemStyle: { color: '#9ca3af' } },
    ],
    [t],
  );

  const TRANSLATED_CONTRACT_TYPES = useMemo(
    () => [
      { value: 30, name: t('long_term_msa') },
      { value: 50, name: t('annual') },
      { value: 20, name: t('spot_po') },
    ],
    [t],
  );

  const _TRANSLATED_VALUE_BY_SUPPLIER = useMemo(
    () => [
      { name: 'Stark Ind', [t('value')]: 95 },
      { name: 'Acme Mfg', [t('value')]: 92 },
      { name: 'Globex', [t('value')]: 88 },
      { name: 'Soylent', [t('value')]: 82 },
      { name: 'Initech', [t('value')]: 75 },
    ],
    [t],
  );

  const TRANSLATED_INNOVATION_INDEX = useMemo(
    () => [
      { value: 30, name: t('high_innovation') },
      { value: 45, name: t('moderate') },
      { value: 25, name: t('low_innovation') },
    ],
    [t],
  );

  const TRANSLATED_SUPPLIER_TABLE = useMemo(
    () => [
      { name: 'Stark Ind', growth: '+30%', contract: `5 ${t('years')}`, score: '95', tier: t('strategic') },
      { name: 'Acme Mfg', growth: '+25%', contract: `5 ${t('years')}`, score: '92', tier: t('strategic') },
      { name: 'Globex Corp', growth: '+15%', contract: `3 ${t('years')}`, score: '88', tier: t('preferred') },
      { name: 'Soylent Corp', growth: '+10%', contract: `2 ${t('years')}`, score: '82', tier: t('preferred') },
      { name: 'Initech', growth: '+5%', contract: `1 ${t('year')}`, score: '75', tier: t('transactional') },
      { name: 'Umbrella Corp', growth: '-2%', contract: t('spot'), score: '60', tier: t('transactional') },
    ],
    [t],
  );

  // --- ECharts Options ---

  // Pie: Strategic Mix
  const strategicPieOption: EChartsOption = useMemo(
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
          name: t('tier'),
          type: 'pie',
          selectedMode: 'multiple',
          radius: '65%',
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: false } },
          data: TRANSLATED_STRATEGIC_SPLIT,
        },
      ],
    }),
    [TRANSLATED_STRATEGIC_SPLIT, t],
  );

  // Pie: Contract Types
  const contractPieOption: EChartsOption = useMemo(
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
          name: t('contract'),
          type: 'pie',
          selectedMode: 'multiple',
          radius: '65%',
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: false } },
          data: TRANSLATED_CONTRACT_TYPES,
          color: ['#059669', '#3b82f6', '#f59e0b'],
        },
      ],
    }),
    [TRANSLATED_CONTRACT_TYPES, t],
  );

  // Innovation Index Pie
  const _innovationPieOption: EChartsOption = useMemo(
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
          data: TRANSLATED_INNOVATION_INDEX,
          color: ['#8b5cf6', '#3b82f6', '#9ca3af'],
        },
      ],
    }),
    [TRANSLATED_INNOVATION_INDEX],
  );

  // Scatter: Growth vs Value
  const scatterOption: EChartsOption = useMemo(
    () => ({
      tooltip: {
        formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
          const v = (params as CallbackDataParams).value as unknown[];
          return `<b>${v[3]}</b><br/>${t('growth')}: ${v[0]}%<br/>${t('value')}: ${v[1]}`;
        },
      },
      grid: { left: '10%', right: '10%', top: '15%', bottom: '15%' },
      xAxis: { type: 'value', name: t('growth_pct'), splitLine: { show: false }, inverse: isRTL },
      yAxis: {
        type: 'value',
        name: t('value_score'),
        min: 50,
        max: 100,
        splitLine: { lineStyle: { type: 'dashed' } },
        position: isRTL ? 'right' : 'left',
      },
      series: [
        {
          name: t('growth_leaders'),
          type: 'scatter',
          symbolSize: (data: number[]) => data[2],
          data: SCATTER_DATA[0].data,
          itemStyle: SCATTER_DATA[0].itemStyle,
        },
        {
          name: t('steady_state'),
          type: 'scatter',
          symbolSize: (data: number[]) => data[2],
          data: SCATTER_DATA[1].data,
          itemStyle: SCATTER_DATA[1].itemStyle,
        },
      ],
    }),
    [isRTL, t],
  );

  // Spend Growth (Grouped Bar Chart)
  const spendGrowthOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
      grid: { left: isRTL ? 50 : 50, right: isRTL ? 50 : 50, top: 10, bottom: 40 },
      xAxis: {
        type: 'category',
        data: SPEND_GROWTH.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        inverse: isRTL,
      },
      yAxis: [
        {
          type: 'value',
          name: t('growth_pct'),
          position: isRTL ? 'right' : 'left',
          axisLine: { show: true, lineStyle: { color: '#3b82f6' } },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
          axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        {
          type: 'value',
          name: t('term_years'),
          position: isRTL ? 'left' : 'right',
          axisLine: { show: true, lineStyle: { color: '#93c5fd' } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
      ],
      series: [
        {
          name: t('growth_pct'),
          type: 'bar',
          yAxisIndex: 0,
          data: SPEND_GROWTH.map((d) => d.Growth),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 20,
        },
        {
          name: t('term_years'),
          type: 'bar',
          yAxisIndex: 1,
          data: SPEND_GROWTH.map((d) => d.Duration),
          itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
          barWidth: 20,
        },
      ],
    }),
    [isRTL, t],
  );

  // Value by Supplier (Bar Chart)
  const valueBarOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 10, bottom: 30 },
      xAxis: {
        type: 'category',
        data: VALUE_BY_SUPPLIER.map((d) => d.name),
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
      series: [
        {
          name: t('value'),
          type: 'bar',
          data: VALUE_BY_SUPPLIER.map((d) => d.Value),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 28,
        },
      ],
    }),
    [isRTL, t],
  );

  return (
    <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
      <SupplierStrategicValueGrowthInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-2">
          <Rocket size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('value_growth')}</h1>
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

        {/* --- Row 2: Two bar charts side by side --- */}
        {isLoading ? (
          <>
            <div className="col-span-2">
              <ChartSkeleton height="h-[300px]" title={t('growth_term')} />
            </div>
            <div className="col-span-2">
              <ChartSkeleton height="h-[300px]" title={t('value_scores')} />
            </div>
          </>
        ) : (
          <>
            <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
              <div className={`mb-4 text-start`}>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('growth_term')}
                </h3>
                <p className="text-xs text-gray-400">{t('spend_growth_vs_duration')}</p>
              </div>
              <MemoizedChart option={spendGrowthOption} style={{ height: '220px', width: '100%' }} />
            </div>

            <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
              <div className={`mb-4 text-start`}>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('value_scores')}
                </h3>
                <p className="text-xs text-gray-400">{t('strategic_value_index')}</p>
              </div>
              <MemoizedChart option={valueBarOption} style={{ height: '220px', width: '100%' }} />
            </div>
          </>
        )}

        {/* --- Row 3: Two pie charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
        {isLoading ? (
          <>
            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <PieChartSkeleton title={t('partner_mix')} />
                <PieChartSkeleton title={t('contracts')} />
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
                <h3 className={`text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2 text-start`}>
                  {t('partner_mix')}
                </h3>
                <MemoizedChart option={strategicPieOption} style={{ height: '180px' }} />
              </div>
              <div className="bg-white dark:bg-monday-dark-elevated p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                <h3 className={`text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase mb-2 text-start`}>
                  {t('contracts')}
                </h3>
                <MemoizedChart option={contractPieOption} style={{ height: '180px' }} />
              </div>
            </div>

            <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
              {TRANSLATED_SIDE_KPIS.map((kpi, index) => (
                <div key={kpi.id} style={{ animationDelay: `${index * 100}ms` }}>
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
          </>
        )}

        {/* --- Row 4: Table (col-span-2) + Companion Chart (col-span-2) --- */}
        {isLoading ? (
          <>
            <div className="col-span-2">
              <TableSkeleton rows={5} columns={5} />
            </div>
            <div className="col-span-2">
              <ChartSkeleton height="h-[300px]" title={t('value_matrix')} />
            </div>
          </>
        ) : (
          <>
            <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
              <div className={`p-5 border-b border-gray-100 dark:border-gray-700 text-start`}>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('partner_performance')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table dir={dir} className={`w-full text-sm text-start`}>
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                    <tr>
                      <th className={`px-5 py-3 text-start`}>{t('supplier')}</th>
                      <th className="px-5 py-3 text-center">{t('growth')}</th>
                      <th className="px-5 py-3 text-center">{t('contract')}</th>
                      <th className="px-5 py-3 text-center">{t('value_score')}</th>
                      <th className={`px-5 py-3 text-end`}>{t('tier')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {TRANSLATED_SUPPLIER_TABLE.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start`}>
                          {row.name}
                        </td>
                        <td className="px-5 py-3 text-center font-medium text-emerald-500">{row.growth}</td>
                        <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">{row.contract}</td>
                        <td className="px-5 py-3 text-center font-bold text-gray-800 dark:text-gray-200">
                          {row.score}
                        </td>
                        <td className={`px-5 py-3 text-end`}>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.tier === t('strategic')
                                ? 'bg-purple-100 text-purple-700'
                                : row.tier === t('preferred')
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {row.tier}
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
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('value_matrix')}
                </h3>
                <p className="text-xs text-gray-400">{t('growth_vs_strategic')}</p>
              </div>
              <MemoizedChart option={scatterOption} style={{ height: '300px', width: '100%' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
