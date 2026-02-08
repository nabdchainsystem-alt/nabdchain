import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from './orderService';

// Mock the API config module
vi.mock('../../../config/api', () => ({
  API_URL: 'http://localhost:3001/api',
  API_BASE_URL: 'http://localhost:3001',
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

describe('orderService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  describe('getSellerOrders', () => {
    it('calls the correct endpoint with auth header', async () => {
      mockFetchOk([]);
      await orderService.getSellerOrders(TOKEN);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/api/orders/seller');
      expect(opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    });

    it('appends filter params to URL', async () => {
      mockFetchOk([]);
      await orderService.getSellerOrders(TOKEN, {
        status: 'confirmed',
        search: 'widget',
        dateFrom: '2025-01-01',
      });

      const url: string = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(url).toContain('status=confirmed');
      expect(url).toContain('search=widget');
      expect(url).toContain('dateFrom=2025-01-01');
    });

    it('throws on non-ok response', async () => {
      mockFetchError(500);
      await expect(orderService.getSellerOrders(TOKEN)).rejects.toThrow('Failed to fetch orders');
    });
  });

  describe('getSellerOrderStats', () => {
    it('fetches seller stats', async () => {
      const stats = { totalOrders: 10, revenue: 5000 };
      mockFetchOk(stats);
      const result = await orderService.getSellerOrderStats(TOKEN);
      expect(result).toEqual(stats);
      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/orders/seller/stats');
    });
  });

  describe('getSellerOrder', () => {
    it('returns order on success', async () => {
      const order = { id: 'ord-1', status: 'confirmed' };
      mockFetchOk(order);
      const result = await orderService.getSellerOrder(TOKEN, 'ord-1');
      expect(result).toEqual(order);
    });

    it('returns null on 404', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });
      const result = await orderService.getSellerOrder(TOKEN, 'not-exist');
      expect(result).toBeNull();
    });
  });

  describe('confirmOrder', () => {
    it('sends POST to confirm endpoint', async () => {
      const order = { id: 'ord-1', status: 'confirmed' };
      mockFetchOk(order);
      const result = await orderService.confirmOrder(TOKEN, 'ord-1');

      expect(result).toEqual(order);
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/orders/seller/ord-1/confirm');
      expect(opts.method).toBe('POST');
    });

    it('throws with error message from server', async () => {
      mockFetchError(400, { error: 'Order already confirmed' });
      await expect(orderService.confirmOrder(TOKEN, 'ord-1')).rejects.toThrow('Order already confirmed');
    });
  });

  describe('updateOrderStatus', () => {
    it('sends status in request body', async () => {
      mockFetchOk({ id: 'ord-1', status: 'shipped' });
      await orderService.updateOrderStatus(TOKEN, 'ord-1', 'shipped');

      const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(JSON.parse(opts.body)).toEqual({ status: 'shipped' });
    });
  });

  describe('shipOrder', () => {
    it('sends ship data in body', async () => {
      const shipData = { trackingNumber: 'TR123', carrier: 'FedEx' };
      mockFetchOk({ id: 'ord-1', status: 'shipped' });
      await orderService.shipOrder(TOKEN, 'ord-1', shipData as never);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/ship');
      expect(JSON.parse(opts.body)).toEqual(shipData);
    });
  });

  describe('cancelOrder', () => {
    it('sends cancellation with reason', async () => {
      mockFetchOk({ id: 'ord-1', status: 'cancelled' });
      await orderService.cancelOrder(TOKEN, 'ord-1', 'Out of stock');

      const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(JSON.parse(opts.body)).toEqual({ reason: 'Out of stock' });
    });
  });

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  describe('getBuyerOrders', () => {
    it('calls buyer endpoint with filters', async () => {
      mockFetchOk([]);
      await orderService.getBuyerOrders(TOKEN, { status: 'pending_confirmation', search: 'test' });

      const url: string = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(url).toContain('/api/orders/buyer');
      expect(url).toContain('status=pending_confirmation');
      expect(url).toContain('search=test');
    });

    it('returns empty array when no orders', async () => {
      mockFetchOk([]);
      const result = await orderService.getBuyerOrders(TOKEN);
      expect(result).toEqual([]);
    });
  });

  describe('createOrderFromRFQ', () => {
    it('posts to from-rfq endpoint', async () => {
      const data = { rfqId: 'rfq-1', quoteId: 'q-1' };
      const order = { id: 'ord-new', status: 'pending_confirmation' };
      mockFetchOk(order);

      const result = await orderService.createOrderFromRFQ(TOKEN, data as never);
      expect(result).toEqual(order);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/orders/from-rfq');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(data);
    });
  });

  describe('createDirectOrder', () => {
    it('posts to direct endpoint', async () => {
      const data = { sellerId: 's-1', items: [] };
      mockFetchOk({ id: 'ord-2' });
      await orderService.createDirectOrder(TOKEN, data as never);

      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/orders/direct');
    });
  });

  describe('confirmDelivery', () => {
    it('posts to confirm-delivery endpoint', async () => {
      mockFetchOk({ id: 'ord-1', status: 'delivered' });
      await orderService.confirmDelivery(TOKEN, 'ord-1');

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/orders/buyer/ord-1/confirm-delivery');
      expect(opts.method).toBe('POST');
    });
  });

  describe('getBuyerDashboardSummary', () => {
    it('fetches dashboard summary', async () => {
      const summary = { totalOrders: 5, totalSpent: 1200 };
      mockFetchOk(summary);
      const result = await orderService.getBuyerDashboardSummary(TOKEN);

      expect(result).toEqual(summary);
      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/orders/buyer/dashboard');
    });

    it('throws on failure', async () => {
      mockFetchError(500);
      await expect(orderService.getBuyerDashboardSummary(TOKEN)).rejects.toThrow('Failed to fetch dashboard summary');
    });
  });
});
