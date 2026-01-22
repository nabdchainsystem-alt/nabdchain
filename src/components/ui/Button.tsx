import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-black text-white hover:bg-gray-800 shadow-sm dark:bg-white dark:text-black dark:hover:bg-gray-200',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-stone-800 dark:text-gray-200 dark:border-stone-700 dark:hover:bg-stone-700',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-stone-800 dark:hover:text-gray-200',
    icon: 'bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-stone-800 dark:hover:text-gray-300 p-1 rounded',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2.5',
};

/**
 * Reusable Button component with multiple variants and sizes
 *
 * @example
 * // Primary button
 * <Button variant="primary">Save</Button>
 *
 * @example
 * // Icon button
 * <Button variant="icon"><TrashIcon /></Button>
 *
 * @example
 * // With loading state
 * <Button isLoading>Saving...</Button>
 */
export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyle = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
    const appliedSize = variant === 'icon' ? '' : sizeStyles[size];

    return (
        <button
            className={`${baseStyle} ${variantStyles[variant]} ${appliedSize} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : leftIcon ? (
                <span>{leftIcon}</span>
            ) : null}
            {children}
            {rightIcon && <span>{rightIcon}</span>}
        </button>
    );
};

export default Button;
