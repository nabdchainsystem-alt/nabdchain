// =============================================================================
// Automation Service - Frontend API Client for Automation Rules
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  AutomationRule,
  RuleTemplate,
  CreateRuleInput,
  UpdateRuleInput,
  RuleFilters,
  ExecutionFilters,
  ExecutionStats,
  RulesResponse,
  ExecutionsResponse,
} from '../types/automation.types';

// =============================================================================
// Automation Service
// =============================================================================

export const automationService = {
  // ---------------------------------------------------------------------------
  // Rule Management
  // ---------------------------------------------------------------------------

  /**
   * Get all automation rules for the seller
   */
  async getRules(filters: RuleFilters = {}): Promise<RulesResponse> {
    const params = new URLSearchParams();

    if (filters.ruleType) params.append('ruleType', filters.ruleType);
    if (filters.triggerType) params.append('triggerType', filters.triggerType);
    if (filters.isEnabled !== undefined) params.append('isEnabled', String(filters.isEnabled));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    return portalApiClient.get<RulesResponse>(`/api/automation/rules${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get a single rule by ID
   */
  async getRule(ruleId: string): Promise<AutomationRule> {
    return portalApiClient.get<AutomationRule>(`/api/automation/rules/${ruleId}`);
  },

  /**
   * Create a new automation rule
   */
  async createRule(input: CreateRuleInput): Promise<AutomationRule> {
    return portalApiClient.post<AutomationRule>('/api/automation/rules', input);
  },

  /**
   * Update an existing rule
   */
  async updateRule(ruleId: string, input: UpdateRuleInput): Promise<AutomationRule> {
    return portalApiClient.put<AutomationRule>(`/api/automation/rules/${ruleId}`, input);
  },

  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    return portalApiClient.delete<void>(`/api/automation/rules/${ruleId}`);
  },

  /**
   * Toggle rule enabled/disabled
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<AutomationRule> {
    return portalApiClient.post<AutomationRule>(`/api/automation/rules/${ruleId}/toggle`, { enabled });
  },

  // ---------------------------------------------------------------------------
  // Execution History
  // ---------------------------------------------------------------------------

  /**
   * Get execution history
   */
  async getExecutions(filters: ExecutionFilters = {}): Promise<ExecutionsResponse> {
    const params = new URLSearchParams();

    if (filters.ruleId) params.append('ruleId', filters.ruleId);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.actionResult) params.append('actionResult', filters.actionResult);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    return portalApiClient.get<ExecutionsResponse>(`/api/automation/executions${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get execution statistics
   */
  async getExecutionStats(period: 'day' | 'week' | 'month' = 'week'): Promise<ExecutionStats> {
    return portalApiClient.get<ExecutionStats>(`/api/automation/executions/stats?period=${period}`);
  },

  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------

  /**
   * Get available rule templates
   */
  async getTemplates(): Promise<RuleTemplate[]> {
    return portalApiClient.get<RuleTemplate[]>('/api/automation/templates');
  },

  /**
   * Create a rule from a template
   */
  async createFromTemplate(templateId: string, overrides?: Partial<CreateRuleInput>): Promise<AutomationRule> {
    return portalApiClient.post<AutomationRule>('/api/automation/templates/create', { templateId, overrides });
  },
};

export default automationService;
