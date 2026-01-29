import React, { useState } from 'react';
import { Bell, Envelope, DeviceMobile, Moon, Clock } from 'phosphor-react';
import type { NotificationPreferences } from '../types';

// =============================================================================
// NOTIFICATION SETTINGS - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface NotificationSettingsProps {
  preferences?: NotificationPreferences;
  onSave?: (preferences: NotificationPreferences) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  preferences,
  onSave,
}) => {
  const [settings, setSettings] = useState<Partial<NotificationPreferences>>(
    preferences || {
      emailEnabled: true,
      emailMentions: true,
      emailAssignments: true,
      emailComments: false,
      emailDueDates: true,
      emailStatusChanges: false,
      emailDigest: 'daily',
      pushEnabled: true,
      pushMentions: true,
      pushAssignments: true,
      pushComments: false,
      pushDueDates: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    }
  );

  const Toggle: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }> = ({ checked, onChange, disabled }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-10 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue-500' : 'bg-stone-300 dark:bg-stone-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Envelope size={20} className="text-stone-600 dark:text-stone-400" />
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            Email Notifications
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600 dark:text-stone-400">Enable email notifications</span>
            <Toggle
              checked={settings.emailEnabled || false}
              onChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
            />
          </div>

          <div className="pl-4 space-y-3 border-l-2 border-stone-200 dark:border-stone-700">
            {[
              { key: 'emailMentions', label: 'Mentions' },
              { key: 'emailAssignments', label: 'Task assignments' },
              { key: 'emailComments', label: 'Comments on your tasks' },
              { key: 'emailDueDates', label: 'Due date reminders' },
              { key: 'emailStatusChanges', label: 'Status changes' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-stone-600 dark:text-stone-400">{label}</span>
                <Toggle
                  checked={(settings as Record<string, boolean>)[key] || false}
                  onChange={(checked) => setSettings({ ...settings, [key]: checked })}
                  disabled={!settings.emailEnabled}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-stone-600 dark:text-stone-400">Email digest</span>
            <select
              value={settings.emailDigest || 'none'}
              onChange={(e) => setSettings({ ...settings, emailDigest: e.target.value as NotificationPreferences['emailDigest'] })}
              disabled={!settings.emailEnabled}
              className="px-3 py-1 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <DeviceMobile size={20} className="text-stone-600 dark:text-stone-400" />
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            Push Notifications
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600 dark:text-stone-400">Enable push notifications</span>
            <Toggle
              checked={settings.pushEnabled || false}
              onChange={(checked) => setSettings({ ...settings, pushEnabled: checked })}
            />
          </div>

          <div className="pl-4 space-y-3 border-l-2 border-stone-200 dark:border-stone-700">
            {[
              { key: 'pushMentions', label: 'Mentions' },
              { key: 'pushAssignments', label: 'Task assignments' },
              { key: 'pushComments', label: 'Comments' },
              { key: 'pushDueDates', label: 'Due date reminders' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-stone-600 dark:text-stone-400">{label}</span>
                <Toggle
                  checked={(settings as Record<string, boolean>)[key] || false}
                  onChange={(checked) => setSettings({ ...settings, [key]: checked })}
                  disabled={!settings.pushEnabled}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Moon size={20} className="text-stone-600 dark:text-stone-400" />
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            Quiet Hours
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600 dark:text-stone-400">Enable quiet hours</span>
            <Toggle
              checked={settings.quietHoursEnabled || false}
              onChange={(checked) => setSettings({ ...settings, quietHoursEnabled: checked })}
            />
          </div>

          {settings.quietHoursEnabled && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-stone-500">From</label>
                <input
                  type="time"
                  value={settings.quietHoursStart || '22:00'}
                  onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-stone-500">To</label>
                <input
                  type="time"
                  value={settings.quietHoursEnd || '08:00'}
                  onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={() => onSave?.(settings as NotificationPreferences)}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
      >
        Save Preferences
      </button>

      <p className="text-xs text-center text-stone-400">
        Notification settings - Full functionality coming soon
      </p>
    </div>
  );
};

export default NotificationSettings;
