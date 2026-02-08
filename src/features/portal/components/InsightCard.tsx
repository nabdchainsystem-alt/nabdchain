import React from 'react';
import {
  IconProps,
  ArrowRight,
  Warning,
  CheckCircle,
  Info,
  TrendUp,
  WarningCircle,
  Lightbulb,
  Star,
} from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

// =============================================================================
// Insight Types
// =============================================================================

export type InsightType = 'alert' | 'warning' | 'success' | 'info' | 'opportunity' | 'tip';
export type InsightPriority = 'high' | 'medium' | 'low';

export interface InsightData {
  id: string;
  type: InsightType;
  priority?: InsightPriority;
  title: string;
  description?: string;
  metric?: {
    value: string | number;
    label?: string;
    trend?: 'up' | 'down' | 'neutral';
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  timestamp?: Date;
}

// =============================================================================
// Single Insight Card
// =============================================================================

interface InsightCardProps {
  insight: InsightData;
  compact?: boolean;
  className?: string;
}

/**
 * Insight Card Component
 *
 * Displays a single insight with:
 * - Type-based icon and color
 * - Optional metric display
 * - Action button
 * - Dismissible option
 */
export const InsightCard: React.FC<InsightCardProps> = ({ insight, compact = false, className = '' }) => {
  const { styles } = usePortal();

  const typeConfig: Record<
    InsightType,
    {
      icon: React.ComponentType<IconProps>;
      color: string;
      bgLight: string;
      bgDark: string;
      borderLight: string;
      borderDark: string;
    }
  > = {
    alert: {
      icon: WarningCircle,
      color: '#ef4444',
      bgLight: 'rgba(239, 68, 68, 0.08)',
      bgDark: 'rgba(239, 68, 68, 0.15)',
      borderLight: 'rgba(239, 68, 68, 0.2)',
      borderDark: 'rgba(239, 68, 68, 0.3)',
    },
    warning: {
      icon: Warning,
      color: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.08)',
      bgDark: 'rgba(245, 158, 11, 0.15)',
      borderLight: 'rgba(245, 158, 11, 0.2)',
      borderDark: 'rgba(245, 158, 11, 0.3)',
    },
    success: {
      icon: CheckCircle,
      color: '#22c55e',
      bgLight: 'rgba(34, 197, 94, 0.08)',
      bgDark: 'rgba(34, 197, 94, 0.15)',
      borderLight: 'rgba(34, 197, 94, 0.2)',
      borderDark: 'rgba(34, 197, 94, 0.3)',
    },
    info: {
      icon: Info,
      color: '#3b82f6',
      bgLight: 'rgba(59, 130, 246, 0.08)',
      bgDark: 'rgba(59, 130, 246, 0.15)',
      borderLight: 'rgba(59, 130, 246, 0.2)',
      borderDark: 'rgba(59, 130, 246, 0.3)',
    },
    opportunity: {
      icon: TrendUp,
      color: '#8b5cf6',
      bgLight: 'rgba(139, 92, 246, 0.08)',
      bgDark: 'rgba(139, 92, 246, 0.15)',
      borderLight: 'rgba(139, 92, 246, 0.2)',
      borderDark: 'rgba(139, 92, 246, 0.3)',
    },
    tip: {
      icon: Lightbulb,
      color: '#06b6d4',
      bgLight: 'rgba(6, 182, 212, 0.08)',
      bgDark: 'rgba(6, 182, 212, 0.15)',
      borderLight: 'rgba(6, 182, 212, 0.2)',
      borderDark: 'rgba(6, 182, 212, 0.3)',
    },
  };

  const config = typeConfig[insight.type];
  const Icon = config.icon;
  const isHighPriority = insight.priority === 'high';

  return (
    <div
      className={`
        relative rounded-lg border transition-all duration-200 overflow-hidden
        ${compact ? 'p-3' : 'p-4'}
        ${isHighPriority ? 'animate-pulse-slow' : ''}
        ${className}
      `}
      style={{
        backgroundColor: styles.isDark ? config.bgDark : config.bgLight,
        borderColor: styles.isDark ? config.borderDark : config.borderLight,
      }}
    >
      {/* Priority indicator bar */}
      {isHighPriority && (
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: config.color }} />
      )}

      <div className={`flex ${compact ? 'gap-2' : 'gap-3'} ${isHighPriority ? 'ml-2' : ''}`}>
        {/* Icon */}
        <div
          className={`flex-shrink-0 rounded-lg flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon size={compact ? 16 : 20} weight="bold" style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4
                className={`font-medium ${compact ? 'text-xs' : 'text-sm'} leading-tight`}
                style={{ color: styles.textPrimary }}
              >
                {insight.title}
              </h4>
              {!compact && insight.description && (
                <p className="mt-1 text-xs leading-relaxed" style={{ color: styles.textSecondary }}>
                  {insight.description}
                </p>
              )}
            </div>

            {/* Metric */}
            {insight.metric && (
              <div className="flex-shrink-0 text-right">
                <div className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`} style={{ color: config.color }}>
                  {insight.metric.value}
                </div>
                {insight.metric.label && (
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: styles.textMuted }}>
                    {insight.metric.label}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action */}
          {insight.action && (
            <button
              onClick={insight.action.onClick}
              className={`
                mt-2 inline-flex items-center gap-1 font-medium transition-all
                hover:gap-2 ${compact ? 'text-[11px]' : 'text-xs'}
              `}
              style={{ color: config.color }}
            >
              {insight.action.label}
              <ArrowRight size={compact ? 10 : 12} weight="bold" />
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {insight.dismissible && insight.onDismiss && (
          <button
            onClick={insight.onDismiss}
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <span className="text-xs" style={{ color: styles.textMuted }}>
              ×
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Insights Panel (Multiple insights grouped)
// =============================================================================

interface InsightsPanelProps {
  insights: InsightData[];
  title?: string;
  maxVisible?: number;
  showAll?: boolean;
  onShowAll?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * Insights Panel Component
 *
 * Groups multiple insights with priority sorting and expansion
 */
export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  title = 'Insights',
  maxVisible = 3,
  showAll = false,
  onShowAll,
  compact = false,
  className = '',
}) => {
  const { styles } = usePortal();

  // Sort by priority: high > medium > low
  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
    return (priorityOrder[a.priority || 'undefined'] || 3) - (priorityOrder[b.priority || 'undefined'] || 3);
  });

  const visibleInsights = showAll ? sortedInsights : sortedInsights.slice(0, maxVisible);
  const hasMore = sortedInsights.length > maxVisible;

  if (insights.length === 0) return null;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star size={14} weight="fill" style={{ color: styles.info }} />
          <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            {title}
          </h3>
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: styles.bgSecondary,
              color: styles.textSecondary,
            }}
          >
            {insights.length}
          </span>
        </div>

        {hasMore && !showAll && onShowAll && (
          <button onClick={onShowAll} className="text-xs font-medium hover:underline" style={{ color: styles.info }}>
            View all
          </button>
        )}
      </div>

      {/* Insights List */}
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {visibleInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} compact={compact} />
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Quick Stats with Insight
// =============================================================================

interface QuickStatInsightProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    positive?: boolean;
  };
  insight?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ComponentType<IconProps>;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  className?: string;
}

/**
 * Quick Stat with Insight
 *
 * A stat card with embedded contextual insight
 */
export const QuickStatInsight: React.FC<QuickStatInsightProps> = ({
  label,
  value,
  change,
  insight,
  action,
  icon: Icon,
  status = 'neutral',
  className = '',
}) => {
  const { styles } = usePortal();

  const statusColors = {
    good: '#22c55e',
    warning: '#f59e0b',
    critical: '#ef4444',
    neutral: styles.textMuted,
  };

  const statusColor = statusColors[status];

  return (
    <div
      className={`p-4 rounded-lg border ${className}`}
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgCard,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: styles.textMuted }}>
            {label}
          </p>
          <p
            className="mt-1 text-2xl font-semibold"
            style={{
              color: styles.textPrimary,
              fontFamily: styles.fontHeading,
            }}
          >
            {value}
          </p>
          {change && (
            <p
              className="mt-0.5 text-xs font-medium"
              style={{ color: change.positive ? styles.success : styles.textMuted }}
            >
              {change.value}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${statusColor}15` }}
          >
            <Icon size={20} weight="bold" style={{ color: statusColor }} />
          </div>
        )}
      </div>

      {/* Insight line */}
      {insight && (
        <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: styles.border }}>
          <Lightbulb size={12} weight="fill" style={{ color: statusColor }} />
          <span className="text-xs flex-1" style={{ color: styles.textSecondary }}>
            {insight}
          </span>
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs font-medium hover:underline"
              style={{ color: styles.info }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InsightCard;
