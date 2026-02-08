import React, { useState } from 'react';
import { ChartBar, Plus, Table, ChartPie, ChartLine, Calendar, Clock, Export } from 'phosphor-react';

// =============================================================================
// REPORTS PAGE - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'scheduled'>('reports');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <ChartBar size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">Reports & Analytics</h1>
              <p className="text-sm text-stone-500">Build custom reports and export data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
              Coming Soon
            </span>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg">
              <Plus size={18} />
              New Report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400'
                : 'text-stone-500 border-transparent hover:text-stone-700'
            }`}
          >
            My Reports
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'scheduled'
                ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400'
                : 'text-stone-500 border-transparent hover:text-stone-700'
            }`}
          >
            <Clock size={16} />
            Scheduled
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Export Cards */}
            <div className="col-span-full mb-6">
              <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">Quick Export</h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { icon: Table, label: 'Export to Excel', format: 'xlsx' },
                  { icon: ChartBar, label: 'Export to PDF', format: 'pdf' },
                  { icon: Export, label: 'Export to CSV', format: 'csv' },
                  { icon: ChartPie, label: 'Export to JSON', format: 'json' },
                ].map((item) => (
                  <button
                    key={item.format}
                    className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-center"
                  >
                    <item.icon size={32} className="mx-auto text-stone-400 mb-2" />
                    <span className="text-sm text-stone-600 dark:text-stone-400">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Report Templates */}
            <div className="col-span-full">
              <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">Report Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Project Status Report',
                    description: 'Overview of all projects with status breakdown',
                    icon: ChartBar,
                  },
                  {
                    name: 'Team Workload Report',
                    description: 'Task distribution across team members',
                    icon: ChartPie,
                  },
                  {
                    name: 'Timeline Report',
                    description: 'Gantt-style view of project timelines',
                    icon: Calendar,
                  },
                  {
                    name: 'Performance Trends',
                    description: 'Track metrics over time',
                    icon: ChartLine,
                  },
                ].map((template) => (
                  <div
                    key={template.name}
                    className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <template.icon size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-stone-800 dark:text-stone-200">{template.name}</h3>
                        <p className="text-xs text-stone-500 mt-1">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty State for Custom Reports */}
            <div className="col-span-full mt-6">
              <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">Custom Reports</h2>
              <div className="p-8 bg-stone-50 dark:bg-stone-900 rounded-xl text-center">
                <ChartBar size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                <p className="text-stone-600 dark:text-stone-400 mb-2">No custom reports yet</p>
                <p className="text-sm text-stone-500 mb-4">Create a custom report to visualize your data your way</p>
                <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg">
                  Create Report
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="p-8 bg-stone-50 dark:bg-stone-900 rounded-xl text-center">
            <Clock size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <p className="text-stone-600 dark:text-stone-400 mb-2">No scheduled reports</p>
            <p className="text-sm text-stone-500 mb-4">
              Schedule reports to be automatically generated and sent to your team
            </p>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg">
              Schedule Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
