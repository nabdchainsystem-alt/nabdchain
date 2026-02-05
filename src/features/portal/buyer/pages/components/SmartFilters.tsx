// =============================================================================
// Smart Filters Component
// Chip-based filters for risk, urgency, and savings
// =============================================================================

import React from 'react';
import {
  Funnel,
  MagnifyingGlass,
  X,
  Warning,
  Lightning,
  CurrencyDollar,
  CheckCircle,
  Clock,
  WarningCircle,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import { Select } from '../../../components';
import {
  SmartFilters as SmartFiltersType,
  UrgencyLevel,
  SavingsCategory,
  getUrgencyColor,
  getSavingsColor,
} from '../../../types/purchase.types';
import { OrderHealthStatus } from '../../../types/order.types';

interface SmartFiltersProps {
  filters: SmartFiltersType;
  onFiltersChange: (filters: SmartFiltersType) => void;
  statusOptions: { value: string; label: string }[];
}

interface FilterChip {
  id: string;
  label: string;
  value: string;
  color: string;
  icon?: React.ElementType;
}

export const SmartFilters: React.FC<SmartFiltersProps> = ({
  filters,
  onFiltersChange,
  statusOptions,
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // Risk filter chips
  const riskChips: FilterChip[] = [
    { id: 'on_track', label: t('buyer.purchases.onTrack') || 'On Track', value: 'on_track', color: styles.success, icon: CheckCircle },
    { id: 'at_risk', label: t('buyer.purchases.atRisk') || 'At Risk', value: 'at_risk', color: '#f59e0b', icon: Warning },
    { id: 'delayed', label: t('buyer.purchases.delayed') || 'Delayed', value: 'delayed', color: '#f97316', icon: Clock },
    { id: 'critical', label: t('buyer.purchases.critical') || 'Critical', value: 'critical', color: styles.error, icon: WarningCircle },
  ];

  // Urgency filter chips
  const urgencyChips: FilterChip[] = [
    { id: 'low', label: t('buyer.purchases.urgencyLow') || 'Low', value: 'low', color: styles.success },
    { id: 'medium', label: t('buyer.purchases.urgencyMedium') || 'Medium', value: 'medium', color: styles.info },
    { id: 'high', label: t('buyer.purchases.urgencyHigh') || 'High', value: 'high', color: '#f59e0b' },
    { id: 'critical', label: t('buyer.purchases.urgencyCritical') || 'Critical', value: 'critical', color: styles.error },
  ];

  // Savings filter chips
  const savingsChips: FilterChip[] = [
    { id: 'good_deal', label: t('buyer.purchases.goodDeal') || 'Good Deal', value: 'good_deal', color: styles.success },
    { id: 'average', label: t('buyer.purchases.average') || 'Average', value: 'average', color: styles.textMuted },
    { id: 'overpaying', label: t('buyer.purchases.overpaying') || 'Overpaying', value: 'overpaying', color: styles.error },
  ];

  const handleRiskChange = (value: OrderHealthStatus | 'all') => {
    onFiltersChange({ ...filters, risk: value === filters.risk ? 'all' : value });
  };

  const handleUrgencyChange = (value: UrgencyLevel | 'all') => {
    onFiltersChange({ ...filters, urgency: value === filters.urgency ? 'all' : value });
  };

  const handleSavingsChange = (value: SavingsCategory | 'all') => {
    onFiltersChange({ ...filters, savings: value === filters.savings ? 'all' : value });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as SmartFiltersType['status'] });
  };

  const clearFilters = () => {
    onFiltersChange({
      risk: 'all',
      urgency: 'all',
      savings: 'all',
      status: 'all',
      search: '',
    });
  };

  const hasActiveFilters =
    filters.risk !== 'all' ||
    filters.urgency !== 'all' ||
    filters.savings !== 'all' ||
    filters.status !== 'all' ||
    filters.search !== '';

  const renderChipGroup = (
    label: string,
    chips: FilterChip[],
    activeValue: string,
    onChange: (value: string) => void,
    icon: React.ElementType
  ) => {
    const Icon = icon;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: styles.textMuted }}
        >
          <Icon size={12} />
          {label}:
        </span>
        {chips.map((chip) => {
          const isActive = activeValue === chip.value;
          const ChipIcon = chip.icon;
          return (
            <button
              key={chip.id}
              onClick={() => onChange(chip.value)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                transition-all border
              `}
              style={{
                backgroundColor: isActive ? `${chip.color}20` : 'transparent',
                borderColor: isActive ? chip.color : styles.border,
                color: isActive ? chip.color : styles.textMuted,
              }}
            >
              {ChipIcon && <ChipIcon size={12} weight={isActive ? 'fill' : 'regular'} />}
              {chip.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="p-4 rounded-lg border space-y-4"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      {/* Top row: Search + Status + Clear */}
      <div className="flex flex-wrap items-center gap-3">
        <Funnel size={18} style={{ color: styles.textMuted }} />

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-1 min-w-[200px] max-w-[300px]"
          style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
        >
          <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
          <input
            type="text"
            placeholder={t('buyer.purchases.searchPlaceholder') || 'Search orders...'}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: styles.textPrimary }}
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="p-0.5 rounded hover:bg-opacity-10"
              style={{ color: styles.textMuted }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status dropdown */}
        <Select
          value={filters.status}
          onChange={handleStatusChange}
          options={statusOptions}
        />

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={14} />
            {t('common.clearFilters') || 'Clear filters'}
          </button>
        )}
      </div>

      {/* Filter chips rows */}
      <div className="space-y-3 pt-2 border-t" style={{ borderColor: styles.border }}>
        {/* Risk filters */}
        {renderChipGroup(
          t('buyer.purchases.risk') || 'Risk',
          riskChips,
          filters.risk,
          handleRiskChange as (value: string) => void,
          Warning
        )}

        {/* Urgency filters */}
        {renderChipGroup(
          t('buyer.purchases.urgency') || 'Urgency',
          urgencyChips,
          filters.urgency,
          handleUrgencyChange as (value: string) => void,
          Lightning
        )}

        {/* Savings filters */}
        {renderChipGroup(
          t('buyer.purchases.savings') || 'Savings',
          savingsChips,
          filters.savings,
          handleSavingsChange as (value: string) => void,
          CurrencyDollar
        )}
      </div>
    </div>
  );
};

export default SmartFilters;
