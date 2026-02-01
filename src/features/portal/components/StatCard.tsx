import React from 'react';
import { IconProps } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<IconProps>;
  change?: {
    value: string;
    positive?: boolean;
  };
}

/**
 * Stat Card Component
 *
 * Minimal KPI display for dashboards
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  change,
}) => {
  const { styles } = usePortal();

  return (
    <div
      className="p-5 rounded-lg border transition-colors"
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgCard,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: styles.textMuted }}
          >
            {label}
          </p>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{
              color: styles.textPrimary,
              fontFamily: styles.fontHeading,
            }}
          >
            {value}
          </p>
          {change && (
            <p
              className="mt-1 text-xs font-medium"
              style={{ color: change.positive ? styles.success : styles.textMuted }}
            >
              {change.value}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <Icon size={20} weight="light" style={{ color: styles.textMuted }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
