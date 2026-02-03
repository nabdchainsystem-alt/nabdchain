// =============================================================================
// Seller Automation Page - Stage 8: Automation, Payouts & Scale
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { automationService } from '../../services/automationService';
import {
  Lightning,
  Plus,
  Eye,
  Trash,
  CheckCircle,
  XCircle,
  Clock,
  CaretRight,
  Funnel,
  X,
  Play,
  Pause,
  Spinner,
  MagicWand,
  ListChecks,
  Package,
  ChatDots,
  ShoppingCart,
  Warning,
  DotsThreeVertical,
  CaretDown,
  CaretUp,
  MagnifyingGlass,
} from 'phosphor-react';
import { Button, EmptyState, Select } from '../../components';
import { usePortal } from '../../context/PortalContext';
import {
  AutomationRule,
  AutomationExecution,
  RuleTemplate,
  CreateRuleInput,
  RuleFilters,
  ExecutionStats,
  RuleType,
  TriggerType,
  ActionType,
  RULE_TYPE_LABELS,
  TRIGGER_TYPE_LABELS,
  ACTION_TYPE_LABELS,
  ACTION_RESULT_COLORS,
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

// =============================================================================
// Component
// =============================================================================

export const SellerAutomation: React.FC<SellerAutomationProps> = ({ onNavigate }) => {
  const { getToken } = useAuth();
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [filters, setFilters] = useState<RuleFilters>({});
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const [rulesRes, executionsRes, statsRes, templatesRes] = await Promise.all([
        automationService.getRules(token, filters),
        automationService.getExecutions(token, { limit: 10 }),
        automationService.getExecutionStats(token, 'week'),
        automationService.getTemplates(token),
      ]);

      setRules(rulesRes.rules);
      setExecutions(executionsRes.executions);
      setStats(statsRes);
      setTemplates(templatesRes);
    } catch (error) {
      console.error('Failed to fetch automation data:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, filters]);

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
    if (!confirm('Are you sure you want to delete this rule?')) return;

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

  // Filtered rules
  const filteredRules = rules.filter(rule => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!rule.name.toLowerCase().includes(q)) return false;
    }
    if (filters.ruleType && rule.ruleType !== filters.ruleType) return false;
    if (filters.isEnabled !== undefined && rule.isEnabled !== filters.isEnabled) return false;
    return true;
  });

  // Check if any filters are active
  const hasActiveFilters = searchQuery || filters.ruleType || filters.isEnabled !== undefined;

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({});
  };

  // Quick stats
  const quickStats = stats ? {
    activeRules: rules.filter(r => r.isEnabled).length,
    totalRules: rules.length,
    executionsThisWeek: stats.total,
    successRate: stats.successRate,
    failed: stats.failed,
  } : null;

  if (loading && rules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8 animate-spin" style={{ color: styles.info }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              Automation
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              Set up rules to automate repetitive tasks
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowTemplates(true)} variant="outline" size="sm">
              <MagicWand size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
              Templates
            </Button>
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
              Create Rule
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {quickStats && (
          <div className={`flex items-center gap-6 mb-6 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
            <QuickStat
              label="Active Rules"
              value={quickStats.activeRules}
              total={quickStats.totalRules}
              color={styles.info}
              styles={styles}
            />
            <QuickStat
              label="Executions (Week)"
              value={quickStats.executionsThisWeek}
              color="#8B5CF6"
              styles={styles}
            />
            <QuickStat
              label="Success Rate"
              value={`${quickStats.successRate.toFixed(1)}%`}
              color={styles.success}
              styles={styles}
            />
            {quickStats.failed > 0 && (
              <QuickStat
                label="Failed"
                value={quickStats.failed}
                color={styles.error}
                styles={styles}
                warning
              />
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4 border-b" style={{ borderColor: styles.border }}>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rules' ? '' : 'border-transparent'
            }`}
            style={{
              borderColor: activeTab === 'rules' ? styles.info : 'transparent',
              color: activeTab === 'rules' ? styles.info : styles.textMuted,
            }}
          >
            Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history' ? '' : 'border-transparent'
            }`}
            style={{
              borderColor: activeTab === 'history' ? styles.info : 'transparent',
              color: activeTab === 'history' ? styles.info : styles.textMuted,
            }}
          >
            Execution History
          </button>
        </div>

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div
              className="rounded-xl border"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              {/* Filter Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: styles.border }}>
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: styles.textPrimary }}
                >
                  <Funnel size={16} />
                  Filters
                  <CaretRight
                    size={14}
                    className={`transition-transform ${filtersExpanded ? 'rotate-90' : ''}`}
                    style={{ color: styles.textMuted }}
                  />
                  {hasActiveFilters && (
                    <span
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{ backgroundColor: styles.info, color: '#fff' }}
                    >
                      Active
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                    style={{ color: styles.textMuted }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              {filtersExpanded && (
                <div className="px-4 py-3 flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div
                    className="flex items-center gap-2 px-3 h-9 rounded-lg border flex-1 min-w-[200px] max-w-[300px]"
                    style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
                  >
                    <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
                    <input
                      type="text"
                      placeholder="Search rules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="outline-none text-sm bg-transparent flex-1"
                      style={{ color: styles.textPrimary }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} style={{ color: styles.textMuted }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Rule Type */}
                  <Select
                    value={filters.ruleType || 'all'}
                    onChange={(v) => setFilters({ ...filters, ruleType: v === 'all' ? undefined : v as RuleType })}
                    options={[
                      { value: 'all', label: 'All Types' },
                      ...Object.entries(RULE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
                    ]}
                  />

                  {/* Status */}
                  <Select
                    value={filters.isEnabled === undefined ? 'all' : String(filters.isEnabled)}
                    onChange={(v) => setFilters({
                      ...filters,
                      isEnabled: v === 'all' ? undefined : v === 'true'
                    })}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'true', label: 'Enabled' },
                      { value: 'false', label: 'Disabled' },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Rules List */}
            {filteredRules.length === 0 ? (
              <div
                className="rounded-lg border p-12"
                style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
              >
                <EmptyState
                  icon={Lightning}
                  title="No automation rules"
                  description="Create your first automation rule to streamline your workflow."
                  action={
                    <Button onClick={() => setShowTemplates(true)}>
                      Browse Templates
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    styles={styles}
                    isRtl={isRtl}
                    onToggle={() => handleToggleRule(rule)}
                    onView={() => setSelectedRule(rule)}
                    onDelete={() => handleDeleteRule(rule.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <table className="w-full">
              <thead style={{ backgroundColor: styles.bgSecondary }}>
                <tr>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase"
                    style={{ color: styles.textMuted, textAlign: isRtl ? 'right' : 'left' }}
                  >
                    Rule
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase"
                    style={{ color: styles.textMuted, textAlign: isRtl ? 'right' : 'left' }}
                  >
                    Entity
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase"
                    style={{ color: styles.textMuted, textAlign: isRtl ? 'right' : 'left' }}
                  >
                    Action
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase"
                    style={{ color: styles.textMuted, textAlign: isRtl ? 'right' : 'left' }}
                  >
                    Result
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase"
                    style={{ color: styles.textMuted, textAlign: isRtl ? 'right' : 'left' }}
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {executions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12">
                      <EmptyState
                        icon={Clock}
                        title="No execution history"
                        description="Rule executions will appear here as they run."
                      />
                    </td>
                  </tr>
                ) : (
                  executions.map((execution, idx) => (
                    <tr
                      key={execution.id}
                      style={{
                        borderTop: idx > 0 ? `1px solid ${styles.border}` : undefined,
                      }}
                      className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                            {execution.rule?.name || 'Unknown Rule'}
                          </p>
                          <p className="text-xs" style={{ color: styles.textMuted }}>
                            {execution.rule?.ruleType && RULE_TYPE_LABELS[execution.rule.ruleType]}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm capitalize" style={{ color: styles.textPrimary }}>
                            {execution.entityType}
                          </p>
                          {execution.entityNumber && (
                            <p className="text-xs font-mono" style={{ color: styles.textMuted }}>
                              {execution.entityNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm" style={{ color: styles.textPrimary }}>
                          {execution.actionTaken}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ACTION_RESULT_COLORS[execution.actionResult]}`}>
                          {execution.actionResult}
                        </span>
                        {execution.errorMessage && (
                          <p className="text-xs mt-1 truncate max-w-[200px]" style={{ color: styles.error }}>
                            {execution.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: styles.textMuted }}>
                        {formatRelativeTime(execution.executedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <TemplatesModal
          templates={templates}
          styles={styles}
          onClose={() => setShowTemplates(false)}
          onSelect={handleCreateFromTemplate}
        />
      )}

      {/* Rule Details Modal */}
      {selectedRule && (
        <RuleDetailsModal
          rule={selectedRule}
          styles={styles}
          onClose={() => setSelectedRule(null)}
        />
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <CreateRuleModal
          styles={styles}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// =============================================================================
// Quick Stat Component
// =============================================================================

const QuickStat: React.FC<{
  label: string;
  value: number | string;
  total?: number;
  color?: string;
  styles: ReturnType<typeof usePortal>['styles'];
  warning?: boolean;
}> = ({ label, value, total, color, styles, warning }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm" style={{ color: styles.textMuted }}>{label}:</span>
    <span
      className={`text-sm font-semibold ${warning ? 'flex items-center gap-1' : ''}`}
      style={{ color: color || styles.textPrimary }}
    >
      {warning && <Warning size={12} />}
      {value}
      {total !== undefined && (
        <span className="font-normal" style={{ color: styles.textMuted }}> / {total}</span>
      )}
    </span>
  </div>
);

// =============================================================================
// Rule Card Component
// =============================================================================

const RuleCard: React.FC<{
  rule: AutomationRule;
  styles: ReturnType<typeof usePortal>['styles'];
  isRtl: boolean;
  onToggle: () => void;
  onView: () => void;
  onDelete: () => void;
}> = ({ rule, styles, isRtl, onToggle, onView, onDelete }) => {
  const Icon = getRuleTypeIcon(rule.ruleType);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${rule.isEnabled ? '' : 'opacity-60'}`}
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: rule.isEnabled ? `${styles.info}15` : styles.bgSecondary,
              color: rule.isEnabled ? styles.info : styles.textMuted,
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium" style={{ color: styles.textPrimary }}>{rule.name}</h3>
            <p className="text-sm" style={{ color: styles.textMuted }}>
              {TRIGGER_TYPE_LABELS[rule.triggerType]} → {ACTION_TYPE_LABELS[rule.actionType]}
            </p>
            {rule.description && (
              <p className="text-xs mt-1" style={{ color: styles.textMuted }}>{rule.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-${isRtl ? 'left' : 'right'}`}>
            <p className="text-sm" style={{ color: styles.textMuted }}>
              {rule.triggerCount} executions
            </p>
            {rule.lastTriggeredAt && (
              <p className="text-xs" style={{ color: styles.textMuted }}>
                Last: {formatRelativeTime(rule.lastTriggeredAt)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Button */}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: rule.isEnabled ? `${styles.success}15` : styles.bgSecondary,
                color: rule.isEnabled ? styles.success : styles.textMuted,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              title={rule.isEnabled ? 'Disable' : 'Enable'}
            >
              {rule.isEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* More Actions */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <DotsThreeVertical className="w-4 h-4" weight="bold" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div
                    className={`absolute top-full mt-1 z-20 py-1 rounded-lg shadow-lg min-w-[140px] ${isRtl ? 'left-0' : 'right-0'}`}
                    style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
                  >
                    <MenuButton
                      icon={Eye}
                      label="View Details"
                      styles={styles}
                      onClick={() => { onView(); setShowMenu(false); }}
                    />
                    <div className="h-px my-1" style={{ backgroundColor: styles.border }} />
                    <MenuButton
                      icon={Trash}
                      label="Delete"
                      styles={styles}
                      onClick={() => { onDelete(); setShowMenu(false); }}
                      danger
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Menu Button Component
// =============================================================================

const MenuButton: React.FC<{
  icon: React.ElementType;
  label: string;
  styles: ReturnType<typeof usePortal>['styles'];
  onClick: () => void;
  danger?: boolean;
}> = ({ icon: Icon, label, styles, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
    style={{ color: danger ? styles.error : styles.textPrimary }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <Icon size={14} />
    {label}
  </button>
);

// =============================================================================
// Templates Modal
// =============================================================================

interface TemplatesModalProps {
  templates: RuleTemplate[];
  styles: ReturnType<typeof usePortal>['styles'];
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ templates, styles, onClose, onSelect }) => {
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, RuleTemplate[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl"
        style={{ backgroundColor: styles.bgCard }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Rule Templates
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="font-medium mb-3" style={{ color: styles.textPrimary }}>{category}</h3>
              <div className="grid gap-3">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 cursor-pointer transition-colors"
                    style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
                    onClick={() => onSelect(template.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = styles.info)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = styles.border)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium" style={{ color: styles.textPrimary }}>{template.name}</h4>
                        <p className="text-sm" style={{ color: styles.textMuted }}>{template.description}</p>
                        <p className="text-xs mt-2" style={{ color: styles.textMuted }}>
                          {TRIGGER_TYPE_LABELS[template.triggerType]} → {ACTION_TYPE_LABELS[template.actionType]}
                        </p>
                      </div>
                      <CaretRight className="w-5 h-5" style={{ color: styles.textMuted }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Rule Details Modal
// =============================================================================

interface RuleDetailsModalProps {
  rule: AutomationRule;
  styles: ReturnType<typeof usePortal>['styles'];
  onClose: () => void;
}

const RuleDetailsModal: React.FC<RuleDetailsModalProps> = ({ rule, styles, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl"
        style={{ backgroundColor: styles.bgCard }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Rule Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold" style={{ color: styles.textPrimary }}>{rule.name}</h3>
            {rule.description && (
              <p className="text-sm mt-1" style={{ color: styles.textMuted }}>{rule.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: rule.isEnabled ? `${styles.success}15` : styles.bgSecondary,
                color: rule.isEnabled ? styles.success : styles.textMuted,
              }}
            >
              {rule.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <span
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{ backgroundColor: `${styles.info}15`, color: styles.info }}
            >
              {RULE_TYPE_LABELS[rule.ruleType]}
            </span>
          </div>

          <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: styles.bgSecondary }}>
            <div>
              <p className="text-xs uppercase" style={{ color: styles.textMuted }}>Trigger</p>
              <p className="text-sm" style={{ color: styles.textPrimary }}>{TRIGGER_TYPE_LABELS[rule.triggerType]}</p>
            </div>
            <div>
              <p className="text-xs uppercase" style={{ color: styles.textMuted }}>Conditions</p>
              <pre className="text-xs mt-1 overflow-auto" style={{ color: styles.textSecondary }}>
                {JSON.stringify(rule.triggerConditions, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-xs uppercase" style={{ color: styles.textMuted }}>Action</p>
              <p className="text-sm" style={{ color: styles.textPrimary }}>{ACTION_TYPE_LABELS[rule.actionType]}</p>
            </div>
            <div>
              <p className="text-xs uppercase" style={{ color: styles.textMuted }}>Action Config</p>
              <pre className="text-xs mt-1 overflow-auto" style={{ color: styles.textSecondary }}>
                {JSON.stringify(rule.actionConfig, null, 2)}
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p style={{ color: styles.textMuted }}>Priority</p>
              <p style={{ color: styles.textPrimary }}>{rule.priority}</p>
            </div>
            <div>
              <p style={{ color: styles.textMuted }}>Executions</p>
              <p style={{ color: styles.textPrimary }}>{rule.triggerCount}</p>
            </div>
            <div>
              <p style={{ color: styles.textMuted }}>Created</p>
              <p style={{ color: styles.textPrimary }}>{new Date(rule.createdAt).toLocaleDateString()}</p>
            </div>
            {rule.lastTriggeredAt && (
              <div>
                <p style={{ color: styles.textMuted }}>Last Triggered</p>
                <p style={{ color: styles.textPrimary }}>{formatRelativeTime(rule.lastTriggeredAt)}</p>
              </div>
            )}
          </div>
        </div>

        <div
          className="flex justify-end gap-2 p-4 border-t"
          style={{ borderColor: styles.border }}
        >
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Create Rule Modal
// =============================================================================

interface CreateRuleModalProps {
  styles: ReturnType<typeof usePortal>['styles'];
  onClose: () => void;
  onCreated: () => void;
}

const CreateRuleModal: React.FC<CreateRuleModalProps> = ({ styles, onClose, onCreated }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState<RuleType>('rfq_rule');
  const [triggerType, setTriggerType] = useState<TriggerType>('rfq_received');
  const [actionType, setActionType] = useState<ActionType>('auto_flag');

  const handleCreate = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const input: CreateRuleInput = {
        name,
        description: description || undefined,
        ruleType,
        triggerType,
        triggerConditions: {},
        actionType,
        actionConfig: { sendNotification: true },
      };

      await automationService.createRule(token, input);
      onCreated();
    } catch (error) {
      console.error('Failed to create rule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl shadow-2xl"
        style={{ backgroundColor: styles.bgCard }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Create Rule
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: styles.textPrimary }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Flag High-Value RFQs"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                borderColor: styles.border,
                backgroundColor: styles.bgPrimary,
                color: styles.textPrimary,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: styles.textPrimary }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule does..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={{
                borderColor: styles.border,
                backgroundColor: styles.bgPrimary,
                color: styles.textPrimary,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: styles.textPrimary }}>
              Rule Type
            </label>
            <Select
              value={ruleType}
              onChange={(v) => setRuleType(v as RuleType)}
              options={Object.entries(RULE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: styles.textPrimary }}>
              Trigger
            </label>
            <Select
              value={triggerType}
              onChange={(v) => setTriggerType(v as TriggerType)}
              options={Object.entries(TRIGGER_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: styles.textPrimary }}>
              Action
            </label>
            <Select
              value={actionType}
              onChange={(v) => setActionType(v as ActionType)}
              options={Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
        </div>

        <div
          className="flex justify-end gap-2 p-4 border-t"
          style={{ borderColor: styles.border }}
        >
          <Button onClick={onClose} variant="outline" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? <Spinner className="w-4 h-4 animate-spin" /> : 'Create Rule'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellerAutomation;
