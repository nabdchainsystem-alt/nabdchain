// =============================================================================
// SLA Tracker Component
// =============================================================================
// Seller-only: Shows SLA progress, time remaining, and risk indicators
// Helps sellers stay on top of their commitments
// =============================================================================

import React from 'react';
import {
  Timer,
  Warning,
  CheckCircle,
  TrendDown,
  Lightning,
  CaretDown,
  CaretUp,
  Info,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { SLATrackerProps, TrackingStage } from './tracking.types';
import { RiskLevel, getRiskLevelConfig } from '../../types/timeline.types';

// =============================================================================
// Helper Functions
// =============================================================================

const getSLAStatusColor = (status: string | undefined, styles: any) => {
  switch (status) {
    case 'on_track':
      return styles.success;
    case 'at_risk':
      return styles.warning;
    case 'breached':
      return styles.error;
    default:
      return styles.textMuted;
  }
};

const getSLAStatusBg = (status: string | undefined, styles: any) => {
  switch (status) {
    case 'on_track':
      return `${styles.success}10`;
    case 'at_risk':
      return `${styles.warning}10`;
    case 'breached':
      return `${styles.error}10`;
    default:
      return styles.bgSecondary;
  }
};

const getRiskColor = (level: RiskLevel, styles: any) => {
  switch (level) {
    case 'low':
      return styles.success;
    case 'medium':
      return styles.warning;
    case 'high':
      return '#f97316'; // orange
    case 'critical':
      return styles.error;
    default:
      return styles.textMuted;
  }
};

// =============================================================================
// Main Component
// =============================================================================

export const SLATracker: React.FC<SLATrackerProps> = ({
  currentStage,
  riskAssessment,
  automationSignals,
}) => {
  const { styles, direction, t } = usePortal();
  const isRtl = direction === 'rtl';
  const [showRiskDetails, setShowRiskDetails] = React.useState(false);

  const slaColor = getSLAStatusColor(currentStage.slaStatus, styles);
  const slaBg = getSLAStatusBg(currentStage.slaStatus, styles);

  const hasRisk = riskAssessment && riskAssessment.overallRisk !== 'low';
  const riskColor = riskAssessment ? getRiskColor(riskAssessment.overallRisk, styles) : styles.textMuted;
  const riskConfig = riskAssessment ? getRiskLevelConfig(riskAssessment.overallRisk) : null;

  return (
    <div className="mx-6 mb-6">
      {/* Main SLA Card */}
      <div
        className="p-4 rounded-xl"
        style={{
          backgroundColor: styles.bgCard,
          border: `1px solid ${styles.border}`,
        }}
      >
        {/* Header row */}
        <div className={`flex items-center justify-between mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Timer size={18} style={{ color: slaColor }} />
            <span
              className="text-sm font-medium"
              style={{ color: styles.textPrimary }}
            >
              {t('tracking.sla.status') || 'SLA Status'}
            </span>
          </div>

          {/* SLA status badge */}
          <div
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: slaBg,
              color: slaColor,
            }}
          >
            {currentStage.slaStatus === 'on_track'
              ? t('tracking.sla.onTrack') || 'On Track'
              : currentStage.slaStatus === 'at_risk'
              ? t('tracking.sla.atRisk') || 'At Risk'
              : t('tracking.sla.breached') || 'Breached'}
          </div>
        </div>

        {/* Current stage and time remaining */}
        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div>
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {t('tracking.sla.currentStep') || 'Current Step'}
            </p>
            <p
              className="text-sm font-medium mt-0.5"
              style={{ color: styles.textPrimary }}
            >
              {currentStage.label}
            </p>
          </div>

          {currentStage.slaTimeRemaining && (
            <div className={isRtl ? 'text-left' : 'text-right'}>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {t('tracking.sla.timeRemaining') || 'Time Remaining'}
              </p>
              <p
                className="text-lg font-semibold mt-0.5"
                style={{ color: slaColor, fontFamily: styles.fontHeading }}
              >
                {currentStage.slaTimeRemaining}
              </p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {currentStage.slaPercentUsed !== undefined && (
          <div className="mt-4">
            <div className={`flex items-center justify-between text-xs mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span style={{ color: styles.textMuted }}>
                {t('tracking.sla.progress') || 'Progress'}
              </span>
              <span style={{ color: slaColor }}>
                {currentStage.slaPercentUsed}% {t('tracking.sla.used') || 'used'}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, currentStage.slaPercentUsed)}%`,
                  backgroundColor: slaColor,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Risk Assessment Section */}
      {hasRisk && riskAssessment && (
        <div
          className="mt-3 rounded-xl overflow-hidden"
          style={{
            backgroundColor: `${riskColor}08`,
            border: `1px solid ${riskColor}20`,
          }}
        >
          {/* Risk header - clickable to expand */}
          <button
            onClick={() => setShowRiskDetails(!showRiskDetails)}
            className={`w-full flex items-center justify-between p-3 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Warning size={16} weight="fill" style={{ color: riskColor }} />
              <span className="text-sm font-medium" style={{ color: riskColor }}>
                {riskConfig?.label || 'Risk Detected'}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: styles.bgCard, color: styles.textMuted }}
              >
                {t('tracking.sla.score') || 'Score'}: {riskAssessment.riskScore}
              </span>
            </div>
            {showRiskDetails ? (
              <CaretUp size={16} style={{ color: styles.textMuted }} />
            ) : (
              <CaretDown size={16} style={{ color: styles.textMuted }} />
            )}
          </button>

          {/* Expanded risk details */}
          {showRiskDetails && (
            <div className="px-3 pb-3 space-y-2">
              {riskAssessment.factors.slice(0, 3).map((factor) => (
                <div
                  key={factor.id}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: styles.bgCard }}
                >
                  <div className={`flex items-start gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                    <Info size={14} style={{ color: riskColor }} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                        {factor.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                        {factor.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Automation Signals */}
      {automationSignals && automationSignals.length > 0 && (
        <div className="mt-3 space-y-2">
          {automationSignals.map((signal, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2.5 rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}
              style={{
                backgroundColor: `${styles.warning}08`,
                border: `1px solid ${styles.warning}20`,
              }}
            >
              <Lightning size={14} weight="fill" style={{ color: styles.warning }} />
              <span className="text-xs" style={{ color: styles.warning }}>
                {signal}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SLATracker;
