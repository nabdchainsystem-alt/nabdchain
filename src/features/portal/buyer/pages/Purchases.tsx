// =============================================================================
// Purchases Page - Intelligent Purchase Management
// =============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import {
  Package,
  CaretDown,
  CaretUp,
  Eye,
  CaretLeft,
  CaretRight,
  Truck,
  CheckCircle,
  Warning,
  WarningCircle,
  TrendUp,
  TrendDown,
  Minus,
  Clock,
  CurrencyDollar,
  Lightning,
} from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import {
  Purchase,
  PurchaseStats,
  SmartFilters as SmartFiltersType,
  defaultSmartFilters,
  PriceComparison,
  BuyerSupplierMetrics,
  PurchaseTimelineEvent,
  getUrgencyColor,
  getSavingsColor,
  formatVariance,
} from '../../types/purchase.types';
import { getOrderStatusConfig, getHealthStatusConfig } from '../../types/order.types';
import SmartFilters from './components/SmartFilters';
import PurchaseDetailsPanel from './components/PurchaseDetailsPanel';
import { Snackbar, useSnackbar } from './components/Snackbar';

interface PurchasesProps {
  onNavigate: (page: string) => void;
}

// =============================================================================
// Mock Data (would come from API in production)
// =============================================================================

const MOCK_PURCHASES: Purchase[] = [
  {
    id: 'purch-1',
    orderNumber: 'ORD-2025-0156',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    buyerName: 'HydroTech Solutions',
    itemId: 'item-1',
    itemName: 'Industrial Hydraulic Pump',
    itemSku: 'HYD-PUMP-001',
    quantity: 5,
    unitPrice: 2350,
    totalPrice: 11750,
    currency: 'SAR',
    status: 'shipped',
    paymentStatus: 'paid',
    fulfillmentStatus: 'out_for_delivery',
    source: 'rfq',
    healthStatus: 'on_track',
    healthScore: 85,
    historicalAvgPrice: 2400,
    priceVariance: -2.1,
    priceTrend: 'down',
    supplierOnTimeRate: 94,
    supplierQualityScore: 4.5,
    supplierTotalOrders: 12,
    buyerUrgencyScore: 35,
    calculatedUrgency: 'low',
    savingsCategory: 'good_deal',
    trackingNumber: 'SA123456789',
    carrier: 'Aramex',
    estimatedDelivery: '2025-01-28',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-20T14:00:00Z',
    auditLog: [],
  },
  {
    id: 'purch-2',
    orderNumber: 'ORD-2025-0157',
    buyerId: 'buyer-1',
    sellerId: 'seller-2',
    buyerName: 'SKF Authorized Dealer',
    itemId: 'item-2',
    itemName: 'Steel Bearings Set',
    itemSku: 'BRG-STL-100',
    quantity: 100,
    unitPrice: 45,
    totalPrice: 4500,
    currency: 'SAR',
    status: 'delivered',
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    source: 'direct_buy',
    healthStatus: 'on_track',
    healthScore: 100,
    historicalAvgPrice: 42,
    priceVariance: 7.1,
    priceTrend: 'up',
    supplierOnTimeRate: 98,
    supplierQualityScore: 4.8,
    supplierTotalOrders: 25,
    buyerUrgencyScore: 0,
    calculatedUrgency: 'low',
    savingsCategory: 'overpaying',
    createdAt: '2025-01-10T09:15:00Z',
    updatedAt: '2025-01-18T11:30:00Z',
    auditLog: [],
  },
  {
    id: 'purch-3',
    orderNumber: 'ORD-2025-0158',
    buyerId: 'buyer-1',
    sellerId: 'seller-3',
    buyerName: 'Atlas Copco MENA',
    itemId: 'item-3',
    itemName: 'Air Compressor Unit',
    itemSku: 'CMP-AIR-500',
    quantity: 2,
    unitPrice: 8250,
    totalPrice: 16500,
    currency: 'SAR',
    status: 'in_progress',
    paymentStatus: 'paid',
    fulfillmentStatus: 'packing',
    source: 'rfq',
    healthStatus: 'at_risk',
    healthScore: 65,
    historicalAvgPrice: 8100,
    priceVariance: 1.9,
    priceTrend: 'stable',
    supplierOnTimeRate: 85,
    supplierQualityScore: 4.2,
    supplierTotalOrders: 8,
    buyerUrgencyScore: 72,
    calculatedUrgency: 'high',
    savingsCategory: 'average',
    estimatedDelivery: '2025-01-30',
    createdAt: '2025-01-18T11:20:00Z',
    updatedAt: '2025-01-19T09:00:00Z',
    auditLog: [],
  },
  {
    id: 'purch-4',
    orderNumber: 'ORD-2025-0159',
    buyerId: 'buyer-1',
    sellerId: 'seller-4',
    buyerName: 'Siemens Industrial',
    itemId: 'item-4',
    itemName: 'Electric Motor 15KW',
    itemSku: 'MTR-ELC-15K',
    quantity: 3,
    unitPrice: 3200,
    totalPrice: 9600,
    currency: 'SAR',
    status: 'confirmed',
    paymentStatus: 'authorized',
    fulfillmentStatus: 'not_started',
    source: 'direct_buy',
    healthStatus: 'on_track',
    healthScore: 90,
    supplierOnTimeRate: 99,
    supplierQualityScore: 4.9,
    supplierTotalOrders: 5,
    buyerUrgencyScore: 25,
    calculatedUrgency: 'low',
    savingsCategory: 'average',
    estimatedDelivery: '2025-02-05',
    createdAt: '2025-01-20T08:45:00Z',
    updatedAt: '2025-01-20T15:00:00Z',
    auditLog: [],
  },
  {
    id: 'purch-5',
    orderNumber: 'ORD-2025-0160',
    buyerId: 'buyer-1',
    sellerId: 'seller-5',
    buyerName: 'FlowControl Systems',
    itemId: 'item-5',
    itemName: 'Valve Assembly Kit',
    itemSku: 'VLV-KIT-200',
    quantity: 25,
    unitPrice: 180,
    totalPrice: 4500,
    currency: 'SAR',
    status: 'pending_confirmation',
    paymentStatus: 'unpaid',
    fulfillmentStatus: 'not_started',
    source: 'rfq',
    healthStatus: 'delayed',
    healthScore: 40,
    hasException: true,
    exceptionType: 'late_confirmation',
    exceptionMessage: 'Seller has not confirmed order within SLA',
    historicalAvgPrice: 175,
    priceVariance: 2.9,
    priceTrend: 'up',
    supplierOnTimeRate: 72,
    supplierQualityScore: 3.5,
    supplierTotalOrders: 3,
    buyerUrgencyScore: 88,
    calculatedUrgency: 'critical',
    savingsCategory: 'average',
    createdAt: '2025-01-21T14:00:00Z',
    updatedAt: '2025-01-21T14:00:00Z',
    auditLog: [],
  },
];

const MOCK_STATS: PurchaseStats = {
  totalSpend: 46850,
  activeOrders: 4,
  onTrack: 2,
  atRisk: 1,
  delayed: 1,
  critical: 0,
  potentialSavings: 320,
  currency: 'SAR',
};

// =============================================================================
// Helper Components
// =============================================================================

const TrendIndicator: React.FC<{ trend?: string | null; variance?: number | null }> = ({ trend, variance }) => {
  const { styles } = usePortal();
  if (!trend || variance === null || variance === undefined) return null;

  const color = trend === 'up' ? styles.error : trend === 'down' ? styles.success : styles.textMuted;
  const Icon = trend === 'up' ? TrendUp : trend === 'down' ? TrendDown : Minus;

  return (
    <span className="inline-flex items-center gap-0.5 text-xs" style={{ color }}>
      <Icon size={12} weight="bold" />
      {formatVariance(variance)}
    </span>
  );
};

const UrgencyBar: React.FC<{ score?: number | null }> = ({ score }) => {
  const { styles } = usePortal();
  if (score === null || score === undefined) return null;

  const color = score >= 80 ? styles.error : score >= 60 ? '#f59e0b' : score >= 40 ? styles.info : styles.success;

  return (
    <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
  highlight?: boolean;
}> = ({ label, value, icon: Icon, color, highlight }) => {
  const { styles } = usePortal();

  return (
    <div
      className="p-3 rounded-lg border transition-all"
      style={{
        backgroundColor: highlight ? `${color}10` : styles.bgCard,
        borderColor: highlight ? `${color}40` : styles.border,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color ? `${color}15` : styles.bgSecondary }}
        >
          <Icon size={16} style={{ color: color || styles.textMuted }} weight={highlight ? 'fill' : 'regular'} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] truncate" style={{ color: styles.textMuted }}>
            {label}
          </div>
          <div className="text-base font-semibold" style={{ color: highlight ? color : styles.textPrimary }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const Purchases: React.FC<PurchasesProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // State
  const [purchases] = useState<Purchase[]>(MOCK_PURCHASES);
  const [stats] = useState<PurchaseStats>(MOCK_STATS);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [filters, setFilters] = useState<SmartFiltersType>(defaultSmartFilters);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Filter data
  const filteredData = useMemo(() => {
    return purchases.filter((purchase) => {
      if (filters.status !== 'all' && purchase.status !== filters.status) return false;
      if (filters.risk !== 'all' && purchase.healthStatus !== filters.risk) return false;
      if (filters.urgency !== 'all' && purchase.calculatedUrgency !== filters.urgency) return false;
      if (filters.savings !== 'all' && purchase.savingsCategory !== filters.savings) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (
          !purchase.orderNumber.toLowerCase().includes(search) &&
          !purchase.itemName.toLowerCase().includes(search) &&
          !purchase.itemSku.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [purchases, filters]);

  // Open purchase details
  const openDetails = useCallback((purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowPanel(true);
  }, []);

  // Report issue handler
  const handleReportIssue = useCallback((purchase: Purchase) => {
    setShowPanel(false);
    showSnackbar(`Issue reported for ${purchase.orderNumber}`, 'success');
  }, [showSnackbar]);

  // Format helpers
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: t('buyer.purchases.allStatus') || 'All Status' },
    { value: 'pending_confirmation', label: t('buyer.purchases.pending') || 'Pending' },
    { value: 'confirmed', label: t('buyer.purchases.confirmed') || 'Confirmed' },
    { value: 'in_progress', label: t('buyer.purchases.inProgress') || 'In Progress' },
    { value: 'shipped', label: t('buyer.purchases.shipped') || 'Shipped' },
    { value: 'delivered', label: t('buyer.purchases.delivered') || 'Delivered' },
    { value: 'cancelled', label: t('buyer.purchases.cancelled') || 'Cancelled' },
  ];

  // Column helper
  const columnHelper = createColumnHelper<Purchase>();

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('orderNumber', {
        header: t('buyer.purchases.orderNumber') || 'Order #',
        cell: (info) => (
          <span className="font-mono text-xs" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('itemName', {
        header: t('buyer.purchases.item') || 'Item',
        cell: (info) => {
          const purchase = info.row.original;
          return (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  {info.getValue()}
                </span>
                {purchase.hasException && (
                  <WarningCircle size={14} weight="fill" style={{ color: styles.error }} />
                )}
              </div>
              <div className="text-xs font-mono" style={{ color: styles.textMuted }}>
                {purchase.itemSku}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('buyerName', {
        header: t('buyer.purchases.supplier') || 'Supplier',
        cell: (info) => {
          const purchase = info.row.original;
          return (
            <div>
              <span className="text-sm" style={{ color: styles.textPrimary }}>
                {info.getValue()}
              </span>
              {purchase.supplierOnTimeRate && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div
                    className="h-1 w-10 rounded-full overflow-hidden"
                    style={{ backgroundColor: styles.bgSecondary }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${purchase.supplierOnTimeRate}%`,
                        backgroundColor:
                          purchase.supplierOnTimeRate >= 90
                            ? styles.success
                            : purchase.supplierOnTimeRate >= 70
                            ? '#f59e0b'
                            : styles.error,
                      }}
                    />
                  </div>
                  <span className="text-[10px]" style={{ color: styles.textMuted }}>
                    {purchase.supplierOnTimeRate}%
                  </span>
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('quantity', {
        header: t('buyer.purchases.qty') || 'Qty',
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('unitPrice', {
        header: t('buyer.purchases.price') || 'Price',
        cell: (info) => {
          const purchase = info.row.original;
          return (
            <div>
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {formatCurrency(info.getValue(), purchase.currency)}
              </span>
              <div className="mt-0.5">
                <TrendIndicator trend={purchase.priceTrend} variance={purchase.priceVariance} />
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: t('buyer.purchases.status') || 'Status',
        cell: (info) => {
          const config = getOrderStatusConfig(info.getValue());
          const colorMap: Record<string, string> = {
            warning: '#f59e0b',
            info: styles.info,
            primary: styles.info,
            success: styles.success,
            error: styles.error,
            muted: styles.textMuted,
          };
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${colorMap[config.color] || styles.info}15`,
                color: colorMap[config.color] || styles.info,
              }}
            >
              {config.label}
            </span>
          );
        },
      }),
      columnHelper.accessor('healthStatus', {
        header: t('buyer.purchases.health') || 'Health',
        cell: (info) => {
          const config = getHealthStatusConfig(info.getValue() || 'on_track');
          const colorMap: Record<string, string> = {
            success: styles.success,
            warning: '#f59e0b',
            error: styles.error,
          };
          return (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: `${colorMap[config.color]}15`,
                color: colorMap[config.color],
              }}
            >
              {config.label}
            </span>
          );
        },
      }),
      columnHelper.accessor('buyerUrgencyScore', {
        header: t('buyer.purchases.urgency') || 'Urgency',
        cell: (info) => <UrgencyBar score={info.getValue()} />,
      }),
      columnHelper.accessor('createdAt', {
        header: t('buyer.purchases.date') || 'Date',
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textMuted }}>
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="w-full text-center block">{t('common.actions') || 'Actions'}</span>,
        cell: (info) => {
          const purchase = info.row.original;
          const canTrack = purchase.status === 'shipped' && purchase.trackingNumber;

          return (
            <div className="flex items-center justify-center gap-1">
              {canTrack && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetails(purchase);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: styles.isDark ? '#1e3a5f' : '#dbeafe',
                    color: styles.info,
                  }}
                >
                  <Truck size={12} />
                  {t('buyer.purchases.track') || 'Track'}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetails(purchase);
                }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Eye size={16} />
              </button>
            </div>
          );
        },
      }),
    ],
    [columnHelper, styles, t, openDetails]
  );

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('buyer.purchases.title') || 'My Purchases'}
          subtitle={t('buyer.purchases.subtitle') || 'Track and manage your purchase orders with intelligent insights'}
          actions={
            <Button onClick={() => onNavigate('marketplace')} variant="secondary">
              <Package size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
              {t('buyer.purchases.browseMarketplace') || 'Browse Marketplace'}
            </Button>
          }
        />

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard
            label={t('buyer.purchases.totalSpend') || 'Total Spend'}
            value={formatCurrency(stats.totalSpend, stats.currency)}
            icon={CurrencyDollar}
            color={styles.info}
          />
          <StatCard
            label={t('buyer.purchases.activeOrders') || 'Active Orders'}
            value={stats.activeOrders.toString()}
            icon={Package}
            color={styles.info}
          />
          <StatCard
            label={t('buyer.purchases.onTrack') || 'On Track'}
            value={stats.onTrack.toString()}
            icon={CheckCircle}
            color={styles.success}
          />
          <StatCard
            label={t('buyer.purchases.atRisk') || 'At Risk'}
            value={stats.atRisk.toString()}
            icon={Warning}
            color="#f59e0b"
            highlight={stats.atRisk > 0}
          />
          <StatCard
            label={t('buyer.purchases.delayed') || 'Delayed'}
            value={stats.delayed.toString()}
            icon={Clock}
            color={styles.error}
            highlight={stats.delayed > 0}
          />
          <StatCard
            label={t('buyer.purchases.potentialSavings') || 'Potential Savings'}
            value={formatCurrency(stats.potentialSavings, stats.currency)}
            icon={Lightning}
            color={styles.success}
          />
        </div>

        {/* Smart Filters */}
        <div className="mb-6">
          <SmartFilters filters={filters} onFiltersChange={setFilters} statusOptions={statusOptions} />
        </div>

        {/* Table */}
        {filteredData.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('buyer.purchases.noOrders') || 'No purchases found'}
            description={t('buyer.purchases.noOrdersDesc') || 'Adjust your filters or browse the marketplace'}
            action={
              <Button onClick={() => onNavigate('marketplace')}>
                {t('buyer.purchases.browseMarketplace') || 'Browse Marketplace'}
              </Button>
            }
          />
        ) : (
          <div>
            <div className="overflow-hidden rounded-lg border" style={{ borderColor: styles.border }}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ backgroundColor: styles.bgSecondary }}>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-xs font-semibold cursor-pointer select-none"
                            style={{ color: styles.textSecondary, textAlign: isRtl ? 'right' : 'left' }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() &&
                                (header.column.getIsSorted() === 'asc' ? (
                                  <CaretUp size={12} />
                                ) : (
                                  <CaretDown size={12} />
                                ))}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody style={{ backgroundColor: styles.bgCard }}>
                    {table.getRowModel().rows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="transition-colors cursor-pointer"
                        style={{
                          borderTop: idx > 0 ? `1px solid ${styles.border}` : undefined,
                        }}
                        onClick={() => openDetails(row.original)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div
              className="flex items-center justify-between px-4 py-3 mt-4 rounded-lg border"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              <div className="text-sm" style={{ color: styles.textMuted }}>
                {t('common.showing') || 'Showing'}{' '}
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredData.length
                )}{' '}
                {t('common.of') || 'of'} {filteredData.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                  style={{ color: styles.textMuted }}
                >
                  {isRtl ? <CaretRight size={18} /> : <CaretLeft size={18} />}
                </button>
                <span className="text-sm px-3" style={{ color: styles.textPrimary }}>
                  {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                  style={{ color: styles.textMuted }}
                >
                  {isRtl ? <CaretLeft size={18} /> : <CaretRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Details Panel */}
        <PurchaseDetailsPanel
          purchase={selectedPurchase}
          isOpen={showPanel}
          onClose={() => {
            setShowPanel(false);
            setSelectedPurchase(null);
          }}
          onReportIssue={handleReportIssue}
          timeline={[
            {
              id: 'created',
              state: 'created',
              label: 'Order Placed',
              actualDate: selectedPurchase?.createdAt,
              isCompleted: true,
              isCurrent: selectedPurchase?.status === 'pending_confirmation',
              isDelayed: false,
            },
            {
              id: 'confirmed',
              state: 'confirmed',
              label: 'Confirmed',
              actualDate: selectedPurchase?.confirmedAt,
              expectedDate: undefined,
              isCompleted: ['confirmed', 'in_progress', 'shipped', 'delivered'].includes(selectedPurchase?.status || ''),
              isCurrent: selectedPurchase?.status === 'confirmed',
              isDelayed: selectedPurchase?.status === 'pending_confirmation' && (selectedPurchase?.hasException || false),
              delayDays: selectedPurchase?.hasException ? 2 : undefined,
            },
            {
              id: 'shipped',
              state: 'shipped',
              label: 'Shipped',
              actualDate: selectedPurchase?.shippedAt,
              isCompleted: ['shipped', 'delivered'].includes(selectedPurchase?.status || ''),
              isCurrent: selectedPurchase?.status === 'shipped',
              isDelayed: false,
            },
            {
              id: 'delivered',
              state: 'delivered',
              label: 'Delivered',
              actualDate: selectedPurchase?.deliveredAt,
              expectedDate: selectedPurchase?.estimatedDelivery,
              isCompleted: selectedPurchase?.status === 'delivered',
              isCurrent: selectedPurchase?.status === 'delivered',
              isDelayed: false,
            },
          ]}
        />

        {/* Snackbar */}
        <Snackbar snackbar={snackbar} onClose={hideSnackbar} />
      </Container>
    </div>
  );
};

export default Purchases;
