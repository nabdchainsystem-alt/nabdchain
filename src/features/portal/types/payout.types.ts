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
  // Enhanced fields for trust UX
  holdPeriodDays?: number;
  minPayoutAmount?: number;
  payoutSchedule?: string;
  withdrawalDisabledReason?: string | null;
}

// Timeline entry for funds flow visualization
export interface FundsTimelineEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: 'order_completed' | 'funds_held' | 'eligible' | 'paid';
  date: string;
  holdEndDate?: string | null;
  payoutId?: string | null;
  payoutNumber?: string | null;
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

// Payout status labels - Simple, clear language
export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: 'Scheduled',
  processing: 'Processing',
  settled: 'Paid',
  on_hold: 'On Hold',
  failed: 'Failed',
};

// Simple microcopy for status explanations
export const PAYOUT_STATUS_MICROCOPY: Record<PayoutStatus, string> = {
  pending: 'Scheduled for next cycle',
  processing: 'Being sent to your bank',
  settled: 'Paid to your bank',
  on_hold: 'On hold',
  failed: 'Payment failed',
};

// Payout frequency labels
export const PAYOUT_FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
};

// Timeline status labels - clear, calm language
export const TIMELINE_STATUS_LABELS: Record<string, string> = {
  order_completed: 'Order Completed',
  funds_held: 'Funds Held',
  eligible: 'Eligible for Payout',
  paid: 'Paid',
};

// Timeline status microcopy - trust-focused messaging
export const TIMELINE_STATUS_MICROCOPY: Record<string, string> = {
  order_completed: 'Delivery confirmed by buyer',
  funds_held: 'Funds are securely held',
  eligible: 'Available after delivery confirmation',
  paid: 'Paid to your bank account',
};

// Trust microcopy constants
export const TRUST_MICROCOPY = {
  fundsSecurelyHeld: 'Funds are securely held',
  availableAfterDelivery: 'Available after delivery confirmation',
  paidToBankAccount: 'Paid to your bank account',
  nextPayoutScheduled: 'Your next payout is scheduled',
  bankVerificationNeeded: 'Verify your bank account to receive payouts',
  belowMinimum: 'Below minimum payout threshold',
  noEligibleFunds: 'No eligible funds at this time',
  processingToBank: 'Being sent to your bank',
} as const;

// =============================================================================
// Enhanced Balance Breakdown Types
// =============================================================================

export interface BalanceBreakdown {
  available: {
    amount: number;
    invoiceCount: number;
    description: string;
  };
  pending: {
    amount: number;
    payoutCount: number;
    description: string;
  };
  onHold: {
    amount: number;
    payoutCount: number;
    reasons: HoldReasonSummary[];
    description: string;
  };
  currency: string;
  lastUpdated: string;
}

// =============================================================================
// Hold Reason Types - Categorized for clarity
// =============================================================================

export type HoldReasonCategory =
  | 'dispute'           // Active dispute on the order
  | 'verification'      // Pending verification (bank, identity, etc.)
  | 'review'            // Manual review required
  | 'compliance'        // Compliance/regulatory hold
  | 'system'            // System-initiated hold
  | 'other';            // Other reasons

export interface HoldReasonSummary {
  category: HoldReasonCategory;
  label: string;
  description: string;
  amount: number;
  payoutCount: number;
  expectedReleaseDate?: string | null;
  actionRequired?: string | null;
}

export const HOLD_REASON_LABELS: Record<HoldReasonCategory, string> = {
  dispute: 'Dispute Under Review',
  verification: 'Pending Verification',
  review: 'Manual Review',
  compliance: 'Compliance Hold',
  system: 'System Hold',
  other: 'Temporary Hold',
};

export const HOLD_REASON_DESCRIPTIONS: Record<HoldReasonCategory, string> = {
  dispute: 'A buyer has opened a dispute. Funds held until resolution.',
  verification: 'Additional verification required before release.',
  review: 'Our team is reviewing this payout.',
  compliance: 'Held for regulatory compliance review.',
  system: 'Automatically held by the system.',
  other: 'Temporarily held. Contact support for details.',
};

export const HOLD_REASON_COLORS: Record<HoldReasonCategory, { bg: string; text: string }> = {
  dispute: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444' },
  verification: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
  review: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6' },
  compliance: { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6' },
  system: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280' },
  other: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280' },
};

// =============================================================================
// Audit Trail Types - Detailed event history
// =============================================================================

export interface AuditTrailEvent {
  id: string;
  payoutId: string;
  timestamp: string;
  eventType: PayoutEventType;
  actor: {
    type: 'seller' | 'system' | 'admin';
    id?: string | null;
    name?: string | null;
  };
  fromStatus?: PayoutStatus | null;
  toStatus?: PayoutStatus | null;
  details: string;
  metadata?: Record<string, unknown> | null;
}

export type PayoutEventType =
  | 'PAYOUT_CREATED'
  | 'PAYOUT_APPROVED'
  | 'PAYOUT_PROCESSING'
  | 'PAYOUT_SETTLED'
  | 'PAYOUT_FAILED'
  | 'PAYOUT_ON_HOLD'
  | 'PAYOUT_RELEASED'
  | 'BANK_TRANSFER_INITIATED'
  | 'BANK_TRANSFER_CONFIRMED'
  | 'HOLD_REASON_UPDATED'
  | 'RETRY_SCHEDULED';

export const PAYOUT_EVENT_LABELS: Record<PayoutEventType, string> = {
  PAYOUT_CREATED: 'Payout Created',
  PAYOUT_APPROVED: 'Payout Approved',
  PAYOUT_PROCESSING: 'Processing Started',
  PAYOUT_SETTLED: 'Payout Completed',
  PAYOUT_FAILED: 'Payout Failed',
  PAYOUT_ON_HOLD: 'Placed on Hold',
  PAYOUT_RELEASED: 'Hold Released',
  BANK_TRANSFER_INITIATED: 'Bank Transfer Initiated',
  BANK_TRANSFER_CONFIRMED: 'Bank Transfer Confirmed',
  HOLD_REASON_UPDATED: 'Hold Reason Updated',
  RETRY_SCHEDULED: 'Retry Scheduled',
};

export const PAYOUT_EVENT_ICONS: Record<PayoutEventType, string> = {
  PAYOUT_CREATED: 'plus',
  PAYOUT_APPROVED: 'check',
  PAYOUT_PROCESSING: 'arrow-right',
  PAYOUT_SETTLED: 'check-circle',
  PAYOUT_FAILED: 'x-circle',
  PAYOUT_ON_HOLD: 'pause',
  PAYOUT_RELEASED: 'play',
  BANK_TRANSFER_INITIATED: 'bank',
  BANK_TRANSFER_CONFIRMED: 'check',
  HOLD_REASON_UPDATED: 'info',
  RETRY_SCHEDULED: 'clock',
};

// =============================================================================
// Expected Payout Date Types
// =============================================================================

export interface ExpectedPayoutInfo {
  date: string;
  isEstimate: boolean;
  confidence: 'high' | 'medium' | 'low';
  factors: ExpectedPayoutFactor[];
  explanation: string;
}

export interface ExpectedPayoutFactor {
  type: 'hold_period' | 'schedule' | 'minimum' | 'dispute' | 'verification';
  description: string;
  impactDays?: number;
  resolved: boolean;
}

export const EXPECTED_DATE_CONFIDENCE_LABELS: Record<string, string> = {
  high: 'Scheduled',
  medium: 'Estimated',
  low: 'Approximate',
};
