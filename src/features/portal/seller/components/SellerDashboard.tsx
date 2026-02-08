import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { CurrencyDollar, ShoppingCart, Cube, ChatCircleDots, ArrowClockwise, Package } from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { dashboardService, DashboardSummary } from '../../services/dashboardService';
import { EmptyState, Button } from '../../components';

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
        <KPICard
          id="totalRevenue"
          label={t('seller.dashboard.totalRevenue')}
          value={loading ? '' : formatCurrency(summary?.totalRevenue ?? 0)}
          change={`${(summary?.revenueChange ?? 0) >= 0 ? '+' : ''}${summary?.revenueChange ?? 0}%`}
          trend={(summary?.revenueChange ?? 0) > 0 ? 'up' : (summary?.revenueChange ?? 0) < 0 ? 'down' : 'neutral'}
          icon={<CurrencyDollar size={18} />}
          color="emerald"
          loading={loading}
        />
        <KPICard
          id="totalOrders"
          label={t('seller.dashboard.totalOrders')}
          value={loading ? '' : formatNumber(summary?.totalOrders ?? 0)}
          change={`${(summary?.ordersChange ?? 0) >= 0 ? '+' : ''}${summary?.ordersChange ?? 0}%`}
          trend={(summary?.ordersChange ?? 0) > 0 ? 'up' : (summary?.ordersChange ?? 0) < 0 ? 'down' : 'neutral'}
          icon={<ShoppingCart size={18} />}
          color="blue"
          loading={loading}
        />
        <KPICard
          id="activeListings"
          label={t('seller.dashboard.activeListings')}
          value={loading ? '' : formatNumber(summary?.activeListings ?? 0)}
          change={`${(summary?.listingsChange ?? 0) >= 0 ? '+' : ''}${summary?.listingsChange ?? 0}%`}
          trend={(summary?.listingsChange ?? 0) > 0 ? 'up' : (summary?.listingsChange ?? 0) < 0 ? 'down' : 'neutral'}
          icon={<Cube size={18} />}
          color="violet"
          loading={loading}
        />
        <KPICard
          id="pendingRfqs"
          label={t('seller.dashboard.pendingRfqs')}
          value={loading ? '' : formatNumber(summary?.pendingRfqs ?? 0)}
          icon={<ChatCircleDots size={18} />}
          change={`${(summary?.rfqsChange ?? 0) >= 0 ? '+' : ''}${summary?.rfqsChange ?? 0}%`}
          trend={(summary?.rfqsChange ?? 0) > 0 ? 'up' : (summary?.rfqsChange ?? 0) < 0 ? 'down' : 'neutral'}
          color="amber"
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
          <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}>
            Recent Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: styles.bgSecondary }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: styles.textMuted }}>
                  Order ID
                </th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: styles.textMuted }}>
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: styles.textMuted }}>
                  Product
                </th>
                <th className="px-4 py-3 text-right font-medium" style={{ color: styles.textMuted }}>
                  Amount
                </th>
                <th className="px-4 py-3 text-center font-medium" style={{ color: styles.textMuted }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center" style={{ color: styles.textMuted }}>
                  No recent orders yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
