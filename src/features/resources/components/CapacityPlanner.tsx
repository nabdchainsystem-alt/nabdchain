import React, { useState } from 'react';
import { Clock, Plus, ChartPie, Target, TrendUp, Info } from 'phosphor-react';
import type { Resource } from '../types';

// =============================================================================
// CAPACITY PLANNER - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface CapacityPlannerProps {
  resources: Resource[];
}

export const CapacityPlanner: React.FC<CapacityPlannerProps> = ({ resources }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter'>('month');

  // Calculate totals
  const totalCapacity = resources.reduce((sum, r) => sum + r.capacity, 0);
  const allocatedHours = Math.round(totalCapacity * 0.75); // Mock 75% allocation
  const availableHours = totalCapacity - allocatedHours;

  // Mock project allocations
  const projectAllocations = [
    { name: 'Project Alpha', hours: 120, color: 'bg-indigo-500' },
    { name: 'Project Beta', hours: 80, color: 'bg-green-500' },
    { name: 'Project Gamma', hours: 60, color: 'bg-amber-500' },
    { name: 'Support', hours: 40, color: 'bg-rose-500' },
    { name: 'Internal', hours: 20, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* View Mode */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200">
          Capacity Overview
        </h3>
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
          {(['week', 'month', 'quarter'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Capacity Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-indigo-600" />
            <h4 className="font-medium text-stone-700 dark:text-stone-300">Total Capacity</h4>
          </div>
          <p className="text-3xl font-bold text-stone-800 dark:text-stone-200">
            {totalCapacity}h
          </p>
          <p className="text-sm text-stone-500 mt-1">
            per {viewMode}
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-green-600" />
            <h4 className="font-medium text-stone-700 dark:text-stone-300">Allocated</h4>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {allocatedHours}h
          </p>
          <p className="text-sm text-stone-500 mt-1">
            {Math.round((allocatedHours / totalCapacity) * 100)}% utilized
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendUp size={20} className="text-amber-600" />
            <h4 className="font-medium text-stone-700 dark:text-stone-300">Available</h4>
          </div>
          <p className="text-3xl font-bold text-amber-600">
            {availableHours}h
          </p>
          <p className="text-sm text-stone-500 mt-1">
            ready to allocate
          </p>
        </div>
      </div>

      {/* Allocation Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* By Project */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Allocation by Project
          </h4>
          <div className="space-y-3">
            {projectAllocations.map((project) => (
              <div key={project.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {project.name}
                  </span>
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                    {project.hours}h
                  </span>
                </div>
                <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${project.color} rounded-full`}
                    style={{ width: `${(project.hours / allocatedHours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity Chart Placeholder */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Capacity Utilization
          </h4>
          <div className="h-48 flex items-center justify-center bg-stone-50 dark:bg-stone-800 rounded-lg">
            <div className="text-center">
              <ChartPie size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-sm text-stone-500">
                Capacity chart visualization
              </p>
              <p className="text-xs text-stone-400">
                Coming soon
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Recommendations */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-indigo-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">
              Capacity Recommendations
            </h4>
            <ul className="text-sm text-indigo-600 dark:text-indigo-400 space-y-1">
              <li>• 3 team members have available capacity for new projects</li>
              <li>• Project Alpha may need additional resources next month</li>
              <li>• Consider redistributing support tasks to balance workload</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Capacity Planner - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default CapacityPlanner;
