// =============================================================================
// Marketplace Payment Service - Unit Tests
// =============================================================================
// Tests for: recordOrderPayment, confirmPayment, confirmCODPayment,
//            getOrderPaymentSummary
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { createMockOrder } from '../../factories';

// Mock dependencies — must come before service import
vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../services/portalNotificationService', () => ({
  portalNotificationService: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}));

import { marketplacePaymentService } from '../../../services/marketplacePaymentService';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// recordOrderPayment
// =============================================================================

describe('marketplacePaymentService.recordOrderPayment', () => {
  const defaultInput = {
    orderId: 'order-1',
    buyerId: 'buyer-1',
    amount: 250,
    paymentMethod: 'bank_transfer' as const,
    bankReference: 'TRF-001',
    bankName: 'Al Rajhi',
  };

  it('should return ORDER_NOT_FOUND when order does not exist', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const result = await marketplacePaymentService.recordOrderPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('ORDER_NOT_FOUND');
  });

  it('should return UNAUTHORIZED when buyer does not own the order', async () => {
    const order = createMockOrder({ buyerId: 'other-buyer' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await marketplacePaymentService.recordOrderPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('UNAUTHORIZED');
  });

  it('should reject COD orders', async () => {
    const order = createMockOrder({
      buyerId: 'buyer-1',
      paymentMethod: 'cod',
    } as Record<string, unknown>);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await marketplacePaymentService.recordOrderPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_PAYMENT_METHOD');
  });

  it('should reject cancelled orders', async () => {
    const order = createMockOrder({ buyerId: 'buyer-1', status: 'cancelled' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await marketplacePaymentService.recordOrderPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('ORDER_NOT_PAYABLE');
  });

  it('should reject when order is already paid', async () => {
    const order = createMockOrder({ buyerId: 'buyer-1', paymentStatus: 'paid' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await marketplacePaymentService.recordOrderPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('ALREADY_PAID');
  });

  it('should reject duplicate bank reference on same order', async () => {
    const order = createMockOrder({ buyerId: 'buyer-1' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst.mockResolvedValue({ id: 'existing' } as never);

    const result = await marketplacePaymentService.recordOrderPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('DUPLICATE_BANK_REFERENCE');
  });

  it('should reject when amount exceeds remaining balance', async () => {
    const order = createMockOrder({ buyerId: 'buyer-1', totalPrice: 100 });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst.mockResolvedValue(null);
    // Confirmed payments already = 80, so remaining = 20
    prismaMock.marketplacePayment.findMany
      .mockResolvedValueOnce([{ amount: 80, status: 'confirmed' }] as never[]) // confirmed query
      .mockResolvedValueOnce([] as never[]); // all payments query (won't be reached)

    const result = await marketplacePaymentService.recordOrderPayment({
      ...defaultInput,
      amount: 50, // exceeds remaining 20
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('AMOUNT_EXCEEDS_BALANCE');
  });

  it('should record partial payment (auto-confirmed) and set status to partial', async () => {
    const order = createMockOrder({ buyerId: 'buyer-1', totalPrice: 250 });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst
      .mockResolvedValueOnce(null)  // duplicate check
      .mockResolvedValueOnce(null); // payment number generation
    prismaMock.marketplacePayment.findMany
      .mockResolvedValueOnce([])  // confirmed payments (totalPaid = 0, remaining = 250)
      .mockResolvedValueOnce([{ amount: 100, status: 'confirmed' }] as never[]); // all confirmed after create

    prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null);
    prismaMock.marketplacePayment.create.mockResolvedValue({
      id: 'pay-1',
      paymentNumber: 'PAY-2026-00001',
      amount: 100,
      status: 'confirmed',
    } as never);
    prismaMock.marketplaceOrder.update.mockResolvedValue({} as never);
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({} as never);

    const result = await marketplacePaymentService.recordOrderPayment({
      ...defaultInput,
      amount: 100, // partial: 100 < 250
    });

    expect(result.success).toBe(true);
    expect(result.payment).toBeDefined();
    // Auto-confirmed: confirmedTotal=100 < totalPrice(250) → partial
    expect(prismaMock.marketplaceOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { paymentStatus: 'partial' },
      }),
    );
  });

  it('should set status to paid when auto-confirmed covers full amount', async () => {
    const order = createMockOrder({ buyerId: 'buyer-1', totalPrice: 250 });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.marketplacePayment.findMany
      .mockResolvedValueOnce([])  // confirmed payments (remaining = 250)
      .mockResolvedValueOnce([{ amount: 250, status: 'confirmed' }] as never[]); // all confirmed after create

    prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null);
    prismaMock.marketplacePayment.create.mockResolvedValue({
      id: 'pay-1',
      paymentNumber: 'PAY-2026-00001',
      amount: 250,
      status: 'confirmed',
    } as never);
    prismaMock.marketplaceOrder.update.mockResolvedValue({} as never);
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({} as never);
    prismaMock.buyerExpense.create.mockResolvedValue({} as never);

    const result = await marketplacePaymentService.recordOrderPayment(defaultInput);

    expect(result.success).toBe(true);
    // Auto-confirmed: confirmedTotal (250) >= totalPrice (250) → paid
    expect(prismaMock.marketplaceOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { paymentStatus: 'paid' },
      }),
    );
  });

  it('should keep status partial when additional auto-confirmed payment still < total', async () => {
    const order = createMockOrder({ buyerId: 'buyer-1', totalPrice: 250, paymentStatus: 'partial' });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.marketplacePayment.findMany
      .mockResolvedValueOnce([{ amount: 100, status: 'confirmed' }] as never[]) // confirmed payments (remaining=150)
      .mockResolvedValueOnce([
        { amount: 100, status: 'confirmed' },
        { amount: 50, status: 'confirmed' },
      ] as never[]); // all confirmed after create

    prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null);
    prismaMock.marketplacePayment.create.mockResolvedValue({
      id: 'pay-2',
      paymentNumber: 'PAY-2026-00002',
      amount: 50,
      status: 'confirmed',
    } as never);
    prismaMock.marketplaceOrder.update.mockResolvedValue({} as never);
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({} as never);

    const result = await marketplacePaymentService.recordOrderPayment({
      ...defaultInput,
      amount: 50,
    });

    expect(result.success).toBe(true);
    // confirmedTotal=150 < totalPrice=250 → partial (same as current, no update)
  });
});

// =============================================================================
// confirmPayment
// =============================================================================

describe('marketplacePaymentService.confirmPayment', () => {
  const defaultInput = {
    paymentId: 'pay-1',
    sellerId: 'seller-1',
    confirmationNote: 'Confirmed via bank statement',
  };

  const mockPayment = {
    id: 'pay-1',
    paymentNumber: 'PAY-2026-00001',
    orderId: 'order-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    amount: 250,
    currency: 'SAR',
    status: 'pending',
    invoiceId: null,
    invoice: null,
  };

  it('should return PAYMENT_NOT_FOUND when payment does not exist', async () => {
    prismaMock.marketplacePayment.findUnique.mockResolvedValue(null);

    const result = await marketplacePaymentService.confirmPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('PAYMENT_NOT_FOUND');
  });

  it('should return UNAUTHORIZED when seller does not own the payment', async () => {
    prismaMock.marketplacePayment.findUnique.mockResolvedValue({
      ...mockPayment,
      sellerId: 'other-seller',
    } as never);

    const result = await marketplacePaymentService.confirmPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('UNAUTHORIZED');
  });

  it('should return idempotent success when already confirmed', async () => {
    prismaMock.marketplacePayment.findUnique.mockResolvedValue({
      ...mockPayment,
      status: 'confirmed',
    } as never);

    const result = await marketplacePaymentService.confirmPayment(defaultInput);

    expect(result.success).toBe(true);
    expect(result.code).toBe('ALREADY_CONFIRMED');
  });

  it('should confirm payment and update order status to paid', async () => {
    // Pre-check: findUnique returns the payment (with include: { invoice: true })
    prismaMock.marketplacePayment.findUnique
      .mockResolvedValueOnce(mockPayment as never) // pre-check
      .mockResolvedValueOnce({ status: 'pending' } as never); // inside tx: pessimistic lock

    // Inside transaction (tx = prismaMock via setup mock):
    prismaMock.marketplacePayment.update.mockResolvedValue({
      ...mockPayment,
      status: 'confirmed',
    } as never);
    // Order payments query (for status computation)
    prismaMock.marketplacePayment.findMany.mockResolvedValue([
      { amount: 250, status: 'confirmed' },
    ] as never[]);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue({
      totalPrice: 250,
      paymentStatus: 'pending_conf',
      buyerId: 'buyer-1',
    } as never);
    prismaMock.marketplaceOrder.update.mockResolvedValue({} as never);
    prismaMock.marketplaceInvoiceEvent.create.mockResolvedValue({} as never);
    prismaMock.buyerExpense.create.mockResolvedValue({} as never);

    const result = await marketplacePaymentService.confirmPayment(defaultInput);

    expect(result.success).toBe(true);
    expect(prismaMock.marketplacePayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'confirmed',
          confirmedBy: 'seller-1',
        }),
      }),
    );
    // Order status should be updated to 'paid' (confirmed 250 >= total 250)
    expect(prismaMock.marketplaceOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { paymentStatus: 'paid' },
      }),
    );
  });

  it('should set order status to partial when confirmed < total', async () => {
    const partialPayment = { ...mockPayment, amount: 100 };

    // Pre-check + in-tx pessimistic lock
    prismaMock.marketplacePayment.findUnique
      .mockResolvedValueOnce(partialPayment as never)
      .mockResolvedValueOnce({ status: 'pending' } as never);

    prismaMock.marketplacePayment.update.mockResolvedValue({
      ...partialPayment,
      status: 'confirmed',
    } as never);
    // Only 100 confirmed, no pending
    prismaMock.marketplacePayment.findMany.mockResolvedValue([
      { amount: 100, status: 'confirmed' },
    ] as never[]);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue({
      totalPrice: 250,
      paymentStatus: 'pending_conf',
      buyerId: 'buyer-1',
    } as never);
    prismaMock.marketplaceOrder.update.mockResolvedValue({} as never);
    prismaMock.marketplaceInvoiceEvent.create.mockResolvedValue({} as never);

    const result = await marketplacePaymentService.confirmPayment(defaultInput);

    expect(result.success).toBe(true);
    // confirmedTotal=100 > 0 but < 250 → partial
    expect(prismaMock.marketplaceOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { paymentStatus: 'partial' },
      }),
    );
  });
});

// =============================================================================
// confirmCODPayment
// =============================================================================

describe('marketplacePaymentService.confirmCODPayment', () => {
  const defaultInput = {
    orderId: 'order-1',
    actorId: 'buyer-1',
    actorRole: 'buyer' as const,
    notes: 'Cash received',
  };

  it('should return ORDER_NOT_FOUND when order does not exist', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const result = await marketplacePaymentService.confirmCODPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('ORDER_NOT_FOUND');
  });

  it('should reject non-COD orders', async () => {
    const order = createMockOrder({ paymentMethod: 'bank_transfer' } as Record<string, unknown>);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await marketplacePaymentService.confirmCODPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('NOT_COD');
  });

  it('should reject if order is not delivered', async () => {
    const order = createMockOrder({
      status: 'shipped',
      paymentMethod: 'cod',
    } as Record<string, unknown>);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await marketplacePaymentService.confirmCODPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('NOT_DELIVERED');
  });

  it('should reject if already paid', async () => {
    const order = createMockOrder({
      status: 'delivered',
      paymentMethod: 'cod',
      paymentStatus: 'paid_cash',
    } as Record<string, unknown>);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await marketplacePaymentService.confirmCODPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('ALREADY_PAID');
  });

  it('should reject unauthorized buyer', async () => {
    const order = createMockOrder({
      status: 'delivered',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      buyerId: 'other-buyer',
    } as Record<string, unknown>);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

    const result = await marketplacePaymentService.confirmCODPayment(defaultInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe('UNAUTHORIZED');
  });

  it('should confirm COD payment and set status to paid_cash', async () => {
    const order = createMockOrder({
      id: 'order-1',
      status: 'delivered',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      buyerId: 'buyer-1',
      totalPrice: 250,
    } as Record<string, unknown>);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst.mockResolvedValue(null); // payment number gen
    prismaMock.marketplacePayment.create.mockResolvedValue({} as never);
    prismaMock.marketplaceOrder.update.mockResolvedValue({} as never);
    prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null);
    prismaMock.buyerExpense.create.mockResolvedValue({} as never);

    const result = await marketplacePaymentService.confirmCODPayment(defaultInput);

    expect(result.success).toBe(true);
    expect(prismaMock.marketplaceOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { paymentStatus: 'paid_cash' },
      }),
    );
    expect(prismaMock.marketplacePayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentMethod: 'cod',
          status: 'confirmed',
          amount: 250,
        }),
      }),
    );
  });

  it('should mark invoice as paid when invoice exists', async () => {
    const order = createMockOrder({
      id: 'order-1',
      status: 'delivered',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      buyerId: 'buyer-1',
    } as Record<string, unknown>);
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplacePayment.findFirst.mockResolvedValue(null);
    prismaMock.marketplacePayment.create.mockResolvedValue({} as never);
    prismaMock.marketplaceOrder.update.mockResolvedValue({} as never);
    prismaMock.marketplaceInvoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'issued',
    } as never);
    prismaMock.marketplaceInvoice.update.mockResolvedValue({} as never);
    prismaMock.buyerExpense.create.mockResolvedValue({} as never);

    const result = await marketplacePaymentService.confirmCODPayment(defaultInput);

    expect(result.success).toBe(true);
    expect(prismaMock.marketplaceInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ status: 'paid' }),
      }),
    );
  });
});

// =============================================================================
// getOrderPaymentSummary
// =============================================================================

describe('marketplacePaymentService.getOrderPaymentSummary', () => {
  it('should return null when order does not exist', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const result = await marketplacePaymentService.getOrderPaymentSummary('nonexistent');

    expect(result).toBeNull();
  });

  it('should return correct summary with no payments', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue({
      totalPrice: 250,
      paymentStatus: 'unpaid',
    } as never);
    prismaMock.marketplacePayment.findMany.mockResolvedValue([]);

    const result = await marketplacePaymentService.getOrderPaymentSummary('order-1');

    expect(result).toEqual({
      paidAmount: 0,
      pendingAmount: 0,
      remainingAmount: 250,
      totalPrice: 250,
      paymentCount: 0,
      latestPaymentStatus: 'unpaid',
      lastPaymentAt: null,
      lastPaymentReference: null,
    });
  });

  it('should return correct summary with partial payments', async () => {
    const now = new Date('2026-02-14T12:00:00Z');
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue({
      totalPrice: 250,
      paymentStatus: 'partial',
    } as never);
    prismaMock.marketplacePayment.findMany.mockResolvedValue([
      { amount: 50, status: 'pending', createdAt: now, bankReference: 'TRF-002' },
      { amount: 100, status: 'confirmed', createdAt: new Date('2026-02-13T10:00:00Z'), bankReference: 'TRF-001' },
    ] as never[]);

    const result = await marketplacePaymentService.getOrderPaymentSummary('order-1');

    expect(result).toEqual({
      paidAmount: 100,
      pendingAmount: 50,
      remainingAmount: 150,
      totalPrice: 250,
      paymentCount: 2,
      latestPaymentStatus: 'partial',
      lastPaymentAt: now.toISOString(),
      lastPaymentReference: 'TRF-002',
    });
  });

  it('should return remaining 0 when fully paid', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue({
      totalPrice: 250,
      paymentStatus: 'paid',
    } as never);
    prismaMock.marketplacePayment.findMany.mockResolvedValue([
      { amount: 250, status: 'confirmed', createdAt: new Date(), bankReference: 'TRF-001' },
    ] as never[]);

    const result = await marketplacePaymentService.getOrderPaymentSummary('order-1');

    expect(result!.paidAmount).toBe(250);
    expect(result!.remainingAmount).toBe(0);
  });
});
