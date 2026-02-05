// =============================================================================
// RFQ Details Drawer - Calm Premium Panel
// =============================================================================
// Minimal, professional drawer with smooth state-based rendering

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  X,
  BookmarkSimple,
  PaperPlaneTilt,
  Package,
  MapPin,
  Timer,
  Calendar,
  ShieldCheck,
  Buildings,
  User,
  UserCircle,
  Star,
  FileText,
  FilePdf,
  Download,
  ChatCircle,
  Globe,
  Clock,
  TrendUp,
  Users,
  CheckCircle,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import {
  MarketplaceRFQ,
  getMarketplaceStatusConfig,
  getBuyerBadgeConfig,
  getUrgencyConfig,
  formatQuantity,
  getCompetitionLevel,
} from '../../types/rfq-marketplace.types';

// =============================================================================
// Types
// =============================================================================

interface RFQDetailsDrawerProps {
  rfq: MarketplaceRFQ | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave: (rfq: MarketplaceRFQ) => void;
  onSubmitQuote: (rfq: MarketplaceRFQ) => void;
}

// =============================================================================
// Component
// =============================================================================

export const RFQDetailsDrawer: React.FC<RFQDetailsDrawerProps> = memo(({
  rfq,
  isOpen,
  onClose,
  onToggleSave,
  onSubmitQuote,
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // Two-phase animation state (same as AddProductPanel)
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Cache the RFQ data so it persists during close animation
  const [cachedRfq, setCachedRfq] = useState<MarketplaceRFQ | null>(null);

  // Update cached RFQ when a new one is provided
  useEffect(() => {
    if (rfq) {
      setCachedRfq(rfq);
    }
  }, [rfq]);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Double requestAnimationFrame for smooth animation start
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Clear cached data after animation completes
        setCachedRfq(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Use cached RFQ for rendering (persists during close animation)
  const displayRfq = rfq || cachedRfq;

  // Don't render anything if not visible or no RFQ data
  if (!isVisible || !displayRfq) return null;

  const statusConfig = getMarketplaceStatusConfig(displayRfq.status);
  const buyerBadgeConfig = getBuyerBadgeConfig(displayRfq.buyer.badge);
  const urgencyConfig = getUrgencyConfig(displayRfq.deadlineUrgency);
  const competitionLevel = getCompetitionLevel(displayRfq.totalQuotes);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Invisible click-outside area - no dark overlay for calm feel */}
      <div
        className="fixed inset-0 z-40"
        style={{ top: '64px' }}
        onClick={handleOverlayClick}
      />

      {/* Drawer - smooth slide, calm styling */}
      <div
        className="fixed z-50 flex flex-col w-[420px]"
        style={{
          top: '64px',
          bottom: 0,
          backgroundColor: '#fafafa',
          borderLeft: isRtl ? 'none' : '1px solid #e5e7eb',
          borderRight: isRtl ? '1px solid #e5e7eb' : 'none',
          boxShadow: isAnimating ? '-4px 0 20px rgba(0, 0, 0, 0.05)' : 'none',
          right: isRtl ? 'auto' : 0,
          left: isRtl ? 0 : 'auto',
          transform: isAnimating
            ? 'translateX(0)'
            : `translateX(${isRtl ? '-100%' : '100%'})`,
          transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header - Clean, minimal */}
        <div
          className="flex items-start justify-between px-5 py-4 flex-shrink-0 bg-white"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <h2
              className="text-[17px] font-semibold leading-tight text-gray-900 mb-1"
              style={{ fontFamily: styles.fontHeading }}
            >
              {displayRfq.partName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{displayRfq.rfqNumber}</span>
              <span>·</span>
              <span className="capitalize">{displayRfq.category.replace('_', ' ')}</span>
              {displayRfq.deadlineUrgency === 'critical' && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 font-medium">Urgent</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Deadline Bar - Subtle */}
        <div
          className="flex items-center gap-3 px-5 py-2.5 text-[13px] bg-white"
          style={{ borderBottom: '1px solid #f3f4f6' }}
        >
          <div className="flex items-center gap-1.5">
            <Timer size={14} className="text-gray-400" />
            <span className="text-gray-600 font-medium">
              {displayRfq.daysRemaining > 0
                ? `${displayRfq.daysRemaining} days remaining`
                : displayRfq.hoursRemaining
                ? `${displayRfq.hoursRemaining} hours remaining`
                : 'Expired'}
            </span>
          </div>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400">Due {formatDate(displayRfq.deadline)}</span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Quick Signals - Compact inline */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Users size={14} />
              <span>{displayRfq.totalQuotes} quotes</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: competitionLevel === 'low' ? '#dcfce7' : competitionLevel === 'medium' ? '#fef3c7' : '#fee2e2',
                  color: competitionLevel === 'low' ? '#166534' : competitionLevel === 'medium' ? '#92400e' : '#991b1b',
                }}
              >
                {competitionLevel}
              </span>
            </div>
            {displayRfq.buyer.reliabilityScore && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Star size={14} className="text-amber-500" weight="fill" />
                <span>{displayRfq.buyer.reliabilityScore}% reliable</span>
              </div>
            )}
          </div>

          {/* Request Details */}
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
              Request Details
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {displayRfq.description && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {displayRfq.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">Quantity</p>
                    <p className="font-medium text-gray-900">{formatQuantity(displayRfq.quantity, displayRfq.unit)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">Delivery</p>
                    <p className="font-medium text-gray-900">{displayRfq.deliveryCity || displayRfq.deliveryCountry}</p>
                  </div>
                </div>
                {displayRfq.requiredDeliveryDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <div>
                      <p className="text-[10px] uppercase text-gray-400">Required By</p>
                      <p className="font-medium text-gray-900">{formatDate(displayRfq.requiredDeliveryDate)}</p>
                    </div>
                  </div>
                )}
                {displayRfq.leadTimeRequired && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <div>
                      <p className="text-[10px] uppercase text-gray-400">Lead Time</p>
                      <p className="font-medium text-gray-900">{displayRfq.leadTimeRequired} days</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Buyer Info */}
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
              Buyer Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: buyerBadgeConfig.bgColor }}
                >
                  {buyerBadgeConfig.icon === 'shield-check' && (
                    <ShieldCheck size={20} weight="fill" style={{ color: buyerBadgeConfig.color }} />
                  )}
                  {buyerBadgeConfig.icon === 'buildings' && (
                    <Buildings size={20} weight="fill" style={{ color: buyerBadgeConfig.color }} />
                  )}
                  {buyerBadgeConfig.icon === 'user-circle' && (
                    <UserCircle size={20} weight="fill" style={{ color: buyerBadgeConfig.color }} />
                  )}
                  {buyerBadgeConfig.icon === 'user' && (
                    <User size={20} style={{ color: buyerBadgeConfig.color }} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{displayRfq.buyer.companyName}</p>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium mt-1"
                    style={{ backgroundColor: buyerBadgeConfig.bgColor, color: buyerBadgeConfig.color }}
                  >
                    {buyerBadgeConfig.label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Globe size={12} className="text-gray-400" />
                  <span>{displayRfq.buyer.city}, {displayRfq.buyer.country}</span>
                </div>
                {displayRfq.buyer.totalOrders !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <TrendUp size={12} className="text-gray-400" />
                    <span>{displayRfq.buyer.totalOrders} orders</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Attachments */}
          {displayRfq.attachments && displayRfq.attachments.length > 0 && (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
                Attachments
              </h3>
              <div className="space-y-2">
                {displayRfq.attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {attachment.type === 'pdf' || attachment.name.endsWith('.pdf') ? (
                        <FilePdf size={18} className="text-red-500 flex-shrink-0" weight="fill" />
                      ) : (
                        <FileText size={18} className="text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 truncate">{attachment.name}</span>
                    </div>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quote Status */}
          {displayRfq.hasQuoted && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
              <CheckCircle size={18} className="text-green-600" weight="fill" />
              <div>
                <p className="text-sm font-medium text-green-700">Quote Submitted</p>
                {displayRfq.lastQuotedAt && (
                  <p className="text-xs text-green-600">{formatDate(displayRfq.lastQuotedAt)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Clean, professional */}
        <div
          className="flex-shrink-0 px-5 py-4 space-y-3 bg-white"
          style={{ borderTop: '1px solid #e5e7eb' }}
        >
          {displayRfq.status !== 'closed' && !displayRfq.hasQuoted && (
            <button
              onClick={() => onSubmitQuote(displayRfq)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white transition-colors hover:bg-gray-800"
              style={{ backgroundColor: '#18181b' }}
            >
              <PaperPlaneTilt size={16} />
              Submit Quote
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onToggleSave(displayRfq)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors bg-white hover:bg-gray-50"
              style={{
                color: displayRfq.isSaved ? '#d97706' : '#6b7280',
                border: '1px solid #e5e7eb',
              }}
            >
              <BookmarkSimple size={15} weight={displayRfq.isSaved ? 'fill' : 'regular'} />
              {displayRfq.isSaved ? 'Saved' : 'Save'}
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChatCircle size={15} />
              Ask Question
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

RFQDetailsDrawer.displayName = 'RFQDetailsDrawer';

export default RFQDetailsDrawer;
