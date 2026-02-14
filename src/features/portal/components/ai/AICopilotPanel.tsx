/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Copilot Panel — Slide-in panel for AI-powered insights
 *
 * Used in both Buyer and Seller workspaces.
 * Shows quick action chips, loading skeletons, result cards.
 */
import React, { useState, useCallback } from 'react';
import {
  X,
  Lightning,
  ShieldWarning,
  ArrowRight,
  CircleNotch,
  ChartLineUp,
  FileText,
  Scales,
  Sparkle,
  Info,
  Warning,
  WarningCircle,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { portalAIService, AIInsightResponse } from '../../services/aiService';

// ============================================================================
// Types
// ============================================================================

type AIAction = 'insights' | 'workspace-summary' | 'rfq-draft' | 'quote-compare';

interface AICopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'buyer' | 'seller';
  /** For quote-compare, pass rfqId */
  rfqId?: string;
  /** Pre-select an action to run immediately */
  initialAction?: AIAction;
}

interface QuickChip {
  id: AIAction;
  label: string;
  icon: React.ComponentType<{ size: number; weight?: string }>;
}

// ============================================================================
// Component
// ============================================================================

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({ isOpen, onClose, role, rfqId, initialAction }) => {
  const { styles, t } = usePortal();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIInsightResponse['data'] | null>(null);
  const [activeAction, setActiveAction] = useState<AIAction | null>(initialAction || null);

  const chips: QuickChip[] = [
    { id: 'workspace-summary', label: t('ai.summarizeWorkspace') || 'Summarize Workspace', icon: ChartLineUp },
    { id: 'insights', label: t('ai.getInsights') || 'Get Insights', icon: Sparkle },
    ...(role === 'buyer'
      ? [
          { id: 'rfq-draft' as AIAction, label: t('ai.draftRFQ') || 'Draft RFQ', icon: FileText },
          { id: 'quote-compare' as AIAction, label: t('ai.compareQuotes') || 'Compare Quotes', icon: Scales },
        ]
      : []),
  ];

  const runAction = useCallback(
    async (action: AIAction) => {
      setActiveAction(action);
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        let response: AIInsightResponse;

        switch (action) {
          case 'insights':
            response = await portalAIService.getInsights({ role });
            break;
          case 'workspace-summary':
            response = await portalAIService.getWorkspaceSummary({ role, period: '30d' });
            break;
          case 'rfq-draft':
            response = await portalAIService.draftRFQ({
              itemName: 'General Inquiry',
              quantity: 1,
              requirements: 'Please provide your best offer',
            });
            break;
          case 'quote-compare':
            if (!rfqId) throw new Error('No RFQ selected for comparison');
            response = await portalAIService.compareQuotes({ rfqId });
            break;
          default:
            throw new Error('Unknown action');
        }

        if (response.success && response.data) {
          setResult(response.data);
        } else {
          setError(response.error || 'AI returned no results');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to get AI response');
      } finally {
        setIsLoading(false);
      }
    },
    [role, rfqId],
  );

  // Run initial action on mount when panel opens
  const hasRunInitial = React.useRef(false);
  React.useEffect(() => {
    if (isOpen && initialAction && !hasRunInitial.current) {
      hasRunInitial.current = true;
      runAction(initialAction);
    }
    if (!isOpen) {
      hasRunInitial.current = false;
    }
  }, [isOpen, initialAction, runAction]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-md h-full overflow-y-auto shadow-2xl animate-slide-in-right"
        style={{ backgroundColor: styles.bgPrimary }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              <Sparkle size={18} weight="fill" className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                {t('ai.copilotTitle') || 'AI Copilot'}
              </h2>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {t('ai.copilotSubtitle') || 'Powered by NABD Brain'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium uppercase mb-3" style={{ color: styles.textMuted }}>
            {t('ai.quickActions') || 'Quick Actions'}
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const Icon = chip.icon;
              const isActive = activeAction === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => runAction(chip.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                  style={{
                    borderColor: isActive ? '#6366F1' : styles.border,
                    backgroundColor: isActive ? '#6366F115' : styles.bgCard,
                    color: isActive ? '#6366F1' : styles.textSecondary,
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  <Icon size={14} />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-5 pb-6">
          {/* Loading */}
          {isLoading && <LoadingSkeleton styles={styles} />}

          {/* Error */}
          {error && !isLoading && (
            <div
              className="p-4 rounded-xl border"
              style={{ borderColor: `${styles.error}30`, backgroundColor: `${styles.error}08` }}
            >
              <div className="flex items-start gap-3">
                <WarningCircle size={20} weight="fill" style={{ color: styles.error, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: styles.error }}>
                    {t('ai.errorTitle') || 'Something went wrong'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                    {error}
                  </p>
                  <button
                    onClick={() => activeAction && runAction(activeAction)}
                    className="mt-2 text-xs font-medium px-3 py-1 rounded-lg"
                    style={{ backgroundColor: styles.bgSecondary, color: styles.textPrimary }}
                  >
                    {t('common.retry') || 'Retry'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div className="space-y-4">
              {/* Summary Card */}
              <ResultCard title={t('ai.summary') || 'Summary'} icon={ChartLineUp} color="#6366F1" styles={styles}>
                <p className="text-sm leading-relaxed" style={{ color: styles.textSecondary }}>
                  {result.summary}
                </p>
                {result.confidence > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: styles.bgSecondary }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${result.confidence * 100}%`,
                          backgroundColor:
                            result.confidence > 0.7
                              ? styles.success
                              : result.confidence > 0.4
                                ? styles.warning
                                : styles.error,
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: styles.textMuted }}>
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                )}
              </ResultCard>

              {/* Insights */}
              {result.insights.length > 0 && (
                <ResultCard title={t('ai.insights') || 'Insights'} icon={Lightning} color="#F59E0B" styles={styles}>
                  <div className="space-y-2">
                    {result.insights.map((insight, i) => (
                      <InsightRow
                        key={i}
                        title={insight.title}
                        description={insight.description}
                        severity={insight.severity}
                        styles={styles}
                      />
                    ))}
                  </div>
                </ResultCard>
              )}

              {/* Risks */}
              {result.risks.length > 0 && (
                <ResultCard title={t('ai.risks') || 'Risks'} icon={ShieldWarning} color="#EF4444" styles={styles}>
                  <div className="space-y-2">
                    {result.risks.map((risk, i) => (
                      <RiskRow
                        key={i}
                        title={risk.title}
                        description={risk.description}
                        severity={risk.severity}
                        styles={styles}
                      />
                    ))}
                  </div>
                </ResultCard>
              )}

              {/* Recommended Actions */}
              {result.recommendedActions.length > 0 && (
                <ResultCard
                  title={t('ai.actions') || 'Recommended Actions'}
                  icon={ArrowRight}
                  color="#10B981"
                  styles={styles}
                >
                  <div className="space-y-2">
                    {result.recommendedActions.map((action, i) => (
                      <div key={i} className="p-2.5 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                        <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                          {action.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                          {action.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </ResultCard>
              )}

              {/* Data Sources */}
              {result.dataUsed.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {t('ai.dataUsed') || 'Data sources'}: {result.dataUsed.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State (no action selected) */}
          {!isLoading && !error && !result && (
            <div className="text-center py-10">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366F115, #8B5CF615)' }}
              >
                <Sparkle size={28} weight="duotone" style={{ color: '#6366F1' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {t('ai.emptyTitle') || 'Ask AI Copilot'}
              </p>
              <p className="text-xs mt-1 max-w-[240px] mx-auto" style={{ color: styles.textMuted }}>
                {t('ai.emptyDesc') || 'Select a quick action above to get AI-powered insights about your workspace'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

const LoadingSkeleton: React.FC<{ styles: any }> = ({ styles }) => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="rounded-xl border p-4"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <div className="h-4 w-32 rounded mb-3" style={{ backgroundColor: styles.bgSecondary }} />
        <div className="space-y-2">
          <div className="h-3 w-full rounded" style={{ backgroundColor: styles.bgSecondary }} />
          <div className="h-3 w-3/4 rounded" style={{ backgroundColor: styles.bgSecondary }} />
          <div className="h-3 w-1/2 rounded" style={{ backgroundColor: styles.bgSecondary }} />
        </div>
      </div>
    ))}
    <div className="flex items-center justify-center gap-2 pt-2">
      <CircleNotch size={16} className="animate-spin" style={{ color: '#6366F1' }} />
      <span className="text-xs" style={{ color: styles.textMuted }}>
        Analyzing your data...
      </span>
    </div>
  </div>
);

const ResultCard: React.FC<{
  title: string;
  icon: React.ComponentType<{ size: number; weight?: string }>;
  color: string;
  styles: any;
  children: React.ReactNode;
}> = ({ title, icon: Icon, color, styles, children }) => (
  <div
    className="rounded-xl border overflow-hidden"
    style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
  >
    <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: styles.border }}>
      <Icon size={16} weight="fill" style={{ color }} />
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: styles.textMuted }}>
        {title}
      </span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const InsightRow: React.FC<{
  title: string;
  description: string;
  severity?: string;
  styles: any;
}> = ({ title, description, severity, styles }) => {
  const severityIcons: Record<string, React.ReactNode> = {
    info: <Info size={14} weight="fill" style={{ color: styles.info }} />,
    warning: <Warning size={14} weight="fill" style={{ color: styles.warning }} />,
    critical: <WarningCircle size={14} weight="fill" style={{ color: styles.error }} />,
  };

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
      <span className="mt-0.5 flex-shrink-0">{severityIcons[severity || 'info'] || severityIcons.info}</span>
      <div>
        <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
          {description}
        </p>
      </div>
    </div>
  );
};

const RiskRow: React.FC<{
  title: string;
  description: string;
  severity: string;
  styles: any;
}> = ({ title, description, severity, styles }) => {
  const severityColors: Record<string, string> = {
    low: styles.success,
    medium: styles.warning,
    high: '#F97316',
    critical: styles.error,
  };
  const color = severityColors[severity] || styles.textMuted;

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
      <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {title}
          </p>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {severity}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default AICopilotPanel;
