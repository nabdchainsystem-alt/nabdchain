import React from 'react';

export interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    count?: number;
    onClick?: () => void;
}

/**
 * Navigation sidebar item for inbox/email navigation
 * Used for folders like Inbox, Sent, Drafts, etc.
 */
export const NavItem: React.FC<NavItemProps> = ({
    icon,
    label,
    isActive,
    count,
    onClick,
}) => (
    <div
        onClick={onClick}
        className={`
            flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group transition-colors text-sm font-medium
            ${isActive
                ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-monday-dark-hover'
            }
        `}
    >
        <div className="flex items-center gap-3">
            <span className={isActive ? 'text-inherit' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}>
                {icon}
            </span>
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className={`text-[10px] font-semibold ${isActive ? 'text-monday-blue' : 'text-gray-500 dark:text-gray-400'}`}>
                    {count}
                </span>
            )}
        </div>
    </div>
);

export default NavItem;
