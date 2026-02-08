// =============================================================================
// Hybrid Comparison Service
// =============================================================================
// Service for managing hybrid comparisons that mix live supplier data with manual entries

import {
  HybridComparisonData,
  HybridCompareColumn,
  HybridCompareRow,
  HybridCellValue,
  ComparisonDataSource,
  quotesToHybridData,
  createManualColumn,
  createCustomRow,
  countDataPoints,
} from '../types/comparison.types';
import { SupplierQuote } from '../types/comparison.types';

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize a hybrid comparison from supplier quotes
 */
export function initializeFromQuotes(
  quotes: SupplierQuote[],
  currency: string,
  rfqInfo?: { rfqId: string; rfqNumber?: string; itemName?: string },
): HybridComparisonData {
  return quotesToHybridData(quotes, currency, rfqInfo);
}

/**
 * Initialize an empty hybrid comparison for manual-only mode
 */
export function initializeEmpty(): HybridComparisonData {
  return {
    columns: [
      { id: 'col-1', name: 'Option A', source: 'manual' },
      { id: 'col-2', name: 'Option B', source: 'manual' },
    ],
    rows: [
      { id: 'row-1', metric: 'Price', rowType: 'custom', isLowerBetter: true, values: {} },
      { id: 'row-2', metric: 'Lead Time', rowType: 'custom', isLowerBetter: true, values: {} },
      { id: 'row-3', metric: 'Quality', rowType: 'custom', isLowerBetter: false, values: {} },
    ],
    hasLiveData: false,
    hasManualData: true,
  };
}

// =============================================================================
// Column Operations
// =============================================================================

/**
 * Add a manual column to the comparison
 */
export function addManualColumn(data: HybridComparisonData): HybridComparisonData {
  const manualColumnCount = data.columns.filter((c) => c.source === 'manual').length;
  const newColumn = createManualColumn(manualColumnCount);

  return {
    ...data,
    columns: [...data.columns, newColumn],
    hasManualData: true,
  };
}

/**
 * Remove a column (only manual columns can be removed)
 */
export function removeColumn(data: HybridComparisonData, columnId: string): HybridComparisonData {
  const column = data.columns.find((c) => c.id === columnId);

  // Cannot remove live columns
  if (!column || column.source === 'live') {
    return data;
  }

  // Cannot go below 2 columns
  if (data.columns.length <= 2) {
    return data;
  }

  // Remove column and clean up row values
  const newColumns = data.columns.filter((c) => c.id !== columnId);
  const newRows = data.rows.map((row) => {
    const newValues = { ...row.values };
    delete newValues[columnId];
    return { ...row, values: newValues };
  });

  // Check if there's still manual data
  const hasManualData =
    newColumns.some((c) => c.source === 'manual') ||
    newRows.some((r) => Object.values(r.values).some((v) => v.source === 'manual' && v.value?.trim()));

  return {
    ...data,
    columns: newColumns,
    rows: newRows,
    hasManualData,
  };
}

/**
 * Update column name
 */
export function updateColumnName(data: HybridComparisonData, columnId: string, name: string): HybridComparisonData {
  return {
    ...data,
    columns: data.columns.map((c) => (c.id === columnId ? { ...c, name } : c)),
  };
}

// =============================================================================
// Row Operations
// =============================================================================

/**
 * Add a custom row to the comparison
 */
export function addCustomRow(data: HybridComparisonData): HybridComparisonData {
  const newRow = createCustomRow();

  return {
    ...data,
    rows: [...data.rows, newRow],
    hasManualData: true,
  };
}

/**
 * Remove a row (only custom rows can be removed)
 */
export function removeRow(data: HybridComparisonData, rowId: string): HybridComparisonData {
  const row = data.rows.find((r) => r.id === rowId);

  // Cannot remove system rows
  if (!row || row.rowType === 'system') {
    return data;
  }

  // Cannot go below 1 row
  if (data.rows.length <= 1) {
    return data;
  }

  const newRows = data.rows.filter((r) => r.id !== rowId);

  // Check if there's still manual data
  const hasManualData =
    data.columns.some((c) => c.source === 'manual') ||
    newRows.some((r) => Object.values(r.values).some((v) => v.source === 'manual' && v.value?.trim()));

  return {
    ...data,
    rows: newRows,
    hasManualData,
  };
}

/**
 * Update row metric name
 */
export function updateRowMetric(data: HybridComparisonData, rowId: string, metric: string): HybridComparisonData {
  return {
    ...data,
    rows: data.rows.map((r) => (r.id === rowId ? { ...r, metric } : r)),
  };
}

/**
 * Toggle isLowerBetter for a custom row
 */
export function toggleRowScoring(data: HybridComparisonData, rowId: string): HybridComparisonData {
  return {
    ...data,
    rows: data.rows.map((r) =>
      r.id === rowId && r.rowType === 'custom' ? { ...r, isLowerBetter: !r.isLowerBetter } : r,
    ),
  };
}

// =============================================================================
// Cell Operations
// =============================================================================

/**
 * Update a cell value (only manual cells can be edited)
 */
export function updateCellValue(
  data: HybridComparisonData,
  rowId: string,
  columnId: string,
  value: string,
): HybridComparisonData {
  const row = data.rows.find((r) => r.id === rowId);
  const column = data.columns.find((c) => c.id === columnId);

  if (!row || !column) return data;

  // Determine the source - if it's a live column with system row, it's live
  const existingCell = row.values[columnId];
  const isLiveCell = existingCell?.source === 'live' && row.rowType === 'system';

  // Don't allow editing live cells
  if (isLiveCell) {
    return data;
  }

  // Parse numeric value
  const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));

  const newCellValue: HybridCellValue = {
    value,
    numericValue: isNaN(numericValue) ? undefined : numericValue,
    source: 'manual' as ComparisonDataSource,
  };

  const newRows = data.rows.map((r) => {
    if (r.id !== rowId) return r;
    return {
      ...r,
      values: {
        ...r.values,
        [columnId]: newCellValue,
      },
    };
  });

  // Check if there's manual data
  const hasManualData =
    data.columns.some((c) => c.source === 'manual') ||
    newRows.some((r) => Object.values(r.values).some((v) => v.source === 'manual' && v.value?.trim()));

  return {
    ...data,
    rows: newRows,
    hasManualData,
  };
}

// =============================================================================
// CSV Import
// =============================================================================

/**
 * Parse CSV text and merge with existing data
 */
export function importCSVToHybrid(
  data: HybridComparisonData,
  csvText: string,
): { data: HybridComparisonData; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText
    .trim()
    .split('\n')
    .filter((line) => line.trim());

  if (lines.length < 2) {
    errors.push('CSV must have at least a header row and one data row');
    return { data, errors };
  }

  // Parse header
  const headerParts = parseCSVLine(lines[0]);
  if (headerParts.length < 2) {
    errors.push('Header must have at least Metric and one value column');
    return { data, errors };
  }

  // Create new manual columns from CSV headers (skip first which is Metric)
  const csvColumns: HybridCompareColumn[] = headerParts.slice(1).map((name, idx) => ({
    id: `col-import-${Date.now()}-${idx}`,
    name: name.trim(),
    source: 'imported' as ComparisonDataSource,
  }));

  // Parse data rows
  const csvRows: HybridCompareRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length < 2) continue;

    const metric = parts[0].trim();
    const values: Record<string, HybridCellValue> = {};

    parts.slice(1).forEach((val, idx) => {
      if (idx < csvColumns.length) {
        const numericValue = parseFloat(val.replace(/[^0-9.-]/g, ''));
        values[csvColumns[idx].id] = {
          value: val.trim(),
          numericValue: isNaN(numericValue) ? undefined : numericValue,
          source: 'imported' as ComparisonDataSource,
        };
      }
    });

    csvRows.push({
      id: `row-import-${Date.now()}-${i}`,
      metric,
      rowType: 'custom',
      isLowerBetter:
        metric.toLowerCase().includes('price') ||
        metric.toLowerCase().includes('cost') ||
        metric.toLowerCase().includes('time') ||
        metric.toLowerCase().includes('lead'),
      values,
    });
  }

  // Merge with existing data
  const newData: HybridComparisonData = {
    ...data,
    columns: [...data.columns, ...csvColumns],
    rows: [...data.rows, ...csvRows],
    hasManualData: true,
  };

  return { data: newData, errors };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate hybrid comparison data
 */
export function validateHybridData(data: HybridComparisonData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (data.columns.length < 2) {
    errors.push('At least 2 columns are required for comparison');
  }

  if (data.columns.length > 6) {
    errors.push('Maximum 6 columns allowed');
  }

  if (data.rows.length < 1) {
    errors.push('At least 1 row is required');
  }

  // Check for empty column names
  const emptyColumnNames = data.columns.filter((c) => !c.name?.trim());
  if (emptyColumnNames.length > 0) {
    errors.push('All columns must have names');
  }

  // Check for duplicate column names
  const columnNames = data.columns.map((c) => c.name?.toLowerCase().trim());
  const duplicates = columnNames.filter((name, idx) => columnNames.indexOf(name) !== idx);
  if (duplicates.length > 0) {
    errors.push(`Duplicate column names: ${[...new Set(duplicates)].join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get data quality metrics
 */
export function getDataQuality(data: HybridComparisonData): {
  completeness: number;
  liveDataRatio: number;
  confidence: 'high' | 'medium' | 'low';
} {
  const counts = countDataPoints(data);
  const totalPossible = data.columns.length * data.rows.length;

  const completeness = totalPossible > 0 ? (counts.total / totalPossible) * 100 : 0;
  const liveDataRatio = counts.total > 0 ? (counts.live / counts.total) * 100 : 0;

  let confidence: 'high' | 'medium' | 'low';
  if (liveDataRatio >= 70 && completeness >= 80) {
    confidence = 'high';
  } else if (liveDataRatio >= 40 || completeness >= 60) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { completeness, liveDataRatio, confidence };
}
