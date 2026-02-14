// =============================================================================
// Analytics Routes - Buyer and Seller Analytics Endpoints
// =============================================================================

import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { buyerAnalyticsService, sellerAnalyticsService } from '../services/analyticsService';
import { apiLogger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { getPeriodDates } from '../utils/dates';

const router = Router();

// =============================================================================
// Buyer Analytics Routes
// =============================================================================

/**
 * GET /api/analytics/buyer/overview
 * Get complete buyer analytics summary
 */
router.get('/buyer/overview', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const period = (req.query.period as string) || 'month';

    const data = await buyerAnalyticsService.getOverview(buyerId, period);
    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching buyer analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/buyer/summary
 * Alias for overview - matches frontend service expectation
 */
router.get('/buyer/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const period = (req.query.period as string) || 'month';

    if (!buyerId) {
      // Return empty data structure if no buyer profile
      return res.json({
        kpis: {
          totalSpend: 0,
          rfqsSent: 0,
          avgResponseTime: 0,
          savingsVsMarket: 0,
          currency: 'SAR',
          trends: { spend: 0, rfqs: 0, responseTime: 0, savings: 0 },
        },
        spendByCategory: [],
        topSuppliers: [],
        rfqFunnel: {
          rfqsSent: 0,
          quotesReceived: 0,
          ordersPlaced: 0,
          rfqToQuoteRate: 0,
          quoteToOrderRate: 0,
          overallConversionRate: 0,
        },
        timeline: [],
        period,
      });
    }

    const data = await buyerAnalyticsService.getOverview(buyerId, period);
    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching buyer analytics summary:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/buyer/kpis
 * Get buyer KPI metrics only
 */
router.get('/buyer/kpis', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const period = (req.query.period as string) || 'month';
    const dates = getPeriodDates(period);
    const kpis = await buyerAnalyticsService.getKPIs(buyerId, dates);

    return res.json(kpis);
  } catch (error) {
    apiLogger.error('Error fetching buyer KPIs:', error);
    return res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

/**
 * GET /api/analytics/buyer/spend-by-category
 * Get spend breakdown by category
 */
router.get('/buyer/spend-by-category', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    if (!buyerId) {
      return res.json([]);
    }

    const period = (req.query.period as string) || 'month';
    const dates = getPeriodDates(period);
    const data = await buyerAnalyticsService.getSpendBySupplier(buyerId, dates);

    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching spend by category:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

/**
 * GET /api/analytics/buyer/supplier-performance
 * Get supplier performance rankings
 */
router.get('/buyer/supplier-performance', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    if (!buyerId) {
      return res.json([]);
    }

    const limit = parseInt(req.query.limit as string) || 5;

    const now = new Date();
    const dates = {
      period: 'month' as const,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
      prevStartDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      prevEndDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 - 1),
    };

    const data = await buyerAnalyticsService.getTopSuppliers(buyerId, dates);
    return res.json(data.slice(0, limit));
  } catch (error) {
    apiLogger.error('Error fetching supplier performance:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

/**
 * GET /api/analytics/buyer/rfq-funnel
 * Get RFQ funnel conversion metrics
 */
router.get('/buyer/rfq-funnel', requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const period = (req.query.period as string) || 'month';

    if (!buyerId) {
      return res.json({
        rfqsSent: 0,
        quotesReceived: 0,
        ordersPlaced: 0,
        rfqToQuoteRate: 0,
        quoteToOrderRate: 0,
        overallConversionRate: 0,
      });
    }

    const dates = getPeriodDates(period);
    const data = await buyerAnalyticsService.getRFQFunnel(buyerId, dates);

    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching RFQ funnel:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// =============================================================================
// Seller Analytics Routes
// =============================================================================

/**
 * GET /api/analytics/seller/overview
 * Get complete seller analytics summary
 */
router.get('/seller/overview', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const period = (req.query.period as string) || 'month';

    // Map period format from frontend (7d, 30d, 90d, 12m) to service format
    const periodMap: Record<string, string> = {
      '7d': 'week',
      '30d': 'month',
      '90d': 'quarter',
      '12m': 'year',
    };
    const mappedPeriod = periodMap[period] || period;


    const seller = await prisma.sellerProfile.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    const data = await sellerAnalyticsService.getOverview(seller.id, mappedPeriod);
    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching seller analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/seller/summary
 * Alias for overview
 */
router.get('/seller/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const period = (req.query.period as string) || 'month';
    const periodMap: Record<string, string> = {
      '7d': 'week',
      '30d': 'month',
      '90d': 'quarter',
      '12m': 'year',
    };
    const mappedPeriod = periodMap[period] || period;


    const seller = await prisma.sellerProfile.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      // Return empty data structure if no seller profile
      return res.json({
        kpis: {
          revenue: 0,
          orders: 0,
          newBuyers: 0,
          winRate: 0,
          currency: 'SAR',
          trends: { revenue: 0, orders: 0, buyers: 0, winRate: 0 },
        },
        revenueByCategory: [],
        topProducts: [],
        conversionFunnel: [
          { stage: 'RFQs Received', value: 0, percent: 100 },
          { stage: 'Quotes Sent', value: 0, percent: 0 },
          { stage: 'Orders Won', value: 0, percent: 0 },
        ],
        regionDistribution: [],
        lifecycleMetrics: {
          outstandingReceivables: 0,
          avgDeliveryDays: 0,
          avgPaymentDelayDays: 0,
          fulfillmentRate: 0,
          ordersByStatus: {},
          topBuyers: [],
        },
        period: mappedPeriod,
      });
    }

    const data = await sellerAnalyticsService.getOverview(seller.id, mappedPeriod);
    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching seller analytics summary:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/seller/kpis
 * Get seller KPI metrics only
 */
router.get('/seller/kpis', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const period = (req.query.period as string) || 'month';
    const periodMap: Record<string, string> = {
      '7d': 'week',
      '30d': 'month',
      '90d': 'quarter',
      '12m': 'year',
    };
    const mappedPeriod = periodMap[period] || period;


    const seller = await prisma.sellerProfile.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      return res.json({
        revenue: 0,
        orders: 0,
        newBuyers: 0,
        winRate: 0,
        currency: 'SAR',
        trends: { revenue: 0, orders: 0, buyers: 0, winRate: 0 },
      });
    }

    const dates = getPeriodDates(mappedPeriod);
    const kpis = await sellerAnalyticsService.getKPIs(seller.id, dates);

    return res.json(kpis);
  } catch (error) {
    apiLogger.error('Error fetching seller KPIs:', error);
    return res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

/**
 * GET /api/analytics/seller/top-products
 * Get top performing products
 */
router.get('/seller/top-products', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }


    const seller = await prisma.sellerProfile.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      return res.json([]);
    }

    const now = new Date();
    const dates = {
      period: 'month' as const,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
      prevStartDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      prevEndDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 - 1),
    };

    const data = await sellerAnalyticsService.getTopProducts(seller.id, dates);
    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching top products:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

/**
 * GET /api/analytics/seller/conversion
 * Get RFQ to order conversion funnel
 */
router.get('/seller/conversion', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }


    const seller = await prisma.sellerProfile.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      return res.json([
        { stage: 'RFQs Received', value: 0, percent: 100 },
        { stage: 'Quotes Sent', value: 0, percent: 0 },
        { stage: 'Orders Won', value: 0, percent: 0 },
      ]);
    }

    const now = new Date();
    const dates = {
      period: 'month' as const,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
      prevStartDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      prevEndDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 - 1),
    };

    const data = await sellerAnalyticsService.getConversionFunnel(seller.id, dates);
    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching conversion funnel:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

/**
 * GET /api/analytics/seller/regions
 * Get geographic distribution of orders
 */
router.get('/seller/regions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }


    const seller = await prisma.sellerProfile.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      return res.json([]);
    }

    const now = new Date();
    const dates = {
      period: 'month' as const,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
      prevStartDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      prevEndDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 - 1),
    };

    const data = await sellerAnalyticsService.getRegionDistribution(seller.id, dates);
    return res.json(data);
  } catch (error) {
    apiLogger.error('Error fetching region distribution:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;
