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

import { orderService } from './orderService';
import { portalApiClient } from './portalApiClient';

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  describe('getSellerOrders', () => {
    it('calls the correct endpoint with auth header', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
      await orderService.getSellerOrders();

      expect(portalApiClient.get).toHaveBeenCalledTimes(1);
      expect(portalApiClient.get).toHaveBeenCalledWith('/api/orders/seller');
    });

    it('appends filter params to URL', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
      await orderService.getSellerOrders({
        status: 'confirmed',
        search: 'widget',
        dateFrom: '2025-01-01',
      });

      const calledWith = (portalApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledWith).toContain('status=confirmed');
      expect(calledWith).toContain('search=widget');
      expect(calledWith).toContain('dateFrom=2025-01-01');
    });

    it('throws on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to fetch orders'));
      await expect(orderService.getSellerOrders()).rejects.toThrow('Failed to fetch orders');
    });
  });

  describe('getSellerOrderStats', () => {
    it('fetches seller stats', async () => {
      const stats = { totalOrders: 10, revenue: 5000 };
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(stats);
      const result = await orderService.getSellerOrderStats();
      expect(result).toEqual(stats);
      expect(portalApiClient.get).toHaveBeenCalledWith('/api/orders/seller/stats');
    });
  });

  describe('getSellerOrder', () => {
    it('returns order on success', async () => {
      const order = { id: 'ord-1', status: 'confirmed' };
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(order);
      const result = await orderService.getSellerOrder('ord-1');
      expect(result).toEqual(order);
    });

    it('returns null on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await orderService.getSellerOrder('not-exist');
      expect(result).toBeNull();
    });
  });

  describe('confirmOrder', () => {
    it('sends POST to confirm endpoint', async () => {
      const order = { id: 'ord-1', status: 'confirmed' };
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(order);
      const result = await orderService.confirmOrder('ord-1');

      expect(result).toEqual(order);
      expect(portalApiClient.post).toHaveBeenCalledWith('/api/orders/seller/ord-1/confirm');
    });

    it('throws with error message from server', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Order already confirmed'));
      await expect(orderService.confirmOrder('ord-1')).rejects.toThrow('Order already confirmed');
    });
  });

  describe('updateOrderStatus', () => {
    it('sends status in request body', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'ord-1', status: 'shipped' });
      await orderService.updateOrderStatus('ord-1', 'shipped' as never);

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/orders/seller/ord-1/status', { status: 'shipped' });
    });
  });

  describe('shipOrder', () => {
    it('sends ship data in body', async () => {
      const shipData = { trackingNumber: 'TR123', carrier: 'FedEx' };
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'ord-1', status: 'shipped' });
      await orderService.shipOrder('ord-1', shipData as never);

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/orders/seller/ord-1/ship', shipData);
    });
  });

  describe('cancelOrder', () => {
    it('sends cancellation with reason', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'ord-1', status: 'cancelled' });
      await orderService.cancelOrder('ord-1', 'Out of stock');

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/orders/seller/ord-1/cancel', {
        reason: 'Out of stock',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  describe('getBuyerOrders', () => {
    it('calls buyer endpoint with filters', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
      await orderService.getBuyerOrders({ status: 'pending_confirmation', search: 'test' });

      const calledWith = (portalApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledWith).toContain('/api/orders/buyer');
      expect(calledWith).toContain('status=pending_confirmation');
      expect(calledWith).toContain('search=test');
    });

    it('returns empty array when no orders', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
      const result = await orderService.getBuyerOrders();
      expect(result).toEqual([]);
    });
  });

  describe('createOrderFromRFQ', () => {
    it('posts to from-rfq endpoint', async () => {
      const data = { rfqId: 'rfq-1', quoteId: 'q-1' };
      const order = { id: 'ord-new', status: 'pending_confirmation' };
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(order);

      const result = await orderService.createOrderFromRFQ(data as never);
      expect(result).toEqual(order);

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/orders/from-rfq', data);
    });
  });

  describe('createDirectOrder', () => {
    it('posts to direct endpoint', async () => {
      const data = { sellerId: 's-1', items: [] };
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'ord-2' });
      await orderService.createDirectOrder(data as never);

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/orders/direct', data);
    });
  });

  describe('confirmDelivery', () => {
    it('posts to confirm-delivery endpoint', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'ord-1', status: 'delivered' });
      await orderService.confirmDelivery('ord-1');

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/orders/buyer/ord-1/confirm-delivery');
    });
  });

  describe('getBuyerDashboardSummary', () => {
    it('fetches dashboard summary', async () => {
      const summary = { totalOrders: 5, totalSpent: 1200 };
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(summary);
      const result = await orderService.getBuyerDashboardSummary();

      expect(result).toEqual(summary);
      expect(portalApiClient.get).toHaveBeenCalledWith('/api/orders/buyer/dashboard');
    });

    it('throws on failure', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Failed to fetch dashboard summary'),
      );
      await expect(orderService.getBuyerDashboardSummary()).rejects.toThrow('Failed to fetch dashboard summary');
    });
  });
});
