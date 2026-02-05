// =============================================================================
// RFQ Marketplace Details Panel - Inline Master-Detail Design
// =============================================================================
// Right panel showing full details with seller decision signals and clear CTAs
// Now designed for inline usage in master-detail layout (not overlay drawer)

import React, { useMemo, memo } from 'react';
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
  CurrencyDollar,
  Lightning,
  CheckCircle,
  CurrencyCircleDollar,
  Crown,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import {
  MarketplaceRFQ,
  getBuyerBadgeConfig,
  formatQuantity,
  computeSellerDecisionSignals,
  getCompetitionLevelConfig,
} from '../../types/rfq-marketplace.types';

// =============================================================================
// Types
// =============================================================================

interface RFQMarketplaceDetailsPanelProps {
  rfq: MarketplaceRFQ;
  onClose: () => void;
  onToggleSave: (rfq: MarketplaceRFQ) => void;
  onSubmitQuote: (rfq: MarketplaceRFQ) => void;
}


// =============================================================================
// Component
// =============================================================================

export const RFQMarketplaceDetailsPanel: React.FC<RFQMarketplaceDetailsPanelProps> = memo(({
  rfq,
  onClose,
  onToggleSave,
  onSubmitQuote,
}) => {
  const { styles, t } = usePortal();

  // Compute decision signals
  const signals = useMemo(() => computeSellerDecisionSignals(rfq), [rfq]);
  const buyerBadgeConfig = getBuyerBadgeConfig(rfq.buyer.badge);
  const competitionConfig = getCompetitionLevelConfig(signals.competitionLevel);

  // Compute priority badges for header
  const priorityBadges = useMemo(() => {
    const badges: { label: string; icon: React.ReactNode; bgColor: string; color: string }[] = [];

    // HIGH VALUE
    const isHighValue = rfq.quantity >= 500 || (rfq.estimatedValue && rfq.estimatedValue > 10000);
    if (isHighValue) {
      badges.push({
        label: 'HIGH VALUE',
        icon: <CurrencyCircleDollar size={10} weight="fill" />,
        bgColor: '#f3e8ff',
        color: '#7c3aed',
      });
    }

    // CLOSING SOON
    const isClosingSoon = rfq.daysRemaining <= 2 && rfq.daysRemaining > 0;
    const isExpiringSoon = rfq.daysRemaining === 0 && rfq.hoursRemaining && rfq.hoursRemaining > 0;
    if (isClosingSoon || isExpiringSoon) {
      badges.push({
        label: 'CLOSING SOON',
        icon: <Lightning size={10} weight="fill" />,
        bgColor: '#fef3c7',
        color: '#d97706',
      });
    }

    // ENTERPRISE
    if (rfq.buyer.badge === 'enterprise') {
      badges.push({
        label: 'ENTERPRISE',
        icon: <Crown size={10} weight="fill" />,
        bgColor: '#dbeafe',
        color: '#2563eb',
      });
    }

    return badges;
  }, [rfq.quantity, rfq.estimatedValue, rfq.daysRemaining, rfq.hoursRemaining, rfq.buyer.badge]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className="w-full flex flex-col h-full"
      style={{ backgroundColor: '#fafafa' }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-5 py-4 bg-white"
        style={{ borderBottom: '1px solid #e5e7eb' }}
      >
        <div className="flex-1 min-w-0 pr-3">
          {/* Priority badges */}
          {priorityBadges.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {priorityBadges.map((badge, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
                  style={{ backgroundColor: badge.bgColor, color: badge.color }}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              ))}
              {signals.isNewToday && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
                  style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                >
                  NEW TODAY
                </span>
              )}
            </div>
          )}
          {/* Title */}
          <h2
            className="text-[17px] font-semibold leading-tight text-gray-900"
            style={{ fontFamily: styles.fontHeading }}
          >
            {rfq.partName}
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span>{rfq.rfqNumber}</span>
            <span>·</span>
            <span className="capitalize">{rfq.category.replace('_', ' ')}</span>
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
          <span
            className="font-medium"
            style={{ color: rfq.deadlineUrgency === 'critical' || rfq.deadlineUrgency === 'urgent' ? '#d97706' : '#374151' }}
          >
            {rfq.daysRemaining > 0
              ? `${rfq.daysRemaining} ${t('seller.rfqMarketplace.daysRemaining') || 'days remaining'}`
              : rfq.hoursRemaining
              ? `${rfq.hoursRemaining} ${t('seller.rfqMarketplace.hoursRemaining') || 'hours remaining'}`
              : t('seller.rfqMarketplace.deadlineExpired') || 'Deadline expired'}
          </span>
        </div>
        <span className="text-gray-300">·</span>
        <span className="text-gray-400">Due {formatDate(rfq.deadline)}</span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Quick Signals - Compact inline */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users size={14} />
            <span>{rfq.totalQuotes} quotes</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: competitionConfig.bgColor,
                color: competitionConfig.color,
              }}
            >
              {signals.competitionLevel}
            </span>
          </div>
          {rfq.buyer.reliabilityScore && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Star size={14} className="text-amber-500" weight="fill" />
              <span>{rfq.buyer.reliabilityScore}% reliable</span>
            </div>
          )}
          {signals.isHighValue && (
            <div className="flex items-center gap-1.5 text-purple-600">
              <CurrencyDollar size={14} weight="bold" />
              <span className="font-medium">High Value</span>
            </div>
          )}
        </div>

        {/* Request Details Section */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
            {t('seller.rfqMarketplace.requestDetails') || 'Request Details'}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Description */}
            {rfq.description && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {rfq.description}
              </p>
            )}

            {/* Key Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-gray-400" />
                <div>
                  <p className="text-[10px] uppercase text-gray-400">
                    {t('seller.rfqMarketplace.quantity') || 'Quantity'}
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatQuantity(rfq.quantity, rfq.unit)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <div>
                  <p className="text-[10px] uppercase text-gray-400">
                    {t('seller.rfqMarketplace.deliveryLocation') || 'Delivery'}
                  </p>
                  <p className="font-medium text-gray-900">
                    {rfq.deliveryCity || rfq.deliveryCountry}
                  </p>
                </div>
              </div>

              {rfq.requiredDeliveryDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">
                      {t('seller.rfqMarketplace.requiredBy') || 'Required By'}
                    </p>
                    <p className="font-medium text-gray-900">
                      {formatDate(rfq.requiredDeliveryDate)}
                    </p>
                  </div>
                </div>
              )}

              {rfq.leadTimeRequired && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">
                      {t('seller.rfqMarketplace.leadTime') || 'Lead Time'}
                    </p>
                    <p className="font-medium text-gray-900">
                      {rfq.leadTimeRequired} {t('seller.rfqMarketplace.days') || 'days'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Specifications */}
            {rfq.specifications && Object.keys(rfq.specifications).length > 0 && (
              <div className="pt-3 mt-1 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-400 mb-2">
                  {t('seller.rfqMarketplace.specifications') || 'Specifications'}
                </p>
                <div className="space-y-1.5">
                  {Object.entries(rfq.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="capitalize text-gray-500">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-gray-900">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Buyer Info Section */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
            {t('seller.rfqMarketplace.buyerInfo') || 'Buyer Information'}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {/* Buyer Header */}
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
                <p className="font-medium text-gray-900">{rfq.buyer.companyName}</p>
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium mt-1"
                  style={{ backgroundColor: buyerBadgeConfig.bgColor, color: buyerBadgeConfig.color }}
                >
                  {buyerBadgeConfig.label}
                </span>
              </div>
            </div>

            {/* Buyer Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Globe size={12} className="text-gray-400" />
                <span>{rfq.buyer.city}, {rfq.buyer.country}</span>
              </div>

              {rfq.buyer.totalOrders !== undefined && (
                <div className="flex items-center gap-1.5">
                  <TrendUp size={12} className="text-gray-400" />
                  <span>{rfq.buyer.totalOrders} {t('seller.rfqMarketplace.orders') || 'orders'}</span>
                </div>
              )}

              {rfq.buyer.totalRFQs !== undefined && (
                <div className="flex items-center gap-1.5">
                  <FileText size={12} className="text-gray-400" />
                  <span>{rfq.buyer.totalRFQs} {t('seller.rfqMarketplace.pastRFQs') || 'past RFQs'}</span>
                </div>
              )}

              {rfq.buyer.reliabilityScore !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-amber-500" weight="fill" />
                  <span className="font-medium">{rfq.buyer.reliabilityScore}% {t('seller.rfqMarketplace.reliable') || 'reliable'}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Attachments Section */}
        {rfq.attachments && rfq.attachments.length > 0 && (
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
              {t('seller.rfqMarketplace.attachments') || 'Attachments'}
            </h3>
            <div className="space-y-2">
              {rfq.attachments.map(attachment => (
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
        {rfq.hasQuoted && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
            <CheckCircle size={18} className="text-green-600" weight="fill" />
            <div>
              <p className="text-sm font-medium text-green-700">
                {t('seller.rfqMarketplace.quoteSubmitted') || 'Quote Submitted'}
              </p>
              {rfq.lastQuotedAt && (
                <p className="text-xs text-green-600">{formatDate(rfq.lastQuotedAt)}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions - Always Visible */}
      <div
        className="flex-shrink-0 px-5 py-4 space-y-3 bg-white"
        style={{ borderTop: '1px solid #e5e7eb' }}
      >
        {/* Primary CTA */}
        {rfq.status !== 'closed' && !rfq.hasQuoted && (
          <button
            onClick={() => onSubmitQuote(rfq)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white transition-colors hover:bg-gray-800"
            style={{ backgroundColor: '#18181b' }}
          >
            <PaperPlaneTilt size={16} />
            {t('seller.rfqMarketplace.submitQuote') || 'Submit Quote'}
          </button>
        )}

        {/* Secondary Actions Row */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggleSave(rfq)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
            style={{
              color: rfq.isSaved ? '#d97706' : '#6b7280',
              border: '1px solid #e5e7eb',
            }}
          >
            <BookmarkSimple size={15} weight={rfq.isSaved ? 'fill' : 'regular'} />
            {rfq.isSaved
              ? t('seller.rfqMarketplace.saved') || 'Saved'
              : t('seller.rfqMarketplace.saveRFQ') || 'Save'}
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChatCircle size={15} />
            {t('seller.rfqMarketplace.askQuestion') || 'Ask Question'}
          </button>
        </div>
      </div>
    </div>
  );
});

RFQMarketplaceDetailsPanel.displayName = 'RFQMarketplaceDetailsPanel';

export default RFQMarketplaceDetailsPanel;
