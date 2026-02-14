// =============================================================================
// Order Tracking Stepper - Inline horizontal progress indicator
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { XCircle } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { Order, OrderRole, StepperStep } from './orders.types';
import { STEPPER_STEPS } from './orders.types';
import { calculateSLARemaining } from './orders.utils';

interface OrderTrackingStepperProps {
  order: Order;
  role: OrderRole;
}

type StepState = 'completed' | 'active' | 'pending';

const getStepState = (step: StepperStep, order: Order): StepState => {
  if (step.isCompleted?.(order)) return 'completed';
  if (step.isActive?.(order)) return 'active';
  if (step.completedStatuses.includes(order.status)) return 'completed';
  if (step.activeStatuses.includes(order.status)) return 'active';
  return 'pending';
};

const getStepTimestamp = (step: StepperStep, order: Order): string | null => {
  if (!step.timestampKey) return null;
  const val = order[step.timestampKey];
  if (!val || typeof val !== 'string') return null;
  return new Date(val).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Tooltip component for step hover
const StepTooltip: React.FC<{
  step: StepperStep;
  state: StepState;
  order: Order;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ step, state, order, anchorRef, styles }) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [anchorRef]);

  if (!position) return null;

  const timestamp = getStepTimestamp(step, order);
  const stateLabel = state === 'completed' ? 'Completed' : state === 'active' ? 'In Progress' : 'Pending';
  const stateColor = state === 'completed' ? styles.success : state === 'active' ? styles.info : styles.textMuted;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div
        className="px-3 py-2 rounded-lg shadow-lg border text-center min-w-[100px]"
        style={{
          backgroundColor: styles.bgCard,
          borderColor: styles.border,
          boxShadow: styles.isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.12)',
        }}
      >
        <p className="text-[11px] font-semibold" style={{ color: styles.textPrimary }}>
          {step.label}
        </p>
        <p className="text-[9px] font-medium mt-0.5" style={{ color: stateColor }}>
          {stateLabel}
        </p>
        {timestamp && (
          <p className="text-[9px] mt-0.5" style={{ color: styles.textMuted }}>
            {timestamp}
          </p>
        )}
      </div>
      {/* Arrow */}
      <div
        className="w-0 h-0 mx-auto"
        style={{
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: `5px solid ${styles.border}`,
        }}
      />
    </div>
  );
};

export const OrderTrackingStepper: React.FC<OrderTrackingStepperProps> = ({ order, role }) => {
  const { styles } = usePortal();
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const dotRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
        const state = getStepState(step, order);
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
            <div
              className="flex-shrink-0 relative cursor-pointer"
              ref={(el) => {
                dotRefs.current[step.key] = el;
              }}
              onMouseEnter={() => setHoveredStep(step.key)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <div
                className="flex items-center justify-center transition-all"
                style={{
                  width: state === 'active' ? 12 : 8,
                  height: state === 'active' ? 12 : 8,
                  animation: state === 'active' ? 'softPulse 2s ease-in-out infinite' : undefined,
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
              {hoveredStep === step.key && dotRefs.current[step.key] && (
                <StepTooltip
                  step={step}
                  state={state}
                  order={order}
                  anchorRef={{ current: dotRefs.current[step.key] }}
                  styles={styles}
                />
              )}
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
