import React from 'react';
import { User, UsersThree, Hash } from 'phosphor-react';
import type { MentionSuggestion } from '../types';

// =============================================================================
// MENTION SUGGESTIONS - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface MentionSuggestionsProps {
  suggestions: MentionSuggestion[];
  selectedIndex: number;
  onSelect: (suggestion: MentionSuggestion) => void;
  isLoading?: boolean;
  query?: string;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  isLoading = false,
  query = '',
}) => {
  if (isLoading) {
    return (
      <div className="p-3 text-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 mt-2">Searching...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-3 text-center">
        <p className="text-sm text-stone-500">
          No users found {query && `for "${query}"`}
        </p>
      </div>
    );
  }

  const getIcon = (type: MentionSuggestion['type']) => {
    switch (type) {
      case 'team':
        return UsersThree;
      case 'channel':
        return Hash;
      default:
        return User;
    }
  };

  return (
    <div className="py-1">
      {suggestions.map((suggestion, index) => {
        const Icon = getIcon(suggestion.type);
        return (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
            className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              suggestion.type === 'user'
                ? 'bg-stone-200 dark:bg-stone-700'
                : suggestion.type === 'team'
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              {suggestion.avatar ? (
                <img
                  src={suggestion.avatar}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Icon
                  size={16}
                  className={
                    suggestion.type === 'user'
                      ? 'text-stone-500'
                      : suggestion.type === 'team'
                      ? 'text-blue-500'
                      : 'text-green-500'
                  }
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">
                {suggestion.name}
              </div>
              {suggestion.email && (
                <div className="text-xs text-stone-400 truncate">
                  {suggestion.email}
                </div>
              )}
            </div>

            {/* Type Badge */}
            {suggestion.type !== 'user' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                suggestion.type === 'team'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              }`}>
                {suggestion.type}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MentionSuggestions;
