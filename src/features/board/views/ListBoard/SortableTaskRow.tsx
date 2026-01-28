import React from 'react';
import {
    ArrowBendDownRight as CornerDownRight, CaretDown as ChevronDown, CaretRight as ChevronRight, Cube as Box, Sparkle as Sparkles, User, Clock, Flag, Tag, PencilSimple as Edit, LinkSimple as Link2, Star, Globe, Envelope as Mail, Phone, MapPin
} from 'phosphor-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Status, Priority, STATUS_COLORS, PRIORITY_COLORS, PEOPLE } from '../../types/boardTypes';
import { ITask, IGroup } from '../../types/boardTypes';
import { StatusCell } from './components/cells/StatusCell';
import { PriorityCell } from './components/cells/PriorityCell';
import { PersonCell } from './components/cells/PersonCell';
import { LongTextCell } from './components/cells/LongTextCell';
import { DropdownCell } from './components/cells/DropdownCell';

// Note: Ensure these components are exported from their files if not already (they usually are)

interface SortableTaskRowProps {
    task: ITask;
    group: IGroup;
    selectionColumnWidth: string;
    actionColumnWidth: string;
    expandedTaskIds: Set<string>;
    toggleTaskSelection: (groupId: string, taskId: string, selected: boolean) => void;
    updateTask: (groupId: string, taskId: string, updates: Partial<ITask>) => void;
    updateTaskTextValue: (groupId: string, taskId: string, colId: string, value: string) => void;
    toggleSubtask: (taskId: string) => void;
    setActiveDatePicker: (data: any) => void;
    handleContextMenu: (e: React.MouseEvent, groupId: string, colId: string) => void;
    deleteTask: (groupId: string, taskId: string) => void;
    handleAddSubtask: (groupId: string, parentTaskId: string) => void;
    subtaskInput: Record<string, string>;
    setSubtaskInput: (input: Record<string, string>) => void;
    darkMode?: boolean;
    setActiveConnectionMenu: (data: { groupId: string, taskId: string, colId: string, rect: DOMRect, config?: { targetPath?: string, targetName?: string } }) => void;
}

export const SortableTaskRow: React.FC<SortableTaskRowProps> = ({
    task,
    group,
    selectionColumnWidth,
    actionColumnWidth,
    expandedTaskIds,
    toggleTaskSelection,
    updateTask,
    updateTaskTextValue,
    toggleSubtask,
    setActiveDatePicker,
    handleContextMenu,
    deleteTask,
    handleAddSubtask,
    subtaskInput,
    setSubtaskInput,

    darkMode = false,
    setActiveConnectionMenu,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: 'TASK', task, group } });

    // GPU-accelerated style for smooth dragging
    const style: React.CSSProperties = {
        // Use translate3d for GPU acceleration
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        // Smooth transition only when not dragging
        transition: isDragging
            ? 'none'
            : 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 150ms ease',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 9999 : 'auto',
        position: 'relative' as const,
        gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth,
        // GPU hints
        willChange: isDragging ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
    };

    return (
        <React.Fragment >
            <div
                ref={setNodeRef}
                style={style}
                // {...attributes}  <-- Moved to handle
                className={`grid gap-0 group/row text-sm transition-colors relative ${isDragging ? "z-50 shadow-xl ring-2 ring-blue-500/20" : ""} ${darkMode ? 'bg-[#1a1d24] hover:bg-white/5' : 'bg-white hover:bg-gray-50/50'}`}
            >
                <div className={`flex items-center justify-center py-1.5 border-r relative transition-colors sticky left-0 z-10 border-r-2 ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800 group-hover/row:bg-white/5' : 'bg-white border-gray-100 border-r-gray-200/50 hover:bg-gray-50'}`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: group.color }}></div>
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300"
                        checked={!!task.selected}
                        onChange={(e) => toggleTaskSelection(group.id, task.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Render Cells based on Columns */}
                {group.columns.map((col) => {
                    const isName = col.type === 'name';

                    return (

                        <div key={col.id} className={`relative border-r flex items-center ${isName ? 'justify-start pl-2 sticky left-[50px] z-10 border-r-2' : 'justify-center'} min-h-[32px] transition-colors ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800 group-hover/row:bg-white/5 text-gray-300' : 'bg-white border-gray-100 border-r-gray-200/50 group-hover/row:bg-[#f8f9fa]'}`}>

                            {isName && (
                                <div className="cursor-grab active:cursor-grabbing text-gray-300 mr-2 opacity-0 group-hover/row:opacity-100 hover:text-gray-500 p-1" {...listeners} {...attributes} style={{ touchAction: 'none' }}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                </div>
                            )}

                            {col.type === 'name' && (
                                <div className="flex items-center w-full gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtask(task.id);
                                        }}
                                        className="p-0.5 hover:bg-gray-200 rounded text-gray-400 transition-colors"
                                    >
                                        {expandedTaskIds.has(task.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    <input
                                        value={task.name}
                                        onChange={(e) => updateTask(group.id, task.id, { name: e.target.value })}
                                        className={`w-full px-2 py-1.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                                    />
                                    <div className="text-xs text-gray-400 mr-2">
                                        {task.subtasks?.length ? `${task.subtasks.length} subtasks` : ''}
                                    </div>
                                </div>
                            )}


                            {col.type === 'status' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <StatusCell
                                        status={col.id === 'col_status' ? task.status : (task.textValues[col.id] as Status || Status.ToDo)}
                                        onChange={(s) => {
                                            if (col.id === 'col_status') {
                                                updateTask(group.id, task.id, { status: s });
                                            } else {
                                                updateTaskTextValue(group.id, task.id, col.id, s);
                                            }
                                        }}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            ) : col.type === 'priority' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <PriorityCell
                                        priority={col.id === 'col_priority' ? task.priority : (task.textValues[col.id] as Priority || Priority.Normal)}
                                        onChange={(p) => {
                                            if (col.id === 'col_priority') {
                                                updateTask(group.id, task.id, { priority: p });
                                            } else {
                                                updateTaskTextValue(group.id, task.id, col.id, p);
                                            }
                                        }}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            ) : col.type === 'person' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <PersonCell
                                        personId={col.id === 'col_person' ? task.personId : (task.textValues[col.id] || null)}
                                        onChange={(pid) => {
                                            if (col.id === 'col_person') {
                                                updateTask(group.id, task.id, { personId: pid });
                                            } else {
                                                updateTaskTextValue(group.id, task.id, col.id, pid || '');
                                            }
                                        }}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            ) : col.type === 'date' ? (
                                <div
                                    className="w-full h-full relative flex items-center justify-center"
                                >
                                    <div
                                        className={`text-xs font-medium px-2 py-1 rounded transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer ${darkMode ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const isPrimary = col.id === 'col_date';
                                            const currentValue = isPrimary ? (task.dueDate || '') : (task.textValues[col.id] || '');

                                            setActiveDatePicker({
                                                taskId: task.id,
                                                colId: col.id,
                                                date: currentValue,
                                                rect,
                                                onSelect: (dateStr: string) => {
                                                    if (isPrimary) {
                                                        updateTask(group.id, task.id, { dueDate: dateStr });
                                                    } else {
                                                        updateTaskTextValue(group.id, task.id, col.id, dateStr);
                                                    }
                                                }
                                            });
                                        }}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const isPrimary = col.id === 'col_date';
                                                const currentValue = isPrimary ? (task.dueDate || '') : (task.textValues[col.id] || '');

                                                setActiveDatePicker({
                                                    taskId: task.id,
                                                    colId: col.id,
                                                    date: currentValue,
                                                    rect,
                                                    onSelect: (dateStr: string) => {
                                                        if (isPrimary) {
                                                            updateTask(group.id, task.id, { dueDate: dateStr });
                                                        } else {
                                                            updateTaskTextValue(group.id, task.id, col.id, dateStr);
                                                        }
                                                    }
                                                });
                                            }
                                        }}
                                    >
                                        {(() => {
                                            const isPrimary = col.id === 'col_date';
                                            const val = isPrimary ? task.dueDate : task.textValues[col.id];
                                            return val ? new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : <span className="text-gray-300">Set Date</span>;
                                        })()}
                                    </div>
                                </div>
                            ) : null}

                            {col.type === 'checkbox' && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={task.textValues[col.id] === 'true'}
                                        onChange={(e) => {
                                            updateTaskTextValue(group.id, task.id, col.id, e.target.checked ? 'true' : 'false');
                                        }}
                                        className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer ${darkMode ? 'border-gray-600 bg-transparent' : 'border-gray-300'}`}
                                    />
                                </div>
                            )}

                            {col.type === 'money' && (
                                <div className="w-full h-full px-2 py-1.5 text-sm text-gray-700 flex items-center justify-end font-mono">
                                    {task.textValues[col.id] ? (
                                        <>
                                            <span className={`mr-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{col.currency || '$'}</span>
                                            <input
                                                type="text"
                                                value={task.textValues[col.id]}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                    updateTaskTextValue(group.id, task.id, col.id, val);
                                                }}
                                                className="bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 w-full text-right"
                                                placeholder="0.00"
                                            />
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                updateTaskTextValue(group.id, task.id, col.id, val);
                                            }}
                                            className={`bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 w-full text-right ${darkMode ? 'placeholder-gray-600 text-gray-300' : 'placeholder-gray-300 text-gray-700'}`}
                                            placeholder={col.currency || '$'}
                                        />
                                    )}
                                </div>
                            )}

                            {col.type === 'website' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                                        <Globe size={12} />
                                    </div>
                                    <input
                                        type="text"
                                        value={task.textValues[col.id] || ''}
                                        onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                        className={`w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-sm hover:underline cursor-text truncate ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                        placeholder="www.example.com"
                                    />
                                </div>
                            )}

                            {col.type === 'email' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500'}`}>
                                        <Mail size={12} />
                                    </div>
                                    <input
                                        type="text"
                                        value={task.textValues[col.id] || ''}
                                        onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                        className={`w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            )}

                            {col.type === 'phone' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-500'}`}>
                                        <Phone size={12} />
                                    </div>
                                    <input
                                        type="text"
                                        value={task.textValues[col.id] || ''}
                                        onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                        className={`w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            )}

                            {col.type === 'location' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                        <MapPin size={12} />
                                    </div>
                                    <input
                                        type="text"
                                        value={task.textValues[col.id] || ''}
                                        onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                        className={`w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                        placeholder="Add location"
                                    />
                                </div>
                            )}

                            {col.type === 'rating' && (
                                <div className="w-full h-full flex items-center justify-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            className={`cursor-pointer transition-colors ${star <= (Number(task.textValues[col.id]) || 0) ? 'text-amber-400 fill-amber-400' : (darkMode ? 'text-gray-600' : 'text-gray-300')}`}
                                            onClick={() => updateTaskTextValue(group.id, task.id, col.id, star.toString())}
                                        />
                                    ))}
                                </div>
                            )}

                            {col.type === 'progress_manual' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`flex-1 h-2 rounded-full overflow-hidden relative group/progress cursor-pointer ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <div
                                            className="h-full bg-green-500 transition-all duration-300"
                                            style={{ width: `${Number(task.textValues[col.id]) || 0}%` }}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={Number(task.textValues[col.id]) || 0}
                                            onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <span className={`text-xs w-8 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{Number(task.textValues[col.id]) || 0}%</span>
                                </div>
                            )}

                            {col.type === 'button' && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <button
                                        className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors active:scale-95"
                                        onClick={() => alert(`Action triggered for ${task.name}`)}
                                    >
                                        Click Me
                                    </button>
                                </div>
                            )}

                            {col.type === 'connection' && (
                                <div className="w-full h-full p-1 flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            let config;
                                            try {
                                                const val = task.textValues[col.id];
                                                if (val) config = JSON.parse(val);
                                            } catch (e) { /* ignore */ }

                                            setActiveConnectionMenu({
                                                groupId: group.id,
                                                taskId: task.id,
                                                colId: col.id,
                                                rect,
                                                config
                                            });
                                        }}
                                        className={`w-full h-full text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5 px-2 group/btn ${(() => {
                                            let hasConfig = false;
                                            try {
                                                const val = task.textValues[col.id];
                                                if (val && JSON.parse(val).targetPath) hasConfig = true;
                                            } catch {
                                                // JSON parse failed - value is not a valid link config
                                            }
                                            return hasConfig;
                                        })() ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200'}`}
                                    >
                                        <Link2 size={12} className="group-hover/btn:scale-110 transition-transform" />
                                        <span className="truncate">{(() => {
                                            try {
                                                const val = task.textValues[col.id];
                                                if (val) {
                                                    const c = JSON.parse(val);
                                                    if (c.targetName) return `Go to ${c.targetName}`;
                                                }
                                            } catch {
                                                // JSON parse failed - value is not a valid link config
                                            }
                                            return 'Connect';
                                        })()}</span>
                                    </button>
                                </div>
                            )}

                            {col.type === 'text' && (
                                <input
                                    type="text"
                                    value={task.textValues[col.id] || ''}
                                    onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                    className={`w-full h-full text-center px-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                    placeholder="-"
                                    tabIndex={0}
                                />
                            )}
                            {col.type === 'long_text' && (
                                <div className="w-full h-full p-1">
                                    <LongTextCell
                                        value={task.textValues[col.id] || ''}
                                        onChange={(val) => updateTaskTextValue(group.id, task.id, col.id, val)}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            )}
                            {col.type === 'dropdown' && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <DropdownCell
                                        options={col.options}
                                        value={task.textValues[col.id]}
                                        onChange={(val) => updateTaskTextValue(group.id, task.id, col.id, val)}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            )}
                            {col.type === 'number' && (
                                <input
                                    type="text"
                                    value={task.textValues[col.id] || ''}
                                    onChange={(e) => {
                                        // Allow only numbers and commas/dots
                                        const val = e.target.value;
                                        if (/^[0-9.,]*$/.test(val)) {
                                            updateTaskTextValue(group.id, task.id, col.id, val);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        // Format on blur
                                        const val = e.target.value.replace(/,/g, '');
                                        if (val && !isNaN(Number(val))) {
                                            const formatted = Number(val).toLocaleString();
                                            updateTaskTextValue(group.id, task.id, col.id, formatted);
                                        }
                                    }}
                                    className="w-full h-full text-center px-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-600 font-mono text-xs"
                                    placeholder="0"
                                    tabIndex={0}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Delete Row Action */}
                <div className={`flex items-center justify-center border-l opacity-0 group-hover/row:opacity-100 transition-opacity ${darkMode ? 'border-gray-800 bg-[#0f1115]' : 'border-gray-100 bg-white'}`}>
                    <button
                        onClick={() => deleteTask(group.id, task.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>

            {/* Subtasks Render */}
            {
                expandedTaskIds.has(task.id) && (
                    <div className="contents">
                        {/* Existing Subtasks */}
                        {task.subtasks?.map((subtask) => (
                            <div
                                key={subtask.id}
                                className={`grid gap-px group/subrow text-sm transition-colors relative ${darkMode ? 'bg-[#1a1d24]/50 hover:bg-white/5' : 'bg-gray-50/30 hover:bg-gray-50'}`}
                                style={{ gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth }}
                            >
                                {/* Selection Column Placeholder */}
                                <div className={`flex items-center justify-center py-1.5 border-r relative sticky left-0 z-10 border-r-2 ${darkMode ? 'bg-[#1a1d24]/50 border-gray-800 border-r-gray-800' : 'bg-gray-50/30 border-gray-100 border-r-gray-200/50'}`}>
                                    <div className="w-4 h-4" /> {/* Empty placeholder for checkbox */}
                                </div>

                                {/* Cells */}
                                {group.columns.map((col) => {
                                    const isName = col.type === 'name';
                                    return (
                                        <div key={`${subtask.id}-${col.id}`} className={`relative border-r flex items-center ${isName ? 'justify-start pl-8 sticky left-[50px] z-10 border-r-2' : 'justify-center'} min-h-[32px] transition-colors ${darkMode ? 'bg-[#1a1d24]/50 border-gray-800 border-r-gray-800 group-hover/subrow:bg-white/5 text-gray-400' : 'bg-gray-50/30 border-gray-100 border-r-gray-200/50 group-hover/subrow:bg-gray-100'}`}>
                                            {isName && <CornerDownRight size={14} className="text-gray-400 mr-2" />}
                                            {isName ? (
                                                <input
                                                    value={subtask.name}
                                                    onChange={(e) => {
                                                        const updatedSubtasks = task.subtasks?.map(st => st.id === subtask.id ? { ...st, name: e.target.value } : st);
                                                        updateTask(group.id, task.id, { subtasks: updatedSubtasks });
                                                    }}
                                                    className={`w-full px-2 py-1.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                                />
                                            ) : (
                                                <div className="text-xs text-gray-400 italic">
                                                    -
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className={`border-l ${darkMode ? 'bg-[#1a1d24]/50 border-gray-800' : 'bg-white border-gray-100'}`} />
                            </div>
                        ))}

                        {/* Add Subtask Row */}
                        <div className={`grid gap-px relative z-20 shadow-lg my-2 mx-4 rounded-lg border overflow-hidden animate-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}
                            style={{ gridColumn: `1 / -1` }}
                        >
                            <div className={`flex items-center p-2 gap-3 ${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`}>
                                <div className={`w-5 h-5 rounded-full border-2 border-dashed animate-spin-slow ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />
                                <input
                                    autoFocus
                                    value={subtaskInput[task.id] || ''}
                                    onChange={(e) => setSubtaskInput({ ...subtaskInput, [task.id]: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddSubtask(group.id, task.id);
                                    }}
                                    placeholder="Task Name or type '/' for commands"
                                    className={`flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 bg-transparent ${darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                                />
                                <div className={`flex items-center gap-1 border-l pl-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Box size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Sparkles size={16} /></button>
                                    <div className={`w-px h-4 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><User size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Clock size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Flag size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Tag size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Edit size={16} /></button>
                                    <div className={`w-px h-4 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                    <button
                                        onClick={() => toggleSubtask(task.id)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/5 border-gray-700' : 'text-gray-600 hover:bg-gray-100 border-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleAddSubtask(group.id, task.id)}
                                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors flex items-center gap-1"
                                    >
                                        Save <CornerDownRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </React.Fragment >
    );
};
