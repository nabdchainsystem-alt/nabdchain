import React, { useState, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, Info, TrendUp, ChartLine, Star, Clock, CheckCircle, Warning, Medal, Target } from 'phosphor-react';
import { SupplierPerformanceInfo } from './SupplierPerformanceInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';

const PERFORMANCE_TABLE_DATA = [
  {
    id: 'S-001',
    name: 'Global Materials Co',
    quality: 98,
    delivery: 96,
    cost: 92,
    response: 95,
    overall: 95.3,
    trendKey: 'up',
  },
  {
    id: 'S-002',
    name: 'TechParts Ltd',
    quality: 95,
    delivery: 94,
    cost: 88,
    response: 92,
    overall: 92.3,
    trendKey: 'up',
  },
  {
    id: 'S-003',
    name: 'LogiShip Express',
    quality: 92,
    delivery: 99,
    cost: 85,
    response: 97,
    overall: 93.3,
    trendKey: 'up',
  },
  {
    id: 'S-004',
    name: 'PackPro Solutions',
    quality: 88,
    delivery: 85,
    cost: 94,
    response: 82,
    overall: 87.3,
    trendKey: 'down',
  },
  {
    id: 'S-005',
    name: 'MetalWorks Inc',
    quality: 78,
    delivery: 72,
    cost: 90,
    response: 75,
    overall: 78.8,
    trendKey: 'down',
  },
];

export const SupplierPerformanceDashboard: React.FC = () => {
  const { _currency } = useAppContext();
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [showInfo, setShowInfo] = useState(false);

  const TOP_KPIS = useMemo(
    () => [
      {
        id: '1',
        label: t('avg_quality_score'),
        subtitle: t('all_suppliers'),
        value: '91.2%',
        change: '+2.1%',
        trend: 'up' as const,
        icon: <Star size={18} />,
        sparklineData: [87, 88, 89, 90, 90.5, 91.2],
        color: 'blue',
      },
      {
        id: '2',
        label: t('on_time_delivery'),
        subtitle: t('avg_rate'),
        value: '94.5%',
        change: '+1.8%',
        trend: 'up' as const,
        icon: <Clock size={18} />,
        sparklineData: [91, 92, 93, 93.5, 94, 94.5],
        color: 'blue',
      },
      {
        id: '3',
        label: t('cost_performance'),
        subtitle: t('vs_budget'),
        value: '103%',
        change: '-2%',
        trend: 'down' as const,
        icon: <Target size={18} />,
        sparklineData: [108, 107, 106, 105, 104, 103],
        color: 'blue',
      },
      {
        id: '4',
        label: t('response_time'),
        subtitle: t('avg_hours'),
        value: '4.2h',
        change: '-0.5h',
        trend: 'up' as const,
        icon: <TrendUp size={18} />,
        sparklineData: [5.5, 5.2, 5.0, 4.8, 4.5, 4.2],
        color: 'blue',
      },
    ],
    [t],
  );

  const SIDE_KPIS = useMemo(
    () => [
      {
        id: '5',
        label: t('defect_rate'),
        subtitle: t('per_1000_units'),
        value: '2.3',
        change: '-0.4',
        trend: 'up' as const,
        icon: <Warning size={18} />,
        sparklineData: [3.5, 3.2, 3.0, 2.8, 2.5, 2.3],
        color: 'blue',
      },
      {
        id: '6',
        label: t('compliance_rate'),
        subtitle: t('certifications'),
        value: '98.5%',
        change: '+0.5%',
        trend: 'up' as const,
        icon: <CheckCircle size={18} />,
        sparklineData: [96, 97, 97.5, 98, 98.2, 98.5],
        color: 'blue',
      },
      {
        id: '7',
        label: t('top_performers'),
        subtitle: t('above_90pct'),
        value: '68',
        change: '+5',
        trend: 'up' as const,
        icon: <Medal size={18} />,
        sparklineData: [58, 60, 62, 64, 66, 68],
        color: 'blue',
      },
      {
        id: '8',
        label: t('improvement_rate'),
        subtitle: t('yoy_change'),
        value: '+8.2%',
        change: '+1.2%',
        trend: 'up' as const,
        icon: <ChartLine size={18} />,
        sparklineData: [5, 5.8, 6.5, 7, 7.5, 8.2],
        color: 'blue',
      },
    ],
    [t],
  );

  const PERFORMANCE_TREND = useMemo(
    () => [
      { name: t('jan'), Quality: 88, Delivery: 91, Cost: 85, Response: 87 },
      { name: t('feb'), Quality: 89, Delivery: 92, Cost: 86, Response: 88 },
      { name: t('mar'), Quality: 89.5, Delivery: 92.5, Cost: 87, Response: 89 },
      { name: t('apr'), Quality: 90, Delivery: 93, Cost: 88, Response: 90 },
      { name: t('may'), Quality: 90.5, Delivery: 94, Cost: 89, Response: 91 },
      { name: t('jun'), Quality: 91.2, Delivery: 94.5, Cost: 90, Response: 92 },
    ],
    [t],
  );

  const RADAR_DATA = useMemo(
    () => [
      { subject: t('quality'), A: 91, B: 85, fullMark: 100 },
      { subject: t('delivery'), A: 94, B: 88, fullMark: 100 },
      { subject: t('cost'), A: 90, B: 82, fullMark: 100 },
      { subject: t('response'), A: 92, B: 86, fullMark: 100 },
      { subject: t('compliance'), A: 98, B: 90, fullMark: 100 },
      { subject: t('innovation'), A: 85, B: 78, fullMark: 100 },
    ],
    [t],
  );

  const SCORE_DISTRIBUTION = useMemo(
    () => [
      { value: 35, name: t('excellent_90_100') },
      { value: 45, name: t('good_80_89') },
      { value: 15, name: t('fair_70_79') },
      { value: 5, name: t('poor_below_70') },
    ],
    [t],
  );

  const _CATEGORY_PERFORMANCE = useMemo(
    () => [
      { value: 94, name: t('raw_materials') },
      { value: 91, name: t('electronics') },
      { value: 88, name: t('packaging') },
      { value: 96, name: t('logistics') },
      { value: 85, name: t('services') },
    ],
    [t],
  );

  const isLoading = useLoadingAnimation();

  const toggleFullScreen = () => {
    window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
  };

  const distributionPieOption: EChartsOption = useMemo(
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
          data: SCORE_DISTRIBUTION,
          color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        },
      ],
    }),
    [SCORE_DISTRIBUTION],
  );

  const categoryGaugeOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}  {c}' },
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 5,
          radius: '100%',
          center: ['50%', '70%'],
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.7, '#ef4444'],
                [0.85, '#f59e0b'],
                [1, '#10b981'],
              ],
            },
          },
          pointer: { show: true, length: '60%', width: 6 },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            fontSize: 20,
            fontWeight: 'bold',
            offsetCenter: [0, '20%'],
          },
          data: [{ value: 91.2, name: t('overall_score') }],
        },
      ],
    }),
    [t],
  );

  const performanceTrendOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: ['Quality', 'Delivery', 'Cost', 'Response'], itemWidth: 10, itemHeight: 10 },
      grid: { left: isRTL ? 20 : 40, right: isRTL ? 40 : 20, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: PERFORMANCE_TREND.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        inverse: isRTL,
      },
      yAxis: {
        type: 'value',
        position: isRTL ? 'right' : 'left',
        min: 80,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      series: [
        {
          type: 'line',
          name: 'Quality',
          data: PERFORMANCE_TREND.map((d) => d.Quality),
          smooth: true,
          lineStyle: { color: '#3b82f6', width: 2 },
          itemStyle: { color: '#3b82f6' },
          symbol: 'circle',
          symbolSize: 8,
        },
        {
          type: 'line',
          name: 'Delivery',
          data: PERFORMANCE_TREND.map((d) => d.Delivery),
          smooth: true,
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
          symbol: 'circle',
          symbolSize: 8,
        },
        {
          type: 'line',
          name: 'Cost',
          data: PERFORMANCE_TREND.map((d) => d.Cost),
          smooth: true,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
          symbol: 'circle',
          symbolSize: 8,
        },
        {
          type: 'line',
          name: 'Response',
          data: PERFORMANCE_TREND.map((d) => d.Response),
          smooth: true,
          lineStyle: { color: '#6366f1', width: 2 },
          itemStyle: { color: '#6366f1' },
          symbol: 'circle',
          symbolSize: 8,
        },
      ],
    }),
    [PERFORMANCE_TREND, isRTL],
  );

  const radarOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}  {c}' },
      legend: { bottom: 0, data: [t('current'), t('target')], itemWidth: 10, itemHeight: 10 },
      radar: {
        indicator: RADAR_DATA.map((d) => ({ name: d.subject, max: 100 })),
        axisName: { color: '#6b7280', fontSize: 10 },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: RADAR_DATA.map((d) => d.A),
              name: t('current'),
              areaStyle: { color: 'rgba(59, 130, 246, 0.5)' },
              lineStyle: { color: '#3b82f6' },
              itemStyle: { color: '#3b82f6' },
            },
            {
              value: RADAR_DATA.map((d) => d.B),
              name: t('target'),
              areaStyle: { color: 'rgba(16, 185, 129, 0.3)' },
              lineStyle: { color: '#10b981' },
              itemStyle: { color: '#10b981' },
            },
          ],
        },
      ],
    }),
    [RADAR_DATA, t],
  );

  return (
    <div
      className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative"
      dir={dir}
    >
      <SupplierPerformanceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse text-end' : ''}`}>
          <ChartLine size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('supplier_performance')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('supplier_performance_desc')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={toggleFullScreen}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
            title={t('full_screen')}
          >
            <ArrowsOut size={18} />
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className={`flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Info size={18} className="text-blue-500" />
            {t('about_dashboard')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Row 1: Top 4 KPIs */}
        {TOP_KPIS.map((kpi, index) => (
          <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
            <KPICard {...kpi} color="blue" loading={isLoading} />
          </div>
        ))}

        {/* Row 2: Performance Trend Line Chart + Gauge */}
        {isLoading ? (
          <div className="col-span-3">
            <ChartSkeleton height="h-[300px]" title={t('performance_trend')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-3 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`mb-4 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('performance_trend')}
              </h3>
              <p className="text-xs text-gray-400">{t('monthly_metrics')}</p>
            </div>
            <MemoizedChart option={performanceTrendOption} style={{ height: '220px', width: '100%' }} />
          </div>
        )}

        {isLoading ? (
          <div className="col-span-1">
            <PieChartSkeleton title={t('overall_score')} />
          </div>
        ) : (
          <div className="col-span-1 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`mb-2 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('overall_score')}
              </h3>
              <p className="text-xs text-gray-400">{t('avg_performance')}</p>
            </div>
            <MemoizedChart option={categoryGaugeOption} style={{ height: '200px' }} />
          </div>
        )}

        {/* Row 3: Radar Chart + Pie Chart + 4 KPIs */}
        {isLoading ? (
          <div className="col-span-2">
            <ChartSkeleton height="h-[280px]" title={t('performance_radar')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 min-h-[280px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`mb-4 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('performance_radar')}
              </h3>
              <p className="text-xs text-gray-400">{t('current_vs_target')}</p>
            </div>
            <MemoizedChart option={radarOption} style={{ height: '200px', width: '100%' }} />
          </div>
        )}

        {isLoading ? (
          <div className="col-span-2">
            <div className="grid grid-cols-2 gap-6">
              <PieChartSkeleton title={t('score_distribution')} />
            </div>
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
              <div className={`mb-2 text-start`}>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('score_distribution')}
                </h3>
                <p className="text-xs text-gray-400">{t('supplier_ratings')}</p>
              </div>
              <MemoizedChart option={distributionPieOption} style={{ height: '180px' }} />
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

        {/* 2 more KPIs */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
          {SIDE_KPIS.slice(2, 4).map((kpi, index) => (
            <div key={kpi.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <KPICard {...kpi} color="blue" className="h-full" loading={isLoading} />
            </div>
          ))}
        </div>

        {/* Row 4: Performance Table */}
        {isLoading ? (
          <div className="col-span-4">
            <TableSkeleton rows={5} columns={7} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-4 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`p-5 border-b border-gray-100 dark:border-gray-700 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('supplier_scorecard')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir={dir}>
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                  <tr>
                    <th className={`px-5 py-3 text-start`}>{t('supplier')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('quality')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('delivery')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('cost')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('response')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('overall')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('trend')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {PERFORMANCE_TABLE_DATA.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start`}>
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {row.name.charAt(0)}
                          </div>
                          {row.name}
                        </div>
                      </td>
                      <td className={`px-5 py-3 text-end`}>
                        <span
                          className={`font-medium ${row.quality >= 90 ? 'text-green-600' : row.quality >= 80 ? 'text-blue-600' : 'text-amber-600'}`}
                        >
                          {row.quality}%
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-end`}>
                        <span
                          className={`font-medium ${row.delivery >= 90 ? 'text-green-600' : row.delivery >= 80 ? 'text-blue-600' : 'text-amber-600'}`}
                        >
                          {row.delivery}%
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-end`}>
                        <span
                          className={`font-medium ${row.cost >= 90 ? 'text-green-600' : row.cost >= 80 ? 'text-blue-600' : 'text-amber-600'}`}
                        >
                          {row.cost}%
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-end`}>
                        <span
                          className={`font-medium ${row.response >= 90 ? 'text-green-600' : row.response >= 80 ? 'text-blue-600' : 'text-amber-600'}`}
                        >
                          {row.response}%
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-end`}>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.overall >= 90
                              ? 'bg-green-100 text-green-700'
                              : row.overall >= 80
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {row.overall.toFixed(1)}%
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-end`}>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${row.trendKey === 'up' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {row.trendKey === 'up' ? '↑' : '↓'}
                        </span>
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
