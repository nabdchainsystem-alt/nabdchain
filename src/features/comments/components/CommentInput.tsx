import React, { useState, useRef } from 'react';
import { PaperPlaneRight, Paperclip, Smiley, At } from 'phosphor-react';
import { featureLogger } from '@/utils/logger';

// =============================================================================
// COMMENT INPUT - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface CommentInputProps {
  onSubmit: (content: string, mentions: string[], attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  placeholder = 'Write a comment...',
  disabled = false,
  autoFocus = false,
}) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (content.trim() && !disabled) {
      // TODO: Parse @mentions from content
      const mentions: string[] = [];
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[2]); // User ID
      }

      onSubmit(content, mentions);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertAtMention = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const newContent = content.slice(0, start) + '@' + content.slice(start);
      setContent(newContent);
      // TODO: Trigger mention suggestions
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent(content + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      <div className="flex items-end gap-2 p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-stone-700 dark:text-stone-300 placeholder-stone-400 focus:outline-none min-h-[36px] max-h-[120px]"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              // TODO: Handle file attachments
              featureLogger.debug('[CommentInput] File attachment - NOT IMPLEMENTED', e.target.files);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <button
            onClick={insertAtMention}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
            title="Mention someone"
          >
            <At size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
              title="Add emoji"
            >
              <Smiley size={18} />
            </button>

            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-20">
                  <div className="grid grid-cols-6 gap-1">
                    {['👍', '❤️', '😄', '🎉', '😮', '😢', '👏', '🔥', '💯', '✅', '❌', '👀'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!content.trim() || disabled}
            className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 disabled:bg-stone-300 dark:disabled:bg-stone-600 rounded transition-colors"
          >
            <PaperPlaneRight size={18} />
          </button>
        </div>
      </div>

      <p className="mt-1 text-[10px] text-stone-400">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default CommentInput;
