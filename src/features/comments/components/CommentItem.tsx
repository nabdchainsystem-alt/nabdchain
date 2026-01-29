import React, { useState } from 'react';
import { DotsThree, PencilSimple, Trash, Smiley } from 'phosphor-react';
import type { Comment } from '../types';

// =============================================================================
// COMMENT ITEM - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onReact?: (commentId: string, emoji: string) => void;
  onReply?: (commentId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
  onReply,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = currentUserId === comment.authorId;

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit?.(comment.id, editContent);
    }
    setIsEditing(false);
  };

  return (
    <div className="group flex gap-3 py-2">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          comment.authorName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {comment.authorName}
            </span>
            <span className="text-xs text-stone-400">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
            {comment.edited && (
              <span className="text-xs text-stone-400 italic">(edited)</span>
            )}
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-all"
            >
              <DotsThree size={16} className="text-stone-500" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full px-3 py-1.5 text-sm text-left hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                      >
                        <PencilSimple size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => { onDelete?.(comment.id); setShowMenu(false); }}
                        className="w-full px-3 py-1.5 text-sm text-left hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 text-red-500"
                      >
                        <Trash size={14} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content or Edit */}
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                className="px-3 py-1 text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onReply?.(comment.id)}
              className="text-xs text-stone-500 hover:text-blue-500 transition-colors"
            >
              Reply
            </button>
            <button
              onClick={() => onReact?.(comment.id, '👍')}
              className="text-xs text-stone-500 hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <Smiley size={12} />
              React
            </button>
          </div>
        )}

        {/* Reactions */}
        {comment.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(
              comment.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(comment.id, emoji)}
                className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
