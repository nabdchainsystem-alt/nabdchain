/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ExpandedState,
} from '@tanstack/react-table';
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Plus,
  Funnel,
  X,
  Truck,
  Scales,
  Cube,
  DotsThree,
  Warning,
  TrendUp,
  TrendDown,
  ArrowUpRight,
  ArrowDownRight,
  Lightning,
  ShieldWarning,
  Gauge,
  Target,
  Info,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import { Select } from '../../../components';
import {
  buyerWorkspaceService,
  Expense,
  ExpenseCategory,
  EnhancedExpenseSummary,
  CreateExpenseData,
  SpendLeakage,
  PriceDriftAlert,
  BudgetVsActual,
  CategoryInefficiency,
} from '../../../services/buyerWorkspaceService';

interface ExpensesTabProps {
  onNavigate?: (page: string) => void;
}

const columnHelper = createColumnHelper<Expense>();

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ size: number; style?: React.CSSProperties }>> = {
  shipping: Truck,
  customs: Scales,
  storage: Cube,
  other: DotsThree,
};

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string }> = {
  shipping: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  customs: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  storage: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  other: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
};

// =============================================================================
// Financial Health Score Component
// =============================================================================

const HealthScoreIndicator: React.FC<{
  score: number;
  styles: any;
  t: (key: string) => string;
  isRTL: boolean;
}> = ({ score, styles, t, isRTL }) => {
  const color = score >= 70 ? styles.success : score >= 50 ? '#f59e0b' : styles.error;
  const label =
    score >= 70
      ? t('buyer.expenses.healthy')
      : score >= 50
        ? t('buyer.expenses.needsAttention')
        : t('buyer.expenses.atRisk');

  return (
    <div className="p-4 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Gauge size={18} style={{ color }} />
        <span className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
          {t('buyer.expenses.financialHealth')}
        </span>
      </div>
      <div className={`flex items-end gap-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <p className="text-2xl font-bold" style={{ color }}>
          {score}
        </p>
        <span className="text-sm pb-0.5" style={{ color: styles.textMuted }}>
          /100
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color }}>
        {label}
      </p>
    </div>
  );
};

// =============================================================================
// Spend Leakage Alert Component
// =============================================================================

const LeakageAlerts: React.FC<{
  leakages: SpendLeakage[];
  onDismiss: (id: string) => void;
  styles: any;
  t: (key: string) => string;
  isRTL: boolean;
}> = ({ leakages, onDismiss, styles, t, isRTL }) => {
  if (leakages.length === 0) return null;

  const severityColors = {
    high: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: '#ef4444' },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: '#f59e0b',
    },
    low: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: '#3b82f6' },
  };

  return (
    <div className="mb-4 space-y-2">
      {leakages.slice(0, 3).map((leak) => {
        const colors = severityColors[leak.severity];
        return (
          <div
            key={leak.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${colors.bg} ${colors.border} ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <ShieldWarning size={18} weight="fill" style={{ color: colors.icon }} />
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  {t('buyer.expenses.leakageDetected')}: SAR {leak.amount.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: styles.textSecondary }}>
                  {leak.description}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span
                className="text-xs px-2 py-1 rounded-md"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
              >
                {leak.recommendation}
              </span>
              <button
                onClick={() => onDismiss(leak.id)}
                className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={14} style={{ color: styles.textMuted }} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// Price Drift Inline Alert
// =============================================================================

const PriceDriftInlineAlert: React.FC<{
  alerts: PriceDriftAlert[];
  styles: any;
  t: (key: string) => string;
  isRTL: boolean;
}> = ({ alerts, styles, t, isRTL }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-4 p-3 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
      <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <TrendUp size={16} style={{ color: styles.error }} />
        <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
          {t('buyer.expenses.priceDriftAlerts')} ({alerts.length})
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-center justify-between py-2 border-t first:border-0 ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ borderColor: styles.border }}
          >
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-sm" style={{ color: styles.textPrimary }}>
                {alert.itemName}
              </p>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {alert.supplierName}
              </p>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm" style={{ color: styles.textMuted }}>
                {alert.currency} {alert.previousPrice}
              </span>
              {alert.driftDirection === 'up' ? (
                <ArrowUpRight size={14} style={{ color: styles.error }} />
              ) : (
                <ArrowDownRight size={14} style={{ color: styles.success }} />
              )}
              <span
                className="text-sm font-medium"
                style={{ color: alert.driftDirection === 'up' ? styles.error : styles.success }}
              >
                {alert.currency} {alert.currentPrice}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                  alert.driftDirection === 'up'
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {alert.driftDirection === 'up' ? '+' : ''}
                {alert.driftPercent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Budget vs Actual Drill-Down Row
// =============================================================================

const BudgetDrillDown: React.FC<{
  budgetData: BudgetVsActual[];
  styles: any;
  t: (key: string) => string;
  isRTL: boolean;
  onCategoryClick: (category: ExpenseCategory) => void;
}> = ({ budgetData, styles, t, isRTL, onCategoryClick }) => {
  return (
    <div
      className="mb-4 rounded-lg border overflow-hidden"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div
        className={`px-4 py-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
        style={{ backgroundColor: styles.bgSecondary }}
      >
        <Target size={16} style={{ color: styles.info }} />
        <span className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
          {t('buyer.expenses.budgetVsActual')}
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: styles.border }}>
        {budgetData.map((item) => {
          const Icon = CATEGORY_ICONS[item.category];
          const statusColor =
            item.status === 'over' ? styles.error : item.status === 'under' ? styles.success : '#f59e0b';
          const progressPct = Math.min(100, (item.actualAmount / item.budgetAmount) * 100);

          return (
            <div
              key={item.category}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isRTL ? 'text-right' : ''}`}
              onClick={() => onCategoryClick(item.category)}
            >
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Icon size={16} style={{ color: styles.textMuted }} />
                  <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                    {t(`buyer.workspace.${item.category}`)}
                  </span>
                  {item.trend === 'worsening' && <TrendUp size={12} style={{ color: styles.error }} />}
                  {item.trend === 'improving' && <TrendDown size={12} style={{ color: styles.success }} />}
                </div>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm" style={{ color: styles.textMuted }}>
                    SAR {item.actualAmount.toLocaleString()} / {item.budgetAmount.toLocaleString()}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.status === 'over'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : item.status === 'under'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {item.variancePercent > 0 ? '+' : ''}
                    {item.variancePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: statusColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Category Inefficiency Drill-Down
// =============================================================================

const InefficiencyPanel: React.FC<{
  inefficiencies: CategoryInefficiency[];
  selectedCategory: ExpenseCategory | null;
  onClose: () => void;
  styles: any;
  t: (key: string) => string;
  isRTL: boolean;
}> = ({ inefficiencies, selectedCategory, onClose, styles, t, isRTL }) => {
  const data = inefficiencies.find((i) => i.category === selectedCategory);
  if (!data || !selectedCategory) return null;

  const Icon = CATEGORY_ICONS[selectedCategory];

  return (
    <div
      className="fixed inset-y-0 w-96 shadow-xl z-50 overflow-y-auto"
      style={{
        backgroundColor: styles.bgCard,
        borderLeftWidth: isRTL ? 0 : 1,
        borderRightWidth: isRTL ? 1 : 0,
        borderColor: styles.border,
        right: isRTL ? 'auto' : 0,
        left: isRTL ? 0 : 'auto',
      }}
    >
      <div className={`p-4 border-b ${isRTL ? 'text-right' : ''}`} style={{ borderColor: styles.border }}>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon size={20} style={{ color: styles.textPrimary }} />
            <h3 className="font-semibold" style={{ color: styles.textPrimary }}>
              {t(`buyer.workspace.${selectedCategory}`)} {t('buyer.expenses.analysis')}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} style={{ color: styles.textMuted }} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Inefficiency Score */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.inefficiencyScore')}
          </p>
          <div className={`flex items-end gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
            <span
              className="text-3xl font-bold"
              style={{
                color:
                  data.inefficiencyScore > 50 ? styles.error : data.inefficiencyScore > 25 ? '#f59e0b' : styles.success,
              }}
            >
              {data.inefficiencyScore}
            </span>
            <span className="text-sm pb-1" style={{ color: styles.textMuted }}>
              /100
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
            {data.inefficiencyScore > 50
              ? t('buyer.expenses.highInefficiency')
              : data.inefficiencyScore > 25
                ? t('buyer.expenses.moderateInefficiency')
                : t('buyer.expenses.lowInefficiency')}
          </p>
        </div>

        {/* Top Issues */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.topIssues')}
          </p>
          <div className="space-y-2">
            {data.topIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-2 rounded-md ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <Warning size={14} style={{ color: styles.error, flexShrink: 0, marginTop: 2 }} />
                <span className="text-sm" style={{ color: styles.textSecondary }}>
                  {issue}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: styles.textMuted }}>
            {t('buyer.expenses.recommendations')}
          </p>
          <div className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-2 rounded-md ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                style={{ backgroundColor: styles.success + '10' }}
              >
                <Lightning size={14} style={{ color: styles.success, flexShrink: 0, marginTop: 2 }} />
                <span className="text-sm" style={{ color: styles.textPrimary }}>
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Potential Savings */}
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: styles.success + '10', border: `1px solid ${styles.success}30` }}
        >
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: styles.success }}>
            {t('buyer.expenses.potentialSavings')}
          </p>
          <p className="text-2xl font-bold" style={{ color: styles.success }}>
            {data.currency} {data.potentialSavings.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const ExpensesTab: React.FC<ExpensesTabProps> = () => {
  const { styles, t, direction } = usePortal();
  const isRTL = direction === 'rtl';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<EnhancedExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [dismissedLeakages, setDismissedLeakages] = useState<string[]>([]);
  const [newExpense, setNewExpense] = useState<CreateExpenseData>({
    category: 'shipping',
    amount: 0,
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [expensesData, summaryData] = await Promise.all([
        buyerWorkspaceService.getExpenses({
          category: categoryFilter || undefined,
        }),
        buyerWorkspaceService.getEnhancedExpenseSummary(),
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExpense = async () => {
    try {
      await buyerWorkspaceService.createExpense(newExpense);
      setShowAddModal(false);
      setNewExpense({ category: 'shipping', amount: 0, notes: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  const handleDismissLeakage = (id: string) => {
    setDismissedLeakages((prev) => [...prev, id]);
  };

  const handleCategoryClick = (category: ExpenseCategory) => {
    setSelectedCategory(category);
  };

  const visibleLeakages = summary?.leakages.filter((l) => !dismissedLeakages.includes(l.id)) || [];

  const columns = useMemo(
    () => [
      columnHelper.accessor('category', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>{t('buyer.workspace.category')}</span>
        ),
        cell: (info) => {
          const category = info.getValue() as ExpenseCategory;
          const Icon = CATEGORY_ICONS[category];
          const colors = CATEGORY_COLORS[category];
          return (
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colors.bg}`}>
                <Icon
                  size={16}
                  style={{
                    color: colors.text.includes('blue')
                      ? '#2563eb'
                      : colors.text.includes('purple')
                        ? '#9333ea'
                        : colors.text.includes('amber')
                          ? '#d97706'
                          : '#6b7280',
                  }}
                />
              </div>
              <span className="font-medium" style={{ color: styles.textPrimary }}>
                {t(`buyer.workspace.${category}`)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('amount', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>{t('buyer.workspace.amount')}</span>
        ),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            SAR {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor('date', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>{t('buyer.workspace.date')}</span>
        ),
        cell: (info) => (
          <span style={{ color: styles.textSecondary }}>{new Date(info.getValue()).toLocaleDateString()}</span>
        ),
      }),
      columnHelper.accessor('notes', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>{t('buyer.workspace.notes')}</span>
        ),
        cell: (info) => (
          <span className="text-sm truncate max-w-xs block" style={{ color: styles.textMuted }}>
            {info.getValue() || '-'}
          </span>
        ),
      }),
    ],
    [t, styles, isRTL],
  );

  const table = useReactTable({
    data: expenses,
    columns,
    state: {
      sorting,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div dir={direction}>
      {/* Spend Leakage Alerts */}
      <LeakageAlerts leakages={visibleLeakages} onDismiss={handleDismissLeakage} styles={styles} t={t} isRTL={isRTL} />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Monthly Total */}
        <div className="p-4 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Cube size={18} style={{ color: styles.info }} />
            <span className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
              {t('buyer.workspace.totalExpenses')}
            </span>
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: styles.textPrimary }}>
            SAR {summary?.monthlyTotal.toLocaleString() || '0'}
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
            {t('buyer.workspace.thisMonth')}
          </p>
        </div>

        {/* Potential Savings */}
        <div className="p-4 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Lightning size={18} style={{ color: styles.success }} />
            <span className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
              {t('buyer.expenses.potentialSavings')}
            </span>
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: styles.success }}>
            SAR {summary?.totalPotentialSavings.toLocaleString() || '0'}
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
            {t('buyer.expenses.identifiedOpportunities')}
          </p>
        </div>

        {/* Active Alerts */}
        <div
          className="p-4 rounded-lg border"
          style={{
            borderColor: (summary?.priceDriftAlerts.length || 0) > 0 ? styles.error : styles.border,
            backgroundColor: (summary?.priceDriftAlerts.length || 0) > 0 ? 'rgba(239, 68, 68, 0.05)' : styles.bgCard,
          }}
        >
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Warning
              size={18}
              weight={(summary?.priceDriftAlerts.length || 0) > 0 ? 'fill' : 'regular'}
              style={{ color: (summary?.priceDriftAlerts.length || 0) > 0 ? styles.error : styles.textMuted }}
            />
            <span className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
              {t('buyer.expenses.activeAlerts')}
            </span>
          </div>
          <p
            className="text-2xl font-bold mt-2"
            style={{ color: (summary?.priceDriftAlerts.length || 0) > 0 ? styles.error : styles.textPrimary }}
          >
            {(summary?.priceDriftAlerts.length || 0) + visibleLeakages.length}
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
            {visibleLeakages.length} {t('buyer.expenses.leakages')}, {summary?.priceDriftAlerts.length || 0}{' '}
            {t('buyer.expenses.drifts')}
          </p>
        </div>

        {/* Health Score */}
        <HealthScoreIndicator score={summary?.healthScore || 0} styles={styles} t={t} isRTL={isRTL} />
      </div>

      {/* Price Drift Alerts */}
      {summary?.priceDriftAlerts && summary.priceDriftAlerts.length > 0 && (
        <PriceDriftInlineAlert alerts={summary.priceDriftAlerts} styles={styles} t={t} isRTL={isRTL} />
      )}

      {/* Budget vs Actual */}
      {summary?.budgetComparison && summary.budgetComparison.length > 0 && (
        <BudgetDrillDown
          budgetData={summary.budgetComparison}
          styles={styles}
          t={t}
          isRTL={isRTL}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Search */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="bg-transparent outline-none text-sm w-48"
              style={{ color: styles.textPrimary }}
              dir={direction}
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{
              borderColor: showFilters ? styles.borderHover : styles.border,
              backgroundColor: styles.bgCard,
              color: styles.textSecondary,
            }}
          >
            <Funnel size={16} />
            <span className="text-sm">{t('common.filters')}</span>
          </button>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{
            backgroundColor: styles.info,
            color: '#fff',
          }}
        >
          <Plus size={16} />
          {t('buyer.workspace.addExpense')}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className={`flex items-center gap-4 mb-4 p-4 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Select
            value={categoryFilter || 'all'}
            onChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}
            options={[
              { value: 'all', label: t('buyer.workspace.allCategories') || 'All Categories' },
              { value: 'shipping', label: t('buyer.workspace.shipping') || 'Shipping' },
              { value: 'customs', label: t('buyer.workspace.customs') || 'Customs' },
              { value: 'storage', label: t('buyer.workspace.storage') || 'Storage' },
              { value: 'other', label: t('buyer.workspace.other') || 'Other' },
            ]}
          />
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} style={{ backgroundColor: styles.bgSecondary }}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="animate-pulse" style={{ color: styles.textMuted }}>
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <p className="font-medium" style={{ color: styles.textSecondary }}>
                      {t('buyer.workspace.noExpenses')}
                    </p>
                    <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                      {t('buyer.workspace.noExpensesDesc')}
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    style={{ borderColor: styles.border }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div
            className={`flex items-center justify-between px-4 py-3 border-t ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ borderColor: styles.border }}
          >
            <span className="text-sm" style={{ color: styles.textMuted }}>
              {t('common.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}{' '}
              {t('common.of')} {table.getFilteredRowModel().rows.length}
            </span>

            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-md border transition-colors disabled:opacity-50"
                style={{ borderColor: styles.border }}
              >
                {isRTL ? <CaretRight size={16} /> : <CaretLeft size={16} />}
              </button>
              <span className="text-sm px-2" style={{ color: styles.textSecondary }}>
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-md border transition-colors disabled:opacity-50"
                style={{ borderColor: styles.border }}
              >
                {isRTL ? <CaretLeft size={16} /> : <CaretRight size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Aggregation Logic Info */}
      <div
        className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
        style={{ backgroundColor: styles.bgSecondary }}
      >
        <Info size={16} style={{ color: styles.info, flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs" style={{ color: styles.textMuted }}>
          {t('buyer.expenses.aggregationNote')}
        </p>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-md rounded-lg p-6" style={{ backgroundColor: styles.bgCard }} dir={direction}>
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3
                className="text-lg font-semibold"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {t('buyer.workspace.addExpense')}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} style={{ color: styles.textMuted }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: styles.textSecondary }}>
                  {t('buyer.workspace.category')}
                </label>
                <Select
                  value={newExpense.category}
                  onChange={(value) => setNewExpense({ ...newExpense, category: value as ExpenseCategory })}
                  options={[
                    { value: 'shipping', label: t('buyer.workspace.shipping') || 'Shipping' },
                    { value: 'customs', label: t('buyer.workspace.customs') || 'Customs' },
                    { value: 'storage', label: t('buyer.workspace.storage') || 'Storage' },
                    { value: 'other', label: t('buyer.workspace.other') || 'Other' },
                  ]}
                  className="w-full"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: styles.textSecondary }}>
                  {t('buyer.workspace.amount')}
                </label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                  }}
                  min={0}
                  step={0.01}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: styles.textSecondary }}>
                  {t('buyer.workspace.notes')}
                </label>
                <textarea
                  value={newExpense.notes || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                  }}
                  rows={3}
                />
              </div>
            </div>

            <div className={`flex items-center gap-3 mt-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: styles.border,
                  color: styles.textSecondary,
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddExpense}
                disabled={newExpense.amount <= 0}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: styles.info,
                  color: '#fff',
                }}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Inefficiency Slide-Over Panel */}
      {selectedCategory && summary?.categoryInefficiencies && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedCategory(null)} />
          <InefficiencyPanel
            inefficiencies={summary.categoryInefficiencies}
            selectedCategory={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            styles={styles}
            t={t}
            isRTL={isRTL}
          />
        </>
      )}
    </div>
  );
};

export default ExpensesTab;
