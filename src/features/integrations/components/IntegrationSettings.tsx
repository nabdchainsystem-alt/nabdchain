import React from 'react';
import { X, Gear } from 'phosphor-react';
import type { Integration } from '../types';

// =============================================================================
// INTEGRATION SETTINGS - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface IntegrationSettingsProps {
  integration: Integration;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: Record<string, unknown>) => void;
  onDisconnect?: () => void;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  integration,
  isOpen,
  onClose,
  onSave,
  onDisconnect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Gear size={20} />
            {integration.name} Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Status */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                {integration.name} is connected and working properly.
              </p>
            </div>

            {/* Placeholder Settings */}
            <div>
              <h4 className="font-medium text-stone-700 dark:text-stone-300 mb-2">
                Notification Settings
              </h4>
              <div className="space-y-2">
                {['Task created', 'Task completed', 'Comments', 'Due dates'].map((setting) => (
                  <label key={setting} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-stone-600 dark:text-stone-400">{setting}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Placeholder Channel Mapping */}
            <div>
              <h4 className="font-medium text-stone-700 dark:text-stone-300 mb-2">
                Channel Mapping
              </h4>
              <p className="text-sm text-stone-500 mb-2">
                Choose which board updates go to which channel
              </p>
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-lg text-center">
                <p className="text-xs text-stone-400">
                  Channel mapping configuration coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={onDisconnect}
            className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            Disconnect
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave?.({})}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSettings;
