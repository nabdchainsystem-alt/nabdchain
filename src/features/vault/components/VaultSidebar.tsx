import React, { useState, useMemo } from 'react';
import {
    Plus,
    FolderPlus,
    FilePlus,
    Globe,
    Upload,
    Stack,
    CaretDown,
    Folder,
    Star,
    Heart,
    Briefcase,
    Shield,
    Presentation,
    Cloud,
    Key,
    Image,
    FileText,
    Note,
    Trash
} from 'phosphor-react';
import { MOCK_CATEGORIES, VaultItem } from '../types';
import { useAppContext } from '../../../contexts/AppContext';

interface VaultSidebarProps {
    activeCategory: string;
    onSelectCategory: (id: string) => void;
    onCreateItem: (type: string) => void;
    onCreateGroup: () => void;
    onUploadClick: () => void;
    folders: VaultItem[];
    currentFolderId: string | null;
    onSelectFolder: (id: string | null) => void;
    items?: VaultItem[];
    className?: string;
}

const ICON_MAP: Record<string, any> = {
    Folder, Star, Heart, Briefcase, Shield, Stack, Presentation, Cloud, Key, Globe, Image, FileText, Note
};

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
    activeCategory,
    onSelectCategory,
    onCreateItem,
    onCreateGroup,
    onUploadClick,
    folders,
    currentFolderId,
    onSelectFolder,
    items = [],
    className = ''
}) => {
    const { t, language } = useAppContext();
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

    // Calculate counts for each category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: items.filter(i => !i.isDeleted).length,
            favorites: items.filter(i => i.isFavorite && !i.isDeleted).length,
            folder: items.filter(i => i.type === 'folder' && !i.isDeleted).length,
            weblink: items.filter(i => i.type === 'weblink' && !i.isDeleted).length,
            document: items.filter(i => i.type === 'document' && !i.isDeleted).length,
            image: items.filter(i => i.type === 'image' && !i.isDeleted).length,
            login: items.filter(i => i.type === 'login' && !i.isDeleted).length,
            note: items.filter(i => i.type === 'note' && !i.isDeleted).length,
            trash: items.filter(i => i.isDeleted).length,
        };
        return counts;
    }, [items]);

    const categories = MOCK_CATEGORIES.map(cat => ({
        ...cat,
        label: cat.id === 'all' ? t('all_items') :
            cat.id === 'favorites' ? t('favorites') :
                cat.id === 'folder' ? t('folders') :
                    cat.id === 'weblink' ? t('weblinks') :
                        cat.id === 'document' ? t('documents') :
                            cat.id === 'image' ? t('images') :
                                cat.id === 'login' ? t('logins') :
                                    cat.id === 'note' ? t('secure_notes') :
                                        cat.id === 'trash' ? t('trash') :
                                            cat.label,
        count: categoryCounts[cat.id] || 0
    }));

    return (
        <div className={`w-64 bg-gray-50 dark:bg-monday-dark-surface border-r border-gray-200 dark:border-monday-dark-border flex flex-col p-4 shadow-sm ${className}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="mb-6 relative">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 px-2 mb-4">{t('vault')}</h2>
                <button
                    onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                    className="w-full bg-monday-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg shadow-md flex items-center justify-between gap-2 transition-all active:scale-[0.98]"
                >
                    <div className="flex items-center gap-2">
                        <Plus size={18} weight="bold" />
                        <span>{t('new_item')}</span>
                    </div>
                    <CaretDown size={14} weight="bold" className={`transition-transform duration-200 ${isNewMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isNewMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsNewMenuOpen(false)}></div>
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-30 py-2 animate-fade-in-up overflow-hidden">
                            <button
                                onClick={() => { onCreateItem('folder'); setIsNewMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <FolderPlus size={18} className="text-blue-500" />
                                <span>{t('new_folder')}</span>
                            </button>
                            <button
                                onClick={() => { onCreateItem('login'); setIsNewMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Key size={18} className="text-cyan-500" />
                                <span>{t('new_login') || 'New Login'}</span>
                            </button>
                            <button
                                onClick={() => { onCreateItem('note'); setIsNewMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <FilePlus size={18} className="text-yellow-500" />
                                <span>{t('new_note')}</span>
                            </button>
                            <button
                                onClick={() => { onCreateItem('weblink'); setIsNewMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Globe size={18} className="text-purple-500" />
                                <span>{t('web_link')}</span>
                            </button>
                            <button
                                onClick={() => { onUploadClick(); setIsNewMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Upload size={18} className="text-green-500" />
                                <span>{t('upload_file')}</span>
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2"></div>
                            <button
                                onClick={() => { onCreateGroup(); setIsNewMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                            >
                                <Stack size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" weight="fill" />
                                <span className="font-bold">{t('create_new_group')}</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pe-1">
                {categories.map(category => {
                    const Icon = category.icon;
                    const isActive = activeCategory === category.id && !currentFolderId;
                    const count = category.count;

                    return (
                        <button
                            key={category.id}
                            onClick={() => onSelectCategory(category.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium cursor-pointer
                            ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-monday-blue shadow-sm border border-blue-100/50 dark:border-blue-900/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover'
                                }
                        `}
                        >
                            <Icon size={18} weight={isActive ? "fill" : "regular"} />
                            <span className="truncate flex-1 text-start">{category.label}</span>
                            {count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                                    isActive
                                        ? 'bg-monday-blue/20 text-monday-blue'
                                        : category.id === 'trash'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-monday-dark-border">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">{t('folders')}</h3>
                    <div className="space-y-1">
                        {folders.length === 0 ? (
                            <div className="text-sm text-gray-400 italic px-5">{t('no_folders_yet')}</div>
                        ) : (
                            folders.map(folder => {
                                const metadata = folder.metadata as any;
                                const Icon = metadata?.icon && ICON_MAP[metadata.icon] ? ICON_MAP[metadata.icon] : Folder;
                                const isActive = currentFolderId === folder.id;

                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => onSelectFolder(folder.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium
                                        ${isActive
                                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover'
                                            }
                                    `}
                                    >
                                        <div className="shrink-0 transition-transform group-hover:scale-110" style={{ color: folder.color || '#3B82F6' }}>
                                            <Icon size={18} weight={isActive ? "fill" : "regular"} />
                                        </div>
                                        <span className="truncate">{folder.title}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
