// =============================================================================
// INTEGRATIONS TYPES
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export type IntegrationType =
  | 'slack'
  | 'teams'
  | 'github'
  | 'gitlab'
  | 'google_drive'
  | 'dropbox'
  | 'zapier'
  | 'webhook';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  config?: Record<string, unknown>;
  connectedAt?: Date;
  connectedBy?: string;
}

// Slack Integration
export interface SlackIntegrationConfig {
  teamId: string;
  teamName: string;
  accessToken: string;
  botUserId: string;
  channelMappings: SlackChannelMapping[];
}

export interface SlackChannelMapping {
  id: string;
  boardId: string;
  boardName: string;
  channelId: string;
  channelName: string;
  notifyOn: ('create' | 'update' | 'complete' | 'comment' | 'due_date')[];
}

// GitHub Integration
export interface GitHubIntegrationConfig {
  installationId: number;
  accountLogin: string;
  accountType: 'user' | 'organization';
  accessToken: string;
  repos: GitHubRepoMapping[];
}

export interface GitHubRepoMapping {
  id: string;
  boardId: string;
  repoFullName: string;
  syncIssues: boolean;
  syncPRs: boolean;
  autoCreateBranch: boolean;
}

export interface GitHubLink {
  id: string;
  rowId: string;
  type: 'issue' | 'pr' | 'branch';
  githubId: number;
  url: string;
  title: string;
  state: string;
  number: number;
}

// Webhooks
export interface Webhook {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  boardIds: string[]; // Empty for all boards
  active: boolean;
  createdBy: string;
  createdAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}

export type WebhookEvent =
  | 'item.created'
  | 'item.updated'
  | 'item.deleted'
  | 'item.status_changed'
  | 'item.assigned'
  | 'comment.created'
  | 'board.created'
  | 'board.updated'
  | 'member.added';

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  response?: Record<string, unknown>;
  statusCode?: number;
  duration?: number;
  success: boolean;
  createdAt: Date;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  workspace: { id: string; name: string };
  board?: { id: string; name: string };
  item?: Record<string, unknown>;
  user: { id: string; name: string; email: string };
  changes?: { field: string; oldValue: unknown; newValue: unknown }[];
}
