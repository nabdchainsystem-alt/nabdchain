// =============================================================================
// Rating System - Type Definitions
// =============================================================================

export interface MarketplaceRating {
  id: string;
  orderId: string;
  raterRole: 'BUYER' | 'SELLER' | 'BUYER_ORDER' | 'SELLER_ORDER';
  raterId: string;
  targetRole: 'SELLER' | 'BUYER' | 'ORDER';
  targetId: string;
  score: number;
  tags: string[];
  comment: string | null;
  createdAt: string;
}

export interface RatingEligibility {
  orderId: string;
  canBuyerRateSeller: boolean;
  canSellerRateBuyer: boolean;
  buyerAlreadyRated: boolean;
  sellerAlreadyRated: boolean;
  // Order-experience ratings
  canBuyerRateOrder: boolean;
  canSellerRateOrder: boolean;
  buyerOrderRated: boolean;
  sellerOrderRated: boolean;
  reasonIfBlocked?: string;
}

export interface CreateRatingInput {
  score: number;
  tags?: string[];
  comment?: string;
  ratingType?: 'counterparty' | 'order';
}

export interface RatingSummary {
  avgScore: number;
  count: number;
  distribution: Record<number, number>;
  recent: Array<{
    score: number;
    tags: string[];
    comment: string | null;
    createdAt: string;
    orderNumber: string;
  }>;
}

export interface OrderRatings {
  buyerRating: MarketplaceRating | null;
  sellerRating: MarketplaceRating | null;
  buyerOrderRating: MarketplaceRating | null;
  sellerOrderRating: MarketplaceRating | null;
}

// Tag presets per role
export const BUYER_RATING_TAGS = ['On-time', 'Quality', 'Communication', 'Packaging', 'Pricing'] as const;

export const SELLER_RATING_TAGS = ['Fast approval', 'Clear requirements', 'On-time payment', 'Professional'] as const;

export const ORDER_EXPERIENCE_TAGS = [
  'Smooth process',
  'Fast delivery',
  'Clear communication',
  'Easy payment',
  'Would repeat',
] as const;
