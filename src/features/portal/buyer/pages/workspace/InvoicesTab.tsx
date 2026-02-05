import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../../auth-adapter';
import { marketplaceInvoiceService } from '../../../services/marketplaceInvoiceService';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import {
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Eye,
  Funnel,
  X,
  Receipt,
  Spinner,
  CaretLeft,
  CaretRight,
} from 'phosphor-react';
import { EmptyState, Select } from '../../../components';
import { usePortal } from '../../../context/PortalContext';
import {
  MarketplaceInvoice,
  InvoiceStatus,
  getInvoiceStatusConfig,
  formatInvoiceAmount,
  getDaysUntilDue,
} from '../../../types/invoice.types';

interface InvoicesTabProps {
  onNavigate?: (page: string) => void;
  initialStatusFilter?: InvoiceStatus | 'all';
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

// Status badge component
const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const config = getInvoiceStatusConfig(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
};

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  onNavigate,
  initialStatusFilter = 'all',
}) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRTL = direction === 'rtl';

  // State
  const [invoices, setInvoices] = useState<MarketplaceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [showFilters, setShowFilters] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const invoicesRes = await marketplaceInvoiceService.getBuyerInvoices(token, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      });

      setInvoices(invoicesRes.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Table columns
  const columnHelper = createColumnHelper<MarketplaceInvoice>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('invoiceNumber', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.invoices.invoiceNumber') || 'Invoice'}
          </span>
        ),
        cell: (info) => (
          <div>
            <div className="font-medium" style={{ color: styles.textPrimary }}>{info.getValue()}</div>
            <div className="text-xs" style={{ color: styles.textMuted }}>{info.row.original.orderNumber}</div>
          </div>
        ),
      }),
      columnHelper.accessor('sellerName', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.invoices.seller') || 'Seller'}
          </span>
        ),
        cell: (info) => (
          <div>
            <div style={{ color: styles.textPrimary }}>{info.getValue()}</div>
            {info.row.original.sellerCompany && (
              <div className="text-xs" style={{ color: styles.textMuted }}>{info.row.original.sellerCompany}</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('totalAmount', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.invoices.amount') || 'Amount'}
          </span>
        ),
        cell: (info) => (
          <div className="font-medium" style={{ color: styles.textPrimary }}>
            {formatInvoiceAmount(info.getValue(), info.row.original.currency)}
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.invoices.status') || 'Status'}
          </span>
        ),
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('dueDate', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.invoices.dueDate') || 'Due Date'}
          </span>
        ),
        cell: (info) => {
          const dueDate = info.getValue();
          if (!dueDate) return <span style={{ color: styles.textMuted }}>-</span>;
          const daysUntil = getDaysUntilDue(dueDate);
          const isOverdue = daysUntil < 0;
          const isUrgent = daysUntil >= 0 && daysUntil <= 7;
          return (
            <div>
              <div style={{ color: isOverdue ? styles.error : isUrgent ? '#f59e0b' : styles.textPrimary }}>
                {formatDate(dueDate)}
              </div>
              {info.row.original.status === 'issued' && (
                <div className="text-xs" style={{ color: isOverdue ? styles.error : isUrgent ? '#f59e0b' : styles.textMuted }}>
                  {isOverdue ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.invoices.received') || 'Received'}
          </span>
        ),
        cell: (info) => <span style={{ color: styles.textMuted }}>{formatRelativeTime(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="w-full text-center block">{t('common.actions')}</span>,
        cell: () => (
          <div className="flex items-center justify-center gap-2">
            <button
              className="p-1.5 rounded-md transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Eye size={18} />
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, styles, t, isRTL]
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || searchQuery;

  return (
    <div dir={direction}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Search */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
            <input
              type="text"
              placeholder={t('common.search') || 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm w-48"
              style={{ color: styles.textPrimary }}
              dir={direction}
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{
              borderColor: showFilters ? styles.borderHover : styles.border,
              backgroundColor: styles.bgCard,
              color: styles.textSecondary,
            }}
          >
            <Funnel size={16} />
            <span className="text-sm">{t('common.filters')}</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors"
              style={{ color: styles.textMuted }}
            >
              <X size={14} />
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className={`flex items-center gap-4 mb-4 p-4 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as InvoiceStatus | 'all')}
            options={[
              { value: 'all', label: t('buyer.invoices.allStatus') || 'All Status' },
              { value: 'draft', label: t('buyer.invoices.draft') || 'Draft' },
              { value: 'issued', label: t('buyer.invoices.issued') || 'Issued' },
              { value: 'paid', label: t('buyer.invoices.paid') || 'Paid' },
              { value: 'overdue', label: t('buyer.invoices.overdue') || 'Overdue' },
              { value: 'cancelled', label: t('buyer.invoices.cancelled') || 'Cancelled' },
            ]}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-4 p-4 rounded-lg border"
          style={{ backgroundColor: `${styles.error}10`, borderColor: styles.error }}
        >
          <span style={{ color: styles.error }}>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} className="animate-spin" style={{ color: styles.textMuted }} />
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t('buyer.invoices.noInvoices') || 'No invoices yet'}
              description={t('buyer.invoices.noInvoicesDesc') || "You'll see invoices here once your orders are delivered."}
            />
          ) : (
            <div>
              <div
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <table className="w-full">
                  <thead style={{ backgroundColor: styles.bgSecondary }}>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                            style={{ color: styles.textMuted }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() && (
                                header.column.getIsSorted() === 'asc' ? (
                                  <CaretUp size={14} />
                                ) : (
                                  <CaretDown size={14} />
                                )
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t transition-colors cursor-pointer"
                        style={{ borderColor: styles.border }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {table.getPageCount() > 1 && (
                <div
                  className={`flex items-center justify-between px-4 py-3 mt-4 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}
                  style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
                >
                  <span className="text-sm" style={{ color: styles.textMuted }}>
                    {t('common.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                    -{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredInvoices.length)}
                    {' '}{t('common.of')} {filteredInvoices.length}
                  </span>

                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="p-2 rounded-md border transition-colors disabled:opacity-50"
                      style={{ borderColor: styles.border }}
                    >
                      {isRTL ? <CaretRight size={16} /> : <CaretLeft size={16} />}
                    </button>
                    <span className="text-sm px-2" style={{ color: styles.textSecondary }}>
                      {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                    </span>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="p-2 rounded-md border transition-colors disabled:opacity-50"
                      style={{ borderColor: styles.border }}
                    >
                      {isRTL ? <CaretLeft size={16} /> : <CaretRight size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoicesTab;
