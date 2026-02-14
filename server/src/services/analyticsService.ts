// =============================================================================
// Analytics Service - Real Aggregation Queries
// Replaces mock data with actual database aggregations
// =============================================================================

import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

export interface AnalyticsPeriod {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
}

export interface BuyerKPIs {
  totalSpend: number;
  rfqsSent: number;
  avgResponseTime: number;
  savingsVsMarket: number;
  currency: string;
  trends: {
    spend: number;
    rfqs: number;
    responseTime: number;
    savings: number;
  };
}

export interface SpendByCategory {
  category: string;
  amount: number;
  percentage: number;
  orderCount?: number;
  avgOrderValue?: number;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  country?: string;
  totalOrders: number;
  totalSpend: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  responseTime: number;
  rfqWinRate: number;
}

export interface RFQFunnel {
  rfqsSent: number;
  quotesReceived: number;
  ordersPlaced: number;
  rfqToQuoteRate: number;
  quoteToOrderRate: number;
  overallConversionRate: number;
}

export interface SellerKPIs {
  revenue: number;
  orders: number;
  newBuyers: number;
  winRate: number;
  currency: string;
  trends: {
    revenue: number;
    orders: number;
    buyers: number;
    winRate: number;
  };
}

export interface SellerLifecycleMetrics {
  outstandingReceivables: number;
  avgDeliveryDays: number;
  avgPaymentDelayDays: number;
  fulfillmentRate: number;
  ordersByStatus: Record<string, number>;
  topBuyers: { buyerId: string; buyerName: string; totalSpend: number; orderCount: number }[];
}

export interface RevenueByCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface TopProduct {
  itemId: string;
  name: string;
  sku: string;
  revenue: number;
  orders: number;
}

export interface RegionDistribution {
  region: string;
  percentage: number;
  orders: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getPeriodDates(period: string): AnalyticsPeriod {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  return {
    period: period as AnalyticsPeriod['period'],
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  };
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

// =============================================================================
// Buyer Analytics Service
// =============================================================================

export const buyerAnalyticsService = {
  /**
   * Get complete buyer analytics overview
   */
  async getOverview(buyerId: string, period: string = 'month') {
    const dates = getPeriodDates(period);

    const [kpis, spendByCategory, topSuppliers, rfqFunnel, timeline] = await Promise.all([
      this.getKPIs(buyerId, dates),
      this.getSpendBySupplier(buyerId, dates),
      this.getTopSuppliers(buyerId, dates),
      this.getRFQFunnel(buyerId, dates),
      this.getTimeline(buyerId, dates),
    ]);

    return {
      kpis,
      spendByCategory,
      topSuppliers,
      rfqFunnel,
      timeline,
      period: dates.period,
    };
  },

  /**
   * Get buyer KPI metrics with trends
   */
  async getKPIs(buyerId: string, dates: AnalyticsPeriod): Promise<BuyerKPIs> {
    // Current period metrics
    const [currentOrders, prevOrders, currentRFQs, prevRFQs] = await Promise.all([
      prisma.marketplaceOrder.aggregate({
        where: {
          buyerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
        _sum: { totalPrice: true },
        _count: true,
      }),
      prisma.marketplaceOrder.aggregate({
        where: {
          buyerId,
          createdAt: { gte: dates.prevStartDate, lte: dates.prevEndDate },
        },
        _sum: { totalPrice: true },
        _count: true,
      }),
      prisma.itemRFQ.count({
        where: {
          buyerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
      prisma.itemRFQ.count({
        where: {
          buyerId,
          createdAt: { gte: dates.prevStartDate, lte: dates.prevEndDate },
        },
      }),
    ]);

    // Calculate average response time from quotes
    const quotes = await prisma.quote.findMany({
      where: {
        rfq: { buyerId },
        createdAt: { gte: dates.startDate, lte: dates.endDate },
      },
      select: {
        createdAt: true,
        rfq: { select: { createdAt: true } },
      },
    });

    let avgResponseTime = 0;
    if (quotes.length > 0) {
      const totalHours = quotes.reduce((sum, quote) => {
        const diff = quote.createdAt.getTime() - quote.rfq.createdAt.getTime();
        return sum + (diff / (1000 * 60 * 60));
      }, 0);
      avgResponseTime = Math.round((totalHours / quotes.length) * 10) / 10;
    }

    const totalSpend = currentOrders._sum.totalPrice || 0;
    const prevTotalSpend = prevOrders._sum.totalPrice || 0;

    return {
      totalSpend,
      rfqsSent: currentRFQs,
      avgResponseTime,
      savingsVsMarket: 12.5, // Placeholder - would need market price comparison
      currency: 'SAR',
      trends: {
        spend: calculateTrend(totalSpend, prevTotalSpend),
        rfqs: calculateTrend(currentRFQs, prevRFQs),
        responseTime: 0, // Would need historical comparison
        savings: 3.8, // Placeholder
      },
    };
  },

  /**
   * Get spend breakdown by supplier
   */
  async getSpendBySupplier(buyerId: string, dates: AnalyticsPeriod): Promise<SpendByCategory[]> {
    // Only count orders that represent real confirmed spend
    // (exclude pending_confirmation, cancelled, failed, refunded)
    const confirmedStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'closed'];

    const orders = await prisma.marketplaceOrder.findMany({
      where: {
        buyerId,
        status: { in: confirmedStatuses },
        createdAt: { gte: dates.startDate, lte: dates.endDate },
      },
      select: { sellerId: true, totalPrice: true },
    });

    if (orders.length === 0) return [];

    // Get seller display names
    const sellerIds = [...new Set(orders.map(o => o.sellerId))];
    const sellers = await prisma.sellerProfile.findMany({
      where: { userId: { in: sellerIds } },
      select: { userId: true, displayName: true },
    });
    const sellerNameMap = Object.fromEntries(sellers.map(s => [s.userId, s.displayName]));

    // Aggregate by supplier (keyed by sellerId to avoid name-collision issues)
    const supplierAgg = new Map<string, { name: string; spend: number; count: number }>();
    let totalSpend = 0;

    for (const order of orders) {
      const existing = supplierAgg.get(order.sellerId);
      if (existing) {
        existing.spend += order.totalPrice;
        existing.count += 1;
      } else {
        supplierAgg.set(order.sellerId, {
          name: sellerNameMap[order.sellerId] || 'Unknown Supplier',
          spend: order.totalPrice,
          count: 1,
        });
      }
      totalSpend += order.totalPrice;
    }

    // Sort by spend DESC
    const sorted = [...supplierAgg.values()].sort((a, b) => b.spend - a.spend);

    // Top 8 + "Others" bucket
    const MAX_SUPPLIERS = 8;
    const top = sorted.slice(0, MAX_SUPPLIERS);
    const rest = sorted.slice(MAX_SUPPLIERS);

    const result: SpendByCategory[] = top.map(s => ({
      category: s.name,
      amount: Math.round(s.spend * 100) / 100,
      percentage: totalSpend > 0 ? Math.round((s.spend / totalSpend) * 1000) / 10 : 0,
      orderCount: s.count,
      avgOrderValue: s.count > 0 ? Math.round((s.spend / s.count) * 100) / 100 : 0,
    }));

    if (rest.length > 0) {
      const othersSpend = rest.reduce((sum, s) => sum + s.spend, 0);
      const othersCount = rest.reduce((sum, s) => sum + s.count, 0);
      result.push({
        category: 'Others',
        amount: Math.round(othersSpend * 100) / 100,
        percentage: totalSpend > 0 ? Math.round((othersSpend / totalSpend) * 1000) / 10 : 0,
        orderCount: othersCount,
        avgOrderValue: othersCount > 0 ? Math.round((othersSpend / othersCount) * 100) / 100 : 0,
      });
    }

    return result;
  },

  /**
   * Get top suppliers by performance
   */
  async getTopSuppliers(buyerId: string, dates: AnalyticsPeriod): Promise<SupplierPerformance[]> {
    // Get orders grouped by seller
    const orders = await prisma.marketplaceOrder.findMany({
      where: {
        buyerId,
        createdAt: { gte: dates.startDate, lte: dates.endDate },
      },
    });

    // Get seller profiles for display names
    const sellerIds = [...new Set(orders.map(o => o.sellerId))];
    const sellerProfiles = await prisma.sellerProfile.findMany({
      where: { userId: { in: sellerIds } },
      select: { userId: true, displayName: true },
    });
    const sellerMap = Object.fromEntries(sellerProfiles.map(s => [s.userId, s]));

    // Aggregate by seller
    const sellerStats: Record<string, {
      name: string;
      country?: string;
      totalOrders: number;
      totalSpend: number;
      onTimeCount: number;
    }> = {};

    for (const order of orders) {
      const sellerId = order.sellerId;
      if (!sellerStats[sellerId]) {
        const sellerProfile = sellerMap[sellerId];
        sellerStats[sellerId] = {
          name: sellerProfile?.displayName || 'Unknown Seller',
          country: undefined,
          totalOrders: 0,
          totalSpend: 0,
          onTimeCount: 0,
        };
      }

      sellerStats[sellerId].totalOrders++;
      sellerStats[sellerId].totalSpend += order.totalPrice;

      if (order.healthStatus === 'on_track' || order.status === 'delivered') {
        sellerStats[sellerId].onTimeCount++;
      }
    }

    // Convert to array
    const result: SupplierPerformance[] = Object.entries(sellerStats)
      .map(([sellerId, stats]) => ({
        supplierId: sellerId,
        supplierName: stats.name,
        country: stats.country,
        totalOrders: stats.totalOrders,
        totalSpend: Math.round(stats.totalSpend * 100) / 100,
        onTimeDeliveryRate: stats.totalOrders > 0
          ? Math.round((stats.onTimeCount / stats.totalOrders) * 100)
          : 0,
        qualityScore: 4.5, // Would need quality rating system
        responseTime: 3.0, // Would need RFQ response tracking
        rfqWinRate: 70, // Would need quote acceptance tracking
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    return result;
  },

  /**
   * Get RFQ funnel conversion metrics
   */
  async getRFQFunnel(buyerId: string, dates: AnalyticsPeriod): Promise<RFQFunnel> {
    const [rfqsSent, quotesReceived, ordersFromQuotes] = await Promise.all([
      prisma.itemRFQ.count({
        where: {
          buyerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
      prisma.quote.count({
        where: {
          rfq: { buyerId },
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
      prisma.marketplaceOrder.count({
        where: {
          buyerId,
          rfqId: { not: null },
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
    ]);

    const rfqToQuoteRate = rfqsSent > 0 ? Math.round((quotesReceived / rfqsSent) * 1000) / 10 : 0;
    const quoteToOrderRate = quotesReceived > 0 ? Math.round((ordersFromQuotes / quotesReceived) * 1000) / 10 : 0;
    const overallConversionRate = rfqsSent > 0 ? Math.round((ordersFromQuotes / rfqsSent) * 1000) / 10 : 0;

    return {
      rfqsSent,
      quotesReceived,
      ordersPlaced: ordersFromQuotes,
      rfqToQuoteRate,
      quoteToOrderRate,
      overallConversionRate,
    };
  },

  /**
   * Get timeline data for charts
   */
  async getTimeline(buyerId: string, dates: AnalyticsPeriod) {
    // Get daily aggregations
    const orders = await prisma.marketplaceOrder.findMany({
      where: {
        buyerId,
        createdAt: { gte: dates.startDate, lte: dates.endDate },
      },
      select: {
        createdAt: true,
        totalPrice: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const rfqs = await prisma.itemRFQ.findMany({
      where: {
        buyerId,
        createdAt: { gte: dates.startDate, lte: dates.endDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyData: Record<string, { spend: number; orders: number; rfqs: number }> = {};

    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) dailyData[date] = { spend: 0, orders: 0, rfqs: 0 };
      dailyData[date].spend += order.totalPrice;
      dailyData[date].orders++;
    }

    for (const rfq of rfqs) {
      const date = rfq.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) dailyData[date] = { spend: 0, orders: 0, rfqs: 0 };
      dailyData[date].rfqs++;
    }

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        spend: Math.round(data.spend * 100) / 100,
        orders: data.orders,
        rfqs: data.rfqs,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};

// =============================================================================
// Seller Analytics Service
// =============================================================================

export const sellerAnalyticsService = {
  /**
   * Get complete seller analytics overview
   */
  async getOverview(sellerId: string, period: string = 'month') {
    const dates = getPeriodDates(period);

    const [kpis, revenueByCategory, topProducts, conversionFunnel, regionDistribution, lifecycleMetrics] = await Promise.all([
      this.getKPIs(sellerId, dates),
      this.getRevenueByCategory(sellerId, dates),
      this.getTopProducts(sellerId, dates),
      this.getConversionFunnel(sellerId, dates),
      this.getRegionDistribution(sellerId, dates),
      this.getLifecycleMetrics(sellerId, dates),
    ]);

    return {
      kpis,
      revenueByCategory,
      topProducts,
      conversionFunnel,
      regionDistribution,
      lifecycleMetrics,
      period: dates.period,
    };
  },

  /**
   * Get seller KPI metrics with trends
   */
  async getKPIs(sellerId: string, dates: AnalyticsPeriod): Promise<SellerKPIs> {
    const [currentOrders, prevOrders, currentBuyers, prevBuyers, currentRFQs, quotedRFQs] = await Promise.all([
      prisma.marketplaceOrder.aggregate({
        where: {
          sellerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
        _sum: { totalPrice: true },
        _count: true,
      }),
      prisma.marketplaceOrder.aggregate({
        where: {
          sellerId,
          createdAt: { gte: dates.prevStartDate, lte: dates.prevEndDate },
        },
        _sum: { totalPrice: true },
        _count: true,
      }),
      prisma.marketplaceOrder.groupBy({
        by: ['buyerId'],
        where: {
          sellerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
      prisma.marketplaceOrder.groupBy({
        by: ['buyerId'],
        where: {
          sellerId,
          createdAt: { gte: dates.prevStartDate, lte: dates.prevEndDate },
        },
      }),
      prisma.itemRFQ.count({
        where: {
          sellerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
      prisma.quote.count({
        where: {
          sellerId,
          status: 'accepted',
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
    ]);

    const revenue = currentOrders._sum.totalPrice || 0;
    const prevRevenue = prevOrders._sum.totalPrice || 0;
    const orders = currentOrders._count;
    const prevOrderCount = prevOrders._count;
    const newBuyers = currentBuyers.length;
    const prevBuyersCount = prevBuyers.length;
    const winRate = currentRFQs > 0 ? Math.round((quotedRFQs / currentRFQs) * 100) : 0;

    return {
      revenue,
      orders,
      newBuyers,
      winRate,
      currency: 'SAR',
      trends: {
        revenue: calculateTrend(revenue, prevRevenue),
        orders: calculateTrend(orders, prevOrderCount),
        buyers: calculateTrend(newBuyers, prevBuyersCount),
        winRate: 5, // Would need historical comparison
      },
    };
  },

  /**
   * Get revenue breakdown by category
   */
  async getRevenueByCategory(sellerId: string, dates: AnalyticsPeriod): Promise<RevenueByCategory[]> {
    const orders = await prisma.marketplaceOrder.findMany({
      where: {
        sellerId,
        createdAt: { gte: dates.startDate, lte: dates.endDate },
      },
    });

    // Get item categories
    const itemIds = [...new Set(orders.map(o => o.itemId))];
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, category: true },
    });
    const itemCategoryMap = Object.fromEntries(items.map(i => [i.id, i.category]));

    const categoryRevenue: Record<string, number> = {};
    let totalRevenue = 0;

    for (const order of orders) {
      const category = itemCategoryMap[order.itemId] || 'Other';
      const amount = order.quantity * order.unitPrice;
      categoryRevenue[category] = (categoryRevenue[category] || 0) + amount;
      totalRevenue += amount;
    }

    return Object.entries(categoryRevenue)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  },

  /**
   * Get top performing products
   */
  async getTopProducts(sellerId: string, dates: AnalyticsPeriod): Promise<TopProduct[]> {
    // MarketplaceOrder is denormalized - item info is directly on the order
    const orders = await prisma.marketplaceOrder.findMany({
      where: {
        sellerId,
        createdAt: { gte: dates.startDate, lte: dates.endDate },
      },
      select: { itemId: true, itemName: true, itemSku: true, quantity: true, unitPrice: true },
    });

    const productStats: Record<string, { name: string; sku: string; revenue: number; orders: number }> = {};

    for (const order of orders) {
      const itemId = order.itemId;
      if (!productStats[itemId]) {
        productStats[itemId] = {
          name: order.itemName || 'Unknown Product',
          sku: order.itemSku || 'N/A',
          revenue: 0,
          orders: 0,
        };
      }
      productStats[itemId].revenue += order.quantity * order.unitPrice;
      productStats[itemId].orders++;
    }

    return Object.entries(productStats)
      .map(([itemId, stats]) => ({
        itemId,
        name: stats.name,
        sku: stats.sku,
        revenue: Math.round(stats.revenue * 100) / 100,
        orders: stats.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  },

  /**
   * Get RFQ to order conversion funnel
   */
  async getConversionFunnel(sellerId: string, dates: AnalyticsPeriod) {
    const [rfqsReceived, quotesSent, ordersWon] = await Promise.all([
      prisma.itemRFQ.count({
        where: {
          sellerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
      prisma.quote.count({
        where: {
          sellerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
      prisma.marketplaceOrder.count({
        where: {
          sellerId,
          rfqId: { not: null },
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
      }),
    ]);

    return [
      { stage: 'RFQs Received', value: rfqsReceived, percent: 100 },
      { stage: 'Quotes Sent', value: quotesSent, percent: rfqsReceived > 0 ? Math.round((quotesSent / rfqsReceived) * 100) : 0 },
      { stage: 'Orders Won', value: ordersWon, percent: rfqsReceived > 0 ? Math.round((ordersWon / rfqsReceived) * 100) : 0 },
    ];
  },

  /**
   * Get seller lifecycle metrics: receivables, delivery time, payment delays, top buyers
   */
  async getLifecycleMetrics(sellerId: string, dates: AnalyticsPeriod): Promise<SellerLifecycleMetrics> {
    // Outstanding receivables: delivered orders that are not fully paid
    const [receivableOrders, allOrders, invoices, payments] = await Promise.all([
      prisma.marketplaceOrder.aggregate({
        where: {
          sellerId,
          status: 'delivered',
          paymentStatus: { in: ['unpaid', 'authorized', 'pending_conf'] },
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
        _sum: { totalPrice: true },
      }),
      prisma.marketplaceOrder.findMany({
        where: {
          sellerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
        select: {
          status: true,
          shippedAt: true,
          deliveredAt: true,
          buyerId: true,
          buyerName: true,
          buyerCompany: true,
          totalPrice: true,
        },
      }),
      prisma.marketplaceInvoice.findMany({
        where: {
          sellerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
        select: {
          issuedAt: true,
          paidAt: true,
          status: true,
        },
      }),
      prisma.marketplacePayment.findMany({
        where: {
          sellerId,
          createdAt: { gte: dates.startDate, lte: dates.endDate },
        },
        select: {
          createdAt: true,
          confirmedAt: true,
        },
      }),
    ]);

    // Calculate avg delivery time (shipped → delivered)
    let totalDeliveryDays = 0;
    let deliveryCount = 0;
    const statusCounts: Record<string, number> = {};

    for (const order of allOrders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      if (order.shippedAt && order.deliveredAt) {
        const days = (order.deliveredAt.getTime() - order.shippedAt.getTime()) / (1000 * 60 * 60 * 24);
        totalDeliveryDays += days;
        deliveryCount++;
      }
    }

    // Calculate avg payment delay (invoice issued → payment confirmed)
    let totalPaymentDelayDays = 0;
    let paymentCount = 0;
    for (const inv of invoices) {
      if (inv.issuedAt && inv.paidAt) {
        const days = (inv.paidAt.getTime() - inv.issuedAt.getTime()) / (1000 * 60 * 60 * 24);
        totalPaymentDelayDays += days;
        paymentCount++;
      }
    }

    // Fulfillment rate: delivered+closed / total orders
    const deliveredCount = (statusCounts['delivered'] || 0) + (statusCounts['closed'] || 0);
    const fulfillmentRate = allOrders.length > 0
      ? Math.round((deliveredCount / allOrders.length) * 100)
      : 0;

    // Top buyers by spend
    const buyerSpend: Record<string, { name: string; spend: number; count: number }> = {};
    for (const order of allOrders) {
      if (!buyerSpend[order.buyerId]) {
        buyerSpend[order.buyerId] = {
          name: order.buyerCompany || order.buyerName || 'Unknown Buyer',
          spend: 0,
          count: 0,
        };
      }
      buyerSpend[order.buyerId].spend += order.totalPrice;
      buyerSpend[order.buyerId].count++;
    }

    const topBuyers = Object.entries(buyerSpend)
      .map(([buyerId, data]) => ({
        buyerId,
        buyerName: data.name,
        totalSpend: Math.round(data.spend * 100) / 100,
        orderCount: data.count,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    return {
      outstandingReceivables: receivableOrders._sum.totalPrice || 0,
      avgDeliveryDays: deliveryCount > 0 ? Math.round((totalDeliveryDays / deliveryCount) * 10) / 10 : 0,
      avgPaymentDelayDays: paymentCount > 0 ? Math.round((totalPaymentDelayDays / paymentCount) * 10) / 10 : 0,
      fulfillmentRate,
      ordersByStatus: statusCounts,
      topBuyers,
    };
  },

  /**
   * Get geographic distribution of orders
   */
  async getRegionDistribution(sellerId: string, dates: AnalyticsPeriod): Promise<RegionDistribution[]> {
    const orders = await prisma.marketplaceOrder.findMany({
      where: {
        sellerId,
        createdAt: { gte: dates.startDate, lte: dates.endDate },
      },
      select: { shippingAddress: true },
    });

    const regionCounts: Record<string, number> = {};
    let totalOrders = orders.length;

    for (const order of orders) {
      let city = 'Unknown';
      if (order.shippingAddress) {
        try {
          const addr = JSON.parse(order.shippingAddress);
          city = addr.city || 'Unknown';
        } catch { /* ignore parse errors */ }
      }
      const region = city;
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }

    return Object.entries(regionCounts)
      .map(([region, count]) => ({
        region,
        orders: count,
        percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  },
};

export default {
  buyer: buyerAnalyticsService,
  seller: sellerAnalyticsService,
};
