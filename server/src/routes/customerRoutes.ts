// =============================================================================
// Customer Routes - Aggregated Customer Data API
// =============================================================================

import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { customerService } from '../services/customerService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Seller Customer Routes
// =============================================================================

/**
 * GET /api/customers/seller
 * Get all customers for the authenticated seller (aggregated from orders)
 */
router.get('/seller', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { search, sortBy, sortOrder } = req.query;

    const customers = await customerService.getSellerCustomers(sellerId, {
      search: search as string | undefined,
      sortBy: sortBy as 'name' | 'totalOrders' | 'totalSpend' | 'lastOrderDate' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.json(customers);
  } catch (error) {
    apiLogger.error('Error fetching seller customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * GET /api/customers/seller/:customerId
 * Get customer details with order history
 */
router.get('/seller/:customerId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const customerId = req.params.customerId as string;

    const customer = await customerService.getCustomerDetails(sellerId, customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    apiLogger.error('Error fetching customer details:', error);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

export default router;
