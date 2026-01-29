import React, { useState, useRef, useEffect } from 'react';
import type { MentionSuggestion } from '../types';

// =============================================================================
// MENTION INPUT - PLACEHOLDER (Rich text input with @mentions)
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (userId: string) => void;
  suggestions?: MentionSuggestion[];
  onSearchUsers?: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMention,
  suggestions = [],
  onSearchUsers,
  placeholder = 'Type @ to mention someone...',
  disabled = false,
  className = '',
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Filter suggestions based on query
  const filteredSuggestions = suggestions.filter(
    (s) => s.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  useEffect(() => {
    // Check if we're in a mention context (after @)
    const beforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowSuggestions(true);
      onSearchUsers?.(mentionMatch[1]);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  }, [value, cursorPosition, onSearchUsers]);

  const handleSelect = (suggestion: MentionSuggestion) => {
    // Replace @query with @[Name](id)
    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const mentionStart = beforeCursor.lastIndexOf('@');

    const newValue =
      beforeCursor.slice(0, mentionStart) +
      `@[${suggestion.name}](${suggestion.id}) ` +
      afterCursor;

    onChange(newValue);
    onMention?.(suggestion.id);
    setShowSuggestions(false);
    setSelectedIndex(0);

    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? filteredSuggestions.length - 1 : prev - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        handleSelect(filteredSuggestions[selectedIndex]);
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Render content with highlighted mentions
  const renderPreview = () => {
    return value.replace(
      /@\[([^\]]+)\]\(([^)]+)\)/g,
      '<span class="text-blue-500 font-medium">@$1</span>'
    );
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart);
        }}
        onKeyDown={handleKeyDown}
        onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-sm resize-none"
        rows={3}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-10 max-h-[200px] overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className={`w-full px-3 py-2 flex items-center gap-2 text-left ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium">
                {suggestion.avatar ? (
                  <img src={suggestion.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  suggestion.name.charAt(0)
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {suggestion.name}
                </div>
                {suggestion.email && (
                  <div className="text-xs text-stone-400">{suggestion.email}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Preview (optional) */}
      {value && value.includes('@[') && (
        <div
          className="mt-2 p-2 bg-stone-50 dark:bg-stone-800 rounded text-sm"
          dangerouslySetInnerHTML={{ __html: renderPreview() }}
        />
      )}
    </div>
  );
};

export default MentionInput;
