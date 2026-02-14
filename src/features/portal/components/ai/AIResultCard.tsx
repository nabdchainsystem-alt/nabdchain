/**
 * AIResultCard — Reusable AI result display card
 *
 * Shows AI insight results inline: summary, insights, risks, actions.
 * Used in OrderDetailsPanel, InvoiceDetails, and Intelligence Hub.
 */
import React, { useState } from 'react';
import { Sparkle, Lightning, Warning, ArrowRight, CaretDown, CaretUp, CheckCircle, Spinner } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { AIInsight, AIRisk, AIAction } from '../../services/aiService';

interface AIResultCardProps {
  summary: string;
  insights: AIInsight[];
  risks: AIRisk[];
  recommendedActions: AIAction[];
  confidence: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onActionClick?: (deepLink: string) => void;
  compact?: boolean;
}

const severityColor: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
  warning: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  critical: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
  low: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.3)' },
  medium: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  high: { bg: 'rgba(249, 115, 22, 0.1)', text: '#F97316', border: 'rgba(249, 115, 22, 0.3)' },
};

export const AIResultCard: React.FC<AIResultCardProps> = ({
  summary,
  insights,
  risks,
  recommendedActions,
  confidence,
  isLoading,
  error,
  onRetry,
  onActionClick,
  compact = false,
}) => {
  const { styles } = usePortal();
  const [expanded, setExpanded] = useState(!compact);

  if (isLoading) {
    return (
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: 'rgba(139, 92, 246, 0.3)', backgroundColor: styles.bgSecondary }}
      >
        <div className="flex items-center gap-3">
          <Spinner size={20} className="animate-spin" style={{ color: '#8B5CF6' }} />
          <span className="text-sm" style={{ color: styles.textSecondary }}>
            Analyzing with AI...
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 rounded" style={{ backgroundColor: styles.bgHover, width: '80%' }} />
          <div className="h-3 rounded" style={{ backgroundColor: styles.bgHover, width: '60%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-4" style={{ borderColor: styles.error, backgroundColor: styles.bgSecondary }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warning size={16} style={{ color: styles.error }} />
            <span className="text-sm" style={{ color: styles.error }}>
              {error}
            </span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1 rounded-md"
              style={{ backgroundColor: styles.error, color: '#fff' }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: 'rgba(139, 92, 246, 0.2)',
        backgroundColor: styles.bgSecondary,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => compact && setExpanded(!expanded)}
        style={{ borderBottom: expanded ? `1px solid ${styles.border}` : 'none' }}
      >
        <div className="flex items-center gap-2">
          <Sparkle size={16} weight="fill" style={{ color: '#8B5CF6' }} />
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            AI Analysis
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: confidence >= 0.7 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: confidence >= 0.7 ? '#22C55E' : '#F59E0B',
            }}
          >
            {Math.round(confidence * 100)}% confidence
          </span>
        </div>
        {compact &&
          (expanded ? (
            <CaretUp size={16} style={{ color: styles.textMuted }} />
          ) : (
            <CaretDown size={16} style={{ color: styles.textMuted }} />
          ))}
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Summary */}
          <p className="text-sm leading-relaxed" style={{ color: styles.textPrimary }}>
            {summary}
          </p>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightning size={14} style={{ color: '#3B82F6' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: styles.textMuted }}>
                  Insights
                </span>
              </div>
              {insights.map((insight, i) => {
                const colors = severityColor[insight.severity || 'info'];
                return (
                  <div
                    key={i}
                    className="rounded-md px-3 py-2 text-sm"
                    style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.text}` }}
                  >
                    <span className="font-medium" style={{ color: styles.textPrimary }}>
                      {insight.title}
                    </span>
                    {insight.description && (
                      <p className="text-xs mt-0.5" style={{ color: styles.textSecondary }}>
                        {insight.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Warning size={14} style={{ color: '#F59E0B' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: styles.textMuted }}>
                  Risks
                </span>
              </div>
              {risks.map((risk, i) => {
                const colors = severityColor[risk.severity || 'medium'];
                return (
                  <div
                    key={i}
                    className="rounded-md px-3 py-2 text-sm"
                    style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.text}` }}
                  >
                    <span className="font-medium" style={{ color: styles.textPrimary }}>
                      {risk.title}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: styles.textSecondary }}>
                      {risk.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          {recommendedActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} style={{ color: '#22C55E' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: styles.textMuted }}>
                  Recommended Actions
                </span>
              </div>
              {recommendedActions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                  style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
                >
                  <div>
                    <span className="font-medium" style={{ color: styles.textPrimary }}>
                      {action.title}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: styles.textSecondary }}>
                      {action.description}
                    </p>
                  </div>
                  {action.deepLink && onActionClick && (
                    <button
                      onClick={() => onActionClick(action.deepLink!)}
                      className="p-1 rounded hover:bg-opacity-10 flex-shrink-0"
                      style={{ color: '#8B5CF6' }}
                    >
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIResultCard;
