import React from 'react';
import { layout } from '../../../theme/portalColors';

interface ContainerProps {
  children: React.ReactNode;
  /** Use 'content' for landing/hero sections, 'full' for dashboards/tables */
  variant?: 'content' | 'full';
  className?: string;
}

/**
 * Container Component
 *
 * - 'content': max-width (1140px) centered - for landing, hero, forms
 * - 'full': full-width with padding - for dashboards, tables
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  variant = 'content',
  className = '',
}) => {
  if (variant === 'full') {
    return (
      <div className={`w-full px-6 lg:px-8 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`w-full mx-auto px-6 ${className}`}
      style={{ maxWidth: layout.maxWidth }}
    >
      {children}
    </div>
  );
};

export default Container;
