import React from 'react';
import { usePortal } from '../context/PortalContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * Button Component
 *
 * Minimal, premium styling - adapts to dark/light mode
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const { styles } = usePortal();

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: {
      backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
      color: styles.isDark ? '#0F1115' : '#E6E8EB',
      border: 'none',
    },
    secondary: {
      backgroundColor: styles.bgCard,
      color: styles.textPrimary,
      border: `1px solid ${styles.border}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: styles.textSecondary,
      border: 'none',
    },
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} hover:opacity-80 disabled:opacity-50 ${className}`}
      style={{
        fontFamily: styles.fontBody,
        ...variantStyles[variant],
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
