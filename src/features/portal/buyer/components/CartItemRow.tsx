// =============================================================================
// Cart Item Row - Single item in cart with purchase method indicator
// =============================================================================
// Compact, scannable row with Buy Now eligibility visual cues
// Clear price type labeling: Confirmed (fixed) vs Estimated (requires quote)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Minus, Plus, X, Package, Warning, Lightning, ChatCircleText, Check, Info, CheckCircle, Clock } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { CartItem, CartItemEligibility, PurchaseMethod } from '../../types/cart.types';

// =============================================================================
// Price Type Badge - Shows Confirmed vs Estimated pricing
// =============================================================================
const PriceTypeBadge = React.memo<{
  type: 'confirmed' | 'estimated';
  compact?: boolean;
}>(({ type, compact = false }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const isConfirmed = type === 'confirmed';
  const color = isConfirmed ? styles.success : '#f59e0b';
  const Icon = isConfirmed ? CheckCircle : Clock;
  const label = isConfirmed ? 'Confirmed' : 'Estimated';

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}
        title={isConfirmed ? 'Fixed price - ready for purchase' : 'Price may change after quote'}
      >
        <Icon size={10} weight="fill" style={{ color }} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isRtl ? 'flex-row-reverse' : ''}`}
      style={{
        backgroundColor: `${color}12`,
        color,
      }}
      title={isConfirmed ? 'Fixed price - ready for purchase' : 'Price may change after quote'}
    >
      <Icon size={10} weight="fill" />
      <span>{label}</span>
    </div>
  );
});

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onPurchaseMethodChange?: (method: PurchaseMethod) => void;
  eligibility?: CartItemEligibility;
  isUpdating?: boolean;
  showPurchaseMethod?: boolean;
  showPriceType?: boolean;
}

export const CartItemRow = React.memo<CartItemRowProps>(({
  item,
  onQuantityChange,
  onRemove,
  onPurchaseMethodChange,
  eligibility,
  isUpdating = false,
  showPurchaseMethod = true,
  showPriceType = true,
}) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // Local quantity state for immediate UI feedback
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  // Sync with prop changes
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  // Get item details
  const name = item.item?.name || item.itemName || 'Unknown Item';
  const sku = item.item?.sku || item.itemSku || '';
  const price = item.item?.price ?? item.priceAtAdd ?? 0;
  const currency = item.item?.currency || 'SAR';
  const stock = item.item?.stock ?? 0;
  const minOrderQty = item.item?.minOrderQty ?? 1;
  const maxOrderQty = item.item?.maxOrderQty;
  const images = item.item?.images ? JSON.parse(item.item.images) : [];
  const imageUrl = images[0] || null;
  const isAvailable = item.item?.status === 'active';

  // Calculate subtotal
  const subtotal = price * localQuantity;

  // Stock warning
  const isLowStock = stock > 0 && stock < localQuantity;
  const isOutOfStock = stock === 0;

  // Buy Now eligibility
  const isBuyNowEligible = eligibility?.buyNow.eligible ?? false;
  const selectedMethod = item.selectedMethod || eligibility?.recommendedMethod || 'request_quote';

  // Determine price type based on eligibility and seller settings
  const isFixedPrice = item.item?.isFixedPrice ?? false;
  const allowDirectPurchase = item.item?.allowDirectPurchase ?? false;
  const priceType: 'confirmed' | 'estimated' = (isFixedPrice && allowDirectPurchase && isBuyNowEligible) ? 'confirmed' : 'estimated';

  // Handle quantity change - memoized
  const handleQuantityChange = useCallback((newQty: number) => {
    const validQty = Math.max(minOrderQty, Math.min(newQty, maxOrderQty || Infinity));
    setLocalQuantity(validQty);
    onQuantityChange(validQty);
  }, [minOrderQty, maxOrderQty, onQuantityChange]);

  const handleIncrement = useCallback(() => {
    if (!maxOrderQty || localQuantity < maxOrderQty) {
      handleQuantityChange(localQuantity + 1);
    }
  }, [maxOrderQty, localQuantity, handleQuantityChange]);

  const handleDecrement = useCallback(() => {
    if (localQuantity > minOrderQty) {
      handleQuantityChange(localQuantity - 1);
    }
  }, [localQuantity, minOrderQty, handleQuantityChange]);

  const handleMethodChange = useCallback((method: PurchaseMethod) => {
    if (onPurchaseMethodChange && (method === 'request_quote' || isBuyNowEligible)) {
      onPurchaseMethodChange(method);
    }
  }, [onPurchaseMethodChange, isBuyNowEligible]);

  // Memoized handler for input onChange
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleQuantityChange(parseInt(e.target.value, 10) || minOrderQty);
  }, [handleQuantityChange, minOrderQty]);

  return (
    <div
      className={`flex gap-3 p-3 border-b transition-opacity ${isRtl ? 'flex-row-reverse' : ''} ${
        isUpdating ? 'opacity-50' : ''
      }`}
      style={{ borderColor: styles.border }}
    >
      {/* Image - Smaller for compactness */}
      <div
        className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
        style={{ backgroundColor: styles.bgSecondary }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={20} style={{ color: styles.textMuted }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
        {/* Top row: Name, Price, Remove */}
        <div className={`flex items-start justify-between gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="flex-1 min-w-0">
            <h4
              className="font-medium text-sm truncate"
              style={{ color: isAvailable ? styles.textPrimary : styles.textMuted }}
            >
              {name}
            </h4>
            <div className={`flex items-center gap-2 text-xs flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`} style={{ color: styles.textMuted }}>
              {sku && <span>SKU: {sku}</span>}
              <span>•</span>
              <span className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {currency} {price.toLocaleString()}/unit
                {showPriceType && <PriceTypeBadge type={priceType} compact />}
              </span>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={onRemove}
            disabled={isUpdating}
            className="p-1 rounded-full transition-colors hover:bg-red-50 flex-shrink-0"
            style={{ color: styles.textMuted }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Middle row: Quantity + Stock + Subtotal */}
        <div className={`flex items-center justify-between gap-3 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Quantity Controls - Compact */}
            <div
              className="flex items-center rounded-md overflow-hidden"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <button
                onClick={handleDecrement}
                disabled={localQuantity <= minOrderQty || isUpdating}
                className="p-1.5 transition-colors disabled:opacity-50"
                style={{
                  color: localQuantity <= minOrderQty ? styles.textMuted : styles.textPrimary,
                }}
              >
                <Minus size={14} weight="bold" />
              </button>
              <input
                type="number"
                value={localQuantity}
                onChange={handleInputChange}
                min={minOrderQty}
                max={maxOrderQty || undefined}
                disabled={isUpdating}
                className="w-10 text-center bg-transparent border-none outline-none text-sm font-medium"
                style={{ color: styles.textPrimary }}
              />
              <button
                onClick={handleIncrement}
                disabled={(maxOrderQty !== null && localQuantity >= maxOrderQty) || isUpdating}
                className="p-1.5 transition-colors disabled:opacity-50"
                style={{
                  color:
                    maxOrderQty && localQuantity >= maxOrderQty
                      ? styles.textMuted
                      : styles.textPrimary,
                }}
              >
                <Plus size={14} weight="bold" />
              </button>
            </div>

            {/* Stock Warning - Compact */}
            {(isLowStock || isOutOfStock) && (
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: isOutOfStock ? styles.error : styles.warning }}
              >
                <Warning size={12} weight="fill" />
                <span>{isOutOfStock ? 'Out of stock' : `${stock} left`}</span>
              </div>
            )}
          </div>

          {/* Subtotal with Price Type */}
          <div className={`${isRtl ? 'text-left' : 'text-right'}`}>
            <p className="font-semibold text-sm" style={{ color: styles.textPrimary }}>
              {currency} {subtotal.toLocaleString()}
            </p>
            {showPriceType && (
              <div className={`mt-0.5 ${isRtl ? 'text-left' : 'text-right'}`}>
                <PriceTypeBadge type={priceType} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Purchase Method Selector */}
        {showPurchaseMethod && (
          <div className={`flex items-center gap-2 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Buy Now Option */}
            <button
              onClick={() => handleMethodChange('buy_now')}
              disabled={!isBuyNowEligible || isUpdating}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isRtl ? 'flex-row-reverse' : ''
              } ${!isBuyNowEligible ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                backgroundColor: selectedMethod === 'buy_now' && isBuyNowEligible
                  ? `${styles.success}15`
                  : styles.bgSecondary,
                color: selectedMethod === 'buy_now' && isBuyNowEligible
                  ? styles.success
                  : !isBuyNowEligible
                    ? styles.textMuted
                    : styles.textSecondary,
                border: selectedMethod === 'buy_now' && isBuyNowEligible
                  ? `1px solid ${styles.success}40`
                  : '1px solid transparent',
                opacity: !isBuyNowEligible ? 0.5 : 1,
              }}
              title={!isBuyNowEligible ? eligibility?.buyNow.reason : 'Buy at fixed price'}
            >
              <Lightning size={12} weight={selectedMethod === 'buy_now' ? 'fill' : 'regular'} />
              <span>Buy Now</span>
              {selectedMethod === 'buy_now' && isBuyNowEligible && (
                <Check size={12} weight="bold" />
              )}
            </button>

            {/* Request Quote Option */}
            <button
              onClick={() => handleMethodChange('request_quote')}
              disabled={isUpdating}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isRtl ? 'flex-row-reverse' : ''
              }`}
              style={{
                backgroundColor: selectedMethod === 'request_quote'
                  ? `${styles.info}15`
                  : styles.bgSecondary,
                color: selectedMethod === 'request_quote'
                  ? styles.info
                  : styles.textSecondary,
                border: selectedMethod === 'request_quote'
                  ? `1px solid ${styles.info}40`
                  : '1px solid transparent',
              }}
              title="Request negotiated pricing"
            >
              <ChatCircleText size={12} weight={selectedMethod === 'request_quote' ? 'fill' : 'regular'} />
              <span>Request Quote</span>
              {selectedMethod === 'request_quote' && (
                <Check size={12} weight="bold" />
              )}
            </button>

            {/* Eligibility hint */}
            {!isBuyNowEligible && eligibility?.buyNow.reason && (
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: styles.textMuted }}
                title={eligibility.buyNow.reason}
              >
                <Info size={12} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default CartItemRow;
