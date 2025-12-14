
import React from 'react';
import { MoreHorizontal, Star, Copy, FileIcon, Key, CreditCard, StickyNote } from 'lucide-react';
import { VaultItem } from '../types';

interface VaultListProps {
    items: VaultItem[];
    onItemClick: (item: VaultItem) => void;
}

const getItemIcon = (type: string) => {
    switch (type) {
        case 'login': return <Key size={16} />;
        case 'card': return <CreditCard size={16} />;
        case 'note': return <StickyNote size={16} />;
        case 'document': return <FileIcon size={16} />;
        default: return <FileIcon size={16} />;
    }
};

export const VaultList: React.FC<VaultListProps> = ({ items, onItemClick }) => {
    return (
        <div className="bg-white dark:bg-monday-dark-surface rounded-lg border border-gray-200 dark:border-monday-dark-border mx-6 my-6 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-monday-dark-bg border-b border-gray-200 dark:border-monday-dark-border">
                    <tr>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Modified</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-monday-dark-border">
                    {items.map(item => (
                        <tr
                            key={item.id}
                            onClick={() => onItemClick(item)}
                            className="hover:bg-blue-50 dark:hover:bg-monday-dark-hover cursor-pointer group transition-colors"
                        >
                            <td className="py-3 px-4 text-center">
                                <span
                                    className="inline-flex w-8 h-8 items-center justify-center rounded-md text-white shadow-sm"
                                    style={{ backgroundColor: item.color || '#ccc' }}
                                >
                                    {getItemIcon(item.type)}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{item.title}</div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                                {item.subtitle || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                                {item.lastModified}
                            </td>
                            <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.isFavorite && <Star size={16} className="text-yellow-400 fill-current" />}
                                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
