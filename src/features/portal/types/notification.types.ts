// =============================================================================
// Portal Notification Types
// =============================================================================

export type PortalType = 'seller' | 'buyer';
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type NotificationCategory = 'rfq' | 'order' | 'invoice' | 'dispute' | 'payout' | 'system';

export type PortalNotificationType =
  // RFQ Notifications
  | 'rfq_received'
  | 'rfq_expiring_soon'
  | 'rfq_expired'
  | 'rfq_quote_received'
  // Order Notifications
  | 'order_created'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_status_changed'
  // Invoice Notifications
  | 'invoice_issued'
  | 'invoice_paid'
  | 'invoice_overdue'
  // Dispute Notifications
  | 'dispute_opened'
  | 'dispute_response_required'
  | 'dispute_resolved'
  | 'dispute_escalated'
  // Payout Notifications
  | 'payout_processed'
  | 'payout_failed'
  | 'payout_on_hold';

export interface PortalNotification {
  id: string;
  type: PortalNotificationType;
  title: string;
  body?: string | null;
  entityType: NotificationCategory | string | null;
  entityId: string | null;
  entityName?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatar?: string | null;
  read: boolean;
  actionUrl?: string | null;
  priority: NotificationPriority;
  category: NotificationCategory | string | null;
  portalType: PortalType | string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  // Grouping (added via metadata)
  isGrouped?: boolean;
  groupCount?: number;
  groupedIds?: string[];
}

export interface NotificationCounts {
  total: number;
  actionRequired: number;
}

// Icon mapping for notification categories
export const NOTIFICATION_CATEGORY_ICONS: Record<NotificationCategory, string> = {
  rfq: 'FileText',
  order: 'Package',
  invoice: 'Receipt',
  dispute: 'ShieldWarning',
  payout: 'CurrencyDollar',
  system: 'Bell',
};

// Priority colors for styling
export const PRIORITY_COLORS: Record<NotificationPriority, {
  dot: string;
  bg: string;
  text: string;
}> = {
  critical: { dot: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', text: '#DC2626' },
  high: { dot: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', text: '#D97706' },
  normal: { dot: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', text: '#2563EB' },
  low: { dot: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', text: '#4B5563' },
};
