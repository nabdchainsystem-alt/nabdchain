// =============================================================================
// Portal Notification Service - Frontend API Client
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  PortalNotification,
  NotificationCounts,
  PortalType,
} from '../types/notification.types';

// =============================================================================
// Notification Service
// =============================================================================

export const notificationService = {
  /**
   * Get notifications for portal
   */
  async getNotifications(
    token: string,
    portalType: PortalType,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      actionRequired?: boolean;
    } = {}
  ): Promise<PortalNotification[]> {
    const url = new URL(`${API_URL}/notifications/portal`);
    url.searchParams.append('portalType', portalType);
    if (options.limit) url.searchParams.append('limit', options.limit.toString());
    if (options.offset) url.searchParams.append('offset', options.offset.toString());
    if (options.unreadOnly) url.searchParams.append('unreadOnly', 'true');
    if (options.actionRequired) url.searchParams.append('actionRequired', 'true');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  },

  /**
   * Get unread count for portal
   */
  async getUnreadCount(
    token: string,
    portalType: PortalType
  ): Promise<NotificationCounts> {
    const url = new URL(`${API_URL}/notifications/portal/count`);
    url.searchParams.append('portalType', portalType);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification count');
    }

    return response.json();
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(token: string, notificationId: string): Promise<void> {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  },

  /**
   * Mark all notifications as read for portal
   */
  async markAllAsRead(
    token: string,
    portalType: PortalType
  ): Promise<number> {
    const url = new URL(`${API_URL}/notifications/portal/read-all`);
    url.searchParams.append('portalType', portalType);

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    const data = await response.json();
    return data.updatedCount;
  },
};

export default notificationService;
