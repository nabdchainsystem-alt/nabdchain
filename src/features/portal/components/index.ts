// =============================================================================
// Portal Components - Unified Export
// =============================================================================

// Layout Components
export { Container } from './Container';
export { TopNav } from './TopNav';
export { Sidebar } from './Sidebar';
export { ContentTopBar } from './ContentTopBar';
export type { PortalRole } from './Sidebar';
export { PageHeader } from './PageHeader';
export { PageLayout } from './PageLayout';
export { SummaryGrid } from './SummaryGrid';
export { ActionsGrid } from './ActionsGrid';

// Basic UI Components
export { Button } from './Button';
export { DataTable } from './DataTable';
export { StatCard } from './StatCard';

// Empty States & Next Best Actions (Enhanced)
export {
  EmptyState,
  NextBestActions,
  type NextBestActionItem,
} from './EmptyState';

// Status Badges (NEW)
export {
  StatusBadge,
  PriorityBadge,
  ResponseTimeBadge,
  ORDER_STATUS_CONFIG,
  RFQ_STATUS_CONFIG,
  HEALTH_STATUS_CONFIG,
  INVOICE_STATUS_CONFIG,
  DISPUTE_STATUS_CONFIG,
  type BadgeVariant,
  type BadgeSize,
  type PriorityLevel,
} from './StatusBadge';

// Insight Cards (NEW)
export {
  InsightCard,
  InsightsPanel,
  QuickStatInsight,
  type InsightType,
  type InsightPriority,
  type InsightData,
} from './InsightCard';

// Loading Skeletons (NEW)
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonStatCard,
  SkeletonTableRow,
  SkeletonProductCard,
  SkeletonListItem,
  SkeletonInsightCard,
  SkeletonDashboard,
  SkeletonTablePage,
  SkeletonMarketplaceGrid,
  // Chart Skeletons (Shimmer Effect)
  SkeletonBarChart,
  SkeletonPieChart,
  SkeletonLineChart,
  SkeletonFunnelChart,
  SkeletonKPICard,
  SkeletonAnalyticsDashboard,
  SkeletonListSkeleton,
} from './LoadingSkeleton';

// Toast Notifications (NEW)
export {
  ToastProvider,
  useToast,
  toastContent,
  type Toast,
  type ToastType,
} from './Toast';

// Notification Bell
export { NotificationBell } from './NotificationBell';

// Manual Compare Modal
export { ManualCompareModal } from './ManualCompareModal';

// Hybrid Compare Modal
export { HybridCompareModal } from './HybridCompareModal';
export { DataSourceBadge } from './DataSourceBadge';

// Date Picker
export { PortalDatePicker } from './PortalDatePicker';

// Quick Action Card
export { QuickActionCard } from './QuickActionCard';

// UI Components (Radix-based)
export * from './ui';
