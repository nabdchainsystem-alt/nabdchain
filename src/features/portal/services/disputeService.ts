// =============================================================================
// Dispute Service - Frontend API Client for Marketplace Disputes (Stage 7)
// =============================================================================

import { API_URL } from '../../../config/api';
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
// Dispute Service
// =============================================================================

export const disputeService = {
  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a new dispute on an order (buyer)
   */
  async createDispute(token: string, data: CreateDisputeData): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/buyer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create dispute');
    }

    return response.json();
  },

  /**
   * Get all disputes for the authenticated buyer
   */
  async getBuyerDisputes(
    token: string,
    filters: DisputeFilters = {}
  ): Promise<PaginatedDisputeResponse> {
    const url = new URL(`${API_URL}/disputes/buyer`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.reason) url.searchParams.append('reason', filters.reason);
    if (filters.priority) url.searchParams.append('priority', filters.priority);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch disputes');
    }

    return response.json();
  },

  /**
   * Get buyer dispute statistics
   */
  async getBuyerDisputeStats(token: string): Promise<DisputeStats> {
    const response = await fetch(`${API_URL}/disputes/buyer/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dispute statistics');
    }

    return response.json();
  },

  /**
   * Get single dispute for buyer
   */
  async getBuyerDispute(token: string, disputeId: string): Promise<MarketplaceDispute | null> {
    const response = await fetch(`${API_URL}/disputes/buyer/${disputeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch dispute');
    }

    return response.json();
  },

  /**
   * Accept seller's proposed resolution (buyer)
   */
  async acceptResolution(token: string, disputeId: string): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/buyer/${disputeId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to accept resolution');
    }

    return response.json();
  },

  /**
   * Reject seller's response (buyer)
   */
  async rejectResolution(
    token: string,
    disputeId: string,
    data: RejectResolutionData
  ): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/buyer/${disputeId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject resolution');
    }

    return response.json();
  },

  /**
   * Escalate dispute to platform (buyer)
   */
  async buyerEscalate(
    token: string,
    disputeId: string,
    data: EscalateDisputeData
  ): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/buyer/${disputeId}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to escalate dispute');
    }

    return response.json();
  },

  /**
   * Add evidence to dispute (buyer)
   */
  async addEvidence(
    token: string,
    disputeId: string,
    data: AddEvidenceData
  ): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/buyer/${disputeId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add evidence');
    }

    return response.json();
  },

  /**
   * Close dispute (buyer)
   */
  async buyerCloseDispute(token: string, disputeId: string): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/buyer/${disputeId}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to close dispute');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all disputes for the authenticated seller
   */
  async getSellerDisputes(
    token: string,
    filters: DisputeFilters = {}
  ): Promise<PaginatedDisputeResponse> {
    const url = new URL(`${API_URL}/disputes/seller`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.reason) url.searchParams.append('reason', filters.reason);
    if (filters.priority) url.searchParams.append('priority', filters.priority);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch disputes');
    }

    return response.json();
  },

  /**
   * Get seller dispute statistics
   */
  async getSellerDisputeStats(token: string): Promise<DisputeStats> {
    const response = await fetch(`${API_URL}/disputes/seller/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dispute statistics');
    }

    return response.json();
  },

  /**
   * Get single dispute for seller
   */
  async getSellerDispute(token: string, disputeId: string): Promise<MarketplaceDispute | null> {
    const response = await fetch(`${API_URL}/disputes/seller/${disputeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch dispute');
    }

    return response.json();
  },

  /**
   * Mark dispute as under review (seller)
   */
  async markAsUnderReview(token: string, disputeId: string): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/seller/${disputeId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark dispute as under review');
    }

    return response.json();
  },

  /**
   * Respond to dispute (seller)
   */
  async respondToDispute(
    token: string,
    disputeId: string,
    data: SellerRespondData
  ): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/seller/${disputeId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit response');
    }

    return response.json();
  },

  /**
   * Escalate dispute to platform (seller)
   */
  async sellerEscalate(
    token: string,
    disputeId: string,
    data: EscalateDisputeData
  ): Promise<MarketplaceDispute> {
    const response = await fetch(`${API_URL}/disputes/seller/${disputeId}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to escalate dispute');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Shared Operations
  // ---------------------------------------------------------------------------

  /**
   * Get dispute history (timeline)
   */
  async getDisputeHistory(token: string, disputeId: string): Promise<DisputeEvent[]> {
    const response = await fetch(`${API_URL}/disputes/${disputeId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dispute history');
    }

    return response.json();
  },

  /**
   * Get dispute for a specific order
   */
  async getDisputeByOrder(token: string, orderId: string): Promise<MarketplaceDispute | null> {
    const response = await fetch(`${API_URL}/disputes/order/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch dispute');
    }

    return response.json();
  },
};

export default disputeService;
