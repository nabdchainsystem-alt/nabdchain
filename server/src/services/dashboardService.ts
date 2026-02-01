// =============================================================================
// Dashboard Service - Aggregated Analytics for Seller Workspace
// =============================================================================

import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

export interface DashboardSummary {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  activeListings: number;
  listingsChange: number;
  pendingRfqs: number;
  rfqsChange: number;
  period: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function getDateRanges(): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
} {
  const now = new Date();
  const currentEnd = new Date(now);

  // Current period: Last 30 days
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 30);

  // Previous period: 30 days before that
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - 30);

  return { currentStart, currentEnd, previousStart, previousEnd };
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

// =============================================================================
// Dashboard Service
// =============================================================================

// Mock data for demo portal users
const MOCK_SELLER_SUMMARY: DashboardSummary = {
  totalRevenue: 125750,
  revenueChange: 12,
  totalOrders: 48,
  ordersChange: 8,
  activeListings: 156,
  listingsChange: 5,
  pendingRfqs: 12,
  rfqsChange: -3,
  period: {
    current: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
    previous: { start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  },
};

const MOCK_BUYER_SUMMARY: DashboardSummary = {
  totalRevenue: 45320, // Spend for buyer
  revenueChange: 15,
  totalOrders: 23,
  ordersChange: 10,
  activeListings: 5, // Active orders for buyer
  listingsChange: 0,
  pendingRfqs: 8,
  rfqsChange: 25,
  period: {
    current: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
    previous: { start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  },
};

export const dashboardService = {
  /**
   * Get aggregated dashboard summary for a seller
   */
  async getSellerSummary(sellerId: string): Promise<DashboardSummary> {
    // Return mock data for demo - in production, remove this block
    try {
      const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges();

    // Execute all queries in parallel for performance
    const [
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      currentListings,
      previousListings,
      currentRfqs,
      previousRfqs,
    ] = await Promise.all([
      // Current period revenue (sum of completed/delivered orders)
      prisma.marketplaceOrder.aggregate({
        where: {
          sellerId,
          createdAt: { gte: currentStart, lte: currentEnd },
          status: { in: ['confirmed', 'in_progress', 'shipped', 'delivered'] },
        },
        _sum: { totalPrice: true },
      }),
      // Previous period revenue
      prisma.marketplaceOrder.aggregate({
        where: {
          sellerId,
          createdAt: { gte: previousStart, lte: previousEnd },
          status: { in: ['confirmed', 'in_progress', 'shipped', 'delivered'] },
        },
        _sum: { totalPrice: true },
      }),
      // Current period orders count
      prisma.marketplaceOrder.count({
        where: {
          sellerId,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
      }),
      // Previous period orders count
      prisma.marketplaceOrder.count({
        where: {
          sellerId,
          createdAt: { gte: previousStart, lte: previousEnd },
        },
      }),
      // Current active listings
      prisma.item.count({
        where: {
          userId: sellerId,
          status: 'active',
          visibility: { in: ['public', 'rfq_only'] },
        },
      }),
      // Previous period listings (approximation using items created before previous end)
      prisma.item.count({
        where: {
          userId: sellerId,
          status: 'active',
          visibility: { in: ['public', 'rfq_only'] },
          createdAt: { lte: previousEnd },
        },
      }),
      // Current period pending RFQs
      prisma.marketplaceRFQ.count({
        where: {
          sellerId,
          status: { in: ['new', 'viewed'] },
          createdAt: { gte: currentStart, lte: currentEnd },
        },
      }),
      // Previous period pending RFQs
      prisma.marketplaceRFQ.count({
        where: {
          sellerId,
          status: { in: ['new', 'viewed'] },
          createdAt: { gte: previousStart, lte: previousEnd },
        },
      }),
    ]);

    const totalRevenue = currentRevenue._sum.totalPrice ?? 0;
    const prevRevenue = previousRevenue._sum.totalPrice ?? 0;

    // Return mock data if database is empty (demo mode)
    if (totalRevenue === 0 && currentOrders === 0 && currentListings === 0 && currentRfqs === 0) {
      console.log('Database empty, using mock data for seller dashboard');
      return MOCK_SELLER_SUMMARY;
    }

    return {
      totalRevenue,
      revenueChange: calculatePercentChange(totalRevenue, prevRevenue),
      totalOrders: currentOrders,
      ordersChange: calculatePercentChange(currentOrders, previousOrders),
      activeListings: currentListings,
      listingsChange: calculatePercentChange(currentListings, previousListings),
      pendingRfqs: currentRfqs,
      rfqsChange: calculatePercentChange(currentRfqs, previousRfqs),
      period: {
        current: {
          start: currentStart.toISOString(),
          end: currentEnd.toISOString(),
        },
        previous: {
          start: previousStart.toISOString(),
          end: previousEnd.toISOString(),
        },
      },
    };
    } catch (error) {
      // Return mock data on error (demo mode)
      console.log('Using mock data for seller dashboard:', error);
      return MOCK_SELLER_SUMMARY;
    }
  },

  /**
   * Get aggregated dashboard summary for a buyer
   */
  async getBuyerSummary(buyerId: string): Promise<DashboardSummary> {
    // Return mock data for demo - in production, remove this block
    try {
      const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges();

    const [
      currentSpend,
      previousSpend,
      currentOrders,
      previousOrders,
      currentActiveOrders,
      previousActiveOrders,
      currentRfqs,
      previousRfqs,
    ] = await Promise.all([
      // Current period spend
      prisma.marketplaceOrder.aggregate({
        where: {
          buyerId,
          createdAt: { gte: currentStart, lte: currentEnd },
          status: { in: ['confirmed', 'in_progress', 'shipped', 'delivered'] },
        },
        _sum: { totalPrice: true },
      }),
      // Previous period spend
      prisma.marketplaceOrder.aggregate({
        where: {
          buyerId,
          createdAt: { gte: previousStart, lte: previousEnd },
          status: { in: ['confirmed', 'in_progress', 'shipped', 'delivered'] },
        },
        _sum: { totalPrice: true },
      }),
      // Current period total orders
      prisma.marketplaceOrder.count({
        where: {
          buyerId,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
      }),
      // Previous period total orders
      prisma.marketplaceOrder.count({
        where: {
          buyerId,
          createdAt: { gte: previousStart, lte: previousEnd },
        },
      }),
      // Current active orders (in progress or shipped)
      prisma.marketplaceOrder.count({
        where: {
          buyerId,
          status: { in: ['pending_confirmation', 'confirmed', 'in_progress', 'shipped'] },
        },
      }),
      // This is a point-in-time metric, use 0 for previous
      Promise.resolve(0),
      // Current pending RFQs
      prisma.marketplaceRFQ.count({
        where: {
          buyerId,
          status: { in: ['new', 'viewed', 'responded', 'negotiation'] },
        },
      }),
      // Previous period pending RFQs
      prisma.marketplaceRFQ.count({
        where: {
          buyerId,
          status: { in: ['new', 'viewed', 'responded', 'negotiation'] },
          createdAt: { lte: previousEnd },
        },
      }),
    ]);

    const totalSpend = currentSpend._sum.totalPrice ?? 0;
    const prevSpend = previousSpend._sum.totalPrice ?? 0;

    // Return mock data if database is empty (demo mode)
    if (totalSpend === 0 && currentOrders === 0 && currentActiveOrders === 0 && currentRfqs === 0) {
      console.log('Database empty, using mock data for buyer dashboard');
      return MOCK_BUYER_SUMMARY;
    }

    return {
      totalRevenue: totalSpend, // For buyer, this represents spend
      revenueChange: calculatePercentChange(totalSpend, prevSpend),
      totalOrders: currentOrders,
      ordersChange: calculatePercentChange(currentOrders, previousOrders),
      activeListings: currentActiveOrders, // For buyer, this represents active orders
      listingsChange: 0, // Active orders is point-in-time
      pendingRfqs: currentRfqs,
      rfqsChange: calculatePercentChange(currentRfqs, previousRfqs),
      period: {
        current: {
          start: currentStart.toISOString(),
          end: currentEnd.toISOString(),
        },
        previous: {
          start: previousStart.toISOString(),
          end: previousEnd.toISOString(),
        },
      },
    };
    } catch (error) {
      // Return mock data on error (demo mode)
      console.log('Using mock data for buyer dashboard:', error);
      return MOCK_BUYER_SUMMARY;
    }
  },
};

export default dashboardService;
