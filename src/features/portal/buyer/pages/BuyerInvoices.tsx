// =============================================================================
// Buyer Invoices Page - Full Table View (matching Seller design)
// =============================================================================
// Browse, filter, and view payment invoices from sellers
// =============================================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { marketplaceInvoiceService } from '../../services/marketplaceInvoiceService';
import { marketplacePaymentService } from '../../services/marketplacePaymentService';
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
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Eye,
  X,
  Funnel,
  Warning,
  Receipt,
  Spinner,
  CaretRight,
  CurrencyDollar,
  FilePdf,
} from 'phosphor-react';
import { EmptyState } from '../../components';
import { Select } from '../../components/ui';
import { usePortal } from '../../context/PortalContext';
import { AIResultCard } from '../../components/ai/AIResultCard';
import { useInvoiceAIRisk } from '../../hooks/useInvoiceAIRisk';
import {
  MarketplaceInvoice,
  MarketplacePayment,
  InvoiceStatus,
  InvoiceStats,
  getInvoiceStatusConfig,
  getPaymentStatusConfig,
  formatInvoiceAmount,
  getDaysUntilDue,
} from '../../types/invoice.types';

interface BuyerInvoicesProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

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

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Quick Stat Component
const QuickStat: React.FC<{
  label: string;
  value: string | number;
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

// Status badge component
const StatusBadge: React.FC<{ status: InvoiceStatus; styles: ReturnType<typeof usePortal>['styles'] }> = ({
  status,
  styles,
}) => {
  const config = getInvoiceStatusConfig(status);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor:
          status === 'paid'
            ? 'rgba(34,197,94,0.1)'
            : status === 'overdue'
              ? 'rgba(239,68,68,0.1)'
              : status === 'issued'
                ? 'rgba(59,130,246,0.1)'
                : status === 'cancelled'
                  ? 'rgba(107,114,128,0.1)'
                  : styles.bgSecondary,
        color:
          status === 'paid'
            ? styles.success
            : status === 'overdue'
              ? styles.error
              : status === 'issued'
                ? styles.info
                : status === 'cancelled'
                  ? styles.textMuted
                  : styles.textSecondary,
      }}
    >
      {config.label}
    </span>
  );
};

const columnHelper = createColumnHelper<MarketplaceInvoice>();

export const BuyerInvoices: React.FC<BuyerInvoicesProps> = ({ onNavigate: _onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // State
  const [invoices, setInvoices] = useState<MarketplaceInvoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Detail panel
  const [selectedInvoice, setSelectedInvoice] = useState<MarketplaceInvoice | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<MarketplacePayment[]>([]);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentBank, setPaymentBank] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // AI risk assessment
  const invoiceAI = useInvoiceAIRisk();

  // PDF download
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const handleDownloadPdf = async (invoice: MarketplaceInvoice) => {
    try {
      setDownloadingPdf(invoice.id);
      await marketplaceInvoiceService.downloadPdf(invoice.id, invoice.invoiceNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [invoicesRes, statsRes] = await Promise.all([
        marketplaceInvoiceService.getBuyerInvoices({
          status: statusFilter === 'all' ? undefined : (statusFilter as InvoiceStatus),
          search: searchQuery || undefined,
        }),
        marketplaceInvoiceService.getBuyerInvoiceStats(),
      ]);

      setInvoices(invoicesRes.invoices);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load payments when invoice selected
  const loadInvoicePayments = useCallback(async (invoiceId: string) => {
    try {
      const payments = await marketplacePaymentService.getInvoicePayments(invoiceId);
      setSelectedPayments(payments);
    } catch {
      setSelectedPayments([]);
    }
  }, []);

  // Handle view invoice
  const handleViewInvoice = async (invoice: MarketplaceInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailPanel(true);
    setShowPaymentForm(false);
    setPaymentRef('');
    setPaymentBank('');
    setPaymentError(null);
    await loadInvoicePayments(invoice.id);
  };

  // Handle record payment
  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentRef.trim()) return;
    setIsRecordingPayment(true);
    setPaymentError(null);
    try {
      const outstanding = selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0);
      await marketplacePaymentService.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: outstanding,
        paymentMethod: 'bank_transfer',
        bankReference: paymentRef.trim(),
        bankName: paymentBank.trim() || undefined,
      });
      // Refresh data
      setShowPaymentForm(false);
      setPaymentRef('');
      setPaymentBank('');
      await loadInvoicePayments(selectedInvoice.id);
      await loadData();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Table columns - buyer perspective
  const columns = useMemo(
    () => [
      columnHelper.accessor('invoiceNumber', {
        meta: { align: 'start' as const },
        header: t('buyer.invoices.colInvoice') || 'Invoice',
        cell: (info) => (
          <div>
            <div className="font-medium" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
              {info.getValue()}
            </div>
            <div className="text-xs" style={{ color: styles.textMuted }}>
              {info.row.original.orderNumber}
            </div>
          </div>
        ),
        size: 140,
      }),
      columnHelper.accessor('sellerName', {
        meta: { align: 'start' as const },
        header: t('buyer.invoices.colSeller') || 'Seller',
        cell: (info) => (
          <div>
            <div style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>{info.getValue()}</div>
            {info.row.original.sellerCompany && (
              <div className="text-xs" style={{ color: styles.textMuted }}>
                {info.row.original.sellerCompany}
              </div>
            )}
          </div>
        ),
        size: 160,
      }),
      columnHelper.accessor('totalAmount', {
        meta: { align: 'end' as const },
        header: t('buyer.invoices.colAmount') || 'Amount',
        cell: (info) => (
          <div className="font-medium" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
            {formatInvoiceAmount(info.getValue(), info.row.original.currency)}
          </div>
        ),
        size: 100,
      }),
      columnHelper.display({
        id: 'paidBalance',
        meta: { align: 'end' as const },
        header: 'Paid / Balance',
        cell: (info) => {
          const inv = info.row.original;
          const paid = inv.paidAmount || 0;
          const balance = inv.balanceDue ?? inv.totalAmount - paid;
          return (
            <div style={{ fontSize: '0.75rem' }}>
              <div style={{ color: paid > 0 ? styles.success : styles.textMuted }}>
                {formatInvoiceAmount(paid, inv.currency)}
              </div>
              {balance > 0 && inv.status !== 'cancelled' && (
                <div style={{ color: styles.warning }}>{formatInvoiceAmount(balance, inv.currency)} due</div>
              )}
            </div>
          );
        },
        size: 120,
      }),
      columnHelper.accessor('status', {
        meta: { align: 'center' as const },
        header: t('buyer.invoices.colStatus') || 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} styles={styles} />,
        size: 100,
      }),
      columnHelper.accessor('dueDate', {
        meta: { align: 'center' as const },
        header: t('buyer.invoices.colDueDate') || 'Due Date',
        cell: (info) => {
          const dueDate = info.getValue();
          if (!dueDate) return <span style={{ color: styles.textMuted }}>-</span>;
          const daysUntil = getDaysUntilDue(dueDate);
          const isOverdue = daysUntil < 0;
          const isUrgent = daysUntil >= 0 && daysUntil <= 7;
          return (
            <div>
              <div
                style={{
                  color: isOverdue ? styles.error : isUrgent ? '#F59E0B' : styles.textPrimary,
                  fontSize: '0.79rem',
                }}
              >
                {formatDate(dueDate)}
              </div>
              {info.row.original.status === 'issued' && (
                <div
                  className="text-xs"
                  style={{
                    color: isOverdue ? styles.error : isUrgent ? '#F59E0B' : styles.textMuted,
                  }}
                >
                  {isOverdue ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
                </div>
              )}
            </div>
          );
        },
        size: 110,
      }),
      columnHelper.accessor('createdAt', {
        meta: { align: 'center' as const },
        header: t('buyer.invoices.colCreated') || 'Created',
        cell: (info) => (
          <span style={{ color: styles.textMuted, fontSize: '0.675rem' }}>{formatRelativeTime(info.getValue())}</span>
        ),
        size: 80,
      }),
      columnHelper.display({
        id: 'actions',
        meta: { align: 'center' as const },
        header: '',
        cell: (info) => {
          const invoice = info.row.original;
          return (
            <div className="flex items-center justify-center gap-1">
              {/* Download PDF */}
              {invoice.status !== 'draft' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPdf(invoice);
                  }}
                  disabled={downloadingPdf === invoice.id}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: styles.textMuted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                    e.currentTarget.style.color = styles.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = styles.textMuted;
                  }}
                  title={t('buyer.invoices.downloadPdf') || 'Download PDF'}
                >
                  {downloadingPdf === invoice.id ? (
                    <Spinner size={16} className="animate-spin" />
                  ) : (
                    <FilePdf size={16} />
                  )}
                </button>
              )}
              {/* View details */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewInvoice(invoice);
                }}
                className="p-1.5 rounded transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = styles.bgHover;
                  e.currentTarget.style.color = styles.info;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = styles.textMuted;
                }}
                title={t('buyer.invoices.viewDetails') || 'View details'}
              >
                <Eye size={16} />
              </button>
            </div>
          );
        },
        size: 80,
      }),
    ],
    [styles, isRtl, t, downloadingPdf],
  );

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.orderNumber.toLowerCase().includes(query) ||
          inv.sellerName.toLowerCase().includes(query) ||
          (inv.sellerCompany?.toLowerCase().includes(query) ?? false);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [invoices, searchQuery]);

  // Table instance
  const table = useReactTable<MarketplaceInvoice>({
    data: filteredInvoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              {t('buyer.invoices.title') || 'My Invoices'}
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              {t('buyer.invoices.subtitle') || 'View and manage your payment invoices'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className={`flex items-center gap-6 mb-6 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
            <QuickStat label={t('buyer.invoices.statTotal') || 'Total'} value={stats.total} styles={styles} />
            <QuickStat
              label={t('buyer.invoices.statPending') || 'Pending'}
              value={stats.issued}
              color="#F59E0B"
              styles={styles}
            />
            {stats.overdue > 0 && (
              <QuickStat
                label={t('buyer.invoices.statOverdue') || 'Overdue'}
                value={stats.overdue}
                color={styles.error}
                styles={styles}
                warning
              />
            )}
            <QuickStat
              label={t('buyer.invoices.statPaid') || 'Paid'}
              value={stats.paid}
              color={styles.success}
              styles={styles}
            />
            <QuickStat
              label={t('buyer.invoices.statOutstanding') || 'Outstanding'}
              value={formatInvoiceAmount(stats.totalOutstanding, stats.currency)}
              color={styles.info}
              styles={styles}
            />
          </div>
        )}

        {/* Filter Bar */}
        <div className="rounded-xl border mb-4" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
          {/* Filter Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: styles.border }}>
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: styles.textPrimary }}
            >
              <Funnel size={16} />
              {t('common.filters') || 'Filters'}
              <CaretRight
                size={14}
                className={`transition-transform ${filtersExpanded ? 'rotate-90' : ''}`}
                style={{ color: styles.textMuted }}
              />
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: styles.info, color: '#fff' }}>
                  {t('common.active') || 'Active'}
                </span>
              )}
            </button>
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
                  placeholder={t('buyer.invoices.searchPlaceholder') || 'Search invoices...'}
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

              {/* Status */}
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder={t('buyer.invoices.filterStatus') || 'Status'}
                options={[
                  { value: 'all', label: t('buyer.invoices.statusAll') || 'All Status' },
                  { value: 'issued', label: t('buyer.invoices.statusIssued') || 'Pending Payment' },
                  { value: 'paid', label: t('buyer.invoices.statusPaid') || 'Paid' },
                  { value: 'overdue', label: t('buyer.invoices.statusOverdue') || 'Overdue' },
                  { value: 'cancelled', label: t('buyer.invoices.statusCancelled') || 'Cancelled' },
                ]}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                  style={{ color: styles.error }}
                >
                  <X size={12} /> {t('common.clearAll') || 'Clear all'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 p-4 rounded-lg border flex items-center justify-between"
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderColor: styles.error,
              color: styles.error,
            }}
          >
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div
            className="rounded-xl border py-16 flex items-center justify-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <Spinner size={32} className="animate-spin" style={{ color: styles.info }} />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={Receipt}
              title={t('buyer.invoices.noInvoices') || 'No invoices yet'}
              description={
                t('buyer.invoices.noInvoicesDesc') || "You'll see invoices here once your orders are delivered."
              }
            />
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
                        const align = (header.column.columnDef.meta as { align?: string })?.align || 'start';
                        return (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                            style={{
                              color: styles.textMuted,
                              width: header.getSize(),
                              textAlign: align as 'start' | 'center' | 'end',
                            }}
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                className={`flex items-center gap-1 ${
                                  align === 'center' ? 'justify-center' : align === 'end' ? 'justify-end' : ''
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
                  {table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className="group transition-colors cursor-pointer"
                      style={{
                        borderBottom:
                          index === table.getRowModel().rows.length - 1 ? 'none' : `1px solid ${styles.tableBorder}`,
                      }}
                      onClick={() => handleViewInvoice(row.original)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = styles.tableRowHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align = (cell.column.columnDef.meta as { align?: string })?.align || 'start';
                        return (
                          <td
                            key={cell.id}
                            className="px-4 py-3"
                            style={{
                              width: cell.column.getSize(),
                              verticalAlign: 'middle',
                              textAlign: align as 'start' | 'center' | 'end',
                            }}
                            onClick={(e) => cell.column.id === 'actions' && e.stopPropagation()}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
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
                {t('buyer.invoices.showing') || 'Showing'} {filteredInvoices.length} {t('buyer.invoices.of') || 'of'}{' '}
                {invoices.length} {t('buyer.invoices.invoices') || 'invoices'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {showDetailPanel && selectedInvoice && (
        <div
          className="fixed right-0 top-0 h-full w-96 border-l shadow-xl z-50 overflow-auto"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: styles.border }}>
            <h2 className="font-semibold" style={{ color: styles.textPrimary }}>
              {t('buyer.invoices.invoiceDetails') || 'Invoice Details'}
            </h2>
            <button
              onClick={() => {
                setShowDetailPanel(false);
                setSelectedInvoice(null);
              }}
              className="p-1 rounded transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Invoice header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
                  {selectedInvoice.invoiceNumber}
                </span>
                <StatusBadge status={selectedInvoice.status} styles={styles} />
              </div>
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {t('buyer.invoices.order') || 'Order'}: {selectedInvoice.orderNumber}
              </p>
            </div>

            {/* Amount */}
            <div className="rounded-lg p-4" style={{ backgroundColor: styles.bgSecondary }}>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: styles.textMuted }}>{t('buyer.invoices.subtotal') || 'Subtotal'}</span>
                <span style={{ color: styles.textPrimary }}>
                  {formatInvoiceAmount(selectedInvoice.subtotal, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: styles.textMuted }}>VAT ({selectedInvoice.vatRate}%)</span>
                <span style={{ color: styles.textPrimary }}>
                  {formatInvoiceAmount(selectedInvoice.vatAmount, selectedInvoice.currency)}
                </span>
              </div>
              <div
                className="flex justify-between font-semibold text-lg border-t pt-2 mt-2"
                style={{ borderColor: styles.border, color: styles.textPrimary }}
              >
                <span>{t('buyer.invoices.total') || 'Total'}</span>
                <span>{formatInvoiceAmount(selectedInvoice.totalAmount, selectedInvoice.currency)}</span>
              </div>
              {selectedInvoice.paidAmount !== undefined && selectedInvoice.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm mt-2" style={{ color: styles.success }}>
                    <span>{t('buyer.invoices.paid') || 'Paid'}</span>
                    <span>-{formatInvoiceAmount(selectedInvoice.paidAmount, selectedInvoice.currency)}</span>
                  </div>
                  {(selectedInvoice.balanceDue ?? selectedInvoice.totalAmount - selectedInvoice.paidAmount) > 0 && (
                    <div className="flex justify-between text-sm font-semibold mt-1" style={{ color: styles.warning }}>
                      <span>Balance Due</span>
                      <span>
                        {formatInvoiceAmount(
                          selectedInvoice.balanceDue ?? selectedInvoice.totalAmount - selectedInvoice.paidAmount,
                          selectedInvoice.currency,
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Seller info */}
            <div>
              <h3 className="text-sm font-medium mb-2" style={{ color: styles.textMuted }}>
                {t('buyer.invoices.seller') || 'Seller'}
              </h3>
              <p style={{ color: styles.textPrimary }}>{selectedInvoice.sellerName}</p>
              {selectedInvoice.sellerCompany && (
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  {selectedInvoice.sellerCompany}
                </p>
              )}
            </div>

            {/* Due date */}
            {selectedInvoice.dueDate && (
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: styles.textMuted }}>
                  {t('buyer.invoices.dueDate') || 'Due Date'}
                </h3>
                <p style={{ color: styles.textPrimary }}>{formatDate(selectedInvoice.dueDate)}</p>
                {selectedInvoice.status === 'issued' && (
                  <p
                    className="text-xs mt-1"
                    style={{
                      color:
                        getDaysUntilDue(selectedInvoice.dueDate) < 0
                          ? styles.error
                          : getDaysUntilDue(selectedInvoice.dueDate) <= 7
                            ? '#F59E0B'
                            : styles.textMuted,
                    }}
                  >
                    {getDaysUntilDue(selectedInvoice.dueDate) < 0
                      ? `${Math.abs(getDaysUntilDue(selectedInvoice.dueDate))} days overdue`
                      : `${getDaysUntilDue(selectedInvoice.dueDate)} days remaining`}
                  </p>
                )}
              </div>
            )}

            {/* Payment history */}
            {selectedPayments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: styles.textMuted }}>
                  {t('buyer.invoices.paymentHistory') || 'Payment History'}
                </h3>
                <div className="space-y-2">
                  {selectedPayments.map((payment) => {
                    const statusConfig = getPaymentStatusConfig(payment.status);
                    return (
                      <div key={payment.id} className="rounded-lg p-3" style={{ backgroundColor: styles.bgSecondary }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium" style={{ color: styles.textPrimary }}>
                            {payment.paymentNumber}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor:
                                payment.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                              color: payment.status === 'confirmed' ? styles.success : '#F59E0B',
                            }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="text-sm" style={{ color: styles.textMuted }}>
                          {formatInvoiceAmount(payment.amount, payment.currency)}
                        </div>
                        {payment.bankReference && (
                          <div className="text-xs mt-1" style={{ color: styles.textMuted }}>
                            Ref: {payment.bankReference}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pay now action for unpaid invoices */}
            {(selectedInvoice.status === 'issued' || selectedInvoice.status === 'overdue') && (
              <div className="space-y-3">
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: selectedInvoice.status === 'overdue' ? 'rgba(239,68,68,0.05)' : `${styles.info}08`,
                    border: `1px solid ${selectedInvoice.status === 'overdue' ? 'rgba(239,68,68,0.2)' : `${styles.info}30`}`,
                  }}
                >
                  <CurrencyDollar
                    size={24}
                    className="mx-auto mb-2"
                    style={{ color: selectedInvoice.status === 'overdue' ? styles.error : styles.info }}
                  />
                  <p className="text-sm font-medium mb-1" style={{ color: styles.textPrimary }}>
                    {selectedInvoice.status === 'overdue'
                      ? t('buyer.invoices.paymentOverdue') || 'Payment Overdue'
                      : t('buyer.invoices.paymentDue') || 'Payment Due'}
                  </p>
                  <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                    {formatInvoiceAmount(
                      selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0),
                      selectedInvoice.currency,
                    )}
                  </p>
                </div>

                {/* Record Payment Form */}
                {!showPaymentForm ? (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: styles.info }}
                  >
                    <CurrencyDollar size={18} weight="bold" />
                    {t('buyer.invoices.recordPayment') || 'Record Payment'}
                  </button>
                ) : (
                  <div
                    className="rounded-lg border p-4 space-y-3"
                    style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
                  >
                    <h4 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                      {t('buyer.invoices.recordPayment') || 'Record Payment'}
                    </h4>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: styles.textMuted }}>
                        {t('buyer.invoices.bankReference') || 'Bank Transfer Reference'} *
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{
                          backgroundColor: styles.bgPrimary,
                          borderColor: styles.border,
                          color: styles.textPrimary,
                        }}
                        placeholder="e.g. TRF-20260208-001"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: styles.textMuted }}>
                        {t('buyer.invoices.bankName') || 'Bank Name'}
                      </label>
                      <input
                        type="text"
                        value={paymentBank}
                        onChange={(e) => setPaymentBank(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{
                          backgroundColor: styles.bgPrimary,
                          borderColor: styles.border,
                          color: styles.textPrimary,
                        }}
                        placeholder="e.g. Al Rajhi Bank"
                      />
                    </div>

                    {paymentError && (
                      <p className="text-xs" style={{ color: styles.error }}>
                        {paymentError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowPaymentForm(false);
                          setPaymentRef('');
                          setPaymentBank('');
                          setPaymentError(null);
                        }}
                        className="flex-1 py-2 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: styles.bgPrimary, color: styles.textSecondary }}
                      >
                        {t('common.cancel') || 'Cancel'}
                      </button>
                      <button
                        onClick={handleRecordPayment}
                        disabled={isRecordingPayment || !paymentRef.trim()}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: styles.success }}
                      >
                        {isRecordingPayment
                          ? t('common.processing') || 'Submitting...'
                          : t('buyer.invoices.submitPayment') || 'Submit'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Line items */}
            <div>
              <h3 className="text-sm font-medium mb-2" style={{ color: styles.textMuted }}>
                {t('buyer.invoices.items') || 'Items'}
              </h3>
              <div className="space-y-2">
                {selectedInvoice.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <span style={{ color: styles.textPrimary }}>{item.name}</span>
                      <span className="ml-2" style={{ color: styles.textMuted }}>
                        x{item.quantity}
                      </span>
                    </div>
                    <span style={{ color: styles.textPrimary }}>
                      {formatInvoiceAmount(item.total, selectedInvoice.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Risk Assessment */}
            <div>
              {invoiceAI.data || invoiceAI.isLoading || invoiceAI.error ? (
                <AIResultCard
                  summary={invoiceAI.data?.summary || ''}
                  insights={invoiceAI.data?.insights || []}
                  risks={invoiceAI.data?.risks || []}
                  recommendedActions={invoiceAI.data?.recommendedActions || []}
                  confidence={invoiceAI.data?.confidence || 0}
                  isLoading={invoiceAI.isLoading}
                  error={invoiceAI.error}
                  onRetry={() => invoiceAI.fetchRisk(selectedInvoice.id)}
                  compact
                />
              ) : (
                <button
                  onClick={() => invoiceAI.fetchRisk(selectedInvoice.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>&#10024;</span>
                  Analyze Risk with AI
                </button>
              )}
            </div>

            {/* Download PDF */}
            <button
              onClick={() => handleDownloadPdf(selectedInvoice)}
              disabled={downloadingPdf === selectedInvoice.id}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors"
              style={{
                borderColor: styles.border,
                color: styles.textPrimary,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {downloadingPdf === selectedInvoice.id ? (
                <Spinner size={16} className="animate-spin" />
              ) : (
                <FilePdf size={16} weight="bold" />
              )}
              {t('buyer.invoices.downloadPdf') || 'Download PDF'}
            </button>

            {/* Timestamps */}
            <div className="text-xs space-y-1" style={{ color: styles.textMuted }}>
              <p>
                {t('buyer.invoices.created') || 'Created'}: {formatDate(selectedInvoice.createdAt)}
              </p>
              {selectedInvoice.issuedAt && (
                <p>
                  {t('buyer.invoices.issued') || 'Issued'}: {formatDate(selectedInvoice.issuedAt)}
                </p>
              )}
              {selectedInvoice.paidAt && (
                <p>
                  {t('buyer.invoices.paidOn') || 'Paid'}: {formatDate(selectedInvoice.paidAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerInvoices;
