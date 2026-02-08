// =============================================================================
// RFQ Marketplace Service - Seller Discovery of Open Buyer Requests
// =============================================================================
// NOTE: Mock data removed - see MOCK_REMOVAL_REPORT.md
// All data must come from API. Frontend handles empty states gracefully.

import {
  MarketplaceRFQ,
  MarketplaceFilters,
  MarketplaceResponse,
  MarketplaceQuoteSubmission,
  SubmittedMarketplaceQuote,
  SaveRFQResponse,
  MarketplaceStats,
} from '../types/rfq-marketplace.types';

// Use the same API base as other portal services (avoids Vite proxy issues)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_BASE_URL}/api/v1`;

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
  /**
   * Get marketplace RFQs with filters
   */
  async getMarketplaceRFQs(token: string, filters: MarketplaceFilters = {}): Promise<MarketplaceResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    // Use portal access token (preferred) or passed token
    const portalToken = localStorage.getItem('portal_access_token') || token;

    const response = await fetch(`${API_BASE}/rfq-marketplace?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${portalToken}`,
      },
    });

    if (response.ok) {
      return response.json();
    }

    // Throw on API error so the UI can show the actual error
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error || errorData.message || `API error ${response.status}`;
    console.error('RFQ Marketplace API error:', response.status, errorMsg);
    throw new Error(errorMsg);
  },

  /**
   * Get single RFQ details
   */
  async getRFQDetails(token: string, rfqId: string): Promise<MarketplaceRFQ | null> {
    const portalToken = localStorage.getItem('portal_access_token') || token;

    const response = await fetch(`${API_BASE}/rfq-marketplace/${rfqId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${portalToken}`,
      },
    });

    if (response.ok) {
      return response.json();
    }

    if (response.status === 404) {
      return null;
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error ${response.status}`);
  },

  /**
   * Save an RFQ for later
   */
  async saveRFQ(token: string, rfqId: string): Promise<SaveRFQResponse> {
    try {
      const portalToken = localStorage.getItem('portal_access_token') || token;
      const response = await fetch(`${API_BASE}/rfq-marketplace/${rfqId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${portalToken}`,
        },
      });

      if (response.ok) {
        return response.json();
      }

      // Throw error on API failure - let UI handle it
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to save RFQ');
    } catch (error) {
      console.error('[RFQMarketplace] Error saving RFQ:', error);
      throw error;
    }
  },

  /**
   * Unsave an RFQ
   */
  async unsaveRFQ(token: string, rfqId: string): Promise<SaveRFQResponse> {
    try {
      const portalToken = localStorage.getItem('portal_access_token') || token;
      const response = await fetch(`${API_BASE}/rfq-marketplace/${rfqId}/save`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${portalToken}`,
        },
      });

      if (response.ok) {
        return response.json();
      }

      // Throw error on API failure - let UI handle it
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to unsave RFQ');
    } catch (error) {
      console.error('[RFQMarketplace] Error unsaving RFQ:', error);
      throw error;
    }
  },

  /**
   * Submit a quote for an RFQ
   */
  async submitQuote(token: string, data: MarketplaceQuoteSubmission): Promise<SubmittedMarketplaceQuote> {
    try {
      const portalToken = localStorage.getItem('portal_access_token') || token;
      const response = await fetch(`${API_BASE}/rfq-marketplace/${data.rfqId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${portalToken}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return response.json();
      }

      // Throw error on API failure (production mode)
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.details || errorData.error || errorData.message || 'Failed to submit quote';
      throw new Error(errorMsg);
    } catch (error) {
      console.error('Quote submission error:', error);
      throw error;
    }
  },

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(token: string): Promise<MarketplaceStats> {
    const portalToken = localStorage.getItem('portal_access_token') || token;

    const response = await fetch(`${API_BASE}/rfq-marketplace/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${portalToken}`,
      },
    });

    if (response.ok) {
      return response.json();
    }

    // Throw on error so the UI can display it
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Stats API error ${response.status}`);
  },

  /**
   * Get seller's submitted quotes for marketplace RFQs
   */
  async getMySubmittedQuotes(
    token: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ quotes: SubmittedMarketplaceQuote[]; total: number }> {
    const portalToken = localStorage.getItem('portal_access_token') || token;

    const response = await fetch(`${API_BASE}/rfq-marketplace/my-quotes?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${portalToken}`,
      },
    });

    if (response.ok) {
      return response.json();
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error ${response.status}`);
  },

  /**
   * Get saved RFQs
   */
  async getSavedRFQs(token: string, page: number = 1, limit: number = 20): Promise<MarketplaceResponse> {
    return this.getMarketplaceRFQs(token, { savedOnly: true, page, limit });
  },
};

export default rfqMarketplaceService;
