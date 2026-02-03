// =============================================================================
// Buyer Workspace Service - Frontend API Client
// =============================================================================

import { API_URL } from '../../../config/api';

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
  basedOnDays: number; // How many days of data used for forecast
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
  inefficiencyScore: number; // 0-100, higher is worse
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
  healthScore: number; // 0-100, higher is better
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

  async getPurchases(
    token: string,
    filters?: { status?: string; supplierId?: string; search?: string; dateFrom?: string; dateTo?: string }
  ): Promise<PurchaseOrder[]> {
    const url = new URL(`${API_URL}/buyer/purchases`);
    if (filters?.status) url.searchParams.append('status', filters.status);
    if (filters?.supplierId) url.searchParams.append('supplierId', filters.supplierId);
    if (filters?.search) url.searchParams.append('search', filters.search);
    if (filters?.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) url.searchParams.append('dateTo', filters.dateTo);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch purchases');
    }

    return response.json();
  },

  async createPurchase(token: string, data: CreatePurchaseOrderData): Promise<PurchaseOrder> {
    const response = await fetch(`${API_URL}/buyer/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create purchase order');
    }

    return response.json();
  },

  async updatePurchaseStatus(token: string, id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    const response = await fetch(`${API_URL}/buyer/purchases/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update status');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Suppliers
  // ---------------------------------------------------------------------------

  async getSuppliers(
    token: string,
    filters?: { search?: string; country?: string }
  ): Promise<Supplier[]> {
    const url = new URL(`${API_URL}/buyer/suppliers`);
    if (filters?.search) url.searchParams.append('search', filters.search);
    if (filters?.country) url.searchParams.append('country', filters.country);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch suppliers');
    }

    return response.json();
  },

  async createSupplier(token: string, data: CreateSupplierData): Promise<Supplier> {
    const response = await fetch(`${API_URL}/buyer/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create supplier');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  async getInventory(
    token: string,
    filters?: { status?: string; search?: string }
  ): Promise<InventoryItem[]> {
    const url = new URL(`${API_URL}/buyer/inventory`);
    if (filters?.status) url.searchParams.append('status', filters.status);
    if (filters?.search) url.searchParams.append('search', filters.search);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    return response.json();
  },

  async createInventoryItem(token: string, data: CreateInventoryData): Promise<InventoryItem> {
    const response = await fetch(`${API_URL}/buyer/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create inventory item');
    }

    return response.json();
  },

  async updateInventoryItem(
    token: string,
    id: string,
    data: { quantity?: number; reorderLevel?: number }
  ): Promise<InventoryItem> {
    const response = await fetch(`${API_URL}/buyer/inventory/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update inventory');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Expenses
  // ---------------------------------------------------------------------------

  async getExpenses(
    token: string,
    filters?: { category?: string; dateFrom?: string; dateTo?: string }
  ): Promise<Expense[]> {
    const url = new URL(`${API_URL}/buyer/expenses`);
    if (filters?.category) url.searchParams.append('category', filters.category);
    if (filters?.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) url.searchParams.append('dateTo', filters.dateTo);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }

    return response.json();
  },

  async getExpenseSummary(token: string): Promise<ExpenseSummary> {
    const response = await fetch(`${API_URL}/buyer/expenses/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expense summary');
    }

    return response.json();
  },

  async createExpense(token: string, data: CreateExpenseData): Promise<Expense> {
    const response = await fetch(`${API_URL}/buyer/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create expense');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Predictive Intelligence - Inventory
  // ---------------------------------------------------------------------------

  async getInventoryWithForecast(
    token: string,
    filters?: { status?: string; search?: string }
  ): Promise<InventoryItemWithForecast[]> {
    const url = new URL(`${API_URL}/buyer/inventory/forecast`);
    if (filters?.status) url.searchParams.append('status', filters.status);
    if (filters?.search) url.searchParams.append('search', filters.search);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // Fallback to basic inventory with mock forecast data
      const inventory = await this.getInventory(token, filters);
      return inventory.map((item) => this.generateMockForecast(item));
    }

    return response.json();
  },

  async getInventoryAlerts(token: string): Promise<InventoryAlert[]> {
    const response = await fetch(`${API_URL}/buyer/inventory/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // Return mock alerts based on inventory status
      return [];
    }

    return response.json();
  },

  async simulateCostImpact(
    token: string,
    itemId: string,
    orderQty: number,
    supplierId?: string
  ): Promise<CostImpactSimulation> {
    const response = await fetch(`${API_URL}/buyer/inventory/${itemId}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderQty, supplierId }),
    });

    if (!response.ok) {
      throw new Error('Failed to simulate cost impact');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Predictive Intelligence - Expenses
  // ---------------------------------------------------------------------------

  async getEnhancedExpenseSummary(token: string): Promise<EnhancedExpenseSummary> {
    const response = await fetch(`${API_URL}/buyer/expenses/enhanced-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // Fallback to basic summary with mock analytics
      const basicSummary = await this.getExpenseSummary(token);
      return this.generateMockEnhancedSummary(basicSummary);
    }

    return response.json();
  },

  async getSpendLeakages(token: string): Promise<SpendLeakage[]> {
    const response = await fetch(`${API_URL}/buyer/expenses/leakages`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  },

  async getPriceDriftAlerts(token: string): Promise<PriceDriftAlert[]> {
    const response = await fetch(`${API_URL}/buyer/expenses/price-drift`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Helper: Generate mock forecast data (for frontend-only demo)
  // ---------------------------------------------------------------------------

  generateMockForecast(item: InventoryItem): InventoryItemWithForecast {
    const avgDailyUsage = Math.max(1, Math.round(item.reorderLevel / 14)); // Estimate
    const daysUntilStockout = Math.round(item.quantity / avgDailyUsage);
    const now = new Date();
    const reorderDate = new Date(now.getTime() + (daysUntilStockout - 7) * 24 * 60 * 60 * 1000);

    return {
      ...item,
      avgDailyUsage,
      pendingOrderQty: 0,
      forecast: {
        daysUntilStockout,
        depletionRatePerDay: avgDailyUsage,
        suggestedReorderDate: reorderDate.toISOString(),
        confidenceLevel: daysUntilStockout > 30 ? 'high' : daysUntilStockout > 14 ? 'medium' : 'low',
        basedOnDays: 30,
      },
      supplierOptions: [
        {
          supplierId: 'sup-1',
          supplierName: 'Primary Supplier',
          lastUnitPrice: 45.0,
          avgDeliveryDays: 5,
          rating: 4.5,
          inStock: true,
          minOrderQty: 10,
          currency: 'SAR',
        },
        {
          supplierId: 'sup-2',
          supplierName: 'Backup Supplier',
          lastUnitPrice: 48.0,
          avgDeliveryDays: 3,
          rating: 4.2,
          inStock: true,
          minOrderQty: 5,
          currency: 'SAR',
        },
      ],
      costSimulation: {
        currentUnitCost: 45.0,
        projectedUnitCost: 44.0,
        recommendedQty: Math.max(item.reorderLevel * 2, 50),
        totalCost: Math.max(item.reorderLevel * 2, 50) * 44.0,
        potentialSavings: Math.max(item.reorderLevel * 2, 50) * 1.0,
        savingsPercent: 2.2,
        bestSupplier: 'Primary Supplier',
      },
    };
  },

  generateMockEnhancedSummary(basicSummary: ExpenseSummary): EnhancedExpenseSummary {
    return {
      ...basicSummary,
      leakages: [
        {
          id: 'leak-1',
          category: 'shipping',
          amount: 1200,
          description: 'Duplicate shipping charges detected on 3 orders',
          severity: 'medium',
          detectedAt: new Date().toISOString(),
          recommendation: 'Review shipping invoices for orders #1234, #1235, #1236',
        },
      ],
      priceDriftAlerts: [
        {
          id: 'drift-1',
          supplierId: 'sup-1',
          supplierName: 'Main Supplier Co.',
          itemName: 'Steel Bolts M10',
          previousPrice: 2.5,
          currentPrice: 2.85,
          driftPercent: 14,
          driftDirection: 'up',
          periodDays: 30,
          currency: 'SAR',
        },
      ],
      budgetComparison: [
        { category: 'shipping', budgetAmount: 5000, actualAmount: 4200, variance: -800, variancePercent: -16, status: 'under', trend: 'improving' },
        { category: 'customs', budgetAmount: 3000, actualAmount: 3400, variance: 400, variancePercent: 13.3, status: 'over', trend: 'worsening' },
        { category: 'storage', budgetAmount: 2000, actualAmount: 1900, variance: -100, variancePercent: -5, status: 'on_track', trend: 'stable' },
        { category: 'other', budgetAmount: 1000, actualAmount: 800, variance: -200, variancePercent: -20, status: 'under', trend: 'improving' },
      ],
      categoryInefficiencies: [
        {
          category: 'shipping',
          inefficiencyScore: 35,
          topIssues: ['Multiple carriers for same route', 'Non-consolidated shipments'],
          recommendations: ['Consolidate shipments weekly', 'Negotiate volume discount with primary carrier'],
          potentialSavings: 800,
          currency: 'SAR',
        },
      ],
      totalPotentialSavings: 2000,
      healthScore: 72,
    };
  },
};

export default buyerWorkspaceService;
