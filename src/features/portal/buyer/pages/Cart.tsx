// =============================================================================
// Cart Page - Professional Two-Column Layout with VAT
// =============================================================================

import React, { useState, useMemo } from 'react';
import { SpinnerGap, Package, Trash, Plus, Minus, Tag, Truck, CalendarBlank } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useCart } from '../../context/CartContext';
import { CartEmptyState } from '../components/CartEmptyState';
import { Container, PageHeader } from '../../components';
import { CartItem } from '../../types/cart.types';

// VAT Rate (15% for Saudi Arabia)
const VAT_RATE = 0.15;

interface CartPageProps {
  onNavigate?: (page: string) => void;
}

// =============================================================================
// Cart Item Row Component
// =============================================================================
interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  isUpdating?: boolean;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onQuantityChange, onRemove, isUpdating = false }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const name = item.item?.name || item.itemName || 'Unknown Item';
  const sku = item.item?.sku || '';
  const price = item.item?.price ?? item.priceAtAdd ?? 0;
  const currency = item.item?.currency || 'SAR';
  const minOrderQty = item.item?.minOrderQty ?? 1;
  const maxOrderQty = item.item?.maxOrderQty;
  const stock = item.item?.stock ?? 999;
  const images = item.item?.images ? JSON.parse(item.item.images) : [];
  const imageUrl = images[0] || null;
  const sellerName = item.seller?.companyName || item.seller?.name || 'Seller';
  const category = item.item?.category || '';

  const subtotal = price * item.quantity;
  const canDecrement = item.quantity > minOrderQty;
  const canIncrement = !maxOrderQty || item.quantity < Math.min(maxOrderQty, stock);

  return (
    <div
      className={`flex gap-4 py-6 border-b transition-opacity ${isUpdating ? 'opacity-50' : ''}`}
      style={{ borderColor: styles.border }}
    >
      {/* Product Image */}
      <div
        className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0"
        style={{ backgroundColor: styles.bgSecondary }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} style={{ color: styles.textMuted }} />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
        <h3 className="font-semibold text-base mb-1 line-clamp-2" style={{ color: styles.textPrimary }}>
          {name}
        </h3>
        <div className="space-y-1 text-sm" style={{ color: styles.textMuted }}>
          {category && (
            <p>
              <span className="font-medium">Category:</span> {category}
            </p>
          )}
          {sku && (
            <p>
              <span className="font-medium">SKU:</span> {sku}
            </p>
          )}
          <p>
            <span className="font-medium">Seller:</span> {sellerName}
          </p>
        </div>
        <p className="mt-2 text-lg font-bold" style={{ color: styles.textPrimary }}>
          {currency} {price.toLocaleString()}
        </p>
      </div>

      {/* Quantity Control */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center border rounded-lg" style={{ borderColor: styles.border }}>
          <button
            onClick={() => onQuantityChange(item.quantity - 1)}
            disabled={!canDecrement || isUpdating}
            className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
            style={{ color: styles.textSecondary }}
          >
            <Minus size={16} weight="bold" />
          </button>
          <span className="w-12 text-center text-base font-semibold tabular-nums" style={{ color: styles.textPrimary }}>
            {item.quantity}
          </span>
          <button
            onClick={() => onQuantityChange(item.quantity + 1)}
            disabled={!canIncrement || isUpdating}
            className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
            style={{ color: styles.textSecondary }}
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Subtotal & Remove */}
      <div className={`flex flex-col items-end justify-between w-28 ${isRtl ? 'items-start' : 'items-end'}`}>
        <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
          {currency} {subtotal.toLocaleString()}
        </p>
        <button
          onClick={onRemove}
          disabled={isUpdating}
          className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50"
          title="Remove item"
        >
          <Trash size={20} />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// Order Summary Component
// =============================================================================
interface OrderSummaryProps {
  subtotal: number;
  currency: string;
  itemCount: number;
  onCheckout: () => void;
  isCheckingOut: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ subtotal, currency, itemCount, onCheckout, isCheckingOut }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Calculate VAT and totals
  const vatAmount = subtotal * VAT_RATE;
  const shippingCost = subtotal > 500 ? 0 : 25; // Free shipping over 500 SAR
  const totalBeforeDiscount = subtotal + vatAmount + shippingCost;
  const finalTotal = totalBeforeDiscount - couponDiscount;

  // Estimated delivery (3-5 business days)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const formattedDelivery = deliveryDate.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'save10') {
      setCouponDiscount(subtotal * 0.1);
      setCouponApplied(true);
    } else if (couponCode.toLowerCase() === 'save20') {
      setCouponDiscount(subtotal * 0.2);
      setCouponApplied(true);
    } else {
      setCouponDiscount(0);
      setCouponApplied(false);
    }
  };

  return (
    <div
      className="rounded-xl border p-6 sticky top-6"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <h2 className="text-xl font-bold mb-6" style={{ color: styles.textPrimary }}>
        {t('cart.orderSummary') || 'Order Summary'}
      </h2>

      {/* Summary Lines */}
      <div className="space-y-4 mb-6">
        {/* Subtotal */}
        <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span style={{ color: styles.textSecondary }}>
            {t('cart.subtotal') || 'Subtotal'} ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* VAT */}
        <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span style={{ color: styles.textSecondary }}>{t('cart.vat') || 'VAT'} (15%)</span>
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {currency} {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Shipping */}
        <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className="flex items-center gap-2" style={{ color: styles.textSecondary }}>
            <Truck size={16} />
            {t('cart.shipping') || 'Shipping'}
          </span>
          <span className="font-medium" style={{ color: shippingCost === 0 ? styles.success : styles.textPrimary }}>
            {shippingCost === 0
              ? t('cart.free') || 'Free'
              : `${currency} ${shippingCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        {/* Coupon Discount */}
        {couponApplied && couponDiscount > 0 && (
          <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="flex items-center gap-2" style={{ color: styles.success }}>
              <Tag size={16} />
              {t('cart.couponApplied') || 'Coupon Applied'}
            </span>
            <span className="font-medium" style={{ color: styles.success }}>
              -{currency} {couponDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t pt-4" style={{ borderColor: styles.border }}>
          {/* Total */}
          <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-lg font-bold" style={{ color: styles.textPrimary }}>
              {t('cart.total') || 'TOTAL'}
            </span>
            <span className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
              {currency} {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
            {t('cart.vatIncluded') || 'VAT included'}
          </p>
        </div>

        {/* Estimated Delivery */}
        <div
          className={`flex items-center gap-2 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}
          style={{ color: styles.textSecondary }}
        >
          <CalendarBlank size={16} />
          <span>{t('cart.estimatedDelivery') || 'Estimated Delivery:'}</span>
          <span className="font-medium" style={{ color: styles.textPrimary }}>
            {formattedDelivery}
          </span>
        </div>
      </div>

      {/* Coupon Code Input */}
      <div className="mb-6">
        <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: styles.border }}>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder={t('cart.couponPlaceholder') || 'Enter coupon code'}
            className="flex-1 px-4 py-3 text-sm bg-transparent outline-none"
            style={{ color: styles.textPrimary }}
          />
          <button
            onClick={handleApplyCoupon}
            className="px-4 py-3 transition-colors hover:bg-black/5"
            style={{ color: styles.textSecondary }}
          >
            <Tag size={20} />
          </button>
        </div>
        {couponApplied && (
          <p className="text-xs mt-2" style={{ color: styles.success }}>
            Coupon "{couponCode}" applied successfully!
          </p>
        )}
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={isCheckingOut}
        className="w-full py-4 rounded-lg text-base font-semibold transition-all hover:opacity-90 disabled:opacity-50"
        style={{
          backgroundColor: styles.isDark ? '#fff' : '#000',
          color: styles.isDark ? '#000' : '#fff',
        }}
      >
        {isCheckingOut ? (
          <SpinnerGap size={20} className="animate-spin mx-auto" />
        ) : (
          t('cart.proceedToCheckout') || 'Proceed to Checkout'
        )}
      </button>

      {/* Free Shipping Notice */}
      {subtotal < 500 && (
        <p className="text-xs text-center mt-4" style={{ color: styles.textMuted }}>
          Add {currency} {(500 - subtotal).toLocaleString()} more for free shipping!
        </p>
      )}
    </div>
  );
};

// =============================================================================
// Main Cart Component
// =============================================================================
export const Cart: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { cart, isLoading, error, updateQuantity, removeFromCart, clearCart, pendingOperations } = useCart();
  const isRtl = direction === 'rtl';

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Calculate totals
  const { subtotal, allItems } = useMemo(() => {
    if (!cart || cart.items.length === 0) return { subtotal: 0, allItems: [] };

    let total = 0;
    const items: CartItem[] = [];

    for (const item of cart.items) {
      const price = item.item?.price ?? item.priceAtAdd ?? 0;
      total += price * item.quantity;
      items.push(item);
    }

    return { subtotal: total, allItems: items };
  }, [cart]);

  // Get updating item IDs
  const updatingItems = useMemo(() => {
    const items = new Set<string>();
    pendingOperations.forEach((op) => {
      if (op.startsWith('update-') || op.startsWith('remove-')) {
        items.add(op.replace('update-', '').replace('remove-', ''));
      }
    });
    return items;
  }, [pendingOperations]);

  // Handlers
  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      if (onNavigate) onNavigate('checkout');
    }, 500);
  };

  const handleContinueShopping = () => {
    if (onNavigate) onNavigate('marketplace');
  };

  // Loading state
  if (isLoading && !cart) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerGap size={40} className="animate-spin" style={{ color: styles.info }} />
      </div>
    );
  }

  // Error state
  if (error && !cart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <p className="text-center mb-4" style={{ color: styles.error }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: styles.info, color: '#fff' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: styles.bgPrimary }}>
        <Container variant="full">
          <PageHeader
            title={t('cart.title') || 'Shopping Cart'}
            subtitle={t('cart.emptySubtitle') || 'Your cart is empty'}
          />
          <CartEmptyState onBrowse={handleContinueShopping} />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('cart.title') || 'Shopping Cart'}
          subtitle={`${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'}`}
        />

        {/* Two Column Layout */}
        <div className={`flex gap-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Left Column - Cart Items */}
          <div className="flex-1 min-w-0">
            {/* Clear Cart Link */}
            <div className={`flex justify-end mb-4 ${isRtl ? 'justify-start' : 'justify-end'}`}>
              <button
                onClick={handleClearCart}
                className="text-sm flex items-center gap-1 transition-colors hover:text-red-600"
                style={{ color: styles.textMuted }}
              >
                <Trash size={14} />
                {t('cart.clearAll') || 'Clear all items'}
              </button>
            </div>

            {/* Items List */}
            <div className="rounded-xl border" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
              <div className="px-6">
                {allItems.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onQuantityChange={(qty) => handleQuantityChange(item.itemId, qty)}
                    onRemove={() => handleRemoveItem(item.itemId)}
                    isUpdating={updatingItems.has(item.itemId)}
                  />
                ))}
              </div>
            </div>

            {/* Continue Shopping Link */}
            <button
              onClick={handleContinueShopping}
              className="mt-4 text-sm font-medium underline"
              style={{ color: styles.textSecondary }}
            >
              {t('cart.continueShopping') || 'Continue Shopping'}
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-96 flex-shrink-0">
            <OrderSummary
              subtotal={subtotal}
              currency={cart.currency}
              itemCount={cart.itemCount}
              onCheckout={handleCheckout}
              isCheckingOut={isCheckingOut}
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Cart;
