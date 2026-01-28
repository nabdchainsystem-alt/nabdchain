import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { GroupContainer } from './components/GroupContainer';
import { TaskRow } from './components/TaskRow';
import { GroupData, Status, StatusOption, TaskItem, ColumnWidths } from './types';
import { boardLogger } from '../../../../utils/logger';

interface ListBoardProps {
    roomId: string; // Changed to require roomId for sync
    viewId?: string;
}

const ListBoard: React.FC<ListBoardProps> = ({ roomId, viewId }) => {
    // Shared Storage Keys
    const isSharedView = !viewId || viewId === 'list_board' || viewId === 'list-main' || viewId === 'list';
    const storageKeyTasks = !isSharedView ? `board-tasks-${roomId}-${viewId}` : `board-tasks-${roomId}`;
    const storageKeyStatuses = `board-statuses-${roomId}`;

    // State
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]); // New State
    const [colWidths, setColWidths] = useState<ColumnWidths>({
        person: 100,
        status: 150,
        date: 130
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<TaskItem | null>(null);
    const [activeGroupColor, setActiveGroupColor] = useState<string>('#ccc');

    // --- Load Data from Shared Storage ---
    useEffect(() => {
        const loadData = () => {
            try {
                const mainGroup: GroupData = {
                    id: 'main-group',
                    title: 'Items',
                    color: '#4e8be3', // Monday-like blue (10% darker)
                    items: []
                };

                // 2. Load Tasks (Rows)
                const savedTasks = localStorage.getItem(storageKeyTasks);
                if (savedTasks) {
                    const rows = JSON.parse(savedTasks);
                    if (Array.isArray(rows)) {
                        rows.forEach((row: any) => {
                            // Map Row -> TaskItem
                            const item: TaskItem = {
                                id: row.id,
                                name: row.name || 'Untitled',
                                person: row.assignees?.[0] || null, // Sync Assignee/Person
                                status: row.statusId || row.status, // Store raw status string
                                date: row.dueDate || '',
                                selected: false
                            };
                            mainGroup.items.push(item);
                        });
                    }
                }

                // Load Status Definitions for Picker
                const savedStatuses = localStorage.getItem(storageKeyStatuses);
                let loadedOptions: StatusOption[] = [];

                if (savedStatuses) {
                    const parsed = JSON.parse(savedStatuses);
                    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
                        // Convert string statuses to Options
                        loadedOptions = parsed.map((s: string) => {
                            const lower = s.toLowerCase();
                            let color = '#94a3b8'; // Default slate
                            if (lower.includes('done') || lower.includes('complete')) color = '#22c55e';
                            else if (lower.includes('progress') || lower.includes('working')) color = '#3b82f6';
                            else if (lower.includes('stuck') || lower.includes('error')) color = '#ef4444';
                            else if (lower.includes('review')) color = '#a855f7';
                            else if (lower.includes('hold') || lower.includes('wait')) color = '#eab308';

                            return { id: s, label: s, color: color };
                        });
                    } else if (Array.isArray(parsed) && typeof parsed[0] === 'object') {
                        // Standard shared format (10% darker colors)
                        loadedOptions = parsed.map((s: any) => {
                            let color = s.color || '#aeaeae';
                            // Normalize color names to Hex if not hex
                            if (!color.startsWith('#')) {
                                const lower = color.toLowerCase();
                                if (lower.includes('blue')) color = '#4e8be3';
                                else if (lower.includes('green') || lower.includes('emerald')) color = '#00b369';
                                else if (lower.includes('red') || lower.includes('rose')) color = '#cb3d52';
                                else if (lower.includes('yellow') || lower.includes('orange') || lower.includes('amber')) color = '#e59935';
                                else if (lower.includes('purple') || lower.includes('violet')) color = '#9154c6';
                                else if (lower.includes('gray') || lower.includes('slate')) color = '#aeaeae';
                            }
                            return {
                                id: s.id,
                                label: s.label || s.title || s.id,
                                color: color
                            };
                        });
                    }
                }

                // Ensure defaults if nothing (10% darker)
                if (loadedOptions.length === 0) {
                    loadedOptions = [
                        { id: 'To Do', label: 'To Do', color: '#aeaeae' },
                        { id: 'In Progress', label: 'In Progress', color: '#e59935' },
                        { id: 'Done', label: 'Done', color: '#00b369' }
                    ];
                }

                setStatusOptions(loadedOptions);
                setGroups([mainGroup]);

            } catch (e) {
                boardLogger.error('Failed to load ListBoard data', e);
            }
        };

        loadData();
    }, [roomId, storageKeyTasks, storageKeyStatuses]);


    // --- Save Data to Shared Storage ---
    // Helper to persist current groups back to Rows
    const persistData = (currentGroups: GroupData[]) => {
        try {
            // We only have one group, but let's keep it generic enough
            // We do NOT save Status Definitions (Groups) anymore since we are in "Single Group" mode.
            // We ONLY sync the "columns" (rows data).

            const existingRowsString = localStorage.getItem(storageKeyTasks);
            let existingRows: any[] = existingRowsString ? JSON.parse(existingRowsString) : [];
            const existingRowMap = new Map(existingRows.map(r => [r.id, r]));

            const newRows: any[] = [];
            currentGroups.forEach(g => {
                g.items.forEach(item => {
                    const oldRow = existingRowMap.get(item.id) || {};
                    newRows.push({
                        ...oldRow, // Keep extra fields
                        id: item.id,
                        name: item.name,
                        status: item.status, // Status is now just a column value, not a group
                        statusId: item.status,
                        dueDate: item.date,
                        assignees: item.person ? [item.person] : []
                    });
                });
            });

            localStorage.setItem(storageKeyTasks, JSON.stringify(newRows));

        } catch (e) {
            boardLogger.error('Failed to save ListBoard data', e);
        }
    };


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findGroup = (id: string): GroupData | undefined => {
        // With a single group, we just return the first group if it exists and contains the item
        if (groups.length > 0 && groups[0].items.find(i => i.id === id)) {
            return groups[0];
        }
        return undefined;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const id = active.id as string;
        setActiveId(id);

        const group = findGroup(id);
        if (group) {
            const item = group.items.find(i => i.id === id);
            if (item) {
                setActiveItem(item);
                setActiveGroupColor(group.color);
            }
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findGroup(active.id as string);
        const overContainer = findGroup(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Cross-group logic (should happen rarely with 1 group but safe to keep)
        setGroups((prev) => {
            const activeGroupIndex = prev.findIndex(g => g.id === activeContainer.id);
            const overGroupIndex = prev.findIndex(g => g.id === overContainer.id);

            const newGroups = [...prev];
            const activeItems = [...newGroups[activeGroupIndex].items];
            const overItems = [...newGroups[overGroupIndex].items];

            const activeIndex = activeItems.findIndex(i => i.id === active.id);
            const overIndex = overItems.findIndex(i => i.id === overId);

            let newIndex;
            if (overIndex >= 0) {
                newIndex = overIndex + (active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height ? 1 : 0);
            } else {
                newIndex = overItems.length + 1;
            }

            const [movedItem] = activeItems.splice(activeIndex, 1);
            overItems.splice(newIndex, 0, movedItem);

            newGroups[activeGroupIndex] = { ...newGroups[activeGroupIndex], items: activeItems };
            newGroups[overGroupIndex] = { ...newGroups[overGroupIndex], items: overItems };

            return newGroups;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findGroup(active.id as string);
        const overContainer = over ? findGroup(over.id as string) : null;

        if (
            activeContainer &&
            overContainer &&
            activeContainer === overContainer
        ) {
            const activeIndex = activeContainer.items.findIndex((i) => i.id === active.id);
            const overIndex = activeContainer.items.findIndex((i) => i.id === over?.id);

            if (activeIndex !== overIndex) {
                const groupIndex = groups.findIndex(g => g.id === activeContainer.id);
                const newGroups = [...groups];
                newGroups[groupIndex] = {
                    ...newGroups[groupIndex],
                    items: arrayMove(newGroups[groupIndex].items, activeIndex, overIndex)
                };
                setGroups(newGroups);
                // Persist immediately on reorder
                persistData(newGroups);
            }
        } else {
            // Check if we need to persist cross-group move (handled in DragOver, but simple persist here works)
            persistData(groups);
        }

        setActiveId(null);
        setActiveItem(null);
    };

    const handleGroupUpdate = (updatedGroup: GroupData) => {
        const newGroups = groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
        setGroups(newGroups);
        persistData(newGroups);
    };

    // Auto-persist effect (debounced or simple)
    // We add this to ensure any state change (Drag, Edit) saves.
    // Guard against writing empty groups initially?
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        if (groups.length > 0) {
            if (isLoaded) {
                persistData(groups);
            } else {
                setIsLoaded(true);
            }
        }
    }, [groups]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full w-full bg-white text-gray-800 font-sans overflow-hidden">
                {/* Main Content */}
                <div className="flex-grow flex flex-col h-full overflow-hidden relative">

                    {/* Scrollable Content */}
                    <div className="flex-grow overflow-y-auto p-8 bg-white">
                        {groups.map(group => (
                            <GroupContainer
                                key={group.id}
                                group={group}
                                statusOptions={statusOptions}
                                colWidths={colWidths}
                                onColResize={setColWidths}
                                onGroupUpdate={handleGroupUpdate}
                            />
                        ))}


                    </div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeItem ? (
                        <TaskRow
                            item={activeItem}
                            groupColor={activeGroupColor}
                            colWidths={colWidths}
                            onUpdate={() => { }}
                            onDelete={() => { }}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default ListBoard;
