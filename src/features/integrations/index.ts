// =============================================================================
// INTEGRATIONS FEATURE MODULE
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

// Main components
export { IntegrationsPage } from './IntegrationsPage';
export { IntegrationCard } from './components/IntegrationCard';
export { IntegrationSettings } from './components/IntegrationSettings';

// Slack
export { SlackIntegration } from './slack/SlackIntegration';
export { SlackSettings } from './slack/SlackSettings';

// GitHub
export { GitHubIntegration } from './github/GitHubIntegration';
export { GitHubSettings } from './github/GitHubSettings';

// Webhooks
export { WebhooksManager } from './webhooks/WebhooksManager';
export { WebhookForm } from './webhooks/WebhookForm';

// Types
export * from './types';
