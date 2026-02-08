/**
 * useExcelImport — Excel file import and ExcelImportModal handlers
 *
 * Extracts handleImport (raw file), handleExcelImport (modal),
 * handleImportClick, and fileInputRef from RoomTable.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Column, Row, TableGroup, GROUP_COLORS } from '../types';
import { normalizePriority } from '../../../../priorities/priorityUtils';
import { boardLogger } from '../../../../../utils/logger';

interface ExcelImportOptions {
  columns: Column[];
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  rows: Row[];
  tableGroups: TableGroup[];
  setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>;
  onUpdateTasks?: (tasks: Row[]) => void;
  setSortRules: React.Dispatch<React.SetStateAction<any[]>>;
  setSortConfig: React.Dispatch<React.SetStateAction<any>>;
  setIsExcelImportModalOpen: (open: boolean) => void;
  showToast: (message: string, type: string) => void;
  t: (key: string) => string;
}

export function useExcelImport(options: ExcelImportOptions) {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    columns,
    setColumns,
    rows,
    tableGroups,
    setTableGroups,
    onUpdateTasks,
    setSortRules,
    setSortConfig,
    setIsExcelImportModalOpen,
    showToast,
    t,
  } = options;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    setIsExcelImportModalOpen(true);
  };

  // Handle import from the ExcelImportModal
  const handleExcelImport = useCallback(
    (importedRows: Row[], newColumns?: Column[]) => {
      if (newColumns && newColumns.length > 0) {
        setColumns((prev) => [...prev, ...newColumns]);
      }

      // Add rows to the first group
      setTableGroups((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: 'group-1',
              name: 'Group 1',
              rows: importedRows,
              isCollapsed: false,
              color: GROUP_COLORS[0],
            },
          ];
        }
        return prev.map((g, idx) => (idx === 0 ? { ...g, rows: [...g.rows, ...importedRows] } : g));
      });

      if (onUpdateTasks) {
        const allRows = [...rows, ...importedRows];
        onUpdateTasks(allRows);
      }

      showToast(
        t('import_success')?.replace('{0}', String(importedRows.length)) ||
          `Successfully imported ${importedRows.length} rows`,
        'success',
      );
    },
    [rows, onUpdateTasks, showToast, t],
  );

  // Handle raw file import (drag-drop or file input)
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Get raw data (array of arrays)
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!rawData || rawData.length === 0) {
        showToast(t('file_appears_empty'), 'error');
        return;
      }

      // Smart header row detection - scan first 20 rows for the best candidate
      let headerRowIndex = 0;
      let maxNonEmptyCells = 0;

      for (let i = 0; i < Math.min(20, rawData.length); i++) {
        const row = rawData[i];
        if (!Array.isArray(row)) continue;

        // Count non-empty string cells (headers are usually strings)
        const nonEmptyCells = row.filter(
          (cell: any) => cell != null && String(cell).trim() !== '' && typeof cell === 'string',
        ).length;

        // Prefer rows with more non-empty string cells
        if (nonEmptyCells > maxNonEmptyCells) {
          maxNonEmptyCells = nonEmptyCells;
          headerRowIndex = i;
        }
      }

      const headerRow = rawData[headerRowIndex] || [];
      const dataRows = rawData.slice(headerRowIndex + 1);

      if (dataRows.length === 0) {
        showToast(t('found_headers_no_data').replace('{0}', String(headerRowIndex + 1)), 'error');
        return;
      }

      // Helper to detect column type from header name
      const detectColumnType = (headerName: string): string => {
        const lower = headerName.toLowerCase();
        if (lower === 'status' || lower.includes('status')) return 'status';
        if (lower === 'priority' || lower.includes('priority')) return 'priority';
        if (lower.includes('date') || lower.includes('due') || lower.includes('deadline')) return 'date';
        if (
          lower.includes('people') ||
          lower.includes('assignee') ||
          lower.includes('owner') ||
          lower.includes('person')
        )
          return 'people';
        return 'text';
      };

      // Track used IDs to handle duplicates
      const usedIds = new Set<string>();

      const newColumns: Column[] = headerRow.map((header: any, index: number) => {
        const headerStr = header != null ? String(header).trim() : '';
        const colType = detectColumnType(headerStr);

        // Generate unique ID - handle duplicates by appending index
        const baseId = headerStr.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '') || `col_${index}`;
        let id = baseId;
        let suffix = 1;
        while (usedIds.has(id)) {
          id = `${baseId}_${suffix}`;
          suffix++;
        }
        usedIds.add(id);

        return {
          id,
          label: headerStr || `Column ${index + 1}`,
          type: colType,
          width: colType === 'status' || colType === 'priority' ? 140 : 150,
          pinned: index === 0,
          minWidth: 100,
          resizable: true,
        };
      });

      // Add select column at start
      newColumns.unshift({
        id: 'select',
        label: '',
        type: 'text',
        width: 40,
        pinned: true,
        minWidth: 40,
        resizable: false,
      });

      // Find or create 'name' column - required for table functionality
      let nameColIndex = newColumns.findIndex(
        (c) =>
          c.id === 'name' ||
          c.label.toLowerCase() === 'name' ||
          c.label.toLowerCase() === 'title' ||
          c.label.toLowerCase() === 'task' ||
          c.label.toLowerCase() === 'item',
      );

      if (nameColIndex === -1) {
        // Use first non-select column as name
        nameColIndex = newColumns.findIndex((c) => c.id !== 'select');
      }

      if (nameColIndex !== -1 && newColumns[nameColIndex].id !== 'name') {
        newColumns[nameColIndex] = { ...newColumns[nameColIndex], id: 'name', pinned: true };
      }

      // Get data columns (excluding select) - these map 1:1 with Excel columns
      const dataColumns = newColumns.filter((c) => c.id !== 'select');

      // Helper to normalize status values
      const normalizeStatus = (value: any): string => {
        if (!value) return 'To Do';
        const lower = String(value).toLowerCase().trim();
        if (lower === 'done' || lower === 'completed' || lower === 'complete') return 'Done';
        if (
          lower === 'in progress' ||
          lower === 'in-progress' ||
          lower === 'inprogress' ||
          lower === 'working' ||
          lower === 'working on it'
        )
          return 'In Progress';
        if (lower === 'stuck' || lower === 'blocked') return 'Stuck';
        if (lower === 'rejected' || lower === 'cancelled' || lower === 'canceled') return 'Rejected';
        if (lower === 'to do' || lower === 'todo' || lower === 'pending' || lower === 'not started') return 'To Do';
        return String(value).trim();
      };

      const newRows: Row[] = [];
      const baseTimestamp = Date.now();

      dataRows.forEach((rowArray: any[], rowIndex: number) => {
        // Skip empty rows
        if (!rowArray || rowArray.length === 0) return;
        const hasData = rowArray.some((cell: any) => {
          if (cell == null) return false;
          const strVal = String(cell).trim();
          return strVal !== '' && strVal !== 'undefined' && strVal !== 'null';
        });
        if (!hasData) return;

        const rowData: any = {
          id: `${baseTimestamp}_${rowIndex}`,
          groupId: tableGroups[0]?.id || 'group-1',
          status: 'To Do',
          priority: null,
        };

        rowArray.forEach((cellValue, idx) => {
          if (idx < dataColumns.length) {
            const col = dataColumns[idx];
            let normalizedValue = cellValue;

            // Normalize based on column type
            if (col.type === 'status' || col.id === 'status') {
              normalizedValue = normalizeStatus(cellValue);
            } else if (col.type === 'priority' || col.id === 'priority') {
              normalizedValue = normalizePriority(cellValue != null ? String(cellValue) : null);
            } else if (col.type === 'date' && cellValue) {
              const dateVal = new Date(cellValue);
              normalizedValue = !isNaN(dateVal.getTime()) ? dateVal.toISOString() : cellValue;
            }

            rowData[col.id] = normalizedValue;
          }
        });

        newRows.push(rowData as Row);
      });

      if (newRows.length === 0) {
        showToast('No valid data rows found in the file.', 'error');
        return;
      }

      // Update state
      setColumns(newColumns);

      const baseGroup = tableGroups[0] || {
        id: 'group-1',
        name: 'Group 1',
        isCollapsed: false,
        color: GROUP_COLORS[0],
      };
      const newGroups = [{ ...baseGroup, rows: newRows }];
      setTableGroups(newGroups);

      // Reset filters/sorts
      setSortRules([]);
      setSortConfig(null);

      showToast(`Successfully imported ${newRows.length} rows from ${headerRow.length} columns`, 'success');
    } catch (error) {
      boardLogger.error('Import failed:', error);
      showToast('Import failed. Please check the file format.', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  return {
    fileInputRef,
    handleImportClick,
    handleExcelImport,
    handleImport,
  };
}
