// =============================================================================
// Seller Home Routes - Dashboard Aggregation API
// =============================================================================

import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import sellerHomeService from '../services/sellerHomeService';
import { apiLogger } from '../utils/logger';

const router = Router();

/**
 * GET /api/seller/home/summary
 * Get complete seller home summary (single aggregated endpoint)
 */
router.get('/home/summary', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const days = parseInt(req.query.days as string, 10) || 7;

    const summary = await sellerHomeService.getSummary(sellerId, days);

    res.json(summary);
  } catch (error) {
    apiLogger.error('Error fetching seller home summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

/**
 * GET /api/seller/home/alerts
 * Get seller alerts only
 */
router.get('/home/alerts', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const alerts = await sellerHomeService.getAlerts(sellerId);

    res.json(alerts);
  } catch (error) {
    apiLogger.error('Error fetching seller alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /api/seller/home/focus
 * Get seller focus item (decision engine)
 */
router.get('/home/focus', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const focus = await sellerHomeService.getFocus(sellerId);

    res.json(focus);
  } catch (error) {
    apiLogger.error('Error fetching seller focus:', error);
    res.status(500).json({ error: 'Failed to fetch focus' });
  }
});

/**
 * GET /api/seller/home/health
 * Get system health status
 */
router.get('/home/health', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const health = await sellerHomeService.getSystemHealth(sellerId);

    res.json(health);
  } catch (error) {
    apiLogger.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch health' });
  }
});

/**
 * GET /api/seller/home/onboarding
 * Get onboarding progress
 */
router.get('/home/onboarding', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const onboarding = await sellerHomeService.getOnboardingProgress(sellerId);

    res.json(onboarding);
  } catch (error) {
    apiLogger.error('Error fetching onboarding progress:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding' });
  }
});

/**
 * GET /api/seller/home/pulse
 * Get business pulse chart data
 */
router.get('/home/pulse', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const days = parseInt(req.query.days as string, 10) || 7;

    // Validate days parameter
    if (days !== 7 && days !== 30) {
      return res.status(400).json({ error: 'Days must be 7 or 30' });
    }

    const pulse = await sellerHomeService.getBusinessPulse(sellerId, days);

    res.json(pulse);
  } catch (error) {
    apiLogger.error('Error fetching business pulse:', error);
    res.status(500).json({ error: 'Failed to fetch pulse data' });
  }
});

export default router;
