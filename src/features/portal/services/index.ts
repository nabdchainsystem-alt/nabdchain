// Portal Services
export { itemService } from './itemService';
export { orderService } from './orderService';
export { dashboardService } from './dashboardService';
export { customerService } from './customerService';
export { inventoryService } from './inventoryService';
export { expenseService } from './expenseService';
export { sellerRfqInboxService } from './sellerRfqInboxService';
export { quoteService } from './quoteService';
export { marketplaceOrderService } from './marketplaceOrderService';
export { notificationService } from './notificationService';
export { orderTimelineApiService, generateMockTimeline } from './orderTimelineService';
export type { DashboardSummary } from './dashboardService';
export type { Customer, CustomerDetails, CustomerOrder, CustomerFilters } from './customerService';
export type { InventoryItem, InventoryFilters, InventorySummary, StockAdjustment } from './inventoryService';
export type { Expense, ExpenseType, ExpenseFilters, ExpenseSummary, CreateExpenseInput } from './expenseService';

// Comparison services
// Export comparisonExportService (excluding types that are also in compareScoringService)
export {
  exportComparisonToPDF,
  exportComparisonToExcel,
  exportManualCompareToPDF,
  exportManualCompareToExcel,
  exportHybridCompareToPDF,
  exportHybridCompareToExcel,
  parseCSVToCompare,
  getSampleCSVTemplate,
} from './comparisonExportService';
export type {
  ComparisonExportItem,
  ComparisonExportData,
  ManualCompareExportData,
  ParsedImportData,
  HybridCompareExportData,
} from './comparisonExportService';

// Export compareScoringService (including ManualCompareColumn/Row types)
export * from './compareScoringService';

// Export comparisonSetService
export * from './comparisonSetService';
// Hybrid comparison service - export specific functions to avoid conflicts
export {
  initializeFromQuotes,
  initializeEmpty,
  addManualColumn,
  removeColumn,
  updateColumnName,
  addCustomRow,
  removeRow,
  updateRowMetric,
  toggleRowScoring,
  updateCellValue,
  importCSVToHybrid,
  validateHybridData,
  getDataQuality,
} from './hybridComparisonService';
