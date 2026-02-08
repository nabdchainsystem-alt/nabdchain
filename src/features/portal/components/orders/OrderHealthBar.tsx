// =============================================================================
// Order Health Bar - Compact horizontal health summary
// =============================================================================

import React from 'react';
import { Heartbeat, ShieldCheck, Clock, Warning, WarningCircle, Lightning, ListChecks } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { OrderRole, OrderStats, HealthFilterOption } from './orders.types';

interface OrderHealthBarProps {
  role: OrderRole;
  stats: OrderStats;
  healthFilter: HealthFilterOption;
  onHealthFilterChange: (h: HealthFilterOption) => void;
}

interface HealthPill {
  key: HealthFilterOption;
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
  highlight?: boolean;
}

export const OrderHealthBar: React.FC<OrderHealthBarProps> = ({ role, stats, healthFilter, onHealthFilterChange }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const actionKey: HealthFilterOption = role === 'seller' ? 'needs_action' : 'needs_attention';
  const actionLabel = role === 'seller' ? 'Needs Action' : 'Needs Attention';

  const pills: HealthPill[] = [
    {
      key: actionKey,
      label: actionLabel,
      value: stats.needsAction,
      color: styles.error,
      icon: ListChecks,
      highlight: stats.needsAction > 0,
    },
    { key: 'on_track', label: 'On Track', value: stats.onTrack, color: styles.success, icon: ShieldCheck },
    { key: 'at_risk', label: 'At Risk', value: stats.atRisk, color: styles.warning, icon: Clock },
    { key: 'delayed', label: 'Delayed', value: stats.delayed, color: '#F59E0B', icon: Warning },
    { key: 'critical', label: 'Critical', value: stats.critical, color: styles.error, icon: WarningCircle },
  ];

  return (
    <div
      className="rounded-xl border px-4 py-3 mb-4"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <div className={`flex items-center gap-4 overflow-x-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
        {/* Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Heartbeat size={16} weight="duotone" style={{ color: styles.textPrimary }} />
          <span className="text-xs font-semibold" style={{ color: styles.textPrimary }}>
            Order Health
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: styles.border }} />

        {/* Pills */}
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {pills.map((pill) => {
            const isActive = healthFilter === pill.key;
            const Icon = pill.icon;

            return (
              <button
                key={pill.key}
                onClick={() => onHealthFilterChange(isActive ? '' : pill.key)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: isActive ? `${pill.color}18` : 'transparent',
                  color: isActive ? pill.color : styles.textMuted,
                  border: isActive ? `1px solid ${pill.color}30` : '1px solid transparent',
                }}
              >
                {pill.highlight && !isActive && (
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: pill.color }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-1.5 w-1.5"
                      style={{ backgroundColor: pill.color }}
                    />
                  </span>
                )}
                <Icon size={13} weight={isActive ? 'bold' : 'regular'} />
                <span>{pill.label}</span>
                <span className="font-bold" style={{ color: pill.value > 0 ? pill.color : styles.textMuted }}>
                  {pill.value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Exception badge (seller only) */}
        {role === 'seller' && stats.withExceptions > 0 && (
          <>
            <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: styles.border }} />
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium flex-shrink-0"
              style={{ backgroundColor: `${styles.error}12`, color: styles.error }}
            >
              <Lightning size={11} weight="fill" />
              {stats.withExceptions} Exceptions
            </span>
          </>
        )}
      </div>
    </div>
  );
};
