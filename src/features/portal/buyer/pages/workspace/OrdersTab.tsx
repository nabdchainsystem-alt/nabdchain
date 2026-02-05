import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import {
  Package,
  MagnifyingGlass,
  Funnel,
  CaretDown,
  CaretUp,
  Eye,
  X,
  CaretLeft,
  CaretRight,
  Truck,
  CheckCircle,
  Clock,
  Warning,
  WarningCircle,
  Handshake,
  Spinner,
} from 'phosphor-react';
import { useAuth } from '../../../../../auth-adapter';
import { Select, EmptyState } from '../../../components';
import { usePortal } from '../../../context/PortalContext';
import { marketplaceOrderService } from '../../../services/marketplaceOrderService';
import {
  MarketplaceOrder,
  MarketplaceOrderStatus,
  OrderHealthStatus,
} from '../../../types/item.types';

interface OrdersTabProps {
  onNavigate?: (page: string, data?: Record<string, unknown>) => void;
  initialStatusFilter?: string;
  initialHealthFilter?: string;
}

// Map API health status to display health status
type DisplayHealthStatus = 'healthy' | 'at_risk' | 'issue_detected' | 'resolved';

function mapHealthStatus(health: OrderHealthStatus, hasException: boolean): DisplayHealthStatus {
  if (hasException) return 'issue_detected';
  switch (health) {
    case 'on_track':
      return 'healthy';
    case 'at_risk':
    case 'delayed':
      return 'at_risk';
    case 'critical':
      return 'issue_detected';
    default:
      return 'healthy';
  }
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

// Status Badge Component
const StatusBadge: React.FC<{ status: MarketplaceOrderStatus; showIcon?: boolean }> = ({ status, showIcon = false }) => {
  const { styles, t } = usePortal();

  const config: Record<MarketplaceOrderStatus, { bg: string; darkBg: string; text: string; darkText: string; label: string; icon: React.ElementType }> = {
    pending_confirmation: { bg: '#fef3c7', darkBg: '#78350f', text: '#92400e', darkText: '#fef3c7', label: t('buyer.orders.pendingConfirmation'), icon: Clock },
    confirmed: { bg: '#e0e7ff', darkBg: '#312e81', text: '#3730a3', darkText: '#c7d2fe', label: t('buyer.orders.confirmed'), icon: CheckCircle },
    processing: { bg: '#f3e8ff', darkBg: '#3b2d5f', text: '#7c3aed', darkText: '#ddd6fe', label: t('buyer.orders.processing') || 'Processing', icon: Clock },
    shipped: { bg: '#f0fdf4', darkBg: '#14532d', text: '#15803d', darkText: '#86efac', label: t('buyer.orders.shipped'), icon: Truck },
    delivered: { bg: '#dcfce7', darkBg: '#14532d', text: '#166534', darkText: '#bbf7d0', label: t('buyer.orders.delivered'), icon: Handshake },
    closed: { bg: '#f3f4f6', darkBg: '#374151', text: '#6b7280', darkText: '#d1d5db', label: t('buyer.orders.closed') || 'Closed', icon: CheckCircle },
    cancelled: { bg: '#fee2e2', darkBg: '#7f1d1d', text: '#991b1b', darkText: '#fecaca', label: t('buyer.orders.cancelled'), icon: X },
    failed: { bg: '#fee2e2', darkBg: '#7f1d1d', text: '#991b1b', darkText: '#fecaca', label: t('buyer.orders.failed') || 'Failed', icon: WarningCircle },
    refunded: { bg: '#f3f4f6', darkBg: '#374151', text: '#6b7280', darkText: '#d1d5db', label: t('buyer.orders.refunded') || 'Refunded', icon: Package },
  };

  const c = config[status] || config.pending_confirmation;
  const isDark = styles.isDark;
  const Icon = c.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: isDark ? c.darkBg : c.bg,
        color: isDark ? c.darkText : c.text,
      }}
    >
      {showIcon && <Icon size={12} weight="bold" />}
      {c.label}
    </span>
  );
};

// Health Status Badge Component
const HealthBadge: React.FC<{ health: DisplayHealthStatus }> = ({ health }) => {
  const { styles } = usePortal();

  const config: Record<DisplayHealthStatus, { color: string; bg: string; label: string; icon: React.ElementType }> = {
    healthy: { color: styles.success, bg: 'rgba(34, 197, 94, 0.1)', label: 'On Track', icon: CheckCircle },
    at_risk: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'At Risk', icon: Warning },
    issue_detected: { color: styles.error, bg: 'rgba(239, 68, 68, 0.1)', label: 'Issue', icon: WarningCircle },
    resolved: { color: styles.textMuted, bg: 'rgba(107, 114, 128, 0.1)', label: 'Resolved', icon: CheckCircle },
  };

  const c = config[health];
  const Icon = c.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <Icon size={10} weight="fill" />
      {c.label}
    </span>
  );
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  onNavigate,
  initialStatusFilter = 'all',
  initialHealthFilter = 'all',
}) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRTL = direction === 'rtl';

  // State for API data
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [healthFilter, setHealthFilter] = useState<string>(initialHealthFilter);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) {
          setError('Authentication required');
          return;
        }
        const response = await marketplaceOrderService.getBuyerOrders(token, { limit: 100 });
        setOrders(response.orders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [getToken]);

  // Filtered data
  const filteredData = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (healthFilter !== 'all' && order.healthStatus !== healthFilter) return false;
      if (globalFilter) {
        const search = globalFilter.toLowerCase();
        if (
          !order.orderNumber.toLowerCase().includes(search) &&
          !order.itemName.toLowerCase().includes(search) &&
          !order.itemSku.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, healthFilter, globalFilter]);

  // Column helper
  const columnHelper = createColumnHelper<MarketplaceOrder>();

  // Columns
  const columns = useMemo(() => [
    columnHelper.accessor('orderNumber', {
      header: t('buyer.orders.orderNumber'),
      cell: info => (
        <span className="font-mono text-xs" style={{ color: styles.textPrimary }}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('itemName', {
      header: t('buyer.orders.item'),
      cell: info => {
        const order = info.row.original;
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {info.getValue()}
              </span>
              {order.hasException && (
                <WarningCircle size={14} weight="fill" style={{ color: styles.error }} />
              )}
            </div>
            <div className="text-xs font-mono" style={{ color: styles.textMuted }}>
              {order.itemSku}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('quantity', {
      header: t('buyer.orders.qty'),
      cell: info => (
        <span className="text-sm" style={{ color: styles.textPrimary }}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('totalPrice', {
      header: t('buyer.orders.total'),
      cell: info => (
        <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
          {formatCurrency(info.getValue(), info.row.original.currency)}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: t('buyer.orders.status'),
      cell: info => <StatusBadge status={info.getValue()} showIcon />,
    }),
    columnHelper.accessor('healthStatus', {
      header: t('buyer.orders.health'),
      cell: info => <HealthBadge health={mapHealthStatus(info.getValue(), info.row.original.hasException)} />,
    }),
    columnHelper.accessor('createdAt', {
      header: t('buyer.orders.date'),
      cell: info => (
        <span className="text-sm" style={{ color: styles.textMuted }}>
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="w-full text-center block">{t('common.actions')}</span>,
      cell: info => {
        const order = info.row.original;
        const canTrack = !['cancelled', 'failed', 'refunded'].includes(order.status);

        return (
          <div className="flex items-center justify-center gap-1">
            {canTrack && onNavigate && (
              <button
                onClick={() => onNavigate('order-tracking', { orderId: order.id })}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: styles.isDark ? '#1e3a5f' : '#dbeafe',
                  color: styles.info,
                }}
              >
                <Truck size={12} />
                {t('buyer.orders.track') || 'Track'}
              </button>
            )}
            <button
              className="p-1.5 rounded-md transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Eye size={16} />
            </button>
          </div>
        );
      },
    }),
  ], [columnHelper, styles, t]);

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setHealthFilter('all');
    setGlobalFilter('');
  };

  const hasActiveFilters = statusFilter !== 'all' || healthFilter !== 'all' || globalFilter;

  return (
    <div dir={direction}>
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
              placeholder={t('buyer.orders.search')}
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

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors"
              style={{ color: styles.textMuted }}
            >
              <X size={14} />
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className={`flex items-center gap-4 mb-4 p-4 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('buyer.orders.allStatus') || 'All Status' },
              { value: 'pending_confirmation', label: t('buyer.orders.pendingConfirmation') || 'Pending' },
              { value: 'confirmed', label: t('buyer.orders.confirmed') || 'Confirmed' },
              { value: 'processing', label: t('buyer.orders.processing') || 'Processing' },
              { value: 'shipped', label: t('buyer.orders.shipped') || 'Shipped' },
              { value: 'delivered', label: t('buyer.orders.delivered') || 'Delivered' },
              { value: 'closed', label: t('buyer.orders.closed') || 'Closed' },
              { value: 'cancelled', label: t('buyer.orders.cancelled') || 'Cancelled' },
            ]}
          />
          <Select
            value={healthFilter}
            onChange={setHealthFilter}
            options={[
              { value: 'all', label: t('buyer.orders.allHealth') || 'All Health' },
              { value: 'on_track', label: t('buyer.orders.onTrack') || 'On Track' },
              { value: 'at_risk', label: t('buyer.orders.atRisk') || 'At Risk' },
              { value: 'delayed', label: t('buyer.orders.delayed') || 'Delayed' },
              { value: 'critical', label: t('buyer.orders.critical') || 'Critical' },
            ]}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size={32} className="animate-spin" style={{ color: styles.textMuted }} />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div
          className="p-4 rounded-lg border mb-6"
          style={{ backgroundColor: `${styles.error}10`, borderColor: styles.error }}
        >
          <div className="flex items-center gap-2">
            <WarningCircle size={20} style={{ color: styles.error }} />
            <span style={{ color: styles.error }}>{error}</span>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          {filteredData.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t('buyer.orders.noOrders')}
              description={t('buyer.orders.noOrdersDesc')}
            />
          ) : (
            <div>
              <div
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: styles.bgSecondary }}>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              className="px-4 py-3 text-xs font-semibold cursor-pointer select-none"
                              style={{ color: styles.textSecondary, textAlign: isRTL ? 'right' : 'left' }}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div className="flex items-center gap-1">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getIsSorted() && (
                                  header.column.getIsSorted() === 'asc'
                                    ? <CaretUp size={12} />
                                    : <CaretDown size={12} />
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="transition-colors cursor-pointer"
                          style={{
                            borderTop: idx > 0 ? `1px solid ${styles.border}` : undefined,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {row.getVisibleCells().map(cell => (
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
              {table.getPageCount() > 1 && (
                <div
                  className={`flex items-center justify-between px-4 py-3 mt-4 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}
                  style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
                >
                  <span className="text-sm" style={{ color: styles.textMuted }}>
                    {t('common.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                    -{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)}
                    {' '}{t('common.of')} {filteredData.length}
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
          )}
        </>
      )}
    </div>
  );
};

export default OrdersTab;
