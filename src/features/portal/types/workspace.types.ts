// =============================================================================
// Seller Workspace Types - Execution Layer
// =============================================================================

// =============================================================================
// Invoice Types
// =============================================================================

/**
 * Invoice status
 */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Seller invoice
 */
export interface SellerInvoice {
  id: string;
  invoiceNumber: string;

  // Customer info
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;

  // Status
  status: InvoiceStatus;

  // Dates
  issueDate: string;
  dueDate?: string;
  paidAt?: string;

  // Notes
  notes?: string;
  termsAndConditions?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Create invoice data
 */
export interface CreateInvoiceData {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  lineItems: Omit<InvoiceLineItem, 'id'>[];
  vatRate?: number;
  currency?: string;
  dueDate?: string;
  notes?: string;
  termsAndConditions?: string;
}

/**
 * Update invoice data
 */
export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  status?: InvoiceStatus;
}

/**
 * Invoice filters
 */
export interface InvoiceFilters {
  status?: InvoiceStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// =============================================================================
// Stock Adjustment Types
// =============================================================================

/**
 * Stock adjustment reason
 */
export type StockAdjustmentReason =
  | 'received'
  | 'sold'
  | 'damaged'
  | 'returned'
  | 'correction'
  | 'reserved'
  | 'released'
  | 'other';

/**
 * Stock adjustment log entry
 */
export interface StockAdjustment {
  id: string;
  sellerId: string;
  itemId: string;

  // Adjustment details
  previousQty: number;
  newQty: number;
  adjustmentQty: number;
  reason: StockAdjustmentReason;
  notes?: string;

  // Reference
  referenceType?: string;
  referenceId?: string;

  // Timestamps
  createdAt: string;
  createdBy?: string;
}

/**
 * Create stock adjustment data
 */
export interface StockAdjustmentData {
  itemId: string;
  adjustmentQty: number;
  reason: StockAdjustmentReason;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * Stock adjustment filters
 */
export interface StockAdjustmentFilters {
  itemId?: string;
  reason?: StockAdjustmentReason;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Inventory item with stock status
 */
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryItem {
  id: string;
  name: string;
  nameAr?: string;
  sku: string;
  stock: number;
  minOrderQty: number;
  status: string;
  price: number;
  stockStatus: StockStatus;
}

// =============================================================================
// Cost Tag Types
// =============================================================================

/**
 * Cost type
 */
export type CostType =
  | 'purchase'
  | 'shipping'
  | 'customs'
  | 'storage'
  | 'marketing'
  | 'platform_fee'
  | 'other';

/**
 * Item cost tag
 */
export interface ItemCostTag {
  id: string;
  sellerId: string;
  itemId: string;

  // Cost details
  costType: CostType;
  amount: number;
  currency: string;
  date: string;

  // Reference
  vendor?: string;
  invoiceRef?: string;
  notes?: string;

  // For margin calculation
  quantityAffected?: number;

  // Timestamps
  createdAt: string;
}

/**
 * Create cost tag data
 */
export interface CostTagData {
  itemId: string;
  costType: CostType;
  amount: number;
  currency?: string;
  date?: string;
  vendor?: string;
  invoiceRef?: string;
  notes?: string;
  quantityAffected?: number;
}

/**
 * Cost tag filters
 */
export interface CostTagFilters {
  itemId?: string;
  costType?: CostType;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Cost summary
 */
export interface CostSummary {
  byType: Record<CostType, number>;
  total: number;
}

/**
 * Item margin calculation result
 */
export interface ItemMargin {
  itemId: string;
  itemName: string;
  listPrice: number;
  totalCost: number;
  totalRevenue: number;
  totalSold: number;
  avgCostPerUnit: number;
  avgRevenuePerUnit: number;
  marginPerUnit: number;
  marginPercent: number;
  costBreakdown: Record<string, number>;
}

// =============================================================================
// Buyer Profile Types (Seller's CRM)
// =============================================================================

/**
 * Seller's view of a buyer
 */
export interface SellerBuyerProfile {
  id: string;
  sellerId: string;
  buyerId?: string; // Null if manual entry

  // Contact info
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;

  // Tags and notes
  tags?: string[];
  notes?: string;

  // Stats
  totalOrders: number;
  totalSpend: number;
  avgOrderValue: number;
  lastOrderDate?: string;

  // Ratings
  rating?: number;        // 1-5
  paymentRating?: number; // 1-5

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Buyer profile with order history
 */
export interface SellerBuyerProfileWithOrders extends SellerBuyerProfile {
  orders: {
    id: string;
    orderNumber: string;
    itemName: string;
    quantity: number;
    totalPrice: number;
    status: string;
    createdAt: string;
  }[];
}

/**
 * Create/update buyer profile data
 */
export interface BuyerProfileData {
  buyerId?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  tags?: string[];
  notes?: string;
  rating?: number;
  paymentRating?: number;
}

/**
 * Buyer profile filters
 */
export interface BuyerProfileFilters {
  search?: string;
  rating?: number;
}

// =============================================================================
// Display Helpers
// =============================================================================

/**
 * Get invoice status display config
 */
export function getInvoiceStatusConfig(status: InvoiceStatus): {
  label: string;
  labelKey: string;
  color: 'muted' | 'info' | 'success' | 'error' | 'warning';
} {
  const configs: Record<InvoiceStatus, ReturnType<typeof getInvoiceStatusConfig>> = {
    draft: { label: 'Draft', labelKey: 'seller.workspace.invoiceDraft', color: 'muted' },
    sent: { label: 'Sent', labelKey: 'seller.workspace.invoiceSent', color: 'info' },
    paid: { label: 'Paid', labelKey: 'seller.workspace.invoicePaid', color: 'success' },
    cancelled: { label: 'Cancelled', labelKey: 'seller.workspace.invoiceCancelled', color: 'error' },
    overdue: { label: 'Overdue', labelKey: 'seller.workspace.invoiceOverdue', color: 'warning' },
  };
  return configs[status];
}

/**
 * Get stock adjustment reason display config
 */
export function getStockReasonConfig(reason: StockAdjustmentReason): {
  label: string;
  labelKey: string;
  icon: string;
  color: 'success' | 'error' | 'warning' | 'info' | 'muted';
} {
  const configs: Record<StockAdjustmentReason, ReturnType<typeof getStockReasonConfig>> = {
    received: { label: 'Received', labelKey: 'seller.workspace.stockReceived', icon: 'Plus', color: 'success' },
    sold: { label: 'Sold', labelKey: 'seller.workspace.stockSold', icon: 'Minus', color: 'info' },
    damaged: { label: 'Damaged', labelKey: 'seller.workspace.stockDamaged', icon: 'AlertTriangle', color: 'error' },
    returned: { label: 'Returned', labelKey: 'seller.workspace.stockReturned', icon: 'RotateCcw', color: 'warning' },
    correction: { label: 'Correction', labelKey: 'seller.workspace.stockCorrection', icon: 'Edit', color: 'muted' },
    reserved: { label: 'Reserved', labelKey: 'seller.workspace.stockReserved', icon: 'Lock', color: 'warning' },
    released: { label: 'Released', labelKey: 'seller.workspace.stockReleased', icon: 'Unlock', color: 'success' },
    other: { label: 'Other', labelKey: 'seller.workspace.stockOther', icon: 'MoreHorizontal', color: 'muted' },
  };
  return configs[reason];
}

/**
 * Get stock status display config
 */
export function getStockStatusConfig(status: StockStatus): {
  label: string;
  labelKey: string;
  color: 'success' | 'warning' | 'error';
} {
  const configs: Record<StockStatus, ReturnType<typeof getStockStatusConfig>> = {
    in_stock: { label: 'In Stock', labelKey: 'seller.workspace.inStock', color: 'success' },
    low_stock: { label: 'Low Stock', labelKey: 'seller.workspace.lowStock', color: 'warning' },
    out_of_stock: { label: 'Out of Stock', labelKey: 'seller.workspace.outOfStock', color: 'error' },
  };
  return configs[status];
}

/**
 * Get cost type display config
 */
export function getCostTypeConfig(costType: CostType): {
  label: string;
  labelKey: string;
  icon: string;
  color: string;
} {
  const configs: Record<CostType, ReturnType<typeof getCostTypeConfig>> = {
    purchase: { label: 'Purchase', labelKey: 'seller.workspace.costPurchase', icon: 'ShoppingCart', color: 'blue' },
    shipping: { label: 'Shipping', labelKey: 'seller.workspace.costShipping', icon: 'Truck', color: 'green' },
    customs: { label: 'Customs', labelKey: 'seller.workspace.costCustoms', icon: 'FileText', color: 'orange' },
    storage: { label: 'Storage', labelKey: 'seller.workspace.costStorage', icon: 'Archive', color: 'purple' },
    marketing: { label: 'Marketing', labelKey: 'seller.workspace.costMarketing', icon: 'Megaphone', color: 'pink' },
    platform_fee: { label: 'Platform Fee', labelKey: 'seller.workspace.costPlatformFee', icon: 'CreditCard', color: 'gray' },
    other: { label: 'Other', labelKey: 'seller.workspace.costOther', icon: 'MoreHorizontal', color: 'gray' },
  };
  return configs[costType];
}
