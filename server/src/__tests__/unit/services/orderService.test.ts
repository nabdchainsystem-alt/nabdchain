/**
 * Order Service — Unit Tests
 *
 * Tests cover: status helpers, order CRUD, state transitions, audit logging,
 * and error handling. Prisma is fully mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

// vi.mock must be in the test file for proper hoisting
vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  orderService,
  canTransitionTo,
  canConfirmOrder,
  canShipOrder,
  canCancelOrder,
  canMarkDelivered,
  isTerminalStatus,
} from '../../../services/orderService';

import { createMockOrder, createMockItem, createMockAudit } from '../../factories';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Pure helper functions (no Prisma)
// =============================================================================

describe('Order status helpers', () => {
  describe('canTransitionTo', () => {
    it('allows pending_confirmation → confirmed', () => {
      expect(canTransitionTo('pending_confirmation', 'confirmed')).toBe(true);
    });

    it('allows pending_confirmation → cancelled', () => {
      expect(canTransitionTo('pending_confirmation', 'cancelled')).toBe(true);
    });

    it('disallows pending_confirmation → shipped', () => {
      expect(canTransitionTo('pending_confirmation', 'shipped')).toBe(false);
    });

    it('allows confirmed → in_progress', () => {
      expect(canTransitionTo('confirmed', 'in_progress')).toBe(true);
    });

    it('allows shipped → delivered', () => {
      expect(canTransitionTo('shipped', 'delivered')).toBe(true);
    });

    it('disallows delivered → shipped (no going back)', () => {
      expect(canTransitionTo('delivered', 'shipped')).toBe(false);
    });

    it('disallows transitions from terminal states', () => {
      expect(canTransitionTo('cancelled', 'confirmed')).toBe(false);
      expect(canTransitionTo('refunded', 'pending_confirmation')).toBe(false);
    });
  });

  describe('canConfirmOrder', () => {
    it('returns true for pending_confirmation', () => {
      expect(canConfirmOrder('pending_confirmation')).toBe(true);
    });
    it('returns false for confirmed', () => {
      expect(canConfirmOrder('confirmed')).toBe(false);
    });
  });

  describe('canShipOrder', () => {
    it('returns true for confirmed', () => {
      expect(canShipOrder('confirmed')).toBe(true);
    });
    it('returns true for in_progress', () => {
      expect(canShipOrder('in_progress')).toBe(true);
    });
    it('returns false for shipped', () => {
      expect(canShipOrder('shipped')).toBe(false);
    });
  });

  describe('canCancelOrder', () => {
    it('returns true for pending, confirmed, in_progress', () => {
      expect(canCancelOrder('pending_confirmation')).toBe(true);
      expect(canCancelOrder('confirmed')).toBe(true);
      expect(canCancelOrder('in_progress')).toBe(true);
    });
    it('returns false for shipped', () => {
      expect(canCancelOrder('shipped')).toBe(false);
    });
  });

  describe('canMarkDelivered', () => {
    it('returns true only for shipped', () => {
      expect(canMarkDelivered('shipped')).toBe(true);
      expect(canMarkDelivered('confirmed')).toBe(false);
    });
  });

  describe('isTerminalStatus', () => {
    it('returns true for cancelled, failed, refunded, delivered', () => {
      expect(isTerminalStatus('cancelled')).toBe(true);
      expect(isTerminalStatus('failed')).toBe(true);
      expect(isTerminalStatus('refunded')).toBe(true);
      expect(isTerminalStatus('delivered')).toBe(true);
    });
    it('returns false for in-flight statuses', () => {
      expect(isTerminalStatus('pending_confirmation')).toBe(false);
      expect(isTerminalStatus('confirmed')).toBe(false);
      expect(isTerminalStatus('shipped')).toBe(false);
    });
  });
});

// =============================================================================
// Service methods (Prisma mocked)
// =============================================================================

describe('orderService', () => {
  // ---------------------------------------------------------------------------
  // getSellerOrders
  // ---------------------------------------------------------------------------

  describe('getSellerOrders', () => {
    it('returns orders for a seller', async () => {
      const orders = [createMockOrder(), createMockOrder({ id: 'o2', orderNumber: 'ORD-2026-0002' })];
      prismaMock.marketplaceOrder.findMany.mockResolvedValue(orders);
      prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
      prismaMock.item.findMany.mockResolvedValue([]);

      const result = await orderService.getSellerOrders('seller-1');

      expect(result).toHaveLength(2);
      expect(prismaMock.marketplaceOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sellerId: 'seller-1' } }),
      );
    });

    it('applies status filter', async () => {
      prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
      prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);

      await orderService.getSellerOrders('seller-1', { status: 'confirmed' });

      expect(prismaMock.marketplaceOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sellerId: 'seller-1', status: 'confirmed' }),
        }),
      );
    });

    it('applies search filter across multiple fields', async () => {
      prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
      prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);

      await orderService.getSellerOrders('seller-1', { search: 'widget' });

      const call = prismaMock.marketplaceOrder.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toHaveLength(5);
    });

    it('returns empty array on error', async () => {
      prismaMock.marketplaceOrder.findMany.mockRejectedValue(new Error('DB down'));

      const result = await orderService.getSellerOrders('seller-1');

      expect(result).toEqual([]);
    });

    it('parses shippingAddress JSON', async () => {
      const addr = { street: '123 Main St', city: 'Riyadh' };
      const order = createMockOrder({ shippingAddress: JSON.stringify(addr) });
      prismaMock.marketplaceOrder.findMany.mockResolvedValue([order]);
      prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue([]);
      prismaMock.item.findMany.mockResolvedValue([]);

      const result = await orderService.getSellerOrders('seller-1');

      expect(result[0].shippingAddress).toEqual(addr);
    });
  });

  // ---------------------------------------------------------------------------
  // getSellerOrder (single)
  // ---------------------------------------------------------------------------

  describe('getSellerOrder', () => {
    it('returns null when order not found', async () => {
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(null);

      const result = await orderService.getSellerOrder('seller-1', 'nonexistent');

      expect(result).toBeNull();
    });

    it('returns order with audit log', async () => {
      const order = createMockOrder();
      const audits = [createMockAudit({ orderId: order.id })];
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
      prismaMock.marketplaceOrderAudit.findMany.mockResolvedValue(audits);

      const result = await orderService.getSellerOrder('seller-1', order.id);

      expect(result).not.toBeNull();
      expect(result!.auditLog).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // createOrder
  // ---------------------------------------------------------------------------

  describe('createOrder', () => {
    it('creates an order and audit entry', async () => {
      const item = createMockItem();
      const createdOrder = createMockOrder({ id: 'new-order' });

      prismaMock.item.findFirst.mockResolvedValue(item);
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(null); // for generateOrderNumber
      prismaMock.marketplaceOrder.create.mockResolvedValue(createdOrder);
      prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

      const result = await orderService.createOrder(
        'buyer-1',
        { name: 'Test Buyer', email: 'b@test.com', company: 'Corp' },
        { itemId: 'item-1', quantity: 10, unitPrice: 25, source: 'direct_buy' },
      );

      expect(result.id).toBe('new-order');
      expect(prismaMock.marketplaceOrder.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.marketplaceOrderAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'created', actor: 'buyer' }),
        }),
      );
    });

    it('throws when item not found', async () => {
      prismaMock.item.findFirst.mockResolvedValue(null);

      await expect(
        orderService.createOrder(
          'buyer-1',
          { name: 'Buyer' },
          { itemId: 'missing', quantity: 1, unitPrice: 10 },
        ),
      ).rejects.toThrow('Item not found or not available');
    });
  });

  // ---------------------------------------------------------------------------
  // confirmOrder
  // ---------------------------------------------------------------------------

  describe('confirmOrder', () => {
    it('confirms a pending order', async () => {
      const order = createMockOrder({ status: 'pending_confirmation' });
      const updated = { ...order, status: 'confirmed', confirmedAt: new Date() };

      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
      prismaMock.marketplaceOrder.update.mockResolvedValue(updated);
      prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

      const result = await orderService.confirmOrder('seller-1', order.id);

      expect(result.status).toBe('confirmed');
      expect(prismaMock.marketplaceOrderAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'confirmed', newValue: 'confirmed' }),
        }),
      );
    });

    it('throws when order not found', async () => {
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(null);

      await expect(orderService.confirmOrder('seller-1', 'nope')).rejects.toThrow('Order not found');
    });

    it('throws when order already confirmed', async () => {
      const order = createMockOrder({ status: 'confirmed' });
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);

      await expect(orderService.confirmOrder('seller-1', order.id)).rejects.toThrow(
        'Order cannot be confirmed',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // updateOrderStatus
  // ---------------------------------------------------------------------------

  describe('updateOrderStatus', () => {
    it('transitions from confirmed to in_progress', async () => {
      const order = createMockOrder({ status: 'confirmed' });
      const updated = { ...order, status: 'in_progress' };

      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
      prismaMock.marketplaceOrder.update.mockResolvedValue(updated);
      prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

      const result = await orderService.updateOrderStatus('seller-1', order.id, 'in_progress');

      expect(result.status).toBe('in_progress');
    });

    it('sets deliveredAt and paymentStatus when marking delivered', async () => {
      const order = createMockOrder({ status: 'shipped' });

      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
      prismaMock.marketplaceOrder.update.mockResolvedValue({ ...order, status: 'delivered' });
      prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

      await orderService.updateOrderStatus('seller-1', order.id, 'delivered');

      const updateCall = prismaMock.marketplaceOrder.update.mock.calls[0][0];
      expect(updateCall.data.deliveredAt).toBeInstanceOf(Date);
      expect(updateCall.data.paymentStatus).toBe('paid');
      expect(updateCall.data.fulfillmentStatus).toBe('delivered');
    });

    it('rejects invalid transition', async () => {
      const order = createMockOrder({ status: 'delivered' });
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);

      await expect(
        orderService.updateOrderStatus('seller-1', order.id, 'confirmed'),
      ).rejects.toThrow('Cannot transition');
    });
  });

  // ---------------------------------------------------------------------------
  // shipOrder
  // ---------------------------------------------------------------------------

  describe('shipOrder', () => {
    it('ships a confirmed order with tracking info', async () => {
      const order = createMockOrder({ status: 'confirmed' });
      const updated = { ...order, status: 'shipped', trackingNumber: 'TR-123' };

      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
      prismaMock.marketplaceOrder.update.mockResolvedValue(updated);
      prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

      const result = await orderService.shipOrder('seller-1', order.id, {
        trackingNumber: 'TR-123',
        carrier: 'DHL',
      });

      expect(result.status).toBe('shipped');
      expect(prismaMock.marketplaceOrderAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'shipped',
            metadata: JSON.stringify({ trackingNumber: 'TR-123', carrier: 'DHL' }),
          }),
        }),
      );
    });

    it('rejects shipping a pending order', async () => {
      const order = createMockOrder({ status: 'pending_confirmation' });
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);

      await expect(
        orderService.shipOrder('seller-1', order.id, { trackingNumber: 'X', carrier: 'DHL' }),
      ).rejects.toThrow('Order cannot be shipped');
    });
  });

  // ---------------------------------------------------------------------------
  // markDelivered
  // ---------------------------------------------------------------------------

  describe('markDelivered', () => {
    it('marks a shipped order as delivered and increments item count', async () => {
      const order = createMockOrder({ status: 'shipped' });
      const updated = { ...order, status: 'delivered' };

      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
      prismaMock.marketplaceOrder.update.mockResolvedValue(updated);
      prismaMock.item.update.mockResolvedValue({});
      prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

      const result = await orderService.markDelivered('seller-1', order.id);

      expect(result.status).toBe('delivered');
      expect(prismaMock.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { successfulOrders: { increment: 1 } },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // cancelOrder (seller)
  // ---------------------------------------------------------------------------

  describe('cancelOrder', () => {
    it('cancels a pending order with reason', async () => {
      const order = createMockOrder({ status: 'pending_confirmation', internalNotes: null });
      const updated = { ...order, status: 'cancelled' };

      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
      prismaMock.marketplaceOrder.update.mockResolvedValue(updated);
      prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

      const result = await orderService.cancelOrder('seller-1', order.id, 'Out of stock');

      expect(result.status).toBe('cancelled');
      expect(prismaMock.marketplaceOrderAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: JSON.stringify({ reason: 'Out of stock' }),
          }),
        }),
      );
    });

    it('rejects cancelling a delivered order', async () => {
      const order = createMockOrder({ status: 'delivered' });
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);

      await expect(orderService.cancelOrder('seller-1', order.id)).rejects.toThrow(
        'Order cannot be cancelled',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // cancelOrderByBuyer
  // ---------------------------------------------------------------------------

  describe('cancelOrderByBuyer', () => {
    it('allows buyer to cancel pending order', async () => {
      const order = createMockOrder({ status: 'pending_confirmation' });
      const updated = { ...order, status: 'cancelled' };

      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
      prismaMock.marketplaceOrder.update.mockResolvedValue(updated);
      prismaMock.marketplaceOrderAudit.create.mockResolvedValue({});

      const result = await orderService.cancelOrderByBuyer('buyer-1', order.id, 'Changed my mind');

      expect(result.status).toBe('cancelled');
    });

    it('rejects buyer cancelling a confirmed order', async () => {
      const order = createMockOrder({ status: 'confirmed' });
      prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);

      await expect(orderService.cancelOrderByBuyer('buyer-1', order.id)).rejects.toThrow(
        'Only pending orders can be cancelled by buyer',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getSellerOrderStats
  // ---------------------------------------------------------------------------

  describe('getSellerOrderStats', () => {
    it('aggregates order counts and revenue', async () => {
      prismaMock.marketplaceOrder.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(10) // confirmed
        .mockResolvedValueOnce(8)  // in_progress
        .mockResolvedValueOnce(12) // shipped
        .mockResolvedValueOnce(10) // delivered
        .mockResolvedValueOnce(5); // cancelled

      prismaMock.marketplaceOrder.aggregate.mockResolvedValue({
        _sum: { totalPrice: 25000 },
      });

      const stats = await orderService.getSellerOrderStats('seller-1');

      expect(stats.total).toBe(50);
      expect(stats.delivered).toBe(10);
      expect(stats.totalRevenue).toBe(25000);
      expect(stats.currency).toBe('SAR');
    });

    it('returns empty stats on error', async () => {
      prismaMock.marketplaceOrder.count.mockRejectedValue(new Error('DB error'));

      const stats = await orderService.getSellerOrderStats('seller-1');

      expect(stats.total).toBe(0);
      expect(stats.totalRevenue).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getBuyerOrders
  // ---------------------------------------------------------------------------

  describe('getBuyerOrders', () => {
    it('returns orders for a buyer', async () => {
      const orders = [createMockOrder({ buyerId: 'buyer-1' })];
      prismaMock.marketplaceOrder.findMany.mockResolvedValue(orders);
      prismaMock.item.findMany.mockResolvedValue([]);

      const result = await orderService.getBuyerOrders('buyer-1');

      expect(result).toHaveLength(1);
      expect(prismaMock.marketplaceOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ buyerId: 'buyer-1' }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getBuyerOrderStats
  // ---------------------------------------------------------------------------

  describe('getBuyerOrderStats', () => {
    it('returns buyer order counts', async () => {
      prismaMock.marketplaceOrder.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(10) // delivered
        .mockResolvedValueOnce(2); // cancelled

      const stats = await orderService.getBuyerOrderStats('buyer-1');

      expect(stats.total).toBe(20);
      expect(stats.active).toBe(8);
      expect(stats.delivered).toBe(10);
      expect(stats.cancelled).toBe(2);
    });
  });
});
