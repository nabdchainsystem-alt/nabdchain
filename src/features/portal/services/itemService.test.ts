import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock portalApiClient before importing the service
vi.mock('./portalApiClient', () => ({
  portalApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getAccessToken: vi.fn(() => 'mock-token'),
    baseUrl: 'http://localhost:3001',
  },
}));

vi.mock('../../../utils/logger', () => ({
  logPortalApiCall: vi.fn(),
  portalApiLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { itemService } from './itemService';
import { portalApiClient } from './portalApiClient';

describe('itemService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Seller CRUD
  // ---------------------------------------------------------------------------

  describe('getSellerItems', () => {
    it('calls /api/items with auth header', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
      await itemService.getSellerItems();

      expect(portalApiClient.get).toHaveBeenCalledTimes(1);
      expect(portalApiClient.get).toHaveBeenCalledWith('/api/items');
    });

    it('appends filter parameters', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
      await itemService.getSellerItems({
        status: 'active' as never,
        category: 'electronics',
        search: 'widget',
        minPrice: 10,
        maxPrice: 100,
        inStock: true,
      });

      const calledWith = (portalApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledWith).toContain('status=active');
      expect(calledWith).toContain('category=electronics');
      expect(calledWith).toContain('search=widget');
      expect(calledWith).toContain('minPrice=10');
      expect(calledWith).toContain('maxPrice=100');
      expect(calledWith).toContain('inStock=true');
    });

    it('throws on error with server message', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Invalid filters'));
      await expect(itemService.getSellerItems()).rejects.toThrow('Invalid filters');
    });

    it('throws on any portalApiClient error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Unknown error'));
      await expect(itemService.getSellerItems()).rejects.toThrow('Unknown error');
    });
  });

  describe('getSellerStats', () => {
    it('returns seller statistics', async () => {
      const stats = { totalItems: 50, activeItems: 30, draftItems: 20 };
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(stats);
      const result = await itemService.getSellerStats();
      expect(result).toEqual(stats);
    });
  });

  describe('getSellerItem', () => {
    it('returns item on success', async () => {
      const item = { id: 'itm-1', name: 'Widget' };
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(item);
      const result = await itemService.getSellerItem('itm-1');
      expect(result).toEqual(item);
    });

    it('returns null on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await itemService.getSellerItem('missing');
      expect(result).toBeNull();
    });
  });

  describe('createItem', () => {
    it('sends POST with item data', async () => {
      const data = { name: 'Widget', price: 25, status: 'active', visibility: 'public', stock: 100 };
      const created = { id: 'itm-new', ...data };
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(created);

      const result = await itemService.createItem(data as never);
      expect(result).toEqual(created);

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/items', data);
    });

    it('throws on validation error', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Validation failed'));
      await expect(itemService.createItem({} as never)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateItem', () => {
    it('sends PUT with partial data', async () => {
      const data = { price: 30 };
      (portalApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'itm-1', price: 30 });
      await itemService.updateItem('itm-1', data as never);

      expect(portalApiClient.put).toHaveBeenCalledWith('/api/items/itm-1', data);
    });
  });

  describe('deleteItem', () => {
    it('sends DELETE and returns true', async () => {
      (portalApiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});
      const result = await itemService.deleteItem('itm-1');
      expect(result).toBe(true);

      expect(portalApiClient.delete).toHaveBeenCalledWith('/api/items/itm-1');
    });

    it('throws on failure', async () => {
      (portalApiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to delete item'));
      await expect(itemService.deleteItem('itm-1')).rejects.toThrow('Failed to delete item');
    });
  });

  // ---------------------------------------------------------------------------
  // Marketplace / Buyer
  // ---------------------------------------------------------------------------

  describe('getMarketplaceItems', () => {
    it('calls marketplace browse endpoint', async () => {
      const response = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response);
      const result = await itemService.getMarketplaceItems();
      expect(result).toEqual(response);

      expect(portalApiClient.get).toHaveBeenCalledWith('/api/items/marketplace/browse');
    });

    it('appends marketplace filters', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ items: [], pagination: {} });
      await itemService.getMarketplaceItems({
        category: 'tools',
        minPrice: 5,
        sortBy: 'price_asc' as never,
      });

      const calledWith = (portalApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledWith).toContain('category=tools');
      expect(calledWith).toContain('minPrice=5');
      expect(calledWith).toContain('sortBy=price_asc');
    });
  });

  describe('getMarketplaceItem', () => {
    it('returns null on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await itemService.getMarketplaceItem('missing');
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
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(rfq);

      const result = await itemService.createRFQ(rfqData as never);
      expect(result).toEqual(rfq);

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/items/rfq', rfqData);
    });

    it('throws on validation error', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Validation failed'));
      await expect(itemService.createRFQ({} as never)).rejects.toThrow('Validation failed');
    });
  });

  describe('respondToRFQ', () => {
    it('sends quote data to respond endpoint', async () => {
      const quoteData = { price: 50, deliveryDays: 7 };
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'rfq-1', status: 'quoted' });
      await itemService.respondToRFQ('rfq-1', quoteData as never);

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/items/rfq/rfq-1/respond', quoteData);
    });
  });

  describe('acceptRFQ', () => {
    it('posts to accept endpoint', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'rfq-1', status: 'accepted' });
      await itemService.acceptRFQ('rfq-1');

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/items/rfq/rfq-1/accept');
    });
  });

  describe('bulkUpdateStatus', () => {
    it('sends itemIds and status', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ success: true, count: 3 });
      const result = await itemService.bulkUpdateStatus(['a', 'b', 'c'], 'active' as never);

      expect(result).toEqual({ success: true, count: 3 });
      expect(portalApiClient.post).toHaveBeenCalledWith('/api/items/bulk/status', {
        itemIds: ['a', 'b', 'c'],
        status: 'active',
      });
    });
  });
});
