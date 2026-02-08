// =============================================================================
// Cart Summary - Sticky sidebar with dual purchase flow actions
// =============================================================================
// Shows split totals for Buy Now vs Request Quote items
// Clear price type labeling: Confirmed (Buy Now) vs Estimated (RFQ)
// =============================================================================

import React from 'react';
import {
  ShoppingCart,
  PaperPlaneTilt,
  SpinnerGap,
  Storefront,
  Package,
  Trash,
  Lightning,
  ArrowRight,
  CheckCircle,
  Clock,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Cart } from '../../types/cart.types';

// =============================================================================
// Price Type Badge - Confirmed vs Estimated
// =============================================================================
const PriceTypeBadge: React.FC<{
  type: 'confirmed' | 'estimated';
}> = ({ type }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const isConfirmed = type === 'confirmed';
  const color = isConfirmed ? styles.success : '#f59e0b';
  const Icon = isConfirmed ? CheckCircle : Clock;
  const label = isConfirmed ? 'Confirmed' : 'Estimated';

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isRtl ? 'flex-row-reverse' : ''}`}
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <Icon size={10} weight="fill" />
      <span>{label}</span>
    </div>
  );
};

interface CartSummaryProps {
  cart: Cart;
  buyNowTotal: number;
  rfqTotal: number;
  buyNowItemCount: number;
  rfqItemCount: number;
  onRequestAll: () => void;
  onBuyNowAll: () => void;
  onClearCart: () => void;
  onContinueBrowsing: () => void;
  isProcessingRFQ?: boolean;
  isProcessingBuyNow?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  buyNowTotal,
  rfqTotal,
  buyNowItemCount,
  rfqItemCount,
  onRequestAll,
  onBuyNowAll,
  onClearCart,
  onContinueBrowsing,
  isProcessingRFQ = false,
  isProcessingBuyNow = false,
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const hasItems = cart.items.length > 0;
  const isProcessing = isProcessingRFQ || isProcessingBuyNow;
  const hasBuyNowItems = buyNowItemCount > 0;
  const hasRFQItems = rfqItemCount > 0;

  return (
    <div
      className="rounded-xl overflow-hidden sticky top-4"
      style={{
        backgroundColor: styles.bgPrimary,
        border: `1px solid ${styles.border}`,
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 p-3 ${isRtl ? 'flex-row-reverse' : ''}`}
        style={{ borderBottom: `1px solid ${styles.border}` }}
      >
        <ShoppingCart size={20} weight="duotone" style={{ color: styles.info }} />
        <h2 className="font-semibold" style={{ color: styles.textPrimary }}>
          {t('cart.summary.title') || 'Order Summary'}
        </h2>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${styles.border}` }}>
        {/* Items Count */}
        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Package size={16} style={{ color: styles.textMuted }} />
            <span className="text-sm" style={{ color: styles.textMuted }}>
              {t('cart.summary.items') || 'Items'}
            </span>
          </div>
          <span className="font-medium text-sm" style={{ color: styles.textPrimary }}>
            {cart.itemCount}
          </span>
        </div>

        {/* Sellers Count */}
        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Storefront size={16} style={{ color: styles.textMuted }} />
            <span className="text-sm" style={{ color: styles.textMuted }}>
              {t('cart.summary.sellers') || 'Sellers'}
            </span>
          </div>
          <span className="font-medium text-sm" style={{ color: styles.textPrimary }}>
            {cart.sellerCount}
          </span>
        </div>
      </div>

      {/* Dual Flow Totals - Clear Price Type Labels */}
      <div className="p-3 space-y-3" style={{ borderBottom: `1px solid ${styles.border}` }}>
        {/* Buy Now Section - Confirmed Price */}
        {hasBuyNowItems && (
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: `${styles.success}05`,
              borderColor: `${styles.success}25`,
            }}
          >
            <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Lightning size={16} weight="fill" style={{ color: styles.success }} />
                <span className="text-sm font-semibold" style={{ color: styles.success }}>
                  Buy Now
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${styles.success}15`, color: styles.success }}
                >
                  {buyNowItemCount}
                </span>
              </div>
              <PriceTypeBadge type="confirmed" />
            </div>
            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs" style={{ color: styles.textMuted }}>
                Ready for checkout
              </span>
              <span className="font-bold text-lg" style={{ color: styles.success }}>
                {cart.currency} {buyNowTotal.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* RFQ Section - Estimated Price */}
        {hasRFQItems && (
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: '#f59e0b08',
              borderColor: '#f59e0b25',
            }}
          >
            <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <PaperPlaneTilt size={16} weight="fill" style={{ color: '#f59e0b' }} />
                <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
                  Request Quote
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}
                >
                  {rfqItemCount}
                </span>
              </div>
              <PriceTypeBadge type="estimated" />
            </div>
            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs" style={{ color: styles.textMuted }}>
                Price negotiable
              </span>
              <span className="font-bold text-lg" style={{ color: '#f59e0b' }}>
                {cart.currency} {rfqTotal.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Total */}
        <div
          className={`flex items-center justify-between pt-2 ${isRtl ? 'flex-row-reverse' : ''}`}
          style={{ borderTop: `1px solid ${styles.border}` }}
        >
          <span className="font-medium text-sm" style={{ color: styles.textPrimary }}>
            {t('cart.summary.total') || 'Total'}
          </span>
          <div className={`text-right ${isRtl ? 'text-left' : ''}`}>
            <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
              {cart.currency} {cart.estimatedTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Price Type Legend */}
      <div
        className="px-3 py-2.5"
        style={{ backgroundColor: `${styles.bgSecondary}`, borderBottom: `1px solid ${styles.border}` }}
      >
        <div className={`flex items-center justify-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-1.5 text-[10px] ${isRtl ? 'flex-row-reverse' : ''}`}>
            <CheckCircle size={12} weight="fill" style={{ color: styles.success }} />
            <span style={{ color: styles.textMuted }}>Confirmed = Final price</span>
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Clock size={12} weight="fill" style={{ color: '#f59e0b' }} />
            <span style={{ color: styles.textMuted }}>Estimated = Negotiable</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        {/* Buy Now All - Primary when there are Buy Now items */}
        {hasBuyNowItems && (
          <button
            onClick={onBuyNowAll}
            disabled={!hasItems || isProcessing || cart.isLocked}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
            style={{
              backgroundColor: styles.success,
              color: '#fff',
            }}
          >
            {isProcessingBuyNow ? (
              <SpinnerGap size={18} className="animate-spin" />
            ) : (
              <Lightning size={18} weight="fill" />
            )}
            <span>Buy Now ({buyNowItemCount})</span>
            <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />
          </button>
        )}

        {/* Request RFQ for All */}
        {hasRFQItems && (
          <button
            onClick={onRequestAll}
            disabled={!hasItems || isProcessing || cart.isLocked}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
            style={{
              backgroundColor: hasBuyNowItems ? `${styles.info}15` : styles.info,
              color: hasBuyNowItems ? styles.info : '#fff',
            }}
          >
            {isProcessingRFQ ? (
              <SpinnerGap size={18} className="animate-spin" />
            ) : (
              <PaperPlaneTilt size={18} weight="bold" />
            )}
            <span>Request Quote ({rfqItemCount})</span>
          </button>
        )}

        {/* Secondary Actions */}
        <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Continue Browsing */}
          <button
            onClick={onContinueBrowsing}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: styles.bgSecondary,
              color: styles.textPrimary,
            }}
          >
            {t('cart.summary.continueBrowsing') || 'Continue Browsing'}
          </button>

          {/* Clear Cart */}
          <button
            onClick={onClearCart}
            disabled={!hasItems || isProcessing}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: `${styles.error}10`,
              color: styles.error,
            }}
            title="Clear cart"
          >
            <Trash size={16} />
          </button>
        </div>

        {/* Locked Cart Message */}
        {cart.isLocked && (
          <div
            className="p-2 rounded-lg text-xs text-center"
            style={{ backgroundColor: `${styles.warning}15`, color: styles.warning }}
          >
            {t('cart.summary.locked') || 'Cart is locked. Clear to add new items.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSummary;
