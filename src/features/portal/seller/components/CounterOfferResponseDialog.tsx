import React, { useState } from 'react';
import {
  X,
  CurrencyDollar,
  Truck,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  User,
  Package,
  ArrowRight,
  Spinner,
  Info,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { CounterOffer, Quote } from '../../types/item.types';

// =============================================================================
// Types
// =============================================================================

interface CounterOfferResponseDialogProps {
  /** The counter-offer to respond to */
  counterOffer: CounterOffer;
  /** The original quote */
  quote: Quote;
  /** Item name */
  itemName?: string;
  /** Buyer name */
  buyerName?: string;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Accept handler */
  onAccept: (response?: string) => Promise<void>;
  /** Reject handler */
  onReject: (response: string) => Promise<void>;
  /** Loading state */
  isSubmitting?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(amount: number, currency: string = 'SAR'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

function calculatePriceChange(original: number, proposed: number): {
  difference: number;
  percent: number;
  isReduction: boolean;
} {
  const difference = proposed - original;
  const percent = (difference / original) * 100;
  return {
    difference,
    percent,
    isReduction: difference < 0,
  };
}

function formatTimeSince(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${diffDays}d ago`;
}

// =============================================================================
// CounterOfferResponseDialog Component
// =============================================================================

/**
 * CounterOfferResponseDialog Component
 *
 * Modal for sellers to respond to counter-offers from buyers.
 * Features:
 * - Counter-offer details with comparison to original quote
 * - Accept option (creates revised quote)
 * - Reject option with required reason
 * - Response message for both actions
 */
export const CounterOfferResponseDialog: React.FC<CounterOfferResponseDialogProps> = ({
  counterOffer,
  quote,
  itemName,
  buyerName,
  isOpen,
  onClose,
  onAccept,
  onReject,
  isSubmitting = false,
}) => {
  const { styles, direction } = usePortal();

  // Form state
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  // Price comparison
  const priceChange = calculatePriceChange(quote.totalPrice, counterOffer.proposedPrice);

  // Handlers
  const handleAccept = async () => {
    setAction('accept');
    setError('');
  };

  const handleReject = () => {
    setAction('reject');
    setError('');
  };

  const handleSubmit = async () => {
    if (action === 'reject' && !response.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      if (action === 'accept') {
        await onAccept(response || undefined);
      } else if (action === 'reject') {
        await onReject(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleBack = () => {
    setAction(null);
    setResponse('');
    setError('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAction(null);
      setResponse('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl shadow-xl overflow-hidden"
          style={{ backgroundColor: styles.bgCard }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: styles.border }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#8b5cf620' }}
              >
                <ArrowsClockwise size={20} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                  Counter-Offer Received
                </h2>
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  {formatTimeSince(counterOffer.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ color: styles.textMuted }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Buyer Info */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <User size={20} style={{ color: styles.textMuted }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  {buyerName || 'Buyer'}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  sent a counter-offer
                </p>
              </div>
            </div>

            {/* Item Info */}
            {itemName && (
              <div
                className="p-3 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <Package size={18} style={{ color: styles.textMuted }} />
                <span className="text-sm" style={{ color: styles.textPrimary }}>
                  {itemName}
                </span>
              </div>
            )}

            {/* Price Comparison */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <p className="text-xs font-medium mb-3" style={{ color: styles.textMuted }}>
                PRICE COMPARISON
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    Your Quote
                  </p>
                  <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                    {formatPrice(quote.totalPrice, quote.currency)}
                  </p>
                </div>

                <ArrowRight size={20} style={{ color: styles.textMuted }} />

                <div className="text-right">
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    Proposed
                  </p>
                  <p className="text-lg font-bold" style={{ color: '#8b5cf6' }}>
                    {formatPrice(counterOffer.proposedPrice, quote.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-center" style={{ borderColor: styles.border }}>
                <span
                  className="px-2 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: priceChange.isReduction ? '#fee2e2' : '#dcfce7',
                    color: priceChange.isReduction ? '#dc2626' : '#15803d',
                  }}
                >
                  {priceChange.isReduction ? '' : '+'}
                  {formatPrice(priceChange.difference, quote.currency)} ({priceChange.percent.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Other Proposed Changes */}
            {(counterOffer.proposedQuantity || counterOffer.proposedDeliveryDays) && (
              <div className="flex gap-4">
                {counterOffer.proposedQuantity && counterOffer.proposedQuantity !== quote.quantity && (
                  <div
                    className="flex-1 p-3 rounded-lg"
                    style={{ backgroundColor: styles.bgSecondary }}
                  >
                    <p className="text-xs" style={{ color: styles.textMuted }}>
                      Quantity
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ color: styles.textMuted }}>{quote.quantity}</span>
                      <ArrowRight size={12} style={{ color: styles.textMuted }} />
                      <span className="font-medium" style={{ color: '#8b5cf6' }}>
                        {counterOffer.proposedQuantity}
                      </span>
                    </div>
                  </div>
                )}
                {counterOffer.proposedDeliveryDays && counterOffer.proposedDeliveryDays !== quote.deliveryDays && (
                  <div
                    className="flex-1 p-3 rounded-lg"
                    style={{ backgroundColor: styles.bgSecondary }}
                  >
                    <p className="text-xs" style={{ color: styles.textMuted }}>
                      Lead Time
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ color: styles.textMuted }}>{quote.deliveryDays}d</span>
                      <ArrowRight size={12} style={{ color: styles.textMuted }} />
                      <span className="font-medium" style={{ color: '#8b5cf6' }}>
                        {counterOffer.proposedDeliveryDays}d
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buyer's Message */}
            {counterOffer.message && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: styles.textMuted }}>
                  BUYER'S MESSAGE
                </p>
                <div
                  className="p-3 rounded-lg text-sm italic"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  "{counterOffer.message}"
                </div>
              </div>
            )}

            {/* Action Selection or Response Form */}
            {action === null ? (
              <>
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAccept}
                    className="flex-1 p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2"
                    style={{
                      borderColor: styles.success,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${styles.success}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <CheckCircle size={24} style={{ color: styles.success }} weight="bold" />
                    <span className="font-medium" style={{ color: styles.success }}>
                      Accept
                    </span>
                    <span className="text-xs text-center" style={{ color: styles.textMuted }}>
                      Create revised quote with proposed terms
                    </span>
                  </button>

                  <button
                    onClick={handleReject}
                    className="flex-1 p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2"
                    style={{
                      borderColor: styles.error,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${styles.error}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <XCircle size={24} style={{ color: styles.error }} weight="bold" />
                    <span className="font-medium" style={{ color: styles.error }}>
                      Reject
                    </span>
                    <span className="text-xs text-center" style={{ color: styles.textMuted }}>
                      Decline and explain why
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Response Form */}
                <div
                  className="p-3 rounded-lg flex items-center gap-2"
                  style={{
                    backgroundColor: action === 'accept' ? `${styles.success}15` : `${styles.error}15`,
                  }}
                >
                  {action === 'accept' ? (
                    <CheckCircle size={20} style={{ color: styles.success }} weight="bold" />
                  ) : (
                    <XCircle size={20} style={{ color: styles.error }} weight="bold" />
                  )}
                  <span
                    className="font-medium"
                    style={{ color: action === 'accept' ? styles.success : styles.error }}
                  >
                    {action === 'accept' ? 'Accepting counter-offer' : 'Rejecting counter-offer'}
                  </span>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: styles.textPrimary }}
                  >
                    {action === 'accept' ? 'Response Message' : 'Reason for Rejection'}
                    {action === 'reject' && <span className="text-red-500 ml-1">*</span>}
                    {action === 'accept' && (
                      <span className="ml-1 text-xs font-normal" style={{ color: styles.textMuted }}>
                        (optional)
                      </span>
                    )}
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder={
                      action === 'accept'
                        ? 'Add a note to the buyer...'
                        : 'Explain why you cannot accept this counter-offer...'
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none transition-colors"
                    style={{
                      backgroundColor: styles.bgPrimary,
                      borderColor: error ? '#ef4444' : styles.border,
                      color: styles.textPrimary,
                    }}
                    disabled={isSubmitting}
                  />
                  {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                </div>

                {action === 'accept' && (
                  <div
                    className="p-3 rounded-lg flex items-start gap-3"
                    style={{ backgroundColor: styles.isDark ? '#14532d' : '#dcfce7' }}
                  >
                    <Info size={18} style={{ color: styles.success }} className="mt-0.5 flex-shrink-0" />
                    <p className="text-xs" style={{ color: styles.isDark ? '#86efac' : '#15803d' }}>
                      Accepting will create a revised quote with the buyer's proposed terms.
                      The buyer will be notified and can then accept the revised quote.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between gap-3 p-4 border-t"
            style={{ borderColor: styles.border }}
          >
            {action === null ? (
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                style={{
                  borderColor: styles.border,
                  color: styles.textSecondary,
                }}
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                  style={{
                    borderColor: styles.border,
                    color: styles.textSecondary,
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (action === 'reject' && !response.trim())}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: action === 'accept' ? styles.success : styles.error,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : action === 'accept' ? (
                    <>
                      <CheckCircle size={16} weight="bold" />
                      Accept & Create Revised Quote
                    </>
                  ) : (
                    <>
                      <XCircle size={16} weight="bold" />
                      Reject Counter-Offer
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CounterOfferResponseDialog;
