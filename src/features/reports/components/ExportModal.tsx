import React, { useState } from 'react';
import { X, Export, FileXls, FilePdf, FileCsv, FileJs, Check } from 'phosphor-react';
import type { ExportFormat, ExportOptions } from '../types';

// =============================================================================
// EXPORT MODAL - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  boardName?: string;
  isExporting?: boolean;
}

const FORMATS: { value: ExportFormat; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'excel', label: 'Excel (.xlsx)', icon: FileXls, description: 'Best for spreadsheet editing' },
  { value: 'pdf', label: 'PDF', icon: FilePdf, description: 'Best for sharing and printing' },
  { value: 'csv', label: 'CSV', icon: FileCsv, description: 'Best for data import/export' },
  { value: 'json', label: 'JSON', icon: FileJs, description: 'Best for developers' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  boardName = 'Board',
  isExporting = false,
}) => {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [includeComments, setIncludeComments] = useState(false);
  const [includeActivity, setIncludeActivity] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    onExport({
      format,
      scope: 'board',
      includeComments,
      includeActivity,
      includeAttachments,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Export size={20} />
            Export "{boardName}"
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    format === f.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  <f.icon
                    size={24}
                    className={format === f.value ? 'text-emerald-600' : 'text-stone-400'}
                  />
                  <div>
                    <div className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {f.label}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {f.description}
                    </div>
                  </div>
                  {format === f.value && (
                    <Check size={16} className="ml-auto text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Include
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-stone-600 dark:text-stone-400">Comments</span>
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeActivity}
                  onChange={(e) => setIncludeActivity(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-stone-600 dark:text-stone-400">Activity log</span>
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-stone-600 dark:text-stone-400">Attachments (zip)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-300 text-white rounded-lg"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Export size={16} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
