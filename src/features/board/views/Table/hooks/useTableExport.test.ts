import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock xlsx before importing the hook
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    sheet_to_csv: vi.fn(() => 'Name,Status\nAlpha,Done\nBeta,In Progress'),
  },
  writeFile: vi.fn(),
}));

import * as XLSX from 'xlsx';
import { useTableExport } from './useTableExport';
import { Column, TableGroup } from '../types';

const columns: Column[] = [
  { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false },
  { id: 'name', label: 'Name', type: 'text', width: 320, minWidth: 200, resizable: true },
  { id: 'status', label: 'Status', type: 'status', width: 140, minWidth: 100, resizable: true },
  { id: 'people', label: 'People', type: 'people', width: 120, minWidth: 100, resizable: true },
];

function makeGroups(
  rows?: { select?: boolean; name: string; status: string; people?: { id: string; name: string } | null }[],
): TableGroup[] {
  const defaultRows = rows ?? [
    { name: 'Alpha Task', status: 'Done', people: { id: 'u1', name: 'Alice' } },
    { name: 'Beta Feature', status: 'In Progress', people: null },
  ];
  return [
    {
      id: 'g1',
      name: 'Group 1',
      isCollapsed: false,
      color: { bg: 'bg-blue-500', text: 'text-blue-600' },
      rows: defaultRows.map((r, i) => ({
        id: `r${i + 1}`,
        select: r.select ?? false,
        name: r.name,
        status: r.status,
        people: r.people,
      })),
    },
  ];
}

describe('useTableExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('formatRowsForExport formats row values by column type (people column as name)', () => {
    const tableGroups = makeGroups();
    const { result } = renderHook(() => useTableExport({ tableGroups, columns }));

    // Export to Excel triggers formatRowsForExport internally
    act(() => {
      result.current.exportToExcel();
    });

    // The first call to json_to_sheet receives the formatted data
    const jsonToSheetCall = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonToSheetCall).toHaveLength(2);
    // People column should be formatted as name string
    expect(jsonToSheetCall[0]['People']).toBe('Alice');
    // Null people should be empty string
    expect(jsonToSheetCall[1]['People']).toBe('');
    // Select column should be excluded — the select column has label '' so its key shouldn't exist
    const keys = Object.keys(jsonToSheetCall[0]);
    expect(keys).not.toContain('');
  });

  it('exportToExcel calls XLSX.writeFile', () => {
    const tableGroups = makeGroups();
    const { result } = renderHook(() => useTableExport({ tableGroups, columns }));

    act(() => {
      result.current.exportToExcel();
    });

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^Table_Export_\d{4}-\d{2}-\d{2}\.xlsx$/),
    );
  });

  it('exportToCsv creates CSV download link', () => {
    const tableGroups = makeGroups();
    const { result } = renderHook(() => useTableExport({ tableGroups, columns }));

    // Spy on document.createElement to capture the link element
    const mockClick = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = mockClick;
      }
      return el;
    });

    act(() => {
      result.current.exportToCsv();
    });

    expect(XLSX.utils.sheet_to_csv).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('shows alert when no data to export', () => {
    const emptyGroups: TableGroup[] = [
      {
        id: 'g1',
        name: 'Empty',
        isCollapsed: false,
        color: { bg: 'bg-blue-500', text: 'text-blue-600' },
        rows: [],
      },
    ];

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { result } = renderHook(() => useTableExport({ tableGroups: emptyGroups, columns }));

    act(() => {
      result.current.exportToExcel();
    });
    expect(alertSpy).toHaveBeenCalledWith('No data to export.');

    act(() => {
      result.current.exportToCsv();
    });
    expect(alertSpy).toHaveBeenCalledTimes(2);

    alertSpy.mockRestore();
  });

  it('exports only selected rows when some rows are selected', () => {
    const tableGroups = makeGroups([
      { select: true, name: 'Selected Row', status: 'Done', people: null },
      { select: false, name: 'Unselected Row', status: 'In Progress', people: null },
    ]);

    const { result } = renderHook(() => useTableExport({ tableGroups, columns }));

    act(() => {
      result.current.exportToExcel();
    });

    const jsonToSheetCall = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonToSheetCall).toHaveLength(1);
    expect(jsonToSheetCall[0]['Name']).toBe('Selected Row');
  });

  it('people column is formatted as name string', () => {
    const tableGroups = makeGroups([{ name: 'Task 1', status: 'Done', people: { id: 'u1', name: 'Bob Smith' } }]);

    const { result } = renderHook(() => useTableExport({ tableGroups, columns }));

    act(() => {
      result.current.exportToExcel();
    });

    const jsonToSheetCall = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonToSheetCall[0]['People']).toBe('Bob Smith');
  });
});
