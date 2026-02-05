// =============================================================================
// SummaryGrid - Decision-Focused Stats Section
// =============================================================================
// Standardized grid layout for key metrics and stats cards
// =============================================================================

import React, { ReactNode } from 'react';
import { usePortal } from '../context/PortalContext';

interface SummaryGridProps {
  /** Grid children (StatCard components) */
  children: ReactNode;
  /** Number of columns on different breakpoints */
  columns?: {
    default?: 1 | 2;
    sm?: 2 | 3;
    lg?: 3 | 4 | 5;
  };
  /** Optional section title */
  title?: string;
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * SummaryGrid Component
 *
 * Standardized grid layout for summary stats. Use with StatCard children.
 */
export const SummaryGrid: React.FC<SummaryGridProps> = ({
  children,
  columns = { default: 2, sm: 3, lg: 4 },
  title,
  gap = 'md',
}) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const gapClass = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }[gap];

  const colsClass = `grid-cols-${columns.default || 2} sm:grid-cols-${columns.sm || 3} lg:grid-cols-${columns.lg || 4}`;

  return (
    <div>
      {title && (
        <h2
          className={`text-sm font-medium uppercase tracking-wider mb-4 ${isRtl ? 'text-right' : ''}`}
          style={{ color: styles.textMuted }}
        >
          {title}
        </h2>
      )}
      <div className={`grid ${colsClass} ${gapClass}`}>{children}</div>
    </div>
  );
};

export default SummaryGrid;
