import React from 'react';
import { IconProps } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

interface EmptyStateProps {
  icon?: React.ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Empty State Component
 *
 * Centered content for empty pages/sections - supports dark/light mode
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  const { styles } = usePortal();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      {Icon && (
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Icon size={28} weight="light" style={{ color: styles.textMuted }} />
        </div>
      )}
      <h3
        className="text-lg font-medium"
        style={{
          color: styles.textPrimary,
          fontFamily: styles.fontHeading,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mt-2 text-sm text-center max-w-md"
          style={{ color: styles.textSecondary }}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
