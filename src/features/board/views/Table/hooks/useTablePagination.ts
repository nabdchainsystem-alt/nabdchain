import { useState, useCallback, useMemo } from 'react';
import { Row } from '../types';

interface UseTablePaginationProps {
  initialRowsPerPage?: number;
  showPagination?: boolean;
}

interface UseTablePaginationReturn {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (count: number) => void;

  // Get paginated rows
  getPaginatedRows: (rows: Row[]) => Row[];

  // Pagination info
  totalPages: (totalRows: number) => number;
  startIndex: number;
  endIndex: (totalRows: number) => number;

  // Navigation
  goToPage: (page: number) => void;
  goToNextPage: (totalRows: number) => void;
  goToPrevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: (totalRows: number) => void;

  // Reset pagination when data changes
  resetPagination: () => void;
}

export function useTablePagination({
  initialRowsPerPage = 50,
  showPagination = true,
}: UseTablePaginationProps): UseTablePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(showPagination ? initialRowsPerPage : -1);

  const startIndex = useMemo(() => (rowsPerPage > 0 ? (currentPage - 1) * rowsPerPage : 0), [currentPage, rowsPerPage]);

  const endIndex = useCallback(
    (totalRows: number) => {
      if (rowsPerPage <= 0) return totalRows;
      return Math.min(startIndex + rowsPerPage, totalRows);
    },
    [startIndex, rowsPerPage],
  );

  const totalPages = useCallback(
    (totalRows: number) => {
      if (rowsPerPage <= 0) return 1;
      return Math.ceil(totalRows / rowsPerPage);
    },
    [rowsPerPage],
  );

  const getPaginatedRows = useCallback(
    (rows: Row[]): Row[] => {
      if (rowsPerPage <= 0) return rows;
      return rows.slice(startIndex, startIndex + rowsPerPage);
    },
    [startIndex, rowsPerPage],
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const goToNextPage = useCallback(
    (totalRows: number) => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages(totalRows)));
    },
    [totalPages],
  );

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(
    (totalRows: number) => {
      setCurrentPage(totalPages(totalRows));
    },
    [totalPages],
  );

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    getPaginatedRows,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    resetPagination,
  };
}
