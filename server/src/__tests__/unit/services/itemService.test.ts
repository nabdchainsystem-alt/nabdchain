/**
 * Item Service — Unit Tests
 *
 * Tests cover: pure helpers (visibility, status, validation), seller CRUD,
 * marketplace queries, RFQ operations, analytics, and error handling.
 * Prisma is fully mocked.
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

import {
  itemService,
  isMarketplaceVisible,
  isPubliclySearchable,
  validateForPublishing,
  determineStatus,
} from '../../../services/itemService';

import { createMockFullItem } from '../../factories';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Pure helper functions (no Prisma)
// =============================================================================

describe('Item visibility helpers', () => {
  describe('isMarketplaceVisible', () => {
    it('returns true for active + public', () => {
      expect(isMarketplaceVisible('active', 'public')).toBe(true);
    });

    it('returns true for active + rfq_only', () => {
      expect(isMarketplaceVisible('active', 'rfq_only')).toBe(true);
    });

    it('returns false for active + hidden', () => {
      expect(isMarketplaceVisible('active', 'hidden')).toBe(false);
    });

    it('returns false for draft + public', () => {
      expect(isMarketplaceVisible('draft', 'public')).toBe(false);
    });

    it('returns false for archived + public', () => {
      expect(isMarketplaceVisible('archived', 'public')).toBe(false);
    });

    it('returns false for out_of_stock + public', () => {
      expect(isMarketplaceVisible('out_of_stock', 'public')).toBe(false);
    });
  });

  describe('isPubliclySearchable', () => {
    it('returns true only for active + public', () => {
      expect(isPubliclySearchable('active', 'public')).toBe(true);
    });

    it('returns false for active + rfq_only', () => {
      expect(isPubliclySearchable('active', 'rfq_only')).toBe(false);
    });

    it('returns false for draft + public', () => {
      expect(isPubliclySearchable('draft', 'public')).toBe(false);
    });
  });
});

describe('validateForPublishing', () => {
  it('returns no errors for valid item', () => {
    const errors = validateForPublishing({
      name: 'Widget',
      sku: 'W-001',
      category: 'Parts',
      price: 10,
    });
    expect(errors).toHaveLength(0);
  });

  it('returns error for missing name', () => {
    const errors = validateForPublishing({ sku: 'W-001', category: 'Parts', price: 10 });
    expect(errors).toContain('Name is required');
  });

  it('returns error for empty name', () => {
    const errors = validateForPublishing({ name: '  ', sku: 'W-001', category: 'Parts', price: 10 });
    expect(errors).toContain('Name is required');
  });

  it('returns error for missing SKU', () => {
    const errors = validateForPublishing({ name: 'Widget', category: 'Parts', price: 10 });
    expect(errors).toContain('SKU is required');
  });

  it('returns error for missing category', () => {
    const errors = validateForPublishing({ name: 'Widget', sku: 'W-001', price: 10 });
    expect(errors).toContain('Category is required');
  });

  it('returns error for negative price', () => {
    const errors = validateForPublishing({ name: 'Widget', sku: 'W-001', category: 'Parts', price: -5 });
    expect(errors).toContain('Valid price is required');
  });

  it('returns error for undefined price', () => {
    const errors = validateForPublishing({ name: 'Widget', sku: 'W-001', category: 'Parts' });
    expect(errors).toContain('Valid price is required');
  });

  it('returns multiple errors at once', () => {
    const errors = validateForPublishing({});
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('determineStatus', () => {
  it('respects explicit archived request', () => {
    expect(determineStatus('archived', 50, 'active')).toBe('archived');
  });

  it('sets out_of_stock when requesting active with zero stock', () => {
    expect(determineStatus('active', 0)).toBe('out_of_stock');
  });

  it('sets out_of_stock when active item stock hits zero', () => {
    expect(determineStatus(undefined, 0, 'active')).toBe('out_of_stock');
  });

  it('reactivates when out_of_stock item gains stock', () => {
    expect(determineStatus(undefined, 10, 'out_of_stock')).toBe('active');
  });

  it('returns requested status when no special conditions', () => {
    expect(determineStatus('active', 50)).toBe('active');
  });

  it('returns current status when no requested status', () => {
    expect(determineStatus(undefined, 50, 'draft')).toBe('draft');
  });

  it('defaults to draft when nothing is provided', () => {
    expect(determineStatus(undefined, 0)).toBe('draft');
  });
});

// =============================================================================
// Service methods (Prisma mocked)
// =============================================================================

describe('itemService', () => {
  // ---------------------------------------------------------------------------
  // getSellerItems
  // ---------------------------------------------------------------------------

  describe('getSellerItems', () => {
    it('returns items for a seller', async () => {
      const items = [createMockFullItem(), createMockFullItem({ id: 'item-2', name: 'Gasket' })];
      prismaMock.item.findMany.mockResolvedValue(items);

      const result = await itemService.getSellerItems('seller-1');

      expect(result).toHaveLength(2);
      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'seller-1' } }),
      );
    });

    it('applies status filter', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);

      await itemService.getSellerItems('seller-1', { status: 'active' });

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'seller-1', status: 'active' }),
        }),
      );
    });

    it('applies search filter with OR conditions', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);

      await itemService.getSellerItems('seller-1', { search: 'bearing' });

      const call = prismaMock.item.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toHaveLength(5);
    });

    it('applies price range filter', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);

      await itemService.getSellerItems('seller-1', { minPrice: 10, maxPrice: 100 });

      const call = prismaMock.item.findMany.mock.calls[0][0];
      expect(call.where.price).toEqual({ gte: 10, lte: 100 });
    });

    it('applies inStock filter', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);

      await itemService.getSellerItems('seller-1', { inStock: true });

      const call = prismaMock.item.findMany.mock.calls[0][0];
      expect(call.where.stock).toEqual({ gt: 0 });
    });

    it('returns empty array on error', async () => {
      prismaMock.item.findMany.mockRejectedValue(new Error('DB error'));

      const result = await itemService.getSellerItems('seller-1');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getSellerItem
  // ---------------------------------------------------------------------------

  describe('getSellerItem', () => {
    it('returns item for matching user', async () => {
      const item = createMockFullItem();
      prismaMock.item.findFirst.mockResolvedValue(item);

      const result = await itemService.getSellerItem('seller-1', 'item-1');

      expect(result).toEqual(item);
      expect(prismaMock.item.findFirst).toHaveBeenCalledWith({
        where: { id: 'item-1', userId: 'seller-1' },
      });
    });

    it('returns null when item not found', async () => {
      prismaMock.item.findFirst.mockResolvedValue(null);

      const result = await itemService.getSellerItem('seller-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // createItem
  // ---------------------------------------------------------------------------

  describe('createItem', () => {
    it('creates item with defaults', async () => {
      const created = createMockFullItem({ id: 'new-item' });
      prismaMock.item.create.mockResolvedValue(created);

      const result = await itemService.createItem('seller-1', {
        name: 'New Widget',
        sku: 'NW-001',
        category: 'Parts',
        price: 50,
        stock: 100,
      });

      expect(result.id).toBe('new-item');
      const createCall = prismaMock.item.create.mock.calls[0][0];
      expect(createCall.data.userId).toBe('seller-1');
      expect(createCall.data.currency).toBe('SAR');
      expect(createCall.data.visibility).toBe('public');
      expect(createCall.data.itemType).toBe('part');
      expect(createCall.data.minOrderQty).toBe(1);
    });

    it('serializes JSON fields', async () => {
      prismaMock.item.create.mockResolvedValue(createMockFullItem());

      await itemService.createItem('seller-1', {
        name: 'Widget',
        sku: 'W-001',
        category: 'Parts',
        price: 50,
        images: ['img1.jpg', 'img2.jpg'],
        specifications: { weight: '500g' },
        compatibility: [{ make: 'Toyota', model: 'Camry' }],
      });

      const createCall = prismaMock.item.create.mock.calls[0][0];
      expect(createCall.data.images).toBe(JSON.stringify(['img1.jpg', 'img2.jpg']));
      expect(createCall.data.specifications).toBe(JSON.stringify({ weight: '500g' }));
      expect(createCall.data.compatibility).toBe(JSON.stringify([{ make: 'Toyota', model: 'Camry' }]));
    });

    it('sets publishedAt when status is active', async () => {
      prismaMock.item.create.mockResolvedValue(createMockFullItem());

      await itemService.createItem('seller-1', {
        name: 'Widget',
        sku: 'W-001',
        category: 'Parts',
        price: 50,
        stock: 100,
        status: 'active',
      });

      const createCall = prismaMock.item.create.mock.calls[0][0];
      expect(createCall.data.publishedAt).toBeInstanceOf(Date);
    });

    it('does not set publishedAt when status is draft', async () => {
      prismaMock.item.create.mockResolvedValue(createMockFullItem({ status: 'draft' }));

      await itemService.createItem('seller-1', {
        name: 'Widget',
        sku: 'W-001',
        category: 'Parts',
        price: 50,
        stock: 0,
        status: 'draft',
      });

      const createCall = prismaMock.item.create.mock.calls[0][0];
      expect(createCall.data.publishedAt).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // updateItem
  // ---------------------------------------------------------------------------

  describe('updateItem', () => {
    it('returns null when item not found', async () => {
      prismaMock.item.findFirst.mockResolvedValue(null);

      const result = await itemService.updateItem('seller-1', 'nonexistent', { name: 'Updated' });

      expect(result).toBeNull();
    });

    it('updates item fields', async () => {
      const existing = createMockFullItem({ status: 'active' });
      const updated = { ...existing, name: 'Updated Widget' };
      prismaMock.item.findFirst.mockResolvedValue(existing);
      prismaMock.item.update.mockResolvedValue(updated);

      const result = await itemService.updateItem('seller-1', existing.id, { name: 'Updated Widget' });

      expect(result!.name).toBe('Updated Widget');
    });

    it('sets publishedAt when transitioning to active', async () => {
      const existing = createMockFullItem({ status: 'draft', publishedAt: null });
      prismaMock.item.findFirst.mockResolvedValue(existing);
      prismaMock.item.update.mockResolvedValue({ ...existing, status: 'active' });

      await itemService.updateItem('seller-1', existing.id, { status: 'active', stock: 50 });

      const updateCall = prismaMock.item.update.mock.calls[0][0];
      expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
    });

    it('sets archivedAt when transitioning to archived', async () => {
      const existing = createMockFullItem({ status: 'active', archivedAt: null });
      prismaMock.item.findFirst.mockResolvedValue(existing);
      prismaMock.item.update.mockResolvedValue({ ...existing, status: 'archived' });

      await itemService.updateItem('seller-1', existing.id, { status: 'archived' });

      const updateCall = prismaMock.item.update.mock.calls[0][0];
      expect(updateCall.data.archivedAt).toBeInstanceOf(Date);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteItem
  // ---------------------------------------------------------------------------

  describe('deleteItem', () => {
    it('deletes item and returns true', async () => {
      prismaMock.item.findFirst.mockResolvedValue(createMockFullItem());
      prismaMock.item.delete.mockResolvedValue({});

      const result = await itemService.deleteItem('seller-1', 'item-1');

      expect(result).toBe(true);
      expect(prismaMock.item.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
    });

    it('returns false when item not found', async () => {
      prismaMock.item.findFirst.mockResolvedValue(null);

      const result = await itemService.deleteItem('seller-1', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // archiveItem
  // ---------------------------------------------------------------------------

  describe('archiveItem', () => {
    it('archives an existing item', async () => {
      const existing = createMockFullItem({ status: 'active' });
      const archived = { ...existing, status: 'archived' };
      prismaMock.item.findFirst.mockResolvedValue(existing);
      prismaMock.item.update.mockResolvedValue(archived);

      const result = await itemService.archiveItem('seller-1', existing.id);

      expect(result!.status).toBe('archived');
      const updateCall = prismaMock.item.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('archived');
      expect(updateCall.data.archivedAt).toBeInstanceOf(Date);
    });

    it('returns null when item not found', async () => {
      prismaMock.item.findFirst.mockResolvedValue(null);

      const result = await itemService.archiveItem('seller-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // bulkUpdateStatus
  // ---------------------------------------------------------------------------

  describe('bulkUpdateStatus', () => {
    it('updates multiple items status', async () => {
      prismaMock.item.updateMany.mockResolvedValue({ count: 3 });

      await itemService.bulkUpdateStatus('seller-1', ['a', 'b', 'c'], 'active');

      expect(prismaMock.item.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['a', 'b', 'c'] }, userId: 'seller-1' },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // bulkUpdateVisibility
  // ---------------------------------------------------------------------------

  describe('bulkUpdateVisibility', () => {
    it('updates multiple items visibility', async () => {
      prismaMock.item.updateMany.mockResolvedValue({ count: 2 });

      await itemService.bulkUpdateVisibility('seller-1', ['a', 'b'], 'hidden');

      expect(prismaMock.item.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['a', 'b'] }, userId: 'seller-1' },
        data: { visibility: 'hidden' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getMarketplaceItems
  // ---------------------------------------------------------------------------

  describe('getMarketplaceItems', () => {
    it('returns paginated items with defaults', async () => {
      const items = [createMockFullItem()];
      prismaMock.item.findMany.mockResolvedValue(items);
      prismaMock.item.count.mockResolvedValue(1);

      const result = await itemService.getMarketplaceItems();

      expect(result.items).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('filters by category', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);
      prismaMock.item.count.mockResolvedValue(0);

      await itemService.getMarketplaceItems({ category: 'Bearings' });

      const call = prismaMock.item.findMany.mock.calls[0][0];
      expect(call.where.category).toEqual({ equals: 'Bearings', mode: 'insensitive' });
    });

    it('applies search filter with 6 OR conditions', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);
      prismaMock.item.count.mockResolvedValue(0);

      await itemService.getMarketplaceItems({ search: 'bearing' });

      const call = prismaMock.item.findMany.mock.calls[0][0];
      expect(call.where.OR).toHaveLength(6);
    });

    it('sorts by price ascending', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);
      prismaMock.item.count.mockResolvedValue(0);

      await itemService.getMarketplaceItems({ sortBy: 'price_asc' });

      const call = prismaMock.item.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ price: 'asc' });
    });

    it('returns empty results on error', async () => {
      prismaMock.item.findMany.mockRejectedValue(new Error('DB error'));

      const result = await itemService.getMarketplaceItems();

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getMarketplaceItem
  // ---------------------------------------------------------------------------

  describe('getMarketplaceItem', () => {
    it('returns item with user info', async () => {
      const item = { ...createMockFullItem(), user: { id: 'seller-1', name: 'Seller', avatarUrl: null } };
      prismaMock.item.findFirst.mockResolvedValue(item);

      const result = await itemService.getMarketplaceItem('item-1');

      expect(result).not.toBeNull();
      expect(prismaMock.item.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1', status: 'active', visibility: { not: 'hidden' } },
        }),
      );
    });

    it('returns null for hidden item', async () => {
      prismaMock.item.findFirst.mockResolvedValue(null);

      const result = await itemService.getMarketplaceItem('hidden-item');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getSellerStats
  // ---------------------------------------------------------------------------

  describe('getSellerStats', () => {
    it('aggregates seller statistics', async () => {
      prismaMock.item.count
        .mockResolvedValueOnce(20) // totalItems
        .mockResolvedValueOnce(15) // activeItems
        .mockResolvedValueOnce(3)  // draftItems
        .mockResolvedValueOnce(2); // outOfStockItems
      prismaMock.item.aggregate
        .mockResolvedValueOnce({ _sum: { totalQuotes: 50 } })
        .mockResolvedValueOnce({ _sum: { successfulOrders: 30 } });

      const stats = await itemService.getSellerStats('seller-1');

      expect(stats.totalItems).toBe(20);
      expect(stats.activeItems).toBe(15);
      expect(stats.draftItems).toBe(3);
      expect(stats.outOfStockItems).toBe(2);
      expect(stats.totalQuotes).toBe(50);
      expect(stats.successfulOrders).toBe(30);
    });

    it('returns empty stats on error', async () => {
      prismaMock.item.count.mockRejectedValue(new Error('DB error'));

      const stats = await itemService.getSellerStats('seller-1');

      expect(stats.totalItems).toBe(0);
      expect(stats.activeItems).toBe(0);
      expect(stats.totalQuotes).toBe(0);
    });
  });
});
