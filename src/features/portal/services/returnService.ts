// =============================================================================
// Return Service - Frontend API Client for Marketplace Returns (Stage 7)
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  MarketplaceReturn,
  ReturnFilters,
  ReturnStats,
  ReturnEvent,
  CreateReturnData,
  ApproveReturnData,
  RejectReturnData,
  ShipReturnData,
  ReceiveReturnData,
  ProcessRefundData,
} from '../types/return.types';

// =============================================================================
// Types
// =============================================================================

interface PaginatedReturnResponse {
  returns: MarketplaceReturn[];
  total: number;
  page: number;
  limit: number;
}

// =============================================================================
// Helper
// =============================================================================

function buildReturnQS(filters: ReturnFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.search) p.append('search', filters.search);
  if (filters.dateFrom) p.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) p.append('dateTo', filters.dateTo);
  if (filters.page) p.append('page', filters.page.toString());
  if (filters.limit) p.append('limit', filters.limit.toString());
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// =============================================================================
// Return Service
// =============================================================================

export const returnService = {
  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  async getBuyerReturns(filters: ReturnFilters = {}): Promise<PaginatedReturnResponse> {
    return portalApiClient.get<PaginatedReturnResponse>(`/api/returns/buyer${buildReturnQS(filters)}`);
  },

  async getBuyerReturn(returnId: string): Promise<MarketplaceReturn | null> {
    try {
      return await portalApiClient.get<MarketplaceReturn>(`/api/returns/buyer/${returnId}`);
    } catch {
      return null;
    }
  },

  async shipReturn(returnId: string, data: ShipReturnData): Promise<MarketplaceReturn> {
    return portalApiClient.post<MarketplaceReturn>(`/api/returns/buyer/${returnId}/ship`, data);
  },

  async getBuyerReturnHistory(returnId: string): Promise<ReturnEvent[]> {
    return portalApiClient.get<ReturnEvent[]>(`/api/returns/buyer/${returnId}/history`);
  },

  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  async getSellerReturns(filters: ReturnFilters = {}): Promise<PaginatedReturnResponse> {
    return portalApiClient.get<PaginatedReturnResponse>(`/api/returns/seller${buildReturnQS(filters)}`);
  },

  async getSellerReturnStats(): Promise<ReturnStats> {
    return portalApiClient.get<ReturnStats>(`/api/returns/seller/stats`);
  },

  async getSellerReturn(returnId: string): Promise<MarketplaceReturn | null> {
    try {
      return await portalApiClient.get<MarketplaceReturn>(`/api/returns/seller/${returnId}`);
    } catch {
      return null;
    }
  },

  async approveReturn(returnId: string, data: ApproveReturnData): Promise<MarketplaceReturn> {
    return portalApiClient.post<MarketplaceReturn>(`/api/returns/seller/${returnId}/approve`, data);
  },

  async rejectReturn(returnId: string, data: RejectReturnData): Promise<MarketplaceReturn> {
    return portalApiClient.post<MarketplaceReturn>(`/api/returns/seller/${returnId}/reject`, data);
  },

  async confirmReturnReceived(returnId: string, data: ReceiveReturnData): Promise<MarketplaceReturn> {
    return portalApiClient.post<MarketplaceReturn>(`/api/returns/seller/${returnId}/receive`, data);
  },

  async processRefund(returnId: string, data: ProcessRefundData): Promise<MarketplaceReturn> {
    return portalApiClient.post<MarketplaceReturn>(`/api/returns/seller/${returnId}/refund`, data);
  },

  async closeReturn(returnId: string): Promise<MarketplaceReturn> {
    return portalApiClient.post<MarketplaceReturn>(`/api/returns/seller/${returnId}/close`);
  },

  async getSellerReturnHistory(returnId: string): Promise<ReturnEvent[]> {
    return portalApiClient.get<ReturnEvent[]>(`/api/returns/seller/${returnId}/history`);
  },

  // ---------------------------------------------------------------------------
  // Shared Operations
  // ---------------------------------------------------------------------------

  async createReturn(data: CreateReturnData): Promise<MarketplaceReturn> {
    return portalApiClient.post<MarketplaceReturn>(`/api/returns`, data);
  },

  async getReturnByDispute(disputeId: string): Promise<MarketplaceReturn | null> {
    try {
      return await portalApiClient.get<MarketplaceReturn>(`/api/returns/dispute/${disputeId}`);
    } catch {
      return null;
    }
  },
};

export default returnService;
