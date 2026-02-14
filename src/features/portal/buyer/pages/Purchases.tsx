// =============================================================================
// Purchases Page - Completed buying activity from real marketplace orders
// =============================================================================
// Shows DELIVERED/COMPLETED orders with invoice + payment status.
// Data: /api/purchases/buyer/stats (KPIs) + /api/purchases/buyer (list)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  CheckCircle,
  Warning,
  CurrencyDollar,
  Spinner,
  Eye,
  Truck,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  X,
} from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { formatCurrency } from '../../utils';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { API_URL } from '../../../../config/api';

interface PurchasesProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

interface PurchaseStats {
  totalSpend: number;
  activeOrders: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
  critical: number;
  potentialSavings: number;
  currency: string;
}

interface Purchase {
  id: string;
  orderNumber: string;
  itemName: string;
  itemSku: string;
  sellerId: string;
  sellerName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: string;
  paymentStatus: string;
  healthStatus: string;
  createdAt: string;
  deliveredAt: string | null;
  paidAt: string | null;
  calculatedUrgency: string;
  savingsCategory: string;
  priceVariance: number | null;
}

function getLifecycleStep(purchase: Purchase): number {
  if (purchase.paymentStatus === 'paid') return 4;
  if (purchase.status === 'delivered') return 3;
  if (purchase.status === 'shipped') return 2;
  if (['confirmed', 'in_progress'].includes(purchase.status)) return 1;
  return 0;
}

// Status badge component
const StatusBadge: React.FC<{ status: string; styles: ReturnType<typeof usePortal>['styles'] }> = ({
  status,
  styles,
}) => {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    delivered: { color: styles.success, bg: `${styles.success}15`, label: 'Delivered' },
    shipped: { color: styles.info, bg: `${styles.info}15`, label: 'In Transit' },
    confirmed: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Confirmed' },
    in_progress: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Processing' },
    pending_confirmation: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending' },
    cancelled: { color: styles.error, bg: `${styles.error}15`, label: 'Cancelled' },
  };
  const c = config[status] || { color: styles.textMuted, bg: styles.bgSecondary, label: status };
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
};

const PaymentBadge: React.FC<{ paymentStatus: string; styles: ReturnType<typeof usePortal>['styles'] }> = ({
  paymentStatus,
  styles,
}) => {
  const isPaid = paymentStatus === 'paid';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: isPaid ? `${styles.success}15` : 'rgba(245,158,11,0.1)',
        color: isPaid ? styles.success : '#f59e0b',
      }}
    >
      {isPaid ? 'Paid' : 'Unpaid'}
    </span>
  );
};

// Lifecycle timeline mini-component
const LifecycleTimeline: React.FC<{ step: number; styles: ReturnType<typeof usePortal>['styles'] }> = ({
  step,
  styles,
}) => {
  const labels = ['Order', 'Confirm', 'Ship', 'Deliver', 'Paid'];
  return (
    <div className="flex items-center gap-0.5">
      {labels.map((label, idx) => {
        const isComplete = idx <= step;
        const isCurrent = idx === step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isComplete ? styles.success : styles.bgHover,
                  boxShadow: isCurrent ? `0 0 0 2px ${styles.success}40` : 'none',
                }}
              />
              <span
                className="text-[8px] mt-0.5"
                style={{ color: isComplete ? styles.textSecondary : styles.textMuted }}
              >
                {label}
              </span>
            </div>
            {idx < labels.length - 1 && (
              <div
                className="h-px flex-1 mt-[-8px]"
                style={{ backgroundColor: idx < step ? styles.success : styles.bgHover }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Purchases: React.FC<PurchasesProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const [statsRes, purchasesRes] = await Promise.all([
        fetch(`${API_URL}/purchases/buyer/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/purchases/buyer`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch purchase stats');
      if (!purchasesRes.ok) throw new Error('Failed to fetch purchases');

      const [statsData, purchasesData] = await Promise.all([statsRes.json(), purchasesRes.json()]);

      setStats(statsData);
      setPurchases(purchasesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setStats({
        totalSpend: 0,
        activeOrders: 0,
        onTrack: 0,
        atRisk: 0,
        delayed: 0,
        critical: 0,
        potentialSavings: 0,
        currency: 'SAR',
      });
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter purchases
  const filteredPurchases = purchases.filter((p) => {
    if (statusFilter === 'delivered' && p.status !== 'delivered') return false;
    if (statusFilter === 'paid' && p.paymentStatus !== 'paid') return false;
    if (statusFilter === 'unpaid' && p.paymentStatus === 'paid') return false;
    if (statusFilter === 'active' && ['delivered', 'cancelled', 'failed', 'refunded'].includes(p.status)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.orderNumber.toLowerCase().includes(q) ||
        p.itemName.toLowerCase().includes(q) ||
        (p.sellerName || '').toLowerCase().includes(q) ||
        (p.itemSku || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPurchases.length / pageSize);
  const paginatedPurchases = filteredPurchases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('buyer.purchases.title') || 'My Purchases'}
          subtitle={t('buyer.purchases.subtitle') || 'Track and manage your buying activity'}
          actions={
            <Button onClick={() => onNavigate('marketplace')} variant="primary">
              <Package size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
              {t('buyer.purchases.browseMarketplace') || 'Browse Marketplace'}
            </Button>
          }
        />

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} className="animate-spin" style={{ color: styles.textMuted }} />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div
            className="rounded-lg p-6 border text-center mb-6"
            style={{ backgroundColor: `${styles.error}10`, borderColor: `${styles.error}30` }}
          >
            <p className="font-medium mb-2" style={{ color: styles.error }}>
              {error}
            </p>
            <Button variant="secondary" onClick={fetchData}>
              {t('common.retry') || 'Try Again'}
            </Button>
          </div>
        )}

        {/* Content */}
        {!isLoading && stats && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <KPICard
                id="totalSpend"
                label={t('buyer.purchases.totalSpend') || 'Total Spend'}
                value={formatCurrency(stats.totalSpend, stats.currency)}
                change=""
                trend="neutral"
                icon={<CurrencyDollar size={18} />}
                color="blue"
              />
              <KPICard
                id="activeOrders"
                label={t('buyer.purchases.activeOrders') || 'Active Orders'}
                value={stats.activeOrders.toString()}
                change=""
                trend="neutral"
                icon={<Truck size={18} />}
                color="blue"
              />
              <KPICard
                id="onTrack"
                label={t('buyer.purchases.onTrack') || 'On Track'}
                value={stats.onTrack.toString()}
                change=""
                trend="neutral"
                icon={<CheckCircle size={18} />}
                color="emerald"
              />
              <KPICard
                id="atRisk"
                label={t('buyer.purchases.atRisk') || 'Needs Attention'}
                value={(stats.atRisk + stats.delayed + stats.critical).toString()}
                change=""
                trend="neutral"
                icon={<Warning size={18} />}
                color="amber"
              />
            </div>

            {/* Filters */}
            <div
              className="flex flex-wrap items-center gap-3 p-3 mb-4 rounded-lg border"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border flex-1 max-w-xs"
                style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
              >
                <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
                <input
                  type="text"
                  placeholder="Search orders, items, suppliers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm flex-1"
                  style={{ color: styles.textPrimary }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ color: styles.textMuted }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status filter chips */}
              {['all', 'active', 'delivered', 'paid', 'unpaid'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: statusFilter === filter ? styles.textPrimary : 'transparent',
                    color: statusFilter === filter ? styles.bgPrimary : styles.textSecondary,
                    border: `1px solid ${statusFilter === filter ? styles.textPrimary : styles.border}`,
                  }}
                >
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Purchases Table */}
            {filteredPurchases.length === 0 ? (
              <EmptyState
                icon={Package}
                title={t('buyer.purchases.noPurchases') || 'No purchases yet'}
                description={
                  search || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : t('buyer.purchases.noPurchasesDesc') || 'Browse the marketplace to start purchasing'
                }
                action={
                  !search && statusFilter === 'all' ? (
                    <Button onClick={() => onNavigate('marketplace')}>
                      {t('buyer.purchases.browseMarketplace') || 'Browse Marketplace'}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border" style={{ borderColor: styles.border }}>
                  <table className="min-w-full">
                    <thead style={{ backgroundColor: styles.bgSecondary }}>
                      <tr>
                        <th
                          className="px-4 py-3 text-xs font-semibold"
                          style={{ color: styles.textSecondary, textAlign: isRtl ? 'right' : 'left' }}
                        >
                          Order
                        </th>
                        <th
                          className="px-4 py-3 text-xs font-semibold"
                          style={{ color: styles.textSecondary, textAlign: isRtl ? 'right' : 'left' }}
                        >
                          Item
                        </th>
                        <th
                          className="px-4 py-3 text-xs font-semibold text-center"
                          style={{ color: styles.textSecondary }}
                        >
                          Status
                        </th>
                        <th
                          className="px-4 py-3 text-xs font-semibold text-center"
                          style={{ color: styles.textSecondary }}
                        >
                          Payment
                        </th>
                        <th
                          className="px-4 py-3 text-xs font-semibold"
                          style={{ color: styles.textSecondary, textAlign: 'right' }}
                        >
                          Amount
                        </th>
                        <th
                          className="px-4 py-3 text-xs font-semibold"
                          style={{ color: styles.textSecondary, textAlign: isRtl ? 'right' : 'left' }}
                        >
                          Lifecycle
                        </th>
                        <th
                          className="px-4 py-3 text-xs font-semibold text-center"
                          style={{ color: styles.textSecondary }}
                        >
                          Date
                        </th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: styles.bgCard }}>
                      {paginatedPurchases.map((purchase, idx) => {
                        const step = getLifecycleStep(purchase);
                        return (
                          <tr
                            key={purchase.id}
                            className="transition-colors cursor-pointer"
                            style={{ borderTop: idx > 0 ? `1px solid ${styles.border}` : undefined }}
                            onClick={() => onNavigate('workspace', { tab: 'orders', orderId: purchase.id })}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono font-medium" style={{ color: styles.textPrimary }}>
                                {purchase.orderNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p
                                  className="text-sm font-medium truncate max-w-[200px]"
                                  style={{ color: styles.textPrimary }}
                                >
                                  {purchase.itemName}
                                </p>
                                <p className="text-xs" style={{ color: styles.textMuted }}>
                                  Qty: {purchase.quantity} × {formatCurrency(purchase.unitPrice, purchase.currency)}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={purchase.status} styles={styles} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <PaymentBadge paymentStatus={purchase.paymentStatus} styles={styles} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                                {formatCurrency(purchase.totalPrice, purchase.currency)}
                              </span>
                            </td>
                            <td className="px-4 py-3 min-w-[140px]">
                              <LifecycleTimeline step={step} styles={styles} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs" style={{ color: styles.textMuted }}>
                                {formatDate(purchase.deliveredAt || purchase.createdAt)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Eye size={16} style={{ color: styles.textMuted }} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-between mt-4 px-4 py-3 rounded-lg border"
                    style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
                  >
                    <span className="text-sm" style={{ color: styles.textMuted }}>
                      Showing {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, filteredPurchases.length)} of {filteredPurchases.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                        style={{ color: styles.textMuted }}
                      >
                        {isRtl ? <CaretRight size={18} /> : <CaretLeft size={18} />}
                      </button>
                      <span className="text-sm px-3" style={{ color: styles.textPrimary }}>
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                        style={{ color: styles.textMuted }}
                      >
                        {isRtl ? <CaretLeft size={18} /> : <CaretRight size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default Purchases;
