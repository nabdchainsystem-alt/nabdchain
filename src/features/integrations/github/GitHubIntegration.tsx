import React from 'react';
import { GithubLogo, Check, ArrowRight, GitBranch, GitPullRequest } from 'phosphor-react';
import { featureLogger } from '@/utils/logger';

// =============================================================================
// GITHUB INTEGRATION - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface GitHubIntegrationProps {
  isConnected?: boolean;
  accountName?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const GitHubIntegration: React.FC<GitHubIntegrationProps> = ({
  isConnected = false,
  accountName,
  onConnect,
  onDisconnect,
}) => {
  const handleConnect = () => {
    // TODO: Implement GitHub OAuth/App installation flow
    featureLogger.debug('[GitHub] Connect - NOT IMPLEMENTED');
    onConnect?.();
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#24292e] text-white">
        <div className="flex items-center gap-3">
          <GithubLogo size={32} weight="fill" />
          <div>
            <h3 className="font-semibold">GitHub Integration</h3>
            <p className="text-sm opacity-80">
              {isConnected ? `Connected to ${accountName}` : 'Connect your GitHub account'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check size={20} weight="bold" />
              <span className="font-medium">Connected to {accountName}</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Available Features:
              </h4>
              <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Link issues to tasks
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Track PR status on tasks
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Auto-create branches from tasks
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Auto-update status on PR merge
                </li>
              </ul>
            </div>

            <button
              onClick={onDisconnect}
              className="w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              Disconnect GitHub
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Connect GitHub to link issues, pull requests, and branches to your tasks.
            </p>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                What you'll get:
              </h4>
              <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
                <li className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-blue-500" />
                  Sync GitHub issues ↔ tasks
                </li>
                <li className="flex items-center gap-2">
                  <GitPullRequest size={14} className="text-blue-500" />
                  See PR status on tasks
                </li>
                <li className="flex items-center gap-2">
                  <GitBranch size={14} className="text-blue-500" />
                  Create branches from tasks
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-blue-500" />
                  Auto-complete tasks on merge
                </li>
              </ul>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-2 text-sm bg-[#24292e] hover:bg-[#1b1f23] text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <GithubLogo size={18} weight="fill" />
              Connect GitHub
            </button>
          </div>
        )}
      </div>

      {/* Coming Soon Notice */}
      <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30">
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          GitHub integration coming soon
        </p>
      </div>
    </div>
  );
};

export default GitHubIntegration;
