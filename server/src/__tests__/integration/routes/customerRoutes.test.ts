/**
 * Integration tests for Customer Routes
 *
 * Tests HTTP request/response cycle through the Express router
 * with mocked service layer. Validates status codes, response shapes,
 * and error handling branches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TEST_SELLER_ID } from '../testApp';

// ---------------------------------------------------------------------------
// Mocks — must be before any import that pulls in the mocked modules
// ---------------------------------------------------------------------------

vi.mock('../../../services/customerService', () => ({
  customerService: {
    getSellerCustomers: vi.fn(),
    getCustomerDetails: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import customerRouter from '../../../routes/customerRoutes';
import { customerService } from '../../../services/customerService';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const app = createTestApp(customerRouter, '/api/customers', { userId: TEST_SELLER_ID });

const mockCustomer = {
  id: 'customer-1',
  name: 'Acme Corp',
  email: 'buyer@acme.com',
  totalOrders: 15,
  totalSpend: 4500.00,
  lastOrderDate: '2026-01-15',
};

const mockCustomerDetails = {
  ...mockCustomer,
  orders: [
    { id: 'order-1', orderNumber: 'ORD-001', totalAmount: 300, status: 'delivered' },
    { id: 'order-2', orderNumber: 'ORD-002', totalAmount: 200, status: 'shipped' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Seller Customer Routes
// =============================================================================

describe('Seller Customer Routes', () => {
  describe('GET /api/customers/seller', () => {
    it('returns seller customers', async () => {
      (customerService.getSellerCustomers as any).mockResolvedValue([mockCustomer]);

      const res = await request(app).get('/api/customers/seller');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockCustomer]);
      expect(customerService.getSellerCustomers).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({})
      );
    });

    it('returns empty array when no customers', async () => {
      (customerService.getSellerCustomers as any).mockResolvedValue([]);

      const res = await request(app).get('/api/customers/seller');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('passes search query to service', async () => {
      (customerService.getSellerCustomers as any).mockResolvedValue([mockCustomer]);

      await request(app)
        .get('/api/customers/seller')
        .query({ search: 'Acme' });

      expect(customerService.getSellerCustomers).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({ search: 'Acme' })
      );
    });

    it('passes sortBy query to service', async () => {
      (customerService.getSellerCustomers as any).mockResolvedValue([]);

      await request(app)
        .get('/api/customers/seller')
        .query({ sortBy: 'totalSpend', sortOrder: 'desc' });

      expect(customerService.getSellerCustomers).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({ sortBy: 'totalSpend', sortOrder: 'desc' })
      );
    });

    it('passes sortBy name to service', async () => {
      (customerService.getSellerCustomers as any).mockResolvedValue([]);

      await request(app)
        .get('/api/customers/seller')
        .query({ sortBy: 'name', sortOrder: 'asc' });

      expect(customerService.getSellerCustomers).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({ sortBy: 'name', sortOrder: 'asc' })
      );
    });

    it('returns 500 on service error', async () => {
      (customerService.getSellerCustomers as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/customers/seller');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch customers');
    });

    it('returns multiple customers', async () => {
      const customers = [
        mockCustomer,
        { ...mockCustomer, id: 'customer-2', name: 'Beta Inc', totalOrders: 3 },
      ];
      (customerService.getSellerCustomers as any).mockResolvedValue(customers);

      const res = await request(app).get('/api/customers/seller');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Acme Corp');
      expect(res.body[1].name).toBe('Beta Inc');
    });
  });

  describe('GET /api/customers/seller/:customerId', () => {
    it('returns customer details with order history', async () => {
      (customerService.getCustomerDetails as any).mockResolvedValue(mockCustomerDetails);

      const res = await request(app).get('/api/customers/seller/customer-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('customer-1');
      expect(res.body.orders).toHaveLength(2);
      expect(customerService.getCustomerDetails).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        'customer-1'
      );
    });

    it('returns 404 when customer not found', async () => {
      (customerService.getCustomerDetails as any).mockResolvedValue(null);

      const res = await request(app).get('/api/customers/seller/nope');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Customer not found');
    });

    it('returns 500 on service error', async () => {
      (customerService.getCustomerDetails as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/customers/seller/customer-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch customer details');
    });

    it('passes customerId from URL path', async () => {
      (customerService.getCustomerDetails as any).mockResolvedValue(mockCustomerDetails);

      await request(app).get('/api/customers/seller/some-custom-id');

      expect(customerService.getCustomerDetails).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        'some-custom-id'
      );
    });

    it('returns customer with empty orders list', async () => {
      const emptyOrders = { ...mockCustomerDetails, orders: [] };
      (customerService.getCustomerDetails as any).mockResolvedValue(emptyOrders);

      const res = await request(app).get('/api/customers/seller/customer-1');

      expect(res.status).toBe(200);
      expect(res.body.orders).toEqual([]);
    });

    it('returns customer with full details', async () => {
      (customerService.getCustomerDetails as any).mockResolvedValue(mockCustomerDetails);

      const res = await request(app).get('/api/customers/seller/customer-1');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Acme Corp');
      expect(res.body.email).toBe('buyer@acme.com');
      expect(res.body.totalOrders).toBe(15);
      expect(res.body.totalSpend).toBe(4500.00);
    });

    it('handles special characters in customerId', async () => {
      (customerService.getCustomerDetails as any).mockResolvedValue(null);

      const res = await request(app).get('/api/customers/seller/abc-123-def');

      expect(res.status).toBe(404);
      expect(customerService.getCustomerDetails).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        'abc-123-def'
      );
    });

    it('returns customer order details within customer response', async () => {
      (customerService.getCustomerDetails as any).mockResolvedValue(mockCustomerDetails);

      const res = await request(app).get('/api/customers/seller/customer-1');

      expect(res.status).toBe(200);
      expect(res.body.orders[0]).toEqual(
        expect.objectContaining({ id: 'order-1', orderNumber: 'ORD-001', status: 'delivered' })
      );
      expect(res.body.orders[1]).toEqual(
        expect.objectContaining({ id: 'order-2', status: 'shipped' })
      );
    });
  });
});
