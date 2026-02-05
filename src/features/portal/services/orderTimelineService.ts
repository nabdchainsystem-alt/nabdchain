// =============================================================================
// Order Timeline Service - Frontend API Client
// =============================================================================
// API calls for order timeline, SLA tracking, and risk assessment
// =============================================================================

import {
  OrderTimeline,
  TimelineStep,
  RiskAssessment,
  DelayReasonCode,
  TimelineStepKey,
} from '../types/timeline.types';

const API_BASE = '/api/orders';

// =============================================================================
// Types
// =============================================================================

export interface DelayReasonInput {
  reasonCode: DelayReasonCode;
  customReason?: string;
  affectedStep: TimelineStepKey;
  estimatedResolution?: string;
  impactDays: number;
  notes?: string;
}

export interface SLABreachSummary {
  totalOrders: number;
  onTimeDeliveries: number;
  slaBreaches: number;
  byStep: Record<string, { met: number; breached: number }>;
  trend: 'improving' | 'declining' | 'stable';
}

export interface SellerPerformance {
  avgOnTimeRate: number;
  totalOrders: number;
  avgLeadTime: number;
}

export interface OrderWithRisk {
  id: string;
  orderNumber: string;
  itemName: string;
  buyerName?: string;
  status: string;
  healthStatus: string;
  createdAt: string;
  timeline?: {
    currentStep: string;
    activeStep?: TimelineStep;
    riskAssessment: RiskAssessment;
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get complete timeline for an order including risk assessment
 */
export async function getOrderTimeline(
  orderId: string,
  sellerId: string
): Promise<OrderTimeline> {
  const response = await fetch(`${API_BASE}/timeline/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-seller-id': sellerId,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch order timeline');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Report a delay on an order
 */
export async function reportOrderDelay(
  orderId: string,
  sellerId: string,
  data: DelayReasonInput
): Promise<void> {
  const response = await fetch(`${API_BASE}/${orderId}/delay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-seller-id': sellerId,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to report delay');
  }
}

/**
 * Get orders that are at risk or have SLA breaches
 */
export async function getOrdersAtRisk(
  sellerId: string,
  options?: {
    includeAtRisk?: boolean;
    includeCritical?: boolean;
  }
): Promise<OrderWithRisk[]> {
  const params = new URLSearchParams();
  if (options?.includeAtRisk !== undefined) {
    params.set('includeAtRisk', String(options.includeAtRisk));
  }
  if (options?.includeCritical !== undefined) {
    params.set('includeCritical', String(options.includeCritical));
  }

  const url = `${API_BASE}/at-risk${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-seller-id': sellerId,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch at-risk orders');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get SLA breach summary for dashboard
 */
export async function getSLABreachSummary(
  sellerId: string,
  period: 'week' | 'month' | 'quarter' = 'month'
): Promise<SLABreachSummary> {
  const response = await fetch(`${API_BASE}/sla-summary?period=${period}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-seller-id': sellerId,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch SLA summary');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get seller performance statistics
 */
export async function getSellerPerformance(sellerId: string): Promise<SellerPerformance> {
  const response = await fetch(`${API_BASE}/seller-performance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-seller-id': sellerId,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch seller performance');
  }

  const result = await response.json();
  return result.data;
}

// =============================================================================
// Mock Data for Development
// =============================================================================

/**
 * Generate mock timeline data for an order (used when API is not available)
 */
export function generateMockTimeline(order: {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}): Partial<OrderTimeline> {
  const now = new Date();
  const created = new Date(order.createdAt);

  const steps: TimelineStep[] = [
    {
      key: 'order_created',
      label: 'Order Created',
      icon: 'Package',
      status: 'completed',
      actualAt: order.createdAt,
    },
  ];

  // Add confirmed step
  if (order.confirmedAt || ['confirmed', 'processing', 'in_progress', 'shipped', 'delivered', 'closed'].includes(order.status)) {
    const confirmDeadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);
    const actualConfirm = order.confirmedAt ? new Date(order.confirmedAt) : null;

    steps.push({
      key: 'seller_confirmed',
      label: 'Seller Confirmed',
      icon: 'CheckCircle',
      status: actualConfirm ? 'completed' : 'active',
      promisedAt: confirmDeadline.toISOString(),
      actualAt: order.confirmedAt,
      slaHours: 24,
      slaDeadline: confirmDeadline.toISOString(),
      slaStatus: actualConfirm
        ? (actualConfirm <= confirmDeadline ? 'on_track' : 'breached')
        : (now <= confirmDeadline ? (((now.getTime() - created.getTime()) / (confirmDeadline.getTime() - created.getTime())) >= 0.8 ? 'at_risk' : 'on_track') : 'breached'),
      slaPercentUsed: actualConfirm
        ? Math.round(((actualConfirm.getTime() - created.getTime()) / (confirmDeadline.getTime() - created.getTime())) * 100)
        : Math.min(100, Math.round(((now.getTime() - created.getTime()) / (confirmDeadline.getTime() - created.getTime())) * 100)),
    });
  } else {
    steps.push({
      key: 'seller_confirmed',
      label: 'Seller Confirmed',
      icon: 'CheckCircle',
      status: 'pending',
    });
  }

  // Add shipped step
  if (order.shippedAt || ['shipped', 'delivered', 'closed'].includes(order.status)) {
    steps.push({
      key: 'shipped',
      label: 'Shipped',
      icon: 'Truck',
      status: order.shippedAt ? 'completed' : 'active',
      actualAt: order.shippedAt,
    });
  } else {
    steps.push({
      key: 'shipped',
      label: 'Shipped',
      icon: 'Truck',
      status: ['confirmed', 'processing', 'in_progress'].includes(order.status) ? 'active' : 'pending',
    });
  }

  // Add delivered step
  if (order.deliveredAt || ['delivered', 'closed'].includes(order.status)) {
    steps.push({
      key: 'delivered',
      label: 'Delivered',
      icon: 'Package',
      status: order.deliveredAt ? 'completed' : 'active',
      actualAt: order.deliveredAt,
    });
  } else {
    steps.push({
      key: 'delivered',
      label: 'Delivered',
      icon: 'Package',
      status: order.status === 'shipped' ? 'active' : 'pending',
    });
  }

  // Add completed step
  steps.push({
    key: 'completed',
    label: 'Completed',
    icon: 'CheckCircle',
    status: order.status === 'closed' ? 'completed' : 'pending',
  });

  // Calculate mock risk assessment
  const riskFactors: RiskAssessment['factors'] = [];
  let riskScore = 0;

  // Check for active SLAs approaching
  const activeStep = steps.find(s => s.status === 'active');
  if (activeStep?.slaPercentUsed && activeStep.slaPercentUsed >= 80) {
    riskFactors.push({
      id: `sla_${activeStep.key}`,
      type: activeStep.slaPercentUsed >= 100 ? 'sla_breached' : 'sla_approaching',
      severity: activeStep.slaPercentUsed >= 100 ? 'critical' : 'medium',
      title: activeStep.slaPercentUsed >= 100 ? 'SLA Breached' : 'SLA Approaching',
      description: `${activeStep.slaPercentUsed}% of SLA time used`,
      impact: 'Customer satisfaction at risk',
      recommendation: 'Complete this step as soon as possible',
      detectedAt: now.toISOString(),
    });
    riskScore += activeStep.slaPercentUsed >= 100 ? 30 : 15;
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    currentStep: activeStep?.key || 'order_created',
    steps,
    events: [],
    delays: [],
    metrics: {
      slasMet: steps.filter(s => s.status === 'completed' && s.slaStatus === 'on_track').length,
      slasBreached: steps.filter(s => s.slaStatus === 'breached').length,
      avgSlaUtilization: 50,
      totalDelays: 0,
      totalDelayTime: 0,
    },
    riskAssessment: {
      overallRisk: riskScore >= 30 ? 'high' : riskScore >= 15 ? 'medium' : 'low',
      riskScore,
      factors: riskFactors,
      recommendations: riskFactors.map(f => f.recommendation),
      lastAssessedAt: now.toISOString(),
    },
  };
}

// =============================================================================
// Export
// =============================================================================

export const orderTimelineApiService = {
  getOrderTimeline,
  reportOrderDelay,
  getOrdersAtRisk,
  getSLABreachSummary,
  getSellerPerformance,
  generateMockTimeline,
};

export default orderTimelineApiService;
