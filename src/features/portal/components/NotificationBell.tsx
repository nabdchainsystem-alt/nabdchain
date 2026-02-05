import React, { useRef, useEffect, useCallback } from 'react';
import {
  Bell,
  CaretRight,
  FileText,
  Package,
  Receipt,
  ShieldWarning,
  CurrencyDollar,
} from 'phosphor-react';
import { usePortal } from '../context/PortalContext';
import { useNotifications } from '../context/NotificationContext';
import {
  PortalNotification,
  NotificationCategory,
  PRIORITY_COLORS,
} from '../types/notification.types';

// =============================================================================
// Icon Mapping
// =============================================================================

const CategoryIcons: Record<NotificationCategory | string, React.ElementType> = {
  rfq: FileText,
  order: Package,
  invoice: Receipt,
  dispute: ShieldWarning,
  payout: CurrencyDollar,
  system: Bell,
};

// =============================================================================
// Time Formatting (relative)
// =============================================================================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// =============================================================================
// NotificationBell Component
// =============================================================================

export const NotificationBell: React.FC = () => {
  const { styles, direction } = usePortal();
  const {
    notifications,
    counts,
    isLoading,
    isPanelOpen,
    setPanelOpen,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPanelOpen &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanelOpen, setPanelOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPanelOpen) {
        setPanelOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPanelOpen, setPanelOpen]);

  // Filter notifications based on active tab
  const filteredNotifications =
    activeTab === 'action'
      ? notifications.filter(
          n => !n.read && (n.priority === 'critical' || n.priority === 'high')
        )
      : notifications;

  const handleNotificationClick = useCallback(async (notification: PortalNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      // Navigate within the app by updating the URL
      window.location.href = notification.actionUrl;
    }
    setPanelOpen(false);
  }, [markAsRead, setPanelOpen]);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setPanelOpen(!isPanelOpen)}
        className="relative p-2 rounded-lg transition-all duration-100"
        style={{ color: styles.textSecondary }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = styles.bgHover)}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        aria-label={`Notifications${counts.total > 0 ? ` (${counts.total} unread)` : ''}`}
      >
        <Bell size={20} weight={isPanelOpen ? 'fill' : 'regular'} />

        {/* Badge */}
        {counts.total > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{
              backgroundColor: counts.actionRequired > 0 ? '#EF4444' : '#3B82F6',
              color: 'white',
            }}
          >
            {counts.total > 99 ? '99+' : counts.total}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isPanelOpen && (
        <div
          ref={panelRef}
          className="absolute top-full mt-2 z-50 rounded-xl border shadow-lg overflow-hidden"
          style={{
            backgroundColor: styles.bgCard,
            borderColor: styles.border,
            width: 360,
            maxHeight: 480,
            [direction === 'rtl' ? 'left' : 'right']: 0,
            animation: 'notificationSlideDown 100ms ease-out',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: styles.border }}
          >
            <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
              Notifications
            </h3>
            {counts.total > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium hover:underline"
                style={{ color: styles.info }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: styles.border }}>
            <button
              onClick={() => setActiveTab('all')}
              className="flex-1 px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: activeTab === 'all' ? styles.info : styles.textMuted,
                borderBottom:
                  activeTab === 'all'
                    ? `2px solid ${styles.info}`
                    : '2px solid transparent',
              }}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('action')}
              className="flex-1 px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: activeTab === 'action' ? styles.info : styles.textMuted,
                borderBottom:
                  activeTab === 'action'
                    ? `2px solid ${styles.info}`
                    : '2px solid transparent',
              }}
            >
              Action Required
              {counts.actionRequired > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full"
                  style={{ backgroundColor: '#EF4444', color: 'white' }}
                >
                  {counts.actionRequired}
                </span>
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-pulse flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: styles.bgSecondary }}
                      />
                      <div className="flex-1">
                        <div
                          className="h-3 rounded"
                          style={{ backgroundColor: styles.bgSecondary, width: '70%' }}
                        />
                        <div
                          className="h-2 mt-2 rounded"
                          style={{ backgroundColor: styles.bgSecondary, width: '40%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} style={{ color: styles.textMuted }} className="mx-auto mb-2" />
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  {activeTab === 'action' ? 'No action required' : 'No notifications'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes notificationSlideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// =============================================================================
// NotificationItem Component
// =============================================================================

interface NotificationItemProps {
  notification: PortalNotification;
  onClick: () => void;
}

const NotificationItem = React.memo<NotificationItemProps>(({ notification, onClick }) => {
  const { styles } = usePortal();
  const category = (notification.category || 'system') as NotificationCategory;
  const Icon = CategoryIcons[category] || Bell;
  const priorityColors = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.normal;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
      style={{
        backgroundColor: notification.read ? 'transparent' : `${styles.bgSecondary}40`,
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = styles.bgHover)}
      onMouseLeave={e =>
        (e.currentTarget.style.backgroundColor = notification.read
          ? 'transparent'
          : `${styles.bgSecondary}40`)
      }
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: priorityColors.bg }}
      >
        <Icon size={16} style={{ color: priorityColors.text }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-sm font-medium truncate"
            style={{ color: styles.textPrimary }}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span
              className="flex-shrink-0 w-2 h-2 rounded-full"
              style={{ backgroundColor: priorityColors.dot }}
            />
          )}
        </div>
        {notification.body && (
          <p className="text-xs mt-0.5 truncate" style={{ color: styles.textMuted }}>
            {notification.body}
          </p>
        )}
        <p className="text-[10px] mt-1" style={{ color: styles.textMuted }}>
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Arrow */}
      <CaretRight
        size={14}
        style={{ color: styles.textMuted }}
        className="flex-shrink-0 mt-1"
      />
    </button>
  );
}, (prev, next) =>
  prev.notification.id === next.notification.id &&
  prev.notification.read === next.notification.read
);

export default NotificationBell;
