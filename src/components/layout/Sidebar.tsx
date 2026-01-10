import React, { useState, useEffect, useRef } from 'react';
import {
    Home, Grid, Plus, MoreHorizontal, Search, Settings,
    ChevronRight, Briefcase, ChevronDown, Inbox, Users,
    Lock, Star, Trash2, Copy, Edit, ExternalLink,
    Archive, FileText, ArrowRightCircle, Folder, Layout,
    Heart, Smile, Globe, Cpu, Database, Cloud, Code, Terminal,
    Command, Hash, Image, Music, Video, PenTool, Box, Package, Layers,
    ChevronLeft, LayoutDashboard, FileSpreadsheet, GitMerge, Puzzle,
    Download, Wand2, Table, LayoutTemplate, BriefcaseBusiness, List, KanbanSquare, MessageSquare, CheckSquare, Sparkles, Activity,
    Factory, Truck, ShoppingCart, ShieldCheck, Banknote, Megaphone, Monitor, Users2, CreditCard, Building2, Wrench, Boxes
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
    onNavigate: (view: ViewState | string, boardId?: string) => void;
    activeView: ViewState | string;
    activeBoardId: string | null;
    width: number;
    onResize: (newWidth: number) => void;
    workspaces: Workspace[];
    activeWorkspaceId: string;
    onWorkspaceChange: (id: string) => void;
    onAddWorkspace: (name: string, icon: string, color?: string) => void;
    onDeleteWorkspace: (id: string) => void;
    boards: Board[];
    onDeleteBoard: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onAddBoard: (name: string, icon: string, template?: BoardTemplate, defaultView?: string, parentId?: string) => void;
    pageVisibility: Record<string, boolean>;
}

export const Sidebar: React.FC<SidebarProps> = ({
    onNavigate, activeView, activeBoardId, width, onResize,
    workspaces, activeWorkspaceId, onWorkspaceChange, onAddWorkspace, onDeleteWorkspace,
    boards, onDeleteBoard, onToggleFavorite,
    isCollapsed, onToggleCollapse, onAddBoard, pageVisibility
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

    // New Board State
    const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardIcon, setNewBoardIcon] = useState('Table');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [creationStep, setCreationStep] = useState<'template' | 'details'>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | undefined>(undefined);
    const [selectedLayout, setSelectedLayout] = useState<'table' | 'data_table' | 'datatable' | 'kanban' | 'list'>('table');
    const [parentBoardIdForCreation, setParentBoardIdForCreation] = useState<string | undefined>(undefined);
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
    const workspaceBoards = boards.filter(b => b.workspaceId === activeWorkspaceId && b.type !== 'discussion');
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

            onAddWorkspace(newWorkspaceName, newWorkspaceIcon, color);
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

    const displayedWidth = isCollapsed ? 64 : width;
    const textBase = 'transition-[max-width,opacity] duration-200 ease-in-out overflow-hidden';
    const textVisibility = isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100';

    return (
        <div
            className={`flex flex-col h-full min-h-0 flex-shrink-0 relative group/sidebar select-none bg-gradient-to-b from-[#F7F8FA] to-[#EEF1F5] dark:from-monday-dark-bg dark:to-monday-dark-bg rounded-s-2xl ms-4 shadow-sm ${isResizing ? '' : 'transition-[width] duration-200 ease-out will-change-[width]'}`}
            style={{
                width: `${displayedWidth}px`
            }}
        >
            <div className="h-full min-h-0 flex flex-col">
                {/* 1. Top Navigation */}
                <div className={`pt-6 pb-3 space-y-0.5 ${isCollapsed ? 'px-2 items-center flex flex-col' : 'px-4'}`}>
                    <button
                        onClick={() => onNavigate('dashboard')}
                        title={t('home')}
                        className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1 rounded-md transition-colors ${activeView === 'dashboard' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <Home size={18} />
                        <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>{t('home')}</span>
                    </button>
                    {pageVisibility['flow_hub'] !== false && (
                        <button
                            onClick={() => onNavigate('flow_hub')}
                            title="Flow Hub"
                            className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1 rounded-md transition-colors ${activeView === 'flow_hub' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <Sparkles size={18} />
                            <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>Flow Hub</span>
                        </button>
                    )}
                    {pageVisibility['process_map'] !== false && (
                        <button
                            onClick={() => onNavigate('process_map')}
                            title="Process Map"
                            className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1 rounded-md transition-colors ${activeView === 'process_map' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <Activity size={18} />
                            <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>Process Map</span>
                        </button>
                    )}
                    {pageVisibility['my_work'] !== false && (
                        <button
                            onClick={() => onNavigate('my_work')}
                            title={t('my_work')}
                            className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1 rounded-md transition-colors ${activeView === 'my_work' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <Grid size={18} />
                            <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>{t('my_work')}</span>
                        </button>
                    )}

                    {/* New Pages */}
                    {pageVisibility['inbox'] !== false && (
                        <button
                            onClick={() => onNavigate('inbox')}
                            title={t('inbox')}
                            className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1 rounded-md transition-colors ${activeView === 'inbox' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <Inbox size={18} />
                            <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>{t('inbox')}</span>
                        </button>
                    )}
                    {pageVisibility['discussion'] !== false && (
                        <button
                            onClick={() => onNavigate('discussion')}
                            title="Discussion"
                            className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1 rounded-md transition-colors ${activeView === 'discussion' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <MessageSquare size={18} />
                            <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>Discussion</span>
                        </button>
                    )}

                    {pageVisibility['teams'] !== false && (
                        <button
                            onClick={() => onNavigate('teams')}
                            title={t('teams')}
                            className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1 rounded-md transition-colors ${activeView === 'teams' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <Users size={18} />
                            <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>{t('teams')}</span>
                        </button>
                    )}
                    {pageVisibility['vault'] !== false && (
                        <button
                            onClick={() => onNavigate('vault')}
                            title={t('vault')}
                            className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1 rounded-md transition-colors ${activeView === 'vault' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <Lock size={18} />
                            <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>{t('vault')}</span>
                        </button>
                    )}
                </div>

                <div className="border-t border-gray-200/50 dark:border-monday-dark-border my-2 mx-4"></div>

                {/* 2. Scrollable Content */}
                <div className={`flex-1 min-h-0 overflow-y-auto py-2 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>

                    {/* Departments Section */}
                    <div className="mb-6">
                        {!isCollapsed && (
                            <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary truncate">DEPARTMENTS</span>
                            </div>
                        )}

                        {/* Supply Chain */}
                        {pageVisibility['supply_chain'] !== false && (
                            <div className="mb-1">
                                <div
                                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text ${isCollapsed ? 'justify-center' : ''}`}
                                    onClick={() => !isCollapsed && toggleDepartment('supply_chain')}
                                    title="Supply Chain"
                                >
                                    <div className={`flex items-center ${!isCollapsed ? 'gap-2' : ''} truncate`}>
                                        <Boxes size={18} className="text-gray-500" />
                                        <span className={`text-sm font-medium ${textBase} ${textVisibility}`}>Supply Chain</span>
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${expandedDepartments.has('supply_chain') ? 'rotate-180' : ''} ${isCollapsed ? 'hidden' : 'opacity-100'}`} />
                                </div>
                                {expandedDepartments.has('supply_chain') && !isCollapsed && (
                                    <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                        {pageVisibility['procurement'] !== false && (
                                            <button onClick={() => onNavigate('procurement')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'procurement' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <ShoppingCart size={14} /> <span>Procurement</span>
                                            </button>
                                        )}
                                        {pageVisibility['warehouse'] !== false && (
                                            <button onClick={() => onNavigate('warehouse')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'warehouse' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Home size={14} /> <span>Warehouse</span>
                                            </button>
                                        )}
                                        {pageVisibility['shipping'] !== false && (
                                            <button onClick={() => onNavigate('shipping')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'shipping' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Truck size={14} /> <span>Shipping</span>
                                            </button>
                                        )}
                                        {pageVisibility['fleet'] !== false && (
                                            <button onClick={() => onNavigate('fleet')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'fleet' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Truck size={14} /> <span>Fleet</span>
                                            </button>
                                        )}
                                        {pageVisibility['vendors'] !== false && (
                                            <button onClick={() => onNavigate('vendors')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'vendors' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Users2 size={14} /> <span>Vendors</span>
                                            </button>
                                        )}
                                        {pageVisibility['planning'] !== false && (
                                            <button onClick={() => onNavigate('planning')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'planning' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <LayoutDashboard size={14} /> <span>Planning</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Operations */}
                        {pageVisibility['operations'] !== false && (
                            <div className="mb-1">
                                <div
                                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text ${isCollapsed ? 'justify-center' : ''}`}
                                    onClick={() => !isCollapsed && toggleDepartment('operations')}
                                    title="Operations"
                                >
                                    <div className={`flex items-center ${!isCollapsed ? 'gap-2' : ''} truncate`}>
                                        <Factory size={18} className="text-gray-500" />
                                        <span className={`text-sm font-medium ${textBase} ${textVisibility}`}>Operations</span>
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${expandedDepartments.has('operations') ? 'rotate-180' : ''} ${isCollapsed ? 'hidden' : 'opacity-100'}`} />
                                </div>
                                {expandedDepartments.has('operations') && !isCollapsed && (
                                    <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                        {pageVisibility['maintenance'] !== false && (
                                            <button onClick={() => onNavigate('maintenance')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'maintenance' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Wrench size={14} /> <span>Maintenance</span>
                                            </button>
                                        )}
                                        {pageVisibility['production'] !== false && (
                                            <button onClick={() => onNavigate('production')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'production' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Factory size={14} /> <span>Production</span>
                                            </button>
                                        )}
                                        {pageVisibility['quality'] !== false && (
                                            <button onClick={() => onNavigate('quality')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'quality' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <ShieldCheck size={14} /> <span>Quality</span>
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
                                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text ${isCollapsed ? 'justify-center' : ''}`}
                                    onClick={() => !isCollapsed && toggleDepartment('business')}
                                    title="Business"
                                >
                                    <div className={`flex items-center ${!isCollapsed ? 'gap-2' : ''} truncate`}>
                                        <Building2 size={18} className="text-gray-500" />
                                        <span className={`text-sm font-medium ${textBase} ${textVisibility}`}>Business</span>
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${expandedDepartments.has('business') ? 'rotate-180' : ''} ${isCollapsed ? 'hidden' : 'opacity-100'}`} />
                                </div>
                                {expandedDepartments.has('business') && !isCollapsed && (
                                    <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                        {pageVisibility['sales_listing'] !== false && (
                                            <button onClick={() => onNavigate('sales_listing')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales_listing' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <FileSpreadsheet size={14} /> <span>Listings</span>
                                            </button>
                                        )}
                                        {pageVisibility['sales_factory'] !== false && (
                                            <button onClick={() => onNavigate('sales_factory')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales_factory' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Factory size={14} /> <span>Sales Factory</span>
                                            </button>
                                        )}
                                        {pageVisibility['sales'] !== false && (
                                            <button onClick={() => onNavigate('sales')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'sales' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Megaphone size={14} /> <span>Sales</span>
                                            </button>
                                        )}
                                        {pageVisibility['finance'] !== false && (
                                            <button onClick={() => onNavigate('finance')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'finance' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Banknote size={14} /> <span>Finance</span>
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
                                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text ${isCollapsed ? 'justify-center' : ''}`}
                                    onClick={() => !isCollapsed && toggleDepartment('business_support')}
                                    title="Business Support"
                                >
                                    <div className={`flex items-center ${!isCollapsed ? 'gap-2' : ''} truncate`}>
                                        <Users size={18} className="text-gray-500" />
                                        <span className={`text-sm font-medium ${textBase} ${textVisibility}`}>Support</span>
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${expandedDepartments.has('business_support') ? 'rotate-180' : ''} ${isCollapsed ? 'hidden' : 'opacity-100'}`} />
                                </div>
                                {expandedDepartments.has('business_support') && !isCollapsed && (
                                    <div className="ml-2 pl-3 border-l border-gray-200 dark:border-monday-dark-border mt-1 space-y-0.5">
                                        {pageVisibility['it_support'] !== false && (
                                            <button onClick={() => onNavigate('it_support')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'it_support' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Monitor size={14} /> <span>IT</span>
                                            </button>
                                        )}
                                        {pageVisibility['hr'] !== false && (
                                            <button onClick={() => onNavigate('hr')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'hr' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Users2 size={14} /> <span>HR</span>
                                            </button>
                                        )}
                                        {pageVisibility['marketing'] !== false && (
                                            <button onClick={() => onNavigate('marketing')} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover ${activeView === 'marketing' ? 'bg-blue-50 text-blue-600 dark:bg-monday-dark-hover' : ''}`}>
                                                <Megaphone size={14} /> <span>Marketing</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

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
                                        className={`flex items-center ${!isCollapsed ? 'space-x-2 rtl:space-x-reverse' : ''} text-gray-700 dark:text-monday-dark-text cursor-pointer hover:bg-white/40 dark:hover:bg-monday-dark-hover p-2 rounded transition-colors group`}
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
                                    <span className={`text-sm font-medium text-gray-700 dark:text-monday-dark-text truncate min-w-0 flex-1 ${textBase} ${textVisibility}`}>{activeWorkspace.name}</span>
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
                                                    <span className={`font-normal truncate min-w-0 flex-1 ${isChild ? 'text-xs' : 'text-sm'} ${textBase} ${textVisibility}`}>{board.name}</span>
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

                    {/* Marketplace Section */}
                    <div className="mt-6">
                        {!isCollapsed && (
                            <div className="flex items-center mb-2 px-1">
                                <span className="text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary truncate">MARKETPLACE</span>
                            </div>
                        )}
                        <div className="space-y-1">
                            {pageVisibility['local_marketplace'] !== false && (
                                <button
                                    onClick={() => onNavigate('local_marketplace')}
                                    title="Local Marketplace"
                                    className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1.5 rounded-md transition-colors ${activeView === 'local_marketplace' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <ShoppingCart size={16} />
                                    <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>Local Marketplace</span>
                                </button>
                            )}
                            {pageVisibility['foreign_marketplace'] !== false && (
                                <button
                                    onClick={() => onNavigate('foreign_marketplace')}
                                    title="Foreign Marketplace"
                                    className={`flex items-center ${!isCollapsed ? 'space-x-3 rtl:space-x-reverse' : ''} w-full px-3 py-1.5 rounded-md transition-colors ${activeView === 'foreign_marketplace' ? 'bg-white/50 dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'hover:bg-white/40 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text'} ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <Globe size={16} />
                                    <span className={`font-normal text-sm truncate min-w-0 flex-1 text-start ${textBase} ${textVisibility}`}>Foreign Marketplace</span>
                                </button>
                            )}
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

                </div>

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

                {/* Workspace Context Menu */}
                {workspaceContextMenu && (
                    <div
                        className="fixed bg-white dark:bg-monday-dark-surface rounded-lg shadow-2xl border border-gray-100 dark:border-monday-dark-border w-56 py-2 z-[60] text-gray-700 dark:text-monday-dark-text animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: Math.min(workspaceContextMenu.y, window.innerHeight - 150), left: dir === 'rtl' ? (workspaceContextMenu.x - 224) : (workspaceContextMenu.x + 10) }}
                    >
                        <div
                            className="px-3 py-1.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover cursor-pointer text-sm"
                            onClick={() => {
                                // Edit functionality could go here
                                setWorkspaceContextMenu(null);
                            }}
                        >
                            <Edit size={14} className="text-gray-500" /> Rename
                        </div>
                        <div className="h-px bg-gray-100 dark:bg-monday-dark-border my-1"></div>
                        <div
                            className="px-3 py-1.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 cursor-pointer text-sm"
                            onClick={() => {
                                if (workspaces.length <= 1) {
                                    alert(t('Cannot delete the only workspace. Create another one first.'));
                                    return;
                                }
                                setWorkspaceToDelete(workspaceContextMenu.workspaceId);
                                setWorkspaceContextMenu(null);
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
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAddWorkspaceModalOpen(true);
                                    setIsAddMenuOpen(false);
                                }}
                                className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-monday-dark-hover cursor-pointer text-gray-700 dark:text-gray-200 text-sm group"
                            >
                                <Briefcase size={16} className="text-gray-500 dark:text-gray-400" />
                                <span>{t('workspace')}</span>
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-monday-dark-border my-1"></div>
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
                                    <div className="absolute top-0 left-full rtl:right-full rtl:left-auto w-56 pl-1 rtl:pr-1 z-[110]">
                                        <div className="bg-white dark:bg-monday-dark-surface shadow-xl rounded-lg border border-gray-200 dark:border-monday-dark-border py-2 w-full">
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
                                    <div className="absolute top-0 left-full rtl:right-full rtl:left-auto w-56 pl-1 rtl:pr-1 z-[110]">
                                        <div className="bg-white dark:bg-monday-dark-surface shadow-xl rounded-lg border border-gray-200 dark:border-monday-dark-border py-2 w-full">
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
                        <div className="bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl w-[450px] border border-gray-100 dark:border-monday-dark-border">
                            <div className="p-5 border-b border-gray-100 dark:border-monday-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-monday-dark-bg/50 rounded-t-xl">
                                <h3 className="font-semibold text-lg text-gray-800 dark:text-monday-dark-text">{t('add_workspace')}</h3>
                                <button onClick={() => setIsAddWorkspaceModalOpen(false)} className="hover:bg-gray-200 dark:hover:bg-monday-dark-hover p-1 rounded-md transition-colors">
                                    <ChevronDown className="rotate-180 text-gray-500" size={20} />
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
                                        className="w-full border border-gray-300 dark:border-monday-dark-border bg-white dark:bg-monday-dark-bg text-gray-800 dark:text-monday-dark-text rounded-lg p-3 text-sm focus:border-monday-blue focus:ring-2 focus:ring-monday-blue/20 outline-none transition-all shadow-sm"
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
                                            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-bg hover:border-monday-blue dark:hover:border-monday-blue transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                                                    {React.createElement(ICON_MAP[newWorkspaceIcon] || Briefcase, { size: 20 })}
                                                </div>
                                                <span className="font-medium text-gray-700 dark:text-gray-200">{newWorkspaceIcon}</span>
                                            </div>
                                            <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isWorkspaceIconPickerOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isWorkspaceIconPickerOpen && (
                                            <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border shadow-2xl rounded-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
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
                                                                    aspect-square rounded-lg flex items-center justify-center transition-all duration-200
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
                                        onClick={() => setIsAddWorkspaceModalOpen(false)}
                                        className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newWorkspaceName.trim()}
                                        className="px-6 py-2.5 bg-gradient-to-r from-monday-blue to-blue-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:shadow-none transition-all"
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
                        <div className={`bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl transition-all duration-300 flex flex-col ${creationStep === 'template' ? 'w-[90vw] max-w-5xl h-[80vh]' : 'w-96 max-h-[90vh]'}`}>
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100 dark:border-monday-dark-border flex justify-between items-center bg-white dark:bg-monday-dark-surface rounded-t-xl flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    {creationStep === 'details' && (
                                        <button
                                            onClick={() => setCreationStep('template')}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-lg transition-colors group"
                                        >
                                            <ChevronLeft size={20} className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500" />
                                        </button>
                                    )}
                                    <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-100">
                                        {creationStep === 'template' ? t('new_board') : t('create_board')}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsNewBoardModalOpen(false)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <ChevronDown className="rotate-180" size={20} />
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
                                    <form onSubmit={handleCreateBoard} className="p-6 space-y-6">
                                        {/* Board Name Input */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Board Name
                                            </label>
                                            <input
                                                type="text"
                                                autoFocus
                                                value={newBoardName}
                                                onChange={(e) => setNewBoardName(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-monday-dark-hover border border-gray-200 dark:border-monday-dark-border rounded-xl focus:ring-2 focus:ring-monday-blue/20 focus:border-monday-blue transition-all outline-none font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                                                placeholder="e.g. Q4 Marketing Plan"
                                            />
                                        </div>

                                        {/* Layout Selection */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Choose Layout</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'table', label: 'Table', icon: Table, description: 'Spreadsheet view' },
                                                    { id: 'kanban', label: 'Kanban', icon: KanbanSquare, description: 'Visual workflow' },
                                                    { id: 'list', label: 'List', icon: List, description: 'Simple task list' },
                                                    { id: 'datatable', label: 'Data Table', icon: Database, description: 'High performance' }
                                                ].map((tool) => (
                                                    <button
                                                        key={tool.id}
                                                        type="button"
                                                        onClick={() => setSelectedLayout(tool.id as any)}
                                                        className={`
                                                        relative flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all duration-200 group
                                                        ${selectedLayout === tool.id
                                                                ? 'border-monday-blue bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                                                                : 'border-transparent bg-gray-50 dark:bg-monday-dark-hover hover:scale-[1.02]'}
                                                    `}
                                                    >
                                                        <div className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                                        ${selectedLayout === tool.id ? 'bg-monday-blue text-white' : 'bg-white dark:bg-monday-dark-surface text-gray-500'}
                                                    `}>
                                                            <tool.icon size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-bold text-sm ${selectedLayout === tool.id ? 'text-monday-blue' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                {tool.label}
                                                            </h4>
                                                            <p className="text-[10px] text-gray-500 font-medium truncate">
                                                                {tool.description}
                                                            </p>
                                                        </div>
                                                        {selectedLayout === tool.id && (
                                                            <div className="absolute top-2 right-2 text-monday-blue">
                                                                <CheckSquare size={14} className="fill-current" />
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
                                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface hover:border-gray-300 transition-all group"
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
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${gradient} shadow-md`}>
                                                                    {React.createElement(ICON_MAP[newBoardIcon] || Table, { size: 20 })}
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="text-left">
                                                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{newBoardIcon}</div>
                                                            <div className="text-xs text-gray-400">Click to change icon</div>
                                                        </div>
                                                    </div>
                                                    <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isIconPickerOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isIconPickerOpen && (
                                                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border shadow-2xl rounded-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
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
                                                                            aspect-square rounded-lg flex items-center justify-center transition-all duration-200
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
                                                className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-monday-dark-hover rounded-lg text-sm font-medium transition-colors"
                                            >
                                                {t('cancel')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!newBoardName.trim()}
                                                className="px-6 py-2.5 bg-gradient-to-r from-monday-blue to-blue-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:shadow-none transition-all"
                                            >
                                                {t('create_board')}
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
                    title={t('Delete Workspace')}
                    message={t('Are you sure you want to delete this workspace? All boards within it will be deleted. This action cannot be undone.')}
                />
            </div>
        </div>
    );
};
