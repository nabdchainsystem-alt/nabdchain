import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { sellerRfqInboxService } from '../../services/sellerRfqInboxService';
import { QuoteFormPanel } from '../components/QuoteFormPanel';
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
  Eye,
  Package,
  Calendar,
  CaretRight,
  X,
  Warning,
  EnvelopeSimple,
  CaretDown,
  CaretUp,
  Buildings,
  Hash,
  Funnel,
  MagnifyingGlass,
  Lightning,
  MapPin,
  Note,
  MagnifyingGlassPlus,
  XCircle,
  CheckCircle,
  Timer,
  NotePencil,
  CurrencyDollar,
} from 'phosphor-react';
import { EmptyState, Select } from '../../components';
import { usePortal } from '../../context/PortalContext';
import {
  SellerInboxRFQ,
  InboxFilters,
  InboxStats,
  Stage2RFQStatus,
  RFQPriorityLevel,
  RFQEvent,
  Quote,
  getPriorityLevelConfig,
  getStage2StatusConfig,
  getTimeSinceReceived,
} from '../../types/item.types';

interface RFQsInboxProps {
  onNavigate: (page: string) => void;
}

type StatusFilter = 'all' | Stage2RFQStatus;
type PriorityFilter = 'all' | RFQPriorityLevel;

const columnHelper = createColumnHelper<SellerInboxRFQ>();

export const RFQsInbox: React.FC<RFQsInboxProps> = ({ onNavigate }) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [selectedRFQ, setSelectedRFQ] = useState<SellerInboxRFQ | null>(null);

  // Dialogs
  const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [ignoreReason, setIgnoreReason] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [dialogRFQId, setDialogRFQId] = useState<string | null>(null);

  // Quote Panel (Stage 3)
  const [showQuotePanel, setShowQuotePanel] = useState(false);
  const [quoteRFQ, setQuoteRFQ] = useState<SellerInboxRFQ | null>(null);

  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // Data state
  const [rfqs, setRfqs] = useState<SellerInboxRFQ[]>([]);
  const [stats, setStats] = useState<InboxStats>({
    new: 0,
    viewed: 0,
    underReview: 0,
    ignored: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch RFQs from API
  const fetchRFQs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const filters: InboxFilters = {
        page: currentPage,
        limit: 20,
        sortBy: (sorting[0]?.id as InboxFilters['sortBy']) || 'createdAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (priorityFilter !== 'all') {
        filters.priorityLevel = priorityFilter;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const result = await sellerRfqInboxService.getInbox(token, filters);
      setRfqs(result.rfqs);
      setStats(result.stats);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.total);
    } catch (err) {
      console.error('Failed to fetch RFQs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, currentPage, sorting, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  // Handle RFQ selection (auto-marks as viewed)
  const handleSelectRFQ = useCallback(async (rfq: SellerInboxRFQ) => {
    try {
      const token = await getToken();
      if (!token) return;

      // Fetch full detail (which auto-marks as viewed)
      const detail = await sellerRfqInboxService.getRFQDetail(token, rfq.id);
      if (detail) {
        setSelectedRFQ(detail);
        // Update local state if status changed
        if (detail.status !== rfq.status) {
          setRfqs(prev => prev.map(r => r.id === rfq.id ? detail : r));
          fetchRFQs(); // Refresh stats
        }
      }
    } catch (err) {
      console.error('Failed to load RFQ detail:', err);
      setSelectedRFQ(rfq);
    }
  }, [getToken, fetchRFQs]);

  // Handle mark as under review
  const handleMarkUnderReview = useCallback(async (rfqId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const updated = await sellerRfqInboxService.markUnderReview(token, rfqId);
      if (updated) {
        setSelectedRFQ(updated);
        fetchRFQs();
      }
    } catch (err) {
      console.error('Failed to mark as under review:', err);
    }
  }, [getToken, fetchRFQs]);

  // Handle mark as ignored
  const handleMarkIgnored = useCallback(async () => {
    if (!dialogRFQId || !ignoreReason.trim()) return;

    try {
      const token = await getToken();
      if (!token) return;

      const updated = await sellerRfqInboxService.markIgnored(token, dialogRFQId, ignoreReason);
      if (updated) {
        if (selectedRFQ?.id === dialogRFQId) {
          setSelectedRFQ(updated);
        }
        fetchRFQs();
      }
      setShowIgnoreDialog(false);
      setIgnoreReason('');
      setDialogRFQId(null);
    } catch (err) {
      console.error('Failed to mark as ignored:', err);
    }
  }, [getToken, dialogRFQId, ignoreReason, selectedRFQ, fetchRFQs]);

  // Handle add note
  const handleAddNote = useCallback(async () => {
    if (!dialogRFQId || !noteContent.trim()) return;

    try {
      const token = await getToken();
      if (!token) return;

      const updated = await sellerRfqInboxService.addNote(token, dialogRFQId, { note: noteContent });
      if (updated) {
        if (selectedRFQ?.id === dialogRFQId) {
          setSelectedRFQ(updated);
        }
        fetchRFQs();
      }
      setShowNoteDialog(false);
      setNoteContent('');
      setDialogRFQId(null);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  }, [getToken, dialogRFQId, noteContent, selectedRFQ, fetchRFQs]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCurrentPage(1);
  };

  // Table columns
  const columns = useMemo(() => [
    columnHelper.accessor('rfqNumber', {
      meta: { align: 'start' as const },
      header: t('seller.inbox.rfqId') || 'RFQ ID',
      cell: ({ row }) => {
        const rfq = row.original;
        const isNew = rfq.status === 'new';
        const timeInfo = getTimeSinceReceived(rfq.createdAt);

        return (
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <EnvelopeSimple size={18} weight={isNew ? 'fill' : 'regular'} style={{ color: isNew ? styles.info : styles.textMuted }} />
              </div>
              {isNew && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
                  style={{ backgroundColor: styles.error, borderColor: styles.bgCard }}
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                {rfq.rfqNumber || `RFQ-${rfq.id.slice(0, 8).toUpperCase()}`}
              </p>
              <p
                className={`truncate flex items-center gap-1 ${timeInfo.isOverdue && isNew ? 'font-medium' : ''}`}
                style={{ color: timeInfo.isOverdue && isNew ? styles.warning : styles.textMuted, fontSize: '0.675rem' }}
              >
                {timeInfo.isOverdue && isNew && <Warning size={10} weight="fill" />}
                {timeInfo.text}
              </p>
            </div>
          </div>
        );
      },
      size: 180,
    }),
    columnHelper.accessor('item', {
      meta: { align: 'start' as const },
      header: t('seller.inbox.product') || 'Product',
      cell: ({ row }) => {
        const rfq = row.original;
        const hasItem = rfq.item && rfq.itemId;

        return (
          <div className="min-w-0">
            <p className="font-medium truncate" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
              {hasItem ? rfq.item!.name : t('seller.inbox.generalRfq') || 'General RFQ'}
            </p>
            <p className="truncate" style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
              {hasItem ? rfq.item!.sku : t('seller.inbox.noSpecificItem') || 'No specific item'}
            </p>
          </div>
        );
      },
      size: 200,
    }),
    columnHelper.accessor('buyerCompanyName', {
      meta: { align: 'start' as const },
      header: t('seller.inbox.buyer') || 'Buyer',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Buildings size={16} style={{ color: styles.textMuted }} />
          <span className="truncate" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
            {row.original.buyerCompanyName || t('seller.inbox.unknownBuyer') || 'Unknown'}
          </span>
        </div>
      ),
      size: 160,
    }),
    columnHelper.accessor('quantity', {
      meta: { align: 'center' as const },
      header: t('seller.inbox.qty') || 'Qty',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
          {row.original.quantity}
        </span>
      ),
      size: 70,
    }),
    columnHelper.accessor('deliveryLocation', {
      meta: { align: 'start' as const },
      header: t('seller.inbox.delivery') || 'Delivery',
      cell: ({ row }) => {
        const rfq = row.original;
        const location = rfq.deliveryCity || rfq.deliveryLocation || '-';
        return (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} style={{ color: styles.textMuted }} />
            <span className="truncate" style={{ color: styles.textSecondary, fontSize: '0.79rem' }}>
              {location}
            </span>
          </div>
        );
      },
      size: 130,
    }),
    columnHelper.accessor('priorityLevel', {
      meta: { align: 'center' as const },
      header: t('seller.inbox.priority') || 'Priority',
      cell: ({ row }) => {
        const level = row.original.priorityLevel || 'medium';
        const config = getPriorityLevelConfig(level);

        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: config.bgColor, color: config.textColor.replace('text-', '') }}
          >
            <Lightning size={12} weight="fill" />
            {config.label}
          </span>
        );
      },
      size: 100,
    }),
    columnHelper.accessor('status', {
      meta: { align: 'center' as const },
      header: t('seller.inbox.status') || 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status as Stage2RFQStatus} />,
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      meta: { align: 'center' as const },
      header: '',
      cell: ({ row }) => {
        const rfq = row.original;
        const canReview = rfq.status === 'new' || rfq.status === 'viewed';

        return (
          <div className="flex justify-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRFQ(rfq);
              }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              title={t('common.view') || 'View'}
            >
              <Eye size={16} />
            </button>
            {canReview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkUnderReview(rfq.id);
                }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: styles.info }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${styles.info}15`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title={t('seller.inbox.markUnderReview') || 'Mark Under Review'}
              >
                <MagnifyingGlassPlus size={16} />
              </button>
            )}
          </div>
        );
      },
      size: 80,
    }),
  ], [styles, t, handleSelectRFQ, handleMarkUnderReview]);

  const table = useReactTable<SellerInboxRFQ>({
    data: rfqs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              {t('seller.inbox.title') || 'RFQ Inbox'}
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              {t('seller.inbox.subtitle') || 'Review and evaluate incoming quote requests'}
            </p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mb-6">
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <StatusTab
              label={t('seller.inbox.all') || 'All'}
              count={stats.new + stats.viewed + stats.underReview + stats.ignored}
              isActive={statusFilter === 'all'}
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              styles={styles}
            />
            <StatusTab
              label={t('seller.inbox.statusNew') || 'New'}
              count={stats.new}
              isActive={statusFilter === 'new'}
              onClick={() => { setStatusFilter('new'); setCurrentPage(1); }}
              color={styles.error}
              styles={styles}
            />
            <StatusTab
              label={t('seller.inbox.statusViewed') || 'Viewed'}
              count={stats.viewed}
              isActive={statusFilter === 'viewed'}
              onClick={() => { setStatusFilter('viewed'); setCurrentPage(1); }}
              color={styles.info}
              styles={styles}
            />
            <StatusTab
              label={t('seller.inbox.statusUnderReview') || 'Under Review'}
              count={stats.underReview}
              isActive={statusFilter === 'under_review'}
              onClick={() => { setStatusFilter('under_review'); setCurrentPage(1); }}
              color={styles.warning}
              styles={styles}
            />
            <StatusTab
              label={t('seller.inbox.statusIgnored') || 'Ignored'}
              count={stats.ignored}
              isActive={statusFilter === 'ignored'}
              onClick={() => { setStatusFilter('ignored'); setCurrentPage(1); }}
              color={styles.textMuted}
              styles={styles}
            />
          </div>
        </div>

        {/* Priority Stats */}
        <div className={`flex items-center gap-6 mb-6 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
          <PriorityStat
            label={t('seller.inbox.priorityHigh') || 'High'}
            value={stats.highPriority}
            color={styles.error}
            styles={styles}
            onClick={() => { setPriorityFilter('high'); setCurrentPage(1); }}
            isActive={priorityFilter === 'high'}
          />
          <PriorityStat
            label={t('seller.inbox.priorityMedium') || 'Medium'}
            value={stats.mediumPriority}
            color={styles.warning}
            styles={styles}
            onClick={() => { setPriorityFilter('medium'); setCurrentPage(1); }}
            isActive={priorityFilter === 'medium'}
          />
          <PriorityStat
            label={t('seller.inbox.priorityLow') || 'Low'}
            value={stats.lowPriority}
            color={styles.info}
            styles={styles}
            onClick={() => { setPriorityFilter('low'); setCurrentPage(1); }}
            isActive={priorityFilter === 'low'}
          />
          {priorityFilter !== 'all' && (
            <button
              onClick={() => { setPriorityFilter('all'); setCurrentPage(1); }}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: styles.textMuted }}
            >
              <X size={12} />
              {t('common.clear') || 'Clear'}
            </button>
          )}
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
              {t('seller.listings.filters') || 'Filters'}
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
                  {t('common.active') || 'Active'}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3">
              <Select
                value={sorting[0]?.id || 'createdAt'}
                onChange={(v) => { setSorting([{ id: v, desc: true }]); setCurrentPage(1); }}
                options={[
                  { value: 'createdAt', label: t('seller.inbox.sortByDate') || 'Date Received' },
                  { value: 'priorityScore', label: t('seller.inbox.sortByPriority') || 'Priority Score' },
                  { value: 'requiredDeliveryDate', label: t('seller.inbox.sortByDeadline') || 'Delivery Date' },
                ]}
              />
            </div>
          </div>

          {/* Filter Controls */}
          {filtersExpanded && (
            <div className="px-4 py-3 flex flex-wrap items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 h-9 rounded-lg border flex-1 min-w-[200px] max-w-[300px]"
                style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
              >
                <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
                <input
                  type="text"
                  placeholder={t('seller.inbox.searchPlaceholder') || 'Search RFQ ID, buyer...'}
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

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                  style={{ color: styles.error }}
                >
                  <X size={12} /> {t('seller.listings.clearAll') || 'Clear All'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            className="rounded-xl border py-16 text-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto mb-3" style={{ borderColor: styles.border, borderTopColor: styles.info }} />
            <p className="text-sm" style={{ color: styles.textMuted }}>
              {t('common.loading') || 'Loading...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div
            className="rounded-xl border py-16 text-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <Warning size={40} style={{ color: styles.error }} className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: styles.error }}>
              {error}
            </p>
            <button
              onClick={fetchRFQs}
              className="mt-3 text-sm font-medium"
              style={{ color: styles.info }}
            >
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && rfqs.length === 0 && !hasActiveFilters && (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={FileText}
              title={t('seller.inbox.noRfqs') || 'No RFQs Yet'}
              description={t('seller.inbox.noRfqsDesc') || 'When buyers send quote requests, they will appear here.'}
            />
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && rfqs.length === 0 && hasActiveFilters && (
          <div
            className="rounded-xl border py-16 text-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <MagnifyingGlass size={40} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {t('seller.inbox.noResults') || 'No matching RFQs'}
            </p>
            <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
              {t('seller.inbox.tryAdjusting') || 'Try adjusting your filters'}
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm font-medium"
              style={{ color: styles.info }}
            >
              {t('seller.listings.clearAll') || 'Clear All'}
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && rfqs.length > 0 && (
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
                    const timeInfo = getTimeSinceReceived(row.original.createdAt);
                    const isOverdue = isNew && timeInfo.isOverdue;

                    return (
                      <tr
                        key={row.id}
                        className="group transition-colors cursor-pointer"
                        onClick={() => handleSelectRFQ(row.original)}
                        style={{
                          borderBottom:
                            index === table.getRowModel().rows.length - 1
                              ? 'none'
                              : `1px solid ${styles.tableBorder}`,
                          backgroundColor: isOverdue ? `${styles.warning}08` : isNew ? `${styles.info}05` : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isOverdue
                            ? `${styles.warning}12`
                            : isNew
                            ? `${styles.info}10`
                            : styles.tableRowHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isOverdue
                            ? `${styles.warning}08`
                            : isNew
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
                {t('seller.listings.showing') || 'Showing'} {rfqs.length} {t('seller.listings.of') || 'of'} {totalItems} RFQs
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded text-sm disabled:opacity-50"
                    style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                  >
                    {t('common.previous') || 'Previous'}
                  </button>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded text-sm disabled:opacity-50"
                    style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                  >
                    {t('common.next') || 'Next'}
                  </button>
                </div>
              )}
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
          onMarkUnderReview={() => handleMarkUnderReview(selectedRFQ.id)}
          onMarkIgnored={() => {
            setDialogRFQId(selectedRFQ.id);
            setShowIgnoreDialog(true);
          }}
          onAddNote={() => {
            setDialogRFQId(selectedRFQ.id);
            setNoteContent(selectedRFQ.internalNotes || '');
            setShowNoteDialog(true);
          }}
          onCreateQuote={() => {
            setQuoteRFQ(selectedRFQ);
            setShowQuotePanel(true);
          }}
        />
      )}

      {/* Quote Form Panel (Stage 3) */}
      {quoteRFQ && (
        <QuoteFormPanel
          isOpen={showQuotePanel}
          onClose={() => {
            setShowQuotePanel(false);
            setQuoteRFQ(null);
          }}
          rfq={quoteRFQ}
          onSuccess={(quote: Quote) => {
            // Close the detail panel and refresh the list
            setSelectedRFQ(null);
            setShowQuotePanel(false);
            setQuoteRFQ(null);
            fetchRFQs();
          }}
        />
      )}

      {/* Ignore Dialog */}
      {showIgnoreDialog && (
        <Dialog
          title={t('seller.inbox.ignoreRfq') || 'Ignore RFQ'}
          onClose={() => {
            setShowIgnoreDialog(false);
            setIgnoreReason('');
            setDialogRFQId(null);
          }}
          onConfirm={handleMarkIgnored}
          confirmLabel={t('seller.inbox.markIgnored') || 'Mark as Ignored'}
          confirmDisabled={!ignoreReason.trim()}
          isRtl={isRtl}
        >
          <p className="text-sm mb-3" style={{ color: styles.textSecondary }}>
            {t('seller.inbox.ignoreReasonPrompt') || 'Please provide a reason for ignoring this RFQ:'}
          </p>
          <textarea
            value={ignoreReason}
            onChange={(e) => setIgnoreReason(e.target.value)}
            placeholder={t('seller.inbox.ignoreReasonPlaceholder') || 'e.g., Item not available, Buyer outside service area...'}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{
              backgroundColor: styles.bgPrimary,
              borderColor: styles.border,
              color: styles.textPrimary,
            }}
            autoFocus
          />
        </Dialog>
      )}

      {/* Note Dialog */}
      {showNoteDialog && (
        <Dialog
          title={t('seller.inbox.internalNote') || 'Internal Note'}
          onClose={() => {
            setShowNoteDialog(false);
            setNoteContent('');
            setDialogRFQId(null);
          }}
          onConfirm={handleAddNote}
          confirmLabel={t('common.save') || 'Save'}
          confirmDisabled={!noteContent.trim()}
          isRtl={isRtl}
        >
          <p className="text-sm mb-3" style={{ color: styles.textSecondary }}>
            {t('seller.inbox.notePrompt') || 'Add an internal note for this RFQ (only visible to you):'}
          </p>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder={t('seller.inbox.notePlaceholder') || 'Your notes about this RFQ...'}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{
              backgroundColor: styles.bgPrimary,
              borderColor: styles.border,
              color: styles.textPrimary,
            }}
            autoFocus
          />
        </Dialog>
      )}
    </div>
  );
};

// Status Tab Component
const StatusTab: React.FC<{
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, count, isActive, onClick, color, styles }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
    style={{
      backgroundColor: isActive ? styles.bgCard : 'transparent',
      color: isActive ? (color || styles.textPrimary) : styles.textMuted,
      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    }}
  >
    {color && (
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    )}
    {label}
    <span
      className="px-1.5 py-0.5 rounded text-xs font-semibold tabular-nums"
      style={{
        backgroundColor: isActive ? (color ? `${color}15` : styles.bgSecondary) : 'transparent',
        color: isActive ? (color || styles.textSecondary) : styles.textMuted,
      }}
    >
      {count}
    </span>
  </button>
);

// Priority Stat Component
const PriorityStat: React.FC<{
  label: string;
  value: number;
  color: string;
  styles: ReturnType<typeof usePortal>['styles'];
  onClick: () => void;
  isActive: boolean;
}> = ({ label, value, color, styles, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${isActive ? 'ring-2' : ''}`}
    style={{
      backgroundColor: isActive ? `${color}15` : 'transparent',
      ringColor: color,
    }}
  >
    <Lightning size={14} weight="fill" style={{ color }} />
    <span className="text-sm" style={{ color: styles.textMuted }}>
      {label}:
    </span>
    <span className="text-sm font-semibold" style={{ color }}>
      {value}
    </span>
  </button>
);

// Status Badge Component
const StatusBadge: React.FC<{ status: Stage2RFQStatus }> = ({ status }) => {
  const { styles } = usePortal();
  const config = getStage2StatusConfig(status);

  const IconComponent = {
    envelope: EnvelopeSimple,
    eye: Eye,
    'magnifying-glass': MagnifyingGlassPlus,
    'x-circle': XCircle,
  }[config.icon];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bgColor, color: config.textColor.replace('text-', '') }}
    >
      <IconComponent size={12} weight="fill" />
      {config.label}
    </span>
  );
};

// Dialog Component
const Dialog: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
  isRtl: boolean;
}> = ({ title, children, onClose, onConfirm, confirmLabel, confirmDisabled, isRtl }) => {
  const { styles } = usePortal();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 rounded-xl shadow-2xl p-6"
        style={{ backgroundColor: styles.bgCard }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: styles.textPrimary }}>
          {title}
        </h3>
        {children}
        <div className={`flex gap-3 mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
              color: styles.isDark ? '#0F1115' : '#E6E8EB',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
};

// RFQ Detail Panel (Slide-over)
const RFQDetailPanel: React.FC<{
  rfq: SellerInboxRFQ;
  isRtl: boolean;
  onClose: () => void;
  onMarkUnderReview: () => void;
  onMarkIgnored: () => void;
  onAddNote: () => void;
  onCreateQuote: () => void;
}> = ({ rfq, isRtl, onClose, onMarkUnderReview, onMarkIgnored, onAddNote, onCreateQuote }) => {
  const { styles, t } = usePortal();
  const { getToken } = useAuth();
  const [history, setHistory] = useState<RFQEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const canMarkUnderReview = rfq.status === 'new' || rfq.status === 'viewed';
  const canMarkIgnored = rfq.status !== 'ignored';
  const canCreateQuote = rfq.status === 'under_review';
  const timeInfo = getTimeSinceReceived(rfq.createdAt);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const token = await getToken();
        if (!token) return;
        const events = await sellerRfqInboxService.getHistory(token, rfq.id);
        if (events) setHistory(events);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [getToken, rfq.id]);

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
                {rfq.rfqNumber || `RFQ-${rfq.id.slice(0, 8).toUpperCase()}`}
              </h2>
              <div className="flex items-center gap-2">
                <StatusBadge status={rfq.status as Stage2RFQStatus} />
                <span
                  className={`text-xs flex items-center gap-1 ${timeInfo.isOverdue && rfq.status === 'new' ? 'font-medium' : ''}`}
                  style={{ color: timeInfo.isOverdue && rfq.status === 'new' ? styles.warning : styles.textMuted }}
                >
                  {timeInfo.isOverdue && rfq.status === 'new' && <Warning size={10} weight="fill" />}
                  {timeInfo.text}
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
          {/* SLA Warning */}
          {timeInfo.isOverdue && rfq.status === 'new' && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: `${styles.warning}15`, border: `1px solid ${styles.warning}30` }}
            >
              <Timer size={24} weight="duotone" style={{ color: styles.warning }} />
              <div>
                <p className="font-medium text-sm" style={{ color: styles.warning }}>
                  {t('seller.inbox.slaWarning') || 'Response time exceeded'}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  {t('seller.inbox.slaWarningDesc') || 'This RFQ has been waiting for over 24 hours'}
                </p>
              </div>
            </div>
          )}

          {/* Item Card */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
              {t('seller.inbox.requestedItem') || 'Requested Item'}
            </p>
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <Package size={24} weight="duotone" style={{ color: styles.textMuted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: styles.textPrimary }}>
                  {rfq.item?.name || t('seller.inbox.generalRfq') || 'General RFQ'}
                </p>
                {rfq.item?.sku && (
                  <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: styles.textMuted }}>
                    <Hash size={14} />
                    {rfq.item.sku}
                  </p>
                )}
                <div
                  className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <Package size={16} style={{ color: styles.textSecondary }} />
                  <span className="font-semibold" style={{ color: styles.textPrimary }}>
                    {rfq.quantity}
                  </span>
                  <span style={{ color: styles.textMuted }}>{t('common.units') || 'units'}</span>
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
              {t('seller.inbox.buyerInfo') || 'Buyer Information'}
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <Buildings size={20} style={{ color: styles.textMuted }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: styles.textPrimary }}>
                  {rfq.buyerCompanyName || t('seller.inbox.unknownBuyer') || 'Unknown Buyer'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
              {t('seller.inbox.deliveryInfo') || 'Delivery Information'}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} style={{ color: styles.textMuted }} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                    {rfq.deliveryLocation || '-'}
                  </p>
                  {rfq.deliveryCity && (
                    <p className="text-xs" style={{ color: styles.textMuted }}>
                      {rfq.deliveryCity}, {rfq.deliveryCountry || 'SA'}
                    </p>
                  )}
                </div>
              </div>
              {rfq.requiredDeliveryDate && (
                <div className="flex items-center gap-3">
                  <Calendar size={18} style={{ color: styles.textMuted }} />
                  <div>
                    <p className="text-sm" style={{ color: styles.textSecondary }}>
                      {t('seller.inbox.requiredBy') || 'Required by'}:
                    </p>
                    <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                      {new Date(rfq.requiredDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buyer Message */}
          {rfq.message && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
            >
              <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
                {t('seller.inbox.buyerMessage') || 'Buyer Message'}
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: styles.textSecondary }}>
                {rfq.message}
              </p>
            </div>
          )}

          {/* Priority */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
              {t('seller.inbox.priorityAssessment') || 'Priority Assessment'}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightning size={18} weight="fill" style={{ color: getPriorityLevelConfig(rfq.priorityLevel).textColor.replace('text-', '') }} />
                <span className="font-medium" style={{ color: styles.textPrimary }}>
                  {getPriorityLevelConfig(rfq.priorityLevel).label} {t('common.priority') || 'Priority'}
                </span>
              </div>
              {rfq.priorityScore !== undefined && (
                <span
                  className="px-2 py-1 rounded text-sm font-semibold tabular-nums"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  {t('seller.inbox.score') || 'Score'}: {rfq.priorityScore}
                </span>
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: styles.textMuted }}>
              {t('seller.inbox.priorityNote') || 'Priority is automatically calculated based on quantity, delivery urgency, and buyer history.'}
            </p>
          </div>

          {/* Internal Notes */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: styles.textMuted }}>
                {t('seller.inbox.internalNotes') || 'Internal Notes'}
              </p>
              <button
                onClick={onAddNote}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: styles.info }}
              >
                <NotePencil size={14} />
                {rfq.internalNotes ? (t('common.edit') || 'Edit') : (t('common.add') || 'Add')}
              </button>
            </div>
            {rfq.internalNotes ? (
              <p className="text-sm whitespace-pre-wrap" style={{ color: styles.textSecondary }}>
                {rfq.internalNotes}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: styles.textMuted }}>
                {t('seller.inbox.noNotes') || 'No notes yet'}
              </p>
            )}
          </div>

          {/* Ignored Reason */}
          {rfq.status === 'ignored' && rfq.ignoredReason && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${styles.error}08`, border: `1px solid ${styles.error}20` }}
            >
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: styles.error }}>
                {t('seller.inbox.ignoredReason') || 'Ignored Reason'}
              </p>
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                {rfq.ignoredReason}
              </p>
            </div>
          )}

          {/* History Timeline */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: styles.textMuted }}>
              {t('seller.inbox.history') || 'History'}
            </p>
            {loadingHistory ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 rounded-full" style={{ borderColor: styles.border, borderTopColor: styles.info }} />
                <span className="text-sm" style={{ color: styles.textMuted }}>{t('common.loading') || 'Loading...'}</span>
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {t('seller.inbox.noHistory') || 'No history available'}
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: index === 0 ? styles.info : styles.textMuted }}
                      />
                      {index < history.length - 1 && (
                        <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: styles.border }} />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                        {formatEventType(event.eventType)}
                      </p>
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-4 border-t space-y-2"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          {/* Create Quote - Primary action when under review */}
          {canCreateQuote && (
            <button
              onClick={onCreateQuote}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: styles.success,
                color: '#fff',
              }}
            >
              <CurrencyDollar size={18} weight="bold" />
              {t('seller.inbox.createQuote') || 'Create Quote'}
            </button>
          )}
          {canMarkUnderReview && (
            <button
              onClick={onMarkUnderReview}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
                color: styles.isDark ? '#0F1115' : '#E6E8EB',
              }}
            >
              <MagnifyingGlassPlus size={18} weight="bold" />
              {t('seller.inbox.markUnderReview') || 'Mark as Under Review'}
            </button>
          )}
          {canMarkIgnored && (
            <button
              onClick={onMarkIgnored}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
            >
              <XCircle size={18} />
              {t('seller.inbox.markIgnored') || 'Mark as Ignored'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// Helper function to format event types
function formatEventType(eventType: string): string {
  const labels: Record<string, string> = {
    RFQ_CREATED: 'RFQ Created',
    RFQ_VIEWED: 'Viewed by Seller',
    RFQ_UNDER_REVIEW: 'Marked Under Review',
    RFQ_IGNORED: 'Marked as Ignored',
    NOTE_ADDED: 'Note Added',
    STATUS_CHANGED: 'Status Changed',
  };
  return labels[eventType] || eventType;
}

export default RFQsInbox;
