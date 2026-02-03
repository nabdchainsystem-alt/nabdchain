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
  MagnifyingGlass,
  Funnel,
  X,
  ArrowsClockwise,
  Spinner,
  DotsThreeVertical,
  CaretLeft,
} from 'phosphor-react';
import { Button, EmptyState } from '../../components';
import {
  Select,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui';
import { usePortal } from '../../context/PortalContext';
import {
  SellerPayout,
  PayoutSettings,
  PayoutStats,
  EligiblePayout,
  PayoutFilters,
  PayoutStatus,
  PAYOUT_STATUS_LABELS,
  PAYOUT_FREQUENCY_LABELS,
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

// Quick Stat Component
const QuickStat: React.FC<{
  label: string;
  value: string | number;
  color?: string;
  styles: ReturnType<typeof usePortal>['styles'];
  warning?: boolean;
}> = ({ label, value, color, styles, warning }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm" style={{ color: styles.textMuted }}>{label}:</span>
    <span
      className={`text-sm font-semibold ${warning ? 'flex items-center gap-1' : ''}`}
      style={{ color: color || styles.textPrimary }}
    >
      {warning && <Warning size={12} />}
      {value}
    </span>
  </div>
);

// =============================================================================
// Component
// =============================================================================

export const SellerPayouts: React.FC<SellerPayoutsProps> = ({ onNavigate }) => {
  const { getToken } = useAuth();
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [eligible, setEligible] = useState<EligiblePayout | null>(null);
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<SellerPayout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState<PayoutFilters>({});
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check if any filters are active
  const hasActiveFilters = filters.status || filters.dateFrom || filters.dateTo;

  const clearAllFilters = () => {
    setFilters({});
  };

  // Fetch data
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
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, filters, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Status badge component
  const StatusBadge: React.FC<{ status: PayoutStatus }> = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'settled': return { bg: 'rgba(34,197,94,0.1)', text: styles.success };
        case 'processing': return { bg: 'rgba(59,130,246,0.1)', text: styles.info };
        case 'pending': return { bg: 'rgba(234,179,8,0.1)', text: '#F59E0B' };
        case 'on_hold': return { bg: 'rgba(249,115,22,0.1)', text: '#F97316' };
        case 'failed': return { bg: 'rgba(239,68,68,0.1)', text: styles.error };
        default: return { bg: styles.bgSecondary, text: styles.textMuted };
      }
    };
    const colors = getStatusColor();
    return (
      <span
        className="px-2 py-0.5 text-xs font-medium rounded-full"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {PAYOUT_STATUS_LABELS[status]}
      </span>
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
              Track your earnings and payout history
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSettings(true)} variant="outline" size="sm">
              <Gear size={16} className="mr-1" />
              Settings
            </Button>
            <Button onClick={fetchData} variant="outline" size="sm">
              <ArrowsClockwise size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className={`flex items-center gap-6 mb-6 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
            {eligible && (
              <QuickStat
                label="Eligible"
                value={formatCurrency(eligible.eligibleAmount, eligible.currency)}
                color={styles.success}
                styles={styles}
              />
            )}
            <QuickStat
              label="Pending"
              value={formatCurrency(stats.totalPending, stats.currency)}
              color="#F59E0B"
              styles={styles}
            />
            <QuickStat
              label="Paid"
              value={formatCurrency(stats.totalPaid, stats.currency)}
              color={styles.info}
              styles={styles}
            />
            {stats.totalOnHold > 0 && (
              <QuickStat
                label="On Hold"
                value={formatCurrency(stats.totalOnHold, stats.currency)}
                color="#F97316"
                styles={styles}
                warning
              />
            )}
          </div>
        )}

        {/* Eligible Payout Banner */}
        {eligible && eligible.eligibleAmount > 0 && (
          <div
            className="rounded-xl p-6 mb-4"
            style={{
              background: `linear-gradient(135deg, ${styles.success} 0%, #10b981 100%)`,
              color: '#fff',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Ready for Payout</h3>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(eligible.eligibleAmount, eligible.currency)}
                </p>
                <p className="text-sm mt-2 opacity-80">
                  {eligible.eligibleInvoices} invoices from completed orders
                </p>
              </div>
              <div className="text-right">
                {eligible.nextPayoutDate && (
                  <p className="text-sm opacity-80">
                    Next payout: {formatDate(eligible.nextPayoutDate)}
                  </p>
                )}
                {!eligible.bankVerified && (
                  <div className="mt-2 flex items-center gap-2" style={{ color: '#fef08a' }}>
                    <Warning size={16} />
                    <span className="text-sm">Bank verification required</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div
          className="rounded-xl border mb-4"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          {/* Filter Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: styles.border }}>
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: styles.textPrimary }}
            >
              <Funnel size={16} />
              Filters
              <CaretRight
                size={14}
                className={`transition-transform ${filtersExpanded ? 'rotate-90' : ''}`}
                style={{ color: styles.textMuted }}
              />
              {hasActiveFilters && (
                <span
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Filter Controls */}
          {filtersExpanded && (
            <div className="px-4 py-3 flex flex-wrap items-center gap-3">
              {/* Status */}
              <Select
                value={filters.status || 'all'}
                onChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v as PayoutStatus })}
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
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                className="h-9 px-3 rounded-lg border text-sm outline-none"
                style={{
                  borderColor: styles.border,
                  backgroundColor: styles.bgPrimary,
                  color: styles.textPrimary,
                }}
              />

              {/* Date To */}
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                className="h-9 px-3 rounded-lg border text-sm outline-none"
                style={{
                  borderColor: styles.border,
                  backgroundColor: styles.bgPrimary,
                  color: styles.textPrimary,
                }}
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
          )}
        </div>

        {/* Table */}
        {loading && payouts.length === 0 ? (
          <div
            className="rounded-xl border py-16 flex items-center justify-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <Spinner size={32} className="animate-spin" style={{ color: styles.info }} />
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: styles.textMuted }}>
                      Payout
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: styles.textMuted }}>
                      Period
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: styles.textMuted }}>
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: styles.textMuted }}>
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: styles.textMuted }}>
                      Bank
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: styles.textMuted }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout, index) => (
                    <tr
                      key={payout.id}
                      className="group transition-colors cursor-pointer"
                      style={{ borderBottom: index === payouts.length - 1 ? 'none' : `1px solid ${styles.tableBorder}` }}
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
                      <td className="px-4 py-3">
                        <div style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                          {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <p className="font-medium" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                            {formatCurrency(payout.netAmount, payout.currency)}
                          </p>
                          <p className="text-xs" style={{ color: styles.textMuted }}>
                            Fee: {formatCurrency(payout.platformFeeTotal, payout.currency)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={payout.status} />
                        {payout.holdReason && (
                          <p className="text-xs mt-1 truncate max-w-[120px] mx-auto" style={{ color: styles.textMuted }}>
                            {payout.holdReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>{payout.bankName}</p>
                          <p className="text-xs font-mono" style={{ color: styles.textMuted }}>{payout.ibanMasked}</p>
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
              <span style={{ color: styles.textMuted }}>
                Showing {payouts.length} payouts
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded transition-colors disabled:opacity-40"
                    style={{ color: styles.textMuted }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = styles.bgHover)}
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
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = styles.bgHover)}
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
        <PayoutDetailsModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
          styles={styles}
        />
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
// Payout Details Modal
// =============================================================================

interface PayoutDetailsModalProps {
  payout: SellerPayout;
  onClose: () => void;
  styles: ReturnType<typeof usePortal>['styles'];
}

const PayoutDetailsModal: React.FC<PayoutDetailsModalProps> = ({ payout, onClose, styles }) => {
  const getStatusColor = (status: PayoutStatus) => {
    switch (status) {
      case 'settled': return { bg: 'rgba(34,197,94,0.1)', text: styles.success };
      case 'processing': return { bg: 'rgba(59,130,246,0.1)', text: styles.info };
      case 'pending': return { bg: 'rgba(234,179,8,0.1)', text: '#F59E0B' };
      case 'on_hold': return { bg: 'rgba(249,115,22,0.1)', text: '#F97316' };
      case 'failed': return { bg: 'rgba(239,68,68,0.1)', text: styles.error };
      default: return { bg: styles.bgSecondary, text: styles.textMuted };
    }
  };

  const statusColors = getStatusColor(payout.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden"
        style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Payout Details
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

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
                {payout.payoutNumber}
              </p>
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
              </p>
            </div>
            <span
              className="px-3 py-1 text-sm font-medium rounded-full"
              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
            >
              {PAYOUT_STATUS_LABELS[payout.status]}
            </span>
          </div>

          {/* Amount Breakdown */}
          <div className="rounded-lg p-4" style={{ backgroundColor: styles.bgSecondary }}>
            <h3 className="font-medium mb-3" style={{ color: styles.textPrimary }}>Amount Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: styles.textMuted }}>Gross Amount</span>
                <span style={{ color: styles.textPrimary }}>
                  {formatCurrency(payout.grossAmount, payout.currency)}
                </span>
              </div>
              <div className="flex justify-between" style={{ color: styles.error }}>
                <span>Platform Fee</span>
                <span>-{formatCurrency(payout.platformFeeTotal, payout.currency)}</span>
              </div>
              {payout.adjustments !== 0 && (
                <div className="flex justify-between">
                  <span style={{ color: styles.textMuted }}>Adjustments</span>
                  <span style={{ color: payout.adjustments >= 0 ? styles.success : styles.error }}>
                    {payout.adjustments >= 0 ? '+' : ''}{formatCurrency(payout.adjustments, payout.currency)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: styles.border }}>
                <span style={{ color: styles.textPrimary }}>Net Amount</span>
                <span style={{ color: styles.success }}>
                  {formatCurrency(payout.netAmount, payout.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="font-medium mb-3" style={{ color: styles.textPrimary }}>Bank Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm" style={{ color: styles.textMuted }}>Bank</p>
                <p style={{ color: styles.textPrimary }}>{payout.bankName}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: styles.textMuted }}>Account Holder</p>
                <p style={{ color: styles.textPrimary }}>{payout.accountHolder}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: styles.textMuted }}>IBAN</p>
                <p className="font-mono" style={{ color: styles.textPrimary }}>{payout.ibanMasked}</p>
              </div>
              {payout.bankReference && (
                <div>
                  <p className="text-sm" style={{ color: styles.textMuted }}>Bank Reference</p>
                  <p className="font-mono" style={{ color: styles.textPrimary }}>{payout.bankReference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-medium mb-3" style={{ color: styles.textPrimary }}>Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.success }} />
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  Created: {formatDate(payout.createdAt)}
                </p>
              </div>
              {payout.initiatedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.info }} />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    Initiated: {formatDate(payout.initiatedAt)}
                  </p>
                </div>
              )}
              {payout.settledAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.success }} />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    Settled: {formatDate(payout.settledAt)}
                  </p>
                </div>
              )}
              {payout.failedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.error }} />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    Failed: {formatDate(payout.failedAt)} - {payout.failureReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hold Info */}
          {payout.holdReason && (
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}
            >
              <div className="flex items-start gap-3">
                <Warning size={20} style={{ color: '#F97316' }} className="mt-0.5" />
                <div>
                  <p className="font-medium" style={{ color: '#F97316' }}>On Hold</p>
                  <p className="text-sm" style={{ color: '#ea580c' }}>{payout.holdReason}</p>
                  {payout.holdUntil && (
                    <p className="text-xs mt-1" style={{ color: '#F97316' }}>
                      Until: {formatDate(payout.holdUntil)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="flex justify-end gap-2 p-4 border-t"
          style={{ borderColor: styles.border }}
        >
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
                options={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => ({
                  value: String(idx),
                  label: day,
                }))}
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
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellerPayouts;
