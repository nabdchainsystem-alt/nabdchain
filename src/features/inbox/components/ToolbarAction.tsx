import React from 'react';

export interface ToolbarActionProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
}

/**
 * Toolbar button action for email view toolbar
 * Displays icon with label, supports disabled state
 */
export const ToolbarAction: React.FC<ToolbarActionProps> = ({
    icon,
    label,
    onClick,
    disabled,
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            flex flex-col items-center justify-center px-1.5 py-1 rounded
            hover:bg-gray-100 dark:hover:bg-monday-dark-hover
            text-gray-500 dark:text-gray-400
            hover:text-gray-800 dark:hover:text-gray-200
            min-w-[50px] flex-shrink-0 transition-colors gap-0.5 group h-full
            ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}
        `}
    >
        <div className="group-hover:scale-105 transition-transform">{icon}</div>
        <span className="text-[9px] font-medium whitespace-nowrap opacity-80 group-hover:opacity-100">
            {label}
        </span>
    </button>
);

export default ToolbarAction;
