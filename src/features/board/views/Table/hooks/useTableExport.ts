/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Column, Row, TableGroup } from '../types';

interface UseTableExportProps {
  tableGroups: TableGroup[];
  columns: Column[];
}

interface UseTableExportReturn {
  exportToExcel: () => void;
  exportToCsv: () => void;
}

export function useTableExport({ tableGroups, columns }: UseTableExportProps): UseTableExportReturn {
  const getRowsToExport = useCallback(() => {
    // Gather all rows from all groups
    let allRows: Row[] = [];
    tableGroups.forEach((g) => {
      allRows = [...allRows, ...g.rows];
    });

    // If anything is selected, export ONLY selected. Else export all.
    const selectedRows = allRows.filter((r) => !!r['select']);
    return selectedRows.length > 0 ? selectedRows : allRows;
  }, [tableGroups]);

  const formatRowsForExport = useCallback(
    (rows: Row[]) => {
      return rows.map((r) => {
        const rowObj: Record<string, any> = {};
        columns.forEach((c) => {
          if (c.id === 'select') return; // Skip select column
          let val = r[c.id];
          // Format values if needed
          if (c.type === 'people' && val) val = (val as any).name;
          if (c.type === 'files' && val) val = (val as any).title || 'File';
          if (c.type === 'doc' && val) val = (val as any).name || 'Document';
          if (c.type === 'url' && val) val = (val as any).url || (val as any).text || '';
          // Date, etc are strings or simple enough
          rowObj[c.label] = val ?? '';
        });
        return rowObj;
      });
    },
    [columns],
  );

  const exportToExcel = useCallback(() => {
    const rowsToExport = getRowsToExport();

    if (rowsToExport.length === 0) {
      alert('No data to export.');
      return;
    }

    const data = formatRowsForExport(rowsToExport);

    // Generate Sheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Board Export');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Table_Export_${dateStr}.xlsx`);
  }, [getRowsToExport, formatRowsForExport]);

  const exportToCsv = useCallback(() => {
    const rowsToExport = getRowsToExport();

    if (rowsToExport.length === 0) {
      alert('No data to export.');
      return;
    }

    const data = formatRowsForExport(rowsToExport);

    // Generate CSV
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `Table_Export_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [getRowsToExport, formatRowsForExport]);

  return {
    exportToExcel,
    exportToCsv,
  };
}
