// =============================================================================
// My Orders Page - Unified Page Structure
// =============================================================================
// Purpose: Track and manage buyer's orders with decision-focused insights
// =============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Truck,
  Warning,
  WarningCircle,
  Cube,
  Handshake,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import {
  PageLayout,
  Button,
  StatCard,
  QuickActionCard,
} from '../../components';
import { usePortal } from '../../context/PortalContext';
import { marketplaceOrderService } from '../../services/marketplaceOrderService';
import { MarketplaceOrder } from '../../types/item.types';

interface MyOrdersProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // State
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) return;
        const response = await marketplaceOrderService.getBuyerOrders(token, { limit: 100 });
        setOrders(response.orders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(t('common.errorLoading') || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [getToken, t]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = orders.filter(o => ['pending_confirmation', 'confirmed', 'processing'].includes(o.status)).length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const atRisk = orders.filter(o => o.healthStatus === 'at_risk' || o.healthStatus === 'delayed').length;
    const issues = orders.filter(o => o.hasException || o.healthStatus === 'critical').length;
    return { active, shipped, delivered, atRisk, issues, total: orders.length };
  }, [orders]);

  // Navigate to workspace with filters
  const openInWorkspace = (filters?: { status?: string; health?: string }) => {
    onNavigate('workspace', { tab: 'orders', filters });
  };

  // Retry handler
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
  };

  // Section 2: Decision-Focused Summary
  const summarySection = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard
        label={t('buyer.orders.active')}
        value={stats.active.toString()}
        icon={Package}
        color={styles.info}
        onClick={() => openInWorkspace({ status: 'processing' })}
      />
      <StatCard
        label={t('buyer.orders.inTransit')}
        value={stats.shipped.toString()}
        icon={Truck}
        color={styles.info}
        onClick={() => openInWorkspace({ status: 'shipped' })}
      />
      <StatCard
        label={t('buyer.orders.delivered')}
        value={stats.delivered.toString()}
        icon={Handshake}
        color={styles.success}
        onClick={() => openInWorkspace({ status: 'delivered' })}
      />
      <StatCard
        label={t('buyer.orders.atRiskOrders')}
        value={stats.atRisk.toString()}
        icon={Warning}
        color="#f59e0b"
        highlight={stats.atRisk > 0}
        onClick={() => openInWorkspace({ health: 'at_risk' })}
      />
      <StatCard
        label={t('buyer.orders.issues')}
        value={stats.issues.toString()}
        icon={WarningCircle}
        color={styles.error}
        highlight={stats.issues > 0}
        onClick={() => openInWorkspace({ health: 'critical' })}
      />
    </div>
  );

  // Section 4: Quick Actions (Secondary)
  const quickActionsSection = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <QuickActionCard
        title={t('buyer.orders.viewAllOrders') || 'View All Orders'}
        description={t('buyer.orders.viewAllOrdersDesc') || `${stats.total} total orders`}
        icon={Package}
        color={styles.info}
        onClick={() => openInWorkspace()}
      />
      <QuickActionCard
        title={t('buyer.orders.trackShipments') || 'Track Shipments'}
        description={t('buyer.orders.trackShipmentsDesc') || `${stats.shipped} in transit`}
        icon={Truck}
        color={styles.info}
        onClick={() => openInWorkspace({ status: 'shipped' })}
      />
      {stats.atRisk > 0 && (
        <QuickActionCard
          title={t('buyer.orders.reviewAtRisk') || 'Review At-Risk'}
          description={`${stats.atRisk} orders need attention`}
          icon={Warning}
          color="#f59e0b"
          onClick={() => openInWorkspace({ health: 'at_risk' })}
        />
      )}
      {stats.issues > 0 && (
        <QuickActionCard
          title={t('buyer.orders.resolveIssues') || 'Resolve Issues'}
          description={`${stats.issues} orders have issues`}
          icon={WarningCircle}
          color={styles.error}
          onClick={() => openInWorkspace({ health: 'critical' })}
        />
      )}
    </div>
  );

  return (
    <PageLayout
      // Section 1: Page Purpose Statement
      title={t('buyer.orders.title')}
      subtitle={t('buyer.orders.subtitle')}
      headerActions={
        <Button onClick={() => openInWorkspace()} variant="primary">
          <Cube size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
          {t('buyer.orders.openInWorkspace') || 'Open in Workspace'}
        </Button>
      }
      // States
      loading={isLoading}
      error={error}
      onRetry={handleRetry}
      empty={{
        show: !isLoading && orders.length === 0,
        icon: Package,
        title: t('buyer.orders.noOrders'),
        description: t('buyer.orders.noOrdersDesc'),
        action: (
          <Button onClick={() => onNavigate('marketplace')}>
            {t('buyer.orders.browseMarketplace')}
          </Button>
        ),
      }}
      // Section 2: Summary
      summary={summarySection}
      // Section 4: Secondary Actions
      quickActions={quickActionsSection}
      ctaBanner={{
        title: t('buyer.orders.workspaceCTATitle') || 'Manage Orders in Workspace',
        description: t('buyer.orders.workspaceCTADesc') || 'Access advanced filters, bulk actions, and detailed order management.',
        action: (
          <Button onClick={() => openInWorkspace()} variant="primary" size="lg">
            <Cube size={18} className={isRtl ? 'ml-2' : 'mr-2'} />
            {t('buyer.orders.openInWorkspace') || 'Open Workspace'}
          </Button>
        ),
        color: styles.info,
      }}
      secondaryExpanded={false}
    >
      {/* Section 3: Primary Content Area */}
      {/* This space is reserved for the main content like order list preview */}
      {/* Currently using summary-first approach - primary content in workspace */}
      <div />
    </PageLayout>
  );
};

export default MyOrders;
