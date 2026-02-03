// =============================================================================
// Orders System - Type Definitions
// =============================================================================

import { Item } from './item.types';

// =============================================================================
// Order Status Types - Strict State Machine
// =============================================================================

/**
 * Order Status - Main lifecycle states
 * Transitions are server-controlled only
 */
export type OrderStatus =
  | 'pending_confirmation' // Initial state - awaiting seller confirmation
  | 'confirmed'            // Seller confirmed the order
  | 'in_progress'          // Order is being prepared/processed
  | 'shipped'              // Order has been shipped
  | 'delivered'            // Order delivered to buyer
  | 'cancelled'            // Terminal - Order cancelled
  | 'failed'               // Terminal - Order failed
  | 'refunded';            // Terminal - Order refunded

/**
 * Payment Status - Decoupled but state-synced
 */
export type PaymentStatus =
  | 'unpaid'
  | 'authorized'
  | 'paid'
  | 'refunded';

/**
 * Fulfillment Status - Physical delivery stages
 */
export type FulfillmentStatus =
  | 'not_started'
  | 'packing'
  | 'out_for_delivery'
  | 'delivered';

// =============================================================================
// Order Source Types
// =============================================================================

/**
 * How the order was created
 */
export type OrderSource = 'rfq' | 'direct_buy';

// =============================================================================
// Core Order Interface
// =============================================================================

export interface Order {
  id: string;
  orderNumber: string;

  // Parties
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  buyerCompany?: string;
  sellerId: string;

  // Item Reference
  itemId: string;
  itemName: string;
  itemSku: string;
  itemImage?: string;

  // RFQ Reference (if created from RFQ)
  rfqId?: string;
  rfqNumber?: string;

  // Order Details
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;

  // Statuses
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  // Source
  source: OrderSource;

  // Shipping Information
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;

  // Notes
  buyerNotes?: string;
  sellerNotes?: string;
  internalNotes?: string;

  // Timestamps
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  updatedAt: string;

  // Audit Trail (append-only)
  auditLog: OrderAuditEntry[];

  // Related Item (optional - populated on fetch)
  item?: Item;
}

// =============================================================================
// Supporting Types
// =============================================================================

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

export interface OrderAuditEntry {
  id: string;
  timestamp: string;
  action: OrderAuditAction;
  actor: 'buyer' | 'seller' | 'system';
  actorId?: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export type OrderAuditAction =
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

// =============================================================================
// API Data Transfer Objects
// =============================================================================

export interface CreateOrderFromRFQData {
  rfqId: string;
  sellerNotes?: string;
}

export interface CreateDirectOrderData {
  itemId: string;
  quantity: number;
  shippingAddress: ShippingAddress;
  buyerNotes?: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  sellerNotes?: string;
  internalNotes?: string;
}

export interface ShipOrderData {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: string;
  sellerNotes?: string;
}

// =============================================================================
// Query/Filter Types
// =============================================================================

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

export type OrderSortOption =
  | 'newest'
  | 'oldest'
  | 'total_high'
  | 'total_low'
  | 'status';

// =============================================================================
// Business Logic Helpers
// =============================================================================

/**
 * Valid status transitions from each state
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['shipped', 'cancelled'],
  shipped: ['delivered', 'failed'],
  delivered: ['refunded'],
  cancelled: [],
  failed: ['refunded'],
  refunded: [],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(order: Pick<Order, 'status'>): boolean {
  return ['pending_confirmation', 'confirmed', 'in_progress'].includes(order.status);
}

/**
 * Check if seller can confirm order
 */
export function canConfirmOrder(order: Pick<Order, 'status'>): boolean {
  return order.status === 'pending_confirmation';
}

/**
 * Check if order can be shipped
 */
export function canShipOrder(order: Pick<Order, 'status'>): boolean {
  return order.status === 'confirmed' || order.status === 'in_progress';
}

/**
 * Check if delivery can be confirmed
 */
export function canMarkDelivered(order: Pick<Order, 'status'>): boolean {
  return order.status === 'shipped';
}

/**
 * Check if order is in terminal state
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ['cancelled', 'failed', 'refunded', 'delivered'].includes(status);
}

/**
 * Get status display configuration
 */
export function getOrderStatusConfig(status: OrderStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'muted';
} {
  const configs: Record<OrderStatus, ReturnType<typeof getOrderStatusConfig>> = {
    pending_confirmation: { label: 'Pending', labelKey: 'seller.orders.pendingConfirmation', color: 'warning' },
    confirmed: { label: 'Confirmed', labelKey: 'seller.orders.confirmed', color: 'info' },
    in_progress: { label: 'In Progress', labelKey: 'seller.orders.inProgress', color: 'primary' },
    shipped: { label: 'Shipped', labelKey: 'seller.orders.shipped', color: 'info' },
    delivered: { label: 'Delivered', labelKey: 'seller.orders.delivered', color: 'success' },
    cancelled: { label: 'Cancelled', labelKey: 'seller.orders.cancelled', color: 'error' },
    failed: { label: 'Failed', labelKey: 'seller.orders.failed', color: 'error' },
    refunded: { label: 'Refunded', labelKey: 'seller.orders.refunded', color: 'muted' },
  };
  return configs[status];
}

/**
 * Get payment status display configuration
 */
export function getPaymentStatusConfig(status: PaymentStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'info' | 'success' | 'error';
} {
  const configs: Record<PaymentStatus, ReturnType<typeof getPaymentStatusConfig>> = {
    unpaid: { label: 'Unpaid', labelKey: 'seller.orders.unpaid', color: 'warning' },
    authorized: { label: 'Authorized', labelKey: 'seller.orders.authorized', color: 'info' },
    paid: { label: 'Paid', labelKey: 'seller.orders.paid', color: 'success' },
    refunded: { label: 'Refunded', labelKey: 'seller.orders.paymentRefunded', color: 'error' },
  };
  return configs[status];
}

/**
 * Get fulfillment status display configuration
 */
export function getFulfillmentStatusConfig(status: FulfillmentStatus): {
  label: string;
  labelKey: string;
} {
  const configs: Record<FulfillmentStatus, ReturnType<typeof getFulfillmentStatusConfig>> = {
    not_started: { label: 'Not Started', labelKey: 'seller.orders.notStarted' },
    packing: { label: 'Packing', labelKey: 'seller.orders.packing' },
    out_for_delivery: { label: 'Out for Delivery', labelKey: 'seller.orders.outForDelivery' },
    delivered: { label: 'Delivered', labelKey: 'seller.orders.fulfillmentDelivered' },
  };
  return configs[status];
}

// =============================================================================
// Statistics Types
// =============================================================================

export interface OrderStats {
  total: number;
  pendingConfirmation: number;
  confirmed: number;
  inProgress: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  currency: string;
}

export interface BuyerDashboardSummary {
  totalPurchaseSpend: number;
  totalPurchaseOrders: number;
  activeSuppliers: number;
  avgPurchaseValue: number;
  currency: string;
  trends: {
    spend: number;
    orders: number;
    suppliers: number;
    avgValue: number;
  };
}

// =============================================================================
// Order Health Intelligence Types
// =============================================================================

/**
 * Order health status
 */
export type OrderHealthStatus = 'on_track' | 'at_risk' | 'delayed' | 'critical';

/**
 * Exception severity levels
 */
export type ExceptionSeverity = 'warning' | 'error' | 'critical';

/**
 * Exception types
 */
export type ExceptionType =
  | 'late_confirmation'
  | 'shipping_delay'
  | 'payment_overdue'
  | 'partial_fulfillment'
  | 'delivery_failed'
  | 'customer_complaint';

/**
 * Active exception on an order
 */
export interface OrderException {
  type: ExceptionType;
  severity: ExceptionSeverity;
  message: string;
  createdAt: string;
  resolvedAt?: string;
}

/**
 * SLA deadlines for an order
 */
export interface OrderSLA {
  confirmationDeadline?: string;
  shippingDeadline?: string;
  deliveryDeadline?: string;
}

/**
 * Timeline metrics for an order
 */
export interface OrderTimeline {
  daysToConfirm?: number;
  daysToShip?: number;
  daysToDeliver?: number;
}

/**
 * Order with health data
 */
export interface OrderWithHealth extends Order {
  // Health indicators
  healthStatus: OrderHealthStatus;
  healthScore: number;  // 0-100, higher is healthier
  healthLastChecked?: string;

  // Exception data
  hasException: boolean;
  exceptionType?: ExceptionType;
  exceptionSeverity?: ExceptionSeverity;
  exceptionMessage?: string;
  exceptionCreatedAt?: string;
  exceptionResolvedAt?: string;

  // SLA tracking
  sla: OrderSLA;
  timeline: OrderTimeline;
}

/**
 * Health summary for dashboard
 */
export interface OrderHealthSummary {
  onTrack: number;
  atRisk: number;
  delayed: number;
  critical: number;
  activeExceptions: number;
}

/**
 * Exception item for list display
 */
export interface OrderExceptionItem {
  id: string;
  orderNumber: string;
  itemName: string;
  buyerName?: string;
  status: OrderStatus;
  exceptionType: ExceptionType;
  exceptionSeverity: ExceptionSeverity;
  exceptionMessage: string;
  exceptionCreatedAt: string;
  createdAt: string;
}

/**
 * Health rules configuration
 */
export interface OrderHealthRules {
  confirmationSlaHours: number;
  shippingSlaDays: number;
  deliverySlaDays: number;
  atRiskThreshold: number;   // percentage
  delayedThreshold: number;  // percentage
}

/**
 * Get health status display configuration
 */
export function getHealthStatusConfig(status: OrderHealthStatus): {
  label: string;
  labelKey: string;
  color: 'success' | 'warning' | 'error';
  bgColor: string;
  textColor: string;
  icon: string;
} {
  const configs: Record<OrderHealthStatus, ReturnType<typeof getHealthStatusConfig>> = {
    on_track: {
      label: 'On Track',
      labelKey: 'seller.orders.onTrack',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      icon: 'CheckCircle',
    },
    at_risk: {
      label: 'At Risk',
      labelKey: 'seller.orders.atRisk',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      icon: 'AlertTriangle',
    },
    delayed: {
      label: 'Delayed',
      labelKey: 'seller.orders.delayed',
      color: 'error',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-400',
      icon: 'Clock',
    },
    critical: {
      label: 'Critical',
      labelKey: 'seller.orders.critical',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: 'AlertCircle',
    },
  };
  return configs[status];
}

/**
 * Get exception severity display configuration
 */
export function getExceptionSeverityConfig(severity: ExceptionSeverity): {
  label: string;
  labelKey: string;
  color: 'warning' | 'error';
  bgColor: string;
} {
  const configs: Record<ExceptionSeverity, ReturnType<typeof getExceptionSeverityConfig>> = {
    warning: {
      label: 'Warning',
      labelKey: 'seller.orders.exceptionWarning',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    error: {
      label: 'Error',
      labelKey: 'seller.orders.exceptionError',
      color: 'error',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    critical: {
      label: 'Critical',
      labelKey: 'seller.orders.exceptionCritical',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
  };
  return configs[severity];
}

/**
 * Get exception type display label
 */
export function getExceptionTypeLabel(type: ExceptionType): {
  label: string;
  labelKey: string;
} {
  const labels: Record<ExceptionType, ReturnType<typeof getExceptionTypeLabel>> = {
    late_confirmation: { label: 'Late Confirmation', labelKey: 'seller.orders.lateConfirmation' },
    shipping_delay: { label: 'Shipping Delay', labelKey: 'seller.orders.shippingDelay' },
    payment_overdue: { label: 'Payment Overdue', labelKey: 'seller.orders.paymentOverdue' },
    partial_fulfillment: { label: 'Partial Fulfillment', labelKey: 'seller.orders.partialFulfillment' },
    delivery_failed: { label: 'Delivery Failed', labelKey: 'seller.orders.deliveryFailed' },
    customer_complaint: { label: 'Customer Complaint', labelKey: 'seller.orders.customerComplaint' },
  };
  return labels[type];
}
