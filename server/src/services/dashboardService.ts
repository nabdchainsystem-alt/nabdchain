// =============================================================================
// Dashboard Service - Aggregated Analytics for Seller Workspace
// =============================================================================

import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

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

export const dashboardService = {
  /**
   * Get aggregated dashboard summary for a seller
   */
  async getSellerSummary(sellerId: string): Promise<DashboardSummary> {
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

    // Return actual data (zeros if empty - production mode)
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
      apiLogger.error('Error fetching seller dashboard:', error);
      // Return empty summary on error - frontend handles empty state
      const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges();
      return {
        totalRevenue: 0,
        revenueChange: 0,
        totalOrders: 0,
        ordersChange: 0,
        activeListings: 0,
        listingsChange: 0,
        pendingRfqs: 0,
        rfqsChange: 0,
        period: {
          current: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
          previous: { start: previousStart.toISOString(), end: previousEnd.toISOString() },
        },
      };
    }
  },

  /**
   * Get aggregated dashboard summary for a buyer
   */
  async getBuyerSummary(buyerId: string): Promise<DashboardSummary> {
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

    // Return actual data (zeros if empty - production mode)
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
      apiLogger.error('Error fetching buyer dashboard:', error);
      // Return empty summary on error - frontend handles empty state
      const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges();
      return {
        totalRevenue: 0,
        revenueChange: 0,
        totalOrders: 0,
        ordersChange: 0,
        activeListings: 0,
        listingsChange: 0,
        pendingRfqs: 0,
        rfqsChange: 0,
        period: {
          current: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
          previous: { start: previousStart.toISOString(), end: previousEnd.toISOString() },
        },
      };
    }
  },
};

export default dashboardService;
