// =============================================================================
// Buyer Expenses Page - Unified Page Structure
// =============================================================================
// Purpose: Monitor spending patterns and identify savings opportunities
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ChartLine, TrendUp, Warning, CurrencyCircleDollar, Cube, Wallet } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { PageLayout, Button, QuickActionCard } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { useAuth } from '../../../../auth-adapter';
import { expenseAnalyticsService } from '../../services/expenseAnalyticsService';
import { ExpenseAnalyticsDashboard, formatExpenseAmount } from '../../types/expense.types';

interface BuyerExpensesProps {
  onNavigate?: (page: string, data?: Record<string, unknown>) => void;
}

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        id="totalSpend"
        label={t('buyer.expenses.totalSpend') || 'Total Spend'}
        value={formatExpenseAmount(summary.totalSpend, 'SAR', language)}
        change={
          summary.periodComparison
            ? `${summary.periodComparison.changePercent > 0 ? '+' : ''}${summary.periodComparison.changePercent.toFixed(1)}%`
            : ''
        }
        trend={
          summary.periodComparison
            ? summary.periodComparison.changePercent < 0
              ? 'up'
              : summary.periodComparison.changePercent > 0
                ? 'down'
                : 'neutral'
            : 'neutral'
        }
        icon={<CurrencyCircleDollar size={18} />}
        color="blue"
      />
      <KPICard
        id="spendLeakage"
        label={t('buyer.expenses.leakageAmount') || 'Spend Leakage'}
        value={formatExpenseAmount(summary.leakageAmount, 'SAR', language)}
        change=""
        trend={(summary.leakageCount || 0) > 0 ? 'down' : 'neutral'}
        icon={<Warning size={18} />}
        color="red"
      />
      <KPICard
        id="priceDrift"
        label={t('buyer.expenses.priceDriftImpact') || 'Price Drift'}
        value={formatExpenseAmount(summary.priceDriftImpact, 'SAR', language)}
        change=""
        trend="neutral"
        icon={<TrendUp size={18} />}
        color="amber"
      />
      <KPICard
        id="budgetUsed"
        label={t('buyer.expenses.budgetUtilization') || 'Budget Used'}
        value={`${(summary.budgetUtilization || 0).toFixed(0)}%`}
        change=""
        trend={summary.budgetUtilization && summary.budgetUtilization > 90 ? 'down' : 'up'}
        icon={<Wallet size={18} />}
        color={summary.budgetUtilization && summary.budgetUtilization > 90 ? 'red' : 'emerald'}
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
      ctaBanner={
        summary
          ? {
              title: t('buyer.expenses.workspaceCTATitle') || 'Analyze Expenses in Workspace',
              description: t('buyer.expenses.workspaceCTADesc') || 'Access detailed analytics and category breakdowns.',
              action: (
                <Button onClick={openInWorkspace} variant="primary" size="lg">
                  <Cube size={18} className={isRtl ? 'ml-2' : 'mr-2'} />
                  {t('buyer.expenses.openInWorkspace') || 'Open Workspace'}
                </Button>
              ),
              color: styles.info,
            }
          : undefined
      }
      secondaryExpanded={false}
    >
      {/* Section 3: Primary Content Area */}
      <div />
    </PageLayout>
  );
};

export default BuyerExpenses;
