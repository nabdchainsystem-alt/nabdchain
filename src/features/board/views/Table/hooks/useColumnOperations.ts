/**
 * useColumnOperations — Column CRUD, options, sort, and resize
 *
 * Extracts all column-related handlers from RoomTable:
 * add, delete, rename, freeze, option CRUD, sort toggle, resize.
 */

import React, { useCallback, useRef } from 'react';
import { Column, Row, SortRule } from '../types';

interface ColumnOperationsOptions {
  columns: Column[];
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  isRTL: boolean;
  sortRules: SortRule[];
  setSortRules: React.Dispatch<React.SetStateAction<SortRule[]>>;
  tableBodyRef: React.RefObject<HTMLDivElement | null>;
  activeCell: { rowId: string; colId: string } | null;
  handleUpdateRow: (rowId: string, updates: Partial<Row>, groupId?: string) => void;
  creationRowId: string;
}

export function useColumnOperations(options: ColumnOperationsOptions) {
  const {
    columns,
    setColumns,
    setRows,
    isRTL,
    sortRules,
    setSortRules,
    tableBodyRef,
    activeCell,
    handleUpdateRow,
    creationRowId,
  } = options;

  // Resize refs
  const resizingColId = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);
  const justFinishedResizing = useRef<boolean>(false);

  // --- Column CRUD ---

  const addColumn = (
    type: string,
    label: string,
    _options?: unknown[],
    _currency?: string,
    config?: { currency?: { code: string; symbol: string } },
  ) => {
    const newCol: Column = {
      id: label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
      label,
      type,
      width: type === 'currency' ? 140 : 150,
      minWidth: 100,
      resizable: true,
      options: _options as Column['options'],
      ...(config?.currency && { currency: config.currency }),
    };
    setColumns([...columns, newCol]);

    // Auto-scroll to show the new column
    setTimeout(() => {
      if (tableBodyRef.current) {
        const el = tableBodyRef.current;
        const maxScroll = el.scrollWidth - el.clientWidth;
        el.scrollTo({
          left: isRTL ? -maxScroll : maxScroll,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  const deleteColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const renameColumn = (colId: string, newName: string) => {
    setColumns(columns.map((c) => (c.id === colId ? { ...c, label: newName } : c)));
  };

  const toggleColumnFreeze = useCallback((colId: string) => {
    setColumns((prev) => prev.map((col) => (col.id === colId ? { ...col, pinned: !col.pinned } : col)));
  }, []);

  const updateColumn = useCallback(
    (colId: string, updates: Partial<Column>) => {
      setColumns((prevCols) => prevCols.map((col) => (col.id === colId ? { ...col, ...updates } : col)));
    },
    [setColumns],
  );

  // --- Column Option CRUD ---

  const addColumnOption = (colId: string, optionLabel: string) => {
    setColumns((prevCols) =>
      prevCols.map((col) => {
        if (col.id === colId) {
          const existingOptions = col.options || [];
          if (existingOptions.some((o) => o.label.toLowerCase() === optionLabel.toLowerCase())) return col;

          const COLORS = [
            'bg-red-500',
            'bg-orange-500',
            'bg-amber-500',
            'bg-green-500',
            'bg-emerald-500',
            'bg-teal-500',
            'bg-cyan-500',
            'bg-sky-500',
            'bg-blue-500',
            'bg-indigo-500',
            'bg-violet-500',
            'bg-purple-500',
            'bg-fuchsia-500',
            'bg-pink-500',
            'bg-rose-500',
          ];
          const nextColor = COLORS[existingOptions.length % COLORS.length];
          const newOption = { id: optionLabel, label: optionLabel, color: nextColor };
          return { ...col, options: [...existingOptions, newOption] };
        }
        return col;
      }),
    );

    // Auto-select the new option for the row that triggered it
    if (activeCell?.rowId && activeCell?.colId === colId) {
      handleUpdateRow(
        activeCell.rowId,
        { [colId]: optionLabel },
        activeCell.rowId === creationRowId ? 'group-1' : undefined,
      );
    }
  };

  const editColumnOption = (colId: string, optionId: string, newLabel: string, newColor: string) => {
    setColumns((prevCols) =>
      prevCols.map((col) => {
        if (col.id === colId) {
          const existingOptions = col.options || [];
          const oldOption = existingOptions.find((o) => o.id === optionId);
          const oldLabel = oldOption?.label;
          const updatedOptions = existingOptions.map((opt) =>
            opt.id === optionId ? { ...opt, label: newLabel, color: newColor } : opt,
          );

          if (oldLabel && oldLabel !== newLabel) {
            setRows((prevRows) =>
              prevRows.map((row) => (row[colId] === oldLabel ? { ...row, [colId]: newLabel } : row)),
            );
          }

          return { ...col, options: updatedOptions };
        }
        return col;
      }),
    );
  };

  const deleteColumnOption = (colId: string, optionId: string) => {
    setColumns((prevCols) =>
      prevCols.map((col) => {
        if (col.id === colId) {
          const existingOptions = col.options || [];
          const optionToDelete = existingOptions.find((o) => o.id === optionId);
          const labelToDelete = optionToDelete?.label;

          if (labelToDelete) {
            setRows((prevRows) =>
              prevRows.map((row) => (row[colId] === labelToDelete ? { ...row, [colId]: '' } : row)),
            );
          }

          return { ...col, options: existingOptions.filter((opt) => opt.id !== optionId) };
        }
        return col;
      }),
    );
  };

  // --- Sort ---

  const handleSort = (colId: string) => {
    if (justFinishedResizing.current) return;

    if (sortRules && sortRules.find((r) => r.column === colId)) {
      setSortRules((prev) => {
        const existing = prev.find((r) => r.column === colId);
        if (existing) {
          return existing.direction === 'asc' ? [{ id: 'sort-' + Date.now(), column: colId, direction: 'desc' }] : [];
        }
        return [{ id: 'sort-' + Date.now(), column: colId, direction: 'asc' }];
      });
      return;
    }

    setSortRules([{ id: 'sort-' + Date.now(), column: colId, direction: 'asc' }]);
  };

  // --- Resize ---

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColId.current) return;
      const diff = isRTL ? startX.current - e.clientX : e.clientX - startX.current;
      const newWidth = startWidth.current + diff;

      setColumns((cols) =>
        cols.map((col) =>
          col.id === resizingColId.current ? { ...col, width: Math.max(col.minWidth, newWidth) } : col,
        ),
      );
    },
    [isRTL],
  );

  const onMouseUp = useCallback(() => {
    resizingColId.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'default';
    justFinishedResizing.current = true;
    setTimeout(() => {
      justFinishedResizing.current = false;
    }, 100);
  }, [onMouseMove]);

  const startResize = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColId.current = colId;
    startX.current = e.clientX;
    startWidth.current = currentWidth;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  return {
    // Column CRUD
    addColumn,
    deleteColumn,
    renameColumn,
    toggleColumnFreeze,
    updateColumn,

    // Column option CRUD
    addColumnOption,
    editColumnOption,
    deleteColumnOption,

    // Sort
    handleSort,

    // Resize
    startResize,
    onMouseMove,
    onMouseUp,
  };
}
