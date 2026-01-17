import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface MenuItemProps {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    hasSubmenu?: boolean;
    onClick?: () => void;
}

/**
 * Context menu item for task card menus
 * Displays icon, label, and optional submenu indicator
 */
export const MenuItem: React.FC<MenuItemProps> = ({
    icon: Icon,
    label,
    hasSubmenu = false,
    onClick,
}) => (
    <button
        onClick={onClick}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between text-sm text-gray-700 group"
    >
        <div className="flex items-center gap-3">
            <Icon size={16} className="text-gray-400 group-hover:text-gray-600" />
            <span>{label}</span>
        </div>
        {hasSubmenu && <ChevronRight size={14} className="text-gray-400" />}
    </button>
);

export default MenuItem;
