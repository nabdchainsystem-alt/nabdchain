/**
 * Integration tests for Item Routes
 *
 * Tests core CRUD, marketplace browse, and bulk operations
 * through the Express router with mocked services.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TEST_SELLER_ID } from '../testApp';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../../services/itemService', () => ({
  itemService: {
    getSellerItems: vi.fn(),
    getSellerStats: vi.fn(),
    getSellerItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    archiveItem: vi.fn(),
    bulkUpdateStatus: vi.fn(),
    bulkUpdateVisibility: vi.fn(),
    migrateFromPortalProduct: vi.fn(),
    getMarketplaceItems: vi.fn(),
    getMarketplaceItem: vi.fn(),
    getSellerPublicItems: vi.fn(),
  },
  ItemStatus: {},
  ItemVisibility: {},
  ItemType: {},
}));

vi.mock('../../../services/rfqScoringService', () => ({
  default: {},
  PriorityTier: {},
}));

vi.mock('../../../services/sellerRfqInboxService', () => ({
  sellerRfqInboxService: {},
}));

vi.mock('../../../services/quoteService', () => ({
  quoteService: {},
}));

vi.mock('../../../services/marketplaceOrderService', () => ({
  marketplaceOrderService: {},
}));

vi.mock('../../../services/portalNotificationService', () => ({
  portalNotificationService: { create: vi.fn().mockResolvedValue(undefined) },
  PortalNotificationType: {},
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    sellerProfile: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    buyerProfile: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../../../middleware/idempotencyMiddleware', () => ({
  idempotency: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import itemRouter from '../../../routes/itemRoutes';
import { itemService } from '../../../services/itemService';
import { prisma } from '../../../lib/prisma';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const app = createTestApp(itemRouter, '/api/items', { userId: TEST_SELLER_ID });

const mockItem = {
  id: 'item-1',
  name: 'Test Part',
  sku: 'TP-001',
  price: 50,
  stock: 100,
  status: 'active',
  visibility: 'public',
  category: 'parts',
  itemType: 'part',
  userId: TEST_SELLER_ID,
  specifications: null,
  compatibility: null,
  packaging: null,
  images: null,
  documents: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: seller profile exists (needed by resolveSellerId helper)
  (prisma.sellerProfile.findFirst as any).mockResolvedValue({ id: 'sp-1', status: 'active' });
});

// =============================================================================
// Seller Item CRUD
// =============================================================================

describe('Seller Item CRUD', () => {
  describe('GET /api/items', () => {
    it('returns seller items', async () => {
      (itemService.getSellerItems as any).mockResolvedValue([mockItem]);

      const res = await request(app).get('/api/items');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Test Part');
    });

    it('passes query filters to service', async () => {
      (itemService.getSellerItems as any).mockResolvedValue([]);

      await request(app)
        .get('/api/items')
        .query({ status: 'active', search: 'bolt', inStock: 'true' });

      expect(itemService.getSellerItems).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({ status: 'active', search: 'bolt', inStock: true })
      );
    });

    it('returns 401 when no seller profile', async () => {
      (prisma.sellerProfile.findFirst as any).mockResolvedValue(null);

      const res = await request(app).get('/api/items');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('no seller profile');
    });

    it('returns 500 on service error', async () => {
      (itemService.getSellerItems as any).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/items');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/items/stats', () => {
    it('returns seller stats', async () => {
      const stats = { total: 20, active: 15, outOfStock: 3 };
      (itemService.getSellerStats as any).mockResolvedValue(stats);

      const res = await request(app).get('/api/items/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stats);
    });

    it('returns 401 when no seller profile', async () => {
      (prisma.sellerProfile.findFirst as any).mockResolvedValue(null);

      const res = await request(app).get('/api/items/stats');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/items/:id', () => {
    it('returns a single item', async () => {
      (itemService.getSellerItem as any).mockResolvedValue(mockItem);

      const res = await request(app).get('/api/items/item-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('item-1');
      expect(itemService.getSellerItem).toHaveBeenCalledWith(TEST_SELLER_ID, 'item-1');
    });

    it('returns 404 when item not found', async () => {
      (itemService.getSellerItem as any).mockResolvedValue(null);

      const res = await request(app).get('/api/items/nope');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Item not found');
    });
  });

  describe('POST /api/items', () => {
    const validItem = {
      name: 'New Part',
      sku: 'NP-001',
      price: 25.5,
      category: 'parts',
    };

    it('creates an item with valid data', async () => {
      (itemService.createItem as any).mockResolvedValue({ ...mockItem, ...validItem, id: 'item-new' });

      const res = await request(app).post('/api/items').send(validItem);

      expect(res.status).toBe(201);
      expect(itemService.createItem).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({ name: 'New Part', sku: 'NP-001' })
      );
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Missing SKU' }); // missing sku, price, category

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 for invalid price', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ ...validItem, price: -5 });

      expect(res.status).toBe(400);
    });

    it('returns 401 when no seller profile', async () => {
      (prisma.sellerProfile.findFirst as any).mockResolvedValue(null);

      const res = await request(app).post('/api/items').send(validItem);

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/items/:id', () => {
    it('updates an item', async () => {
      const updated = { ...mockItem, name: 'Updated Part' };
      (itemService.updateItem as any).mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/items/item-1')
        .send({ name: 'Updated Part' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Part');
    });

    it('returns 404 when item not found', async () => {
      (itemService.updateItem as any).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/items/nope')
        .send({ name: 'X' });

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid update data', async () => {
      const res = await request(app)
        .put('/api/items/item-1')
        .send({ status: 'bogus_status' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('deletes an item', async () => {
      (itemService.deleteItem as any).mockResolvedValue(true);

      const res = await request(app).delete('/api/items/item-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 when item not found', async () => {
      (itemService.deleteItem as any).mockResolvedValue(false);

      const res = await request(app).delete('/api/items/nope');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/items/:id/archive', () => {
    it('archives an item', async () => {
      const archived = { ...mockItem, status: 'archived' };
      (itemService.archiveItem as any).mockResolvedValue(archived);

      const res = await request(app).post('/api/items/item-1/archive');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('archived');
    });

    it('returns 404 when item not found', async () => {
      (itemService.archiveItem as any).mockResolvedValue(null);

      const res = await request(app).post('/api/items/nope/archive');

      expect(res.status).toBe(404);
    });
  });
});

// =============================================================================
// Bulk Operations
// =============================================================================

describe('Bulk Operations', () => {
  describe('POST /api/items/bulk/status', () => {
    it('bulk updates status', async () => {
      (itemService.bulkUpdateStatus as any).mockResolvedValue({ count: 3 });

      const res = await request(app)
        .post('/api/items/bulk/status')
        .send({ itemIds: ['a', 'b', 'c'], status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(3);
    });

    it('returns 400 for empty itemIds', async () => {
      const res = await request(app)
        .post('/api/items/bulk/status')
        .send({ itemIds: [], status: 'active' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .post('/api/items/bulk/status')
        .send({ itemIds: ['a'], status: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/items/bulk/visibility', () => {
    it('bulk updates visibility', async () => {
      (itemService.bulkUpdateVisibility as any).mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post('/api/items/bulk/visibility')
        .send({ itemIds: ['a', 'b'], visibility: 'public' });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it('returns 400 for invalid visibility', async () => {
      const res = await request(app)
        .post('/api/items/bulk/visibility')
        .send({ itemIds: ['a'], visibility: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/items/migrate', () => {
    it('migrates portal products', async () => {
      (itemService.migrateFromPortalProduct as any).mockResolvedValue({ count: 5 });

      const res = await request(app).post('/api/items/migrate');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(5);
    });
  });
});

// =============================================================================
// Marketplace Routes (Public)
// =============================================================================

describe('Marketplace Routes', () => {
  describe('GET /api/items/marketplace/browse', () => {
    it('returns paginated marketplace items', async () => {
      const result = {
        items: [mockItem],
        pagination: { page: 1, limit: 20, total: 1 },
      };
      (itemService.getMarketplaceItems as any).mockResolvedValue(result);

      const res = await request(app).get('/api/items/marketplace/browse');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });

    it('passes query filters', async () => {
      (itemService.getMarketplaceItems as any).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await request(app)
        .get('/api/items/marketplace/browse')
        .query({ category: 'parts', minPrice: '10', maxPrice: '100', page: '2', limit: '10' });

      expect(itemService.getMarketplaceItems).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'parts',
          minPrice: 10,
          maxPrice: 100,
          page: 2,
          limit: 10,
        })
      );
    });
  });

  describe('GET /api/items/marketplace/:id', () => {
    it('returns a marketplace item', async () => {
      (itemService.getMarketplaceItem as any).mockResolvedValue(mockItem);

      const res = await request(app).get('/api/items/marketplace/item-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('item-1');
    });

    it('returns 404 when item not found', async () => {
      (itemService.getMarketplaceItem as any).mockResolvedValue(null);

      const res = await request(app).get('/api/items/marketplace/nope');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/items/marketplace/seller/:sellerId', () => {
    it('returns seller public items', async () => {
      const result = {
        items: [mockItem],
        pagination: { page: 1, limit: 20, total: 1 },
      };
      (itemService.getSellerPublicItems as any).mockResolvedValue(result);

      const res = await request(app).get('/api/items/marketplace/seller/seller-123');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(itemService.getSellerPublicItems).toHaveBeenCalledWith(
        'seller-123',
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });
});
