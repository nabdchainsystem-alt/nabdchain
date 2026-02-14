// =============================================================================
// Item Service - Frontend API Client for Universal Marketplace Items
// =============================================================================

import { portalApiClient } from './portalApiClient';
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
// Helper
// =============================================================================

function buildItemQS(filters: ItemFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.visibility) p.append('visibility', filters.visibility);
  if (filters.itemType) p.append('itemType', filters.itemType);
  if (filters.category) p.append('category', filters.category);
  if (filters.search) p.append('search', filters.search);
  if (filters.minPrice !== undefined) p.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) p.append('maxPrice', filters.maxPrice.toString());
  if (filters.inStock) p.append('inStock', 'true');
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

function buildMarketplaceQS(filters: MarketplaceFilters): string {
  const p = new URLSearchParams();
  if (filters.category) p.append('category', filters.category);
  if (filters.subcategory) p.append('subcategory', filters.subcategory);
  if (filters.itemType) p.append('itemType', filters.itemType);
  if (filters.search) p.append('search', filters.search);
  if (filters.minPrice !== undefined) p.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) p.append('maxPrice', filters.maxPrice.toString());
  if (filters.manufacturer) p.append('manufacturer', filters.manufacturer);
  if (filters.brand) p.append('brand', filters.brand);
  if (filters.sortBy) p.append('sortBy', filters.sortBy);
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// =============================================================================
// Item Service
// =============================================================================

export const itemService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  async getSellerItems(filters: ItemFilters = {}): Promise<Item[]> {
    logItemFlow('getSellerItems REQUEST', { filters });
    const items = await portalApiClient.get<Item[]>(`/api/items${buildItemQS(filters)}`);
    logPortalApiCall('GET', '/api/items', 200);
    logItemFlow('getSellerItems RESPONSE', { count: items.length });
    return items;
  },

  async getSellerStats(): Promise<SellerStats> {
    return portalApiClient.get<SellerStats>(`/api/items/stats`);
  },

  async getSellerItem(itemId: string): Promise<Item | null> {
    try {
      return await portalApiClient.get<Item>(`/api/items/${itemId}`);
    } catch {
      return null;
    }
  },

  async createItem(data: CreateItemData): Promise<Item> {
    logItemFlow('createItem REQUEST', {
      status: data.status,
      visibility: data.visibility,
      stock: data.stock,
      name: data.name,
    });

    const item = await portalApiClient.post<Item>(`/api/items`, data);
    logPortalApiCall('POST', '/api/items', 200);
    logItemFlow('createItem RESPONSE', {
      id: item.id,
      status: item.status,
      visibility: item.visibility,
      willShowInMarketplace: item.status === 'active' && item.visibility !== 'hidden',
    });

    return item;
  },

  async updateItem(itemId: string, data: Partial<CreateItemData>): Promise<Item> {
    return portalApiClient.put<Item>(`/api/items/${itemId}`, data);
  },

  async deleteItem(itemId: string): Promise<boolean> {
    await portalApiClient.delete(`/api/items/${itemId}`);
    return true;
  },

  async archiveItem(itemId: string): Promise<Item> {
    return portalApiClient.post<Item>(`/api/items/${itemId}/archive`);
  },

  async bulkUpdateStatus(itemIds: string[], status: ItemStatus): Promise<BulkUpdateResult> {
    return portalApiClient.post<BulkUpdateResult>(`/api/items/bulk/status`, { itemIds, status });
  },

  async bulkUpdateVisibility(itemIds: string[], visibility: ItemVisibility): Promise<BulkUpdateResult> {
    return portalApiClient.post<BulkUpdateResult>(`/api/items/bulk/visibility`, { itemIds, visibility });
  },

  async migrateFromPortalProduct(): Promise<BulkUpdateResult> {
    return portalApiClient.post<BulkUpdateResult>(`/api/items/migrate`);
  },

  // ---------------------------------------------------------------------------
  // Marketplace Operations (Buyer View)
  // ---------------------------------------------------------------------------

  async getMarketplaceItems(filters: MarketplaceFilters = {}): Promise<PaginatedResponse<Item>> {
    logItemFlow('getMarketplaceItems REQUEST', { filters });
    const result = await portalApiClient.get<PaginatedResponse<Item>>(
      `/api/items/marketplace/browse${buildMarketplaceQS(filters)}`,
    );
    logPortalApiCall('GET', '/api/items/marketplace/browse', 200);
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

  async getMarketplaceItem(itemId: string): Promise<Item | null> {
    try {
      return await portalApiClient.get<Item>(`/api/items/marketplace/${itemId}`);
    } catch {
      return null;
    }
  },

  async getSellerPublicItems(sellerId: string, filters: MarketplaceFilters = {}): Promise<PaginatedResponse<Item>> {
    const p = new URLSearchParams();
    if (filters.category) p.append('category', filters.category);
    if (filters.itemType) p.append('itemType', filters.itemType);
    if (filters.sortBy) p.append('sortBy', filters.sortBy);
    const qs = p.toString();
    return portalApiClient.get<PaginatedResponse<Item>>(
      `/api/items/marketplace/seller/${sellerId}${qs ? `?${qs}` : ''}`,
    );
  },

  // ---------------------------------------------------------------------------
  // RFQ Operations
  // ---------------------------------------------------------------------------

  async createRFQ(data: CreateRFQData): Promise<ItemRFQ> {
    return portalApiClient.post<ItemRFQ>(`/api/items/rfq`, data);
  },

  async getSellerRFQs(status?: string): Promise<ItemRFQ[]> {
    const qs = status ? `?status=${status}` : '';
    return portalApiClient.get<ItemRFQ[]>(`/api/items/rfq/seller${qs}`);
  },

  async getBuyerRFQs(status?: string): Promise<ItemRFQ[]> {
    const qs = status ? `?status=${status}` : '';
    return portalApiClient.get<ItemRFQ[]>(`/api/items/rfq/buyer${qs}`);
  },

  async respondToRFQ(rfqId: string, data: QuoteRFQData): Promise<ItemRFQ> {
    return portalApiClient.post<ItemRFQ>(`/api/items/rfq/${rfqId}/respond`, data);
  },

  async acceptRFQ(rfqId: string): Promise<ItemRFQ> {
    return portalApiClient.post<ItemRFQ>(`/api/items/rfq/${rfqId}/accept`);
  },

  async rejectRFQ(rfqId: string): Promise<ItemRFQ> {
    return portalApiClient.post<ItemRFQ>(`/api/items/rfq/${rfqId}/reject`);
  },

  async cancelRFQ(rfqId: string): Promise<ItemRFQ> {
    return portalApiClient.post<ItemRFQ>(`/api/items/rfq/${rfqId}/cancel`);
  },

  async reactivateRFQ(rfqId: string): Promise<ItemRFQ> {
    return portalApiClient.post<ItemRFQ>(`/api/items/rfq/${rfqId}/reactivate`);
  },
};

export default itemService;
