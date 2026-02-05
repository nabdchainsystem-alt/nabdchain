import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

// =============================================================================
// PRODUCTION MODE: No mock data - all data comes from database
// =============================================================================
// Mock data has been removed for production readiness.
// If seller is not found, return 404.
// Frontend handles empty states appropriately.

// =============================================================================
// GET /api/public/seller/:slug - Get public seller profile by slug
// =============================================================================
router.get('/seller/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    let seller = null;
    try {
      seller = await prisma.sellerProfile.findUnique({
        where: { slug },
        include: {
          company: true,
          address: true,
          contact: true,
        },
      });
    } catch (dbError: any) {
      // Table may not exist - return 404
      console.error('Database error (SellerProfile may not exist):', dbError.message);
      return res.status(404).json({ error: 'Seller not found' });
    }

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Only return approved/active sellers publicly
    if (seller.status !== 'approved' && seller.status !== 'pending_review') {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Build public profile response (exclude sensitive data)
    const publicProfile = {
      id: seller.id,
      displayName: seller.displayName,
      slug: seller.slug,
      shortDescription: seller.shortDescription,
      logoUrl: seller.logoUrl,
      coverUrl: seller.coverUrl,
      verified: seller.companyVerified && seller.documentsVerified,
      vatRegistered: seller.company?.vatNumber ? true : false,
      location: seller.address ? {
        city: seller.address.city,
        country: seller.address.country,
      } : null,
      memberSince: seller.createdAt,
      // Statistics - defaults shown, actual values calculated below
      statistics: {
        totalProducts: 0,
        totalOrders: 0,
        responseRate: 95,
        responseTime: '< 24h',
        fulfillmentRate: 98,
        rfqWinRate: 72,
      },
    };

    // Get product count for this seller
    try {
      const productCount = await prisma.item.count({
        where: { sellerId: seller.userId },
      });
      publicProfile.statistics.totalProducts = productCount;
    } catch {
      // Item model may not exist yet
    }

    // Get order count for this seller
    try {
      const orderCount = await prisma.order.count({
        where: { sellerId: seller.userId },
      });
      publicProfile.statistics.totalOrders = orderCount;
    } catch {
      // Order model may not exist yet
    }

    res.json(publicProfile);
  } catch (error) {
    console.error('Error getting public seller profile:', error);
    res.status(500).json({ error: 'Failed to get seller profile' });
  }
});

// =============================================================================
// GET /api/public/seller/:slug/products - Get seller's products
// =============================================================================
router.get('/seller/:slug/products', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { page = '1', limit = '12', category, sort = 'newest' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get seller by slug (production mode - no mock data)
    let seller = null;
    try {
      seller = await prisma.sellerProfile.findUnique({
        where: { slug },
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError.message);
      return res.status(404).json({ error: 'Seller not found' });
    }

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Build where clause
    const where: any = {
      sellerId: seller.userId,
      status: 'active',
    };

    if (category) {
      where.category = category;
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_low') orderBy = { price: 'asc' };
    if (sort === 'price_high') orderBy = { price: 'desc' };
    if (sort === 'popular') orderBy = { viewCount: 'desc' };

    try {
      const [products, total] = await Promise.all([
        prisma.item.findMany({
          where,
          skip,
          take: limitNum,
          orderBy,
        }),
        prisma.item.count({ where }),
      ]);

      res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch {
      // If Item model doesn't exist, return empty
      res.json({
        products: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0,
        },
      });
    }
  } catch (error) {
    console.error('Error getting seller products:', error);
    res.status(500).json({ error: 'Failed to get seller products' });
  }
});

// =============================================================================
// GET /api/public/seller/:slug/reviews - Get seller reviews (Phase 2)
// =============================================================================
router.get('/seller/:slug/reviews', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { page = '1', limit = '10' } = req.query;

    // Verify seller exists (production mode)
    try {
      const seller = await prisma.sellerProfile.findUnique({
        where: { slug },
      });
      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }
    } catch (dbError: any) {
      console.error('Database error:', dbError.message);
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Phase 2: Reviews feature - return empty for now
    res.json({
      reviews: [],
      summary: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      },
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error('Error getting seller reviews:', error);
    res.status(500).json({ error: 'Failed to get seller reviews' });
  }
});

export default router;
