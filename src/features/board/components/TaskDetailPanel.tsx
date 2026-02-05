import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Chat as MessageSquare,
    Calendar,
    CalendarBlank,
    Flag,
    Users,
    Clock,
    Timer,
    Tag,
    CaretRight,
    Check,
    TextAlignLeft,
    Plus,
    GitBranch,
    ListChecks,
    Paperclip,
    CaretDown,
    UserPlus,
    UserCircle,
    Sparkle,
    DotsThree,
    ArrowsOutSimple,
    Trash as Trash2,
} from 'phosphor-react';
import { useAuth } from '../../../auth-adapter';
import { teamService, TeamMember } from '../../../services/teamService';
import { assignmentService } from '../../../services/assignmentService';
import { boardLogger } from '../../../utils/logger';
import { Column, Row, StatusOption } from '../views/Table/types';

interface TaskDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    row: Row | null;
    columns: Column[];
    customStatuses?: StatusOption[];
    boardId?: string;
    onUpdateRow?: (rowId: string, updates: Partial<Row>) => void;
}

// Status color mapping
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'To Do': { bg: 'bg-stone-100 dark:bg-stone-700', text: 'text-stone-700 dark:text-stone-300', border: 'border-stone-300' },
    'In Progress': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300' },
    'Done': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300' },
    'Stuck': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300' },
    'Rejected': { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300' },
};

// Priority color mapping
const PRIORITY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    'Urgent': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', icon: 'text-red-500' },
    'High': { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-500' },
    'Medium': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-500' },
    'Low': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-500' },
};

const getStatusColor = (status: string) => {
    return STATUS_COLORS[status] || STATUS_COLORS['To Do'];
};

const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority] || { bg: 'bg-stone-100', text: 'text-stone-600', icon: 'text-stone-400' };
};

const formatDate = (date: string | null | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    } catch {
        return '';
    }
};

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
    isOpen,
    onClose,
    row,
    columns,
    customStatuses = [],
    boardId,
    onUpdateRow,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showCollapsedFields, setShowCollapsedFields] = useState(false);
    const [description, setDescription] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // Activity state
    const [activityItems, setActivityItems] = useState<Array<{
        id: string;
        type: 'created' | 'updated' | 'priority';
        message: string;
        timestamp: Date;
    }>>([]);

    // Comment state
    const [commentText, setCommentText] = useState('');

    // Assignment state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
    const { getToken } = useAuth();

    // Status picker state
    const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);
    const [isPriorityPickerOpen, setIsPriorityPickerOpen] = useState(false);
    const statusButtonRef = useRef<HTMLButtonElement>(null);
    const priorityButtonRef = useRef<HTMLButtonElement>(null);

    // Initialize activity on mount
    useEffect(() => {
        if (row) {
            setActivityItems([
                {
                    id: '1',
                    type: 'created',
                    message: 'You created this task',
                    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                },
            ]);
            setDescription(row.description || '');
        }
    }, [row?.id]);

    // Handle animation states
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Small delay to trigger animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true);
                });
            });
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Fetch team members when assign modal opens
    const handleOpenAssignModal = useCallback(async () => {
        setIsAssignModalOpen(true);
        setIsLoadingMembers(true);
        try {
            const token = await getToken();
            if (!token) return;
            const members = await teamService.getTeamMembers(token);
            setTeamMembers(members);
        } catch (error) {
            boardLogger.error('Failed to fetch team members:', error);
        } finally {
            setIsLoadingMembers(false);
        }
    }, [getToken]);

    // Handle assigning task to a team member
    const handleAssignTo = async (member: TeamMember) => {
        if (!boardId || !row?.id) {
            boardLogger.error('Missing boardId or row id');
            return;
        }

        setIsAssigning(true);
        try {
            const token = await getToken();
            if (!token) return;

            await assignmentService.assignTask(token, {
                sourceBoardId: boardId,
                sourceRowId: row.id,
                sourceTaskData: row,
                assignedToUserId: member.id
            });

            setAssignSuccess(member.name || member.email);
            setTimeout(() => {
                setAssignSuccess(null);
                setIsAssignModalOpen(false);
            }, 2000);
        } catch (error) {
            boardLogger.error('Failed to assign task:', error);
            alert('Failed to assign task. Make sure you are connected to this team member.');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleStatusChange = (newStatus: string) => {
        if (row && onUpdateRow) {
            onUpdateRow(row.id, { status: newStatus });
            setActivityItems(prev => [{
                id: Date.now().toString(),
                type: 'updated',
                message: `Status changed to ${newStatus}`,
                timestamp: new Date(),
            }, ...prev]);
        }
        setIsStatusPickerOpen(false);
    };

    const handlePriorityChange = (newPriority: string) => {
        if (row && onUpdateRow) {
            onUpdateRow(row.id, { priority: newPriority });
            setActivityItems(prev => [{
                id: Date.now().toString(),
                type: 'priority',
                message: `Priority set to ${newPriority}`,
                timestamp: new Date(),
            }, ...prev]);
        }
        setIsPriorityPickerOpen(false);
    };

    const handleDescriptionSave = () => {
        if (row && onUpdateRow) {
            onUpdateRow(row.id, { description });
        }
        setIsEditingDescription(false);
    };

    const handleAddComment = () => {
        if (!commentText.trim()) return;
        setActivityItems(prev => [{
            id: Date.now().toString(),
            type: 'updated',
            message: commentText,
            timestamp: new Date(),
        }, ...prev]);
        setCommentText('');
    };

    if (!isVisible) return null;

    const status = row?.status || 'To Do';
    const priority = row?.priority;
    const people = row?.people;
    const startDate = row?.date;
    const dueDate = row?.dueDate;
    const tags = row?.tags;
    const timeEstimate = row?.timeEstimate;

    const statusColors = getStatusColor(status);
    const priorityColors = priority ? getPriorityColor(priority) : null;

    // Get all available statuses
    const allStatuses = customStatuses.length > 0
        ? customStatuses
        : [
            { id: 'To Do', title: 'To Do', color: 'gray' },
            { id: 'In Progress', title: 'In Progress', color: 'blue' },
            { id: 'Done', title: 'Done', color: 'emerald' },
            { id: 'Stuck', title: 'Stuck', color: 'orange' },
            { id: 'Rejected', title: 'Rejected', color: 'rose' },
        ];

    const priorities = ['Urgent', 'High', 'Medium', 'Low'];

    const content = (
        <div className="fixed inset-0 z-[10000] overflow-hidden">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Panel Container */}
            <div
                className={`
                    absolute top-0 right-0 h-full w-full max-w-4xl
                    transform transition-transform duration-300 ease-out
                    ${isAnimating ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Main Panel */}
                <div className="h-full flex bg-white dark:bg-stone-900 shadow-2xl border-l border-stone-200 dark:border-stone-800">
                    {/* Left Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        {/* Header */}
                        <div className="flex-none px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                {/* Task Type Badge */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400">
                                    <Check size={12} weight="bold" />
                                    Task
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
                                    <ArrowsOutSimple size={18} />
                                </button>
                                <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
                                    <DotsThree size={18} weight="bold" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="px-6 py-5">
                                {/* Task Name */}
                                <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                                    {row?.name || 'Untitled Task'}
                                </h1>

                                {/* AI Suggestion */}
                                <div className="flex items-center gap-2 mb-6 text-sm text-stone-500 dark:text-stone-400">
                                    <Sparkle size={16} className="text-purple-500" />
                                    <span>Ask Brain to</span>
                                    <button className="text-purple-600 dark:text-purple-400 hover:underline">write a description</button>
                                    <span>,</span>
                                    <button className="text-purple-600 dark:text-purple-400 hover:underline">create a summary</button>
                                    <span>or</span>
                                    <button className="text-purple-600 dark:text-purple-400 hover:underline">find similar tasks</button>
                                </div>

                                {/* Properties Grid */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                                    {/* Status */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 w-28 text-sm text-stone-500 dark:text-stone-400">
                                            <Check size={16} />
                                            <span>Status</span>
                                        </div>
                                        <div className="relative">
                                            <button
                                                ref={statusButtonRef}
                                                onClick={() => setIsStatusPickerOpen(!isStatusPickerOpen)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusColors.bg} ${statusColors.text} hover:opacity-80`}
                                            >
                                                {status}
                                                <CaretRight size={12} className="transform rotate-90" />
                                            </button>
                                            {isStatusPickerOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-50" onClick={() => setIsStatusPickerOpen(false)} />
                                                    <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 min-w-[140px]">
                                                        {allStatuses.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => handleStatusChange(s.id)}
                                                                className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                                                            >
                                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(s.id).bg.replace('dark:bg-', 'bg-').split(' ')[0]}`} />
                                                                {s.title}
                                                                {status === s.id && <Check size={14} className="ml-auto text-blue-500" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Assignees */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 w-28 text-sm text-stone-500 dark:text-stone-400">
                                            <Users size={16} />
                                            <span>Assignees</span>
                                        </div>
                                        {people ? (
                                            <div className="flex items-center gap-2">
                                                {people.avatar ? (
                                                    <img src={people.avatar} alt={people.name} className="w-6 h-6 rounded-full" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                                                        {people.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-sm text-stone-700 dark:text-stone-300">{people.name}</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleOpenAssignModal}
                                                className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                                            >
                                                Empty
                                            </button>
                                        )}
                                    </div>

                                    {/* Dates */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 w-28 text-sm text-stone-500 dark:text-stone-400">
                                            <Calendar size={16} />
                                            <span>Dates</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {startDate || dueDate ? (
                                                <span className="text-stone-700 dark:text-stone-300">
                                                    {startDate && <span className="flex items-center gap-1"><CalendarBlank size={14} />{formatDate(startDate)}</span>}
                                                    {startDate && dueDate && <span className="mx-1">→</span>}
                                                    {dueDate && <span className="flex items-center gap-1 text-red-500"><CalendarBlank size={14} weight="fill" />{formatDate(dueDate)}</span>}
                                                </span>
                                            ) : (
                                                <span className="text-stone-400">Empty</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Priority */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 w-28 text-sm text-stone-500 dark:text-stone-400">
                                            <Flag size={16} />
                                            <span>Priority</span>
                                        </div>
                                        <div className="relative">
                                            {priority ? (
                                                <button
                                                    ref={priorityButtonRef}
                                                    onClick={() => setIsPriorityPickerOpen(!isPriorityPickerOpen)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${priorityColors?.bg} ${priorityColors?.text}`}
                                                >
                                                    <Flag size={14} weight="fill" className={priorityColors?.icon} />
                                                    {priority}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setIsPriorityPickerOpen(!isPriorityPickerOpen)}
                                                    className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                                                >
                                                    Empty
                                                </button>
                                            )}
                                            {isPriorityPickerOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-50" onClick={() => setIsPriorityPickerOpen(false)} />
                                                    <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 min-w-[120px]">
                                                        {priorities.map((p) => {
                                                            const colors = getPriorityColor(p);
                                                            return (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => handlePriorityChange(p)}
                                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                                                                >
                                                                    <Flag size={14} weight="fill" className={colors.icon} />
                                                                    {p}
                                                                    {priority === p && <Check size={14} className="ml-auto text-blue-500" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time Estimate */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 w-28 text-sm text-stone-500 dark:text-stone-400">
                                            <Clock size={16} />
                                            <span>Time estimate</span>
                                        </div>
                                        <span className="text-sm text-stone-400">{timeEstimate || 'Empty'}</span>
                                    </div>

                                    {/* Track Time */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 w-28 text-sm text-stone-500 dark:text-stone-400">
                                            <Timer size={16} />
                                            <span>Track time</span>
                                        </div>
                                        <button className="flex items-center gap-2 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700">
                                            <Timer size={14} />
                                            Start
                                        </button>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 w-28 text-sm text-stone-500 dark:text-stone-400">
                                            <Tag size={16} />
                                            <span>Tags</span>
                                        </div>
                                        {tags && tags.length > 0 ? (
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {tags.map((tag: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-stone-400">Empty</span>
                                        )}
                                    </div>
                                </div>

                                {/* Collapse Fields Button */}
                                <button
                                    onClick={() => setShowCollapsedFields(!showCollapsedFields)}
                                    className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-6"
                                >
                                    <CaretDown size={14} className={`transform transition-transform ${showCollapsedFields ? 'rotate-180' : ''}`} />
                                    {showCollapsedFields ? 'Show less' : 'Collapse empty fields'}
                                </button>

                                {/* Description */}
                                <div className="mb-6">
                                    {isEditingDescription ? (
                                        <div>
                                            <textarea
                                                ref={descriptionRef}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Add description..."
                                                className="w-full min-h-[100px] p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={handleDescriptionSave}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingDescription(false);
                                                        setDescription(row?.description || '');
                                                    }}
                                                    className="px-3 py-1.5 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingDescription(true)}
                                            className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                                        >
                                            <TextAlignLeft size={16} />
                                            {description || 'Add description, or write with'}
                                            <Sparkle size={14} className="text-purple-500" />
                                            AI
                                        </button>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-stone-100 dark:border-stone-800 my-6" />

                                {/* Actions */}
                                <div className="space-y-2">
                                    <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors">
                                        <Plus size={18} />
                                        Add Custom Fields
                                    </button>
                                    <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors">
                                        <Plus size={18} />
                                        Add subtask
                                    </button>
                                    <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors">
                                        <GitBranch size={18} />
                                        Relate items or add dependencies
                                    </button>
                                    <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors">
                                        <ListChecks size={18} />
                                        Create checklist
                                    </button>
                                    <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors">
                                        <Paperclip size={18} />
                                        Attach file
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Activity Panel */}
                    <div className="w-80 border-l border-stone-100 dark:border-stone-800 flex flex-col bg-stone-50/50 dark:bg-stone-900/50">
                        {/* Activity Header */}
                        <div className="flex-none px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300">Activity</h3>
                            <div className="flex items-center gap-2">
                                <button className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                                    <MessageSquare size={16} />
                                </button>
                                <span className="bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs px-1.5 rounded">
                                    {activityItems.length}
                                </span>
                            </div>
                        </div>

                        {/* Activity Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                                {activityItems.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
                                            Y
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-stone-700 dark:text-stone-300">
                                                {item.message}
                                                {item.type === 'priority' && (
                                                    <span className="inline-flex items-center gap-1 ml-1 text-stone-500">
                                                        <Flag size={12} weight="fill" className="text-emerald-500" />
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-stone-400 mt-0.5">
                                                {item.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                                                {item.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comment Input */}
                        <div className="flex-none p-4 border-t border-stone-100 dark:border-stone-800">
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                                    Y
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddComment();
                                            }
                                        }}
                                        placeholder="Mention @Brain to create, find, ask anything"
                                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        <button className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1">
                                            Comment <CaretDown size={12} />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <button className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded">
                                                <Sparkle size={14} />
                                            </button>
                                            <button className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded">
                                                <Paperclip size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assign Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setIsAssignModalOpen(false)} />
                    <div className="relative bg-white dark:bg-stone-800 rounded-xl shadow-2xl w-80 max-h-96 overflow-hidden animate-fadeIn">
                        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
                            <h3 className="font-semibold text-stone-800 dark:text-stone-100">Assign to Team Member</h3>
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
                            >
                                <X size={16} className="text-stone-500" />
                            </button>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {assignSuccess ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                                        <Check size={24} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-sm text-stone-600 dark:text-stone-300">
                                        Task assigned to <span className="font-medium">{assignSuccess}</span>
                                    </p>
                                </div>
                            ) : isLoadingMembers ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                </div>
                            ) : teamMembers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                    <UserCircle size={40} className="text-stone-300 dark:text-stone-600 mb-2" />
                                    <p className="text-sm text-stone-500 dark:text-stone-400">No team members found</p>
                                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Connect with team members in the Teams page first</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100 dark:divide-stone-700">
                                    {teamMembers.map((member) => (
                                        <button
                                            key={member.id}
                                            onClick={() => handleAssignTo(member)}
                                            disabled={isAssigning}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-left disabled:opacity-50"
                                        >
                                            {member.avatarUrl ? (
                                                <img
                                                    src={member.avatarUrl}
                                                    alt={member.name || member.email}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                                                    {(member.name || member.email).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                                                    {member.name || member.email}
                                                </p>
                                                {member.name && (
                                                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                                        {member.email}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(content, document.body);
};
