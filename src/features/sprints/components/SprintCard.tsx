import React from 'react';
import { Calendar, Target, Users, Play, Pencil, CheckCircle, Clock } from 'phosphor-react';
import type { Sprint } from '../types';

// =============================================================================
// SPRINT CARD - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface SprintCardProps {
  sprint: Sprint;
  onEdit?: () => void;
  onStart?: () => void;
  compact?: boolean;
}

export const SprintCard: React.FC<SprintCardProps> = ({
  sprint,
  onEdit,
  onStart,
  compact = false,
}) => {
  const totalPoints = sprint.tasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const completedPoints = sprint.tasks
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + t.storyPoints, 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const statusColors = {
    planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusLabels = {
    planning: 'Planning',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  if (compact) {
    return (
      <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-green-500" />
            <div>
              <p className="font-medium text-stone-700 dark:text-stone-300">{sprint.name}</p>
              <p className="text-xs text-stone-500">
                {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {completedPoints} / {totalPoints} pts
            </p>
            <p className="text-xs text-stone-500">
              Velocity: {sprint.velocity || completedPoints}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200">
              {sprint.name}
            </h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[sprint.status]}`}>
              {statusLabels[sprint.status]}
            </span>
          </div>
          {sprint.goal && (
            <p className="text-sm text-stone-500">{sprint.goal}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {sprint.status === 'planning' && onStart && (
            <button
              onClick={onStart}
              className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-green-600"
              title="Start Sprint"
            >
              <Play size={16} />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
            title="Edit Sprint"
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-4 text-sm text-stone-500 mb-3">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>
            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>
            {Math.ceil(
              (new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )}{' '}
            days
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-stone-600 dark:text-stone-400">Progress</span>
          <span className="font-medium text-stone-700 dark:text-stone-300">
            {completedPoints} / {totalPoints} points ({progressPercent}%)
          </span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-stone-500">
          <Target size={14} />
          <span>{sprint.tasks.length} tasks</span>
        </div>
        <div className="flex items-center gap-1 text-stone-500">
          <Users size={14} />
          <span>Capacity: {sprint.capacity} pts</span>
        </div>
      </div>
    </div>
  );
};

export default SprintCard;
