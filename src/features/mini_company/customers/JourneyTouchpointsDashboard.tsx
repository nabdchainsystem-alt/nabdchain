import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
  ArrowsOut,
  ArrowsIn,
  Info,
  TrendUp,
  Warning,
  Path,
  MapTrifold,
  Hourglass,
  CheckCircle,
  XCircle,
} from 'phosphor-react';
import { JourneyTouchpointsInfo } from './JourneyTouchpointsInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

export const JourneyTouchpointsDashboard: React.FC = () => {
  const { _currency } = useAppContext();
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';

  // --- KPI Data ---
  const TOP_KPIS = useMemo<(KPIConfig & { rawValue?: number; isCurrency?: boolean; color?: string })[]>(
    () => [
      {
        id: '1',
        label: t('touchpoints_per_journey'),
        subtitle: t('interactions'),
        value: '4.5',
        change: '+12%',
        trend: 'up',
        icon: <Path size={18} />,
        sparklineData: [3.8, 4.0, 4.2, 4.3, 4.4, 4.5],
        color: 'blue',
      },
      {
        id: '2',
        label: t('avg_journey_length'),
        subtitle: t('days_to_convert'),
        value: '14',
        change: '-2 days',
        trend: 'up',
        icon: <Hourglass size={18} />,
        sparklineData: [18, 17, 16, 16, 15, 14],
        color: 'blue',
      },
      {
        id: '3',
        label: t('conversion_rate'),
        subtitle: t('visitors_to_customers'),
        value: '3.2%',
        change: '+0.4%',
        trend: 'up',
        icon: <CheckCircle size={18} />,
        sparklineData: [2.6, 2.7, 2.9, 3.0, 3.1, 3.2],
        color: 'blue',
      },
      {
        id: '4',
        label: t('drop_off_rate'),
        subtitle: t('funnel_exits'),
        value: '42%',
        change: '-3%',
        trend: 'up',
        icon: <XCircle size={18} />,
        sparklineData: [48, 47, 45, 44, 43, 42],
        color: 'blue',
      },
    ],
    [t],
  );

  const SIDE_KPIS = useMemo<(KPIConfig & { rawValue?: number; isCurrency?: boolean; color?: string })[]>(
    () => [
      {
        id: '5',
        label: t('first_touch_channel'),
        subtitle: t('entry_point'),
        value: t('social'),
        change: '38%',
        trend: 'up',
        icon: <TrendUp size={18} />,
        sparklineData: [32, 33, 35, 36, 37, 38],
        color: 'blue',
      },
      {
        id: '6',
        label: t('last_touch_channel'),
        subtitle: t('exit_point'),
        value: t('email'),
        change: '45%',
        trend: 'up',
        icon: <Path size={18} />,
        sparklineData: [40, 41, 42, 43, 44, 45],
        color: 'blue',
      },
      {
        id: '7',
        label: t('multi_channel_users'),
        subtitle: t('cross_channel'),
        value: '68%',
        change: '+4%',
        trend: 'up',
        icon: <MapTrifold size={18} />,
        sparklineData: [60, 62, 64, 65, 66, 68],
        color: 'blue',
      },
      {
        id: '8',
        label: t('journey_completion'),
        subtitle: t('full_funnel'),
        value: '24%',
        change: '+1.5%',
        trend: 'up',
        icon: <Warning size={18} />,
        sparklineData: [20, 21, 22, 22, 23, 24],
        color: 'blue',
      },
    ],
    [t],
  );

  // --- Mock Data: Charts ---
  const TOUCHPOINTS_BY_STAGE = useMemo(
    () => [
      { name: t('awareness'), Count: 450 },
      { name: t('consideration'), Count: 320 },
      { name: t('decision'), Count: 210 },
      { name: t('purchase'), Count: 85 },
    ],
    [t],
  );

  const FUNNEL_DATA = useMemo(
    () => [
      { value: 100, name: t('awareness') },
      { value: 71, name: t('consideration') },
      { value: 46, name: t('decision') },
      { value: 19, name: t('purchase') },
    ],
    [t],
  );

  // Channel Performance Data
  const CHANNEL_PERFORMANCE = useMemo(
    () => [
      { name: t('email'), Conversions: 45 },
      { name: t('search'), Conversions: 38 },
      { name: t('social'), Conversions: 25 },
      { name: t('direct'), Conversions: 20 },
    ],
    [t],
  );

  const DROP_POINT_SPLIT = useMemo(
    () => [
      { value: 40, name: t('decision') },
      { value: 25, name: t('consideration') },
      { value: 20, name: t('awareness') },
      { value: 15, name: t('purchase') },
    ],
    [t],
  );

  // Interaction Log Table - raw data with outcomeKey for styling
  const TABLE_DATA = [
    { id: 'J-001', touchpointsCount: 6, durationDays: 12, outcomeKey: 'converted' },
    { id: 'J-002', touchpointsCount: 4, durationDays: 8, outcomeKey: 'converted' },
    { id: 'J-003', touchpointsCount: 3, durationDays: 5, outcomeKey: 'pending' },
    { id: 'J-004', touchpointsCount: 7, durationDays: 18, outcomeKey: 'dropped' },
    { id: 'J-005', touchpointsCount: 5, durationDays: 10, outcomeKey: 'pending' },
  ];

  const TRANSLATED_TABLE = useMemo(
    () =>
      TABLE_DATA.map((item) => ({
        ...item,
        outcome: t(item.outcomeKey),
      })),
    [t],
  );

  // Sankey Data
  const SANKEY_NODES = useMemo(
    () => [
      { name: t('social') },
      { name: t('email') },
      { name: t('search') },
      { name: t('web') },
      { name: t('direct') },
      { name: t('consideration') },
      { name: t('decision') },
      { name: t('purchase') },
      { name: t('dropped') },
    ],
    [t],
  );

  const SANKEY_LINKS = useMemo(
    () => [
      { source: t('social'), target: t('web'), value: 50 },
      { source: t('email'), target: t('web'), value: 30 },
      { source: t('search'), target: t('consideration'), value: 20 },
      { source: t('web'), target: t('consideration'), value: 40 },
      { source: t('web'), target: t('dropped'), value: 40 },
      { source: t('consideration'), target: t('decision'), value: 25 },
      { source: t('consideration'), target: t('direct'), value: 15 },
      { source: t('consideration'), target: t('dropped'), value: 20 },
      { source: t('decision'), target: t('purchase'), value: 20 },
      { source: t('decision'), target: t('dropped'), value: 5 },
      { source: t('direct'), target: t('purchase'), value: 10 },
      { source: t('direct'), target: t('dropped'), value: 5 },
    ],
    [t],
  );

  const [showInfo, setShowInfo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isLoading = useLoadingAnimation();

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = () => {
    window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
  };

  // --- ECharts Options ---

  // Funnel Chart
  const funnelOption: EChartsOption = useMemo(
    () => ({
      title: { text: t('funnel_progression'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c}%' },
      series: [
        {
          name: t('funnel_progression'),
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: { show: true, position: 'inside' },
          labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
          itemStyle: { borderColor: '#fff', borderWidth: 1 },

          data: FUNNEL_DATA,
          color: ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],
        },
      ],
    }),
    [t, FUNNEL_DATA],
  );

  // Drop Point Split Pie
  const dropPieOption: EChartsOption = useMemo(
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
          data: DROP_POINT_SPLIT,
          color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
        },
      ],
    }),
    [DROP_POINT_SPLIT],
  );

  // Touchpoint Analysis Bar Chart
  const touchpointAnalysisOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: TOUCHPOINTS_BY_STAGE.map((d) => d.name),
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
          data: TOUCHPOINTS_BY_STAGE.map((d) => d.Count),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 28,
        },
      ],
    }),
    [TOUCHPOINTS_BY_STAGE, isRTL],
  );

  // Channel Effectiveness Bar Chart
  const channelEffectivenessOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: CHANNEL_PERFORMANCE.map((d) => d.name),
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
          data: CHANNEL_PERFORMANCE.map((d) => d.Conversions),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 28,
        },
      ],
    }),
    [CHANNEL_PERFORMANCE, isRTL],
  );

  // Sankey Chart
  const sankeyOption: EChartsOption = useMemo(
    () => ({
      title: { text: t('journey_flow'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
      tooltip: { trigger: 'item', triggerOn: 'mousemove' },
      series: [
        {
          type: 'sankey',
          data: SANKEY_NODES,
          links: SANKEY_LINKS,
          emphasis: { focus: 'adjacency' },
          lineStyle: { color: 'gradient', curveness: 0.5 },
          itemStyle: { borderWidth: 1, borderColor: '#aaa' },
          layoutIterations: 32,
          label: { color: '#000', fontSize: 10 },
        },
      ],
    }),
    [t, SANKEY_NODES, SANKEY_LINKS],
  );

  return (
    <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
      <JourneyTouchpointsInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-2">
          <MapTrifold size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('journey_touchpoints')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('journey_touchpoints_desc')}</p>
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
            <KPICard {...kpi} color="blue" />
          </div>
        ))}

        {/* --- Row 2: Two Bar Charts Side by Side --- */}
        {isLoading ? (
          <>
            <div className="col-span-2">
              <ChartSkeleton />
            </div>
            <div className="col-span-2">
              <ChartSkeleton />
            </div>
          </>
        ) : (
          <>
            {/* Touchpoints per Stage (Bar) */}
            <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('touchpoint_analysis')}
                </h3>
                <p className="text-xs text-gray-400">{t('journey_stages')}</p>
              </div>
              <MemoizedChart option={touchpointAnalysisOption} style={{ height: '220px', width: '100%' }} />
            </div>

            {/* Channel Performance (Bar) */}
            <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('channel_effectiveness')}
                </h3>
                <p className="text-xs text-gray-400">{t('channel_contribution')}</p>
              </div>
              <MemoizedChart option={channelEffectivenessOption} style={{ height: '220px', width: '100%' }} />
            </div>
          </>
        )}

        {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
        {isLoading ? (
          <>
            <div className="col-span-2">
              <PieChartSkeleton />
            </div>
            <div className="col-span-2">
              <ChartSkeleton />
            </div>
          </>
        ) : (
          <>
            {/* Pie Charts in nested 2-col grid */}
            <div className="col-span-2 grid grid-cols-2 gap-6">
              {/* ECharts: Conversion Funnel */}
              <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    {t('funnel_progression')}
                  </h3>
                  <p className="text-xs text-gray-400">{t('path_analysis')}</p>
                </div>
                <MemoizedChart option={funnelOption} style={{ height: '180px' }} />
              </div>

              {/* ECharts: Drop Point Split (Pie) */}
              <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    {t('drop_off_rate')}
                  </h3>
                  <p className="text-xs text-gray-400">{t('funnel_exits')}</p>
                </div>
                <MemoizedChart option={dropPieOption} style={{ height: '180px' }} />
              </div>
            </div>

            {/* 4 KPIs in 2x2 grid */}
            <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
              {SIDE_KPIS.map((kpi, index) => (
                <div key={kpi.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <KPICard {...kpi} color="blue" className="h-full" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- Row 4: Table + Companion Chart --- */}
        {isLoading ? (
          <>
            <div className="col-span-2">
              <TableSkeleton />
            </div>
            <div className="col-span-2">
              <ChartSkeleton />
            </div>
          </>
        ) : (
          <>
            {/* Table (2 cols) */}
            <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('recent_journeys')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                    <tr>
                      <th className="px-5 py-3 text-start">{t('journey_id')}</th>
                      <th className="px-5 py-3 text-start">{t('touchpoints')}</th>
                      <th className="px-5 py-3 text-start">{t('duration')}</th>
                      <th className="px-5 py-3 text-end">{t('outcome')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {TRANSLATED_TABLE.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.id}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs text-start">
                          {row.touchpointsCount}
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs text-start">
                          {row.durationDays}d
                        </td>
                        <td className="px-5 py-3 text-end">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.outcomeKey === 'converted'
                                ? 'bg-green-100 text-green-700'
                                : row.outcomeKey === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {row.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Companion Chart: Sankey (2 cols) */}
            <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <MemoizedChart option={sankeyOption} style={{ height: '300px', width: '100%' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
