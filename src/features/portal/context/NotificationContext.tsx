import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { notificationService } from '../services/notificationService';
import { useToast } from '../components/Toast';
import { PortalNotification, NotificationCounts, PortalType } from '../types/notification.types';

// =============================================================================
// Context Types
// =============================================================================

interface NotificationContextType {
  notifications: PortalNotification[];
  counts: NotificationCounts;
  isLoading: boolean;
  error: string | null;
  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  // Panel state
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  activeTab: 'all' | 'action';
  setActiveTab: (tab: 'all' | 'action') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// =============================================================================
// Hook
// =============================================================================

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// =============================================================================
// Provider
// =============================================================================

interface NotificationProviderProps {
  children: ReactNode;
  portalType: PortalType;
  onNavigate?: (page: string, data?: Record<string, unknown>) => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, portalType, onNavigate }) => {
  const { socket, isConnected } = useSocket();
  const userId = localStorage.getItem('portal_user_id');
  const toast = useToast();

  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({ total: 0, actionRequired: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'action'>('all');

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialFetchDoneRef = useRef(false);

  // Fetch notifications from API
  const refreshNotifications = useCallback(async () => {
    try {
      const [notifs, newCounts] = await Promise.all([
        notificationService.getNotifications(portalType, { limit: 50 }),
        notificationService.getUnreadCount(portalType),
      ]);

      setNotifications(notifs);
      setCounts(newCounts);
      setError(null);
    } catch (err) {
      console.error('[NotificationContext] Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [portalType]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.markAsRead(notificationId);

        // Optimistic update
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));

        // Update counts
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification && !notification.read) {
          setCounts((prev) => ({
            total: Math.max(0, prev.total - 1),
            actionRequired:
              notification.priority === 'critical' || notification.priority === 'high'
                ? Math.max(0, prev.actionRequired - 1)
                : prev.actionRequired,
          }));
        }
      } catch (err) {
        console.error('[NotificationContext] Error marking as read:', err);
      }
    },
    [notifications],
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead(portalType);

      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setCounts({ total: 0, actionRequired: 0 });
    } catch (err) {
      console.error('[NotificationContext] Error marking all as read:', err);
    }
  }, [portalType]);

  // Handle real-time notification from WebSocket
  const handleNewNotification = useCallback(
    (notification: PortalNotification) => {
      // Only process notifications for this portal type
      if (notification.portalType !== portalType) return;

      // Add to state (prepend)
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) return prev;
        return [notification, ...prev].slice(0, 50);
      });

      // Update counts
      setCounts((prev) => ({
        total: prev.total + 1,
        actionRequired:
          notification.priority === 'critical' || notification.priority === 'high'
            ? prev.actionRequired + 1
            : prev.actionRequired,
      }));

      // Show toast for critical notifications only
      if (notification.priority === 'critical' && toast) {
        const entityType = notification.entityType || notification.category;
        const pageMap: Record<string, string> = {
          rfq: portalType === 'buyer' ? 'my-rfqs' : 'rfqs',
          order: 'orders',
          invoice: 'invoices',
          dispute: 'disputes',
          payout: 'payouts',
        };
        const targetPage = entityType ? pageMap[entityType] : null;

        toast.addToast({
          type: 'warning',
          title: notification.title,
          message: notification.body || undefined,
          duration: 8000,
          action:
            targetPage && onNavigate
              ? {
                  label: 'View',
                  onClick: () => {
                    onNavigate(targetPage);
                  },
                }
              : undefined,
        });
      }
    },
    [portalType, toast, onNavigate],
  );

  // Set up WebSocket listener
  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    // Join user room for notifications
    socket.emit('join-user-room', { userId });

    // Listen for portal notifications
    socket.on('portal-notification', handleNewNotification);

    return () => {
      socket.emit('leave-user-room', { userId });
      socket.off('portal-notification', handleNewNotification);
    };
  }, [socket, isConnected, userId, handleNewNotification]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      refreshNotifications();
    }
  }, [refreshNotifications]);

  // Polling fallback (every 60 seconds when WebSocket disconnected)
  useEffect(() => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Only poll if not connected via WebSocket
    if (!isConnected) {
      pollingIntervalRef.current = setInterval(() => {
        refreshNotifications();
      }, 60000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected, refreshNotifications]);

  // Refresh when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      refreshNotifications();
    }
  }, [isPanelOpen, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        counts,
        isLoading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        isPanelOpen,
        setPanelOpen,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
