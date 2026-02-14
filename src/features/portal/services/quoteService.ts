// =============================================================================
// Quote Service - Frontend API Client (Stage 3)
// =============================================================================
// Handles quote lifecycle: DRAFT → SENT → REVISED | EXPIRED
// Every update creates a new version; old versions are immutable.
// =============================================================================

import { portalApiClient } from './portalApiClient';
import { portalApiLogger } from '../../../utils/logger';
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
// Helper
// =============================================================================

function buildQuoteQS(filters: QuoteFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.page) p.append('page', filters.page.toString());
  if (filters.limit) p.append('limit', filters.limit.toString());
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// =============================================================================
// Quote Service
// =============================================================================

export const quoteService = {
  async createDraft(data: CreateQuoteData): Promise<QuoteWithRFQ> {
    if (import.meta.env.DEV) {
      portalApiLogger.debug(`[QuoteService] createDraft`, data);
    }
    return portalApiClient.post<QuoteWithRFQ>(`/api/items/quotes`, data);
  },

  async getQuotes(filters: QuoteFilters = {}): Promise<QuotesResponse> {
    return portalApiClient.get<QuotesResponse>(`/api/items/quotes${buildQuoteQS(filters)}`);
  },

  async getQuote(quoteId: string): Promise<QuoteWithRFQ | null> {
    try {
      return await portalApiClient.get<QuoteWithRFQ>(`/api/items/quotes/${quoteId}`);
    } catch {
      return null;
    }
  },

  async getQuotesByRFQ(rfqId: string): Promise<Quote[]> {
    try {
      return await portalApiClient.get<Quote[]>(`/api/items/quotes/rfq/${rfqId}`);
    } catch {
      return [];
    }
  },

  async updateQuote(quoteId: string, data: UpdateQuoteData): Promise<QuoteWithRFQ | null> {
    try {
      return await portalApiClient.put<QuoteWithRFQ>(`/api/items/quotes/${quoteId}`, data);
    } catch {
      return null;
    }
  },

  async sendQuote(quoteId: string): Promise<QuoteWithRFQ | null> {
    if (import.meta.env.DEV) {
      portalApiLogger.debug(`[QuoteService] sendQuote ${quoteId}`);
    }
    try {
      return await portalApiClient.post<QuoteWithRFQ>(`/api/items/quotes/${quoteId}/send`);
    } catch {
      return null;
    }
  },

  async getQuoteVersions(quoteId: string): Promise<QuoteVersion[]> {
    try {
      return await portalApiClient.get<QuoteVersion[]>(`/api/items/quotes/${quoteId}/versions`);
    } catch {
      return [];
    }
  },

  async getQuoteHistory(quoteId: string): Promise<QuoteEvent[]> {
    try {
      return await portalApiClient.get<QuoteEvent[]>(`/api/items/quotes/${quoteId}/history`);
    } catch {
      return [];
    }
  },

  async deleteDraft(quoteId: string): Promise<boolean> {
    try {
      await portalApiClient.delete(`/api/items/quotes/${quoteId}`);
      return true;
    } catch {
      return false;
    }
  },

  // =============================================================================
  // Attachment Methods
  // =============================================================================

  async addAttachment(quoteId: string, file: File, type: QuoteAttachmentType = 'other'): Promise<QuoteAttachment> {
    // FormData requires raw fetch (portalApiClient auto-sets Content-Type: application/json)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = portalApiClient.getAccessToken();
    const response = await fetch(`${portalApiClient.baseUrl}/api/items/quotes/${quoteId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to upload attachment');
    }

    return response.json();
  },

  async getAttachments(quoteId: string): Promise<QuoteAttachment[]> {
    try {
      return await portalApiClient.get<QuoteAttachment[]>(`/api/items/quotes/${quoteId}/attachments`);
    } catch {
      return [];
    }
  },

  async removeAttachment(quoteId: string, attachmentId: string): Promise<boolean> {
    try {
      await portalApiClient.delete(`/api/items/quotes/${quoteId}/attachments/${attachmentId}`);
      return true;
    } catch {
      return false;
    }
  },
};

export default quoteService;
