// =============================================================================
// Inventory Service - Frontend API Client for Stock Management
// =============================================================================

import { API_URL } from '../../../config/api';

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
  async getSellerInventory(token: string, filters: InventoryFilters = {}): Promise<InventoryItem[]> {
    const url = new URL(`${API_URL}/inventory/seller`);

    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.category) url.searchParams.append('category', filters.category);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    return response.json();
  },

  /**
   * Get inventory summary stats
   */
  async getInventorySummary(token: string): Promise<InventorySummary> {
    const response = await fetch(`${API_URL}/inventory/seller/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory summary');
    }

    return response.json();
  },

  /**
   * Update stock for a product
   */
  async updateStock(token: string, productId: string, adjustment: StockAdjustment): Promise<InventoryItem> {
    const response = await fetch(`${API_URL}/inventory/seller/${productId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adjustment),
    });

    if (!response.ok) {
      throw new Error('Failed to update stock');
    }

    return response.json();
  },
};

export default inventoryService;
