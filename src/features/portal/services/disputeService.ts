// =============================================================================
// Dispute Service - Frontend API Client for Marketplace Disputes (Stage 7)
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  MarketplaceDispute,
  DisputeFilters,
  DisputeStats,
  DisputeEvent,
  CreateDisputeData,
  SellerRespondData,
  RejectResolutionData,
  EscalateDisputeData,
  AddEvidenceData,
} from '../types/dispute.types';

// =============================================================================
// Types
// =============================================================================

interface PaginatedDisputeResponse {
  disputes: MarketplaceDispute[];
  total: number;
  page: number;
  limit: number;
}

// =============================================================================
// Helper
// =============================================================================

function buildDisputeQS(filters: DisputeFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.reason) p.append('reason', filters.reason);
  if (filters.priority) p.append('priority', filters.priority);
  if (filters.search) p.append('search', filters.search);
  if (filters.dateFrom) p.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) p.append('dateTo', filters.dateTo);
  if (filters.page) p.append('page', filters.page.toString());
  if (filters.limit) p.append('limit', filters.limit.toString());
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// =============================================================================
// Dispute Service
// =============================================================================

export const disputeService = {
  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  async createDispute(data: CreateDisputeData): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/buyer`, data);
  },

  async getBuyerDisputes(filters: DisputeFilters = {}): Promise<PaginatedDisputeResponse> {
    return portalApiClient.get<PaginatedDisputeResponse>(`/api/disputes/buyer${buildDisputeQS(filters)}`);
  },

  async getBuyerDisputeStats(): Promise<DisputeStats> {
    return portalApiClient.get<DisputeStats>(`/api/disputes/buyer/stats`);
  },

  async getBuyerDispute(disputeId: string): Promise<MarketplaceDispute | null> {
    try {
      return await portalApiClient.get<MarketplaceDispute>(`/api/disputes/buyer/${disputeId}`);
    } catch {
      return null;
    }
  },

  async acceptResolution(disputeId: string): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/buyer/${disputeId}/accept`);
  },

  async rejectResolution(disputeId: string, data: RejectResolutionData): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/buyer/${disputeId}/reject`, data);
  },

  async buyerEscalate(disputeId: string, data: EscalateDisputeData): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/buyer/${disputeId}/escalate`, data);
  },

  async addEvidence(disputeId: string, data: AddEvidenceData): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/buyer/${disputeId}/evidence`, data);
  },

  async buyerCloseDispute(disputeId: string): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/buyer/${disputeId}/close`);
  },

  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  async getSellerDisputes(filters: DisputeFilters = {}): Promise<PaginatedDisputeResponse> {
    return portalApiClient.get<PaginatedDisputeResponse>(`/api/disputes/seller${buildDisputeQS(filters)}`);
  },

  async getSellerDisputeStats(): Promise<DisputeStats> {
    return portalApiClient.get<DisputeStats>(`/api/disputes/seller/stats`);
  },

  async getSellerDispute(disputeId: string): Promise<MarketplaceDispute | null> {
    try {
      return await portalApiClient.get<MarketplaceDispute>(`/api/disputes/seller/${disputeId}`);
    } catch {
      return null;
    }
  },

  async markAsUnderReview(disputeId: string): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/seller/${disputeId}/review`);
  },

  async respondToDispute(disputeId: string, data: SellerRespondData): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/seller/${disputeId}/respond`, data);
  },

  async sellerEscalate(disputeId: string, data: EscalateDisputeData): Promise<MarketplaceDispute> {
    return portalApiClient.post<MarketplaceDispute>(`/api/disputes/seller/${disputeId}/escalate`, data);
  },

  // ---------------------------------------------------------------------------
  // Shared Operations
  // ---------------------------------------------------------------------------

  async getDisputeHistory(disputeId: string): Promise<DisputeEvent[]> {
    return portalApiClient.get<DisputeEvent[]>(`/api/disputes/${disputeId}/history`);
  },

  async getDisputeByOrder(orderId: string): Promise<MarketplaceDispute | null> {
    try {
      return await portalApiClient.get<MarketplaceDispute>(`/api/disputes/order/${orderId}`);
    } catch {
      return null;
    }
  },
};

export default disputeService;
