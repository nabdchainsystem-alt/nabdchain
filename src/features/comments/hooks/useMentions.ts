import { useState, useCallback } from 'react';
import type { MentionSuggestion, MentionNotification } from '../types';
import { hookLogger } from '@/utils/logger';

// =============================================================================
// USE MENTIONS HOOK - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface UseMentionsOptions {
  workspaceId?: string;
  boardId?: string;
}

interface UseMentionsReturn {
  suggestions: MentionSuggestion[];
  isSearching: boolean;
  notifications: MentionNotification[];
  unreadCount: number;
  searchUsers: (query: string) => Promise<MentionSuggestion[]>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useMentions = (options: UseMentionsOptions = {}): UseMentionsReturn => {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<MentionNotification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const searchUsers = useCallback(
    async (query: string): Promise<MentionSuggestion[]> => {
      setIsSearching(true);

      try {
        // TODO: Implement API call
        hookLogger.debug('[useMentions] Search users - NOT IMPLEMENTED', { query, ...options });

        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Return mock suggestions
        const mockSuggestions: MentionSuggestion[] = [
          { id: 'user-1', name: 'John Doe', email: 'john@example.com', type: 'user' as const },
          { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', type: 'user' as const },
          { id: 'team-1', name: 'Engineering Team', type: 'team' as const },
          { id: 'team-2', name: 'Design Team', type: 'team' as const },
        ].filter(
          (s) =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.email?.toLowerCase().includes(query.toLowerCase())
        );

        setSuggestions(mockSuggestions);
        return mockSuggestions;
      } finally {
        setIsSearching(false);
      }
    },
    [options]
  );

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    // TODO: Implement API call
    hookLogger.debug('[useMentions] Mark as read - NOT IMPLEMENTED', notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    // TODO: Implement API call
    hookLogger.debug('[useMentions] Mark all as read - NOT IMPLEMENTED');

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    // TODO: Implement API call
    hookLogger.debug('[useMentions] Refresh notifications - NOT IMPLEMENTED', options);

    // Simulate fetching
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [options]);

  return {
    suggestions,
    isSearching,
    notifications,
    unreadCount,
    searchUsers,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
};

export default useMentions;
