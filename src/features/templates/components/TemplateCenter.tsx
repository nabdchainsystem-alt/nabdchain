import React from 'react';
import { Layout } from 'phosphor-react';

// =============================================================================
// TEMPLATE CENTER - PLACEHOLDER (Modal version)
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface TemplateCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateCenter: React.FC<TemplateCenterProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 text-center">
          <Layout size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-4" />
          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-2">
            Template Center
          </h2>
          <p className="text-stone-500 mb-6">
            Choose from 50+ templates to get started quickly
          </p>
          <p className="text-amber-600 dark:text-amber-400 text-sm">
            Coming Soon
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCenter;
