// =============================================================================
// Unified Orders Page - Shared between Buyer and Seller
// =============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Package,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Cube,
  Storefront,
  CurrencyDollar,
  CheckCircle,
  Timer,
  Warning,
  X,
} from 'phosphor-react';
import { EmptyState, SkeletonTableRow } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { getOrderStatusConfig } from '../../types/item.types';
import { getPaymentStatusConfig } from '../../types/order.types';
import { OrderDetailsPanel } from '../../seller/components/OrderDetailsPanel';
import { QuickFilterTab } from '../../seller/components/OrderUIComponents';

import type { Order, UnifiedOrdersProps } from './orders.types';
import { useOrdersData } from './useOrdersData';
import {
  formatRelativeTime,
  formatCurrency,
  getStatusColors,
  calculateSLARemaining,
  getDeliveryStatus,
} from './orders.utils';
import { OrderKPICards } from './OrderKPICards';
import { OrderHealthBar } from './OrderHealthBar';
import { OrderFilters } from './OrderFilters';
import { OrderTrackingStepper } from './OrderTrackingStepper';
import { OrderActions } from './OrderActions';
import {
  ConfirmOrderDialog,
  ProcessingDialog,
  ShipOrderDialog,
  RejectOrderDialog,
  CancelOrderDialog,
} from './OrderDialogs';

const columnHelper = createColumnHelper<Order>();

// =============================================================================
// SLA Indicator (seller inline)
// =============================================================================

const SLAIndicator: React.FC<{ order: Order; styles: ReturnType<typeof usePortal>['styles'] }> = ({
  order,
  styles,
}) => {
  const sla = calculateSLARemaining(order);
  if (!sla) {
    if (['delivered', 'closed'].includes(order.status)) {
      return (
        <div className="flex items-center gap-1">
          <CheckCircle size={12} weight="fill" style={{ color: styles.success }} />
          <span className="text-[10px] font-medium" style={{ color: styles.success }}>
            Complete
          </span>
        </div>
      );
    }
    return null;
  }

  const isWaiting = order.status === 'shipped' && !sla.isOverdue;
  const colorKey = isWaiting ? 'ok' : sla.urgency;
  const colors = {
    ok: { bg: `${styles.success}15`, text: styles.success },
    warning: { bg: `${styles.warning}15`, text: styles.warning },
    critical: { bg: `${styles.error}15`, text: styles.error },
  }[colorKey];

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: colors.bg }}>
        <Timer size={12} weight={sla.urgency === 'critical' ? 'fill' : 'bold'} style={{ color: colors.text }} />
        <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: colors.text }}>
          {isWaiting ? 'Waiting for buyer' : sla.statusText}
        </span>
      </div>
      {!isWaiting && (
        <span className="text-[9px] whitespace-nowrap px-2" style={{ color: styles.textMuted }}>
          {sla.timeText}
        </span>
      )}
    </div>
  );
};

// =============================================================================
// Delivery Indicator (buyer inline)
// =============================================================================

const DeliveryIndicator: React.FC<{ order: Order; styles: ReturnType<typeof usePortal>['styles'] }> = ({
  order,
  styles,
}) => {
  const delivery = getDeliveryStatus(order);
  if (!delivery) return null;

  if (delivery.text === 'Delivered') {
    return (
      <div className="flex items-center gap-1">
        <CheckCircle size={12} weight="fill" style={{ color: styles.success }} />
        <span className="text-[10px] font-medium" style={{ color: styles.success }}>
          Delivered
        </span>
      </div>
    );
  }

  const colors = {
    ok: { bg: `${styles.success}15`, text: styles.success },
    soon: { bg: `${styles.warning}15`, text: styles.warning },
    overdue: { bg: `${styles.error}15`, text: styles.error },
  }[delivery.urgency];

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: colors.bg }}>
      <Timer size={12} weight={delivery.urgency === 'overdue' ? 'fill' : 'bold'} style={{ color: colors.text }} />
      <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: colors.text }}>
        {delivery.text}
      </span>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const UnifiedOrders: React.FC<UnifiedOrdersProps> = ({ role, onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';
  const data = useOrdersData({ role });

  // Table sorting
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  // Details panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  // Dialog states (seller only)
  const [confirmDialogOrder, setConfirmDialogOrder] = useState<Order | null>(null);
  const [processingDialogOrder, setProcessingDialogOrder] = useState<Order | null>(null);
  const [shipDialogOrder, setShipDialogOrder] = useState<Order | null>(null);
  const [rejectDialogOrder, setRejectDialogOrder] = useState<Order | null>(null);
  const [cancelDialogOrder, setCancelDialogOrder] = useState<Order | null>(null);

  // Exception banner
  const [showExceptionsBanner, setShowExceptionsBanner] = useState(true);

  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsDetailsPanelOpen(true);
  }, []);

  const handleTrack = useCallback(
    (order: Order) => {
      onNavigate('order-tracking', { orderId: order.id });
    },
    [onNavigate],
  );

  // Color maps
  const { colorMap, bgColorMap } = getStatusColors(styles);

  // ==========================================================================
  // Table Columns
  // ==========================================================================

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mixed column def types
    const cols: ColumnDef<Order, any>[] = [];

    // Checkbox (seller only)
    if (role === 'seller') {
      cols.push(
        columnHelper.display({
          id: 'select',
          meta: { align: 'center' as const },
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className="w-4 h-4 rounded border-2 cursor-pointer accent-blue-600"
              style={{ borderColor: styles.border }}
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="w-4 h-4 rounded border-2 cursor-pointer accent-blue-600"
              style={{ borderColor: styles.border }}
            />
          ),
          size: 40,
        }),
      );
    }

    // Order #
    cols.push(
      columnHelper.accessor('orderNumber', {
        meta: { align: 'start' as const },
        header: 'Order #',
        cell: ({ row }) => {
          const order = row.original;
          const healthColor = {
            on_track: styles.success,
            at_risk: styles.warning,
            delayed: '#F59E0B',
            critical: styles.error,
          }[order.healthStatus || 'on_track'];

          return (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: healthColor }}
                  title={order.healthStatus || 'on_track'}
                />
                <button
                  onClick={() => handleViewDetails(order)}
                  className="font-medium hover:underline cursor-pointer truncate"
                  style={{ color: styles.info, fontSize: '0.79rem' }}
                >
                  {order.orderNumber}
                </button>
              </div>
              <p className="mt-0.5 pl-[18px]" style={{ color: styles.textMuted, fontSize: '0.65rem' }}>
                {formatRelativeTime(order.createdAt)}
              </p>
            </div>
          );
        },
        size: 140,
      }),
    );

    // Counterparty
    if (role === 'seller') {
      cols.push(
        columnHelper.accessor('buyerName', {
          meta: { align: 'start' as const },
          header: 'Buyer',
          cell: ({ row }) => {
            const order = row.original;
            return (
              <div className="min-w-0">
                <p className="font-medium truncate" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                  {order.buyerName || 'Unknown Buyer'}
                </p>
                {order.buyerCompany && order.buyerCompany !== order.buyerName && (
                  <p className="truncate" style={{ color: styles.textMuted, fontSize: '0.65rem' }}>
                    {order.buyerCompany}
                  </p>
                )}
              </div>
            );
          },
          size: 150,
        }),
      );
    } else {
      cols.push(
        columnHelper.display({
          id: 'seller',
          meta: { align: 'start' as const },
          header: 'Seller',
          cell: ({ row }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sellerName set during fetch mapping
            const order = row.original as any;
            return (
              <div className="min-w-0 flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <Storefront size={13} style={{ color: styles.textMuted }} />
                </div>
                <div>
                  <p className="font-medium truncate" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                    {order.sellerName || 'Seller'}
                  </p>
                </div>
              </div>
            );
          },
          size: 150,
        }),
      );
    }

    // Item
    cols.push(
      columnHelper.accessor('itemName', {
        meta: { align: 'start' as const },
        header: 'Item',
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden border flex items-center justify-center"
                style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
              >
                {order.itemImage ? (
                  <img src={order.itemImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Cube size={14} style={{ color: styles.textMuted }} />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="font-medium truncate leading-tight"
                  style={{ color: styles.textPrimary, fontSize: '0.75rem' }}
                >
                  {order.itemName || 'Item'}
                </p>
                <p className="truncate" style={{ color: styles.textMuted, fontSize: '0.625rem' }}>
                  {order.itemSku ? `${order.itemSku} · ` : ''}Qty: {order.quantity}
                </p>
              </div>
            </div>
          );
        },
        size: 180,
      }),
    );

    // Total
    cols.push(
      columnHelper.accessor('totalPrice', {
        meta: { align: 'center' as const },
        header: 'Total',
        cell: ({ row }) => (
          <p className="font-semibold" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
            {formatCurrency(row.original.totalPrice, row.original.currency)}
          </p>
        ),
        size: 100,
      }),
    );

    // Tracking Stepper
    cols.push(
      columnHelper.display({
        id: 'progress',
        meta: { align: 'center' as const },
        header: 'Progress',
        cell: ({ row }) => <OrderTrackingStepper order={row.original} role={role} />,
        size: 160,
      }),
    );

    // SLA (seller) / Delivery (buyer)
    cols.push(
      columnHelper.display({
        id: 'timeline',
        meta: { align: 'center' as const },
        header: role === 'seller' ? 'SLA' : 'Delivery',
        cell: ({ row }) =>
          role === 'seller' ? (
            <SLAIndicator order={row.original} styles={styles} />
          ) : (
            <DeliveryIndicator order={row.original} styles={styles} />
          ),
        size: 120,
      }),
    );

    // Status badge
    cols.push(
      columnHelper.accessor('status', {
        meta: { align: 'center' as const },
        header: 'Status',
        cell: ({ row }) => {
          const config = getOrderStatusConfig(row.original.status);
          return (
            <span
              className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
              style={{ backgroundColor: bgColorMap[config.color], color: colorMap[config.color] }}
            >
              {t(config.labelKey)}
            </span>
          );
        },
        size: 100,
      }),
    );

    // Payment (seller only)
    if (role === 'seller') {
      cols.push(
        columnHelper.accessor('paymentStatus', {
          meta: { align: 'center' as const },
          header: 'Payment',
          cell: ({ row }) => {
            const config = getPaymentStatusConfig(row.original.paymentStatus);
            const payColorMap: Record<string, string> = {
              warning: styles.warning,
              info: styles.info,
              success: styles.success,
              error: styles.error,
            };
            return (
              <span
                className="text-[10px] font-medium flex items-center gap-1"
                style={{ color: payColorMap[config.color] }}
              >
                <CurrencyDollar size={10} />
                {t(config.labelKey)}
              </span>
            );
          },
          size: 80,
        }),
      );
    }

    // Actions
    cols.push(
      columnHelper.display({
        id: 'actions',
        meta: { align: 'center' as const },
        header: 'Actions',
        cell: ({ row }) => (
          <OrderActions
            order={row.original}
            role={role}
            onView={handleViewDetails}
            onTrack={handleTrack}
            onConfirm={role === 'seller' ? (o) => setConfirmDialogOrder(o) : undefined}
            onProcess={role === 'seller' ? (o) => setProcessingDialogOrder(o) : undefined}
            onShip={role === 'seller' ? (o) => setShipDialogOrder(o) : undefined}
            onDeliver={role === 'seller' ? data.handleMarkDelivered : undefined}
            onConfirmDelivery={role === 'buyer' ? data.handleMarkDelivered : undefined}
          />
        ),
        size: 130,
      }),
    );

    return cols;
  }, [role, styles, t, bgColorMap, colorMap, data.handleMarkDelivered, handleViewDetails, handleTrack]);

  const table = useReactTable({
    data: data.filteredOrders,
    columns,
    state: { sorting, rowSelection: data.rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: data.setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: role === 'seller',
    getRowId: (row: Order) => row.id,
  });

  const selectedCount = Object.keys(data.rowSelection).length;

  // ==========================================================================
  // Loading Skeleton
  // ==========================================================================

  if (data.isLoading && data.orders.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: styles.bgPrimary }}>
        <div className="px-6 py-6">
          <div className="mb-6">
            <div className="shimmer h-7 w-48 rounded mb-2" />
            <div className="shimmer h-4 w-64 rounded" />
          </div>
          <div className={`grid gap-3 mb-4 ${role === 'seller' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {[...Array(role === 'seller' ? 5 : 4)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border"
                style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
              >
                <div className="shimmer h-4 w-20 rounded mb-2" style={{ animationDelay: `${i * 30}ms` }} />
                <div className="shimmer h-6 w-12 rounded" style={{ animationDelay: `${i * 30 + 15}ms` }} />
              </div>
            ))}
          </div>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${styles.border}` }}>
                  {[...Array(role === 'seller' ? 10 : 8)].map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <div className="shimmer h-3 w-16 rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <SkeletonTableRow key={i} columns={role === 'seller' ? 10 : 8} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className={`flex items-start justify-between mb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              {t(role === 'seller' ? 'seller.orders.title' : 'buyer.orders.title') || 'Orders'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: styles.textMuted }}>
              {t(role === 'seller' ? 'seller.orders.subtitle' : 'buyer.orders.subtitle') ||
                (role === 'seller' ? 'Manage and fulfill customer orders' : 'Track and manage your orders')}
            </p>
          </div>
          {/* Status pills */}
          <div className={`flex items-center gap-3 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
            <QuickFilterTab
              label="All"
              value={data.stats.total}
              isActive={data.statusFilter === ''}
              onClick={() => data.setStatusFilter('')}
              styles={styles}
            />
            <QuickFilterTab
              label="Pending"
              value={data.stats.pendingConfirmation}
              color={styles.warning}
              isActive={data.statusFilter === 'pending_confirmation'}
              onClick={() => data.setStatusFilter('pending_confirmation')}
              styles={styles}
              highlight={data.stats.pendingConfirmation > 0}
            />
            <QuickFilterTab
              label="Processing"
              value={data.stats.processing + data.stats.confirmed}
              color="#8B5CF6"
              isActive={data.statusFilter === 'processing'}
              onClick={() => data.setStatusFilter('processing')}
              styles={styles}
            />
            <QuickFilterTab
              label="Shipped"
              value={data.stats.shipped}
              color={styles.info}
              isActive={data.statusFilter === 'shipped'}
              onClick={() => data.setStatusFilter('shipped')}
              styles={styles}
            />
            <QuickFilterTab
              label="Delivered"
              value={data.stats.delivered}
              color={styles.success}
              isActive={data.statusFilter === 'delivered'}
              onClick={() => data.setStatusFilter('delivered')}
              styles={styles}
            />
            <QuickFilterTab
              label="Cancelled"
              value={data.stats.cancelled}
              color={styles.error}
              isActive={data.statusFilter === 'cancelled'}
              onClick={() => data.setStatusFilter('cancelled')}
              styles={styles}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <OrderKPICards role={role} stats={data.stats} orders={data.orders} />

        {/* Health Bar */}
        <OrderHealthBar
          role={role}
          stats={data.stats}
          healthFilter={data.healthFilter}
          onHealthFilterChange={data.setHealthFilter}
        />

        {/* Exception Banner (seller only) */}
        {role === 'seller' && showExceptionsBanner && data.ordersWithExceptions.length > 0 && (
          <div
            className="rounded-xl border p-4 mb-4"
            style={{ backgroundColor: `${styles.error}08`, borderColor: `${styles.error}30` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${styles.error}15` }}>
                  <Warning size={20} weight="fill" style={{ color: styles.error }} />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: styles.error }}>
                    Active Exceptions
                  </p>
                  <div className="space-y-1">
                    {data.ordersWithExceptions.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: styles.textSecondary }}
                      >
                        <span className="font-medium" style={{ color: styles.textPrimary }}>
                          {order.orderNumber}
                        </span>
                        <span>-</span>
                        <span>{order.exceptionMessage}</span>
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="font-medium underline"
                          style={{ color: styles.info }}
                        >
                          View
                        </button>
                      </div>
                    ))}
                    {data.ordersWithExceptions.length > 3 && (
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        +{data.ordersWithExceptions.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowExceptionsBanner(false)}
                className="p-1 rounded"
                style={{ color: styles.textMuted }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <OrderFilters
          role={role}
          searchQuery={data.searchQuery}
          onSearchChange={data.setSearchQuery}
          statusFilter={data.statusFilter}
          onStatusChange={data.setStatusFilter}
          paymentFilter={data.paymentFilter}
          onPaymentChange={data.setPaymentFilter}
          sortOption={data.sortOption}
          onSortChange={data.setSortOption}
          hasActiveFilters={data.hasActiveFilters}
          onClearAll={data.clearAllFilters}
          selectedCount={selectedCount}
          onBulkConfirm={() => {
            const ids = Object.keys(data.rowSelection);
            ids.forEach((id) => {
              const order = data.orders.find((o) => o.id === id);
              if (order && order.status === 'pending_confirmation') {
                data.handleConfirmOrder(order);
              }
            });
            data.setRowSelection({});
          }}
        />

        {/* Table */}
        {data.orders.length === 0 ? (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={Package}
              title={t(role === 'seller' ? 'seller.orders.noOrders' : 'buyer.orders.noOrders') || 'No orders yet'}
              description={
                t(role === 'seller' ? 'seller.orders.noOrdersDesc' : 'buyer.orders.noOrdersDesc') ||
                'Orders will appear here once created.'
              }
            />
          </div>
        ) : data.filteredOrders.length === 0 ? (
          <div
            className="rounded-xl border py-16 text-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <MagnifyingGlass size={40} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              No matching orders
            </p>
            <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
              Try adjusting your filters
            </p>
            <button onClick={data.clearAllFilters} className="mt-3 text-sm font-medium" style={{ color: styles.info }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      style={{ backgroundColor: styles.bgSecondary, borderBottom: `1px solid ${styles.border}` }}
                    >
                      {headerGroup.headers.map((header) => {
                        const align = (header.column.columnDef.meta as { align?: string })?.align || 'start';
                        return (
                          <th
                            key={header.id}
                            className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                            style={{
                              color: styles.textMuted,
                              width: header.getSize(),
                              textAlign: align as 'start' | 'center',
                            }}
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : ''} ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanSort() && (
                                  <span className="flex flex-col -space-y-1 ml-0.5">
                                    {header.column.getIsSorted() === 'asc' ? (
                                      <CaretUp size={10} weight="bold" style={{ color: styles.textPrimary }} />
                                    ) : header.column.getIsSorted() === 'desc' ? (
                                      <CaretDown size={10} weight="bold" style={{ color: styles.textPrimary }} />
                                    ) : (
                                      <>
                                        <CaretUp size={8} style={{ color: styles.textMuted, opacity: 0.4 }} />
                                        <CaretDown size={8} style={{ color: styles.textMuted, opacity: 0.4 }} />
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, index) => {
                    const orderData = row.original;
                    const isAtRisk = ['at_risk', 'delayed', 'critical'].includes(orderData.healthStatus || '');
                    const slaData = role === 'seller' ? calculateSLARemaining(orderData) : null;
                    const isSlaAtRisk = slaData && (slaData.urgency === 'warning' || slaData.urgency === 'critical');
                    const shouldHighlight = isAtRisk || !!isSlaAtRisk;
                    const atRiskBg = styles.isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)';

                    return (
                      <tr
                        key={row.id}
                        className="group transition-colors"
                        style={{
                          borderBottom:
                            index === table.getRowModel().rows.length - 1 ? 'none' : `1px solid ${styles.border}`,
                          backgroundColor: row.getIsSelected()
                            ? styles.isDark
                              ? 'rgba(59,130,246,0.1)'
                              : 'rgba(59,130,246,0.05)'
                            : shouldHighlight
                              ? atRiskBg
                              : 'transparent',
                          borderLeft: shouldHighlight ? `3px solid ${styles.warning}` : undefined,
                        }}
                        onMouseEnter={(e) => {
                          if (!row.getIsSelected()) {
                            e.currentTarget.style.backgroundColor = styles.isDark
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(0,0,0,0.02)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!row.getIsSelected()) {
                            e.currentTarget.style.backgroundColor = shouldHighlight ? atRiskBg : 'transparent';
                          }
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const align = (cell.column.columnDef.meta as { align?: string })?.align || 'start';
                          return (
                            <td
                              key={cell.id}
                              className="px-3 py-2.5"
                              style={{
                                width: cell.column.getSize(),
                                verticalAlign: 'middle',
                                textAlign: align as 'start' | 'center',
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 flex items-center justify-between text-sm"
              style={{
                borderTop: `1px solid ${styles.border}`,
                backgroundColor: styles.bgSecondary,
                color: styles.textMuted,
              }}
            >
              <span>
                Showing {data.filteredOrders.length} of {data.orders.length} orders
              </span>
              {selectedCount > 0 && (
                <span className="font-medium" style={{ color: styles.textPrimary }}>
                  {selectedCount} selected
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Panel - uses Order from order.types.ts, we use MarketplaceOrder */}
      {/* eslint-disable @typescript-eslint/no-explicit-any */}
      <OrderDetailsPanel
        isOpen={isDetailsPanelOpen}
        order={selectedOrder as any}
        onClose={() => {
          setIsDetailsPanelOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={data.handleConfirmOrder as any}
        onShip={(order: any) => setShipDialogOrder(order)}
        onMarkDelivered={data.handleMarkDelivered as any}
        onCancel={(order: any) => setCancelDialogOrder(order)}
      />
      {/* eslint-enable @typescript-eslint/no-explicit-any */}

      {/* Dialogs (seller only) */}
      {role === 'seller' && confirmDialogOrder && (
        <ConfirmOrderDialog
          order={confirmDialogOrder}
          onConfirm={data.handleConfirmOrder}
          onClose={() => {
            setConfirmDialogOrder(null);
            data.setActionError(null);
          }}
          isLoading={data.isActionLoading}
          error={data.actionError}
        />
      )}
      {role === 'seller' && processingDialogOrder && (
        <ProcessingDialog
          order={processingDialogOrder}
          onProcess={data.handleStartProcessing}
          onClose={() => {
            setProcessingDialogOrder(null);
            data.setActionError(null);
          }}
          isLoading={data.isActionLoading}
          error={data.actionError}
        />
      )}
      {role === 'seller' && shipDialogOrder && (
        <ShipOrderDialog
          order={shipDialogOrder}
          onShip={data.handleShipOrder}
          onClose={() => {
            setShipDialogOrder(null);
            data.setActionError(null);
          }}
          isLoading={data.isActionLoading}
          error={data.actionError}
        />
      )}
      {role === 'seller' && rejectDialogOrder && (
        <RejectOrderDialog
          order={rejectDialogOrder}
          onReject={data.handleRejectOrder}
          onClose={() => {
            setRejectDialogOrder(null);
            data.setActionError(null);
          }}
          isLoading={data.isActionLoading}
          error={data.actionError}
        />
      )}
      {role === 'seller' && cancelDialogOrder && (
        <CancelOrderDialog
          order={cancelDialogOrder}
          onCancel={data.handleCancelOrder}
          onClose={() => {
            setCancelDialogOrder(null);
            data.setActionError(null);
          }}
          isLoading={data.isActionLoading}
          error={data.actionError}
        />
      )}
    </div>
  );
};
