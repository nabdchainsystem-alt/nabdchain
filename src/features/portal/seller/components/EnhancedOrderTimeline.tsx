import React, { useState } from 'react';
import {
  Package,
  CheckCircle,
  Gear,
  Truck,
  Timer,
  XCircle,
  Export,
  CurrencyDollar,
  Path,
  MapTrifold,
  Warning,
  CaretDown,
  CaretUp,
  Clock,
  CalendarCheck,
  ArrowRight,
  Info,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Order } from '../../types/order.types';
import {
  TimelineStep,
  TimelineStepKey,
  RiskAssessment,
  getRiskLevelConfig,
  formatTimeRemaining,
} from '../../types/timeline.types';
import { ThemeStyles } from '../../../../theme/portalColors';

// =============================================================================
// Types
// =============================================================================

interface EnhancedOrderTimelineProps {
  order: Order;
  timeline?: {
    steps: TimelineStep[];
    riskAssessment: RiskAssessment;
    metrics: {
      slasMet: number;
      slasBreached: number;
      avgSlaUtilization: number;
      promisedDeliveryDate?: string;
      actualDeliveryDate?: string;
      deliveryVariance?: number;
    };
  };
  onReportDelay?: () => void;
}

// =============================================================================
// Icon Mapping
// =============================================================================

const STEP_ICONS: Record<TimelineStepKey, React.ElementType> = {
  order_created: Package,
  payment_received: CurrencyDollar,
  seller_confirmed: CheckCircle,
  processing_started: Gear,
  ready_to_ship: Export,
  shipped: Truck,
  in_transit: Path,
  out_for_delivery: MapTrifold,
  delivered: Package,
  completed: CheckCircle,
};

// =============================================================================
// SLA Configuration
// =============================================================================

const SLA_CONFIG = {
  confirmation: { hours: 24, label: 'Confirm' },
  shipping: { hours: 72, label: 'Ship' },
  delivery: { days: 7, label: 'Deliver' },
};

// =============================================================================
// Default Timeline Steps (when no API timeline is provided)
// =============================================================================

interface DefaultTimelineStep {
  key: TimelineStepKey;
  label: string;
  icon: React.ElementType;
  activeStatuses: string[];
  completedStatuses: string[];
  timestampKey: keyof Order;
  slaType?: 'confirmation' | 'shipping' | 'delivery';
}

const DEFAULT_TIMELINE_STEPS: DefaultTimelineStep[] = [
  {
    key: 'order_created',
    label: 'Order Created',
    icon: Package,
    activeStatuses: [],
    completedStatuses: [
      'pending_confirmation',
      'confirmed',
      'processing',
      'in_progress',
      'shipped',
      'delivered',
      'closed',
    ],
    timestampKey: 'createdAt',
  },
  {
    key: 'seller_confirmed',
    label: 'Seller Confirmed',
    icon: CheckCircle,
    activeStatuses: ['pending_confirmation'],
    completedStatuses: ['confirmed', 'processing', 'in_progress', 'shipped', 'delivered', 'closed'],
    timestampKey: 'confirmedAt',
    slaType: 'confirmation',
  },
  {
    key: 'processing_started',
    label: 'Processing',
    icon: Gear,
    activeStatuses: ['confirmed'],
    completedStatuses: ['processing', 'in_progress', 'shipped', 'delivered', 'closed'],
    timestampKey: 'processingAt' as keyof Order,
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: Truck,
    activeStatuses: ['processing', 'in_progress'],
    completedStatuses: ['shipped', 'delivered', 'closed'],
    timestampKey: 'shippedAt',
    slaType: 'shipping',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: Package,
    activeStatuses: ['shipped'],
    completedStatuses: ['delivered', 'closed'],
    timestampKey: 'deliveredAt',
    slaType: 'delivery',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    activeStatuses: ['delivered'],
    completedStatuses: ['closed'],
    timestampKey: 'closedAt' as keyof Order,
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

const formatTimestamp = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const calculateSLAForStep = (
  order: Order,
  step: DefaultTimelineStep,
): { remaining: string; urgency: 'ok' | 'warning' | 'critical'; percentUsed: number; deadline: Date } | null => {
  if (!step.slaType) return null;

  const now = new Date();
  let startTime: Date;
  let deadline: Date;

  switch (step.slaType) {
    case 'confirmation':
      if (order.status !== 'pending_confirmation') return null;
      startTime = new Date(order.createdAt);
      deadline = new Date(startTime.getTime() + SLA_CONFIG.confirmation.hours * 60 * 60 * 1000);
      break;
    case 'shipping':
      if (!['confirmed', 'processing', 'in_progress'].includes(order.status)) return null;
      startTime = order.confirmedAt ? new Date(order.confirmedAt) : new Date(order.createdAt);
      deadline = new Date(startTime.getTime() + SLA_CONFIG.shipping.hours * 60 * 60 * 1000);
      break;
    case 'delivery':
      if (order.status !== 'shipped') return null;
      startTime = order.shippedAt ? new Date(order.shippedAt) : new Date(order.createdAt);
      deadline = new Date(startTime.getTime() + SLA_CONFIG.delivery.days * 24 * 60 * 60 * 1000);
      break;
    default:
      return null;
  }

  const totalMs = deadline.getTime() - startTime.getTime();
  const elapsedMs = now.getTime() - startTime.getTime();
  const remainingMs = deadline.getTime() - now.getTime();
  const isOverdue = remainingMs < 0;
  const percentUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

  const remaining = formatTimeRemaining(remainingMs);

  let urgency: 'ok' | 'warning' | 'critical';
  if (isOverdue) {
    urgency = 'critical';
  } else if (percentUsed >= 80) {
    urgency = 'warning';
  } else {
    urgency = 'ok';
  }

  return { remaining, urgency, percentUsed, deadline };
};

// =============================================================================
// Sub-Components
// =============================================================================

interface RiskBannerProps {
  riskAssessment: RiskAssessment;
  styles: ThemeStyles;
}

const RiskBanner: React.FC<RiskBannerProps> = ({ riskAssessment, styles }) => {
  const [expanded, setExpanded] = useState(false);
  const config = getRiskLevelConfig(riskAssessment.overallRisk);

  if (riskAssessment.overallRisk === 'low') {
    return null;
  }

  const getBgColor = () => {
    switch (riskAssessment.overallRisk) {
      case 'critical':
        return styles.isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
      case 'high':
        return styles.isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)';
      case 'medium':
        return styles.isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)';
      default:
        return styles.bgSecondary;
    }
  };

  const getTextColor = () => {
    switch (riskAssessment.overallRisk) {
      case 'critical':
        return styles.error;
      case 'high':
        return '#f97316';
      case 'medium':
        return styles.warning;
      default:
        return styles.textPrimary;
    }
  };

  return (
    <div className="mx-4 mb-4 rounded-lg overflow-hidden" style={{ backgroundColor: getBgColor() }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Warning size={18} weight="fill" style={{ color: getTextColor() }} />
          <span className="font-medium text-sm" style={{ color: getTextColor() }}>
            {config.label}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: styles.bgCard, color: styles.textMuted }}
          >
            Score: {riskAssessment.riskScore}
          </span>
        </div>
        {expanded ? (
          <CaretUp size={16} style={{ color: styles.textMuted }} />
        ) : (
          <CaretDown size={16} style={{ color: styles.textMuted }} />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Risk Factors */}
          {riskAssessment.factors.map((factor) => (
            <div key={factor.id} className="p-2 rounded" style={{ backgroundColor: styles.bgCard }}>
              <div className="flex items-start gap-2">
                <Info size={14} style={{ color: getTextColor() }} className="mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                    {factor.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                    {factor.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Recommendations */}
          {riskAssessment.recommendations.length > 0 && (
            <div className="pt-2 border-t" style={{ borderColor: styles.border }}>
              <p className="text-xs font-medium mb-2" style={{ color: styles.textMuted }}>
                Recommended Actions
              </p>
              <ul className="space-y-1">
                {riskAssessment.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: styles.textSecondary }}>
                    <ArrowRight size={12} className="mt-0.5 flex-shrink-0" style={{ color: getTextColor() }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Predicted Delivery */}
          {riskAssessment.predictedDeliveryDate && (
            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: styles.border }}>
              <CalendarCheck size={14} style={{ color: styles.info }} />
              <span className="text-xs" style={{ color: styles.textMuted }}>
                Predicted Delivery: {formatDate(riskAssessment.predictedDeliveryDate)}
              </span>
              {riskAssessment.predictionConfidence && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
                >
                  {riskAssessment.predictionConfidence}% confidence
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface PromisedVsActualProps {
  promisedDate?: string;
  actualDate?: string;
  variance?: number;
  styles: ThemeStyles;
}

const PromisedVsActual: React.FC<PromisedVsActualProps> = ({ promisedDate, actualDate, variance, styles }) => {
  if (!promisedDate && !actualDate) return null;

  const isEarly = variance && variance > 0;
  const isLate = variance && variance < 0;
  const varianceColor = isEarly ? styles.success : isLate ? styles.error : styles.textMuted;

  return (
    <div className="mx-4 mb-4 p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
      <p className="text-xs font-medium mb-2" style={{ color: styles.textMuted }}>
        Delivery Timeline
      </p>
      <div className="flex items-center gap-4">
        {/* Promised */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarCheck size={14} style={{ color: styles.info }} />
            <span className="text-xs" style={{ color: styles.textMuted }}>
              Promised
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {promisedDate ? formatDate(promisedDate) : '—'}
          </p>
        </div>

        {/* Arrow */}
        <ArrowRight size={16} style={{ color: styles.textMuted }} />

        {/* Actual */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            {actualDate ? (
              <CheckCircle size={14} style={{ color: isLate ? styles.error : styles.success }} />
            ) : (
              <Clock size={14} style={{ color: styles.textMuted }} />
            )}
            <span className="text-xs" style={{ color: styles.textMuted }}>
              {actualDate ? 'Actual' : 'Expected'}
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {actualDate ? formatDate(actualDate) : 'Pending'}
          </p>
        </div>

        {/* Variance */}
        {variance !== undefined && actualDate && (
          <div className="px-2 py-1 rounded" style={{ backgroundColor: `${varianceColor}15` }}>
            <p className="text-xs font-medium" style={{ color: varianceColor }}>
              {isEarly ? `${variance}d early` : isLate ? `${Math.abs(variance)}d late` : 'On time'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SLAMetricsSummaryProps {
  metrics: {
    slasMet: number;
    slasBreached: number;
    avgSlaUtilization: number;
  };
  styles: ThemeStyles;
}

const SLAMetricsSummary: React.FC<SLAMetricsSummaryProps> = ({ metrics, styles }) => {
  const total = metrics.slasMet + metrics.slasBreached;
  if (total === 0) return null;

  const successRate = Math.round((metrics.slasMet / total) * 100);

  return (
    <div
      className="mx-4 mb-4 p-3 rounded-lg flex items-center justify-between"
      style={{ backgroundColor: styles.bgSecondary }}
    >
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            SLAs Met
          </p>
          <p className="text-sm font-semibold" style={{ color: styles.success }}>
            {metrics.slasMet}/{total}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            Success Rate
          </p>
          <p
            className="text-sm font-semibold"
            style={{ color: successRate >= 80 ? styles.success : successRate >= 60 ? styles.warning : styles.error }}
          >
            {successRate}%
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            Avg Utilization
          </p>
          <p
            className="text-sm font-semibold"
            style={{
              color:
                metrics.avgSlaUtilization <= 70
                  ? styles.success
                  : metrics.avgSlaUtilization <= 90
                    ? styles.warning
                    : styles.error,
            }}
          >
            {metrics.avgSlaUtilization}%
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const EnhancedOrderTimeline: React.FC<EnhancedOrderTimelineProps> = ({ order, timeline, onReportDelay }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // Handle cancelled/failed states
  if (['cancelled', 'failed', 'refunded'].includes(order.status)) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: `${styles.error}10` }}>
          <XCircle size={24} weight="fill" style={{ color: styles.error }} />
          <div>
            <p className="font-medium" style={{ color: styles.error }}>
              {order.status === 'cancelled'
                ? 'Order Cancelled'
                : order.status === 'failed'
                  ? 'Order Failed'
                  : 'Order Refunded'}
            </p>
            {order.cancelledAt && (
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {formatTimestamp(order.cancelledAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Use timeline data if provided, otherwise build from order
  const steps = timeline?.steps || buildStepsFromOrder(order);

  const getStepState = (step: DefaultTimelineStep): 'completed' | 'active' | 'pending' => {
    if (step.completedStatuses.includes(order.status)) return 'completed';
    if (step.activeStatuses.includes(order.status)) return 'active';
    return 'pending';
  };

  function buildStepsFromOrder(order: Order): TimelineStep[] {
    return DEFAULT_TIMELINE_STEPS.map((step) => {
      const state = getStepState(step);
      const timestamp = order[step.timestampKey] as string | undefined;
      const slaInfo = state === 'active' ? calculateSLAForStep(order, step) : null;

      return {
        key: step.key,
        label: step.label,
        icon: step.icon.name || 'Package',
        status: state,
        actualAt: timestamp,
        slaDeadline: slaInfo?.deadline.toISOString(),
        slaStatus: slaInfo
          ? slaInfo.urgency === 'ok'
            ? 'on_track'
            : slaInfo.urgency === 'warning'
              ? 'at_risk'
              : 'breached'
          : undefined,
        slaPercentUsed: slaInfo?.percentUsed,
        slaTimeRemaining: slaInfo?.remaining,
      } as TimelineStep;
    });
  }

  return (
    <div className="pb-4">
      {/* Risk Assessment Banner */}
      {timeline?.riskAssessment && <RiskBanner riskAssessment={timeline.riskAssessment} styles={styles} />}

      {/* Promised vs Actual Delivery */}
      {timeline?.metrics && (
        <PromisedVsActual
          promisedDate={timeline.metrics.promisedDeliveryDate}
          actualDate={timeline.metrics.actualDeliveryDate}
          variance={timeline.metrics.deliveryVariance}
          styles={styles}
        />
      )}

      {/* SLA Metrics Summary */}
      {timeline?.metrics && <SLAMetricsSummary metrics={timeline.metrics} styles={styles} />}

      {/* Timeline Steps */}
      <div className="px-4 space-y-0">
        {(timeline?.steps || steps).map((step, index) => {
          const isLastStep = index === (timeline?.steps || steps).length - 1;
          const Icon = STEP_ICONS[step.key] || Package;
          const isActive = step.status === 'active';
          const isCompleted = step.status === 'completed';
          const isDelayed = step.status === 'delayed' || step.slaStatus === 'breached';

          // Calculate promised vs actual for completed steps
          const wasLate =
            isCompleted && step.promisedAt && step.actualAt && new Date(step.actualAt) > new Date(step.promisedAt);

          return (
            <div key={step.key} className={`flex gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isActive ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{
                    backgroundColor: isDelayed
                      ? `${styles.error}20`
                      : isCompleted
                        ? `${styles.success}20`
                        : isActive
                          ? `${styles.info}20`
                          : styles.bgSecondary,
                    ringColor: isActive ? styles.info : undefined,
                  }}
                >
                  <Icon
                    size={20}
                    weight={isCompleted ? 'fill' : isActive ? 'bold' : 'regular'}
                    style={{
                      color: isDelayed
                        ? styles.error
                        : isCompleted
                          ? styles.success
                          : isActive
                            ? styles.info
                            : styles.textMuted,
                    }}
                  />
                </div>
                {/* Connecting line */}
                {!isLastStep && (
                  <div
                    className="w-0.5 flex-1 my-1"
                    style={{
                      backgroundColor: isCompleted ? styles.success : styles.border,
                      minHeight: '24px',
                    }}
                  />
                )}
              </div>

              {/* Step content */}
              <div className={`flex-1 pb-6 ${isRtl ? 'text-right' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p
                      className="font-medium"
                      style={{
                        color: isDelayed
                          ? styles.error
                          : isCompleted
                            ? styles.textPrimary
                            : isActive
                              ? styles.info
                              : styles.textMuted,
                      }}
                    >
                      {step.label}
                    </p>

                    {/* Completed step: Show actual timestamp and promised comparison */}
                    {isCompleted && step.actualAt && (
                      <div className="mt-1 space-y-1">
                        <p className="text-sm" style={{ color: styles.textMuted }}>
                          {formatTimestamp(step.actualAt)}
                        </p>
                        {step.promisedAt && (
                          <div className="flex items-center gap-2 text-xs">
                            <span style={{ color: styles.textMuted }}>
                              Promised: {formatTimestamp(step.promisedAt)}
                            </span>
                            {wasLate && (
                              <span
                                className="px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${styles.error}15`, color: styles.error }}
                              >
                                Late
                              </span>
                            )}
                            {!wasLate && step.promisedAt !== step.actualAt && (
                              <span
                                className="px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${styles.success}15`, color: styles.success }}
                              >
                                On Time
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active step: Show SLA info */}
                    {isActive && step.slaStatus && (
                      <div className="mt-2">
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                          style={{
                            backgroundColor:
                              step.slaStatus === 'on_track'
                                ? `${styles.success}15`
                                : step.slaStatus === 'at_risk'
                                  ? `${styles.warning}15`
                                  : `${styles.error}15`,
                          }}
                        >
                          <Timer
                            size={14}
                            weight={step.slaStatus === 'breached' ? 'fill' : 'bold'}
                            style={{
                              color:
                                step.slaStatus === 'on_track'
                                  ? styles.success
                                  : step.slaStatus === 'at_risk'
                                    ? styles.warning
                                    : styles.error,
                            }}
                            className={step.slaStatus === 'breached' ? 'animate-pulse' : ''}
                          />
                          <span
                            className="text-sm font-medium"
                            style={{
                              color:
                                step.slaStatus === 'on_track'
                                  ? styles.success
                                  : step.slaStatus === 'at_risk'
                                    ? styles.warning
                                    : styles.error,
                            }}
                          >
                            {step.slaTimeRemaining}
                          </span>
                        </div>

                        {/* Progress bar */}
                        {step.slaPercentUsed !== undefined && (
                          <div
                            className="mt-2 h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: styles.bgSecondary, width: '140px' }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${step.slaPercentUsed}%`,
                                backgroundColor:
                                  step.slaStatus === 'on_track'
                                    ? styles.success
                                    : step.slaStatus === 'at_risk'
                                      ? styles.warning
                                      : styles.error,
                              }}
                            />
                          </div>
                        )}

                        {/* Deadline info */}
                        {step.slaDeadline && (
                          <p className="text-xs mt-1.5" style={{ color: styles.textMuted }}>
                            Deadline: {formatTimestamp(step.slaDeadline)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Pending step */}
                    {step.status === 'pending' && (
                      <p className="text-sm mt-0.5" style={{ color: styles.textMuted }}>
                        Pending
                      </p>
                    )}

                    {/* Delay indicator */}
                    {step.isDelayed && step.delayReason && (
                      <div
                        className="mt-2 flex items-center gap-2 px-2 py-1 rounded"
                        style={{ backgroundColor: `${styles.error}10` }}
                      >
                        <Warning size={14} style={{ color: styles.error }} />
                        <span className="text-xs" style={{ color: styles.error }}>
                          Delayed: {step.delayReason.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status indicator on right */}
                  {isCompleted && (
                    <CheckCircle
                      size={16}
                      weight="fill"
                      style={{ color: wasLate ? styles.warning : styles.success }}
                      className="flex-shrink-0 mt-1"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Delay Button */}
      {onReportDelay && !['delivered', 'closed', 'cancelled', 'failed', 'refunded'].includes(order.status) && (
        <div className="px-4 pt-2">
          <button
            onClick={onReportDelay}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{ borderColor: styles.border, color: styles.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.bgSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Warning size={16} />
            Report Delay
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedOrderTimeline;
