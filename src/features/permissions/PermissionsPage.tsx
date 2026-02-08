import React, { useState } from 'react';
import { Shield, Users, Lock, Table, ClockCounterClockwise, Plus, Gear } from 'phosphor-react';
import { RoleManager } from './components/RoleManager';
import { PermissionMatrix } from './components/PermissionMatrix';
import { ColumnRestrictions } from './components/ColumnRestrictions';
import { AuditLog } from './components/AuditLog';
import { usePermissions } from './hooks/usePermissions';

// =============================================================================
// PERMISSIONS PAGE - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

type PermissionTab = 'roles' | 'matrix' | 'columns' | 'audit';

export const PermissionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PermissionTab>('roles');
  const [_showRoleEditor, setShowRoleEditor] = useState(false);
  const { roles, isLoading } = usePermissions();

  const tabs = [
    { id: 'roles' as const, label: 'Roles', icon: Users },
    { id: 'matrix' as const, label: 'Permission Matrix', icon: Table },
    { id: 'columns' as const, label: 'Column Restrictions', icon: Lock },
    { id: 'audit' as const, label: 'Audit Log', icon: ClockCounterClockwise },
  ];

  return (
    <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
              <Shield size={24} className="text-rose-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">Permissions & Roles</h1>
              <p className="text-sm text-stone-500">Manage access control and user permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
              <Gear size={20} className="text-stone-500" />
            </button>
            <button
              onClick={() => setShowRoleEditor(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg"
            >
              <Plus size={18} />
              Create Role
            </button>
          </div>
        </div>

        {/* Role Summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Total Roles</p>
            <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">{roles.length}</p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Admins</p>
            <p className="text-xl font-semibold text-rose-600">
              {roles.find((r) => r.name === 'Admin')?.memberCount || 0}
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Members</p>
            <p className="text-xl font-semibold text-blue-600">
              {roles.find((r) => r.name === 'Member')?.memberCount || 0}
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Custom Roles</p>
            <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">
              {roles.filter((r) => !r.isSystem).length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
          </div>
        ) : (
          <>
            {activeTab === 'roles' && <RoleManager roles={roles} onCreateRole={() => setShowRoleEditor(true)} />}
            {activeTab === 'matrix' && <PermissionMatrix roles={roles} />}
            {activeTab === 'columns' && <ColumnRestrictions />}
            {activeTab === 'audit' && <AuditLog />}
          </>
        )}
      </div>
    </div>
  );
};

export default PermissionsPage;
