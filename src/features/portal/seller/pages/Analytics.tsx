import React, { useState } from 'react';
import { TrendUp, ShoppingCart, Users, Percent } from 'phosphor-react';
import { Container, PageHeader, StatCard } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface AnalyticsProps {
  onNavigate: (page: string) => void;
}

type TimeRange = '7d' | '30d' | '90d' | '12m';

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { styles, t } = usePortal();

  const timeRangeLabels: Record<TimeRange, string> = {
    '7d': t('seller.analytics.7days'),
    '30d': t('seller.analytics.30days'),
    '90d': t('seller.analytics.90days'),
    '12m': t('seller.analytics.12months'),
  };

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={t('seller.analytics.revenue')}
            value="$124,500"
            icon={TrendUp}
            change={{ value: `+18% ${t('seller.analytics.vsLastPeriod')}`, positive: true }}
          />
          <StatCard
            label={t('seller.analytics.orders')}
            value="156"
            icon={ShoppingCart}
            change={{ value: '+12%', positive: true }}
          />
          <StatCard
            label={t('seller.analytics.newBuyers')}
            value="34"
            icon={Users}
            change={{ value: '+8%', positive: true }}
          />
          <StatCard
            label={t('seller.analytics.winRate')}
            value="68%"
            icon={Percent}
            change={{ value: '+5%', positive: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title={t('seller.analytics.revenueTrend')}>
            <div
              className="h-64 rounded-md flex items-center justify-center"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <span className="text-sm" style={{ color: styles.textMuted }}>
                Revenue Chart
              </span>
            </div>
          </ChartCard>

          <ChartCard title={t('seller.analytics.ordersByCategory')}>
            <div
              className="h-64 rounded-md flex items-center justify-center"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <span className="text-sm" style={{ color: styles.textMuted }}>
                Category Breakdown
              </span>
            </div>
          </ChartCard>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title={t('seller.analytics.rfqConversion')}>
            <div
              className="h-48 rounded-md flex items-center justify-center"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <span className="text-sm" style={{ color: styles.textMuted }}>
                Conversion Funnel
              </span>
            </div>
          </ChartCard>

          <ChartCard title={t('seller.analytics.topProducts')}>
            <TopProductsList />
          </ChartCard>

          <ChartCard title={t('seller.analytics.geoDistribution')}>
            <div
              className="h-48 rounded-md flex items-center justify-center"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <span className="text-sm" style={{ color: styles.textMuted }}>
                Map / Regional Data
              </span>
            </div>
          </ChartCard>
        </div>
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
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
};

const TopProductsList: React.FC = () => {
  const { styles } = usePortal();

  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded"
              style={{ backgroundColor: styles.bgSecondary }}
            />
            <div>
              <div className="h-3 w-24 rounded" style={{ backgroundColor: styles.bgActive }} />
              <div className="h-2 w-16 rounded mt-1" style={{ backgroundColor: styles.bgSecondary }} />
            </div>
          </div>
          <div className="h-3 w-12 rounded" style={{ backgroundColor: styles.bgActive }} />
        </div>
      ))}
    </div>
  );
};

export default Analytics;
