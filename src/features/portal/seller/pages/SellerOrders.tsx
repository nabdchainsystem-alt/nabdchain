import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { marketplaceOrderService } from '../../services/marketplaceOrderService';
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
  Warning,
  Heartbeat,
  Clock,
  ShieldCheck,
  WarningCircle,
  Lightning,
  Spinner,
  Gear,
  ProhibitInset,
  LockSimple,
} from 'phosphor-react';
import { Button, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import {
  MarketplaceOrder as Order,
  MarketplaceOrderStatus as OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  getOrderStatusConfig,
  canSellerPerformAction,
} from '../../types/item.types';
import {
  OrderHealthStatus,
  ExceptionType,
  getPaymentStatusConfig,
  getHealthStatusConfig,
  getExceptionTypeLabel,
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

// Health statuses and exception types for demo
const healthStatuses: OrderHealthStatus[] = ['on_track', 'at_risk', 'delayed', 'critical'];
const exceptionTypes: ExceptionType[] = ['late_confirmation', 'shipping_delay', 'payment_overdue'];

// =============================================================================
// Stage 5: Helper functions for action availability
// =============================================================================

const canConfirmOrder = (order: Order): boolean => {
  return order.status === 'pending_confirmation';
};

const canRejectOrder = (order: Order): boolean => {
  return order.status === 'pending_confirmation';
};

const canStartProcessing = (order: Order): boolean => {
  return order.status === 'confirmed';
};

const canShipOrder = (order: Order): boolean => {
  return order.status === 'confirmed' || order.status === 'processing';
};

const canMarkDelivered = (order: Order): boolean => {
  return order.status === 'shipped';
};

const canCloseOrder = (order: Order): boolean => {
  return order.status === 'delivered';
};

const canCancelOrder = (order: Order): boolean => {
  return ['pending_confirmation', 'confirmed', 'processing'].includes(order.status);
};

// Generate sample orders for demonstration
const generateSampleOrders = (): Order[] => {
  const statuses: OrderStatus[] = ['pending_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'closed', 'cancelled'];
  const paymentStatuses: PaymentStatus[] = ['unpaid', 'authorized', 'paid'];
  const fulfillmentStatuses: FulfillmentStatus[] = ['not_started', 'picking', 'packing', 'ready_to_ship', 'shipped', 'delivered'];
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

    // Determine health status based on order status
    let healthStatus: OrderHealthStatus = 'on_track';
    let healthScore = 100;
    let hasException = false;
    let exceptionType: ExceptionType | undefined;
    let exceptionMessage: string | undefined;

    if (status === 'pending_confirmation' && daysAgo > 2) {
      healthStatus = 'at_risk';
      healthScore = 70;
      hasException = true;
      exceptionType = 'late_confirmation';
      exceptionMessage = 'Order awaiting confirmation for over 48 hours';
    } else if (status === 'confirmed' && daysAgo > 5) {
      healthStatus = 'delayed';
      healthScore = 40;
      hasException = true;
      exceptionType = 'shipping_delay';
      exceptionMessage = 'Order not shipped within expected timeframe';
    } else if (i % 7 === 0 && !['delivered', 'closed', 'cancelled'].includes(status)) {
      healthStatus = 'critical';
      healthScore = 20;
      hasException = true;
      exceptionType = exceptionTypes[i % exceptionTypes.length];
      exceptionMessage = 'Urgent attention required';
    } else if (i % 4 === 0 && !['delivered', 'closed', 'cancelled'].includes(status)) {
      healthStatus = 'at_risk';
      healthScore = 60;
    }

    // Completed orders are always on_track
    if (['delivered', 'closed', 'cancelled'].includes(status)) {
      healthStatus = 'on_track';
      healthScore = 100;
      hasException = false;
      exceptionType = undefined;
      exceptionMessage = undefined;
    }

    return {
      id: `order-${1000 + i}`,
      orderNumber: `ORD-${2024}-${String(1000 + i).padStart(4, '0')}`,
      buyerId: `buyer-${i}`,
      sellerId: 'current-seller',
      quoteId: `quote-${i}`,
      rfqId: i % 3 === 0 ? `rfq-${i}` : undefined,
      itemId: `item-${i}`,
      quantity,
      unitPrice: item.price,
      totalPrice: item.price * quantity,
      currency: 'SAR',
      status,
      paymentStatus: status === 'delivered' || status === 'closed' ? 'paid' : paymentStatuses[i % paymentStatuses.length],
      fulfillmentStatus: ['delivered', 'closed'].includes(status) ? 'delivered' : fulfillmentStatuses[Math.min(statuses.indexOf(status), fulfillmentStatuses.length - 1)],
      source: i % 3 === 0 ? 'rfq' : 'direct',
      createdAt,
      confirmedAt: ['confirmed', 'processing', 'shipped', 'delivered', 'closed'].includes(status) ? createdAt : undefined,
      processingAt: ['processing', 'shipped', 'delivered', 'closed'].includes(status) ? createdAt : undefined,
      shippedAt: ['shipped', 'delivered', 'closed'].includes(status) ? createdAt : undefined,
      deliveredAt: ['delivered', 'closed'].includes(status) ? createdAt : undefined,
      closedAt: status === 'closed' ? createdAt : undefined,
      updatedAt: createdAt,
      // Seller/Buyer metadata for display
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerCompany: buyer.company,
      itemName: item.name,
      itemSku: item.sku,
      rfqNumber: i % 3 === 0 ? `RFQ-${2024}-${String(100 + i).padStart(4, '0')}` : undefined,
      // Health fields (for UI display)
      healthStatus,
      healthScore,
      hasException,
      exceptionType,
      exceptionMessage,
    } as Order & { buyerName: string; buyerEmail?: string; buyerCompany?: string; itemName: string; itemSku: string; rfqNumber?: string; healthStatus: OrderHealthStatus; healthScore: number; hasException: boolean; exceptionType?: ExceptionType; exceptionMessage?: string };
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
  const [healthFilter, setHealthFilter] = useState<OrderHealthStatus | ''>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showExceptionsBanner, setShowExceptionsBanner] = useState(true);

  // Panel states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  // Stage 5: Dialog states
  const [rejectDialogOrder, setRejectDialogOrder] = useState<Order | null>(null);
  const [shipDialogOrder, setShipDialogOrder] = useState<Order | null>(null);
  const [cancelDialogOrder, setCancelDialogOrder] = useState<Order | null>(null);
  const [confirmDialogOrder, setConfirmDialogOrder] = useState<Order | null>(null);
  const [processingDialogOrder, setProcessingDialogOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [shipTrackingNumber, setShipTrackingNumber] = useState('');
  const [shipCarrier, setShipCarrier] = useState('');
  const [shipEstimatedDelivery, setShipEstimatedDelivery] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

      const response = await marketplaceOrderService.getSellerOrders(token);
      // Map the response to include display fields
      const ordersWithDisplay = response.orders.map((order: Order) => ({
        ...order,
        buyerName: (order as any).buyer?.name || 'Unknown Buyer',
        buyerEmail: (order as any).buyer?.email,
        buyerCompany: (order as any).buyer?.company,
        itemName: (order as any).item?.name || (order as any).quote?.rfq?.item?.name || 'Item',
        itemSku: (order as any).item?.sku || (order as any).quote?.rfq?.item?.sku || '',
        rfqNumber: (order as any).rfq?.rfqNumber,
        // Default health fields if not present
        healthStatus: 'on_track' as OrderHealthStatus,
        healthScore: 100,
        hasException: false,
      }));
      setOrders(ordersWithDisplay);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
      // Fall back to sample data for demo
      setOrders(generateSampleOrders() as any);
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
      result = result.filter((o) => o.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter) {
      result = result.filter((o) => o.paymentStatus === paymentFilter);
    }

    // Health filter
    if (healthFilter) {
      result = result.filter((o) => o.healthStatus === healthFilter);
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
  }, [orders, searchQuery, statusFilter, paymentFilter, healthFilter, sortOption]);

  // Stats for quick filters
  const stats = useMemo(() => {
    const pendingConfirmation = orders.filter((o) => o.status === 'pending_confirmation').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed').length;
    const processing = orders.filter((o) => o.status === 'processing').length;
    const shipped = orders.filter((o) => o.status === 'shipped').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const closed = orders.filter((o) => o.status === 'closed').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const totalRevenue = orders
      .filter((o) => ['delivered', 'closed'].includes(o.status) && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Health stats
    const onTrack = orders.filter((o) => (o as any).healthStatus === 'on_track').length;
    const atRisk = orders.filter((o) => (o as any).healthStatus === 'at_risk').length;
    const delayed = orders.filter((o) => (o as any).healthStatus === 'delayed').length;
    const critical = orders.filter((o) => (o as any).healthStatus === 'critical').length;
    const withExceptions = orders.filter((o) => (o as any).hasException).length;

    return {
      total: orders.length,
      pendingConfirmation,
      confirmed,
      processing,
      shipped,
      delivered,
      closed,
      cancelled,
      totalRevenue,
      // Health
      onTrack,
      atRisk,
      delayed,
      critical,
      withExceptions,
    };
  }, [orders]);

  // Get orders with active exceptions for the banner
  const ordersWithExceptions = useMemo(() =>
    orders.filter((o) => o.hasException && o.exceptionMessage),
  [orders]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || statusFilter || paymentFilter || healthFilter;

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPaymentFilter('');
    setHealthFilter('');
  };

  // ==========================================================================
  // Stage 5: Order Fulfillment Actions
  // ==========================================================================

  // Confirm order (pending_confirmation -> confirmed)
  const handleConfirmOrder = async (order: Order) => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await marketplaceOrderService.confirmOrder(token, order.id);
      if (updated) {
        updateOrderInState({ ...order, ...updated, status: 'confirmed', confirmedAt: new Date().toISOString() } as any);
      }
    } catch (err) {
      console.error('Failed to confirm order:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to confirm order');
      // Optimistic update fallback
      updateOrderInState({
        ...order,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Reject order (pending_confirmation -> cancelled with reason)
  const handleRejectOrder = async () => {
    if (!rejectDialogOrder || !rejectReason.trim()) return;

    setIsActionLoading(true);
    setActionError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await marketplaceOrderService.rejectOrder(token, rejectDialogOrder.id, {
        reason: rejectReason.trim(),
      });
      updateOrderInState({ ...rejectDialogOrder, ...updated, status: 'cancelled', rejectionReason: rejectReason } as any);
      setRejectDialogOrder(null);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to reject order:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to reject order');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Start processing (confirmed -> processing)
  const handleStartProcessing = async (order: Order) => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await marketplaceOrderService.startProcessing(token, order.id, {
        sellerNotes: 'Order processing started',
      });
      updateOrderInState({ ...order, ...updated, status: 'processing', processingAt: new Date().toISOString() } as any);
    } catch (err) {
      console.error('Failed to start processing:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to start processing');
      // Optimistic update fallback
      updateOrderInState({
        ...order,
        status: 'processing',
        processingAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Ship order (processing -> shipped)
  const handleShipOrder = async () => {
    if (!shipDialogOrder || !shipTrackingNumber.trim()) return;

    setIsActionLoading(true);
    setActionError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await marketplaceOrderService.shipOrder(token, shipDialogOrder.id, {
        trackingNumber: shipTrackingNumber.trim(),
        carrier: shipCarrier.trim() || undefined,
        estimatedDelivery: shipEstimatedDelivery || undefined,
      });
      updateOrderInState({ ...shipDialogOrder, ...updated, status: 'shipped', shippedAt: new Date().toISOString() } as any);
      setShipDialogOrder(null);
      setShipTrackingNumber('');
      setShipCarrier('');
      setShipEstimatedDelivery('');
    } catch (err) {
      console.error('Failed to ship order:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to ship order');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Mark delivered (shipped -> delivered) - Usually buyer action, but seller can also trigger
  const handleMarkDelivered = async (order: Order) => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await marketplaceOrderService.markDelivered(token, order.id, {});
      updateOrderInState({ ...order, ...updated, status: 'delivered', deliveredAt: new Date().toISOString() } as any);
    } catch (err) {
      console.error('Failed to mark order delivered:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to mark delivered');
      // Optimistic update fallback
      updateOrderInState({
        ...order,
        status: 'delivered',
        fulfillmentStatus: 'delivered',
        paymentStatus: 'paid',
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Close order (delivered -> closed)
  const handleCloseOrder = async (order: Order) => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await marketplaceOrderService.closeOrder(token, order.id);
      updateOrderInState({ ...order, ...updated, status: 'closed', closedAt: new Date().toISOString() } as any);
    } catch (err) {
      console.error('Failed to close order:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to close order');
      // Optimistic update fallback
      updateOrderInState({
        ...order,
        status: 'closed',
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cancel order (before shipping)
  const handleCancelOrder = async () => {
    if (!cancelDialogOrder || !cancelReason.trim()) return;

    setIsActionLoading(true);
    setActionError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await marketplaceOrderService.cancelOrder(token, cancelDialogOrder.id, {
        reason: cancelReason.trim(),
      });
      updateOrderInState({ ...cancelDialogOrder, ...updated, status: 'cancelled', cancelledAt: new Date().toISOString() } as any);
      setCancelDialogOrder(null);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setIsActionLoading(false);
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
      columnHelper.accessor('healthStatus', {
        meta: { align: 'center' as const },
        header: t('seller.orders.health'),
        cell: ({ row }) => {
          const order = row.original;
          const healthStatus = order.healthStatus || 'on_track';
          const config = getHealthStatusConfig(healthStatus);

          const IconComponent = healthStatus === 'on_track' ? ShieldCheck :
                               healthStatus === 'at_risk' ? Clock :
                               healthStatus === 'delayed' ? Warning :
                               WarningCircle;

          return (
            <div className="flex flex-col items-center gap-0.5">
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded"
                style={{
                  backgroundColor: config.bgColor,
                  color: config.color,
                }}
              >
                <IconComponent size={12} weight="bold" />
                <span className="text-[10px] font-semibold uppercase">
                  {t(config.labelKey)}
                </span>
              </div>
              {order.hasException && (
                <span
                  className="text-[9px] font-medium px-1 rounded"
                  style={{ backgroundColor: `${styles.error}20`, color: styles.error }}
                >
                  {t('seller.orders.exception')}
                </span>
              )}
            </div>
          );
        },
        size: 100,
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
              {/* Confirm Order - pending_confirmation -> confirmed */}
              {canConfirmOrder(order) && (
                <button
                  onClick={() => setConfirmDialogOrder(order)}
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
              {/* Reject Order - pending_confirmation -> cancelled (with reason) */}
              {canRejectOrder(order) && (
                <button
                  onClick={() => setRejectDialogOrder(order)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: styles.error }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={t('seller.orders.rejectOrder')}
                >
                  <ProhibitInset size={16} />
                </button>
              )}
              {/* Start Processing - confirmed -> processing */}
              {canStartProcessing(order) && (
                <button
                  onClick={() => setProcessingDialogOrder(order)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: '#8B5CF6' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={t('seller.orders.startProcessing')}
                >
                  <Gear size={16} />
                </button>
              )}
              {/* Ship Order - processing/confirmed -> shipped */}
              {canShipOrder(order) && (
                <button
                  onClick={() => setShipDialogOrder(order)}
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
              {/* Mark Delivered - shipped -> delivered */}
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
              {/* Close Order - delivered -> closed */}
              {canCloseOrder(order) && (
                <button
                  onClick={() => handleCloseOrder(order)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: styles.textMuted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={t('seller.orders.closeOrder')}
                >
                  <LockSimple size={16} />
                </button>
              )}
              {/* Cancel Order - before shipping */}
              {canCancelOrder(order) && (
                <button
                  onClick={() => setCancelDialogOrder(order)}
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
              {/* View Details */}
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
        size: 180,
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
        <div className={`flex items-center gap-4 mb-6 overflow-x-auto pb-2 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
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
            color={styles.info}
            isActive={statusFilter === 'confirmed'}
            onClick={() => setStatusFilter('confirmed')}
            styles={styles}
          />
          <QuickFilterTab
            label={t('seller.orders.processing')}
            value={stats.processing}
            color="#8B5CF6"
            isActive={statusFilter === 'processing'}
            onClick={() => setStatusFilter('processing')}
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
            value={stats.delivered}
            color={styles.success}
            isActive={statusFilter === 'delivered'}
            onClick={() => setStatusFilter('delivered')}
            styles={styles}
          />
          <QuickFilterTab
            label={t('seller.orders.closed')}
            value={stats.closed}
            color={styles.textMuted}
            isActive={statusFilter === 'closed'}
            onClick={() => setStatusFilter('closed')}
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

        {/* Health Summary */}
        <div
          className="rounded-xl border p-4 mb-4"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heartbeat size={18} weight="duotone" style={{ color: styles.textPrimary }} />
              <span className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                {t('seller.orders.healthSummary')}
              </span>
            </div>
            {stats.withExceptions > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${styles.error}15`, color: styles.error }}
              >
                <Lightning size={12} weight="fill" />
                {stats.withExceptions} {t('seller.orders.activeExceptions')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            <HealthStatCard
              label={t('seller.orders.onTrack')}
              value={stats.onTrack}
              color={styles.success}
              icon={ShieldCheck}
              isActive={healthFilter === 'on_track'}
              onClick={() => setHealthFilter(healthFilter === 'on_track' ? '' : 'on_track')}
              styles={styles}
            />
            <HealthStatCard
              label={t('seller.orders.atRisk')}
              value={stats.atRisk}
              color={styles.warning}
              icon={Clock}
              isActive={healthFilter === 'at_risk'}
              onClick={() => setHealthFilter(healthFilter === 'at_risk' ? '' : 'at_risk')}
              styles={styles}
            />
            <HealthStatCard
              label={t('seller.orders.delayed')}
              value={stats.delayed}
              color="#F59E0B"
              icon={Warning}
              isActive={healthFilter === 'delayed'}
              onClick={() => setHealthFilter(healthFilter === 'delayed' ? '' : 'delayed')}
              styles={styles}
            />
            <HealthStatCard
              label={t('seller.orders.critical')}
              value={stats.critical}
              color={styles.error}
              icon={WarningCircle}
              isActive={healthFilter === 'critical'}
              onClick={() => setHealthFilter(healthFilter === 'critical' ? '' : 'critical')}
              styles={styles}
            />
          </div>
        </div>

        {/* Exception Alert Banner */}
        {showExceptionsBanner && ordersWithExceptions.length > 0 && (
          <div
            className="rounded-xl border p-4 mb-4"
            style={{
              backgroundColor: `${styles.error}08`,
              borderColor: `${styles.error}30`,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${styles.error}15` }}
                >
                  <Warning size={20} weight="fill" style={{ color: styles.error }} />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: styles.error }}>
                    {t('seller.orders.exceptionsAlert')}
                  </p>
                  <div className="space-y-1">
                    {ordersWithExceptions.slice(0, 3).map((order) => (
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
                          {t('common.view')}
                        </button>
                      </div>
                    ))}
                    {ordersWithExceptions.length > 3 && (
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        +{ordersWithExceptions.length - 3} {t('seller.orders.moreExceptions')}
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
                        {/* Ship and Cancel disabled for bulk actions - require individual tracking/reason */}
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
                  { value: 'processing', label: t('seller.orders.processing') },
                  { value: 'shipped', label: t('seller.orders.shipped') },
                  { value: 'delivered', label: t('seller.orders.delivered') },
                  { value: 'closed', label: t('seller.orders.closed') },
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
        onShip={(order) => setShipDialogOrder(order)}
        onMarkDelivered={handleMarkDelivered}
        onCancel={(order) => setCancelDialogOrder(order)}
      />

      {/* ========================================================================== */}
      {/* Stage 5: Reject Order Dialog */}
      {/* ========================================================================== */}
      {rejectDialogOrder && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              setRejectDialogOrder(null);
              setRejectReason('');
              setActionError(null);
            }}
          />
          <div
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: styles.bgPrimary }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: styles.borderLight }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${styles.error}15` }}>
                  <ProhibitInset size={20} weight="fill" style={{ color: styles.error }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                    {t('seller.orders.rejectOrder')}
                  </h2>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {(rejectDialogOrder as any).orderNumber || rejectDialogOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setRejectDialogOrder(null);
                  setRejectReason('');
                  setActionError(null);
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: styles.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                {t('seller.orders.rejectReasonPrompt')}
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border transition-colors resize-none"
                style={{
                  backgroundColor: styles.bgSecondary,
                  borderColor: styles.borderLight,
                  color: styles.textPrimary,
                }}
                placeholder={t('seller.orders.rejectReasonPlaceholder')}
              />
              {actionError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: `${styles.error}15` }}
                >
                  <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
                  <span className="text-sm" style={{ color: styles.error }}>
                    {actionError}
                  </span>
                </div>
              )}
            </div>

            <div
              className="flex gap-3 px-6 py-4 border-t"
              style={{ borderColor: styles.borderLight }}
            >
              <button
                onClick={() => {
                  setRejectDialogOrder(null);
                  setRejectReason('');
                  setActionError(null);
                }}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={isActionLoading || !rejectReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: styles.error, color: '#fff' }}
              >
                {isActionLoading ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <ProhibitInset size={20} weight="fill" />
                )}
                {isActionLoading ? t('common.processing') : t('seller.orders.rejectOrder')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================== */}
      {/* Stage 5: Ship Order Dialog */}
      {/* ========================================================================== */}
      {shipDialogOrder && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              setShipDialogOrder(null);
              setShipTrackingNumber('');
              setShipCarrier('');
              setShipEstimatedDelivery('');
              setActionError(null);
            }}
          />
          <div
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: styles.bgPrimary }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: styles.borderLight }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${styles.info}15` }}>
                  <Truck size={20} weight="fill" style={{ color: styles.info }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                    {t('seller.orders.shipOrder')}
                  </h2>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {(shipDialogOrder as any).orderNumber || shipDialogOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShipDialogOrder(null);
                  setShipTrackingNumber('');
                  setShipCarrier('');
                  setShipEstimatedDelivery('');
                  setActionError(null);
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: styles.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                  {t('seller.orders.trackingNumber')} *
                </label>
                <input
                  type="text"
                  value={shipTrackingNumber}
                  onChange={(e) => setShipTrackingNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: styles.borderLight,
                    color: styles.textPrimary,
                  }}
                  placeholder={t('seller.orders.trackingNumberPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                  {t('seller.orders.carrier')}
                </label>
                <input
                  type="text"
                  value={shipCarrier}
                  onChange={(e) => setShipCarrier(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: styles.borderLight,
                    color: styles.textPrimary,
                  }}
                  placeholder={t('seller.orders.carrierPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                  {t('seller.orders.estimatedDelivery')}
                </label>
                <input
                  type="date"
                  value={shipEstimatedDelivery}
                  onChange={(e) => setShipEstimatedDelivery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: styles.borderLight,
                    color: styles.textPrimary,
                  }}
                />
              </div>
              {actionError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: `${styles.error}15` }}
                >
                  <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
                  <span className="text-sm" style={{ color: styles.error }}>
                    {actionError}
                  </span>
                </div>
              )}
            </div>

            <div
              className="flex gap-3 px-6 py-4 border-t"
              style={{ borderColor: styles.borderLight }}
            >
              <button
                onClick={() => {
                  setShipDialogOrder(null);
                  setShipTrackingNumber('');
                  setShipCarrier('');
                  setShipEstimatedDelivery('');
                  setActionError(null);
                }}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleShipOrder}
                disabled={isActionLoading || !shipTrackingNumber.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: styles.info, color: '#fff' }}
              >
                {isActionLoading ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <Truck size={20} weight="fill" />
                )}
                {isActionLoading ? t('common.processing') : t('seller.orders.shipOrder')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================== */}
      {/* Stage 5: Cancel Order Dialog */}
      {/* ========================================================================== */}
      {cancelDialogOrder && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              setCancelDialogOrder(null);
              setCancelReason('');
              setActionError(null);
            }}
          />
          <div
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: styles.bgPrimary }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: styles.borderLight }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${styles.error}15` }}>
                  <XCircle size={20} weight="fill" style={{ color: styles.error }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                    {t('seller.orders.cancelOrder')}
                  </h2>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {(cancelDialogOrder as any).orderNumber || cancelDialogOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCancelDialogOrder(null);
                  setCancelReason('');
                  setActionError(null);
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: styles.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                {t('seller.orders.cancelReasonPrompt')}
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border transition-colors resize-none"
                style={{
                  backgroundColor: styles.bgSecondary,
                  borderColor: styles.borderLight,
                  color: styles.textPrimary,
                }}
                placeholder={t('seller.orders.cancelReasonPlaceholder')}
              />
              {actionError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: `${styles.error}15` }}
                >
                  <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
                  <span className="text-sm" style={{ color: styles.error }}>
                    {actionError}
                  </span>
                </div>
              )}
            </div>

            <div
              className="flex gap-3 px-6 py-4 border-t"
              style={{ borderColor: styles.borderLight }}
            >
              <button
                onClick={() => {
                  setCancelDialogOrder(null);
                  setCancelReason('');
                  setActionError(null);
                }}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                {t('common.back')}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isActionLoading || !cancelReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: styles.error, color: '#fff' }}
              >
                {isActionLoading ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <XCircle size={20} weight="fill" />
                )}
                {isActionLoading ? t('common.processing') : t('seller.orders.cancelOrder')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================== */}
      {/* Confirm Order Dialog - Stage 8 Hardening */}
      {/* ========================================================================== */}
      {confirmDialogOrder && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              setConfirmDialogOrder(null);
              setActionError(null);
            }}
          />
          <div
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: styles.bgPrimary }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: styles.borderLight }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${styles.success}15` }}>
                  <CheckCircle size={20} weight="fill" style={{ color: styles.success }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                    Confirm this order?
                  </h2>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {(confirmDialogOrder as any).orderNumber || confirmDialogOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setConfirmDialogOrder(null);
                  setActionError(null);
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: styles.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                By confirming, you commit to preparing and shipping this order within the agreed timeframe.
              </p>
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: styles.borderLight, backgroundColor: styles.bgSecondary }}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: styles.textMuted }}>Item</span>
                  <span style={{ color: styles.textPrimary }}>{(confirmDialogOrder as any).itemName || 'Order Item'}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: styles.textMuted }}>Quantity</span>
                  <span style={{ color: styles.textPrimary }}>{confirmDialogOrder.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: styles.textMuted }}>Total</span>
                  <span style={{ color: styles.textPrimary, fontWeight: 600 }}>
                    {confirmDialogOrder.totalPrice?.toLocaleString()} {confirmDialogOrder.currency || 'SAR'}
                  </span>
                </div>
              </div>
              {actionError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: `${styles.error}15` }}
                >
                  <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
                  <span className="text-sm" style={{ color: styles.error }}>
                    {actionError}
                  </span>
                </div>
              )}
            </div>

            <div
              className="flex gap-3 px-6 py-4 border-t"
              style={{ borderColor: styles.borderLight }}
            >
              <button
                onClick={() => {
                  setConfirmDialogOrder(null);
                  setActionError(null);
                }}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleConfirmOrder(confirmDialogOrder);
                  setConfirmDialogOrder(null);
                }}
                disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: styles.success, color: '#fff' }}
              >
                {isActionLoading ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <CheckCircle size={20} weight="fill" />
                )}
                {isActionLoading ? 'Confirming...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================== */}
      {/* Start Processing Dialog - Stage 8 Hardening */}
      {/* ========================================================================== */}
      {processingDialogOrder && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              setProcessingDialogOrder(null);
              setActionError(null);
            }}
          />
          <div
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: styles.bgPrimary }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: styles.borderLight }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#8B5CF615' }}>
                  <Gear size={20} weight="fill" style={{ color: '#8B5CF6' }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                    Start preparing this order?
                  </h2>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {(processingDialogOrder as any).orderNumber || processingDialogOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setProcessingDialogOrder(null);
                  setActionError(null);
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: styles.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                This marks the order as "Preparing" so the buyer knows you're working on it. You should begin picking and packing the items.
              </p>
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: styles.borderLight, backgroundColor: styles.bgSecondary }}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: styles.textMuted }}>Item</span>
                  <span style={{ color: styles.textPrimary }}>{(processingDialogOrder as any).itemName || 'Order Item'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: styles.textMuted }}>Quantity</span>
                  <span style={{ color: styles.textPrimary }}>{processingDialogOrder.quantity}</span>
                </div>
              </div>
              {actionError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: `${styles.error}15` }}
                >
                  <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
                  <span className="text-sm" style={{ color: styles.error }}>
                    {actionError}
                  </span>
                </div>
              )}
            </div>

            <div
              className="flex gap-3 px-6 py-4 border-t"
              style={{ borderColor: styles.borderLight }}
            >
              <button
                onClick={() => {
                  setProcessingDialogOrder(null);
                  setActionError(null);
                }}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleStartProcessing(processingDialogOrder);
                  setProcessingDialogOrder(null);
                }}
                disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
              >
                {isActionLoading ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <Gear size={20} weight="fill" />
                )}
                {isActionLoading ? 'Starting...' : 'Start Preparing'}
              </button>
            </div>
          </div>
        </>
      )}
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

// Health Stat Card Component
const HealthStatCard: React.FC<{
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, value, color, icon: Icon, isActive, onClick, styles }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-lg transition-all"
    style={{
      backgroundColor: isActive ? `${color}15` : styles.bgSecondary,
      border: isActive ? `2px solid ${color}` : '2px solid transparent',
    }}
  >
    <div
      className="p-2 rounded-lg"
      style={{ backgroundColor: `${color}15` }}
    >
      <Icon size={18} weight={isActive ? 'fill' : 'duotone'} style={{ color }} />
    </div>
    <div className="text-left">
      <p className="text-xl font-bold tabular-nums" style={{ color: styles.textPrimary }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: styles.textMuted }}>
        {label}
      </p>
    </div>
  </button>
);

export default SellerOrders;
