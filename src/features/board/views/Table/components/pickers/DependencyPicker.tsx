import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    GitBranch, ArrowRight, ArrowsClockwise, Link as LinkIcon,
    MagnifyingGlass, Plus, X, Warning
} from 'phosphor-react';

// =============================================================================
// DEPENDENCY PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export type DependencyType =
    | 'finish_to_start'   // Task B starts when Task A finishes (most common)
    | 'start_to_start'    // Task B starts when Task A starts
    | 'finish_to_finish'  // Task B finishes when Task A finishes
    | 'start_to_finish';  // Task B finishes when Task A starts (rare)

export interface TaskDependency {
    id: string;
    predecessorId: string;
    predecessorName: string;
    successorId: string;
    successorName: string;
    type: DependencyType;
    lagDays: number;
}

export interface DependencyValue {
    blockedBy: TaskDependency[];  // Tasks this task is waiting on
    blocking: TaskDependency[];   // Tasks waiting on this task
}

interface DependencyPickerProps {
    value: DependencyValue | null;
    currentTaskId: string;
    currentTaskName: string;
    availableTasks?: { id: string; name: string; status?: string }[];
    onSelect: (value: DependencyValue | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

const DEPENDENCY_TYPES = [
    {
        type: 'finish_to_start' as const,
        label: 'Finish → Start',
        description: 'Must finish before this can start',
        icon: ArrowRight
    },
    {
        type: 'start_to_start' as const,
        label: 'Start → Start',
        description: 'Must start before this can start',
        icon: ArrowsClockwise
    },
    {
        type: 'finish_to_finish' as const,
        label: 'Finish → Finish',
        description: 'Must finish before this can finish',
        icon: ArrowsClockwise
    },
];

export const DependencyPicker: React.FC<DependencyPickerProps> = ({
    value,
    currentTaskId,
    currentTaskName,
    availableTasks = [],
    onSelect,
    onClose,
    triggerRect,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<DependencyType>('finish_to_start');
    const [lagDays, setLagDays] = useState(0);
    const [activeTab, setActiveTab] = useState<'blocked_by' | 'blocking'>('blocked_by');

    const MENU_WIDTH = 380;
    const MENU_HEIGHT = 500;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

        let left: number | undefined;
        let right: number | undefined;

        if (wouldOverflowRight) {
            right = PADDING;
        } else {
            left = Math.max(PADDING, triggerRect.left);
        }

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && triggerRect.top > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
            maxHeight: MENU_HEIGHT,
        };

        if (openUp) {
            return { ...baseStyle, bottom: windowHeight - triggerRect.top + 4, ...(left !== undefined ? { left } : { right }) };
        }
        return { ...baseStyle, top: triggerRect.bottom + 4, ...(left !== undefined ? { left } : { right }) };
    }, [triggerRect]);

    const blockedBy = value?.blockedBy || [];
    const blocking = value?.blocking || [];

    // Filter out already linked tasks and current task
    const linkedTaskIds = new Set([
        ...blockedBy.map(d => d.predecessorId),
        ...blocking.map(d => d.successorId),
        currentTaskId,
    ]);

    const filteredTasks = availableTasks.filter(task =>
        !linkedTaskIds.has(task.id) &&
        task.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddDependency = (task: { id: string; name: string }) => {
        const newDependency: TaskDependency = {
            id: `dep-${Date.now()}`,
            predecessorId: activeTab === 'blocked_by' ? task.id : currentTaskId,
            predecessorName: activeTab === 'blocked_by' ? task.name : currentTaskName,
            successorId: activeTab === 'blocked_by' ? currentTaskId : task.id,
            successorName: activeTab === 'blocked_by' ? currentTaskName : task.name,
            type: selectedType,
            lagDays,
        };

        // TODO: Check for circular dependencies
        console.log('[Dependency] Add dependency - NOT IMPLEMENTED', newDependency);

        const newValue: DependencyValue = {
            blockedBy: activeTab === 'blocked_by' ? [...blockedBy, newDependency] : blockedBy,
            blocking: activeTab === 'blocking' ? [...blocking, newDependency] : blocking,
        };

        onSelect(newValue);
        setSearchQuery('');
    };

    const handleRemoveDependency = (depId: string, type: 'blocked_by' | 'blocking') => {
        const newValue: DependencyValue = {
            blockedBy: type === 'blocked_by' ? blockedBy.filter(d => d.id !== depId) : blockedBy,
            blocking: type === 'blocking' ? blocking.filter(d => d.id !== depId) : blocking,
        };

        if (newValue.blockedBy.length === 0 && newValue.blocking.length === 0) {
            onSelect(null);
        } else {
            onSelect(newValue);
        }
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                            <GitBranch size={14} />
                            Dependencies
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                            BETA
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-100 dark:border-stone-800">
                    <button
                        onClick={() => setActiveTab('blocked_by')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${
                            activeTab === 'blocked_by'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-stone-500 hover:text-stone-700'
                        }`}
                    >
                        Blocked By ({blockedBy.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('blocking')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${
                            activeTab === 'blocking'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-stone-500 hover:text-stone-700'
                        }`}
                    >
                        Blocking ({blocking.length})
                    </button>
                </div>

                {/* Current Dependencies */}
                <div className="max-h-[150px] overflow-y-auto">
                    {(activeTab === 'blocked_by' ? blockedBy : blocking).length === 0 ? (
                        <div className="p-4 text-center text-xs text-stone-400">
                            {activeTab === 'blocked_by'
                                ? 'No dependencies. This task can start anytime.'
                                : 'No tasks are waiting on this one.'
                            }
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {(activeTab === 'blocked_by' ? blockedBy : blocking).map((dep) => (
                                <div
                                    key={dep.id}
                                    className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg"
                                >
                                    <LinkIcon size={14} className="text-stone-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-stone-700 dark:text-stone-300 truncate">
                                            {activeTab === 'blocked_by' ? dep.predecessorName : dep.successorName}
                                        </div>
                                        <div className="text-[10px] text-stone-400 flex items-center gap-1">
                                            <span>{DEPENDENCY_TYPES.find(t => t.type === dep.type)?.label}</span>
                                            {dep.lagDays > 0 && (
                                                <span className="text-amber-500">+{dep.lagDays}d lag</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveDependency(dep.id, activeTab)}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                    >
                                        <X size={14} className="text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Dependency Section */}
                <div className="border-t border-stone-100 dark:border-stone-800">
                    {/* Dependency Type */}
                    <div className="p-2 border-b border-stone-100 dark:border-stone-800">
                        <div className="text-[10px] font-medium text-stone-500 uppercase mb-1.5">
                            Dependency Type
                        </div>
                        <div className="flex gap-1">
                            {DEPENDENCY_TYPES.map((type) => (
                                <button
                                    key={type.type}
                                    onClick={() => setSelectedType(type.type)}
                                    className={`flex-1 py-1.5 px-2 text-[10px] rounded transition-colors ${
                                        selectedType === type.type
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-800'
                                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 hover:bg-stone-200 dark:hover:bg-stone-700'
                                    }`}
                                    title={type.description}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lag Days */}
                    <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
                        <span className="text-[10px] font-medium text-stone-500 uppercase">Lag:</span>
                        <input
                            type="number"
                            value={lagDays}
                            onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-16 px-2 py-1 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                        />
                        <span className="text-xs text-stone-400">days</span>
                    </div>

                    {/* Search */}
                    <div className="p-2">
                        <div className="relative">
                            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search tasks to ${activeTab === 'blocked_by' ? 'wait on' : 'block'}...`}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
                            />
                        </div>
                    </div>

                    {/* Available Tasks */}
                    <div className="max-h-[150px] overflow-y-auto">
                        {filteredTasks.length === 0 ? (
                            <div className="p-4 text-center text-xs text-stone-400">
                                {searchQuery ? 'No matching tasks found' : 'No tasks available to link'}
                            </div>
                        ) : (
                            <div className="px-2 pb-2 space-y-1">
                                {filteredTasks.slice(0, 10).map((task) => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleAddDependency(task)}
                                        className="w-full flex items-center gap-2 px-2 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-lg transition-colors text-left"
                                    >
                                        <Plus size={14} className="text-green-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-stone-700 dark:text-stone-300 truncate">
                                                {task.name}
                                            </div>
                                            {task.status && (
                                                <div className="text-[10px] text-stone-400">
                                                    Status: {task.status}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/30">
                    <button
                        onClick={onClose}
                        className="w-full py-1.5 text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

// Inline display for table cells
export const DependencyDisplay: React.FC<{
    value: DependencyValue | null;
    onClick?: () => void;
}> = ({ value, onClick }) => {
    const blockedBy = value?.blockedBy || [];
    const blocking = value?.blocking || [];
    const total = blockedBy.length + blocking.length;

    if (total === 0) {
        return (
            <button onClick={onClick} className="text-stone-400 hover:text-stone-600 text-sm flex items-center gap-1">
                <Plus size={12} />
                Add dependency
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1 text-sm"
        >
            {blockedBy.length > 0 && (
                <span className="flex items-center gap-0.5 text-red-500" title={`Blocked by ${blockedBy.length} task(s)`}>
                    <Warning size={12} />
                    {blockedBy.length}
                </span>
            )}
            {blocking.length > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500" title={`Blocking ${blocking.length} task(s)`}>
                    <GitBranch size={12} />
                    {blocking.length}
                </span>
            )}
        </button>
    );
};

export default DependencyPicker;
