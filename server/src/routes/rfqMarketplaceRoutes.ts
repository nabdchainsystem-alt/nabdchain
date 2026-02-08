// =============================================================================
// RFQ Marketplace Routes - Seller Discovery of Open Buyer Requests
// =============================================================================
// Allows sellers to browse open RFQs from buyers and submit quotes
// Uses ItemRFQ model (what buyers create via Request Quote page)

import { Router, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Types
// =============================================================================

interface MarketplaceFilters {
  search?: string;
  category?: string;
  quantityMin?: number;
  quantityMax?: number;
  deadline?: string;
  priority?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  savedOnly?: boolean;
}

/**
 * Get a string query parameter value (handles Express query types)
 */
function getQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get seller ID from request (from portal auth or legacy header)
 */
async function getSellerId(req: Request): Promise<string | null> {
  const portalAuth = (req as any).portalAuth;
  const authUserId = (req as AuthRequest).auth?.userId;

  apiLogger.info('[getSellerId] Auth context:', {
    hasPortalAuth: !!portalAuth,
    portalRole: portalAuth?.portalRole,
    sellerId: portalAuth?.sellerId,
    userId: portalAuth?.userId,
    authUserId,
    xUserId: req.headers['x-user-id'],
  });

  // First try: direct sellerId from token
  if (portalAuth?.sellerId) {
    return portalAuth.sellerId;
  }

  // Second try: lookup seller profile by userId from portalAuth
  const userIdToLookup = portalAuth?.userId || authUserId;
  if (userIdToLookup) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: userIdToLookup },
      select: { id: true },
    });
    apiLogger.info('[getSellerId] Seller profile lookup:', {
      userId: userIdToLookup,
      found: !!sellerProfile,
      profileId: sellerProfile?.id
    });
    if (sellerProfile) {
      return sellerProfile.id;
    }
  }

  // Legacy: check x-user-id header and try to find seller profile
  const xUserId = req.headers['x-user-id'] as string;
  if (xUserId) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: xUserId },
      select: { id: true },
    });
    if (sellerProfile) {
      return sellerProfile.id;
    }
    return xUserId; // Fallback to xUserId itself
  }

  return null;
}

/**
 * Get deadline urgency based on required delivery date
 */
function getDeadlineUrgency(requiredDate: Date | null): 'normal' | 'urgent' | 'critical' | 'expired' {
  if (!requiredDate) return 'normal';

  const now = new Date();
  const diffMs = requiredDate.getTime() - now.getTime();
  const daysRemaining = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs <= 0) return 'expired';
  if (daysRemaining < 3) return 'critical';
  if (daysRemaining < 7) return 'urgent';
  return 'normal';
}

/**
 * Calculate days remaining until deadline
 */
function getDaysRemaining(requiredDate: Date | null): number {
  if (!requiredDate) return 30; // Default 30 days if no date

  const now = new Date();
  const diffMs = requiredDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Transform ItemRFQ to marketplace format
 */
function transformToMarketplaceRFQ(rfq: any, sellerId: string | null, savedRfqIds: Set<string>) {
  const item = rfq.item;
  const requiredDate = rfq.requiredDeliveryDate ? new Date(rfq.requiredDeliveryDate) : null;

  // Parse message to extract part details if it's a general RFQ
  let partName = item?.name || 'General Request';
  let partNumber = item?.sku || '';
  let manufacturer = '';
  let description = rfq.message || '';

  // If no item, try to parse from message (general RFQs store details in message)
  if (!item && rfq.message) {
    const lines = rfq.message.split('\n');
    for (const line of lines) {
      if (line.startsWith('Part:')) partName = line.replace('Part:', '').trim();
      if (line.startsWith('Part Number:')) partNumber = line.replace('Part Number:', '').trim();
      if (line.startsWith('Manufacturer:')) manufacturer = line.replace('Manufacturer:', '').trim();
    }
    // Get description (everything after the metadata lines)
    const descStart = rfq.message.indexOf('\n\n');
    if (descStart > 0) {
      description = rfq.message.slice(descStart + 2).trim();
    }
  }

  return {
    id: rfq.id,
    rfqNumber: rfq.rfqNumber || `RFQ-${rfq.id.slice(0, 8).toUpperCase()}`,

    // Item details
    partName,
    partNumber,
    manufacturer,
    description,
    category: item?.category || 'general',
    subcategory: item?.subcategory,

    // Quantity & pricing
    quantity: rfq.quantity,
    unit: item?.priceUnit || 'pcs',
    targetPrice: null, // Buyer doesn't set target price in current flow
    targetCurrency: 'SAR',

    // Delivery requirements
    deliveryLocation: rfq.deliveryLocation || 'Not specified',
    deliveryCity: rfq.deliveryCity,
    deliveryCountry: rfq.deliveryCountry || 'SA',
    requiredDeliveryDate: requiredDate?.toISOString(),

    // Priority
    priority: rfq.priority || 'normal',

    // Buyer info (anonymized for marketplace)
    buyer: {
      id: rfq.buyerId,
      companyName: `Buyer #${rfq.buyerId.slice(-6).toUpperCase()}`,
      country: rfq.deliveryCountry || 'SA',
      city: rfq.deliveryCity,
      badge: 'standard',
      isVerified: false,
    },

    // Status & deadlines
    status: ['new', 'viewed', 'under_review'].includes(rfq.status) ? 'open' :
            getDeadlineUrgency(requiredDate) === 'critical' ? 'closing_soon' :
            rfq.status === 'accepted' ? 'awarded' : 'open',
    deadline: requiredDate?.toISOString(),
    deadlineUrgency: getDeadlineUrgency(requiredDate),
    daysRemaining: getDaysRemaining(requiredDate),

    // Quote stats
    totalQuotes: rfq.quotes?.length || 0,
    quotesFromSeller: 0,

    // Timestamps
    createdAt: rfq.createdAt.toISOString(),
    updatedAt: rfq.updatedAt.toISOString(),

    // Seller-specific flags
    isSaved: savedRfqIds.has(rfq.id),
    hasQuoted: rfq.quotedPrice != null,
  };
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /rfq-marketplace
 * List open RFQs for sellers to browse (from ItemRFQ table)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const sellerId = await getSellerId(req);

    const filters: MarketplaceFilters = {
      search: getQueryString(req.query.search),
      category: getQueryString(req.query.category),
      quantityMin: req.query.quantityMin ? parseInt(getQueryString(req.query.quantityMin) || '0') : undefined,
      quantityMax: req.query.quantityMax ? parseInt(getQueryString(req.query.quantityMax) || '0') : undefined,
      deadline: getQueryString(req.query.deadline),
      priority: getQueryString(req.query.priority),
      sortBy: getQueryString(req.query.sortBy) || 'newest',
      page: req.query.page ? parseInt(getQueryString(req.query.page) || '1') : 1,
      limit: req.query.limit ? Math.min(parseInt(getQueryString(req.query.limit) || '20'), 50) : 20,
      savedOnly: getQueryString(req.query.savedOnly) === 'true',
    };

    // Build where clause for ItemRFQ
    const where: any = {
      // ONLY show MARKETPLACE RFQs - these are open to all sellers
      rfqType: 'MARKETPLACE',
      // Only show open RFQs (new/viewed/under_review status, not yet quoted/accepted)
      status: { in: ['new', 'viewed', 'under_review'] },
    };

    // Priority filter
    if (filters.priority) {
      where.priority = filters.priority;
    }

    // Quantity filter
    if (filters.quantityMin || filters.quantityMax) {
      where.quantity = {};
      if (filters.quantityMin) where.quantity.gte = filters.quantityMin;
      if (filters.quantityMax) where.quantity.lte = filters.quantityMax;
    }

    // Deadline filter based on requiredDeliveryDate
    if (filters.deadline) {
      const now = new Date();
      if (filters.deadline === 'urgent') {
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        where.requiredDeliveryDate = { lte: threeDaysFromNow, gt: now };
      } else if (filters.deadline === 'expiring_today') {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        where.requiredDeliveryDate = { lte: endOfDay, gt: now };
      }
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { rfqNumber: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
        { deliveryLocation: { contains: filters.search, mode: 'insensitive' } },
        { deliveryCity: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (filters.sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'expiring_soon':
        orderBy = { requiredDeliveryDate: 'asc' };
        break;
      case 'highest_quantity':
        orderBy = { quantity: 'desc' };
        break;
      case 'priority':
        orderBy = { priority: 'desc' };
        break;
    }

    // Get saved RFQ IDs for this seller (placeholder - would need SavedRFQ model)
    const savedRfqIds = new Set<string>();

    // Debug logging
    apiLogger.info('[RFQ Marketplace] Query where clause:', JSON.stringify(where));

    // Get RFQs from ItemRFQ table
    const [rfqs, total] = await Promise.all([
      prisma.itemRFQ.findMany({
        where,
        orderBy,
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              description: true,
              category: true,
              subcategory: true,
              sku: true,
              priceUnit: true,
              images: true,
            },
          },
          quotes: {
            select: { id: true },
          },
        },
      }),
      prisma.itemRFQ.count({ where }),
    ]);

    // Get statistics
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [totalOpen, newToday, expiringToday] = await Promise.all([
      prisma.itemRFQ.count({
        where: { rfqType: 'MARKETPLACE', status: { in: ['new', 'viewed', 'under_review'] } },
      }),
      prisma.itemRFQ.count({
        where: {
          rfqType: 'MARKETPLACE',
          status: { in: ['new', 'viewed', 'under_review'] },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.itemRFQ.count({
        where: {
          rfqType: 'MARKETPLACE',
          status: { in: ['new', 'viewed', 'under_review'] },
          requiredDeliveryDate: { lte: threeDaysFromNow, gt: now },
        },
      }),
    ]);

    // Debug logging
    apiLogger.info(`[RFQ Marketplace] Found ${rfqs.length} RFQs, total: ${total}, totalOpen: ${totalOpen}`);

    // Transform RFQs to marketplace format
    const marketplaceRFQs = rfqs.map(rfq => transformToMarketplaceRFQ(rfq, sellerId, savedRfqIds));

    res.json({
      rfqs: marketplaceRFQs,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total,
        totalPages: Math.ceil(total / (filters.limit || 20)),
      },
      stats: {
        totalOpen,
        newToday,
        expiringToday,
        savedCount: savedRfqIds.size,
        quotedCount: 0,
      },
    });
  } catch (error) {
    apiLogger.error('[RFQ Marketplace] Error listing RFQs:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace RFQs' });
  }
});

/**
 * GET /rfq-marketplace/stats
 * Get marketplace statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [totalOpen, newToday, expiringToday] = await Promise.all([
      prisma.itemRFQ.count({
        where: { rfqType: 'MARKETPLACE', status: { in: ['new', 'viewed', 'under_review'] } },
      }),
      prisma.itemRFQ.count({
        where: {
          rfqType: 'MARKETPLACE',
          status: { in: ['new', 'viewed', 'under_review'] },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.itemRFQ.count({
        where: {
          rfqType: 'MARKETPLACE',
          status: { in: ['new', 'viewed', 'under_review'] },
          requiredDeliveryDate: { lte: threeDaysFromNow, gt: now },
        },
      }),
    ]);

    res.json({
      totalOpen,
      newToday,
      expiringToday,
      savedCount: 0,
      quotedCount: 0,
    });
  } catch (error) {
    apiLogger.error('[RFQ Marketplace] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace stats' });
  }
});

/**
 * GET /rfq-marketplace/my-quotes
 * Get seller's submitted quotes for marketplace RFQs
 */
router.get('/my-quotes', async (req: Request, res: Response) => {
  try {
    const sellerId = await getSellerId(req);

    apiLogger.info('[RFQ Marketplace] /my-quotes request:', {
      sellerId,
      authHeader: req.headers.authorization ? 'Bearer ***' : 'none',
    });

    if (!sellerId) {
      apiLogger.warn('[RFQ Marketplace] /my-quotes - No sellerId resolved');
      return res.status(401).json({ error: 'Unauthorized - seller ID required' });
    }

    const page = req.query.page ? parseInt(getQueryString(req.query.page) || '1') : 1;
    const limit = Math.min(req.query.limit ? parseInt(getQueryString(req.query.limit) || '20') : 20, 50);

    // Get quotes submitted by this seller
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rfq: {
            select: {
              id: true,
              rfqNumber: true,
              quantity: true,
              message: true,
              item: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.quote.count({ where: { sellerId } }),
    ]);

    apiLogger.info('[RFQ Marketplace] /my-quotes found:', {
      sellerId,
      quotesFound: quotes.length,
      total,
    });

    const transformedQuotes = quotes.map(quote => {
      // Get part name from item, or parse from RFQ message
      let partName = quote.rfq?.item?.name;
      let category = quote.rfq?.item?.category;

      // If no item, try to parse part name from RFQ message
      if (!partName && quote.rfq?.message) {
        const lines = quote.rfq.message.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('Part:')) {
            partName = trimmed.replace('Part:', '').trim();
          } else if (trimmed.startsWith('Category:')) {
            category = trimmed.replace('Category:', '').trim();
          }
        }
      }

      return {
        id: quote.id,
        quoteNumber: quote.quoteNumber || `QT-${quote.id.slice(0, 8).toUpperCase()}`,
        rfqId: quote.rfqId,
        rfqNumber: quote.rfq?.rfqNumber || `RFQ-${quote.rfqId.slice(0, 8).toUpperCase()}`,
        unitPrice: quote.unitPrice,
        quantity: quote.quantity,
        totalPrice: quote.totalPrice,
        currency: quote.currency,
        leadTimeDays: quote.deliveryDays || 0,
        validUntil: quote.validUntil?.toISOString(),
        status: quote.status,
        submittedAt: quote.sentAt?.toISOString() || quote.createdAt.toISOString(),
        rfqPartName: partName || 'General Request',
        rfqCategory: category,
      };
    });

    res.json({
      quotes: transformedQuotes,
      total,
    });
  } catch (error) {
    apiLogger.error('[RFQ Marketplace] Error fetching seller quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

/**
 * GET /rfq-marketplace/:id
 * Get single RFQ details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const sellerId = await getSellerId(req);

    const rfq = await prisma.itemRFQ.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            description: true,
            category: true,
            subcategory: true,
            sku: true,
            priceUnit: true,
            images: true,
          },
        },
        quotes: {
          select: { id: true, sellerId: true },
        },
      },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    // Mark as viewed if seller is viewing for the first time
    if (sellerId && !rfq.viewedAt) {
      await prisma.itemRFQ.update({
        where: { id },
        data: {
          viewedAt: new Date(),
          viewedBy: sellerId,
          status: 'viewed',
        },
      });
    }

    const savedRfqIds = new Set<string>();
    res.json(transformToMarketplaceRFQ(rfq, sellerId, savedRfqIds));
  } catch (error) {
    apiLogger.error('[RFQ Marketplace] Error fetching RFQ details:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ details' });
  }
});

/**
 * POST /rfq-marketplace/:id/save
 * Save an RFQ for later
 */
router.post('/:id/save', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const sellerId = await getSellerId(req);

    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - seller ID required' });
    }

    // Verify RFQ exists
    const rfq = await prisma.itemRFQ.findUnique({ where: { id } });
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    // Future: Persist saves via a SavedRFQ table for durable save functionality
    res.json({ rfqId: id, isSaved: true });
  } catch (error) {
    apiLogger.error('[RFQ Marketplace] Error saving RFQ:', error);
    res.status(500).json({ error: 'Failed to save RFQ' });
  }
});

/**
 * DELETE /rfq-marketplace/:id/save
 * Unsave an RFQ
 */
router.delete('/:id/save', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const sellerId = await getSellerId(req);

    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized - seller ID required' });
    }

    // Future: Persist unsaves via a SavedRFQ table for durable unsave functionality
    res.json({ rfqId: id, isSaved: false });
  } catch (error) {
    apiLogger.error('[RFQ Marketplace] Error unsaving RFQ:', error);
    res.status(500).json({ error: 'Failed to unsave RFQ' });
  }
});

/**
 * POST /rfq-marketplace/:id/quote
 * Submit a quote for an RFQ
 */
router.post('/:id/quote', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const sellerId = await getSellerId(req);

    apiLogger.info('[RFQ Marketplace] Quote submission attempt:', {
      rfqId: id,
      sellerId,
      hasPortalAuth: !!(req as any).portalAuth,
      body: req.body
    });

    if (!sellerId) {
      apiLogger.warn('[RFQ Marketplace] No sellerId found in request');
      return res.status(401).json({ error: 'Unauthorized - seller ID required' });
    }

    const { unitPrice, quantity, currency, leadTimeDays, validityDays, notes } = req.body;

    // Validate required fields
    if (unitPrice == null || quantity == null || leadTimeDays == null) {
      return res.status(400).json({ error: 'Missing required fields: unitPrice, quantity, leadTimeDays' });
    }

    // Verify RFQ exists and is open
    const rfq = await prisma.itemRFQ.findUnique({ where: { id } });
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    if (!rfq.buyerId) {
      apiLogger.error('[RFQ Marketplace] RFQ has no buyerId:', { rfqId: id });
      return res.status(400).json({ error: 'RFQ has no associated buyer' });
    }

    if (!['new', 'viewed', 'under_review'].includes(rfq.status)) {
      return res.status(400).json({ error: 'RFQ is no longer accepting quotes' });
    }

    // Calculate validity date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (validityDays || 30));

    // Generate quote number
    const quoteCount = await prisma.quote.count();
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, '0')}`;

    apiLogger.info('[RFQ Marketplace] Creating quote:', {
      quoteNumber,
      rfqId: id,
      sellerId,
      buyerId: rfq.buyerId,
      unitPrice: parseFloat(unitPrice),
      quantity: parseInt(quantity),
    });

    // Create a proper Quote record
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        rfqId: id,
        sellerId,
        buyerId: rfq.buyerId,
        unitPrice: parseFloat(unitPrice),
        quantity: parseInt(quantity),
        totalPrice: parseFloat(unitPrice) * parseInt(quantity),
        currency: currency || 'SAR',
        deliveryDays: parseInt(leadTimeDays),
        validUntil,
        notes: notes || null,
        status: 'sent',
        sentAt: new Date(),
      },
    });

    apiLogger.info('[RFQ Marketplace] Quote created successfully:', { quoteId: quote.id });

    // Update RFQ status to quoted
    await prisma.itemRFQ.update({
      where: { id },
      data: {
        status: 'quoted',
        quotedPrice: parseFloat(unitPrice),
        respondedAt: new Date(),
      },
    });

    // Create RFQ event
    await prisma.itemRFQEvent.create({
      data: {
        rfqId: id,
        actorId: sellerId,
        actorType: 'seller',
        eventType: 'QUOTE_SUBMITTED',
        fromStatus: rfq.status,
        toStatus: 'quoted',
        metadata: JSON.stringify({ quoteId: quote.id, unitPrice, quantity, leadTimeDays }),
      },
    });

    res.json({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      rfqId: id,
      unitPrice: quote.unitPrice,
      quantity: quote.quantity,
      totalPrice: quote.totalPrice,
      currency: quote.currency,
      leadTimeDays: quote.deliveryDays,
      validUntil: quote.validUntil?.toISOString(),
      notes: quote.notes,
      status: 'sent',
      submittedAt: quote.sentAt?.toISOString(),
    });
  } catch (error: any) {
    apiLogger.error('[RFQ Marketplace] Error submitting quote:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: 'Failed to submit quote', details: error.message });
  }
});

export default router;
