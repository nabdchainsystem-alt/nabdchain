import React from 'react';
import { Check, Gear, Plugs } from 'phosphor-react';
import type { Integration } from '../types';

// =============================================================================
// INTEGRATION CARD - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface IntegrationCardProps {
  integration: Integration;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSettings?: () => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onDisconnect,
  onSettings,
}) => {
  return (
    <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
          <Plugs size={24} className="text-stone-600 dark:text-stone-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-stone-800 dark:text-stone-200">
              {integration.name}
            </h3>
            {integration.connected && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                <Check size={10} weight="bold" />
                Connected
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
            {integration.description}
          </p>
        </div>

        {/* Actions */}
        {integration.connected && (
          <button
            onClick={onSettings}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
            title="Settings"
          >
            <Gear size={16} className="text-stone-500" />
          </button>
        )}
      </div>

      {/* Connect/Disconnect Button */}
      <div className="mt-4">
        {integration.connected ? (
          <button
            onClick={onDisconnect}
            className="w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="w-full py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Connect
          </button>
        )}
      </div>

      {/* Connected Info */}
      {integration.connected && integration.connectedAt && (
        <p className="mt-2 text-[10px] text-stone-400 text-center">
          Connected {new Date(integration.connectedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default IntegrationCard;
