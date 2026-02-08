import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { featureLogger } from '../../../../utils/logger';
import {
  Buildings,
  MagnifyingGlass,
  Plus,
  UploadSimple,
  Scales,
  Rows,
  SquaresFour,
  X,
  CaretDown,
  SlidersHorizontal,
  ArrowCounterClockwise,
  Check,
  CaretLeft,
  CaretRight,
  Star,
  FileText,
  Package,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Container, PageHeader, Button, EmptyState } from '../../components';
import { SupplierTable } from '../components/SupplierTable';
import { SupplierDetailsPanel } from '../components/SupplierDetailsPanel';
import { SupplierCompareModal } from '../components/SupplierCompareModal';
import type { Supplier, SupplierSortField, SupplierSortConfig } from '../../types/supplier.types';
// NOTE: Mock suppliers removed - see MOCK_REMOVAL_REPORT.md

interface BuyerSuppliersProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

type ViewMode = 'table' | 'cards';
type SortPreset = 'recommended' | 'lowest_risk' | 'fastest_response' | 'highest_reliability';
type Density = 'comfortable' | 'compact';

// Filter chip component - memoized to prevent re-renders in lists
const FilterChip = React.memo<{
  label: string;
  onRemove: () => void;
}>(({ label, onRemove }) => {
  const { styles } = usePortal();

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors"
      style={{
        backgroundColor: styles.bgSecondary,
        border: `1px solid ${styles.border}`,
        color: styles.textSecondary,
      }}
    >
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 rounded hover:opacity-70 transition-opacity"
        style={{ color: styles.textMuted }}
      >
        <X size={10} weight="bold" />
      </button>
    </span>
  );
});

// Filter dropdown component
interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const FilterDropdown = React.memo<FilterDropdownProps>(({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { styles } = usePortal();

  const toggleOption = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange],
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{
          backgroundColor: selected.length > 0 ? styles.bgSecondary : 'transparent',
          border: `1px solid ${selected.length > 0 ? styles.textMuted : styles.border}`,
          color: selected.length > 0 ? styles.textPrimary : styles.textSecondary,
        }}
      >
        {label}
        {selected.length > 0 && (
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold"
            style={{ backgroundColor: styles.textPrimary, color: styles.bgPrimary }}
          >
            {selected.length}
          </span>
        )}
        <CaretDown size={12} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg shadow-lg py-1"
            style={{
              backgroundColor: styles.bgCard,
              border: `1px solid ${styles.border}`,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: styles.textPrimary,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: selected.includes(option.value) ? styles.textPrimary : styles.border,
                    backgroundColor: selected.includes(option.value) ? styles.textPrimary : 'transparent',
                  }}
                >
                  {selected.includes(option.value) && (
                    <Check size={10} weight="bold" style={{ color: styles.bgPrimary }} />
                  )}
                </div>
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

// Sort dropdown - memoized
const SortDropdown = React.memo<{
  value: SortPreset;
  onChange: (value: SortPreset) => void;
}>(({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { styles } = usePortal();

  const options: { value: SortPreset; label: string }[] = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'lowest_risk', label: 'Lowest Risk' },
    { value: 'fastest_response', label: 'Fastest Response' },
    { value: 'highest_reliability', label: 'Highest Reliability' },
  ];

  const selectedLabel = options.find((o) => o.value === value)?.label || 'Sort';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${styles.border}`,
          color: styles.textSecondary,
        }}
      >
        <SlidersHorizontal size={12} />
        {selectedLabel}
        <CaretDown size={12} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full right-0 mt-1 z-50 min-w-[160px] rounded-lg shadow-lg py-1"
            style={{
              backgroundColor: styles.bgCard,
              border: `1px solid ${styles.border}`,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                style={{
                  backgroundColor: value === option.value ? styles.bgSecondary : 'transparent',
                  color: value === option.value ? styles.textPrimary : styles.textSecondary,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = value === option.value ? styles.bgSecondary : 'transparent')
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

// =============================================================================
// Supplier Card - Clean, Enterprise-Grade Design
// =============================================================================
// Calm, decision-oriented card with grouped metrics (Reliability / Delivery / Risk)
// Memoized to prevent re-renders when other cards change

const SupplierCard = React.memo<{
  supplier: Supplier;
  isSelected: boolean;
  isActive: boolean;
  isShortlisted: boolean;
  onSelect: () => void;
  onClick: () => void;
  onViewOrders?: () => void;
  onViewRFQs?: () => void;
  onShortlist?: () => void;
}>(({ supplier, isSelected, isActive, isShortlisted, onSelect, onClick, onViewOrders, onViewRFQs, onShortlist }) => {
  const { styles } = usePortal();

  // Risk configuration - uses semantic colors
  const riskConfig: Record<string, { color: string; bgColor: string; label: string }> = {
    low: { color: '#059669', bgColor: styles.isDark ? 'rgba(5,150,105,0.15)' : '#ecfdf5', label: 'Low Risk' },
    medium: { color: '#d97706', bgColor: styles.isDark ? 'rgba(217,119,6,0.15)' : '#fffbeb', label: 'Medium' },
    high: { color: '#dc2626', bgColor: styles.isDark ? 'rgba(220,38,38,0.15)' : '#fef2f2', label: 'High Risk' },
    critical: { color: '#991b1b', bgColor: styles.isDark ? 'rgba(153,27,27,0.15)' : '#fef2f2', label: 'Critical' },
  };

  const risk = riskConfig[supplier.riskLevel] || riskConfig.medium;
  const onTimeRate =
    supplier.metrics.totalOrders > 0
      ? Math.round((supplier.metrics.onTimeDeliveries / supplier.metrics.totalOrders) * 100)
      : 0;
  const avgDeviation = supplier.metrics.averageDeliveryDeviation;

  // Tier badge colors
  const tierColors: Record<string, { color: string; bg: string }> = {
    strategic: { color: '#7c3aed', bg: styles.isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff' },
    preferred: { color: '#2563eb', bg: styles.isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff' },
    approved: { color: '#059669', bg: styles.isDark ? 'rgba(5,150,105,0.15)' : '#ecfdf5' },
    conditional: { color: '#d97706', bg: styles.isDark ? 'rgba(217,119,6,0.15)' : '#fffbeb' },
  };
  const tierStyle = tierColors[supplier.tier] || tierColors.approved;

  return (
    <div
      className="group rounded-xl cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: isActive ? styles.bgSecondary : styles.bgCard,
        border: `1px solid ${isActive ? styles.textMuted : styles.border}`,
        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
      }}
      onClick={onClick}
    >
      {/* Header Section */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <label className="flex items-center cursor-pointer flex-shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={isSelected} onChange={onSelect} className="sr-only" />
            <div
              className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
              style={{
                borderColor: isSelected ? styles.textPrimary : styles.border,
                backgroundColor: isSelected ? styles.textPrimary : 'transparent',
              }}
            >
              {isSelected && <Check size={10} weight="bold" style={{ color: styles.bgPrimary }} />}
            </div>
          </label>

          {/* Supplier Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[15px] truncate" style={{ color: styles.textPrimary }}>
                {supplier.name}
              </h3>
              {supplier.status === 'active' && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: styles.success }} />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: styles.textSecondary }}>
              <span>{supplier.code}</span>
              <span>·</span>
              <span>{supplier.country}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: tierStyle.bg, color: tierStyle.color }}
              >
                {supplier.tier.charAt(0).toUpperCase() + supplier.tier.slice(1)}
              </span>
            </div>
          </div>

          {/* Risk Badge */}
          <span
            className="px-2 py-1 rounded-md text-[11px] font-medium flex-shrink-0"
            style={{ backgroundColor: risk.bgColor, color: risk.color }}
          >
            {risk.label}
          </span>
        </div>
      </div>

      {/* Metrics Section - Grouped by Category */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-3">
          {/* Reliability Group */}
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: styles.textMuted }}>
              Reliability
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold" style={{ color: styles.textPrimary }}>
                {supplier.reliabilityScore}
              </span>
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                /100
              </span>
            </div>
            <p className="text-[11px]" style={{ color: styles.textSecondary }}>
              {supplier.metrics.totalOrders} orders
            </p>
          </div>

          {/* Delivery Group */}
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: styles.textMuted }}>
              Delivery
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className="text-xl font-semibold"
                style={{ color: onTimeRate >= 85 ? '#059669' : onTimeRate >= 70 ? '#d97706' : '#dc2626' }}
              >
                {onTimeRate}%
              </span>
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                on-time
              </span>
            </div>
            <p className="text-[11px]" style={{ color: styles.textSecondary }}>
              {avgDeviation === 0
                ? 'On schedule'
                : avgDeviation > 0
                  ? `${avgDeviation.toFixed(1)}d late avg`
                  : `${Math.abs(avgDeviation).toFixed(1)}d early avg`}
            </p>
          </div>

          {/* Response Group */}
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: styles.textMuted }}>
              Response
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold" style={{ color: styles.textPrimary }}>
                {supplier.leadTimeDays}
              </span>
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                days
              </span>
            </div>
            <p className="text-[11px]" style={{ color: styles.textSecondary }}>
              {supplier.metrics.averageResponseTimeHours < 24
                ? `${Math.round(supplier.metrics.averageResponseTimeHours)}h reply`
                : `${Math.round(supplier.metrics.averageResponseTimeHours / 24)}d reply`}
            </p>
          </div>
        </div>
      </div>

      {/* Spend & Categories */}
      <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${styles.border}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: styles.textSecondary }}>
              <span className="font-medium" style={{ color: styles.textPrimary }}>
                ${(supplier.metrics.totalSpend / 1000).toFixed(0)}K
              </span>{' '}
              total spend
            </span>
            {supplier.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                {cat}
              </span>
            ))}
            {supplier.categories.length > 2 && (
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                +{supplier.categories.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Visible on Hover */}
      <div
        className="px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ borderTop: `1px solid ${styles.border}`, backgroundColor: styles.bgSecondary }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onViewOrders}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: styles.bgCard,
              border: `1px solid ${styles.border}`,
              color: styles.textSecondary,
            }}
          >
            <Package size={12} />
            View Orders
          </button>
          <button
            onClick={onViewRFQs}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: styles.bgCard,
              border: `1px solid ${styles.border}`,
              color: styles.textSecondary,
            }}
          >
            <FileText size={12} />
            View RFQs
          </button>
          <button
            onClick={onShortlist}
            className="p-1.5 rounded-md transition-colors hover:opacity-80"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}`, color: styles.textMuted }}
            title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            <Star
              size={14}
              weight={isShortlisted ? 'fill' : 'regular'}
              style={{ color: isShortlisted ? '#d97706' : undefined }}
            />
          </button>
        </div>
      </div>
    </div>
  );
});

// Main component
export const BuyerSuppliers: React.FC<BuyerSuppliersProps> = ({ onNavigate }) => {
  const { styles } = usePortal();

  // Data state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [density, _setDensity] = useState<Density>('comfortable');

  // Selection state
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);

  // Sort state
  const [sortPreset, setSortPreset] = useState<SortPreset>('recommended');
  const [sortConfig, setSortConfig] = useState<SupplierSortConfig>({
    field: 'reliabilityScore',
    direction: 'desc',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Compare modal
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Panel responsive state
  const [isPanelDrawer, setIsPanelDrawer] = useState(false);

  // Check screen width for responsive panel
  useEffect(() => {
    const checkWidth = () => {
      setIsPanelDrawer(window.innerWidth < 1024);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Load suppliers data from API (production mode)
  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true);
      try {
        // Supplier API endpoint not yet available; returns empty state
        // Future: const data = await supplierService.getSuppliers(token);
        // Future: setSuppliers(data);
        setSuppliers([]);
      } catch (err) {
        console.error('Failed to load suppliers:', err);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };
    loadSuppliers();
  }, []);

  // Apply sort preset to sortConfig
  useEffect(() => {
    switch (sortPreset) {
      case 'recommended':
        setSortConfig({ field: 'reliabilityScore', direction: 'desc' });
        break;
      case 'lowest_risk':
        setSortConfig({ field: 'dependencyPercentage', direction: 'asc' });
        break;
      case 'fastest_response':
        setSortConfig({ field: 'communicationScore', direction: 'desc' });
        break;
      case 'highest_reliability':
        setSortConfig({ field: 'reliabilityScore', direction: 'desc' });
        break;
    }
  }, [sortPreset]);

  // Get unique categories from suppliers
  const categories = useMemo(() => {
    const cats = new Set<string>();
    suppliers.forEach((s) => s.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [suppliers]);

  // Get unique countries/regions from suppliers
  const regions = useMemo(() => {
    const regs = new Set<string>();
    suppliers.forEach((s) => regs.add(s.country));
    return Array.from(regs).sort();
  }, [suppliers]);

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.country.toLowerCase().includes(query) ||
          s.categories.some((c) => c.toLowerCase().includes(query)),
      );
    }

    // Risk filter
    if (riskFilter.length > 0) {
      result = result.filter((s) => riskFilter.includes(s.riskLevel));
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((s) => statusFilter.includes(s.status));
    }

    // Tier filter
    if (tierFilter.length > 0) {
      result = result.filter((s) => tierFilter.includes(s.tier));
    }

    // Category filter
    if (categoryFilter.length > 0) {
      result = result.filter((s) => s.categories.some((c) => categoryFilter.includes(c)));
    }

    // Region filter
    if (regionFilter.length > 0) {
      result = result.filter((s) => regionFilter.includes(s.country));
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortConfig.field) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'reliabilityScore':
          aVal = a.reliabilityScore;
          bVal = b.reliabilityScore;
          break;
        case 'dependencyPercentage':
          aVal = a.metrics.dependencyPercentage;
          bVal = b.metrics.dependencyPercentage;
          break;
        case 'averageDeliveryDeviation':
          aVal = Math.abs(a.metrics.averageDeliveryDeviation);
          bVal = Math.abs(b.metrics.averageDeliveryDeviation);
          break;
        case 'communicationScore':
          aVal = a.metrics.communicationScore;
          bVal = b.metrics.communicationScore;
          break;
        case 'totalSpend':
          aVal = a.metrics.totalSpend;
          bVal = b.metrics.totalSpend;
          break;
        default:
          aVal = a.reliabilityScore;
          bVal = b.reliabilityScore;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [suppliers, searchQuery, riskFilter, statusFilter, tierFilter, categoryFilter, regionFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, riskFilter, statusFilter, tierFilter, categoryFilter, regionFilter]);

  // Count active filters
  const activeFilterCount =
    riskFilter.length + statusFilter.length + tierFilter.length + categoryFilter.length + regionFilter.length;

  // Active filter chips
  const filterChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  riskFilter.forEach((r) => {
    filterChips.push({
      key: `risk-${r}`,
      label: `Risk: ${r.charAt(0).toUpperCase() + r.slice(1)}`,
      onRemove: () => setRiskFilter(riskFilter.filter((v) => v !== r)),
    });
  });
  statusFilter.forEach((s) => {
    filterChips.push({
      key: `status-${s}`,
      label: `Status: ${s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}`,
      onRemove: () => setStatusFilter(statusFilter.filter((v) => v !== s)),
    });
  });
  tierFilter.forEach((t) => {
    filterChips.push({
      key: `tier-${t}`,
      label: `Tier: ${t.charAt(0).toUpperCase() + t.slice(1)}`,
      onRemove: () => setTierFilter(tierFilter.filter((v) => v !== t)),
    });
  });
  categoryFilter.forEach((c) => {
    filterChips.push({
      key: `cat-${c}`,
      label: `Category: ${c}`,
      onRemove: () => setCategoryFilter(categoryFilter.filter((v) => v !== c)),
    });
  });
  regionFilter.forEach((r) => {
    filterChips.push({
      key: `region-${r}`,
      label: `Region: ${r}`,
      onRemove: () => setRegionFilter(regionFilter.filter((v) => v !== r)),
    });
  });

  const resetFilters = () => {
    setSearchQuery('');
    setRiskFilter([]);
    setStatusFilter([]);
    setTierFilter([]);
    setCategoryFilter([]);
    setRegionFilter([]);
  };

  const handleSort = (field: SupplierSortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleShortlist = (supplier: Supplier) => {
    setShortlistedIds((prev) =>
      prev.includes(supplier.id) ? prev.filter((id) => id !== supplier.id) : [...prev, supplier.id],
    );
  };

  // Get selected supplier objects for comparison
  const suppliersToCompare = useMemo(() => {
    return suppliers.filter((s) => selectedSuppliers.includes(s.id));
  }, [suppliers, selectedSuppliers]);

  // Export handlers (placeholders)
  const handleExportPDF = () => {
    featureLogger.info('Export PDF - to be implemented');
    // Placeholder for PDF export
  };

  const handleExportExcel = () => {
    featureLogger.info('Export Excel - to be implemented');
    // Placeholder for Excel export
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title="Suppliers"
          subtitle="Evaluate performance, compare metrics, and manage your supplier network"
          actions={
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div
                className="flex items-center rounded-lg p-1"
                style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
              >
                <button
                  onClick={() => setViewMode('cards')}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: viewMode === 'cards' ? styles.bgSecondary : 'transparent',
                    color: viewMode === 'cards' ? styles.textPrimary : styles.textMuted,
                  }}
                  title="Card view"
                >
                  <SquaresFour size={14} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: viewMode === 'table' ? styles.bgSecondary : 'transparent',
                    color: viewMode === 'table' ? styles.textPrimary : styles.textMuted,
                  }}
                  title="Table view"
                >
                  <Rows size={14} />
                </button>
              </div>

              <div className="w-px h-8" style={{ backgroundColor: styles.border }} />

              <Button
                variant="secondary"
                onClick={() => setIsCompareOpen(true)}
                disabled={selectedSuppliers.length < 2}
              >
                <Scales size={14} className="mr-1.5" />
                Compare
                {selectedSuppliers.length >= 2 && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ml-1"
                    style={{ backgroundColor: styles.textPrimary, color: styles.bgPrimary }}
                  >
                    {selectedSuppliers.length}
                  </span>
                )}
              </Button>
              <Button variant="secondary">
                <UploadSimple size={14} className="mr-1.5" />
                Import
              </Button>
              <Button variant="primary">
                <Plus size={14} weight="bold" className="mr-1.5" />
                Add Supplier
              </Button>
            </div>
          }
        />

        {/* Clean Filter Bar - Simplified */}
        <div
          className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 mb-6"
          style={{
            backgroundColor: styles.bgPrimary,
            borderBottom: `1px solid ${styles.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            {/* Search - Primary */}
            <div
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg flex-1 max-w-sm"
              style={{
                backgroundColor: styles.bgCard,
                border: `1px solid ${styles.border}`,
              }}
            >
              <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-sm"
                style={{ color: styles.textPrimary }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ color: styles.textMuted }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6" style={{ backgroundColor: styles.border }} />

            {/* Essential Filters - Clean Pills */}
            <div className="flex items-center gap-2">
              <FilterDropdown
                label="Risk Level"
                options={[
                  { value: 'low', label: 'Low Risk' },
                  { value: 'medium', label: 'Medium Risk' },
                  { value: 'high', label: 'High Risk' },
                  { value: 'critical', label: 'Critical' },
                ]}
                selected={riskFilter}
                onChange={setRiskFilter}
              />
              <FilterDropdown
                label="Status"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'on_hold', label: 'On Hold' },
                ]}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
              <FilterDropdown
                label="Tier"
                options={[
                  { value: 'strategic', label: 'Strategic' },
                  { value: 'preferred', label: 'Preferred' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'conditional', label: 'Conditional' },
                ]}
                selected={tierFilter}
                onChange={setTierFilter}
              />
            </div>

            {/* More Filters (collapsed) */}
            {(categories.length > 0 || regions.length > 0) && (
              <>
                <div className="w-px h-6" style={{ backgroundColor: styles.border }} />
                <div className="flex items-center gap-2">
                  <FilterDropdown
                    label="Category"
                    options={categories.map((c) => ({ value: c, label: c }))}
                    selected={categoryFilter}
                    onChange={setCategoryFilter}
                  />
                  <FilterDropdown
                    label="Region"
                    options={regions.map((r) => ({ value: r, label: r }))}
                    selected={regionFilter}
                    onChange={setRegionFilter}
                  />
                </div>
              </>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort */}
            <SortDropdown value={sortPreset} onChange={setSortPreset} />

            {/* Reset - Only when filters active */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowCounterClockwise size={12} />
                Clear all
              </button>
            )}
          </div>

          {/* Active Filter Chips - Minimal */}
          {filterChips.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-2.5">
              {filterChips.map((chip) => (
                <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left: Table/Cards */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: styles.border, borderTopColor: styles.textMuted }}
                />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <EmptyState
                icon={Buildings}
                title="No suppliers found"
                description={
                  activeFilterCount > 0 || searchQuery
                    ? 'Try adjusting your filters or search query'
                    : 'Add your first supplier to get started'
                }
                action={
                  activeFilterCount > 0 || searchQuery ? (
                    <Button variant="secondary" onClick={resetFilters}>
                      <ArrowCounterClockwise size={14} className="mr-2" />
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : viewMode === 'table' ? (
              <SupplierTable
                suppliers={paginatedSuppliers}
                selectedSuppliers={selectedSuppliers}
                onSelectionChange={setSelectedSuppliers}
                onSupplierClick={setSelectedSupplier}
                selectedSupplier={selectedSupplier}
                sortConfig={sortConfig}
                onSort={handleSort}
                density={density}
                onRequestQuote={() => {}}
                onMessage={() => {}}
                onShortlist={handleShortlist}
                shortlistedIds={shortlistedIds}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginatedSuppliers.map((supplier) => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    isSelected={selectedSuppliers.includes(supplier.id)}
                    isActive={selectedSupplier?.id === supplier.id}
                    isShortlisted={shortlistedIds.includes(supplier.id)}
                    onSelect={() =>
                      setSelectedSuppliers((prev) =>
                        prev.includes(supplier.id) ? prev.filter((id) => id !== supplier.id) : [...prev, supplier.id],
                      )
                    }
                    onClick={() => setSelectedSupplier(supplier)}
                    onViewOrders={() => onNavigate('orders', { supplierId: supplier.id })}
                    onViewRFQs={() => onNavigate('my-rfqs', { supplierId: supplier.id })}
                    onShortlist={() => handleShortlist(supplier)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredSuppliers.length > 0 && (
              <div
                className="flex items-center justify-between mt-6 pt-4"
                style={{ borderTop: `1px solid ${styles.border}` }}
              >
                <span className="text-sm" style={{ color: styles.textSecondary }}>
                  Showing{' '}
                  <span className="font-medium" style={{ color: styles.textPrimary }}>
                    {(currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium" style={{ color: styles.textPrimary }}>
                    {Math.min(currentPage * pageSize, filteredSuppliers.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium" style={{ color: styles.textPrimary }}>
                    {filteredSuppliers.length}
                  </span>{' '}
                  suppliers
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                    style={{
                      backgroundColor: styles.bgCard,
                      border: `1px solid ${styles.border}`,
                      color: styles.textSecondary,
                    }}
                  >
                    <CaretLeft size={14} />
                    Previous
                  </button>
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 rounded-md text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: currentPage === pageNum ? styles.textPrimary : styles.bgCard,
                            color: currentPage === pageNum ? styles.bgPrimary : styles.textMuted,
                            border: currentPage === pageNum ? 'none' : `1px solid ${styles.border}`,
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                    style={{
                      backgroundColor: styles.bgCard,
                      border: `1px solid ${styles.border}`,
                      color: styles.textSecondary,
                    }}
                  >
                    Next
                    <CaretRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Details Panel */}
          {selectedSupplier && !isPanelDrawer && (
            <div className="w-80 flex-shrink-0">
              <SupplierDetailsPanel
                supplier={selectedSupplier}
                onClose={() => setSelectedSupplier(null)}
                onRequestQuote={() => {}}
                onMessage={() => {}}
                onShortlist={() => handleShortlist(selectedSupplier)}
                onOpenProfile={() => {}}
                isShortlisted={shortlistedIds.includes(selectedSupplier.id)}
              />
            </div>
          )}
        </div>

        {/* Mobile Drawer for Details Panel - Clean Design */}
        {selectedSupplier && isPanelDrawer && (
          <>
            {/* Transparent click-outside backdrop */}
            <div className="fixed inset-0 z-40" style={{ top: '64px' }} onClick={() => setSelectedSupplier(null)} />
            <div
              className="fixed z-50 w-full max-w-md flex flex-col"
              style={{
                top: '64px',
                bottom: 0,
                right: 0,
                backgroundColor: styles.bgCard,
                borderLeft: `1px solid ${styles.border}`,
                boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.1)',
              }}
            >
              <SupplierDetailsPanel
                supplier={selectedSupplier}
                onClose={() => setSelectedSupplier(null)}
                onRequestQuote={() => {}}
                onMessage={() => {}}
                onShortlist={() => handleShortlist(selectedSupplier)}
                onOpenProfile={() => {}}
                isShortlisted={shortlistedIds.includes(selectedSupplier.id)}
                isDrawer
              />
            </div>
          </>
        )}

        {/* Compare Modal */}
        <SupplierCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          suppliers={suppliersToCompare}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />
      </Container>
    </div>
  );
};

export default BuyerSuppliers;
