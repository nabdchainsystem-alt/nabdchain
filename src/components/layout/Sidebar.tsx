import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

const ACTIVE_SUB_NAV_STYLE = 'font-outfit bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10';

const DEFAULT_QUICK_NAV = ['dashboard', 'my_work', 'inbox', 'vault'];

const SidebarTooltip: React.FC<{ content: string; children: React.ReactNode; enabled?: boolean }> = ({ content, children, enabled = true }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState<{ top: number, left: number, isRTL?: boolean }>({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const { dir } = useAppContext();

    const handleMouseEnter = () => {
        if (!enabled || !triggerRef.current) return;
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let top = rect.top + rect.height / 2;

            // Smart vertical positioning for tooltips
            const tooltipHeight = 24; // approx
            if (top + tooltipHeight / 2 > window.innerHeight - 10) {
                top = window.innerHeight - tooltipHeight / 2 - 10;
            } else if (top - tooltipHeight / 2 < 10) {
                top = tooltipHeight / 2 + 10;
            }

            const isRTL = dir === 'rtl';
            setPosition({
                top,
                left: isRTL ? rect.left - 8 : rect.right + 8,
                isRTL
            });
            setVisible(true);
        }
    };

    return (
        <div
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setVisible(false)}
            className={`group relative ${enabled ? 'w-fit mx-auto' : 'w-full'}`}
        >
            {children}
            {visible && createPortal(
                <div
                    className="fixed z-[9999] px-2 py-1 rounded-md bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-medium whitespace-nowrap shadow-lg pointer-events-none"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: `translateY(-50%) ${position.isRTL ? 'translateX(-100%)' : ''}`
                    }}
                >
                    {content}
                </div>,
                document.body
            )}
        </div>
    );
};

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
    const [settingsPos, setSettingsPos] = useState({ top: 0, left: 0, maxHeight: 0, isRTL: false });
    const settingsRef = useRef<HTMLDivElement>(null);
    const { dir } = useAppContext();

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
        <div className="flex flex-col items-center gap-3 relative w-full">
            {/* Page navigation items */}
            {visiblePageItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.view;
                return (
                    <SidebarTooltip key={item.id} content={t(item.label)}>
                        <button
                            onClick={(e) => handleNavClick(e, item.view)}
                            className={`
                                w-7 h-7 rounded-full flex items-center justify-center
                                bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
                                shadow-sm hover:shadow-md
                                transition-colors duration-100 ease-out cursor-pointer
                            `}
                        >
                            <Icon
                                size={12}
                                weight={isActive ? 'fill' : 'regular'}
                                className={isActive
                                    ? 'text-gray-900 dark:text-gray-100'
                                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                }
                            />
                        </button>
                    </SidebarTooltip>
                );
            })}

            {/* Board navigation items */}
            {visibleBoardItems.map((board) => {
                const BoardIcon = getBoardIcon(board.icon);
                const isActive = activeView === 'board' && activeBoardId === board.id;
                return (
                    <SidebarTooltip key={`board-${board.id}`} content={board.name}>
                        <button
                            onClick={(e) => handleNavClick(e, 'board', board.id)}
                            className={`
                                w-7 h-7 rounded-full flex items-center justify-center
                                bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
                                shadow-sm hover:shadow-md
                                transition-colors duration-100 ease-out cursor-pointer
                            `}
                        >
                            <BoardIcon
                                size={12}
                                weight={isActive ? 'fill' : 'regular'}
                                className={isActive
                                    ? 'text-gray-900 dark:text-gray-100'
                                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                }
                            />
                        </button>
                    </SidebarTooltip>
                );
            })}

            {/* Settings button */}
            <SidebarTooltip content={t('edit')}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        // Smart vertical positioning: if popup would go off screen, align it to bottom
                        const maxMenuHeight = 600;
                        const safetyMargin = 60; // Larger margin for better visibility
                        const availableHeight = window.innerHeight - (safetyMargin * 2);
                        const maxHeight = Math.min(maxMenuHeight, availableHeight);

                        let top = rect.top - 15;

                        // If it would go off bottom, shift it up
                        if (top + maxHeight > window.innerHeight - safetyMargin) {
                            top = window.innerHeight - maxHeight - safetyMargin;
                        }

                        // Ensure it doesn't go off top
                        top = Math.max(safetyMargin / 2, top);

                        const isRTL_pref = dir === 'rtl';
                        const MENU_WIDTH = 200;
                        const spaceLeft = rect.left;
                        const spaceRight = window.innerWidth - rect.right;

                        let left, isRTL;
                        if (isRTL_pref) {
                            if (spaceLeft >= MENU_WIDTH + 12) {
                                left = rect.left - 12;
                                isRTL = true;
                            } else {
                                left = rect.right + 12;
                                isRTL = false;
                            }
                        } else {
                            if (spaceRight >= MENU_WIDTH + 12) {
                                left = rect.right + 12;
                                isRTL = false;
                            } else {
                                left = rect.left - 12;
                                isRTL = true;
                            }
                        }

                        setSettingsPos({
                            top,
                            left,
                            maxHeight,
                            isRTL
                        });
                        setShowSettings(!showSettings);
                    }}
                    title="Customize quick nav"
                    className="w-7 h-7 rounded-full flex items-center justify-center
                         bg-white/70 dark:bg-gray-800/70
                        hover:bg-white dark:hover:bg-gray-800
                        hover:shadow-sm
                        transition-colors duration-100 ease-out mt-1 cursor-pointer"
                >
                    <Gauge size={12} weight="regular" className="text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
                </button>
            </SidebarTooltip>

            {/* Settings Popup */}
            {showSettings && createPortal(
                <div
                    ref={settingsRef}
                    className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2.5 min-w-[200px] overflow-y-auto no-scrollbar"
                    style={{
                        top: settingsPos.top,
                        left: settingsPos.left,
                        maxHeight: `${settingsPos.maxHeight}px`,
                        transform: settingsPos.isRTL ? 'translateX(-100%)' : 'none'
                    }}
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
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-150 cursor-pointer
                                        ${isEnabled
                                            ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <Icon size={13} weight={isEnabled ? 'fill' : 'regular'} />
                                    <span className="flex-1 text-left truncate">{t(item.label)}</span>
                                    {isEnabled && <CheckSquare size={12} weight="fill" className="text-gray-900 dark:text-white shrink-0" />}
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
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-150 cursor-pointer
                                                ${isEnabled
                                                    ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100'
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                }`}
                                        >
                                            <BoardIcon size={13} weight={isEnabled ? 'fill' : 'regular'} />
                                            <span className="flex-1 text-left truncate">{board.name}</span>
                                            {isEnabled && <CheckSquare size={12} weight="fill" className="text-gray-900 dark:text-white shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>,
                document.body
            )}

            {/* Expand button at bottom */}
            <SidebarTooltip content={t('open')}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onExpandSidebar();
                    }}
                    title={t('expand_sidebar')}
                    className="w-7 h-7 rounded-full flex items-center justify-center
                        bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700
                        text-gray-400 hover:text-gray-500 dark:hover:text-gray-300
                        transition-all duration-200 hover:shadow-sm mt-2 cursor-pointer"
                >
                    <CaretRight size={12} weight="bold" />
                </button>
            </SidebarTooltip>
        </div>
    );
};

// Quick nav settings utilities moved to src/utils/sidebarSettings.ts for HMR compatibility

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
    const [localWidth, setLocalWidth] = useState(width); // Local width during resize to prevent parent re-renders
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
    const [isAddWorkspaceModalOpen, setIsAddWorkspaceModalOpen] = useState(false);
    const [addMenuMode, setAddMenuMode] = useState<'board' | 'workspace'>('board');
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [addMenuPos, setAddMenuPos] = useState<{ top?: number, bottom?: number, left?: number, right?: number, isRTL?: boolean }>({ top: 0, left: 0 });
    const [workspaceMenuPos, setWorkspaceMenuPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 });

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
    const workspaceButtonRef = useRef<HTMLDivElement>(null);

    // New Workspace State
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newWorkspaceIcon, setNewWorkspaceIcon] = useState('Briefcase');
    const [isWorkspaceIconPickerOpen, setIsWorkspaceIconPickerOpen] = useState(false);
    const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);

    // Workspace Search State
    const [workspaceSearchTerm, setWorkspaceSearchTerm] = useState('');
    const [isWorkspaceSearchOpen, setIsWorkspaceSearchOpen] = useState(false);
    const workspaceSearchRef = useRef<HTMLInputElement>(null);

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

    // Listen for external trigger to open new board modal
    useEffect(() => {
        const handleOpenNewBoardModal = () => {
            setIsNewBoardModalOpen(true);
            setCreationStep('details');
            setSelectedTemplate(undefined);
        };
        window.addEventListener('open-new-board-modal', handleOpenNewBoardModal);
        return () => window.removeEventListener('open-new-board-modal', handleOpenNewBoardModal);
    }, []);

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

    // Sync local width with prop when not resizing
    useEffect(() => {
        if (!isResizing) {
            setLocalWidth(width);
        }
    }, [width, isResizing]);

    // Resize Logic - only update parent state on mouse up to prevent flashing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const delta = dir === 'rtl'
                ? initialMouseX - e.clientX
                : e.clientX - initialMouseX;

            const newWidth = initialWidth + delta;

            if (newWidth > 200 && newWidth < 450) {
                // Update local width immediately (no parent re-render)
                setLocalWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
            // Only update parent state when done resizing
            onResize(localWidth);
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
    }, [isResizing, onResize, dir, initialMouseX, initialWidth, localWidth]);





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
            setIsAddMenuOpen(false);
            setAddMenuMode('board');
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
                const MENU_HEIGHT = 320;
                const MENU_WIDTH = 240;
                const GAP = 4;

                // 1. Horizontal Positioning
                let left;
                if (dir === 'rtl') {
                    // Pop out to the left of the button in RTL
                    left = rect.left - MENU_WIDTH - GAP;
                } else {
                    // Pop out to the right of the button in LTR (similar to board menu style)
                    left = rect.right + GAP;
                }

                // Ensure it stays within viewport boundaries
                left = Math.max(10, Math.min(left, window.innerWidth - MENU_WIDTH - 10));

                // 2. Vertical Positioning (Align top with button top, with edge safety)
                let top = rect.top - 15;
                if (top + MENU_HEIGHT > window.innerHeight - 50) {
                    top = window.innerHeight - MENU_HEIGHT - 50;
                }
                top = Math.max(10, top);

                setAddMenuPos({
                    top,
                    bottom: undefined,
                    left,
                    isRTL: false
                });
            }
            setAddMenuMode('board');
            setIsAddMenuOpen(true);
        }
    };

    const toggleWorkspaceMenu = () => {
        if (isWorkspaceMenuOpen) {
            setIsWorkspaceMenuOpen(false);
        } else {
            if (workspaceButtonRef.current) {
                const rect = workspaceButtonRef.current.getBoundingClientRect();
                const MENU_WIDTH = 220;

                const spaceLeft = rect.left;
                const spaceRight = window.innerWidth - rect.right;

                let left;
                if (dir === 'rtl') {
                    // Prefer left side of sidebar in RTL
                    if (spaceLeft >= MENU_WIDTH + 8) {
                        left = rect.left - MENU_WIDTH - 8;
                    } else {
                        left = rect.right + 8;
                    }
                } else {
                    // Prefer right side of sidebar in LTR
                    if (spaceRight >= MENU_WIDTH + 8) {
                        left = rect.right + 8;
                    } else {
                        left = rect.left - MENU_WIDTH - 8;
                    }
                }

                // Final clamping
                left = Math.max(10, Math.min(left, window.innerWidth - MENU_WIDTH - 10));

                let top = rect.top - 15;
                // Add bottom safety margin
                const WORKSPACE_MENU_HEIGHT = 270;
                if (top + WORKSPACE_MENU_HEIGHT > window.innerHeight - 50) {
                    top = window.innerHeight - WORKSPACE_MENU_HEIGHT - 50;
                }

                setWorkspaceMenuPos({ top, left });
            }
            setIsWorkspaceMenuOpen(true);
        }
    };

    const collapsedWidth = 42;
    const expandedWidth = localWidth;
    // Optimized: Using transform for GPU-accelerated smooth animation
    const textBase = 'overflow-hidden whitespace-nowrap';
    const textVisibility = isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100';

    return (
        <>
            {/* Main Sidebar Container - Professional transform-based animation */}
            <div
                key={dir}
                className="font-outfit flex flex-col h-full min-h-0 flex-shrink-0 relative group/sidebar select-none bg-transparent ltr:rounded-r-3xl rtl:rounded-l-3xl ltr:shadow-[4px_0_24px_rgba(0,0,0,0.02)] rtl:shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-20"
                style={{
                    width: isCollapsed ? `${collapsedWidth}px` : `${expandedWidth}px`,
                    transition: isResizing ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'width'
                }}
            >
                {/* Inner content with clip for clean edges */}
                <div
                    className="h-full min-h-0 flex flex-col overflow-hidden"
                    style={{
                        width: `${expandedWidth}px`,
                        minWidth: `${expandedWidth}px`,
                        transform: isCollapsed ? `translateX(${dir === 'rtl' ? (expandedWidth - collapsedWidth) : -(expandedWidth - collapsedWidth)}px)` : 'translateX(0)',
                        transition: isResizing ? 'none' : 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'transform'
                    }}
                >
                    {/* Content wrapper - fades when collapsed */}
                    <div
                        className="h-full min-h-0 flex flex-col"
                        style={{
                            opacity: isCollapsed ? 0 : 1,
                            transition: 'opacity 150ms ease-out',
                            pointerEvents: isCollapsed ? 'none' : 'auto'
                        }}
                    >
                        {/* 1. Top Navigation */}
                        <div className={`pt-3 pb-3 space-y-0.5 ltr:pl-5 ltr:pr-3 rtl:pr-5 rtl:pl-3 transition-none`}>
                            <SidebarTooltip content={t('home')} enabled={isCollapsed}>
                                <button
                                    onClick={() => onNavigate('dashboard')}
                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100 cursor-pointer
                                    ${activeView === 'dashboard'
                                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                                    `}
                                >
                                    <House size={17} weight="light" className="flex-shrink-0" />
                                    <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('home')}</span>
                                </button>
                            </SidebarTooltip>
                            {pageVisibility['my_work'] !== false && (
                                <SidebarTooltip content={t('my_work')} enabled={isCollapsed}>
                                    <button
                                        onClick={() => onNavigate('my_work')}
                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100 
                                        ${activeView === 'my_work'
                                                ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                                        `}
                                    >
                                        <SquaresFour size={17} weight="light" className="flex-shrink-0" />
                                        <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('my_work')}</span>
                                    </button>
                                </SidebarTooltip>
                            )}

                            {/* New Pages */}
                            {pageVisibility['inbox'] !== false && (
                                <SidebarTooltip content={t('inbox')} enabled={isCollapsed}>
                                    <button
                                        onClick={() => onNavigate('inbox')}
                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100 
                                        ${activeView === 'inbox'
                                                ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                                        `}
                                    >
                                        <Tray size={17} weight="light" className="flex-shrink-0" />
                                        <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('inbox')}</span>
                                    </button>
                                </SidebarTooltip>
                            )}
                            {pageVisibility['talk'] !== false && (
                                <SidebarTooltip content={t('talk')} enabled={isCollapsed}>
                                    <button
                                        onClick={() => onNavigate('talk')}
                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100 
                                        ${activeView === 'talk'
                                                ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                                        `}
                                    >
                                        <ChatCircleText size={17} weight="light" className="flex-shrink-0" />
                                        <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('talk')}</span>
                                    </button>
                                </SidebarTooltip>
                            )}

                            {pageVisibility['teams'] !== false && (
                                <SidebarTooltip content={t('teams')} enabled={isCollapsed}>
                                    <button
                                        onClick={() => onNavigate('teams')}
                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100 
                                        ${activeView === 'teams'
                                                ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'} 
                                        `}
                                    >
                                        <Users size={17} weight="light" className="flex-shrink-0" />
                                        <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('teams')}</span>
                                    </button>
                                </SidebarTooltip>
                            )}
                            {pageVisibility['vault'] !== false && (
                                <SidebarTooltip content={t('vault')} enabled={isCollapsed}>
                                    <button
                                        onClick={() => onNavigate('vault')}
                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100
                                        ${activeView === 'vault'
                                                ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}
                                        `}
                                    >
                                        <Lock size={17} weight="light" className="flex-shrink-0" />
                                        <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('vault')}</span>
                                    </button>
                                </SidebarTooltip>
                            )}
                            {pageVisibility['test_tools'] !== false && (
                                <SidebarTooltip content={t('test_tools')} enabled={isCollapsed}>
                                    <button
                                        onClick={() => onNavigate('test')}
                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100
                                        ${activeView === 'test'
                                                ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}
                                        `}
                                    >
                                        <Flask size={17} weight="light" className="flex-shrink-0" />
                                        <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('test_tools')}</span>
                                    </button>
                                </SidebarTooltip>
                            )}
                        </div>

                        {/* Separator - only show if departments are visible */}
                        {pageVisibility['mini_company'] !== false && (
                            <div className="border-t border-gray-100 dark:border-monday-dark-border my-2 mx-6"></div>
                        )}

                        {/* 2. Scrollable Content */}
                        <div className={`flex-1 min-h-0 overflow-y-auto py-2 no-scrollbar pl-5 pr-3 transition-none`}>

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
                                            <SidebarTooltip content={t('overview')} enabled={isCollapsed}>
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-slate-700 dark:text-slate-300 transition-colors duration-100`}
                                                    onClick={() => !isCollapsed && toggleDepartment('mini_overview')}
                                                >
                                                    <Layout size={17} weight="light" className="flex-shrink-0" />
                                                    <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('overview')}</span>
                                                    <CaretDown size={13} weight="light" className={`text-gray-500 transition-colors duration-100 flex-shrink-0 ${expandedDepartments.has('mini_overview') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                </div>
                                            </SidebarTooltip>
                                            {expandedDepartments.has('mini_overview') && !isCollapsed && (
                                                <div className="ms-2 ps-3 border-s border-slate-300 dark:border-slate-600 mt-1 space-y-0.5">
                                                    <button onClick={() => onNavigate('dashboards')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'dashboards' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Layout size={13} weight="light" /> <span>{t('dashboards')}</span>
                                                    </button>
                                                    <button onClick={() => onNavigate('reports')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'reports' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <FileText size={13} weight="light" /> <span>{t('reports')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Operations */}
                                        <div className="mb-1">
                                            <SidebarTooltip content={t('operations')} enabled={isCollapsed}>
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-colors duration-100`}
                                                    onClick={() => !isCollapsed && toggleDepartment('mini_operations')}
                                                >
                                                    <Factory size={17} weight="light" className="flex-shrink-0" />
                                                    <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('operations')}</span>
                                                    <CaretDown size={13} weight="light" className={`text-gray-500 transition-colors duration-100 flex-shrink-0 ${expandedDepartments.has('mini_operations') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                </div>
                                            </SidebarTooltip>
                                            {expandedDepartments.has('mini_operations') && !isCollapsed && (
                                                <div className="ms-2 ps-3 border-s border-gray-300 dark:border-gray-600 mt-1 space-y-0.5">
                                                    <button onClick={() => onNavigate('sales')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Megaphone size={13} weight="light" /> <span>{t('sales')}</span>
                                                    </button>
                                                    <button onClick={() => onNavigate('purchases')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'purchases' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <ShoppingCart size={13} weight="light" /> <span>{t('purchases')}</span>
                                                    </button>
                                                    <button onClick={() => onNavigate('inventory')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'inventory' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Package size={13} weight="light" /> <span>{t('stock_inventory')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Finance */}
                                        <div className="mb-1">
                                            <SidebarTooltip content={t('finance')} enabled={isCollapsed}>
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-zinc-700 dark:text-zinc-300 transition-colors duration-100`}
                                                    onClick={() => !isCollapsed && toggleDepartment('mini_finance')}
                                                >
                                                    <Money size={17} weight="light" className="flex-shrink-0" />
                                                    <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('finance')}</span>
                                                    <CaretDown size={13} weight="light" className={`text-gray-500 transition-colors duration-100 flex-shrink-0 ${expandedDepartments.has('mini_finance') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                </div>
                                            </SidebarTooltip>
                                            {expandedDepartments.has('mini_finance') && !isCollapsed && (
                                                <div className="ms-2 ps-3 border-s border-zinc-300 dark:border-zinc-600 mt-1 space-y-0.5">
                                                    <button onClick={() => onNavigate('expenses')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'expenses' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Money size={13} weight="light" /> <span>{t('expenses')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* People */}
                                        <div className="mb-1">
                                            <SidebarTooltip content={t('people')} enabled={isCollapsed}>
                                                <div
                                                    className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-neutral-700 dark:text-neutral-300 transition-colors duration-100`}
                                                    onClick={() => !isCollapsed && toggleDepartment('mini_people')}
                                                >
                                                    <UsersThree size={17} weight="light" className="flex-shrink-0" />
                                                    <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('people')}</span>
                                                    <CaretDown size={13} weight="light" className={`text-gray-500 transition-colors duration-100 flex-shrink-0 ${expandedDepartments.has('mini_people') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                </div>
                                            </SidebarTooltip>
                                            {expandedDepartments.has('mini_people') && !isCollapsed && (
                                                <div className="ms-2 ps-3 border-s border-neutral-300 dark:border-neutral-600 mt-1 space-y-0.5">
                                                    <button onClick={() => onNavigate('customers')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'customers' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Users size={13} weight="light" /> <span>{t('customers')}</span>
                                                    </button>
                                                    <button onClick={() => onNavigate('suppliers')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'suppliers' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                        <Truck size={13} weight="light" /> <span>{t('suppliers')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Supply Chain */}
                                        {pageVisibility['supply_chain'] !== false && (
                                            <div className="mb-1">
                                                <SidebarTooltip content={t('supply_chain')} enabled={isCollapsed}>
                                                    <div
                                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-stone-700 dark:text-stone-300 transition-colors duration-100`}
                                                        onClick={() => !isCollapsed && toggleDepartment('supply_chain')}
                                                    >
                                                        <Package size={17} weight="light" className="flex-shrink-0" />
                                                        <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('supply_chain')}</span>
                                                        <CaretDown size={13} weight="light" className={`text-gray-500 transition-colors duration-100 flex-shrink-0 ${expandedDepartments.has('supply_chain') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                    </div>
                                                </SidebarTooltip>
                                                {expandedDepartments.has('supply_chain') && !isCollapsed && (
                                                    <div className="ms-2 ps-3 border-s border-stone-300 dark:border-stone-600 mt-1 space-y-0.5">
                                                        {pageVisibility['procurement'] !== false && (
                                                            <button onClick={() => onNavigate('procurement')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-stone-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'procurement' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <ShoppingCart size={13} weight="light" /> <span>{t('procurement')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['warehouse'] !== false && (
                                                            <button onClick={() => onNavigate('warehouse')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-stone-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'warehouse' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <House size={13} weight="light" /> <span>{t('warehouse')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['fleet'] !== false && (
                                                            <button onClick={() => onNavigate('fleet')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-stone-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'fleet' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Truck size={13} weight="light" /> <span>{t('fleet')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['vendors'] !== false && (
                                                            <button onClick={() => onNavigate('vendors')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-stone-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'vendors' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <UsersThree size={13} weight="light" /> <span>{t('vendors')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['planning'] !== false && (
                                                            <button onClick={() => onNavigate('planning')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-stone-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'planning' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Gauge size={13} weight="light" /> <span>{t('planning')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Manufacturing (Legacy Operations) */}
                                        {pageVisibility['operations'] !== false && (
                                            <div className="mb-1">
                                                <SidebarTooltip content={t('manufacturing')} enabled={isCollapsed}>
                                                    <div
                                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-slate-600 dark:text-slate-300 transition-colors duration-100`}
                                                        onClick={() => !isCollapsed && toggleDepartment('operations')}
                                                    >
                                                        <Factory size={17} weight="light" className="flex-shrink-0" />
                                                        <span key={dir} className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('manufacturing')}</span>
                                                        <CaretDown size={13} weight="light" className={`text-gray-500 transition-colors duration-100 flex-shrink-0 ${expandedDepartments.has('operations') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                    </div>
                                                </SidebarTooltip>
                                                {expandedDepartments.has('operations') && !isCollapsed && (
                                                    <div className="ms-2 ps-3 border-s border-slate-300 dark:border-slate-600 mt-1 space-y-0.5">
                                                        {pageVisibility['maintenance'] !== false && (
                                                            <button onClick={() => onNavigate('maintenance')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'maintenance' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Wrench size={13} /> <span>{t('maintenance')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['production'] !== false && (
                                                            <button onClick={() => onNavigate('production')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'production' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Factory size={13} /> <span>{t('production')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['quality'] !== false && (
                                                            <button onClick={() => onNavigate('quality')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'quality' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <ShieldCheck size={13} weight="light" /> <span>{t('quality')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Business */}
                                        {pageVisibility['business'] !== false && (
                                            <div className="mb-1">
                                                <SidebarTooltip content={t('business')} enabled={isCollapsed}>
                                                    <div
                                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-zinc-600 dark:text-zinc-300 transition-colors duration-100`}
                                                        onClick={() => !isCollapsed && toggleDepartment('business')}
                                                    >
                                                        <Buildings size={17} weight="light" className="flex-shrink-0" />
                                                        <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('business')}</span>
                                                        <CaretDown size={13} weight="light" className={`text-gray-500 transition-colors duration-100 flex-shrink-0 ${expandedDepartments.has('business') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                    </div>
                                                </SidebarTooltip>
                                                {expandedDepartments.has('business') && !isCollapsed && (
                                                    <div className="ms-2 ps-3 border-s border-zinc-300 dark:border-zinc-600 mt-1 space-y-0.5">
                                                        {pageVisibility['sales_listing'] !== false && (
                                                            <button onClick={() => onNavigate('sales_listing')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales_listing' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Table size={13} weight="light" /> <span>{t('sales_listings')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['sales_factory'] !== false && (
                                                            <button onClick={() => onNavigate('sales_factory')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales_factory' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Factory size={13} /> <span>{t('sales_factory')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Business Support */}
                                        {pageVisibility['business_support'] !== false && (
                                            <div className="mb-1">
                                                <SidebarTooltip content={t('business_support')} enabled={isCollapsed}>
                                                    <div
                                                        className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 text-neutral-600 dark:text-neutral-300 transition-colors duration-100`}
                                                        onClick={() => !isCollapsed && toggleDepartment('business_support')}
                                                    >
                                                        <Users size={17} weight="light" className="flex-shrink-0" />
                                                        <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('business_support')}</span>
                                                        <CaretDown size={13} weight="light" className={`text-gray-500 transition-colors duration-100 flex-shrink-0 ${expandedDepartments.has('business_support') ? 'rotate-180' : ''} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                                    </div>
                                                </SidebarTooltip>
                                                {expandedDepartments.has('business_support') && !isCollapsed && (
                                                    <div className="ms-2 ps-3 border-s border-neutral-300 dark:border-neutral-600 mt-1 space-y-0.5">
                                                        {pageVisibility['it_support'] !== false && (
                                                            <button onClick={() => onNavigate('it_support')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'it_support' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Monitor size={13} /> <span>{t('it')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['hr'] !== false && (
                                                            <button onClick={() => onNavigate('hr')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'hr' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <UsersThree size={13} weight="light" /> <span>{t('hr')}</span>
                                                            </button>
                                                        )}
                                                        {pageVisibility['marketing'] !== false && (
                                                            <button onClick={() => onNavigate('marketing')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11.3px] text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'marketing' ? ACTIVE_SUB_NAV_STYLE : ''}`}>
                                                                <Megaphone size={13} /> <span>{t('marketing')}</span>
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
                                            {t('favorites')} <CaretRight size={13} weight="light" className="text-gray-400" />
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
                                        {isWorkspaceSearchOpen ? (
                                            <div className="flex items-center gap-1 flex-1">
                                                <input
                                                    ref={workspaceSearchRef}
                                                    type="text"
                                                    value={workspaceSearchTerm}
                                                    onChange={(e) => setWorkspaceSearchTerm(e.target.value)}
                                                    placeholder={t('search_workspaces')}
                                                    autoFocus
                                                    className="flex-1 text-xs bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-monday-blue dark:focus:border-monday-blue outline-none py-0.5 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') {
                                                            setIsWorkspaceSearchOpen(false);
                                                            setWorkspaceSearchTerm('');
                                                        }
                                                    }}
                                                />
                                                <X
                                                    size={13}
                                                    weight="light"
                                                    className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                                                    onClick={() => {
                                                        setIsWorkspaceSearchOpen(false);
                                                        setWorkspaceSearchTerm('');
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary truncate">{t('workspaces')}</span>
                                                <div className="flex space-x-1 rtl:space-x-reverse flex-shrink-0">
                                                    <MagnifyingGlass
                                                        size={13}
                                                        weight="light"
                                                        className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                                                        onClick={() => {
                                                            setIsWorkspaceSearchOpen(true);
                                                            setTimeout(() => workspaceSearchRef.current?.focus(), 0);
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Active Workspace Card */}
                                <div className="relative group/workspace-card">
                                    <div
                                        ref={workspaceButtonRef}
                                        onClick={(e) => {
                                            if (isCollapsed) return;
                                            e.stopPropagation();
                                            toggleWorkspaceMenu();
                                        }}
                                        className={`font-outfit relative border border-gray-200 dark:border-monday-dark-border bg-gray-50/50 dark:bg-monday-dark-surface hover:bg-gray-100/80 dark:hover:bg-monday-dark-hover rounded-md py-1.5 flex items-center cursor-pointer transition-colors duration-100 ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-md bg-gradient-to-tr ${activeWorkspace.color} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                            {(() => {
                                                const WorkspaceIcon = ICON_MAP[activeWorkspace.icon];
                                                return WorkspaceIcon ? <WorkspaceIcon size={13} weight="bold" /> : activeWorkspace.name.charAt(0);
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
                                                    <Plus size={13} weight="bold" />
                                                </button>
                                                <div
                                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 cursor-pointer p-0.5 rounded hover:bg-gray-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleWorkspaceMenu();
                                                    }}
                                                >
                                                    {dir === 'rtl' ? <CaretLeft size={13} weight="light" className="transition-transform duration-200" /> : <CaretRight size={13} weight="light" className="transition-transform duration-200" />}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add New Menu - Simple Board Creator - Rendered via Portal to escape stacking context */}
                                    {isAddMenuOpen && createPortal(
                                        <>
                                            {/* Backdrop to close menu */}
                                            <div className="fixed inset-0 z-[9998]" onClick={() => setIsAddMenuOpen(false)} />
                                            <div
                                                ref={addMenuRef}
                                                className="fixed bg-white dark:bg-monday-dark-surface shadow-xl rounded-lg border border-gray-200 dark:border-monday-dark-border z-[9999] animate-in fade-in zoom-in-95 duration-100 min-w-[220px] w-auto overflow-hidden max-h-[calc(100vh-20px)] overflow-y-auto"
                                                style={{
                                                    top: addMenuPos.top,
                                                    bottom: addMenuPos.bottom,
                                                    left: addMenuPos.left,
                                                    transform: addMenuPos.isRTL ? 'translateX(-100%)' : 'none'
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {addMenuMode === 'board' ? (
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            if (newBoardName.trim()) {
                                                                const iconMap: Record<string, string> = { table: 'Table', datatable: 'Database', kanban: 'Kanban', gtd: 'CheckSquare' };
                                                                // Use selected icon or fallback to layout default
                                                                const finalIcon = newBoardIcon && newBoardIcon !== 'Table' ? newBoardIcon : (iconMap[selectedLayout] || 'Table');

                                                                onAddBoard(
                                                                    newBoardName.trim(),
                                                                    finalIcon,
                                                                    undefined,
                                                                    selectedLayout as any,
                                                                    undefined
                                                                );
                                                                setNewBoardName('');
                                                                setNewBoardIcon('Table');
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

                                                        {/* Icon Picker */}
                                                        <div className="mb-3 relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                                                                className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-monday-dark-hover border border-gray-200 dark:border-monday-dark-border rounded-md hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {React.createElement(ICON_MAP[newBoardIcon] || Table, { size: 14, className: "text-monday-blue" })}
                                                                    <span className="text-[11px] text-gray-700 dark:text-gray-300">{t(newBoardIcon)}</span>
                                                                </div>
                                                                <CaretDown size={10} weight="light" className="text-gray-400" />
                                                            </button>

                                                            {isIconPickerOpen && (
                                                                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border shadow-xl rounded-md p-2 z-50 grid grid-cols-5 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                                    {Object.keys(ICON_MAP).map((iconName) => (
                                                                        <button
                                                                            key={iconName}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setNewBoardIcon(iconName);
                                                                                setIsIconPickerOpen(false);
                                                                            }}
                                                                            className={`p-1.5 rounded-sm flex items-center justify-center transition-colors ${newBoardIcon === iconName ? 'bg-monday-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-gray-400'}`}
                                                                            title={t(iconName).toString()}
                                                                        >
                                                                            {React.createElement(ICON_MAP[iconName], { size: 14 })}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
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
                                                                    <layout.icon size={17} weight={selectedLayout === layout.id ? "fill" : "regular"} />
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

                                                        {/* Mode Switcher Footer */}
                                                        <div className="mt-2 text-center border-t border-gray-100 dark:border-monday-dark-border pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddMenuMode('workspace')}
                                                                className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                            >
                                                                {t('or_create_workspace')}
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <form
                                                        onSubmit={handleCreateWorkspace}
                                                        className="p-3"
                                                    >
                                                        <div className="mb-3">
                                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">{t('workspace_name')}</label>
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={newWorkspaceName}
                                                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                                                placeholder="e.g. Marketing"
                                                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-monday-dark-border rounded-md bg-gray-50 dark:bg-monday-dark-bg focus:outline-none focus:ring-1 focus:ring-monday-blue focus:border-monday-blue transition-shadow"
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">{t('workspace_icon')}</label>
                                                            <div className="grid grid-cols-5 gap-1">
                                                                {Object.keys(ICON_MAP).slice(0, 10).map((iconName, index) => {
                                                                    const isSelected = newWorkspaceIcon === iconName;
                                                                    const gradients = [
                                                                        'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-orange-500 to-red-500',
                                                                        'from-green-500 to-emerald-500', 'from-indigo-500 to-violet-500'
                                                                    ];
                                                                    const gradient = gradients[index % gradients.length];

                                                                    return (
                                                                        <button
                                                                            key={iconName}
                                                                            type="button"
                                                                            onClick={() => setNewWorkspaceIcon(iconName)}
                                                                            className={`
                                                                            aspect-square rounded-md flex items-center justify-center transition-all duration-200
                                                                            ${isSelected
                                                                                    ? `bg-gradient-to-br ${gradient} text-white shadow-sm ring-1 ring-offset-1 ring-blue-500`
                                                                                    : 'bg-gray-50 dark:bg-monday-dark-hover text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                                }
                                                                        `}
                                                                            title={iconName}
                                                                        >
                                                                            {React.createElement(ICON_MAP[iconName], { size: 16 })}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="submit"
                                                            disabled={!newWorkspaceName.trim()}
                                                            className="w-full py-1.5 bg-monday-blue text-white text-xs font-semibold rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm"
                                                        >
                                                            {t('create_workspace')}
                                                        </button>

                                                        <div className="mt-2 text-center border-t border-gray-100 dark:border-monday-dark-border pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddMenuMode('board')}
                                                                className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                            >
                                                                {t('or_create_board')}
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        </>,
                                        document.body
                                    )}
                                </div>

                                {/* Workspace Dropdown - Rendered via Portal to escape stacking context */}
                                {isWorkspaceMenuOpen && !isCollapsed && createPortal(
                                    <>
                                        <div className="fixed inset-0 z-[9998]" onClick={() => {
                                            setIsWorkspaceMenuOpen(false);
                                            setWorkspaceSearchTerm('');
                                        }} />
                                        <div
                                            className="fixed bg-white dark:bg-monday-dark-surface shadow-xl rounded-lg border border-gray-100 dark:border-monday-dark-border z-[9999] py-1 max-h-80 overflow-hidden min-w-[220px] animate-in fade-in zoom-in-95 duration-100 flex flex-col"
                                            style={{ top: workspaceMenuPos.top, left: workspaceMenuPos.left }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Search Input in Dropdown */}
                                            <div className="px-3 py-2 border-b border-gray-100 dark:border-monday-dark-border">
                                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-monday-dark-bg rounded-md px-2 py-1.5">
                                                    <MagnifyingGlass size={14} weight="light" className="text-gray-400 flex-shrink-0" />
                                                    <input
                                                        type="text"
                                                        value={workspaceSearchTerm}
                                                        onChange={(e) => setWorkspaceSearchTerm(e.target.value)}
                                                        placeholder={t('search_workspaces')}
                                                        autoFocus
                                                        className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') {
                                                                setIsWorkspaceMenuOpen(false);
                                                                setWorkspaceSearchTerm('');
                                                            }
                                                        }}
                                                    />
                                                    {workspaceSearchTerm && (
                                                        <X
                                                            size={14}
                                                            weight="light"
                                                            className="text-gray-400 cursor-pointer hover:text-gray-600 flex-shrink-0"
                                                            onClick={() => setWorkspaceSearchTerm('')}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto flex-1 max-h-52">
                                            {(() => {
                                                const filteredWorkspaces = workspaces.filter(ws => !workspaceSearchTerm || ws.name.toLowerCase().includes(workspaceSearchTerm.toLowerCase()));
                                                if (filteredWorkspaces.length === 0) {
                                                    return (
                                                        <div className="px-3 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                                                            {t('no_results_found')}
                                                        </div>
                                                    );
                                                }
                                                return filteredWorkspaces.map(ws => (
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
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div
                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-monday-dark-hover rounded-sm text-gray-400 hover:text-monday-blue dark:text-gray-500 transition-colors"
                                                            title={t('rename')}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingWorkspaceId(ws.id);
                                                                setNewWorkspaceName(ws.name);
                                                                setNewWorkspaceIcon(ws.icon);
                                                                setIsAddWorkspaceModalOpen(true);
                                                                setIsWorkspaceMenuOpen(false);
                                                            }}
                                                        >
                                                            <Pencil size={12} weight="light" />
                                                        </div>
                                                        <div
                                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm text-gray-400 hover:text-red-600 dark:text-gray-500 transition-colors"
                                                            title={t('delete')}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (workspaces.length <= 1) {
                                                                    alert(t('cannot_delete_only_workspace'));
                                                                    return;
                                                                }
                                                                setWorkspaceToDelete(ws.id);
                                                                setIsWorkspaceMenuOpen(false);
                                                            }}
                                                        >
                                                            <Trash size={12} weight="light" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                            })()}
                                            </div>
                                            <div className="border-t border-gray-100 dark:border-monday-dark-border pt-1">
                                                <button
                                                    onClick={() => {
                                                        setIsAddWorkspaceModalOpen(true);
                                                        setIsWorkspaceMenuOpen(false);
                                                        setWorkspaceSearchTerm('');
                                                    }}
                                                    className="w-full text-start px-3 py-2 text-[14px] text-gray-500 dark:text-monday-dark-text-secondary hover:bg-gray-50 dark:hover:bg-monday-dark-hover hover:text-monday-blue flex items-center gap-2"
                                                >
                                                    <Plus size={13} weight="light" /> {t('add_workspace')}
                                                </button>
                                            </div>
                                        </div>
                                    </>,
                                    document.body
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
                                                    className={`font-outfit flex items-center ${!isCollapsed ? 'gap-3 px-3' : 'gap-0 px-3'} py-1.5 rounded-sm cursor-pointer group transition-colors duration-100 select-none
                                                ${isActive ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10' : 'hover:bg-white/40 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}
                                                ${isChild ? (dir === 'rtl' ? 'mr-3' : 'ml-3') : ''}
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
                                                                    const MENU_WIDTH = 240;
                                                                    const GAP = 4;
                                                                    let x;

                                                                    if (dir === 'rtl') {
                                                                        // In RTL, menu should pop out to the left of the button
                                                                        x = rect.left - MENU_WIDTH - GAP;
                                                                    } else {
                                                                        // In LTR, menu should pop out to the right of the button
                                                                        x = rect.right + GAP;
                                                                    }

                                                                    // Ensure it stays within viewport boundaries
                                                                    x = Math.max(10, Math.min(x, window.innerWidth - MENU_WIDTH - 10));

                                                                    setQuickAddMenu({ x, y: rect.top, parentId: board.id });
                                                                }}
                                                                className={`p-1 rounded-sm hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-monday-dark-border text-gray-400 invisible group-hover:visible`}
                                                                title={t('add_sub_board')}
                                                            >
                                                                <Plus size={13} weight="light" />
                                                            </div>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setBoardToDelete(board.id);
                                                                    setIsDeleteBoardModalOpen(true);
                                                                }}
                                                                className={`p-1 rounded-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-monday-dark-border text-gray-400 ${isActive ? 'visible' : 'invisible group-hover:visible'}`}
                                                                title={t('delete')}
                                                            >
                                                                <Trash size={13} weight="light" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {hasChildren && !isCollapsed && isExpanded && (
                                                    <div className={`${dir === 'rtl' ? 'mr-4 pr-1 border-r' : 'ml-4 pl-1 border-l'} border-gray-200 dark:border-monday-dark-border mt-0.5 space-y-0.5`}>
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
                            <div className="mt-6 pl-5 pr-3 pt-4 border-t border-gray-200 dark:border-monday-dark-border">
                                {!isCollapsed && (
                                    <div className="flex items-center mb-2 px-3">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary truncate">{t('marketplace').toUpperCase()}</span>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    {pageVisibility['local_marketplace'] !== false && (
                                        <SidebarTooltip content={t('local_marketplace')} enabled={isCollapsed}>
                                            <button
                                                onClick={() => onNavigate('local_marketplace')}
                                                className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100 ${activeView === 'local_marketplace' ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}`}
                                            >
                                                <ShoppingCart size={17} weight="light" className="flex-shrink-0" />
                                                <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('local_marketplace')}</span>
                                            </button>
                                        </SidebarTooltip>
                                    )}
                                    {pageVisibility['foreign_marketplace'] !== false && (
                                        <SidebarTooltip content={t('foreign_marketplace')} enabled={isCollapsed}>
                                            <button
                                                onClick={() => onNavigate('foreign_marketplace')}
                                                className={`flex items-center ${!isCollapsed ? 'gap-3 px-3 w-full' : 'gap-0 px-3 w-fit mx-auto'} py-1.5 rounded-sm transition-colors duration-100 ${activeView === 'foreign_marketplace' ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[#323338] dark:text-[#dcdde2]'}`}
                                            >
                                                <Globe size={17} weight="light" className="flex-shrink-0" />
                                                <span className={`font-normal text-[14px] truncate min-w-0 flex-1 text-start leading-5 ${textBase} ${textVisibility}`}>{t('foreign_marketplace')}</span>
                                            </button>
                                        </SidebarTooltip>
                                    )}
                                </div>
                            </div>
                        )}
                    </div> {/* End of content wrapper */}
                </div> {/* End of inner content with transform */}

                {/* Resize Drag Zone - outside transform wrapper */}
                {!isCollapsed && (
                    <div
                        className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-2 h-full cursor-col-resize hover:bg-monday-blue/20 transition-colors z-30"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizing(true);
                            setInitialMouseX(e.clientX);
                            setInitialWidth(localWidth);
                        }}
                    ></div>
                )}

                {/* Collapse/Expand Button - OUTSIDE all content wrappers for guaranteed visibility */}
                < button
                    onClick={onToggleCollapse}
                    className={`absolute top-8 -right-3 rtl:right-auto rtl:-left-3 w-6 h-6 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-full flex items-center justify-center text-gray-400 hover:text-monday-blue shadow-md z-50 transition-colors duration-100 ${isCollapsed ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}`
                    }
                >
                    {(isCollapsed && dir === 'ltr') || (!isCollapsed && dir === 'rtl') ? <CaretRight size={13} weight="light" /> : <CaretLeft size={13} weight="light" />}
                </button >



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

                {/* Quick Add Board Menu - Rendered via Portal */}
                {
                    quickAddMenu && createPortal(
                        <>
                            <div
                                className="fixed inset-0 z-[9998]"
                                onClick={() => {
                                    setQuickAddMenu(null);
                                    setNewBoardName('');
                                }}
                            />
                            <div
                                className="fixed bg-white dark:bg-monday-dark-surface rounded-lg shadow-lg border border-gray-200 dark:border-monday-dark-border min-w-[240px] w-auto z-[9999]"
                                style={{ top: Math.min(quickAddMenu.y, window.innerHeight - 320), left: quickAddMenu.x }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (newBoardName.trim()) {
                                            const iconMap: Record<string, string> = { table: 'Table', datatable: 'Database', kanban: 'Kanban', gtd: 'CheckSquare' };
                                            const parentId = quickAddMenu.parentId;
                                            // Use selected icon or fallback to layout default
                                            const finalIcon = newBoardIcon && newBoardIcon !== 'Table' ? newBoardIcon : (iconMap[selectedLayout] || 'Table');

                                            onAddBoard(newBoardName.trim(), finalIcon, undefined, selectedLayout as any, parentId);
                                            if (parentId) {
                                                setExpandedBoards(prev => {
                                                    const next = new Set(prev);
                                                    next.add(parentId);
                                                    return next;
                                                });
                                            }
                                            setNewBoardName('');
                                            setNewBoardIcon('Table');
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

                                    {/* Icon Picker */}
                                    <div className="mt-3 relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                                            className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-md hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {React.createElement(ICON_MAP[newBoardIcon] || Table, { size: 16, className: "text-monday-blue" })}
                                                <span className="text-xs text-gray-700 dark:text-gray-300">{t(newBoardIcon.toLowerCase()) || newBoardIcon}</span>
                                            </div>
                                            <CaretDown size={12} weight="light" className="text-gray-400" />
                                        </button>

                                        {isIconPickerOpen && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border shadow-xl rounded-md p-2 z-50 grid grid-cols-5 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                {Object.keys(ICON_MAP).map((iconName) => (
                                                    <button
                                                        key={iconName}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewBoardIcon(iconName);
                                                            setIsIconPickerOpen(false);
                                                        }}
                                                        className={`p-1.5 rounded-sm flex items-center justify-center transition-colors ${newBoardIcon === iconName ? 'bg-monday-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-gray-400'}`}
                                                        title={iconName}
                                                    >
                                                        {React.createElement(ICON_MAP[iconName], { size: 16 })}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

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
                                                <layout.icon size={17} />
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
                                            {t('cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newBoardName.trim()}
                                            className="flex-1 px-3 py-1.5 text-xs bg-monday-blue text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                                        >
                                            {t('create')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>,
                        document.body
                    )
                }
                {/* Legacy backdrop removed - now included in portal above */}
                {
                    false && quickAddMenu && (
                        <div
                            className="fixed inset-0 z-[65]"
                            onClick={() => {
                                setQuickAddMenu(null);
                                setNewBoardName('');
                            }}
                        />
                    )
                }





                {/* Create/Edit Workspace Modal (Only for Editing now, Creation is inline) */}
                {
                    isAddWorkspaceModalOpen && (
                        <div className="fixed inset-0 flex items-center justify-center z-[70]">
                            <div className="absolute inset-0" onClick={() => setIsAddWorkspaceModalOpen(false)} />
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
                                        <label className="block text-xs font-bold text-gray-500 dark:text-monday-dark-text-secondary uppercase tracking-wider mb-2">{t('workspace_name')}</label>
                                        <input
                                            type="text"
                                            autoFocus
                                            value={newWorkspaceName}
                                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-monday-dark-border bg-white dark:bg-monday-dark-bg text-gray-800 dark:text-monday-dark-text rounded-sm p-3 text-[14px] focus:border-monday-blue focus:ring-2 focus:ring-monday-blue/20 outline-none transition-colors duration-100 shadow-sm"
                                            placeholder={t('workspace_name_placeholder')}
                                        />
                                    </div>

                                    {/* High Graphics Icon Picker */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-monday-dark-text-secondary uppercase tracking-wider mb-2">{t('workspace_icon')}</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsWorkspaceIconPickerOpen(!isWorkspaceIconPickerOpen)}
                                                className="w-full flex items-center justify-between p-3 rounded-sm border border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-bg hover:border-monday-blue dark:hover:border-monday-blue transition-colors duration-100 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                                        {React.createElement(ICON_MAP[newWorkspaceIcon] || Briefcase, { size: 20 })}
                                                    </div>
                                                    <span className="font-medium text-gray-700 dark:text-gray-200">{t(newWorkspaceIcon)}</span>
                                                </div>
                                                <CaretDown size={13} weight="light" className={`text-gray-400 transition-transform duration-300 ${isWorkspaceIconPickerOpen ? 'rotate-180' : ''}`} />
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
                                                                    aspect-square rounded-sm flex items-center justify-center transition-colors duration-100
                                                                    bg-gradient-to-br ${gradient} text-white
                                                                    ${isSelected
                                                                            ? 'shadow-lg scale-110 ring-2 ring-offset-2 ring-blue-500'
                                                                            : 'opacity-70 hover:opacity-100 hover:scale-110 shadow-sm'}
                                                                `}
                                                                    title={t(iconName)}
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
                                            className="px-6 py-2.5 bg-gradient-to-r from-monday-blue to-blue-600 text-white text-[14px] font-medium rounded-sm hover:shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:shadow-none transition-colors duration-100"
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
                        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
                            <div className={`pointer-events-auto bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl transition-colors duration-100 flex flex-col ${creationStep === 'template' ? 'w-[90vw] max-w-5xl h-[80vh]' : 'w-96 max-h-[90vh]'}`}>
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
                                                    {t('board_name')}
                                                </label>
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={newBoardName}
                                                    onChange={(e) => setNewBoardName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-monday-dark-hover border border-gray-200 dark:border-monday-dark-border rounded-xl focus:ring-2 focus:ring-monday-blue/20 focus:border-monday-blue transition-colors duration-100 outline-none font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                                                    placeholder={t('board_name_placeholder')}
                                                />
                                            </div>

                                            {/* Layout Selection */}
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{t('add_view')}</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'table', label: t('table'), icon: Table },
                                                        { id: 'kanban', label: t('kanban'), icon: Kanban },
                                                        { id: 'list', label: t('list'), icon: List },
                                                        { id: 'calendar', label: t('calendar'), icon: CalendarBlank },
                                                        { id: 'gantt', label: t('gantt'), icon: ChartLineUp },
                                                        { id: 'doc', label: t('doc'), icon: FileText },
                                                    ].map((tool) => (
                                                        <button
                                                            key={tool.id}
                                                            type="button"
                                                            onClick={() => setSelectedLayout(tool.id as any)}
                                                            className={`
                                                        relative flex flex-col items-center justify-center gap-2 p-2 rounded-lg border-2 transition-colors duration-100 group
                                                        ${selectedLayout === tool.id
                                                                    ? 'border-monday-blue bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                                                                    : 'border-transparent bg-gray-50 dark:bg-monday-dark-hover hover:scale-[1.02]'}
                                                    `}
                                                        >
                                                            <div className={`
                                                        w-8 h-8 rounded-sm flex items-center justify-center transition-colors
                                                        ${selectedLayout === tool.id ? 'bg-monday-blue text-white' : 'bg-white dark:bg-monday-dark-surface text-gray-500'}
                                                    `}>
                                                                <tool.icon size={18} />
                                                            </div>
                                                            <h4 className={`font-bold text-xs ${selectedLayout === tool.id ? 'text-monday-blue' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                {tool.label}
                                                            </h4>
                                                            {selectedLayout === tool.id && (
                                                                <div className="absolute top-1 right-1 text-monday-blue">
                                                                    <CheckSquare size={12} weight="fill" className="fill-current" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Icon Picker */}
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{t('board_icon')}</label>

                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface hover:border-gray-300 transition-colors duration-100 group"
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
                                                                <div className="text-[14px] font-semibold text-gray-700 dark:text-gray-200">{t(newBoardIcon.toLowerCase())}</div>
                                                                <div className="text-xs text-gray-400">{t('click_to_change_icon')}</div>
                                                            </div>
                                                        </div>
                                                        <CaretDown size={13} weight="light" className={`text-gray-400 transition-transform duration-300 ${isIconPickerOpen ? 'rotate-180' : ''}`} />
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
                                                                            aspect-square rounded-sm flex items-center justify-center transition-colors duration-100
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
                                                    className="px-6 py-2.5 bg-gradient-to-r from-monday-blue to-blue-600 text-white text-[14px] font-medium rounded-sm hover:shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:shadow-none transition-colors duration-100"
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
                {
                    isCollapsed && (
                        <div className="absolute inset-0 flex flex-col items-center overflow-y-auto no-scrollbar py-4 px-1">
                            <div className="flex-1" />
                            <QuickNavIcons
                                activeView={activeView}
                                activeBoardId={activeBoardId}
                                onNavigate={onNavigate}
                                onExpandSidebar={onToggleCollapse}
                                boards={boards}
                            />
                            <div className="flex-1" />
                        </div>
                    )
                }
            </div >
        </>
    );
});
