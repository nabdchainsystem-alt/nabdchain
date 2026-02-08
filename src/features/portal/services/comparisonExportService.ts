// =============================================================================
// Comparison Export Service - PDF and Excel exports for product comparison
// =============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// =============================================================================
// Types
// =============================================================================

export interface ComparisonExportItem {
  name: string;
  price: string;
  leadTime: string;
  availability: string;
  minOrder: string;
  responseSpeed: string;
  reliability: string;
  isVerified: boolean;
  isFastResponder: boolean;
}

export interface ComparisonExportData {
  items: ComparisonExportItem[];
  exportDate: string;
}

// Manual Compare Export Types
export interface ManualCompareColumn {
  id: string;
  name: string;
}

export interface ManualCompareRow {
  id: string;
  metric: string;
  values: Record<string, string>;
}

export interface ManualCompareExportData {
  columns: ManualCompareColumn[];
  rows: ManualCompareRow[];
  exportDate: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

const getFormattedDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
};

const getFormattedDateTime = (): string => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getBadgeText = (item: ComparisonExportItem): string => {
  const badges: string[] = [];
  if (item.isFastResponder) badges.push('Fast Responder');
  if (item.isVerified) badges.push('Verified');
  return badges.join(', ') || '-';
};

// =============================================================================
// PDF Export
// =============================================================================

export const exportComparisonToPDF = (data: ComparisonExportData): void => {
  const { items } = data;
  const date = getFormattedDate();
  const dateTime = getFormattedDateTime();

  // Create PDF in landscape for better table display
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Product Comparison', 14, 20);

  // Subtitle with date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${dateTime}`, 14, 28);
  doc.setTextColor(0, 0, 0);

  // Build table headers - first column is attribute name, rest are product names
  const headers = ['Attribute', ...items.map((item) => item.name)];

  // Build table rows
  const rows = [
    ['Price', ...items.map((item) => item.price)],
    ['Lead Time', ...items.map((item) => item.leadTime)],
    ['Availability', ...items.map((item) => item.availability)],
    ['Min. Order', ...items.map((item) => item.minOrder)],
    ['Response Speed', ...items.map((item) => item.responseSpeed)],
    ['Reliability', ...items.map((item) => item.reliability)],
    ['Badges', ...items.map((item) => getBadgeText(item))],
  ];

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' }, // Attribute column
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | NABD Marketplace`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' },
    );
  }

  // Save
  doc.save(`product-comparison-${date}.pdf`);
};

// =============================================================================
// Excel Export
// =============================================================================

export const exportComparisonToExcel = (data: ComparisonExportData): void => {
  const { items } = data;
  const date = getFormattedDate();

  // Build worksheet data
  // Header row: Attribute + Product names
  const headers = ['Attribute', ...items.map((item) => item.name)];

  // Data rows
  const rows = [
    ['Price', ...items.map((item) => item.price)],
    ['Lead Time', ...items.map((item) => item.leadTime)],
    ['Availability', ...items.map((item) => item.availability)],
    ['Min. Order', ...items.map((item) => item.minOrder)],
    ['Response Speed', ...items.map((item) => item.responseSpeed)],
    ['Reliability', ...items.map((item) => item.reliability)],
    ['Verified', ...items.map((item) => (item.isVerified ? 'Yes' : 'No'))],
    ['Fast Responder', ...items.map((item) => (item.isFastResponder ? 'Yes' : 'No'))],
  ];

  // Create worksheet
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = [{ wch: 15 }]; // Attribute column
  items.forEach(() => colWidths.push({ wch: 20 })); // Product columns
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Comparison');

  // Save
  XLSX.writeFile(wb, `product-comparison-${date}.xlsx`);
};

// =============================================================================
// Manual Compare PDF Export
// =============================================================================

export const exportManualCompareToPDF = (data: ManualCompareExportData): void => {
  const { columns, rows } = data;
  const date = getFormattedDate();
  const dateTime = getFormattedDateTime();

  // Create PDF in landscape for better table display
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Manual Comparison', 14, 20);

  // Subtitle with date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${dateTime}`, 14, 28);
  doc.setTextColor(0, 0, 0);

  // Build table headers
  const headers = ['Metric', ...columns.map((col) => col.name)];

  // Build table rows
  const tableRows = rows.map((row) => [row.metric, ...columns.map((col) => row.values[col.id] || '—')]);

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: tableRows,
    startY: 35,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' }, // Metric column
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | NABD Marketplace - Manual Comparison`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' },
    );
  }

  // Save
  doc.save(`manual-comparison-${date}.pdf`);
};

// =============================================================================
// Manual Compare Excel Export
// =============================================================================

export const exportManualCompareToExcel = (data: ManualCompareExportData): void => {
  const { columns, rows } = data;
  const date = getFormattedDate();

  // Build worksheet data
  const headers = ['Metric', ...columns.map((col) => col.name)];

  // Data rows
  const tableRows = rows.map((row) => [row.metric, ...columns.map((col) => row.values[col.id] || '—')]);

  // Create worksheet
  const wsData = [headers, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = [{ wch: 20 }]; // Metric column
  columns.forEach(() => colWidths.push({ wch: 18 })); // Value columns
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Manual Comparison');

  // Save
  XLSX.writeFile(wb, `manual-comparison-${date}.xlsx`);
};

// =============================================================================
// Import Parse Functions
// =============================================================================

export interface ParsedImportData {
  columns: ManualCompareColumn[];
  rows: ManualCompareRow[];
  errors: string[];
}

/**
 * Parse CSV text into manual compare format
 */
export const parseCSVToCompare = (csvText: string): ParsedImportData => {
  const errors: string[] = [];
  const lines = csvText.trim().split(/\r?\n/);

  if (lines.length < 2) {
    errors.push('CSV must have at least a header row and one data row');
    return { columns: [], rows: [], errors };
  }

  // Parse header (first row)
  const headerCells = parseCSVLine(lines[0]);
  if (headerCells.length < 2) {
    errors.push('Header must have at least 2 columns (metric + 1 value)');
    return { columns: [], rows: [], errors };
  }

  // First column is "Metric", rest are column names
  const columns: ManualCompareColumn[] = headerCells.slice(1).map((name, idx) => ({
    id: `col-${idx}`,
    name: name.trim() || `Column ${idx + 1}`,
  }));

  // Parse data rows
  const rows: ManualCompareRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length === 0 || (cells.length === 1 && !cells[0].trim())) {
      continue; // Skip empty lines
    }

    const metric = cells[0]?.trim() || `Row ${i}`;
    const values: Record<string, string> = {};

    columns.forEach((col, idx) => {
      values[col.id] = cells[idx + 1]?.trim() || '';
    });

    rows.push({
      id: `row-${i}`,
      metric,
      values,
    });
  }

  if (rows.length === 0) {
    errors.push('No valid data rows found');
  }

  if (columns.length > 4) {
    errors.push('Maximum 4 columns supported. Extra columns will be ignored.');
    columns.splice(4);
  }

  return { columns, rows, errors };
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

/**
 * Get sample CSV template
 */
export const getSampleCSVTemplate = (): string => {
  return `Metric,Option A,Option B,Option C
Price,$100,$120,$95
Lead Time,5 days,3 days,7 days
Quality,High,Medium,High
Warranty,2 years,1 year,3 years`;
};

// =============================================================================
// Hybrid Compare Types
// =============================================================================

import { HybridCompareExportData } from '../types/comparison.types';

// Re-export for convenience
export type { HybridCompareExportData };

// =============================================================================
// Hybrid Compare PDF Export
// =============================================================================

export const exportHybridCompareToPDF = (data: HybridCompareExportData): void => {
  const { columns, rows, rfqNumber, itemName, bestColumnId } = data;
  const date = getFormattedDate();
  const dateTime = getFormattedDateTime();

  // Create PDF in landscape for better table display
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Hybrid Comparison', 14, 20);

  // Subtitle with RFQ info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  let subtitle = `Generated on ${dateTime}`;
  if (rfqNumber) subtitle += ` | RFQ: ${rfqNumber}`;
  if (itemName) subtitle += ` | ${itemName}`;
  doc.text(subtitle, 14, 28);
  doc.setTextColor(0, 0, 0);

  // Legend for data sources
  doc.setFontSize(8);
  doc.text('Data Sources: [L] = Live supplier data | [M] = Manual entry | [I] = Imported', 14, 34);

  // Build table headers with source indicators
  const headers = [
    'Metric',
    ...columns.map((col) => {
      const sourceLabel = col.source === 'live' ? '[L]' : col.source === 'manual' ? '[M]' : '[I]';
      const bestLabel = col.id === bestColumnId ? ' ★' : '';
      return `${col.name} ${sourceLabel}${bestLabel}`;
    }),
  ];

  // Build table rows with source indicators for cells
  const tableRows = rows.map((row) => {
    const rowTypeLabel = row.rowType === 'system' ? '' : ' [Custom]';
    return [
      `${row.metric}${rowTypeLabel}`,
      ...columns.map((col) => {
        const cell = row.values[col.id];
        return cell?.value || '—';
      }),
    ];
  });

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: tableRows,
    startY: 40,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' }, // Metric column
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didParseCell: (data) => {
      // Highlight best pick column
      if (data.section === 'body' && data.column.index > 0) {
        const colIndex = data.column.index - 1;
        if (columns[colIndex]?.id === bestColumnId) {
          data.cell.styles.fillColor = [254, 243, 199]; // Amber-100
        }
      }
    },
  });

  // Best pick summary if available
  if (bestColumnId) {
    const bestCol = columns.find((c) => c.id === bestColumnId);
    if (bestCol) {
      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 120;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14); // Amber-800
      doc.text(`★ Best Pick: ${bestCol.name}`, 14, finalY + 10);
      doc.setTextColor(0, 0, 0);
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | NABD Marketplace - Hybrid Comparison`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' },
    );
  }

  // Save
  const filename = rfqNumber ? `hybrid-comparison-${rfqNumber}-${date}.pdf` : `hybrid-comparison-${date}.pdf`;
  doc.save(filename);
};

// =============================================================================
// Hybrid Compare Excel Export
// =============================================================================

export const exportHybridCompareToExcel = (data: HybridCompareExportData): void => {
  const { columns, rows, rfqNumber, itemName, bestColumnId } = data;
  const date = getFormattedDate();

  // Build worksheet data
  // Add info rows at top
  const infoRows: string[][] = [];
  if (rfqNumber) infoRows.push(['RFQ Number', rfqNumber]);
  if (itemName) infoRows.push(['Item', itemName]);
  infoRows.push(['Export Date', getFormattedDateTime()]);
  infoRows.push([]); // Empty row for spacing

  // Headers with source and best pick indicators
  const headers = [
    'Metric',
    'Type',
    ...columns.map((col) => {
      const bestLabel = col.id === bestColumnId ? ' (Best Pick)' : '';
      return `${col.name}${bestLabel}`;
    }),
  ];

  // Source row
  const sourceRow = ['', 'Source', ...columns.map((col) => col.source.toUpperCase())];

  // Data rows
  const tableRows = rows.map((row) => [
    row.metric,
    row.rowType === 'system' ? 'System' : 'Custom',
    ...columns.map((col) => {
      const cell = row.values[col.id];
      return cell?.value || '—';
    }),
  ]);

  // Create worksheet
  const wsData = [...infoRows, headers, sourceRow, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = [
    { wch: 20 }, // Metric column
    { wch: 10 }, // Type column
    ...columns.map(() => ({ wch: 18 })), // Value columns
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hybrid Comparison');

  // Save
  const filename = rfqNumber ? `hybrid-comparison-${rfqNumber}-${date}.xlsx` : `hybrid-comparison-${date}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// =============================================================================
// Export Default
// =============================================================================

export default {
  exportComparisonToPDF,
  exportComparisonToExcel,
  exportManualCompareToPDF,
  exportManualCompareToExcel,
  exportHybridCompareToPDF,
  exportHybridCompareToExcel,
  parseCSVToCompare,
  getSampleCSVTemplate,
};
