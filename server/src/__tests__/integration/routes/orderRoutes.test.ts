/**
 * Integration tests for Order Routes
 *
 * Tests HTTP request/response cycle through the Express router
 * with mocked service layer. Validates status codes, response shapes,
 * Zod validation, and error handling branches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TEST_SELLER_ID, TEST_BUYER_ID } from '../testApp';

// ---------------------------------------------------------------------------
// Mocks — must be before any import that pulls in the mocked modules
// ---------------------------------------------------------------------------

vi.mock('../../../services/orderService', () => ({
  orderService: {
    getSellerOrders: vi.fn(),
    getSellerOrderStats: vi.fn(),
    getSellerOrder: vi.fn(),
    confirmOrder: vi.fn(),
    shipOrder: vi.fn(),
    markDelivered: vi.fn(),
    cancelOrder: vi.fn(),
    updateOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    getBuyerOrders: vi.fn(),
    getBuyerOrderStats: vi.fn(),
    getBuyerDashboardSummary: vi.fn(),
    getBuyerOrder: vi.fn(),
    createOrder: vi.fn(),
    cancelOrderByBuyer: vi.fn(),
  },
  OrderStatus: {},
  PaymentStatus: {},
  FulfillmentStatus: {},
  OrderSource: {},
}));

vi.mock('../../../services/orderHealthService', () => ({
  default: {
    getOrderHealthSummary: vi.fn(),
    getActiveExceptions: vi.fn(),
    getOrdersWithHealth: vi.fn(),
    calculateOrderHealth: vi.fn(),
    resolveException: vi.fn(),
    updateOrderHealthBatch: vi.fn(),
    getRFQNegotiationHistory: vi.fn(),
    getOrCreateHealthRules: vi.fn(),
  },
  OrderHealthStatus: {},
  ExceptionSeverity: {},
}));

vi.mock('../../../services/portalNotificationService', () => ({
  portalNotificationService: {
    create: vi.fn().mockResolvedValue(undefined),
  },
  PortalNotificationType: {},
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    marketplaceOrder: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    marketplaceOrderAudit: {
      create: vi.fn(),
    },
    buyerProfile: {
      findUnique: vi.fn().mockResolvedValue({ id: 'test-buyer-id' }),
      findFirst: vi.fn().mockResolvedValue({ id: 'test-buyer-id' }),
    },
  },
}));

vi.mock('../../../services/marketplaceInvoiceService', () => ({
  marketplaceInvoiceService: {
    createFromDeliveredOrder: vi.fn().mockResolvedValue({ success: true, invoice: { id: 'inv-1', invoiceNumber: 'INV-001' } }),
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

import orderRouter from '../../../routes/orderRoutes';
import { orderService } from '../../../services/orderService';
import orderHealthService from '../../../services/orderHealthService';
import { prisma } from '../../../lib/prisma';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const sellerApp = createTestApp(orderRouter, '/api/orders', { userId: TEST_SELLER_ID });
const buyerApp = createTestApp(orderRouter, '/api/orders', {
  userId: TEST_BUYER_ID,
  portalAuth: { userId: TEST_BUYER_ID, portalRole: 'buyer', buyerId: TEST_BUYER_ID },
});

const mockOrder = {
  id: 'order-1',
  orderNumber: 'ORD-001',
  sellerId: TEST_SELLER_ID,
  buyerId: TEST_BUYER_ID,
  status: 'pending_confirmation',
  totalAmount: 100,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Seller Routes
// =============================================================================

describe('Seller Routes', () => {
  describe('GET /api/orders/seller', () => {
    it('returns seller orders', async () => {
      (orderService.getSellerOrders as any).mockResolvedValue([mockOrder]);

      const res = await request(sellerApp).get('/api/orders/seller');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockOrder]);
      expect(orderService.getSellerOrders).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({})
      );
    });

    it('passes query filters to service', async () => {
      (orderService.getSellerOrders as any).mockResolvedValue([]);

      await request(sellerApp)
        .get('/api/orders/seller')
        .query({ status: 'confirmed', search: 'ORD' });

      expect(orderService.getSellerOrders).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({ status: 'confirmed', search: 'ORD' })
      );
    });

    it('returns 500 on service error', async () => {
      (orderService.getSellerOrders as any).mockRejectedValue(new Error('DB down'));

      const res = await request(sellerApp).get('/api/orders/seller');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch orders');
    });
  });

  describe('GET /api/orders/seller/stats', () => {
    it('returns seller stats', async () => {
      const stats = { total: 10, pending: 2 };
      (orderService.getSellerOrderStats as any).mockResolvedValue(stats);

      const res = await request(sellerApp).get('/api/orders/seller/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stats);
    });
  });

  describe('GET /api/orders/seller/:id', () => {
    it('returns a single order', async () => {
      (orderService.getSellerOrder as any).mockResolvedValue(mockOrder);

      const res = await request(sellerApp).get('/api/orders/seller/order-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('order-1');
      expect(orderService.getSellerOrder).toHaveBeenCalledWith(TEST_SELLER_ID, 'order-1');
    });

    it('returns 404 when order not found', async () => {
      (orderService.getSellerOrder as any).mockResolvedValue(null);

      const res = await request(sellerApp).get('/api/orders/seller/nope');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });
  });

  describe('POST /api/orders/seller/:id/confirm', () => {
    it('confirms an order', async () => {
      const confirmed = { ...mockOrder, status: 'confirmed' };
      (orderService.confirmOrder as any).mockResolvedValue(confirmed);

      const res = await request(sellerApp).post('/api/orders/seller/order-1/confirm');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');
      expect(orderService.confirmOrder).toHaveBeenCalledWith(TEST_SELLER_ID, 'order-1');
    });

    it('returns 404 when order not found', async () => {
      (orderService.confirmOrder as any).mockRejectedValue(new Error('Order not found'));

      const res = await request(sellerApp).post('/api/orders/seller/order-1/confirm');

      expect(res.status).toBe(404);
    });

    it('returns 400 when order cannot be confirmed', async () => {
      (orderService.confirmOrder as any).mockRejectedValue(
        new Error('Order with status delivered cannot be confirmed')
      );

      const res = await request(sellerApp).post('/api/orders/seller/order-1/confirm');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/orders/seller/:id/ship', () => {
    const shipData = {
      trackingNumber: 'TRK-123',
      carrier: 'DHL',
      estimatedDelivery: '2026-02-15',
    };

    it('ships an order with valid data', async () => {
      const shipped = { ...mockOrder, status: 'shipped' };
      (orderService.shipOrder as any).mockResolvedValue(shipped);

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/ship')
        .send(shipData);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('shipped');
      expect(orderService.shipOrder).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        'order-1',
        expect.objectContaining({ trackingNumber: 'TRK-123', carrier: 'DHL' })
      );
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/ship')
        .send({ trackingNumber: 'TRK-123' }); // missing carrier

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 404 when order not found', async () => {
      (orderService.shipOrder as any).mockRejectedValue(new Error('Order not found'));

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/ship')
        .send(shipData);

      expect(res.status).toBe(404);
    });

    it('returns 400 when order cannot be shipped', async () => {
      (orderService.shipOrder as any).mockRejectedValue(
        new Error('Order with status pending cannot be shipped')
      );

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/ship')
        .send(shipData);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/orders/seller/:id/deliver', () => {
    it('marks order as delivered', async () => {
      const delivered = { ...mockOrder, status: 'delivered' };
      (orderService.markDelivered as any).mockResolvedValue(delivered);

      const res = await request(sellerApp).post('/api/orders/seller/order-1/deliver');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('delivered');
    });

    it('returns 404 when order not found', async () => {
      (orderService.markDelivered as any).mockRejectedValue(new Error('Order not found'));

      const res = await request(sellerApp).post('/api/orders/seller/order-1/deliver');

      expect(res.status).toBe(404);
    });

    it('returns 400 when order cannot be marked delivered', async () => {
      (orderService.markDelivered as any).mockRejectedValue(
        new Error('Order cannot be marked as delivered')
      );

      const res = await request(sellerApp).post('/api/orders/seller/order-1/deliver');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/orders/seller/:id/cancel', () => {
    it('cancels an order with reason', async () => {
      const cancelled = { ...mockOrder, status: 'cancelled' };
      (orderService.cancelOrder as any).mockResolvedValue(cancelled);

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/cancel')
        .send({ reason: 'Out of stock' });

      expect(res.status).toBe(200);
      expect(orderService.cancelOrder).toHaveBeenCalledWith(
        TEST_SELLER_ID, 'order-1', 'Out of stock'
      );
    });

    it('returns 404 when order not found', async () => {
      (orderService.cancelOrder as any).mockRejectedValue(new Error('Order not found'));

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/cancel')
        .send({});

      expect(res.status).toBe(404);
    });

    it('returns 400 when order cannot be cancelled', async () => {
      (orderService.cancelOrder as any).mockRejectedValue(
        new Error('Order with status delivered cannot be cancelled')
      );

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/cancel')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/orders/seller/:id', () => {
    it('updates order details', async () => {
      const updated = { ...mockOrder, sellerNotes: 'Priority order' };
      (orderService.updateOrder as any).mockResolvedValue(updated);

      const res = await request(sellerApp)
        .put('/api/orders/seller/order-1')
        .send({ sellerNotes: 'Priority order' });

      expect(res.status).toBe(200);
      expect(res.body.sellerNotes).toBe('Priority order');
    });

    it('returns 400 for invalid data', async () => {
      const res = await request(sellerApp)
        .put('/api/orders/seller/order-1')
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 404 when order not found', async () => {
      (orderService.updateOrder as any).mockRejectedValue(new Error('Order not found'));

      const res = await request(sellerApp)
        .put('/api/orders/seller/order-1')
        .send({ sellerNotes: 'test' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/orders/seller/:id/status', () => {
    it('updates order status and notifies buyer', async () => {
      const updated = { ...mockOrder, status: 'confirmed', buyerId: TEST_BUYER_ID };
      (orderService.updateOrderStatus as any).mockResolvedValue(updated);

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/status')
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        TEST_SELLER_ID, 'order-1', 'confirmed'
      );
    });

    it('returns 400 for invalid status enum', async () => {
      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/status')
        .send({ status: 'bogus' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid status');
    });

    it('returns 404 when order not found', async () => {
      (orderService.updateOrderStatus as any).mockRejectedValue(new Error('Order not found'));

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/status')
        .send({ status: 'confirmed' });

      expect(res.status).toBe(404);
    });

    it('returns 400 on invalid transition', async () => {
      (orderService.updateOrderStatus as any).mockRejectedValue(
        new Error('Cannot transition from delivered to pending')
      );

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/status')
        .send({ status: 'confirmed' });

      expect(res.status).toBe(400);
    });
  });
});

// =============================================================================
// Buyer Routes
// =============================================================================

describe('Buyer Routes', () => {
  describe('GET /api/orders/buyer', () => {
    it('returns buyer orders', async () => {
      (orderService.getBuyerOrders as any).mockResolvedValue([mockOrder]);

      const res = await request(buyerApp).get('/api/orders/buyer');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockOrder]);
      expect(orderService.getBuyerOrders).toHaveBeenCalledWith(
        TEST_BUYER_ID,
        expect.objectContaining({})
      );
    });

    it('passes query filters', async () => {
      (orderService.getBuyerOrders as any).mockResolvedValue([]);

      await request(buyerApp)
        .get('/api/orders/buyer')
        .query({ status: 'shipped', search: 'widget' });

      expect(orderService.getBuyerOrders).toHaveBeenCalledWith(
        TEST_BUYER_ID,
        expect.objectContaining({ status: 'shipped', search: 'widget' })
      );
    });
  });

  describe('GET /api/orders/buyer/stats', () => {
    it('returns buyer stats', async () => {
      const stats = { total: 5, delivered: 3 };
      (orderService.getBuyerOrderStats as any).mockResolvedValue(stats);

      const res = await request(buyerApp).get('/api/orders/buyer/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stats);
    });
  });

  describe('GET /api/orders/buyer/dashboard', () => {
    it('returns dashboard summary', async () => {
      const summary = { kpis: { totalSpend: 500 } };
      (orderService.getBuyerDashboardSummary as any).mockResolvedValue(summary);

      const res = await request(buyerApp).get('/api/orders/buyer/dashboard');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(summary);
    });
  });

  describe('GET /api/orders/buyer/:id', () => {
    it('returns a single order', async () => {
      (orderService.getBuyerOrder as any).mockResolvedValue(mockOrder);

      const res = await request(buyerApp).get('/api/orders/buyer/order-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('order-1');
    });

    it('returns 404 when order not found', async () => {
      (orderService.getBuyerOrder as any).mockResolvedValue(null);

      const res = await request(buyerApp).get('/api/orders/buyer/nope');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/orders', () => {
    const validOrder = {
      itemId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 5,
      unitPrice: 19.99,
      source: 'direct_buy',
    };

    it('creates an order with valid data', async () => {
      const created = { id: 'order-new', ...validOrder, status: 'pending_confirmation' };
      (orderService.createOrder as any).mockResolvedValue(created);

      const res = await request(buyerApp).post('/api/orders').send(validOrder);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('order-new');
      expect(orderService.createOrder).toHaveBeenCalledWith(
        TEST_BUYER_ID,
        expect.objectContaining({ name: 'Buyer' }),
        expect.objectContaining({ itemId: validOrder.itemId, quantity: 5 })
      );
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(buyerApp)
        .post('/api/orders')
        .send({ quantity: 5 }); // missing itemId + unitPrice

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 for invalid itemId format', async () => {
      const res = await request(buyerApp)
        .post('/api/orders')
        .send({ ...validOrder, itemId: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for negative quantity', async () => {
      const res = await request(buyerApp)
        .post('/api/orders')
        .send({ ...validOrder, quantity: -1 });

      expect(res.status).toBe(400);
    });

    it('returns 404 when item not found', async () => {
      (orderService.createOrder as any).mockRejectedValue(new Error('Item not found'));

      const res = await request(buyerApp).post('/api/orders').send(validOrder);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/orders/buyer/:id/cancel', () => {
    it('cancels a buyer order', async () => {
      const cancelled = { ...mockOrder, status: 'cancelled' };
      (orderService.cancelOrderByBuyer as any).mockResolvedValue(cancelled);

      const res = await request(buyerApp)
        .post('/api/orders/buyer/order-1/cancel')
        .send({ reason: 'Changed my mind' });

      expect(res.status).toBe(200);
      expect(orderService.cancelOrderByBuyer).toHaveBeenCalledWith(
        TEST_BUYER_ID, 'order-1', 'Changed my mind'
      );
    });

    it('returns 404 when order not found', async () => {
      (orderService.cancelOrderByBuyer as any).mockRejectedValue(new Error('Order not found'));

      const res = await request(buyerApp)
        .post('/api/orders/buyer/order-1/cancel')
        .send({});

      expect(res.status).toBe(404);
    });

    it('returns 400 when order is not pending', async () => {
      (orderService.cancelOrderByBuyer as any).mockRejectedValue(
        new Error('Only pending orders can be cancelled by buyer')
      );

      const res = await request(buyerApp)
        .post('/api/orders/buyer/order-1/cancel')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/orders/buyer/:id/confirm-delivery', () => {
    it('confirms delivery of a shipped order', async () => {
      const shippedOrder = { ...mockOrder, status: 'shipped' };
      const deliveredOrder = { ...mockOrder, status: 'delivered', deliveredAt: new Date() };

      (prisma.marketplaceOrder.findFirst as any).mockResolvedValue(shippedOrder);
      (prisma.marketplaceOrder.update as any).mockResolvedValue(deliveredOrder);
      (prisma.marketplaceOrderAudit.create as any).mockResolvedValue({});

      const res = await request(buyerApp)
        .post('/api/orders/buyer/order-1/confirm-delivery')
        .send({ rating: 5, feedback: 'Great!' });

      expect(res.status).toBe(200);
      expect(prisma.marketplaceOrder.findFirst).toHaveBeenCalledWith({
        where: { id: 'order-1', buyerId: TEST_BUYER_ID },
      });
      expect(prisma.marketplaceOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({ status: 'delivered' }),
        })
      );
    });

    it('returns 404 when order not found', async () => {
      (prisma.marketplaceOrder.findFirst as any).mockResolvedValue(null);

      const res = await request(buyerApp)
        .post('/api/orders/buyer/order-1/confirm-delivery')
        .send({});

      expect(res.status).toBe(404);
    });

    it('returns 400 when order is not shipped', async () => {
      (prisma.marketplaceOrder.findFirst as any).mockResolvedValue({
        ...mockOrder,
        status: 'confirmed',
      });

      const res = await request(buyerApp)
        .post('/api/orders/buyer/order-1/confirm-delivery')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Only shipped orders');
    });
  });
});

// =============================================================================
// Order Health Routes
// =============================================================================
// NOTE: GET routes /seller/health-summary, /seller/exceptions, /seller/health-rules,
// and /seller/with-health are unreachable because they are defined AFTER /seller/:id
// in the router — Express matches them as :id params. This is a route-ordering bug
// in orderRoutes.ts. Only POST /seller/:id/* sub-routes work because they use POST.

describe('Order Health Routes', () => {
  describe('POST /api/orders/seller/:id/calculate-health', () => {
    it('calculates health for an order', async () => {
      const result = { healthStatus: 'healthy', score: 95 };
      (orderHealthService.calculateOrderHealth as any).mockResolvedValue(result);

      const res = await request(sellerApp).post('/api/orders/seller/order-1/calculate-health');

      expect(res.status).toBe(200);
      expect(res.body.healthStatus).toBe('healthy');
    });

    it('returns 404 for unauthorized order', async () => {
      (orderHealthService.calculateOrderHealth as any).mockRejectedValue(
        new Error('Order not found or unauthorized')
      );

      const res = await request(sellerApp).post('/api/orders/seller/order-1/calculate-health');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/orders/seller/:id/resolve-exception', () => {
    it('resolves an exception', async () => {
      const resolved = { id: 'order-1', exceptionResolved: true };
      (orderHealthService.resolveException as any).mockResolvedValue(resolved);

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/resolve-exception')
        .send({ resolution: 'Contacted customer and resolved' });

      expect(res.status).toBe(200);
    });

    it('returns 400 for missing resolution', async () => {
      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/resolve-exception')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 when no active exception', async () => {
      (orderHealthService.resolveException as any).mockRejectedValue(
        new Error('Order has no active exception')
      );

      const res = await request(sellerApp)
        .post('/api/orders/seller/order-1/resolve-exception')
        .send({ resolution: 'Fix applied' });

      expect(res.status).toBe(400);
    });
  });
});
