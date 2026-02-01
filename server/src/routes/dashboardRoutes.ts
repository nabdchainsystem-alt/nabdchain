// =============================================================================
// Dashboard Routes - Aggregated Analytics API
// =============================================================================

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/dashboardService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Seller Dashboard Routes
// =============================================================================

/**
 * GET /api/dashboard/seller/summary
 * Get aggregated dashboard summary for the authenticated seller
 */
router.get('/seller/summary', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const summary = await dashboardService.getSellerSummary(sellerId);
    res.json(summary);
  } catch (error) {
    apiLogger.error('Error fetching seller dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// =============================================================================
// Buyer Dashboard Routes
// =============================================================================

/**
 * GET /api/dashboard/buyer/summary
 * Get aggregated dashboard summary for the authenticated buyer
 */
router.get('/buyer/summary', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const summary = await dashboardService.getBuyerSummary(buyerId);
    res.json(summary);
  } catch (error) {
    apiLogger.error('Error fetching buyer dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

export default router;
