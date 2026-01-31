import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { Comment, CommentReaction } from '../types';
import { hookLogger } from '@/utils/logger';

// =============================================================================
// USE COMMENTS HOOK
// Connects to the Comments API for full CRUD operations
// =============================================================================

interface UseCommentsOptions {
  entityType: 'row' | 'board' | 'doc' | 'task';
  entityId: string;
  autoFetch?: boolean;
}

interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  addComment: (content: string, mentions?: string[], parentId?: string) => Promise<Comment>;
  editComment: (commentId: string, content: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;
  addReaction: (commentId: string, emoji: string) => Promise<void>;
  removeReaction: (commentId: string, emoji: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const API_BASE = '/api/comments';

export const useComments = (options: UseCommentsOptions): UseCommentsReturn => {
  const { entityType, entityId, autoFetch = true } = options;
  const { getToken } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to make authenticated API calls
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
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, [getToken]);

  // Fetch comments from API
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        entityType,
        entityId,
      });

      const data = await fetchWithAuth(`${API_BASE}?${params}`);

      // Transform dates from strings to Date objects
      const transformedComments = (data || []).map((comment: Comment) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
        updatedAt: new Date(comment.updatedAt),
        editedAt: comment.editedAt ? new Date(comment.editedAt) : undefined,
        replies: comment.replies?.map((reply: Comment) => ({
          ...reply,
          createdAt: new Date(reply.createdAt),
          updatedAt: new Date(reply.updatedAt),
          editedAt: reply.editedAt ? new Date(reply.editedAt) : undefined,
        })),
      }));

      setComments(transformedComments);
      hookLogger.debug('[useComments] Fetched comments', { entityType, entityId, count: data?.length || 0 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load comments';
      setError(message);
      hookLogger.error('[useComments] Error fetching comments', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, fetchWithAuth]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && entityId) {
      refresh();
    }
  }, [autoFetch, entityId, refresh]);

  // Add a new comment
  const addComment = useCallback(
    async (content: string, mentions: string[] = [], parentId?: string): Promise<Comment> => {
      try {
        const data = await fetchWithAuth(API_BASE, {
          method: 'POST',
          body: JSON.stringify({
            entityType,
            entityId,
            content,
            mentions,
            parentId: parentId || null,
          }),
        });

        const newComment: Comment = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };

        // Update local state
        if (parentId) {
          // Add as a reply to parent comment
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies || []), newComment] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, newComment]);
        }

        hookLogger.info('[useComments] Added comment', { commentId: newComment.id });
        return newComment;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add comment';
        hookLogger.error('[useComments] Error adding comment', { error: err });
        throw new Error(message);
      }
    },
    [entityType, entityId, fetchWithAuth]
  );

  // Edit an existing comment
  const editComment = useCallback(
    async (commentId: string, content: string): Promise<Comment> => {
      try {
        const data = await fetchWithAuth(`${API_BASE}/${commentId}`, {
          method: 'PATCH',
          body: JSON.stringify({ content }),
        });

        const updatedComment: Comment = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          editedAt: data.editedAt ? new Date(data.editedAt) : undefined,
        };

        // Update local state
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return updatedComment;
            }
            // Check replies
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId ? updatedComment : r
                ),
              };
            }
            return c;
          })
        );

        hookLogger.info('[useComments] Edited comment', { commentId });
        return updatedComment;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to edit comment';
        hookLogger.error('[useComments] Error editing comment', { error: err });
        throw new Error(message);
      }
    },
    [fetchWithAuth]
  );

  // Delete a comment
  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      try {
        await fetchWithAuth(`${API_BASE}/${commentId}`, {
          method: 'DELETE',
        });

        // Update local state
        setComments((prev) =>
          prev
            .filter((c) => c.id !== commentId)
            .map((c) => ({
              ...c,
              replies: c.replies?.filter((r) => r.id !== commentId),
            }))
        );

        hookLogger.info('[useComments] Deleted comment', { commentId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete comment';
        hookLogger.error('[useComments] Error deleting comment', { error: err });
        throw new Error(message);
      }
    },
    [fetchWithAuth]
  );

  // Add a reaction to a comment
  const addReaction = useCallback(
    async (commentId: string, emoji: string): Promise<void> => {
      try {
        const data = await fetchWithAuth(`${API_BASE}/${commentId}/reactions`, {
          method: 'POST',
          body: JSON.stringify({ emoji }),
        });

        const newReaction: CommentReaction = {
          id: data.id,
          commentId,
          userId: data.userId,
          emoji,
        };

        // Update local state
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return { ...c, reactions: [...c.reactions, newReaction] };
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId
                    ? { ...r, reactions: [...r.reactions, newReaction] }
                    : r
                ),
              };
            }
            return c;
          })
        );

        hookLogger.debug('[useComments] Added reaction', { commentId, emoji });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add reaction';
        hookLogger.error('[useComments] Error adding reaction', { error: err });
        throw new Error(message);
      }
    },
    [fetchWithAuth]
  );

  // Remove a reaction from a comment
  const removeReaction = useCallback(
    async (commentId: string, emoji: string): Promise<void> => {
      try {
        await fetchWithAuth(
          `${API_BASE}/${commentId}/reactions/${encodeURIComponent(emoji)}`,
          { method: 'DELETE' }
        );

        // Update local state - remove reactions with matching emoji from current user
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                reactions: c.reactions.filter((r) => r.emoji !== emoji),
              };
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId
                    ? { ...r, reactions: r.reactions.filter((rx) => rx.emoji !== emoji) }
                    : r
                ),
              };
            }
            return c;
          })
        );

        hookLogger.debug('[useComments] Removed reaction', { commentId, emoji });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove reaction';
        hookLogger.error('[useComments] Error removing reaction', { error: err });
        throw new Error(message);
      }
    },
    [fetchWithAuth]
  );

  return {
    comments,
    isLoading,
    error,
    addComment,
    editComment,
    deleteComment,
    addReaction,
    removeReaction,
    refresh,
  };
};

export default useComments;
