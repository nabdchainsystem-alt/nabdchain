// =============================================================================
// Seller Automation Page - Simplified & Human-Friendly
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { automationService } from '../../services/automationService';
import {
  Lightning,
  Plus,
  Trash,
  Play,
  Pause,
  X,
  ArrowRight,
  ChatDots,
  ShoppingCart,
  Package,
  ListChecks,
  MagicWand,
  Clock,
  CaretRight,
} from 'phosphor-react';
import { Button, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import {
  AutomationRule,
  RuleTemplate,
  RuleType,
  TRIGGER_TYPE_LABELS,
  ACTION_TYPE_LABELS,
} from '../../types/automation.types';

interface SellerAutomationProps {
  onNavigate: (page: string) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getRuleTypeIcon = (type: RuleType) => {
  switch (type) {
    case 'rfq_rule': return ChatDots;
    case 'order_rule': return ShoppingCart;
    case 'inventory_rule': return Package;
    case 'dispute_rule': return ListChecks;
    default: return Lightning;
  }
};

// Human-friendly trigger descriptions
const getTriggerDescription = (triggerType: string): string => {
  const descriptions: Record<string, string> = {
    rfq_received: 'When you receive an RFQ',
    order_delayed: 'When an order is delayed',
    stock_low: 'When stock runs low',
    sla_warning: 'When SLA deadline approaches',
    dispute_opened: 'When a dispute is opened',
    order_status_change: 'When order status changes',
  };
  return descriptions[triggerType] || TRIGGER_TYPE_LABELS[triggerType as keyof typeof TRIGGER_TYPE_LABELS] || triggerType;
};

// Human-friendly action descriptions
const getActionDescription = (actionType: string): string => {
  const descriptions: Record<string, string> = {
    auto_ignore: 'Automatically ignore it',
    auto_flag: 'Flag it for review',
    auto_remind: 'Send a reminder',
    auto_respond: 'Send automatic response',
    auto_prioritize: 'Mark as priority',
    auto_hide: 'Hide from listings',
    auto_notify: 'Send notification',
    auto_escalate: 'Escalate immediately',
  };
  return descriptions[actionType] || ACTION_TYPE_LABELS[actionType as keyof typeof ACTION_TYPE_LABELS] || actionType;
};

// Example automations for empty state
const exampleAutomations = [
  {
    title: 'Flag low-margin RFQs',
    trigger: 'When you receive an RFQ',
    action: 'Flag it for review',
    description: 'Never miss RFQs that need your attention',
  },
  {
    title: 'Alert on delayed orders',
    trigger: 'When an order is delayed',
    action: 'Send notification',
    description: 'Stay on top of delivery issues',
  },
  {
    title: 'Low stock warning',
    trigger: 'When stock runs low',
    action: 'Send a reminder',
    description: 'Keep inventory well-stocked',
  },
];

// =============================================================================
// Component
// =============================================================================

export const SellerAutomation: React.FC<SellerAutomationProps> = ({ onNavigate }) => {
  const { getToken } = useAuth();
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const [rulesRes, templatesRes] = await Promise.all([
        automationService.getRules(token, {}),
        automationService.getTemplates(token),
      ]);

      setRules(rulesRes.rules);
      setTemplates(templatesRes);
    } catch (error) {
      console.error('Failed to fetch automation data:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle rule handler
  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      const token = await getToken();
      if (!token) return;

      await automationService.toggleRule(token, rule.id, !rule.isEnabled);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  // Delete rule handler
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this automation rule?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      await automationService.deleteRule(token, ruleId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  // Create from template handler
  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await automationService.createFromTemplate(token, templateId);
      setShowTemplates(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create rule from template:', error);
    }
  };

  const activeRulesCount = rules.filter(r => r.isEnabled).length;

  // Loading state
  if (loading && rules.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: styles.bgPrimary }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="shimmer h-8 w-40 rounded mb-2" />
          <div className="shimmer h-5 w-64 rounded mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border"
                style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
              >
                <div className="shimmer h-5 w-48 rounded mb-3" style={{ animationDelay: `${i * 50}ms` }} />
                <div className="shimmer h-4 w-64 rounded" style={{ animationDelay: `${i * 50 + 25}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2" style={{ color: styles.textPrimary }}>
            Automation
          </h1>
          <p className="text-base" style={{ color: styles.textMuted }}>
            Let repetitive tasks handle themselves. Create rules to save time.
          </p>
        </div>

        {/* Rules exist - show list */}
        {rules.length > 0 ? (
          <div className="space-y-6">
            {/* Simple status line */}
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {activeRulesCount} of {rules.length} rule{rules.length !== 1 ? 's' : ''} active
              </p>
              <Button onClick={() => setShowTemplates(true)} size="sm">
                <Plus size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
                Add Rule
              </Button>
            </div>

            {/* Rules list */}
            <div className="space-y-3">
              {rules.map((rule) => (
                <SimpleRuleCard
                  key={rule.id}
                  rule={rule}
                  styles={styles}
                  isRtl={isRtl}
                  onToggle={() => handleToggleRule(rule)}
                  onDelete={() => handleDeleteRule(rule.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty state with examples */
          <div
            className="rounded-2xl border p-8"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{ backgroundColor: `${styles.info}10` }}
              >
                <MagicWand size={28} style={{ color: styles.info }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: styles.textPrimary }}>
                Automate your workflow
              </h2>
              <p className="text-base max-w-md mx-auto" style={{ color: styles.textMuted }}>
                Set up simple rules to handle routine tasks automatically.
                Here are some ideas to get you started:
              </p>
            </div>

            {/* Example automations */}
            <div className="space-y-3 mb-8">
              {exampleAutomations.map((example, idx) => (
                <ExampleCard
                  key={idx}
                  example={example}
                  styles={styles}
                  isRtl={isRtl}
                />
              ))}
            </div>

            {/* Action */}
            <div className="text-center">
              <Button onClick={() => setShowTemplates(true)} size="md">
                <Plus size={18} className={isRtl ? 'ml-2' : 'mr-2'} />
                Create Your First Rule
              </Button>
              <p className="text-xs mt-3" style={{ color: styles.textMuted }}>
                Don't worry — you can always edit or turn off rules later
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <SimpleTemplatesModal
          templates={templates}
          styles={styles}
          isRtl={isRtl}
          onClose={() => setShowTemplates(false)}
          onSelect={handleCreateFromTemplate}
        />
      )}
    </div>
  );
};

// =============================================================================
// Simple Rule Card
// =============================================================================

const SimpleRuleCard: React.FC<{
  rule: AutomationRule;
  styles: ReturnType<typeof usePortal>['styles'];
  isRtl: boolean;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ rule, styles, isRtl, onToggle, onDelete }) => {
  const Icon = getRuleTypeIcon(rule.ruleType);

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${rule.isEnabled ? '' : 'opacity-60'}`}
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div
            className="shrink-0 p-2.5 rounded-xl"
            style={{
              backgroundColor: rule.isEnabled ? `${styles.info}10` : styles.bgSecondary,
              color: rule.isEnabled ? styles.info : styles.textMuted,
            }}
          >
            <Icon size={20} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium mb-1 truncate" style={{ color: styles.textPrimary }}>
              {rule.name}
            </h3>

            {/* Trigger → Action flow */}
            <div className={`flex items-center gap-2 text-sm flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span style={{ color: styles.textMuted }}>
                {getTriggerDescription(rule.triggerType)}
              </span>
              <ArrowRight size={14} style={{ color: styles.textMuted }} className="shrink-0" />
              <span style={{ color: styles.textSecondary }}>
                {getActionDescription(rule.actionType)}
              </span>
            </div>

            {/* Last run info */}
            {rule.lastTriggeredAt && (
              <p className="text-xs mt-2 flex items-center gap-1" style={{ color: styles.textMuted }}>
                <Clock size={12} />
                Last ran {formatRelativeTime(rule.lastTriggeredAt)}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: rule.isEnabled ? `${styles.success}15` : styles.bgSecondary,
              color: rule.isEnabled ? styles.success : styles.textMuted,
            }}
            title={rule.isEnabled ? 'Turn off' : 'Turn on'}
          >
            {rule.isEnabled ? <Play size={16} weight="fill" /> : <Pause size={16} />}
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${styles.error}15`;
              e.currentTarget.style.color = styles.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = styles.textMuted;
            }}
            title="Delete"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Example Card (for empty state)
// =============================================================================

const ExampleCard: React.FC<{
  example: { title: string; trigger: string; action: string; description: string };
  styles: ReturnType<typeof usePortal>['styles'];
  isRtl: boolean;
}> = ({ example, styles, isRtl }) => (
  <div
    className="rounded-lg p-4 border"
    style={{ backgroundColor: styles.bgPrimary, borderColor: styles.border }}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium text-sm" style={{ color: styles.textPrimary }}>
        {example.title}
      </span>
    </div>
    <div className={`flex items-center gap-2 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
      <span style={{ color: styles.textMuted }}>{example.trigger}</span>
      <ArrowRight size={14} style={{ color: styles.textMuted }} />
      <span style={{ color: styles.textSecondary }}>{example.action}</span>
    </div>
    <p className="text-xs mt-2" style={{ color: styles.textMuted }}>
      {example.description}
    </p>
  </div>
);

// =============================================================================
// Simple Templates Modal
// =============================================================================

const SimpleTemplatesModal: React.FC<{
  templates: RuleTemplate[];
  styles: ReturnType<typeof usePortal>['styles'];
  isRtl: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}> = ({ templates, styles, isRtl, onClose, onSelect }) => {
  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, RuleTemplate[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: styles.bgCard }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: styles.border }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
              Add a Rule
            </h2>
            <p className="text-sm mt-0.5" style={{ color: styles.textMuted }}>
              Choose a template to get started quickly
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Templates */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(85vh-100px)]">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
                {category}
              </h3>
              <div className="space-y-2">
                {categoryTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onSelect(template.id)}
                    className="w-full text-left rounded-xl border p-4 transition-all"
                    style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = styles.info;
                      e.currentTarget.style.backgroundColor = `${styles.info}05`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = styles.border;
                      e.currentTarget.style.backgroundColor = styles.bgPrimary;
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1" style={{ color: styles.textPrimary }}>
                          {template.name}
                        </h4>
                        <div className={`flex items-center gap-2 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <span style={{ color: styles.textMuted }}>
                            {getTriggerDescription(template.triggerType)}
                          </span>
                          <ArrowRight size={12} style={{ color: styles.textMuted }} />
                          <span style={{ color: styles.textSecondary }}>
                            {getActionDescription(template.actionType)}
                          </span>
                        </div>
                      </div>
                      <CaretRight size={18} style={{ color: styles.textMuted }} className="shrink-0 ml-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <EmptyState
              icon={MagicWand}
              title="No templates available"
              description="Templates will appear here once configured."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerAutomation;
