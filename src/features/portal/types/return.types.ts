// =============================================================================
// Returns System - Type Definitions (Stage 7)
// =============================================================================

// =============================================================================
// Return Status Types - Strict State Machine
// =============================================================================

/**
 * Return Status - Main lifecycle states
 * requested -> approved | rejected
 * approved -> in_transit -> received -> refund_processed -> closed
 */
export type ReturnStatus =
  | 'requested' // Initial state - return requested
  | 'approved' // Seller approved, awaiting shipment
  | 'rejected' // Seller rejected return
  | 'in_transit' // Buyer shipped the return
  | 'received' // Seller received the return
  | 'refund_processed' // Refund has been processed
  | 'closed'; // Terminal state

/**
 * Return Type - What kind of return
 */
export type ReturnKind =
  | 'full_return' // Full return of all items
  | 'partial_return' // Partial return
  | 'replacement_only'; // Exchange for replacement

/**
 * Received Condition - State of returned items
 */
export type ReceivedCondition = 'as_expected' | 'damaged_in_transit' | 'partial_received' | 'other';

// =============================================================================
// Core Return Interface
// =============================================================================

export interface ReturnItem {
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface ReturnAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface MarketplaceReturn {
  id: string;
  returnNumber: string;

  // References
  disputeId: string;
  orderId: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;

  // Return Details
  returnType: ReturnKind;
  returnReason: string;
  returnItems: ReturnItem[];

  // Status
  status: ReturnStatus;

  // Shipping
  returnTrackingNumber?: string;
  returnCarrier?: string;
  shippedAt?: string;
  returnAddress?: ReturnAddress;

  // Approval/Rejection
  approvedAt?: string;
  approvalNotes?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Receipt
  receivedAt?: string;
  receivedCondition?: ReceivedCondition;
  receivedNotes?: string;

  // Refund
  refundAmount?: number;
  refundStatus?: string;
  refundProcessedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  closedAt?: string;

  // Related Dispute (optional)
  dispute?: {
    disputeNumber: string;
    reason: string;
    buyerName?: string;
  };
}

// =============================================================================
// Return Event (Audit Trail)
// =============================================================================

export type ReturnEventType =
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'RETURN_SHIPPED'
  | 'RETURN_RECEIVED'
  | 'REFUND_PROCESSED'
  | 'RETURN_CLOSED';

export interface ReturnEvent {
  id: string;
  returnId: string;
  actorId?: string;
  actorType: 'buyer' | 'seller' | 'system';
  eventType: ReturnEventType;
  fromStatus?: string;
  toStatus?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// =============================================================================
// API Data Transfer Objects
// =============================================================================

export interface CreateReturnData {
  disputeId: string;
  returnType: ReturnKind;
  returnItems: ReturnItem[];
}

export interface ApproveReturnData {
  returnAddress: ReturnAddress;
  approvalNotes?: string;
}

export interface RejectReturnData {
  reason: string;
}

export interface ShipReturnData {
  trackingNumber: string;
  carrier?: string;
}

export interface ReceiveReturnData {
  condition: ReceivedCondition;
  notes?: string;
}

export interface ProcessRefundData {
  amount: number;
}

// =============================================================================
// Query/Filter Types
// =============================================================================

export interface ReturnFilters {
  status?: ReturnStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Statistics Types
// =============================================================================

export interface ReturnStats {
  total: number;
  requested: number;
  approved: number;
  rejected: number;
  inTransit: number;
  received: number;
  refundProcessed: number;
  closed: number;
}

// =============================================================================
// Business Logic Helpers
// =============================================================================

/**
 * Valid status transitions from each state
 */
export const RETURN_STATUS_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['in_transit'],
  rejected: [],
  in_transit: ['received'],
  received: ['refund_processed'],
  refund_processed: ['closed'],
  closed: [],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(currentStatus: ReturnStatus, targetStatus: ReturnStatus): boolean {
  return RETURN_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * Check if return is in terminal state
 */
export function isTerminalStatus(status: ReturnStatus): boolean {
  return status === 'closed' || status === 'rejected';
}

/**
 * Check if return is active (needs attention)
 */
export function isActiveReturn(status: ReturnStatus): boolean {
  return ['requested', 'approved', 'in_transit', 'received', 'refund_processed'].includes(status);
}

/**
 * Check if buyer can ship return
 */
export function canBuyerShip(status: ReturnStatus): boolean {
  return status === 'approved';
}

/**
 * Check if seller can approve/reject
 */
export function canSellerApproveReject(status: ReturnStatus): boolean {
  return status === 'requested';
}

/**
 * Check if seller can confirm receipt
 */
export function canSellerReceive(status: ReturnStatus): boolean {
  return status === 'in_transit';
}

/**
 * Check if seller can process refund
 */
export function canSellerRefund(status: ReturnStatus): boolean {
  return status === 'received';
}

/**
 * Get status display configuration
 */
export function getReturnStatusConfig(status: ReturnStatus): {
  label: string;
  labelKey: string;
  color: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'muted';
  bgColor: string;
  textColor: string;
} {
  const configs: Record<ReturnStatus, ReturnType<typeof getReturnStatusConfig>> = {
    requested: {
      label: 'Requested',
      labelKey: 'returns.status.requested',
      color: 'warning',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
    },
    approved: {
      label: 'Approved',
      labelKey: 'returns.status.approved',
      color: 'info',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
    rejected: {
      label: 'Rejected',
      labelKey: 'returns.status.rejected',
      color: 'error',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
    },
    in_transit: {
      label: 'In Transit',
      labelKey: 'returns.status.inTransit',
      color: 'primary',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-400',
    },
    received: {
      label: 'Received',
      labelKey: 'returns.status.received',
      color: 'info',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      textColor: 'text-cyan-700 dark:text-cyan-400',
    },
    refund_processed: {
      label: 'Refund Processed',
      labelKey: 'returns.status.refundProcessed',
      color: 'success',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
    },
    closed: {
      label: 'Closed',
      labelKey: 'returns.status.closed',
      color: 'muted',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
  };
  return configs[status];
}

/**
 * Get return type label
 */
export function getReturnTypeLabel(type: ReturnKind): {
  label: string;
  labelKey: string;
} {
  const labels: Record<ReturnKind, ReturnType<typeof getReturnTypeLabel>> = {
    full_return: { label: 'Full Return', labelKey: 'returns.type.fullReturn' },
    partial_return: { label: 'Partial Return', labelKey: 'returns.type.partialReturn' },
    replacement_only: { label: 'Replacement', labelKey: 'returns.type.replacementOnly' },
  };
  return labels[type];
}

/**
 * Get received condition label
 */
export function getReceivedConditionLabel(condition: ReceivedCondition): {
  label: string;
  labelKey: string;
  color: 'success' | 'warning' | 'error' | 'muted';
} {
  const labels: Record<ReceivedCondition, ReturnType<typeof getReceivedConditionLabel>> = {
    as_expected: { label: 'As Expected', labelKey: 'returns.condition.asExpected', color: 'success' },
    damaged_in_transit: { label: 'Damaged in Transit', labelKey: 'returns.condition.damagedInTransit', color: 'error' },
    partial_received: { label: 'Partial Received', labelKey: 'returns.condition.partialReceived', color: 'warning' },
    other: { label: 'Other', labelKey: 'returns.condition.other', color: 'muted' },
  };
  return labels[condition];
}

/**
 * Calculate total return value
 */
export function calculateReturnValue(items: ReturnItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}
