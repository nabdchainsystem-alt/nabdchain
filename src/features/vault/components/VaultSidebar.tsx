
import React from 'react';
import { Plus } from 'lucide-react';
import { MOCK_CATEGORIES } from '../types';

interface VaultSidebarProps {
    activeCategory: string;
    onSelectCategory: (id: string) => void;
    className?: string;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({ activeCategory, onSelectCategory, className = '' }) => {
    return (
        <div className={`w-64 bg-gray-50 dark:bg-monday-dark-surface border-r border-gray-200 dark:border-monday-dark-border flex flex-col p-4 ${className}`}>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 px-2 mb-4">Vault</h2>
                <button className="w-full bg-monday-blue hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm flex items-center justify-center gap-2 transition-colors">
                    <Plus size={18} />
                    <span>New Item</span>
                </button>
            </div>

            <div className="flex-1 space-y-1">
                {MOCK_CATEGORIES.map(category => {
                    const Icon = category.icon;
                    const isActive = activeCategory === category.id;

                    return (
                        <button
                            key={category.id}
                            onClick={() => onSelectCategory(category.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium
                            ${isActive
                                    ? 'bg-blue-100 dark:bg-monday-dark-hover text-monday-blue'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-monday-dark-hover'
                                }
                        `}
                        >
                            <Icon size={18} />
                            <span>{category.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-monday-dark-border">
                <div className="px-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Folders</h3>
                    {/* Placeholder for folders */}
                    <div className="text-sm text-gray-400 italic px-2">No folders yet</div>
                </div>
            </div>
        </div>
    );
};
