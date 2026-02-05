// =============================================================================
// Add to Cart Button - Reusable button for adding items to cart
// =============================================================================

import React, { useState } from 'react';
import { ShoppingCart, Check, SpinnerGap, Plus, Minus } from 'phosphor-react';
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
  variant = 'primary',
  size = 'md',
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
  const isUpdating = pendingOperations.has(`add-${itemId}`) ||
                     pendingOperations.has(`update-${itemId}`) ||
                     pendingOperations.has(`remove-${itemId}`);

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: styles.bgSecondary,
          color: styles.textPrimary,
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: styles.info,
          border: `1px solid ${styles.info}`,
        };
      case 'primary':
      default:
        return {
          backgroundColor: inCart ? styles.success : styles.info,
          color: '#fff',
          border: 'none',
        };
    }
  };

  const handleAddToCart = async () => {
    if (isAdding || disabled) return;

    setIsAdding(true);
    try {
      await addToCart(itemId, showQuantity ? quantity : 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
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

  // If in cart and showing quantity controls
  if (inCart && showQuantity) {
    return (
      <div
        className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''} ${className}`}
      >
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <button
            onClick={handleDecrement}
            disabled={isUpdating}
            className="p-2 transition-colors hover:bg-black/5 disabled:opacity-50"
            style={{ color: styles.textPrimary }}
          >
            <Minus size={16} weight="bold" />
          </button>
          <span
            className="w-10 text-center text-sm font-medium"
            style={{ color: styles.textPrimary }}
          >
            {isUpdating ? <SpinnerGap size={14} className="animate-spin mx-auto" /> : cartQuantity}
          </span>
          <button
            onClick={handleIncrement}
            disabled={isUpdating || (maxOrderQty !== null && cartQuantity >= maxOrderQty)}
            className="p-2 transition-colors hover:bg-black/5 disabled:opacity-50"
            style={{ color: styles.textPrimary }}
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
          style={{ backgroundColor: `${styles.success}15`, color: styles.success }}
        >
          <Check size={16} weight="bold" />
          <span className="text-sm font-medium">In Cart</span>
        </div>
      </div>
    );
  }

  // If in cart (simple view)
  if (inCart && !showQuantity) {
    return (
      <button
        className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-all ${
          isRtl ? 'flex-row-reverse' : ''
        } ${sizeClasses[size]} ${className}`}
        style={{
          backgroundColor: `${styles.success}15`,
          color: styles.success,
        }}
        disabled
      >
        <Check size={size === 'lg' ? 20 : 16} weight="bold" />
        <span>In Cart ({cartQuantity})</span>
      </button>
    );
  }

  // Add to cart button with optional quantity selector
  return (
    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''} ${className}`}>
      {/* Quantity Selector (if showQuantity) */}
      {showQuantity && (
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <button
            onClick={() => setQuantity(Math.max(minOrderQty, quantity - 1))}
            disabled={quantity <= minOrderQty}
            className="p-2 transition-colors hover:bg-black/5 disabled:opacity-50"
            style={{ color: styles.textPrimary }}
          >
            <Minus size={16} weight="bold" />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || minOrderQty;
              setQuantity(Math.max(minOrderQty, Math.min(val, maxOrderQty || Infinity)));
            }}
            min={minOrderQty}
            max={maxOrderQty || undefined}
            className="w-12 text-center bg-transparent border-none outline-none text-sm font-medium"
            style={{ color: styles.textPrimary }}
          />
          <button
            onClick={() => setQuantity(Math.min(maxOrderQty || Infinity, quantity + 1))}
            disabled={maxOrderQty !== null && quantity >= maxOrderQty}
            className="p-2 transition-colors hover:bg-black/5 disabled:opacity-50"
            style={{ color: styles.textPrimary }}
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding || disabled}
        className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 ${
          isRtl ? 'flex-row-reverse' : ''
        } ${sizeClasses[size]} ${!showQuantity ? 'flex-1' : ''}`}
        style={getVariantStyles()}
      >
        {isAdding ? (
          <SpinnerGap size={size === 'lg' ? 20 : 16} className="animate-spin" />
        ) : showSuccess ? (
          <Check size={size === 'lg' ? 20 : 16} weight="bold" />
        ) : (
          <ShoppingCart size={size === 'lg' ? 20 : 16} weight="bold" />
        )}
        <span>
          {isAdding
            ? 'Adding...'
            : showSuccess
            ? 'Added!'
            : showQuantity
            ? 'Add'
            : 'Add to Cart'}
        </span>
      </button>
    </div>
  );
};

export default AddToCartButton;
