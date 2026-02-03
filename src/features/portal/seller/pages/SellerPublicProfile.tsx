import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  CheckCircle,
  ShieldCheck,
  Lightning,
  Package,
  Trophy,
  Star,
  StarHalf,
  Chat,
  Clock,
  Storefront,
  CaretDown,
  SquaresFour,
  List,
  MagnifyingGlass,
  Funnel,
  ShoppingCart,
  ArrowRight,
  FileText,
  X,
  SpinnerGap,
  Warning,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { publicSellerService, PublicSellerProfile, SellerProduct } from '../../services/publicSellerService';
import { Select } from '../../components/ui/Select';
import { RFQFormPanel } from '../../buyer/components/RFQFormPanel';

interface SellerPublicProfileProps {
  slug: string;
  onNavigateToProduct?: (productId: string) => void;
  onRequestRFQ?: (sellerId: string) => void;
}

export const SellerPublicProfile: React.FC<SellerPublicProfileProps> = ({
  slug,
  onNavigateToProduct,
  onRequestRFQ,
}) => {
  const { t, direction, styles } = usePortal();
  const isRtl = direction === 'rtl';

  // State
  const [seller, setSeller] = useState<PublicSellerProfile | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productView, setProductView] = useState<'grid' | 'list'>('grid');
  const [productSort, setProductSort] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showRFQModal, setShowRFQModal] = useState(false);

  // Fetch seller profile
  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await publicSellerService.getProfile(slug);
        setSeller(profile);
      } catch (err: any) {
        setError(err.message || 'Failed to load seller profile');
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [slug]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!seller) return;
      try {
        const response = await publicSellerService.getProducts(slug, {
          page: productPage,
          limit: 12,
          sort: productSort,
        });
        setProducts(response.products);
        setTotalProducts(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchProducts();
  }, [slug, seller, productPage, productSort]);

  // Filter products by search
  const filteredProducts = products.filter((product) => {
    if (!productSearch) return true;
    const searchLower = productSearch.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.nameAr?.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    );
  });

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: styles.bgPrimary }}>
        <div className="flex flex-col items-center gap-4">
          <SpinnerGap size={48} className="animate-spin" style={{ color: styles.info }} />
          <p style={{ color: styles.textMuted }}>{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: styles.bgPrimary }}>
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <Warning size={64} style={{ color: styles.textMuted }} />
          <h2 className="text-xl font-semibold" style={{ color: styles.textPrimary }}>
            {t('seller.public.notFound') || 'Seller Not Found'}
          </h2>
          <p style={{ color: styles.textMuted }}>
            {error || t('seller.public.notFoundDesc') || 'The seller you are looking for does not exist or is no longer available.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto" style={{ backgroundColor: styles.bgPrimary }} dir={direction}>
      {/* Hero Section */}
      <HeroSection seller={seller} styles={styles} isRtl={isRtl} t={t} formatDate={formatDate} />

      {/* Trust Indicators */}
      <TrustIndicators seller={seller} styles={styles} t={t} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - About & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* About Section */}
            <AboutSection seller={seller} styles={styles} t={t} />

            {/* Statistics */}
            <StatisticsSection seller={seller} styles={styles} t={t} />

            {/* RFQ Entry Point */}
            <RFQEntrySection
              seller={seller}
              styles={styles}
              t={t}
              onRequestRFQ={() => {
                if (onRequestRFQ) {
                  onRequestRFQ(seller.id);
                } else {
                  setShowRFQModal(true);
                }
              }}
            />
          </div>

          {/* Right Column - Products */}
          <div className="lg:col-span-2">
            <ProductListings
              products={filteredProducts}
              totalProducts={totalProducts}
              view={productView}
              onViewChange={setProductView}
              sort={productSort}
              onSortChange={setProductSort}
              search={productSearch}
              onSearchChange={setProductSearch}
              page={productPage}
              totalPages={totalPages}
              onPageChange={setProductPage}
              onNavigateToProduct={onNavigateToProduct}
              styles={styles}
              t={t}
              isRtl={isRtl}
            />
          </div>
        </div>
      </div>

      {/* RFQ Form Panel */}
      <RFQFormPanel
        isOpen={showRFQModal}
        onClose={() => setShowRFQModal(false)}
        item={null}
        sellerId={seller.id}
        sellerName={seller.displayName}
        source="profile"
        onSuccess={(rfq) => {
          console.log('RFQ created for seller:', rfq.id);
          setShowRFQModal(false);
        }}
      />
    </div>
  );
};

// =============================================================================
// Hero Section
// =============================================================================
interface HeroSectionProps {
  seller: PublicSellerProfile;
  styles: any;
  isRtl: boolean;
  t: (key: string) => string;
  formatDate: (date: string) => string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ seller, styles, isRtl, t, formatDate }) => {
  const defaultCover = 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=300&fit=crop';

  return (
    <div className="relative">
      {/* Cover with Gradient Overlay */}
      <div
        className="h-48 sm:h-56 bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${seller.coverUrl || defaultCover})`,
        }}
      >
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />

        {/* Content overlaid on cover */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex items-center gap-5">
              {/* Logo */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-xl"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.25)'
                }}
              >
                {seller.logoUrl ? (
                  <img
                    src={seller.logoUrl}
                    alt={seller.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Storefront size={40} style={{ color: 'rgba(255,255,255,0.8)' }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className="text-2xl sm:text-3xl font-bold text-white"
                    style={{ fontFamily: styles.fontHeading, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  >
                    {seller.displayName}
                  </h1>
                  {seller.verified && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 backdrop-blur-sm">
                      <CheckCircle size={14} weight="fill" />
                      <span>{t('seller.public.verified') || 'Verified'}</span>
                    </div>
                  )}
                </div>

                {seller.shortDescription && (
                  <p className="mt-2 text-sm text-white/85 max-w-2xl line-clamp-2">
                    {seller.shortDescription}
                  </p>
                )}

                <div className="flex items-center gap-5 mt-3 flex-wrap text-sm text-white/75">
                  {seller.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={15} />
                      <span>{seller.location.city}, {seller.location.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar size={15} />
                    <span>{t('seller.public.memberSince') || 'Member since'} {formatDate(seller.memberSince)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Trust Indicators
// =============================================================================
interface TrustIndicatorsProps {
  seller: PublicSellerProfile;
  styles: any;
  t: (key: string) => string;
}

const TrustIndicators: React.FC<TrustIndicatorsProps> = ({ seller, styles, t }) => {
  const indicators = [
    {
      icon: ShieldCheck,
      label: t('seller.public.verifiedSeller') || 'Verified Seller',
      value: seller.verified,
      color: '#22c55e',
    },
    {
      icon: FileText,
      label: t('seller.public.vatRegistered') || 'VAT Registered',
      value: seller.vatRegistered,
      color: '#3b82f6',
    },
    {
      icon: Lightning,
      label: t('seller.public.fastResponse') || 'Fast Response',
      value: `${seller.statistics.responseRate}%`,
      sublabel: seller.statistics.responseTime,
      color: '#f59e0b',
    },
    {
      icon: Package,
      label: t('seller.public.ordersFulfilled') || 'Orders Fulfilled',
      value: seller.statistics.totalOrders,
      sublabel: `${seller.statistics.fulfillmentRate}% ${t('seller.public.onTime') || 'on time'}`,
      color: '#8b5cf6',
    },
    {
      icon: Trophy,
      label: t('seller.public.rfqWinRate') || 'RFQ Win Rate',
      value: `${seller.statistics.rfqWinRate}%`,
      color: '#ec4899',
    },
  ];

  return (
    <div style={{ backgroundColor: styles.bgPrimary, borderBottom: `1px solid ${styles.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
          {indicators.map((indicator, index) => {
            const Icon = indicator.icon;
            const displayValue = typeof indicator.value === 'boolean'
              ? (indicator.value ? t('common.yes') || 'Yes' : t('common.no') || 'No')
              : indicator.value;

            return (
              <div
                key={index}
                className="flex items-center gap-3 flex-shrink-0 px-4 py-2 rounded-lg"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${indicator.color}15` }}
                >
                  <Icon size={20} weight="fill" style={{ color: indicator.color }} />
                </div>
                <div>
                  <div className="text-xs" style={{ color: styles.textMuted }}>
                    {indicator.label}
                  </div>
                  <div className="font-semibold" style={{ color: styles.textPrimary }}>
                    {displayValue}
                  </div>
                  {indicator.sublabel && (
                    <div className="text-xs" style={{ color: styles.textMuted }}>
                      {indicator.sublabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// About Section
// =============================================================================
interface AboutSectionProps {
  seller: PublicSellerProfile;
  styles: any;
  t: (key: string) => string;
}

const AboutSection: React.FC<AboutSectionProps> = ({ seller, styles, t }) => {
  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
      >
        {t('seller.public.about') || 'About'}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: styles.textSecondary }}>
        {seller.shortDescription || t('seller.public.noDescription') || 'No description provided.'}
      </p>
    </div>
  );
};

// =============================================================================
// Statistics Section
// =============================================================================
interface StatisticsSectionProps {
  seller: PublicSellerProfile;
  styles: any;
  t: (key: string) => string;
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ seller, styles, t }) => {
  const stats = [
    {
      label: t('seller.public.totalProducts') || 'Total Products',
      value: seller.statistics.totalProducts,
      icon: Package,
    },
    {
      label: t('seller.public.totalOrders') || 'Orders Completed',
      value: seller.statistics.totalOrders,
      icon: ShoppingCart,
    },
    {
      label: t('seller.public.responseRate') || 'Response Rate',
      value: `${seller.statistics.responseRate}%`,
      icon: Chat,
    },
    {
      label: t('seller.public.avgResponseTime') || 'Avg. Response Time',
      value: seller.statistics.responseTime,
      icon: Clock,
    },
  ];

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
      >
        {t('seller.public.statistics') || 'Statistics'}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <Icon size={20} style={{ color: styles.info }} />
              </div>
              <div className="text-xl font-bold" style={{ color: styles.textPrimary }}>
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: styles.textMuted }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// RFQ Entry Section
// =============================================================================
interface RFQEntrySectionProps {
  seller: PublicSellerProfile;
  styles: any;
  t: (key: string) => string;
  onRequestRFQ: () => void;
}

const RFQEntrySection: React.FC<RFQEntrySectionProps> = ({ seller, styles, t, onRequestRFQ }) => {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: styles.info + '10',
        border: `1px solid ${styles.info}30`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: styles.info }}
        >
          <FileText size={24} weight="fill" className="text-white" />
        </div>
        <div className="flex-1">
          <h3
            className="font-semibold mb-1"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            {t('seller.public.needCustomQuote') || 'Need a Custom Quote?'}
          </h3>
          <p className="text-sm mb-4" style={{ color: styles.textSecondary }}>
            {t('seller.public.rfqDescription') || 'Send a Request for Quotation to get personalized pricing for your specific requirements.'}
          </p>
          <button
            onClick={onRequestRFQ}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all"
            style={{ backgroundColor: styles.info, color: '#fff' }}
          >
            <span>{t('seller.public.sendRFQ') || 'Send RFQ'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Product Listings
// =============================================================================
interface ProductListingsProps {
  products: SellerProduct[];
  totalProducts: number;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  sort: string;
  onSortChange: (sort: any) => void;
  search: string;
  onSearchChange: (search: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNavigateToProduct?: (productId: string) => void;
  styles: any;
  t: (key: string) => string;
  isRtl: boolean;
}

const ProductListings: React.FC<ProductListingsProps> = ({
  products,
  totalProducts,
  view,
  onViewChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
  onNavigateToProduct,
  styles,
  t,
  isRtl,
}) => {
  const sortOptions = [
    { value: 'newest', label: t('seller.public.sortNewest') || 'Newest' },
    { value: 'price_low', label: t('seller.public.sortPriceLow') || 'Price: Low to High' },
    { value: 'price_high', label: t('seller.public.sortPriceHigh') || 'Price: High to Low' },
    { value: 'popular', label: t('seller.public.sortPopular') || 'Most Popular' },
  ];

  return (
    <div
      className="rounded-xl"
      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
    >
      {/* Header */}
      <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderColor: styles.border }}>
        <h2
          className="text-lg font-semibold"
          style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
        >
          {t('seller.public.products') || 'Products'} ({totalProducts})
        </h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <MagnifyingGlass
              size={18}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ [isRtl ? 'right' : 'left']: 12, color: styles.textMuted }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('common.search') || 'Search...'}
              className="w-full sm:w-48 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: styles.bgSecondary,
                border: `1px solid ${styles.border}`,
                color: styles.textPrimary,
                [isRtl ? 'paddingRight' : 'paddingLeft']: 40,
                [isRtl ? 'paddingLeft' : 'paddingRight']: 12,
              }}
            />
          </div>

          {/* Sort */}
          <Select
            value={sort}
            onChange={onSortChange}
            options={sortOptions}
            placeholder={t('common.sort') || 'Sort'}
          />

          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: styles.border }}>
            <button
              onClick={() => onViewChange('grid')}
              className="p-2 transition-colors"
              style={{
                backgroundColor: view === 'grid' ? styles.info : styles.bgSecondary,
                color: view === 'grid' ? '#fff' : styles.textMuted,
              }}
            >
              <SquaresFour size={18} />
            </button>
            <button
              onClick={() => onViewChange('list')}
              className="p-2 transition-colors"
              style={{
                backgroundColor: view === 'list' ? styles.info : styles.bgSecondary,
                color: view === 'list' ? '#fff' : styles.textMuted,
              }}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="p-4">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} style={{ color: styles.textMuted }} className="mx-auto mb-4" />
            <p style={{ color: styles.textMuted }}>
              {t('seller.public.noProducts') || 'No products available'}
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onNavigateToProduct?.(product.id)}
                styles={styles}
                t={t}
                isRtl={isRtl}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onClick={() => onNavigateToProduct?.(product.id)}
                styles={styles}
                t={t}
                isRtl={isRtl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex justify-center gap-2" style={{ borderColor: styles.border }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: page === pageNum ? styles.info : styles.bgSecondary,
                color: page === pageNum ? '#fff' : styles.textSecondary,
              }}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Product Card (Grid View)
// =============================================================================
interface ProductCardProps {
  product: SellerProduct;
  onClick?: () => void;
  styles: any;
  t: (key: string) => string;
  isRtl: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, styles, t, isRtl }) => {
  const defaultImage = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop';

  return (
    <div
      onClick={onClick}
      className="rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.border}` }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={product.imageUrl || defaultImage}
          alt={isRtl && product.nameAr ? product.nameAr : product.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <div className="p-3">
        <h3
          className="font-medium text-sm line-clamp-2 mb-1"
          style={{ color: styles.textPrimary }}
        >
          {isRtl && product.nameAr ? product.nameAr : product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="font-bold" style={{ color: styles.info }}>
            {product.currency} {product.price.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: styles.textMuted }}>
            MOQ: {product.moq}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Product List Item (List View)
// =============================================================================
interface ProductListItemProps {
  product: SellerProduct;
  onClick?: () => void;
  styles: any;
  t: (key: string) => string;
  isRtl: boolean;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ product, onClick, styles, t, isRtl }) => {
  const defaultImage = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=100&h=100&fit=crop';

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors"
      style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.border}` }}
    >
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={product.imageUrl || defaultImage}
          alt={isRtl && product.nameAr ? product.nameAr : product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className="font-medium line-clamp-1 mb-1"
          style={{ color: styles.textPrimary }}
        >
          {isRtl && product.nameAr ? product.nameAr : product.name}
        </h3>
        <div className="flex items-center gap-4 text-sm" style={{ color: styles.textMuted }}>
          <span>MOQ: {product.moq}</span>
          <span>{product.stock > 0 ? `${t('common.inStock') || 'In Stock'}` : t('common.outOfStock') || 'Out of Stock'}</span>
          {product.leadTime && <span>{product.leadTime}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-lg" style={{ color: styles.info }}>
          {product.currency} {product.price.toLocaleString()}
        </div>
        <div className="text-xs" style={{ color: styles.textMuted }}>
          / {product.unit}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// RFQ Modal
// =============================================================================
interface RFQModalProps {
  seller: PublicSellerProfile;
  styles: any;
  t: (key: string) => string;
  isRtl: boolean;
  onClose: () => void;
}

const RFQModal: React.FC<RFQModalProps> = ({ seller, styles, t, isRtl, onClose }) => {
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    description: '',
    deliveryDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit RFQ
    console.log('RFQ submitted:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg rounded-xl shadow-xl"
        style={{ backgroundColor: styles.bgCard }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            {t('seller.public.sendRFQTo') || 'Send RFQ to'} {seller.displayName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textSecondary }}>
              {t('seller.public.productName') || 'Product / Item Name'}
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: styles.bgSecondary,
                border: `1px solid ${styles.border}`,
                color: styles.textPrimary,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textSecondary }}>
              {t('seller.public.quantity') || 'Quantity Required'}
            </label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: styles.bgSecondary,
                border: `1px solid ${styles.border}`,
                color: styles.textPrimary,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textSecondary }}>
              {t('seller.public.deliveryDate') || 'Expected Delivery Date'}
            </label>
            <input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: styles.bgSecondary,
                border: `1px solid ${styles.border}`,
                color: styles.textPrimary,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textSecondary }}>
              {t('seller.public.additionalDetails') || 'Additional Details'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{
                backgroundColor: styles.bgSecondary,
                border: `1px solid ${styles.border}`,
                color: styles.textPrimary,
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: styles.bgSecondary,
                color: styles.textSecondary,
                border: `1px solid ${styles.border}`,
              }}
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: styles.info, color: '#fff' }}
            >
              {t('seller.public.submitRFQ') || 'Submit RFQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerPublicProfile;
