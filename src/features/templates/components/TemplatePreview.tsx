import React from 'react';
import { X, Star, Users, Layout, Table, Kanban, Calendar } from 'phosphor-react';
import type { Template } from '../types';

// =============================================================================
// TEMPLATE PREVIEW - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface TemplatePreviewProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  isOpen,
  onClose,
  onUse,
}) => {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
            {template.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Preview Image */}
          <div className="h-64 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center mb-6">
            {template.thumbnail ? (
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Layout size={64} className="text-indigo-400 dark:text-indigo-500" />
            )}
          </div>

          {/* Description */}
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            {template.description || 'No description available.'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mb-6">
            {template.rating && (
              <div className="flex items-center gap-2">
                <Star size={20} weight="fill" className="text-amber-400" />
                <span className="text-stone-800 dark:text-stone-200 font-medium">
                  {template.rating}
                </span>
                <span className="text-stone-500">rating</span>
              </div>
            )}
            {template.usageCount && (
              <div className="flex items-center gap-2">
                <Users size={20} className="text-stone-400" />
                <span className="text-stone-800 dark:text-stone-200 font-medium">
                  {template.usageCount.toLocaleString()}
                </span>
                <span className="text-stone-500">uses</span>
              </div>
            )}
          </div>

          {/* Included Views */}
          <div className="mb-6">
            <h3 className="font-medium text-stone-800 dark:text-stone-200 mb-3">
              Included Views
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Table', 'Kanban', 'Calendar'].map((view) => (
                <span
                  key={view}
                  className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm"
                >
                  {view === 'Table' && <Table size={14} />}
                  {view === 'Kanban' && <Kanban size={14} />}
                  {view === 'Calendar' && <Calendar size={14} />}
                  {view}
                </span>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div className="mb-6">
            <h3 className="font-medium text-stone-800 dark:text-stone-200 mb-3">
              Columns
            </h3>
            <div className="flex flex-wrap gap-2">
              {template.content?.columns?.map((col, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-xs text-stone-600 dark:text-stone-400"
                >
                  {col.name}
                </span>
              )) || (
                <span className="text-sm text-stone-500">
                  Columns will be configured when you use this template
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {template.tags?.length > 0 && (
            <div>
              <h3 className="font-medium text-stone-800 dark:text-stone-200 mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onUse}
            className="px-6 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
          >
            Use This Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
