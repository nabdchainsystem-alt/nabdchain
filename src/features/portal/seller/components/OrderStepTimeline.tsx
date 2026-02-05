import React from 'react';
import {
  Package,
  CheckCircle,
  Gear,
  Truck,
  Timer,
  XCircle,
  Export,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Order, OrderStatus } from '../../types/order.types';

// =============================================================================
// Types
// =============================================================================
interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  activeStatuses: OrderStatus[];
  completedStatuses: OrderStatus[];
  timestampKey: keyof Order;
  slaType?: 'confirmation' | 'shipping' | 'delivery';
}

interface OrderStepTimelineProps {
  order: Order;
}

// =============================================================================
// SLA Configuration (matching SellerOrders.tsx)
// =============================================================================
const SLA_CONFIG = {
  confirmation: { hours: 24, label: 'Confirm' },
  shipping: { hours: 72, label: 'Ship' },
  delivery: { days: 7, label: 'Deliver' },
};

// =============================================================================
// Timeline Steps (matching SellerOrders.tsx)
// =============================================================================
const TIMELINE_STEPS: TimelineStep[] = [
  {
    key: 'created',
    label: 'Order Created',
    icon: Package,
    activeStatuses: [],
    completedStatuses: ['pending_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'closed'],
    timestampKey: 'createdAt',
  },
  {
    key: 'accepted',
    label: 'Seller Accepted',
    icon: CheckCircle,
    activeStatuses: ['pending_confirmation'],
    completedStatuses: ['confirmed', 'processing', 'shipped', 'delivered', 'closed'],
    timestampKey: 'confirmedAt',
    slaType: 'confirmation',
  },
  {
    key: 'preparation',
    label: 'In Preparation',
    icon: Gear,
    activeStatuses: ['confirmed'],
    completedStatuses: ['processing', 'shipped', 'delivered', 'closed'],
    timestampKey: 'processingAt',
  },
  {
    key: 'ready_to_ship',
    label: 'Ready to Ship',
    icon: Export,
    activeStatuses: ['processing'],
    completedStatuses: ['shipped', 'delivered', 'closed'],
    timestampKey: 'readyToShipAt' as keyof Order,
    slaType: 'shipping',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: Truck,
    activeStatuses: [],
    completedStatuses: ['shipped', 'delivered', 'closed'],
    timestampKey: 'shippedAt',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: Package,
    activeStatuses: ['shipped'],
    completedStatuses: ['delivered', 'closed'],
    timestampKey: 'deliveredAt',
    slaType: 'delivery',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    activeStatuses: ['delivered'],
    completedStatuses: ['closed'],
    timestampKey: 'closedAt',
  },
];

// =============================================================================
// Helper Functions
// =============================================================================
const formatTimestamp = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calculateSLAForStep = (
  order: Order,
  step: TimelineStep
): { remaining: string; urgency: 'ok' | 'warning' | 'critical'; percentUsed: number } | null => {
  if (!step.slaType) return null;

  const now = new Date();
  let startTime: Date;
  let deadline: Date;

  switch (step.slaType) {
    case 'confirmation':
      if (order.status !== 'pending_confirmation') return null;
      startTime = new Date(order.createdAt);
      deadline = new Date(startTime.getTime() + SLA_CONFIG.confirmation.hours * 60 * 60 * 1000);
      break;
    case 'shipping':
      if (!['confirmed', 'processing'].includes(order.status)) return null;
      startTime = order.confirmedAt ? new Date(order.confirmedAt) : new Date(order.createdAt);
      deadline = new Date(startTime.getTime() + SLA_CONFIG.shipping.hours * 60 * 60 * 1000);
      break;
    case 'delivery':
      if (order.status !== 'shipped') return null;
      startTime = order.shippedAt ? new Date(order.shippedAt) : new Date(order.createdAt);
      deadline = new Date(startTime.getTime() + SLA_CONFIG.delivery.days * 24 * 60 * 60 * 1000);
      break;
    default:
      return null;
  }

  const totalMs = deadline.getTime() - startTime.getTime();
  const elapsedMs = now.getTime() - startTime.getTime();
  const remainingMs = deadline.getTime() - now.getTime();
  const isOverdue = remainingMs < 0;
  const percentUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

  // Calculate remaining time string
  const hours = Math.floor(Math.abs(remainingMs) / (60 * 60 * 1000));
  const minutes = Math.floor((Math.abs(remainingMs) % (60 * 60 * 1000)) / (60 * 1000));

  let remaining = '';
  if (isOverdue) {
    remaining = hours > 24 ? `${Math.floor(hours / 24)}d overdue` : `${hours}h overdue`;
  } else if (hours < 24) {
    remaining = `${hours}h ${minutes}m remaining`;
  } else {
    const days = Math.floor(hours / 24);
    remaining = `${days}d remaining`;
  }

  // Determine urgency
  let urgency: 'ok' | 'warning' | 'critical';
  if (isOverdue) {
    urgency = 'critical';
  } else if (percentUsed >= 80) {
    urgency = 'warning';
  } else {
    urgency = 'ok';
  }

  return { remaining, urgency, percentUsed };
};

// =============================================================================
// OrderStepTimeline Component
// =============================================================================
export const OrderStepTimeline: React.FC<OrderStepTimelineProps> = ({ order }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // Handle cancelled/failed states
  if (['cancelled', 'failed', 'refunded'].includes(order.status)) {
    return (
      <div className="p-4">
        <div
          className="flex items-center gap-3 p-4 rounded-lg"
          style={{ backgroundColor: `${styles.error}10` }}
        >
          <XCircle size={24} weight="fill" style={{ color: styles.error }} />
          <div>
            <p className="font-medium" style={{ color: styles.error }}>
              {order.status === 'cancelled'
                ? 'Order Cancelled'
                : order.status === 'failed'
                ? 'Order Failed'
                : 'Order Refunded'}
            </p>
            {order.cancelledAt && (
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {formatTimestamp(order.cancelledAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getStepState = (step: TimelineStep): 'completed' | 'active' | 'pending' => {
    if (step.completedStatuses.includes(order.status)) return 'completed';
    if (step.activeStatuses.includes(order.status)) return 'active';
    return 'pending';
  };

  return (
    <div className="p-4 space-y-0">
      {TIMELINE_STEPS.map((step, index) => {
        const state = getStepState(step);
        const Icon = step.icon;
        const timestamp = order[step.timestampKey] as string | undefined;
        const slaInfo = state === 'active' ? calculateSLAForStep(order, step) : null;

        const isLastStep = index === TIMELINE_STEPS.length - 1;

        return (
          <div key={step.key} className={`flex gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  state === 'active' ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  backgroundColor:
                    state === 'completed'
                      ? `${styles.success}20`
                      : state === 'active'
                      ? `${styles.info}20`
                      : styles.bgSecondary,
                  ringColor: state === 'active' ? styles.info : undefined,
                }}
              >
                <Icon
                  size={20}
                  weight={state === 'completed' ? 'fill' : state === 'active' ? 'bold' : 'regular'}
                  style={{
                    color:
                      state === 'completed'
                        ? styles.success
                        : state === 'active'
                        ? styles.info
                        : styles.textMuted,
                  }}
                />
              </div>
              {/* Connecting line */}
              {!isLastStep && (
                <div
                  className="w-0.5 flex-1 my-1"
                  style={{
                    backgroundColor: state === 'completed' ? styles.success : styles.border,
                    minHeight: '24px',
                  }}
                />
              )}
            </div>

            {/* Step content */}
            <div className={`flex-1 pb-6 ${isRtl ? 'text-right' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className="font-medium"
                    style={{
                      color:
                        state === 'completed'
                          ? styles.textPrimary
                          : state === 'active'
                          ? styles.info
                          : styles.textMuted,
                    }}
                  >
                    {step.label}
                  </p>
                  {/* Timestamp for completed steps */}
                  {state === 'completed' && timestamp && (
                    <p className="text-sm mt-0.5" style={{ color: styles.textMuted }}>
                      {formatTimestamp(timestamp)}
                    </p>
                  )}
                  {/* SLA info for active step */}
                  {state === 'active' && slaInfo && (
                    <div className="mt-2">
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                        style={{
                          backgroundColor:
                            slaInfo.urgency === 'ok'
                              ? `${styles.success}15`
                              : slaInfo.urgency === 'warning'
                              ? `${styles.warning}15`
                              : `${styles.error}15`,
                        }}
                      >
                        <Timer
                          size={14}
                          weight={slaInfo.urgency === 'critical' ? 'fill' : 'bold'}
                          style={{
                            color:
                              slaInfo.urgency === 'ok'
                                ? styles.success
                                : slaInfo.urgency === 'warning'
                                ? styles.warning
                                : styles.error,
                          }}
                          className={slaInfo.urgency === 'critical' ? 'animate-pulse' : ''}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{
                            color:
                              slaInfo.urgency === 'ok'
                                ? styles.success
                                : slaInfo.urgency === 'warning'
                                ? styles.warning
                                : styles.error,
                          }}
                        >
                          {slaInfo.remaining}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div
                        className="mt-2 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: styles.bgSecondary, width: '120px' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${slaInfo.percentUsed}%`,
                            backgroundColor:
                              slaInfo.urgency === 'ok'
                                ? styles.success
                                : slaInfo.urgency === 'warning'
                                ? styles.warning
                                : styles.error,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* "Waiting" state indicator for pending steps */}
                  {state === 'pending' && (
                    <p className="text-sm mt-0.5" style={{ color: styles.textMuted }}>
                      Pending
                    </p>
                  )}
                  {/* Active step with no SLA */}
                  {state === 'active' && !slaInfo && (
                    <p className="text-sm mt-0.5" style={{ color: styles.info }}>
                      In progress
                    </p>
                  )}
                </div>

                {/* Status indicator on right */}
                {state === 'completed' && (
                  <CheckCircle
                    size={16}
                    weight="fill"
                    style={{ color: styles.success }}
                    className="flex-shrink-0 mt-1"
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStepTimeline;
