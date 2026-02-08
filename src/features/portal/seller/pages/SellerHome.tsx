import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  FileText,
  Package,
  ArrowRight,
  ArrowClockwise,
  Storefront,
  CheckCircle,
  Wallet,
  ChartLineUp,
} from 'phosphor-react';
import { SkeletonStatCard, SkeletonBarChart, Skeleton, QuickActionCard } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import {
  sellerHomeSummaryService,
  SellerHomeSummary,
  SellerFocus,
  OnboardingProgress,
} from '../../services/sellerHomeSummaryService';

// Lazy load the chart component for performance
const BusinessPulseChart = lazy(() => import('./components/BusinessPulseChart'));

interface SellerHomeProps {
  onNavigate: (page: string, filter?: string) => void;
}

type LoadingState = 'loading' | 'success' | 'error' | 'empty';

// =============================================================================
// Main Component
// =============================================================================

export const SellerHome: React.FC<SellerHomeProps> = ({ onNavigate }) => {
  const { styles, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  const [summary, setSummary] = useState<SellerHomeSummary | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [pulseDays, setPulseDays] = useState<7 | 30>(7);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    setLoadingState('loading');
    try {
      const token = await getToken();
      if (!token) {
        setLoadingState('error');
        return;
      }

      const data = await sellerHomeSummaryService.getSummary(token, pulseDays);
      setSummary(data);
      setLoadingState(data.sellerStatus === 'new' ? 'empty' : 'success');
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setLoadingState('error');
      setSummary(null);
    }
  }, [getToken, pulseDays]);

  const fetchPulse = useCallback(async () => {
    if (!summary) return;
    try {
      const token = await getToken();
      if (!token) return;
      const pulse = await sellerHomeSummaryService.getPulse(token, pulseDays);
      setSummary((prev) => (prev ? { ...prev, pulse } : prev));
    } catch {
      // Keep existing pulse data
    }
  }, [getToken, pulseDays, summary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (summary) fetchPulse();
  }, [pulseDays]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isRtl ? 'صباح الخير' : 'Good morning';
    if (hour < 17) return isRtl ? 'مساء الخير' : 'Good afternoon';
    return isRtl ? 'مساء الخير' : 'Good evening';
  }, [isRtl]);

  // Simple subtitle
  const subtitle = useMemo(() => {
    if (!summary) return '';
    if (summary.sellerStatus === 'new') {
      return isRtl ? 'مرحباً بك! لنبدأ ببناء متجرك' : "Welcome! Let's get your store set up";
    }
    return isRtl ? 'إليك ملخص أعمالك' : "Here's your business at a glance";
  }, [summary, isRtl]);

  const handleNavigate = useCallback(
    (route: string, filter?: string) => {
      onNavigate(route, filter);
    },
    [onNavigate],
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: styles.bgPrimary }}>
      {/* Centered Container */}
      <div className="w-full max-w-[1120px] mx-auto px-6 lg:px-8">
        {/* Greeting Header */}
        <header className={`pt-8 pb-4 ${isRtl ? 'text-right' : ''}`}>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: styles.textPrimary }}>
            {greeting}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: styles.textMuted }}>
              {subtitle}
            </p>
          )}
        </header>

        {/* Loading State */}
        {loadingState === 'loading' && <LoadingSkeleton styles={styles} />}

        {/* Error State */}
        {loadingState === 'error' && <ErrorState styles={styles} isRtl={isRtl} onRetry={fetchSummary} />}

        {/* Empty State - New Seller */}
        {loadingState === 'empty' && summary && (
          <NewSellerState
            styles={styles}
            isRtl={isRtl}
            onNavigate={handleNavigate}
            focus={summary.focus}
            onboarding={summary.onboarding}
          />
        )}

        {/* Success State - Calm Dashboard */}
        {loadingState === 'success' && summary && (
          <div className="space-y-8 pb-12">
            {/* Quick Tools - Soft Buttons */}
            <QuickToolsSection kpis={summary.kpis} styles={styles} isRtl={isRtl} onNavigate={handleNavigate} />

            {/* KPI Cards - Polished */}
            <KPISection kpis={summary.kpis} styles={styles} isRtl={isRtl} />

            {/* Business Pulse Chart */}
            <section>
              <div className={`flex items-center justify-between mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  {isRtl ? 'نبض الأعمال' : 'Business Pulse'}
                </h2>
                <TimeRangeToggle value={pulseDays} onChange={setPulseDays} styles={styles} isRtl={isRtl} />
              </div>
              <Suspense fallback={<ChartSkeleton styles={styles} />}>
                <BusinessPulseChart
                  data={summary.pulse}
                  emptyMessage={
                    isRtl ? 'نشاطك سيظهر هنا عند بدء الطلبات' : 'Your activity will appear here once orders start'
                  }
                />
              </Suspense>
            </section>

            {/* Quick Actions - Minimal */}
            <QuickActionsSection styles={styles} isRtl={isRtl} onNavigate={handleNavigate} />
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Quick Tools Section - Soft Ghost Buttons
// =============================================================================

const QuickToolsSection: React.FC<{
  kpis: SellerHomeSummary['kpis'];
  styles: Record<string, string>;
  isRtl: boolean;
  onNavigate: (route: string, filter?: string) => void;
}> = ({ kpis, styles, isRtl, onNavigate }) => {
  const tools = [
    {
      id: 'rfqs',
      label: isRtl ? 'طلبات الأسعار' : 'RFQs',
      badge: kpis.newRfqs > 0 ? kpis.newRfqs : null,
      route: 'rfqs',
      filter: kpis.newRfqs > 0 ? 'unread' : undefined,
      icon: FileText,
    },
    {
      id: 'orders',
      label: isRtl ? 'الطلبات' : 'Orders',
      badge: kpis.ordersNeedingAction > 0 ? kpis.ordersNeedingAction : null,
      route: 'orders',
      filter: kpis.ordersNeedingAction > 0 ? 'at_risk' : undefined,
      icon: Package,
    },
    {
      id: 'payouts',
      label: isRtl ? 'المدفوعات' : 'Payouts',
      badge: null,
      route: 'payouts',
      icon: Wallet,
    },
    {
      id: 'listings',
      label: isRtl ? 'المنتجات' : 'Listings',
      badge: null,
      route: 'listings',
      icon: Storefront,
    },
  ];

  return (
    <section>
      <h2
        className={`text-xs font-medium uppercase tracking-wider mb-3 ${isRtl ? 'text-right' : ''}`}
        style={{ color: styles.textMuted }}
      >
        {isRtl ? 'أدوات سريعة' : 'Quick tools'}
      </h2>
      <div className={`flex flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onNavigate(tool.route, tool.filter)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
            style={{
              color: styles.textSecondary,
              backgroundColor: 'transparent',
              border: `1px solid ${styles.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.bgSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <tool.icon size={14} weight="regular" />
            <span>{tool.label}</span>
            {tool.badge && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textPrimary }}
              >
                {tool.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};

// =============================================================================
// Time Range Toggle - Minimal
// =============================================================================

const TimeRangeToggle: React.FC<{
  value: 7 | 30;
  onChange: (value: 7 | 30) => void;
  styles: Record<string, string>;
  isRtl: boolean;
}> = ({ value, onChange, styles, isRtl }) => (
  <div className={`flex gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
    {[7, 30].map((days) => (
      <button
        key={days}
        onClick={() => onChange(days as 7 | 30)}
        className="px-2 py-0.5 text-xs rounded transition-colors"
        style={{
          color: value === days ? styles.textPrimary : styles.textMuted,
          backgroundColor: value === days ? styles.bgSecondary : 'transparent',
        }}
      >
        {days === 7 ? (isRtl ? '7 أيام' : '7d') : isRtl ? '30 يوم' : '30d'}
      </button>
    ))}
  </div>
);

// =============================================================================
// KPI Section - Polished & Calm
// =============================================================================

const KPISection: React.FC<{
  kpis: SellerHomeSummary['kpis'];
  styles: Record<string, string>;
  isRtl: boolean;
}> = React.memo(({ kpis, styles, isRtl }) => (
  <section>
    <h2
      className={`text-xs font-medium uppercase tracking-wider mb-3 ${isRtl ? 'text-right' : ''}`}
      style={{ color: styles.textMuted }}
    >
      {isRtl ? 'نظرة عامة' : 'Overview'}
    </h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        id="revenue"
        label={isRtl ? 'الإيرادات' : 'Revenue'}
        value={kpis.revenue > 0 ? `${kpis.currency} ${kpis.revenue.toLocaleString()}` : '--'}
        change={kpis.revenueChange !== 0 ? `${kpis.revenueChange >= 0 ? '+' : ''}${kpis.revenueChange}%` : ''}
        trend={kpis.revenueChange > 0 ? 'up' : kpis.revenueChange < 0 ? 'down' : 'neutral'}
        icon={<Wallet size={18} />}
        color="emerald"
      />
      <KPICard
        id="activeOrders"
        label={isRtl ? 'الطلبات النشطة' : 'Active Orders'}
        value={kpis.activeOrders.toString()}
        subtitle={
          kpis.ordersNeedingAction > 0
            ? `${kpis.ordersNeedingAction} ${isRtl ? 'بحاجة اهتمام' : 'need action'}`
            : undefined
        }
        change=""
        trend="neutral"
        icon={<Package size={18} />}
        color="blue"
      />
      <KPICard
        id="rfqInbox"
        label={isRtl ? 'صندوق الطلبات' : 'RFQ Inbox'}
        value={kpis.rfqInbox.toString()}
        subtitle={kpis.newRfqs > 0 ? `${kpis.newRfqs} ${isRtl ? 'جديد' : 'new'}` : undefined}
        change=""
        trend="neutral"
        icon={<FileText size={18} />}
        color="violet"
      />
      <KPICard
        id="pendingPayout"
        label={isRtl ? 'أرباح معلقة' : 'Pending Payout'}
        value={kpis.pendingPayout > 0 ? `${kpis.currency} ${kpis.pendingPayout.toLocaleString()}` : '--'}
        change=""
        trend="neutral"
        icon={<Wallet size={18} />}
        color="amber"
      />
    </div>
  </section>
));

KPISection.displayName = 'KPISection';

// =============================================================================
// Quick Actions Section - Smaller & Calmer
// =============================================================================

const QuickActionsSection: React.FC<{
  styles: Record<string, string>;
  isRtl: boolean;
  onNavigate: (route: string) => void;
}> = React.memo(({ styles, isRtl, onNavigate }) => {
  const actions = [
    { id: 'rfqs', label: isRtl ? 'صندوق الطلبات' : 'RFQ Inbox', route: 'rfqs', icon: FileText },
    { id: 'orders', label: isRtl ? 'الطلبات' : 'Orders', route: 'orders', icon: Package },
    { id: 'listings', label: isRtl ? 'المنتجات' : 'Listings', route: 'listings', icon: Storefront },
    { id: 'analytics', label: isRtl ? 'التحليلات' : 'Analytics', route: 'analytics', icon: ChartLineUp },
  ];

  return (
    <section>
      <h2
        className={`text-xs font-medium uppercase tracking-wider mb-3 ${isRtl ? 'text-right' : ''}`}
        style={{ color: styles.textMuted }}
      >
        {isRtl ? 'إجراءات سريعة' : 'Quick actions'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {actions.map((action) => (
          <QuickActionCard
            key={action.id}
            icon={action.icon}
            title={action.label}
            onClick={() => onNavigate(action.route)}
            variant="compact"
          />
        ))}
      </div>
    </section>
  );
});

QuickActionsSection.displayName = 'QuickActionsSection';

// =============================================================================
// Loading Skeleton - Uses centralized components
// =============================================================================

const LoadingSkeleton: React.FC<{ styles: Record<string, string> }> = () => (
  <div className="space-y-8 pb-12">
    {/* Quick tools skeleton */}
    <div className="flex gap-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} width={96} height={32} rounded="lg" />
      ))}
    </div>
    {/* KPI skeletons - using centralized SkeletonStatCard */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
    {/* Chart skeleton - using centralized SkeletonBarChart */}
    <SkeletonBarChart />
  </div>
);

// =============================================================================
// Chart Skeleton - Uses centralized component
// =============================================================================

const ChartSkeleton: React.FC<{ styles: Record<string, string> }> = () => <SkeletonBarChart />;

// =============================================================================
// Error State
// =============================================================================

const ErrorState: React.FC<{
  styles: Record<string, string>;
  isRtl: boolean;
  onRetry: () => void;
}> = ({ styles, isRtl, onRetry }) => (
  <div className="py-20 text-center">
    <p className="text-sm mb-4" style={{ color: styles.textMuted }}>
      {isRtl ? 'تعذر تحميل البيانات' : 'Unable to load data'}
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
      style={{
        backgroundColor: 'transparent',
        border: `1px solid ${styles.border}`,
        color: styles.textSecondary,
      }}
    >
      <ArrowClockwise size={14} />
      {isRtl ? 'إعادة المحاولة' : 'Try again'}
    </button>
  </div>
);

// =============================================================================
// New Seller State
// =============================================================================

const NewSellerState: React.FC<{
  styles: Record<string, string>;
  isRtl: boolean;
  onNavigate: (page: string) => void;
  focus: SellerFocus;
  onboarding: OnboardingProgress | null;
}> = ({ styles, isRtl, onNavigate, focus, onboarding }) => (
  <div className="py-16">
    <div className={`max-w-md mx-auto text-center ${isRtl ? 'text-right' : ''}`}>
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: styles.bgSecondary }}
      >
        <Storefront size={28} weight="duotone" style={{ color: styles.textMuted }} />
      </div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: styles.textPrimary }}>
        {isRtl ? 'مرحباً بك في متجرك' : 'Welcome to your store'}
      </h2>
      <p className="text-sm mb-6" style={{ color: styles.textMuted }}>
        {isRtl ? focus.descriptionAr : focus.description}
      </p>
      <button
        onClick={() => onNavigate(focus.ctaRoute)}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
        style={{
          backgroundColor: styles.textPrimary,
          color: styles.bgPrimary,
        }}
      >
        {isRtl ? focus.ctaLabelAr : focus.ctaLabel}
        <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
      </button>

      {/* Onboarding steps */}
      {onboarding && (
        <div className="mt-10 pt-6 border-t text-left" style={{ borderColor: styles.border }}>
          <p
            className={`text-xs font-medium uppercase tracking-wider mb-4 ${isRtl ? 'text-right' : ''}`}
            style={{ color: styles.textMuted }}
          >
            {isRtl ? 'خطوات البدء' : 'Getting started'}
          </p>
          <div className="space-y-3">
            {onboarding.steps.map((step) => (
              <div key={step.id} className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                {step.completed ? (
                  <CheckCircle size={16} weight="fill" style={{ color: styles.success }} />
                ) : (
                  <div className="w-4 h-4 rounded-full border" style={{ borderColor: styles.border }} />
                )}
                <span
                  className="text-sm flex-1"
                  style={{ color: step.completed ? styles.textMuted : styles.textSecondary }}
                >
                  {isRtl ? step.labelAr : step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default SellerHome;
