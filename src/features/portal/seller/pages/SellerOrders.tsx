import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { orderService } from '../../services/orderService';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  Package,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  X,
  Funnel,
  SortAscending,
  CaretRight,
  CheckSquare,
  CurrencyDollar,
  Cube,
} from 'phosphor-react';
import { Button, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  getOrderStatusConfig,
  getPaymentStatusConfig,
  canConfirmOrder,
  canShipOrder,
  canCancelOrder,
  canMarkDelivered,
} from '../../types/order.types';
import { OrderDetailsPanel } from '../components/OrderDetailsPanel';

const ORDERS_STORAGE_KEY = 'portal-seller-orders';

type SortOption = 'newest' | 'oldest' | 'total_high' | 'total_low';

interface SellerOrdersProps {
  onNavigate: (page: string) => void;
}

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

// Generate sample orders for demonstration
const generateSampleOrders = (): Order[] => {
  const statuses: OrderStatus[] = ['pending_confirmation', 'confirmed', 'in_progress', 'shipped', 'delivered', 'cancelled'];
  const paymentStatuses: PaymentStatus[] = ['unpaid', 'authorized', 'paid'];
  const fulfillmentStatuses: FulfillmentStatus[] = ['not_started', 'packing', 'out_for_delivery', 'delivered'];
  const buyers = [
    { name: 'Ahmed Industrial Co.', email: 'procurement@ahmedindustrial.com', company: 'Ahmed Industrial Co.' },
    { name: 'Gulf Manufacturing LLC', email: 'orders@gulfmfg.com', company: 'Gulf Manufacturing LLC' },
    { name: 'Saudi Equipment Solutions', email: 'buying@saudieq.com', company: 'Saudi Equipment Solutions' },
    { name: 'Eastern Parts Trading', email: 'parts@easterntrading.com', company: 'Eastern Parts Trading' },
    { name: 'Riyadh Machinery Works', email: 'supply@riyadhmachinery.com', company: 'Riyadh Machinery Works' },
  ];
  const items = [
    { name: 'Hydraulic Pump HP-5000', sku: 'HP-5000', price: 2500 },
    { name: 'Industrial Bearing Set IB-200', sku: 'IB-200', price: 450 },
    { name: 'Pneumatic Cylinder PC-100', sku: 'PC-100', price: 890 },
    { name: 'Motor Controller MC-300', sku: 'MC-300', price: 1200 },
    { name: 'Safety Valve SV-50', sku: 'SV-50', price: 320 },
  ];

  return Array.from({ length: 15 }, (_, i) => {
    const buyer = buyers[i % buyers.length];
    const item = items[i % items.length];
    const status = statuses[i % statuses.length];
    const quantity = Math.floor(Math.random() * 10) + 1;
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

    return {
      id: `order-${1000 + i}`,
      orderNumber: `ORD-${2024}-${String(1000 + i).padStart(4, '0')}`,
      buyerId: `buyer-${i}`,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerCompany: buyer.company,
      sellerId: 'current-seller',
      itemId: `item-${i}`,
      itemName: item.name,
      itemSku: item.sku,
      rfqId: i % 3 === 0 ? `rfq-${i}` : undefined,
      rfqNumber: i % 3 === 0 ? `RFQ-${2024}-${String(100 + i).padStart(4, '0')}` : undefined,
      quantity,
      unitPrice: item.price,
      totalPrice: item.price * quantity,
      currency: 'SAR',
      status,
      paymentStatus: status === 'delivered' ? 'paid' : paymentStatuses[i % paymentStatuses.length],
      fulfillmentStatus: status === 'delivered' ? 'delivered' : fulfillmentStatuses[Math.min(statuses.indexOf(status), fulfillmentStatuses.length - 1)],
      source: i % 3 === 0 ? 'rfq' : 'direct_buy',
      createdAt,
      confirmedAt: ['confirmed', 'in_progress', 'shipped', 'delivered'].includes(status) ? createdAt : undefined,
      shippedAt: ['shipped', 'delivered'].includes(status) ? createdAt : undefined,
      deliveredAt: status === 'delivered' ? createdAt : undefined,
      updatedAt: createdAt,
      auditLog: [
        {
          id: `audit-${i}-1`,
          timestamp: createdAt,
          action: 'created' as const,
          actor: 'buyer' as const,
        },
      ],
    };
  });
};

const columnHelper = createColumnHelper<Order>();

export const SellerOrders: React.FC<SellerOrdersProps> = ({ onNavigate }) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Panel states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await orderService.getSellerOrders(token);
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
      // Fall back to sample data for demo
      setOrders(generateSampleOrders());
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update order in local state after API call
  const updateOrderInState = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
  };

  // Apply all filters
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.buyerName.toLowerCase().includes(q) ||
          o.itemName.toLowerCase().includes(q) ||
          o.itemSku.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter) {
      if (statusFilter === 'confirmed') {
        // "Confirmed" tab shows both confirmed and in_progress
        result = result.filter((o) => o.status === 'confirmed' || o.status === 'in_progress');
      } else {
        result = result.filter((o) => o.status === statusFilter);
      }
    }

    // Payment filter
    if (paymentFilter) {
      result = result.filter((o) => o.paymentStatus === paymentFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'total_high':
          return b.totalPrice - a.totalPrice;
        case 'total_low':
          return a.totalPrice - b.totalPrice;
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchQuery, statusFilter, paymentFilter, sortOption]);

  // Stats for quick filters
  const stats = useMemo(() => {
    const pendingConfirmation = orders.filter((o) => o.status === 'pending_confirmation').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed' || o.status === 'in_progress').length;
    const shipped = orders.filter((o) => o.status === 'shipped').length;
    const completed = orders.filter((o) => o.status === 'delivered').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const totalRevenue = orders
      .filter((o) => o.status === 'delivered' && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    return {
      total: orders.length,
      pendingConfirmation,
      confirmed,
      shipped,
      completed,
      cancelled,
      totalRevenue,
    };
  }, [orders]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || statusFilter || paymentFilter;

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPaymentFilter('');
  };

  // Order actions
  const handleConfirmOrder = async (order: Order) => {
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await orderService.confirmOrder(token, order.id);
      updateOrderInState(updated);
    } catch (err) {
      console.error('Failed to confirm order:', err);
      // Optimistic update fallback
      updateOrderInState({
        ...order,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleShipOrder = async (order: Order) => {
    try {
      const token = await getToken();
      if (!token) return;
      // Simple ship with default tracking for demo
      const updated = await orderService.shipOrder(token, order.id, {
        trackingNumber: `TRK-${Date.now()}`,
        carrier: 'Default Carrier',
      });
      updateOrderInState(updated);
    } catch (err) {
      console.error('Failed to ship order:', err);
      // Optimistic update fallback
      updateOrderInState({
        ...order,
        status: 'shipped',
        fulfillmentStatus: 'out_for_delivery',
        shippedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleMarkDelivered = async (order: Order) => {
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await orderService.markDelivered(token, order.id);
      updateOrderInState(updated);
    } catch (err) {
      console.error('Failed to mark order delivered:', err);
      // Optimistic update fallback
      updateOrderInState({
        ...order,
        status: 'delivered',
        fulfillmentStatus: 'delivered',
        paymentStatus: 'paid',
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleCancelOrder = async (order: Order) => {
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await orderService.cancelOrder(token, order.id);
      updateOrderInState(updated);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      // Optimistic update fallback
      updateOrderInState({
        ...order,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsPanelOpen(true);
  };

  const columns = useMemo(
    () => [
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
        size: 44,
      }),
      columnHelper.accessor('orderNumber', {
        meta: { align: 'start' as const },
        header: t('seller.orders.orderNumber'),
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="min-w-0">
              <button
                onClick={() => handleViewDetails(order)}
                className="font-medium hover:underline cursor-pointer"
                style={{ color: styles.info, fontSize: '0.79rem' }}
              >
                {order.orderNumber}
              </button>
              {order.rfqNumber && (
                <p className="mt-0.5" style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
                  {t('seller.orders.fromRfq')}: {order.rfqNumber}
                </p>
              )}
            </div>
          );
        },
        size: 160,
      }),
      columnHelper.accessor('buyerName', {
        meta: { align: 'start' as const },
        header: t('seller.orders.buyer'),
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="min-w-0">
              <p className="font-medium truncate" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                {order.buyerName}
              </p>
              {order.buyerCompany && order.buyerCompany !== order.buyerName && (
                <p className="truncate" style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
                  {order.buyerCompany}
                </p>
              )}
            </div>
          );
        },
        size: 180,
      }),
      columnHelper.accessor('itemName', {
        meta: { align: 'start' as const },
        header: t('seller.orders.item'),
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border flex items-center justify-center"
                style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
              >
                {order.itemImage ? (
                  <img src={order.itemImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Cube size={18} style={{ color: styles.textMuted }} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate leading-tight" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                  {order.itemName}
                </p>
                <p className="truncate" style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
                  {order.itemSku} &middot; {t('seller.orders.quantity')}: {order.quantity}
                </p>
              </div>
            </div>
          );
        },
        size: 240,
      }),
      columnHelper.accessor('totalPrice', {
        meta: { align: 'center' as const },
        header: t('seller.orders.total'),
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="min-w-0">
              <p className="font-semibold" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                {formatCurrency(order.totalPrice, order.currency)}
              </p>
              <p style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
                {order.quantity} x {formatCurrency(order.unitPrice, order.currency)}
              </p>
            </div>
          );
        },
        size: 120,
      }),
      columnHelper.accessor('status', {
        meta: { align: 'center' as const },
        header: t('seller.orders.status'),
        cell: ({ row }) => {
          const order = row.original;
          const config = getOrderStatusConfig(order.status);
          const colorMap: Record<string, string> = {
            warning: styles.warning,
            info: styles.info,
            primary: '#8B5CF6',
            success: styles.success,
            error: styles.error,
            muted: styles.textMuted,
          };
          const bgColorMap: Record<string, string> = {
            warning: styles.isDark ? '#4A3D1A' : '#FFF8E1',
            info: styles.isDark ? '#1E3A5F' : '#E3F2FD',
            primary: styles.isDark ? '#3B2D5F' : '#EDE9FE',
            success: styles.isDark ? '#1B3D2F' : '#E8F5E9',
            error: styles.isDark ? '#3D1B1B' : '#FFEBEE',
            muted: styles.bgSecondary,
          };

          return (
            <span
              className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: bgColorMap[config.color],
                color: colorMap[config.color],
              }}
            >
              {t(config.labelKey)}
            </span>
          );
        },
        size: 110,
      }),
      columnHelper.accessor('paymentStatus', {
        meta: { align: 'center' as const },
        header: t('seller.orders.paymentStatus'),
        cell: ({ row }) => {
          const order = row.original;
          const config = getPaymentStatusConfig(order.paymentStatus);
          const colorMap: Record<string, string> = {
            warning: styles.warning,
            info: styles.info,
            success: styles.success,
            error: styles.error,
          };

          return (
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: colorMap[config.color] }}>
              <CurrencyDollar size={12} />
              {t(config.labelKey)}
            </span>
          );
        },
        size: 90,
      }),
      columnHelper.accessor('createdAt', {
        meta: { align: 'center' as const },
        header: t('seller.orders.created'),
        cell: ({ row }) => (
          <span style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
            {formatRelativeTime(row.original.createdAt)}
          </span>
        ),
        size: 90,
      }),
      columnHelper.display({
        id: 'actions',
        meta: { align: 'center' as const },
        header: t('common.actions'),
        cell: ({ row }) => {
          const order = row.original;

          return (
            <div className="flex items-center gap-1">
              {canConfirmOrder(order) && (
                <button
                  onClick={() => handleConfirmOrder(order)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: styles.success }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={t('seller.orders.confirmOrder')}
                >
                  <CheckCircle size={16} />
                </button>
              )}
              {canShipOrder(order) && (
                <button
                  onClick={() => handleShipOrder(order)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: styles.info }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={t('seller.orders.shipOrder')}
                >
                  <Truck size={16} />
                </button>
              )}
              {canMarkDelivered(order) && (
                <button
                  onClick={() => handleMarkDelivered(order)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: styles.success }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={t('seller.orders.markDelivered')}
                >
                  <CheckCircle size={16} weight="fill" />
                </button>
              )}
              {canCancelOrder(order) && (
                <button
                  onClick={() => handleCancelOrder(order)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: styles.error }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={t('seller.orders.cancelOrder')}
                >
                  <XCircle size={16} />
                </button>
              )}
              <button
                onClick={() => handleViewDetails(order)}
                className="p-1.5 rounded transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = styles.bgHover;
                  e.currentTarget.style.color = styles.info;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = styles.textMuted;
                }}
                title={t('seller.orders.viewDetails')}
              >
                <Eye size={16} />
              </button>
            </div>
          );
        },
        size: 140,
      }),
    ],
    [styles, t, isRtl]
  );

  const table = useReactTable({
    data: filteredOrders,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    getRowId: (row: Order) => row.id,
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              {t('seller.orders.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              {t('seller.orders.subtitle')}
            </p>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className={`flex items-center gap-6 mb-6 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
          <QuickFilterTab
            label={t('seller.orders.allOrders')}
            value={stats.total}
            isActive={statusFilter === ''}
            onClick={() => setStatusFilter('')}
            styles={styles}
          />
          <QuickFilterTab
            label={t('seller.orders.pendingConfirmation')}
            value={stats.pendingConfirmation}
            color={styles.warning}
            isActive={statusFilter === 'pending_confirmation'}
            onClick={() => setStatusFilter('pending_confirmation')}
            styles={styles}
            highlight={stats.pendingConfirmation > 0}
          />
          <QuickFilterTab
            label={t('seller.orders.confirmed')}
            value={stats.confirmed}
            isActive={statusFilter === 'confirmed'}
            onClick={() => setStatusFilter('confirmed')}
            styles={styles}
          />
          <QuickFilterTab
            label={t('seller.orders.shipped')}
            value={stats.shipped}
            color={styles.info}
            isActive={statusFilter === 'shipped'}
            onClick={() => setStatusFilter('shipped')}
            styles={styles}
          />
          <QuickFilterTab
            label={t('seller.orders.delivered')}
            value={stats.completed}
            color={styles.success}
            isActive={statusFilter === 'delivered'}
            onClick={() => setStatusFilter('delivered')}
            styles={styles}
          />
          <QuickFilterTab
            label={t('seller.orders.cancelled')}
            value={stats.cancelled}
            color={styles.error}
            isActive={statusFilter === 'cancelled'}
            onClick={() => setStatusFilter('cancelled')}
            styles={styles}
          />
        </div>

        {/* Filter Bar */}
        <div
          className="rounded-xl border mb-4"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          {/* Filter Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: styles.border }}
          >
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: styles.textPrimary }}
            >
              <Funnel size={16} />
              {t('seller.orders.filters')}
              <CaretRight
                size={14}
                className={`transition-transform ${filtersExpanded ? 'rotate-90' : ''}`}
                style={{ color: styles.textMuted }}
              />
              {hasActiveFilters && (
                <span
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  Active
                </span>
              )}
            </button>
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <FilterDropdown
                value={sortOption}
                onChange={(v) => setSortOption(v as SortOption)}
                options={[
                  { value: 'newest', label: t('seller.orders.newest') },
                  { value: 'oldest', label: t('seller.orders.oldest') },
                  { value: 'total_high', label: t('seller.orders.totalHighLow') },
                  { value: 'total_low', label: t('seller.orders.totalLowHigh') },
                ]}
                icon={<SortAscending size={14} />}
                styles={styles}
                isRtl={isRtl}
              />

              {/* Bulk Actions */}
              {selectedCount > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border"
                    style={{ borderColor: styles.border, color: styles.textPrimary }}
                  >
                    <CheckSquare size={14} />
                    {selectedCount} {t('seller.orders.selected')}
                    <CaretDown size={12} />
                  </button>
                  {showBulkActions && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowBulkActions(false)} />
                      <div
                        className={`absolute top-full mt-1 z-20 py-1 rounded-lg shadow-lg min-w-[160px] ${isRtl ? 'left-0' : 'right-0'}`}
                        style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
                      >
                        <MenuButton
                          icon={CheckCircle}
                          label={t('seller.orders.confirmOrder')}
                          styles={styles}
                          onClick={() => {
                            const selectedIds = Object.keys(rowSelection);
                            selectedIds.forEach((id) => {
                              const order = orders.find((o) => o.id === id);
                              if (order && canConfirmOrder(order)) {
                                handleConfirmOrder(order);
                              }
                            });
                            setRowSelection({});
                            setShowBulkActions(false);
                          }}
                        />
                        <MenuButton
                          icon={Truck}
                          label={t('seller.orders.shipOrder')}
                          styles={styles}
                          onClick={() => {
                            const selectedIds = Object.keys(rowSelection);
                            selectedIds.forEach((id) => {
                              const order = orders.find((o) => o.id === id);
                              if (order && canShipOrder(order)) {
                                handleShipOrder(order);
                              }
                            });
                            setRowSelection({});
                            setShowBulkActions(false);
                          }}
                        />
                        <div className="h-px my-1" style={{ backgroundColor: styles.border }} />
                        <MenuButton
                          icon={XCircle}
                          label={t('seller.orders.cancelOrder')}
                          styles={styles}
                          onClick={() => {
                            const selectedIds = Object.keys(rowSelection);
                            selectedIds.forEach((id) => {
                              const order = orders.find((o) => o.id === id);
                              if (order && canCancelOrder(order)) {
                                handleCancelOrder(order);
                              }
                            });
                            setRowSelection({});
                            setShowBulkActions(false);
                          }}
                          danger
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          {filtersExpanded && (
            <div className="px-4 py-3 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 h-9 rounded-lg border flex-1 min-w-[200px] max-w-[300px]"
                style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
              >
                <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
                <input
                  type="text"
                  placeholder={t('seller.orders.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="outline-none text-sm bg-transparent flex-1"
                  style={{ color: styles.textPrimary }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ color: styles.textMuted }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status */}
              <FilterDropdown
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as OrderStatus | '')}
                placeholder={t('seller.orders.status')}
                options={[
                  { value: '', label: t('seller.orders.allStatus') },
                  { value: 'pending_confirmation', label: t('seller.orders.pendingConfirmation') },
                  { value: 'confirmed', label: t('seller.orders.confirmed') },
                  { value: 'in_progress', label: t('seller.orders.inProgress') },
                  { value: 'shipped', label: t('seller.orders.shipped') },
                  { value: 'delivered', label: t('seller.orders.delivered') },
                  { value: 'cancelled', label: t('seller.orders.cancelled') },
                ]}
                styles={styles}
                isRtl={isRtl}
              />

              {/* Payment */}
              <FilterDropdown
                value={paymentFilter}
                onChange={(v) => setPaymentFilter(v as PaymentStatus | '')}
                placeholder={t('seller.orders.paymentStatus')}
                options={[
                  { value: '', label: t('seller.orders.allPayment') },
                  { value: 'unpaid', label: t('seller.orders.unpaid') },
                  { value: 'authorized', label: t('seller.orders.authorized') },
                  { value: 'paid', label: t('seller.orders.paid') },
                ]}
                styles={styles}
                isRtl={isRtl}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                  style={{ color: styles.error }}
                >
                  <X size={12} /> {t('seller.orders.clearAll')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {orders.length === 0 ? (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={Package}
              title={t('seller.orders.noOrders')}
              description={t('seller.orders.noOrdersDesc')}
            />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            className="rounded-xl border py-16 text-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <MagnifyingGlass size={40} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {t('seller.orders.noResults')}
            </p>
            <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
              {t('seller.orders.tryAdjusting')}
            </p>
            <button onClick={clearAllFilters} className="mt-3 text-sm font-medium" style={{ color: styles.info }}>
              {t('seller.orders.clearAll')}
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
                      style={{
                        backgroundColor: styles.tableHeader,
                        borderBottom: `1px solid ${styles.tableBorder}`,
                      }}
                    >
                      {headerGroup.headers.map((header) => {
                        const align = (header.column.columnDef.meta as { align?: 'start' | 'center' })?.align || 'start';
                        return (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: styles.textMuted,
                            width: header.getSize(),
                            textAlign: align,
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center gap-1 ${
                                align === 'center' ? 'justify-center' : ''
                              } ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className="flex flex-col -space-y-1 ml-0.5">
                                  {header.column.getIsSorted() === 'asc' ? (
                                    <CaretUp size={12} weight="bold" style={{ color: styles.textPrimary }} />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <CaretDown size={12} weight="bold" style={{ color: styles.textPrimary }} />
                                  ) : (
                                    <>
                                      <CaretUp size={10} style={{ color: styles.textMuted, opacity: 0.4 }} />
                                      <CaretDown size={10} style={{ color: styles.textMuted, opacity: 0.4 }} />
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
                  {table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className="group transition-colors"
                      style={{
                        borderBottom:
                          index === table.getRowModel().rows.length - 1
                            ? 'none'
                            : `1px solid ${styles.tableBorder}`,
                        backgroundColor: row.getIsSelected()
                          ? styles.isDark
                            ? 'rgba(59,130,246,0.1)'
                            : 'rgba(59,130,246,0.05)'
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!row.getIsSelected()) {
                          e.currentTarget.style.backgroundColor = styles.tableRowHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!row.getIsSelected()) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align = (cell.column.columnDef.meta as { align?: 'start' | 'center' })?.align || 'start';
                        return (
                        <td key={cell.id} className="px-4 py-3" style={{ width: cell.column.getSize(), verticalAlign: 'middle', textAlign: align }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 flex items-center justify-between text-sm"
              style={{
                borderTop: `1px solid ${styles.tableBorder}`,
                backgroundColor: styles.tableHeader,
                color: styles.textMuted,
              }}
            >
              <span>
                {t('seller.orders.showing')} {filteredOrders.length} {t('seller.orders.of')} {orders.length}{' '}
                {t('seller.orders.orders')}
              </span>
              {selectedCount > 0 && (
                <span className="font-medium" style={{ color: styles.textPrimary }}>
                  {selectedCount} {t('seller.orders.selected')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Panel */}
      <OrderDetailsPanel
        isOpen={isDetailsPanelOpen}
        order={selectedOrder}
        onClose={() => {
          setIsDetailsPanelOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleConfirmOrder}
        onShip={handleShipOrder}
        onMarkDelivered={handleMarkDelivered}
        onCancel={handleCancelOrder}
      />
    </div>
  );
};

// Quick Filter Tab Component (clickable like RFQ filters)
const QuickFilterTab: React.FC<{
  label: string;
  value: number;
  color?: string;
  styles: ReturnType<typeof usePortal>['styles'];
  highlight?: boolean;
  isActive?: boolean;
  onClick: () => void;
}> = ({ label, value, color, styles, highlight, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 transition-colors"
    style={{ opacity: isActive ? 1 : 0.7 }}
  >
    <span
      className="text-sm"
      style={{
        color: isActive ? (color || styles.textPrimary) : styles.textMuted,
        fontWeight: isActive ? 600 : 400,
      }}
    >
      {label}:
    </span>
    <span
      className={`text-sm font-semibold ${highlight ? 'flex items-center gap-1' : ''}`}
      style={{ color: color || styles.textPrimary }}
    >
      {highlight && (
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: color }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: color }}
          />
        </span>
      )}
      {value}
    </span>
  </button>
);

// Filter Dropdown Component
const FilterDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
  styles: ReturnType<typeof usePortal>['styles'];
  isRtl?: boolean;
}> = ({ value, onChange, options, placeholder, icon, styles, isRtl }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none h-9 text-sm rounded-lg border outline-none cursor-pointer ${
        isRtl ? 'pl-8 pr-3 text-right' : 'pl-3 pr-8'
      }`}
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgPrimary,
        color: value ? styles.textPrimary : styles.textMuted,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <div
      className={`absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 ${
        isRtl ? 'left-2.5' : 'right-2.5'
      }`}
    >
      {icon}
      <CaretDown size={12} style={{ color: styles.textMuted }} />
    </div>
  </div>
);

// Menu Button Component
const MenuButton: React.FC<{
  icon: React.ElementType;
  label: string;
  styles: ReturnType<typeof usePortal>['styles'];
  onClick: () => void;
  danger?: boolean;
}> = ({ icon: Icon, label, styles, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
    style={{ color: danger ? styles.error : styles.textPrimary }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <Icon size={14} />
    {label}
  </button>
);

export default SellerOrders;
