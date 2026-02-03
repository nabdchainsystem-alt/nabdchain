// =============================================================================
// Automation Types - Stage 8: Automation, Payouts & Scale
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

export interface AutomationRule {
  id: string;
  sellerId: string;
  name: string;
  description?: string | null;
  ruleType: RuleType;
  isEnabled: boolean;
  priority: number;
  triggerType: TriggerType;
  triggerConditions: TriggerConditions;
  actionType: ActionType;
  actionConfig: ActionConfig;
  lastTriggeredAt?: string | null;
  triggerCount: number;
  executionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  sellerId: string;
  entityType: EntityType;
  entityId: string;
  entityNumber?: string | null;
  triggerData: Record<string, unknown>;
  actionTaken: string;
  actionResult: ActionResult;
  errorMessage?: string | null;
  executedAt: string;
  rule?: {
    name: string;
    ruleType: RuleType;
    actionType: ActionType;
  };
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

export interface ExecutionStats {
  period: 'day' | 'week' | 'month';
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  successRate: number;
  byEntityType: Record<EntityType, number>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RulesResponse {
  rules: AutomationRule[];
  pagination: Pagination;
}

export interface ExecutionsResponse {
  executions: AutomationExecution[];
  pagination: Pagination;
}

// Rule type display names
export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  rfq_rule: 'RFQ Rules',
  order_rule: 'Order Rules',
  inventory_rule: 'Inventory Rules',
  dispute_rule: 'Dispute Rules',
};

// Trigger type display names
export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  rfq_received: 'RFQ Received',
  order_delayed: 'Order Delayed',
  stock_low: 'Low Stock',
  sla_warning: 'SLA Warning',
  dispute_opened: 'Dispute Opened',
  order_status_change: 'Order Status Change',
};

// Action type display names
export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  auto_ignore: 'Auto-Ignore',
  auto_flag: 'Auto-Flag',
  auto_remind: 'Auto-Remind',
  auto_respond: 'Auto-Respond',
  auto_prioritize: 'Auto-Prioritize',
  auto_hide: 'Auto-Hide',
  auto_notify: 'Auto-Notify',
  auto_escalate: 'Auto-Escalate',
};

// Action result colors
export const ACTION_RESULT_COLORS: Record<ActionResult, string> = {
  success: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100',
  skipped: 'text-yellow-600 bg-yellow-100',
};
