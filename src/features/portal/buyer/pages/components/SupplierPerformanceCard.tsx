// =============================================================================
// Supplier Performance Card Component
// Shows supplier metrics: on-time rate, quality, issues
// =============================================================================

import React from 'react';
import { Star, Clock, WarningCircle, Package, ShieldCheck, Buildings } from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import {
  BuyerSupplierMetrics,
  ReliabilityTier,
  getReliabilityColor,
  getReliabilityLabel,
} from '../../../types/purchase.types';

interface SupplierPerformanceCardProps {
  metrics: BuyerSupplierMetrics | null;
  sellerName?: string;
}

const TierBadge: React.FC<{ tier: ReliabilityTier }> = ({ tier }) => {
  const color = getReliabilityColor(tier);
  const label = getReliabilityLabel(tier);

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      {label}
    </span>
  );
};

const StarRating: React.FC<{ score: number; max?: number }> = ({ score, max = 5 }) => {
  const { styles } = usePortal();
  const fullStars = Math.floor(score);
  const hasHalf = score % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          weight={i < fullStars ? 'fill' : i === fullStars && hasHalf ? 'fill' : 'regular'}
          style={{
            color: i < fullStars || (i === fullStars && hasHalf) ? '#f59e0b' : styles.textMuted,
            opacity: i === fullStars && hasHalf ? 0.5 : 1,
          }}
        />
      ))}
      <span className="text-xs ml-1" style={{ color: styles.textMuted }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
};

const ProgressBar: React.FC<{
  value: number;
  max?: number;
  color: string;
  showLabel?: boolean;
}> = ({ value, max = 100, color, showLabel = true }) => {
  const { styles } = usePortal();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgCard }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium w-10 text-right" style={{ color }}>
          {value.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

export const SupplierPerformanceCard: React.FC<SupplierPerformanceCardProps> = ({ metrics, sellerName }) => {
  const { styles, t, direction } = usePortal();
  const _isRtl = direction === 'rtl';

  // No metrics available
  if (!metrics) {
    return (
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Buildings size={18} style={{ color: styles.textMuted }} />
          <h4 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            {t('buyer.purchases.supplierPerformance') || 'Supplier Performance'}
          </h4>
        </div>
        <div className="text-center py-4">
          <ShieldCheck size={32} style={{ color: styles.textMuted }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: styles.textMuted }}>
            {t('buyer.purchases.noSupplierHistory') || 'First order with this supplier'}
          </p>
          {sellerName && (
            <p className="text-base font-medium mt-2" style={{ color: styles.textPrimary }}>
              {sellerName}
            </p>
          )}
        </div>
      </div>
    );
  }

  const onTimeColor =
    metrics.onTimeDeliveryRate >= 90 ? styles.success : metrics.onTimeDeliveryRate >= 70 ? '#f59e0b' : styles.error;

  return (
    <div className="p-4 rounded-lg border" style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Buildings size={18} style={{ color: styles.textMuted }} />
          <h4 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            {t('buyer.purchases.supplierPerformance') || 'Supplier Performance'}
          </h4>
        </div>
        <TierBadge tier={metrics.reliabilityTier} />
      </div>

      {/* Supplier name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: styles.bgCard }}
        >
          <Buildings size={20} style={{ color: styles.textMuted }} />
        </div>
        <div>
          <p className="font-medium" style={{ color: styles.textPrimary }}>
            {metrics.sellerName || sellerName || 'Unknown Supplier'}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {metrics.totalOrders} {t('buyer.purchases.ordersTogether') || 'orders together'}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {/* On-time delivery rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs flex items-center gap-1" style={{ color: styles.textMuted }}>
              <Clock size={12} />
              {t('buyer.purchases.onTimeDelivery') || 'On-time Delivery'}
            </span>
          </div>
          <ProgressBar value={metrics.onTimeDeliveryRate} color={onTimeColor} />
        </div>

        {/* Quality score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs flex items-center gap-1" style={{ color: styles.textMuted }}>
              <Star size={12} />
              {t('buyer.purchases.qualityScore') || 'Quality Score'}
            </span>
          </div>
          <StarRating score={metrics.qualityScore} />
        </div>

        {/* Average delivery days */}
        {metrics.avgDeliveryDays !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs flex items-center gap-1" style={{ color: styles.textMuted }}>
              <Package size={12} />
              {t('buyer.purchases.avgDelivery') || 'Avg. Delivery'}
            </span>
            <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {metrics.avgDeliveryDays.toFixed(1)} {t('buyer.purchases.days') || 'days'}
            </span>
          </div>
        )}
      </div>

      {/* Issue count warning */}
      {metrics.issueCount > 0 && (
        <div className="flex items-center gap-2 mt-4 p-2 rounded-lg" style={{ backgroundColor: `${styles.error}10` }}>
          <WarningCircle size={16} style={{ color: styles.error }} weight="fill" />
          <span className="text-xs" style={{ color: styles.error }}>
            {metrics.issueCount} {t('buyer.purchases.previousIssues') || 'previous issue(s) reported'}
          </span>
        </div>
      )}

      {/* Excellent badge */}
      {metrics.reliabilityTier === 'excellent' && metrics.issueCount === 0 && (
        <div className="flex items-center gap-2 mt-4 p-2 rounded-lg" style={{ backgroundColor: `${styles.success}10` }}>
          <ShieldCheck size={16} style={{ color: styles.success }} weight="fill" />
          <span className="text-xs" style={{ color: styles.success }}>
            {t('buyer.purchases.trustedSupplier') || 'Trusted supplier with excellent track record'}
          </span>
        </div>
      )}
    </div>
  );
};

export default SupplierPerformanceCard;
