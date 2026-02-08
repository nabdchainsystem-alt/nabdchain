// =============================================================================
// Order UI Components
// Extracted from SellerOrders.tsx for reusability and maintainability
// =============================================================================

import React from 'react';
import { CaretDown } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';

type ThemeStyles = ReturnType<typeof usePortal>['styles'];

// =============================================================================
// Quick Filter Tab
// =============================================================================

export interface QuickFilterTabProps {
  label: string;
  value: number;
  color?: string;
  styles: ThemeStyles;
  highlight?: boolean;
  isActive?: boolean;
  onClick: () => void;
}

export const QuickFilterTab: React.FC<QuickFilterTabProps> = ({
  label,
  value,
  color,
  styles,
  highlight,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 transition-colors"
    style={{ opacity: isActive ? 1 : 0.7 }}
  >
    <span
      className="text-sm"
      style={{
        color: isActive ? color || styles.textPrimary : styles.textMuted,
        fontWeight: isActive ? 600 : 400,
      }}
    >
      {label}:
    </span>
    <span
      className={`text-sm font-semibold ${highlight ? 'flex items-center gap-1' : ''}`}
      style={{ color: color || styles.textPrimary }}
    >
      {highlight && (
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: color }}
          />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
        </span>
      )}
      {value}
    </span>
  </button>
);

// =============================================================================
// Filter Dropdown
// =============================================================================

export interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
  styles: ThemeStyles;
  isRtl?: boolean;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ value, onChange, options, icon, styles, isRtl }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none h-9 text-sm rounded-lg border outline-none cursor-pointer ${
        isRtl ? 'pl-8 pr-3 text-right' : 'pl-3 pr-8'
      }`}
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgPrimary,
        color: value ? styles.textPrimary : styles.textMuted,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <div
      className={`absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 ${
        isRtl ? 'left-2.5' : 'right-2.5'
      }`}
    >
      {icon}
      <CaretDown size={12} style={{ color: styles.textMuted }} />
    </div>
  </div>
);

// =============================================================================
// Menu Button
// =============================================================================

export interface MenuButtonProps {
  icon: React.ElementType;
  label: string;
  styles: ThemeStyles;
  onClick: () => void;
  danger?: boolean;
}

export const MenuButton: React.FC<MenuButtonProps> = ({ icon: Icon, label, styles, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
    style={{ color: danger ? styles.error : styles.textPrimary }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <Icon size={14} />
    {label}
  </button>
);

// =============================================================================
// Health Stat Card
// =============================================================================

export interface HealthStatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  styles: ThemeStyles;
  highlight?: boolean;
}

export const HealthStatCard: React.FC<HealthStatCardProps> = ({
  label,
  value,
  color,
  icon: Icon,
  isActive,
  onClick,
  styles,
  highlight,
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 p-2.5 rounded-lg transition-all"
    style={{
      backgroundColor: isActive ? `${color}15` : styles.bgSecondary,
      border: isActive ? `2px solid ${color}` : '2px solid transparent',
    }}
  >
    <div className="p-1.5 rounded-lg relative" style={{ backgroundColor: `${color}15` }}>
      <Icon size={16} weight={isActive ? 'fill' : 'duotone'} style={{ color }} />
      {highlight && value > 0 && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: color }}
          />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
        </span>
      )}
    </div>
    <div className="text-left">
      <p className="text-lg font-bold tabular-nums" style={{ color: styles.textPrimary }}>
        {value}
      </p>
      <p className="text-[10px] leading-tight" style={{ color: styles.textMuted }}>
        {label}
      </p>
    </div>
  </button>
);

// =============================================================================
// Exports
// =============================================================================

export default {
  QuickFilterTab,
  FilterDropdown,
  MenuButton,
  HealthStatCard,
};
