import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { portalApiLogger } from '../../../../utils/logger';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import {
  Plus,
  FileText,
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
  Lightning,
  Scales,
  Hourglass,
  Timer,
  Trophy,
  Handshake,
  ArrowsClockwise,
  CalendarBlank,
  ShieldCheck,
  CurrencyDollar,
  Spinner,
  Prohibit,
  Package,
  User,
} from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState, Select } from '../../components';
import { useToast } from '../../components/Toast';
import { usePortal } from '../../context/PortalContext';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { itemService } from '../../services/itemService';
import { quoteService } from '../../services/quoteService';
import { counterOfferService } from '../../services/counterOfferService';
import { marketplaceOrderService } from '../../services/marketplaceOrderService';
import { QuoteDetailPanel } from '../components/QuoteDetailPanel';
import { CounterOfferDialog } from '../components/CounterOfferDialog';
import { ItemRFQ, Quote, QuoteWithRFQ, CreateCounterOfferData, CounterOffer } from '../../types/item.types';
import { HybridCompareModal } from '../../components/HybridCompareModal';
import { useNotifications } from '../../context/NotificationContext';

interface MyRFQsProps {
  onNavigate: (page: string) => void;
}

type RFQStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired' | 'negotiating' | 'cancelled' | 'declined';

// Extended RFQ with intelligence data
interface RFQ {
  id: string;
  rfqId?: string; // Real database ID
  itemName: string;
  itemSku: string;
  sellerName: string;
  quantity: number;
  status: RFQStatus;
  quotedPrice?: number;
  currency: string;
  message?: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
  // Intelligence fields
  leadTimeDays?: number;
  supplierReliability?: number;
  supplierResponseSpeed?: 'fast' | 'moderate' | 'slow';
  counterOfferCount?: number;
  hasMultipleQuotes?: boolean;
  relatedQuotes?: SupplierQuote[];
  timeline?: TimelineEvent[];
  // Decline info (from seller)
  declineReason?: string;
  declinedAt?: string;
  // Real data from API - uses partial Quote type since we only access id to fetch full details
  quote?: Partial<Quote> & { id: string };
  rawRfq?: ItemRFQ;
}

interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  quotedPrice: number;
  leadTimeDays: number;
  reliability: number;
  responseSpeed: 'fast' | 'moderate' | 'slow';
  verified: boolean;
  quotedAt: string;
}

interface TimelineEvent {
  id: string;
  type: 'created' | 'viewed' | 'quoted' | 'counter_offer' | 'accepted' | 'rejected' | 'expired';
  timestamp: string;
  description: string;
  actor?: string;
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

// Status Badge Component with Live Indicators
const StatusBadge: React.FC<{ status: RFQStatus; showIcon?: boolean }> = ({ status, showIcon = false }) => {
  const { styles, t } = usePortal();

  const config: Record<
    RFQStatus,
    { bg: string; darkBg: string; text: string; darkText: string; label: string; icon: React.ElementType }
  > = {
    pending: {
      bg: '#fef3c7',
      darkBg: '#78350f',
      text: '#92400e',
      darkText: '#fef3c7',
      label: t('buyer.myRfqs.pending') || 'Waiting',
      icon: Hourglass,
    },
    quoted: {
      bg: '#dbeafe',
      darkBg: '#1e3a5f',
      text: '#1e40af',
      darkText: '#93c5fd',
      label: t('buyer.myRfqs.quoted') || 'Responded',
      icon: CheckCircle,
    },
    negotiating: {
      bg: '#f3e8ff',
      darkBg: '#581c87',
      text: '#7c3aed',
      darkText: '#c4b5fd',
      label: 'Negotiating',
      icon: ArrowsClockwise,
    },
    accepted: {
      bg: '#dcfce7',
      darkBg: '#14532d',
      text: '#166534',
      darkText: '#bbf7d0',
      label: t('buyer.myRfqs.accepted') || 'Accepted',
      icon: Handshake,
    },
    rejected: {
      bg: '#fee2e2',
      darkBg: '#7f1d1d',
      text: '#991b1b',
      darkText: '#fecaca',
      label: t('buyer.myRfqs.rejected') || 'Rejected',
      icon: X,
    },
    expired: {
      bg: '#f3f4f6',
      darkBg: '#374151',
      text: '#6b7280',
      darkText: '#9ca3af',
      label: t('buyer.myRfqs.expired') || 'Expired',
      icon: Timer,
    },
    declined: {
      bg: '#fce4ec',
      darkBg: '#4a1525',
      text: '#c62828',
      darkText: '#ef9a9a',
      label: 'Declined by Seller',
      icon: Prohibit,
    },
    cancelled: { bg: '#f3f4f6', darkBg: '#374151', text: '#6b7280', darkText: '#9ca3af', label: 'Cancelled', icon: X },
  };

  const c = config[status];
  const isDark = styles.isDark;
  const Icon = c.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: isDark ? c.darkBg : c.bg,
        color: isDark ? c.darkText : c.text,
      }}
    >
      {showIcon && <Icon size={12} weight="bold" />}
      {c.label}
    </span>
  );
};

// Response Speed Indicator
const ResponseSpeedIndicator: React.FC<{ speed?: 'fast' | 'moderate' | 'slow' }> = ({ speed }) => {
  const { styles } = usePortal();
  if (!speed) return null;

  const config = {
    fast: { color: styles.success, label: 'Fast', icon: Lightning },
    moderate: { color: '#f59e0b', label: 'Moderate', icon: Clock },
    slow: { color: styles.textMuted, label: 'Slow', icon: Timer },
  };

  const c = config[speed];
  const Icon = c.icon;

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: `${c.color}15`, color: c.color }}
    >
      <Icon size={10} weight="fill" />
      {c.label}
    </span>
  );
};

export const MyRFQs: React.FC<MyRFQsProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const toast = useToast();
  const { notifications, markAsRead } = useNotifications();

  // Helper: mark unread RFQ notifications as read for a specific RFQ
  const markRfqNotificationsRead = useCallback(
    (rfqId: string) => {
      notifications
        .filter((n) => !n.read && n.entityType === 'rfq' && n.entityId === rfqId)
        .forEach((n) => markAsRead(n.id));
    },
    [notifications, markAsRead],
  );

  // Data state
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  // Modal state
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'compare' | 'timeline'>('overview');

  // Quote detail panel state
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithRFQ | null>(null);
  const [showQuotePanel, setShowQuotePanel] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Counter-offer dialog state
  const [showCounterOfferDialog, setShowCounterOfferDialog] = useState(false);
  const [quoteForCounterOffer, setQuoteForCounterOffer] = useState<Quote | null>(null);
  const [isSubmittingCounterOffer, setIsSubmittingCounterOffer] = useState(false);
  const [quoteCounterOffers, setQuoteCounterOffers] = useState<CounterOffer[]>([]);

  // Hybrid comparison modal state
  const [showHybridModal, setShowHybridModal] = useState(false);
  const [rfqForHybrid, setRfqForHybrid] = useState<RFQ | null>(null);

  // Cancel RFQ state
  const [cancelConfirm, setCancelConfirm] = useState<RFQ | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Reactivate RFQ state
  const [reactivateConfirm, setReactivateConfirm] = useState<RFQ | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  // Fetch RFQs on mount
  useEffect(() => {
    fetchRfqs();
  }, []);

  const fetchRfqs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiRfqs = await itemService.getBuyerRFQs();

      // Transform API RFQs to our RFQ type with additional computed fields
      const transformedRfqs = apiRfqs.map((rfq: ItemRFQ) => {
        // Get the first/latest quote from the quotes array (backend returns quotes sorted by createdAt desc)
        const latestQuote = rfq.quotes?.[0];

        // Extract item name - multi-item RFQs show summary, otherwise from item or message
        const hasMultiItems = (rfq.lineItems?.length ?? 0) > 1;
        let itemName = '';
        let partNumber = '';

        if (hasMultiItems) {
          const first = rfq.lineItems![0];
          const remaining = rfq.lineItems!.length - 1;
          itemName = `${first.itemName || first.item?.name || 'Item'} +${remaining} more`;
          partNumber = `${rfq.lineItems!.length} items`;
        } else {
          itemName = rfq.item?.name || '';
          partNumber = rfq.item?.sku || '';
          if (!itemName && rfq.message) {
            // Extract "Part: XXX" from message for general RFQs
            const partMatch = rfq.message.match(/^Part:\s*(.+?)(?:\n|$)/i);
            if (partMatch) {
              itemName = partMatch[1].trim();
            }
            // Extract "Part Number: XXX" from message
            const partNumMatch = rfq.message.match(/Part Number:\s*(.+?)(?:\n|$)/i);
            if (partNumMatch && partNumMatch[1].trim() !== 'N/A') {
              partNumber = partNumMatch[1].trim();
            }
          }
          if (!itemName) {
            itemName = 'General RFQ';
          }
        }

        return {
          id: rfq.rfqNumber || rfq.id.slice(0, 8).toUpperCase(),
          rfqId: rfq.id,
          itemName,
          itemSku: partNumber,
          sellerName:
            ((latestQuote as Record<string, unknown> | undefined)?.seller as { companyName?: string } | undefined)
              ?.companyName ||
            rfq.sellerCompanyName ||
            (latestQuote ? 'Seller' : 'Open to All'),
          quantity: rfq.quantity || 1,
          status: mapApiStatusToRfqStatus(rfq.status),
          quotedPrice: latestQuote?.totalPrice,
          currency: latestQuote?.currency || 'SAR',
          message: rfq.message,
          createdAt: rfq.createdAt,
          respondedAt: latestQuote?.sentAt,
          expiresAt: latestQuote?.validUntil,
          leadTimeDays: latestQuote?.deliveryDays,
          supplierReliability: 90, // Placeholder: resolve from seller profile when available
          supplierResponseSpeed: 'moderate' as const,
          declineReason: (rfq as unknown as Record<string, unknown>).ignoredReason as string | undefined,
          declinedAt: (rfq as unknown as Record<string, unknown>).ignoredAt as string | undefined,
          hasMultipleQuotes: (rfq.quotes?.length || 0) > 1,
          quote: latestQuote,
          rawRfq: rfq,
        };
      });

      setRfqs(transformedRfqs as RFQ[]);
    } catch (err) {
      console.error('Failed to fetch RFQs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load RFQs');
      setRfqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel RFQ handler
  const handleCancelRFQ = async (rfq: RFQ) => {
    if (!rfq.rfqId) return;

    try {
      setIsCancelling(true);

      await itemService.cancelRFQ(rfq.rfqId);
      setCancelConfirm(null);
      fetchRfqs(); // Refresh list
      toast.addToast({
        type: 'success',
        title: 'RFQ Cancelled',
        message: `RFQ ${rfq.id} has been cancelled. You can reactivate it later.`,
      });
    } catch (err) {
      console.error('Failed to cancel RFQ:', err);
      toast.addToast({
        type: 'error',
        title: 'Failed to Cancel RFQ',
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Reactivate RFQ handler
  const handleReactivateRFQ = async (rfq: RFQ) => {
    if (!rfq.rfqId) return;

    try {
      setIsReactivating(true);

      await itemService.reactivateRFQ(rfq.rfqId);
      setReactivateConfirm(null);
      fetchRfqs(); // Refresh list
      toast.addToast({
        type: 'success',
        title: 'RFQ Reactivated',
        message: `RFQ ${rfq.id} is now active again and can receive quotes.`,
      });
    } catch (err) {
      console.error('Failed to reactivate RFQ:', err);
      toast.addToast({
        type: 'error',
        title: 'Failed to Reactivate RFQ',
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsReactivating(false);
    }
  };

  // Map API status to RFQ status
  const mapApiStatusToRfqStatus = (status: string): RFQStatus => {
    const statusMap: Record<string, RFQStatus> = {
      PENDING: 'pending',
      NEW: 'pending',
      VIEWED: 'pending',
      UNDER_REVIEW: 'pending',
      IGNORED: 'declined',
      QUOTED: 'quoted',
      NEGOTIATION: 'negotiating',
      NEGOTIATING: 'negotiating',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      CANCELLED: 'cancelled',
    };
    // Handle case-insensitive status matching
    return statusMap[status.toUpperCase()] || 'pending';
  };

  // View quote details
  const handleViewQuote = async (rfq: RFQ) => {
    // Mark related notifications as read when user interacts with an RFQ
    if (rfq.rfqId) {
      markRfqNotificationsRead(rfq.rfqId);
    }

    if (!rfq.quote?.id && !rfq.rawRfq) {
      openDetail(rfq);
      return;
    }

    try {
      setIsLoadingQuote(true);

      // If we have a quote ID, fetch the full quote details
      if (rfq.quote?.id) {
        const [quoteDetails, counterOffers] = await Promise.all([
          quoteService.getQuote(rfq.quote.id),
          counterOfferService.getCounterOffers(rfq.quote.id),
        ]);
        if (quoteDetails) {
          setSelectedQuote(quoteDetails);
          setQuoteCounterOffers(counterOffers);
          setShowQuotePanel(true);
          return;
        }
      }

      // Otherwise show the regular detail modal
      openDetail(rfq);
    } catch (err) {
      console.error('Failed to load quote:', err);
      openDetail(rfq);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Handle quote actions from panel
  const handleAcceptQuote = async (quoteId: string) => {
    try {
      portalApiLogger.info('[AcceptQuote] Accepting quote:', quoteId);

      // Use the correct endpoint: POST /api/items/quotes/:id/accept
      // This creates a MarketplaceOrder and updates Quote + RFQ status
      const order = await marketplaceOrderService.acceptQuote(quoteId, {});
      portalApiLogger.info('[AcceptQuote] Order created:', order);

      setShowQuotePanel(false);
      setShowDetailModal(false);
      fetchRfqs(); // Refresh list

      // Success feedback with toast
      toast.addToast({
        type: 'success',
        title: 'Quote Accepted!',
        message: `Order ${order.orderNumber || ''} has been created. You can track it in Orders.`,
        duration: 5000,
        action: {
          label: 'View Orders',
          onClick: () => onNavigate('orders'),
        },
      });
    } catch (err) {
      console.error('[AcceptQuote] Failed:', err);
      toast.addToast({
        type: 'error',
        title: 'Failed to Accept Quote',
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
        duration: 6000,
      });
    }
  };

  const handleRejectQuote = async (quoteId: string, reason: string) => {
    try {
      // Use the correct endpoint: POST /api/items/quotes/:id/reject
      await marketplaceOrderService.rejectQuote(quoteId, { reason });
      setShowQuotePanel(false);
      fetchRfqs();
      toast.addToast({
        type: 'info',
        title: 'Quote Declined',
        message: 'The seller has been notified of your decision.',
      });
    } catch (err) {
      console.error('Failed to reject quote:', err);
      toast.addToast({
        type: 'error',
        title: 'Failed to Decline Quote',
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    }
  };

  const handleCounterOffer = (quote: Quote) => {
    setQuoteForCounterOffer(quote);
    setShowCounterOfferDialog(true);
  };

  const handleSubmitCounterOffer = async (data: CreateCounterOfferData) => {
    if (!quoteForCounterOffer) return;

    try {
      setIsSubmittingCounterOffer(true);

      await counterOfferService.createCounterOffer(quoteForCounterOffer.id, data);
      setShowCounterOfferDialog(false);
      setQuoteForCounterOffer(null);
      setShowQuotePanel(false);
      fetchRfqs();
      toast.addToast({
        type: 'success',
        message: 'Counter offer submitted successfully',
      });
    } catch (err) {
      console.error('Failed to submit counter offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit counter offer. Please try again.';
      toast.addToast({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmittingCounterOffer(false);
    }
  };

  // Open RFQ detail modal
  const openDetail = useCallback((rfq: RFQ) => {
    setSelectedRFQ(rfq);
    setDetailTab('overview');
    setShowDetailModal(true);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const waiting = rfqs.filter((r) => r.status === 'pending').length;
    const responded = rfqs.filter((r) => r.status === 'quoted').length;
    const negotiating = rfqs.filter((r) => r.status === 'negotiating').length;
    const accepted = rfqs.filter((r) => r.status === 'accepted').length;
    const declined = rfqs.filter((r) => r.status === 'declined').length;
    const withMultipleQuotes = rfqs.filter((r) => r.hasMultipleQuotes).length;
    return { waiting, responded, negotiating, accepted, declined, withMultipleQuotes };
  }, [rfqs]);

  // Filtered data
  const filteredData = useMemo(() => {
    return rfqs.filter((rfq) => {
      if (statusFilter !== 'all' && rfq.status !== statusFilter) return false;
      return true;
    });
  }, [rfqs, statusFilter]);

  // Column helper
  const columnHelper = createColumnHelper<RFQ>();

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: t('buyer.myRfqs.rfqId'),
        cell: (info) => (
          <span className="font-mono text-xs" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('itemName', {
        header: t('buyer.myRfqs.item'),
        cell: (info) => (
          <div>
            <div className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {info.getValue()}
            </div>
            <div className="text-xs font-mono" style={{ color: styles.textMuted }}>
              {info.row.original.itemSku}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: t('buyer.myRfqs.qty'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('sellerName', {
        header: t('buyer.myRfqs.seller') || 'Seller',
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textSecondary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('quotedPrice', {
        header: t('buyer.myRfqs.quotedPrice'),
        cell: (info) => {
          const price = info.getValue();
          const rfq = info.row.original;
          return price ? (
            <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {formatCurrency(price, rfq.currency)}
            </span>
          ) : (
            <span className="text-xs" style={{ color: styles.textMuted }}>
              {t('buyer.myRfqs.awaitingQuote')}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: t('buyer.myRfqs.status'),
        cell: (info) => {
          const rfq = info.row.original;
          return (
            <div>
              <StatusBadge status={info.getValue()} />
              {rfq.status === 'declined' && rfq.declineReason && (
                <p
                  className="text-[10px] mt-0.5 max-w-[160px] truncate"
                  style={{ color: styles.textMuted }}
                  title={rfq.declineReason}
                >
                  {rfq.declineReason}
                </p>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: t('buyer.myRfqs.created'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textMuted }}>
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="w-full text-center block">{t('common.actions')}</span>,
        cell: (info) => {
          const rfq = info.row.original;
          const hasQuote = rfq.status === 'quoted' || rfq.quote;
          const hasComparison = rfq.hasMultipleQuotes;
          const canCancel = rfq.status === 'pending';
          const canReactivate = rfq.status === 'cancelled';

          return (
            <div className="flex items-center justify-center gap-1">
              {hasComparison && (
                <button
                  onClick={() => {
                    setSelectedRFQ(rfq);
                    setDetailTab('compare');
                    setShowDetailModal(true);
                  }}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: styles.info }}
                  title="Compare Quotes"
                >
                  <Scales size={16} />
                </button>
              )}
              {hasQuote ? (
                <button
                  onClick={() => handleViewQuote(rfq)}
                  disabled={isLoadingQuote}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                  style={{
                    backgroundColor: styles.isDark ? '#1e3a5f' : '#dbeafe',
                    color: styles.info,
                  }}
                  title="View Quote"
                >
                  {isLoadingQuote ? <Spinner size={12} className="animate-spin" /> : <Eye size={12} />}
                  View
                </button>
              ) : (
                <button
                  onClick={() => openDetail(rfq)}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: styles.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  title={t('buyer.myRfqs.viewDetails')}
                >
                  <Eye size={16} />
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setCancelConfirm(rfq)}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  title="Cancel RFQ"
                >
                  <Prohibit size={16} />
                </button>
              )}
              {canReactivate && (
                <button
                  onClick={() => setReactivateConfirm(rfq)}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: styles.success }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  title="Reactivate RFQ"
                >
                  <ArrowsClockwise size={16} />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [columnHelper, styles, t, openDetail, handleViewQuote, isLoadingQuote],
  );

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
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
          title={t('buyer.myRfqs.title')}
          subtitle={t('buyer.myRfqs.subtitle')}
          actions={
            <Button onClick={() => onNavigate('rfq')}>
              <Plus size={16} className={direction === 'rtl' ? 'ml-2' : 'mr-2'} />
              {t('buyer.myRfqs.newRfq')}
            </Button>
          }
        />

        {/* Stats Cards - RFQ Status Intelligence */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <KPICard
            id="waiting"
            label="Waiting"
            value={stats.waiting.toString()}
            change=""
            trend="neutral"
            icon={<Hourglass size={18} />}
            color="amber"
          />
          <KPICard
            id="responded"
            label="Responded"
            value={stats.responded.toString()}
            change=""
            trend="neutral"
            icon={<CheckCircle size={18} />}
            color="blue"
          />
          <KPICard
            id="negotiating"
            label="Negotiating"
            value={stats.negotiating.toString()}
            change=""
            trend="neutral"
            icon={<ArrowsClockwise size={18} />}
            color="violet"
          />
          <KPICard
            id="accepted"
            label="Accepted"
            value={stats.accepted.toString()}
            change=""
            trend="neutral"
            icon={<Handshake size={18} />}
            color="emerald"
          />
          <KPICard
            id="declined"
            label="Declined"
            value={stats.declined.toString()}
            change=""
            trend="neutral"
            icon={<Prohibit size={18} />}
            color="red"
          />
        </div>

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
              placeholder={t('buyer.myRfqs.search')}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1"
              style={{ color: styles.textPrimary }}
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('buyer.myRfqs.allStatus') || 'All Status' },
              { value: 'pending', label: t('buyer.myRfqs.pending') || 'Waiting' },
              { value: 'quoted', label: t('buyer.myRfqs.quoted') || 'Responded' },
              { value: 'negotiating', label: 'Negotiating' },
              { value: 'accepted', label: t('buyer.myRfqs.accepted') || 'Accepted' },
              { value: 'rejected', label: t('buyer.myRfqs.rejected') || 'Rejected' },
              { value: 'declined', label: 'Declined by Seller' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'expired', label: t('buyer.myRfqs.expired') || 'Expired' },
            ]}
            placeholder={t('buyer.myRfqs.allStatus') || 'All Status'}
          />

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              style={{ color: styles.textMuted }}
            >
              <X size={14} />
              {t('common.clearFilters')}
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            className="flex items-center justify-center p-12 rounded-lg border"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="text-center">
              <Spinner size={32} className="animate-spin mx-auto mb-3" style={{ color: styles.info }} />
              <p className="text-sm" style={{ color: styles.textMuted }}>
                Loading your RFQs...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div
            className="p-4 rounded-lg border mb-4"
            style={{ backgroundColor: styles.isDark ? '#7f1d1d' : '#fef2f2', borderColor: '#ef4444' }}
          >
            <p className="text-sm" style={{ color: '#ef4444' }}>
              {error}
            </p>
            <button onClick={fetchRfqs} className="mt-2 text-sm underline" style={{ color: '#ef4444' }}>
              Try again
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && filteredData.length === 0 && (
          <EmptyState
            icon={FileText}
            title={t('buyer.myRfqs.noRfqs')}
            description={t('buyer.myRfqs.noRfqsDesc')}
            action={<Button onClick={() => onNavigate('rfq')}>{t('buyer.myRfqs.createRfq')}</Button>}
          />
        )}
        {!isLoading && filteredData.length > 0 && (
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
                          style={{ color: styles.textSecondary, textAlign: direction === 'rtl' ? 'right' : 'left' }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() &&
                              (header.column.getIsSorted() === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody style={{ backgroundColor: styles.bgCard }}>
                  {table.getRowModel().rows.map((row, idx) => {
                    const isCancelled =
                      (row.original as RFQ).status === 'cancelled' || (row.original as RFQ).status === 'declined';
                    return (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 relative"
                        style={{
                          borderTop: idx > 0 ? `1px solid ${styles.border}` : undefined,
                          opacity: isCancelled ? 0.5 : 1,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              className="flex items-center justify-between px-4 py-3 mt-4 rounded-lg border"
              style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
            >
              <div className="text-sm" style={{ color: styles.textMuted }}>
                {t('common.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                -
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredData.length,
                )}{' '}
                {t('common.of')} {filteredData.length}
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
      </Container>

      {/* RFQ Detail Modal */}
      {showDetailModal && selectedRFQ && (
        <RFQDetailModal
          rfq={selectedRFQ}
          onClose={() => setShowDetailModal(false)}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onCustomize={() => {
            setRfqForHybrid(selectedRFQ);
            setShowHybridModal(true);
          }}
          onAcceptQuote={(rfq) => {
            if (rfq.quote?.id) {
              handleAcceptQuote(rfq.quote.id);
              setShowDetailModal(false);
            }
          }}
        />
      )}

      {/* Quote Detail Panel */}
      {selectedQuote && (
        <QuoteDetailPanel
          quote={selectedQuote}
          counterOffers={quoteCounterOffers}
          itemName={selectedQuote.rfq?.item?.name}
          itemSku={selectedQuote.rfq?.item?.sku}
          sellerName={(selectedQuote as Record<string, unknown>).sellerName as string | undefined}
          sellerCompany={(selectedQuote.rfq as Record<string, unknown>)?.sellerCompanyName as string | undefined}
          isOpen={showQuotePanel}
          onClose={() => {
            setShowQuotePanel(false);
            setSelectedQuote(null);
            setQuoteCounterOffers([]);
          }}
          onAccept={() => handleAcceptQuote(selectedQuote.id)}
          onReject={(reason) => handleRejectQuote(selectedQuote.id, reason || 'Quote rejected by buyer')}
          onCounterOffer={() => handleCounterOffer(selectedQuote)}
        />
      )}

      {/* Counter Offer Dialog */}
      {quoteForCounterOffer && (
        <CounterOfferDialog
          quote={quoteForCounterOffer}
          isOpen={showCounterOfferDialog}
          onClose={() => {
            setShowCounterOfferDialog(false);
            setQuoteForCounterOffer(null);
          }}
          onSubmit={handleSubmitCounterOffer}
          isSubmitting={isSubmittingCounterOffer}
        />
      )}

      {/* Hybrid Comparison Modal */}
      {rfqForHybrid && rfqForHybrid.relatedQuotes && (
        <HybridCompareModal
          isOpen={showHybridModal}
          onClose={() => {
            setShowHybridModal(false);
            setRfqForHybrid(null);
          }}
          quotes={rfqForHybrid.relatedQuotes}
          currency={rfqForHybrid.currency}
          rfqInfo={{
            rfqId: rfqForHybrid.id,
            rfqNumber: rfqForHybrid.id,
            itemName: rfqForHybrid.itemName,
          }}
        />
      )}

      {/* Cancel RFQ Confirmation Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-md rounded-xl border shadow-xl p-6"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              >
                <Prohibit size={20} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                  Cancel RFQ?
                </h3>
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  You can reactivate it later if needed
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: styles.bgSecondary }}>
              <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {cancelConfirm.itemName}
              </p>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                RFQ #{cancelConfirm.id} • Qty: {cancelConfirm.quantity}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: styles.border, color: styles.textSecondary }}
              >
                Keep RFQ
              </button>
              <button
                onClick={() => handleCancelRFQ(cancelConfirm)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                style={{ backgroundColor: '#ef4444', color: '#fff' }}
              >
                {isCancelling ? (
                  <>
                    <Spinner size={14} className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel RFQ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate RFQ Confirmation Modal */}
      {reactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-md rounded-xl border shadow-xl p-6"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
              >
                <ArrowsClockwise size={20} style={{ color: styles.success }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                  Reactivate RFQ?
                </h3>
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  This will make the RFQ active again
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: styles.bgSecondary }}>
              <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {reactivateConfirm.itemName}
              </p>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                RFQ #{reactivateConfirm.id} • Qty: {reactivateConfirm.quantity}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setReactivateConfirm(null)}
                disabled={isReactivating}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: styles.border, color: styles.textSecondary }}
              >
                Keep Cancelled
              </button>
              <button
                onClick={() => handleReactivateRFQ(reactivateConfirm)}
                disabled={isReactivating}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                style={{ backgroundColor: styles.success, color: '#fff' }}
              >
                {isReactivating ? (
                  <>
                    <Spinner size={14} className="animate-spin" />
                    Reactivating...
                  </>
                ) : (
                  'Reactivate RFQ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// VAT Constant
// =============================================================================
const VAT_RATE = 0.15; // 15% VAT (Saudi Arabia standard)

// =============================================================================
// RFQ Detail Modal with Compare, Timeline, Negotiate
// =============================================================================
interface RFQDetailModalProps {
  rfq: RFQ;
  onClose: () => void;
  activeTab: 'overview' | 'compare' | 'timeline';
  onTabChange: (tab: 'overview' | 'compare' | 'timeline') => void;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string) => string;
  onCustomize?: () => void;
  onAcceptQuote?: (rfq: RFQ) => void;
}

const RFQDetailModal: React.FC<RFQDetailModalProps> = ({
  rfq,
  onClose,
  activeTab,
  onTabChange,
  formatCurrency,
  formatDate,
  onCustomize,
  onAcceptQuote,
}) => {
  const { styles } = usePortal();
  const canAccept = rfq.status === 'quoted' && rfq.quote?.id;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Eye },
    { id: 'compare' as const, label: 'Compare', icon: Scales, disabled: !rfq.hasMultipleQuotes },
    { id: 'timeline' as const, label: 'Timeline', icon: CalendarBlank },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: styles.bgCard }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${styles.border}` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${styles.info}15` }}
            >
              <FileText size={24} weight="duotone" style={{ color: styles.info }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                {rfq.id}
              </h2>
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {rfq.itemName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={rfq.status} showIcon />
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              style={{ color: styles.textMuted }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2" style={{ borderBottom: `1px solid ${styles.border}` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                style={{
                  backgroundColor: activeTab === tab.id ? styles.bgActive : 'transparent',
                  color: activeTab === tab.id ? styles.textPrimary : styles.textSecondary,
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab rfq={rfq} formatCurrency={formatCurrency} formatDate={formatDate} styles={styles} />
          )}
          {activeTab === 'compare' && rfq.relatedQuotes && (
            <CompareTab
              quotes={rfq.relatedQuotes}
              currency={rfq.currency}
              formatCurrency={formatCurrency}
              styles={styles}
              onCustomize={onCustomize}
            />
          )}
          {activeTab === 'timeline' && rfq.timeline && (
            <TimelineTab timeline={rfq.timeline} formatDate={formatDate} styles={styles} />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${styles.border}` }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
            style={{ borderColor: styles.border, color: styles.textSecondary }}
          >
            Close
          </button>
          {canAccept && onAcceptQuote && (
            <button
              onClick={() => onAcceptQuote(rfq)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: styles.success }}
            >
              <CheckCircle size={18} weight="bold" />
              Accept Quote
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{
  rfq: RFQ;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string) => string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ rfq, formatCurrency, formatDate, styles }) => {
  // Calculate VAT if quoted
  const subtotal = rfq.quotedPrice || 0;
  const vatAmount = subtotal * VAT_RATE;
  const totalWithVat = subtotal + vatAmount;

  return (
    <div className="space-y-5">
      {/* Item & Supplier Section */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.borderLight}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: styles.bgCard }}
            >
              <Package size={20} style={{ color: styles.textMuted }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                Item
              </p>
              <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                {rfq.itemName}
              </p>
              {rfq.itemSku && (
                <p className="text-xs font-mono" style={{ color: styles.textMuted }}>
                  {rfq.itemSku}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.borderLight}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: styles.bgCard }}
            >
              <User size={20} style={{ color: styles.textMuted }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                Supplier
              </p>
              <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                {rfq.sellerName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity & Lead Time */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.borderLight}` }}
        >
          <p className="text-xs mb-1" style={{ color: styles.textMuted }}>
            Quantity
          </p>
          <p className="text-xl font-bold" style={{ color: styles.textPrimary }}>
            {rfq.quantity} <span className="text-sm font-normal">units</span>
          </p>
        </div>
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.borderLight}` }}
        >
          <p className="text-xs mb-1" style={{ color: styles.textMuted }}>
            Lead Time
          </p>
          <p className="text-xl font-bold" style={{ color: styles.textPrimary }}>
            {rfq.leadTimeDays ? `${rfq.leadTimeDays}` : '—'} <span className="text-sm font-normal">days</span>
          </p>
        </div>
      </div>

      {/* Pricing Section with VAT */}
      {rfq.quotedPrice ? (
        <div
          className="p-5 rounded-xl"
          style={{ backgroundColor: `${styles.success}08`, border: `1px solid ${styles.success}30` }}
        >
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: styles.textPrimary }}>
            <CurrencyDollar size={16} weight="bold" />
            Price Breakdown
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: styles.textSecondary }}>
                Subtotal
              </span>
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {formatCurrency(subtotal, rfq.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: styles.textSecondary }}>
                VAT (15%)
              </span>
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {formatCurrency(vatAmount, rfq.currency)}
              </span>
            </div>
            <div
              className="pt-3 mt-3 flex justify-between items-center"
              style={{ borderTop: `1px dashed ${styles.border}` }}
            >
              <span className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                Total (incl. VAT)
              </span>
              <span className="text-2xl font-bold" style={{ color: styles.success }}>
                {formatCurrency(totalWithVat, rfq.currency)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="p-5 rounded-xl text-center"
          style={{ backgroundColor: styles.bgSecondary, border: `1px dashed ${styles.border}` }}
        >
          <Hourglass size={24} style={{ color: styles.textMuted, margin: '0 auto 8px' }} />
          <p className="text-sm font-medium" style={{ color: styles.textMuted }}>
            Awaiting Quote
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
            Seller is preparing their offer
          </p>
        </div>
      )}

      {/* Decline Reason (shown when seller declined) */}
      {rfq.status === 'declined' && rfq.declineReason && (
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: styles.isDark ? '#4a1525' : '#fce4ec',
            border: `1px solid ${styles.isDark ? '#c62828' : '#ef9a9a'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Prohibit size={16} weight="bold" style={{ color: '#c62828' }} />
            <h4 className="text-sm font-semibold" style={{ color: styles.isDark ? '#ef9a9a' : '#c62828' }}>
              Declined by Seller
            </h4>
          </div>
          <p className="text-sm" style={{ color: styles.textPrimary }}>
            {rfq.declineReason}
          </p>
          {rfq.declinedAt && (
            <p className="text-xs mt-2" style={{ color: styles.textMuted }}>
              Declined on {formatDate(rfq.declinedAt)}
            </p>
          )}
        </div>
      )}

      {/* Supplier Intelligence */}
      {rfq.supplierReliability && (
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.borderLight}` }}
        >
          <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: styles.textMuted }}>
            Supplier Intelligence
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                Reliability
              </p>
              <p className="text-lg font-bold" style={{ color: styles.success }}>
                {rfq.supplierReliability}%
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: styles.textMuted }}>
                Response Speed
              </p>
              <ResponseSpeedIndicator speed={rfq.supplierResponseSpeed} />
            </div>
            <div>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                Quote Expires
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: rfq.expiresAt ? styles.textPrimary : styles.textMuted }}
              >
                {rfq.expiresAt ? formatDate(rfq.expiresAt) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Created Date */}
      <div className="flex items-center justify-between text-xs" style={{ color: styles.textMuted }}>
        <span>Created: {formatDate(rfq.createdAt)}</span>
        {rfq.respondedAt && <span>Responded: {formatDate(rfq.respondedAt)}</span>}
      </div>
    </div>
  );
};

// Compare Tab - Supplier Comparison View
const CompareTab: React.FC<{
  quotes: SupplierQuote[];
  currency: string;
  formatCurrency: (amount: number, currency: string) => string;
  styles: ReturnType<typeof usePortal>['styles'];
  onCustomize?: () => void;
}> = ({ quotes, currency, formatCurrency, styles, onCustomize }) => {
  const lowestPrice = Math.min(...quotes.map((q) => q.quotedPrice));
  const fastestDelivery = Math.min(...quotes.map((q) => q.leadTimeDays));
  const highestReliability = Math.max(...quotes.map((q) => q.reliability));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm" style={{ color: styles.textSecondary }}>
          <Scales size={16} />
          <span>Comparing {quotes.length} quotes</span>
        </div>
        {onCustomize && (
          <button
            onClick={onCustomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ backgroundColor: `${styles.accent}15`, color: styles.accent }}
          >
            <Plus size={14} weight="bold" />
            Customize Comparison
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: styles.border }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: styles.bgSecondary }}>
            <tr>
              <th className="px-4 py-3 text-left" style={{ color: styles.textMuted }}>
                Supplier
              </th>
              <th className="px-4 py-3 text-center" style={{ color: styles.textMuted }}>
                Price
              </th>
              <th className="px-4 py-3 text-center" style={{ color: styles.textMuted }}>
                Lead Time
              </th>
              <th className="px-4 py-3 text-center" style={{ color: styles.textMuted }}>
                Reliability
              </th>
              <th className="px-4 py-3 text-center" style={{ color: styles.textMuted }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote, idx) => {
              const isBestPrice = quote.quotedPrice === lowestPrice;
              const isFastest = quote.leadTimeDays === fastestDelivery;
              const isMostReliable = quote.reliability === highestReliability;

              return (
                <tr
                  key={quote.supplierId}
                  className="border-t"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: idx % 2 === 0 ? 'transparent' : styles.bgSecondary,
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: styles.textPrimary }}>
                        {quote.supplierName}
                      </span>
                      {quote.verified && <ShieldCheck size={14} weight="fill" style={{ color: styles.success }} />}
                    </div>
                    <ResponseSpeedIndicator speed={quote.responseSpeed} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${isBestPrice ? 'flex items-center justify-center gap-1' : ''}`}
                      style={{ color: isBestPrice ? styles.success : styles.textPrimary }}
                    >
                      {formatCurrency(quote.quotedPrice, currency)}
                      {isBestPrice && <Trophy size={12} weight="fill" />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={isFastest ? 'flex items-center justify-center gap-1' : ''}
                      style={{ color: isFastest ? styles.success : styles.textSecondary }}
                    >
                      {quote.leadTimeDays} days
                      {isFastest && <Lightning size={12} weight="fill" />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span style={{ color: isMostReliable ? styles.success : styles.textSecondary }}>
                      {quote.reliability}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="px-3 py-1 rounded text-xs font-medium transition-colors"
                      style={{ backgroundColor: styles.success, color: '#fff' }}
                    >
                      Accept
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Timeline Tab - RFQ Lifecycle Tracking
const TimelineTab: React.FC<{
  timeline: TimelineEvent[];
  formatDate: (date: string) => string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ timeline, styles }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    const icons = {
      created: FileText,
      viewed: Eye,
      quoted: CurrencyDollar,
      counter_offer: ArrowsClockwise,
      accepted: Handshake,
      rejected: X,
      expired: Timer,
    };
    return icons[type] || FileText;
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    const colors: Record<TimelineEvent['type'], string> = {
      created: '#6b7280',
      viewed: '#3b82f6',
      quoted: '#22c55e',
      counter_offer: '#8b5cf6',
      accepted: '#22c55e',
      rejected: '#ef4444',
      expired: '#f59e0b',
    };
    return colors[type];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm" style={{ color: styles.textSecondary }}>
        <CalendarBlank size={16} />
        <span>Full RFQ Lifecycle</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: styles.border }} />

        <div className="space-y-4">
          {timeline.map((event, _idx) => {
            const Icon = getEventIcon(event.type);
            const color = getEventColor(event.type);
            return (
              <div key={event.id} className="relative flex items-start gap-4 pl-10">
                {/* Event dot */}
                <div
                  className="absolute left-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
                >
                  <Icon size={10} weight="bold" style={{ color }} />
                </div>

                {/* Event content */}
                <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                      {event.description}
                    </span>
                    <span className="text-xs" style={{ color: styles.textMuted }}>
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  {event.actor && (
                    <span className="text-xs" style={{ color: styles.textMuted }}>
                      by {event.actor}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Info Card Helper
const _InfoCard: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, value, subValue, valueColor, styles }) => (
  <div className="p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
    <p className="text-xs mb-1" style={{ color: styles.textMuted }}>
      {label}
    </p>
    <p className="text-sm font-medium" style={{ color: valueColor || styles.textPrimary }}>
      {value}
    </p>
    {subValue && (
      <p className="text-xs font-mono" style={{ color: styles.textMuted }}>
        {subValue}
      </p>
    )}
  </div>
);

export default MyRFQs;
