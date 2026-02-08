// =============================================================================
// Seller Payouts Page - Stage 8: Automation, Payouts & Scale
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { payoutService } from '../../services/payoutService';
import {
  CurrencyDollar,
  Clock,
  CheckCircle,
  Warning,
  Eye,
  Gear,
  CaretRight,
  CaretDown,
  CaretUp,
  Funnel,
  X,
  ArrowsClockwise,
  Spinner,
  DotsThreeVertical,
  CaretLeft,
  DownloadSimple,
  Receipt,
  Package,
  CalendarBlank,
  Wallet,
  Timer,
  ShieldWarning,
  Bank,
  Info,
  Pause,
  ShieldCheck,
  Hourglass,
  User,
  Robot,
  UserCircleGear,
  ListBullets,
  Scales,
  IdentificationCard,
} from 'phosphor-react';
import { Button, EmptyState, PortalDatePicker, SkeletonTableRow } from '../../components';
import { Select, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../components/ui';
import { usePortal } from '../../context/PortalContext';
import {
  SellerPayout,
  PayoutSettings,
  PayoutStats,
  EligiblePayout,
  PayoutFilters,
  PayoutStatus,
  PAYOUT_STATUS_LABELS,
  PAYOUT_STATUS_MICROCOPY,
  PAYOUT_FREQUENCY_LABELS,
  PayoutLineItem,
  FundsTimelineEntry,
  TIMELINE_STATUS_LABELS,
  TIMELINE_STATUS_MICROCOPY,
  TRUST_MICROCOPY,
  PayoutEvent,
  HoldReasonCategory,
  HoldReasonSummary,
  HOLD_REASON_LABELS,
  HOLD_REASON_DESCRIPTIONS,
  HOLD_REASON_COLORS,
  PAYOUT_EVENT_LABELS,
  PayoutEventType,
} from '../../types/payout.types';

interface SellerPayoutsProps {
  onNavigate: (page: string) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(dateStr);
};

// =============================================================================
// Payout Summary Cards - 4 clear cards showing money at a glance
// =============================================================================
const PayoutSummaryCards: React.FC<{
  stats: PayoutStats;
  eligible: EligiblePayout | null;
  lastPayout: SellerPayout | null;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ stats, eligible, lastPayout, styles }) => {
  const summaryItems = [
    {
      icon: Wallet,
      label: 'Available Balance',
      value: eligible ? eligible.eligibleAmount : 0,
      subtext: eligible?.eligibleInvoices
        ? `${eligible.eligibleInvoices} invoices ready`
        : TRUST_MICROCOPY.noEligibleFunds,
      color: styles.success,
      bgColor: 'rgba(34,197,94,0.08)',
      isAmount: true,
    },
    {
      icon: Timer,
      label: 'Pending Balance',
      value: eligible?.pendingAmount ?? stats.totalPending,
      subtext: TRUST_MICROCOPY.processingToBank,
      color: '#F59E0B',
      bgColor: 'rgba(245,158,11,0.08)',
      isAmount: true,
    },
    {
      icon: CheckCircle,
      label: 'Last Payout',
      value: lastPayout ? lastPayout.netAmount : 0,
      subtext: lastPayout ? formatDate(lastPayout.settledAt || lastPayout.createdAt) : 'No payouts yet',
      color: styles.info,
      bgColor: 'rgba(59,130,246,0.08)',
      isAmount: true,
      showDash: !lastPayout,
    },
    {
      icon: CalendarBlank,
      label: 'Next Payout',
      value: 0,
      dateValue: eligible?.nextPayoutDate,
      subtext: eligible?.payoutSchedule || 'Weekly payouts',
      color: '#8B5CF6',
      bgColor: 'rgba(139,92,246,0.08)',
      isDate: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryItems.map((item, index) => (
        <div
          key={index}
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: styles.bgCard,
            borderColor: styles.border,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: item.bgColor }}>
              <item.icon size={20} style={{ color: item.color }} />
            </div>
          </div>
          <p className="text-sm mb-1" style={{ color: styles.textMuted }}>
            {item.label}
          </p>
          <p className="text-xl font-semibold mb-1" style={{ color: styles.textPrimary }}>
            {item.showDash
              ? '—'
              : item.isDate
                ? item.dateValue
                  ? formatDate(item.dateValue)
                  : '—'
                : formatCurrency(item.value, stats.currency)}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {item.subtext}
          </p>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// Balance Breakdown Section - Clear visibility into Available / Pending / On Hold
// =============================================================================
const BalanceBreakdownSection: React.FC<{
  stats: PayoutStats;
  eligible: EligiblePayout | null;
  onHoldPayouts: SellerPayout[];
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ stats, eligible, onHoldPayouts, styles }) => {
  // Calculate on-hold breakdown by categorizing hold reasons
  const getHoldReasonCategory = (reason: string | null | undefined): HoldReasonCategory => {
    if (!reason) return 'other';
    const lower = reason.toLowerCase();
    if (lower.includes('dispute')) return 'dispute';
    if (lower.includes('verif')) return 'verification';
    if (lower.includes('review')) return 'review';
    if (lower.includes('compliance') || lower.includes('regulat')) return 'compliance';
    if (lower.includes('system') || lower.includes('auto')) return 'system';
    return 'other';
  };

  // Group on-hold payouts by reason category
  const holdReasonSummaries: HoldReasonSummary[] = [];
  const categoryMap = new Map<HoldReasonCategory, { amount: number; count: number; earliest?: string }>();

  onHoldPayouts.forEach((payout) => {
    const category = getHoldReasonCategory(payout.holdReason);
    const existing = categoryMap.get(category) || { amount: 0, count: 0 };
    categoryMap.set(category, {
      amount: existing.amount + payout.netAmount,
      count: existing.count + 1,
      earliest:
        !existing.earliest || (payout.holdUntil && payout.holdUntil < existing.earliest)
          ? payout.holdUntil || undefined
          : existing.earliest,
    });
  });

  categoryMap.forEach((value, category) => {
    holdReasonSummaries.push({
      category,
      label: HOLD_REASON_LABELS[category],
      description: HOLD_REASON_DESCRIPTIONS[category],
      amount: value.amount,
      payoutCount: value.count,
      expectedReleaseDate: value.earliest,
    });
  });

  const totalOnHold = onHoldPayouts.reduce((sum, p) => sum + p.netAmount, 0);

  return (
    <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet size={20} style={{ color: styles.textPrimary }} />
          <h3 className="font-semibold" style={{ color: styles.textPrimary }}>
            Balance Breakdown
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: styles.success }}>
          <ShieldCheck size={14} />
          <span>{TRUST_MICROCOPY.fundsSecurelyHeld}</span>
        </div>
      </div>

      {/* Three Column Balance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div
          className="rounded-lg p-4 border-l-4"
          style={{
            backgroundColor: 'rgba(34,197,94,0.04)',
            borderLeftColor: styles.success,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <CheckCircle size={16} weight="fill" style={{ color: styles.success }} />
            </div>
            <span className="text-sm font-medium" style={{ color: styles.success }}>
              Available
            </span>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: styles.textPrimary }}>
            {formatCurrency(eligible?.eligibleAmount || 0, stats.currency)}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {eligible?.eligibleInvoices
              ? `${eligible.eligibleInvoices} invoices ready for payout`
              : 'Ready to withdraw'}
          </p>
        </div>

        {/* Pending Balance */}
        <div
          className="rounded-lg p-4 border-l-4"
          style={{
            backgroundColor: 'rgba(59,130,246,0.04)',
            borderLeftColor: styles.info,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <Timer size={16} weight="fill" style={{ color: styles.info }} />
            </div>
            <span className="text-sm font-medium" style={{ color: styles.info }}>
              Pending
            </span>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: styles.textPrimary }}>
            {formatCurrency(eligible?.pendingAmount ?? stats.totalPending, stats.currency)}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {TRUST_MICROCOPY.processingToBank}
          </p>
        </div>

        {/* On Hold Balance */}
        <div
          className="rounded-lg p-4 border-l-4"
          style={{
            backgroundColor: totalOnHold > 0 ? 'rgba(249,115,22,0.04)' : styles.bgSecondary,
            borderLeftColor: totalOnHold > 0 ? '#F97316' : styles.border,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="p-1.5 rounded-md"
              style={{ backgroundColor: totalOnHold > 0 ? 'rgba(249,115,22,0.1)' : styles.bgSecondary }}
            >
              <Pause size={16} weight="fill" style={{ color: totalOnHold > 0 ? '#F97316' : styles.textMuted }} />
            </div>
            <span className="text-sm font-medium" style={{ color: totalOnHold > 0 ? '#F97316' : styles.textMuted }}>
              On Hold
            </span>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: styles.textPrimary }}>
            {formatCurrency(totalOnHold, stats.currency)}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {totalOnHold > 0
              ? `${onHoldPayouts.length} payout${onHoldPayouts.length > 1 ? 's' : ''} held`
              : 'No funds on hold'}
          </p>
        </div>
      </div>

      {/* Hold Reasons Detail - Only show if there are holds */}
      {holdReasonSummaries.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: styles.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: styles.textMuted }} />
            <span className="text-xs font-medium" style={{ color: styles.textMuted }}>
              Hold Reasons
            </span>
          </div>
          <div className="space-y-2">
            {holdReasonSummaries.map((reason, idx) => {
              const colors = HOLD_REASON_COLORS[reason.category];
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.bg }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded" style={{ backgroundColor: `${colors.text}20` }}>
                      {reason.category === 'dispute' && <Scales size={14} style={{ color: colors.text }} />}
                      {reason.category === 'verification' && (
                        <IdentificationCard size={14} style={{ color: colors.text }} />
                      )}
                      {reason.category === 'review' && <Eye size={14} style={{ color: colors.text }} />}
                      {reason.category === 'compliance' && <ShieldWarning size={14} style={{ color: colors.text }} />}
                      {(reason.category === 'system' || reason.category === 'other') && (
                        <Info size={14} style={{ color: colors.text }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                        {reason.label}
                      </p>
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        {reason.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: colors.text }}>
                      {formatCurrency(reason.amount, stats.currency)}
                    </p>
                    {reason.expectedReleaseDate && (
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        Expected: {formatDate(reason.expectedReleaseDate)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Expected Payout Date Section - Clear explanation of when funds arrive
// =============================================================================
const ExpectedPayoutSection: React.FC<{
  eligible: EligiblePayout | null;
  settings: PayoutSettings | null;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ eligible, settings, styles }) => {
  if (!eligible?.nextPayoutDate) return null;

  const nextDate = new Date(eligible.nextPayoutDate);
  const now = new Date();
  const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / 86400000);

  const getPayoutDayLabel = () => {
    if (daysUntil <= 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    return formatDate(eligible.nextPayoutDate!);
  };

  const getFrequencyExplanation = () => {
    if (!settings) return 'Based on your payout schedule';
    switch (settings.payoutFrequency) {
      case 'daily':
        return 'Payouts processed daily';
      case 'weekly':
        return 'Payouts processed weekly';
      case 'biweekly':
        return 'Payouts processed bi-weekly';
      case 'monthly':
        return 'Payouts processed monthly';
      default:
        return 'Based on your schedule';
    }
  };

  return (
    <div
      className="rounded-xl border p-4 mb-6 flex items-center justify-between"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.08)' }}>
          <Hourglass size={24} style={{ color: '#8B5CF6' }} />
        </div>
        <div>
          <p className="text-sm" style={{ color: styles.textMuted }}>
            Next Scheduled Payout
          </p>
          <p className="text-xl font-bold" style={{ color: styles.textPrimary }}>
            {getPayoutDayLabel()}
          </p>
          <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
            {getFrequencyExplanation()}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm" style={{ color: styles.textMuted }}>
          Expected amount
        </p>
        <p className="text-lg font-semibold" style={{ color: styles.success }}>
          {formatCurrency(eligible.eligibleAmount, eligible.currency)}
        </p>
        {eligible.minPayoutAmount && eligible.eligibleAmount < eligible.minPayoutAmount && (
          <p className="text-xs" style={{ color: styles.error }}>
            Below min ({formatCurrency(eligible.minPayoutAmount, eligible.currency)})
          </p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Withdrawal Section - Clear eligibility and action
// =============================================================================
const WithdrawalSection: React.FC<{
  eligible: EligiblePayout | null;
  settings: PayoutSettings | null;
  styles: ReturnType<typeof usePortal>['styles'];
  onOpenSettings: () => void;
}> = ({ eligible, settings, styles, onOpenSettings }) => {
  const canWithdraw =
    eligible && eligible.bankVerified && eligible.eligibleAmount > 0 && !eligible.withdrawalDisabledReason;

  const disabledReason =
    eligible?.withdrawalDisabledReason || (!eligible?.bankVerified ? TRUST_MICROCOPY.bankVerificationNeeded : null);

  return (
    <div className="rounded-xl border p-4 mb-6" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
            <Wallet size={24} style={{ color: styles.success }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: styles.textMuted }}>
              Available for payout
            </p>
            <p className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
              {formatCurrency(eligible?.eligibleAmount || 0, eligible?.currency || 'SAR')}
            </p>
            {settings && (
              <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                {PAYOUT_FREQUENCY_LABELS[settings.payoutFrequency]} payouts
                {settings.minPayoutAmount > 0 && ` · Min ${formatCurrency(settings.minPayoutAmount, 'SAR')}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {canWithdraw ? (
            <>
              <Button variant="primary" size="sm">
                <Bank size={16} className="mr-1" />
                Request Payout
              </Button>
              <p className="text-xs" style={{ color: styles.success }}>
                {TRUST_MICROCOPY.paidToBankAccount}
              </p>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" disabled>
                <Bank size={16} className="mr-1" />
                Request Payout
              </Button>
              {disabledReason && (
                <button
                  onClick={!eligible?.bankVerified ? onOpenSettings : undefined}
                  className="text-xs flex items-center gap-1"
                  style={{ color: styles.error }}
                >
                  <Warning size={12} />
                  {disabledReason}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Funds Timeline - Shows lifecycle of funds from order to payout
// =============================================================================
const FundsTimeline: React.FC<{
  entries: FundsTimelineEntry[];
  loading: boolean;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ entries, loading, styles }) => {
  const getStatusColor = (status: FundsTimelineEntry['status']) => {
    switch (status) {
      case 'paid':
        return { bg: 'rgba(34,197,94,0.1)', text: styles.success, dot: styles.success };
      case 'eligible':
        return { bg: 'rgba(59,130,246,0.1)', text: styles.info, dot: styles.info };
      case 'funds_held':
        return { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', dot: '#F59E0B' };
      case 'order_completed':
        return { bg: 'rgba(107,114,128,0.1)', text: styles.textMuted, dot: styles.textMuted };
      default:
        return { bg: styles.bgSecondary, text: styles.textMuted, dot: styles.textMuted };
    }
  };

  const formatDaysRemaining = (holdEndDate: string | null | undefined): string => {
    if (!holdEndDate) return '';
    const end = new Date(holdEndDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (days <= 0) return 'Ready now';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  if (loading) {
    return (
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} style={{ color: styles.textMuted }} />
          <h3 className="font-medium" style={{ color: styles.textPrimary }}>
            Funds Timeline
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Spinner size={24} className="animate-spin" style={{ color: styles.info }} />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} style={{ color: styles.textMuted }} />
          <h3 className="font-medium" style={{ color: styles.textPrimary }}>
            Funds Timeline
          </h3>
        </div>
        <p className="text-sm text-center py-4" style={{ color: styles.textMuted }}>
          Your funds flow will appear here once you have completed orders.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} style={{ color: styles.textMuted }} />
          <h3 className="font-medium" style={{ color: styles.textPrimary }}>
            Funds Timeline
          </h3>
        </div>
        <p className="text-xs" style={{ color: styles.textMuted }}>
          {TRUST_MICROCOPY.fundsSecurelyHeld}
        </p>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const colors = getStatusColor(entry.status);
          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 p-3 rounded-lg"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              {/* Status dot with connector line */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.dot }} />
                {index < entries.length - 1 && (
                  <div className="w-0.5 h-6 mt-1" style={{ backgroundColor: styles.border }} />
                )}
              </div>

              {/* Order info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate" style={{ color: styles.textPrimary }}>
                    {entry.orderNumber}
                  </p>
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-full shrink-0"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {TIMELINE_STATUS_LABELS[entry.status]}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                  {TIMELINE_STATUS_MICROCOPY[entry.status]}
                  {entry.status === 'funds_held' && entry.holdEndDate && (
                    <> · {formatDaysRemaining(entry.holdEndDate)}</>
                  )}
                  {entry.payoutNumber && <> · {entry.payoutNumber}</>}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                  {formatCurrency(entry.amount, entry.currency)}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  {formatDate(entry.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Component
// =============================================================================

export const SellerPayouts: React.FC<SellerPayoutsProps> = ({ onNavigate }) => {
  const { getToken } = useAuth();
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [eligible, setEligible] = useState<EligiblePayout | null>(null);
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<SellerPayout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState<PayoutFilters>({});
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastPayout, setLastPayout] = useState<SellerPayout | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<FundsTimelineEntry[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [onHoldPayouts, setOnHoldPayouts] = useState<SellerPayout[]>([]);

  // Check if any filters are active
  const hasActiveFilters = filters.status || filters.dateFrom || filters.dateTo;

  const clearAllFilters = () => {
    setFilters({});
  };

  // Fetch timeline data
  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const timelineRes = await payoutService.getTimeline(token, 10);
      setTimelineEntries(timelineRes.entries);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setTimelineLoading(false);
    }
  }, [getToken]);

  // Fetch main data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const [payoutsRes, statsRes, eligibleRes, settingsRes] = await Promise.all([
        payoutService.getPayouts(token, { ...filters, page, limit: 10 }),
        payoutService.getStats(token),
        payoutService.getEligible(token),
        payoutService.getSettings(token),
      ]);

      setPayouts(payoutsRes.payouts);
      setTotalPages(payoutsRes.pagination.totalPages);
      setStats(statsRes);
      setEligible(eligibleRes);
      setSettings(settingsRes);

      // Find the last settled payout for the summary
      const settledPayouts = payoutsRes.payouts.filter((p) => p.status === 'settled');
      if (settledPayouts.length > 0) {
        setLastPayout(settledPayouts[0]);
      }

      // Extract on-hold payouts for balance breakdown
      const heldPayouts = payoutsRes.payouts.filter((p) => p.status === 'on_hold');
      setOnHoldPayouts(heldPayouts);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, filters, page]);

  useEffect(() => {
    fetchData();
    fetchTimeline();
  }, [fetchData, fetchTimeline]);

  // Update settings handler
  const handleUpdateSettings = async (newSettings: Partial<PayoutSettings>) => {
    try {
      const token = await getToken();
      if (!token) return;

      const updated = await payoutService.updateSettings(token, newSettings);
      setSettings(updated);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  // Micro action handlers
  const handleDownloadReport = (payout: SellerPayout) => {
    // Generate a simple CSV report for the payout
    const rows = [
      ['Payout Report'],
      ['Payout Number', payout.payoutNumber],
      ['Period', `${formatDate(payout.periodStart)} - ${formatDate(payout.periodEnd)}`],
      ['Status', PAYOUT_STATUS_LABELS[payout.status]],
      [''],
      ['Amount Breakdown'],
      ['Gross Amount', formatCurrency(payout.grossAmount, payout.currency)],
      ['Platform Fee', formatCurrency(payout.platformFeeTotal, payout.currency)],
      ['Adjustments', formatCurrency(payout.adjustments, payout.currency)],
      ['Net Amount', formatCurrency(payout.netAmount, payout.currency)],
      [''],
      ['Bank Details'],
      ['Bank', payout.bankName],
      ['Account Holder', payout.accountHolder],
      ['IBAN', payout.ibanMasked],
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-${payout.payoutNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewInvoices = (payout: SellerPayout) => {
    // Open the payout details modal focused on invoices
    setSelectedPayout(payout);
  };

  const handleViewOrders = (payout: SellerPayout) => {
    // Navigate to orders page filtered by this payout period
    onNavigate(`orders?from=${payout.periodStart}&to=${payout.periodEnd}`);
  };

  // Status badge with clear microcopy
  const StatusBadge: React.FC<{ status: PayoutStatus; holdReason?: string | null }> = ({ status, holdReason }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'settled':
          return { bg: 'rgba(34,197,94,0.1)', text: styles.success };
        case 'processing':
          return { bg: 'rgba(59,130,246,0.1)', text: styles.info };
        case 'pending':
          return { bg: 'rgba(234,179,8,0.1)', text: '#F59E0B' };
        case 'on_hold':
          return { bg: 'rgba(249,115,22,0.1)', text: '#F97316' };
        case 'failed':
          return { bg: 'rgba(239,68,68,0.1)', text: styles.error };
        default:
          return { bg: styles.bgSecondary, text: styles.textMuted };
      }
    };

    // Get simple microcopy based on status
    const getMicrocopy = (): string => {
      if (status === 'on_hold' && holdReason) {
        // Simplify hold reasons
        if (holdReason.toLowerCase().includes('dispute')) return 'On hold due to dispute';
        if (holdReason.toLowerCase().includes('verif')) return 'On hold for verification';
        return holdReason.length > 25 ? holdReason.substring(0, 25) + '...' : holdReason;
      }
      return PAYOUT_STATUS_MICROCOPY[status];
    };

    const colors = getStatusColor();
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="px-2 py-0.5 text-xs font-medium rounded-full"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {PAYOUT_STATUS_LABELS[status]}
        </span>
        <span className="text-[10px]" style={{ color: styles.textMuted }}>
          {getMicrocopy()}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              Payouts
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              Your earnings are securely managed. Track payouts and view history.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSettings(true)} variant="outline" size="sm">
              <Gear size={16} className="mr-1" />
              Settings
            </Button>
            <Button
              onClick={() => {
                fetchData();
                fetchTimeline();
              }}
              variant="outline"
              size="sm"
            >
              <ArrowsClockwise size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Payout Summary Cards - 4 clear cards */}
        {stats && <PayoutSummaryCards stats={stats} eligible={eligible} lastPayout={lastPayout} styles={styles} />}

        {/* Balance Breakdown - Available / Pending / On Hold with trust indicators */}
        {stats && (
          <BalanceBreakdownSection stats={stats} eligible={eligible} onHoldPayouts={onHoldPayouts} styles={styles} />
        )}

        {/* Expected Payout Date - Clear explanation */}
        <ExpectedPayoutSection eligible={eligible} settings={settings} styles={styles} />

        {/* Withdrawal Section - Clear eligibility and action */}
        <WithdrawalSection
          eligible={eligible}
          settings={settings}
          styles={styles}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Bank Verification Notice */}
        {eligible && !eligible.bankVerified && (
          <div
            className="rounded-xl p-4 mb-6 flex items-center gap-3"
            style={{
              backgroundColor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <Bank size={20} style={{ color: '#F59E0B' }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {TRUST_MICROCOPY.bankVerificationNeeded}
              </p>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                Add and verify your bank account to receive payouts
              </p>
            </div>
            <Button onClick={() => setShowSettings(true)} variant="outline" size="sm">
              Add Bank
            </Button>
          </div>
        )}

        {/* Funds Timeline - Shows lifecycle of funds */}
        <FundsTimeline entries={timelineEntries} loading={timelineLoading} styles={styles} />

        {/* Payout History Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt size={18} style={{ color: styles.textMuted }} />
            <h2 className="font-medium" style={{ color: styles.textPrimary }}>
              Payout History
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {sortOrder === 'desc' ? <CaretDown size={14} /> : <CaretUp size={14} />}
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors"
              style={{ color: hasActiveFilters ? styles.info : styles.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Funnel size={14} />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.info }} />}
            </button>
          </div>
        </div>

        {/* Filter Bar - Collapsible */}
        {filtersExpanded && (
          <div
            className="rounded-xl border mb-4 p-4"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="flex flex-wrap items-center gap-3">
              {/* Status */}
              <Select
                value={filters.status || 'all'}
                onChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : (v as PayoutStatus) })}
                placeholder="Status"
                options={[
                  { value: 'all', label: 'All Status' },
                  ...Object.entries(PAYOUT_STATUS_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />

              {/* Date From */}
              <PortalDatePicker
                value={filters.dateFrom || ''}
                onChange={(value) => setFilters({ ...filters, dateFrom: value || undefined })}
                placeholder={isRtl ? 'من تاريخ' : 'From date'}
                maxDate={filters.dateTo}
              />

              {/* Date To */}
              <PortalDatePicker
                value={filters.dateTo || ''}
                onChange={(value) => setFilters({ ...filters, dateTo: value || undefined })}
                placeholder={isRtl ? 'إلى تاريخ' : 'To date'}
                minDate={filters.dateFrom}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                  style={{ color: styles.error }}
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {loading && payouts.length === 0 ? (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${styles.border}` }}>
                  {['Payout ID', 'Amount', 'Status', 'Date', 'Details'].map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <div className="shimmer h-3 w-16 rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <SkeletonTableRow key={i} columns={5} />
                ))}
              </tbody>
            </table>
          </div>
        ) : payouts.length === 0 ? (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={CurrencyDollar}
              title="No payouts yet"
              description="Your payout history will appear here once you have completed orders."
            />
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr style={{ backgroundColor: styles.tableHeader, borderBottom: `1px solid ${styles.tableBorder}` }}>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      Payout ID
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      Amount
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      Fee
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      Net
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      Status
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      Expected / Paid
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortOrder === 'asc' ? [...payouts].reverse() : payouts).map((payout, index) => (
                    <tr
                      key={payout.id}
                      className="group transition-colors cursor-pointer"
                      style={{
                        borderBottom: index === payouts.length - 1 ? 'none' : `1px solid ${styles.tableBorder}`,
                      }}
                      onClick={() => setSelectedPayout(payout)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.tableRowHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                            {payout.payoutNumber}
                          </p>
                          <p className="text-xs" style={{ color: styles.textMuted }}>
                            {formatRelativeTime(payout.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm" style={{ color: styles.textMuted }}>
                          {formatCurrency(payout.grossAmount, payout.currency)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm" style={{ color: styles.error }}>
                          -{formatCurrency(payout.platformFeeTotal, payout.currency)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium" style={{ color: styles.success, fontSize: '0.79rem' }}>
                          {formatCurrency(payout.netAmount, payout.currency)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={payout.status} holdReason={payout.holdReason} />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                            {payout.status === 'settled' && payout.settledAt
                              ? formatDate(payout.settledAt)
                              : payout.status === 'pending'
                                ? 'Next cycle'
                                : payout.status === 'processing'
                                  ? 'In progress'
                                  : payout.status === 'on_hold'
                                    ? payout.holdUntil
                                      ? formatDate(payout.holdUntil)
                                      : 'On hold'
                                    : '—'}
                          </p>
                          <p className="text-xs" style={{ color: styles.textMuted }}>
                            {payout.status === 'settled'
                              ? TRUST_MICROCOPY.paidToBankAccount
                              : payout.status === 'processing'
                                ? TRUST_MICROCOPY.processingToBank
                                : payout.status === 'pending'
                                  ? 'Scheduled for payout'
                                  : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded transition-colors"
                              style={{ color: styles.textMuted }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = styles.bgHover;
                                e.currentTarget.style.color = styles.textPrimary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = styles.textMuted;
                              }}
                            >
                              <DotsThreeVertical size={16} weight="bold" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRtl ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => setSelectedPayout(payout)}>
                              <Eye size={14} />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadReport(payout)}>
                              <DownloadSimple size={14} />
                              Download Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewInvoices(payout)}>
                              <Receipt size={14} />
                              View Invoices
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewOrders(payout)}>
                              <Package size={14} />
                              View Orders
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div
              className="px-4 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: `1px solid ${styles.tableBorder}`, backgroundColor: styles.tableHeader }}
            >
              <span style={{ color: styles.textMuted }}>Showing {payouts.length} payouts</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded transition-colors disabled:opacity-40"
                    style={{ color: styles.textMuted }}
                    onMouseEnter={(e) =>
                      !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = styles.bgHover)
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <CaretLeft size={16} />
                  </button>
                  <span style={{ color: styles.textMuted }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded transition-colors disabled:opacity-40"
                    style={{ color: styles.textMuted }}
                    onMouseEnter={(e) =>
                      !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = styles.bgHover)
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <CaretRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payout Details Modal */}
      {selectedPayout && (
        <PayoutDetailsModal payout={selectedPayout} onClose={() => setSelectedPayout(null)} styles={styles} />
      )}

      {/* Settings Modal */}
      {showSettings && settings && (
        <PayoutSettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={handleUpdateSettings}
          styles={styles}
        />
      )}
    </div>
  );
};

// =============================================================================
// Payout Details Modal - Enhanced with invoice breakdown
// =============================================================================

interface PayoutDetailsModalProps {
  payout: SellerPayout;
  onClose: () => void;
  styles: ReturnType<typeof usePortal>['styles'];
}

const PayoutDetailsModal: React.FC<PayoutDetailsModalProps> = ({ payout, onClose, styles }) => {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'invoices' | 'audit'>('summary');
  const [auditEvents, setAuditEvents] = useState<PayoutEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Fetch audit trail when tab is opened
  useEffect(() => {
    if (activeTab === 'audit' && auditEvents.length === 0) {
      fetchAuditTrail();
    }
  }, [activeTab]);

  const fetchAuditTrail = async () => {
    setAuditLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const events = await payoutService.getPayoutHistory(token, payout.id);
      setAuditEvents(events);
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  // Helper to get actor display info
  const getActorInfo = (event: PayoutEvent) => {
    switch (event.actorType) {
      case 'system':
        return { icon: Robot, label: 'System', color: styles.info };
      case 'admin':
        return { icon: UserCircleGear, label: 'Admin', color: '#8B5CF6' };
      case 'seller':
        return { icon: User, label: 'You', color: styles.success };
      default:
        return { icon: User, label: 'Unknown', color: styles.textMuted };
    }
  };

  // Helper to get event type info
  const getEventTypeInfo = (eventType: string) => {
    const type = eventType as PayoutEventType;
    return {
      label: PAYOUT_EVENT_LABELS[type] || eventType.replace(/_/g, ' '),
      color: eventType.includes('FAILED')
        ? styles.error
        : eventType.includes('HOLD')
          ? '#F97316'
          : eventType.includes('SETTLED') || eventType.includes('CONFIRMED')
            ? styles.success
            : styles.info,
    };
  };

  const getStatusColor = (status: PayoutStatus) => {
    switch (status) {
      case 'settled':
        return { bg: 'rgba(34,197,94,0.1)', text: styles.success };
      case 'processing':
        return { bg: 'rgba(59,130,246,0.1)', text: styles.info };
      case 'pending':
        return { bg: 'rgba(234,179,8,0.1)', text: '#F59E0B' };
      case 'on_hold':
        return { bg: 'rgba(249,115,22,0.1)', text: '#F97316' };
      case 'failed':
        return { bg: 'rgba(239,68,68,0.1)', text: styles.error };
      default:
        return { bg: styles.bgSecondary, text: styles.textMuted };
    }
  };

  const statusColors = getStatusColor(payout.status);

  // Use actual line items from API
  const invoices: PayoutLineItem[] = payout.lineItems || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden"
        style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: styles.border }}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
              {payout.payoutNumber}
            </h2>
            <div className="flex flex-col items-start">
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
              >
                {PAYOUT_STATUS_LABELS[payout.status]}
              </span>
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                {PAYOUT_STATUS_MICROCOPY[payout.status]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: styles.border }}>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'summary' ? 'border-b-2' : ''}`}
            style={{
              color: activeTab === 'summary' ? styles.info : styles.textMuted,
              borderColor: activeTab === 'summary' ? styles.info : 'transparent',
            }}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'invoices' ? 'border-b-2' : ''}`}
            style={{
              color: activeTab === 'invoices' ? styles.info : styles.textMuted,
              borderColor: activeTab === 'invoices' ? styles.info : 'transparent',
            }}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'audit' ? 'border-b-2' : ''}`}
            style={{
              color: activeTab === 'audit' ? styles.info : styles.textMuted,
              borderColor: activeTab === 'audit' ? styles.info : 'transparent',
            }}
          >
            <span className="flex items-center justify-center gap-1">
              <ListBullets size={14} />
              Audit Trail
            </span>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'summary' ? (
            <>
              {/* Period */}
              <div className="flex items-center gap-2 text-sm" style={{ color: styles.textMuted }}>
                <CalendarBlank size={16} />
                {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
              </div>

              {/* Money Breakdown - Simple and clear */}
              <div className="rounded-lg p-4" style={{ backgroundColor: styles.bgSecondary }}>
                <h3 className="font-medium mb-4" style={{ color: styles.textPrimary }}>
                  Money Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: styles.textMuted }}>
                      Total from orders
                    </span>
                    <span className="font-medium" style={{ color: styles.textPrimary }}>
                      {formatCurrency(payout.grossAmount, payout.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: styles.textMuted }}>
                      Platform fee
                    </span>
                    <span className="font-medium" style={{ color: styles.error }}>
                      -{formatCurrency(payout.platformFeeTotal, payout.currency)}
                    </span>
                  </div>
                  {payout.adjustments !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: styles.textMuted }}>
                        Adjustments
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: payout.adjustments >= 0 ? styles.success : styles.error }}
                      >
                        {payout.adjustments >= 0 ? '+' : ''}
                        {formatCurrency(payout.adjustments, payout.currency)}
                      </span>
                    </div>
                  )}
                  <div
                    className="border-t pt-3 flex justify-between items-center"
                    style={{ borderColor: styles.border }}
                  >
                    <span className="font-medium" style={{ color: styles.textPrimary }}>
                      You receive
                    </span>
                    <span className="text-lg font-bold" style={{ color: styles.success }}>
                      {formatCurrency(payout.netAmount, payout.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details - Simplified */}
              <div className="rounded-lg p-4" style={{ backgroundColor: styles.bgSecondary }}>
                <div className="flex items-center gap-2 mb-3">
                  <Bank size={18} style={{ color: styles.textMuted }} />
                  <h3 className="font-medium" style={{ color: styles.textPrimary }}>
                    Bank Account
                  </h3>
                </div>
                <div className="space-y-2">
                  <p style={{ color: styles.textPrimary }}>{payout.bankName}</p>
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    {payout.accountHolder}
                  </p>
                  <p className="text-sm font-mono" style={{ color: styles.textMuted }}>
                    {payout.ibanMasked}
                  </p>
                  {payout.bankReference && (
                    <p className="text-xs" style={{ color: styles.textMuted }}>
                      Ref: {payout.bankReference}
                    </p>
                  )}
                </div>
              </div>

              {/* Hold Notice - Clear explanation */}
              {payout.holdReason && (
                <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(249,115,22,0.08)' }}>
                  <div className="flex items-start gap-3">
                    <ShieldWarning size={20} style={{ color: '#F97316' }} className="mt-0.5" />
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#F97316' }}>
                        {payout.holdReason.toLowerCase().includes('dispute') ? 'On hold due to dispute' : 'On hold'}
                      </p>
                      <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                        {payout.holdReason}
                      </p>
                      {payout.holdUntil && (
                        <p className="text-xs mt-2" style={{ color: styles.textMuted }}>
                          Expected release: {formatDate(payout.holdUntil)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline - Simplified with clear language */}
              <div>
                <h3 className="font-medium mb-3" style={{ color: styles.textPrimary }}>
                  Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.success }} />
                    <span style={{ color: styles.textMuted }}>Created {formatDate(payout.createdAt)}</span>
                  </div>
                  {payout.initiatedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.info }} />
                      <span style={{ color: styles.textMuted }}>Sent to bank {formatDate(payout.initiatedAt)}</span>
                    </div>
                  )}
                  {payout.settledAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.success }} />
                      <span style={{ color: styles.textMuted }}>Paid to your bank {formatDate(payout.settledAt)}</span>
                    </div>
                  )}
                  {payout.failedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.error }} />
                      <span style={{ color: styles.textMuted }}>Failed {formatDate(payout.failedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Invoices Tab - Clear breakdown per invoice */
            <div className="space-y-4">
              <p className="text-sm" style={{ color: styles.textMuted }}>
                Invoices included in this payout
              </p>

              {/* Invoice List */}
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-lg p-4 border"
                    style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs" style={{ color: styles.textMuted }}>
                          Order: {invoice.orderNumber}
                        </p>
                      </div>
                      <Receipt size={16} style={{ color: styles.textMuted }} />
                    </div>

                    {/* Invoice breakdown - Shows flow clearly */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: styles.textMuted }}>Invoice amount</span>
                        <span style={{ color: styles.textPrimary }}>
                          {formatCurrency(invoice.invoiceTotal, payout.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: styles.textMuted }}>Platform fee</span>
                        <span style={{ color: styles.error }}>
                          -{formatCurrency(invoice.platformFee, payout.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t" style={{ borderColor: styles.border }}>
                        <span className="font-medium" style={{ color: styles.textPrimary }}>
                          You receive
                        </span>
                        <span className="font-medium" style={{ color: styles.success }}>
                          {formatCurrency(invoice.netAmount, payout.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div
                className="rounded-lg p-4 mt-4"
                style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium" style={{ color: styles.textPrimary }}>
                    Total from {invoices.length} invoices
                  </span>
                  <span className="text-lg font-bold" style={{ color: styles.success }}>
                    {formatCurrency(payout.netAmount, payout.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Trail Tab - Full event history */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  Complete history of all actions on this payout
                </p>
                <div className="flex items-center gap-1 text-xs" style={{ color: styles.success }}>
                  <ShieldCheck size={12} />
                  <span>Verified audit log</span>
                </div>
              </div>

              {auditLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size={24} className="animate-spin" style={{ color: styles.info }} />
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="text-center py-8">
                  <ListBullets size={32} style={{ color: styles.textMuted }} className="mx-auto mb-2" />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    No audit events recorded
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditEvents.map((event, idx) => {
                    const actorInfo = getActorInfo(event);
                    const eventInfo = getEventTypeInfo(event.eventType);
                    const ActorIcon = actorInfo.icon;

                    return (
                      <div
                        key={event.id}
                        className="relative flex gap-4 p-4 rounded-lg"
                        style={{ backgroundColor: styles.bgSecondary }}
                      >
                        {/* Connector line */}
                        {idx < auditEvents.length - 1 && (
                          <div
                            className="absolute left-7 top-14 w-0.5 h-6"
                            style={{ backgroundColor: styles.border }}
                          />
                        )}

                        {/* Actor icon */}
                        <div className="shrink-0 p-2 rounded-full" style={{ backgroundColor: `${actorInfo.color}15` }}>
                          <ActorIcon size={16} style={{ color: actorInfo.color }} />
                        </div>

                        {/* Event details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium" style={{ color: eventInfo.color }}>
                              {eventInfo.label}
                            </span>
                            <span className="text-xs" style={{ color: styles.textMuted }}>
                              by {actorInfo.label}
                            </span>
                          </div>

                          {/* Status transition */}
                          {event.fromStatus && event.toStatus && (
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="px-2 py-0.5 text-xs rounded-full"
                                style={{
                                  backgroundColor: styles.bgCard,
                                  color: styles.textMuted,
                                }}
                              >
                                {PAYOUT_STATUS_LABELS[event.fromStatus as PayoutStatus] || event.fromStatus}
                              </span>
                              <CaretRight size={12} style={{ color: styles.textMuted }} />
                              <span
                                className="px-2 py-0.5 text-xs rounded-full font-medium"
                                style={{
                                  backgroundColor: eventInfo.color + '20',
                                  color: eventInfo.color,
                                }}
                              >
                                {PAYOUT_STATUS_LABELS[event.toStatus as PayoutStatus] || event.toStatus}
                              </span>
                            </div>
                          )}

                          {/* Metadata details */}
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="text-xs p-2 rounded mt-2" style={{ backgroundColor: styles.bgCard }}>
                              {Object.entries(event.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span style={{ color: styles.textMuted }}>
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                                  </span>
                                  <span style={{ color: styles.textPrimary }}>
                                    {typeof value === 'number' && key.toLowerCase().includes('amount')
                                      ? formatCurrency(value, payout.currency)
                                      : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp */}
                          <p className="text-xs mt-2" style={{ color: styles.textMuted }}>
                            {new Date(event.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Trust footer */}
              <div
                className="rounded-lg p-3 mt-4 flex items-center gap-2"
                style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}
              >
                <ShieldCheck size={16} style={{ color: styles.success }} />
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  All payout activities are logged and cannot be modified. This audit trail provides complete
                  transparency into your payout lifecycle.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: styles.border }}>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Settings Modal
// =============================================================================

interface PayoutSettingsModalProps {
  settings: PayoutSettings;
  onClose: () => void;
  onSave: (settings: Partial<PayoutSettings>) => void;
  styles: ReturnType<typeof usePortal>['styles'];
}

const PayoutSettingsModal: React.FC<PayoutSettingsModalProps> = ({ settings, onClose, onSave, styles }) => {
  const [frequency, setFrequency] = useState(settings.payoutFrequency);
  const [payoutDay, setPayoutDay] = useState(settings.payoutDay || 1);
  const [minAmount, setMinAmount] = useState(settings.minPayoutAmount);
  const [holdEnabled, setHoldEnabled] = useState(settings.disputeHoldEnabled);
  const [holdDays, setHoldDays] = useState(settings.holdPeriodDays);

  const handleSave = () => {
    onSave({
      payoutFrequency: frequency,
      payoutDay: frequency === 'weekly' || frequency === 'biweekly' || frequency === 'monthly' ? payoutDay : undefined,
      minPayoutAmount: minAmount,
      disputeHoldEnabled: holdEnabled,
      holdPeriodDays: holdDays,
    });
  };

  const inputStyle = {
    borderColor: styles.border,
    backgroundColor: styles.bgPrimary,
    color: styles.textPrimary,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-xl shadow-xl"
        style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: styles.border }}>
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Payout Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Trust message */}
          <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
            <CheckCircle size={16} style={{ color: styles.success }} />
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {TRUST_MICROCOPY.fundsSecurelyHeld}. Configure how and when you receive payouts.
            </p>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: styles.textMuted }}>
              Payout Frequency
            </label>
            <Select
              value={frequency}
              onChange={(v) => setFrequency(v as PayoutSettings['payoutFrequency'])}
              options={Object.entries(PAYOUT_FREQUENCY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              className="w-full"
            />
            <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
              How often you want to receive payouts to your bank
            </p>
          </div>

          {/* Payout Day */}
          {(frequency === 'weekly' || frequency === 'biweekly') && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: styles.textMuted }}>
                Payout Day
              </label>
              <Select
                value={String(payoutDay)}
                onChange={(v) => setPayoutDay(Number(v))}
                options={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                  (day, idx) => ({
                    value: String(idx),
                    label: day,
                  }),
                )}
                className="w-full"
              />
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: styles.textMuted }}>
                Day of Month
              </label>
              <input
                type="number"
                min={1}
                max={28}
                value={payoutDay}
                onChange={(e) => setPayoutDay(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border text-sm outline-none"
                style={inputStyle}
              />
            </div>
          )}

          {/* Minimum Amount */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: styles.textMuted }}>
              Minimum Payout Amount (SAR)
            </label>
            <input
              type="number"
              min={0}
              value={minAmount}
              onChange={(e) => setMinAmount(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Hold Settings */}
          <div className="pt-4 border-t" style={{ borderColor: styles.border }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  Dispute Hold Period
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  Hold payouts when disputes are open
                </p>
              </div>
              <button
                onClick={() => setHoldEnabled(!holdEnabled)}
                className="w-10 h-5 rounded-full transition-colors"
                style={{ backgroundColor: holdEnabled ? styles.info : styles.border }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white transform transition-transform"
                  style={{ transform: holdEnabled ? 'translateX(20px)' : 'translateX(2px)' }}
                />
              </button>
            </div>

            {holdEnabled && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: styles.textMuted }}>
                  Hold Period (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={holdDays}
                  onChange={(e) => setHoldDays(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: styles.border }}>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default SellerPayouts;
