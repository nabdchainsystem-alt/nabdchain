// =============================================================================
// Add to Cart Button - Reusable button for adding items to cart
// =============================================================================

import React, { useState } from 'react';
import { ShoppingCart, Check, SpinnerGap, Plus, Minus, Trash } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useCart } from '../../context/CartContext';

interface AddToCartButtonProps {
  itemId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showQuantity?: boolean;
  minOrderQty?: number;
  maxOrderQty?: number | null;
  disabled?: boolean;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  itemId,
  className = '',
  _variant = 'primary',
  _size = 'md',
  showQuantity = false,
  minOrderQty = 1,
  maxOrderQty = null,
  disabled = false,
}) => {
  const { styles, direction } = usePortal();
  const { addToCart, isItemInCart, getItemQuantity, updateQuantity, removeFromCart, pendingOperations } = useCart();
  const isRtl = direction === 'rtl';

  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quantity, setQuantity] = useState(minOrderQty);

  const inCart = isItemInCart(itemId);
  const cartQuantity = getItemQuantity(itemId);
  const isUpdating =
    pendingOperations.has(`add-${itemId}`) ||
    pendingOperations.has(`update-${itemId}`) ||
    pendingOperations.has(`remove-${itemId}`);

  const handleAddToCart = async () => {
    if (isAdding || disabled) return;

    setIsAdding(true);
    try {
      await addToCart(itemId, showQuantity ? quantity : 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (_error) {
      // Error handled by context
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = async () => {
    if (maxOrderQty && cartQuantity >= maxOrderQty) return;
    await updateQuantity(itemId, cartQuantity + 1);
  };

  const handleDecrement = async () => {
    if (cartQuantity <= minOrderQty) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, cartQuantity - 1);
    }
  };

  // If in cart - show quantity controls
  if (inCart && showQuantity) {
    return (
      <div
        className={`flex items-center w-full rounded-lg overflow-hidden border ${className}`}
        style={{
          borderColor: styles.success,
          backgroundColor: `${styles.success}08`,
        }}
      >
        {/* Decrement / Remove */}
        <button
          onClick={handleDecrement}
          disabled={isUpdating}
          className="flex items-center justify-center w-10 h-9 transition-colors hover:bg-black/5 disabled:opacity-50"
          style={{ color: cartQuantity <= minOrderQty ? '#ef4444' : styles.textPrimary }}
          title={cartQuantity <= minOrderQty ? 'Remove from cart' : 'Decrease quantity'}
        >
          {cartQuantity <= minOrderQty ? <Trash size={16} weight="bold" /> : <Minus size={16} weight="bold" />}
        </button>

        {/* Quantity Display */}
        <div className="flex-1 flex items-center justify-center gap-2 h-9">
          {isUpdating ? (
            <SpinnerGap size={16} className="animate-spin" style={{ color: styles.success }} />
          ) : (
            <>
              <Check size={14} weight="bold" style={{ color: styles.success }} />
              <span className="text-sm font-medium" style={{ color: styles.success }}>
                {cartQuantity} in cart
              </span>
            </>
          )}
        </div>

        {/* Increment */}
        <button
          onClick={handleIncrement}
          disabled={isUpdating || (maxOrderQty !== null && cartQuantity >= maxOrderQty)}
          className="flex items-center justify-center w-10 h-9 transition-colors hover:bg-black/5 disabled:opacity-50"
          style={{ color: styles.textPrimary }}
        >
          <Plus size={16} weight="bold" />
        </button>
      </div>
    );
  }

  // If in cart (simple view - no quantity controls)
  if (inCart && !showQuantity) {
    return (
      <button
        className={`flex items-center justify-center gap-2 w-full h-9 rounded-lg font-medium transition-all ${
          isRtl ? 'flex-row-reverse' : ''
        } ${className}`}
        style={{
          backgroundColor: `${styles.success}15`,
          color: styles.success,
          border: `1px solid ${styles.success}`,
        }}
        disabled
      >
        <Check size={16} weight="bold" />
        <span className="text-sm">In Cart ({cartQuantity})</span>
      </button>
    );
  }

  // Add to cart button with quantity selector
  if (showQuantity) {
    return (
      <div
        className={`flex items-center w-full rounded-lg overflow-hidden border ${className}`}
        style={{
          borderColor: styles.border,
          backgroundColor: styles.bgCard,
        }}
      >
        {/* Decrement */}
        <button
          onClick={() => setQuantity(Math.max(minOrderQty, quantity - 1))}
          disabled={quantity <= minOrderQty || disabled}
          className="flex items-center justify-center w-9 h-9 transition-colors hover:bg-black/5 disabled:opacity-30"
          style={{ color: styles.textSecondary }}
        >
          <Minus size={14} weight="bold" />
        </button>

        {/* Quantity Input */}
        <div className="w-8 flex items-center justify-center">
          <span className="text-sm font-medium tabular-nums" style={{ color: styles.textPrimary }}>
            {quantity}
          </span>
        </div>

        {/* Increment */}
        <button
          onClick={() => setQuantity(Math.min(maxOrderQty || Infinity, quantity + 1))}
          disabled={(maxOrderQty !== null && quantity >= maxOrderQty) || disabled}
          className="flex items-center justify-center w-9 h-9 transition-colors hover:bg-black/5 disabled:opacity-30"
          style={{ color: styles.textSecondary }}
        >
          <Plus size={14} weight="bold" />
        </button>

        {/* Add Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || disabled}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 font-medium transition-all hover:opacity-90 disabled:opacity-50 ${
            isRtl ? 'flex-row-reverse' : ''
          }`}
          style={{
            backgroundColor: styles.isDark ? '#fff' : '#000',
            color: styles.isDark ? '#000' : '#fff',
          }}
        >
          {isAdding ? (
            <SpinnerGap size={14} className="animate-spin" />
          ) : showSuccess ? (
            <Check size={14} weight="bold" />
          ) : (
            <ShoppingCart size={14} weight="bold" />
          )}
          <span className="text-xs font-medium">{isAdding ? 'Adding...' : showSuccess ? 'Added!' : 'Add to Cart'}</span>
        </button>
      </div>
    );
  }

  // Simple add to cart button (no quantity)
  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding || disabled}
      className={`flex items-center justify-center gap-2 w-full h-9 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 ${
        isRtl ? 'flex-row-reverse' : ''
      } ${className}`}
      style={{
        backgroundColor: styles.isDark ? '#fff' : '#000',
        color: styles.isDark ? '#000' : '#fff',
      }}
    >
      {isAdding ? (
        <SpinnerGap size={16} className="animate-spin" />
      ) : showSuccess ? (
        <Check size={16} weight="bold" />
      ) : (
        <ShoppingCart size={16} weight="bold" />
      )}
      <span className="text-sm">{isAdding ? 'Adding...' : showSuccess ? 'Added!' : 'Add to Cart'}</span>
    </button>
  );
};

export default AddToCartButton;
