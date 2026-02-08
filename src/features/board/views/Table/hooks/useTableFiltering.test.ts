import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableFiltering, getConditionsForType } from './useTableFiltering';
import { Column, Row } from '../types';

const columns: Column[] = [
  { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false },
  { id: 'name', label: 'Name', type: 'text', width: 320, minWidth: 200, resizable: true },
  { id: 'status', label: 'Status', type: 'status', width: 140, minWidth: 100, resizable: true },
  { id: 'date', label: 'Date', type: 'date', width: 140, minWidth: 120, resizable: true },
];

const sampleRows: Row[] = [
  { id: 'r1', name: 'Alpha Task', status: 'Done', date: '2025-01-15' },
  { id: 'r2', name: 'Beta Feature', status: 'In Progress', date: '2025-03-20' },
  { id: 'r3', name: 'Gamma Bug', status: 'Stuck', date: '' },
  { id: 'r4', name: 'Delta Review', status: '', date: '2025-06-01' },
];

describe('getConditionsForType', () => {
  it('returns text conditions for unknown type', () => {
    const conditions = getConditionsForType('foobar');
    expect(conditions.map((c) => c.value)).toEqual(['contains', 'equals', 'not_contains', 'is_empty', 'is_not_empty']);
  });

  it('returns date conditions for date type', () => {
    const conditions = getConditionsForType('date');
    expect(conditions.map((c) => c.value)).toEqual(['is', 'is_after', 'is_before', 'is_empty']);
  });

  it('returns status conditions for status type', () => {
    const conditions = getConditionsForType('status');
    expect(conditions.map((c) => c.value)).toContain('is');
    expect(conditions.map((c) => c.value)).toContain('is_not');
  });
});

describe('useTableFiltering', () => {
  it('has correct initial state', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    expect(result.current.searchQuery).toBe('');
    expect(result.current.filters).toHaveLength(0);
    expect(result.current.sortRules).toHaveLength(0);
    expect(result.current.hiddenColumns.size).toBe(0);
    expect(result.current.isSearchOpen).toBe(false);
    expect(result.current.isFilterPanelOpen).toBe(false);
    expect(result.current.isSortPanelOpen).toBe(false);
  });

  it('applyFilters with search query matches text in any column', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    act(() => {
      result.current.setSearchQuery('beta');
    });

    const filtered = result.current.applyFilters(sampleRows);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('r2');
  });

  it('applyFilters with contains filter', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    act(() => {
      result.current.setFilters([{ id: 'f1', column: 'name', condition: 'contains', value: 'task' }]);
    });

    const filtered = result.current.applyFilters(sampleRows);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('r1');
  });

  it('applyFilters with equals filter', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    act(() => {
      result.current.setFilters([{ id: 'f1', column: 'status', condition: 'equals', value: 'done' }]);
    });

    const filtered = result.current.applyFilters(sampleRows);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('r1');
  });

  it('applyFilters with is_empty filter', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    act(() => {
      result.current.setFilters([{ id: 'f1', column: 'status', condition: 'is_empty', value: '' }]);
    });

    const filtered = result.current.applyFilters(sampleRows);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('r4');
  });

  it('applyFilters with is_not_empty filter', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    act(() => {
      result.current.setFilters([{ id: 'f1', column: 'date', condition: 'is_not_empty', value: '' }]);
    });

    const filtered = result.current.applyFilters(sampleRows);
    expect(filtered).toHaveLength(3);
    // r3 has date: '' so it's excluded
    expect(filtered.map((r) => r.id)).toEqual(['r1', 'r2', 'r4']);
  });

  it('applySorting sorts ascending by string column', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    act(() => {
      result.current.setSortRules([{ id: 's1', column: 'name', direction: 'asc' }]);
    });

    const sorted = result.current.applySorting([...sampleRows]);
    expect(sorted[0].name).toBe('Alpha Task');
    expect(sorted[1].name).toBe('Beta Feature');
    expect(sorted[2].name).toBe('Delta Review');
    expect(sorted[3].name).toBe('Gamma Bug');
  });

  it('applySorting sorts descending by string column', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    act(() => {
      result.current.setSortRules([{ id: 's1', column: 'name', direction: 'desc' }]);
    });

    const sorted = result.current.applySorting([...sampleRows]);
    expect(sorted[0].name).toBe('Gamma Bug');
    expect(sorted[3].name).toBe('Alpha Task');
  });

  it('applySorting with nulls sorts correctly', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));
    const rowsWithNulls: Row[] = [
      { id: 'r1', name: 'Charlie' },
      { id: 'r2', name: null },
      { id: 'r3', name: 'Alice' },
    ];

    act(() => {
      result.current.setSortRules([{ id: 's1', column: 'name', direction: 'asc' }]);
    });

    const sorted = result.current.applySorting(rowsWithNulls);
    // null sorts to end for ascending
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[1].name).toBe('Charlie');
    expect(sorted[2].name).toBeNull();
  });

  it('addFilter creates a new filter with first available column', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    act(() => {
      result.current.addFilter();
    });

    expect(result.current.filters).toHaveLength(1);
    // First non-select column is 'name'
    expect(result.current.filters[0].column).toBe('name');
    expect(result.current.filters[0].condition).toBe('contains');
    expect(result.current.filters[0].value).toBe('');
  });

  it('toggleColumnVisibility adds and removes from hidden set', () => {
    const { result } = renderHook(() => useTableFiltering({ columns }));

    // Hide a column
    act(() => {
      result.current.toggleColumnVisibility('status');
    });
    expect(result.current.hiddenColumns.has('status')).toBe(true);

    // Toggle again to show it
    act(() => {
      result.current.toggleColumnVisibility('status');
    });
    expect(result.current.hiddenColumns.has('status')).toBe(false);
  });
});
