// =============================================================================
// Marketplace Order Service (Stage 4 + Stage 5 + Stage 6 Invoicing)
// =============================================================================
// Stage 4: Quote acceptance → order creation
// Stage 5: Order fulfillment lifecycle
// Stage 6: Auto-generate invoice on delivery
// Order is immutable once created - represents a binding agreement
// =============================================================================

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { marketplaceInvoiceService } from './marketplaceInvoiceService';
import { enrichOrderWithSLA, type SLAEvaluation } from './orderHealthService';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * Order Status Lifecycle (Stage 5):
 * PENDING_CONFIRMATION → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → CLOSED
 * Can be CANCELLED at various stages
 */
export type OrderStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'processing'   // Stage 5: Seller is processing/picking/packing
  | 'shipped'
  | 'delivered'
  | 'closed'       // Stage 5: Order lifecycle complete
  | 'cancelled'
  | 'failed'
  | 'refunded';

/**
 * Valid status transitions for linear fulfillment
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
  failed: [],
  refunded: [],
};

export interface AcceptQuoteInput {
  quoteId: string;
  buyerId: string;
  shippingAddress?: string; // JSON string
  buyerNotes?: string;
}

export interface RejectQuoteInput {
  quoteId: string;
  buyerId: string;
  reason: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  source?: 'rfq' | 'direct_buy';
  page?: number;
  limit?: number;
}

// =============================================================================
// Stage 5: Fulfillment Input Types
// All seller action inputs support sellerIds array for flexible matching
// (orders may be stored with either User.id or SellerProfile.id)
// =============================================================================

export interface RejectOrderInput {
  orderId: string;
  sellerId: string;
  sellerIds?: string[]; // Optional array for flexible matching
  reason: string;
}

export interface StartProcessingInput {
  orderId: string;
  sellerId: string;
  sellerIds?: string[]; // Optional array for flexible matching
  sellerNotes?: string;
}

export interface ShipOrderInput {
  orderId: string;
  sellerId: string;
  sellerIds?: string[]; // Optional array for flexible matching
  carrier: string;
  trackingNumber?: string;
  estimatedDelivery?: string; // ISO date string
  sellerNotes?: string;
}

export interface MarkDeliveredInput {
  orderId: string;
  userId: string;
  userRole: 'buyer' | 'seller' | 'system';
  buyerNotes?: string;
}

export interface CloseOrderInput {
  orderId: string;
  actorId?: string;
}

// =============================================================================
// Order Number Generation
// =============================================================================

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Find the highest order number for this year
  const lastOrder = await prisma.marketplaceOrder.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  });

  let nextNumber = 1;
  if (lastOrder?.orderNumber) {
    const lastNum = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

// =============================================================================
// Audit Logging
// =============================================================================

async function logOrderAudit(
  orderId: string,
  action: string,
  actor: 'buyer' | 'seller' | 'system',
  actorId: string | null,
  previousValue?: string,
  newValue?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.marketplaceOrderAudit.create({
    data: {
      orderId,
      action,
      actor,
      actorId,
      previousValue,
      newValue,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// =============================================================================
// Quote Acceptance Validation
// =============================================================================

interface ValidationResult {
  valid: boolean;
  error?: string;
}

async function validateQuoteForAcceptance(
  quoteId: string,
  buyerId: string
): Promise<ValidationResult> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      rfq: true,
    },
  });

  if (!quote) {
    return { valid: false, error: 'Quote not found' };
  }

  // Check buyer owns the RFQ
  if (quote.buyerId !== buyerId) {
    return { valid: false, error: 'Unauthorized: You do not own this quote' };
  }

  // Check quote status is SENT
  if (quote.status !== 'sent' && quote.status !== 'revised') {
    return {
      valid: false,
      error: `Cannot accept quote in "${quote.status}" status. Only sent or revised quotes can be accepted.`,
    };
  }

  // Check quote has not expired
  if (new Date(quote.validUntil) < new Date()) {
    return {
      valid: false,
      error: 'Quote has expired. Please request a new quote from the seller.',
    };
  }

  // Check RFQ status is QUOTED
  if (quote.rfq.status !== 'quoted') {
    return {
      valid: false,
      error: `Cannot accept quote for RFQ in "${quote.rfq.status}" status`,
    };
  }

  // Check no existing order for this quote
  const existingOrder = await prisma.marketplaceOrder.findFirst({
    where: { quoteId },
  });

  if (existingOrder) {
    return {
      valid: false,
      error: 'An order has already been created for this quote',
    };
  }

  return { valid: true };
}

// =============================================================================
// Core Operations
// =============================================================================

/**
 * Accept a quote and create an order
 * This is an atomic operation that:
 * 1. Validates the quote
 * 2. Creates the order
 * 3. Updates the quote status to ACCEPTED
 * 4. Updates the RFQ status to ACCEPTED
 * 5. Logs all events
 */
export async function acceptQuote(input: AcceptQuoteInput): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    // Validate the quote
    const validation = await validateQuoteForAcceptance(input.quoteId, input.buyerId);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get the quote with all related data
    const quote = await prisma.quote.findUnique({
      where: { id: input.quoteId },
      include: {
        rfq: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create the order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const newOrder = await tx.marketplaceOrder.create({
        data: {
          orderNumber,
          buyerId: input.buyerId,
          sellerId: quote.sellerId,
          itemId: quote.rfq.itemId || '',
          itemName: quote.rfq.item?.name || 'General Order',
          itemSku: quote.rfq.item?.sku || 'N/A',
          itemImage: quote.rfq.item?.images ? JSON.parse(quote.rfq.item.images as string)?.[0] : null,
          rfqId: quote.rfqId,
          rfqNumber: quote.rfq.rfqNumber,
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          quoteVersion: quote.version,
          quantity: quote.quantity,
          unitPrice: quote.unitPrice,
          totalPrice: quote.totalPrice,
          currency: quote.currency,
          status: 'pending_confirmation',
          source: 'rfq',
          shippingAddress: input.shippingAddress || quote.rfq.deliveryLocation,
          buyerNotes: input.buyerNotes,
          // Set SLA deadlines
          confirmationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          shippingDeadline: new Date(Date.now() + (quote.deliveryDays + 2) * 24 * 60 * 60 * 1000),
        },
      });

      // 2. Update the quote status to ACCEPTED
      await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: input.buyerId,
          orderId: newOrder.id,
        },
      });

      // 3. Update the RFQ status to ACCEPTED (locked)
      await tx.itemRFQ.update({
        where: { id: quote.rfqId },
        data: {
          status: 'accepted',
        },
      });

      // 4. Log quote event
      await tx.quoteEvent.create({
        data: {
          quoteId: quote.id,
          actorId: input.buyerId,
          actorType: 'buyer',
          eventType: 'QUOTE_ACCEPTED',
          fromStatus: quote.status,
          toStatus: 'accepted',
          version: quote.version,
          metadata: JSON.stringify({
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
          }),
        },
      });

      // 5. Log RFQ event
      await tx.itemRFQEvent.create({
        data: {
          rfqId: quote.rfqId,
          actorId: input.buyerId,
          actorType: 'buyer',
          eventType: 'RFQ_ACCEPTED',
          fromStatus: 'quoted',
          toStatus: 'accepted',
          metadata: JSON.stringify({
            quoteId: quote.id,
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
          }),
        },
      });

      return newOrder;
    });

    // Log order creation audit
    await logOrderAudit(
      order.id,
      'created',
      'buyer',
      input.buyerId,
      undefined,
      'pending_confirmation',
      {
        quoteId: quote.id,
        rfqId: quote.rfqId,
        totalPrice: order.totalPrice,
      }
    );

    // DEV-only trace for debugging
    if (process.env.NODE_ENV === 'development') {
      apiLogger.info('[DEV TRACE] Order created:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        rfqId: quote.rfqId,
        quoteId: quote.id,
        buyerId: input.buyerId,
        sellerId: quote.sellerId,
        totalPrice: order.totalPrice,
        currency: order.currency,
      });
    }

    return { success: true, order };
  } catch (error) {
    apiLogger.error('Error accepting quote:', error);
    return { success: false, error: 'Failed to accept quote and create order' };
  }
}

/**
 * Reject a quote
 */
export async function rejectQuote(input: RejectQuoteInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get the quote
    const quote = await prisma.quote.findUnique({
      where: { id: input.quoteId },
      include: {
        rfq: true,
      },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Check buyer owns the quote
    if (quote.buyerId !== input.buyerId) {
      return { success: false, error: 'Unauthorized: You do not own this quote' };
    }

    // Check quote status allows rejection
    if (quote.status !== 'sent' && quote.status !== 'revised') {
      return {
        success: false,
        error: `Cannot reject quote in "${quote.status}" status`,
      };
    }

    // Update quote in a transaction
    await prisma.$transaction(async (tx) => {
      // Update quote status
      await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: input.buyerId,
          rejectionReason: input.reason,
        },
      });

      // Update RFQ status back to under_review (allows seller to send new quote)
      await tx.itemRFQ.update({
        where: { id: quote.rfqId },
        data: {
          status: 'rejected',
        },
      });

      // Log quote event
      await tx.quoteEvent.create({
        data: {
          quoteId: quote.id,
          actorId: input.buyerId,
          actorType: 'buyer',
          eventType: 'QUOTE_REJECTED',
          fromStatus: quote.status,
          toStatus: 'rejected',
          version: quote.version,
          metadata: JSON.stringify({ reason: input.reason }),
        },
      });

      // Log RFQ event
      await tx.itemRFQEvent.create({
        data: {
          rfqId: quote.rfqId,
          actorId: input.buyerId,
          actorType: 'buyer',
          eventType: 'RFQ_REJECTED',
          fromStatus: 'quoted',
          toStatus: 'rejected',
          metadata: JSON.stringify({
            quoteId: quote.id,
            reason: input.reason,
          }),
        },
      });
    });

    return { success: true };
  } catch (error) {
    apiLogger.error('Error rejecting quote:', error);
    return { success: false, error: 'Failed to reject quote' };
  }
}

/**
 * Get order by ID
 */
export async function getOrder(
  orderId: string,
  userId: string
): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Verify user has access (buyer or seller)
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this order' };
    }

    return { success: true, order };
  } catch (error) {
    apiLogger.error('Error getting order:', error);
    return { success: false, error: 'Failed to get order' };
  }
}

/**
 * Get orders for buyer
 */
export async function getBuyerOrders(
  buyerId: string,
  filters: OrderFilters = {}
): Promise<{
  success: boolean;
  orders?: Prisma.MarketplaceOrderGetPayload<{}>[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  error?: string;
}> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MarketplaceOrderWhereInput = {
      buyerId,
      ...(filters.status && { status: filters.status }),
      ...(filters.source && { source: filters.source }),
    };

    const [orders, total] = await Promise.all([
      prisma.marketplaceOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.marketplaceOrder.count({ where }),
    ]);

    // DEV-only trace
    if (process.env.NODE_ENV === 'development') {
      apiLogger.debug('[DEV TRACE] getBuyerOrders returned:', { buyerId, count: orders.length, total });
    }

    return {
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    apiLogger.error('Error getting buyer orders:', error);
    return { success: false, error: 'Failed to get orders' };
  }
}

/**
 * Get orders for seller
 * @param sellerIds - Array of seller IDs to match (supports both User.id and SellerProfile.id)
 */
export async function getSellerOrders(
  sellerIds: string | string[],
  filters: OrderFilters = {}
): Promise<{
  success: boolean;
  orders?: Prisma.MarketplaceOrderGetPayload<{}>[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  error?: string;
}> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Normalize sellerIds to array for flexible matching
    const sellerIdArray = Array.isArray(sellerIds) ? sellerIds : [sellerIds];

    const where: Prisma.MarketplaceOrderWhereInput = {
      sellerId: { in: sellerIdArray },
      ...(filters.status && { status: filters.status }),
      ...(filters.source && { source: filters.source }),
    };

    const [orders, total] = await Promise.all([
      prisma.marketplaceOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.marketplaceOrder.count({ where }),
    ]);

    // Enrich orders with SLA evaluation for frontend display
    const ordersWithSLA = orders.map((order) => enrichOrderWithSLA(order));

    // DEV-only trace
    if (process.env.NODE_ENV === 'development') {
      apiLogger.debug('[DEV TRACE] getSellerOrders returned:', { count: orders.length, total });
    }

    return {
      success: true,
      orders: ordersWithSLA,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    apiLogger.error('Error getting seller orders:', error);
    return { success: false, error: 'Failed to get orders' };
  }
}

/**
 * Get order audit history
 */
export async function getOrderHistory(
  orderId: string,
  userId: string
): Promise<{
  success: boolean;
  events?: Prisma.MarketplaceOrderAuditGetPayload<{}>[];
  error?: string;
}> {
  try {
    // Verify user has access to the order
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this order' };
    }

    const events = await prisma.marketplaceOrderAudit.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, events };
  } catch (error) {
    apiLogger.error('Error getting order history:', error);
    return { success: false, error: 'Failed to get order history' };
  }
}

/**
 * Seller confirms an order (moves from pending_confirmation to confirmed)
 * @param sellerIds - Array of seller IDs to match (supports both User.id and SellerProfile.id)
 */
export async function confirmOrder(
  orderId: string,
  sellerIds: string | string[]
): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const sellerIdArray = Array.isArray(sellerIds) ? sellerIds : [sellerIds];
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!sellerIdArray.includes(order.sellerId)) {
      return { success: false, error: 'Unauthorized: You do not own this order' };
    }

    if (order.status !== 'pending_confirmation') {
      return {
        success: false,
        error: `Cannot confirm order in "${order.status}" status`,
      };
    }

    const updatedOrder = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        daysToConfirm: Math.ceil(
          (Date.now() - new Date(order.createdAt).getTime()) / (24 * 60 * 60 * 1000)
        ),
      },
    });

    // Log audit (use actual sellerId from order)
    await logOrderAudit(
      orderId,
      'confirmed',
      'seller',
      order.sellerId,
      'pending_confirmation',
      'confirmed'
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    apiLogger.error('Error confirming order:', error);
    return { success: false, error: 'Failed to confirm order' };
  }
}

/**
 * Get order statistics for a user (buyer or seller)
 */
export async function getOrderStats(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<{
  success: boolean;
  stats?: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    closed: number;
    cancelled: number;
  };
  error?: string;
}> {
  try {
    const where = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };

    const [total, pending, confirmed, processing, shipped, delivered, closed, cancelled] =
      await Promise.all([
        prisma.marketplaceOrder.count({ where }),
        prisma.marketplaceOrder.count({ where: { ...where, status: 'pending_confirmation' } }),
        prisma.marketplaceOrder.count({ where: { ...where, status: 'confirmed' } }),
        prisma.marketplaceOrder.count({ where: { ...where, status: 'processing' } }),
        prisma.marketplaceOrder.count({ where: { ...where, status: 'shipped' } }),
        prisma.marketplaceOrder.count({ where: { ...where, status: 'delivered' } }),
        prisma.marketplaceOrder.count({ where: { ...where, status: 'closed' } }),
        prisma.marketplaceOrder.count({ where: { ...where, status: 'cancelled' } }),
      ]);

    return {
      success: true,
      stats: { total, pending, confirmed, processing, shipped, delivered, closed, cancelled },
    };
  } catch (error) {
    apiLogger.error('Error getting order stats:', error);
    return { success: false, error: 'Failed to get order statistics' };
  }
}

// =============================================================================
// Stage 5: Fulfillment Operations
// =============================================================================

/**
 * Validate status transition
 */
function isValidTransition(currentStatus: string, newStatus: string): boolean {
  const validNext = VALID_TRANSITIONS[currentStatus];
  return validNext ? validNext.includes(newStatus) : false;
}

/**
 * Seller rejects an order (moves from pending_confirmation to cancelled)
 */
export async function rejectOrder(input: RejectOrderInput): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Use sellerIds array if provided, otherwise fall back to single sellerId
    const sellerIdArray = input.sellerIds?.length ? input.sellerIds : [input.sellerId];
    if (!sellerIdArray.includes(order.sellerId)) {
      return { success: false, error: 'Unauthorized: You do not own this order' };
    }

    if (order.status !== 'pending_confirmation') {
      return {
        success: false,
        error: `Cannot reject order in "${order.status}" status. Only pending orders can be rejected.`,
      };
    }

    const updatedOrder = await prisma.marketplaceOrder.update({
      where: { id: input.orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        rejectionReason: input.reason,
      },
    });

    // Log audit
    await logOrderAudit(
      input.orderId,
      'rejected',
      'seller',
      input.sellerId,
      'pending_confirmation',
      'cancelled',
      { reason: input.reason }
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    apiLogger.error('Error rejecting order:', error);
    return { success: false, error: 'Failed to reject order' };
  }
}

/**
 * Seller starts processing an order (moves from confirmed to processing)
 */
export async function startProcessing(input: StartProcessingInput): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Use sellerIds array if provided, otherwise fall back to single sellerId
    const sellerIdArray = input.sellerIds?.length ? input.sellerIds : [input.sellerId];
    if (!sellerIdArray.includes(order.sellerId)) {
      return { success: false, error: 'Unauthorized: You do not own this order' };
    }

    if (!isValidTransition(order.status, 'processing')) {
      return {
        success: false,
        error: `Cannot start processing from "${order.status}" status. Order must be confirmed first.`,
      };
    }

    const updatedOrder = await prisma.marketplaceOrder.update({
      where: { id: input.orderId },
      data: {
        status: 'processing',
        processingAt: new Date(),
        fulfillmentStatus: 'picking',
        sellerNotes: input.sellerNotes || order.sellerNotes,
      },
    });

    // Log audit
    await logOrderAudit(
      input.orderId,
      'processing_started',
      'seller',
      input.sellerId,
      'confirmed',
      'processing'
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    apiLogger.error('Error starting processing:', error);
    return { success: false, error: 'Failed to start processing' };
  }
}

/**
 * Seller ships an order (moves from processing to shipped)
 */
export async function shipOrder(input: ShipOrderInput): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Use sellerIds array if provided, otherwise fall back to single sellerId
    const sellerIdArray = input.sellerIds?.length ? input.sellerIds : [input.sellerId];
    if (!sellerIdArray.includes(order.sellerId)) {
      return { success: false, error: 'Unauthorized: You do not own this order' };
    }

    if (!isValidTransition(order.status, 'shipped')) {
      return {
        success: false,
        error: `Cannot ship from "${order.status}" status. Order must be in processing first.`,
      };
    }

    // Carrier is required
    if (!input.carrier || input.carrier.trim() === '') {
      return { success: false, error: 'Carrier name is required' };
    }

    const updatedOrder = await prisma.marketplaceOrder.update({
      where: { id: input.orderId },
      data: {
        status: 'shipped',
        shippedAt: new Date(),
        shipmentDate: new Date(),
        carrier: input.carrier,
        trackingNumber: input.trackingNumber || null,
        estimatedDelivery: input.estimatedDelivery || null,
        fulfillmentStatus: 'shipped',
        sellerNotes: input.sellerNotes || order.sellerNotes,
        daysToShip: order.confirmedAt
          ? Math.ceil((Date.now() - new Date(order.confirmedAt).getTime()) / (24 * 60 * 60 * 1000))
          : null,
      },
    });

    // Log audit
    await logOrderAudit(
      input.orderId,
      'shipped',
      'seller',
      input.sellerId,
      'processing',
      'shipped',
      {
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        estimatedDelivery: input.estimatedDelivery,
      }
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    apiLogger.error('Error shipping order:', error);
    return { success: false, error: 'Failed to ship order' };
  }
}

/**
 * Mark order as delivered (buyer action or system auto-confirm)
 */
export async function markDelivered(input: MarkDeliveredInput): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Authorization: buyer must own the order, seller must be the seller
    if (input.userRole === 'buyer' && order.buyerId !== input.userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this order' };
    }
    if (input.userRole === 'seller' && order.sellerId !== input.userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this order' };
    }

    if (!isValidTransition(order.status, 'delivered')) {
      return {
        success: false,
        error: `Cannot mark as delivered from "${order.status}" status. Order must be shipped first.`,
      };
    }

    const updatedOrder = await prisma.marketplaceOrder.update({
      where: { id: input.orderId },
      data: {
        status: 'delivered',
        deliveredAt: new Date(),
        fulfillmentStatus: 'delivered',
        deliveryConfirmedBy: input.userRole,
        buyerNotes: input.buyerNotes || order.buyerNotes,
        daysToDeliver: order.shippedAt
          ? Math.ceil((Date.now() - new Date(order.shippedAt).getTime()) / (24 * 60 * 60 * 1000))
          : null,
      },
    });

    // Log audit
    await logOrderAudit(
      input.orderId,
      'delivered',
      input.userRole === 'system' ? 'system' : 'buyer',
      input.userId,
      'shipped',
      'delivered',
      { confirmedBy: input.userRole }
    );

    // Stage 6: Auto-generate invoice on delivery
    try {
      const invoiceResult = await marketplaceInvoiceService.createFromDeliveredOrder(input.orderId);
      if (invoiceResult.success) {
        apiLogger.info(`Invoice ${invoiceResult.invoice?.invoiceNumber} created for order ${input.orderId}`);
      } else {
        apiLogger.warn(`Failed to create invoice for order ${input.orderId}: ${invoiceResult.error}`);
      }
    } catch (invoiceError) {
      // Don't fail the delivery if invoice creation fails
      apiLogger.error('Invoice creation error:', invoiceError);
    }

    return { success: true, order: updatedOrder };
  } catch (error) {
    apiLogger.error('Error marking delivered:', error);
    return { success: false, error: 'Failed to mark order as delivered' };
  }
}

/**
 * Close an order (system action after delivery)
 * Makes the order read-only and feeds analytics
 */
export async function closeOrder(input: CloseOrderInput): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!isValidTransition(order.status, 'closed')) {
      return {
        success: false,
        error: `Cannot close order from "${order.status}" status. Order must be delivered first.`,
      };
    }

    const updatedOrder = await prisma.marketplaceOrder.update({
      where: { id: input.orderId },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    // Log audit
    await logOrderAudit(
      input.orderId,
      'closed',
      'system',
      input.actorId || null,
      'delivered',
      'closed'
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    apiLogger.error('Error closing order:', error);
    return { success: false, error: 'Failed to close order' };
  }
}

/**
 * Cancel an order (seller action, only before shipping)
 */
export async function cancelOrder(
  orderId: string,
  sellerIds: string | string[],
  reason: string
): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const sellerIdArray = Array.isArray(sellerIds) ? sellerIds : [sellerIds];
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!sellerIdArray.includes(order.sellerId)) {
      return { success: false, error: 'Unauthorized: You do not own this order' };
    }

    // Can only cancel before shipping
    const cancellableStatuses = ['pending_confirmation', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return {
        success: false,
        error: `Cannot cancel order in "${order.status}" status. Orders can only be cancelled before shipping.`,
      };
    }

    const updatedOrder = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Log audit
    await logOrderAudit(
      orderId,
      'cancelled',
      'seller',
      order.sellerId,
      order.status,
      'cancelled',
      { reason }
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    apiLogger.error('Error cancelling order:', error);
    return { success: false, error: 'Failed to cancel order' };
  }
}

/**
 * Update tracking information (seller action)
 */
export async function updateTracking(
  orderId: string,
  sellerIds: string | string[],
  trackingNumber: string,
  carrier?: string
): Promise<{
  success: boolean;
  order?: Prisma.MarketplaceOrderGetPayload<{}>;
  error?: string;
}> {
  try {
    const sellerIdArray = Array.isArray(sellerIds) ? sellerIds : [sellerIds];
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!sellerIdArray.includes(order.sellerId)) {
      return { success: false, error: 'Unauthorized: You do not own this order' };
    }

    // Can only update tracking for shipped orders
    if (order.status !== 'shipped') {
      return {
        success: false,
        error: `Cannot update tracking for order in "${order.status}" status`,
      };
    }

    const updatedOrder = await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        carrier: carrier || order.carrier,
      },
    });

    // Log audit
    await logOrderAudit(
      orderId,
      'tracking_added',
      'seller',
      order.sellerId,
      order.trackingNumber || '',
      trackingNumber,
      { carrier: carrier || order.carrier }
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    apiLogger.error('Error updating tracking:', error);
    return { success: false, error: 'Failed to update tracking' };
  }
}

export const marketplaceOrderService = {
  // Stage 4: Quote acceptance
  acceptQuote,
  rejectQuote,

  // Order retrieval
  getOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderHistory,
  getOrderStats,

  // Stage 5: Fulfillment lifecycle
  confirmOrder,
  rejectOrder,
  startProcessing,
  shipOrder,
  markDelivered,
  closeOrder,
  cancelOrder,
  updateTracking,
};

export default marketplaceOrderService;
