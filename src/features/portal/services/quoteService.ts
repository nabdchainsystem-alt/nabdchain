// =============================================================================
// Quote Service - Frontend API Client (Stage 3)
// =============================================================================
// Handles quote lifecycle: DRAFT → SENT → REVISED | EXPIRED
// Every update creates a new version; old versions are immutable.
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  Quote,
  QuoteWithRFQ,
  QuoteVersion,
  QuoteEvent,
  CreateQuoteData,
  UpdateQuoteData,
  QuoteFilters,
  QuotesResponse,
  QuoteAttachment,
  QuoteAttachmentType,
} from '../types/item.types';

// =============================================================================
// Quote Service
// =============================================================================

export const quoteService = {
  /**
   * Create a new draft quote for an RFQ
   * Entry condition: RFQ must be in UNDER_REVIEW status
   */
  async createDraft(token: string, data: CreateQuoteData): Promise<QuoteWithRFQ> {
    const response = await fetch(`${API_URL}/items/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create quote');
    }

    return response.json();
  },

  /**
   * Get all quotes for the authenticated seller
   */
  async getQuotes(token: string, filters: QuoteFilters = {}): Promise<QuotesResponse> {
    const url = new URL(`${API_URL}/items/quotes`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch quotes');
    }

    return response.json();
  },

  /**
   * Get a specific quote by ID
   */
  async getQuote(token: string, quoteId: string): Promise<QuoteWithRFQ | null> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch quote');
    }

    return response.json();
  },

  /**
   * Get all quotes for an RFQ
   */
  async getQuotesByRFQ(token: string, rfqId: string): Promise<Quote[]> {
    const response = await fetch(`${API_URL}/items/quotes/rfq/${rfqId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch quotes for RFQ');
    }

    return response.json();
  },

  /**
   * Update a quote (draft or create revision for sent)
   */
  async updateQuote(
    token: string,
    quoteId: string,
    data: UpdateQuoteData
  ): Promise<QuoteWithRFQ | null> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}`, {
      method: 'PUT',
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
      throw new Error(error.error || 'Failed to update quote');
    }

    return response.json();
  },

  /**
   * Send a quote to the buyer (DRAFT → SENT)
   * This also updates the RFQ status to QUOTED
   */
  async sendQuote(token: string, quoteId: string): Promise<QuoteWithRFQ | null> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to send quote');
    }

    return response.json();
  },

  /**
   * Get version history for a quote
   */
  async getQuoteVersions(token: string, quoteId: string): Promise<QuoteVersion[]> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/versions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch quote versions');
    }

    return response.json();
  },

  /**
   * Get event history for a quote
   */
  async getQuoteHistory(token: string, quoteId: string): Promise<QuoteEvent[]> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch quote history');
    }

    return response.json();
  },

  /**
   * Delete a draft quote (only drafts can be deleted)
   */
  async deleteDraft(token: string, quoteId: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete quote');
    }

    return true;
  },

  // =============================================================================
  // Attachment Methods
  // =============================================================================

  /**
   * Add an attachment to a quote
   */
  async addAttachment(
    token: string,
    quoteId: string,
    file: File,
    type: QuoteAttachmentType = 'other'
  ): Promise<QuoteAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to upload attachment');
    }

    return response.json();
  },

  /**
   * Get all attachments for a quote
   */
  async getAttachments(token: string, quoteId: string): Promise<QuoteAttachment[]> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch attachments');
    }

    return response.json();
  },

  /**
   * Remove an attachment from a quote
   */
  async removeAttachment(
    token: string,
    quoteId: string,
    attachmentId: string
  ): Promise<boolean> {
    const response = await fetch(
      `${API_URL}/items/quotes/${quoteId}/attachments/${attachmentId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to remove attachment');
    }

    return true;
  },
};

export default quoteService;
