import React from 'react';
import { Clock, Plus, Play, Pause, Trash, Calendar } from 'phosphor-react';
import type { ReportSchedule } from '../types';

// =============================================================================
// SCHEDULED REPORTS - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface ScheduledReportsProps {
  schedules?: ReportSchedule[];
  onAdd?: () => void;
  onToggle?: (scheduleId: string, active: boolean) => void;
  onDelete?: (scheduleId: string) => void;
}

export const ScheduledReports: React.FC<ScheduledReportsProps> = ({
  schedules = [],
  onAdd,
  onToggle,
  onDelete,
}) => {
  if (schedules.length === 0) {
    return (
      <div className="p-8 text-center">
        <Clock size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
        <p className="text-stone-600 dark:text-stone-400 mb-2">
          No scheduled reports
        </p>
        <p className="text-sm text-stone-500 mb-4">
          Automatically generate and send reports on a schedule
        </p>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
        >
          <Plus size={16} className="inline mr-1" />
          Create Schedule
        </button>
      </div>
    );
  }

  const getFrequencyLabel = (schedule: ReportSchedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `Every ${days[schedule.dayOfWeek || 0]} at ${schedule.time}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth} at ${schedule.time}`;
      default:
        return schedule.frequency;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200">
          Scheduled Reports
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
        >
          <Plus size={16} />
          Add Schedule
        </button>
      </div>

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  schedule.active
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-stone-100 dark:bg-stone-800'
                }`}>
                  <Calendar
                    size={20}
                    className={schedule.active ? 'text-emerald-600' : 'text-stone-400'}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-stone-800 dark:text-stone-200">
                    Report Schedule
                  </h4>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {getFrequencyLabel(schedule)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                    <span>{schedule.format.toUpperCase()}</span>
                    <span>•</span>
                    <span>{schedule.recipients.length} recipient(s)</span>
                  </div>
                  {schedule.lastSent && (
                    <p className="text-xs text-stone-400 mt-1">
                      Last sent: {new Date(schedule.lastSent).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggle?.(schedule.id, !schedule.active)}
                  className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                  title={schedule.active ? 'Pause' : 'Activate'}
                >
                  {schedule.active ? (
                    <Pause size={16} className="text-amber-500" />
                  ) : (
                    <Play size={16} className="text-emerald-500" />
                  )}
                </button>
                <button
                  onClick={() => onDelete?.(schedule.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Delete"
                >
                  <Trash size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduledReports;
