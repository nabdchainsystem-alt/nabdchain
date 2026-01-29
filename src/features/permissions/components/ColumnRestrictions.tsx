import React, { useState } from 'react';
import { Lock, Eye, Pencil, Plus, Trash, Users, Info } from 'phosphor-react';
import type { ColumnRestriction } from '../types';

// =============================================================================
// COLUMN RESTRICTIONS - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface ColumnRestrictionsProps {
  restrictions?: ColumnRestriction[];
  onAddRestriction?: () => void;
  onRemoveRestriction?: (id: string) => void;
}

// Mock column data
const mockColumns = [
  { id: 'col-1', name: 'Salary', boardName: 'HR Board' },
  { id: 'col-2', name: 'Contract Details', boardName: 'HR Board' },
  { id: 'col-3', name: 'Budget', boardName: 'Finance Board' },
  { id: 'col-4', name: 'Personal Notes', boardName: 'Project Board' },
];

const mockRestrictions: ColumnRestriction[] = [
  {
    id: 'r-1',
    boardId: 'board-1',
    columnId: 'col-1',
    restrictionType: 'view',
    allowedRoles: ['Admin', 'HR Manager'],
    allowedUsers: [],
  },
  {
    id: 'r-2',
    boardId: 'board-2',
    columnId: 'col-3',
    restrictionType: 'edit',
    allowedRoles: ['Admin', 'Finance'],
    allowedUsers: ['user-1'],
  },
];

export const ColumnRestrictions: React.FC<ColumnRestrictionsProps> = ({
  restrictions = mockRestrictions,
  onAddRestriction,
  onRemoveRestriction,
}) => {
  const [selectedBoard, setSelectedBoard] = useState<string>('all');

  const getColumnInfo = (columnId: string) => {
    return mockColumns.find((c) => c.id === columnId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            Column Restrictions
          </h3>
          <p className="text-sm text-stone-500">
            Restrict who can view or edit specific columns
          </p>
        </div>
        <button
          onClick={onAddRestriction}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg"
        >
          <Plus size={18} />
          Add Restriction
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={selectedBoard}
          onChange={(e) => setSelectedBoard(e.target.value)}
          className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
        >
          <option value="all">All Boards</option>
          <option value="board-1">HR Board</option>
          <option value="board-2">Finance Board</option>
          <option value="board-3">Project Board</option>
        </select>
      </div>

      {/* Restrictions List */}
      {restrictions.length === 0 ? (
        <div className="p-8 bg-white dark:bg-stone-900 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 text-center">
          <Lock size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="text-stone-500 mb-2">No column restrictions</p>
          <p className="text-sm text-stone-400 mb-4">
            Add restrictions to limit access to sensitive columns
          </p>
          <button
            onClick={onAddRestriction}
            className="text-sm text-rose-600 hover:text-rose-700"
          >
            Add your first restriction
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {restrictions.map((restriction) => {
            const column = getColumnInfo(restriction.columnId);
            return (
              <div
                key={restriction.id}
                className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      restriction.restrictionType === 'view'
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-rose-100 dark:bg-rose-900/30'
                    }`}>
                      {restriction.restrictionType === 'view' ? (
                        <Eye size={20} className="text-amber-600" />
                      ) : (
                        <Pencil size={20} className="text-rose-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-stone-800 dark:text-stone-200">
                          {column?.name || 'Unknown Column'}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          restriction.restrictionType === 'view'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {restriction.restrictionType === 'view' ? 'View Restricted' : 'Edit Restricted'}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">
                        {column?.boardName || 'Unknown Board'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>
                            {restriction.allowedRoles.length} roles, {restriction.allowedUsers.length} users allowed
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {restriction.allowedRoles.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveRestriction?.(restriction.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
        <Info size={18} className="text-stone-400 mt-0.5" />
        <div className="text-sm text-stone-500">
          <p className="font-medium text-stone-600 dark:text-stone-400 mb-1">
            How restrictions work:
          </p>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>View restriction:</strong> Column is hidden from users without access</li>
            <li><strong>Edit restriction:</strong> Column is visible but read-only for users without access</li>
          </ul>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Column Restrictions - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default ColumnRestrictions;
