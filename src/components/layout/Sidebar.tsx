import React, { useState, useEffect, useRef } from 'react';
import {
    House, Sparkle, Activity, SquaresFour, Tray, Users, Lock, Flask,
    Package, CaretDown, ShoppingCart, Truck, UsersThree, Layout, Factory, Wrench, ShieldCheck,
    Buildings, Table, Megaphone, Money, Monitor, Globe, MagnifyingGlass, Plus, DotsThree, Trash,
    CaretRight, CaretLeft, Briefcase, Folder, FileText, GitMerge, PuzzlePiece, DownloadSimple, MagicWand,
    Pencil, Gauge, X, Star, Heart, Smiley, Cpu, Database, Cloud, Code, TerminalWindow,
    Command, Hash, Image, MusicNotes, VideoCamera, PenNib, Cube, Stack,
    Copy, ArrowSquareOut, Archive, ArrowCircleRight, CheckSquare, Kanban, List,
    CreditCard, ChatCircleText, CalendarBlank, ChartLineUp
} from 'phosphor-react';
import { Board, Workspace, ViewState } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { TemplatePicker } from '../../features/board/components/TemplatePicker';
import { BoardTemplate } from '../../features/board/data/templates';
import { ConfirmModal } from '../../features/board/components/ConfirmModal';
import { DeleteBoardModal } from './DeleteBoardModal';

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, any> = {
    Briefcase, Layout, Star, Heart, Smile: Smiley, Globe, Cpu, Database, Cloud, Code, Terminal: TerminalWindow,
    Command, Hash, Image, Music: MusicNotes, Video: VideoCamera, PenTool: PenNib, Box: Cube, Package, Layers: Stack,
    Home: House, Grid: SquaresFour, Folder, Table, List, KanbanSquare: Kanban, CheckSquare
};

// Quick Navigation Items Configuration
interface QuickNavItem {
    id: string;
    icon: React.ComponentType<any>;
    label: string;
    view: string;
}

const ALL_QUICK_NAV_ITEMS: QuickNavItem[] = [
    // Core Pages
    { id: 'dashboard', icon: House, label: 'home', view: 'dashboard' },
    { id: 'my_work', icon: SquaresFour, label: 'my_work', view: 'my_work' },
    { id: 'inbox', icon: Tray, label: 'inbox', view: 'inbox' },
    { id: 'teams', icon: Users, label: 'teams', view: 'teams' },
    { id: 'vault', icon: Lock, label: 'vault', view: 'vault' },
    { id: 'talk', icon: ChatCircleText, label: 'talk', view: 'talk' },
    // Tools
    { id: 'flow_hub', icon: GitMerge, label: 'flow_hub', view: 'flow_hub' },
    { id: 'process_map', icon: PuzzlePiece, label: 'process_map', view: 'process_map' },
    { id: 'dashboards', icon: ChartLineUp, label: 'dashboards', view: 'dashboards' },
    { id: 'reports', icon: FileText, label: 'reports', view: 'reports' },
    // Mini Company - Operations
    { id: 'sales', icon: Megaphone, label: 'sales', view: 'sales' },
    { id: 'purchases', icon: ShoppingCart, label: 'purchases', view: 'purchases' },
    { id: 'inventory', icon: Package, label: 'inventory', view: 'inventory' },
    // Mini Company - Finance
    { id: 'expenses', icon: Money, label: 'expenses', view: 'expenses' },
    { id: 'customers', icon: UsersThree, label: 'customers', view: 'customers' },
    { id: 'suppliers', icon: Truck, label: 'suppliers', view: 'suppliers' },
    // Supply Chain
    { id: 'procurement', icon: ShoppingCart, label: 'procurement', view: 'procurement' },
    { id: 'warehouse', icon: Buildings, label: 'warehouse', view: 'warehouse' },
    { id: 'fleet', icon: Truck, label: 'fleet', view: 'fleet' },
    { id: 'vendors', icon: UsersThree, label: 'vendors', view: 'vendors' },
    { id: 'planning', icon: Gauge, label: 'planning', view: 'planning' },
    // Manufacturing/Operations
    { id: 'maintenance', icon: Wrench, label: 'maintenance', view: 'maintenance' },
    { id: 'production', icon: Factory, label: 'production', view: 'production' },
    { id: 'quality', icon: ShieldCheck, label: 'quality', view: 'quality' },
    // Business
    { id: 'sales_listing', icon: Table, label: 'sales_listings', view: 'sales_listing' },
    { id: 'sales_factory', icon: Factory, label: 'sales_factory', view: 'sales_factory' },
    // Business Support
    { id: 'it_support', icon: Monitor, label: 'it_support', view: 'it_support' },
    { id: 'hr', icon: Users, label: 'hr', view: 'hr' },
    { id: 'marketing', icon: Megaphone, label: 'marketing', view: 'marketing' },
    // Marketplace
    { id: 'local_marketplace', icon: Globe, label: 'local_marketplace', view: 'local_marketplace' },
    { id: 'foreign_marketplace', icon: Globe, label: 'foreign_marketplace', view: 'foreign_marketplace' },
];

const ACTIVE_SUB_NAV_STYLE = 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10';

const DEFAULT_QUICK_NAV = ['dashboard', 'my_work', 'inbox', 'vault'];

// Quick Navigation Icons Component (shown beside sidebar when collapsed)
const QuickNavIcons: React.FC<{
    activeView: ViewState | string;
    activeBoardId: string | null;
    onNavigate: (view: ViewState | string, boardId?: string) => void;
    onExpandSidebar: () => void;
    boards: Board[];
}> = ({ activeView, activeBoardId, onNavigate, onExpandSidebar, boards }) => {
    const { t } = useAppContext();
    const [quickNavItems, setQuickNavItems] = useState<string[]>(() => {
        const saved = localStorage.getItem('sidebar-quick-nav-items');
        return saved ? JSON.parse(saved) : DEFAULT_QUICK_NAV;
    });
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Listen for settings changes from external sources
    useEffect(() => {
        const handleSettingsChange = (e: CustomEvent<string[]>) => {
            setQuickNavItems(e.detail);
        };
        window.addEventListener('quicknav-settings-changed', handleSettingsChange as EventListener);
        return () => window.removeEventListener('quicknav-settings-changed', handleSettingsChange as EventListener);
    }, []);

    // Close settings when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setShowSettings(false);
            }
        };
        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSettings]);

    const handleNavClick = (e: React.MouseEvent, view: string, boardId?: string) => {
        e.stopPropagation();
        if (boardId) {
            onNavigate('board', boardId);
        } else {
            onNavigate(view);
        }
    };

    const toggleQuickNavItem = (itemId: string) => {
        const newItems = quickNavItems.includes(itemId)
            ? quickNavItems.filter(id => id !== itemId)
            : [...quickNavItems, itemId];
        setQuickNavItems(newItems);
        localStorage.setItem('sidebar-quick-nav-items', JSON.stringify(newItems));
    };

    // Build visible items from pages + boards
    const visiblePageItems = ALL_QUICK_NAV_ITEMS.filter(item => quickNavItems.includes(item.id));
    const visibleBoardItems = boards.filter(board => quickNavItems.includes(`board-${board.id}`));

    // Get board icon component
    const getBoardIcon = (iconName?: string) => {
        if (!iconName) return Layout;
        return ICON_MAP[iconName] || Layout;
    };

    return (
        <div className="flex flex-col items-center gap-3 relative">
            {/* Page navigation items */}
            {visiblePageItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.view;
                return (
                    <div key={item.id} className="group relative">
                        <button
                            onClick={(e) => handleNavClick(e, item.view)}
                            className={`
                                w-7 h-7 rounded-full flex items-center justify-center
                                bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
                                shadow-sm hover:shadow-md
                                transition-all duration-300 ease-out
                                ${isActive ? 'ring-2 ring-blue-400/50 shadow-blue-100' : ''}
                            `}
                        >
                            <Icon
                                size={13}
                                weight={isActive ? 'fill' : 'regular'}
                                className={isActive
                                    ? 'text-blue-500 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                }
                            />
                        </button>
                        {/* Tooltip on the right */}
                        <span className={`
                            absolute left-full top-1/2 -translate-y-1/2 ml-2
                            rtl:left-auto rtl:right-full rtl:ml-0 rtl:mr-2
                            px-2 py-1 rounded-md
                            bg-blue-500 dark:bg-blue-600 text-white
                            text-[10px] font-medium whitespace-nowrap
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                            transition-all duration-200 ease-out
                            z-[9999] pointer-events-none
                            shadow-lg
                        `}>
                            {t(item.label)}
                        </span>
                    </div>
                );
            })}

            {/* Board navigation items */}
            {visibleBoardItems.map((board) => {
                const BoardIcon = getBoardIcon(board.icon);
                const isActive = activeView === 'board' && activeBoardId === board.id;
                return (
                    <div key={`board-${board.id}`} className="group relative">
                        <button
                            onClick={(e) => handleNavClick(e, 'board', board.id)}
                            className={`
                                w-7 h-7 rounded-full flex items-center justify-center
                                bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
                                shadow-sm hover:shadow-md
                                transition-all duration-300 ease-out
                                ${isActive ? 'ring-2 ring-blue-400/50 shadow-blue-100' : ''}
                            `}
                        >
                            <BoardIcon
                                size={13}
                                weight={isActive ? 'fill' : 'regular'}
                                className={isActive
                                    ? 'text-blue-500 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                }
                            />
                        </button>
                        {/* Tooltip on the right */}
                        <span className={`
                            absolute left-full top-1/2 -translate-y-1/2 ml-2
                            rtl:left-auto rtl:right-full rtl:ml-0 rtl:mr-2
                            px-2 py-1 rounded-md
                            bg-blue-500 dark:bg-blue-600 text-white
                            text-[10px] font-medium whitespace-nowrap
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                            transition-all duration-200 ease-out
                            z-[9999] pointer-events-none
                            shadow-lg max-w-[120px] truncate
                        `}>
                            {board.name}
                        </span>
                    </div>
                );
            })}

            {/* Settings button */}
            <div className="group relative mt-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowSettings(!showSettings);
                    }}
                    title="Customize quick nav"
                    className="w-7 h-7 rounded-full flex items-center justify-center
                        bg-white/70 dark:bg-gray-800/70
                        hover:bg-white dark:hover:bg-gray-800
                        hover:shadow-sm
                        transition-all duration-300 ease-out"
                >
                    <Gauge size={13} weight="regular" className="text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
                </button>
                {/* Tooltip on the right */}
                <span className="
                    absolute left-full top-1/2 -translate-y-1/2 ml-2
                    rtl:left-auto rtl:right-full rtl:ml-0 rtl:mr-2
                    px-2 py-1 rounded-md
                    bg-blue-500 dark:bg-blue-600 text-white
                    text-[10px] font-medium whitespace-nowrap
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 ease-out
                    z-[9999] pointer-events-none
                    shadow-lg
                ">
                    {t('edit')}
                </span>
            </div>

            {/* Settings Popup */}
            {showSettings && (
                <div
                    ref={settingsRef}
                    className="absolute left-full rtl:left-auto rtl:right-full ml-2 rtl:ml-0 rtl:mr-2 top-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2.5 z-50 min-w-[200px] max-h-[400px] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Pages Section */}
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider px-1">{t('pages')}</p>
                    <div className="space-y-0.5 mb-3">
                        {ALL_QUICK_NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isEnabled = quickNavItems.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => toggleQuickNavItem(item.id)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-150
                                        ${isEnabled
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <Icon size={14} weight={isEnabled ? 'fill' : 'regular'} />
                                    <span className="flex-1 text-left truncate">{t(item.label)}</span>
                                    {isEnabled && <CheckSquare size={12} weight="fill" className="text-blue-500 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Boards Section */}
                    {boards.length > 0 && (
                        <>
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider px-1 border-t border-gray-100 dark:border-gray-700 pt-2">{t('boards')}</p>
                            <div className="space-y-0.5">
                                {boards.map((board) => {
                                    const BoardIcon = getBoardIcon(board.icon);
                                    const isEnabled = quickNavItems.includes(`board-${board.id}`);
                                    return (
                                        <button
                                            key={`board-${board.id}`}
                                            onClick={() => toggleQuickNavItem(`board-${board.id}`)}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-150
                                                ${isEnabled
                                                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                }`}
                                        >
                                            <BoardIcon size={14} weight={isEnabled ? 'fill' : 'regular'} />
                                            <span className="flex-1 text-left truncate">{board.name}</span>
                                            {isEnabled && <CheckSquare size={12} weight="fill" className="text-purple-500 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Expand button at bottom */}
            <div className="group relative mt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onExpandSidebar();
                    }}
                    title={t('expand_sidebar')}
                    className="w-7 h-7 rounded-full flex items-center justify-center
                        bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700
                        text-gray-400 hover:text-gray-500 dark:hover:text-gray-300
                        transition-all duration-200 hover:shadow-sm"
                >
                    <CaretRight size={13} weight="bold" />
                </button>
                {/* Tooltip on the right */}
                <span className="
                    absolute left-full top-1/2 -translate-y-1/2 ml-2
                    rtl:left-auto rtl:right-full rtl:ml-0 rtl:mr-2
                    px-2 py-1 rounded-md
                    bg-blue-500 dark:bg-blue-600 text-white
                    text-[10px] font-medium whitespace-nowrap
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 ease-out
                    z-[9999] pointer-events-none
                    shadow-lg
                ">
                    {t('open')}
                </span>
            </div>
        </div>
    );
};

// Export function to get/set quick nav settings (for use in settings page)
export const getQuickNavSettings = (): string[] => {
    const saved = localStorage.getItem('sidebar-quick-nav-items');
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_NAV;
};

export const setQuickNavSettings = (items: string[]): void => {
    localStorage.setItem('sidebar-quick-nav-items', JSON.stringify(items));
    // Dispatch event to notify sidebar of changes
    window.dispatchEvent(new CustomEvent('quicknav-settings-changed', { detail: items }));
};

export const getAllQuickNavOptions = () => ALL_QUICK_NAV_ITEMS;

interface SidebarProps {
    onNavigate: (view: ViewState | string, boardId?: string) => void;
    activeView: ViewState | string;
    activeBoardId: string | null;
    width: number;
    onResize: (newWidth: number) => void;
    workspaces: Workspace[];
    activeWorkspaceId: string;
    onWorkspaceChange: (id: string) => void;
    onAddWorkspace: (name: string, icon: string, color?: string) => void;
    onRenameWorkspace: (id: string, name: string, icon: string, color?: string) => void;
    onDeleteWorkspace: (id: string) => void;
    boards: Board[];
    onDeleteBoard: (id: string, mode?: 'single' | 'recursive') => void;
    onToggleFavorite: (id: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onAddBoard: (name: string, icon: string, template?: BoardTemplate, defaultView?: string, parentId?: string) => void;
    pageVisibility: Record<string, boolean>;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
    onNavigate, activeView, activeBoardId, width, onResize,
    workspaces, activeWorkspaceId, onWorkspaceChange, onAddWorkspace, onRenameWorkspace, onDeleteWorkspace,
    boards, onDeleteBoard, onToggleFavorite,
    isCollapsed, onToggleCollapse, onAddBoard, pageVisibility
}) => {
    const { t, dir } = useAppContext();
    const [isResizing, setIsResizing] = useState(false);
    const [initialMouseX, setInitialMouseX] = useState(0);
    const [initialWidth, setInitialWidth] = useState(width);
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
    const [isAddWorkspaceModalOpen, setIsAddWorkspaceModalOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [addMenuPos, setAddMenuPos] = useState<{ top?: number, bottom?: number, left: number }>({ top: 0, left: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, boardId: string } | null>(null);
    const [workspaceContextMenu, setWorkspaceContextMenu] = useState<{ x: number, y: number, workspaceId: string } | null>(null);
    const [isBoardHovered, setIsBoardHovered] = useState(false);
    const [isDashboardHovered, setIsDashboardHovered] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);

    // Departments State
    const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('expandedDepartments');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        localStorage.setItem('expandedDepartments', JSON.stringify(Array.from(expandedDepartments)));
    }, [expandedDepartments]);

    const toggleDepartment = (deptId: string) => {
        const newExpanded = new Set(expandedDepartments);
        if (newExpanded.has(deptId)) {
            newExpanded.delete(deptId);
        } else {
            newExpanded.add(deptId);
        }
        setExpandedDepartments(newExpanded);
    };

    const addMenuRef = useRef<HTMLDivElement>(null);
    const addButtonRef = useRef<HTMLButtonElement>(null);

    // New Workspace State
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newWorkspaceIcon, setNewWorkspaceIcon] = useState('Briefcase');
    const [isWorkspaceIconPickerOpen, setIsWorkspaceIconPickerOpen] = useState(false);
    const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);

    // New Board State
    const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardIcon, setNewBoardIcon] = useState('Table');

    // Delete Board Modal State
    const [isDeleteBoardModalOpen, setIsDeleteBoardModalOpen] = useState(false);

    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [creationStep, setCreationStep] = useState<'template' | 'details'>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | undefined>(undefined);
    const [selectedLayout, setSelectedLayout] = useState<'table' | 'data_table' | 'datatable' | 'kanban' | 'list'>('table');
    const [parentBoardIdForCreation, setParentBoardIdForCreation] = useState<string | undefined>(undefined);
    // Quick add menu that appears inline on the + button
    const [quickAddMenu, setQuickAddMenu] = useState<{ x: number; y: number; parentId: string } | null>(null);
    const [expandedBoards, setExpandedBoards] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('expandedBoards');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        localStorage.setItem('expandedBoards', JSON.stringify(Array.from(expandedBoards)));
    }, [expandedBoards]);

    const toggleExpand = (boardId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedBoards);
        if (newExpanded.has(boardId)) {
            newExpanded.delete(boardId);
        } else {
            newExpanded.add(boardId);
        }
        setExpandedBoards(newExpanded);
    };

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || {
        id: 'loading',
        name: 'Loading...',
        icon: 'Briefcase',
        color: 'from-gray-400 to-gray-500'
    };
    // boards prop is already filtered by activeWorkspaceId in App.tsx, so use it directly
    const workspaceBoards = boards;
    const favoriteBoards = boards.filter(b => b.isFavorite);

    // Close menus on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            setContextMenu(null);
            setWorkspaceContextMenu(null);
            setIsWorkspaceMenuOpen(false);

            if (
                isAddMenuOpen &&
                addMenuRef.current &&
                !addMenuRef.current.contains(e.target as Node) &&
                addButtonRef.current &&
                !addButtonRef.current.contains(e.target as Node)
            ) {
                setIsAddMenuOpen(false);
            }
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [isAddMenuOpen]);

    // Resize Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const delta = dir === 'rtl'
                ? initialMouseX - e.clientX
                : e.clientX - initialMouseX;

            const newWidth = initialWidth + delta;

            if (newWidth > 200 && newWidth < 450) {
                onResize(newWidth);
            }
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, onResize, dir, initialMouseX, initialWidth, width]);

    const handleContextMenu = (e: React.MouseEvent, boardId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, boardId });
    };

    const handleWorkspaceContextMenu = (e: React.MouseEvent, workspaceId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setWorkspaceContextMenu({ x: e.clientX, y: e.clientY, workspaceId });
    }

    const handleCreateWorkspace = (e: React.FormEvent) => {
        e.preventDefault();
        if (newWorkspaceName.trim()) {
            // Find the index of the selected icon to determine the color
            const iconIndex = Object.keys(ICON_MAP).indexOf(newWorkspaceIcon);
            const gradients = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-orange-500 to-red-500',
                'from-green-500 to-emerald-500',
                'from-indigo-500 to-violet-500',
                'from-pink-500 to-rose-500',
                'from-teal-500 to-green-500',
                'from-amber-500 to-orange-500'
            ];
            const color = gradients[Math.max(0, iconIndex) % gradients.length];

            if (editingWorkspaceId) {
                onRenameWorkspace(editingWorkspaceId, newWorkspaceName, newWorkspaceIcon, color);
            } else {
                onAddWorkspace(newWorkspaceName, newWorkspaceIcon, color);
            }
            setIsAddWorkspaceModalOpen(false);
            setNewWorkspaceName('');
            setNewWorkspaceIcon('Briefcase');
            setEditingWorkspaceId(null);
        }
    };

    const handleCreateBoard = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBoardName.trim()) {
            onAddBoard(newBoardName, newBoardIcon, selectedTemplate, selectedLayout, parentBoardIdForCreation);

            // Auto-expand the parent board to show the new sub-board
            if (parentBoardIdForCreation) {
                setExpandedBoards(prev => {
                    const next = new Set(prev);
                    next.add(parentBoardIdForCreation);
                    return next;
                });
            }

            setIsNewBoardModalOpen(false);
            setNewBoardName('');
            setNewBoardIcon('Table');
            setSelectedLayout('table');
            setIsIconPickerOpen(false);
            setCreationStep('template'); // Reset for next time
            setSelectedTemplate(undefined);
            setParentBoardIdForCreation(undefined); // Reset parent selection
        }
    };

    const toggleAddMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAddMenuOpen) {
            setIsAddMenuOpen(false);
        } else {
            if (addButtonRef.current) {
                const rect = addButtonRef.current.getBoundingClientRect();
                const MENU_HEIGHT = 280; // Approximate height of the menu (input + layout grid + button + link)
                let top = rect.top; // Align with top of button
                const left = rect.right + 10; // Position to the right of the button with some gap

                // Adjust vertical position if it overflows the bottom
                if (top + MENU_HEIGHT > window.innerHeight) {
                    top = Math.max(10, window.innerHeight - MENU_HEIGHT - 10);
                }

                setAddMenuPos({ top, left });
            }
            setIsAddMenuOpen(true);
        }
    };

    const displayedWidth = isCollapsed ? 42 : width;
    const textBase = 'transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden';
    const textVisibility = isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100';

    return (
        <>
            {/* Main Sidebar Container */}
            <div
                className={`flex flex-col h-full min-h-0 flex-shrink-0 relative group/sidebar select-none bg-transparent rounded-r-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 ${isResizing ? '' : 'transition-[width] duration-300 ease-in-out will-change-[width]'}`}
                style={{
                    width: `${displayedWidth}px`
                }}
            >
                <div className="h-full min-h-0 flex flex-col">
                    {/* Content wrapper - hidden when collapsed */}
                    <div className={`h-full min-h-0 flex flex-col transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {/* 1. Top Navigation */}
                        <div className={`pt-3 pb-3 space-y-0.5 pl-5 pr-3 transition-[padding] duration-300`}>
                            <button
                                onClick={() => onNavigate('dashboard')}
                                title={t('home')}
                                className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 
                        ${activeView === 'dashboard'
                                        ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                        `}
                            >
                                <House size={17} weight="light" className="flex-shrink-0" />
                                <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('home')}</span>
                            </button>
                            {pageVisibility['flow_hub'] !== false && (
                                <button
                                    onClick={() => onNavigate('flow_hub')}
                                    title={t('flow_hub')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 
                            ${activeView === 'flow_hub'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                            `}
                                >
                                    <Sparkle size={17} weight="light" className="flex-shrink-0" />
                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('flow_hub')}</span>
                                </button>
                            )}
                            {pageVisibility['process_map'] !== false && (
                                <button
                                    onClick={() => onNavigate('process_map')}
                                    title={t('process_map')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 
                            ${activeView === 'process_map'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                            `}
                                >
                                    <Activity size={17} weight="light" className="flex-shrink-0" />
                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('process_map')}</span>
                                </button>
                            )}
                            {pageVisibility['my_work'] !== false && (
                                <button
                                    onClick={() => onNavigate('my_work')}
                                    title={t('my_work')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 
                            ${activeView === 'my_work'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                            `}
                                >
                                    <SquaresFour size={17} weight="light" className="flex-shrink-0" />
                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('my_work')}</span>
                                </button>
                            )}

                            {/* New Pages */}
                            {pageVisibility['inbox'] !== false && (
                                <button
                                    onClick={() => onNavigate('inbox')}
                                    title={t('inbox')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 
                            ${activeView === 'inbox'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                            `}
                                >
                                    <Tray size={17} weight="light" className="flex-shrink-0" />
                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('inbox')}</span>
                                </button>
                            )}
                            {pageVisibility['talk'] !== false && (
                                <button
                                    onClick={() => onNavigate('talk')}
                                    title={t('talk')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 
                            ${activeView === 'talk'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                            `}
                                >
                                    <ChatCircleText size={17} weight="light" className="flex-shrink-0" />
                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('talk')}</span>
                                </button>
                            )}

                            {pageVisibility['teams'] !== false && (
                                <button
                                    onClick={() => onNavigate('teams')}
                                    title={t('teams')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 
                            ${activeView === 'teams'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                            `}
                                >
                                    <Users size={17} weight="light" className="flex-shrink-0" />
                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('teams')}</span>
                                </button>
                            )}
                            {pageVisibility['vault'] !== false && (
                                <button
                                    onClick={() => onNavigate('vault')}
                                    title={t('vault')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 
                            ${activeView === 'vault'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                            `}
                                >
                                    <Lock size={17} weight="light" className="flex-shrink-0" />
                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('vault')}</span>
                                </button>
                            )}
                            {pageVisibility['test_tools'] !== false && (
                                <button
                                    onClick={() => onNavigate('test')}
                                    title={t('test_tools')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300
                            ${activeView === 'test'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}
                            `}
                                >
                                    <Flask size={17} weight="light" className="flex-shrink-0" />
                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('test_tools')}</span>
                                </button>
                            )}
                        </div>

                        {/* Separator - only show if departments are visible */}
                        {pageVisibility['mini_company'] !== false && (
                            <div className="border-t border-gray-100 dark:border-monday-dark-border my-2 mx-6"></div>
                        )}

                        {/* 2. Scrollable Content */}
                        <div className={`flex-1 min-h-0 overflow-y-auto py-2 no-scrollbar pl-5 pr-3 transition-[padding] duration-300`}>

                            {/* Departments Section */}
                            {pageVisibility['mini_company'] !== false && (
                                <div className="mb-3">
                                    {!isCollapsed && (
                                        <div className="flex items-center justify-between mb-2 px-3">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary truncate">{t('departments')}</span>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        {/* Overview */}
                                        <div className="mb-1">
                                            <div
                                                className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2] transition-all duration-300`}
                                                onClick={() => !isCollapsed && toggleDepartment('mini_overview')}
                                                title={t('overview')}
                                            >
                                                <Layout size={17} weight="light" className="flex-shrink-0" />
                                                <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('overview')}</span>
                                                <CaretDown size={14} weight="light" className={`text-gray-400 transition-all duration-300 flex-shrink-0 ${expandedDepartments.has('mini_overview') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                            </div>
                                            {expandedDepartments.has('mini_overview') && !isCollapsed && (
                                                <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                                    <button onClick={() => onNavigate('dashboards')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'dashboards' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Layout size={14} weight="light" /> <span>{t('dashboards')}</span>
                                                    </button>
                                                    <button onClick={() => onNavigate('reports')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'reports' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <FileText size={14} weight="light" /> <span>{t('reports')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Operations */}
                                        <div className="mb-1">
                                            <div
                                                className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2] transition-all duration-300`}
                                                onClick={() => !isCollapsed && toggleDepartment('mini_operations')}
                                                title={t('operations')}
                                            >
                                                <Factory size={17} weight="light" className="flex-shrink-0" />
                                                <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('operations')}</span>
                                                <CaretDown size={14} weight="light" className={`text-gray-400 transition-all duration-300 flex-shrink-0 ${expandedDepartments.has('mini_operations') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                            </div>
                                            {expandedDepartments.has('mini_operations') && !isCollapsed && (
                                                <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                                    <button onClick={() => onNavigate('sales')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Megaphone size={14} weight="light" /> <span>{t('sales')}</span>
                                                    </button>
                                                    <button onClick={() => onNavigate('purchases')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'purchases' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <ShoppingCart size={14} weight="light" /> <span>{t('purchases')}</span>
                                                    </button>
                                                    <button onClick={() => onNavigate('inventory')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'inventory' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Package size={14} weight="light" /> <span>{t('stock_inventory')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Finance */}
                                        <div className="mb-1">
                                            <div
                                                className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2] transition-all duration-300`}
                                                onClick={() => !isCollapsed && toggleDepartment('mini_finance')}
                                                title={t('finance')}
                                            >
                                                <Money size={17} weight="light" className="flex-shrink-0" />
                                                <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('finance')}</span>
                                                <CaretDown size={14} weight="light" className={`text-gray-400 transition-all duration-300 flex-shrink-0 ${expandedDepartments.has('mini_finance') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                            </div>
                                            {expandedDepartments.has('mini_finance') && !isCollapsed && (
                                                <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                                    <button onClick={() => onNavigate('expenses')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'expenses' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Money size={14} weight="light" /> <span>{t('expenses')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* People */}
                                        <div className="mb-1">
                                            <div
                                                className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2] transition-all duration-300`}
                                                onClick={() => !isCollapsed && toggleDepartment('mini_people')}
                                                title={t('people')}
                                            >
                                                <UsersThree size={17} weight="light" className="flex-shrink-0" />
                                                <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('people')}</span>
                                                <CaretDown size={14} weight="light" className={`text-gray-400 transition-all duration-300 flex-shrink-0 ${expandedDepartments.has('mini_people') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                            </div>
                                            {expandedDepartments.has('mini_people') && !isCollapsed && (
                                                <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                                    <button onClick={() => onNavigate('customers')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'customers' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Users size={14} weight="light" /> <span>{t('customers')}</span>
                                                    </button>
                                                    <button onClick={() => onNavigate('suppliers')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'suppliers' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Truck size={14} weight="light" /> <span>{t('suppliers')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Supply Chain */}
                                        {pageVisibility['supply_chain'] !== false && (
                                            <div className="mb-1">
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2] transition-all duration-300`}
                                                    onClick={() => !isCollapsed && toggleDepartment('supply_chain')}
                                                    title={t('supply_chain')}
                                                >
                                                    <Package size={17} weight="light" className="flex-shrink-0" />
                                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('supply_chain')}</span>
                                                    <CaretDown size={14} weight="light" className={`text-gray-400 transition-all duration-300 flex-shrink-0 ${expandedDepartments.has('supply_chain') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                </div>
                                                {expandedDepartments.has('supply_chain') && !isCollapsed && (
                                                    <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                                        {pageVisibility['procurement'] !== false && (
                                                            <button onClick={() => onNavigate('procurement')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'procurement' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <ShoppingCart size={14} weight="light" /> <span>{t('procurement')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['warehouse'] !== false && (
                                                            <button onClick={() => onNavigate('warehouse')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'warehouse' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <House size={14} weight="light" /> <span>{t('warehouse')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['fleet'] !== false && (
                                                            <button onClick={() => onNavigate('fleet')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'fleet' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Truck size={14} weight="light" /> <span>{t('fleet')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['vendors'] !== false && (
                                                            <button onClick={() => onNavigate('vendors')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'vendors' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <UsersThree size={14} weight="light" /> <span>{t('vendors')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['planning'] !== false && (
                                                            <button onClick={() => onNavigate('planning')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'planning' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Gauge size={14} weight="light" /> <span>{t('planning')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Manufacturing (Legacy Operations) */}
                                        {pageVisibility['operations'] !== false && (
                                            <div className="mb-1">
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2] transition-all duration-300`}
                                                    onClick={() => !isCollapsed && toggleDepartment('operations')}
                                                    title={t('manufacturing')}
                                                >
                                                    <Factory size={17} weight="light" className="flex-shrink-0" />
                                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('manufacturing')}</span>
                                                    <CaretDown size={14} weight="light" className={`text-gray-400 transition-all duration-300 flex-shrink-0 ${expandedDepartments.has('operations') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                </div>
                                                {expandedDepartments.has('operations') && !isCollapsed && (
                                                    <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                                        {pageVisibility['maintenance'] !== false && (
                                                            <button onClick={() => onNavigate('maintenance')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'maintenance' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Wrench size={14} /> <span>{t('maintenance')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['production'] !== false && (
                                                            <button onClick={() => onNavigate('production')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'production' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Factory size={14} /> <span>{t('production')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['quality'] !== false && (
                                                            <button onClick={() => onNavigate('quality')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'quality' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <ShieldCheck size={14} weight="light" /> <span>{t('quality')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Business */}
                                        {pageVisibility['business'] !== false && (
                                            <div className="mb-1">
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2] transition-all duration-300`}
                                                    onClick={() => !isCollapsed && toggleDepartment('business')}
                                                    title={t('business')}
                                                >
                                                    <Buildings size={17} weight="light" className="flex-shrink-0" />
                                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('business')}</span>
                                                    <CaretDown size={14} weight="light" className={`text-gray-400 transition-all duration-300 flex-shrink-0 ${expandedDepartments.has('business') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                </div>
                                                {expandedDepartments.has('business') && !isCollapsed && (
                                                    <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                                        {pageVisibility['sales_listing'] !== false && (
                                                            <button onClick={() => onNavigate('sales_listing')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales_listing' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Table size={14} weight="light" /> <span>{t('sales_listings')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['sales_factory'] !== false && (
                                                            <button onClick={() => onNavigate('sales_factory')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales_factory' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Factory size={14} /> <span>{t('sales_factory')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Business Support */}
                                        {pageVisibility['business_support'] !== false && (
                                            <div className="mb-1">
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2] transition-all duration-300`}
                                                    onClick={() => !isCollapsed && toggleDepartment('business_support')}
                                                    title={t('business_support')}
                                                >
                                                    <Users size={17} weight="light" className="flex-shrink-0" />
                                                    <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('business_support')}</span>
                                                    <CaretDown size={14} weight="light" className={`text-gray-400 transition-all duration-300 flex-shrink-0 ${expandedDepartments.has('business_support') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                </div>
                                                {expandedDepartments.has('business_support') && !isCollapsed && (
                                                    <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                                        {pageVisibility['it_support'] !== false && (
                                                            <button onClick={() => onNavigate('it_support')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'it_support' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Monitor size={14} /> <span>{t('it')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['hr'] !== false && (
                                                            <button onClick={() => onNavigate('hr')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'hr' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <UsersThree size={14} weight="light" /> <span>{t('hr')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['marketing'] !== false && (
                                                            <button onClick={() => onNavigate('marketing')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[14px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'marketing' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Megaphone size={14} /> <span>{t('marketing')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Favorites Section */}
                            {!isCollapsed && favoriteBoards.length > 0 && (
                                <div className="mb-6 mt-6">
                                    <div className="flex items-center mb-2 px-3 group cursor-pointer hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-sm py-1">
                                        <span className="text-[14px] font-bold text-gray-700 dark:text-monday-dark-text-secondary flex items-center gap-1.5 w-full">
                                            {t('favorites')} <CaretRight size={14} weight="light" className="text-gray-400" />
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {favoriteBoards.map(board => (
                                            <div
                                                key={board.id}
                                                onClick={() => onNavigate('board', board.id)}
                                                className={`flex items-center justify-between px-3 py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text`}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-monday-blue"></div>
                                                <span className="text-[14px] truncate flex-1">{board.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Separator before Workspaces */}
                            <div className="border-t border-gray-100 dark:border-monday-dark-border mt-3 mb-5 mx-3"></div>

                            {/* Workspaces Header */}
                            <div className="mt-0 relative">
                                {!isCollapsed && (
                                    <div className="flex items-center justify-between mb-2 px-3">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary truncate">{t('workspaces')}</span>
                                        <div className="flex space-x-1 rtl:space-x-reverse flex-shrink-0">
                                            <MagnifyingGlass size={14} weight="light" className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
                                        </div>
                                    </div>
                                )}

                                {/* Active Workspace Card */}
                                <div className="relative group/workspace-card">
                                    <div
                                        onClick={(e) => {
                                            if (isCollapsed) return;
                                            e.stopPropagation();
                                            setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen);
                                        }}
                                        className={`relative border border-gray-200 dark:border-monday-dark-border bg-gray-50/50 dark:bg-monday-dark-surface hover:bg-gray-100/80 dark:hover:bg-monday-dark-hover rounded-md py-1.5 flex items-center cursor-pointer transition-all duration-300 ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-md bg-gradient-to-tr ${activeWorkspace.color} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                            {(() => {
                                                const WorkspaceIcon = ICON_MAP[activeWorkspace.icon];
                                                return WorkspaceIcon ? <WorkspaceIcon size={14} weight="bold" /> : activeWorkspace.name.charAt(0);
                                            })()}
                                        </div>
                                        <span className={`font-medium text-[14px] text-[#323338] dark:text-[#dcdde2] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{activeWorkspace.name}</span>

                                        {!isCollapsed && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    ref={addButtonRef}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleAddMenu(e);
                                                    }}
                                                    title={t('add_new')}
                                                    className="p-1 rounded hover:bg-monday-blue hover:text-white text-gray-400 transition-all duration-200"
                                                >
                                                    <Plus size={14} weight="bold" />
                                                </button>
                                                <div
                                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 cursor-pointer p-0.5 rounded hover:bg-gray-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen);
                                                    }}
                                                >
                                                    <CaretDown size={14} weight="light" className={`transition-transform duration-200 ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add New Menu - Simple Board Creator */}
                                    {isAddMenuOpen && (
                                        <div
                                            ref={addMenuRef}
                                            className="fixed bg-white dark:bg-monday-dark-surface shadow-xl rounded-lg border border-gray-200 dark:border-monday-dark-border z-[100] animate-in fade-in zoom-in-95 duration-100 min-w-[200px] w-auto overflow-hidden"
                                            style={{
                                                top: addMenuPos.top,
                                                left: addMenuPos.left
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (newBoardName.trim()) {
                                                        const iconMap: Record<string, string> = { table: 'Table', datatable: 'Database', kanban: 'Kanban', gtd: 'CheckSquare' };
                                                        // Default to active workspace
                                                        const workspaceId = activeWorkspaceId;
                                                        // We can't easily pass workspaceId to onAddBoard if it doesn't accept it, 
                                                        // but onAddBoard likely handles current workspace internally or we need to check its signature.
                                                        // Looking at SidebarProps: onAddBoard: (name, icon, template, defaultView, parentId)
                                                        // It doesn't take workspaceId. It assumes active workspace.

                                                        onAddBoard(
                                                            newBoardName.trim(),
                                                            iconMap[selectedLayout] || 'Table',
                                                            undefined,
                                                            selectedLayout as any,
                                                            undefined
                                                        );

                                                        setNewBoardName('');
                                                        setSelectedLayout('table');
                                                        setIsAddMenuOpen(false);
                                                    }
                                                }}
                                                className="p-3"
                                            >
                                                <div className="mb-3">
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        value={newBoardName}
                                                        onChange={(e) => setNewBoardName(e.target.value)}
                                                        placeholder={t('board_name_placeholder')}
                                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-monday-dark-border rounded-md bg-gray-50 dark:bg-monday-dark-bg focus:outline-none focus:ring-1 focus:ring-monday-blue focus:border-monday-blue transition-shadow"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-1 mb-3">
                                                    {[
                                                        { id: 'table', label: t('table'), icon: Table },
                                                        { id: 'datatable', label: t('data'), icon: Database },
                                                        { id: 'kanban', label: t('kanban'), icon: Kanban },
                                                        { id: 'gtd', label: t('gtd_system'), icon: CheckSquare }
                                                    ].map((layout) => (
                                                        <button
                                                            key={layout.id}
                                                            type="button"
                                                            onClick={() => setSelectedLayout(layout.id as any)}
                                                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] font-medium transition-all ${selectedLayout === layout.id
                                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-800'
                                                                : 'bg-gray-50 dark:bg-monday-dark-hover text-gray-500 dark:text-gray-400 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            <layout.icon size={16} weight={selectedLayout === layout.id ? "fill" : "regular"} />
                                                            <span>{layout.label}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={!newBoardName.trim()}
                                                    className="w-full py-1.5 bg-monday-blue text-white text-xs font-semibold rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm"
                                                >
                                                    {t('create_board')}
                                                </button>

                                                {/* Small option to add workspace if needed, minimal footprint */}
                                                <div className="mt-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsAddWorkspaceModalOpen(true);
                                                            setIsAddMenuOpen(false);
                                                        }}
                                                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        or create workspace
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>

                                {/* Workspace Dropdown */}
                                {isWorkspaceMenuOpen && !isCollapsed && (
                                    <div className="absolute top-full start-0 w-full bg-white dark:bg-monday-dark-surface shadow-xl rounded-sm border border-gray-100 dark:border-monday-dark-border z-50 mt-1 py-1 max-h-64 overflow-y-auto">
                                        {workspaces.map(ws => (
                                            <div
                                                key={ws.id}
                                                className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-monday-dark-hover cursor-pointer flex items-center justify-between group"
                                                onClick={() => {
                                                    onWorkspaceChange(ws.id);
                                                    setIsWorkspaceMenuOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className={`w-5 h-5 rounded-sm bg-gradient-to-tr ${ws.color} text-white flex items-center justify-center text-[10px]`}>
                                                        {(() => {
                                                            const WorkspaceIcon = ICON_MAP[ws.icon];
                                                            return WorkspaceIcon ? <WorkspaceIcon size={12} weight="bold" /> : ws.name.charAt(0);
                                                        })()}
                                                    </div>
                                                    <span className={`text-[14px] truncate ${ws.id === activeWorkspaceId ? 'font-medium text-monday-blue' : 'text-gray-600 dark:text-monday-dark-text'}`}>
                                                        {ws.name}
                                                    </span>
                                                </div>
                                                <div
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-monday-dark-hover rounded-sm text-gray-500 dark:text-gray-400"
                                                    onClick={(e) => handleWorkspaceContextMenu(e, ws.id)}
                                                >
                                                    <DotsThree size={12} weight="light" />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t border-gray-100 dark:border-monday-dark-border mt-1 pt-1">
                                            <button
                                                onClick={() => {
                                                    setIsAddWorkspaceModalOpen(true);
                                                    setIsWorkspaceMenuOpen(false);
                                                }}
                                                className="w-full text-start px-3 py-2 text-[14px] text-gray-500 dark:text-monday-dark-text-secondary hover:bg-gray-50 dark:hover:bg-monday-dark-hover hover:text-monday-blue flex items-center gap-2"
                                            >
                                                <Plus size={14} weight="light" /> {t('add_workspace')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Boards List */}
                            <div className="mt-2 space-y-1">
                                {(() => {
                                    const renderBoardItem = (board: Board, level: number = 0) => {
                                        const isActive = activeView === 'board' && activeBoardId === board.id;
                                        const subBoards = workspaceBoards.filter(b => b.parentId === board.id);
                                        const hasChildren = subBoards.length > 0;
                                        const isChild = level > 0;
                                        const isExpanded = expandedBoards.has(board.id);

                                        return (
                                            <div key={board.id} className="relative">
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} py-1.5 rounded-sm cursor-pointer group transition-all duration-300 select-none
                                                ${isActive ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10' : 'hover:bg-white/40 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}
                                                ${isChild ? 'ml-3' : ''}
                                            `}
                                                    onClick={() => onNavigate('board', board.id)}
                                                    title={board.name}
                                                >
                                                    {/* Expand Arrow for parents */}
                                                    {!isCollapsed && hasChildren ? (
                                                        <div
                                                            onClick={(e) => toggleExpand(board.id, e)}
                                                            className="p-0.5 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors flex-shrink-0"
                                                        >
                                                            <CaretRight size={12} weight="light" className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </div>
                                                    ) : null}

                                                    {React.createElement(ICON_MAP[board.icon || 'Table'] || Table, {
                                                        size: isChild ? 14 : 17,
                                                        className: `${isActive ? 'text-monday-blue' : ''} flex-shrink-0`
                                                    })}
                                                    <span className={`font-normal text-[13px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{board.name}</span>

                                                    {/* Action buttons - absolutely positioned on right */}
                                                    {!isCollapsed && (
                                                        <div className="flex items-center gap-0.5">
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                                                                    setQuickAddMenu({ x: rect.right + 4, y: rect.top, parentId: board.id });
                                                                }}
                                                                className={`p-1 rounded-sm hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-monday-dark-border text-gray-400 invisible group-hover:visible`}
                                                                title={t('add_sub_board')}
                                                            >
                                                                <Plus size={14} weight="light" />
                                                            </div>
                                                            <div
                                                                onClick={(e) => handleContextMenu(e, board.id)}
                                                                className={`p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-monday-dark-border text-gray-400 ${isActive ? 'visible' : 'invisible group-hover:visible'}`}
                                                                title={t('more_options')}
                                                            >
                                                                <DotsThree size={14} weight="bold" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {hasChildren && !isCollapsed && isExpanded && (
                                                    <div className="ml-4 pl-1 border-l border-gray-200 dark:border-monday-dark-border mt-0.5 space-y-0.5">
                                                        {subBoards.map(sb => renderBoardItem(sb, level + 1))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    };

                                    // Filter for root boards
                                    const rootBoards = workspaceBoards.filter(b => !b.parentId || !workspaceBoards.find(p => p.id === b.parentId));

                                    return rootBoards.map(board => renderBoardItem(board));
                                })()}
                            </div>
                        </div>

                        {/* Marketplace Section */}
                        {(pageVisibility['local_marketplace'] !== false || pageVisibility['foreign_marketplace'] !== false) && (
                            <div className="mt-6 pl-5 pr-3">
                                {!isCollapsed && (
                                    <div className="flex items-center mb-2 px-3">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary truncate">{t('marketplace').toUpperCase()}</span>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    {pageVisibility['local_marketplace'] !== false && (
                                        <button
                                            onClick={() => onNavigate('local_marketplace')}
                                            title={t('local_marketplace')}
                                            className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 ${activeView === 'local_marketplace' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}`}
                                        >
                                            <ShoppingCart size={17} weight="light" className="flex-shrink-0" />
                                            <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('local_marketplace')}</span>
                                        </button>
                                    )}
                                    {pageVisibility['foreign_marketplace'] !== false && (
                                        <button
                                            onClick={() => onNavigate('foreign_marketplace')}
                                            title={t('foreign_marketplace')}
                                            className={`flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} w-full py-1.5 rounded-sm transition-all duration-300 ${activeView === 'foreign_marketplace' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}`}
                                        >
                                            <Globe size={17} weight="light" className="flex-shrink-0" />
                                            <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('foreign_marketplace')}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div> {/* End of content wrapper */}

                    {/* Resize Drag Zone */}
                    {!isCollapsed && (
                        <div
                            className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-2 h-full cursor-col-resize hover:bg-monday-blue/20 transition-colors z-30"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setIsResizing(true);
                                setInitialMouseX(e.clientX);
                                setInitialWidth(width);
                            }}
                        ></div>
                    )}

                </div>

                {/* Collapse/Expand Button - OUTSIDE all content wrappers for guaranteed visibility */}
                <button
                    onClick={onToggleCollapse}
                    className={`absolute top-8 -right-3 rtl:right-auto rtl:-left-3 w-6 h-6 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-full flex items-center justify-center text-gray-400 hover:text-monday-blue shadow-md z-50 transition-all duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}`}
                >
                    {(isCollapsed && dir === 'ltr') || (!isCollapsed && dir === 'rtl') ? <CaretRight size={14} weight="light" /> : <CaretLeft size={14} weight="light" />}
                </button>

                {/* Board Context Menu */}
                {contextMenu && (
                    <div
                        className="fixed bg-white dark:bg-monday-dark-surface rounded-sm shadow-2xl border border-gray-100 dark:border-monday-dark-border w-56 py-2 z-[60] text-gray-700 dark:text-monday-dark-text animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: Math.min(contextMenu.y, window.innerHeight - 350), left: dir === 'rtl' ? (contextMenu.x - 224) : (contextMenu.x + 10) }}
                    >
                        <div className="px-3 py-1.5 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-monday-dark-hover cursor-pointer text-[14px]">
                            <ArrowSquareOut size={14} weight="light" className="text-gray-500 dark:text-gray-400" /> Open in new tab
                        </div>
                        {/* ... other context items would be translated similarly, omitting for brevity ... */}
                        <div className="h-px bg-gray-100 dark:bg-monday-dark-border my-1"></div>
                        <div
                            className="px-3 py-1.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 cursor-pointer text-[14px]"
                            onClick={() => {
                                setBoardToDelete(contextMenu.boardId);
                                setIsDeleteBoardModalOpen(true);
                                setContextMenu(null);
                            }}
                        >
                            <Trash size={14} weight="light" /> {t('delete')}
                        </div>
                    </div>
                )
                }

                <DeleteBoardModal
                    isOpen={isDeleteBoardModalOpen}
                    onClose={() => {
                        setIsDeleteBoardModalOpen(false);
                        setBoardToDelete(null);
                    }}
                    onConfirm={(mode) => {
                        if (boardToDelete) {
                            onDeleteBoard(boardToDelete, mode);
                        }
                        setIsDeleteBoardModalOpen(false);
                        setBoardToDelete(null);
                    }}
                    boardName={boards.find(b => b.id === boardToDelete)?.name || ''}
                    hasSubBoards={boards.some(b => b.parentId === boardToDelete)}
                />

                {/* Quick Add Board Menu - Small dropdown from + button */}
                {quickAddMenu && (
                    <div
                        className="fixed bg-white dark:bg-monday-dark-surface rounded-lg shadow-lg border border-gray-200 dark:border-monday-dark-border min-w-[200px] w-auto z-[70]"
                        style={{ top: quickAddMenu.y, left: quickAddMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (newBoardName.trim()) {
                                    const iconMap: Record<string, string> = { table: 'Table', datatable: 'Database', kanban: 'Kanban', gtd: 'CheckSquare' };
                                    const parentId = quickAddMenu.parentId;
                                    onAddBoard(newBoardName.trim(), iconMap[selectedLayout] || 'Table', undefined, selectedLayout as any, parentId);

                                    // Auto-expand the parent board to show the new sub-board
                                    if (parentId) {
                                        setExpandedBoards(prev => {
                                            const next = new Set(prev);
                                            next.add(parentId);
                                            return next;
                                        });
                                    }

                                    setNewBoardName('');
                                    setSelectedLayout('table');
                                    setQuickAddMenu(null);
                                }
                            }}
                            className="p-3"
                        >
                            <input
                                type="text"
                                autoFocus
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                placeholder={t('board_name_placeholder')}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-monday-dark-border rounded-md bg-gray-50 dark:bg-monday-dark-bg focus:outline-none focus:ring-1 focus:ring-monday-blue focus:border-monday-blue"
                            />

                            {/* Layout Type Selection */}
                            <div className="grid grid-cols-2 gap-1 mt-3">
                                {[
                                    { id: 'table', label: t('table'), icon: Table },
                                    { id: 'datatable', label: t('data'), icon: Database },
                                    { id: 'kanban', label: t('kanban'), icon: Kanban },
                                    { id: 'gtd', label: t('gtd_system'), icon: CheckSquare }
                                ].map((layout) => (
                                    <button
                                        key={layout.id}
                                        type="button"
                                        onClick={() => setSelectedLayout(layout.id as any)}
                                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md text-xs transition-all ${selectedLayout === layout.id
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'bg-gray-100 dark:bg-monday-dark-hover text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                            }`}
                                    >
                                        <layout.icon size={16} />
                                        <span>{layout.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuickAddMenu(null);
                                        setNewBoardName('');
                                        setSelectedLayout('table');
                                    }}
                                    className="flex-1 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newBoardName.trim()}
                                    className="flex-1 px-3 py-1.5 text-xs bg-monday-blue text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                {/* Click outside to close quick add menu */}
                {quickAddMenu && (
                    <div
                        className="fixed inset-0 z-[65]"
                        onClick={() => {
                            setQuickAddMenu(null);
                            setNewBoardName('');
                        }}
                    />
                )}

                {/* Workspace Context Menu */}
                {
                    workspaceContextMenu && (
                        <div
                            className="fixed bg-white dark:bg-monday-dark-surface rounded-sm shadow-2xl border border-gray-100 dark:border-monday-dark-border w-56 py-2 z-[60] text-gray-700 dark:text-monday-dark-text animate-in fade-in zoom-in-95 duration-100"
                            style={{ top: Math.min(workspaceContextMenu.y, window.innerHeight - 150), left: dir === 'rtl' ? (workspaceContextMenu.x - 224) : (workspaceContextMenu.x + 10) }}
                        >
                            <div
                                className="px-3 py-1.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover cursor-pointer text-[14px]"
                                onClick={() => {
                                    const ws = workspaces.find(w => w.id === workspaceContextMenu.workspaceId);
                                    if (ws) {
                                        setEditingWorkspaceId(ws.id);
                                        setNewWorkspaceName(ws.name);
                                        setNewWorkspaceIcon(ws.icon);
                                        setIsAddWorkspaceModalOpen(true);
                                    }
                                    setWorkspaceContextMenu(null);
                                }}
                            >
                                <Pencil size={14} weight="light" className="text-gray-500" /> Rename
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-monday-dark-border my-1"></div>
                            <div
                                className="px-3 py-1.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 cursor-pointer text-[14px]"
                                onClick={() => {
                                    if (workspaces.length <= 1) {
                                        alert(t('cannot_delete_only_workspace'));
                                        return;
                                    }
                                    setWorkspaceToDelete(workspaceContextMenu.workspaceId);
                                    setWorkspaceContextMenu(null);
                                }}
                            >
                                <Trash size={14} weight="light" /> {t('delete')}
                            </div>
                        </div>
                    )
                }



                {/* Create Workspace Modal */}
                {
                    isAddWorkspaceModalOpen && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] backdrop-blur-sm">
                            <div className="bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl w-[450px] border border-gray-100 dark:border-monday-dark-border">
                                <div className="p-5 border-b border-gray-100 dark:border-monday-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-monday-dark-bg/50 rounded-t-xl">
                                    <h3 className="font-semibold text-lg text-gray-800 dark:text-monday-dark-text">{editingWorkspaceId ? t('edit_workspace') : t('add_workspace')}</h3>
                                    <button onClick={() => {
                                        setIsAddWorkspaceModalOpen(false);
                                        setEditingWorkspaceId(null);
                                        setNewWorkspaceName('');
                                        setNewWorkspaceIcon('Briefcase');
                                    }} className="hover:bg-gray-200 dark:hover:bg-monday-dark-hover p-1 rounded-md transition-colors">
                                        <CaretDown className="rotate-180 text-gray-500" size={20} weight="light" />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateWorkspace} className="p-6 space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-monday-dark-text-secondary uppercase tracking-wider mb-2">Workspace Name</label>
                                        <input
                                            type="text"
                                            autoFocus
                                            value={newWorkspaceName}
                                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-monday-dark-border bg-white dark:bg-monday-dark-bg text-gray-800 dark:text-monday-dark-text rounded-sm p-3 text-[14px] focus:border-monday-blue focus:ring-2 focus:ring-monday-blue/20 outline-none transition-all duration-300 shadow-sm"
                                            placeholder="e.g. Marketing Team"
                                        />
                                    </div>

                                    {/* High Graphics Icon Picker */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-monday-dark-text-secondary uppercase tracking-wider mb-2">Workspace Icon</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsWorkspaceIconPickerOpen(!isWorkspaceIconPickerOpen)}
                                                className="w-full flex items-center justify-between p-3 rounded-sm border border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-bg hover:border-monday-blue dark:hover:border-monday-blue transition-all duration-300 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                                        {React.createElement(ICON_MAP[newWorkspaceIcon] || Briefcase, { size: 20 })}
                                                    </div>
                                                    <span className="font-medium text-gray-700 dark:text-gray-200">{newWorkspaceIcon}</span>
                                                </div>
                                                <CaretDown size={18} weight="light" className={`text-gray-400 transition-transform duration-300 ${isWorkspaceIconPickerOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isWorkspaceIconPickerOpen && (
                                                <div className="absolute bottom-full left-0 rtl:left-auto rtl:right-0 w-full mb-2 bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border shadow-2xl rounded-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                        {Object.keys(ICON_MAP).map((iconName, index) => {
                                                            // Generate a unique gradient for each icon based on index
                                                            const gradients = [
                                                                'from-blue-500 to-cyan-500',
                                                                'from-purple-500 to-pink-500',
                                                                'from-orange-500 to-red-500',
                                                                'from-green-500 to-emerald-500',
                                                                'from-indigo-500 to-violet-500',
                                                                'from-pink-500 to-rose-500',
                                                                'from-teal-500 to-green-500',
                                                                'from-amber-500 to-orange-500'
                                                            ];
                                                            const gradient = gradients[index % gradients.length];
                                                            const isSelected = newWorkspaceIcon === iconName;

                                                            return (
                                                                <button
                                                                    key={iconName}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewWorkspaceIcon(iconName);
                                                                        setIsWorkspaceIconPickerOpen(false);
                                                                    }}
                                                                    className={`
                                                                    aspect-square rounded-sm flex items-center justify-center transition-all duration-300
                                                                    bg-gradient-to-br ${gradient} text-white
                                                                    ${isSelected
                                                                            ? 'shadow-lg scale-110 ring-2 ring-offset-2 ring-blue-500'
                                                                            : 'opacity-70 hover:opacity-100 hover:scale-110 shadow-sm'}
                                                                `}
                                                                    title={iconName}
                                                                >
                                                                    {React.createElement(ICON_MAP[iconName], { size: 20 })}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-monday-dark-border">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddWorkspaceModalOpen(false);
                                                setEditingWorkspaceId(null);
                                                setNewWorkspaceName('');
                                                setNewWorkspaceIcon('Briefcase');
                                            }}
                                            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-sm text-[14px] font-medium transition-colors"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newWorkspaceName.trim()}
                                            className="px-6 py-2.5 bg-gradient-to-r from-monday-blue to-blue-600 text-white text-[14px] font-medium rounded-sm hover:shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:shadow-none transition-all duration-300"
                                        >
                                            {editingWorkspaceId ? t('save_changes') : t('create_workspace')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Create Board Modal */}
                {/* Create Board Modal */}
                {
                    isNewBoardModalOpen && (
                        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
                            <div className={`bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl transition-all duration-300 flex flex-col ${creationStep === 'template' ? 'w-[90vw] max-w-5xl h-[80vh]' : 'w-96 max-h-[90vh]'}`}>
                                {/* Header */}
                                <div className="p-5 border-b border-gray-100 dark:border-monday-dark-border flex justify-between items-center bg-white dark:bg-monday-dark-surface rounded-t-xl flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        {creationStep === 'details' && (
                                            <button
                                                onClick={() => setCreationStep('template')}
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-sm transition-colors group"
                                            >
                                                <CaretLeft size={20} weight="light" className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500" />
                                            </button>
                                        )}
                                        <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-100">
                                            {creationStep === 'template' ? t('new_board') : t('create_board')}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setIsNewBoardModalOpen(false)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-sm transition-colors text-gray-400 hover:text-gray-600"
                                    >
                                        <CaretDown className="rotate-180" size={20} weight="light" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                                    {creationStep === 'template' ? (
                                        <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900/50">
                                            {/* Start from scratch option + Picker */}
                                            <div className="flex-1 overflow-hidden p-4">
                                                <div className="mb-4 flex justify-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTemplate(undefined);
                                                            setNewBoardName('');
                                                            setCreationStep('details');
                                                        }}
                                                        className="text-[14px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
                                                    >
                                                        Start from scratch
                                                    </button>
                                                </div>
                                                <TemplatePicker
                                                    onSelect={(template) => {
                                                        setSelectedTemplate(template);
                                                        if (!newBoardName) setNewBoardName(template.name);
                                                        setCreationStep('details');
                                                    }}
                                                    selectedTemplateId={selectedTemplate?.id}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleCreateBoard} className="p-6 space-y-6">
                                            {/* Board Name Input */}
                                            <div className="space-y-2">
                                                <label className="block text-[14px] font-medium text-gray-700 dark:text-gray-300">
                                                    Board Name
                                                </label>
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={newBoardName}
                                                    onChange={(e) => setNewBoardName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-monday-dark-hover border border-gray-200 dark:border-monday-dark-border rounded-xl focus:ring-2 focus:ring-monday-blue/20 focus:border-monday-blue transition-all duration-300 outline-none font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                                                    placeholder="e.g. Q4 Marketing Plan"
                                                />
                                            </div>

                                            {/* Layout Selection */}
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{t('add_view')}</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'table', label: t('table'), icon: Table, description: t('spreadsheet_view') },
                                                        { id: 'kanban', label: t('kanban'), icon: Kanban, description: t('visual_workflow') },
                                                        { id: 'list', label: t('list'), icon: List, description: t('simple_list_desc') },
                                                        { id: 'calendar', label: t('calendar'), icon: CalendarBlank, description: t('schedule_tasks_desc') },
                                                        { id: 'gantt', label: t('gantt'), icon: ChartLineUp, description: t('visual_timeline_desc') },
                                                        { id: 'doc', label: t('doc'), icon: FileText, description: t('collaborate_docs_desc') },
                                                    ].map((tool) => (
                                                        <button
                                                            key={tool.id}
                                                            type="button"
                                                            onClick={() => setSelectedLayout(tool.id as any)}
                                                            className={`
                                                        relative flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all duration-300 group
                                                        ${selectedLayout === tool.id
                                                                    ? 'border-monday-blue bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                                                                    : 'border-transparent bg-gray-50 dark:bg-monday-dark-hover hover:scale-[1.02]'}
                                                    `}
                                                        >
                                                            <div className={`
                                                        w-8 h-8 rounded-sm flex items-center justify-center transition-colors
                                                        ${selectedLayout === tool.id ? 'bg-monday-blue text-white' : 'bg-white dark:bg-monday-dark-surface text-gray-500'}
                                                    `}>
                                                                <tool.icon size={16} />
                                                            </div>
                                                            <div>
                                                                <h4 className={`font-bold text-[14px] ${selectedLayout === tool.id ? 'text-monday-blue' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                    {tool.label}
                                                                </h4>
                                                                <p className="text-[10px] text-gray-500 font-medium truncate">
                                                                    {tool.description}
                                                                </p>
                                                            </div>
                                                            {selectedLayout === tool.id && (
                                                                <div className="absolute top-2 right-2 text-monday-blue">
                                                                    <CheckSquare size={14} weight="fill" className="fill-current" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Icon Picker */}
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Board Icon</label>

                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface hover:border-gray-300 transition-all duration-300 group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {(() => {
                                                                // Calculate gradient for current icon
                                                                const iconIndex = Object.keys(ICON_MAP).indexOf(newBoardIcon);
                                                                const gradients = [
                                                                    'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-orange-500 to-red-500',
                                                                    'from-green-500 to-emerald-500', 'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
                                                                    'from-teal-500 to-green-500', 'from-amber-500 to-orange-500'
                                                                ];
                                                                const gradient = gradients[Math.max(0, iconIndex) % gradients.length];
                                                                return (
                                                                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-white bg-gradient-to-br ${gradient} shadow-md`}>
                                                                        {React.createElement(ICON_MAP[newBoardIcon] || Table, { size: 20 })}
                                                                    </div>
                                                                );
                                                            })()}
                                                            <div className="text-left">
                                                                <div className="text-[14px] font-semibold text-gray-700 dark:text-gray-200">{newBoardIcon}</div>
                                                                <div className="text-xs text-gray-400">Click to change icon</div>
                                                            </div>
                                                        </div>
                                                        <CaretDown size={18} weight="light" className={`text-gray-400 transition-transform duration-300 ${isIconPickerOpen ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {isIconPickerOpen && (
                                                        <div className="absolute bottom-full left-0 rtl:left-auto rtl:right-0 w-full mb-2 bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border shadow-2xl rounded-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-300">
                                                            <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                                {Object.keys(ICON_MAP).map((iconName, index) => {
                                                                    const gradients = [
                                                                        'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-orange-500 to-red-500',
                                                                        'from-green-500 to-emerald-500', 'from-indigo-500 to-violet-500', 'from-pink-500 to-rose-500',
                                                                        'from-teal-500 to-green-500', 'from-amber-500 to-orange-500'
                                                                    ];
                                                                    const gradient = gradients[index % gradients.length];
                                                                    const isSelected = newBoardIcon === iconName;

                                                                    return (
                                                                        <button
                                                                            key={iconName}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setNewBoardIcon(iconName);
                                                                                setIsIconPickerOpen(false);
                                                                            }}
                                                                            className={`
                                                                            aspect-square rounded-sm flex items-center justify-center transition-all duration-300
                                                                            bg-gradient-to-br ${gradient} text-white
                                                                            ${isSelected
                                                                                    ? 'shadow-lg scale-110 ring-2 ring-offset-2 ring-blue-500'
                                                                                    : 'opacity-70 hover:opacity-100 hover:scale-110 shadow-sm'}
                                                                        `}
                                                                            title={iconName}
                                                                        >
                                                                            {React.createElement(ICON_MAP[iconName], { size: 20 })}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-monday-dark-border mt-6">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsNewBoardModalOpen(false)}
                                                    className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-monday-dark-hover rounded-sm text-[14px] font-medium transition-colors"
                                                >
                                                    {t('cancel')}
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={!newBoardName.trim()}
                                                    className="px-6 py-2.5 bg-gradient-to-r from-monday-blue to-blue-600 text-white text-[14px] font-medium rounded-sm hover:shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:shadow-none transition-all duration-300"
                                                >
                                                    {t('create_board')}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Workspace Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={!!workspaceToDelete}
                    onClose={() => setWorkspaceToDelete(null)}
                    onConfirm={() => {
                        if (workspaceToDelete) {
                            onDeleteWorkspace(workspaceToDelete);
                            setWorkspaceToDelete(null);
                        }
                    }}
                    title={t('delete_workspace')}
                    message={t('delete_workspace_confirm')}
                />

                {/* Quick Navigation Icons - Shown inside sidebar when collapsed */}
                {isCollapsed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <QuickNavIcons
                            activeView={activeView}
                            activeBoardId={activeBoardId}
                            onNavigate={onNavigate}
                            onExpandSidebar={onToggleCollapse}
                            boards={boards}
                        />
                    </div>
                )}
            </div>
        </>
    );
});
