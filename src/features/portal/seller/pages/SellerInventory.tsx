import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  Cube,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Warning,
  TrendUp,
  TrendDown,
  Clock,
  Fire,
  Bed,
  Lightning,
  Info,
  CheckCircle,
  WarningCircle,
  CurrencyDollar,
  Package,
  ChartLine,
  ArrowRight,
  Funnel,
  X,
  Export,
  DotsThreeVertical,
  PencilSimple,
  Pause,
  Play,
  Tag,
  ShoppingCart,
  ArrowClockwise,
  Percent,
  Target,
  Graph,
  CaretRight,
} from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState, Select } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';

// =============================================================================
// Types - Inventory Intelligence
// =============================================================================

type StockHealth = 'healthy' | 'overstock' | 'low_turnover' | 'dead_stock' | 'stockout_risk';
type DemandSignal = 'hot' | 'rising' | 'stable' | 'declining' | 'dormant';
type PricingAction = 'increase' | 'decrease' | 'bundle' | 'clearance' | 'hold';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  partNumber?: string;
  category: string;
  image?: string;

  // Stock Data
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;

  // Pricing
  unitCost: number;
  sellingPrice: number;
  currency: string;
  margin: number;

  // Performance
  salesLast30Days: number;
  salesLast90Days: number;
  rfqsLast30Days: number;
  viewsLast30Days: number;
  turnoverRate: number; // Units sold per month
  daysOfStock: number; // How many days current stock will last

  // Value
  inventoryValue: number;
  potentialRevenue: number;

  // Intelligence
  stockHealth: StockHealth;
  demandSignal: DemandSignal;
  suggestedAction: PricingAction;
  actionReason: string;
  riskScore: number; // 0-100

  // Timestamps
  lastSaleDate?: string;
  lastRFQDate?: string;
  lastRestockDate?: string;

  // Status
  isPaused: boolean;
}

interface InventoryFilters {
  search: string;
  stockHealth: StockHealth | 'all';
  demandSignal: DemandSignal | 'all';
  category: string;
  showPaused: boolean;
}

interface BulkActionResult {
  success: boolean;
  message: string;
  affectedItems: number;
}

interface SellerInventoryProps {
  onNavigate: (page: string) => void;
}

// =============================================================================
// Mock Data Generator
// =============================================================================

const generateMockInventory = (): InventoryItem[] => {
  const products = [
    { name: 'Hydraulic Pump HP-5000', sku: 'HP-5000', category: 'Hydraulics', cost: 1800, price: 2500 },
    { name: 'Ball Bearing 6205-2RS', sku: 'BRG-6205', category: 'Bearings', cost: 28, price: 45 },
    { name: 'Three-Phase Motor 5HP', sku: 'MTR-5HP', category: 'Motors', cost: 1200, price: 1850 },
    { name: 'Pneumatic Cylinder PC-100', sku: 'PC-100', category: 'Pneumatics', cost: 580, price: 890 },
    { name: 'Control Valve DN50', sku: 'VLV-DN50', category: 'Valves', cost: 2100, price: 3200 },
    { name: 'Industrial PLC S7-1200', sku: 'PLC-S7', category: 'Automation', cost: 3200, price: 4500 },
    { name: 'Pressure Sensor PS-100', sku: 'PS-100', category: 'Sensors', cost: 180, price: 320 },
    { name: 'Seal Kit SK-200', sku: 'SK-200', category: 'Spare Parts', cost: 45, price: 85 },
    { name: 'Gear Reducer GR-50', sku: 'GR-50', category: 'Power Transmission', cost: 850, price: 1280 },
    { name: 'Coupling Assembly CA-75', sku: 'CA-75', category: 'Power Transmission', cost: 120, price: 195 },
    { name: 'Filter Element FE-500', sku: 'FE-500', category: 'Filtration', cost: 35, price: 65 },
    { name: 'Solenoid Valve SV-24V', sku: 'SV-24V', category: 'Valves', cost: 95, price: 165 },
  ];

  return products.map((product, i) => {
    const currentStock = Math.floor(Math.random() * 200) + 1;
    const reservedStock = Math.floor(Math.random() * (currentStock * 0.3));
    const salesLast30Days = Math.floor(Math.random() * 50);
    const salesLast90Days = salesLast30Days * 3 + Math.floor(Math.random() * 30);
    const rfqsLast30Days = Math.floor(Math.random() * 20);
    const viewsLast30Days = Math.floor(Math.random() * 500) + 50;
    const turnoverRate = salesLast30Days;
    const daysOfStock = turnoverRate > 0 ? Math.round((currentStock - reservedStock) / (turnoverRate / 30)) : 999;

    // Determine stock health
    let stockHealth: StockHealth;
    let demandSignal: DemandSignal;
    let suggestedAction: PricingAction;
    let actionReason: string;
    let riskScore: number;

    // Stock health logic
    if (daysOfStock < 7 && turnoverRate > 5) {
      stockHealth = 'stockout_risk';
      riskScore = 85;
    } else if (daysOfStock > 120) {
      stockHealth = 'dead_stock';
      riskScore = 75;
    } else if (daysOfStock > 90) {
      stockHealth = 'low_turnover';
      riskScore = 55;
    } else if (daysOfStock > 60 && currentStock > 50) {
      stockHealth = 'overstock';
      riskScore = 45;
    } else {
      stockHealth = 'healthy';
      riskScore = 15;
    }

    // Demand signal logic
    const viewToRfqRate = viewsLast30Days > 0 ? (rfqsLast30Days / viewsLast30Days) * 100 : 0;
    if (rfqsLast30Days > 10 || (salesLast30Days > 20 && rfqsLast30Days > 5)) {
      demandSignal = 'hot';
    } else if (rfqsLast30Days > salesLast30Days * 0.5) {
      demandSignal = 'rising';
    } else if (salesLast30Days > 0 || rfqsLast30Days > 0) {
      demandSignal = 'stable';
    } else if (salesLast90Days > 0) {
      demandSignal = 'declining';
    } else {
      demandSignal = 'dormant';
    }

    // Pricing action logic
    if (stockHealth === 'dead_stock') {
      suggestedAction = 'clearance';
      actionReason = 'No sales in 90+ days, consider clearance pricing';
    } else if (stockHealth === 'overstock' && demandSignal === 'declining') {
      suggestedAction = 'decrease';
      actionReason = `${daysOfStock} days of stock with declining demand`;
    } else if (demandSignal === 'hot' && stockHealth === 'healthy') {
      suggestedAction = 'increase';
      actionReason = 'High demand allows for price optimization';
    } else if (stockHealth === 'low_turnover') {
      suggestedAction = 'bundle';
      actionReason = 'Bundle with fast-moving items to increase turnover';
    } else {
      suggestedAction = 'hold';
      actionReason = 'Current pricing is optimal for market conditions';
    }

    const margin = ((product.price - product.cost) / product.price) * 100;
    const inventoryValue = currentStock * product.cost;
    const potentialRevenue = currentStock * product.price;

    const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

    return {
      id: `inv-${i + 1}`,
      name: product.name,
      sku: product.sku,
      partNumber: `PN-${product.sku}`,
      category: product.category,
      image: `https://images.unsplash.com/photo-${1581092160562 + i}?w=100&h=100&fit=crop`,
      currentStock,
      reservedStock,
      availableStock: currentStock - reservedStock,
      reorderPoint: Math.max(10, Math.floor(turnoverRate * 1.5)),
      unitCost: product.cost,
      sellingPrice: product.price,
      currency: 'SAR',
      margin,
      salesLast30Days,
      salesLast90Days,
      rfqsLast30Days,
      viewsLast30Days,
      turnoverRate,
      daysOfStock,
      inventoryValue,
      potentialRevenue,
      stockHealth,
      demandSignal,
      suggestedAction,
      actionReason,
      riskScore,
      lastSaleDate: salesLast30Days > 0 ? daysAgo(Math.floor(Math.random() * 30)) : undefined,
      lastRFQDate: rfqsLast30Days > 0 ? daysAgo(Math.floor(Math.random() * 30)) : undefined,
      lastRestockDate: daysAgo(Math.floor(Math.random() * 60) + 30),
      isPaused: i % 10 === 0,
    };
  });
};

// =============================================================================
// Configuration
// =============================================================================

const stockHealthConfig: Record<StockHealth, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  healthy: { label: 'Healthy', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
  overstock: { label: 'Overstock', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Warning },
  low_turnover: { label: 'Low Turnover', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  dead_stock: { label: 'Dead Stock', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: Bed },
  stockout_risk: { label: 'Stockout Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: WarningCircle },
};

const demandSignalConfig: Record<DemandSignal, { label: string; color: string; icon: React.ElementType }> = {
  hot: { label: 'Hot', color: '#ef4444', icon: Fire },
  rising: { label: 'Rising', color: '#22c55e', icon: TrendUp },
  stable: { label: 'Stable', color: '#3b82f6', icon: Graph },
  declining: { label: 'Declining', color: '#f59e0b', icon: TrendDown },
  dormant: { label: 'Dormant', color: '#9ca3af', icon: Bed },
};

const pricingActionConfig: Record<PricingAction, { label: string; color: string; icon: React.ElementType }> = {
  increase: { label: 'Consider Price Increase', color: '#22c55e', icon: TrendUp },
  decrease: { label: 'Consider Price Decrease', color: '#f59e0b', icon: TrendDown },
  bundle: { label: 'Bundle Opportunity', color: '#3b82f6', icon: Package },
  clearance: { label: 'Clearance Suggested', color: '#ef4444', icon: Tag },
  hold: { label: 'Hold Current Price', color: '#9ca3af', icon: CheckCircle },
};

// =============================================================================
// Component
// =============================================================================

const columnHelper = createColumnHelper<InventoryItem>();

export const SellerInventory: React.FC<SellerInventoryProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'riskScore', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    stockHealth: 'all',
    demandSignal: 'all',
    category: 'all',
    showPaused: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'info',
  });

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      setInventory(generateMockInventory());
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      if (!filters.showPaused && item.isPaused) return false;
      if (filters.stockHealth !== 'all' && item.stockHealth !== filters.stockHealth) return false;
      if (filters.demandSignal !== 'all' && item.demandSignal !== filters.demandSignal) return false;
      if (filters.category !== 'all' && item.category !== filters.category) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          item.name.toLowerCase().includes(search) ||
          item.sku.toLowerCase().includes(search) ||
          item.partNumber?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [inventory, filters]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = inventory.length;
    const atRisk = inventory.filter(i => ['overstock', 'dead_stock', 'stockout_risk', 'low_turnover'].includes(i.stockHealth)).length;
    const totalValue = inventory.reduce((sum, i) => sum + i.inventoryValue, 0);
    const atRiskValue = inventory.filter(i => ['overstock', 'dead_stock'].includes(i.stockHealth)).reduce((sum, i) => sum + i.inventoryValue, 0);
    const hotItems = inventory.filter(i => i.demandSignal === 'hot').length;
    const dormantItems = inventory.filter(i => i.demandSignal === 'dormant').length;

    return { total, atRisk, totalValue, atRiskValue, hotItems, dormantItems };
  }, [inventory]);

  // Categories
  const categories = useMemo(() => {
    const cats = [...new Set(inventory.map(i => i.category))];
    return cats.sort();
  }, [inventory]);

  // Bulk actions
  const handleBulkAction = (action: 'pause' | 'resume' | 'restock' | 'clearance') => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    // Simulate bulk action
    setSnackbar({
      show: true,
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} applied to ${selectedIds.length} items`,
      type: 'success',
    });
    setRowSelection({});

    // Auto-hide snackbar
    setTimeout(() => setSnackbar(prev => ({ ...prev, show: false })), 3000);
  };

  // Table columns
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="w-4 h-4 rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 rounded"
        />
      ),
      size: 40,
    }),
    columnHelper.accessor('name', {
      header: 'Product',
      cell: ({ row }) => {
        const item = row.original;
        const healthConfig = stockHealthConfig[item.stockHealth];
        const HealthIcon = healthConfig.icon;

        return (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              {item.image ? (
                <img src={item.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Cube size={18} style={{ color: styles.textMuted }} />
                </div>
              )}
              {item.isPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Pause size={12} weight="fill" className="text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate" style={{ color: styles.textPrimary }}>
                  {item.name}
                </p>
                <HealthIcon size={12} weight="fill" style={{ color: healthConfig.color }} />
              </div>
              <p className="text-xs truncate" style={{ color: styles.textMuted }}>
                {item.sku} · {item.category}
              </p>
            </div>
          </div>
        );
      },
      size: 280,
    }),
    columnHelper.accessor('stockHealth', {
      header: 'Stock Health',
      cell: ({ row }) => {
        const item = row.original;
        const config = stockHealthConfig[item.stockHealth];
        const Icon = config.icon;

        return (
          <div className="flex flex-col gap-1">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Icon size={10} weight="fill" />
              {config.label}
            </span>
            <span className="text-xs" style={{ color: styles.textMuted }}>
              {item.daysOfStock < 999 ? `${item.daysOfStock}d stock left` : 'No sales data'}
            </span>
          </div>
        );
      },
      size: 130,
    }),
    columnHelper.accessor('currentStock', {
      header: 'Stock',
      cell: ({ row }) => {
        const item = row.original;
        const isLow = item.currentStock <= item.reorderPoint;

        return (
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm" style={{ color: isLow ? styles.error : styles.textPrimary }}>
                {item.availableStock}
              </span>
              {item.reservedStock > 0 && (
                <span className="text-xs" style={{ color: styles.textMuted }}>
                  ({item.reservedStock} reserved)
                </span>
              )}
            </div>
            {isLow && (
              <span className="text-xs" style={{ color: styles.error }}>
                Below reorder point ({item.reorderPoint})
              </span>
            )}
          </div>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('demandSignal', {
      header: 'Demand',
      cell: ({ row }) => {
        const item = row.original;
        const config = demandSignalConfig[item.demandSignal];
        const Icon = config.icon;

        return (
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: config.color }}>
              <Icon size={12} weight="fill" />
              {config.label}
            </span>
            <span className="text-xs" style={{ color: styles.textMuted }}>
              {item.rfqsLast30Days} RFQs · {item.salesLast30Days} sales
            </span>
          </div>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('inventoryValue', {
      header: 'Value',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <div className="font-medium text-sm" style={{ color: styles.textPrimary }}>
              {item.currency} {item.inventoryValue.toLocaleString()}
            </div>
            <div className="text-xs" style={{ color: styles.textMuted }}>
              {item.margin.toFixed(1)}% margin
            </div>
          </div>
        );
      },
      size: 110,
    }),
    columnHelper.accessor('suggestedAction', {
      header: 'Suggested Action',
      cell: ({ row }) => {
        const item = row.original;
        const config = pricingActionConfig[item.suggestedAction];
        const Icon = config.icon;
        const [showTooltip, setShowTooltip] = useState(false);

        return (
          <div className="relative">
            <button
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors"
              style={{ backgroundColor: `${config.color}15`, color: config.color }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Icon size={12} />
              {config.label}
            </button>
            {showTooltip && (
              <div
                className="absolute z-50 top-full mt-1 p-3 rounded-lg shadow-lg text-xs w-56"
                style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}`, left: 0 }}
              >
                <div className="font-semibold mb-1" style={{ color: styles.textPrimary }}>
                  Recommendation
                </div>
                <p style={{ color: styles.textSecondary }}>{item.actionReason}</p>
              </div>
            )}
          </div>
        );
      },
      size: 160,
    }),
    columnHelper.accessor('riskScore', {
      header: 'Risk',
      cell: ({ row }) => {
        const item = row.original;
        const color = item.riskScore >= 70 ? styles.error : item.riskScore >= 40 ? '#f59e0b' : styles.success;

        return (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {item.riskScore}
            </div>
          </div>
        );
      },
      size: 70,
    }),
    columnHelper.display({
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        const [showMenu, setShowMenu] = useState(false);

        return (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded transition-colors"
              style={{ color: styles.textMuted }}
            >
              <DotsThreeVertical size={16} weight="bold" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute top-full mt-1 z-20 py-1 rounded-lg shadow-lg min-w-[160px]"
                  style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}`, [isRtl ? 'left' : 'right']: 0 }}
                >
                  <MenuItem icon={PencilSimple} label="Edit Item" styles={styles} onClick={() => {}} />
                  <MenuItem icon={ChartLine} label="View Analytics" styles={styles} onClick={() => {}} />
                  <MenuItem
                    icon={item.isPaused ? Play : Pause}
                    label={item.isPaused ? 'Resume' : 'Pause'}
                    styles={styles}
                    onClick={() => {}}
                  />
                  <div className="h-px my-1" style={{ backgroundColor: styles.border }} />
                  <MenuItem icon={ArrowClockwise} label="Restock" styles={styles} onClick={() => {}} />
                  {item.stockHealth === 'dead_stock' && (
                    <MenuItem icon={Tag} label="Mark for Clearance" styles={styles} onClick={() => {}} danger />
                  )}
                </div>
              </>
            )}
          </div>
        );
      },
      size: 50,
    }),
  ], [styles, isRtl]);

  // Table instance
  const table = useReactTable({
    data: filteredInventory,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const selectedCount = Object.keys(rowSelection).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: styles.bgPrimary }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: styles.border, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('seller.inventory.title') || 'Inventory Intelligence'}
          subtitle={t('seller.inventory.subtitle') || 'Monitor stock health and optimize inventory'}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={Export}>
                Export
              </Button>
              <Button variant="primary" size="sm" icon={ArrowClockwise} onClick={() => onNavigate('listings')}>
                Manage Products
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <SummaryCard
            label="Total Items"
            value={summaryStats.total.toString()}
            icon={Package}
            styles={styles}
          />
          <SummaryCard
            label="Items at Risk"
            value={summaryStats.atRisk.toString()}
            icon={Warning}
            color="#f59e0b"
            styles={styles}
          />
          <SummaryCard
            label="Total Value"
            value={`SAR ${(summaryStats.totalValue / 1000).toFixed(0)}K`}
            icon={CurrencyDollar}
            styles={styles}
          />
          <SummaryCard
            label="Value at Risk"
            value={`SAR ${(summaryStats.atRiskValue / 1000).toFixed(0)}K`}
            icon={WarningCircle}
            color="#ef4444"
            styles={styles}
          />
          <SummaryCard
            label="Hot Items"
            value={summaryStats.hotItems.toString()}
            icon={Fire}
            color="#ef4444"
            styles={styles}
          />
          <SummaryCard
            label="Dormant Items"
            value={summaryStats.dormantItems.toString()}
            icon={Bed}
            color="#9ca3af"
            styles={styles}
          />
        </div>

        {/* Filters & Search */}
        <div
          className="rounded-xl border mb-4"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <MagnifyingGlass
                size={16}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ [isRtl ? 'right' : 'left']: 12, color: styles.textMuted }}
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by name, SKU..."
                className="w-full py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: styles.bgSecondary,
                  border: `1px solid ${styles.border}`,
                  color: styles.textPrimary,
                  [isRtl ? 'paddingRight' : 'paddingLeft']: 38,
                  [isRtl ? 'paddingLeft' : 'paddingRight']: 12,
                }}
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <Select
                value={filters.stockHealth}
                onChange={(value) => setFilters({ ...filters, stockHealth: value as any })}
                options={[
                  { value: 'all', label: 'All Health' },
                  ...Object.entries(stockHealthConfig).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                  })),
                ]}
              />
              <Select
                value={filters.demandSignal}
                onChange={(value) => setFilters({ ...filters, demandSignal: value as any })}
                options={[
                  { value: 'all', label: 'All Demand' },
                  ...Object.entries(demandSignalConfig).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                  })),
                ]}
              />
              <Select
                value={filters.category}
                onChange={(value) => setFilters({ ...filters, category: value })}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(cat => ({ value: cat, label: cat })),
                ]}
              />
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedCount > 0 && (
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: styles.bgSecondary, borderTop: `1px solid ${styles.border}` }}
            >
              <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('pause')}
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{ backgroundColor: styles.bgCard, color: styles.textSecondary, border: `1px solid ${styles.border}` }}
                >
                  Pause Selected
                </button>
                <button
                  onClick={() => handleBulkAction('restock')}
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  Mark for Restock
                </button>
                <button
                  onClick={() => setRowSelection({})}
                  className="p-1.5 rounded"
                  style={{ color: styles.textMuted }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          {filteredInventory.length === 0 ? (
            <EmptyState
              icon={Cube}
              title="No inventory items found"
              description="Try adjusting your filters or add new products."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} style={{ borderBottom: `1px solid ${styles.border}` }}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                          style={{ color: styles.textMuted, width: header.getSize() }}
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
                <tbody>
                  {table.getRowModel().rows.map((row, index) => {
                    const item = row.original;
                    const isHighRisk = item.riskScore >= 70;
                    const isMediumRisk = item.riskScore >= 40 && item.riskScore < 70;

                    return (
                      <tr
                        key={row.id}
                        className="group transition-colors"
                        style={{
                          borderBottom: index === table.getRowModel().rows.length - 1 ? 'none' : `1px solid ${styles.border}`,
                          backgroundColor: row.getIsSelected()
                            ? styles.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)'
                            : isHighRisk
                            ? styles.isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)'
                            : 'transparent',
                          borderLeft: isHighRisk ? `3px solid ${styles.error}` : isMediumRisk ? `3px solid #f59e0b` : 'none',
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3"
                            style={{ width: cell.column.getSize(), verticalAlign: 'middle' }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>

      {/* Snackbar */}
      {snackbar.show && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
          style={{
            backgroundColor: snackbar.type === 'success' ? styles.success : snackbar.type === 'error' ? styles.error : styles.info,
            color: '#fff',
          }}
        >
          {snackbar.type === 'success' && <CheckCircle size={18} weight="fill" />}
          {snackbar.type === 'error' && <WarningCircle size={18} weight="fill" />}
          {snackbar.type === 'info' && <Info size={18} weight="fill" />}
          <span className="text-sm font-medium">{snackbar.message}</span>
          <button onClick={() => setSnackbar(prev => ({ ...prev, show: false }))} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Sub-Components
// =============================================================================

const SummaryCard: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
  styles: any;
}> = ({ label, value, icon: Icon, color, styles }) => (
  <div
    className="rounded-xl p-4"
    style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} style={{ color: color || styles.textMuted }} />
      <span className="text-xs" style={{ color: styles.textMuted }}>{label}</span>
    </div>
    <div className="text-xl font-bold" style={{ color: color || styles.textPrimary }}>
      {value}
    </div>
  </div>
);

const MenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  styles: any;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon: Icon, label, styles, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-left"
    style={{ color: danger ? styles.error : styles.textSecondary }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <Icon size={14} />
    {label}
  </button>
);

export default SellerInventory;
