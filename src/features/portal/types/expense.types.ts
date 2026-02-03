// =============================================================================
// Buyer Expense Analytics Types - Financial Control Center
// =============================================================================

/**
 * Expense category with budget allocation
 */
export interface ExpenseCategory {
  id: string;
  name: string;
  nameAr?: string;
  budget: number;
  actual: number;
  variance: number; // actual - budget (negative = under budget)
  variancePercent: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  itemCount: number;
}

/**
 * Spend Leakage Detection
 * Identifies unauthorized, duplicate, or out-of-policy purchases
 */
export interface SpendLeakage {
  id: string;
  type: 'unauthorized' | 'duplicate' | 'out_of_policy' | 'maverick' | 'price_variance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  amount: number;
  description: string;
  descriptionAr?: string;
  supplierId?: string;
  supplierName?: string;
  category: string;
  detectedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  purchaseOrderId?: string;
  poNumber?: string;
}

/**
 * Supplier Price Drift Alert
 * Tracks price changes from suppliers over time
 */
export interface PriceDriftAlert {
  id: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  sku?: string;
  category: string;
  previousPrice: number;
  currentPrice: number;
  priceChange: number; // absolute change
  priceChangePercent: number;
  currency: string;
  direction: 'up' | 'down';
  marketAverage?: number; // for comparison
  marketVariance?: number; // how far from market average
  detectedAt: string;
  lastPurchaseDate?: string;
  status: 'new' | 'acknowledged' | 'negotiating' | 'resolved';
}

/**
 * Budget vs Actual tracking by period
 */
export interface BudgetActual {
  period: string; // e.g., "2024-01", "Q1 2024"
  periodLabel: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
  committed: number; // approved POs not yet paid
  available: number; // budget - actual - committed
}

/**
 * Category inefficiency metrics
 */
export interface CategoryInefficiency {
  category: string;
  categoryAr?: string;
  inefficiencyScore: number; // 0-100, higher = more inefficient
  factors: {
    factor: string;
    factorAr?: string;
    impact: 'low' | 'medium' | 'high';
    value: number;
    benchmark: number;
    description: string;
  }[];
  potentialSavings: number;
  recommendations: string[];
  recommendationsAr?: string[];
}

/**
 * Expense line item for drill-down
 */
export interface ExpenseLineItem {
  id: string;
  date: string;
  category: string;
  subcategory?: string;
  supplierId: string;
  supplierName: string;
  description: string;
  poNumber?: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  approvedBy?: string;
  tags?: string[];
  hasAnomaly?: boolean;
  anomalyType?: string;
}

/**
 * Expense Summary KPIs
 */
export interface ExpenseSummaryKPIs {
  totalSpend: number;
  totalBudget: number;
  budgetUtilization: number; // percentage
  avgTransactionSize: number;
  transactionCount: number;
  suppliersUsed: number;
  leakageAmount: number;
  leakageCount: number;
  priceDriftImpact: number; // estimated extra cost from price increases
  currency: string;
  periodComparison: {
    previousPeriod: number;
    change: number;
    changePercent: number;
  };
}

/**
 * Complete Expense Analytics Dashboard Data
 */
export interface ExpenseAnalyticsDashboard {
  summary: ExpenseSummaryKPIs;
  budgetTrend: BudgetActual[];
  categoryBreakdown: ExpenseCategory[];
  leakages: SpendLeakage[];
  priceDrifts: PriceDriftAlert[];
  inefficiencies: CategoryInefficiency[];
  recentTransactions: ExpenseLineItem[];
}

/**
 * Expense filter options
 */
export interface ExpenseFilters {
  period?: 'week' | 'month' | 'quarter' | 'year';
  category?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get severity color configuration
 */
export const getSeverityConfig = (severity: SpendLeakage['severity']) => {
  const configs = {
    low: { color: 'info', label: 'Low', labelAr: 'منخفض' },
    medium: { color: 'warning', label: 'Medium', labelAr: 'متوسط' },
    high: { color: 'error', label: 'High', labelAr: 'مرتفع' },
    critical: { color: 'error', label: 'Critical', labelAr: 'حرج' },
  };
  return configs[severity];
};

/**
 * Get leakage type configuration
 */
export const getLeakageTypeConfig = (type: SpendLeakage['type']) => {
  const configs = {
    unauthorized: { label: 'Unauthorized Purchase', labelAr: 'شراء غير مصرح' },
    duplicate: { label: 'Duplicate Payment', labelAr: 'دفعة مكررة' },
    out_of_policy: { label: 'Out of Policy', labelAr: 'خارج السياسة' },
    maverick: { label: 'Maverick Spend', labelAr: 'إنفاق منفرد' },
    price_variance: { label: 'Price Variance', labelAr: 'تباين السعر' },
  };
  return configs[type];
};

/**
 * Calculate inefficiency score factors
 */
export const calculateInefficiencyScore = (
  priceVariance: number,
  deliveryIssues: number,
  supplierConcentration: number,
  paymentDelays: number
): number => {
  // Weighted scoring: price (40%), delivery (25%), concentration (20%), payment (15%)
  return Math.min(100, Math.round(
    priceVariance * 0.4 +
    deliveryIssues * 0.25 +
    supplierConcentration * 0.2 +
    paymentDelays * 0.15
  ));
};

/**
 * Format currency with proper locale
 */
export const formatExpenseAmount = (
  amount: number,
  currency: string,
  locale: string = 'en'
): string => {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatter.format(amount)}`;
};

/**
 * Calculate variance status
 */
export const getVarianceStatus = (variancePercent: number): {
  status: 'good' | 'warning' | 'critical';
  label: string;
} => {
  if (variancePercent <= 0) {
    return { status: 'good', label: 'Under Budget' };
  } else if (variancePercent <= 10) {
    return { status: 'warning', label: 'Near Budget' };
  } else {
    return { status: 'critical', label: 'Over Budget' };
  }
};
