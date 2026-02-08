import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Package,
  Truck,
  FileText,
  Clock,
  CheckCircle,
  ArrowsClockwise,
  DownloadSimple,
  CaretDown,
  CaretUp,
  Warning,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { ValidityCountdown } from '../../components/ValidityCountdown';
import { QuoteRevisionTimeline } from '../../components/QuoteRevisionTimeline';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Quote,
  QuoteVersion,
  QuoteEvent,
  CounterOffer,
  QuoteAttachment,
  canAcceptQuote,
  canSubmitCounterOffer,
  getQuoteValidityStatus,
} from '../../types/item.types';

// =============================================================================
// Types
// =============================================================================

interface QuoteDetailPanelProps {
  /** The quote to display */
  quote: Quote;
  /** Quote versions for history */
  versions?: QuoteVersion[];
  /** Quote events for audit trail */
  events?: QuoteEvent[];
  /** Counter-offers history */
  counterOffers?: CounterOffer[];
  /** Quote attachments */
  attachments?: QuoteAttachment[];
  /** Item name */
  itemName?: string;
  /** Item SKU */
  itemSku?: string;
  /** Seller name */
  sellerName?: string;
  /** Seller company */
  sellerCompany?: string;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Accept quote handler */
  onAccept?: () => void;
  /** Reject quote handler */
  onReject?: () => void;
  /** Counter-offer handler */
  onCounterOffer?: () => void;
  /** Loading state */
  isLoading?: boolean;
}

// =============================================================================
// Helper Components
// =============================================================================

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  styles: ReturnType<typeof usePortal>['styles'];
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value, styles }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon size={18} style={{ color: styles.textMuted }} className="mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs" style={{ color: styles.textMuted }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
        {value}
      </p>
    </div>
  </div>
);

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  styles: ReturnType<typeof usePortal>['styles'];
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
  styles,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t" style={{ borderColor: styles.border }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 transition-colors"
        style={{ color: styles.textPrimary }}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} />
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </div>
        {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

// =============================================================================
// Constants
// =============================================================================

const VAT_RATE = 0.15; // 15% VAT (Saudi Arabia standard)

// =============================================================================
// QuoteDetailPanel Component
// =============================================================================

/**
 * QuoteDetailPanel Component
 *
 * A slide-out panel for buyers to view received quote details.
 * Features:
 * - Quote summary with pricing and delivery
 * - Validity countdown
 * - Seller information
 * - Attachments download
 * - Revision history timeline
 * - Counter-offer history
 * - Accept/Reject/Counter-Offer actions
 */
export const QuoteDetailPanel: React.FC<QuoteDetailPanelProps> = ({
  quote,
  versions = [],
  events = [],
  counterOffers = [],
  attachments = [],
  itemName,
  itemSku,
  sellerName,
  sellerCompany,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onCounterOffer,
  isLoading = false,
}) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // Two-phase animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation states
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

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  // Quote status checks
  const canAccept = canAcceptQuote(quote);
  const canCounter = canSubmitCounterOffer(quote);
  const validityStatus = getQuoteValidityStatus(quote.validUntil);
  const hasPendingCounterOffer = counterOffers.some((c) => c.status === 'pending');

  // Format currency
  const formatPrice = (amount: number) => `${quote.currency} ${amount.toLocaleString()}`;

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - transparent, below top bar */}
      <div className="fixed inset-0 z-40" style={{ top: '64px' }} onClick={handleBackdropClick} />

      {/* Panel - below top bar with smooth animation */}
      <div
        className="fixed z-50 w-full max-w-md flex flex-col"
        style={{
          top: '64px',
          bottom: 0,
          backgroundColor: styles.bgCard,
          borderLeft: isRtl ? 'none' : `1px solid ${styles.border}`,
          borderRight: isRtl ? `1px solid ${styles.border}` : 'none',
          boxShadow: isAnimating ? '-8px 0 30px rgba(0, 0, 0, 0.1)' : 'none',
          right: isRtl ? 'auto' : 0,
          left: isRtl ? 0 : 'auto',
          transform: isAnimating ? 'translateX(0)' : isRtl ? 'translateX(-100%)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: styles.border }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                {quote.quoteNumber || `Quote #${quote.id.slice(0, 8)}`}
              </h2>
              <StatusBadge status={quote.status} type="rfq" size="xs" />
            </div>
            <p className="text-sm" style={{ color: styles.textMuted }}>
              Version {quote.version}
            </p>
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
        <div className="h-[calc(100%-140px)] overflow-y-auto">
          {/* Validity Warning */}
          {validityStatus.isExpiringSoon && !validityStatus.isExpired && (
            <div
              className="mx-4 mt-4 p-3 rounded-lg flex items-center gap-3"
              style={{
                backgroundColor: styles.isDark ? '#78350f' : '#fef3c7',
              }}
            >
              <Warning size={20} style={{ color: '#f59e0b' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                  Quote expiring soon
                </p>
                <p className="text-xs" style={{ color: styles.isDark ? '#fcd34d' : '#b45309' }}>
                  {validityStatus.daysRemaining === 0
                    ? 'Expires today'
                    : `${validityStatus.daysRemaining} day${validityStatus.daysRemaining > 1 ? 's' : ''} remaining`}
                </p>
              </div>
            </div>
          )}

          {/* Pending Counter-Offer Notice */}
          {hasPendingCounterOffer && (
            <div
              className="mx-4 mt-4 p-3 rounded-lg flex items-center gap-3"
              style={{
                backgroundColor: styles.isDark ? '#581c87' : '#f3e8ff',
              }}
            >
              <ArrowsClockwise size={20} style={{ color: '#8b5cf6' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#8b5cf6' }}>
                  Counter-offer pending
                </p>
                <p className="text-xs" style={{ color: styles.isDark ? '#c4b5fd' : '#7c3aed' }}>
                  Waiting for seller response
                </p>
              </div>
            </div>
          )}

          {/* Price & Delivery Summary */}
          <div className="p-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    Unit Price
                  </p>
                  <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                    {formatPrice(quote.unitPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    Quantity
                  </p>
                  <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                    {quote.quantity}
                  </p>
                </div>
              </div>

              {quote.discount && quote.discount > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: styles.border }}>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: styles.textMuted }}>Discount</span>
                    <span style={{ color: styles.success }}>
                      -{formatPrice(quote.discount)}
                      {quote.discountPercent && ` (${quote.discountPercent}%)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Price Breakdown with VAT */}
              <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: styles.border }}>
                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: styles.textMuted }}>Subtotal</span>
                  <span style={{ color: styles.textPrimary }}>{formatPrice(quote.totalPrice)}</span>
                </div>
                {/* VAT */}
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: styles.textMuted }}>VAT (15%)</span>
                  <span style={{ color: styles.textPrimary }}>{formatPrice(quote.totalPrice * VAT_RATE)}</span>
                </div>
                {/* Divider */}
                <div style={{ borderTop: `1px dashed ${styles.border}`, margin: '8px 0' }} />
                {/* Total with VAT */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                    Total (incl. VAT)
                  </span>
                  <span className="text-xl font-bold" style={{ color: styles.success }}>
                    {formatPrice(quote.totalPrice * (1 + VAT_RATE))}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={16} style={{ color: styles.textMuted }} />
                  <span className="text-sm" style={{ color: styles.textSecondary }}>
                    {quote.deliveryDays} day{quote.deliveryDays !== 1 ? 's' : ''} lead time
                  </span>
                </div>
                <ValidityCountdown validUntil={quote.validUntil} size="sm" variant="badge" />
              </div>
            </div>
          </div>

          {/* Item Info */}
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold mb-2" style={{ color: styles.textMuted }}>
              ITEM
            </h3>
            <InfoRow
              icon={Package}
              label="Product"
              value={
                <div>
                  <span>{itemName || 'N/A'}</span>
                  {itemSku && (
                    <span className="ml-2 text-xs font-mono" style={{ color: styles.textMuted }}>
                      {itemSku}
                    </span>
                  )}
                </div>
              }
              styles={styles}
            />
          </div>

          {/* Seller Info */}
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold mb-2" style={{ color: styles.textMuted }}>
              SELLER
            </h3>
            <InfoRow
              icon={User}
              label="Supplier"
              value={
                <div>
                  <span>{sellerName || 'Unknown Seller'}</span>
                  {sellerCompany && (
                    <span className="block text-xs" style={{ color: styles.textMuted }}>
                      {sellerCompany}
                    </span>
                  )}
                </div>
              }
              styles={styles}
            />
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="px-4 pb-4">
              <h3 className="text-xs font-semibold mb-2" style={{ color: styles.textMuted }}>
                TERMS & CONDITIONS
              </h3>
              <div
                className="p-3 rounded-lg text-sm"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                {quote.notes}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <CollapsibleSection
              title="Attachments"
              icon={FileText}
              badge={
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: styles.bgActive, color: styles.textSecondary }}
                >
                  {attachments.length}
                </span>
              }
              styles={styles}
            >
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: styles.bgSecondary }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
                  >
                    <FileText size={16} style={{ color: styles.info }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: styles.textPrimary }}>
                        {attachment.name}
                      </p>
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        {attachment.type.replace('_', ' ')}
                      </p>
                    </div>
                    <DownloadSimple size={16} style={{ color: styles.textMuted }} />
                  </a>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* History Timeline */}
          {(versions.length > 0 || counterOffers.length > 0 || events.length > 0) && (
            <CollapsibleSection
              title="History"
              icon={Clock}
              badge={
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: styles.bgActive, color: styles.textSecondary }}
                >
                  {versions.length + counterOffers.length}
                </span>
              }
              styles={styles}
            >
              <QuoteRevisionTimeline
                versions={versions}
                counterOffers={counterOffers}
                events={events}
                currency={quote.currency}
                compact
                maxEntries={10}
              />
            </CollapsibleSection>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 border-t"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          {validityStatus.isExpired ? (
            <div className="text-center py-2 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
              <p className="text-sm" style={{ color: styles.textMuted }}>
                This quote has expired
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Counter-Offer Button */}
              {canCounter.canSubmit && !hasPendingCounterOffer && onCounterOffer && (
                <button
                  onClick={onCounterOffer}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                  style={{
                    borderColor: '#8b5cf6',
                    color: '#8b5cf6',
                  }}
                >
                  <ArrowsClockwise size={16} className="inline mr-2" />
                  Counter-Offer
                </button>
              )}

              {/* Reject Button */}
              {onReject && (
                <button
                  onClick={onReject}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                  style={{
                    borderColor: styles.border,
                    color: styles.textSecondary,
                  }}
                >
                  Reject
                </button>
              )}

              {/* Accept Button */}
              {canAccept.canAccept && onAccept && (
                <button
                  onClick={onAccept}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: styles.success }}
                >
                  <CheckCircle size={16} className="inline mr-2" weight="bold" />
                  Accept Quote
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuoteDetailPanel;
