// =============================================================================
// Portal Notification Service - Unified notification creation and delivery
// =============================================================================

import { prisma } from '../lib/prisma';
import { Server as SocketIOServer } from 'socket.io';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type PortalType = 'seller' | 'buyer';
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type NotificationCategory = 'rfq' | 'order' | 'invoice' | 'dispute' | 'payout' | 'system';

export type PortalNotificationType =
  // RFQ Notifications
  | 'rfq_received'
  | 'rfq_declined'
  | 'rfq_expiring_soon'
  | 'rfq_expired'
  | 'rfq_quote_received'
  // Counter-Offer Notifications
  | 'counter_offer_received'
  | 'counter_offer_accepted'
  | 'counter_offer_rejected'
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

export interface CreatePortalNotificationInput {
  userId: string;
  portalType: PortalType;
  type: PortalNotificationType;
  entityType: NotificationCategory;
  entityId: string;
  entityName?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Notification Templates (max 8 words)
// =============================================================================

const NOTIFICATION_TEMPLATES: Record<PortalNotificationType, {
  title: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  expiresInHours?: number;
}> = {
  // RFQ - Seller
  rfq_received: {
    title: 'New RFQ received',
    priority: 'high',
    category: 'rfq',
  },
  rfq_declined: {
    title: 'Your RFQ was declined by seller',
    priority: 'high',
    category: 'rfq',
  },
  rfq_expiring_soon: {
    title: 'RFQ expires in 24 hours',
    priority: 'high',
    category: 'rfq',
  },
  rfq_expired: {
    title: 'RFQ has expired',
    priority: 'normal',
    category: 'rfq',
    expiresInHours: 72,
  },
  // RFQ - Buyer
  rfq_quote_received: {
    title: 'Quote received for your RFQ',
    priority: 'high',
    category: 'rfq',
  },
  // Counter-Offer
  counter_offer_received: {
    title: 'New counter-offer on your quote',
    priority: 'high',
    category: 'rfq',
  },
  counter_offer_accepted: {
    title: 'Your counter-offer was accepted',
    priority: 'high',
    category: 'rfq',
  },
  counter_offer_rejected: {
    title: 'Your counter-offer was declined',
    priority: 'normal',
    category: 'rfq',
  },
  // Order
  order_created: {
    title: 'New order received',
    priority: 'high',
    category: 'order',
  },
  order_confirmed: {
    title: 'Order confirmed by seller',
    priority: 'normal',
    category: 'order',
  },
  order_shipped: {
    title: 'Order has been shipped',
    priority: 'normal',
    category: 'order',
  },
  order_delivered: {
    title: 'Order delivered successfully',
    priority: 'normal',
    category: 'order',
    expiresInHours: 168, // 7 days
  },
  order_cancelled: {
    title: 'Order has been cancelled',
    priority: 'high',
    category: 'order',
  },
  order_status_changed: {
    title: 'Order status updated',
    priority: 'normal',
    category: 'order',
  },
  // Invoice
  invoice_issued: {
    title: 'Invoice issued for order',
    priority: 'normal',
    category: 'invoice',
  },
  invoice_paid: {
    title: 'Invoice payment confirmed',
    priority: 'normal',
    category: 'invoice',
    expiresInHours: 168,
  },
  invoice_overdue: {
    title: 'Invoice payment overdue',
    priority: 'critical',
    category: 'invoice',
  },
  // Dispute
  dispute_opened: {
    title: 'Dispute opened on order',
    priority: 'critical',
    category: 'dispute',
  },
  dispute_response_required: {
    title: 'Dispute needs your response',
    priority: 'critical',
    category: 'dispute',
  },
  dispute_resolved: {
    title: 'Dispute has been resolved',
    priority: 'normal',
    category: 'dispute',
    expiresInHours: 168,
  },
  dispute_escalated: {
    title: 'Dispute escalated to platform',
    priority: 'critical',
    category: 'dispute',
  },
  // Payout
  payout_processed: {
    title: 'Payout sent to your bank',
    priority: 'normal',
    category: 'payout',
    expiresInHours: 168,
  },
  payout_failed: {
    title: 'Payout failed - action needed',
    priority: 'critical',
    category: 'payout',
  },
  payout_on_hold: {
    title: 'Payout on hold',
    priority: 'high',
    category: 'payout',
  },
};

// =============================================================================
// Socket.IO Instance (set via initialize)
// =============================================================================

let io: SocketIOServer | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function buildActionUrl(portalType: PortalType, entityType: string, entityId: string): string {
  const paths: Record<string, string> = {
    rfq: `rfqs`,
    order: `orders`,
    invoice: `invoices`,
    dispute: `disputes`,
    payout: `payouts`,
  };
  const section = paths[entityType] || '';
  return `/${portalType}/${section}/${entityId}`;
}

function buildGroupKey(type: string, entityType: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${type}-${entityType}-${today}`;
}

interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  actorId: string | null;
  actorName: string | null;
  actorAvatar: string | null;
  read: boolean;
  actionUrl: string | null;
  priority: string;
  category: string | null;
  portalType: string | null;
  groupKey: string | null;
  metadata: string | null;
  createdAt: Date;
  expiresAt: Date | null;
}

function groupNotifications(notifications: NotificationRecord[]): NotificationRecord[] {
  const groups = new Map<string, NotificationRecord[]>();

  for (const notif of notifications) {
    const key = notif.groupKey || notif.id;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(notif);
  }

  return Array.from(groups.values()).map(group => {
    if (group.length === 1) {
      return group[0];
    }
    // Return the most recent notification with group info in metadata
    const mostRecent = group[0];
    return {
      ...mostRecent,
      metadata: JSON.stringify({
        ...(mostRecent.metadata ? JSON.parse(mostRecent.metadata) : {}),
        isGrouped: true,
        groupCount: group.length,
        groupedIds: group.map(n => n.id),
      }),
    };
  });
}

// =============================================================================
// User ID Resolution
// =============================================================================

/**
 * Resolve a profile ID (BuyerProfile.id or SellerProfile.id) to the User.id.
 * If the ID already exists in the User table, return it as-is.
 * Otherwise, look it up in BuyerProfile or SellerProfile.
 */
async function resolveUserId(profileOrUserId: string, portalType: PortalType): Promise<string> {
  // Fast path: if it looks like a Clerk-style user ID, it's already a User.id
  if (profileOrUserId.startsWith('usr_') || profileOrUserId.startsWith('user_')) {
    return profileOrUserId;
  }

  // Check BuyerProfile or SellerProfile to find the User.id
  try {
    if (portalType === 'buyer') {
      const buyer = await prisma.buyerProfile.findUnique({
        where: { id: profileOrUserId },
        select: { userId: true },
      });
      if (buyer?.userId) return buyer.userId;
    } else {
      const seller = await prisma.sellerProfile.findUnique({
        where: { id: profileOrUserId },
        select: { userId: true },
      });
      if (seller?.userId) return seller.userId;
    }
  } catch {
    // Fall through to return original ID
  }

  // If lookup fails, return original (may be a User.id already)
  return profileOrUserId;
}

// =============================================================================
// Service Methods
// =============================================================================

export const portalNotificationService = {
  /**
   * Initialize with Socket.IO server for real-time delivery
   */
  initialize(socketIo: SocketIOServer): void {
    io = socketIo;
    apiLogger.info('[PortalNotificationService] Initialized with Socket.IO');
  },

  /**
   * Create a portal notification
   */
  async create(input: CreatePortalNotificationInput): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[input.type];
    if (!template) {
      apiLogger.error(`[PortalNotificationService] Unknown notification type: ${input.type}`);
      return;
    }

    // Resolve profile ID → User.id so notifications match the JWT userId
    const resolvedUserId = await resolveUserId(input.userId, input.portalType);

    // Build action URL based on entity type
    const actionUrl = buildActionUrl(input.portalType, input.entityType, input.entityId);

    // Calculate expiry date if applicable
    const expiresAt = template.expiresInHours
      ? new Date(Date.now() + template.expiresInHours * 60 * 60 * 1000)
      : null;

    // Build group key for similar notifications
    const groupKey = buildGroupKey(input.type, input.entityType);

    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: resolvedUserId,
          type: input.type,
          title: template.title,
          body: input.entityName || null,
          entityType: input.entityType,
          entityId: input.entityId,
          entityName: input.entityName || null,
          actorId: input.actorId || null,
          actorName: input.actorName || null,
          actorAvatar: input.actorAvatar || null,
          actionUrl,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          portalType: input.portalType,
          priority: template.priority,
          category: template.category,
          expiresAt,
          groupKey,
        },
      });

      apiLogger.debug(`[PortalNotificationService] Created notification ${notification.id} for user ${resolvedUserId}`);

      // Emit real-time notification via WebSocket
      if (io) {
        io.to(`user:${resolvedUserId}`).emit('portal-notification', {
          id: notification.id,
          type: input.type,
          title: template.title,
          body: input.entityName || null,
          entityType: input.entityType,
          entityId: input.entityId,
          entityName: input.entityName || null,
          actorId: input.actorId || null,
          actorName: input.actorName || null,
          priority: template.priority,
          category: template.category,
          portalType: input.portalType,
          actionUrl,
          read: false,
          createdAt: notification.createdAt.toISOString(),
        });
      }
    } catch (error) {
      apiLogger.error('[PortalNotificationService] Error creating notification:', error);
    }
  },

  /**
   * Get notifications for a user with portal filtering
   */
  async getForPortal(
    userId: string,
    portalType: PortalType,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      actionRequired?: boolean;
    } = {}
  ): Promise<NotificationRecord[]> {
    const { limit = 50, offset = 0, unreadOnly = false, actionRequired = false } = options;

    const where: Record<string, unknown> = {
      userId,
      portalType,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (actionRequired) {
      where.priority = { in: ['critical', 'high'] };
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Group similar notifications
    return groupNotifications(notifications);
  },

  /**
   * Get unread count for portal
   */
  async getUnreadCount(userId: string, portalType: PortalType): Promise<{
    total: number;
    actionRequired: number;
  }> {
    const baseWhere = {
      userId,
      portalType,
      read: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    const [total, actionRequired] = await Promise.all([
      prisma.notification.count({ where: baseWhere }),
      prisma.notification.count({
        where: {
          ...baseWhere,
          priority: { in: ['critical', 'high'] },
        },
      }),
    ]);

    return { total, actionRequired };
  },

  /**
   * Mark all portal notifications as read
   */
  async markAllAsRead(userId: string, portalType: PortalType): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        portalType,
        read: false,
      },
      data: { read: true },
    });
    return result.count;
  },

  /**
   * Clean up expired notifications (run via cron job)
   */
  async cleanupExpired(): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    apiLogger.info(`[PortalNotificationService] Cleaned up ${result.count} expired notifications`);
    return result.count;
  },
};

export default portalNotificationService;
