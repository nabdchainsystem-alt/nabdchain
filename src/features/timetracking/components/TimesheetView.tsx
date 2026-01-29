import React from 'react';
import { Table } from 'phosphor-react';

// =============================================================================
// TIMESHEET VIEW - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface TimesheetViewProps {
  userId?: string;
  weekStart?: Date;
}

export const TimesheetView: React.FC<TimesheetViewProps> = ({
  userId,
  weekStart = new Date(),
}) => {
  // Generate week days
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Table size={20} />
          Weekly Timesheet
        </h3>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-8 border-b border-stone-200 dark:border-stone-700">
        <div className="p-3 text-xs font-medium text-stone-500 border-r border-stone-200 dark:border-stone-700">
          Project / Task
        </div>
        {days.map((day) => (
          <div
            key={day}
            className="p-3 text-xs font-medium text-stone-500 text-center border-r border-stone-200 dark:border-stone-700 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Placeholder Row */}
      <div className="grid grid-cols-8 border-b border-stone-200 dark:border-stone-700">
        <div className="p-3 text-sm text-stone-600 dark:text-stone-400 border-r border-stone-200 dark:border-stone-700">
          No projects
        </div>
        {days.map((day) => (
          <div
            key={day}
            className="p-3 text-center border-r border-stone-200 dark:border-stone-700 last:border-r-0"
          >
            <span className="text-sm text-stone-400">-</span>
          </div>
        ))}
      </div>

      {/* Totals Row */}
      <div className="grid grid-cols-8 bg-stone-50 dark:bg-stone-800/50">
        <div className="p-3 text-sm font-medium text-stone-700 dark:text-stone-300 border-r border-stone-200 dark:border-stone-700">
          Total
        </div>
        {days.map((day) => (
          <div
            key={day}
            className="p-3 text-center border-r border-stone-200 dark:border-stone-700 last:border-r-0"
          >
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">0h</span>
          </div>
        ))}
      </div>

      {/* Coming Soon Notice */}
      <div className="p-6 text-center border-t border-stone-200 dark:border-stone-700">
        <p className="text-sm text-stone-500">
          Full timesheet functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default TimesheetView;
