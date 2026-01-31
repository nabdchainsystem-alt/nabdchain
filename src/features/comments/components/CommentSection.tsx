import React, { useState } from 'react';
import { ChatCircle, Plus } from 'phosphor-react';
import type { Comment } from '../types';
import { featureLogger } from '@/utils/logger';

// =============================================================================
// COMMENT SECTION - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface CommentSectionProps {
  entityType: 'row' | 'board' | 'doc' | 'task';
  entityId: string;
  comments?: Comment[];
  onAddComment?: (content: string, mentions: string[]) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReact?: (commentId: string, emoji: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  entityType,
  entityId,
  comments = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReact,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (newComment.trim()) {
      // TODO: Parse mentions from content
      featureLogger.debug('[Comments] Add comment - NOT IMPLEMENTED', { content: newComment });
      onAddComment?.(newComment, []);
      setNewComment('');
    }
  };

  return (
    <div className="border-t border-stone-200 dark:border-stone-700">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChatCircle size={18} className="text-stone-500" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Comments
          </span>
          {comments.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        <span className="text-xs text-stone-400">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="py-6 text-center">
              <ChatCircle size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-sm text-stone-500">No comments yet</p>
              <p className="text-xs text-stone-400">Be the first to comment</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium">
                    {comment.authorName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {comment.authorName}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Comment Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment... (use @ to mention)"
              className="flex-1 px-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-stone-300 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              @mentions and reactions coming soon
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
