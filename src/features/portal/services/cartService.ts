// =============================================================================
// Cart Service - Buyer Cart API Client
// =============================================================================
// RFQ aggregation cart - NOT a traditional checkout cart
// =============================================================================

import { API_URL } from '../../../config/api';
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
  async getCart(token: string, forceRefresh = false): Promise<Cart> {
    // Check local cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = getLocalCart();
      if (cached) return cached;
    }

    const response = await fetch(`${API_URL}/buyer-cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    const cart: Cart = await response.json();
    setLocalCart(cart);
    return cart;
  },

  /**
   * Get cart items grouped by seller
   */
  async getCartGrouped(token: string): Promise<CartSellerGroup[]> {
    const response = await fetch(`${API_URL}/buyer-cart/grouped`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch grouped cart');
    }

    return response.json();
  },

  /**
   * Add item to cart
   */
  async addToCart(token: string, input: AddToCartInput): Promise<Cart> {
    const response = await fetch(`${API_URL}/buyer-cart/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to add to cart' }));
      throw new Error(error.error || 'Failed to add to cart');
    }

    const cart: Cart = await response.json();
    setLocalCart(cart);
    return cart;
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    token: string,
    itemId: string,
    input: UpdateCartItemInput
  ): Promise<Cart> {
    const response = await fetch(`${API_URL}/buyer-cart/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update item' }));
      throw new Error(error.error || 'Failed to update item');
    }

    const cart: Cart = await response.json();
    setLocalCart(cart);
    return cart;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(token: string, itemId: string): Promise<Cart> {
    const response = await fetch(`${API_URL}/buyer-cart/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to remove item' }));
      throw new Error(error.error || 'Failed to remove item');
    }

    const cart: Cart = await response.json();
    setLocalCart(cart);
    return cart;
  },

  /**
   * Clear entire cart
   */
  async clearCart(token: string): Promise<Cart> {
    const response = await fetch(`${API_URL}/buyer-cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to clear cart' }));
      throw new Error(error.error || 'Failed to clear cart');
    }

    const cart: Cart = await response.json();
    setLocalCart(cart);
    return cart;
  },

  /**
   * Create RFQ from all cart items
   */
  async createRFQForAll(token: string): Promise<CreateRFQResult> {
    const response = await fetch(`${API_URL}/buyer-cart/rfq`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create RFQ' }));
      throw new Error(error.error || 'Failed to create RFQ');
    }

    // Clear local cache since cart is now locked/cleared
    clearLocalCart();

    return response.json();
  },

  /**
   * Create RFQ for items from a specific seller
   */
  async createRFQForSeller(token: string, sellerId: string): Promise<CreateRFQResult> {
    const response = await fetch(`${API_URL}/buyer-cart/rfq/seller/${sellerId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create RFQ' }));
      throw new Error(error.error || 'Failed to create RFQ');
    }

    // Clear local cache to force refresh
    clearLocalCart();

    return response.json();
  },

  /**
   * Buy Now - Create order for all Buy Now eligible items
   */
  async buyNowAll(token: string): Promise<BuyNowResult> {
    const response = await fetch(`${API_URL}/buyer-cart/buy-now`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to process purchase' }));
      throw new Error(error.error || 'Failed to process purchase');
    }

    // Clear local cache to force refresh
    clearLocalCart();

    return response.json();
  },

  /**
   * Buy Now - Create order for Buy Now eligible items from a specific seller
   */
  async buyNowForSeller(token: string, sellerId: string): Promise<BuyNowResult> {
    const response = await fetch(`${API_URL}/buyer-cart/buy-now/seller/${sellerId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to process purchase' }));
      throw new Error(error.error || 'Failed to process purchase');
    }

    // Clear local cache to force refresh
    clearLocalCart();

    return response.json();
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
