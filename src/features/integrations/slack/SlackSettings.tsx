import React from 'react';
import { SlackLogo, Hash, Bell } from 'phosphor-react';
import type { SlackChannelMapping } from '../types';

// =============================================================================
// SLACK SETTINGS - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface SlackSettingsProps {
  teamName?: string;
  channelMappings?: SlackChannelMapping[];
  onSave?: (mappings: SlackChannelMapping[]) => void;
}

export const SlackSettings: React.FC<SlackSettingsProps> = ({
  teamName = 'Your Workspace',
  channelMappings = [],
  onSave,
}) => {
  return (
    <div className="space-y-6">
      {/* Connected Workspace */}
      <div className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
        <SlackLogo size={32} className="text-[#4A154B]" weight="fill" />
        <div>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Connected to
          </p>
          <p className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {teamName}
          </p>
        </div>
      </div>

      {/* Channel Mappings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-stone-700 dark:text-stone-300">
            Channel Mappings
          </h3>
          <button className="text-sm text-blue-500 hover:text-blue-600">
            + Add Mapping
          </button>
        </div>

        {channelMappings.length === 0 ? (
          <div className="p-6 bg-stone-50 dark:bg-stone-800 rounded-lg text-center">
            <Hash size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
            <p className="text-sm text-stone-500">No channel mappings configured</p>
            <p className="text-xs text-stone-400 mt-1">
              Map boards to Slack channels to receive updates
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {channelMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Hash size={18} className="text-stone-400" />
                  <div>
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      #{mapping.channelName}
                    </p>
                    <p className="text-xs text-stone-500">
                      → {mapping.boardName}
                    </p>
                  </div>
                </div>
                <button className="text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="font-medium text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
          <Bell size={18} />
          Notification Types
        </h3>
        <div className="space-y-2">
          {[
            { key: 'create', label: 'Task created' },
            { key: 'update', label: 'Task updated' },
            { key: 'complete', label: 'Task completed' },
            { key: 'comment', label: 'New comment' },
            { key: 'due_date', label: 'Due date approaching' },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center justify-between p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded"
            >
              <span className="text-sm text-stone-600 dark:text-stone-400">{label}</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={() => onSave?.(channelMappings)}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
      >
        Save Settings
      </button>

      <p className="text-xs text-center text-stone-400">
        Full Slack integration coming soon
      </p>
    </div>
  );
};

export default SlackSettings;
