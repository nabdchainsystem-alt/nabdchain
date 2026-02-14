import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Package,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Eye,
  Funnel,
  X,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { orderService } from '../../services/orderService';
import { EmptyState, Button, PortalDatePicker } from '../../components';
import { Select } from '../../components/ui';
import { Order, OrderStatus, getOrderStatusConfig, ORDER_STATUS_TRANSITIONS } from '../../types/order.types';

// =============================================================================
// Types
// =============================================================================

interface SellerSalesProps {
  onViewOrder?: (order: Order) => void;
}

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
// Status Badge Component
// =============================================================================

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const { styles, t } = usePortal();
  const config = getOrderStatusConfig(status);

  const colorMap = {
    warning: { bg: '#fef3c7', text: '#92400e', darkBg: '#78350f', darkText: '#fef3c7' },
    info: { bg: '#dbeafe', text: '#1e40af', darkBg: '#1e3a5f', darkText: '#93c5fd' },
    primary: { bg: '#e0e7ff', text: '#3730a3', darkBg: '#312e81', darkText: '#c7d2fe' },
    success: { bg: '#dcfce7', text: '#166534', darkBg: '#14532d', darkText: '#bbf7d0' },
    error: { bg: '#fee2e2', text: '#991b1b', darkBg: '#7f1d1d', darkText: '#fecaca' },
    muted: { bg: '#f3f4f6', text: '#6b7280', darkBg: '#374151', darkText: '#9ca3af' },
  };

  const colors = colorMap[config.color];
  const isDark = styles.isDark;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: isDark ? colors.darkBg : colors.bg,
        color: isDark ? colors.darkText : colors.text,
      }}
    >
      {t(config.labelKey)}
    </span>
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
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 rounded" style={{ backgroundColor: styles.border, width: '80%' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: styles.bgCard }}>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex} style={{ borderTop: `1px solid ${styles.border}` }}>
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div
                      className="h-4 rounded"
                      style={{ backgroundColor: styles.bgSecondary, width: colIndex === 0 ? '60%' : '80%' }}
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

export const SellerSales: React.FC<SellerSalesProps> = ({ onViewOrder }) => {
  const { styles, t } = usePortal();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: Record<string, string> = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const data = await orderService.getSellerOrders(filters);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Status update handler with optimistic UI
  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      const previousOrders = [...orders];

      // Optimistic update
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
      setUpdatingOrderId(orderId);

      try {
        await orderService.updateOrderStatus(orderId, newStatus);
      } catch (err) {
        // Rollback on error
        setOrders(previousOrders);
        console.error('Failed to update status:', err);
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [orders],
  );

  // Status options for filter
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('seller.sales.allStatus') },
      { value: 'pending_confirmation', label: t('seller.orders.pendingConfirmation') },
      { value: 'confirmed', label: t('seller.orders.confirmed') },
      { value: 'in_progress', label: t('seller.orders.inProgress') },
      { value: 'shipped', label: t('seller.orders.shipped') },
      { value: 'delivered', label: t('seller.orders.delivered') },
      { value: 'cancelled', label: t('seller.orders.cancelled') },
    ],
    [t],
  );

  // Get next valid statuses for an order
  const getNextStatuses = useCallback(
    (currentStatus: OrderStatus): { value: string; label: string }[] => {
      const validTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
      return validTransitions.map((status) => ({
        value: status,
        label: t(getOrderStatusConfig(status).labelKey),
      }));
    },
    [t],
  );

  // Column helper
  const columnHelper = createColumnHelper<Order>();

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('orderNumber', {
        header: t('seller.sales.orderId'),
        cell: (info) => (
          <span className="font-mono text-xs" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('buyerName', {
        header: t('seller.sales.buyer'),
        cell: (info) => (
          <div>
            <div className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {info.getValue() || 'Unknown'}
            </div>
            {info.row.original.buyerCompany && (
              <div className="text-xs" style={{ color: styles.textMuted }}>
                {info.row.original.buyerCompany}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('itemName', {
        header: t('seller.sales.product'),
        cell: (info) => (
          <div>
            <div className="text-sm" style={{ color: styles.textPrimary }}>
              {info.getValue()}
            </div>
            <div className="text-xs font-mono" style={{ color: styles.textMuted }}>
              {info.row.original.itemSku}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: t('seller.sales.quantity'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('totalPrice', {
        header: t('seller.sales.totalPrice'),
        cell: (info) => (
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {formatCurrency(info.getValue(), info.row.original.currency)}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: t('seller.sales.status'),
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('createdAt', {
        header: t('seller.sales.createdDate'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textMuted }}>
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: t('seller.sales.actions'),
        cell: (info) => {
          const order = info.row.original;
          const nextStatuses = getNextStatuses(order.status);
          const isUpdating = updatingOrderId === order.id;

          return (
            <div className="flex items-center gap-2">
              {nextStatuses.length > 0 && (
                <Select
                  value="_placeholder"
                  onChange={(value) => {
                    if (value !== '_placeholder') {
                      handleStatusUpdate(order.id, value as OrderStatus);
                    }
                  }}
                  options={[
                    { value: '_placeholder', label: t('seller.sales.updateStatus'), disabled: true },
                    ...nextStatuses,
                  ]}
                  disabled={isUpdating}
                  className="text-xs"
                />
              )}
              {onViewOrder && (
                <button
                  onClick={() => onViewOrder(order)}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: styles.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  title={t('seller.sales.view')}
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [columnHelper, styles, t, getNextStatuses, handleStatusUpdate, onViewOrder, updatingOrderId],
  );

  // Table instance
  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setGlobalFilter('');
  };

  const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo || globalFilter;

  // Error state
  if (error && !loading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Package}
          title={t('seller.dashboard.error')}
          description={error}
          action={
            <Button onClick={fetchOrders} variant="secondary">
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
      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 mb-6 rounded-lg border"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        <Funnel size={18} style={{ color: styles.textMuted }} />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: styles.textMuted }}
          />
          <input
            type="text"
            placeholder={t('seller.orders.searchPlaceholder')}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border outline-none transition-colors"
            style={{
              backgroundColor: styles.bgPrimary,
              borderColor: styles.border,
              color: styles.textPrimary,
            }}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />

        {/* Date From */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: styles.textMuted }}>
            {t('seller.sales.from')}
          </span>
          <PortalDatePicker value={dateFrom} onChange={setDateFrom} maxDate={dateTo || undefined} />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: styles.textMuted }}>
            {t('seller.sales.to')}
          </span>
          <PortalDatePicker value={dateTo} onChange={setDateTo} minDate={dateFrom || undefined} />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 h-9 px-3 text-xs font-medium rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={14} />
            {t('seller.sales.clearFilters')}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && <TableSkeleton />}

      {/* Empty state */}
      {!loading && orders.length === 0 && !hasActiveFilters && (
        <div className="py-12">
          <EmptyState icon={Package} title={t('seller.sales.noOrders')} description={t('seller.sales.noOrdersDesc')} />
        </div>
      )}

      {/* No results */}
      {!loading && orders.length === 0 && hasActiveFilters && (
        <div className="py-12">
          <EmptyState
            icon={Package}
            title={t('seller.sales.noResults')}
            action={
              <Button onClick={clearFilters} variant="secondary">
                {t('seller.sales.clearFilters')}
              </Button>
            }
          />
        </div>
      )}

      {/* Table */}
      {!loading && orders.length > 0 && (
        <>
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

          {/* Pagination */}
          <div
            className="flex items-center justify-between mt-4 px-4 py-3 rounded-lg border"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="text-sm" style={{ color: styles.textMuted }}>
              {t('seller.sales.showing')}{' '}
              <span style={{ color: styles.textPrimary }}>
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>
              {' - '}
              <span style={{ color: styles.textPrimary }}>
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}
              </span>{' '}
              {t('seller.sales.of')}{' '}
              <span style={{ color: styles.textPrimary }}>{table.getFilteredRowModel().rows.length}</span>{' '}
              {t('seller.sales.orders')}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors disabled:opacity-50"
                style={{
                  borderColor: styles.border,
                  color: styles.textPrimary,
                  backgroundColor: styles.bgCard,
                }}
              >
                <CaretLeft size={14} />
                {t('seller.sales.prev')}
              </button>
              <span className="text-sm px-2" style={{ color: styles.textMuted }}>
                {t('seller.sales.page')} {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors disabled:opacity-50"
                style={{
                  borderColor: styles.border,
                  color: styles.textPrimary,
                  backgroundColor: styles.bgCard,
                }}
              >
                {t('seller.sales.next')}
                <CaretRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SellerSales;
