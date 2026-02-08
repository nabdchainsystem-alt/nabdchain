import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Warning, Timer, CheckCircle } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

// =============================================================================
// Types
// =============================================================================

type CountdownSize = 'xs' | 'sm' | 'md' | 'lg';
type CountdownVariant = 'badge' | 'inline' | 'full';

interface ValidityCountdownProps {
  /** The validity end date (ISO string or Date) */
  validUntil: string | Date;
  /** Size variant */
  size?: CountdownSize;
  /** Display variant */
  variant?: CountdownVariant;
  /** Show icon */
  showIcon?: boolean;
  /** Show progress bar (only for 'full' variant) */
  showProgress?: boolean;
  /** Custom label prefix */
  labelPrefix?: string;
  /** Additional class names */
  className?: string;
  /** Callback when expired */
  onExpired?: () => void;
  /** Update interval in ms (default: 60000 = 1 minute) */
  updateInterval?: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isCritical: boolean;
}

function calculateTimeRemaining(validUntil: string | Date): TimeRemaining {
  const endDate = new Date(validUntil);
  const now = new Date();
  const totalMs = endDate.getTime() - now.getTime();

  if (totalMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isExpiringSoon: false,
      isCritical: false,
    };
  }

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  // Less than 24 hours = critical
  const isCritical = days === 0 && hours < 24;
  // Less than 3 days = expiring soon
  const isExpiringSoon = days <= 3;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    isExpired: false,
    isExpiringSoon,
    isCritical,
  };
}

function formatTimeRemaining(time: TimeRemaining, variant: CountdownVariant): string {
  if (time.isExpired) {
    return 'Expired';
  }

  if (variant === 'badge') {
    if (time.days > 0) {
      return `${time.days}d`;
    }
    if (time.hours > 0) {
      return `${time.hours}h`;
    }
    return `${time.minutes}m`;
  }

  if (variant === 'inline') {
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h`;
    }
    if (time.hours > 0) {
      return `${time.hours}h ${time.minutes}m`;
    }
    return `${time.minutes}m`;
  }

  // Full variant
  if (time.days > 0) {
    return `${time.days} day${time.days > 1 ? 's' : ''}, ${time.hours} hour${time.hours !== 1 ? 's' : ''}`;
  }
  if (time.hours > 0) {
    return `${time.hours} hour${time.hours !== 1 ? 's' : ''}, ${time.minutes} minute${time.minutes !== 1 ? 's' : ''}`;
  }
  return `${time.minutes} minute${time.minutes !== 1 ? 's' : ''}`;
}

// =============================================================================
// ValidityCountdown Component
// =============================================================================

/**
 * ValidityCountdown Component
 *
 * A live countdown component showing time remaining until quote/offer expiry.
 * Features:
 * - Real-time countdown updates
 * - Color coding based on urgency (green > 3d, yellow 1-3d, red <24h)
 * - Multiple display variants (badge, inline, full)
 * - Dark/light mode support
 * - Optional progress bar visualization
 */
export const ValidityCountdown: React.FC<ValidityCountdownProps> = ({
  validUntil,
  size = 'sm',
  variant = 'badge',
  showIcon = true,
  showProgress = false,
  labelPrefix,
  className = '',
  onExpired,
  updateInterval = 60000,
}) => {
  const { styles } = usePortal();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => calculateTimeRemaining(validUntil));

  // Update countdown periodically
  useEffect(() => {
    const update = () => {
      const newTime = calculateTimeRemaining(validUntil);
      setTimeRemaining(newTime);

      if (newTime.isExpired && onExpired) {
        onExpired();
      }
    };

    // Initial update
    update();

    // Set up interval
    const interval = setInterval(update, updateInterval);

    return () => clearInterval(interval);
  }, [validUntil, updateInterval, onExpired]);

  // Determine colors based on urgency
  const colors = useMemo(() => {
    if (timeRemaining.isExpired) {
      return {
        bg: styles.isDark ? '#7f1d1d' : '#fee2e2',
        text: styles.isDark ? '#fca5a5' : '#dc2626',
        border: '#ef4444',
        icon: Timer,
      };
    }

    if (timeRemaining.isCritical) {
      return {
        bg: styles.isDark ? '#7f1d1d' : '#fee2e2',
        text: styles.isDark ? '#fca5a5' : '#dc2626',
        border: '#ef4444',
        icon: Warning,
      };
    }

    if (timeRemaining.isExpiringSoon) {
      return {
        bg: styles.isDark ? '#78350f' : '#fef3c7',
        text: styles.isDark ? '#fcd34d' : '#b45309',
        border: '#f59e0b',
        icon: Clock,
      };
    }

    return {
      bg: styles.isDark ? '#14532d' : '#dcfce7',
      text: styles.isDark ? '#86efac' : '#15803d',
      border: '#22c55e',
      icon: CheckCircle,
    };
  }, [timeRemaining, styles.isDark]);

  const Icon = colors.icon;
  const displayText = formatTimeRemaining(timeRemaining, variant as CountdownVariant);

  // Size configurations
  const sizeConfig: Record<
    CountdownSize,
    {
      padding: string;
      text: string;
      icon: number;
      gap: string;
    }
  > = {
    xs: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', icon: 10, gap: 'gap-0.5' },
    sm: { padding: 'px-2 py-0.5', text: 'text-xs', icon: 12, gap: 'gap-1' },
    md: { padding: 'px-2.5 py-1', text: 'text-sm', icon: 14, gap: 'gap-1.5' },
    lg: { padding: 'px-3 py-1.5', text: 'text-base', icon: 16, gap: 'gap-2' },
  };

  const sizeStyle = sizeConfig[size];

  // Render badge variant
  if (variant === 'badge') {
    return (
      <span
        className={`
          inline-flex items-center ${sizeStyle.gap} ${sizeStyle.padding}
          rounded-full font-medium ${sizeStyle.text}
          ${timeRemaining.isCritical ? 'animate-pulse' : ''}
          ${className}
        `}
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
        }}
        title={`Valid until: ${new Date(validUntil).toLocaleString()}`}
      >
        {showIcon && <Icon size={sizeStyle.icon} weight="bold" />}
        {labelPrefix && <span>{labelPrefix}</span>}
        <span>{displayText}</span>
      </span>
    );
  }

  // Render inline variant
  if (variant === 'inline') {
    return (
      <span
        className={`
          inline-flex items-center ${sizeStyle.gap} ${sizeStyle.text} font-medium
          ${timeRemaining.isCritical ? 'animate-pulse' : ''}
          ${className}
        `}
        style={{ color: colors.text }}
        title={`Valid until: ${new Date(validUntil).toLocaleString()}`}
      >
        {showIcon && <Icon size={sizeStyle.icon} weight="bold" />}
        {labelPrefix && <span>{labelPrefix}</span>}
        <span>{displayText}</span>
      </span>
    );
  }

  // Render full variant with optional progress bar
  return (
    <div
      className={`
        rounded-lg border ${sizeStyle.padding}
        ${timeRemaining.isCritical ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
      title={`Valid until: ${new Date(validUntil).toLocaleString()}`}
    >
      <div className={`flex items-center ${sizeStyle.gap}`}>
        {showIcon && <Icon size={sizeStyle.icon + 4} weight="bold" style={{ color: colors.text }} />}
        <div className="flex-1">
          <div className={`${sizeStyle.text} font-medium`} style={{ color: colors.text }}>
            {labelPrefix || (timeRemaining.isExpired ? 'Expired' : 'Valid for')}
          </div>
          <div className={`${size === 'lg' ? 'text-lg' : 'text-sm'} font-bold`} style={{ color: colors.text }}>
            {displayText}
          </div>
        </div>
      </div>

      {showProgress && !timeRemaining.isExpired && (
        <div className="mt-2">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: styles.isDark ? '#374151' : '#e5e7eb' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                backgroundColor: colors.border,
                width: `${Math.max(0, Math.min(100, (timeRemaining.totalMs / (7 * 24 * 60 * 60 * 1000)) * 100))}%`,
              }}
            />
          </div>
          <div className="text-[10px] mt-1 text-right" style={{ color: styles.textMuted }}>
            {new Date(validUntil).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Compact Validity Display (for tables/lists)
// =============================================================================

interface ValidityIndicatorProps {
  validUntil: string | Date;
  className?: string;
}

/**
 * ValidityIndicator
 *
 * A compact validity indicator for use in tables and lists.
 * Shows a colored dot + text based on urgency.
 */
export const ValidityIndicator: React.FC<ValidityIndicatorProps> = ({ validUntil, className = '' }) => {
  const time = calculateTimeRemaining(validUntil);

  const getConfig = () => {
    if (time.isExpired) {
      return { color: '#ef4444', label: 'Expired' };
    }
    if (time.isCritical) {
      return { color: '#ef4444', label: `${time.hours}h left` };
    }
    if (time.isExpiringSoon) {
      return { color: '#f59e0b', label: `${time.days}d left` };
    }
    return { color: '#22c55e', label: `${time.days}d left` };
  };

  const config = getConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`w-2 h-2 rounded-full ${time.isCritical ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      <span className="text-xs" style={{ color: config.color }}>
        {config.label}
      </span>
    </span>
  );
};

export default ValidityCountdown;
