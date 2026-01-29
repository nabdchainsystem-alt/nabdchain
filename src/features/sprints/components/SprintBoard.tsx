import React from 'react';
import { Target, User, Clock } from 'phosphor-react';
import type { Sprint, SprintTask } from '../types';

// =============================================================================
// SPRINT BOARD - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface SprintBoardProps {
  sprint: Sprint | null;
}

const columns = [
  { id: 'todo', label: 'To Do', color: 'stone' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'done', label: 'Done', color: 'green' },
];

export const SprintBoard: React.FC<SprintBoardProps> = ({ sprint }) => {
  if (!sprint) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Target size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="text-stone-500 mb-2">No active sprint</p>
          <p className="text-sm text-stone-400">
            Start a new sprint to see the board
          </p>
        </div>
      </div>
    );
  }

  const getTasksByStatus = (status: SprintTask['status']) => {
    return sprint.tasks.filter((task) => task.status === status);
  };

  return (
    <div className="h-full">
      <div className="grid grid-cols-3 gap-4 h-full">
        {columns.map((column) => {
          const tasks = getTasksByStatus(column.id as SprintTask['status']);
          const totalPoints = tasks.reduce((sum, t) => sum + t.storyPoints, 0);

          return (
            <div
              key={column.id}
              className="flex flex-col bg-stone-100 dark:bg-stone-900 rounded-xl"
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-700 dark:text-stone-300">
                    {column.label}
                  </h3>
                  <span className="text-sm text-stone-500">
                    {tasks.length} tasks • {totalPoints} pts
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-3 space-y-2 overflow-auto">
                {tasks.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-stone-400">Drop tasks here</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-move hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-2">
                        Task #{task.taskId.slice(-4)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                          <Target size={12} />
                          <span>{task.storyPoints} pts</span>
                        </div>
                        {task.assigneeId && (
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>Assigned</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder Notice */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Sprint Board - Drag & drop functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default SprintBoard;
