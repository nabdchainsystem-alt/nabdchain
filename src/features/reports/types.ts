// =============================================================================
// REPORTS & EXPORT TYPES
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface Report {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  config: ReportConfig;
  isPublic: boolean;
  schedule?: ReportSchedule;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportConfig {
  dataSources: DataSource[];
  widgets: ReportWidget[];
  filters: ReportFilter[];
  layout: {
    type: 'grid' | 'freeform';
    columns?: number;
  };
  theme?: {
    primaryColor: string;
    fontFamily: string;
  };
}

export interface DataSource {
  id: string;
  type: 'board' | 'timeEntries' | 'users' | 'custom';
  boardIds?: string[];
  filters?: ReportFilter[];
  aggregations?: Aggregation[];
}

export interface ReportWidget {
  id: string;
  type: WidgetType;
  title?: string;
  dataSourceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export type WidgetType =
  | 'table'
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'number'
  | 'gauge'
  | 'timeline'
  | 'kanban_summary';

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in';
  value: unknown;
}

export interface Aggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
  alias?: string;
}

export interface ReportSchedule {
  id: string;
  reportId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // "09:00"
  timezone: string;
  recipients: string[];
  format: ExportFormat;
  active: boolean;
  lastSent?: Date;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  scope: 'board' | 'view' | 'selected' | 'report';
  boardId?: string;
  viewType?: string;
  selectedIds?: string[];
  includeAttachments: boolean;
  includeComments: boolean;
  includeActivity: boolean;
  dateRange?: { start: Date; end: Date };
  columns?: string[];
  groupBy?: string;
}

export interface ExportResult {
  url: string;
  fileName: string;
  size: number;
  expiresAt: Date;
}
