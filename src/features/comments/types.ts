// =============================================================================
// COMMENTS & MENTIONS TYPES
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  entityType: 'row' | 'board' | 'doc' | 'task';
  entityId: string;
  parentId?: string; // For threading
  replies?: Comment[];
  reactions: CommentReaction[];
  attachments: CommentAttachment[];
  mentions: Mention[];
  edited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  emoji: string; // e.g., '👍', '❤️', '🎉'
}

export interface CommentAttachment {
  id: string;
  commentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
}

export interface Mention {
  id: string;
  userId: string;
  userName: string;
  startIndex: number;
  endIndex: number;
}

export interface MentionSuggestion {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  type: 'user' | 'team' | 'channel';
}

// Notification created when someone is mentioned
export interface MentionNotification {
  id: string;
  userId: string;
  mentionedBy: string;
  mentionedByName: string;
  entityType: string;
  entityId: string;
  entityName: string;
  boardId?: string;
  boardName?: string;
  commentText: string;
  read: boolean;
  createdAt: Date;
}
