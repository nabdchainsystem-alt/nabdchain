/**
 * Portal AI Service -- Frontend client for /api/ai/* gateway endpoints
 *
 * Single service, single auth strategy (Bearer token via portalApiClient).
 * All AI calls go through the backend -- no Gemini key in browser.
 */
import { portalApiClient } from './portalApiClient';

// ============================================================================
// Types
// ============================================================================

export interface AIInsight {
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
}

export interface AIRisk {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIAction {
  title: string;
  description: string;
  deepLink?: string;
}

export interface AIInsightResponse {
  success: boolean;
  data: {
    summary: string;
    insights: AIInsight[];
    risks: AIRisk[];
    recommendedActions: AIAction[];
    confidence: number;
    dataUsed: string[];
  };
  error?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Generate business insights for the workspace
 */
async function getInsights(params: {
  role: 'buyer' | 'seller';
  focusArea?: string;
  language?: 'en' | 'ar';
}): Promise<AIInsightResponse> {
  return portalApiClient.post<AIInsightResponse>('/api/ai/insights', params);
}

/**
 * AI-draft an RFQ message
 */
async function draftRFQ(params: {
  itemName: string;
  quantity: number;
  requirements?: string;
  deliveryTimeline?: string;
  budget?: string;
  language?: 'en' | 'ar';
}): Promise<AIInsightResponse> {
  return portalApiClient.post<AIInsightResponse>('/api/ai/rfq-draft', params);
}

/**
 * Compare quotes for an RFQ
 */
async function compareQuotes(params: { rfqId: string; language?: 'en' | 'ar' }): Promise<AIInsightResponse> {
  return portalApiClient.post<AIInsightResponse>('/api/ai/quote-compare', params);
}

/**
 * Summarize workspace activity
 */
async function getWorkspaceSummary(params: {
  role: 'buyer' | 'seller';
  period?: '7d' | '30d' | '90d';
  language?: 'en' | 'ar';
}): Promise<AIInsightResponse> {
  return portalApiClient.post<AIInsightResponse>('/api/ai/workspace-summary', params);
}

/**
 * Get AI summary for a specific order
 */
async function getOrderSummary(params: { orderId: string; language?: 'en' | 'ar' }): Promise<AIInsightResponse> {
  return portalApiClient.post<AIInsightResponse>('/api/ai/order-summary', params);
}

/**
 * Get AI risk assessment for a specific invoice
 */
async function getInvoiceRisk(params: { invoiceId: string; language?: 'en' | 'ar' }): Promise<AIInsightResponse> {
  return portalApiClient.post<AIInsightResponse>('/api/ai/invoice-risk', params);
}

// ============================================================================
// Intelligence Feed Service
// ============================================================================

export interface InsightEvent {
  id: string;
  userId: string;
  role: string;
  entityType: string;
  entityId: string | null;
  insightType: string;
  title: string;
  summary: string;
  severity: string;
  confidence: number;
  payload: string | null;
  status: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsightFeedResponse {
  success: boolean;
  data: {
    items: InsightEvent[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

async function getInsightFeed(params: {
  role: 'buyer' | 'seller';
  status?: string;
  entityType?: string;
  insightType?: string;
  limit?: number;
  cursor?: string;
}): Promise<InsightFeedResponse> {
  const query = new URLSearchParams();
  query.set('role', params.role);
  if (params.status) query.set('status', params.status);
  if (params.entityType) query.set('entityType', params.entityType);
  if (params.insightType) query.set('insightType', params.insightType);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);

  return portalApiClient.get<InsightFeedResponse>(`/api/workspace/intelligence/feed?${query}`);
}

async function getInsightCount(role: 'buyer' | 'seller'): Promise<{ success: boolean; data: { count: number } }> {
  return portalApiClient.get<{ success: boolean; data: { count: number } }>(
    `/api/workspace/intelligence/count?role=${role}`,
  );
}

async function resolveInsight(eventId: string): Promise<{ success: boolean }> {
  return portalApiClient.post<{ success: boolean }>(`/api/workspace/intelligence/${eventId}/resolve`);
}

async function dismissInsight(eventId: string): Promise<{ success: boolean }> {
  return portalApiClient.post<{ success: boolean }>(`/api/workspace/intelligence/${eventId}/dismiss`);
}

export const portalAIService = {
  getInsights,
  draftRFQ,
  compareQuotes,
  getWorkspaceSummary,
  getOrderSummary,
  getInvoiceRisk,
  getInsightFeed,
  getInsightCount,
  resolveInsight,
  dismissInsight,
};
