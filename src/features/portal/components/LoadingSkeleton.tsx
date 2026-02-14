import React from 'react';
import { usePortal } from '../context/PortalContext';

// =============================================================================
// Base Skeleton Component
// =============================================================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

/**
 * Base Skeleton Component
 *
 * Shimmer loading placeholder
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = 'md',
  animate = true,
}) => {
  const { styles } = usePortal();

  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={`${roundedClass[rounded]} ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: styles.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      }}
    />
  );
};

// =============================================================================
// Preset Skeleton Patterns
// =============================================================================

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
}

/**
 * Text Skeleton - Multiple lines of text
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, lastLineWidth = '60%', className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? lastLineWidth : '100%'} height="0.875rem" />
      ))}
    </div>
  );
};

/**
 * Avatar Skeleton - Circular avatar placeholder
 */
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => {
  return <Skeleton width={size} height={size} rounded="full" className={className} />;
};

/**
 * Stat Card Skeleton
 */
export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`p-5 rounded-lg border ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton width="60%" height="0.75rem" className="mb-3" />
          <Skeleton width="40%" height="1.75rem" className="mb-2" />
          <Skeleton width="30%" height="0.625rem" />
        </div>
        <Skeleton width={40} height={40} rounded="md" />
      </div>
    </div>
  );
};

/**
 * Table Row Skeleton
 */
export const SkeletonTableRow: React.FC<{ columns?: number; className?: string }> = ({
  columns = 5,
  className = '',
}) => {
  const { styles } = usePortal();

  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3" style={{ borderBottom: `1px solid ${styles.border}` }}>
          <Skeleton width={i === 0 ? '70%' : i === columns - 1 ? '50%' : '80%'} height="0.875rem" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Product Card Skeleton (Grid item)
 */
export const SkeletonProductCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`rounded-lg border overflow-hidden ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {/* Image placeholder */}
      <Skeleton width="100%" height={160} rounded="none" />

      {/* Content */}
      <div className="px-2.5 py-2 space-y-2">
        <Skeleton width="80%" height="1rem" />
        <Skeleton width="35%" height="1rem" />
        <Skeleton width="50%" height="0.75rem" />
      </div>
    </div>
  );
};

/**
 * List Item Skeleton
 */
export const SkeletonListItem: React.FC<{
  hasAvatar?: boolean;
  hasAction?: boolean;
  className?: string;
}> = ({ hasAvatar = true, hasAction = true, className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {hasAvatar && <SkeletonAvatar size={36} />}
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height="0.875rem" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
      {hasAction && <Skeleton width={80} height={28} rounded="md" />}
    </div>
  );
};

/**
 * Insight Card Skeleton
 */
export const SkeletonInsightCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`p-4 rounded-lg border ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className="flex gap-3">
        <Skeleton width={40} height={40} rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height="0.875rem" />
          <Skeleton width="90%" height="0.75rem" />
          <Skeleton width="25%" height="0.625rem" />
        </div>
        <Skeleton width={50} height={24} rounded="md" />
      </div>
    </div>
  );
};

// =============================================================================
// Page-Level Skeleton Patterns
// =============================================================================

/**
 * Dashboard Page Skeleton
 */
export const SkeletonDashboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} height="1.5rem" />
          <Skeleton width={300} height="0.875rem" />
        </div>
        <Skeleton width={120} height={36} rounded="md" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Insights Section */}
      <div className="space-y-3">
        <Skeleton width={100} height="1rem" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonInsightCard key={i} />
        ))}
      </div>
    </div>
  );
};

/**
 * Table Page Skeleton
 */
export const SkeletonTablePage: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 5, className = '' }) => {
  const { styles } = usePortal();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} height="1.5rem" />
          <Skeleton width={300} height="0.875rem" />
        </div>
        <Skeleton width={120} height={36} rounded="md" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton width={200} height={36} rounded="md" />
        <Skeleton width={150} height={36} rounded="md" />
        <Skeleton width={100} height={36} rounded="md" />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: styles.border }}>
        <table className="w-full">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Marketplace Grid Skeleton
 */
export const SkeletonMarketplaceGrid: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 8, className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <Skeleton width={300} height={40} rounded="md" />
        <Skeleton width={120} height={40} rounded="md" />
        <Skeleton width={150} height={40} rounded="md" />
      </div>

      {/* Category chips */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={80 + i * 10} height={32} rounded="full" />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {Array.from({ length: items }).map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Chart Skeleton Components (Shimmer Effect)
// =============================================================================

/**
 * Shimmer Box - Base shimmer component for chart skeletons
 */
const ShimmerBox: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`shimmer rounded ${className}`} style={style} />
);

/**
 * Bar Chart Skeleton - Shimmer loading for bar charts
 */
const BAR_HEIGHTS = [65, 45, 80, 55, 70, 40, 75, 50];

export const SkeletonBarChart: React.FC<{
  height?: string;
  title?: string;
  showLegend?: boolean;
  className?: string;
}> = ({ height = 'h-64', title, showLegend = true, className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`flex flex-col p-5 rounded-lg border ${height} ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {title && (
        <div className="flex justify-between items-center mb-4">
          <ShimmerBox className="h-4 w-32" />
          <ShimmerBox className="h-6 w-20 rounded" />
        </div>
      )}
      <div className="flex-1 flex items-end justify-between gap-2 pb-4">
        {BAR_HEIGHTS.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
            <div className="w-full rounded-t shimmer" style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }} />
          </div>
        ))}
      </div>
      {showLegend && (
        <div className="flex items-center gap-4 pt-3 border-t" style={{ borderColor: styles.border }}>
          <ShimmerBox className="h-3 w-16" />
          <ShimmerBox className="h-3 w-16" />
          <ShimmerBox className="h-3 w-16" />
        </div>
      )}
    </div>
  );
};

/**
 * Pie/Donut Chart Skeleton - Shimmer loading for pie/donut charts
 */
export const SkeletonPieChart: React.FC<{
  size?: number;
  title?: string;
  className?: string;
}> = ({ size = 160, title, className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`flex flex-col items-center p-5 rounded-lg border ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {title && <ShimmerBox className="h-4 w-24 mb-4" />}
      <div className="rounded-full shimmer" style={{ width: size, height: size }} />
      <div className="flex items-center gap-4 mt-4">
        <ShimmerBox className="h-3 w-16" />
        <ShimmerBox className="h-3 w-16" />
        <ShimmerBox className="h-3 w-16" />
      </div>
    </div>
  );
};

/**
 * Line Chart Skeleton - Shimmer loading for line/area charts
 */
export const SkeletonLineChart: React.FC<{
  height?: string;
  title?: string;
  className?: string;
}> = ({ height = 'h-64', title, className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`flex flex-col p-5 rounded-lg border ${height} ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {title && (
        <div className="flex justify-between items-center mb-4">
          <ShimmerBox className="h-4 w-32" />
          <ShimmerBox className="h-6 w-20 rounded" />
        </div>
      )}
      <div className="flex-1 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2">
          {[...Array(5)].map((_, i) => (
            <ShimmerBox key={i} className="h-3 w-8" style={{ animationDelay: `${i * 30}ms` }} />
          ))}
        </div>
        {/* Chart area with shimmer */}
        <div className="ml-12 h-full flex items-center relative overflow-hidden rounded-lg shimmer">
          <svg className="w-full h-3/4 relative z-10" viewBox="0 0 100 50" preserveAspectRatio="none">
            <path
              d="M0,40 Q10,35 20,38 T40,30 T60,35 T80,25 T100,30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-zinc-400 dark:text-zinc-500"
            />
          </svg>
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 ml-12">
        {[...Array(6)].map((_, i) => (
          <ShimmerBox key={i} className="h-3 w-8" style={{ animationDelay: `${i * 30}ms` }} />
        ))}
      </div>
    </div>
  );
};

/**
 * Funnel Chart Skeleton - Shimmer loading for funnel charts
 */
export const SkeletonFunnelChart: React.FC<{
  height?: string;
  title?: string;
  className?: string;
}> = ({ height = 'h-52', title, className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`flex flex-col p-5 rounded-lg border ${height} ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {title && <ShimmerBox className="h-4 w-32 mb-4" />}
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        {[100, 75, 50, 30].map((width, i) => (
          <div
            key={i}
            className="shimmer rounded"
            style={{
              width: `${width}%`,
              height: '20%',
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * KPI Stat Card Skeleton with Shimmer - Enhanced stat card with shimmer effect
 */
export const SkeletonKPICard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`p-5 rounded-lg border ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <ShimmerBox className="h-3 w-20 mb-3" />
          <ShimmerBox className="h-7 w-28 mb-2" />
          <ShimmerBox className="h-4 w-16 rounded-full" />
        </div>
        <ShimmerBox className="w-10 h-10 rounded-md" />
      </div>
    </div>
  );
};

/**
 * Analytics Dashboard Skeleton - Full shimmer skeleton for analytics pages
 */
export const SkeletonAnalyticsDashboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonKPICard key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBarChart title="Revenue" height="h-72" />
        <SkeletonPieChart title="Categories" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonFunnelChart title="Funnel" />
        <SkeletonListSkeleton rows={5} />
        <SkeletonBarChart title="Distribution" height="h-56" showLegend={false} />
      </div>
    </div>
  );
};

/**
 * List Skeleton with Shimmer
 */
export const SkeletonListSkeleton: React.FC<{
  rows?: number;
  title?: string;
  className?: string;
}> = ({ rows = 5, title, className = '' }) => {
  const { styles } = usePortal();

  return (
    <div
      className={`p-5 rounded-lg border ${className}`}
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {title && <ShimmerBox className="h-4 w-24 mb-4" />}
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center justify-between" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center gap-3">
              <ShimmerBox className="w-8 h-8 rounded" />
              <div className="space-y-1">
                <ShimmerBox className="h-3 w-24" />
                <ShimmerBox className="h-2 w-16" />
              </div>
            </div>
            <ShimmerBox className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
