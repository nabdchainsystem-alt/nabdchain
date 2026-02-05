import React from 'react';
import { IconProps, ArrowRight, Lightbulb, Lightning } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

// =============================================================================
// Next Best Action Item - Individual action suggestion
// =============================================================================

export interface NextBestActionItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<IconProps>;
  onClick: () => void;
  priority?: 'high' | 'medium' | 'low';
  badge?: string;
}

interface NextBestActionsProps {
  actions: NextBestActionItem[];
  title?: string;
  compact?: boolean;
}

/**
 * Next Best Actions Component
 *
 * Displays 1-3 suggested actions for the user based on current context
 */
export const NextBestActions: React.FC<NextBestActionsProps> = ({
  actions,
  title = 'Suggested next steps',
  compact = false,
}) => {
  const { styles } = usePortal();

  if (actions.length === 0) return null;

  const priorityColors = {
    high: { bg: styles.isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)', border: '#ef4444' },
    medium: { bg: styles.isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
    low: { bg: styles.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center gap-1.5">
        <Lightbulb size={14} weight="fill" style={{ color: styles.warning }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: styles.textMuted }}>
          {title}
        </span>
      </div>
      <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
        {actions.slice(0, 3).map((action) => {
          const ActionIcon = action.icon || Lightning;
          const colors = priorityColors[action.priority || 'low'];

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`w-full flex items-center gap-3 ${compact ? 'p-2' : 'p-3'} rounded-lg border transition-all duration-200 hover:scale-[1.01] group`}
              style={{
                backgroundColor: colors.bg,
                borderColor: styles.isDark ? `${colors.border}40` : `${colors.border}30`,
              }}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <ActionIcon size={16} weight="bold" style={{ color: colors.border }} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${compact ? 'text-xs' : 'text-sm'} truncate`}
                    style={{ color: styles.textPrimary }}
                  >
                    {action.label}
                  </span>
                  {action.badge && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: colors.border,
                        color: '#fff',
                      }}
                    >
                      {action.badge}
                    </span>
                  )}
                </div>
                {!compact && action.description && (
                  <span className="text-xs mt-0.5 block truncate" style={{ color: styles.textSecondary }}>
                    {action.description}
                  </span>
                )}
              </div>
              <ArrowRight
                size={14}
                weight="bold"
                className="flex-shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: styles.textMuted }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Empty State Props with Next Best Action support
// =============================================================================

interface EmptyStateProps {
  icon?: React.ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Next Best Action suggestions - shows contextual hints */
  nextBestActions?: NextBestActionItem[];
  /** Illustration URL or key */
  illustration?: 'orders' | 'rfqs' | 'items' | 'search' | 'error' | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Empty State Component (Enhanced)
 *
 * Centered content for empty pages/sections with:
 * - Dark/light mode support
 * - Next Best Action hints
 * - Optional illustrations
 * - Size variants
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  nextBestActions = [],
  size = 'md',
}) => {
  const { styles } = usePortal();

  const sizes = {
    sm: { padding: 'py-10 px-4', icon: 20, iconBox: 'w-10 h-10', title: 'text-base', gap: 'mb-3' },
    md: { padding: 'py-20 px-6', icon: 28, iconBox: 'w-14 h-14', title: 'text-lg', gap: 'mb-5' },
    lg: { padding: 'py-28 px-8', icon: 36, iconBox: 'w-18 h-18', title: 'text-xl', gap: 'mb-6' },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center ${sizeConfig.padding}`}>
      {Icon && (
        <div
          className={`${sizeConfig.iconBox} rounded-full flex items-center justify-center ${sizeConfig.gap}`}
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Icon size={sizeConfig.icon} weight="light" style={{ color: styles.textMuted }} />
        </div>
      )}
      <h3
        className={`${sizeConfig.title} font-medium text-center`}
        style={{
          color: styles.textPrimary,
          fontFamily: styles.fontHeading,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mt-2 text-sm text-center max-w-md"
          style={{ color: styles.textSecondary }}
        >
          {description}
        </p>
      )}

      {/* Primary Action Button */}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}

      {/* Next Best Actions Section */}
      {nextBestActions.length > 0 && (
        <div className="mt-8 w-full max-w-sm">
          <NextBestActions actions={nextBestActions} compact={size === 'sm'} />
        </div>
      )}
    </div>
  );
};

export default EmptyState;
