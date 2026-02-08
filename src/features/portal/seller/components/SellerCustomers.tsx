import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Users,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  X,
  ArrowClockwise,
  Envelope,
  Buildings,
  ShoppingCart,
  Calendar,
  CurrencyDollar,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { customerService, Customer, CustomerDetails } from '../../services/customerService';
import { EmptyState, Button } from '../../components';

// =============================================================================
// Types
// =============================================================================

interface SellerCustomersProps {
  onViewOrder?: (orderId: string) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

// =============================================================================
// Table Skeleton
// =============================================================================

const TableSkeleton: React.FC = () => {
  const { styles } = usePortal();

  return (
    <div className="animate-pulse">
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: styles.border }}>
        <table className="min-w-full">
          <thead style={{ backgroundColor: styles.bgSecondary }}>
            <tr>
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 rounded" style={{ backgroundColor: styles.border, width: '70%' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: styles.bgCard }}>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr key={rowIndex} style={{ borderTop: `1px solid ${styles.border}` }}>
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div
                      className="h-4 rounded"
                      style={{ backgroundColor: styles.bgSecondary, width: colIndex === 0 ? '80%' : '60%' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =============================================================================
// Customer Details Drawer
// =============================================================================

interface CustomerDrawerProps {
  customer: CustomerDetails | null;
  loading: boolean;
  onClose: () => void;
}

const CustomerDrawer: React.FC<CustomerDrawerProps> = ({ customer, loading, onClose }) => {
  const { styles, t } = usePortal();

  if (!customer && !loading) return null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      delivered: { bg: '#dcfce7', text: '#166534' },
      shipped: { bg: '#dbeafe', text: '#1e40af' },
      in_progress: { bg: '#fef3c7', text: '#92400e' },
      confirmed: { bg: '#e0e7ff', text: '#3730a3' },
      pending_confirmation: { bg: '#f3f4f6', text: '#374151' },
      cancelled: { bg: '#fee2e2', text: '#991b1b' },
    };
    return colors[status] || colors.pending_confirmation;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md z-50 shadow-xl overflow-hidden flex flex-col"
        style={{ backgroundColor: styles.bgPrimary }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: styles.border }}>
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}>
            {t('seller.customers.details')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 rounded w-2/3" style={{ backgroundColor: styles.bgSecondary }} />
              <div className="h-4 rounded w-1/2" style={{ backgroundColor: styles.bgSecondary }} />
              <div className="h-4 rounded w-3/4" style={{ backgroundColor: styles.bgSecondary }} />
            </div>
          ) : customer ? (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3
                  className="text-xl font-semibold mb-1"
                  style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                >
                  {customer.name}
                </h3>
                {customer.company && (
                  <div className="flex items-center gap-2 text-sm mb-2" style={{ color: styles.textSecondary }}>
                    <Buildings size={14} />
                    {customer.company}
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: styles.textMuted }}>
                    <Envelope size={14} />
                    {customer.email}
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-lg border"
                  style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart size={14} style={{ color: styles.textMuted }} />
                    <span className="text-xs" style={{ color: styles.textMuted }}>
                      {t('seller.customers.totalOrders')}
                    </span>
                  </div>
                  <p className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                    {customer.totalOrders}
                  </p>
                </div>
                <div
                  className="p-4 rounded-lg border"
                  style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CurrencyDollar size={14} style={{ color: styles.textMuted }} />
                    <span className="text-xs" style={{ color: styles.textMuted }}>
                      {t('seller.customers.totalSpend')}
                    </span>
                  </div>
                  <p className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                    {formatCurrency(customer.totalSpend, customer.currency)}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} style={{ color: styles.textMuted }} />
                  <span className="text-xs" style={{ color: styles.textMuted }}>
                    {t('seller.customers.customerSince')}
                  </span>
                </div>
                <p className="text-sm" style={{ color: styles.textPrimary }}>
                  {formatDate(customer.firstOrderDate)}
                </p>
              </div>

              {/* Order History */}
              <div>
                <h4
                  className="text-sm font-semibold mb-3"
                  style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                >
                  {t('seller.customers.orderHistory')}
                </h4>
                <div className="space-y-2">
                  {customer.orders.length === 0 ? (
                    <p className="text-sm" style={{ color: styles.textMuted }}>
                      No orders found
                    </p>
                  ) : (
                    customer.orders.map((order) => {
                      const statusColors = getStatusColor(order.status);
                      return (
                        <div
                          key={order.id}
                          className="p-3 rounded-lg border"
                          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono" style={{ color: styles.textMuted }}>
                              {order.orderNumber}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm mb-1" style={{ color: styles.textPrimary }}>
                            {order.itemName}
                          </p>
                          <div
                            className="flex items-center justify-between text-xs"
                            style={{ color: styles.textMuted }}
                          >
                            <span>Qty: {order.quantity}</span>
                            <span className="font-medium" style={{ color: styles.textPrimary }}>
                              SAR {order.totalPrice.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const SellerCustomers: React.FC<SellerCustomersProps> = ({ _onViewOrder }) => {
  const { styles, t } = usePortal();
  const { getToken } = useAuth();

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'lastOrderDate', desc: true }]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const data = await customerService.getSellerCustomers(token, {
        search: searchQuery || undefined,
      });
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [getToken, searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchCustomers]);

  // Fetch customer details
  const fetchCustomerDetails = useCallback(
    async (customerId: string) => {
      try {
        setDrawerLoading(true);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const details = await customerService.getCustomerDetails(token, customerId);
        setCustomerDetails(details);
      } catch (err) {
        console.error('Failed to load customer details:', err);
      } finally {
        setDrawerLoading(false);
      }
    },
    [getToken],
  );

  // Handle row click
  const handleRowClick = useCallback(
    (customer: Customer) => {
      setSelectedCustomerId(customer.id);
      setCustomerDetails(null);
      fetchCustomerDetails(customer.id);
    },
    [fetchCustomerDetails],
  );

  // Close drawer
  const handleCloseDrawer = useCallback(() => {
    setSelectedCustomerId(null);
    setCustomerDetails(null);
  }, []);

  // Column helper
  const columnHelper = createColumnHelper<Customer>();

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: t('seller.customers.name'),
        cell: (info) => (
          <div>
            <div className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {info.getValue()}
            </div>
            {info.row.original.company && (
              <div className="text-xs" style={{ color: styles.textMuted }}>
                {info.row.original.company}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('email', {
        header: t('seller.customers.email'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textSecondary }}>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('totalOrders', {
        header: t('seller.customers.totalOrders'),
        cell: (info) => (
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('totalSpend', {
        header: t('seller.customers.totalSpend'),
        cell: (info) => (
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {formatCurrency(info.getValue(), info.row.original.currency)}
          </span>
        ),
      }),
      columnHelper.accessor('lastOrderDate', {
        header: t('seller.customers.lastOrder'),
        cell: (info) => (
          <span className="text-sm" style={{ color: styles.textMuted }}>
            {formatRelativeDate(info.getValue())}
          </span>
        ),
      }),
    ],
    [columnHelper, styles, t],
  );

  // Table instance
  const table = useReactTable({
    data: customers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Error state
  if (error && !loading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Users}
          title={t('seller.dashboard.error')}
          description={error}
          action={
            <Button onClick={fetchCustomers} variant="secondary">
              <ArrowClockwise size={16} className="mr-2" />
              {t('seller.dashboard.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div
        className="flex items-center gap-3 p-4 mb-6 rounded-lg border"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: styles.textMuted }}
          />
          <input
            type="text"
            placeholder={t('seller.customers.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border outline-none transition-colors"
            style={{
              backgroundColor: styles.bgPrimary,
              borderColor: styles.border,
              color: styles.textPrimary,
            }}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && <TableSkeleton />}

      {/* Empty state */}
      {!loading && customers.length === 0 && !searchQuery && (
        <div className="py-12">
          <EmptyState
            icon={Users}
            title={t('seller.customers.noCustomers')}
            description={t('seller.customers.noCustomersDesc')}
          />
        </div>
      )}

      {/* No results */}
      {!loading && customers.length === 0 && searchQuery && (
        <div className="py-12">
          <EmptyState
            icon={Users}
            title={t('seller.customers.noResults')}
            action={
              <Button onClick={() => setSearchQuery('')} variant="secondary">
                {t('seller.sales.clearFilters')}
              </Button>
            }
          />
        </div>
      )}

      {/* Table */}
      {!loading && customers.length > 0 && (
        <div className="overflow-hidden rounded-lg border" style={{ borderColor: styles.border }}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ backgroundColor: styles.bgSecondary }}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none"
                        style={{ color: styles.textMuted }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && <CaretUp size={12} />}
                          {header.column.getIsSorted() === 'desc' && <CaretDown size={12} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody style={{ backgroundColor: styles.bgCard }}>
                {table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderTop: rowIndex > 0 ? `1px solid ${styles.border}` : undefined,
                    }}
                    onClick={() => handleRowClick(row.original)}
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
        </div>
      )}

      {/* Customer Details Drawer */}
      {selectedCustomerId && (
        <CustomerDrawer customer={customerDetails} loading={drawerLoading} onClose={handleCloseDrawer} />
      )}
    </div>
  );
};

export default SellerCustomers;
