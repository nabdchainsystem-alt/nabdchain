/**
 * Rating Service — Unit Tests
 *
 * Tests cover:
 * - Eligibility checks (order must be delivered + paid)
 * - Rating creation (buyer rates seller, seller rates buyer)
 * - Duplicate prevention (one rating per role per order)
 * - Correct rater/target ID mapping from order
 * - Summary aggregation (avg, distribution, recent)
 * - Order ratings retrieval (both sides)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { ratingService } from '../../../services/ratingService';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Helpers
// =============================================================================

const completedOrder = {
  id: 'order-1',
  orderNumber: 'ORD-2026-0001',
  buyerId: 'buyer-user-1',
  sellerId: 'seller-user-1',
  status: 'delivered',
  paymentStatus: 'paid',
};

const pendingOrder = {
  ...completedOrder,
  status: 'pending_confirmation',
  paymentStatus: 'unpaid',
};

const deliveredUnpaid = {
  ...completedOrder,
  paymentStatus: 'unpaid',
};

// =============================================================================
// checkEligibility
// =============================================================================

describe('ratingService.checkEligibility', () => {
  it('returns all false when order is not found', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const result = await ratingService.checkEligibility('nonexistent');

    expect(result.canBuyerRateSeller).toBe(false);
    expect(result.canSellerRateBuyer).toBe(false);
    expect(result.reasonIfBlocked).toBe('Order not found');
  });

  it('returns all false when order is not completed (pending)', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(pendingOrder);

    const result = await ratingService.checkEligibility('order-1');

    expect(result.canBuyerRateSeller).toBe(false);
    expect(result.canSellerRateBuyer).toBe(false);
    expect(result.reasonIfBlocked).toContain('not yet completed');
  });

  it('returns all false when delivered but not paid', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(deliveredUnpaid);

    const result = await ratingService.checkEligibility('order-1');

    expect(result.canBuyerRateSeller).toBe(false);
    expect(result.canSellerRateBuyer).toBe(false);
    expect(result.reasonIfBlocked).toContain('not yet completed');
  });

  it('returns both can-rate when completed and no existing ratings', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.findMany.mockResolvedValue([]);

    const result = await ratingService.checkEligibility('order-1');

    expect(result.canBuyerRateSeller).toBe(true);
    expect(result.canSellerRateBuyer).toBe(true);
    expect(result.buyerAlreadyRated).toBe(false);
    expect(result.sellerAlreadyRated).toBe(false);
    expect(result.canBuyerRateOrder).toBe(true);
    expect(result.canSellerRateOrder).toBe(true);
    expect(result.buyerOrderRated).toBe(false);
    expect(result.sellerOrderRated).toBe(false);
  });

  it('marks buyer as already rated when BUYER rating exists', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.findMany.mockResolvedValue([
      { raterRole: 'BUYER' },
    ]);

    const result = await ratingService.checkEligibility('order-1');

    expect(result.canBuyerRateSeller).toBe(false);
    expect(result.buyerAlreadyRated).toBe(true);
    expect(result.canSellerRateBuyer).toBe(true);
    expect(result.sellerAlreadyRated).toBe(false);
  });

  it('marks seller as already rated when SELLER rating exists', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.findMany.mockResolvedValue([
      { raterRole: 'SELLER' },
    ]);

    const result = await ratingService.checkEligibility('order-1');

    expect(result.canBuyerRateSeller).toBe(true);
    expect(result.canSellerRateBuyer).toBe(false);
    expect(result.sellerAlreadyRated).toBe(true);
  });

  it('marks both as already rated when both exist', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.findMany.mockResolvedValue([
      { raterRole: 'BUYER' },
      { raterRole: 'SELLER' },
    ]);

    const result = await ratingService.checkEligibility('order-1');

    expect(result.canBuyerRateSeller).toBe(false);
    expect(result.canSellerRateBuyer).toBe(false);
    expect(result.buyerAlreadyRated).toBe(true);
    expect(result.sellerAlreadyRated).toBe(true);
  });

  it('treats "closed" + "paid_cash" as completed', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue({
      ...completedOrder,
      status: 'closed',
      paymentStatus: 'paid_cash',
    });
    prismaMock.marketplaceRating.findMany.mockResolvedValue([]);

    const result = await ratingService.checkEligibility('order-1');

    expect(result.canBuyerRateSeller).toBe(true);
    expect(result.canSellerRateBuyer).toBe(true);
  });
});

// =============================================================================
// createRating
// =============================================================================

describe('ratingService.createRating', () => {
  it('throws when score is out of range', async () => {
    await expect(
      ratingService.createRating('order-1', 'buyer-user-1', 'buyer', { score: 0 }),
    ).rejects.toThrow('Score must be an integer between 1 and 5');

    await expect(
      ratingService.createRating('order-1', 'buyer-user-1', 'buyer', { score: 6 }),
    ).rejects.toThrow('Score must be an integer between 1 and 5');
  });

  it('throws when comment exceeds 280 chars', async () => {
    await expect(
      ratingService.createRating('order-1', 'buyer-user-1', 'buyer', {
        score: 5,
        comment: 'x'.repeat(281),
      }),
    ).rejects.toThrow('Comment must be 280 characters or less');
  });

  it('throws when order not found', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    await expect(
      ratingService.createRating('nonexistent', 'buyer-user-1', 'buyer', { score: 5 }),
    ).rejects.toThrow('Order not found');
  });

  it('throws when order not completed', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(pendingOrder);

    await expect(
      ratingService.createRating('order-1', 'buyer-user-1', 'buyer', { score: 5 }),
    ).rejects.toThrow('Order must be delivered and paid before rating');
  });

  it('throws when buyer is not the order buyer', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);

    await expect(
      ratingService.createRating('order-1', 'wrong-buyer', 'buyer', { score: 5 }),
    ).rejects.toThrow('You are not the buyer for this order');
  });

  it('throws when seller is not the order seller', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);

    await expect(
      ratingService.createRating('order-1', 'wrong-seller', 'seller', { score: 5 }),
    ).rejects.toThrow('You are not the seller for this order');
  });

  it('creates buyer rating of seller with correct IDs', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    const mockRating = {
      id: 'rating-1',
      orderId: 'order-1',
      raterRole: 'BUYER',
      raterId: 'buyer-user-1',
      targetRole: 'SELLER',
      targetId: 'seller-user-1',
      score: 5,
      tags: '["Quality","On-time"]',
      comment: 'Great seller!',
      createdAt: new Date(),
    };
    prismaMock.marketplaceRating.create.mockResolvedValue(mockRating);

    const result = await ratingService.createRating(
      'order-1',
      'buyer-user-1',
      'buyer',
      { score: 5, tags: ['Quality', 'On-time'], comment: 'Great seller!' },
    );

    expect(prismaMock.marketplaceRating.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        raterRole: 'BUYER',
        raterId: 'buyer-user-1',
        targetRole: 'SELLER',
        targetId: 'seller-user-1',
        score: 5,
        tags: '["Quality","On-time"]',
        comment: 'Great seller!',
      },
    });
    expect(result.id).toBe('rating-1');
  });

  it('creates seller rating of buyer with correct IDs', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    const mockRating = {
      id: 'rating-2',
      orderId: 'order-1',
      raterRole: 'SELLER',
      raterId: 'seller-user-1',
      targetRole: 'BUYER',
      targetId: 'buyer-user-1',
      score: 4,
      tags: '["Professional"]',
      comment: null,
      createdAt: new Date(),
    };
    prismaMock.marketplaceRating.create.mockResolvedValue(mockRating);

    const result = await ratingService.createRating(
      'order-1',
      'seller-user-1',
      'seller',
      { score: 4, tags: ['Professional'] },
    );

    expect(prismaMock.marketplaceRating.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        raterRole: 'SELLER',
        raterId: 'seller-user-1',
        targetRole: 'BUYER',
        targetId: 'buyer-user-1',
        score: 4,
        tags: '["Professional"]',
        comment: null,
      },
    });
    expect(result.id).toBe('rating-2');
  });

  it('throws friendly error on duplicate rating (P2002)', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      ratingService.createRating('order-1', 'buyer-user-1', 'buyer', { score: 5 }),
    ).rejects.toThrow('You have already rated this order');
  });

  it('stores null tags when not provided', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.create.mockResolvedValue({
      id: 'rating-3',
      orderId: 'order-1',
      raterRole: 'BUYER',
      raterId: 'buyer-user-1',
      targetRole: 'SELLER',
      targetId: 'seller-user-1',
      score: 3,
      tags: null,
      comment: null,
      createdAt: new Date(),
    });

    await ratingService.createRating('order-1', 'buyer-user-1', 'buyer', { score: 3 });

    expect(prismaMock.marketplaceRating.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: null,
          comment: null,
        }),
      }),
    );
  });
});

// =============================================================================
// getTargetSummary
// =============================================================================

describe('ratingService.getTargetSummary', () => {
  it('returns zeroed summary when no ratings exist', async () => {
    prismaMock.marketplaceRating.findMany.mockResolvedValue([]);

    const summary = await ratingService.getTargetSummary('SELLER', 'seller-1');

    expect(summary.avgScore).toBe(0);
    expect(summary.count).toBe(0);
    expect(summary.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    expect(summary.recent).toEqual([]);
  });

  it('computes correct avg and distribution', async () => {
    const ratings = [
      { id: 'r1', orderId: 'o1', score: 5, tags: null, comment: null, createdAt: new Date() },
      { id: 'r2', orderId: 'o2', score: 4, tags: '["Quality"]', comment: 'Good', createdAt: new Date() },
      { id: 'r3', orderId: 'o3', score: 5, tags: null, comment: null, createdAt: new Date() },
      { id: 'r4', orderId: 'o4', score: 3, tags: null, comment: null, createdAt: new Date() },
    ];
    prismaMock.marketplaceRating.findMany.mockResolvedValue(ratings);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { id: 'o1', orderNumber: 'ORD-001' },
      { id: 'o2', orderNumber: 'ORD-002' },
      { id: 'o3', orderNumber: 'ORD-003' },
      { id: 'o4', orderNumber: 'ORD-004' },
    ]);

    const summary = await ratingService.getTargetSummary('SELLER', 'seller-1');

    // (5+4+5+3)/4 = 4.25 → rounded to 4.3
    expect(summary.avgScore).toBe(4.3);
    expect(summary.count).toBe(4);
    expect(summary.distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 });
    expect(summary.recent).toHaveLength(4);
  });

  it('includes tags and comments in recent reviews', async () => {
    const ratings = [
      { id: 'r1', orderId: 'o1', score: 5, tags: '["On-time","Quality"]', comment: 'Excellent!', createdAt: new Date() },
    ];
    prismaMock.marketplaceRating.findMany.mockResolvedValue(ratings);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([
      { id: 'o1', orderNumber: 'ORD-100' },
    ]);

    const summary = await ratingService.getTargetSummary('SELLER', 'seller-1');

    expect(summary.recent[0].tags).toEqual(['On-time', 'Quality']);
    expect(summary.recent[0].comment).toBe('Excellent!');
    expect(summary.recent[0].orderNumber).toBe('ORD-100');
    expect(summary.recent[0].score).toBe(5);
  });

  it('limits recent to 10 items', async () => {
    const ratings = Array.from({ length: 15 }, (_, i) => ({
      id: `r${i}`,
      orderId: `o${i}`,
      score: 4,
      tags: null,
      comment: null,
      createdAt: new Date(),
    }));
    prismaMock.marketplaceRating.findMany.mockResolvedValue(ratings);
    prismaMock.marketplaceOrder.findMany.mockResolvedValue(
      ratings.slice(0, 10).map((r) => ({ id: r.orderId, orderNumber: `ORD-${r.orderId}` })),
    );

    const summary = await ratingService.getTargetSummary('BUYER', 'buyer-1');

    expect(summary.recent).toHaveLength(10);
    expect(summary.count).toBe(15);
  });
});

// =============================================================================
// getOrderRatings
// =============================================================================

describe('ratingService.getOrderRatings', () => {
  it('returns null for both when no ratings exist', async () => {
    prismaMock.marketplaceRating.findMany.mockResolvedValue([]);

    const result = await ratingService.getOrderRatings('order-1');

    expect(result.buyerRating).toBeNull();
    expect(result.sellerRating).toBeNull();
  });

  it('returns buyer rating when only buyer has rated', async () => {
    prismaMock.marketplaceRating.findMany.mockResolvedValue([
      { id: 'r1', raterRole: 'BUYER', score: 5 },
    ]);

    const result = await ratingService.getOrderRatings('order-1');

    expect(result.buyerRating).toBeTruthy();
    expect(result.buyerRating!.raterRole).toBe('BUYER');
    expect(result.sellerRating).toBeNull();
  });

  it('returns both when both have rated', async () => {
    prismaMock.marketplaceRating.findMany.mockResolvedValue([
      { id: 'r1', raterRole: 'BUYER', score: 5 },
      { id: 'r2', raterRole: 'SELLER', score: 4 },
    ]);

    const result = await ratingService.getOrderRatings('order-1');

    expect(result.buyerRating).toBeTruthy();
    expect(result.sellerRating).toBeTruthy();
    expect(result.buyerRating!.raterRole).toBe('BUYER');
    expect(result.sellerRating!.raterRole).toBe('SELLER');
  });

  it('returns order-experience ratings separately', async () => {
    prismaMock.marketplaceRating.findMany.mockResolvedValue([
      { id: 'r1', raterRole: 'BUYER', score: 5 },
      { id: 'r2', raterRole: 'SELLER', score: 4 },
      { id: 'r3', raterRole: 'BUYER_ORDER', score: 4 },
      { id: 'r4', raterRole: 'SELLER_ORDER', score: 3 },
    ]);

    const result = await ratingService.getOrderRatings('order-1');

    expect(result.buyerRating!.raterRole).toBe('BUYER');
    expect(result.sellerRating!.raterRole).toBe('SELLER');
    expect(result.buyerOrderRating!.raterRole).toBe('BUYER_ORDER');
    expect(result.sellerOrderRating!.raterRole).toBe('SELLER_ORDER');
  });

  it('returns null for order ratings when none exist', async () => {
    prismaMock.marketplaceRating.findMany.mockResolvedValue([
      { id: 'r1', raterRole: 'BUYER', score: 5 },
    ]);

    const result = await ratingService.getOrderRatings('order-1');

    expect(result.buyerRating).toBeTruthy();
    expect(result.buyerOrderRating).toBeNull();
    expect(result.sellerOrderRating).toBeNull();
  });
});

// =============================================================================
// createRating — order experience
// =============================================================================

describe('ratingService.createRating — order experience', () => {
  it('creates buyer order rating with correct raterRole', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.create.mockResolvedValue({
      id: 'rating-order-1',
      orderId: 'order-1',
      raterRole: 'BUYER_ORDER',
      raterId: 'buyer-user-1',
      targetRole: 'ORDER',
      targetId: 'order-1',
      score: 4,
      tags: '["Smooth process"]',
      comment: null,
      createdAt: new Date(),
    });

    await ratingService.createRating(
      'order-1',
      'buyer-user-1',
      'buyer',
      { score: 4, tags: ['Smooth process'], ratingType: 'order' },
    );

    expect(prismaMock.marketplaceRating.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        raterRole: 'BUYER_ORDER',
        targetRole: 'ORDER',
        targetId: 'order-1',
      }),
    });
  });

  it('creates seller order rating with correct raterRole', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.create.mockResolvedValue({
      id: 'rating-order-2',
      orderId: 'order-1',
      raterRole: 'SELLER_ORDER',
      raterId: 'seller-user-1',
      targetRole: 'ORDER',
      targetId: 'order-1',
      score: 5,
      tags: null,
      comment: 'Smooth transaction',
      createdAt: new Date(),
    });

    await ratingService.createRating(
      'order-1',
      'seller-user-1',
      'seller',
      { score: 5, comment: 'Smooth transaction', ratingType: 'order' },
    );

    expect(prismaMock.marketplaceRating.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        raterRole: 'SELLER_ORDER',
        targetRole: 'ORDER',
        targetId: 'order-1',
      }),
    });
  });

  it('counterparty and order ratings coexist (eligibility)', async () => {
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(completedOrder);
    prismaMock.marketplaceRating.findMany.mockResolvedValue([
      { raterRole: 'BUYER' },
      { raterRole: 'BUYER_ORDER' },
    ]);

    const result = await ratingService.checkEligibility('order-1');

    expect(result.buyerAlreadyRated).toBe(true);
    expect(result.buyerOrderRated).toBe(true);
    expect(result.canBuyerRateSeller).toBe(false);
    expect(result.canBuyerRateOrder).toBe(false);
    // Seller can still rate both
    expect(result.canSellerRateBuyer).toBe(true);
    expect(result.canSellerRateOrder).toBe(true);
  });
});
