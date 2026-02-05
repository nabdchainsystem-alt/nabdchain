import React from 'react';
import { IconProps, ArrowRight } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<IconProps>;
  /** Custom color for icon and highlighting */
  color?: string;
  /** Whether to highlight the card with the color */
  highlight?: boolean;
  /** Click handler - if provided, renders as button */
  onClick?: () => void;
  /** Trend change indicator */
  change?: {
    value: string;
    positive?: boolean;
  };
  /** Card size variant */
  size?: 'sm' | 'md';
}

/**
 * Unified Stat Card Component
 *
 * Versatile KPI display for dashboards. Supports:
 * - Custom colors and highlighting
 * - Clickable cards with hover effects
 * - Trend indicators
 * - Two size variants
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  highlight,
  onClick,
  change,
  size = 'md',
}) => {
  const { styles } = usePortal();

  const padding = size === 'sm' ? 'p-4' : 'p-5';
  const valueSize = size === 'sm' ? 'text-xl' : 'text-2xl';
  const iconSize = size === 'sm' ? 18 : 20;
  const iconBoxSize = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';

  const cardContent = (
    <div className="flex items-center gap-3">
      {Icon && (
        <div
          className={`${iconBoxSize} rounded-lg flex items-center justify-center flex-shrink-0`}
          style={{ backgroundColor: color ? `${color}15` : styles.bgSecondary }}
        >
          <Icon
            size={iconSize}
            weight={highlight ? 'fill' : 'regular'}
            style={{ color: color || styles.textMuted }}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs truncate" style={{ color: styles.textMuted }}>
          {label}
        </p>
        <p
          className={`${valueSize} font-bold`}
          style={{
            color: highlight && color ? color : styles.textPrimary,
            fontFamily: styles.fontHeading,
          }}
        >
          {value}
        </p>
        {change && (
          <p
            className="text-xs font-medium"
            style={{ color: change.positive ? styles.success : styles.textMuted }}
          >
            {change.value}
          </p>
        )}
      </div>
      {onClick && (
        <ArrowRight
          size={16}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{ color: styles.textMuted }}
        />
      )}
    </div>
  );

  const baseStyles = {
    backgroundColor: highlight && color ? `${color}10` : styles.bgCard,
    borderColor: highlight && color ? `${color}40` : styles.border,
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${padding} rounded-lg border transition-all text-left w-full group hover:shadow-sm`}
        style={baseStyles}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div
      className={`${padding} rounded-lg border transition-colors`}
      style={baseStyles}
    >
      {cardContent}
    </div>
  );
};

export default StatCard;
