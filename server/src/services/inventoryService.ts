// =============================================================================
// Inventory Service - Stock Management for Seller Items
// =============================================================================

import { prisma } from '../lib/prisma';

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
// Mock Data for Demo
// =============================================================================

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_1',
    sku: 'HP-5000',
    name: 'Hydraulic Pump HP-5000',
    category: 'Pumps',
    stockQty: 45,
    reservedQty: 12,
    availableQty: 33,
    minOrderQty: 1,
    status: 'in_stock',
    price: 2500,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_2',
    sku: 'IB-200',
    name: 'Industrial Bearing Set IB-200',
    category: 'Bearings',
    stockQty: 8,
    reservedQty: 3,
    availableQty: 5,
    minOrderQty: 5,
    status: 'low_stock',
    price: 450,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_3',
    sku: 'PC-100',
    name: 'Pneumatic Cylinder PC-100',
    category: 'Cylinders',
    stockQty: 120,
    reservedQty: 25,
    availableQty: 95,
    minOrderQty: 1,
    status: 'in_stock',
    price: 890,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_4',
    sku: 'MC-300',
    name: 'Motor Controller MC-300',
    category: 'Controllers',
    stockQty: 0,
    reservedQty: 0,
    availableQty: 0,
    minOrderQty: 1,
    status: 'out_of_stock',
    price: 1200,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_5',
    sku: 'SV-50',
    name: 'Safety Valve SV-50',
    category: 'Valves',
    stockQty: 75,
    reservedQty: 8,
    availableQty: 67,
    minOrderQty: 2,
    status: 'in_stock',
    price: 320,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_6',
    sku: 'FT-400',
    name: 'Flow Transmitter FT-400',
    category: 'Sensors',
    stockQty: 5,
    reservedQty: 5,
    availableQty: 0,
    minOrderQty: 1,
    status: 'out_of_stock',
    price: 1800,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_7',
    sku: 'GK-150',
    name: 'Gasket Kit GK-150',
    category: 'Seals',
    stockQty: 200,
    reservedQty: 45,
    availableQty: 155,
    minOrderQty: 10,
    status: 'in_stock',
    price: 85,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_8',
    sku: 'HF-250',
    name: 'Hydraulic Filter HF-250',
    category: 'Filters',
    stockQty: 6,
    reservedQty: 2,
    availableQty: 4,
    minOrderQty: 1,
    status: 'low_stock',
    price: 175,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_9',
    sku: 'CP-800',
    name: 'Coupling Assembly CP-800',
    category: 'Couplings',
    stockQty: 32,
    reservedQty: 10,
    availableQty: 22,
    minOrderQty: 1,
    status: 'in_stock',
    price: 560,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv_10',
    sku: 'PT-120',
    name: 'Pressure Transducer PT-120',
    category: 'Sensors',
    stockQty: 3,
    reservedQty: 0,
    availableQty: 3,
    minOrderQty: 1,
    status: 'low_stock',
    price: 2200,
    currency: 'SAR',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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

      // Return mock data if no real data
      if (inventory.length === 0) {
        return applyFiltersToMock(MOCK_INVENTORY, filters);
      }

      return inventory;
    } catch (error) {
      console.log('Using mock data for inventory:', error);
      return applyFiltersToMock(MOCK_INVENTORY, filters);
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
      console.log('Error updating stock:', error);
      // Return mock updated item
      const mockItem = MOCK_INVENTORY.find((i) => i.id === productId);
      if (mockItem && adjustment.stockQty !== undefined) {
        const updatedMock = { ...mockItem };
        updatedMock.stockQty = adjustment.stockQty;
        updatedMock.availableQty = Math.max(0, adjustment.stockQty - updatedMock.reservedQty);
        updatedMock.status = calculateStatus(updatedMock.stockQty, updatedMock.reservedQty);
        updatedMock.lastUpdated = new Date().toISOString();
        return updatedMock;
      }
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
      console.log('Using mock data for inventory summary:', error);
      const totalValue = MOCK_INVENTORY.reduce((sum, item) => sum + item.stockQty * item.price, 0);
      return {
        totalItems: MOCK_INVENTORY.length,
        inStock: MOCK_INVENTORY.filter((i) => i.status === 'in_stock').length,
        lowStock: MOCK_INVENTORY.filter((i) => i.status === 'low_stock').length,
        outOfStock: MOCK_INVENTORY.filter((i) => i.status === 'out_of_stock').length,
        totalValue,
      };
    }
  },
};

// Helper function to apply filters to mock data
function applyFiltersToMock(inventory: InventoryItem[], filters: InventoryFilters): InventoryItem[] {
  let result = [...inventory];

  if (filters.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
    );
  }

  if (filters.status) {
    result = result.filter((item) => item.status === filters.status);
  }

  if (filters.category) {
    result = result.filter((item) => item.category === filters.category);
  }

  return result;
}

export default inventoryService;
