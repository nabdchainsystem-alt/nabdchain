// =============================================================================
// RFQ Scoring Service - Intelligence & Prioritization
// =============================================================================

import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

export type PriorityTier = 'critical' | 'high' | 'medium' | 'low';

export interface RFQScore {
  total: number;        // 0-100
  urgency: number;      // 0-100
  quantity: number;     // 0-100
  buyer: number;        // 0-100
  margin: number;       // 0-100
}

export interface RFQPricingSuggestion {
  suggestedPrice: number;
  confidence: number;   // 0-100
  reasoning: string;
  competitorRange?: {
    min: number;
    max: number;
  };
  suggestedLeadTime: number;
}

export interface ScoringWeights {
  urgency: number;
  quantity: number;
  buyer: number;
  margin: number;
}

export interface ScoringThresholds {
  criticalMin: number;
  highMin: number;
  mediumMin: number;
}

// Default weights (should sum to 100)
const DEFAULT_WEIGHTS: ScoringWeights = {
  urgency: 25,
  quantity: 25,
  buyer: 25,
  margin: 25,
};

// Default thresholds
const DEFAULT_THRESHOLDS: ScoringThresholds = {
  criticalMin: 80,
  highMin: 60,
  mediumMin: 40,
};

// =============================================================================
// Scoring Functions
// =============================================================================

/**
 * Calculate urgency score based on deadline proximity
 */
export function calculateUrgencyScore(expiresAt: Date | null, createdAt: Date): number {
  if (!expiresAt) {
    return 50; // Default medium urgency if no deadline
  }

  const now = new Date();
  const totalTime = expiresAt.getTime() - createdAt.getTime();
  const remainingTime = expiresAt.getTime() - now.getTime();

  if (remainingTime <= 0) {
    return 100; // Expired = maximum urgency (needs immediate attention)
  }

  const percentageElapsed = ((totalTime - remainingTime) / totalTime) * 100;

  // More time elapsed = higher urgency
  if (percentageElapsed >= 90) return 100;
  if (percentageElapsed >= 75) return 85;
  if (percentageElapsed >= 50) return 70;
  if (percentageElapsed >= 25) return 50;
  return 30;
}

/**
 * Calculate quantity score based on order value
 */
export function calculateQuantityScore(
  quantity: number,
  unitPrice: number,
  avgOrderValue: number
): number {
  const orderValue = quantity * unitPrice;

  if (avgOrderValue === 0) {
    // No history, use absolute thresholds
    if (orderValue >= 50000) return 100;
    if (orderValue >= 25000) return 85;
    if (orderValue >= 10000) return 70;
    if (orderValue >= 5000) return 55;
    if (orderValue >= 1000) return 40;
    return 25;
  }

  // Compare to average
  const ratio = orderValue / avgOrderValue;
  if (ratio >= 3) return 100;
  if (ratio >= 2) return 85;
  if (ratio >= 1.5) return 70;
  if (ratio >= 1) return 55;
  if (ratio >= 0.5) return 40;
  return 25;
}

/**
 * Calculate buyer score based on history
 */
export function calculateBuyerScore(
  totalOrders: number,
  totalSpend: number,
  lastOrderDate: Date | null
): number {
  let score = 0;

  // Order count contribution (max 40 points)
  if (totalOrders >= 20) score += 40;
  else if (totalOrders >= 10) score += 30;
  else if (totalOrders >= 5) score += 20;
  else if (totalOrders >= 1) score += 10;

  // Spend contribution (max 40 points)
  if (totalSpend >= 100000) score += 40;
  else if (totalSpend >= 50000) score += 30;
  else if (totalSpend >= 20000) score += 20;
  else if (totalSpend >= 5000) score += 10;

  // Recency contribution (max 20 points)
  if (lastOrderDate) {
    const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastOrder <= 30) score += 20;
    else if (daysSinceLastOrder <= 60) score += 15;
    else if (daysSinceLastOrder <= 90) score += 10;
    else if (daysSinceLastOrder <= 180) score += 5;
  }

  return Math.min(100, score);
}

/**
 * Calculate margin score based on price potential
 */
export function calculateMarginScore(
  requestedPrice: number | null,
  itemPrice: number,
  avgMargin: number = 20 // Default 20% margin expectation
): number {
  if (!requestedPrice || requestedPrice <= 0) {
    return 50; // Unknown, assume medium
  }

  const potentialMargin = ((requestedPrice - itemPrice * 0.7) / requestedPrice) * 100;

  if (potentialMargin >= avgMargin * 1.5) return 100;
  if (potentialMargin >= avgMargin * 1.2) return 85;
  if (potentialMargin >= avgMargin) return 70;
  if (potentialMargin >= avgMargin * 0.8) return 55;
  if (potentialMargin >= avgMargin * 0.5) return 40;
  return 25;
}

/**
 * Calculate composite score from components
 */
export function calculateCompositeScore(
  scores: RFQScore,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const totalWeight = weights.urgency + weights.quantity + weights.buyer + weights.margin;

  const weightedScore =
    (scores.urgency * weights.urgency +
      scores.quantity * weights.quantity +
      scores.buyer * weights.buyer +
      scores.margin * weights.margin) /
    totalWeight;

  return Math.round(weightedScore);
}

/**
 * Determine priority tier from score
 */
export function determinePriorityTier(
  score: number,
  thresholds: ScoringThresholds = DEFAULT_THRESHOLDS
): PriorityTier {
  if (score >= thresholds.criticalMin) return 'critical';
  if (score >= thresholds.highMin) return 'high';
  if (score >= thresholds.mediumMin) return 'medium';
  return 'low';
}

/**
 * Generate pricing suggestion based on historical data
 */
export function generatePricingSuggestion(
  itemPrice: number,
  requestedPrice: number | null,
  historicalPrices: number[],
  leadTimeDays: number | null
): RFQPricingSuggestion {
  let suggestedPrice = itemPrice;
  let confidence = 50;
  let reasoning = 'Based on item list price';

  if (historicalPrices.length > 0) {
    const avgHistorical = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    const minHistorical = Math.min(...historicalPrices);
    const maxHistorical = Math.max(...historicalPrices);

    suggestedPrice = Math.round(avgHistorical * 100) / 100;
    confidence = Math.min(90, 50 + historicalPrices.length * 5);
    reasoning = `Based on ${historicalPrices.length} historical quotes`;

    // If buyer requested a price, factor it in
    if (requestedPrice && requestedPrice > 0) {
      if (requestedPrice >= avgHistorical) {
        suggestedPrice = requestedPrice;
        confidence = Math.min(95, confidence + 10);
        reasoning = 'Buyer requested price is acceptable based on history';
      } else if (requestedPrice >= minHistorical * 0.9) {
        suggestedPrice = Math.round((requestedPrice + avgHistorical) / 2 * 100) / 100;
        confidence = Math.min(85, confidence);
        reasoning = 'Counter-offer between buyer request and historical average';
      }
    }

    return {
      suggestedPrice,
      confidence,
      reasoning,
      competitorRange: {
        min: minHistorical,
        max: maxHistorical,
      },
      suggestedLeadTime: leadTimeDays || 7,
    };
  }

  // No history - use item price with margin
  return {
    suggestedPrice: Math.round(itemPrice * 1.15 * 100) / 100, // 15% markup
    confidence,
    reasoning,
    suggestedLeadTime: leadTimeDays || 7,
  };
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get or create scoring config for a seller
 */
export async function getOrCreateScoringConfig(sellerId: string) {
  let config = await prisma.rFQScoringConfig.findUnique({
    where: { sellerId },
  });

  if (!config) {
    config = await prisma.rFQScoringConfig.create({
      data: {
        sellerId,
        urgencyWeight: DEFAULT_WEIGHTS.urgency,
        quantityWeight: DEFAULT_WEIGHTS.quantity,
        buyerWeight: DEFAULT_WEIGHTS.buyer,
        marginWeight: DEFAULT_WEIGHTS.margin,
        criticalScoreMin: DEFAULT_THRESHOLDS.criticalMin,
        highScoreMin: DEFAULT_THRESHOLDS.highMin,
        mediumScoreMin: DEFAULT_THRESHOLDS.mediumMin,
      },
    });
  }

  return config;
}

/**
 * Calculate and update RFQ scores
 */
export async function calculateRFQScores(rfqId: string, sellerId: string) {
  const rfq = await prisma.marketplaceRFQ.findUnique({
    where: { id: rfqId },
    include: { item: true },
  });

  if (!rfq) {
    throw new Error('RFQ not found');
  }

  // Get scoring config
  const config = await getOrCreateScoringConfig(sellerId);
  const weights: ScoringWeights = {
    urgency: config.urgencyWeight,
    quantity: config.quantityWeight,
    buyer: config.buyerWeight,
    margin: config.marginWeight,
  };
  const thresholds: ScoringThresholds = {
    criticalMin: config.criticalScoreMin,
    highMin: config.highScoreMin,
    mediumMin: config.mediumScoreMin,
  };

  // Get buyer history
  const buyerOrders = await prisma.marketplaceOrder.aggregate({
    where: { buyerId: rfq.buyerId, sellerId },
    _count: true,
    _sum: { totalPrice: true },
  });

  const lastOrder = await prisma.marketplaceOrder.findFirst({
    where: { buyerId: rfq.buyerId, sellerId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  // Get seller average order value
  const sellerAvg = await prisma.marketplaceOrder.aggregate({
    where: { sellerId },
    _avg: { totalPrice: true },
  });

  // Calculate individual scores
  const urgencyScore = calculateUrgencyScore(rfq.expiresAt, rfq.createdAt);
  const quantityScore = calculateQuantityScore(
    rfq.quantity,
    rfq.item.price,
    sellerAvg._avg.totalPrice || 0
  );
  const buyerScore = calculateBuyerScore(
    buyerOrders._count,
    buyerOrders._sum.totalPrice || 0,
    lastOrder?.createdAt || null
  );
  const marginScore = calculateMarginScore(rfq.requestedPrice, rfq.item.price);

  const scores: RFQScore = {
    total: 0,
    urgency: urgencyScore,
    quantity: quantityScore,
    buyer: buyerScore,
    margin: marginScore,
  };

  scores.total = calculateCompositeScore(scores, weights);
  const priorityTier = determinePriorityTier(scores.total, thresholds);

  // Get historical prices for suggestion
  const historicalQuotes = await prisma.marketplaceRFQ.findMany({
    where: {
      itemId: rfq.itemId,
      sellerId,
      quotedPrice: { not: null },
      status: { in: ['accepted', 'responded'] },
    },
    select: { quotedPrice: true },
    take: 20,
  });

  const suggestion = generatePricingSuggestion(
    rfq.item.price,
    rfq.requestedPrice,
    historicalQuotes.map((q) => q.quotedPrice!),
    rfq.item.leadTimeDays
  );

  // Update RFQ with scores
  const updatedRFQ = await prisma.marketplaceRFQ.update({
    where: { id: rfqId },
    data: {
      score: scores.total,
      urgencyScore: scores.urgency,
      quantityScore: scores.quantity,
      buyerScore: scores.buyer,
      marginScore: scores.margin,
      priorityTier,
      suggestedPrice: suggestion.suggestedPrice,
      suggestedLeadTime: suggestion.suggestedLeadTime,
      pricingConfidence: suggestion.confidence,
      buyerTotalOrders: buyerOrders._count,
      buyerTotalSpend: buyerOrders._sum.totalPrice || 0,
      buyerAvgOrderValue: buyerOrders._count > 0
        ? (buyerOrders._sum.totalPrice || 0) / buyerOrders._count
        : 0,
      buyerLastOrderDate: lastOrder?.createdAt || null,
    },
    include: { item: true },
  });

  return {
    rfq: updatedRFQ,
    scores,
    priorityTier,
    suggestion,
  };
}

/**
 * Get scored RFQs for a seller
 */
export async function getScoredRFQs(
  sellerId: string,
  filters?: {
    status?: string;
    priorityTier?: PriorityTier;
  }
) {
  const where: Record<string, unknown> = { sellerId };

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.priorityTier) {
    where.priorityTier = filters.priorityTier;
  }

  const rfqs = await prisma.marketplaceRFQ.findMany({
    where,
    include: {
      item: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
  });

  return rfqs;
}

/**
 * Batch recalculate scores for all pending RFQs
 */
export async function recalculateAllRFQScores(sellerId: string) {
  const pendingRFQs = await prisma.marketplaceRFQ.findMany({
    where: {
      sellerId,
      status: { in: ['new', 'viewed', 'responded', 'negotiation'] },
    },
    select: { id: true },
  });

  const results = [];
  for (const rfq of pendingRFQs) {
    try {
      const result = await calculateRFQScores(rfq.id, sellerId);
      results.push({ id: rfq.id, success: true, score: result.scores.total });
    } catch (error) {
      results.push({ id: rfq.id, success: false, error: String(error) });
    }
  }

  return {
    total: pendingRFQs.length,
    updated: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Quick respond to RFQ with suggestion
 */
export async function quickRespondToRFQ(
  rfqId: string,
  sellerId: string,
  acceptSuggestion: boolean,
  customData?: {
    price?: number;
    leadTime?: number;
    message?: string;
  }
) {
  const rfq = await prisma.marketplaceRFQ.findUnique({
    where: { id: rfqId },
  });

  if (!rfq || rfq.sellerId !== sellerId) {
    throw new Error('RFQ not found or unauthorized');
  }

  const quotedPrice = acceptSuggestion
    ? rfq.suggestedPrice || rfq.requestedPrice || 0
    : customData?.price || 0;

  const quotedLeadTime = acceptSuggestion
    ? rfq.suggestedLeadTime || 7
    : customData?.leadTime || 7;

  // Update RFQ
  const updatedRFQ = await prisma.marketplaceRFQ.update({
    where: { id: rfqId },
    data: {
      quotedPrice,
      quotedLeadTime,
      status: 'responded',
      respondedAt: new Date(),
      lastActionAt: new Date(),
    },
  });

  // Add message if provided
  if (customData?.message) {
    await prisma.marketplaceRFQMessage.create({
      data: {
        rfqId,
        senderId: sellerId,
        senderType: 'seller',
        content: customData.message,
        offeredPrice: quotedPrice,
        offeredLeadTime: quotedLeadTime,
      },
    });
  }

  // Add event
  await prisma.marketplaceRFQEvent.create({
    data: {
      rfqId,
      actorId: sellerId,
      actorType: 'seller',
      eventType: 'quick_responded',
      fromStatus: rfq.status,
      toStatus: 'responded',
      metadata: JSON.stringify({
        acceptedSuggestion: acceptSuggestion,
        quotedPrice,
        quotedLeadTime,
      }),
    },
  });

  return updatedRFQ;
}

/**
 * Get RFQ timeline data
 */
export async function getRFQTimelineData(
  sellerId: string,
  view: 'day' | 'week' | 'month' = 'week'
) {
  const now = new Date();
  let startDate: Date;

  switch (view) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const rfqs = await prisma.marketplaceRFQ.findMany({
    where: {
      sellerId,
      createdAt: { gte: startDate },
    },
    include: { item: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by status for timeline
  const byStatus = {
    new: rfqs.filter((r) => r.status === 'new'),
    viewed: rfqs.filter((r) => r.status === 'viewed'),
    responded: rfqs.filter((r) => r.status === 'responded'),
    negotiation: rfqs.filter((r) => r.status === 'negotiation'),
    accepted: rfqs.filter((r) => r.status === 'accepted'),
    rejected: rfqs.filter((r) => r.status === 'rejected'),
    expired: rfqs.filter((r) => r.status === 'expired'),
  };

  // Calculate stats
  const stats = {
    totalReceived: rfqs.length,
    totalResponded: rfqs.filter((r) => r.respondedAt).length,
    avgResponseTime: 0,
    conversionRate: 0,
  };

  const respondedRFQs = rfqs.filter((r) => r.respondedAt);
  if (respondedRFQs.length > 0) {
    const totalResponseTime = respondedRFQs.reduce((acc, r) => {
      return acc + (r.respondedAt!.getTime() - r.createdAt.getTime());
    }, 0);
    stats.avgResponseTime = Math.round(totalResponseTime / respondedRFQs.length / (1000 * 60 * 60)); // hours
  }

  const completedRFQs = rfqs.filter((r) => ['accepted', 'rejected', 'expired'].includes(r.status));
  if (completedRFQs.length > 0) {
    stats.conversionRate = Math.round(
      (completedRFQs.filter((r) => r.status === 'accepted').length / completedRFQs.length) * 100
    );
  }

  return {
    view,
    startDate,
    endDate: now,
    rfqs,
    byStatus,
    stats,
  };
}

export default {
  calculateRFQScores,
  getScoredRFQs,
  recalculateAllRFQScores,
  quickRespondToRFQ,
  getRFQTimelineData,
  getOrCreateScoringConfig,
  calculateUrgencyScore,
  calculateQuantityScore,
  calculateBuyerScore,
  calculateMarginScore,
  calculateCompositeScore,
  determinePriorityTier,
  generatePricingSuggestion,
};
