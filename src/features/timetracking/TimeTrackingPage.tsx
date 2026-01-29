import React, { useState } from 'react';
import {
  Clock, Play, Pause, Plus, Calendar, ChartBar, Table,
  FunnelSimple, Export, Gear
} from 'phosphor-react';

// =============================================================================
// TIME TRACKING PAGE - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

type TabType = 'timer' | 'timesheet' | 'reports';

export const TimeTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('timer');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Format elapsed time
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
                Time Tracking
              </h1>
              <p className="text-sm text-stone-500">
                Track time spent on tasks and projects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex gap-1">
          {[
            { id: 'timer' as const, label: 'Timer', icon: Clock },
            { id: 'timesheet' as const, label: 'Timesheet', icon: Table },
            { id: 'reports' as const, label: 'Reports', icon: ChartBar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-stone-500 border-transparent hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'timer' && (
          <div className="max-w-2xl mx-auto">
            {/* Timer Display */}
            <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-8 text-center mb-6">
              <div className="text-6xl font-mono font-bold text-stone-800 dark:text-stone-200 mb-4">
                {formatTime(elapsedTime)}
              </div>
              <input
                type="text"
                placeholder="What are you working on?"
                className="w-full max-w-md mx-auto px-4 py-2 text-center border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 mb-6"
              />
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-colors ${
                    isTimerRunning
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause size={24} weight="fill" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play size={24} weight="fill" />
                      Start Timer
                    </>
                  )}
                </button>
                <button className="flex items-center gap-2 px-4 py-3 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 rounded-xl transition-colors">
                  <Plus size={20} />
                  Manual Entry
                </button>
              </div>
            </div>

            {/* Today's Entries */}
            <div>
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
                Today's Time Entries
              </h3>
              <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-8 text-center">
                <Clock size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                <p className="text-stone-500">No time entries yet today</p>
                <p className="text-sm text-stone-400 mt-1">
                  Start the timer or add a manual entry
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timesheet' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm">
                  ← Previous Week
                </button>
                <span className="px-4 py-1.5 font-medium">This Week</span>
                <button className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm">
                  Next Week →
                </button>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                <Export size={16} />
                Export
              </button>
            </div>

            <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-8 text-center">
              <Table size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
              <p className="text-stone-500">Timesheet view coming soon</p>
              <p className="text-sm text-stone-400 mt-1">
                View and edit your weekly time entries
              </p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm">
                  <Calendar size={16} />
                  This Month
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                  <FunnelSimple size={16} />
                  Filters
                </button>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                <Export size={16} />
                Export Report
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Hours', value: '0h', color: 'blue' },
                { label: 'Billable Hours', value: '0h', color: 'green' },
                { label: 'Non-Billable', value: '0h', color: 'stone' },
                { label: 'Total Amount', value: '$0', color: 'purple' },
              ].map((stat) => (
                <div key={stat.label} className="bg-stone-50 dark:bg-stone-900 rounded-xl p-4">
                  <div className="text-sm text-stone-500 mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold text-stone-800 dark:text-stone-200">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-8 text-center">
              <ChartBar size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
              <p className="text-stone-500">Time reports coming soon</p>
              <p className="text-sm text-stone-400 mt-1">
                View charts and analytics for tracked time
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTrackingPage;
