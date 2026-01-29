import React, { useState } from 'react';
import {
  Bell, Check, CheckCircle, Trash, Gear, X,
  At, UserCircle, ChatCircle, Calendar, Warning
} from 'phosphor-react';
import type { Notification, NotificationType } from '../types';

// =============================================================================
// NOTIFICATION CENTER - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'mention':
      return At;
    case 'assignment':
      return UserCircle;
    case 'comment':
      return ChatCircle;
    case 'due_date_reminder':
    case 'due_date_overdue':
      return Calendar;
    case 'task_completed':
      return CheckCircle;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'mention':
      return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    case 'assignment':
      return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
    case 'comment':
      return 'text-green-500 bg-green-100 dark:bg-green-900/30';
    case 'due_date_overdue':
      return 'text-red-500 bg-red-100 dark:bg-red-900/30';
    case 'due_date_reminder':
      return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
    case 'task_completed':
      return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
    default:
      return 'text-stone-500 bg-stone-100 dark:bg-stone-800';
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-4 top-16 w-96 max-h-[80vh] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl z-50 flex flex-col animate-in slide-in-from-top-2 fade-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-stone-600 dark:text-stone-400" />
            <h3 className="font-semibold text-stone-800 dark:text-stone-200">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title="Mark all as read"
            >
              <Check size={18} className="text-stone-500" />
            </button>
            <button
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title="Settings"
            >
              <Gear size={18} className="text-stone-500" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <X size={18} className="text-stone-500" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-stone-200 dark:border-stone-700 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
              <p className="text-stone-500">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    onClick={() => {
                      onNotificationClick?.(notification);
                      if (!notification.read) onMarkAsRead?.(notification.id);
                    }}
                    className={`px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-700 dark:text-stone-300">
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-xs text-stone-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
          <p className="text-xs text-center text-stone-400">
            Notification center - Feature coming soon
          </p>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
