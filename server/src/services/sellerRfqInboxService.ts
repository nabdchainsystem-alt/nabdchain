// =============================================================================
// Seller RFQ Inbox Service - Stage 2
// =============================================================================
// Handles RFQ inbox viewing, status transitions, and event logging
// This service is strictly for Stage 2 operations (no quotation/negotiation)

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export type Stage2RFQStatus = 'new' | 'viewed' | 'under_review' | 'ignored';
export type RFQPriorityLevel = 'high' | 'medium' | 'low';
export type RFQEventType =
  | 'RFQ_CREATED'
  | 'RFQ_VIEWED'
  | 'RFQ_UNDER_REVIEW'
  | 'RFQ_IGNORED'
  | 'NOTE_ADDED'
  | 'PRIORITY_CALCULATED';

export interface InboxFilters {
  status?: Stage2RFQStatus | 'all';
  priorityLevel?: RFQPriorityLevel;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'priority';
  // Gmail-style filters
  labelId?: string;
  isRead?: boolean;
  isArchived?: boolean;
  isSnoozed?: boolean;
}

export interface InboxStats {
  new: number;
  viewed: number;
  underReview: number;
  ignored: number;
  total: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

export interface SellerInboxRFQ {
  id: string;
  rfqNumber: string | null;
  item: {
    id: string;
    name: string;
    sku: string;
    image: string | null;
  } | null;
  buyer: {
    company: string;
  };
  quantity: number;
  deliveryLocation: string | null;
  deliveryCity: string | null;
  requiredDeliveryDate: Date | null;
  buyerMessage: string | null;
  status: Stage2RFQStatus;
  priorityLevel: RFQPriorityLevel;
  priorityScore: number;
  createdAt: Date;
  viewedAt: Date | null;
  underReviewAt: Date | null;
  ignoredAt: Date | null;
  internalNotes: string | null;
  ignoredReason: string | null;
  timeSinceReceived: string;
  slaWarning: boolean;
  // Gmail-style fields
  isRead: boolean;
  isArchived: boolean;
  archivedAt: Date | null;
  labels: Array<{ id: string; labelId: string; label: { id: string; name: string; color: string } }>;
  noteCount: number;
  snooze: { snoozedUntil: Date; reason: string | null } | null;
}

// =============================================================================
// Priority Calculation
// =============================================================================

const PRIORITY_WEIGHTS = {
  quantityValue: 0.30,      // 30%
  deliveryUrgency: 0.30,    // 30%
  buyerReliability: 0.25,   // 25%
  productAvailability: 0.15 // 15%
};

const PRIORITY_THRESHOLDS = {
  high: 70,
  medium: 40
};

/**
 * Calculate Stage 2 priority level
 * Factors: quantity size, delivery urgency, buyer reliability, product availability
 */
export function calculatePriorityLevel(params: {
  quantity: number;
  itemPrice: number | null;
  buyerOrderCount: number;
  buyerTotalSpend: number;
  requiredDeliveryDate: Date | null;
  itemStock: number | null;
  itemLeadTime: number | null;
}): { level: RFQPriorityLevel; score: number } {
  let score = 0;

  // 1. Quantity Value (30%)
  const orderValue = params.quantity * (params.itemPrice || 100);
  let quantityScore = 0;
  if (orderValue >= 50000) quantityScore = 100;
  else if (orderValue >= 20000) quantityScore = 80;
  else if (orderValue >= 10000) quantityScore = 60;
  else if (orderValue >= 5000) quantityScore = 40;
  else quantityScore = 20;
  score += quantityScore * PRIORITY_WEIGHTS.quantityValue;

  // 2. Delivery Urgency (30%)
  let urgencyScore = 50; // Default if no date
  if (params.requiredDeliveryDate) {
    const daysUntilDelivery = Math.ceil(
      (params.requiredDeliveryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDelivery <= 3) urgencyScore = 100;
    else if (daysUntilDelivery <= 7) urgencyScore = 80;
    else if (daysUntilDelivery <= 14) urgencyScore = 60;
    else if (daysUntilDelivery <= 30) urgencyScore = 40;
    else urgencyScore = 20;
  }
  score += urgencyScore * PRIORITY_WEIGHTS.deliveryUrgency;

  // 3. Buyer Reliability (25%)
  let buyerScore = 30; // Default for new buyers
  if (params.buyerOrderCount > 0) {
    if (params.buyerOrderCount >= 10 && params.buyerTotalSpend >= 50000) buyerScore = 100;
    else if (params.buyerOrderCount >= 5 || params.buyerTotalSpend >= 20000) buyerScore = 75;
    else if (params.buyerOrderCount >= 2) buyerScore = 50;
    else buyerScore = 40;
  }
  score += buyerScore * PRIORITY_WEIGHTS.buyerReliability;

  // 4. Product Availability (15%)
  let availabilityScore = 50; // Default
  if (params.itemStock !== null) {
    if (params.itemStock > params.quantity) availabilityScore = 100; // In stock
    else if (params.itemStock > 0) availabilityScore = 70; // Partial stock
    else if (params.itemLeadTime && params.itemLeadTime <= 7) availabilityScore = 50; // Can fulfill soon
    else availabilityScore = 30; // Backorder
  }
  score += availabilityScore * PRIORITY_WEIGHTS.productAvailability;

  // Determine level
  const roundedScore = Math.round(score);
  let level: RFQPriorityLevel;
  if (roundedScore >= PRIORITY_THRESHOLDS.high) level = 'high';
  else if (roundedScore >= PRIORITY_THRESHOLDS.medium) level = 'medium';
  else level = 'low';

  return { level, score: roundedScore };
}

// =============================================================================
// Time Helpers
// =============================================================================

/**
 * Format time since received as human-readable string
 */
function formatTimeSinceReceived(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffMins}m`;
}

/**
 * Check if SLA warning should be shown (unread for > 24h)
 */
function shouldShowSLAWarning(status: string, createdAt: Date, viewedAt: Date | null): boolean {
  if (status !== 'new' || viewedAt) return false;
  const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreated >= 24;
}

/**
 * Generate RFQ number in format RFQ-YYYY-XXXX
 */
async function generateRFQNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;

  // Get the highest number for this year
  const lastRFQ = await prisma.itemRFQ.findFirst({
    where: {
      rfqNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      rfqNumber: 'desc'
    },
    select: {
      rfqNumber: true
    }
  });

  let nextNumber = 1;
  if (lastRFQ?.rfqNumber) {
    const lastNumber = parseInt(lastRFQ.rfqNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

// =============================================================================
// Service Functions
// =============================================================================

export const sellerRfqInboxService = {
  /**
   * Get paginated RFQ inbox for seller with filters
   */
  async getInbox(
    sellerId: string,
    filters: InboxFilters = {}
  ): Promise<{
    rfqs: SellerInboxRFQ[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    stats: InboxStats;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ItemRFQWhereInput = {
      sellerId,
    };

    // Status filter (Stage 2 statuses only)
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    } else {
      // Default to Stage 2 statuses
      where.status = { in: ['new', 'viewed', 'under_review', 'ignored'] };
    }

    // Priority filter
    if (filters.priorityLevel) {
      where.priorityLevel = filters.priorityLevel;
    }

    // Product filter
    if (filters.productId) {
      where.itemId = filters.productId;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    // Search filter (RFQ number or buyer - we'll need to join with User for buyer name)
    if (filters.search) {
      where.OR = [
        { rfqNumber: { contains: filters.search, mode: 'insensitive' } },
        { id: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Gmail-style filters
    if (filters.labelId) {
      where.labels = {
        some: { labelId: filters.labelId },
      };
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    // Default to non-archived unless explicitly requested
    if (filters.isArchived !== undefined) {
      where.isArchived = filters.isArchived;
    } else {
      where.isArchived = false;
    }

    // Filter snoozed RFQs
    if (filters.isSnoozed === true) {
      where.snooze = { isNot: null };
    } else if (filters.isSnoozed === false) {
      where.snooze = null;
    }

    // Sort order
    let orderBy: Prisma.ItemRFQOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    if (filters.sortBy === 'priority') orderBy = { priorityScore: 'desc' };

    // Get RFQs with related data including Gmail-style features
    const [rfqs, total] = await Promise.all([
      prisma.itemRFQ.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
              price: true,
              stock: true,
              leadTimeDays: true,
            },
          },
          labels: {
            include: {
              label: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          notes: {
            select: { id: true },
          },
          snooze: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.itemRFQ.count({ where }),
    ]);

    // Get stats for all Stage 2 RFQs
    const [statusCounts, priorityCounts] = await Promise.all([
      prisma.itemRFQ.groupBy({
        by: ['status'],
        where: {
          sellerId,
          status: { in: ['new', 'viewed', 'under_review', 'ignored'] },
        },
        _count: true,
      }),
      prisma.itemRFQ.groupBy({
        by: ['priorityLevel'],
        where: {
          sellerId,
          status: { in: ['new', 'viewed', 'under_review', 'ignored'] },
        },
        _count: true,
      }),
    ]);

    // Build stats object
    const stats: InboxStats = {
      new: 0,
      viewed: 0,
      underReview: 0,
      ignored: 0,
      total: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    };

    statusCounts.forEach(({ status, _count }) => {
      if (status === 'new') stats.new = _count;
      else if (status === 'viewed') stats.viewed = _count;
      else if (status === 'under_review') stats.underReview = _count;
      else if (status === 'ignored') stats.ignored = _count;
      stats.total += _count;
    });

    priorityCounts.forEach(({ priorityLevel, _count }) => {
      if (priorityLevel === 'high') stats.highPriority = _count;
      else if (priorityLevel === 'medium') stats.mediumPriority = _count;
      else if (priorityLevel === 'low') stats.lowPriority = _count;
    });

    // Transform to SellerInboxRFQ format
    const transformedRfqs: SellerInboxRFQ[] = rfqs.map((rfq) => {
      // Parse images if JSON string
      let firstImage: string | null = null;
      if (rfq.item?.images) {
        const images = typeof rfq.item.images === 'string'
          ? JSON.parse(rfq.item.images)
          : rfq.item.images;
        firstImage = Array.isArray(images) ? images[0] : null;
      }

      return {
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        item: rfq.item ? {
          id: rfq.item.id,
          name: rfq.item.name,
          sku: rfq.item.sku,
          image: firstImage,
        } : null,
        buyer: {
          company: 'Company', // TODO: Get from buyer profile when available
        },
        quantity: rfq.quantity,
        deliveryLocation: rfq.deliveryLocation,
        deliveryCity: rfq.deliveryCity,
        requiredDeliveryDate: rfq.requiredDeliveryDate,
        buyerMessage: rfq.message,
        status: rfq.status as Stage2RFQStatus,
        priorityLevel: (rfq.priorityLevel || 'medium') as RFQPriorityLevel,
        priorityScore: rfq.priorityScore || 50,
        createdAt: rfq.createdAt,
        viewedAt: rfq.viewedAt,
        underReviewAt: rfq.underReviewAt,
        ignoredAt: rfq.ignoredAt,
        internalNotes: rfq.internalNotes,
        ignoredReason: rfq.ignoredReason,
        timeSinceReceived: formatTimeSinceReceived(rfq.createdAt),
        slaWarning: shouldShowSLAWarning(rfq.status, rfq.createdAt, rfq.viewedAt),
        // Gmail-style fields
        isRead: rfq.isRead,
        isArchived: rfq.isArchived,
        archivedAt: rfq.archivedAt,
        labels: rfq.labels.map((la) => ({
          id: la.id,
          labelId: la.labelId,
          label: la.label,
        })),
        noteCount: rfq.notes.length,
        snooze: rfq.snooze ? {
          snoozedUntil: rfq.snooze.snoozedUntil,
          reason: rfq.snooze.reason,
        } : null,
      };
    });

    return {
      rfqs: transformedRfqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  },

  /**
   * Get single RFQ detail and auto-mark as VIEWED
   */
  async getRFQDetail(
    sellerId: string,
    rfqId: string
  ): Promise<{
    rfq: SellerInboxRFQ;
    history: Array<{
      id: string;
      eventType: string;
      actorType: string;
      fromStatus: string | null;
      toStatus: string | null;
      metadata: Record<string, unknown> | null;
      createdAt: Date;
    }>;
  }> {
    // Get RFQ
    const rfq = await prisma.itemRFQ.findFirst({
      where: {
        id: rfqId,
        sellerId, // Ensure seller owns this RFQ
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
            price: true,
            stock: true,
            leadTimeDays: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit history
        },
      },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Auto-mark as viewed if status is 'new'
    if (rfq.status === 'new') {
      await this.markAsViewed(sellerId, rfqId);
    }

    // Parse images
    let firstImage: string | null = null;
    if (rfq.item?.images) {
      const images = typeof rfq.item.images === 'string'
        ? JSON.parse(rfq.item.images)
        : rfq.item.images;
      firstImage = Array.isArray(images) ? images[0] : null;
    }

    // Transform RFQ
    const transformedRfq: SellerInboxRFQ = {
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
      item: rfq.item ? {
        id: rfq.item.id,
        name: rfq.item.name,
        sku: rfq.item.sku,
        image: firstImage,
      } : null,
      buyer: {
        company: 'Company', // TODO: Get from buyer profile
      },
      quantity: rfq.quantity,
      deliveryLocation: rfq.deliveryLocation,
      deliveryCity: rfq.deliveryCity,
      requiredDeliveryDate: rfq.requiredDeliveryDate,
      buyerMessage: rfq.message,
      status: rfq.status === 'new' ? 'viewed' : rfq.status as Stage2RFQStatus, // Reflect auto-view
      priorityLevel: (rfq.priorityLevel || 'medium') as RFQPriorityLevel,
      priorityScore: rfq.priorityScore || 50,
      createdAt: rfq.createdAt,
      viewedAt: rfq.viewedAt || new Date(), // Set to now if just viewed
      underReviewAt: rfq.underReviewAt,
      ignoredAt: rfq.ignoredAt,
      internalNotes: rfq.internalNotes,
      ignoredReason: rfq.ignoredReason,
      timeSinceReceived: formatTimeSinceReceived(rfq.createdAt),
      slaWarning: false, // Not a warning once viewed
    };

    // Transform events/history
    const history = rfq.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      actorType: event.actorType,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      metadata: event.metadata ? JSON.parse(event.metadata) : null,
      createdAt: event.createdAt,
    }));

    return { rfq: transformedRfq, history };
  },

  /**
   * Mark RFQ as viewed (internal helper)
   */
  async markAsViewed(sellerId: string, rfqId: string): Promise<void> {
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq || rfq.status !== 'new') return;

    await prisma.$transaction([
      prisma.itemRFQ.update({
        where: { id: rfqId },
        data: {
          status: 'viewed',
          viewedAt: new Date(),
          viewedBy: sellerId,
        },
      }),
      prisma.itemRFQEvent.create({
        data: {
          rfqId,
          actorId: sellerId,
          actorType: 'seller',
          eventType: 'RFQ_VIEWED',
          fromStatus: 'new',
          toStatus: 'viewed',
        },
      }),
    ]);
  },

  /**
   * Update RFQ status (UNDER_REVIEW or IGNORED)
   */
  async updateStatus(
    sellerId: string,
    rfqId: string,
    newStatus: 'under_review' | 'ignored',
    options?: { reason?: string }
  ): Promise<SellerInboxRFQ> {
    // Validate RFQ exists and belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Validate status transition
    const validFromStatuses = ['new', 'viewed'];
    if (!validFromStatuses.includes(rfq.status)) {
      throw new Error(`Cannot change status from '${rfq.status}' to '${newStatus}'`);
    }

    // Require reason for ignored status
    if (newStatus === 'ignored' && !options?.reason) {
      throw new Error('Reason is required when marking RFQ as ignored');
    }

    // Update in transaction
    const updateData: Prisma.ItemRFQUpdateInput = {
      status: newStatus,
    };

    if (newStatus === 'under_review') {
      updateData.underReviewAt = new Date();
      updateData.underReviewBy = sellerId;
    } else if (newStatus === 'ignored') {
      updateData.ignoredAt = new Date();
      updateData.ignoredBy = sellerId;
      updateData.ignoredReason = options?.reason;
    }

    const [updatedRfq] = await prisma.$transaction([
      prisma.itemRFQ.update({
        where: { id: rfqId },
        data: updateData,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
            },
          },
        },
      }),
      prisma.itemRFQEvent.create({
        data: {
          rfqId,
          actorId: sellerId,
          actorType: 'seller',
          eventType: newStatus === 'under_review' ? 'RFQ_UNDER_REVIEW' : 'RFQ_IGNORED',
          fromStatus: rfq.status,
          toStatus: newStatus,
          metadata: options?.reason ? JSON.stringify({ reason: options.reason }) : null,
        },
      }),
    ]);

    // Transform and return
    let firstImage: string | null = null;
    if (updatedRfq.item?.images) {
      const images = typeof updatedRfq.item.images === 'string'
        ? JSON.parse(updatedRfq.item.images)
        : updatedRfq.item.images;
      firstImage = Array.isArray(images) ? images[0] : null;
    }

    return {
      id: updatedRfq.id,
      rfqNumber: updatedRfq.rfqNumber,
      item: updatedRfq.item ? {
        id: updatedRfq.item.id,
        name: updatedRfq.item.name,
        sku: updatedRfq.item.sku,
        image: firstImage,
      } : null,
      buyer: { company: 'Company' },
      quantity: updatedRfq.quantity,
      deliveryLocation: updatedRfq.deliveryLocation,
      deliveryCity: updatedRfq.deliveryCity,
      requiredDeliveryDate: updatedRfq.requiredDeliveryDate,
      buyerMessage: updatedRfq.message,
      status: updatedRfq.status as Stage2RFQStatus,
      priorityLevel: (updatedRfq.priorityLevel || 'medium') as RFQPriorityLevel,
      priorityScore: updatedRfq.priorityScore || 50,
      createdAt: updatedRfq.createdAt,
      viewedAt: updatedRfq.viewedAt,
      underReviewAt: updatedRfq.underReviewAt,
      ignoredAt: updatedRfq.ignoredAt,
      internalNotes: updatedRfq.internalNotes,
      ignoredReason: updatedRfq.ignoredReason,
      timeSinceReceived: formatTimeSinceReceived(updatedRfq.createdAt),
      slaWarning: false,
    };
  },

  /**
   * Add internal note to RFQ
   */
  async addInternalNote(
    sellerId: string,
    rfqId: string,
    notes: string
  ): Promise<SellerInboxRFQ> {
    // Validate RFQ exists and belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Update notes
    const [updatedRfq] = await prisma.$transaction([
      prisma.itemRFQ.update({
        where: { id: rfqId },
        data: { internalNotes: notes },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
            },
          },
        },
      }),
      prisma.itemRFQEvent.create({
        data: {
          rfqId,
          actorId: sellerId,
          actorType: 'seller',
          eventType: 'NOTE_ADDED',
          metadata: JSON.stringify({ notesLength: notes.length }),
        },
      }),
    ]);

    // Transform and return (simplified)
    let firstImage: string | null = null;
    if (updatedRfq.item?.images) {
      const images = typeof updatedRfq.item.images === 'string'
        ? JSON.parse(updatedRfq.item.images)
        : updatedRfq.item.images;
      firstImage = Array.isArray(images) ? images[0] : null;
    }

    return {
      id: updatedRfq.id,
      rfqNumber: updatedRfq.rfqNumber,
      item: updatedRfq.item ? {
        id: updatedRfq.item.id,
        name: updatedRfq.item.name,
        sku: updatedRfq.item.sku,
        image: firstImage,
      } : null,
      buyer: { company: 'Company' },
      quantity: updatedRfq.quantity,
      deliveryLocation: updatedRfq.deliveryLocation,
      deliveryCity: updatedRfq.deliveryCity,
      requiredDeliveryDate: updatedRfq.requiredDeliveryDate,
      buyerMessage: updatedRfq.message,
      status: updatedRfq.status as Stage2RFQStatus,
      priorityLevel: (updatedRfq.priorityLevel || 'medium') as RFQPriorityLevel,
      priorityScore: updatedRfq.priorityScore || 50,
      createdAt: updatedRfq.createdAt,
      viewedAt: updatedRfq.viewedAt,
      underReviewAt: updatedRfq.underReviewAt,
      ignoredAt: updatedRfq.ignoredAt,
      internalNotes: updatedRfq.internalNotes,
      ignoredReason: updatedRfq.ignoredReason,
      timeSinceReceived: formatTimeSinceReceived(updatedRfq.createdAt),
      slaWarning: false,
    };
  },

  /**
   * Get RFQ event history
   */
  async getHistory(
    sellerId: string,
    rfqId: string
  ): Promise<Array<{
    id: string;
    eventType: string;
    actorType: string;
    fromStatus: string | null;
    toStatus: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
  }>> {
    // Validate RFQ belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    const events = await prisma.itemRFQEvent.findMany({
      where: { rfqId },
      orderBy: { createdAt: 'desc' },
    });

    return events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      actorType: event.actorType,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      metadata: event.metadata ? JSON.parse(event.metadata) : null,
      createdAt: event.createdAt,
    }));
  },

  /**
   * Calculate and update priority for an RFQ
   * Called on RFQ creation and can be called for recalculation
   */
  async calculateAndUpdatePriority(rfqId: string): Promise<void> {
    const rfq = await prisma.itemRFQ.findUnique({
      where: { id: rfqId },
      include: {
        item: {
          select: {
            price: true,
            stock: true,
            leadTimeDays: true,
          },
        },
      },
    });

    if (!rfq) return;

    // Get buyer stats (simplified - in production, would query order history)
    const buyerOrderCount = 0; // TODO: Query from orders table
    const buyerTotalSpend = 0; // TODO: Query from orders table

    const { level, score } = calculatePriorityLevel({
      quantity: rfq.quantity,
      itemPrice: rfq.item?.price || null,
      buyerOrderCount,
      buyerTotalSpend,
      requiredDeliveryDate: rfq.requiredDeliveryDate,
      itemStock: rfq.item?.stock || null,
      itemLeadTime: rfq.item?.leadTimeDays || null,
    });

    await prisma.itemRFQ.update({
      where: { id: rfqId },
      data: {
        priorityLevel: level,
        priorityScore: score,
      },
    });
  },

  /**
   * Generate RFQ number for new RFQs
   */
  generateRFQNumber,

  // =============================================================================
  // GMAIL-STYLE FEATURES - Labels
  // =============================================================================

  /**
   * Get all labels for a seller (creates system labels on first access)
   */
  async getLabels(sellerId: string): Promise<Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    isSystem: boolean;
    position: number;
  }>> {
    // Check if seller has any labels
    const existingLabels = await prisma.rFQLabel.findMany({
      where: { sellerId },
      orderBy: { position: 'asc' },
    });

    // Initialize system labels on first access
    if (existingLabels.length === 0) {
      await this.initializeSystemLabels(sellerId);
      return prisma.rFQLabel.findMany({
        where: { sellerId },
        orderBy: { position: 'asc' },
      });
    }

    return existingLabels;
  },

  /**
   * Initialize default system labels for a seller
   */
  async initializeSystemLabels(sellerId: string): Promise<void> {
    const systemLabels = [
      { name: 'New', color: '#3b82f6', position: 0 },
      { name: 'Pending', color: '#f59e0b', position: 1 },
      { name: 'Negotiation', color: '#8b5cf6', position: 2 },
      { name: 'Expiring', color: '#ef4444', position: 3 },
      { name: 'Won', color: '#22c55e', position: 4 },
      { name: 'Lost', color: '#6b7280', position: 5 },
    ];

    await prisma.rFQLabel.createMany({
      data: systemLabels.map((label) => ({
        sellerId,
        name: label.name,
        color: label.color,
        position: label.position,
        isSystem: true,
      })),
      skipDuplicates: true,
    });
  },

  /**
   * Create a custom label
   */
  async createLabel(
    sellerId: string,
    data: { name: string; color: string; icon?: string }
  ): Promise<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    isSystem: boolean;
    position: number;
  }> {
    // Get max position
    const maxPosition = await prisma.rFQLabel.aggregate({
      where: { sellerId },
      _max: { position: true },
    });

    return prisma.rFQLabel.create({
      data: {
        sellerId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        position: (maxPosition._max.position || 0) + 1,
        isSystem: false,
      },
    });
  },

  /**
   * Update a label (only non-system labels can have name changed)
   */
  async updateLabel(
    sellerId: string,
    labelId: string,
    data: { name?: string; color?: string; icon?: string }
  ): Promise<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    isSystem: boolean;
    position: number;
  }> {
    const label = await prisma.rFQLabel.findFirst({
      where: { id: labelId, sellerId },
    });

    if (!label) {
      throw new Error('Label not found');
    }

    // System labels can only change color/icon, not name
    const updateData: Prisma.RFQLabelUpdateInput = {};
    if (data.color) updateData.color = data.color;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.name && !label.isSystem) updateData.name = data.name;

    return prisma.rFQLabel.update({
      where: { id: labelId },
      data: updateData,
    });
  },

  /**
   * Delete a label (only non-system labels)
   */
  async deleteLabel(sellerId: string, labelId: string): Promise<void> {
    const label = await prisma.rFQLabel.findFirst({
      where: { id: labelId, sellerId },
    });

    if (!label) {
      throw new Error('Label not found');
    }

    if (label.isSystem) {
      throw new Error('Cannot delete system labels');
    }

    await prisma.rFQLabel.delete({
      where: { id: labelId },
    });
  },

  // =============================================================================
  // GMAIL-STYLE FEATURES - Label Assignments
  // =============================================================================

  /**
   * Add a label to an RFQ
   */
  async addLabelToRFQ(
    sellerId: string,
    rfqId: string,
    labelId: string
  ): Promise<void> {
    // Verify RFQ belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Verify label belongs to seller
    const label = await prisma.rFQLabel.findFirst({
      where: { id: labelId, sellerId },
    });

    if (!label) {
      throw new Error('Label not found');
    }

    await prisma.rFQLabelAssignment.create({
      data: { rfqId, labelId },
    });
  },

  /**
   * Remove a label from an RFQ
   */
  async removeLabelFromRFQ(
    sellerId: string,
    rfqId: string,
    labelId: string
  ): Promise<void> {
    // Verify RFQ belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    await prisma.rFQLabelAssignment.deleteMany({
      where: { rfqId, labelId },
    });
  },

  /**
   * Bulk add label to multiple RFQs
   */
  async bulkAddLabel(
    sellerId: string,
    rfqIds: string[],
    labelId: string
  ): Promise<{ updated: number }> {
    // Verify label belongs to seller
    const label = await prisma.rFQLabel.findFirst({
      where: { id: labelId, sellerId },
    });

    if (!label) {
      throw new Error('Label not found');
    }

    // Verify all RFQs belong to seller
    const rfqs = await prisma.itemRFQ.findMany({
      where: { id: { in: rfqIds }, sellerId },
      select: { id: true },
    });

    const validRfqIds = rfqs.map((r) => r.id);

    await prisma.rFQLabelAssignment.createMany({
      data: validRfqIds.map((rfqId) => ({ rfqId, labelId })),
      skipDuplicates: true,
    });

    return { updated: validRfqIds.length };
  },

  /**
   * Bulk remove label from multiple RFQs
   */
  async bulkRemoveLabel(
    sellerId: string,
    rfqIds: string[],
    labelId: string
  ): Promise<{ updated: number }> {
    // Verify all RFQs belong to seller
    const rfqs = await prisma.itemRFQ.findMany({
      where: { id: { in: rfqIds }, sellerId },
      select: { id: true },
    });

    const validRfqIds = rfqs.map((r) => r.id);

    const result = await prisma.rFQLabelAssignment.deleteMany({
      where: {
        rfqId: { in: validRfqIds },
        labelId,
      },
    });

    return { updated: result.count };
  },

  // =============================================================================
  // GMAIL-STYLE FEATURES - Threaded Notes
  // =============================================================================

  /**
   * Get all notes for an RFQ (threaded structure)
   */
  async getNotes(
    sellerId: string,
    rfqId: string
  ): Promise<Array<{
    id: string;
    content: string;
    parentId: string | null;
    sellerId: string;
    createdAt: Date;
    updatedAt: Date;
    replies?: Array<{
      id: string;
      content: string;
      sellerId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }>> {
    // Verify RFQ belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Get root-level notes with their replies
    const notes = await prisma.rFQNote.findMany({
      where: { rfqId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return notes;
  },

  /**
   * Add a new note to an RFQ
   */
  async addNote(
    sellerId: string,
    rfqId: string,
    content: string,
    parentId?: string
  ): Promise<{
    id: string;
    content: string;
    parentId: string | null;
    sellerId: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Verify RFQ belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // If parentId provided, verify it exists
    if (parentId) {
      const parentNote = await prisma.rFQNote.findFirst({
        where: { id: parentId, rfqId },
      });

      if (!parentNote) {
        throw new Error('Parent note not found');
      }
    }

    const [note] = await prisma.$transaction([
      prisma.rFQNote.create({
        data: {
          rfqId,
          sellerId,
          content,
          parentId: parentId || null,
        },
      }),
      prisma.itemRFQEvent.create({
        data: {
          rfqId,
          actorId: sellerId,
          actorType: 'seller',
          eventType: 'NOTE_ADDED',
          metadata: JSON.stringify({ noteContentLength: content.length, isReply: !!parentId }),
        },
      }),
    ]);

    return note;
  },

  /**
   * Update a note (only owner can update)
   */
  async updateNote(
    sellerId: string,
    noteId: string,
    content: string
  ): Promise<{
    id: string;
    content: string;
    parentId: string | null;
    sellerId: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const note = await prisma.rFQNote.findFirst({
      where: { id: noteId, sellerId },
    });

    if (!note) {
      throw new Error('Note not found or not authorized');
    }

    return prisma.rFQNote.update({
      where: { id: noteId },
      data: { content },
    });
  },

  /**
   * Delete a note (only owner can delete)
   */
  async deleteNote(sellerId: string, noteId: string): Promise<void> {
    const note = await prisma.rFQNote.findFirst({
      where: { id: noteId, sellerId },
    });

    if (!note) {
      throw new Error('Note not found or not authorized');
    }

    await prisma.rFQNote.delete({
      where: { id: noteId },
    });
  },

  // =============================================================================
  // GMAIL-STYLE FEATURES - Saved Replies
  // =============================================================================

  /**
   * Get all saved replies for a seller
   */
  async getSavedReplies(
    sellerId: string,
    category?: string
  ): Promise<Array<{
    id: string;
    name: string;
    content: string;
    category: string | null;
    shortcut: string | null;
    useCount: number;
    createdAt: Date;
  }>> {
    const where: Prisma.SavedReplyWhereInput = { sellerId };
    if (category) {
      where.category = category;
    }

    return prisma.savedReply.findMany({
      where,
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
    });
  },

  /**
   * Create a saved reply
   */
  async createSavedReply(
    sellerId: string,
    data: { name: string; content: string; category?: string; shortcut?: string }
  ): Promise<{
    id: string;
    name: string;
    content: string;
    category: string | null;
    shortcut: string | null;
    useCount: number;
    createdAt: Date;
  }> {
    return prisma.savedReply.create({
      data: {
        sellerId,
        name: data.name,
        content: data.content,
        category: data.category,
        shortcut: data.shortcut,
      },
    });
  },

  /**
   * Update a saved reply
   */
  async updateSavedReply(
    sellerId: string,
    replyId: string,
    data: { name?: string; content?: string; category?: string; shortcut?: string }
  ): Promise<{
    id: string;
    name: string;
    content: string;
    category: string | null;
    shortcut: string | null;
    useCount: number;
    createdAt: Date;
  }> {
    const reply = await prisma.savedReply.findFirst({
      where: { id: replyId, sellerId },
    });

    if (!reply) {
      throw new Error('Saved reply not found');
    }

    return prisma.savedReply.update({
      where: { id: replyId },
      data,
    });
  },

  /**
   * Delete a saved reply
   */
  async deleteSavedReply(sellerId: string, replyId: string): Promise<void> {
    const reply = await prisma.savedReply.findFirst({
      where: { id: replyId, sellerId },
    });

    if (!reply) {
      throw new Error('Saved reply not found');
    }

    await prisma.savedReply.delete({
      where: { id: replyId },
    });
  },

  /**
   * Expand a saved reply with RFQ data (replace placeholders)
   */
  async expandTemplate(
    sellerId: string,
    replyId: string,
    rfqId: string
  ): Promise<string> {
    const [reply, rfq] = await Promise.all([
      prisma.savedReply.findFirst({
        where: { id: replyId, sellerId },
      }),
      prisma.itemRFQ.findFirst({
        where: { id: rfqId, sellerId },
        include: {
          item: { select: { name: true } },
        },
      }),
    ]);

    if (!reply) {
      throw new Error('Saved reply not found');
    }

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Increment usage
    await prisma.savedReply.update({
      where: { id: replyId },
      data: { useCount: { increment: 1 } },
    });

    // Replace placeholders
    let expanded = reply.content;
    expanded = expanded.replace(/\{\{rfq_number\}\}/g, rfq.rfqNumber || rfq.id);
    expanded = expanded.replace(/\{\{item_name\}\}/g, rfq.item?.name || 'N/A');
    expanded = expanded.replace(/\{\{quantity\}\}/g, String(rfq.quantity));
    expanded = expanded.replace(/\{\{delivery_date\}\}/g,
      rfq.requiredDeliveryDate ? rfq.requiredDeliveryDate.toLocaleDateString() : 'N/A');
    expanded = expanded.replace(/\{\{buyer_name\}\}/g, 'Buyer'); // TODO: Get from buyer profile
    expanded = expanded.replace(/\{\{company_name\}\}/g, 'Company'); // TODO: Get from buyer profile

    return expanded;
  },

  // =============================================================================
  // GMAIL-STYLE FEATURES - Snooze
  // =============================================================================

  /**
   * Snooze an RFQ until a specified time
   */
  async snoozeRFQ(
    sellerId: string,
    rfqId: string,
    snoozedUntil: Date,
    reason?: string
  ): Promise<void> {
    // Verify RFQ belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    // Upsert snooze record
    await prisma.rFQSnooze.upsert({
      where: { rfqId },
      create: {
        rfqId,
        sellerId,
        snoozedUntil,
        reason,
      },
      update: {
        snoozedUntil,
        reason,
      },
    });
  },

  /**
   * Unsnooze an RFQ
   */
  async unsnoozeRFQ(sellerId: string, rfqId: string): Promise<void> {
    // Verify RFQ belongs to seller
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    await prisma.rFQSnooze.deleteMany({
      where: { rfqId },
    });
  },

  /**
   * Bulk snooze multiple RFQs
   */
  async bulkSnooze(
    sellerId: string,
    rfqIds: string[],
    snoozedUntil: Date,
    reason?: string
  ): Promise<{ snoozed: number }> {
    // Verify all RFQs belong to seller
    const rfqs = await prisma.itemRFQ.findMany({
      where: { id: { in: rfqIds }, sellerId },
      select: { id: true },
    });

    const validRfqIds = rfqs.map((r) => r.id);

    // Delete existing snoozes and create new ones
    await prisma.$transaction([
      prisma.rFQSnooze.deleteMany({
        where: { rfqId: { in: validRfqIds } },
      }),
      prisma.rFQSnooze.createMany({
        data: validRfqIds.map((rfqId) => ({
          rfqId,
          sellerId,
          snoozedUntil,
          reason,
        })),
      }),
    ]);

    return { snoozed: validRfqIds.length };
  },

  /**
   * Get all snoozed RFQs for a seller
   */
  async getSnoozedRFQs(
    sellerId: string
  ): Promise<Array<{
    rfqId: string;
    snoozedUntil: Date;
    reason: string | null;
  }>> {
    return prisma.rFQSnooze.findMany({
      where: { sellerId },
      orderBy: { snoozedUntil: 'asc' },
    });
  },

  /**
   * Process expired snoozes (to be called by background job)
   */
  async processExpiredSnoozes(): Promise<{ processed: number }> {
    const now = new Date();
    const result = await prisma.rFQSnooze.deleteMany({
      where: {
        snoozedUntil: { lte: now },
      },
    });

    return { processed: result.count };
  },

  // =============================================================================
  // GMAIL-STYLE FEATURES - Read/Archive
  // =============================================================================

  /**
   * Mark an RFQ as read
   */
  async markRead(sellerId: string, rfqId: string): Promise<void> {
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    await prisma.itemRFQ.update({
      where: { id: rfqId },
      data: { isRead: true },
    });
  },

  /**
   * Mark an RFQ as unread
   */
  async markUnread(sellerId: string, rfqId: string): Promise<void> {
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    await prisma.itemRFQ.update({
      where: { id: rfqId },
      data: { isRead: false },
    });
  },

  /**
   * Bulk mark RFQs as read
   */
  async bulkMarkRead(
    sellerId: string,
    rfqIds: string[]
  ): Promise<{ updated: number }> {
    const result = await prisma.itemRFQ.updateMany({
      where: { id: { in: rfqIds }, sellerId },
      data: { isRead: true },
    });

    return { updated: result.count };
  },

  /**
   * Bulk mark RFQs as unread
   */
  async bulkMarkUnread(
    sellerId: string,
    rfqIds: string[]
  ): Promise<{ updated: number }> {
    const result = await prisma.itemRFQ.updateMany({
      where: { id: { in: rfqIds }, sellerId },
      data: { isRead: false },
    });

    return { updated: result.count };
  },

  /**
   * Archive an RFQ
   */
  async archiveRFQ(sellerId: string, rfqId: string): Promise<void> {
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    await prisma.itemRFQ.update({
      where: { id: rfqId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
  },

  /**
   * Unarchive an RFQ
   */
  async unarchiveRFQ(sellerId: string, rfqId: string): Promise<void> {
    const rfq = await prisma.itemRFQ.findFirst({
      where: { id: rfqId, sellerId },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    await prisma.itemRFQ.update({
      where: { id: rfqId },
      data: {
        isArchived: false,
        archivedAt: null,
      },
    });
  },

  /**
   * Bulk archive RFQs
   */
  async bulkArchive(
    sellerId: string,
    rfqIds: string[]
  ): Promise<{ updated: number }> {
    const result = await prisma.itemRFQ.updateMany({
      where: { id: { in: rfqIds }, sellerId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    return { updated: result.count };
  },

  /**
   * Bulk unarchive RFQs
   */
  async bulkUnarchive(
    sellerId: string,
    rfqIds: string[]
  ): Promise<{ updated: number }> {
    const result = await prisma.itemRFQ.updateMany({
      where: { id: { in: rfqIds }, sellerId },
      data: {
        isArchived: false,
        archivedAt: null,
      },
    });

    return { updated: result.count };
  },
};

export default sellerRfqInboxService;
