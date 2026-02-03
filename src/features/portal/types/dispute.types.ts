// =============================================================================
// Disputes System - Type Definitions (Stage 7)
// =============================================================================

// =============================================================================
// Dispute Status Types - Strict State Machine
// =============================================================================

/**
 * Dispute Status - Main lifecycle states
 * open -> under_review -> seller_responded -> resolved | rejected | escalated -> closed
 */
export type DisputeStatus =
  | 'open'              // Initial state - buyer filed dispute
  | 'under_review'      // Seller acknowledged and reviewing
  | 'seller_responded'  // Seller submitted response
  | 'resolved'          // Mutually resolved
  | 'rejected'          // Resolution rejected by buyer
  | 'escalated'         // Escalated to platform
  | 'closed';           // Terminal state

/**
 * Dispute Reason - Why the buyer is filing
 */
export type DisputeReason =
  | 'wrong_item'
  | 'damaged_goods'
  | 'missing_quantity'
  | 'late_delivery'
  | 'quality_issue'
  | 'other';

/**
 * Seller Response Type - How seller responds
 */
export type SellerResponseType =
  | 'accept_responsibility'  // Seller accepts fault
  | 'reject'                 // Seller rejects claim
  | 'propose_resolution';    // Seller offers compromise

/**
 * Resolution Type - Final outcome
 */
export type ResolutionType =
  | 'full_refund'
  | 'partial_refund'
  | 'replacement'
  | 'no_action'
  | 'other';

/**
 * Priority Level
 */
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

// =============================================================================
// Core Dispute Interface
// =============================================================================

export interface DisputeEvidence {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface MarketplaceDispute {
  id: string;
  disputeNumber: string;

  // References
  orderId: string;
  orderNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;

  // Parties (snapshot)
  buyerId: string;
  sellerId: string;
  buyerName: string;
  buyerEmail?: string;
  buyerCompany?: string;
  sellerName: string;
  sellerCompany?: string;

  // Item snapshot
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;

  // Dispute Details
  reason: DisputeReason;
  description: string;
  requestedResolution?: string;
  requestedAmount?: number;
  evidence: DisputeEvidence[];

  // Status
  status: DisputeStatus;
  priorityLevel: PriorityLevel;

  // SLA Deadlines
  responseDeadline?: string;
  resolutionDeadline?: string;

  // Seller Response
  sellerResponseType?: SellerResponseType;
  sellerResponse?: string;
  sellerProposedResolution?: string;
  sellerProposedAmount?: number;
  respondedAt?: string;

  // Resolution
  resolution?: ResolutionType;
  resolutionAmount?: number;
  resolvedBy?: string;
  resolutionNotes?: string;

  // Escalation
  isEscalated: boolean;
  escalatedAt?: string;
  escalationReason?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  closedAt?: string;

  // Related Return (optional)
  returnRequest?: {
    id: string;
    returnNumber: string;
    status: string;
  };
}

// =============================================================================
// Dispute Event (Audit Trail)
// =============================================================================

export type DisputeEventType =
  | 'DISPUTE_CREATED'
  | 'DISPUTE_VIEWED'
  | 'SELLER_RESPONDED'
  | 'BUYER_ACCEPTED'
  | 'BUYER_REJECTED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'EVIDENCE_ADDED'
  | 'RETURN_CREATED';

export interface DisputeEvent {
  id: string;
  disputeId: string;
  actorId?: string;
  actorType: 'buyer' | 'seller' | 'system' | 'platform';
  eventType: DisputeEventType;
  fromStatus?: string;
  toStatus?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// =============================================================================
// API Data Transfer Objects
// =============================================================================

export interface CreateDisputeData {
  orderId: string;
  reason: DisputeReason;
  description: string;
  requestedResolution?: string;
  requestedAmount?: number;
  evidence?: DisputeEvidence[];
}

export interface SellerRespondData {
  responseType: SellerResponseType;
  response: string;
  proposedResolution?: string;
  proposedAmount?: number;
}

export interface RejectResolutionData {
  reason: string;
}

export interface EscalateDisputeData {
  reason: string;
}

export interface AddEvidenceData {
  evidence: DisputeEvidence[];
}

// =============================================================================
// Query/Filter Types
// =============================================================================

export interface DisputeFilters {
  status?: DisputeStatus;
  reason?: DisputeReason;
  priority?: PriorityLevel;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type DisputeSortOption =
  | 'newest'
  | 'oldest'
  | 'priority'
  | 'deadline';

// =============================================================================
// Statistics Types
// =============================================================================

export interface DisputeStats {
  total: number;
  open: number;
  underReview: number;
  sellerResponded: number;
  resolved: number;
  rejected: number;
  escalated: number;
  closed: number;
  avgResolutionDays: number;
  resolutionRate: number;
}

// =============================================================================
// Business Logic Helpers
// =============================================================================

/**
 * Valid status transitions from each state
 */
export const DISPUTE_STATUS_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  open: ['under_review', 'closed'],
  under_review: ['seller_responded', 'escalated'],
  seller_responded: ['resolved', 'rejected', 'escalated'],
  resolved: ['closed'],
  rejected: ['escalated', 'closed'],
  escalated: ['resolved', 'closed'],
  closed: [],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(currentStatus: DisputeStatus, targetStatus: DisputeStatus): boolean {
  return DISPUTE_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * Check if dispute is in terminal state
 */
export function isTerminalStatus(status: DisputeStatus): boolean {
  return status === 'closed';
}

/**
 * Check if dispute is active (needs attention)
 */
export function isActiveDispute(status: DisputeStatus): boolean {
  return ['open', 'under_review', 'seller_responded', 'rejected', 'escalated'].includes(status);
}

/**
 * Check if buyer can take action
 */
export function canBuyerAct(dispute: Pick<MarketplaceDispute, 'status' | 'sellerResponseType'>): boolean {
  return dispute.status === 'seller_responded' && dispute.sellerResponseType === 'propose_resolution';
}

/**
 * Check if seller can respond
 */
export function canSellerRespond(status: DisputeStatus): boolean {
  return status === 'open' || status === 'under_review';
}

/**
 * Check if dispute can be escalated
 */
export function canEscalate(status: DisputeStatus): boolean {
  return ['under_review', 'seller_responded', 'rejected'].includes(status);
}

/**
 * Get status display configuration
 */
export function getDisputeStatusConfig(status: DisputeStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'muted';
  bgColor: string;
  textColor: string;
} {
  const configs: Record<DisputeStatus, ReturnType<typeof getDisputeStatusConfig>> = {
    open: {
      label: 'Open',
      labelKey: 'disputes.status.open',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
    },
    under_review: {
      label: 'Under Review',
      labelKey: 'disputes.status.underReview',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
    seller_responded: {
      label: 'Awaiting Response',
      labelKey: 'disputes.status.sellerResponded',
      color: 'primary',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-400',
    },
    resolved: {
      label: 'Resolved',
      labelKey: 'disputes.status.resolved',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
    },
    rejected: {
      label: 'Rejected',
      labelKey: 'disputes.status.rejected',
      color: 'error',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-400',
    },
    escalated: {
      label: 'Escalated',
      labelKey: 'disputes.status.escalated',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
    },
    closed: {
      label: 'Closed',
      labelKey: 'disputes.status.closed',
      color: 'muted',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
  };
  return configs[status];
}

/**
 * Get reason display label
 */
export function getDisputeReasonLabel(reason: DisputeReason): {
  label: string;
  labelKey: string;
} {
  const labels: Record<DisputeReason, ReturnType<typeof getDisputeReasonLabel>> = {
    wrong_item: { label: 'Wrong Item', labelKey: 'disputes.reason.wrongItem' },
    damaged_goods: { label: 'Damaged Goods', labelKey: 'disputes.reason.damagedGoods' },
    missing_quantity: { label: 'Missing Quantity', labelKey: 'disputes.reason.missingQuantity' },
    late_delivery: { label: 'Late Delivery', labelKey: 'disputes.reason.lateDelivery' },
    quality_issue: { label: 'Quality Issue', labelKey: 'disputes.reason.qualityIssue' },
    other: { label: 'Other', labelKey: 'disputes.reason.other' },
  };
  return labels[reason];
}

/**
 * Get priority display configuration
 */
export function getPriorityConfig(priority: PriorityLevel): {
  label: string;
  labelKey: string;
  color: 'muted' | 'info' | 'warning' | 'error';
  bgColor: string;
  textColor: string;
} {
  const configs: Record<PriorityLevel, ReturnType<typeof getPriorityConfig>> = {
    low: {
      label: 'Low',
      labelKey: 'disputes.priority.low',
      color: 'muted',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
    medium: {
      label: 'Medium',
      labelKey: 'disputes.priority.medium',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
    high: {
      label: 'High',
      labelKey: 'disputes.priority.high',
      color: 'warning',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-400',
    },
    urgent: {
      label: 'Urgent',
      labelKey: 'disputes.priority.urgent',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
    },
  };
  return configs[priority];
}

/**
 * Get seller response type label
 */
export function getSellerResponseTypeLabel(type: SellerResponseType): {
  label: string;
  labelKey: string;
} {
  const labels: Record<SellerResponseType, ReturnType<typeof getSellerResponseTypeLabel>> = {
    accept_responsibility: { label: 'Accepted Responsibility', labelKey: 'disputes.response.acceptResponsibility' },
    reject: { label: 'Rejected', labelKey: 'disputes.response.reject' },
    propose_resolution: { label: 'Proposed Resolution', labelKey: 'disputes.response.proposeResolution' },
  };
  return labels[type];
}

/**
 * Get resolution type label
 */
export function getResolutionTypeLabel(type: ResolutionType): {
  label: string;
  labelKey: string;
} {
  const labels: Record<ResolutionType, ReturnType<typeof getResolutionTypeLabel>> = {
    full_refund: { label: 'Full Refund', labelKey: 'disputes.resolution.fullRefund' },
    partial_refund: { label: 'Partial Refund', labelKey: 'disputes.resolution.partialRefund' },
    replacement: { label: 'Replacement', labelKey: 'disputes.resolution.replacement' },
    no_action: { label: 'No Action', labelKey: 'disputes.resolution.noAction' },
    other: { label: 'Other', labelKey: 'disputes.resolution.other' },
  };
  return labels[type];
}

/**
 * Check if response deadline is overdue
 */
export function isResponseOverdue(dispute: Pick<MarketplaceDispute, 'responseDeadline' | 'status'>): boolean {
  if (!dispute.responseDeadline) return false;
  if (!['open', 'under_review'].includes(dispute.status)) return false;
  return new Date(dispute.responseDeadline) < new Date();
}

/**
 * Get time remaining until deadline
 */
export function getTimeUntilDeadline(deadline: string): {
  isOverdue: boolean;
  hours: number;
  text: string;
} {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(hours);
    return {
      isOverdue: true,
      hours: overdueHours,
      text: `${overdueHours}h overdue`,
    };
  }

  if (hours < 24) {
    return {
      isOverdue: false,
      hours,
      text: `${hours}h remaining`,
    };
  }

  const days = Math.floor(hours / 24);
  return {
    isOverdue: false,
    hours,
    text: `${days}d remaining`,
  };
}
