// =============================================================================
// RFQ Marketplace Service - Seller Discovery of Open Buyer Requests
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  MarketplaceRFQ,
  MarketplaceFilters,
  MarketplaceResponse,
  MarketplaceQuoteSubmission,
  SubmittedMarketplaceQuote,
  SaveRFQResponse,
  MarketplaceStats,
} from '../types/rfq-marketplace.types';

// NOTE: This service uses /api/v1/ prefix (versioned API)

// =============================================================================
// Empty State Constants
// =============================================================================

const EMPTY_STATS: MarketplaceStats = {
  totalOpen: 0,
  newToday: 0,
  expiringToday: 0,
  savedCount: 0,
  quotedCount: 0,
};

const _EMPTY_RESPONSE: MarketplaceResponse = {
  rfqs: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  stats: EMPTY_STATS,
};

// =============================================================================
// Service Methods
// =============================================================================

export const rfqMarketplaceService = {
  async getMarketplaceRFQs(filters: MarketplaceFilters = {}): Promise<MarketplaceResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    return portalApiClient.get<MarketplaceResponse>(`/api/v1/rfq-marketplace${qs ? `?${qs}` : ''}`);
  },

  async getRFQDetails(rfqId: string): Promise<MarketplaceRFQ | null> {
    try {
      return await portalApiClient.get<MarketplaceRFQ>(`/api/v1/rfq-marketplace/${rfqId}`);
    } catch {
      return null;
    }
  },

  async saveRFQ(rfqId: string): Promise<SaveRFQResponse> {
    return portalApiClient.post<SaveRFQResponse>(`/api/v1/rfq-marketplace/${rfqId}/save`);
  },

  async unsaveRFQ(rfqId: string): Promise<SaveRFQResponse> {
    return portalApiClient.delete<SaveRFQResponse>(`/api/v1/rfq-marketplace/${rfqId}/save`);
  },

  async submitQuote(data: MarketplaceQuoteSubmission): Promise<SubmittedMarketplaceQuote> {
    return portalApiClient.post<SubmittedMarketplaceQuote>(`/api/v1/rfq-marketplace/${data.rfqId}/quote`, data);
  },

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    return portalApiClient.get<MarketplaceStats>(`/api/v1/rfq-marketplace/stats`);
  },

  async getMySubmittedQuotes(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ quotes: SubmittedMarketplaceQuote[]; total: number }> {
    return portalApiClient.get(`/api/v1/rfq-marketplace/my-quotes?page=${page}&limit=${limit}`);
  },

  async getSavedRFQs(page: number = 1, limit: number = 20): Promise<MarketplaceResponse> {
    return this.getMarketplaceRFQs({ savedOnly: true, page, limit });
  },
};

export default rfqMarketplaceService;
