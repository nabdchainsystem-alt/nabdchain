// =============================================================================
// Order Routes - Marketplace Orders API
// =============================================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { idempotency } from '../middleware/idempotencyMiddleware';
import { orderService, OrderStatus, PaymentStatus, FulfillmentStatus, OrderSource } from '../services/orderService';
import orderHealthService, { OrderHealthStatus, ExceptionSeverity } from '../services/orderHealthService';
import { portalNotificationService, PortalNotificationType } from '../services/portalNotificationService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const orderStatusEnum = z.enum([
  'pending_confirmation',
  'confirmed',
  'in_progress',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
  'refunded',
]);

const paymentStatusEnum = z.enum(['unpaid', 'authorized', 'paid', 'refunded']);
const fulfillmentStatusEnum = z.enum(['not_started', 'packing', 'out_for_delivery', 'delivered']);
const sourceEnum = z.enum(['rfq', 'direct_buy']);

const shippingAddressSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  street1: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  phone: z.string().optional(),
});

const createOrderSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  shippingAddress: shippingAddressSchema.optional(),
  buyerNotes: z.string().max(2000).optional(),
  source: sourceEnum.default('direct_buy'),
  rfqId: z.string().uuid().optional(),
  rfqNumber: z.string().optional(),
});

const shipOrderSchema = z.object({
  trackingNumber: z.string().min(1),
  carrier: z.string().min(1),
  estimatedDelivery: z.string().optional(),
  sellerNotes: z.string().max(2000).optional(),
});

const updateOrderSchema = z.object({
  status: orderStatusEnum.optional(),
  fulfillmentStatus: fulfillmentStatusEnum.optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  sellerNotes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
});

// =============================================================================
// Seller Routes
// =============================================================================

/**
 * GET /api/orders/seller
 * Get all orders for the authenticated seller
 */
router.get('/seller', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { status, paymentStatus, fulfillmentStatus, source, search, dateFrom, dateTo, buyerId } = req.query;

    const orders = await orderService.getSellerOrders(sellerId, {
      status: status as OrderStatus | undefined,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      fulfillmentStatus: fulfillmentStatus as FulfillmentStatus | undefined,
      source: source as OrderSource | undefined,
      search: search as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
      buyerId: buyerId as string | undefined,
    });

    res.json(orders);
  } catch (error) {
    apiLogger.error('Error fetching seller orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/seller/stats
 * Get seller order statistics
 */
router.get('/seller/stats', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const stats = await orderService.getSellerOrderStats(sellerId);
    res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching seller order stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/orders/seller/:id
 * Get single order for seller
 */
router.get('/seller/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const order = await orderService.getSellerOrder(sellerId, orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    apiLogger.error('Error fetching seller order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * POST /api/orders/seller/:id/confirm
 * Confirm order (seller)
 */
router.post('/seller/:id/confirm', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const order = await orderService.confirmOrder(sellerId, orderId);
    res.json(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('cannot be confirmed')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

/**
 * POST /api/orders/seller/:id/ship
 * Ship order (seller)
 * Protected by idempotency to prevent duplicate shipments
 */
router.post('/seller/:id/ship', requireAuth, idempotency({ entityType: 'order_ship' }), async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const data = shipOrderSchema.parse(req.body);

    const order = await orderService.shipOrder(sellerId, orderId, data);
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('cannot be shipped')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error shipping order:', error);
    res.status(500).json({ error: 'Failed to ship order' });
  }
});

/**
 * POST /api/orders/seller/:id/deliver
 * Mark order as delivered (seller)
 * Protected by idempotency to prevent duplicate delivery confirmations
 */
router.post('/seller/:id/deliver', requireAuth, idempotency({ entityType: 'order_deliver' }), async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const order = await orderService.markDelivered(sellerId, orderId);
    res.json(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('cannot be marked')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error marking order delivered:', error);
    res.status(500).json({ error: 'Failed to mark order as delivered' });
  }
});

/**
 * POST /api/orders/seller/:id/cancel
 * Cancel order (seller)
 */
router.post('/seller/:id/cancel', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const { reason } = req.body;

    const order = await orderService.cancelOrder(sellerId, orderId, reason);
    res.json(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('cannot be cancelled')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

/**
 * PUT /api/orders/seller/:id
 * Update order details (seller)
 */
router.put('/seller/:id', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const data = updateOrderSchema.parse(req.body);

    const order = await orderService.updateOrder(sellerId, orderId, data);
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Cannot transition')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/**
 * POST /api/orders/seller/:id/status
 * Update order status (seller)
 */
router.post('/seller/:id/status', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const { status } = req.body;

    const parsedStatus = orderStatusEnum.parse(status);
    const order = await orderService.updateOrderStatus(sellerId, orderId, parsedStatus);

    // Notify buyer of order status change
    if (order?.buyerId) {
      const statusNotificationMap: Record<string, PortalNotificationType> = {
        confirmed: 'order_confirmed',
        shipped: 'order_shipped',
        delivered: 'order_delivered',
        cancelled: 'order_cancelled',
      };
      const notificationType = statusNotificationMap[parsedStatus];
      if (notificationType) {
        portalNotificationService.create({
          userId: order.buyerId,
          portalType: 'buyer',
          type: notificationType,
          entityType: 'order',
          entityId: order.id,
          entityName: `Order #${order.orderNumber}`,
          actorId: sellerId,
        }).catch(err => apiLogger.error('Failed to create order notification:', err));
      }
    }

    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Cannot transition')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// =============================================================================
// Buyer Routes
// =============================================================================

/**
 * GET /api/orders/buyer
 * Get all orders for the authenticated buyer
 */
router.get('/buyer', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const { status, paymentStatus, search } = req.query;

    const orders = await orderService.getBuyerOrders(buyerId, {
      status: status as OrderStatus | undefined,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      search: search as string | undefined,
    });

    res.json(orders);
  } catch (error) {
    apiLogger.error('Error fetching buyer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/buyer/stats
 * Get buyer order statistics
 */
router.get('/buyer/stats', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const stats = await orderService.getBuyerOrderStats(buyerId);
    res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching buyer order stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/orders/buyer/dashboard
 * Get buyer dashboard summary with KPIs and trends
 */
router.get('/buyer/dashboard', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const summary = await orderService.getBuyerDashboardSummary(buyerId);
    res.json(summary);
  } catch (error) {
    apiLogger.error('Error fetching buyer dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

/**
 * GET /api/orders/buyer/:id
 * Get single order for buyer
 */
router.get('/buyer/:id', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const order = await orderService.getBuyerOrder(buyerId, orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    apiLogger.error('Error fetching buyer order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * POST /api/orders
 * Create new order (buyer)
 */
router.post('/', requireAuth, async (req, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const buyerId = authReq.auth.userId;
    const data = createOrderSchema.parse(req.body);

    // Default buyer info - would be fetched from user profile in production
    const buyerInfo = {
      name: 'Buyer',
      email: undefined,
      company: undefined,
    };

    const order = await orderService.createOrder(buyerId, buyerInfo, data);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * POST /api/orders/buyer/:id/cancel
 * Cancel order (buyer - only pending)
 */
router.post('/buyer/:id/cancel', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const { reason } = req.body;

    const order = await orderService.cancelOrderByBuyer(buyerId, orderId, reason);
    res.json(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only pending')) {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// =============================================================================
// Order Health Routes
// =============================================================================

/**
 * GET /api/orders/seller/health-summary
 * Get order health summary for seller
 */
router.get('/seller/health-summary', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const summary = await orderHealthService.getOrderHealthSummary(sellerId);

    res.json(summary);
  } catch (error) {
    apiLogger.error('Error fetching health summary:', error);
    res.status(500).json({ error: 'Failed to fetch health summary' });
  }
});

/**
 * GET /api/orders/seller/exceptions
 * Get active exceptions for seller
 */
router.get('/seller/exceptions', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { severity } = req.query;

    const exceptions = await orderHealthService.getActiveExceptions(
      sellerId,
      severity as ExceptionSeverity | undefined
    );

    res.json(exceptions);
  } catch (error) {
    apiLogger.error('Error fetching exceptions:', error);
    res.status(500).json({ error: 'Failed to fetch exceptions' });
  }
});

/**
 * GET /api/orders/seller/with-health
 * Get orders with health data
 */
router.get('/seller/with-health', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { healthStatus, hasException, status } = req.query;

    const orders = await orderHealthService.getOrdersWithHealth(sellerId, {
      healthStatus: healthStatus as OrderHealthStatus | undefined,
      hasException: hasException === 'true' ? true : hasException === 'false' ? false : undefined,
      status: status as string | undefined,
    });

    res.json(orders);
  } catch (error) {
    apiLogger.error('Error fetching orders with health:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * POST /api/orders/seller/:id/calculate-health
 * Calculate/update health for a specific order
 */
router.post('/seller/:id/calculate-health', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const result = await orderHealthService.calculateOrderHealth(orderId, sellerId);

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Order not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error calculating order health:', error);
    res.status(500).json({ error: 'Failed to calculate order health' });
  }
});

const resolveExceptionSchema = z.object({
  resolution: z.string().min(1).max(2000),
});

/**
 * POST /api/orders/seller/:id/resolve-exception
 * Resolve an exception on an order
 */
router.post('/seller/:id/resolve-exception', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;
    const data = resolveExceptionSchema.parse(req.body);

    const order = await orderHealthService.resolveException(orderId, sellerId, data.resolution);

    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    if (error instanceof Error) {
      if (error.message === 'Order not found or unauthorized') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Order has no active exception') {
        return res.status(400).json({ error: error.message });
      }
    }
    apiLogger.error('Error resolving exception:', error);
    res.status(500).json({ error: 'Failed to resolve exception' });
  }
});

/**
 * POST /api/orders/seller/update-health-batch
 * Batch update health for all active orders
 */
router.post('/seller/update-health-batch', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const result = await orderHealthService.updateOrderHealthBatch(sellerId);

    res.json(result);
  } catch (error) {
    apiLogger.error('Error updating health batch:', error);
    res.status(500).json({ error: 'Failed to update health batch' });
  }
});

/**
 * GET /api/orders/seller/:id/rfq-history
 * Get RFQ negotiation history for an order (if from RFQ)
 */
router.get('/seller/:id/rfq-history', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const orderId = req.params.id as string;

    const rfqHistory = await orderHealthService.getRFQNegotiationHistory(orderId, sellerId);

    if (!rfqHistory) {
      return res.json({ message: 'Order not from RFQ', rfq: null });
    }

    res.json(rfqHistory);
  } catch (error) {
    if (error instanceof Error && error.message === 'Order not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    apiLogger.error('Error fetching RFQ history:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ history' });
  }
});

/**
 * GET /api/orders/seller/health-rules
 * Get seller's order health rules
 */
router.get('/seller/health-rules', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;

    const rules = await orderHealthService.getOrCreateHealthRules(sellerId);

    res.json(rules);
  } catch (error) {
    apiLogger.error('Error fetching health rules:', error);
    res.status(500).json({ error: 'Failed to fetch health rules' });
  }
});

export default router;
