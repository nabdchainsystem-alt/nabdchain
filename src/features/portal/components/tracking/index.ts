// =============================================================================
// Order Tracking Components - Barrel Export
// =============================================================================

// Main component
export { UnifiedOrderTracking } from './UnifiedOrderTracking';
export { default as UnifiedOrderTrackingDefault } from './UnifiedOrderTracking';

// Sub-components
export { CleanTimeline } from './CleanTimeline';
export { OrderTrackingHeader } from './OrderTrackingHeader';
export { DeliveryConfidenceCard } from './DeliveryConfidenceCard';
export { SLATracker } from './SLATracker';
export { ActionPanel } from './ActionPanel';
export { InternalNotesSection } from './InternalNotesSection';

// Types
export type {
  TrackingRole,
  DeliveryConfidence,
  StageStatus,
  SLAStatus,
  TrackingStage,
  UnifiedTrackingData,
  UnifiedOrderTrackingProps,
  CleanTimelineProps,
  OrderTrackingHeaderProps,
  DeliveryConfidenceCardProps,
  SLATrackerProps,
  ActionPanelProps,
  TrackingAction,
  InternalNotesSectionProps,
} from './tracking.types';

// Utilities
export {
  DEFAULT_TRACKING_STAGES,
  getConfidenceMessage,
  getPlainLanguageDelayReason,
  getConfidenceConfig,
} from './tracking.types';
