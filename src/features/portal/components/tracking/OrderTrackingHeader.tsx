// =============================================================================
// Order Tracking Header Component
// =============================================================================
// Shared header displaying order ID, parties, and status badge
// =============================================================================

import React from 'react';
import {
  X,
  ArrowLeft,
  Package,
  User,
  Storefront,
  Hash,
  FileText,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { OrderTrackingHeaderProps, getConfidenceConfig } from './tracking.types';

// =============================================================================
// Helper Functions
// =============================================================================

const formatOrderNumber = (orderNumber: string): string => {
  // Display a shortened version if too long
  if (orderNumber.length > 12) {
    return `${orderNumber.slice(0, 8)}...`;
  }
  return orderNumber;
};

// =============================================================================
// Main Component
// =============================================================================

export const OrderTrackingHeader: React.FC<OrderTrackingHeaderProps> = ({
  order,
  role,
  deliveryConfidence,
  onClose,
}) => {
  const { styles, direction, t } = usePortal();
  const isRtl = direction === 'rtl';
  const confidenceConfig = getConfidenceConfig(deliveryConfidence);

  return (
    <div
      className="border-b"
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgPrimary,
      }}
    >
      {/* Top row: Back button + Order number + Close */}
      <div className={`flex items-center justify-between px-6 py-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
              style={{ color: styles.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = styles.bgSecondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
          )}
          <div>
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Hash size={16} style={{ color: styles.textMuted }} />
              <span
                className="text-lg font-semibold"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {formatOrderNumber(order.orderNumber)}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
              {t('tracking.title') || 'Order Tracking'}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: styles.isDark
              ? `${confidenceConfig.bgColor}30`
              : confidenceConfig.bgColor,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: confidenceConfig.dotColor }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: confidenceConfig.textColor }}
          >
            {confidenceConfig.label}
          </span>
        </div>
      </div>

      {/* Second row: Product and parties info */}
      <div
        className="px-6 pb-4"
        style={{ borderColor: styles.border }}
      >
        {/* Product info */}
        <div className={`flex items-center gap-3 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {order.itemImage ? (
            <img
              src={order.itemImage}
              alt={order.itemName}
              className="w-12 h-12 rounded-lg object-cover"
              style={{ border: `1px solid ${styles.border}` }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <Package size={24} style={{ color: styles.textMuted }} />
            </div>
          )}
          <div className={isRtl ? 'text-right' : ''}>
            <p
              className="font-medium text-sm"
              style={{ color: styles.textPrimary }}
            >
              {order.itemName}
            </p>
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {order.quantity} {order.quantity > 1 ? 'units' : 'unit'} • {order.itemSku}
            </p>
          </div>
        </div>

        {/* Parties info - Buyer and Seller */}
        <div className={`flex items-center gap-6 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Buyer info (show to seller) */}
          {role === 'seller' && (
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <User size={16} style={{ color: styles.textMuted }} />
              <span style={{ color: styles.textSecondary }}>
                {order.buyerCompany || order.buyerName}
              </span>
            </div>
          )}

          {/* Seller info (show to buyer) - we'd need seller name from order */}
          {role === 'buyer' && (
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Storefront size={16} style={{ color: styles.textMuted }} />
              <span style={{ color: styles.textSecondary }}>
                {t('tracking.seller') || 'Seller'}
              </span>
            </div>
          )}

          {/* RFQ reference if exists */}
          {order.rfqNumber && (
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <FileText size={16} style={{ color: styles.textMuted }} />
              <span style={{ color: styles.textMuted }}>
                RFQ #{order.rfqNumber}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingHeader;
