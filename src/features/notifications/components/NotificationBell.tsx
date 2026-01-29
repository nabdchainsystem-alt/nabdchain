import React from 'react';
import { Bell } from 'phosphor-react';

// =============================================================================
// NOTIFICATION BELL - PLACEHOLDER (Header icon with badge)
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface NotificationBellProps {
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount = 0,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors ${className}`}
      title="Notifications"
    >
      <Bell size={20} className="text-stone-600 dark:text-stone-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
