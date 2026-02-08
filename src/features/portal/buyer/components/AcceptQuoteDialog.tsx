// =============================================================================
// Accept Quote Dialog - Stage 4 Quote Acceptance
// Confirmation dialog for buyers to accept a quote and create an order
// =============================================================================

import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Package,
  CurrencyDollar,
  Truck,
  Calendar,
  Storefront,
  Spinner,
  WarningCircle,
  ShoppingCart,
  NoteBlank,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { marketplaceOrderService } from '../../services/marketplaceOrderService';
import { Quote, MarketplaceOrder, AcceptQuoteData, getQuoteValidityStatus } from '../../types/item.types';

// =============================================================================
// Types
// =============================================================================

interface AcceptQuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  sellerName?: string;
  itemName?: string;
  onSuccess?: (order: MarketplaceOrder) => void;
}

// =============================================================================
// Component
// =============================================================================

export const AcceptQuoteDialog: React.FC<AcceptQuoteDialogProps> = ({
  isOpen,
  onClose,
  quote,
  sellerName,
  itemName,
  onSuccess,
}) => {
  const { styles, direction } = usePortal();
  const { getToken } = useAuth();
  const _isRtl = direction === 'rtl';

  // Form state
  const [buyerNotes, setBuyerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quote validity status
  const validityStatus = getQuoteValidityStatus(quote.validUntil);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setBuyerNotes('');
      setError(null);
    }
  }, [isOpen]);

  // Handle accept
  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const acceptData: AcceptQuoteData = {
        buyerNotes: buyerNotes.trim() || undefined,
      };

      const order = await marketplaceOrderService.acceptQuote(token, quote.id, acceptData);

      onSuccess?.(order);
      onClose();
    } catch (err) {
      console.error('Failed to accept quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Dialog */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl"
        style={{ backgroundColor: styles.bgPrimary }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: styles.borderLight }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${styles.success}15` }}>
              <ShoppingCart size={20} weight="fill" style={{ color: styles.success }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                Accept Quote
              </h2>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {quote.quoteNumber || `Quote #${quote.id.slice(0, 8).toUpperCase()}`}
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
        <div className="p-6 space-y-4">
          {/* Expiry Warning */}
          {validityStatus.isExpiringSoon && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                backgroundColor: validityStatus.isExpired ? `${styles.error}15` : `${styles.warning}15`,
              }}
            >
              <WarningCircle
                size={18}
                weight="fill"
                style={{
                  color: validityStatus.isExpired ? styles.error : styles.warning,
                }}
              />
              <span
                className="text-sm"
                style={{
                  color: validityStatus.isExpired ? styles.error : styles.warning,
                }}
              >
                {validityStatus.text}
              </span>
            </div>
          )}

          {/* Order Summary */}
          <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: styles.bgSecondary }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: styles.textMuted }}>
              Order Summary
            </p>

            {/* Item */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: styles.bgCard }}
              >
                <Package size={18} style={{ color: styles.textMuted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: styles.textPrimary }}>
                  {itemName || quote.rfq?.item?.name || 'Item'}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  Qty: {quote.quantity}
                </p>
              </div>
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: styles.bgCard }}
              >
                <Storefront size={18} style={{ color: styles.textMuted }} />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                  {sellerName || 'Seller'}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  Supplier
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" style={{ borderColor: styles.borderLight }} />

            {/* Price */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CurrencyDollar size={16} style={{ color: styles.textMuted }} />
                <span className="text-sm" style={{ color: styles.textMuted }}>
                  Unit Price
                </span>
              </div>
              <span className="font-medium" style={{ color: styles.textPrimary }}>
                {quote.currency} {quote.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Discount */}
            {quote.discount && quote.discount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: styles.textMuted }}>
                  Discount
                </span>
                <span className="font-medium" style={{ color: styles.success }}>
                  -{quote.currency} {quote.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Total */}
            <div
              className="flex justify-between items-center pt-2 border-t"
              style={{ borderColor: styles.borderLight }}
            >
              <span className="font-semibold" style={{ color: styles.textPrimary }}>
                Total Price
              </span>
              <span className="font-bold text-lg" style={{ color: styles.success }}>
                {quote.currency} {quote.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Delivery */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck size={16} style={{ color: styles.textMuted }} />
                <span className="text-sm" style={{ color: styles.textMuted }}>
                  Lead Time
                </span>
              </div>
              <span className="font-medium" style={{ color: styles.textPrimary }}>
                {quote.deliveryDays} days
              </span>
            </div>

            {/* Validity */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar size={16} style={{ color: styles.textMuted }} />
                <span className="text-sm" style={{ color: styles.textMuted }}>
                  Valid Until
                </span>
              </div>
              <span
                className="font-medium"
                style={{
                  color: validityStatus.isExpired
                    ? styles.error
                    : validityStatus.isExpiringSoon
                      ? styles.warning
                      : styles.textPrimary,
                }}
              >
                {new Date(quote.validUntil).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Buyer Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
              Notes for Seller (Optional)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3" style={{ color: styles.textMuted }}>
                <NoteBlank size={18} />
              </div>
              <textarea
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                rows={2}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors resize-none"
                style={{
                  backgroundColor: styles.bgSecondary,
                  borderColor: styles.borderLight,
                  color: styles.textPrimary,
                }}
                placeholder="Any special instructions..."
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: `${styles.error}15` }}>
              <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
              <span className="text-sm" style={{ color: styles.error }}>
                {error}
              </span>
            </div>
          )}

          {/* Confirmation Text */}
          <p className="text-xs text-center" style={{ color: styles.textMuted }}>
            By accepting this quote, you agree to purchase the items at the stated price and terms. An order will be
            created and the seller will be notified.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: styles.borderLight }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: styles.bgSecondary,
              color: styles.textSecondary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={isSubmitting || validityStatus.isExpired}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: validityStatus.isExpired ? styles.bgSecondary : styles.success,
              color: validityStatus.isExpired ? styles.textMuted : '#fff',
            }}
          >
            {isSubmitting ? <Spinner size={20} className="animate-spin" /> : <CheckCircle size={20} weight="fill" />}
            {isSubmitting ? 'Processing...' : 'Accept & Create Order'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AcceptQuoteDialog;
