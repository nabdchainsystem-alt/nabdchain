// =============================================================================
// Buyer Invoices Page - Unified Page Structure
// =============================================================================
// Purpose: View and manage payment invoices with payment status insights
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { marketplaceInvoiceService } from '../../services/marketplaceInvoiceService';
import {
  Receipt,
  CurrencyDollar,
  Warning,
  Clock,
  Cube,
  CheckCircle,
} from 'phosphor-react';
import {
  PageLayout,
  Button,
  StatCard,
  QuickActionCard,
} from '../../components';
import { usePortal } from '../../context/PortalContext';
import { InvoiceStats, formatInvoiceAmount } from '../../types/invoice.types';

interface BuyerInvoicesProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export const BuyerInvoices: React.FC<BuyerInvoicesProps> = ({ onNavigate }) => {
  const { getToken } = useAuth();
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // State
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }
      const statsRes = await marketplaceInvoiceService.getBuyerInvoiceStats(token);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate to workspace
  const openInWorkspace = (filters?: { status?: string }) => {
    onNavigate('workspace', { tab: 'invoices', filters });
  };

  // Section 2: Decision-Focused Summary
  const summarySection = stats && (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label={t('buyer.invoices.totalInvoices') || 'Total Invoices'}
        value={stats.total.toString()}
        icon={Receipt}
        color={styles.info}
        onClick={() => openInWorkspace()}
      />
      <StatCard
        label={t('buyer.invoices.pendingPayment') || 'Pending Payment'}
        value={stats.issued.toString()}
        icon={Clock}
        color="#f59e0b"
        highlight={stats.issued > 0}
        onClick={() => openInWorkspace({ status: 'issued' })}
      />
      <StatCard
        label={t('buyer.invoices.overdue') || 'Overdue'}
        value={stats.overdue.toString()}
        icon={Warning}
        color={styles.error}
        highlight={stats.overdue > 0}
        onClick={() => openInWorkspace({ status: 'overdue' })}
      />
      <StatCard
        label={t('buyer.invoices.outstanding') || 'Outstanding'}
        value={formatInvoiceAmount(stats.totalOutstanding, stats.currency)}
        icon={CurrencyDollar}
        color={styles.info}
      />
    </div>
  );

  // Section 4: Quick Actions (Secondary)
  const quickActionsSection = stats && (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <QuickActionCard
        title={t('buyer.invoices.viewAllInvoices') || 'View All Invoices'}
        description={`${stats.total} total invoices`}
        icon={Receipt}
        color={styles.info}
        onClick={() => openInWorkspace()}
      />
      {stats.issued > 0 && (
        <QuickActionCard
          title={t('buyer.invoices.payPending') || 'Pay Pending'}
          description={`${stats.issued} awaiting payment`}
          icon={CurrencyDollar}
          color="#f59e0b"
          onClick={() => openInWorkspace({ status: 'issued' })}
        />
      )}
      {stats.overdue > 0 && (
        <QuickActionCard
          title={t('buyer.invoices.resolveOverdue') || 'Resolve Overdue'}
          description={`${stats.overdue} past due date`}
          icon={Warning}
          color={styles.error}
          onClick={() => openInWorkspace({ status: 'overdue' })}
        />
      )}
      <QuickActionCard
        title={t('buyer.invoices.viewPaid') || 'View Paid'}
        description="Review completed payments"
        icon={CheckCircle}
        color={styles.success}
        onClick={() => openInWorkspace({ status: 'paid' })}
      />
    </div>
  );

  return (
    <PageLayout
      // Section 1: Page Purpose Statement
      title={t('buyer.invoices.title') || 'My Invoices'}
      subtitle={t('buyer.invoices.subtitle') || 'View and manage your payment invoices'}
      headerActions={
        <Button onClick={() => openInWorkspace()} variant="primary">
          <Cube size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
          {t('buyer.invoices.openInWorkspace') || 'Open in Workspace'}
        </Button>
      }
      // States
      loading={loading}
      error={error}
      onRetry={loadData}
      empty={{
        show: !loading && !error && stats?.total === 0,
        icon: Receipt,
        title: t('buyer.invoices.noInvoices') || 'No invoices yet',
        description: t('buyer.invoices.noInvoicesDesc') || "You'll see invoices here once your orders are delivered.",
      }}
      // Section 2: Summary
      summary={summarySection}
      // Section 4: Secondary Actions
      quickActions={quickActionsSection}
      ctaBanner={stats && stats.total > 0 ? {
        title: t('buyer.invoices.workspaceCTATitle') || 'Manage Invoices in Workspace',
        description: t('buyer.invoices.workspaceCTADesc') || 'Access detailed invoice management and payment tracking.',
        action: (
          <Button onClick={() => openInWorkspace()} variant="primary" size="lg">
            <Cube size={18} className={isRtl ? 'ml-2' : 'mr-2'} />
            {t('buyer.invoices.openInWorkspace') || 'Open Workspace'}
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

export default BuyerInvoices;
