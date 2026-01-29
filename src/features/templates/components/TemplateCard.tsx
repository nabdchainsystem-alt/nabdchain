import React from 'react';
import { Layout, Star, Users } from 'phosphor-react';
import type { Template } from '../types';

// =============================================================================
// TEMPLATE CARD - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface TemplateCardProps {
  template: Partial<Template>;
  onSelect?: () => void;
  onPreview?: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Thumbnail */}
      <div
        onClick={onPreview}
        className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center cursor-pointer relative"
      >
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Layout size={48} className="text-indigo-400 dark:text-indigo-500" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-opacity">
            Preview
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-stone-800 dark:text-stone-200">
          {template.name}
        </h3>
        <p className="text-sm text-stone-500 mt-1 line-clamp-2">
          {template.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3 text-xs text-stone-500">
          {template.rating && (
            <span className="flex items-center gap-1">
              <Star size={12} weight="fill" className="text-amber-400" />
              {template.rating}
            </span>
          )}
          {template.usageCount && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {template.usageCount.toLocaleString()}
            </span>
          )}
        </div>

        {/* Use Button */}
        <button
          onClick={onSelect}
          className="w-full mt-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          Use Template
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;
