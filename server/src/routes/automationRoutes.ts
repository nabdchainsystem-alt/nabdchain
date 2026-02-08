// =============================================================================
// Automation Routes - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { automationRulesService } from '../services/automationRulesService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ruleType: z.enum(['rfq_rule', 'order_rule', 'inventory_rule', 'dispute_rule']),
  triggerType: z.enum(['rfq_received', 'order_delayed', 'stock_low', 'sla_warning', 'dispute_opened', 'order_status_change']),
  triggerConditions: z.object({
    marginBelow: z.number().optional(),
    marginAbove: z.number().optional(),
    quantityBelow: z.number().optional(),
    quantityAbove: z.number().optional(),
    valueBelow: z.number().optional(),
    valueAbove: z.number().optional(),
    daysOverdue: z.number().optional(),
    statusEquals: z.string().optional(),
    statusNotEquals: z.string().optional(),
    stockBelow: z.number().optional(),
    stockPercentBelow: z.number().optional(),
    slaBreachRisk: z.boolean().optional(),
    slaBreachType: z.string().optional(),
    hoursUntilBreach: z.number().optional(),
    disputeType: z.string().optional(),
    disputeAgeAbove: z.number().optional(),
    buyerTrustBelow: z.number().optional(),
    buyerTrustAbove: z.number().optional(),
    categoryIn: z.array(z.string()).optional(),
    categoryNotIn: z.array(z.string()).optional(),
  }),
  actionType: z.enum(['auto_ignore', 'auto_flag', 'auto_remind', 'auto_respond', 'auto_prioritize', 'auto_hide', 'auto_notify', 'auto_escalate']),
  actionConfig: z.object({
    setStatus: z.string().optional(),
    setPriority: z.enum(['high', 'medium', 'low']).optional(),
    addTag: z.string().optional(),
    sendNotification: z.boolean().optional(),
    notificationType: z.string().optional(),
    notificationMessage: z.string().optional(),
    responseTemplate: z.string().optional(),
    responseMessage: z.string().optional(),
    hideItem: z.boolean().optional(),
    escalateTo: z.string().optional(),
    escalationReason: z.string().optional(),
    reminderDays: z.number().optional(),
    reminderMessage: z.string().optional(),
  }),
  priority: z.number().int().min(1).max(1000).optional(),
  isEnabled: z.boolean().optional(),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  triggerConditions: z.object({
    marginBelow: z.number().optional(),
    marginAbove: z.number().optional(),
    quantityBelow: z.number().optional(),
    quantityAbove: z.number().optional(),
    valueBelow: z.number().optional(),
    valueAbove: z.number().optional(),
    daysOverdue: z.number().optional(),
    statusEquals: z.string().optional(),
    statusNotEquals: z.string().optional(),
    stockBelow: z.number().optional(),
    stockPercentBelow: z.number().optional(),
    slaBreachRisk: z.boolean().optional(),
    slaBreachType: z.string().optional(),
    hoursUntilBreach: z.number().optional(),
    disputeType: z.string().optional(),
    disputeAgeAbove: z.number().optional(),
    buyerTrustBelow: z.number().optional(),
    buyerTrustAbove: z.number().optional(),
    categoryIn: z.array(z.string()).optional(),
    categoryNotIn: z.array(z.string()).optional(),
  }).optional(),
  actionConfig: z.object({
    setStatus: z.string().optional(),
    setPriority: z.enum(['high', 'medium', 'low']).optional(),
    addTag: z.string().optional(),
    sendNotification: z.boolean().optional(),
    notificationType: z.string().optional(),
    notificationMessage: z.string().optional(),
    responseTemplate: z.string().optional(),
    responseMessage: z.string().optional(),
    hideItem: z.boolean().optional(),
    escalateTo: z.string().optional(),
    escalationReason: z.string().optional(),
    reminderDays: z.number().optional(),
    reminderMessage: z.string().optional(),
  }).optional(),
  priority: z.number().int().min(1).max(1000).optional(),
});

const ruleFiltersSchema = z.object({
  ruleType: z.enum(['rfq_rule', 'order_rule', 'inventory_rule', 'dispute_rule']).optional(),
  triggerType: z.enum(['rfq_received', 'order_delayed', 'stock_low', 'sla_warning', 'dispute_opened', 'order_status_change']).optional(),
  isEnabled: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const executionFiltersSchema = z.object({
  ruleId: z.string().uuid().optional(),
  entityType: z.enum(['rfq', 'order', 'item', 'dispute']).optional(),
  actionResult: z.enum(['success', 'failed', 'skipped']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const toggleRuleSchema = z.object({
  enabled: z.boolean(),
});

const createFromTemplateSchema = z.object({
  templateId: z.string(),
  overrides: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    triggerConditions: z.record(z.string(), z.unknown()).optional(),
    actionConfig: z.record(z.string(), z.unknown()).optional(),
    priority: z.number().int().min(1).max(1000).optional(),
    isEnabled: z.boolean().optional(),
  }).optional(),
});

// =============================================================================
// Rule Management Routes
// =============================================================================

/**
 * GET /api/automation/rules
 * List seller's automation rules
 */
router.get('/rules', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = ruleFiltersSchema.parse(req.query);
    const result = await automationRulesService.getSellerRules(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching automation rules:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
});

/**
 * POST /api/automation/rules
 * Create a new automation rule
 */
router.post('/rules', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const input = createRuleSchema.parse(req.body);
    const result = await automationRulesService.createRule(userId, input);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.rule);
  } catch (error) {
    apiLogger.error('Error creating automation rule:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to create automation rule' });
  }
});

/**
 * GET /api/automation/rules/:id
 * Get a single rule with recent executions
 */
router.get('/rules/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rule = await automationRulesService.getRule(userId, req.params.id as string);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    return res.json(rule);
  } catch (error) {
    apiLogger.error('Error fetching rule:', error);
    return res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

/**
 * PUT /api/automation/rules/:id
 * Update an automation rule
 */
router.put('/rules/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const input = updateRuleSchema.parse(req.body);
    const result = await automationRulesService.updateRule(userId, req.params.id as string, input);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.rule);
  } catch (error) {
    apiLogger.error('Error updating rule:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to update rule' });
  }
});

/**
 * DELETE /api/automation/rules/:id
 * Delete an automation rule
 */
router.delete('/rules/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await automationRulesService.deleteRule(userId, req.params.id as string);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error deleting rule:', error);
    return res.status(500).json({ error: 'Failed to delete rule' });
  }
});

/**
 * POST /api/automation/rules/:id/toggle
 * Enable or disable a rule
 */
router.post('/rules/:id/toggle', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = toggleRuleSchema.parse(req.body);
    const result = await automationRulesService.toggleRule(userId, req.params.id as string, body.enabled);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.rule);
  } catch (error) {
    apiLogger.error('Error toggling rule:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to toggle rule' });
  }
});

// =============================================================================
// Execution History Routes
// =============================================================================

/**
 * GET /api/automation/executions
 * Get execution history
 */
router.get('/executions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = executionFiltersSchema.parse(req.query);
    const result = await automationRulesService.getExecutionHistory(userId, filters);

    return res.json(result);
  } catch (error) {
    apiLogger.error('Error fetching execution history:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filters', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to fetch execution history' });
  }
});

/**
 * GET /api/automation/executions/stats
 * Get execution statistics
 */
router.get('/executions/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const period = (req.query.period as 'day' | 'week' | 'month') || 'week';
    const stats = await automationRulesService.getExecutionStats(userId, period);

    return res.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching execution stats:', error);
    return res.status(500).json({ error: 'Failed to fetch execution statistics' });
  }
});

// =============================================================================
// Template Routes
// =============================================================================

/**
 * GET /api/automation/templates
 * Get available rule templates
 */
router.get('/templates', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const templates = automationRulesService.getDefaultRuleTemplates();
    return res.json(templates);
  } catch (error) {
    apiLogger.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * POST /api/automation/templates/create
 * Create a rule from a template
 */
router.post('/templates/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = createFromTemplateSchema.parse(req.body);
    const result = await automationRulesService.createRuleFromTemplate(
      userId,
      body.templateId,
      body.overrides
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.rule);
  } catch (error) {
    apiLogger.error('Error creating rule from template:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    return res.status(500).json({ error: 'Failed to create rule from template' });
  }
});

export default router;
