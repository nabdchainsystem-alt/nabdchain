import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { CallbackDataParams } from '../../../types/echarts';
import { KPICard } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
  ArrowsOut,
  ArrowsIn,
  Info,
  Warning,
  Truck,
  Factory,
  Money,
  Star,
  Buildings,
  Globe,
  Handshake,
} from 'phosphor-react';
import { SupplierOverviewInfo } from './SupplierOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Mock Data (Non-translatable) ---

// --- Mock Data: Charts ---
const SPEND_BY_SUPPLIER = [
  { name: 'Acme Mfg', Spend: 1200000 },
  { name: 'Globex', Spend: 850000 },
  { name: 'Soylent', Spend: 650000 },
  { name: 'Initech', Spend: 400000 },
  { name: 'Umbrella', Spend: 350000 },
];

const _CATEGORY_SPLIT = [
  { value: 40, name: 'Raw Materials' },
  { value: 25, name: 'Logistics' },
  { value: 20, name: 'Services' },
  { value: 10, name: 'Packaging' },
  { value: 5, name: 'IT/SaaS' },
];

// Supplier Table
const SUPPLIER_TABLE = [
  { name: 'Acme Mfg', category: 'Raw Materials', rawSpend: 1200000, rating: '4.8', status: 'Strategic' },
  { name: 'Globex Corp', category: 'Logistics', rawSpend: 850000, rating: '4.2', status: 'Preferred' },
  { name: 'Soylent Corp', category: 'Packaging', rawSpend: 650000, rating: '3.9', status: 'Active' },
  { name: 'Initech', category: 'IT/SaaS', rawSpend: 400000, rating: '4.5', status: 'Active' },
  { name: 'Umbrella Corp', category: 'Services', rawSpend: 350000, rating: '2.5', status: 'Probation' },
];

// Bubble Chart Data: [Spend (x), Rating (y), Risk Score (size), Supplier Name]
// Risk Score: Higher size = Higher risk for visualization purposes (or could be inverted)
// Let's say Size = Risk Score (1-10) * Factor
const BUBBLE_DATA = [
  [[1200000, 4.8, 20, 'Acme Mfg', 'Low Risk']],
  [[850000, 4.2, 30, 'Globex', 'Med Risk']],
  [[650000, 3.9, 40, 'Soylent', 'Med Risk']],
  [[400000, 4.5, 10, 'Initech', 'Low Risk']],
  [[350000, 2.5, 80, 'Umbrella', 'High Risk']],
  [[150000, 4.0, 20, 'Stark Ind', 'Low Risk']],
  [[200000, 3.5, 50, 'Cyberdyne', 'High Risk']],
];

// Additional chart data
const RATING_BY_SUPPLIER = [
  { name: 'Acme Mfg', Rating: 4.8 },
  { name: 'Globex', Rating: 4.2 },
  { name: 'Soylent', Rating: 3.9 },
  { name: 'Initech', Rating: 4.5 },
  { name: 'Umbrella', Rating: 2.5 },
];

const _SUPPLIER_STATUS = [
  { value: 45, name: 'Strategic' },
  { value: 30, name: 'Active' },
  { value: 15, name: 'Probation' },
  { value: 10, name: 'New' },
];

export const SupplierOverviewDashboard: React.FC = () => {
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

  // Translated KPI Data
  const TOP_KPIS = useMemo(
    () => [
      {
        id: '1',
        label: t('total_suppliers'),
        subtitle: t('global_vendor_base'),
        value: '142',
        change: '+5',
        trend: 'up' as const,
        icon: <Buildings size={18} />,
        sparklineData: [130, 132, 135, 138, 140, 142],
        color: 'blue',
      },
      {
        id: '2',
        label: t('active_suppliers'),
        subtitle: t('engaged_ytd'),
        value: '88',
        change: '+2',
        trend: 'up' as const,
        icon: <Handshake size={18} />,
        sparklineData: [82, 84, 85, 86, 87, 88],
        color: 'blue',
      },
      {
        id: '3',
        label: t('total_spend'),
        subtitle: t('ytd_procurement'),
        value: '0',
        rawValue: 4200000,
        isCurrency: true,
        change: '+12%',
        trend: 'up' as const,
        icon: <Money size={18} />,
        sparklineData: [3.5, 3.6, 3.8, 3.9, 4.0, 4.2],
        color: 'blue',
      },
      {
        id: '4',
        label: t('avg_rating'),
        subtitle: t('performance_score'),
        value: '4.2',
        change: '+0.1',
        trend: 'up' as const,
        icon: <Star size={18} />,
        sparklineData: [4.0, 4.0, 4.1, 4.1, 4.2, 4.2],
        color: 'blue',
      },
    ],
    [t],
  );

  const SIDE_KPIS = useMemo(
    () => [
      {
        id: '5',
        label: t('risk_profile'),
        subtitle: t('high_risk_vendors'),
        value: '7',
        change: '-1',
        trend: 'down' as const,
        icon: <Warning size={18} />,
        sparklineData: [9, 8, 8, 7, 7, 7],
        color: 'blue',
      },
      {
        id: '6',
        label: t('on_time_deliv'),
        subtitle: t('global_average'),
        value: '94%',
        change: '+1%',
        trend: 'up' as const,
        icon: <Truck size={18} />,
        sparklineData: [92, 92, 93, 93, 94, 94],
        color: 'blue',
      },
      {
        id: '7',
        label: t('sourcing_mix'),
        subtitle: t('strategic_partners'),
        value: '25%',
        change: t('stable'),
        trend: 'neutral' as const,
        icon: <Globe size={18} />,
        sparklineData: [25, 25, 25, 25, 25, 25],
        color: 'blue',
      },
      {
        id: '8',
        label: t('new_vendors'),
        subtitle: t('added_this_quarter'),
        value: '8',
        change: '+3',
        trend: 'up' as const,
        icon: <Factory size={18} />,
        sparklineData: [4, 5, 5, 6, 7, 8],
        color: 'blue',
      },
    ],
    [t],
  );

  // Translated Chart Data
  const TRANSLATED_CATEGORY_SPLIT = useMemo(
    () => [
      { value: 40, name: t('raw_materials') },
      { value: 25, name: t('logistics') },
      { value: 20, name: t('services') },
      { value: 10, name: t('packaging') },
      { value: 5, name: t('it_saas') },
    ],
    [t],
  );

  const TRANSLATED_SUPPLIER_STATUS = useMemo(
    () => [
      { value: 45, name: t('strategic') },
      { value: 30, name: t('active') },
      { value: 15, name: t('probation') },
      { value: 10, name: t('new_segment') },
    ],
    [t],
  );

  // Loading state for smooth entrance animation
  const isLoading = useLoadingAnimation();

  const toggleFullScreen = () => {
    window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
  };

  // --- ECharts Options ---

  // Pie Chart
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
          data: TRANSLATED_CATEGORY_SPLIT,
          color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
        },
      ],
    }),
    [TRANSLATED_CATEGORY_SPLIT],
  );

  // Supplier Status Pie
  const statusPieOption: EChartsOption = useMemo(
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
          data: TRANSLATED_SUPPLIER_STATUS,
          color: ['#8b5cf6', '#10b981', '#ef4444', '#f59e0b'],
        },
      ],
    }),
    [TRANSLATED_SUPPLIER_STATUS],
  );

  // Spend by Supplier Bar Chart
  const spendBySupplierOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 60, right: isRTL ? 60 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: SPEND_BY_SUPPLIER.map((d) => d.name),
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
          data: SPEND_BY_SUPPLIER.map((d) => d.Spend),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 28,
        },
      ],
    }),
    [isRTL],
  );

  // Rating by Supplier Bar Chart
  const ratingBySupplierOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: RATING_BY_SUPPLIER.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        inverse: isRTL,
      },
      yAxis: {
        type: 'value',
        position: isRTL ? 'right' : 'left',
        min: 0,
        max: 5,
        axisLine: { show: true },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: RATING_BY_SUPPLIER.map((d) => d.Rating),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 28,
        },
      ],
    }),
    [isRTL],
  );

  // Bubble Chart (Scatter)
  const bubbleOption: EChartsOption = useMemo(
    () => ({
      title: { text: t('supplier_matrix'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
      grid: { left: '8%', right: '10%', top: '15%', bottom: '15%' },
      tooltip: {
        formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
          const d = (params as CallbackDataParams).data as Record<string, unknown>;
          return `${d[3]}<br/>${t('spend')}: $${((d[0] as number) / 1000).toFixed(0)}k<br/>${t('rating')}: ${d[1]}<br/>${t('risk_level')}: ${d[4]}`;
        },
      },
      xAxis: { type: 'value', name: t('spend'), nameLocation: 'middle', nameGap: 30, splitLine: { show: false } },
      yAxis: { type: 'value', name: t('rating'), min: 1, max: 5, splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        {
          type: 'scatter',
          symbolSize: function (data: number[]) {
            return data[2]; // Risk score controls bubble size
          },
          data: BUBBLE_DATA.flat(),
          itemStyle: {
            color: (params: CallbackDataParams) => {
              const risk = (params.data as Record<string, unknown>)[2] as number;
              if (risk > 60) return '#ef4444'; // High Risk
              if (risk > 30) return '#f59e0b'; // Med Risk
              return '#10b981'; // Low Risk
            },
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
      ],
    }),
    [t],
  );

  return (
    <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
      <SupplierOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-2">
          <Factory size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('suppliers_overview')}</h1>
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
        {TOP_KPIS.map((kpi, index) => (
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
              <ChartSkeleton height="h-[300px]" title={t('top_spend')} />
            </div>
            <div className="col-span-2">
              <ChartSkeleton height="h-[300px]" title={t('supplier_ratings')} />
            </div>
          </>
        ) : (
          <>
            {/* Spend by Supplier (Bar) */}
            <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
              <div className={`mb-4 text-start`}>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('top_spend')}
                </h3>
                <p className="text-xs text-gray-400">{t('by_supplier')}</p>
              </div>
              <MemoizedChart option={spendBySupplierOption} style={{ height: '220px', width: '100%' }} />
            </div>

            {/* Rating by Supplier (Bar) */}
            <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
              <div className={`mb-4 text-start`}>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('supplier_ratings')}
                </h3>
                <p className="text-xs text-gray-400">{t('performance_score')}</p>
              </div>
              <MemoizedChart option={ratingBySupplierOption} style={{ height: '220px', width: '100%' }} />
            </div>
          </>
        )}

        {/* --- Row 3: Two pie charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
        {isLoading ? (
          <>
            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-6">
                <PieChartSkeleton title={t('spend_mix')} />
                <PieChartSkeleton title={t('status_mix')} />
              </div>
            </div>
            <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
              {SIDE_KPIS.map((kpi, index) => (
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
              {/* ECharts: Category Split (Pie) */}
              <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                <div className={`mb-2 text-start`}>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    {t('spend_mix')}
                  </h3>
                  <p className="text-xs text-gray-400">{t('by_category')}</p>
                </div>
                <MemoizedChart option={pieOption} style={{ height: '180px' }} />
              </div>

              {/* ECharts: Supplier Status (Pie) */}
              <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
                <div className={`mb-2 text-start`}>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    {t('status_mix')}
                  </h3>
                  <p className="text-xs text-gray-400">{t('by_classification')}</p>
                </div>
                <MemoizedChart option={statusPieOption} style={{ height: '180px' }} />
              </div>
            </div>

            {/* 4 KPIs in 2x2 grid */}
            <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
              {SIDE_KPIS.map((kpi, index) => (
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

        {/* --- Row 4: Table + Companion Chart --- */}

        {/* Table (2 cols) */}
        {isLoading ? (
          <div className="col-span-2">
            <TableSkeleton rows={5} columns={5} />
          </div>
        ) : (
          <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`p-5 border-b border-gray-100 dark:border-gray-700 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('strategic_suppliers')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir={dir}>
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                  <tr>
                    <th className={`px-5 py-3 text-start`}>{t('supplier')}</th>
                    <th className={`px-5 py-3 text-start`}>{t('category')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('spend')}</th>
                    <th className={`px-5 py-3 text-start`}>{t('rating')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {SUPPLIER_TABLE.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className={`px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start`}>
                        {row.name}
                      </td>
                      <td className={`px-5 py-3 text-gray-600 dark:text-gray-400 text-xs text-start`}>
                        {row.category}
                      </td>
                      <td className={`px-5 py-3 font-medium text-gray-800 dark:text-gray-200 text-end`}>
                        {formatCurrency(row.rawSpend, currency.code, currency.symbol)}
                      </td>
                      <td className={`px-5 py-3 text-amber-500 font-bold text-start`}>
                        <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                          {row.rating} <Star size={12} weight="fill" />
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-end`}>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'Strategic'
                              ? 'bg-purple-100 text-purple-700'
                              : row.status === 'Probation'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
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

        {/* Companion Chart: Bubble Matrix (2 cols) */}
        {isLoading ? (
          <div className="col-span-2">
            <ChartSkeleton height="h-[300px]" title={t('risk_vs_value_matrix')} />
          </div>
        ) : (
          <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
            <MemoizedChart
              option={bubbleOption}
              style={{ height: '300px', width: '100%', minHeight: 100, minWidth: 100 }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
