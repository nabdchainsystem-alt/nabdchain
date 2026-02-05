// =============================================================================
// Order Health Service - Fulfillment Intelligence
// =============================================================================

import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

export type OrderHealthStatus = 'on_track' | 'at_risk' | 'delayed' | 'critical';
export type ExceptionSeverity = 'warning' | 'error' | 'critical';
export type ExceptionType =
  | 'late_confirmation'
  | 'shipping_delay'
  | 'payment_overdue'
  | 'partial_fulfillment'
  | 'delivery_failed'
  | 'customer_complaint';

export interface OrderException {
  type: ExceptionType;
  severity: ExceptionSeverity;
  message: string;
  createdAt: Date;
}

export interface OrderHealthSummary {
  onTrack: number;
  atRisk: number;
  delayed: number;
  critical: number;
  activeExceptions: number;
}

export interface HealthRules {
  confirmationSlaHours: number;
  shippingSlaDays: number;
  deliverySlaDays: number;
  atRiskThreshold: number;   // percentage
  delayedThreshold: number;  // percentage
}

// Default rules
const DEFAULT_RULES: HealthRules = {
  confirmationSlaHours: 24,
  shippingSlaDays: 3,
  deliverySlaDays: 7,
  atRiskThreshold: 70,
  delayedThreshold: 100,
};

// =============================================================================
// Health Calculation Functions
// =============================================================================

/**
 * Calculate health status based on SLA elapsed time
 */
export function calculateHealthFromSLA(
  elapsedPercent: number,
  rules: HealthRules
): OrderHealthStatus {
  if (elapsedPercent >= rules.delayedThreshold + 50) return 'critical';
  if (elapsedPercent >= rules.delayedThreshold) return 'delayed';
  if (elapsedPercent >= rules.atRiskThreshold) return 'at_risk';
  return 'on_track';
}

/**
 * Calculate percentage of SLA time elapsed
 */
export function calculateSLAElapsed(
  startTime: Date,
  deadline: Date,
  now: Date = new Date()
): number {
  const totalTime = deadline.getTime() - startTime.getTime();
  const elapsedTime = now.getTime() - startTime.getTime();

  if (totalTime <= 0) return 100;
  return Math.round((elapsedTime / totalTime) * 100);
}

/**
 * Calculate order health score (0-100, higher is healthier)
 */
export function calculateHealthScore(
  status: string,
  healthStatus: OrderHealthStatus,
  hasException: boolean
): number {
  let score = 100;

  // Deduct based on health status
  switch (healthStatus) {
    case 'critical':
      score -= 50;
      break;
    case 'delayed':
      score -= 30;
      break;
    case 'at_risk':
      score -= 15;
      break;
  }

  // Deduct for active exception
  if (hasException) {
    score -= 20;
  }

  // Terminal statuses
  if (status === 'delivered') score = 100;
  if (status === 'cancelled' || status === 'failed') score = 0;

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine exception from order state
 */
export function detectException(
  order: {
    status: string;
    paymentStatus: string;
    createdAt: Date;
    confirmedAt: Date | null;
    shippedAt: Date | null;
    confirmationDeadline: Date | null;
    shippingDeadline: Date | null;
  },
  rules: HealthRules
): OrderException | null {
  const now = new Date();

  // Check confirmation SLA
  if (order.status === 'pending_confirmation' && order.confirmationDeadline) {
    if (now > order.confirmationDeadline) {
      return {
        type: 'late_confirmation',
        severity: 'error',
        message: 'Order confirmation is overdue',
        createdAt: now,
      };
    }
  }

  // Check shipping SLA
  if (
    ['confirmed', 'in_progress'].includes(order.status) &&
    order.shippingDeadline &&
    !order.shippedAt
  ) {
    if (now > order.shippingDeadline) {
      return {
        type: 'shipping_delay',
        severity: 'error',
        message: 'Shipment is overdue',
        createdAt: now,
      };
    }
  }

  // Check payment status on delivered orders
  if (order.status === 'delivered' && order.paymentStatus === 'unpaid') {
    return {
      type: 'payment_overdue',
      severity: 'warning',
      message: 'Payment not received for delivered order',
      createdAt: now,
    };
  }

  return null;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get or create health rules for a seller
 */
export async function getOrCreateHealthRules(sellerId: string): Promise<HealthRules> {
  let rules = await prisma.orderHealthRules.findUnique({
    where: { sellerId },
  });

  if (!rules) {
    rules = await prisma.orderHealthRules.create({
      data: {
        sellerId,
        confirmationSlaHours: DEFAULT_RULES.confirmationSlaHours,
        shippingSlaDays: DEFAULT_RULES.shippingSlaDays,
        deliverySlaDays: DEFAULT_RULES.deliverySlaDays,
        atRiskThreshold: DEFAULT_RULES.atRiskThreshold,
        delayedThreshold: DEFAULT_RULES.delayedThreshold,
      },
    });
  }

  return {
    confirmationSlaHours: rules.confirmationSlaHours,
    shippingSlaDays: rules.shippingSlaDays,
    deliverySlaDays: rules.deliverySlaDays,
    atRiskThreshold: rules.atRiskThreshold,
    delayedThreshold: rules.delayedThreshold,
  };
}

/**
 * Calculate and update order health
 */
export async function calculateOrderHealth(orderId: string, sellerId: string) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
  });

  if (!order || order.sellerId !== sellerId) {
    throw new Error('Order not found or unauthorized');
  }

  const rules = await getOrCreateHealthRules(sellerId);

  // Calculate deadlines if not set
  const confirmationDeadline =
    order.confirmationDeadline ||
    new Date(order.createdAt.getTime() + rules.confirmationSlaHours * 60 * 60 * 1000);

  const shippingDeadline =
    order.shippingDeadline ||
    (order.confirmedAt
      ? new Date(order.confirmedAt.getTime() + rules.shippingSlaDays * 24 * 60 * 60 * 1000)
      : null);

  const deliveryDeadline =
    order.deliveryDeadline ||
    (order.shippedAt
      ? new Date(order.shippedAt.getTime() + rules.deliverySlaDays * 24 * 60 * 60 * 1000)
      : null);

  // Determine current deadline based on status
  let currentDeadline: Date | null = null;
  let startTime: Date = order.createdAt;

  switch (order.status) {
    case 'pending_confirmation':
      currentDeadline = confirmationDeadline;
      break;
    case 'confirmed':
    case 'in_progress':
      currentDeadline = shippingDeadline;
      startTime = order.confirmedAt || order.createdAt;
      break;
    case 'shipped':
      currentDeadline = deliveryDeadline;
      startTime = order.shippedAt || order.createdAt;
      break;
  }

  // Calculate health status
  let healthStatus: OrderHealthStatus = 'on_track';
  if (currentDeadline) {
    const elapsedPercent = calculateSLAElapsed(startTime, currentDeadline);
    healthStatus = calculateHealthFromSLA(elapsedPercent, rules);
  }

  // Check for terminal statuses
  if (order.status === 'delivered') healthStatus = 'on_track';
  if (order.status === 'cancelled' || order.status === 'failed') healthStatus = 'critical';

  // Detect exceptions
  const exception = detectException(
    {
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      confirmationDeadline,
      shippingDeadline,
    },
    rules
  );

  // Calculate health score
  const healthScore = calculateHealthScore(order.status, healthStatus, !!exception);

  // Calculate days
  const now = new Date();
  const daysToConfirm = order.confirmedAt
    ? Math.round((order.confirmedAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const daysToShip =
    order.shippedAt && order.confirmedAt
      ? Math.round((order.shippedAt.getTime() - order.confirmedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;
  const daysToDeliver =
    order.deliveredAt && order.shippedAt
      ? Math.round((order.deliveredAt.getTime() - order.shippedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // Update order with health data
  const updatedOrder = await prisma.marketplaceOrder.update({
    where: { id: orderId },
    data: {
      healthStatus,
      healthScore,
      healthLastChecked: now,
      hasException: !!exception,
      exceptionType: exception?.type || null,
      exceptionSeverity: exception?.severity || null,
      exceptionMessage: exception?.message || null,
      exceptionCreatedAt: exception ? now : null,
      confirmationDeadline,
      shippingDeadline,
      deliveryDeadline,
      daysToConfirm,
      daysToShip,
      daysToDeliver,
    },
  });

  return {
    order: updatedOrder,
    healthStatus,
    healthScore,
    exception,
  };
}

/**
 * Get order health summary for a seller
 */
export async function getOrderHealthSummary(sellerId: string): Promise<OrderHealthSummary> {
  const orders = await prisma.marketplaceOrder.findMany({
    where: {
      sellerId,
      status: {
        notIn: ['delivered', 'cancelled', 'failed', 'refunded'],
      },
    },
    select: {
      healthStatus: true,
      hasException: true,
    },
  });

  return {
    onTrack: orders.filter((o) => o.healthStatus === 'on_track').length,
    atRisk: orders.filter((o) => o.healthStatus === 'at_risk').length,
    delayed: orders.filter((o) => o.healthStatus === 'delayed').length,
    critical: orders.filter((o) => o.healthStatus === 'critical').length,
    activeExceptions: orders.filter((o) => o.hasException).length,
  };
}

/**
 * Get active exceptions for a seller
 */
export async function getActiveExceptions(
  sellerId: string,
  severity?: ExceptionSeverity
) {
  const where: Record<string, unknown> = {
    sellerId,
    hasException: true,
    exceptionResolvedAt: null,
  };

  if (severity) {
    where.exceptionSeverity = severity;
  }

  const orders = await prisma.marketplaceOrder.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      itemName: true,
      buyerName: true,
      status: true,
      exceptionType: true,
      exceptionSeverity: true,
      exceptionMessage: true,
      exceptionCreatedAt: true,
      createdAt: true,
    },
    orderBy: [
      { exceptionSeverity: 'desc' },
      { exceptionCreatedAt: 'desc' },
    ],
  });

  return orders;
}

/**
 * Resolve an exception
 */
export async function resolveException(
  orderId: string,
  sellerId: string,
  resolution: string
) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
  });

  if (!order || order.sellerId !== sellerId) {
    throw new Error('Order not found or unauthorized');
  }

  if (!order.hasException) {
    throw new Error('Order has no active exception');
  }

  // Update order
  const updatedOrder = await prisma.marketplaceOrder.update({
    where: { id: orderId },
    data: {
      hasException: false,
      exceptionResolvedAt: new Date(),
    },
  });

  // Create audit log
  await prisma.marketplaceOrderAudit.create({
    data: {
      orderId,
      action: 'exception_resolved',
      actor: 'seller',
      actorId: sellerId,
      previousValue: order.exceptionType,
      newValue: resolution,
      metadata: JSON.stringify({
        exceptionType: order.exceptionType,
        exceptionSeverity: order.exceptionSeverity,
        resolution,
      }),
    },
  });

  return updatedOrder;
}

/**
 * Batch update health for all active orders
 */
export async function updateOrderHealthBatch(sellerId: string) {
  const activeOrders = await prisma.marketplaceOrder.findMany({
    where: {
      sellerId,
      status: {
        notIn: ['delivered', 'cancelled', 'failed', 'refunded'],
      },
    },
    select: { id: true },
  });

  const results = [];
  for (const order of activeOrders) {
    try {
      const result = await calculateOrderHealth(order.id, sellerId);
      results.push({ id: order.id, success: true, healthStatus: result.healthStatus });
    } catch (error) {
      results.push({ id: order.id, success: false, error: String(error) });
    }
  }

  return {
    total: activeOrders.length,
    updated: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Get orders with health data
 */
export async function getOrdersWithHealth(
  sellerId: string,
  filters?: {
    healthStatus?: OrderHealthStatus;
    hasException?: boolean;
    status?: string;
  }
) {
  const where: Record<string, unknown> = { sellerId };

  if (filters?.healthStatus) {
    where.healthStatus = filters.healthStatus;
  }
  if (filters?.hasException !== undefined) {
    where.hasException = filters.hasException;
  }
  if (filters?.status) {
    where.status = filters.status;
  }

  const orders = await prisma.marketplaceOrder.findMany({
    where,
    orderBy: [
      { healthStatus: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return orders;
}

/**
 * Get RFQ negotiation history for an order (if from RFQ)
 */
export async function getRFQNegotiationHistory(orderId: string, sellerId: string) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
  });

  if (!order || order.sellerId !== sellerId) {
    throw new Error('Order not found or unauthorized');
  }

  if (!order.rfqId) {
    return null; // Order not from RFQ
  }

  const rfq = await prisma.marketplaceRFQ.findUnique({
    where: { id: order.rfqId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      events: {
        orderBy: { createdAt: 'asc' },
      },
      item: true,
    },
  });

  return rfq;
}

// =============================================================================
// SLA Evaluation for API Response
// =============================================================================

export interface SLAEvaluation {
  currentStep: string;
  currentDeadline: Date | null;
  remainingMs: number;
  status: 'on_track' | 'at_risk' | 'breached';
  percentUsed: number;
  statusText: string;
  timeText: string;
}

const SLA_STATUS_TEXT = {
  on_track: 'On track',
  at_risk: 'Needs attention',
  breached: 'SLA breached',
};

/**
 * Evaluate SLA for an order - returns data for frontend display
 */
export function evaluateSLA(order: {
  status: string;
  createdAt: Date;
  confirmedAt: Date | null;
  shippedAt: Date | null;
  confirmationDeadline: Date | null;
  shippingDeadline: Date | null;
  deliveryDeadline: Date | null;
}): SLAEvaluation | null {
  const now = new Date();
  let deadline: Date | null = null;
  let startTime: Date;
  let currentStep = order.status;

  // Determine which SLA applies based on order status
  switch (order.status) {
    case 'pending_confirmation':
      startTime = order.createdAt;
      deadline = order.confirmationDeadline ||
        new Date(startTime.getTime() + DEFAULT_RULES.confirmationSlaHours * 60 * 60 * 1000);
      break;
    case 'confirmed':
    case 'processing':
      startTime = order.confirmedAt || order.createdAt;
      deadline = order.shippingDeadline ||
        new Date(startTime.getTime() + DEFAULT_RULES.shippingSlaDays * 24 * 60 * 60 * 1000);
      break;
    case 'shipped':
      startTime = order.shippedAt || order.createdAt;
      deadline = order.deliveryDeadline ||
        new Date(startTime.getTime() + DEFAULT_RULES.deliverySlaDays * 24 * 60 * 60 * 1000);
      break;
    default:
      // Terminal states - no active SLA
      return null;
  }

  if (!deadline) return null;

  const totalMs = deadline.getTime() - startTime.getTime();
  const elapsedMs = now.getTime() - startTime.getTime();
  const remainingMs = deadline.getTime() - now.getTime();
  const isOverdue = remainingMs < 0;
  const percentUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

  // Calculate time text
  const hours = Math.floor(Math.abs(remainingMs) / (60 * 60 * 1000));
  const minutes = Math.floor((Math.abs(remainingMs) % (60 * 60 * 1000)) / (60 * 1000));

  let timeText = '';
  if (isOverdue) {
    timeText = hours > 24 ? `${Math.floor(hours / 24)}d overdue` : `${hours}h overdue`;
  } else if (hours < 24) {
    timeText = `${hours}h ${minutes}m remaining`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    timeText = remainingHours > 0 ? `${days}d ${remainingHours}h remaining` : `${days}d remaining`;
  }

  // Determine status based on 80% threshold
  let status: 'on_track' | 'at_risk' | 'breached';
  if (isOverdue) {
    status = 'breached';
  } else if (percentUsed >= 80) {
    status = 'at_risk';
  } else {
    status = 'on_track';
  }

  return {
    currentStep,
    currentDeadline: deadline,
    remainingMs,
    status,
    percentUsed,
    statusText: SLA_STATUS_TEXT[status],
    timeText,
  };
}

/**
 * Enrich order with SLA evaluation data
 */
export function enrichOrderWithSLA<T extends {
  status: string;
  createdAt: Date;
  confirmedAt: Date | null;
  shippedAt: Date | null;
  confirmationDeadline: Date | null;
  shippingDeadline: Date | null;
  deliveryDeadline: Date | null;
}>(order: T): T & { slaEvaluation: SLAEvaluation | null } {
  return {
    ...order,
    slaEvaluation: evaluateSLA(order),
  };
}

export default {
  calculateOrderHealth,
  getOrderHealthSummary,
  getActiveExceptions,
  resolveException,
  updateOrderHealthBatch,
  getOrdersWithHealth,
  getRFQNegotiationHistory,
  getOrCreateHealthRules,
  calculateHealthFromSLA,
  calculateSLAElapsed,
  calculateHealthScore,
  detectException,
  evaluateSLA,
  enrichOrderWithSLA,
};
