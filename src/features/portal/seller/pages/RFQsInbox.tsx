import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { itemService } from '../../services/itemService';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Package,
  Calendar,
  CurrencyDollar,
  ChatCircle,
  CaretRight,
  X,
  PaperPlaneTilt,
  Warning,
  Timer,
  EnvelopeSimple,
  CaretDown,
  CaretUp,
  Buildings,
  Hash,
  Funnel,
  MagnifyingGlass,
  SortAscending,
} from 'phosphor-react';
import { EmptyState, Select } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface RFQsInboxProps {
  onNavigate: (page: string) => void;
}

type RFQStatus = 'new' | 'viewed' | 'quoted' | 'negotiation' | 'won' | 'lost' | 'expired';
type StatusFilter = 'all' | 'new' | 'quoted' | 'negotiation' | 'won' | 'lost';

interface IncomingRFQ {
  id: string;
  rfqNumber: string;
  buyer: {
    id: string;
    name: string;
    company: string;
    avatar?: string;
  };
  item: {
    id: string;
    name: string;
    sku: string;
    image?: string;
  };
  quantity: number;
  requestedPrice?: number;
  quotedPrice?: number;
  status: RFQStatus;
  deadline: string;
  receivedAt: string;
  lastActionAt: string;
  messages: number;
  isUrgent?: boolean;
}

// Mock data for design preview
const rfqData: IncomingRFQ[] = [
  {
    id: '1',
    rfqNumber: 'RFQ-2024-0042',
    buyer: { id: 'b1', name: 'Ahmed Al-Rashid', company: 'Al-Rashid Industries' },
    item: { id: 'i1', name: 'Hydraulic Pump Assembly', sku: 'HYD-PMP-001' },
    quantity: 25,
    requestedPrice: 1200,
    status: 'new',
    deadline: '2024-02-15',
    receivedAt: '2024-02-01T10:30:00',
    lastActionAt: '2024-02-01T10:30:00',
    messages: 1,
    isUrgent: true,
  },
  {
    id: '2',
    rfqNumber: 'RFQ-2024-0041',
    buyer: { id: 'b2', name: 'Mohammed Hassan', company: 'Hassan Equipment Co.' },
    item: { id: 'i2', name: 'Industrial Bearing Set', sku: 'BRG-IND-050' },
    quantity: 100,
    requestedPrice: 85,
    quotedPrice: 92,
    status: 'quoted',
    deadline: '2024-02-12',
    receivedAt: '2024-01-30T14:15:00',
    lastActionAt: '2024-02-01T09:00:00',
    messages: 3,
  },
  {
    id: '3',
    rfqNumber: 'RFQ-2024-0040',
    buyer: { id: 'b3', name: 'Khalid Al-Otaibi', company: 'Otaibi Manufacturing' },
    item: { id: 'i3', name: 'Safety Valve Assembly', sku: 'SFV-ASM-012' },
    quantity: 50,
    requestedPrice: 450,
    quotedPrice: 475,
    status: 'negotiation',
    deadline: '2024-02-10',
    receivedAt: '2024-01-28T09:45:00',
    lastActionAt: '2024-02-01T16:20:00',
    messages: 5,
  },
  {
    id: '4',
    rfqNumber: 'RFQ-2024-0038',
    buyer: { id: 'b4', name: 'Saeed Al-Qahtani', company: 'Qahtani Heavy Industries' },
    item: { id: 'i4', name: 'Motor Control Unit', sku: 'MCU-ELC-008' },
    quantity: 10,
    requestedPrice: 2800,
    quotedPrice: 2650,
    status: 'won',
    deadline: '2024-02-08',
    receivedAt: '2024-01-25T11:00:00',
    lastActionAt: '2024-01-30T14:30:00',
    messages: 4,
  },
  {
    id: '5',
    rfqNumber: 'RFQ-2024-0035',
    buyer: { id: 'b5', name: 'Faisal Al-Dosari', company: 'Dosari Maintenance' },
    item: { id: 'i5', name: 'Compressor Filter Kit', sku: 'CFK-MNT-003' },
    quantity: 200,
    requestedPrice: 45,
    quotedPrice: 52,
    status: 'lost',
    deadline: '2024-02-05',
    receivedAt: '2024-01-22T08:30:00',
    lastActionAt: '2024-01-28T10:00:00',
    messages: 2,
  },
];

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const columnHelper = createColumnHelper<IncomingRFQ>();

export const RFQsInbox: React.FC<RFQsInboxProps> = ({ onNavigate }) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'receivedAt', desc: true }]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [selectedRFQ, setSelectedRFQ] = useState<IncomingRFQ | null>(null);

  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // RFQ data state
  const [rfqs, setRfqs] = useState<IncomingRFQ[]>(rfqData);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch RFQs from API
  const fetchRFQs = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = await itemService.getSellerRFQs(token);
      // Convert API data to local format
      const converted: IncomingRFQ[] = data.map((rfq: any) => ({
        id: rfq.id,
        rfqNumber: rfq.id.slice(0, 8).toUpperCase(),
        buyer: {
          id: rfq.buyerId,
          name: 'Buyer',
          company: 'Company',
        },
        item: {
          id: rfq.itemId,
          name: rfq.item?.name || 'Item',
          sku: rfq.item?.sku || '-',
        },
        quantity: rfq.quantity,
        requestedPrice: undefined,
        quotedPrice: rfq.quotedPrice,
        status: rfq.status === 'pending' ? 'new' : rfq.status as RFQStatus,
        deadline: rfq.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
        receivedAt: rfq.createdAt,
        lastActionAt: rfq.respondedAt || rfq.createdAt,
        messages: 0,
        isUrgent: false,
      }));
      if (converted.length > 0) {
        setRfqs(converted);
      }
    } catch (err) {
      console.error('Failed to fetch RFQs:', err);
      // Keep mock data on error
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  // Filter data
  const filteredRFQs = useMemo(() => {
    let result = [...rfqs];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.rfqNumber.toLowerCase().includes(q) ||
          r.item.name.toLowerCase().includes(q) ||
          r.buyer.company.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    return result;
  }, [rfqs, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: rfqs.length,
    new: rfqs.filter((r) => r.status === 'new').length,
    quoted: rfqs.filter((r) => r.status === 'quoted').length,
    negotiation: rfqs.filter((r) => r.status === 'negotiation').length,
    won: rfqs.filter((r) => r.status === 'won').length,
    lost: rfqs.filter((r) => r.status === 'lost').length,
  }), [rfqs]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Table columns
  const columns = useMemo(() => [
    columnHelper.accessor('item', {
      meta: { align: 'start' as const },
      header: t('seller.rfqs.requestedItem'),
      cell: ({ row }) => {
        const rfq = row.original;
        const isNew = rfq.status === 'new';

        return (
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <Package size={18} weight="duotone" style={{ color: styles.textMuted }} />
              </div>
              {isNew && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
                  style={{ backgroundColor: styles.info, borderColor: styles.bgCard }}
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                {rfq.item.name}
              </p>
              <p className="truncate" style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
                {rfq.rfqNumber} · {rfq.item.sku}
              </p>
            </div>
          </div>
        );
      },
      size: 280,
    }),
    columnHelper.accessor('buyer', {
      meta: { align: 'start' as const },
      header: t('seller.rfqs.buyer'),
      cell: ({ row }) => {
        const buyer = row.original.buyer;
        return (
          <div className="min-w-0">
            <p className="font-medium truncate" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
              {buyer.company}
            </p>
            <p className="truncate" style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
              {buyer.name}
            </p>
          </div>
        );
      },
      size: 180,
    }),
    columnHelper.accessor('quantity', {
      meta: { align: 'center' as const },
      header: t('seller.rfqs.quantity'),
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
          {row.original.quantity}
        </span>
      ),
      size: 90,
    }),
    columnHelper.accessor('requestedPrice', {
      meta: { align: 'center' as const },
      header: t('seller.rfqs.pricing'),
      cell: ({ row }) => {
        const rfq = row.original;
        return (
          <span className="font-semibold tabular-nums" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
            {rfq.requestedPrice?.toLocaleString()} SAR
          </span>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('status', {
      meta: { align: 'center' as const },
      header: t('seller.rfqs.status'),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <RFQStatusBadge status={row.original.status} />
        </div>
      ),
      size: 115,
    }),
    columnHelper.accessor('receivedAt', {
      meta: { align: 'center' as const },
      header: t('seller.rfqs.received'),
      cell: ({ row }) => (
        <span className="tabular-nums" style={{ color: styles.textSecondary, fontSize: '0.79rem' }}>
          {formatRelativeTime(row.original.receivedAt)}
        </span>
      ),
      size: 100,
    }),
    columnHelper.display({
      id: 'actions',
      meta: { align: 'center' as const },
      header: t('common.actions'),
      cell: ({ row }) => {
        const rfq = row.original;
        const isNew = rfq.status === 'new';

        return (
          <div className="flex justify-center">
            {isNew ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRFQ(rfq);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
                  color: styles.isDark ? '#0F1115' : '#E6E8EB',
                }}
              >
                <CurrencyDollar size={14} weight="bold" />
                {t('seller.rfqs.sendQuote')}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRFQ(rfq);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                <Eye size={14} />
                {t('common.view')}
              </button>
            )}
          </div>
        );
      },
      size: 140,
    }),
  ], [styles, t]);

  const table = useReactTable<IncomingRFQ>({
    data: filteredRFQs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              {t('seller.rfqs.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              {t('seller.rfqs.subtitle')}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`flex items-center gap-6 mb-6 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
          <QuickStat label={t('seller.rfqs.allRfqs')} value={stats.total} styles={styles} />
          <QuickStat label={t('seller.rfqs.new')} value={stats.new} color={styles.info} styles={styles} highlight={stats.new > 0} />
          <QuickStat label={t('seller.rfqs.quoted')} value={stats.quoted} styles={styles} />
          <QuickStat label={t('seller.rfqs.negotiation')} value={stats.negotiation} color="#F59E0B" styles={styles} />
          <QuickStat label={t('seller.rfqs.won')} value={stats.won} color={styles.success} styles={styles} />
          <QuickStat label={t('seller.rfqs.lost')} value={stats.lost} color={styles.error} styles={styles} />
        </div>

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
              {t('seller.listings.filters')}
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
            <div className="flex items-center gap-3">
              {/* Sort */}
              <Select
                value={sorting[0]?.id || 'receivedAt'}
                onChange={(v) => setSorting([{ id: v, desc: true }])}
                options={[
                  { value: 'receivedAt', label: t('seller.rfqs.received') },
                  { value: 'deadline', label: t('seller.rfqs.deadline') },
                  { value: 'requestedPrice', label: t('seller.rfqs.pricing') },
                ]}
              />
            </div>
          </div>

          {/* Filter Controls */}
          {filtersExpanded && (
            <div className="px-4 py-3 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 h-9 rounded-lg border flex-1 min-w-[200px] max-w-[300px]"
                style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
              >
                <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
                <input
                  type="text"
                  placeholder={t('seller.rfqs.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="outline-none text-sm bg-transparent flex-1"
                  style={{ color: styles.textPrimary }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ color: styles.textMuted }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
                placeholder={t('seller.rfqs.status')}
                options={[
                  { value: 'all', label: t('seller.rfqs.allRfqs') },
                  { value: 'new', label: t('seller.rfqs.new') },
                  { value: 'quoted', label: t('seller.rfqs.quoted') },
                  { value: 'negotiation', label: t('seller.rfqs.negotiation') },
                  { value: 'won', label: t('seller.rfqs.won') },
                  { value: 'lost', label: t('seller.rfqs.lost') },
                ]}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                  style={{ color: styles.error }}
                >
                  <X size={12} /> {t('seller.listings.clearAll')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {rfqData.length === 0 ? (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={FileText}
              title={t('seller.rfqs.noRfqs')}
              description={t('seller.rfqs.noRfqsDesc')}
            />
          </div>
        ) : filteredRFQs.length === 0 ? (
          <div
            className="rounded-xl border py-16 text-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <MagnifyingGlass size={40} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {t('seller.rfqs.noResults')}
            </p>
            <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
              {t('seller.rfqs.tryAdjusting')}
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm font-medium"
              style={{ color: styles.info }}
            >
              {t('seller.listings.clearAll')}
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      style={{
                        backgroundColor: styles.tableHeader,
                        borderBottom: `1px solid ${styles.tableBorder}`,
                      }}
                    >
                      {headerGroup.headers.map((header) => {
                        const align = (header.column.columnDef.meta as { align?: 'start' | 'center' })?.align || 'start';
                        return (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                            style={{ color: styles.textMuted, width: header.getSize(), verticalAlign: 'middle', textAlign: align }}
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                className={`flex items-center gap-1 ${
                                  align === 'center' ? 'justify-center' : ''
                                } ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className="flex flex-col -space-y-1 ml-0.5">
                                  {header.column.getIsSorted() === 'asc' ? (
                                    <CaretUp size={12} weight="bold" style={{ color: styles.textPrimary }} />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <CaretDown size={12} weight="bold" style={{ color: styles.textPrimary }} />
                                  ) : (
                                    <>
                                      <CaretUp size={10} style={{ color: styles.textMuted, opacity: 0.4 }} />
                                      <CaretDown size={10} style={{ color: styles.textMuted, opacity: 0.4 }} />
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, index) => {
                    const isNew = row.original.status === 'new';
                    return (
                      <tr
                        key={row.id}
                        className="group transition-colors cursor-pointer"
                        onClick={() => setSelectedRFQ(row.original)}
                        style={{
                          borderBottom:
                            index === table.getRowModel().rows.length - 1
                              ? 'none'
                              : `1px solid ${styles.tableBorder}`,
                          backgroundColor: isNew ? `${styles.info}05` : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isNew
                            ? `${styles.info}10`
                            : styles.tableRowHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isNew
                            ? `${styles.info}05`
                            : 'transparent';
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const align = (cell.column.columnDef.meta as { align?: 'start' | 'center' })?.align || 'start';
                          return (
                          <td
                            key={cell.id}
                            className="px-4 py-4"
                            style={{ width: cell.column.getSize(), verticalAlign: 'middle', textAlign: align }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 flex items-center justify-between text-sm"
              style={{
                borderTop: `1px solid ${styles.tableBorder}`,
                backgroundColor: styles.tableHeader,
                color: styles.textMuted,
              }}
            >
              <span>
                {t('seller.listings.showing')} {filteredRFQs.length} {t('seller.listings.of')} {rfqData.length} RFQs
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RFQ Detail Panel */}
      {selectedRFQ && (
        <RFQDetailPanel
          rfq={selectedRFQ}
          isRtl={isRtl}
          onClose={() => setSelectedRFQ(null)}
        />
      )}
    </div>
  );
};

// Quick Stat Component
const QuickStat: React.FC<{
  label: string;
  value: number;
  color?: string;
  styles: ReturnType<typeof usePortal>['styles'];
  highlight?: boolean;
}> = ({ label, value, color, styles, highlight }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm" style={{ color: styles.textMuted }}>
      {label}:
    </span>
    <span
      className={`text-sm font-semibold ${highlight ? 'flex items-center gap-1' : ''}`}
      style={{ color: color || styles.textPrimary }}
    >
      {highlight && (
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: color }}
          />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
        </span>
      )}
      {value}
    </span>
  </div>
);

// Status Badge Component
const RFQStatusBadge: React.FC<{ status: RFQStatus }> = ({ status }) => {
  const { styles, t } = usePortal();

  const config: Record<RFQStatus, { bg: string; text: string; label: string }> = {
    new: {
      bg: `${styles.info}15`,
      text: styles.info,
      label: t('seller.rfqs.new'),
    },
    viewed: {
      bg: styles.bgSecondary,
      text: styles.textSecondary,
      label: t('seller.rfqs.viewed'),
    },
    quoted: {
      bg: styles.bgSecondary,
      text: styles.textSecondary,
      label: t('seller.rfqs.quoted'),
    },
    negotiation: {
      bg: 'rgba(245,158,11,0.15)',
      text: '#F59E0B',
      label: t('seller.rfqs.negotiation'),
    },
    won: {
      bg: `${styles.success}15`,
      text: styles.success,
      label: t('seller.rfqs.won'),
    },
    lost: {
      bg: `${styles.error}10`,
      text: styles.error,
      label: t('seller.rfqs.lost'),
    },
    expired: {
      bg: styles.bgSecondary,
      text: styles.textMuted,
      label: t('seller.rfqs.expired'),
    },
  };

  const statusConfig = config[status] || config.expired;
  const { bg, text, label } = statusConfig;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  );
};

// RFQ Detail Panel (Slide-over)
const RFQDetailPanel: React.FC<{
  rfq: IncomingRFQ;
  isRtl: boolean;
  onClose: () => void;
}> = ({ rfq, isRtl, onClose }) => {
  const { styles, t } = usePortal();
  const [quotePrice, setQuotePrice] = useState(rfq.quotedPrice?.toString() || '');
  const [leadTime, setLeadTime] = useState('14');
  const [message, setMessage] = useState('');

  const totalValue = (parseFloat(quotePrice) || rfq.requestedPrice || 0) * rfq.quantity;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 bottom-0 w-full max-w-xl z-50 shadow-2xl flex flex-col ${
          isRtl ? 'left-0' : 'right-0'
        }`}
        style={{ backgroundColor: styles.bgPrimary }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <FileText size={20} weight="duotone" style={{ color: styles.textMuted }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                {rfq.rfqNumber}
              </h2>
              <div className="flex items-center gap-2">
                <RFQStatusBadge status={rfq.status} />
                <span className="text-xs" style={{ color: styles.textMuted }}>
                  {formatRelativeTime(rfq.receivedAt)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Item Card */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <Package size={28} weight="duotone" style={{ color: styles.textMuted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg" style={{ color: styles.textPrimary }}>
                  {rfq.item.name}
                </p>
                <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: styles.textMuted }}>
                  <span className="flex items-center gap-1">
                    <Hash size={14} />
                    {rfq.item.sku}
                  </span>
                </div>
                <div
                  className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <Package size={16} style={{ color: styles.textSecondary }} />
                  <span className="font-semibold" style={{ color: styles.textPrimary }}>
                    {rfq.quantity}
                  </span>
                  <span style={{ color: styles.textMuted }}>{t('common.units')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buyer Card */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
              {t('seller.rfqs.buyerInfo')}
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                {rfq.buyer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-medium" style={{ color: styles.textPrimary }}>
                  {rfq.buyer.name}
                </p>
                <p className="text-sm flex items-center gap-1" style={{ color: styles.textMuted }}>
                  <Buildings size={14} />
                  {rfq.buyer.company}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
              {t('seller.rfqs.pricing')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: styles.border }}>
                <span style={{ color: styles.textSecondary }}>{t('seller.rfqs.buyerTarget')}</span>
                <span className="font-semibold" style={{ color: styles.textPrimary }}>
                  {rfq.requestedPrice?.toLocaleString()} SAR / {t('common.unit')}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: styles.border }}>
                <span style={{ color: styles.textSecondary }}>{t('seller.rfqs.quantity')}</span>
                <span className="font-semibold" style={{ color: styles.textPrimary }}>
                  {rfq.quantity} {t('common.units')}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span style={{ color: styles.textSecondary }}>{t('seller.rfqs.totalValue')}</span>
                <span className="text-xl font-bold" style={{ color: styles.textPrimary }}>
                  {((rfq.requestedPrice || 0) * rfq.quantity).toLocaleString()} SAR
                </span>
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-lg mt-2"
                style={{ backgroundColor: `${styles.warning}15` }}
              >
                <Timer size={18} style={{ color: styles.warning }} />
                <span className="text-sm" style={{ color: styles.warning }}>
                  {t('seller.rfqs.deadline')}: {new Date(rfq.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          {(rfq.status === 'new' || rfq.status === 'negotiation') && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
            >
              <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: styles.textMuted }}>
                {rfq.status === 'new' ? t('seller.rfqs.submitQuote') : t('seller.rfqs.counterOffer')}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: styles.textSecondary }}>
                    {t('seller.rfqs.unitPrice')} (SAR) *
                  </label>
                  <div className="relative">
                    <CurrencyDollar
                      size={18}
                      className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`}
                      style={{ color: styles.textMuted }}
                    />
                    <input
                      type="number"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      placeholder={rfq.requestedPrice?.toString() || '0.00'}
                      className={`w-full py-3 rounded-lg border text-sm outline-none transition-colors ${
                        isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
                      }`}
                      style={{
                        backgroundColor: styles.bgPrimary,
                        borderColor: styles.border,
                        color: styles.textPrimary,
                      }}
                    />
                  </div>
                  {quotePrice && (
                    <p className="mt-1 text-xs" style={{ color: styles.success }}>
                      Total: {totalValue.toLocaleString()} SAR
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: styles.textSecondary }}>
                    {t('seller.rfqs.leadTime')} ({t('common.days')})
                  </label>
                  <div className="relative">
                    <Calendar
                      size={18}
                      className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`}
                      style={{ color: styles.textMuted }}
                    />
                    <input
                      type="number"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      placeholder="14"
                      className={`w-full py-3 rounded-lg border text-sm outline-none transition-colors ${
                        isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
                      }`}
                      style={{
                        backgroundColor: styles.bgPrimary,
                        borderColor: styles.border,
                        color: styles.textPrimary,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: styles.textSecondary }}>
                    {t('seller.rfqs.message')}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder={t('seller.rfqs.messagePlaceholder')}
                    className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors resize-none"
                    style={{
                      backgroundColor: styles.bgPrimary,
                      borderColor: styles.border,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Won Status */}
          {rfq.status === 'won' && (
            <div
              className="p-5 rounded-xl text-center"
              style={{ backgroundColor: `${styles.success}15` }}
            >
              <CheckCircle size={48} weight="duotone" style={{ color: styles.success }} className="mx-auto mb-3" />
              <p className="text-lg font-semibold mb-1" style={{ color: styles.success }}>
                {t('seller.rfqs.quoteAccepted')}
              </p>
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                {t('seller.rfqs.proceedToOrder')}
              </p>
            </div>
          )}

          {/* Lost Status */}
          {rfq.status === 'lost' && (
            <div
              className="p-5 rounded-xl text-center"
              style={{ backgroundColor: `${styles.error}10` }}
            >
              <Warning size={48} weight="duotone" style={{ color: styles.error }} className="mx-auto mb-3" />
              <p className="text-lg font-semibold mb-1" style={{ color: styles.error }}>
                {t('seller.rfqs.quoteLost')}
              </p>
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                {t('seller.rfqs.lostDescription')}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(rfq.status === 'new' || rfq.status === 'negotiation') && (
          <div
            className="px-6 py-4 border-t"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
                color: styles.isDark ? '#0F1115' : '#E6E8EB',
              }}
            >
              <PaperPlaneTilt size={18} weight="bold" />
              {t('seller.rfqs.sendQuote')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default RFQsInbox;
