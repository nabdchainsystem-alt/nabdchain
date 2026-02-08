/**
 * useTableDataProcessing — Filtering, sorting, and pagination of table data
 *
 * Extracts filteredRows, sortedRows, filterRow, filteredTableGroups,
 * paginatedRows, paginatedGroups, priorityStats, visibleColumns, and
 * the click-outside handler from RoomTable.
 */

import { useMemo, useCallback, useEffect } from 'react';
import { Column, Row, TableGroup, FilterRule, SortRule } from '../types';
import { comparePriority } from '../../../../priorities/priorityUtils';
import { formatPriorityLabel } from '../utils';

interface TableDataProcessingOptions {
  rows: Row[];
  columns: Column[];
  tableGroups: TableGroup[];
  // Filters
  searchQuery: string;
  personFilter: string | null;
  filters: FilterRule[];
  priorityFilter: 'all' | string;
  activeKpiFilter: { type: string; value: string } | null;
  // Sort
  sortRules: SortRule[];
  sortConfig: { columnId: string; direction: 'asc' | 'desc' } | null;
  // Pagination
  rowsPerPage: number;
  currentPage: number;
  // Columns
  hiddenColumns: Set<string>;
  hideGroupHeader?: boolean;
  // Active cell (for click-outside)
  activeCell: { rowId: string; colId: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setActiveCell: React.Dispatch<React.SetStateAction<any>>;
  // Toolbar panels
  setIsPersonFilterOpen: (open: boolean) => void;
  setIsFilterPanelOpen: (open: boolean) => void;
  setIsSortPanelOpen: (open: boolean) => void;
  setIsHideColumnsOpen: (open: boolean) => void;
}

export function useTableDataProcessing(options: TableDataProcessingOptions) {
  const {
    rows,
    columns,
    tableGroups,
    searchQuery,
    personFilter,
    filters,
    priorityFilter,
    activeKpiFilter,
    sortRules,
    sortConfig,
    rowsPerPage,
    currentPage,
    hiddenColumns,
    hideGroupHeader,
    activeCell,
    setActiveCell,
    setIsPersonFilterOpen,
    setIsFilterPanelOpen,
    setIsSortPanelOpen,
    setIsHideColumnsOpen,
  } = options;

  // Click outside to deselect active cell
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveCell(null);
    };
    if (activeCell) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [activeCell]);

  // Filtered rows (standalone, for sortedRows → paginatedRows path)
  const filteredRows = useMemo(() => {
    let result = rows;

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((r) => formatPriorityLabel(r.priority) === priorityFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) => {
        return Object.values(row).some((val) => {
          if (typeof val === 'string') {
            return val.toLowerCase().includes(query);
          }
          return false;
        });
      });
    }

    // Apply person filter
    if (personFilter) {
      result = result.filter((row) => {
        const peopleRaw = row.people;
        const people = Array.isArray(peopleRaw) ? peopleRaw : peopleRaw ? [peopleRaw] : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return people.some((p: any) => (p?.name || p) === personFilter);
      });
    }

    // Apply advanced filters
    if (filters.length > 0) {
      result = result.filter((row) => {
        return filters.every((filter) => {
          if (!filter.column || !filter.condition) return true;

          const cellValue = row[filter.column];
          const filterValue = filter.value?.toLowerCase() || '';

          switch (filter.condition) {
            case 'contains':
              return String(cellValue || '')
                .toLowerCase()
                .includes(filterValue);
            case 'equals':
              return String(cellValue || '').toLowerCase() === filterValue;
            case 'not_contains':
              return !String(cellValue || '')
                .toLowerCase()
                .includes(filterValue);
            case 'is_empty':
              return !cellValue || cellValue === '';
            case 'is_not_empty':
              return cellValue && cellValue !== '';
            case 'is':
              return String(cellValue || '').toLowerCase() === filterValue;
            case 'is_not':
              return String(cellValue || '').toLowerCase() !== filterValue;
            case 'is_after':
              if (!cellValue || !filter.value) return true;
              return new Date(cellValue) > new Date(filter.value);
            case 'is_before':
              if (!cellValue || !filter.value) return true;
              return new Date(cellValue) < new Date(filter.value);
            default:
              return true;
          }
        });
      });
    }

    return result;
  }, [rows, priorityFilter, searchQuery, personFilter, filters]);

  // Sorted rows
  const sortedRows = useMemo(() => {
    let result = filteredRows;

    if (sortRules.length > 0) {
      result = [...result].sort((a, b) => {
        for (const rule of sortRules) {
          if (!rule.column) continue;

          const aVal = a[rule.column] || '';
          const bVal = b[rule.column] || '';

          if (rule.column === 'priority') {
            const comp = comparePriority(aVal, bVal);
            if (comp !== 0) return rule.direction === 'desc' ? -comp : comp;
            continue;
          }

          let comparison = 0;
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
          } else {
            comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          }

          if (comparison !== 0) {
            return rule.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    } else if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.columnId];
        const bVal = b[sortConfig.columnId];

        if (sortConfig.columnId === 'priority') {
          const r = comparePriority(aVal, bVal);
          return sortConfig.direction === 'asc' ? r : -r;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filteredRows, sortConfig, sortRules]);

  // Visible columns (excluding hidden ones)
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenColumns.has(col.id));
  }, [columns, hiddenColumns]);

  // Helper function to filter rows (for group-level filtering)
  const filterRow = useCallback(
    (row: Row): boolean => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = Object.values(row).some((val) => {
          if (typeof val === 'string') {
            return val.toLowerCase().includes(query);
          }
          return false;
        });
        if (!matchesSearch) return false;
      }

      if (personFilter) {
        const peopleRaw = row.people;
        const people = Array.isArray(peopleRaw) ? peopleRaw : peopleRaw ? [peopleRaw] : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchesPerson = people.some((p: any) => (p?.name || p) === personFilter);
        if (!matchesPerson) return false;
      }

      if (activeKpiFilter) {
        if (activeKpiFilter.type === 'status') {
          const rowStatus = row.status || 'To Do';
          if (rowStatus !== activeKpiFilter.value) return false;
        } else if (activeKpiFilter.type === 'priority') {
          const rowPriority = formatPriorityLabel(row.priority) || 'No Priority';
          if (rowPriority !== activeKpiFilter.value) return false;
        }
      }

      if (filters.length > 0) {
        const matchesFilters = filters.every((filter) => {
          if (!filter.column || !filter.condition) return true;

          const cellValue = row[filter.column];
          const filterValue = filter.value?.toLowerCase() || '';

          switch (filter.condition) {
            case 'contains':
              return String(cellValue || '')
                .toLowerCase()
                .includes(filterValue);
            case 'equals':
              return String(cellValue || '').toLowerCase() === filterValue;
            case 'not_contains':
              return !String(cellValue || '')
                .toLowerCase()
                .includes(filterValue);
            case 'is_empty':
              return !cellValue || cellValue === '';
            case 'is_not_empty':
              return cellValue && cellValue !== '';
            case 'is':
              return String(cellValue || '').toLowerCase() === filterValue;
            case 'is_not':
              return String(cellValue || '').toLowerCase() !== filterValue;
            case 'is_after':
              if (!cellValue || !filter.value) return true;
              return new Date(cellValue) > new Date(filter.value);
            case 'is_before':
              if (!cellValue || !filter.value) return true;
              return new Date(cellValue) < new Date(filter.value);
            default:
              return true;
          }
        });
        if (!matchesFilters) return false;
      }

      return true;
    },
    [searchQuery, personFilter, filters, activeKpiFilter],
  );

  // Filtered table groups - applies filters to each group's rows
  const filteredTableGroups = useMemo(() => {
    const hasActiveFilters = searchQuery.trim() || personFilter || filters.length > 0 || activeKpiFilter;

    if (!hasActiveFilters && sortRules.length === 0) {
      return tableGroups;
    }

    return tableGroups
      .map((group) => {
        let filteredGroupRows = group.rows.filter(filterRow);

        if (sortRules.length > 0) {
          filteredGroupRows = [...filteredGroupRows].sort((a, b) => {
            for (const rule of sortRules) {
              if (!rule.column) continue;

              const aVal = a[rule.column] || '';
              const bVal = b[rule.column] || '';

              if (rule.column === 'priority') {
                const comp = comparePriority(aVal, bVal);
                if (comp !== 0) return rule.direction === 'desc' ? -comp : comp;
                continue;
              }

              let comparison = 0;
              if (typeof aVal === 'string' && typeof bVal === 'string') {
                comparison = aVal.localeCompare(bVal);
              } else {
                comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
              }

              if (comparison !== 0) {
                return rule.direction === 'desc' ? -comparison : comparison;
              }
            }
            return 0;
          });
        } else if (sortConfig) {
          filteredGroupRows = [...filteredGroupRows].sort((a, b) => {
            const aVal = a[sortConfig.columnId];
            const bVal = b[sortConfig.columnId];
            if (sortConfig.columnId === 'priority') {
              const r = comparePriority(aVal, bVal);
              return sortConfig.direction === 'asc' ? r : -r;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return { ...group, rows: filteredGroupRows };
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [tableGroups, filterRow, sortRules]);

  // Click outside handler for toolbar panels
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInsidePanel = target.closest('[data-toolbar-panel]');
      const isToolbarButton = target.closest('[data-toolbar-button]');

      if (!isInsidePanel && !isToolbarButton) {
        setIsPersonFilterOpen(false);
        setIsFilterPanelOpen(false);
        setIsSortPanelOpen(false);
        setIsHideColumnsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pagination
  const isAllRows = rowsPerPage === -1;
  const totalPages = isAllRows ? 1 : Math.ceil(sortedRows.length / rowsPerPage);

  const paginatedRows = useMemo(() => {
    if (isAllRows) return sortedRows;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage, isAllRows]);

  const paginatedGroups = useMemo(() => {
    if (isAllRows) return filteredTableGroups;

    const paginatedRowIds = new Set(paginatedRows.map((r) => r.id));

    return filteredTableGroups
      .map((group) => ({
        ...group,
        rows: group.rows.filter((r) => paginatedRowIds.has(r.id)),
      }))
      .filter((group) => group.rows.length > 0 || group.isPinned || hideGroupHeader);
  }, [filteredTableGroups, paginatedRows, isAllRows, hideGroupHeader]);

  // Priority Summary
  const priorityStats = useMemo(() => {
    const total = rows.length;
    if (total === 0) return null;

    const counts = { Urgent: 0, High: 0, Medium: 0, Low: 0, None: 0 };

    rows.forEach((r) => {
      const p = r.priority;
      if (p === 'Urgent') counts.Urgent++;
      else if (p === 'High') counts.High++;
      else if (p === 'Medium') counts.Medium++;
      else if (p === 'Low') counts.Low++;
      else counts.None++;
    });

    return {
      total,
      segments: [
        { label: 'Urgent', count: counts.Urgent, color: 'bg-orange-500' },
        { label: 'High', count: counts.High, color: 'bg-yellow-400' },
        { label: 'Medium', count: counts.Medium, color: 'bg-blue-400' },
        { label: 'Low', count: counts.Low, color: 'bg-stone-300' },
        { label: 'None', count: counts.None, color: 'bg-stone-200' },
      ].filter((s) => s.count > 0),
    };
  }, [rows]);

  return {
    filteredRows,
    sortedRows,
    visibleColumns,
    filteredTableGroups,
    paginatedRows,
    paginatedGroups,
    totalPages,
    isAllRows,
    priorityStats,
  };
}
