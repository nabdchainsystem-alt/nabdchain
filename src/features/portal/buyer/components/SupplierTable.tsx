import React, { useState } from 'react';
import {
  Buildings,
  CaretUp,
  CaretDown,
  DotsThreeVertical,
  ArrowSquareOut,
  Star,
  ChatCircle,
  FileText,
  Check,
  TrendUp,
  TrendDown,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { Supplier, SupplierSortField, SupplierSortConfig } from '../../types/supplier.types';
import {
  getRiskLevelConfig,
  getSupplierStatusConfig,
  formatDeliveryDeviation,
  formatResponseTime,
} from '../../types/supplier.types';

// Country flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  Germany: '🇩🇪',
  China: '🇨🇳',
  Japan: '🇯🇵',
  'United Kingdom': '🇬🇧',
  India: '🇮🇳',
  'South Korea': '🇰🇷',
  Italy: '🇮🇹',
  France: '🇫🇷',
  Canada: '🇨🇦',
  Brazil: '🇧🇷',
  Mexico: '🇲🇽',
  Spain: '🇪🇸',
  Australia: '🇦🇺',
  Netherlands: '🇳🇱',
};

interface SupplierTableProps {
  suppliers: Supplier[];
  selectedSuppliers: string[];
  onSelectionChange: (ids: string[]) => void;
  onSupplierClick: (supplier: Supplier) => void;
  selectedSupplier?: Supplier | null;
  sortConfig: SupplierSortConfig;
  onSort: (field: SupplierSortField) => void;
  density?: 'comfortable' | 'compact';
  onRequestQuote?: (supplier: Supplier) => void;
  onMessage?: (supplier: Supplier) => void;
  onShortlist?: (supplier: Supplier) => void;
  shortlistedIds?: string[];
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  selectedSuppliers,
  onSelectionChange,
  onSupplierClick,
  selectedSupplier,
  sortConfig,
  onSort,
  density = 'comfortable',
  onRequestQuote,
  onMessage,
  onShortlist,
  shortlistedIds = [],
}) => {
  const { styles } = usePortal();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const isCompact = density === 'compact';
  const rowPadding = isCompact ? 'py-2' : 'py-3';
  const cellPadding = isCompact ? 'px-3' : 'px-4';

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(suppliers.map((s) => s.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSuppliers, id]);
    } else {
      onSelectionChange(selectedSuppliers.filter((sid) => sid !== id));
    }
  };

  const allSelected = suppliers.length > 0 && selectedSuppliers.length === suppliers.length;
  const someSelected = selectedSuppliers.length > 0 && selectedSuppliers.length < suppliers.length;

  const SortIcon = ({ field }: { field: SupplierSortField }) => {
    if (sortConfig.field !== field) {
      return (
        <span className="opacity-0 group-hover:opacity-30">
          <CaretDown size={12} />
        </span>
      );
    }
    return sortConfig.direction === 'desc' ? (
      <CaretDown size={12} weight="bold" />
    ) : (
      <CaretUp size={12} weight="bold" />
    );
  };

  const HeaderCell: React.FC<{
    field?: SupplierSortField;
    children: React.ReactNode;
    className?: string;
    sortable?: boolean;
  }> = ({ field, children, className = '', sortable = true }) => {
    const isSorted = field && sortConfig.field === field;
    return (
      <th
        className={`${cellPadding} ${rowPadding} text-left text-xs font-medium tracking-wide uppercase group ${
          sortable && field ? 'cursor-pointer select-none' : ''
        } ${className}`}
        style={{
          color: isSorted ? styles.textPrimary : styles.textMuted,
          backgroundColor: styles.bgSecondary,
        }}
        onClick={() => sortable && field && onSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {sortable && field && <SortIcon field={field} />}
        </div>
      </th>
    );
  };

  // Risk chip colors
  const getRiskChipStyle = (level: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = getRiskLevelConfig(level as any);
    const colorMap = {
      success: { bg: `${styles.success}15`, color: styles.success },
      warning: { bg: `${styles.warning}15`, color: styles.warning },
      error: { bg: `${styles.error}15`, color: styles.error },
      info: { bg: `${styles.info}15`, color: styles.info },
    };
    return colorMap[config.color] || colorMap.info;
  };

  // Status chip colors
  const getStatusChipStyle = (status: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = getSupplierStatusConfig(status as any);
    if (config.canOrder) {
      return { bg: `${styles.success}15`, color: styles.success };
    }
    return { bg: styles.bgSecondary, color: styles.textMuted };
  };

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: `1px solid ${styles.border}` }}>
            {/* Checkbox */}
            <th className={`${cellPadding} ${rowPadding} w-10`} style={{ backgroundColor: styles.bgSecondary }}>
              <label className="flex items-center justify-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                  style={{
                    borderColor: allSelected || someSelected ? styles.textPrimary : styles.border,
                    backgroundColor: allSelected || someSelected ? styles.textPrimary : 'transparent',
                  }}
                >
                  {(allSelected || someSelected) && (
                    <Check size={10} weight="bold" style={{ color: styles.bgPrimary }} />
                  )}
                </div>
              </label>
            </th>

            <HeaderCell field="name">Supplier</HeaderCell>
            <HeaderCell field="reliabilityScore" className="w-20">
              Score
            </HeaderCell>
            <HeaderCell sortable={false} className="w-24">
              Risk
            </HeaderCell>
            <HeaderCell field="dependencyPercentage" className="w-28">
              Dependency
            </HeaderCell>
            <HeaderCell field="averageDeliveryDeviation" className="w-24">
              Delivery
            </HeaderCell>
            <HeaderCell field="communicationScore" className="w-24">
              Response
            </HeaderCell>
            <HeaderCell field="totalSpend" className="w-24">
              Spend
            </HeaderCell>
            <HeaderCell sortable={false} className="w-24">
              Status
            </HeaderCell>
            <HeaderCell sortable={false} className="w-16">
              Actions
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier, idx) => {
            const isSelected = selectedSuppliers.includes(supplier.id);
            const isActive = selectedSupplier?.id === supplier.id;
            const deliveryDeviation = formatDeliveryDeviation(supplier.metrics.averageDeliveryDeviation);
            const responseTime = formatResponseTime(supplier.metrics.averageResponseTimeHours);
            const riskStyle = getRiskChipStyle(supplier.riskLevel);
            const statusStyle = getStatusChipStyle(supplier.status);
            const statusConfig = getSupplierStatusConfig(supplier.status);
            const riskConfig = getRiskLevelConfig(supplier.riskLevel);
            const countryFlag = COUNTRY_FLAGS[supplier.country] || '🌍';
            const isShortlisted = shortlistedIds.includes(supplier.id);

            // Score trend (mock - in production this would come from historical data)
            const scoreTrend = supplier.reliabilityScore > 70 ? 'up' : supplier.reliabilityScore < 50 ? 'down' : null;

            return (
              <tr
                key={supplier.id}
                className="transition-colors cursor-pointer group"
                style={{
                  backgroundColor: isActive ? styles.bgHover : isSelected ? `${styles.textPrimary}08` : 'transparent',
                  borderBottom: idx < suppliers.length - 1 ? `1px solid ${styles.border}` : 'none',
                }}
                onClick={() => onSupplierClick(supplier)}
                onMouseEnter={(e) => {
                  if (!isActive && !isSelected) {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {/* Checkbox */}
                <td className={`${cellPadding} ${rowPadding}`} onClick={(e) => e.stopPropagation()}>
                  <label className="flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(supplier.id, e.target.checked)}
                      className="sr-only"
                    />
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
                </td>

                {/* Supplier Name + ID + Country */}
                <td className={`${cellPadding} ${rowPadding}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <Buildings size={14} style={{ color: styles.textSecondary }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate" style={{ color: styles.textPrimary }}>
                          {supplier.name}
                        </span>
                        {isShortlisted && <Star size={12} weight="fill" style={{ color: styles.warning }} />}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: styles.textMuted }}>
                        <span>{supplier.code}</span>
                        <span>·</span>
                        <span>{countryFlag}</span>
                        <span className="truncate">{supplier.country}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Score with trend */}
                <td className={`${cellPadding} ${rowPadding}`}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        backgroundColor:
                          supplier.reliabilityScore >= 75
                            ? `${styles.success}15`
                            : supplier.reliabilityScore >= 50
                              ? `${styles.warning}15`
                              : `${styles.error}15`,
                        color:
                          supplier.reliabilityScore >= 75
                            ? styles.success
                            : supplier.reliabilityScore >= 50
                              ? styles.warning
                              : styles.error,
                      }}
                    >
                      {supplier.reliabilityScore}
                    </div>
                    {scoreTrend && (
                      <span style={{ color: scoreTrend === 'up' ? styles.success : styles.error }}>
                        {scoreTrend === 'up' ? <TrendUp size={10} /> : <TrendDown size={10} />}
                      </span>
                    )}
                  </div>
                </td>

                {/* Risk */}
                <td className={`${cellPadding} ${rowPadding}`}>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: riskStyle.bg,
                      color: riskStyle.color,
                    }}
                  >
                    {riskConfig.label.replace(' Risk', '')}
                  </span>
                </td>

                {/* Dependency % with mini bar */}
                <td className={`${cellPadding} ${rowPadding}`}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(supplier.metrics.dependencyPercentage, 100)}%`,
                          backgroundColor:
                            supplier.metrics.dependencyPercentage > 60
                              ? styles.error
                              : supplier.metrics.dependencyPercentage > 30
                                ? styles.warning
                                : styles.success,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: styles.textPrimary }}>
                      {supplier.metrics.dependencyPercentage.toFixed(0)}%
                    </span>
                  </div>
                </td>

                {/* Delivery */}
                <td className={`${cellPadding} ${rowPadding}`}>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: deliveryDeviation.isPositive ? styles.success : styles.warning,
                    }}
                  >
                    {deliveryDeviation.label}
                  </span>
                </td>

                {/* Response Time */}
                <td className={`${cellPadding} ${rowPadding}`}>
                  <span className="text-xs" style={{ color: styles.textPrimary }}>
                    {responseTime}
                  </span>
                </td>

                {/* Spend */}
                <td className={`${cellPadding} ${rowPadding}`}>
                  <span className="text-xs font-medium" style={{ color: styles.textPrimary }}>
                    ${(supplier.metrics.totalSpend / 1000).toFixed(0)}K
                  </span>
                </td>

                {/* Status */}
                <td className={`${cellPadding} ${rowPadding}`}>
                  <span
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </td>

                {/* Actions */}
                <td className={`${cellPadding} ${rowPadding}`} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSupplierClick(supplier)}
                      className="p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                      style={{ color: styles.textMuted }}
                      title="Open details"
                    >
                      <ArrowSquareOut size={14} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === supplier.id ? null : supplier.id)}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: styles.textMuted }}
                      >
                        <DotsThreeVertical size={14} weight="bold" />
                      </button>
                      {menuOpen === supplier.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div
                            className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg shadow-lg border py-1"
                            style={{
                              backgroundColor: styles.bgCard,
                              borderColor: styles.border,
                            }}
                          >
                            <button
                              onClick={() => {
                                onRequestQuote?.(supplier);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                              style={{ color: styles.textSecondary }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = styles.bgHover;
                                e.currentTarget.style.color = styles.textPrimary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = styles.textSecondary;
                              }}
                            >
                              <FileText size={12} />
                              Request Quote
                            </button>
                            <button
                              onClick={() => {
                                onMessage?.(supplier);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                              style={{ color: styles.textSecondary }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = styles.bgHover;
                                e.currentTarget.style.color = styles.textPrimary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = styles.textSecondary;
                              }}
                            >
                              <ChatCircle size={12} />
                              Message
                            </button>
                            <button
                              onClick={() => {
                                onShortlist?.(supplier);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                              style={{ color: isShortlisted ? styles.warning : styles.textSecondary }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = styles.bgHover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <Star size={12} weight={isShortlisted ? 'fill' : 'regular'} />
                              {isShortlisted ? 'Remove Shortlist' : 'Shortlist'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierTable;
