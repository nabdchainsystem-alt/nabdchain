// =============================================================================
// Dispute Service (Stage 7)
// =============================================================================
// Dispute is a case-based workflow for buyer complaints.
// Lifecycle: OPEN -> UNDER_REVIEW -> SELLER_RESPONDED -> RESOLVED | REJECTED | ESCALATED -> CLOSED
// Platform remains neutral; resolution requires mutual agreement or escalation.
// =============================================================================

import { prisma } from '../lib/prisma';
import type { MarketplaceDispute, Prisma } from '@prisma/client';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type DisputeStatus = 'open' | 'under_review' | 'seller_responded' | 'resolved' | 'rejected' | 'escalated' | 'closed';
export type DisputeReason = 'wrong_item' | 'damaged_goods' | 'missing_quantity' | 'late_delivery' | 'quality_issue' | 'other';
export type SellerResponseType = 'accept_responsibility' | 'reject' | 'propose_resolution';
export type Resolution = 'full_refund' | 'partial_refund' | 'replacement' | 'no_action' | 'other';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface DisputeEvidence {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface DisputeFilters {
  status?: DisputeStatus;
  reason?: DisputeReason;
  priority?: PriorityLevel;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DisputeStats {
  total: number;
  open: number;
  underReview: number;
  sellerResponded: number;
  resolved: number;
  rejected: number;
  escalated: number;
  closed: number;
  avgResolutionDays: number;
  resolutionRate: number;
}

export interface CreateDisputeInput {
  orderId: string;
  buyerId: string;
  reason: DisputeReason;
  description: string;
  requestedResolution?: string;
  requestedAmount?: number;
  evidence?: DisputeEvidence[];
}

export interface SellerRespondInput {
  disputeId: string;
  sellerId: string;
  responseType: SellerResponseType;
  response: string;
  proposedResolution?: string;
  proposedAmount?: number;
}

export interface ResolveDisputeInput {
  disputeId: string;
  actorId: string;
  actorType: 'buyer' | 'seller' | 'platform';
  resolution: Resolution;
  resolutionAmount?: number;
  resolutionNotes?: string;
  createReturn?: boolean;
  returnType?: 'full_return' | 'partial_return' | 'replacement_only';
}

// =============================================================================
// State Machine
// =============================================================================

const VALID_DISPUTE_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  open: ['under_review', 'closed'],
  under_review: ['seller_responded', 'escalated'],
  seller_responded: ['resolved', 'rejected', 'escalated'],
  resolved: ['closed'],
  rejected: ['escalated', 'closed'],
  escalated: ['resolved', 'closed'],
  closed: [],
};

function isValidTransition(from: DisputeStatus, to: DisputeStatus): boolean {
  return VALID_DISPUTE_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate sequential dispute number
 * Format: DSP-YYYY-0001
 */
async function generateDisputeNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DSP-${year}-`;

  const lastDispute = await prisma.marketplaceDispute.findFirst({
    where: {
      disputeNumber: { startsWith: prefix },
    },
    orderBy: { disputeNumber: 'desc' },
    select: { disputeNumber: true },
  });

  let nextNumber = 1;
  if (lastDispute) {
    const lastNumber = parseInt(lastDispute.disputeNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Log dispute event
 */
async function logDisputeEvent(
  disputeId: string,
  eventType: string,
  actorId: string | null,
  actorType: 'buyer' | 'seller' | 'system' | 'platform',
  fromStatus?: string,
  toStatus?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.marketplaceDisputeEvent.create({
    data: {
      disputeId,
      eventType,
      actorId,
      actorType,
      fromStatus,
      toStatus,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Calculate priority based on order value and issue severity
 */
function calculatePriority(totalPrice: number, reason: DisputeReason): PriorityLevel {
  // High value orders get higher priority
  if (totalPrice > 10000) return 'urgent';
  if (totalPrice > 5000) return 'high';

  // Quality issues and damaged goods are medium priority
  if (reason === 'damaged_goods' || reason === 'quality_issue') return 'medium';

  return 'medium';
}

/**
 * Calculate response deadline (48 hours from creation)
 */
function calculateResponseDeadline(): Date {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);
  return deadline;
}

/**
 * Calculate resolution deadline (7 days from creation)
 */
function calculateResolutionDeadline(): Date {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  return deadline;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Create a new dispute
 * Only buyers can create disputes on delivered orders
 */
async function createDispute(input: CreateDisputeInput): Promise<{ success: boolean; dispute?: MarketplaceDispute; error?: string }> {
  try {
    // Validate order exists and is delivered
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.buyerId !== input.buyerId) {
      return { success: false, error: 'You can only open disputes on your own orders' };
    }

    if (order.status !== 'delivered' && order.status !== 'closed') {
      return { success: false, error: 'Disputes can only be opened on delivered orders' };
    }

    // Look up invoice separately (no relation on MarketplaceOrder)
    const invoice = await prisma.marketplaceInvoice.findUnique({
      where: { orderId: input.orderId },
      select: { id: true, invoiceNumber: true, sellerName: true, sellerCompany: true },
    });

    // Check if dispute already exists for this order
    const existingDispute = await prisma.marketplaceDispute.findFirst({
      where: {
        orderId: input.orderId,
        status: { notIn: ['closed', 'resolved', 'rejected'] },
      },
    });

    if (existingDispute) {
      return { success: false, error: 'An active dispute already exists for this order' };
    }

    // Check dispute window (14 days after delivery)
    const deliveredAt = order.deliveredAt;
    if (deliveredAt) {
      const disputeWindow = new Date(deliveredAt);
      disputeWindow.setDate(disputeWindow.getDate() + 14);
      if (new Date() > disputeWindow) {
        return { success: false, error: 'Dispute window has expired (14 days after delivery)' };
      }
    }

    // Generate dispute number
    const disputeNumber = await generateDisputeNumber();
    const priority = calculatePriority(order.totalPrice, input.reason);

    // Create dispute
    const dispute = await prisma.marketplaceDispute.create({
      data: {
        disputeNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoiceNumber,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        buyerName: order.buyerName || '',
        buyerEmail: order.buyerEmail,
        buyerCompany: order.buyerCompany,
        sellerName: invoice?.sellerName || '',
        sellerCompany: invoice?.sellerCompany,
        itemId: order.itemId,
        itemName: order.itemName,
        itemSku: order.itemSku,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        totalPrice: order.totalPrice,
        currency: order.currency,
        reason: input.reason,
        description: input.description,
        requestedResolution: input.requestedResolution,
        requestedAmount: input.requestedAmount,
        evidence: input.evidence ? JSON.stringify(input.evidence) : null,
        status: 'open',
        priorityLevel: priority,
        responseDeadline: calculateResponseDeadline(),
        resolutionDeadline: calculateResolutionDeadline(),
      },
    });

    // Log event
    await logDisputeEvent(
      dispute.id,
      'DISPUTE_CREATED',
      input.buyerId,
      'buyer',
      undefined,
      'open',
      {
        reason: input.reason,
        requestedResolution: input.requestedResolution,
        requestedAmount: input.requestedAmount,
      }
    );

    // Update order to mark it has a dispute
    await prisma.marketplaceOrder.update({
      where: { id: order.id },
      data: {
        hasException: true,
        exceptionType: 'dispute_filed',
      },
    });

    return { success: true, dispute };
  } catch (error) {
    apiLogger.error('Error creating dispute:', error);
    return { success: false, error: 'Failed to create dispute' };
  }
}

/**
 * Get a single dispute with authorization check
 */
async function getDispute(disputeId: string, userId: string): Promise<any | null> {
  const dispute = await prisma.marketplaceDispute.findUnique({
    where: { id: disputeId },
    include: {
      returnRequest: true,
      events: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!dispute) return null;

  // Check authorization
  if (dispute.buyerId !== userId && dispute.sellerId !== userId) {
    return null;
  }

  // Parse JSON fields
  return {
    ...dispute,
    evidence: dispute.evidence ? JSON.parse(dispute.evidence) : [],
    events: dispute.events.map((e) => ({
      ...e,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    })),
  };
}

/**
 * Get disputes for a buyer with filters and pagination
 */
async function getBuyerDisputes(
  buyerId: string,
  filters: DisputeFilters = {}
): Promise<{ disputes: MarketplaceDispute[]; total: number; page: number; limit: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { buyerId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.reason) {
    where.reason = filters.reason;
  }

  if (filters.priority) {
    where.priorityLevel = filters.priority;
  }

  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }

  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  if (filters.search) {
    where.OR = [
      { disputeNumber: { contains: filters.search, mode: 'insensitive' } },
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { itemName: { contains: filters.search, mode: 'insensitive' } },
      { sellerName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [disputes, total] = await Promise.all([
    prisma.marketplaceDispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        returnRequest: {
          select: { id: true, returnNumber: true, status: true },
        },
      },
    }),
    prisma.marketplaceDispute.count({ where }),
  ]);

  return {
    disputes: disputes.map((d) => ({
      ...d,
      evidence: d.evidence ? JSON.parse(d.evidence) : [],
    })),
    total,
    page,
    limit,
  };
}

/**
 * Get disputes for a seller with filters and pagination
 */
async function getSellerDisputes(
  sellerId: string,
  filters: DisputeFilters = {}
): Promise<{ disputes: MarketplaceDispute[]; total: number; page: number; limit: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { sellerId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.reason) {
    where.reason = filters.reason;
  }

  if (filters.priority) {
    where.priorityLevel = filters.priority;
  }

  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }

  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  if (filters.search) {
    where.OR = [
      { disputeNumber: { contains: filters.search, mode: 'insensitive' } },
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { itemName: { contains: filters.search, mode: 'insensitive' } },
      { buyerName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [disputes, total] = await Promise.all([
    prisma.marketplaceDispute.findMany({
      where,
      orderBy: [
        { priorityLevel: 'desc' },
        { responseDeadline: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
      include: {
        returnRequest: {
          select: { id: true, returnNumber: true, status: true },
        },
      },
    }),
    prisma.marketplaceDispute.count({ where }),
  ]);

  return {
    disputes: disputes.map((d) => ({
      ...d,
      evidence: d.evidence ? JSON.parse(d.evidence) : [],
    })),
    total,
    page,
    limit,
  };
}

/**
 * Get dispute statistics for buyer
 */
async function getBuyerDisputeStats(buyerId: string): Promise<DisputeStats> {
  const disputes = await prisma.marketplaceDispute.groupBy({
    by: ['status'],
    where: { buyerId },
    _count: true,
  });

  const statusCounts = disputes.reduce((acc, d) => {
    acc[d.status] = d._count;
    return acc;
  }, {} as Record<string, number>);

  // Calculate average resolution time
  const resolvedDisputes = await prisma.marketplaceDispute.findMany({
    where: {
      buyerId,
      status: { in: ['resolved', 'closed'] },
      closedAt: { not: null },
    },
    select: { createdAt: true, closedAt: true },
  });

  let avgResolutionDays = 0;
  if (resolvedDisputes.length > 0) {
    const totalDays = resolvedDisputes.reduce((sum, d) => {
      if (d.closedAt) {
        const days = (d.closedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);
    avgResolutionDays = Math.round((totalDays / resolvedDisputes.length) * 10) / 10;
  }

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const resolved = (statusCounts['resolved'] || 0) + (statusCounts['closed'] || 0);
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return {
    total,
    open: statusCounts['open'] || 0,
    underReview: statusCounts['under_review'] || 0,
    sellerResponded: statusCounts['seller_responded'] || 0,
    resolved: statusCounts['resolved'] || 0,
    rejected: statusCounts['rejected'] || 0,
    escalated: statusCounts['escalated'] || 0,
    closed: statusCounts['closed'] || 0,
    avgResolutionDays,
    resolutionRate,
  };
}

/**
 * Get dispute statistics for seller
 */
async function getSellerDisputeStats(sellerId: string): Promise<DisputeStats> {
  const disputes = await prisma.marketplaceDispute.groupBy({
    by: ['status'],
    where: { sellerId },
    _count: true,
  });

  const statusCounts = disputes.reduce((acc, d) => {
    acc[d.status] = d._count;
    return acc;
  }, {} as Record<string, number>);

  // Calculate average resolution time
  const resolvedDisputes = await prisma.marketplaceDispute.findMany({
    where: {
      sellerId,
      status: { in: ['resolved', 'closed'] },
      closedAt: { not: null },
    },
    select: { createdAt: true, closedAt: true },
  });

  let avgResolutionDays = 0;
  if (resolvedDisputes.length > 0) {
    const totalDays = resolvedDisputes.reduce((sum, d) => {
      if (d.closedAt) {
        const days = (d.closedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);
    avgResolutionDays = Math.round((totalDays / resolvedDisputes.length) * 10) / 10;
  }

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const resolved = (statusCounts['resolved'] || 0) + (statusCounts['closed'] || 0);
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return {
    total,
    open: statusCounts['open'] || 0,
    underReview: statusCounts['under_review'] || 0,
    sellerResponded: statusCounts['seller_responded'] || 0,
    resolved: statusCounts['resolved'] || 0,
    rejected: statusCounts['rejected'] || 0,
    escalated: statusCounts['escalated'] || 0,
    closed: statusCounts['closed'] || 0,
    avgResolutionDays,
    resolutionRate,
  };
}

/**
 * Seller marks dispute as under review
 */
async function markAsUnderReview(
  disputeId: string,
  sellerId: string
): Promise<{ success: boolean; dispute?: MarketplaceDispute; error?: string }> {
  try {
    const dispute = await prisma.marketplaceDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    if (dispute.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!isValidTransition(dispute.status as DisputeStatus, 'under_review')) {
      return { success: false, error: `Cannot transition from ${dispute.status} to under_review` };
    }

    const updated = await prisma.marketplaceDispute.update({
      where: { id: disputeId },
      data: { status: 'under_review' },
    });

    await logDisputeEvent(
      disputeId,
      'DISPUTE_VIEWED',
      sellerId,
      'seller',
      dispute.status,
      'under_review'
    );

    return { success: true, dispute: updated };
  } catch (error) {
    apiLogger.error('Error marking dispute as under review:', error);
    return { success: false, error: 'Failed to update dispute' };
  }
}

/**
 * Seller responds to dispute
 */
async function sellerRespond(input: SellerRespondInput): Promise<{ success: boolean; dispute?: MarketplaceDispute; error?: string }> {
  try {
    const dispute = await prisma.marketplaceDispute.findUnique({
      where: { id: input.disputeId },
    });

    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    if (dispute.sellerId !== input.sellerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!['open', 'under_review'].includes(dispute.status)) {
      return { success: false, error: 'Dispute is not in a respondable state' };
    }

    const updateData: Prisma.MarketplaceDisputeUpdateInput = {
      status: 'seller_responded',
      sellerResponseType: input.responseType,
      sellerResponse: input.response,
      respondedAt: new Date(),
    };

    if (input.responseType === 'propose_resolution') {
      updateData.sellerProposedResolution = input.proposedResolution;
      updateData.sellerProposedAmount = input.proposedAmount;
    }

    // If seller accepts responsibility, we can resolve immediately
    if (input.responseType === 'accept_responsibility') {
      updateData.status = 'resolved';
      updateData.resolution = input.proposedResolution || 'full_refund';
      updateData.resolutionAmount = input.proposedAmount;
      updateData.resolvedBy = 'seller_accepted';
      updateData.closedAt = new Date();
    }

    const updated = await prisma.marketplaceDispute.update({
      where: { id: input.disputeId },
      data: updateData,
    });

    await logDisputeEvent(
      input.disputeId,
      'SELLER_RESPONDED',
      input.sellerId,
      'seller',
      dispute.status,
      updated.status,
      {
        responseType: input.responseType,
        proposedResolution: input.proposedResolution,
        proposedAmount: input.proposedAmount,
      }
    );

    return { success: true, dispute: updated };
  } catch (error) {
    apiLogger.error('Error submitting seller response:', error);
    return { success: false, error: 'Failed to submit response' };
  }
}

/**
 * Buyer accepts seller's resolution proposal
 */
async function buyerAcceptResolution(
  disputeId: string,
  buyerId: string
): Promise<{ success: boolean; dispute?: MarketplaceDispute; error?: string }> {
  try {
    const dispute = await prisma.marketplaceDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    if (dispute.buyerId !== buyerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (dispute.status !== 'seller_responded') {
      return { success: false, error: 'No pending resolution to accept' };
    }

    if (dispute.sellerResponseType !== 'propose_resolution') {
      return { success: false, error: 'Seller did not propose a resolution' };
    }

    const updated = await prisma.marketplaceDispute.update({
      where: { id: disputeId },
      data: {
        status: 'resolved',
        resolution: dispute.sellerProposedResolution,
        resolutionAmount: dispute.sellerProposedAmount,
        resolvedBy: 'buyer_accepted',
        closedAt: new Date(),
      },
    });

    await logDisputeEvent(
      disputeId,
      'BUYER_ACCEPTED',
      buyerId,
      'buyer',
      'seller_responded',
      'resolved',
      {
        resolution: dispute.sellerProposedResolution,
        amount: dispute.sellerProposedAmount,
      }
    );

    return { success: true, dispute: updated };
  } catch (error) {
    apiLogger.error('Error accepting resolution:', error);
    return { success: false, error: 'Failed to accept resolution' };
  }
}

/**
 * Buyer rejects seller's response
 */
async function buyerRejectResolution(
  disputeId: string,
  buyerId: string,
  reason: string
): Promise<{ success: boolean; dispute?: MarketplaceDispute; error?: string }> {
  try {
    const dispute = await prisma.marketplaceDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    if (dispute.buyerId !== buyerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (dispute.status !== 'seller_responded') {
      return { success: false, error: 'No pending resolution to reject' };
    }

    const updated = await prisma.marketplaceDispute.update({
      where: { id: disputeId },
      data: {
        status: 'rejected',
      },
    });

    await logDisputeEvent(
      disputeId,
      'BUYER_REJECTED',
      buyerId,
      'buyer',
      'seller_responded',
      'rejected',
      { reason }
    );

    return { success: true, dispute: updated };
  } catch (error) {
    apiLogger.error('Error rejecting resolution:', error);
    return { success: false, error: 'Failed to reject resolution' };
  }
}

/**
 * Escalate dispute to platform
 */
async function escalateDispute(
  disputeId: string,
  actorId: string,
  reason: string
): Promise<{ success: boolean; dispute?: MarketplaceDispute; error?: string }> {
  try {
    const dispute = await prisma.marketplaceDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    // Only buyer or seller can escalate
    if (dispute.buyerId !== actorId && dispute.sellerId !== actorId) {
      return { success: false, error: 'Unauthorized' };
    }

    const currentStatus = dispute.status as DisputeStatus;
    if (!isValidTransition(currentStatus, 'escalated')) {
      return { success: false, error: `Cannot escalate from ${currentStatus}` };
    }

    const actorType = dispute.buyerId === actorId ? 'buyer' : 'seller';

    const updated = await prisma.marketplaceDispute.update({
      where: { id: disputeId },
      data: {
        status: 'escalated',
        isEscalated: true,
        escalatedAt: new Date(),
        escalationReason: reason,
        priorityLevel: 'urgent',
      },
    });

    await logDisputeEvent(
      disputeId,
      'ESCALATED',
      actorId,
      actorType,
      currentStatus,
      'escalated',
      { reason }
    );

    return { success: true, dispute: updated };
  } catch (error) {
    apiLogger.error('Error escalating dispute:', error);
    return { success: false, error: 'Failed to escalate dispute' };
  }
}

/**
 * Close a dispute
 */
async function closeDispute(
  disputeId: string,
  actorId: string
): Promise<{ success: boolean; dispute?: MarketplaceDispute; error?: string }> {
  try {
    const dispute = await prisma.marketplaceDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    // Only buyer, seller, or platform can close
    if (dispute.buyerId !== actorId && dispute.sellerId !== actorId) {
      return { success: false, error: 'Unauthorized' };
    }

    const currentStatus = dispute.status as DisputeStatus;
    if (!isValidTransition(currentStatus, 'closed')) {
      return { success: false, error: `Cannot close from ${currentStatus}` };
    }

    const actorType = dispute.buyerId === actorId ? 'buyer' : 'seller';

    const updated = await prisma.marketplaceDispute.update({
      where: { id: disputeId },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    await logDisputeEvent(
      disputeId,
      'CLOSED',
      actorId,
      actorType,
      currentStatus,
      'closed'
    );

    return { success: true, dispute: updated };
  } catch (error) {
    apiLogger.error('Error closing dispute:', error);
    return { success: false, error: 'Failed to close dispute' };
  }
}

/**
 * Add evidence to a dispute
 */
async function addEvidence(
  disputeId: string,
  buyerId: string,
  newEvidence: DisputeEvidence[]
): Promise<{ success: boolean; dispute?: MarketplaceDispute; error?: string }> {
  try {
    const dispute = await prisma.marketplaceDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    if (dispute.buyerId !== buyerId) {
      return { success: false, error: 'Only the buyer can add evidence' };
    }

    if (['resolved', 'closed'].includes(dispute.status)) {
      return { success: false, error: 'Cannot add evidence to a closed dispute' };
    }

    const existingEvidence: DisputeEvidence[] = dispute.evidence
      ? JSON.parse(dispute.evidence)
      : [];
    const combinedEvidence = [...existingEvidence, ...newEvidence];

    const updated = await prisma.marketplaceDispute.update({
      where: { id: disputeId },
      data: {
        evidence: JSON.stringify(combinedEvidence),
      },
    });

    await logDisputeEvent(
      disputeId,
      'EVIDENCE_ADDED',
      buyerId,
      'buyer',
      undefined,
      undefined,
      { count: newEvidence.length }
    );

    return {
      success: true,
      dispute: { ...updated, evidence: combinedEvidence } as unknown as MarketplaceDispute
    };
  } catch (error) {
    apiLogger.error('Error adding evidence:', error);
    return { success: false, error: 'Failed to add evidence' };
  }
}

/**
 * Get dispute history (events)
 */
async function getDisputeHistory(disputeId: string, userId: string): Promise<any[]> {
  const dispute = await prisma.marketplaceDispute.findUnique({
    where: { id: disputeId },
    select: { buyerId: true, sellerId: true },
  });

  if (!dispute) return [];

  // Check authorization
  if (dispute.buyerId !== userId && dispute.sellerId !== userId) {
    return [];
  }

  const events = await prisma.marketplaceDisputeEvent.findMany({
    where: { disputeId },
    orderBy: { createdAt: 'desc' },
  });

  return events.map((e) => ({
    ...e,
    metadata: e.metadata ? JSON.parse(e.metadata) : null,
  }));
}

/**
 * Get dispute for a specific order
 */
async function getDisputeByOrder(orderId: string, userId: string): Promise<any | null> {
  const dispute = await prisma.marketplaceDispute.findFirst({
    where: { orderId },
    include: {
      returnRequest: true,
    },
  });

  if (!dispute) return null;

  // Check authorization
  if (dispute.buyerId !== userId && dispute.sellerId !== userId) {
    return null;
  }

  return {
    ...dispute,
    evidence: dispute.evidence ? JSON.parse(dispute.evidence) : [],
  };
}

// =============================================================================
// Export
// =============================================================================

export const disputeService = {
  createDispute,
  getDispute,
  getBuyerDisputes,
  getSellerDisputes,
  getBuyerDisputeStats,
  getSellerDisputeStats,
  markAsUnderReview,
  sellerRespond,
  buyerAcceptResolution,
  buyerRejectResolution,
  escalateDispute,
  closeDispute,
  addEvidence,
  getDisputeHistory,
  getDisputeByOrder,
};

export default disputeService;
