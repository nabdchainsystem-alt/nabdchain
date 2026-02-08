import React, { useState, useEffect, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { CallbackDataParams } from '../../../types/echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
  Gauge,
  TrendUp,
  Users,
  Info,
  ArrowsOut,
  Percent,
  Warning,
  Clock,
  ShareNetwork,
  ArrowsIn,
} from 'phosphor-react';
import { SalesPerformanceInfo } from './SalesPerformanceInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS_SEQUENCE = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#06b6d4'];

// --- KPI Data ---
const PERFORMANCE_KPIS: (KPIConfig & { rawValue?: number; isCurrency?: boolean })[] = [
  {
    id: '1',
    label: 'Sales Growth',
    subtitle: 'vs Previous Period',
    value: '+18.4%',
    change: '+2.1%',
    trend: 'up',
    icon: <TrendUp size={18} />,
    sparklineData: [12, 14, 13, 15, 16, 18, 18.4],
  },
  {
    id: '2',
    label: 'Conversion Rate',
    subtitle: 'Global conversion',
    value: '3.2%',
    change: '+0.1%',
    trend: 'up',
    icon: <Percent size={18} />,
    sparklineData: [2.8, 2.9, 3.0, 3.1, 3.1, 3.2, 3.2],
  },
  {
    id: '3',
    label: 'Rev per Customer',
    subtitle: 'Customer value',
    value: '0',
    rawValue: 245,
    isCurrency: true,
    change: '-1.5%',
    trend: 'down',
    icon: <Users size={18} />,
    sparklineData: [250, 248, 255, 240, 242, 246, 245],
  },
  {
    id: '4',
    label: 'Repeat Cust %',
    subtitle: 'Retention rate',
    value: '42%',
    change: '+5.0%',
    trend: 'up',
    icon: <ShareNetwork size={18} />,
    sparklineData: [30, 32, 35, 38, 40, 41, 42],
  },
];

const EFFICIENCY_KPIS: (KPIConfig & { rawValue?: number; isCurrency?: boolean })[] = [
  {
    id: '5',
    label: 'Discount Impact',
    subtitle: 'Revenue foregone',
    value: '12%',
    change: '-2%',
    trend: 'up',
    icon: <Percent size={18} />,
    sparklineData: [15, 14, 14, 13, 12.5, 12, 12],
  },
  {
    id: '6',
    label: 'Avg Fulfillment',
    subtitle: 'Hours to ship',
    value: '26h',
    change: '-4h',
    trend: 'up',
    icon: <Clock size={18} />,
    sparklineData: [48, 40, 36, 30, 28, 27, 26],
  },
  {
    id: '7',
    label: 'Cancelled %',
    subtitle: 'Order failure rate',
    value: '4.5%',
    change: '+0.5%',
    trend: 'down',
    icon: <Warning size={18} />,
    sparklineData: [3, 3.5, 4, 3.8, 4.2, 4.4, 4.5],
  },
  {
    id: '8',
    label: 'Return Rate',
    subtitle: 'Product returns',
    value: '2.8%',
    change: '-0.2%',
    trend: 'up',
    icon: <ArrowsIn size={18} />,
    sparklineData: [3.5, 3.2, 3.0, 2.9, 2.8, 2.9, 2.8],
  },
];

// --- Mock Data ---
const ORDERS_VS_COMPLETED_DATA = [
  { name: 'Mon', orders: 120, completed: 115 },
  { name: 'Tue', orders: 150, completed: 140 },
  { name: 'Wed', orders: 180, completed: 175 },
  { name: 'Thu', orders: 200, completed: 195 },
  { name: 'Fri', orders: 250, completed: 230 },
  { name: 'Sat', orders: 190, completed: 185 },
  { name: 'Sun', orders: 140, completed: 138 },
];

const REVENUE_CHANNEL_DATA = [
  { name: 'Online Store', value: 45000 },
  { name: 'Marketplace', value: 22000 },
  { name: 'Retail POS', value: 15000 },
  { name: 'Social/WhatsApp', value: 8000 },
];

const NEW_VS_RETURNING_DATA = [
  { name: 'New Customers', value: 580 },
  { name: 'Returning', value: 420 },
];

const DISCOUNT_VS_FULL_DATA = [
  { name: 'Full Price', value: 65 },
  { name: 'Discounted', value: 35 },
];

const LOW_PERFORMANCE_PRODUCTS = [
  { id: 1, name: 'Basic T-Shirt', views: 1250, orders: 12, conversion: '0.9%' },
  { id: 2, name: 'Summer Hat', views: 890, orders: 5, conversion: '0.5%' },
  { id: 3, name: 'Leather Belt', views: 650, orders: 8, conversion: '1.2%' },
  { id: 4, name: 'Wool Socks', views: 420, orders: 2, conversion: '0.4%' },
  { id: 5, name: 'Canvas Bag', views: 380, orders: 4, conversion: '1.0%' },
];

interface SalesPerformanceDashboardProps {
  hideFullscreen?: boolean;
}

export const SalesPerformanceDashboard: React.FC<SalesPerformanceDashboardProps> = ({ hideFullscreen = false }) => {
  const { currency, t, dir } = useAppContext();
  const isRTL = dir === 'rtl';

  // Translated KPIs
  const translatedPerformanceKPIs = useMemo(
    () =>
      PERFORMANCE_KPIS.map((kpi, index) => ({
        ...kpi,
        label: [t('sales_growth'), t('conversion_rate'), t('rev_per_customer'), t('repeat_cust_percent')][index],
        subtitle: [t('vs_previous_period'), t('global_conversion'), t('customer_value'), t('retention_rate')][index],
      })),
    [t],
  );

  const translatedEfficiencyKPIs = useMemo(
    () =>
      EFFICIENCY_KPIS.map((kpi, index) => ({
        ...kpi,
        label: [t('discount_impact'), t('avg_fulfillment'), t('cancelled_percent'), t('return_rate')][index],
        subtitle: [t('revenue_foregone'), t('hours_to_ship'), t('order_failure_rate'), t('product_returns')][index],
      })),
    [t],
  );

  // Translated chart data
  const translatedOrdersData = useMemo(
    () =>
      ORDERS_VS_COMPLETED_DATA.map((item, index) => ({
        ...item,
        name: [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')][index],
      })),
    [t],
  );

  const translatedRevenueChannelData = useMemo(
    () =>
      REVENUE_CHANNEL_DATA.map((item, index) => ({
        ...item,
        name: [t('online_store'), t('marketplace'), t('retail_pos'), t('social_whatsapp')][index],
      })),
    [t],
  );

  const translatedNewVsReturningData = useMemo(
    () =>
      NEW_VS_RETURNING_DATA.map((item, index) => ({
        ...item,
        name: [t('new_customers'), t('returning')][index],
      })),
    [t],
  );

  const translatedDiscountData = useMemo(
    () =>
      DISCOUNT_VS_FULL_DATA.map((item, index) => ({
        ...item,
        name: [t('full_price'), t('discounted')][index],
      })),
    [t],
  );
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

  // --- Chart Options (ECharts used for specific complex or pie visualizations) ---
  const newVsReturningOption: EChartsOption = useMemo(
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
          data: translatedNewVsReturningData.map((d, i) => ({
            ...d,
            itemStyle: { color: ['#6366f1', '#10b981'][i] },
          })),
          label: { show: false },
          emphasis: { label: { show: false } },
        },
      ],
    }),
    [translatedNewVsReturningData],
  );

  const discountPieOption: EChartsOption = useMemo(
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
          data: translatedDiscountData.map((d, i) => ({
            ...d,
            itemStyle: { color: ['#10b981', '#f59e0b'][i] },
          })),
          label: { show: false },
          emphasis: { label: { show: false } },
        },
      ],
    }),
    [translatedDiscountData],
  );

  // ECharts option for Orders vs Completed bar chart
  const ordersVsCompletedOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { data: [t('total_orders'), t('completed')], bottom: 0 },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: translatedOrdersData.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 12 },
        inverse: isRTL,
      },
      yAxis: {
        type: 'value',
        axisLine: { show: true },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 12 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
        position: isRTL ? 'right' : 'left',
      },
      series: [
        {
          name: t('total_orders'),
          type: 'bar',
          data: translatedOrdersData.map((d) => d.orders),
          itemStyle: { color: '#dbeafe', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 30,
        },
        {
          name: t('completed'),
          type: 'bar',
          data: translatedOrdersData.map((d) => d.completed),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 30,
        },
      ],
    }),
    [translatedOrdersData, isRTL, t],
  );

  // ECharts option for Revenue by Channel bar chart
  const revenueByChannelOption: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
          const data = (params as CallbackDataParams[])[0];
          return `${data.name}: ${formatCurrency(data.value as number, currency.code, currency.symbol)}`;
        },
      },
      grid: { left: isRTL ? 80 : 50, right: isRTL ? 20 : 80, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: translatedRevenueChannelData.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6b7280', fontSize: 11 },
        inverse: isRTL,
      },
      yAxis: {
        type: 'value',
        axisLine: { show: true },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: '#6b7280',
          fontSize: 10,
          formatter: (value: number) => formatCurrency(value, currency.code, currency.symbol),
        },
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
        position: isRTL ? 'right' : 'left',
      },
      series: [
        {
          type: 'bar',
          data: translatedRevenueChannelData.map((d) => d.value),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 32,
          label: {
            show: true,
            position: isRTL ? 'left' : 'right',
            formatter: (params: CallbackDataParams) =>
              formatCurrency(params.value as number, currency.code, currency.symbol),
            color: '#6b7280',
            fontSize: 12,
            fontWeight: 600,
          },
        },
      ],
    }),
    [translatedRevenueChannelData, isRTL, currency.code, currency.symbol],
  );

  // Parallel Coordinates Option for "Hidden Story"
  const parallelChartOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}' },
      parallelAxis: [
        {
          dim: 0,
          name: 'Product',
          type: 'category',
          data: LOW_PERFORMANCE_PRODUCTS.map((p) => p.name),
          axisLabel: { rotate: 45, interval: 0, fontSize: 10, width: 80, overflow: 'truncate' },
        },
        { dim: 1, name: 'Views', min: 0, max: 1500 },
        { dim: 2, name: 'Orders', min: 0, max: 15 },
        { dim: 3, name: 'Conv %', min: 0, max: 1.5 },
      ],
      parallel: {
        left: '5%',
        right: '5%',
        bottom: '8%',
        top: '15%',
        parallelAxisDefault: {
          type: 'value',
          nameLocation: 'end',
          nameTextStyle: { color: '#64748b', fontSize: 11 },
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisTick: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: '#64748b', fontSize: 10 },
        },
      },
      series: [
        {
          type: 'parallel',
          lineStyle: { width: 3, opacity: 0.6 },
          data: LOW_PERFORMANCE_PRODUCTS.map((p, i) => ({
            value: [p.name, p.views, p.orders, parseFloat(p.conversion)],
            lineStyle: { color: COLORS_SEQUENCE[i % COLORS_SEQUENCE.length] },
            name: p.name,
          })),
        },
      ],
    }),
    [],
  );

  return (
    <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
      <SalesPerformanceInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-2">
          <Gauge size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('performance_efficiency')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('operational_leakage_analysis')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hideFullscreen && (
            <button
              onClick={toggleFullScreen}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
              title={isFullScreen ? t('exit_full_screen') : t('full_screen')}
            >
              {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
            </button>
          )}
          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
          >
            <Info size={18} className="text-blue-500" />
            {t('about_dashboard')}
          </button>
        </div>
      </div>

      {/* Strict 4-Column Grid for Perfect Alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* --- Row 1: Top 4 KPIs --- */}
        {translatedPerformanceKPIs.map((kpi) => (
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

        {/* --- Row 2: Two Bar Charts --- */}

        {/* Orders vs Completed (2 cols) */}
        <div className="col-span-1 md:col-span-2">
          {isLoading ? (
            <ChartSkeleton height="h-[280px]" title={t('orders_vs_completed')} />
          ) : (
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('orders_vs_completed')}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{t('operational_leakage')}</p>
              </div>
              <div className="h-[240px] w-full">
                <MemoizedChart option={ordersVsCompletedOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          )}
        </div>

        {/* Revenue by Channel (2 cols) */}
        <div className="col-span-1 md:col-span-2">
          {isLoading ? (
            <ChartSkeleton height="h-[280px]" title={t('revenue_by_channel')} />
          ) : (
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('revenue_by_channel')}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{t('where_sales_coming')}</p>
              </div>
              <div className="h-[240px] w-full">
                <MemoizedChart option={revenueByChannelOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          )}
        </div>

        {/* --- Row 3: Two Pies + 4 Efficiency KPIs --- */}

        {/* Pie Charts Inner Grid (Left Half) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
          {/* New vs Returning */}
          {isLoading ? (
            <PieChartSkeleton title={t('new_vs_returning')} />
          ) : (
            <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow h-full min-h-[250px] animate-fade-in-up">
              <div className="flex flex-col gap-0.5 mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {t('new_vs_returning')}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{t('customer_base_quality')}</p>
              </div>
              <MemoizedChart option={newVsReturningOption} style={{ height: '210px' }} />
            </div>
          )}

          {/* Discount vs Full-Price */}
          {isLoading ? (
            <PieChartSkeleton title={t('discount_vs_full')} />
          ) : (
            <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow h-full min-h-[250px] animate-fade-in-up">
              <div className="flex flex-col gap-0.5 mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {t('discount_vs_full')}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{t('pricing_health_check')}</p>
              </div>
              <MemoizedChart option={discountPieOption} style={{ height: '210px' }} />
            </div>
          )}
        </div>

        {/* 4 Side KPIs (Right Half - 2x2 Grid) */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
          {translatedEfficiencyKPIs.map((kpi) => (
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
        </div>

        {/* --- Row 4: Table (3 Cols) + Companion Chart (1 Col) --- */}

        {/* Table: Low Performance Products (2 cols) */}
        <div className="col-span-1 md:col-span-2">
          {isLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <div className="bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full animate-fade-in-up">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    {t('low_performance_products')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{t('high_views_low_conversion')}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                    <tr>
                      <th className="px-6 py-3 text-start">{t('product_name')}</th>
                      <th className="px-6 py-3 text-end">{t('views')}</th>
                      <th className="px-6 py-3 text-end">{t('orders')}</th>
                      <th className="px-6 py-3 text-end">{t('conv_rate')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {LOW_PERFORMANCE_PRODUCTS.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">
                          {product.name}
                        </td>
                        <td className="px-6 py-3 text-end text-gray-600 dark:text-gray-400">{product.views}</td>
                        <td className="px-6 py-3 text-end text-gray-600 dark:text-gray-400">{product.orders}</td>
                        <td className="px-6 py-3 text-end text-orange-500 font-medium">{product.conversion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Companion Chart: Parallel Coordinates (2 Cols) */}
        <div className="col-span-1 md:col-span-2">
          {isLoading ? (
            <ChartSkeleton height="h-[280px]" title={t('conversion_flow')} showLegend={false} />
          ) : (
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col animate-fade-in-up">
              <div className="mb-4 shrink-0">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('conversion_flow')}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{t('views_to_orders_path')}</p>
              </div>
              <div className="flex-1 min-h-[200px]">
                <MemoizedChart
                  option={parallelChartOption}
                  style={{ height: '100%', width: '100%', minHeight: 100, minWidth: 100 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
