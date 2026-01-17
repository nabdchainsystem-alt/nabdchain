import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import {
    Layout,
    CalendarBlank as CalendarIcon,
    CheckCircle as CheckCircle2,
    Clock,
    Funnel as Filter,
    Plus,
    MagnifyingGlass as Search,
    Gear as Settings,
    CaretLeft as ChevronLeft,
    CaretRight as ChevronRight,
    DotsThree as MoreHorizontal,
    Bell,
    List as Menu,
    X,
    Chat as MessageSquare,
    Lightning as Zap,
    Hash,
    Tag,
    WarningCircle as AlertCircle,
    ArrowRight,
    DotsSixVertical as GripVertical,
    Coffee,
    VideoCamera as Video,
    Timer,
    Flag,
    Briefcase,
    Bug
} from 'phosphor-react';
import { Board, Task } from '../../types';
import KanbanBoard from '../board/views/Kanban/KanbanBoard';

// Types for our local state
type Tab = 'timeline' | 'kanban';
type FilterType = 'all' | 'design' | 'dev';

interface MyWorkPageProps {
    boards: Board[];
    onNavigateToBoard: (view: 'board', boardId: string) => void;
    onUpdateTasks: (boardId: string, task: Task) => void;
    onAddBoard: (board: Board) => void;
}

const PriorityMenu = ({ onSelect, onClose }: { onSelect: (p: any) => void, onClose: () => void }) => (
    <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-32 bg-white dark:bg-[#2c333a] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
        {['Low', 'Medium', 'High'].map(p => (
            <button
                key={p}
                className="w-full text-start px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                onClick={() => { onSelect(p); onClose(); }}
            >
                <div className={`w-2 h-2 rounded-full ${p === 'High' ? 'bg-red-500' : p === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                <span className="text-slate-700 dark:text-slate-200">{p}</span>
            </button>
        ))}
    </div>
);

const DateMenu = ({ onSelect, onClose }: { onSelect: (d: string) => void, onClose: () => void }) => (
    <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-48 bg-white dark:bg-[#2c333a] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
        {['Today', 'Tomorrow', 'Next Week'].map(d => (
            <button
                key={d}
                className="w-full text-start px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
                onClick={() => { onSelect(d); onClose(); }}
            >
                {d}
            </button>
        ))}
    </div>
);

const BoardSelectionModal = ({ isOpen, onClose, boards, taskName, onSelectBoard, onCreateBoard }: {
    isOpen: boolean;
    onClose: () => void;
    boards: Board[];
    taskName: string;
    onSelectBoard: (boardId: string) => void;
    onCreateBoard: (name: string) => void;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [newBoardName, setNewBoardName] = useState('');
    const [mode, setMode] = useState<'select' | 'create'>('select');

    if (!isOpen) return null;

    const filteredBoards = boards.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1e2329] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#252a30]">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                        {mode === 'select' ? 'Add to Project' : 'Create New Project'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-4">
                    {mode === 'select' ? (
                        <>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search projects..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto mb-4 space-y-1 custom-scrollbar">
                                {filteredBoards.map(board => (
                                    <button
                                        key={board.id}
                                        onClick={() => onSelectBoard(board.id)}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg group transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <Hash size={16} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-slate-700 dark:text-slate-200">{board.name}</p>
                                            <p className="text-[10px] text-slate-400">{board.tasks?.length || 0} tasks</p>
                                        </div>
                                        <ChevronRight size={14} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                                {filteredBoards.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <p className="text-sm">No projects found</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setMode('create')}
                                className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors border border-dashed border-blue-200 dark:border-blue-800"
                            >
                                <Plus size={16} /> Create "{searchTerm || 'New Project'}"
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    placeholder="e.g. Q4 Marketing Campaign"
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setMode('select')}
                                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (newBoardName.trim()) {
                                            onCreateBoard(newBoardName);
                                        }
                                    }}
                                    disabled={!newBoardName.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Create Project
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export const MyWorkPage: React.FC<MyWorkPageProps> = ({ boards, onNavigateToBoard, onUpdateTasks, onAddBoard }) => {
    const { t } = useAppContext();
    // Local State
    const [currentTab, setCurrentTab] = useState<Tab>('timeline');
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Task Bucket State
    const [newTaskName, setNewTaskName] = useState('');
    const [isProjectActive, setIsProjectActive] = useState(false);
    const [activeMenu, setActiveMenu] = useState<'none' | 'priority' | 'date'>('none');
    const [newTaskPriority, setNewTaskPriority] = useState<any>(null);
    const [newTaskDate, setNewTaskDate] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleTaskInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTaskName.trim()) {
            console.log("Enter pressed, opening modal");
            setIsModalOpen(true);
        }
    };

    const handleSelectBoard = (boardId: string) => {
        const board = boards.find(b => b.id === boardId);
        if (board) {
            const newTask: Task = {
                id: `TEMP-${Date.now()}`, // Backend should assign real ID
                name: newTaskName,
                status: 'To Do',
                priority: newTaskPriority || 'Medium',
                label: 'General', // Fallback
                date: newTaskDate || new Date().toISOString().split('T')[0],
                person: 'Me' // Fallback
            };

            console.log("Adding task to board:", board.name, newTask);
            onUpdateTasks(boardId, newTask);

            // Reset Input
            setNewTaskName('');
            setNewTaskPriority(null);
            setNewTaskDate(null);
            setIsModalOpen(false);
        }
    };

    const handleCreateBoard = (name: string) => {
        const newBoard: Board = {
            id: `PROJ-${Date.now()}`,
            name: name,
            tasks: [],
            columns: [
                { id: 'c1', title: 'To Do', type: 'status' },
                { id: 'c2', title: 'In Progress', type: 'status' },
                { id: 'c3', title: 'Done', type: 'status' }
            ],
            defaultView: 'kanban',
            availableViews: ['kanban', 'table', 'calendar']
        };
        onAddBoard(newBoard);
        handleSelectBoard(newBoard.id); // Add task to this new board immediately
    };

    const toggleMenu = (menu: 'priority' | 'date') => {
        setActiveMenu(prev => prev === menu ? 'none' : menu);
    };

    // Memoized Data Processing
    // We scan ALL boards to find tasks assigned to "Me" (mock logic for now assuming all tasks are mine)
    const { inboxTasks, activeProjects, todayTasks } = useMemo(() => {
        const inbox: { task: Task, boardName: string, boardId: string }[] = [];
        const today: { task: Task, boardName: string, boardId: string }[] = [];
        const projects: Record<string, { id: string, name: string, tasks: Task[] }> = {};

        const currentDate = new Date();
        const currentDateString = currentDate.toISOString().split('T')[0];

        boards.forEach(board => {
            if (!board.tasks || !Array.isArray(board.tasks)) return;

            // Group by Project (Board)
            if (!projects[board.id]) {
                projects[board.id] = { id: board.id, name: board.name, tasks: [] };
            }

            board.tasks.forEach(task => {
                const richTask = { task, boardName: board.name, boardId: board.id };

                // Add to Projects
                projects[board.id].tasks.push(task);

                // Add to Today if matches
                if (task.date === currentDateString) {
                    today.push(richTask);
                } else {
                    // For now, treat everything else as "Inbox" candidates for the purpose of the UI demo
                    inbox.push(richTask);
                }
            });
        });

        // Filter Inbox & Projects based on local search/filter
        // This is a simple client-side filter mock
        return {
            inboxTasks: inbox.filter(item => {
                const matchesSearch = item.task.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.boardName.toLowerCase().includes(searchQuery.toLowerCase());
                // Mock filter logic - since we don't have 'type' on tasks, we'll just show all for now or do rudimentary text matching if 'design' or 'dev' was in the name
                const matchesFilter = filter === 'all' ? true :
                    filter === 'design' ? item.boardName.toLowerCase().includes('design') || item.task.name.toLowerCase().includes('design') :
                        filter === 'dev' ? item.boardName.toLowerCase().includes('dev') || item.task.name.toLowerCase().includes('fix') :
                            true;
                return matchesSearch && matchesFilter;
            }),
            activeProjects: Object.values(projects).filter(p => p.tasks.length > 0 && p.name.toLowerCase().includes(searchQuery.toLowerCase())),
            todayTasks: today
        };
    }, [boards, searchQuery, filter]);

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            case 'Medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
            case 'Low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            default: return 'text-slate-500 bg-slate-100 dark:bg-slate-800';
        }
    };

    const normalizePriority = (p: any) => {
        if (!p) return null;
        if (typeof p === 'string') return p;
        return p.level || p.name; // Handle object case if it exists in your types
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-[#f9fafa] dark:bg-[#21262c] text-[#121716] dark:text-[#e2e8f0] font-sans overflow-hidden antialiased transition-colors duration-300 relative" style={{ zoom: '75%' }}>

            <BoardSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                boards={boards}
                taskName={newTaskName}
                onSelectBoard={handleSelectBoard}
                onCreateBoard={handleCreateBoard}
            />

            {/* MAIN CONTENT (AGENDA) */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative border-r border-slate-200 dark:border-slate-700/50">

                {/* Header */}
                <header className="px-8 py-6 flex justify-between items-end bg-[#f9fafa]/90 dark:bg-[#21262c]/90 backdrop-blur-sm z-10 sticky top-0">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Wednesday, Oct 24</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Daily Agenda • {todayTasks.length} tasks scheduled</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500">
                            <ChevronLeft size={20} />
                        </button>
                        <button className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all">Today</button>
                        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </header>

                {currentTab === 'timeline' ? (
                    <div className="flex-1 overflow-y-auto px-6 pb-20 relative custom-scrollbar animate-in fade-in duration-300">

                        {/* Current Time Indicator */}
                        <div className="absolute w-[calc(100%-3rem)] left-6 top-[380px] flex items-center z-20 pointer-events-none group">
                            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 -ml-2 mb-[1px]">10:42</div>
                            <div className="h-[2px] w-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                        </div>

                        {/* Real Data Rendering */}
                        <div className="flex flex-col gap-2 pt-6">
                            {todayTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                        <CalendarIcon size={32} />
                                    </div>
                                    <p className="font-medium">No tasks scheduled for today</p>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="mt-4 text-blue-600 hover:text-blue-700 font-bold text-sm"
                                    >
                                        + Add Task
                                    </button>
                                </div>
                            ) : (
                                todayTasks.map(({ task, boardName, boardId }) => (
                                    <div key={task.id} className="flex group min-h-[140px]">
                                        <div className="w-24 pr-6 text-right pt-4 text-xs font-bold text-slate-400 font-mono flex flex-col items-end relative">
                                            {/* Dot on timeline */}
                                            <div className="absolute right-[-5px] top-5 w-2.5 h-2.5 rounded-full border-[2px] border-[#f9fafa] dark:border-[#21262c] bg-slate-300 dark:bg-slate-600 z-10 group-hover:bg-blue-500 group-hover:scale-125 transition-all"></div>
                                            <span>{task.id.slice(-4)}</span>
                                        </div>
                                        <div className="flex-1 border-l-2 border-slate-200 dark:border-slate-700/50 pl-8 pb-8 relative">
                                            <div
                                                onClick={() => onNavigateToBoard('board', boardId)}
                                                className={`h-full w-full bg-white dark:bg-[#2c333a] rounded-2xl shadow-sm hover:shadow-lg dark:shadow-none border border-slate-200 dark:border-slate-700 p-6 flex gap-5 transition-all hover:-translate-y-1 duration-200 cursor-pointer relative overflow-hidden group/card ${task.priority === 'High' ? 'border-l-[4px] border-l-red-500' : task.priority === 'Medium' ? 'border-l-[4px] border-l-orange-500' : 'border-l-[4px] border-l-blue-500'}`}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none ${task.priority === 'High' ? 'from-red-50/50 dark:from-red-900/5' : 'from-blue-50/50 dark:from-blue-900/5'}`}></div>
                                                <div className="flex-1 relative z-10 flex flex-col">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-block uppercase tracking-wider ${task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'}`}>
                                                            {task.priority || 'Normal'}
                                                        </span>
                                                        <MoreHorizontal className="text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 transition-colors" size={18} />
                                                    </div>
                                                    <h3 className="text-slate-800 dark:text-gray-100 font-bold text-xl leading-tight mb-1 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors">{task.name}</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg truncate flex items-center gap-2">
                                                        <Hash size={12} /> {boardName} Board
                                                    </p>
                                                    <div className="mt-auto pt-5 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex -space-x-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white dark:border-[#2c333a] flex items-center justify-center text-[8px] text-white font-bold">M</div>
                                                            </div>
                                                            <span className="text-slate-400 text-xs font-medium">Due Today</span>
                                                        </div>
                                                        <button className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${task.status === 'Done' ? 'bg-green-100 text-green-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white hover:shadow-md hover:scale-110'}`}>
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* 12:00 PM Break */}
                            <div className="flex group min-h-[80px]">
                                <div className="w-24 pr-6 text-right pt-2 text-xs font-bold text-slate-400 font-mono relative">
                                    <div className="absolute right-[-4px] top-3 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 z-10"></div>
                                    12:00
                                </div>
                                <div className="flex-1 border-l-2 border-slate-200 dark:border-slate-700/50 pl-8 pb-8 relative">
                                    <div className="h-full w-full rounded-2xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-3 px-6 text-slate-400 overflow-hidden">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                            <Coffee size={16} />
                                        </div>
                                        <span className="font-medium text-sm">Lunch Break</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <KanbanBoard />
                )}

                {/* Tab Switcher */}
                <div className="absolute bottom-6 left-6 z-[60] flex items-center gap-1 transition-all">
                    <button
                        onClick={() => setCurrentTab('timeline')}
                        className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 ${currentTab === 'timeline' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => setCurrentTab('kanban')}
                        className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 ${currentTab === 'kanban' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        Kanban
                    </button>
                </div>

            </main>

            {/* SIDEBAR (TASK BUCKET) */}
            <aside className="w-full lg:w-[420px] xl:w-[480px] bg-white dark:bg-[#1a1e23] flex flex-col h-full shadow-2xl lg:shadow-none z-20 border-l border-slate-200 dark:border-slate-700/50" style={{ zoom: '1.05' }}>

                {/* Search & Filter Header */}
                <div className="px-6 pt-6 pb-4 bg-white dark:bg-[#1a1e23]">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Task Bucket</h2>
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full">{inboxTasks.length + activeProjects.length} items</span>
                        </div>
                        <button className="text-blue-600 hover:bg-blue-600/10 p-2 rounded-full transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>

                    {/* Input */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 focus-within:bg-white dark:focus-within:bg-[#252a30] focus-within:shadow-md focus-within:border-blue-500/50 transition-all duration-200 relative group/input">
                        <div className="flex items-center gap-2 px-1">
                            <input
                                className="w-full bg-transparent border-none p-1.5 text-sm font-medium focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-100"
                                placeholder="Add a new task..."
                                type="text"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                onKeyDown={handleTaskInputKeyDown}
                            />
                        </div>
                        <div className="flex items-center justify-between px-1 mt-1">
                            <div className="flex gap-1.5 relative">
                                <button
                                    onClick={() => setIsProjectActive(!isProjectActive)}
                                    className={`flex items-center gap-1 p-1 pr-2 rounded transition-colors group/btn ${isProjectActive ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-blue-500'}`}
                                    title="Project (#)"
                                >
                                    <Tag size={16} />
                                    <span className="text-[10px] font-bold transition-colors hidden sm:inline">Project</span>
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => toggleMenu('priority')}
                                        className={`flex items-center gap-1 p-1 pr-2 rounded transition-colors group/btn ${newTaskPriority ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500'}`}
                                        title="Priority (!)"
                                    >
                                        <AlertCircle size={16} />
                                        <span className="text-[10px] font-bold transition-colors hidden sm:inline">{newTaskPriority || 'Priority'}</span>
                                    </button>
                                    {activeMenu === 'priority' && <PriorityMenu onSelect={setNewTaskPriority} onClose={() => setActiveMenu('none')} />}
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => toggleMenu('date')}
                                        className={`flex items-center gap-1 p-1 pr-2 rounded transition-colors group/btn ${newTaskDate ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-500'}`}
                                        title="Date (@)"
                                    >
                                        <CalendarIcon size={16} />
                                        <span className="text-[10px] font-bold transition-colors hidden sm:inline">{newTaskDate || 'Date'}</span>
                                    </button>
                                    {activeMenu === 'date' && <DateMenu onSelect={setNewTaskDate} onClose={() => setActiveMenu('none')} />}
                                </div>
                            </div>
                            <button
                                onClick={() => newTaskName.trim() && setIsModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-sm transition-colors flex items-center justify-center h-6 w-6"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-1">
                        <button onClick={() => setFilter('all')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors ${filter === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-600 hover:text-blue-600'}`}>All Tasks</button>
                        <button onClick={() => setFilter('design')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'design' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-600 hover:text-blue-600'}`}>Design</button>
                        <button onClick={() => setFilter('dev')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'dev' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-600 hover:text-blue-600'}`}>Development</button>
                    </div>
                </div>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 w-full"></div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50/50 dark:bg-[#1a1e23]">

                    {/* INBOX SECTION */}
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('inbox')}</p>
                            <span className="text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">{inboxTasks.length}</span>
                        </div>
                        <div className="space-y-3">
                            {/* Render Inbox Tasks */}
                            {inboxTasks.slice(0, 5).map(({ task, boardName, boardId }, idx) => (
                                <div key={task.id} className="group bg-white dark:bg-[#2c333a] p-4 rounded-xl shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700/50 hover:border-blue-600/30 cursor-grab active:cursor-grabbing transition-all flex gap-3 items-start select-none relative">
                                    <div className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-blue-600 transition-colors">
                                        <GripVertical size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                                                {task.priority || 'Normal'}
                                            </span>
                                            {task.date && (
                                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                    <CalendarIcon size={10} />
                                                    {task.date === new Date().toISOString().split('T')[0] ? 'Today' : task.date}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug mb-1 truncate">{task.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1 truncate max-w-[100px]">
                                                <Hash size={10} /> {boardName}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <button className="text-slate-300 hover:text-green-500 transition-colors bg-slate-50 dark:bg-slate-800 p-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20">
                                            <CheckCircle2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {inboxTasks.length === 0 && (
                                <div className="text-center py-6 text-slate-400 text-xs italic">
                                    No tasks in inbox
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PROJECTS SECTION */}
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Projects</p>
                            <span className="text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">{activeProjects.length}</span>
                        </div>
                        <div className="space-y-4">
                            {activeProjects.map(project => (
                                <div key={project.id} className="bg-white dark:bg-[#2c333a] rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-50/50 dark:bg-[#252a30] border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${project.tasks.some(t => t.priority === 'High') ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{project.name}</h3>
                                        </div>
                                        <span className="text-[10px] text-slate-400">{project.tasks.length} tasks</span>
                                    </div>
                                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {project.tasks.slice(0, 3).map(task => (
                                            <div key={task.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                                <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Done' ? 'bg-green-400' : 'bg-slate-300'}`}></div>
                                                <span className={`text-xs font-medium flex-1 truncate ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{task.name}</span>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">{task.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {project.tasks.length > 3 && (
                                            <div className="px-4 py-2 text-center">
                                                <span className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline">+ {project.tasks.length - 3} more</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </aside>

            {/* FAB (Floating Action Button) */}
            <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-4 group">
                <div className="opacity-0 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible translate-y-4 flex flex-col items-end gap-3 transition-all duration-300">
                    <button className="flex items-center gap-3 pl-4 pr-2 py-2 bg-white dark:bg-[#2c333a] rounded-full shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">New Goal</span>
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
                            <Flag size={18} />
                        </div>
                    </button>
                    <button className="flex items-center gap-3 pl-4 pr-2 py-2 bg-white dark:bg-[#2c333a] rounded-full shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">New Project</span>
                        <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-sm">
                            <Briefcase size={18} />
                        </div>
                    </button>
                    <button className="flex items-center gap-3 pl-4 pr-2 py-2 bg-white dark:bg-[#2c333a] rounded-full shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">New Task</span>
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 size={18} />
                        </div>
                    </button>
                </div>
                <button className="h-16 w-16 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group-hover:rotate-45">
                    <Plus size={32} />
                </button>
            </div>

        </div>
    );
};

export default MyWorkPage;
