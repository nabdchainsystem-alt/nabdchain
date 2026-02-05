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
} from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState, Select } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { itemService } from '../../services/itemService';
import { quoteService } from '../../services/quoteService';
import { counterOfferService } from '../../services/counterOfferService';
import { QuoteDetailPanel } from '../components/QuoteDetailPanel';
import { CounterOfferDialog } from '../components/CounterOfferDialog';
import { ValidityCountdown } from '../../components/ValidityCountdown';
import { ItemRFQ, Quote, QuoteWithRFQ, CreateCounterOfferData } from '../../types/item.types';
import { HybridCompareModal } from '../../components/HybridCompareModal';

interface MyRFQsProps {
  onNavigate: (page: string) => void;
}

type RFQStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired' | 'negotiating';

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
  // Real data from API
  quote?: Quote;
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

// Mock data with intelligence fields
const MOCK_RFQS: RFQ[] = [
  {
    id: 'RFQ-2024-001',
    itemName: 'Industrial Hydraulic Pump',
    itemSku: 'HYD-PUMP-001',
    sellerName: 'HydroTech Solutions',
    quantity: 5,
    status: 'quoted',
    quotedPrice: 2350,
    currency: 'SAR',
    message: 'Need urgent delivery for maintenance project',
    createdAt: '2024-01-15T10:30:00Z',
    respondedAt: '2024-01-15T14:45:00Z',
    expiresAt: '2024-01-22T14:45:00Z',
    leadTimeDays: 7,
    supplierReliability: 94,
    supplierResponseSpeed: 'fast',
    hasMultipleQuotes: true,
    relatedQuotes: [
      { supplierId: 's1', supplierName: 'HydroTech Solutions', quotedPrice: 2350, leadTimeDays: 7, reliability: 94, responseSpeed: 'fast', verified: true, quotedAt: '2024-01-15T14:45:00Z' },
      { supplierId: 's2', supplierName: 'Pump Masters', quotedPrice: 2480, leadTimeDays: 5, reliability: 88, responseSpeed: 'moderate', verified: true, quotedAt: '2024-01-16T09:00:00Z' },
      { supplierId: 's3', supplierName: 'Industrial Flow Co', quotedPrice: 2200, leadTimeDays: 12, reliability: 78, responseSpeed: 'slow', verified: false, quotedAt: '2024-01-17T11:30:00Z' },
    ],
    timeline: [
      { id: 't1', type: 'created', timestamp: '2024-01-15T10:30:00Z', description: 'RFQ created' },
      { id: 't2', type: 'viewed', timestamp: '2024-01-15T11:00:00Z', description: 'Viewed by HydroTech Solutions', actor: 'HydroTech Solutions' },
      { id: 't3', type: 'quoted', timestamp: '2024-01-15T14:45:00Z', description: 'Quote received: SAR 2,350', actor: 'HydroTech Solutions' },
      { id: 't4', type: 'quoted', timestamp: '2024-01-16T09:00:00Z', description: 'Quote received: SAR 2,480', actor: 'Pump Masters' },
      { id: 't5', type: 'quoted', timestamp: '2024-01-17T11:30:00Z', description: 'Quote received: SAR 2,200', actor: 'Industrial Flow Co' },
    ],
  },
  {
    id: 'RFQ-2024-002',
    itemName: 'Steel Bearings Set',
    itemSku: 'BRG-STL-100',
    sellerName: 'SKF Authorized Dealer',
    quantity: 100,
    status: 'pending',
    currency: 'SAR',
    message: 'Bulk order for production line',
    createdAt: '2024-01-18T09:15:00Z',
    timeline: [
      { id: 't1', type: 'created', timestamp: '2024-01-18T09:15:00Z', description: 'RFQ created' },
      { id: 't2', type: 'viewed', timestamp: '2024-01-18T10:30:00Z', description: 'Viewed by SKF Authorized Dealer', actor: 'SKF Authorized Dealer' },
    ],
  },
  {
    id: 'RFQ-2024-003',
    itemName: 'Air Compressor Unit',
    itemSku: 'CMP-AIR-500',
    sellerName: 'Atlas Copco MENA',
    quantity: 2,
    status: 'accepted',
    quotedPrice: 16500,
    currency: 'SAR',
    createdAt: '2024-01-10T11:20:00Z',
    respondedAt: '2024-01-10T16:30:00Z',
    leadTimeDays: 14,
    supplierReliability: 98,
    supplierResponseSpeed: 'fast',
    timeline: [
      { id: 't1', type: 'created', timestamp: '2024-01-10T11:20:00Z', description: 'RFQ created' },
      { id: 't2', type: 'quoted', timestamp: '2024-01-10T16:30:00Z', description: 'Quote received: SAR 16,500', actor: 'Atlas Copco MENA' },
      { id: 't3', type: 'accepted', timestamp: '2024-01-11T09:00:00Z', description: 'Quote accepted' },
    ],
  },
  {
    id: 'RFQ-2024-004',
    itemName: 'Electric Motor 15KW',
    itemSku: 'MTR-ELC-15K',
    sellerName: 'Siemens Industrial',
    quantity: 3,
    status: 'negotiating',
    quotedPrice: 10200,
    currency: 'SAR',
    message: 'Quote too high, looking for alternatives',
    createdAt: '2024-01-08T08:45:00Z',
    respondedAt: '2024-01-09T10:15:00Z',
    leadTimeDays: 10,
    supplierReliability: 96,
    supplierResponseSpeed: 'moderate',
    counterOfferCount: 1,
    timeline: [
      { id: 't1', type: 'created', timestamp: '2024-01-08T08:45:00Z', description: 'RFQ created' },
      { id: 't2', type: 'quoted', timestamp: '2024-01-09T10:15:00Z', description: 'Quote received: SAR 10,200', actor: 'Siemens Industrial' },
      { id: 't3', type: 'counter_offer', timestamp: '2024-01-10T14:00:00Z', description: 'Counter offer sent: SAR 9,500' },
    ],
  },
  {
    id: 'RFQ-2024-005',
    itemName: 'Valve Assembly Kit',
    itemSku: 'VLV-KIT-200',
    sellerName: 'FlowControl Systems',
    quantity: 25,
    status: 'expired',
    currency: 'SAR',
    createdAt: '2024-01-01T14:00:00Z',
    expiresAt: '2024-01-08T14:00:00Z',
    timeline: [
      { id: 't1', type: 'created', timestamp: '2024-01-01T14:00:00Z', description: 'RFQ created' },
      { id: 't2', type: 'expired', timestamp: '2024-01-08T14:00:00Z', description: 'RFQ expired - no response' },
    ],
  },
  {
    id: 'RFQ-2024-006',
    itemName: 'PLC Controller Module',
    itemSku: 'PLC-CTR-S7',
    sellerName: 'Automation Parts Co',
    quantity: 4,
    status: 'quoted',
    quotedPrice: 17800,
    currency: 'SAR',
    createdAt: '2024-01-20T13:30:00Z',
    respondedAt: '2024-01-20T17:00:00Z',
    expiresAt: '2024-01-27T17:00:00Z',
    leadTimeDays: 5,
    supplierReliability: 91,
    supplierResponseSpeed: 'fast',
    timeline: [
      { id: 't1', type: 'created', timestamp: '2024-01-20T13:30:00Z', description: 'RFQ created' },
      { id: 't2', type: 'quoted', timestamp: '2024-01-20T17:00:00Z', description: 'Quote received: SAR 17,800', actor: 'Automation Parts Co' },
    ],
  },
];

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

  const config: Record<RFQStatus, { bg: string; darkBg: string; text: string; darkText: string; label: string; icon: React.ElementType }> = {
    pending: { bg: '#fef3c7', darkBg: '#78350f', text: '#92400e', darkText: '#fef3c7', label: t('buyer.myRfqs.pending') || 'Waiting', icon: Hourglass },
    quoted: { bg: '#dbeafe', darkBg: '#1e3a5f', text: '#1e40af', darkText: '#93c5fd', label: t('buyer.myRfqs.quoted') || 'Responded', icon: CheckCircle },
    negotiating: { bg: '#f3e8ff', darkBg: '#581c87', text: '#7c3aed', darkText: '#c4b5fd', label: 'Negotiating', icon: ArrowsClockwise },
    accepted: { bg: '#dcfce7', darkBg: '#14532d', text: '#166534', darkText: '#bbf7d0', label: t('buyer.myRfqs.accepted') || 'Accepted', icon: Handshake },
    rejected: { bg: '#fee2e2', darkBg: '#7f1d1d', text: '#991b1b', darkText: '#fecaca', label: t('buyer.myRfqs.rejected') || 'Rejected', icon: X },
    expired: { bg: '#f3f4f6', darkBg: '#374151', text: '#6b7280', darkText: '#9ca3af', label: t('buyer.myRfqs.expired') || 'Expired', icon: Timer },
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
  const { getToken } = useAuth();

  // Data state
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  // Hybrid comparison modal state
  const [showHybridModal, setShowHybridModal] = useState(false);
  const [rfqForHybrid, setRfqForHybrid] = useState<RFQ | null>(null);

  // Fetch RFQs on mount
  useEffect(() => {
    fetchRfqs();
  }, []);

  const fetchRfqs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const apiRfqs = await itemService.getBuyerRFQs(token);

      // Transform API RFQs to our RFQ type with additional computed fields
      const transformedRfqs: RFQ[] = apiRfqs.map((rfq: ItemRFQ) => ({
        id: rfq.rfqNumber || rfq.id.slice(0, 8).toUpperCase(),
        rfqId: rfq.id,
        itemName: rfq.item?.name || 'General RFQ',
        itemSku: rfq.item?.sku || '',
        sellerName: rfq.sellerCompanyName || 'Unknown Seller',
        quantity: rfq.quantity || 1,
        status: mapApiStatusToRfqStatus(rfq.status),
        quotedPrice: rfq.quote?.totalPrice,
        currency: rfq.quote?.currency || 'SAR',
        message: rfq.message,
        createdAt: rfq.createdAt,
        respondedAt: rfq.quote?.sentAt,
        expiresAt: rfq.quote?.validUntil,
        leadTimeDays: rfq.quote?.deliveryDays,
        supplierReliability: 90, // TODO: Get from seller profile
        supplierResponseSpeed: 'moderate' as const,
        hasMultipleQuotes: false, // TODO: Implement multiple quotes logic
        quote: rfq.quote,
        rawRfq: rfq,
      }));

      setRfqs(transformedRfqs);
    } catch (err) {
      console.error('Failed to fetch RFQs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load RFQs');
      // Fall back to mock data in development
      setRfqs(MOCK_RFQS);
    } finally {
      setIsLoading(false);
    }
  };

  // Map API status to RFQ status
  const mapApiStatusToRfqStatus = (status: string): RFQStatus => {
    const statusMap: Record<string, RFQStatus> = {
      PENDING: 'pending',
      UNDER_REVIEW: 'pending',
      QUOTED: 'quoted',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      CANCELLED: 'expired',
    };
    return statusMap[status] || 'pending';
  };

  // View quote details
  const handleViewQuote = async (rfq: RFQ) => {
    if (!rfq.quote?.id && !rfq.rawRfq) {
      openDetail(rfq);
      return;
    }

    try {
      setIsLoadingQuote(true);
      const token = await getToken();
      if (!token) return;

      // If we have a quote ID, fetch the full quote details
      if (rfq.quote?.id) {
        const quoteDetails = await quoteService.getQuote(token, rfq.quote.id);
        if (quoteDetails) {
          setSelectedQuote(quoteDetails);
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
      const token = await getToken();
      if (!token) return;

      await itemService.acceptRFQ(token, selectedQuote?.rfqId || '');
      setShowQuotePanel(false);
      fetchRfqs(); // Refresh list
    } catch (err) {
      console.error('Failed to accept quote:', err);
    }
  };

  const handleRejectQuote = async (quoteId: string, reason: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await itemService.rejectRFQ(token, selectedQuote?.rfqId || '');
      setShowQuotePanel(false);
      fetchRfqs();
    } catch (err) {
      console.error('Failed to reject quote:', err);
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
      const token = await getToken();
      if (!token) return;

      await counterOfferService.createCounterOffer(token, quoteForCounterOffer.id, data);
      setShowCounterOfferDialog(false);
      setQuoteForCounterOffer(null);
      setShowQuotePanel(false);
      fetchRfqs();
    } catch (err) {
      console.error('Failed to submit counter offer:', err);
      throw err;
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
    const waiting = rfqs.filter(r => r.status === 'pending').length;
    const responded = rfqs.filter(r => r.status === 'quoted').length;
    const negotiating = rfqs.filter(r => r.status === 'negotiating').length;
    const accepted = rfqs.filter(r => r.status === 'accepted').length;
    const withMultipleQuotes = rfqs.filter(r => r.hasMultipleQuotes).length;
    return { waiting, responded, negotiating, accepted, withMultipleQuotes };
  }, [rfqs]);

  // Filtered data
  const filteredData = useMemo(() => {
    return rfqs.filter(rfq => {
      if (statusFilter !== 'all' && rfq.status !== statusFilter) return false;
      return true;
    });
  }, [rfqs, statusFilter]);

  // Column helper
  const columnHelper = createColumnHelper<RFQ>();

  // Columns
  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: t('buyer.myRfqs.rfqId'),
      cell: info => (
        <span className="font-mono text-xs" style={{ color: styles.textPrimary }}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('itemName', {
      header: t('buyer.myRfqs.item'),
      cell: info => (
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
    columnHelper.accessor('sellerName', {
      header: t('buyer.myRfqs.seller'),
      cell: info => (
        <span className="text-sm" style={{ color: styles.textPrimary }}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('quantity', {
      header: t('buyer.myRfqs.qty'),
      cell: info => (
        <span className="text-sm" style={{ color: styles.textPrimary }}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('quotedPrice', {
      header: t('buyer.myRfqs.quotedPrice'),
      cell: info => {
        const price = info.getValue();
        const rfq = info.row.original;
        return price ? (
          <div>
            <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {formatCurrency(price, rfq.currency)}
            </span>
            {rfq.expiresAt && (
              <div className="mt-1">
                <ValidityCountdown
                  validUntil={rfq.expiresAt}
                  size="xs"
                  variant="badge"
                  showIcon={true}
                />
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs" style={{ color: styles.textMuted }}>
            {t('buyer.myRfqs.awaitingQuote')}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: t('buyer.myRfqs.status'),
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('createdAt', {
      header: t('buyer.myRfqs.created'),
      cell: info => (
        <span className="text-sm" style={{ color: styles.textMuted }}>
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="w-full text-center block">{t('common.actions')}</span>,
      cell: info => {
        const rfq = info.row.original;
        const hasQuote = rfq.status === 'quoted' || rfq.quote;
        const hasComparison = rfq.hasMultipleQuotes;

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
            {hasQuote && (
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
                {isLoadingQuote ? <Spinner size={12} className="animate-spin" /> : <CurrencyDollar size={12} />}
                View Quote
              </button>
            )}
            <button
              onClick={() => openDetail(rfq)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title={t('buyer.myRfqs.viewDetails')}
            >
              <Eye size={16} />
            </button>
          </div>
        );
      },
    }),
  ], [columnHelper, styles, t, openDetail, handleViewQuote, isLoadingQuote]);

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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard
            icon={Hourglass}
            label="Waiting"
            value={stats.waiting}
            color="#f59e0b"
            styles={styles}
          />
          <StatCard
            icon={CheckCircle}
            label="Responded"
            value={stats.responded}
            color={styles.info}
            styles={styles}
          />
          <StatCard
            icon={ArrowsClockwise}
            label="Negotiating"
            value={stats.negotiating}
            color="#8b5cf6"
            styles={styles}
          />
          <StatCard
            icon={Handshake}
            label="Accepted"
            value={stats.accepted}
            color={styles.success}
            styles={styles}
          />
          <StatCard
            icon={Scales}
            label="Multiple Quotes"
            value={stats.withMultipleQuotes}
            color={styles.info}
            styles={styles}
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
              <p className="text-sm" style={{ color: styles.textMuted }}>Loading your RFQs...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div
            className="p-4 rounded-lg border mb-4"
            style={{ backgroundColor: styles.isDark ? '#7f1d1d' : '#fef2f2', borderColor: '#ef4444' }}
          >
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            <button
              onClick={fetchRfqs}
              className="mt-2 text-sm underline"
              style={{ color: '#ef4444' }}
            >
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
            action={
              <Button onClick={() => onNavigate('rfq')}>
                {t('buyer.myRfqs.createRfq')}
              </Button>
            }
          />
        )}
        {!isLoading && filteredData.length > 0 && (
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
                          style={{ color: styles.textSecondary, textAlign: direction === 'rtl' ? 'right' : 'left' }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() && (
                              header.column.getIsSorted() === 'asc'
                                ? <CaretUp size={12} />
                                : <CaretDown size={12} />
                            )}
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
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      style={{
                        borderTop: idx > 0 ? `1px solid ${styles.border}` : undefined,
                      }}
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
                {t('common.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                -{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)}
                {' '}{t('common.of')} {filteredData.length}
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
        />
      )}

      {/* Quote Detail Panel */}
      {selectedQuote && (
        <QuoteDetailPanel
          quote={selectedQuote}
          isOpen={showQuotePanel}
          onClose={() => {
            setShowQuotePanel(false);
            setSelectedQuote(null);
          }}
          onAccept={handleAcceptQuote}
          onReject={handleRejectQuote}
          onCounterOffer={handleCounterOffer}
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
    </div>
  );
};

// =============================================================================
// Stat Card Component
// =============================================================================
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ icon: Icon, label, value, color, styles }) => (
  <div
    className="p-3 rounded-lg border"
    style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
  >
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={16} weight="fill" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px]" style={{ color: styles.textMuted }}>{label}</p>
        <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>{value}</p>
      </div>
    </div>
  </div>
);

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
}

const RFQDetailModal: React.FC<RFQDetailModalProps> = ({
  rfq,
  onClose,
  activeTab,
  onTabChange,
  formatCurrency,
  formatDate,
  onCustomize,
}) => {
  const { styles } = usePortal();

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Eye },
    { id: 'compare' as const, label: 'Compare', icon: Scales, disabled: !rfq.hasMultipleQuotes },
    { id: 'timeline' as const, label: 'Timeline', icon: CalendarBlank },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl border shadow-xl flex flex-col"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: styles.border }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: styles.textPrimary }}>
              {rfq.id}
            </h2>
            <p className="text-sm" style={{ color: styles.textMuted }}>
              {rfq.itemName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={rfq.status} showIcon />
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: styles.textMuted }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: styles.border }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
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
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'overview' && (
            <OverviewTab rfq={rfq} formatCurrency={formatCurrency} formatDate={formatDate} styles={styles} />
          )}
          {activeTab === 'compare' && rfq.relatedQuotes && (
            <CompareTab quotes={rfq.relatedQuotes} currency={rfq.currency} formatCurrency={formatCurrency} styles={styles} onCustomize={onCustomize} />
          )}
          {activeTab === 'timeline' && rfq.timeline && (
            <TimelineTab timeline={rfq.timeline} formatDate={formatDate} styles={styles} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: styles.border }}>
          {rfq.status === 'quoted' && (
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: styles.success, color: '#fff' }}
            >
              Accept Quote
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: styles.border, color: styles.textSecondary }}
          >
            Close
          </button>
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
}> = ({ rfq, formatCurrency, formatDate, styles }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Item" value={rfq.itemName} subValue={rfq.itemSku} styles={styles} />
      <InfoCard label="Supplier" value={rfq.sellerName} styles={styles} />
      <InfoCard label="Quantity" value={`${rfq.quantity} units`} styles={styles} />
      <InfoCard
        label="Quoted Price"
        value={rfq.quotedPrice ? formatCurrency(rfq.quotedPrice, rfq.currency) : 'Awaiting'}
        valueColor={rfq.quotedPrice ? styles.success : styles.textMuted}
        styles={styles}
      />
      <InfoCard label="Lead Time" value={rfq.leadTimeDays ? `${rfq.leadTimeDays} days` : 'TBD'} styles={styles} />
      <InfoCard label="Created" value={formatDate(rfq.createdAt)} styles={styles} />
    </div>

    {rfq.supplierReliability && (
      <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
          Supplier Intelligence
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs" style={{ color: styles.textMuted }}>Reliability</p>
            <p className="text-lg font-bold" style={{ color: styles.success }}>{rfq.supplierReliability}%</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: styles.textMuted }}>Response Speed</p>
            <ResponseSpeedIndicator speed={rfq.supplierResponseSpeed} />
          </div>
          <div>
            <p className="text-xs" style={{ color: styles.textMuted }}>Quote Expires</p>
            <p className="text-sm font-medium" style={{ color: rfq.expiresAt ? styles.textPrimary : styles.textMuted }}>
              {rfq.expiresAt ? formatDate(rfq.expiresAt) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);

// Compare Tab - Supplier Comparison View
const CompareTab: React.FC<{
  quotes: SupplierQuote[];
  currency: string;
  formatCurrency: (amount: number, currency: string) => string;
  styles: ReturnType<typeof usePortal>['styles'];
  onCustomize?: () => void;
}> = ({ quotes, currency, formatCurrency, styles, onCustomize }) => {
  const lowestPrice = Math.min(...quotes.map(q => q.quotedPrice));
  const fastestDelivery = Math.min(...quotes.map(q => q.leadTimeDays));
  const highestReliability = Math.max(...quotes.map(q => q.reliability));

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
              <th className="px-4 py-3 text-left" style={{ color: styles.textMuted }}>Supplier</th>
              <th className="px-4 py-3 text-center" style={{ color: styles.textMuted }}>Price</th>
              <th className="px-4 py-3 text-center" style={{ color: styles.textMuted }}>Lead Time</th>
              <th className="px-4 py-3 text-center" style={{ color: styles.textMuted }}>Reliability</th>
              <th className="px-4 py-3 text-center" style={{ color: styles.textMuted }}>Action</th>
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
                  style={{ borderColor: styles.border, backgroundColor: idx % 2 === 0 ? 'transparent' : styles.bgSecondary }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: styles.textPrimary }}>
                        {quote.supplierName}
                      </span>
                      {quote.verified && (
                        <ShieldCheck size={14} weight="fill" style={{ color: styles.success }} />
                      )}
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
                    <span
                      style={{ color: isMostReliable ? styles.success : styles.textSecondary }}
                    >
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
        <div
          className="absolute left-4 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: styles.border }}
        />

        <div className="space-y-4">
          {timeline.map((event, idx) => {
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
                <div
                  className="flex-1 p-3 rounded-lg"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
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
const InfoCard: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, value, subValue, valueColor, styles }) => (
  <div className="p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
    <p className="text-xs mb-1" style={{ color: styles.textMuted }}>{label}</p>
    <p className="text-sm font-medium" style={{ color: valueColor || styles.textPrimary }}>{value}</p>
    {subValue && <p className="text-xs font-mono" style={{ color: styles.textMuted }}>{subValue}</p>}
  </div>
);

export default MyRFQs;
