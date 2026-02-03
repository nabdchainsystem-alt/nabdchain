// =============================================================================
// Purchase Timeline Component
// Visual timeline showing order lifecycle with actual vs expected dates
// =============================================================================

import React from 'react';
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  Handshake,
  Warning,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import {
  PurchaseTimelineEvent,
  TimelineState,
} from '../../../types/purchase.types';

interface PurchaseTimelineProps {
  events: PurchaseTimelineEvent[];
}

const stateIcons: Record<TimelineState, React.ElementType> = {
  created: Package,
  confirmed: CheckCircle,
  processing: Clock,
  shipped: Truck,
  in_transit: MapPin,
  delivered: Handshake,
};

export const PurchaseTimeline: React.FC<PurchaseTimelineProps> = ({ events }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNodeColor = (event: PurchaseTimelineEvent): string => {
    if (event.isDelayed) return styles.error;
    if (event.isCompleted) return styles.success;
    if (event.isCurrent) return styles.info;
    return styles.textMuted;
  };

  const getNodeBg = (event: PurchaseTimelineEvent): string => {
    if (event.isDelayed) return `${styles.error}20`;
    if (event.isCompleted) return `${styles.success}20`;
    if (event.isCurrent) return `${styles.info}20`;
    return styles.bgSecondary;
  };

  return (
    <div className="space-y-1">
      {events.map((event, idx) => {
        const Icon = stateIcons[event.state] || Clock;
        const color = getNodeColor(event);
        const bgColor = getNodeBg(event);
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} className="flex gap-4">
            {/* Timeline node and line */}
            <div className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  backgroundColor: bgColor,
                  border: event.isCurrent ? `2px solid ${color}` : 'none',
                }}
              >
                {event.isDelayed ? (
                  <Warning size={18} weight="fill" style={{ color }} />
                ) : (
                  <Icon
                    size={18}
                    weight={event.isCompleted || event.isCurrent ? 'fill' : 'regular'}
                    style={{ color }}
                  />
                )}
              </div>
              {!isLast && (
                <div
                  className="w-0.5 flex-1 min-h-[40px] my-1"
                  style={{
                    backgroundColor: event.isCompleted ? styles.success : styles.border,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-sm font-medium"
                  style={{ color: event.isCompleted || event.isCurrent ? styles.textPrimary : styles.textMuted }}
                >
                  {event.label}
                </span>
                {event.isDelayed && event.delayDays && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${styles.error}15`,
                      color: styles.error,
                    }}
                  >
                    +{event.delayDays} {event.delayDays === 1 ? 'day' : 'days'} {t('buyer.purchases.delayed') || 'delayed'}
                  </span>
                )}
                {event.isCurrent && !event.isDelayed && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${styles.info}15`,
                      color: styles.info,
                    }}
                  >
                    {t('buyer.purchases.current') || 'Current'}
                  </span>
                )}
              </div>

              {/* Dates row */}
              <div className="flex items-center gap-4 mt-1.5 text-xs">
                {/* Actual date */}
                <div className="flex items-center gap-1">
                  <span style={{ color: styles.textMuted }}>
                    {event.isCompleted ? (t('buyer.purchases.actual') || 'Actual') + ':' : ''}
                  </span>
                  <span
                    style={{
                      color: event.actualDate
                        ? (event.isDelayed ? styles.error : styles.textPrimary)
                        : styles.textMuted,
                    }}
                  >
                    {event.actualDate ? formatDate(event.actualDate) : (t('buyer.purchases.pending') || 'Pending')}
                  </span>
                </div>

                {/* Expected date (SLA) */}
                {event.expectedDate && (
                  <>
                    <span style={{ color: styles.textMuted }}>|</span>
                    <div className="flex items-center gap-1">
                      <span style={{ color: styles.textMuted }}>
                        {t('buyer.purchases.expected') || 'Expected'}:
                      </span>
                      <span style={{ color: styles.textMuted }}>
                        {formatDate(event.expectedDate)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {events.length === 0 && (
        <div
          className="text-center py-8"
          style={{ color: styles.textMuted }}
        >
          <Clock size={32} className="mx-auto mb-2" />
          <p className="text-sm">{t('buyer.purchases.noTimeline') || 'No timeline data available'}</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseTimeline;
