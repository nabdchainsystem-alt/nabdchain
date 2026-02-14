// =============================================================================
// Inventory Service - Frontend API Client for Stock Management
// =============================================================================

import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types
// =============================================================================

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stockQty: number;
  reservedQty: number;
  availableQty: number;
  minOrderQty: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  price: number;
  currency: string;
  lastUpdated: string;
}

export interface InventoryFilters {
  search?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  category?: string;
}

export interface InventorySummary {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface StockAdjustment {
  stockQty?: number;
  minOrderQty?: number;
}

// =============================================================================
// Inventory Service
// =============================================================================

export const inventoryService = {
  /**
   * Get all inventory items for the authenticated seller
   */
  async getSellerInventory(filters: InventoryFilters = {}): Promise<InventoryItem[]> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);

    const qs = params.toString();
    return portalApiClient.get<InventoryItem[]>(`/api/inventory/seller${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get inventory summary stats
   */
  async getInventorySummary(): Promise<InventorySummary> {
    return portalApiClient.get<InventorySummary>('/api/inventory/seller/summary');
  },

  /**
   * Update stock for a product
   */
  async updateStock(productId: string, adjustment: StockAdjustment): Promise<InventoryItem> {
    return portalApiClient.patch<InventoryItem>(`/api/inventory/seller/${productId}`, adjustment);
  },
};

export default inventoryService;
