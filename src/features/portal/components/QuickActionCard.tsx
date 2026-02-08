import React from 'react';
import { ArrowRight, IconProps } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

interface QuickActionCardProps {
  /** Action title/label */
  title: string;
  /** Optional description text */
  description?: string;
  /** Phosphor icon component */
  icon: React.ComponentType<IconProps>;
  /** Custom accent color for the icon background */
  color?: string;
  /** Click handler */
  onClick: () => void;
  /** Visual variant */
  variant?: 'card' | 'button' | 'compact';
  /** Optional badge/count to display */
  badge?: number | null;
}

/**
 * QuickActionCard Component
 *
 * Unified quick action component supporting three variants:
 * - card: Full card with title, description, icon, and arrow (default)
 * - button: Compact button with icon and label
 * - compact: Minimal button for dense layouts
 */
export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  variant = 'card',
  badge,
}) => {
  const { styles } = usePortal();

  // Compact variant - minimal button
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 p-3 rounded-lg text-sm transition-colors hover:border-zinc-400 dark:hover:border-zinc-500"
        style={{
          backgroundColor: styles.bgCard,
          border: `1px solid ${styles.border}`,
          color: styles.textSecondary,
        }}
      >
        <Icon size={16} weight="regular" style={{ color: styles.textMuted }} />
        <span className="truncate">{title}</span>
        {badge !== null && badge !== undefined && badge > 0 && (
          <span
            className="px-1.5 py-0.5 text-xs font-medium rounded-full"
            style={{
              backgroundColor: styles.info,
              color: '#fff',
            }}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }

  // Button variant - icon + label
  if (variant === 'button') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2.5 px-5 py-3 rounded-md border transition-colors hover:border-zinc-400 dark:hover:border-zinc-500"
        style={{
          borderColor: styles.border,
          backgroundColor: styles.bgCard,
          color: styles.textPrimary,
          fontFamily: styles.fontBody,
        }}
      >
        <Icon size={18} style={{ color: styles.textSecondary }} />
        <span className="text-sm font-medium">{title}</span>
      </button>
    );
  }

  // Card variant (default) - full card with description
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-lg border transition-all text-left w-full group hover:shadow-md"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color ? `${color}15` : styles.bgSecondary }}
        >
          <Icon size={20} style={{ color: color || styles.textMuted }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" style={{ color: styles.textPrimary }}>
            {title}
          </div>
          {description && (
            <div className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
              {description}
            </div>
          )}
        </div>
        <ArrowRight
          size={16}
          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: styles.textMuted }}
        />
      </div>
    </button>
  );
};

export default QuickActionCard;
