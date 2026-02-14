// =============================================================================
// Invoice & Payment System Types (Stage 6)
// =============================================================================

// =============================================================================
// Invoice Types
// =============================================================================

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
export type PaymentTerms = 'NET_0' | 'NET_7' | 'NET_14' | 'NET_30';

export interface InvoiceLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface MarketplaceInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;

  sellerId: string;
  buyerId: string;

  // Seller snapshot
  sellerName: string;
  sellerCompany?: string;
  sellerVatNumber?: string;
  sellerAddress?: string;

  // Buyer snapshot
  buyerName: string;
  buyerCompany?: string;
  buyerAddress?: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // Amounts
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;

  // Platform fees
  platformFeeRate?: number;
  platformFeeAmount?: number;
  netToSeller?: number;

  // Status
  status: InvoiceStatus;

  // Payment terms
  paymentTerms?: PaymentTerms;
  dueDate?: string;

  // Notes
  notes?: string;
  termsAndConditions?: string;

  // Timestamps
  issuedAt?: string;
  issuedBy?: string;
  paidAt?: string;
  overdueAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;

  // Computed fields from API
  paidAmount?: number;
  balanceDue?: number;

  // Relations
  payments?: MarketplacePayment[];
  events?: InvoiceEvent[];
}

export interface InvoiceStats {
  total: number;
  draft: number;
  issued: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  currency: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  overdueOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface InvoicesResponse {
  invoices: MarketplaceInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InvoiceEvent {
  id: string;
  invoiceId: string;
  actorId?: string;
  actorType: 'buyer' | 'seller' | 'system';
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// =============================================================================
// Payment Types
// =============================================================================

export type PaymentStatus = 'pending' | 'confirmed' | 'failed';
export type PaymentMethod = 'bank_transfer' | 'card' | 'wallet' | 'cod' | 'credit';

export interface MarketplacePayment {
  id: string;
  paymentNumber: string;
  invoiceId?: string | null;
  orderId: string;

  buyerId: string;
  sellerId: string;

  amount: number;
  currency: string;

  paymentMethod: PaymentMethod;
  bankReference?: string;
  bankName?: string;

  status: PaymentStatus;

  confirmedAt?: string;
  confirmedBy?: string;
  confirmationNote?: string;

  failedAt?: string;
  failureReason?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  invoice?: {
    invoiceNumber: string;
    orderNumber: string;
    buyerName?: string;
    sellerName?: string;
    totalAmount: number;
    status: InvoiceStatus;
  };
}

export interface PaymentFilters {
  status?: PaymentStatus;
  invoiceId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaymentsResponse {
  payments: MarketplacePayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RecordPaymentData {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankReference?: string;
  bankName?: string;
}

export interface RecordOrderPaymentData {
  method: PaymentMethod;
  reference: string;
  amount?: number;
  bankName?: string;
  notes?: string;
}

export interface ConfirmPaymentData {
  confirmationNote?: string;
}

export interface FailPaymentData {
  reason: string;
}

// =============================================================================
// Display Helpers
// =============================================================================

export function getInvoiceStatusConfig(status: InvoiceStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'info' | 'success' | 'error' | 'muted';
  bgColor: string;
  textColor: string;
} {
  const configs: Record<InvoiceStatus, ReturnType<typeof getInvoiceStatusConfig>> = {
    draft: {
      label: 'Draft',
      labelKey: 'invoice.statusDraft',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
    },
    issued: {
      label: 'Issued',
      labelKey: 'invoice.statusIssued',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
    paid: {
      label: 'Paid',
      labelKey: 'invoice.statusPaid',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
    },
    overdue: {
      label: 'Overdue',
      labelKey: 'invoice.statusOverdue',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
    },
    cancelled: {
      label: 'Cancelled',
      labelKey: 'invoice.statusCancelled',
      color: 'muted',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-700 dark:text-gray-400',
    },
  };
  return configs[status];
}

export function getPaymentStatusConfig(status: PaymentStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'success' | 'error';
  bgColor: string;
  textColor: string;
} {
  const configs: Record<PaymentStatus, ReturnType<typeof getPaymentStatusConfig>> = {
    pending: {
      label: 'Pending',
      labelKey: 'payment.statusPending',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
    },
    confirmed: {
      label: 'Confirmed',
      labelKey: 'payment.statusConfirmed',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
    },
    failed: {
      label: 'Failed',
      labelKey: 'payment.statusFailed',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
    },
  };
  return configs[status];
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    bank_transfer: 'Bank Transfer',
    card: 'Credit/Debit Card',
    wallet: 'Digital Wallet',
    cod: 'Cash on Delivery',
    credit: 'Credit / Pay Later',
  };
  return labels[method];
}

export function getPaymentTermsLabel(terms: PaymentTerms): string {
  const labels: Record<PaymentTerms, string> = {
    NET_0: 'Due Immediately',
    NET_7: 'Net 7 Days',
    NET_14: 'Net 14 Days',
    NET_30: 'Net 30 Days',
  };
  return labels[terms];
}

/**
 * Check if invoice is overdue based on due date
 */
export function isInvoiceOverdue(invoice: Pick<MarketplaceInvoice, 'status' | 'dueDate'>): boolean {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
  if (!invoice.dueDate) return false;
  return new Date(invoice.dueDate) < new Date();
}

/**
 * Calculate days until due date (negative if overdue)
 */
export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format currency amount
 */
export function formatInvoiceAmount(amount: number, currency: string = 'SAR'): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
