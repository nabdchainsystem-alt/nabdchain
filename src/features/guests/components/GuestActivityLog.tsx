import React from 'react';
import { Activity, Eye, ChatCircle, Pencil, Download, Share, User, Clock } from 'phosphor-react';
import type { GuestActivity } from '../types';

// =============================================================================
// GUEST ACTIVITY LOG - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface GuestActivityLogProps {
  activities?: GuestActivity[];
}

// Mock activities for placeholder
const mockActivities: GuestActivity[] = [
  {
    id: '1',
    guestId: 'guest-1',
    action: 'viewed',
    resourceType: 'board',
    resourceId: 'board-1',
    details: 'Marketing Campaign Board',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '2',
    guestId: 'guest-2',
    action: 'commented',
    resourceType: 'task',
    resourceId: 'task-1',
    details: 'Q4 Planning',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    guestId: 'guest-1',
    action: 'downloaded',
    resourceType: 'document',
    resourceId: 'doc-1',
    details: 'Project Specs.pdf',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '4',
    guestId: 'guest-3',
    action: 'edited',
    resourceType: 'task',
    resourceId: 'task-2',
    details: 'Budget Review',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export const GuestActivityLog: React.FC<GuestActivityLogProps> = ({
  activities = mockActivities,
}) => {
  const actionIcons = {
    viewed: Eye,
    commented: ChatCircle,
    edited: Pencil,
    downloaded: Download,
    shared: Share,
  };

  const actionColors = {
    viewed: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
    commented: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    edited: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    downloaded: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    shared: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const actionLabels = {
    viewed: 'viewed',
    commented: 'commented on',
    edited: 'edited',
    downloaded: 'downloaded',
    shared: 'shared',
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
        <p className="text-stone-500 mb-2">No recent activity</p>
        <p className="text-sm text-stone-400">
          Guest activity will appear here when they interact with shared content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200">
          Recent Activity
        </h3>
        <select className="text-sm border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400">
          <option>All activity</option>
          <option>Views only</option>
          <option>Comments only</option>
          <option>Edits only</option>
        </select>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {activities.map((activity) => {
            const Icon = actionIcons[activity.action];
            return (
              <div key={activity.id} className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${actionColors[activity.action]}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                        <User size={12} className="text-cyan-600" />
                      </div>
                      <span className="font-medium text-stone-800 dark:text-stone-200">
                        Guest
                      </span>
                      <span className="text-stone-500">
                        {actionLabels[activity.action]}
                      </span>
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {activity.details || activity.resourceType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-stone-400">
                      <Clock size={12} />
                      <span>{formatTime(activity.timestamp)}</span>
                      <span>•</span>
                      <span className="capitalize">{activity.resourceType}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="text-sm text-cyan-600 hover:text-cyan-700">
          Load more activity
        </button>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Activity Log - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default GuestActivityLog;
