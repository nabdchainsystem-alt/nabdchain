import React, { useState, useEffect, useMemo } from 'react';
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
  Wallet,
  ChartBar,
  Receipt,
  CalendarBlank,
  CurrencyDollar,
} from 'phosphor-react';
import { ExpensesOverviewInfo } from './ExpensesOverviewInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatCurrency } from '../../../utils/formatters';

// --- KPI Data getter functions ---
const getTopKPIs = (
  t: (key: string) => string,
): (KPIConfig & { rawValue?: number; isCurrency?: boolean; color?: string })[] => [
  {
    id: '1',
    label: t('total_expenses'),
    subtitle: t('ytd'),
    value: '0',
    rawValue: 145230,
    isCurrency: true,
    change: '+12%',
    trend: 'up',
    icon: <Wallet size={18} />,
    sparklineData: [120, 125, 130, 135, 140, 145],
    color: 'blue',
  },
  {
    id: '2',
    label: t('monthly_expenses'),
    subtitle: t('current_month'),
    value: '0',
    rawValue: 12450,
    isCurrency: true,
    change: '-5%',
    trend: 'down',
    icon: <CalendarBlank size={18} />,
    sparklineData: [11, 13, 12, 14, 13, 12],
    color: 'blue',
  },
  {
    id: '3',
    label: t('expense_growth'),
    subtitle: t('mom'),
    value: '4.2%',
    change: '+1.1%',
    trend: 'up',
    icon: <TrendUp size={18} />,
    sparklineData: [3, 3.5, 3.8, 4.0, 4.1, 4.2],
    color: 'blue',
  },
  {
    id: '4',
    label: t('expense_categories'),
    subtitle: t('active'),
    value: '12',
    change: '0',
    trend: 'neutral',
    icon: <ChartBar size={18} />,
    sparklineData: [12, 12, 12, 12, 12, 12],
    color: 'blue',
  },
];

const getSideKPIs = (
  t: (key: string) => string,
): (KPIConfig & { rawValue?: number; isCurrency?: boolean; color?: string })[] => [
  {
    id: '5',
    label: t('fixed_vs_variable'),
    subtitle: t('ratio'),
    value: '60/40',
    change: '0',
    trend: 'neutral',
    icon: <Receipt size={18} />,
    sparklineData: [60, 60, 60, 60, 60, 60],
    color: 'blue',
  },
  {
    id: '6',
    label: t('avg_expense_day'),
    subtitle: t('based_on_30_days'),
    value: '0',
    rawValue: 415,
    isCurrency: true,
    change: '-2%',
    trend: 'down',
    icon: <CurrencyDollar size={18} />,
    sparklineData: [420, 425, 430, 420, 415, 415],
    color: 'blue',
  },
  {
    id: '7',
    label: t('high_cost_alerts'),
    subtitle: t('above_threshold'),
    value: '3',
    change: '+1',
    trend: 'up',
    icon: <Warning size={18} />,
    sparklineData: [1, 1, 2, 2, 2, 3],
    color: 'blue',
  },
  {
    id: '8',
    label: t('budget_variance'),
    subtitle: t('vs_plan'),
    value: '-2.3%',
    change: '+0.5%',
    trend: 'up',
    icon: <ChartBar size={18} />,
    sparklineData: [-4, -3.5, -3, -2.8, -2.5, -2.3],
    color: 'blue',
  },
];

// --- Chart Data getter functions ---
const getExpensesByCategory = (t: (key: string) => string) => [
  { name: t('payroll'), value: 45000 },
  { name: t('rent'), value: 20000 },
  { name: t('marketing'), value: 15000 },
  { name: t('software'), value: 8000 },
  { name: t('travel'), value: 5000 },
];

const getExpenseDistribution = (t: (key: string) => string) => [
  { value: 45, name: t('payroll') },
  { value: 20, name: t('rent') },
  { value: 15, name: t('marketing') },
  { value: 8, name: t('software') },
  { value: 12, name: t('other') },
];

const getExpensesByDepartment = (t: (key: string) => string) => [
  { name: t('engineering'), value: 35000 },
  { name: t('sales'), value: 28000 },
  { name: t('marketing'), value: 22000 },
  { name: t('operations'), value: 18000 },
  { name: t('hr'), value: 12000 },
];

const getExpenseTypeSplit = (t: (key: string) => string) => [
  { value: 60, name: t('fixed') },
  { value: 40, name: t('variable') },
];

// --- Table Data getter function ---
const getExpenseTable = (t: (key: string) => string) => [
  {
    id: 'EXP-101',
    category: t('marketing'),
    rawAmount: 4500,
    date: '2023-06-15',
    type: t('variable'),
    status: t('approved'),
    statusKey: 'approved',
  },
  {
    id: 'EXP-102',
    category: t('software'),
    rawAmount: 299,
    date: '2023-06-16',
    type: t('fixed'),
    status: t('pending'),
    statusKey: 'pending',
  },
  {
    id: 'EXP-103',
    category: t('travel'),
    rawAmount: 1200,
    date: '2023-06-18',
    type: t('variable'),
    status: t('approved'),
    statusKey: 'approved',
  },
  {
    id: 'EXP-104',
    category: t('office'),
    rawAmount: 150,
    date: '2023-06-20',
    type: t('variable'),
    status: t('pending'),
    statusKey: 'pending',
  },
  {
    id: 'EXP-105',
    category: t('rent'),
    rawAmount: 5000,
    date: '2023-06-01',
    type: t('fixed'),
    status: t('paid'),
    statusKey: 'paid',
  },
];

// Radial Data getter function
const getRadialData = (t: (key: string) => string) => ({
  indicator: [
    { name: t('payroll'), max: 100 },
    { name: t('rent'), max: 100 },
    { name: t('marketing'), max: 100 },
    { name: t('software'), max: 100 },
    { name: t('travel'), max: 100 },
    { name: t('office'), max: 100 },
  ],
  series: [
    {
      value: [90, 80, 70, 40, 30, 20],
      name: t('spend_density'),
    },
  ],
});

export const ExpensesOverviewDashboard: React.FC = () => {
  const { currency } = useAppContext();
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';
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

  // Memoize translated data to prevent re-renders
  const TOP_KPIS = useMemo(() => getTopKPIs(t), [t]);
  const SIDE_KPIS = useMemo(() => getSideKPIs(t), [t]);
  const EXPENSES_BY_CATEGORY = useMemo(() => getExpensesByCategory(t), [t]);
  const EXPENSES_BY_DEPARTMENT = useMemo(() => getExpensesByDepartment(t), [t]);
  const EXPENSE_DISTRIBUTION = useMemo(() => getExpenseDistribution(t), [t]);
  const EXPENSE_TYPE_SPLIT = useMemo(() => getExpenseTypeSplit(t), [t]);
  const EXPENSE_TABLE = useMemo(() => getExpenseTable(t), [t]);
  const RADIAL_DATA = useMemo(() => getRadialData(t), [t]);

  // --- Memoized ECharts Options ---

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
          data: EXPENSE_DISTRIBUTION,
          color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
        },
      ],
    }),
    [EXPENSE_DISTRIBUTION],
  );

  // Expense Type Split Pie
  const expenseTypePieOption = useMemo<EChartsOption>(
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
          data: EXPENSE_TYPE_SPLIT,
          color: ['#64748b', '#3b82f6'],
        },
      ],
    }),
    [EXPENSE_TYPE_SPLIT],
  );

  // Bar Chart - Expenses by Category
  const expensesByCategoryOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: EXPENSES_BY_CATEGORY.map((d) => d.name),
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
          data: EXPENSES_BY_CATEGORY.map((d) => d.value),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 24,
        },
      ],
    }),
    [EXPENSES_BY_CATEGORY, isRTL],
  );

  // Bar Chart - Expenses by Department
  const expensesByDepartmentOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: EXPENSES_BY_DEPARTMENT.map((d) => d.name),
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
          data: EXPENSES_BY_DEPARTMENT.map((d) => d.value),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 24,
        },
      ],
    }),
    [EXPENSES_BY_DEPARTMENT, isRTL],
  );

  // Radial (Radar) Chart - Using Radar primarily as requested "Radial Expense Density" usually implies radar or polar bar
  const radarOption = useMemo<EChartsOption>(
    () => ({
      title: { text: t('spend_concentration'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
      tooltip: {},
      radar: {
        indicator: RADIAL_DATA.indicator,
        center: ['50%', '55%'],
        radius: '65%',
        splitNumber: 4,
        axisName: { color: '#6b7280', fontSize: 10 },
        splitArea: {
          areaStyle: {
            color: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db'],
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 10,
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: RADIAL_DATA.series[0].value,
              name: t('spend_density'),
              areaStyle: { color: 'rgba(59, 130, 246, 0.4)' },
              lineStyle: { color: '#3b82f6' },
              itemStyle: { color: '#3b82f6' },
            },
          ],
        },
      ],
    }),
    [RADIAL_DATA, t],
  );

  return (
    <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
      <ExpensesOverviewInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-2">
          <Wallet size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t('expenses_overview')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('operational_spending_snapshot')}</p>
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
              color={kpi.color || 'blue'}
              loading={isLoading}
            />
          </div>
        ))}

        {/* --- Row 2: Two Charts Side by Side --- */}

        {/* Recharts: By Category (Bar) */}
        {isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <ChartSkeleton height="h-[300px]" title={t('expenses_by_category')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('expenses_by_category')}
              </h3>
              <p className="text-xs text-gray-400">{t('top_cost_centers')}</p>
            </div>
            <MemoizedChart option={expensesByCategoryOption} style={{ height: '220px', width: '100%' }} />
          </div>
        )}

        {/* Recharts: By Department (Bar) */}
        {isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <ChartSkeleton height="h-[300px]" title={t('expenses_by_department')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[300px]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('expenses_by_department')}
              </h3>
              <p className="text-xs text-gray-400">{t('departmental_spending')}</p>
            </div>
            <MemoizedChart option={expensesByDepartmentOption} style={{ height: '220px', width: '100%' }} />
          </div>
        )}

        {/* --- Row 3: Two Pie Charts + 4 Side KPIs in 2x2 Grid --- */}

        {/* Left: Two Pie Charts in nested 2-col grid */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
          {/* ECharts: Distribution (Pie) */}
          {isLoading ? (
            <div className="col-span-1">
              <PieChartSkeleton title={t('cost_distribution')} />
            </div>
          ) : (
            <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('cost_distribution')}
                </h3>
                <p className="text-xs text-gray-400">{t('share_of_wallet')}</p>
              </div>
              <MemoizedChart option={pieOption} style={{ height: '180px' }} />
            </div>
          )}

          {/* ECharts: Fixed vs Variable (Pie) */}
          {isLoading ? (
            <div className="col-span-1">
              <PieChartSkeleton title={t('fixed_vs_variable')} />
            </div>
          ) : (
            <div className="col-span-1 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up min-h-[250px]">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('fixed_vs_variable')}
                </h3>
                <p className="text-xs text-gray-400">{t('cost_structure_split')}</p>
              </div>
              <MemoizedChart option={expenseTypePieOption} style={{ height: '180px' }} />
            </div>
          )}
        </div>

        {/* Right: 4 Side KPIs in 2x2 Grid */}
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

        {/* --- Row 4: Final Section (Table + Companion) --- */}

        {/* Table (2 cols) */}
        {isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <TableSkeleton rows={5} columns={5} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {t('recent_transactions')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                  <tr>
                    <th className="px-5 py-3 text-start">{t('type')}</th>
                    <th className="px-5 py-3 text-start">{t('category')}</th>
                    <th className="px-5 py-3 text-start">{t('date')}</th>
                    <th className="px-5 py-3 text-end">{t('amount')}</th>
                    <th className="px-5 py-3 text-center">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {EXPENSE_TABLE.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-start">{row.type}</td>
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">
                        {row.category}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400 font-datetime text-start">
                        {row.date}
                      </td>
                      <td className="px-5 py-3 text-end text-gray-900 dark:text-gray-100">
                        {formatCurrency(row.rawAmount, currency.code, currency.symbol)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.statusKey === 'approved' || row.statusKey === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
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

        {/* Companion Chart: Radar (2 cols) */}
        {isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <PieChartSkeleton size={240} title={t('spend_concentration')} />
          </div>
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-fade-in-up">
            <MemoizedChart option={radarOption} style={{ height: '300px', width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
};
