// =============================================================================
// Counter-Offer Service - Frontend API Client
// =============================================================================
// Handles buyer counter-offers on quotes for negotiation flow
// Counter-offer lifecycle: PENDING → ACCEPTED | REJECTED | EXPIRED
// =============================================================================

import { API_URL } from '../../../config/api';
import { CounterOffer, CreateCounterOfferData, QuoteWithRFQ } from '../types/item.types';

// =============================================================================
// Response Types
// =============================================================================

interface AcceptCounterOfferResponse {
  counterOffer: CounterOffer;
  revisedQuote: QuoteWithRFQ;
}

interface PendingCounterOffersResponse {
  counterOffers: (CounterOffer & { quote: QuoteWithRFQ })[];
  count: number;
}

// =============================================================================
// Counter-Offer Service
// =============================================================================

export const counterOfferService = {
  /**
   * Create a counter-offer on a quote (Buyer action)
   * Counter-offers allow buyers to propose different terms
   */
  async createCounterOffer(token: string, quoteId: string, data: CreateCounterOfferData): Promise<CounterOffer> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/counter-offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create counter-offer');
    }

    return response.json();
  },

  /**
   * Get all counter-offers for a quote
   */
  async getCounterOffers(token: string, quoteId: string): Promise<CounterOffer[]> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/counter-offers`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch counter-offers');
    }

    const data = await response.json();
    return data.counterOffers || [];
  },

  /**
   * Accept a counter-offer (Seller action)
   * Creates a revised quote with the buyer's proposed terms
   */
  async acceptCounterOffer(
    token: string,
    counterOfferId: string,
    response?: string,
  ): Promise<AcceptCounterOfferResponse> {
    const res = await fetch(`${API_URL}/items/counter-offers/${counterOfferId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ response }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to accept counter-offer');
    }

    return res.json();
  },

  /**
   * Reject a counter-offer (Seller action)
   */
  async rejectCounterOffer(token: string, counterOfferId: string, response: string): Promise<CounterOffer> {
    const res = await fetch(`${API_URL}/items/counter-offers/${counterOfferId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ response }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to reject counter-offer');
    }

    const data = await res.json();
    return data.counterOffer;
  },

  /**
   * Get pending counter-offers for seller (notifications)
   */
  async getPendingCounterOffers(token: string): Promise<PendingCounterOffersResponse> {
    const response = await fetch(`${API_URL}/items/counter-offers/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch pending counter-offers');
    }

    return response.json();
  },
};

export default counterOfferService;
