// =============================================================================
// Rating Service - Frontend API Client for Mutual Ratings
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  MarketplaceRating,
  RatingEligibility,
  CreateRatingInput,
  RatingSummary,
  OrderRatings,
} from '../types/rating.types';

export const ratingService = {
  /**
   * Check rating eligibility for an order
   */
  async checkEligibility(orderId: string): Promise<RatingEligibility> {
    return portalApiClient.get<RatingEligibility>(`/api/ratings/eligibility?orderId=${encodeURIComponent(orderId)}`);
  },

  /**
   * Submit a rating for an order (role auto-detected by backend)
   */
  async createRating(orderId: string, data: CreateRatingInput): Promise<MarketplaceRating> {
    return portalApiClient.post<MarketplaceRating>(`/api/ratings/order/${orderId}`, data);
  },

  /**
   * Get rating summary for a target (seller or buyer)
   */
  async getTargetSummary(role: 'SELLER' | 'BUYER', targetId: string): Promise<RatingSummary> {
    return portalApiClient.get<RatingSummary>(`/api/ratings/target/${role}/${targetId}/summary`);
  },

  /**
   * Get both ratings for an order
   */
  async getOrderRatings(orderId: string): Promise<OrderRatings> {
    return portalApiClient.get<OrderRatings>(`/api/ratings/order/${orderId}`);
  },
};
