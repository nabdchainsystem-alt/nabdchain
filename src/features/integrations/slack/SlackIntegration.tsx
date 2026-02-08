import React from 'react';
import { SlackLogo, Check, ArrowRight } from 'phosphor-react';
import { featureLogger } from '@/utils/logger';

// =============================================================================
// SLACK INTEGRATION - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface SlackIntegrationProps {
  isConnected?: boolean;
  teamName?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const SlackIntegration: React.FC<SlackIntegrationProps> = ({
  isConnected = false,
  teamName,
  onConnect,
  onDisconnect,
}) => {
  const handleConnect = () => {
    // Future: Slack OAuth flow
    featureLogger.debug('[Slack] Connect');
    onConnect?.();
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#4A154B] text-white">
        <div className="flex items-center gap-3">
          <SlackLogo size={32} weight="fill" />
          <div>
            <h3 className="font-semibold">Slack Integration</h3>
            <p className="text-sm opacity-80">
              {isConnected ? `Connected to ${teamName}` : 'Connect your Slack workspace'}
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
              <span className="font-medium">Connected to {teamName}</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">Available Features:</h4>
              <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Post updates to Slack channels
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Create tasks from Slack messages
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Use /nabd slash commands
                </li>
              </ul>
            </div>

            <button
              onClick={onDisconnect}
              className="w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              Disconnect Slack
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Connect Slack to receive notifications, create tasks from messages, and keep your team in sync.
            </p>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">What you'll get:</h4>
              <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
                <li className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-blue-500" />
                  Real-time notifications in Slack
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-blue-500" />
                  Create tasks from any message
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-blue-500" />
                  Slash commands (/nabd)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-blue-500" />
                  Interactive buttons in messages
                </li>
              </ul>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-2 text-sm bg-[#4A154B] hover:bg-[#3d1140] text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <SlackLogo size={18} weight="fill" />
              Add to Slack
            </button>
          </div>
        )}
      </div>

      {/* Coming Soon Notice */}
      <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30">
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">Slack integration coming soon</p>
      </div>
    </div>
  );
};

export default SlackIntegration;
