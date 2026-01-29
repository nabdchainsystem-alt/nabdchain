import React from 'react';
import { Timer, TrendUp, ChartBar, Info } from 'phosphor-react';
import type { Sprint, VelocityData } from '../types';

// =============================================================================
// VELOCITY CHART - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface VelocityChartProps {
  sprints: Sprint[];
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ sprints }) => {
  // Calculate velocity data from completed sprints
  const completedSprints = sprints.filter((s) => s.status === 'completed');

  // Generate mock velocity data if no completed sprints
  const velocityData: VelocityData[] = completedSprints.length > 0
    ? completedSprints.map((sprint) => {
        const planned = sprint.capacity;
        const completed = sprint.tasks
          .filter((t) => t.status === 'done')
          .reduce((sum, t) => sum + t.storyPoints, 0);
        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          planned,
          completed,
          velocity: completed,
        };
      })
    : [
        { sprintId: '1', sprintName: 'Sprint 1', planned: 30, completed: 28, velocity: 28 },
        { sprintId: '2', sprintName: 'Sprint 2', planned: 32, completed: 30, velocity: 30 },
        { sprintId: '3', sprintName: 'Sprint 3', planned: 35, completed: 32, velocity: 32 },
        { sprintId: '4', sprintName: 'Sprint 4', planned: 34, completed: 35, velocity: 35 },
        { sprintId: '5', sprintName: 'Sprint 5', planned: 36, completed: 33, velocity: 33 },
      ];

  const averageVelocity = velocityData.length > 0
    ? Math.round(velocityData.reduce((sum, d) => sum + d.velocity, 0) / velocityData.length)
    : 0;

  const maxPoints = Math.max(...velocityData.map((d) => Math.max(d.planned, d.completed)), 40);
  const completionRate = velocityData.length > 0
    ? Math.round(
        (velocityData.reduce((sum, d) => sum + d.completed, 0) /
          velocityData.reduce((sum, d) => sum + d.planned, 0)) *
          100
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <Timer size={16} />
            <span>Average Velocity</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">
            {averageVelocity} pts/sprint
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <TrendUp size={16} />
            <span>Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {completionRate}%
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <ChartBar size={16} />
            <span>Sprints Analyzed</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-200">
            {velocityData.length}
          </p>
        </div>
      </div>

      {/* Velocity Chart */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            Sprint Velocity
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-stone-300 rounded" />
              <span className="text-stone-600 dark:text-stone-400">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-violet-500 rounded" />
              <span className="text-stone-600 dark:text-stone-400">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-amber-500" />
              <span className="text-stone-600 dark:text-stone-400">Avg Velocity</span>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="relative h-64">
          {/* Y-axis */}
          <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-stone-500">
            <span>{maxPoints}</span>
            <span>{Math.round(maxPoints * 0.75)}</span>
            <span>{Math.round(maxPoints * 0.5)}</span>
            <span>{Math.round(maxPoints * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Chart Area */}
          <div className="ml-12 h-full flex items-end gap-4 pb-8 relative">
            {/* Average velocity line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-amber-500 border-dashed"
              style={{ bottom: `${(averageVelocity / maxPoints) * 100}%` }}
            >
              <span className="absolute right-0 -top-5 text-xs text-amber-600 bg-white dark:bg-stone-900 px-1">
                Avg: {averageVelocity}
              </span>
            </div>

            {/* Bars */}
            {velocityData.map((data, index) => (
              <div key={data.sprintId} className="flex-1 flex flex-col items-center">
                <div className="w-full flex gap-1 items-end h-48">
                  {/* Planned bar */}
                  <div
                    className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-t"
                    style={{ height: `${(data.planned / maxPoints) * 100}%` }}
                    title={`Planned: ${data.planned}`}
                  />
                  {/* Completed bar */}
                  <div
                    className="flex-1 bg-violet-500 rounded-t"
                    style={{ height: `${(data.completed / maxPoints) * 100}%` }}
                    title={`Completed: ${data.completed}`}
                  />
                </div>
                <span className="text-xs text-stone-500 mt-2 truncate max-w-full">
                  {data.sprintName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendUp size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Velocity Trend
                </p>
                <p className="text-xs text-stone-500">
                  {velocityData.length > 1 &&
                  velocityData[velocityData.length - 1].velocity >
                    velocityData[velocityData.length - 2].velocity
                    ? 'Improving! Last sprint was better than previous'
                    : 'Stable performance across recent sprints'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-violet-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Recommended Capacity
                </p>
                <p className="text-xs text-stone-500">
                  Based on velocity, plan {averageVelocity - 2} to {averageVelocity + 2} points for next sprint
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Velocity Chart - Interactive chart coming soon
        </p>
      </div>
    </div>
  );
};

export default VelocityChart;
