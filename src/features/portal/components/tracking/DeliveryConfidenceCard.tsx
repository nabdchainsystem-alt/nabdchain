// =============================================================================
// Delivery Confidence Card Component
// =============================================================================
// Buyer-only: Large, calm card showing estimated delivery and confidence
// Designed to build trust and reduce anxiety
// =============================================================================

import React from 'react';
import {
  CalendarCheck,
  CheckCircle,
  Warning,
  Clock,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { DeliveryConfidenceCardProps, getConfidenceConfig } from './tracking.types';

// =============================================================================
// Helper Functions
// =============================================================================

const formatDeliveryDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatShortDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// =============================================================================
// Main Component
// =============================================================================

export const DeliveryConfidenceCard: React.FC<DeliveryConfidenceCardProps> = ({
  confidence,
  message,
  estimatedDelivery,
  actualDelivery,
}) => {
  const { styles, direction, t } = usePortal();
  const isRtl = direction === 'rtl';
  const config = getConfidenceConfig(confidence);

  // If delivered, show the actual delivery date
  const isDelivered = !!actualDelivery;

  return (
    <div
      className="mx-6 my-6 p-6 rounded-xl transition-all"
      style={{
        backgroundColor: styles.isDark
          ? `${config.bgColor}20`
          : config.bgColor,
        border: `1px solid ${config.dotColor}30`,
      }}
    >
      {/* Main content */}
      <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${config.dotColor}15`,
          }}
        >
          {isDelivered ? (
            <CheckCircle size={28} weight="fill" style={{ color: config.dotColor }} />
          ) : confidence === 'delayed' ? (
            <Warning size={28} weight="fill" style={{ color: config.dotColor }} />
          ) : (
            <CalendarCheck size={28} weight="duotone" style={{ color: config.dotColor }} />
          )}
        </div>

        {/* Text content */}
        <div className="flex-1">
          {/* Delivered state */}
          {isDelivered ? (
            <>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: config.textColor }}
              >
                {t('tracking.delivered') || 'Delivered'}
              </p>
              <p
                className="text-xl font-semibold"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {formatDeliveryDate(actualDelivery)}
              </p>
            </>
          ) : (
            <>
              {/* Estimated delivery label */}
              <p
                className="text-sm font-medium mb-1"
                style={{ color: config.textColor }}
              >
                {t('tracking.estimatedDelivery') || 'Estimated Delivery'}
              </p>

              {/* Main date */}
              {estimatedDelivery ? (
                <p
                  className="text-xl font-semibold"
                  style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                >
                  {formatDeliveryDate(estimatedDelivery)}
                </p>
              ) : (
                <p
                  className="text-lg"
                  style={{ color: styles.textSecondary }}
                >
                  {t('tracking.calculatingEta') || 'Calculating estimated delivery...'}
                </p>
              )}
            </>
          )}

          {/* Confidence message */}
          <div className={`flex items-center gap-2 mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: config.dotColor }}
            />
            <p
              className="text-sm"
              style={{ color: styles.textSecondary }}
            >
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Delay-specific info */}
      {confidence === 'delayed' && estimatedDelivery && (
        <div
          className={`mt-4 pt-4 border-t flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
          style={{ borderColor: `${config.dotColor}30` }}
        >
          <Clock size={16} style={{ color: styles.textMuted }} />
          <p className="text-sm" style={{ color: styles.textMuted }}>
            {t('tracking.newEstimate') || 'New estimated date'}:{' '}
            <span style={{ color: styles.textPrimary, fontWeight: 500 }}>
              {formatShortDate(estimatedDelivery)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryConfidenceCard;
