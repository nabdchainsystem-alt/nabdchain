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
  Cube,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  ArrowClockwise,
  Check,
  X,
  Warning,
  Funnel,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { inventoryService, InventoryItem } from '../../services/inventoryService';
import { EmptyState, Button } from '../../components';
import { Select } from '../../components/ui';

// =============================================================================
// Types
// =============================================================================

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

// =============================================================================
// Helper Functions
// =============================================================================

const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

// =============================================================================
// Status Badge Component
// =============================================================================

const StatusBadge: React.FC<{ status: StockStatus }> = ({ status }) => {
  const { styles, t } = usePortal();

  const config: Record<string, { label: string; bg: string; text: string }> = {
    in_stock: {
      label: t('seller.inventory.inStock'),
      bg: styles.isDark ? '#14532d' : '#dcfce7',
      text: styles.isDark ? '#bbf7d0' : '#166534',
    },
    low_stock: {
      label: t('seller.inventory.lowStock'),
      bg: styles.isDark ? '#78350f' : '#fef3c7',
      text: styles.isDark ? '#fef3c7' : '#92400e',
    },
    out_of_stock: {
      label: t('seller.inventory.outOfStock'),
      bg: styles.isDark ? '#7f1d1d' : '#fee2e2',
      text: styles.isDark ? '#fecaca' : '#991b1b',
    },
  };

  const { label, bg, text } = config[status] || config.in_stock;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {status === 'low_stock' && <Warning size={12} className="mr-1" />}
      {label}
    </span>
  );
};

// =============================================================================
// Inline Stock Editor
// =============================================================================

interface StockEditorProps {
  value: number;
  onSave: (newValue: number) => void;
  onCancel: () => void;
  saving: boolean;
}

const StockEditor: React.FC<StockEditorProps> = ({ value, onSave, onCancel, saving }) => {
  const { styles, t } = usePortal();
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue >= 0) {
      onSave(editValue);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        value={editValue}
        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
        className="w-20 h-7 px-2 text-sm rounded border outline-none"
        style={{
          backgroundColor: styles.bgPrimary,
          borderColor: styles.border,
          color: styles.textPrimary,
        }}
        disabled={saving}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="p-1 rounded transition-colors"
        style={{ color: styles.success }}
        title={t('seller.inventory.save')}
      >
        <Check size={16} weight="bold" />
      </button>
      <button
        onClick={onCancel}
        disabled={saving}
        className="p-1 rounded transition-colors"
        style={{ color: styles.textMuted }}
        title={t('seller.inventory.cancel')}
      >
        <X size={16} />
      </button>
    </div>
  );
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
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 rounded" style={{ backgroundColor: styles.border, width: '70%' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: styles.bgCard }}>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr key={rowIndex} style={{ borderTop: `1px solid ${styles.border}` }}>
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div
                      className="h-4 rounded"
                      style={{ backgroundColor: styles.bgSecondary, width: colIndex === 1 ? '80%' : '60%' }}
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
// Summary Cards
// =============================================================================

interface SummaryCardsProps {
  inventory: InventoryItem[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ inventory }) => {
  const { styles, t } = usePortal();

  const stats = useMemo(() => {
    const inStock = inventory.filter((i) => i.status === 'in_stock').length;
    const lowStock = inventory.filter((i) => i.status === 'low_stock').length;
    const outOfStock = inventory.filter((i) => i.status === 'out_of_stock').length;
    const totalValue = inventory.reduce((sum, i) => sum + i.stockQty * i.price, 0);

    return { total: inventory.length, inStock, lowStock, outOfStock, totalValue };
  }, [inventory]);

  const cards = [
    { label: t('seller.inventory.totalItems'), value: stats.total, color: styles.textPrimary },
    { label: t('seller.inventory.inStock'), value: stats.inStock, color: '#22c55e' },
    { label: t('seller.inventory.lowStock'), value: stats.lowStock, color: '#f59e0b' },
    { label: t('seller.inventory.outOfStock'), value: stats.outOfStock, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-4 rounded-lg border"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <p className="text-xs mb-1" style={{ color: styles.textMuted }}>
            {card.label}
          </p>
          <p className="text-xl font-semibold" style={{ color: card.color }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const SellerInventory: React.FC = () => {
  const { styles, t } = usePortal();
  const { getToken } = useAuth();

  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const data = await inventoryService.getSellerInventory(token, {
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? (statusFilter as StockStatus) : undefined,
      });
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [getToken, searchQuery, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchInventory();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchInventory]);

  // Handle stock update
  const handleStockUpdate = useCallback(async (productId: string, newStock: number) => {
    setSaving(true);
    const previousInventory = [...inventory];

    // Optimistic update
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const availableQty = Math.max(0, newStock - item.reservedQty);
          let status: StockStatus = 'in_stock';
          if (availableQty <= 0) status = 'out_of_stock';
          else if (availableQty <= 10) status = 'low_stock';
          return { ...item, stockQty: newStock, availableQty, status };
        }
        return item;
      })
    );

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      await inventoryService.updateStock(token, productId, { stockQty: newStock });
      setEditingId(null);
    } catch (err) {
      // Rollback
      setInventory(previousInventory);
      console.error('Failed to update stock:', err);
    } finally {
      setSaving(false);
    }
  }, [inventory, getToken]);

  // Status options
  const statusOptions = useMemo(() => [
    { value: 'all', label: t('seller.inventory.allStatus') },
    { value: 'in_stock', label: t('seller.inventory.inStock') },
    { value: 'low_stock', label: t('seller.inventory.lowStock') },
    { value: 'out_of_stock', label: t('seller.inventory.outOfStock') },
  ], [t]);

  // Column helper
  const columnHelper = createColumnHelper<InventoryItem>();

  // Columns
  const columns = useMemo(() => [
    columnHelper.accessor('sku', {
      header: t('seller.inventory.sku'),
      cell: (info) => (
        <span className="font-mono text-xs" style={{ color: styles.textMuted }}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('name', {
      header: t('seller.inventory.product'),
      cell: (info) => (
        <div>
          <div className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </div>
          <div className="text-xs" style={{ color: styles.textMuted }}>
            {info.row.original.category}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('stockQty', {
      header: t('seller.inventory.stockQty'),
      cell: (info) => {
        const item = info.row.original;
        const isEditing = editingId === item.id;

        if (isEditing) {
          return (
            <StockEditor
              value={item.stockQty}
              onSave={(newValue) => handleStockUpdate(item.id, newValue)}
              onCancel={() => setEditingId(null)}
              saving={saving}
            />
          );
        }

        return (
          <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        );
      },
    }),
    columnHelper.accessor('reservedQty', {
      header: t('seller.inventory.reservedQty'),
      cell: (info) => (
        <span className="text-sm" style={{ color: styles.textMuted }}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('availableQty', {
      header: t('seller.inventory.availableQty'),
      cell: (info) => {
        const value = info.getValue();
        const color = value <= 0 ? '#ef4444' : value <= 10 ? '#f59e0b' : styles.textPrimary;
        return (
          <span className="text-sm font-medium" style={{ color }}>
            {value}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: t('seller.inventory.status'),
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: t('seller.inventory.actions'),
      cell: (info) => {
        const item = info.row.original;
        const isEditing = editingId === item.id;

        if (isEditing) return null;

        return (
          <button
            onClick={() => setEditingId(item.id)}
            className="px-2 py-1 text-xs rounded border transition-colors"
            style={{
              borderColor: styles.border,
              color: styles.textSecondary,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {t('seller.inventory.adjustStock')}
          </button>
        );
      },
    }),
  ], [columnHelper, styles, t, editingId, handleStockUpdate, saving]);

  // Table instance
  const table = useReactTable({
    data: inventory,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  // Error state
  if (error && !loading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Cube}
          title={t('seller.dashboard.error')}
          description={error}
          action={
            <Button onClick={fetchInventory} variant="secondary">
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
      {/* Summary Cards */}
      {!loading && inventory.length > 0 && <SummaryCards inventory={inventory} />}

      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 mb-6 rounded-lg border"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        <Funnel size={18} style={{ color: styles.textMuted }} />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: styles.textMuted }}
          />
          <input
            type="text"
            placeholder={t('seller.inventory.search')}
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

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 h-9 px-3 text-xs font-medium rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.bgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={14} />
            {t('seller.sales.clearFilters')}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && <TableSkeleton />}

      {/* Empty state */}
      {!loading && inventory.length === 0 && !hasActiveFilters && (
        <div className="py-12">
          <EmptyState
            icon={Cube}
            title={t('seller.inventory.noItems')}
            description={t('seller.inventory.noItemsDesc')}
          />
        </div>
      )}

      {/* No results */}
      {!loading && inventory.length === 0 && hasActiveFilters && (
        <div className="py-12">
          <EmptyState
            icon={Cube}
            title={t('seller.inventory.noResults')}
            action={
              <Button onClick={clearFilters} variant="secondary">
                {t('seller.sales.clearFilters')}
              </Button>
            }
          />
        </div>
      )}

      {/* Table */}
      {!loading && inventory.length > 0 && (
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: styles.border }}
        >
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
                {table.getRowModel().rows.map((row, rowIndex) => {
                  const item = row.original as InventoryItem;
                  const isLowStock = item.status === 'low_stock' || item.status === 'out_of_stock';

                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderTop: rowIndex > 0 ? `1px solid ${styles.border}` : undefined,
                        backgroundColor: isLowStock
                          ? styles.isDark
                            ? 'rgba(239, 68, 68, 0.05)'
                            : 'rgba(239, 68, 68, 0.02)'
                          : undefined,
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
        </div>
      )}
    </div>
  );
};

export default SellerInventory;
