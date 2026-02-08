// =============================================================================
// Order Filters - Single-row filter bar (Radix UI Select + DropdownMenu)
// =============================================================================

import React from 'react';
import { MagnifyingGlass, X, CheckSquare, CheckCircle } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Select, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui';
import type { OrderRole, OrderStatus, PaymentStatus, SortOption } from './orders.types';

interface OrderFiltersProps {
  role: OrderRole;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: OrderStatus | '';
  onStatusChange: (s: OrderStatus | '') => void;
  paymentFilter: PaymentStatus | '';
  onPaymentChange: (p: PaymentStatus | '') => void;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  // Bulk (seller only)
  selectedCount?: number;
  onBulkConfirm?: () => void;
}

// Radix Select doesn't support empty string values, so we use 'all' as sentinel
const ALL = 'all';

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  role,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentChange,
  sortOption,
  onSortChange,
  hasActiveFilters,
  onClearAll,
  selectedCount = 0,
  onBulkConfirm,
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const statusOptions = [
    { value: ALL, label: t('seller.orders.allStatus') || 'All Status' },
    { value: 'pending_confirmation', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const paymentOptions = [
    { value: ALL, label: 'All Payment' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'authorized', label: 'Authorized' },
    { value: 'paid', label: 'Paid' },
  ];

  const sortOptions =
    role === 'seller'
      ? [
          { value: 'newest', label: 'Newest' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'sla_urgent', label: 'SLA Urgent' },
          { value: 'total_high', label: 'Total: High' },
          { value: 'total_low', label: 'Total: Low' },
        ]
      : [
          { value: 'newest', label: 'Newest' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'delivery_soon', label: 'Delivery Soon' },
          { value: 'total_high', label: 'Total: High' },
          { value: 'total_low', label: 'Total: Low' },
        ];

  return (
    <div
      className="rounded-xl border px-4 py-3 mb-4"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <div className={`flex items-center gap-3 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
        {/* Search */}
        <div
          className={`flex items-center gap-2 px-3 h-9 rounded-lg border flex-1 min-w-[180px] max-w-[280px] ${
            isRtl ? 'flex-row-reverse' : ''
          }`}
          style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
        >
          <MagnifyingGlass size={15} style={{ color: styles.textMuted }} />
          <input
            type="text"
            placeholder={t('seller.orders.searchPlaceholder') || 'Search orders...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="outline-none text-sm bg-transparent flex-1 min-w-0"
            style={{ color: styles.textPrimary }}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} style={{ color: styles.textMuted }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status */}
        <Select
          value={statusFilter || ALL}
          onChange={(v) => onStatusChange(v === ALL ? '' : (v as OrderStatus))}
          options={statusOptions}
          placeholder={t('seller.orders.allStatus') || 'All Status'}
        />

        {/* Payment (seller only) */}
        {role === 'seller' && (
          <Select
            value={paymentFilter || ALL}
            onChange={(v) => onPaymentChange(v === ALL ? '' : (v as PaymentStatus))}
            options={paymentOptions}
            placeholder="All Payment"
          />
        )}

        {/* Sort */}
        <Select
          value={sortOption}
          onChange={(v) => onSortChange(v as SortOption)}
          options={sortOptions}
          placeholder="Sort by"
        />

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium rounded-lg transition-colors"
            style={{ color: styles.error }}
          >
            <X size={12} /> Clear
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bulk actions (seller only) - Radix DropdownMenu */}
        {role === 'seller' && selectedCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border outline-none"
                style={{ borderColor: styles.border, color: styles.textPrimary }}
              >
                <CheckSquare size={13} />
                {selectedCount} selected
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? 'start' : 'end'}>
              <DropdownMenuItem onClick={() => onBulkConfirm?.()}>
                <CheckCircle size={14} />
                Confirm Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
