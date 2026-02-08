/**
 * Integration tests for Dashboard Routes
 *
 * Tests HTTP request/response cycle through the Express router
 * with mocked service layer. Validates status codes, response shapes,
 * and error handling branches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TEST_SELLER_ID, TEST_BUYER_ID } from '../testApp';

// ---------------------------------------------------------------------------
// Mocks — must be before any import that pulls in the mocked modules
// ---------------------------------------------------------------------------

vi.mock('../../../services/dashboardService', () => ({
  dashboardService: {
    getSellerSummary: vi.fn(),
    getBuyerSummary: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import dashboardRouter from '../../../routes/dashboardRoutes';
import { dashboardService } from '../../../services/dashboardService';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const sellerApp = createTestApp(dashboardRouter, '/api/dashboard', { userId: TEST_SELLER_ID });
const buyerApp = createTestApp(dashboardRouter, '/api/dashboard', { userId: TEST_BUYER_ID });

const mockSellerSummary = {
  totalOrders: 150,
  totalRevenue: 45000,
  pendingOrders: 12,
  averageOrderValue: 300,
  topProducts: [
    { id: 'prod-1', name: 'Widget A', totalSold: 50 },
    { id: 'prod-2', name: 'Widget B', totalSold: 30 },
  ],
  recentActivity: [
    { type: 'order_received', timestamp: '2026-01-15' },
  ],
};

const mockBuyerSummary = {
  totalOrders: 25,
  totalSpent: 7500,
  activeOrders: 3,
  recentOrders: [
    { id: 'order-1', orderNumber: 'ORD-001', status: 'shipped', totalAmount: 300 },
  ],
  favoriteSuppliers: [
    { id: 'seller-1', name: 'Best Supplies', orderCount: 10 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Seller Dashboard Routes
// =============================================================================

describe('Seller Dashboard Routes', () => {
  describe('GET /api/dashboard/seller/summary', () => {
    it('returns seller dashboard summary', async () => {
      (dashboardService.getSellerSummary as any).mockResolvedValue(mockSellerSummary);

      const res = await request(sellerApp).get('/api/dashboard/seller/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalOrders).toBe(150);
      expect(res.body.totalRevenue).toBe(45000);
      expect(res.body.topProducts).toHaveLength(2);
      expect(dashboardService.getSellerSummary).toHaveBeenCalledWith(TEST_SELLER_ID);
    });

    it('returns summary with zero values', async () => {
      const emptySummary = {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        averageOrderValue: 0,
        topProducts: [],
        recentActivity: [],
      };
      (dashboardService.getSellerSummary as any).mockResolvedValue(emptySummary);

      const res = await request(sellerApp).get('/api/dashboard/seller/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalOrders).toBe(0);
      expect(res.body.topProducts).toEqual([]);
    });

    it('returns 500 on service error', async () => {
      (dashboardService.getSellerSummary as any).mockRejectedValue(new Error('DB down'));

      const res = await request(sellerApp).get('/api/dashboard/seller/summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch dashboard summary');
    });

    it('returns full summary object shape', async () => {
      (dashboardService.getSellerSummary as any).mockResolvedValue(mockSellerSummary);

      const res = await request(sellerApp).get('/api/dashboard/seller/summary');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalOrders');
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body).toHaveProperty('pendingOrders');
      expect(res.body).toHaveProperty('averageOrderValue');
      expect(res.body).toHaveProperty('topProducts');
      expect(res.body).toHaveProperty('recentActivity');
    });

    it('returns top products with details', async () => {
      (dashboardService.getSellerSummary as any).mockResolvedValue(mockSellerSummary);

      const res = await request(sellerApp).get('/api/dashboard/seller/summary');

      expect(res.body.topProducts[0]).toEqual(
        expect.objectContaining({ id: 'prod-1', name: 'Widget A', totalSold: 50 })
      );
    });

    it('calls service with correct seller ID', async () => {
      (dashboardService.getSellerSummary as any).mockResolvedValue(mockSellerSummary);

      await request(sellerApp).get('/api/dashboard/seller/summary');

      expect(dashboardService.getSellerSummary).toHaveBeenCalledTimes(1);
      expect(dashboardService.getSellerSummary).toHaveBeenCalledWith(TEST_SELLER_ID);
    });

    it('handles service returning partial data', async () => {
      (dashboardService.getSellerSummary as any).mockResolvedValue({ totalOrders: 5 });

      const res = await request(sellerApp).get('/api/dashboard/seller/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalOrders).toBe(5);
    });

    it('returns 500 with correct error message on timeout', async () => {
      (dashboardService.getSellerSummary as any).mockRejectedValue(new Error('Query timeout'));

      const res = await request(sellerApp).get('/api/dashboard/seller/summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch dashboard summary');
    });
  });
});

// =============================================================================
// Buyer Dashboard Routes
// =============================================================================

describe('Buyer Dashboard Routes', () => {
  describe('GET /api/dashboard/buyer/summary', () => {
    it('returns buyer dashboard summary', async () => {
      (dashboardService.getBuyerSummary as any).mockResolvedValue(mockBuyerSummary);

      const res = await request(buyerApp).get('/api/dashboard/buyer/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalOrders).toBe(25);
      expect(res.body.totalSpent).toBe(7500);
      expect(res.body.recentOrders).toHaveLength(1);
      expect(dashboardService.getBuyerSummary).toHaveBeenCalledWith(TEST_BUYER_ID);
    });

    it('returns summary with zero orders', async () => {
      const emptySummary = {
        totalOrders: 0,
        totalSpent: 0,
        activeOrders: 0,
        recentOrders: [],
        favoriteSuppliers: [],
      };
      (dashboardService.getBuyerSummary as any).mockResolvedValue(emptySummary);

      const res = await request(buyerApp).get('/api/dashboard/buyer/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalOrders).toBe(0);
      expect(res.body.recentOrders).toEqual([]);
    });

    it('returns 500 on service error', async () => {
      (dashboardService.getBuyerSummary as any).mockRejectedValue(new Error('DB down'));

      const res = await request(buyerApp).get('/api/dashboard/buyer/summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch dashboard summary');
    });

    it('returns recent orders with details', async () => {
      (dashboardService.getBuyerSummary as any).mockResolvedValue(mockBuyerSummary);

      const res = await request(buyerApp).get('/api/dashboard/buyer/summary');

      expect(res.body.recentOrders[0]).toEqual(
        expect.objectContaining({ id: 'order-1', status: 'shipped' })
      );
    });

    it('returns favorite suppliers', async () => {
      (dashboardService.getBuyerSummary as any).mockResolvedValue(mockBuyerSummary);

      const res = await request(buyerApp).get('/api/dashboard/buyer/summary');

      expect(res.body.favoriteSuppliers).toHaveLength(1);
      expect(res.body.favoriteSuppliers[0].name).toBe('Best Supplies');
    });

    it('calls service with correct buyer ID', async () => {
      (dashboardService.getBuyerSummary as any).mockResolvedValue(mockBuyerSummary);

      await request(buyerApp).get('/api/dashboard/buyer/summary');

      expect(dashboardService.getBuyerSummary).toHaveBeenCalledTimes(1);
      expect(dashboardService.getBuyerSummary).toHaveBeenCalledWith(TEST_BUYER_ID);
    });

    it('handles service returning partial data', async () => {
      (dashboardService.getBuyerSummary as any).mockResolvedValue({ totalOrders: 1 });

      const res = await request(buyerApp).get('/api/dashboard/buyer/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalOrders).toBe(1);
    });

    it('returns 500 with correct error message on unknown error', async () => {
      (dashboardService.getBuyerSummary as any).mockRejectedValue(new Error('Unknown'));

      const res = await request(buyerApp).get('/api/dashboard/buyer/summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch dashboard summary');
    });
  });
});
