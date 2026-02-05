// =============================================================================
// Buyer Expenses Page - Unified Page Structure
// =============================================================================
// Purpose: Monitor spending patterns and identify savings opportunities
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartLine,
  TrendUp,
  TrendDown,
  Warning,
  CurrencyCircleDollar,
  ArrowRight,
  Cube,
  Wallet,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { PageLayout, Button, QuickActionCard } from '../../components';
import { useAuth } from '../../../../auth-adapter';
import { expenseAnalyticsService } from '../../services/expenseAnalyticsService';
import { ExpenseAnalyticsDashboard, formatExpenseAmount } from '../../types/expense.types';

interface BuyerExpensesProps {
  onNavigate?: (page: string, data?: Record<string, unknown>) => void;
}

// Specialized StatCard with trend support for expense analytics
const ExpenseStatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
  highlight?: boolean;
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
}> = ({ label, value, icon: Icon, color, highlight, trend, onClick }) => {
  const { styles } = usePortal();

  return (
    <button
      onClick={onClick}
      className="p-4 rounded-lg border transition-all text-left w-full group"
      style={{
        backgroundColor: highlight ? `${color}10` : styles.bgCard,
        borderColor: highlight ? `${color}40` : styles.border,
      }}
      disabled={!onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color ? `${color}15` : styles.bgSecondary }}
        >
          <Icon size={20} style={{ color: color || styles.textMuted }} weight={highlight ? 'fill' : 'regular'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs truncate" style={{ color: styles.textMuted }}>
            {label}
          </div>
          <div className="text-xl font-bold" style={{ color: highlight ? color : styles.textPrimary }}>
            {value}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-0.5">
              {trend.isPositive ? (
                <TrendDown size={12} style={{ color: styles.success }} />
              ) : (
                <TrendUp size={12} style={{ color: styles.error }} />
              )}
              <span
                className="text-xs"
                style={{ color: trend.isPositive ? styles.success : styles.error }}
              >
                {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {onClick && (
          <ArrowRight
            size={16}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: styles.textMuted }}
          />
        )}
      </div>
    </button>
  );
};

export const BuyerExpenses: React.FC<BuyerExpensesProps> = ({ onNavigate }) => {
  const { styles, t, direction, language } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // State
  const [dashboard, setDashboard] = useState<ExpenseAnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }
      const data = await expenseAnalyticsService.getDashboard(token, { period: 'month' });
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expense analytics');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate to workspace
  const openInWorkspace = () => {
    onNavigate?.('workspace', { tab: 'expenses' });
  };

  const summary = dashboard?.summary;

  // Section 2: Decision-Focused Summary
  const summarySection = summary && (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <ExpenseStatCard
        label={t('buyer.expenses.totalSpend') || 'Total Spend'}
        value={formatExpenseAmount(summary.totalSpend, 'SAR', language)}
        icon={CurrencyCircleDollar}
        color={styles.info}
        trend={summary.periodComparison ? {
          value: summary.periodComparison.changePercent,
          isPositive: summary.periodComparison.changePercent < 0,
        } : undefined}
        onClick={openInWorkspace}
      />
      <ExpenseStatCard
        label={t('buyer.expenses.leakageAmount') || 'Spend Leakage'}
        value={formatExpenseAmount(summary.leakageAmount, 'SAR', language)}
        icon={Warning}
        color={styles.error}
        highlight={(summary.leakageCount || 0) > 0}
        onClick={openInWorkspace}
      />
      <ExpenseStatCard
        label={t('buyer.expenses.priceDriftImpact') || 'Price Drift'}
        value={formatExpenseAmount(summary.priceDriftImpact, 'SAR', language)}
        icon={TrendUp}
        color="#f59e0b"
        onClick={openInWorkspace}
      />
      <ExpenseStatCard
        label={t('buyer.expenses.budgetUtilization') || 'Budget Used'}
        value={`${(summary.budgetUtilization || 0).toFixed(0)}%`}
        icon={Wallet}
        color={summary.budgetUtilization && summary.budgetUtilization > 90 ? styles.error : styles.success}
        highlight={summary.budgetUtilization ? summary.budgetUtilization > 90 : false}
        onClick={openInWorkspace}
      />
    </div>
  );

  // Section 4: Quick Actions (Secondary)
  const quickActionsSection = summary && (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <QuickActionCard
        title={t('buyer.expenses.viewAnalytics') || 'View Analytics'}
        description="Detailed spend analysis and trends"
        icon={ChartLine}
        color={styles.info}
        onClick={openInWorkspace}
      />
      {(summary.leakageCount || 0) > 0 && (
        <QuickActionCard
          title={t('buyer.expenses.reviewLeakages') || 'Review Leakages'}
          description={`${summary.leakageCount} issues detected`}
          icon={Warning}
          color={styles.error}
          onClick={openInWorkspace}
        />
      )}
      {(summary.priceDriftImpact || 0) > 0 && (
        <QuickActionCard
          title={t('buyer.expenses.checkPriceDrift') || 'Check Price Drifts'}
          description="Monitor supplier price changes"
          icon={TrendUp}
          color="#f59e0b"
          onClick={openInWorkspace}
        />
      )}
      <QuickActionCard
        title={t('buyer.expenses.viewBudget') || 'Budget vs Actual'}
        description="Compare spending against budget"
        icon={Wallet}
        color={styles.success}
        onClick={openInWorkspace}
      />
    </div>
  );

  return (
    <PageLayout
      // Section 1: Page Purpose Statement
      title={t('buyer.expenses.title') || 'Expense Analytics'}
      subtitle={t('buyer.expenses.subtitle') || 'Monitor spending patterns and identify savings opportunities'}
      headerActions={
        <Button onClick={openInWorkspace} variant="primary">
          <Cube size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
          {t('buyer.expenses.openInWorkspace') || 'Open in Workspace'}
        </Button>
      }
      // States
      loading={isLoading}
      error={error}
      onRetry={fetchData}
      empty={{
        show: !isLoading && !error && !summary,
        icon: ChartLine,
        title: t('buyer.expenses.noExpenses') || 'No expense data yet',
        description: t('buyer.expenses.noExpensesDesc') || 'Start making purchases to see your expense analytics here.',
      }}
      // Section 2: Summary
      summary={summarySection}
      // Section 4: Secondary Actions
      quickActions={quickActionsSection}
      ctaBanner={summary ? {
        title: t('buyer.expenses.workspaceCTATitle') || 'Analyze Expenses in Workspace',
        description: t('buyer.expenses.workspaceCTADesc') || 'Access detailed analytics and category breakdowns.',
        action: (
          <Button onClick={openInWorkspace} variant="primary" size="lg">
            <Cube size={18} className={isRtl ? 'ml-2' : 'mr-2'} />
            {t('buyer.expenses.openInWorkspace') || 'Open Workspace'}
          </Button>
        ),
        color: styles.info,
      } : undefined}
      secondaryExpanded={false}
    >
      {/* Section 3: Primary Content Area */}
      <div />
    </PageLayout>
  );
};

export default BuyerExpenses;
