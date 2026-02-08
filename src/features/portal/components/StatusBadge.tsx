import React from 'react';
import {
  IconProps,
  Clock,
  CheckCircle,
  Truck,
  Warning,
  WarningCircle,
  XCircle,
  Hourglass,
  Package,
} from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

// =============================================================================
// Status Badge Configuration Types
// =============================================================================

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'xs' | 'sm' | 'md';

interface StatusBadgeConfig {
  variant: BadgeVariant;
  label: string;
  icon?: React.ComponentType<IconProps>;
  pulse?: boolean;
}

// =============================================================================
// Preset Status Configurations
// =============================================================================

// Order Status Presets
export const ORDER_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  pending_confirmation: { variant: 'warning', label: 'Pending', icon: Clock, pulse: true },
  confirmed: { variant: 'info', label: 'Confirmed', icon: CheckCircle },
  processing: { variant: 'info', label: 'Processing', icon: Package },
  shipped: { variant: 'success', label: 'Shipped', icon: Truck },
  delivered: { variant: 'success', label: 'Delivered', icon: CheckCircle },
  closed: { variant: 'neutral', label: 'Closed', icon: CheckCircle },
  cancelled: { variant: 'error', label: 'Cancelled', icon: XCircle },
  failed: { variant: 'error', label: 'Failed', icon: XCircle },
  refunded: { variant: 'neutral', label: 'Refunded', icon: CheckCircle },
};

// RFQ Status Presets
export const RFQ_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  new: { variant: 'warning', label: 'New', icon: Clock, pulse: true },
  pending: { variant: 'warning', label: 'Pending', icon: Hourglass, pulse: true },
  viewed: { variant: 'info', label: 'Viewed', icon: CheckCircle },
  quoted: { variant: 'success', label: 'Quoted', icon: CheckCircle },
  negotiating: { variant: 'info', label: 'Negotiating', icon: Clock },
  accepted: { variant: 'success', label: 'Accepted', icon: CheckCircle },
  rejected: { variant: 'error', label: 'Rejected', icon: XCircle },
  expired: { variant: 'neutral', label: 'Expired', icon: Clock },
  ignored: { variant: 'neutral', label: 'Ignored', icon: XCircle },
};

// Health Status Presets
export const HEALTH_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  healthy: { variant: 'success', label: 'On Track', icon: CheckCircle },
  on_track: { variant: 'success', label: 'On Track', icon: CheckCircle },
  at_risk: { variant: 'warning', label: 'At Risk', icon: Warning, pulse: true },
  delayed: { variant: 'error', label: 'Delayed', icon: WarningCircle, pulse: true },
  critical: { variant: 'error', label: 'Critical', icon: WarningCircle, pulse: true },
  issue_detected: { variant: 'error', label: 'Issue', icon: WarningCircle, pulse: true },
  resolved: { variant: 'neutral', label: 'Resolved', icon: CheckCircle },
};

// Invoice Status Presets
export const INVOICE_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  draft: { variant: 'neutral', label: 'Draft', icon: Clock },
  pending_issue: { variant: 'warning', label: 'Pending', icon: Clock },
  issued: { variant: 'info', label: 'Issued', icon: Package },
  payment_pending: { variant: 'warning', label: 'Awaiting Payment', icon: Clock, pulse: true },
  paid: { variant: 'success', label: 'Paid', icon: CheckCircle },
  overdue: { variant: 'error', label: 'Overdue', icon: WarningCircle, pulse: true },
  partially_paid: { variant: 'warning', label: 'Partial', icon: Warning },
  cancelled: { variant: 'neutral', label: 'Cancelled', icon: XCircle },
  refunded: { variant: 'neutral', label: 'Refunded', icon: CheckCircle },
};

// Dispute Status Presets
export const DISPUTE_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  open: { variant: 'error', label: 'Open', icon: WarningCircle, pulse: true },
  under_review: { variant: 'warning', label: 'Under Review', icon: Clock },
  seller_responded: { variant: 'info', label: 'Responded', icon: CheckCircle },
  resolved: { variant: 'success', label: 'Resolved', icon: CheckCircle },
  rejected: { variant: 'neutral', label: 'Rejected', icon: XCircle },
  escalated: { variant: 'error', label: 'Escalated', icon: Warning, pulse: true },
  closed: { variant: 'neutral', label: 'Closed', icon: CheckCircle },
};

// =============================================================================
// Status Badge Component
// =============================================================================

interface StatusBadgeProps {
  /** Status key from preset configs or custom config */
  status: string;
  /** Preset config type */
  type?: 'order' | 'rfq' | 'health' | 'invoice' | 'dispute';
  /** Custom configuration override */
  config?: StatusBadgeConfig;
  /** Size variant */
  size?: BadgeSize;
  /** Show icon */
  showIcon?: boolean;
  /** Custom label override */
  label?: string;
  /** Force pulse animation */
  pulse?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Status Badge Component
 *
 * A unified, theme-aware status badge with:
 * - Preset configurations for common statuses
 * - Pulse animation for urgent states
 * - Icon support
 * - Multiple size variants
 * - Dark/light mode support
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  config: customConfig,
  size = 'sm',
  showIcon = true,
  label: customLabel,
  pulse: forcePulse,
  className = '',
}) => {
  const { styles } = usePortal();

  // Get config from presets or custom
  const getConfig = (): StatusBadgeConfig => {
    if (customConfig) return customConfig;

    const presets: Record<string, Record<string, StatusBadgeConfig>> = {
      order: ORDER_STATUS_CONFIG,
      rfq: RFQ_STATUS_CONFIG,
      health: HEALTH_STATUS_CONFIG,
      invoice: INVOICE_STATUS_CONFIG,
      dispute: DISPUTE_STATUS_CONFIG,
    };

    if (type && presets[type] && presets[type][status]) {
      return presets[type][status];
    }

    // Try to find in any preset
    for (const preset of Object.values(presets)) {
      if (preset[status]) return preset[status];
    }

    // Default fallback
    return { variant: 'neutral', label: status };
  };

  const badgeConfig = getConfig();
  const Icon = badgeConfig.icon;
  const shouldPulse = forcePulse !== undefined ? forcePulse : badgeConfig.pulse;
  const displayLabel = customLabel || badgeConfig.label;

  // Variant colors
  const variantColors: Record<
    BadgeVariant,
    { bg: string; darkBg: string; text: string; darkText: string; border: string }
  > = {
    default: {
      bg: styles.bgSecondary,
      darkBg: styles.bgSecondary,
      text: styles.textSecondary,
      darkText: styles.textSecondary,
      border: styles.border,
    },
    success: {
      bg: '#dcfce7',
      darkBg: '#14532d',
      text: '#15803d',
      darkText: '#86efac',
      border: '#22c55e',
    },
    warning: {
      bg: '#fef3c7',
      darkBg: '#78350f',
      text: '#b45309',
      darkText: '#fcd34d',
      border: '#f59e0b',
    },
    error: {
      bg: '#fee2e2',
      darkBg: '#7f1d1d',
      text: '#dc2626',
      darkText: '#fca5a5',
      border: '#ef4444',
    },
    info: {
      bg: '#e0e7ff',
      darkBg: '#312e81',
      text: '#4338ca',
      darkText: '#a5b4fc',
      border: '#6366f1',
    },
    neutral: {
      bg: '#f3f4f6',
      darkBg: '#374151',
      text: '#6b7280',
      darkText: '#9ca3af',
      border: '#9ca3af',
    },
  };

  const colors = variantColors[badgeConfig.variant];

  // Size configurations
  const sizeConfig: Record<BadgeSize, { padding: string; text: string; icon: number; gap: string }> = {
    xs: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', icon: 10, gap: 'gap-0.5' },
    sm: { padding: 'px-2 py-0.5', text: 'text-xs', icon: 12, gap: 'gap-1' },
    md: { padding: 'px-2.5 py-1', text: 'text-sm', icon: 14, gap: 'gap-1.5' },
  };

  const sizeStyle = sizeConfig[size];

  return (
    <span
      className={`
        inline-flex items-center ${sizeStyle.gap} ${sizeStyle.padding} rounded-full font-medium ${sizeStyle.text}
        ${shouldPulse ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{
        backgroundColor: styles.isDark ? colors.darkBg : colors.bg,
        color: styles.isDark ? colors.darkText : colors.text,
      }}
    >
      {showIcon && Icon && <Icon size={sizeStyle.icon} weight="bold" />}
      {displayLabel}
    </span>
  );
};

// =============================================================================
// Priority Badge Component (for RFQ/Ticket priorities)
// =============================================================================

export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: BadgeSize;
  showLabel?: boolean;
  className?: string;
}

/**
 * Priority Badge Component
 *
 * Displays priority levels with color coding and optional pulse for urgent items
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { styles } = usePortal();

  const priorityConfig: Record<PriorityLevel, { color: string; label: string; pulse: boolean }> = {
    low: { color: '#6b7280', label: 'Low', pulse: false },
    normal: { color: '#3b82f6', label: 'Normal', pulse: false },
    high: { color: '#f59e0b', label: 'High', pulse: false },
    urgent: { color: '#ef4444', label: 'Urgent', pulse: true },
    critical: { color: '#dc2626', label: 'Critical', pulse: true },
  };

  const config = priorityConfig[priority];

  const sizeConfig: Record<BadgeSize, { dot: string; text: string; gap: string }> = {
    xs: { dot: 'w-1.5 h-1.5', text: 'text-[10px]', gap: 'gap-1' },
    sm: { dot: 'w-2 h-2', text: 'text-xs', gap: 'gap-1.5' },
    md: { dot: 'w-2.5 h-2.5', text: 'text-sm', gap: 'gap-2' },
  };

  const sizeStyle = sizeConfig[size];

  return (
    <span className={`inline-flex items-center ${sizeStyle.gap} ${className}`} title={config.label}>
      <span
        className={`${sizeStyle.dot} rounded-full ${config.pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      {showLabel && (
        <span className={`${sizeStyle.text} font-medium`} style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </span>
  );
};

// =============================================================================
// Response Time Badge Component
// =============================================================================

interface ResponseTimeBadgeProps {
  hours: number;
  size?: BadgeSize;
  showLabel?: boolean;
  className?: string;
}

/**
 * Response Time Badge
 *
 * Shows response speed indicator: fast (<4h), moderate (4-24h), slow (>24h)
 */
export const ResponseTimeBadge: React.FC<ResponseTimeBadgeProps> = ({
  hours,
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { styles } = usePortal();

  const getConfig = () => {
    if (hours < 4) return { color: '#22c55e', label: 'Fast', icon: '⚡' };
    if (hours < 24) return { color: '#f59e0b', label: 'Moderate', icon: '🕐' };
    return { color: '#ef4444', label: 'Slow', icon: '🐢' };
  };

  const config = getConfig();

  const sizeConfig: Record<BadgeSize, { text: string; padding: string }> = {
    xs: { text: 'text-[10px]', padding: 'px-1 py-0.5' },
    sm: { text: 'text-xs', padding: 'px-1.5 py-0.5' },
    md: { text: 'text-sm', padding: 'px-2 py-1' },
  };

  const sizeStyle = sizeConfig[size];

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeStyle.padding} rounded ${sizeStyle.text} font-medium ${className}`}
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
      title={`Response time: ${hours}h`}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export default StatusBadge;
