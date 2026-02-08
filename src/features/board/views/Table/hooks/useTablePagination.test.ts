import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTablePagination } from './useTablePagination';
import { Row } from '../types';

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i + 1}`,
    name: `Row ${i + 1}`,
  }));
}

describe('useTablePagination', () => {
  it('defaults to page 1 and rowsPerPage 50', () => {
    const { result } = renderHook(() => useTablePagination({}));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.rowsPerPage).toBe(50);
  });

  it('respects custom initialRowsPerPage', () => {
    const { result } = renderHook(() => useTablePagination({ initialRowsPerPage: 25 }));

    expect(result.current.rowsPerPage).toBe(25);
  });

  it('sets rowsPerPage to -1 when showPagination is false', () => {
    const { result } = renderHook(() => useTablePagination({ showPagination: false }));

    expect(result.current.rowsPerPage).toBe(-1);
  });

  it('getPaginatedRows slices rows correctly', () => {
    const { result } = renderHook(() => useTablePagination({ initialRowsPerPage: 3 }));
    const rows = makeRows(10);

    // Page 1: rows 0, 1, 2
    const page1 = result.current.getPaginatedRows(rows);
    expect(page1).toHaveLength(3);
    expect(page1[0].id).toBe('row-1');
    expect(page1[2].id).toBe('row-3');

    // Go to page 2: rows 3, 4, 5
    act(() => {
      result.current.goToPage(2);
    });
    const page2 = result.current.getPaginatedRows(rows);
    expect(page2).toHaveLength(3);
    expect(page2[0].id).toBe('row-4');
    expect(page2[2].id).toBe('row-6');
  });

  it('getPaginatedRows returns all rows when rowsPerPage <= 0', () => {
    const { result } = renderHook(() => useTablePagination({ showPagination: false }));
    const rows = makeRows(100);

    const paginated = result.current.getPaginatedRows(rows);
    expect(paginated).toHaveLength(100);
  });

  it('totalPages calculates correctly', () => {
    const { result } = renderHook(() => useTablePagination({ initialRowsPerPage: 10 }));

    expect(result.current.totalPages(100)).toBe(10);
    expect(result.current.totalPages(95)).toBe(10); // Ceiling
    expect(result.current.totalPages(0)).toBe(0);
    expect(result.current.totalPages(1)).toBe(1);
  });

  it('startIndex for page 1 is 0', () => {
    const { result } = renderHook(() => useTablePagination({ initialRowsPerPage: 20 }));

    expect(result.current.startIndex).toBe(0);
  });

  it('goToNextPage and goToPrevPage navigate correctly', () => {
    const { result } = renderHook(() => useTablePagination({ initialRowsPerPage: 10 }));

    // Navigate forward
    act(() => {
      result.current.goToNextPage(50);
    });
    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.goToNextPage(50);
    });
    expect(result.current.currentPage).toBe(3);

    // Navigate backward
    act(() => {
      result.current.goToPrevPage();
    });
    expect(result.current.currentPage).toBe(2);

    // Can't go below page 1
    act(() => {
      result.current.goToPrevPage();
    });
    act(() => {
      result.current.goToPrevPage();
    });
    expect(result.current.currentPage).toBe(1);
  });

  it('goToFirstPage and goToLastPage work correctly', () => {
    const { result } = renderHook(() => useTablePagination({ initialRowsPerPage: 10 }));

    // Go to some middle page first
    act(() => {
      result.current.goToPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    // Go to first
    act(() => {
      result.current.goToFirstPage();
    });
    expect(result.current.currentPage).toBe(1);

    // Go to last (50 rows, 10 per page = 5 pages)
    act(() => {
      result.current.goToLastPage(50);
    });
    expect(result.current.currentPage).toBe(5);
  });

  it('resetPagination returns to page 1', () => {
    const { result } = renderHook(() => useTablePagination({ initialRowsPerPage: 10 }));

    act(() => {
      result.current.goToPage(4);
    });
    expect(result.current.currentPage).toBe(4);

    act(() => {
      result.current.resetPagination();
    });
    expect(result.current.currentPage).toBe(1);
  });
});
