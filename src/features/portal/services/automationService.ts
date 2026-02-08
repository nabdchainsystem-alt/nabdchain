// =============================================================================
// Automation Service - Frontend API Client for Automation Rules
// =============================================================================

import { API_URL } from '../../../config/api';
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
  async getRules(token: string, filters: RuleFilters = {}): Promise<RulesResponse> {
    const url = new URL(`${API_URL}/automation/rules`);

    if (filters.ruleType) url.searchParams.append('ruleType', filters.ruleType);
    if (filters.triggerType) url.searchParams.append('triggerType', filters.triggerType);
    if (filters.isEnabled !== undefined) url.searchParams.append('isEnabled', String(filters.isEnabled));
    if (filters.page) url.searchParams.append('page', String(filters.page));
    if (filters.limit) url.searchParams.append('limit', String(filters.limit));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch automation rules');
    }

    return response.json();
  },

  /**
   * Get a single rule by ID
   */
  async getRule(token: string, ruleId: string): Promise<AutomationRule> {
    const response = await fetch(`${API_URL}/automation/rules/${ruleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rule');
    }

    return response.json();
  },

  /**
   * Create a new automation rule
   */
  async createRule(token: string, input: CreateRuleInput): Promise<AutomationRule> {
    const response = await fetch(`${API_URL}/automation/rules`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create automation rule');
    }

    return response.json();
  },

  /**
   * Update an existing rule
   */
  async updateRule(token: string, ruleId: string, input: UpdateRuleInput): Promise<AutomationRule> {
    const response = await fetch(`${API_URL}/automation/rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update rule');
    }

    return response.json();
  },

  /**
   * Delete a rule
   */
  async deleteRule(token: string, ruleId: string): Promise<void> {
    const response = await fetch(`${API_URL}/automation/rules/${ruleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete rule');
    }
  },

  /**
   * Toggle rule enabled/disabled
   */
  async toggleRule(token: string, ruleId: string, enabled: boolean): Promise<AutomationRule> {
    const response = await fetch(`${API_URL}/automation/rules/${ruleId}/toggle`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle rule');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Execution History
  // ---------------------------------------------------------------------------

  /**
   * Get execution history
   */
  async getExecutions(token: string, filters: ExecutionFilters = {}): Promise<ExecutionsResponse> {
    const url = new URL(`${API_URL}/automation/executions`);

    if (filters.ruleId) url.searchParams.append('ruleId', filters.ruleId);
    if (filters.entityType) url.searchParams.append('entityType', filters.entityType);
    if (filters.actionResult) url.searchParams.append('actionResult', filters.actionResult);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.page) url.searchParams.append('page', String(filters.page));
    if (filters.limit) url.searchParams.append('limit', String(filters.limit));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch execution history');
    }

    return response.json();
  },

  /**
   * Get execution statistics
   */
  async getExecutionStats(token: string, period: 'day' | 'week' | 'month' = 'week'): Promise<ExecutionStats> {
    const response = await fetch(`${API_URL}/automation/executions/stats?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch execution stats');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------

  /**
   * Get available rule templates
   */
  async getTemplates(token: string): Promise<RuleTemplate[]> {
    const response = await fetch(`${API_URL}/automation/templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch templates');
    }

    return response.json();
  },

  /**
   * Create a rule from a template
   */
  async createFromTemplate(
    token: string,
    templateId: string,
    overrides?: Partial<CreateRuleInput>,
  ): Promise<AutomationRule> {
    const response = await fetch(`${API_URL}/automation/templates/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateId, overrides }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create rule from template');
    }

    return response.json();
  },
};

export default automationService;
