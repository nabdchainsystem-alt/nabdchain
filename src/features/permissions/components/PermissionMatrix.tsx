import React from 'react';
import { Check, Minus, X, Info } from 'phosphor-react';
import type { Role, PermissionResource, PermissionAction } from '../types';

// =============================================================================
// PERMISSION MATRIX - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface PermissionMatrixProps {
  roles: Role[];
}

const resources: { id: PermissionResource; label: string }[] = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'board', label: 'Boards' },
  { id: 'folder', label: 'Folders' },
  { id: 'task', label: 'Tasks' },
  { id: 'document', label: 'Documents' },
  { id: 'member', label: 'Members' },
  { id: 'guest', label: 'Guests' },
  { id: 'integration', label: 'Integrations' },
  { id: 'automation', label: 'Automations' },
  { id: 'report', label: 'Reports' },
  { id: 'template', label: 'Templates' },
  { id: 'settings', label: 'Settings' },
];

const actions: { id: PermissionAction; label: string }[] = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'share', label: 'Share' },
  { id: 'manage', label: 'Manage' },
];

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ roles }) => {
  const hasPermission = (role: Role, resource: PermissionResource, action: PermissionAction) => {
    const perm = role.permissions.find((p) => p.resource === resource);
    return perm?.actions.includes(action) || false;
  };

  const getPermissionLevel = (role: Role, resource: PermissionResource): 'full' | 'partial' | 'none' => {
    const perm = role.permissions.find((p) => p.resource === resource);
    if (!perm) return 'none';
    if (perm.actions.length >= actions.length - 1) return 'full';
    return 'partial';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            Permission Matrix
          </h3>
          <p className="text-sm text-stone-500">
            Compare permissions across all roles
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
              <Check size={10} className="text-white" />
            </div>
            <span>Allowed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-amber-500 rounded flex items-center justify-center">
              <Minus size={10} className="text-white" />
            </div>
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-stone-300 dark:bg-stone-600 rounded flex items-center justify-center">
              <X size={10} className="text-stone-500" />
            </div>
            <span>Denied</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800">
                <th className="text-left text-xs font-medium text-stone-500 uppercase px-4 py-3 sticky left-0 bg-stone-50 dark:bg-stone-800">
                  Resource
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="text-center text-xs font-medium text-stone-500 uppercase px-4 py-3 min-w-[100px]"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr
                  key={resource.id}
                  className="border-t border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                >
                  <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300 sticky left-0 bg-white dark:bg-stone-900">
                    {resource.label}
                  </td>
                  {roles.map((role) => {
                    const level = getPermissionLevel(role, resource.id);
                    return (
                      <td key={role.id} className="px-4 py-3 text-center">
                        <div
                          className={`w-6 h-6 mx-auto rounded flex items-center justify-center ${
                            level === 'full'
                              ? 'bg-green-500'
                              : level === 'partial'
                              ? 'bg-amber-500'
                              : 'bg-stone-200 dark:bg-stone-700'
                          }`}
                        >
                          {level === 'full' && <Check size={14} className="text-white" />}
                          {level === 'partial' && <Minus size={14} className="text-white" />}
                          {level === 'none' && <X size={14} className="text-stone-400" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
        <Info size={18} className="text-stone-400 mt-0.5" />
        <p className="text-sm text-stone-500">
          Click on a role name to view detailed permissions or edit the role.
          System roles (Admin, Member, Guest) have predefined permissions that cannot be modified.
        </p>
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Permission Matrix - Interactive features coming soon
        </p>
      </div>
    </div>
  );
};

export default PermissionMatrix;
