// =============================================================================
// RFQ Marketplace Page - Professional Table Layout (Matching Listings)
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MagnifyingGlass,
  Funnel,
  CaretRight,
  CaretDown,
  CaretUp,
  BookmarkSimple,
  PaperPlaneTilt,
  Package,
  Timer,
  X,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  FileText,
} from 'phosphor-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { usePortal } from '../../context/PortalContext';
import { Button, Select, EmptyState, SkeletonTableRow } from '../../components';
import { rfqMarketplaceService } from '../../services/rfqMarketplaceService';
import {
  MarketplaceRFQ,
  MarketplaceFilters,
  MarketplaceStats,
  MarketplaceSortBy,
  getDeadlineUrgency,
  getCompetitionLevel,
  getCompetitionLevelConfig,
  formatQuantity,
  RFQ_CATEGORIES,
} from '../../types/rfq-marketplace.types';
import { SubmitMarketplaceQuoteModal } from '../components/SubmitMarketplaceQuoteModal';

// =============================================================================
// Types
// =============================================================================

interface RFQMarketplaceProps {
  onNavigate: (page: string) => void;
}

// =============================================================================
// Column Helper
// =============================================================================

const columnHelper = createColumnHelper<MarketplaceRFQ>();

// =============================================================================
// Component
// =============================================================================

export const RFQMarketplace: React.FC<RFQMarketplaceProps> = ({ onNavigate }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // Data state
  const [rfqs, setRfqs] = useState<MarketplaceRFQ[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<MarketplaceSortBy>('newest');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'browse' | 'saved'>('browse');

  // Modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<MarketplaceRFQ | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load RFQs
  const loadRFQs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: MarketplaceFilters = {
        search: debouncedSearch || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deadline: deadlineFilter !== 'all' ? (deadlineFilter as any) : undefined,
        sortBy,
        savedOnly: viewMode === 'saved',
        page: 1,
        limit: 50,
      };

      const response = await rfqMarketplaceService.getMarketplaceRFQs(filters);
      setRfqs(response.rfqs);
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to load RFQs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, categoryFilter, deadlineFilter, sortBy, viewMode]);

  useEffect(() => {
    loadRFQs();
  }, [loadRFQs]);

  // Toggle save
  const handleToggleSave = useCallback(async (rfq: MarketplaceRFQ) => {
    try {
      if (rfq.isSaved) {
        await rfqMarketplaceService.unsaveRFQ(rfq.id);
      } else {
        await rfqMarketplaceService.saveRFQ(rfq.id);
      }

      setRfqs((prev) => prev.map((r) => (r.id === rfq.id ? { ...r, isSaved: !r.isSaved } : r)));
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  }, []);

  // Open quote modal
  const handleQuote = useCallback((rfq: MarketplaceRFQ) => {
    setSelectedRFQ(rfq);
    setShowQuoteModal(true);
  }, []);

  // Handle quote submitted
  const handleQuoteSubmitted = useCallback(() => {
    setShowQuoteModal(false);
    setSelectedRFQ(null);
    loadRFQs();
  }, [loadRFQs]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || deadlineFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDeadlineFilter('all');
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        meta: { align: 'center' as const },
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 rounded border-2 cursor-pointer accent-blue-600"
            style={{ borderColor: styles.border }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded border-2 cursor-pointer accent-blue-600"
            style={{ borderColor: styles.border }}
          />
        ),
        size: 40,
      }),
      columnHelper.accessor('partName', {
        meta: { align: 'start' as const },
        header: 'Request',
        cell: ({ row }) => {
          const rfq = row.original;

          return (
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium" style={{ color: styles.textPrimary, fontSize: '0.85rem' }}>
                    {rfq.partName}
                  </p>
                  {rfq.hasQuoted && (
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                    >
                      <CheckCircle size={10} weight="fill" />
                      Quoted
                    </span>
                  )}
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: styles.textMuted }}>
                  {rfq.rfqNumber} · {rfq.category}
                </span>
              </div>
            </div>
          );
        },
        size: 280,
      }),
      columnHelper.accessor('quantity', {
        meta: { align: 'center' as const },
        header: 'Quantity',
        cell: ({ row }) => {
          const rfq = row.original;
          return (
            <span className="font-medium" style={{ color: styles.textPrimary, fontSize: '0.8rem' }}>
              {formatQuantity(rfq.quantity, rfq.unit)}
            </span>
          );
        },
        size: 100,
      }),
      columnHelper.display({
        id: 'targetPrice',
        meta: { align: 'center' as const },
        header: 'Target Price',
        cell: ({ row }) => {
          const rfq = row.original;
          if (!rfq.targetPrice) {
            return (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: styles.bgHover, color: styles.textMuted }}
              >
                Open
              </span>
            );
          }
          const currency = rfq.targetCurrency || 'SAR';
          return (
            <span className="font-medium" style={{ color: styles.textPrimary, fontSize: '0.8rem' }}>
              {rfq.targetPrice.toLocaleString()} {currency}
              <span style={{ color: styles.textMuted, fontSize: '0.7rem' }}>/{rfq.unit || 'unit'}</span>
            </span>
          );
        },
        size: 130,
      }),
      columnHelper.accessor('buyer', {
        meta: { align: 'center' as const },
        header: 'Buyer',
        cell: ({ row }) => {
          const rfq = row.original;
          const buyer = rfq.buyer;

          return (
            <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {buyer.companyName}
            </span>
          );
        },
        size: 120,
      }),
      columnHelper.accessor('deliveryLocation', {
        meta: { align: 'center' as const },
        header: 'Delivery',
        cell: ({ row }) => {
          const rfq = row.original;
          return (
            <span className="text-sm" style={{ color: styles.textSecondary }}>
              {rfq.deliveryCity || rfq.deliveryLocation || 'SA'}
            </span>
          );
        },
        size: 90,
      }),
      columnHelper.display({
        id: 'competition',
        meta: { align: 'center' as const },
        header: 'Competition',
        cell: ({ row }) => {
          const rfq = row.original;
          const level = getCompetitionLevel(rfq.totalQuotes);
          const config = getCompetitionLevelConfig(level);

          return (
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
              <span style={{ color: styles.textSecondary, fontSize: '0.8rem' }}>{rfq.totalQuotes} quotes</span>
            </div>
          );
        },
        size: 100,
      }),
      columnHelper.accessor('deadline', {
        meta: { align: 'center' as const },
        header: 'Deadline',
        cell: ({ row }) => {
          const rfq = row.original;

          if (!rfq.deadline) {
            return (
              <span className="text-xs" style={{ color: styles.textMuted }}>
                Open
              </span>
            );
          }

          const urgency = getDeadlineUrgency(rfq.deadline);

          const urgencyColors = {
            normal: styles.success,
            urgent: '#F59E0B',
            critical: styles.error,
            expired: styles.textMuted,
          };

          return (
            <div className="flex items-center justify-center gap-1">
              <Timer size={12} style={{ color: urgencyColors[urgency.urgency] }} className="flex-shrink-0" />
              <span className="font-medium" style={{ color: urgencyColors[urgency.urgency], fontSize: '0.8rem' }}>
                {urgency.text}
              </span>
            </div>
          );
        },
        size: 100,
      }),
      columnHelper.accessor('createdAt', {
        meta: { align: 'center' as const },
        header: 'Posted',
        cell: ({ row }) => (
          <span style={{ color: styles.textMuted, fontSize: '0.8rem' }}>
            {formatRelativeTime(row.original.createdAt)}
          </span>
        ),
        size: 90,
      }),
      columnHelper.display({
        id: 'actions',
        meta: { align: 'center' as const },
        header: 'Actions',
        cell: ({ row }) => {
          const rfq = row.original;

          // If already quoted, show Quoted status
          if (rfq.hasQuoted) {
            return (
              <div className="flex items-center justify-center">
                <span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                >
                  <CheckCircle size={14} weight="fill" />
                  Quoted
                </span>
              </div>
            );
          }

          // Not quoted - show bookmark and Quote button
          return (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handleToggleSave(rfq)}
                className="p-1.5 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: rfq.isSaved ? '#F59E0B' : styles.textMuted }}
                title={rfq.isSaved ? 'Unsave' : 'Save for later'}
              >
                <BookmarkSimple size={16} weight={rfq.isSaved ? 'fill' : 'regular'} />
              </button>
              <button
                onClick={() => handleQuote(rfq)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                style={{ backgroundColor: styles.info, color: '#fff' }}
              >
                <PaperPlaneTilt size={12} weight="fill" />
                Quote
              </button>
            </div>
          );
        },
        size: 140,
      }),
    ],
    [styles, handleToggleSave, handleQuote],
  );

  // Table instance
  const table = useReactTable({
    data: rfqs,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRowId: (row: any) => row.id,
  });

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              RFQ Marketplace
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              Browse open buyer requests and submit competitive quotes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('rfqs')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: styles.border, color: styles.textPrimary, backgroundColor: styles.bgCard }}
            >
              <FileText size={16} />
              My Quotes
            </button>
            <Button onClick={loadRFQs}>
              <ArrowsClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className={`flex items-center gap-6 mb-6 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
            <QuickStat label="Open Requests" value={stats.totalOpen} styles={styles} />
            <QuickStat label="New Today" value={stats.newToday} color={styles.success} styles={styles} />
            {stats.expiringToday > 0 && (
              <QuickStat
                label="Expiring Today"
                value={stats.expiringToday}
                color={styles.error}
                styles={styles}
                warning
              />
            )}
            <QuickStat label="Saved" value={stats.savedCount} styles={styles} />
            <QuickStat label="My Quotes" value={stats.quotedCount} color={styles.info} styles={styles} />
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('browse')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'browse' ? styles.bgCard : 'transparent',
              color: viewMode === 'browse' ? styles.textPrimary : styles.textMuted,
              border: `1px solid ${viewMode === 'browse' ? styles.border : 'transparent'}`,
            }}
          >
            <Package size={14} />
            Browse All
          </button>
          <button
            onClick={() => setViewMode('saved')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'saved' ? styles.bgCard : 'transparent',
              color: viewMode === 'saved' ? styles.textPrimary : styles.textMuted,
              border: `1px solid ${viewMode === 'saved' ? styles.border : 'transparent'}`,
            }}
          >
            <BookmarkSimple size={14} weight={viewMode === 'saved' ? 'fill' : 'regular'} />
            Saved
            {stats?.savedCount ? (
              <span
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
              >
                {stats.savedCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl border mb-4" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
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
                <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: styles.info, color: '#fff' }}>
                  Active
                </span>
              )}
            </button>
            <div className="flex items-center gap-3">
              <Select
                value={sortBy}
                onChange={(v) => setSortBy(v as MarketplaceSortBy)}
                options={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'expiring_soon', label: 'Expiring Soon' },
                  { value: 'highest_quantity', label: 'Highest Quantity' },
                  { value: 'best_match', label: 'Best Match' },
                ]}
              />
            </div>
          </div>

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
                  placeholder="Search by part name, RFQ number..."
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

              {/* Category */}
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="Category"
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...RFQ_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
                ]}
              />

              {/* Deadline */}
              <Select
                value={deadlineFilter}
                onChange={setDeadlineFilter}
                placeholder="Deadline"
                options={[
                  { value: 'all', label: 'All Deadlines' },
                  { value: 'urgent', label: 'Urgent (< 3 days)' },
                  { value: 'expiring_today', label: 'Expiring Today' },
                ]}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                  style={{ color: styles.error }}
                >
                  <X size={12} /> Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <SkeletonTableRow key={i} columns={8} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={Warning}
              title="Error Loading Requests"
              description={error}
              action={
                <Button onClick={loadRFQs}>
                  <ArrowsClockwise size={16} className="mr-2" />
                  Retry
                </Button>
              }
            />
          </div>
        ) : rfqs.length === 0 ? (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={viewMode === 'saved' ? BookmarkSimple : Package}
              title={viewMode === 'saved' ? 'No Saved Requests' : 'No Open Requests'}
              description={
                viewMode === 'saved'
                  ? 'Save RFQs you want to quote on later.'
                  : 'No open buyer requests right now. Check back soon!'
              }
            />
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <div className="overflow-x-auto">
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
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
                        const align =
                          (header.column.columnDef.meta as { align?: 'start' | 'center' | 'end' })?.align || 'start';
                        return (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                            style={{
                              color: styles.textMuted,
                              width: header.getSize(),
                              textAlign: align === 'end' ? 'right' : align,
                            }}
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'end' ? 'justify-end' : ''} ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const rfq = row.original as any;
                    const urgency = getDeadlineUrgency(rfq.deadline);
                    const isUrgent = urgency.urgency === 'critical' || urgency.urgency === 'urgent';

                    return (
                      <tr
                        key={row.id}
                        className="group transition-colors"
                        style={{
                          borderBottom:
                            index === table.getRowModel().rows.length - 1 ? 'none' : `1px solid ${styles.tableBorder}`,
                          backgroundColor: row.getIsSelected()
                            ? 'rgba(59,130,246,0.05)'
                            : isUrgent
                              ? 'rgba(245,158,11,0.03)'
                              : 'transparent',
                          borderLeft: isUrgent ? `3px solid #F59E0B` : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!row.getIsSelected()) {
                            e.currentTarget.style.backgroundColor = styles.tableRowHover;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!row.getIsSelected()) {
                            e.currentTarget.style.backgroundColor = isUrgent ? 'rgba(245,158,11,0.03)' : 'transparent';
                          }
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const align =
                            (cell.column.columnDef.meta as { align?: 'start' | 'center' | 'end' })?.align || 'start';
                          return (
                            <td
                              key={cell.id}
                              className="px-4 py-3"
                              style={{
                                width: cell.column.getSize(),
                                verticalAlign: 'middle',
                                textAlign: align === 'end' ? 'right' : align,
                              }}
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
              <span>Showing {rfqs.length} requests</span>
              {Object.keys(rowSelection).length > 0 && (
                <span className="font-medium" style={{ color: styles.textPrimary }}>
                  {Object.keys(rowSelection).length} selected
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quote Modal */}
      {showQuoteModal && selectedRFQ && (
        <SubmitMarketplaceQuoteModal
          isOpen={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false);
            setSelectedRFQ(null);
          }}
          rfq={selectedRFQ}
          onSuccess={handleQuoteSubmitted}
        />
      )}
    </div>
  );
};

// =============================================================================
// Quick Stat Component
// =============================================================================

const QuickStat: React.FC<{
  label: string;
  value: number;
  color?: string;
  styles: ReturnType<typeof usePortal>['styles'];
  warning?: boolean;
}> = ({ label, value, color, styles, warning }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm" style={{ color: styles.textMuted }}>
      {label}:
    </span>
    <span
      className={`text-sm font-semibold ${warning ? 'flex items-center gap-1' : ''}`}
      style={{ color: color || styles.textPrimary }}
    >
      {warning && <Warning size={12} />}
      {value}
    </span>
  </div>
);

export default RFQMarketplace;
