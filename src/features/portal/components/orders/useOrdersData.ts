// =============================================================================
// Unified Orders - Custom Data Hook
// =============================================================================

import { useState, useMemo, useEffect, useCallback } from 'react';
import { RowSelectionState } from '@tanstack/react-table';
import { marketplaceOrderService } from '../../services/marketplaceOrderService';
import { marketplacePaymentService } from '../../services/marketplacePaymentService';
import type { OrderHealthStatus } from '../../types/item.types';
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  OrderRole,
  SortOption,
  HealthFilterOption,
  OrderStats,
} from './orders.types';
import { calculateSLARemaining, getDeliveryStatus, needsActionToday, needsAttention } from './orders.utils';

interface UseOrdersDataOptions {
  role: OrderRole;
}

export function useOrdersData({ role }: UseOrdersDataOptions) {
  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [healthFilter, setHealthFilter] = useState<HealthFilterOption>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Selection (seller only)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Action state
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ==========================================================================
  // Fetch orders
  // ==========================================================================

  const fetchOrders = useCallback(async () => {
    try {
      let response;
      if (role === 'seller') {
        response = await marketplaceOrderService.getSellerOrders();
      } else {
        response = await marketplaceOrderService.getBuyerOrders({ limit: 100 });
      }

      const ordersWithDisplay = response.orders.map((order: Order) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API response has nested objects not on the Order type
        const raw = order as any;
        return {
          ...order,
          buyerName:
            raw.buyer?.companyName || raw.buyer?.name || raw.buyerCompanyName || order.buyerName || 'Unknown Buyer',
          buyerEmail: raw.buyer?.email || order.buyerEmail,
          buyerCompany: raw.buyer?.companyName || raw.buyer?.company || order.buyerCompany,
          sellerName: raw.seller?.name || raw.seller?.companyName || raw.sellerName || 'Seller',
          sellerCompany: raw.seller?.companyName || raw.sellerCompany || undefined,
          itemName: raw.item?.name || raw.quote?.rfq?.item?.name || order.itemName || 'Item',
          itemSku: raw.item?.sku || raw.quote?.rfq?.item?.sku || order.itemSku || '',
          itemImage: raw.item?.imageUrl || raw.quote?.rfq?.item?.imageUrl || order.itemImage,
          healthStatus: (order.healthStatus || 'on_track') as OrderHealthStatus,
          healthScore: order.healthScore ?? 100,
          hasException: order.hasException ?? false,
        };
      });

      setOrders(ordersWithDisplay);
      setError(null);
    } catch (err) {
      console.error(`[UnifiedOrders:${role}] Failed to fetch orders:`, err);
      setError('Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ==========================================================================
  // Update order in local state
  // ==========================================================================

  const updateOrderInState = useCallback((updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
  }, []);

  // ==========================================================================
  // Filtering & Sorting
  // ==========================================================================

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.buyerName || '').toLowerCase().includes(q) ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sellerName is set during fetch mapping
          ((o as any).sellerName || '').toLowerCase().includes(q) ||
          (o.itemName || '').toLowerCase().includes(q) ||
          (o.itemSku || '').toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (paymentFilter && role === 'seller') {
      result = result.filter((o) => o.paymentStatus === paymentFilter);
    }

    if (healthFilter) {
      if (healthFilter === 'needs_action' || healthFilter === 'needs_attention') {
        result = result.filter((o) => (role === 'seller' ? needsActionToday(o) : needsAttention(o)));
      } else {
        result = result.filter((o) => o.healthStatus === healthFilter);
      }
    }

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
        case 'sla_urgent': {
          const slaA = calculateSLARemaining(a);
          const slaB = calculateSLARemaining(b);
          if (!slaA && !slaB) return 0;
          if (!slaA) return 1;
          if (!slaB) return -1;
          return slaA.hours - slaB.hours;
        }
        case 'delivery_soon': {
          const dA = getDeliveryStatus(a);
          const dB = getDeliveryStatus(b);
          return (dA?.daysRemaining ?? 999) - (dB?.daysRemaining ?? 999);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchQuery, statusFilter, paymentFilter, healthFilter, sortOption, role]);

  // ==========================================================================
  // Stats
  // ==========================================================================

  const stats: OrderStats = useMemo(() => {
    const s: OrderStats = {
      total: orders.length,
      pendingConfirmation: orders.filter((o) => o.status === 'pending_confirmation').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      closed: orders.filter((o) => o.status === 'closed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter((o) => ['delivered', 'closed'].includes(o.status))
        .reduce((sum, o) => sum + o.totalPrice, 0),
      onTrack: orders.filter((o) => o.healthStatus === 'on_track').length,
      atRisk: orders.filter((o) => o.healthStatus === 'at_risk').length,
      delayed: orders.filter((o) => o.healthStatus === 'delayed').length,
      critical: orders.filter((o) => o.healthStatus === 'critical').length,
      withExceptions: orders.filter((o) => o.hasException).length,
      needsAction: orders.filter((o) => (role === 'seller' ? needsActionToday(o) : needsAttention(o))).length,
    };
    return s;
  }, [orders, role]);

  const ordersWithExceptions = useMemo(() => orders.filter((o) => o.hasException && o.exceptionMessage), [orders]);

  // ==========================================================================
  // Filters meta
  // ==========================================================================

  const hasActiveFilters = !!(searchQuery || statusFilter || paymentFilter || healthFilter);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('');
    setPaymentFilter('');
    setHealthFilter('');
  }, []);

  // ==========================================================================
  // Action Handlers
  // ==========================================================================

  const handleConfirmOrder = useCallback(
    async (order: Order) => {
      setIsActionLoading(true);
      setActionError(null);
      try {
        const updated = await marketplaceOrderService.confirmOrder(order.id);
        if (updated) {
          updateOrderInState({
            ...order,
            ...updated,
          } as Order);
        }
      } catch (err) {
        console.error('Failed to confirm order:', err);
        setActionError(err instanceof Error ? err.message : 'Failed to confirm order');
        fetchOrders();
      } finally {
        setIsActionLoading(false);
      }
    },
    [updateOrderInState, fetchOrders],
  );

  const handleStartProcessing = useCallback(
    async (order: Order) => {
      setIsActionLoading(true);
      setActionError(null);
      try {
        const updated = await marketplaceOrderService.startProcessing(order.id, {
          sellerNotes: 'Order processing started',
        });
        updateOrderInState({
          ...order,
          ...updated,
        } as Order);
      } catch (err) {
        console.error('Failed to start processing:', err);
        setActionError(err instanceof Error ? err.message : 'Failed to start processing');
        fetchOrders();
      } finally {
        setIsActionLoading(false);
      }
    },
    [updateOrderInState, fetchOrders],
  );

  const handleShipOrder = useCallback(
    async (order: Order, trackingNumber: string, carrier: string, estimatedDelivery?: string) => {
      setIsActionLoading(true);
      setActionError(null);
      try {
        const updated = await marketplaceOrderService.shipOrder(order.id, {
          trackingNumber,
          carrier: carrier || '',
          estimatedDelivery: estimatedDelivery || undefined,
        });
        updateOrderInState({ ...order, ...updated } as Order);
      } catch (err) {
        console.error('Failed to ship order:', err);
        setActionError(err instanceof Error ? err.message : 'Failed to ship order');
        fetchOrders();
      } finally {
        setIsActionLoading(false);
      }
    },
    [updateOrderInState, fetchOrders],
  );

  const handleMarkDelivered = useCallback(
    async (order: Order) => {
      setIsActionLoading(true);
      setActionError(null);
      try {
        const updated = await marketplaceOrderService.markDelivered(order.id, {});
        updateOrderInState({
          ...order,
          ...updated,
        } as Order);
      } catch (err) {
        console.error('Failed to mark delivered:', err);
        setActionError(err instanceof Error ? err.message : 'Failed to mark delivered');
        fetchOrders();
      } finally {
        setIsActionLoading(false);
      }
    },
    [updateOrderInState, fetchOrders],
  );

  const handleRejectOrder = useCallback(
    async (order: Order, reason: string) => {
      setIsActionLoading(true);
      setActionError(null);
      try {
        const updated = await marketplaceOrderService.rejectOrder(order.id, { reason });
        updateOrderInState({ ...order, ...updated } as Order);
      } catch (err) {
        console.error('Failed to reject order:', err);
        setActionError(err instanceof Error ? err.message : 'Failed to reject order');
        fetchOrders();
      } finally {
        setIsActionLoading(false);
      }
    },
    [updateOrderInState, fetchOrders],
  );

  const handleCancelOrder = useCallback(
    async (order: Order, reason: string) => {
      setIsActionLoading(true);
      setActionError(null);
      try {
        const updated = await marketplaceOrderService.cancelOrder(order.id, { reason });
        updateOrderInState({
          ...order,
          ...updated,
        } as Order);
      } catch (err) {
        console.error('Failed to cancel order:', err);
        setActionError(err instanceof Error ? err.message : 'Failed to cancel order');
        fetchOrders();
      } finally {
        setIsActionLoading(false);
      }
    },
    [updateOrderInState, fetchOrders],
  );

  const handleRecordPayment = useCallback(
    async (
      order: Order,
      data: { method: 'bank_transfer'; reference: string; amount?: number; bankName?: string; notes?: string },
    ) => {
      setIsActionLoading(true);
      setActionError(null);
      try {
        await marketplacePaymentService.recordOrderPayment(order.id, data);
        // Refetch to get updated paymentStatus
        await fetchOrders();
      } catch (err) {
        console.error('Failed to record payment:', err);
        setActionError(err instanceof Error ? err.message : 'Failed to record payment');
        throw err; // Let the modal know it failed
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchOrders],
  );

  const handleConfirmCOD = useCallback(
    async (order: Order, notes?: string) => {
      setIsActionLoading(true);
      setActionError(null);
      try {
        await marketplacePaymentService.confirmCODPayment(order.id, { notes });
        await fetchOrders();
      } catch (err) {
        console.error('Failed to confirm COD payment:', err);
        setActionError(err instanceof Error ? err.message : 'Failed to confirm COD payment');
        throw err;
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchOrders],
  );

  return {
    // Data
    orders,
    filteredOrders,
    stats,
    ordersWithExceptions,
    isLoading,
    error,
    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    healthFilter,
    setHealthFilter,
    sortOption,
    setSortOption,
    hasActiveFilters,
    clearAllFilters,
    // Selection
    rowSelection,
    setRowSelection,
    // Actions
    isActionLoading,
    actionError,
    setActionError,
    handleConfirmOrder,
    handleStartProcessing,
    handleShipOrder,
    handleMarkDelivered,
    handleRejectOrder,
    handleCancelOrder,
    handleRecordPayment,
    handleConfirmCOD,
    updateOrderInState,
    refreshOrders: fetchOrders,
  };
}
