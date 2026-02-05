import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ExpandedState,
} from '@tanstack/react-table';
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  CaretDown,
  CaretUp,
  Pencil,
  Plus,
  Funnel,
  Check,
  X,
  Warning,
  ArrowUp,
  ArrowDown,
  Cube,
  Clock,
  TrendDown,
  Star,
  Truck,
  CurrencyCircleDollar,
  Lightning,
  Info,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import { Select } from '../../../components';
import { useAuth } from '../../../../../auth-adapter';
import {
  buyerWorkspaceService,
  InventoryItemWithForecast,
  InventoryStatus,
  InventoryAlert,
  SupplierOption,
} from '../../../services/buyerWorkspaceService';

interface InventoryTabProps {
  onNavigate?: (page: string) => void;
}

const columnHelper = createColumnHelper<InventoryItemWithForecast>();

const STATUS_COLORS: Record<InventoryStatus, { bg: string; text: string }> = {
  ok: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  low: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
};

// =============================================================================
// Snackbar Alert Component
// =============================================================================

const AlertSnackbar: React.FC<{
  alerts: InventoryAlert[];
  onDismiss: (id: string) => void;
  styles: any;
  t: (key: string) => string;
  isRTL: boolean;
}> = ({ alerts, onDismiss, styles, t, isRTL }) => {
  if (alerts.length === 0) return null;

  const severityColors = {
    critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: '#ef4444' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: '#f59e0b' },
    ok: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: '#3b82f6' },
  };

  return (
    <div className="mb-4 space-y-2">
      {alerts.slice(0, 3).map((alert) => {
        const colors = severityColors[alert.severity];
        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${colors.bg} ${colors.border} ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Warning size={18} weight="fill" style={{ color: colors.icon }} />
              <div>
                <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  {alert.productName}
                </p>
                <p className="text-xs" style={{ color: styles.textSecondary }}>
                  {alert.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X size={14} style={{ color: styles.textMuted }} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// Expandable Row - Supplier & Cost Details
// =============================================================================

const ExpandedRowContent: React.FC<{
  item: InventoryItemWithForecast;
  styles: any;
  t: (key: string) => string;
  isRTL: boolean;
  onReorder: (item: InventoryItemWithForecast, supplier: SupplierOption) => void;
}> = ({ item, styles, t, isRTL, onReorder }) => {
  const [selectedQty, setSelectedQty] = useState(item.costSimulation.recommendedQty);

  return (
    <div
      className="p-4 border-t"
      style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Details */}
        <div>
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ color: styles.textMuted }}
          >
            <TrendDown size={14} />
            {t('buyer.inventory.forecastDetails')}
          </h4>
          <div className="space-y-2">
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm" style={{ color: styles.textSecondary }}>
                {t('buyer.inventory.avgDailyUsage')}
              </span>
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {item.avgDailyUsage} {t('common.units')}/{t('common.day')}
              </span>
            </div>
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm" style={{ color: styles.textSecondary }}>
                {t('buyer.inventory.depletionRate')}
              </span>
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {item.forecast.depletionRatePerDay} {t('common.units')}/{t('common.day')}
              </span>
            </div>
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm" style={{ color: styles.textSecondary }}>
                {t('buyer.inventory.suggestedReorder')}
              </span>
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {new Date(item.forecast.suggestedReorderDate).toLocaleDateString()}
              </span>
            </div>
            <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm" style={{ color: styles.textSecondary }}>
                {t('buyer.inventory.confidence')}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.forecast.confidenceLevel === 'high'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : item.forecast.confidenceLevel === 'medium'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {t(`buyer.inventory.${item.forecast.confidenceLevel}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier Options */}
        <div>
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ color: styles.textMuted }}
          >
            <Truck size={14} />
            {t('buyer.inventory.supplierOptions')}
          </h4>
          <div className="space-y-2">
            {item.supplierOptions.map((supplier) => (
              <div
                key={supplier.supplierId}
                className={`flex items-center justify-between p-2 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                    {supplier.supplierName}
                  </p>
                  <div
                    className={`flex items-center gap-2 text-xs mt-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}
                    style={{ color: styles.textMuted }}
                  >
                    <span>{supplier.currency} {supplier.lastUnitPrice}</span>
                    <span>•</span>
                    <span>{supplier.avgDeliveryDays}d</span>
                    <span>•</span>
                    <div className={`flex items-center gap-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Star size={10} weight="fill" style={{ color: '#f59e0b' }} />
                      {supplier.rating}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onReorder(item, supplier)}
                  className="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor: supplier.inStock ? styles.success + '20' : styles.border,
                    color: supplier.inStock ? styles.success : styles.textMuted,
                  }}
                  disabled={!supplier.inStock}
                >
                  {supplier.inStock ? t('buyer.inventory.order') : t('buyer.inventory.outOfStock')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Simulation */}
        <div>
          <h4
            className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ color: styles.textMuted }}
          >
            <CurrencyCircleDollar size={14} />
            {t('buyer.inventory.costSimulation')}
          </h4>
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <div className="space-y-2">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm" style={{ color: styles.textSecondary }}>
                  {t('buyer.inventory.orderQty')}
                </span>
                <input
                  type="number"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm rounded border text-right"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                  }}
                  min={1}
                />
              </div>
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm" style={{ color: styles.textSecondary }}>
                  {t('buyer.inventory.bestPrice')}
                </span>
                <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  SAR {item.costSimulation.projectedUnitCost}/unit
                </span>
              </div>
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm" style={{ color: styles.textSecondary }}>
                  {t('buyer.inventory.totalCost')}
                </span>
                <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  SAR {(selectedQty * item.costSimulation.projectedUnitCost).toLocaleString()}
                </span>
              </div>
              {item.costSimulation.potentialSavings > 0 && (
                <div
                  className={`flex items-center gap-1 mt-2 p-2 rounded-md ${isRTL ? 'flex-row-reverse justify-end' : ''}`}
                  style={{ backgroundColor: styles.success + '10' }}
                >
                  <Lightning size={14} style={{ color: styles.success }} />
                  <span className="text-xs font-medium" style={{ color: styles.success }}>
                    {t('buyer.inventory.save')} SAR {item.costSimulation.potentialSavings.toFixed(0)} ({item.costSimulation.savingsPercent}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const InventoryTab: React.FC<InventoryTabProps> = () => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRTL = direction === 'rtl';

  const [inventory, setInventory] = useState<InventoryItemWithForecast[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<number>(0);

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const [data, alertsData] = await Promise.all([
        buyerWorkspaceService.getInventoryWithForecast(token, {
          status: statusFilter || undefined,
          search: globalFilter || undefined,
        }),
        buyerWorkspaceService.getInventoryAlerts(token),
      ]);

      setInventory(data);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, statusFilter, globalFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Generate alerts from inventory data
  useEffect(() => {
    const generatedAlerts: InventoryAlert[] = inventory
      .filter((item) => item.forecast.daysUntilStockout <= 14)
      .map((item) => ({
        id: `alert-${item.id}`,
        itemId: item.id,
        productName: item.productName,
        type: item.forecast.daysUntilStockout <= 3 ? 'stockout_imminent' : 'reorder_now',
        severity: item.forecast.daysUntilStockout <= 3 ? 'critical' : 'warning',
        message:
          item.forecast.daysUntilStockout <= 3
            ? t('buyer.inventory.stockoutIn').replace('{days}', String(item.forecast.daysUntilStockout))
            : t('buyer.inventory.reorderRecommended'),
        createdAt: new Date().toISOString(),
        actionRequired: true,
      }));

    if (generatedAlerts.length > 0 && alerts.length === 0) {
      setAlerts(generatedAlerts);
    }
  }, [inventory, alerts.length, t]);

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleEdit = (item: InventoryItemWithForecast) => {
    setEditingId(item.id);
    setEditingQty(item.quantity);
  };

  const handleSave = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await buyerWorkspaceService.updateInventoryItem(token, id, { quantity: editingQty });
      setEditingId(null);
      fetchInventory();
    } catch (err) {
      console.error('Failed to update inventory:', err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingQty(0);
  };

  const handleReorder = (item: InventoryItemWithForecast, supplier: SupplierOption) => {
    // In production, this would open a purchase order creation flow
    console.log('Reorder:', item.productName, 'from', supplier.supplierName);
  };

  const columns = useMemo(
    () => [
      // Expand/collapse column
      columnHelper.display({
        id: 'expand',
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={() => row.toggleExpanded()}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {row.getIsExpanded() ? (
              <CaretUp size={14} style={{ color: styles.textMuted }} />
            ) : (
              <CaretDown size={14} style={{ color: styles.textMuted }} />
            )}
          </button>
        ),
      }),
      columnHelper.accessor('productName', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.productName')}
          </span>
        ),
        cell: (info) => (
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('sku', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.sku')}
          </span>
        ),
        cell: (info) => (
          <span className="font-mono text-xs" style={{ color: styles.textSecondary }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.quantityOnHand')}
          </span>
        ),
        cell: (info) => {
          const item = info.row.original;
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  type="number"
                  value={editingQty}
                  onChange={(e) => setEditingQty(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 rounded border text-sm"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgCard,
                    color: styles.textPrimary,
                  }}
                  min={0}
                  autoFocus
                />
                <button
                  onClick={() => handleSave(item.id)}
                  className="p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30"
                >
                  <Check size={16} style={{ color: styles.success }} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <X size={16} style={{ color: styles.error }} />
                </button>
              </div>
            );
          }

          return (
            <span className="font-medium" style={{ color: styles.textPrimary }}>
              {info.getValue()}
            </span>
          );
        },
      }),
      // Forecast column
      columnHelper.accessor('forecast.daysUntilStockout', {
        id: 'forecast',
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.inventory.daysUntilStockout')}
          </span>
        ),
        cell: (info) => {
          const days = info.getValue();
          const color =
            days <= 7
              ? styles.error
              : days <= 14
              ? '#f59e0b'
              : styles.success;

          return (
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock size={14} style={{ color }} />
              <span className="font-medium" style={{ color }}>
                {days} {t('common.days')}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: () => (
          <span className={`block ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('buyer.workspace.stockStatus')}
          </span>
        ),
        cell: (info) => {
          const status = info.getValue() as InventoryStatus;
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
      columnHelper.display({
        id: 'actions',
        header: () => (
          <span className="w-full text-center block">{t('common.actions')}</span>
        ),
        cell: (info) => {
          const item = info.row.original;
          const isEditing = editingId === item.id;

          if (isEditing) return null;

          return (
            <div className="flex items-center justify-center">
              <button
                onClick={() => handleEdit(item)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: styles.textSecondary }}
              >
                <Pencil size={14} />
                {t('buyer.workspace.adjustQuantity')}
              </button>
            </div>
          );
        },
      }),
    ],
    [t, styles, isRTL, editingId, editingQty]
  );

  const table = useReactTable({
    data: inventory,
    columns,
    state: {
      sorting,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  // Calculate inventory summary metrics
  const inventorySummary = useMemo(() => {
    const totalItems = inventory.length;
    const totalQty = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const criticalItems = inventory.filter((item) => item.status === 'critical').length;
    const lowStockItems = inventory.filter((item) => item.status === 'low').length;
    const reorderNeeded = inventory.filter((item) => item.forecast.daysUntilStockout <= 14).length;
    const avgDaysToStockout = inventory.length > 0
      ? Math.round(inventory.reduce((sum, item) => sum + item.forecast.daysUntilStockout, 0) / inventory.length)
      : 0;

    // Calculate incoming/used from pending orders
    const incomingQty = inventory.reduce((sum, item) => sum + item.pendingOrderQty, 0);
    const usedQty = Math.round(inventory.reduce((sum, item) => sum + item.avgDailyUsage, 0) * 30);

    return {
      totalItems,
      totalQty,
      criticalItems,
      lowStockItems,
      reorderNeeded,
      incomingQty: incomingQty || Math.round(totalQty * 0.15),
      usedQty: usedQty || Math.round(totalQty * 0.12),
      avgDaysToStockout,
    };
  }, [inventory]);

  return (
    <div dir={direction}>
      {/* Inline Alerts (Snackbars) */}
      <AlertSnackbar
        alerts={alerts}
        onDismiss={handleDismissAlert}
        styles={styles}
        t={t}
        isRTL={isRTL}
      />

      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Items */}
        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Cube size={18} style={{ color: styles.info }} />
            <span className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
              {t('buyer.workspace.totalItems')}
            </span>
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: styles.textPrimary }}>
            {inventorySummary.totalItems}
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
            {inventorySummary.totalQty.toLocaleString()} {t('common.units')}
          </p>
        </div>

        {/* Avg Days to Stockout */}
        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock size={18} style={{ color: styles.warning || '#f59e0b' }} />
            <span className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
              {t('buyer.inventory.avgStockoutDays')}
            </span>
          </div>
          <p
            className="text-2xl font-bold mt-2"
            style={{
              color: inventorySummary.avgDaysToStockout < 14
                ? styles.error
                : inventorySummary.avgDaysToStockout < 30
                ? '#f59e0b'
                : styles.success,
            }}
          >
            {inventorySummary.avgDaysToStockout}
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
            {t('common.days')} {t('buyer.inventory.avgAcrossItems')}
          </p>
        </div>

        {/* Used/Outgoing */}
        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <ArrowUp size={18} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
              {t('buyer.workspace.used')}
            </span>
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: '#f59e0b' }}>
            -{inventorySummary.usedQty.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
            {t('buyer.workspace.thisMonth')}
          </p>
        </div>

        {/* Reorder Alerts */}
        <div
          className="p-4 rounded-lg border"
          style={{
            borderColor: inventorySummary.reorderNeeded > 0 ? styles.error : styles.border,
            backgroundColor: inventorySummary.reorderNeeded > 0 ? 'rgba(239, 68, 68, 0.05)' : styles.bgCard,
          }}
        >
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Warning
              size={18}
              weight={inventorySummary.reorderNeeded > 0 ? 'fill' : 'regular'}
              style={{ color: inventorySummary.reorderNeeded > 0 ? styles.error : styles.textMuted }}
            />
            <span className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
              {t('buyer.workspace.reorderAlerts')}
            </span>
          </div>
          <p
            className="text-2xl font-bold mt-2"
            style={{ color: inventorySummary.reorderNeeded > 0 ? styles.error : styles.textPrimary }}
          >
            {inventorySummary.reorderNeeded}
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
            {inventorySummary.criticalItems} {t('buyer.workspace.critical')}, {inventorySummary.lowStockItems} {t('buyer.workspace.low')}
          </p>
        </div>
      </div>

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

        {/* Add Item Button */}
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{
            backgroundColor: styles.info,
            color: '#fff',
          }}
        >
          <Plus size={16} />
          {t('buyer.workspace.addItem') || 'Add Item'}
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
              { value: 'ok', label: t('buyer.workspace.ok') || 'OK' },
              { value: 'low', label: t('buyer.workspace.low') || 'Low' },
              { value: 'critical', label: t('buyer.workspace.critical') || 'Critical' },
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
                      {t('buyer.workspace.noInventory')}
                    </p>
                    <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                      {t('buyer.workspace.noInventoryDesc')}
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const item = row.original;
                  const rowBg =
                    item.status === 'critical'
                      ? 'bg-red-50/50 dark:bg-red-900/10'
                      : item.status === 'low'
                      ? 'bg-amber-50/50 dark:bg-amber-900/10'
                      : '';

                  return (
                    <Fragment key={row.id}>
                      <tr
                        className={`border-t transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${rowBg}`}
                        style={{ borderColor: styles.border }}
                        onClick={() => row.toggleExpanded()}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr>
                          <td colSpan={columns.length} className="p-0">
                            <ExpandedRowContent
                              item={item}
                              styles={styles}
                              t={t}
                              isRTL={isRTL}
                              onReorder={handleReorder}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
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

      {/* Forecasting Logic Info */}
      <div
        className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
        style={{ backgroundColor: styles.bgSecondary }}
      >
        <Info size={16} style={{ color: styles.info, flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs" style={{ color: styles.textMuted }}>
          {t('buyer.inventory.forecastNote')}
        </p>
      </div>
    </div>
  );
};

export default InventoryTab;
