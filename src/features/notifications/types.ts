// =============================================================================
// NOTIFICATIONS TYPES
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export type NotificationType =
  | 'mention'
  | 'assignment'
  | 'comment'
  | 'status_change'
  | 'due_date_reminder'
  | 'due_date_overdue'
  | 'task_completed'
  | 'board_shared'
  | 'invite'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: 'board' | 'task' | 'comment' | 'workspace';
  entityId?: string;
  entityName?: string;
  boardId?: string;
  boardName?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  read: boolean;
  emailSent: boolean;
  pushSent: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  // Email notifications
  emailEnabled: boolean;
  emailMentions: boolean;
  emailAssignments: boolean;
  emailComments: boolean;
  emailDueDates: boolean;
  emailStatusChanges: boolean;
  emailDigest: 'none' | 'daily' | 'weekly';
  // Push notifications
  pushEnabled: boolean;
  pushMentions: boolean;
  pushAssignments: boolean;
  pushComments: boolean;
  pushDueDates: boolean;
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "08:00"
  quietHoursTimezone: string;
}

export interface NotificationGroup {
  date: string;
  notifications: Notification[];
}
