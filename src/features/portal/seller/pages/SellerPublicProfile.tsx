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
  Storefront,
  CaretRight,
  Heart,
  EnvelopeSimple,
  FileText,
  SpinnerGap,
  Warning,
  Buildings,
  Globe,
  Handshake,
  TrendUp,
  Percent,
  Timer,
  Scales,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { publicSellerService, PublicSellerProfile, SellerProduct } from '../../services/publicSellerService';
import { RFQFormPanel } from '../../buyer/components/RFQFormPanel';

interface SellerPublicProfileProps {
  slug: string;
  onNavigateToProduct?: (productId: string) => void;
  onNavigateToProducts?: (sellerId: string) => void;
  onRequestRFQ?: (sellerId: string) => void;
}

export const SellerPublicProfile: React.FC<SellerPublicProfileProps> = ({
  slug,
  onNavigateToProduct,
  onNavigateToProducts,
  onRequestRFQ,
}) => {
  const { t, direction, styles } = usePortal();
  const isRtl = direction === 'rtl';

  // State
  const [seller, setSeller] = useState<PublicSellerProfile | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Fetch seller profile
  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await publicSellerService.getProfile(slug);
        setSeller(profile);
        setIsSaved(profile.isSaved || false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load seller profile';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [slug]);

  // Fetch top 6 products for preview
  useEffect(() => {
    const fetchProducts = async () => {
      if (!seller) return;
      try {
        const response = await publicSellerService.getProducts(slug, {
          page: 1,
          limit: 6,
          sort: 'popular',
        });
        setProducts(response.products);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchProducts();
  }, [slug, seller]);

  // Calculate years active from memberSince
  const getYearsActive = () => {
    if (seller?.yearsActive) return seller.yearsActive;
    if (!seller?.memberSince) return 0;
    const since = new Date(seller.memberSince);
    const now = new Date();
    return Math.floor((now.getTime() - since.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  // Handle save seller
  const handleSaveSeller = async () => {
    if (!seller) return;
    try {
      const result = await publicSellerService.toggleSaveSeller(seller.id);
      setIsSaved(result.saved);
    } catch (err) {
      console.error('Failed to save seller:', err);
    }
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
      {/* Seller Header - Clean, Centered */}
      <SellerHeader
        seller={seller}
        styles={styles}
        isRtl={isRtl}
        t={t}
      />

      {/* Trust Signals Row */}
      <TrustSignalsRow
        seller={seller}
        styles={styles}
        t={t}
      />

      {/* Main Content - Max Width Centered */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seller Overview */}
        <SellerOverview
          seller={seller}
          yearsActive={getYearsActive()}
          styles={styles}
          t={t}
          isRtl={isRtl}
        />

        {/* Performance Snapshot */}
        <PerformanceSnapshot
          seller={seller}
          styles={styles}
          t={t}
        />

        {/* Listings Preview */}
        <ListingsPreview
          products={products}
          seller={seller}
          onNavigateToProduct={onNavigateToProduct}
          onNavigateToProducts={onNavigateToProducts}
          styles={styles}
          t={t}
          isRtl={isRtl}
        />

        {/* Buyer Actions */}
        <BuyerActions
          seller={seller}
          isSaved={isSaved}
          onRequestRFQ={() => {
            if (onRequestRFQ) {
              onRequestRFQ(seller.id);
            } else {
              setShowRFQModal(true);
            }
          }}
          onContactSeller={() => setShowContactModal(true)}
          onSaveSeller={handleSaveSeller}
          styles={styles}
          t={t}
        />
      </div>

      {/* RFQ Form Panel */}
      <RFQFormPanel
        isOpen={showRFQModal}
        onClose={() => setShowRFQModal(false)}
        item={null}
        sellerId={seller.id}
        sellerName={seller.displayName}
        source="profile"
        onSuccess={() => {
          setShowRFQModal(false);
        }}
      />

      {/* Contact Modal */}
      {showContactModal && (
        <ContactSellerModal
          seller={seller}
          onClose={() => setShowContactModal(false)}
          styles={styles}
          t={t}
          isRtl={isRtl}
        />
      )}
    </div>
  );
};

// =============================================================================
// Seller Header - Clean, Centered
// =============================================================================
interface SellerHeaderProps {
  seller: PublicSellerProfile;
  styles: Record<string, unknown>;
  isRtl: boolean;
  t: (key: string) => string;
}

const SellerHeader: React.FC<SellerHeaderProps> = ({ seller, styles, isRtl, t }) => {
  const badges = [];

  if (seller.verified) {
    badges.push({
      icon: ShieldCheck,
      label: t('seller.public.verified') || 'Verified',
      color: '#22c55e',
      bgColor: '#22c55e15',
    });
  }

  if (seller.topSeller) {
    badges.push({
      icon: Trophy,
      label: t('seller.public.topSeller') || 'Top Seller',
      color: '#f59e0b',
      bgColor: '#f59e0b15',
    });
  }

  if (seller.fastResponder) {
    badges.push({
      icon: Lightning,
      label: t('seller.public.fastResponse') || 'Fast Response',
      color: '#3b82f6',
      bgColor: '#3b82f615',
    });
  }

  return (
    <div
      className="py-10 text-center"
      style={{
        backgroundColor: styles.bgSecondary as string,
        borderBottom: `1px solid ${styles.border}`,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div
          className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-lg mb-5"
          style={{
            backgroundColor: styles.bgCard as string,
            border: `2px solid ${styles.border}`,
          }}
        >
          {seller.logoUrl ? (
            <img
              src={seller.logoUrl}
              alt={seller.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: styles.bgSecondary as string }}
            >
              <Storefront size={40} style={{ color: styles.textMuted as string }} />
            </div>
          )}
        </div>

        {/* Seller Name */}
        <h1
          className="text-2xl sm:text-3xl font-bold mb-3"
          style={{
            color: styles.textPrimary as string,
            fontFamily: styles.fontHeading as string,
          }}
        >
          {seller.displayName}
        </h1>

        {/* Verification Badges */}
        {badges.length > 0 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            {badges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ backgroundColor: badge.bgColor, color: badge.color }}
                >
                  <Icon size={16} weight="fill" />
                  {badge.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Tagline */}
        {(seller.tagline || seller.shortDescription) && (
          <p
            className="text-base max-w-xl mx-auto line-clamp-1"
            style={{ color: styles.textSecondary as string }}
          >
            {seller.tagline || seller.shortDescription}
          </p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Trust Signals Row
// =============================================================================
interface TrustSignalsRowProps {
  seller: PublicSellerProfile;
  styles: Record<string, unknown>;
  t: (key: string) => string;
}

const TrustSignalsRow: React.FC<TrustSignalsRowProps> = ({ seller, styles, t }) => {
  const signals = [
    {
      icon: Percent,
      label: t('seller.public.responseRate') || 'Response Rate',
      value: `${seller.statistics.responseRate}%`,
      color: '#22c55e',
    },
    {
      icon: Timer,
      label: t('seller.public.avgResponseTime') || 'Avg Response Time',
      value: seller.statistics.responseTime,
      color: '#3b82f6',
    },
    {
      icon: Package,
      label: t('seller.public.fulfillmentRate') || 'Order Fulfillment',
      value: `${seller.statistics.fulfillmentRate}%`,
      color: '#8b5cf6',
    },
    {
      icon: Scales,
      label: t('seller.public.disputeRate') || 'Dispute Rate',
      value: `${seller.statistics.disputeRate ?? 0}%`,
      color: seller.statistics.disputeRate && seller.statistics.disputeRate > 5 ? '#ef4444' : '#22c55e',
    },
  ];

  return (
    <div
      className="py-4"
      style={{
        backgroundColor: styles.bgPrimary as string,
        borderBottom: `1px solid ${styles.border}`,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {signals.map((signal, index) => {
            const Icon = signal.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: styles.bgSecondary as string }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${signal.color}15` }}
                >
                  <Icon size={20} weight="fill" style={{ color: signal.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs truncate" style={{ color: styles.textMuted as string }}>
                    {signal.label}
                  </div>
                  <div className="font-semibold" style={{ color: styles.textPrimary as string }}>
                    {signal.value}
                  </div>
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
// Seller Overview Section
// =============================================================================
interface SellerOverviewProps {
  seller: PublicSellerProfile;
  yearsActive: number;
  styles: Record<string, unknown>;
  t: (key: string) => string;
  isRtl: boolean;
}

const SellerOverview: React.FC<SellerOverviewProps> = ({ seller, yearsActive, styles, t, isRtl }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div
      className="rounded-xl p-6 mb-6"
      style={{
        backgroundColor: styles.bgCard as string,
        border: `1px solid ${styles.border}`,
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          color: styles.textPrimary as string,
          fontFamily: styles.fontHeading as string,
        }}
      >
        {t('seller.public.aboutSeller') || 'About the Seller'}
      </h2>

      {/* About paragraph */}
      <p
        className="text-sm leading-relaxed mb-6"
        style={{ color: styles.textSecondary as string }}
      >
        {seller.shortDescription || t('seller.public.noDescription') || 'No description provided.'}
      </p>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Years Active */}
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: styles.bgSecondary as string }}
          >
            <Calendar size={18} style={{ color: styles.info as string }} />
          </div>
          <div>
            <div className="text-xs" style={{ color: styles.textMuted as string }}>
              {t('seller.public.yearsActive') || 'Years Active'}
            </div>
            <div className="font-medium" style={{ color: styles.textPrimary as string }}>
              {yearsActive > 0 ? `${yearsActive} ${t('common.years') || 'years'}` : t('seller.public.newSeller') || 'New Seller'}
            </div>
          </div>
        </div>

        {/* Location */}
        {seller.location && (
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: styles.bgSecondary as string }}
            >
              <MapPin size={18} style={{ color: styles.info as string }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: styles.textMuted as string }}>
                {t('seller.public.location') || 'Location'}
              </div>
              <div className="font-medium" style={{ color: styles.textPrimary as string }}>
                {seller.location.city}, {seller.location.country}
              </div>
            </div>
          </div>
        )}

        {/* Coverage */}
        {seller.location?.coverage && seller.location.coverage.length > 0 && (
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: styles.bgSecondary as string }}
            >
              <Globe size={18} style={{ color: styles.info as string }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: styles.textMuted as string }}>
                {t('seller.public.coverage') || 'Coverage'}
              </div>
              <div className="font-medium truncate" style={{ color: styles.textPrimary as string }}>
                {seller.location.coverage.slice(0, 2).join(', ')}
                {seller.location.coverage.length > 2 && ` +${seller.location.coverage.length - 2}`}
              </div>
            </div>
          </div>
        )}

        {/* Industries */}
        {seller.industriesServed && seller.industriesServed.length > 0 && (
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: styles.bgSecondary as string }}
            >
              <Buildings size={18} style={{ color: styles.info as string }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: styles.textMuted as string }}>
                {t('seller.public.industries') || 'Industries'}
              </div>
              <div className="font-medium truncate" style={{ color: styles.textPrimary as string }}>
                {seller.industriesServed.slice(0, 2).join(', ')}
                {seller.industriesServed.length > 2 && ` +${seller.industriesServed.length - 2}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Performance Snapshot
// =============================================================================
interface PerformanceSnapshotProps {
  seller: PublicSellerProfile;
  styles: Record<string, unknown>;
  t: (key: string) => string;
}

const PerformanceSnapshot: React.FC<PerformanceSnapshotProps> = ({ seller, styles, t }) => {
  const metrics = [
    {
      label: t('seller.public.ordersCompleted') || 'Orders Completed',
      value: seller.statistics.totalOrders.toLocaleString(),
      icon: Handshake,
      color: '#22c55e',
    },
    {
      label: t('seller.public.activeListings') || 'Active Listings',
      value: (seller.statistics.activeListings ?? seller.statistics.totalProducts).toLocaleString(),
      icon: Package,
      color: '#3b82f6',
    },
    {
      label: t('seller.public.onTimeDelivery') || 'On-Time Delivery',
      value: `${seller.statistics.onTimeDeliveryRate ?? seller.statistics.fulfillmentRate}%`,
      icon: TrendUp,
      color: '#8b5cf6',
    },
  ];

  // Add rating if exists
  if (seller.rating && seller.rating.count > 0) {
    metrics.push({
      label: t('seller.public.rating') || 'Rating',
      value: `${seller.rating.average.toFixed(1)} (${seller.rating.count})`,
      icon: Star,
      color: '#f59e0b',
    });
  }

  return (
    <div
      className="rounded-xl p-6 mb-6"
      style={{
        backgroundColor: styles.bgCard as string,
        border: `1px solid ${styles.border}`,
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          color: styles.textPrimary as string,
          fontFamily: styles.fontHeading as string,
        }}
      >
        {t('seller.public.performance') || 'Performance Snapshot'}
      </h2>

      <div className={`grid gap-4 ${seller.rating && seller.rating.count > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="text-center p-4 rounded-lg"
              style={{ backgroundColor: styles.bgSecondary as string }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${metric.color}15` }}
              >
                <Icon size={24} weight="fill" style={{ color: metric.color }} />
              </div>
              <div
                className="text-xl font-bold mb-1"
                style={{ color: styles.textPrimary as string }}
              >
                {metric.value}
              </div>
              <div className="text-xs" style={{ color: styles.textMuted as string }}>
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Listings Preview - Top 6 Products
// =============================================================================
interface ListingsPreviewProps {
  products: SellerProduct[];
  seller: PublicSellerProfile;
  onNavigateToProduct?: (productId: string) => void;
  onNavigateToProducts?: (sellerId: string) => void;
  styles: Record<string, unknown>;
  t: (key: string) => string;
  isRtl: boolean;
}

const ListingsPreview: React.FC<ListingsPreviewProps> = ({
  products,
  seller,
  onNavigateToProduct,
  onNavigateToProducts,
  styles,
  t,
  isRtl,
}) => {
  const defaultImage = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop';

  if (products.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-6 mb-6"
      style={{
        backgroundColor: styles.bgCard as string,
        border: `1px solid ${styles.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-semibold"
          style={{
            color: styles.textPrimary as string,
            fontFamily: styles.fontHeading as string,
          }}
        >
          {t('seller.public.topProducts') || 'Top Products'}
        </h2>
        {seller.statistics.totalProducts > 6 && (
          <button
            onClick={() => onNavigateToProducts?.(seller.id)}
            className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: styles.info as string }}
          >
            {t('seller.public.viewAll') || 'View all products'}
            <CaretRight size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => onNavigateToProduct?.(product.id)}
            className="rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md group"
            style={{
              backgroundColor: styles.bgSecondary as string,
              border: `1px solid ${styles.border}`,
            }}
          >
            {/* Product Image */}
            <div className="aspect-[4/3] overflow-hidden relative">
              <img
                src={product.imageUrl || defaultImage}
                alt={isRtl && product.nameAr ? product.nameAr : product.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Visibility Badge */}
              {product.status === 'rfq_only' && (
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: '#f59e0b',
                    color: '#fff',
                  }}
                >
                  RFQ Only
                </span>
              )}
            </div>
            {/* Product Info */}
            <div className="p-3">
              <h3
                className="font-medium text-sm line-clamp-2 mb-2"
                style={{ color: styles.textPrimary as string }}
              >
                {isRtl && product.nameAr ? product.nameAr : product.name}
              </h3>
              <div className="flex items-center justify-between">
                <div className="font-bold" style={{ color: styles.info as string }}>
                  {product.currency} {product.price.toLocaleString()}
                </div>
                <div className="text-xs" style={{ color: styles.textMuted as string }}>
                  MOQ: {product.moq}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Buyer Actions
// =============================================================================
interface BuyerActionsProps {
  seller: PublicSellerProfile;
  isSaved: boolean;
  onRequestRFQ: () => void;
  onContactSeller: () => void;
  onSaveSeller: () => void;
  styles: Record<string, unknown>;
  t: (key: string) => string;
}

const BuyerActions: React.FC<BuyerActionsProps> = ({
  seller,
  isSaved,
  onRequestRFQ,
  onContactSeller,
  onSaveSeller,
  styles,
  t,
}) => {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: styles.bgCard as string,
        border: `1px solid ${styles.border}`,
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          color: styles.textPrimary as string,
          fontFamily: styles.fontHeading as string,
        }}
      >
        {t('seller.public.getInTouch') || 'Get in Touch'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Request RFQ - Primary */}
        <button
          onClick={onRequestRFQ}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: styles.info as string, color: '#fff' }}
        >
          <FileText size={20} weight="fill" />
          <span>{t('seller.public.requestRFQ') || 'Request RFQ'}</span>
        </button>

        {/* Contact Seller */}
        <button
          onClick={onContactSeller}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: styles.bgSecondary as string,
            color: styles.textPrimary as string,
            border: `1px solid ${styles.border}`,
          }}
        >
          <EnvelopeSimple size={20} />
          <span>{t('seller.public.contactSeller') || 'Contact Seller'}</span>
        </button>

        {/* Save Seller */}
        <button
          onClick={onSaveSeller}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: isSaved ? '#ef444415' : styles.bgSecondary as string,
            color: isSaved ? '#ef4444' : styles.textPrimary as string,
            border: `1px solid ${isSaved ? '#ef444440' : styles.border}`,
          }}
        >
          <Heart size={20} weight={isSaved ? 'fill' : 'regular'} />
          <span>{isSaved ? (t('seller.public.saved') || 'Saved') : (t('seller.public.saveSeller') || 'Save Seller')}</span>
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// Contact Seller Modal
// =============================================================================
interface ContactSellerModalProps {
  seller: PublicSellerProfile;
  onClose: () => void;
  styles: Record<string, unknown>;
  t: (key: string) => string;
  isRtl: boolean;
}

const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  seller,
  onClose,
  styles,
  t,
  isRtl,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await publicSellerService.contactSeller(seller.id, message);
      setSent(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-md rounded-xl shadow-xl"
        style={{ backgroundColor: styles.bgCard as string }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: styles.border as string }}
        >
          <h3
            className="text-lg font-semibold"
            style={{
              color: styles.textPrimary as string,
              fontFamily: styles.fontHeading as string,
            }}
          >
            {t('seller.public.contactTitle') || 'Contact'} {seller.displayName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: styles.textMuted as string }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        {sent ? (
          <div className="p-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#22c55e15' }}
            >
              <CheckCircle size={32} weight="fill" style={{ color: '#22c55e' }} />
            </div>
            <h4
              className="font-semibold mb-2"
              style={{ color: styles.textPrimary as string }}
            >
              {t('seller.public.messageSent') || 'Message Sent!'}
            </h4>
            <p className="text-sm" style={{ color: styles.textSecondary as string }}>
              {t('seller.public.messageSentDesc') || 'The seller will respond to your inquiry soon.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: styles.textSecondary as string }}
              >
                {t('seller.public.yourMessage') || 'Your Message'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('seller.public.messagePlaceholder') || 'Hi, I have a question about your products...'}
                rows={5}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                style={{
                  backgroundColor: styles.bgSecondary as string,
                  border: `1px solid ${styles.border}`,
                  color: styles.textPrimary as string,
                }}
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: styles.bgSecondary as string,
                  color: styles.textSecondary as string,
                  border: `1px solid ${styles.border}`,
                }}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: styles.info as string, color: '#fff' }}
              >
                {sending ? (
                  <SpinnerGap size={18} className="animate-spin" />
                ) : (
                  <EnvelopeSimple size={18} />
                )}
                <span>{t('seller.public.sendMessage') || 'Send Message'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SellerPublicProfile;
