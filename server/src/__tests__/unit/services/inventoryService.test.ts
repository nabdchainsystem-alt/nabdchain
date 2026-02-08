/**
 * Inventory Service — Unit Tests
 *
 * Tests cover: getSellerInventory (with filters, stock calculation, status),
 * updateStock, getInventorySummary, calculateStatus helper behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

// vi.mock must be in the test file for proper hoisting
vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { inventoryService } from '../../../services/inventoryService';
import { createMockFullItem } from '../../factories';

beforeEach(() => {
  resetMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createItem(overrides: Record<string, unknown> = {}) {
  return createMockFullItem({
    stock: 100,
    minOrderQty: 1,
    price: 50,
    currency: 'SAR',
    ...overrides,
  });
}

// =============================================================================
// getSellerInventory
// =============================================================================

describe('getSellerInventory', () => {
  it('returns inventory items with calculated fields', async () => {
    const items = [createItem({ id: 'item-1', name: 'Widget A', stock: 50 })];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([
      { itemId: 'item-1', _sum: { quantity: 5 } },
    ]);

    const result = await inventoryService.getSellerInventory('seller-1');

    expect(result).toHaveLength(1);
    expect(result[0].stockQty).toBe(50);
    expect(result[0].reservedQty).toBe(5);
    expect(result[0].availableQty).toBe(45);
    expect(result[0].status).toBe('in_stock');
  });

  it('returns empty array when no items', async () => {
    prismaMock.item.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);

    const result = await inventoryService.getSellerInventory('seller-1');

    expect(result).toHaveLength(0);
  });

  it('calculates out_of_stock when all stock reserved', async () => {
    const items = [createItem({ id: 'item-1', stock: 10 })];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([
      { itemId: 'item-1', _sum: { quantity: 10 } },
    ]);

    const result = await inventoryService.getSellerInventory('seller-1');

    expect(result[0].status).toBe('out_of_stock');
    expect(result[0].availableQty).toBe(0);
  });

  it('calculates low_stock when available is below threshold', async () => {
    const items = [createItem({ id: 'item-1', stock: 15 })];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([
      { itemId: 'item-1', _sum: { quantity: 8 } }, // available = 7, below threshold of 10
    ]);

    const result = await inventoryService.getSellerInventory('seller-1');

    expect(result[0].status).toBe('low_stock');
  });

  it('filters by search term (name)', async () => {
    const items = [
      createItem({ id: 'item-1', name: 'Widget A', sku: 'W-001', category: 'Parts' }),
      createItem({ id: 'item-2', name: 'Gear B', sku: 'G-001', category: 'Gears' }),
    ];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);

    const result = await inventoryService.getSellerInventory('seller-1', { search: 'widget' });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Widget A');
  });

  it('filters by search term (sku)', async () => {
    const items = [
      createItem({ id: 'item-1', name: 'Widget A', sku: 'W-001', category: 'Parts' }),
      createItem({ id: 'item-2', name: 'Gear B', sku: 'G-001', category: 'Gears' }),
    ];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);

    const result = await inventoryService.getSellerInventory('seller-1', { search: 'G-001' });

    expect(result).toHaveLength(1);
    expect(result[0].sku).toBe('G-001');
  });

  it('filters by status', async () => {
    const items = [
      createItem({ id: 'item-1', stock: 100 }),
      createItem({ id: 'item-2', stock: 5 }),
    ];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);

    const result = await inventoryService.getSellerInventory('seller-1', { status: 'low_stock' });

    expect(result).toHaveLength(1);
    expect(result[0].stockQty).toBe(5);
  });

  it('filters by category', async () => {
    const items = [
      createItem({ id: 'item-1', category: 'Bearings' }),
      createItem({ id: 'item-2', category: 'Gears' }),
    ];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);

    const result = await inventoryService.getSellerInventory('seller-1', { category: 'Gears' });

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Gears');
  });

  it('handles items with no reserved orders', async () => {
    const items = [createItem({ id: 'item-1', stock: 50 })];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]); // no orders

    const result = await inventoryService.getSellerInventory('seller-1');

    expect(result[0].reservedQty).toBe(0);
    expect(result[0].availableQty).toBe(50);
  });

  it('returns empty array on error', async () => {
    prismaMock.item.findMany.mockRejectedValue(new Error('DB error'));

    const result = await inventoryService.getSellerInventory('seller-1');

    expect(result).toEqual([]);
  });
});

// =============================================================================
// updateStock
// =============================================================================

describe('updateStock', () => {
  it('updates stock quantity', async () => {
    const item = createItem({ id: 'item-1', stock: 50 });
    prismaMock.item.findFirst.mockResolvedValue(item);
    prismaMock.item.update.mockResolvedValue({ ...item, stock: 75 });
    prismaMock.marketplaceOrder.aggregate.mockResolvedValue({ _sum: { quantity: 5 } });

    const result = await inventoryService.updateStock('seller-1', 'item-1', { stockQty: 75 });

    expect(result).not.toBeNull();
    expect(result?.stockQty).toBe(75);
    expect(result?.availableQty).toBe(70);
  });

  it('updates minOrderQty', async () => {
    const item = createItem({ id: 'item-1', stock: 50, minOrderQty: 1 });
    prismaMock.item.findFirst.mockResolvedValue(item);
    prismaMock.item.update.mockResolvedValue({ ...item, minOrderQty: 5 });
    prismaMock.marketplaceOrder.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

    const result = await inventoryService.updateStock('seller-1', 'item-1', { minOrderQty: 5 });

    expect(result).not.toBeNull();
    expect(result?.minOrderQty).toBe(5);
  });

  it('returns null when item not found', async () => {
    prismaMock.item.findFirst.mockResolvedValue(null);

    const result = await inventoryService.updateStock('seller-1', 'nonexistent', { stockQty: 10 });

    expect(result).toBeNull();
  });

  it('sets status to out_of_stock when stock is 0', async () => {
    const item = createItem({ id: 'item-1', stock: 50 });
    prismaMock.item.findFirst.mockResolvedValue(item);
    prismaMock.item.update.mockResolvedValue({ ...item, stock: 0 });
    prismaMock.marketplaceOrder.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

    const result = await inventoryService.updateStock('seller-1', 'item-1', { stockQty: 0 });

    expect(result?.status).toBe('out_of_stock');
    // Also verify the update call set the status correctly
    const updateCall = prismaMock.item.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('out_of_stock');
  });

  it('returns null on error', async () => {
    prismaMock.item.findFirst.mockRejectedValue(new Error('DB error'));

    const result = await inventoryService.updateStock('seller-1', 'item-1', { stockQty: 10 });

    expect(result).toBeNull();
  });
});

// =============================================================================
// getInventorySummary
// =============================================================================

describe('getInventorySummary', () => {
  it('returns correct summary stats', async () => {
    const items = [
      createItem({ id: 'item-1', stock: 100, price: 50 }),  // in_stock
      createItem({ id: 'item-2', stock: 5, price: 200 }),    // low_stock
      createItem({ id: 'item-3', stock: 0, price: 100 }),    // out_of_stock
    ];
    prismaMock.item.findMany.mockResolvedValue(items);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);

    const result = await inventoryService.getInventorySummary('seller-1');

    expect(result.totalItems).toBe(3);
    expect(result.inStock).toBe(1);
    expect(result.lowStock).toBe(1);
    expect(result.outOfStock).toBe(1);
    // totalValue = 100*50 + 5*200 + 0*100 = 5000 + 1000 + 0 = 6000
    expect(result.totalValue).toBe(6000);
  });

  it('returns zeros when no inventory', async () => {
    prismaMock.item.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);

    const result = await inventoryService.getInventorySummary('seller-1');

    expect(result.totalItems).toBe(0);
    expect(result.inStock).toBe(0);
    expect(result.lowStock).toBe(0);
    expect(result.outOfStock).toBe(0);
    expect(result.totalValue).toBe(0);
  });

  it('returns default values on error', async () => {
    prismaMock.item.findMany.mockRejectedValue(new Error('DB error'));

    const result = await inventoryService.getInventorySummary('seller-1');

    expect(result.totalItems).toBe(0);
    expect(result.totalValue).toBe(0);
  });
});
