// =============================================================================
// Unified Order Tracking Component
// =============================================================================
// Main orchestrating component for the order tracking system
// Renders role-appropriate views for buyers and sellers
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { featureLogger } from '../../../../utils/logger';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { orderService } from '../../services/orderService';
import { orderTimelineApiService } from '../../services/orderTimelineService';
import { Order } from '../../types/order.types';
import { OrderTimeline } from '../../types/timeline.types';

// NOTE: Mock order generator removed - see MOCK_REMOVAL_REPORT.md
// All order data must come from API. Frontend handles empty states gracefully.

import { OrderTrackingHeader } from './OrderTrackingHeader';
import { DeliveryConfidenceCard } from './DeliveryConfidenceCard';
import { SLATracker } from './SLATracker';
import { CleanTimeline } from './CleanTimeline';
import { ActionPanel } from './ActionPanel';
import { InternalNotesSection } from './InternalNotesSection';

import {
  UnifiedOrderTrackingProps,
  UnifiedTrackingData,
  TrackingStage,
  DeliveryConfidence,
  DEFAULT_TRACKING_STAGES,
  getConfidenceMessage,
} from './tracking.types';
import { ThemeStyles } from '../../../../theme/portalColors';

// =============================================================================
// Loading Skeleton
// =============================================================================

const TrackingSkeleton: React.FC<{ styles: ThemeStyles }> = ({ styles }) => (
  <div className="animate-pulse">
    {/* Header skeleton */}
    <div className="px-6 py-4 border-b" style={{ borderColor: styles.border }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: styles.bgSecondary }} />
          <div>
            <div className="w-32 h-5 rounded" style={{ backgroundColor: styles.bgSecondary }} />
            <div className="w-20 h-3 rounded mt-1" style={{ backgroundColor: styles.bgSecondary }} />
          </div>
        </div>
        <div className="w-24 h-8 rounded-full" style={{ backgroundColor: styles.bgSecondary }} />
      </div>
    </div>

    {/* Confidence card skeleton */}
    <div className="mx-6 my-6">
      <div className="p-6 rounded-xl" style={{ backgroundColor: styles.bgSecondary }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl" style={{ backgroundColor: styles.bgCard }} />
          <div className="flex-1">
            <div className="w-32 h-4 rounded" style={{ backgroundColor: styles.bgCard }} />
            <div className="w-48 h-6 rounded mt-2" style={{ backgroundColor: styles.bgCard }} />
            <div className="w-64 h-4 rounded mt-3" style={{ backgroundColor: styles.bgCard }} />
          </div>
        </div>
      </div>
    </div>

    {/* Timeline skeleton */}
    <div className="px-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: styles.bgSecondary }} />
          <div className="flex-1">
            <div className="w-32 h-4 rounded" style={{ backgroundColor: styles.bgSecondary }} />
            <div className="w-24 h-3 rounded mt-2" style={{ backgroundColor: styles.bgSecondary }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// =============================================================================
// Error State
// =============================================================================

const ErrorState: React.FC<{ message: string; styles: ThemeStyles; onRetry?: () => void }> = ({
  message,
  styles,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style={{ backgroundColor: `${styles.error}10` }}
    >
      <span style={{ color: styles.error, fontSize: '24px' }}>!</span>
    </div>
    <p className="text-center mb-4" style={{ color: styles.textSecondary }}>
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: styles.bgSecondary,
          color: styles.textPrimary,
        }}
      >
        Try Again
      </button>
    )}
  </div>
);

// =============================================================================
// Data Transformation
// =============================================================================

function transformToTrackingStages(order: Order, timeline?: OrderTimeline): TrackingStage[] {
  // If we have timeline data from API, use it
  if (timeline?.steps) {
    return timeline.steps.map((step) => {
      const stageConfig = DEFAULT_TRACKING_STAGES.find((s) => s.key === step.key || step.key.includes(s.key));

      return {
        key: step.key,
        label: step.label,
        buyerLabel: stageConfig?.buyerLabel || step.label,
        status: step.status === 'completed' ? 'completed' : step.status === 'active' ? 'current' : 'upcoming',
        date: step.actualAt,
        estimatedDate: step.promisedAt,
        note: undefined,
        icon: step.icon || stageConfig?.icon || 'Package',
        slaDeadline: step.slaDeadline,
        slaTimeRemaining: step.slaTimeRemaining,
        slaPercentUsed: step.slaPercentUsed,
        slaStatus: step.slaStatus,
        actionRequired: undefined,
        isDelayed: step.isDelayed || step.status === 'delayed',
        delayReason: step.delayReason,
      };
    });
  }

  // Fallback: Build stages from order status
  return DEFAULT_TRACKING_STAGES.map((stageConfig) => {
    let status: 'completed' | 'current' | 'upcoming' = 'upcoming';

    if (stageConfig.orderStatuses.includes(order.status)) {
      status = 'completed';
    } else if (stageConfig.activeStatuses.includes(order.status)) {
      status = 'current';
    }

    // Get date based on stage
    let date: string | undefined;
    let estimatedDate: string | undefined;

    switch (stageConfig.key) {
      case 'confirmed':
        date = order.confirmedAt;
        break;
      case 'shipped':
        date = order.shippedAt;
        break;
      case 'delivered':
        date = order.deliveredAt;
        estimatedDate = order.estimatedDelivery;
        break;
    }

    return {
      key: stageConfig.key,
      label: stageConfig.label,
      buyerLabel: stageConfig.buyerLabel,
      status,
      date,
      estimatedDate,
      icon: stageConfig.icon,
    };
  });
}

function calculateDeliveryConfidence(order: Order, timeline?: OrderTimeline): DeliveryConfidence {
  // If order is delivered, it's on track
  if (order.status === 'delivered') {
    return 'on_track';
  }

  // If order is cancelled/failed, it's delayed
  if (['cancelled', 'failed'].includes(order.status)) {
    return 'delayed';
  }

  // Use risk assessment if available
  if (timeline?.riskAssessment) {
    const risk = timeline.riskAssessment.overallRisk;
    if (risk === 'low') return 'on_track';
    if (risk === 'medium') return 'minor_risk';
    return 'delayed';
  }

  // Default to on track
  return 'on_track';
}

function getCurrentStage(stages: TrackingStage[]): TrackingStage {
  const current = stages.find((s) => s.status === 'current');
  if (current) return current;

  // If no current, return the last completed or first upcoming
  const lastCompleted = [...stages].reverse().find((s) => s.status === 'completed');
  if (lastCompleted) return lastCompleted;

  return stages[0];
}

// =============================================================================
// Main Component
// =============================================================================

export const UnifiedOrderTracking: React.FC<UnifiedOrderTrackingProps> = ({ orderId, role, onNavigate, onClose }) => {
  const { styles, t } = usePortal();
  const { getToken } = useAuth();

  const [trackingData, setTrackingData] = useState<UnifiedTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tracking data
  const loadTrackingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let order: Order | null = null;

      // Try to fetch from API first
      try {
        const token = await getToken();
        if (token) {
          if (role === 'buyer') {
            order = await orderService.getBuyerOrder(token, orderId);
          } else {
            order = await orderService.getSellerOrder(token, orderId);
          }
        }
      } catch (apiErr) {
        console.error('[UnifiedOrderTracking] API fetch failed:', apiErr);
      }

      // Return error if order not found - no mock fallback
      if (!order) {
        setError('Order not found');
        setIsLoading(false);
        return;
      }

      // Fetch timeline data from API
      let timeline: OrderTimeline | undefined;
      try {
        timeline = await orderTimelineApiService.getOrderTimeline(orderId, order.sellerId);
      } catch (err) {
        // No mock fallback - timeline will be undefined
        console.error('[UnifiedOrderTracking] Failed to load timeline:', err);
        timeline = undefined;
      }

      // Transform data
      const stages = transformToTrackingStages(order, timeline);
      const confidence = calculateDeliveryConfidence(order, timeline);
      const primaryDelay = timeline?.delays?.[0];

      const data: UnifiedTrackingData = {
        order,
        stages,
        currentStageKey: getCurrentStage(stages).key,
        deliveryConfidence: confidence,
        confidenceMessage: getConfidenceMessage(confidence, primaryDelay?.reasonCode),
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.deliveredAt,
        // Seller-only data
        ...(role === 'seller' && {
          riskAssessment: timeline?.riskAssessment,
          internalNotes: order.internalNotes,
          automationSignals: getAutomationSignals(timeline, order),
        }),
      };

      setTrackingData(data);
    } catch (err) {
      console.error('Failed to load tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order tracking information');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, role, getToken]);

  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Generate automation signals for sellers
  function getAutomationSignals(timeline?: OrderTimeline, order?: Order): string[] {
    const signals: string[] = [];

    if (!timeline || !order) return signals;

    // Check for SLA breaches
    const currentStage = getCurrentStage(transformToTrackingStages(order, timeline));
    if (currentStage.slaStatus === 'breached') {
      signals.push('This delay may affect your seller score');
    } else if (currentStage.slaStatus === 'at_risk') {
      signals.push('SLA deadline approaching - take action soon');
    }

    // Check risk level
    if (timeline.riskAssessment?.overallRisk === 'critical') {
      signals.push('Order at critical risk - immediate attention required');
    }

    return signals;
  }

  // Action handlers
  const handleContactSeller = () => {
    // Navigate to messaging or open contact modal
    onNavigate('messages', { orderId, recipientType: 'seller' });
  };

  const handleOpenDispute = () => {
    onNavigate('disputes', { orderId, action: 'create' });
  };

  const handleDownloadSummary = () => {
    // Trigger PDF download
    featureLogger.info('Download summary for order:', orderId);
  };

  const handleUpdateShipment = () => {
    // Open shipment update modal or navigate
    onNavigate('orders', { orderId, action: 'update-shipment' });
  };

  const handleConfirmDispatch = () => {
    // Trigger dispatch confirmation
    onNavigate('orders', { orderId, action: 'confirm-dispatch' });
  };

  const handleReportDelay = () => {
    // Open delay reporting modal
    onNavigate('orders', { orderId, action: 'report-delay' });
  };

  const handleAddNote = () => {
    // Focus on notes section - the InternalNotesSection handles this internally
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!trackingData) return;

    try {
      const token = await getToken();
      if (!token) return;

      await orderService.updateOrder(token, orderId, { internalNotes: notes });

      // Update local state
      setTrackingData({
        ...trackingData,
        internalNotes: notes,
      });
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  const handleStageAction = (stageKey: string, action: string) => {
    // Handle stage-specific actions (seller only)
    onNavigate('orders', { orderId, action: action.toLowerCase().replace(/\s+/g, '-') });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="h-full overflow-auto" style={{ backgroundColor: styles.bgPrimary }}>
        <TrackingSkeleton styles={styles} />
      </div>
    );
  }

  // Render error state
  if (error || !trackingData) {
    return (
      <div className="h-full overflow-auto" style={{ backgroundColor: styles.bgPrimary }}>
        <ErrorState message={error || 'Unable to load order tracking'} styles={styles} onRetry={loadTrackingData} />
      </div>
    );
  }

  const currentStage = trackingData.stages.find((s) => s.status === 'current') || trackingData.stages[0];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: styles.bgPrimary }}>
      {/* Header */}
      <OrderTrackingHeader
        order={trackingData.order}
        role={role}
        deliveryConfidence={trackingData.deliveryConfidence}
        onClose={onClose}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        {/* Buyer: Delivery Confidence Card */}
        {role === 'buyer' && (
          <DeliveryConfidenceCard
            confidence={trackingData.deliveryConfidence}
            message={trackingData.confidenceMessage}
            estimatedDelivery={trackingData.estimatedDelivery}
            actualDelivery={trackingData.actualDelivery}
          />
        )}

        {/* Seller: SLA Tracker */}
        {role === 'seller' && (
          <SLATracker
            currentStage={currentStage}
            riskAssessment={trackingData.riskAssessment}
            automationSignals={trackingData.automationSignals}
          />
        )}

        {/* Timeline section header */}
        <div className="px-6 pt-2 pb-3">
          <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            {t('tracking.timeline') || 'Order Timeline'}
          </h3>
        </div>

        {/* Clean Timeline */}
        <div className="px-6">
          <CleanTimeline
            stages={trackingData.stages}
            role={role}
            currentStageKey={trackingData.currentStageKey}
            onStageAction={handleStageAction}
          />
        </div>

        {/* Seller: Internal Notes */}
        {role === 'seller' && (
          <InternalNotesSection
            notes={trackingData.internalNotes}
            automationSignals={trackingData.automationSignals}
            onUpdateNotes={handleUpdateNotes}
          />
        )}
      </div>

      {/* Action Panel */}
      <ActionPanel
        role={role}
        order={trackingData.order}
        deliveryConfidence={trackingData.deliveryConfidence}
        onContactSeller={role === 'buyer' ? handleContactSeller : undefined}
        onOpenDispute={role === 'buyer' ? handleOpenDispute : undefined}
        onDownloadSummary={role === 'buyer' ? handleDownloadSummary : undefined}
        onUpdateShipment={role === 'seller' ? handleUpdateShipment : undefined}
        onConfirmDispatch={role === 'seller' ? handleConfirmDispatch : undefined}
        onReportDelay={role === 'seller' ? handleReportDelay : undefined}
        onAddNote={role === 'seller' ? handleAddNote : undefined}
      />
    </div>
  );
};

export default UnifiedOrderTracking;
