/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendUp, ShoppingCart, Users, Percent, Timer, CurrencyDollar, Truck, CheckCircle } from 'phosphor-react';
import {
  Container,
  PageHeader,
  SkeletonKPICard,
  SkeletonBarChart,
  SkeletonPieChart,
  SkeletonFunnelChart,
  SkeletonListSkeleton,
} from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { usePortal } from '../../context/PortalContext';
import { sellerAnalyticsService, SellerAnalyticsSummary } from '../../services/sellerAnalyticsService';

interface AnalyticsProps {
  onNavigate: (page: string) => void;
}

type TimeRange = '7d' | '30d' | '90d' | '12m';

// Category colors for charts
const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [analytics, setAnalytics] = useState<SellerAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { styles, t } = usePortal();

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await sellerAnalyticsService.getAnalyticsSummary(timeRange);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setAnalytics(null); // Show empty state on error
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Prepare data for charts from analytics
  const revenueData =
    analytics?.revenueByCategory?.map((cat, _i) => ({
      month: cat.category.substring(0, 3),
      value: cat.amount,
    })) || [];

  const categoryData =
    analytics?.revenueByCategory?.map((cat, i) => ({
      name: cat.category,
      value: cat.percentage,
      color: categoryColors[i % categoryColors.length],
    })) || [];

  const conversionData = analytics?.conversionFunnel || [];

  const topProducts =
    analytics?.topProducts?.map((p) => ({
      name: p.name,
      sku: p.sku,
      revenue: p.revenue,
      orders: p.orders,
    })) || [];

  const regionData =
    analytics?.regionDistribution?.map((r) => ({
      region: r.region,
      value: r.percentage,
      orders: r.orders,
    })) || [];

  const timeRangeLabels: Record<TimeRange, string> = {
    '7d': t('seller.analytics.7days'),
    '30d': t('seller.analytics.30days'),
    '90d': t('seller.analytics.90days'),
    '12m': t('seller.analytics.12months'),
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('seller.analytics.title')}
          subtitle={t('seller.analytics.subtitle')}
          actions={
            <div className="flex items-center gap-1 p-1 rounded-md" style={{ backgroundColor: styles.bgSecondary }}>
              {(['7d', '30d', '90d', '12m'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: timeRange === range ? styles.bgCard : 'transparent',
                    color: timeRange === range ? styles.textPrimary : styles.textSecondary,
                    boxShadow: timeRange === range ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  {timeRangeLabels[range]}
                </button>
              ))}
            </div>
          }
        />

        {/* Loading State with Shimmer Effect */}
        {isLoading && (
          <>
            {/* KPI Skeleton Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <SkeletonKPICard key={i} />
              ))}
            </div>

            {/* Chart Skeletons Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <SkeletonBarChart title="Revenue" height="h-72" />
              <SkeletonPieChart title="Categories" />
            </div>

            {/* Bottom Section Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SkeletonFunnelChart title="Conversion" />
              <SkeletonListSkeleton title="Top Products" rows={5} />
              <SkeletonBarChart title="Geo Distribution" height="h-56" showLegend={false} />
            </div>
          </>
        )}

        {/* KPI Cards */}
        {!isLoading && analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              id="revenue"
              label={t('seller.analytics.revenue')}
              value={`${analytics.kpis.currency} ${analytics.kpis.revenue.toLocaleString()}`}
              change={`${analytics.kpis.trends.revenue >= 0 ? '+' : ''}${analytics.kpis.trends.revenue}%`}
              trend={analytics.kpis.trends.revenue > 0 ? 'up' : analytics.kpis.trends.revenue < 0 ? 'down' : 'neutral'}
              icon={<TrendUp size={18} />}
              color="emerald"
            />
            <KPICard
              id="orders"
              label={t('seller.analytics.orders')}
              value={analytics.kpis.orders.toString()}
              change={`${analytics.kpis.trends.orders >= 0 ? '+' : ''}${analytics.kpis.trends.orders}%`}
              trend={analytics.kpis.trends.orders > 0 ? 'up' : analytics.kpis.trends.orders < 0 ? 'down' : 'neutral'}
              icon={<ShoppingCart size={18} />}
              color="blue"
            />
            <KPICard
              id="newBuyers"
              label={t('seller.analytics.newBuyers')}
              value={analytics.kpis.newBuyers.toString()}
              change={`${analytics.kpis.trends.buyers >= 0 ? '+' : ''}${analytics.kpis.trends.buyers}%`}
              trend={analytics.kpis.trends.buyers > 0 ? 'up' : analytics.kpis.trends.buyers < 0 ? 'down' : 'neutral'}
              icon={<Users size={18} />}
              color="violet"
            />
            <KPICard
              id="winRate"
              label={t('seller.analytics.winRate')}
              value={`${analytics.kpis.winRate}%`}
              change={`${analytics.kpis.trends.winRate >= 0 ? '+' : ''}${analytics.kpis.trends.winRate}%`}
              trend={analytics.kpis.trends.winRate > 0 ? 'up' : analytics.kpis.trends.winRate < 0 ? 'down' : 'neutral'}
              icon={<Percent size={18} />}
              color="amber"
            />
          </div>
        )}

        {/* Lifecycle KPIs Row */}
        {!isLoading && analytics?.lifecycleMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              id="receivables"
              label="Outstanding Receivables"
              value={`${analytics.kpis.currency} ${analytics.lifecycleMetrics.outstandingReceivables.toLocaleString()}`}
              change="Delivered, unpaid"
              trend="neutral"
              icon={<CurrencyDollar size={18} />}
              color="rose"
            />
            <KPICard
              id="deliveryTime"
              label="Avg Delivery Time"
              value={`${analytics.lifecycleMetrics.avgDeliveryDays} days`}
              change="Ship to deliver"
              trend="neutral"
              icon={<Truck size={18} />}
              color="blue"
            />
            <KPICard
              id="paymentDelay"
              label="Avg Payment Delay"
              value={`${analytics.lifecycleMetrics.avgPaymentDelayDays} days`}
              change="Invoice to payment"
              trend="neutral"
              icon={<Timer size={18} />}
              color="amber"
            />
            <KPICard
              id="fulfillment"
              label="Fulfillment Rate"
              value={`${analytics.lifecycleMetrics.fulfillmentRate}%`}
              change="Delivered + closed"
              trend={
                analytics.lifecycleMetrics.fulfillmentRate >= 80
                  ? 'up'
                  : analytics.lifecycleMetrics.fulfillmentRate >= 50
                    ? 'neutral'
                    : 'down'
              }
              icon={<CheckCircle size={18} />}
              color="emerald"
            />
          </div>
        )}

        {/* Charts Row */}
        {!isLoading && analytics && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ChartCard title={t('seller.analytics.revenueTrend')}>
                <RevenueBarChart data={revenueData} />
              </ChartCard>

              <ChartCard title={t('seller.analytics.ordersByCategory')}>
                <CategoryDonutChart data={categoryData} />
              </ChartCard>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <ChartCard title={t('seller.analytics.rfqConversion')}>
                <ConversionFunnel data={conversionData} />
              </ChartCard>

              <ChartCard title={t('seller.analytics.topProducts')}>
                <TopProductsList data={topProducts} />
              </ChartCard>

              <ChartCard title={t('seller.analytics.geoDistribution')}>
                <RegionalDistribution data={regionData} />
              </ChartCard>
            </div>

            {/* Top Buyers Section */}
            {analytics.lifecycleMetrics?.topBuyers && analytics.lifecycleMetrics.topBuyers.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Top Buyers by Spend">
                  <TopBuyersList
                    data={analytics.lifecycleMetrics.topBuyers}
                    currency={analytics.kpis.currency}
                    onNavigate={onNavigate}
                  />
                </ChartCard>
                <ChartCard title="Order Status Distribution">
                  <OrderStatusChart data={analytics.lifecycleMetrics.ordersByStatus} />
                </ChartCard>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { styles } = usePortal();

  return (
    <div
      className="rounded-lg border p-5 transition-colors"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}>
        {title}
      </h3>
      {children}
    </div>
  );
};

// Revenue Bar Chart Component using ECharts
const RevenueBarChart: React.FC<{ data: { month: string; value: number }[] }> = ({ data }) => {
  const { styles } = usePortal();

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: styles.bgCard,
      borderColor: styles.border,
      textStyle: { color: styles.textPrimary, fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/>Revenue: <b>SAR ${(item.value / 1000).toFixed(1)}K</b>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.month),
      axisLine: { lineStyle: { color: styles.border } },
      axisLabel: { color: styles.textMuted, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: styles.textMuted,
        fontSize: 11,
        formatter: (v: number) => `${v / 1000}K`,
      },
      splitLine: { lineStyle: { color: styles.border, type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.value),
        barWidth: '50%',
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#2563eb',
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '260px' }} />;
};

// Category Donut Chart Component using ECharts
const CategoryDonutChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
  const { styles } = usePortal();

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: styles.bgCard,
      borderColor: styles.border,
      textStyle: { color: styles.textPrimary, fontSize: 12 },
      formatter: (params: any) => `${params.name}: <b>${params.value}%</b>`,
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: styles.textMuted, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12,
    },
    series: [
      {
        name: 'Categories',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: styles.bgCard,
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => 'Total',
          fontSize: 14,
          color: styles.textMuted,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            formatter: (params: any) => `${params.value}%`,
            color: styles.textPrimary,
          },
        },
        labelLine: { show: false },
        data: data.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '260px' }} />;
};

// Conversion Funnel Component using ECharts
const ConversionFunnel: React.FC<{ data: { stage: string; value: number; percent: number }[] }> = ({ data }) => {
  const { styles } = usePortal();

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: styles.bgCard,
      borderColor: styles.border,
      textStyle: { color: styles.textPrimary, fontSize: 12 },
      formatter: (params: any) =>
        `${params.name}<br/>Count: <b>${params.value}</b><br/>Rate: <b>${params.data.percent}%</b>`,
    },
    series: [
      {
        name: 'Funnel',
        type: 'funnel',
        left: '10%',
        top: 10,
        bottom: 10,
        width: '80%',
        min: 0,
        max: 100,
        minSize: '20%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => `${params.data.value}`,
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
        },
        labelLine: { show: false },
        itemStyle: {
          borderColor: styles.bgCard,
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
        },
        data: data.map((item, index) => ({
          value: item.percent,
          name: item.stage,
          itemStyle: {
            color: index === 0 ? '#3b82f6' : index === 1 ? '#60a5fa' : index === 2 ? '#93c5fd' : '#10b981',
          },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '200px' }} />;
};

// Top Products List Component
const TopProductsList: React.FC<{ data: { name: string; sku: string; revenue: number; orders: number }[] }> = ({
  data,
}) => {
  const { styles } = usePortal();

  return (
    <div className="space-y-3">
      {data.map((product, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: index === 0 ? '#fef3c7' : styles.bgSecondary,
                color: index === 0 ? '#d97706' : styles.textMuted,
              }}
            >
              {index + 1}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {product.name}
              </div>
              <div className="text-xs" style={{ color: styles.textMuted }}>
                {product.sku} · {product.orders} orders
              </div>
            </div>
          </div>
          <div className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            SAR {product.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

// Regional Distribution Component using ECharts
const RegionalDistribution: React.FC<{ data: { region: string; value: number; orders: number }[] }> = ({ data }) => {
  const { styles } = usePortal();

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: styles.bgCard,
      borderColor: styles.border,
      textStyle: { color: styles.textPrimary, fontSize: 12 },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        const regionItem = data.find((d) => d.region === item.name);
        return `${item.name}<br/>Share: <b>${item.value}%</b><br/>Orders: <b>${regionItem?.orders || 0}</b>`;
      },
    },
    grid: {
      left: '3%',
      right: '15%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: styles.textMuted,
        fontSize: 11,
        formatter: (v: number) => `${v}%`,
      },
      splitLine: { lineStyle: { color: styles.border, type: 'dashed' } },
      max: 50,
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.region).reverse(),
      axisLine: { show: false },
      axisLabel: { color: styles.textPrimary, fontSize: 12 },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.value).reverse(),
        barWidth: 16,
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: styles.textSecondary,
          fontSize: 11,
          formatter: (params: any) => {
            const regionItem = data.find((d) => d.region === data[data.length - 1 - params.dataIndex].region);
            return `${params.value}% (${regionItem?.orders || 0})`;
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '200px' }} />;
};

// Top Buyers List Component
const TopBuyersList: React.FC<{
  data: { buyerId: string; buyerName: string; totalSpend: number; orderCount: number }[];
  currency: string;
  onNavigate: (page: string) => void;
}> = ({ data, currency, onNavigate }) => {
  const { styles } = usePortal();

  return (
    <div className="space-y-3">
      {data.map((buyer, index) => (
        <div
          key={buyer.buyerId}
          className="flex items-center justify-between cursor-pointer rounded-lg p-2 transition-colors"
          onClick={() => onNavigate('orders')}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: index === 0 ? '#dbeafe' : styles.bgSecondary,
                color: index === 0 ? '#2563eb' : styles.textMuted,
              }}
            >
              {index + 1}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {buyer.buyerName}
              </div>
              <div className="text-xs" style={{ color: styles.textMuted }}>
                {buyer.orderCount} orders
              </div>
            </div>
          </div>
          <div className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            {currency} {buyer.totalSpend.toLocaleString()}
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: styles.textMuted }}>
          No buyer data yet
        </p>
      )}
    </div>
  );
};

// Order Status Distribution Chart
const OrderStatusChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
  const { styles } = usePortal();

  const statusLabels: Record<string, string> = {
    pending_confirmation: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    closed: 'Closed',
    cancelled: 'Cancelled',
  };

  const statusColors: Record<string, string> = {
    pending_confirmation: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#8b5cf6',
    shipped: '#06b6d4',
    delivered: '#10b981',
    closed: '#6b7280',
    cancelled: '#ef4444',
  };

  const entries = Object.entries(data)
    .filter(([, count]) => (count as number) > 0)
    .map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count as number,
      color: statusColors[status] || '#6b7280',
    }));

  if (entries.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: styles.textMuted }}>
        No order data yet
      </p>
    );
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: styles.bgCard,
      borderColor: styles.border,
      textStyle: { color: styles.textPrimary, fontSize: 12 },
      formatter: (params: any) => `${params.name}: <b>${params.value}</b> orders`,
    },
    legend: {
      orient: 'vertical' as const,
      right: '5%',
      top: 'center',
      textStyle: { color: styles.textMuted, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: styles.bgCard, borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: entries.map((e) => ({
          value: e.value,
          name: e.name,
          itemStyle: { color: e.color },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '200px' }} />;
};

export default Analytics;
