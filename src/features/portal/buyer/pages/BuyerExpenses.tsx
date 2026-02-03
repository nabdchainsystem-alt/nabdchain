import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ExpandedState,
} from '@tanstack/react-table';
import {
  CaretDown,
  CaretRight,
  Warning,
  TrendUp,
  TrendDown,
  ArrowSquareOut,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Funnel,
  ArrowsClockwise,
  CurrencyCircleDollar,
  ChartLine,
  Wallet,
  Receipt,
  CaretLeft,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { expenseAnalyticsService } from '../../services/expenseAnalyticsService';
import {
  ExpenseAnalyticsDashboard,
  SpendLeakage,
  PriceDriftAlert,
  CategoryInefficiency,
  BudgetActual,
  ExpenseLineItem,
  getSeverityConfig,
  getLeakageTypeConfig,
  formatExpenseAmount,
  getVarianceStatus,
} from '../../types/expense.types';

interface BuyerExpensesProps {
  onNavigate?: (page: string, data?: Record<string, unknown>) => void;
}

type Period = 'week' | 'month' | 'quarter' | 'year';
type ActiveSection = 'leakages' | 'price-drift' | 'budget' | 'inefficiency' | 'transactions';

// =============================================================================
// KPI Card Component
// =============================================================================
const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning' | 'error' | 'success';
  styles: Record<string, string>;
  isRTL: boolean;
}> = ({ title, value, subtitle, icon, trend, variant = 'default', styles, isRTL }) => {
  const variantColors = {
    default: styles.info,
    warning: '#f59e0b',
    error: styles.error,
    success: styles.success,
  };

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: styles.textMuted }}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: styles.textPrimary }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {trend.isPositive ? (
                <TrendUp size={14} style={{ color: styles.success }} />
              ) : (
                <TrendDown size={14} style={{ color: styles.error }} />
              )}
              <span
                className="text-xs font-medium"
                style={{ color: trend.isPositive ? styles.success : styles.error }}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${variantColors[variant]}15` }}
        >
          {React.cloneElement(icon as React.ReactElement, {
            size: 24,
            style: { color: variantColors[variant] },
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Section Header Component
// =============================================================================
const SectionHeader: React.FC<{
  title: string;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  styles: Record<string, string>;
  isRTL: boolean;
}> = ({ title, count, isExpanded, onToggle, actions, styles, isRTL }) => (
  <div
    className={`flex items-center justify-between p-4 rounded-t-lg cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
    style={{ backgroundColor: styles.bgSecondary }}
    onClick={onToggle}
  >
    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {isExpanded ? (
        <CaretDown size={18} style={{ color: styles.textMuted }} />
      ) : (
        isRTL ? <CaretLeft size={18} style={{ color: styles.textMuted }} /> : <CaretRight size={18} style={{ color: styles.textMuted }} />
      )}
      <h3 className="font-semibold" style={{ color: styles.textPrimary }}>
        {title}
      </h3>
      {count !== undefined && (
        <span
          className="px-2 py-0.5 text-xs font-medium rounded-full"
          style={{ backgroundColor: styles.info, color: '#fff' }}
        >
          {count}
        </span>
      )}
    </div>
    {actions && (
      <div onClick={(e) => e.stopPropagation()}>
        {actions}
      </div>
    )}
  </div>
);

// =============================================================================
// Status Badge Component
// =============================================================================
const StatusBadge: React.FC<{
  status: string;
  styles: Record<string, string>;
}> = ({ status, styles }) => {
  const statusConfig: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    open: { bg: `${styles.error}20`, color: styles.error, icon: <XCircle size={12} /> },
    investigating: { bg: '#f59e0b20', color: '#f59e0b', icon: <Clock size={12} /> },
    resolved: { bg: `${styles.success}20`, color: styles.success, icon: <CheckCircle size={12} /> },
    dismissed: { bg: `${styles.textMuted}20`, color: styles.textMuted, icon: <XCircle size={12} /> },
    new: { bg: `${styles.info}20`, color: styles.info, icon: <Warning size={12} /> },
    acknowledged: { bg: '#f59e0b20', color: '#f59e0b', icon: <Eye size={12} /> },
    negotiating: { bg: `${styles.info}20`, color: styles.info, icon: <ArrowsClockwise size={12} /> },
  };

  const config = statusConfig[status] || statusConfig.open;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.icon}
      {status.replace('_', ' ')}
    </span>
  );
};

// =============================================================================
// Main Component
// =============================================================================
export const BuyerExpenses: React.FC<BuyerExpensesProps> = () => {
  const { styles, t, direction, language } = usePortal();
  const { getToken } = useAuth();
  const isRTL = direction === 'rtl';

  const [dashboard, setDashboard] = useState<ExpenseAnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [expandedSections, setExpandedSections] = useState<Set<ActiveSection>>(
    new Set(['leakages', 'price-drift'])
  );
  const [leakageSorting, setLeakageSorting] = useState<SortingState>([]);
  const [driftSorting, setDriftSorting] = useState<SortingState>([]);
  const [inefficiencyExpanded, setInefficiencyExpanded] = useState<ExpandedState>({});
  const [selectedTransaction, setSelectedTransaction] = useState<ExpenseLineItem | null>(null);

  const toggleSection = useCallback((section: ActiveSection) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await expenseAnalyticsService.getDashboard(token, { period });
      setDashboard(data);
    } catch (err) {
      console.error('Failed to fetch expense analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =============================================================================
  // Leakage Table
  // =============================================================================
  const leakageColumnHelper = createColumnHelper<SpendLeakage>();
  const leakageColumns = useMemo(
    () => [
      leakageColumnHelper.accessor('severity', {
        header: () => t('buyer.expenses.severity'),
        cell: (info) => {
          const config = getSeverityConfig(info.getValue());
          return (
            <span
              className="px-2 py-1 rounded text-xs font-bold uppercase"
              style={{
                backgroundColor: config.color === 'error' ? `${styles.error}20` :
                  config.color === 'warning' ? '#f59e0b20' : `${styles.info}20`,
                color: config.color === 'error' ? styles.error :
                  config.color === 'warning' ? '#f59e0b' : styles.info,
              }}
            >
              {language === 'ar' ? config.labelAr : config.label}
            </span>
          );
        },
      }),
      leakageColumnHelper.accessor('type', {
        header: () => t('buyer.expenses.type'),
        cell: (info) => {
          const config = getLeakageTypeConfig(info.getValue());
          return (
            <span style={{ color: styles.textPrimary }}>
              {language === 'ar' ? config.labelAr : config.label}
            </span>
          );
        },
      }),
      leakageColumnHelper.accessor('amount', {
        header: () => t('buyer.expenses.amount'),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.error }}>
            {formatExpenseAmount(info.getValue(), 'SAR', language)}
          </span>
        ),
      }),
      leakageColumnHelper.accessor('supplierName', {
        header: () => t('buyer.expenses.supplier'),
        cell: (info) => (
          <span style={{ color: styles.textSecondary }}>{info.getValue() || '-'}</span>
        ),
      }),
      leakageColumnHelper.accessor('description', {
        header: () => t('buyer.expenses.description'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textSecondary }}>
            {info.getValue()}
          </span>
        ),
      }),
      leakageColumnHelper.accessor('status', {
        header: () => t('buyer.expenses.status'),
        cell: (info) => <StatusBadge status={info.getValue()} styles={styles} />,
      }),
      leakageColumnHelper.display({
        id: 'actions',
        header: () => t('common.actions'),
        cell: (info) => (
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('buyer.expenses.investigate')}
            >
              <Eye size={16} style={{ color: styles.textMuted }} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('buyer.expenses.viewPO')}
            >
              <ArrowSquareOut size={16} style={{ color: styles.textMuted }} />
            </button>
          </div>
        ),
      }),
    ],
    [t, styles, language]
  );

  const leakageTable = useReactTable({
    data: dashboard?.leakages || [],
    columns: leakageColumns,
    state: { sorting: leakageSorting },
    onSortingChange: setLeakageSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // =============================================================================
  // Price Drift Table
  // =============================================================================
  const driftColumnHelper = createColumnHelper<PriceDriftAlert>();
  const driftColumns = useMemo(
    () => [
      driftColumnHelper.accessor('productName', {
        header: () => t('buyer.expenses.product'),
        cell: (info) => (
          <div>
            <span className="font-medium" style={{ color: styles.textPrimary }}>
              {info.getValue()}
            </span>
            {info.row.original.sku && (
              <span className="block text-xs" style={{ color: styles.textMuted }}>
                SKU: {info.row.original.sku}
              </span>
            )}
          </div>
        ),
      }),
      driftColumnHelper.accessor('supplierName', {
        header: () => t('buyer.expenses.supplier'),
        cell: (info) => (
          <span style={{ color: styles.textSecondary }}>{info.getValue()}</span>
        ),
      }),
      driftColumnHelper.accessor('previousPrice', {
        header: () => t('buyer.expenses.previousPrice'),
        cell: (info) => (
          <span style={{ color: styles.textSecondary }}>
            {formatExpenseAmount(info.getValue(), info.row.original.currency, language)}
          </span>
        ),
      }),
      driftColumnHelper.accessor('currentPrice', {
        header: () => t('buyer.expenses.currentPrice'),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {formatExpenseAmount(info.getValue(), info.row.original.currency, language)}
          </span>
        ),
      }),
      driftColumnHelper.accessor('priceChangePercent', {
        header: () => t('buyer.expenses.change'),
        cell: (info) => {
          const value = info.getValue();
          const isUp = value > 0;
          return (
            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {isUp ? (
                <TrendUp size={14} style={{ color: styles.error }} />
              ) : (
                <TrendDown size={14} style={{ color: styles.success }} />
              )}
              <span
                className="font-medium"
                style={{ color: isUp ? styles.error : styles.success }}
              >
                {value > 0 ? '+' : ''}{value.toFixed(1)}%
              </span>
            </div>
          );
        },
      }),
      driftColumnHelper.accessor('marketAverage', {
        header: () => t('buyer.expenses.marketAvg'),
        cell: (info) => {
          const market = info.getValue();
          if (!market) return '-';
          const current = info.row.original.currentPrice;
          const variance = ((current - market) / market) * 100;
          return (
            <div>
              <span style={{ color: styles.textSecondary }}>
                {formatExpenseAmount(market, info.row.original.currency, language)}
              </span>
              <span
                className="block text-xs"
                style={{ color: variance > 0 ? styles.error : styles.success }}
              >
                {variance > 0 ? '+' : ''}{variance.toFixed(1)}% vs market
              </span>
            </div>
          );
        },
      }),
      driftColumnHelper.accessor('status', {
        header: () => t('buyer.expenses.status'),
        cell: (info) => <StatusBadge status={info.getValue()} styles={styles} />,
      }),
    ],
    [t, styles, language, isRTL]
  );

  const driftTable = useReactTable({
    data: dashboard?.priceDrifts || [],
    columns: driftColumns,
    state: { sorting: driftSorting },
    onSortingChange: setDriftSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // =============================================================================
  // Budget vs Actual Table
  // =============================================================================
  const budgetColumnHelper = createColumnHelper<BudgetActual>();
  const budgetColumns = useMemo(
    () => [
      budgetColumnHelper.accessor('periodLabel', {
        header: () => t('buyer.expenses.period'),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      budgetColumnHelper.accessor('budget', {
        header: () => t('buyer.expenses.budget'),
        cell: (info) => (
          <span style={{ color: styles.textSecondary }}>
            {formatExpenseAmount(info.getValue(), 'SAR', language)}
          </span>
        ),
      }),
      budgetColumnHelper.accessor('actual', {
        header: () => t('buyer.expenses.actual'),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {formatExpenseAmount(info.getValue(), 'SAR', language)}
          </span>
        ),
      }),
      budgetColumnHelper.accessor('committed', {
        header: () => t('buyer.expenses.committed'),
        cell: (info) => (
          <span style={{ color: styles.info }}>
            {formatExpenseAmount(info.getValue(), 'SAR', language)}
          </span>
        ),
      }),
      budgetColumnHelper.accessor('available', {
        header: () => t('buyer.expenses.available'),
        cell: (info) => {
          const value = info.getValue();
          return (
            <span
              className="font-medium"
              style={{ color: value >= 0 ? styles.success : styles.error }}
            >
              {formatExpenseAmount(value, 'SAR', language)}
            </span>
          );
        },
      }),
      budgetColumnHelper.accessor('variancePercent', {
        header: () => t('buyer.expenses.variance'),
        cell: (info) => {
          const value = info.getValue();
          const status = getVarianceStatus(value);
          return (
            <span
              className="font-medium"
              style={{
                color: status.status === 'good' ? styles.success :
                  status.status === 'warning' ? '#f59e0b' : styles.error,
              }}
            >
              {value > 0 ? '+' : ''}{value.toFixed(1)}%
            </span>
          );
        },
      }),
    ],
    [t, styles, language]
  );

  const budgetTable = useReactTable({
    data: dashboard?.budgetTrend || [],
    columns: budgetColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // =============================================================================
  // Category Inefficiency Table
  // =============================================================================
  const inefficiencyColumnHelper = createColumnHelper<CategoryInefficiency>();
  const inefficiencyColumns = useMemo(
    () => [
      inefficiencyColumnHelper.display({
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={() => row.toggleExpanded()}
            className="p-1"
          >
            {row.getIsExpanded() ? (
              <CaretDown size={16} style={{ color: styles.textMuted }} />
            ) : (
              isRTL ? <CaretLeft size={16} style={{ color: styles.textMuted }} /> : <CaretRight size={16} style={{ color: styles.textMuted }} />
            )}
          </button>
        ),
      }),
      inefficiencyColumnHelper.accessor('category', {
        header: () => t('buyer.expenses.category'),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {language === 'ar' && info.row.original.categoryAr
              ? info.row.original.categoryAr
              : info.getValue()}
          </span>
        ),
      }),
      inefficiencyColumnHelper.accessor('inefficiencyScore', {
        header: () => t('buyer.expenses.inefficiencyScore'),
        cell: (info) => {
          const score = info.getValue();
          const isHigh = score >= 60;
          const isMedium = score >= 40;
          return (
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-16 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${score}%`,
                    backgroundColor: isHigh ? styles.error : isMedium ? '#f59e0b' : styles.success,
                  }}
                />
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: isHigh ? styles.error : isMedium ? '#f59e0b' : styles.success,
                }}
              >
                {score}
              </span>
            </div>
          );
        },
      }),
      inefficiencyColumnHelper.accessor('potentialSavings', {
        header: () => t('buyer.expenses.potentialSavings'),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.success }}>
            {formatExpenseAmount(info.getValue(), 'SAR', language)}
          </span>
        ),
      }),
      inefficiencyColumnHelper.accessor('recommendations', {
        header: () => t('buyer.expenses.topRecommendation'),
        cell: (info) => {
          const recs = info.getValue();
          return (
            <span className="text-sm" style={{ color: styles.textSecondary }}>
              {recs[0] || '-'}
            </span>
          );
        },
      }),
    ],
    [t, styles, language, isRTL]
  );

  const inefficiencyTable = useReactTable({
    data: dashboard?.inefficiencies || [],
    columns: inefficiencyColumns,
    state: { expanded: inefficiencyExpanded },
    onExpandedChange: setInefficiencyExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  // =============================================================================
  // Transaction Drill-Down Panel
  // =============================================================================
  const renderTransactionDetails = (transaction: ExpenseLineItem) => (
    <div
      className="fixed inset-y-0 right-0 w-96 shadow-xl z-50 overflow-y-auto"
      style={{ backgroundColor: styles.bgCard }}
    >
      <div className="p-4 border-b" style={{ borderColor: styles.border }}>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="font-semibold" style={{ color: styles.textPrimary }}>
            {t('buyer.expenses.transactionDetails')}
          </h3>
          <button
            onClick={() => setSelectedTransaction(null)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XCircle size={20} style={{ color: styles.textMuted }} />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs uppercase" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.poNumber')}
          </p>
          <p className="font-medium" style={{ color: styles.textPrimary }}>
            {transaction.poNumber || '-'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.supplier')}
          </p>
          <p className="font-medium" style={{ color: styles.textPrimary }}>
            {transaction.supplierName}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.amount')}
          </p>
          <p className="text-xl font-bold" style={{ color: styles.textPrimary }}>
            {formatExpenseAmount(transaction.amount, transaction.currency, language)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.category')}
          </p>
          <p style={{ color: styles.textSecondary }}>{transaction.category}</p>
        </div>
        <div>
          <p className="text-xs uppercase" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.description')}
          </p>
          <p style={{ color: styles.textSecondary }}>{transaction.description}</p>
        </div>
        <div>
          <p className="text-xs uppercase" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.paymentStatus')}
          </p>
          <StatusBadge status={transaction.paymentStatus} styles={styles} />
        </div>
        {transaction.hasAnomaly && (
          <div
            className="p-3 rounded-lg border"
            style={{ borderColor: styles.error, backgroundColor: `${styles.error}10` }}
          >
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Warning size={16} style={{ color: styles.error }} />
              <span className="text-sm font-medium" style={{ color: styles.error }}>
                {t('buyer.expenses.anomalyDetected')}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: styles.textSecondary }}>
              {transaction.anomalyType?.replace('_', ' ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // =============================================================================
  // Render Table Helper
  // =============================================================================
  const renderTable = <T,>(
    table: ReturnType<typeof useReactTable<T>>,
    emptyMessage: string
  ) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
                    isRTL ? 'text-right' : 'text-left'
                  }`}
                  style={{ color: styles.textMuted, backgroundColor: styles.bgSecondary }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className="px-4 py-8 text-center"
                style={{ color: styles.textMuted }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  style={{ borderColor: styles.border }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`px-4 py-3 text-sm ${isRTL ? 'text-right' : ''}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {/* Expanded row for inefficiency details */}
                {row.getIsExpanded() && 'factors' in row.original && (
                  <tr style={{ backgroundColor: styles.bgSecondary }}>
                    <td colSpan={table.getAllColumns().length} className="px-4 py-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                          {t('buyer.expenses.inefficiencyFactors')}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {(row.original as CategoryInefficiency).factors.map((factor, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded border"
                              style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
                            >
                              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                                  {factor.factor}
                                </span>
                                <span
                                  className="text-xs px-2 py-0.5 rounded"
                                  style={{
                                    backgroundColor: factor.impact === 'high' ? `${styles.error}20` :
                                      factor.impact === 'medium' ? '#f59e0b20' : `${styles.success}20`,
                                    color: factor.impact === 'high' ? styles.error :
                                      factor.impact === 'medium' ? '#f59e0b' : styles.success,
                                  }}
                                >
                                  {factor.impact}
                                </span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
                                {factor.description}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2" style={{ color: styles.textPrimary }}>
                            {t('buyer.expenses.recommendations')}
                          </h4>
                          <ul className="space-y-1">
                            {(row.original as CategoryInefficiency).recommendations.map((rec, idx) => (
                              <li
                                key={idx}
                                className={`text-sm flex items-start gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                                style={{ color: styles.textSecondary }}
                              >
                                <span style={{ color: styles.info }}>•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // =============================================================================
  // Loading State
  // =============================================================================
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-pulse" style={{ color: styles.textMuted }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  const summary = dashboard?.summary;

  return (
    <div className="p-6 space-y-6" dir={direction}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
            {t('buyer.expenses.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: styles.textSecondary }}>
            {t('buyer.expenses.subtitle')}
          </p>
        </div>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Funnel size={16} style={{ color: styles.textMuted }} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: styles.border,
              backgroundColor: styles.bgCard,
              color: styles.textPrimary,
            }}
          >
            <option value="week">{t('buyer.expenses.thisWeek')}</option>
            <option value="month">{t('buyer.expenses.thisMonth')}</option>
            <option value="quarter">{t('buyer.expenses.thisQuarter')}</option>
            <option value="year">{t('buyer.expenses.thisYear')}</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('buyer.expenses.totalSpend')}
          value={formatExpenseAmount(summary?.totalSpend || 0, 'SAR', language)}
          subtitle={`${t('buyer.expenses.budgetUtilization')}: ${summary?.budgetUtilization?.toFixed(1) || 0}%`}
          icon={<CurrencyCircleDollar />}
          trend={summary?.periodComparison ? {
            value: summary.periodComparison.changePercent,
            isPositive: summary.periodComparison.changePercent < 0,
          } : undefined}
          styles={styles}
          isRTL={isRTL}
        />
        <KPICard
          title={t('buyer.expenses.leakageAmount')}
          value={formatExpenseAmount(summary?.leakageAmount || 0, 'SAR', language)}
          subtitle={`${summary?.leakageCount || 0} ${t('buyer.expenses.issuesDetected')}`}
          icon={<ChartLine />}
          variant="error"
          styles={styles}
          isRTL={isRTL}
        />
        <KPICard
          title={t('buyer.expenses.priceDriftImpact')}
          value={formatExpenseAmount(summary?.priceDriftImpact || 0, 'SAR', language)}
          subtitle={t('buyer.expenses.estimatedExtraCost')}
          icon={<TrendUp />}
          variant="warning"
          styles={styles}
          isRTL={isRTL}
        />
        <KPICard
          title={t('buyer.expenses.avgTransaction')}
          value={formatExpenseAmount(summary?.avgTransactionSize || 0, 'SAR', language)}
          subtitle={`${summary?.transactionCount || 0} ${t('buyer.expenses.transactions')}`}
          icon={<Receipt />}
          styles={styles}
          isRTL={isRTL}
        />
      </div>

      {/* Spend Leakage Section */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <SectionHeader
          title={t('buyer.expenses.spendLeakage')}
          count={dashboard?.leakages?.filter((l) => l.status === 'open').length}
          isExpanded={expandedSections.has('leakages')}
          onToggle={() => toggleSection('leakages')}
          styles={styles}
          isRTL={isRTL}
        />
        {expandedSections.has('leakages') && renderTable(leakageTable, t('buyer.expenses.noLeakages'))}
      </div>

      {/* Price Drift Section */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <SectionHeader
          title={t('buyer.expenses.priceDriftAlerts')}
          count={dashboard?.priceDrifts?.filter((d) => d.status === 'new').length}
          isExpanded={expandedSections.has('price-drift')}
          onToggle={() => toggleSection('price-drift')}
          styles={styles}
          isRTL={isRTL}
        />
        {expandedSections.has('price-drift') && renderTable(driftTable, t('buyer.expenses.noPriceDrifts'))}
      </div>

      {/* Budget vs Actual Section */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <SectionHeader
          title={t('buyer.expenses.budgetVsActual')}
          isExpanded={expandedSections.has('budget')}
          onToggle={() => toggleSection('budget')}
          styles={styles}
          isRTL={isRTL}
        />
        {expandedSections.has('budget') && renderTable(budgetTable, t('buyer.expenses.noBudgetData'))}
      </div>

      {/* Category Inefficiency Section */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <SectionHeader
          title={t('buyer.expenses.categoryInefficiency')}
          isExpanded={expandedSections.has('inefficiency')}
          onToggle={() => toggleSection('inefficiency')}
          styles={styles}
          isRTL={isRTL}
        />
        {expandedSections.has('inefficiency') && renderTable(inefficiencyTable, t('buyer.expenses.noInefficiencies'))}
      </div>

      {/* Recent Transactions Section */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <SectionHeader
          title={t('buyer.expenses.recentTransactions')}
          count={dashboard?.recentTransactions?.length}
          isExpanded={expandedSections.has('transactions')}
          onToggle={() => toggleSection('transactions')}
          styles={styles}
          isRTL={isRTL}
        />
        {expandedSections.has('transactions') && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th
                    className={`px-4 py-3 text-xs font-semibold uppercase ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ color: styles.textMuted, backgroundColor: styles.bgSecondary }}
                  >
                    {t('buyer.expenses.date')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-semibold uppercase ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ color: styles.textMuted, backgroundColor: styles.bgSecondary }}
                  >
                    {t('buyer.expenses.poNumber')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-semibold uppercase ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ color: styles.textMuted, backgroundColor: styles.bgSecondary }}
                  >
                    {t('buyer.expenses.supplier')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-semibold uppercase ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ color: styles.textMuted, backgroundColor: styles.bgSecondary }}
                  >
                    {t('buyer.expenses.category')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-semibold uppercase ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ color: styles.textMuted, backgroundColor: styles.bgSecondary }}
                  >
                    {t('buyer.expenses.amount')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-semibold uppercase ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ color: styles.textMuted, backgroundColor: styles.bgSecondary }}
                  >
                    {t('buyer.expenses.status')}
                  </th>
                  <th
                    className={`px-4 py-3 text-xs font-semibold uppercase ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ color: styles.textMuted, backgroundColor: styles.bgSecondary }}
                  >
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.recentTransactions?.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    style={{ borderColor: styles.border }}
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: styles.textSecondary }}>
                      {new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: styles.textPrimary }}>
                      {tx.poNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: styles.textSecondary }}>
                      {tx.supplierName}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: styles.textSecondary }}>
                      {tx.category}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: styles.textPrimary }}>
                      {formatExpenseAmount(tx.amount, tx.currency, language)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.paymentStatus} styles={styles} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {tx.hasAnomaly && (
                          <Warning size={16} style={{ color: styles.error }} />
                        )}
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(tx);
                          }}
                        >
                          <Eye size={16} style={{ color: styles.textMuted }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Detail Panel */}
      {selectedTransaction && renderTransactionDetails(selectedTransaction)}

      {/* Overlay for detail panel */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};

export default BuyerExpenses;
