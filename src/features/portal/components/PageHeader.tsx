import React from 'react';
import { usePortal } from '../context/PortalContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Page Header Component
 *
 * Used for page titles with optional subtitle and action buttons - supports dark/light mode
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => {
  const { styles } = usePortal();

  return (
    <div className="flex items-start justify-between py-8">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{
            color: styles.textPrimary,
            fontFamily: styles.fontHeading,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-1 text-sm"
            style={{ color: styles.textSecondary }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
