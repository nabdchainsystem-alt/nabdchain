// =============================================================================
// Seller RFQ Inbox Service - Frontend API Client (Stage 2)
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  SellerInboxRFQ,
  InboxFilters,
  InboxResponse,
  StatusUpdateData,
  InternalNoteData,
  RFQEvent,
} from '../types/item.types';

// =============================================================================
// Seller RFQ Inbox Service
// =============================================================================

export const sellerRfqInboxService = {
  /**
   * Get paginated RFQ inbox with filters
   */
  async getInbox(token: string, filters: InboxFilters = {}): Promise<InboxResponse> {
    const url = new URL(`${API_URL}/items/rfq/seller/inbox`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.priorityLevel) url.searchParams.append('priorityLevel', filters.priorityLevel);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());
    if (filters.sortBy) url.searchParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) url.searchParams.append('sortOrder', filters.sortOrder);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch inbox');
    }

    return response.json();
  },

  /**
   * Get RFQ detail (auto-marks as VIEWED)
   */
  async getRFQDetail(token: string, rfqId: string): Promise<SellerInboxRFQ | null> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch RFQ detail');
    }

    return response.json();
  },

  /**
   * Update RFQ status (mark as under_review or ignored)
   */
  async updateStatus(
    token: string,
    rfqId: string,
    data: StatusUpdateData
  ): Promise<SellerInboxRFQ | null> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update RFQ status');
    }

    return response.json();
  },

  /**
   * Mark RFQ as under review
   */
  async markUnderReview(token: string, rfqId: string): Promise<SellerInboxRFQ | null> {
    return this.updateStatus(token, rfqId, { status: 'under_review' });
  },

  /**
   * Mark RFQ as ignored with reason
   */
  async markIgnored(
    token: string,
    rfqId: string,
    reason: string
  ): Promise<SellerInboxRFQ | null> {
    return this.updateStatus(token, rfqId, { status: 'ignored', ignoredReason: reason });
  },

  /**
   * Add internal note to RFQ
   */
  async addNote(
    token: string,
    rfqId: string,
    data: InternalNoteData
  ): Promise<SellerInboxRFQ | null> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to add note');
    }

    return response.json();
  },

  /**
   * Get RFQ event history
   */
  async getHistory(token: string, rfqId: string): Promise<RFQEvent[] | null> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch history');
    }

    return response.json();
  },
};

export default sellerRfqInboxService;
