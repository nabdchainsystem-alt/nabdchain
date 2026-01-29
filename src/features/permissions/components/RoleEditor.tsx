import React, { useState } from 'react';
import { X, Shield, Check, Minus } from 'phosphor-react';
import type { Role, Permission, PermissionResource, PermissionAction } from '../types';

// =============================================================================
// ROLE EDITOR - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface RoleEditorProps {
  role?: Role;
  onSave?: (role: Partial<Role>) => void;
  onClose: () => void;
}

const resources: PermissionResource[] = [
  'workspace',
  'board',
  'folder',
  'task',
  'document',
  'member',
  'guest',
  'integration',
  'automation',
  'report',
  'template',
  'settings',
];

const actions: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'share',
  'export',
  'manage',
];

export const RoleEditor: React.FC<RoleEditorProps> = ({
  role,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState<Permission[]>(role?.permissions || []);

  const isEditing = !!role;

  const hasPermission = (resource: PermissionResource, action: PermissionAction) => {
    const perm = permissions.find((p) => p.resource === resource);
    return perm?.actions.includes(action) || false;
  };

  const togglePermission = (resource: PermissionResource, action: PermissionAction) => {
    setPermissions((prev) => {
      const existing = prev.find((p) => p.resource === resource);
      if (existing) {
        const newActions = existing.actions.includes(action)
          ? existing.actions.filter((a) => a !== action)
          : [...existing.actions, action];
        if (newActions.length === 0) {
          return prev.filter((p) => p.resource !== resource);
        }
        return prev.map((p) =>
          p.resource === resource ? { ...p, actions: newActions } : p
        );
      }
      return [...prev, { resource, actions: [action] }];
    });
  };

  const handleSave = () => {
    console.log('[RoleEditor] Save - NOT IMPLEMENTED', { name, description, permissions });
    onSave?.({ name, description, permissions });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-stone-900 rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-rose-600" />
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
              {isEditing ? 'Edit Role' : 'Create Role'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Role Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Project Manager"
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What can this role do?"
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
              />
            </div>
          </div>

          {/* Permission Matrix */}
          <div>
            <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
              Permissions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase px-3 py-2 bg-stone-50 dark:bg-stone-800">
                      Resource
                    </th>
                    {actions.map((action) => (
                      <th
                        key={action}
                        className="text-center text-xs font-medium text-stone-500 uppercase px-3 py-2 bg-stone-50 dark:bg-stone-800"
                      >
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource} className="border-t border-stone-100 dark:border-stone-800">
                      <td className="px-3 py-2 text-sm text-stone-700 dark:text-stone-300 capitalize">
                        {resource}
                      </td>
                      {actions.map((action) => (
                        <td key={action} className="px-3 py-2 text-center">
                          <button
                            onClick={() => togglePermission(resource, action)}
                            className={`w-6 h-6 rounded flex items-center justify-center ${
                              hasPermission(resource, action)
                                ? 'bg-rose-500 text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                            }`}
                          >
                            {hasPermission(resource, action) ? (
                              <Check size={14} />
                            ) : (
                              <Minus size={14} />
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg disabled:opacity-50"
          >
            {isEditing ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleEditor;
