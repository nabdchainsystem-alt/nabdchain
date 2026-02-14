// =============================================================================
// Rating Service — Mutual Buyer ↔ Seller Ratings
// =============================================================================
// Handles rating eligibility, creation, and aggregation for marketplace orders.
// Ratings are only allowed after order completion (delivered + paid).
// =============================================================================

import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

// Completed statuses
const COMPLETED_STATUSES = ['delivered', 'closed'];
const PAID_STATUSES = ['paid', 'paid_cash'];

export interface RatingEligibility {
  orderId: string;
  canBuyerRateSeller: boolean;
  canSellerRateBuyer: boolean;
  buyerAlreadyRated: boolean;
  sellerAlreadyRated: boolean;
  // Order-experience ratings
  canBuyerRateOrder: boolean;
  canSellerRateOrder: boolean;
  buyerOrderRated: boolean;
  sellerOrderRated: boolean;
  reasonIfBlocked?: string;
}

export interface CreateRatingInput {
  score: number;
  tags?: string[];
  comment?: string;
  ratingType?: 'counterparty' | 'order';
}

export interface RatingSummary {
  avgScore: number;
  count: number;
  distribution: Record<number, number>;
  recent: Array<{
    score: number;
    tags: string[];
    comment: string | null;
    createdAt: Date;
    orderNumber: string;
  }>;
}

class RatingService {
  /**
   * Check if an order is eligible for rating and whether each side has already rated.
   */
  async checkEligibility(orderId: string): Promise<RatingEligibility> {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentStatus: true },
    });

    if (!order) {
      return {
        orderId,
        canBuyerRateSeller: false,
        canSellerRateBuyer: false,
        buyerAlreadyRated: false,
        sellerAlreadyRated: false,
        reasonIfBlocked: 'Order not found',
      };
    }

    const isCompleted =
      COMPLETED_STATUSES.includes(order.status) &&
      PAID_STATUSES.includes(order.paymentStatus);

    if (!isCompleted) {
      return {
        orderId,
        canBuyerRateSeller: false,
        canSellerRateBuyer: false,
        buyerAlreadyRated: false,
        sellerAlreadyRated: false,
        canBuyerRateOrder: false,
        canSellerRateOrder: false,
        buyerOrderRated: false,
        sellerOrderRated: false,
        reasonIfBlocked: `Order not yet completed (status: ${order.status}, payment: ${order.paymentStatus})`,
      };
    }

    const existingRatings = await prisma.marketplaceRating.findMany({
      where: { orderId },
      select: { raterRole: true },
    });

    const buyerAlreadyRated = existingRatings.some((r) => r.raterRole === 'BUYER');
    const sellerAlreadyRated = existingRatings.some((r) => r.raterRole === 'SELLER');
    const buyerOrderRated = existingRatings.some((r) => r.raterRole === 'BUYER_ORDER');
    const sellerOrderRated = existingRatings.some((r) => r.raterRole === 'SELLER_ORDER');

    return {
      orderId,
      canBuyerRateSeller: !buyerAlreadyRated,
      canSellerRateBuyer: !sellerAlreadyRated,
      buyerAlreadyRated,
      sellerAlreadyRated,
      canBuyerRateOrder: !buyerOrderRated,
      canSellerRateOrder: !sellerOrderRated,
      buyerOrderRated,
      sellerOrderRated,
    };
  }

  /**
   * Create a rating for an order. Determines rater/target from the order record.
   */
  async createRating(
    orderId: string,
    callerUserId: string,
    callerRole: 'buyer' | 'seller',
    input: CreateRatingInput,
  ) {
    // Validate score
    if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
      throw new Error('Score must be an integer between 1 and 5');
    }

    // Validate comment length
    if (input.comment && input.comment.length > 280) {
      throw new Error('Comment must be 280 characters or less');
    }

    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
        paymentStatus: true,
        orderNumber: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify completion
    const isCompleted =
      COMPLETED_STATUSES.includes(order.status) &&
      PAID_STATUSES.includes(order.paymentStatus);

    if (!isCompleted) {
      throw new Error('Order must be delivered and paid before rating');
    }

    // Verify caller is part of this order
    if (callerRole === 'buyer' && order.buyerId !== callerUserId) {
      throw new Error('You are not the buyer for this order');
    }
    if (callerRole === 'seller' && order.sellerId !== callerUserId) {
      throw new Error('You are not the seller for this order');
    }

    const isOrderRating = input.ratingType === 'order';
    const raterRole = isOrderRating
      ? (callerRole === 'buyer' ? 'BUYER_ORDER' : 'SELLER_ORDER')
      : (callerRole === 'buyer' ? 'BUYER' : 'SELLER');
    const targetRole = isOrderRating ? 'ORDER' : (callerRole === 'buyer' ? 'SELLER' : 'BUYER');
    const raterId = callerUserId;
    const targetId = isOrderRating ? orderId : (callerRole === 'buyer' ? order.sellerId : order.buyerId);

    try {
      const rating = await prisma.marketplaceRating.create({
        data: {
          orderId,
          raterRole,
          raterId,
          targetRole,
          targetId,
          score: input.score,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          comment: input.comment || null,
        },
      });

      apiLogger.info('Rating created', {
        ratingId: rating.id,
        orderId,
        raterRole,
        score: input.score,
      });

      return rating;
    } catch (error: unknown) {
      // Handle unique constraint violation (already rated)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new Error('You have already rated this order');
      }
      throw error;
    }
  }

  /**
   * Get aggregate rating summary for a target (seller or buyer).
   */
  async getTargetSummary(targetRole: string, targetId: string): Promise<RatingSummary> {
    const ratings = await prisma.marketplaceRating.findMany({
      where: { targetRole, targetId },
      orderBy: { createdAt: 'desc' },
    });

    if (ratings.length === 0) {
      return {
        avgScore: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recent: [],
      };
    }

    // Calculate distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    for (const r of ratings) {
      distribution[r.score] = (distribution[r.score] || 0) + 1;
      totalScore += r.score;
    }

    // Get recent ratings with order numbers
    const recentRatings = ratings.slice(0, 10);
    const orderIds = recentRatings.map((r) => r.orderId);
    const orders = await prisma.marketplaceOrder.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNumber: true },
    });
    const orderMap = new Map(orders.map((o) => [o.id, o.orderNumber]));

    const recent = recentRatings.map((r) => ({
      score: r.score,
      tags: r.tags ? JSON.parse(r.tags) : [],
      comment: r.comment,
      createdAt: r.createdAt,
      orderNumber: orderMap.get(r.orderId) || 'Unknown',
    }));

    return {
      avgScore: Math.round((totalScore / ratings.length) * 10) / 10,
      count: ratings.length,
      distribution,
      recent,
    };
  }

  /**
   * Get both ratings for an order (buyer's rating of seller + seller's rating of buyer).
   */
  async getOrderRatings(orderId: string) {
    const ratings = await prisma.marketplaceRating.findMany({
      where: { orderId },
    });

    return {
      buyerRating: ratings.find((r) => r.raterRole === 'BUYER') || null,
      sellerRating: ratings.find((r) => r.raterRole === 'SELLER') || null,
      buyerOrderRating: ratings.find((r) => r.raterRole === 'BUYER_ORDER') || null,
      sellerOrderRating: ratings.find((r) => r.raterRole === 'SELLER_ORDER') || null,
    };
  }
}

export const ratingService = new RatingService();
