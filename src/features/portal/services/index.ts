// Portal Services
export { itemService } from './itemService';
export { orderService } from './orderService';
export { dashboardService } from './dashboardService';
export { customerService } from './customerService';
export { inventoryService } from './inventoryService';
export { expenseService } from './expenseService';
export type { DashboardSummary } from './dashboardService';
export type { Customer, CustomerDetails, CustomerOrder, CustomerFilters } from './customerService';
export type { InventoryItem, InventoryFilters, InventorySummary, StockAdjustment } from './inventoryService';
export type { Expense, ExpenseType, ExpenseFilters, ExpenseSummary, CreateExpenseInput } from './expenseService';
