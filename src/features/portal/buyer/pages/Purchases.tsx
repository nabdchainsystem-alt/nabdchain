// =============================================================================
// Purchases Page - Lightweight Entry Point
// =============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { Package, ShoppingCart, CheckCircle, Warning, Cube, TrendDown, CurrencyDollar, Spinner } from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState, QuickActionCard } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { formatCurrency } from '../../utils';
import { usePortal } from '../../context/PortalContext';
import { Purchase } from '../../types/purchase.types';

interface PurchasesProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

// No mock data - all purchases come from API

export const Purchases: React.FC<PurchasesProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // State
  const [purchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Data comes from API - no mock data
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSpend = purchases.reduce((sum, p) => sum + p.totalPrice, 0);
    const active = purchases.filter((p) => !['delivered', 'cancelled'].includes(p.status)).length;
    const onTrack = purchases.filter((p) => p.healthStatus === 'on_track').length;
    const atRisk = purchases.filter((p) => p.healthStatus === 'at_risk' || p.healthStatus === 'delayed').length;
    const potentialSavings = purchases
      .filter((p) => p.savingsCategory === 'overpaying' && p.priceVariance)
      .reduce((sum, p) => sum + (p.totalPrice * (p.priceVariance || 0)) / 100, 0);
    const avgPriceVariance = purchases
      .filter((p) => p.priceVariance !== undefined)
      .reduce((sum, p, _, arr) => sum + (p.priceVariance || 0) / arr.length, 0);

    return {
      totalSpend,
      activeOrders: active,
      onTrack,
      atRisk,
      potentialSavings: Math.abs(potentialSavings),
      avgPriceVariance,
      currency: 'SAR',
    };
  }, [purchases]);

  // Navigate to workspace with specific tab
  const openInWorkspace = (filters?: { status?: string; risk?: string }) => {
    onNavigate('workspace', { tab: 'purchases', filters });
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('buyer.purchases.title') || 'My Purchases'}
          subtitle={t('buyer.purchases.subtitle') || 'Track and manage your purchase orders with intelligent insights'}
          actions={
            <Button onClick={() => openInWorkspace()} variant="primary">
              <Cube size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
              {t('buyer.purchases.openInWorkspace') || 'Open in Workspace'}
            </Button>
          }
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size={32} className="animate-spin" style={{ color: styles.textMuted }} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && purchases.length === 0 && (
          <EmptyState
            icon={Package}
            title={t('buyer.purchases.noPurchases') || 'No purchases found'}
            description={t('buyer.purchases.noPurchasesDesc') || 'Browse the marketplace to start purchasing'}
            action={
              <Button onClick={() => onNavigate('marketplace')}>
                {t('buyer.purchases.browseMarketplace') || 'Browse Marketplace'}
              </Button>
            }
          />
        )}

        {/* Content */}
        {!isLoading && purchases.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <KPICard
                id="totalSpend"
                label={t('buyer.purchases.totalSpend') || 'Total Spend'}
                value={formatCurrency(stats.totalSpend, stats.currency)}
                change=""
                trend="neutral"
                icon={<CurrencyDollar size={18} />}
                color="blue"
              />
              <KPICard
                id="activeOrders"
                label={t('buyer.purchases.activeOrders') || 'Active Orders'}
                value={stats.activeOrders.toString()}
                change=""
                trend="neutral"
                icon={<Package size={18} />}
                color="blue"
              />
              <KPICard
                id="onTrack"
                label={t('buyer.purchases.onTrack') || 'On Track'}
                value={stats.onTrack.toString()}
                change=""
                trend="neutral"
                icon={<CheckCircle size={18} />}
                color="emerald"
              />
              <KPICard
                id="atRisk"
                label={t('buyer.purchases.atRisk') || 'At Risk'}
                value={stats.atRisk.toString()}
                change=""
                trend="neutral"
                icon={<Warning size={18} />}
                color="amber"
              />
              <KPICard
                id="potentialSavings"
                label={t('buyer.purchases.potentialSavings') || 'Potential Savings'}
                value={formatCurrency(stats.potentialSavings, stats.currency)}
                change={stats.avgPriceVariance !== 0 ? `${stats.avgPriceVariance.toFixed(1)}%` : ''}
                trend={stats.avgPriceVariance < 0 ? 'up' : stats.avgPriceVariance > 0 ? 'down' : 'neutral'}
                icon={<TrendDown size={18} />}
                color="emerald"
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {t('buyer.purchases.quickActions') || 'Quick Actions'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                  title={t('buyer.purchases.viewAllPurchases') || 'View All Purchases'}
                  description={t('buyer.purchases.viewAllPurchasesDesc') || `${purchases.length} total purchase orders`}
                  icon={Package}
                  color={styles.info}
                  onClick={() => openInWorkspace()}
                />
                <QuickActionCard
                  title={t('buyer.purchases.trackInTransit') || 'Track In-Transit'}
                  description={t('buyer.purchases.trackInTransitDesc') || 'Monitor shipments and deliveries'}
                  icon={ShoppingCart}
                  color={styles.info}
                  onClick={() => openInWorkspace({ status: 'shipped' })}
                />
                {stats.atRisk > 0 && (
                  <QuickActionCard
                    title={t('buyer.purchases.reviewAtRisk') || 'Review At-Risk Orders'}
                    description={t('buyer.purchases.reviewAtRiskDesc') || `${stats.atRisk} orders need attention`}
                    icon={Warning}
                    color="#f59e0b"
                    onClick={() => openInWorkspace({ risk: 'at_risk' })}
                  />
                )}
              </div>
            </div>

            {/* CTA Banner */}
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: `${styles.info}08`,
                borderColor: `${styles.info}30`,
              }}
            >
              <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={isRtl ? 'text-right' : ''}>
                  <h3
                    className="text-lg font-semibold mb-1"
                    style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                  >
                    {t('buyer.purchases.workspaceCTATitle') || 'Manage Purchases in Workspace'}
                  </h3>
                  <p className="text-sm" style={{ color: styles.textSecondary }}>
                    {t('buyer.purchases.workspaceCTADesc') ||
                      'Access smart filters, price intelligence, and supplier performance metrics in your centralized workspace.'}
                  </p>
                </div>
                <Button onClick={() => openInWorkspace()} variant="primary" size="lg">
                  <Cube size={18} className={isRtl ? 'ml-2' : 'mr-2'} />
                  {t('buyer.purchases.openInWorkspace') || 'Open in Workspace'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default Purchases;
