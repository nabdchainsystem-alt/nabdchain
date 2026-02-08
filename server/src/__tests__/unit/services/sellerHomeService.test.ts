/**
 * Seller Home Service — Unit Tests
 *
 * Tests cover: getAlerts, getFocus, getSystemHealth,
 * getOnboardingProgress, getBusinessPulse, getKPIs, getSummary.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import sellerHomeService from '../../../services/sellerHomeService';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// getAlerts
// =============================================================================

describe('sellerHomeService.getAlerts', () => {
  it('returns RFQ alert when actionable RFQs exist', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(3); // actionable RFQs
    prismaMock.marketplaceOrder.count.mockResolvedValue(0); // no pending orders
    prismaMock.item.count.mockResolvedValue(0); // no out of stock

    const alerts = await sellerHomeService.getAlerts('seller-1');

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('rfq');
    expect(alerts[0].count).toBe(3);
  });

  it('returns critical severity for > 5 actionable RFQs', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(8);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);
    prismaMock.item.count.mockResolvedValue(0);

    const alerts = await sellerHomeService.getAlerts('seller-1');
    expect(alerts[0].severity).toBe('critical');
  });

  it('returns order alert when orders need confirmation', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(2);
    prismaMock.item.count.mockResolvedValue(0);

    const alerts = await sellerHomeService.getAlerts('seller-1');

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('order');
    expect(alerts[0].count).toBe(2);
  });

  it('returns low stock alert', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);
    prismaMock.item.count.mockResolvedValue(5);

    const alerts = await sellerHomeService.getAlerts('seller-1');

    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('info');
  });

  it('returns multiple alerts when multiple conditions met', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(2);
    prismaMock.marketplaceOrder.count.mockResolvedValue(1);
    prismaMock.item.count.mockResolvedValue(3);

    const alerts = await sellerHomeService.getAlerts('seller-1');
    expect(alerts).toHaveLength(3);
  });

  it('returns empty array when nothing requires attention', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);
    prismaMock.item.count.mockResolvedValue(0);

    const alerts = await sellerHomeService.getAlerts('seller-1');
    expect(alerts).toEqual([]);
  });

  it('returns empty array on DB error', async () => {
    prismaMock.itemRFQ.count.mockRejectedValue(new Error('DB error'));
    const alerts = await sellerHomeService.getAlerts('seller-1');
    expect(alerts).toEqual([]);
  });
});

// =============================================================================
// getFocus
// =============================================================================

describe('sellerHomeService.getFocus', () => {
  it('returns add-listings focus when seller has no items', async () => {
    prismaMock.item.count.mockResolvedValue(0);

    const focus = await sellerHomeService.getFocus('seller-1');

    expect(focus.id).toBe('add-listings');
    expect(focus.isEmpty).toBe(true);
    expect(focus.ctaRoute).toBe('listings');
  });

  it('returns respond-rfqs focus when pending RFQs exist', async () => {
    prismaMock.item.count.mockResolvedValue(10);
    prismaMock.itemRFQ.count.mockResolvedValue(5);

    const focus = await sellerHomeService.getFocus('seller-1');

    expect(focus.id).toBe('respond-rfqs');
    expect(focus.isEmpty).toBe(false);
    expect(focus.ctaRoute).toBe('rfqs');
  });

  it('returns maintain-listings focus when no pending RFQs', async () => {
    prismaMock.item.count.mockResolvedValue(10);
    prismaMock.itemRFQ.count.mockResolvedValue(0);

    const focus = await sellerHomeService.getFocus('seller-1');

    expect(focus.id).toBe('maintain-listings');
    expect(focus.isEmpty).toBe(false);
  });

  it('returns add-listings on DB error', async () => {
    prismaMock.item.count.mockRejectedValue(new Error('DB fail'));
    const focus = await sellerHomeService.getFocus('seller-1');
    expect(focus.id).toBe('add-listings');
  });
});

// =============================================================================
// getSystemHealth
// =============================================================================

describe('sellerHomeService.getSystemHealth', () => {
  it('returns healthy status', async () => {
    const health = await sellerHomeService.getSystemHealth('seller-1');
    expect(health.status).toBe('healthy');
    expect(health.issues).toEqual([]);
  });
});

// =============================================================================
// getOnboardingProgress
// =============================================================================

describe('sellerHomeService.getOnboardingProgress', () => {
  it('returns null when seller has items (onboarding complete)', async () => {
    prismaMock.item.count.mockResolvedValue(5);
    const result = await sellerHomeService.getOnboardingProgress('seller-1');
    expect(result).toBeNull();
  });

  it('returns onboarding steps when seller has no items', async () => {
    prismaMock.item.count.mockResolvedValue(0);

    const result = await sellerHomeService.getOnboardingProgress('seller-1');

    expect(result).not.toBeNull();
    expect(result!.isComplete).toBe(false);
    expect(result!.completedSteps).toBe(1);
    expect(result!.totalSteps).toBe(4);
    expect(result!.steps).toHaveLength(4);
    expect(result!.steps[0].completed).toBe(true); // account step
    expect(result!.steps[1].completed).toBe(false); // profile
  });

  it('returns null on DB error', async () => {
    prismaMock.item.count.mockRejectedValue(new Error('DB error'));
    const result = await sellerHomeService.getOnboardingProgress('seller-1');
    expect(result).toBeNull();
  });
});

// =============================================================================
// getBusinessPulse
// =============================================================================

describe('sellerHomeService.getBusinessPulse', () => {
  it('returns daily revenue and order data', async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { totalPrice: 1000, createdAt: today },
      { totalPrice: 2000, createdAt: today },
    ]);

    const result = await sellerHomeService.getBusinessPulse('seller-1', 7);

    expect(result.labels).toHaveLength(7);
    expect(result.revenue).toHaveLength(7);
    expect(result.orders).toHaveLength(7);
    // Today's bucket should have some orders
    const todayRevenue = result.revenue[result.revenue.length - 1];
    expect(todayRevenue).toBe(3000);
  });

  it('returns zero-filled arrays when no orders', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await sellerHomeService.getBusinessPulse('seller-1', 7);

    expect(result.labels).toHaveLength(7);
    expect(result.revenue.every((r) => r === 0)).toBe(true);
    expect(result.orders.every((o) => o === 0)).toBe(true);
  });

  it('returns empty pulse on DB error', async () => {
    prismaMock.marketplaceOrder.findMany.mockRejectedValue(new Error('DB error'));

    const result = await sellerHomeService.getBusinessPulse('seller-1', 7);

    expect(result.labels).toHaveLength(7);
    expect(result.revenue.every((r) => r === 0)).toBe(true);
  });
});

// =============================================================================
// getKPIs
// =============================================================================

describe('sellerHomeService.getKPIs', () => {
  function mockKPIQueries(
    currentRevenue: number | null,
    previousRevenue: number | null,
    activeOrders: number,
    ordersNeedingAction: number,
    totalRfqs: number,
    newRfqs: number,
    deliveredRevenue: number | null
  ) {
    prismaMock.marketplaceOrder.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: currentRevenue } })
      .mockResolvedValueOnce({ _sum: { totalPrice: previousRevenue } })
      .mockResolvedValueOnce({ _sum: { totalPrice: deliveredRevenue } });
    prismaMock.marketplaceOrder.count
      .mockResolvedValueOnce(activeOrders)
      .mockResolvedValueOnce(ordersNeedingAction);
    prismaMock.itemRFQ.count
      .mockResolvedValueOnce(totalRfqs)
      .mockResolvedValueOnce(newRfqs);
  }

  it('returns KPI data with revenue and order counts', async () => {
    mockKPIQueries(50000, 40000, 8, 3, 12, 4, 15000);

    const result = await sellerHomeService.getKPIs('seller-1');

    expect(result.revenue).toBe(50000);
    expect(result.activeOrders).toBe(8);
    expect(result.ordersNeedingAction).toBe(3);
    expect(result.rfqInbox).toBe(12);
    expect(result.newRfqs).toBe(4);
    expect(result.pendingPayout).toBe(15000);
    expect(result.currency).toBe('SAR');
  });

  it('calculates revenue change percentage', async () => {
    mockKPIQueries(60000, 40000, 0, 0, 0, 0, 0);

    const result = await sellerHomeService.getKPIs('seller-1');
    expect(result.revenueChange).toBe(50); // (60000-40000)/40000*100
  });

  it('handles zero previous revenue (100% change)', async () => {
    mockKPIQueries(10000, 0, 0, 0, 0, 0, 0);

    const result = await sellerHomeService.getKPIs('seller-1');
    expect(result.revenueChange).toBe(100);
  });

  it('handles both null revenues (0% change)', async () => {
    mockKPIQueries(null, null, 0, 0, 0, 0, null);

    const result = await sellerHomeService.getKPIs('seller-1');
    expect(result.revenue).toBe(0);
    expect(result.revenueChange).toBe(0);
  });

  it('returns EMPTY_KPIS on DB error', async () => {
    prismaMock.marketplaceOrder.aggregate.mockRejectedValue(new Error('DB error'));

    const result = await sellerHomeService.getKPIs('seller-1');
    expect(result.revenue).toBe(0);
    expect(result.activeOrders).toBe(0);
    expect(result.currency).toBe('SAR');
  });
});

// =============================================================================
// getSummary
// =============================================================================

describe('sellerHomeService.getSummary', () => {
  it('returns complete summary with all sections', async () => {
    // Mock for getAlerts
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);
    prismaMock.item.count.mockResolvedValue(0);
    // Mock for getBusinessPulse
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
    // Mock for getKPIs
    prismaMock.marketplaceOrder.aggregate.mockResolvedValue({ _sum: { totalPrice: null } });

    const result = await sellerHomeService.getSummary('seller-1');

    expect(result.kpis).toBeDefined();
    expect(result.alerts).toBeDefined();
    expect(result.focus).toBeDefined();
    expect(result.systemHealth).toBeDefined();
    expect(result.pulse).toBeDefined();
    expect(result.lastUpdated).toBeDefined();
  });

  it('sets sellerStatus to "new" when seller has no items', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);
    prismaMock.item.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
    prismaMock.marketplaceOrder.aggregate.mockResolvedValue({ _sum: { totalPrice: null } });

    const result = await sellerHomeService.getSummary('seller-1');
    expect(result.sellerStatus).toBe('new');
  });
});
