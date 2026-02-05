// =============================================================================
// Compare Scoring Service - Enterprise Quote Comparison Engine
// =============================================================================

// =============================================================================
// Types
// =============================================================================

export interface ProductScoreInput {
  id: string;
  name: string;
  price: number | null;
  leadTimeDays: number | null;
  stock: number | null;
  minOrderQty: number | null;
  responseSpeed: 'fast' | 'moderate' | 'slow' | null;
  reliabilityPercent: number | null;
  isVerified: boolean;
  isFastResponder: boolean;
  // New fields for enhanced scoring
  warrantyMonths?: number | null;
  paymentTermsDays?: number | null;
  certifications?: string[];
}

export interface ScoreBreakdown {
  price: number;
  leadTime: number;
  availability: number;
  reliability: number;
  responseSpeed: number;
  // New score factors
  moq: number;
  warranty: number;
}

export interface ProductScore {
  id: string;
  name: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  pros: string[];
  cons: string[];
  isBestPick: boolean;
  // New: Detailed reasoning
  reasoning: QuoteReasoning;
  tradeOffs: TradeOff[];
}

export interface RecommendationResult {
  scores: ProductScore[];
  bestPickId: string | null;
  bestPickReasons: string[];
  // New: Enhanced output
  confidenceScore: number;
  analysisDetails: AnalysisDetails;
}

// =============================================================================
// NEW: Configurable Scoring Weights
// =============================================================================

export interface ScoringWeights {
  price: number;      // Default: 25
  leadTime: number;   // Default: 20
  availability: number; // Default: 15
  reliability: number;  // Default: 15
  responseSpeed: number; // Default: 10
  moq: number;        // Default: 10
  warranty: number;   // Default: 5
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  price: 25,
  leadTime: 20,
  availability: 15,
  reliability: 15,
  responseSpeed: 10,
  moq: 10,
  warranty: 5,
};

// Weight presets for different use cases
export const WEIGHT_PRESETS: Record<string, { name: string; weights: ScoringWeights; description: string }> = {
  balanced: {
    name: 'Balanced',
    description: 'Equal consideration across all factors',
    weights: DEFAULT_WEIGHTS,
  },
  costFocused: {
    name: 'Cost Focused',
    description: 'Prioritizes lowest price and MOQ',
    weights: { price: 40, leadTime: 15, availability: 10, reliability: 10, responseSpeed: 5, moq: 15, warranty: 5 },
  },
  qualityFocused: {
    name: 'Quality Focused',
    description: 'Prioritizes reliability and warranty',
    weights: { price: 15, leadTime: 15, availability: 15, reliability: 25, responseSpeed: 10, moq: 5, warranty: 15 },
  },
  urgentDelivery: {
    name: 'Urgent Delivery',
    description: 'Prioritizes fastest lead time and availability',
    weights: { price: 15, leadTime: 35, availability: 25, reliability: 10, responseSpeed: 10, moq: 5, warranty: 0 },
  },
  bulkOrder: {
    name: 'Bulk Order',
    description: 'Prioritizes MOQ flexibility and pricing',
    weights: { price: 30, leadTime: 15, availability: 15, reliability: 10, responseSpeed: 5, moq: 20, warranty: 5 },
  },
};

// =============================================================================
// NEW: Explainable Reasoning Types
// =============================================================================

export interface QuoteReasoning {
  summary: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  comparisonHighlights: ComparisonHighlight[];
  confidence: 'high' | 'medium' | 'low';
  confidenceExplanation: string;
}

export interface ComparisonHighlight {
  factor: keyof ScoreBreakdown;
  label: string;
  value: string;
  rank: number;
  totalCompared: number;
  isBest: boolean;
  isWorst: boolean;
  percentageDifference?: number;
}

// =============================================================================
// NEW: Trade-off Analysis Types
// =============================================================================

export interface TradeOff {
  type: TradeOffType;
  description: string;
  severity: 'minor' | 'moderate' | 'significant';
  affectedFactors: (keyof ScoreBreakdown)[];
  recommendation: string;
}

export type TradeOffType =
  | 'price_vs_quality'
  | 'price_vs_speed'
  | 'moq_vs_price'
  | 'warranty_vs_price'
  | 'availability_vs_moq'
  | 'reliability_vs_cost';

// =============================================================================
// NEW: Analysis Details for Transparency
// =============================================================================

export interface AnalysisDetails {
  weightsUsed: ScoringWeights;
  totalProductsCompared: number;
  dataCompleteness: number; // 0-100
  missingDataWarnings: string[];
  normalizationMethod: 'min-max';
  calculatedAt: string;
}

// Legacy alias for backward compatibility
const WEIGHTS = DEFAULT_WEIGHTS;

// =============================================================================
// Normalization Functions
// =============================================================================

/**
 * Normalize a value to 0-100 scale (lower is better)
 */
const normalizeInverse = (value: number, min: number, max: number): number => {
  if (max === min) return 100;
  const normalized = ((max - value) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
};

/**
 * Normalize a value to 0-100 scale (higher is better)
 */
const normalizeDirect = (value: number, min: number, max: number): number => {
  if (max === min) return 100;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
};

// =============================================================================
// Score Calculation
// =============================================================================

/**
 * Calculate individual scores for each product attribute
 */
const calculateBreakdown = (
  product: ProductScoreInput,
  allProducts: ProductScoreInput[]
): ScoreBreakdown => {
  // Get valid values for each metric
  const prices = allProducts.map(p => p.price).filter((p): p is number => p !== null && p > 0);
  const leadTimes = allProducts.map(p => p.leadTimeDays).filter((l): l is number => l !== null);
  const stocks = allProducts.map(p => p.stock).filter((s): s is number => s !== null);
  const reliabilities = allProducts.map(p => p.reliabilityPercent).filter((r): r is number => r !== null);
  const moqs = allProducts.map(p => p.minOrderQty).filter((m): m is number => m !== null && m > 0);
  const warranties = allProducts.map(p => p.warrantyMonths).filter((w): w is number => w !== null && w > 0);

  // Price score (lower is better)
  let priceScore = 50; // Default for missing
  if (product.price !== null && product.price > 0 && prices.length > 0) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    priceScore = normalizeInverse(product.price, minPrice, maxPrice);
  }

  // Lead time score (lower is better)
  let leadTimeScore = 50;
  if (product.leadTimeDays !== null && leadTimes.length > 0) {
    const minLead = Math.min(...leadTimes);
    const maxLead = Math.max(...leadTimes);
    leadTimeScore = normalizeInverse(product.leadTimeDays, minLead, maxLead);
  }

  // Availability score (higher stock is better)
  let availabilityScore = 50;
  if (product.stock !== null && stocks.length > 0) {
    const minStock = Math.min(...stocks);
    const maxStock = Math.max(...stocks);
    availabilityScore = normalizeDirect(product.stock, minStock, maxStock);
    // Boost for in-stock
    if (product.stock > 0) availabilityScore = Math.min(100, availabilityScore + 20);
  }

  // Reliability score (higher is better)
  let reliabilityScore = 50;
  if (product.reliabilityPercent !== null && reliabilities.length > 0) {
    const minRel = Math.min(...reliabilities);
    const maxRel = Math.max(...reliabilities);
    reliabilityScore = normalizeDirect(product.reliabilityPercent, minRel, maxRel);
  }

  // Response speed score
  let responseSpeedScore = 50;
  if (product.responseSpeed) {
    switch (product.responseSpeed) {
      case 'fast':
        responseSpeedScore = 100;
        break;
      case 'moderate':
        responseSpeedScore = 60;
        break;
      case 'slow':
        responseSpeedScore = 30;
        break;
    }
  }

  // NEW: MOQ score (lower is better - more flexible)
  let moqScore = 50;
  if (product.minOrderQty !== null && moqs.length > 0) {
    const minMoq = Math.min(...moqs);
    const maxMoq = Math.max(...moqs);
    moqScore = normalizeInverse(product.minOrderQty, minMoq, maxMoq);
  }

  // NEW: Warranty score (higher is better)
  let warrantyScore = 50;
  if (product.warrantyMonths !== undefined && product.warrantyMonths !== null && warranties.length > 0) {
    const minWarranty = Math.min(...warranties);
    const maxWarranty = Math.max(...warranties);
    warrantyScore = normalizeDirect(product.warrantyMonths, minWarranty, maxWarranty);
  }

  // Bonus for verified/fast responder badges
  if (product.isVerified) reliabilityScore = Math.min(100, reliabilityScore + 10);
  if (product.isFastResponder) responseSpeedScore = Math.min(100, responseSpeedScore + 10);

  // Bonus for certifications
  if (product.certifications && product.certifications.length > 0) {
    reliabilityScore = Math.min(100, reliabilityScore + product.certifications.length * 5);
  }

  return {
    price: Math.round(priceScore),
    leadTime: Math.round(leadTimeScore),
    availability: Math.round(availabilityScore),
    reliability: Math.round(reliabilityScore),
    responseSpeed: Math.round(responseSpeedScore),
    moq: Math.round(moqScore),
    warranty: Math.round(warrantyScore),
  };
};

/**
 * Calculate weighted total score from breakdown
 */
const calculateTotalScore = (breakdown: ScoreBreakdown, weights: ScoringWeights = DEFAULT_WEIGHTS): number => {
  const totalWeight = weights.price + weights.leadTime + weights.availability +
                      weights.reliability + weights.responseSpeed + weights.moq + weights.warranty;

  const total =
    (breakdown.price * weights.price +
      breakdown.leadTime * weights.leadTime +
      breakdown.availability * weights.availability +
      breakdown.reliability * weights.reliability +
      breakdown.responseSpeed * weights.responseSpeed +
      breakdown.moq * weights.moq +
      breakdown.warranty * weights.warranty) /
    totalWeight;
  return Math.round(total);
};

/**
 * Validate that weights sum to 100 (or normalize them)
 */
export const normalizeWeights = (weights: ScoringWeights): ScoringWeights => {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total === 100) return weights;

  const factor = 100 / total;
  return {
    price: Math.round(weights.price * factor),
    leadTime: Math.round(weights.leadTime * factor),
    availability: Math.round(weights.availability * factor),
    reliability: Math.round(weights.reliability * factor),
    responseSpeed: Math.round(weights.responseSpeed * factor),
    moq: Math.round(weights.moq * factor),
    warranty: Math.round(weights.warranty * factor),
  };
};

// =============================================================================
// Pros/Cons Generation
// =============================================================================

/**
 * Generate pros and cons based on score breakdown
 */
const generateProsAndCons = (
  product: ProductScoreInput,
  breakdown: ScoreBreakdown,
  allProducts: ProductScoreInput[]
): { pros: string[]; cons: string[] } => {
  const pros: string[] = [];
  const cons: string[] = [];

  // Price analysis
  if (breakdown.price >= 80) {
    pros.push('Competitive pricing');
  } else if (breakdown.price <= 30 && product.price !== null) {
    cons.push('Higher price point');
  }

  // Lead time analysis
  if (breakdown.leadTime >= 80) {
    pros.push('Fast delivery');
  } else if (breakdown.leadTime <= 30 && product.leadTimeDays !== null) {
    cons.push('Longer lead time');
  }

  // Availability analysis
  if (product.stock !== null && product.stock > 50) {
    pros.push('High stock availability');
  } else if (product.stock !== null && product.stock === 0) {
    cons.push('Out of stock');
  } else if (product.stock !== null && product.stock < 10) {
    cons.push('Limited stock');
  }

  // Reliability analysis
  if (breakdown.reliability >= 80) {
    pros.push('High reliability');
  } else if (breakdown.reliability <= 40) {
    cons.push('Lower reliability score');
  }

  // Response speed analysis
  if (product.responseSpeed === 'fast' || product.isFastResponder) {
    pros.push('Fast response time');
  } else if (product.responseSpeed === 'slow') {
    cons.push('Slower response time');
  }

  // Badge bonuses
  if (product.isVerified) {
    pros.push('Verified supplier');
  }

  // Limit to top 3 each
  return {
    pros: pros.slice(0, 3),
    cons: cons.slice(0, 3),
  };
};

// =============================================================================
// Best Pick Reasons
// =============================================================================

/**
 * Generate reasons why a product is the best pick
 */
const generateBestPickReasons = (
  bestProduct: ProductScoreInput,
  breakdown: ScoreBreakdown,
  allProducts: ProductScoreInput[]
): string[] => {
  const reasons: string[] = [];

  // Find which metrics this product leads in
  const prices = allProducts.filter(p => p.price !== null && p.price > 0);
  if (prices.length > 0 && bestProduct.price !== null) {
    const lowestPrice = Math.min(...prices.map(p => p.price!));
    if (bestProduct.price === lowestPrice) {
      reasons.push('Lowest price among compared products');
    }
  }

  const leadTimes = allProducts.filter(p => p.leadTimeDays !== null);
  if (leadTimes.length > 0 && bestProduct.leadTimeDays !== null) {
    const fastestLead = Math.min(...leadTimes.map(p => p.leadTimeDays!));
    if (bestProduct.leadTimeDays === fastestLead) {
      reasons.push('Fastest delivery time');
    }
  }

  if (breakdown.reliability >= 80) {
    reasons.push('High supplier reliability rating');
  }

  if (bestProduct.isVerified) {
    reasons.push('Verified and trusted supplier');
  }

  if (bestProduct.stock !== null && bestProduct.stock > 50) {
    reasons.push('Strong stock availability');
  }

  if (bestProduct.responseSpeed === 'fast' || bestProduct.isFastResponder) {
    reasons.push('Quick response to inquiries');
  }

  // NEW: MOQ and warranty reasons
  const moqs = allProducts.filter(p => p.minOrderQty !== null && p.minOrderQty > 0);
  if (moqs.length > 0 && bestProduct.minOrderQty !== null) {
    const lowestMoq = Math.min(...moqs.map(p => p.minOrderQty!));
    if (bestProduct.minOrderQty === lowestMoq) {
      reasons.push('Most flexible minimum order quantity');
    }
  }

  const warranties = allProducts.filter(p => p.warrantyMonths !== null && p.warrantyMonths !== undefined && p.warrantyMonths > 0);
  if (warranties.length > 0 && bestProduct.warrantyMonths) {
    const longestWarranty = Math.max(...warranties.map(p => p.warrantyMonths!));
    if (bestProduct.warrantyMonths === longestWarranty) {
      reasons.push('Best warranty coverage');
    }
  }

  // Return top 3 reasons
  return reasons.slice(0, 3);
};

// =============================================================================
// NEW: Trade-off Detection Engine
// =============================================================================

/**
 * Detect trade-offs between products
 */
const detectTradeOffs = (
  product: ProductScoreInput,
  breakdown: ScoreBreakdown,
  allProducts: ProductScoreInput[],
  allBreakdowns: Map<string, ScoreBreakdown>
): TradeOff[] => {
  const tradeOffs: TradeOff[] = [];

  // Price vs Quality trade-off
  if (breakdown.price >= 70 && breakdown.reliability <= 50) {
    tradeOffs.push({
      type: 'price_vs_quality',
      description: 'Lower price comes with lower reliability rating',
      severity: breakdown.reliability <= 30 ? 'significant' : 'moderate',
      affectedFactors: ['price', 'reliability'],
      recommendation: 'Consider if cost savings justify potential quality risks',
    });
  }

  // Price vs Speed trade-off
  if (breakdown.price >= 70 && breakdown.leadTime <= 40) {
    tradeOffs.push({
      type: 'price_vs_speed',
      description: 'Lower price but longer delivery time',
      severity: breakdown.leadTime <= 20 ? 'significant' : 'moderate',
      affectedFactors: ['price', 'leadTime'],
      recommendation: 'Suitable if delivery deadline is flexible',
    });
  }

  // MOQ vs Price trade-off
  if (breakdown.moq <= 40 && breakdown.price >= 70) {
    tradeOffs.push({
      type: 'moq_vs_price',
      description: 'Good price but requires larger minimum order',
      severity: breakdown.moq <= 20 ? 'significant' : 'moderate',
      affectedFactors: ['moq', 'price'],
      recommendation: 'Best for bulk purchases; consider storage capacity',
    });
  }

  // Warranty vs Price trade-off
  if (breakdown.warranty <= 40 && breakdown.price >= 70) {
    tradeOffs.push({
      type: 'warranty_vs_price',
      description: 'Competitive price with limited warranty coverage',
      severity: breakdown.warranty <= 20 ? 'moderate' : 'minor',
      affectedFactors: ['warranty', 'price'],
      recommendation: 'Consider extended warranty options or risk tolerance',
    });
  }

  // Availability vs MOQ trade-off
  if (breakdown.availability >= 70 && breakdown.moq <= 40) {
    tradeOffs.push({
      type: 'availability_vs_moq',
      description: 'High stock available but requires large order quantity',
      severity: 'minor',
      affectedFactors: ['availability', 'moq'],
      recommendation: 'Ideal for planned bulk orders',
    });
  }

  // Reliability vs Cost trade-off
  if (breakdown.reliability >= 80 && breakdown.price <= 40) {
    tradeOffs.push({
      type: 'reliability_vs_cost',
      description: 'Premium reliability at higher price point',
      severity: 'minor',
      affectedFactors: ['reliability', 'price'],
      recommendation: 'Worth considering for mission-critical purchases',
    });
  }

  return tradeOffs;
};

// =============================================================================
// NEW: Explainable Reasoning Generator
// =============================================================================

/**
 * Generate detailed explainable reasoning for a product score
 */
const generateReasoning = (
  product: ProductScoreInput,
  breakdown: ScoreBreakdown,
  allProducts: ProductScoreInput[],
  allBreakdowns: Map<string, ScoreBreakdown>,
  isBestPick: boolean
): QuoteReasoning => {
  const comparisonHighlights: ComparisonHighlight[] = [];
  const factorLabels: Record<keyof ScoreBreakdown, string> = {
    price: 'Price',
    leadTime: 'Lead Time',
    availability: 'Stock Availability',
    reliability: 'Supplier Reliability',
    responseSpeed: 'Response Speed',
    moq: 'Min. Order Qty',
    warranty: 'Warranty',
  };

  // Calculate rankings for each factor
  const factors: (keyof ScoreBreakdown)[] = ['price', 'leadTime', 'availability', 'reliability', 'responseSpeed', 'moq', 'warranty'];

  factors.forEach(factor => {
    const allScores = Array.from(allBreakdowns.values()).map(b => b[factor]);
    const sortedScores = [...allScores].sort((a, b) => b - a);
    const rank = sortedScores.indexOf(breakdown[factor]) + 1;
    const bestScore = Math.max(...allScores);
    const worstScore = Math.min(...allScores);

    let valueStr = '';
    switch (factor) {
      case 'price':
        valueStr = product.price !== null ? `$${product.price.toLocaleString()}` : 'N/A';
        break;
      case 'leadTime':
        valueStr = product.leadTimeDays !== null ? `${product.leadTimeDays} days` : 'N/A';
        break;
      case 'availability':
        valueStr = product.stock !== null ? `${product.stock} units` : 'N/A';
        break;
      case 'reliability':
        valueStr = product.reliabilityPercent !== null ? `${product.reliabilityPercent}%` : 'N/A';
        break;
      case 'responseSpeed':
        valueStr = product.responseSpeed || 'N/A';
        break;
      case 'moq':
        valueStr = product.minOrderQty !== null ? `${product.minOrderQty} units` : 'N/A';
        break;
      case 'warranty':
        valueStr = product.warrantyMonths ? `${product.warrantyMonths} months` : 'N/A';
        break;
    }

    comparisonHighlights.push({
      factor,
      label: factorLabels[factor],
      value: valueStr,
      rank,
      totalCompared: allProducts.length,
      isBest: breakdown[factor] === bestScore,
      isWorst: breakdown[factor] === worstScore && allScores.length > 1,
      percentageDifference: bestScore > 0 ? Math.round(((breakdown[factor] - bestScore) / bestScore) * 100) : 0,
    });
  });

  // Generate key strengths (factors where this product ranks #1 or scores >= 75)
  const keyStrengths = comparisonHighlights
    .filter(h => h.isBest || (h.rank === 1 && !h.isWorst))
    .map(h => `Best ${h.label.toLowerCase()} among compared quotes`)
    .slice(0, 3);

  // Add high-score strengths if we don't have enough
  if (keyStrengths.length < 3) {
    const highScoreFactors = factors.filter(f => breakdown[f] >= 75 && !keyStrengths.some(s => s.includes(factorLabels[f].toLowerCase())));
    highScoreFactors.forEach(f => {
      if (keyStrengths.length < 3) {
        keyStrengths.push(`Strong ${factorLabels[f].toLowerCase()} score`);
      }
    });
  }

  // Generate key weaknesses (factors where this product ranks last or scores <= 40)
  const keyWeaknesses = comparisonHighlights
    .filter(h => h.isWorst || (breakdown[h.factor] <= 40 && !h.isBest))
    .map(h => `${h.label} could be improved`)
    .slice(0, 3);

  // Calculate confidence based on data completeness
  const dataPoints = [
    product.price !== null,
    product.leadTimeDays !== null,
    product.stock !== null,
    product.reliabilityPercent !== null,
    product.responseSpeed !== null,
    product.minOrderQty !== null,
    product.warrantyMonths !== null && product.warrantyMonths !== undefined,
  ];
  const completeness = dataPoints.filter(Boolean).length / dataPoints.length;
  const confidence: 'high' | 'medium' | 'low' = completeness >= 0.8 ? 'high' : completeness >= 0.5 ? 'medium' : 'low';

  // Generate summary
  const summary = isBestPick
    ? `This quote offers the best overall value based on your criteria, excelling in ${keyStrengths.length > 0 ? keyStrengths[0].replace('Best ', '').replace(' among compared quotes', '') : 'multiple factors'}.`
    : `This quote ${keyStrengths.length > 0 ? `shows strength in ${keyStrengths[0].replace('Best ', '').replace(' among compared quotes', '')}` : 'offers a balanced profile'} but ${keyWeaknesses.length > 0 ? `may have room for improvement in ${keyWeaknesses[0].replace(' could be improved', '').toLowerCase()}` : 'ranks below the top pick overall'}.`;

  const confidenceExplanation = confidence === 'high'
    ? 'Analysis based on complete data across all factors'
    : confidence === 'medium'
    ? 'Some data points missing; analysis may be less accurate'
    : 'Limited data available; consider requesting additional information';

  return {
    summary,
    keyStrengths,
    keyWeaknesses,
    comparisonHighlights,
    confidence,
    confidenceExplanation,
  };
};

/**
 * Calculate data completeness score
 */
const calculateDataCompleteness = (products: ProductScoreInput[]): { score: number; warnings: string[] } => {
  const warnings: string[] = [];
  let totalFields = 0;
  let filledFields = 0;

  products.forEach(p => {
    const fields = [
      { name: 'price', value: p.price, label: 'price' },
      { name: 'leadTime', value: p.leadTimeDays, label: 'lead time' },
      { name: 'stock', value: p.stock, label: 'stock' },
      { name: 'reliability', value: p.reliabilityPercent, label: 'reliability' },
      { name: 'responseSpeed', value: p.responseSpeed, label: 'response speed' },
      { name: 'moq', value: p.minOrderQty, label: 'MOQ' },
      { name: 'warranty', value: p.warrantyMonths, label: 'warranty' },
    ];

    fields.forEach(f => {
      totalFields++;
      if (f.value !== null && f.value !== undefined) {
        filledFields++;
      }
    });
  });

  // Generate warnings for commonly missing data
  const missingPrices = products.filter(p => p.price === null).length;
  const missingWarranty = products.filter(p => !p.warrantyMonths).length;

  if (missingPrices > 0) {
    warnings.push(`${missingPrices} product(s) missing price data`);
  }
  if (missingWarranty === products.length) {
    warnings.push('Warranty data not available for comparison');
  }

  return {
    score: Math.round((filledFields / totalFields) * 100),
    warnings,
  };
};

// =============================================================================
// Main Export Function
// =============================================================================

/**
 * Calculate scores and generate recommendations for compared products
 * @param products - Array of products to compare
 * @param customWeights - Optional custom scoring weights (defaults to balanced)
 */
export const calculateRecommendation = (
  products: ProductScoreInput[],
  customWeights?: Partial<ScoringWeights>
): RecommendationResult => {
  if (products.length === 0) {
    return {
      scores: [],
      bestPickId: null,
      bestPickReasons: [],
      confidenceScore: 0,
      analysisDetails: {
        weightsUsed: DEFAULT_WEIGHTS,
        totalProductsCompared: 0,
        dataCompleteness: 0,
        missingDataWarnings: [],
        normalizationMethod: 'min-max',
        calculatedAt: new Date().toISOString(),
      },
    };
  }

  // Merge custom weights with defaults
  const weights: ScoringWeights = customWeights
    ? normalizeWeights({ ...DEFAULT_WEIGHTS, ...customWeights })
    : DEFAULT_WEIGHTS;

  // Calculate data completeness
  const { score: dataCompleteness, warnings: missingDataWarnings } = calculateDataCompleteness(products);

  // Calculate breakdowns for all products first (needed for comparison)
  const allBreakdowns = new Map<string, ScoreBreakdown>();
  products.forEach(product => {
    allBreakdowns.set(product.id, calculateBreakdown(product, products));
  });

  // Calculate scores for each product
  const scores: ProductScore[] = products.map(product => {
    const breakdown = allBreakdowns.get(product.id)!;
    const totalScore = calculateTotalScore(breakdown, weights);
    const { pros, cons } = generateProsAndCons(product, breakdown, products);
    const tradeOffs = detectTradeOffs(product, breakdown, products, allBreakdowns);

    return {
      id: product.id,
      name: product.name,
      totalScore,
      breakdown,
      pros,
      cons,
      isBestPick: false,
      reasoning: generateReasoning(product, breakdown, products, allBreakdowns, false),
      tradeOffs,
    };
  });

  // Find best pick (highest score)
  const bestScore = Math.max(...scores.map(s => s.totalScore));
  const bestPick = scores.find(s => s.totalScore === bestScore);

  if (bestPick) {
    bestPick.isBestPick = true;
    // Regenerate reasoning for best pick with isBestPick = true
    const bestProduct = products.find(p => p.id === bestPick.id)!;
    const breakdown = allBreakdowns.get(bestPick.id)!;
    bestPick.reasoning = generateReasoning(bestProduct, breakdown, products, allBreakdowns, true);
  }

  // Generate best pick reasons
  const bestProduct = bestPick
    ? products.find(p => p.id === bestPick.id)
    : null;
  const bestPickReasons = bestProduct && bestPick
    ? generateBestPickReasons(bestProduct, bestPick.breakdown, products)
    : [];

  // Calculate confidence score based on data completeness and score spread
  const scoreSpread = bestScore - Math.min(...scores.map(s => s.totalScore));
  const confidenceScore = Math.round((dataCompleteness * 0.6) + (Math.min(scoreSpread, 30) * 0.4 / 30 * 100));

  return {
    scores,
    bestPickId: bestPick?.id || null,
    bestPickReasons,
    confidenceScore,
    analysisDetails: {
      weightsUsed: weights,
      totalProductsCompared: products.length,
      dataCompleteness,
      missingDataWarnings,
      normalizationMethod: 'min-max',
      calculatedAt: new Date().toISOString(),
    },
  };
};

/**
 * Calculate recommendation using a preset weight profile
 */
export const calculateRecommendationWithPreset = (
  products: ProductScoreInput[],
  presetKey: keyof typeof WEIGHT_PRESETS
): RecommendationResult => {
  const preset = WEIGHT_PRESETS[presetKey];
  return calculateRecommendation(products, preset?.weights);
};

// =============================================================================
// Manual Compare Scoring (for user-entered data)
// =============================================================================

export interface ManualCompareColumn {
  id: string;
  name: string;
}

export interface ManualCompareRow {
  id: string;
  metric: string;
  values: Record<string, string>; // columnId -> value
}

export interface ManualCompareData {
  columns: ManualCompareColumn[];
  rows: ManualCompareRow[];
}

/**
 * Score manual compare data (best effort based on numeric values)
 */
export const scoreManualCompare = (
  data: ManualCompareData
): { columnScores: Record<string, number>; bestColumnId: string | null } => {
  const columnScores: Record<string, number> = {};

  // Initialize scores
  data.columns.forEach(col => {
    columnScores[col.id] = 50; // Default neutral score
  });

  // Count wins per column for each row (higher numeric = better, lower price-like = better)
  const columnWins: Record<string, number> = {};
  data.columns.forEach(col => {
    columnWins[col.id] = 0;
  });

  data.rows.forEach(row => {
    const metricLower = row.metric.toLowerCase();
    const isLowerBetter = metricLower.includes('price') ||
                          metricLower.includes('cost') ||
                          metricLower.includes('lead') ||
                          metricLower.includes('time');

    // Get numeric values for this row
    const numericValues: { colId: string; value: number }[] = [];
    data.columns.forEach(col => {
      const rawValue = row.values[col.id] || '';
      const numValue = parseFloat(rawValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numValue)) {
        numericValues.push({ colId: col.id, value: numValue });
      }
    });

    // Find best value
    if (numericValues.length >= 2) {
      let bestColId: string | null = null;
      if (isLowerBetter) {
        const minVal = Math.min(...numericValues.map(v => v.value));
        bestColId = numericValues.find(v => v.value === minVal)?.colId || null;
      } else {
        const maxVal = Math.max(...numericValues.map(v => v.value));
        bestColId = numericValues.find(v => v.value === maxVal)?.colId || null;
      }
      if (bestColId) {
        columnWins[bestColId]++;
      }
    }
  });

  // Check if there are any actual wins (meaning data was entered and compared)
  const totalWins = Object.values(columnWins).reduce((sum, w) => sum + w, 0);

  // Only calculate scores if there's meaningful data
  if (totalWins === 0) {
    // No comparable data entered yet
    return { columnScores, bestColumnId: null };
  }

  // Calculate final scores based on win ratio
  const totalRows = data.rows.length || 1;
  data.columns.forEach(col => {
    const winRatio = columnWins[col.id] / totalRows;
    columnScores[col.id] = Math.round(50 + winRatio * 50);
  });

  // Find best column (only if there's a clear winner with more than 50 score)
  let bestColumnId: string | null = null;
  let maxScore = 50; // Must beat neutral score
  Object.entries(columnScores).forEach(([colId, score]) => {
    if (score > maxScore) {
      maxScore = score;
      bestColumnId = colId;
    }
  });

  return { columnScores, bestColumnId };
};

export default {
  calculateRecommendation,
  calculateRecommendationWithPreset,
  scoreManualCompare,
  normalizeWeights,
  DEFAULT_WEIGHTS,
  WEIGHT_PRESETS,
};
