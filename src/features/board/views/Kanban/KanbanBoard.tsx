import React, { useState, useRef, useEffect } from 'react';
import {
    Calendar, Flag, Tag, MoreHorizontal, Copy, Link2,
    Pencil, ArrowRight, Bell, Mail, Plus as PlusIcon, GitMerge, Move, Timer,
    LayoutTemplate, Archive, Trash2, Slash, ChevronRight, ChevronLeft,
    ArrowLeftToLine, Zap, CheckSquare, Circle, CornerDownLeft,
    Search, Filter, SlidersHorizontal, Layout, UserCircle, CheckCircle2,
    X, Info, ChevronDown, Users, MessageSquare, Clock
} from 'lucide-react';
import {
    format, addDays, startOfWeek, endOfWeek, addWeeks, isSameDay,
    isToday, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
    setMonth, setYear, parse, isValid, isBefore, isAfter
} from './dateUtils';
import { SharedDatePicker } from '../../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { useClickOutside } from '../../../../hooks/useClickOutside';

// --- Types ---

export type Priority = 'urgent' | 'high' | 'normal' | 'low' | 'none';

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    statusId: string;
    priority: Priority;
    dueDate?: string;
    startDate?: string;
    dependencies?: string[];
    tags: string[];
    subtasks: Subtask[];
    assignee?: string;
}

export interface ColumnType {
    id: string;
    title: string;
    color: string; // Tailwind color class base (e.g., 'gray', 'pink', 'green')
    icon?: string;
}

export interface BoardData {
    columns: ColumnType[];
    tasks: Task[];
}

// --- Constants ---

export const INITIAL_DATA: BoardData = {
    columns: [
        { id: 'To Do', title: 'To Do', color: 'gray' },
        { id: 'In Progress', title: 'In Progress', color: 'blue' },
        { id: 'Done', title: 'Done', color: 'emerald' },
    ],
    tasks: []
};

export const priorityConfig = {
    urgent: { color: 'text-red-500', icon: Flag, label: 'Urgent' },
    high: { color: 'text-orange-500', icon: Flag, label: 'High' },
    normal: { color: 'text-blue-500', icon: Flag, label: 'Normal' },
    low: { color: 'text-gray-500', icon: Flag, label: 'Low' },
    none: { color: 'text-gray-400', icon: Flag, label: 'Clear' }
};

// --- Sub-Components (Menus, etc.) ---

const MenuItem = ({ icon: Icon, label, hasSubmenu = false }: { icon: any, label: string, hasSubmenu?: boolean }) => (
    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between text-sm text-gray-700 group">
        <div className="flex items-center gap-3">
            <Icon size={16} className="text-gray-400 group-hover:text-gray-600" />
            <span>{label}</span>
        </div>
        {hasSubmenu && <ChevronRight size={14} className="text-gray-400" />}
    </button>
);

export const PriorityMenu = ({ currentPriority, onSelect }: { currentPriority: Priority, onSelect: (p: Priority | 'clear') => void }) => {
    return (
        <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Priority</div>
            <button onClick={() => onSelect('urgent')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Flag size={16} className="text-red-500 fill-current" /> Urgent
            </button>
            <button onClick={() => onSelect('high')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Flag size={16} className="text-orange-500 fill-current" /> High
            </button>
            <button onClick={() => onSelect('normal')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Flag size={16} className="text-blue-500 fill-current" /> Normal
            </button>
            <button onClick={() => onSelect('low')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Flag size={16} className="text-gray-500" /> Low
            </button>
            <div className="h-px bg-gray-100 my-1"></div>
            <button onClick={() => onSelect('clear')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Slash size={16} className="text-gray-400" /> Clear
            </button>
            <div className="mt-2 pt-2 border-t border-gray-100 px-4 pb-2">
                <div className="text-xs text-gray-500 mb-2">Add to Personal Priorities</div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">MA</div>
                    <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"><PlusIcon size={14} /></button>
                </div>
            </div>
        </div>
    );
};

export const TagMenu = ({ tags, onUpdateTags }: { tags: string[], onUpdateTags: (tags: string[]) => void }) => {
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (tagInput.trim()) {
            onUpdateTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    return (
        <div className="p-2">
            <input
                autoFocus
                type="text"
                placeholder="Search or add tags..."
                className="w-full px-3 py-2 bg-gray-50 rounded-md border-none text-sm focus:ring-1 focus:ring-indigo-500 outline-none mb-2"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
            />
            <div className="max-h-48 overflow-y-auto">
                {tags.length === 0 && !tagInput ? (
                    <div className="text-center py-6 text-gray-400 text-sm italic">No tags created</div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs flex items-center gap-1">
                                {tag}
                                <button onClick={() => onUpdateTags(tags.filter(t => t !== tag))} className="hover:text-indigo-900">×</button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};



// --- TaskCard Component ---

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onDuplicateTask: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onUpdateTask, onDeleteTask, onDuplicateTask }) => {
    const [activeMenu, setActiveMenu] = useState<'none' | 'priority' | 'tags' | 'context' | 'date'>('none');
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameTitle, setRenameTitle] = useState(task.title);

    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, () => setActiveMenu('none'));

    const inputRef = useRef<HTMLInputElement>(null);
    const dateBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    const handleRenameSubmit = () => {
        if (renameTitle.trim()) {
            onUpdateTask({ ...task, title: renameTitle });
        } else {
            setRenameTitle(task.title);
        }
        setIsRenaming(false);
    };

    const currentPriorityKey = task.priority;

    return (
        <div
            draggable={!isRenaming}
            onDragStart={(e) => {
                if (activeMenu !== 'none' || isRenaming) {
                    e.preventDefault();
                    return;
                }
                onDragStart(e, task.id);
            }}
            className={`group relative bg-white dark:bg-stone-900 p-3 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3 ${activeMenu !== 'none' ? 'z-50' : 'z-0'}`}
        >
            <div className="flex justify-between items-start mb-3 group/header">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 text-sm font-medium font-serif text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-800"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                    />
                ) : (
                    <span className="font-medium font-serif text-stone-900 dark:text-stone-100 text-sm leading-snug block flex-1 pr-2 break-words">{task.title}</span>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu('context'); }}
                    className={`p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-all ${activeMenu === 'context' ? 'opacity-100 bg-stone-100 dark:bg-stone-800' : 'opacity-0 group-hover/header:opacity-100'}`}
                >
                    <MoreHorizontal size={16} />
                </button>
            </div>

            <div className="flex items-center gap-1.5 relative flex-wrap">
                {/* Assignee Button (New) */}
                <button className="w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors" title="Assign">
                    <UserCircle size={14} />
                </button>

                {/* Calendar Button */}
                <button
                    ref={dateBtnRef}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenu(activeMenu === 'date' ? 'none' : 'date');
                    }}
                    className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors ${task.dueDate ? 'text-blue-600' : 'text-gray-400'}`}
                >
                    <Calendar size={14} strokeWidth={2} />
                </button>
                {task.dueDate && (
                    <span className="text-[10px] text-gray-500 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 -ml-1">
                        {isValid(new Date(task.dueDate)) ? format(new Date(task.dueDate), 'MMM d') : task.dueDate}
                    </span>
                )}

                {/* Priority Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu('priority'); }}
                    className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors ${task.priority !== 'none' ? priorityConfig[currentPriorityKey].color : 'text-gray-400'}`}
                >
                    <Flag size={14} strokeWidth={2} fill={task.priority !== 'none' && task.priority !== 'low' ? "currentColor" : "none"} />
                </button>

                {/* Tags (Now Inline) */}
                {task.tags.length > 0 ? (
                    task.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 font-sans cursor-pointer hover:bg-stone-200 truncate max-w-[80px]" onClick={(e) => { e.stopPropagation(); setActiveMenu('tags'); }}>{tag}</span>
                    ))
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenu('tags'); }}
                        className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-400`}
                    >
                        <Tag size={14} strokeWidth={2} />
                    </button>
                )}
            </div>

            {/* Popups / Menus */}
            {/* Portal Date Picker */}
            {activeMenu === 'date' && (
                <PortalPopup triggerRef={dateBtnRef} onClose={() => setActiveMenu('none')} side="bottom">
                    <div onClick={(e) => e.stopPropagation()}>
                        <SharedDatePicker
                            selectedDate={task.dueDate}
                            onSelectDate={(date) => {
                                onUpdateTask({ ...task, dueDate: date.toISOString(), startDate: undefined });
                                setActiveMenu('none');
                            }}
                            onClose={() => setActiveMenu('none')}
                        />
                    </div>
                </PortalPopup>
            )}

            {/* Other Menus */}
            {activeMenu !== 'none' && activeMenu !== 'date' && (
                <div
                    ref={menuRef}
                    className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                    style={{
                        top: '100%',
                        left: '0',
                        minWidth: activeMenu === 'date' ? 'auto' : '16rem',
                        width: activeMenu === 'date' ? 'auto' : '16rem'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {activeMenu === 'priority' && (
                        <PriorityMenu
                            currentPriority={task.priority}
                            onSelect={(p) => {
                                onUpdateTask({ ...task, priority: p === 'clear' ? 'none' : p });
                                setActiveMenu('none');
                            }}
                        />
                    )}

                    {activeMenu === 'tags' && (
                        <TagMenu
                            tags={task.tags}
                            onUpdateTags={(newTags) => {
                                onUpdateTask({ ...task, tags: newTags });
                            }}
                        />
                    )}



                    {/* Task Context Menu */}
                    {activeMenu === 'context' && (
                        <div className="w-64">
                            <div className="flex items-center justify-between p-2 border-b border-gray-100">
                                <button className="flex-1 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded text-center">Copy link</button>
                                <div className="w-px h-4 bg-gray-200"></div>
                                <button className="flex-1 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded text-center">Copy ID</button>
                                <div className="w-px h-4 bg-gray-200"></div>
                                <button className="flex-1 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded text-center">New tab</button>
                            </div>
                            <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                <button onClick={() => { setActiveMenu('none'); setIsRenaming(true); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <Pencil size={16} className="text-gray-400" /> Rename
                                </button>
                                <MenuItem icon={ArrowRight} label="Convert to" hasSubmenu />
                                <MenuItem icon={LayoutTemplate} label="Task Type" hasSubmenu />
                                <button onClick={() => { onDuplicateTask(task); setActiveMenu('none'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <Copy size={16} className="text-gray-400" /> Duplicate
                                </button>
                                <MenuItem icon={Timer} label="Remind me" />
                                <MenuItem icon={Bell} label="Follow task" />
                                <MenuItem icon={Mail} label="Send email to task" />
                                <MenuItem icon={PlusIcon} label="Add To" hasSubmenu />
                                <MenuItem icon={GitMerge} label="Merge" />
                                <MenuItem icon={Move} label="Move" />
                                <MenuItem icon={Timer} label="Start timer" />
                                <div className="h-px bg-gray-100 my-1"></div>
                                <MenuItem icon={Link2} label="Dependencies" hasSubmenu />
                                <MenuItem icon={LayoutTemplate} label="Templates" hasSubmenu />
                                <div className="h-px bg-gray-100 my-1"></div>
                                <MenuItem icon={Archive} label="Archive" />
                                <button onClick={() => onDeleteTask(task.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-3 text-sm text-red-600">
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                            <div className="p-2 border-t border-gray-100">
                                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors">
                                    Sharing & Permissions
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Column Component ---

interface ColumnProps {
    column: ColumnType;
    tasks: Task[];
    onTaskMove: (taskId: string, newStatusId: string) => void;
    onAddTask: (statusId: string, title: string, overrides?: Partial<Task>) => void;
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onDuplicateTask: (task: Task) => void;
    onClearColumn: (columnId: string) => void;
    onRenameColumn: (columnId: string, newTitle: string) => void;
    onColorChange: (columnId: string, newColor: string) => void;
    onDeleteColumn: (columnId: string) => void;
}

// Rich Task Creation Form Component
const TaskCreationForm = ({ onSave, onCancel, columnColor = 'gray' }: { onSave: (title: string, priority: Priority, tags: string[], date?: string) => void, onCancel: () => void, columnColor?: string }) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority>('none');
    const [tags, setTags] = useState<string[]>([]);
    const [date, setDate] = useState<string | undefined>(undefined);

    const [activePopup, setActivePopup] = useState<'none' | 'date' | 'priority' | 'tags'>('none');
    const containerRef = useRef<HTMLDivElement>(null);
    const dateBtnRef = useRef<HTMLButtonElement>(null);

    useClickOutside(containerRef, (e) => {
        // If the click is inside a portal (like date picker), ignore it.
        // Simple heuristic: if the click target is not in the document anymore (removed by React) or is in a portal container
        const target = e.target as Node;
        // Check if target is inside our container (already handled by useClickOutside logic actually)
        // Check if target is inside a portal... (Date picker portal often is appended to body)
        // For simplicity, we just check if activePopup is 'date' and if so let the portal handle its own close?
        // Actually, shared date picker has its own onClose.
        // But if I click OUTSIDE the form entirely, I want to cancel.
        // If I click inside the date picker (which is outside the form DOM-wise), useClickOutside triggers.
        // We need to be careful with Portals.

        // This is tricky. simpler to just let the onCancel run if we are not interacting with a child popup.
        if (activePopup === 'date') return;
        onCancel();
    });

    const handleSave = () => {
        if (title.trim()) {
            onSave(title, priority, tags, date);
        } else {
            onCancel();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            if (activePopup !== 'none') {
                setActivePopup('none');
            } else {
                onCancel();
            }
        }
    };

    const getBorderColor = (color: string) => {
        const map: Record<string, string> = {
            gray: 'border-stone-300',
            blue: 'border-blue-500',
            green: 'border-green-500',
            yellow: 'border-yellow-500',
            orange: 'border-orange-500',
            red: 'border-red-500',
            pink: 'border-pink-500',
            purple: 'border-purple-500',
            emerald: 'border-emerald-500',
        };
        return map[color] || 'border-stone-300';
    };

    return (
        <div ref={containerRef} className={`p-3 bg-white rounded-xl shadow-lg border-2 ${getBorderColor(columnColor)} mb-3 relative z-10`}>
            <div className="flex items-center gap-2 mb-3">
                <input
                    autoFocus
                    type="text"
                    placeholder="Task Name..."
                    className="flex-1 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                    Save <CornerDownLeft size={12} />
                </button>
            </div>

            <div className="flex gap-3 relative">
                <button
                    ref={dateBtnRef}
                    onClick={() => setActivePopup(activePopup === 'date' ? 'none' : 'date')}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${date ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Calendar size={14} />
                    {date ? (isValid(new Date(date)) ? format(new Date(date), 'MMM d') : date) : 'Add dates'}
                </button>

                <button
                    onClick={() => setActivePopup(activePopup === 'priority' ? 'none' : 'priority')}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${priority !== 'none' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Flag size={14} fill={priority !== 'none' && priority !== 'low' ? "currentColor" : "none"} />
                    {priority !== 'none' ? priorityConfig[priority].label : 'Add priority'}
                </button>

                <button
                    onClick={() => setActivePopup(activePopup === 'tags' ? 'none' : 'tags')}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${tags.length > 0 ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Tag size={14} />
                    {tags.length > 0 ? `${tags.length} tags` : 'Add tag'}
                </button>
            </div>

            {/* Popups */}
            {activePopup === 'date' && (
                <PortalPopup triggerRef={dateBtnRef} onClose={() => setActivePopup('none')} side="bottom">
                    <SharedDatePicker
                        selectedDate={date}
                        onSelectDate={(newDate) => {
                            setDate(newDate.toISOString());
                            setActivePopup('none');
                        }}
                        onClose={() => setActivePopup('none')}
                    />
                </PortalPopup>
            )}

            {(activePopup === 'priority' || activePopup === 'tags') && (
                <div
                    className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                    style={{ minWidth: '16rem' }}
                >
                    {activePopup === 'priority' && (
                        <PriorityMenu
                            currentPriority={priority}
                            onSelect={(p) => {
                                setPriority(p === 'clear' ? 'none' : p);
                                setActivePopup('none');
                            }}
                        />
                    )}
                    {activePopup === 'tags' && (
                        <TagMenu
                            tags={tags}
                            onUpdateTags={(newTags) => setTags(newTags)}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const Column: React.FC<ColumnProps> = ({
    column, tasks, onTaskMove, onAddTask, onUpdateTask,
    onDeleteTask, onDuplicateTask, onClearColumn, onRenameColumn, onColorChange, onDeleteColumn
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isAddingBottom, setIsAddingBottom] = useState(false);
    const [isAddingTop, setIsAddingTop] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameTitle, setRenameTitle] = useState(column.title);

    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, () => setShowMenu(false));

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onTaskMove(taskId, column.id);
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleRenameSubmit = () => {
        if (renameTitle.trim()) {
            onRenameColumn(column.id, renameTitle);
        } else {
            setRenameTitle(column.title);
        }
        setIsRenaming(false);
    };

    const getBadgeStyle = (color: string) => {
        const map: Record<string, string> = {
            gray: 'bg-gray-100 text-gray-700',
            blue: 'bg-blue-600 text-white',
            green: 'bg-green-600 text-white',
            yellow: 'bg-yellow-500 text-white',
            orange: 'bg-orange-500 text-white',
            red: 'bg-red-600 text-white',
            pink: 'bg-pink-600 text-white',
            purple: 'bg-purple-600 text-white',
            emerald: 'bg-emerald-600 text-white',
        };
        return map[color] || map['gray'];
    };

    const getColumnBackground = (color: string) => {
        const map: Record<string, string> = {
            gray: 'bg-stone-50/50',
            blue: 'bg-blue-50/50',
            green: 'bg-green-50/50',
            yellow: 'bg-yellow-50/50',
            orange: 'bg-orange-50/50',
            red: 'bg-red-50/50',
            pink: 'bg-pink-50/50',
            purple: 'bg-purple-50/50',
            emerald: 'bg-emerald-50/50',
        };
        return map[color] || 'bg-gray-50/80';
    }

    const getButtonStyles = (color: string) => {
        const map: Record<string, string> = {
            gray: 'text-stone-600 hover:text-stone-800 hover:bg-stone-100',
            blue: 'text-blue-700 hover:text-blue-800 hover:bg-blue-100',
            green: 'text-green-700 hover:text-green-800 hover:bg-green-100',
            yellow: 'text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100',
            orange: 'text-orange-700 hover:text-orange-800 hover:bg-orange-100',
            red: 'text-red-700 hover:text-red-800 hover:bg-red-100',
            pink: 'text-pink-700 hover:text-pink-800 hover:bg-pink-100',
            purple: 'text-purple-700 hover:text-purple-800 hover:bg-purple-100',
            emerald: 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100',
        };
        return map[color] || map['gray'];
    };



    if (isCollapsed) {
        return (
            <div className="flex-shrink-0 w-12 h-full pt-3 flex flex-col items-center bg-gray-50 border-r border-gray-100">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 hover:bg-gray-200 rounded text-gray-500 mb-4"
                    title="Expand"
                >
                    <ArrowLeftToLine size={20} className="rotate-180" />
                </button>
                <div className="writing-vertical-lr transform rotate-180 text-sm font-bold text-gray-500 tracking-wide uppercase">
                    {column.title}
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-gray-200 text-xs text-gray-600">{tasks.length}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex-shrink-0 w-[19rem] flex flex-col h-full rounded-xl transition-colors duration-200 ${getColumnBackground(column.color)}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className={`flex items-center justify-between px-1 py-3 mb-2 relative group/col-header ${isDragOver ? 'opacity-100' : ''}`}>
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full text-sm font-bold font-serif uppercase tracking-wide border border-stone-300 dark:border-stone-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                    />
                ) : (
                    <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-2 font-serif text-stone-900 dark:text-stone-100`}>
                        <div
                            className={`w-2 h-2 rounded-full`}
                            style={{
                                backgroundColor:
                                    column.title.toLowerCase().includes('done') ? '#22c55e' :
                                        column.title.toLowerCase().includes('progress') ? '#3b82f6' :
                                            column.title.toLowerCase().includes('stuck') ? '#ef4444' :
                                                column.title.toLowerCase().includes('review') ? '#a855f7' :
                                                    column.color.startsWith('#') ? column.color :
                                                        (column.color === 'emerald' ? '#22c55e' : column.color === 'blue' ? '#3b82f6' : '#94a3b8')
                            }}
                        ></div>
                        {column.title}
                        <span className="opacity-40 font-normal ml-1 font-sans text-stone-500">{tasks.length}</span>
                    </div>
                )}

                <div className="flex gap-1 relative opacity-0 group-hover/col-header:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsAddingTop(!isAddingTop)}
                        className={`p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors ${isAddingTop ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                    >
                        <PlusIcon size={14} />
                    </button>
                    <button
                        className={`p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors ${showMenu ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreHorizontal size={14} />
                    </button>

                    {/* Column Menu */}
                    {showMenu && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-60 bg-white dark:bg-stone-900 rounded-lg shadow-xl border border-stone-200 dark:border-stone-800 z-50 overflow-hidden"
                        >
                            <div className="py-2 text-stone-700 dark:text-stone-300">
                                {/* ... Simplified for brevity, assume similar stone styling would apply ... */}
                                <div className="px-4 py-2 text-xs font-semibold text-stone-500">Group options</div>
                                <button onClick={() => { setIsCollapsed(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3 text-sm">
                                    <ArrowLeftToLine size={16} className="text-stone-400" /> Collapse group
                                </button>
                                <button onClick={() => { onClearColumn(column.id); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3 text-sm">
                                    <Archive size={16} className="text-stone-400" /> Archive all in this group
                                </button>

                                {!['To Do', 'In Progress', 'Done'].includes(column.title) && !['To Do', 'In Progress', 'Done', 'to-do', 'in-progress', 'done'].includes(column.id) && (
                                    <>
                                        <div className="h-px bg-stone-100 dark:bg-stone-800 my-1"></div>
                                        <button
                                            onClick={() => { onDeleteColumn(column.id); setShowMenu(false); }}
                                            className="w-full text-left px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3 text-sm text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 size={16} /> Delete group
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto px-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                {isAddingTop && (
                    <TaskCreationForm
                        onSave={(title, priority, tags, date) => {
                            onAddTask(column.id, title, { priority, tags, dueDate: date });
                            setIsAddingTop(false);
                        }}
                        onCancel={() => setIsAddingTop(false)}
                        columnColor={column.color}
                    />
                )}

                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={handleDragStart}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onDuplicateTask={onDuplicateTask}
                    />
                ))}

                {isAddingBottom ? (
                    <TaskCreationForm
                        onSave={(title, priority, tags, date) => {
                            onAddTask(column.id, title, { priority, tags, dueDate: date });
                            setIsAddingBottom(false);
                        }}
                        onCancel={() => setIsAddingBottom(false)}
                        columnColor={column.color}
                    />
                ) : (
                    <button
                        onClick={() => setIsAddingBottom(true)}
                        className={`w-full py-2 flex items-center gap-2 text-sm font-medium pl-2 transition-colors rounded-lg mt-1 ${getButtonStyles(column.color)}`}
                    >
                        <PlusIcon size={18} />
                        Add Task
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main KanbanBoard Component ---

interface KanbanBoardProps {
    boardId: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ boardId }) => {
    // Shared key for tasks (rows) and statuses
    const tasksKey = `board-tasks-${boardId}`;
    const statusesKey = `board-statuses-${boardId}`;

    const [data, setData] = useState<BoardData>(() => {
        let loadedTasks: Task[] = [];
        let loadedColumns: ColumnType[] = INITIAL_DATA.columns;

        // Load Columns (Shared Statuses)
        try {
            const savedStatuses = localStorage.getItem(statusesKey);
            if (savedStatuses) {
                const parsed = JSON.parse(savedStatuses);
                if (Array.isArray(parsed)) {
                    // Handle both simple string[] (from Table) and object[] (shared standard)
                    if (typeof parsed[0] === 'string') {
                        loadedColumns = parsed.map((s: string) => {
                            const lower = s.toLowerCase();
                            let color = 'gray';
                            if (lower.includes('done') || lower.includes('complete') || lower.includes('finished')) color = 'emerald';
                            else if (lower.includes('progress') || lower.includes('working') || lower.includes('active')) color = 'blue';
                            else if (lower.includes('stuck') || lower.includes('block') || lower.includes('error')) color = 'red';
                            else if (lower.includes('review') || lower.includes('teat')) color = 'purple';
                            else if (lower.includes('hold') || lower.includes('wait')) color = 'yellow';

                            return {
                                id: s,
                                title: s,
                                color: color
                            };
                        });
                    } else {
                        loadedColumns = parsed.map((s: any) => {
                            const title = s.label || s.title || s.id;
                            const lower = title.toLowerCase();
                            let color = s.color || 'gray';

                            // Enforce vibrant color names for Kanban
                            if (lower.includes('done') || lower.includes('complete')) color = 'emerald';
                            else if (lower.includes('progress') || lower.includes('working')) color = 'blue';
                            else if (lower.includes('stuck') || lower.includes('error')) color = 'red';
                            else if (lower.includes('review')) color = 'purple';
                            else if (lower.includes('hold') || lower.includes('wait')) color = 'yellow';

                            return {
                                id: s.id || title,
                                title: title,
                                color: color
                            };
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load shared statuses in Kanban', e);
        }
        // Load Tasks (Shared Row Data)
        try {
            const savedRows = localStorage.getItem(tasksKey);
            if (savedRows) {
                const rows = JSON.parse(savedRows);
                if (Array.isArray(rows)) {
                    loadedTasks = rows.map((row: any) => ({
                        id: row.id,
                        title: row.name || 'Untitled',
                        statusId: row.statusId || row.status || 'To Do',
                        priority: row.priority ? row.priority.toLowerCase() : 'none',
                        dueDate: row.dueDate, // Keep string ISO
                        tags: [], // Rows don't store tags yet, defaulting empty or need to extend Row
                        subtasks: [],
                        assignee: '', // Row doesn't store assignee struct yet
                        description: ''
                    }));
                }
            }
        } catch (e) {
            console.error('Failed to load shared tasks', e);
        }

        // Return combined data
        return { columns: loadedColumns, tasks: loadedTasks };
    });

    // Persistence: Save Tasks to Shared Key (mapped back to Rows)
    useEffect(() => {
        try {
            const rows = data.tasks.map(t => ({
                id: t.id,
                name: t.title,
                status: t.statusId, // e.g. 'To Do'
                statusId: t.statusId,
                dueDate: t.dueDate || null,
                priority: t.priority === 'none' ? null : (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)), // shared uses Title Case 'High'
                // Preserve other fields? Table doesn't support them yet, but we shouldn't lose them if possible.
                // However, RoomTable writes its own Rows. Data loss risk if fields mismatch.
                // For now, aligning strictly to requested fields: Name, Status, Date, Priority.
            }));
            localStorage.setItem(tasksKey, JSON.stringify(rows));
        } catch (e) {
            console.error('Failed to save shared tasks', e);
        }
    }, [data.tasks, tasksKey]);

    // Persistence: Save Columns (Statuses) to Shared Key
    useEffect(() => {
        try {
            // Save as simplified object array for shared use
            const statuses = data.columns.map(c => ({
                id: c.id,
                title: c.title,
                color: c.color
            }));
            localStorage.setItem(statusesKey, JSON.stringify(statuses));
        } catch (e) {
            console.error('Failed to save shared statuses from Kanban', e);
        }
    }, [data.columns, statusesKey]);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<'none' | 'sort' | 'filter' | 'assignee'>('none');
    const headerMenuRef = useRef<HTMLDivElement>(null);
    useClickOutside(headerMenuRef, () => setActiveHeaderMenu('none'));

    const handleTaskMove = (taskId: string, newStatusId: string) => {
        setData(prev => {
            const updatedTasks = prev.tasks.map(task =>
                task.id === taskId ? { ...task, statusId: newStatusId } : task
            );
            return { ...prev, tasks: updatedTasks };
        });
    };

    const handleAddTask = (statusId: string, title: string, overrides?: Partial<Task>) => {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            title,
            statusId,
            priority: overrides?.priority || 'none',
            tags: overrides?.tags || [],
            subtasks: [],
            dueDate: overrides?.dueDate,
            ...overrides
        };

        setData(prev => ({
            ...prev,
            tasks: [...prev.tasks, newTask]
        }));
    };

    const handleUpdateTask = (updatedTask: Task) => {
        setData(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        }));
    };

    const handleDeleteTask = (taskId: string) => {
        setData(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId)
        }));
    };

    const handleDuplicateTask = (task: Task) => {
        const newTask = { ...task, id: `task-${Date.now()}`, title: `${task.title} (Copy)` };
        setData(prev => ({
            ...prev,
            tasks: [...prev.tasks, newTask]
        }));
    };

    const handleClearColumn = (columnId: string) => {
        if (confirm('Are you sure you want to archive all tasks in this group?')) {
            setData(prev => ({
                ...prev,
                tasks: prev.tasks.filter(t => t.statusId !== columnId)
            }));
        }
    };

    const handleRenameColumn = (columnId: string, newTitle: string) => {
        setData(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c)
        }));
    };

    const handleColorChange = (columnId: string, newColor: string) => {
        setData(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === columnId ? { ...c, color: newColor } : c)
        }));
    };

    const handleAddGroup = () => {
        const title = prompt('Enter group name:');
        if (title) {
            const newColumn: ColumnType = {
                id: `col-${Date.now()}`,
                title: title,
                color: 'gray'
            };
            setData(prev => ({
                ...prev,
                columns: [...prev.columns, newColumn]
            }));
        }
    };

    const filteredTasks = data.tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteColumn = (columnId: string) => {
        if (confirm('Are you sure you want to delete this group? All tasks within it will be deleted.')) {
            setData(prev => ({
                ...prev,
                columns: prev.columns.filter(c => c.id !== columnId),
                tasks: prev.tasks.filter(t => t.statusId !== columnId)
            }));
        }
    };

    return (

        <div className="flex flex-col h-full bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans transition-colors duration-300">
            {/* Top Header */}
            {/* Top Header */}
            <header className="flex-none px-8 py-5 flex items-center justify-between bg-white dark:bg-stone-900/80 backdrop-blur-xl z-20 relative border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/50 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 transition-colors shadow-sm">
                        <Layout size={14} className="text-stone-400" />
                        Group: Status
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/50 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 transition-colors shadow-sm">
                        <GitMerge size={14} className="text-stone-400" />
                        Subtasks
                    </button>
                </div>

                <div className="flex items-center gap-3" ref={headerMenuRef}>
                    <div className="relative group mr-2">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 text-sm bg-stone-100/50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 focus:border-stone-500/50 focus:bg-white dark:focus:bg-stone-900 rounded-lg outline-none w-56 transition-all font-sans text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Sort Menu Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'sort' ? 'none' : 'sort')}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeHeaderMenu === 'sort' ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                            <SlidersHorizontal size={16} />
                            Sort
                        </button>
                        {activeHeaderMenu === 'sort' && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 py-2 z-50">
                                <div className="px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">Sort By</div>
                                {[
                                    'Status', 'Task Name', 'Assignee', 'Priority', 'Due date', 'Start date',
                                    'Date created', 'Date updated', 'Date closed', 'Time tracked', 'Time estimate',
                                    'Total time in Status', 'Duration'
                                ].map(item => (
                                    <button key={item} className="w-full text-left px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-sm text-stone-700 dark:text-stone-300 block">
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter, Check, Assignee Triggers (simplified for brevity but matching style) */}
                    <div className="relative">
                        <button
                            onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'filter' ? 'none' : 'filter')}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeHeaderMenu === 'filter' ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>

                    <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors">
                        <CheckCircle2 size={16} />
                        Closed
                    </button>


                    <div className="flex items-center -space-x-2 ml-2">
                        <div className="w-8 h-8 rounded-full bg-stone-800 dark:bg-stone-200 text-stone-100 dark:text-stone-900 border-2 border-white dark:border-stone-950 flex items-center justify-center text-xs font-bold font-serif">M</div>
                    </div>
                </div>
            </header>

            {/* Kanban Board Area */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-4 pt-6 bg-white dark:bg-stone-950">
                <div className="flex h-full gap-8">
                    {data.columns.map(col => (
                        <Column
                            key={col.id}
                            column={col}
                            tasks={filteredTasks.filter(t => t.statusId === col.id)}
                            onTaskMove={handleTaskMove}
                            onAddTask={handleAddTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onDuplicateTask={handleDuplicateTask}
                            onClearColumn={handleClearColumn}
                            onRenameColumn={handleRenameColumn}
                            onColorChange={handleColorChange}
                            onDeleteColumn={handleDeleteColumn}
                        />
                    ))}

                    {/* Add Group Placeholder */}
                    <div className="flex-shrink-0 w-[19rem] pt-3">
                        <button
                            onClick={handleAddGroup}
                            className="flex items-center gap-2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors group px-2"
                        >
                            <PlusIcon size={20} className="group-hover:bg-stone-200 dark:group-hover:bg-stone-800 rounded p-0.5" />
                            <span className="text-sm font-medium">Add group</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default KanbanBoard;
