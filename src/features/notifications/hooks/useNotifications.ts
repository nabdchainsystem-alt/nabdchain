import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { Notification, NotificationPreferences } from '../types';
import { hookLogger } from '@/utils/logger';

// =============================================================================
// USE NOTIFICATIONS HOOK
// Status: IMPLEMENTED - Connected to backend API
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  preferences: NotificationPreferences | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  fetchPreferences: () => Promise<void>;
}

export const useNotifications = (
  options: UseNotificationsOptions = {}
): UseNotificationsReturn => {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Helper for authenticated fetch
  const fetchWithAuth = useCallback(async (url: string, fetchOptions?: RequestInit) => {
    const token = await getToken();
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...fetchOptions?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, [getToken]);

  // Fetch notifications
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth(`${API_BASE}/api/notifications`);

      // Transform dates from strings to Date objects
      const transformed: Notification[] = data.map((n: Notification & { createdAt: string }) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));

      setNotifications(transformed);
      hookLogger.debug('[useNotifications] Fetched notifications', { count: transformed.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
      hookLogger.error('[useNotifications] Fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await fetchWithAuth(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      hookLogger.debug('[useNotifications] Marked as read', { id });
    } catch (err) {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
      hookLogger.error('[useNotifications] Mark as read failed', err);
      throw err;
    }
  }, [fetchWithAuth]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    // Store previous state for rollback
    const previousNotifications = notifications;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const result = await fetchWithAuth(`${API_BASE}/api/notifications/read-all`, {
        method: 'PATCH',
      });
      hookLogger.info('[useNotifications] Marked all as read', { count: result.updatedCount });
    } catch (err) {
      // Revert on error
      setNotifications(previousNotifications);
      hookLogger.error('[useNotifications] Mark all as read failed', err);
      throw err;
    }
  }, [fetchWithAuth, notifications]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    // Store for rollback
    const previousNotifications = notifications;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await fetchWithAuth(`${API_BASE}/api/notifications/${id}`, {
        method: 'DELETE',
      });
      hookLogger.debug('[useNotifications] Deleted notification', { id });
    } catch (err) {
      // Revert on error
      setNotifications(previousNotifications);
      hookLogger.error('[useNotifications] Delete failed', err);
      throw err;
    }
  }, [fetchWithAuth, notifications]);

  // Fetch preferences
  const fetchPreferences = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/api/notifications/preferences`);
      setPreferences(data);
      hookLogger.debug('[useNotifications] Fetched preferences');
    } catch (err) {
      hookLogger.error('[useNotifications] Fetch preferences failed', err);
    }
  }, [fetchWithAuth]);

  // Update preferences
  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>): Promise<void> => {
      // Store previous state for rollback
      const previousPreferences = preferences;

      // Optimistic update
      setPreferences((prev) => prev ? { ...prev, ...prefs } : null);

      try {
        const updated = await fetchWithAuth(`${API_BASE}/api/notifications/preferences`, {
          method: 'PATCH',
          body: JSON.stringify(prefs),
        });
        setPreferences(updated);
        hookLogger.info('[useNotifications] Updated preferences');
      } catch (err) {
        // Revert on error
        setPreferences(previousPreferences);
        hookLogger.error('[useNotifications] Update preferences failed', err);
        throw err;
      }
    },
    [fetchWithAuth, preferences]
  );

  // Initial fetch
  useEffect(() => {
    refresh();
    fetchPreferences();
  }, [refresh, fetchPreferences]);

  // Auto-refresh
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(refresh, options.refreshInterval || 60000);
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval, refresh]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    updatePreferences,
    fetchPreferences,
  };
};

export default useNotifications;
