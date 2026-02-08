/**
 * Marketplace Order Service — Unit Tests
 *
 * Tests cover: acceptQuote, rejectQuote, getOrder, getBuyerOrders,
 * getSellerOrders, confirmOrder, rejectOrder, startProcessing, shipOrder,
 * markDelivered, closeOrder, cancelOrder, updateTracking, getOrderStats,
 * getOrderHistory.
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

vi.mock('../../../services/marketplaceInvoiceService', () => ({
  marketplaceInvoiceService: {
    createFromDeliveredOrder: vi.fn().mockResolvedValue({ success: true, invoice: { invoiceNumber: 'INV-001' } }),
  },
}));

vi.mock('../../../services/orderHealthService', () => ({
  enrichOrderWithSLA: vi.fn((order: unknown) => order),
}));

import {
  acceptQuote,
  rejectQuote,
  getOrder,
  getBuyerOrders,
  getSellerOrders,
  confirmOrder,
  rejectOrder,
  startProcessing,
  shipOrder,
  markDelivered,
  closeOrder,
  cancelOrder,
  updateTracking,
  getOrderStats,
  getOrderHistory,
} from '../../../services/marketplaceOrderService';

import { createMockOrder } from '../../factories';

beforeEach(() => {
  resetMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockQuote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quote-1',
    quoteNumber: 'QT-2026-0001',
    rfqId: 'rfq-1',
    sellerId: 'seller-1',
    buyerId: 'buyer-1',
    unitPrice: 100,
    quantity: 10,
    totalPrice: 1000,
    currency: 'SAR',
    discount: null,
    discountPercent: null,
    deliveryDays: 7,
    deliveryTerms: null,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes: null,
    status: 'sent',
    version: 1,
    isLatest: true,
    rfq: {
      id: 'rfq-1',
      rfqNumber: 'RFQ-2026-0001',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      itemId: 'item-1',
      status: 'quoted',
      deliveryLocation: 'Riyadh',
      item: {
        id: 'item-1',
        name: 'Widget',
        sku: 'W-001',
        images: null,
      },
    },
    ...overrides,
  };
}

// =============================================================================
// acceptQuote
// =============================================================================

describe('acceptQuote', () => {
  it('creates an order from a valid sent quote', async () => {
    const quote = createMockQuote();
    // validateQuoteForAcceptance: quote lookup
    prismaMock.quote.findUnique
      .mockResolvedValueOnce(quote)   // validation
      .mockResolvedValueOnce(quote);  // main lookup
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue(null); // no existing order
    // generateOrderNumber
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue(null);
    // Transaction mocks
    const newOrder = createMockOrder({ id: 'order-1', status: 'pending_confirmation', totalPrice: 1000 });
    prismaMock.marketplaceOrder.create.mockResolvedValue(newOrder);
    prismaMock.quote.update.mockResolvedValue({});
    prismaMock.itemRFQ.update.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});
    prismaMock.itemRFQEvent.create.mockResolvedValue({});
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await acceptQuote({ quoteId: 'quote-1', buyerId: 'buyer-1' });

    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await acceptQuote({ quoteId: 'nonexistent', buyerId: 'buyer-1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });

  it('returns error when buyer does not own quote', async () => {
    const quote = createMockQuote({ buyerId: 'other-buyer' });
    prismaMock.quote.findUnique.mockResolvedValue(quote);

    const result = await acceptQuote({ quoteId: 'quote-1', buyerId: 'buyer-1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when quote is in draft status', async () => {
    const quote = createMockQuote({ status: 'draft' });
    prismaMock.quote.findUnique.mockResolvedValue(quote);

    const result = await acceptQuote({ quoteId: 'quote-1', buyerId: 'buyer-1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot accept quote');
  });

  it('returns error when quote has expired', async () => {
    const quote = createMockQuote({ validUntil: new Date('2020-01-01') });
    prismaMock.quote.findUnique.mockResolvedValue(quote);

    const result = await acceptQuote({ quoteId: 'quote-1', buyerId: 'buyer-1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('returns error when order already exists for quote', async () => {
    const quote = createMockQuote();
    prismaMock.quote.findUnique.mockResolvedValue(quote);
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue(createMockOrder());

    const result = await acceptQuote({ quoteId: 'quote-1', buyerId: 'buyer-1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already been created');
  });
});

// =============================================================================
// rejectQuote
// =============================================================================

describe('rejectQuote', () => {
  it('rejects a sent quote', async () => {
    const quote = createMockQuote();
    prismaMock.quote.findUnique.mockResolvedValue(quote);
    prismaMock.quote.update.mockResolvedValue({});
    prismaMock.itemRFQ.update.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});
    prismaMock.itemRFQEvent.create.mockResolvedValue({});

    const result = await rejectQuote({ quoteId: 'quote-1', buyerId: 'buyer-1', reason: 'Too expensive' });

    expect(result.success).toBe(true);
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await rejectQuote({ quoteId: 'nonexistent', buyerId: 'buyer-1', reason: 'reason' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });

  it('returns error when buyer does not own quote', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote({ buyerId: 'other-buyer' }));

    const result = await rejectQuote({ quoteId: 'quote-1', buyerId: 'buyer-1', reason: 'reason' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when quote is in draft status', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote({ status: 'draft' }));

    const result = await rejectQuote({ quoteId: 'quote-1', buyerId: 'buyer-1', reason: 'reason' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot reject');
  });
});

// =============================================================================
// getOrder
// =============================================================================

describe('getOrder', () => {
  it('returns order for buyer', async () => {
    const order = createMockOrder();
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await getOrder('order-1', 'buyer-1');

    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
  });

  it('returns order for seller', async () => {
    const order = createMockOrder();
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await getOrder('order-1', 'seller-1');

    expect(result.success).toBe(true);
  });

  it('returns error for unauthorized user', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(createMockOrder());

    const result = await getOrder('order-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when order not found', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const result = await getOrder('nonexistent', 'buyer-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Order not found');
  });
});

// =============================================================================
// getBuyerOrders
// =============================================================================

describe('getBuyerOrders', () => {
  it('returns paginated orders for buyer', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([createMockOrder()]);
    prismaMock.marketplaceOrder.count.mockResolvedValue(1);

    const result = await getBuyerOrders('buyer-1');

    expect(result.success).toBe(true);
    expect(result.orders).toHaveLength(1);
    expect(result.pagination?.total).toBe(1);
  });

  it('applies status filter', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);

    await getBuyerOrders('buyer-1', { status: 'shipped' });

    const call = prismaMock.marketplaceOrder.findMany.mock.calls[0][0];
    expect(call.where.status).toBe('shipped');
  });
});

// =============================================================================
// getSellerOrders
// =============================================================================

describe('getSellerOrders', () => {
  it('returns orders for seller with string ID', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([createMockOrder()]);
    prismaMock.marketplaceOrder.count.mockResolvedValue(1);

    const result = await getSellerOrders('seller-1');

    expect(result.success).toBe(true);
    expect(result.orders).toHaveLength(1);
  });

  it('returns orders for seller with array of IDs', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([createMockOrder()]);
    prismaMock.marketplaceOrder.count.mockResolvedValue(1);

    const result = await getSellerOrders(['seller-1', 'profile-1']);

    expect(result.success).toBe(true);
    const call = prismaMock.marketplaceOrder.findMany.mock.calls[0][0];
    expect(call.where.sellerId.in).toEqual(['seller-1', 'profile-1']);
  });
});

// =============================================================================
// confirmOrder
// =============================================================================

describe('confirmOrder', () => {
  it('confirms a pending order', async () => {
    const order = createMockOrder({ status: 'pending_confirmation' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    const confirmed = createMockOrder({ status: 'confirmed', confirmedAt: new Date() });
    prismaMock.marketplaceOrder.update.mockResolvedValue(confirmed);
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await confirmOrder('order-1', 'seller-1');

    expect(result.success).toBe(true);
    expect(result.order?.status).toBe('confirmed');
  });

  it('returns error when order not found', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const result = await confirmOrder('nonexistent', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Order not found');
  });

  it('returns error when seller does not own order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ sellerId: 'other-seller' })
    );

    const result = await confirmOrder('order-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when order is not pending', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'shipped' })
    );

    const result = await confirmOrder('order-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot confirm');
  });

  it('works with sellerIds array', async () => {
    const order = createMockOrder({ status: 'pending_confirmation', sellerId: 'profile-1' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'confirmed' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await confirmOrder('order-1', ['seller-1', 'profile-1']);

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// rejectOrder
// =============================================================================

describe('rejectOrder', () => {
  it('rejects a pending order', async () => {
    const order = createMockOrder({ status: 'pending_confirmation' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'cancelled' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await rejectOrder({
      orderId: 'order-1',
      sellerId: 'seller-1',
      reason: 'Out of stock',
    });

    expect(result.success).toBe(true);
  });

  it('returns error for non-pending order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'shipped' })
    );

    const result = await rejectOrder({
      orderId: 'order-1',
      sellerId: 'seller-1',
      reason: 'reason',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot reject');
  });
});

// =============================================================================
// startProcessing
// =============================================================================

describe('startProcessing', () => {
  it('starts processing a confirmed order', async () => {
    const order = createMockOrder({ status: 'confirmed' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'processing' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await startProcessing({ orderId: 'order-1', sellerId: 'seller-1' });

    expect(result.success).toBe(true);
  });

  it('returns error for pending order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'pending_confirmation' })
    );

    const result = await startProcessing({ orderId: 'order-1', sellerId: 'seller-1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot start processing');
  });
});

// =============================================================================
// shipOrder
// =============================================================================

describe('shipOrder', () => {
  it('ships a processing order', async () => {
    const order = createMockOrder({ status: 'processing', confirmedAt: new Date() });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'shipped' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await shipOrder({
      orderId: 'order-1',
      sellerId: 'seller-1',
      carrier: 'DHL',
      trackingNumber: 'TRK-123',
    });

    expect(result.success).toBe(true);
  });

  it('returns error when carrier is missing', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'processing' })
    );

    const result = await shipOrder({
      orderId: 'order-1',
      sellerId: 'seller-1',
      carrier: '',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Carrier name is required');
  });

  it('returns error for non-processing order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'confirmed' })
    );

    const result = await shipOrder({
      orderId: 'order-1',
      sellerId: 'seller-1',
      carrier: 'DHL',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot ship');
  });
});

// =============================================================================
// markDelivered
// =============================================================================

describe('markDelivered', () => {
  it('marks a shipped order as delivered', async () => {
    const order = createMockOrder({ status: 'shipped', shippedAt: new Date() });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'delivered' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await markDelivered({
      orderId: 'order-1',
      userId: 'buyer-1',
      userRole: 'buyer',
    });

    expect(result.success).toBe(true);
  });

  it('returns error for non-shipped order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'processing' })
    );

    const result = await markDelivered({
      orderId: 'order-1',
      userId: 'buyer-1',
      userRole: 'buyer',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot mark as delivered');
  });

  it('returns error when buyer does not own order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'shipped', buyerId: 'other-buyer' })
    );

    const result = await markDelivered({
      orderId: 'order-1',
      userId: 'buyer-1',
      userRole: 'buyer',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});

// =============================================================================
// closeOrder
// =============================================================================

describe('closeOrder', () => {
  it('closes a delivered order', async () => {
    const order = createMockOrder({ status: 'delivered' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'closed' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await closeOrder({ orderId: 'order-1' });

    expect(result.success).toBe(true);
  });

  it('returns error for non-delivered order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'shipped' })
    );

    const result = await closeOrder({ orderId: 'order-1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot close order');
  });
});

// =============================================================================
// cancelOrder
// =============================================================================

describe('cancelOrder', () => {
  it('cancels a pending order', async () => {
    const order = createMockOrder({ status: 'pending_confirmation' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'cancelled' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await cancelOrder('order-1', 'seller-1', 'Stock issue');

    expect(result.success).toBe(true);
  });

  it('cancels a confirmed order', async () => {
    const order = createMockOrder({ status: 'confirmed' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'cancelled' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await cancelOrder('order-1', 'seller-1', 'Changed mind');

    expect(result.success).toBe(true);
  });

  it('returns error when cancelling shipped order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'shipped' })
    );

    const result = await cancelOrder('order-1', 'seller-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot cancel');
  });

  it('returns error when seller does not own order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ sellerId: 'other-seller' })
    );

    const result = await cancelOrder('order-1', 'seller-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});

// =============================================================================
// updateTracking
// =============================================================================

describe('updateTracking', () => {
  it('updates tracking for a shipped order', async () => {
    const order = createMockOrder({ status: 'shipped', carrier: 'DHL' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, trackingNumber: 'NEW-TRK' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

    const result = await updateTracking('order-1', 'seller-1', 'NEW-TRK');

    expect(result.success).toBe(true);
  });

  it('returns error for non-shipped order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      createMockOrder({ status: 'delivered' })
    );

    const result = await updateTracking('order-1', 'seller-1', 'TRK-123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot update tracking');
  });
});

// =============================================================================
// getOrderStats
// =============================================================================

describe('getOrderStats', () => {
  it('returns stats for buyer', async () => {
    prismaMock.marketplaceOrder.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2)  // pending
      .mockResolvedValueOnce(3)  // confirmed
      .mockResolvedValueOnce(1)  // processing
      .mockResolvedValueOnce(1)  // shipped
      .mockResolvedValueOnce(2)  // delivered
      .mockResolvedValueOnce(1)  // closed
      .mockResolvedValueOnce(0); // cancelled

    const result = await getOrderStats('buyer-1', 'buyer');

    expect(result.success).toBe(true);
    expect(result.stats?.total).toBe(10);
    expect(result.stats?.pending).toBe(2);
  });

  it('returns stats for seller', async () => {
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);

    const result = await getOrderStats('seller-1', 'seller');

    expect(result.success).toBe(true);
    expect(result.stats).toBeDefined();
  });
});

// =============================================================================
// getOrderHistory
// =============================================================================

describe('getOrderHistory', () => {
  it('returns audit events for authorized user', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(createMockOrder());
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([
      { id: 'a1', action: 'created' },
    ]);

    const result = await getOrderHistory('order-1', 'buyer-1');

    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);
  });

  it('returns error when order not found', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const result = await getOrderHistory('nonexistent', 'buyer-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Order not found');
  });

  it('returns error for unauthorized user', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(createMockOrder());

    const result = await getOrderHistory('order-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});
