// =============================================================================
// Payout Types - Stage 8: Automation, Payouts & Scale
// =============================================================================

export type PayoutStatus = 'pending' | 'processing' | 'settled' | 'on_hold' | 'failed';

export interface SellerPayout {
  id: string;
  payoutNumber: string;
  sellerId: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  platformFeeTotal: number;
  adjustments: number;
  netAmount: number;
  currency: string;
  status: PayoutStatus;
  holdReason?: string | null;
  holdUntil?: string | null;
  bankName: string;
  accountHolder: string;
  ibanMasked: string;
  initiatedAt?: string | null;
  initiatedBy?: string | null;
  settledAt?: string | null;
  bankReference?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: PayoutLineItem[];
  events?: PayoutEvent[];
}

export interface PayoutLineItem {
  id: string;
  payoutId: string;
  invoiceId: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceTotal: number;
  platformFee: number;
  netAmount: number;
  paidAt?: string | null;
}

export interface PayoutEvent {
  id: string;
  payoutId: string;
  actorId?: string | null;
  actorType: 'seller' | 'system' | 'admin';
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PayoutSettings {
  id: string;
  sellerId: string;
  payoutFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  payoutDay?: number | null;
  minPayoutAmount: number;
  disputeHoldEnabled: boolean;
  holdPeriodDays: number;
  autoPayoutEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePayoutSettingsInput {
  payoutFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  payoutDay?: number;
  minPayoutAmount?: number;
  disputeHoldEnabled?: boolean;
  holdPeriodDays?: number;
  autoPayoutEnabled?: boolean;
}

export interface PayoutFilters {
  status?: PayoutStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PayoutStats {
  totalPaid: number;
  totalPending: number;
  totalOnHold: number;
  payoutsThisMonth: number;
  averagePayoutAmount: number;
  platformFeesTotal: number;
  currency: string;
}

export interface EligiblePayout {
  eligibleAmount: number;
  eligibleInvoices: number;
  pendingAmount: number;
  onHoldAmount: number;
  nextPayoutDate?: string | null;
  bankVerified: boolean;
  currency: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PayoutsResponse {
  payouts: SellerPayout[];
  pagination: Pagination;
}

// Payout status colors
export const PAYOUT_STATUS_COLORS: Record<PayoutStatus, string> = {
  pending: 'text-yellow-600 bg-yellow-100',
  processing: 'text-blue-600 bg-blue-100',
  settled: 'text-green-600 bg-green-100',
  on_hold: 'text-orange-600 bg-orange-100',
  failed: 'text-red-600 bg-red-100',
};

// Payout status labels
export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  settled: 'Settled',
  on_hold: 'On Hold',
  failed: 'Failed',
};

// Payout frequency labels
export const PAYOUT_FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
};
