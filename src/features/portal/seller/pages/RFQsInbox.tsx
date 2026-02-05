import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { sellerRfqInboxService } from '../../services/sellerRfqInboxService';
import { counterOfferService } from '../../services/counterOfferService';
import { QuoteFormPanel } from '../components/QuoteFormPanel';
import { CounterOfferResponseDialog } from '../components/CounterOfferResponseDialog';
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
  PaperPlaneTilt,
  ClockAfternoon,
  Check,
  Archive,
  Tag,
  ChatText,
  Keyboard,
  Truck,
  ArrowsClockwise,
} from 'phosphor-react';
import { EmptyState, Select, SkeletonKPICard, SkeletonTableRow } from '../../components';
import { usePortal } from '../../context/PortalContext';
import {
  SellerInboxRFQ,
  InboxFilters,
  InboxStats,
  Stage2RFQStatus,
  RFQPriorityLevel,
  RFQEvent,
  Quote,
  CounterOffer,
  getPriorityLevelConfig,
  getStage2StatusConfig,
  getTimeSinceReceived,
} from '../../types/item.types';

interface RFQsInboxProps {
  onNavigate: (page: string) => void;
}

// Smart Tab types
type SmartTab = 'all' | 'unread' | 'high_priority' | 'waiting' | 'quoted' | 'counter_offers';
type StatusFilter = 'all' | Stage2RFQStatus;
type PriorityFilter = 'all' | RFQPriorityLevel;

// Snooze options
type SnoozeOption = '2h' | 'tomorrow' | 'next_week';

const columnHelper = createColumnHelper<SellerInboxRFQ>();

// =============================================================================
// Helper Functions
// =============================================================================

const formatSLACountdown = (createdAt: string, slaHours: number = 24): { text: string; isUrgent: boolean; isOverdue: boolean } => {
  const created = new Date(createdAt).getTime();
  const deadline = created + (slaHours * 60 * 60 * 1000);
  const now = Date.now();
  const remaining = deadline - now;

  if (remaining <= 0) {
    const overdue = Math.abs(remaining);
    const hours = Math.floor(overdue / (60 * 60 * 1000));
    return { text: `${hours}h overdue`, isUrgent: true, isOverdue: true };
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours < 2) {
    return { text: `Reply in ${hours}h ${minutes}m`, isUrgent: true, isOverdue: false };
  } else if (hours < 6) {
    return { text: `Reply in ${hours}h`, isUrgent: true, isOverdue: false };
  } else {
    return { text: `${hours}h left`, isUrgent: false, isOverdue: false };
  }
};

// Get urgency label for RFQ (Normal / Expiring Soon)
const getUrgencyBadge = (rfq: SellerInboxRFQ): { label: string; isExpiring: boolean; daysRemaining: number } | null => {
  if (!rfq.requiredDeliveryDate) return null;

  const deadline = new Date(rfq.requiredDeliveryDate).getTime();
  const now = Date.now();
  const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return { label: 'Expired', isExpiring: true, daysRemaining: 0 };
  } else if (daysRemaining <= 3) {
    return { label: 'Expiring Soon', isExpiring: true, daysRemaining };
  }
  return null; // Normal urgency, no badge needed
};

// Check if RFQ needs action (for left border indicator)
const needsAction = (rfq: SellerInboxRFQ): boolean => {
  return rfq.status === 'new' || rfq.status === 'viewed';
};

// Format last buyer activity timestamp
const formatLastActivity = (rfq: SellerInboxRFQ): string => {
  const activityDate = rfq.updatedAt || rfq.createdAt;
  const now = new Date();
  const activity = new Date(activityDate);
  const diffMs = now.getTime() - activity.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return activity.toLocaleDateString();
  }
};

const getSnoozeUntil = (option: SnoozeOption): Date => {
  const now = new Date();
  switch (option) {
    case '2h':
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
    case 'tomorrow':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    case 'next_week':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek;
    default:
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }
};

// =============================================================================
// Main Component
// =============================================================================

export const RFQsInbox: React.FC<RFQsInboxProps> = ({ onNavigate }) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<SellerInboxRFQ | null>(null);

  // Gmail-style features
  const [smartTab, setSmartTab] = useState<SmartTab>('all');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState<string | null>(null);
  const [snoozeMenuPos, setSnoozeMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Dialogs
  const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [ignoreReason, setIgnoreReason] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [dialogRFQId, setDialogRFQId] = useState<string | null>(null);

  // Quote Panel (Stage 3)
  const [showQuotePanel, setShowQuotePanel] = useState(false);
  const [quoteRFQ, setQuoteRFQ] = useState<SellerInboxRFQ | null>(null);

  // Counter-offer Dialog
  const [showCounterOfferDialog, setShowCounterOfferDialog] = useState(false);
  const [selectedCounterOffer, setSelectedCounterOffer] = useState<CounterOffer | null>(null);
  const [selectedQuoteForCounter, setSelectedQuoteForCounter] = useState<Quote | null>(null);
  const [pendingCounterOffers, setPendingCounterOffers] = useState<CounterOffer[]>([]);
  const [isSubmittingCounterResponse, setIsSubmittingCounterResponse] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({ show: false, message: '', type: 'info' });

  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';
  const tableRef = useRef<HTMLDivElement>(null);

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

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

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

  // Fetch pending counter-offers
  const fetchPendingCounterOffers = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const offers = await counterOfferService.getSellerPendingCounterOffers(token);
      setPendingCounterOffers(offers);
    } catch (err) {
      console.error('Failed to fetch pending counter-offers:', err);
    }
  }, [getToken]);

  useEffect(() => {
    fetchPendingCounterOffers();
  }, [fetchPendingCounterOffers]);

  // Handle opening counter-offer dialog
  const handleViewCounterOffer = useCallback((counterOffer: CounterOffer, quote: Quote) => {
    setSelectedCounterOffer(counterOffer);
    setSelectedQuoteForCounter(quote);
    setShowCounterOfferDialog(true);
  }, []);

  // Handle accepting counter-offer
  const handleAcceptCounterOffer = useCallback(async (response?: string) => {
    if (!selectedCounterOffer) return;

    try {
      setIsSubmittingCounterResponse(true);
      const token = await getToken();
      if (!token) return;

      await counterOfferService.acceptCounterOffer(token, selectedCounterOffer.id, response);
      setShowCounterOfferDialog(false);
      setSelectedCounterOffer(null);
      setSelectedQuoteForCounter(null);
      showToast('Counter-offer accepted · Revised quote created');
      fetchRFQs();
      fetchPendingCounterOffers();
    } catch (err) {
      console.error('Failed to accept counter-offer:', err);
      showToast('Failed to accept counter-offer', 'error');
      throw err;
    } finally {
      setIsSubmittingCounterResponse(false);
    }
  }, [getToken, selectedCounterOffer, fetchRFQs, fetchPendingCounterOffers]);

  // Handle rejecting counter-offer
  const handleRejectCounterOffer = useCallback(async (response: string) => {
    if (!selectedCounterOffer) return;

    try {
      setIsSubmittingCounterResponse(true);
      const token = await getToken();
      if (!token) return;

      await counterOfferService.rejectCounterOffer(token, selectedCounterOffer.id, response);
      setShowCounterOfferDialog(false);
      setSelectedCounterOffer(null);
      setSelectedQuoteForCounter(null);
      showToast('Counter-offer rejected');
      fetchRFQs();
      fetchPendingCounterOffers();
    } catch (err) {
      console.error('Failed to reject counter-offer:', err);
      showToast('Failed to reject counter-offer', 'error');
      throw err;
    } finally {
      setIsSubmittingCounterResponse(false);
    }
  }, [getToken, selectedCounterOffer, fetchRFQs, fetchPendingCounterOffers]);

  // Filter RFQs based on smart tab
  const filteredBySmartTab = useMemo(() => {
    switch (smartTab) {
      case 'unread':
        return rfqs.filter(r => r.status === 'new');
      case 'high_priority':
        return rfqs.filter(r => r.priorityLevel === 'high');
      case 'waiting':
        return rfqs.filter(r => r.status === 'under_review');
      case 'quoted':
        return rfqs.filter(r => r.status === 'quoted');
      case 'counter_offers':
        // Filter RFQs that have pending counter-offers
        const rfqIdsWithCounterOffers = new Set(
          pendingCounterOffers.map(co => co.quote?.rfqId).filter(Boolean)
        );
        return rfqs.filter(r => rfqIdsWithCounterOffers.has(r.id));
      default:
        return rfqs;
    }
  }, [rfqs, smartTab, pendingCounterOffers]);

  // Smart tab counts
  const smartTabCounts = useMemo(() => ({
    all: rfqs.length,
    unread: rfqs.filter(r => r.status === 'new').length,
    high_priority: rfqs.filter(r => r.priorityLevel === 'high').length,
    waiting: rfqs.filter(r => r.status === 'under_review').length,
    quoted: rfqs.filter(r => r.status === 'quoted').length,
    counter_offers: pendingCounterOffers.length,
  }), [rfqs, pendingCounterOffers]);

  // Handle RFQ selection (auto-marks as viewed)
  const handleSelectRFQ = useCallback(async (rfq: SellerInboxRFQ) => {
    try {
      const token = await getToken();
      if (!token) return;

      const detail = await sellerRfqInboxService.getRFQDetail(token, rfq.id);
      if (detail) {
        setSelectedRFQ(detail);
        if (detail.status !== rfq.status) {
          setRfqs(prev => prev.map(r => r.id === rfq.id ? detail : r));
          fetchRFQs();
        }
      }
    } catch (err) {
      console.error('Failed to load RFQ detail:', err);
      setSelectedRFQ(rfq);
    }
  }, [getToken, fetchRFQs]);

  // Handle mark as under review - with optimistic UI
  const handleMarkUnderReview = useCallback(async (rfqId: string) => {
    // Optimistic update
    setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: 'under_review' as const } : r));
    showToast('Marked as reviewed');

    try {
      const token = await getToken();
      if (!token) return;

      const updated = await sellerRfqInboxService.markUnderReview(token, rfqId);
      if (updated) {
        setSelectedRFQ(updated);
        // Sync with server data
        fetchRFQs();
      }
    } catch (err) {
      console.error('Failed to mark as under review:', err);
      // Revert optimistic update on error
      fetchRFQs();
      showToast('Failed to update', 'error');
    }
  }, [getToken, fetchRFQs]);

  // Handle mark as ignored (decline) - with optimistic UI
  const handleMarkIgnored = useCallback(async () => {
    if (!dialogRFQId || !ignoreReason.trim()) return;

    // Optimistic update
    setRfqs(prev => prev.map(r => r.id === dialogRFQId ? { ...r, status: 'ignored' as const } : r));
    showToast('RFQ declined');

    // Close dialog immediately for responsive feel
    setShowIgnoreDialog(false);
    const rfqIdToUpdate = dialogRFQId;
    const reason = ignoreReason;
    setIgnoreReason('');
    setDialogRFQId(null);

    try {
      const token = await getToken();
      if (!token) return;

      const updated = await sellerRfqInboxService.markIgnored(token, rfqIdToUpdate, reason);
      if (updated) {
        if (selectedRFQ?.id === rfqIdToUpdate) {
          setSelectedRFQ(updated);
        }
        fetchRFQs();
      }
    } catch (err) {
      console.error('Failed to mark as ignored:', err);
      fetchRFQs();
      showToast('Failed to decline', 'error');
    }
  }, [getToken, dialogRFQId, ignoreReason, selectedRFQ, fetchRFQs]);

  // Handle add note - with optimistic UI
  const handleAddNote = useCallback(async () => {
    if (!dialogRFQId || !noteContent.trim()) return;

    // Optimistic update
    const noteToSave = noteContent;
    setRfqs(prev => prev.map(r => r.id === dialogRFQId ? { ...r, internalNotes: noteToSave } : r));
    if (selectedRFQ?.id === dialogRFQId) {
      setSelectedRFQ(prev => prev ? { ...prev, internalNotes: noteToSave } : prev);
    }
    showToast('Note saved');

    // Close dialog immediately
    setShowNoteDialog(false);
    const rfqIdToUpdate = dialogRFQId;
    setNoteContent('');
    setDialogRFQId(null);

    try {
      const token = await getToken();
      if (!token) return;

      const updated = await sellerRfqInboxService.addNote(token, rfqIdToUpdate, { note: noteToSave });
      if (updated) {
        if (selectedRFQ?.id === rfqIdToUpdate) {
          setSelectedRFQ(updated);
        }
        fetchRFQs();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
      fetchRFQs();
      showToast('Failed to save note', 'error');
    }
  }, [getToken, dialogRFQId, noteContent, selectedRFQ, fetchRFQs]);

  // Handle snooze
  const handleSnooze = useCallback(async (rfqId: string, option: SnoozeOption) => {
    try {
      const _token = await getToken();
      if (!_token) return;

      const until = getSnoozeUntil(option);
      // TODO: Call API to snooze RFQ
      // await sellerRfqInboxService.snoozeRFQ(token, rfqId, until);

      showToast(`Snoozed until ${option === '2h' ? '2 hours' : option === 'tomorrow' ? 'tomorrow' : 'next week'}`);
      setShowSnoozeMenu(null);
    } catch (err) {
      console.error('Failed to snooze RFQ:', err);
    }
  }, [getToken]);

  // Bulk actions
  const handleBulkMarkReviewed = useCallback(async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    try {
      const token = await getToken();
      if (!token) return;

      await Promise.all(selectedIds.map(id => sellerRfqInboxService.markUnderReview(token, id)));
      fetchRFQs();
      setRowSelection({});
      showToast(`${selectedIds.length} RFQ(s) marked as reviewed`);
    } catch (err) {
      console.error('Failed to bulk mark reviewed:', err);
    }
  }, [getToken, rowSelection, fetchRFQs]);

  const handleBulkSnooze = useCallback(async (option: SnoozeOption) => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    // TODO: Implement bulk snooze API call
    showToast(`${selectedIds.length} RFQ(s) snoozed`);
    setRowSelection({});
    setShowBulkActions(false);
  }, [rowSelection]);

  const handleBulkArchive = useCallback(async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    // TODO: Implement archive API call
    showToast(`${selectedIds.length} RFQ(s) archived`);
    setRowSelection({});
    setShowBulkActions(false);
  }, [rowSelection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (selectedRFQ || showQuotePanel || showIgnoreDialog || showNoteDialog) return;

      const rows = filteredBySmartTab;

      switch (e.key.toLowerCase()) {
        case 'j': // Next row
          e.preventDefault();
          setFocusedRowIndex(prev => Math.min(prev + 1, rows.length - 1));
          break;
        case 'k': // Previous row
          e.preventDefault();
          setFocusedRowIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'enter': // Open RFQ
          e.preventDefault();
          if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
            handleSelectRFQ(rows[focusedRowIndex]);
          }
          break;
        case 'r': // Quick reply (open quote panel)
          e.preventDefault();
          if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
            const rfq = rows[focusedRowIndex];
            setQuoteRFQ(rfq);
            setShowQuotePanel(true);
          }
          break;
        case 's': // Snooze
          e.preventDefault();
          if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
            const rfq = rows[focusedRowIndex];
            handleSnooze(rfq.id, '2h');
          }
          break;
        case 'x': // Toggle selection
          e.preventDefault();
          if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
            const rfq = rows[focusedRowIndex];
            setRowSelection(prev => {
              const newSelection = { ...prev };
              if (newSelection[rfq.id]) {
                delete newSelection[rfq.id];
              } else {
                newSelection[rfq.id] = true;
              }
              return newSelection;
            });
          }
          break;
        case '?': // Show keyboard help
          e.preventDefault();
          setShowKeyboardHelp(true);
          break;
        case 'escape':
          setShowKeyboardHelp(false);
          setFocusedRowIndex(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredBySmartTab, focusedRowIndex, selectedRFQ, showQuotePanel, showIgnoreDialog, showNoteDialog, handleSelectRFQ, handleSnooze]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCurrentPage(1);
  };

  const selectedCount = Object.keys(rowSelection).length;

  // Table columns with Gmail-style enhancements
  const columns = useMemo(() => [
    // Selection checkbox column
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: styles.info }}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: styles.info }}
        />
      ),
      size: 40,
    }),
    columnHelper.accessor('rfqNumber', {
      meta: { align: 'start' as const },
      header: t('seller.inbox.rfqId') || 'RFQ ID',
      cell: ({ row }) => {
        const rfq = row.original;
        const isNew = rfq.status === 'new';
        const priority = rfq.priorityLevel || 'medium';
        const priorityConfig = getPriorityLevelConfig(priority);
        const sla = formatSLACountdown(rfq.createdAt);
        const urgency = getUrgencyBadge(rfq);
        const lastActivity = formatLastActivity(rfq);

        return (
          <div className="flex items-center gap-3">
            {/* Priority Dot */}
            <div className="relative flex-shrink-0">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: priority === 'high' ? styles.error : priority === 'medium' ? '#f59e0b' : styles.success,
                }}
              />
              {isNew && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: styles.info }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`truncate ${isNew ? 'font-semibold' : 'font-medium'}`} style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                  {rfq.rfqNumber || `RFQ-${rfq.id.slice(0, 8).toUpperCase()}`}
                </p>
                {/* Urgency Badge */}
                {urgency && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: urgency.isExpiring ? `${styles.error}15` : `${styles.warning}15`,
                      color: urgency.isExpiring ? styles.error : styles.warning,
                    }}
                  >
                    {urgency.label}
                  </span>
                )}
                {/* RFQ Score Badge */}
                {rfq.priorityScore !== undefined && rfq.priorityScore >= 70 && !urgency && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums"
                    style={{ backgroundColor: `${styles.success}15`, color: styles.success }}
                  >
                    {rfq.priorityScore}
                  </span>
                )}
              </div>
              {/* SLA Countdown + Last Activity */}
              <div className="flex items-center gap-2">
                {isNew && (
                  <p
                    className={`text-[10px] flex items-center gap-1 ${sla.isUrgent ? 'font-medium' : ''}`}
                    style={{ color: sla.isOverdue ? styles.error : sla.isUrgent ? styles.warning : styles.textMuted }}
                  >
                    <Timer size={10} weight={sla.isUrgent ? 'fill' : 'regular'} />
                    {sla.text}
                  </p>
                )}
                {!isNew && (
                  <p className="text-[10px]" style={{ color: styles.textMuted }}>
                    Last activity: {lastActivity}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      },
      size: 200,
    }),
    columnHelper.accessor('item', {
      meta: { align: 'start' as const },
      header: t('seller.inbox.product') || 'Product',
      cell: ({ row }) => {
        const rfq = row.original;
        const hasItem = rfq.item && rfq.itemId;
        const isNew = rfq.status === 'new';

        return (
          <div className="min-w-0">
            <p className={`truncate ${isNew ? 'font-semibold' : 'font-medium'}`} style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
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
      cell: ({ row }) => {
        const isNew = row.original.status === 'new';
        return (
          <div className="flex items-center gap-2">
            <Buildings size={16} style={{ color: styles.textMuted }} />
            <span className={`truncate ${isNew ? 'font-semibold' : ''}`} style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
              {row.original.buyerCompanyName || t('seller.inbox.unknownBuyer') || 'Unknown'}
            </span>
          </div>
        );
      },
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
    columnHelper.accessor('status', {
      meta: { align: 'center' as const },
      header: t('seller.inbox.status') || 'Status',
      cell: ({ row }) => {
        const rfq = row.original;
        const hasCounterOffer = pendingCounterOffers.some(co => co.quote?.rfqId === rfq.id);
        return (
          <div className="flex flex-col items-center gap-1">
            <StatusBadge status={rfq.status as Stage2RFQStatus} />
            {hasCounterOffer && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium animate-pulse"
                style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}
              >
                <ArrowsClockwise size={10} weight="bold" />
                Counter-Offer
              </span>
            )}
          </div>
        );
      },
      size: 120,
    }),
    // Inline Quick Actions column
    columnHelper.display({
      id: 'actions',
      meta: { align: 'center' as const },
      header: '',
      cell: ({ row }) => {
        const rfq = row.original;
        const canReview = rfq.status === 'new' || rfq.status === 'viewed';
        const canQuote = rfq.status === 'new' || rfq.status === 'viewed' || rfq.status === 'under_review';
        const snoozeButtonRef = React.useRef<HTMLButtonElement>(null);
        const counterOffer = pendingCounterOffers.find(co => co.quote?.rfqId === rfq.id);
        const hasCounterOffer = !!counterOffer;

        const handleSnoozeClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (snoozeButtonRef.current) {
            const rect = snoozeButtonRef.current.getBoundingClientRect();
            setSnoozeMenuPos({ x: rect.right - 140, y: rect.bottom + 4 });
          }
          setShowSnoozeMenu(showSnoozeMenu === rfq.id ? null : rfq.id);
        };

        return (
          <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
            {/* Counter-Offer Action (Always visible if there's a counter-offer) */}
            {hasCounterOffer && counterOffer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (counterOffer.quote) {
                    handleViewCounterOffer(counterOffer, counterOffer.quote);
                  }
                }}
                className="p-1.5 rounded transition-colors !opacity-100"
                style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8b5cf625'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#8b5cf615'; }}
                title="View Counter-Offer"
              >
                <ArrowsClockwise size={15} weight="bold" />
              </button>
            )}
            {/* Quick Reply */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuoteRFQ(rfq);
                setShowQuotePanel(true);
              }}
              className="p-1.5 rounded transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${styles.info}15`; e.currentTarget.style.color = styles.info; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = styles.textMuted; }}
              title="Send Quote (R)"
            >
              <PaperPlaneTilt size={15} />
            </button>
            {/* Mark Reviewed */}
            {canReview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkUnderReview(rfq.id);
                }}
                className="p-1.5 rounded transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${styles.success}15`; e.currentTarget.style.color = styles.success; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = styles.textMuted; }}
                title="Mark Reviewed"
              >
                <Check size={15} weight="bold" />
              </button>
            )}
            {/* Snooze */}
            <div className="relative">
              <button
                ref={snoozeButtonRef}
                onClick={handleSnoozeClick}
                className="p-1.5 rounded transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${styles.warning}15`; e.currentTarget.style.color = styles.warning; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = styles.textMuted; }}
                title="Snooze (S)"
              >
                <ClockAfternoon size={15} />
              </button>
            </div>
            {/* View */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRFQ(rfq);
              }}
              className="p-1.5 rounded transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = styles.bgSecondary; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="View Details (Enter)"
            >
              <Eye size={15} />
            </button>
          </div>
        );
      },
      size: 140,
    }),
  ], [styles, t, handleSelectRFQ, handleMarkUnderReview, showSnoozeMenu, pendingCounterOffers, handleViewCounterOffer]);

  const table = useReactTable<SellerInboxRFQ>({
    data: filteredBySmartTab,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
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
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard size={14} />
            Shortcuts
          </button>
        </div>

        {/* Smart Tabs */}
        <div className="mb-4">
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <SmartTabButton
              label="All"
              count={smartTabCounts.all}
              isActive={smartTab === 'all'}
              onClick={() => setSmartTab('all')}
              styles={styles}
            />
            <SmartTabButton
              label="Unread"
              count={smartTabCounts.unread}
              isActive={smartTab === 'unread'}
              onClick={() => setSmartTab('unread')}
              color={styles.error}
              styles={styles}
            />
            <SmartTabButton
              label="High Priority"
              count={smartTabCounts.high_priority}
              isActive={smartTab === 'high_priority'}
              onClick={() => setSmartTab('high_priority')}
              color="#f59e0b"
              icon={<Lightning size={12} weight="fill" />}
              styles={styles}
            />
            <SmartTabButton
              label="Waiting"
              count={smartTabCounts.waiting}
              isActive={smartTab === 'waiting'}
              onClick={() => setSmartTab('waiting')}
              color={styles.info}
              styles={styles}
            />
            <SmartTabButton
              label="Quoted"
              count={smartTabCounts.quoted}
              isActive={smartTab === 'quoted'}
              onClick={() => setSmartTab('quoted')}
              color={styles.success}
              styles={styles}
            />
            {smartTabCounts.counter_offers > 0 && (
              <SmartTabButton
                label="Counter-Offers"
                count={smartTabCounts.counter_offers}
                isActive={smartTab === 'counter_offers'}
                onClick={() => setSmartTab('counter_offers')}
                color="#8b5cf6"
                icon={<ArrowsClockwise size={12} weight="bold" />}
                styles={styles}
              />
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCount > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3 mb-4 rounded-xl transition-all duration-150"
            style={{ backgroundColor: `${styles.info}10`, border: `1px solid ${styles.info}30` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {selectedCount} selected
              </span>
              <button
                onClick={() => setRowSelection({})}
                className="text-xs"
                style={{ color: styles.textMuted }}
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkReviewed}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: styles.bgCard, color: styles.textSecondary, border: `1px solid ${styles.border}` }}
              >
                <Check size={14} weight="bold" />
                Mark Reviewed
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: styles.bgCard, color: styles.textSecondary, border: `1px solid ${styles.border}` }}
                >
                  <ClockAfternoon size={14} />
                  Snooze
                  <CaretDown size={10} />
                </button>
                {showBulkActions && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowBulkActions(false)} />
                    <div
                      className="fixed z-50 py-1 rounded-lg shadow-lg min-w-[140px]"
                      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}`, right: 0, top: '100%', marginTop: 4 }}
                    >
                      <SnoozeMenuItem label="2 hours" onClick={() => handleBulkSnooze('2h')} styles={styles} />
                      <SnoozeMenuItem label="Tomorrow" onClick={() => handleBulkSnooze('tomorrow')} styles={styles} />
                      <SnoozeMenuItem label="Next week" onClick={() => handleBulkSnooze('next_week')} styles={styles} />
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: styles.bgCard, color: styles.textSecondary, border: `1px solid ${styles.border}` }}
              >
                <Archive size={14} />
                Archive
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div
          className="rounded-xl border mb-4"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 h-9 rounded-lg border flex-1 max-w-[300px]"
              style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
            >
              <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
              <input
                type="text"
                placeholder="Search RFQ ID, buyer... (Press /)"
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

            <div className="flex items-center gap-3">
              {/* Filter Toggle */}
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: hasActiveFilters ? `${styles.info}15` : 'transparent',
                  color: hasActiveFilters ? styles.info : styles.textSecondary
                }}
              >
                <Funnel size={14} />
                Filters
                {hasActiveFilters && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: styles.info }}
                  />
                )}
              </button>

              {/* Sort */}
              <Select
                value={sorting[0]?.id || 'createdAt'}
                onChange={(v) => { setSorting([{ id: v, desc: true }]); setCurrentPage(1); }}
                options={[
                  { value: 'createdAt', label: 'Date Received' },
                  { value: 'priorityScore', label: 'Priority Score' },
                  { value: 'requiredDeliveryDate', label: 'Delivery Date' },
                ]}
              />
            </div>
          </div>

          {/* Expanded Filters */}
          {filtersExpanded && (
            <div
              className="px-4 py-3 flex flex-wrap items-center gap-3 border-t"
              style={{ borderColor: styles.border }}
            >
              <Select
                value={priorityFilter}
                onChange={(v) => { setPriorityFilter(v as PriorityFilter); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'high', label: 'High Priority' },
                  { value: 'medium', label: 'Medium Priority' },
                  { value: 'low', label: 'Low Priority' },
                ]}
              />
              <Select
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v as StatusFilter); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'new', label: 'New' },
                  { value: 'viewed', label: 'Viewed' },
                  { value: 'under_review', label: 'Under Review' },
                  { value: 'ignored', label: 'Ignored' },
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

        {/* Loading State with Shimmer */}
        {isLoading && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            {/* Stats Row Skeleton */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b" style={{ borderColor: styles.border }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="shimmer w-8 h-8 rounded" style={{ animationDelay: `${i * 50}ms` }} />
                  <div>
                    <div className="shimmer h-3 w-12 rounded mb-1" style={{ animationDelay: `${i * 50}ms` }} />
                    <div className="shimmer h-5 w-8 rounded" style={{ animationDelay: `${i * 50 + 25}ms` }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Table Skeleton */}
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${styles.border}` }}>
                  {['', 'RFQ', 'Buyer', 'Items', 'Status', 'SLA', ''].map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <div className="shimmer h-3 w-16 rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <SkeletonTableRow key={i} columns={7} />
                ))}
              </tbody>
            </table>
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
        {!isLoading && !error && filteredBySmartTab.length === 0 && (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={FileText}
              title={smartTab === 'all' ? 'No RFQs Yet' : `No ${smartTab.replace('_', ' ')} RFQs`}
              description={smartTab === 'all'
                ? 'When buyers send quote requests, they will appear here.'
                : 'No RFQs match this filter.'
              }
            />
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && filteredBySmartTab.length > 0 && (
          <div
            ref={tableRef}
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
                    const isFocused = index === focusedRowIndex;
                    const sla = formatSLACountdown(row.original.createdAt);
                    const actionNeeded = needsAction(row.original);
                    const urgency = getUrgencyBadge(row.original);

                    return (
                      <tr
                        key={row.id}
                        className="group transition-colors cursor-pointer relative"
                        onClick={() => handleSelectRFQ(row.original)}
                        style={{
                          borderBottom:
                            index === table.getRowModel().rows.length - 1
                              ? 'none'
                              : `1px solid ${styles.tableBorder}`,
                          backgroundColor: isFocused
                            ? `${styles.info}15`
                            : row.getIsSelected()
                            ? `${styles.info}08`
                            : sla.isOverdue && isNew
                            ? `${styles.error}05`
                            : isNew
                            ? `${styles.info}03`
                            : 'transparent',
                          outline: isFocused ? `2px solid ${styles.info}` : 'none',
                          outlineOffset: '-2px',
                          // Left border for action-needed RFQs
                          borderLeft: actionNeeded
                            ? `3px solid ${urgency?.isExpiring ? styles.error : styles.info}`
                            : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isFocused && !row.getIsSelected()) {
                            e.currentTarget.style.backgroundColor = styles.tableRowHover;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isFocused && !row.getIsSelected()) {
                            e.currentTarget.style.backgroundColor = sla.isOverdue && isNew
                              ? `${styles.error}05`
                              : isNew
                              ? `${styles.info}03`
                              : 'transparent';
                          }
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const align = (cell.column.columnDef.meta as { align?: 'start' | 'center' })?.align || 'start';
                          return (
                            <td
                              key={cell.id}
                              className="px-4 py-3"
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
                Showing {filteredBySmartTab.length} of {totalItems} RFQs
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded text-sm disabled:opacity-50"
                    style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                  >
                    Previous
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
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Snooze Menu (Fixed Position) */}
      {showSnoozeMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowSnoozeMenu(null)} />
          <div
            className="fixed z-50 py-1 rounded-lg shadow-lg min-w-[140px]"
            style={{
              backgroundColor: styles.bgCard,
              border: `1px solid ${styles.border}`,
              left: snoozeMenuPos.x,
              top: snoozeMenuPos.y,
            }}
          >
            <SnoozeMenuItem label="2 hours" onClick={() => handleSnooze(showSnoozeMenu, '2h')} styles={styles} />
            <SnoozeMenuItem label="Tomorrow" onClick={() => handleSnooze(showSnoozeMenu, 'tomorrow')} styles={styles} />
            <SnoozeMenuItem label="Next week" onClick={() => handleSnooze(showSnoozeMenu, 'next_week')} styles={styles} />
          </div>
        </>
      )}

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
            setSelectedRFQ(null);
            setShowQuotePanel(false);
            setQuoteRFQ(null);
            fetchRFQs();
            showToast('Quote sent · Buyer notified');
          }}
        />
      )}

      {/* Decline RFQ Dialog */}
      {showIgnoreDialog && (
        <Dialog
          title={t('seller.inbox.declineRfq') || 'Decline RFQ'}
          onClose={() => {
            setShowIgnoreDialog(false);
            setIgnoreReason('');
            setDialogRFQId(null);
          }}
          onConfirm={handleMarkIgnored}
          confirmLabel={t('seller.inbox.declineRfqButton') || 'Decline RFQ'}
          confirmDisabled={!ignoreReason.trim()}
          isRtl={isRtl}
        >
          <p className="text-sm mb-3" style={{ color: styles.textSecondary }}>
            {t('seller.inbox.declineReasonPrompt') || 'Please provide a reason for declining this RFQ:'}
          </p>
          <textarea
            value={ignoreReason}
            onChange={(e) => setIgnoreReason(e.target.value)}
            placeholder={t('seller.inbox.declineReasonPlaceholder') || 'e.g., Item not available, Out of service area, Cannot meet delivery date...'}
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

      {/* Keyboard Shortcuts Help */}
      {showKeyboardHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} styles={styles} />
      )}

      {/* Counter-Offer Response Dialog */}
      {selectedCounterOffer && selectedQuoteForCounter && (
        <CounterOfferResponseDialog
          counterOffer={selectedCounterOffer}
          quote={selectedQuoteForCounter}
          itemName={selectedQuoteForCounter.rfq?.item?.name}
          buyerName={selectedQuoteForCounter.rfq?.buyerCompanyName}
          isOpen={showCounterOfferDialog}
          onClose={() => {
            setShowCounterOfferDialog(false);
            setSelectedCounterOffer(null);
            setSelectedQuoteForCounter(null);
          }}
          onAccept={handleAcceptCounterOffer}
          onReject={handleRejectCounterOffer}
          isSubmitting={isSubmittingCounterResponse}
        />
      )}

      {/* Toast Notification - Minimal microcopy */}
      {toast.show && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-100"
          style={{
            backgroundColor: toast.type === 'success'
              ? styles.success
              : toast.type === 'error'
              ? styles.error
              : styles.info,
            color: '#fff',
          }}
        >
          {toast.type === 'success' && <CheckCircle size={16} weight="fill" />}
          {toast.type === 'error' && <Warning size={16} weight="fill" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Sub-Components
// =============================================================================

// Smart Tab Button
const SmartTabButton: React.FC<{
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: string;
  icon?: React.ReactNode;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, count, isActive, onClick, color, icon, styles }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-100"
    style={{
      backgroundColor: isActive ? styles.bgCard : 'transparent',
      color: isActive ? (color || styles.textPrimary) : styles.textMuted,
      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    }}
  >
    {icon}
    {color && !icon && (
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

// Snooze Menu Item
const SnoozeMenuItem: React.FC<{
  label: string;
  onClick: () => void;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, onClick, styles }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left"
    style={{ color: styles.textPrimary }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <ClockAfternoon size={14} style={{ color: styles.textMuted }} />
    {label}
  </button>
);

// Keyboard Shortcuts Help
const KeyboardShortcutsHelp: React.FC<{
  onClose: () => void;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ onClose, styles }) => (
  <>
    <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 rounded-xl shadow-2xl p-6"
      style={{ backgroundColor: styles.bgCard }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
          Keyboard Shortcuts
        </h3>
        <button onClick={onClose} style={{ color: styles.textMuted }}>
          <X size={20} />
        </button>
      </div>
      <div className="space-y-3">
        <ShortcutRow keys={['J', 'K']} description="Navigate up/down" styles={styles} />
        <ShortcutRow keys={['Enter']} description="Open RFQ details" styles={styles} />
        <ShortcutRow keys={['R']} description="Send quote" styles={styles} />
        <ShortcutRow keys={['S']} description="Snooze for 2 hours" styles={styles} />
        <ShortcutRow keys={['X']} description="Toggle selection" styles={styles} />
        <ShortcutRow keys={['?']} description="Show shortcuts" styles={styles} />
        <ShortcutRow keys={['Esc']} description="Close / Clear focus" styles={styles} />
      </div>
    </div>
  </>
);

const ShortcutRow: React.FC<{
  keys: string[];
  description: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ keys, description, styles }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <React.Fragment key={key}>
          <kbd
            className="px-2 py-1 rounded text-xs font-mono font-semibold"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textPrimary }}
          >
            {key}
          </kbd>
          {i < keys.length - 1 && <span style={{ color: styles.textMuted }}>/</span>}
        </React.Fragment>
      ))}
    </div>
    <span className="text-sm" style={{ color: styles.textSecondary }}>{description}</span>
  </div>
);

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

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ title, icon, children, defaultExpanded = false, styles }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-100"
      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors"
        style={{ backgroundColor: isExpanded ? 'transparent' : 'transparent' }}
        onMouseEnter={(e) => !isExpanded && (e.currentTarget.style.backgroundColor = styles.bgHover)}
        onMouseLeave={(e) => !isExpanded && (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: styles.textMuted }}>
            {title}
          </span>
        </div>
        <CaretRight
          size={16}
          style={{
            color: styles.textMuted,
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 100ms ease',
          }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-100"
        style={{
          maxHeight: isExpanded ? '1000px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
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
  onDeclineRFQ?: () => void;
}> = ({ rfq, isRtl, onClose, onMarkUnderReview, onMarkIgnored, onAddNote, onCreateQuote, onDeclineRFQ }) => {
  const { styles, t } = usePortal();
  const { getToken } = useAuth();
  const [history, setHistory] = useState<RFQEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const canMarkUnderReview = rfq.status === 'new' || rfq.status === 'viewed';
  const canMarkIgnored = rfq.status !== 'ignored';
  const canCreateQuote = rfq.status === 'under_review' || rfq.status === 'new' || rfq.status === 'viewed';
  const isReadOnly = rfq.status === 'ignored' || rfq.status === 'expired' || rfq.status === 'rejected';
  const timeInfo = getTimeSinceReceived(rfq.createdAt);
  const sla = formatSLACountdown(rfq.createdAt);
  const urgency = getUrgencyBadge(rfq);

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
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
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
                  className={`text-xs flex items-center gap-1 ${sla.isUrgent ? 'font-medium' : ''}`}
                  style={{ color: sla.isOverdue ? styles.error : sla.isUrgent ? styles.warning : styles.textMuted }}
                >
                  <Timer size={10} weight={sla.isUrgent ? 'fill' : 'regular'} />
                  {sla.text}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* SLA Warning */}
          {sla.isOverdue && rfq.status === 'new' && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: `${styles.error}15`, border: `1px solid ${styles.error}30` }}
            >
              <Timer size={24} weight="duotone" style={{ color: styles.error }} />
              <div>
                <p className="font-medium text-sm" style={{ color: styles.error }}>
                  Response time exceeded
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  This RFQ has been waiting for over 24 hours
                </p>
              </div>
            </div>
          )}

          {/* Read-only indicator */}
          {isReadOnly && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.border}` }}
            >
              <Archive size={20} style={{ color: styles.textMuted }} />
              <div>
                <p className="font-medium text-sm" style={{ color: styles.textSecondary }}>
                  {rfq.status === 'expired' ? 'RFQ Expired' : rfq.status === 'rejected' ? 'RFQ Declined' : 'RFQ Ignored'}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  This RFQ is read-only
                </p>
              </div>
            </div>
          )}

          {/* SECTION 1: Buyer Request Summary (Always visible, read-only) */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: styles.textMuted }}>
                Buyer Request Summary
              </p>
              {urgency && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: urgency.isExpiring ? `${styles.error}15` : `${styles.warning}15`,
                    color: urgency.isExpiring ? styles.error : styles.warning,
                  }}
                >
                  {urgency.label}
                </span>
              )}
            </div>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <Buildings size={20} style={{ color: styles.textMuted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ color: styles.textPrimary }}>
                  {rfq.buyerCompanyName || 'Unknown Buyer'}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  Submitted {formatLastActivity(rfq)}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Requested Items (Expanded by default) */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
              Requested Items
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
                  {rfq.item?.name || 'General RFQ'}
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
                  <span style={{ color: styles.textMuted }}>units</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Delivery Requirements (Collapsible) */}
          <CollapsibleSection
            title="Delivery Requirements"
            icon={<Truck size={14} style={{ color: styles.textMuted }} />}
            defaultExpanded={true}
            styles={styles}
          >
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
                      Required by:
                    </p>
                    <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                      {new Date(rfq.requiredDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* SECTION 4: Notes / Attachments (Collapsible, collapsed by default) */}
          {rfq.message && (
            <CollapsibleSection
              title="Buyer Notes"
              icon={<ChatText size={14} style={{ color: styles.textMuted }} />}
              defaultExpanded={false}
              styles={styles}
            >
              <p className="text-sm whitespace-pre-wrap" style={{ color: styles.textSecondary }}>
                {rfq.message}
              </p>
            </CollapsibleSection>
          )}

          {/* SECTION 5: Priority & Internal Notes (Collapsible, collapsed by default) */}
          <CollapsibleSection
            title="Internal Info"
            icon={<Note size={14} style={{ color: styles.textMuted }} />}
            defaultExpanded={false}
            styles={styles}
          >
            {/* Priority */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightning size={18} weight="fill" style={{ color: getPriorityLevelConfig(rfq.priorityLevel).textColor.replace('text-', '') }} />
                <span className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                  {getPriorityLevelConfig(rfq.priorityLevel).label} Priority
                </span>
              </div>
              {rfq.priorityScore !== undefined && (
                <span
                  className="px-2 py-1 rounded text-xs font-semibold tabular-nums"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  Score: {rfq.priorityScore}
                </span>
              )}
            </div>

            {/* Internal Notes */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: styles.textMuted }}>
                Internal Notes
              </p>
              <button
                onClick={onAddNote}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: styles.info }}
              >
                <NotePencil size={14} />
                {rfq.internalNotes ? 'Edit' : 'Add'}
              </button>
            </div>
            {rfq.internalNotes ? (
              <p className="text-sm whitespace-pre-wrap" style={{ color: styles.textSecondary }}>
                {rfq.internalNotes}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: styles.textMuted }}>
                No notes yet
              </p>
            )}
          </CollapsibleSection>

          {/* Ignored Reason */}
          {rfq.status === 'ignored' && rfq.ignoredReason && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${styles.error}08`, border: `1px solid ${styles.error}20` }}
            >
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: styles.error }}>
                Ignored Reason
              </p>
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                {rfq.ignoredReason}
              </p>
            </div>
          )}

          {/* SECTION 6: History Timeline (Collapsible, collapsed by default) */}
          <CollapsibleSection
            title="History"
            icon={<Clock size={14} style={{ color: styles.textMuted }} />}
            defaultExpanded={false}
            styles={styles}
          >
            {loadingHistory ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 rounded-full" style={{ borderColor: styles.border, borderTopColor: styles.info }} />
                <span className="text-sm" style={{ color: styles.textMuted }}>Loading...</span>
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm" style={{ color: styles.textMuted }}>
                No history available
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
          </CollapsibleSection>
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          {!isReadOnly && (
            <div className="space-y-2">
              {/* Primary Action: Send Quote */}
              {canCreateQuote && (
                <button
                  onClick={onCreateQuote}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-100 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    backgroundColor: styles.success,
                    color: '#fff',
                  }}
                >
                  <PaperPlaneTilt size={18} weight="bold" />
                  Send Quote
                </button>
              )}

              {/* Secondary Actions Row */}
              <div className="flex gap-2">
                {/* Mark as Reviewed */}
                {canMarkUnderReview && (
                  <button
                    onClick={onMarkUnderReview}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-100"
                    style={{
                      backgroundColor: styles.bgSecondary,
                      color: styles.textPrimary,
                      border: `1px solid ${styles.border}`,
                    }}
                  >
                    <Check size={16} weight="bold" />
                    Review
                  </button>
                )}

                {/* Decline RFQ (Tertiary) */}
                {canMarkIgnored && (
                  <button
                    onClick={onMarkIgnored}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-100"
                    style={{
                      backgroundColor: 'transparent',
                      color: styles.textMuted,
                      border: `1px solid ${styles.border}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${styles.error}10`;
                      e.currentTarget.style.color = styles.error;
                      e.currentTarget.style.borderColor = `${styles.error}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = styles.textMuted;
                      e.currentTarget.style.borderColor = styles.border;
                    }}
                  >
                    <XCircle size={16} />
                    Decline
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Read-only state message */}
          {isReadOnly && (
            <p className="text-center text-sm" style={{ color: styles.textMuted }}>
              No actions available for this RFQ
            </p>
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
