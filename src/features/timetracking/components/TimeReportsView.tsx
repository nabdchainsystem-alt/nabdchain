import React from 'react';
import { ChartBar, ChartPie, TrendUp } from 'phosphor-react';

// =============================================================================
// TIME REPORTS VIEW - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface TimeReportsViewProps {
  dateRange?: { start: Date; end: Date };
}

export const TimeReportsView: React.FC<TimeReportsViewProps> = ({ dateRange }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Hours', value: '0h', icon: ChartBar, color: 'blue' },
          { label: 'Billable Hours', value: '0h', icon: TrendUp, color: 'green' },
          { label: 'Projects', value: '0', icon: ChartPie, color: 'purple' },
          { label: 'Revenue', value: '$0', icon: TrendUp, color: 'amber' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={`text-${stat.color}-500`} />
              <span className="text-xs text-stone-500">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-stone-800 dark:text-stone-200">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-2 gap-6">
        {/* Hours by Project */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
          <h4 className="font-medium text-stone-800 dark:text-stone-200 mb-4">
            Hours by Project
          </h4>
          <div className="h-64 flex items-center justify-center bg-stone-50 dark:bg-stone-800 rounded-lg">
            <div className="text-center">
              <ChartPie size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-sm text-stone-500">Chart coming soon</p>
            </div>
          </div>
        </div>

        {/* Hours Trend */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
          <h4 className="font-medium text-stone-800 dark:text-stone-200 mb-4">
            Hours Trend
          </h4>
          <div className="h-64 flex items-center justify-center bg-stone-50 dark:bg-stone-800 rounded-lg">
            <div className="text-center">
              <ChartBar size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-sm text-stone-500">Chart coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Breakdown */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <h4 className="font-medium text-stone-800 dark:text-stone-200 mb-4">
          Team Time Breakdown
        </h4>
        <div className="p-8 text-center bg-stone-50 dark:bg-stone-800 rounded-lg">
          <p className="text-sm text-stone-500">
            Team time breakdown will appear here once you start tracking time
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeReportsView;
