import React from 'react';
import { X, Check, Bell, At, UserCircle, ChatCircle, Calendar, CheckCircle } from 'phosphor-react';
import type { Notification, NotificationType } from '../types';

// =============================================================================
// NOTIFICATION ITEM - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

const getIcon = (type: NotificationType) => {
  const icons = {
    mention: At,
    assignment: UserCircle,
    comment: ChatCircle,
    due_date_reminder: Calendar,
    due_date_overdue: Calendar,
    task_completed: CheckCircle,
    status_change: Bell,
    board_shared: Bell,
    invite: Bell,
    system: Bell,
  };
  return icons[type] || Bell;
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) => {
  const Icon = getIcon(notification.type);

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        notification.read
          ? 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
          : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
      }`}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-stone-500" />
      </div>

      {/* Content */}
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

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!notification.read && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkAsRead?.(); }}
            className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
            title="Mark as read"
          >
            <Check size={14} className="text-stone-500" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
          title="Delete"
        >
          <X size={14} className="text-stone-500" />
        </button>
      </div>

      {/* Unread Indicator */}
      {!notification.read && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
      )}
    </div>
  );
};

export default NotificationItem;
