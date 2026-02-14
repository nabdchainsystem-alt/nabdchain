// =============================================================================
// Clean Timeline Component
// =============================================================================
// The hero component - a vertical, centered, minimalist timeline
// Designed for calm, trust-building order tracking experience
// =============================================================================

import React from 'react';
import { CheckCircle, Gear, Truck, MapTrifold, Package, Timer, Warning, ArrowRight } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { CleanTimelineProps, TrackingStage, SLAStatus } from './tracking.types';
import { ThemeStyles } from '../../../../theme/portalColors';

// =============================================================================
// Icon Mapping
// =============================================================================

const STAGE_ICONS: Record<string, React.ElementType> = {
  CheckCircle,
  Gear,
  Truck,
  MapTrifold,
  Package,
};

// =============================================================================
// Helper Functions
// =============================================================================

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSLAColor = (status?: SLAStatus, styles: Partial<ThemeStyles> = {}): string => {
  switch (status) {
    case 'on_track':
      return styles.success || '#059669';
    case 'at_risk':
      return styles.warning || '#D97706';
    case 'breached':
      return styles.error || '#DC2626';
    default:
      return styles.textMuted || '#6B7280';
  }
};

// =============================================================================
// Stage Node Component
// =============================================================================

interface StageNodeProps {
  stage: TrackingStage;
  role: 'buyer' | 'seller';
  isLast: boolean;
  styles: ThemeStyles;
  isRtl: boolean;
  index: number;
  onAction?: (stageKey: string, action: string) => void;
}

const StageNode: React.FC<StageNodeProps> = ({ stage, role, isLast, styles, isRtl, index, onAction }) => {
  const Icon = STAGE_ICONS[stage.icon] || Package;
  const isCompleted = stage.status === 'completed';
  const isCurrent = stage.status === 'current';
  const isUpcoming = stage.status === 'upcoming';
  const isDelayed = stage.isDelayed;

  // Determine colors based on status
  const getNodeColors = () => {
    if (isDelayed) {
      return {
        bg: `${styles.error}15`,
        border: styles.error,
        icon: styles.error,
        line: styles.error,
      };
    }
    if (isCompleted) {
      return {
        bg: `${styles.success}15`,
        border: styles.success,
        icon: styles.success,
        line: styles.success,
      };
    }
    if (isCurrent) {
      return {
        bg: `${styles.info}15`,
        border: styles.info,
        icon: styles.info,
        line: styles.border,
      };
    }
    return {
      bg: styles.bgSecondary,
      border: styles.border,
      icon: styles.textMuted,
      line: styles.border,
    };
  };

  const colors = getNodeColors();
  const label = role === 'buyer' ? stage.buyerLabel : stage.label;

  return (
    <div
      className={`flex ${isRtl ? 'flex-row-reverse' : ''}`}
      style={{ animation: `fadeSlideIn 0.4s ease-out ${index * 0.08}s both` }}
    >
      {/* Timeline indicator column */}
      <div className="flex flex-col items-center" style={{ width: '56px' }}>
        {/* Stage circle */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isCurrent ? 'ring-2 ring-offset-2' : ''
          }`}
          style={{
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
            ringColor: isCurrent ? colors.border : undefined,
            ringOffsetColor: styles.bgPrimary,
            animation: isCurrent ? 'softPulse 2s ease-in-out infinite' : undefined,
          }}
        >
          {isDelayed ? (
            <Warning size={20} weight="fill" style={{ color: colors.icon }} />
          ) : isCompleted ? (
            <CheckCircle size={20} weight="fill" style={{ color: colors.icon }} />
          ) : (
            <Icon size={20} weight={isCurrent ? 'bold' : 'regular'} style={{ color: colors.icon }} />
          )}
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div
            className="w-0.5 flex-1 transition-colors"
            style={{
              backgroundColor: colors.line,
              minHeight: '48px',
            }}
          />
        )}
      </div>

      {/* Content column */}
      <div className={`flex-1 pb-8 ${isRtl ? 'pr-4 text-right' : 'pl-4'}`}>
        {/* Stage label */}
        <p
          className="font-medium text-base"
          style={{
            color: isUpcoming ? styles.textMuted : styles.textPrimary,
          }}
        >
          {label}
        </p>

        {/* Date/Time info */}
        {isCompleted && stage.date && (
          <p className="text-sm mt-1" style={{ color: styles.textSecondary }}>
            {formatDateTime(stage.date)}
          </p>
        )}

        {isCurrent && stage.estimatedDate && (
          <p className="text-sm mt-1" style={{ color: styles.textSecondary }}>
            Expected: {formatDate(stage.estimatedDate)}
          </p>
        )}

        {isUpcoming && stage.estimatedDate && (
          <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
            Est. {formatDate(stage.estimatedDate)}
          </p>
        )}

        {isUpcoming && !stage.estimatedDate && (
          <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
            Pending
          </p>
        )}

        {/* Short note */}
        {stage.note && (
          <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
            {stage.note}
          </p>
        )}

        {/* Delay indicator */}
        {isDelayed && stage.delayReason && (
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md"
            style={{ backgroundColor: `${styles.error}10` }}
          >
            <Warning size={14} weight="fill" style={{ color: styles.error }} />
            <span className="text-xs font-medium" style={{ color: styles.error }}>
              Delayed
            </span>
          </div>
        )}

        {/* SLA info (seller only) */}
        {role === 'seller' && isCurrent && stage.slaTimeRemaining && (
          <div className="mt-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor:
                  stage.slaStatus === 'on_track'
                    ? `${styles.success}10`
                    : stage.slaStatus === 'at_risk'
                      ? `${styles.warning}10`
                      : `${styles.error}10`,
              }}
            >
              <Timer
                size={16}
                weight={stage.slaStatus === 'breached' ? 'fill' : 'bold'}
                style={{ color: getSLAColor(stage.slaStatus, styles) }}
                className={stage.slaStatus === 'at_risk' || stage.slaStatus === 'breached' ? 'animate-pulse' : ''}
              />
              <span className="text-sm font-medium" style={{ color: getSLAColor(stage.slaStatus, styles) }}>
                {stage.slaTimeRemaining}
              </span>
            </div>

            {/* SLA Progress bar */}
            {stage.slaPercentUsed !== undefined && (
              <div
                className="mt-2 h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: styles.bgSecondary, maxWidth: '160px' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, stage.slaPercentUsed)}%`,
                    backgroundColor: getSLAColor(stage.slaStatus, styles),
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Action required marker (seller only) */}
        {role === 'seller' && stage.actionRequired && (
          <button
            onClick={() => onAction?.(stage.key, stage.actionRequired || '')}
            className="flex items-center gap-1.5 mt-2 text-sm font-medium transition-colors hover:underline"
            style={{ color: styles.info }}
          >
            <ArrowRight size={14} weight="bold" />
            {stage.actionRequired}
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const CleanTimeline: React.FC<CleanTimelineProps> = ({ stages, role, _currentStageKey, onStageAction }) => {
  const { styles, direction, t } = usePortal();
  const isRtl = direction === 'rtl';

  if (!stages || stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12" style={{ color: styles.textMuted }}>
        <Package size={40} className="mb-3" />
        <p className="text-sm">{t('tracking.noTimeline') || 'Tracking will begin once the order is confirmed.'}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {stages.map((stage, index) => (
        <StageNode
          key={stage.key}
          stage={stage}
          role={role}
          isLast={index === stages.length - 1}
          styles={styles}
          isRtl={isRtl}
          index={index}
          onAction={onStageAction}
        />
      ))}
    </div>
  );
};

export default CleanTimeline;
