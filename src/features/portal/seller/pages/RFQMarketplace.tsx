// =============================================================================
// RFQ Marketplace Page - Master-Detail Layout
// =============================================================================
// Side-by-side list + details panel for calm, professional UX

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  MagnifyingGlass,
  FunnelSimple,
  SortAscending,
  BookmarkSimple,
  PaperPlaneTilt,
  X,
  CaretDown,
  Spinner,
  ArrowsClockwise,
  FileText,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { EmptyState } from '../../components/EmptyState';
import {
  MarketplaceRFQ,
  MarketplaceFilters,
  MarketplaceStats,
  MarketplaceSortBy,
  DeadlineFilter,
  BuyerBadgeType,
  ActiveFilter,
  RFQ_CATEGORIES,
} from '../../types/rfq-marketplace.types';
import { rfqMarketplaceService } from '../../services/rfqMarketplaceService';
import { RFQMarketplaceList } from '../components/RFQMarketplaceList';
import { RFQMarketplaceDetailsPanel } from '../components/RFQMarketplaceDetailsPanel';
import { SubmitMarketplaceQuoteModal } from '../components/SubmitMarketplaceQuoteModal';

// =============================================================================
// Memoized List Wrapper - Prevents re-render when drawer state changes
// =============================================================================

const StableListWrapper = memo<{
  loadingState: 'loading' | 'success' | 'error' | 'empty';
  filterViewMode: 'browse' | 'saved';
  rfqs: MarketplaceRFQ[];
  selectedRFQId: string | null;
  onSelectRFQ: (rfq: MarketplaceRFQ) => void;
  onToggleSave: (rfq: MarketplaceRFQ) => void;
  totalRFQs: number;
  page: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}>(({
  loadingState,
  filterViewMode,
  rfqs,
  selectedRFQId,
  onSelectRFQ,
  onToggleSave,
  totalRFQs,
  page,
  onPageChange,
  onRetry,
}) => {
  if (loadingState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Spinner size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <EmptyState
        title="Error Loading Requests"
        description="Unable to load marketplace data. Please try again."
        action={
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-800"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (loadingState === 'empty') {
    return (
      <EmptyState
        title={filterViewMode === 'saved' ? 'No Saved Requests' : 'No Open Requests'}
        description={
          filterViewMode === 'saved'
            ? 'Save RFQs you want to quote on later.'
            : 'No open requests right now. Check back soon.'
        }
      />
    );
  }

  return (
    <RFQMarketplaceList
      rfqs={rfqs}
      selectedId={selectedRFQId || undefined}
      onSelect={onSelectRFQ}
      onToggleSave={onToggleSave}
      totalCount={totalRFQs}
      page={page}
      onPageChange={onPageChange}
    />
  );
});

StableListWrapper.displayName = 'StableListWrapper';

// =============================================================================
// Types
// =============================================================================

interface RFQMarketplaceProps {
  onNavigate: (page: string) => void;
}

type FilterViewMode = 'browse' | 'saved';

// =============================================================================
// Component
// =============================================================================

export const RFQMarketplace: React.FC<RFQMarketplaceProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // Prevent double loading
  const isInitialMount = useRef(true);

  // Data state
  const [rfqs, setRfqs] = useState<MarketplaceRFQ[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error' | 'empty'>('loading');
  const [totalRFQs, setTotalRFQs] = useState(0);

  // Filter state
  const [filterViewMode, setFilterViewMode] = useState<FilterViewMode>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    sortBy: 'newest',
    page: 1,
    limit: 20,
  });

  // Modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteRFQ, setQuoteRFQ] = useState<MarketplaceRFQ | null>(null);

  // Selected RFQ - computed from selectedRFQId
  const selectedRFQ = useMemo(
    () => rfqs.find(r => r.id === selectedRFQId) || null,
    [rfqs, selectedRFQId]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load RFQs - FIXED: removed selectedRFQ from dependencies to prevent refetch on selection
  const loadRFQs = useCallback(async () => {
    setLoadingState('loading');
    try {
      const token = await getToken();
      if (!token) {
        setLoadingState('error');
        return;
      }

      const appliedFilters: MarketplaceFilters = {
        ...filters,
        search: debouncedSearch || undefined,
        savedOnly: filterViewMode === 'saved',
      };

      const response = await rfqMarketplaceService.getMarketplaceRFQs(token, appliedFilters);
      setRfqs(response.rfqs);
      setStats(response.stats);
      setTotalRFQs(response.pagination.total);
      setLoadingState(response.rfqs.length === 0 ? 'empty' : 'success');
    } catch (error) {
      console.error('Failed to load marketplace RFQs:', error);
      setLoadingState('error');
    }
  }, [getToken, filters, debouncedSearch, filterViewMode]);

  // Initial load and filter changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    loadRFQs();
  }, [loadRFQs]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof MarketplaceFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (value as number),
    }));
  }, []);

  // Clear specific filter
  const clearFilter = useCallback((key: keyof MarketplaceFilters) => {
    setFilters(prev => {
      const updated = { ...prev, page: 1 };
      delete updated[key];
      return updated;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({ sortBy: 'newest', page: 1, limit: 20 });
    setSearchQuery('');
  }, []);

  // Active filters for display
  const activeFilters = useMemo((): ActiveFilter[] => {
    const list: ActiveFilter[] = [];
    if (filters.category) {
      const cat = RFQ_CATEGORIES.find(c => c.value === filters.category);
      list.push({ key: 'category', label: 'Category', value: cat?.label || filters.category });
    }
    if (filters.quantityMin || filters.quantityMax) {
      const min = filters.quantityMin || 0;
      const max = filters.quantityMax;
      list.push({ key: 'quantity', label: 'Quantity', value: max ? `${min}-${max}` : `${min}+` });
    }
    if (filters.deadline && filters.deadline !== 'all') {
      list.push({ key: 'deadline', label: 'Deadline', value: filters.deadline === 'urgent' ? 'Urgent' : 'Expiring Today' });
    }
    if (filters.buyerBadge) {
      list.push({ key: 'buyerBadge', label: 'Buyer', value: filters.buyerBadge === 'enterprise' ? 'Enterprise' : 'Verified' });
    }
    return list;
  }, [filters]);

  // Handle RFQ selection - just update the ID, drawer reads from rfqs array
  const handleSelectRFQ = useCallback((rfq: MarketplaceRFQ) => {
    setSelectedRFQId(rfq.id);
  }, []);

  // Close drawer
  const handleCloseDrawer = useCallback(() => {
    setSelectedRFQId(null);
  }, []);

  // Handle save/unsave - update local state without refetch
  const handleToggleSave = useCallback(async (rfq: MarketplaceRFQ) => {
    try {
      const token = await getToken();
      if (!token) return;

      if (rfq.isSaved) {
        await rfqMarketplaceService.unsaveRFQ(token, rfq.id);
      } else {
        await rfqMarketplaceService.saveRFQ(token, rfq.id);
      }

      // Update local state optimistically
      setRfqs(prev =>
        prev.map(r => (r.id === rfq.id ? { ...r, isSaved: !r.isSaved } : r))
      );
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  }, [getToken]);

  // Handle quote submission
  const handleOpenQuoteModal = useCallback((rfq: MarketplaceRFQ) => {
    setQuoteRFQ(rfq);
    setShowQuoteModal(true);
  }, []);

  const handleQuoteSubmitted = useCallback(() => {
    setShowQuoteModal(false);
    setQuoteRFQ(null);
    loadRFQs();
  }, [loadRFQs]);

  // Sort options
  const sortOptions: { value: MarketplaceSortBy; label: string }[] = useMemo(() => [
    { value: 'newest', label: t('seller.rfqMarketplace.sortNewest') || 'Newest' },
    { value: 'expiring_soon', label: t('seller.rfqMarketplace.sortExpiring') || 'Expiring Soon' },
    { value: 'highest_quantity', label: t('seller.rfqMarketplace.sortQuantity') || 'Highest Quantity' },
    { value: 'best_match', label: t('seller.rfqMarketplace.sortBestMatch') || 'Best Match' },
  ], [t]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#fafafa' }}>
      {/* Page Header - Calm, professional */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: styles.fontHeading }}
            >
              {t('seller.rfqMarketplace.title') || 'RFQ Marketplace'}
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              {t('seller.rfqMarketplace.subtitle') || 'Browse open buyer requests and submit quotes'}
            </p>
          </div>

          {/* Header Actions - Subtle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('rfqs')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <PaperPlaneTilt size={15} />
              My Quotes
            </button>
            <button
              onClick={() => setFilterViewMode(filterViewMode === 'saved' ? 'browse' : 'saved')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors"
              style={{
                backgroundColor: filterViewMode === 'saved' ? '#f3f4f6' : '#fff',
                color: filterViewMode === 'saved' ? '#374151' : '#6b7280',
                border: '1px solid #e5e7eb',
              }}
            >
              <BookmarkSimple size={15} weight={filterViewMode === 'saved' ? 'fill' : 'regular'} />
              Saved
              {stats?.savedCount ? (
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                  {stats.savedCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Stats - Minimal inline */}
        {stats && (
          <div className="flex items-center gap-5 mb-4 text-[13px]">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Open</span>
              <span className="font-medium text-gray-700">{stats.totalOpen}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">New today</span>
              <span className="font-medium text-gray-700">{stats.newToday}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Expiring</span>
              <span className="font-medium text-amber-600">{stats.expiringToday}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Quoted</span>
              <span className="font-medium text-gray-700">{stats.quotedCount}</span>
            </div>
          </div>
        )}

        {/* Filter Bar - Clean */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by part name, SKU, or company..."
              className="w-full pl-9 pr-4 py-2 rounded-md text-[13px] bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-colors"
              style={{
                backgroundColor: activeFilters.length > 0 ? '#f3f4f6' : '#fff',
                color: activeFilters.length > 0 ? '#374151' : '#6b7280',
                border: '1px solid #e5e7eb',
              }}
            >
              <FunnelSimple size={15} />
              Filters
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-medium bg-gray-600 text-white">
                  {activeFilters.length}
                </span>
              )}
              <CaretDown size={12} />
            </button>

            {/* Filter Dropdown Panel */}
            {showFilters && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                <div
                  className="absolute z-50 top-full mt-2 w-72 rounded-lg shadow-lg bg-white border border-gray-200 overflow-hidden"
                  style={{ right: isRtl ? 'auto' : 0, left: isRtl ? 0 : 'auto' }}
                >
                  <div className="p-4 space-y-4">
                    {/* Category */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">Category</label>
                      <select
                        value={filters.category || ''}
                        onChange={e => handleFilterChange('category', e.target.value || undefined)}
                        className="w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-200 text-gray-900"
                      >
                        <option value="">All Categories</option>
                        {RFQ_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">Quantity Range</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.quantityMin || ''}
                          onChange={e => handleFilterChange('quantityMin', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="flex-1 px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-200 text-gray-900"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.quantityMax || ''}
                          onChange={e => handleFilterChange('quantityMax', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="flex-1 px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-200 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Deadline */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">Deadline</label>
                      <select
                        value={filters.deadline || 'all'}
                        onChange={e => handleFilterChange('deadline', e.target.value as DeadlineFilter)}
                        className="w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-200 text-gray-900"
                      >
                        <option value="all">All</option>
                        <option value="urgent">Urgent Only</option>
                        <option value="expiring_today">Expiring Today</option>
                      </select>
                    </div>

                    {/* Buyer Type */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">Buyer Type</label>
                      <select
                        value={filters.buyerBadge || ''}
                        onChange={e => handleFilterChange('buyerBadge', e.target.value as BuyerBadgeType || undefined)}
                        className="w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-200 text-gray-900"
                      >
                        <option value="">All Buyers</option>
                        <option value="verified">Verified</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <button onClick={clearAllFilters} className="text-sm text-gray-500 hover:text-gray-700">
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAscending size={14} className="text-gray-300" />
            <select
              value={filters.sortBy || 'newest'}
              onChange={e => handleFilterChange('sortBy', e.target.value as MarketplaceSortBy)}
              className="px-3 py-2 rounded-md text-[13px] bg-white border border-gray-200 text-gray-600"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={loadRFQs}
            className="p-2 rounded-md bg-white border border-gray-200 text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ArrowsClockwise
              size={15}
              className={loadingState === 'loading' ? 'animate-spin' : ''}
            />
          </button>
        </div>

        {/* Active Filter Chips - Subtle */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {activeFilters.map(filter => (
              <span
                key={filter.key}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-600"
              >
                <span className="font-medium">{filter.label}:</span>
                <span>{filter.value}</span>
                <button
                  onClick={() => clearFilter(filter.key as keyof MarketplaceFilters)}
                  className="ml-0.5 hover:text-gray-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Content - Master-Detail Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* List Panel - Flexible width based on selection */}
        <div
          className="overflow-hidden bg-gray-50 transition-all duration-300 ease-out"
          style={{
            width: selectedRFQ ? 'calc(100% - 440px)' : '100%',
            minWidth: selectedRFQ ? '400px' : undefined,
          }}
        >
          <StableListWrapper
            loadingState={loadingState}
            filterViewMode={filterViewMode}
            rfqs={rfqs}
            selectedRFQId={selectedRFQId}
            onSelectRFQ={handleSelectRFQ}
            onToggleSave={handleToggleSave}
            totalRFQs={totalRFQs}
            page={filters.page || 1}
            onPageChange={page => handleFilterChange('page', page)}
            onRetry={loadRFQs}
          />
        </div>

        {/* Details Panel - Inline, slides in from right */}
        <div
          className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-out"
          style={{
            width: selectedRFQ ? '440px' : '0px',
            opacity: selectedRFQ ? 1 : 0,
            borderLeft: selectedRFQ ? '1px solid #e5e7eb' : 'none',
          }}
        >
          {selectedRFQ ? (
            <RFQMarketplaceDetailsPanel
              rfq={selectedRFQ}
              onClose={handleCloseDrawer}
              onToggleSave={handleToggleSave}
              onSubmitQuote={handleOpenQuoteModal}
            />
          ) : (
            // Empty state placeholder - shown briefly during close animation
            <div className="w-[440px] h-full flex items-center justify-center bg-gray-50">
              <div className="text-center px-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-gray-100">
                  <FileText size={28} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">
                  {t('seller.rfqMarketplace.selectToView') || 'Select an RFQ to view details'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && quoteRFQ && (
        <SubmitMarketplaceQuoteModal
          isOpen={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false);
            setQuoteRFQ(null);
          }}
          rfq={quoteRFQ}
          onSuccess={handleQuoteSubmitted}
        />
      )}
    </div>
  );
};

export default RFQMarketplace;
