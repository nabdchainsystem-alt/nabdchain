
import React from 'react';
import { MoreHorizontal, Star, Copy, ExternalLink, Eye } from 'lucide-react';
import { VaultItem } from '../types';

interface VaultGridProps {
    items: VaultItem[];
    onItemClick: (item: VaultItem) => void;
}

export const VaultGrid: React.FC<VaultGridProps> = ({ items, onItemClick }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {items.map(item => (
                <div
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="group bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all hover:border-monday-blue"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                            style={{ backgroundColor: item.color || '#ccc' }}
                        >
                            {item.title.charAt(0).toUpperCase()}
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>

                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate mb-1" title={item.title}>{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-4">{item.subtitle || 'No details'}</p>

                    <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-3 border-t border-gray-100 dark:border-monday-dark-border">
                        <span>{item.lastModified}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.type === 'login' && <Copy size={14} className="hover:text-monday-blue" title="Copy Password" />}
                            {item.type === 'note' && <Eye size={14} className="hover:text-monday-blue" title="View" />}
                            {item.isFavorite && <Star size={14} className="text-yellow-400 fill-current" />}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
