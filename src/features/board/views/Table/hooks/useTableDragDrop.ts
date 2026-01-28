import React, { useState, useCallback } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { TableGroup, Column, Row } from '../types';

interface UseTableDragDropReturn {
    // Sensors for DnD
    sensors: ReturnType<typeof useSensors>;

    // Row drag state
    activeDragId: string | null;
    setActiveDragId: (id: string | null) => void;

    // Column drag state
    activeColumnDragId: string | null;
    setActiveColumnDragId: (id: string | null) => void;

    // Handlers
    handleRowDragStart: (event: DragStartEvent) => void;
    handleRowDragEnd: (
        event: DragEndEvent,
        tableGroups: TableGroup[],
        setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>,
        onUpdateTasks?: (tasks: Row[]) => void
    ) => void;
    handleColumnDragStart: (event: DragStartEvent) => void;
    handleColumnDragEnd: (
        event: DragEndEvent,
        columns: Column[],
        setColumns: React.Dispatch<React.SetStateAction<Column[]>>
    ) => void;

    // Get dragged item
    getDraggedRow: (tableGroups: TableGroup[]) => Row | undefined;
    getDraggedColumn: (columns: Column[]) => Column | undefined;
}

export function useTableDragDrop(): UseTableDragDropReturn {
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeColumnDragId, setActiveColumnDragId] = useState<string | null>(null);

    // Configure sensors for smooth, responsive dragging
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                // Lower distance for more responsive drag start
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Row drag handlers
    const handleRowDragStart = useCallback((event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    }, []);

    const handleRowDragEnd = useCallback((
        event: DragEndEvent,
        tableGroups: TableGroup[],
        setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>,
        onUpdateTasks?: (tasks: Row[]) => void
    ) => {
        setActiveDragId(null);

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Find source and destination
        let sourceGroupIndex = -1;
        let sourceRowIndex = -1;
        let destGroupIndex = -1;
        let destRowIndex = -1;

        tableGroups.forEach((group, gIdx) => {
            const srcIdx = group.rows.findIndex(r => r.id === active.id);
            if (srcIdx !== -1) {
                sourceGroupIndex = gIdx;
                sourceRowIndex = srcIdx;
            }
            const dstIdx = group.rows.findIndex(r => r.id === over.id);
            if (dstIdx !== -1) {
                destGroupIndex = gIdx;
                destRowIndex = dstIdx;
            }
        });

        if (sourceGroupIndex === -1) return;

        // Same group reorder
        if (sourceGroupIndex === destGroupIndex && destGroupIndex !== -1) {
            setTableGroups(prev => {
                const newGroups = [...prev];
                const group = { ...newGroups[sourceGroupIndex] };
                group.rows = arrayMove(group.rows, sourceRowIndex, destRowIndex);
                newGroups[sourceGroupIndex] = group;

                // Notify parent if callback exists
                if (onUpdateTasks) {
                    const allTasks = newGroups.flatMap(g => g.rows);
                    onUpdateTasks(allTasks);
                }

                return newGroups;
            });
        }
        // Cross-group move
        else if (destGroupIndex !== -1 && destGroupIndex !== sourceGroupIndex) {
            setTableGroups(prev => {
                const newGroups = [...prev];
                const sourceGroup = { ...newGroups[sourceGroupIndex] };
                const destGroup = { ...newGroups[destGroupIndex] };

                // Remove from source
                const [movedRow] = sourceGroup.rows.splice(sourceRowIndex, 1);
                // Update groupId
                movedRow.groupId = destGroup.id;
                // Insert at destination
                destGroup.rows.splice(destRowIndex, 0, movedRow);

                newGroups[sourceGroupIndex] = sourceGroup;
                newGroups[destGroupIndex] = destGroup;

                // Notify parent
                if (onUpdateTasks) {
                    const allTasks = newGroups.flatMap(g => g.rows);
                    onUpdateTasks(allTasks);
                }

                return newGroups;
            });
        }
    }, []);

    // Column drag handlers
    const handleColumnDragStart = useCallback((event: DragStartEvent) => {
        setActiveColumnDragId(event.active.id as string);
    }, []);

    const handleColumnDragEnd = useCallback((
        event: DragEndEvent,
        columns: Column[],
        setColumns: React.Dispatch<React.SetStateAction<Column[]>>
    ) => {
        setActiveColumnDragId(null);

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = columns.findIndex(c => c.id === active.id);
        const newIndex = columns.findIndex(c => c.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            setColumns(prev => arrayMove(prev, oldIndex, newIndex));
        }
    }, []);

    // Get dragged items for overlay
    const getDraggedRow = useCallback((tableGroups: TableGroup[]): Row | undefined => {
        if (!activeDragId) return undefined;
        for (const group of tableGroups) {
            const row = group.rows.find(r => r.id === activeDragId);
            if (row) return row;
        }
        return undefined;
    }, [activeDragId]);

    const getDraggedColumn = useCallback((columns: Column[]): Column | undefined => {
        if (!activeColumnDragId) return undefined;
        return columns.find(c => c.id === activeColumnDragId);
    }, [activeColumnDragId]);

    return {
        sensors,
        activeDragId,
        setActiveDragId,
        activeColumnDragId,
        setActiveColumnDragId,
        handleRowDragStart,
        handleRowDragEnd,
        handleColumnDragStart,
        handleColumnDragEnd,
        getDraggedRow,
        getDraggedColumn,
    };
}
