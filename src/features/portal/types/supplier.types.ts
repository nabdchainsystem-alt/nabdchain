/**
 * Supplier Evaluation Types
 *
 * Score Calculation Methodology:
 *
 * 1. RELIABILITY SCORE (0-100)
 *    Weighted composite of:
 *    - Delivery Performance (40%): Based on on-time delivery rate
 *    - Quality Score (30%): Based on defect/return rate
 *    - Communication (20%): Based on response time metrics
 *    - Order Fulfillment (10%): Based on complete order rate
 *
 * 2. DEPENDENCY PERCENTAGE (0-100%)
 *    Formula: (Supplier Spend / Total Category Spend) × 100
 *    Risk Levels:
 *    - Low: < 30% dependency
 *    - Medium: 30-60% dependency
 *    - High: > 60% dependency (concentration risk)
 *
 * 3. DELIVERY DEVIATION (days)
 *    Formula: Average(Actual Delivery Date - Promised Delivery Date)
 *    - Negative = Early delivery
 *    - Zero = On-time
 *    - Positive = Late delivery
 *
 * 4. COMMUNICATION RESPONSIVENESS (0-100)
 *    Based on:
 *    - Average response time to inquiries
 *    - RFQ response rate
 *    - Issue resolution time
 */

// ============================================================================
// Core Types
// ============================================================================

export type SupplierStatus = 'active' | 'inactive' | 'on_hold' | 'blacklisted'
export type SupplierTier = 'strategic' | 'preferred' | 'approved' | 'conditional'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Supplier {
  id: string
  name: string
  code: string
  status: SupplierStatus
  tier: SupplierTier

  // Contact
  contactName: string
  contactEmail: string
  contactPhone?: string

  // Location
  country: string
  city?: string

  // Business Info
  categories: string[]
  paymentTerms: string
  leadTimeDays: number
  minimumOrderValue?: number

  // Dates
  partnerSince: string
  lastOrderDate?: string
  lastEvaluationDate?: string

  // Evaluation Metrics
  metrics: SupplierMetrics

  // Computed
  reliabilityScore: number
  riskLevel: RiskLevel
}

export interface SupplierMetrics {
  // Delivery Performance
  totalOrders: number
  onTimeDeliveries: number
  lateDeliveries: number
  earlyDeliveries: number
  averageDeliveryDeviation: number // days (negative = early, positive = late)

  // Quality
  totalUnitsReceived: number
  defectiveUnits: number
  returnedOrders: number
  qualityScore: number // 0-100

  // Communication
  averageResponseTimeHours: number
  rfqResponseRate: number // 0-1
  issueResolutionTimeHours: number
  communicationScore: number // 0-100

  // Financial
  totalSpend: number
  totalSpendYTD: number
  averageOrderValue: number
  dependencyPercentage: number // 0-100, % of category spend

  // Fulfillment
  completeOrderRate: number // 0-1, orders with all items fulfilled
  partialShipmentRate: number // 0-1
}

export interface SupplierEvaluationHistory {
  id: string
  supplierId: string
  evaluationDate: string
  reliabilityScore: number
  deliveryScore: number
  qualityScore: number
  communicationScore: number
  notes?: string
  evaluatedBy: string
}

// ============================================================================
// Score Calculation Weights
// ============================================================================

export const RELIABILITY_WEIGHTS = {
  delivery: 0.40,
  quality: 0.30,
  communication: 0.20,
  fulfillment: 0.10,
} as const

export const RESPONSE_TIME_THRESHOLDS = {
  excellent: 4,    // hours - score 90-100
  good: 12,        // hours - score 70-89
  acceptable: 24,  // hours - score 50-69
  poor: 48,        // hours - score 30-49
  // > 48 hours = score 0-29
} as const

export const DEPENDENCY_THRESHOLDS = {
  low: 30,
  medium: 60,
  // > 60 = high
} as const

export const DELIVERY_DEVIATION_THRESHOLDS = {
  excellent: 0,     // days - exactly on time
  good: 1,          // 1 day variance
  acceptable: 3,    // 2-3 days variance
  poor: 7,          // 4-7 days variance
  // > 7 days = critical
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate delivery performance score (0-100)
 * Based on on-time delivery rate with penalty for late deliveries
 */
export function calculateDeliveryScore(metrics: SupplierMetrics): number {
  if (metrics.totalOrders === 0) return 50 // No data, neutral score

  const onTimeRate = metrics.onTimeDeliveries / metrics.totalOrders
  const lateRate = metrics.lateDeliveries / metrics.totalOrders

  // Base score from on-time rate (0-85 points)
  let score = onTimeRate * 85

  // Bonus for early deliveries (up to 10 points)
  const earlyRate = metrics.earlyDeliveries / metrics.totalOrders
  score += earlyRate * 10

  // Penalty for severe lateness based on average deviation
  if (metrics.averageDeliveryDeviation > DELIVERY_DEVIATION_THRESHOLDS.poor) {
    score -= 15
  } else if (metrics.averageDeliveryDeviation > DELIVERY_DEVIATION_THRESHOLDS.acceptable) {
    score -= 10
  }

  // Additional penalty for high late rate
  if (lateRate > 0.3) {
    score -= 5
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calculate communication responsiveness score (0-100)
 * Based on response time and RFQ response rate
 */
export function calculateCommunicationScore(metrics: SupplierMetrics): number {
  const { averageResponseTimeHours, rfqResponseRate, issueResolutionTimeHours } = metrics

  // Response time score (0-50 points)
  let responseScore = 0
  if (averageResponseTimeHours <= RESPONSE_TIME_THRESHOLDS.excellent) {
    responseScore = 50
  } else if (averageResponseTimeHours <= RESPONSE_TIME_THRESHOLDS.good) {
    responseScore = 40
  } else if (averageResponseTimeHours <= RESPONSE_TIME_THRESHOLDS.acceptable) {
    responseScore = 30
  } else if (averageResponseTimeHours <= RESPONSE_TIME_THRESHOLDS.poor) {
    responseScore = 20
  } else {
    responseScore = 10
  }

  // RFQ response rate score (0-30 points)
  const rfqScore = rfqResponseRate * 30

  // Issue resolution score (0-20 points)
  let resolutionScore = 0
  if (issueResolutionTimeHours <= 24) {
    resolutionScore = 20
  } else if (issueResolutionTimeHours <= 48) {
    resolutionScore = 15
  } else if (issueResolutionTimeHours <= 72) {
    resolutionScore = 10
  } else {
    resolutionScore = 5
  }

  return Math.round(responseScore + rfqScore + resolutionScore)
}

/**
 * Calculate overall reliability score (0-100)
 * Weighted composite of all metrics
 */
export function calculateReliabilityScore(metrics: SupplierMetrics): number {
  const deliveryScore = calculateDeliveryScore(metrics)
  const qualityScore = metrics.qualityScore
  const communicationScore = metrics.communicationScore
  const fulfillmentScore = metrics.completeOrderRate * 100

  const weightedScore =
    (deliveryScore * RELIABILITY_WEIGHTS.delivery) +
    (qualityScore * RELIABILITY_WEIGHTS.quality) +
    (communicationScore * RELIABILITY_WEIGHTS.communication) +
    (fulfillmentScore * RELIABILITY_WEIGHTS.fulfillment)

  return Math.round(weightedScore)
}

/**
 * Determine risk level based on dependency and reliability
 */
export function determineRiskLevel(
  dependencyPercentage: number,
  reliabilityScore: number
): RiskLevel {
  // Critical: High dependency + Low reliability
  if (dependencyPercentage > DEPENDENCY_THRESHOLDS.medium && reliabilityScore < 50) {
    return 'critical'
  }

  // High: Either high dependency OR very low reliability
  if (dependencyPercentage > DEPENDENCY_THRESHOLDS.medium || reliabilityScore < 40) {
    return 'high'
  }

  // Medium: Moderate dependency or moderate reliability
  if (dependencyPercentage > DEPENDENCY_THRESHOLDS.low || reliabilityScore < 60) {
    return 'medium'
  }

  return 'low'
}

/**
 * Get human-readable label for supplier tier
 */
export function getSupplierTierConfig(tier: SupplierTier): {
  label: string
  labelKey: string
  description: string
} {
  const configs: Record<SupplierTier, { label: string; labelKey: string; description: string }> = {
    strategic: {
      label: 'Strategic',
      labelKey: 'supplier.tier.strategic',
      description: 'Critical long-term partner with high business impact',
    },
    preferred: {
      label: 'Preferred',
      labelKey: 'supplier.tier.preferred',
      description: 'Trusted supplier with proven track record',
    },
    approved: {
      label: 'Approved',
      labelKey: 'supplier.tier.approved',
      description: 'Qualified supplier meeting minimum standards',
    },
    conditional: {
      label: 'Conditional',
      labelKey: 'supplier.tier.conditional',
      description: 'Under evaluation or with performance concerns',
    },
  }
  return configs[tier]
}

/**
 * Get status configuration
 */
export function getSupplierStatusConfig(status: SupplierStatus): {
  label: string
  labelKey: string
  canOrder: boolean
} {
  const configs: Record<SupplierStatus, { label: string; labelKey: string; canOrder: boolean }> = {
    active: {
      label: 'Active',
      labelKey: 'supplier.status.active',
      canOrder: true,
    },
    inactive: {
      label: 'Inactive',
      labelKey: 'supplier.status.inactive',
      canOrder: false,
    },
    on_hold: {
      label: 'On Hold',
      labelKey: 'supplier.status.onHold',
      canOrder: false,
    },
    blacklisted: {
      label: 'Blacklisted',
      labelKey: 'supplier.status.blacklisted',
      canOrder: false,
    },
  }
  return configs[status]
}

/**
 * Get risk level configuration
 */
export function getRiskLevelConfig(level: RiskLevel): {
  label: string
  labelKey: string
  color: 'success' | 'warning' | 'error' | 'info'
} {
  const configs: Record<RiskLevel, { label: string; labelKey: string; color: 'success' | 'warning' | 'error' | 'info' }> = {
    low: {
      label: 'Low Risk',
      labelKey: 'supplier.risk.low',
      color: 'success',
    },
    medium: {
      label: 'Medium Risk',
      labelKey: 'supplier.risk.medium',
      color: 'info',
    },
    high: {
      label: 'High Risk',
      labelKey: 'supplier.risk.high',
      color: 'warning',
    },
    critical: {
      label: 'Critical Risk',
      labelKey: 'supplier.risk.critical',
      color: 'error',
    },
  }
  return configs[level]
}

/**
 * Format delivery deviation for display
 */
export function formatDeliveryDeviation(days: number): {
  label: string
  isPositive: boolean
} {
  if (days === 0) {
    return { label: 'On time', isPositive: true }
  }
  if (days < 0) {
    return { label: `${Math.abs(days)}d early`, isPositive: true }
  }
  return { label: `${days}d late`, isPositive: false }
}

/**
 * Format response time for display
 */
export function formatResponseTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`
  }
  return `${Math.round(hours / 24)}d`
}

/**
 * Get score rating label
 */
export function getScoreRating(score: number): {
  label: string
  labelKey: string
} {
  if (score >= 90) return { label: 'Excellent', labelKey: 'supplier.rating.excellent' }
  if (score >= 75) return { label: 'Good', labelKey: 'supplier.rating.good' }
  if (score >= 60) return { label: 'Acceptable', labelKey: 'supplier.rating.acceptable' }
  if (score >= 40) return { label: 'Needs Improvement', labelKey: 'supplier.rating.needsImprovement' }
  return { label: 'Poor', labelKey: 'supplier.rating.poor' }
}

// ============================================================================
// Filter & Sort Types
// ============================================================================

export interface SupplierFilters {
  search?: string
  status?: SupplierStatus[]
  tier?: SupplierTier[]
  riskLevel?: RiskLevel[]
  categories?: string[]
  minReliabilityScore?: number
  maxDependency?: number
}

export type SupplierSortField =
  | 'name'
  | 'reliabilityScore'
  | 'dependencyPercentage'
  | 'averageDeliveryDeviation'
  | 'communicationScore'
  | 'totalSpend'
  | 'lastOrderDate'

export interface SupplierSortConfig {
  field: SupplierSortField
  direction: 'asc' | 'desc'
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SuppliersResponse {
  suppliers: Supplier[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SupplierSummary {
  totalSuppliers: number
  activeSuppliers: number
  averageReliabilityScore: number
  highRiskCount: number
  criticalRiskCount: number
  topCategories: { category: string; count: number }[]
}
