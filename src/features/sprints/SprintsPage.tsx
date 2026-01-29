import React, { useState } from 'react';
import { Timer, ChartLine, Target, CalendarCheck, Plus, Gear } from 'phosphor-react';
import { SprintBoard } from './components/SprintBoard';
import { SprintPlanning } from './components/SprintPlanning';
import { BurndownChart } from './components/BurndownChart';
import { VelocityChart } from './components/VelocityChart';
import { useSprints } from './hooks/useSprints';

// =============================================================================
// SPRINTS PAGE - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

type SprintTab = 'board' | 'planning' | 'burndown' | 'velocity';

export const SprintsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SprintTab>('board');
  const { sprints, activeSprint, isLoading } = useSprints();

  const tabs = [
    { id: 'board' as const, label: 'Sprint Board', icon: Target },
    { id: 'planning' as const, label: 'Planning', icon: CalendarCheck },
    { id: 'burndown' as const, label: 'Burndown', icon: ChartLine },
    { id: 'velocity' as const, label: 'Velocity', icon: Timer },
  ];

  return (
    <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <Timer size={24} className="text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
                Sprints
              </h1>
              <p className="text-sm text-stone-500">
                Agile sprint management and tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
              <Gear size={20} className="text-stone-500" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg">
              <Plus size={18} />
              New Sprint
            </button>
          </div>
        </div>

        {/* Active Sprint Info */}
        {activeSprint && (
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                  Active Sprint
                </span>
                <h3 className="font-semibold text-stone-800 dark:text-stone-200">
                  {activeSprint.name}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-sm text-stone-500">
                  {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
                </div>
                <div className="text-sm font-medium text-violet-600">
                  {activeSprint.tasks.filter(t => t.status === 'done').length} / {activeSprint.tasks.length} tasks
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <>
            {activeTab === 'board' && <SprintBoard sprint={activeSprint} />}
            {activeTab === 'planning' && <SprintPlanning sprints={sprints} />}
            {activeTab === 'burndown' && <BurndownChart sprint={activeSprint} />}
            {activeTab === 'velocity' && <VelocityChart sprints={sprints} />}
          </>
        )}
      </div>
    </div>
  );
};

export default SprintsPage;
