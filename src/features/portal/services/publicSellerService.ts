import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types
// =============================================================================

export interface PublicSellerProfile {
  id: string;
  displayName: string;
  slug: string;
  shortDescription?: string;
  tagline?: string;
  logoUrl?: string;
  coverUrl?: string;
  verified: boolean;
  vatRegistered: boolean;
  topSeller?: boolean;
  fastResponder?: boolean;
  location?: {
    city: string;
    country: string;
    coverage?: string[];
  };
  memberSince: string;
  yearsActive?: number;
  industriesServed?: string[];
  statistics: SellerStatistics;
  rating?: {
    average: number;
    count: number;
  };
  isSaved?: boolean;
}

export interface SellerStatistics {
  totalProducts: number;
  activeListings?: number;
  totalOrders: number;
  responseRate: number;
  responseTime: string;
  fulfillmentRate: number;
  onTimeDeliveryRate?: number;
  disputeRate?: number;
  rfqWinRate: number;
}

export interface SellerProduct {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency: string;
  unit: string;
  moq: number;
  imageUrl?: string;
  images?: string[];
  category: string;
  stock: number;
  leadTime?: string;
  sellerId: string;
  status: string;
  createdAt: string;
}

export interface ProductsResponse {
  products: SellerProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SellerReview {
  id: string;
  rating: number;
  comment: string;
  buyerName: string;
  buyerAvatar?: string;
  orderId?: string;
  createdAt: string;
  response?: {
    comment: string;
    createdAt: string;
  };
}

export interface ReviewsResponse {
  reviews: SellerReview[];
  summary: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Service Methods (uses portalApiClient)
// =============================================================================

export const publicSellerService = {
  // Public endpoints use noAuth: true
  async getProfile(slug: string): Promise<PublicSellerProfile> {
    return portalApiClient.get<PublicSellerProfile>(`/api/public/seller/${encodeURIComponent(slug)}`, { noAuth: true });
  },

  async getProducts(
    slug: string,
    options?: {
      page?: number;
      limit?: number;
      category?: string;
      sort?: 'newest' | 'price_low' | 'price_high' | 'popular';
    },
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.category) params.append('category', options.category);
    if (options?.sort) params.append('sort', options.sort);

    const query = params.toString();
    return portalApiClient.get<ProductsResponse>(
      `/api/public/seller/${encodeURIComponent(slug)}/products${query ? `?${query}` : ''}`,
      { noAuth: true },
    );
  },

  async getReviews(
    slug: string,
    options?: {
      page?: number;
      limit?: number;
    },
  ): Promise<ReviewsResponse> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const query = params.toString();
    return portalApiClient.get<ReviewsResponse>(
      `/api/public/seller/${encodeURIComponent(slug)}/reviews${query ? `?${query}` : ''}`,
      { noAuth: true },
    );
  },

  // Authenticated endpoints
  async toggleSaveSeller(sellerId: string, _token?: string): Promise<{ saved: boolean }> {
    return portalApiClient.post<{ saved: boolean }>(`/api/buyer/saved-sellers/${sellerId}`);
  },

  async contactSeller(
    sellerId: string,
    message: string,
    _token?: string,
  ): Promise<{ success: boolean; messageId: string }> {
    return portalApiClient.post<{ success: boolean; messageId: string }>('/api/buyer/messages', { sellerId, message });
  },
};

export default publicSellerService;
