import React, { useState } from 'react';
import { Calendar, Plus, Check, X, Clock, User, Airplane, FirstAid, Heart } from 'phosphor-react';
import type { Resource, TimeOffRequest } from '../types';

// =============================================================================
// TIME OFF CALENDAR - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface TimeOffCalendarProps {
  resources: Resource[];
}

// Mock time off requests
const mockRequests: TimeOffRequest[] = [
  {
    id: '1',
    resourceId: 'resource-1',
    type: 'vacation',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'pending',
    notes: 'Summer vacation',
    createdAt: new Date(),
  },
  {
    id: '2',
    resourceId: 'resource-2',
    type: 'sick',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now()),
    status: 'approved',
    approvedBy: 'Admin',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    resourceId: 'resource-3',
    type: 'personal',
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    status: 'approved',
    approvedBy: 'Admin',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

export const TimeOffCalendar: React.FC<TimeOffCalendarProps> = ({ resources }) => {
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const typeIcons = {
    vacation: Airplane,
    sick: FirstAid,
    personal: Heart,
    other: Calendar,
  };

  const typeColors = {
    vacation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    sick: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    other: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400',
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const filteredRequests = mockRequests.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'approved') return r.status === 'approved';
    return true;
  });

  const getResource = (resourceId: string) => {
    return resources.find((r) => r.id === resourceId);
  };

  const getDuration = (start: Date, end: Date) => {
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'calendar'
                  ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Calendar
            </button>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg">
          <Plus size={18} />
          Request Time Off
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock size={18} />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-200">
            {mockRequests.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Airplane size={18} />
            <span className="text-sm font-medium">Upcoming Vacation</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-200">
            {mockRequests.filter((r) => r.type === 'vacation' && r.status === 'approved').length}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <FirstAid size={18} />
            <span className="text-sm font-medium">Out Sick</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-200">
            {mockRequests.filter((r) => r.type === 'sick' && new Date(r.endDate) >= new Date()).length}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Check size={18} />
            <span className="text-sm font-medium">Total Approved</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-200">
            {mockRequests.filter((r) => r.status === 'approved').length}
          </p>
        </div>
      </div>

      {/* Request List */}
      {view === 'list' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
              <p className="text-stone-500">No time off requests</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredRequests.map((request) => {
                const resource = getResource(request.resourceId);
                const Icon = typeIcons[request.type];

                return (
                  <div key={request.id} className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${typeColors[request.type]}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {resource?.avatar ? (
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
                            <span className="font-medium text-stone-800 dark:text-stone-200">
                              {resource?.name || 'Unknown'}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[request.status]}`}>
                              {request.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                            <span className="capitalize">{request.type}</span>
                            <span>•</span>
                            <span>
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{getDuration(new Date(request.startDate), new Date(request.endDate))}</span>
                          </div>
                          {request.notes && (
                            <p className="text-sm text-stone-400 mt-1">{request.notes}</p>
                          )}
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-green-600">
                            <Check size={18} />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600">
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Calendar View Placeholder */}
      {view === 'calendar' && (
        <div className="p-8 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
          <Calendar size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="text-stone-500 mb-2">Calendar View</p>
          <p className="text-sm text-stone-400">Coming soon</p>
        </div>
      )}

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Time Off Calendar - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default TimeOffCalendar;
