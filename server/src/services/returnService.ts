// =============================================================================
// Return Service (Stage 7)
// =============================================================================
// Return is a sub-flow of disputes for physical goods return.
// Lifecycle: REQUESTED -> APPROVED | REJECTED
//            APPROVED -> IN_TRANSIT -> RECEIVED -> REFUND_PROCESSED -> CLOSED
// =============================================================================

import { prisma } from '../lib/prisma';
import type { MarketplaceReturn } from '@prisma/client';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'in_transit' | 'received' | 'refund_processed' | 'closed';
export type ReturnType = 'full_return' | 'partial_return' | 'replacement_only';
export type ReceivedCondition = 'as_expected' | 'damaged_in_transit' | 'partial_received' | 'other';

export interface ReturnItem {
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface ReturnAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface ReturnFilters {
  status?: ReturnStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReturnStats {
  total: number;
  requested: number;
  approved: number;
  rejected: number;
  inTransit: number;
  received: number;
  refundProcessed: number;
  closed: number;
}

export interface CreateReturnInput {
  disputeId: string;
  returnType: ReturnType;
  returnItems: ReturnItem[];
}

export interface ApproveReturnInput {
  returnId: string;
  sellerId: string;
  returnAddress: ReturnAddress;
  approvalNotes?: string;
}

export interface ShipReturnInput {
  returnId: string;
  buyerId: string;
  trackingNumber: string;
  carrier?: string;
}

export interface ReceiveReturnInput {
  returnId: string;
  sellerId: string;
  condition: ReceivedCondition;
  notes?: string;
}

// =============================================================================
// State Machine
// =============================================================================

const VALID_RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['in_transit'],
  rejected: [],
  in_transit: ['received'],
  received: ['refund_processed'],
  refund_processed: ['closed'],
  closed: [],
};

function isValidTransition(from: ReturnStatus, to: ReturnStatus): boolean {
  return VALID_RETURN_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate sequential return number
 * Format: RET-YYYY-0001
 */
async function generateReturnNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RET-${year}-`;

  const lastReturn = await prisma.marketplaceReturn.findFirst({
    where: {
      returnNumber: { startsWith: prefix },
    },
    orderBy: { returnNumber: 'desc' },
    select: { returnNumber: true },
  });

  let nextNumber = 1;
  if (lastReturn) {
    const lastNumber = parseInt(lastReturn.returnNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Log return event
 */
async function logReturnEvent(
  returnId: string,
  eventType: string,
  actorId: string | null,
  actorType: 'buyer' | 'seller' | 'system',
  fromStatus?: string,
  toStatus?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.marketplaceReturnEvent.create({
    data: {
      returnId,
      eventType,
      actorId,
      actorType,
      fromStatus,
      toStatus,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Create a return request from a dispute
 * Called when dispute resolution requires physical return
 */
async function createReturn(input: CreateReturnInput): Promise<{ success: boolean; return?: MarketplaceReturn; error?: string }> {
  try {
    // Validate dispute exists
    const dispute = await prisma.marketplaceDispute.findUnique({
      where: { id: input.disputeId },
    });

    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    // Check if return already exists for this dispute
    const existingReturn = await prisma.marketplaceReturn.findUnique({
      where: { disputeId: input.disputeId },
    });

    if (existingReturn) {
      return { success: false, error: 'Return request already exists for this dispute' };
    }

    // Generate return number
    const returnNumber = await generateReturnNumber();

    // Create return
    const returnRequest = await prisma.marketplaceReturn.create({
      data: {
        returnNumber,
        disputeId: dispute.id,
        orderId: dispute.orderId,
        orderNumber: dispute.orderNumber,
        buyerId: dispute.buyerId,
        sellerId: dispute.sellerId,
        returnType: input.returnType,
        returnReason: dispute.reason,
        returnItems: JSON.stringify(input.returnItems),
        status: 'requested',
      },
    });

    // Log event
    await logReturnEvent(
      returnRequest.id,
      'RETURN_REQUESTED',
      dispute.buyerId,
      'buyer',
      undefined,
      'requested',
      {
        returnType: input.returnType,
        itemCount: input.returnItems.length,
      }
    );

    return { success: true, return: returnRequest };
  } catch (error) {
    apiLogger.error('Error creating return:', error);
    return { success: false, error: 'Failed to create return request' };
  }
}

/**
 * Get a single return with authorization check
 */
async function getReturn(returnId: string, userId: string): Promise<any | null> {
  const returnRequest = await prisma.marketplaceReturn.findUnique({
    where: { id: returnId },
    include: {
      dispute: {
        select: {
          id: true,
          disputeNumber: true,
          reason: true,
          description: true,
        },
      },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!returnRequest) return null;

  // Check authorization
  if (returnRequest.buyerId !== userId && returnRequest.sellerId !== userId) {
    return null;
  }

  // Parse JSON fields
  return {
    ...returnRequest,
    returnItems: JSON.parse(returnRequest.returnItems),
    returnAddress: returnRequest.returnAddress ? JSON.parse(returnRequest.returnAddress) : null,
    events: returnRequest.events.map((e) => ({
      ...e,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    })),
  };
}

/**
 * Get returns for a buyer with filters and pagination
 */
async function getBuyerReturns(
  buyerId: string,
  filters: ReturnFilters = {}
): Promise<{ returns: MarketplaceReturn[]; total: number; page: number; limit: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { buyerId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }

  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  if (filters.search) {
    where.OR = [
      { returnNumber: { contains: filters.search, mode: 'insensitive' } },
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [returns, total] = await Promise.all([
    prisma.marketplaceReturn.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        dispute: {
          select: { disputeNumber: true, reason: true },
        },
      },
    }),
    prisma.marketplaceReturn.count({ where }),
  ]);

  return {
    returns: returns.map((r) => ({
      ...r,
      returnItems: JSON.parse(r.returnItems),
      returnAddress: r.returnAddress ? JSON.parse(r.returnAddress) : null,
    })),
    total,
    page,
    limit,
  };
}

/**
 * Get returns for a seller with filters and pagination
 */
async function getSellerReturns(
  sellerId: string,
  filters: ReturnFilters = {}
): Promise<{ returns: MarketplaceReturn[]; total: number; page: number; limit: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { sellerId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }

  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  if (filters.search) {
    where.OR = [
      { returnNumber: { contains: filters.search, mode: 'insensitive' } },
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [returns, total] = await Promise.all([
    prisma.marketplaceReturn.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        dispute: {
          select: { disputeNumber: true, reason: true, buyerName: true },
        },
      },
    }),
    prisma.marketplaceReturn.count({ where }),
  ]);

  return {
    returns: returns.map((r) => ({
      ...r,
      returnItems: JSON.parse(r.returnItems),
      returnAddress: r.returnAddress ? JSON.parse(r.returnAddress) : null,
    })),
    total,
    page,
    limit,
  };
}

/**
 * Get return statistics for seller
 */
async function getSellerReturnStats(sellerId: string): Promise<ReturnStats> {
  const returns = await prisma.marketplaceReturn.groupBy({
    by: ['status'],
    where: { sellerId },
    _count: true,
  });

  const statusCounts = returns.reduce((acc, r) => {
    acc[r.status] = r._count;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    requested: statusCounts['requested'] || 0,
    approved: statusCounts['approved'] || 0,
    rejected: statusCounts['rejected'] || 0,
    inTransit: statusCounts['in_transit'] || 0,
    received: statusCounts['received'] || 0,
    refundProcessed: statusCounts['refund_processed'] || 0,
    closed: statusCounts['closed'] || 0,
  };
}

/**
 * Seller approves a return request
 */
async function approveReturn(input: ApproveReturnInput): Promise<{ success: boolean; return?: MarketplaceReturn; error?: string }> {
  try {
    const returnRequest = await prisma.marketplaceReturn.findUnique({
      where: { id: input.returnId },
    });

    if (!returnRequest) {
      return { success: false, error: 'Return request not found' };
    }

    if (returnRequest.sellerId !== input.sellerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (returnRequest.status !== 'requested') {
      return { success: false, error: 'Return is not in requested status' };
    }

    const updated = await prisma.marketplaceReturn.update({
      where: { id: input.returnId },
      data: {
        status: 'approved',
        returnAddress: JSON.stringify(input.returnAddress),
        approvedAt: new Date(),
        approvedBy: input.sellerId,
        approvalNotes: input.approvalNotes,
      },
    });

    await logReturnEvent(
      input.returnId,
      'RETURN_APPROVED',
      input.sellerId,
      'seller',
      'requested',
      'approved',
      { returnAddress: input.returnAddress }
    );

    return {
      success: true,
      return: {
        ...updated,
        returnItems: JSON.parse(updated.returnItems),
        returnAddress: input.returnAddress,
      } as unknown as MarketplaceReturn,
    };
  } catch (error) {
    apiLogger.error('Error approving return:', error);
    return { success: false, error: 'Failed to approve return' };
  }
}

/**
 * Seller rejects a return request
 */
async function rejectReturn(
  returnId: string,
  sellerId: string,
  reason: string
): Promise<{ success: boolean; return?: MarketplaceReturn; error?: string }> {
  try {
    const returnRequest = await prisma.marketplaceReturn.findUnique({
      where: { id: returnId },
    });

    if (!returnRequest) {
      return { success: false, error: 'Return request not found' };
    }

    if (returnRequest.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (returnRequest.status !== 'requested') {
      return { success: false, error: 'Return is not in requested status' };
    }

    const updated = await prisma.marketplaceReturn.update({
      where: { id: returnId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: sellerId,
        rejectionReason: reason,
      },
    });

    await logReturnEvent(
      returnId,
      'RETURN_REJECTED',
      sellerId,
      'seller',
      'requested',
      'rejected',
      { reason }
    );

    return {
      success: true,
      return: {
        ...updated,
        returnItems: JSON.parse(updated.returnItems),
      },
    };
  } catch (error) {
    apiLogger.error('Error rejecting return:', error);
    return { success: false, error: 'Failed to reject return' };
  }
}

/**
 * Buyer marks return as shipped
 */
async function markReturnShipped(input: ShipReturnInput): Promise<{ success: boolean; return?: MarketplaceReturn; error?: string }> {
  try {
    const returnRequest = await prisma.marketplaceReturn.findUnique({
      where: { id: input.returnId },
    });

    if (!returnRequest) {
      return { success: false, error: 'Return request not found' };
    }

    if (returnRequest.buyerId !== input.buyerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (returnRequest.status !== 'approved') {
      return { success: false, error: 'Return must be approved before shipping' };
    }

    const updated = await prisma.marketplaceReturn.update({
      where: { id: input.returnId },
      data: {
        status: 'in_transit',
        returnTrackingNumber: input.trackingNumber,
        returnCarrier: input.carrier,
        shippedAt: new Date(),
      },
    });

    await logReturnEvent(
      input.returnId,
      'RETURN_SHIPPED',
      input.buyerId,
      'buyer',
      'approved',
      'in_transit',
      {
        trackingNumber: input.trackingNumber,
        carrier: input.carrier,
      }
    );

    return {
      success: true,
      return: {
        ...updated,
        returnItems: JSON.parse(updated.returnItems),
        returnAddress: updated.returnAddress ? JSON.parse(updated.returnAddress) : null,
      },
    };
  } catch (error) {
    apiLogger.error('Error marking return as shipped:', error);
    return { success: false, error: 'Failed to update return' };
  }
}

/**
 * Seller confirms return received
 */
async function confirmReturnReceived(input: ReceiveReturnInput): Promise<{ success: boolean; return?: MarketplaceReturn; error?: string }> {
  try {
    const returnRequest = await prisma.marketplaceReturn.findUnique({
      where: { id: input.returnId },
    });

    if (!returnRequest) {
      return { success: false, error: 'Return request not found' };
    }

    if (returnRequest.sellerId !== input.sellerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (returnRequest.status !== 'in_transit') {
      return { success: false, error: 'Return is not in transit' };
    }

    const updated = await prisma.marketplaceReturn.update({
      where: { id: input.returnId },
      data: {
        status: 'received',
        receivedAt: new Date(),
        receivedBy: input.sellerId,
        receivedCondition: input.condition,
        receivedNotes: input.notes,
      },
    });

    await logReturnEvent(
      input.returnId,
      'RETURN_RECEIVED',
      input.sellerId,
      'seller',
      'in_transit',
      'received',
      {
        condition: input.condition,
        notes: input.notes,
      }
    );

    return {
      success: true,
      return: {
        ...updated,
        returnItems: JSON.parse(updated.returnItems),
        returnAddress: updated.returnAddress ? JSON.parse(updated.returnAddress) : null,
      },
    };
  } catch (error) {
    apiLogger.error('Error confirming return receipt:', error);
    return { success: false, error: 'Failed to confirm receipt' };
  }
}

/**
 * Process refund for a return
 */
async function processRefund(
  returnId: string,
  sellerId: string,
  amount: number
): Promise<{ success: boolean; return?: MarketplaceReturn; error?: string }> {
  try {
    const returnRequest = await prisma.marketplaceReturn.findUnique({
      where: { id: returnId },
    });

    if (!returnRequest) {
      return { success: false, error: 'Return request not found' };
    }

    if (returnRequest.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (returnRequest.status !== 'received') {
      return { success: false, error: 'Return must be received before processing refund' };
    }

    const updated = await prisma.marketplaceReturn.update({
      where: { id: returnId },
      data: {
        status: 'refund_processed',
        refundAmount: amount,
        refundStatus: 'processed',
        refundProcessedAt: new Date(),
      },
    });

    await logReturnEvent(
      returnId,
      'REFUND_PROCESSED',
      sellerId,
      'seller',
      'received',
      'refund_processed',
      { amount }
    );

    return {
      success: true,
      return: {
        ...updated,
        returnItems: JSON.parse(updated.returnItems),
        returnAddress: updated.returnAddress ? JSON.parse(updated.returnAddress) : null,
      },
    };
  } catch (error) {
    apiLogger.error('Error processing refund:', error);
    return { success: false, error: 'Failed to process refund' };
  }
}

/**
 * Close a return
 */
async function closeReturn(
  returnId: string,
  actorId: string
): Promise<{ success: boolean; return?: MarketplaceReturn; error?: string }> {
  try {
    const returnRequest = await prisma.marketplaceReturn.findUnique({
      where: { id: returnId },
    });

    if (!returnRequest) {
      return { success: false, error: 'Return request not found' };
    }

    if (returnRequest.buyerId !== actorId && returnRequest.sellerId !== actorId) {
      return { success: false, error: 'Unauthorized' };
    }

    const currentStatus = returnRequest.status as ReturnStatus;
    if (!isValidTransition(currentStatus, 'closed')) {
      return { success: false, error: `Cannot close return from ${currentStatus} status` };
    }

    const actorType = returnRequest.buyerId === actorId ? 'buyer' : 'seller';

    const updated = await prisma.marketplaceReturn.update({
      where: { id: returnId },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    await logReturnEvent(
      returnId,
      'RETURN_CLOSED',
      actorId,
      actorType,
      currentStatus,
      'closed'
    );

    return {
      success: true,
      return: {
        ...updated,
        returnItems: JSON.parse(updated.returnItems),
        returnAddress: updated.returnAddress ? JSON.parse(updated.returnAddress) : null,
      },
    };
  } catch (error) {
    apiLogger.error('Error closing return:', error);
    return { success: false, error: 'Failed to close return' };
  }
}

/**
 * Get return history (events)
 */
async function getReturnHistory(returnId: string, userId: string): Promise<any[]> {
  const returnRequest = await prisma.marketplaceReturn.findUnique({
    where: { id: returnId },
    select: { buyerId: true, sellerId: true },
  });

  if (!returnRequest) return [];

  // Check authorization
  if (returnRequest.buyerId !== userId && returnRequest.sellerId !== userId) {
    return [];
  }

  const events = await prisma.marketplaceReturnEvent.findMany({
    where: { returnId },
    orderBy: { createdAt: 'desc' },
  });

  return events.map((e) => ({
    ...e,
    metadata: e.metadata ? JSON.parse(e.metadata) : null,
  }));
}

/**
 * Get return for a dispute
 */
async function getReturnByDispute(disputeId: string, userId: string): Promise<any | null> {
  const returnRequest = await prisma.marketplaceReturn.findUnique({
    where: { disputeId },
  });

  if (!returnRequest) return null;

  // Check authorization
  if (returnRequest.buyerId !== userId && returnRequest.sellerId !== userId) {
    return null;
  }

  return {
    ...returnRequest,
    returnItems: JSON.parse(returnRequest.returnItems),
    returnAddress: returnRequest.returnAddress ? JSON.parse(returnRequest.returnAddress) : null,
  };
}

// =============================================================================
// Export
// =============================================================================

export const returnService = {
  createReturn,
  getReturn,
  getBuyerReturns,
  getSellerReturns,
  getSellerReturnStats,
  approveReturn,
  rejectReturn,
  markReturnShipped,
  confirmReturnReceived,
  processRefund,
  closeReturn,
  getReturnHistory,
  getReturnByDispute,
};

export default returnService;
