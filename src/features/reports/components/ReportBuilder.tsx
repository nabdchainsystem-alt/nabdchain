import React from 'react';
import { ChartBar, Table, ChartPie, ChartLine, Plus, Gear } from 'phosphor-react';

// =============================================================================
// REPORT BUILDER - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface ReportBuilderProps {
  reportId?: string;
  onSave?: () => void;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({ _reportId, onSave }) => {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBar size={20} className="text-emerald-600" />
          <input
            type="text"
            defaultValue="Untitled Report"
            className="text-lg font-semibold bg-transparent border-none focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
            <Gear size={18} className="text-stone-500" />
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
          >
            Save Report
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Widget Library */}
        <div className="w-64 border-r border-stone-200 dark:border-stone-700 p-4">
          <h3 className="text-xs font-medium text-stone-500 uppercase mb-3">Add Widget</h3>
          <div className="space-y-2">
            {[
              { icon: Table, label: 'Table' },
              { icon: ChartBar, label: 'Bar Chart' },
              { icon: ChartLine, label: 'Line Chart' },
              { icon: ChartPie, label: 'Pie Chart' },
            ].map((widget) => (
              <button
                key={widget.label}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              >
                <widget.icon size={18} />
                {widget.label}
              </button>
            ))}
          </div>

          <h3 className="text-xs font-medium text-stone-500 uppercase mt-6 mb-3">Data Sources</h3>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
            <Plus size={18} />
            Add Data Source
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6 bg-stone-50 dark:bg-stone-900">
          <div className="h-full border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <ChartBar size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
              <p className="text-stone-500 mb-2">Drag widgets here to build your report</p>
              <p className="text-xs text-stone-400">Report builder coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
