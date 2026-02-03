import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CaretLeft,
  CaretRight,
  Eye,
  Plus,
  Star,
  Timer,
  CheckCircle,
  Truck,
  TrendUp,
  TrendDown,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import { useAuth } from '../../../../../auth-adapter';
import { buyerWorkspaceService, Supplier } from '../../../services/buyerWorkspaceService';

interface SuppliersTabProps {
  onNavigate?: (page: string) => void;
  onCreatePO?: (supplierId: string) => void;
}

const columnHelper = createColumnHelper<Supplier>();

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ onCreatePO }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRTL = direction === 'rtl';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await buyerWorkspaceService.getSuppliers(token, {
        search: globalFilter || undefined,
      });
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, globalFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const renderRating = (rating?: number) => {
    if (!rating) return '-';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    return (
      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            weight={i < fullStars ? 'fill' : i === fullStars && hasHalf ? 'duotone' : 'regular'}
            style={{
              color: i < fullStars || (i === fullStars && hasHalf) ? '#f59e0b' : styles.textMuted,
            }}
          />
        ))}
        <span className="text-xs ml-1" style={{ color: styles.textSecondary }}>
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  // Mock performance data for suppliers (in production, this comes from API)
  const getSupplierPerformance = useCallback((supplierId: string) => {
    const seed = supplierId.charCodeAt(0);
    return {
      onTimeDelivery: 85 + (seed % 15),
      avgResponseTime: 2 + (seed % 8),
      trend: seed % 2 === 0 ? 5 : -3,
    };
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.supplierName')}
          </span>
        ),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('country', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.country')}
          </span>
        ),
        cell: (info) => (
          <span style={{ color: styles.textSecondary }}>{info.getValue() || '-'}</span>
        ),
      }),
      columnHelper.accessor('totalOrders', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.totalOrders')}
          </span>
        ),
        cell: (info) => (
          <span style={{ color: styles.textPrimary }}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('totalSpend', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.totalSpend')}
          </span>
        ),
        cell: (info) => (
          <span style={{ color: styles.textPrimary }}>
            SAR {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      // Performance Column - On-Time Delivery
      columnHelper.display({
        id: 'performance',
        header: () => (
          <span className="block text-center">
            {t('buyer.workspace.performance')}
          </span>
        ),
        cell: (info) => {
          const row = info.row.original;
          const perf = getSupplierPerformance(row.id);
          const isGood = perf.onTimeDelivery >= 90;
          const isOk = perf.onTimeDelivery >= 80;

          return (
            <div className="flex flex-col items-center gap-1">
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Truck size={12} style={{ color: styles.textMuted }} />
                <span
                  className="text-xs font-medium"
                  style={{
                    color: isGood ? styles.success : isOk ? '#f59e0b' : styles.error,
                  }}
                >
                  {perf.onTimeDelivery}%
                </span>
              </div>
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Timer size={12} style={{ color: styles.textMuted }} />
                <span className="text-xs" style={{ color: styles.textSecondary }}>
                  {perf.avgResponseTime}h
                </span>
                {perf.trend > 0 ? (
                  <TrendUp size={10} style={{ color: styles.success }} />
                ) : (
                  <TrendDown size={10} style={{ color: styles.error }} />
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('rating', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.rating')}
          </span>
        ),
        cell: (info) => renderRating(info.getValue()),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <span className="w-full text-center block">{t('common.actions')}</span>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                className="p-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                title={t('buyer.workspace.viewDetails')}
              >
                <Eye size={16} style={{ color: styles.textMuted }} />
              </button>
              <button
                onClick={() => onCreatePO?.(row.id)}
                className="px-2 py-1 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: styles.info,
                  color: '#fff',
                }}
              >
                {t('buyer.workspace.createPO')}
              </button>
            </div>
          );
        },
      }),
    ],
    [t, styles, isRTL, onCreatePO, getSupplierPerformance]
  );

  const table = useReactTable({
    data: suppliers,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div dir={direction}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Search */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="bg-transparent outline-none text-sm w-64"
            style={{ color: styles.textPrimary }}
            dir={direction}
          />
        </div>

        {/* Add Supplier Button */}
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{
            backgroundColor: styles.info,
            color: '#fff',
          }}
        >
          <Plus size={16} />
          {t('buyer.workspace.addSupplier') || 'Add Supplier'}
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: styles.textMuted }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="animate-pulse" style={{ color: styles.textMuted }}>
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <p className="font-medium" style={{ color: styles.textSecondary }}>
                      {t('buyer.workspace.noSuppliers')}
                    </p>
                    <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                      {t('buyer.workspace.noSuppliersDesc')}
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    style={{ borderColor: styles.border }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div
            className={`flex items-center justify-between px-4 py-3 border-t ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ borderColor: styles.border }}
          >
            <span className="text-sm" style={{ color: styles.textMuted }}>
              {t('common.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              {t('common.of')} {table.getFilteredRowModel().rows.length}
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
    </div>
  );
};

export default SuppliersTab;
