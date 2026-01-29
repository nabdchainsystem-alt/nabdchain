import React from 'react';
import { ChartBar, Export, Printer, Share } from 'phosphor-react';
import type { Report } from '../types';

// =============================================================================
// REPORT VIEWER - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface ReportViewerProps {
  report: Report | null;
  onExport?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onExport,
  onPrint,
  onShare,
}) => {
  if (!report) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-center">
          <ChartBar size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="text-stone-500">Select a report to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
            {report.name}
          </h1>
          {report.description && (
            <p className="text-sm text-stone-500 mt-1">{report.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            title="Share"
          >
            <Share size={18} className="text-stone-500" />
          </button>
          <button
            onClick={onPrint}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            title="Print"
          >
            <Printer size={18} className="text-stone-500" />
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
          >
            <Export size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="h-full flex items-center justify-center bg-stone-50 dark:bg-stone-900 rounded-xl">
          <div className="text-center">
            <ChartBar size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <p className="text-stone-500">Report visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
