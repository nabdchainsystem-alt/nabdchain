// =============================================================================
// ActionsGrid - Quick Actions Section
// =============================================================================
// Standardized grid layout for quick action cards
// =============================================================================

import React, { ReactNode } from 'react';

interface ActionsGridProps {
  /** Grid children (QuickActionCard components) */
  children: ReactNode;
  /** Number of columns on different breakpoints */
  columns?: {
    default?: 1;
    sm?: 2;
    lg?: 3 | 4;
  };
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * ActionsGrid Component
 *
 * Standardized grid layout for quick actions. Use with QuickActionCard children.
 */
export const ActionsGrid: React.FC<ActionsGridProps> = ({
  children,
  columns = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
}) => {
  const gapClass = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }[gap];

  const colsClass = `grid-cols-${columns.default || 1} sm:grid-cols-${columns.sm || 2} lg:grid-cols-${columns.lg || 3}`;

  return <div className={`grid ${colsClass} ${gapClass}`}>{children}</div>;
};

export default ActionsGrid;
