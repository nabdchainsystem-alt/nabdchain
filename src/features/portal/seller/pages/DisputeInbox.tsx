import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  WarningCircle,
  MagnifyingGlass,
  Funnel,
  CaretDown,
  CaretUp,
  Eye,
  X,
  CaretLeft,
  CaretRight,
  Clock,
  CheckCircle,
  Warning,
  FileText,
  ArrowsClockwise,
  Spinner,
  ShieldWarning,
  User,
  PaperPlaneTilt,
  Coins,
  XCircle,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { EmptyState, Select, SkeletonTableRow } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { disputeService } from '../../services/disputeService';
import {
  MarketplaceDispute,
  DisputeStatus,
  DisputeReason,
  DisputeStats,
  DisputeEvent,
  SellerResponseType,
  getDisputeStatusConfig,
  getDisputeReasonLabel,
  getPriorityConfig,
  getTimeUntilDeadline,
  canSellerRespond,
  PriorityLevel,
} from '../../types/dispute.types';

interface DisputeInboxProps {
  onNavigate: (page: string) => void;
}

// Helper functions
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

// Status Badge Component
const StatusBadge: React.FC<{ status: DisputeStatus }> = ({ status }) => {
  const config = getDisputeStatusConfig(status);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {config.label}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  const config = getPriorityConfig(priority);

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {config.label}
    </span>
  );
};

// Deadline Badge Component
const DeadlineBadge: React.FC<{ deadline: string | undefined; status: string }> = ({ deadline, status }) => {
  const { styles } = usePortal();

  if (!deadline || !['open', 'under_review'].includes(status)) return null;

  const { isOverdue, text } = getTimeUntilDeadline(deadline);

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{
        backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        color: isOverdue ? styles.error : styles.info,
      }}
    >
      <Clock size={10} />
      {text}
    </span>
  );
};

export const DisputeInbox: React.FC<DisputeInboxProps> = ({ _onNavigate }) => {
  const { styles, direction } = usePortal();
  const { getToken } = useAuth();

  // State for API data
  const [disputes, setDisputes] = useState<MarketplaceDispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'responseDeadline', desc: false }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<MarketplaceDispute | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'details' | 'timeline'>('details');

  // Response form state
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<SellerResponseType>('propose_resolution');
  const [responseText, setResponseText] = useState('');
  const [proposedResolution, setProposedResolution] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch disputes and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) {
          setError('Authentication required');
          return;
        }

        const [disputesRes, statsRes] = await Promise.all([
          disputeService.getSellerDisputes(token, { limit: 100 }),
          disputeService.getSellerDisputeStats(token),
        ]);

        setDisputes(disputesRes.disputes);
        setStats(statsRes);
      } catch (err) {
        console.error('Failed to fetch disputes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch disputes');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getToken]);

  // Open dispute detail modal
  const openDetail = useCallback((dispute: MarketplaceDispute) => {
    setSelectedDispute(dispute);
    setDetailTab('details');
    setShowDetailModal(true);
    setActionError(null);
  }, []);

  // Mark as under review
  const handleMarkUnderReview = async (dispute: MarketplaceDispute) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const updated = await disputeService.markAsUnderReview(token, dispute.id);

      setDisputes((prev) => prev.map((d) => (d.id === dispute.id ? { ...d, ...updated } : d)));
      if (selectedDispute?.id === dispute.id) {
        setSelectedDispute({ ...selectedDispute, ...updated });
      }
    } catch (err) {
      console.error('Failed to mark as under review:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  // Open response modal
  const openResponseModal = useCallback((dispute: MarketplaceDispute) => {
    setSelectedDispute(dispute);
    setShowResponseModal(true);
    setResponseType('propose_resolution');
    setResponseText('');
    setProposedResolution('');
    setProposedAmount('');
    setActionError(null);
  }, []);

  // Submit response
  const handleSubmitResponse = async () => {
    if (!selectedDispute || !responseText.trim()) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const updated = await disputeService.respondToDispute(token, selectedDispute.id, {
        responseType,
        response: responseText,
        proposedResolution: responseType === 'propose_resolution' ? proposedResolution : undefined,
        proposedAmount:
          responseType === 'propose_resolution' && proposedAmount ? parseFloat(proposedAmount) : undefined,
      });

      setDisputes((prev) => prev.map((d) => (d.id === selectedDispute.id ? { ...d, ...updated } : d)));
      setShowResponseModal(false);
      setShowDetailModal(false);
      setSelectedDispute(null);
    } catch (err) {
      console.error('Failed to submit response:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered data
  const filteredData = useMemo(() => {
    return disputes.filter((dispute) => {
      if (statusFilter !== 'all' && dispute.status !== statusFilter) return false;
      return true;
    });
  }, [disputes, statusFilter]);

  // Column helper
  const columnHelper = createColumnHelper<MarketplaceDispute>();

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('disputeNumber', {
        header: 'Dispute #',
        cell: (info) => (
          <div>
            <span className="font-mono text-xs" style={{ color: styles.textPrimary }}>
              {info.getValue()}
            </span>
            <div className="text-[10px] font-mono" style={{ color: styles.textMuted }}>
              Order: {info.row.original.orderNumber}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('buyerName', {
        header: 'Buyer',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <User size={14} style={{ color: styles.textMuted }} />
            </div>
            <span className="text-sm" style={{ color: styles.textPrimary }}>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('itemName', {
        header: 'Item',
        cell: (info) => {
          const dispute = info.row.original;
          const reasonLabel = getDisputeReasonLabel(dispute.reason as DisputeReason);
          return (
            <div>
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {info.getValue()}
              </span>
              <div className="text-xs" style={{ color: styles.textMuted }}>
                {reasonLabel.label}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('totalPrice', {
        header: 'Value',
        cell: (info) => (
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {formatCurrency(info.getValue(), info.row.original.currency)}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <StatusBadge status={info.getValue() as DisputeStatus} />
            <PriorityBadge priority={info.row.original.priorityLevel as PriorityLevel} />
          </div>
        ),
      }),
      columnHelper.accessor('responseDeadline', {
        header: 'Response Due',
        cell: (info) => <DeadlineBadge deadline={info.getValue()} status={info.row.original.status} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="w-full text-center block">Actions</span>,
        cell: (info) => {
          const dispute = info.row.original;
          const canRespond = canSellerRespond(dispute.status as DisputeStatus);
          const isOpen = dispute.status === 'open';

          return (
            <div className="flex items-center justify-center gap-1">
              {isOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkUnderReview(dispute);
                  }}
                  className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: styles.info }}
                >
                  Review
                </button>
              )}
              {canRespond && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openResponseModal(dispute);
                  }}
                  className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: styles.success }}
                >
                  Respond
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetail(dispute);
                }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="View Details"
              >
                <Eye size={16} />
              </button>
            </div>
          );
        },
      }),
    ],
    [columnHelper, styles, openDetail, openResponseModal, handleMarkUnderReview],
  );

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setGlobalFilter('');
  };

  const hasActiveFilters = statusFilter !== 'all' || globalFilter;

  // Count of disputes needing response
  const needsResponseCount = disputes.filter((d) => ['open', 'under_review'].includes(d.status)).length;

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              Dispute Inbox
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              Manage and respond to buyer disputes
            </p>
          </div>
          {needsResponseCount > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
            >
              <Warning size={16} style={{ color: '#f59e0b' }} weight="fill" />
              <span className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                {needsResponseCount} disputes need response
              </span>
            </div>
          )}
        </div>

        {/* Loading State with Shimmer */}
        {isLoading && (
          <div>
            {/* Quick Stats Skeleton */}
            <div className="flex items-center gap-6 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="shimmer w-3 h-3 rounded" style={{ animationDelay: `${i * 40}ms` }} />
                  <div className="shimmer h-4 w-12 rounded" style={{ animationDelay: `${i * 40}ms` }} />
                  <div
                    className="shimmer h-5 w-6 rounded font-semibold"
                    style={{ animationDelay: `${i * 40 + 20}ms` }}
                  />
                </div>
              ))}
            </div>
            {/* Table Skeleton */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${styles.border}` }}>
                    {['Dispute', 'Order', 'Status', 'Priority', 'Deadline', ''].map((_, i) => (
                      <th key={i} className="px-4 py-3">
                        <div className="shimmer h-3 w-16 rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <SkeletonTableRow key={i} columns={6} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div
            className="p-4 rounded-lg border mb-6"
            style={{ backgroundColor: `${styles.error}10`, borderColor: styles.error }}
          >
            <div className="flex items-center gap-2">
              <WarningCircle size={20} style={{ color: styles.error }} />
              <span style={{ color: styles.error }}>{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* Quick Stats */}
            {stats && (
              <div
                className={`flex items-center gap-6 mb-6 flex-wrap ${direction === 'rtl' ? 'flex-row-reverse justify-end' : ''}`}
              >
                <QuickStat label="New" value={stats.open} color="#f59e0b" styles={styles} warning={stats.open > 0} />
                <QuickStat label="Under Review" value={stats.underReview} color={styles.info} styles={styles} />
                <QuickStat label="Awaiting Buyer" value={stats.sellerResponded} color="#8b5cf6" styles={styles} />
                <QuickStat label="Resolved" value={stats.resolved} color={styles.success} styles={styles} />
                {stats.escalated > 0 && (
                  <QuickStat label="Escalated" value={stats.escalated} color={styles.error} styles={styles} warning />
                )}
                <QuickStat
                  label="Resolution Rate"
                  value={`${stats.resolutionRate}%`}
                  color={stats.resolutionRate >= 80 ? styles.success : '#f59e0b'}
                  styles={styles}
                />
              </div>
            )}

            {/* Filter Bar */}
            <div
              className="rounded-xl border mb-6"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              {/* Filter Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: styles.border }}
              >
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
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                    style={{ color: styles.textMuted }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}
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
                      placeholder="Search disputes..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="outline-none text-sm bg-transparent flex-1"
                      style={{ color: styles.textPrimary }}
                    />
                    {globalFilter && (
                      <button onClick={() => setGlobalFilter('')} style={{ color: styles.textMuted }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'open', label: 'New' },
                      { value: 'under_review', label: 'Under Review' },
                      { value: 'seller_responded', label: 'Awaiting Buyer' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'rejected', label: 'Rejected' },
                      { value: 'escalated', label: 'Escalated' },
                      { value: 'closed', label: 'Closed' },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Table */}
            {filteredData.length === 0 ? (
              <EmptyState
                icon={ShieldWarning}
                title="No Disputes"
                description="You don't have any disputes at the moment. Keep up the good work!"
              />
            ) : (
              <div>
                <div className="overflow-hidden rounded-lg border" style={{ borderColor: styles.border }}>
                  <table className="min-w-full">
                    <thead style={{ backgroundColor: styles.bgSecondary }}>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-4 py-3 text-xs font-semibold cursor-pointer select-none"
                              style={{
                                color: styles.textSecondary,
                                textAlign: direction === 'rtl' ? 'right' : 'left',
                              }}
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
                          onClick={() => openDetail(row.original)}
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

                {/* Pagination */}
                <div
                  className="flex items-center justify-between px-4 py-3 mt-4 rounded-lg border"
                  style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
                >
                  <div className="text-sm" style={{ color: styles.textMuted }}>
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      filteredData.length,
                    )}{' '}
                    of {filteredData.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                      style={{ color: styles.textMuted }}
                    >
                      {direction === 'rtl' ? <CaretRight size={18} /> : <CaretLeft size={18} />}
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
                      {direction === 'rtl' ? <CaretLeft size={18} /> : <CaretRight size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dispute Detail Modal */}
            {showDetailModal && selectedDispute && (
              <SellerDisputeDetailModal
                dispute={selectedDispute}
                activeTab={detailTab}
                onTabChange={setDetailTab}
                onClose={() => {
                  setShowDetailModal(false);
                  setSelectedDispute(null);
                }}
                onRespond={() => {
                  setShowDetailModal(false);
                  openResponseModal(selectedDispute);
                }}
                onMarkReview={() => handleMarkUnderReview(selectedDispute)}
              />
            )}

            {/* Response Modal */}
            {showResponseModal && selectedDispute && (
              <ResponseModal
                dispute={selectedDispute}
                onClose={() => {
                  setShowResponseModal(false);
                  setSelectedDispute(null);
                }}
                onSubmit={handleSubmitResponse}
                responseType={responseType}
                onResponseTypeChange={setResponseType}
                responseText={responseText}
                onResponseTextChange={setResponseText}
                proposedResolution={proposedResolution}
                onProposedResolutionChange={setProposedResolution}
                proposedAmount={proposedAmount}
                onProposedAmountChange={setProposedAmount}
                isSubmitting={isSubmitting}
                error={actionError}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Seller Dispute Detail Modal Component
const SellerDisputeDetailModal: React.FC<{
  dispute: MarketplaceDispute;
  activeTab: 'details' | 'timeline';
  onTabChange: (tab: 'details' | 'timeline') => void;
  onClose: () => void;
  onRespond: () => void;
  onMarkReview: () => void;
}> = ({ dispute, activeTab, onTabChange, onClose, onRespond, onMarkReview }) => {
  const { styles } = usePortal();
  const { getToken } = useAuth();
  const [timeline, setTimeline] = useState<DisputeEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const _statusConfig = getDisputeStatusConfig(dispute.status as DisputeStatus);
  const reasonLabel = getDisputeReasonLabel(dispute.reason as DisputeReason);
  const canRespond = canSellerRespond(dispute.status as DisputeStatus);
  const isOpen = dispute.status === 'open';

  // Fetch timeline when tab changes
  useEffect(() => {
    if (activeTab === 'timeline' && timeline.length === 0) {
      const fetchTimeline = async () => {
        try {
          setLoadingTimeline(true);
          const token = await getToken();
          if (token) {
            const events = await disputeService.getDisputeHistory(token, dispute.id);
            setTimeline(events);
          }
        } catch (err) {
          console.error('Failed to fetch timeline:', err);
        } finally {
          setLoadingTimeline(false);
        }
      };
      fetchTimeline();
    }
  }, [activeTab, dispute.id, getToken, timeline.length]);

  const tabs = [
    { id: 'details' as const, label: 'Details', icon: FileText },
    { id: 'timeline' as const, label: 'Timeline', icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl flex flex-col"
        style={{ backgroundColor: styles.bgCard }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: styles.border }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
              {dispute.disputeNumber}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={dispute.status as DisputeStatus} />
              <PriorityBadge priority={dispute.priorityLevel as PriorityLevel} />
              <DeadlineBadge deadline={dispute.responseDeadline} status={dispute.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: styles.border }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: isActive ? styles.info : styles.textMuted,
                }}
              >
                <tab.icon size={16} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: styles.info }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Buyer Info */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                  Buyer Information
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: styles.bgCard }}
                  >
                    <User size={20} style={{ color: styles.textMuted }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>
                      {dispute.buyerName}
                    </p>
                    {dispute.buyerEmail && (
                      <p className="text-sm" style={{ color: styles.textMuted }}>
                        {dispute.buyerEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                  Order Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span style={{ color: styles.textMuted }}>Order:</span>
                    <p className="font-mono" style={{ color: styles.textPrimary }}>
                      {dispute.orderNumber}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>Item:</span>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>
                      {dispute.itemName}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>Quantity:</span>
                    <p style={{ color: styles.textPrimary }}>{dispute.quantity}</p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>Total Value:</span>
                    <p className="font-semibold" style={{ color: styles.textPrimary }}>
                      {formatCurrency(dispute.totalPrice, dispute.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dispute Details */}
              <div
                className="p-4 rounded-lg border"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: '#f59e0b' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                  Dispute Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span style={{ color: styles.textMuted }}>Reason:</span>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>
                      {reasonLabel.label}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>Description:</span>
                    <p style={{ color: styles.textPrimary }}>{dispute.description}</p>
                  </div>
                  {dispute.requestedResolution && (
                    <div>
                      <span style={{ color: styles.textMuted }}>Buyer's Requested Resolution:</span>
                      <p style={{ color: styles.textPrimary }}>{dispute.requestedResolution}</p>
                    </div>
                  )}
                  {dispute.requestedAmount && (
                    <div>
                      <span style={{ color: styles.textMuted }}>Requested Amount:</span>
                      <p className="font-semibold" style={{ color: styles.error }}>
                        {formatCurrency(dispute.requestedAmount, dispute.currency)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Your Response (if submitted) */}
              {dispute.sellerResponseType && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                    Your Response
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p style={{ color: styles.textPrimary }}>{dispute.sellerResponse}</p>
                    {dispute.sellerProposedResolution && (
                      <div className="mt-2 p-3 rounded" style={{ backgroundColor: styles.bgPrimary }}>
                        <span style={{ color: styles.textMuted }}>Proposed:</span>
                        <p className="font-medium" style={{ color: styles.textPrimary }}>
                          {dispute.sellerProposedResolution}
                        </p>
                        {dispute.sellerProposedAmount && (
                          <p className="font-semibold mt-1" style={{ color: styles.textPrimary }}>
                            Amount: {formatCurrency(dispute.sellerProposedAmount, dispute.currency)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-1">
              {loadingTimeline ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size={24} className="animate-spin" style={{ color: styles.textMuted }} />
                </div>
              ) : timeline.length > 0 ? (
                <div className="relative">
                  {timeline.map((event, idx) => {
                    const isLast = idx === timeline.length - 1;

                    return (
                      <div key={event.id} className="flex gap-3 pb-4">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${styles.info}20`, color: styles.info }}
                          >
                            <FileText size={14} weight="fill" />
                          </div>
                          {!isLast && <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: styles.border }} />}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                            {event.eventType.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs" style={{ color: styles.textMuted }}>
                              {formatDate(event.createdAt)}
                            </span>
                            <span style={{ color: styles.textMuted }}>•</span>
                            <span className="text-xs capitalize" style={{ color: styles.textMuted }}>
                              {event.actorType}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock size={48} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    No timeline events yet
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div
          className="flex items-center justify-end gap-2 p-4 border-t"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          {isOpen && (
            <button
              onClick={onMarkReview}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: styles.info }}
            >
              <ArrowsClockwise size={16} />
              Mark as Under Review
            </button>
          )}
          {canRespond && (
            <button
              onClick={onRespond}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: styles.success, color: '#fff' }}
            >
              <PaperPlaneTilt size={16} />
              Respond
            </button>
          )}
          {!canRespond && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: styles.bgCard, color: styles.textPrimary }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Response Modal Component
const ResponseModal: React.FC<{
  dispute: MarketplaceDispute;
  onClose: () => void;
  onSubmit: () => void;
  responseType: SellerResponseType;
  onResponseTypeChange: (type: SellerResponseType) => void;
  responseText: string;
  onResponseTextChange: (text: string) => void;
  proposedResolution: string;
  onProposedResolutionChange: (text: string) => void;
  proposedAmount: string;
  onProposedAmountChange: (amount: string) => void;
  isSubmitting: boolean;
  error: string | null;
}> = ({
  dispute,
  onClose,
  onSubmit,
  responseType,
  onResponseTypeChange,
  responseText,
  onResponseTextChange,
  proposedResolution,
  onProposedResolutionChange,
  proposedAmount,
  onProposedAmountChange,
  isSubmitting,
  error,
}) => {
  const { styles } = usePortal();

  const responseTypes = [
    {
      id: 'accept_responsibility' as SellerResponseType,
      label: 'Accept Responsibility',
      description: "Accept the buyer's claim and offer resolution",
      icon: CheckCircle,
      color: styles.success,
    },
    {
      id: 'propose_resolution' as SellerResponseType,
      label: 'Propose Resolution',
      description: 'Offer a compromise or alternative solution',
      icon: Coins,
      color: '#8b5cf6',
    },
    {
      id: 'reject' as SellerResponseType,
      label: 'Reject Claim',
      description: "Dispute the buyer's claim with explanation",
      icon: XCircle,
      color: styles.error,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col"
        style={{ backgroundColor: styles.bgCard }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: styles.border }}>
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Respond to Dispute
          </h2>
          <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
            {dispute.disputeNumber} - {dispute.itemName}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Response Type Selection */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: styles.textPrimary }}>
              Response Type
            </label>
            <div className="space-y-2">
              {responseTypes.map((type) => {
                const isSelected = responseType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => onResponseTypeChange(type.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors"
                    style={{
                      borderColor: isSelected ? type.color : styles.border,
                      backgroundColor: isSelected ? `${type.color}10` : 'transparent',
                    }}
                  >
                    <type.icon
                      size={20}
                      style={{ color: isSelected ? type.color : styles.textMuted }}
                      weight={isSelected ? 'fill' : 'regular'}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: isSelected ? type.color : styles.textPrimary }}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Response Text */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: styles.textPrimary }}>
              Your Response
            </label>
            <textarea
              value={responseText}
              onChange={(e) => onResponseTextChange(e.target.value)}
              placeholder="Explain your response to the buyer's dispute..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none"
              style={{
                borderColor: styles.border,
                backgroundColor: styles.bgPrimary,
                color: styles.textPrimary,
              }}
            />
          </div>

          {/* Proposed Resolution (for propose_resolution type) */}
          {responseType === 'propose_resolution' && (
            <>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: styles.textPrimary }}>
                  Proposed Resolution
                </label>
                <input
                  type="text"
                  value={proposedResolution}
                  onChange={(e) => onProposedResolutionChange(e.target.value)}
                  placeholder="e.g., Partial refund, Replacement, Store credit..."
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgPrimary,
                    color: styles.textPrimary,
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: styles.textPrimary }}>
                  Proposed Amount (optional)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: styles.textMuted }}>
                    {dispute.currency}
                  </span>
                  <input
                    type="number"
                    value={proposedAmount}
                    onChange={(e) => onProposedAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: `${styles.error}15` }}>
              <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
              <span className="text-sm" style={{ color: styles.error }}>
                {error}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: styles.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!responseText.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: styles.success, color: '#fff' }}
          >
            {isSubmitting ? <Spinner size={16} className="animate-spin" /> : <PaperPlaneTilt size={16} />}
            Submit Response
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Stat Component
const QuickStat: React.FC<{
  label: string;
  value: number | string;
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

export default DisputeInbox;
