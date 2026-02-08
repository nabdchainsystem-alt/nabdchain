export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'radar'
  | 'funnel'
  | 'gauge'
  | 'treemap';

export type AggregationFn = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface ChartBuilderConfig {
  title: string;
  chartType: ChartType;
  xAxisColumnId: string; // The grouping column (Dimension)
  yAxisColumnId: string; // The metric column
  aggregation: AggregationFn;
  filter?: {
    columnId: string;
    operator: string;
    value: unknown;
  }[];
  includedRowIds?: string[];
}

export interface ChartValidationError {
  isValid: boolean;
  message?: string;
}

export type ChartCategory = 'comparison' | 'trend' | 'composition' | 'distribution';

export const CHART_CATEGORIES: Record<ChartCategory, { label: string; types: ChartType[] }> = {
  comparison: { label: 'Comparison', types: ['bar'] },
  trend: { label: 'Trend', types: ['line', 'area'] },
  composition: { label: 'Composition', types: ['pie', 'doughnut'] },
  distribution: { label: 'Distribution', types: ['scatter'] },
};
