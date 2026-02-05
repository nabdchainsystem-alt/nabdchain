// =============================================================================
// Cart Drawer - Slide-in panel from right for TopBar cart icon
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ShoppingCart,
  Package,
  PaperPlaneTilt,
  SpinnerGap,
  ArrowRight,
  Trash,
  Storefront,
  Info,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useCart } from '../../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToCart,
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    cart,
    isLoading,
    pendingOperations,
    removeFromCart,
    clearCart,
    createRFQForAll,
  } = useCart();

  const hasItems = cart && cart.items.length > 0;
  const isProcessing = pendingOperations.has('rfq-all') || pendingOperations.has('clear');

  // Animation states for smooth enter/exit
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Handle Request RFQ for All
  const handleRequestAll = async () => {
    try {
      await createRFQForAll();
      onClose();
    } catch {
      // Error handled by context
    }
  };

  // Handle view all click
  const handleViewAll = () => {
    onNavigateToCart();
    onClose();
  };

  // Group items by seller for display
  const sellerGroups = React.useMemo(() => {
    if (!cart?.items) return [];
    const groups = new Map<string, { sellerId: string; sellerName: string; items: typeof cart.items }>();

    cart.items.forEach((item) => {
      const existing = groups.get(item.sellerId);
      const sellerName = item.seller?.companyName || item.seller?.name || 'Unknown Seller';
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.sellerId, {
          sellerId: item.sellerId,
          sellerName,
          items: [item],
        });
      }
    });

    return Array.from(groups.values());
  }, [cart?.items]);

  // Item count text with proper translation
  const itemCountText = cart?.itemCount === 1
    ? `1 ${t('cart.item')}`
    : `${cart?.itemCount || 0} ${t('cart.items')}`;

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - transparent, just for click-outside */}
      <div
        className="fixed inset-0"
        style={{ top: '64px', zIndex: 9990 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="fixed flex flex-col overflow-hidden"
        style={{
          zIndex: 9991,
          top: '64px',
          bottom: 0,
          width: '380px',
          maxWidth: '100vw',
          backgroundColor: styles.bgCard,
          borderLeft: isRtl ? 'none' : `1px solid ${styles.border}`,
          borderRight: isRtl ? `1px solid ${styles.border}` : 'none',
          boxShadow: styles.isDark
            ? '-12px 0 40px rgba(0, 0, 0, 0.6)'
            : '-8px 0 30px rgba(0, 0, 0, 0.1)',
          right: isRtl ? 'auto' : 0,
          left: isRtl ? 0 : 'auto',
          transform: isAnimating
            ? 'translateX(0)'
            : isRtl
            ? 'translateX(-100%)'
            : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: styles.border }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${styles.info}15` }}
          >
            <ShoppingCart size={20} weight="duotone" style={{ color: styles.info }} />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: styles.textPrimary }}>
              {t('cart.title')}
            </h2>
            <p className="text-sm" style={{ color: styles.textMuted }}>
              {itemCountText}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors"
          style={{ color: styles.textMuted }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Loading state
          <div className="flex items-center justify-center py-16">
            <SpinnerGap size={32} className="animate-spin" style={{ color: styles.info }} />
          </div>
        ) : !hasItems ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${styles.info}10` }}
            >
              <ShoppingCart size={32} weight="duotone" style={{ color: styles.info }} />
            </div>
            <h3
              className="font-medium text-center mb-2"
              style={{ color: styles.textPrimary }}
            >
              {t('cart.empty.title')}
            </h3>
            <p
              className="text-sm text-center mb-6"
              style={{ color: styles.textMuted }}
            >
              {t('cart.empty.description')}
            </p>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: styles.info,
                color: '#fff',
              }}
            >
              <span>{t('cart.empty.browse')}</span>
            </button>
          </div>
        ) : (
          // Cart items grouped by seller
          <div className="py-2">
            {sellerGroups.map((group) => (
              <div key={group.sellerId} className="mb-2">
                {/* Seller Header */}
                <div
                  className="flex items-center gap-2 px-5 py-2"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <Storefront size={16} style={{ color: styles.info }} />
                  <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                    {group.sellerName}
                  </span>
                  <span className="text-xs" style={{ color: styles.textMuted }}>
                    ({group.items.length})
                  </span>
                </div>

                {/* Items */}
                {group.items.map((item) => {
                  const name = item.item?.name || item.itemName || 'Unknown Item';
                  const price = item.item?.price ?? item.priceAtAdd ?? 0;
                  const currency = item.item?.currency || 'SAR';
                  const images = item.item?.images ? JSON.parse(item.item.images) : [];
                  const imageUrl = images[0] || null;
                  const isUpdating =
                    pendingOperations.has(`update-${item.itemId}`) ||
                    pendingOperations.has(`remove-${item.itemId}`);

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-5 py-3 border-b ${isUpdating ? 'opacity-50' : ''}`}
                      style={{ borderColor: styles.border }}
                    >
                      {/* Image */}
                      <div
                        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
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

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: styles.textPrimary }}
                        >
                          {name}
                        </p>
                        <p className="text-xs" style={{ color: styles.textMuted }}>
                          {currency} {price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>

                      {/* Subtotal */}
                      <div className="flex-shrink-0">
                        <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                          {currency} {(price * item.quantity).toLocaleString()}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.itemId)}
                        disabled={isUpdating}
                        className="p-1.5 rounded-full transition-colors flex-shrink-0"
                        style={{ color: styles.textMuted }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = `${styles.error}15`)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - only show when has items */}
      {hasItems && (
        <div
          className="flex-shrink-0 border-t"
          style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
        >
          {/* Total */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${styles.border}` }}
          >
            <div>
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {t('cart.summary.estimatedTotal')}
              </p>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {cart?.sellerCount || 0} {cart?.sellerCount === 1 ? 'seller' : 'sellers'}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: styles.info }}>
                {cart?.currency || 'SAR'} {(cart?.estimatedTotal || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Microcopy */}
          <div
            className="flex items-center gap-2 px-5 py-2"
            style={{ backgroundColor: `${styles.info}08` }}
          >
            <Info size={14} className="flex-shrink-0" style={{ color: styles.info }} />
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {t('cart.summary.noPaymentNow')}
            </p>
          </div>

          {/* Actions */}
          <div className="p-4 space-y-3">
            {/* Request RFQ for All */}
            <button
              onClick={handleRequestAll}
              disabled={isProcessing || cart?.isLocked}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: styles.info,
                color: '#fff',
              }}
            >
              {isProcessing ? (
                <SpinnerGap size={20} className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={20} weight="bold" />
              )}
              <span>
                {t('cart.summary.requestAllRFQ')} ({cart?.itemCount || 0})
              </span>
            </button>

            {/* Secondary Row */}
            <div className="flex gap-2">
              {/* View All (Navigate to Cart page) */}
              <button
                onClick={handleViewAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{
                  backgroundColor: styles.bgSecondary,
                  color: styles.textPrimary,
                }}
              >
                <span>{t('cart.viewAll')}</span>
                <ArrowRight size={16} />
              </button>

              {/* Clear Cart */}
              <button
                onClick={clearCart}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 hover:opacity-80"
                style={{
                  backgroundColor: `${styles.error}10`,
                  color: styles.error,
                }}
              >
                <Trash size={18} />
              </button>
            </div>
          </div>

          {/* Locked Cart Message */}
          {cart?.isLocked && (
            <div
              className="mx-4 mb-4 p-3 rounded-lg text-sm text-center"
              style={{ backgroundColor: `${styles.warning}15`, color: styles.warning }}
            >
              {t('cart.summary.locked')}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default CartDrawer;
