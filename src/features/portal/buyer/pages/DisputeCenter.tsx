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
  ArrowUp,
  ArrowRight,
  ChatCircle,
  Package,
  Receipt,
  Scales,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { Container, PageHeader, Button, EmptyState, Select } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { disputeService } from '../../services/disputeService';
import { formatCurrency } from '../../utils';
import {
  MarketplaceDispute,
  DisputeStatus,
  DisputeReason,
  DisputeStats,
  DisputeEvent,
  getDisputeStatusConfig,
  getDisputeReasonLabel,
  getPriorityConfig,
  getTimeUntilDeadline,
  canBuyerAct,
  PriorityLevel,
} from '../../types/dispute.types';

interface DisputeCenterProps {
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

// Status Badge Component
const StatusBadge: React.FC<{ status: DisputeStatus }> = ({ status }) => {
  const { styles } = usePortal();
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
const DeadlineBadge: React.FC<{ deadline: string | undefined }> = ({ deadline }) => {
  const { styles } = usePortal();

  if (!deadline) return null;

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

export const DisputeCenter: React.FC<DisputeCenterProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();

  // State for API data
  const [disputes, setDisputes] = useState<MarketplaceDispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<MarketplaceDispute | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'details' | 'timeline'>('details');

  // Action states
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
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
          disputeService.getBuyerDisputes(token, { limit: 100 }),
          disputeService.getBuyerDisputeStats(token),
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

  // Handle accept resolution
  const handleAcceptResolution = async () => {
    if (!selectedDispute) return;

    setIsAccepting(true);
    setActionError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const updated = await disputeService.acceptResolution(token, selectedDispute.id);

      setDisputes(prev =>
        prev.map(d => (d.id === selectedDispute.id ? { ...d, ...updated } : d))
      );
      setSelectedDispute({ ...selectedDispute, ...updated });
    } catch (err) {
      console.error('Failed to accept resolution:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to accept resolution');
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle reject resolution
  const handleRejectResolution = async () => {
    if (!selectedDispute || !rejectReason.trim()) return;

    setIsRejecting(true);
    setActionError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const updated = await disputeService.rejectResolution(token, selectedDispute.id, {
        reason: rejectReason,
      });

      setDisputes(prev =>
        prev.map(d => (d.id === selectedDispute.id ? { ...d, ...updated } : d))
      );
      setSelectedDispute({ ...selectedDispute, ...updated });
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to reject resolution:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to reject resolution');
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle escalate dispute
  const handleEscalate = async () => {
    if (!selectedDispute || !escalateReason.trim()) return;

    setIsEscalating(true);
    setActionError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const updated = await disputeService.buyerEscalate(token, selectedDispute.id, {
        reason: escalateReason,
      });

      setDisputes(prev =>
        prev.map(d => (d.id === selectedDispute.id ? { ...d, ...updated } : d))
      );
      setSelectedDispute({ ...selectedDispute, ...updated });
      setShowEscalateModal(false);
      setEscalateReason('');
    } catch (err) {
      console.error('Failed to escalate dispute:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to escalate dispute');
    } finally {
      setIsEscalating(false);
    }
  };

  // Filtered data
  const filteredData = useMemo(() => {
    return disputes.filter(dispute => {
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
        cell: info => (
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
      columnHelper.accessor('itemName', {
        header: 'Item',
        cell: info => {
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
        cell: info => (
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {formatCurrency(info.getValue(), info.row.original.currency)}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <div className="flex flex-col gap-1">
            <StatusBadge status={info.getValue() as DisputeStatus} />
            <PriorityBadge priority={info.row.original.priorityLevel as PriorityLevel} />
          </div>
        ),
      }),
      columnHelper.accessor('responseDeadline', {
        header: 'Deadline',
        cell: info => <DeadlineBadge deadline={info.getValue()} />,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Filed',
        cell: info => (
          <span className="text-sm" style={{ color: styles.textMuted }}>
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="w-full text-center block">Actions</span>,
        cell: info => {
          const dispute = info.row.original;
          const canAct = canBuyerAct(dispute);

          return (
            <div className="flex items-center justify-center gap-1">
              {canAct && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}
                >
                  Action Needed
                </span>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  openDetail(dispute);
                }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="View Details"
              >
                <Eye size={16} />
              </button>
            </div>
          );
        },
      }),
    ],
    [columnHelper, styles, openDetail]
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

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title="Dispute Center"
          subtitle="Manage your disputes and track resolutions"
          actions={
            <Button onClick={() => onNavigate('orders')} variant="secondary">
              <Package size={16} className={direction === 'rtl' ? 'ml-2' : 'mr-2'} />
              My Orders
            </Button>
          }
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size={32} className="animate-spin" style={{ color: styles.textMuted }} />
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
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <StatCard
                  label="Open"
                  value={stats.open.toString()}
                  icon={WarningCircle}
                  color="#f59e0b"
                  highlight={stats.open > 0}
                />
                <StatCard
                  label="Under Review"
                  value={stats.underReview.toString()}
                  icon={ArrowsClockwise}
                  color={styles.info}
                />
                <StatCard
                  label="Awaiting Response"
                  value={stats.sellerResponded.toString()}
                  icon={ChatCircle}
                  color="#8b5cf6"
                  highlight={stats.sellerResponded > 0}
                />
                <StatCard
                  label="Resolved"
                  value={stats.resolved.toString()}
                  icon={CheckCircle}
                  color={styles.success}
                />
                <StatCard
                  label="Escalated"
                  value={stats.escalated.toString()}
                  icon={ArrowUp}
                  color={styles.error}
                  highlight={stats.escalated > 0}
                />
                <StatCard
                  label="Resolution Rate"
                  value={`${stats.resolutionRate}%`}
                  icon={Scales}
                  color={styles.success}
                />
              </div>
            )}

            {/* Filters */}
            <div
              className="flex flex-wrap items-center gap-3 p-4 mb-6 rounded-lg border"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              <Funnel size={18} style={{ color: styles.textMuted }} />

              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border flex-1 max-w-xs"
                style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
              >
                <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
                <input
                  type="text"
                  placeholder="Search disputes..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="bg-transparent outline-none text-sm flex-1"
                  style={{ color: styles.textPrimary }}
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'open', label: 'Open' },
                  { value: 'under_review', label: 'Under Review' },
                  { value: 'seller_responded', label: 'Awaiting Response' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'escalated', label: 'Escalated' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors"
                  style={{ color: styles.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>

            {/* Table */}
            {filteredData.length === 0 ? (
              <EmptyState
                icon={ShieldWarning}
                title="No Disputes"
                description="You haven't filed any disputes yet. If you have an issue with an order, you can open a dispute from the order details."
                action={
                  <Button onClick={() => onNavigate('orders')}>View My Orders</Button>
                }
              />
            ) : (
              <div>
                <div
                  className="overflow-hidden rounded-lg border"
                  style={{ borderColor: styles.border }}
                >
                  <table className="min-w-full">
                    <thead style={{ backgroundColor: styles.bgSecondary }}>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
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
                          onMouseEnter={e =>
                            (e.currentTarget.style.backgroundColor = styles.bgHover)
                          }
                          onMouseLeave={e =>
                            (e.currentTarget.style.backgroundColor = 'transparent')
                          }
                        >
                          {row.getVisibleCells().map(cell => (
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
                    Showing{' '}
                    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                      1}
                    -
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) *
                        table.getState().pagination.pageSize,
                      filteredData.length
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
              <DisputeDetailModal
                dispute={selectedDispute}
                activeTab={detailTab}
                onTabChange={setDetailTab}
                onClose={() => {
                  setShowDetailModal(false);
                  setSelectedDispute(null);
                }}
                onAccept={handleAcceptResolution}
                onReject={() => setShowRejectModal(true)}
                onEscalate={() => setShowEscalateModal(true)}
                isAccepting={isAccepting}
                actionError={actionError}
              />
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedDispute && (
              <RejectModal
                onClose={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                onSubmit={handleRejectResolution}
                reason={rejectReason}
                onReasonChange={setRejectReason}
                isSubmitting={isRejecting}
              />
            )}

            {/* Escalate Modal */}
            {showEscalateModal && selectedDispute && (
              <EscalateModal
                onClose={() => {
                  setShowEscalateModal(false);
                  setEscalateReason('');
                }}
                onSubmit={handleEscalate}
                reason={escalateReason}
                onReasonChange={setEscalateReason}
                isSubmitting={isEscalating}
              />
            )}
          </>
        )}
      </Container>
    </div>
  );
};

// Dispute Detail Modal Component
const DisputeDetailModal: React.FC<{
  dispute: MarketplaceDispute;
  activeTab: 'details' | 'timeline';
  onTabChange: (tab: 'details' | 'timeline') => void;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onEscalate: () => void;
  isAccepting: boolean;
  actionError: string | null;
}> = ({
  dispute,
  activeTab,
  onTabChange,
  onClose,
  onAccept,
  onReject,
  onEscalate,
  isAccepting,
  actionError,
}) => {
  const { styles, direction } = usePortal();
  const { getToken } = useAuth();
  const [timeline, setTimeline] = useState<DisputeEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const statusConfig = getDisputeStatusConfig(dispute.status as DisputeStatus);
  const reasonLabel = getDisputeReasonLabel(dispute.reason as DisputeReason);
  const canAct = canBuyerAct(dispute);
  const canEsc =
    ['under_review', 'seller_responded', 'rejected'].includes(dispute.status) && !dispute.isEscalated;

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
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
              {dispute.disputeNumber}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={dispute.status as DisputeStatus} />
              <PriorityBadge priority={dispute.priorityLevel as PriorityLevel} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: styles.border }}>
          {tabs.map(tab => {
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
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: styles.info }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
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
              <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
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
                      <span style={{ color: styles.textMuted }}>Requested Resolution:</span>
                      <p style={{ color: styles.textPrimary }}>{dispute.requestedResolution}</p>
                    </div>
                  )}
                  {dispute.requestedAmount && (
                    <div>
                      <span style={{ color: styles.textMuted }}>Requested Amount:</span>
                      <p className="font-semibold" style={{ color: styles.textPrimary }}>
                        {formatCurrency(dispute.requestedAmount, dispute.currency)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Response (if any) */}
              {dispute.sellerResponseType && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor:
                      dispute.sellerResponseType === 'accept_responsibility'
                        ? 'rgba(34, 197, 94, 0.05)'
                        : dispute.sellerResponseType === 'reject'
                        ? 'rgba(239, 68, 68, 0.05)'
                        : 'rgba(139, 92, 246, 0.05)',
                    borderColor:
                      dispute.sellerResponseType === 'accept_responsibility'
                        ? styles.success
                        : dispute.sellerResponseType === 'reject'
                        ? styles.error
                        : '#8b5cf6',
                  }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                    Seller Response
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor:
                            dispute.sellerResponseType === 'accept_responsibility'
                              ? 'rgba(34, 197, 94, 0.1)'
                              : dispute.sellerResponseType === 'reject'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(139, 92, 246, 0.1)',
                          color:
                            dispute.sellerResponseType === 'accept_responsibility'
                              ? styles.success
                              : dispute.sellerResponseType === 'reject'
                              ? styles.error
                              : '#8b5cf6',
                        }}
                      >
                        {dispute.sellerResponseType === 'accept_responsibility'
                          ? 'Accepted Responsibility'
                          : dispute.sellerResponseType === 'reject'
                          ? 'Rejected'
                          : 'Proposed Resolution'}
                      </span>
                    </div>
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

              {/* Resolution (if resolved) */}
              {dispute.resolution && (
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: styles.success }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: styles.success }}>
                    Resolution
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p style={{ color: styles.textPrimary }}>
                      {dispute.resolution.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    {dispute.resolutionAmount && (
                      <p className="font-semibold" style={{ color: styles.textPrimary }}>
                        Amount: {formatCurrency(dispute.resolutionAmount, dispute.currency)}
                      </p>
                    )}
                    {dispute.resolutionNotes && (
                      <p style={{ color: styles.textMuted }}>{dispute.resolutionNotes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Error */}
              {actionError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: `${styles.error}15` }}
                >
                  <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
                  <span className="text-sm" style={{ color: styles.error }}>
                    {actionError}
                  </span>
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
                          {!isLast && (
                            <div
                              className="w-0.5 flex-1 mt-1"
                              style={{ backgroundColor: styles.border }}
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p
                            className="text-sm font-medium"
                            style={{ color: styles.textPrimary }}
                          >
                            {event.eventType.replace(/_/g, ' ')}
                          </p>
                          {event.toStatus && (
                            <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                              Status: {event.toStatus.replace(/_/g, ' ')}
                            </p>
                          )}
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
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          <div className="flex items-center gap-2">
            {canEsc && (
              <button
                onClick={onEscalate}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: styles.error }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ArrowUp size={16} />
                Escalate
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canAct && (
              <>
                <button
                  onClick={onReject}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: styles.error }}
                >
                  Reject
                </button>
                <button
                  onClick={onAccept}
                  disabled={isAccepting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: styles.success, color: '#fff' }}
                >
                  {isAccepting ? (
                    <Spinner size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} weight="fill" />
                  )}
                  Accept Resolution
                </button>
              </>
            )}
            {!canAct && (
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
    </div>
  );
};

// Reject Modal Component
const RejectModal: React.FC<{
  onClose: () => void;
  onSubmit: () => void;
  reason: string;
  onReasonChange: (value: string) => void;
  isSubmitting: boolean;
}> = ({ onClose, onSubmit, reason, onReasonChange, isSubmitting }) => {
  const { styles } = usePortal();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
        style={{ backgroundColor: styles.bgCard }}
      >
        <div className="p-4 border-b" style={{ borderColor: styles.border }}>
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Reject Resolution
          </h2>
        </div>
        <div className="p-4">
          <textarea
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
            placeholder="Please explain why you're rejecting this resolution..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none"
            style={{
              borderColor: styles.border,
              backgroundColor: styles.bgPrimary,
              color: styles.textPrimary,
            }}
          />
        </div>
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
            disabled={!reason.trim() || isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: styles.error, color: '#fff' }}
          >
            {isSubmitting ? <Spinner size={16} className="animate-spin" /> : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Escalate Modal Component
const EscalateModal: React.FC<{
  onClose: () => void;
  onSubmit: () => void;
  reason: string;
  onReasonChange: (value: string) => void;
  isSubmitting: boolean;
}> = ({ onClose, onSubmit, reason, onReasonChange, isSubmitting }) => {
  const { styles } = usePortal();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
        style={{ backgroundColor: styles.bgCard }}
      >
        <div className="p-4 border-b" style={{ borderColor: styles.border }}>
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Escalate to Platform
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
          >
            <Warning size={18} style={{ color: styles.error }} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm" style={{ color: styles.textMuted }}>
              Escalating will involve platform support to help resolve this dispute. This should be done when seller negotiation has failed.
            </p>
          </div>
          <textarea
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
            placeholder="Please explain why you're escalating this dispute..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none"
            style={{
              borderColor: styles.border,
              backgroundColor: styles.bgPrimary,
              color: styles.textPrimary,
            }}
          />
        </div>
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
            disabled={!reason.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: styles.error, color: '#fff' }}
          >
            {isSubmitting ? <Spinner size={16} className="animate-spin" /> : <ArrowUp size={16} />}
            Escalate
          </button>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
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

export default DisputeCenter;
