import React, { useState, useMemo, useEffect } from 'react';
import {
  MagnifyingGlass as Search,
  GridFour as LayoutGrid,
  List as ListIcon,
  Sliders as SlidersHorizontal,
  Folder,
  CaretRight as ChevronRight,
  Plus,
  FileText,
  Globe,
  Upload,
  Image,
  File,
  ArrowUp,
  ArrowDown,
  Check,
} from 'phosphor-react';
import { storageLogger } from '../../utils/logger';
import { VaultSidebar } from './components/VaultSidebar';
import { VaultGrid } from './components/VaultGrid';
import { VaultList } from './components/VaultList';
import { VaultEmptyState } from './components/VaultEmptyState';
import { LoginsTable } from './components/LoginsTable';
import { WebLinksTable } from './components/WebLinksTable';
import { VaultItem, VaultItemType } from './types';

// API response item type (different from VaultItem state type)
interface _VaultApiItem {
  id: string;
  title?: string;
  type?: string;
  subtitle?: string;
  updatedAt?: string;
  isFavorite?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  folderId?: string;
  color?: string;
  metadata?: string;
  previewUrl?: string;
  content?: string;
}
import { CreateFolderModal } from './components/CreateFolderModal';
import { CreateLinkModal } from './components/CreateLinkModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { CreateLoginModal } from './components/CreateLoginModal';
import { CreateSecureNoteModal } from './components/CreateSecureNoteModal';
import { RenameItemModal } from './components/RenameItemModal';
import { MoveToFolderModal } from './components/MoveToFolderModal';
import { vaultService } from '../../services/vaultService';
import { useAuth } from '../../auth-adapter';
import { useAppContext } from '../../contexts/AppContext';
import { ConfirmModal } from '../../features/board/components/ConfirmModal';

export const VaultView: React.FC = () => {
  const { t } = useAppContext();
  const { getToken, isSignedIn, isLoaded, userId } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [_selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isCreateLoginModalOpen, setIsCreateLoginModalOpen] = useState(false);
  const [isCreateSecureNoteModalOpen, setIsCreateSecureNoteModalOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<VaultItem | null>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'date'>('none');

  // Move Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<VaultItem | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VaultItem | null>(null);

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
        setError('Please sign in to access your vault.');
      }
    }
  }, [isLoaded, isSignedIn]);

  // Handle Highlighting after items load (from URL params or board file navigation)
  useEffect(() => {
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    let highlightId = params.get('highlight');

    // Check localStorage (from board file click)
    const navId = localStorage.getItem('vault-navigate-to');
    if (navId) {
      highlightId = navId;
      const navFolder = localStorage.getItem('vault-navigate-folder');
      if (navFolder) {
        setCurrentFolderId(navFolder);
        localStorage.removeItem('vault-navigate-folder');
      }
      localStorage.removeItem('vault-navigate-to');
    }

    if (highlightId && items.length > 0) {
      const item = items.find((i) => i.id === highlightId);
      if (item) {
        setSelectedItem(item);
      }
    }
  }, [items]);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      storageLogger.info('VaultView: Starting loadItems');
      const token = await getToken();
      if (!token) {
        storageLogger.warn('VaultView: No token');
        throw new Error('No authentication token available');
      }

      storageLogger.info('VaultView: Fetching from service');
      const data = await vaultService.getAll(token, userId || 'user-1');
      storageLogger.info('VaultView: Data received', data);

      if (!Array.isArray(data)) {
        storageLogger.error('VaultView: Data is not an array', data);
        throw new Error('Invalid data received from server');
      }

      // Calculate folder counts locally
      const folderCounts = new Map<string, number>();
      data.forEach((item) => {
        if (item.folderId) {
          folderCounts.set(item.folderId, (folderCounts.get(item.folderId) || 0) + 1);
        }
      });

      const transformedItems: VaultItem[] = data.map((i) => {
        const count = folderCounts.get(i.id) || 0;
        return {
          id: i.id,
          title: i.title || 'Untitled',
          type: (i.type || 'document') as VaultItemType,
          subtitle: i.subtitle || (i.type === 'folder' ? `${count} item${count !== 1 ? 's' : ''}` : ''),
          lastModified: i.updatedAt ? new Date(i.updatedAt).toLocaleDateString() : 'Just now',
          isFavorite: !!i.isFavorite,
          isDeleted: !!i.isDeleted,
          deletedAt: i.deletedAt,
          folderId: i.folderId,
          color: i.color,
          metadata: i.metadata
            ? (() => {
                if (typeof i.metadata !== 'string') return i.metadata;
                try {
                  return JSON.parse(i.metadata);
                } catch {
                  storageLogger.warn(`Failed to parse metadata for item ${i.id}`);
                  return undefined;
                }
              })()
            : undefined,
          // Removed icon from state to ensure serializability and avoid potential rendering issues
          previewUrl: i.previewUrl || i.content,
        };
      });
      setItems(transformedItems);
    } catch (error) {
      storageLogger.error('Failed to load vault items', error);
      setError(error instanceof Error ? error.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  const _getIconForType = (type: string) => {
    // Kept for reference but not using in state anymore
    switch (type) {
      case 'folder':
        return Folder;
      case 'image':
        return Image;
      case 'weblink':
        return Globe;
      case 'note':
        return FileText;
      default:
        return File;
    }
  };

  // Breadcrumbs logic
  const breadcrumbs = useMemo(() => {
    if (!currentFolderId) return [];
    const path = [];
    let currentId: string | undefined = currentFolderId;
    while (currentId) {
      const folder = items.find((i) => i.id === currentId);
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
    const filtered = items.filter((item) => {
      // 0. Handle trash category separately - show ONLY deleted items
      if (activeCategory === 'trash') {
        return item.isDeleted === true;
      }

      // For all other categories, exclude deleted items
      if (item.isDeleted) {
        return false;
      }

      // 1. Filter by category
      if (activeCategory !== 'all') {
        if (activeCategory === 'favorites') {
          if (!item.isFavorite) return false;
        } else if (item.type !== activeCategory) {
          return false;
        }
      }

      // 2. Filter by search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q));
      }

      return true;
    });

    // 3. Filter by folder structure (only if not searching and viewing 'all' or 'folder' category)
    // Skip folder filtering for trash view
    if ((activeCategory === 'all' || activeCategory === 'folder') && activeCategory !== 'trash') {
      if (!searchQuery) {
        return filtered.filter((item) => {
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

  const _handleItemClick = (item: VaultItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id);
      setActiveCategory('all'); // Go to all items within folder
      setSearchQuery(''); // Clear search on navigation
    } else {
      storageLogger.info('Clicked item:', item);
      setSelectedItem(item);
      // Future: Open detail modal
    }
  };

  const handleCreateFolder = async (data: {
    name: string;
    color: string;
    icon: string;
    metadata: Record<string, unknown>;
  }) => {
    try {
      const token = await getToken();
      if (!token) return;

      const _newFolder = await vaultService.create(token, {
        title: data.name,
        type: 'folder',
        userId: userId || 'user-1',
        folderId: currentFolderId || undefined,
        color: data.color,
        metadata: data.metadata,
      });
      await loadItems(); // Refresh to ensure sync
      setIsCreateFolderModalOpen(false);
    } catch (e) {
      storageLogger.error('Failed to create folder', e);
    }
  };

  const handleCreateNote = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await vaultService.create(token, {
        title: 'Untitled Note',
        type: 'note',
        userId: userId || 'user-1',
        subtitle: 'Just now',
        folderId: currentFolderId || undefined,
        color: '#FCD34D',
      });
      await loadItems();
      setIsMenuOpen(false);
    } catch (e) {
      storageLogger.error('Failed to create note', e);
    }
  };

  const handleCreateLogin = async (data: {
    title: string;
    url: string;
    username: string;
    password: string;
    notes?: string;
  }) => {
    try {
      const token = await getToken();
      if (!token) return;

      await vaultService.create(token, {
        title: data.title,
        type: 'login',
        userId: userId || 'user-1',
        subtitle: data.username,
        folderId: currentFolderId || undefined,
        color: '#06B6D4', // Cyan for logins
        content: data.url,
        metadata: {
          url: data.url,
          username: data.username,
          password: data.password,
          notes: data.notes,
        },
      });
      await loadItems();
      setIsCreateLoginModalOpen(false);
    } catch (e) {
      storageLogger.error('Failed to create login', e);
    }
  };

  const handleCreateSecureNote = async (data: { title: string; content: string; tags?: string[] }) => {
    try {
      const token = await getToken();
      if (!token) return;

      await vaultService.create(token, {
        title: data.title,
        type: 'note',
        userId: userId || 'user-1',
        subtitle: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
        folderId: currentFolderId || undefined,
        color: '#FCD34D', // Yellow for notes
        content: data.content,
        metadata: {
          content: data.content,
          tags: data.tags,
        },
      });
      await loadItems();
      setIsCreateSecureNoteModalOpen(false);
    } catch (e) {
      storageLogger.error('Failed to create secure note', e);
    }
  };

  const handleCreateItemRequest = (type: string | undefined) => {
    if (type === 'folder' || type === 'document') {
      setIsCreateFolderModalOpen(true);
    } else {
      storageLogger.info('Create item', type);
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
        userId: userId || 'user-1',
        subtitle: data.url,
        folderId: currentFolderId || undefined,
        color: '#8B5CF6',
        content: data.url,
        metadata: { url: data.url },
      });
      await loadItems();
      setIsCreateLinkModalOpen(false);
    } catch (e) {
      storageLogger.error('Failed to create link', e);
    }
  };

  const handleCreateGroup = async (data: { name: string; icon: string; color: string }) => {
    try {
      const token = await getToken();
      if (!token) return;

      await vaultService.create(token, {
        title: data.name,
        type: 'folder',
        userId: userId || 'user-1',
        folderId: undefined, // Always at root
        color: data.color,
        metadata: {
          icon: data.icon,
          isGroup: true,
        },
      });
      await loadItems();
      setIsCreateGroupModalOpen(false);
    } catch (e) {
      storageLogger.error('Failed to create group', e);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDeleteRequest = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = await getToken();
      if (!token) return;

      // If item is already in trash, permanently delete it
      if (itemToDelete.isDeleted) {
        await vaultService.delete(token, itemToDelete.id);
        setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      } else {
        // Soft delete - move to trash
        await vaultService.update(token, itemToDelete.id, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        });
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemToDelete.id ? { ...i, isDeleted: true, deletedAt: new Date().toISOString() } : i,
          ),
        );
      }

      // If we deleted the current folder, go up
      if (itemToDelete.id === currentFolderId) {
        setCurrentFolderId(null);
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (e) {
      storageLogger.error('Failed to delete item', e);
    }
  };

  const handleRestoreItem = async (item: VaultItem) => {
    try {
      const token = await getToken();
      if (!token) return;

      await vaultService.update(token, item.id, {
        isDeleted: false,
        deletedAt: undefined,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isDeleted: false, deletedAt: undefined } : i)));
    } catch (e) {
      storageLogger.error('Failed to restore item', e);
    }
  };

  const _handleEmptyTrash = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const trashItems = items.filter((i) => i.isDeleted);
      for (const item of trashItems) {
        await vaultService.delete(token, item.id);
      }
      setItems((prev) => prev.filter((i) => !i.isDeleted));
    } catch (e) {
      storageLogger.error('Failed to empty trash', e);
    }
  };

  const handleToggleFavorite = async (item: VaultItem) => {
    try {
      const token = await getToken();
      if (!token) return;

      const updated = await vaultService.update(token, item.id, {
        isFavorite: !item.isFavorite,
      });

      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isFavorite: updated.isFavorite } : i)));
    } catch (e) {
      storageLogger.error('Failed to toggle favorite', e);
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
        title: newName,
      });

      setItems((prev) => prev.map((i) => (i.id === itemToRename.id ? { ...i, title: updated.title } : i)));
      setIsRenameModalOpen(false);
      setItemToRename(null);
    } catch (e) {
      storageLogger.error('Failed to rename item', e);
    }
  };

  const handleMoveRequest = (item: VaultItem) => {
    setItemToMove(item);
    setIsMoveModalOpen(true);
  };

  const handleMoveItem = async (folderId: string | null) => {
    if (!itemToMove) return;
    try {
      const token = await getToken();
      if (!token) return;

      // Optimistic update
      setItems((prev) => prev.map((i) => (i.id === itemToMove.id ? { ...i, folderId: folderId || undefined } : i)));

      // Server update
      await vaultService.update(token, itemToMove.id, {
        folderId: folderId || undefined,
      });

      // Refresh to be safe (syncs counts etc)
      await loadItems();
      setIsMoveModalOpen(false);
      setItemToMove(null);
    } catch (e) {
      storageLogger.error('Failed to move item', e);
      // Revert on error? For now just log
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
      if (!token) {
        setError(t('authentication_error') || 'Authentication required');
        return;
      }

      // Note: In a real app we would upload the file to storage here and get a URL.
      // For now we will persist the metadata.
      await vaultService.create(token, {
        title: file.name,
        type: type,
        userId: userId || 'user-1',
        subtitle: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        folderId: currentFolderId || undefined,
        metadata: {
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          mimeType: file.type,
        },
        color: type === 'image' ? '#3B82F6' : '#EF4444',
      });
      await loadItems();
      setIsMenuOpen(false);
    } catch (e) {
      storageLogger.error('Failed to upload file', e);
      setError(t('upload_failed') || 'Failed to upload file. Please try again.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Derived state for Empty State
  const isEmpty = !isLoading && filteredItems.length === 0;
  const isInsideFolder = !!currentFolderId;

  const rootFolders = useMemo(() => {
    return items.filter((i) => i.type === 'folder' && !i.folderId);
  }, [items]);

  return (
    <div className="flex h-full bg-white dark:bg-monday-dark-surface">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <VaultSidebar
        activeCategory={activeCategory}
        onSelectCategory={(category) => {
          setActiveCategory(category);
          setCurrentFolderId(null); // Clear folder when selecting a category
        }}
        onCreateItem={(type) => {
          if (type === 'folder') setIsCreateFolderModalOpen(true);
          else if (type === 'weblink') setIsCreateLinkModalOpen(true);
          else if (type === 'note') setIsCreateSecureNoteModalOpen(true);
          else if (type === 'login') setIsCreateLoginModalOpen(true);
        }}
        onCreateGroup={() => setIsCreateGroupModalOpen(true)}
        onUploadClick={handleUploadClick}
        folders={rootFolders}
        currentFolderId={currentFolderId}
        onSelectFolder={(id) => {
          setCurrentFolderId(id);
          if (id) setActiveCategory('all'); // Only set to 'all' when selecting a folder
        }}
        items={items}
      />

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
                {t('vault')}
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
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-monday-dark-elevated shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-monday-dark-elevated shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
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
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-2">
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('sort_by')}
                    </div>
                    {(['name', 'date', 'type', 'size'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setIsSortMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="capitalize">{t(option === 'type' ? 'sort_type' : option)}</span>
                        {sortBy === option && <Check size={14} className="text-monday-blue" />}
                      </button>
                    ))}

                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>

                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('direction')}
                    </div>
                    <button
                      onClick={() => {
                        setSortDirection('asc');
                        setIsSortMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUp size={14} /> {t('ascending')}
                      </div>
                      {sortDirection === 'asc' && <Check size={14} className="text-monday-blue" />}
                    </button>
                    <button
                      onClick={() => {
                        setSortDirection('desc');
                        setIsSortMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowDown size={14} /> {t('descending')}
                      </div>
                      {sortDirection === 'desc' && <Check size={14} className="text-monday-blue" />}
                    </button>

                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>

                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('group_by')}
                    </div>
                    {(['none', 'type', 'date'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setGroupBy(option);
                          setIsSortMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="capitalize">
                          {option === 'none' ? t('no_grouping') : t(option === 'type' ? 'sort_type' : option)}
                        </span>
                        {groupBy === option && <Check size={14} className="text-monday-blue" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t('search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 pe-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
              />
            </div>

            {/* Contextual Create Button */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-monday-blue hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">{t('new')}</span>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden py-1">
                    <button
                      onClick={() => {
                        setIsCreateFolderModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-start text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Folder size={16} className="text-gray-400" />
                      {isInsideFolder ? t('new_subfolder') : t('new_folder')}
                    </button>
                    <button
                      onClick={() => {
                        handleCreateNote();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-start text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <FileText size={16} className="text-gray-400" />
                      {t('new_note')}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreateLinkModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-start text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Globe size={16} className="text-gray-400" />
                      {t('web_link')}
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        handleUploadClick();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-start text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Upload size={16} className="text-gray-400" />
                      {t('upload_file')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main View Area */}
        <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-monday-dark-surface">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center px-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <File size={32} className="text-red-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('something_went_wrong')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              {error.includes('connect to server') && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 text-left text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Quick fix:</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Run <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">cd server && pnpm dev</code> to
                    start the backend server.
                  </p>
                </div>
              )}
              <button
                onClick={() => loadItems()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                {t('retry')}
              </button>
            </div>
          ) : isEmpty ? (
            <VaultEmptyState
              type={
                searchQuery
                  ? 'active-search'
                  : isInsideFolder
                    ? 'empty-folder'
                    : activeCategory !== 'all'
                      ? 'empty-category'
                      : 'empty-vault'
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
                  grouped = { [t('all_items')]: sortedItems };
                } else if (groupBy === 'type') {
                  sortedItems.forEach((item) => {
                    const type =
                      item.type === 'image'
                        ? t('images')
                        : item.type === 'note'
                          ? t('notes_group')
                          : item.type === 'weblink'
                            ? t('weblinks_group')
                            : item.type === 'folder'
                              ? t('folders_group')
                              : t('files');
                    if (!grouped[type]) grouped[type] = [];
                    grouped[type].push(item);
                  });
                } else if (groupBy === 'date') {
                  // Pre-calculate date boundaries once (avoid mutation issues)
                  const now = new Date();
                  const yesterday = new Date(now);
                  yesterday.setDate(yesterday.getDate() - 1);
                  const lastWeek = new Date(now);
                  lastWeek.setDate(lastWeek.getDate() - 7);

                  sortedItems.forEach((item) => {
                    const date = new Date(item.lastModified);
                    let key = t('older');
                    if (date.toDateString() === now.toDateString()) key = t('today');
                    else if (date.toDateString() === yesterday.toDateString()) key = t('yesterday');
                    else if (date > lastWeek) key = t('last_7_days');

                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(item);
                  });
                }

                // Use specialized tables for login and weblink categories
                if (activeCategory === 'login') {
                  return (
                    <LoginsTable
                      items={sortedItems}
                      onDelete={handleDeleteRequest}
                      onToggleFavorite={handleToggleFavorite}
                      onRename={handleRenameRequest}
                      onMove={handleMoveRequest}
                    />
                  );
                }

                if (activeCategory === 'weblink') {
                  return (
                    <WebLinksTable
                      items={sortedItems}
                      onDelete={handleDeleteRequest}
                      onToggleFavorite={handleToggleFavorite}
                      onRename={handleRenameRequest}
                      onMove={handleMoveRequest}
                    />
                  );
                }

                if (groupBy === 'none') {
                  return viewMode === 'grid' ? (
                    <VaultGrid
                      items={sortedItems}
                      onNavigate={handleNavigate}
                      onDelete={handleDeleteRequest}
                      onToggleFavorite={handleToggleFavorite}
                      onRename={handleRenameRequest}
                      onMove={handleMoveRequest}
                      onRestore={handleRestoreItem}
                    />
                  ) : (
                    <VaultList
                      items={sortedItems}
                      onNavigate={handleNavigate}
                      onDelete={handleDeleteRequest}
                      onToggleFavorite={handleToggleFavorite}
                      onRename={handleRenameRequest}
                      onMove={handleMoveRequest}
                      onRestore={handleRestoreItem}
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
                              onDelete={handleDeleteRequest}
                              onToggleFavorite={handleToggleFavorite}
                              onRename={handleRenameRequest}
                              onMove={handleMoveRequest}
                              onRestore={handleRestoreItem}
                            />
                          </div>
                        ) : (
                          <div className="-m-6">
                            <VaultList
                              items={groupItems}
                              onNavigate={handleNavigate}
                              onDelete={handleDeleteRequest}
                              onToggleFavorite={handleToggleFavorite}
                              onRename={handleRenameRequest}
                              onMove={handleMoveRequest}
                              onRestore={handleRestoreItem}
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

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreate={handleCreateGroup}
      />

      <CreateLoginModal
        isOpen={isCreateLoginModalOpen}
        onClose={() => setIsCreateLoginModalOpen(false)}
        onCreate={handleCreateLogin}
      />

      <CreateSecureNoteModal
        isOpen={isCreateSecureNoteModalOpen}
        onClose={() => setIsCreateSecureNoteModalOpen(false)}
        onCreate={handleCreateSecureNote}
      />

      {itemToRename && (
        <RenameItemModal
          isOpen={isRenameModalOpen}
          onClose={() => {
            setIsRenameModalOpen(false);
            setItemToRename(null);
          }}
          onRename={handleRenameItem}
          currentName={itemToRename.title}
          type={itemToRename.type}
        />
      )}

      <MoveToFolderModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setItemToMove(null);
        }}
        onMove={handleMoveItem}
        itemToMove={itemToMove}
        allItems={items}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('delete_item')}
        message={t('delete_confirmation_message', { name: itemToDelete?.title || 'this item' })}
        confirmText={t('delete')}
        type="danger"
      />
    </div>
  );
};
