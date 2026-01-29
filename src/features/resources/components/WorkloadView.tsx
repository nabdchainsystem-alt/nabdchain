import React, { useState } from 'react';
import { ChartBar, CaretLeft, CaretRight, User, Warning } from 'phosphor-react';
import type { Resource, WorkloadData } from '../types';

// =============================================================================
// WORKLOAD VIEW - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface WorkloadViewProps {
  resources: Resource[];
}

export const WorkloadView: React.FC<WorkloadViewProps> = ({ resources }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Generate current week dates
  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);

    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Mock workload data
  const getWorkload = (resourceId: string, date: Date): number => {
    // Random mock utilization between 40-120%
    return Math.floor(Math.random() * 80) + 40;
  };

  const getUtilizationColor = (percent: number) => {
    if (percent > 100) return 'bg-red-500';
    if (percent > 80) return 'bg-green-500';
    if (percent > 50) return 'bg-amber-500';
    return 'bg-stone-300 dark:bg-stone-600';
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <CaretLeft size={20} className="text-stone-500" />
          </button>
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {weekDates[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <CaretRight size={20} className="text-stone-500" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-sm text-indigo-600 hover:text-indigo-700 ml-2"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Optimal (50-80%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            <span>Low (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Overallocated (&gt;100%)</span>
          </div>
        </div>
      </div>

      {/* Workload Grid */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-800">
              <th className="text-left text-sm font-medium text-stone-500 px-4 py-3 w-48">
                Resource
              </th>
              {weekDates.map((date) => (
                <th
                  key={date.toISOString()}
                  className="text-center text-sm font-medium text-stone-500 px-4 py-3"
                >
                  <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-xs">{date.getDate()}</div>
                </th>
              ))}
              <th className="text-center text-sm font-medium text-stone-500 px-4 py-3">
                Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => {
              const weekWorkloads = weekDates.map((date) => getWorkload(resource.id, date));
              const avgWorkload = Math.round(
                weekWorkloads.reduce((a, b) => a + b, 0) / weekWorkloads.length
              );

              return (
                <tr
                  key={resource.id}
                  className="border-t border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {resource.avatar ? (
                        <img
                          src={resource.avatar}
                          alt={resource.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                          <User size={16} className="text-indigo-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                          {resource.name}
                        </p>
                        <p className="text-xs text-stone-500">{resource.role}</p>
                      </div>
                    </div>
                  </td>
                  {weekWorkloads.map((workload, index) => (
                    <td key={index} className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-full h-6 rounded flex items-center justify-center text-xs font-medium text-white ${getUtilizationColor(workload)}`}
                        >
                          {workload}%
                        </div>
                        {workload > 100 && (
                          <Warning size={12} className="text-red-500" />
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        avgWorkload > 100
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : avgWorkload > 80
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {avgWorkload}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Workload View - Interactive features coming soon
        </p>
      </div>
    </div>
  );
};

export default WorkloadView;
