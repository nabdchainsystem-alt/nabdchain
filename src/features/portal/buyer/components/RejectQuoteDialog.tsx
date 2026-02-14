// =============================================================================
// Reject Quote Dialog - Stage 4 Quote Rejection
// Dialog for buyers to reject a quote with a reason
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, XCircle, Spinner, WarningCircle } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { marketplaceOrderService } from '../../services/marketplaceOrderService';
import { Quote } from '../../types/item.types';

// =============================================================================
// Types
// =============================================================================

interface RejectQuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onSuccess?: () => void;
}

// Predefined rejection reasons
const REJECTION_REASONS = [
  { value: 'price_too_high', label: 'Price is too high' },
  { value: 'delivery_too_long', label: 'Delivery time is too long' },
  { value: 'found_better_option', label: 'Found a better option' },
  { value: 'requirements_changed', label: 'Requirements have changed' },
  { value: 'budget_constraints', label: 'Budget constraints' },
  { value: 'other', label: 'Other reason' },
];

// =============================================================================
// Component
// =============================================================================

export const RejectQuoteDialog: React.FC<RejectQuoteDialogProps> = ({ isOpen, onClose, quote, onSuccess }) => {
  const { styles } = usePortal();

  // Form state
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
      setError(null);
    }
  }, [isOpen]);

  // Get the final reason text
  const getReasonText = (): string => {
    if (selectedReason === 'other') {
      return customReason.trim();
    }
    const selected = REJECTION_REASONS.find((r) => r.value === selectedReason);
    return selected ? selected.label : '';
  };

  // Handle reject
  const handleReject = async () => {
    const reasonText = getReasonText();
    if (!reasonText) {
      setError('Please select or enter a reason');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await marketplaceOrderService.rejectQuote(quote.id, {
        reason: reasonText,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to reject quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject quote. Please try again.');
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
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${styles.error}15` }}>
              <XCircle size={20} weight="fill" style={{ color: styles.error }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                Reject Quote
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
          <p className="text-sm" style={{ color: styles.textSecondary }}>
            Please let the seller know why you're declining this quote. This helps them improve their offerings.
          </p>

          {/* Reason Selection */}
          <div className="space-y-2">
            {REJECTION_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                style={{
                  backgroundColor: selectedReason === reason.value ? `${styles.info}10` : styles.bgSecondary,
                  border: `1px solid ${selectedReason === reason.value ? styles.info : 'transparent'}`,
                }}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: styles.info }}
                />
                <span className="text-sm" style={{ color: styles.textPrimary }}>
                  {reason.label}
                </span>
              </label>
            ))}
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'other' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                Please specify your reason
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border transition-colors resize-none"
                style={{
                  backgroundColor: styles.bgSecondary,
                  borderColor: styles.borderLight,
                  color: styles.textPrimary,
                }}
                placeholder="Enter your reason..."
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: `${styles.error}15` }}>
              <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
              <span className="text-sm" style={{ color: styles.error }}>
                {error}
              </span>
            </div>
          )}
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
            onClick={handleReject}
            disabled={isSubmitting || !selectedReason || (selectedReason === 'other' && !customReason.trim())}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: styles.error,
              color: '#fff',
            }}
          >
            {isSubmitting ? <Spinner size={20} className="animate-spin" /> : <XCircle size={20} weight="fill" />}
            {isSubmitting ? 'Rejecting...' : 'Reject Quote'}
          </button>
        </div>
      </div>
    </>
  );
};

export default RejectQuoteDialog;
