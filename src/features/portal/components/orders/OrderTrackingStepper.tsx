// =============================================================================
// Order Tracking Stepper - Inline horizontal progress indicator
// =============================================================================

import React from 'react';
import { XCircle } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { Order, OrderRole, StepperStep } from './orders.types';
import { STEPPER_STEPS } from './orders.types';
import { formatTimestamp, calculateSLARemaining } from './orders.utils';

interface OrderTrackingStepperProps {
  order: Order;
  role: OrderRole;
}

type StepState = 'completed' | 'active' | 'pending';

const getStepState = (step: StepperStep, orderStatus: string): StepState => {
  if (step.completedStatuses.includes(orderStatus)) return 'completed';
  if (step.activeStatuses.includes(orderStatus)) return 'active';
  return 'pending';
};

export const OrderTrackingStepper: React.FC<OrderTrackingStepperProps> = ({ order, role }) => {
  const { styles } = usePortal();

  // Terminal states: show cancelled/failed badge instead of stepper
  if (['cancelled', 'failed', 'refunded'].includes(order.status)) {
    const label = order.status === 'cancelled' ? 'Cancelled' : order.status === 'failed' ? 'Failed' : 'Refunded';
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ backgroundColor: `${styles.error}12` }}
      >
        <XCircle size={13} weight="fill" style={{ color: styles.error }} />
        <span className="text-[10px] font-semibold" style={{ color: styles.error }}>
          {label}
        </span>
      </div>
    );
  }

  const sla = role === 'seller' ? calculateSLARemaining(order) : null;

  return (
    <div className="flex items-center" style={{ minWidth: 140 }}>
      {STEPPER_STEPS.map((step, index) => {
        const state = getStepState(step, order.status);
        const timestamp = step.timestampKey ? (order[step.timestampKey] as string | undefined) : undefined;
        const isLast = index === STEPPER_STEPS.length - 1;

        // Colors per state
        const dotBg = state === 'completed' ? styles.success : state === 'active' ? styles.info : styles.border;

        const lineBg = state === 'completed' ? styles.success : styles.border;

        // For active step on seller, tint the ring with SLA urgency
        const activeRingColor =
          state === 'active' && role === 'seller' && sla
            ? sla.urgency === 'critical'
              ? styles.error
              : sla.urgency === 'warning'
                ? styles.warning
                : styles.info
            : styles.info;

        return (
          <React.Fragment key={step.key}>
            {/* Step dot */}
            <div className="relative group flex-shrink-0">
              <div
                className="flex items-center justify-center transition-all"
                style={{
                  width: state === 'active' ? 12 : 8,
                  height: state === 'active' ? 12 : 8,
                  borderRadius: '50%',
                  backgroundColor: state === 'pending' ? 'transparent' : dotBg,
                  border:
                    state === 'pending'
                      ? `1.5px solid ${styles.border}`
                      : state === 'active'
                        ? `2px solid ${activeRingColor}`
                        : 'none',
                  boxShadow: state === 'active' ? `0 0 0 3px ${activeRingColor}20` : 'none',
                }}
              >
                {state === 'completed' && (
                  <svg width="6" height="6" viewBox="0 0 6 6">
                    <path
                      d="M1 3L2.5 4.5L5 1.5"
                      stroke="white"
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Tooltip on hover */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg"
                style={{
                  backgroundColor: styles.bgCard,
                  border: `1px solid ${styles.border}`,
                }}
              >
                <p className="text-[10px] font-semibold" style={{ color: styles.textPrimary }}>
                  {step.label}
                </p>
                {timestamp && (
                  <p className="text-[9px] mt-0.5" style={{ color: styles.textMuted }}>
                    {formatTimestamp(timestamp)}
                  </p>
                )}
                {state === 'active' && role === 'seller' && sla && (
                  <p
                    className="text-[9px] mt-0.5 font-medium"
                    style={{
                      color:
                        sla.urgency === 'critical'
                          ? styles.error
                          : sla.urgency === 'warning'
                            ? styles.warning
                            : styles.success,
                    }}
                  >
                    {sla.timeText}
                  </p>
                )}
                {/* Tooltip arrow */}
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: `4px solid ${styles.border}`,
                  }}
                />
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className="flex-1 transition-all"
                style={{
                  height: 2,
                  minWidth: 12,
                  maxWidth: 24,
                  backgroundColor: lineBg,
                  borderRadius: 1,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
