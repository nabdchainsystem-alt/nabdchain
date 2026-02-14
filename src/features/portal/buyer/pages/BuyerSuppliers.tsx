// =============================================================================
// Buyer Suppliers Page - Derived from marketplace order history
// =============================================================================
// Suppliers appear ONLY if the buyer has at least 1 order with them.
// Data derived from /api/purchases/buyer/suppliers (real marketplace orders).
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { featureLogger } from '../../../../utils/logger';
import {
  Buildings,
  MagnifyingGlass,
  X,
  CaretLeft,
  CaretRight,
  Star,
  Package,
  CurrencyDollar,
  UsersFour,
  Spinner as SpinnerIcon,
  Truck,
  WarningCircle,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { API_URL } from '../../../../config/api';
import { Container, PageHeader, Button, EmptyState } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { formatCurrency } from '../../utils';

interface BuyerSuppliersProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

interface DerivedSupplier {
  sellerId: string;
  sellerName: string;
  totalOrders: number;
  totalSpend: number;
  avgOrderValue: number;
  currency: string;
  onTimeDeliveryRate: number;
  avgDeliveryDays: number | null;
  qualityScore: number;
  openDisputes: number;
  firstOrderDate: string;
  lastOrderDate: string;
  orderStatuses: Record<string, number>;
}

interface SupplierStats {
  totalSuppliers: number;
  totalSpend: number;
  totalOrders: number;
  avgOnTimeDelivery: number;
  openDisputes: number;
  currency: string;
}

export const BuyerSuppliers: React.FC<BuyerSuppliersProps> = ({ onNavigate }) => {
  const { styles, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  const [suppliers, setSuppliers] = useState<DerivedSupplier[]>([]);
  const [supplierStats, setSupplierStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const pageSize = 15;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) {
          setError('Authentication required');
          return;
        }

        const [suppliersRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/purchases/buyer/suppliers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/purchases/buyer/suppliers/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!suppliersRes.ok) throw new Error('Failed to load suppliers');
        if (!statsRes.ok) throw new Error('Failed to load stats');

        const [suppliersData, statsData] = await Promise.all([suppliersRes.json(), statsRes.json()]);

        setSuppliers(suppliersData);
        setSupplierStats(statsData);
      } catch (err) {
        featureLogger.error('Failed to load suppliers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [getToken]);

  // Filter suppliers by search
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    const query = searchQuery.toLowerCase();
    return suppliers.filter((s) => s.sellerName.toLowerCase().includes(query));
  }, [suppliers, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getQualityColor = (score: number) => {
    if (score >= 4) return styles.success;
    if (score >= 3) return '#f59e0b';
    return styles.error;
  };

  const getOnTimeColor = (rate: number) => {
    if (rate >= 90) return styles.success;
    if (rate >= 70) return '#f59e0b';
    return styles.error;
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title="My Suppliers"
          subtitle="Performance metrics from your actual order history"
          actions={
            <Button onClick={() => onNavigate('marketplace')} variant="primary">
              <Buildings size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
              Find New Suppliers
            </Button>
          }
        />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <SpinnerIcon size={32} className="animate-spin" style={{ color: styles.textMuted }} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className="rounded-lg p-6 border text-center mb-6"
            style={{ backgroundColor: `${styles.error}10`, borderColor: `${styles.error}30` }}
          >
            <p className="font-medium mb-2" style={{ color: styles.error }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Stats */}
            {supplierStats && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <KPICard
                  id="totalSuppliers"
                  label="Suppliers"
                  value={supplierStats.totalSuppliers.toString()}
                  change=""
                  trend="neutral"
                  icon={<UsersFour size={18} />}
                  color="blue"
                />
                <KPICard
                  id="totalOrders"
                  label="Total Orders"
                  value={supplierStats.totalOrders.toString()}
                  change=""
                  trend="neutral"
                  icon={<Package size={18} />}
                  color="blue"
                />
                <KPICard
                  id="totalSpend"
                  label="Total Spend"
                  value={formatCurrency(supplierStats.totalSpend, supplierStats.currency)}
                  change=""
                  trend="neutral"
                  icon={<CurrencyDollar size={18} />}
                  color="emerald"
                />
                <KPICard
                  id="avgOnTime"
                  label="Avg On-Time"
                  value={`${supplierStats.avgOnTimeDelivery}%`}
                  change=""
                  trend="neutral"
                  icon={<Truck size={18} />}
                  color="emerald"
                />
                <KPICard
                  id="disputes"
                  label="Open Disputes"
                  value={supplierStats.openDisputes.toString()}
                  change=""
                  trend="neutral"
                  icon={<WarningCircle size={18} />}
                  color={supplierStats.openDisputes > 0 ? 'red' : 'emerald'}
                />
              </div>
            )}

            {/* Search */}
            <div
              className="flex items-center gap-3 p-3 mb-4 rounded-lg border"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border flex-1 max-w-xs"
                style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
              >
                <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm flex-1"
                  style={{ color: styles.textPrimary }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ color: styles.textMuted }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <span className="text-sm" style={{ color: styles.textMuted }}>
                {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Supplier List */}
            {filteredSuppliers.length === 0 ? (
              <EmptyState
                icon={Buildings}
                title="No suppliers yet"
                description={
                  searchQuery
                    ? 'No suppliers match your search'
                    : 'Place orders on the marketplace to see your suppliers here'
                }
                action={
                  !searchQuery ? (
                    <Button onClick={() => onNavigate('marketplace')}>Browse Marketplace</Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                {/* Supplier Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedSuppliers.map((supplier) => (
                    <div
                      key={supplier.sellerId}
                      className="rounded-xl border p-5 transition-all cursor-pointer group"
                      style={{
                        backgroundColor: selectedSupplierId === supplier.sellerId ? styles.bgSecondary : styles.bgCard,
                        borderColor: selectedSupplierId === supplier.sellerId ? styles.textMuted : styles.border,
                      }}
                      onClick={() =>
                        setSelectedSupplierId(selectedSupplierId === supplier.sellerId ? null : supplier.sellerId)
                      }
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                            {supplier.sellerName}
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                            Since {formatDate(supplier.firstOrderDate)}
                          </p>
                        </div>
                        {supplier.openDisputes > 0 && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{ backgroundColor: `${styles.error}15`, color: styles.error }}
                          >
                            {supplier.openDisputes} dispute{supplier.openDisputes > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-wider font-medium"
                            style={{ color: styles.textMuted }}
                          >
                            Orders
                          </p>
                          <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                            {supplier.totalOrders}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-wider font-medium"
                            style={{ color: styles.textMuted }}
                          >
                            On-Time
                          </p>
                          <p
                            className="text-lg font-bold"
                            style={{ color: getOnTimeColor(supplier.onTimeDeliveryRate) }}
                          >
                            {supplier.onTimeDeliveryRate}%
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-wider font-medium"
                            style={{ color: styles.textMuted }}
                          >
                            Quality
                          </p>
                          <div className="flex items-center gap-1">
                            <Star size={14} weight="fill" style={{ color: getQualityColor(supplier.qualityScore) }} />
                            <span className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                              {supplier.qualityScore}
                            </span>
                            <span className="text-xs" style={{ color: styles.textMuted }}>
                              /5
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Spend + Delivery */}
                      <div
                        className="flex items-center justify-between pt-3"
                        style={{ borderTop: `1px solid ${styles.border}` }}
                      >
                        <div>
                          <span className="text-xs" style={{ color: styles.textMuted }}>
                            Total Spend
                          </span>
                          <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                            {formatCurrency(supplier.totalSpend, supplier.currency)}
                          </p>
                        </div>
                        <div className={isRtl ? 'text-left' : 'text-right'}>
                          <span className="text-xs" style={{ color: styles.textMuted }}>
                            Avg Delivery
                          </span>
                          <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                            {supplier.avgDeliveryDays !== null ? `${supplier.avgDeliveryDays}d` : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions - Visible on hover */}
                      <div
                        className="flex items-center gap-2 mt-3 pt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ borderTop: `1px solid ${styles.border}` }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onNavigate('purchases', { sellerId: supplier.sellerId })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: styles.bgSecondary,
                            border: `1px solid ${styles.border}`,
                            color: styles.textSecondary,
                          }}
                        >
                          <Package size={12} />
                          View Orders
                        </button>
                        <button
                          onClick={() => onNavigate('disputes', { sellerId: supplier.sellerId })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: styles.bgSecondary,
                            border: `1px solid ${styles.border}`,
                            color: styles.textSecondary,
                          }}
                        >
                          <WarningCircle size={12} />
                          Disputes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-between mt-6 px-4 py-3 rounded-lg border"
                    style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
                  >
                    <span className="text-sm" style={{ color: styles.textMuted }}>
                      Showing {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, filteredSuppliers.length)} of {filteredSuppliers.length}
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

export default BuyerSuppliers;
