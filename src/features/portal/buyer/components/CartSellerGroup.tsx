// =============================================================================
// Cart Seller Group - Items grouped by seller with dual actions
// =============================================================================
// Supports both Buy Now (direct purchase) and Request Quote (RFQ) flows
// Clear visual separation between Confirmed and Estimated price items
// =============================================================================

import React from 'react';
import { Storefront, PaperPlaneTilt, SpinnerGap, Lightning, ShieldCheck, CheckCircle, Clock } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { CartSellerGroup as CartSellerGroupType, CartItemEligibility, PurchaseMethod } from '../../types/cart.types';
import { CartItemRow } from './CartItemRow';

interface CartSellerGroupProps {
  group: CartSellerGroupType;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onRequestRFQ: () => void;
  onBuyNow?: () => void;
  onItemPurchaseMethodChange?: (itemId: string, method: PurchaseMethod) => void;
  getItemEligibility?: (itemId: string) => CartItemEligibility | undefined;
  isProcessingRFQ?: boolean;
  isProcessingBuyNow?: boolean;
  updatingItems?: Set<string>;
}

export const CartSellerGroup: React.FC<CartSellerGroupProps> = ({
  group,
  onQuantityChange,
  onRemoveItem,
  onRequestRFQ,
  onBuyNow,
  onItemPurchaseMethodChange,
  getItemEligibility,
  isProcessingRFQ = false,
  isProcessingBuyNow = false,
  updatingItems = new Set(),
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const isProcessing = isProcessingRFQ || isProcessingBuyNow;

  // Calculate Buy Now and RFQ item counts from selected methods
  const buyNowCount = group.items.filter(item => item.selectedMethod === 'buy_now').length;
  const rfqCount = group.items.filter(item => !item.selectedMethod || item.selectedMethod === 'request_quote').length;

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{
        backgroundColor: styles.bgPrimary,
        border: `1px solid ${styles.border}`,
      }}
    >
      {/* Seller Header */}
      <div
        className={`flex items-center justify-between p-3 ${isRtl ? 'flex-row-reverse' : ''}`}
        style={{ borderBottom: `1px solid ${styles.border}` }}
      >
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Seller Icon */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${styles.info}15` }}
          >
            <Storefront size={18} weight="duotone" style={{ color: styles.info }} />
          </div>

          {/* Seller Info */}
          <div className={isRtl ? 'text-right' : ''}>
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <h3 className="font-semibold text-sm" style={{ color: styles.textPrimary }}>
                {group.sellerName}
              </h3>
              {group.hasBuyNowEligible && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: `${styles.success}15`, color: styles.success }}
                >
                  <ShieldCheck size={10} weight="fill" />
                  <span>Verified</span>
                </div>
              )}
            </div>
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {group.items.length} {group.items.length === 1 ? 'item' : 'items'} · {group.itemCount}{' '}
              {group.itemCount === 1 ? 'unit' : 'units'}
            </p>
          </div>
        </div>

        {/* Dual Action Buttons */}
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Buy Now Button - Only show if there are Buy Now eligible items */}
          {group.hasBuyNowEligible && onBuyNow && buyNowCount > 0 && (
            <button
              onClick={onBuyNow}
              disabled={isProcessing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}
              style={{
                backgroundColor: styles.success,
                color: '#fff',
              }}
            >
              {isProcessingBuyNow ? (
                <SpinnerGap size={14} className="animate-spin" />
              ) : (
                <Lightning size={14} weight="fill" />
              )}
              <span>Buy Now ({buyNowCount})</span>
            </button>
          )}

          {/* Request RFQ Button */}
          {rfqCount > 0 && (
            <button
              onClick={onRequestRFQ}
              disabled={isProcessing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}
              style={{
                backgroundColor: `${styles.info}15`,
                color: styles.info,
              }}
            >
              {isProcessingRFQ ? (
                <SpinnerGap size={14} className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={14} weight="bold" />
              )}
              <span>{t('cart.requestRFQ') || 'Request Quote'} ({rfqCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div>
        {group.items.map((item) => {
          const eligibility = getItemEligibility?.(item.itemId);
          return (
            <CartItemRow
              key={item.id}
              item={item}
              onQuantityChange={(qty) => onQuantityChange(item.itemId, qty)}
              onRemove={() => onRemoveItem(item.itemId)}
              onPurchaseMethodChange={onItemPurchaseMethodChange
                ? (method) => onItemPurchaseMethodChange(item.itemId, method)
                : undefined
              }
              eligibility={eligibility}
              isUpdating={updatingItems.has(item.itemId) || isProcessing}
              showPurchaseMethod={true}
            />
          );
        })}
      </div>

      {/* Seller Subtotal - Split by purchase method with price type labels */}
      <div
        className={`p-3 ${isRtl ? 'text-right' : ''}`}
        style={{ backgroundColor: styles.bgSecondary }}
      >
        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs" style={{ color: styles.textMuted }}>
            {t('cart.sellerSubtotal') || 'Subtotal'}
          </span>
          <span className="font-semibold text-sm" style={{ color: styles.textPrimary }}>
            SAR {group.subtotal.toLocaleString()}
          </span>
        </div>

        {/* Price type breakdown - always show if there are items */}
        {(buyNowCount > 0 || rfqCount > 0) && (
          <div className={`flex items-center gap-4 mt-2 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
            {buyNowCount > 0 && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded ${isRtl ? 'flex-row-reverse' : ''}`}
                style={{ backgroundColor: `${styles.success}10` }}
              >
                <CheckCircle size={12} weight="fill" style={{ color: styles.success }} />
                <span style={{ color: styles.textMuted }}>Confirmed:</span>
                <span className="font-medium" style={{ color: styles.success }}>
                  SAR {group.buyNowSubtotal.toLocaleString()}
                </span>
              </div>
            )}
            {rfqCount > 0 && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded ${isRtl ? 'flex-row-reverse' : ''}`}
                style={{ backgroundColor: '#f59e0b10' }}
              >
                <Clock size={12} weight="fill" style={{ color: '#f59e0b' }} />
                <span style={{ color: styles.textMuted }}>Estimated:</span>
                <span className="font-medium" style={{ color: '#f59e0b' }}>
                  SAR {group.rfqSubtotal.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSellerGroup;
