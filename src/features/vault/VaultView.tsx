import React, { useState, useMemo, useEffect } from 'react';
import { MagnifyingGlass as Search, GridFour as LayoutGrid, List as ListIcon, Sliders as SlidersHorizontal, Folder, CaretRight as ChevronRight, Plus, FileText, Globe, Upload, Image, File, ArrowUp, ArrowDown, Check } from 'phosphor-react';
import { VaultSidebar } from './components/VaultSidebar';
import { VaultGrid } from './components/VaultGrid';
import { VaultList } from './components/VaultList';
import { VaultEmptyState } from './components/VaultEmptyState';
import { VaultItem } from './types';
import { CreateFolderModal } from './components/CreateFolderModal';
import { CreateLinkModal } from './components/CreateLinkModal';
import { RenameItemModal } from './components/RenameItemModal';
import { vaultService } from '../../services/vaultService';
import { useAuth } from '../../auth-adapter';

export const VaultView: React.FC = () => {
    const { getToken, isSignedIn, isLoaded, userId } = useAuth();
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

    const [items, setItems] = useState<VaultItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [itemToRename, setItemToRename] = useState<VaultItem | null>(null);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [groupBy, setGroupBy] = useState<'none' | 'type' | 'date'>('none');

    // Initial Fetch & URL Parsing
    useEffect(() => {
        if (isLoaded) {
            if (isSignedIn) {
                // Parse URL params for deep linking
                const params = new URLSearchParams(window.location.search);
                const folderId = params.get('folder');
                const highlightId = params.get('highlight');

                if (folderId) setCurrentFolderId(folderId);
                // If highlightId exists, we might want to scroll to it or select it
                // We'll handle highlighting in the render phase or a separate effect once items are loaded

                loadItems().then(() => {
                    if (highlightId) {
                        // Find item and select/highlight it
                        // For now just console log, or finding it in items would require items to be loaded first
                        // We will rely on items state update
                    }
                });
            } else {
                setIsLoading(false);
                setError("Please sign in to access your vault.");
            }
        }
    }, [isLoaded, isSignedIn]);

    // Handle Highlighting after items load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const highlightId = params.get('highlight');
        if (highlightId && items.length > 0) {
            const item = items.find(i => i.id === highlightId);
            if (item) {
                setSelectedItem(item);
                // Optional: Scroll into view logic could go here
            }
        }
    }, [items]);

    const loadItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("VaultView: Starting loadItems");
            const token = await getToken();
            if (!token) {
                console.warn("VaultView: No token");
                throw new Error("No authentication token available");
            }

            console.log("VaultView: Fetching from service");
            const data = await vaultService.getAll(token, userId || "user-1");
            console.log("VaultView: Data received", data);

            if (!Array.isArray(data)) {
                console.error("VaultView: Data is not an array", data);
                throw new Error("Invalid data received from server");
            }


            // Calculate folder counts locally
            const folderCounts = new Map<string, number>();
            data.forEach((item: any) => {
                if (item.folderId) {
                    folderCounts.set(item.folderId, (folderCounts.get(item.folderId) || 0) + 1);
                }
            });

            const transformedItems: VaultItem[] = data.map((i: any) => {
                const count = folderCounts.get(i.id) || 0;
                return {
                    id: i.id,
                    title: i.title || 'Untitled',
                    type: i.type || 'file',
                    subtitle: i.subtitle || (i.type === 'folder' ? `${count} item${count !== 1 ? 's' : ''}` : ''),
                    lastModified: i.updatedAt ? new Date(i.updatedAt).toLocaleDateString() : 'Just now',
                    isFavorite: !!i.isFavorite,
                    folderId: i.folderId,
                    color: i.color,
                    metadata: i.metadata,
                    // Removed icon from state to ensure serializability and avoid potential rendering issues
                    previewUrl: i.previewUrl || i.content
                };
            });
            setItems(transformedItems);
        } catch (error: any) {
            console.error("Failed to load vault items", error);
            setError(error.message || "Failed to load items");
        } finally {
            setIsLoading(false);
        }
    };

    const getIconForType = (type: string) => {
        // Kept for reference but not using in state anymore
        switch (type) {
            case 'folder': return Folder;
            case 'image': return Image;
            case 'weblink': return Globe;
            case 'note': return FileText;
            default: return File;
        }
    };

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

    const handleCreateFolder = async (data: { name: string; color: string; icon: string; metadata: any }) => {
        try {
            const token = await getToken();
            if (!token) return;

            const newFolder = await vaultService.create(token, {
                title: data.name,
                type: 'folder',
                userId: userId || "user-1",
                folderId: currentFolderId || undefined,
                color: data.color,
                metadata: data.metadata
            });
            await loadItems(); // Refresh to ensure sync
            setIsCreateFolderModalOpen(false);
        } catch (e) {
            console.error("Failed to create folder", e);
        }
    };

    const handleCreateNote = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            await vaultService.create(token, {
                title: 'Untitled Note',
                type: 'note',
                userId: userId || "user-1",
                subtitle: 'Just now',
                folderId: currentFolderId || undefined,
                color: '#FCD34D'
            });
            await loadItems();
            setIsMenuOpen(false);
        } catch (e) {
            console.error("Failed to create note", e);
        }
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

    const handleCreateLink = async (data: { title: string; url: string }) => {
        try {
            const token = await getToken();
            if (!token) return;

            await vaultService.create(token, {
                title: data.title,
                type: 'weblink',
                userId: userId || "user-1",
                subtitle: data.url,
                folderId: currentFolderId || undefined,
                color: '#8B5CF6',
                content: data.url,
                metadata: { url: data.url }
            });
            await loadItems();
            setIsCreateLinkModalOpen(false);
        } catch (e) {
            console.error("Failed to create link", e);
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDeleteItem = async (itemId: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            await vaultService.delete(token, itemId);

            // Optimistic update
            setItems(prev => prev.filter(i => i.id !== itemId));

            // If we deleted the current folder, go up
            if (itemId === currentFolderId) {
                setCurrentFolderId(null);
            }
        } catch (e) {
            console.error("Failed to delete item", e);
        }
    };

    const handleToggleFavorite = async (item: VaultItem) => {
        try {
            const token = await getToken();
            if (!token) return;

            const updated = await vaultService.update(token, item.id, {
                isFavorite: !item.isFavorite
            });

            setItems(prev => prev.map(i => i.id === item.id ? { ...i, isFavorite: updated.isFavorite } : i));
        } catch (e) {
            console.error("Failed to toggle favorite", e);
        }
    };

    const handleRenameRequest = (item: VaultItem) => {
        setItemToRename(item);
        setIsRenameModalOpen(true);
    };

    const handleRenameItem = async (newName: string) => {
        if (!itemToRename) return;
        try {
            const token = await getToken();
            if (!token) return;

            const updated = await vaultService.update(token, itemToRename.id, {
                title: newName
            });

            setItems(prev => prev.map(i => i.id === itemToRename.id ? { ...i, title: updated.title } : i));
            setIsRenameModalOpen(false);
            setItemToRename(null);
        } catch (e) {
            console.error("Failed to rename item", e);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const extension = file.name.split('.').pop()?.toLowerCase();
        let type: 'image' | 'document' = 'document'; // Default
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
            type = 'image';
        }

        try {
            const token = await getToken();
            if (!token) return;

            // Note: In a real app we would upload the file to storage here and get a URL.
            // For now we will persist the metadata.
            await vaultService.create(token, {
                title: file.name,
                type: type,
                userId: userId || "user-1",
                subtitle: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                folderId: currentFolderId || undefined,
                metadata: {
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                    mimeType: file.type
                },
                color: type === 'image' ? '#3B82F6' : '#EF4444'
            });
            await loadItems();
            setIsMenuOpen(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e) {
            console.error("Failed to upload file", e);
        }
    };

    // Derived state for Empty State
    const isEmpty = !isLoading && filteredItems.length === 0;
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



                        {/* Sort & Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                className={`p-2 rounded-lg transition-colors ${isSortMenuOpen ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <SlidersHorizontal size={18} />
                            </button>

                            {isSortMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsSortMenuOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-2">

                                        <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By</div>
                                        {(['name', 'date', 'type', 'size'] as const).map(option => (
                                            <button
                                                key={option}
                                                onClick={() => { setSortBy(option); setIsSortMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                            >
                                                <span className="capitalize">{option}</span>
                                                {sortBy === option && <Check size={14} className="text-monday-blue" />}
                                            </button>
                                        ))}

                                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>

                                        <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Direction</div>
                                        <button
                                            onClick={() => { setSortDirection('asc'); setIsSortMenuOpen(false); }}
                                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ArrowUp size={14} /> Ascending
                                            </div>
                                            {sortDirection === 'asc' && <Check size={14} className="text-monday-blue" />}
                                        </button>
                                        <button
                                            onClick={() => { setSortDirection('desc'); setIsSortMenuOpen(false); }}
                                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ArrowDown size={14} /> Descending
                                            </div>
                                            {sortDirection === 'desc' && <Check size={14} className="text-monday-blue" />}
                                        </button>

                                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>

                                        <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Group By</div>
                                        {(['none', 'type', 'date'] as const).map(option => (
                                            <button
                                                key={option}
                                                onClick={() => { setGroupBy(option); setIsSortMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                            >
                                                <span className="capitalize">{option === 'none' ? 'No Grouping' : option}</span>
                                                {groupBy === option && <Check size={14} className="text-monday-blue" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
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
                                className="flex items-center gap-2 px-4 py-2 bg-monday-blue hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
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
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500">
                            <p className="text-lg font-semibold">Something went wrong</p>
                            <p className="text-sm opacity-80">{error}</p>
                            <button onClick={() => loadItems()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                Retry
                            </button>
                        </div>
                    ) : isEmpty ? (
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
                        <div className="h-full overflow-auto">
                            {(() => {
                                // 1. Sort
                                const sortedItems = [...filteredItems].sort((a, b) => {
                                    let comparison = 0;
                                    switch (sortBy) {
                                        case 'name':
                                            comparison = a.title.localeCompare(b.title);
                                            break;
                                        case 'date':
                                            comparison = new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
                                            break;
                                        case 'size':
                                            // Mock size check - logic would need real size
                                            comparison = 0;
                                            break;
                                        case 'type':
                                            comparison = a.type.localeCompare(b.type);
                                            break;
                                    }
                                    return sortDirection === 'asc' ? comparison * -1 : comparison;
                                });

                                // 2. Group
                                let grouped: Record<string, VaultItem[]> = {};

                                if (groupBy === 'none') {
                                    grouped = { 'All Items': sortedItems };
                                } else if (groupBy === 'type') {
                                    sortedItems.forEach(item => {
                                        const type = item.type.charAt(0).toUpperCase() + item.type.slice(1) + 's'; // e.g., Folders, Files
                                        if (!grouped[type]) grouped[type] = [];
                                        grouped[type].push(item);
                                    });
                                } else if (groupBy === 'date') {
                                    sortedItems.forEach(item => {
                                        // Simple date grouping
                                        const date = new Date(item.lastModified);
                                        const now = new Date();
                                        let key = 'Older';
                                        if (date.toDateString() === now.toDateString()) key = 'Today';
                                        else if (date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString()) key = 'Yesterday';
                                        else if (date > new Date(now.setDate(now.getDate() - 7))) key = 'Last 7 Days';

                                        if (!grouped[key]) grouped[key] = [];
                                        grouped[key].push(item);
                                    });
                                }

                                if (groupBy === 'none') {
                                    return viewMode === 'grid' ? (
                                        <VaultGrid
                                            items={sortedItems}
                                            onNavigate={handleNavigate}
                                            onDelete={handleDeleteItem}
                                            onToggleFavorite={handleToggleFavorite}
                                            onRename={handleRenameRequest}
                                        />
                                    ) : (
                                        <VaultList
                                            items={sortedItems}
                                            onNavigate={handleNavigate}
                                            onDelete={handleDeleteItem}
                                            onToggleFavorite={handleToggleFavorite}
                                            onRename={handleRenameRequest}
                                        />
                                    );
                                }

                                return (
                                    <div className="p-6 space-y-8">
                                        {Object.entries(grouped).map(([groupName, groupItems]) => (
                                            <div key={groupName}>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{groupName}</h3>
                                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 font-medium">
                                                        {groupItems.length}
                                                    </span>
                                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                                                </div>
                                                {viewMode === 'grid' ? (
                                                    <div className="-m-6">
                                                        <VaultGrid
                                                            items={groupItems}
                                                            onNavigate={handleNavigate}
                                                            onDelete={handleDeleteItem}
                                                            onToggleFavorite={handleToggleFavorite}
                                                            onRename={handleRenameRequest}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="-m-6">
                                                        <VaultList
                                                            items={groupItems}
                                                            onNavigate={handleNavigate}
                                                            onDelete={handleDeleteItem}
                                                            onToggleFavorite={handleToggleFavorite}
                                                            onRename={handleRenameRequest}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
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

            {itemToRename && (
                <RenameItemModal
                    isOpen={isRenameModalOpen}
                    onClose={() => { setIsRenameModalOpen(false); setItemToRename(null); }}
                    onRename={handleRenameItem}
                    currentName={itemToRename.title}
                    type={itemToRename.type}
                />
            )}
        </div >
    );
};
