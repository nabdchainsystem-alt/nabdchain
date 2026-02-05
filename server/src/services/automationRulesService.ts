// =============================================================================
// Automation Rules Service - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export type RuleType = 'rfq_rule' | 'order_rule' | 'inventory_rule' | 'dispute_rule';
export type TriggerType = 'rfq_received' | 'order_delayed' | 'stock_low' | 'sla_warning' | 'dispute_opened' | 'order_status_change';
export type ActionType = 'auto_ignore' | 'auto_flag' | 'auto_remind' | 'auto_respond' | 'auto_prioritize' | 'auto_hide' | 'auto_notify' | 'auto_escalate';
export type ActionResult = 'success' | 'failed' | 'skipped';
export type EntityType = 'rfq' | 'order' | 'item' | 'dispute';

export interface TriggerConditions {
  // RFQ conditions
  marginBelow?: number;
  marginAbove?: number;
  quantityBelow?: number;
  quantityAbove?: number;
  valueBelow?: number;
  valueAbove?: number;

  // Order conditions
  daysOverdue?: number;
  statusEquals?: string;
  statusNotEquals?: string;

  // Inventory conditions
  stockBelow?: number;
  stockPercentBelow?: number;

  // SLA conditions
  slaBreachRisk?: boolean;
  slaBreachType?: string;
  hoursUntilBreach?: number;

  // Dispute conditions
  disputeType?: string;
  disputeAgeAbove?: number;

  // General conditions
  buyerTrustBelow?: number;
  buyerTrustAbove?: number;
  categoryIn?: string[];
  categoryNotIn?: string[];
}

export interface ActionConfig {
  // Flag/Priority
  setStatus?: string;
  setPriority?: 'high' | 'medium' | 'low';
  addTag?: string;

  // Notifications
  sendNotification?: boolean;
  notificationType?: string;
  notificationMessage?: string;

  // Auto-respond
  responseTemplate?: string;
  responseMessage?: string;

  // Inventory
  hideItem?: boolean;

  // Escalation
  escalateTo?: string;
  escalationReason?: string;

  // Reminder
  reminderDays?: number;
  reminderMessage?: string;
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  ruleType: RuleType;
  triggerType: TriggerType;
  triggerConditions: TriggerConditions;
  actionType: ActionType;
  actionConfig: ActionConfig;
  priority?: number;
  isEnabled?: boolean;
}

export interface UpdateRuleInput {
  name?: string;
  description?: string;
  triggerConditions?: TriggerConditions;
  actionConfig?: ActionConfig;
  priority?: number;
}

export interface RuleFilters {
  ruleType?: RuleType;
  triggerType?: TriggerType;
  isEnabled?: boolean;
  page?: number;
  limit?: number;
}

export interface ExecutionFilters {
  ruleId?: string;
  entityType?: EntityType;
  actionResult?: ActionResult;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface RuleContext {
  // Entity data
  entityId: string;
  entityNumber?: string;
  entityData: Record<string, unknown>;

  // Related data
  buyerId?: string;
  buyerTrustScore?: number;
  sellerId: string;

  // Computed values
  margin?: number;
  totalValue?: number;
  quantity?: number;
  daysOverdue?: number;
  currentStock?: number;
  stockPercent?: number;
  hoursUntilSLABreach?: number;
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  ruleType: RuleType;
  triggerType: TriggerType;
  triggerConditions: TriggerConditions;
  actionType: ActionType;
  actionConfig: ActionConfig;
  category: string;
}

// =============================================================================
// Default Rule Templates
// =============================================================================

const DEFAULT_TEMPLATES: RuleTemplate[] = [
  // RFQ Rules
  {
    id: 'rfq-low-margin',
    name: 'Auto-ignore Low Margin RFQs',
    description: 'Automatically ignore RFQs with profit margin below threshold',
    ruleType: 'rfq_rule',
    triggerType: 'rfq_received',
    triggerConditions: { marginBelow: 5 },
    actionType: 'auto_ignore',
    actionConfig: { setStatus: 'ignored', sendNotification: false },
    category: 'RFQ Management',
  },
  {
    id: 'rfq-high-value',
    name: 'Prioritize High-Value RFQs',
    description: 'Automatically flag high-value RFQs for priority handling',
    ruleType: 'rfq_rule',
    triggerType: 'rfq_received',
    triggerConditions: { valueAbove: 50000 },
    actionType: 'auto_prioritize',
    actionConfig: { setPriority: 'high', sendNotification: true, notificationMessage: 'High-value RFQ received' },
    category: 'RFQ Management',
  },
  {
    id: 'rfq-trusted-buyer',
    name: 'Fast-track Trusted Buyer RFQs',
    description: 'Prioritize RFQs from buyers with high trust scores',
    ruleType: 'rfq_rule',
    triggerType: 'rfq_received',
    triggerConditions: { buyerTrustAbove: 85 },
    actionType: 'auto_prioritize',
    actionConfig: { setPriority: 'high', addTag: 'trusted-buyer' },
    category: 'RFQ Management',
  },

  // Order Rules
  {
    id: 'order-delayed',
    name: 'Flag Delayed Orders',
    description: 'Automatically flag orders that are overdue',
    ruleType: 'order_rule',
    triggerType: 'order_delayed',
    triggerConditions: { daysOverdue: 2 },
    actionType: 'auto_flag',
    actionConfig: { setStatus: 'flagged', sendNotification: true, notificationMessage: 'Order is overdue by {daysOverdue} days' },
    category: 'Order Management',
  },
  {
    id: 'order-sla-warning',
    name: 'SLA Breach Warning',
    description: 'Send reminder before SLA deadline approaches',
    ruleType: 'order_rule',
    triggerType: 'sla_warning',
    triggerConditions: { hoursUntilBreach: 24 },
    actionType: 'auto_remind',
    actionConfig: { sendNotification: true, notificationMessage: 'SLA deadline approaching in 24 hours' },
    category: 'Order Management',
  },

  // Inventory Rules
  {
    id: 'inventory-low-stock',
    name: 'Low Stock Alert',
    description: 'Notify when item stock falls below threshold',
    ruleType: 'inventory_rule',
    triggerType: 'stock_low',
    triggerConditions: { stockBelow: 10 },
    actionType: 'auto_notify',
    actionConfig: { sendNotification: true, notificationMessage: 'Stock running low for {itemName}' },
    category: 'Inventory Management',
  },
  {
    id: 'inventory-out-of-stock',
    name: 'Auto-hide Out of Stock Items',
    description: 'Automatically hide items when stock reaches zero',
    ruleType: 'inventory_rule',
    triggerType: 'stock_low',
    triggerConditions: { stockBelow: 1 },
    actionType: 'auto_hide',
    actionConfig: { hideItem: true, sendNotification: true, notificationMessage: 'Item hidden due to zero stock' },
    category: 'Inventory Management',
  },

  // Dispute Rules
  {
    id: 'dispute-auto-respond',
    name: 'Auto-respond to Disputes',
    description: 'Send automatic acknowledgment when dispute is opened',
    ruleType: 'dispute_rule',
    triggerType: 'dispute_opened',
    triggerConditions: {},
    actionType: 'auto_respond',
    actionConfig: {
      responseTemplate: 'dispute_acknowledgment',
      responseMessage: 'We have received your dispute and will review it within 24 hours.'
    },
    category: 'Dispute Management',
  },
  {
    id: 'dispute-escalate-old',
    name: 'Escalate Stale Disputes',
    description: 'Escalate disputes that remain unresolved for too long',
    ruleType: 'dispute_rule',
    triggerType: 'dispute_opened',
    triggerConditions: { disputeAgeAbove: 7 },
    actionType: 'auto_escalate',
    actionConfig: {
      escalateTo: 'admin',
      escalationReason: 'Dispute unresolved after 7 days',
      sendNotification: true
    },
    category: 'Dispute Management',
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

function evaluateConditions(conditions: TriggerConditions, context: RuleContext): boolean {
  // Check margin conditions
  if (conditions.marginBelow !== undefined && context.margin !== undefined) {
    if (context.margin >= conditions.marginBelow) return false;
  }
  if (conditions.marginAbove !== undefined && context.margin !== undefined) {
    if (context.margin <= conditions.marginAbove) return false;
  }

  // Check quantity conditions
  if (conditions.quantityBelow !== undefined && context.quantity !== undefined) {
    if (context.quantity >= conditions.quantityBelow) return false;
  }
  if (conditions.quantityAbove !== undefined && context.quantity !== undefined) {
    if (context.quantity <= conditions.quantityAbove) return false;
  }

  // Check value conditions
  if (conditions.valueBelow !== undefined && context.totalValue !== undefined) {
    if (context.totalValue >= conditions.valueBelow) return false;
  }
  if (conditions.valueAbove !== undefined && context.totalValue !== undefined) {
    if (context.totalValue <= conditions.valueAbove) return false;
  }

  // Check overdue conditions
  if (conditions.daysOverdue !== undefined && context.daysOverdue !== undefined) {
    if (context.daysOverdue < conditions.daysOverdue) return false;
  }

  // Check stock conditions
  if (conditions.stockBelow !== undefined && context.currentStock !== undefined) {
    if (context.currentStock >= conditions.stockBelow) return false;
  }
  if (conditions.stockPercentBelow !== undefined && context.stockPercent !== undefined) {
    if (context.stockPercent >= conditions.stockPercentBelow) return false;
  }

  // Check SLA conditions
  if (conditions.hoursUntilBreach !== undefined && context.hoursUntilSLABreach !== undefined) {
    if (context.hoursUntilSLABreach > conditions.hoursUntilBreach) return false;
  }

  // Check buyer trust conditions
  if (conditions.buyerTrustBelow !== undefined && context.buyerTrustScore !== undefined) {
    if (context.buyerTrustScore >= conditions.buyerTrustBelow) return false;
  }
  if (conditions.buyerTrustAbove !== undefined && context.buyerTrustScore !== undefined) {
    if (context.buyerTrustScore <= conditions.buyerTrustAbove) return false;
  }

  // Check status conditions
  if (conditions.statusEquals !== undefined) {
    const entityStatus = context.entityData.status as string | undefined;
    if (entityStatus !== conditions.statusEquals) return false;
  }
  if (conditions.statusNotEquals !== undefined) {
    const entityStatus = context.entityData.status as string | undefined;
    if (entityStatus === conditions.statusNotEquals) return false;
  }

  // Check category conditions
  if (conditions.categoryIn !== undefined && conditions.categoryIn.length > 0) {
    const entityCategory = context.entityData.category as string | undefined;
    if (!entityCategory || !conditions.categoryIn.includes(entityCategory)) return false;
  }
  if (conditions.categoryNotIn !== undefined && conditions.categoryNotIn.length > 0) {
    const entityCategory = context.entityData.category as string | undefined;
    if (entityCategory && conditions.categoryNotIn.includes(entityCategory)) return false;
  }

  return true;
}

async function executeAction(
  rule: { id: string; actionType: string; actionConfig: string },
  context: RuleContext,
  entityType: EntityType
): Promise<{ success: boolean; actionTaken: string; error?: string }> {
  const config: ActionConfig = JSON.parse(rule.actionConfig);

  try {
    switch (rule.actionType) {
      case 'auto_ignore':
        // Update entity status to ignored
        await updateEntityStatus(entityType, context.entityId, config.setStatus || 'ignored');
        return { success: true, actionTaken: `Set status to ${config.setStatus || 'ignored'}` };

      case 'auto_flag':
        await updateEntityStatus(entityType, context.entityId, config.setStatus || 'flagged');
        if (config.sendNotification) {
          await createNotification(context.sellerId, config.notificationMessage || 'Entity flagged by automation', context);
        }
        return { success: true, actionTaken: `Flagged entity${config.sendNotification ? ' and sent notification' : ''}` };

      case 'auto_prioritize':
        await updateEntityPriority(entityType, context.entityId, config.setPriority || 'high');
        if (config.addTag) {
          await addEntityTag(entityType, context.entityId, config.addTag);
        }
        if (config.sendNotification) {
          await createNotification(context.sellerId, config.notificationMessage || 'High priority item', context);
        }
        return { success: true, actionTaken: `Set priority to ${config.setPriority || 'high'}` };

      case 'auto_remind':
        if (config.sendNotification) {
          await createNotification(context.sellerId, config.notificationMessage || config.reminderMessage || 'Reminder', context);
        }
        return { success: true, actionTaken: 'Sent reminder notification' };

      case 'auto_respond':
        // For disputes, add auto-response
        if (entityType === 'dispute') {
          await addDisputeAutoResponse(context.entityId, config.responseMessage || config.responseTemplate || '');
        }
        return { success: true, actionTaken: 'Sent auto-response' };

      case 'auto_hide':
        if (entityType === 'item' && config.hideItem) {
          await hideItem(context.entityId);
          if (config.sendNotification) {
            await createNotification(context.sellerId, config.notificationMessage || 'Item hidden', context);
          }
        }
        return { success: true, actionTaken: 'Hidden item from marketplace' };

      case 'auto_notify':
        await createNotification(context.sellerId, config.notificationMessage || 'Automation notification', context);
        return { success: true, actionTaken: 'Sent notification' };

      case 'auto_escalate':
        await escalateEntity(entityType, context.entityId, config.escalateTo || 'admin', config.escalationReason);
        if (config.sendNotification) {
          await createNotification(context.sellerId, config.notificationMessage || 'Entity escalated', context);
        }
        return { success: true, actionTaken: `Escalated to ${config.escalateTo || 'admin'}` };

      default:
        return { success: false, actionTaken: 'Unknown action type', error: `Unknown action type: ${rule.actionType}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, actionTaken: rule.actionType, error: errorMessage };
  }
}

// Helper functions for executing actions
async function updateEntityStatus(entityType: EntityType, entityId: string, status: string): Promise<void> {
  switch (entityType) {
    case 'rfq':
      await prisma.rFQ.update({ where: { id: entityId }, data: { status } });
      break;
    case 'order':
      await prisma.marketplaceOrder.update({ where: { id: entityId }, data: { status } });
      break;
    case 'dispute':
      await prisma.dispute.update({ where: { id: entityId }, data: { status } });
      break;
    default:
      // Item doesn't have a status field to update in this context
      break;
  }
}

async function updateEntityPriority(entityType: EntityType, entityId: string, priority: string): Promise<void> {
  // Store priority in metadata or a dedicated field if available
  // For now, we'll use tags or metadata based on entity type
  switch (entityType) {
    case 'rfq':
      // RFQ might have a priority field or we use metadata
      const rfq = await prisma.rFQ.findUnique({ where: { id: entityId } });
      if (rfq) {
        const metadata = rfq.metadata ? JSON.parse(rfq.metadata) : {};
        metadata.priority = priority;
        await prisma.rFQ.update({ where: { id: entityId }, data: { metadata: JSON.stringify(metadata) } });
      }
      break;
    case 'dispute':
      await prisma.dispute.update({ where: { id: entityId }, data: { priority } });
      break;
    default:
      break;
  }
}

async function addEntityTag(entityType: EntityType, entityId: string, tag: string): Promise<void> {
  // Add tag to entity metadata
  switch (entityType) {
    case 'rfq':
      const rfq = await prisma.rFQ.findUnique({ where: { id: entityId } });
      if (rfq) {
        const metadata = rfq.metadata ? JSON.parse(rfq.metadata) : {};
        metadata.tags = metadata.tags || [];
        if (!metadata.tags.includes(tag)) {
          metadata.tags.push(tag);
        }
        await prisma.rFQ.update({ where: { id: entityId }, data: { metadata: JSON.stringify(metadata) } });
      }
      break;
    default:
      break;
  }
}

async function createNotification(sellerId: string, message: string, context: RuleContext): Promise<void> {
  // Replace placeholders in message
  let finalMessage = message;
  if (context.daysOverdue !== undefined) {
    finalMessage = finalMessage.replace('{daysOverdue}', String(context.daysOverdue));
  }
  if (context.entityData.name) {
    finalMessage = finalMessage.replace('{itemName}', String(context.entityData.name));
  }

  // Create notification (using existing notification system if available)
  // For now, we'll log it - in production, integrate with notification service
  console.log(`[Automation Notification] Seller: ${sellerId}, Message: ${finalMessage}`);

  // If there's a Notification model, create one
  // await prisma.notification.create({ data: { userId: sellerId, message: finalMessage, type: 'automation' } });
}

async function addDisputeAutoResponse(disputeId: string, message: string): Promise<void> {
  // Add auto-response to dispute messages
  await prisma.disputeMessage.create({
    data: {
      disputeId,
      senderId: 'system',
      senderType: 'system',
      message,
      isInternal: false,
    },
  });
}

async function hideItem(itemId: string): Promise<void> {
  await prisma.item.update({
    where: { id: itemId },
    data: { status: 'draft' }, // or 'hidden' if that status exists
  });
}

async function escalateEntity(entityType: EntityType, entityId: string, escalateTo: string, reason?: string): Promise<void> {
  // Update entity to escalated status and record escalation
  if (entityType === 'dispute') {
    await prisma.dispute.update({
      where: { id: entityId },
      data: {
        status: 'escalated',
        escalatedAt: new Date(),
        escalatedTo: escalateTo,
      },
    });

    // Add escalation event
    await prisma.disputeEvent.create({
      data: {
        disputeId: entityId,
        actorId: 'system',
        actorType: 'system',
        eventType: 'ESCALATED',
        fromStatus: 'open',
        toStatus: 'escalated',
        metadata: JSON.stringify({ escalateTo, reason }),
      },
    });
  }
}

// =============================================================================
// Service Functions
// =============================================================================

export const automationRulesService = {
  // =========================================================================
  // Rule CRUD
  // =========================================================================

  async createRule(sellerId: string, input: CreateRuleInput) {
    try {
      const rule = await prisma.automationRule.create({
        data: {
          sellerId,
          name: input.name,
          description: input.description,
          ruleType: input.ruleType,
          triggerType: input.triggerType,
          triggerConditions: JSON.stringify(input.triggerConditions),
          actionType: input.actionType,
          actionConfig: JSON.stringify(input.actionConfig),
          priority: input.priority ?? 100,
          isEnabled: input.isEnabled ?? true,
        },
      });

      return { success: true, rule };
    } catch (error) {
      console.error('Error creating automation rule:', error);
      return { success: false, error: 'Failed to create automation rule' };
    }
  },

  async updateRule(sellerId: string, ruleId: string, input: UpdateRuleInput) {
    try {
      // Verify ownership
      const existing = await prisma.automationRule.findFirst({
        where: { id: ruleId, sellerId },
      });

      if (!existing) {
        return { success: false, error: 'Rule not found' };
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.triggerConditions !== undefined) updateData.triggerConditions = JSON.stringify(input.triggerConditions);
      if (input.actionConfig !== undefined) updateData.actionConfig = JSON.stringify(input.actionConfig);
      if (input.priority !== undefined) updateData.priority = input.priority;

      const rule = await prisma.automationRule.update({
        where: { id: ruleId },
        data: updateData,
      });

      return { success: true, rule };
    } catch (error) {
      console.error('Error updating automation rule:', error);
      return { success: false, error: 'Failed to update automation rule' };
    }
  },

  async deleteRule(sellerId: string, ruleId: string) {
    try {
      // Verify ownership
      const existing = await prisma.automationRule.findFirst({
        where: { id: ruleId, sellerId },
      });

      if (!existing) {
        return { success: false, error: 'Rule not found' };
      }

      await prisma.automationRule.delete({ where: { id: ruleId } });

      return { success: true };
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      return { success: false, error: 'Failed to delete automation rule' };
    }
  },

  async getSellerRules(sellerId: string, filters?: RuleFilters) {
    try {
      const where: Record<string, unknown> = { sellerId };

      if (filters?.ruleType) where.ruleType = filters.ruleType;
      if (filters?.triggerType) where.triggerType = filters.triggerType;
      if (filters?.isEnabled !== undefined) where.isEnabled = filters.isEnabled;

      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 50;

      const [rules, total] = await Promise.all([
        prisma.automationRule.findMany({
          where,
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            _count: {
              select: { executions: true },
            },
          },
        }),
        prisma.automationRule.count({ where }),
      ]);

      // Parse JSON fields
      const parsedRules = rules.map(rule => ({
        ...rule,
        triggerConditions: JSON.parse(rule.triggerConditions),
        actionConfig: JSON.parse(rule.actionConfig),
        executionCount: rule._count.executions,
      }));

      return {
        rules: parsedRules,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching seller rules:', error);
      return { rules: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  },

  async getRule(sellerId: string, ruleId: string) {
    try {
      const rule = await prisma.automationRule.findFirst({
        where: { id: ruleId, sellerId },
        include: {
          executions: {
            orderBy: { executedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!rule) {
        return null;
      }

      return {
        ...rule,
        triggerConditions: JSON.parse(rule.triggerConditions),
        actionConfig: JSON.parse(rule.actionConfig),
        executions: rule.executions.map(e => ({
          ...e,
          triggerData: JSON.parse(e.triggerData),
        })),
      };
    } catch (error) {
      console.error('Error fetching rule:', error);
      return null;
    }
  },

  async toggleRule(sellerId: string, ruleId: string, enabled: boolean) {
    try {
      // Verify ownership
      const existing = await prisma.automationRule.findFirst({
        where: { id: ruleId, sellerId },
      });

      if (!existing) {
        return { success: false, error: 'Rule not found' };
      }

      const rule = await prisma.automationRule.update({
        where: { id: ruleId },
        data: { isEnabled: enabled },
      });

      return { success: true, rule };
    } catch (error) {
      console.error('Error toggling rule:', error);
      return { success: false, error: 'Failed to toggle rule' };
    }
  },

  // =========================================================================
  // Rule Execution
  // =========================================================================

  async evaluateRulesForEntity(
    entityType: EntityType,
    entityId: string,
    sellerId: string,
    context: RuleContext
  ) {
    try {
      // Get all enabled rules for this seller and entity type
      const ruleTypeMap: Record<EntityType, RuleType> = {
        rfq: 'rfq_rule',
        order: 'order_rule',
        item: 'inventory_rule',
        dispute: 'dispute_rule',
      };

      const rules = await prisma.automationRule.findMany({
        where: {
          sellerId,
          ruleType: ruleTypeMap[entityType],
          isEnabled: true,
        },
        orderBy: { priority: 'asc' },
      });

      const results: Array<{
        ruleId: string;
        ruleName: string;
        matched: boolean;
        executed: boolean;
        result?: string;
        error?: string;
      }> = [];

      for (const rule of rules) {
        const conditions: TriggerConditions = JSON.parse(rule.triggerConditions);
        const matched = evaluateConditions(conditions, context);

        if (matched) {
          // Execute the action
          const actionResult = await executeAction(rule, context, entityType);

          // Log execution
          await prisma.automationExecution.create({
            data: {
              ruleId: rule.id,
              sellerId,
              entityType,
              entityId,
              entityNumber: context.entityNumber,
              triggerData: JSON.stringify(context),
              actionTaken: actionResult.actionTaken,
              actionResult: actionResult.success ? 'success' : 'failed',
              errorMessage: actionResult.error,
            },
          });

          // Update rule statistics
          await prisma.automationRule.update({
            where: { id: rule.id },
            data: {
              lastTriggeredAt: new Date(),
              triggerCount: { increment: 1 },
            },
          });

          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            matched: true,
            executed: true,
            result: actionResult.actionTaken,
            error: actionResult.error,
          });
        } else {
          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            matched: false,
            executed: false,
          });
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error evaluating rules:', error);
      return { success: false, error: 'Failed to evaluate rules', results: [] };
    }
  },

  // =========================================================================
  // Trigger Hooks
  // =========================================================================

  async onRFQReceived(rfqId: string, sellerId: string) {
    try {
      const rfq = await prisma.rFQ.findUnique({
        where: { id: rfqId },
        include: { buyer: true },
      });

      if (!rfq) {
        return { success: false, error: 'RFQ not found' };
      }

      // Get buyer trust score if available
      let buyerTrustScore: number | undefined;
      const trustScore = await prisma.trustScore.findUnique({
        where: { userId: rfq.buyerId },
      });
      if (trustScore) {
        buyerTrustScore = trustScore.overallScore;
      }

      // Build context
      const context: RuleContext = {
        entityId: rfqId,
        entityNumber: rfq.rfqNumber,
        entityData: rfq as unknown as Record<string, unknown>,
        buyerId: rfq.buyerId,
        buyerTrustScore,
        sellerId,
        margin: rfq.estimatedMargin ?? undefined,
        totalValue: rfq.estimatedValue ?? undefined,
        quantity: rfq.quantity ?? undefined,
      };

      return await this.evaluateRulesForEntity('rfq', rfqId, sellerId, context);
    } catch (error) {
      console.error('Error in onRFQReceived:', error);
      return { success: false, error: 'Failed to process RFQ automation' };
    }
  },

  async onOrderStatusChange(orderId: string, sellerId: string, newStatus: string) {
    try {
      const order = await prisma.marketplaceOrder.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Calculate days overdue if applicable
      let daysOverdue: number | undefined;
      if (order.expectedDeliveryDate && newStatus !== 'delivered' && newStatus !== 'closed') {
        const now = new Date();
        const expected = new Date(order.expectedDeliveryDate);
        if (now > expected) {
          daysOverdue = Math.floor((now.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      // Build context
      const context: RuleContext = {
        entityId: orderId,
        entityNumber: order.orderNumber,
        entityData: { ...order as unknown as Record<string, unknown>, status: newStatus },
        sellerId,
        totalValue: order.totalAmount,
        daysOverdue,
      };

      return await this.evaluateRulesForEntity('order', orderId, sellerId, context);
    } catch (error) {
      console.error('Error in onOrderStatusChange:', error);
      return { success: false, error: 'Failed to process order automation' };
    }
  },

  async onSLAWarning(entityType: EntityType, entityId: string, sellerId: string, hoursUntilBreach: number) {
    try {
      let entityData: Record<string, unknown> = {};
      let entityNumber: string | undefined;

      if (entityType === 'order') {
        const order = await prisma.marketplaceOrder.findUnique({ where: { id: entityId } });
        if (order) {
          entityData = order as unknown as Record<string, unknown>;
          entityNumber = order.orderNumber;
        }
      }

      const context: RuleContext = {
        entityId,
        entityNumber,
        entityData,
        sellerId,
        hoursUntilSLABreach: hoursUntilBreach,
      };

      return await this.evaluateRulesForEntity(entityType, entityId, sellerId, context);
    } catch (error) {
      console.error('Error in onSLAWarning:', error);
      return { success: false, error: 'Failed to process SLA warning automation' };
    }
  },

  async onStockChange(itemId: string, sellerId: string, newStock: number, maxStock?: number) {
    try {
      const item = await prisma.item.findUnique({ where: { id: itemId } });

      if (!item) {
        return { success: false, error: 'Item not found' };
      }

      const stockPercent = maxStock && maxStock > 0 ? (newStock / maxStock) * 100 : undefined;

      const context: RuleContext = {
        entityId: itemId,
        entityData: item as unknown as Record<string, unknown>,
        sellerId,
        currentStock: newStock,
        stockPercent,
      };

      return await this.evaluateRulesForEntity('item', itemId, sellerId, context);
    } catch (error) {
      console.error('Error in onStockChange:', error);
      return { success: false, error: 'Failed to process stock change automation' };
    }
  },

  async onDisputeOpened(disputeId: string, sellerId: string) {
    try {
      const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });

      if (!dispute) {
        return { success: false, error: 'Dispute not found' };
      }

      const context: RuleContext = {
        entityId: disputeId,
        entityNumber: dispute.disputeNumber,
        entityData: dispute as unknown as Record<string, unknown>,
        sellerId,
      };

      return await this.evaluateRulesForEntity('dispute', disputeId, sellerId, context);
    } catch (error) {
      console.error('Error in onDisputeOpened:', error);
      return { success: false, error: 'Failed to process dispute automation' };
    }
  },

  // =========================================================================
  // Execution History
  // =========================================================================

  async getExecutionHistory(sellerId: string, filters?: ExecutionFilters) {
    try {
      const where: Record<string, unknown> = { sellerId };

      if (filters?.ruleId) where.ruleId = filters.ruleId;
      if (filters?.entityType) where.entityType = filters.entityType;
      if (filters?.actionResult) where.actionResult = filters.actionResult;

      if (filters?.dateFrom || filters?.dateTo) {
        where.executedAt = {};
        if (filters.dateFrom) {
          (where.executedAt as Record<string, Date>).gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          (where.executedAt as Record<string, Date>).lte = new Date(filters.dateTo);
        }
      }

      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 50;

      const [executions, total] = await Promise.all([
        prisma.automationExecution.findMany({
          where,
          orderBy: { executedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            rule: {
              select: { name: true, ruleType: true, actionType: true },
            },
          },
        }),
        prisma.automationExecution.count({ where }),
      ]);

      return {
        executions: executions.map(e => ({
          ...e,
          triggerData: JSON.parse(e.triggerData),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching execution history:', error);
      return { executions: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  },

  async getExecutionStats(sellerId: string, period: 'day' | 'week' | 'month' = 'week') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const [total, successful, failed, byType] = await Promise.all([
        prisma.automationExecution.count({
          where: { sellerId, executedAt: { gte: startDate } },
        }),
        prisma.automationExecution.count({
          where: { sellerId, executedAt: { gte: startDate }, actionResult: 'success' },
        }),
        prisma.automationExecution.count({
          where: { sellerId, executedAt: { gte: startDate }, actionResult: 'failed' },
        }),
        prisma.automationExecution.groupBy({
          by: ['entityType'],
          where: { sellerId, executedAt: { gte: startDate } },
          _count: true,
        }),
      ]);

      return {
        period,
        total,
        successful,
        failed,
        skipped: total - successful - failed,
        successRate: total > 0 ? (successful / total) * 100 : 0,
        byEntityType: byType.reduce((acc, item) => {
          acc[item.entityType] = item._count;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('Error fetching execution stats:', error);
      return {
        period,
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
        byEntityType: {},
      };
    }
  },

  // =========================================================================
  // Templates
  // =========================================================================

  getDefaultRuleTemplates() {
    return DEFAULT_TEMPLATES;
  },

  async createRuleFromTemplate(sellerId: string, templateId: string, overrides?: Partial<CreateRuleInput>) {
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    const input: CreateRuleInput = {
      name: overrides?.name ?? template.name,
      description: overrides?.description ?? template.description,
      ruleType: template.ruleType,
      triggerType: template.triggerType,
      triggerConditions: overrides?.triggerConditions ?? template.triggerConditions,
      actionType: template.actionType,
      actionConfig: overrides?.actionConfig ?? template.actionConfig,
      priority: overrides?.priority,
      isEnabled: overrides?.isEnabled,
    };

    return this.createRule(sellerId, input);
  },
};

export default automationRulesService;
