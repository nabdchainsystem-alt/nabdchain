import React from 'react';
import { ChartLine, Info } from 'phosphor-react';
import type { Sprint } from '../types';

// =============================================================================
// BURNDOWN CHART - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface BurndownChartProps {
  sprint: Sprint | null;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ sprint }) => {
  if (!sprint) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <ChartLine size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="text-stone-500 mb-2">No active sprint</p>
          <p className="text-sm text-stone-400">Start a sprint to see the burndown chart</p>
        </div>
      </div>
    );
  }

  // Generate mock burndown data
  const totalPoints = sprint.tasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const completedPoints = sprint.tasks.filter((t) => t.status === 'done').reduce((sum, t) => sum + t.storyPoints, 0);
  const remainingPoints = totalPoints - completedPoints;

  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const today = new Date();
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysPassed);

  // Calculate ideal burn rate
  const idealDailyBurn = totalPoints / totalDays;
  const idealRemaining = totalPoints - idealDailyBurn * daysPassed;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <p className="text-sm text-stone-500 mb-1">Total Points</p>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-200">{totalPoints}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <p className="text-sm text-stone-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedPoints}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <p className="text-sm text-stone-500 mb-1">Remaining</p>
          <p className="text-2xl font-bold text-amber-600">{remainingPoints}</p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <p className="text-sm text-stone-500 mb-1">Days Left</p>
          <p className="text-2xl font-bold text-violet-600">{daysRemaining}</p>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">Burndown Chart</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-stone-400 rounded-full" />
              <span className="text-stone-600 dark:text-stone-400">Ideal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-violet-500 rounded-full" />
              <span className="text-stone-600 dark:text-stone-400">Actual</span>
            </div>
          </div>
        </div>

        {/* Mock Chart Visualization */}
        <div className="relative h-64 bg-stone-50 dark:bg-stone-800 rounded-lg overflow-hidden">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-4 text-xs text-stone-500">
            <span>{totalPoints}</span>
            <span>{Math.round(totalPoints * 0.75)}</span>
            <span>{Math.round(totalPoints * 0.5)}</span>
            <span>{Math.round(totalPoints * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Chart Area */}
          <div className="ml-12 h-full relative">
            {/* Ideal Line (diagonal) */}
            <svg className="absolute inset-0 w-full h-full">
              <line
                x1="0"
                y1="16"
                x2="100%"
                y2="calc(100% - 16px)"
                stroke="#a8a29e"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              {/* Actual Line (mock - slightly above ideal) */}
              <polyline
                points={`0,16 ${daysPassed * (100 / totalDays)}%,${(remainingPoints / totalPoints) * 100}%`}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
              />
            </svg>

            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 border-l-2 border-violet-500 border-dashed"
              style={{ left: `${(daysPassed / totalDays) * 100}%` }}
            >
              <span className="absolute -top-5 -translate-x-1/2 text-xs text-violet-600 bg-white dark:bg-stone-900 px-1">
                Today
              </span>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-0 flex justify-between px-2 py-1 text-xs text-stone-500">
            <span>{startDate.toLocaleDateString()}</span>
            <span>{endDate.toLocaleDateString()}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Info size={18} className="text-stone-400 mt-0.5" />
            <div>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {remainingPoints > idealRemaining ? (
                  <span className="text-amber-600">
                    Behind schedule by {Math.round(remainingPoints - idealRemaining)} points
                  </span>
                ) : (
                  <span className="text-green-600">
                    On track! {Math.round(idealRemaining - remainingPoints)} points ahead
                  </span>
                )}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Daily burn rate needed: {Math.round(remainingPoints / Math.max(1, daysRemaining))} points/day
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">Burndown Chart - Interactive chart coming soon</p>
      </div>
    </div>
  );
};

export default BurndownChart;
