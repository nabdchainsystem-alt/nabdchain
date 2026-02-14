// =============================================================================
// Buyer Expenses Page - Derived from PAID marketplace orders
// =============================================================================
// Expenses exist ONLY after payment is confirmed on marketplace orders.
// No manual expense creation - all data flows from the order lifecycle.
// Data: /api/purchases/buyer/expenses/stats
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ChartLine, CurrencyCircleDollar, Cube, Wallet, Spinner, Receipt } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { API_URL } from '../../../../config/api';
import { Container, PageHeader, Button, EmptyState } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { formatCurrency } from '../../utils';

interface BuyerExpensesProps {
  onNavigate?: (page: string, data?: Record<string, unknown>) => void;
}

interface ExpenseStats {
  totalSpend: number;
  transactionCount: number;
  currency: string;
  currentMonth: { amount: number; count: number };
  previousMonth: { amount: number; count: number };
  changePercent: number;
  monthlyBreakdown: Array<{ month: string; amount: number; count: number }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  topSuppliers: Array<{ sellerId: string; name: string; amount: number }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#ec4899', '#06b6d4'];

export const BuyerExpenses: React.FC<BuyerExpensesProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  const [stats, setStats] = useState<ExpenseStats | null>(null);
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

      const statsRes = await fetch(`${API_URL}/purchases/buyer/expenses/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!statsRes.ok) throw new Error('Failed to fetch expense stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expense data');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('buyer.expenses.title') || 'Expense Analytics'}
          subtitle={t('buyer.expenses.subtitle') || 'Spending derived from confirmed payments on your orders'}
          actions={
            <Button onClick={() => onNavigate?.('workspace', { tab: 'expenses' })} variant="primary">
              <Cube size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
              {t('buyer.expenses.openInWorkspace') || 'Open in Workspace'}
            </Button>
          }
        />

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} className="animate-spin" style={{ color: styles.textMuted }} />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div
            className="rounded-lg p-6 border text-center mb-6"
            style={{ backgroundColor: `${styles.error}10`, borderColor: `${styles.error}30` }}
          >
            <p className="font-medium mb-2" style={{ color: styles.error }}>
              {error}
            </p>
            <Button variant="secondary" onClick={fetchData}>
              {t('common.retry') || 'Try Again'}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && (!stats || stats.transactionCount === 0) && (
          <EmptyState
            icon={ChartLine}
            title={t('buyer.expenses.noExpenses') || 'No expenses yet'}
            description="Expenses are automatically generated when your orders are paid. Complete a purchase to see your spending here."
          />
        )}

        {/* Content */}
        {!isLoading && !error && stats && stats.transactionCount > 0 && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KPICard
                id="totalSpend"
                label={t('buyer.expenses.totalSpend') || 'Total Spend'}
                value={formatCurrency(stats.totalSpend, stats.currency)}
                change={stats.changePercent !== 0 ? `${stats.changePercent > 0 ? '+' : ''}${stats.changePercent}%` : ''}
                trend={stats.changePercent < 0 ? 'up' : stats.changePercent > 0 ? 'down' : 'neutral'}
                icon={<CurrencyCircleDollar size={18} />}
                color="blue"
              />
              <KPICard
                id="thisMonth"
                label="This Month"
                value={formatCurrency(stats.currentMonth.amount, stats.currency)}
                change={`${stats.currentMonth.count} payments`}
                trend="neutral"
                icon={<Receipt size={18} />}
                color="blue"
              />
              <KPICard
                id="lastMonth"
                label="Last Month"
                value={formatCurrency(stats.previousMonth.amount, stats.currency)}
                change={`${stats.previousMonth.count} payments`}
                trend="neutral"
                icon={<Wallet size={18} />}
                color="blue"
              />
              <KPICard
                id="transactions"
                label="Total Payments"
                value={stats.transactionCount.toString()}
                change=""
                trend="neutral"
                icon={<ChartLine size={18} />}
                color="emerald"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Category Breakdown */}
              <div
                className="p-6 rounded-lg border"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <h3 className="text-sm font-semibold mb-4" style={{ color: styles.textPrimary }}>
                  Spend by Category
                </h3>
                <div className="space-y-3">
                  {stats.categoryBreakdown.map((cat, idx) => (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                          {cat.category}
                        </span>
                        <span className="text-sm" style={{ color: styles.textSecondary }}>
                          {formatCurrency(cat.amount, stats.currency)} ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Suppliers */}
              <div
                className="p-6 rounded-lg border"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <h3 className="text-sm font-semibold mb-4" style={{ color: styles.textPrimary }}>
                  Top Suppliers by Spend
                </h3>
                <div className="space-y-3">
                  {stats.topSuppliers.map((supplier, idx) => (
                    <div
                      key={supplier.sellerId}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: idx < 3 ? '#f59e0b15' : styles.bgHover,
                            color: idx < 3 ? '#f59e0b' : styles.textMuted,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                          {supplier.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                        {formatCurrency(supplier.amount, stats.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div
              className="p-6 rounded-lg border"
              style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
            >
              <h3 className="text-sm font-semibold mb-4" style={{ color: styles.textPrimary }}>
                Monthly Spending
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${styles.border}` }}>
                      <th
                        className="pb-3 text-xs font-medium"
                        style={{ color: styles.textMuted, textAlign: isRtl ? 'right' : 'left' }}
                      >
                        Month
                      </th>
                      <th className="pb-3 text-xs font-medium text-right" style={{ color: styles.textMuted }}>
                        Amount
                      </th>
                      <th className="pb-3 text-xs font-medium text-center" style={{ color: styles.textMuted }}>
                        Payments
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.monthlyBreakdown.slice(0, 12).map((month) => (
                      <tr key={month.month} className="border-t" style={{ borderColor: styles.border }}>
                        <td className="py-3 text-sm font-medium" style={{ color: styles.textPrimary }}>
                          {formatMonth(month.month)}
                        </td>
                        <td className="py-3 text-sm text-right font-semibold" style={{ color: styles.textPrimary }}>
                          {formatCurrency(month.amount, stats.currency)}
                        </td>
                        <td className="py-3 text-sm text-center" style={{ color: styles.textMuted }}>
                          {month.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default BuyerExpenses;
