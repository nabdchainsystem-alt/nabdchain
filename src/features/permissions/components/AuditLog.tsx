import React, { useState } from 'react';
import { ClockCounterClockwise, User, Shield, Funnel, Download, Calendar } from 'phosphor-react';
import type { PermissionAuditLog } from '../types';

// =============================================================================
// AUDIT LOG - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface AuditLogProps {
  logs?: PermissionAuditLog[];
}

// Mock audit logs
const mockLogs: PermissionAuditLog[] = [
  {
    id: '1',
    workspaceId: 'ws-1',
    action: 'granted',
    targetType: 'user',
    targetId: 'user-1',
    performedBy: 'Admin User',
    details: 'Granted Editor role to John Doe',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '2',
    workspaceId: 'ws-1',
    action: 'modified',
    targetType: 'role',
    targetId: 'role-1',
    performedBy: 'Admin User',
    details: 'Updated permissions for Project Manager role',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    workspaceId: 'ws-1',
    action: 'revoked',
    targetType: 'user',
    targetId: 'user-2',
    performedBy: 'Admin User',
    details: 'Revoked access for Jane Smith',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '4',
    workspaceId: 'ws-1',
    action: 'granted',
    targetType: 'column',
    targetId: 'col-1',
    performedBy: 'Admin User',
    details: 'Added column restriction on Salary column',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    workspaceId: 'ws-1',
    action: 'modified',
    targetType: 'board',
    targetId: 'board-1',
    performedBy: 'Project Manager',
    details: 'Changed board visibility to private',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

export const AuditLog: React.FC<AuditLogProps> = ({ logs = mockLogs }) => {
  const [filter, setFilter] = useState<'all' | 'granted' | 'revoked' | 'modified'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const actionColors = {
    granted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    revoked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    modified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const targetIcons = {
    user: User,
    role: Shield,
    board: ClockCounterClockwise,
    column: ClockCounterClockwise,
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && log.action !== filter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            Permission Audit Log
          </h3>
          <p className="text-sm text-stone-500">
            Track all permission changes in your workspace
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800">
          <Download size={16} className="text-stone-500" />
          <span className="text-sm text-stone-600 dark:text-stone-400">Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Funnel size={16} className="text-stone-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
          >
            <option value="all">All Actions</option>
            <option value="granted">Granted</option>
            <option value="revoked">Revoked</option>
            <option value="modified">Modified</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-stone-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <ClockCounterClockwise size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <p className="text-stone-500">No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredLogs.map((log) => {
              const Icon = targetIcons[log.targetType];
              return (
                <div key={log.id} className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                      <Icon size={16} className="text-stone-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${actionColors[log.action]}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-stone-400 capitalize">
                          {log.targetType}
                        </span>
                      </div>
                      <p className="text-sm text-stone-700 dark:text-stone-300">
                        {log.details}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                        <span>by {log.performedBy}</span>
                        <span>•</span>
                        <span>{formatTime(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredLogs.length > 0 && (
        <div className="text-center">
          <button className="text-sm text-rose-600 hover:text-rose-700">
            Load more logs
          </button>
        </div>
      )}

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Audit Log - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default AuditLog;
