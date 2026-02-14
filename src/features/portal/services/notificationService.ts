// =============================================================================
// Portal Notification Service - Frontend API Client
// =============================================================================
// Uses portalApiClient for automatic portal JWT auth
// =============================================================================

import { portalApiClient } from './portalApiClient';
import { PortalNotification, NotificationCounts, PortalType } from '../types/notification.types';

// =============================================================================
// Notification Service
// =============================================================================

export const notificationService = {
  /**
   * Get notifications for portal
   */
  async getNotifications(
    portalType: PortalType,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      actionRequired?: boolean;
    } = {},
  ): Promise<PortalNotification[]> {
    const params = new URLSearchParams({ portalType });
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.unreadOnly) params.append('unreadOnly', 'true');
    if (options.actionRequired) params.append('actionRequired', 'true');

    return portalApiClient.get<PortalNotification[]>(`/api/notifications/portal?${params.toString()}`);
  },

  /**
   * Get unread count for portal
   */
  async getUnreadCount(portalType: PortalType): Promise<NotificationCounts> {
    const params = new URLSearchParams({ portalType });
    return portalApiClient.get<NotificationCounts>(`/api/notifications/portal/count?${params.toString()}`);
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await portalApiClient.patch(`/api/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read for portal
   */
  async markAllAsRead(portalType: PortalType): Promise<number> {
    const params = new URLSearchParams({ portalType });
    const data = await portalApiClient.patch<{ updatedCount: number }>(
      `/api/notifications/portal/read-all?${params.toString()}`,
    );
    return data.updatedCount;
  },
};

export default notificationService;
