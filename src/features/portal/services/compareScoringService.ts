// =============================================================================
// Compare Scoring Service - Quote Comparison API Client
// =============================================================================
//
// NOTE: This is a thin API client. All scoring algorithms live in the backend.
// See: server/src/services/rfqScoringService.ts
//
// Scoring engine moved to backend during service consolidation - see SERVICE_CONSOLIDATION_REPORT.md
// The following logic was moved:
// - calculateBreakdown() - Score calculation for each attribute
// - calculateTotalScore() - Weighted score aggregation
// - generateProsAndCons() - Pros/cons based on scores
// - generateBestPickReasons() - Best pick reasoning
// - detectTradeOffs() - Trade-off analysis between products
// - generateReasoning() - Explainable AI reasoning
// - calculateRecommendation() - Main scoring orchestration
// - scoreManualCompare() - Manual comparison scoring
// =============================================================================

import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types (kept for frontend consumption)
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
  reasoning: QuoteReasoning;
  tradeOffs: TradeOff[];
}

export interface RecommendationResult {
  scores: ProductScore[];
  bestPickId: string | null;
  bestPickReasons: string[];
  confidenceScore: number;
  analysisDetails: AnalysisDetails;
}

export interface ScoringWeights {
  price: number;
  leadTime: number;
  availability: number;
  reliability: number;
  responseSpeed: number;
  moq: number;
  warranty: number;
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

export interface AnalysisDetails {
  weightsUsed: ScoringWeights;
  totalProductsCompared: number;
  dataCompleteness: number;
  missingDataWarnings: string[];
  normalizationMethod: 'min-max';
  calculatedAt: string;
}

export interface ManualCompareColumn {
  id: string;
  name: string;
}

export interface ManualCompareRow {
  id: string;
  metric: string;
  values: Record<string, string>;
}

export interface ManualCompareData {
  columns: ManualCompareColumn[];
  rows: ManualCompareRow[];
}

// =============================================================================
// API Client
// =============================================================================

export const compareScoringService = {
  /**
   * Calculate recommendation scores via backend API
   */
  async calculateRecommendation(
    products: ProductScoreInput[],
    customWeights?: Partial<ScoringWeights>,
  ): Promise<RecommendationResult> {
    return portalApiClient.post<RecommendationResult>('/api/compare/score', { products, weights: customWeights });
  },

  /**
   * Calculate recommendation using a weight preset
   */
  async calculateRecommendationWithPreset(
    products: ProductScoreInput[],
    presetKey: keyof typeof WEIGHT_PRESETS,
  ): Promise<RecommendationResult> {
    const preset = WEIGHT_PRESETS[presetKey];
    return this.calculateRecommendation(products, preset?.weights);
  },

  /**
   * Score manual comparison data
   */
  async scoreManualCompare(
    data: ManualCompareData,
  ): Promise<{ columnScores: Record<string, number>; bestColumnId: string | null }> {
    return portalApiClient.post<{ columnScores: Record<string, number>; bestColumnId: string | null }>(
      '/api/compare/manual',
      data,
    );
  },

  /**
   * Get available weight presets
   */
  getWeightPresets(): typeof WEIGHT_PRESETS {
    return WEIGHT_PRESETS;
  },

  /**
   * Get default weights
   */
  getDefaultWeights(): ScoringWeights {
    return DEFAULT_WEIGHTS;
  },
};

export default compareScoringService;

// Named exports for direct import
export const scoreManualCompare = compareScoringService.scoreManualCompare.bind(compareScoringService);
export const calculateRecommendation = compareScoringService.calculateRecommendation.bind(compareScoringService);

// All scoring logic moved to backend during service consolidation.
// The frontend now only:
// 1. Sends products and weights to POST /api/compare/score
// 2. Receives calculated scores, reasoning, and recommendations
// 3. Displays results to user
//
// Backend (server/src/services/rfqScoringService.ts) handles:
// - Score normalization (min-max)
// - Weighted score calculation
// - Pros/cons generation
// - Trade-off detection
// - Best pick determination
// - Explainable reasoning generation
