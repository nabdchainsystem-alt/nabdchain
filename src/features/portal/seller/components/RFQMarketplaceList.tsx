// =============================================================================
// RFQ Marketplace List Component - Clean Single-Column Layout
// =============================================================================
// Minimal list with subtle section dividers

import React, { memo, useCallback } from 'react';
import {
  CaretLeft,
  CaretRight,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { MarketplaceRFQ } from '../../types/rfq-marketplace.types';
import { RFQCard } from './RFQCard';

// =============================================================================
// Types
// =============================================================================

interface RFQMarketplaceListProps {
  rfqs: MarketplaceRFQ[];
  selectedId?: string;
  onSelect: (rfq: MarketplaceRFQ) => void;
  onToggleSave: (rfq: MarketplaceRFQ) => void;
  totalCount: number;
  page: number;
  onPageChange: (page: number) => void;
}

// =============================================================================
// Memoized Card Wrapper
// =============================================================================

const MemoizedCardItem = memo<{
  rfq: MarketplaceRFQ;
  isSelected: boolean;
  onSelect: (rfq: MarketplaceRFQ) => void;
  onToggleSave: (rfq: MarketplaceRFQ) => void;
}>(({ rfq, isSelected, onSelect, onToggleSave }) => (
  <RFQCard
    rfq={rfq}
    isSelected={isSelected}
    onSelect={onSelect}
    onToggleSave={onToggleSave}
  />
));

MemoizedCardItem.displayName = 'MemoizedCardItem';

// =============================================================================
// Component
// =============================================================================

export const RFQMarketplaceList: React.FC<RFQMarketplaceListProps> = memo(({
  rfqs,
  selectedId,
  onSelect,
  onToggleSave,
  totalCount,
  page,
  onPageChange,
}) => {
  const { t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Stable callbacks
  const handlePrevPage = useCallback(() => {
    onPageChange(page - 1);
  }, [onPageChange, page]);

  const handleNextPage = useCallback(() => {
    onPageChange(page + 1);
  }, [onPageChange, page]);

  return (
    <div className="flex flex-col h-full">
      {/* List Header - Minimal */}
      <div
        className="flex items-center justify-between px-5 py-2.5 flex-shrink-0 bg-white"
        style={{ borderBottom: '1px solid #f3f4f6' }}
      >
        <span className="text-[13px] text-gray-400">
          <span className="font-medium text-gray-600">{totalCount}</span>{' '}
          {t('seller.rfqMarketplace.requestsFound') || 'open requests'}
        </span>
      </div>

      {/* List Content - Clean spacing */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-2.5">
          {rfqs.map(rfq => (
            <MemoizedCardItem
              key={rfq.id}
              rfq={rfq}
              isSelected={rfq.id === selectedId}
              onSelect={onSelect}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      </div>

      {/* Pagination - Subtle */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-5 py-2.5 flex-shrink-0 bg-white"
          style={{ borderTop: '1px solid #f3f4f6' }}
        >
          <span className="text-[13px] text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {isRtl ? <CaretRight size={13} /> : <CaretLeft size={13} />}
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Next
              {isRtl ? <CaretLeft size={13} /> : <CaretRight size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

RFQMarketplaceList.displayName = 'RFQMarketplaceList';

export default RFQMarketplaceList;
