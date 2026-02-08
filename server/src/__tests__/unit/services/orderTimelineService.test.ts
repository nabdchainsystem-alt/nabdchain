/**
 * Order Timeline Service — Unit Tests
 *
 * Tests cover: buildOrderTimeline (step building, SLA calculations,
 * audit log mapping, metrics), recordOrderDelay, getSLABreachSummary,
 * and getSellerPerformanceStats.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

import { orderTimelineService } from '../../../services/orderTimelineService';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Helper: create a mock order
// =============================================================================

function mockOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-2026-0001',
    sellerId: 'seller-1',
    buyerId: 'buyer-1',
    status: 'pending_confirmation',
    paymentStatus: 'unpaid',
    totalPrice: 500,
    currency: 'SAR',
    createdAt: new Date('2026-01-10T10:00:00Z'),
    confirmedAt: null,
    processingAt: null,
    shippedAt: null,
    deliveredAt: null,
    closedAt: null,
    cancelledAt: null,
    confirmationDeadline: null,
    shippingDeadline: null,
    deliveryDeadline: null,
    healthStatus: 'on_track',
    hasException: false,
    exceptionType: null,
    exceptionSeverity: null,
    exceptionMessage: null,
    exceptionCreatedAt: null,
    estimatedDelivery: null,
    ...overrides,
  };
}

// =============================================================================
// buildOrderTimeline
// =============================================================================

describe('orderTimelineService.buildOrderTimeline', () => {
  it('throws when order not found', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    await expect(orderTimelineService.buildOrderTimeline('nonexistent')).rejects.toThrow(
      'Order not found'
    );
  });

  it('builds timeline for a pending order', async () => {
    const order = mockOrder();
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]); // seller perf stats

    const result = await orderTimelineService.buildOrderTimeline('order-1');

    expect(result.orderId).toBe('order-1');
    expect(result.orderNumber).toBe('ORD-2026-0001');
    expect(result.currentStep).toBe('order_created');
    expect(result.steps.length).toBeGreaterThanOrEqual(4);
    expect(result.steps[0].key).toBe('order_created');
    expect(result.steps[0].status).toBe('completed');
  });

  it('builds timeline for confirmed order', async () => {
    const order = mockOrder({
      status: 'confirmed',
      confirmedAt: new Date('2026-01-10T15:00:00Z'),
    });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.buildOrderTimeline('order-1');

    expect(result.currentStep).toBe('seller_confirmed');
    const confirmStep = result.steps.find((s) => s.key === 'seller_confirmed');
    expect(confirmStep).toBeDefined();
    expect(confirmStep!.status).toBe('completed');
  });

  it('builds timeline for shipped order', async () => {
    const order = mockOrder({
      status: 'shipped',
      confirmedAt: new Date('2026-01-10T15:00:00Z'),
      shippedAt: new Date('2026-01-12T10:00:00Z'),
    });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.buildOrderTimeline('order-1');

    expect(result.currentStep).toBe('shipped');
    const shippedStep = result.steps.find((s) => s.key === 'shipped');
    expect(shippedStep!.status).toBe('completed');
    const deliveredStep = result.steps.find((s) => s.key === 'delivered');
    expect(deliveredStep!.status).toBe('active');
  });

  it('builds timeline for delivered order with metrics', async () => {
    const order = mockOrder({
      status: 'delivered',
      confirmedAt: new Date('2026-01-10T15:00:00Z'),
      shippedAt: new Date('2026-01-12T10:00:00Z'),
      deliveredAt: new Date('2026-01-15T10:00:00Z'),
    });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.buildOrderTimeline('order-1');

    expect(result.currentStep).toBe('delivered');
    expect(result.metrics.totalLeadTime).toBeDefined();
    expect(result.metrics.totalLeadTime).toBeGreaterThan(0);
    expect(result.metrics.confirmationTime).toBeDefined();
    expect(result.metrics.processingTime).toBeDefined();
    expect(result.metrics.shippingTime).toBeDefined();
  });

  it('builds timeline for cancelled order with skipped steps', async () => {
    const order = mockOrder({
      status: 'cancelled',
      cancelledAt: new Date('2026-01-11T10:00:00Z'),
    });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.buildOrderTimeline('order-1');

    const shippedStep = result.steps.find((s) => s.key === 'shipped');
    expect(shippedStep!.status).toBe('skipped');
    const deliveredStep = result.steps.find((s) => s.key === 'delivered');
    expect(deliveredStep!.status).toBe('skipped');
  });

  it('maps audit log events to timeline events', async () => {
    const order = mockOrder();
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([
      {
        id: 'audit-1',
        orderId: 'order-1',
        action: 'created',
        actor: 'buyer',
        actorId: 'buyer-1',
        newValue: null,
        metadata: null,
        createdAt: new Date('2026-01-10T10:00:00Z'),
      },
    ]);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.buildOrderTimeline('order-1');

    expect(result.events).toHaveLength(1);
    expect(result.events[0].eventType).toBe('created');
    expect(result.events[0].title).toBe('Order Created');
    expect(result.events[0].actor).toBe('buyer');
  });

  it('includes risk assessment', async () => {
    const order = mockOrder();
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.buildOrderTimeline('order-1');

    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.overallRisk).toBeDefined();
    expect(result.riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskAssessment.factors).toBeDefined();
    expect(result.riskAssessment.recommendations).toBeDefined();
  });

  it('detects high-value order risk', async () => {
    const order = mockOrder({ totalPrice: 50000 });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
    prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.buildOrderTimeline('order-1');

    const highValueFactor = result.riskAssessment.factors.find(
      (f) => f.type === 'high_value_order'
    );
    expect(highValueFactor).toBeDefined();
  });
});

// =============================================================================
// recordOrderDelay
// =============================================================================

describe('orderTimelineService.recordOrderDelay', () => {
  it('throws when order not found', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    await expect(
      orderTimelineService.recordOrderDelay('order-999', 'seller-1', {
        reasonCode: 'carrier_delay',
        affectedStep: 'shipped',
        impactDays: 2,
      })
    ).rejects.toThrow('Order not found or unauthorized');
  });

  it('throws when seller does not own order', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(
      mockOrder({ sellerId: 'other-seller' })
    );

    await expect(
      orderTimelineService.recordOrderDelay('order-1', 'seller-1', {
        reasonCode: 'carrier_delay',
        affectedStep: 'shipped',
        impactDays: 2,
      })
    ).rejects.toThrow('Order not found or unauthorized');
  });

  it('creates audit log for the delay', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(mockOrder());
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({ id: 'audit-1' });
    prismaMock.marketplaceOrder.update.mockResolvedValue(mockOrder());

    await orderTimelineService.recordOrderDelay('order-1', 'seller-1', {
      reasonCode: 'carrier_delay',
      affectedStep: 'shipped',
      impactDays: 2,
    });

    expect(prismaMock.marketplaceOrderAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-1',
          action: 'delay_reported',
          actor: 'seller',
        }),
      })
    );
  });

  it('updates order with exception for delays >= 1 day', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(mockOrder());
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({ id: 'audit-1' });
    prismaMock.marketplaceOrder.update.mockResolvedValue(mockOrder());

    await orderTimelineService.recordOrderDelay('order-1', 'seller-1', {
      reasonCode: 'production_delay',
      affectedStep: 'processing_started',
      impactDays: 3,
    });

    expect(prismaMock.marketplaceOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hasException: true,
          exceptionType: 'shipping_delay',
          exceptionSeverity: 'error', // >= 3 days
        }),
      })
    );
  });

  it('sets warning severity for delays < 3 days', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(mockOrder());
    prismaMock.marketplaceOrderAudit.create.mockResolvedValue({ id: 'audit-1' });
    prismaMock.marketplaceOrder.update.mockResolvedValue(mockOrder());

    await orderTimelineService.recordOrderDelay('order-1', 'seller-1', {
      reasonCode: 'weather',
      affectedStep: 'shipped',
      impactDays: 1,
    });

    expect(prismaMock.marketplaceOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          exceptionSeverity: 'warning',
        }),
      })
    );
  });
});

// =============================================================================
// getSLABreachSummary
// =============================================================================

describe('orderTimelineService.getSLABreachSummary', () => {
  it('returns correct breach summary for completed orders', async () => {
    const confirmDeadline = new Date('2026-01-11T10:00:00Z');
    const shippingDeadline = new Date('2026-01-13T10:00:00Z');
    const deliveryDeadline = new Date('2026-01-17T10:00:00Z');

    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      {
        id: 'o1',
        createdAt: new Date('2026-01-10T10:00:00Z'),
        confirmedAt: new Date('2026-01-10T15:00:00Z'), // on time
        shippedAt: new Date('2026-01-12T10:00:00Z'), // on time
        deliveredAt: new Date('2026-01-16T10:00:00Z'), // on time
        confirmationDeadline: confirmDeadline,
        shippingDeadline,
        deliveryDeadline,
      },
    ]);

    const result = await orderTimelineService.getSLABreachSummary('seller-1', 'month');

    expect(result.totalOrders).toBe(1);
    expect(result.onTimeDeliveries).toBe(1);
    expect(result.byStep.confirmation.met).toBe(1);
    expect(result.byStep.shipping.met).toBe(1);
    expect(result.byStep.delivery.met).toBe(1);
  });

  it('detects SLA breaches', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      {
        id: 'o1',
        createdAt: new Date('2026-01-10T10:00:00Z'),
        confirmedAt: new Date('2026-01-12T10:00:00Z'), // late
        shippedAt: null,
        deliveredAt: null,
        confirmationDeadline: new Date('2026-01-11T10:00:00Z'), // deadline passed
        shippingDeadline: null,
        deliveryDeadline: null,
      },
    ]);

    const result = await orderTimelineService.getSLABreachSummary('seller-1');

    expect(result.byStep.confirmation.breached).toBe(1);
    expect(result.slaBreaches).toBe(1);
  });

  it('returns zeroes when no orders exist', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.getSLABreachSummary('seller-1');

    expect(result.totalOrders).toBe(0);
    expect(result.onTimeDeliveries).toBe(0);
    expect(result.slaBreaches).toBe(0);
    expect(result.trend).toBe('stable');
  });
});

// =============================================================================
// getSellerPerformanceStats
// =============================================================================

describe('orderTimelineService.getSellerPerformanceStats', () => {
  it('returns default stats for sellers with no completed orders', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await orderTimelineService.getSellerPerformanceStats('seller-1');

    expect(result.avgOnTimeRate).toBe(85); // default for new sellers
    expect(result.totalOrders).toBe(0);
    expect(result.avgLeadTime).toBe(72); // default
  });

  it('calculates on-time rate from completed orders', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      {
        deliveredAt: new Date('2026-01-15T10:00:00Z'),
        deliveryDeadline: new Date('2026-01-16T10:00:00Z'),
        createdAt: new Date('2026-01-10T10:00:00Z'),
      },
      {
        deliveredAt: new Date('2026-01-18T10:00:00Z'),
        deliveryDeadline: new Date('2026-01-17T10:00:00Z'), // late
        createdAt: new Date('2026-01-10T10:00:00Z'),
      },
    ]);

    const result = await orderTimelineService.getSellerPerformanceStats('seller-1');

    expect(result.totalOrders).toBe(2);
    expect(result.avgOnTimeRate).toBe(50); // 1 out of 2
  });
});
