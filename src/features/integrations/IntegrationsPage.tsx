import React, { useState } from 'react';
import {
  Plugs, SlackLogo, GithubLogo, MicrosoftTeamsLogo,
  GoogleLogo, Globe, Lightning, MagnifyingGlass
} from 'phosphor-react';
import type { Integration, IntegrationType } from './types';
import { featureLogger } from '@/utils/logger';

// =============================================================================
// INTEGRATIONS PAGE - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    type: 'slack',
    name: 'Slack',
    description: 'Get notifications and create tasks from Slack',
    icon: 'slack',
    connected: false,
  },
  {
    id: 'github',
    type: 'github',
    name: 'GitHub',
    description: 'Link issues, PRs, and branches to tasks',
    icon: 'github',
    connected: false,
  },
  {
    id: 'teams',
    type: 'teams',
    name: 'Microsoft Teams',
    description: 'Collaborate with your team in Teams',
    icon: 'teams',
    connected: false,
  },
  {
    id: 'google_drive',
    type: 'google_drive',
    name: 'Google Drive',
    description: 'Attach and preview Drive files',
    icon: 'gdrive',
    connected: false,
  },
  {
    id: 'gitlab',
    type: 'gitlab',
    name: 'GitLab',
    description: 'Connect GitLab issues and merge requests',
    icon: 'gitlab',
    connected: false,
  },
  {
    id: 'zapier',
    type: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5000+ apps via Zapier',
    icon: 'zapier',
    connected: false,
  },
];

const getIcon = (type: IntegrationType) => {
  switch (type) {
    case 'slack':
      return SlackLogo;
    case 'github':
    case 'gitlab':
      return GithubLogo;
    case 'teams':
      return MicrosoftTeamsLogo;
    case 'google_drive':
    case 'dropbox':
      return GoogleLogo;
    case 'zapier':
      return Lightning;
    case 'webhook':
      return Globe;
    default:
      return Plugs;
  }
};

export const IntegrationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [integrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);

  const filteredIntegrations = integrations.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedIntegrations = filteredIntegrations.filter((i) => i.connected);
  const availableIntegrations = filteredIntegrations.filter((i) => !i.connected);

  const handleConnect = (integration: Integration) => {
    // TODO: Implement OAuth flow or connection modal
    featureLogger.debug('[Integrations] Connect - NOT IMPLEMENTED', integration);
    alert(`${integration.name} integration coming soon!`);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Plugs size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
                Integrations
              </h1>
              <p className="text-sm text-stone-500">
                Connect your favorite tools
              </p>
            </div>
          </div>
          <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="relative max-w-md">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-10 pr-4 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Connected */}
        {connectedIntegrations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
              Connected
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedIntegrations.map((integration) => {
                const Icon = getIcon(integration.type);
                return (
                  <div
                    key={integration.id}
                    className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                        <Icon size={24} className="text-stone-600 dark:text-stone-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-stone-800 dark:text-stone-200">
                          {integration.name}
                        </h3>
                        <p className="text-xs text-green-500 mt-0.5">Connected</p>
                      </div>
                      <button className="text-xs text-stone-500 hover:text-red-500">
                        Disconnect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available */}
        <div>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Available Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableIntegrations.map((integration) => {
              const Icon = getIcon(integration.type);
              return (
                <div
                  key={integration.id}
                  className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                      <Icon size={24} className="text-stone-600 dark:text-stone-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-stone-800 dark:text-stone-200">
                        {integration.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(integration)}
                    className="w-full mt-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Connect
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Custom Webhooks
          </h2>
          <div className="p-6 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
            <Globe size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Create custom webhooks to integrate with any service
            </p>
            <button className="px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 rounded-lg transition-colors">
              Create Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
