// =============================================================================
// Purchases Page - Lightweight Entry Point
// =============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  ShoppingCart,
  CheckCircle,
  Warning,
  Clock,
  Cube,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  Spinner,
  ArrowRight,
} from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState, QuickActionCard } from '../../components';
import { formatCurrency } from '../../utils';
import { usePortal } from '../../context/PortalContext';
import {
  Purchase,
  PurchaseStats,
  defaultSmartFilters,
} from '../../types/purchase.types';

interface PurchasesProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

// Mock data - in production this would come from API
const MOCK_PURCHASES: Purchase[] = [
  {
    id: 'purch-1',
    orderNumber: 'ORD-2025-0156',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    buyerName: 'HydroTech Solutions',
    itemId: 'item-1',
    itemName: 'Industrial Hydraulic Pump',
    itemSku: 'HYD-PUMP-001',
    quantity: 5,
    unitPrice: 2350,
    totalPrice: 11750,
    currency: 'SAR',
    status: 'shipped',
    paymentStatus: 'paid',
    fulfillmentStatus: 'out_for_delivery',
    source: 'rfq',
    healthStatus: 'on_track',
    healthScore: 85,
    historicalAvgPrice: 2400,
    priceVariance: -2.1,
    priceTrend: 'down',
    supplierOnTimeRate: 94,
    supplierQualityScore: 4.5,
    supplierTotalOrders: 12,
    buyerUrgencyScore: 35,
    calculatedUrgency: 'low',
    savingsCategory: 'good_deal',
    trackingNumber: 'SA123456789',
    carrier: 'Aramex',
    estimatedDelivery: '2025-01-28',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-20T14:00:00Z',
    auditLog: [],
  },
  {
    id: 'purch-2',
    orderNumber: 'ORD-2025-0157',
    buyerId: 'buyer-1',
    sellerId: 'seller-2',
    buyerName: 'SKF Authorized Dealer',
    itemId: 'item-2',
    itemName: 'Steel Bearings Set',
    itemSku: 'BRG-STL-100',
    quantity: 100,
    unitPrice: 45,
    totalPrice: 4500,
    currency: 'SAR',
    status: 'delivered',
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    source: 'direct_buy',
    healthStatus: 'on_track',
    healthScore: 100,
    historicalAvgPrice: 42,
    priceVariance: 7.1,
    priceTrend: 'up',
    supplierOnTimeRate: 98,
    supplierQualityScore: 4.8,
    supplierTotalOrders: 25,
    buyerUrgencyScore: 0,
    calculatedUrgency: 'low',
    savingsCategory: 'overpaying',
    createdAt: '2025-01-10T09:15:00Z',
    updatedAt: '2025-01-18T11:30:00Z',
    auditLog: [],
  },
  {
    id: 'purch-3',
    orderNumber: 'ORD-2025-0158',
    buyerId: 'buyer-1',
    sellerId: 'seller-3',
    buyerName: 'Atlas Copco MENA',
    itemId: 'item-3',
    itemName: 'Air Compressor Unit',
    itemSku: 'CMP-AIR-500',
    quantity: 2,
    unitPrice: 8250,
    totalPrice: 16500,
    currency: 'SAR',
    status: 'in_progress',
    paymentStatus: 'paid',
    fulfillmentStatus: 'packing',
    source: 'rfq',
    healthStatus: 'at_risk',
    healthScore: 65,
    historicalAvgPrice: 8100,
    priceVariance: 1.9,
    priceTrend: 'stable',
    supplierOnTimeRate: 85,
    supplierQualityScore: 4.2,
    supplierTotalOrders: 8,
    buyerUrgencyScore: 72,
    calculatedUrgency: 'high',
    savingsCategory: 'average',
    estimatedDelivery: '2025-01-30',
    createdAt: '2025-01-18T11:20:00Z',
    updatedAt: '2025-01-19T09:00:00Z',
    auditLog: [],
  },
  {
    id: 'purch-4',
    orderNumber: 'ORD-2025-0159',
    buyerId: 'buyer-1',
    sellerId: 'seller-4',
    buyerName: 'Siemens Industrial',
    itemId: 'item-4',
    itemName: 'Electric Motor 15KW',
    itemSku: 'MTR-ELC-15K',
    quantity: 3,
    unitPrice: 3200,
    totalPrice: 9600,
    currency: 'SAR',
    status: 'confirmed',
    paymentStatus: 'authorized',
    fulfillmentStatus: 'not_started',
    source: 'direct_buy',
    healthStatus: 'on_track',
    healthScore: 90,
    supplierOnTimeRate: 99,
    supplierQualityScore: 4.9,
    supplierTotalOrders: 5,
    buyerUrgencyScore: 25,
    calculatedUrgency: 'low',
    savingsCategory: 'average',
    estimatedDelivery: '2025-02-05',
    createdAt: '2025-01-20T08:45:00Z',
    updatedAt: '2025-01-20T15:00:00Z',
    auditLog: [],
  },
  {
    id: 'purch-5',
    orderNumber: 'ORD-2025-0160',
    buyerId: 'buyer-1',
    sellerId: 'seller-5',
    buyerName: 'FlowControl Systems',
    itemId: 'item-5',
    itemName: 'Valve Assembly Kit',
    itemSku: 'VLV-KIT-200',
    quantity: 25,
    unitPrice: 180,
    totalPrice: 4500,
    currency: 'SAR',
    status: 'pending_confirmation',
    paymentStatus: 'unpaid',
    fulfillmentStatus: 'not_started',
    source: 'rfq',
    healthStatus: 'delayed',
    healthScore: 40,
    hasException: true,
    exceptionType: 'late_confirmation',
    exceptionMessage: 'Seller has not confirmed order within SLA',
    historicalAvgPrice: 175,
    priceVariance: 2.9,
    priceTrend: 'up',
    supplierOnTimeRate: 72,
    supplierQualityScore: 3.5,
    supplierTotalOrders: 3,
    buyerUrgencyScore: 88,
    calculatedUrgency: 'critical',
    savingsCategory: 'average',
    createdAt: '2025-01-21T14:00:00Z',
    updatedAt: '2025-01-21T14:00:00Z',
    auditLog: [],
  },
];

// Stat Card Component
const StatCard: React.FC<{
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

export const Purchases: React.FC<PurchasesProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // State
  const [purchases] = useState<Purchase[]>(MOCK_PURCHASES);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSpend = purchases.reduce((sum, p) => sum + p.totalPrice, 0);
    const active = purchases.filter(p => !['delivered', 'cancelled'].includes(p.status)).length;
    const onTrack = purchases.filter(p => p.healthStatus === 'on_track').length;
    const atRisk = purchases.filter(p => p.healthStatus === 'at_risk' || p.healthStatus === 'delayed').length;
    const potentialSavings = purchases
      .filter(p => p.savingsCategory === 'overpaying' && p.priceVariance)
      .reduce((sum, p) => sum + (p.totalPrice * (p.priceVariance || 0) / 100), 0);
    const avgPriceVariance = purchases
      .filter(p => p.priceVariance !== undefined)
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
              <StatCard
                label={t('buyer.purchases.totalSpend') || 'Total Spend'}
                value={formatCurrency(stats.totalSpend, stats.currency)}
                icon={CurrencyDollar}
                color={styles.info}
                onClick={() => openInWorkspace()}
              />
              <StatCard
                label={t('buyer.purchases.activeOrders') || 'Active Orders'}
                value={stats.activeOrders.toString()}
                icon={Package}
                color={styles.info}
                onClick={() => openInWorkspace({ status: 'active' })}
              />
              <StatCard
                label={t('buyer.purchases.onTrack') || 'On Track'}
                value={stats.onTrack.toString()}
                icon={CheckCircle}
                color={styles.success}
                onClick={() => openInWorkspace({ risk: 'on_track' })}
              />
              <StatCard
                label={t('buyer.purchases.atRisk') || 'At Risk'}
                value={stats.atRisk.toString()}
                icon={Warning}
                color="#f59e0b"
                highlight={stats.atRisk > 0}
                onClick={() => openInWorkspace({ risk: 'at_risk' })}
              />
              <StatCard
                label={t('buyer.purchases.potentialSavings') || 'Potential Savings'}
                value={formatCurrency(stats.potentialSavings, stats.currency)}
                icon={TrendDown}
                color={styles.success}
                trend={stats.avgPriceVariance !== 0 ? { value: stats.avgPriceVariance, isPositive: stats.avgPriceVariance < 0 } : undefined}
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
                    {t('buyer.purchases.workspaceCTADesc') || 'Access smart filters, price intelligence, and supplier performance metrics in your centralized workspace.'}
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
