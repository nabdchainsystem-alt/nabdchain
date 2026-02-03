import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
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
  CurrencyDollar,
  Warning,
  Clock,
  Receipt,
  Spinner,
  CreditCard,
  Bank,
} from 'phosphor-react';
import { Button, EmptyState } from '../../components';
import {
  MarketplaceInvoice,
  MarketplacePayment,
  InvoiceStatus,
  InvoiceStats,
  PaymentMethod,
  getInvoiceStatusConfig,
  getPaymentStatusConfig,
  getPaymentMethodLabel,
  formatInvoiceAmount,
  getDaysUntilDue,
} from '../../types/invoice.types';

interface BuyerInvoicesProps {
  onNavigate: (page: string) => void;
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

// Stats card component
const StatsCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, icon, color = 'text-gray-600' }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-semibold mt-1 ${color}`}>{value}</p>
      </div>
      <div className="text-gray-400">{icon}</div>
    </div>
  </div>
);

export const BuyerInvoices: React.FC<BuyerInvoicesProps> = ({ onNavigate }) => {
  const { getToken } = useAuth();

  // State
  const [invoices, setInvoices] = useState<MarketplaceInvoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  // Detail panel
  const [selectedInvoice, setSelectedInvoice] = useState<MarketplaceInvoice | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<MarketplacePayment[]>([]);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [bankReference, setBankReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

      const [invoicesRes, statsRes] = await Promise.all([
        marketplaceInvoiceService.getBuyerInvoices(token, {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchQuery || undefined,
        }),
        marketplaceInvoiceService.getBuyerInvoiceStats(token),
      ]);

      setInvoices(invoicesRes.invoices);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load payments when invoice selected
  const loadInvoicePayments = useCallback(async (invoiceId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const payments = await marketplacePaymentService.getInvoicePayments(token, invoiceId);
      setSelectedPayments(payments);
    } catch (err) {
      console.error('Failed to load payments:', err);
    }
  }, [getToken]);

  // Handle view invoice
  const handleViewInvoice = async (invoice: MarketplaceInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailPanel(true);
    await loadInvoicePayments(invoice.id);
  };

  // Handle record payment
  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;

    try {
      setActionLoading(true);
      const token = await getToken();
      if (!token) return;

      await marketplacePaymentService.recordPayment(token, {
        invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        bankReference: bankReference || undefined,
        bankName: bankName || undefined,
      });

      setShowPaymentDialog(false);
      setPaymentAmount('');
      setBankReference('');
      setBankName('');
      await loadData();
      await loadInvoicePayments(selectedInvoice.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Open payment dialog
  const openPaymentDialog = () => {
    if (selectedInvoice) {
      const outstanding = selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0);
      setPaymentAmount(outstanding.toFixed(2));
      setShowPaymentDialog(true);
    }
  };

  // Table columns
  const columnHelper = createColumnHelper<MarketplaceInvoice>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('invoiceNumber', {
        header: 'Invoice',
        cell: (info) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{info.getValue()}</div>
            <div className="text-xs text-gray-500">{info.row.original.orderNumber}</div>
          </div>
        ),
      }),
      columnHelper.accessor('sellerName', {
        header: 'Seller',
        cell: (info) => (
          <div>
            <div className="text-gray-900 dark:text-white">{info.getValue()}</div>
            {info.row.original.sellerCompany && (
              <div className="text-xs text-gray-500">{info.row.original.sellerCompany}</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Amount',
        cell: (info) => (
          <div className="font-medium text-gray-900 dark:text-white">
            {formatInvoiceAmount(info.getValue(), info.row.original.currency)}
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('dueDate', {
        header: 'Due Date',
        cell: (info) => {
          const dueDate = info.getValue();
          if (!dueDate) return <span className="text-gray-400">-</span>;
          const daysUntil = getDaysUntilDue(dueDate);
          const isOverdue = daysUntil < 0;
          const isUrgent = daysUntil >= 0 && daysUntil <= 7;
          return (
            <div>
              <div className={isOverdue ? 'text-red-600' : isUrgent ? 'text-yellow-600' : 'text-gray-900 dark:text-white'}>
                {formatDate(dueDate)}
              </div>
              {info.row.original.status === 'issued' && (
                <div className={`text-xs ${isOverdue ? 'text-red-500' : isUrgent ? 'text-yellow-500' : 'text-gray-500'}`}>
                  {isOverdue ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Received',
        cell: (info) => <span className="text-gray-500">{formatRelativeTime(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewInvoice(info.row.original)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="View details"
            >
              <Eye size={18} />
            </button>
            {(info.row.original.status === 'issued' || info.row.original.status === 'overdue') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInvoice(info.row.original);
                  const outstanding = info.row.original.totalAmount - (info.row.original.paidAmount || 0);
                  setPaymentAmount(outstanding.toFixed(2));
                  setShowPaymentDialog(true);
                }}
                className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                title="Record payment"
              >
                <CreditCard size={18} />
              </button>
            )}
          </div>
        ),
      }),
    ],
    []
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

  // Render
  return (
    <div className="h-full flex">
      {/* Main content */}
      <div className={`flex-1 overflow-auto ${showDetailPanel ? 'mr-96' : ''}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Invoices</h1>
                <p className="text-sm text-gray-500">View and pay your invoices</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatsCard
                label="Total Invoices"
                value={stats.total}
                icon={<Receipt size={24} />}
              />
              <StatsCard
                label="Pending Payment"
                value={stats.issued}
                icon={<Clock size={24} />}
                color="text-yellow-600"
              />
              <StatsCard
                label="Overdue"
                value={stats.overdue}
                icon={<Warning size={24} />}
                color="text-red-600"
              />
              <StatsCard
                label="Outstanding"
                value={formatInvoiceAmount(stats.totalOutstanding, stats.currency)}
                icon={<CurrencyDollar size={24} />}
                color="text-blue-600"
              />
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Funnel size={18} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={32} className="animate-spin text-blue-500" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<Receipt size={48} />}
              title="No invoices yet"
              description="You'll see invoices here once your orders are delivered."
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
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
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                      onClick={() => handleViewInvoice(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm"
                          onClick={(e) => cell.column.id === 'actions' && e.stopPropagation()}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {showDetailPanel && selectedInvoice && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Invoice Details</h2>
            <button
              onClick={() => {
                setShowDetailPanel(false);
                setSelectedInvoice(null);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Invoice header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedInvoice.invoiceNumber}
                </span>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <p className="text-sm text-gray-500">Order: {selectedInvoice.orderNumber}</p>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatInvoiceAmount(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">VAT ({selectedInvoice.vatRate}%)</span>
                <span>{formatInvoiceAmount(selectedInvoice.vatAmount, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <span>Total</span>
                <span>{formatInvoiceAmount(selectedInvoice.totalAmount, selectedInvoice.currency)}</span>
              </div>
              {selectedInvoice.paidAmount !== undefined && selectedInvoice.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600 mt-2">
                    <span>Paid</span>
                    <span>-{formatInvoiceAmount(selectedInvoice.paidAmount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-600 mt-1">
                    <span>Outstanding</span>
                    <span>{formatInvoiceAmount(selectedInvoice.totalAmount - selectedInvoice.paidAmount, selectedInvoice.currency)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Seller */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Seller</h3>
              <p className="text-gray-900 dark:text-white">{selectedInvoice.sellerName}</p>
              {selectedInvoice.sellerCompany && (
                <p className="text-sm text-gray-500">{selectedInvoice.sellerCompany}</p>
              )}
            </div>

            {/* Due date */}
            {selectedInvoice.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                <p className={`${getDaysUntilDue(selectedInvoice.dueDate) < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {formatDate(selectedInvoice.dueDate)}
                </p>
              </div>
            )}

            {/* Payments */}
            {selectedPayments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">My Payments</h3>
                <div className="space-y-2">
                  {selectedPayments.map((payment) => {
                    const statusConfig = getPaymentStatusConfig(payment.status);
                    return (
                      <div key={payment.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{payment.paymentNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatInvoiceAmount(payment.amount, payment.currency)}
                        </div>
                        {payment.bankReference && (
                          <div className="text-xs text-gray-400 mt-1">
                            Ref: {payment.bankReference}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(payment.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pay button */}
            {(selectedInvoice.status === 'issued' || selectedInvoice.status === 'overdue') && (
              <button
                onClick={openPaymentDialog}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Record Payment
              </button>
            )}

            {/* Line items */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Items</h3>
              <div className="space-y-2">
                {selectedInvoice.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-900 dark:text-white">{item.name}</span>
                      <span className="text-gray-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span>{formatInvoiceAmount(item.total, selectedInvoice.currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-400 space-y-1">
              <p>Issued: {selectedInvoice.issuedAt ? formatDate(selectedInvoice.issuedAt) : '-'}</p>
              {selectedInvoice.paidAt && <p>Paid: {formatDate(selectedInvoice.paidAt)}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Payment dialog */}
      {showPaymentDialog && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bank size={24} className="text-green-600" />
              Record Payment
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Invoice: {selectedInvoice.invoiceNumber}
            </p>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount ({selectedInvoice.currency})
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="wallet">Digital Wallet</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>

              {/* Bank details */}
              {paymentMethod === 'bank_transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bank Reference Number
                    </label>
                    <input
                      type="text"
                      value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      placeholder="Transaction reference"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., Al Rajhi Bank"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentAmount('');
                  setBankReference('');
                  setBankName('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || actionLoading}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Spinner size={18} className="animate-spin" />
                ) : (
                  'Submit Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerInvoices;
