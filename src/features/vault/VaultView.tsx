import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, List as ListIcon, SlidersHorizontal, Folder, ChevronRight, Plus, FileText, Globe, Upload, Image, File } from 'lucide-react';
import { VaultSidebar } from './components/VaultSidebar';
import { VaultGrid } from './components/VaultGrid';
import { VaultList } from './components/VaultList';
import { VaultEmptyState } from './components/VaultEmptyState';
import { MOCK_VAULT_ITEMS, VaultItem } from './types';
import { CreateFolderModal } from './components/CreateFolderModal';
import { CreateLinkModal } from './components/CreateLinkModal';

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const VaultView: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

    const [items, setItems] = useState<VaultItem[]>(MOCK_VAULT_ITEMS);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Breadcrumbs logic
    const breadcrumbs = useMemo(() => {
        if (!currentFolderId) return [];
        const path = [];
        let currentId: string | undefined = currentFolderId;
        while (currentId) {
            const folder = items.find(i => i.id === currentId);
            if (folder) {
                path.unshift(folder);
                currentId = folder.folderId;
            } else {
                break;
            }
        }
        return path;
    }, [currentFolderId, items]);

    const filteredItems = useMemo(() => {
        const filtered = items.filter(item => {
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

        // 3. Filter by folder structure (only if not searching and sorting by 'all' or 'folder')
        // If sorting by specific types like 'login', we might want to show all logins regardless of folder?
        // For now, let's enforce folder structure when in 'all' or 'folder' category.
        // 3. Filter by folder structure (only if not searching and sorting by 'all' or 'folder')
        if (activeCategory === 'all' || activeCategory === 'folder') {
            if (!searchQuery) {
                return filtered.filter(item => {
                    // If we are in a specific folder, show items with that folderId
                    if (currentFolderId) {
                        return item.folderId === currentFolderId;
                    }
                    // If we are at root, show items with NO folderId (undefined or null)
                    return !item.folderId;
                });
            }
        }

        return filtered;
    }, [items, activeCategory, searchQuery, currentFolderId]);

    const handleItemClick = (item: VaultItem) => {
        if (item.type === 'folder') {
            setCurrentFolderId(item.id);
            setSearchQuery(''); // Clear search on navigation
        } else {
            console.log('Clicked item:', item);
            setSelectedItem(item);
            // Future: Open detail modal
        }
    };

    const handleCreateFolder = (data: { name: string; color: string; icon: string; metadata: any }) => {
        const newFolder: VaultItem = {
            id: generateId(),
            title: data.name,
            type: 'folder',
            subtitle: '0 items',
            lastModified: 'Just now',
            isFavorite: false,
            folderId: currentFolderId || undefined,
            color: data.color
        };
        setItems(prev => [...prev, newFolder]);
        setIsCreateFolderModalOpen(false);
        // Don't auto-navigate
    };

    const handleCreateNote = () => {
        const newItem: VaultItem = {
            id: generateId(),
            type: 'note',
            title: 'Untitled Note',
            subtitle: 'Just now',
            lastModified: new Date().toLocaleDateString(),
            isFavorite: false,
            folderId: currentFolderId || undefined,
            color: '#FCD34D'
        };
        setItems(prev => [newItem, ...prev]);
        setIsMenuOpen(false);
    }

    const handleCreateItemRequest = (type: string | undefined) => {
        if (type === 'folder' || type === 'document') {
            setIsCreateFolderModalOpen(true);
        } else {
            console.log('Create item', type);
        }
    };

    const handleNavigate = (folderId: string) => {
        setCurrentFolderId(folderId);
    };

    const handleBreadcrumbClick = (folderId: string | null) => {
        setCurrentFolderId(folderId);
    };

    const handleCreateLink = (data: { title: string; url: string }) => {
        const newLinkId = generateId();
        const newItem: VaultItem = {
            id: newLinkId,
            type: 'weblink',
            title: data.title, // Using title for consistency with existing VaultItem structure
            subtitle: data.url, // Using subtitle for URL
            lastModified: new Date().toLocaleDateString(), // Using lastModified
            isFavorite: false, // Default to false
            folderId: currentFolderId || undefined,
            metadata: {
                url: data.url
            },
            icon: Globe, // Add icon for consistency
            color: '#8B5CF6' // Add color for consistency
        };
        setItems(prev => [newItem, ...prev]);
        setIsCreateLinkModalOpen(false);
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDeleteItem = (itemId: string) => {
        // Recursive delete: find all items that are children of this folder
        const getItemsToDelete = (id: string): string[] => {
            const children = items.filter(i => i.folderId === id);
            let ids = [id];
            children.forEach(child => {
                ids = [...ids, ...getItemsToDelete(child.id)];
            });
            return ids;
        };

        const idsToDelete = getItemsToDelete(itemId);
        setItems(prev => prev.filter(i => !idsToDelete.includes(i.id)));

        // If we deleted the current folder, go up
        if (currentFolderId && idsToDelete.includes(currentFolderId)) {
            setCurrentFolderId(null);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const id = generateId();
        const extension = file.name.split('.').pop()?.toLowerCase();

        let type: 'image' | 'document' | 'weblink' = 'document'; // Default
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
            type = 'image';
        } else if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(extension || '')) {
            type = 'document';
        }

        const newItem: VaultItem = {
            id,
            title: file.name,
            type: type as any,
            subtitle: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            lastModified: 'Just now',
            isFavorite: false,
            folderId: currentFolderId || undefined,
            previewUrl: URL.createObjectURL(file), // Real local preview URL
            metadata: {
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                mimeType: file.type
            },
            icon: type === 'image' ? Image : FileText,
            color: type === 'image' ? '#3B82F6' : '#EF4444'
        };

        setItems(prev => [...prev, newItem]);
        setIsMenuOpen(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Derived state for Empty State
    const isEmpty = filteredItems.length === 0;
    const isInsideFolder = !!currentFolderId;

    return (
        <div className="flex h-full bg-white dark:bg-[#1a1d24]">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <VaultSidebar activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

            {/* Main Content */}
            <div className="flex flex-col h-full flex-1 min-w-0">

                {/* Top Nav */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span
                                className={`hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer ${!currentFolderId ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}`}
                                onClick={() => handleBreadcrumbClick(null)}
                            >
                                Vault
                            </span>
                            {breadcrumbs.map((folder, index) => (
                                <React.Fragment key={folder.id}>
                                    <ChevronRight size={14} />
                                    <span
                                        className={`hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer ${index === breadcrumbs.length - 1 ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}`}
                                        onClick={() => handleBreadcrumbClick(folder.id)}
                                    >
                                        {folder.title}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggles */}
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#2b2d31] shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[#2b2d31] shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
                            />
                        </div>

                        {/* Contextual Create Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-500/20"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">New</span>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden py-1">
                                        <button
                                            onClick={() => { setIsCreateFolderModalOpen(true); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <Folder size={16} className="text-gray-400" />
                                            {isInsideFolder ? 'New Subfolder' : 'New Folder'}
                                        </button>
                                        <button
                                            onClick={() => { handleCreateNote(); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <FileText size={16} className="text-gray-400" />
                                            New Note
                                        </button>
                                        <button
                                            onClick={() => { setIsCreateLinkModalOpen(true); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <Globe size={16} className="text-gray-400" />
                                            Web Link
                                        </button>
                                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                        <button
                                            onClick={() => { handleUploadClick(); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <Upload size={16} className="text-gray-400" />
                                            Upload File
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main View Area */}
                <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-[#1a1d24]">
                    {isEmpty ? (
                        <VaultEmptyState
                            type={
                                searchQuery ? 'active-search' :
                                    isInsideFolder ? 'empty-folder' :
                                        activeCategory !== 'all' ? 'empty-category' :
                                            'empty-vault'
                            }
                            category={activeCategory}
                            searchQuery={searchQuery}
                            onClearSearch={() => setSearchQuery('')}
                            onCreateItem={handleCreateItemRequest}
                        />
                    ) : (
                        viewMode === 'grid' ? (
                            <VaultGrid
                                items={filteredItems}
                                onNavigate={handleNavigate}
                                onDelete={handleDeleteItem}
                            />
                        ) : (
                            <VaultList
                                items={filteredItems}
                                onNavigate={handleNavigate}
                                onDelete={handleDeleteItem}
                            />
                        )
                    )}
                </div>
            </div>

            <CreateFolderModal
                isOpen={isCreateFolderModalOpen}
                onClose={() => setIsCreateFolderModalOpen(false)}
                onCreate={handleCreateFolder}
            />

            <CreateLinkModal
                isOpen={isCreateLinkModalOpen}
                onClose={() => setIsCreateLinkModalOpen(false)}
                onCreate={handleCreateLink}
            />
        </div>
    );
};
