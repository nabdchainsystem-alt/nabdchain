import React, { useState, useEffect, useRef } from 'react';
import {
    Home, Grid, Plus, MoreHorizontal, Search, Settings,
    ChevronRight, Briefcase, ChevronDown, Inbox, Users,
    Lock, Star, Trash2, Copy, Edit, ExternalLink,
    Archive, FileText, ArrowRightCircle, Folder, Layout,
    Heart, Smile, Globe, Cpu, Database, Cloud, Code, Terminal,
    Command, Hash, Image, Music, Video, PenTool, Box, Package, Layers,
    ChevronLeft, LayoutDashboard, FileSpreadsheet, GitMerge, Puzzle,
    Download, Wand2, Table, LayoutTemplate, BriefcaseBusiness, List, KanbanSquare, MessageSquare, CheckSquare, Sparkles, Activity
} from 'lucide-react';
import { Board, Workspace, ViewState } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { TemplatePicker } from '../../features/board/components/TemplatePicker';
import { BoardTemplate } from '../../features/board/data/templates';
import { ConfirmModal } from '../../features/board/components/ConfirmModal';

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, any> = {
    Briefcase, Layout, Star, Heart, Smile, Globe, Cpu, Database, Cloud, Code, Terminal,
    Command, Hash, Image, Music, Video, PenTool, Box, Package, Layers, Home, Grid, Folder
};

interface SidebarProps {
    onNavigate: (view: ViewState, boardId?: string) => void;
    activeView: ViewState;
    activeBoardId: string | null;
    width: number;
    onResize: (newWidth: number) => void;
    workspaces: Workspace[];
    activeWorkspaceId: string;
    onWorkspaceChange: (id: string) => void;
    onAddWorkspace: (name: string, icon: string) => void;
    onDeleteWorkspace: (id: string) => void;
    boards: Board[];
    onDeleteBoard: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onAddBoard: (name: string, icon: string, template?: BoardTemplate, defaultView?: string, parentId?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    onNavigate, activeView, activeBoardId, width, onResize,
    workspaces, activeWorkspaceId, onWorkspaceChange, onAddWorkspace, onDeleteWorkspace,
    boards, onDeleteBoard, onToggleFavorite,
    isCollapsed, onToggleCollapse, onAddBoard
}) => {
    const { t, dir } = useAppContext();
    const [isResizing, setIsResizing] = useState(false);
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
    const [isAddWorkspaceModalOpen, setIsAddWorkspaceModalOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [addMenuPos, setAddMenuPos] = useState<{ top?: number, bottom?: number, left: number }>({ top: 0, left: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, boardId: string } | null>(null);
    const [workspaceContextMenu, setWorkspaceContextMenu] = useState<{ x: number, y: number, workspaceId: string } | null>(null);
    const [isBoardHovered, setIsBoardHovered] = useState(false);
    const [isDashboardHovered, setIsDashboardHovered] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

    const addMenuRef = useRef<HTMLDivElement>(null);
    const addButtonRef = useRef<HTMLButtonElement>(null);

    // New Workspace State
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newWorkspaceIcon, setNewWorkspaceIcon] = useState('Briefcase');

    // New Board State
    const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardIcon, setNewBoardIcon] = useState('Table');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [creationStep, setCreationStep] = useState<'template' | 'details'>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | undefined>(undefined);
    const [selectedLayout, setSelectedLayout] = useState<'table' | 'data_table' | 'kanban' | 'list' | 'list_board'>('table');
    const [parentBoardIdForCreation, setParentBoardIdForCreation] = useState<string | undefined>(undefined);
    const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set());

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

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
    const workspaceBoards = boards.filter(b => b.workspaceId === activeWorkspaceId);
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
            const newWidth = dir === 'rtl' ? (window.innerWidth - e.clientX) : e.clientX;
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
    }, [isResizing, onResize, dir]);

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
            onAddWorkspace(newWorkspaceName, newWorkspaceIcon);
            setIsAddWorkspaceModalOpen(false);
            setNewWorkspaceName('');
            setNewWorkspaceIcon('Briefcase');
        }
    };

    const handleCreateBoard = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBoardName.trim()) {
            onAddBoard(newBoardName, newBoardIcon, selectedTemplate, selectedLayout, parentBoardIdForCreation);
            setIsNewBoardModalOpen(false);
            setNewBoardName('');
            setNewBoardIcon('Table');
            setSelectedLayout('table');
            setIsIconPickerOpen(false);
            setCreationStep('template'); // Reset for next time
            setSelectedTemplate(undefined);
        }
    };

    const toggleAddMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAddMenuOpen) {
            setIsAddMenuOpen(false);
        } else {
            if (addButtonRef.current) {
                const rect = addButtonRef.current.getBoundingClientRect();
                // Default position (below button, aligned left)
                let left = rect.left;

                // Calculate vertical position
                // If there isn't enough space below (~500px), and there is more space above, flip it.
                const spaceBelow = window.innerHeight - rect.bottom;
                const MENU_HEIGHT = 500;

                let pos: { top?: number, bottom?: number, left: number } = { left };

                if (spaceBelow < MENU_HEIGHT && rect.top > spaceBelow) {
                    // Position above the button
                    // 'bottom' is distance from bottom of viewport
                    pos.bottom = window.innerHeight - rect.top + 8; // 8px gap
                } else {
                    // Position below the button
                    pos.top = rect.bottom + 8;
                }

                setAddMenuPos(pos);
            }
            setIsAddMenuOpen(true);
        }
    };

    const displayedWidth = isCollapsed ? 60 : width;

    return (
        <div
            className={`flex flex-col h-full flex-shrink-0 relative group/sidebar select-none bg-gradient-to-b from-[#F7F8FA] to-[#EEF1F5] dark:from-monday-dark-bg dark:to-monday-dark-bg rounded-s-2xl ms-4 shadow-sm ${isResizing ? '' : 'transition-[width] duration-300 ease-in-out'}`}
            style={{
                width: `${displayedWidth}px`
            }}
        >
            {/* 1. Top Navigation */}
            <div className={`py-3 space-y-0.5 ${isCollapsed ? 'px-2 items-center flex flex-col' : 'px-4'}`}>
                <button
                    onClick={() => onNavigate('dashboard')}
                    title={t('home')}
                    className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-1 rounded-md transition-colors ${activeView === 'dashboard' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Home size={18} />
                    {!isCollapsed && <span className="font-normal text-sm truncate min-w-0 flex-1 text-start">{t('home')}</span>}
                </button>
                <button
                    onClick={() => onNavigate('flow_hub')}
                    title="Flow Hub"
                    className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-1 rounded-md transition-colors ${activeView === 'flow_hub' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Sparkles size={18} />
                    {!isCollapsed && <span className="font-normal text-sm truncate min-w-0 flex-1 text-start">Flow Hub</span>}
                </button>
                <button
                    onClick={() => onNavigate('process_map')}
                    title="Process Map"
                    className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-1 rounded-md transition-colors ${activeView === 'process_map' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Activity size={18} />
                    {!isCollapsed && <span className="font-normal text-sm truncate min-w-0 flex-1 text-start">Process Map</span>}
                </button>
                <button
                    onClick={() => onNavigate('my_work')}
                    title={t('my_work')}
                    className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-1 rounded-md transition-colors ${activeView === 'my_work' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Grid size={18} />
                    {!isCollapsed && <span className="font-normal text-sm truncate min-w-0 flex-1 text-start">{t('my_work')}</span>}
                </button>

                {/* New Pages */}
                <button
                    onClick={() => onNavigate('inbox')}
                    title={t('inbox')}
                    className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-1 rounded-md transition-colors ${activeView === 'inbox' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Inbox size={18} />
                    {!isCollapsed && <span className="font-normal text-sm truncate min-w-0 flex-1 text-start">{t('inbox')}</span>}
                </button>
                <button
                    onClick={() => onNavigate('discussion')}
                    title="Discussion"
                    className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-1 rounded-md transition-colors ${activeView === 'discussion' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <MessageSquare size={18} />
                    {!isCollapsed && <span className="font-normal text-sm truncate min-w-0 flex-1 text-start">Discussion</span>}
                </button>

                <button
                    onClick={() => onNavigate('teams')}
                    title={t('teams')}
                    className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-1 rounded-md transition-colors ${activeView === 'teams' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Users size={18} />
                    {!isCollapsed && <span className="font-normal text-sm truncate min-w-0 flex-1 text-start">{t('teams')}</span>}
                </button>
                <button
                    onClick={() => onNavigate('vault')}
                    title={t('vault')}
                    className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-3 py-1 rounded-md transition-colors ${activeView === 'vault' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Lock size={18} />
                    {!isCollapsed && <span className="font-normal text-sm truncate min-w-0 flex-1 text-start">{t('vault')}</span>}
                </button>
            </div>

            <div className="border-t border-gray-200/50 dark:border-monday-dark-border my-2 mx-4"></div>

            {/* 2. Scrollable Content */}
            <div className={`flex-1 overflow-y-auto py-2 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>

                {/* Favorites Section */}
                {!isCollapsed && favoriteBoards.length > 0 && (
                    <div className="mb-6 mt-6">
                        <div className="flex items-center mb-2 px-3 group cursor-pointer hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded py-1">
                            <span className="text-sm font-bold text-gray-700 dark:text-monday-dark-text-secondary flex items-center gap-1.5 w-full">
                                {t('favorites')} <ChevronRight size={14} className="text-gray-400" />
                            </span>
                        </div>
                        <div className="space-y-1">
                            {favoriteBoards.map(board => (
                                <div
                                    key={board.id}
                                    onClick={() => onNavigate('board', board.id)}
                                    className="flex items-center space-x-2 rtl:space-x-reverse text-gray-700 dark:text-monday-dark-text cursor-pointer hover:bg-white/40 dark:hover:bg-monday-dark-hover p-2 rounded transition-colors group"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-monday-blue"></div>
                                    <span className="text-sm truncate flex-1">{board.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Workspaces Header */}
                <div className="mt-2">
                    {!isCollapsed && (
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary truncate">{t('workspaces')}</span>
                            <div className="flex space-x-1 rtl:space-x-reverse flex-shrink-0">
                                <MoreHorizontal size={14} className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
                                <Search size={14} className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
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
                            className={`relative border border-transparent hover:bg-white/40 dark:hover:bg-monday-dark-hover rounded-lg p-2 flex items-center cursor-pointer transition-all hover:shadow-sm hover:border-gray-200/50 dark:hover:border-monday-dark-border ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                        >
                            <div className={`flex items-center ${!isCollapsed ? 'space-x-2 rtl:space-x-reverse truncate' : ''}`}>
                                <div className={`w-6 h-6 rounded bg-gradient-to-tr ${activeWorkspace.color} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm`}>
                                    {activeWorkspace.name.charAt(0)}
                                </div>
                                {!isCollapsed && <span className="text-sm font-medium text-gray-700 dark:text-monday-dark-text truncate min-w-0 flex-1">{activeWorkspace.name}</span>}
                            </div>

                            {!isCollapsed && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        ref={addButtonRef}
                                        onClick={toggleAddMenu}
                                        title={t('add_new')}
                                        className={`w-5 h-5 flex items-center justify-center hover:bg-monday-blue hover:text-white rounded border border-gray-200 dark:border-monday-dark-border shadow-sm transition-all ${isAddMenuOpen ? 'opacity-100 bg-monday-blue text-white' : 'bg-white dark:bg-monday-dark-surface text-gray-500 dark:text-gray-400 opacity-0 group-hover/workspace-card:opacity-100'}`}
                                    >
                                        <Plus size={12} />
                                    </button>
                                    <div className="text-gray-400 dark:text-gray-500 group-hover/workspace-card:text-gray-600 dark:group-hover/workspace-card:text-gray-300">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Workspace Dropdown */}
                        {isWorkspaceMenuOpen && !isCollapsed && (
                            <div className="absolute top-full start-0 w-full bg-white dark:bg-monday-dark-surface shadow-xl rounded-lg border border-gray-100 dark:border-monday-dark-border z-50 mt-1 py-1 max-h-64 overflow-y-auto">
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
                                            <div className={`w-5 h-5 rounded bg-gradient-to-tr ${ws.color} text-white flex items-center justify-center text-[10px]`}>{ws.name.charAt(0)}</div>
                                            <span className={`text-sm truncate ${ws.id === activeWorkspaceId ? 'font-medium text-monday-blue' : 'text-gray-600 dark:text-monday-dark-text'}`}>
                                                {ws.name}
                                            </span>
                                        </div>
                                        <div
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-monday-dark-hover rounded text-gray-500 dark:text-gray-400"
                                            onClick={(e) => handleWorkspaceContextMenu(e, ws.id)}
                                        >
                                            <MoreHorizontal size={12} />
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-gray-100 dark:border-monday-dark-border mt-1 pt-1">
                                    <button
                                        onClick={() => {
                                            setIsAddWorkspaceModalOpen(true);
                                            setIsWorkspaceMenuOpen(false);
                                        }}
                                        className="w-full text-start px-3 py-2 text-sm text-gray-500 dark:text-monday-dark-text-secondary hover:bg-gray-50 dark:hover:bg-monday-dark-hover hover:text-monday-blue flex items-center gap-2"
                                    >
                                        <Plus size={14} /> {t('add_workspace')}
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
                                            className={`flex items-center px-3 py-1 rounded cursor-pointer group transition-colors select-none
                                                ${isActive ? 'bg-white/60 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} 
                                                ${isCollapsed ? 'justify-center' : 'justify-between'}
                                                ${isChild ? 'ml-3' : ''}
                                            `}
                                            onClick={() => onNavigate('board', board.id)}
                                            title={board.name}
                                        >
                                            <div className={`flex items-center ${!isCollapsed ? 'space-x-2 rtl:space-x-reverse truncate' : ''}`}>
                                                {/* Expand Arrow for parents */}
                                                {!isCollapsed && hasChildren ? (
                                                    <div
                                                        onClick={(e) => toggleExpand(board.id, e)}
                                                        className="p-0.5 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 mr-1 transition-colors"
                                                    >
                                                        <ChevronRight size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>
                                                ) : !isCollapsed && (
                                                    <div className="w-4 mr-1"></div>
                                                )}

                                                {React.createElement(ICON_MAP[board.icon || 'Table'] || Table, {
                                                    size: isChild ? 14 : 16,
                                                    className: `${isActive ? 'text-monday-blue' : 'text-gray-500 dark:text-gray-400'} flex-shrink-0`
                                                })}
                                                {!isCollapsed && <span className={`font-normal truncate min-w-0 flex-1 ${isChild ? 'text-xs' : 'text-sm'}`}>{board.name}</span>}
                                            </div>
                                            {!isCollapsed && (
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setParentBoardIdForCreation(board.id);
                                                            setCreationStep('details');
                                                            setSelectedTemplate(undefined);
                                                            setIsNewBoardModalOpen(true);
                                                        }}
                                                        className={`p-1 rounded hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-monday-dark-border invisible group-hover:visible`}
                                                        title="Add sub-board"
                                                    >
                                                        <Plus size={isChild ? 12 : 14} className="" />
                                                    </div>
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setBoardToDelete(board.id);
                                                        }}
                                                        className={`p-1 rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-monday-dark-border invisible group-hover:visible`}
                                                        title="Delete board"
                                                    >
                                                        <Trash2 size={isChild ? 12 : 14} className="" />
                                                    </div>
                                                    <div
                                                        onClick={(e) => handleContextMenu(e, board.id)}
                                                        className={`p-1 rounded hover:bg-white/50 dark:hover:bg-monday-dark-border ${isActive ? 'visible' : 'invisible group-hover:visible'}`}
                                                    >
                                                        <MoreHorizontal size={isChild ? 12 : 14} className="text-gray-500 dark:text-gray-400" />
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

                {/* Resize/Collapse Handle */}
                <button
                    onClick={onToggleCollapse}
                    className="absolute top-8 -right-3 rtl:-left-3 w-6 h-6 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-full flex items-center justify-center text-gray-400 hover:text-monday-blue shadow-sm z-40 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"
                >
                    {(isCollapsed && dir === 'ltr') || (!isCollapsed && dir === 'rtl') ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Resize Drag Zone */}
                {!isCollapsed && (
                    <div
                        className="absolute top-0 right-0 rtl:left-0 w-1 h-full cursor-col-resize hover:bg-monday-blue/20 transition-colors z-30"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizing(true);
                        }}
                    ></div>
                )}

                {/* Board Context Menu */}
                {contextMenu && (
                    <div
                        className="fixed bg-white dark:bg-monday-dark-surface rounded-lg shadow-2xl border border-gray-100 dark:border-monday-dark-border w-56 py-2 z-[60] text-gray-700 dark:text-monday-dark-text animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: Math.min(contextMenu.y, window.innerHeight - 350), left: dir === 'rtl' ? (contextMenu.x - 224) : (contextMenu.x + 10) }}
                    >
                        <div className="px-3 py-1.5 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-monday-dark-hover cursor-pointer text-sm">
                            <ExternalLink size={14} className="text-gray-500 dark:text-gray-400" /> Open in new tab
                        </div>
                        {/* ... other context items would be translated similarly, omitting for brevity ... */}
                        <div className="h-px bg-gray-100 dark:bg-monday-dark-border my-1"></div>
                        <div
                            className="px-3 py-1.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 cursor-pointer text-sm"
                            onClick={() => {
                                onDeleteBoard(contextMenu.boardId);
                                setContextMenu(null);
                            }}
                        >
                            <Trash2 size={14} /> {t('delete')}
                        </div>
                    </div>
                )}

                {/* FIXED ADD NEW MENU - MOVED OUTSIDE SCROLL CONTAINER */}
                {isAddMenuOpen && (
                    <div
                        ref={addMenuRef}
                        className="fixed bg-white dark:bg-monday-dark-surface shadow-2xl rounded-lg border border-gray-200 dark:border-monday-dark-border z-[100] animate-in fade-in zoom-in-95 duration-100 w-64 overflow-visible"
                        style={{
                            top: addMenuPos.top,
                            bottom: addMenuPos.bottom,
                            left: addMenuPos.left
                        }}
                    >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-monday-dark-border">
                            <span className="text-sm font-semibold text-gray-800 dark:text-monday-dark-text">{t('add_new')}</span>
                        </div>
                        <div className="py-2">
                            <div className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <BriefcaseBusiness size={16} className="text-gray-500 dark:text-gray-400" />
                                <span>{t('project')}</span>
                            </div>
                            <div className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <Folder size={16} className="text-gray-500 dark:text-gray-400" />
                                <span>{t('portfolio')}</span>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-monday-dark-border my-1"></div>

                            <div
                                onMouseEnter={() => setIsBoardHovered(true)}
                                onMouseLeave={() => setIsBoardHovered(false)}
                                className="relative px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group"
                            >
                                <div className="flex items-center gap-3">
                                    <Table size={16} className="text-monday-blue" />
                                    <span>{t('board')}</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 rtl:rotate-180" />

                                {/* BOARD SUBMENU */}
                                {isBoardHovered && (
                                    <div className="absolute top-0 left-full rtl:right-full rtl:left-auto ms-1 w-56 bg-white dark:bg-monday-dark-surface shadow-xl rounded-lg border border-gray-200 dark:border-monday-dark-border py-2 z-[110]">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCreationStep('details');
                                                setSelectedTemplate(undefined);
                                                setParentBoardIdForCreation(undefined);
                                                setIsNewBoardModalOpen(true);
                                                setIsAddMenuOpen(false);
                                            }}
                                            className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm"
                                        >
                                            <Table size={16} className="text-monday-blue" />
                                            <span>{t('new_board')}</span>
                                        </div>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCreationStep('template');
                                                setSelectedTemplate(undefined);
                                                setParentBoardIdForCreation(undefined);
                                                setIsNewBoardModalOpen(true);
                                                setIsAddMenuOpen(false);
                                            }}
                                            className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm"
                                        >
                                            <LayoutTemplate size={16} className="text-gray-500 dark:text-gray-400" />
                                            <span>{t('board_template')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <div className="flex items-center gap-3">
                                    <FileText size={16} className="text-gray-500 dark:text-gray-400" />
                                    <span>{t('doc')}</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 rtl:rotate-180" />
                            </div>
                            <div
                                onMouseEnter={() => setIsDashboardHovered(true)}
                                onMouseLeave={() => setIsDashboardHovered(false)}
                                className="relative px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group"
                            >
                                <div className="flex items-center gap-3">
                                    <LayoutDashboard size={16} className="text-gray-500 dark:text-gray-400" />
                                    <span>{t('dashboard')}</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 rtl:rotate-180" />

                                {/* DASHBOARD SUBMENU */}
                                {isDashboardHovered && (
                                    <div className="absolute top-0 left-full rtl:right-full rtl:left-auto ms-1 w-56 bg-white dark:bg-monday-dark-surface shadow-xl rounded-lg border border-gray-200 dark:border-monday-dark-border py-2 z-[110]">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCreationStep('details');
                                                setSelectedTemplate(undefined);
                                                setParentBoardIdForCreation(undefined);
                                                setIsNewBoardModalOpen(true);
                                                setIsAddMenuOpen(false);
                                            }}
                                            className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm"
                                        >
                                            <LayoutDashboard size={16} className="text-monday-blue" />
                                            <span>{t('dashboard')}</span>
                                        </div>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCreationStep('template');
                                                setSelectedTemplate(undefined);
                                                setIsNewBoardModalOpen(true);
                                                setIsAddMenuOpen(false);
                                            }}
                                            className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm"
                                        >
                                            <LayoutTemplate size={16} className="text-gray-500 dark:text-gray-400" />
                                            <span>{t('templates')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet size={16} className="text-gray-500 dark:text-gray-400" />
                                    <span>{t('form')}</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 rtl:rotate-180" />
                            </div>
                            <div className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <GitMerge size={16} className="text-gray-500 dark:text-gray-400" />
                                <span>{t('workflow')}</span>
                            </div>
                            <div className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <Folder size={16} className="text-gray-500 dark:text-gray-400" />
                                <span>{t('folder')}</span>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-monday-dark-border my-1"></div>

                            <div className="px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <div className="flex items-center gap-3">
                                    <Puzzle size={16} className="text-gray-500 dark:text-gray-400" />
                                    <span>{t('installed_apps')}</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 rtl:rotate-180" />
                            </div>
                            <div className="px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <div className="flex items-center gap-3">
                                    <Download size={16} className="text-gray-500 dark:text-gray-400" />
                                    <span>{t('import_data')}</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 rtl:rotate-180" />
                            </div>
                            <div className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group">
                                <Wand2 size={16} className="text-gray-500 dark:text-gray-400" />
                                <span>{t('template_center')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Workspace Modal */}
                {isAddWorkspaceModalOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] backdrop-blur-sm">
                        <div className="bg-white dark:bg-monday-dark-surface rounded-lg shadow-2xl w-96 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-monday-dark-border flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800 dark:text-monday-dark-text">{t('add_workspace')}</h3>
                                <button onClick={() => setIsAddWorkspaceModalOpen(false)}><ChevronDown className="rotate-180 text-gray-500" size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateWorkspace} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary mb-1">Workspace Name</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-monday-dark-border bg-white dark:bg-monday-dark-bg text-gray-800 dark:text-monday-dark-text rounded p-2 text-sm focus:border-monday-blue focus:ring-1 focus:ring-monday-blue outline-none"
                                        placeholder="e.g. Marketing"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddWorkspaceModalOpen(false)}
                                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-monday-dark-hover rounded text-sm"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newWorkspaceName.trim()}
                                        className="px-4 py-2 bg-monday-blue text-white text-sm rounded hover:bg-monday-blue-hover disabled:opacity-50"
                                    >
                                        {t('add_workspace')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Board Modal */}
                {/* Create Board Modal */}
                {isNewBoardModalOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] backdrop-blur-sm">
                        <div className={`bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl transition-all duration-300 ${creationStep === 'template' ? 'w-[90vw] max-w-5xl h-[80vh]' : 'w-96'}`}>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-monday-dark-border flex justify-between items-center bg-white/50 dark:bg-monday-dark-surface/50 backdrop-blur-sm sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    {creationStep === 'details' && (
                                        <button
                                            onClick={() => setCreationStep('template')}
                                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                                        >
                                            <ChevronLeft size={20} className="text-stone-500" />
                                        </button>
                                    )}
                                    {creationStep === 'template' ? (
                                        <h3 className="font-serif font-semibold text-lg text-stone-800 dark:text-stone-100">
                                            {t('new_board')}
                                        </h3>
                                    ) : (
                                        <div className="flex-1 mr-4">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={newBoardName}
                                                onChange={(e) => setNewBoardName(e.target.value)}
                                                className="font-serif font-semibold text-lg text-stone-800 dark:text-stone-100 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full placeholder:text-stone-300 dark:placeholder:text-stone-600"
                                                placeholder="Board Name"
                                            />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsNewBoardModalOpen(false)}
                                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-400 hover:text-stone-600"
                                >
                                    <ChevronDown className="rotate-180" size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden h-full">
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
                                                    className="text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
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
                                    <form onSubmit={handleCreateBoard} className="p-4 space-y-4">


                                        {/* Layout Selection */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider">Choose Layout</label>
                                            <div className="space-y-2">
                                                {[
                                                    { id: 'table', label: 'Table', icon: Table, description: 'Classic spreadsheet-like view' },
                                                    { id: 'datatable', label: 'Data Table', icon: Database, description: 'High performance data grid' },
                                                    { id: 'kanban', label: 'Kanban', icon: KanbanSquare, description: 'Visual workflow board' },
                                                    { id: 'list', label: 'List', icon: List, description: 'Simple task list' },
                                                    { id: 'listboard', label: 'List Board', icon: Globe, description: 'List with board capabilities' }
                                                ].map((tool) => (
                                                    <button
                                                        key={tool.id}
                                                        type="button"
                                                        onClick={() => setSelectedLayout(tool.id as any)}
                                                        className={`
                                                        w-full flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all group
                                                        ${selectedLayout === tool.id
                                                                ? 'border-monday-blue bg-blue-50/50 dark:bg-blue-900/20'
                                                                : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:border-stone-200 dark:hover:border-stone-700'}
                                                    `}
                                                    >
                                                        <div className={`
                                                        p-2.5 rounded-lg transition-colors
                                                        ${selectedLayout === tool.id ? 'bg-monday-blue text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 group-hover:bg-white dark:group-hover:bg-stone-700'}
                                                    `}>
                                                            <tool.icon size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className={`font-bold text-sm ${selectedLayout === tool.id ? 'text-monday-blue' : 'text-stone-700 dark:text-stone-200'}`}>
                                                                {tool.label}
                                                            </h4>
                                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                                                {tool.description}
                                                            </p>
                                                        </div>
                                                        {selectedLayout === tool.id && (
                                                            <div className="text-monday-blue">
                                                                <div className="w-5 h-5 rounded-full bg-monday-blue text-white flex items-center justify-center">
                                                                    <CheckSquare size={12} className="fill-current" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Icon Picker */}
                                        <div className="pt-2">
                                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Board Icon</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl border bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-all text-sm"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400">
                                                            {React.createElement(ICON_MAP[newBoardIcon] || Table, { size: 18 })}
                                                        </div>
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300">{newBoardIcon}</span>
                                                    </div>
                                                    <ChevronDown size={16} className={`text-stone-400 transition-transform ${isIconPickerOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isIconPickerOpen && (
                                                    <div className="absolute bottom-full left-0 w-full bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-xl rounded-xl mb-2 p-3 max-h-64 overflow-y-auto grid grid-cols-6 gap-2 z-20 custom-scrollbar">
                                                        {Object.keys(ICON_MAP).map(iconName => (
                                                            <button
                                                                key={iconName}
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewBoardIcon(iconName);
                                                                    setIsIconPickerOpen(false);
                                                                }}
                                                                className={`
                                                                aspect-square rounded-lg flex items-center justify-center transition-all
                                                                ${newBoardIcon === iconName
                                                                        ? 'bg-monday-blue text-white shadow-md scale-110'
                                                                        : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-800 dark:hover:text-stone-200'}
                                                            `}
                                                                title={iconName}
                                                            >
                                                                {React.createElement(ICON_MAP[iconName], { size: 18 })}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsNewBoardModalOpen(false)}
                                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-monday-dark-hover rounded text-sm"
                                            >
                                                {t('cancel')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!newBoardName.trim()}
                                                className="px-4 py-2 bg-monday-blue text-white text-sm rounded hover:bg-monday-blue-hover disabled:opacity-50"
                                            >
                                                Create Board
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={!!boardToDelete}
                    onClose={() => setBoardToDelete(null)}
                    onConfirm={() => {
                        if (boardToDelete) {
                            onDeleteBoard(boardToDelete);
                            setBoardToDelete(null);
                        }
                    }}
                    title={t('Delete Board')}
                    message={t('Are you sure you want to delete this board? This action cannot be undone.')}
                />
            </div>
        </div>
    );
};