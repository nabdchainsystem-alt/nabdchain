import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTableSelection } from './useTableSelection';
import { Column, TableGroup } from '../types';

const columns: Column[] = [
  { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false },
  { id: 'name', label: 'Name', type: 'text', width: 320, minWidth: 200, resizable: true },
];

function makeGroups(selected: boolean[] = []): TableGroup[] {
  return [
    {
      id: 'g1',
      name: 'Group 1',
      isCollapsed: false,
      color: { bg: 'bg-blue-500', text: 'text-blue-600' },
      rows: [
        { id: 'r1', name: 'Row 1', select: selected[0] ?? false },
        { id: 'r2', name: 'Row 2', select: selected[1] ?? false },
      ],
    },
    {
      id: 'g2',
      name: 'Group 2',
      isCollapsed: false,
      color: { bg: 'bg-green-500', text: 'text-green-600' },
      rows: [{ id: 'r3', name: 'Row 3', select: selected[2] ?? false }],
    },
  ];
}

describe('useTableSelection', () => {
  it('getSelectedRows returns empty array when no rows are selected', () => {
    const { result } = renderHook(() => useTableSelection({ columns }));
    const groups = makeGroups([false, false, false]);

    const selected = result.current.getSelectedRows(groups);
    expect(selected).toHaveLength(0);
  });

  it('getSelectedRows returns rows with select=true', () => {
    const { result } = renderHook(() => useTableSelection({ columns }));
    const groups = makeGroups([true, false, true]);

    const selected = result.current.getSelectedRows(groups);
    expect(selected).toHaveLength(2);
    expect(selected[0].id).toBe('r1');
    expect(selected[1].id).toBe('r3');
  });

  it('areAllSelected returns false when no rows are selected', () => {
    const { result } = renderHook(() => useTableSelection({ columns }));
    const groups = makeGroups([false, false, false]);

    expect(result.current.areAllSelected(groups)).toBe(false);
  });

  it('areAllSelected returns true when all rows are selected', () => {
    const { result } = renderHook(() => useTableSelection({ columns }));
    const groups = makeGroups([true, true, true]);

    expect(result.current.areAllSelected(groups)).toBe(true);
  });

  it('areSomeSelected detects partial selection', () => {
    const { result } = renderHook(() => useTableSelection({ columns }));

    // Some selected
    const partial = makeGroups([true, false, false]);
    expect(result.current.areSomeSelected(partial)).toBe(true);

    // None selected
    const none = makeGroups([false, false, false]);
    expect(result.current.areSomeSelected(none)).toBe(false);

    // All selected — areSomeSelected should be false (it checks partial, not all)
    const all = makeGroups([true, true, true]);
    expect(result.current.areSomeSelected(all)).toBe(false);
  });

  it('selectedCount returns correct count', () => {
    const { result } = renderHook(() => useTableSelection({ columns }));

    expect(result.current.selectedCount(makeGroups([false, false, false]))).toBe(0);
    expect(result.current.selectedCount(makeGroups([true, false, false]))).toBe(1);
    expect(result.current.selectedCount(makeGroups([true, true, true]))).toBe(3);
  });

  it('handleSelectAll selects all rows', () => {
    const { result } = renderHook(() => useTableSelection({ columns }));

    let groups = makeGroups([false, false, false]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSetGroups = (fn: any) => {
      groups = fn(groups);
    };

    // Select all
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.handleSelectAll(true, mockSetGroups as any);
    expect(groups[0].rows[0].select).toBe(true);
    expect(groups[0].rows[1].select).toBe(true);
    expect(groups[1].rows[0].select).toBe(true);

    // Deselect all
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.handleSelectAll(false, mockSetGroups as any);
    expect(groups[0].rows[0].select).toBe(false);
    expect(groups[0].rows[1].select).toBe(false);
    expect(groups[1].rows[0].select).toBe(false);
  });

  it('clearSelection clears all selections', () => {
    const { result } = renderHook(() => useTableSelection({ columns }));

    let groups = makeGroups([true, true, true]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSetGroups = (fn: any) => {
      groups = fn(groups);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.clearSelection(mockSetGroups as any);
    expect(groups[0].rows[0].select).toBe(false);
    expect(groups[0].rows[1].select).toBe(false);
    expect(groups[1].rows[0].select).toBe(false);
  });
});
