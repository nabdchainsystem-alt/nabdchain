import React from 'react';
import {
    Plus as PlusIcon, Trash as Trash2, DotsThree as MoreHorizontal, Cube as Box, Clock, Target, ListChecks as ListTodo, PushPin as Pin,
    Archive as ArchiveIcon, Download, Copy, ArrowRight as MoveRight, Star, X,
    Globe, Envelope as Mail, Phone, MapPin, LinkSimple as Link2
} from 'phosphor-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { IGroup, ITask, Status, Priority, STATUS_COLORS, PRIORITY_COLORS } from '../../types/boardTypes';
import { SortableTaskRow } from './SortableTaskRow';
import { StatusCell } from './components/cells/StatusCell';
import { PriorityCell } from './components/cells/PriorityCell';
import { PersonCell } from './components/cells/PersonCell';
import { resolveTaskStatus, statusColorMap } from './boardUtils';


interface ListBoardGroupProps {
    group: IGroup;
    filteredTasks: ITask[];
    progress: { counts: any, weighted: number, total: number };
    collapsedGroups: Set<string>;
    toggleGroupCollapse: (groupId: string) => void;
    updateGroupTitle: (groupId: string, title: string) => void;
    toggleGroupPin: (groupId: string) => void;
    setShowReminderModalGroupId: (groupId: string) => void;
    setShowGoalsModalGroupId: (groupId: string) => void;
    setShowListBoardModalGroupId: (groupId: string) => void;
    isMainBoard: boolean;
    handleDeleteGroupClick: (groupId: string) => void;

    // Selection
    allSelected: boolean;
    someSelected: boolean;
    toggleGroupSelection: (groupId: string, selected: boolean) => void;

    // Columns
    selectionColumnWidth: string;
    actionColumnWidth: string;
    handleContextMenu: (e: React.MouseEvent, groupId: string, colId: string) => void;
    handleColumnDragStart: (e: any, groupId: string, colId: string, index: number) => void;
    handleColumnDragOver: (e: any, index: number) => void;
    handleColumnDrop: (e: any, groupId: string, index: number) => void;
    updateColumnTitle: (groupId: string, colId: string, title: string) => void;
    activeColumnMenu: { groupId: string, rect: DOMRect } | null;
    setActiveColumnMenu: (menu: { groupId: string, rect: DOMRect } | null) => void;
    setResizingCol: (data: any) => void;

    // Tasks
    expandedTaskIds: Set<string>;
    toggleTaskSelection: (groupId: string, taskId: string, selected: boolean) => void;
    updateTask: (groupId: string, taskId: string, updates: Partial<ITask>) => void;
    handleDeleteTaskClick: (groupId: string, taskId: string) => void;
    updateTaskTextValue: (groupId: string, taskId: string, colId: string, value: string) => void;
    toggleSubtask: (taskId: string) => void;

    // Portals / Active States
    setActiveDatePicker: (data: any) => void;
    setActiveConnectionMenu: (data: any) => void;

    // Subtasks
    handleAddSubtask: (groupId: string, parentTaskId: string) => void;
    subtaskInput: Record<string, string>;
    setSubtaskInput: (input: Record<string, string>) => void;

    // Draft Tasks
    draftTasks: Record<string, Partial<ITask>>;
    updateDraftTask: (groupId: string, updates: Partial<ITask>) => void;
    handleAddTask: (groupId: string) => void;

    darkMode?: boolean;
}

export const ListBoardGroup: React.FC<ListBoardGroupProps> = React.memo(({
    group,
    filteredTasks,
    progress,
    collapsedGroups,
    toggleGroupCollapse,
    updateGroupTitle,
    toggleGroupPin,
    setShowReminderModalGroupId,
    setShowGoalsModalGroupId,
    setShowListBoardModalGroupId,
    isMainBoard,
    handleDeleteGroupClick,
    allSelected,
    someSelected,
    toggleGroupSelection,
    selectionColumnWidth,
    actionColumnWidth,
    handleContextMenu,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDrop,
    updateColumnTitle,
    activeColumnMenu,
    setActiveColumnMenu,
    setResizingCol,
    expandedTaskIds,
    toggleTaskSelection,
    updateTask,
    handleDeleteTaskClick,
    updateTaskTextValue,
    toggleSubtask,
    setActiveDatePicker,
    setActiveConnectionMenu,
    handleAddSubtask,
    subtaskInput,
    setSubtaskInput,
    draftTasks,
    updateDraftTask,
    handleAddTask,
    darkMode
}) => {
    return (
        <div id={`group-${group.id}`} className={`relative flex flex-col w-full mb-10 shadow-sm border rounded-xl overflow-hidden transition-colors ${darkMode ? 'border-gray-800 bg-[#1a1d24]' : 'border-gray-200/60'}`}>

            {/* Group Header */}
            <div className={`flex items-center px-4 py-3 relative w-full border-b transition-colors ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 pr-4">
                    <div
                        className="cursor-pointer hover:bg-gray-100 p-1.5 rounded transition-colors group/menu relative"
                        onClick={() => toggleGroupCollapse(group.id)}
                    >
                        <svg className={`w-4 h-4 text-gray-400 group-hover/menu:text-blue-500 transition-transform ${collapsedGroups.has(group.id) ? '-rotate-90' : 'rotate-0'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                    <input
                        value={group.title}
                        onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                        className={`text-xl font-bold bg-transparent border border-transparent rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 w-full max-w-md transition-all ${darkMode ? 'hover:border-gray-700 focus:bg-[#0f1115]' : 'hover:border-gray-300 focus:bg-white'}`}
                        style={{ color: group.color }}
                    />
                    <div className="ml-4 flex items-center gap-2">
                        <div className="flex h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                            {(['todo', 'pending', 'working', 'almostFinish', 'done', 'stuck'] as const).map(key => {
                                const pct = progress.total === 0 ? 0 : (progress.counts as any)[key] / progress.total * 100;
                                if (pct <= 0) return null;
                                const color = key === 'todo' ? statusColorMap[Status.ToDo]
                                    : key === 'pending' ? statusColorMap[Status.Pending]
                                        : key === 'working' ? statusColorMap[Status.WorkingOnIt]
                                            : key === 'almostFinish' ? statusColorMap[Status.AlmostFinish]
                                                : key === 'done' ? statusColorMap[Status.Done]
                                                    : statusColorMap[Status.Stuck];
                                return <div key={key} className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />;
                            })}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{Math.round(progress.weighted)}%</span>
                    </div>

                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-1 px-2">
                    <button
                        onClick={() => toggleGroupPin(group.id)}
                        className={"p-2 transition-colors rounded-md " + (group.isPinned ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100')}
                        title={group.isPinned ? "Unpin Group" : "Pin Group"}
                    >
                        <Pin className={"w-4 h-4 " + (group.isPinned ? 'fill-current' : '')} />
                    </button>

                    {/* Send to Reminder Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowReminderModalGroupId(group.id);
                        }}
                        className="p-2 transition-colors rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                        title="Send to Reminders"
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                    {/* Send to Goals Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowGoalsModalGroupId(group.id);
                        }}
                        className="p-2 transition-colors rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                        title="Send to Goals"
                    >
                        <Target className="w-4 h-4" />
                    </button>

                    {/* Send to Tasks Board Button - Only show if NOT main board */}
                    {!isMainBoard && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowListBoardModalGroupId(group.id);
                            }}
                            className="p-2 transition-colors rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                            title="Send to List Board"
                        >
                            <ListTodo className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => handleDeleteGroupClick(group.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors hover:bg-red-50 rounded-md" title="Delete Group">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            {!collapsedGroups.has(group.id) && (
                <div className="overflow-x-auto w-full [&::-webkit-scrollbar]:hidden">

                    {/* Columns Header */}
                    <div className={`sticky top-0 z-[1] min-w-full w-fit transition-colors ${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`} style={{ boxShadow: '0 2px 5px -2px rgba(0,0,0,0.05)' }}>
                        <div className={`grid gap-0 border-y text-xs font-normal transition-colors ${darkMode ? 'bg-gray-800 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`} style={{ gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth }}>
                            <div className={`flex items-center justify-center sticky left-0 z-20 border-r-2 transition-colors ${darkMode ? 'bg-[#1a1d24]/95 border-r-gray-800' : 'bg-gray-50/80 border-r-gray-200/50'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300"
                                    checked={allSelected}
                                    ref={el => {
                                        if (el) el.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={(e) => toggleGroupSelection(group.id, e.target.checked)}
                                />
                            </div>
                            {group.columns.map((col, index) => (
                                <div
                                    key={col.id}
                                    className={`relative group backdrop-blur-sm transition-colors ${col.type === 'name' ? `sticky left-[50px] z-20 border-r-2 ${darkMode ? 'border-r-gray-800' : 'border-r-gray-200/50'}` : 'cursor-grab active:cursor-grabbing'} ${darkMode ? 'bg-[#1a1d24]/95 hover:bg-white/5' : 'bg-gray-50/80 hover:bg-gray-100'}`}
                                    onContextMenu={(e) => handleContextMenu(e, group.id, col.id)}
                                    draggable={col.type !== 'name'}
                                    onDragStart={(e) => handleColumnDragStart(e, group.id, col.id, index)}
                                    onDragOver={(e) => handleColumnDragOver(e, index)}
                                    onDrop={(e) => handleColumnDrop(e, group.id, index)}
                                >
                                    <div className="flex items-center justify-between h-full">
                                        <input
                                            value={col.title}
                                            onChange={(e) => updateColumnTitle(group.id, col.id, e.target.value)}
                                            className={`w-full h-full bg-transparent px-3 py-2 text-center text-[11px] focus:outline-none border-b-2 border-transparent focus:border-blue-500 ${darkMode ? 'focus:bg-[#0f1115] focus:text-white text-gray-300' : 'focus:bg-white focus:text-gray-800'}`}
                                            style={{ textAlign: (col.type === 'name' || col.type === 'long_text') ? 'left' : 'center' }}
                                        />
                                        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 hover:bg-gray-200 rounded"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setActiveColumnMenu(activeColumnMenu?.groupId === group.id ? null : { groupId: group.id, rect });
                                            }}
                                        >
                                            <MoreHorizontal size={14} className="text-gray-400" />
                                        </div>
                                        {/* Resize Handle */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400/50 z-30"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                const currentWidth = parseInt(col.width.replace('px', '')) || 140;
                                                setResizingCol({
                                                    groupId: group.id,
                                                    colId: col.id,
                                                    startX: e.clientX,
                                                    startWidth: currentWidth
                                                });
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            ))}
                            {/* Add Column Button Cell */}
                            <div className={`flex items-center justify-center relative group ${darkMode ? 'bg-[#1a1d24]/95' : 'bg-gray-50/80'}`}>
                                <div
                                    className={"cursor-pointer w-6 h-6 rounded flex items-center justify-center transition-all duration-200 " + (activeColumnMenu?.groupId === group.id ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/50')}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setActiveColumnMenu(activeColumnMenu?.groupId === group.id ? null : { groupId: group.id, rect });
                                    }}
                                    title="Add Column"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks List with Drag & Drop */}
                    <div className={`divide-y relative z-0 min-w-full w-fit ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                        <SortableContext
                            items={filteredTasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {filteredTasks.map((task) => (
                                <SortableTaskRow
                                    key={task.id}
                                    task={task}
                                    group={group}
                                    selectionColumnWidth={selectionColumnWidth}
                                    actionColumnWidth={actionColumnWidth}
                                    expandedTaskIds={expandedTaskIds}
                                    toggleTaskSelection={toggleTaskSelection}
                                    updateTask={updateTask}
                                    deleteTask={() => handleDeleteTaskClick(group.id, task.id)}
                                    updateTaskTextValue={updateTaskTextValue}
                                    toggleSubtask={toggleSubtask}
                                    setActiveDatePicker={setActiveDatePicker}
                                    handleContextMenu={handleContextMenu}
                                    handleAddSubtask={handleAddSubtask}
                                    subtaskInput={subtaskInput}
                                    setSubtaskInput={setSubtaskInput}
                                    darkMode={darkMode}
                                    setActiveConnectionMenu={setActiveConnectionMenu}
                                />
                            ))}
                        </SortableContext>
                    </div>

                    {/* Add Task Bar */}
                    <div className={`grid gap-0 border-t group/add-row transition-colors min-w-full w-fit ${darkMode ? 'bg-[#1a1d24] border-gray-800 hover:bg-white/5' : 'bg-white border-gray-200 hover:bg-gray-50'}`} style={{ gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth }}>
                        <div className={`flex items-center justify-center border-r sticky left-0 z-10 border-r-2 transition-colors relative ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800 group-hover/add-row:bg-white/5' : 'bg-white border-gray-100 border-r-gray-200/50 group-hover/add-row:bg-gray-50'}`}>
                            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: group.color }}></div>
                            <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center text-gray-300">
                                <PlusIcon size={10} />
                            </div>
                        </div>
                        <div className={`flex items-center pl-2 py-2 border-r sticky left-[50px] z-10 border-r-2 transition-colors ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800 group-hover/add-row:bg-white/5' : 'bg-white border-gray-100 border-r-gray-200/50 group-hover/add-row:bg-gray-50'}`}>
                            <input
                                type="text"
                                placeholder="+ Add item"
                                value={draftTasks[group.id]?.name || ''}
                                onChange={(e) => updateDraftTask(group.id, { name: e.target.value })}
                                className={`w-full bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 ${darkMode ? 'placeholder-gray-600 text-gray-200' : 'placeholder-gray-400 text-gray-700'}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!e.repeat) {
                                            handleAddTask(group.id);
                                        }
                                    }
                                }}
                            />
                        </div>
                        {group.columns.slice(1).map(col => (
                            <div key={col.id} className={`border-r min-h-[32px] flex items-center justify-center ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-100'}`}>
                                {col.type === 'status' ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <StatusCell
                                            status={col.id === 'col_status' ? (draftTasks[group.id]?.status || Status.ToDo) : (draftTasks[group.id]?.textValues?.[col.id] as Status || Status.ToDo)}
                                            onChange={(s) => {
                                                if (col.id === 'col_status') {
                                                    updateDraftTask(group.id, { status: s });
                                                } else {
                                                    updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: s } });
                                                }
                                            }}
                                            tabIndex={0}
                                            darkMode={darkMode}
                                        />
                                    </div>
                                ) : col.type === 'priority' ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <PriorityCell
                                            priority={col.id === 'col_priority' ? (draftTasks[group.id]?.priority || Priority.Normal) : (draftTasks[group.id]?.textValues?.[col.id] as Priority || Priority.Normal)}
                                            onChange={(p) => {
                                                if (col.id === 'col_priority') {
                                                    updateDraftTask(group.id, { priority: p });
                                                } else {
                                                    updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: p } });
                                                }
                                            }}
                                            tabIndex={0}
                                            darkMode={darkMode}
                                        />
                                    </div>
                                ) : col.type === 'person' ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <PersonCell
                                            personId={col.id === 'col_person' ? (draftTasks[group.id]?.personId || null) : (draftTasks[group.id]?.textValues?.[col.id] || null)}
                                            onChange={(pid) => {
                                                if (col.id === 'col_person') {
                                                    updateDraftTask(group.id, { personId: pid });
                                                } else {
                                                    updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: pid || '' } });
                                                }
                                            }}
                                            tabIndex={0}
                                            darkMode={darkMode}
                                        />
                                    </div>
                                ) : col.type === 'button' ? (
                                    <div className="w-full h-full p-1">
                                        <button className="w-full h-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors flex items-center justify-center">
                                            Action
                                        </button>
                                    </div>
                                ) : col.type === 'connection' ? (
                                    <div className="w-full h-full p-1 flex items-center justify-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setActiveConnectionMenu({
                                                    groupId: group.id,
                                                    taskId: 'DRAFT_TASK', // Placeholder, handled in menu if needed
                                                    colId: col.id,
                                                    rect,
                                                    config: col.config
                                                });
                                            }}
                                            className={`w-full h-full text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5 px-2 group/btn ${col.config?.targetPath ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200'}`}
                                        >
                                            <Link2 size={12} className="group-hover/btn:scale-110 transition-transform" />
                                            <span className="truncate">{col.config?.targetName ? `Go to ${col.config.targetName}` : 'Connect'}</span>
                                        </button>
                                    </div>
                                ) : col.type === 'date' ? (
                                    <div className="w-full h-full relative flex items-center justify-center">
                                        <div
                                            className={`text-xs cursor-pointer font-medium px-2 py-1 rounded transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const isPrimary = col.id === 'col_date';
                                                const currentValue = isPrimary ? (draftTasks[group.id]?.dueDate || '') : (draftTasks[group.id]?.textValues?.[col.id] || '');
                                                setActiveDatePicker({
                                                    taskId: 'draft-' + group.id,
                                                    colId: col.id,
                                                    date: currentValue,
                                                    rect,
                                                    onSelect: (dateStr: string) => {
                                                        if (isPrimary) {
                                                            updateDraftTask(group.id, { dueDate: dateStr });
                                                        } else {
                                                            updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: dateStr } });
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
                                                    const currentValue = isPrimary ? (draftTasks[group.id]?.dueDate || '') : (draftTasks[group.id]?.textValues?.[col.id] || '');
                                                    setActiveDatePicker({
                                                        taskId: 'draft-' + group.id,
                                                        colId: col.id,
                                                        date: currentValue,
                                                        rect,
                                                        onSelect: (dateStr: string) => {
                                                            if (isPrimary) {
                                                                updateDraftTask(group.id, { dueDate: dateStr });
                                                            } else {
                                                                updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: dateStr } });
                                                            }
                                                        }
                                                    });
                                                }
                                            }}
                                        >
                                            {(() => {
                                                const isPrimary = col.id === 'col_date';
                                                const val = isPrimary ? draftTasks[group.id]?.dueDate : draftTasks[group.id]?.textValues?.[col.id];
                                                return val ? new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : <span className="text-gray-300">Set Date</span>;
                                            })()}
                                        </div>
                                    </div>
                                ) : col.type === 'text' ? (
                                    <input
                                        type="text"
                                        value={draftTasks[group.id]?.textValues?.[col.id] || ''}
                                        onChange={(e) => updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: e.target.value } })}
                                        className="w-full h-full text-center px-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-600"
                                        placeholder="-"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!e.repeat) {
                                                    handleAddTask(group.id);
                                                }
                                            }
                                        }}
                                    />
                                ) : col.type === 'number' ? (
                                    <input
                                        type="text"
                                        value={draftTasks[group.id]?.textValues?.[col.id] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^[0-9.,]*$/.test(val)) {
                                                updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: val } });
                                            }
                                        }}
                                        className="w-full h-full text-center px-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-600 font-mono text-xs"
                                        placeholder="0"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(group.id)}
                                    />
                                ) : (
                                    <div className="w-full h-full"></div>
                                )}
                            </div>
                        ))}
                        <div className={`transition-colors ${darkMode ? 'bg-[#1a1d24] group-hover/add-row:bg-white/5' : 'bg-white group-hover/add-row:bg-gray-50'}`}></div>
                    </div>



                    {/* Group Summary Footer */}
                    <div className={`grid gap-0 border-t rounded-b-xl min-w-full w-fit ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-200'}`} style={{ gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth }}>
                        <div className={`flex items-center justify-center border-r sticky left-0 z-10 border-r-2 ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800' : 'bg-white border-gray-100 border-r-gray-200/50'}`}></div>
                        <div className={`flex items-center justify-center sticky left-[50px] z-10 border-t ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-200'}`}>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"></span>
                        </div>
                        {group.columns.slice(1).map(col => (
                            <div key={col.id} className={`border-r min-h-[32px] flex items-center justify-center px-2 ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-100'}`}>
                                {col.type === 'status' && (
                                    <div className="w-full h-4 flex rounded-sm overflow-hidden">
                                        {Object.values(Status).map(s => {
                                            const count = filteredTasks.filter(t => resolveTaskStatus(group, t) === s).length;
                                            if (count === 0) return null;
                                            const width = (count / Math.max(filteredTasks.length, 1)) * 100;
                                            return (
                                                <div key={s} style={{ width: width + "%" }} title={s + ": " + count} className={STATUS_COLORS[s] + " h-full hover:opacity-80 transition-opacity"} />
                                            );
                                        })}
                                    </div>
                                )}
                                {col.type === 'priority' && (
                                    <div className="w-full h-4 flex rounded-sm overflow-hidden">
                                        {Object.values(Priority).map(p => {
                                            const count = group.tasks.filter(t => {
                                                const val = col.id === 'col_priority' ? t.priority : (t.textValues[col.id] as Priority);
                                                return val === p;
                                            }).length;
                                            if (count === 0) return null;
                                            const width = (count / group.tasks.length) * 100;
                                            return (
                                                <div key={p} style={{ width: width + "%" }} title={p + ": " + count} className={PRIORITY_COLORS[p] + " h-full hover:opacity-80 transition-opacity"} />
                                            );
                                        })}
                                    </div>
                                )}
                                {col.type === 'person' && (
                                    (() => {
                                        const assignedCount = group.tasks.filter(t => {
                                            const val = col.id === 'col_owner' ? t.personId : t.textValues[col.id];
                                            return val && val.length > 0;
                                        }).length;
                                        if (assignedCount === 0) return null;
                                        return (
                                            <div className="flex flex-col items-center justify-center leading-none">
                                                <span className="text-sm text-gray-500 font-medium">{assignedCount}</span>
                                                <span className="text-[10px] text-gray-400">owners</span>
                                            </div>
                                        );
                                    })()
                                )}
                                {col.type === 'money' && (
                                    (() => {
                                        const sum = group.tasks.reduce((acc, t) => {
                                            const val = t.textValues[col.id]?.replace(/,/g, '');
                                            return acc + (Number(val) || 0);
                                        }, 0);
                                        return (
                                            <div className="flex flex-col items-center justify-center leading-none">
                                                <span className="text-xs text-gray-700 font-bold font-mono">
                                                    {(col.currency || '$')} {sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] text-gray-400">sum</span>
                                            </div>
                                        );
                                    })()
                                )}
                                {col.type === 'checkbox' && (
                                    (() => {
                                        const count = group.tasks.filter(t => t.textValues[col.id] === 'true').length;
                                        if (count === 0) return null;
                                        return (
                                            <div className="flex flex-col items-center justify-center leading-none">
                                                <span className="text-xs text-gray-700 font-bold font-mono">{count}</span>
                                                <span className="text-[10px] text-gray-400">checked</span>
                                            </div>
                                        );
                                    })()
                                )}
                                {col.type === 'number' && (
                                    (() => {
                                        const sum = group.tasks.reduce((acc, t) => {
                                            const val = t.textValues[col.id]?.replace(/,/g, '');
                                            return acc + (Number(val) || 0);
                                        }, 0);
                                        return (
                                            <div className="flex flex-col items-center justify-center leading-none">
                                                <span className="text-xs text-gray-700 font-bold font-mono">{sum.toLocaleString()}</span>
                                                <span className="text-[10px] text-gray-400">sum</span>
                                            </div>
                                        );
                                    })()
                                )}
                                {(col.type === 'text' || col.type === 'long_text' || col.type === 'date' || col.type === 'dropdown' || col.type === 'name') && (
                                    (() => {
                                        const count = group.tasks.filter(t => {
                                            if (col.type === 'name') return true; // Always count for name
                                            const val = t.textValues[col.id];
                                            return val && val.trim().length > 0;
                                        }).length;
                                        if (count === 0) return null;
                                        return (
                                            <div className="flex flex-col items-center justify-center leading-none">
                                                <span className="text-xs text-gray-700 font-bold font-mono">{count}</span>
                                                <span className="text-[10px] text-gray-400">count</span>
                                            </div>
                                        );
                                    })()
                                )}
                            </div>
                        ))}
                        <div className={`${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`}></div>
                    </div>
                </div>
            )}
        </div>
    );
});
