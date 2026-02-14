// =============================================================================
// Counter-Offer Service - Frontend API Client
// =============================================================================
// Handles buyer counter-offers on quotes for negotiation flow
// Counter-offer lifecycle: PENDING → ACCEPTED | REJECTED | EXPIRED
// =============================================================================

import { portalApiClient } from './portalApiClient';
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
  async createCounterOffer(quoteId: string, data: CreateCounterOfferData): Promise<CounterOffer> {
    return portalApiClient.post<CounterOffer>(`/api/items/quotes/${quoteId}/counter-offer`, data);
  },

  async getCounterOffers(quoteId: string): Promise<CounterOffer[]> {
    try {
      const data = await portalApiClient.get<{ counterOffers?: CounterOffer[] }>(
        `/api/items/quotes/${quoteId}/counter-offers`,
      );
      return data.counterOffers || [];
    } catch {
      return [];
    }
  },

  async acceptCounterOffer(counterOfferId: string, response?: string): Promise<AcceptCounterOfferResponse> {
    return portalApiClient.post<AcceptCounterOfferResponse>(`/api/items/counter-offers/${counterOfferId}/accept`, {
      response,
    });
  },

  async rejectCounterOffer(counterOfferId: string, response: string): Promise<CounterOffer> {
    const data = await portalApiClient.post<{ counterOffer: CounterOffer }>(
      `/api/items/counter-offers/${counterOfferId}/reject`,
      { response },
    );
    return data.counterOffer;
  },

  async getPendingCounterOffers(): Promise<PendingCounterOffersResponse> {
    return portalApiClient.get<PendingCounterOffersResponse>(`/api/items/counter-offers/pending`);
  },
};

export default counterOfferService;
