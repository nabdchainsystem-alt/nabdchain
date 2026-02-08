// =============================================================================
// Order Timeline Service - Frontend API Client
// =============================================================================
// API calls for order timeline, SLA tracking, and risk assessment
// Uses JWT Bearer token authentication (no legacy x-seller-id header)
// =============================================================================

import { portalApiClient } from './portalApiClient';
import { OrderTimeline, TimelineStep, RiskAssessment, DelayReasonCode, TimelineStepKey } from '../types/timeline.types';

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

interface ApiResult<T> {
  data: T;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get complete timeline for an order including risk assessment
 * Uses JWT Bearer token for authentication (sellerId param kept for API compatibility)
 */
export async function getOrderTimeline(orderId: string, _sellerId: string): Promise<OrderTimeline> {
  const result = await portalApiClient.get<ApiResult<OrderTimeline>>(`/api/orders/timeline/${orderId}`);
  return result.data;
}

/**
 * Report a delay on an order
 * Uses JWT Bearer token for authentication (sellerId param kept for API compatibility)
 */
export async function reportOrderDelay(orderId: string, _sellerId: string, data: DelayReasonInput): Promise<void> {
  await portalApiClient.post(`/api/orders/${orderId}/delay`, data);
}

/**
 * Get orders that are at risk or have SLA breaches
 * Uses JWT Bearer token for authentication (sellerId param kept for API compatibility)
 */
export async function getOrdersAtRisk(
  _sellerId: string,
  options?: {
    includeAtRisk?: boolean;
    includeCritical?: boolean;
  },
): Promise<OrderWithRisk[]> {
  const params = new URLSearchParams();
  if (options?.includeAtRisk !== undefined) {
    params.set('includeAtRisk', String(options.includeAtRisk));
  }
  if (options?.includeCritical !== undefined) {
    params.set('includeCritical', String(options.includeCritical));
  }

  const queryString = params.toString();
  const url = `/api/orders/at-risk${queryString ? `?${queryString}` : ''}`;

  const result = await portalApiClient.get<ApiResult<OrderWithRisk[]>>(url);
  return result.data;
}

/**
 * Get SLA breach summary for dashboard
 * Uses JWT Bearer token for authentication (sellerId param kept for API compatibility)
 */
export async function getSLABreachSummary(
  _sellerId: string,
  period: 'week' | 'month' | 'quarter' = 'month',
): Promise<SLABreachSummary> {
  const result = await portalApiClient.get<ApiResult<SLABreachSummary>>(`/api/orders/sla-summary?period=${period}`);
  return result.data;
}

/**
 * Get seller performance statistics
 * Uses JWT Bearer token for authentication (sellerId param kept for API compatibility)
 */
export async function getSellerPerformance(_sellerId: string): Promise<SellerPerformance> {
  const result = await portalApiClient.get<ApiResult<SellerPerformance>>('/api/orders/seller-performance');
  return result.data;
}

// NOTE: Mock data (generateMockTimeline) removed - see MOCK_REMOVAL_REPORT.md
// All timeline data must come from API. Frontend handles empty states gracefully.

// =============================================================================
// Export
// =============================================================================

export const orderTimelineApiService = {
  getOrderTimeline,
  reportOrderDelay,
  getOrdersAtRisk,
  getSLABreachSummary,
  getSellerPerformance,
};

export default orderTimelineApiService;
