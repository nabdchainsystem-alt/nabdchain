import { useState, useCallback, useEffect } from 'react';
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

export const useRoomBoardData = (storageKey: string, initialBoardData?: IBoard | Board) => {
    // Namespaced key for this specific board's data
    const persistenceKey = `room-board-data-v2-${storageKey}`;

    const [board, setBoard] = useState<IBoard>(() => {
        // 1. Try to load from localStorage first
        try {
            const saved = localStorage.getItem(persistenceKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Simple validation to ensure it has at least an ID
                if (parsed && parsed.id) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load board data from storage', e);
        }

        // 2. Fallback to initialBoardData or default
        if (!initialBoardData) return INITIAL_BOARD;

        // Check if it's already an IBoard (has groups)
        if ('groups' in initialBoardData && (initialBoardData as IBoard).groups) {
            return initialBoardData as IBoard;
        }

        // Convert flat Board to IBoard
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
                tasks: (flatBoard.tasks || []).map(t => ({
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
    });

    // Persist board state whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(persistenceKey, JSON.stringify(board));
        } catch (e) {
            console.error('Failed to save board data', e);
        }
    }, [board, persistenceKey]);

    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    // Sync state when initialBoardData changes (e.g. from parent component updates)
    // IMPORTANT: We must be careful not to overwrite local unsaved changes with stale server data 
    // if we are treating localStorage as the "source of truth" for client-side edits.
    // However, if the parent pushes a NEW board ID, we must switch.
    useEffect(() => {
        if (!initialBoardData) return;

        setBoard(prev => {
            // If the board ID changed, we absolutely must switch to the new data 
            // (which will then be saved to the NEW persistenceKey in the next render cycle)
            if (prev.id !== initialBoardData.id) {
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
                            tasks: (flatBoard.tasks || []).map(t => ({
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

            // If ID is the same, we generally TRUST OUR LOCAL STATE over the prop 
            // because the user might be typing right now. 
            // Only update if specific metadata changed that ISN'T locally managed (like views maybe?)
            // For now, let's keep the local state authoritative to prevent overwriting typing.
            return prev;
        });
    }, [initialBoardData?.id]); // Only re-run if ID changes to avoid constant overwrites
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
            // Create a map for faster lookup
            const updatedTaskMap = new Map(updatedTasks.map(t => [t.id, t]));

            const newGroups = prev.groups.map(g => {
                // 1. Update existing tasks in the group
                let newGroupTasks = g.tasks.map(t => {
                    const updated = updatedTaskMap.get(t.id);
                    if (updated) {
                        // Remove from map to track which ones are handled
                        updatedTaskMap.delete(t.id);
                        return { ...t, ...updated };
                    }
                    return t;
                });

                // 2. Handle deletions:
                // If the view sending updates intends to represent the FULL state, 
                // we might need to remove tasks that are missing.
                // However, updatedTasks might be filtered. 
                // For now, we assume 'onUpdateTasks' acts as "upsert/update" for existing methods.
                // But RoomTable sends the *entire* list of rows it knows about.
                // If we want to support deletion via this method, we need to know if the suppression was intentional.
                // Given the current architecture, let's stick to UPDATING content and ADDING new tasks if they have a group ID (or default).
                // But RoomTable adds new tasks with ID but no group ID.

                return { ...g, tasks: newGroupTasks };
            });

            // 3. Handle New Tasks (remaining in map)
            // If there are tasks in updatedTasks that weren't in any group, add them to the first group
            if (updatedTaskMap.size > 0 && newGroups.length > 0) {
                const newTasksToAdd: ITask[] = [];
                updatedTaskMap.forEach((task) => {
                    // Ensure it looks like a task
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
                });

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
