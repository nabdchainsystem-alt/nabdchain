const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
// Service Methods
// =============================================================================

export const publicSellerService = {
  // Get public seller profile by slug
  async getProfile(slug: string): Promise<PublicSellerProfile> {
    const response = await fetch(`${API_BASE}/api/public/seller/${encodeURIComponent(slug)}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Seller not found');
      }
      throw new Error('Failed to fetch seller profile');
    }

    return response.json();
  },

  // Get seller's products
  async getProducts(
    slug: string,
    options?: {
      page?: number;
      limit?: number;
      category?: string;
      sort?: 'newest' | 'price_low' | 'price_high' | 'popular';
    }
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.category) params.append('category', options.category);
    if (options?.sort) params.append('sort', options.sort);

    const response = await fetch(
      `${API_BASE}/api/public/seller/${encodeURIComponent(slug)}/products?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch seller products');
    }

    return response.json();
  },

  // Get seller reviews (Phase 2)
  async getReviews(
    slug: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ReviewsResponse> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetch(
      `${API_BASE}/api/public/seller/${encodeURIComponent(slug)}/reviews?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch seller reviews');
    }

    return response.json();
  },

  // Save/unsave seller
  async toggleSaveSeller(sellerId: string, token?: string): Promise<{ saved: boolean }> {
    const response = await fetch(`${API_BASE}/api/buyer/saved-sellers/${sellerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to save seller');
    }

    return response.json();
  },

  // Contact seller (send message)
  async contactSeller(
    sellerId: string,
    message: string,
    token?: string
  ): Promise<{ success: boolean; messageId: string }> {
    const response = await fetch(`${API_BASE}/api/buyer/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sellerId, message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },
};

export default publicSellerService;
