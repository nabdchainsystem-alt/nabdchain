import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MagnifyingGlass,
  GridFour,
  List,
  Package,
  Star,
  MapPin,
  Clock,
  ShoppingCart,
  X,
  CaretDown,
  ArrowsDownUp,
  Lightning,
  ShieldCheck,
  Trophy,
  CheckCircle,
  Scales,
  Factory,
} from 'phosphor-react';
import { Container, PageHeader, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { itemService } from '../../services/itemService';
import {
  Item,
  ItemRFQ,
  MarketplaceFilters,
  requiresRFQ,
  getStockAvailability,
  getStockAvailabilityConfig,
  isOutOfStockRFQOnly,
} from '../../types/item.types';
import { RFQFormPanel } from '../components/RFQFormPanel';

// =============================================================================
// Smart Discovery Intelligence Types
// =============================================================================

interface SupplierIntelligence {
  responseSpeed: 'fast' | 'moderate' | 'slow';
  rfqSuccessRate: number;
  verified: boolean;
  highWinRate: boolean;
}

// Mock supplier intelligence data (in production, this comes from backend)
const getSupplierIntelligence = (item: Item): SupplierIntelligence => {
  // Simulate intelligence based on item properties
  const seed = item.id.charCodeAt(0) + (item.totalQuotes || 0);
  return {
    responseSpeed: seed % 3 === 0 ? 'fast' : seed % 3 === 1 ? 'moderate' : 'slow',
    rfqSuccessRate: 60 + (seed % 40),
    verified: seed % 4 !== 0,
    highWinRate: (item.successfulOrders || 0) > 5 || seed % 5 === 0,
  };
};

// Relevance scoring (hidden from user - just affects sort order)
const calculateRelevanceScore = (item: Item): number => {
  const intel = getSupplierIntelligence(item);
  let score = 0;

  // RFQ success rate weight
  score += intel.rfqSuccessRate * 0.4;

  // Response speed weight
  if (intel.responseSpeed === 'fast') score += 30;
  else if (intel.responseSpeed === 'moderate') score += 15;

  // Verified supplier bonus
  if (intel.verified) score += 20;

  // High win rate bonus
  if (intel.highWinRate) score += 15;

  // Stock availability bonus
  if (item.stock > 10) score += 10;
  else if (item.stock > 0) score += 5;

  return score;
};

interface MarketplaceProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

// Categories for filtering
const CATEGORIES = [
  { key: 'all', labelKey: 'all' },
  { key: 'Hydraulics', labelKey: 'hydraulics' },
  { key: 'Bearings', labelKey: 'bearings' },
  { key: 'Compressors', labelKey: 'compressors' },
  { key: 'Motors', labelKey: 'motors' },
  { key: 'Valves', labelKey: 'valves' },
  { key: 'Lubricants', labelKey: 'lubricants' },
  { key: 'Conveyors', labelKey: 'conveyors' },
  { key: 'Automation', labelKey: 'automation' },
];

// Sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export const Marketplace: React.FC<MarketplaceProps> = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<MarketplaceFilters['sortBy']>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreloader, setShowPreloader] = useState(true);
  // Stock filter state
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  // Comparison Assist State
  const [selectedForCompare, setSelectedForCompare] = useState<Item[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  // RFQ Panel State
  const [selectedItemForRFQ, setSelectedItemForRFQ] = useState<Item | null>(null);
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();

  // Toggle item for comparison (max 3)
  const toggleCompareItem = useCallback((item: Item, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedForCompare(prev => {
      const isSelected = prev.some(i => i.id === item.id);
      if (isSelected) {
        return prev.filter(i => i.id !== item.id);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 items
      }
      return [...prev, item];
    });
  }, []);

  const clearComparison = useCallback(() => {
    setSelectedForCompare([]);
    setShowComparePanel(false);
  }, []);

  // Smart sorted items (relevance scoring applied + stock filter)
  const smartSortedItems = useMemo(() => {
    let filtered = items;

    // Apply stock filter if enabled
    if (hideOutOfStock) {
      filtered = filtered.filter((item: Item) => item.stock > 0);
    }

    // Apply relevance scoring for "popular" sort
    if (sortBy === 'popular') {
      return [...filtered].sort((a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a));
    }

    return filtered;
  }, [items, sortBy, hideOutOfStock]);

  // Count out of stock items for display
  const outOfStockCount = useMemo(() => {
    return items.filter((item: Item) => item.stock === 0).length;
  }, [items]);

  // Show preloader for 1.5 seconds on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch items from backend
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const filters: MarketplaceFilters = {
        sortBy,
        ...(activeCategory !== 'all' && { category: activeCategory }),
        ...(searchQuery && { search: searchQuery }),
      };

      const response = await itemService.getMarketplaceItems(token, filters);
      setItems(response.items);
    } catch (err) {
      console.error('Error fetching marketplace items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [getToken, sortBy, activeCategory, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleItemClick = (item: Item) => {
    onNavigate('item-details', { itemId: item.id });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  const isRTL = direction === 'rtl';

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('buyer.marketplace.title')}
          subtitle={t('buyer.marketplace.subtitle')}
        />

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          {/* Search Input */}
          <div
            className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <MagnifyingGlass size={18} style={{ color: styles.textMuted }} />
            <input
              type="text"
              placeholder={t('buyer.marketplace.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent"
              style={{
                color: styles.textPrimary,
                fontFamily: styles.fontBody,
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={16} style={{ color: styles.textMuted }} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors min-w-[180px]"
              style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <ArrowsDownUp size={16} style={{ color: styles.textSecondary }} />
              <span className="text-sm" style={{ color: styles.textSecondary }}>
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              </span>
              <CaretDown size={14} style={{ color: styles.textMuted, marginInlineStart: 'auto' }} />
            </button>
            {showFilters && (
              <div
                className={`absolute top-full mt-1 w-48 rounded-lg border shadow-lg z-10 py-1 ${isRTL ? 'left-0' : 'right-0'}`}
                style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as MarketplaceFilters['sortBy']);
                      setShowFilters(false);
                    }}
                    className="w-full px-4 py-2 text-sm hover:opacity-80 transition-colors"
                    style={{
                      color: sortBy === option.value ? styles.info : styles.textPrimary,
                      backgroundColor: sortBy === option.value ? styles.bgHover : 'transparent',
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stock Filter Toggle */}
          <button
            onClick={() => setHideOutOfStock(!hideOutOfStock)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${hideOutOfStock ? 'ring-1' : ''}`}
            style={{
              borderColor: hideOutOfStock ? styles.success : styles.border,
              backgroundColor: hideOutOfStock ? `${styles.success}15` : styles.bgCard,
              ringColor: styles.success,
            }}
            title={t('buyer.marketplace.hideOutOfStock')}
          >
            <Package size={16} style={{ color: hideOutOfStock ? styles.success : styles.textSecondary }} />
            <span className="text-sm whitespace-nowrap" style={{ color: hideOutOfStock ? styles.success : styles.textSecondary }}>
              {t('buyer.marketplace.inStockOnly')}
            </span>
            {outOfStockCount > 0 && !hideOutOfStock && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
              >
                {outOfStockCount}
              </span>
            )}
          </button>

          {/* View Toggle */}
          <div
            className="flex items-center rounded-lg border overflow-hidden"
            style={{ borderColor: styles.border }}
          >
            <ViewToggle active={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
              <GridFour size={16} />
            </ViewToggle>
            <ViewToggle active={viewMode === 'list'} onClick={() => setViewMode('list')}>
              <List size={16} />
            </ViewToggle>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.key}
              label={cat.key === 'all' ? t('common.all') : cat.key}
              active={activeCategory === cat.key}
              onClick={() => setActiveCategory(cat.key)}
            />
          ))}
        </div>

        {/* Preloader Animation */}
        {showPreloader && (
          <div className="py-8">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden animate-pulse"
                  style={{ backgroundColor: styles.bgCard }}
                >
                  <div className="aspect-square" style={{ backgroundColor: styles.bgSecondary }} />
                  <div className="p-4 space-y-3">
                    <div className="h-4 rounded-full w-3/4" style={{ backgroundColor: styles.bgSecondary }} />
                    <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: styles.bgSecondary }} />
                    <div className="h-5 rounded-full w-2/3" style={{ backgroundColor: styles.bgSecondary }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {!showPreloader && loading && (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: styles.border, borderTopColor: styles.info }}
            />
          </div>
        )}

        {/* Error State */}
        {!showPreloader && error && !loading && (
          <div className="py-12">
            <EmptyState
              icon={Package}
              title={t('common.error')}
              description={error}
              action={
                <button
                  onClick={fetchItems}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  {t('common.retry')}
                </button>
              }
            />
          </div>
        )}

        {/* Empty State */}
        {!showPreloader && !loading && !error && items.length === 0 && (
          <div className="py-12">
            <EmptyState
              icon={Package}
              title={t('buyer.marketplace.noItems')}
              description={t('buyer.marketplace.noItemsDesc')}
            />
          </div>
        )}

        {/* Comparison Panel - Fixed at bottom when items selected */}
        {selectedForCompare.length > 0 && (
          <ComparisonPanel
            items={selectedForCompare}
            onRemove={(item) => toggleCompareItem(item)}
            onClear={clearComparison}
            onCompare={() => setShowComparePanel(true)}
            isRTL={isRTL}
          />
        )}

        {/* Comparison Modal */}
        {showComparePanel && selectedForCompare.length >= 2 && (
          <ComparisonModal
            items={selectedForCompare}
            onClose={() => setShowComparePanel(false)}
            formatPrice={formatPrice}
            isRTL={isRTL}
          />
        )}

        {/* Product Grid */}
        {!showPreloader && !loading && !error && smartSortedItems.length > 0 && viewMode === 'grid' && (
          <div className="grid gap-4 pb-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {smartSortedItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onClick={() => handleItemClick(item)}
                formatPrice={formatPrice}
                isRTL={isRTL}
                isSelectedForCompare={selectedForCompare.some(i => i.id === item.id)}
                onToggleCompare={(e) => toggleCompareItem(item, e)}
                canAddToCompare={selectedForCompare.length < 3}
                onRequestQuote={(e) => {
                  e.stopPropagation();
                  setSelectedItemForRFQ(item);
                }}
              />
            ))}
          </div>
        )}

        {/* Product List/Table */}
        {!showPreloader && !loading && !error && smartSortedItems.length > 0 && viewMode === 'list' && (
          <ProductTable
            items={smartSortedItems}
            onItemClick={handleItemClick}
            formatPrice={formatPrice}
            isRTL={isRTL}
            selectedForCompare={selectedForCompare}
            onToggleCompare={toggleCompareItem}
            canAddToCompare={selectedForCompare.length < 3}
          />
        )}

        {/* Results count */}
        {!showPreloader && !loading && !error && smartSortedItems.length > 0 && (
          <div className="text-center pb-8">
            <span className="text-sm" style={{ color: styles.textMuted }}>
              {t('buyer.marketplace.showing')} {smartSortedItems.length} {t('buyer.marketplace.items')}
            </span>
          </div>
        )}
      </Container>

      {/* RFQ Form Panel */}
      {selectedItemForRFQ && (
        <RFQFormPanel
          isOpen={!!selectedItemForRFQ}
          onClose={() => setSelectedItemForRFQ(null)}
          item={selectedItemForRFQ}
          sellerId={selectedItemForRFQ.userId}
          source="listing"
          defaultQuantity={selectedItemForRFQ.minOrderQty}
          onSuccess={(rfq: ItemRFQ) => {
            console.log('RFQ created from marketplace:', rfq.id);
            setSelectedItemForRFQ(null);
          }}
        />
      )}
    </div>
  );
};

// View Toggle Button
const ViewToggle: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => {
  const { styles } = usePortal();

  return (
    <button
      onClick={onClick}
      className="p-2.5 transition-colors"
      style={{
        backgroundColor: active ? styles.bgActive : styles.bgCard,
        color: active ? styles.textPrimary : styles.textMuted,
      }}
    >
      {children}
    </button>
  );
};

// Category Chip
const CategoryChip: React.FC<{
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  const { styles } = usePortal();

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
      style={{
        backgroundColor: active ? (styles.isDark ? '#E6E8EB' : '#0F1115') : styles.bgCard,
        color: active ? (styles.isDark ? '#0F1115' : '#E6E8EB') : styles.textSecondary,
        border: active ? 'none' : `1px solid ${styles.border}`,
      }}
    >
      {label}
    </button>
  );
};

// Product Table Component for List View
interface ProductTableProps {
  items: Item[];
  onItemClick: (item: Item) => void;
  formatPrice: (price: number, currency: string) => string;
  isRTL: boolean;
  selectedForCompare?: Item[];
  onToggleCompare?: (item: Item, e?: React.MouseEvent) => void;
  canAddToCompare?: boolean;
}

const ProductTable: React.FC<ProductTableProps> = ({
  items,
  onItemClick,
  formatPrice,
  isRTL,
  selectedForCompare = [],
  onToggleCompare,
  canAddToCompare = true,
}) => {
  const { styles, language, t } = usePortal();

  return (
    <div
      className="rounded-lg border overflow-hidden mb-8"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: styles.bgSecondary }}>
              {/* Compare Checkbox Header */}
              {onToggleCompare && (
                <th className="px-2 py-3 w-10">
                  <Scales size={14} style={{ color: styles.textMuted }} />
                </th>
              )}
              <th
                className="px-4 py-3 text-xs font-medium"
                style={{ color: styles.textMuted, textAlign: isRTL ? 'right' : 'left' }}
              >
                {t('buyer.marketplace.product') || 'Product'}
              </th>
              <th
                className="px-4 py-3 text-xs font-medium text-center"
                style={{ color: styles.textMuted }}
              >
                {t('buyer.marketplace.price') || 'Price'}
              </th>
              <th
                className="px-4 py-3 text-xs font-medium text-center"
                style={{ color: styles.textMuted }}
              >
                MOQ
              </th>
              <th
                className="px-4 py-3 text-xs font-medium text-center"
                style={{ color: styles.textMuted }}
              >
                {t('buyer.marketplace.stock') || 'Stock'}
              </th>
              <th
                className="px-4 py-3 text-xs font-medium text-center"
                style={{ color: styles.textMuted }}
              >
                {t('buyer.marketplace.leadTime') || 'Lead Time'}
              </th>
              <th
                className="px-4 py-3 text-xs font-medium"
                style={{ color: styles.textMuted, textAlign: isRTL ? 'right' : 'left' }}
              >
                {t('buyer.marketplace.location') || 'Location'}
              </th>
              <th
                className="px-4 py-3 text-xs font-medium text-center"
                style={{ color: styles.textMuted }}
              >
                {t('buyer.marketplace.rating') || 'Rating'}
              </th>
              <th
                className="px-4 py-3 text-xs font-medium text-center"
                style={{ color: styles.textMuted }}
              >
                {t('common.actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const isRfqOnly = requiresRFQ(item);
              const displayName = language === 'ar' && item.nameAr ? item.nameAr : item.name;
              const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
              const firstImage = images?.[0];
              // Mock rating for demo
              const rating = 4.2 + (index % 8) * 0.1;
              const intel = getSupplierIntelligence(item);
              const isSelected = selectedForCompare.some(i => i.id === item.id);

              return (
                <tr
                  key={item.id}
                  className={`border-t cursor-pointer transition-colors hover:opacity-90 ${isSelected ? 'ring-1 ring-inset' : ''}`}
                  style={{ borderColor: styles.border, ...(isSelected && { ringColor: styles.info }) }}
                  onClick={() => onItemClick(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Compare Checkbox */}
                  {onToggleCompare && (
                    <td className="px-2 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompare(item, e);
                        }}
                        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                        style={{
                          borderColor: isSelected ? styles.info : styles.border,
                          backgroundColor: isSelected ? styles.info : 'transparent',
                          opacity: isSelected || canAddToCompare ? 1 : 0.5,
                        }}
                        disabled={!canAddToCompare && !isSelected}
                      >
                        {isSelected && (
                          <Scales size={10} weight="bold" style={{ color: '#fff' }} />
                        )}
                      </button>
                    </td>
                  )}
                  {/* Product - Left aligned with image */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: styles.bgSecondary }}
                      >
                        {firstImage ? (
                          <img src={firstImage} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} style={{ color: styles.textMuted }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-medium line-clamp-1"
                            style={{ color: styles.textPrimary }}
                          >
                            {displayName}
                          </p>
                          <TrustBadges intel={intel} compact />
                        </div>
                        <p className="text-xs" style={{ color: styles.textMuted }}>
                          {item.sku}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Price - Center aligned */}
                  <td className="px-4 py-3 text-center">
                    {isRfqOnly ? (
                      <span
                        className="text-xs font-medium px-2 py-1 rounded"
                        style={{ backgroundColor: styles.bgSecondary, color: styles.info }}
                      >
                        RFQ
                      </span>
                    ) : (
                      <span className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                        {formatPrice(item.price, item.currency)}
                      </span>
                    )}
                  </td>

                  {/* MOQ - Center aligned */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm" style={{ color: styles.textSecondary }}>
                      {item.minOrderQty || 1}
                    </span>
                  </td>

                  {/* Stock - Center aligned with Supply Badge */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <SupplyBadge item={item} />
                    </div>
                  </td>

                  {/* Lead Time - Center aligned */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm" style={{ color: styles.textSecondary }}>
                      {item.leadTimeDays ? `${item.leadTimeDays}d` : '-'}
                    </span>
                  </td>

                  {/* Location - Left aligned */}
                  <td
                    className="px-4 py-3"
                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                  >
                    <span className="text-sm flex items-center gap-1" style={{ color: styles.textSecondary }}>
                      <MapPin size={12} />
                      {item.origin || '-'}
                    </span>
                  </td>

                  {/* Rating - Center aligned */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={12} weight="fill" style={{ color: '#f59e0b' }} />
                      <span className="text-sm" style={{ color: styles.textSecondary }}>
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </td>

                  {/* Actions - Center aligned */}
                  <td className="px-4 py-3 text-center">
                    <button
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: styles.info, color: '#fff' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                    >
                      <ShoppingCart size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =============================================================================
// Trust Badges Component (Subtle indicators)
// =============================================================================
interface TrustBadgesProps {
  intel: SupplierIntelligence;
  compact?: boolean;
}

const TrustBadges: React.FC<TrustBadgesProps> = ({ intel, compact = false }) => {
  const { styles, t } = usePortal();

  const badges = [];

  if (intel.responseSpeed === 'fast') {
    badges.push({
      icon: Lightning,
      label: 'Fast Responder',
      tooltip: 'Typically responds within 4 hours',
      color: '#f59e0b',
    });
  }

  if (intel.verified) {
    badges.push({
      icon: ShieldCheck,
      label: 'Verified',
      tooltip: 'Verified supplier with confirmed credentials',
      color: styles.success,
    });
  }

  if (intel.highWinRate) {
    badges.push({
      icon: Trophy,
      label: 'High Win Rate',
      tooltip: 'High RFQ conversion rate',
      color: '#8b5cf6',
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${compact ? '' : 'flex-wrap'}`}>
      {badges.slice(0, compact ? 2 : 3).map((badge, idx) => {
        const Icon = badge.icon;
        return (
          <div
            key={idx}
            className="relative group"
          >
            <div
              className={`flex items-center gap-0.5 ${compact ? 'p-0.5' : 'px-1.5 py-0.5'} rounded`}
              style={{ backgroundColor: `${badge.color}15` }}
            >
              <Icon size={compact ? 10 : 12} weight="fill" style={{ color: badge.color }} />
              {!compact && (
                <span className="text-[9px] font-medium" style={{ color: badge.color }}>
                  {badge.label}
                </span>
              )}
            </div>
            {/* Tooltip */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
              style={{ backgroundColor: styles.textPrimary, color: styles.bgPrimary }}
            >
              {badge.tooltip}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// Supply Status Badge Component
// =============================================================================
interface SupplyBadgeProps {
  item: Item;
  compact?: boolean;
}

const SupplyBadge: React.FC<SupplyBadgeProps> = ({ item, compact = false }) => {
  const { styles, t } = usePortal();
  const stockStatus = getStockAvailability(item);
  const stockConfig = getStockAvailabilityConfig(stockStatus);
  const isOutOfStock = isOutOfStockRFQOnly(item);

  // Color mapping
  const colorMap = {
    success: { color: styles.success, bg: 'rgba(34, 197, 94, 0.1)' },
    warning: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    error: { color: styles.error, bg: 'rgba(239, 68, 68, 0.1)' },
    info: { color: styles.info, bg: 'rgba(59, 130, 246, 0.1)' },
  };

  const iconMap = {
    in_stock: CheckCircle,
    low_stock: Clock,
    out_of_stock: Package,
    made_to_order: Factory,
  };

  const c = colorMap[stockConfig.color];
  const Icon = iconMap[stockStatus];

  // Get localized label or fallback to config label
  const label = t(stockConfig.labelKey) || stockConfig.label;

  return (
    <div
      className={`flex items-center gap-1 ${compact ? 'px-1 py-0.5' : 'px-1.5 py-0.5'} rounded`}
      style={{ backgroundColor: c.bg }}
      title={isOutOfStock ? t('buyer.marketplace.rfqAllowed') || 'RFQ Allowed' : label}
    >
      <Icon size={compact ? 10 : 12} weight="fill" style={{ color: c.color }} />
      {!compact && (
        <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: c.color }}>
          {label}
        </span>
      )}
    </div>
  );
};

// Product Card Component for Grid View
interface ProductCardProps {
  item: Item;
  viewMode: 'grid' | 'list';
  onClick: () => void;
  formatPrice: (price: number, currency: string) => string;
  isRTL: boolean;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (e: React.MouseEvent) => void;
  canAddToCompare?: boolean;
  onRequestQuote?: (e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onClick,
  formatPrice,
  isRTL,
  isSelectedForCompare = false,
  onToggleCompare,
  canAddToCompare = true,
  onRequestQuote,
}) => {
  const { styles, language, t } = usePortal();
  const isRfqOnly = requiresRFQ(item);
  const displayName = language === 'ar' && item.nameAr ? item.nameAr : item.name;
  const intel = getSupplierIntelligence(item);

  // Parse images if needed
  const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
  const firstImage = images?.[0];

  // Grid view - reduced size by 25%
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border overflow-hidden transition-all cursor-pointer group relative ${isSelectedForCompare ? 'ring-2' : ''}`}
      style={{
        borderColor: isSelectedForCompare ? styles.info : styles.border,
        backgroundColor: styles.bgCard,
        ringColor: styles.info,
      }}
      onMouseEnter={(e) => {
        if (!isSelectedForCompare) {
          e.currentTarget.style.borderColor = styles.textMuted;
        }
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        if (!isSelectedForCompare) {
          e.currentTarget.style.borderColor = styles.border;
        }
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Compare Checkbox */}
      {onToggleCompare && (
        <button
          onClick={onToggleCompare}
          className={`absolute top-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isRTL ? 'right-2' : 'left-2'}`}
          style={{
            borderColor: isSelectedForCompare ? styles.info : styles.border,
            backgroundColor: isSelectedForCompare ? styles.info : styles.bgCard,
            opacity: isSelectedForCompare || canAddToCompare ? 1 : 0.5,
          }}
          disabled={!canAddToCompare && !isSelectedForCompare}
          title={isSelectedForCompare ? 'Remove from comparison' : 'Add to comparison'}
        >
          {isSelectedForCompare && (
            <Scales size={12} weight="bold" style={{ color: '#fff' }} />
          )}
        </button>
      )}

      {/* Image - reduced by 25% using aspect-[4/3] instead of aspect-square */}
      <div
        className="aspect-[4/3] relative flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: styles.bgSecondary }}
      >
        {firstImage ? (
          <img src={firstImage} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <Package size={36} style={{ color: styles.textMuted }} />
        )}

        {/* RFQ Badge */}
        {isRfqOnly && (
          <div
            className={`absolute top-2 px-2 py-0.5 rounded text-xs font-medium ${isRTL ? 'left-2' : 'right-2'}`}
            style={{ backgroundColor: styles.info, color: '#fff' }}
          >
            RFQ
          </div>
        )}

        {/* Quick Action */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            style={{ backgroundColor: '#fff', color: '#000' }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <ShoppingCart size={14} />
            View
          </button>
        </div>
      </div>

      {/* Content - reduced padding */}
      <div className="p-3">
        {/* Trust Badges Row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px]" style={{ color: styles.textMuted }}>
            {item.category}
          </span>
          <TrustBadges intel={intel} compact />
        </div>

        {/* Name */}
        <h3
          className="font-medium text-xs mt-0.5 line-clamp-2 min-h-[2rem]"
          style={{ color: styles.textPrimary }}
        >
          {displayName}
        </h3>

        {/* Manufacturer */}
        {item.manufacturer && (
          <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: styles.textMuted }}>
            {item.manufacturer}
          </p>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center justify-between">
          {isRfqOnly ? (
            <button
              onClick={onRequestQuote}
              className="text-xs font-medium hover:underline transition-colors"
              style={{ color: styles.info }}
            >
              Request Quote
            </button>
          ) : (
            <span className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
              {formatPrice(item.price, item.currency)}
            </span>
          )}

          {/* Supply Status Badge */}
          <SupplyBadge item={item} compact />
        </div>

        {/* Meta */}
        <div className="mt-1.5 flex items-center gap-2 text-[10px]" style={{ color: styles.textMuted }}>
          {item.origin && (
            <span className="flex items-center gap-0.5">
              <MapPin size={8} />
              {item.origin}
            </span>
          )}
          {item.leadTimeDays && (
            <span className="flex items-center gap-0.5">
              <Clock size={8} />
              {item.leadTimeDays}d
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Comparison Panel (Fixed at bottom when items selected)
// =============================================================================
interface ComparisonPanelProps {
  items: Item[];
  onRemove: (item: Item) => void;
  onClear: () => void;
  onCompare: () => void;
  isRTL: boolean;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  items,
  onRemove,
  onClear,
  onCompare,
  isRTL,
}) => {
  const { styles, t, language } = usePortal();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Selected Items */}
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Scales size={20} style={{ color: styles.info }} />
            <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {items.length}/3 selected
            </span>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {items.map(item => {
                const displayName = language === 'ar' && item.nameAr ? item.nameAr : item.name;
                const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                const firstImage = images?.[0];
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg border"
                    style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: styles.bgHover }}
                    >
                      {firstImage ? (
                        <img src={firstImage} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={12} style={{ color: styles.textMuted }} />
                      )}
                    </div>
                    <span className="text-xs max-w-[100px] truncate" style={{ color: styles.textSecondary }}>
                      {displayName}
                    </span>
                    <button
                      onClick={() => onRemove(item)}
                      className="p-0.5 rounded hover:bg-opacity-80"
                      style={{ color: styles.textMuted }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: styles.textMuted }}
            >
              Clear
            </button>
            <button
              onClick={onCompare}
              disabled={items.length < 2}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: styles.info, color: '#fff' }}
            >
              <Scales size={14} />
              Compare ({items.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Comparison Modal
// =============================================================================
interface ComparisonModalProps {
  items: Item[];
  onClose: () => void;
  formatPrice: (price: number, currency: string) => string;
  isRTL: boolean;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({
  items,
  onClose,
  formatPrice,
  isRTL,
}) => {
  const { styles, t, language } = usePortal();

  // Comparison attributes
  const attributes = [
    { key: 'price', label: 'Price' },
    { key: 'leadTime', label: 'Lead Time' },
    { key: 'stock', label: 'Availability' },
    { key: 'moq', label: 'Min. Order' },
    { key: 'responseSpeed', label: 'Response Speed' },
    { key: 'reliability', label: 'Reliability' },
  ];

  const getValue = (item: Item, key: string) => {
    const intel = getSupplierIntelligence(item);
    switch (key) {
      case 'price':
        return requiresRFQ(item) ? 'RFQ Required' : formatPrice(item.price, item.currency);
      case 'leadTime':
        return item.leadTimeDays ? `${item.leadTimeDays} days` : 'Contact';
      case 'stock':
        return getStockAvailabilityConfig(getStockAvailability(item)).label;
      case 'moq':
        return `${item.minOrderQty} units`;
      case 'responseSpeed':
        return intel.responseSpeed === 'fast' ? 'Fast' : intel.responseSpeed === 'moderate' ? 'Moderate' : 'Standard';
      case 'reliability':
        return `${intel.rfqSuccessRate}%`;
      default:
        return '-';
    }
  };

  const getBestValue = (key: string): string | null => {
    if (key === 'price') {
      const priced = items.filter(i => !requiresRFQ(i));
      if (priced.length === 0) return null;
      const lowest = priced.reduce((a, b) => a.price < b.price ? a : b);
      return lowest.id;
    }
    if (key === 'leadTime') {
      const withLead = items.filter(i => i.leadTimeDays);
      if (withLead.length === 0) return null;
      const fastest = withLead.reduce((a, b) => (a.leadTimeDays || 999) < (b.leadTimeDays || 999) ? a : b);
      return fastest.id;
    }
    if (key === 'stock') {
      const inStock = items.filter(i => i.stock > 10);
      if (inStock.length > 0) return inStock[0].id;
      return null;
    }
    if (key === 'reliability') {
      const best = items.reduce((a, b) =>
        getSupplierIntelligence(a).rfqSuccessRate > getSupplierIntelligence(b).rfqSuccessRate ? a : b
      );
      return best.id;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-4xl max-h-[80vh] overflow-auto rounded-xl border shadow-xl"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between p-4 border-b"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <div className="flex items-center gap-2">
            <Scales size={20} style={{ color: styles.info }} />
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
              Compare Products
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-3 text-left" style={{ color: styles.textMuted, width: '20%' }}></th>
                {items.map(item => {
                  const displayName = language === 'ar' && item.nameAr ? item.nameAr : item.name;
                  const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                  const firstImage = images?.[0];
                  const intel = getSupplierIntelligence(item);
                  return (
                    <th
                      key={item.id}
                      className="p-3 text-center"
                      style={{ width: `${80 / items.length}%` }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: styles.bgSecondary }}
                        >
                          {firstImage ? (
                            <img src={firstImage} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={24} style={{ color: styles.textMuted }} />
                          )}
                        </div>
                        <span className="text-sm font-medium text-center line-clamp-2" style={{ color: styles.textPrimary }}>
                          {displayName}
                        </span>
                        <TrustBadges intel={intel} />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, idx) => {
                const bestId = getBestValue(attr.key);
                return (
                  <tr
                    key={attr.key}
                    style={{ backgroundColor: idx % 2 === 0 ? styles.bgSecondary : 'transparent' }}
                  >
                    <td className="p-3 text-sm font-medium" style={{ color: styles.textSecondary }}>
                      {attr.label}
                    </td>
                    {items.map(item => {
                      const isBest = bestId === item.id;
                      return (
                        <td key={item.id} className="p-3 text-center">
                          <span
                            className={`text-sm ${isBest ? 'font-semibold' : ''}`}
                            style={{ color: isBest ? styles.success : styles.textPrimary }}
                          >
                            {getValue(item, attr.key)}
                            {isBest && ' ✓'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: styles.border, color: styles.textSecondary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
