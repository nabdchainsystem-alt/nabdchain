import React, { useState, useMemo, useEffect } from 'react';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import {
  ChartLineUp,
  ChartBar,
  CurrencyDollar,
  ShoppingCart,
  TrendUp,
  Info,
  ArrowsOut,
  ArrowsIn,
  CaretLeft,
  CaretRight,
  Database,
  Lightbulb,
} from 'phosphor-react';
import { SalesAnalysisInfo } from './SalesAnalysisInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/formatters';

// --- Visual Constants ---
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- Mock Data ---

const SALES_BY_PRODUCT_DATA = [
  { name: 'Headphones', sales: 45000 },
  { name: 'Laptops', sales: 52000 },
  { name: 'Keyboards', sales: 28000 },
  { name: 'Monitors', sales: 34000 },
  { name: 'Mice', sales: 12000 },
];

const SALES_BY_PERSON_DATA = [
  { name: 'Ahmed', sales: 38000 },
  { name: 'Sarah', sales: 42000 },
  { name: 'Omar', sales: 31000 },
  { name: 'Layla', sales: 29000 },
];

const SALES_BY_REGION_DATA = [
  { name: 'Riyadh', value: 45 },
  { name: 'Jeddah', value: 25 },
  { name: 'Dammam', value: 20 },
  { name: 'Abha', value: 10 },
];

const TABLE_DATA = [
  {
    id: 'ORD-001',
    date: '2026-01-10',
    customer: 'Tech Solutions',
    product: 'Premium Headphones',
    qty: 5,
    price: 200,
    total: 1000,
    salesperson: 'Ahmed',
    region: 'Riyadh',
    status: 'Completed',
  },
  {
    id: 'ORD-002',
    date: '2026-01-11',
    customer: 'Global Mart',
    product: 'Ergonomic Chair',
    qty: 2,
    price: 450,
    total: 900,
    salesperson: 'Sarah',
    region: 'Jeddah',
    status: 'Pending',
  },
  {
    id: 'ORD-003',
    date: '2026-01-12',
    customer: 'Creative Studio',
    product: 'Mechanical Keyboard',
    qty: 10,
    price: 150,
    total: 1500,
    salesperson: 'Omar',
    region: 'Dammam',
    status: 'Completed',
  },
  {
    id: 'ORD-004',
    date: '2026-01-13',
    customer: 'Fast Delivery',
    product: 'USB-C Dock',
    qty: 20,
    price: 80,
    total: 1600,
    salesperson: 'Layla',
    region: 'Abha',
    status: 'Shipped',
  },
  {
    id: 'ORD-005',
    date: '2026-01-14',
    customer: 'Smart Home',
    product: 'Webcam 4K',
    qty: 3,
    price: 150,
    total: 450,
    salesperson: 'Ahmed',
    region: 'Riyadh',
    status: 'Completed',
  },
  {
    id: 'ORD-006',
    date: '2026-01-15',
    customer: 'Digital Hub',
    product: 'LED Monitor',
    qty: 4,
    price: 300,
    total: 1200,
    salesperson: 'Sarah',
    region: 'Jeddah',
    status: 'Completed',
  },
  {
    id: 'ORD-007',
    date: '2026-01-16',
    customer: 'Office Pros',
    product: 'Office Desk',
    qty: 1,
    price: 800,
    total: 800,
    salesperson: 'Omar',
    region: 'Dammam',
    status: 'Pending',
  },
  {
    id: 'ORD-008',
    date: '2026-01-17',
    customer: 'Future Tech',
    product: 'Gaming Mouse',
    qty: 15,
    price: 60,
    total: 900,
    salesperson: 'Layla',
    region: 'Abha',
    status: 'Completed',
  },
];

interface SalesAnalysisDashboardProps {
  hideFullscreen?: boolean;
}

export const SalesAnalysisDashboard: React.FC<SalesAnalysisDashboardProps> = ({ hideFullscreen = false }) => {
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

  // Disabled loading animation for troubleshooting chart issues
  const isLoading = false;

  // Table State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'date',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const toggleFullScreen = () => {
    window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
  };

  // Filtered & Sorted Table Data
  const processedTableData = useMemo(() => {
    const data = [...TABLE_DATA];

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      data.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        if ((a[sortConfig.key] as string) < (b[sortConfig.key] as string))
          return sortConfig.direction === 'asc' ? -1 : 1;
        if ((a[sortConfig.key] as string) > (b[sortConfig.key] as string))
          return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTableData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTableData, currentPage]);

  const totalPages = Math.ceil(processedTableData.length / itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  // KPI Config
  const TOP_KPIS: (KPIConfig & { rawValue?: number; isCurrency?: boolean })[] = [
    {
      id: '1',
      label: t('total_sales_value'),
      subtitle: t('gross_revenue_generated'),
      value: '0',
      rawValue: 284500,
      isCurrency: true,
      change: '+14.2%',
      trend: 'up',
      icon: <CurrencyDollar size={18} />,
      sparklineData: [40, 45, 42, 50, 55, 62, 70],
    },
    {
      id: '2',
      label: t('total_orders'),
      subtitle: t('volume_of_transactions'),
      value: '1,248',
      change: '+8.5%',
      trend: 'up',
      icon: <ShoppingCart size={18} />,
      sparklineData: [20, 22, 25, 23, 28, 30, 32],
    },
    {
      id: '3',
      label: t('avg_order_value'),
      subtitle: t('revenue_per_transaction'),
      value: '0',
      rawValue: 228,
      isCurrency: true,
      change: '-2.1%',
      trend: 'down',
      icon: <TrendUp size={18} />,
      sparklineData: [240, 235, 230, 225, 228, 226, 228],
    },
    {
      id: '4',
      label: t('sales_growth_rate'),
      subtitle: t('period_over_period'),
      value: '18.4%',
      change: '+1.2%',
      trend: 'up',
      icon: <ChartLineUp size={18} />,
      sparklineData: [12, 14, 15, 16, 17, 18, 18.4],
    },
  ];

  const SIDE_KPIS: (KPIConfig & { rawValue?: number; isCurrency?: boolean })[] = [
    {
      id: '5',
      label: t('top_agent'),
      subtitle: t('best_performer'),
      value: 'Sarah',
      change: '+15%',
      trend: 'up',
      icon: <Database size={18} />,
      sparklineData: [35, 37, 38, 40, 41, 42, 42],
    },
    {
      id: '6',
      label: t('top_product'),
      subtitle: t('revenue_leader'),
      value: 'Laptops',
      change: '+22%',
      trend: 'up',
      icon: <Lightbulb size={18} />,
      sparklineData: [40, 44, 46, 48, 50, 51, 52],
    },
    {
      id: '7',
      label: t('top_region'),
      subtitle: t('highest_volume'),
      value: 'Riyadh',
      change: '+10%',
      trend: 'up',
      icon: <ChartBar size={18} />,
      sparklineData: [38, 40, 42, 43, 44, 45, 45],
    },
    {
      id: '8',
      label: t('completion_rate_label'),
      subtitle: t('order_fulfillment'),
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: <TrendUp size={18} />,
      sparklineData: [88, 90, 91, 92, 93, 93.5, 94.2],
    },
  ];

  // ECharts Region Option
  const regionPieOption: EChartsOption = {
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
        data: SALES_BY_REGION_DATA.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } })),
      },
    ],
  };

  // ECharts Sales by Product Option
  const salesByProductOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: SALES_BY_PRODUCT_DATA.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        inverse: isRTL,
      },
      yAxis: {
        type: 'value',
        position: isRTL ? 'right' : 'left',
        axisLine: { show: true },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: SALES_BY_PRODUCT_DATA.map((d) => d.sales),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 50,
        },
      ],
    }),
    [isRTL],
  );

  // ECharts Sales by Agent Option
  const salesByAgentOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: SALES_BY_PERSON_DATA.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        inverse: isRTL,
      },
      yAxis: {
        type: 'value',
        axisLine: { show: true },
        axisTick: { show: false },
        axisLabel: { show: true, color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
        position: isRTL ? 'right' : 'left',
      },
      series: [
        {
          type: 'bar',
          data: SALES_BY_PERSON_DATA.map((d) => d.sales),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 24,
        },
      ],
    }),
    [isRTL],
  );

  // ECharts Regional Performance Option (Pie Chart)
  const regionalPerformanceOption: EChartsOption = useMemo(
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
          data: SALES_BY_REGION_DATA.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } })),
        },
      ],
    }),
    [],
  );

  // --- COMPANION CHART: Sankey (Hidden Story) ---
  // Reveals flow from Region -> Salesperson -> Status
  const flowChartOption: EChartsOption = {
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'sankey',
        emphasis: { focus: 'adjacency' },
        data: [
          { name: 'Riyadh' },
          { name: 'Jeddah' },
          { name: 'Dammam' },
          { name: 'Abha' },
          { name: 'Ahmed' },
          { name: 'Sarah' },
          { name: 'Omar' },
          { name: 'Layla' },
          { name: 'Completed' },
          { name: 'Pending' },
          { name: 'Shipped' },
        ],
        links: [
          { source: 'Riyadh', target: 'Ahmed', value: 10 },
          { source: 'Jeddah', target: 'Sarah', value: 8 },
          { source: 'Dammam', target: 'Omar', value: 7 },
          { source: 'Abha', target: 'Layla', value: 5 },
          { source: 'Ahmed', target: 'Completed', value: 8 },
          { source: 'Ahmed', target: 'Pending', value: 2 },
          { source: 'Sarah', target: 'Completed', value: 6 },
          { source: 'Sarah', target: 'Pending', value: 2 },
          { source: 'Omar', target: 'Completed', value: 5 },
          { source: 'Omar', target: 'Shipped', value: 2 },
          { source: 'Layla', target: 'Shipped', value: 5 },
        ],
        lineStyle: { color: 'gradient', curveness: 0.5 },
        label: { fontSize: 10, color: '#64748b' },
      },
    ],
  };

  return (
    <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
      <SalesAnalysisInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-start gap-2 text-start">
          <ChartBar size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('sales_insights_patterns')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{t('sales_insights_patterns_subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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

        {/* --- Row 2: Two Bar Charts Side by Side --- */}

        {/* Sales by Product (Left) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          {isLoading ? (
            <ChartSkeleton height="h-[280px]" title={t('sales_by_product')} />
          ) : (
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
              <div className="flex flex-col gap-0.5 mb-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {t('sales_by_product')}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{t('revenue_generating_items')}</p>
              </div>
              <div className="h-[260px]">
                <MemoizedChart option={salesByProductOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          )}
        </div>

        {/* Sales by Agent (Right) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          {isLoading ? (
            <ChartSkeleton height="h-[280px]" title={t('sales_by_agent')} />
          ) : (
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] animate-fade-in-up">
              <div className="flex flex-col gap-0.5 mb-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('sales_by_agent')}</h3>
                <p className="text-xs text-gray-400 mt-1">{t('individual_contribution')}</p>
              </div>
              <div className="h-[260px]">
                <MemoizedChart option={salesByAgentOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          )}
        </div>

        {/* --- Row 3: Two Charts + 4 Side KPIs --- */}

        {/* Charts Inner Grid (Left Half) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
          {/* Regional Split Pie */}
          {isLoading ? (
            <PieChartSkeleton title={t('regional_split')} />
          ) : (
            <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
              <div className="flex flex-col gap-0.5 mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('regional_split')}</h3>
                <p className="text-xs text-gray-400 mt-1">{t('geographic_distribution')}</p>
              </div>
              <MemoizedChart option={regionPieOption} style={{ height: '210px', minHeight: 100 }} />
            </div>
          )}

          {/* Regional Performance */}
          {isLoading ? (
            <ChartSkeleton height="h-[250px]" title={t('regional_performance')} />
          ) : (
            <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[250px] animate-fade-in-up">
              <div className="flex flex-col gap-0.5 mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {t('regional_performance')}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{t('comparative_volume_territory')}</p>
              </div>
              <div className="h-[210px]">
                <MemoizedChart option={regionalPerformanceOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          )}
        </div>

        {/* 4 Side KPIs (Right Half - 2x2 Grid) */}
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
        <div className="lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Table (1/2 Columns) */}
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col text-start animate-fade-in-up">
              {/* Table Header / Toolbar */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    {t('operational_sales_log')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{t('detailed_transactional_review')}</p>
                </div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-start h-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th
                        className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors text-start"
                        onClick={() => handleSort('id')}
                      >
                        {t('order_id')}
                      </th>
                      <th
                        className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors text-start"
                        onClick={() => handleSort('date')}
                      >
                        {t('date')}
                      </th>
                      <th
                        className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors text-start"
                        onClick={() => handleSort('customer')}
                      >
                        {t('customer')}
                      </th>
                      <th className="px-6 py-4 text-end">{t('total')}</th>
                      <th className="px-6 py-4 text-start">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {paginatedData.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b dark:border-gray-700 last:border-none flex-1"
                      >
                        <td className="px-6 py-5 font-mono text-xs text-blue-600 dark:text-blue-400 text-start">
                          {row.id}
                        </td>
                        <td className="px-6 py-5 text-gray-500 whitespace-nowrap font-datetime text-start">
                          {row.date}
                        </td>
                        <td className="px-6 py-5 font-medium text-gray-900 dark:text-white whitespace-nowrap text-start">
                          {row.customer}
                        </td>
                        <td className="px-6 py-5 text-end font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(row.total, currency.code, currency.symbol)}
                        </td>
                        <td className="px-6 py-5 text-start">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                              row.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : row.status === 'Pending'
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                  : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}
                          >
                            {row.status === 'Completed'
                              ? t('completed')
                              : row.status === 'Pending'
                                ? t('pending')
                                : t('shipped')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10 mt-auto">
                <span className="text-xs text-gray-500">
                  {t('showing_x_of_y')}{' '}
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {(currentPage - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(currentPage * itemsPerPage, processedTableData.length)}
                  </span>{' '}
                  {t('of')}{' '}
                  <span className="font-bold text-gray-700 dark:text-gray-300">{processedTableData.length}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <CaretLeft size={16} />
                  </button>
                  <span className="text-xs font-bold mx-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <CaretRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Companion Chart: Sales Flow Sankey */}
          {isLoading ? (
            <ChartSkeleton height="h-[450px]" title={t('sales_flow')} />
          ) : (
            <div className="lg:col-span-1 bg-white dark:bg-monday-dark-elevated rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col h-full text-start animate-fade-in-up">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('sales_flow')}</h3>
                <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">{t('region_agent_status')}</p>
              </div>
              <div className="flex-1 min-h-[300px]">
                <MemoizedChart
                  option={flowChartOption}
                  style={{ height: '100%', width: '100%', minHeight: 200, minWidth: 100 }}
                />
              </div>
              <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-normal">
                  <strong>{t('insight')}:</strong> {t('analysis_insight')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
