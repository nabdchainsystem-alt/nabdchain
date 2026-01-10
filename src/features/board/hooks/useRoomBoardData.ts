import { useState, useCallback, useEffect, useRef } from 'react';
import { IBoard, IGroup, ITask, Status, Priority } from '../types/boardTypes';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_BOARD: IBoard = {
    id: 'default-board',
    name: 'Main Board',
    groups: [
        {
            id: 'To Do',
            title: 'To Do',
            color: '#579bfc',
            tasks: [
                {
                    id: 't1',
                    name: 'need to define',
                    status: Status.Working,
                    priority: Priority.High,
                    personId: '1',
                    dueDate: '',
                    textValues: {},
                    selected: false
                },
                {
                    id: 't2',
                    name: 'max 1',
                    status: Status.Working,
                    priority: Priority.Medium,
                    personId: '1',
                    dueDate: '',
                    textValues: {},
                    selected: false
                }
            ],
            columns: [
                { id: 'col_name', title: 'Item', type: 'name', width: 380 },
                { id: 'col_owner', title: 'Person', type: 'person', width: 100 },
                { id: 'col_status', title: 'Status', type: 'status', width: 140 },
                { id: 'col_date', title: 'Date', type: 'date', width: 120 }
            ],
            isPinned: false
        }
    ]
};

import { Board } from '../../../types';

export const useRoomBoardData = (storageKey: string, initialBoardData?: IBoard | Board, onSave?: (board: IBoard) => void) => {
    // Namespaced key for this specific board's data
    const persistenceKey = `room-board-data-v2-${storageKey}`;

    const [board, setBoard] = useState<IBoard>(() => {
        // ... (existing initialization logic)
        if (initialBoardData) {
            if ('groups' in initialBoardData && (initialBoardData as IBoard).groups) {
                return initialBoardData as IBoard;
            }
            const flatBoard = initialBoardData as Board;
            return {
                id: flatBoard.id,
                name: flatBoard.name,
                description: flatBoard.description,
                availableViews: flatBoard.availableViews,
                pinnedViews: flatBoard.pinnedViews,
                defaultView: flatBoard.defaultView,
                groups: [{
                    id: 'default-group',
                    title: 'Tasks',
                    color: '#579bff',
                    tasks: (Array.isArray(flatBoard.tasks) ? flatBoard.tasks : []).map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        status: t.status as Status,
                        priority: t.priority as Priority,
                        personId: t.person,
                        dueDate: t.date,
                        textValues: {},
                        selected: false,
                        ...t
                    })),
                    columns: flatBoard.columns as any[],
                    isPinned: false
                }]
            };
        }
        try {
            const saved = localStorage.getItem(persistenceKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.id) return parsed;
            }
        } catch (e) { }
        return INITIAL_BOARD;
    });

    // Ref to track if the last update was from props (external)
    const isExternalUpdate = useRef(false);

    // Persist board state whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(persistenceKey, JSON.stringify(board));

            // CRITICAL: Only call onSave if it wasn't an external update from props
            // to break infinite loop cycles.
            if (onSave && !isExternalUpdate.current) {
                onSave(board);
            }

            // Reset for next update
            isExternalUpdate.current = false;
        } catch (e) {
            console.error('Failed to save board data', e);
        }
    }, [board, persistenceKey, onSave]);

    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    // Sync state when initialBoardData changes (e.g. from parent component updates)
    // IMPORTANT: We must be careful not to overwrite local unsaved changes with stale server data 
    // if we are treating localStorage as the "source of truth" for client-side edits.
    // However, if the parent pushes a NEW board ID, we must switch.
    useEffect(() => {
        if (!initialBoardData) return;

        setBoard(prev => {
            // If the board ID changed, we absolutely must switch to the new data 
            if (prev.id !== initialBoardData.id) {
                isExternalUpdate.current = true;
                if ('groups' in initialBoardData && (initialBoardData as IBoard).groups) {
                    return initialBoardData as IBoard;
                } else {
                    const flatBoard = initialBoardData as Board;
                    return {
                        id: flatBoard.id,
                        name: flatBoard.name,
                        description: flatBoard.description,
                        availableViews: flatBoard.availableViews,
                        pinnedViews: flatBoard.pinnedViews,
                        defaultView: flatBoard.defaultView,
                        groups: [{
                            id: 'default-group',
                            title: 'Tasks',
                            color: '#579bff',
                            tasks: (Array.isArray(flatBoard.tasks) ? flatBoard.tasks : []).map(t => ({
                                id: t.id,
                                name: t.name,
                                status: t.status as Status,
                                priority: t.priority as Priority,
                                personId: t.person,
                                dueDate: t.date,
                                textValues: {},
                                selected: false
                            })),
                            columns: flatBoard.columns as any[],
                            isPinned: false
                        }]
                    };
                }
            }

            // If ID is the same, verify if metadata changed (e.g. added a view)
            const flat = initialBoardData as Board;
            // Simple validation to check if we received a flat Board update from parent
            if (!('groups' in flat)) {
                if (
                    JSON.stringify(prev.availableViews) !== JSON.stringify(flat.availableViews) ||
                    JSON.stringify(prev.pinnedViews) !== JSON.stringify(flat.pinnedViews) ||
                    prev.defaultView !== flat.defaultView ||
                    prev.name !== flat.name ||
                    prev.description !== flat.description
                ) {
                    isExternalUpdate.current = true;
                    return {
                        ...prev,
                        availableViews: flat.availableViews,
                        pinnedViews: flat.pinnedViews,
                        defaultView: flat.defaultView,
                        name: flat.name,
                        description: flat.description
                    };
                }
            }

            return prev;
        });
    }, [initialBoardData]); // Re-run when prop object changes
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');

    // Task Actions
    const addTask = useCallback((groupId: string, name: string = 'New Task', defaults?: Partial<ITask>) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        tasks: [...g.tasks, {
                            id: uuidv4(),
                            name,
                            status: Status.New,
                            priority: Priority.Normal,
                            personId: null,
                            dueDate: '',
                            textValues: {},
                            selected: false,
                            ...defaults
                        }]
                    };
                }
                return g;
            })
        }));
    }, []);

    const updateTask = useCallback((groupId: string, taskId: string, updates: Partial<ITask>) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        tasks: g.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
                    };
                }
                return g;
            })
        }));
    }, []);

    const deleteTask = useCallback((groupId: string, taskId: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g)
        }));
    }, []);

    const toggleTaskSelection = useCallback((groupId: string, taskId: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        tasks: g.tasks.map(t => t.id === taskId ? { ...t, selected: !t.selected } : t)
                    };
                }
                return g;
            })
        }));
    }, []);

    const updateTaskTextValue = useCallback((groupId: string, taskId: string, colId: string, value: string) => {
        updateTask(groupId, taskId, { textValues: { [colId]: value } }); // Simplified - should merge textValues
    }, [updateTask]);


    // Group Actions
    const addGroup = useCallback(() => {
        setBoard(prev => ({
            ...prev,
            groups: [...prev.groups, {
                id: uuidv4(),
                title: 'New Group',
                color: '#579bfc',
                tasks: [],
                columns: [],
                isPinned: false
            }]
        }));
    }, []);

    const deleteGroup = useCallback((groupId: string) => {
        setBoard(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== groupId) }));
    }, []);

    const updateGroupTitle = useCallback((groupId: string, title: string) => {
        setBoard(prev => ({ ...prev, groups: prev.groups.map(g => g.id === groupId ? { ...g, title } : g) }));
    }, []);

    const toggleGroupPin = useCallback((groupId: string) => {
        setBoard(prev => ({ ...prev, groups: prev.groups.map(g => g.id === groupId ? { ...g, isPinned: !g.isPinned } : g) }));
    }, []);

    const toggleGroupSelection = useCallback((groupId: string, selected: boolean) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (groupId === 'all' || g.id === groupId) {
                    return { ...g, tasks: g.tasks.map(t => ({ ...t, selected })) };
                }
                return g;
            })
        }));
    }, []);



    // Move Task within Group
    const moveTask = useCallback((groupId: string, activeId: string, overIndex: number) => {
        setBoard(prev => {
            const newGroups = prev.groups.map(g => {
                if (g.id !== groupId) return g;
                const oldIndex = g.tasks.findIndex(t => t.id === activeId);
                if (oldIndex === -1) return g;
                const newTasks = [...g.tasks];
                const [moved] = newTasks.splice(oldIndex, 1);
                newTasks.splice(overIndex, 0, moved);
                return { ...g, tasks: newTasks };
            });
            return { ...prev, groups: newGroups };
        });
    }, []);

    // Move Task to different Group
    const moveTaskToGroup = useCallback((sourceGroupId: string, targetGroupId: string, taskId: string, newIndex: number) => {
        setBoard(prev => {
            const sourceGroup = prev.groups.find(g => g.id === sourceGroupId);
            const targetGroup = prev.groups.find(g => g.id === targetGroupId);
            if (!sourceGroup || !targetGroup) return prev;

            const task = sourceGroup.tasks.find(t => t.id === taskId);
            if (!task) return prev;

            const newSourceTasks = sourceGroup.tasks.filter(t => t.id !== taskId);
            const newTargetTasks = [...targetGroup.tasks];
            newTargetTasks.splice(newIndex, 0, task);

            return {
                ...prev,
                groups: prev.groups.map(g => {
                    if (g.id === sourceGroupId) return { ...g, tasks: newSourceTasks };
                    if (g.id === targetGroupId) return { ...g, tasks: newTargetTasks };
                    return g;
                })
            };
        });
    }, []);

    // Column Actions (Mocked)
    const addColumn = useCallback(() => { }, []);
    const updateColumn = useCallback(() => { }, []);
    const deleteColumn = useCallback(() => { }, []);
    const updateColumnTitle = useCallback(() => { }, []);
    const duplicateColumn = useCallback(() => { }, []);
    const moveColumn = useCallback(() => { }, []);
    const reorderColumn = useCallback(() => { }, []);
    const updateColumnWidth = useCallback(() => { }, []);

    // AI Handlers (Mocked)
    const handleGeneratePlan = useCallback(() => { }, []);
    const handleAnalyzeBoard = useCallback(() => { }, []);

    // Flatten tasks from all groups for views that need a flat list
    const tasks = board.groups.flatMap(g => g.tasks);

    // Update tasks from a flat list (reconcile with groups)
    const onUpdateTasks = useCallback((updatedTasks: any[]) => {
        setBoard(prev => {
            // Create a map for faster lookup of updated task data
            const updatedTaskMap = new Map(updatedTasks.map(t => [t.id, t]));

            const newGroups = prev.groups.map(g => {
                // 1. Identify tasks that currently belong to this group
                const currentGroupTaskIds = new Set(g.tasks.map(t => t.id));

                // 2. Reconstruct the group's tasks based on the ORDER in updatedTasks.
                // We filter updatedTasks to find those that belong to this group.
                // This preserves the new sort order delivered by the UI.
                const newGroupTasks = updatedTasks
                    .filter(t => currentGroupTaskIds.has(t.id))
                    .map(t => {
                        // Merge with original to ensure we don't lose properties not present in the flat view
                        // though updatedTasks usually comes from the view which has the full object.
                        // But we safely merge just in case.
                        // Find the *original* task object to preserve hidden props if any, 
                        // but prioritize 't' (the update).
                        const original = g.tasks.find(ot => ot.id === t.id);
                        return { ...(original || {}), ...t };
                    });

                // 3. If there are tasks in the group that are NOT in updatedTasks 
                // (e.g. if the view was filtered), we should append them at the end 
                // so they are not lost.
                const tasksNotInUpdate = g.tasks.filter(t => !updatedTaskMap.has(t.id));

                return { ...g, tasks: [...newGroupTasks, ...tasksNotInUpdate] };
            });

            // 3. Handle New Tasks (remaining in map that were NOT in any group)
            // If there are tasks in updatedTasks that weren't in any group, add them to the first group
            // We need to check which IDs were processed
            const allProcessedIds = new Set(newGroups.flatMap(g => g.tasks.map(t => t.id)));
            const newTasksToAdd: ITask[] = [];

            updatedTasks.forEach(task => {
                if (!allProcessedIds.has(task.id)) {
                    newTasksToAdd.push({
                        id: task.id || uuidv4(),
                        name: task.name || 'New Task',
                        status: task.status || Status.New,
                        priority: task.priority || Priority.Normal,
                        personId: task.personId || null,
                        dueDate: task.dueDate || '',
                        textValues: task.textValues || {},
                        selected: false,
                        ...task
                    });
                }
            });

            if (newTasksToAdd.length > 0 && newGroups.length > 0) {
                newGroups[0].tasks = [...newGroups[0].tasks, ...newTasksToAdd];
            }

            return { ...prev, groups: newGroups };
        });
    }, []);

    return {
        board,
        setBoard,
        tasks, // Export flattened tasks
        onUpdateTasks, // Export update handler
        aiPrompt,
        setAiPrompt,
        isAiLoading,
        aiAnalysis,
        setAiAnalysis,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskSelection,
        toggleGroupSelection,
        moveTask,
        moveTaskToGroup,
        updateTaskTextValue,
        addGroup,
        deleteGroup,
        updateGroupTitle,
        toggleGroupPin,
        addColumn,
        updateColumn,
        deleteColumn,
        updateColumnTitle,
        duplicateColumn,
        moveColumn,
        reorderColumn,
        updateColumnWidth,
        handleGeneratePlan,
        handleAnalyzeBoard
    };
};
