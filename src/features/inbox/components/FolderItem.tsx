import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface FolderItemProps {
    label: string;
    hasChildren?: boolean;
    indent?: boolean;
    onClick?: () => void;
    isActive?: boolean;
}

/**
 * Folder list item for email folder navigation
 * Supports indentation for nested folders and expand indicator
 */
export const FolderItem: React.FC<FolderItemProps> = ({
    label,
    hasChildren,
    indent,
    onClick,
    isActive,
}) => (
    <div
        onClick={onClick}
        className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm
            ${indent ? 'ps-8' : ''}
            ${isActive
                ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-monday-dark-hover'
            }
        `}
    >
        {hasChildren && <ChevronDown size={14} className="text-gray-400" />}
        {!hasChildren && <div className="w-3"></div>}
        <span>{label}</span>
    </div>
);

export default FolderItem;
