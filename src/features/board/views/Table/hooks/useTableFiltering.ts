import React, { useState, useCallback } from 'react';
import { Row, Column, FilterRule, SortRule } from '../types';

// Condition options by column type
const FILTER_CONDITIONS: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  date: [
    { value: 'is', label: 'Is' },
    { value: 'is_after', label: 'Is after' },
    { value: 'is_before', label: 'Is before' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  status: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  priority: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  people: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
  ],
};

export const getConditionsForType = (type: string) => FILTER_CONDITIONS[type] || FILTER_CONDITIONS.text;

interface UseTableFilteringProps {
  columns: Column[];
}

interface UseTableFilteringReturn {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Person filter
  personFilter: string | null;
  setPersonFilter: (person: string | null) => void;
  isPersonFilterOpen: boolean;
  setIsPersonFilterOpen: (open: boolean) => void;

  // Advanced filters
  filters: FilterRule[];
  setFilters: React.Dispatch<React.SetStateAction<FilterRule[]>>;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (open: boolean) => void;
  addFilter: () => void;
  updateFilter: (id: string, updates: Partial<FilterRule>) => void;
  removeFilter: (id: string) => void;

  // Sort
  sortRules: SortRule[];
  setSortRules: React.Dispatch<React.SetStateAction<SortRule[]>>;
  isSortPanelOpen: boolean;
  setIsSortPanelOpen: (open: boolean) => void;
  addSortRule: () => void;
  updateSortRule: (id: string, updates: Partial<SortRule>) => void;
  removeSortRule: (id: string) => void;

  // Column visibility
  hiddenColumns: Set<string>;
  setHiddenColumns: React.Dispatch<React.SetStateAction<Set<string>>>;
  isHideColumnsOpen: boolean;
  setIsHideColumnsOpen: (open: boolean) => void;
  columnSearchQuery: string;
  setColumnSearchQuery: (query: string) => void;
  toggleColumnVisibility: (colId: string) => void;

  // Filtering function
  applyFilters: (rows: Row[]) => Row[];
  applySorting: (rows: Row[]) => Row[];
}

export function useTableFiltering({ columns }: UseTableFilteringProps): UseTableFilteringReturn {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Person filter state
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);

  // Advanced filters state
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Sort state
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);

  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [isHideColumnsOpen, setIsHideColumnsOpen] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');

  // Filter operations
  const addFilter = useCallback(() => {
    const firstColumn = columns.find((c) => c.id !== 'select' && c.type !== 'select') || columns[0];
    const newFilter: FilterRule = {
      id: `filter-${Date.now()}`,
      column: firstColumn?.id || 'name',
      condition: 'contains',
      value: '',
    };
    setFilters((prev) => [...prev, newFilter]);
  }, [columns]);

  const updateFilter = useCallback((id: string, updates: Partial<FilterRule>) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Sort operations
  const addSortRule = useCallback(() => {
    const firstColumn = columns.find((c) => c.id !== 'select' && c.type !== 'select') || columns[0];
    const newRule: SortRule = {
      id: `sort-${Date.now()}`,
      column: firstColumn?.id || 'name',
      direction: 'asc',
    };
    setSortRules((prev) => [...prev, newRule]);
  }, [columns]);

  const updateSortRule = useCallback((id: string, updates: Partial<SortRule>) => {
    setSortRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const removeSortRule = useCallback((id: string) => {
    setSortRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Column visibility
  const toggleColumnVisibility = useCallback((colId: string) => {
    setHiddenColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(colId)) {
        newSet.delete(colId);
      } else {
        newSet.add(colId);
      }
      return newSet;
    });
  }, []);

  // Apply filters to rows
  const applyFilters = useCallback(
    (rows: Row[]): Row[] => {
      let filtered = rows;

      // Apply search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((row) => {
          return columns.some((col) => {
            const val = row[col.id];
            if (val === null || val === undefined) return false;
            if (typeof val === 'object') {
              return JSON.stringify(val).toLowerCase().includes(query);
            }
            return String(val).toLowerCase().includes(query);
          });
        });
      }

      // Apply person filter
      if (personFilter) {
        filtered = filtered.filter((row) => {
          const peopleCol = columns.find((c) => c.type === 'people');
          if (!peopleCol) return true;
          const val = row[peopleCol.id];
          if (!val) return false;
          if (typeof val === 'object' && val.id) {
            return val.id === personFilter;
          }
          return false;
        });
      }

      // Apply advanced filters
      filters.forEach((filter) => {
        if (!filter.column || !filter.condition) return;

        filtered = filtered.filter((row) => {
          const val = row[filter.column];
          const valStr = val !== null && val !== undefined ? String(val).toLowerCase() : '';
          const filterVal = filter.value.toLowerCase();

          switch (filter.condition) {
            case 'contains':
              return valStr.includes(filterVal);
            case 'equals':
              return valStr === filterVal;
            case 'not_contains':
              return !valStr.includes(filterVal);
            case 'is_empty':
              return !val || valStr === '';
            case 'is_not_empty':
              return val && valStr !== '';
            case 'is':
              return valStr === filterVal;
            case 'is_not':
              return valStr !== filterVal;
            case 'is_after':
              if (!val || !filter.value) return true;
              return new Date(val) > new Date(filter.value);
            case 'is_before':
              if (!val || !filter.value) return true;
              return new Date(val) < new Date(filter.value);
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    [searchQuery, personFilter, filters, columns],
  );

  // Apply sorting to rows
  const applySorting = useCallback(
    (rows: Row[]): Row[] => {
      if (sortRules.length === 0) return rows;

      return [...rows].sort((a, b) => {
        for (const rule of sortRules) {
          const aVal = a[rule.column];
          const bVal = b[rule.column];

          // Handle null/undefined
          if (aVal === null || aVal === undefined) return rule.direction === 'asc' ? 1 : -1;
          if (bVal === null || bVal === undefined) return rule.direction === 'asc' ? -1 : 1;

          // Compare values
          let comparison = 0;
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
          } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
          } else {
            comparison = String(aVal).localeCompare(String(bVal));
          }

          if (comparison !== 0) {
            return rule.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    },
    [sortRules],
  );

  return {
    // Search
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,

    // Person filter
    personFilter,
    setPersonFilter,
    isPersonFilterOpen,
    setIsPersonFilterOpen,

    // Advanced filters
    filters,
    setFilters,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    addFilter,
    updateFilter,
    removeFilter,

    // Sort
    sortRules,
    setSortRules,
    isSortPanelOpen,
    setIsSortPanelOpen,
    addSortRule,
    updateSortRule,
    removeSortRule,

    // Column visibility
    hiddenColumns,
    setHiddenColumns,
    isHideColumnsOpen,
    setIsHideColumnsOpen,
    columnSearchQuery,
    setColumnSearchQuery,
    toggleColumnVisibility,

    // Filtering functions
    applyFilters,
    applySorting,
  };
}
