import React, { useMemo } from 'react';
import {
  PencilSimple,
  PaperPlaneTilt,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  Clock,
  CurrencyDollar,
  Truck,
  FileText,
  User,
  ArrowRight,
} from 'phosphor-react';
import { usePortal } from '../context/PortalContext';
import { QuoteVersion, CounterOffer, QuoteEvent } from '../types/item.types';

// =============================================================================
// Types
// =============================================================================

interface TimelineEntry {
  id: string;
  type: 'version' | 'counter_offer' | 'event';
  timestamp: string;
  data: QuoteVersion | CounterOffer | QuoteEvent;
}

interface QuoteRevisionTimelineProps {
  /** Quote versions (from getQuoteVersions) */
  versions?: QuoteVersion[];
  /** Counter-offers (from getCounterOffers) */
  counterOffers?: CounterOffer[];
  /** Quote events (from getQuoteHistory) */
  events?: QuoteEvent[];
  /** Current quote currency */
  currency?: string;
  /** Maximum entries to show (0 = unlimited) */
  maxEntries?: number;
  /** Show price changes */
  showPriceChanges?: boolean;
  /** Compact mode for side panels */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPrice(amount: number, currency: string = 'SAR'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

function getPriceChangePercent(oldPrice: number, newPrice: number): string {
  const change = ((newPrice - oldPrice) / oldPrice) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

// =============================================================================
// Timeline Entry Components
// =============================================================================

interface VersionEntryProps {
  version: QuoteVersion;
  prevVersion?: QuoteVersion;
  currency: string;
  showPriceChanges: boolean;
  compact: boolean;
  styles: ReturnType<typeof usePortal>['styles'];
}

const VersionEntry: React.FC<VersionEntryProps> = ({
  version,
  prevVersion,
  currency,
  showPriceChanges,
  compact,
  styles,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return PencilSimple;
      case 'sent':
        return PaperPlaneTilt;
      case 'revised':
        return ArrowsClockwise;
      case 'accepted':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#f59e0b';
      case 'sent':
        return '#3b82f6';
      case 'revised':
        return '#8b5cf6';
      case 'accepted':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      default:
        return styles.textMuted;
    }
  };

  const Icon = getStatusIcon(version.status);
  const color = getStatusColor(version.status);
  const priceChanged = prevVersion && prevVersion.totalPrice !== version.totalPrice;
  const deliveryChanged = prevVersion && prevVersion.deliveryDays !== version.deliveryDays;

  return (
    <div className={compact ? 'py-2' : 'py-3'}>
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={16} weight="bold" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`font-medium ${compact ? 'text-sm' : ''}`}
              style={{ color: styles.textPrimary }}
            >
              Version {version.version}
              <span
                className="ml-2 px-1.5 py-0.5 rounded text-xs"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {version.status}
              </span>
            </span>
            <span className="text-xs" style={{ color: styles.textMuted }}>
              {formatTimestamp(version.createdAt)}
            </span>
          </div>

          {version.changeReason && (
            <p
              className={`mt-1 ${compact ? 'text-xs' : 'text-sm'}`}
              style={{ color: styles.textSecondary }}
            >
              {version.changeReason}
            </p>
          )}

          {showPriceChanges && (priceChanged || deliveryChanged) && (
            <div className="flex flex-wrap gap-3 mt-2">
              {priceChanged && prevVersion && (
                <div className="flex items-center gap-1.5 text-xs">
                  <CurrencyDollar size={12} style={{ color: styles.textMuted }} />
                  <span style={{ color: styles.textMuted }}>
                    {formatPrice(prevVersion.totalPrice, currency)}
                  </span>
                  <ArrowRight size={10} style={{ color: styles.textMuted }} />
                  <span style={{ color: styles.textPrimary }}>
                    {formatPrice(version.totalPrice, currency)}
                  </span>
                  <span
                    className="px-1 py-0.5 rounded text-[10px]"
                    style={{
                      backgroundColor:
                        version.totalPrice < prevVersion.totalPrice
                          ? '#dcfce7'
                          : '#fee2e2',
                      color:
                        version.totalPrice < prevVersion.totalPrice
                          ? '#15803d'
                          : '#dc2626',
                    }}
                  >
                    {getPriceChangePercent(prevVersion.totalPrice, version.totalPrice)}
                  </span>
                </div>
              )}
              {deliveryChanged && prevVersion && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Truck size={12} style={{ color: styles.textMuted }} />
                  <span style={{ color: styles.textMuted }}>
                    {prevVersion.deliveryDays}d
                  </span>
                  <ArrowRight size={10} style={{ color: styles.textMuted }} />
                  <span style={{ color: styles.textPrimary }}>
                    {version.deliveryDays}d
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CounterOfferEntryProps {
  counterOffer: CounterOffer;
  originalPrice?: number;
  currency: string;
  compact: boolean;
  styles: ReturnType<typeof usePortal>['styles'];
}

const CounterOfferEntry: React.FC<CounterOfferEntryProps> = ({
  counterOffer,
  originalPrice,
  currency,
  compact,
  styles,
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: '#f59e0b', label: 'Pending' };
      case 'accepted':
        return { color: '#22c55e', label: 'Accepted' };
      case 'rejected':
        return { color: '#ef4444', label: 'Rejected' };
      case 'expired':
        return { color: '#6b7280', label: 'Expired' };
      default:
        return { color: styles.textMuted, label: status };
    }
  };

  const config = getStatusConfig(counterOffer.status);

  return (
    <div className={compact ? 'py-2' : 'py-3'}>
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#8b5cf620' }}
        >
          <ArrowsClockwise size={16} weight="bold" style={{ color: '#8b5cf6' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`font-medium ${compact ? 'text-sm' : ''}`}
              style={{ color: styles.textPrimary }}
            >
              Counter-Offer
              <span
                className="ml-2 px-1.5 py-0.5 rounded text-xs"
                style={{ backgroundColor: `${config.color}20`, color: config.color }}
              >
                {config.label}
              </span>
            </span>
            <span className="text-xs" style={{ color: styles.textMuted }}>
              {formatTimestamp(counterOffer.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-xs">
              <CurrencyDollar size={12} style={{ color: '#8b5cf6' }} />
              <span style={{ color: styles.textPrimary }}>
                {formatPrice(counterOffer.proposedPrice, currency)}
              </span>
              {originalPrice && (
                <span
                  className="px-1 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: '#f3e8ff',
                    color: '#7c3aed',
                  }}
                >
                  {getPriceChangePercent(originalPrice, counterOffer.proposedPrice)}
                </span>
              )}
            </div>
            {counterOffer.proposedDeliveryDays && (
              <div className="flex items-center gap-1 text-xs" style={{ color: styles.textMuted }}>
                <Truck size={12} />
                <span>{counterOffer.proposedDeliveryDays}d</span>
              </div>
            )}
          </div>

          {counterOffer.message && (
            <p
              className={`mt-2 ${compact ? 'text-xs' : 'text-sm'} italic`}
              style={{ color: styles.textSecondary }}
            >
              "{counterOffer.message}"
            </p>
          )}

          {counterOffer.sellerResponse && (
            <div
              className="mt-2 p-2 rounded text-xs"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <span className="font-medium" style={{ color: styles.textSecondary }}>
                Seller response:
              </span>
              <span className="ml-1" style={{ color: styles.textMuted }}>
                {counterOffer.sellerResponse}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface EventEntryProps {
  event: QuoteEvent;
  compact: boolean;
  styles: ReturnType<typeof usePortal>['styles'];
}

const EventEntry: React.FC<EventEntryProps> = ({ event, compact, styles }) => {
  const getEventConfig = (eventType: string) => {
    switch (eventType) {
      case 'QUOTE_CREATED':
        return { icon: FileText, color: '#3b82f6', label: 'Quote created' };
      case 'QUOTE_UPDATED':
        return { icon: PencilSimple, color: '#f59e0b', label: 'Quote updated' };
      case 'QUOTE_SENT':
        return { icon: PaperPlaneTilt, color: '#22c55e', label: 'Quote sent to buyer' };
      case 'QUOTE_REVISED':
        return { icon: ArrowsClockwise, color: '#8b5cf6', label: 'Quote revised' };
      case 'QUOTE_EXPIRED':
        return { icon: Clock, color: '#6b7280', label: 'Quote expired' };
      case 'QUOTE_ACCEPTED':
        return { icon: CheckCircle, color: '#22c55e', label: 'Quote accepted' };
      case 'QUOTE_REJECTED':
        return { icon: XCircle, color: '#ef4444', label: 'Quote rejected' };
      case 'COUNTER_OFFER_RECEIVED':
        return { icon: ArrowsClockwise, color: '#8b5cf6', label: 'Counter-offer received' };
      case 'COUNTER_OFFER_REJECTED':
        return { icon: XCircle, color: '#ef4444', label: 'Counter-offer rejected' };
      default:
        return { icon: FileText, color: styles.textMuted, label: eventType };
    }
  };

  const config = getEventConfig(event.eventType);
  const Icon = config.icon;

  return (
    <div className={compact ? 'py-1.5' : 'py-2'}>
      <div className="flex items-center gap-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Icon size={12} weight="bold" style={{ color: config.color }} />
        </div>
        <div className="flex-1 flex items-center justify-between gap-2">
          <span className="text-xs" style={{ color: styles.textSecondary }}>
            {config.label}
          </span>
          <span className="text-[10px]" style={{ color: styles.textMuted }}>
            {formatTimestamp(event.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// QuoteRevisionTimeline Component
// =============================================================================

/**
 * QuoteRevisionTimeline Component
 *
 * Displays the complete history of a quote including:
 * - Version changes with price/term diffs
 * - Counter-offer submissions and responses
 * - Status change events
 *
 * Features:
 * - Chronological ordering
 * - Price change visualization
 * - Compact mode for side panels
 * - Dark/light mode support
 */
export const QuoteRevisionTimeline: React.FC<QuoteRevisionTimelineProps> = ({
  versions = [],
  counterOffers = [],
  events = [],
  currency = 'SAR',
  maxEntries = 0,
  showPriceChanges = true,
  compact = false,
  className = '',
}) => {
  const { styles } = usePortal();

  // Combine and sort all entries chronologically
  const timelineEntries = useMemo(() => {
    const entries: TimelineEntry[] = [
      ...versions.map((v) => ({
        id: `v-${v.id}`,
        type: 'version' as const,
        timestamp: v.createdAt,
        data: v,
      })),
      ...counterOffers.map((c) => ({
        id: `c-${c.id}`,
        type: 'counter_offer' as const,
        timestamp: c.createdAt,
        data: c,
      })),
      // Only include events that aren't duplicated by versions
      ...events
        .filter((e) => !['QUOTE_CREATED', 'QUOTE_UPDATED', 'QUOTE_REVISED'].includes(e.eventType))
        .map((e) => ({
          id: `e-${e.id}`,
          type: 'event' as const,
          timestamp: e.createdAt,
          data: e,
        })),
    ];

    // Sort by timestamp descending (newest first)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply max entries limit
    if (maxEntries > 0) {
      return entries.slice(0, maxEntries);
    }

    return entries;
  }, [versions, counterOffers, events, maxEntries]);

  // Get version map for price comparison
  const versionMap = useMemo(() => {
    const map = new Map<number, QuoteVersion>();
    versions.forEach((v) => map.set(v.version, v));
    return map;
  }, [versions]);

  // Get original price for counter-offer comparison
  const originalPrice = useMemo(() => {
    if (versions.length === 0) return undefined;
    // Get the latest sent version's price
    const sentVersion = versions.find((v) => v.status === 'sent');
    return sentVersion?.totalPrice;
  }, [versions]);

  if (timelineEntries.length === 0) {
    return (
      <div
        className={`text-center py-8 ${className}`}
        style={{ color: styles.textMuted }}
      >
        <Clock size={32} className="mx-auto mb-2" />
        <p className="text-sm">No history available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Timeline line */}
      <div className="relative">
        <div
          className="absolute left-4 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: styles.border }}
        />

        <div className="space-y-0">
          {timelineEntries.map((entry) => {
            if (entry.type === 'version') {
              const version = entry.data as QuoteVersion;
              const prevVersion =
                version.version > 1 ? versionMap.get(version.version - 1) : undefined;
              return (
                <VersionEntry
                  key={entry.id}
                  version={version}
                  prevVersion={prevVersion}
                  currency={currency}
                  showPriceChanges={showPriceChanges}
                  compact={compact}
                  styles={styles}
                />
              );
            }

            if (entry.type === 'counter_offer') {
              return (
                <CounterOfferEntry
                  key={entry.id}
                  counterOffer={entry.data as CounterOffer}
                  originalPrice={originalPrice}
                  currency={currency}
                  compact={compact}
                  styles={styles}
                />
              );
            }

            return (
              <EventEntry
                key={entry.id}
                event={entry.data as QuoteEvent}
                compact={compact}
                styles={styles}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuoteRevisionTimeline;
