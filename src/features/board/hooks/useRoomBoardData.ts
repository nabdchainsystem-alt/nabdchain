import { useState, useCallback } from 'react';
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

export const useRoomBoardData = (storageKey: string) => {
    const [board, setBoard] = useState<IBoard>(INITIAL_BOARD);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
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

    return {
        board,
        setBoard,
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
