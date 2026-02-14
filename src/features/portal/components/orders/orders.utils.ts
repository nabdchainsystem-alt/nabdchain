// =============================================================================
// Unified Orders - Shared Utility Functions
// =============================================================================

import type { Order, OrderRole, SLAResult, DeliveryResult } from './orders.types';
import { SLA_CONFIG } from './orders.types';

// Re-export formatters from canonical source
export { formatRelativeTime, formatCurrency, formatTimestamp } from '../../utils/formatters';

// =============================================================================
// SLA Calculation (Seller)
// =============================================================================

const SLA_MICROCOPY = {
  ok: 'On track',
  warning: 'Needs attention',
  critical: 'SLA breached',
  waiting: 'Waiting for buyer',
};

export const calculateSLARemaining = (order: Order): SLAResult | null => {
  const now = new Date();
  let deadline: Date | null = null;
  let startTime: Date;
  let slaType = '';

  if (order.status === 'pending_confirmation') {
    startTime = new Date(order.createdAt);
    deadline = new Date(startTime.getTime() + SLA_CONFIG.confirmation.hours * 60 * 60 * 1000);
    slaType = SLA_CONFIG.confirmation.label;
  } else if (order.status === 'confirmed' || order.status === 'processing') {
    startTime = order.confirmedAt ? new Date(order.confirmedAt) : new Date(order.createdAt);
    deadline = new Date(startTime.getTime() + SLA_CONFIG.shipping.hours * 60 * 60 * 1000);
    slaType = SLA_CONFIG.shipping.label;
  } else if (order.status === 'shipped') {
    startTime = order.shippedAt ? new Date(order.shippedAt) : new Date(order.createdAt);
    deadline = new Date(startTime.getTime() + SLA_CONFIG.delivery.days * 24 * 60 * 60 * 1000);
    slaType = SLA_CONFIG.delivery.label;
  } else {
    return null;
  }

  if (!deadline) return null;

  const totalMs = deadline.getTime() - startTime!.getTime();
  const elapsedMs = now.getTime() - startTime!.getTime();
  const diffMs = deadline.getTime() - now.getTime();
  const hours = Math.floor(Math.abs(diffMs) / (60 * 60 * 1000));
  const minutes = Math.floor((Math.abs(diffMs) % (60 * 60 * 1000)) / (60 * 1000));
  const isOverdue = diffMs < 0;
  const percentUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

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

  let urgency: 'ok' | 'warning' | 'critical';
  let statusText: string;

  if (isOverdue) {
    urgency = 'critical';
    statusText = SLA_MICROCOPY.critical;
  } else if (percentUsed >= 80) {
    urgency = 'warning';
    statusText = SLA_MICROCOPY.warning;
  } else {
    urgency = 'ok';
    statusText = SLA_MICROCOPY.ok;
  }

  const text = isOverdue ? timeText : `${slaType} in ${hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`}`;

  return { hours, text, statusText, timeText, isOverdue, urgency, percentUsed };
};

// =============================================================================
// Delivery Status (Buyer)
// =============================================================================

export const getDeliveryStatus = (order: Order): DeliveryResult | null => {
  if (!['shipped', 'processing', 'confirmed'].includes(order.status)) {
    if (order.status === 'delivered' || order.status === 'closed') {
      return { text: 'Delivered', urgency: 'ok' };
    }
    return null;
  }

  if (order.estimatedDelivery) {
    const deliveryDate = new Date(order.estimatedDelivery);
    const now = new Date();
    const diffMs = deliveryDate.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return { text: `${Math.abs(days)}d overdue`, urgency: 'overdue', daysRemaining: days };
    } else if (days <= 2) {
      return { text: `${days}d remaining`, urgency: 'soon', daysRemaining: days };
    } else {
      return { text: `${days}d remaining`, urgency: 'ok', daysRemaining: days };
    }
  }

  if (order.status === 'shipped') {
    return { text: 'In transit', urgency: 'ok' };
  }
  return { text: 'Processing', urgency: 'ok' };
};

// =============================================================================
// Needs Action Helpers
// =============================================================================

export const needsActionToday = (order: Order): boolean => {
  if (['delivered', 'closed', 'cancelled', 'failed', 'refunded'].includes(order.status)) {
    return false;
  }
  const sla = calculateSLARemaining(order);
  if (!sla) return false;
  return sla.hours <= 24 || sla.isOverdue;
};

export const needsAttention = (order: Order): boolean => {
  if (order.status === 'pending_confirmation') return false;
  if (order.status === 'shipped') {
    const delivery = getDeliveryStatus(order);
    return delivery?.urgency === 'overdue';
  }
  if (order.healthStatus === 'at_risk' || order.healthStatus === 'delayed' || order.healthStatus === 'critical') {
    return true;
  }
  return false;
};

export const orderNeedsAction = (order: Order, role: OrderRole): boolean => {
  return role === 'seller' ? needsActionToday(order) : needsAttention(order);
};

// =============================================================================
// Order Completion Check
// =============================================================================

export const isOrderFullyComplete = (order: Order): boolean => {
  return (
    ['delivered', 'closed'].includes(order.status) &&
    ['paid', 'paid_cash'].includes(order.paymentStatus) &&
    !!order.invoiceId
  );
};

// =============================================================================
// Status Color Maps
// =============================================================================

export const getStatusColors = (styles: {
  warning: string;
  info: string;
  success: string;
  error: string;
  textMuted: string;
  bgSecondary: string;
  isDark: boolean;
}) => {
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
  return { colorMap, bgColorMap };
};
