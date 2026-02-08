/**
 * useDragDropHandlers — Row, column, and group drag-and-drop
 *
 * Extracts drag start/end/over handlers, column drag auto-scroll,
 * and all associated state from RoomTable.
 */

import { useState, useRef, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { Column, Row, TableGroup } from '../types';

interface DragDropOptions {
  tableGroups: TableGroup[];
  setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>;
  columns: Column[];
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  onUpdateTasks?: (tasks: Row[]) => void;
  tableBodyRef: React.RefObject<HTMLDivElement | null>;
}

export function useDragDropHandlers(options: DragDropOptions) {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tableGroups,
    setTableGroups,
    columns,
    setColumns,
    onUpdateTasks,
    tableBodyRef,
  } = options;

  // Row drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Column/group drag state
  const [activeColumnDragId, setActiveColumnDragId] = useState<string | null>(null);
  const [columnDragMousePos, setColumnDragMousePos] = useState<{ x: number; y: number } | null>(null);
  const columnDragAutoScrollRef = useRef<number | null>(null);
  const lastColumnDragMouseX = useRef<number>(0);

  // --- Row drag handlers ---

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      setTableGroups((prevGroups) => {
        const updatedGroups = prevGroups.map((group) => {
          const oldIndex = group.rows.findIndex((row) => row.id === active.id);
          const newIndex = group.rows.findIndex((row) => row.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newRows = arrayMove(group.rows, oldIndex, newIndex);
            return { ...group, rows: newRows };
          }
          return group;
        });

        if (onUpdateTasks) {
          const allRows = updatedGroups.flatMap((g) => g.rows);
          onUpdateTasks(allRows);
        }

        return updatedGroups;
      });
    }
  };

  // --- Column & group drag handlers ---

  const handleStructureDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;

    // Check if group drag
    if (tableGroups.some((g) => g.id === activeId)) {
      return;
    }

    // Column drag
    const colId = activeId.includes('__') ? activeId.split('__')[1] : activeId;
    setActiveColumnDragId(colId);

    const activatorEvent = event.activatorEvent as MouseEvent | TouchEvent;
    if (activatorEvent) {
      const clientX = 'touches' in activatorEvent ? activatorEvent.touches[0].clientX : activatorEvent.clientX;
      const clientY = 'touches' in activatorEvent ? activatorEvent.touches[0].clientY : activatorEvent.clientY;
      setColumnDragMousePos({ x: clientX, y: clientY });
      lastColumnDragMouseX.current = clientX;
    }
  };

  const handleStructureDragOver = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Group reordering
    const isGroupDrag = tableGroups.some((g) => g.id === activeId);
    if (isGroupDrag) {
      if (activeId !== overId) {
        setTableGroups((groups) => {
          const oldIndex = groups.findIndex((g) => g.id === activeId);
          const newIndex = groups.findIndex((g) => g.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(groups, oldIndex, newIndex);
          }
          return groups;
        });
      }
      return;
    }

    // Column reordering
    const activeColId = activeId.includes('__') ? activeId.split('__')[1] : activeId;
    const overColId = overId.includes('__') ? overId.split('__')[1] : overId;

    if (activeColId !== overColId) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === activeColId);
        const newIndex = items.findIndex((item) => item.id === overColId);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  const handleStructureDragEnd = () => {
    setActiveColumnDragId(null);
    setColumnDragMousePos(null);
    if (columnDragAutoScrollRef.current) {
      cancelAnimationFrame(columnDragAutoScrollRef.current);
      columnDragAutoScrollRef.current = null;
    }
  };

  // Auto-scroll during column drag
  useEffect(() => {
    if (!activeColumnDragId || !tableBodyRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      setColumnDragMousePos({ x: e.clientX, y: e.clientY });
      lastColumnDragMouseX.current = e.clientX;

      const rect = tableBodyRef.current?.getBoundingClientRect();
      if (!rect) return;

      const scrollMargin = 80;
      const maxScrollSpeed = 15;

      if (columnDragAutoScrollRef.current) {
        cancelAnimationFrame(columnDragAutoScrollRef.current);
        columnDragAutoScrollRef.current = null;
      }

      const doAutoScroll = () => {
        if (!tableBodyRef.current) return;

        const currentRect = tableBodyRef.current.getBoundingClientRect();
        const mouseX = lastColumnDragMouseX.current;
        let scrolled = false;

        if (mouseX < currentRect.left + scrollMargin) {
          const distanceFromEdge = currentRect.left + scrollMargin - mouseX;
          const speed = Math.min(maxScrollSpeed, Math.max(3, distanceFromEdge / 5));
          tableBodyRef.current.scrollLeft -= speed;
          scrolled = true;
        } else if (mouseX > currentRect.right - scrollMargin) {
          const distanceFromEdge = mouseX - (currentRect.right - scrollMargin);
          const speed = Math.min(maxScrollSpeed, Math.max(3, distanceFromEdge / 5));
          tableBodyRef.current.scrollLeft += speed;
          scrolled = true;
        }

        if (scrolled) {
          columnDragAutoScrollRef.current = requestAnimationFrame(doAutoScroll);
        }
      };

      if (e.clientX < rect.left + scrollMargin || e.clientX > rect.right - scrollMargin) {
        columnDragAutoScrollRef.current = requestAnimationFrame(doAutoScroll);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (columnDragAutoScrollRef.current) {
        cancelAnimationFrame(columnDragAutoScrollRef.current);
      }
    };
  }, [activeColumnDragId]);

  return {
    // Row drag
    activeDragId,
    handleDragStart,
    handleDragEnd,

    // Column/group drag
    activeColumnDragId,
    columnDragMousePos,
    handleStructureDragStart,
    handleStructureDragOver,
    handleStructureDragEnd,
  };
}
