import React from 'react';
import type { Comment } from '../types';

// =============================================================================
// COMMENT THREAD - PLACEHOLDER (For threaded/nested comments)
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface CommentThreadProps {
  comment: Comment;
  onReply?: (content: string, parentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onReact?: (commentId: string, emoji: string) => void;
  depth?: number;
  maxDepth?: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onReact,
  depth = 0,
  maxDepth = 3,
}) => {
  const canNest = depth < maxDepth;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-stone-200 dark:border-stone-700 pl-4' : ''}`}>
      {/* Comment */}
      <div className="py-2">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
            {comment.authorAvatar ? (
              <img src={comment.authorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              comment.authorName.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {comment.authorName}
              </span>
              <span className="text-xs text-stone-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
              {comment.edited && (
                <span className="text-xs text-stone-400">(edited)</span>
              )}
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 break-words">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              {canNest && (
                <button
                  onClick={() => onReply?.(comment.id, comment.id)}
                  className="text-xs text-stone-500 hover:text-blue-500"
                >
                  Reply
                </button>
              )}
              <button
                onClick={() => onReact?.(comment.id, '👍')}
                className="text-xs text-stone-500 hover:text-blue-500"
              >
                React
              </button>
              <button
                onClick={() => onEdit?.(comment.id, comment.content)}
                className="text-xs text-stone-500 hover:text-blue-500"
              >
                Edit
              </button>
            </div>

            {/* Reactions */}
            {comment.reactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {/* Group reactions by emoji */}
                {['👍', '❤️', '🎉', '😄', '😮', '😢'].map((emoji) => {
                  const count = comment.reactions.filter((r) => r.emoji === emoji).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact?.(comment.id, emoji)}
                      className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700"
                    >
                      {emoji} {count}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
