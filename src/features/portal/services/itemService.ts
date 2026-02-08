// =============================================================================
// Item Service - Frontend API Client for Universal Marketplace Items
// =============================================================================

import { API_URL } from '../../../config/api';
import { logPortalApiCall } from '../../../utils/logger';
import {
  Item,
  CreateItemData,
  ItemFilters,
  MarketplaceFilters,
  ItemRFQ,
  CreateRFQData,
  QuoteRFQData,
  ItemStatus,
  ItemVisibility,
} from '../types/item.types';

// DEV-only: Log item creation/marketplace queries for debugging
const isDev = import.meta.env.DEV;
const logItemFlow = (action: string, data: unknown) => {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug(`[ItemService] ${action}`, data);
  }
};

// =============================================================================
// Types
// =============================================================================

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SellerStats {
  totalItems: number;
  activeItems: number;
  draftItems: number;
  outOfStockItems: number;
  totalQuotes: number;
  successfulOrders: number;
}

interface BulkUpdateResult {
  success: boolean;
  count: number;
}

// =============================================================================
// Item Service
// =============================================================================

export const itemService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all items for the authenticated seller
   */
  async getSellerItems(token: string, filters: ItemFilters = {}): Promise<Item[]> {
    const url = new URL(`${API_URL}/items`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.visibility) url.searchParams.append('visibility', filters.visibility);
    if (filters.itemType) url.searchParams.append('itemType', filters.itemType);
    if (filters.category) url.searchParams.append('category', filters.category);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.minPrice !== undefined) url.searchParams.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) url.searchParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.inStock) url.searchParams.append('inStock', 'true');

    logItemFlow('getSellerItems REQUEST', { filters });

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    logPortalApiCall('GET', '/api/items', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      logItemFlow('getSellerItems ERROR', { status: response.status, error });
      throw new Error(error.error || error.hint || 'Failed to fetch items');
    }

    const items = await response.json();
    logItemFlow('getSellerItems RESPONSE', { count: items.length });
    return items;
  },

  /**
   * Get seller item statistics
   */
  async getSellerStats(token: string): Promise<SellerStats> {
    const response = await fetch(`${API_URL}/items/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return response.json();
  },

  /**
   * Get single item for seller
   */
  async getSellerItem(token: string, itemId: string): Promise<Item | null> {
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch item');
    }

    return response.json();
  },

  /**
   * Create new item
   */
  async createItem(token: string, data: CreateItemData): Promise<Item> {
    // DEV: Log item creation request for debugging visibility issues
    logItemFlow('createItem REQUEST', {
      status: data.status,
      visibility: data.visibility,
      stock: data.stock,
      name: data.name,
    });

    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    logPortalApiCall('POST', '/api/items', response.status);

    if (!response.ok) {
      const error = await response.json();
      logItemFlow('createItem ERROR', error);
      // Include validation details in the error message
      const details = error.details ? JSON.stringify(error.details) : '';
      throw new Error(`${error.error || 'Failed to create item'}${details ? ': ' + details : ''}`);
    }

    const item = await response.json();
    // DEV: Log created item to verify status/visibility saved correctly
    logItemFlow('createItem RESPONSE', {
      id: item.id,
      status: item.status,
      visibility: item.visibility,
      willShowInMarketplace: item.status === 'active' && item.visibility !== 'hidden',
    });

    return item;
  },

  /**
   * Update item
   */
  async updateItem(token: string, itemId: string, data: Partial<CreateItemData>): Promise<Item> {
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update item');
    }

    return response.json();
  },

  /**
   * Delete item
   */
  async deleteItem(token: string, itemId: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to delete item');
    }

    return true;
  },

  /**
   * Archive item (soft delete)
   */
  async archiveItem(token: string, itemId: string): Promise<Item> {
    const response = await fetch(`${API_URL}/items/${itemId}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to archive item');
    }

    return response.json();
  },

  /**
   * Bulk update item status
   */
  async bulkUpdateStatus(token: string, itemIds: string[], status: ItemStatus): Promise<BulkUpdateResult> {
    const response = await fetch(`${API_URL}/items/bulk/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemIds, status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update items');
    }

    return response.json();
  },

  /**
   * Bulk update item visibility
   */
  async bulkUpdateVisibility(token: string, itemIds: string[], visibility: ItemVisibility): Promise<BulkUpdateResult> {
    const response = await fetch(`${API_URL}/items/bulk/visibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemIds, visibility }),
    });

    if (!response.ok) {
      throw new Error('Failed to update items');
    }

    return response.json();
  },

  /**
   * Migrate from PortalProduct to Item
   */
  async migrateFromPortalProduct(token: string): Promise<BulkUpdateResult> {
    const response = await fetch(`${API_URL}/items/migrate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to migrate products');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Marketplace Operations (Buyer View)
  // ---------------------------------------------------------------------------

  /**
   * Get marketplace items (public view)
   */
  async getMarketplaceItems(token: string, filters: MarketplaceFilters = {}): Promise<PaginatedResponse<Item>> {
    const url = new URL(`${API_URL}/items/marketplace/browse`);

    if (filters.category) url.searchParams.append('category', filters.category);
    if (filters.subcategory) url.searchParams.append('subcategory', filters.subcategory);
    if (filters.itemType) url.searchParams.append('itemType', filters.itemType);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.minPrice !== undefined) url.searchParams.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) url.searchParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.manufacturer) url.searchParams.append('manufacturer', filters.manufacturer);
    if (filters.brand) url.searchParams.append('brand', filters.brand);
    if (filters.sortBy) url.searchParams.append('sortBy', filters.sortBy);

    // DEV: Log marketplace query for debugging
    logItemFlow('getMarketplaceItems REQUEST', { filters });

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    logPortalApiCall('GET', '/api/items/marketplace/browse', response.status);

    if (!response.ok) {
      throw new Error('Failed to fetch marketplace items');
    }

    const result = await response.json();
    // DEV: Log marketplace results
    logItemFlow('getMarketplaceItems RESPONSE', {
      totalItems: result.pagination?.total || 0,
      itemsReturned: result.items?.length || 0,
      hint:
        result.items?.length === 0
          ? 'No items found. Check: 1) Seller created items with Publish (not Draft), 2) Items have stock > 0'
          : undefined,
    });

    return result;
  },

  /**
   * Get single marketplace item (public view)
   */
  async getMarketplaceItem(token: string, itemId: string): Promise<Item | null> {
    const response = await fetch(`${API_URL}/items/marketplace/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch item');
    }

    return response.json();
  },

  /**
   * Get seller's public items
   */
  async getSellerPublicItems(
    token: string,
    sellerId: string,
    filters: MarketplaceFilters = {},
  ): Promise<PaginatedResponse<Item>> {
    const url = new URL(`${API_URL}/items/marketplace/seller/${sellerId}`);

    if (filters.category) url.searchParams.append('category', filters.category);
    if (filters.itemType) url.searchParams.append('itemType', filters.itemType);
    if (filters.sortBy) url.searchParams.append('sortBy', filters.sortBy);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch seller items');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // RFQ Operations
  // ---------------------------------------------------------------------------

  /**
   * Create RFQ request (buyer)
   */
  async createRFQ(token: string, data: CreateRFQData): Promise<ItemRFQ> {
    const response = await fetch(`${API_URL}/items/rfq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      // Include validation details in error message if available
      let errorMessage = error.error || 'Failed to create RFQ';
      if (error.details && Array.isArray(error.details)) {
        const details = error.details
          .map((d: { path?: string[]; message?: string }) => `${d.path?.join('.')}: ${d.message}`)
          .join(', ');
        errorMessage = `${errorMessage} (${details})`;
        console.error('RFQ validation error details:', error.details);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Get RFQs for seller
   */
  async getSellerRFQs(token: string, status?: string): Promise<ItemRFQ[]> {
    const url = new URL(`${API_URL}/items/rfq/seller`);
    if (status) url.searchParams.append('status', status);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch RFQs');
    }

    return response.json();
  },

  /**
   * Get RFQs for buyer
   */
  async getBuyerRFQs(token: string, status?: string): Promise<ItemRFQ[]> {
    const url = new URL(`${API_URL}/items/rfq/buyer`);
    if (status) url.searchParams.append('status', status);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch RFQs');
    }

    return response.json();
  },

  /**
   * Respond to RFQ (seller)
   */
  async respondToRFQ(token: string, rfqId: string, data: QuoteRFQData): Promise<ItemRFQ> {
    const response = await fetch(`${API_URL}/items/rfq/${rfqId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to respond to RFQ');
    }

    return response.json();
  },

  /**
   * Accept RFQ quote (buyer)
   */
  async acceptRFQ(token: string, rfqId: string): Promise<ItemRFQ> {
    const response = await fetch(`${API_URL}/items/rfq/${rfqId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to accept RFQ');
    }

    return response.json();
  },

  /**
   * Reject RFQ quote (buyer)
   */
  async rejectRFQ(token: string, rfqId: string): Promise<ItemRFQ> {
    const response = await fetch(`${API_URL}/items/rfq/${rfqId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to reject RFQ');
    }

    return response.json();
  },

  /**
   * Cancel RFQ (buyer) - only for pending/under_review RFQs
   */
  async cancelRFQ(token: string, rfqId: string): Promise<ItemRFQ> {
    const response = await fetch(`${API_URL}/items/rfq/${rfqId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      // Include details in error message if available
      const message = error.details ? `${error.error}: ${error.details}` : error.error || 'Failed to cancel RFQ';
      throw new Error(message);
    }

    return response.json();
  },

  /**
   * Reactivate a cancelled RFQ (buyer) - only for cancelled RFQs
   */
  async reactivateRFQ(token: string, rfqId: string): Promise<ItemRFQ> {
    const response = await fetch(`${API_URL}/items/rfq/${rfqId}/reactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      const message = error.details ? `${error.error}: ${error.details}` : error.error || 'Failed to reactivate RFQ';
      throw new Error(message);
    }

    return response.json();
  },
};

export default itemService;
