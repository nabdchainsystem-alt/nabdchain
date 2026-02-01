import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  CurrencyDollar,
  ShoppingCart,
  Cube,
  ChatCircleDots,
  TrendUp,
  TrendDown,
  ArrowClockwise,
  Package,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { dashboardService, DashboardSummary } from '../../services/dashboardService';
import { EmptyState, Button } from '../../components';

// =============================================================================
// Types
// =============================================================================

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size: number; weight?: string }>;
  change: number;
  loading?: boolean;
}

// =============================================================================
// Skeleton Component
// =============================================================================

const KpiCardSkeleton: React.FC = () => {
  const { styles } = usePortal();

  return (
    <div
      className="p-5 rounded-lg border transition-colors animate-pulse"
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgCard,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div
            className="h-3 w-24 rounded mb-3"
            style={{ backgroundColor: styles.bgSecondary }}
          />
          <div
            className="h-8 w-32 rounded mb-2"
            style={{ backgroundColor: styles.bgSecondary }}
          />
          <div
            className="h-4 w-28 rounded"
            style={{ backgroundColor: styles.bgSecondary }}
          />
        </div>
        <div
          className="w-10 h-10 rounded-md"
          style={{ backgroundColor: styles.bgSecondary }}
        />
      </div>
    </div>
  );
};

// =============================================================================
// KPI Card Component
// =============================================================================

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon: Icon,
  change,
  loading = false,
}) => {
  const { styles, t } = usePortal();

  if (loading) {
    return <KpiCardSkeleton />;
  }

  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendUp : TrendDown;
  const changeColor = isPositive ? styles.success : '#ef4444';

  return (
    <div
      className="p-5 rounded-lg border transition-all hover:shadow-sm"
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgCard,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: styles.textMuted }}
          >
            {label}
          </p>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{
              color: styles.textPrimary,
              fontFamily: styles.fontHeading,
            }}
          >
            {value}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <TrendIcon size={14} weight="bold" style={{ color: changeColor }} />
            <span
              className="text-xs font-medium"
              style={{ color: changeColor }}
            >
              {isPositive ? '+' : ''}{change}%
            </span>
            <span
              className="text-xs"
              style={{ color: styles.textMuted }}
            >
              {t('seller.dashboard.fromLastMonth')}
            </span>
          </div>
        </div>
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Icon size={20} weight="light" style={{ color: styles.textMuted }} />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Dashboard Component
// =============================================================================

export const SellerDashboard: React.FC = () => {
  const { styles, t } = usePortal();
  const { getToken } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const data = await dashboardService.getSellerSummary(token);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `SAR ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `SAR ${(amount / 1000).toFixed(1)}K`;
    }
    return `SAR ${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Package}
          title={t('seller.dashboard.error')}
          description={t('seller.dashboard.errorDesc')}
          action={
            <Button onClick={fetchDashboard} variant="secondary">
              <ArrowClockwise size={16} className="mr-2" />
              {t('seller.dashboard.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label={t('seller.dashboard.totalRevenue')}
          value={loading ? '' : formatCurrency(summary?.totalRevenue ?? 0)}
          icon={CurrencyDollar}
          change={summary?.revenueChange ?? 0}
          loading={loading}
        />
        <KpiCard
          label={t('seller.dashboard.totalOrders')}
          value={loading ? '' : formatNumber(summary?.totalOrders ?? 0)}
          icon={ShoppingCart}
          change={summary?.ordersChange ?? 0}
          loading={loading}
        />
        <KpiCard
          label={t('seller.dashboard.activeListings')}
          value={loading ? '' : formatNumber(summary?.activeListings ?? 0)}
          icon={Cube}
          change={summary?.listingsChange ?? 0}
          loading={loading}
        />
        <KpiCard
          label={t('seller.dashboard.pendingRfqs')}
          value={loading ? '' : formatNumber(summary?.pendingRfqs ?? 0)}
          icon={ChatCircleDots}
          change={summary?.rfqsChange ?? 0}
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div
          className="rounded-lg border p-6 transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <h3
            className="text-sm font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            {t('seller.workspace.salesOverview')}
          </h3>
          <ReactECharts
            option={{
              tooltip: {
                trigger: 'axis',
                backgroundColor: styles.bgCard,
                borderColor: styles.border,
                textStyle: { color: styles.textPrimary, fontSize: 12 },
              },
              grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
              xAxis: {
                type: 'category',
                data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                axisLine: { lineStyle: { color: styles.border } },
                axisLabel: { color: styles.textMuted, fontSize: 11 },
              },
              yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: styles.textMuted, fontSize: 11, formatter: (v: number) => `${v / 1000}K` },
                splitLine: { lineStyle: { color: styles.border, type: 'dashed' } },
              },
              series: [
                {
                  name: 'Revenue',
                  type: 'line',
                  smooth: true,
                  data: [15200, 18400, 22100, 19800, 24500, 25750],
                  areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
                  lineStyle: { color: '#3b82f6', width: 2 },
                  itemStyle: { color: '#3b82f6' },
                },
              ],
            }}
            style={{ height: '240px' }}
          />
        </div>

        {/* Category Breakdown Chart */}
        <div
          className="rounded-lg border p-6 transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <h3
            className="text-sm font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            {t('seller.workspace.expenseBreakdown')}
          </h3>
          <ReactECharts
            option={{
              tooltip: {
                trigger: 'item',
                backgroundColor: styles.bgCard,
                borderColor: styles.border,
                textStyle: { color: styles.textPrimary, fontSize: 12 },
              },
              legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: { color: styles.textMuted, fontSize: 11 },
              },
              series: [
                {
                  name: 'Sales by Category',
                  type: 'pie',
                  radius: ['40%', '70%'],
                  center: ['35%', '50%'],
                  avoidLabelOverlap: false,
                  itemStyle: { borderRadius: 6, borderColor: styles.bgCard, borderWidth: 2 },
                  label: { show: false },
                  emphasis: { label: { show: false } },
                  data: [
                    { value: 45200, name: 'Electronics', itemStyle: { color: '#3b82f6' } },
                    { value: 32100, name: 'Parts', itemStyle: { color: '#10b981' } },
                    { value: 28450, name: 'Equipment', itemStyle: { color: '#f59e0b' } },
                    { value: 20000, name: 'Services', itemStyle: { color: '#8b5cf6' } },
                  ],
                },
              ],
            }}
            style={{ height: '240px' }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div
        className="mt-6 rounded-lg border transition-colors"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <div className="p-4 border-b" style={{ borderColor: styles.border }}>
          <h3
            className="text-sm font-semibold"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Recent Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: styles.bgSecondary }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: styles.textMuted }}>Order ID</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: styles.textMuted }}>Customer</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: styles.textMuted }}>Product</th>
                <th className="px-4 py-3 text-right font-medium" style={{ color: styles.textMuted }}>Amount</th>
                <th className="px-4 py-3 text-center font-medium" style={{ color: styles.textMuted }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'ORD-2024-0048', customer: 'Al-Faisal Trading', product: 'Industrial Pump', amount: 4500, status: 'Delivered' },
                { id: 'ORD-2024-0047', customer: 'Gulf Equipment Co.', product: 'Valve Assembly', amount: 2800, status: 'Shipped' },
                { id: 'ORD-2024-0046', customer: 'Saudi Parts Ltd.', product: 'Motor Controller', amount: 6200, status: 'Processing' },
                { id: 'ORD-2024-0045', customer: 'Eastern Supply', product: 'Bearing Set', amount: 1350, status: 'Pending' },
              ].map((order) => (
                <tr key={order.id} className="border-t" style={{ borderColor: styles.border }}>
                  <td className="px-4 py-3 font-medium" style={{ color: styles.textPrimary }}>{order.id}</td>
                  <td className="px-4 py-3" style={{ color: styles.textSecondary }}>{order.customer}</td>
                  <td className="px-4 py-3" style={{ color: styles.textSecondary }}>{order.product}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: styles.textPrimary }}>SAR {order.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Shipped' ? '#dbeafe' : order.status === 'Processing' ? '#fef3c7' : '#f3f4f6',
                        color: order.status === 'Delivered' ? '#166534' : order.status === 'Shipped' ? '#1e40af' : order.status === 'Processing' ? '#92400e' : '#374151',
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
