import React, { useState } from 'react';
import { Calendar, CaretLeft, CaretRight, User } from 'phosphor-react';
import type { Resource, Allocation } from '../types';

// =============================================================================
// ALLOCATION TIMELINE - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface AllocationTimelineProps {
  resources: Resource[];
}

// Mock allocations
const mockAllocations: Record<string, Allocation[]> = {
  'resource-1': [
    {
      id: 'a1',
      resourceId: 'resource-1',
      projectId: 'project-1',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      hoursPerDay: 6,
      percentage: 75,
      type: 'project',
      status: 'confirmed',
    },
  ],
  'resource-2': [
    {
      id: 'a2',
      resourceId: 'resource-2',
      projectId: 'project-2',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      hoursPerDay: 8,
      percentage: 100,
      type: 'project',
      status: 'confirmed',
    },
  ],
};

export const AllocationTimeline: React.FC<AllocationTimelineProps> = ({ resources }) => {
  const [monthOffset, setMonthOffset] = useState(0);

  // Generate dates for the current month view
  const getMonthDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);

    const dates = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const monthDates = getMonthDates();
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);

  const allocationColors = {
    project: 'bg-indigo-500',
    task: 'bg-green-500',
    meeting: 'bg-amber-500',
    vacation: 'bg-purple-500',
    sick: 'bg-red-500',
    other: 'bg-stone-500',
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((prev) => prev - 1)}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <CaretLeft size={20} className="text-stone-500" />
          </button>
          <span className="text-lg font-semibold text-stone-800 dark:text-stone-200 min-w-[150px] text-center">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setMonthOffset((prev) => prev + 1)}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <CaretRight size={20} className="text-stone-500" />
          </button>
          {monthOffset !== 0 && (
            <button
              onClick={() => setMonthOffset(0)}
              className="text-sm text-indigo-600 hover:text-indigo-700 ml-2"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500">
          {Object.entries(allocationColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-3 h-3 ${color} rounded`} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header - Dates */}
            <div className="flex border-b border-stone-200 dark:border-stone-700">
              <div className="w-48 flex-shrink-0 px-4 py-2 bg-stone-50 dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700">
                <span className="text-sm font-medium text-stone-500">Resource</span>
              </div>
              <div className="flex-1 flex">
                {monthDates.map((date) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={date.toISOString()}
                      className={`flex-1 min-w-[30px] px-1 py-2 text-center text-xs ${
                        isWeekend ? 'bg-stone-50 dark:bg-stone-800' : ''
                      } ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                    >
                      <div className="text-stone-400">
                        {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </div>
                      <div className={`font-medium ${isToday ? 'text-indigo-600' : 'text-stone-600 dark:text-stone-400'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows - Resources */}
            {resources.map((resource) => {
              const allocations = mockAllocations[resource.id] || [];

              return (
                <div
                  key={resource.id}
                  className="flex border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                >
                  <div className="w-48 flex-shrink-0 px-4 py-3 border-r border-stone-200 dark:border-stone-700">
                    <div className="flex items-center gap-2">
                      {resource.avatar ? (
                        <img
                          src={resource.avatar}
                          alt={resource.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                          <User size={12} className="text-indigo-600" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">
                        {resource.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex relative py-2">
                    {monthDates.map((date) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div
                          key={date.toISOString()}
                          className={`flex-1 min-w-[30px] min-h-[32px] border-r border-stone-50 dark:border-stone-800 ${
                            isWeekend ? 'bg-stone-50/50 dark:bg-stone-800/50' : ''
                          } ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                        />
                      );
                    })}
                    {/* Allocation bars - overlaid */}
                    {allocations.map((allocation) => {
                      const startDay = Math.max(
                        0,
                        Math.floor((allocation.startDate.getTime() - monthDates[0].getTime()) / (24 * 60 * 60 * 1000))
                      );
                      const endDay = Math.min(
                        monthDates.length - 1,
                        Math.floor((allocation.endDate.getTime() - monthDates[0].getTime()) / (24 * 60 * 60 * 1000))
                      );
                      const width = ((endDay - startDay + 1) / monthDates.length) * 100;
                      const left = (startDay / monthDates.length) * 100;

                      if (startDay > monthDates.length - 1 || endDay < 0) return null;

                      return (
                        <div
                          key={allocation.id}
                          className={`absolute top-2 h-6 ${allocationColors[allocation.type]} rounded opacity-80`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${allocation.type}: ${allocation.percentage}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Allocation Timeline - Drag & drop functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default AllocationTimeline;
