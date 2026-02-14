import React, { useState, useEffect, useCallback } from 'react';
import { useDropdownClose } from '../../hooks';
import {
  CurrencyCircleDollar,
  FileText,
  Clock,
  ChartBar,
  Funnel,
  Star,
  MapPin,
  CaretDown,
  Trophy,
  Timer,
  Percent,
  ArrowRight,
} from 'phosphor-react';
import {
  Container,
  PageHeader,
  SkeletonKPICard,
  SkeletonBarChart,
  SkeletonListSkeleton,
  SkeletonFunnelChart,
} from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { usePortal } from '../../context/PortalContext';
import { buyerAnalyticsService } from '../../services/buyerAnalyticsService';
import { BuyerAnalyticsSummary, SpendByCategory, SupplierPerformance, RFQFunnel } from '../../types/analytics.types';

interface BuyerAnalyticsProps {
  onNavigate: (page: string) => void;
}

type Period = 'week' | 'month' | 'quarter' | 'year';

const PERIOD_OPTIONS: { value: Period; label: string; labelAr: string }[] = [
  { value: 'week', label: '7 Days', labelAr: '7 أيام' },
  { value: 'month', label: '30 Days', labelAr: '30 يوم' },
  { value: 'quarter', label: '90 Days', labelAr: '90 يوم' },
  { value: 'year', label: '12 Months', labelAr: '12 شهر' },
];

export const BuyerAnalytics: React.FC<BuyerAnalyticsProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [analytics, setAnalytics] = useState<BuyerAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const { styles, t, direction, language } = usePortal();
  const isRTL = direction === 'rtl';

  // Close dropdown on click outside or escape key
  const periodDropdownRef = useDropdownClose<HTMLDivElement>(() => setShowPeriodDropdown(false), showPeriodDropdown);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await buyerAnalyticsService.getAnalyticsSummary({ period });
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const selectedPeriod = PERIOD_OPTIONS.find((p) => p.value === period);

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        {/* Header with Period Selector */}
        <div className={`flex items-start justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <PageHeader title={t('buyer.analytics.title')} subtitle={t('buyer.analytics.subtitle')} />

          {/* Period Selector */}
          <div className="relative" ref={periodDropdownRef}>
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{
                borderColor: styles.border,
                backgroundColor: styles.bgCard,
                color: styles.textPrimary,
              }}
            >
              <span className="text-sm font-medium">
                {language === 'ar' ? selectedPeriod?.labelAr : selectedPeriod?.label}
              </span>
              <CaretDown size={14} style={{ color: styles.textMuted }} />
            </button>

            {showPeriodDropdown && (
              <div
                className={`absolute top-full mt-1 w-32 rounded-lg border shadow-lg z-10 py-1 ${isRTL ? 'left-0' : 'right-0'}`}
                style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setPeriod(option.value);
                      setShowPeriodDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-sm transition-colors"
                    style={{
                      color: period === option.value ? styles.info : styles.textPrimary,
                      backgroundColor: period === option.value ? styles.bgHover : 'transparent',
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    {language === 'ar' ? option.labelAr : option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading State with Shimmer Effect */}
        {isLoading && (
          <>
            {/* KPI Skeleton Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <SkeletonKPICard key={i} />
              ))}
            </div>

            {/* Charts Row Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SkeletonBarChart title="Spend by Category" height="h-72" showLegend={false} />
              <SkeletonListSkeleton title="Supplier Performance" rows={5} />
            </div>

            {/* RFQ Funnel Skeleton */}
            <SkeletonFunnelChart title="RFQ Funnel" height="h-64" />
          </>
        )}

        {/* Analytics Content */}
        {!isLoading && analytics && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" dir={direction}>
              <KPICard
                id="totalSpend"
                label={t('buyer.analytics.totalSpend')}
                value={`${analytics.kpis.currency} ${analytics.kpis.totalSpend.toLocaleString()}`}
                change={
                  analytics.kpis.trends.spend !== 0
                    ? `${analytics.kpis.trends.spend >= 0 ? '+' : ''}${analytics.kpis.trends.spend}%`
                    : ''
                }
                trend={analytics.kpis.trends.spend > 0 ? 'up' : analytics.kpis.trends.spend < 0 ? 'down' : 'neutral'}
                icon={<CurrencyCircleDollar size={18} />}
                color="blue"
              />
              <KPICard
                id="rfqsSent"
                label={t('buyer.analytics.rfqsSent')}
                value={analytics.kpis.rfqsSent.toString()}
                change={
                  analytics.kpis.trends.rfqs !== 0
                    ? `${analytics.kpis.trends.rfqs >= 0 ? '+' : ''}${analytics.kpis.trends.rfqs}%`
                    : ''
                }
                trend={analytics.kpis.trends.rfqs > 0 ? 'up' : analytics.kpis.trends.rfqs < 0 ? 'down' : 'neutral'}
                icon={<FileText size={18} />}
                color="violet"
              />
              <KPICard
                id="avgResponseTime"
                label={t('buyer.analytics.avgResponseTime')}
                value={`${analytics.kpis.avgResponseTime}h`}
                change={
                  analytics.kpis.trends.responseTime !== 0
                    ? `${analytics.kpis.trends.responseTime >= 0 ? '+' : ''}${analytics.kpis.trends.responseTime}%`
                    : ''
                }
                trend={
                  analytics.kpis.trends.responseTime < 0
                    ? 'up'
                    : analytics.kpis.trends.responseTime > 0
                      ? 'down'
                      : 'neutral'
                }
                icon={<Clock size={18} />}
                color="amber"
              />
              <KPICard
                id="savingsVsMarket"
                label={t('buyer.analytics.savingsVsMarket')}
                value={`${analytics.kpis.savingsVsMarket}%`}
                change={
                  analytics.kpis.trends.savings !== 0
                    ? `${analytics.kpis.trends.savings >= 0 ? '+' : ''}${analytics.kpis.trends.savings}%`
                    : ''
                }
                trend={
                  analytics.kpis.trends.savings > 0 ? 'up' : analytics.kpis.trends.savings < 0 ? 'down' : 'neutral'
                }
                icon={<Percent size={18} />}
                color="emerald"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Spend by Category */}
              <SpendByCategoryChart data={analytics.spendByCategory} currency={analytics.kpis.currency} />

              {/* Supplier Performance */}
              <SupplierPerformanceTable suppliers={analytics.topSuppliers} onViewAll={() => onNavigate('workspace')} />
            </div>

            {/* RFQ Funnel */}
            <RFQFunnelChart funnel={analytics.rfqFunnel} />
          </>
        )}
      </Container>
    </div>
  );
};

// =============================================================================
// Spend by Category Chart
// =============================================================================

interface SpendByCategoryChartProps {
  data: SpendByCategory[];
  currency: string;
}

const SpendByCategoryChart: React.FC<SpendByCategoryChartProps> = ({ data, currency }) => {
  const { styles, t, direction } = usePortal();
  const isRTL = direction === 'rtl';

  // Color palette for categories
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
  const maxAmount = Math.max(...data.map((d) => d.amount));

  return (
    <div className="p-6 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
      <div className={`flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <ChartBar size={20} weight="duotone" style={{ color: styles.info }} />
        <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}>
          {t('buyer.analytics.spendByCategory')}
        </h3>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.category} dir={direction}>
            <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {item.category}
              </span>
              <span className="text-sm" style={{ color: styles.textSecondary }}>
                {currency} {item.amount.toLocaleString()} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.amount / maxAmount) * 100}%`,
                  backgroundColor: colors[index % colors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Supplier Performance Table
// =============================================================================

interface SupplierPerformanceTableProps {
  suppliers: SupplierPerformance[];
  onViewAll: () => void;
}

const SupplierPerformanceTable: React.FC<SupplierPerformanceTableProps> = ({ suppliers, onViewAll }) => {
  const { styles, t, direction } = usePortal();
  const isRTL = direction === 'rtl';

  return (
    <div className="p-6 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Trophy size={20} weight="duotone" style={{ color: '#f59e0b' }} />
          <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}>
            {t('buyer.analytics.supplierPerformance')}
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: styles.info }}
        >
          {t('common.viewAll')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderColor: styles.border }}>
              <th
                className="pb-3 text-xs font-medium"
                style={{ color: styles.textMuted, textAlign: isRTL ? 'right' : 'left' }}
              >
                {t('buyer.analytics.supplier')}
              </th>
              <th className="pb-3 text-xs font-medium text-center" style={{ color: styles.textMuted }}>
                {t('buyer.analytics.onTime')}
              </th>
              <th className="pb-3 text-xs font-medium text-center" style={{ color: styles.textMuted }}>
                {t('buyer.analytics.quality')}
              </th>
              <th className="pb-3 text-xs font-medium text-center" style={{ color: styles.textMuted }}>
                {t('buyer.analytics.response')}
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.slice(0, 5).map((supplier, index) => (
              <tr key={supplier.supplierId} className="border-t" style={{ borderColor: styles.border }}>
                <td className="py-3">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: index < 3 ? '#f59e0b15' : styles.bgSecondary,
                        color: index < 3 ? '#f59e0b' : styles.textMuted,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                        {supplier.supplierName}
                      </p>
                      {supplier.country && (
                        <p
                          className={`text-xs flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
                          style={{ color: styles.textMuted }}
                        >
                          <MapPin size={10} />
                          {supplier.country}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        supplier.onTimeDeliveryRate >= 95
                          ? styles.success
                          : supplier.onTimeDeliveryRate >= 85
                            ? '#f59e0b'
                            : styles.error,
                    }}
                  >
                    {supplier.onTimeDeliveryRate}%
                  </span>
                </td>
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={12} weight="fill" style={{ color: '#f59e0b' }} />
                    <span className="text-sm" style={{ color: styles.textPrimary }}>
                      {supplier.qualityScore.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <span
                    className="text-sm flex items-center justify-center gap-1"
                    style={{ color: styles.textSecondary }}
                  >
                    <Timer size={12} />
                    {supplier.responseTime}h
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =============================================================================
// RFQ Funnel Chart
// =============================================================================

interface RFQFunnelChartProps {
  funnel: RFQFunnel;
}

const RFQFunnelChart: React.FC<RFQFunnelChartProps> = ({ funnel }) => {
  const { styles, t, direction } = usePortal();
  const isRTL = direction === 'rtl';

  const stages = [
    {
      label: t('buyer.analytics.rfqsSent'),
      value: funnel.rfqsSent,
      color: '#3b82f6',
      width: 100,
    },
    {
      label: t('buyer.analytics.quotesReceived'),
      value: funnel.quotesReceived,
      rate: funnel.rfqToQuoteRate,
      color: '#8b5cf6',
      width: 75,
    },
    {
      label: t('buyer.analytics.ordersPlaced'),
      value: funnel.ordersPlaced,
      rate: funnel.quoteToOrderRate,
      color: '#10b981',
      width: 50,
    },
  ];

  return (
    <div className="p-6 rounded-lg border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
      <div className={`flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Funnel size={20} weight="duotone" style={{ color: '#8b5cf6' }} />
        <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}>
          {t('buyer.analytics.rfqFunnel')}
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
        >
          {funnel.overallConversionRate.toFixed(1)}% {t('buyer.analytics.conversion')}
        </span>
      </div>

      {/* Funnel Visualization */}
      <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {stages.map((stage, index) => (
          <React.Fragment key={stage.label}>
            {/* Stage Box */}
            <div className="flex-1">
              <div
                className="relative rounded-lg p-4 transition-all mx-auto"
                style={{
                  backgroundColor: `${stage.color}15`,
                  borderLeft: `4px solid ${stage.color}`,
                  maxWidth: `${stage.width}%`,
                }}
              >
                <p
                  className="text-2xl font-bold text-center"
                  style={{ color: stage.color, fontFamily: styles.fontHeading }}
                >
                  {stage.value}
                </p>
                <p className="text-xs text-center mt-1" style={{ color: styles.textSecondary }}>
                  {stage.label}
                </p>
              </div>
              {stage.rate !== undefined && (
                <p className="text-xs text-center mt-2" style={{ color: styles.textMuted }}>
                  {stage.rate.toFixed(1)}% {t('buyer.analytics.conversionRate')}
                </p>
              )}
            </div>

            {/* Arrow between stages */}
            {index < stages.length - 1 && (
              <div className="flex-shrink-0">
                <ArrowRight
                  size={24}
                  weight="bold"
                  style={{
                    color: styles.textMuted,
                    transform: isRTL ? 'rotate(180deg)' : 'none',
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Conversion Summary */}
      <div
        className={`mt-6 pt-4 border-t grid grid-cols-3 gap-4 ${isRTL ? 'direction-rtl' : ''}`}
        style={{ borderColor: styles.border }}
      >
        <div className="text-center">
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {t('buyer.analytics.rfqToQuote')}
          </p>
          <p className="text-lg font-semibold" style={{ color: '#8b5cf6' }}>
            {funnel.rfqToQuoteRate.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {t('buyer.analytics.quoteToOrder')}
          </p>
          <p className="text-lg font-semibold" style={{ color: '#10b981' }}>
            {funnel.quoteToOrderRate.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {t('buyer.analytics.overallConversion')}
          </p>
          <p className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            {funnel.overallConversionRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerAnalytics;
