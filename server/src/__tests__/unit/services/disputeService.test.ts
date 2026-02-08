/**
 * Dispute Service — Unit Tests
 *
 * Tests cover: dispute creation, status transitions (state machine),
 * seller/buyer responses, escalation, evidence handling, authorization checks,
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

import { disputeService } from '../../../services/disputeService';
import { createMockOrder, createMockDispute } from '../../factories';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Service methods (Prisma mocked)
// =============================================================================

describe('disputeService', () => {
  // ---------------------------------------------------------------------------
  // createDispute
  // ---------------------------------------------------------------------------

  describe('createDispute', () => {
    it('creates a dispute on a delivered order', async () => {
      const order = createMockOrder({
        id: 'order-1',
        status: 'delivered',
        buyerId: 'buyer-1',
        deliveredAt: new Date(),
      });
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
      prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null);
      prismaMock.marketplaceDispute.findFirst.mockResolvedValue(null); // no existing dispute
      prismaMock.marketplaceDispute.findFirst.mockResolvedValue(null); // for generateDisputeNumber
      prismaMock.marketplaceDispute.create.mockResolvedValue(createMockDispute({ id: 'dispute-1' }));
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});
      prismaMock.marketplaceOrder.update.mockResolvedValue({});

      const result = await disputeService.createDispute({
        orderId: 'order-1',
        buyerId: 'buyer-1',
        reason: 'damaged_goods',
        description: 'Items arrived damaged',
      });

      expect(result.success).toBe(true);
      expect(result.dispute).toBeDefined();
    });

    it('rejects when order not found', async () => {
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

      const result = await disputeService.createDispute({
        orderId: 'nonexistent',
        buyerId: 'buyer-1',
        reason: 'damaged_goods',
        description: 'Items arrived damaged',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });

    it('rejects when buyer does not own order', async () => {
      const order = createMockOrder({ buyerId: 'other-buyer', status: 'delivered' });
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

      const result = await disputeService.createDispute({
        orderId: 'order-1',
        buyerId: 'buyer-1',
        reason: 'damaged_goods',
        description: 'Items arrived damaged',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You can only open disputes on your own orders');
    });

    it('rejects on non-delivered order', async () => {
      const order = createMockOrder({ buyerId: 'buyer-1', status: 'shipped' });
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);

      const result = await disputeService.createDispute({
        orderId: 'order-1',
        buyerId: 'buyer-1',
        reason: 'damaged_goods',
        description: 'Items arrived damaged',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Disputes can only be opened on delivered orders');
    });

    it('rejects when active dispute already exists', async () => {
      const order = createMockOrder({ buyerId: 'buyer-1', status: 'delivered', deliveredAt: new Date() });
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
      prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null);
      prismaMock.marketplaceDispute.findFirst.mockResolvedValue(createMockDispute()); // existing dispute

      const result = await disputeService.createDispute({
        orderId: 'order-1',
        buyerId: 'buyer-1',
        reason: 'damaged_goods',
        description: 'Items arrived damaged',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('An active dispute already exists for this order');
    });

    it('rejects when dispute window has expired', async () => {
      const deliveredAt = new Date();
      deliveredAt.setDate(deliveredAt.getDate() - 15); // 15 days ago, window is 14
      const order = createMockOrder({ buyerId: 'buyer-1', status: 'delivered', deliveredAt });
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(order);
      prismaMock.marketplaceInvoice.findUnique.mockResolvedValue(null);
      prismaMock.marketplaceDispute.findFirst.mockResolvedValue(null);

      const result = await disputeService.createDispute({
        orderId: 'order-1',
        buyerId: 'buyer-1',
        reason: 'damaged_goods',
        description: 'Items arrived damaged',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Dispute window has expired (14 days after delivery)');
    });
  });

  // ---------------------------------------------------------------------------
  // getDispute
  // ---------------------------------------------------------------------------

  describe('getDispute', () => {
    it('returns dispute for authorized buyer', async () => {
      const dispute = createMockDispute({
        buyerId: 'buyer-1',
        evidence: JSON.stringify([{ id: 'e1', name: 'photo.jpg' }]),
      });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue({
        ...dispute,
        returnRequest: null,
        events: [],
      });

      const result = await disputeService.getDispute('dispute-1', 'buyer-1');

      expect(result).not.toBeNull();
      expect(result!.evidence).toEqual([{ id: 'e1', name: 'photo.jpg' }]);
    });

    it('returns null for unauthorized user', async () => {
      const dispute = createMockDispute({ buyerId: 'buyer-1', sellerId: 'seller-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue({
        ...dispute,
        returnRequest: null,
        events: [],
      });

      const result = await disputeService.getDispute('dispute-1', 'other-user');

      expect(result).toBeNull();
    });

    it('returns null when dispute not found', async () => {
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(null);

      const result = await disputeService.getDispute('nonexistent', 'buyer-1');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // markAsUnderReview
  // ---------------------------------------------------------------------------

  describe('markAsUnderReview', () => {
    it('transitions open dispute to under_review', async () => {
      const dispute = createMockDispute({ status: 'open', sellerId: 'seller-1' });
      const updated = { ...dispute, status: 'under_review' };
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
      prismaMock.marketplaceDispute.update.mockResolvedValue(updated);
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});

      const result = await disputeService.markAsUnderReview('dispute-1', 'seller-1');

      expect(result.success).toBe(true);
      expect(result.dispute!.status).toBe('under_review');
    });

    it('rejects when seller is not authorized', async () => {
      const dispute = createMockDispute({ sellerId: 'seller-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.markAsUnderReview('dispute-1', 'other-seller');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('rejects invalid transition', async () => {
      const dispute = createMockDispute({ status: 'resolved', sellerId: 'seller-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.markAsUnderReview('dispute-1', 'seller-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition');
    });
  });

  // ---------------------------------------------------------------------------
  // sellerRespond
  // ---------------------------------------------------------------------------

  describe('sellerRespond', () => {
    it('allows seller to propose resolution', async () => {
      const dispute = createMockDispute({ status: 'under_review', sellerId: 'seller-1' });
      const updated = { ...dispute, status: 'seller_responded' };
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
      prismaMock.marketplaceDispute.update.mockResolvedValue(updated);
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});

      const result = await disputeService.sellerRespond({
        disputeId: 'dispute-1',
        sellerId: 'seller-1',
        responseType: 'propose_resolution',
        response: 'We will refund half',
        proposedResolution: 'partial_refund',
        proposedAmount: 125,
      });

      expect(result.success).toBe(true);
    });

    it('auto-resolves when seller accepts responsibility', async () => {
      const dispute = createMockDispute({ status: 'under_review', sellerId: 'seller-1' });
      const updated = { ...dispute, status: 'resolved' };
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
      prismaMock.marketplaceDispute.update.mockResolvedValue(updated);
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});

      const result = await disputeService.sellerRespond({
        disputeId: 'dispute-1',
        sellerId: 'seller-1',
        responseType: 'accept_responsibility',
        response: 'We accept fault',
        proposedResolution: 'full_refund',
        proposedAmount: 250,
      });

      expect(result.success).toBe(true);
      const updateCall = prismaMock.marketplaceDispute.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('resolved');
      expect(updateCall.data.resolvedBy).toBe('seller_accepted');
    });

    it('rejects when dispute is not in respondable state', async () => {
      const dispute = createMockDispute({ status: 'resolved', sellerId: 'seller-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.sellerRespond({
        disputeId: 'dispute-1',
        sellerId: 'seller-1',
        responseType: 'reject',
        response: 'Not our fault',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Dispute is not in a respondable state');
    });
  });

  // ---------------------------------------------------------------------------
  // buyerAcceptResolution
  // ---------------------------------------------------------------------------

  describe('buyerAcceptResolution', () => {
    it('buyer accepts seller proposed resolution', async () => {
      const dispute = createMockDispute({
        status: 'seller_responded',
        buyerId: 'buyer-1',
        sellerResponseType: 'propose_resolution',
        sellerProposedResolution: 'partial_refund',
        sellerProposedAmount: 125,
      });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
      prismaMock.marketplaceDispute.update.mockResolvedValue({ ...dispute, status: 'resolved' });
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});

      const result = await disputeService.buyerAcceptResolution('dispute-1', 'buyer-1');

      expect(result.success).toBe(true);
    });

    it('rejects when no pending resolution', async () => {
      const dispute = createMockDispute({ status: 'open', buyerId: 'buyer-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.buyerAcceptResolution('dispute-1', 'buyer-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No pending resolution to accept');
    });

    it('rejects when seller did not propose resolution', async () => {
      const dispute = createMockDispute({
        status: 'seller_responded',
        buyerId: 'buyer-1',
        sellerResponseType: 'reject',
      });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.buyerAcceptResolution('dispute-1', 'buyer-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Seller did not propose a resolution');
    });
  });

  // ---------------------------------------------------------------------------
  // buyerRejectResolution
  // ---------------------------------------------------------------------------

  describe('buyerRejectResolution', () => {
    it('buyer rejects seller response', async () => {
      const dispute = createMockDispute({ status: 'seller_responded', buyerId: 'buyer-1' });
      const updated = { ...dispute, status: 'rejected' };
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
      prismaMock.marketplaceDispute.update.mockResolvedValue(updated);
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});

      const result = await disputeService.buyerRejectResolution('dispute-1', 'buyer-1', 'Not acceptable');

      expect(result.success).toBe(true);
    });

    it('rejects when not in seller_responded state', async () => {
      const dispute = createMockDispute({ status: 'open', buyerId: 'buyer-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.buyerRejectResolution('dispute-1', 'buyer-1', 'Reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No pending resolution to reject');
    });
  });

  // ---------------------------------------------------------------------------
  // escalateDispute
  // ---------------------------------------------------------------------------

  describe('escalateDispute', () => {
    it('escalates from seller_responded', async () => {
      const dispute = createMockDispute({ status: 'seller_responded', buyerId: 'buyer-1' });
      const updated = { ...dispute, status: 'escalated', isEscalated: true };
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
      prismaMock.marketplaceDispute.update.mockResolvedValue(updated);
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});

      const result = await disputeService.escalateDispute('dispute-1', 'buyer-1', 'Need platform help');

      expect(result.success).toBe(true);
    });

    it('rejects escalation from closed status', async () => {
      const dispute = createMockDispute({ status: 'closed', buyerId: 'buyer-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.escalateDispute('dispute-1', 'buyer-1', 'Reason');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot escalate');
    });

    it('rejects unauthorized user', async () => {
      const dispute = createMockDispute({ buyerId: 'buyer-1', sellerId: 'seller-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.escalateDispute('dispute-1', 'other-user', 'Reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  // ---------------------------------------------------------------------------
  // closeDispute
  // ---------------------------------------------------------------------------

  describe('closeDispute', () => {
    it('closes a resolved dispute', async () => {
      const dispute = createMockDispute({ status: 'resolved', buyerId: 'buyer-1' });
      const updated = { ...dispute, status: 'closed' };
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
      prismaMock.marketplaceDispute.update.mockResolvedValue(updated);
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});

      const result = await disputeService.closeDispute('dispute-1', 'buyer-1');

      expect(result.success).toBe(true);
    });

    it('rejects closing from under_review', async () => {
      const dispute = createMockDispute({ status: 'under_review', buyerId: 'buyer-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.closeDispute('dispute-1', 'buyer-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot close');
    });
  });

  // ---------------------------------------------------------------------------
  // addEvidence
  // ---------------------------------------------------------------------------

  describe('addEvidence', () => {
    it('adds evidence to open dispute', async () => {
      const dispute = createMockDispute({ status: 'open', buyerId: 'buyer-1', evidence: null });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
      prismaMock.marketplaceDispute.update.mockResolvedValue({ ...dispute, evidence: '[]' });
      prismaMock.marketplaceDisputeEvent.create.mockResolvedValue({});

      const result = await disputeService.addEvidence('dispute-1', 'buyer-1', [
        { id: 'e1', name: 'photo.jpg', type: 'image', url: 'http://img.jpg', uploadedAt: '2026-01-15' },
      ]);

      expect(result.success).toBe(true);
    });

    it('rejects adding evidence to closed dispute', async () => {
      const dispute = createMockDispute({ status: 'closed', buyerId: 'buyer-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.addEvidence('dispute-1', 'buyer-1', []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot add evidence to a closed dispute');
    });

    it('rejects when not the buyer', async () => {
      const dispute = createMockDispute({ status: 'open', buyerId: 'buyer-1' });
      prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);

      const result = await disputeService.addEvidence('dispute-1', 'other-user', []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only the buyer can add evidence');
    });
  });

  // ---------------------------------------------------------------------------
  // getBuyerDisputes / getSellerDisputes
  // ---------------------------------------------------------------------------

  describe('getBuyerDisputes', () => {
    it('returns paginated disputes for buyer', async () => {
      const disputes = [createMockDispute({ evidence: null })];
      prismaMock.marketplaceDispute.findMany.mockResolvedValue(
        disputes.map(d => ({ ...d, returnRequest: null })),
      );
      prismaMock.marketplaceDispute.count.mockResolvedValue(1);

      const result = await disputeService.getBuyerDisputes('buyer-1');

      expect(result.disputes).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('getSellerDisputes', () => {
    it('returns paginated disputes for seller', async () => {
      prismaMock.marketplaceDispute.findMany.mockResolvedValue([]);
      prismaMock.marketplaceDispute.count.mockResolvedValue(0);

      const result = await disputeService.getSellerDisputes('seller-1');

      expect(result.disputes).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('applies status filter', async () => {
      prismaMock.marketplaceDispute.findMany.mockResolvedValue([]);
      prismaMock.marketplaceDispute.count.mockResolvedValue(0);

      await disputeService.getSellerDisputes('seller-1', { status: 'open' });

      const call = prismaMock.marketplaceDispute.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('open');
    });
  });

  // ---------------------------------------------------------------------------
  // getBuyerDisputeStats
  // ---------------------------------------------------------------------------

  describe('getBuyerDisputeStats', () => {
    it('aggregates dispute statistics', async () => {
      prismaMock.marketplaceDispute.groupBy.mockResolvedValue([
        { status: 'open', _count: 3 },
        { status: 'resolved', _count: 5 },
        { status: 'closed', _count: 2 },
      ]);
      prismaMock.marketplaceDispute.findMany.mockResolvedValue([
        { createdAt: new Date('2026-01-01'), closedAt: new Date('2026-01-04') },
      ]);

      const stats = await disputeService.getBuyerDisputeStats('buyer-1');

      expect(stats.total).toBe(10);
      expect(stats.open).toBe(3);
      expect(stats.resolved).toBe(5);
      expect(stats.closed).toBe(2);
      expect(stats.resolutionRate).toBe(70); // (5+2)/10 * 100
      expect(stats.avgResolutionDays).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getDisputeByOrder
  // ---------------------------------------------------------------------------

  describe('getDisputeByOrder', () => {
    it('returns dispute for authorized user', async () => {
      const dispute = createMockDispute({ buyerId: 'buyer-1', evidence: null });
      prismaMock.marketplaceDispute.findFirst.mockResolvedValue({ ...dispute, returnRequest: null });

      const result = await disputeService.getDisputeByOrder('order-1', 'buyer-1');

      expect(result).not.toBeNull();
    });

    it('returns null for unauthorized user', async () => {
      const dispute = createMockDispute({ buyerId: 'buyer-1', sellerId: 'seller-1' });
      prismaMock.marketplaceDispute.findFirst.mockResolvedValue({ ...dispute, returnRequest: null });

      const result = await disputeService.getDisputeByOrder('order-1', 'other-user');

      expect(result).toBeNull();
    });

    it('returns null when no dispute exists', async () => {
      prismaMock.marketplaceDispute.findFirst.mockResolvedValue(null);

      const result = await disputeService.getDisputeByOrder('order-1', 'buyer-1');

      expect(result).toBeNull();
    });
  });
});
