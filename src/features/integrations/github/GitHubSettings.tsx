import React from 'react';
import { GithubLogo, GitBranch, GitPullRequest, Folder } from 'phosphor-react';
import type { GitHubRepoMapping } from '../types';

// =============================================================================
// GITHUB SETTINGS - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface GitHubSettingsProps {
  accountName?: string;
  repoMappings?: GitHubRepoMapping[];
  onSave?: (mappings: GitHubRepoMapping[]) => void;
}

export const GitHubSettings: React.FC<GitHubSettingsProps> = ({
  accountName = 'your-org',
  repoMappings = [],
  onSave,
}) => {
  return (
    <div className="space-y-6">
      {/* Connected Account */}
      <div className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
        <GithubLogo size={32} className="text-[#24292e] dark:text-white" weight="fill" />
        <div>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Connected to
          </p>
          <p className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {accountName}
          </p>
        </div>
      </div>

      {/* Repository Mappings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-stone-700 dark:text-stone-300">
            Repository Mappings
          </h3>
          <button className="text-sm text-blue-500 hover:text-blue-600">
            + Add Repository
          </button>
        </div>

        {repoMappings.length === 0 ? (
          <div className="p-6 bg-stone-50 dark:bg-stone-800 rounded-lg text-center">
            <Folder size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
            <p className="text-sm text-stone-500">No repositories connected</p>
            <p className="text-xs text-stone-400 mt-1">
              Connect repositories to sync issues and PRs
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {repoMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Folder size={16} className="text-stone-400" />
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {mapping.repoFullName}
                    </span>
                  </div>
                  <button className="text-xs text-red-500 hover:text-red-600">
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={mapping.syncIssues} readOnly className="rounded" />
                    Sync Issues
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={mapping.syncPRs} readOnly className="rounded" />
                    Sync PRs
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={mapping.autoCreateBranch} readOnly className="rounded" />
                    Auto-create branch
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Options */}
      <div>
        <h3 className="font-medium text-stone-700 dark:text-stone-300 mb-3">
          Sync Options
        </h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-stone-400" />
              <span className="text-sm text-stone-600 dark:text-stone-400">
                Auto-create branch from task
              </span>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
          <label className="flex items-center justify-between p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded">
            <div className="flex items-center gap-2">
              <GitPullRequest size={16} className="text-stone-400" />
              <span className="text-sm text-stone-600 dark:text-stone-400">
                Complete task when PR merged
              </span>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={() => onSave?.(repoMappings)}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
      >
        Save Settings
      </button>

      <p className="text-xs text-center text-stone-400">
        Full GitHub integration coming soon
      </p>
    </div>
  );
};

export default GitHubSettings;
