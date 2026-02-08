/**
 * Analytics Service — Unit Tests
 *
 * Tests cover: buyer analytics (KPIs, spend by category, top suppliers,
 * RFQ funnel, timeline) and seller analytics (KPIs, revenue by category,
 * top products, conversion funnel, region distribution).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

import { buyerAnalyticsService, sellerAnalyticsService } from '../../../services/analyticsService';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Buyer Analytics: getKPIs
// =============================================================================

describe('buyerAnalyticsService.getKPIs', () => {
  const dates = {
    period: 'month' as const,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    prevStartDate: new Date('2025-12-01'),
    prevEndDate: new Date('2025-12-31'),
  };

  it('returns KPIs with spend and RFQ counts', async () => {
    prismaMock.marketplaceOrder.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: 50000 }, _count: 10 }) // current
      .mockResolvedValueOnce({ _sum: { totalPrice: 40000 }, _count: 8 }); // prev
    prismaMock.itemRFQ.count
      .mockResolvedValueOnce(15) // current
      .mockResolvedValueOnce(12); // prev
    prismaMock.quote.findMany.mockResolvedValue([]);

    const result = await buyerAnalyticsService.getKPIs('buyer-1', dates);

    expect(result.totalSpend).toBe(50000);
    expect(result.rfqsSent).toBe(15);
    expect(result.currency).toBe('SAR');
    expect(result.trends.spend).toBe(25); // (50000-40000)/40000*100 = 25
  });

  it('handles zero previous spend (trend = 100)', async () => {
    prismaMock.marketplaceOrder.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: 10000 }, _count: 3 })
      .mockResolvedValueOnce({ _sum: { totalPrice: 0 }, _count: 0 });
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.quote.findMany.mockResolvedValue([]);

    const result = await buyerAnalyticsService.getKPIs('buyer-1', dates);
    expect(result.trends.spend).toBe(100);
  });

  it('handles null totalPrice sum', async () => {
    prismaMock.marketplaceOrder.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: null }, _count: 0 })
      .mockResolvedValueOnce({ _sum: { totalPrice: null }, _count: 0 });
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.quote.findMany.mockResolvedValue([]);

    const result = await buyerAnalyticsService.getKPIs('buyer-1', dates);
    expect(result.totalSpend).toBe(0);
    expect(result.trends.spend).toBe(0);
  });

  it('calculates average response time from quotes', async () => {
    const rfqDate = new Date('2026-01-10T08:00:00Z');
    const quoteDate = new Date('2026-01-10T14:00:00Z'); // 6 hours later

    prismaMock.marketplaceOrder.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: 1000 }, _count: 1 })
      .mockResolvedValueOnce({ _sum: { totalPrice: 0 }, _count: 0 });
    prismaMock.itemRFQ.count.mockResolvedValue(1);
    prismaMock.quote.findMany.mockResolvedValue([
      { createdAt: quoteDate, rfq: { createdAt: rfqDate } },
    ]);

    const result = await buyerAnalyticsService.getKPIs('buyer-1', dates);
    expect(result.avgResponseTime).toBe(6);
  });
});

// =============================================================================
// Buyer Analytics: getSpendByCategory
// =============================================================================

describe('buyerAnalyticsService.getSpendByCategory', () => {
  const dates = {
    period: 'month' as const,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    prevStartDate: new Date('2025-12-01'),
    prevEndDate: new Date('2025-12-31'),
  };

  it('returns spend aggregated by item category', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { itemId: 'item-1', quantity: 10, unitPrice: 100 },
      { itemId: 'item-2', quantity: 5, unitPrice: 200 },
      { itemId: 'item-1', quantity: 3, unitPrice: 100 },
    ]);
    prismaMock.item.findMany.mockResolvedValue([
      { id: 'item-1', category: 'Bearings' },
      { id: 'item-2', category: 'Motors' },
    ]);

    const result = await buyerAnalyticsService.getSpendByCategory('buyer-1', dates);

    expect(result).toHaveLength(2);
    // Bearings: 10*100 + 3*100 = 1300, Motors: 5*200 = 1000
    const bearings = result.find((r) => r.category === 'Bearings');
    const motors = result.find((r) => r.category === 'Motors');
    expect(bearings!.amount).toBe(1300);
    expect(motors!.amount).toBe(1000);
  });

  it('returns empty array when no orders', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
    prismaMock.item.findMany.mockResolvedValue([]);

    const result = await buyerAnalyticsService.getSpendByCategory('buyer-1', dates);
    expect(result).toEqual([]);
  });

  it('uses "Other" for orders with unknown item category', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { itemId: 'item-unknown', quantity: 1, unitPrice: 50 },
    ]);
    prismaMock.item.findMany.mockResolvedValue([]); // no items found

    const result = await buyerAnalyticsService.getSpendByCategory('buyer-1', dates);
    expect(result[0].category).toBe('Other');
  });
});

// =============================================================================
// Buyer Analytics: getRFQFunnel
// =============================================================================

describe('buyerAnalyticsService.getRFQFunnel', () => {
  const dates = {
    period: 'month' as const,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    prevStartDate: new Date('2025-12-01'),
    prevEndDate: new Date('2025-12-31'),
  };

  it('calculates funnel conversion rates', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(20);
    prismaMock.quote.count.mockResolvedValue(15);
    prismaMock.marketplaceOrder.count.mockResolvedValue(8);

    const result = await buyerAnalyticsService.getRFQFunnel('buyer-1', dates);

    expect(result.rfqsSent).toBe(20);
    expect(result.quotesReceived).toBe(15);
    expect(result.ordersPlaced).toBe(8);
    expect(result.rfqToQuoteRate).toBe(75);
    expect(result.quoteToOrderRate).toBe(53.3);
    expect(result.overallConversionRate).toBe(40);
  });

  it('handles zero RFQs (no division by zero)', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.quote.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);

    const result = await buyerAnalyticsService.getRFQFunnel('buyer-1', dates);

    expect(result.rfqToQuoteRate).toBe(0);
    expect(result.quoteToOrderRate).toBe(0);
    expect(result.overallConversionRate).toBe(0);
  });
});

// =============================================================================
// Buyer Analytics: getTimeline
// =============================================================================

describe('buyerAnalyticsService.getTimeline', () => {
  const dates = {
    period: 'week' as const,
    startDate: new Date('2026-01-20'),
    endDate: new Date('2026-01-27'),
    prevStartDate: new Date('2026-01-13'),
    prevEndDate: new Date('2026-01-19'),
  };

  it('groups orders and RFQs by date', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { createdAt: new Date('2026-01-21T10:00:00Z'), totalPrice: 1000 },
      { createdAt: new Date('2026-01-21T14:00:00Z'), totalPrice: 2000 },
    ]);
    prismaMock.itemRFQ.findMany.mockResolvedValue([
      { createdAt: new Date('2026-01-21T09:00:00Z') },
    ]);

    const result = await buyerAnalyticsService.getTimeline('buyer-1', dates);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-01-21');
    expect(result[0].spend).toBe(3000);
    expect(result[0].orders).toBe(2);
    expect(result[0].rfqs).toBe(1);
  });

  it('returns empty array when no data', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
    prismaMock.itemRFQ.findMany.mockResolvedValue([]);

    const result = await buyerAnalyticsService.getTimeline('buyer-1', dates);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// Seller Analytics: getKPIs
// =============================================================================

describe('sellerAnalyticsService.getKPIs', () => {
  const dates = {
    period: 'month' as const,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    prevStartDate: new Date('2025-12-01'),
    prevEndDate: new Date('2025-12-31'),
  };

  it('returns revenue, orders, new buyers, and win rate', async () => {
    prismaMock.marketplaceOrder.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: 80000 }, _count: 20 }) // current
      .mockResolvedValueOnce({ _sum: { totalPrice: 60000 }, _count: 15 }); // prev
    prismaMock.marketplaceOrder.groupBy
      .mockResolvedValueOnce([{ buyerId: 'b1' }, { buyerId: 'b2' }]) // current buyers
      .mockResolvedValueOnce([{ buyerId: 'b1' }]); // prev buyers
    prismaMock.itemRFQ.count.mockResolvedValue(10);
    prismaMock.quote.count.mockResolvedValue(7);

    const result = await sellerAnalyticsService.getKPIs('seller-1', dates);

    expect(result.revenue).toBe(80000);
    expect(result.orders).toBe(20);
    expect(result.newBuyers).toBe(2);
    expect(result.winRate).toBe(70);
    expect(result.currency).toBe('SAR');
  });

  it('handles zero previous revenue', async () => {
    prismaMock.marketplaceOrder.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: 5000 }, _count: 2 })
      .mockResolvedValueOnce({ _sum: { totalPrice: null }, _count: 0 });
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.quote.count.mockResolvedValue(0);

    const result = await sellerAnalyticsService.getKPIs('seller-1', dates);
    expect(result.trends.revenue).toBe(100);
  });
});

// =============================================================================
// Seller Analytics: getTopProducts
// =============================================================================

describe('sellerAnalyticsService.getTopProducts', () => {
  const dates = {
    period: 'month' as const,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    prevStartDate: new Date('2025-12-01'),
    prevEndDate: new Date('2025-12-31'),
  };

  it('returns top products sorted by revenue', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { itemId: 'i1', itemName: 'Widget A', itemSku: 'WA-01', quantity: 10, unitPrice: 100 },
      { itemId: 'i1', itemName: 'Widget A', itemSku: 'WA-01', quantity: 5, unitPrice: 100 },
      { itemId: 'i2', itemName: 'Widget B', itemSku: 'WB-01', quantity: 2, unitPrice: 500 },
    ]);

    const result = await sellerAnalyticsService.getTopProducts('seller-1', dates);

    expect(result).toHaveLength(2);
    // Widget A: 10*100 + 5*100 = 1500, Widget B: 2*500 = 1000
    expect(result[0].name).toBe('Widget A');
    expect(result[0].revenue).toBe(1500);
    expect(result[0].orders).toBe(2);
    expect(result[1].name).toBe('Widget B');
    expect(result[1].revenue).toBe(1000);
  });

  it('returns empty array when no orders', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
    const result = await sellerAnalyticsService.getTopProducts('seller-1', dates);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// Seller Analytics: getConversionFunnel
// =============================================================================

describe('sellerAnalyticsService.getConversionFunnel', () => {
  const dates = {
    period: 'month' as const,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    prevStartDate: new Date('2025-12-01'),
    prevEndDate: new Date('2025-12-31'),
  };

  it('returns funnel stages with correct percentages', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(30);
    prismaMock.quote.count.mockResolvedValue(20);
    prismaMock.marketplaceOrder.count.mockResolvedValue(10);

    const result = await sellerAnalyticsService.getConversionFunnel('seller-1', dates);

    expect(result).toHaveLength(3);
    expect(result[0].stage).toBe('RFQs Received');
    expect(result[0].value).toBe(30);
    expect(result[1].stage).toBe('Quotes Sent');
    expect(result[1].percent).toBe(67);
    expect(result[2].stage).toBe('Orders Won');
    expect(result[2].percent).toBe(33);
  });

  it('handles zero RFQs gracefully', async () => {
    prismaMock.itemRFQ.count.mockResolvedValue(0);
    prismaMock.quote.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);

    const result = await sellerAnalyticsService.getConversionFunnel('seller-1', dates);
    expect(result[1].percent).toBe(0);
    expect(result[2].percent).toBe(0);
  });
});

// =============================================================================
// Seller Analytics: getRegionDistribution
// =============================================================================

describe('sellerAnalyticsService.getRegionDistribution', () => {
  const dates = {
    period: 'month' as const,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    prevStartDate: new Date('2025-12-01'),
    prevEndDate: new Date('2025-12-31'),
  };

  it('parses shipping address to get region distribution', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { shippingAddress: JSON.stringify({ city: 'Riyadh' }) },
      { shippingAddress: JSON.stringify({ city: 'Riyadh' }) },
      { shippingAddress: JSON.stringify({ city: 'Jeddah' }) },
    ]);

    const result = await sellerAnalyticsService.getRegionDistribution('seller-1', dates);

    expect(result).toHaveLength(2);
    const riyadh = result.find((r) => r.region === 'Riyadh');
    expect(riyadh!.orders).toBe(2);
    expect(riyadh!.percentage).toBe(67);
  });

  it('handles null shipping address as "Unknown"', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { shippingAddress: null },
    ]);

    const result = await sellerAnalyticsService.getRegionDistribution('seller-1', dates);
    expect(result[0].region).toBe('Unknown');
  });

  it('handles invalid JSON in shipping address', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { shippingAddress: 'not-json' },
    ]);

    const result = await sellerAnalyticsService.getRegionDistribution('seller-1', dates);
    expect(result[0].region).toBe('Unknown');
  });
});
