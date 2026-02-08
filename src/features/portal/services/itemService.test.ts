import { describe, it, expect, vi, beforeEach } from 'vitest';
import { itemService } from './itemService';

// Mock dependencies
vi.mock('../../../config/api', () => ({
  API_URL: 'http://localhost:3001/api',
  API_BASE_URL: 'http://localhost:3001',
}));

vi.mock('../../../utils/logger', () => ({
  logPortalApiCall: vi.fn(),
  portalApiLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const TOKEN = 'test-bearer-token';

function mockFetchOk(data: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status: number, body: Record<string, unknown> = {}) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('itemService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  // ---------------------------------------------------------------------------
  // Seller CRUD
  // ---------------------------------------------------------------------------

  describe('getSellerItems', () => {
    it('calls /api/items with auth header', async () => {
      mockFetchOk([]);
      await itemService.getSellerItems(TOKEN);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/api/items');
      expect(opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    });

    it('appends filter parameters', async () => {
      mockFetchOk([]);
      await itemService.getSellerItems(TOKEN, {
        status: 'active' as never,
        category: 'electronics',
        search: 'widget',
        minPrice: 10,
        maxPrice: 100,
        inStock: true,
      });

      const url: string = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(url).toContain('status=active');
      expect(url).toContain('category=electronics');
      expect(url).toContain('search=widget');
      expect(url).toContain('minPrice=10');
      expect(url).toContain('maxPrice=100');
      expect(url).toContain('inStock=true');
    });

    it('throws on error with server message', async () => {
      mockFetchError(400, { error: 'Invalid filters' });
      await expect(itemService.getSellerItems(TOKEN)).rejects.toThrow('Invalid filters');
    });

    it('throws fallback message on parse failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('parse fail')),
      });
      await expect(itemService.getSellerItems(TOKEN)).rejects.toThrow('Unknown error');
    });
  });

  describe('getSellerStats', () => {
    it('returns seller statistics', async () => {
      const stats = { totalItems: 50, activeItems: 30, draftItems: 20 };
      mockFetchOk(stats);
      const result = await itemService.getSellerStats(TOKEN);
      expect(result).toEqual(stats);
    });
  });

  describe('getSellerItem', () => {
    it('returns item on success', async () => {
      const item = { id: 'itm-1', name: 'Widget' };
      mockFetchOk(item);
      const result = await itemService.getSellerItem(TOKEN, 'itm-1');
      expect(result).toEqual(item);
    });

    it('returns null on 404', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      const result = await itemService.getSellerItem(TOKEN, 'missing');
      expect(result).toBeNull();
    });
  });

  describe('createItem', () => {
    it('sends POST with item data', async () => {
      const data = { name: 'Widget', price: 25, status: 'active', visibility: 'public', stock: 100 };
      const created = { id: 'itm-new', ...data };
      mockFetchOk(created);

      const result = await itemService.createItem(TOKEN, data as never);
      expect(result).toEqual(created);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(data);
    });

    it('includes validation details in error message', async () => {
      mockFetchError(400, {
        error: 'Validation failed',
        details: [{ path: ['price'], message: 'must be positive' }],
      });
      await expect(itemService.createItem(TOKEN, {} as never)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateItem', () => {
    it('sends PUT with partial data', async () => {
      const data = { price: 30 };
      mockFetchOk({ id: 'itm-1', price: 30 });
      await itemService.updateItem(TOKEN, 'itm-1', data as never);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/itm-1');
      expect(opts.method).toBe('PUT');
    });
  });

  describe('deleteItem', () => {
    it('sends DELETE and returns true', async () => {
      mockFetchOk({});
      const result = await itemService.deleteItem(TOKEN, 'itm-1');
      expect(result).toBe(true);

      const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(opts.method).toBe('DELETE');
    });

    it('throws on failure', async () => {
      mockFetchError(500);
      await expect(itemService.deleteItem(TOKEN, 'itm-1')).rejects.toThrow('Failed to delete item');
    });
  });

  // ---------------------------------------------------------------------------
  // Marketplace / Buyer
  // ---------------------------------------------------------------------------

  describe('getMarketplaceItems', () => {
    it('calls marketplace browse endpoint', async () => {
      const response = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      mockFetchOk(response);
      const result = await itemService.getMarketplaceItems(TOKEN);
      expect(result).toEqual(response);

      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/api/items/marketplace/browse');
    });

    it('appends marketplace filters', async () => {
      mockFetchOk({ items: [], pagination: {} });
      await itemService.getMarketplaceItems(TOKEN, {
        category: 'tools',
        minPrice: 5,
        sortBy: 'price_asc' as never,
      });

      const url: string = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(url).toContain('category=tools');
      expect(url).toContain('minPrice=5');
      expect(url).toContain('sortBy=price_asc');
    });
  });

  describe('getMarketplaceItem', () => {
    it('returns null on 404', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      const result = await itemService.getMarketplaceItem(TOKEN, 'missing');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // RFQ Operations
  // ---------------------------------------------------------------------------

  describe('createRFQ', () => {
    it('posts RFQ data to /api/items/rfq', async () => {
      const rfqData = { itemId: 'itm-1', quantity: 100, notes: 'Bulk order' };
      const rfq = { id: 'rfq-1', status: 'pending' };
      mockFetchOk(rfq);

      const result = await itemService.createRFQ(TOKEN, rfqData as never);
      expect(result).toEqual(rfq);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/rfq');
      expect(opts.method).toBe('POST');
    });

    it('includes validation details in error', async () => {
      mockFetchError(400, {
        error: 'Validation failed',
        details: [{ path: ['quantity'], message: 'required' }],
      });
      await expect(itemService.createRFQ(TOKEN, {} as never)).rejects.toThrow('Validation failed');
    });
  });

  describe('respondToRFQ', () => {
    it('sends quote data to respond endpoint', async () => {
      const quoteData = { price: 50, deliveryDays: 7 };
      mockFetchOk({ id: 'rfq-1', status: 'quoted' });
      await itemService.respondToRFQ(TOKEN, 'rfq-1', quoteData as never);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/rfq/rfq-1/respond');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(quoteData);
    });
  });

  describe('acceptRFQ', () => {
    it('posts to accept endpoint', async () => {
      mockFetchOk({ id: 'rfq-1', status: 'accepted' });
      await itemService.acceptRFQ(TOKEN, 'rfq-1');

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/rfq/rfq-1/accept');
      expect(opts.method).toBe('POST');
    });
  });

  describe('bulkUpdateStatus', () => {
    it('sends itemIds and status', async () => {
      mockFetchOk({ success: true, count: 3 });
      const result = await itemService.bulkUpdateStatus(TOKEN, ['a', 'b', 'c'], 'active' as never);

      expect(result).toEqual({ success: true, count: 3 });
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/bulk/status');
      expect(JSON.parse(opts.body)).toEqual({ itemIds: ['a', 'b', 'c'], status: 'active' });
    });
  });
});
