// =============================================================================
// Buyer Workspace Service - Frontend API Client
// =============================================================================

import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types
// =============================================================================

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  buyerId: string;
  supplierId?: string;
  supplierName: string;
  totalAmount: number;
  currency: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDelivery?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'approved' | 'delivered' | 'cancelled';

export interface Supplier {
  id: string;
  buyerId: string;
  name: string;
  country?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  buyerId: string;
  productName: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export type InventoryStatus = 'ok' | 'low' | 'critical';

export interface Expense {
  id: string;
  buyerId: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  purchaseOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'shipping' | 'customs' | 'storage' | 'other';

export interface ExpenseSummary {
  monthlyTotal: number;
  byCategory: { category: string; amount: number }[];
}

// =============================================================================
// Predictive Intelligence Types - Inventory
// =============================================================================

export interface StockForecast {
  daysUntilStockout: number;
  depletionRatePerDay: number;
  suggestedReorderDate: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  basedOnDays: number;
}

export interface SupplierOption {
  supplierId: string;
  supplierName: string;
  lastUnitPrice: number;
  avgDeliveryDays: number;
  rating: number;
  inStock: boolean;
  minOrderQty: number;
  currency: string;
}

export interface CostImpactSimulation {
  currentUnitCost: number;
  projectedUnitCost: number;
  recommendedQty: number;
  totalCost: number;
  potentialSavings: number;
  savingsPercent: number;
  bestSupplier: string;
}

export interface InventoryItemWithForecast extends InventoryItem {
  forecast: StockForecast;
  supplierOptions: SupplierOption[];
  costSimulation: CostImpactSimulation;
  avgDailyUsage: number;
  lastRestockDate?: string;
  pendingOrderQty: number;
}

export type ForecastSeverity = 'critical' | 'warning' | 'ok';

export interface InventoryAlert {
  id: string;
  itemId: string;
  productName: string;
  type: 'stockout_imminent' | 'reorder_now' | 'price_increase' | 'supplier_delay';
  severity: ForecastSeverity;
  message: string;
  createdAt: string;
  actionRequired: boolean;
}

// =============================================================================
// Predictive Intelligence Types - Expenses
// =============================================================================

export interface SpendLeakage {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
  detectedAt: string;
  recommendation: string;
}

export interface PriceDriftAlert {
  id: string;
  supplierId: string;
  supplierName: string;
  itemName: string;
  previousPrice: number;
  currentPrice: number;
  driftPercent: number;
  driftDirection: 'up' | 'down';
  periodDays: number;
  currency: string;
}

export interface BudgetVsActual {
  category: ExpenseCategory;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'on_track' | 'over';
  trend: 'improving' | 'stable' | 'worsening';
}

export interface CategoryInefficiency {
  category: ExpenseCategory;
  inefficiencyScore: number;
  topIssues: string[];
  recommendations: string[];
  potentialSavings: number;
  currency: string;
}

export interface EnhancedExpenseSummary extends ExpenseSummary {
  leakages: SpendLeakage[];
  priceDriftAlerts: PriceDriftAlert[];
  budgetComparison: BudgetVsActual[];
  categoryInefficiencies: CategoryInefficiency[];
  totalPotentialSavings: number;
  savingsCurrency: string;
  healthScore: number;
}

export interface CreatePurchaseOrderData {
  supplierName: string;
  supplierId?: string;
  totalAmount: number;
  currency?: string;
  expectedDelivery?: string;
  notes?: string;
  items?: {
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface CreateSupplierData {
  name: string;
  country?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
}

export interface CreateInventoryData {
  productName: string;
  sku: string;
  quantity: number;
  reorderLevel?: number;
}

export interface CreateExpenseData {
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  date?: string;
  notes?: string;
  purchaseOrderId?: string;
}

// =============================================================================
// Buyer Workspace Service
// =============================================================================

export const buyerWorkspaceService = {
  // ---------------------------------------------------------------------------
  // Purchases
  // ---------------------------------------------------------------------------

  async getPurchases(filters?: {
    status?: string;
    supplierId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PurchaseOrder[]> {
    const p = new URLSearchParams();
    if (filters?.status) p.append('status', filters.status);
    if (filters?.supplierId) p.append('supplierId', filters.supplierId);
    if (filters?.search) p.append('search', filters.search);
    if (filters?.dateFrom) p.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) p.append('dateTo', filters.dateTo);
    const qs = p.toString();
    return portalApiClient.get<PurchaseOrder[]>(`/api/buyer/purchases${qs ? `?${qs}` : ''}`);
  },

  async createPurchase(data: CreatePurchaseOrderData): Promise<PurchaseOrder> {
    return portalApiClient.post<PurchaseOrder>(`/api/buyer/purchases`, data);
  },

  async updatePurchaseStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    return portalApiClient.patch<PurchaseOrder>(`/api/buyer/purchases/${id}/status`, { status });
  },

  // ---------------------------------------------------------------------------
  // Suppliers
  // ---------------------------------------------------------------------------

  async getSuppliers(filters?: { search?: string; country?: string }): Promise<Supplier[]> {
    const p = new URLSearchParams();
    if (filters?.search) p.append('search', filters.search);
    if (filters?.country) p.append('country', filters.country);
    const qs = p.toString();
    return portalApiClient.get<Supplier[]>(`/api/buyer/suppliers${qs ? `?${qs}` : ''}`);
  },

  async createSupplier(data: CreateSupplierData): Promise<Supplier> {
    return portalApiClient.post<Supplier>(`/api/buyer/suppliers`, data);
  },

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  async getInventory(filters?: { status?: string; search?: string }): Promise<InventoryItem[]> {
    const p = new URLSearchParams();
    if (filters?.status) p.append('status', filters.status);
    if (filters?.search) p.append('search', filters.search);
    const qs = p.toString();
    return portalApiClient.get<InventoryItem[]>(`/api/buyer/inventory${qs ? `?${qs}` : ''}`);
  },

  async createInventoryItem(data: CreateInventoryData): Promise<InventoryItem> {
    return portalApiClient.post<InventoryItem>(`/api/buyer/inventory`, data);
  },

  async updateInventoryItem(id: string, data: { quantity?: number; reorderLevel?: number }): Promise<InventoryItem> {
    return portalApiClient.patch<InventoryItem>(`/api/buyer/inventory/${id}`, data);
  },

  // ---------------------------------------------------------------------------
  // Expenses
  // ---------------------------------------------------------------------------

  async getExpenses(filters?: { category?: string; dateFrom?: string; dateTo?: string }): Promise<Expense[]> {
    const p = new URLSearchParams();
    if (filters?.category) p.append('category', filters.category);
    if (filters?.dateFrom) p.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) p.append('dateTo', filters.dateTo);
    const qs = p.toString();
    return portalApiClient.get<Expense[]>(`/api/buyer/expenses${qs ? `?${qs}` : ''}`);
  },

  async getExpenseSummary(): Promise<ExpenseSummary> {
    return portalApiClient.get<ExpenseSummary>(`/api/buyer/expenses/summary`);
  },

  async createExpense(data: CreateExpenseData): Promise<Expense> {
    return portalApiClient.post<Expense>(`/api/buyer/expenses`, data);
  },

  // ---------------------------------------------------------------------------
  // Predictive Intelligence - Inventory
  // ---------------------------------------------------------------------------

  async getInventoryWithForecast(filters?: { status?: string; search?: string }): Promise<InventoryItemWithForecast[]> {
    const p = new URLSearchParams();
    if (filters?.status) p.append('status', filters.status);
    if (filters?.search) p.append('search', filters.search);
    const qs = p.toString();
    try {
      return await portalApiClient.get<InventoryItemWithForecast[]>(
        `/api/buyer/inventory/forecast${qs ? `?${qs}` : ''}`,
      );
    } catch {
      return [];
    }
  },

  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    try {
      return await portalApiClient.get<InventoryAlert[]>(`/api/buyer/inventory/alerts`);
    } catch {
      return [];
    }
  },

  async simulateCostImpact(itemId: string, orderQty: number, supplierId?: string): Promise<CostImpactSimulation> {
    return portalApiClient.post<CostImpactSimulation>(`/api/buyer/inventory/${itemId}/simulate`, {
      orderQty,
      supplierId,
    });
  },

  // ---------------------------------------------------------------------------
  // Predictive Intelligence - Expenses
  // ---------------------------------------------------------------------------

  async getEnhancedExpenseSummary(): Promise<EnhancedExpenseSummary> {
    try {
      return await portalApiClient.get<EnhancedExpenseSummary>(`/api/buyer/expenses/enhanced-summary`);
    } catch {
      const basicSummary = await this.getExpenseSummary();
      return {
        ...basicSummary,
        leakages: [],
        priceDriftAlerts: [],
        budgetComparison: [],
        categoryInefficiencies: [],
        totalPotentialSavings: 0,
        savingsCurrency: 'SAR',
        healthScore: 50,
      };
    }
  },

  async getSpendLeakages(): Promise<SpendLeakage[]> {
    try {
      return await portalApiClient.get<SpendLeakage[]>(`/api/buyer/expenses/leakages`);
    } catch {
      return [];
    }
  },

  async getPriceDriftAlerts(): Promise<PriceDriftAlert[]> {
    try {
      return await portalApiClient.get<PriceDriftAlert[]>(`/api/buyer/expenses/price-drift`);
    } catch {
      return [];
    }
  },
};

export default buyerWorkspaceService;
