/**
 * Tests for marketplacePaymentService.recordOrderPayment
 *
 * Covers: authorization, validation, duplicate detection, amount logic,
 * order status checks, paymentStatus updates.
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

import { marketplacePaymentService } from '../../../services/marketplacePaymentService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-2024-00001',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    totalPrice: 1000,
    currency: 'SAR',
    status: 'pending_confirmation',
    paymentStatus: 'unpaid',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('marketplacePaymentService.recordOrderPayment', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('records payment successfully for an order without invoice', async () => {
    const order = makeOrder();
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst.mockResolvedValue(null); // no duplicate
    prismaMock.marketplacePayment.findMany
      .mockResolvedValueOnce([]) // confirmed payments (balance check)
      .mockResolvedValueOnce([{ id: 'pay-1', amount: 1000, status: 'confirmed' }]); // all confirmed (status calc)
    prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null); // no invoice
    prismaMock.marketplacePayment.create.mockResolvedValue({
      id: 'pay-1',
      paymentNumber: 'PAY-2024-0001',
      orderId: 'order-1',
      amount: 1000,
      status: 'confirmed',
    });
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, paymentStatus: 'paid' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});
    prismaMock.buyerExpense.create.mockResolvedValue({});

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-001',
    });

    expect(result.success).toBe(true);
    expect(result.payment).toBeDefined();
    expect(prismaMock.marketplacePayment.create).toHaveBeenCalledOnce();
    expect(prismaMock.marketplaceOrderAudit.create).toHaveBeenCalledOnce();
  });

  it('rejects payment for non-existent order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-999',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-001',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('ORDER_NOT_FOUND');
  });

  it('rejects payment from non-owner buyer', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(makeOrder({ buyerId: 'other-buyer' }));

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-001',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('UNAUTHORIZED');
  });

  it('rejects payment for cancelled order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(makeOrder({ status: 'cancelled' }));

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-001',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('ORDER_NOT_PAYABLE');
  });

  it('rejects payment for refunded order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(makeOrder({ status: 'refunded' }));

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-001',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('ORDER_NOT_PAYABLE');
  });

  it('rejects payment for already-paid order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(makeOrder({ paymentStatus: 'paid' }));

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-001',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('ALREADY_PAID');
  });

  it('rejects duplicate bank reference on same order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(makeOrder());
    prismaMock.marketplacePayment.findFirst.mockResolvedValue({ id: 'existing-pay' });

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-DUPLICATE',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('DUPLICATE_BANK_REFERENCE');
  });

  it('rejects amount exceeding remaining balance', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(makeOrder({ totalPrice: 500 }));
    prismaMock.marketplacePayment.findFirst.mockResolvedValue(null);
    prismaMock.marketplacePayment.findMany.mockResolvedValue([
      { id: 'p1', amount: 400, status: 'confirmed' },
    ]);

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      amount: 200,
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-002',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('AMOUNT_EXCEEDS_BALANCE');
  });

  it('rejects zero or negative amount', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(makeOrder());
    prismaMock.marketplacePayment.findFirst.mockResolvedValue(null);
    prismaMock.marketplacePayment.findMany.mockResolvedValue([]);

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      amount: 0,
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-003',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_AMOUNT');
  });

  it('links payment to existing invoice when available', async () => {
    const order = makeOrder();
    const invoice = { id: 'inv-1', invoiceNumber: 'INV-2024-0001', status: 'issued' };

    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst.mockResolvedValue(null);
    prismaMock.marketplacePayment.findMany
      .mockResolvedValueOnce([]) // confirmed payments (balance check)
      .mockResolvedValueOnce([{ id: 'pay-1', amount: 1000, status: 'confirmed' }]); // all confirmed (status calc)
    prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(invoice);
    prismaMock.marketplacePayment.create.mockResolvedValue({
      id: 'pay-1',
      paymentNumber: 'PAY-2024-0001',
      invoiceId: 'inv-1',
      orderId: 'order-1',
      amount: 1000,
      status: 'confirmed',
    });
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, paymentStatus: 'paid' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});
    prismaMock.marketplaceInvoiceEvent.create.mockResolvedValue({});
    prismaMock.marketplaceInvoice.update.mockResolvedValue({ ...invoice, status: 'paid' });
    prismaMock.buyerExpense.create.mockResolvedValue({});

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-003',
    });

    expect(result.success).toBe(true);
    // Check that invoiceId was passed to create
    const createCall = prismaMock.marketplacePayment.create.mock.calls[0][0];
    expect(createCall.data.invoiceId).toBe('inv-1');
  });

  it('defaults amount to order totalPrice when not specified', async () => {
    const order = makeOrder({ totalPrice: 750 });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst.mockResolvedValue(null);
    prismaMock.marketplacePayment.findMany
      .mockResolvedValueOnce([]) // confirmed payments (balance check)
      .mockResolvedValueOnce([{ id: 'pay-1', amount: 750, status: 'confirmed' }]); // all confirmed (status calc)
    prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null);
    prismaMock.marketplacePayment.create.mockResolvedValue({
      id: 'pay-1',
      amount: 750,
      status: 'confirmed',
    });
    prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, paymentStatus: 'paid' });
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});
    prismaMock.buyerExpense.create.mockResolvedValue({});

    const result = await marketplacePaymentService.recordOrderPayment({
      orderId: 'order-1',
      buyerId: 'buyer-1',
      paymentMethod: 'bank_transfer',
      bankReference: 'TRF-004',
    });

    expect(result.success).toBe(true);
    const createCall = prismaMock.marketplacePayment.create.mock.calls[0][0];
    expect(createCall.data.amount).toBe(750);
  });
});

describe('marketplacePaymentService.associatePaymentsWithInvoice', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('updates orphan payments with the new invoiceId', async () => {
    prismaMock.marketplacePayment.updateMany.mockResolvedValue({ count: 2 });

    const count = await marketplacePaymentService.associatePaymentsWithInvoice('order-1', 'inv-1');

    expect(count).toBe(2);
    expect(prismaMock.marketplacePayment.updateMany).toHaveBeenCalledWith({
      where: {
        orderId: 'order-1',
        invoiceId: null,
      },
      data: {
        invoiceId: 'inv-1',
      },
    });
  });

  it('returns 0 when no orphan payments exist', async () => {
    prismaMock.marketplacePayment.updateMany.mockResolvedValue({ count: 0 });

    const count = await marketplacePaymentService.associatePaymentsWithInvoice('order-1', 'inv-1');

    expect(count).toBe(0);
  });
});
