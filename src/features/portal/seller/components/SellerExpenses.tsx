import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import {
  Receipt,
  Plus,
  CaretDown,
  CaretUp,
  X,
  ArrowClockwise,
  Trash,
  Truck,
  Megaphone,
  CreditCard,
  Package,
  DotsThree,
  TrendUp,
  TrendDown,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { expenseService, Expense, ExpenseType, ExpenseSummary } from '../../services/expenseService';
import { EmptyState, Button, PortalDatePicker } from '../../components';
import { Select } from '../../components/ui';

// =============================================================================
// Helper Functions
// =============================================================================

const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// =============================================================================
// Expense Type Badge
// =============================================================================

const ExpenseTypeBadge: React.FC<{ type: ExpenseType }> = ({ type }) => {
  const { styles, t } = usePortal();

  const config: Record<ExpenseType, { icon: React.ComponentType<{ size: number }>; label: string; color: string }> = {
    shipping: { icon: Truck, label: t('seller.expenses.shipping'), color: '#3b82f6' },
    ads: { icon: Megaphone, label: t('seller.expenses.ads'), color: '#8b5cf6' },
    platform_fee: { icon: CreditCard, label: t('seller.expenses.platformFee'), color: '#f59e0b' },
    supplies: { icon: Package, label: t('seller.expenses.supplies'), color: '#10b981' },
    other: { icon: DotsThree, label: t('seller.expenses.other'), color: '#6b7280' },
  };

  const { icon: Icon, label, color } = config[type];

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <span className="text-sm" style={{ color: styles.textPrimary }}>
        {label}
      </span>
    </div>
  );
};

// =============================================================================
// Summary Cards
// =============================================================================

interface SummaryCardsProps {
  summary: ExpenseSummary | null;
  loading: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => {
  const { styles, t } = usePortal();

  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-5 rounded-lg border animate-pulse"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <div className="h-4 w-24 rounded mb-2" style={{ backgroundColor: styles.bgSecondary }} />
            <div className="h-8 w-32 rounded" style={{ backgroundColor: styles.bgSecondary }} />
          </div>
        ))}
      </div>
    );
  }

  const change =
    summary.totalLastMonth > 0
      ? ((summary.totalThisMonth - summary.totalLastMonth) / summary.totalLastMonth) * 100
      : summary.totalThisMonth > 0
        ? 100
        : 0;

  const isUp = change > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="p-5 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: styles.textMuted }}>
          {t('seller.expenses.thisMonth')}
        </p>
        <p className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
          {formatCurrency(summary.totalThisMonth, summary.currency)}
        </p>
        <div className="flex items-center gap-1 mt-2">
          {isUp ? (
            <TrendUp size={14} style={{ color: '#ef4444' }} />
          ) : (
            <TrendDown size={14} style={{ color: '#22c55e' }} />
          )}
          <span className="text-xs" style={{ color: isUp ? '#ef4444' : '#22c55e' }}>
            {isUp ? '+' : ''}
            {change.toFixed(0)}%
          </span>
          <span className="text-xs" style={{ color: styles.textMuted }}>
            vs last month
          </span>
        </div>
      </div>
      <div className="p-5 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: styles.textMuted }}>
          {t('seller.expenses.lastMonth')}
        </p>
        <p className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
          {formatCurrency(summary.totalLastMonth, summary.currency)}
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Add Expense Modal
// =============================================================================

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: { type: ExpenseType; amount: number; date: string; notes?: string }) => void;
  saving: boolean;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAdd, saving }) => {
  const { styles, t } = usePortal();
  const [type, setType] = useState<ExpenseType>('shipping');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const typeOptions = useMemo(
    () => [
      { value: 'shipping', label: t('seller.expenses.shipping') },
      { value: 'ads', label: t('seller.expenses.ads') },
      { value: 'platform_fee', label: t('seller.expenses.platformFee') },
      { value: 'supplies', label: t('seller.expenses.supplies') },
      { value: 'other', label: t('seller.expenses.other') },
    ],
    [t],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onAdd({
      type,
      amount: parseFloat(amount),
      date,
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    setType('shipping');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 rounded-lg shadow-xl"
        style={{ backgroundColor: styles.bgCard }}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: styles.border }}>
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}>
              {t('seller.expenses.addExpense')}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-md transition-colors"
              style={{ color: styles.textMuted }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textSecondary }}>
                {t('seller.expenses.type')}
              </label>
              <Select value={type} onChange={(value) => setType(value as ExpenseType)} options={typeOptions} />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textSecondary }}>
                {t('seller.expenses.amount')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: styles.textMuted }}>
                  SAR
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('seller.expenses.enterAmount')}
                  className="w-full h-10 pl-12 pr-3 text-sm rounded-lg border outline-none"
                  style={{
                    backgroundColor: styles.bgPrimary,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textSecondary }}>
                {t('seller.expenses.date')}
              </label>
              <PortalDatePicker value={date} onChange={setDate} className="w-full" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textSecondary }}>
                {t('seller.expenses.notes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('seller.expenses.optionalNotes')}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none"
                style={{
                  backgroundColor: styles.bgPrimary,
                  borderColor: styles.border,
                  color: styles.textPrimary,
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: styles.border }}
          >
            <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
              {t('seller.expenses.cancel')}
            </Button>
            <Button type="submit" disabled={saving || !amount}>
              {saving ? '...' : t('seller.expenses.save')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

// =============================================================================
// Table Skeleton
// =============================================================================

const TableSkeleton: React.FC = () => {
  const { styles } = usePortal();

  return (
    <div className="animate-pulse">
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: styles.border }}>
        <table className="min-w-full">
          <thead style={{ backgroundColor: styles.bgSecondary }}>
            <tr>
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 rounded" style={{ backgroundColor: styles.border, width: '70%' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: styles.bgCard }}>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex} style={{ borderTop: `1px solid ${styles.border}` }}>
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div
                      className="h-4 rounded"
                      style={{ backgroundColor: styles.bgSecondary, width: colIndex === 0 ? '80%' : '60%' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const SellerExpenses: React.FC = () => {
  const { styles, t } = usePortal();
  const { getToken } = useAuth();

  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const data = await expenseService.getSellerExpenses(token, {
        type: typeFilter !== 'all' ? (typeFilter as ExpenseType) : undefined,
      });
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [getToken, typeFilter]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await expenseService.getExpenseSummary(token);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [fetchExpenses, fetchSummary]);

  // Handle add expense
  const handleAddExpense = useCallback(
    async (input: { type: ExpenseType; amount: number; date: string; notes?: string }) => {
      setSaving(true);
      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const newExpense = await expenseService.createExpense(token, input);
        setExpenses((prev) => [newExpense, ...prev]);
        setShowAddModal(false);
        fetchSummary();
      } catch (err) {
        console.error('Failed to add expense:', err);
      } finally {
        setSaving(false);
      }
    },
    [getToken, fetchSummary],
  );

  // Handle delete expense
  const handleDeleteExpense = useCallback(
    async (expenseId: string) => {
      if (!confirm(t('seller.expenses.confirmDelete'))) return;

      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        await expenseService.deleteExpense(token, expenseId);
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        fetchSummary();
      } catch (err) {
        console.error('Failed to delete expense:', err);
      }
    },
    [getToken, t, fetchSummary],
  );

  // Type options
  const typeOptions = useMemo(
    () => [
      { value: 'all', label: t('seller.expenses.allTypes') },
      { value: 'shipping', label: t('seller.expenses.shipping') },
      { value: 'ads', label: t('seller.expenses.ads') },
      { value: 'platform_fee', label: t('seller.expenses.platformFee') },
      { value: 'supplies', label: t('seller.expenses.supplies') },
      { value: 'other', label: t('seller.expenses.other') },
    ],
    [t],
  );

  // Column helper
  const columnHelper = createColumnHelper<Expense>();

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('type', {
        header: t('seller.expenses.type'),
        cell: (info) => <ExpenseTypeBadge type={info.getValue()} />,
      }),
      columnHelper.accessor('amount', {
        header: t('seller.expenses.amount'),
        cell: (info) => (
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {formatCurrency(info.getValue(), info.row.original.currency)}
          </span>
        ),
      }),
      columnHelper.accessor('date', {
        header: t('seller.expenses.date'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textMuted }}>
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('notes', {
        header: t('seller.expenses.notes'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textSecondary }}>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: t('seller.expenses.actions'),
        cell: (info) => (
          <button
            onClick={() => handleDeleteExpense(info.row.original.id)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: '#ef4444' }}
            title={t('seller.expenses.delete')}
          >
            <Trash size={16} />
          </button>
        ),
      }),
    ],
    [columnHelper, styles, t, handleDeleteExpense],
  );

  // Table instance
  const table = useReactTable({
    data: expenses,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Error state
  if (error && !loading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Receipt}
          title={t('seller.dashboard.error')}
          description={error}
          action={
            <Button onClick={fetchExpenses} variant="secondary">
              <ArrowClockwise size={16} className="mr-2" />
              {t('seller.dashboard.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={summaryLoading} />

      {/* Filters & Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-4 mb-6 rounded-lg border"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        <div className="flex items-center gap-3">
          {/* Type Filter */}
          <Select value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
        </div>

        {/* Add Button */}
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} className="mr-2" />
          {t('seller.expenses.addExpense')}
        </Button>
      </div>

      {/* Loading */}
      {loading && <TableSkeleton />}

      {/* Empty state */}
      {!loading && expenses.length === 0 && typeFilter === 'all' && (
        <div className="py-12">
          <EmptyState
            icon={Receipt}
            title={t('seller.expenses.noExpenses')}
            description={t('seller.expenses.noExpensesDesc')}
            action={
              <Button onClick={() => setShowAddModal(true)}>
                <Plus size={16} className="mr-2" />
                {t('seller.expenses.addExpense')}
              </Button>
            }
          />
        </div>
      )}

      {/* No results */}
      {!loading && expenses.length === 0 && typeFilter !== 'all' && (
        <div className="py-12">
          <EmptyState
            icon={Receipt}
            title={t('seller.expenses.noResults')}
            action={
              <Button onClick={() => setTypeFilter('all')} variant="secondary">
                {t('seller.sales.clearFilters')}
              </Button>
            }
          />
        </div>
      )}

      {/* Table */}
      {!loading && expenses.length > 0 && (
        <div className="overflow-hidden rounded-lg border" style={{ borderColor: styles.border }}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ backgroundColor: styles.bgSecondary }}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none"
                        style={{ color: styles.textMuted }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && <CaretUp size={12} />}
                          {header.column.getIsSorted() === 'desc' && <CaretDown size={12} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody style={{ backgroundColor: styles.bgCard }}>
                {table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    style={{
                      borderTop: rowIndex > 0 ? `1px solid ${styles.border}` : undefined,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddExpense}
        saving={saving}
      />
    </div>
  );
};

export default SellerExpenses;
