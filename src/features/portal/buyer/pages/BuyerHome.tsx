import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Package,
  ClockCounterClockwise,
  CurrencyDollar,
  Clock,
  TrendUp,
  Storefront,
  ChartLine,
  UsersThree,
  ShoppingCart,
} from 'phosphor-react';
import { Container, QuickActionCard } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { usePortal } from '../../context/PortalContext';
import { buyerAnalyticsService } from '../../services/buyerAnalyticsService';
import { BuyerAnalyticsSummary } from '../../types/analytics.types';
import { ArrowRight } from 'phosphor-react';

interface BuyerHomeProps {
  onNavigate: (page: string) => void;
}

// Format currency
const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1)}K`;
  }
  return `${currency} ${amount.toFixed(0)}`;
};

export const BuyerHome: React.FC<BuyerHomeProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const [analytics, setAnalytics] = useState<BuyerAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Empty analytics structure for when there's no data
  const emptyAnalytics: BuyerAnalyticsSummary = {
    kpis: {
      totalSpend: 0,
      rfqsSent: 0,
      avgResponseTime: 0,
      savingsVsMarket: 0,
      currency: 'SAR',
      trends: { spend: 0, rfqs: 0, responseTime: 0, savings: 0 },
    },
    spendByCategory: [],
    topSuppliers: [],
    rfqFunnel: {
      rfqsSent: 0,
      quotesReceived: 0,
      ordersPlaced: 0,
      rfqToQuoteRate: 0,
      quoteToOrderRate: 0,
      overallConversionRate: 0,
    },
    timeline: [],
    period: 'month',
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await buyerAnalyticsService.getAnalyticsSummary({ period: 'month' });
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      // On error, show empty state instead of error message
      setAnalytics(emptyAnalytics);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // KPI data derived from analytics
  const kpis = useMemo(() => {
    if (!analytics) return null;
    const { kpis: k } = analytics;
    return {
      totalSpend: {
        label: t('buyer.home.totalSpend') || 'Total Spend',
        value: formatCurrency(k.totalSpend, k.currency),
        change: k.trends.spend !== 0 ? `${k.trends.spend > 0 ? '+' : ''}${k.trends.spend}%` : undefined,
        trend: k.trends.spend > 0 ? 'up' : k.trends.spend < 0 ? 'down' : 'neutral',
        icon: <CurrencyDollar size={18} />,
      },
      rfqsSent: {
        label: t('buyer.home.rfqsSent') || 'RFQs Sent',
        value: k.rfqsSent.toString(),
        change: k.trends.rfqs !== 0 ? `${k.trends.rfqs > 0 ? '+' : ''}${k.trends.rfqs}%` : undefined,
        trend: k.trends.rfqs > 0 ? 'up' : k.trends.rfqs < 0 ? 'down' : 'neutral',
        icon: <FileText size={18} />,
      },
      avgResponseTime: {
        label: t('buyer.home.avgResponseTime') || 'Avg Response Time',
        value: k.avgResponseTime > 0 ? `${k.avgResponseTime.toFixed(1)}h` : '--',
        change: undefined,
        trend: 'neutral',
        icon: <Clock size={18} />,
      },
      savings: {
        label: t('buyer.home.savings') || 'Savings vs Market',
        value: k.savingsVsMarket > 0 ? `${k.savingsVsMarket}%` : '--',
        change: k.trends.savings !== 0 ? `${k.trends.savings > 0 ? '+' : ''}${k.trends.savings}%` : undefined,
        trend: k.trends.savings > 0 ? 'up' : k.trends.savings < 0 ? 'down' : 'neutral',
        icon: <TrendUp size={18} />,
      },
    };
  }, [analytics, t]);

  // RFQ-to-Order pipeline data
  const funnel = analytics?.rfqFunnel;

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isRtl ? 'صباح الخير' : 'Good morning';
    if (hour < 17) return isRtl ? 'مساء الخير' : 'Good afternoon';
    return isRtl ? 'مساء الخير' : 'Good evening';
  }, [isRtl]);

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="content">
        <div className="py-8">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-2xl font-semibold"
              style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
            >
              {greeting}
            </h1>
            <p className="mt-1 text-sm" style={{ color: styles.textMuted }}>
              {t('buyer.home.subtitle') || 'Welcome to your purchasing dashboard'}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              id="totalSpend"
              label={kpis?.totalSpend.label || 'Total Spend'}
              value={kpis?.totalSpend.value || '--'}
              change={kpis?.totalSpend.change || ''}
              trend={(kpis?.totalSpend.trend as 'up' | 'down' | 'neutral') || 'neutral'}
              icon={<CurrencyDollar size={18} />}
              loading={loading}
            />
            <KPICard
              id="rfqsSent"
              label={kpis?.rfqsSent.label || 'RFQs Sent'}
              value={kpis?.rfqsSent.value || '0'}
              change={kpis?.rfqsSent.change || ''}
              trend={(kpis?.rfqsSent.trend as 'up' | 'down' | 'neutral') || 'neutral'}
              icon={<FileText size={18} />}
              loading={loading}
            />
            <KPICard
              id="avgResponseTime"
              label={kpis?.avgResponseTime.label || 'Avg Response'}
              value={kpis?.avgResponseTime.value || '--'}
              change={kpis?.avgResponseTime.change || ''}
              trend={(kpis?.avgResponseTime.trend as 'up' | 'down' | 'neutral') || 'neutral'}
              icon={<Clock size={18} />}
              loading={loading}
            />
            <KPICard
              id="savings"
              label={kpis?.savings.label || 'Savings'}
              value={kpis?.savings.value || '--'}
              change={kpis?.savings.change || ''}
              trend={(kpis?.savings.trend as 'up' | 'down' | 'neutral') || 'neutral'}
              icon={<TrendUp size={18} />}
              loading={loading}
            />
          </div>

          {/* RFQ-to-Order Pipeline */}
          <div
            className="rounded-xl border p-4 mb-8"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {t('buyer.home.pipeline') || 'RFQ to Order Pipeline'}
              </h2>
              <span className="text-xs" style={{ color: styles.textMuted }}>
                {t('buyer.home.thisMonth') || 'This Month'}
              </span>
            </div>
            {loading ? (
              <div className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: styles.bgSecondary }} />
            ) : funnel && (funnel.rfqsSent > 0 || funnel.ordersPlaced > 0) ? (
              <div>
                {/* Funnel stages */}
                <div className="flex items-stretch gap-2">
                  {/* RFQs Sent */}
                  <div className="flex-1 rounded-lg p-3" style={{ backgroundColor: styles.bgSecondary }}>
                    <div
                      className="text-[10px] uppercase tracking-wide font-medium mb-1"
                      style={{ color: styles.textMuted }}
                    >
                      RFQs Sent
                    </div>
                    <div className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
                      {funnel.rfqsSent}
                    </div>
                  </div>

                  {/* Arrow + rate */}
                  <div className="flex flex-col items-center justify-center px-1" style={{ minWidth: 48 }}>
                    <ArrowRight size={16} style={{ color: styles.textMuted }} />
                    <span
                      className="text-[10px] font-medium mt-0.5"
                      style={{ color: funnel.rfqToQuoteRate > 0 ? styles.success : styles.textMuted }}
                    >
                      {funnel.rfqToQuoteRate}%
                    </span>
                  </div>

                  {/* Quotes Received */}
                  <div className="flex-1 rounded-lg p-3" style={{ backgroundColor: styles.bgSecondary }}>
                    <div
                      className="text-[10px] uppercase tracking-wide font-medium mb-1"
                      style={{ color: styles.textMuted }}
                    >
                      Quotes Received
                    </div>
                    <div className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
                      {funnel.quotesReceived}
                    </div>
                  </div>

                  {/* Arrow + rate */}
                  <div className="flex flex-col items-center justify-center px-1" style={{ minWidth: 48 }}>
                    <ArrowRight size={16} style={{ color: styles.textMuted }} />
                    <span
                      className="text-[10px] font-medium mt-0.5"
                      style={{ color: funnel.quoteToOrderRate > 0 ? styles.success : styles.textMuted }}
                    >
                      {funnel.quoteToOrderRate}%
                    </span>
                  </div>

                  {/* Orders Placed */}
                  <div className="flex-1 rounded-lg p-3" style={{ backgroundColor: styles.bgSecondary }}>
                    <div
                      className="text-[10px] uppercase tracking-wide font-medium mb-1"
                      style={{ color: styles.textMuted }}
                    >
                      Orders Placed
                    </div>
                    <div className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
                      {funnel.ordersPlaced}
                    </div>
                  </div>
                </div>

                {/* Conversion bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: styles.textMuted }}>
                      Overall Conversion
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: funnel.overallConversionRate > 0 ? styles.success : styles.textMuted }}
                    >
                      {funnel.overallConversionRate}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(funnel.overallConversionRate, 100)}%`,
                        backgroundColor: styles.success,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  {t('buyer.home.noPipeline') || 'No activity this month yet'}
                </p>
                <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                  Send RFQs or place orders to see your pipeline here
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-medium mb-4" style={{ color: styles.textPrimary }}>
              {t('buyer.home.quickActions') || 'Quick Actions'}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickActionCard
                icon={FileText}
                title={t('buyer.home.requestQuote') || 'Request Quote'}
                onClick={() => onNavigate('rfq')}
                variant="button"
              />
              <QuickActionCard
                icon={Storefront}
                title={t('buyer.home.browseCatalog') || 'Browse Catalog'}
                onClick={() => onNavigate('marketplace')}
                variant="button"
              />
              <QuickActionCard
                icon={Package}
                title={t('buyer.home.viewOrders') || 'View Orders'}
                onClick={() => onNavigate('orders')}
                variant="button"
              />
              <QuickActionCard
                icon={ClockCounterClockwise}
                title={t('buyer.home.myRfqs') || 'My RFQs'}
                onClick={() => onNavigate('my-rfqs')}
                variant="button"
              />
              <QuickActionCard
                icon={UsersThree}
                title={t('buyer.home.suppliers') || 'Suppliers'}
                onClick={() => onNavigate('suppliers')}
                variant="button"
              />
              <QuickActionCard
                icon={ChartLine}
                title={t('buyer.home.analytics') || 'Analytics'}
                onClick={() => onNavigate('analytics')}
                variant="button"
              />
              <QuickActionCard
                icon={ShoppingCart}
                title={t('buyer.home.cart') || 'Cart'}
                onClick={() => onNavigate('cart')}
                variant="button"
              />
              <QuickActionCard
                icon={ClockCounterClockwise}
                title={t('buyer.home.tracking') || 'Order Tracking'}
                onClick={() => onNavigate('tracking')}
                variant="button"
              />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default BuyerHome;
