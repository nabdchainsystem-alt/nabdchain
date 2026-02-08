// =============================================================================
// Buy Now Confirmation Modal - Inline Price Confirmation
// =============================================================================
// Displays purchase summary and requests confirmation before checkout
// =============================================================================

import React from 'react';
import { X, Lightning, Package, Storefront, ShieldCheck, SpinnerGap, WarningCircle, CheckCircle } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { CartItem, CartSellerGroup } from '../../types/cart.types';

interface BuyNowConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  // Summary data
  items: CartItem[];
  sellerGroups?: CartSellerGroup[];
  totalAmount: number;
  itemCount: number;
  sellerCount: number;
  currency: string;
  // Optional: for single seller
  sellerName?: string;
}

export const BuyNowConfirmModal: React.FC<BuyNowConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  items,
  _sellerGroups,
  totalAmount,
  itemCount,
  sellerCount,
  currency,
  sellerName,
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  if (!isOpen) return null;

  // Get first 3 items for preview
  const previewItems = items.slice(0, 3);
  const remainingCount = items.length - 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isProcessing ? undefined : onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: styles.bgPrimary }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: `${styles.success}10`, borderBottom: `1px solid ${styles.border}` }}
        >
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: styles.success }}
            >
              <Lightning size={20} weight="fill" color="#fff" />
            </div>
            <div className={isRtl ? 'text-right' : ''}>
              <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                {t('cart.buyNow.confirmTitle') || 'Confirm Purchase'}
              </h2>
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {t('cart.buyNow.confirmSubtitle') || 'Review your order before checkout'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-full transition-colors hover:bg-black/5 disabled:opacity-50"
            style={{ color: styles.textMuted }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Order Summary Stats */}
          <div className="p-4 rounded-xl grid grid-cols-3 gap-4" style={{ backgroundColor: styles.bgSecondary }}>
            <div className="text-center">
              <Package size={20} className="mx-auto mb-1" style={{ color: styles.info }} />
              <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                {itemCount}
              </p>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {itemCount === 1 ? 'Item' : 'Items'}
              </p>
            </div>
            <div className="text-center">
              <Storefront size={20} className="mx-auto mb-1" style={{ color: styles.info }} />
              <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                {sellerCount}
              </p>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {sellerCount === 1 ? 'Seller' : 'Sellers'}
              </p>
            </div>
            <div className="text-center">
              <CheckCircle size={20} className="mx-auto mb-1" style={{ color: styles.success }} />
              <p className="text-lg font-bold" style={{ color: styles.success }}>
                {items.length}
              </p>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                Orders
              </p>
            </div>
          </div>

          {/* Single Seller Badge */}
          {sellerName && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}
              style={{ backgroundColor: `${styles.info}10` }}
            >
              <ShieldCheck size={18} weight="fill" style={{ color: styles.info }} />
              <span className="text-sm font-medium" style={{ color: styles.info }}>
                Purchasing from: {sellerName}
              </span>
            </div>
          )}

          {/* Items Preview */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
              {t('cart.buyNow.itemsIncluded') || 'Items included:'}
            </p>
            <div className="space-y-2">
              {previewItems.map((item) => {
                const price = item.item?.price ?? item.priceAtAdd ?? 0;
                const itemCurrency = item.item?.currency || currency;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}
                    style={{ backgroundColor: styles.bgSecondary }}
                  >
                    {/* Item Image */}
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: styles.bgCard }}
                    >
                      {item.item?.images ? (
                        <img
                          src={JSON.parse(item.item.images)[0]}
                          alt={item.item?.name || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={16} style={{ color: styles.textMuted }} />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                      <p className="text-sm font-medium truncate" style={{ color: styles.textPrimary }}>
                        {item.item?.name || item.itemName}
                      </p>
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        Qty: {item.quantity} × {itemCurrency} {price.toLocaleString()}
                      </p>
                    </div>

                    {/* Item Total */}
                    <div className={`flex-shrink-0 ${isRtl ? 'text-left' : 'text-right'}`}>
                      <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                        {itemCurrency} {(price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}

              {remainingCount > 0 && (
                <p className="text-center text-sm py-2" style={{ color: styles.textMuted }}>
                  +{remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>

          {/* Total Amount */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${styles.success}10`, border: `1px solid ${styles.success}30` }}
          >
            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={isRtl ? 'text-right' : ''}>
                <p className="text-sm" style={{ color: styles.textSecondary }}>
                  {t('cart.buyNow.totalAmount') || 'Total Amount'}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  Final price • No additional fees
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: styles.success }}>
                {currency} {totalAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Warning Notice */}
          <div
            className={`flex items-start gap-2 p-3 rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}
            style={{ backgroundColor: `${styles.warning}10` }}
          >
            <WarningCircle size={18} weight="fill" className="flex-shrink-0 mt-0.5" style={{ color: styles.warning }} />
            <p className="text-xs" style={{ color: styles.textSecondary }}>
              {t('cart.buyNow.priceLockedNotice') ||
                'By confirming, you agree to purchase at the displayed prices. Orders will be created and sent to sellers for confirmation.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 flex gap-3" style={{ borderTop: `1px solid ${styles.border}` }}>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: styles.bgSecondary,
              color: styles.textPrimary,
            }}
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-70 ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
            style={{
              backgroundColor: styles.success,
              color: '#fff',
            }}
          >
            {isProcessing ? (
              <>
                <SpinnerGap size={18} className="animate-spin" />
                <span>{t('cart.buyNow.processing') || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Lightning size={18} weight="fill" />
                <span>{t('cart.buyNow.confirmButton') || 'Confirm Purchase'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyNowConfirmModal;
