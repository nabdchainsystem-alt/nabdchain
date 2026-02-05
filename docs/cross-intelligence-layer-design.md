# Cross-Intelligence Layer Design

## Overview

The Cross-Intelligence Layer (CIL) is a backend system that sits between buyers and sellers, silently orchestrating optimal matches, fair pricing, trust evolution, and invisible rankings to maximize platform value for all parties.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CROSS-INTELLIGENCE LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Smart     │  │   Price     │  │   Trust     │  │  Invisible │ │
│  │  Matching   │  │  Fairness   │  │  Evolution  │  │   Ranking  │ │
│  │   Engine    │  │   Engine    │  │   Engine    │  │    Logic   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                              │                                      │
│                    ┌─────────┴─────────┐                           │
│                    │  Intelligence DB  │                           │
│                    │  (Signals Store)  │                           │
│                    └───────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌───────────┐        ┌───────────┐        ┌───────────┐
   │  BUYERS   │        │ PLATFORM  │        │  SELLERS  │
   │           │◄──────►│   API     │◄──────►│           │
   └───────────┘        └───────────┘        └───────────┘
```

---

## 1. Smart Matching Engine

### Purpose
Connect buyers with the optimal seller for their specific needs—not just the cheapest or closest, but the best overall fit considering history, reliability, and mutual benefit.

### Core Algorithm: Multi-Factor Affinity Score

```typescript
// server/src/services/intelligenceService.ts

interface MatchingFactors {
  categoryAffinity: number;      // 0-100: Buyer's category purchase history
  priceAlignment: number;        // 0-100: Price expectations match seller's range
  reliabilityMatch: number;      // 0-100: Seller's delivery reliability vs buyer's tolerance
  relationshipBonus: number;     // 0-100: Previous successful transactions
  capacityFit: number;           // 0-100: Seller can handle buyer's typical volumes
  geographicScore: number;       // 0-100: Logistics optimization
  responseTimeMatch: number;     // 0-100: Seller responsiveness vs buyer urgency
}

interface BuyerSellerMatch {
  sellerId: string;
  affinityScore: number;         // 0-100 composite
  factors: MatchingFactors;
  confidence: number;            // How confident we are in this match
  explanation?: string;          // Internal notes (never shown to users)
}

async function calculateBuyerSellerAffinity(
  buyerId: string,
  sellerId: string,
  itemId?: string
): Promise<BuyerSellerMatch> {
  const [buyerProfile, sellerProfile, transactionHistory] = await Promise.all([
    getBuyerIntelligenceProfile(buyerId),
    getSellerIntelligenceProfile(sellerId),
    getTransactionHistory(buyerId, sellerId),
  ]);

  const factors: MatchingFactors = {
    categoryAffinity: calculateCategoryAffinity(buyerProfile, sellerProfile),
    priceAlignment: calculatePriceAlignment(buyerProfile, sellerProfile, itemId),
    reliabilityMatch: calculateReliabilityMatch(buyerProfile, sellerProfile),
    relationshipBonus: calculateRelationshipBonus(transactionHistory),
    capacityFit: calculateCapacityFit(buyerProfile, sellerProfile),
    geographicScore: calculateGeographicScore(buyerProfile, sellerProfile),
    responseTimeMatch: calculateResponseTimeMatch(buyerProfile, sellerProfile),
  };

  // Weighted composite (weights tuned by ML over time)
  const weights = await getMatchingWeights(buyerProfile.segment);
  const affinityScore = calculateWeightedScore(factors, weights);

  return {
    sellerId,
    affinityScore,
    factors,
    confidence: calculateConfidence(transactionHistory.length),
  };
}
```

### Matching Signals Collected

| Signal | Source | Update Frequency |
|--------|--------|------------------|
| Category purchase frequency | Orders | Per transaction |
| Average order value by category | Orders | Weekly rollup |
| Price sensitivity index | RFQ negotiations | Per RFQ |
| Urgency tolerance | Order deadlines vs actual | Per delivery |
| Quality expectations | Returns, complaints | Per event |
| Volume patterns | Order quantities | Monthly rollup |
| Seasonal behavior | Historical timestamps | Quarterly |

### Buyer Intelligence Profile

```typescript
interface BuyerIntelligenceProfile {
  buyerId: string;
  segment: 'enterprise' | 'mid_market' | 'smb' | 'occasional';

  // Purchase patterns
  categoryAffinities: Map<string, number>;  // Category -> affinity score
  avgOrderValue: number;
  avgOrderFrequency: number;                // Days between orders
  preferredPriceRange: { min: number; max: number };

  // Behavior signals
  urgencyProfile: 'patient' | 'standard' | 'urgent' | 'critical';
  priceElasticity: number;                  // 0-1: How price-sensitive
  qualityThreshold: number;                 // Minimum acceptable quality score

  // Relationship patterns
  loyaltyIndex: number;                     // Tendency to repeat with same sellers
  explorationRate: number;                  // Tendency to try new sellers
  negotiationStyle: 'firm' | 'flexible' | 'aggressive';

  // Risk indicators
  paymentReliability: number;
  disputeRate: number;
  cancellationRate: number;
}
```

### Seller Intelligence Profile

```typescript
interface SellerIntelligenceProfile {
  sellerId: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'new';

  // Capability signals
  categoryStrengths: Map<string, number>;
  priceCompetitiveness: Map<string, number>; // Category -> percentile
  capacityUtilization: number;
  maxWeeklyOrders: number;

  // Performance signals
  onTimeDeliveryRate: number;
  qualityScore: number;
  responseTime: number;                      // Avg hours to respond to RFQ
  quoteAcceptanceRate: number;

  // Relationship signals
  repeatCustomerRate: number;
  customerSatisfactionIndex: number;
  disputeResolutionScore: number;

  // Business health
  orderGrowthTrend: number;
  inventoryTurnover: number;
  listingFreshness: number;
}
```

### Match Surfacing (Invisible to Users)

```typescript
// When buyer browses marketplace
async function getEnhancedMarketplaceItems(
  buyerId: string,
  filters: MarketplaceFilters
): Promise<MarketplaceItem[]> {
  // Get base items matching filters
  const items = await getMarketplaceItems(filters);

  // Calculate affinity for each seller
  const sellerIds = [...new Set(items.map(i => i.sellerId))];
  const affinities = await Promise.all(
    sellerIds.map(sid => calculateBuyerSellerAffinity(buyerId, sid))
  );
  const affinityMap = new Map(affinities.map(a => [a.sellerId, a]));

  // Enhance items with invisible ranking boost
  return items.map(item => ({
    ...item,
    _internalRankBoost: affinityMap.get(item.sellerId)?.affinityScore || 50,
  })).sort((a, b) => {
    // Primary: user's explicit sort
    // Secondary: affinity boost (invisible tiebreaker)
    return b._internalRankBoost - a._internalRankBoost;
  });
}
```

---

## 2. Price Fairness Engine

### Purpose
Ensure prices are fair for both parties: buyers get competitive rates, sellers maintain healthy margins. The system prevents race-to-bottom pricing while flagging exploitative markups.

### Fairness Model

```typescript
interface PriceFairnessAnalysis {
  itemId: string;
  requestedPrice: number;

  // Market context
  marketMedian: number;
  marketRange: { p10: number; p25: number; p75: number; p90: number };
  categoryBenchmark: number;

  // Fairness assessment
  buyerFairnessScore: number;    // 0-100: Is this fair for the buyer?
  sellerFairnessScore: number;   // 0-100: Is this fair for the seller?
  equilibriumScore: number;      // 0-100: Balance between both

  // Signals
  isPriceGouging: boolean;
  isUnsustainablyLow: boolean;
  suggestedRange: { min: number; optimal: number; max: number };
}

async function analyzePriceFairness(
  itemId: string,
  sellerId: string,
  proposedPrice: number,
  quantity: number
): Promise<PriceFairnessAnalysis> {
  const [marketData, sellerCosts, categoryData] = await Promise.all([
    getMarketPriceData(itemId),
    getSellerCostStructure(sellerId, itemId),
    getCategoryPricingTrends(itemId),
  ]);

  // Calculate market position
  const marketMedian = marketData.median;
  const pricePercentile = calculatePercentile(proposedPrice, marketData.distribution);

  // Buyer fairness: Are they paying a reasonable price?
  const buyerFairnessScore = calculateBuyerFairness({
    proposedPrice,
    marketMedian,
    pricePercentile,
    qualityTier: await getSellerQualityTier(sellerId),
    volumeDiscount: calculateExpectedVolumeDiscount(quantity),
  });

  // Seller fairness: Can they sustain this price?
  const estimatedMargin = calculateEstimatedMargin(proposedPrice, sellerCosts, quantity);
  const sellerFairnessScore = calculateSellerFairness({
    estimatedMargin,
    minimumViableMargin: sellerCosts.minMargin || 0.15,
    marketCompetitiveness: pricePercentile,
    volumeBenefit: quantity > sellerCosts.breakEvenVolume,
  });

  // Equilibrium: Both parties should benefit
  const equilibriumScore = Math.min(buyerFairnessScore, sellerFairnessScore);

  return {
    itemId,
    requestedPrice: proposedPrice,
    marketMedian,
    marketRange: marketData.percentiles,
    categoryBenchmark: categoryData.avgPrice,
    buyerFairnessScore,
    sellerFairnessScore,
    equilibriumScore,
    isPriceGouging: pricePercentile > 90 && buyerFairnessScore < 30,
    isUnsustainablyLow: sellerFairnessScore < 20,
    suggestedRange: calculateOptimalRange(marketData, sellerCosts, quantity),
  };
}
```

### Dynamic Price Guidance

```typescript
// For sellers when responding to RFQs
async function generatePricingGuidance(
  sellerId: string,
  rfqId: string
): Promise<PricingGuidance> {
  const rfq = await getRFQ(rfqId);
  const fairnessAnalysis = await analyzePriceFairness(
    rfq.itemId,
    sellerId,
    rfq.requestedPrice || 0,
    rfq.quantity
  );

  const buyerProfile = await getBuyerIntelligenceProfile(rfq.buyerId);
  const transactionHistory = await getTransactionHistory(rfq.buyerId, sellerId);

  return {
    suggestedPrice: fairnessAnalysis.suggestedRange.optimal,
    priceFloor: fairnessAnalysis.suggestedRange.min,
    priceCeiling: fairnessAnalysis.suggestedRange.max,

    // Contextual adjustments
    loyaltyAdjustment: calculateLoyaltyDiscount(transactionHistory),
    volumeAdjustment: calculateVolumeDiscount(rfq.quantity),
    urgencyPremium: rfq.isUrgent ? calculateUrgencyPremium(rfq) : 0,

    // Competitive context (anonymized)
    competitorRange: {
      low: fairnessAnalysis.marketRange.p25,
      high: fairnessAnalysis.marketRange.p75,
    },

    // Win probability estimation
    estimatedWinProbability: calculateWinProbability(
      fairnessAnalysis.suggestedRange.optimal,
      buyerProfile,
      transactionHistory
    ),
  };
}
```

### Fairness Monitoring

```typescript
// Background job: Monitor for fairness violations
async function monitorPriceFairness(): Promise<void> {
  const recentTransactions = await getRecentTransactions(24 * 60); // Last 24 hours

  for (const tx of recentTransactions) {
    const analysis = await analyzePriceFairness(
      tx.itemId,
      tx.sellerId,
      tx.unitPrice,
      tx.quantity
    );

    if (analysis.isPriceGouging) {
      await flagForReview({
        type: 'price_gouging',
        transactionId: tx.id,
        severity: 'high',
        analysis,
      });
    }

    if (analysis.isUnsustainablyLow) {
      // Don't punish, but track for seller health
      await recordSellerHealthSignal({
        sellerId: tx.sellerId,
        signal: 'unsustainable_pricing',
        data: analysis,
      });
    }
  }
}
```

---

## 3. Trust Evolution Engine

### Purpose
Build and track trust between parties over time. New users start with neutral trust; each interaction either builds or erodes it. Trust affects visibility, ranking, and access to features.

### Trust Model

```typescript
interface TrustScore {
  score: number;              // 0-100
  level: TrustLevel;
  trend: 'rising' | 'stable' | 'falling';
  confidence: number;         // How reliable is this score?
  lastUpdated: Date;
}

type TrustLevel =
  | 'unverified'    // New user, no history
  | 'emerging'      // Some positive signals
  | 'established'   // Consistent good behavior
  | 'trusted'       // Strong track record
  | 'premium'       // Exceptional trust
  | 'at_risk'       // Recent negative signals
  | 'suspended';    // Trust violations

interface TrustEvent {
  eventType: TrustEventType;
  timestamp: Date;
  impact: number;             // Positive or negative
  decay: number;              // How fast this event's impact fades
  source: string;
}

type TrustEventType =
  // Positive events
  | 'order_completed'
  | 'on_time_delivery'
  | 'quality_confirmation'
  | 'positive_review'
  | 'dispute_resolved_fairly'
  | 'payment_on_time'
  | 'profile_verified'

  // Negative events
  | 'late_delivery'
  | 'order_cancelled_by_party'
  | 'quality_complaint'
  | 'payment_delayed'
  | 'dispute_filed'
  | 'policy_violation';
```

### Trust Calculation

```typescript
async function calculateTrustScore(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<TrustScore> {
  const events = await getTrustEvents(userId, { limit: 500 });
  const accountAge = await getAccountAge(userId);

  // Base score from account age and verification
  let baseScore = 50;
  if (accountAge < 30) baseScore = 30;  // New accounts start lower

  const verifications = await getVerifications(userId);
  baseScore += verifications.email ? 5 : 0;
  baseScore += verifications.phone ? 5 : 0;
  baseScore += verifications.business ? 10 : 0;

  // Apply events with time decay
  const now = new Date();
  let eventScore = 0;

  for (const event of events) {
    const ageInDays = (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const decayedImpact = event.impact * Math.exp(-event.decay * ageInDays / 365);
    eventScore += decayedImpact;
  }

  // Combine base and event scores
  const rawScore = baseScore + eventScore;
  const score = Math.max(0, Math.min(100, rawScore));

  // Determine level
  const level = getTrustLevel(score, events);

  // Calculate trend
  const recentEvents = events.filter(e =>
    (now.getTime() - e.timestamp.getTime()) < 30 * 24 * 60 * 60 * 1000
  );
  const trend = calculateTrend(recentEvents);

  return {
    score,
    level,
    trend,
    confidence: calculateConfidence(events.length, accountAge),
    lastUpdated: now,
  };
}

function getTrustLevel(score: number, events: TrustEvent[]): TrustLevel {
  const recentNegatives = events.filter(e =>
    e.impact < 0 &&
    (Date.now() - e.timestamp.getTime()) < 90 * 24 * 60 * 60 * 1000
  );

  if (recentNegatives.length > 3) return 'at_risk';
  if (score >= 90) return 'premium';
  if (score >= 75) return 'trusted';
  if (score >= 60) return 'established';
  if (score >= 40) return 'emerging';
  return 'unverified';
}
```

### Trust Event Recording

```typescript
// Automatically record trust events from platform activity
async function recordTrustEvent(event: {
  userId: string;
  eventType: TrustEventType;
  context: Record<string, any>;
}): Promise<void> {
  const impactConfig = TRUST_EVENT_IMPACTS[event.eventType];

  await prisma.trustEvent.create({
    data: {
      userId: event.userId,
      eventType: event.eventType,
      impact: impactConfig.baseImpact,
      decay: impactConfig.decay,
      context: event.context,
      timestamp: new Date(),
    },
  });

  // Trigger recalculation
  await queueTrustRecalculation(event.userId);
}

const TRUST_EVENT_IMPACTS: Record<TrustEventType, { baseImpact: number; decay: number }> = {
  // Positive events
  order_completed: { baseImpact: 2, decay: 0.5 },
  on_time_delivery: { baseImpact: 3, decay: 0.3 },
  quality_confirmation: { baseImpact: 2, decay: 0.4 },
  positive_review: { baseImpact: 4, decay: 0.2 },
  dispute_resolved_fairly: { baseImpact: 5, decay: 0.3 },
  payment_on_time: { baseImpact: 2, decay: 0.5 },
  profile_verified: { baseImpact: 10, decay: 0.1 },

  // Negative events
  late_delivery: { baseImpact: -5, decay: 0.4 },
  order_cancelled_by_party: { baseImpact: -3, decay: 0.5 },
  quality_complaint: { baseImpact: -8, decay: 0.3 },
  payment_delayed: { baseImpact: -4, decay: 0.4 },
  dispute_filed: { baseImpact: -10, decay: 0.3 },
  policy_violation: { baseImpact: -20, decay: 0.2 },
};
```

### Trust-Based Features

```typescript
// Gate features based on trust level
const TRUST_FEATURE_GATES: Record<string, TrustLevel[]> = {
  'instant_buy': ['established', 'trusted', 'premium'],
  'net_30_payment': ['trusted', 'premium'],
  'priority_support': ['trusted', 'premium'],
  'bulk_rfq': ['established', 'trusted', 'premium'],
  'api_access': ['trusted', 'premium'],
  'featured_listings': ['premium'],
};

async function canAccessFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  const trustScore = await calculateTrustScore(userId, 'seller');
  const requiredLevels = TRUST_FEATURE_GATES[feature] || [];
  return requiredLevels.includes(trustScore.level);
}
```

### Relationship Trust (Buyer-Seller Pairs)

```typescript
interface RelationshipTrust {
  buyerId: string;
  sellerId: string;
  trustScore: number;
  transactionCount: number;
  totalValue: number;
  lastTransaction: Date;

  // Relationship signals
  repeatRate: number;
  avgNegotiationRounds: number;
  disputeCount: number;
  avgRating: number;
}

async function getRelationshipTrust(
  buyerId: string,
  sellerId: string
): Promise<RelationshipTrust> {
  const transactions = await getTransactionHistory(buyerId, sellerId);

  if (transactions.length === 0) {
    return {
      buyerId,
      sellerId,
      trustScore: 50,  // Neutral for new relationships
      transactionCount: 0,
      totalValue: 0,
      lastTransaction: null,
      repeatRate: 0,
      avgNegotiationRounds: 0,
      disputeCount: 0,
      avgRating: 0,
    };
  }

  const disputes = transactions.filter(t => t.hadDispute);
  const ratings = transactions.filter(t => t.rating).map(t => t.rating);

  // Calculate relationship-specific trust
  const trustScore = calculateRelationshipTrustScore({
    transactionCount: transactions.length,
    successRate: (transactions.length - disputes.length) / transactions.length,
    avgRating: ratings.length > 0 ? avg(ratings) : 3,
    recency: daysSince(transactions[0].completedAt),
    valueProgression: calculateValueTrend(transactions),
  });

  return {
    buyerId,
    sellerId,
    trustScore,
    transactionCount: transactions.length,
    totalValue: sum(transactions.map(t => t.totalPrice)),
    lastTransaction: transactions[0].completedAt,
    repeatRate: calculateRepeatRate(transactions),
    avgNegotiationRounds: avg(transactions.map(t => t.negotiationRounds || 1)),
    disputeCount: disputes.length,
    avgRating: ratings.length > 0 ? avg(ratings) : 0,
  };
}
```

---

## 4. Invisible Ranking Logic

### Purpose
Rank search results, recommendations, and listings without exposing the algorithm. Users see "relevant results" but don't know exactly why certain items appear higher.

### Ranking Architecture

```typescript
interface RankingContext {
  userId: string;
  userRole: 'buyer' | 'seller';
  query?: string;
  filters: Record<string, any>;
  page: number;
  limit: number;
}

interface RankingFactors {
  // Relevance factors
  textRelevance: number;        // Query match quality
  filterMatch: number;          // How well it matches explicit filters

  // Intelligence factors
  affinityScore: number;        // Buyer-seller affinity
  trustBoost: number;           // Seller trust score
  fairnessBoost: number;        // Price fairness for buyer

  // Business factors
  conversionPotential: number;  // Likelihood to convert
  marginPotential: number;      // Platform revenue potential
  retentionImpact: number;      // Impact on user retention

  // Freshness & activity
  listingFreshness: number;     // How recently updated
  sellerActivityScore: number;  // Seller engagement level
}

interface RankedItem {
  item: MarketplaceItem;
  finalScore: number;
  factors: RankingFactors;      // Internal only, never exposed
}
```

### Multi-Objective Ranking

```typescript
async function rankItems(
  items: MarketplaceItem[],
  context: RankingContext
): Promise<RankedItem[]> {
  const buyerProfile = await getBuyerIntelligenceProfile(context.userId);

  const rankedItems = await Promise.all(items.map(async (item) => {
    const factors = await calculateRankingFactors(item, context, buyerProfile);
    const finalScore = calculateFinalScore(factors, context);

    return { item, finalScore, factors };
  }));

  // Sort by final score
  rankedItems.sort((a, b) => b.finalScore - a.finalScore);

  // Apply diversity rules (don't show all items from one seller)
  const diversifiedResults = applyDiversityRules(rankedItems);

  // Apply business rules (featured items, promotions)
  const finalResults = applyBusinessRules(diversifiedResults, context);

  return finalResults;
}

function calculateFinalScore(
  factors: RankingFactors,
  context: RankingContext
): number {
  // Weights optimized for user satisfaction + business metrics
  // These weights are A/B tested and updated periodically
  const weights = {
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

  return Object.entries(weights).reduce((score, [factor, weight]) => {
    return score + (factors[factor as keyof RankingFactors] * weight);
  }, 0);
}
```

### Diversity Rules

```typescript
function applyDiversityRules(items: RankedItem[]): RankedItem[] {
  const result: RankedItem[] = [];
  const sellerCounts = new Map<string, number>();
  const categoryPositions = new Map<string, number[]>();

  for (const item of items) {
    const sellerId = item.item.sellerId;
    const category = item.item.category;

    const sellerCount = sellerCounts.get(sellerId) || 0;

    // Max 3 items from same seller in top 20
    if (result.length < 20 && sellerCount >= 3) {
      // Defer this item
      continue;
    }

    // Ensure category diversity in top 10
    if (result.length < 10) {
      const catPositions = categoryPositions.get(category) || [];
      if (catPositions.length >= 2 && catPositions.every(p => p < 5)) {
        // Already have 2 items from this category in top 5
        continue;
      }
      categoryPositions.set(category, [...catPositions, result.length]);
    }

    result.push(item);
    sellerCounts.set(sellerId, sellerCount + 1);
  }

  return result;
}
```

### Personalization Signals

```typescript
async function calculatePersonalizationFactors(
  item: MarketplaceItem,
  buyerProfile: BuyerIntelligenceProfile
): Promise<Partial<RankingFactors>> {
  // Category affinity
  const categoryAffinity = buyerProfile.categoryAffinities.get(item.category) || 50;

  // Price alignment
  const priceInRange =
    item.price >= buyerProfile.preferredPriceRange.min &&
    item.price <= buyerProfile.preferredPriceRange.max;
  const priceAlignment = priceInRange ? 100 :
    Math.max(0, 100 - Math.abs(item.price - buyerProfile.avgOrderValue) / buyerProfile.avgOrderValue * 50);

  // Seller relationship
  const relationshipTrust = await getRelationshipTrust(buyerProfile.buyerId, item.sellerId);
  const relationshipBonus = relationshipTrust.transactionCount > 0 ?
    Math.min(100, 50 + relationshipTrust.trustScore / 2) : 50;

  return {
    affinityScore: (categoryAffinity + priceAlignment + relationshipBonus) / 3,
    conversionPotential: calculateConversionPotential(item, buyerProfile),
    retentionImpact: calculateRetentionImpact(item, buyerProfile),
  };
}
```

### Why Invisible?

The ranking logic is deliberately opaque because:

1. **Prevents Gaming**: Sellers can't reverse-engineer the algorithm
2. **Flexibility**: We can A/B test and iterate without user expectations
3. **Fairness**: Users trust "relevance" more than explicit factors
4. **Competitive Advantage**: Differentiated matching is defensible

```typescript
// What users see vs. what we compute

// API Response (what users see)
{
  "items": [
    { "id": "item-1", "name": "Hydraulic Pump XL-500", ... },
    { "id": "item-2", "name": "Hydraulic Pump Pro-400", ... },
  ],
  "pagination": { "page": 1, "total": 45 }
}

// Internal (what we compute, never exposed)
{
  "items": [
    {
      "item": { "id": "item-1", ... },
      "finalScore": 87.3,
      "factors": {
        "textRelevance": 95,
        "affinityScore": 82,
        "trustBoost": 91,
        "fairnessBoost": 78,
        ...
      }
    },
    ...
  ]
}
```

---

## 5. Database Schema Additions

```prisma
// Intelligence profiles
model BuyerIntelligenceProfile {
  id                    String   @id @default(cuid())
  buyerId               String   @unique
  segment               String   @default("smb")

  // Computed metrics (updated by background job)
  avgOrderValue         Float    @default(0)
  avgOrderFrequency     Float    @default(0)
  priceElasticity       Float    @default(0.5)
  qualityThreshold      Float    @default(0.7)
  loyaltyIndex          Float    @default(0.5)
  explorationRate       Float    @default(0.5)
  urgencyProfile        String   @default("standard")
  negotiationStyle      String   @default("flexible")

  // Risk metrics
  paymentReliability    Float    @default(1.0)
  disputeRate           Float    @default(0)
  cancellationRate      Float    @default(0)

  // Category affinities (JSON map)
  categoryAffinities    Json     @default("{}")

  lastComputed          DateTime @default(now())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model SellerIntelligenceProfile {
  id                    String   @id @default(cuid())
  sellerId              String   @unique
  tier                  String   @default("new")

  // Performance metrics
  onTimeDeliveryRate    Float    @default(1.0)
  qualityScore          Float    @default(0.8)
  avgResponseTime       Float    @default(24)
  quoteAcceptanceRate   Float    @default(0.5)

  // Capacity metrics
  capacityUtilization   Float    @default(0.5)
  maxWeeklyOrders       Int      @default(50)

  // Relationship metrics
  repeatCustomerRate    Float    @default(0)
  customerSatisfaction  Float    @default(0.8)
  disputeResolution     Float    @default(0.8)

  // Business health
  orderGrowthTrend      Float    @default(0)
  inventoryTurnover     Float    @default(0)
  listingFreshness      Float    @default(1.0)

  // Category strengths (JSON map)
  categoryStrengths     Json     @default("{}")
  priceCompetitiveness  Json     @default("{}")

  lastComputed          DateTime @default(now())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model TrustEvent {
  id          String   @id @default(cuid())
  userId      String
  eventType   String
  impact      Float
  decay       Float
  context     Json     @default("{}")
  timestamp   DateTime @default(now())

  @@index([userId, timestamp])
}

model TrustScore {
  id          String   @id @default(cuid())
  userId      String   @unique
  role        String   // "buyer" or "seller"
  score       Float
  level       String
  trend       String
  confidence  Float
  lastUpdated DateTime @default(now())

  @@index([userId])
}

model RelationshipTrust {
  id                String   @id @default(cuid())
  buyerId           String
  sellerId          String
  trustScore        Float    @default(50)
  transactionCount  Int      @default(0)
  totalValue        Float    @default(0)
  lastTransaction   DateTime?
  repeatRate        Float    @default(0)
  avgNegotiationRounds Float @default(1)
  disputeCount      Int      @default(0)
  avgRating         Float    @default(0)

  @@unique([buyerId, sellerId])
  @@index([buyerId])
  @@index([sellerId])
}

model PriceFairnessSnapshot {
  id              String   @id @default(cuid())
  itemId          String
  sellerId        String

  // Market data
  marketMedian    Float
  marketP10       Float
  marketP25       Float
  marketP75       Float
  marketP90       Float

  // Computed at snapshot time
  snapshotDate    DateTime @default(now())

  @@index([itemId, snapshotDate])
}
```

---

## 6. Retention & Revenue Impact

### How This Improves Buyer Retention

| Mechanism | Impact | Metric |
|-----------|--------|--------|
| **Better Matches** | Buyers find suitable sellers faster | ↓ Time to first order |
| **Fair Pricing** | Buyers trust the platform | ↑ Repeat purchase rate |
| **Trust Signals** | Buyers feel safe transacting | ↓ Abandonment rate |
| **Personalization** | Relevant recommendations | ↑ Orders per buyer |

```typescript
// Retention model
const RETENTION_IMPACT = {
  smartMatching: {
    timeToFirstOrder: -40,      // 40% faster
    firstOrderConversion: +25,  // 25% more likely to order
  },
  priceFairness: {
    repeatPurchaseRate: +30,    // 30% more repeat purchases
    lifetimeValue: +45,         // 45% higher LTV
  },
  trustEvolution: {
    abandonmentRate: -35,       // 35% less abandonment
    referralRate: +20,          // 20% more referrals
  },
};
```

### How This Improves Seller Retention

| Mechanism | Impact | Metric |
|-----------|--------|--------|
| **Quality Leads** | Better buyer matches | ↑ Quote acceptance rate |
| **Pricing Guidance** | Sustainable margins | ↓ Churn from unprofitability |
| **Trust Rewards** | Good sellers surface higher | ↑ Order volume for top sellers |
| **Fair Competition** | Level playing field | ↓ Churn from frustration |

```typescript
const SELLER_RETENTION_IMPACT = {
  smartMatching: {
    quoteAcceptanceRate: +35,   // Better leads convert more
    wastedQuoteEffort: -50,     // Less time on bad-fit RFQs
  },
  priceFairness: {
    healthyMarginRate: +40,     // More profitable orders
    raceToBottomPrevention: true,
  },
  trustEvolution: {
    topSellerVisibility: +60,   // Premium sellers get more views
    newSellerOnboarding: -25,   // Faster path to trust
  },
};
```

### Revenue Impact Model

```typescript
interface RevenueImpact {
  // Direct revenue
  gmvIncrease: number;          // More transactions
  takeRateOptimization: number; // Better margin on transactions

  // Indirect revenue
  reducedCAC: number;           // Lower customer acquisition cost
  reducedChurn: number;         // Lower revenue loss from churn
  increasedLTV: number;         // Higher lifetime value

  // Network effects
  supplyGrowth: number;         // More sellers = more buyers
  demandGrowth: number;         // More buyers = more sellers
}

const PROJECTED_REVENUE_IMPACT: RevenueImpact = {
  gmvIncrease: 0.25,            // 25% more GMV from better matching
  takeRateOptimization: 0.02,   // 2% better margins from fair pricing

  reducedCAC: 0.15,             // 15% lower CAC from referrals
  reducedChurn: 0.30,           // 30% less churn
  increasedLTV: 0.40,           // 40% higher LTV

  supplyGrowth: 0.20,           // 20% more sellers from fair treatment
  demandGrowth: 0.25,           // 25% more buyers from better experience
};
```

### Flywheel Effect

```
    ┌─────────────────────────────────────────────────────┐
    │                                                     │
    ▼                                                     │
┌───────────┐    Better     ┌───────────┐    More      ┌──┴────────┐
│  Smart    │───Matches───▶│  Higher   │───Orders───▶│  More     │
│  Matching │              │ Conversion │              │  Data     │
└───────────┘              └───────────┘              └───────────┘
                                                           │
    ┌──────────────────────────────────────────────────────┘
    │
    ▼
┌───────────┐    Trust      ┌───────────┐   Network    ┌───────────┐
│  Better   │───Builds────▶│  More     │───Effects──▶│  Higher   │
│  Profiles │              │  Users    │              │  Revenue  │
└───────────┘              └───────────┘              └───────────┘
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Add intelligence profile tables to schema
- [ ] Create background jobs for profile computation
- [ ] Implement basic trust event recording
- [ ] Add trust score calculation

### Phase 2: Matching Engine (Weeks 3-4)
- [ ] Implement buyer-seller affinity scoring
- [ ] Add affinity-boosted marketplace results
- [ ] Create RFQ smart routing
- [ ] Build A/B testing framework

### Phase 3: Price Fairness (Weeks 5-6)
- [ ] Implement market price tracking
- [ ] Build fairness analysis service
- [ ] Add pricing guidance to RFQ response UI
- [ ] Create fairness monitoring alerts

### Phase 4: Trust Evolution (Weeks 7-8)
- [ ] Complete trust event taxonomy
- [ ] Implement trust-gated features
- [ ] Build relationship trust tracking
- [ ] Create trust dashboard for internal monitoring

### Phase 5: Optimization (Ongoing)
- [ ] A/B test ranking weights
- [ ] ML model for conversion prediction
- [ ] Continuous fairness calibration
- [ ] Seller tier automation

---

## 8. Key Metrics to Track

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Time to First Match | - | -40% | Avg days from signup to first order |
| Quote Acceptance Rate | - | +35% | Accepted quotes / Total quotes |
| Buyer Repeat Rate | - | +30% | Buyers with 2+ orders / Total buyers |
| Seller Churn | - | -25% | Monthly seller deactivation rate |
| Price Fairness Index | - | >0.7 | Avg equilibrium score across transactions |
| Trust Score Distribution | - | Normal | % users at each trust level |
| GMV per Active User | - | +40% | Monthly GMV / Active users |

---

## Summary

The Cross-Intelligence Layer transforms your marketplace from a passive listing service into an active matchmaker that:

1. **Smart Matching**: Connects buyers with optimal sellers based on 7+ factors
2. **Price Fairness**: Ensures sustainable pricing for both parties
3. **Trust Evolution**: Builds and rewards trustworthy behavior over time
4. **Invisible Ranking**: Surfaces the best results without exposing the algorithm

This creates a **virtuous cycle** where better matches lead to more data, which leads to even better matches, driving retention and revenue growth.
