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
  Check,
  X,
  Plus,
  Funnel,
  CaretDown,
  NoteBlank,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import { useAuth } from '../../../../../auth-adapter';
import { PortalDatePicker, Select } from '../../../components';
import {
  buyerWorkspaceService,
  PurchaseOrder,
  PurchaseOrderStatus,
  CreatePurchaseOrderData,
} from '../../../services/buyerWorkspaceService';

interface PurchasesTabProps {
  onNavigate?: (page: string) => void;
}

const columnHelper = createColumnHelper<PurchaseOrder>();

const STATUS_COLORS: Record<PurchaseOrderStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  sent: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  delivered: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
};

export const PurchasesTab: React.FC<PurchasesTabProps> = () => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRTL = direction === 'rtl';

  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPO, setNewPO] = useState<CreatePurchaseOrderData>({
    supplierName: '',
    totalAmount: 0,
    currency: 'SAR',
    expectedDelivery: '',
    notes: '',
    items: [{ productName: '', sku: '', quantity: 1, unitPrice: 0 }],
  });

  const fetchPurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await buyerWorkspaceService.getPurchases(token, {
        status: statusFilter || undefined,
        search: globalFilter || undefined,
      });
      setPurchases(data);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, statusFilter, globalFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleStatusChange = async (id: string, newStatus: PurchaseOrderStatus) => {
    try {
      const token = await getToken();
      if (!token) return;

      await buyerWorkspaceService.updatePurchaseStatus(token, id, newStatus);
      fetchPurchases();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreatePO = async () => {
    try {
      setIsSubmitting(true);
      const token = await getToken();
      if (!token) return;

      // Calculate total from items
      const total = newPO.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || newPO.totalAmount;

      await buyerWorkspaceService.createPurchase(token, {
        ...newPO,
        totalAmount: total,
      });

      setShowCreateModal(false);
      setNewPO({
        supplierName: '',
        totalAmount: 0,
        currency: 'SAR',
        expectedDelivery: '',
        notes: '',
        items: [{ productName: '', sku: '', quantity: 1, unitPrice: 0 }],
      });
      fetchPurchases();
    } catch (err) {
      console.error('Failed to create PO:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setNewPO({
      ...newPO,
      items: [...(newPO.items || []), { productName: '', sku: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const items = [...(newPO.items || [])];
    items.splice(index, 1);
    setNewPO({ ...newPO, items });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const items = [...(newPO.items || [])];
    items[index] = { ...items[index], [field]: value };
    setNewPO({ ...newPO, items });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('poNumber', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.poNumber')}
          </span>
        ),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('supplierName', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.supplier')}
          </span>
        ),
        cell: (info) => (
          <span style={{ color: styles.textSecondary }}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('totalAmount', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.totalAmount')}
          </span>
        ),
        cell: (info) => (
          <span style={{ color: styles.textPrimary }}>
            SAR {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.status')}
          </span>
        ),
        cell: (info) => {
          const status = info.getValue() as PurchaseOrderStatus;
          const colors = STATUS_COLORS[status];
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
            >
              {t(`buyer.workspace.${status}`)}
            </span>
          );
        },
      }),
      columnHelper.accessor('orderDate', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.orderDate')}
          </span>
        ),
        cell: (info) => (
          <span style={{ color: styles.textSecondary }}>
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.accessor('expectedDelivery', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.expectedDelivery')}
          </span>
        ),
        cell: (info) => {
          const value = info.getValue();
          return (
            <span style={{ color: styles.textSecondary }}>
              {value ? new Date(value).toLocaleDateString() : '-'}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <span className="w-full text-center block">{t('common.actions')}</span>
        ),
        cell: (info) => {
          const row = info.row.original;
          const status = row.status as PurchaseOrderStatus;
          const canApprove = status === 'sent';
          const canCancel = status === 'draft' || status === 'sent';

          return (
            <div className="flex items-center justify-center gap-1">
              <button
                className="p-1.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                title={t('buyer.workspace.view')}
              >
                <Eye size={16} style={{ color: styles.textMuted }} />
              </button>
              {canApprove && (
                <button
                  onClick={() => handleStatusChange(row.id, 'approved')}
                  className="p-1.5 rounded-md transition-colors hover:bg-green-100 dark:hover:bg-green-900/30"
                  title={t('buyer.workspace.approve')}
                >
                  <Check size={16} style={{ color: styles.success }} />
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleStatusChange(row.id, 'cancelled')}
                  className="p-1.5 rounded-md transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                  title={t('common.cancel')}
                >
                  <X size={16} style={{ color: styles.error }} />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [t, styles, isRTL, handleStatusChange]
  );

  const table = useReactTable({
    data: purchases,
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
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
        </div>

        {/* New PO Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{
            backgroundColor: styles.info,
            color: '#fff',
          }}
        >
          <Plus size={16} />
          {t('buyer.workspace.newPurchaseOrder')}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className={`flex items-center gap-4 mb-4 p-4 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Select
            value={statusFilter || 'all'}
            onChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
            options={[
              { value: 'all', label: t('buyer.workspace.allStatuses') || 'All Statuses' },
              { value: 'draft', label: t('buyer.workspace.draft') || 'Draft' },
              { value: 'sent', label: t('buyer.workspace.sent') || 'Sent' },
              { value: 'approved', label: t('buyer.workspace.approved') || 'Approved' },
              { value: 'delivered', label: t('buyer.workspace.delivered') || 'Delivered' },
              { value: 'cancelled', label: t('buyer.workspace.cancelled') || 'Cancelled' },
            ]}
          />
        </div>
      )}

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
                      {t('buyer.workspace.noPurchases')}
                    </p>
                    <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                      {t('buyer.workspace.noPurchasesDesc')}
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

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: styles.bgCard }}
            dir={direction}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-6 border-b sticky top-0 ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
            >
              <h3
                className="text-lg font-semibold"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {t('buyer.workspace.createPurchaseOrder')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} style={{ color: styles.textMuted }} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Supplier Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: styles.textSecondary }}
                >
                  {t('buyer.workspace.supplierName')} *
                </label>
                <input
                  type="text"
                  value={newPO.supplierName}
                  onChange={(e) => setNewPO({ ...newPO, supplierName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                  }}
                  placeholder={t('buyer.workspace.enterSupplierName')}
                />
              </div>

              {/* Expected Delivery */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: styles.textSecondary }}
                >
                  {t('buyer.workspace.expectedDelivery')}
                </label>
                <PortalDatePicker
                  value={newPO.expectedDelivery}
                  onChange={(value) => setNewPO({ ...newPO, expectedDelivery: value })}
                  className="w-full"
                />
              </div>

              {/* Items */}
              <div>
                <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <label
                    className="text-sm font-medium"
                    style={{ color: styles.textSecondary }}
                  >
                    {t('buyer.workspace.items')}
                  </label>
                  <button
                    onClick={addItem}
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: styles.bgSecondary, color: styles.info }}
                  >
                    + {t('buyer.workspace.addItem')}
                  </button>
                </div>
                <div className="space-y-3">
                  {newPO.items?.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border"
                      style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => updateItem(index, 'productName', e.target.value)}
                          placeholder={t('buyer.workspace.productName')}
                          className="px-2 py-1.5 rounded border text-sm"
                          style={{
                            borderColor: styles.border,
                            backgroundColor: styles.bgCard,
                            color: styles.textPrimary,
                          }}
                        />
                        <input
                          type="text"
                          value={item.sku || ''}
                          onChange={(e) => updateItem(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="px-2 py-1.5 rounded border text-sm"
                          style={{
                            borderColor: styles.border,
                            backgroundColor: styles.bgCard,
                            color: styles.textPrimary,
                          }}
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder={t('buyer.workspace.quantity')}
                          className="px-2 py-1.5 rounded border text-sm"
                          style={{
                            borderColor: styles.border,
                            backgroundColor: styles.bgCard,
                            color: styles.textPrimary,
                          }}
                          min={1}
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder={t('buyer.workspace.unitPrice')}
                            className="flex-1 px-2 py-1.5 rounded border text-sm"
                            style={{
                              borderColor: styles.border,
                              backgroundColor: styles.bgCard,
                              color: styles.textPrimary,
                            }}
                            min={0}
                            step={0.01}
                          />
                          {(newPO.items?.length || 0) > 1 && (
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <X size={14} style={{ color: styles.error }} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label
                  className={`flex items-center gap-1 text-sm font-medium mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}
                  style={{ color: styles.textSecondary }}
                >
                  <NoteBlank size={14} />
                  {t('buyer.workspace.orderNotes')}
                </label>
                <textarea
                  value={newPO.notes || ''}
                  onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                  }}
                  rows={3}
                  placeholder={t('buyer.workspace.orderNotesPlaceholder')}
                />
              </div>

              {/* Total Preview */}
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm" style={{ color: styles.textSecondary }}>
                    {t('buyer.workspace.estimatedTotal')}
                  </span>
                  <span className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                    {newPO.currency}{' '}
                    {(newPO.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex items-center gap-3 p-6 border-t ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ borderColor: styles.border }}
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: styles.border,
                  color: styles.textSecondary,
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreatePO}
                disabled={!newPO.supplierName || isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: styles.info,
                  color: '#fff',
                }}
              >
                {isSubmitting ? t('common.loading') : t('buyer.workspace.createPO')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesTab;
