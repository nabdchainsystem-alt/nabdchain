// =============================================================================
// Return Service - Frontend API Client for Marketplace Returns (Stage 7)
// =============================================================================

import { API_URL } from '../../../config/api';
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
// Return Service
// =============================================================================

export const returnService = {
  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all returns for the authenticated buyer
   */
  async getBuyerReturns(
    token: string,
    filters: ReturnFilters = {}
  ): Promise<PaginatedReturnResponse> {
    const url = new URL(`${API_URL}/returns/buyer`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch returns');
    }

    return response.json();
  },

  /**
   * Get single return for buyer
   */
  async getBuyerReturn(token: string, returnId: string): Promise<MarketplaceReturn | null> {
    const response = await fetch(`${API_URL}/returns/buyer/${returnId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch return');
    }

    return response.json();
  },

  /**
   * Mark return as shipped (buyer)
   */
  async shipReturn(
    token: string,
    returnId: string,
    data: ShipReturnData
  ): Promise<MarketplaceReturn> {
    const response = await fetch(`${API_URL}/returns/buyer/${returnId}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark return as shipped');
    }

    return response.json();
  },

  /**
   * Get return history for buyer
   */
  async getBuyerReturnHistory(token: string, returnId: string): Promise<ReturnEvent[]> {
    const response = await fetch(`${API_URL}/returns/buyer/${returnId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch return history');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all returns for the authenticated seller
   */
  async getSellerReturns(
    token: string,
    filters: ReturnFilters = {}
  ): Promise<PaginatedReturnResponse> {
    const url = new URL(`${API_URL}/returns/seller`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch returns');
    }

    return response.json();
  },

  /**
   * Get seller return statistics
   */
  async getSellerReturnStats(token: string): Promise<ReturnStats> {
    const response = await fetch(`${API_URL}/returns/seller/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch return statistics');
    }

    return response.json();
  },

  /**
   * Get single return for seller
   */
  async getSellerReturn(token: string, returnId: string): Promise<MarketplaceReturn | null> {
    const response = await fetch(`${API_URL}/returns/seller/${returnId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch return');
    }

    return response.json();
  },

  /**
   * Approve return request (seller)
   */
  async approveReturn(
    token: string,
    returnId: string,
    data: ApproveReturnData
  ): Promise<MarketplaceReturn> {
    const response = await fetch(`${API_URL}/returns/seller/${returnId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve return');
    }

    return response.json();
  },

  /**
   * Reject return request (seller)
   */
  async rejectReturn(
    token: string,
    returnId: string,
    data: RejectReturnData
  ): Promise<MarketplaceReturn> {
    const response = await fetch(`${API_URL}/returns/seller/${returnId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject return');
    }

    return response.json();
  },

  /**
   * Confirm return received (seller)
   */
  async confirmReturnReceived(
    token: string,
    returnId: string,
    data: ReceiveReturnData
  ): Promise<MarketplaceReturn> {
    const response = await fetch(`${API_URL}/returns/seller/${returnId}/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm return receipt');
    }

    return response.json();
  },

  /**
   * Process refund for return (seller)
   */
  async processRefund(
    token: string,
    returnId: string,
    data: ProcessRefundData
  ): Promise<MarketplaceReturn> {
    const response = await fetch(`${API_URL}/returns/seller/${returnId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process refund');
    }

    return response.json();
  },

  /**
   * Close return (seller)
   */
  async closeReturn(token: string, returnId: string): Promise<MarketplaceReturn> {
    const response = await fetch(`${API_URL}/returns/seller/${returnId}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to close return');
    }

    return response.json();
  },

  /**
   * Get return history for seller
   */
  async getSellerReturnHistory(token: string, returnId: string): Promise<ReturnEvent[]> {
    const response = await fetch(`${API_URL}/returns/seller/${returnId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch return history');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Shared Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a return request (usually from dispute resolution)
   */
  async createReturn(token: string, data: CreateReturnData): Promise<MarketplaceReturn> {
    const response = await fetch(`${API_URL}/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create return');
    }

    return response.json();
  },

  /**
   * Get return for a specific dispute
   */
  async getReturnByDispute(token: string, disputeId: string): Promise<MarketplaceReturn | null> {
    const response = await fetch(`${API_URL}/returns/dispute/${disputeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch return');
    }

    return response.json();
  },
};

export default returnService;
