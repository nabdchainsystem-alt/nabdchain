// =============================================================================
// RFQ Card Component - Calm, Premium Design with Priority Badges
// =============================================================================
// Neutral, professional card with clear prioritization indicators

import React, { memo, useCallback, useMemo } from 'react';
import {
  BookmarkSimple,
  MapPin,
  Package,
  Timer,
  ShieldCheck,
  Buildings,
  Check,
  Users,
  UserCircle,
  CurrencyCircleDollar,
  Lightning,
  Crown,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { MarketplaceRFQ, getBuyerBadgeConfig, formatQuantity } from '../../types/rfq-marketplace.types';

// =============================================================================
// Types
// =============================================================================

interface RFQCardProps {
  rfq: MarketplaceRFQ;
  isSelected?: boolean;
  onSelect: (rfq: MarketplaceRFQ) => void;
  onToggleSave: (rfq: MarketplaceRFQ) => void;
}

// Priority badge configuration
interface PriorityBadge {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

// =============================================================================
// Component
// =============================================================================

export const RFQCard: React.FC<RFQCardProps> = memo(({ rfq, isSelected, onSelect, onToggleSave }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { styles, t } = usePortal();

  const buyerBadgeConfig = getBuyerBadgeConfig(rfq.buyer.badge);

  const handleCardClick = useCallback(() => {
    onSelect(rfq);
  }, [onSelect, rfq]);

  const handleSaveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSave(rfq);
    },
    [onToggleSave, rfq],
  );

  // Compute priority badges - HIGH VALUE, CLOSING SOON, ENTERPRISE
  const priorityBadges = useMemo((): PriorityBadge[] => {
    const badges: PriorityBadge[] = [];

    // HIGH VALUE: quantity > 500 or estimated value > 10000
    const isHighValue = rfq.quantity >= 500 || (rfq.estimatedValue && rfq.estimatedValue > 10000);
    if (isHighValue) {
      badges.push({
        label: 'HIGH VALUE',
        icon: <CurrencyCircleDollar size={10} weight="fill" />,
        bgColor: '#f3e8ff',
        textColor: '#7c3aed',
      });
    }

    // CLOSING SOON: deadline within 2 days
    const isClosingSoon = rfq.daysRemaining <= 2 && rfq.daysRemaining > 0;
    const isExpiringSoon = rfq.daysRemaining === 0 && rfq.hoursRemaining && rfq.hoursRemaining > 0;
    if (isClosingSoon || isExpiringSoon) {
      badges.push({
        label: 'CLOSING SOON',
        icon: <Lightning size={10} weight="fill" />,
        bgColor: '#fef3c7',
        textColor: '#d97706',
      });
    }

    // ENTERPRISE buyer
    if (rfq.buyer.badge === 'enterprise') {
      badges.push({
        label: 'ENTERPRISE',
        icon: <Crown size={10} weight="fill" />,
        bgColor: '#dbeafe',
        textColor: '#2563eb',
      });
    }

    return badges;
  }, [rfq.quantity, rfq.estimatedValue, rfq.daysRemaining, rfq.hoursRemaining, rfq.buyer.badge]);

  // Determine if this RFQ has priority indicators
  const isNew = new Date(rfq.createdAt).toDateString() === new Date().toDateString();
  const isUrgent = rfq.deadlineUrgency === 'critical' || rfq.deadlineUrgency === 'urgent';

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-lg cursor-pointer"
      style={{
        backgroundColor: isSelected ? '#f9fafb' : '#fff',
        border: isSelected ? '1px solid #d1d5db' : '1px solid #e5e7eb',
        boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
        transition: 'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
      }}
    >
      {/* Subtle left accent for selected state */}
      {isSelected && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ backgroundColor: '#6b7280' }} />
      )}

      <div className="px-4 py-3.5">
        {/* Priority Badges Row - above title */}
        {priorityBadges.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {priorityBadges.map((badge, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
                style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
              >
                {badge.icon}
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* Top Row: Title + Actions */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate text-[15px] leading-tight">{rfq.partName}</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
              <span>{rfq.rfqNumber}</span>
              <span>·</span>
              <span className="capitalize">{rfq.category.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Status indicators */}
            {rfq.hasQuoted && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                <Check size={10} weight="bold" />
                Quoted
              </span>
            )}
            {isNew && !rfq.hasQuoted && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">New</span>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveClick}
              className="p-1 rounded transition-colors hover:bg-gray-100"
              style={{
                color: rfq.isSaved ? '#d97706' : '#d1d5db',
              }}
            >
              <BookmarkSimple size={15} weight={rfq.isSaved ? 'fill' : 'regular'} />
            </button>
          </div>
        </div>

        {/* Key Details */}
        <div className="flex items-center gap-4 text-[13px] text-gray-500 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Package size={13} className="text-gray-300" />
            <span className="font-medium text-gray-700">{formatQuantity(rfq.quantity, rfq.unit)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-gray-300" />
            <span>{rfq.deliveryCity || rfq.deliveryCountry}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-gray-300" />
            <span>{rfq.totalQuotes} quotes</span>
          </div>
        </div>

        {/* Bottom Row: Buyer + Deadline */}
        <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid #f3f4f6' }}>
          {/* Buyer Info */}
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
            >
              {buyerBadgeConfig.icon === 'shield-check' && <ShieldCheck size={10} weight="fill" />}
              {buyerBadgeConfig.icon === 'buildings' && <Buildings size={10} weight="fill" />}
              {buyerBadgeConfig.icon === 'user-circle' && <UserCircle size={10} weight="fill" />}
              {buyerBadgeConfig.label}
            </span>
            <span className="text-[13px] text-gray-500 truncate max-w-[140px]">{rfq.buyer.companyName}</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-1">
            <Timer size={13} style={{ color: isUrgent ? '#d97706' : '#9ca3af' }} />
            <span className="text-[13px]" style={{ color: isUrgent ? '#d97706' : '#9ca3af' }}>
              {rfq.daysRemaining > 0
                ? `${rfq.daysRemaining}d left`
                : rfq.hoursRemaining
                  ? `${rfq.hoursRemaining}h left`
                  : t('seller.rfqMarketplace.expired') || 'Expired'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

RFQCard.displayName = 'RFQCard';

export default RFQCard;
