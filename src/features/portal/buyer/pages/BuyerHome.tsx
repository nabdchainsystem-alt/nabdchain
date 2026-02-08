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
import { useAuth } from '../../../../auth-adapter';
import { buyerAnalyticsService } from '../../services/buyerAnalyticsService';
import { BuyerAnalyticsSummary } from '../../types/analytics.types';
import { MemoizedChart } from '../../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { CallbackDataParams } from '../../../../types/echarts';

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
  const { getToken } = useAuth();
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
      const token = await getToken();
      if (!token) {
        // No token - just show empty state
        setAnalytics(emptyAnalytics);
        return;
      }
      const data = await buyerAnalyticsService.getAnalyticsSummary(token, { period: 'month' });
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      // On error, show empty state instead of error message
      setAnalytics(emptyAnalytics);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

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

  // ECharts bar chart for spend by category
  const chartOption = useMemo<EChartsOption>(() => {
    if (!analytics || analytics.spendByCategory.length === 0) {
      return {
        title: {
          text: t('buyer.home.noSpendData') || 'No spending data yet',
          subtext: t('buyer.home.noSpendDataHint') || 'Your spend breakdown will appear here',
          left: 'center',
          top: 'center',
          textStyle: { color: styles.textMuted, fontSize: 14 },
          subtextStyle: { color: styles.textMuted, fontSize: 12 },
        },
      };
    }

    const categories = analytics.spendByCategory.map((c) => c.category);
    const amounts = analytics.spendByCategory.map((c) => c.amount);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
          const data = (params as CallbackDataParams[])[0];
          return `${data.name}<br/>SAR ${(data.value as number).toLocaleString()}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          color: styles.textMuted,
          fontSize: 11,
          rotate: categories.length > 4 ? 30 : 0,
        },
        axisLine: { lineStyle: { color: styles.border } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: styles.textMuted,
          fontSize: 11,
          formatter: (value: number) => {
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value.toString();
          },
        },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: styles.border, type: 'dashed' } },
      },
      series: [
        {
          type: 'bar',
          data: amounts,
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '60%',
          emphasis: {
            itemStyle: { color: '#2563eb' },
          },
        },
      ],
    };
  }, [analytics, styles]);

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

          {/* Chart Section */}
          <div
            className="rounded-xl border p-4 mb-8"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {t('buyer.home.spendByCategory') || 'Spend by Category'}
              </h2>
              <span className="text-xs" style={{ color: styles.textMuted }}>
                {t('buyer.home.thisMonth') || 'This Month'}
              </span>
            </div>
            {loading ? (
              <div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: styles.bgSecondary }} />
            ) : (
              <MemoizedChart option={chartOption} style={{ height: '256px', width: '100%' }} />
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
