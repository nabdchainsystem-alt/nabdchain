// =============================================================================
// Order Tracking Types
// =============================================================================
// Types for the unified order tracking system with role-based views
// =============================================================================

import { Order } from '../../types/order.types';
import { RiskAssessment, DelayReasonCode } from '../../types/timeline.types';

// =============================================================================
// Core Types
// =============================================================================

/** User role for tracking view */
export type TrackingRole = 'buyer' | 'seller';

/** Buyer-friendly confidence levels */
export type DeliveryConfidence = 'on_track' | 'minor_risk' | 'delayed';

/** Timeline stage status */
export type StageStatus = 'completed' | 'current' | 'upcoming';

/** SLA status for seller view */
export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

// =============================================================================
// Tracking Stage
// =============================================================================

/** Timeline stage for the unified view */
export interface TrackingStage {
  key: string;
  label: string;
  buyerLabel: string;          // Simplified label for buyers
  status: StageStatus;
  date?: string;               // Actual date if completed
  estimatedDate?: string;      // ETA if upcoming
  note?: string;               // Short context note
  icon: string;                // Icon name from phosphor-react
  // Seller-only fields
  slaDeadline?: string;
  slaTimeRemaining?: string;
  slaPercentUsed?: number;
  slaStatus?: SLAStatus;
  actionRequired?: string;     // e.g., "Update shipment info"
  // Delay info
  isDelayed?: boolean;
  delayReason?: DelayReasonCode;
}

// =============================================================================
// Unified Tracking Data
// =============================================================================

/** Complete tracking data model */
export interface UnifiedTrackingData {
  order: Order;
  stages: TrackingStage[];
  currentStageKey: string;
  deliveryConfidence: DeliveryConfidence;
  confidenceMessage: string;           // Plain language explanation
  estimatedDelivery?: string;
  actualDelivery?: string;
  // Seller-only fields
  riskAssessment?: RiskAssessment;
  internalNotes?: string;
  automationSignals?: string[];
}

// =============================================================================
// Component Props
// =============================================================================

/** Props for the main unified component */
export interface UnifiedOrderTrackingProps {
  orderId: string;
  role: TrackingRole;
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
  onClose?: () => void;
}

/** Props for CleanTimeline */
export interface CleanTimelineProps {
  stages: TrackingStage[];
  role: TrackingRole;
  currentStageKey: string;
  onStageAction?: (stageKey: string, action: string) => void;
}

/** Props for OrderTrackingHeader */
export interface OrderTrackingHeaderProps {
  order: Order;
  role: TrackingRole;
  deliveryConfidence: DeliveryConfidence;
  onClose?: () => void;
}

/** Props for DeliveryConfidenceCard */
export interface DeliveryConfidenceCardProps {
  confidence: DeliveryConfidence;
  message: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

/** Props for SLATracker */
export interface SLATrackerProps {
  currentStage: TrackingStage;
  riskAssessment?: RiskAssessment;
  automationSignals?: string[];
}

/** Action item for the ActionPanel */
export interface TrackingAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

/** Props for ActionPanel */
export interface ActionPanelProps {
  role: TrackingRole;
  order: Order;
  deliveryConfidence: DeliveryConfidence;
  onContactSeller?: () => void;
  onOpenDispute?: () => void;
  onDownloadSummary?: () => void;
  onUpdateShipment?: () => void;
  onConfirmDispatch?: () => void;
  onReportDelay?: () => void;
  onAddNote?: () => void;
}

/** Props for InternalNotesSection */
export interface InternalNotesSectionProps {
  notes?: string;
  automationSignals?: string[];
  onUpdateNotes?: (notes: string) => void;
}

// =============================================================================
// Stage Configuration
// =============================================================================

/** Default tracking stages */
export const DEFAULT_TRACKING_STAGES: Array<{
  key: string;
  label: string;
  buyerLabel: string;
  icon: string;
  orderStatuses: string[];  // Order statuses that mean this stage is completed
  activeStatuses: string[]; // Order statuses that mean this stage is current
}> = [
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    buyerLabel: 'Order Confirmed',
    icon: 'CheckCircle',
    orderStatuses: ['confirmed', 'in_progress', 'shipped', 'delivered'],
    activeStatuses: ['pending_confirmation'],
  },
  {
    key: 'processing',
    label: 'Processing',
    buyerLabel: 'Being Prepared',
    icon: 'Gear',
    orderStatuses: ['in_progress', 'shipped', 'delivered'],
    activeStatuses: ['confirmed'],
  },
  {
    key: 'shipped',
    label: 'Shipped',
    buyerLabel: 'On Its Way',
    icon: 'Truck',
    orderStatuses: ['shipped', 'delivered'],
    activeStatuses: ['in_progress'],
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    buyerLabel: 'Almost There',
    icon: 'MapTrifold',
    orderStatuses: ['delivered'],
    activeStatuses: ['shipped'],
  },
  {
    key: 'delivered',
    label: 'Delivered',
    buyerLabel: 'Delivered',
    icon: 'Package',
    orderStatuses: [],
    activeStatuses: ['delivered'],
  },
];

// =============================================================================
// Confidence Message Helpers
// =============================================================================

/** Get plain language message for delivery confidence */
export function getConfidenceMessage(
  confidence: DeliveryConfidence,
  delayReason?: DelayReasonCode
): string {
  switch (confidence) {
    case 'on_track':
      return 'Your order is progressing normally and should arrive on time.';
    case 'minor_risk':
      return 'There may be a slight delay, but we\'re working to get your order to you as soon as possible.';
    case 'delayed':
      return delayReason
        ? getPlainLanguageDelayReason(delayReason)
        : 'Your order has been delayed. We apologize for the inconvenience and are working to resolve this.';
  }
}

/** Get plain language explanation for delay reasons */
export function getPlainLanguageDelayReason(code: DelayReasonCode): string {
  const messages: Record<DelayReasonCode, string> = {
    supplier_stockout: 'The item is temporarily out of stock at the supplier. We\'re working to source it.',
    production_delay: 'Production is taking longer than expected. Your order is being prioritized.',
    carrier_delay: 'The shipping carrier is experiencing delays due to high volume.',
    customs_clearance: 'Your order is being processed through customs. This is a normal part of international shipping.',
    weather: 'Weather conditions are affecting delivery times in your area.',
    buyer_request: 'The delivery has been adjusted based on your request.',
    internal_processing: 'We need a bit more time to prepare your order carefully.',
    quality_check: 'Your order is undergoing additional quality checks to ensure it meets our standards.',
    address_issue: 'There was an issue with the delivery address. Please verify your shipping details.',
    payment_hold: 'We\'re waiting for payment verification to complete.',
    documentation: 'Additional documentation is required for your shipment.',
    other: 'We\'re working to resolve an issue with your order.',
  };
  return messages[code] || 'We\'re working to resolve the delay.';
}

/** Get confidence level config for styling */
export function getConfidenceConfig(confidence: DeliveryConfidence): {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
} {
  const configs: Record<DeliveryConfidence, ReturnType<typeof getConfidenceConfig>> = {
    on_track: {
      label: 'On Track',
      bgColor: '#ECFDF5',
      textColor: '#059669',
      dotColor: '#10B981',
    },
    minor_risk: {
      label: 'Minor Delay Possible',
      bgColor: '#FFFBEB',
      textColor: '#D97706',
      dotColor: '#F59E0B',
    },
    delayed: {
      label: 'Delayed',
      bgColor: '#FEF2F2',
      textColor: '#DC2626',
      dotColor: '#EF4444',
    },
  };
  return configs[confidence];
}
