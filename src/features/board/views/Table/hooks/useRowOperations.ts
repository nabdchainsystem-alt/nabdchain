/**
 * useRowOperations — Row CRUD, text editing, navigation, and creation row
 *
 * Extracts handleUpdateRow, handleTextChange, handleDeleteRow,
 * handleAddTask, handleTextColorChange, handleDeleteRowFromGroup,
 * creation row state, handleCommitCreationRow, navigateToNextCell, toggleCell.
 */

import { useState, useRef, useCallback } from 'react';
import { Column, Row, TableGroup } from '../types';

interface RowOperationsOptions {
  columns: Column[];
  rows: Row[];
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  tableGroups: TableGroup[];
  setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>;
  onUpdateTasks?: (tasks: Row[]) => void;
  onDeleteTask?: (groupId: string, taskId: string) => void;
  externalTasks?: Row[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSortRules: React.Dispatch<React.SetStateAction<any[]>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSortConfig: React.Dispatch<React.SetStateAction<any>>;
  activeCell: { rowId: string; colId: string; trigger?: HTMLElement; rect?: DOMRect } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setActiveCell: React.Dispatch<React.SetStateAction<any>>;
  visibleColumns: Column[];
  tableBodyRef: React.RefObject<HTMLDivElement | null>;
  creationRowInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  newTaskName: string;
  setNewTaskName: React.Dispatch<React.SetStateAction<string>>;
  t: (key: string) => string;
}

const CREATION_ROW_ID = 'creation-row-temp-id';

export function useRowOperations(options: RowOperationsOptions) {
  const {
    columns,
    rows,
    setRows,
    tableGroups,
    setTableGroups,
    onUpdateTasks,
    onDeleteTask,
    externalTasks,
    setSortRules,
    setSortConfig,
    activeCell,
    setActiveCell,
    visibleColumns,
    tableBodyRef,
    creationRowInputRefs,
    newTaskName,
    setNewTaskName,
    t,
  } = options;

  // Creation Row State - separate buffer for EACH group
  const [creationRows, setCreationRows] = useState<Record<string, Partial<Row>>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpdateCreationRow = (groupId: string, updates: Partial<Row>) => {
    setCreationRows((prev) => ({
      ...prev,
      [groupId]: { ...(prev[groupId] || {}), ...updates },
    }));
  };

  const handleCommitCreationRow = (groupId: string) => {
    const groupCreationRow = creationRows[groupId] || {};

    if (!groupCreationRow.name && !Object.keys(groupCreationRow).length) return;

    const primaryCol = columns.find((c) => c.id === 'name') || columns.find((c) => c.id !== 'select') || { id: 'name' };
    const nameToUse = groupCreationRow[primaryCol.id] || t('new_item');

    const newRow: Row = {
      id: Date.now().toString(),
      groupId: groupId,
      status: 'To Do',
      dueDate: null,
      date: new Date().toISOString(),
      priority: null,
      ...groupCreationRow,
      [primaryCol.id]: nameToUse,
    };

    // Initialize missing columns
    columns.forEach((col) => {
      // eslint-disable-next-line no-prototype-builtins
      if (col.id !== 'select' && !newRow.hasOwnProperty(col.id)) {
        newRow[col.id] = null;
      }
    });

    setSortRules([]);
    setSortConfig(null);

    const updatedGroups = tableGroups.map((g) => (g.id === groupId ? { ...g, rows: [newRow, ...g.rows] } : g));

    setTableGroups(updatedGroups);

    // Explicitly sync with parent (Kanban/Board)
    if (onUpdateTasks) {
      const allRows = updatedGroups.flatMap((g) => g.rows);
      onUpdateTasks(allRows);
    }

    // Reset creation row for THIS group
    setCreationRows((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });

    // Keep focus on the creation row input for continuous entry
    requestAnimationFrame(() => {
      const inputEl = creationRowInputRefs.current[groupId];
      if (inputEl) {
        inputEl.focus();
      }
    });
  };

  const handleDeleteRowFromGroup = useCallback((rowId: string) => {
    setTableGroups((prev) =>
      prev.map((g) => ({
        ...g,
        rows: g.rows.filter((r) => r.id !== rowId),
      })),
    );
  }, []);

  const handleAddTask = () => {
    const nameToAdd = newTaskName.trim() || 'New Item';

    const primaryCol = columns.find((c) => c.id === 'name') || columns.find((c) => c.id !== 'select') || { id: 'name' };

    const newRow: Row = {
      id: Date.now().toString(),
      [primaryCol.id]: nameToAdd,
      status: 'To Do',
      dueDate: new Date().toISOString(),
      date: new Date().toISOString(),
      priority: null,
    };

    // Initialize other columns with null/empty
    columns.forEach((col) => {
      // eslint-disable-next-line no-prototype-builtins
      if (col.id !== 'select' && !newRow.hasOwnProperty(col.id)) {
        newRow[col.id] = null;
      }
    });
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    setNewTaskName('');
    if (onUpdateTasks) onUpdateTasks(updatedRows);
  };

  const handleUpdateRow = (id: string, updates: Partial<Row>, groupId?: string) => {
    if (id === CREATION_ROW_ID) {
      if (groupId) {
        handleUpdateCreationRow(groupId, updates);
      }
      return;
    }

    // Clear any pending debounced updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Check if this update marks the task as "Done"
    const statusColumnIds = columns
      .filter((col) => col.type === 'status' || col.id.toLowerCase().includes('status'))
      .map((col) => col.id);

    let isDoneStatus = false;
    for (const key of Object.keys(updates)) {
      if (statusColumnIds.includes(key) || key.toLowerCase().includes('status')) {
        const value = updates[key];
        if (
          value &&
          (value === 'Done' ||
            value === 'منجز' ||
            String(value).toLowerCase() === 'done' ||
            String(value).toLowerCase() === 'completed')
        ) {
          isDoneStatus = true;
          break;
        }
      }
    }

    // Compute new groups state
    const computeNewGroups = (prevGroups: typeof tableGroups) => {
      return prevGroups.map((group) => {
        const rowIndex = group.rows.findIndex((r) => r.id === id);
        if (rowIndex === -1) return group;

        const currentRow = group.rows[rowIndex];
        const updatedRow = { ...currentRow, ...updates };

        // If marked as Done, move to the end of the group
        if (isDoneStatus && rowIndex < group.rows.length - 1) {
          const newRows = [...group.rows];
          newRows.splice(rowIndex, 1);
          newRows.push(updatedRow);
          return { ...group, rows: newRows };
        }

        // Normal update without reordering
        return {
          ...group,
          rows: group.rows.map((r) => (r.id === id ? updatedRow : r)),
        };
      });
    };

    const newGroups = computeNewGroups(tableGroups);
    setTableGroups(newGroups);

    const updatedRows = newGroups.flatMap((g) => g.rows);
    if (onUpdateTasks) onUpdateTasks(updatedRows);
  };

  const handleTextChange = (id: string, colId: string, value: string, groupId?: string) => {
    if (id === CREATION_ROW_ID) {
      if (groupId) {
        handleUpdateCreationRow(groupId, { [colId]: value });
      }
      return;
    }

    // Update the row in the correct group
    setTableGroups((prevGroups) => {
      return prevGroups.map((group) => {
        const rowExists = group.rows.some((r) => r.id === id);
        if (rowExists) {
          return {
            ...group,
            rows: group.rows.map((r) => (r.id === id ? { ...r, [colId]: value } : r)),
          };
        }
        return group;
      });
    });

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      // Use setTableGroups callback to access latest state
      setTableGroups((currentGroups) => {
        const currentRows = currentGroups.flatMap((g) => g.rows);
        const updatedRows = currentRows.map((r) => (r.id === id ? { ...r, [colId]: value } : r));
        if (onUpdateTasks) onUpdateTasks(updatedRows);
        return currentGroups; // Return unchanged - we're just reading
      });
    }, 800);
  };

  const handleDeleteRow = (id: string) => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

    // Find the group AND the row
    const group = tableGroups.find((g) => g.rows.some((r) => r.id === id));
    const row = group?.rows.find((r) => r.id === id);

    // Preference: Use Board Group ID from externalTasks -> row.groupId -> group.id
    const externalTask = externalTasks?.find((t) => t.id === id);
    const targetGroupId = externalTask?.groupId || row?.groupId || group?.id;

    // Use the explicit delete handler if available (Preferred)
    if (onDeleteTask && targetGroupId) {
      onDeleteTask(targetGroupId, id);
    }

    // Optimistically delete locally to update UI immediately
    setTableGroups((prevGroups) => {
      return prevGroups.map((group) => {
        const rowExists = group.rows.some((r) => r.id === id);
        if (rowExists) {
          return { ...group, rows: group.rows.filter((r) => r.id !== id) };
        }
        return group;
      });
    });

    // Only trigger onUpdateTasks if we DIDN'T use onDeleteTask (Legacy fallback)
    if (!onDeleteTask) {
      const updatedRows = rows.filter((r) => r.id !== id);
      if (onUpdateTasks) onUpdateTasks(updatedRows);
    }
  };

  const toggleCell = (e: React.MouseEvent, rowId: string, colId: string) => {
    e.stopPropagation();
    if (activeCell?.rowId === rowId && activeCell?.colId === colId) {
      setActiveCell(null);
    } else {
      const trigger = e.currentTarget as HTMLElement;
      const triggerRect = trigger.getBoundingClientRect();

      const col = columns.find((c) => c.id === colId);
      const isDateColumn = col?.type === 'date' || col?.type === 'timeline' || col?.type === 'dueDate';

      const CALENDAR_WIDTH = 420;
      const VIEWPORT_PADDING = 20;
      const availableSpace = window.innerWidth - triggerRect.left;

      if (isDateColumn && availableSpace < CALENDAR_WIDTH + VIEWPORT_PADDING && tableBodyRef.current) {
        const scrollAmount = CALENDAR_WIDTH - availableSpace + VIEWPORT_PADDING + 50;

        tableBodyRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });

        setTimeout(() => {
          const newRect = trigger.getBoundingClientRect();
          setActiveCell({ rowId, colId, trigger, rect: newRect });
        }, 150);
      } else {
        setActiveCell({ rowId, colId, trigger, rect: triggerRect });
      }
    }
  };

  const navigateToNextCell = (currentRowId: string, currentColId: string, groupId?: string) => {
    // If this is the creation row, commit it instead of navigating
    if (currentRowId === CREATION_ROW_ID && groupId) {
      handleCommitCreationRow(groupId);
      return;
    }

    // For existing rows, navigate to the creation row
    const primaryCol =
      visibleColumns.find((col) => col.id === 'name') || visibleColumns.find((col) => col.id !== 'select');
    if (!primaryCol) {
      setActiveCell(null);
      return;
    }

    const firstGroup = tableGroups[0];
    if (!firstGroup) {
      setActiveCell(null);
      return;
    }

    // Focus the creation row's primary column
    setTimeout(() => {
      const cellSelector = `[data-row-id="${CREATION_ROW_ID}"][data-col-id="${primaryCol.id}"]`;
      const creationCellElement = document.querySelector(cellSelector) as HTMLElement;

      if (creationCellElement) {
        const rect = creationCellElement.getBoundingClientRect();
        setActiveCell({ rowId: CREATION_ROW_ID, colId: primaryCol.id, trigger: creationCellElement, rect });

        setTimeout(() => {
          const input = creationCellElement.querySelector('input');
          if (input) input.focus();
        }, 50);
      } else {
        setActiveCell({ rowId: CREATION_ROW_ID, colId: primaryCol.id });
      }
    }, 10);
  };

  const handleTextColorChange = (rowId: string, colId: string, color: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    const currentStyles = row._styles || {};
    const colStyles = currentStyles[colId] || {};

    const newStyles = {
      ...currentStyles,
      [colId]: { ...colStyles, color },
    };

    handleUpdateRow(rowId, { _styles: newStyles });
  };

  return {
    // Creation row
    creationRows,
    handleUpdateCreationRow,
    handleCommitCreationRow,
    CREATION_ROW_ID,

    // Row CRUD
    handleAddTask,
    handleUpdateRow,
    handleTextChange,
    handleDeleteRow,
    handleDeleteRowFromGroup,
    handleTextColorChange,

    // Navigation
    toggleCell,
    navigateToNextCell,

    // Reset
    resetCreationRows: () => setCreationRows({}),
  };
}
