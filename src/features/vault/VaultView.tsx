
import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, List as ListIcon, SlidersHorizontal } from 'lucide-react';
import { VaultSidebar } from './components/VaultSidebar';
import { VaultGrid } from './components/VaultGrid';
import { VaultList } from './components/VaultList';
import { VaultEmptyState } from './components/VaultEmptyState';
import { MOCK_VAULT_ITEMS, VaultItem } from './types';

export const VaultView: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

    const filteredItems = useMemo(() => {
        return MOCK_VAULT_ITEMS.filter(item => {
            // 1. Filter by category
            if (activeCategory !== 'all') {
                if (activeCategory === 'favorites') {
                    if (!item.isFavorite) return false;
                } else if (activeCategory === 'trash') {
                    // In a real app we'd have a deletedAt field, here we just simulate empty or define mock logic
                    return false; // Mock data doesn't have trash items
                } else if (item.type !== activeCategory) {
                    return false;
                }
            }

            // 2. Filter by search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    item.title.toLowerCase().includes(q) ||
                    (item.subtitle && item.subtitle.toLowerCase().includes(q))
                );
            }

            return true;
        });
    }, [activeCategory, searchQuery]);

    const handleItemClick = (item: VaultItem) => {
        console.log('Clicked item:', item);
        setSelectedItem(item);
        // Future: Open detail modal
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-monday-dark-bg font-sans text-gray-800 overflow-hidden">
            {/* Sidebar */}
            <VaultSidebar
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                className="flex-shrink-0 z-10"
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#FCFCFD] dark:bg-monday-dark-bg">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {activeCategory === 'all' ? 'All Items' :
                                activeCategory === 'favorites' ? 'Favorites' :
                                    activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) + 's'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {filteredItems.length} items
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search vault..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-monday-dark-hover border-none rounded-md text-sm focus:ring-2 focus:ring-monday-blue focus:outline-none w-64"
                            />
                        </div>

                        <div className="flex items-center bg-gray-100 dark:bg-monday-dark-hover rounded-md p-1 border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-monday-blue' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-monday-blue' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>

                        <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-md">
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                        // Determine which empty state to show
                        searchQuery ? (
                            <VaultEmptyState
                                type="active-search"
                                searchQuery={searchQuery}
                                onClearSearch={() => setSearchQuery('')}
                            />
                        ) : activeCategory !== 'all' ? (
                            <VaultEmptyState
                                type="empty-category"
                                category={activeCategory}
                                onCreateItem={() => console.log('Create new item in', activeCategory)}
                            />
                        ) : (
                            <VaultEmptyState
                                type="empty-vault"
                                onCreateItem={(type) => console.log('Create new item', type)}
                            />
                        )
                    ) : (
                        viewMode === 'grid'
                            ? <VaultGrid items={filteredItems} onItemClick={handleItemClick} />
                            : <VaultList items={filteredItems} onItemClick={handleItemClick} />
                    )}
                </div>
            </div>
        </div>
    );
};
