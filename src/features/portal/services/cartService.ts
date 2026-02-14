// =============================================================================
// Cart Service - Buyer Cart API Client
// =============================================================================
// RFQ aggregation cart - NOT a traditional checkout cart
// Uses portalApiClient for automatic portal JWT auth
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  Cart,
  CartSellerGroup,
  AddToCartInput,
  UpdateCartItemInput,
  CreateRFQResult,
  BuyNowResult,
} from '../types/cart.types';

// =============================================================================
// Local Storage Keys
// =============================================================================

const CART_STORAGE_KEY = 'buyer-cart-cache';
const CART_TIMESTAMP_KEY = 'buyer-cart-timestamp';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// Local Storage Helpers
// =============================================================================

function getLocalCart(): Cart | null {
  try {
    const cached = localStorage.getItem(CART_STORAGE_KEY);
    const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);

    if (!cached || !timestamp) return null;

    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_TTL_MS) {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function setLocalCart(cart: Cart): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // localStorage might be full or disabled
  }
}

function clearLocalCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_TIMESTAMP_KEY);
  } catch {
    // Ignore errors
  }
}

// =============================================================================
// Cart Service
// =============================================================================

export const cartService = {
  /**
   * Get cart with all items (uses local cache as fallback)
   */
  async getCart(forceRefresh = false): Promise<Cart> {
    // Check local cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = getLocalCart();
      if (cached) return cached;
    }

    const cart = await portalApiClient.get<Cart>('/api/buyer-cart');
    setLocalCart(cart);
    return cart;
  },

  /**
   * Get cart items grouped by seller
   */
  async getCartGrouped(): Promise<CartSellerGroup[]> {
    return portalApiClient.get<CartSellerGroup[]>('/api/buyer-cart/grouped');
  },

  /**
   * Add item to cart
   */
  async addToCart(input: AddToCartInput): Promise<Cart> {
    const cart = await portalApiClient.post<Cart>('/api/buyer-cart/items', input);
    setLocalCart(cart);
    return cart;
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: string, input: UpdateCartItemInput): Promise<Cart> {
    const cart = await portalApiClient.patch<Cart>(`/api/buyer-cart/items/${itemId}`, input);
    setLocalCart(cart);
    return cart;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string): Promise<Cart> {
    const cart = await portalApiClient.delete<Cart>(`/api/buyer-cart/items/${itemId}`);
    setLocalCart(cart);
    return cart;
  },

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<Cart> {
    const cart = await portalApiClient.delete<Cart>('/api/buyer-cart');
    setLocalCart(cart);
    return cart;
  },

  /**
   * Create RFQ from all cart items
   */
  async createRFQForAll(): Promise<CreateRFQResult> {
    const result = await portalApiClient.post<CreateRFQResult>('/api/buyer-cart/rfq');
    clearLocalCart();
    return result;
  },

  /**
   * Create RFQ for items from a specific seller
   */
  async createRFQForSeller(sellerId: string): Promise<CreateRFQResult> {
    const result = await portalApiClient.post<CreateRFQResult>(`/api/buyer-cart/rfq/seller/${sellerId}`);
    clearLocalCart();
    return result;
  },

  /**
   * Buy Now - Create order for all Buy Now eligible items
   */
  async buyNowAll(paymentMethod?: string): Promise<BuyNowResult> {
    const result = await portalApiClient.post<BuyNowResult>('/api/buyer-cart/buy-now', {
      paymentMethod: paymentMethod || 'bank_transfer',
    });
    clearLocalCart();
    return result;
  },

  /**
   * Buy Now - Create order for Buy Now eligible items from a specific seller
   */
  async buyNowForSeller(sellerId: string, paymentMethod?: string): Promise<BuyNowResult> {
    const result = await portalApiClient.post<BuyNowResult>(`/api/buyer-cart/buy-now/seller/${sellerId}`, {
      paymentMethod: paymentMethod || 'bank_transfer',
    });
    clearLocalCart();
    return result;
  },

  /**
   * Get local cart count (for quick badge updates without API call)
   */
  getLocalCartCount(): number {
    const cached = getLocalCart();
    return cached?.itemCount ?? 0;
  },

  /**
   * Check if item is in local cart
   */
  isItemInLocalCart(itemId: string): boolean {
    const cached = getLocalCart();
    if (!cached) return false;
    return cached.items.some((item) => item.itemId === itemId);
  },

  /**
   * Get item quantity from local cart
   */
  getLocalItemQuantity(itemId: string): number {
    const cached = getLocalCart();
    if (!cached) return 0;
    const item = cached.items.find((i) => i.itemId === itemId);
    return item?.quantity ?? 0;
  },

  /**
   * Clear local cart cache
   */
  clearCache(): void {
    clearLocalCart();
  },
};

export default cartService;
