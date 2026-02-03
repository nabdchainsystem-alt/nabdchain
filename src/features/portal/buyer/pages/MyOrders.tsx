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
  MapPin,
  CheckCircle,
  Clock,
  Warning,
  WarningCircle,
  FileText,
  ChatCircle,
  Handshake,
  ShieldCheck,
  ArrowsClockwise,
  Info,
  Buildings,
  Spinner,
  Receipt,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { Container, PageHeader, Button, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { marketplaceOrderService } from '../../services/marketplaceOrderService';
import {
  MarketplaceOrder,
  MarketplaceOrderStatus,
  OrderHealthStatus,
  OrderAuditEvent,
} from '../../types/item.types';

interface MyOrdersProps {
  onNavigate: (page: string) => void;
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

// Helper functions
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

// Status Badge Component with Icons
const StatusBadge: React.FC<{ status: MarketplaceOrderStatus; showIcon?: boolean }> = ({ status, showIcon = false }) => {
  const { styles, t } = usePortal();

  const config: Record<MarketplaceOrderStatus, { bg: string; darkBg: string; text: string; darkText: string; label: string; icon: React.ElementType }> = {
    pending_confirmation: { bg: '#fef3c7', darkBg: '#78350f', text: '#92400e', darkText: '#fef3c7', label: t('buyer.orders.pendingConfirmation'), icon: Clock },
    confirmed: { bg: '#e0e7ff', darkBg: '#312e81', text: '#3730a3', darkText: '#c7d2fe', label: t('buyer.orders.confirmed'), icon: CheckCircle },
    processing: { bg: '#f3e8ff', darkBg: '#3b2d5f', text: '#7c3aed', darkText: '#ddd6fe', label: t('buyer.orders.processing') || 'Processing', icon: ArrowsClockwise },
    shipped: { bg: '#f0fdf4', darkBg: '#14532d', text: '#15803d', darkText: '#86efac', label: t('buyer.orders.shipped'), icon: Truck },
    delivered: { bg: '#dcfce7', darkBg: '#14532d', text: '#166534', darkText: '#bbf7d0', label: t('buyer.orders.delivered'), icon: Handshake },
    closed: { bg: '#f3f4f6', darkBg: '#374151', text: '#6b7280', darkText: '#d1d5db', label: t('buyer.orders.closed') || 'Closed', icon: CheckCircle },
    cancelled: { bg: '#fee2e2', darkBg: '#7f1d1d', text: '#991b1b', darkText: '#fecaca', label: t('buyer.orders.cancelled'), icon: X },
    failed: { bg: '#fee2e2', darkBg: '#7f1d1d', text: '#991b1b', darkText: '#fecaca', label: t('buyer.orders.failed') || 'Failed', icon: WarningCircle },
    refunded: { bg: '#f3f4f6', darkBg: '#374151', text: '#6b7280', darkText: '#d1d5db', label: t('buyer.orders.refunded') || 'Refunded', icon: Receipt },
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

// Delay Alert Component
const DelayAlert: React.FC<{ healthStatus: OrderHealthStatus }> = ({ healthStatus }) => {
  const { styles } = usePortal();

  if (healthStatus !== 'delayed' && healthStatus !== 'critical') return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: styles.error }}
    >
      <Warning size={10} weight="fill" />
      {healthStatus === 'critical' ? 'Critical Delay' : 'Delayed'}
    </span>
  );
};

export const MyOrders: React.FC<MyOrdersProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();

  // State for API data
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'shipment' | 'timeline'>('overview');

  // Stage 5: Delivery confirmation state
  const [confirmDeliveryOrder, setConfirmDeliveryOrder] = useState<MarketplaceOrder | null>(null);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [deliveryConfirmError, setDeliveryConfirmError] = useState<string | null>(null);

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

  // Open order detail modal
  const openDetail = useCallback((order: MarketplaceOrder) => {
    setSelectedOrder(order);
    setDetailTab('overview');
    setShowDetailModal(true);
  }, []);

  // Open issue reporting modal
  const openIssueReport = useCallback((order: MarketplaceOrder) => {
    setSelectedOrder(order);
    setShowIssueModal(true);
  }, []);

  // Stage 5: Handle delivery confirmation
  const handleConfirmDelivery = async () => {
    if (!confirmDeliveryOrder) return;

    setIsConfirmingDelivery(true);
    setDeliveryConfirmError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const updatedOrder = await marketplaceOrderService.markDelivered(token, confirmDeliveryOrder.id, {});

      // Update the order in local state
      setOrders(prev => prev.map(o =>
        o.id === confirmDeliveryOrder.id
          ? { ...o, ...updatedOrder, status: 'delivered', deliveredAt: new Date().toISOString() }
          : o
      ));

      setConfirmDeliveryOrder(null);
    } catch (err) {
      console.error('Failed to confirm delivery:', err);
      setDeliveryConfirmError(err instanceof Error ? err.message : 'Failed to confirm delivery');
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  // Calculate enhanced stats for fulfillment confidence
  const stats = useMemo(() => {
    const active = orders.filter(o => ['pending_confirmation', 'confirmed', 'processing'].includes(o.status)).length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const closed = orders.filter(o => o.status === 'closed').length;
    const issues = orders.filter(o => o.hasException || o.healthStatus === 'critical').length;
    const atRisk = orders.filter(o => o.healthStatus === 'at_risk' || o.healthStatus === 'delayed').length;
    const healthy = orders.filter(o => o.healthStatus === 'on_track' && !['delivered', 'closed', 'cancelled'].includes(o.status)).length;
    const totalSpent = orders
      .filter(o => ['delivered', 'closed'].includes(o.status))
      .reduce((sum, o) => sum + o.totalPrice, 0);
    return { active, shipped, delivered, closed, issues, atRisk, healthy, totalSpent };
  }, [orders]);

  // Filtered data
  const filteredData = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      return true;
    });
  }, [orders, statusFilter]);

  // Column helper
  const columnHelper = createColumnHelper<MarketplaceOrder>();

  // Columns with fulfillment confidence
  const columns = useMemo(() => [
    columnHelper.accessor('orderNumber', {
      header: t('buyer.orders.orderNumber'),
      cell: info => (
        <div>
          <span className="font-mono text-xs" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
          {info.row.original.source === 'rfq' && info.row.original.quoteNumber && (
            <div className="text-[10px] font-mono" style={{ color: styles.textMuted }}>
              From Quote {info.row.original.quoteNumber}
            </div>
          )}
        </div>
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
                <span
                  className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: styles.error }}
                  title={order.exceptionMessage}
                >
                  <WarningCircle size={9} weight="fill" />
                  Issue
                </span>
              )}
            </div>
            <div className="text-xs font-mono" style={{ color: styles.textMuted }}>
              {order.itemSku}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('sellerId', {
      id: 'seller',
      header: t('buyer.orders.supplier'),
      cell: info => {
        const order = info.row.original;
        return (
          <div>
            <span className="text-sm" style={{ color: styles.textPrimary }}>
              {order.sellerId.slice(0, 8)}...
            </span>
            {order.healthScore !== undefined && order.healthScore > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <div
                  className="h-1 w-12 rounded-full overflow-hidden"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${order.healthScore}%`,
                      backgroundColor: order.healthScore >= 90 ? styles.success : order.healthScore >= 70 ? '#f59e0b' : styles.error,
                    }}
                  />
                </div>
                <span className="text-[10px]" style={{ color: styles.textMuted }}>
                  {order.healthScore}%
                </span>
              </div>
            )}
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
      cell: info => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={info.getValue()} showIcon />
          <DelayAlert healthStatus={info.row.original.healthStatus} />
        </div>
      ),
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
        const canTrack = order.status === 'shipped' && order.trackingNumber;
        const canConfirmDelivery = order.status === 'shipped';
        const canReportIssue = !order.hasException && !['delivered', 'closed', 'cancelled'].includes(order.status);

        return (
          <div className="flex items-center justify-center gap-1">
            {/* Stage 5: Confirm Delivery Button */}
            {canConfirmDelivery && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDeliveryOrder(order); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: styles.isDark ? '#14532d' : '#dcfce7',
                  color: styles.success,
                }}
                title={t('buyer.orders.confirmDelivery')}
              >
                <Handshake size={12} />
                {t('buyer.orders.received')}
              </button>
            )}
            {canTrack && (
              <button
                onClick={(e) => { e.stopPropagation(); openDetail(order); setDetailTab('shipment'); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: styles.isDark ? '#1e3a5f' : '#dbeafe',
                  color: styles.info,
                }}
                title={t('buyer.orders.trackShipment')}
              >
                <Truck size={12} />
                {t('buyer.orders.track')}
              </button>
            )}
            {canReportIssue && (
              <button
                onClick={(e) => { e.stopPropagation(); openIssueReport(order); }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => e.currentTarget.style.color = styles.error}
                onMouseLeave={(e) => e.currentTarget.style.color = styles.textMuted}
                title={t('buyer.orders.reportIssue')}
              >
                <WarningCircle size={16} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); openDetail(order); }}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title={t('buyer.orders.viewDetails')}
            >
              <Eye size={16} />
            </button>
          </div>
        );
      },
    }),
  ], [columnHelper, styles, t, openDetail, openIssueReport]);

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
    setGlobalFilter('');
  };

  const hasActiveFilters = statusFilter !== 'all' || globalFilter;

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('buyer.orders.title')}
          subtitle={t('buyer.orders.subtitle')}
          actions={
            <Button onClick={() => onNavigate('marketplace')} variant="secondary">
              <Package size={16} className={direction === 'rtl' ? 'ml-2' : 'mr-2'} />
              {t('buyer.orders.browseMarketplace')}
            </Button>
          }
        />

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

        {/* Content - only show when not loading */}
        {!isLoading && (
          <>
        {/* Fulfillment Confidence Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard
            label={t('buyer.orders.active')}
            value={stats.active.toString()}
            icon={Package}
            color={styles.info}
          />
          <StatCard
            label={t('buyer.orders.inTransit')}
            value={stats.shipped.toString()}
            icon={Truck}
            color={styles.info}
          />
          <StatCard
            label={t('buyer.orders.delivered')}
            value={stats.delivered.toString()}
            icon={Handshake}
            color={styles.success}
          />
          <StatCard
            label={t('buyer.orders.onTrack')}
            value={stats.healthy.toString()}
            icon={CheckCircle}
            color={styles.success}
          />
          <StatCard
            label={t('buyer.orders.atRiskOrders')}
            value={stats.atRisk.toString()}
            icon={Warning}
            color="#f59e0b"
            highlight={stats.atRisk > 0}
          />
          <StatCard
            label={t('buyer.orders.issues')}
            value={stats.issues.toString()}
            icon={WarningCircle}
            color={styles.error}
            highlight={stats.issues > 0}
          />
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap items-center gap-3 p-4 mb-6 rounded-lg border"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <Funnel size={18} style={{ color: styles.textMuted }} />

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border flex-1 max-w-xs"
            style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
          >
            <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
            <input
              type="text"
              placeholder={t('buyer.orders.search')}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1"
              style={{ color: styles.textPrimary }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md border text-sm outline-none"
            style={{
              borderColor: styles.border,
              backgroundColor: styles.bgPrimary,
              color: styles.textPrimary,
            }}
          >
            <option value="all">{t('buyer.orders.allStatus')}</option>
            <option value="pending_confirmation">{t('buyer.orders.pendingConfirmation')}</option>
            <option value="confirmed">{t('buyer.orders.confirmed')}</option>
            <option value="processing">{t('buyer.orders.processing') || 'Processing'}</option>
            <option value="shipped">{t('buyer.orders.shipped')}</option>
            <option value="delivered">{t('buyer.orders.delivered')}</option>
            <option value="closed">{t('buyer.orders.closed') || 'Closed'}</option>
            <option value="cancelled">{t('buyer.orders.cancelled')}</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={14} />
              {t('common.clearFilters')}
            </button>
          )}
        </div>

        {/* Table */}
        {filteredData.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('buyer.orders.noOrders')}
            description={t('buyer.orders.noOrdersDesc')}
            action={
              <Button onClick={() => onNavigate('marketplace')}>
                {t('buyer.orders.browseMarketplace')}
              </Button>
            }
          />
        ) : (
          <div>
            <div
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: styles.border }}
            >
              <table className="min-w-full">
                <thead style={{ backgroundColor: styles.bgSecondary }}>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-xs font-semibold cursor-pointer select-none"
                          style={{ color: styles.textSecondary, textAlign: direction === 'rtl' ? 'right' : 'left' }}
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
                <tbody style={{ backgroundColor: styles.bgCard }}>
                  {table.getRowModel().rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="transition-colors cursor-pointer"
                      style={{
                        borderTop: idx > 0 ? `1px solid ${styles.border}` : undefined,
                      }}
                      onClick={() => openDetail(row.original)}
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

            {/* Pagination */}
            <div
              className="flex items-center justify-between px-4 py-3 mt-4 rounded-lg border"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              <div className="text-sm" style={{ color: styles.textMuted }}>
                {t('common.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                -{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)}
                {' '}{t('common.of')} {filteredData.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                  style={{ color: styles.textMuted }}
                >
                  {direction === 'rtl' ? <CaretRight size={18} /> : <CaretLeft size={18} />}
                </button>
                <span className="text-sm px-3" style={{ color: styles.textPrimary }}>
                  {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                  style={{ color: styles.textMuted }}
                >
                  {direction === 'rtl' ? <CaretLeft size={18} /> : <CaretRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        {showDetailModal && selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            activeTab={detailTab}
            onTabChange={setDetailTab}
            onClose={() => { setShowDetailModal(false); setSelectedOrder(null); }}
            onReportIssue={() => { setShowDetailModal(false); openIssueReport(selectedOrder); }}
          />
        )}

        {/* Issue Report Modal */}
        {showIssueModal && selectedOrder && (
          <IssueReportModal
            order={selectedOrder}
            onClose={() => { setShowIssueModal(false); setSelectedOrder(null); }}
            onSubmit={(issueType, description) => {
              console.log('Issue reported:', { orderId: selectedOrder.id, issueType, description });
              setShowIssueModal(false);
              setSelectedOrder(null);
            }}
          />
        )}

        {/* Stage 5: Delivery Confirmation Dialog */}
        {confirmDeliveryOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setConfirmDeliveryOrder(null);
                setDeliveryConfirmError(null);
              }}
            />
            <div
              className="relative w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
              style={{ backgroundColor: styles.bgCard }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: styles.border }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${styles.success}15` }}
                  >
                    <Handshake size={20} weight="fill" style={{ color: styles.success }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                      {t('buyer.orders.confirmDelivery')}
                    </h2>
                    <p className="text-sm" style={{ color: styles.textMuted }}>
                      {confirmDeliveryOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setConfirmDeliveryOrder(null);
                    setDeliveryConfirmError(null);
                  }}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: styles.textMuted }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <p className="text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                    {t('buyer.orders.confirmDeliveryTitle') || 'Confirm you received your order'}
                  </p>
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    {t('buyer.orders.confirmDeliveryDesc') ||
                      'By confirming delivery, you acknowledge that you have received the order in satisfactory condition. The seller will be notified.'}
                  </p>
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.orders.item')}:</span>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>
                      {confirmDeliveryOrder.itemName}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.orders.quantity')}:</span>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>
                      {confirmDeliveryOrder.quantity}
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {deliveryConfirmError && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg"
                    style={{ backgroundColor: `${styles.error}15` }}
                  >
                    <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
                    <span className="text-sm" style={{ color: styles.error }}>
                      {deliveryConfirmError}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-3 p-4 border-t"
                style={{ borderColor: styles.border }}
              >
                <button
                  onClick={() => {
                    setConfirmDeliveryOrder(null);
                    setDeliveryConfirmError(null);
                  }}
                  disabled={isConfirmingDelivery}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleConfirmDelivery}
                  disabled={isConfirmingDelivery}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: styles.success, color: '#fff' }}
                >
                  {isConfirmingDelivery ? (
                    <Spinner size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} weight="fill" />
                  )}
                  {isConfirmingDelivery
                    ? t('common.processing')
                    : t('buyer.orders.confirmReceived') || 'Yes, I Received It'}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </Container>
    </div>
  );
};

// Order Detail Modal Component
const OrderDetailModal: React.FC<{
  order: MarketplaceOrder;
  activeTab: 'overview' | 'shipment' | 'timeline';
  onTabChange: (tab: 'overview' | 'shipment' | 'timeline') => void;
  onClose: () => void;
  onReportIssue: () => void;
}> = ({ order, activeTab, onTabChange, onClose, onReportIssue }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const [timeline, setTimeline] = useState<OrderAuditEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Fetch timeline when tab changes to timeline
  useEffect(() => {
    if (activeTab === 'timeline' && timeline.length === 0) {
      const fetchTimeline = async () => {
        try {
          setLoadingTimeline(true);
          const token = await getToken();
          if (token) {
            const events = await marketplaceOrderService.getOrderHistory(token, order.id);
            setTimeline(events);
          }
        } catch (err) {
          console.error('Failed to fetch timeline:', err);
        } finally {
          setLoadingTimeline(false);
        }
      };
      fetchTimeline();
    }
  }, [activeTab, order.id, getToken, timeline.length]);

  const tabs = [
    { id: 'overview' as const, label: t('buyer.orders.overview'), icon: FileText },
    { id: 'shipment' as const, label: t('buyer.orders.shipment'), icon: Truck },
    { id: 'timeline' as const, label: t('buyer.orders.timeline'), icon: Clock },
  ];

  const getEventIcon = (action: string) => {
    const icons: Record<string, React.ElementType> = {
      created: FileText,
      confirmed: CheckCircle,
      status_changed: ArrowsClockwise,
      shipped: Truck,
      delivered: Handshake,
      cancelled: X,
      refunded: Receipt,
      note_added: ChatCircle,
      tracking_added: MapPin,
      payment_updated: Receipt,
    };
    return icons[action] || FileText;
  };

  const getEventColor = (action: string) => {
    if (['delivered', 'confirmed'].includes(action)) return styles.success;
    if (['cancelled', 'refunded'].includes(action)) return styles.error;
    return styles.info;
  };

  const isDelayed = order.healthStatus === 'delayed' || order.healthStatus === 'critical';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl flex flex-col"
        style={{ backgroundColor: styles.bgCard }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
              {order.orderNumber}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={order.status} showIcon />
              <HealthBadge health={mapHealthStatus(order.healthStatus, order.hasException)} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b"
          style={{ borderColor: styles.border }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: isActive ? styles.info : styles.textMuted,
                }}
              >
                <tab.icon size={16} />
                {tab.label}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: styles.info }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* RFQ/Quote Info if from RFQ */}
              {order.source === 'rfq' && (order.rfqNumber || order.quoteNumber) && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${styles.info}10` }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: styles.info }}>
                    Order Origin
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {order.rfqNumber && (
                      <div>
                        <span style={{ color: styles.textMuted }}>RFQ:</span>
                        <span className="font-mono ml-2" style={{ color: styles.textPrimary }}>{order.rfqNumber}</span>
                      </div>
                    )}
                    {order.quoteNumber && (
                      <div>
                        <span style={{ color: styles.textMuted }}>Quote:</span>
                        <span className="font-mono ml-2" style={{ color: styles.textPrimary }}>{order.quoteNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Item Info */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                  {t('buyer.orders.itemDetails')}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.orders.item')}:</span>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>{order.itemName}</p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.orders.sku')}:</span>
                    <p className="font-mono" style={{ color: styles.textPrimary }}>{order.itemSku}</p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.orders.quantity')}:</span>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>{order.quantity}</p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.orders.total')}:</span>
                    <p className="font-semibold" style={{ color: styles.textPrimary }}>
                      {formatCurrency(order.totalPrice, order.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                  {t('buyer.orders.supplierInfo')}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: styles.bgCard }}
                    >
                      <Buildings size={20} style={{ color: styles.textMuted }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: styles.textPrimary }}>
                        Seller {order.sellerId.slice(0, 8)}...
                      </p>
                      {order.healthScore !== undefined && order.healthScore > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: styles.textMuted }}>
                            {t('buyer.orders.reliability') || 'Health'}:
                          </span>
                          <div className="flex items-center gap-1">
                            <div
                              className="h-1.5 w-16 rounded-full overflow-hidden"
                              style={{ backgroundColor: styles.bgCard }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${order.healthScore}%`,
                                  backgroundColor: order.healthScore >= 90 ? styles.success : '#f59e0b',
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium" style={{ color: styles.textPrimary }}>
                              {order.healthScore}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: styles.bgCard, color: styles.textMuted }}
                  >
                    <ChatCircle size={14} className={direction === 'rtl' ? 'ml-1 inline' : 'mr-1 inline'} />
                    {t('buyer.orders.contactSupplier')}
                  </button>
                </div>
              </div>

              {/* Buyer Notes */}
              {order.buyerNotes && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: styles.textPrimary }}>
                    Your Notes
                  </h3>
                  <p className="text-sm" style={{ color: styles.textMuted }}>{order.buyerNotes}</p>
                </div>
              )}

              {/* Issue Alert */}
              {order.hasException && (
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: styles.error }}
                >
                  <div className="flex items-start gap-3">
                    <WarningCircle size={20} style={{ color: styles.error }} weight="fill" />
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: styles.error }}>
                        {t('buyer.orders.activeIssue') || 'Issue Detected'}
                      </p>
                      <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                        {order.exceptionMessage || order.exceptionType || 'An issue has been detected with this order.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shipment' && (
            <div className="space-y-4">
              {order.trackingNumber || order.carrier ? (
                <>
                  {/* Shipment Status Card */}
                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: isDelayed ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)',
                      borderColor: isDelayed ? styles.error : styles.success,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {isDelayed ? (
                        <Warning size={24} style={{ color: styles.error }} weight="fill" />
                      ) : (
                        <Truck size={24} style={{ color: styles.success }} weight="fill" />
                      )}
                      <div>
                        <p className="font-semibold" style={{ color: isDelayed ? styles.error : styles.success }}>
                          {isDelayed
                            ? t('buyer.orders.delayed') || 'Delayed'
                            : t('buyer.orders.onSchedule') || 'On Schedule'
                          }
                        </p>
                        {order.estimatedDelivery && (
                          <p className="text-sm" style={{ color: styles.textMuted }}>
                            {t('buyer.orders.expectedDelivery') || 'Expected'}: {formatDate(order.estimatedDelivery)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipment Details */}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                      {t('buyer.orders.shipmentDetails') || 'Shipment Details'}
                    </h3>
                    <div className="space-y-3">
                      {order.carrier && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: styles.textMuted }}>{t('buyer.orders.carrier') || 'Carrier'}:</span>
                          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                            {order.carrier}
                          </span>
                        </div>
                      )}
                      {order.trackingNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: styles.textMuted }}>{t('buyer.orders.trackingNumber') || 'Tracking'}:</span>
                          <span className="text-sm font-mono" style={{ color: styles.info }}>
                            {order.trackingNumber}
                          </span>
                        </div>
                      )}
                      {order.shippingAddress && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: styles.textMuted }}>Shipping Address:</span>
                          <span className="text-sm flex items-center gap-1" style={{ color: styles.textPrimary }}>
                            <MapPin size={14} />
                            {order.shippingAddress}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Track Button */}
                  {order.trackingNumber && (
                    <button
                      className="w-full py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: styles.info, color: '#fff' }}
                    >
                      <MapPin size={16} />
                      {t('buyer.orders.trackPackage') || 'Track Package'}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Truck size={48} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    {t('buyer.orders.noShipmentYet') || 'No shipment information yet'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-1">
              {loadingTimeline ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size={24} className="animate-spin" style={{ color: styles.textMuted }} />
                </div>
              ) : timeline.length > 0 ? (
                <div className="relative">
                  {timeline.map((event, idx) => {
                    const Icon = getEventIcon(event.action);
                    const color = getEventColor(event.action);
                    const isLast = idx === timeline.length - 1;

                    return (
                      <div key={event.id} className="flex gap-3 pb-4">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            <Icon size={14} weight="fill" />
                          </div>
                          {!isLast && (
                            <div
                              className="w-0.5 flex-1 mt-1"
                              style={{ backgroundColor: styles.border }}
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-medium capitalize" style={{ color: styles.textPrimary }}>
                            {event.action.replace(/_/g, ' ')}
                          </p>
                          {event.newValue && (
                            <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                              {event.previousValue && `${event.previousValue} → `}{event.newValue}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs" style={{ color: styles.textMuted }}>
                              {formatDate(event.createdAt)}
                            </span>
                            {event.actor && (
                              <>
                                <span style={{ color: styles.textMuted }}>•</span>
                                <span className="text-xs capitalize" style={{ color: styles.textMuted }}>
                                  {event.actor}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock size={48} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    {t('buyer.orders.noTimeline') || 'No timeline events yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          {!order.hasException && !['delivered', 'cancelled'].includes(order.status) ? (
            <button
              onClick={onReportIssue}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: styles.error }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <WarningCircle size={16} />
              {t('buyer.orders.reportIssue')}
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: styles.bgCard, color: styles.textPrimary }}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Issue Report Modal Component
const IssueReportModal: React.FC<{
  order: MarketplaceOrder;
  onClose: () => void;
  onSubmit: (issueType: string, description: string) => void;
}> = ({ order, onClose, onSubmit }) => {
  const { styles, t, direction } = usePortal();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');

  const issueTypes = [
    { id: 'delay', label: t('buyer.orders.issueDelay'), icon: Clock },
    { id: 'damaged', label: t('buyer.orders.issueDamaged'), icon: WarningCircle },
    { id: 'wrong_item', label: t('buyer.orders.issueWrongItem'), icon: Package },
    { id: 'missing', label: t('buyer.orders.issueMissing'), icon: Warning },
    { id: 'quality', label: t('buyer.orders.issueQuality'), icon: ShieldCheck },
    { id: 'other', label: t('buyer.orders.issueOther'), icon: ChatCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
        style={{ backgroundColor: styles.bgCard }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
              {t('buyer.orders.reportIssue')}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: styles.textMuted }}>
              {order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Issue Type Selection */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: styles.textPrimary }}>
              {t('buyer.orders.issueType')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {issueTypes.map(type => {
                const isSelected = issueType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setIssueType(type.id)}
                    className="flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors"
                    style={{
                      borderColor: isSelected ? styles.info : styles.border,
                      backgroundColor: isSelected ? `${styles.info}10` : 'transparent',
                      color: isSelected ? styles.info : styles.textPrimary,
                    }}
                  >
                    <type.icon size={16} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: styles.textPrimary }}>
              {t('buyer.orders.issueDescription')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('buyer.orders.issueDescriptionPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none focus:ring-2"
              style={{
                borderColor: styles.border,
                backgroundColor: styles.bgPrimary,
                color: styles.textPrimary,
              }}
            />
          </div>

          {/* Info */}
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <Info size={16} style={{ color: styles.info }} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {t('buyer.orders.issueInfo')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 p-4 border-t"
          style={{ borderColor: styles.border }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onSubmit(issueType, description)}
            disabled={!issueType}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: styles.error, color: '#fff' }}
          >
            {t('buyer.orders.submitIssue')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
  highlight?: boolean;
}> = ({ label, value, icon: Icon, color, highlight }) => {
  const { styles } = usePortal();

  return (
    <div
      className="p-3 rounded-lg border transition-all"
      style={{
        backgroundColor: highlight ? `${color}10` : styles.bgCard,
        borderColor: highlight ? `${color}40` : styles.border,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color ? `${color}15` : styles.bgSecondary }}
        >
          <Icon size={16} style={{ color: color || styles.textMuted }} weight={highlight ? 'fill' : 'regular'} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] truncate" style={{ color: styles.textMuted }}>
            {label}
          </div>
          <div className="text-base font-semibold" style={{ color: highlight ? color : styles.textPrimary }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
