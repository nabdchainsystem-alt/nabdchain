import React, { useState, useMemo } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
  ArrowsOut,
  Info,
  ShoppingCart,
  Truck,
  Clock,
  Package,
  CurrencyDollar,
  CheckCircle,
  Warning,
  Hourglass,
} from 'phosphor-react';
import { SupplierOrdersInfo } from './SupplierOrdersInfo';
import { useLanguage } from '../../../contexts/LanguageContext';

const ORDERS_TABLE_DATA = [
  {
    id: 'PO-2024-001',
    supplier: 'Global Materials Co',
    items: 25,
    value: '0',
    rawValue: 45200,
    isCurrency: true,
    ordered: '2024-01-15',
    expected: '2024-01-22',
    statusKey: 'delivered',
  },
  {
    id: 'PO-2024-002',
    supplier: 'TechParts Ltd',
    items: 12,
    value: '0',
    rawValue: 28500,
    isCurrency: true,
    ordered: '2024-01-16',
    expected: '2024-01-25',
    statusKey: 'in_transit',
  },
  {
    id: 'PO-2024-003',
    supplier: 'LogiShip Express',
    items: 8,
    value: '0',
    rawValue: 12800,
    isCurrency: true,
    ordered: '2024-01-17',
    expected: '2024-01-24',
    statusKey: 'processing',
  },
  {
    id: 'PO-2024-004',
    supplier: 'PackPro Solutions',
    items: 50,
    value: '0',
    rawValue: 8500,
    isCurrency: true,
    ordered: '2024-01-18',
    expected: '2024-01-28',
    statusKey: 'pending',
  },
  {
    id: 'PO-2024-005',
    supplier: 'MetalWorks Inc',
    items: 15,
    value: '0',
    rawValue: 32000,
    isCurrency: true,
    ordered: '2024-01-10',
    expected: '2024-01-20',
    statusKey: 'delayed',
  },
];

export const SupplierOrdersDashboard: React.FC = () => {
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [showInfo, setShowInfo] = useState(false);

  const TOP_KPIS = useMemo(
    () => [
      {
        id: '1',
        label: t('total_orders'),
        subtitle: t('this_month'),
        value: '248',
        change: '+18%',
        trend: 'up' as const,
        icon: <ShoppingCart size={18} />,
        sparklineData: [200, 210, 225, 235, 242, 248],
        color: 'blue',
      },
      {
        id: '2',
        label: t('order_value'),
        subtitle: t('total_spend'),
        value: '0',
        rawValue: 1240000,
        isCurrency: true,
        change: '+12%',
        trend: 'up' as const,
        icon: <CurrencyDollar size={18} />,
        sparklineData: [1.0, 1.05, 1.1, 1.15, 1.2, 1.24],
        color: 'blue',
      },
      {
        id: '3',
        label: t('on_time_orders'),
        subtitle: t('delivery_rate'),
        value: '94.2%',
        change: '+2.1%',
        trend: 'up' as const,
        icon: <CheckCircle size={18} />,
        sparklineData: [90, 91, 92, 93, 93.5, 94.2],
        color: 'blue',
      },
      {
        id: '4',
        label: t('pending_orders'),
        subtitle: t('awaiting_delivery'),
        value: '32',
        change: '-5',
        trend: 'up' as const,
        icon: <Hourglass size={18} />,
        sparklineData: [42, 40, 38, 36, 34, 32],
        color: 'blue',
      },
    ],
    [t],
  );

  const SIDE_KPIS = useMemo(
    () => [
      {
        id: '5',
        label: t('avg_lead_time'),
        subtitle: t('days'),
        value: '5.2d',
        change: '-0.3d',
        trend: 'up' as const,
        icon: <Clock size={18} />,
        sparklineData: [6, 5.8, 5.6, 5.5, 5.3, 5.2],
        color: 'blue',
      },
      {
        id: '6',
        label: t('orders_in_transit'),
        subtitle: t('active'),
        value: '45',
        change: '+8',
        trend: 'neutral' as const,
        icon: <Truck size={18} />,
        sparklineData: [38, 40, 42, 43, 44, 45],
        color: 'blue',
      },
      {
        id: '7',
        label: t('delayed_orders'),
        subtitle: t('needs_attention'),
        value: '6',
        change: '-2',
        trend: 'up' as const,
        icon: <Warning size={18} />,
        sparklineData: [10, 9, 8, 8, 7, 6],
        color: 'blue',
      },
      {
        id: '8',
        label: t('items_received'),
        subtitle: t('this_month'),
        value: '3,420',
        change: '+15%',
        trend: 'up' as const,
        icon: <Package size={18} />,
        sparklineData: [2800, 2950, 3100, 3200, 3320, 3420],
        color: 'blue',
      },
    ],
    [t],
  );

  const ORDERS_TREND = useMemo(
    () => [
      { name: t('jan'), Orders: 180, Value: 850 },
      { name: t('feb'), Orders: 195, Value: 920 },
      { name: t('mar'), Orders: 210, Value: 980 },
      { name: t('apr'), Orders: 225, Value: 1050 },
      { name: t('may'), Orders: 238, Value: 1150 },
      { name: t('jun'), Orders: 248, Value: 1240 },
    ],
    [t],
  );

  const ORDER_STATUS = useMemo(
    () => [
      { value: 165, name: t('delivered') },
      { value: 45, name: t('in_transit') },
      { value: 18, name: t('processing') },
      { value: 14, name: t('pending') },
      { value: 6, name: t('delayed') },
    ],
    [t],
  );

  const ORDERS_BY_SUPPLIER = useMemo(
    () => [
      { name: 'Global Materials', Orders: 45 },
      { name: 'TechParts', Orders: 38 },
      { name: 'LogiShip', Orders: 52 },
      { name: 'PackPro', Orders: 28 },
      { name: 'MetalWorks', Orders: 22 },
    ],
    [],
  );

  const isLoading = useLoadingAnimation();

  const toggleFullScreen = () => {
    window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
  };

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
          data: ORDER_STATUS,
          color: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444'],
        },
      ],
    }),
    [ORDER_STATUS],
  );

  const ordersTrendOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: ['Orders', 'Value'], itemWidth: 10, itemHeight: 10 },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 50, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: ORDERS_TREND.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        inverse: isRTL,
      },
      yAxis: [
        {
          type: 'value',
          position: isRTL ? 'right' : 'left',
          axisLine: { show: true },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
          axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        {
          type: 'value',
          position: isRTL ? 'left' : 'right',
          axisLine: { show: true },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
      ],
      series: [
        {
          type: 'line',
          name: 'Orders',
          yAxisIndex: 0,
          data: ORDERS_TREND.map((d) => d.Orders),
          smooth: true,
          lineStyle: { color: '#3b82f6', width: 2 },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0)' },
              ],
            },
          },
        },
        {
          type: 'line',
          name: 'Value',
          yAxisIndex: 1,
          data: ORDERS_TREND.map((d) => d.Value),
          smooth: true,
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0)' },
              ],
            },
          },
        },
      ],
    }),
    [ORDERS_TREND, isRTL],
  );

  const ordersBySupplierOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 40, right: isRTL ? 40 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ORDERS_BY_SUPPLIER.map((d) => d.name),
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
          data: ORDERS_BY_SUPPLIER.map((d) => d.Orders),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 28,
        },
      ],
    }),
    [ORDERS_BY_SUPPLIER, isRTL],
  );

  return (
    <div
      className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative"
      dir={dir}
    >
      <SupplierOrdersInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse text-end' : ''}`}>
          <ShoppingCart size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('supplier_orders')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('supplier_orders_desc')}</p>
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
        {/* Top KPIs */}
        {TOP_KPIS.map((kpi, index) => (
          <div key={kpi.id} className="col-span-1" style={{ animationDelay: `${index * 100}ms` }}>
            <KPICard {...kpi} color="blue" loading={isLoading} />
          </div>
        ))}

        {/* Orders Trend Area Chart */}
        {isLoading ? (
          <div className="col-span-3">
            <ChartSkeleton height="h-[300px]" title={t('orders_trend')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-3 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`mb-4 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('orders_trend')}
              </h3>
              <p className="text-xs text-gray-400">{t('monthly_orders_value')}</p>
            </div>
            <MemoizedChart option={ordersTrendOption} style={{ height: '220px', width: '100%' }} />
          </div>
        )}

        {/* Order Status Pie */}
        {isLoading ? (
          <div className="col-span-1">
            <PieChartSkeleton title={t('order_status')} />
          </div>
        ) : (
          <div className="col-span-1 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`mb-2 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('order_status')}
              </h3>
              <p className="text-xs text-gray-400">{t('current_distribution')}</p>
            </div>
            <MemoizedChart option={statusPieOption} style={{ height: '220px' }} />
          </div>
        )}

        {/* Orders by Supplier Bar Chart */}
        {isLoading ? (
          <div className="col-span-2">
            <ChartSkeleton height="h-[280px]" title={t('orders_by_supplier')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 min-h-[280px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`mb-4 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('orders_by_supplier')}
              </h3>
              <p className="text-xs text-gray-400">{t('top_suppliers')}</p>
            </div>
            <MemoizedChart option={ordersBySupplierOption} style={{ height: '200px', width: '100%' }} />
          </div>
        )}

        {/* Side KPIs */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
          {SIDE_KPIS.map((kpi, index) => (
            <div key={kpi.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <KPICard {...kpi} color="blue" className="h-full" loading={isLoading} />
            </div>
          ))}
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="col-span-4">
            <TableSkeleton rows={5} columns={7} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-4 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
            <div className={`p-5 border-b border-gray-100 dark:border-gray-700 text-start`}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('recent_orders')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir={dir}>
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                  <tr>
                    <th className={`px-5 py-3 text-start`}>{t('order_id')}</th>
                    <th className={`px-5 py-3 text-start`}>{t('supplier')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('items')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('value')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('ordered')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('expected')}</th>
                    <th className={`px-5 py-3 text-end`}>{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {ORDERS_TABLE_DATA.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className={`px-5 py-3 font-medium text-blue-600 dark:text-blue-400 text-start`}>{row.id}</td>
                      <td className={`px-5 py-3 text-gray-900 dark:text-gray-100 text-start`}>{row.supplier}</td>
                      <td className={`px-5 py-3 text-gray-600 dark:text-gray-400 text-end`}>{row.items}</td>
                      <td className={`px-5 py-3 text-green-600 font-medium text-end`}>{row.value}</td>
                      <td className={`px-5 py-3 text-gray-500 dark:text-gray-400 text-xs text-end`}>{row.ordered}</td>
                      <td className={`px-5 py-3 text-gray-500 dark:text-gray-400 text-xs text-end`}>{row.expected}</td>
                      <td className={`px-5 py-3 text-end`}>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.statusKey === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : row.statusKey === 'in_transit'
                                ? 'bg-blue-100 text-blue-700'
                                : row.statusKey === 'processing'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : row.statusKey === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {t(row.statusKey)}
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
