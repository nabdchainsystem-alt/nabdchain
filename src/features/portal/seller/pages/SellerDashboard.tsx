/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Heartbeat,
  Warning,
  TrendUp,
  TrendDown,
  Package,
  CurrencyDollar,
  ArrowClockwise,
  CaretRight,
  Lightning,
  CheckCircle,
  WarningCircle,
  Bell,
  ShoppingCart,
  FileText,
  Truck,
  Gauge,
  ChartLine,
  ArrowRight,
  ListChecks,
} from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { Skeleton } from '../../components/LoadingSkeleton';
import { MemoizedChart } from '../../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { sellerHomeSummaryService } from '../../services/sellerHomeSummaryService';
import type {
  SellerHomeSummary,
  SellerHomeKPIs,
  SellerAlert,
  SellerFocus,
  OnboardingProgress,
  BusinessPulseData,
  SystemHealth,
} from '../../services/sellerHomeSummaryService';

// =============================================================================
// Types
// =============================================================================

interface SellerDashboardProps {
  onNavigate: (page: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SellerHomeSummary | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const summary = await sellerHomeSummaryService.getSummary(7);
      setData(summary);
    } catch (err) {
      console.error('[SellerDashboard] Failed to fetch summary:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <DashboardSkeleton styles={styles} />;
  }

  if (!data) {
    return (
      <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
        <Container variant="full">
          <PageHeader
            title={t('seller.dashboard.title') || 'Dashboard'}
            subtitle={t('seller.dashboard.subtitle') || 'Your seller overview'}
          />
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <p style={{ color: styles.textMuted }}>Unable to load dashboard data. Please try again.</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: styles.bgSecondary, color: styles.textPrimary }}
            >
              Retry
            </button>
          </div>
        </Container>
      </div>
    );
  }

  const { kpis, alerts, focus, systemHealth, onboarding, pulse, lastUpdated } = data;

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('seller.dashboard.title') || 'Dashboard'}
          subtitle={t('seller.dashboard.subtitle') || 'Your seller overview'}
          actions={
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: styles.textMuted }}>
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
              <button
                onClick={fetchData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                <ArrowClockwise size={14} />
                {t('common.refresh') || 'Refresh'}
              </button>
            </div>
          }
        />

        {/* Onboarding Progress (new sellers) */}
        {onboarding && !onboarding.isComplete && (
          <OnboardingBanner onboarding={onboarding} styles={styles} onNavigate={onNavigate} isRtl={isRtl} t={t} />
        )}

        {/* KPI Cards */}
        <KPIGrid kpis={kpis} styles={styles} t={t} />

        {/* Alerts */}
        {alerts.length > 0 && <AlertsSection alerts={alerts} styles={styles} onNavigate={onNavigate} isRtl={isRtl} />}

        {/* Focus + Pulse row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Focus Card */}
          <FocusCard focus={focus} styles={styles} onNavigate={onNavigate} isRtl={isRtl} t={t} />

          {/* Business Pulse Chart */}
          <PulseChart pulse={pulse} styles={styles} t={t} />
        </div>

        {/* System Health (only show if issues) */}
        {systemHealth.status !== 'healthy' && (
          <SystemHealthBanner health={systemHealth} styles={styles} isRtl={isRtl} />
        )}

        {/* Quick Actions */}
        <div className="mt-6 mb-8">
          <h3 className="text-sm font-medium mb-3" style={{ color: styles.textPrimary }}>
            {t('seller.dashboard.quickActions') || 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('seller.nav.orders') || 'Orders', icon: Package, route: 'orders' },
              { label: t('seller.nav.rfqs') || 'RFQ Inbox', icon: FileText, route: 'rfqs' },
              { label: t('seller.nav.listings') || 'Listings', icon: ShoppingCart, route: 'listings' },
              { label: t('seller.nav.analytics') || 'Analytics', icon: ChartLine, route: 'analytics' },
            ].map((action) => (
              <button
                key={action.route}
                onClick={() => onNavigate(action.route)}
                className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:shadow-sm"
                style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <action.icon size={18} style={{ color: styles.textSecondary }} />
                </div>
                <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

// =============================================================================
// KPI Grid
// =============================================================================

const KPIGrid: React.FC<{
  kpis: SellerHomeKPIs;
  styles: any;
  t: (key: string) => string;
}> = ({ kpis, styles, t }) => {
  const formatCurrency = (amount: number, currency: string) => {
    if (amount >= 1000000) return `${currency} ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(1)}K`;
    return `${currency} ${amount.toFixed(0)}`;
  };

  const cards = [
    {
      label: t('seller.kpi.revenue') || 'Revenue (30d)',
      value: formatCurrency(kpis.revenue, kpis.currency),
      change: kpis.revenueChange,
      icon: CurrencyDollar,
      color: '#3b82f6',
    },
    {
      label: t('seller.kpi.activeOrders') || 'Active Orders',
      value: kpis.activeOrders.toString(),
      badge: kpis.ordersNeedingAction > 0 ? `${kpis.ordersNeedingAction} need action` : undefined,
      icon: Package,
      color: '#8b5cf6',
    },
    {
      label: t('seller.kpi.rfqInbox') || 'RFQ Inbox',
      value: kpis.rfqInbox.toString(),
      badge: kpis.newRfqs > 0 ? `${kpis.newRfqs} new` : undefined,
      icon: FileText,
      color: '#f59e0b',
    },
    {
      label: t('seller.kpi.pendingPayout') || 'Pending Payout',
      value: formatCurrency(kpis.pendingPayout, kpis.currency),
      icon: Truck,
      color: '#10b981',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-4 rounded-xl border transition-shadow hover:shadow-md"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium" style={{ color: styles.textMuted }}>
              {card.label}
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${card.color}15` }}
            >
              <card.icon size={18} style={{ color: card.color }} />
            </div>
          </div>
          <div
            className="text-2xl font-semibold mb-1"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            {card.value}
          </div>
          {card.change !== undefined && card.change !== 0 && (
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: card.change > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: card.change > 0 ? '#10b981' : '#ef4444',
              }}
            >
              {card.change > 0 ? <TrendUp size={10} weight="bold" /> : <TrendDown size={10} weight="bold" />}
              {card.change > 0 ? '+' : ''}
              {card.change}%
            </div>
          )}
          {card.badge && (
            <div
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1"
              style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
            >
              {card.badge}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// Alerts Section
// =============================================================================

const AlertsSection: React.FC<{
  alerts: SellerAlert[];
  styles: any;
  onNavigate: (page: string) => void;
  isRtl: boolean;
}> = ({ alerts, styles, onNavigate, isRtl }) => {
  const severityConfig = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: WarningCircle },
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: Warning },
    info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: Bell },
  };

  return (
    <div className="mt-6 space-y-3">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity];
        const Icon = config.icon;
        const message = isRtl ? alert.messageAr : alert.message;
        const cta = isRtl ? alert.ctaLabelAr : alert.ctaLabel;

        return (
          <div
            key={alert.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: config.bg, border: `1px solid ${config.color}20` }}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} weight="bold" style={{ color: config.color }} />
              <span className="text-sm" style={{ color: styles.textPrimary }}>
                {message}
              </span>
              {alert.count && alert.count > 1 && (
                <span
                  className="px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: `${config.color}20`, color: config.color }}
                >
                  {alert.count}
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate(alert.ctaRoute)}
              className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
              style={{ color: config.color }}
            >
              {cta}
              <CaretRight size={12} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// Focus Card
// =============================================================================

const FocusCard: React.FC<{
  focus: SellerFocus;
  styles: any;
  onNavigate: (page: string) => void;
  isRtl: boolean;
  t: (key: string) => string;
}> = ({ focus, styles, onNavigate, isRtl, t }) => {
  const title = isRtl ? focus.titleAr : focus.title;
  const description = isRtl ? focus.descriptionAr : focus.description;
  const hint = isRtl ? focus.hintAr : focus.hint;
  const cta = isRtl ? focus.ctaLabelAr : focus.ctaLabel;

  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#10b981',
  };

  const color = priorityColors[focus.priority] || '#3b82f6';

  return (
    <div
      className="rounded-xl p-5 lg:col-span-1"
      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightning size={18} weight="fill" style={{ color }} />
        <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
          {t('seller.dashboard.focus') || 'Your Focus'}
        </h3>
      </div>

      <div className="mb-3">
        <h4 className="text-base font-semibold mb-1" style={{ color: styles.textPrimary }}>
          {title}
        </h4>
        <p className="text-sm leading-relaxed" style={{ color: styles.textSecondary }}>
          {description}
        </p>
      </div>

      {hint && (
        <p className="text-xs mb-4" style={{ color: styles.textMuted }}>
          {hint}
        </p>
      )}

      <button
        onClick={() => onNavigate(focus.ctaRoute)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ backgroundColor: color, color: '#fff' }}
      >
        {cta}
        <ArrowRight size={14} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
      </button>
    </div>
  );
};

// =============================================================================
// Pulse Chart
// =============================================================================

const PulseChart: React.FC<{
  pulse: BusinessPulseData;
  styles: any;
  t: (key: string) => string;
}> = ({ pulse, styles, t }) => {
  const hasData = pulse.revenue.some((v) => v > 0) || pulse.orders.some((v) => v > 0);

  const chartOption = useMemo<EChartsOption>(() => {
    if (!hasData) {
      return {
        title: {
          text: t('seller.dashboard.noActivityYet') || 'No activity yet',
          subtext: t('seller.dashboard.noActivityHint') || 'Revenue and orders will appear here',
          left: 'center',
          top: 'center',
          textStyle: { color: styles.textMuted, fontSize: 14 },
          subtextStyle: { color: styles.textMuted, fontSize: 12 },
        },
      };
    }

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['Revenue', 'Orders'],
        bottom: 0,
        textStyle: { color: styles.textMuted, fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: pulse.labels,
        axisLabel: { color: styles.textMuted, fontSize: 11 },
        axisLine: { lineStyle: { color: styles.border } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Revenue',
          axisLabel: {
            color: styles.textMuted,
            fontSize: 11,
            formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()),
          },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: styles.border, type: 'dashed' } },
        },
        {
          type: 'value',
          name: 'Orders',
          axisLabel: { color: styles.textMuted, fontSize: 11 },
          axisLine: { show: false },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          data: pulse.revenue,
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: '50%',
        },
        {
          name: 'Orders',
          type: 'line',
          yAxisIndex: 1,
          data: pulse.orders,
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
        },
      ],
    };
  }, [pulse, hasData, styles, t]);

  return (
    <div
      className="rounded-xl p-5 lg:col-span-2"
      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge size={18} style={{ color: styles.textSecondary }} />
          <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            {t('seller.dashboard.businessPulse') || 'Business Pulse'}
          </h3>
        </div>
        <span className="text-xs" style={{ color: styles.textMuted }}>
          {t('seller.dashboard.last7Days') || 'Last 7 days'}
        </span>
      </div>
      <MemoizedChart option={chartOption} style={{ height: '220px', width: '100%' }} />
    </div>
  );
};

// =============================================================================
// Onboarding Banner
// =============================================================================

const OnboardingBanner: React.FC<{
  onboarding: OnboardingProgress;
  styles: any;
  onNavigate: (page: string) => void;
  isRtl: boolean;
  t: (key: string) => string;
}> = ({ onboarding, styles, onNavigate, isRtl, t }) => {
  const progress = Math.round((onboarding.completedSteps / onboarding.totalSteps) * 100);

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ListChecks size={20} weight="bold" style={{ color: '#3b82f6' }} />
        <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
          {t('seller.onboarding.title') || 'Complete Your Setup'}
        </h3>
        <span className="text-xs font-medium ml-auto" style={{ color: '#3b82f6' }}>
          {onboarding.completedSteps}/{onboarding.totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full mb-4" style={{ backgroundColor: styles.bgSecondary }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress}%`, backgroundColor: '#3b82f6' }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {onboarding.steps.map((step) => {
          const label = isRtl ? step.labelAr : step.label;
          return (
            <div key={step.id} className="flex items-center gap-2">
              {step.completed ? (
                <CheckCircle size={16} weight="fill" style={{ color: '#10b981' }} />
              ) : (
                <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: styles.border }} />
              )}
              <span
                className="text-sm"
                style={{
                  color: step.completed ? styles.textMuted : styles.textPrimary,
                  textDecoration: step.completed ? 'line-through' : 'none',
                }}
              >
                {label}
              </span>
              {!step.completed && step.ctaRoute && (
                <button
                  onClick={() => onNavigate(step.ctaRoute!)}
                  className="text-xs font-medium ml-auto"
                  style={{ color: '#3b82f6' }}
                >
                  {t('common.start') || 'Start'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// System Health Banner
// =============================================================================

const SystemHealthBanner: React.FC<{
  health: SystemHealth;
  styles: any;
  isRtl: boolean;
}> = ({ health, styles, isRtl }) => {
  const color = health.status === 'critical' ? '#ef4444' : '#f59e0b';
  const message = isRtl ? health.messageAr : health.message;

  return (
    <div
      className="mt-6 px-4 py-3 rounded-xl flex items-center gap-3"
      style={{ backgroundColor: `${color}10`, border: `1px solid ${color}30` }}
    >
      <Heartbeat size={18} weight="bold" style={{ color }} />
      <span className="text-sm font-medium" style={{ color }}>
        {message}
      </span>
      {health.issues.length > 0 && (
        <span className="text-xs ml-auto" style={{ color: styles.textMuted }}>
          {health.issues.length} issue{health.issues.length > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

// =============================================================================
// Dashboard Skeleton
// =============================================================================

const DashboardSkeleton: React.FC<{ styles: any }> = ({ styles }) => (
  <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
    <Container variant="full">
      <div className="py-6">
        <Skeleton width={200} height="1.75rem" className="mb-2" />
        <Skeleton width={350} height="0.875rem" />
      </div>

      {/* KPI Skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="flex justify-between items-start mb-3">
              <Skeleton width={80} height="0.75rem" />
              <Skeleton width={32} height={32} rounded="lg" />
            </div>
            <Skeleton width={100} height="1.75rem" className="mb-2" />
            <Skeleton width={60} height="0.75rem" />
          </div>
        ))}
      </div>

      {/* Focus + Chart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
        >
          <Skeleton width={120} height="1rem" className="mb-4" />
          <Skeleton width="100%" height="1.25rem" className="mb-2" />
          <Skeleton width="80%" height="0.875rem" className="mb-4" />
          <Skeleton width={120} height={36} rounded="lg" />
        </div>
        <div
          className="rounded-xl p-5 lg:col-span-2"
          style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
        >
          <Skeleton width={140} height="1rem" className="mb-4" />
          <Skeleton width="100%" height="220px" rounded="lg" />
        </div>
      </div>
    </Container>
  </div>
);

export default SellerDashboard;
