// =============================================================================
// Order Service - Marketplace Orders Business Logic
// =============================================================================

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { apiLogger } from '../utils/logger';
import { automationRulesService } from './automationRulesService';

// =============================================================================
// Types
// =============================================================================

export type OrderStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'in_progress'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'authorized' | 'paid' | 'refunded';
export type FulfillmentStatus = 'not_started' | 'packing' | 'out_for_delivery' | 'delivered';
export type OrderSource = 'rfq' | 'direct_buy';

export type AuditAction =
  | 'created'
  | 'confirmed'
  | 'status_changed'
  | 'payment_updated'
  | 'fulfillment_updated'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'note_added'
  | 'tracking_added';

export interface ShippingAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export interface CreateOrderInput {
  itemId: string;
  quantity: number;
  unitPrice: number;
  shippingAddress?: ShippingAddress;
  buyerNotes?: string;
  source?: OrderSource;
  rfqId?: string;
  rfqNumber?: string;
}

export interface CreateOrderFromRFQInput {
  rfqId: string;
  sellerNotes?: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  sellerNotes?: string;
  internalNotes?: string;
}

export interface ShipOrderInput {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: string;
  sellerNotes?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  source?: OrderSource;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  buyerId?: string;
}

// =============================================================================
// Status Transitions
// =============================================================================

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['shipped', 'cancelled'],
  shipped: ['delivered', 'failed'],
  delivered: ['refunded'],
  cancelled: [],
  failed: ['refunded'],
  refunded: [],
};

export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

export function canConfirmOrder(status: OrderStatus): boolean {
  return status === 'pending_confirmation';
}

export function canShipOrder(status: OrderStatus): boolean {
  return status === 'confirmed' || status === 'in_progress';
}

export function canCancelOrder(status: OrderStatus): boolean {
  return ['pending_confirmation', 'confirmed', 'in_progress'].includes(status);
}

export function canMarkDelivered(status: OrderStatus): boolean {
  return status === 'shipped';
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return ['cancelled', 'failed', 'refunded', 'delivered'].includes(status);
}

// =============================================================================
// Empty Stats (returned on error instead of mock data)
// =============================================================================

const EMPTY_ORDER_STATS = {
  total: 0,
  pendingConfirmation: 0,
  confirmed: 0,
  inProgress: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  totalRevenue: 0,
  currency: 'SAR',
};

// =============================================================================
// Order Number Generator
// =============================================================================

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Get the last order number for this year
  const lastOrder = await prisma.marketplaceOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  let nextNumber = 1;
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

// =============================================================================
// Order Service
// =============================================================================

export const orderService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all orders for a seller with optional filters
   */
  async getSellerOrders(sellerId: string, filters: OrderFilters = {}) {
    try {
      const where: Prisma.MarketplaceOrderWhereInput = { sellerId };

      if (filters.status) where.status = filters.status;
      if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
      if (filters.fulfillmentStatus) where.fulfillmentStatus = filters.fulfillmentStatus;
      if (filters.source) where.source = filters.source;
      if (filters.buyerId) where.buyerId = filters.buyerId;

      if (filters.search) {
        where.OR = [
          { orderNumber: { contains: filters.search, mode: 'insensitive' } },
          { buyerName: { contains: filters.search, mode: 'insensitive' } },
          { buyerCompany: { contains: filters.search, mode: 'insensitive' } },
          { itemName: { contains: filters.search, mode: 'insensitive' } },
          { itemSku: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      const orders = await prisma.marketplaceOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          lineItems: { orderBy: { position: 'asc' } },
          invoice: {
            select: { id: true, status: true, invoiceNumber: true, totalAmount: true },
          },
        },
      });

      // Get audit logs for each order
      const orderIds = orders.map((o) => o.id);
      const auditLogs = await prisma.marketplaceOrderAudit.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { createdAt: 'asc' },
      });

      // Map audit logs to orders
      const auditMap = new Map<string, typeof auditLogs>();
      auditLogs.forEach((log) => {
        if (!auditMap.has(log.orderId)) auditMap.set(log.orderId, []);
        auditMap.get(log.orderId)!.push(log);
      });

      const result = orders.map((order) => ({
        ...order,
        shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
        auditLog: auditMap.get(order.id) || [],
        invoiceId: order.invoice?.id || null,
        invoiceStatus: order.invoice?.status || null,
        invoiceNumber: order.invoice?.invoiceNumber || null,
      }));

      // Return actual data (empty array if no orders - production mode)
      return result;
    } catch (error) {
      apiLogger.error('Error fetching seller orders:', error);
      return []; // Return empty array on error - frontend handles empty state
    }
  },

  /**
   * Get single order for seller
   */
  async getSellerOrder(sellerId: string, orderId: string) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId },
      include: {
        lineItems: { orderBy: { position: 'asc' } },
        invoice: {
          select: { id: true, status: true, invoiceNumber: true, totalAmount: true },
        },
      },
    });

    if (!order) return null;

    const auditLog = await prisma.marketplaceOrderAudit.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      ...order,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
      auditLog,
      invoiceId: order.invoice?.id || null,
      invoiceStatus: order.invoice?.status || null,
      invoiceNumber: order.invoice?.invoiceNumber || null,
    };
  },

  /**
   * Create order from direct buy
   */
  async createOrder(buyerId: string, buyerInfo: { name: string; email?: string; company?: string }, data: CreateOrderInput) {
    const item = await prisma.item.findFirst({
      where: { id: data.itemId, status: 'active' },
    });

    if (!item) {
      throw new Error('Item not found or not available');
    }

    const orderNumber = await generateOrderNumber();
    const totalPrice = data.quantity * data.unitPrice;

    const order = await prisma.marketplaceOrder.create({
      data: {
        orderNumber,
        buyerId,
        sellerId: item.userId,
        itemId: data.itemId,
        itemName: item.name,
        itemSku: item.sku,
        itemImage: item.images ? JSON.parse(item.images)[0] : null,
        rfqId: data.rfqId,
        rfqNumber: data.rfqNumber,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice,
        currency: item.currency,
        status: 'pending_confirmation',
        paymentStatus: 'unpaid',
        fulfillmentStatus: 'not_started',
        source: data.source || 'direct_buy',
        shippingAddress: data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
        buyerNotes: data.buyerNotes,
        buyerName: buyerInfo.name,
        buyerEmail: buyerInfo.email,
        buyerCompany: buyerInfo.company,
      },
    });

    // Create audit log
    await prisma.marketplaceOrderAudit.create({
      data: {
        orderId: order.id,
        action: 'created',
        actor: 'buyer',
        actorId: buyerId,
      },
    });

    return {
      ...order,
      shippingAddress: data.shippingAddress,
      auditLog: [],
    };
  },

  /**
   * Confirm order (seller)
   */
  async confirmOrder(sellerId: string, orderId: string) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId },
    });

    if (!order) throw new Error('Order not found');
    if (!canConfirmOrder(order.status as OrderStatus)) {
      throw new Error('Order cannot be confirmed in current state');
    }

    const updated = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    await prisma.marketplaceOrderAudit.create({
      data: {
        orderId,
        action: 'confirmed',
        actor: 'seller',
        actorId: sellerId,
        previousValue: order.status,
        newValue: 'confirmed',
      },
    });

    return updated;
  },

  /**
   * Update order status (seller)
   */
  async updateOrderStatus(sellerId: string, orderId: string, newStatus: OrderStatus) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId },
    });

    if (!order) throw new Error('Order not found');
    if (!canTransitionTo(order.status as OrderStatus, newStatus)) {
      throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    const updateData: Prisma.MarketplaceOrderUpdateInput = {
      status: newStatus,
    };

    // Handle status-specific updates
    if (newStatus === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (newStatus === 'shipped') {
      updateData.shippedAt = new Date();
      updateData.fulfillmentStatus = 'out_for_delivery';
    } else if (newStatus === 'delivered') {
      updateData.deliveredAt = new Date();
      updateData.fulfillmentStatus = 'delivered';
      updateData.paymentStatus = 'paid';
    } else if (newStatus === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    const updated = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    await prisma.marketplaceOrderAudit.create({
      data: {
        orderId,
        action: 'status_changed',
        actor: 'seller',
        actorId: sellerId,
        previousValue: order.status,
        newValue: newStatus,
      },
    });

    // Fire-and-forget: trigger automation rules for order status change
    automationRulesService.onOrderStatusChange(orderId, sellerId, newStatus).catch((err) => {
      apiLogger.warn('Automation trigger failed for order status change:', err);
    });

    return updated;
  },

  /**
   * Ship order (seller)
   */
  async shipOrder(sellerId: string, orderId: string, data: ShipOrderInput) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId },
    });

    if (!order) throw new Error('Order not found');
    if (!canShipOrder(order.status as OrderStatus)) {
      throw new Error('Order cannot be shipped in current state');
    }

    const updated = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'shipped',
        fulfillmentStatus: 'out_for_delivery',
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery,
        sellerNotes: data.sellerNotes || order.sellerNotes,
        shippedAt: new Date(),
      },
    });

    await prisma.marketplaceOrderAudit.create({
      data: {
        orderId,
        action: 'shipped',
        actor: 'seller',
        actorId: sellerId,
        metadata: JSON.stringify({
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
        }),
      },
    });

    return updated;
  },

  /**
   * Mark order as delivered (seller)
   */
  async markDelivered(sellerId: string, orderId: string) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId },
    });

    if (!order) throw new Error('Order not found');
    if (!canMarkDelivered(order.status as OrderStatus)) {
      throw new Error('Order cannot be marked as delivered in current state');
    }

    const updated = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'delivered',
        fulfillmentStatus: 'delivered',
        paymentStatus: 'paid',
        deliveredAt: new Date(),
      },
    });

    // Update item successful orders count
    await prisma.item.update({
      where: { id: order.itemId },
      data: { successfulOrders: { increment: 1 } },
    });

    await prisma.marketplaceOrderAudit.create({
      data: {
        orderId,
        action: 'delivered',
        actor: 'seller',
        actorId: sellerId,
      },
    });

    return updated;
  },

  /**
   * Cancel order (seller)
   */
  async cancelOrder(sellerId: string, orderId: string, reason?: string) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId },
    });

    if (!order) throw new Error('Order not found');
    if (!canCancelOrder(order.status as OrderStatus)) {
      throw new Error('Order cannot be cancelled in current state');
    }

    const updated = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        internalNotes: reason
          ? `${order.internalNotes || ''}\n[Cancellation]: ${reason}`.trim()
          : order.internalNotes,
      },
    });

    await prisma.marketplaceOrderAudit.create({
      data: {
        orderId,
        action: 'cancelled',
        actor: 'seller',
        actorId: sellerId,
        metadata: reason ? JSON.stringify({ reason }) : null,
      },
    });

    return updated;
  },

  /**
   * Update order details (seller)
   */
  async updateOrder(sellerId: string, orderId: string, data: UpdateOrderInput) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId },
    });

    if (!order) throw new Error('Order not found');

    // If status change requested, validate transition
    if (data.status && data.status !== order.status) {
      if (!canTransitionTo(order.status as OrderStatus, data.status)) {
        throw new Error(`Cannot transition from ${order.status} to ${data.status}`);
      }
    }

    const updated = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.fulfillmentStatus && { fulfillmentStatus: data.fulfillmentStatus }),
        ...(data.trackingNumber && { trackingNumber: data.trackingNumber }),
        ...(data.carrier && { carrier: data.carrier }),
        ...(data.estimatedDelivery && { estimatedDelivery: data.estimatedDelivery }),
        ...(data.sellerNotes && { sellerNotes: data.sellerNotes }),
        ...(data.internalNotes && { internalNotes: data.internalNotes }),
      },
    });

    // Create audit entry if tracking added
    if (data.trackingNumber && data.trackingNumber !== order.trackingNumber) {
      await prisma.marketplaceOrderAudit.create({
        data: {
          orderId,
          action: 'tracking_added',
          actor: 'seller',
          actorId: sellerId,
          newValue: data.trackingNumber,
        },
      });
    }

    return updated;
  },

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all orders for a buyer
   */
  async getBuyerOrders(buyerId: string, filters: OrderFilters = {}) {
    const where: Prisma.MarketplaceOrderWhereInput = { buyerId };

    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { itemName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.marketplaceOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        lineItems: { orderBy: { position: 'asc' } },
        invoice: {
          select: { id: true, status: true, invoiceNumber: true, totalAmount: true },
        },
      },
    });

    return orders.map((order) => ({
      ...order,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
      invoiceId: order.invoice?.id || null,
      invoiceStatus: order.invoice?.status || null,
      invoiceNumber: order.invoice?.invoiceNumber || null,
    }));
  },

  /**
   * Get single order for buyer
   */
  async getBuyerOrder(buyerId: string, orderId: string) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, buyerId },
      include: {
        lineItems: { orderBy: { position: 'asc' } },
        invoice: {
          select: { id: true, status: true, invoiceNumber: true, totalAmount: true },
        },
      },
    });

    if (!order) return null;

    return {
      ...order,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
      invoiceId: order.invoice?.id || null,
      invoiceStatus: order.invoice?.status || null,
      invoiceNumber: order.invoice?.invoiceNumber || null,
    };
  },

  /**
   * Cancel order (buyer - only if pending)
   */
  async cancelOrderByBuyer(buyerId: string, orderId: string, reason?: string) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, buyerId },
    });

    if (!order) throw new Error('Order not found');
    if (order.status !== 'pending_confirmation') {
      throw new Error('Only pending orders can be cancelled by buyer');
    }

    const updated = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    await prisma.marketplaceOrderAudit.create({
      data: {
        orderId,
        action: 'cancelled',
        actor: 'buyer',
        actorId: buyerId,
        metadata: reason ? JSON.stringify({ reason }) : null,
      },
    });

    return updated;
  },

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  /**
   * Get seller order statistics
   */
  async getSellerOrderStats(sellerId: string) {
    try {
      const [
        total,
        pendingConfirmation,
        confirmed,
        inProgress,
        shipped,
        delivered,
        cancelled,
        revenueResult,
      ] = await Promise.all([
        prisma.marketplaceOrder.count({ where: { sellerId } }),
        prisma.marketplaceOrder.count({ where: { sellerId, status: 'pending_confirmation' } }),
        prisma.marketplaceOrder.count({ where: { sellerId, status: 'confirmed' } }),
        prisma.marketplaceOrder.count({ where: { sellerId, status: 'in_progress' } }),
        prisma.marketplaceOrder.count({ where: { sellerId, status: 'shipped' } }),
        prisma.marketplaceOrder.count({ where: { sellerId, status: 'delivered' } }),
        prisma.marketplaceOrder.count({ where: { sellerId, status: 'cancelled' } }),
        prisma.marketplaceOrder.aggregate({
          where: { sellerId, status: 'delivered', paymentStatus: 'paid' },
          _sum: { totalPrice: true },
        }),
      ]);

      return {
        total,
        pendingConfirmation,
        confirmed,
        inProgress,
        shipped,
        delivered,
        cancelled,
        totalRevenue: revenueResult._sum.totalPrice || 0,
        currency: 'SAR',
      };
    } catch (error) {
      apiLogger.error('[OrderService] Error getting seller order stats:', error);
      return EMPTY_ORDER_STATS;
    }
  },

  /**
   * Get buyer order statistics
   */
  async getBuyerOrderStats(buyerId: string) {
    const [total, active, delivered, cancelled] = await Promise.all([
      prisma.marketplaceOrder.count({ where: { buyerId } }),
      prisma.marketplaceOrder.count({
        where: {
          buyerId,
          status: { in: ['pending_confirmation', 'confirmed', 'in_progress', 'shipped'] },
        },
      }),
      prisma.marketplaceOrder.count({ where: { buyerId, status: 'delivered' } }),
      prisma.marketplaceOrder.count({ where: { buyerId, status: 'cancelled' } }),
    ]);

    return { total, active, delivered, cancelled };
  },

  /**
   * Get buyer dashboard summary with KPIs and trends
   */
  async getBuyerDashboardSummary(buyerId: string) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Current period data
      const [
        totalOrders,
        thisMonthOrders,
        lastMonthOrders,
        totalSpend,
        thisMonthSpend,
        lastMonthSpend,
        uniqueSellers,
        lastMonthSellers,
      ] = await Promise.all([
        // Total orders
        prisma.marketplaceOrder.count({
          where: { buyerId, status: { not: 'cancelled' } },
        }),
        // This month orders
        prisma.marketplaceOrder.count({
          where: {
            buyerId,
            status: { not: 'cancelled' },
            createdAt: { gte: startOfMonth },
          },
        }),
        // Last month orders
        prisma.marketplaceOrder.count({
          where: {
            buyerId,
            status: { not: 'cancelled' },
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
        }),
        // Total spend (all time, delivered/paid)
        prisma.marketplaceOrder.aggregate({
          where: { buyerId, status: 'delivered', paymentStatus: 'paid' },
          _sum: { totalPrice: true },
        }),
        // This month spend
        prisma.marketplaceOrder.aggregate({
          where: {
            buyerId,
            status: 'delivered',
            paymentStatus: 'paid',
            createdAt: { gte: startOfMonth },
          },
          _sum: { totalPrice: true },
        }),
        // Last month spend
        prisma.marketplaceOrder.aggregate({
          where: {
            buyerId,
            status: 'delivered',
            paymentStatus: 'paid',
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          _sum: { totalPrice: true },
        }),
        // Unique sellers (current)
        prisma.marketplaceOrder.findMany({
          where: { buyerId, status: { not: 'cancelled' } },
          select: { sellerId: true },
          distinct: ['sellerId'],
        }),
        // Unique sellers (last month)
        prisma.marketplaceOrder.findMany({
          where: {
            buyerId,
            status: { not: 'cancelled' },
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          select: { sellerId: true },
          distinct: ['sellerId'],
        }),
      ]);

      const totalSpendValue = totalSpend._sum.totalPrice || 0;
      const thisMonthSpendValue = thisMonthSpend._sum.totalPrice || 0;
      const lastMonthSpendValue = lastMonthSpend._sum.totalPrice || 0;
      const activeSuppliers = uniqueSellers.length;
      const lastMonthSuppliers = lastMonthSellers.length;
      const avgPurchaseValue = totalOrders > 0 ? totalSpendValue / totalOrders : 0;

      // Calculate trends (percentage change from last month)
      const calcTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      return {
        totalPurchaseSpend: totalSpendValue,
        totalPurchaseOrders: totalOrders,
        activeSuppliers,
        avgPurchaseValue: Math.round(avgPurchaseValue),
        currency: 'SAR',
        trends: {
          spend: calcTrend(thisMonthSpendValue, lastMonthSpendValue),
          orders: calcTrend(thisMonthOrders, lastMonthOrders),
          suppliers: calcTrend(activeSuppliers, lastMonthSuppliers),
          avgValue: 0, // Would need historical data to calculate
        },
      };
    } catch (error) {
      apiLogger.error('Error fetching buyer dashboard:', error);
      return {
        totalPurchaseSpend: 0,
        totalPurchaseOrders: 0,
        activeSuppliers: 0,
        avgPurchaseValue: 0,
        currency: 'SAR',
        trends: {
          spend: 0,
          orders: 0,
          suppliers: 0,
          avgValue: 0,
        },
      };
    }
  },
};

export default orderService;
