import React from 'react';

export interface PlusIconProps {
    size?: number;
    className?: string;
}

/**
 * Simple plus icon SVG component
 * Used for add/create actions
 */
export const PlusIcon: React.FC<PlusIconProps> = ({
    size = 10,
    className = '',
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 ${className}`}
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export default PlusIcon;
