// =============================================================================
// RatingModal — Two-Section Rating: Counterparty + Order Experience
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle, WarningCircle, Spinner } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { ratingService } from '../../services/ratingService';
import { BUYER_RATING_TAGS, SELLER_RATING_TAGS, ORDER_EXPERIENCE_TAGS } from '../../types/rating.types';
import type { RatingEligibility } from '../../types/rating.types';

interface RatingModalProps {
  orderId: string;
  orderNumber: string;
  raterRole: 'buyer' | 'seller';
  onClose: () => void;
  onRated: () => void;
}

// ---------------------------------------------------------------------------
// Star Picker sub-component
// ---------------------------------------------------------------------------
const StarPicker: React.FC<{
  value: number;
  onChange: (n: number) => void;
  size?: number;
}> = ({ value, onChange, size = 32 }) => {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const active = hovered || value;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5"
          >
            <Star
              size={size}
              weight={n <= active ? 'fill' : 'regular'}
              style={{ color: n <= active ? '#f59e0b' : '#9ca3af' }}
            />
          </button>
        ))}
      </div>
      <span
        className="text-xs font-medium h-4"
        style={{ visibility: active > 0 ? 'visible' : 'hidden', color: '#9ca3af' }}
      >
        {labels[active]}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tag Chips sub-component
// ---------------------------------------------------------------------------
const TagChips: React.FC<{
  tags: readonly string[];
  selected: string[];
  onToggle: (tag: string) => void;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ tags, selected, onToggle, styles }) => (
  <div className="flex flex-wrap gap-1.5">
    {tags.map((tag) => {
      const isSelected = selected.includes(tag);
      return (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors"
          style={{
            borderColor: isSelected ? styles.info : styles.border,
            backgroundColor: isSelected ? `${styles.info}15` : 'transparent',
            color: isSelected ? styles.info : styles.textSecondary,
          }}
        >
          {tag}
        </button>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const RatingModal: React.FC<RatingModalProps> = ({ orderId, orderNumber, raterRole, onClose, onRated }) => {
  const { styles } = usePortal();

  // Eligibility (determines which sections to show)
  const [eligibility, setEligibility] = useState<RatingEligibility | null>(null);

  // Counterparty rating state
  const [cpScore, setCpScore] = useState(0);
  const [cpTags, setCpTags] = useState<string[]>([]);
  const [cpComment, setCpComment] = useState('');

  // Order experience rating state
  const [orderScore, setOrderScore] = useState(0);
  const [orderTags, setOrderTags] = useState<string[]>([]);
  const [orderComment, setOrderComment] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const counterpartyTags = raterRole === 'buyer' ? BUYER_RATING_TAGS : SELLER_RATING_TAGS;
  const targetLabel = raterRole === 'buyer' ? 'Seller' : 'Buyer';

  // Check what's already rated
  useEffect(() => {
    ratingService
      .checkEligibility(orderId)
      .then(setEligibility)
      .catch(() => {});
  }, [orderId]);

  const showCounterparty = eligibility
    ? raterRole === 'buyer'
      ? eligibility.canBuyerRateSeller
      : eligibility.canSellerRateBuyer
    : true;
  const showOrderExp = eligibility
    ? raterRole === 'buyer'
      ? eligibility.canBuyerRateOrder
      : eligibility.canSellerRateOrder
    : true;

  const toggleCpTag = (tag: string) =>
    setCpTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  const toggleOrderTag = (tag: string) =>
    setOrderTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const canSubmit = (showCounterparty && cpScore > 0) || (showOrderExp && orderScore > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit counterparty rating
      if (showCounterparty && cpScore > 0) {
        await ratingService.createRating(orderId, {
          score: cpScore,
          tags: cpTags.length > 0 ? cpTags : undefined,
          comment: cpComment.trim() || undefined,
          ratingType: 'counterparty',
        });
      }

      // Submit order experience rating
      if (showOrderExp && orderScore > 0) {
        await ratingService.createRating(orderId, {
          score: orderScore,
          tags: orderTags.length > 0 ? orderTags : undefined,
          comment: orderComment.trim() || undefined,
          ratingType: 'order',
        });
      }

      setSubmitted(true);
      setTimeout(() => {
        onRated();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If nothing left to rate, close
  if (eligibility && !showCounterparty && !showOrderExp) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" style={{ animation: 'fadeIn 0.2s ease-out' }} onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed z-50 top-1/2 left-1/2 w-full max-w-md rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: styles.bgPrimary,
          animation: 'modalPop 0.35s ease-out forwards',
        }}
      >
        {/* Success state */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <CheckCircle size={48} weight="fill" style={{ color: styles.success }} />
            <h2 className="text-lg font-semibold mt-4" style={{ color: styles.textPrimary }}>
              Thanks — rating submitted!
            </h2>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              Your feedback helps improve the marketplace.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: styles.border }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#f59e0b15' }}>
                  <Star size={20} weight="fill" style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                    Rate Order
                  </h2>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {orderNumber}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:opacity-80" style={{ color: styles.textMuted }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: `${styles.error}15` }}
                >
                  <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
                  <span className="text-sm" style={{ color: styles.error }}>
                    {error}
                  </span>
                </div>
              )}

              {/* Section 1: Rate Counterparty */}
              {showCounterparty && (
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                    Rate {targetLabel}
                  </p>
                  <StarPicker value={cpScore} onChange={setCpScore} />
                  <div className="mt-3">
                    <p className="text-[11px] font-medium mb-1.5" style={{ color: styles.textMuted }}>
                      What stood out? (optional)
                    </p>
                    <TagChips tags={counterpartyTags} selected={cpTags} onToggle={toggleCpTag} styles={styles} />
                  </div>
                  <textarea
                    value={cpComment}
                    onChange={(e) => setCpComment(e.target.value.slice(0, 280))}
                    placeholder={`Comment about ${targetLabel.toLowerCase()} (optional)`}
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none mt-3"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgSecondary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
              )}

              {/* Divider */}
              {showCounterparty && showOrderExp && <div className="border-t" style={{ borderColor: styles.border }} />}

              {/* Section 2: Rate Order Experience */}
              {showOrderExp && (
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                    Rate Order Experience
                  </p>
                  <StarPicker value={orderScore} onChange={setOrderScore} />
                  <div className="mt-3">
                    <p className="text-[11px] font-medium mb-1.5" style={{ color: styles.textMuted }}>
                      How was the experience? (optional)
                    </p>
                    <TagChips
                      tags={ORDER_EXPERIENCE_TAGS}
                      selected={orderTags}
                      onToggle={toggleOrderTag}
                      styles={styles}
                    />
                  </div>
                  <textarea
                    value={orderComment}
                    onChange={(e) => setOrderComment(e.target.value.slice(0, 280))}
                    placeholder="Comment about the order (optional)"
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none mt-3"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgSecondary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: styles.border }}>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: styles.border, color: styles.textSecondary }}
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: canSubmit ? styles.info : styles.border }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RatingModal;
