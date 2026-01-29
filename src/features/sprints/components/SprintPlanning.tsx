import React, { useState } from 'react';
import { CalendarCheck, Plus, Target, Users, Clock } from 'phosphor-react';
import type { Sprint } from '../types';
import { SprintCard } from './SprintCard';

// =============================================================================
// SPRINT PLANNING - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface SprintPlanningProps {
  sprints: Sprint[];
  onCreateSprint?: () => void;
  onEditSprint?: (sprintId: string) => void;
}

export const SprintPlanning: React.FC<SprintPlanningProps> = ({
  sprints,
  onCreateSprint,
  onEditSprint,
}) => {
  const [showBacklog, setShowBacklog] = useState(true);

  const upcomingSprints = sprints.filter((s) => s.status === 'planning');
  const activeSprints = sprints.filter((s) => s.status === 'active');
  const completedSprints = sprints.filter((s) => s.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Planning Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            Sprint Planning
          </h2>
          <p className="text-sm text-stone-500">
            Plan and manage your sprint cycles
          </p>
        </div>
        <button
          onClick={onCreateSprint}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg"
        >
          <Plus size={18} />
          Plan Sprint
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Backlog Panel */}
        <div className="col-span-1">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-700 dark:text-stone-300">
                  Product Backlog
                </h3>
                <button
                  onClick={() => setShowBacklog(!showBacklog)}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  {showBacklog ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {showBacklog && (
              <div className="p-4">
                <div className="space-y-2">
                  {/* Mock backlog items */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-grab hover:border-violet-300"
                    >
                      <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        Backlog Item {i}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                        <span className="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 rounded">
                          {i * 2} pts
                        </span>
                        <span>Feature</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-stone-400 text-center mt-4">
                  Drag items to a sprint to add them
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sprint Columns */}
        <div className="col-span-2 space-y-6">
          {/* Active Sprint */}
          {activeSprints.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-stone-500 uppercase mb-3">
                Active Sprint
              </h4>
              <div className="space-y-3">
                {activeSprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    onEdit={() => onEditSprint?.(sprint.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Sprints */}
          <div>
            <h4 className="text-sm font-medium text-stone-500 uppercase mb-3">
              Upcoming Sprints ({upcomingSprints.length})
            </h4>
            {upcomingSprints.length === 0 ? (
              <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 text-center">
                <CalendarCheck size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                <p className="text-stone-500">No sprints planned</p>
                <button
                  onClick={onCreateSprint}
                  className="mt-2 text-sm text-violet-600 hover:text-violet-700"
                >
                  Plan your first sprint
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    onEdit={() => onEditSprint?.(sprint.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completed Sprints */}
          {completedSprints.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-stone-500 uppercase mb-3">
                Completed ({completedSprints.length})
              </h4>
              <div className="space-y-3">
                {completedSprints.slice(0, 3).map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    onEdit={() => onEditSprint?.(sprint.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Sprint Planning - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default SprintPlanning;
