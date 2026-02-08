// =============================================================================
// Orders Timeline & SLA Types
// =============================================================================
// Enhanced timeline tracking with delay reasons and SLA breach detection
// =============================================================================

// =============================================================================
// Delay Reason Codes
// =============================================================================

/**
 * Standard delay reason codes for tracking why orders are delayed
 */
export type DelayReasonCode =
  | 'supplier_stockout' // Item out of stock at supplier
  | 'production_delay' // Manufacturing/production issues
  | 'carrier_delay' // Shipping carrier delay
  | 'customs_clearance' // Customs/import processing
  | 'weather' // Weather-related delays
  | 'buyer_request' // Buyer requested delay
  | 'internal_processing' // Internal operational delays
  | 'quality_check' // Quality inspection required
  | 'address_issue' // Delivery address problems
  | 'payment_hold' // Payment verification required
  | 'documentation' // Missing documentation
  | 'other'; // Other reasons

/**
 * Delay reason configuration for display
 */
export interface DelayReasonConfig {
  code: DelayReasonCode;
  label: string;
  description: string;
  category: 'supplier' | 'logistics' | 'buyer' | 'internal' | 'external';
  icon: string;
}

/**
 * Get delay reason configurations
 */
export const DELAY_REASON_CONFIGS: Record<DelayReasonCode, Omit<DelayReasonConfig, 'code'>> = {
  supplier_stockout: {
    label: 'Supplier Stock Out',
    description: 'Item is temporarily out of stock',
    category: 'supplier',
    icon: 'Cube',
  },
  production_delay: {
    label: 'Production Delay',
    description: 'Manufacturing or production issues',
    category: 'supplier',
    icon: 'Factory',
  },
  carrier_delay: {
    label: 'Carrier Delay',
    description: 'Shipping carrier experiencing delays',
    category: 'logistics',
    icon: 'Truck',
  },
  customs_clearance: {
    label: 'Customs Clearance',
    description: 'Item held at customs',
    category: 'logistics',
    icon: 'FileText',
  },
  weather: {
    label: 'Weather',
    description: 'Weather-related shipping delays',
    category: 'external',
    icon: 'CloudRain',
  },
  buyer_request: {
    label: 'Buyer Request',
    description: 'Delay requested by buyer',
    category: 'buyer',
    icon: 'User',
  },
  internal_processing: {
    label: 'Internal Processing',
    description: 'Internal operational delays',
    category: 'internal',
    icon: 'Gear',
  },
  quality_check: {
    label: 'Quality Check',
    description: 'Additional quality inspection required',
    category: 'internal',
    icon: 'MagnifyingGlass',
  },
  address_issue: {
    label: 'Address Issue',
    description: 'Problem with delivery address',
    category: 'buyer',
    icon: 'MapPin',
  },
  payment_hold: {
    label: 'Payment Hold',
    description: 'Awaiting payment verification',
    category: 'buyer',
    icon: 'CurrencyDollar',
  },
  documentation: {
    label: 'Documentation',
    description: 'Missing or incomplete documentation',
    category: 'internal',
    icon: 'Files',
  },
  other: {
    label: 'Other',
    description: 'Other reason not listed',
    category: 'internal',
    icon: 'DotsThree',
  },
};

/**
 * Delay record attached to an order
 */
export interface OrderDelay {
  id: string;
  orderId: string;
  reasonCode: DelayReasonCode;
  customReason?: string;
  affectedStep: TimelineStepKey;
  reportedAt: string;
  estimatedResolution?: string;
  resolvedAt?: string;
  impactDays: number;
  reportedBy: 'seller' | 'buyer' | 'system';
  notes?: string;
}

// =============================================================================
// Timeline Event Types
// =============================================================================

/**
 * Timeline step keys matching order lifecycle
 */
export type TimelineStepKey =
  | 'order_created'
  | 'payment_received'
  | 'seller_confirmed'
  | 'processing_started'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed';

/**
 * Timeline event - individual occurrence in order history
 */
export interface TimelineEvent {
  id: string;
  orderId: string;
  eventType: TimelineEventType;
  stepKey: TimelineStepKey;
  timestamp: string;
  actor: 'buyer' | 'seller' | 'system' | 'carrier';
  actorId?: string;
  actorName?: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  // SLA context
  slaDeadline?: string;
  wasOnTime?: boolean;
  slaDelta?: number; // Minutes early (positive) or late (negative)
}

export type TimelineEventType =
  | 'status_change'
  | 'payment_update'
  | 'note_added'
  | 'tracking_update'
  | 'delay_reported'
  | 'delay_resolved'
  | 'sla_warning'
  | 'sla_breach'
  | 'exception_raised'
  | 'exception_resolved'
  | 'document_uploaded'
  | 'communication';

// =============================================================================
// Enhanced Timeline Step
// =============================================================================

/**
 * Timeline step with SLA tracking and promised vs actual
 */
export interface TimelineStep {
  key: TimelineStepKey;
  label: string;
  icon: string;
  status: 'completed' | 'active' | 'pending' | 'skipped' | 'delayed';
  // Timestamps
  promisedAt?: string; // When we promised to complete this step
  actualAt?: string; // When it was actually completed
  startedAt?: string; // When this step started (for active steps)
  // SLA metrics
  slaHours?: number; // SLA duration in hours
  slaDays?: number; // SLA duration in days
  slaDeadline?: string; // Calculated deadline
  slaStatus?: 'on_track' | 'at_risk' | 'breached';
  slaPercentUsed?: number; // 0-100
  slaTimeRemaining?: string; // Human readable
  // Delay info
  isDelayed?: boolean;
  delayReason?: DelayReasonCode;
  delayDuration?: number; // Minutes delayed
  // Events for this step
  events?: TimelineEvent[];
}

/**
 * Complete order timeline with all steps and metrics
 */
export interface OrderTimeline {
  orderId: string;
  orderNumber: string;
  currentStep: TimelineStepKey;
  steps: TimelineStep[];
  events: TimelineEvent[];
  delays: OrderDelay[];
  // Summary metrics
  metrics: TimelineMetrics;
  // Risk assessment
  riskAssessment: RiskAssessment;
}

// =============================================================================
// Timeline Metrics
// =============================================================================

/**
 * Performance metrics for the order
 */
export interface TimelineMetrics {
  // Time metrics (in hours)
  totalLeadTime?: number; // Order to delivery
  confirmationTime?: number; // Order to confirmation
  processingTime?: number; // Confirmation to shipped
  shippingTime?: number; // Shipped to delivered
  // SLA performance
  slasMet: number;
  slasBreached: number;
  avgSlaUtilization: number; // Average % of SLA used
  // Delay metrics
  totalDelays: number;
  totalDelayTime: number; // Total delay in hours
  delaysByReason: Record<DelayReasonCode, number>;
  // Comparison to promise
  promisedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryVariance?: number; // Days early (positive) or late (negative)
}

// =============================================================================
// Risk Assessment
// =============================================================================

/**
 * Risk level for early warning system
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk factor contributing to overall risk
 */
export interface RiskFactor {
  id: string;
  type: RiskFactorType;
  severity: RiskLevel;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  detectedAt: string;
}

export type RiskFactorType =
  | 'sla_approaching' // SLA deadline approaching
  | 'sla_breached' // SLA already breached
  | 'delay_reported' // Active delay on order
  | 'historical_pattern' // Seller has history of delays
  | 'high_value_order' // Large order value at risk
  | 'payment_pending' // Payment not yet received
  | 'carrier_issues' // Known carrier problems
  | 'external_factors'; // Weather, holidays, etc.

/**
 * Complete risk assessment for an order
 */
export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskScore: number; // 0-100, higher = more risk
  factors: RiskFactor[];
  recommendations: string[];
  lastAssessedAt: string;
  // Prediction
  predictedDeliveryDate?: string;
  predictionConfidence?: number; // 0-100
  predictionFactors?: string[];
}

// =============================================================================
// SLA Configuration
// =============================================================================

/**
 * SLA configuration for timeline steps
 */
export interface SLAConfig {
  step: TimelineStepKey;
  hours?: number;
  days?: number;
  warningThreshold: number; // Percentage at which to warn (e.g., 70)
  criticalThreshold: number; // Percentage at which to escalate (e.g., 90)
}

/**
 * Default SLA configuration
 */
export const DEFAULT_SLA_CONFIG: SLAConfig[] = [
  { step: 'seller_confirmed', hours: 24, warningThreshold: 70, criticalThreshold: 90 },
  { step: 'processing_started', hours: 12, warningThreshold: 70, criticalThreshold: 90 },
  { step: 'ready_to_ship', days: 2, warningThreshold: 70, criticalThreshold: 90 },
  { step: 'shipped', days: 3, warningThreshold: 70, criticalThreshold: 90 },
  { step: 'delivered', days: 7, warningThreshold: 70, criticalThreshold: 90 },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get delay reason display configuration
 */
export function getDelayReasonConfig(code: DelayReasonCode): DelayReasonConfig {
  return {
    code,
    ...DELAY_REASON_CONFIGS[code],
  };
}

/**
 * Get risk level display configuration
 */
export function getRiskLevelConfig(level: RiskLevel): {
  label: string;
  color: 'success' | 'warning' | 'error';
  bgColor: string;
  textColor: string;
} {
  const configs: Record<RiskLevel, ReturnType<typeof getRiskLevelConfig>> = {
    low: {
      label: 'Low Risk',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
    },
    medium: {
      label: 'Medium Risk',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
    },
    high: {
      label: 'High Risk',
      color: 'warning',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-400',
    },
    critical: {
      label: 'Critical',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
    },
  };
  return configs[level];
}

/**
 * Calculate SLA status from percentage used
 */
export function calculateSLAStatus(
  percentUsed: number,
  warningThreshold: number = 70,
  criticalThreshold: number = 90,
): 'on_track' | 'at_risk' | 'breached' {
  if (percentUsed >= 100) return 'breached';
  if (percentUsed >= criticalThreshold) return 'at_risk';
  if (percentUsed >= warningThreshold) return 'at_risk';
  return 'on_track';
}

/**
 * Format time remaining in human readable format
 */
export function formatTimeRemaining(ms: number): string {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);

  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

  let text = '';
  if (days > 0) {
    text = remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else {
    text = `${minutes}m`;
  }

  return isNegative ? `${text} overdue` : `${text} remaining`;
}

/**
 * Get timeline step display configuration
 */
export function getTimelineStepConfig(key: TimelineStepKey): {
  label: string;
  icon: string;
  description: string;
} {
  const configs: Record<TimelineStepKey, ReturnType<typeof getTimelineStepConfig>> = {
    order_created: {
      label: 'Order Created',
      icon: 'Package',
      description: 'Order has been placed',
    },
    payment_received: {
      label: 'Payment Received',
      icon: 'CurrencyDollar',
      description: 'Payment confirmed',
    },
    seller_confirmed: {
      label: 'Seller Confirmed',
      icon: 'CheckCircle',
      description: 'Seller accepted the order',
    },
    processing_started: {
      label: 'Processing Started',
      icon: 'Gear',
      description: 'Order is being prepared',
    },
    ready_to_ship: {
      label: 'Ready to Ship',
      icon: 'Export',
      description: 'Package prepared for shipping',
    },
    shipped: {
      label: 'Shipped',
      icon: 'Truck',
      description: 'Package handed to carrier',
    },
    in_transit: {
      label: 'In Transit',
      icon: 'Path',
      description: 'Package in transit to destination',
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      icon: 'MapTrifold',
      description: 'Package out for final delivery',
    },
    delivered: {
      label: 'Delivered',
      icon: 'Package',
      description: 'Package delivered successfully',
    },
    completed: {
      label: 'Completed',
      icon: 'CheckCircle',
      description: 'Order completed and closed',
    },
  };
  return configs[key];
}
