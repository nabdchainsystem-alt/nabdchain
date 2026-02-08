// =============================================================================
// Inventory Service - Stock Management for Seller Items
// =============================================================================

import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

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

export interface StockAdjustment {
  stockQty?: number;
  minOrderQty?: number;
}

// =============================================================================
// Constants
// =============================================================================

const LOW_STOCK_THRESHOLD = 10; // Items with stock <= this are "low stock"

// =============================================================================
// Helper Functions
// =============================================================================

function calculateStatus(stockQty: number, reservedQty: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  const available = stockQty - reservedQty;
  if (available <= 0) return 'out_of_stock';
  if (available <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

// =============================================================================
// Inventory Service
// =============================================================================

export const inventoryService = {
  /**
   * Get all inventory items for a seller
   */
  async getSellerInventory(sellerId: string, filters: InventoryFilters = {}): Promise<InventoryItem[]> {
    try {
      // Get all active items for the seller
      const items = await prisma.item.findMany({
        where: {
          userId: sellerId,
          status: { in: ['active', 'out_of_stock'] },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Get reserved quantities from pending orders
      const reservedByItem = await prisma.marketplaceOrder.groupBy({
        by: ['itemId'],
        where: {
          sellerId,
          status: { in: ['pending_confirmation', 'confirmed', 'in_progress'] },
        },
        _sum: { quantity: true },
      });

      const reservedMap = new Map(
        reservedByItem.map((r) => [r.itemId, r._sum.quantity || 0])
      );

      // Transform to inventory items
      let inventory: InventoryItem[] = items.map((item) => {
        const reservedQty = reservedMap.get(item.id) || 0;
        const availableQty = Math.max(0, item.stock - reservedQty);
        const status = calculateStatus(item.stock, reservedQty);

        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          stockQty: item.stock,
          reservedQty,
          availableQty,
          minOrderQty: item.minOrderQty,
          status,
          price: item.price,
          currency: item.currency,
          lastUpdated: item.updatedAt.toISOString(),
        };
      });

      // Apply filters
      if (filters.search) {
        const search = filters.search.toLowerCase();
        inventory = inventory.filter(
          (item) =>
            item.name.toLowerCase().includes(search) ||
            item.sku.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search)
        );
      }

      if (filters.status) {
        inventory = inventory.filter((item) => item.status === filters.status);
      }

      if (filters.category) {
        inventory = inventory.filter((item) => item.category === filters.category);
      }

      return inventory;
    } catch (error) {
      apiLogger.error('Error fetching inventory:', error);
      return [];
    }
  },

  /**
   * Update stock for a product
   */
  async updateStock(sellerId: string, productId: string, adjustment: StockAdjustment): Promise<InventoryItem | null> {
    try {
      // Verify ownership
      const item = await prisma.item.findFirst({
        where: { id: productId, userId: sellerId },
      });

      if (!item) {
        return null;
      }

      // Update the item
      const updatedItem = await prisma.item.update({
        where: { id: productId },
        data: {
          stock: adjustment.stockQty ?? item.stock,
          minOrderQty: adjustment.minOrderQty ?? item.minOrderQty,
          status: (adjustment.stockQty ?? item.stock) === 0 ? 'out_of_stock' : 'active',
        },
      });

      // Get reserved quantity
      const reserved = await prisma.marketplaceOrder.aggregate({
        where: {
          sellerId,
          itemId: productId,
          status: { in: ['pending_confirmation', 'confirmed', 'in_progress'] },
        },
        _sum: { quantity: true },
      });

      const reservedQty = reserved._sum.quantity || 0;
      const availableQty = Math.max(0, updatedItem.stock - reservedQty);
      const status = calculateStatus(updatedItem.stock, reservedQty);

      return {
        id: updatedItem.id,
        sku: updatedItem.sku,
        name: updatedItem.name,
        category: updatedItem.category,
        stockQty: updatedItem.stock,
        reservedQty,
        availableQty,
        minOrderQty: updatedItem.minOrderQty,
        status,
        price: updatedItem.price,
        currency: updatedItem.currency,
        lastUpdated: updatedItem.updatedAt.toISOString(),
      };
    } catch (error) {
      apiLogger.error('Error updating stock:', error);
      return null;
    }
  },

  /**
   * Get inventory summary/stats
   */
  async getInventorySummary(sellerId: string): Promise<{
    totalItems: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  }> {
    try {
      const inventory = await this.getSellerInventory(sellerId);

      const totalValue = inventory.reduce((sum, item) => sum + item.stockQty * item.price, 0);

      return {
        totalItems: inventory.length,
        inStock: inventory.filter((i) => i.status === 'in_stock').length,
        lowStock: inventory.filter((i) => i.status === 'low_stock').length,
        outOfStock: inventory.filter((i) => i.status === 'out_of_stock').length,
        totalValue,
      };
    } catch (error) {
      apiLogger.error('Error fetching inventory summary:', error);
      return {
        totalItems: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
      };
    }
  },
};

export default inventoryService;
