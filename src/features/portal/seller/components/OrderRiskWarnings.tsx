import React from 'react';
import {
  Warning,
  Clock,
  ArrowRight,
  CaretRight,
  Timer,
  Package,
  TrendUp,
  TrendDown,
  Minus,
  CheckCircle,
  XCircle,
  Lightning,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Order } from '../../types/order.types';
import { RiskLevel, RiskAssessment, getRiskLevelConfig, TimelineStep } from '../../types/timeline.types';
import { ThemeStyles } from '../../../../theme/portalColors';

// =============================================================================
// Types
// =============================================================================

interface OrderWithRisk extends Order {
  timeline?: {
    currentStep: string;
    activeStep?: TimelineStep;
    riskAssessment: RiskAssessment;
  };
}

interface OrderRiskWarningsProps {
  orders: OrderWithRisk[];
  onViewOrder: (order: Order) => void;
  onViewAll?: () => void;
  maxDisplay?: number;
}

interface SLABreachSummaryProps {
  summary: {
    totalOrders: number;
    onTimeDeliveries: number;
    slaBreaches: number;
    byStep: Record<string, { met: number; breached: number }>;
    trend: 'improving' | 'declining' | 'stable';
  };
}

// =============================================================================
// SLA Breach Summary Card
// =============================================================================

export const SLABreachSummary: React.FC<SLABreachSummaryProps> = ({ summary }) => {
  const { styles } = usePortal();
  const successRate =
    summary.totalOrders > 0 ? Math.round((summary.onTimeDeliveries / summary.totalOrders) * 100) : 100;

  const TrendIcon = summary.trend === 'improving' ? TrendUp : summary.trend === 'declining' ? TrendDown : Minus;
  const trendColor =
    summary.trend === 'improving' ? styles.success : summary.trend === 'declining' ? styles.error : styles.textMuted;

  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={18} style={{ color: styles.info }} />
          <h3 className="font-semibold text-sm" style={{ color: styles.textPrimary }}>
            SLA Performance
          </h3>
        </div>
        <div className="flex items-center gap-1" style={{ color: trendColor }}>
          <TrendIcon size={14} />
          <span className="text-xs font-medium capitalize">{summary.trend}</span>
        </div>
      </div>

      {/* Success Rate */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
            {successRate}%
          </span>
          <span className="text-xs" style={{ color: styles.textMuted }}>
            On-time rate
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${successRate}%`,
              backgroundColor: successRate >= 80 ? styles.success : successRate >= 60 ? styles.warning : styles.error,
            }}
          />
        </div>
      </div>

      {/* Breakdown by Step */}
      <div className="space-y-2">
        {Object.entries(summary.byStep).map(([step, data]) => {
          const stepData = data as { met: number; breached: number };
          const total = stepData.met + stepData.breached;
          const rate = total > 0 ? Math.round((stepData.met / total) * 100) : 100;
          const stepLabel = step.charAt(0).toUpperCase() + step.slice(1);

          return (
            <div key={step} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: styles.textSecondary }}>
                {stepLabel}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-16 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${rate}%`,
                      backgroundColor: rate >= 80 ? styles.success : rate >= 60 ? styles.warning : styles.error,
                    }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color: styles.textMuted }}>
                  {rate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: styles.border }}>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            {summary.totalOrders}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            Orders
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: styles.success }}>
            {summary.onTimeDeliveries}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            On Time
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: styles.error }}>
            {summary.slaBreaches}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            Breaches
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Risk Warning Card
// =============================================================================

interface RiskWarningCardProps {
  order: OrderWithRisk;
  onView: () => void;
  styles: ThemeStyles;
}

const RiskWarningCard: React.FC<RiskWarningCardProps> = ({ order, onView, styles }) => {
  const risk = order.timeline?.riskAssessment;
  const activeStep = order.timeline?.activeStep;

  if (!risk) return null;

  const riskConfig = getRiskLevelConfig(risk.overallRisk);

  const getBgColor = () => {
    switch (risk.overallRisk) {
      case 'critical':
        return styles.isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)';
      case 'high':
        return styles.isDark ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)';
      case 'medium':
        return styles.isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)';
      default:
        return styles.bgSecondary;
    }
  };

  const getAccentColor = () => {
    switch (risk.overallRisk) {
      case 'critical':
        return styles.error;
      case 'high':
        return '#f97316';
      case 'medium':
        return styles.warning;
      default:
        return styles.textMuted;
    }
  };

  return (
    <div
      className="p-3 rounded-lg transition-colors cursor-pointer"
      style={{ backgroundColor: getBgColor() }}
      onClick={onView}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Warning size={16} weight="fill" style={{ color: getAccentColor() }} />
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {order.orderNumber}
          </span>
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${getAccentColor()}20`, color: getAccentColor() }}
        >
          {riskConfig.label}
        </span>
      </div>

      <p className="text-xs mb-2 truncate" style={{ color: styles.textSecondary }}>
        {order.itemName}
      </p>

      {/* Active SLA */}
      {activeStep?.slaTimeRemaining && (
        <div className="flex items-center gap-1.5 mb-2">
          <Clock size={12} style={{ color: getAccentColor() }} />
          <span className="text-xs" style={{ color: getAccentColor() }}>
            {activeStep.slaTimeRemaining}
          </span>
        </div>
      )}

      {/* Top risk factor */}
      {risk.factors[0] && (
        <p className="text-xs" style={{ color: styles.textMuted }}>
          {risk.factors[0].title}
        </p>
      )}

      {/* View button */}
      <div className="flex items-center justify-end mt-2">
        <span className="text-xs flex items-center gap-1" style={{ color: styles.info }}>
          View <CaretRight size={12} />
        </span>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const OrderRiskWarnings: React.FC<OrderRiskWarningsProps> = ({
  orders,
  onViewOrder,
  onViewAll,
  maxDisplay = 5,
}) => {
  const { styles } = usePortal();

  // Filter and sort orders by risk
  const riskyOrders = orders
    .filter((o) => o.timeline?.riskAssessment?.overallRisk !== 'low')
    .sort((a, b) => {
      const riskOrder: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const aRisk = a.timeline?.riskAssessment?.overallRisk || 'low';
      const bRisk = b.timeline?.riskAssessment?.overallRisk || 'low';
      return riskOrder[aRisk] - riskOrder[bRisk];
    })
    .slice(0, maxDisplay);

  if (riskyOrders.length === 0) {
    return (
      <div
        className="p-4 rounded-xl text-center"
        style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
      >
        <div
          className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
          style={{ backgroundColor: `${styles.success}15` }}
        >
          <CheckCircle size={24} style={{ color: styles.success }} />
        </div>
        <p className="font-medium" style={{ color: styles.textPrimary }}>
          All Orders On Track
        </p>
        <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
          No orders require immediate attention
        </p>
      </div>
    );
  }

  const criticalCount = riskyOrders.filter((o) => o.timeline?.riskAssessment?.overallRisk === 'critical').length;
  const highCount = riskyOrders.filter((o) => o.timeline?.riskAssessment?.overallRisk === 'high').length;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: styles.border }}>
        <div className="flex items-center gap-2">
          <Lightning size={18} weight="fill" style={{ color: styles.warning }} />
          <h3 className="font-semibold text-sm" style={{ color: styles.textPrimary }}>
            Orders Needing Attention
          </h3>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
          >
            {riskyOrders.length}
          </span>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs flex items-center gap-1" style={{ color: styles.info }}>
            View All <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* Risk Summary */}
      {(criticalCount > 0 || highCount > 0) && (
        <div
          className="flex items-center gap-4 px-4 py-2 border-b"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.error }} />
              <span className="text-xs" style={{ color: styles.error }}>
                {criticalCount} Critical
              </span>
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
              <span className="text-xs" style={{ color: '#f97316' }}>
                {highCount} High Risk
              </span>
            </div>
          )}
        </div>
      )}

      {/* Order List */}
      <div className="p-3 space-y-2">
        {riskyOrders.map((order) => (
          <RiskWarningCard key={order.id} order={order} onView={() => onViewOrder(order)} styles={styles} />
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Quick Action Cards
// =============================================================================

interface QuickActionCardsProps {
  stats: {
    pendingConfirmation: number;
    needsShipping: number;
    atRisk: number;
    breached: number;
  };
  onAction: (action: string) => void;
}

export const QuickActionCards: React.FC<QuickActionCardsProps> = ({ stats, onAction }) => {
  const { styles } = usePortal();

  const cards = [
    {
      key: 'pending',
      label: 'Pending Confirmation',
      count: stats.pendingConfirmation,
      icon: Package,
      color: styles.warning,
      action: 'confirm',
    },
    {
      key: 'shipping',
      label: 'Ready to Ship',
      count: stats.needsShipping,
      icon: Package,
      color: styles.info,
      action: 'ship',
    },
    {
      key: 'at_risk',
      label: 'At Risk',
      count: stats.atRisk,
      icon: Warning,
      color: '#f97316',
      action: 'at_risk',
    },
    {
      key: 'breached',
      label: 'SLA Breached',
      count: stats.breached,
      icon: XCircle,
      color: styles.error,
      action: 'breached',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const hasItems = card.count > 0;

        return (
          <button
            key={card.key}
            onClick={() => onAction(card.action)}
            disabled={!hasItems}
            className={`p-4 rounded-xl text-left transition-all ${hasItems ? 'hover:scale-[1.02]' : 'opacity-60'}`}
            style={{
              backgroundColor: hasItems ? `${card.color}10` : styles.bgSecondary,
              border: `1px solid ${hasItems ? `${card.color}30` : styles.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon
                size={20}
                weight={hasItems ? 'fill' : 'regular'}
                style={{ color: hasItems ? card.color : styles.textMuted }}
              />
              {hasItems && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: card.color, color: '#fff' }}
                >
                  {card.count}
                </span>
              )}
            </div>
            <p className="text-sm font-medium" style={{ color: hasItems ? styles.textPrimary : styles.textMuted }}>
              {card.label}
            </p>
            {hasItems && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: card.color }}>
                Take action <ArrowRight size={10} />
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default OrderRiskWarnings;
