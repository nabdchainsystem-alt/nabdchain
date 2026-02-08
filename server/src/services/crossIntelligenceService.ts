/**
 * Cross-Intelligence Layer Service
 *
 * Orchestrates smart matching, price fairness, trust evolution,
 * and invisible ranking between buyers and sellers.
 */

import { prisma } from '../lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

export type TrustLevel =
  | 'unverified'
  | 'emerging'
  | 'established'
  | 'trusted'
  | 'premium'
  | 'at_risk'
  | 'suspended';

export type TrustEventType =
  | 'order_completed'
  | 'on_time_delivery'
  | 'quality_confirmation'
  | 'positive_review'
  | 'dispute_resolved_fairly'
  | 'payment_on_time'
  | 'profile_verified'
  | 'late_delivery'
  | 'order_cancelled_by_party'
  | 'quality_complaint'
  | 'payment_delayed'
  | 'dispute_filed'
  | 'policy_violation';

export interface MatchingFactors {
  categoryAffinity: number;
  priceAlignment: number;
  reliabilityMatch: number;
  relationshipBonus: number;
  capacityFit: number;
  geographicScore: number;
  responseTimeMatch: number;
}

export interface BuyerSellerMatch {
  sellerId: string;
  affinityScore: number;
  factors: MatchingFactors;
  confidence: number;
}

export interface TrustScore {
  score: number;
  level: TrustLevel;
  trend: 'rising' | 'stable' | 'falling';
  confidence: number;
  lastUpdated: Date;
}

export interface PriceFairnessAnalysis {
  itemId: string;
  requestedPrice: number;
  marketMedian: number;
  marketRange: { p10: number; p25: number; p75: number; p90: number };
  buyerFairnessScore: number;
  sellerFairnessScore: number;
  equilibriumScore: number;
  isPriceGouging: boolean;
  isUnsustainablyLow: boolean;
  suggestedRange: { min: number; optimal: number; max: number };
}

export interface PricingGuidance {
  suggestedPrice: number;
  priceFloor: number;
  priceCeiling: number;
  loyaltyAdjustment: number;
  volumeAdjustment: number;
  urgencyPremium: number;
  competitorRange: { low: number; high: number };
  estimatedWinProbability: number;
}

export interface RankingFactors {
  textRelevance: number;
  filterMatch: number;
  affinityScore: number;
  trustBoost: number;
  fairnessBoost: number;
  conversionPotential: number;
  marginPotential: number;
  retentionImpact: number;
  listingFreshness: number;
  sellerActivityScore: number;
}

// Trust event impact configuration
const TRUST_EVENT_IMPACTS: Record<TrustEventType, { baseImpact: number; decay: number }> = {
  order_completed: { baseImpact: 2, decay: 0.5 },
  on_time_delivery: { baseImpact: 3, decay: 0.3 },
  quality_confirmation: { baseImpact: 2, decay: 0.4 },
  positive_review: { baseImpact: 4, decay: 0.2 },
  dispute_resolved_fairly: { baseImpact: 5, decay: 0.3 },
  payment_on_time: { baseImpact: 2, decay: 0.5 },
  profile_verified: { baseImpact: 10, decay: 0.1 },
  late_delivery: { baseImpact: -5, decay: 0.4 },
  order_cancelled_by_party: { baseImpact: -3, decay: 0.5 },
  quality_complaint: { baseImpact: -8, decay: 0.3 },
  payment_delayed: { baseImpact: -4, decay: 0.4 },
  dispute_filed: { baseImpact: -10, decay: 0.3 },
  policy_violation: { baseImpact: -20, decay: 0.2 },
};

// Default ranking weights (A/B tested and tuned)
const DEFAULT_RANKING_WEIGHTS = {
  textRelevance: 0.25,
  filterMatch: 0.15,
  affinityScore: 0.15,
  trustBoost: 0.10,
  fairnessBoost: 0.10,
  conversionPotential: 0.08,
  marginPotential: 0.05,
  retentionImpact: 0.07,
  listingFreshness: 0.03,
  sellerActivityScore: 0.02,
};

// ============================================================================
// SMART MATCHING ENGINE
// ============================================================================

/**
 * Calculate affinity score between a buyer and seller
 */
export async function calculateBuyerSellerAffinity(
  buyerId: string,
  sellerId: string,
  itemId?: string
): Promise<BuyerSellerMatch> {
  const [buyerProfile, sellerProfile, transactions] = await Promise.all([
    getBuyerIntelligenceProfile(buyerId),
    getSellerIntelligenceProfile(sellerId),
    getTransactionHistory(buyerId, sellerId),
  ]);

  const factors: MatchingFactors = {
    categoryAffinity: calculateCategoryAffinity(buyerProfile, sellerProfile),
    priceAlignment: calculatePriceAlignment(buyerProfile, sellerProfile, itemId),
    reliabilityMatch: calculateReliabilityMatch(buyerProfile, sellerProfile),
    relationshipBonus: calculateRelationshipBonus(transactions),
    capacityFit: calculateCapacityFit(buyerProfile, sellerProfile),
    geographicScore: 70, // Default for now, can add geo logic later
    responseTimeMatch: calculateResponseTimeMatch(buyerProfile, sellerProfile),
  };

  // Weighted composite
  const weights = {
    categoryAffinity: 0.20,
    priceAlignment: 0.20,
    reliabilityMatch: 0.15,
    relationshipBonus: 0.20,
    capacityFit: 0.10,
    geographicScore: 0.05,
    responseTimeMatch: 0.10,
  };

  const affinityScore = Object.entries(weights).reduce((score, [key, weight]) => {
    return score + (factors[key as keyof MatchingFactors] * weight);
  }, 0);

  return {
    sellerId,
    affinityScore: Math.round(affinityScore * 10) / 10,
    factors,
    confidence: calculateConfidence(transactions.length),
  };
}

/**
 * Get ranked sellers for a buyer's query
 */
export async function getMatchedSellers(
  buyerId: string,
  category?: string,
  limit: number = 10
): Promise<BuyerSellerMatch[]> {
  // Get active sellers, optionally filtered by category
  const sellers = await prisma.item.findMany({
    where: {
      status: 'active',
      visibility: { not: 'hidden' },
      ...(category && { category }),
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  const sellerIds = [...new Set(sellers.map(s => s.userId))];

  // Calculate affinity for each seller
  const matches = await Promise.all(
    sellerIds.map(sid => calculateBuyerSellerAffinity(buyerId, sid))
  );

  // Sort by affinity score
  return matches
    .sort((a, b) => b.affinityScore - a.affinityScore)
    .slice(0, limit);
}

// ============================================================================
// PRICE FAIRNESS ENGINE
// ============================================================================

/**
 * Analyze price fairness for a transaction
 */
export async function analyzePriceFairness(
  itemId: string,
  sellerId: string,
  proposedPrice: number,
  quantity: number
): Promise<PriceFairnessAnalysis> {
  const marketData = await getMarketPriceData(itemId);

  // Calculate percentile of proposed price
  const pricePercentile = calculatePercentile(proposedPrice, marketData.prices);

  // Buyer fairness: reasonable price relative to market
  const buyerFairnessScore = calculateBuyerFairnessScore(
    proposedPrice,
    marketData.median,
    pricePercentile
  );

  // Seller fairness: sustainable margin
  const estimatedCost = marketData.median * 0.7; // Estimate 30% markup as baseline
  const estimatedMargin = (proposedPrice - estimatedCost) / proposedPrice;
  const sellerFairnessScore = calculateSellerFairnessScore(estimatedMargin, quantity);

  // Equilibrium: both parties should benefit
  const equilibriumScore = Math.min(buyerFairnessScore, sellerFairnessScore);

  return {
    itemId,
    requestedPrice: proposedPrice,
    marketMedian: marketData.median,
    marketRange: marketData.percentiles,
    buyerFairnessScore,
    sellerFairnessScore,
    equilibriumScore,
    isPriceGouging: pricePercentile > 90 && buyerFairnessScore < 30,
    isUnsustainablyLow: sellerFairnessScore < 20,
    suggestedRange: calculateOptimalPriceRange(marketData, quantity),
  };
}

/**
 * Generate pricing guidance for seller responding to RFQ
 */
export async function generatePricingGuidance(
  sellerId: string,
  rfqId: string
): Promise<PricingGuidance> {
  const rfq = await prisma.itemRFQ.findUnique({
    where: { id: rfqId },
    include: { item: true },
  });

  if (!rfq) {
    throw new Error('RFQ not found');
  }

  const marketData = await getMarketPriceData(rfq.itemId!);
  const transactions = await getTransactionHistory(rfq.buyerId, sellerId);

  // Calculate adjustments
  const loyaltyAdjustment = transactions.length > 0
    ? Math.min(transactions.length * 0.5, 5) // Max 5% loyalty discount
    : 0;

  const volumeAdjustment = calculateVolumeDiscount(rfq.quantity, rfq.item?.minOrderQty || 1);

  const urgencyPremium = rfq.requiredDeliveryDate
    ? calculateUrgencyPremium(new Date(rfq.requiredDeliveryDate))
    : 0;

  const optimalPrice = marketData.median * (1 - loyaltyAdjustment / 100 - volumeAdjustment / 100 + urgencyPremium / 100);

  return {
    suggestedPrice: Math.round(optimalPrice * 100) / 100,
    priceFloor: marketData.percentiles.p25,
    priceCeiling: marketData.percentiles.p75,
    loyaltyAdjustment,
    volumeAdjustment,
    urgencyPremium,
    competitorRange: {
      low: marketData.percentiles.p25,
      high: marketData.percentiles.p75,
    },
    estimatedWinProbability: calculateWinProbability(
      optimalPrice,
      marketData,
      transactions.length
    ),
  };
}

// ============================================================================
// TRUST EVOLUTION ENGINE
// ============================================================================

/**
 * Calculate trust score for a user
 */
export async function calculateTrustScore(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<TrustScore> {
  // Get trust events
  const events = await prisma.trustEvent.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 500,
  });

  // Get account age
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  const accountAgeDays = user
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Base score from account age
  let baseScore = 50;
  if (accountAgeDays < 30) baseScore = 30;
  else if (accountAgeDays > 365) baseScore = 60;

  // Apply events with time decay
  const now = Date.now();
  let eventScore = 0;

  for (const event of events) {
    const ageInDays = (now - new Date(event.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    const decayedImpact = event.impact * Math.exp(-event.decay * ageInDays / 365);
    eventScore += decayedImpact;
  }

  // Combine scores
  const rawScore = baseScore + eventScore;
  const score = Math.max(0, Math.min(100, rawScore));

  // Determine level
  const level = getTrustLevel(score, events);

  // Calculate trend from recent events
  const recentEvents = events.filter(e =>
    (now - new Date(e.timestamp).getTime()) < 30 * 24 * 60 * 60 * 1000
  );
  const trend = calculateTrend(recentEvents);

  return {
    score: Math.round(score * 10) / 10,
    level,
    trend,
    confidence: calculateTrustConfidence(events.length, accountAgeDays),
    lastUpdated: new Date(),
  };
}

/**
 * Record a trust event
 */
export async function recordTrustEvent(
  userId: string,
  eventType: TrustEventType,
  context: Record<string, unknown> = {}
): Promise<void> {
  const impactConfig = TRUST_EVENT_IMPACTS[eventType];

  await prisma.trustEvent.create({
    data: {
      userId,
      eventType,
      impact: impactConfig.baseImpact,
      decay: impactConfig.decay,
      context: JSON.stringify(context),
      timestamp: new Date(),
    },
  });

  // Update cached trust score
  await updateCachedTrustScore(userId);
}

/**
 * Get relationship trust between buyer and seller
 */
export async function getRelationshipTrust(
  buyerId: string,
  sellerId: string
): Promise<{
  trustScore: number;
  transactionCount: number;
  totalValue: number;
  lastTransaction: Date | null;
  repeatRate: number;
  disputeCount: number;
}> {
  const transactions = await getTransactionHistory(buyerId, sellerId);

  if (transactions.length === 0) {
    return {
      trustScore: 50,
      transactionCount: 0,
      totalValue: 0,
      lastTransaction: null,
      repeatRate: 0,
      disputeCount: 0,
    };
  }

  const disputes = transactions.filter(t => t.hadDispute);
  const totalValue = transactions.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

  // Calculate relationship trust score
  const successRate = (transactions.length - disputes.length) / transactions.length;
  const recencyBonus = transactions[0].completedAt
    ? Math.max(0, 20 - daysSince(transactions[0].completedAt))
    : 0;

  const trustScore = Math.min(100,
    50 +
    (successRate * 30) +
    (Math.min(transactions.length, 10) * 2) +
    recencyBonus
  );

  return {
    trustScore: Math.round(trustScore * 10) / 10,
    transactionCount: transactions.length,
    totalValue,
    lastTransaction: transactions[0]?.completedAt || null,
    repeatRate: transactions.length > 1 ? (transactions.length - 1) / transactions.length : 0,
    disputeCount: disputes.length,
  };
}

// ============================================================================
// INVISIBLE RANKING LOGIC
// ============================================================================

/**
 * Calculate ranking factors for an item
 */
export async function calculateRankingFactors(
  item: { id: string; userId: string; category: string; price: number; updatedAt: Date },
  buyerId: string,
  query?: string
): Promise<RankingFactors> {
  const [affinity, sellerTrust, buyerProfile] = await Promise.all([
    calculateBuyerSellerAffinity(buyerId, item.userId, item.id),
    calculateTrustScore(item.userId, 'seller'),
    getBuyerIntelligenceProfile(buyerId),
  ]);

  // Text relevance (simplified - in production use proper search scoring)
  const textRelevance = query ? 70 : 100; // Placeholder

  // Filter match is 100 if item passes filters
  const filterMatch = 100;

  // Freshness: days since last update
  const daysSinceUpdate = daysSince(item.updatedAt);
  const listingFreshness = Math.max(0, 100 - daysSinceUpdate * 2);

  // Conversion potential based on price alignment
  const priceInRange =
    item.price >= (buyerProfile?.preferredPriceRange?.min || 0) &&
    item.price <= (buyerProfile?.preferredPriceRange?.max || Infinity);
  const conversionPotential = priceInRange ? 80 : 50;

  return {
    textRelevance,
    filterMatch,
    affinityScore: affinity.affinityScore,
    trustBoost: sellerTrust.score,
    fairnessBoost: 70, // Default, can be computed per item
    conversionPotential,
    marginPotential: 60, // Platform margin potential
    retentionImpact: affinity.factors.relationshipBonus > 50 ? 80 : 50,
    listingFreshness,
    sellerActivityScore: 70, // Seller engagement level
  };
}

/**
 * Rank items for a buyer
 */
export async function rankItemsForBuyer(
  items: Array<{ id: string; userId: string; category: string; price: number; updatedAt: Date }>,
  buyerId: string,
  query?: string
): Promise<Array<{ item: typeof items[0]; score: number }>> {
  const rankedItems = await Promise.all(
    items.map(async (item) => {
      const factors = await calculateRankingFactors(item, buyerId, query);
      const score = calculateFinalRankingScore(factors);
      return { item, score, factors };
    })
  );

  // Sort by score
  rankedItems.sort((a, b) => b.score - a.score);

  // Apply diversity rules
  return applyDiversityRules(rankedItems);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getBuyerIntelligenceProfile(buyerId: string) {
  const profile = await prisma.buyerIntelligenceProfile.findUnique({
    where: { buyerId },
  });

  if (profile) {
    return {
      ...profile,
      categoryAffinities: JSON.parse(profile.categoryAffinities as string || '{}'),
      preferredPriceRange: { min: 0, max: profile.avgOrderValue * 3 },
    };
  }

  // Return default profile for new buyers
  return {
    buyerId,
    segment: 'smb',
    avgOrderValue: 1000,
    avgOrderFrequency: 30,
    priceElasticity: 0.5,
    qualityThreshold: 0.7,
    loyaltyIndex: 0.5,
    explorationRate: 0.5,
    urgencyProfile: 'standard',
    negotiationStyle: 'flexible',
    paymentReliability: 1.0,
    disputeRate: 0,
    cancellationRate: 0,
    categoryAffinities: {},
    preferredPriceRange: { min: 0, max: 10000 },
  };
}

async function getSellerIntelligenceProfile(sellerId: string) {
  const profile = await prisma.sellerIntelligenceProfile.findUnique({
    where: { sellerId },
  });

  if (profile) {
    return {
      ...profile,
      categoryStrengths: JSON.parse(profile.categoryStrengths as string || '{}'),
      priceCompetitiveness: JSON.parse(profile.priceCompetitiveness as string || '{}'),
    };
  }

  // Return default profile for new sellers
  return {
    sellerId,
    tier: 'new',
    onTimeDeliveryRate: 1.0,
    qualityScore: 0.8,
    avgResponseTime: 24,
    quoteAcceptanceRate: 0.5,
    capacityUtilization: 0.5,
    maxWeeklyOrders: 50,
    repeatCustomerRate: 0,
    customerSatisfaction: 0.8,
    disputeResolution: 0.8,
    orderGrowthTrend: 0,
    inventoryTurnover: 0,
    listingFreshness: 1.0,
    categoryStrengths: {},
    priceCompetitiveness: {},
  };
}

async function getTransactionHistory(buyerId: string, sellerId: string) {
  const orders = await prisma.marketplaceOrder.findMany({
    where: {
      buyerId,
      sellerId,
      status: { in: ['delivered', 'completed'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return orders.map(o => ({
    ...o,
    hadDispute: o.hasException || false,
    completedAt: o.deliveredAt,
  }));
}

async function getMarketPriceData(itemId: string) {
  // Get recent prices for similar items
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { category: true, subcategory: true, price: true },
  });

  if (!item) {
    return {
      median: 100,
      prices: [],
      percentiles: { p10: 80, p25: 90, p75: 110, p90: 120 },
    };
  }

  const similarItems = await prisma.item.findMany({
    where: {
      category: item.category,
      subcategory: item.subcategory,
      status: 'active',
    },
    select: { price: true },
  });

  const prices = similarItems.map(i => i.price).sort((a, b) => a - b);

  if (prices.length === 0) {
    return {
      median: item.price,
      prices: [item.price],
      percentiles: {
        p10: item.price * 0.8,
        p25: item.price * 0.9,
        p75: item.price * 1.1,
        p90: item.price * 1.2,
      },
    };
  }

  const median = prices[Math.floor(prices.length / 2)];

  return {
    median,
    prices,
    percentiles: {
      p10: prices[Math.floor(prices.length * 0.1)] || prices[0],
      p25: prices[Math.floor(prices.length * 0.25)] || prices[0],
      p75: prices[Math.floor(prices.length * 0.75)] || prices[prices.length - 1],
      p90: prices[Math.floor(prices.length * 0.9)] || prices[prices.length - 1],
    },
  };
}

function calculateCategoryAffinity(
  buyerProfile: Awaited<ReturnType<typeof getBuyerIntelligenceProfile>>,
  sellerProfile: Awaited<ReturnType<typeof getSellerIntelligenceProfile>>
): number {
  const buyerCategories = buyerProfile.categoryAffinities;
  const sellerCategories = sellerProfile.categoryStrengths;

  if (Object.keys(buyerCategories).length === 0) return 50;

  let matchScore = 0;
  let totalWeight = 0;

  for (const [category, buyerAffinity] of Object.entries(buyerCategories)) {
    const sellerStrength = sellerCategories[category] || 50;
    matchScore += (buyerAffinity as number) * (sellerStrength as number) / 100;
    totalWeight += buyerAffinity as number;
  }

  return totalWeight > 0 ? (matchScore / totalWeight) * 100 : 50;
}

function calculatePriceAlignment(
  buyerProfile: Awaited<ReturnType<typeof getBuyerIntelligenceProfile>>,
  sellerProfile: Awaited<ReturnType<typeof getSellerIntelligenceProfile>>,
  _itemId?: string
): number {
  // Simplified: based on elasticity and competitiveness
  const elasticity = buyerProfile.priceElasticity;
  const competitiveness = Object.values(sellerProfile.priceCompetitiveness as Record<string, number>);
  const avgCompetitiveness = competitiveness.length > 0
    ? competitiveness.reduce((a, b) => a + b, 0) / competitiveness.length
    : 50;

  // High elasticity buyers prefer competitive sellers
  if (elasticity > 0.7) {
    return avgCompetitiveness;
  }

  // Low elasticity buyers care less about price
  return 70 + (avgCompetitiveness * 0.3);
}

function calculateReliabilityMatch(
  buyerProfile: Awaited<ReturnType<typeof getBuyerIntelligenceProfile>>,
  sellerProfile: Awaited<ReturnType<typeof getSellerIntelligenceProfile>>
): number {
  const buyerThreshold = buyerProfile.qualityThreshold;
  const sellerReliability = sellerProfile.onTimeDeliveryRate;

  if (sellerReliability >= buyerThreshold) {
    return 100 - (sellerReliability - buyerThreshold) * 20; // Slight penalty for overkill
  }

  // Penalty for not meeting threshold
  return Math.max(0, 100 - (buyerThreshold - sellerReliability) * 200);
}

function calculateRelationshipBonus(
  transactions: Awaited<ReturnType<typeof getTransactionHistory>>
): number {
  if (transactions.length === 0) return 50;

  const successfulTransactions = transactions.filter(t => !t.hadDispute);
  const successRate = successfulTransactions.length / transactions.length;

  return Math.min(100, 50 + (transactions.length * 5) + (successRate * 30));
}

function calculateCapacityFit(
  buyerProfile: Awaited<ReturnType<typeof getBuyerIntelligenceProfile>>,
  sellerProfile: Awaited<ReturnType<typeof getSellerIntelligenceProfile>>
): number {
  const buyerFrequency = 30 / Math.max(buyerProfile.avgOrderFrequency, 1);
  const sellerCapacity = sellerProfile.maxWeeklyOrders * (1 - sellerProfile.capacityUtilization);

  if (sellerCapacity >= buyerFrequency) {
    return 100;
  }

  return Math.max(0, 100 - (buyerFrequency - sellerCapacity) * 10);
}

function calculateResponseTimeMatch(
  buyerProfile: Awaited<ReturnType<typeof getBuyerIntelligenceProfile>>,
  sellerProfile: Awaited<ReturnType<typeof getSellerIntelligenceProfile>>
): number {
  const urgencyMap = { patient: 72, standard: 24, urgent: 8, critical: 2 };
  const expectedResponseTime = urgencyMap[buyerProfile.urgencyProfile as keyof typeof urgencyMap] || 24;
  const sellerResponseTime = sellerProfile.avgResponseTime;

  if (sellerResponseTime <= expectedResponseTime) {
    return 100;
  }

  return Math.max(0, 100 - (sellerResponseTime - expectedResponseTime) * 2);
}

function calculateConfidence(transactionCount: number): number {
  // More transactions = higher confidence
  return Math.min(100, 30 + transactionCount * 7);
}

function calculatePercentile(value: number, sortedPrices: number[]): number {
  if (sortedPrices.length === 0) return 50;

  const index = sortedPrices.findIndex(p => p >= value);
  if (index === -1) return 100;
  if (index === 0) return 0;

  return (index / sortedPrices.length) * 100;
}

function calculateBuyerFairnessScore(
  price: number,
  marketMedian: number,
  percentile: number
): number {
  // Lower percentile = better for buyer
  if (percentile <= 25) return 100;
  if (percentile <= 50) return 80;
  if (percentile <= 75) return 60;
  if (percentile <= 90) return 40;
  return 20;
}

function calculateSellerFairnessScore(estimatedMargin: number, quantity: number): number {
  // Higher margin = better for seller
  const marginScore = estimatedMargin > 0.3 ? 100 :
    estimatedMargin > 0.2 ? 80 :
    estimatedMargin > 0.15 ? 60 :
    estimatedMargin > 0.1 ? 40 :
    estimatedMargin > 0 ? 20 : 0;

  // Volume bonus
  const volumeBonus = Math.min(20, quantity / 10);

  return Math.min(100, marginScore + volumeBonus);
}

function calculateOptimalPriceRange(
  marketData: Awaited<ReturnType<typeof getMarketPriceData>>,
  quantity: number
): { min: number; optimal: number; max: number } {
  const volumeDiscount = Math.min(0.1, quantity / 1000);

  return {
    min: marketData.percentiles.p25 * (1 - volumeDiscount),
    optimal: marketData.median * (1 - volumeDiscount / 2),
    max: marketData.percentiles.p75,
  };
}

function calculateVolumeDiscount(quantity: number, minOrderQty: number): number {
  const multiplier = quantity / minOrderQty;
  if (multiplier >= 10) return 10;
  if (multiplier >= 5) return 5;
  if (multiplier >= 2) return 2;
  return 0;
}

function calculateUrgencyPremium(deadline: Date): number {
  const daysUntilDeadline = daysSince(deadline) * -1;
  if (daysUntilDeadline <= 1) return 15;
  if (daysUntilDeadline <= 3) return 10;
  if (daysUntilDeadline <= 7) return 5;
  return 0;
}

function calculateWinProbability(
  price: number,
  marketData: Awaited<ReturnType<typeof getMarketPriceData>>,
  relationshipStrength: number
): number {
  const pricePercentile = calculatePercentile(price, marketData.prices);

  // Lower price = higher win probability
  const priceFactor = Math.max(0, 100 - pricePercentile);

  // Existing relationship helps
  const relationshipFactor = Math.min(30, relationshipStrength * 3);

  return Math.min(95, (priceFactor * 0.7) + relationshipFactor);
}

function getTrustLevel(score: number, events: Array<{ impact: number; timestamp: Date }>): TrustLevel {
  const now = Date.now();
  const recentNegatives = events.filter(e =>
    e.impact < 0 &&
    (now - new Date(e.timestamp).getTime()) < 90 * 24 * 60 * 60 * 1000
  );

  if (recentNegatives.length > 3) return 'at_risk';
  if (score >= 90) return 'premium';
  if (score >= 75) return 'trusted';
  if (score >= 60) return 'established';
  if (score >= 40) return 'emerging';
  return 'unverified';
}

function calculateTrend(recentEvents: Array<{ impact: number }>): 'rising' | 'stable' | 'falling' {
  if (recentEvents.length < 2) return 'stable';

  const netImpact = recentEvents.reduce((sum, e) => sum + e.impact, 0);

  if (netImpact > 5) return 'rising';
  if (netImpact < -5) return 'falling';
  return 'stable';
}

function calculateTrustConfidence(eventCount: number, accountAgeDays: number): number {
  const eventConfidence = Math.min(50, eventCount * 5);
  const ageConfidence = Math.min(50, accountAgeDays / 7);
  return eventConfidence + ageConfidence;
}

async function updateCachedTrustScore(userId: string): Promise<void> {
  const score = await calculateTrustScore(userId, 'seller');

  await prisma.trustScore.upsert({
    where: { id: `trust_${userId}` },
    update: {
      score: score.score,
      level: score.level,
      trend: score.trend,
      confidence: score.confidence,
      lastUpdated: score.lastUpdated,
    },
    create: {
      id: `trust_${userId}`,
      userId,
      role: 'seller',
      score: score.score,
      level: score.level,
      trend: score.trend,
      confidence: score.confidence,
      lastUpdated: score.lastUpdated,
    },
  });
}

function calculateFinalRankingScore(factors: RankingFactors): number {
  return Object.entries(DEFAULT_RANKING_WEIGHTS).reduce((score, [key, weight]) => {
    return score + (factors[key as keyof RankingFactors] * weight);
  }, 0);
}

function applyDiversityRules<T extends { item: { userId: string }; score: number }>(
  items: T[]
): T[] {
  const result: T[] = [];
  const sellerCounts = new Map<string, number>();

  for (const item of items) {
    const sellerId = item.item.userId;
    const count = sellerCounts.get(sellerId) || 0;

    // Max 3 items from same seller in top 20
    if (result.length < 20 && count >= 3) {
      continue;
    }

    result.push(item);
    sellerCounts.set(sellerId, count + 1);
  }

  return result;
}

function daysSince(date: Date | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// EXPORTED CROSS-INTELLIGENCE SERVICE OBJECT
// ============================================================================

/**
 * Recompute and update seller trust score
 * Called by background jobs and event handlers
 */
export async function recomputeSellerTrustScore(userId: string): Promise<TrustScore> {
  const score = await calculateTrustScore(userId, 'seller');
  await updateCachedTrustScore(userId);
  return score;
}

export const crossIntelligenceService = {
  calculateBuyerSellerAffinity,
  getMatchedSellers,
  analyzePriceFairness,
  generatePricingGuidance,
  calculateTrustScore,
  recordTrustEvent,
  getRelationshipTrust,
  calculateRankingFactors,
  rankItemsForBuyer,
  recomputeSellerTrustScore,
};
