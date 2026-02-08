/**
 * Automation Rules Service — Unit Tests
 *
 * Tests cover: CRUD operations (createRule, updateRule, deleteRule,
 * getSellerRules, getRule, toggleRule), rule evaluation, execution
 * (evaluateRulesForEntity), trigger hooks, execution history, templates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { automationRulesService } from '../../../services/automationRulesService';
import type { CreateRuleInput, RuleContext } from '../../../services/automationRulesService';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Helper: mock rule
// =============================================================================

function mockRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    sellerId: 'seller-1',
    name: 'Test Rule',
    description: 'A test rule',
    ruleType: 'rfq_rule',
    triggerType: 'rfq_received',
    triggerConditions: JSON.stringify({ marginBelow: 5 }),
    actionType: 'auto_ignore',
    actionConfig: JSON.stringify({ setStatus: 'ignored' }),
    priority: 100,
    isEnabled: true,
    triggerCount: 0,
    lastTriggeredAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

// =============================================================================
// createRule
// =============================================================================

describe('automationRulesService.createRule', () => {
  const input: CreateRuleInput = {
    name: 'Low Margin RFQ',
    description: 'Ignore low margin RFQs',
    ruleType: 'rfq_rule',
    triggerType: 'rfq_received',
    triggerConditions: { marginBelow: 5 },
    actionType: 'auto_ignore',
    actionConfig: { setStatus: 'ignored' },
  };

  it('creates a rule and returns success', async () => {
    const createdRule = mockRule({ name: input.name });
    prismaMock.automationRule.create.mockResolvedValue(createdRule);

    const result = await automationRulesService.createRule('seller-1', input);

    expect(result.success).toBe(true);
    expect(result.rule).toBeDefined();
    expect(prismaMock.automationRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerId: 'seller-1',
          name: 'Low Margin RFQ',
          ruleType: 'rfq_rule',
          priority: 100, // default
          isEnabled: true, // default
        }),
      })
    );
  });

  it('serializes triggerConditions and actionConfig as JSON', async () => {
    prismaMock.automationRule.create.mockResolvedValue(mockRule());

    await automationRulesService.createRule('seller-1', input);

    const callData = prismaMock.automationRule.create.mock.calls[0][0].data;
    expect(callData.triggerConditions).toBe(JSON.stringify({ marginBelow: 5 }));
    expect(callData.actionConfig).toBe(JSON.stringify({ setStatus: 'ignored' }));
  });

  it('uses provided priority and isEnabled', async () => {
    prismaMock.automationRule.create.mockResolvedValue(mockRule());

    await automationRulesService.createRule('seller-1', {
      ...input,
      priority: 10,
      isEnabled: false,
    });

    const callData = prismaMock.automationRule.create.mock.calls[0][0].data;
    expect(callData.priority).toBe(10);
    expect(callData.isEnabled).toBe(false);
  });

  it('returns failure on DB error', async () => {
    prismaMock.automationRule.create.mockRejectedValue(new Error('DB error'));

    const result = await automationRulesService.createRule('seller-1', input);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to create automation rule');
  });
});

// =============================================================================
// updateRule
// =============================================================================

describe('automationRulesService.updateRule', () => {
  it('updates rule when seller owns it', async () => {
    prismaMock.automationRule.findFirst.mockResolvedValue(mockRule());
    prismaMock.automationRule.update.mockResolvedValue(
      mockRule({ name: 'Updated Rule' })
    );

    const result = await automationRulesService.updateRule('seller-1', 'rule-1', {
      name: 'Updated Rule',
    });

    expect(result.success).toBe(true);
    expect(prismaMock.automationRule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rule-1' },
        data: expect.objectContaining({ name: 'Updated Rule' }),
      })
    );
  });

  it('returns failure when rule not found', async () => {
    prismaMock.automationRule.findFirst.mockResolvedValue(null);

    const result = await automationRulesService.updateRule('seller-1', 'rule-999', {
      name: 'Updated',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Rule not found');
  });

  it('serializes triggerConditions when provided', async () => {
    prismaMock.automationRule.findFirst.mockResolvedValue(mockRule());
    prismaMock.automationRule.update.mockResolvedValue(mockRule());

    await automationRulesService.updateRule('seller-1', 'rule-1', {
      triggerConditions: { marginBelow: 10 },
    });

    const callData = prismaMock.automationRule.update.mock.calls[0][0].data;
    expect(callData.triggerConditions).toBe(JSON.stringify({ marginBelow: 10 }));
  });
});

// =============================================================================
// deleteRule
// =============================================================================

describe('automationRulesService.deleteRule', () => {
  it('deletes rule when seller owns it', async () => {
    prismaMock.automationRule.findFirst.mockResolvedValue(mockRule());
    prismaMock.automationRule.delete.mockResolvedValue(mockRule());

    const result = await automationRulesService.deleteRule('seller-1', 'rule-1');
    expect(result.success).toBe(true);
    expect(prismaMock.automationRule.delete).toHaveBeenCalledWith({ where: { id: 'rule-1' } });
  });

  it('returns failure when rule not found', async () => {
    prismaMock.automationRule.findFirst.mockResolvedValue(null);

    const result = await automationRulesService.deleteRule('seller-1', 'rule-999');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Rule not found');
  });
});

// =============================================================================
// getSellerRules
// =============================================================================

describe('automationRulesService.getSellerRules', () => {
  it('returns rules with pagination', async () => {
    const rules = [
      mockRule({ id: 'r1', _count: { executions: 5 } }),
      mockRule({ id: 'r2', _count: { executions: 2 } }),
    ];
    prismaMock.automationRule.findMany.mockResolvedValue(rules);
    prismaMock.automationRule.count.mockResolvedValue(2);

    const result = await automationRulesService.getSellerRules('seller-1');

    expect(result.rules).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(50);
  });

  it('applies ruleType filter', async () => {
    prismaMock.automationRule.findMany.mockResolvedValue([]);
    prismaMock.automationRule.count.mockResolvedValue(0);

    await automationRulesService.getSellerRules('seller-1', { ruleType: 'order_rule' });

    expect(prismaMock.automationRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sellerId: 'seller-1',
          ruleType: 'order_rule',
        }),
      })
    );
  });

  it('applies isEnabled filter', async () => {
    prismaMock.automationRule.findMany.mockResolvedValue([]);
    prismaMock.automationRule.count.mockResolvedValue(0);

    await automationRulesService.getSellerRules('seller-1', { isEnabled: true });

    expect(prismaMock.automationRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isEnabled: true }),
      })
    );
  });

  it('returns empty rules on DB error', async () => {
    prismaMock.automationRule.findMany.mockRejectedValue(new Error('DB'));

    const result = await automationRulesService.getSellerRules('seller-1');
    expect(result.rules).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});

// =============================================================================
// getRule
// =============================================================================

describe('automationRulesService.getRule', () => {
  it('returns parsed rule with executions', async () => {
    const rule = mockRule({
      executions: [
        {
          id: 'exec-1',
          triggerData: JSON.stringify({ entityId: 'rfq-1' }),
          executedAt: new Date(),
        },
      ],
    });
    prismaMock.automationRule.findFirst.mockResolvedValue(rule);

    const result = await automationRulesService.getRule('seller-1', 'rule-1');

    expect(result).not.toBeNull();
    expect(result!.triggerConditions).toEqual({ marginBelow: 5 });
    expect(result!.actionConfig).toEqual({ setStatus: 'ignored' });
  });

  it('returns null when rule not found', async () => {
    prismaMock.automationRule.findFirst.mockResolvedValue(null);

    const result = await automationRulesService.getRule('seller-1', 'rule-999');
    expect(result).toBeNull();
  });
});

// =============================================================================
// toggleRule
// =============================================================================

describe('automationRulesService.toggleRule', () => {
  it('enables a disabled rule', async () => {
    prismaMock.automationRule.findFirst.mockResolvedValue(mockRule({ isEnabled: false }));
    prismaMock.automationRule.update.mockResolvedValue(mockRule({ isEnabled: true }));

    const result = await automationRulesService.toggleRule('seller-1', 'rule-1', true);

    expect(result.success).toBe(true);
    expect(prismaMock.automationRule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isEnabled: true },
      })
    );
  });

  it('returns failure when rule not found', async () => {
    prismaMock.automationRule.findFirst.mockResolvedValue(null);

    const result = await automationRulesService.toggleRule('seller-1', 'rule-999', true);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Rule not found');
  });
});

// =============================================================================
// evaluateRulesForEntity
// =============================================================================

describe('automationRulesService.evaluateRulesForEntity', () => {
  it('evaluates matching rule and executes action', async () => {
    const rule = mockRule({
      triggerConditions: JSON.stringify({ marginBelow: 5 }),
      actionType: 'auto_ignore',
      actionConfig: JSON.stringify({ setStatus: 'ignored' }),
    });
    prismaMock.automationRule.findMany.mockResolvedValue([rule]);
    prismaMock.rFQ.update.mockResolvedValue({});
    prismaMock.automationExecution.create.mockResolvedValue({});
    prismaMock.automationRule.update.mockResolvedValue(rule);

    const context: RuleContext = {
      entityId: 'rfq-1',
      entityData: {},
      sellerId: 'seller-1',
      margin: 3, // below 5, should match
    };

    const result = await automationRulesService.evaluateRulesForEntity(
      'rfq', 'rfq-1', 'seller-1', context
    );

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].matched).toBe(true);
    expect(result.results[0].executed).toBe(true);
  });

  it('does not execute when conditions do not match', async () => {
    const rule = mockRule({
      triggerConditions: JSON.stringify({ marginBelow: 5 }),
    });
    prismaMock.automationRule.findMany.mockResolvedValue([rule]);

    const context: RuleContext = {
      entityId: 'rfq-1',
      entityData: {},
      sellerId: 'seller-1',
      margin: 10, // above 5, should NOT match
    };

    const result = await automationRulesService.evaluateRulesForEntity(
      'rfq', 'rfq-1', 'seller-1', context
    );

    expect(result.results[0].matched).toBe(false);
    expect(result.results[0].executed).toBe(false);
    expect(prismaMock.automationExecution.create).not.toHaveBeenCalled();
  });

  it('handles empty conditions (matches everything)', async () => {
    const rule = mockRule({
      triggerConditions: JSON.stringify({}),
      actionType: 'auto_notify',
      actionConfig: JSON.stringify({ sendNotification: true, notificationMessage: 'test' }),
    });
    prismaMock.automationRule.findMany.mockResolvedValue([rule]);
    prismaMock.automationExecution.create.mockResolvedValue({});
    prismaMock.automationRule.update.mockResolvedValue(rule);

    const context: RuleContext = {
      entityId: 'dispute-1',
      entityData: {},
      sellerId: 'seller-1',
    };

    const result = await automationRulesService.evaluateRulesForEntity(
      'dispute', 'dispute-1', 'seller-1', context
    );

    expect(result.results[0].matched).toBe(true);
  });

  it('returns failure on DB error', async () => {
    prismaMock.automationRule.findMany.mockRejectedValue(new Error('DB error'));

    const context: RuleContext = {
      entityId: 'rfq-1',
      entityData: {},
      sellerId: 'seller-1',
    };

    const result = await automationRulesService.evaluateRulesForEntity(
      'rfq', 'rfq-1', 'seller-1', context
    );

    expect(result.success).toBe(false);
    expect(result.results).toEqual([]);
  });
});

// =============================================================================
// getExecutionHistory
// =============================================================================

describe('automationRulesService.getExecutionHistory', () => {
  it('returns execution logs with pagination', async () => {
    const executions = [
      {
        id: 'exec-1',
        ruleId: 'rule-1',
        triggerData: JSON.stringify({ entityId: 'rfq-1' }),
        rule: { name: 'Test Rule', ruleType: 'rfq_rule', actionType: 'auto_ignore' },
      },
    ];
    prismaMock.automationExecution.findMany.mockResolvedValue(executions);
    prismaMock.automationExecution.count.mockResolvedValue(1);

    const result = await automationRulesService.getExecutionHistory('seller-1');

    expect(result.executions).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('applies date range filters', async () => {
    prismaMock.automationExecution.findMany.mockResolvedValue([]);
    prismaMock.automationExecution.count.mockResolvedValue(0);

    await automationRulesService.getExecutionHistory('seller-1', {
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    expect(prismaMock.automationExecution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          executedAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('returns empty on DB error', async () => {
    prismaMock.automationExecution.findMany.mockRejectedValue(new Error('DB'));

    const result = await automationRulesService.getExecutionHistory('seller-1');
    expect(result.executions).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});

// =============================================================================
// getExecutionStats
// =============================================================================

describe('automationRulesService.getExecutionStats', () => {
  it('returns execution statistics', async () => {
    prismaMock.automationExecution.count
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(85)  // successful
      .mockResolvedValueOnce(10); // failed
    prismaMock.automationExecution.groupBy.mockResolvedValue([
      { entityType: 'rfq', _count: 60 },
      { entityType: 'order', _count: 40 },
    ]);

    const result = await automationRulesService.getExecutionStats('seller-1', 'week');

    expect(result.total).toBe(100);
    expect(result.successful).toBe(85);
    expect(result.failed).toBe(10);
    expect(result.skipped).toBe(5); // 100 - 85 - 10
    expect(result.successRate).toBe(85);
    expect(result.byEntityType).toEqual({ rfq: 60, order: 40 });
  });

  it('handles zero total executions', async () => {
    prismaMock.automationExecution.count.mockResolvedValue(0);
    prismaMock.automationExecution.groupBy.mockResolvedValue([]);

    const result = await automationRulesService.getExecutionStats('seller-1');
    expect(result.total).toBe(0);
    expect(result.successRate).toBe(0);
  });

  it('returns zeros on DB error', async () => {
    prismaMock.automationExecution.count.mockRejectedValue(new Error('DB'));

    const result = await automationRulesService.getExecutionStats('seller-1');
    expect(result.total).toBe(0);
    expect(result.successful).toBe(0);
  });
});

// =============================================================================
// Templates
// =============================================================================

describe('automationRulesService.getDefaultRuleTemplates', () => {
  it('returns array of templates', () => {
    const templates = automationRulesService.getDefaultRuleTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0].id).toBeDefined();
    expect(templates[0].name).toBeDefined();
    expect(templates[0].ruleType).toBeDefined();
  });

  it('contains templates for all rule types', () => {
    const templates = automationRulesService.getDefaultRuleTemplates();
    const types = new Set(templates.map((t) => t.ruleType));
    expect(types.has('rfq_rule')).toBe(true);
    expect(types.has('order_rule')).toBe(true);
    expect(types.has('inventory_rule')).toBe(true);
    expect(types.has('dispute_rule')).toBe(true);
  });
});

describe('automationRulesService.createRuleFromTemplate', () => {
  it('creates rule from valid template', async () => {
    prismaMock.automationRule.create.mockResolvedValue(mockRule());

    const result = await automationRulesService.createRuleFromTemplate('seller-1', 'rfq-low-margin');

    expect(result.success).toBe(true);
    expect(prismaMock.automationRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Auto-ignore Low Margin RFQs',
          ruleType: 'rfq_rule',
        }),
      })
    );
  });

  it('applies overrides to template', async () => {
    prismaMock.automationRule.create.mockResolvedValue(mockRule());

    await automationRulesService.createRuleFromTemplate('seller-1', 'rfq-low-margin', {
      name: 'Custom Name',
      priority: 1,
    });

    const callData = prismaMock.automationRule.create.mock.calls[0][0].data;
    expect(callData.name).toBe('Custom Name');
    expect(callData.priority).toBe(1);
  });

  it('returns failure for unknown template', async () => {
    const result = await automationRulesService.createRuleFromTemplate('seller-1', 'nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Template not found');
  });
});
