import React, { useState } from 'react';
import { Users, ChartBar, Calendar, Clock, UserList, Plus, Gear } from 'phosphor-react';
import { WorkloadView } from './components/WorkloadView';
import { CapacityPlanner } from './components/CapacityPlanner';
import { ResourceList } from './components/ResourceList';
import { AllocationTimeline } from './components/AllocationTimeline';
import { TimeOffCalendar } from './components/TimeOffCalendar';
import { useResources } from './hooks/useResources';

// =============================================================================
// RESOURCES PAGE - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

type ResourceTab = 'workload' | 'capacity' | 'people' | 'timeline' | 'timeoff';

export const ResourcesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ResourceTab>('workload');
  const { resources, metrics, isLoading } = useResources();

  const tabs = [
    { id: 'workload' as const, label: 'Workload', icon: ChartBar },
    { id: 'capacity' as const, label: 'Capacity', icon: Clock },
    { id: 'people' as const, label: 'People', icon: UserList },
    { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
    { id: 'timeoff' as const, label: 'Time Off', icon: Calendar },
  ];

  return (
    <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Users size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
                Resource Management
              </h1>
              <p className="text-sm text-stone-500">
                Manage workload, capacity, and team allocation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
              <Gear size={20} className="text-stone-500" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg">
              <Plus size={18} />
              Add Resource
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Total Resources</p>
            <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">
              {metrics.totalResources}
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Avg Utilization</p>
            <p className={`text-xl font-semibold ${
              metrics.averageUtilization > 90 ? 'text-red-600' :
              metrics.averageUtilization > 70 ? 'text-green-600' : 'text-amber-600'
            }`}>
              {metrics.averageUtilization}%
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Overallocated</p>
            <p className="text-xl font-semibold text-red-600">
              {metrics.overallocatedCount}
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Underallocated</p>
            <p className="text-xl font-semibold text-amber-600">
              {metrics.underallocatedCount}
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Available Hours</p>
            <p className="text-xl font-semibold text-indigo-600">
              {metrics.totalCapacityHours - metrics.allocatedHours}h
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <>
            {activeTab === 'workload' && <WorkloadView resources={resources} />}
            {activeTab === 'capacity' && <CapacityPlanner resources={resources} />}
            {activeTab === 'people' && <ResourceList resources={resources} />}
            {activeTab === 'timeline' && <AllocationTimeline resources={resources} />}
            {activeTab === 'timeoff' && <TimeOffCalendar resources={resources} />}
          </>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
