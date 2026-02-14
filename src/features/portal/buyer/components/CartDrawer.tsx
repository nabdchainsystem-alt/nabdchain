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
  Minus,
  Plus,
  ShoppingBagOpen,
  Lightning,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useCart } from '../../context/CartContext';
import { parseImageUrls } from '../../types/item.types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onNavigateToCart }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    cart,
    isLoading,
    pendingOperations,
    updateQuantity,
    removeFromCart,
    clearCart,
    createRFQForAll,
    buyNowAll,
    getItemEligibility,
  } = useCart();

  const hasItems = cart && cart.items.length > 0;
  const isProcessing =
    pendingOperations.has('rfq-all') || pendingOperations.has('clear') || pendingOperations.has('buy-now-all');

  // Check if any items are eligible for buy now
  const hasBuyNowEligible = React.useMemo(() => {
    if (!cart?.items) return false;
    return cart.items.some((item) => {
      const eligibility = getItemEligibility(item);
      return eligibility.buyNow.eligible;
    });
  }, [cart?.items, getItemEligibility]);

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

  // Handle Buy Now All
  const handleBuyNowAll = async () => {
    try {
      await buyNowAll();
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

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          top: '64px',
          zIndex: 9990,
          backgroundColor: isAnimating ? 'rgba(0,0,0,0.15)' : 'transparent',
          transition: 'background-color 300ms ease',
        }}
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
          width: '400px',
          maxWidth: '100vw',
          backgroundColor: styles.bgPrimary,
          borderLeft: isRtl ? 'none' : `1px solid ${styles.border}`,
          borderRight: isRtl ? `1px solid ${styles.border}` : 'none',
          boxShadow: styles.isDark ? '-12px 0 40px rgba(0, 0, 0, 0.6)' : '-8px 0 30px rgba(0, 0, 0, 0.08)',
          right: isRtl ? 'auto' : 0,
          left: isRtl ? 0 : 'auto',
          transform: isAnimating ? 'translateX(0)' : isRtl ? 'translateX(-100%)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${styles.border}` }}
        >
          <div className="flex items-center gap-3">
            <ShoppingCart size={22} weight="duotone" style={{ color: styles.textPrimary }} />
            <div>
              <h2 className="font-semibold text-[15px]" style={{ color: styles.textPrimary }}>
                {t('cart.title')}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasItems && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                {cart?.itemCount || 0} {(cart?.itemCount || 0) === 1 ? t('cart.item') : t('cart.items')}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <SpinnerGap size={28} className="animate-spin" style={{ color: styles.textMuted }} />
            </div>
          ) : !hasItems ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <ShoppingBagOpen size={28} weight="duotone" style={{ color: styles.textMuted }} />
              </div>
              <h3 className="font-medium text-center mb-1.5" style={{ color: styles.textPrimary }}>
                {t('cart.empty.title')}
              </h3>
              <p className="text-sm text-center leading-relaxed" style={{ color: styles.textMuted }}>
                {t('cart.empty.description')}
              </p>
              <button
                onClick={onClose}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: styles.textPrimary,
                  color: styles.bgPrimary,
                }}
              >
                <span>{t('cart.empty.browse')}</span>
              </button>
            </div>
          ) : (
            /* Cart items grouped by seller */
            <div>
              {sellerGroups.map((group, groupIdx) => (
                <div
                  key={group.sellerId}
                  style={{
                    borderBottom: groupIdx < sellerGroups.length - 1 ? `1px solid ${styles.border}` : undefined,
                  }}
                >
                  {/* Seller Header */}
                  <div
                    className={`flex items-center gap-2 px-5 py-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}
                    style={{ backgroundColor: styles.bgSecondary }}
                  >
                    <Storefront size={14} weight="duotone" style={{ color: styles.textMuted }} />
                    <span className="text-xs font-medium" style={{ color: styles.textSecondary }}>
                      {group.sellerName}
                    </span>
                    <span className="text-xs" style={{ color: styles.textMuted }}>
                      ({group.items.length})
                    </span>
                  </div>

                  {/* Items */}
                  {group.items.map((item, itemIdx) => {
                    const name = item.item?.name || item.itemName || 'Unknown Item';
                    const price = item.item?.price ?? item.priceAtAdd ?? 0;
                    const currency = item.item?.currency || 'SAR';
                    const images = parseImageUrls(item.item?.images);
                    const imageUrl = images[0] || null;
                    const isUpdating =
                      pendingOperations.has(`update-${item.itemId}`) || pendingOperations.has(`remove-${item.itemId}`);
                    const subtotal = price * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className={`px-5 py-3.5 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{
                          borderBottom: itemIdx < group.items.length - 1 ? `1px solid ${styles.border}20` : undefined,
                        }}
                      >
                        <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          {/* Image */}
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

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`flex items-start justify-between gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                              <p
                                className="text-sm font-medium leading-tight truncate"
                                style={{ color: styles.textPrimary }}
                              >
                                {name}
                              </p>
                              <button
                                onClick={() => removeFromCart(item.itemId)}
                                disabled={isUpdating}
                                className="p-1 rounded transition-colors flex-shrink-0 -mt-0.5"
                                style={{ color: styles.textMuted }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = styles.error;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = styles.textMuted;
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                              {currency} {price.toLocaleString()} / unit
                            </p>

                            {/* Quantity + Subtotal row */}
                            <div
                              className={`flex items-center justify-between mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                              {/* Quantity Controls */}
                              <div
                                className="inline-flex items-center rounded-lg overflow-hidden"
                                style={{ border: `1px solid ${styles.border}` }}
                              >
                                <button
                                  onClick={() => {
                                    if (item.quantity > 1) updateQuantity(item.itemId, item.quantity - 1);
                                  }}
                                  disabled={item.quantity <= 1 || isUpdating}
                                  className="px-2 py-1 transition-colors disabled:opacity-30"
                                  style={{ color: styles.textSecondary }}
                                  onMouseEnter={(e) => {
                                    if (item.quantity > 1) e.currentTarget.style.backgroundColor = styles.bgSecondary;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <Minus size={12} weight="bold" />
                                </button>
                                <span
                                  className="px-3 py-1 text-xs font-medium min-w-[32px] text-center"
                                  style={{
                                    color: styles.textPrimary,
                                    borderLeft: `1px solid ${styles.border}`,
                                    borderRight: `1px solid ${styles.border}`,
                                  }}
                                >
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                                  disabled={isUpdating}
                                  className="px-2 py-1 transition-colors disabled:opacity-30"
                                  style={{ color: styles.textSecondary }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = styles.bgSecondary;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <Plus size={12} weight="bold" />
                                </button>
                              </div>

                              {/* Subtotal */}
                              <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                                {currency} {subtotal.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasItems && (
          <div
            className="flex-shrink-0"
            style={{ borderTop: `1px solid ${styles.border}`, backgroundColor: styles.bgCard }}
          >
            {/* Summary */}
            <div className="px-5 pt-4 pb-3">
              <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {t('cart.summary.estimatedTotal')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                    {cart?.sellerCount || 0} {(cart?.sellerCount || 0) === 1 ? 'seller' : 'sellers'} ·{' '}
                    {cart?.itemCount || 0} {(cart?.itemCount || 0) === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <p className="text-xl font-bold" style={{ color: styles.textPrimary }}>
                  {cart?.currency || 'SAR'} {(cart?.estimatedTotal || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-4 space-y-2">
              {/* Primary: Request Quote */}
              <button
                onClick={handleRequestAll}
                disabled={isProcessing || cart?.isLocked}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: styles.textPrimary,
                  color: styles.bgPrimary,
                }}
              >
                {pendingOperations.has('rfq-all') ? (
                  <SpinnerGap size={18} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={18} weight="bold" />
                )}
                <span>{t('cart.summary.requestAllRFQ')}</span>
              </button>

              {/* Secondary: Buy Now (only if eligible items exist) */}
              {hasBuyNowEligible && (
                <button
                  onClick={handleBuyNowAll}
                  disabled={isProcessing || cart?.isLocked}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: `${styles.success}12`,
                    color: styles.success,
                    border: `1px solid ${styles.success}30`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${styles.success}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${styles.success}12`;
                  }}
                >
                  {pendingOperations.has('buy-now-all') ? (
                    <SpinnerGap size={18} className="animate-spin" />
                  ) : (
                    <Lightning size={18} weight="bold" />
                  )}
                  <span>{isRtl ? 'شراء مباشر' : 'Buy Now'}</span>
                </button>
              )}

              {/* Tertiary row: View All + Clear */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleViewAll}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                  style={{ color: styles.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgSecondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{t('cart.viewAll')}</span>
                  <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                </button>

                <div style={{ width: 1, height: 16, backgroundColor: styles.border }} />

                <button
                  onClick={clearCart}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 py-2.5 px-3 rounded-lg text-xs transition-colors disabled:opacity-50"
                  style={{ color: styles.textMuted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = styles.error;
                    e.currentTarget.style.backgroundColor = `${styles.error}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = styles.textMuted;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash size={14} />
                  <span>{isRtl ? 'مسح' : 'Clear'}</span>
                </button>
              </div>
            </div>

            {/* Locked Cart Message */}
            {cart?.isLocked && (
              <div
                className="mx-5 mb-4 p-3 rounded-lg text-xs text-center"
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
