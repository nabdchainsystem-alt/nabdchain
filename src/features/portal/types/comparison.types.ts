// =============================================================================
// Hybrid Comparison Types
// =============================================================================
// Types for mixing manual data with live supplier quotes

/**
 * Supplier quote interface for comparison
 * (Matches the local interface in MyRFQs.tsx)
 */
export interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  quotedPrice: number;
  leadTimeDays: number;
  reliability: number;
  responseSpeed: 'fast' | 'moderate' | 'slow';
  verified: boolean;
  quotedAt: string;
}

/**
 * Data source identifier for tracking where comparison values originate
 */
export type ComparisonDataSource = 'live' | 'manual' | 'imported';

/**
 * Column in a hybrid comparison (represents a supplier or manual option)
 */
export interface HybridCompareColumn {
  id: string;
  name: string;
  source: ComparisonDataSource;

  // For live columns (linked to supplier quote)
  supplierId?: string;
  supplierName?: string;
  quoteId?: string;
  isVerified?: boolean;
  responseSpeed?: 'fast' | 'moderate' | 'slow';
  lastUpdated?: string;
}

/**
 * Cell value with source tracking
 */
export interface HybridCellValue {
  value: string;
  numericValue?: number;
  source: ComparisonDataSource;
  originalValue?: string; // Original value from quote (for tracking edits)
  isEdited?: boolean;
  note?: string;
}

/**
 * Row in a hybrid comparison (represents a metric/attribute)
 */
export interface HybridCompareRow {
  id: string;
  metric: string;
  metricKey?: string; // e.g., 'price', 'leadTime' for system rows
  rowType: 'system' | 'custom';
  isLowerBetter?: boolean; // For scoring calculation
  values: Record<string, HybridCellValue>; // columnId -> cell value
}

/**
 * Complete hybrid comparison data set
 */
export interface HybridComparisonData {
  // RFQ reference (if created from RFQ)
  rfqId?: string;
  rfqNumber?: string;
  itemName?: string;

  // Comparison data
  columns: HybridCompareColumn[];
  rows: HybridCompareRow[];

  // Metadata flags
  hasLiveData: boolean;
  hasManualData: boolean;
  lastRefreshed?: string;
}

/**
 * System row definitions - auto-populated from quotes
 */
export const SYSTEM_ROW_DEFINITIONS: Array<{
  key: string;
  metric: string;
  isLowerBetter: boolean;
}> = [
  { key: 'price', metric: 'Price', isLowerBetter: true },
  { key: 'leadTime', metric: 'Lead Time (days)', isLowerBetter: true },
  { key: 'reliability', metric: 'Reliability (%)', isLowerBetter: false },
  { key: 'responseSpeed', metric: 'Response Speed', isLowerBetter: false },
  { key: 'verified', metric: 'Verified Supplier', isLowerBetter: false },
];

/**
 * Hybrid comparison scoring result
 */
export interface HybridScoreResult {
  columnScores: Record<string, number>;
  bestColumnId: string | null;
  confidence: 'high' | 'medium' | 'low';
  dataBreakdown: {
    liveDataPoints: number;
    manualDataPoints: number;
    totalDataPoints: number;
  };
}

/**
 * Export data format for hybrid comparisons
 */
export interface HybridCompareExportData {
  rfqNumber?: string;
  itemName?: string;
  columns: HybridCompareColumn[];
  rows: HybridCompareRow[];
  bestColumnId?: string | null;
  exportDate: string;
}

// =============================================================================
// Conversion Utilities
// =============================================================================

/**
 * Convert supplier quotes array to hybrid comparison columns
 */
export function quotesToHybridColumns(quotes: SupplierQuote[]): HybridCompareColumn[] {
  return quotes.map((quote) => ({
    id: `col-${quote.supplierId}`,
    name: quote.supplierName,
    source: 'live' as ComparisonDataSource,
    supplierId: quote.supplierId,
    supplierName: quote.supplierName,
    isVerified: quote.verified,
    responseSpeed: quote.responseSpeed,
    lastUpdated: quote.quotedAt,
  }));
}

/**
 * Convert supplier quotes to hybrid comparison rows with populated values
 */
export function quotesToHybridRows(
  quotes: SupplierQuote[],
  currency: string
): HybridCompareRow[] {
  const rows: HybridCompareRow[] = [];

  // Price row
  rows.push({
    id: 'row-price',
    metric: 'Price',
    metricKey: 'price',
    rowType: 'system',
    isLowerBetter: true,
    values: Object.fromEntries(
      quotes.map((q) => [
        `col-${q.supplierId}`,
        {
          value: `${currency} ${q.quotedPrice.toLocaleString()}`,
          numericValue: q.quotedPrice,
          source: 'live' as ComparisonDataSource,
          originalValue: `${currency} ${q.quotedPrice.toLocaleString()}`,
        },
      ])
    ),
  });

  // Lead Time row
  rows.push({
    id: 'row-leadTime',
    metric: 'Lead Time (days)',
    metricKey: 'leadTime',
    rowType: 'system',
    isLowerBetter: true,
    values: Object.fromEntries(
      quotes.map((q) => [
        `col-${q.supplierId}`,
        {
          value: `${q.leadTimeDays} days`,
          numericValue: q.leadTimeDays,
          source: 'live' as ComparisonDataSource,
          originalValue: `${q.leadTimeDays} days`,
        },
      ])
    ),
  });

  // Reliability row
  rows.push({
    id: 'row-reliability',
    metric: 'Reliability (%)',
    metricKey: 'reliability',
    rowType: 'system',
    isLowerBetter: false,
    values: Object.fromEntries(
      quotes.map((q) => [
        `col-${q.supplierId}`,
        {
          value: `${q.reliability}%`,
          numericValue: q.reliability,
          source: 'live' as ComparisonDataSource,
          originalValue: `${q.reliability}%`,
        },
      ])
    ),
  });

  // Response Speed row
  rows.push({
    id: 'row-responseSpeed',
    metric: 'Response Speed',
    metricKey: 'responseSpeed',
    rowType: 'system',
    isLowerBetter: false,
    values: Object.fromEntries(
      quotes.map((q) => {
        const speedScore = q.responseSpeed === 'fast' ? 3 : q.responseSpeed === 'moderate' ? 2 : 1;
        return [
          `col-${q.supplierId}`,
          {
            value: q.responseSpeed.charAt(0).toUpperCase() + q.responseSpeed.slice(1),
            numericValue: speedScore,
            source: 'live' as ComparisonDataSource,
            originalValue: q.responseSpeed,
          },
        ];
      })
    ),
  });

  // Verified Supplier row
  rows.push({
    id: 'row-verified',
    metric: 'Verified Supplier',
    metricKey: 'verified',
    rowType: 'system',
    isLowerBetter: false,
    values: Object.fromEntries(
      quotes.map((q) => [
        `col-${q.supplierId}`,
        {
          value: q.verified ? 'Yes' : 'No',
          numericValue: q.verified ? 1 : 0,
          source: 'live' as ComparisonDataSource,
          originalValue: q.verified ? 'Yes' : 'No',
        },
      ])
    ),
  });

  return rows;
}

/**
 * Create a complete hybrid comparison data set from supplier quotes
 */
export function quotesToHybridData(
  quotes: SupplierQuote[],
  currency: string,
  rfqInfo?: { rfqId: string; rfqNumber?: string; itemName?: string }
): HybridComparisonData {
  return {
    rfqId: rfqInfo?.rfqId,
    rfqNumber: rfqInfo?.rfqNumber,
    itemName: rfqInfo?.itemName,
    columns: quotesToHybridColumns(quotes),
    rows: quotesToHybridRows(quotes, currency),
    hasLiveData: quotes.length > 0,
    hasManualData: false,
    lastRefreshed: new Date().toISOString(),
  };
}

/**
 * Create an empty manual column
 */
export function createManualColumn(index: number): HybridCompareColumn {
  return {
    id: `col-manual-${Date.now()}`,
    name: `Option ${String.fromCharCode(65 + index)}`, // A, B, C...
    source: 'manual',
  };
}

/**
 * Create an empty custom row
 */
export function createCustomRow(): HybridCompareRow {
  return {
    id: `row-custom-${Date.now()}`,
    metric: 'New Metric',
    rowType: 'custom',
    isLowerBetter: false,
    values: {},
  };
}

/**
 * Check if a comparison has mixed data sources
 */
export function hasMixedSources(data: HybridComparisonData): boolean {
  return data.hasLiveData && data.hasManualData;
}

/**
 * Count data points by source
 */
export function countDataPoints(data: HybridComparisonData): {
  live: number;
  manual: number;
  total: number;
} {
  let live = 0;
  let manual = 0;

  data.rows.forEach((row) => {
    Object.values(row.values).forEach((cell) => {
      if (cell.value && cell.value.trim() !== '') {
        if (cell.source === 'live') {
          live++;
        } else {
          manual++;
        }
      }
    });
  });

  return { live, manual, total: live + manual };
}
