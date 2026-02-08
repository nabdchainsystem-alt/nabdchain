import React, { useState, useMemo } from 'react';
import { X, CurrencyDollar, Truck, ArrowsClockwise, Info, ArrowRight, Spinner } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Quote, CreateCounterOfferData } from '../../types/item.types';

// =============================================================================
// Types
// =============================================================================

interface CounterOfferDialogProps {
  /** The quote to counter-offer */
  quote: Quote;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Submit handler */
  onSubmit: (data: CreateCounterOfferData) => Promise<void>;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

interface FormState {
  proposedPrice: string;
  proposedQuantity: string;
  proposedDeliveryDays: string;
  message: string;
}

interface FormErrors {
  proposedPrice?: string;
  proposedQuantity?: string;
  proposedDeliveryDays?: string;
  message?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(amount: number, currency: string = 'SAR'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

function calculatePriceChange(
  original: number,
  proposed: number,
): {
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

// =============================================================================
// CounterOfferDialog Component
// =============================================================================

/**
 * CounterOfferDialog Component
 *
 * Modal for buyers to submit counter-offers on received quotes.
 * Features:
 * - Proposed price input with original price comparison
 * - Optional quantity and delivery days adjustments
 * - Message textarea for negotiation notes
 * - Price difference visualization
 * - Form validation
 */
export const CounterOfferDialog: React.FC<CounterOfferDialogProps> = ({
  quote,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { styles, t, direction } = usePortal();

  // Form state
  const [form, setForm] = useState<FormState>({
    proposedPrice: '',
    proposedQuantity: '',
    proposedDeliveryDays: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Parsed values for calculations
  const proposedPrice = parseFloat(form.proposedPrice) || 0;
  const _proposedQuantity = form.proposedQuantity ? parseInt(form.proposedQuantity, 10) : quote.quantity;

  // Price change calculation
  const priceChange = useMemo(() => {
    if (!proposedPrice) return null;
    return calculatePriceChange(quote.totalPrice, proposedPrice);
  }, [proposedPrice, quote.totalPrice]);

  // Form handlers
  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: keyof FormState): boolean => {
    let error: string | undefined;

    switch (field) {
      case 'proposedPrice':
        if (!form.proposedPrice) {
          error = 'Proposed price is required';
        } else if (parseFloat(form.proposedPrice) <= 0) {
          error = 'Price must be greater than 0';
        } else if (parseFloat(form.proposedPrice) >= quote.totalPrice) {
          error = 'Counter-offer should be lower than the quoted price';
        }
        break;
      case 'proposedQuantity':
        if (form.proposedQuantity) {
          const qty = parseInt(form.proposedQuantity, 10);
          if (isNaN(qty) || qty <= 0) {
            error = 'Quantity must be a positive number';
          }
        }
        break;
      case 'proposedDeliveryDays':
        if (form.proposedDeliveryDays) {
          const days = parseInt(form.proposedDeliveryDays, 10);
          if (isNaN(days) || days < 0) {
            error = 'Delivery days must be 0 or more';
          }
        }
        break;
      case 'message':
        if (form.message && form.message.length > 2000) {
          error = 'Message must be less than 2000 characters';
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateForm = (): boolean => {
    const fields: (keyof FormState)[] = ['proposedPrice', 'proposedQuantity', 'proposedDeliveryDays', 'message'];
    let isValid = true;

    fields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields to show errors
    setTouched({
      proposedPrice: true,
      proposedQuantity: true,
      proposedDeliveryDays: true,
      message: true,
    });

    if (!validateForm()) {
      return;
    }

    const data: CreateCounterOfferData = {
      proposedPrice: parseFloat(form.proposedPrice),
      proposedQuantity: form.proposedQuantity ? parseInt(form.proposedQuantity, 10) : undefined,
      proposedDeliveryDays: form.proposedDeliveryDays ? parseInt(form.proposedDeliveryDays, 10) : undefined,
      message: form.message || undefined,
    };

    await onSubmit(data);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form
      setForm({
        proposedPrice: '',
        proposedQuantity: '',
        proposedDeliveryDays: '',
        message: '',
      });
      setErrors({});
      setTouched({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={handleClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl shadow-xl overflow-hidden"
          style={{ backgroundColor: styles.bgCard }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: styles.border }}>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#8b5cf620' }}
              >
                <ArrowsClockwise size={20} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                  Counter-Offer
                </h2>
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  Propose different terms
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
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Original Quote Summary */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                <p className="text-xs font-medium mb-2" style={{ color: styles.textMuted }}>
                  ORIGINAL QUOTE
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <CurrencyDollar size={16} style={{ color: styles.textMuted }} />
                      <span className="font-medium" style={{ color: styles.textPrimary }}>
                        {formatPrice(quote.totalPrice, quote.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck size={16} style={{ color: styles.textMuted }} />
                      <span style={{ color: styles.textSecondary }}>{quote.deliveryDays} days</span>
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: styles.textMuted }}>
                    Qty: {quote.quantity}
                  </span>
                </div>
              </div>

              {/* Proposed Price Input */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                  Proposed Total Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div
                    className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    style={{ color: styles.textMuted }}
                  >
                    <span className="text-sm">{quote.currency}</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={form.proposedPrice}
                    onChange={(e) => handleChange('proposedPrice', e.target.value)}
                    onBlur={() => handleBlur('proposedPrice')}
                    placeholder="Enter your proposed price"
                    className={`w-full pl-14 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      touched.proposedPrice && errors.proposedPrice ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: styles.bgPrimary,
                      borderColor: touched.proposedPrice && errors.proposedPrice ? '#ef4444' : styles.border,
                      color: styles.textPrimary,
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                {touched.proposedPrice && errors.proposedPrice && (
                  <p className="mt-1 text-xs text-red-500">{errors.proposedPrice}</p>
                )}

                {/* Price change indicator */}
                {priceChange && !errors.proposedPrice && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span style={{ color: styles.textMuted }}>{formatPrice(quote.totalPrice, quote.currency)}</span>
                      <ArrowRight size={14} style={{ color: styles.textMuted }} />
                      <span
                        style={{
                          color: priceChange.isReduction ? styles.success : styles.error,
                        }}
                      >
                        {formatPrice(proposedPrice, quote.currency)}
                      </span>
                    </div>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: priceChange.isReduction ? '#dcfce7' : '#fee2e2',
                        color: priceChange.isReduction ? '#15803d' : '#dc2626',
                      }}
                    >
                      {priceChange.isReduction ? '' : '+'}
                      {priceChange.percent.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Proposed Quantity (Optional) */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                  Proposed Quantity
                  <span className="ml-1 text-xs font-normal" style={{ color: styles.textMuted }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.proposedQuantity}
                  onChange={(e) => handleChange('proposedQuantity', e.target.value)}
                  onBlur={() => handleBlur('proposedQuantity')}
                  placeholder={`Current: ${quote.quantity}`}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                    touched.proposedQuantity && errors.proposedQuantity ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: styles.bgPrimary,
                    borderColor: touched.proposedQuantity && errors.proposedQuantity ? '#ef4444' : styles.border,
                    color: styles.textPrimary,
                  }}
                  disabled={isSubmitting}
                />
                {touched.proposedQuantity && errors.proposedQuantity && (
                  <p className="mt-1 text-xs text-red-500">{errors.proposedQuantity}</p>
                )}
              </div>

              {/* Proposed Delivery Days (Optional) */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                  Proposed Lead Time (days)
                  <span className="ml-1 text-xs font-normal" style={{ color: styles.textMuted }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.proposedDeliveryDays}
                  onChange={(e) => handleChange('proposedDeliveryDays', e.target.value)}
                  onBlur={() => handleBlur('proposedDeliveryDays')}
                  placeholder={`Current: ${quote.deliveryDays} days`}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                    touched.proposedDeliveryDays && errors.proposedDeliveryDays ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: styles.bgPrimary,
                    borderColor:
                      touched.proposedDeliveryDays && errors.proposedDeliveryDays ? '#ef4444' : styles.border,
                    color: styles.textPrimary,
                  }}
                  disabled={isSubmitting}
                />
                {touched.proposedDeliveryDays && errors.proposedDeliveryDays && (
                  <p className="mt-1 text-xs text-red-500">{errors.proposedDeliveryDays}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                  Message to Seller
                  <span className="ml-1 text-xs font-normal" style={{ color: styles.textMuted }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={() => handleBlur('message')}
                  placeholder="Explain your counter-offer..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none transition-colors"
                  style={{
                    backgroundColor: styles.bgPrimary,
                    borderColor: touched.message && errors.message ? '#ef4444' : styles.border,
                    color: styles.textPrimary,
                  }}
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-1">
                  {touched.message && errors.message ? (
                    <p className="text-xs text-red-500">{errors.message}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs" style={{ color: styles.textMuted }}>
                    {form.message.length}/2000
                  </span>
                </div>
              </div>

              {/* Info Note */}
              <div
                className="p-3 rounded-lg flex items-start gap-3"
                style={{ backgroundColor: styles.isDark ? '#1e3a5f' : '#e0e7ff' }}
              >
                <Info size={18} style={{ color: styles.info }} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs" style={{ color: styles.isDark ? '#93c5fd' : '#4338ca' }}>
                  The seller will be notified of your counter-offer. They can accept, reject, or send a revised quote.
                  Counter-offers expire in 7 days if not responded to.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: styles.border }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                style={{
                  borderColor: styles.border,
                  color: styles.textSecondary,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.proposedPrice}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: '#8b5cf6' }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ArrowsClockwise size={16} />
                    Submit Counter-Offer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CounterOfferDialog;
