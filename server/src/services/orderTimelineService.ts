// =============================================================================
// Order Timeline Service - Enhanced SLA & Risk Assessment
// =============================================================================
// Provides comprehensive timeline tracking, SLA breach detection, delay reason
// codes, and early risk warning system for marketplace orders.
// =============================================================================

import { prisma } from '../lib/prisma';
import type { MarketplaceOrder } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export type DelayReasonCode =
  | 'supplier_stockout'
  | 'production_delay'
  | 'carrier_delay'
  | 'customs_clearance'
  | 'weather'
  | 'buyer_request'
  | 'internal_processing'
  | 'quality_check'
  | 'address_issue'
  | 'payment_hold'
  | 'documentation'
  | 'other';

export type TimelineStepKey =
  | 'order_created'
  | 'payment_received'
  | 'seller_confirmed'
  | 'processing_started'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TimelineStep {
  key: TimelineStepKey;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'skipped' | 'delayed';
  promisedAt?: Date;
  actualAt?: Date;
  startedAt?: Date;
  slaHours?: number;
  slaDays?: number;
  slaDeadline?: Date;
  slaStatus?: 'on_track' | 'at_risk' | 'breached';
  slaPercentUsed?: number;
  slaTimeRemaining?: string;
  isDelayed?: boolean;
  delayReason?: DelayReasonCode;
  delayDuration?: number;
}

export interface TimelineEvent {
  id: string;
  orderId: string;
  eventType: string;
  stepKey: TimelineStepKey;
  timestamp: Date;
  actor: 'buyer' | 'seller' | 'system' | 'carrier';
  actorId?: string;
  actorName?: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  slaDeadline?: Date;
  wasOnTime?: boolean;
  slaDelta?: number;
}

export interface RiskFactor {
  id: string;
  type: string;
  severity: RiskLevel;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  detectedAt: Date;
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskScore: number;
  factors: RiskFactor[];
  recommendations: string[];
  lastAssessedAt: Date;
  predictedDeliveryDate?: Date;
  predictionConfidence?: number;
}

export interface OrderTimelineResult {
  orderId: string;
  orderNumber: string;
  currentStep: TimelineStepKey;
  steps: TimelineStep[];
  events: TimelineEvent[];
  metrics: {
    totalLeadTime?: number;
    confirmationTime?: number;
    processingTime?: number;
    shippingTime?: number;
    slasMet: number;
    slasBreached: number;
    avgSlaUtilization: number;
    totalDelays: number;
    totalDelayTime: number;
    promisedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    deliveryVariance?: number;
  };
  riskAssessment: RiskAssessment;
}

// =============================================================================
// SLA Configuration
// =============================================================================

const SLA_CONFIG = {
  seller_confirmed: { hours: 24, warningThreshold: 70, criticalThreshold: 90 },
  processing_started: { hours: 12, warningThreshold: 70, criticalThreshold: 90 },
  ready_to_ship: { days: 2, warningThreshold: 70, criticalThreshold: 90 },
  shipped: { days: 3, warningThreshold: 70, criticalThreshold: 90 },
  delivered: { days: 7, warningThreshold: 70, criticalThreshold: 90 },
};

const STEP_LABELS: Record<TimelineStepKey, string> = {
  order_created: 'Order Created',
  payment_received: 'Payment Received',
  seller_confirmed: 'Seller Confirmed',
  processing_started: 'Processing Started',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
};

// =============================================================================
// Helper Functions
// =============================================================================

function calculateSLADeadline(startTime: Date, config: { hours?: number; days?: number }): Date {
  const deadline = new Date(startTime);
  if (config.hours) {
    deadline.setTime(deadline.getTime() + config.hours * 60 * 60 * 1000);
  }
  if (config.days) {
    deadline.setDate(deadline.getDate() + config.days);
  }
  return deadline;
}

function calculateSLAMetrics(
  startTime: Date,
  deadline: Date,
  now: Date = new Date()
): { percentUsed: number; status: 'on_track' | 'at_risk' | 'breached'; timeRemaining: string } {
  const totalMs = deadline.getTime() - startTime.getTime();
  const elapsedMs = now.getTime() - startTime.getTime();
  const remainingMs = deadline.getTime() - now.getTime();
  const isOverdue = remainingMs < 0;
  const percentUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

  // Calculate time remaining string
  const absMs = Math.abs(remainingMs);
  const hours = Math.floor(absMs / (60 * 60 * 1000));
  const minutes = Math.floor((absMs % (60 * 60 * 1000)) / (60 * 1000));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  let timeRemaining = '';
  if (isOverdue) {
    timeRemaining = days > 0 ? `${days}d overdue` : `${hours}h overdue`;
  } else if (days > 0) {
    timeRemaining = remainingHours > 0 ? `${days}d ${remainingHours}h remaining` : `${days}d remaining`;
  } else if (hours > 0) {
    timeRemaining = `${hours}h ${minutes}m remaining`;
  } else {
    timeRemaining = `${minutes}m remaining`;
  }

  // Determine status
  let status: 'on_track' | 'at_risk' | 'breached';
  if (isOverdue) {
    status = 'breached';
  } else if (percentUsed >= 80) {
    status = 'at_risk';
  } else {
    status = 'on_track';
  }

  return { percentUsed, status, timeRemaining };
}

function mapOrderStatusToStep(status: string): TimelineStepKey {
  const mapping: Record<string, TimelineStepKey> = {
    pending_confirmation: 'order_created',
    confirmed: 'seller_confirmed',
    processing: 'processing_started',
    in_progress: 'processing_started',
    shipped: 'shipped',
    delivered: 'delivered',
    closed: 'completed',
    cancelled: 'order_created',
    failed: 'order_created',
    refunded: 'completed',
  };
  return mapping[status] || 'order_created';
}

// =============================================================================
// Timeline Service Functions
// =============================================================================

/**
 * Build complete timeline for an order
 */
export async function buildOrderTimeline(orderId: string): Promise<OrderTimelineResult> {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Get audit log events
  const auditLogs = await prisma.marketplaceOrderAudit.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
  });

  const now = new Date();
  const currentStep = mapOrderStatusToStep(order.status);

  // Build timeline steps
  const steps: TimelineStep[] = [];
  let slasMet = 0;
  let slasBreached = 0;
  let totalSlaUtilization = 0;
  let slaCount = 0;

  // Step 1: Order Created
  steps.push({
    key: 'order_created',
    label: STEP_LABELS.order_created,
    status: 'completed',
    actualAt: order.createdAt,
    promisedAt: order.createdAt,
  });

  // Step 2: Payment (if applicable)
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'authorized') {
    steps.push({
      key: 'payment_received',
      label: STEP_LABELS.payment_received,
      status: 'completed',
      actualAt: order.createdAt, // Assume payment at order time for now
    });
  }

  // Step 3: Seller Confirmed
  const confirmationConfig = SLA_CONFIG.seller_confirmed;
  const confirmationDeadline = order.confirmationDeadline || calculateSLADeadline(order.createdAt, confirmationConfig);

  if (order.confirmedAt) {
    const wasOnTime = order.confirmedAt <= confirmationDeadline;
    if (wasOnTime) slasMet++; else slasBreached++;
    const slaMetrics = calculateSLAMetrics(order.createdAt, confirmationDeadline, order.confirmedAt);
    totalSlaUtilization += slaMetrics.percentUsed;
    slaCount++;

    steps.push({
      key: 'seller_confirmed',
      label: STEP_LABELS.seller_confirmed,
      status: 'completed',
      promisedAt: confirmationDeadline,
      actualAt: order.confirmedAt,
      slaHours: confirmationConfig.hours,
      slaDeadline: confirmationDeadline,
      slaStatus: wasOnTime ? 'on_track' : 'breached',
      slaPercentUsed: slaMetrics.percentUsed,
    });
  } else if (order.status === 'pending_confirmation') {
    const slaMetrics = calculateSLAMetrics(order.createdAt, confirmationDeadline, now);
    totalSlaUtilization += slaMetrics.percentUsed;
    slaCount++;

    steps.push({
      key: 'seller_confirmed',
      label: STEP_LABELS.seller_confirmed,
      status: 'active',
      promisedAt: confirmationDeadline,
      startedAt: order.createdAt,
      slaHours: confirmationConfig.hours,
      slaDeadline: confirmationDeadline,
      slaStatus: slaMetrics.status,
      slaPercentUsed: slaMetrics.percentUsed,
      slaTimeRemaining: slaMetrics.timeRemaining,
    });
  } else if (['cancelled', 'failed'].includes(order.status)) {
    steps.push({
      key: 'seller_confirmed',
      label: STEP_LABELS.seller_confirmed,
      status: 'skipped',
    });
  } else {
    steps.push({
      key: 'seller_confirmed',
      label: STEP_LABELS.seller_confirmed,
      status: 'pending',
    });
  }

  // Step 4: Processing Started
  const processingStartTime = order.confirmedAt || order.createdAt;
  if (order.processingAt) {
    steps.push({
      key: 'processing_started',
      label: STEP_LABELS.processing_started,
      status: 'completed',
      actualAt: order.processingAt,
    });
  } else if (['confirmed', 'processing', 'in_progress'].includes(order.status)) {
    steps.push({
      key: 'processing_started',
      label: STEP_LABELS.processing_started,
      status: order.status === 'confirmed' ? 'active' : 'completed',
      startedAt: order.confirmedAt || undefined,
    });
  } else if (['shipped', 'delivered', 'closed'].includes(order.status)) {
    steps.push({
      key: 'processing_started',
      label: STEP_LABELS.processing_started,
      status: 'completed',
      actualAt: order.processingAt || order.confirmedAt || undefined,
    });
  } else {
    steps.push({
      key: 'processing_started',
      label: STEP_LABELS.processing_started,
      status: ['cancelled', 'failed'].includes(order.status) ? 'skipped' : 'pending',
    });
  }

  // Step 5: Shipped
  const shippingConfig = SLA_CONFIG.shipped;
  const shippingStartTime = order.confirmedAt || order.createdAt;
  const shippingDeadline = order.shippingDeadline || calculateSLADeadline(shippingStartTime, shippingConfig);

  if (order.shippedAt) {
    const wasOnTime = order.shippedAt <= shippingDeadline;
    if (wasOnTime) slasMet++; else slasBreached++;
    const slaMetrics = calculateSLAMetrics(shippingStartTime, shippingDeadline, order.shippedAt);
    totalSlaUtilization += slaMetrics.percentUsed;
    slaCount++;

    steps.push({
      key: 'shipped',
      label: STEP_LABELS.shipped,
      status: 'completed',
      promisedAt: shippingDeadline,
      actualAt: order.shippedAt,
      slaDays: shippingConfig.days,
      slaDeadline: shippingDeadline,
      slaStatus: wasOnTime ? 'on_track' : 'breached',
      slaPercentUsed: slaMetrics.percentUsed,
    });
  } else if (['confirmed', 'processing', 'in_progress'].includes(order.status)) {
    const slaMetrics = calculateSLAMetrics(shippingStartTime, shippingDeadline, now);
    totalSlaUtilization += slaMetrics.percentUsed;
    slaCount++;

    steps.push({
      key: 'shipped',
      label: STEP_LABELS.shipped,
      status: 'active',
      promisedAt: shippingDeadline,
      startedAt: order.confirmedAt || undefined,
      slaDays: shippingConfig.days,
      slaDeadline: shippingDeadline,
      slaStatus: slaMetrics.status,
      slaPercentUsed: slaMetrics.percentUsed,
      slaTimeRemaining: slaMetrics.timeRemaining,
    });
  } else {
    steps.push({
      key: 'shipped',
      label: STEP_LABELS.shipped,
      status: ['cancelled', 'failed'].includes(order.status) ? 'skipped' : 'pending',
    });
  }

  // Step 6: Delivered
  const deliveryConfig = SLA_CONFIG.delivered;
  const deliveryStartTime = order.shippedAt || order.createdAt;
  const deliveryDeadline = order.deliveryDeadline || calculateSLADeadline(deliveryStartTime, deliveryConfig);

  if (order.deliveredAt) {
    const wasOnTime = order.deliveredAt <= deliveryDeadline;
    if (wasOnTime) slasMet++; else slasBreached++;
    const slaMetrics = calculateSLAMetrics(deliveryStartTime, deliveryDeadline, order.deliveredAt);
    totalSlaUtilization += slaMetrics.percentUsed;
    slaCount++;

    steps.push({
      key: 'delivered',
      label: STEP_LABELS.delivered,
      status: 'completed',
      promisedAt: deliveryDeadline,
      actualAt: order.deliveredAt,
      slaDays: deliveryConfig.days,
      slaDeadline: deliveryDeadline,
      slaStatus: wasOnTime ? 'on_track' : 'breached',
      slaPercentUsed: slaMetrics.percentUsed,
    });
  } else if (order.status === 'shipped') {
    const slaMetrics = calculateSLAMetrics(deliveryStartTime, deliveryDeadline, now);
    totalSlaUtilization += slaMetrics.percentUsed;
    slaCount++;

    steps.push({
      key: 'delivered',
      label: STEP_LABELS.delivered,
      status: 'active',
      promisedAt: deliveryDeadline,
      startedAt: order.shippedAt || undefined,
      slaDays: deliveryConfig.days,
      slaDeadline: deliveryDeadline,
      slaStatus: slaMetrics.status,
      slaPercentUsed: slaMetrics.percentUsed,
      slaTimeRemaining: slaMetrics.timeRemaining,
    });
  } else {
    steps.push({
      key: 'delivered',
      label: STEP_LABELS.delivered,
      status: ['cancelled', 'failed'].includes(order.status) ? 'skipped' : 'pending',
    });
  }

  // Step 7: Completed
  if (order.closedAt || order.status === 'closed') {
    steps.push({
      key: 'completed',
      label: STEP_LABELS.completed,
      status: 'completed',
      actualAt: order.closedAt || order.deliveredAt || undefined,
    });
  } else if (order.status === 'delivered') {
    steps.push({
      key: 'completed',
      label: STEP_LABELS.completed,
      status: 'active',
    });
  } else {
    steps.push({
      key: 'completed',
      label: STEP_LABELS.completed,
      status: ['cancelled', 'failed'].includes(order.status) ? 'skipped' : 'pending',
    });
  }

  // Build timeline events from audit log
  const events: TimelineEvent[] = auditLogs.map((log) => ({
    id: log.id,
    orderId: log.orderId,
    eventType: log.action,
    stepKey: mapAuditActionToStep(log.action),
    timestamp: log.createdAt,
    actor: log.actor as 'buyer' | 'seller' | 'system',
    actorId: log.actorId || undefined,
    title: getAuditActionTitle(log.action),
    description: log.newValue || undefined,
    metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
  }));

  // Calculate metrics
  const metrics = {
    totalLeadTime: order.deliveredAt
      ? (order.deliveredAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60)
      : undefined,
    confirmationTime: order.confirmedAt
      ? (order.confirmedAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60)
      : undefined,
    processingTime: order.shippedAt && order.confirmedAt
      ? (order.shippedAt.getTime() - order.confirmedAt.getTime()) / (1000 * 60 * 60)
      : undefined,
    shippingTime: order.deliveredAt && order.shippedAt
      ? (order.deliveredAt.getTime() - order.shippedAt.getTime()) / (1000 * 60 * 60)
      : undefined,
    slasMet,
    slasBreached,
    avgSlaUtilization: slaCount > 0 ? Math.round(totalSlaUtilization / slaCount) : 0,
    totalDelays: 0,
    totalDelayTime: 0,
    promisedDeliveryDate: deliveryDeadline,
    actualDeliveryDate: order.deliveredAt || undefined,
    deliveryVariance: order.deliveredAt
      ? Math.round((deliveryDeadline.getTime() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24))
      : undefined,
  };

  // Build risk assessment
  const riskAssessment = await assessOrderRisk(order, steps, metrics);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    currentStep,
    steps,
    events,
    metrics,
    riskAssessment,
  };
}

function mapAuditActionToStep(action: string): TimelineStepKey {
  const mapping: Record<string, TimelineStepKey> = {
    created: 'order_created',
    confirmed: 'seller_confirmed',
    processing_started: 'processing_started',
    shipped: 'shipped',
    delivered: 'delivered',
    closed: 'completed',
    cancelled: 'order_created',
    refunded: 'completed',
    payment_updated: 'payment_received',
  };
  return mapping[action] || 'order_created';
}

function getAuditActionTitle(action: string): string {
  const titles: Record<string, string> = {
    created: 'Order Created',
    confirmed: 'Order Confirmed',
    rejected: 'Order Rejected',
    processing_started: 'Processing Started',
    shipped: 'Order Shipped',
    delivered: 'Order Delivered',
    closed: 'Order Closed',
    cancelled: 'Order Cancelled',
    refunded: 'Order Refunded',
    note_added: 'Note Added',
    tracking_added: 'Tracking Updated',
    status_changed: 'Status Changed',
    payment_updated: 'Payment Updated',
    exception_resolved: 'Exception Resolved',
  };
  return titles[action] || action;
}

/**
 * Assess risk for an order - early warning system
 */
async function assessOrderRisk(
  order: MarketplaceOrder,
  steps: TimelineStep[],
  metrics: OrderTimelineResult['metrics']
): Promise<RiskAssessment> {
  const factors: RiskFactor[] = [];
  let riskScore = 0;
  const recommendations: string[] = [];
  const now = new Date();

  // Factor 1: SLA approaching/breached
  for (const step of steps) {
    if (step.status === 'active' && step.slaStatus) {
      if (step.slaStatus === 'breached') {
        factors.push({
          id: `sla_breached_${step.key}`,
          type: 'sla_breached',
          severity: 'critical',
          title: `SLA Breached: ${step.label}`,
          description: `The ${step.label} step has exceeded its SLA deadline`,
          impact: 'Customer satisfaction at risk, potential refund or dispute',
          recommendation: `Prioritize completing ${step.label} immediately`,
          detectedAt: now,
        });
        riskScore += 30;
        recommendations.push(`Urgent: Complete ${step.label} step immediately`);
      } else if (step.slaStatus === 'at_risk' && step.slaPercentUsed && step.slaPercentUsed >= 80) {
        factors.push({
          id: `sla_approaching_${step.key}`,
          type: 'sla_approaching',
          severity: step.slaPercentUsed >= 90 ? 'high' : 'medium',
          title: `SLA At Risk: ${step.label}`,
          description: `${step.slaPercentUsed}% of SLA time used for ${step.label}`,
          impact: 'Risk of SLA breach if not addressed soon',
          recommendation: `Complete ${step.label} within ${step.slaTimeRemaining}`,
          detectedAt: now,
        });
        riskScore += step.slaPercentUsed >= 90 ? 20 : 10;
        recommendations.push(`Action needed: ${step.slaTimeRemaining} to complete ${step.label}`);
      }
    }
  }

  // Factor 2: Payment pending on confirmed order
  if (
    ['confirmed', 'processing', 'in_progress'].includes(order.status) &&
    order.paymentStatus === 'unpaid'
  ) {
    factors.push({
      id: 'payment_pending',
      type: 'payment_pending',
      severity: 'medium',
      title: 'Payment Pending',
      description: 'Order is being processed but payment not yet received',
      impact: 'Financial risk if order ships without payment',
      recommendation: 'Follow up on payment before shipping',
      detectedAt: now,
    });
    riskScore += 15;
    recommendations.push('Verify payment status before shipping');
  }

  // Factor 3: High value order
  if (order.totalPrice >= 10000) {
    factors.push({
      id: 'high_value',
      type: 'high_value_order',
      severity: 'medium',
      title: 'High Value Order',
      description: `Order value is ${order.currency} ${order.totalPrice.toLocaleString()}`,
      impact: 'Higher financial exposure requires extra attention',
      recommendation: 'Ensure extra quality control and tracking',
      detectedAt: now,
    });
    riskScore += 5;
    recommendations.push('Apply enhanced handling for high-value order');
  }

  // Factor 4: Historical seller performance
  const sellerStats = await getSellerPerformanceStats(order.sellerId);
  if (sellerStats.avgOnTimeRate < 80) {
    factors.push({
      id: 'historical_pattern',
      type: 'historical_pattern',
      severity: sellerStats.avgOnTimeRate < 60 ? 'high' : 'medium',
      title: 'Historical Delay Pattern',
      description: `Seller has ${sellerStats.avgOnTimeRate}% on-time delivery rate`,
      impact: 'Higher likelihood of delays based on past performance',
      recommendation: 'Monitor closely and consider proactive communication',
      detectedAt: now,
    });
    riskScore += sellerStats.avgOnTimeRate < 60 ? 15 : 8;
  }

  // Factor 5: Active exception on order
  if (order.hasException) {
    factors.push({
      id: 'active_exception',
      type: 'delay_reported',
      severity: order.exceptionSeverity === 'critical' ? 'critical' :
               order.exceptionSeverity === 'error' ? 'high' : 'medium',
      title: 'Active Exception',
      description: order.exceptionMessage || 'Order has an active exception',
      impact: 'Order progress is impacted',
      recommendation: 'Resolve exception to continue order processing',
      detectedAt: now,
    });
    riskScore += order.exceptionSeverity === 'critical' ? 25 : 15;
    recommendations.push('Resolve active exception');
  }

  // Calculate overall risk level
  let overallRisk: RiskLevel;
  if (riskScore >= 50) {
    overallRisk = 'critical';
  } else if (riskScore >= 30) {
    overallRisk = 'high';
  } else if (riskScore >= 15) {
    overallRisk = 'medium';
  } else {
    overallRisk = 'low';
  }

  // Predict delivery date based on current progress and seller history
  const predictedDelivery = await predictDeliveryDate(order, steps, sellerStats);

  return {
    overallRisk,
    riskScore: Math.min(100, riskScore),
    factors,
    recommendations,
    lastAssessedAt: now,
    predictedDeliveryDate: predictedDelivery.date,
    predictionConfidence: predictedDelivery.confidence,
  };
}

/**
 * Get seller performance statistics
 */
async function getSellerPerformanceStats(sellerId: string): Promise<{
  avgOnTimeRate: number;
  totalOrders: number;
  avgLeadTime: number;
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completedOrders = await prisma.marketplaceOrder.findMany({
    where: {
      sellerId,
      status: { in: ['delivered', 'closed'] },
      deliveredAt: { gte: thirtyDaysAgo },
    },
    select: {
      deliveredAt: true,
      deliveryDeadline: true,
      createdAt: true,
    },
  });

  if (completedOrders.length === 0) {
    return { avgOnTimeRate: 85, totalOrders: 0, avgLeadTime: 72 }; // Default for new sellers
  }

  let onTimeCount = 0;
  let totalLeadTime = 0;

  for (const order of completedOrders) {
    if (order.deliveredAt && order.deliveryDeadline) {
      if (order.deliveredAt <= order.deliveryDeadline) {
        onTimeCount++;
      }
    }
    if (order.deliveredAt) {
      totalLeadTime += (order.deliveredAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60);
    }
  }

  return {
    avgOnTimeRate: Math.round((onTimeCount / completedOrders.length) * 100),
    totalOrders: completedOrders.length,
    avgLeadTime: Math.round(totalLeadTime / completedOrders.length),
  };
}

/**
 * Predict delivery date based on current state and history
 */
async function predictDeliveryDate(
  order: MarketplaceOrder,
  steps: TimelineStep[],
  sellerStats: { avgOnTimeRate: number; avgLeadTime: number }
): Promise<{ date?: Date; confidence: number }> {
  // If already delivered, return actual date
  if (order.deliveredAt) {
    return { date: order.deliveredAt, confidence: 100 };
  }

  // If shipped, estimate based on delivery deadline
  if (order.shippedAt) {
    const deliveryDeadline = order.deliveryDeadline ||
      new Date(order.shippedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    // Adjust based on seller performance
    const adjustmentFactor = sellerStats.avgOnTimeRate < 70 ? 1.2 : 1;
    const adjustedDate = new Date(
      order.shippedAt.getTime() +
      (deliveryDeadline.getTime() - order.shippedAt.getTime()) * adjustmentFactor
    );
    return { date: adjustedDate, confidence: 75 };
  }

  // If confirmed but not shipped, estimate based on shipping + delivery time
  if (order.confirmedAt) {
    const expectedShipDate = new Date(
      order.confirmedAt.getTime() + 3 * 24 * 60 * 60 * 1000
    );
    const expectedDeliveryDate = new Date(
      expectedShipDate.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    return { date: expectedDeliveryDate, confidence: 50 };
  }

  // If pending confirmation, use full lead time estimate
  const fullLeadTime = sellerStats.avgLeadTime || 10 * 24; // Default 10 days in hours
  const predictedDate = new Date(
    order.createdAt.getTime() + fullLeadTime * 60 * 60 * 1000
  );
  return { date: predictedDate, confidence: 30 };
}

/**
 * Record a delay reason for an order
 */
export async function recordOrderDelay(
  orderId: string,
  sellerId: string,
  data: {
    reasonCode: DelayReasonCode;
    customReason?: string;
    affectedStep: TimelineStepKey;
    estimatedResolution?: Date;
    impactDays: number;
    notes?: string;
  }
): Promise<void> {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
  });

  if (!order || order.sellerId !== sellerId) {
    throw new Error('Order not found or unauthorized');
  }

  // Create audit log entry for the delay
  await prisma.marketplaceOrderAudit.create({
    data: {
      orderId,
      action: 'delay_reported',
      actor: 'seller',
      actorId: sellerId,
      newValue: data.reasonCode,
      metadata: JSON.stringify({
        reasonCode: data.reasonCode,
        customReason: data.customReason,
        affectedStep: data.affectedStep,
        estimatedResolution: data.estimatedResolution,
        impactDays: data.impactDays,
        notes: data.notes,
      }),
    },
  });

  // Update order with exception if significant delay
  if (data.impactDays >= 1) {
    await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        hasException: true,
        exceptionType: 'shipping_delay',
        exceptionSeverity: data.impactDays >= 3 ? 'error' : 'warning',
        exceptionMessage: data.customReason || `Delay: ${data.reasonCode.replace(/_/g, ' ')}`,
        exceptionCreatedAt: new Date(),
      },
    });
  }
}

/**
 * Get orders with SLA warnings for a seller (early risk detection)
 */
export async function getOrdersAtRisk(
  sellerId: string,
  options: { includeAtRisk?: boolean; includeCritical?: boolean } = {}
): Promise<any[]> {
  const { includeAtRisk = true, includeCritical = true } = options;

  const healthStatuses = [];
  if (includeAtRisk) healthStatuses.push('at_risk');
  if (includeCritical) healthStatuses.push('critical', 'delayed');

  const orders = await prisma.marketplaceOrder.findMany({
    where: {
      sellerId,
      status: { notIn: ['delivered', 'closed', 'cancelled', 'failed', 'refunded'] },
      healthStatus: { in: healthStatuses },
    },
    orderBy: [
      { healthStatus: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  // Enrich with timeline data
  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      const timeline = await buildOrderTimeline(order.id);
      return {
        ...order,
        timeline: {
          currentStep: timeline.currentStep,
          activeStep: timeline.steps.find(s => s.status === 'active'),
          riskAssessment: timeline.riskAssessment,
        },
      };
    })
  );

  return enrichedOrders;
}

/**
 * Get SLA breach summary for dashboard
 */
export async function getSLABreachSummary(
  sellerId: string,
  period: 'week' | 'month' | 'quarter' = 'month'
): Promise<{
  totalOrders: number;
  onTimeDeliveries: number;
  slaBreaches: number;
  byStep: Record<string, { met: number; breached: number }>;
  trend: 'improving' | 'declining' | 'stable';
}> {
  const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - periodDays);

  // Get all completed orders in period
  const orders = await prisma.marketplaceOrder.findMany({
    where: {
      sellerId,
      status: { in: ['delivered', 'closed'] },
      deliveredAt: { gte: dateFrom },
    },
    select: {
      id: true,
      createdAt: true,
      confirmedAt: true,
      shippedAt: true,
      deliveredAt: true,
      confirmationDeadline: true,
      shippingDeadline: true,
      deliveryDeadline: true,
    },
  });

  let onTimeDeliveries = 0;
  let slaBreaches = 0;
  const byStep: Record<string, { met: number; breached: number }> = {
    confirmation: { met: 0, breached: 0 },
    shipping: { met: 0, breached: 0 },
    delivery: { met: 0, breached: 0 },
  };

  for (const order of orders) {
    // Check confirmation SLA
    if (order.confirmedAt && order.confirmationDeadline) {
      if (order.confirmedAt <= order.confirmationDeadline) {
        byStep.confirmation.met++;
      } else {
        byStep.confirmation.breached++;
        slaBreaches++;
      }
    }

    // Check shipping SLA
    if (order.shippedAt && order.shippingDeadline) {
      if (order.shippedAt <= order.shippingDeadline) {
        byStep.shipping.met++;
      } else {
        byStep.shipping.breached++;
        slaBreaches++;
      }
    }

    // Check delivery SLA
    if (order.deliveredAt && order.deliveryDeadline) {
      if (order.deliveredAt <= order.deliveryDeadline) {
        byStep.delivery.met++;
        onTimeDeliveries++;
      } else {
        byStep.delivery.breached++;
        slaBreaches++;
      }
    }
  }

  // Calculate trend (compare to previous period)
  // For simplicity, we'll return 'stable' - full implementation would compare periods
  const trend: 'improving' | 'declining' | 'stable' = 'stable';

  return {
    totalOrders: orders.length,
    onTimeDeliveries,
    slaBreaches,
    byStep,
    trend,
  };
}

// =============================================================================
// Export
// =============================================================================

export const orderTimelineService = {
  buildOrderTimeline,
  recordOrderDelay,
  getOrdersAtRisk,
  getSLABreachSummary,
  getSellerPerformanceStats,
};

export default orderTimelineService;
