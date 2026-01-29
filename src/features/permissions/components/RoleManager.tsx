import React from 'react';
import { Shield, Users, Pencil, Trash, DotsThree, Crown, Star } from 'phosphor-react';
import type { Role } from '../types';

// =============================================================================
// ROLE MANAGER - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface RoleManagerProps {
  roles: Role[];
  onCreateRole?: () => void;
  onEditRole?: (roleId: string) => void;
  onDeleteRole?: (roleId: string) => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({
  roles,
  onCreateRole,
  onEditRole,
  onDeleteRole,
}) => {
  const getRoleIcon = (role: Role) => {
    if (role.name === 'Admin') return Crown;
    if (role.isSystem) return Shield;
    return Star;
  };

  const getRoleColor = (role: Role) => {
    if (role.color) return role.color;
    if (role.name === 'Admin') return 'rose';
    if (role.name === 'Member') return 'blue';
    if (role.name === 'Guest') return 'stone';
    return 'violet';
  };

  return (
    <div className="space-y-6">
      {/* System Roles */}
      <div>
        <h3 className="text-sm font-medium text-stone-500 uppercase mb-3">
          System Roles
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {roles.filter(r => r.isSystem).map((role) => {
            const Icon = getRoleIcon(role);
            const color = getRoleColor(role);
            return (
              <div
                key={role.id}
                className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                    <Icon size={20} className={`text-${color}-600`} />
                  </div>
                  <span className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                    System
                  </span>
                </div>
                <h4 className="font-semibold text-stone-800 dark:text-stone-200">
                  {role.name}
                </h4>
                {role.description && (
                  <p className="text-sm text-stone-500 mt-1">{role.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3 text-sm text-stone-500">
                  <Users size={14} />
                  <span>{role.memberCount} members</span>
                </div>
                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <p className="text-xs text-stone-400">
                    {role.permissions.length} permission groups
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Roles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-stone-500 uppercase">
            Custom Roles
          </h3>
          <button
            onClick={onCreateRole}
            className="text-sm text-rose-600 hover:text-rose-700"
          >
            + Create Role
          </button>
        </div>
        {roles.filter(r => !r.isSystem).length === 0 ? (
          <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 text-center">
            <Shield size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
            <p className="text-stone-500">No custom roles yet</p>
            <button
              onClick={onCreateRole}
              className="mt-2 text-sm text-rose-600 hover:text-rose-700"
            >
              Create your first custom role
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.filter(r => !r.isSystem).map((role) => {
              const Icon = getRoleIcon(role);
              const color = getRoleColor(role);
              return (
                <div
                  key={role.id}
                  className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                        <Icon size={20} className={`text-${color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-800 dark:text-stone-200">
                          {role.name}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-stone-500">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {role.memberCount} members
                          </span>
                          <span>{role.permissions.length} permissions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditRole?.(role.id)}
                        className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                      >
                        <Pencil size={16} className="text-stone-500" />
                      </button>
                      <button
                        onClick={() => onDeleteRole?.(role.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Role Manager - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default RoleManager;
